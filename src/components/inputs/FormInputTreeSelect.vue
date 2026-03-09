<script setup lang="ts">
import { type InputConfig } from "@/schema/input";
import { type SelectFieldConfig } from "@/schema/field";

interface Props {
  fieldConfig: SelectFieldConfig;
  inputConfig: InputConfig;
}
const props = defineProps<Props>();
const emit = defineEmits(["update:fullOption"]);

/** 雙向綁定核心值 */
const internalValue = defineModel<any>();

/**【Element Plus 配置適配】
 * ElTreeSelect 使用 props 屬性來定義 value 和 label 的 Key
 */
const treeProps = computed(() => ({
  value: props.fieldConfig.options.valueField,
  label: props.fieldConfig.options.textField,
  children: "children", // 若有樹狀結構則使用
}));

/** 取得 Prefix 的 Key 名稱 */
const prefixKey = computed(() => props.fieldConfig.options?.prefixKey);

/** 自定義篩選邏輯
 * 讓搜尋框可以同時搜尋名稱 (label) 與前綴 (prefixKey)
 */
const filterMethod = (value: string, data: any) => {
  if (!value) return true;

  const searchValue = value.toLowerCase();
  const label = String(data[treeProps.value.label] || "").toLowerCase();
  const prefix = prefixKey.value
    ? String(data[prefixKey.value] || "").toLowerCase()
    : "";

  // 只要「名稱」或「前綴 ID」其中一個包含關鍵字，就顯示
  return label.includes(searchValue) || prefix.includes(searchValue);
};

/** 處理數值變更 */
const onChange = (value: any) => {
  console.log("onChange value: ", value);

  // 1. 檢查是否為清除操作 (null, undefined, 或空字串)
  if (value === null || value === undefined || value === "") {
    emit("update:fullOption", props.fieldConfig.key, null);
    return; // 直接中斷，不執行後面的 find
  }

  // 2. 正常選取邏輯
  const dataList = unref(props.fieldConfig.options.data);
  const valueField = props.fieldConfig.options.valueField;

  // 使用 lodash 的 _.find 或原生的 find
  const fullOption = dataList.find((opt: any) => opt[valueField] === value);

  emit("update:fullOption", props.fieldConfig.key, fullOption || null);
};

/** 同步當前值到 inputConfig 供 Container 驗證 */
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
        class="el-tree-select-wrapper w-100"
        :class="{
          'is-invalid-status': props.inputConfig.stateOfCurrentValue === false,
        }"
      >
        <ElTreeSelect
          v-model="internalValue"
          :data="props.fieldConfig.options.data"
          :props="treeProps"
          :placeholder="
            props.inputConfig.placeholder ||
            props.fieldConfig.placeholder ||
            '請選擇'
          "
          :disabled="props.inputConfig.isDisabled"
          :clearable="props.inputConfig.isClearable"
          :filterable="true"
          :filter-node-method="filterMethod"
          :validate-event="false"
          check-strictly
          class="w-100 custom-el-select"
          @change="onChange"
        >
          <template #default="{ data }">
            <div class="d-flex align-items-center">
              <span v-if="prefixKey" class="prefix-tag me-2">
                {{ data[prefixKey] }}
              </span>
              <span>{{ data[treeProps.label] }}</span>
            </div>
          </template>
        </ElTreeSelect>
      </div>
    </template>
  </FormInputContainer>
</template>

<style scoped>
/* 讓外層容器寬度 100% */
.el-tree-select-wrapper {
  width: 100%;
}

/* 核心樣式覆蓋 */
:deep(.el-select) {
  --el-select-input-focus-border-color: #86b7fe; /* Bootstrap Focus 顏色 */
  width: 100%;
}

:deep(.el-select__wrapper) {
  /* 高度與圓角修正，對齊 Bootstrap 4/5 */
  min-height: 38px;
  line-height: 1.5;
  border-radius: 0.375rem; /* BS5 預設圓角 */
  background-color: #fff;
  border: 1px solid #dee2e6; /* BS 邊框色 */
  box-shadow: none;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

/* Hover 效果 */
:deep(.el-select__wrapper:hover) {
  box-shadow: none;
  border-color: #dee2e6;
}

/* Focus 狀態 (模仿 Bootstrap 的外框陰影) */
:deep(.el-select__wrapper.is-focused) {
  color: #212529;
  background-color: #fff;
  border-color: #86b7fe;
  outline: 0;
  /* Bootstrap 經典的 0.25rem 柔和陰影 */
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
}

/* 錯誤狀態 (當 stateOfCurrentValue === false 時) */
:deep(.el-select__wrapper.is-invalid),
.is-invalid :deep(.el-select__wrapper) {
  border-color: var(--color-invalid) !important;
}

:deep(.el-select__wrapper.is-invalid:focus) {
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25) !important;
}

/* 內部文字顏色 */
:deep(.el-select__placeholder) {
  color: #6c757d; /* BS Placeholder 顏色 */
}

/* 基礎錯誤狀態顏色（對齊 Bootstrap 的 --bs-danger） */
.is-invalid-status :deep(.el-select__wrapper) {
  border-color: var(--color-invalid) !important; /* 直接用 BS 紅色或你的變數 */
}

/* 錯誤狀態下的 Focus 陰影（對齊 Bootstrap 的 invalid-feedback 陰影） */
.is-invalid-status :deep(.el-select__wrapper.is-focused) {
  border-color: var(--color-invalid) !important;
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25) !important;
}

.prefix-tag {
  font-size: 0.8em;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
