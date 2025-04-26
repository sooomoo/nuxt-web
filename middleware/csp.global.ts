// middleware/csp.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
    // const cspHeader =
    //     "default-src 'none'; " +
    //     // "script-src 'self' 'strict-dynamic' 'unsafe-inline'; " +
    //     "script-src 'self' 'unsafe-inline'; " +
    //     "style-src 'self' 'unsafe-inline'; " +
    //     "img-src 'self' data:; " +
    //     "connect-src 'self' 'http://localhost:8001'; " +
    //     "font-src 'self'; " +
    //     "object-src 'none'; " +
    //     "base-uri 'self'; " +
    //     "frame-ancestors 'none'; " +
    //     "form-action 'self'; " +
    //     "block-all-mixed-content; " +
    //     "upgrade-insecure-requests; ";// +
    //     // "report-uri /csp-report;";

    // const csp = useResponseHeader('Content-Security-Policy');
    // csp.value = cspHeader;
});