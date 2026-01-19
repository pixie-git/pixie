<script setup lang="ts">
defineProps<{
  modelValue: string
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();
</script>

<template>
  <div class="color-selector">
    <label>
      Color: 
      <input 
        type="color" 
        :value="modelValue" 
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </label>
  </div>
</template>

<style scoped>
.color-selector {
  margin-bottom: 20px;
}
</style>