<script setup lang="ts">
import { type GeneralFieldConfig } from "@/schema/field";
import { type InputConfig } from "@/schema/input";

interface Props {
  fieldConfig: GeneralFieldConfig;
  inputConfig: InputConfig;
  prefixIcon?: object;
  suffixIcon?: string;
}
const props = defineProps<Props>();
const emit = defineEmits(["enter"]);

/** 雙向綁定核心值 */
const internalValue = defineModel<any>();

/** 當 internalValue 變動時，同步更新 inputConfig 的狀態 */
watch(internalValue, (newValue) => {
  props.inputConfig.currentValue = newValue;
});
</script>

<template>
  <FormInputContainer
    :field-config="props.fieldConfig"
    :input-config="props.inputConfig"
  >
    <template #form-input-content>
      <ElInput
        v-model="internalValue"
        :id="`input-${props.fieldConfig.key}`"
        :type="
          props.fieldConfig.type === 'text'
            ? 'text'
            : (props.fieldConfig.type as any)
        "
        :placeholder="
          props.inputConfig.placeholder ?? props.fieldConfig.placeholder
        "
        :disabled="props.inputConfig.isDisabled"
        :clearable="props.inputConfig.isClearable"
        :size="props.inputConfig.size"
        :prefix-icon="prefixIcon"
        :suffix-icon="suffixIcon"
        @keyup.enter="$emit('enter', $event)"
      >
        <template v-if="$slots['input-addon']" #append>
          <slot name="input-addon" />
        </template>
      </ElInput>
    </template>
  </FormInputContainer>
</template>

<style scoped>
/* 如果需要針對 Element Plus 的狀態顏色做微調 */
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

/* 當驗證失敗時 (假設 inputConfig.stateOfCurrentValue 為 false 時的樣式) */
.is-error :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}
</style>
