<script setup lang="ts">
import LanguageList from '../../shared/ui/LanguageList.vue'
import InFeedAd from '../ads/components/InFeedAd.vue'
</script>

<template>
  <section>
    <LanguageList />
    <InFeedAd name="settings-language" :min-viewport-height="640" class="mt-6" />
  </section>
</template>
