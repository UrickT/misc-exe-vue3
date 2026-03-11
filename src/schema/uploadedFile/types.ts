/**
 * 「檔案」資料結構
 * * fileSN：唯一序號
 * * originalName：用戶上傳時的原始檔案名稱 (例如: "我的設計稿.png")
 * * fileName：伺服器儲存的唯一檔案名稱 (含時間戳記)
 * * path：檔案在伺服器上的存取路徑 (例如: "uploads/171023456.png")
 * * size：檔案大小 (單位為 Bytes)
 * * mimetype：檔案的媒體類型 (例如: "image/jpeg", "application/pdf")
 * * uploadDate：檔案上傳時間 (ISO 格式字串)
 */
export interface UploadedFile {
  fileSN: number;
  originalName: string;
  fileName: string;
  path: string;
  size: number;
  mimetype: string;
  uploadDate: string;
}
