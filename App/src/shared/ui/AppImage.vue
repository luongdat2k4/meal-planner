<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { assetUrl, thumbUrl } from '../assets'

// A photo that shows a shimmering placeholder until it has loaded. Size and shape come from the caller's classes.
// With `thumb` it loads the small copy of the photo (cards, lists); without, the full-size original.
const props = defineProps<{ src: string; alt: string; thumb?: boolean }>()

const el = ref<HTMLImageElement | null>(null)
const loaded = ref(false)
// Set when a thumbnail is missing, so the original is shown instead of a broken image.
const original = ref(false)

const url = computed(() => (props.thumb && !original.value ? thumbUrl(props.src) : assetUrl(props.src)))

onMounted(() => {
  // A cached image can finish before the load listener is attached.
  if (el.value?.complete && el.value.naturalWidth > 0) loaded.value = true
})

watch(
  () => props.src,
  () => {
    loaded.value = false
    original.value = false
  },
)

function onError() {
  if (props.thumb && !original.value) original.value = true
  else loaded.value = true
}
</script>

<template>
  <img ref="el" :src="url" :alt="alt" :class="loaded ? '' : 'skeleton'" decoding="async" @load="loaded = true" @error="onError" />
</template>
