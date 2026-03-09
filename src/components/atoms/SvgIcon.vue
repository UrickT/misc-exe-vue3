<script setup lang="ts">
/** 
 * SvgIcon
 * * path：MDI 路徑字串 (由 @mdi/js 匯入)
 * * size：圖示尺寸
 * * color?：圖示顏色 (預設繼承父層文字顏色)
 */
interface Props {
  path: string;
  size: number;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: "currentColor"
});
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="svg-icon"
  >
    <path :d="props.path" :fill="props.color" />
  </svg>
</template>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
