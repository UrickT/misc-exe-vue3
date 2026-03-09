<script setup lang="ts">
import { type SelectFieldConfig } from "@/schema/field";
import { type InputConfig } from "@/schema/input";

interface Props {
  fieldConfig: SelectFieldConfig;
  inputConfig: InputConfig;
}
const props = defineProps<Props>();
const emit = defineEmits(["update:fullOption"]);

/** 雙向綁定核心值 */
const internalValue = defineModel<any>();

// 響應式儲存過濾後的列表
const filteredData = ref([...unref(props.fieldConfig.options.data)]);

// 監聽原始資料變化，確保資料更新時過濾列表同步
watch(
  () => props.fieldConfig.options.data,
  (newValue) => {
    filteredData.value = [...unref(newValue)];
  },
  { deep: true },
);

const labelKey = computed(() => props.fieldConfig.options.textField);
const valueKey = computed(() => props.fieldConfig.options.valueField);
const prefixKey = computed(() => props.fieldConfig.options?.prefixKey);

/** * 自定義搜尋邏輯
 * 支援同時比對 Label 與 Prefix
 */
const handleFilter = (query: string) => {
  if (!query) {
    filteredData.value = [...unref(props.fieldConfig.options.data)];
    return;
  }

  const lowQuery = query.toLowerCase();
  filteredData.value = unref(props.fieldConfig.options.data).filter((item: any) => {
    const label = String(item[labelKey.value] || "").toLowerCase();
    const prefix = prefixKey.value
      ? String(item[prefixKey.value] || "").toLowerCase()
      : "";

    return label.includes(lowQuery) || prefix.includes(lowQuery);
  });
};

const onChange = (value: any) => {
  if (value === null || value === undefined || value === "") {
    emit("update:fullOption", props.fieldConfig.key, null);
    return;
  }
  const fullOption = unref(props.fieldConfig.options.data).find(
    (opt: any) => opt[valueKey.value] === value,
  );
  emit("update:fullOption", props.fieldConfig.key, fullOption || null);
};

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
      <div
        class="el-select-wrapper w-100"
        :class="{
          'is-invalid-status': props.inputConfig.stateOfCurrentValue === false,
        }"
      >
        <ElSelect
          v-model="internalValue"
          :placeholder="
            props.inputConfig.placeholder ||
            props.fieldConfig.placeholder ||
            '請選擇'
          "
          :disabled="props.inputConfig.isDisabled"
          :clearable="props.inputConfig.isClearable"
          :filterable="true"
          :filter-method="handleFilter"
          :size="props.inputConfig.size || 'default'"
          :validate-event="false"
          class="w-100"
          @change="onChange"
        >
          <ElOption
            v-for="item in filteredData"
            :key="item[valueKey]"
            :label="item[labelKey]"
            :value="item[valueKey]"
          >
            <div class="d-flex align-items-center">
              <span v-if="prefixKey && item[prefixKey]" class="prefix-tag me-2">
                {{ item[prefixKey] }}
              </span>
              <span>{{ item[labelKey] }}</span>
            </div>
          </ElOption>
        </ElSelect>
      </div>
    </template>
  </FormInputContainer>
</template>

<style scoped>
.el-select-wrapper,
:deep(.el-select) {
  width: 100%;
}

.is-invalid-status :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
}

.prefix-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
}

/* 讓選單中的文字與標籤對齊更漂亮 */
:deep(.el-select-dropdown__item) {
  display: flex;
  align-items: center;
}
</style>
