<script setup lang="ts">
import { type GeneralFieldConfig } from "@/schema/field";
import { type InputConfig } from "@/schema/input";

interface Props {
  fieldConfig: GeneralFieldConfig;
  inputConfig: InputConfig;
}
const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue", "enter"]);

/** 雙向綁定核心值 */
const internalValue = defineModel<any>();

/** 同步當前值到 inputConfig 供 Container 驗證 */
watch(internalValue, (newValue) => {
  props.inputConfig.currentValue = newValue;
}, { immediate: true });
</script>

<template>
  <FormInputContainer
    :field-config="props.fieldConfig"
    :input-config="props.inputConfig"
  >
    <template #form-input-content>
      <div 
        class="el-textarea-wrapper"
        :class="{ 'is-invalid-status': props.inputConfig.stateOfCurrentValue === false }"
      >
        <ElInput
          v-model="internalValue"
          type="textarea"
          :id="`input-${props.fieldConfig.key}`"
          :disabled="props.inputConfig.isDisabled"
          :placeholder="props.inputConfig.placeholder ?? props.fieldConfig.placeholder"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :clearable="props.inputConfig.isClearable"
          :validate-event="false"
          @keydown.enter="emit('enter', $event)"
        />
        
        <div v-if="$slots['input-addon']" class="mt-1">
          <slot name="input-addon" />
        </div>
      </div>
    </template>
  </FormInputContainer>
</template>

<style scoped>
.el-textarea-wrapper {
  width: 100%;
}

/* 僅針對錯誤狀態進行邊框染色，其餘完全使用 Element 原生樣式 */
.is-invalid-status :deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
}
</style>