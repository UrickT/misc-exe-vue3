import type { FormMode } from "../.general/index";
import type { FieldRequired } from "@/schema/field";

/** 
 * 佈局比例配置
 * * [Label格數, Input格數] 或 [Label格數, Input格數, Offset/額外空間格數]
 */
export type InputLayout = [number, number] | [number, number, number];

/** 
 * 所有輸入框組件 (FormInputContainer) 的共用基礎屬性
 * * mode：目前表單的操作模式 (create / edit / view 等)
 * * currentValue：當前欄位的輸入值 (v-model 綁定的值)
 * * stateOfCurrentValue：當前數值的驗證狀態。true: 通過, false: 失敗, null: 未驗證
 * * layout：柵格佈局比例，例如 [3, 9]
 * * noMargin：是否移除所有預設外距 (常用於緊湊型佈局) ，優先度高於 margi
 * * margin：自定義外距 (Margin) 數值
 * * isClearable：是否支援清除
 * * isDisabled：是否禁用輸入
 * * label?：欄位顯示的標題名稱
 * * labelPosition：label 位置
 * * size?：欄位大小
 * * placeholder?：輸入框內的提示佔位文字。預設建議為空字串 ""。
 * * hint?：欄位下方的輔助提示文字
 * * errorHint?：錯誤提示訊息。當驗證失敗時傳入字串
 * * isRequired?：各種操作模式下是否必填。預設由 Factory 補足。
 */
export interface InputConfig {
  mode: FormMode;

  currentValue: any | null;
  stateOfCurrentValue: boolean | null;

  label?: string;
  labelPosition: "left" | "right" | "top";
  layout: InputLayout;
  size?: "large" | "small",
  noMargin: boolean;
  margin: string;
  placeholder?: string;

  isClearable: boolean;
  isDisabled: boolean;
  isRequired?: FieldRequired;

  hint?: string | string[];
  errorHint?: string; 

}