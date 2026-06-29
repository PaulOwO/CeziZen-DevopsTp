<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { user } = useUserSession();
</script>

<template>
  <div class="fr-container fr-my-6w">
    <h1>Bonjour, {{ user?.firstName }} ! 👋</h1>
    <p class="fr-text--lead">Bienvenue sur CESIZen, votre espace bien-être.</p>

    <div class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Informations</h3>
              <p class="fr-card__desc">
                Accédez aux ressources sur la santé mentale
              </p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Découvrir" @click="navigateTo('/info')" />
            </div>
          </div>
        </div>
      </div>

      <div class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Exercices de respiration</h3>
              <p class="fr-card__desc">
                Gérez votre stress avec des exercices guidés
              </p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Commencer" @click="navigateTo('/breathing')" />
            </div>
          </div>
        </div>
      </div>

      <div class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Mon compte</h3>
              <p class="fr-card__desc">Gérez vos informations personnelles</p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Accéder" @click="navigateTo('/account')" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="user?.role === 'ADMIN'" class="fr-col-12 fr-col-md-4">
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">Admin</h3>
              <p class="fr-card__desc">Gérez l'application</p>
            </div>
            <div class="fr-card__footer">
              <DsfrButton label="Accéder" @click="navigateTo('/admin')" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
