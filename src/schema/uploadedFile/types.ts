/**
 * 「檔案」資料結構 (Cloudinary 雲端儲存版)
 * * fileSN：唯一序號
 * * originalName：用戶上傳時的原始檔案名稱 (例如: "我的設計稿.png")
 * * path：Cloudinary 提供的完整 HTTPS 存取網址 (例如: "https://res.cloudinary.com/...")
 * * publicID：Cloudinary 的管理 ID，用於刪除或轉換圖片 (例如: "misc-exe-vue3/171023456")
 * * size：檔案大小 (單位為 Bytes)
 * * mimetype：檔案的媒體類型 (例如: "image/jpeg", "application/pdf")
 * * uploadDate：檔案上傳時間 (ISO 格式字串)
 */
export interface UploadedFile {
  fileSN: number;
  originalName: string;
  path: string;
  publicID: string;
  size: number;
  mimetype: string;
  uploadDate: string;
}
