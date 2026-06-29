<script setup lang="ts">
const form = reactive({
  email: '',
  password: '',
})

definePageMeta({
  middleware: () => {
    const { loggedIn } = useUserSession()
    if (loggedIn.value) {
      return navigateTo('/account')
    }
  }
})
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })

     window.location.href = '/home'

  } catch (e: any) {
    error.value = e.data?.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fr-container fr-my-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-md-6">

        <h1>Se connecter</h1>

        <DsfrAlert
          v-if="error"
          type="error"
          :title="error"
          class="fr-mb-3w"
        />

        <DsfrInputGroup>
          <DsfrInput
          data-e2e="email-input"
            v-model="form.email"
            label="Email"
            label-visible
            type="email"
            placeholder="jean.dupont@example.com"
          />
        </DsfrInputGroup>

        <DsfrInputGroup>
          <DsfrInput
            data-e2e="password-input"
            v-model="form.password"
            label="Mot de passe"
            label-visible
            type="password"
          />
        </DsfrInputGroup>

        <DsfrButton
          data-e2e="login-button"
          label="Se connecter"
          :disabled="loading"
          @click="handleLogin"
        />

        <p class="fr-mt-3w">
          Pas encore de compte ?
          <NuxtLink to="/auth/register">S'inscrire</NuxtLink>
        </p>

      </div>
    </div>
  </div>
</template>