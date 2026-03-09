import type { FormMode } from "@/schema/.general";

/**
 * 操作權限配置
 * * 定義在哪些模式（create/edit/delete）下該欄位具備功能。
 */
export type FieldFunctionality = Partial<Record<FormMode, boolean>>;

/**
 * 必填規則配置
 * * 定義在哪些模式下該欄位為必填項。
 */
export type FieldRequired = Partial<Record<FormMode, boolean>>;

/**
 * 選項型欄位的數據結構
 * * 用於處理後端 API 回傳的原始資料與 UI 組件選項之間的映射。
 * * data：原始數據陣列，例如從 API 獲取的列表
 * * valueField：對應到選項「值 (Value)」的欄位名稱，例如 'id' 或 'sn'
 * * textField：對應到選項「顯示文字 (Label)」的欄位名稱，例如 'name' 或 'label'
 * * prefixKey?：決定個別選項前，是否需要顯示特定值
 */
export interface FieldOptions {
  /** 允許 data 是陣列，或是包在 Ref/Computed 裡的陣列 */
  data: any[] | ComputedRef<any[]> | Ref<any[]>;
  valueField: string;
  textField: string;
  prefixKey?: string;
}

/**
 * 所有欄位的共用基礎屬性
 * * key：後端對應的欄位 Key，也是表單提交時的屬性名稱
 * * label：欄位顯示的標題名稱
 * * hasDatabase：是否已在資料庫建立對應欄位。若為 false，通常用於前端純展示或邏輯計算。預設建議為 false。
 * * hasFunctionality：各種操作模式下的權限設定。預設由 Factory 補足。
 * * isRequired：各種操作模式下是否必填。預設由 Factory 補足。
 * * validator：自定義驗證。
 * * placeholder?：輸入框內的提示佔位文字。預設建議為空字串 ""。
 */
interface BaseFieldConfig {
  key: string;
  label: string;
  hasDatabase?: boolean;
  hasFunctionality?: FieldFunctionality;
  isRequired?: FieldRequired;
  validator?: (value: any) => boolean | string | null;
  placeholder?: string;
}

/**
 * 一般類型配置 (文字、日期)
 * * type：欄位類型：文字、日期
 */
export interface GeneralFieldConfig extends BaseFieldConfig {
  type: "text" | "date";
}

/**
 * 數字類型專用配置
 * * type：欄位類型：數字
 * * min?：允許輸入的最小值
 * * max?：允許輸入的最大值
 */
export interface NumberFieldConfig extends BaseFieldConfig {
  type: "number";
  min?: number;
  max?: number;
}

/**
 * 選項類型專用配置 (如下拉選單、單選框等)
 * * type：欄位類型：下拉選單、多選下拉、單選框、開關切換
 * * options：資料來源與欄位映射設定
 * * defaultValue?：欄位的預設選中值
 */
export interface SelectFieldConfig extends BaseFieldConfig {
  type: "select" | "multi-select" | "radio" | "switch";
  options: FieldOptions;
  defaultValue?: any | any[];
}

/** 聯合型別 */
export type FieldConfig =
  | NumberFieldConfig
  | SelectFieldConfig
  | GeneralFieldConfig;
