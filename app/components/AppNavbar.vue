<script setup lang="ts">
const { data: pages } = await useFetch('/api/pages')
const { loggedIn, user, fetch: refreshSession } = useUserSession()

onMounted(async () => {
  await refreshSession()
})

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' as any })
  window.location.href = '/'
}

const quickLinks = computed(() => {
  if (loggedIn.value) {
    return [
      {
        label: `${user.value?.firstName} ${user.value?.lastName}`,
        to: '/account',
        icon: 'ri-account-circle-line',
        'data-e2e': 'navbar-account-link',
      },
      {
        label: 'Se déconnecter',
        icon: 'ri-logout-box-line',
        button: true,
        onClick: async ($event: MouseEvent) => {
          $event.preventDefault()
          await $fetch('/api/auth/logout', { method: 'POST' as any })
          window.location.href = '/'
        },
        'data-e2e': 'navbar-logout-button',
      },
    ]
  }
  return [
    { label: 'Se connecter', to: '/auth/login', icon: 'ri-login-box-line', 'data-e2e': 'navbar-login-link' },
    { label: 'Créer un compte', to: '/auth/register', icon: 'ri-account-circle-line', 'data-e2e': 'navbar-register-link' },
  ]
})
</script>

<template>
  <DsfrHeader
    service-title="CESIZen"
    service-description="L'application de votre santé mentale"
    home-to="/home"
    :quick-links="quickLinks"
  >
    <template #mainnav>
      <DsfrNavigation
        :nav-items="[
          {
            title: 'Informations',
            links: pages?.map(page => ({
              text: page.title,
              to: `/info/${page.slug}`
            })) ?? []
          }
        ]"
      />
    </template>
  </DsfrHeader>
</template>