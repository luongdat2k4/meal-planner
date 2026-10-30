<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '../../../shared/assets'
import { t } from '../../../shared/i18n'
import ChipGroup from '../../../shared/ui/ChipGroup.vue'
import { DIETARY } from '../dietary'
import { ALLERGENS } from '../options'
import { usePreferences } from '../usePreferences'

const { state } = usePreferences()

const allergenOptions = computed(() => ALLERGENS.map((allergen) => ({ id: allergen.id, label: `${allergen.emoji} ${allergen.label}` })))

function toggleDiet(id: string) {
  state.dietaryIds = state.dietaryIds.includes(id) ? state.dietaryIds.filter((value) => value !== id) : [...state.dietaryIds, id]
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h3 class="mb-2 font-semibold">{{ t('preferences.fieldDiet.diet') }}</h3>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="diet in DIETARY"
          :key="diet.id"
          type="button"
          :aria-pressed="state.dietaryIds.includes(diet.id)"
          class="flex items-center gap-3 rounded-2xl p-3 text-left text-sm font-medium transition"
          :class="state.dietaryIds.includes(diet.id) ? 'bg-brand-soft ring-2 ring-brand' : 'bg-card shadow-card'"
          @click="toggleDiet(diet.id)"
        >
          <img :src="assetUrl(diet.icon)" alt="" class="h-9 w-9 object-contain" />
          {{ diet.name }}
        </button>
      </div>
    </div>

    <div>
      <h3 class="mb-2 font-semibold">{{ t('preferences.fieldDiet.allergy') }}</h3>
      <ChipGroup v-model="state.allergenIds" :options="allergenOptions" />
    </div>
  </div>
</template>
