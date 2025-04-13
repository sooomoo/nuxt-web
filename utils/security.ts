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