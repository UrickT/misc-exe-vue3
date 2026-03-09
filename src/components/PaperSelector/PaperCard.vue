<script setup lang="ts">
import { type PaperWithColor } from "@/schema/paper";

interface Props {
  /** 單張紙材資料，包含 hexColor */
  card: PaperWithColor;
  /** 控制是否顯示選中樣式 */
  isSelected: boolean;
}
const props = defineProps<Props>();

/**
 * 事件定義
 * @event select 當使用者點擊卡片時觸發，回傳該紙材資料
 */
const emit = defineEmits<{
  (e: "select", paper: PaperWithColor): void;
}>();

/**
 * 計算屬性：根據背景背景顏色自動計算對比文字顏色
 * 演算法使用 W3C 亮度公式
 * @returns {string} '#FFFFFF' 或 '#454545'
 */
const textColor = computed(() => {
  const hex = props.card.hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? "#454545" : "#FFFFFF";
});
</script>

<template>
  <div
    class="paper-card"
    :class="{ active: isSelected }"
    :style="{ backgroundColor: card.hexColor, color: textColor }"
    @click="emit('select', card)"
  >
    <div v-if="isSelected" class="selected-badge">
      <SvgIcon :path="mdiCheck" size="18" />
    </div>

    <div class="card-body">
      <div class="header">
        <span class="category-tag">{{ card.paperClass }}</span>
        <div class="name-title">{{ card.paperName }}</div>
      </div>

      <div class="footer">
        <span class="short-id">#{{ card.shortID }}</span>
        <span class="weight-tag"
          >{{ card.paperWeight
          }}{{ card.paperWeight === "無" ? "" : "P" }}</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.paper-card {
  height: 140px;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
.paper-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.paper-card.active {
  border: 3px solid #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
}
.selected-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  padding: 4px;
  z-index: 5;
}
.category-tag {
  font-size: 10px;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
.name-title {
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}
.footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.9;
}
</style>
