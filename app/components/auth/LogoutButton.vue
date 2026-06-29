<script setup lang="ts">
async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/auth/login'
}
</script>

<template>
  <DsfrButton
    label="Se déconnecter"
    @click="handleLogout"
  />
</template>