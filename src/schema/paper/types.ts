/**
 * 「紙材」資料結構
 * * paperSN：紙張唯一序號
 * * paperCategory：紙張總體類別 ID (例如: A, B, C)
 * * paperClass：紙張分類名稱 (例如: 包裝紙、美術紙)
 * * paperName：紙材名稱 (顯示於 UI 的主要名稱)
 * * paperColor：紙材顏色名稱 (若無則為空字串)
 * * paperWeight：紙材重量 (基重，通常以 P 或 g 為單位)
 * * shortID：紙材代號 (縮寫，例如: E59)
 * * default：是否為預設選中的紙材
 * * displayOrder：排序序號 (數值越小排在越前面)
 */
export interface Paper {
  paperSN: number;
  paperCategory: string;
  paperClass: string;
  paperName: string;
  paperColor: string;
  paperWeight: string;
  shortID: string;
  default: boolean;
  displayOrder: number;
}

/** 
 * 「紙材」擴充後資料結構 
 * * 十六進位顏色代碼 (如: #FFFFFF)，根據顏色名稱對應 
 */
export interface PaperWithColor extends Paper {
  hexColor: string;
}
