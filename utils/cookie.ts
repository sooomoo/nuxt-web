/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NuxtApp } from "#app";

export const parseCookies = (cookies: string[] | undefined): {
    name: string;
    value: string;
    options: Record<string, any>;
}[] => {
    if (!cookies || cookies.length === 0) {
        return [];
    }
    const parsedCookies = [];
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const parts = cookie.split(';');
        const nameValue = parts.shift()?.split('=');
        if (!nameValue || nameValue.length !== 2) {
            continue;
        }
        const cookieName = nameValue[0].trim();
        const cookieValue = nameValue[1].trim();
        const cookieOptions: Record<string, unknown> = {};
        parts.forEach((part) => {
            const [key, value] = part.split('=');
            if (key) {
                cookieOptions[key.trim().toLowerCase()] = value ? value.trim() : true;
            }
        });

        parsedCookies.push({
            name: cookieName,
            value: cookieValue,
            options: cookieOptions
        });
    }

    return parsedCookies;
}

export const saveCookies = async (ctx?: NuxtApp, cookies?: string[]) => { 
    if (!ctx || !cookies || cookies.length === 0 || import.meta.client) {
        return;
    }

    ctx.ssrContext?.event.node.res.setHeader('Set-Cookie', cookies)
    const parsedCookies = parseCookies(cookies)
    //  logger.tag('saveCookies').debug(`runWithContext`, parsedCookies)
    await ctx.runWithContext(() => {
        parsedCookies.forEach(c => {
            const cooRef = useCookie(c.name, {
                maxAge: Number(c.options['max-age'] ?? '0'),
                sameSite: c.options['samesite'],
                path: c.options.path ?? '/',
                httpOnly: c.options['httponly'],
                secure: c.options['secure'],
            })
            cooRef.value = undefined
            cooRef.value = c.value
        })
    })
}