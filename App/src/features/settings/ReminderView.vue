<script setup lang="ts">
import InFeedAd from '../ads/components/InFeedAd.vue'
import FieldReminder from '../preferences/components/FieldReminder.vue'
</script>

<template>
  <section>
    <div class="rounded-3xl bg-card p-5 shadow-card">
      <FieldReminder />
    </div>

    <InFeedAd name="settings-reminder" :min-viewport-height="700" class="mt-6" />
  </section>
</template>
