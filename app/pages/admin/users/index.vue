<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const { data: users, refresh } = await useFetch('/api/users/all')
const loading = ref(false)
const error = ref('')

async function toggleActive(user: any) {
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/users/modify', {
      method: 'PATCH' as any,
      body: {
        id: user.id,
        isActive: !user.isActive
      }
    })
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors de la mise à jour'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fr-container fr-my-6w">
    <div class="fr-grid-row fr-grid-row--middle fr-mb-4w">
      <div class="fr-col">
        <h1>Utilisateurs</h1>
      </div>
    </div>

    <DsfrAlert v-if="error" type="error" :title="error" class="fr-mb-3w" />

    <table class="fr-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Nom</th>
          <th>Rôle</th>
          <th>Actif</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.isActive ? '✅' : '❌' }}</td>
          <td>
            <DsfrButton
              :label="user.isActive ? 'Suspendre' : 'Réactiver'"
              :disabled="loading"
              @click="toggleActive(user)"
            />
          </td> 
        </tr>
      </tbody>
    </table>
  </div>
</template>
