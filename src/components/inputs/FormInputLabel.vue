<script setup lang="ts">
import { type FieldConfig } from "@/schema/field";
import { type InputLayout } from "@/schema/input";

interface Props {
  fieldConfig: FieldConfig;
  inputLayout: InputLayout;
  label?: string;
}
const props = defineProps<Props>();

/** 開發模式判定 */
const isDev = import.meta.env.DEV;

// --- Tooltip 邏輯 ---
const isTooltipVisible = ref(false);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const handleMouseEnter = () => {
  if (!isDev) return;
  hoverTimer = setTimeout(() => (isTooltipVisible.value = true), 500);
};

const handleMouseLeave = () => {
  if (hoverTimer) clearTimeout(hoverTimer);
  isTooltipVisible.value = false;
};

// --- 功能邏輯 ---
const copyKey = async () => {
  if (!isDev) return;
  try {
    await navigator.clipboard.writeText(props.fieldConfig.key);
    // 這裡可以使用更好的 Toast 代替 alert
    console.log(`已複製 Key: ${props.fieldConfig.key}`);
  } catch (err) {
    console.error("複製失敗", err);
  }
};

/** 標題邏輯：優先序 props.label > field.label */
const displayTitle = computed(() => props.label || props.fieldConfig.label);

/** 佈局邏輯：直接利用 Factory 傳進來的 layout */
const colStyle = computed(() => {
  const [labelWidth = 4, , offset = 0] = props.inputLayout;
  const total = 12; // 假設 12 欄制

  return {
    marginLeft: offset ? `${(offset / total) * 100}%` : "0",
    flex: `0 0 ${(labelWidth / total) * 100}%`,
    maxWidth: `${(labelWidth / total) * 100}%`,
  };
});
</script>

<template>
  <BCol
    v-if="inputLayout[0] !== 0"
    :style="colStyle"
    class="position-relative d-flex align-items-start"
  >
    <label
      class="label-text ps-1"
      :class="{ 'dev-mode': isDev }"
      @click="copyKey"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      {{ displayTitle }}

      <Teleport to="body" v-if="isDev">
        <Transition name="fade">
          <div v-if="isTooltipVisible" class="dev-tooltip">
            <span class="badge">KEY</span> {{ fieldConfig.key }}
          </div>
        </Transition>
      </Teleport>
    </label>
  </BCol>
</template>

<style scoped>
.label-text {
  display: inline-block;
  margin-top: 0.4375rem;
  color: #495057; /* 替換原本的變數，確保範例可讀 */
  font-weight: 500;
}

.dev-mode {
  cursor: copy; /* 複製感更強的鼠標 */
  text-decoration: underline dotted #adb5bd;
}

.dev-tooltip {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: rgba(33, 37, 41, 0.9);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.badge {
  background: #6c757d;
  font-size: 10px;
  margin-right: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
