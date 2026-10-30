<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { assetUrl } from '../assets'

// A photo that shows a shimmering placeholder until it has loaded. Size and shape come from the caller's classes.
const props = defineProps<{ src: string; alt: string }>()

const el = ref<HTMLImageElement | null>(null)
const loaded = ref(false)

onMounted(() => {
  // A cached image can finish before the load listener is attached.
  if (el.value?.complete && el.value.naturalWidth > 0) loaded.value = true
})

watch(
  () => props.src,
  () => {
    loaded.value = false
  },
)
</script>

<template>
  <img ref="el" :src="assetUrl(src)" :alt="alt" :class="loaded ? '' : 'skeleton'" @load="loaded = true" @error="loaded = true" />
</template>
