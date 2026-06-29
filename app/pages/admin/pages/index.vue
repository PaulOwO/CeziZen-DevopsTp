<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

import { generateSlug } from '~/utils/helpers'
const { data: pages, refresh } = await useFetch('/api/pages/all')

const showForm = ref(false)
const editingPage = ref<any>(null)

const form = reactive({
  title: '',
  slug: '',
  content: '',
  isVisible: true,
})

function openCreate() {
  editingPage.value = null
  form.title = ''
  form.slug = ''
  form.content = ''
  form.isVisible = true
  showForm.value = true
}

function openEdit(page: any) {
  editingPage.value = page
  form.title = page.title
  form.slug = page.slug
  form.content = page.content
  form.isVisible = page.isVisible
  showForm.value = true
}

const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = ''

  try {
    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      isVisible: form.isVisible,
    }

    if (editingPage.value) {
      await $fetch(`/api/pages/${editingPage.value.slug}`, {
        method: 'PATCH' as any,
        body: payload,
      })
    } else {
      await $fetch('/api/pages', {
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

async function handleDelete(slug: string) {
  if (!confirm('Supprimer cette page ?')) return

 await $fetch(`/api/pages/${slug}`, { method: 'DELETE' as any })
  await refresh()
}
</script>

<template>
  <div class="fr-container fr-my-6w">
    <div class="fr-grid-row fr-grid-row--middle fr-mb-4w">
      <div class="fr-col">
        <h1>Gestion des pages</h1>
      </div>
      <div class="fr-col-auto">
        <DsfrButton label="Nouvelle page" @click="openCreate" />
      </div>
    </div>

    <!-- Formulaire création/édition -->
    <div v-if="showForm" class="fr-mb-4w">
      <h2>{{ editingPage ? 'Modifier la page' : 'Nouvelle page' }}</h2>

      <DsfrAlert v-if="error" type="error" :title="error" class="fr-mb-3w" />

      <DsfrInputGroup>
        <DsfrInput
          v-model="form.title"
          label="Titre"
          label-visible
          @update:model-value="generateSlug"
        />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput
          v-model="form.slug"
          label="Slug (URL)"
          label-visible
        />
      </DsfrInputGroup>

      <DsfrInputGroup>
        <DsfrInput
          v-model="form.content"
          label="Contenu"
          label-visible
          is-textarea
        />
      </DsfrInputGroup>

      <div class="fr-mt-3w">
        <DsfrButton label="Enregistrer" :disabled="loading" @click="handleSubmit" />
        <DsfrButton label="Annuler" secondary class="fr-ml-2w" @click="showForm = false" />
      </div>
    </div>

    <!-- Liste des pages -->
    <table class="fr-table">
      <thead>
        <tr>
          <th>Titre</th>
          <th>Slug</th>
          <th>Visible</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="page in pages" :key="page.slug">
          <td>{{ page.title }}</td>
          <td>{{ page.slug }}</td>
          <td>{{ page.isVisible ? '✅' : '❌' }}</td>
          <td>
            <DsfrButton label="Modifier" secondary @click="openEdit(page)" />
            <DsfrButton label="Supprimer" class="fr-ml-2w" @click="handleDelete(page.slug)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>