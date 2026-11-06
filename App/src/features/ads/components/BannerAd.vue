<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { destroyBanner, hideBanner, showBanner } from '../banner'

// The banner is a native view drawn over the bottom edge of the screen, so this component draws nothing. It asks for
// it to be shown or hidden as `visible` changes (never destroyed and re-created, which restarts the ad load) and
// destroys it only when it goes away for good. The room for it is reserved by App.vue, from the first frame and
// whether or not an ad has loaded.
const props = defineProps<{ visible: boolean }>()

watch(
  () => props.visible,
  (visible) => (visible ? showBanner() : hideBanner()),
  { immediate: true },
)

onBeforeUnmount(destroyBanner)
</script>

<template />
