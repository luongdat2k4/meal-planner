<script setup lang="ts">
import LanguageList from '../../shared/ui/LanguageList.vue'
import InFeedAd from '../ads/components/InFeedAd.vue'
</script>

<template>
  <!-- The screen fills the area between the title and the tab bar: only the list scrolls, so the ad below it is always
       in view. -->
  <section class="flex h-full flex-col">
    <div class="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
      <LanguageList />
    </div>
    <InFeedAd name="settings-language" template="mrec" video :min-viewport-height="700" class="mt-4 shrink-0" />
  </section>
</template>
