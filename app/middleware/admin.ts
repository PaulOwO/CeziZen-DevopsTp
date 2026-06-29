export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/auth/login')
  }

  if (user.value?.role !== 'ADMIN') {
    return navigateTo('/home')
  }
})