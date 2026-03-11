import { API_ROUTES } from "@/api/apiCollectionsFrontend";
import { REQUEST } from "@/api/apiClient";
import { type UploadedFile } from "@/schema/uploadedFile";

export const uploadedFileApi = {
  /** 獲取所有檔案清單 */
  getAll: () => REQUEST<UploadedFile[]>(API_ROUTES.UPLOADED_FILE.GET_ALL),

  /** 根據 SN 獲取單一檔案 */
  // 💡 這裡建議也改成一致的呼叫方式
  getBySn: (sn: number) =>
    REQUEST<UploadedFile>(API_ROUTES.UPLOADED_FILE.GET_BY_SN(sn)),

  /** 上傳檔案 (FormData) */
  upload: (rawFile: File) => {
    const formData = new FormData();
    formData.append("file", rawFile);
    return REQUEST<UploadedFile>(API_ROUTES.UPLOADED_FILE.UPLOAD, {
      method: "POST",
      body: formData,
    });
  },

  /** 根據 SN 刪除 */
  deleteBySn: (sn: number) => {
    const url = API_ROUTES.UPLOADED_FILE.DELETE_BY_SN(sn);
    return REQUEST<{ message: string }>(url, {
      method: "DELETE",
    });
  },
};
