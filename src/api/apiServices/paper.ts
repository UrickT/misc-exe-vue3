import { API_ROUTES } from "@/api/apiCollectionsFrontend";
import { type Paper } from "@/schema/paper";

export const paperApi = {
  getAll: async (): Promise<Paper[]> => {
    try {
      const url = API_ROUTES.PAPER.GET_ALL;
      console.log("url: ", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error("API Fetching Error:", error);
      throw error;
    }
  },
};
