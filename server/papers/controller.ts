import { Request, Response } from "express";
import { PaperModel } from "./model";

export const paperController = {
  getAll: async (req: Request, res: Response) => {
    console.log("🔔 後端收到請求了！正在查詢資料庫...");
    try {
      const data = await PaperModel.find().sort({ displayOrder: 1 }).lean();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Database Error", error: err });
    }
  },
  getBySn: async (req: any, res: any) => {
    try {
      // 1. 先將 URL 參數轉為數字
      const snNumber = Number(req.params.sn);

      // 檢查是否為有效數字，避免 NaN 傳入資料庫
      if (isNaN(snNumber)) {
        return res.status(400).json({ message: "Invalid SN format" });
      }

      // 2. 查詢時明確指定型別
      const data = await PaperModel.findOne({
        paperSN: snNumber, // 使用轉換後的數字
      }).lean();

      if (!data) return res.status(404).json({ message: "Data not found" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  },
};
