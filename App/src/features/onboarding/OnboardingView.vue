<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { assetUrl } from '../../shared/assets'
import { ICONS } from '../../shared/icons'
import { getMeal } from '../meals'
import { usePreferences } from '../preferences'

const router = useRouter()
const { completeOnboarding } = usePreferences()
const scroller = useTemplateRef<HTMLElement>('scroller')

const slides = [
  {
    title: 'Gợi ý món hợp khẩu vị',
    text: 'Chọn chế độ ăn, dị ứng và đạm yêu thích. App chọn những món phù hợp cho bạn.',
    chip: { icon: ICONS.autoFix, label: 'Hợp với bạn' },
    meals: ['thaigreenprawncurry', 'chickenpastabake', 'lentilcurryrice'],
  },
  {
    title: 'Kế hoạch tuần trong vài giây',
    text: 'Tạo kế hoạch theo ngân sách và thời gian nấu, đổi món chỉ với một chạm.',
    chip: { icon: ICONS.calendarWeek, label: 'Cả tuần đã sẵn sàng' },
    meals: ['15minutesalmongnocchi', 'beefstroganoff', 'aglioeoliospaghetti'],
  },
  {
    title: 'Đi chợ gọn gàng',
    text: 'Nguyên liệu cả tuần được gom vào một danh sách. Chọn siêu thị và đánh dấu khi đã mua.',
    chip: { icon: ICONS.cart, label: 'Một danh sách duy nhất' },
    meals: ['cheesequesadillas', 'thaigreenprawncurry', '5ingredientcannellinibeancurry'],
  },
].map((slide) => ({ ...slide, photos: slide.meals.flatMap((id) => getMeal(id) ?? []) }))

// Photo placement for the fan of three images on each slide.
const photoSlots = [
  'left-0 top-10 h-40 w-32 -rotate-12',
  'left-1/2 top-0 z-10 h-56 w-44 -translate-x-1/2',
  'right-0 top-10 h-40 w-32 rotate-12',
]

const active = ref(0)
const isLast = computed(() => active.value === slides.length - 1)

function onScroll() {
  const el = scroller.value
  if (el) active.value = Math.round(el.scrollLeft / el.clientWidth)
}

function goTo(index: number) {
  const el = scroller.value
  if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
}

async function finish() {
  completeOnboarding()
  await router.replace({ name: 'setup' })
}

async function next() {
  if (isLast.value) await finish()
  else goTo(active.value + 1)
}
</script>

<template>
  <section class="mx-auto flex min-h-dvh max-w-2xl flex-col pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1rem)]">
    <header class="flex items-center justify-between px-5">
      <span class="flex items-center gap-2 font-semibold">
        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
          <Icon :icon="ICONS.silverware" class="text-xl" />
        </span>
        Meal Planner
      </span>
      <button type="button" class="text-sm font-medium text-gray-500" @click="finish">Bỏ qua</button>
    </header>

    <div
      ref="scroller"
      class="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      @scroll.passive="onScroll"
    >
      <article v-for="slide in slides" :key="slide.title" class="flex w-full shrink-0 snap-center flex-col items-center justify-center px-6 text-center">
        <div class="relative mb-12 h-72 w-full max-w-xs">
          <img
            v-for="(photo, index) in slide.photos"
            :key="photo.id"
            :src="assetUrl(photo.image)"
            alt=""
            class="absolute rounded-3xl object-cover shadow-xl ring-4 ring-white/80"
            :class="photoSlots[index]"
          />
          <span class="glass absolute -bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-card">
            <Icon :icon="slide.chip.icon" class="text-lg text-brand" /> {{ slide.chip.label }}
          </span>
        </div>

        <h2 class="mb-3 text-3xl font-semibold leading-tight">{{ slide.title }}</h2>
        <p class="max-w-sm text-gray-600">{{ slide.text }}</p>
      </article>
    </div>

    <footer class="space-y-5 px-5 pt-4">
      <div class="flex justify-center gap-2" role="tablist" aria-label="Các trang giới thiệu">
        <button
          v-for="(slide, index) in slides"
          :key="slide.title"
          type="button"
          role="tab"
          :aria-selected="active === index"
          :aria-label="`Trang ${index + 1}`"
          class="h-2 rounded-full transition-all"
          :class="active === index ? 'w-8 bg-ink' : 'w-2 bg-gray-300'"
          @click="goTo(index)"
        />
      </div>

      <button
        type="button"
        class="w-full rounded-full bg-brand py-4 text-base font-semibold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98]"
        @click="next"
      >
        {{ isLast ? 'Bắt đầu' : 'Tiếp tục' }}
      </button>
    </footer>
  </section>
</template>
