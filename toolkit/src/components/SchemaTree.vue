<script setup lang="ts">
import { computed, ref } from "vue";
import type { TableSchema } from "@/db/schema";

const props = defineProps<{
  schema: TableSchema[];
  selectedTable: string | null;
  tableKind?: (table: string) => string;
}>();

defineEmits<{
  select: [table: string];
}>();

const filter = ref("");

const groups = computed(() => {
  const query = filter.value.trim().toLowerCase();
  const grouped: Record<string, TableSchema[]> = {
    catalog: [],
    runtime: [],
    schema: []
  };

  for (const item of props.schema) {
    if (query && !item.table.toLowerCase().includes(query)) {
      continue;
    }
    const kind = props.tableKind?.(item.table) ?? "schema";
    grouped[kind] ??= [];
    grouped[kind].push(item);
  }

  return Object.entries(grouped).filter(([, items]) => items.length > 0);
});
</script>

<template>
  <aside class="schema-tree">
    <div class="schema-header">
      <div class="panel-title">Schema</div>
      <span>{{ schema.length }}</span>
    </div>

    <input v-model="filter" class="schema-filter" type="search" placeholder="Filter tables" />

    <div v-for="[kind, items] in groups" :key="kind" class="schema-group">
      <div class="schema-group-title">
        <span>{{ kind }}</span>
        <small>{{ items.length }}</small>
      </div>

      <button
        v-for="item in items"
        :key="item.table"
        class="table-button"
        :class="{ active: item.table === selectedTable }"
        type="button"
        @click="$emit('select', item.table)"
      >
        <span>{{ item.table }}</span>
        <small>{{ item.columns.length }} cols</small>
      </button>
    </div>
  </aside>
</template>
