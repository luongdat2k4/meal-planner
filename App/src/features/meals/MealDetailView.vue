<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { formatMinutes, formatVnd } from '../../shared/format'
import { ICONS } from '../../shared/icons'
import { showToast } from '../../shared/toast'
import ChipTabs from '../../shared/ui/ChipTabs.vue'
import StarRating from '../../shared/ui/StarRating.vue'
import Stepper from '../../shared/ui/Stepper.vue'
import ToggleSwitch from '../../shared/ui/ToggleSwitch.vue'
import { DAY_NAMES, usePlanner } from '../planner'
import { text } from '../../backend/catalogText'
import { usePreferences } from '../preferences'
import { useShopping } from '../shopping'
import { listIngredients } from '../../backend/catalog'
import { mealCategories, methodLabel } from './categories'
import IngredientList from './components/IngredientList.vue'
import MacroCards from './components/MacroCards.vue'
import StepList from './components/StepList.vue'
import { getMeal } from './meals'
import { getLevel, getRecipe } from './recipe'
import type { CookMethod, RecipeIngredient } from './types'
import { useFavorites } from './useFavorites'
import { useMealActivity } from './useMealActivity'

const props = defineProps<{ id: string }>()

const { addMealToDay } = usePlanner()
const { addIngredientItem, addIngredientItems } = useShopping()
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
const methodOptions = computed(() => (recipe.value?.methods ?? []).map((m) => ({ id: m, label: methodLabel(m) })))
const steps = computed(() => recipe.value?.steps[method.value as CookMethod] ?? [])
const dayOptions = DAY_NAMES.map((name, index) => ({ id: String(index), label: name }))
const level = computed(() => (recipe.value ? getLevel(recipe.value) : ''))
const allergenLabels = computed(() =>
  (recipe.value?.allergens ?? []).map((id) => text(id)).join(', '),
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

const pantry = new Set(listIngredients().filter((i) => i.isPantry).map((i) => i.slug))
const isPantry = (item: RecipeIngredient) => pantry.has(item.ingredientId)
const lineOf = (item: RecipeIngredient) => ({ ingredientSlug: item.ingredientId, quantity: item.amount * scale.value, unit: item.unit })

function addIngredient(item: RecipeIngredient) {
  const added = addIngredientItem(item.ingredientId, item.amount * scale.value, item.unit)
  showToast(added ? `Đã thêm ${item.name} vào danh sách đi chợ` : `${item.name} đã có trong danh sách`)
}

function addAllIngredients() {
  if (!recipe.value) return
  const added = addIngredientItems(recipe.value.ingredients.filter((item) => !isPantry(item)).map(lineOf))
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
  <section v-if="meal && recipe" class="px-5 pb-40 pt-[max(env(safe-area-inset-top),1rem)]">
    <div class="flex items-center justify-between">
      <RouterLink :to="{ name: 'meals' }" class="glass flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card" aria-label="Quay lại">
        <Icon :icon="ICONS.arrowLeft" class="text-2xl" />
      </RouterLink>
      <button
        type="button"
        class="glass flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card"
        :class="isFavorite(meal.id) ? 'text-brand' : 'text-gray-700'"
        :aria-label="isFavorite(meal.id) ? 'Bỏ yêu thích' : 'Yêu thích'"
        :aria-pressed="isFavorite(meal.id)"
        @click="toggleFavorite(meal.id)"
      >
        <Icon :icon="isFavorite(meal.id) ? ICONS.heart : ICONS.heartOutline" class="text-2xl" />
      </button>
    </div>

    <div class="relative mt-4">
      <img :src="assetUrl(meal.image)" :alt="meal.title" class="aspect-[4/3] w-full rounded-[32px] object-cover shadow-card" />
      <span class="glass absolute left-4 top-4 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-card">Đạm: {{ recipe.macros.protein }} g</span>
      <span class="glass absolute right-4 top-1/3 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-card">Tinh bột: {{ recipe.macros.carbs }} g</span>
      <span class="glass absolute bottom-6 left-4 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-card">Béo: {{ recipe.macros.fat }} g</span>
      <span
        v-if="rating"
        class="glass absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card px-4 py-1.5 text-sm font-semibold shadow-card"
      >
        <Icon :icon="ICONS.star" class="text-amber-400" /> {{ rating }}
      </span>
    </div>

    <div class="mt-8 space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-semibold leading-snug">{{ meal.title }}</h1>
        <ul class="mt-3 flex flex-wrap justify-center gap-2">
          <li v-for="category in categories" :key="category.id" class="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {{ category.emoji }} {{ category.label }}
          </li>
          <li v-for="id in recipe.dietary" :key="id" class="rounded-full bg-tile-green px-3 py-1 text-xs font-semibold text-emerald-800">
            ✓ {{ text(id) }}
          </li>
        </ul>
        <p v-if="allergenLabels" class="mt-2 text-xs text-amber-700">⚠️ Có thể chứa: {{ allergenLabels }}</p>
      </div>

      <p class="rounded-2xl bg-tile-yellow/60 p-3 text-xs text-amber-900">
        Công thức, dinh dưỡng và nguyên liệu bên dưới là dữ liệu mẫu, chưa phải dữ liệu thật.
      </p>

      <ul class="grid grid-cols-3 gap-2 text-center">
        <li class="rounded-3xl bg-tile-pink p-3">
          <Icon :icon="ICONS.timerOutline" class="mx-auto text-2xl text-gray-700" />
          <p class="mt-1 text-xs text-gray-600">Chuẩn bị</p>
          <p class="font-semibold">{{ formatMinutes(recipe.prepMinutes) }}</p>
        </li>
        <li class="rounded-3xl bg-tile-blue p-3">
          <Icon :icon="ICONS.fire" class="mx-auto text-2xl text-gray-700" />
          <p class="mt-1 text-xs text-gray-600">Nấu</p>
          <p class="font-semibold">{{ formatMinutes(recipe.cookMinutes) }}</p>
        </li>
        <li class="rounded-3xl bg-tile-yellow p-3">
          <Icon :icon="ICONS.lightning" class="mx-auto text-2xl text-gray-700" />
          <p class="mt-1 text-xs text-gray-600">Mức độ</p>
          <p class="font-semibold">{{ level }}</p>
        </li>
      </ul>

      <div class="glass flex items-center justify-between gap-3 rounded-3xl bg-tile-green/70 p-4">
        <div>
          <p class="text-xs text-gray-600">Khẩu phần</p>
          <Stepper v-model="servings" :min="1" :max="12" class="mt-1" />
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-600">Chi phí ước tính</p>
          <p class="text-lg font-semibold">{{ formatVnd(recipe.pricePerServing * servings) }}</p>
        </div>
      </div>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Dinh dưỡng mỗi khẩu phần</h2>
        <MacroCards :macros="recipe.macros" />
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Nguyên liệu</h2>
          <button type="button" class="flex items-center gap-1 text-sm font-semibold text-brand" @click="addAllIngredients">
            <Icon :icon="ICONS.cart" class="text-lg" /> Thêm tất cả
          </button>
        </div>
        <IngredientList :items="recipe.ingredients" :scale="scale" @add="addIngredient" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold">Cách nấu</h2>
        <ChipTabs v-model="method" :options="methodOptions" />
        <StepList :steps="steps" />
      </section>

      <section class="glass space-y-4 rounded-[28px] bg-card p-5 shadow-card">
        <h2 class="text-lg font-semibold">Của bạn</h2>

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
            class="w-full resize-none rounded-2xl bg-white/70 p-3 text-sm outline-none ring-1 ring-transparent focus:ring-brand/40"
          />
        </label>
      </section>

      <section>
        <h2 class="mb-1 text-lg font-semibold">Thêm vào kế hoạch</h2>
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

    <div class="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl bg-gradient-to-t from-[#e4ecff] via-[#e4ecff]/80 to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-8">
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
