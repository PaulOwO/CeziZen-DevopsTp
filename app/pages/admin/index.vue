<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})
</script>

<template>
  <div class="fr-container fr-my-6w">
    <h1>Administration</h1>

    <div class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Pages</h3>
              <p class="fr-card__desc">Gérer les pages de contenu</p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Gérer" @click="navigateTo('/admin/pages')" />
            </div>
          </div>
        </div>
      </div>

      <div class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Utilisateurs</h3>
              <p class="fr-card__desc">Activer ou suspendre un compte utilisateur</p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Gérer" @click="navigateTo('/admin/users')" />
            </div>
          </div>
        </div>
      </div>

      <div class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Exercices de respiration</h3>
              <p class="fr-card__desc">Gérer les presets de respiration</p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Gérer" @click="navigateTo('/admin/breathing')" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>