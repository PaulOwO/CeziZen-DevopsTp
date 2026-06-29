<script setup lang="ts">
const { loggedIn, fetch: refreshSession } = useUserSession()

onMounted(async () => {
  await refreshSession()
})
</script>

<template>
  <div class="fr-container fr-my-6w">
    <h1>Bienvenue sur CESIZen</h1>
    <p>L'application de votre santé mentale</p>

    <div class="fr-mt-4w">
      <template v-if="loggedIn">
        <DsfrButton
          label="Mon compte"
          @click="navigateTo('/account')"
        />
      </template>
      <template v-else>
        <DsfrButton
          label="Se connecter"
          @click="navigateTo('/auth/login')"
        />
        <DsfrButton
          label="Créer un compte"
          secondary
          class="fr-ml-2w"
          @click="navigateTo('/auth/register')"
        />
      </template>
    </div>
  </div>
</template>