<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { formatAmount, formatMinutes, formatVnd } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import StarRating from '../../shared/ui/StarRating.vue'
import Stepper from '../../shared/ui/Stepper.vue'
import ToggleSwitch from '../../shared/ui/ToggleSwitch.vue'
import { DAY_NAMES, usePlanner } from '../planner'
import { ALLERGENS, DIET_LABELS, usePreferences } from '../preferences'
import { useShopping } from '../shopping'
import { mealCategories } from './categories'
import IngredientList from './components/IngredientList.vue'
import MacroCards from './components/MacroCards.vue'
import StepList from './components/StepList.vue'
import { getMeal } from './meals'
import { METHOD_LABELS, getRecipe } from './recipe'
import type { CookMethod, RecipeIngredient } from './types'
import { useFavorites } from './useFavorites'
import { useMealActivity } from './useMealActivity'

const props = defineProps<{ id: string }>()

const { addMealToDay } = usePlanner()
const { addShoppingItem, addManyShoppingItems } = useShopping()
const { state: prefs } = usePreferences()
const { isFavorite, toggleFavorite } = useFavorites()
const activity = useMealActivity()

const meal = computed(() => getMeal(props.id) ?? null)
const recipe = computed(() => getRecipe(props.id))
const categories = computed(() => mealCategories(props.id))

const servings = ref(prefs.householdSize)
const method = ref('')
const selectedDay = ref(String((new Date().getDay() + 6) % 7))
const addedDay = ref<number | null>(null)

const scale = computed(() => (recipe.value ? servings.value / recipe.value.baseServings : 1))
const methodOptions = computed(() => (recipe.value?.methods ?? []).map((m) => ({ id: m, label: METHOD_LABELS[m] })))
const steps = computed(() => recipe.value?.steps[method.value as CookMethod] ?? [])
const dayOptions = DAY_NAMES.map((name, index) => ({ id: String(index), label: name }))
const allergenLabels = computed(() =>
  (recipe.value?.allergens ?? []).map((id) => ALLERGENS.find((a) => a.id === id)?.label ?? id).join(', '),
)

const rating = computed({
  get: () => activity.state.ratings[props.id] ?? 0,
  set: (value: number) => activity.setRating(props.id, value),
})
const note = computed({
  get: () => activity.state.notes[props.id] ?? '',
  set: (value: string) => activity.setNote(props.id, value),
})
const disliked = computed({
  get: () => activity.isDisliked(props.id),
  set: () => activity.toggleDisliked(props.id),
})

// Reset per-meal screen state when the route switches to another meal.
watch(
  () => props.id,
  (id) => {
    activity.markViewed(id)
    servings.value = prefs.householdSize
    method.value = getRecipe(id)?.methods[0] ?? ''
    addedDay.value = null
  },
  { immediate: true },
)

const labelFor = (item: RecipeIngredient) => `${item.name} · ${formatAmount(item.amount * scale.value, item.unit)}`

function addIngredient(item: RecipeIngredient) {
  addShoppingItem(labelFor(item))
  showToast(`Đã thêm ${item.name} vào danh sách đi chợ`)
}

function addAllIngredients() {
  if (!recipe.value) return
  const added = addManyShoppingItems(recipe.value.ingredients.map(labelFor))
  showToast(added ? `Đã thêm ${added} nguyên liệu vào danh sách đi chợ` : 'Các nguyên liệu này đã có trong danh sách')
}

function addToPlan() {
  if (!meal.value) return
  const day = Number(selectedDay.value)
  addMealToDay(day, meal.value.id)
  addedDay.value = day
}
</script>

<template>
  <section v-if="meal && recipe" class="pb-36">
    <div class="relative">
      <img :src="assetUrl(meal.image)" :alt="meal.title" class="h-80 w-full object-cover" />
      <RouterLink
        :to="{ name: 'meals' }"
        class="absolute left-4 top-[max(env(safe-area-inset-top),1rem)] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
        aria-label="Quay lại"
      >
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <button
        type="button"
        class="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
        :class="isFavorite(meal.id) ? 'text-brand' : 'text-gray-500'"
        :aria-label="isFavorite(meal.id) ? 'Bỏ yêu thích' : 'Yêu thích'"
        :aria-pressed="isFavorite(meal.id)"
        @click="toggleFavorite(meal.id)"
      >
        <Icon :icon="isFavorite(meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-2xl" />
      </button>
    </div>

    <div class="relative -mt-8 space-y-6 rounded-t-[32px] bg-surface px-5 pt-6">
      <div>
        <h1 class="text-2xl font-bold leading-snug">{{ meal.title }}</h1>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li v-for="category in categories" :key="category.id" class="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {{ category.emoji }} {{ category.label }}
          </li>
          <li v-for="id in recipe.dietary" :key="id" class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            ✓ {{ DIET_LABELS[id] ?? id }}
          </li>
        </ul>
        <p v-if="allergenLabels" class="mt-2 text-xs text-amber-700">⚠️ Có thể chứa: {{ allergenLabels }}</p>
      </div>

      <p class="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
        Công thức, dinh dưỡng và nguyên liệu bên dưới là dữ liệu mẫu để thiết kế giao diện, chưa phải dữ liệu thật.
      </p>

      <div class="grid grid-cols-3 gap-2">
        <div class="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-3 text-center shadow-card">
          <Icon :icon="ICONS.clockOutline" class="text-2xl text-brand" />
          <span class="text-sm font-bold">{{ formatMinutes(recipe.prepMinutes + recipe.cookMinutes) }}</span>
          <span class="text-[11px] text-gray-500">Tổng thời gian</span>
        </div>
        <div class="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-3 text-center shadow-card">
          <Stepper v-model="servings" :min="1" :max="12" />
          <span class="text-[11px] text-gray-500">Khẩu phần</span>
        </div>
        <div class="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-3 text-center shadow-card">
          <Icon :icon="ICONS.cashMultiple" class="text-2xl text-brand" />
          <span class="text-sm font-bold">{{ formatVnd(recipe.pricePerServing * servings) }}</span>
          <span class="text-[11px] text-gray-500">Chi phí ước tính</span>
        </div>
      </div>

      <section class="space-y-3">
        <h2 class="font-bold">Dinh dưỡng mỗi khẩu phần</h2>
        <MacroCards :macros="recipe.macros" />
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-bold">Nguyên liệu</h2>
          <button type="button" class="flex items-center gap-1 text-sm font-semibold text-brand" @click="addAllIngredients">
            <Icon :icon="ICONS.cart" class="text-lg" /> Thêm tất cả
          </button>
        </div>
        <IngredientList :items="recipe.ingredients" :scale="scale" @add="addIngredient" />
      </section>

      <section class="space-y-2">
        <h2 class="font-bold">Cách nấu</h2>
        <ChipTabs v-model="method" :options="methodOptions" />
        <StepList :steps="steps" />
      </section>

      <section class="space-y-4 rounded-3xl bg-white p-5 shadow-card">
        <h2 class="font-bold">Của bạn</h2>

        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
          :class="activity.isCooked(meal.id) ? 'bg-brand text-white' : 'bg-brand-soft text-brand'"
          :aria-pressed="activity.isCooked(meal.id)"
          @click="activity.toggleCooked(meal.id)"
        >
          <Icon :icon="ICONS.checkCircle" class="text-xl" />
          {{ activity.isCooked(meal.id) ? 'Đã nấu món này' : 'Đánh dấu đã nấu' }}
        </button>

        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-semibold">Đánh giá</span>
          <StarRating v-model="rating" />
        </div>

        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold">Không thích món này</p>
            <p class="text-xs text-gray-500">Sẽ không được gợi ý trong kế hoạch tự động.</p>
          </div>
          <ToggleSwitch v-model="disliked" label="Không thích món này" />
        </div>

        <label class="block">
          <span class="mb-1 block text-sm font-semibold">Ghi chú</span>
          <textarea
            v-model="note"
            rows="3"
            placeholder="Ví dụ: giảm cay, thêm hành lá..."
            class="w-full resize-none rounded-2xl bg-surface p-3 text-sm outline-none ring-1 ring-transparent focus:ring-brand/40"
          />
        </label>
      </section>

      <section>
        <h2 class="mb-1 font-bold">Thêm vào kế hoạch</h2>
        <ChipTabs v-model="selectedDay" :options="dayOptions" />
        <p v-if="addedDay !== null" class="mt-2 flex items-center gap-2 rounded-2xl bg-brand-soft p-3 text-sm text-brand">
          <Icon :icon="ICONS.check" class="text-lg" />
          <span>
            Đã thêm vào {{ DAY_NAMES[addedDay] }}.
            <RouterLink :to="{ name: 'planner' }" class="font-semibold underline">Xem kế hoạch</RouterLink>
          </span>
        </p>
      </section>
    </div>

    <div class="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl bg-gradient-to-t from-surface via-surface to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-8">
      <button
        type="button"
        class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
        @click="addToPlan"
      >
        Thêm vào {{ DAY_NAMES[Number(selectedDay)] }}
      </button>
    </div>
  </section>

  <section v-else class="px-5 py-16 text-center text-gray-500">
    Không tìm thấy món này.
    <RouterLink :to="{ name: 'meals' }" class="font-semibold text-brand">Về danh sách món</RouterLink>
  </section>
</template>
