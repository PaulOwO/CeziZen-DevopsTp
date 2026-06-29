<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user } = useUserSession()
</script>

<template>
  <div class="fr-container fr-my-6w">
    <h1>Mon compte</h1>
    <p>Bienvenue, {{ user?.firstName }} {{ user?.lastName }} !</p>
    <p>Email : {{ user?.email }}</p>

    <hr class="fr-my-4w" />

    <AccountChangePassword />

    <hr class="fr-my-4w" />

    <AuthLogoutButton />
  </div>
</template>