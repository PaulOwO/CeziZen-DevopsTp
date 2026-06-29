<script setup lang="ts">
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = false

  if (form.newPassword !== form.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/users/password', {
      method: 'PATCH',
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }
    })

    success.value = true
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''

  } catch (e: any) {
    error.value = e.data?.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2>Changer mon mot de passe</h2>

    <DsfrAlert
      v-if="error"
      type="error"
      :title="error"
      class="fr-mb-3w"
    />

    <DsfrAlert
      v-if="success"
      type="success"
      title="Mot de passe modifié avec succès !"
      class="fr-mb-3w"
    />

    <DsfrInputGroup>
      <DsfrInput
        v-model="form.currentPassword"
        label="Mot de passe actuel"
        label-visible
        type="password"
        data-e2e="current-password-input"
      />
    </DsfrInputGroup>

    <DsfrInputGroup>
      <DsfrInput
        v-model="form.newPassword"
        label="Nouveau mot de passe"
        label-visible
        type="password"
        data-e2e="new-password-input"
      />
    </DsfrInputGroup>

    <DsfrInputGroup>
      <DsfrInput
        v-model="form.confirmPassword"
        label="Confirmer le nouveau mot de passe"
        label-visible
        type="password"
        data-e2e="confirm-new-password-input"
      />
    </DsfrInputGroup>

    <DsfrButton
      label="Modifier mon mot de passe"
      :disabled="loading"
      @click="handleSubmit"
      data-e2e="modify-password-button"
    />
  </div>
</template>