<script setup>
defineProps({
  modelValue: { type: String, required: true }
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="color-selector">
    <label>
      Color: 
      <input 
        type="color" 
        :value="modelValue" 
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </label>
  </div>
</template>

<style scoped>
.color-selector {
  margin-bottom: 20px;
}
</style>