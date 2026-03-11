import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import * as dotenv from "dotenv";
import serverless from "serverless-http";

import { API_ROUTES } from "./apiCollectionsBackend";

import paperRoutes from "./papers";

dotenv.config();

const app = express();
const PORT: number = Number(process.env.PORT) || 3008;
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI || "";
mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 5000, // 5秒沒連上就放棄，不要一直卡著
  })
  .then(() => console.log("✅ [MongoDB] 連線成功！"))
  .catch((err) => {
    console.error("❌ 連線失敗詳細資訊：");
    console.error(`原因: ${err.message}`);
  });

// 路由掛載
app.use(API_ROUTES.PAPER.BASE, paperRoutes);

// 本地開發時繼續用這個
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log(`🚀 Server 已經在 http://0.0.0.0:${PORT} 啟動了！`);
    console.log("=================================");
  });
}

// 部署到 Netlify 時，輸出這個 handler
export const handler = serverless(app);
