<script setup lang="ts">
defineProps<{ label: string }>();
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="set">
    <span>{{ label }}</span>
    <input v-model="model" class="switch" type="checkbox" role="switch">
  </label>
</template>