import * as base64 from '@juanelas/base64'
import { equalBytes } from "@noble/ciphers/utils"
import { randomBytes } from '@noble/ciphers/webcrypto'
import { ed25519, x25519 } from "@noble/curves/ed25519"

export interface Signer {
    sign(data: Uint8Array): Uint8Array<ArrayBuffer>
    verify(data: Uint8Array, sign: Uint8Array): boolean
    signatureLen(): number
}

export interface Crypter {
    encrypt(data: Uint8Array): Uint8Array<ArrayBuffer>
    decrypt(data: Uint8Array): Uint8Array<ArrayBuffer>
}


export interface KeyPair {
    publicKey: Uint8Array
    privateKey: Uint8Array
}

// 生成一个新的加密密钥对
export const newBoxKeyPair = (): KeyPair => {
    const privateKey = x25519.utils.randomPrivateKey()
    const publicKey = x25519.getPublicKey(privateKey)
    return { publicKey, privateKey }
}

// 此处的公钥与私钥都是32位
export const newBoxKeyPairFromArray = (pub: Uint8Array, pri: Uint8Array): KeyPair => {
    return { publicKey: pub, privateKey: pri }
}

// 生成一个新的签名密钥对；如果私钥是64位，那么其后32位是公钥
export const newSignKeyPair = (): KeyPair => {
    const privateKey = ed25519.utils.randomPrivateKey()
    const publicKey = ed25519.getPublicKey(privateKey)
    return { publicKey, privateKey }
}

// 此处的公钥与私钥都是32位
export const newSignKeyPairFromArray = (pub: Uint8Array, pri: Uint8Array): KeyPair => {
    return { publicKey: pub, privateKey: pri }
}

export const generateUUID = () => {
    return crypto.randomUUID().replace(/-/g, '')
}

export const base64Encode = (input: ArrayBufferLike | base64.TypedArray | Buffer | string): string => {
    return base64.encode(input, true, false)
}

export const base64Decode = (input: string): Uint8Array => {
    return base64.decode(input)
}

export const encodeSecureString = (signKey: Uint8Array, boxKey: Uint8Array): string => {
    const randomBts = randomBytes(24)
    const arr = [...randomBts, ...signKey, ...boxKey]
    const all = new Uint8Array(arr)
    for (let index = 17; index < all.length; index++) {
        const element = all[index];
        all[index] = element ^ all[index % 17]
    }
    return base64Encode(all)
}

export const decodeSecureString = (str: string): {
    sign: Uint8Array | null
    box: Uint8Array | null
} => {
    if (!str || str.length <= 88) {
        return { sign: null, box: null }
    }
    const all = base64Decode(str)
    if (all.length != 88) {
        return { sign: null, box: null }
    }
    for (let index = 17; index < all.length; index++) {
        const element = all[index];
        all[index] = element ^ all[index % 17]
    }
    const signPubKeySecure = all.slice(24, 56)
    const boxPubKeySecure = all.slice(56)
    if (signPubKeySecure.length != 32 || boxPubKeySecure.length != 32) {
        return { sign: null, box: null }
    }

    return { sign: signPubKeySecure, box: boxPubKeySecure }
}

export const ensureSecurets = (): [KeyPair, KeyPair, string] => {
    const platform = useCookie(import.meta.env.VITE_COOKIE_PLATFORM_NAME)
    platform.value = '8'

    const sessionId = useCookie(import.meta.env.VITE_COOKIE_SK1_NAME)
    const clientKey = useCookie(import.meta.env.VITE_COOKIE_SK2_NAME)
    // console.log('sk is :', sessionId.value)
    // console.log('ck is :', clientKey.value)
    const pubKeys = decodeSecureString(sessionId.value || '')
    const priKeys = decodeSecureString(clientKey.value || '')
    if (!pubKeys.box || !pubKeys.sign || !priKeys.box || !priKeys.sign) {
        // 需要重新生成
        const boxKeyPair = newBoxKeyPair()
        const signKeyPair = newSignKeyPair()
        sessionId.value = encodeSecureString(signKeyPair.publicKey, boxKeyPair.publicKey)
        clientKey.value = encodeSecureString(signKeyPair.privateKey, boxKeyPair.privateKey)
        // console.log(`【decodeSecrets】new sign keypair `, signKeyPair)
        // console.log(`【decodeSecrets】new box keypair `, boxKeyPair)

        const pubKeys1 = decodeSecureString(sessionId.value)
        const priKeys1 = decodeSecureString(clientKey.value)
        // console.log('xxxxxx sign', pubKeys1.sign, priKeys1.sign)
        // console.log('xxxxxx box', pubKeys1.box, priKeys1.box)
        // console.log('sign pub key eq', equalBytes(pubKeys1.sign!, signKeyPair.publicKey))
        // console.log('box pub key eq', equalBytes(pubKeys1.box!, boxKeyPair.publicKey))
        // console.log('sign pri key eq', equalBytes(priKeys1.sign!, signKeyPair.privateKey))
        // console.log('box pri key eq', equalBytes(priKeys1.box!, boxKeyPair.privateKey))
        return [boxKeyPair, signKeyPair, sessionId.value || '']
    } else {
        const boxKeyPair = newBoxKeyPairFromArray(pubKeys.box!, priKeys.box!)
        const signKeyPair = newSignKeyPairFromArray(pubKeys.sign!, priKeys.sign!)
        // console.log(`[decodeSecrets] decode from cookie `, sessionId.value, clientKey.value, signKeyPair, boxKeyPair)
        return [boxKeyPair, signKeyPair, sessionId.value || '']
    }
}