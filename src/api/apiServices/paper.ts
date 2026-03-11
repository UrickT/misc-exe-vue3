import { API_ROUTES } from "@/api/apiCollectionsFrontend";
import { REQUEST } from "@/api/apiClient";
import { type Paper } from "@/schema/paper";

export const paperApi = {
  /** 獲取所有紙材清單 */
  getAll: () => REQUEST<Paper[]>(API_ROUTES.PAPER.GET_ALL),

  /** 根據 SN 獲取單一紙材 */
  getBySn: (sn: number) =>
    REQUEST<Paper>(`${API_ROUTES.PAPER.GET_BY_SN}/${sn}`),
};
