<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const { data: presets, refresh } = await useFetch('/api/breathing/all')

const showForm = ref(false)
const editingPreset = ref<any>(null)

const form = reactive({
  name: '',
  description: '',
  inhaleDuration: 4,
  holdDuration: 0,
  exhaleDuration: 4,
  cycles: 5,
  isActive: true,
})

const error = ref('')
const loading = ref(false)

function openCreate() {
  editingPreset.value = null
  form.name = ''
  form.description = ''
  form.inhaleDuration = 4
  form.holdDuration = 0
  form.exhaleDuration = 4
  form.cycles = 5
  form.isActive = true
  showForm.value = true
}

function openEdit(preset: any) {
  editingPreset.value = preset
  form.name = preset.name
  form.description = preset.description ?? ''
  form.inhaleDuration = preset.inhaleDuration
  form.holdDuration = preset.holdDuration
  form.exhaleDuration = preset.exhaleDuration
  form.cycles = preset.cycles
  form.isActive = preset.isActive
  showForm.value = true
}

async function handleSubmit() {
  loading.value = true
  error.value = ''

  try {
    const payload = {
      name: form.name,
      description: form.description,
      inhaleDuration: Number(form.inhaleDuration),
      holdDuration: Number(form.holdDuration),
      exhaleDuration: Number(form.exhaleDuration),
      cycles: Number(form.cycles),
      isActive: form.isActive,
    }

    if (editingPreset.value) {
      await $fetch(`/api/breathing/${editingPreset.value.id}`, {
        method: 'PATCH' as any,
        body: payload,
      })
    } else {
      await $fetch('/api/breathing', {
        method: 'POST' as any,
        body: payload,
      })
    }

    showForm.value = false
    await refresh()

  } catch (e: any) {
    error.value = e.data?.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('Supprimer ce preset ?')) return
  await $fetch(`/api/breathing/${id}`, { method: 'DELETE' as any })
  await refresh()
}
</script>

<template>
  <div class="fr-container fr-my-6w">
    <div class="fr-grid-row fr-grid-row--middle fr-mb-4w">
      <div class="fr-col">
        <h1>Exercices de respiration</h1>
      </div>
      <div class="fr-col-auto">
        <DsfrButton label="Nouveau preset" @click="openCreate" />
      </div>
    </div>

    <!-- Formulaire -->
    <div v-if="showForm" class="fr-mb-4w">
      <h2>{{ editingPreset ? 'Modifier le preset' : 'Nouveau preset' }}</h2>

      <DsfrAlert v-if="error" type="error" :title="error" class="fr-mb-3w" />

      <DsfrInputGroup>
        <DsfrInput v-model="form.name" label="Nom" label-visible />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput v-model="form.description" label="Description" label-visible is-textarea />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput v-model="form.inhaleDuration" label="Durée inspiration (secondes)" label-visible type="number" />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput v-model="form.holdDuration" label="Durée pause (secondes)" label-visible type="number" />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput v-model="form.exhaleDuration" label="Durée expiration (secondes)" label-visible type="number" />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput v-model="form.cycles" label="Nombre de cycles" label-visible type="number" />
      </DsfrInputGroup>

      <div class="fr-mt-3w">
        <DsfrButton label="Enregistrer" :disabled="loading" @click="handleSubmit" />
        <DsfrButton label="Annuler" secondary class="fr-ml-2w" @click="showForm = false" />
      </div>
    </div>

    <!-- Liste des presets -->
    <table class="fr-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Inspiration</th>
          <th>Pause</th>
          <th>Expiration</th>
          <th>Cycles</th>
          <th>Actif</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="preset in presets" :key="preset.id">
          <td>{{ preset.name }}</td>
          <td>{{ preset.inhaleDuration }}s</td>
          <td>{{ preset.holdDuration }}s</td>
          <td>{{ preset.exhaleDuration }}s</td>
          <td>{{ preset.cycles }}</td>
          <td>{{ preset.isActive ? '✅' : '❌' }}</td>
          <td>
            <DsfrButton label="Modifier" secondary @click="openEdit(preset)" />
            <DsfrButton label="Supprimer" class="fr-ml-2w" @click="handleDelete(preset.id)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>