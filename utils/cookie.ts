/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NuxtApp } from "#app";

export const safeGetCookies =async (ctx?: NuxtApp) => {
    if (import.meta.client) {
        return document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
    } else {
        if(ctx) {
          return await  ctx.runWithContext(() => {
                const cookie = useRequestHeader('cookie')?? ''
                return cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
            })
        }
        const cookie = useRequestHeader('cookie') ?? ''
        return cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
    }
}
export const safeGetUserAgent = () => {
    if (import.meta.client) {
        return navigator.userAgent
    } else { 
        return useRequestHeader('User-Agent')?? '' 
    }
}

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
        if (!nameValue) {
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
    if (!ctx || !cookies || cookies.length === 0) {
        return;
    }

    await ctx?.runWithContext(() => {
        const parsedCookies = parseCookies(cookies)
        // logger.tag('saveCookies').debug(`runWithContext`, parsedCookies)
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