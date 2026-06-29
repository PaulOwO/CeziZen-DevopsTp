<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { data: pages } = await useFetch('/api/pages')
</script>

<template>
  <div class="fr-container fr-my-6w">
    <DsfrBreadcrumb
      :links="[
        { text: 'Accueil', to: '/' },
        { text: 'Informations' }
      ]"
    />

    <h1>Ressources bien-être</h1>
    <p class="fr-text--lead">
      Accédez à nos ressources sur la santé mentale et le bien-être
    </p>

    <div v-if="pages && pages.length > 0" class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div v-for="page in pages" :key="page.id" class="fr-col-12 fr-col-md-6">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">{{ page.title }}</h3>
              <p class="fr-card__desc">
                {{ page.content.substring(0, 150) }}{{ page.content.length > 150 ? '...' : '' }}
              </p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Lire la suite" @click="navigateTo(`/info/${page.slug}`)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="fr-alert fr-alert--info fr-mt-4w">
      <h3 class="fr-alert__title">Aucune ressource disponible</h3>
      <p>Les ressources seront bientôt disponibles.</p>
    </div>
  </div>
</template>
