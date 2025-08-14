/**
 * 进入登录页面时，看是否已经登录，
 * 如果已经登录，跳转到首页
 */
export default defineNuxtRouteMiddleware((to, _from) => {
    if (to.fullPath.toLowerCase().startsWith("/login")) {
        const authStore = useAuthStore();
        if (authStore.user) {
            // 已登录，跳转到首页
            return abortNavigation({
                name: "login_check",
                message: "已登录，跳转到首页",
            });
        }
    }
});
