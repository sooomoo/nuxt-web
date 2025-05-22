import { gcm } from "@noble/ciphers/aes";
import { bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils";
import { randomBytes } from "@noble/ciphers/webcrypto";
import { x25519 } from "@noble/curves/ed25519";

/**
 * 加密数据
 * @param key 密钥对
 * @param data 待加密的数据
 * @returns 加密后的数据
 */
export const useEncrypt = (key: KeyPair, data: string): string => {
    const serverExPubKey = base64Decode(import.meta.env.VITE_SERVER_EX_PUB_KEY);
    const shareKey = x25519.getSharedSecret(key.privateKey, serverExPubKey);
    const rawData = utf8ToBytes(data);
    const nonce = randomBytes(12);
    const aes = gcm(shareKey, nonce);
    const res = aes.encrypt(rawData);
    // log.debug(`【encryptData】secret is`, shareKey)
    // log.debug(`【encryptData】nonce is`, nonce)
    // log.debug(`【encryptData】result is`, res)
    return base64Encode(new Uint8Array([...nonce, ...res]));
};

/**
 * 解密数据
 * @param key 密钥对
 * @param data 待解密的数据
 * @returns 解密后的数据
 */
export const useDecrypt = (key: KeyPair, data: string): string => {
    const serverExPubKey = base64Decode(import.meta.env.VITE_SERVER_EX_PUB_KEY);
    const shareKey = x25519.getSharedSecret(key.privateKey, serverExPubKey);
    const rawData = base64Decode(data);
    const nonce = rawData.slice(0, 12);
    const body = rawData.slice(12);
    // log.debug(`【decryptData】secret is`, shareKey)
    // log.debug(`【decryptData】rawData is`, rawData)
    // log.debug(`【decryptData】nonce is`, nonce)
    // log.debug(`【decryptData】body is`, body)
    const aes = gcm(shareKey, nonce);
    const decrypted = aes.decrypt(body);
    if (!decrypted) {
        return "";
    }
    return bytesToUtf8(decrypted);
};
