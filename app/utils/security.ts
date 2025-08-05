import type { Secrets } from "vuepkg";
import {
    decodeSecureString,
    encodeSecureString,
    logger,
    newBoxKeyPair,
    newBoxKeyPairFromArray,
    newSignKeyPair,
    newSignKeyPairFromArray,
} from "vuepkg";
/**
 * 获取会话密钥
 * @returns
 */
export const getSecuretsFromCookie = (cookies: string[]): Secrets | undefined => {
    logger.debug("getSecuretsFromCookie cookies are: \n", import.meta.env, cookies);
    const parsedCookies = parseCookies(cookies);
    const sessionId = parsedCookies.find((c) => c.name === import.meta.env.VITE_COOKIE_SK1_NAME)?.value ?? "";
    const clientKey = parsedCookies.find((c) => c.name === import.meta.env.VITE_COOKIE_SK2_NAME)?.value ?? "";
    const pubKeys = decodeSecureString(sessionId);
    const priKeys = decodeSecureString(clientKey);
    if (pubKeys.box && pubKeys.sign && priKeys.box && priKeys.sign) {
        const boxKeyPair = newBoxKeyPairFromArray(pubKeys.box!, priKeys.box!);
        const signKeyPair = newSignKeyPairFromArray(pubKeys.sign!, priKeys.sign!);
        return {
            boxKeyPair: boxKeyPair,
            signKeyPair: signKeyPair,
            sessionId: sessionId || "",
        };
    }
};

/**
 * Only called in session_init.server.ts
 * 确保在第一次请求时会话密钥已准备好
 * @returns
 */
export const ensureSecurets = (): Secrets => {
    const sessionId = useCookie(import.meta.env.VITE_COOKIE_SK1_NAME, {
        path: "/",
        sameSite: import.meta.dev ? "none" : "strict",
        secure: true,
    });
    const clientKey = useCookie(import.meta.env.VITE_COOKIE_SK2_NAME, {
        path: "/",
        sameSite: import.meta.dev ? "none" : "strict",
        secure: true,
    });
    const pubKeys = decodeSecureString(sessionId.value || "");
    const priKeys = decodeSecureString(clientKey.value || "");
    if (!pubKeys.box || !pubKeys.sign || !priKeys.box || !priKeys.sign) {
        // 需要重新生成
        const boxKeyPair = newBoxKeyPair();
        const signKeyPair = newSignKeyPair();
        sessionId.value = encodeSecureString(signKeyPair.publicKey, boxKeyPair.publicKey);
        clientKey.value = encodeSecureString(signKeyPair.privateKey, boxKeyPair.privateKey);
        return {
            boxKeyPair: boxKeyPair,
            signKeyPair: signKeyPair,
            sessionId: sessionId.value || "",
        };
    } else {
        const boxKeyPair = newBoxKeyPairFromArray(pubKeys.box!, priKeys.box!);
        const signKeyPair = newSignKeyPairFromArray(pubKeys.sign!, priKeys.sign!);
        return {
            boxKeyPair: boxKeyPair,
            signKeyPair: signKeyPair,
            sessionId: sessionId.value || "",
        };
    }
};
