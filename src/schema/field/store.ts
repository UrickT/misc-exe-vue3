import { defineStore } from "pinia";
import type { FieldConfig } from "@/schema/field";

export const useFieldStore = defineStore("field", {
  getters: {
    /** 尋找對應的 FieldConfig */
    fieldOf: () => (key: string, fieldConfigs: FieldConfig[]) => {
      const field = fieldConfigs.find((f) => f.key === key);
      if (!field && import.meta.env.DEV) {
        console.warn(`[fieldOf] 找不到 Key: "${key}"`);
      }
      return field;
    },

    /**
     * 驗證輸入欄位狀態
     * 注意：這裡必須回傳一個函式，才能讓組件傳參數進來
     */
    inputState: () => {
      // 將判斷邏輯抽離，保持 getter 乾淨
      const isEmptyValue = (val: any) =>
        val === null ||
        val === undefined ||
        val === "" ||
        (typeof val === "string" && val.trim() === "") ||
        val === "--請選擇--" ||
        (Array.isArray(val) && val.length === 0);

      // 真正執行驗證的函式
      return (
        requireData: boolean,
        data: any,
        validator: Function | null = null, // 預設參數 (Default Parameter)
      ): boolean | null => {
        let isEmpty: boolean;

        if (_.isPlainObject(data)) {
          isEmpty = _.every(data, isEmptyValue);
        } else if (Array.isArray(data)) {
          isEmpty = _.every(data, isEmptyValue);
        } else {
          isEmpty = isEmptyValue(data);
        }

        if (isEmpty) {
          return requireData ? false : null;
        }

        if (typeof validator === "function") {
          return validator(data);
        }

        return true;
      };
    },
  },
});
