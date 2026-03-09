import type { InputConfig } from "./types";

/**
 * 定義輸入框配置的工廠函式
 * @param config 必須包含 field 與 mode，其餘 UI 設定為選填
 */
export const defineInput = (
  config: Partial<InputConfig> & Pick<InputConfig, "mode">,
): InputConfig => {
  // 排除所有邏輯欄位
  const defaultConfig: Omit<
    InputConfig,
    | "mode"
    | "label"
    | "placeholder"
    | "hint"
    | "errorHint"
  > = {
    currentValue: null,
    stateOfCurrentValue: null,
    layout: [3, 9],
    noMargin: false,
    margin: "mb-3",
    isClearable: false,
    isDisabled: false,
    labelPosition: "left",
  };

  // 直接回傳一個被 reactive 包裹的全新物件
  // 這樣這個物件在記憶體中就是唯一且獨立的「響應式代理」
  return reactive({
    ...defaultConfig,
    ...config,
  }) as InputConfig;
};
