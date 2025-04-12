
import { utf8ToBytes } from '@noble/ciphers/utils';
import { ed25519 } from '@noble/curves/ed25519';

/**
 * 对数据进行签名
 * @param kp 密钥对
 * @param data 待签名的数据
 * @returns 签名
 */
export const useSignData = (kp: KeyPair, data: string): string => {
    const rawData = utf8ToBytes(data)
    const out = ed25519.sign(rawData, kp.privateKey)
    return base64Encode(out)
}

/**
 * 验证数据的签名
 * @param data 待验证的数据
 * @param signature 签名
 * @returns 验证结果
 */
export const useSignVerify = (data: string, signature: string) => {
    const rawData = utf8ToBytes(data)
    const sigData = base64Decode(signature)
    const serverSignPubKey = base64Decode(import.meta.env.VITE_SERVER_SIGN_PUB_KEY)
    return ed25519.verify(sigData, rawData, serverSignPubKey)
}