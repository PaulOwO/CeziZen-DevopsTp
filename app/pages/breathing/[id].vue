<script setup lang="ts">
import { calculateTotalDuration, formatDuration } from '~/utils/helpers'
const route = useRoute()
const { data: preset } = await useFetch(`/api/breathing/${route.params.id}`)

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'done'

const phase = ref<Phase>('idle')
const currentCycle = ref(0)
const timeLeft = ref(0)
const isRunning = ref(false)

const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'inhale':
      return 'Inspirez'
    case 'hold':
      return 'Retenez'
    case 'exhale':
      return 'Expirez'
    case 'done':
      return 'Terminé !'
    default:
      return 'Prêt ?'
  }
})

const totalDuration = computed(() => {
  if (!preset.value) return '00:00'
  return formatDuration(
    calculateTotalDuration(
      preset.value.inhaleDuration,
      preset.value.holdDuration,
      preset.value.exhaleDuration,
      preset.value.cycles
    )
  )
})

const circleSize = computed(() => {
  switch (phase.value) {
    case 'inhale':
      return '200px'
    case 'hold':
      return '200px'
    case 'exhale':
      return '80px'
    default:
      return '120px'
  }
})

const circleColor = computed(() => {
  switch (phase.value) {
    case 'inhale':
      return '#0063CB'
    case 'hold':
      return '#000091'
    case 'exhale':
      return '#8585F6'
    default:
      return '#E3E3FD'
  }
})

let stopRequested = false

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = ms / 1000
    timeLeft.value = remaining

    const interval = setInterval(() => {
      if (stopRequested) {
        clearInterval(interval)
        resolve()
        return
      }
      remaining -= 0.1
      timeLeft.value = Math.ceil(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
}

async function startExercise() {
  if (!preset.value) return

  stopRequested = false
  isRunning.value = true
  currentCycle.value = 0
  phase.value = 'idle'

  for (let i = 0; i < preset.value.cycles; i++) {
    if (stopRequested) break
    currentCycle.value = i + 1

    // Inspiration
    phase.value = 'inhale'
    await sleep(preset.value.inhaleDuration * 1000)
    if (stopRequested) break

    // Pause (si > 0)
    if (preset.value.holdDuration > 0) {
      phase.value = 'hold'
      await sleep(preset.value.holdDuration * 1000)
      if (stopRequested) break
    }

    // Expiration
    phase.value = 'exhale'
    await sleep(preset.value.exhaleDuration * 1000)
    if (stopRequested) break
  }

  if (!stopRequested) {
    phase.value = 'done'
  } else {
    phase.value = 'idle'
  }
  isRunning.value = false
}

function stopExercise() {
  stopRequested = true
  phase.value = 'idle'
  isRunning.value = false
  currentCycle.value = 0
  timeLeft.value = 0
}
</script>

<template>
  <div class="fr-container fr-my-6w">
    <DsfrBreadcrumb
      :links="[
        { text: 'Accueil', to: '/home' },
        { text: 'Exercices de respiration', to: '/breathing' },
        { text: preset?.name ?? '' },
      ]"
    />

    <h1>{{ preset?.name }}</h1>
    <p v-if="preset?.description">{{ preset.description }}</p>

    <!-- Cercle animé -->
    <div class="fr-my-6w" style="display: flex; flex-direction: column; align-items: center">
      <div
        :style="{
          width: circleSize,
          height: circleSize,
          backgroundColor: circleColor,
          borderRadius: '50%',
          transition: 'all 1s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <span style="color: white; font-size: 1.5rem; font-weight: bold">
          {{ timeLeft > 0 ? timeLeft : '' }}
        </span>
      </div>

      <p class="fr-mt-4w" style="font-size: 1.5rem; font-weight: bold">
        {{ phaseLabel }}
      </p>

      <p v-if="isRunning" class="fr-text--sm">Cycle {{ currentCycle }} / {{ preset?.cycles }}</p>
    </div>

    <!-- Boutons -->
    <div style="display: flex; justify-content: center; gap: 1rem">
      <DsfrButton v-if="!isRunning && phase !== 'done'" label="Commencer" @click="startExercise" />
      <DsfrButton v-if="isRunning" label="Arrêter" secondary @click="stopExercise" />
      <DsfrButton v-if="phase === 'done'" label="Recommencer" @click="startExercise" />
      <DsfrButton label="Retour" secondary @click="navigateTo('/breathing')" />
    </div>
    <p class="fr-text--sm" style="display: flex; justify-content: center; gap: 1rem">
      Durée totale : {{ totalDuration }}
    </p>
  </div>
</template>
