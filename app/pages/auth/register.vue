<script setup lang="ts">
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
})

const error = ref('')
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: form,
    })

    // Redirection vers la page de connexion après inscription
    await navigateTo('/auth/login')

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

        <h1>Créer un compte</h1>

        <!-- Message d'erreur -->
        <DsfrAlert
          v-if="error"
          type="error"
          :title="error"
          class="fr-mb-3w"
        />

        <!-- Formulaire -->
        <DsfrInputGroup>
          <DsfrInput
            data-e2e="first-name-input"
            v-model="form.firstName"
            label="Prénom"
            label-visible
            placeholder="Jean"
          />
        </DsfrInputGroup>

        <DsfrInputGroup>
          <DsfrInput
          data-e2e="last-name-input"
            v-model="form.lastName"
            label="Nom"
            label-visible
            placeholder="Dupont"
          />
        </DsfrInputGroup>

        <DsfrInputGroup>
          <DsfrInput
            v-model="form.email"
            data-e2e="email-input"
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
          data-e2e="register-button"
          label="S'inscrire"
          :disabled="loading"
          @click="handleRegister"
        />

        <p class="fr-mt-3w">
          Déjà un compte ?
          <NuxtLink to="/auth/login" data-e2e="login-link">Se connecter</NuxtLink>
        </p>

      </div>
    </div>
  </div>
</template>