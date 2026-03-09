import { type App } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 中文語系
import zhTw from "element-plus/es/locale/lang/zh-tw";

export default {
  install: (app: App) => {
    // 註冊整個 ElementPlus（包含語系設定）
    app.use(ElementPlus, {
      locale: zhTw,
    });
  },
};