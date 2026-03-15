<script setup lang="ts">
import _ from "lodash";

import { type FormMode } from "@/schema/.general";
import {
  type GeneralFieldConfig,
  type SelectFieldConfig,
} from "@/schema/field";
import {
  // RAW_PAPERS_DATA,
  COLOR_MAP,
  getOptionsOf,
  extractFilteredOptions,
} from "@/mock/paperData";
import { type Paper } from "@/schema/paper";
import { Search } from "@element-plus/icons-vue";

import { paperApi } from "@/api/apiServices/paper";
const RAW_PAPERS_DATA = ref<Paper[]>([]);
const isLoadingRawData = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  await fetchRawPapers();
});

const fetchRawPapers = async () => {
  try {
    RAW_PAPERS_DATA.value = await paperApi.getAll();
  } catch (err) {
    error.value = "無法載入紙張資料";
  } finally {
    isLoadingRawData.value = false;
  }
};

const weightUnit = ref<string>("P");
const mode = ref<FormMode>("search");
const selectedPaper = ref<Paper | null>(null);

// 1. 完整的配置地圖
const SCHEMA_MAP = {
  paperNameAndIDQuery: {
    type: "text",
    key: "paperNameAndIDQuery",
    label: "搜尋名稱或代號",
    placeholder: "例如：色紙",
    validator: VALIDATORS.isValidString,
    isRequired: { search: false },
  } as GeneralFieldConfig,

  paperClass: {
    type: "select",
    key: "paperClass",
    label: "紙材總類",
    options: {
      data: getOptionsOf(RAW_PAPERS_DATA.value, "paperClass", "paperCategory"),
      valueField: "itemID",
      textField: "itemName",
      prefixKey: "paperCategory",
    },
    isRequired: { search: false },
  } as SelectFieldConfig,

  paperName: {
    type: "select",
    key: "paperName",
    label: "紙材名稱",
    options: {
      data: getOptionsOf(RAW_PAPERS_DATA.value, "paperName"),
      valueField: "itemID",
      textField: "itemName",
    },
    isRequired: { search: false },
  } as SelectFieldConfig,

  // 補上漏掉的 paperColor
  paperColor: {
    type: "select",
    key: "paperColor",
    label: "紙材顏色",
    options: {
      data: getOptionsOf(RAW_PAPERS_DATA.value, "paperColor"), // 假設你有這個 options function
      valueField: "itemID",
      textField: "itemName",
    },
    isRequired: { search: false },
  } as SelectFieldConfig,

  paperWeight: {
    type: "select",
    key: "paperWeight",
    label: "紙材重量(P)",
    options: {
      data: _.sortBy(getOptionsOf(RAW_PAPERS_DATA.value, "paperWeight"), [
        (item: any) => Number(item.itemName),
      ]),
      valueField: "itemID",
      textField: "itemName",
    },
    isRequired: { search: false },
  } as SelectFieldConfig,

  paperMaterial_1: {
    type: "text",
    key: "paperMaterial_1",
    label: "最終選擇（可手動修改）",
    placeholder: "點擊右方紙材卡片自動填入...",
    validator: VALIDATORS.isValidString,
    isRequired: { search: true },
  } as GeneralFieldConfig,
} as const;

type SchemaKeys = keyof typeof SCHEMA_MAP;

// 2. 初始化響應式物件
const fieldsConfigs = reactive({} as Record<SchemaKeys, any>);
const inputConfigs = reactive({} as Record<SchemaKeys, InputConfig>);
const ruleForm = reactive({} as Record<SchemaKeys, any>);
const rules = reactive<Record<string, any>>({});

// 建立一個存放所有 Select 選項的容器
const dynamicOptions = reactive<Record<string, any>>({
  paperClass: computed(() =>
    extractFilteredOptions(RAW_PAPERS_DATA.value, ruleForm, "paperClass"),
  ),
  paperName: computed(() =>
    extractFilteredOptions(RAW_PAPERS_DATA.value, ruleForm, "paperName"),
  ),
  paperColor: computed(() => sortedColorOptions.value),
  paperWeight: computed(() =>
    _.sortBy(
      extractFilteredOptions(RAW_PAPERS_DATA.value, ruleForm, "paperWeight"),
      [(item: any) => Number(item.itemName)],
    ),
  ),
});

// 3. 解決 Overload 報錯的生成迴圈
(Object.keys(SCHEMA_MAP) as SchemaKeys[]).forEach((key) => {
  const config = SCHEMA_MAP[key];

  // 1. 【優先】初始化表單值，確保後續 computed 計算時不會拿到 undefined
  // Select 建議給 null，Text 給 ""
  ruleForm[key] = config.type === "select" ? null : "";

  // 2. 處理欄位配置
  if (config.type === "select") {
    fieldsConfigs[key] = defineField({
      ...config,
      options: {
        ...config.options,
        // 核心：使用 computed 確保每次 ruleForm 變動，defineField 拿到的 data 都是最新的
        data: computed(() => {
          // 根據 key 從 dynamicOptions 取得對應的選項陣列
          const opt = dynamicOptions[key];
          // 如果 dynamicOptions[key] 是 computed，則取其 .value
          return opt && opt.value ? opt.value : opt;
        }),
      },
    } as unknown as SelectFieldConfig); // 使用 unknown 轉型解決之前的 type 報錯
  } else {
    fieldsConfigs[key] = defineField(config as GeneralFieldConfig);
  }

  // 3. 生成渲染配置
  inputConfigs[key] = defineInput({
    mode: mode.value,
    layout: [0, 12],
    margin: "mt-2",
    size: "large",
    labelPosition: "top",
    isClearable: true,
    isRequired: config.isRequired,
  });
});

// 4. 動態規則生成 (根據當前 mode)
const updateRules = () => {
  (Object.keys(SCHEMA_MAP) as SchemaKeys[]).forEach((key) => {
    const config = SCHEMA_MAP[key] as any;
    const isMandatory = config.isRequired?.[mode.value] ?? false;

    const fieldRules: any[] = [];

    // 必填校驗
    if (isMandatory) {
      fieldRules.push({
        required: true,
        message: "",
        trigger: "change",
      });
    }

    // 邏輯校驗
    if (config.validator) {
      fieldRules.push({
        // 如果 config.message 是 undefined，wrapValidator 就會採用 "輸入格式有誤"
        validator: wrapValidator(config.validator, config.message),
        trigger: "change",
      });
    }
    rules[key] = fieldRules;
  });
};

updateRules();

// 5. 判斷是否有篩選條件
const hasSelectedFilter = computed(() => {
  return (
    (Object.keys(fieldsConfigs) as SchemaKeys[])
      // 關鍵修正：必須同時滿足「不是 A」且「不是 B」
      .filter(
        (key) => key !== "paperMaterial_1" && key !== "paperNameAndIDQuery",
      )
      .some((key) => {
        const val = ruleForm[key];

        if (val == null) return false;
        if (typeof val === "string") return val.trim().length > 0;
        if (Array.isArray(val)) return val.length > 0;

        return true;
      })
  );
});

/**
 * 格式化紙張清單：將空字串轉換為「無」，並注入顏色。
 */
const formattedListOfProductPaperAll = computed(() => {
  // 直接 map，不需先 cloneDeep 全陣列
  return RAW_PAPERS_DATA.value.map((paper) => {
    // 1. 處理空字串轉「無」的邏輯
    const formattedFields = Object.entries(paper).reduce(
      (acc, [key, value]) => {
        acc[key] = value === "" ? "無" : value;
        return acc;
      },
      {} as any,
    );

    // 2. 注入顏色並回傳
    return {
      ...formattedFields,
      // 使用格式化後的 paperColor 或是原始的 paper.paperColor 都可以
      hexColor: COLOR_MAP[paper.paperColor] || "#FFFFFF",
    };
  });
});
/**
 * 根據使用者輸入的條件過濾紙張清單
 * @returns {Array} 過濾後並附帶顏色代碼的紙張列表
 */
const filteredListOfCard = computed(() => {
  // 直接從 computed 取得已格式化的資料，不需 cloneDeep，節省記憶體
  const sourceList = formattedListOfProductPaperAll.value;

  // 1. 修正：必須從 .value 解構，否則搜尋會沒反應
  const {
    paperNameAndIDQuery,
    paperClass,
    paperName,
    paperColor,
    paperWeight,
  } = ruleForm;

  // 2. 預處理搜尋字串，避免在迴圈內反覆執行 trim/toLowerCase
  const query = paperNameAndIDQuery?.trim().toLowerCase() || "";

  return _.filter(sourceList, (paper) => {
    // 模糊搜尋 (Match Query)
    const matchQuery = query
      ? paper.paperName.toLowerCase().includes(query) ||
        (paper.shortID && paper.shortID.toLowerCase().includes(query))
      : true;

    // 精確篩選 (Exact Match)
    // 這裡直接判斷，如果變數有值才比對，沒值（null/undefined）就 pass
    const matchClass = !paperClass || paper.paperClass === paperClass;
    const matchName = !paperName || paper.paperName === paperName;
    const matchColor = !paperColor || paper.paperColor === paperColor;
    const matchWeight = !paperWeight || paper.paperWeight === paperWeight;

    return matchQuery && matchClass && matchName && matchColor && matchWeight;
  });
});

// 取得顏色選項並排序
const sortedColorOptions = computed(() => {
  // 1. 判斷邏輯：如果除了「顏色」以外有其他篩選條件，就用 extract，否則用 get
  // 這裡我們稍微調整 hasSelectedFilter 的邏輯或直接在這邊判斷
  const hasOtherFilters = (Object.keys(fieldsConfigs) as SchemaKeys[])
    .filter(
      (k) =>
        k !== "paperColor" &&
        k !== "paperMaterial_1" &&
        k !== "paperNameAndIDQuery",
    )
    .some((k) => !!ruleForm[k]);

  const options = hasOtherFilters
    ? extractFilteredOptions(RAW_PAPERS_DATA.value, ruleForm, "paperColor")
    : getOptionsOf(RAW_PAPERS_DATA.value, "paperColor");

  // 2. 分離「無」選項與其他顏色
  const [noColorOptions, colorOptions] = _.partition(
    options,
    (o) => o.itemID === "無" || o.itemID === "",
  );

  // 3. 將顏色依亮度排序 (修正 substring 索引)
  const sortedColors = _.sortBy(colorOptions, (o) => {
    const hex = o.hexColor || "#ffffff";
    // 十六進位解析修正：#RRGGBB -> RR 是 1,3, GG 是 3,5, BB 是 5,7
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;

    return 0.299 * r + 0.587 * g + 0.114 * b;
  });

  return [...noColorOptions, ...sortedColors];
});

/**
 * 根據背景顏色自動決定文字顏色（黑或白）
 * @param {string} hexColor - 十六進位色碼（例如 "#F4A7B9"）
 * @returns {string} 建議的文字顏色
 */
const getTextColor = (hexColor: any) => {
  if (!hexColor) return "#000000"; // 預設黑字

  // 移除 #
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // 計算亮度（感知亮度公式）
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 亮色背景 → 黑字；暗色背景 → 白字
  return brightness > 160 ? "#454545" : "#FFFFFF";
};

const resetSearchConditions = () => {
  // 1. 遍歷 SCHEMA_MAP 的所有 key，將 ruleForm 對應的欄位清空
  (Object.keys(SCHEMA_MAP) as SchemaKeys[]).forEach((key) => {
    ruleForm[key] = "";
  });

  // 2. 重置關聯的響應式變數
  selectedPaper.value = null;
};

const resetSearchConditionsExceptQuery = () => {
  // 1. 從 SCHEMA_MAP 取得所有 Key，並過濾掉不需重置的
  (Object.keys(SCHEMA_MAP) as SchemaKeys[]).forEach((key) => {
    if (key !== "paperNameAndIDQuery") {
      ruleForm[key] = "";
    }
  });

  // 2. 處理關聯變數
  selectedPaper.value = null;
};

const setDefaultValue = () => {
  selectedPaper.value =
    _.find(
      formattedListOfProductPaperAll.value,
      (paper: Paper) => paper.default,
    ) || null;
};

watch(
  () => formattedListOfProductPaperAll.value,
  () => {
    setDefaultValue();
  },
);
watch(
  () => selectedPaper.value,
  (newPaper) => {
    // 1. 防禦：如果沒選中紙張，就清空欄位並返回
    if (!newPaper) {
      ruleForm["paperMaterial_1"] = "";
      return;
    }

    // 2. 解構資料（此時 newPaper 就是 paper 物件，不用 .value）
    const { shortID, paperName, paperColor, paperWeight } = newPaper;

    // 3. 處理重量單位邏輯
    const formattedWeight =
      paperWeight && paperWeight !== "無"
        ? `${paperWeight}${weightUnit.value}`
        : null;

    // 4. 組裝並過濾無效值
    const values = [shortID, paperName, paperColor, formattedWeight].filter(
      (v) => v && v !== "無",
    );

    // 5. 更新表單
    ruleForm["paperMaterial_1"] = values.join(" ");
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <BContainer fluid class="p-0 container-layout">
    <BRow class="g-0 h-100">
      <BCol cols="12" md="3" class="left-panel">
        <BCard no-body class="h-100 border-0 shadow-sm">
          <BCardBody class="p-0 h-100 flex-grow-1 d-flex flex-column">
            <ElForm
              ref="ruleFormRef"
              :model="ruleForm"
              :rules="rules"
              class="p-0 h-100 flex-grow-1 d-flex flex-column"
            >
              <!-- 標題 -->
              <div class="m-3">
                <span class="card-title"> 紙材查詢 </span>
              </div>

              <!-- 底部固定區 -->
              <ElDivider class="m-0" />

              <!-- 上方搜尋區：可滾動 -->

              <div class="p-3 form-scroll-area">
                <!-- 搜尋名稱或代號 -->
                <div class="mb-2">
                  <FormInputGeneral
                    v-model="ruleForm['paperNameAndIDQuery']"
                    :field-config="fieldsConfigs.paperNameAndIDQuery"
                    :input-config="inputConfigs.paperNameAndIDQuery"
                    :prefix-icon="Search"
                  />
                  <ElAlert
                    v-if="
                      !_.isEmpty(ruleForm['paperNameAndIDQuery']) &&
                      hasSelectedFilter
                    "
                    type="warning"
                    class="mt-2 p-2"
                    :closable="false"
                  >
                    <div
                      class="d-flex justify-content-between align-items-center w-100"
                    >
                      <!-- 左邊文字 -->
                      <span class="alert-left">正在已選條件下搜尋</span>

                      <!-- 右邊清除篩選 -->
                      <span
                        class="ms-3 alert-right"
                        @click="resetSearchConditionsExceptQuery"
                      >
                        清除篩選
                      </span>
                    </div>
                  </ElAlert>
                </div>

                <!-- 紙材總類 -->
                <div class="mb-2">
                  <FormInputSelect
                    v-model="ruleForm['paperClass']"
                    :field-config="fieldsConfigs.paperClass"
                    :input-config="inputConfigs.paperClass"
                  />
                </div>

                <!-- 紙材名稱 -->
                <div class="mb-2">
                  <FormInputSelect
                    v-model="ruleForm['paperName']"
                    :field-config="fieldsConfigs.paperName"
                    :input-config="inputConfigs.paperName"
                  />
                </div>

                <!-- 紙材重量 -->
                <div class="mb-2">
                  <FormInputSelect
                    v-model="ruleForm['paperWeight']"
                    :field-config="fieldsConfigs.paperWeight"
                    :input-config="inputConfigs.paperWeight"
                  />
                </div>

                <!-- 紙材顏色 -->
                <div class="mb-2">
                  <ElFormItem
                    :label="
                      inputConfigs.paperColor.label ??
                      fieldsConfigs.paperColor.label
                    "
                    :label-position="inputConfigs.paperColor.labelPosition"
                    :prop="fieldsConfigs.paperColor.key"
                    class="mb-0"
                  >
                    <ElSpace
                      direction="vertical"
                      alignment="flex-center"
                      class="w-100"
                    >
                      <ElSkeleton animated :loading="isLoadingRawData">
                        <template #template>
                          <div class="mt-2 mb-4 color-selector">
                            <template v-for="_num in 3">
                              <ElSkeletonItem
                                v-for="i in 5"
                                :key="`skeleton-color-${i}`"
                                variant="circle"
                                style="width: 2.7rem; height: 2.7rem"
                                class="mb-2"
                              />
                            </template>
                          </div>
                        </template>
                        <template #default>
                          <div class="mt-2 mb-4 color-selector">
                            <div
                              v-for="(colorOption, index) in sortedColorOptions"
                              :key="index"
                              :class="{
                                selected:
                                  ruleForm['paperColor'] === colorOption.itemID,
                              }"
                              class="color-circle-wrapper"
                              @click="
                                ruleForm['paperColor'] = colorOption.itemID
                              "
                            >
                              <!-- 無顏色顯示文字 -->
                              <div
                                v-if="colorOption.itemID === '無'"
                                class="color-circle circle-text-color"
                              >
                                無
                              </div>

                              <!-- 有顏色顯示圓形 -->
                              <div
                                v-else
                                class="color-circle circle-text-color"
                                :style="{
                                  backgroundColor: colorOption.hexColor,
                                  color: getTextColor(colorOption.hexColor),
                                }"
                              >
                                {{ colorOption.itemName }}
                              </div>
                            </div>
                          </div>
                        </template>
                      </ElSkeleton>
                    </ElSpace>
                  </ElFormItem>
                </div>
              </div>

              <!-- 底部固定區 -->
              <ElDivider class="m-0" />

              <div class="p-3">
                <!-- 最終選擇 -->
                <div class="mb-3">
                  <FormInputTextarea
                    v-model="ruleForm['paperMaterial_1']"
                    :field-config="fieldsConfigs.paperMaterial_1"
                    :input-config="inputConfigs.paperMaterial_1"
                  />
                </div>
                <ElButton
                  class="w-100 d-flex align-items-center justify-content-center"
                  plain
                  size="large"
                  type="info"
                  @click="resetSearchConditions"
                >
                  <SvgIcon :path="mdiCloseCircle" :size="20" />
                  <span class="ms-1">清空全部</span>
                </ElButton>
              </div>
            </ElForm>
          </BCardBody>
        </BCard>
      </BCol>

      <!-- 右側可滾動區域 -->
      <BCol cols="12" md="9" class="right-panel">
        <BCard no-body class="h-100 d-flex flex-column border-0 right-card">
          <BCardBody
            class="p-0 d-flex flex-column flex-grow-1"
            style="overflow-y: auto; overflow-x: hidden"
          >
            <ElSkeleton animated :loading="isLoadingRawData">
              <template #template>
                <div class="p-3 paper-grid">
                  <ElSkeletonItem
                    v-for="i in 12"
                    :key="`skeleton-card-${i}`"
                    variant="image"
                    class="card-item"
                  />
                </div>
              </template>
              <template #empty>
                <p class="text-center text-gray-500">目前沒有任何紙材</p>
              </template>
              <template #default>
                <div class="p-3 paper-grid">
                  <BCard
                    v-for="(card, index) in filteredListOfCard"
                    :key="'paper-card-' + index"
                    class="position-relative card-item"
                    :class="{
                      'selected-card': selectedPaper?.paperSN === card.paperSN,
                    }"
                    :style="{
                      backgroundColor: card.hexColor,
                      color: getTextColor(card.hexColor), // 根據亮度自動調整文字顏色
                    }"
                    @click="selectedPaper = card"
                  >
                    <!-- 選取標記 -->
                    <template v-if="selectedPaper?.paperSN === card.paperSN">
                      <SvgIcon
                        :path="mdiCheck"
                        :size="30"
                        class="selected-card-icon"
                      />
                    </template>

                    <BCardBody class="p-0 h-100 d-flex flex-column">
                      <!-- 上方資訊靠上 -->
                      <div class="flex-grow-1">
                        <div class="mb-2 badge-paper-class">
                          {{ card.paperClass }}
                        </div>
                        <div class="mb-1 font-medium">
                          {{ card.paperName }}
                        </div>
                        <div class="paper-color-dark">
                          {{
                            card.paperColor === "無"
                              ? "無指定顏色"
                              : card.paperColor
                          }}
                        </div>
                      </div>

                      <!-- 下方資訊固定底部 -->
                      <div
                        class="d-flex align-items-center justify-content-between mt-auto"
                      >
                        <div class="shortID-dark">代號:{{ card.shortID }}</div>
                        <div
                          v-if="card.paperWeight === '無'"
                          class="shortID-dark"
                        >
                          無指定重量
                        </div>
                        <div v-else class="font-medium">
                          {{ card.paperWeight }}{{ weightUnit }}
                        </div>
                      </div>
                    </BCardBody>
                  </BCard>

                  <!-- 填充空白格子 -->
                  <template v-if="filteredListOfCard.length % 4 !== 0">
                    <div
                      v-for="n in 4 - (filteredListOfCard.length % 4)"
                      :key="'empty-' + n"
                    />
                  </template>
                </div>
              </template>
            </ElSkeleton>
          </BCardBody>
        </BCard>
      </BCol>
    </BRow>
  </BContainer>
</template>

<style scoped>
/* 基礎設定與變數 */
.container-layout {
  background-color: #fff;
  min-height: 100vh;
}

/* 核心紫色與選中邏輯 */
.selected-card,
.selected-card-icon,
.color-circle-wrapper {
  --color-selected: #6366f1;
}

/* 電腦版樣式 (min-width: 768px) */
@media (min-width: 768px) {
  .container-layout {
    height: 100vh;
    overflow: hidden;
  }

  .left-panel {
    height: 100vh;
    border-right: 1px solid #eee;
  }

  .form-scroll-area {
    overflow-y: auto;
    flex-grow: 1;
  }

  .right-panel {
    height: 100vh;
    overflow-y: auto;
  }

  /* 電腦版顏色選擇器：維持 5 欄 */
  .color-selector {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
    width: 100%;
    justify-items: center;
  }

  .right-card {
    min-height: 100vh;
  }
}

/* 手機版樣式優化 (max-width: 767px) */
@media (max-width: 767px) {
  :deep(.p-3) {
    padding: 1.25rem !important;
  }

  .mb-2 {
    margin-bottom: 1.5rem !important;
  }

  /* 顏色選擇器調整：改為一行 6 個 */
  .color-selector {
    display: grid;
    grid-template-columns: repeat(6, 1fr) !important;
    gap: 0.5rem;
    width: 100%;
    justify-items: center;
  }

  .color-circle-wrapper {
    max-width: 2.2rem; /* 配合 6 欄縮小圓圈上限 */
  }

  /* 手機版卡片網格與間距 */
  .paper-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.75rem !important;
    padding: 1.25rem !important;
  }

  .card-item {
    height: 9.375rem;
    margin: 0 !important;
  }

  /* 手機版底部固定區 */
  .left-panel .p-3:last-child {
    position: sticky;
    bottom: 0;
    background: #ffffff;
    padding: 1.25rem !important;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.08);
    z-index: 50;
  }
}

/* 通用元件樣式 */
.paper-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  align-content: start;
}

.left-card {
  background-color: white;
  border: none;
  border-radius: 0;
  border-right: 1px solid var(--color-grey-light-1);
}

.right-card {
  background-color: var(--color-grey-light-3);
  border: none;
  border-radius: 0;
  border-right: 1px solid var(--color-grey-light-1);
  box-shadow:
    inset -0.25rem 0 0.375rem rgba(0, 0, 0, 0.03),
    inset 0.25rem 0 0.375rem rgba(0, 0, 0, 0.03);
}

.alert-left,
.alert-right {
  line-height: 2rem;
  font-size: 0.875rem;
}

.alert-right {
  cursor: pointer;
  text-decoration: underline;
}

.card-item {
  flex: 1 1 calc(25% - 2rem);
  margin: 0.5rem;
  height: 10rem;
  border: 1px solid var(--color-grey-light-1);
  border-radius: 0.75rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.card-item:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.selected-card {
  border: 4px solid var(--color-selected);
}

.selected-card-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--color-selected);
  color: white;
  border-radius: 50%;
  padding: 6px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.15));
}

.badge-paper-class {
  display: inline-block;
  margin-top: -7px;
  margin-left: -2px;
  padding: 0.25rem 0.5rem;
  border-radius: 500px;
  background-color: var(--color-grey-light-1);
  color: black;
  font-size: 0.75rem;
  line-height: 1.5;
  text-align: center;
}

.paper-color-dark,
.shortID-dark {
  color: var(--color-grey-dark-2);
  font-size: 0.8rem;
  line-height: 1.4;
}

.paper-color-light,
.shortID-light {
  color: white;
  font-size: 0.8rem;
  line-height: 1.4;
}

/* 5. 顏色選擇器 */
.color-circle-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  width: 100%;
  max-width: 2.8rem;
}

.color-circle-wrapper:hover .color-circle {
  transform: scale(1.3);
}

.color-circle {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 2px solid #eee;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.color-circle.circle-text-color {
  font-size: 0.8rem;
  color: var(--color-grey-dark-3);
  white-space: nowrap;
  overflow: visible;
}

.color-circle-wrapper.selected .color-circle {
  border: 3px solid var(--color-selected);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
}
</style>
