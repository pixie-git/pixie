<template>
  <div v-if="isOpen">
    <div class="popover-backdrop" @click="$emit('close')"></div>
    <div class="user-popover" :style="popoverStyle">
      <UserMenuContent @close="$emit('close')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue';
import UserMenuContent from './UserMenuContent.vue';

const props = defineProps<{
  isOpen: boolean;
  anchorRect: DOMRect | null;
}>();

const emit = defineEmits<{ close: [] }>();

const popoverStyle = computed(() => {
  if (!props.anchorRect) return {};
  return {
    top: `${props.anchorRect.bottom + 8}px`,
    right: `${window.innerWidth - props.anchorRect.right}px`
  };
});

// Close on scroll/resize to avoid misalignment
function closePopover() {
  emit('close');
}

watch(() => props.isOpen, (open) => {
  if (open) {
    window.addEventListener('scroll', closePopover, true);
    window.addEventListener('resize', closePopover);
  } else {
    window.removeEventListener('scroll', closePopover, true);
    window.removeEventListener('resize', closePopover);
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', closePopover, true);
  window.removeEventListener('resize', closePopover);
});
</script>

<style scoped>
.popover-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.user-popover {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--color-shadow);
  overflow: hidden;
}
</style>
