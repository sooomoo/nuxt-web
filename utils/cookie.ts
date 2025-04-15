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
        if (!nameValue) {
            continue;
        }
        const cookieName = nameValue[0].trim();
        const cookieValue = nameValue[1].trim();
        const cookieOptions: Record<string, any> = {};
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
        console.log(`【saveCookies】runWithContext`, parsedCookies)
        parsedCookies.forEach(c => {
            const cooRef = useCookie(c.name, {
                maxAge: Number(c.options['max-age']),
                sameSite: c.options['same-site'] ?? 'lax',
                path: c.options.path ?? '/',
            })
            cooRef.value = null
            cooRef.value = c.value
        })
    })
}