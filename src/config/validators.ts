import { dayjs } from "@/plugins/dayjs";

// 橋接工具範例（適配 element plus）
export const wrapValidator = (
  validatorFn: (val: any) => boolean | string | null | undefined,
  errorMsg: string = "輸入格式有誤",
) => {
  return (_rule: any, value: any, callback: any) => {
    // 新增：如果值是空字串、null 或 undefined，視為「未輸入」，不執行格式驗證
    if (value === "" || value === null || value === undefined) {
      return callback();
    }

    const result = validatorFn(value);

    // 通過條件：true, null, undefined
    if (result === true || result === null || result === undefined) {
      callback();
    } else {
      // 失敗：優先使用驗證器回傳的字串訊息
      const finalMessage = typeof result === "string" ? result : errorMsg;
      callback(new Error(finalMessage));
    }
  };
};

/** 範圍驗證參數介面 */
interface NumberRangeOptions {
  value: number | string | null | undefined;
  min?: number;
  max?: number;
}

/** 日期範圍參數介面 */
interface DateRange {
  startDate: string | Date | null | undefined;
  endDate: string | Date | null | undefined;
}

export const isValidNone = (): boolean => {
  return true;
};

export const isValidString = (val: any): val is string => {
  return (
    val !== null && val !== "" && val !== undefined && typeof val === "string"
  );
};

/** 判斷是否為有效正數（大於 0） */
export const isValidPositiveNumber = (val: string | number): boolean => {
  if (!val || isNaN(Number(val))) return false;
  return Number(val) > 0;
};

/** 判斷是否為有效數字（非負數，>=0） */
export const isValidNonNegativeNumber = (
  val: string | number | null | undefined,
): boolean => {
  if (val === null || val === undefined || val === "") return false;
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

export const isValidNoneAndNumber = (
  val: string | number | null | undefined,
): boolean => {
  // 修正：原本少寫了 return
  return val === null || (!isNaN(Number(val)) && val !== "");
};

/** 驗證數字是否在指定範圍內 */
export const isValidNumberRange = ({
  value,
  min = -Infinity,
  max = Infinity,
}: NumberRangeOptions): boolean => {
  if (value === null || value === undefined || value === "") return false;
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

export const isValidBool = (bool: any): bool is boolean => {
  return typeof bool === "boolean";
};

export const isValidArray = (array: any): array is any[] => {
  return Array.isArray(array);
};

/** * 簡化版：驗證日期 "YYYY-MM-DD"
 * 解決 Argument of type 'string | undefined' 報錯
 */
export const isValidDate = (val: any): val is string => {
  // 1. 先處理基本的非空與型別檢查
  if (typeof val !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return false;
  }

  // 2. 利用 dayjs 的嚴格模式 (true) 進行邏輯檢查（含閏年、大月小月）
  // 這裡不需要再手動 split("-") 或算 Leap Year 了
  return dayjs(val, "YYYY-MM-DD", true).isValid();
};

/** 檢查字串是否為有效的日期時間 "YYYY/MM/DD HH:mm" */
export const isValidDateTime = (
  dateTimeStr: string | null | undefined,
): boolean => {
  if (!dateTimeStr) return false;
  const regex = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/;
  if (!regex.test(dateTimeStr)) return false;
  return dayjs(dateTimeStr, "YYYY/MM/DD HH:mm", true).isValid();
};

/** * 驗證日期區間是否合法
 * 1. 兩者皆必須有值
 * 2. 格式必須正確
 * 3. 開始日期必須小於或等於結束日期
 */
export const isValidDateRange = (
  dateRange: DateRange | null | undefined,
): boolean => {
  // 1. 防禦性編程：防止 dateRange 為空
  if (!dateRange) return false;

  const { startDate, endDate } = dateRange;

  // 2. 檢查是否有值 (避免空字串或 null)
  if (!startDate || !endDate) return false;

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // 3. 驗證日期合法性並比較
  // 因為在 plugin 已經 extend(isSameOrBefore)，這裡直接呼叫
  return start.isValid() && end.isValid() && start.isSameOrBefore(end);
};

export const isValidFile = (file: File | null | undefined): boolean => {
  return !!file?.name;
};

export const isValidCitizenId = (citizenId: string): boolean => {
  const regex = /^[A-Z]\d{9}$/;
  return regex.test(citizenId);
};

export const isValidTelephone = (telephone: string): boolean => {
  const regex = /^\d{9,10}$/;
  return regex.test(telephone);
};

export const isValidCellphone = (cellphone: string): boolean => {
  const regex = /^\d{10}$/;
  return regex.test(cellphone);
};

export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/** * 驗證地址格式（假設格式為：郵遞區號，縣市，行政區，詳細地址）
 * 支援輸入：string | null | undefined
 */
export const isValidAddress = (val: any): val is string => {
  if (!isValidString(val)) return false;

  const [zip, city, dist, addr] = val.replace(/,/g, "，").split("，");

  // 檢查是否有四個部分，且每一部分都符合其格式
  return (
    isValidPositiveNumber(zip?.trim() ?? "") &&
    isValidString(city?.trim()) &&
    isValidString(dist?.trim()) &&
    isValidString(addr?.trim())
  );
};

export const isValidStringLengthBetween4And6 = (val: any): boolean => {
  return typeof val === "string" && /^[\s\S]{4,6}$/.test(val);
};

export const isValidStringLengthBetween4And8 = (val: any): boolean => {
  return typeof val === "string" && /^[\s\S]{4,8}$/.test(val);
};

/** * 台灣統一編號驗證 (VAT ID / Business Tax ID)
 * 規則：8 位數字，經權重相乘後之積數和須為 5 的倍數。
 * 若第七位數為 7，積數和 + 1 後若能被 5 整除亦為有效。
 */
export const isValidVATId = (val: any): val is string => {
  // 1. 基礎檢查：必須是 8 位數純數字字串
  if (!val || typeof val !== "string" || !/^\d{8}$/.test(val)) {
    return false;
  }

  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const vatArray = val.split("").map(Number);

  // 2. 計算加權總和
  const sum = vatArray.reduce((acc, num, idx) => {
    const weight = weights[idx] ?? 0; // 如果是 undefined，就當作 0
    const product = num * weight;
    return acc + Math.floor(product / 10) + (product % 10);
  }, 0);

  // 3. 判斷邏輯
  // 情況 A: 總和可被 5 整除
  if (sum % 5 === 0) return true;

  // 情況 B: 第七位數為 7，且 (總和 + 1) 可被 5 整除
  // 注意：索引是從 0 開始，所以第七位是 vatArray[6]
  if (vatArray[6] === 7 && (sum + 1) % 5 === 0) {
    return true;
  }

  return false;
};

export const isValidPosIntOrZero = (value: any): boolean => {
  if (typeof value !== "string" && typeof value !== "number") return false;
  const strValue = String(value).trim();
  if (!/^\d+$/.test(strValue)) return false;
  const num = Number(strValue);
  return Number.isInteger(num) && num >= 0;
};

// 直接宣告一個具名常數並匯出
export const VALIDATORS = {
  isValidAddress,
  isValidArray,
  isValidBool,
  isValidCellphone,
  isValidCitizenId,
  isValidDate,
  isValidDateRange,
  isValidDateTime,
  isValidEmail,
  isValidFile,
  isValidNone,
  isValidNoneAndNumber,
  isValidNonNegativeNumber,
  isValidNumberRange,
  isValidPosIntOrZero,
  isValidPositiveNumber,
  isValidString,
  isValidStringLengthBetween4And6,
  isValidStringLengthBetween4And8,
  isValidTelephone,
  isValidVATId,
};
