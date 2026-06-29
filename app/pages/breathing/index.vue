<script setup lang="ts">
const { data: presets } = await useFetch('/api/breathing')
</script>

<template>
  <div class="fr-container fr-my-6w">
    <h1>Exercices de respiration</h1>
    <p class="fr-text--lead">Choisissez un exercice pour commencer</p>

    <div class="fr-grid-row fr-grid-row--gutters fr-mt-4w">
      <div
        v-for="preset in presets"
        :key="preset.id"
        class="fr-col-12 fr-col-md-4"
      >
        <div class="fr-card">
          <div class="fr-card__body">
            <div class="fr-card__content">
              <h3 class="fr-card__title">{{ preset.name }}</h3>
              <p class="fr-card__desc">{{ preset.description }}</p>
              <ul class="fr-mt-2w">
                <li>Inspiration : {{ preset.inhaleDuration }}s</li>
                <li v-if="preset.holdDuration > 0">Pause : {{ preset.holdDuration }}s</li>
                <li>Expiration : {{ preset.exhaleDuration }}s</li>
                <li>Cycles : {{ preset.cycles }}</li>
              </ul>
            </div>
            <div class="fr-card__footer">
              <DsfrButton
                label="Commencer"
                @click="navigateTo(`/breathing/${preset.id}`)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>