<script setup lang="ts">
const route = useRoute()
const { data: page, error } = await useFetch(`/api/pages/${route.params.slug}`)

if (error.value) {
  throw createError({ statusCode: 404, message: 'Page introuvable' })
}
</script>

<template>
  <div class="fr-container fr-my-6w">
    <DsfrBreadcrumb
      :links="[
        { text: 'Accueil', to: '/' },
        { text: 'Informations' },
        { text: page?.title ?? '' }
      ]"
    />

    <h1>{{ page?.title }}</h1>
    <div class="fr-text" style="white-space: pre-wrap; word-wrap: break-word;">{{ page?.content }}</div>
  </div>
</template>