import type {
  FieldConfig,
  FieldFunctionality,
  FieldRequired,
  SelectFieldConfig,
  NumberFieldConfig,
  GeneralFieldConfig,
} from "./types";

/** 全域預設行為設定 - 決定哪些模式下該欄位可用 */
const DEFAULT_FUNCTIONALITY: FieldFunctionality = {
  create: true,
  edit: true,
  delete: false,
  view: false,
  search: true,
};

/** 全域預設必填設定 - 決定哪些模式下該欄位必填 */
const DEFAULT_REQUIRED: FieldRequired = {
  create: false,
  edit: false,
  delete: false,
  view: false,
  search: false,
};

/** 基礎共用預設值 */
const BASE_DEFAULTS = {
  // key
  // label
  hasDatabase: true,
  hasFunctionality: { ...DEFAULT_FUNCTIONALITY },
  isRequired: { ...DEFAULT_REQUIRED },
  validator: (_value?: any): boolean | string | null => null, // 加上 (_value?: any)，告訴 TS 這是一個可以收參數的函式
  // placeholder?
};

// --- 函式過載 (Function Overloads) ---

/** 情境 1：當類型為 select 等選項類時，強制要求 options */
export function defineField(
  config: Omit<GeneralFieldConfig, keyof typeof BASE_DEFAULTS> &
    Partial<typeof BASE_DEFAULTS>,
): GeneralFieldConfig;

/** 情境 2：當類型為 number 時，可選填 max, min */
export function defineField(
  config: Omit<NumberFieldConfig, keyof typeof BASE_DEFAULTS> &
    Partial<typeof BASE_DEFAULTS>,
): NumberFieldConfig;

/** 情境 3：當類型為 text 或 date 時 */
export function defineField(
  config: Omit<SelectFieldConfig, keyof typeof BASE_DEFAULTS> &
    Partial<typeof BASE_DEFAULTS>,
): SelectFieldConfig;

/** 最終實作：將預設值與傳入配置合併 */
export function defineField(config: any): FieldConfig {
  return reactive({
    ...BASE_DEFAULTS,
    ...config,
    // 確保物件內部的權限/必填屬性是展開合併，而非直接覆蓋（選填）
    hasFunctionality: {
      ...BASE_DEFAULTS.hasFunctionality,
      ...config.hasFunctionality,
    },
    isRequired: { ...BASE_DEFAULTS.isRequired, ...config.isRequired },
  }) as FieldConfig;
}
