import { type App, defineAsyncComponent } from "vue";

export default {
  install(app: App) {
    // 1. 掃描當前目錄下所有的 .vue 檔案
    const components = import.meta.glob("./*.vue");

    Object.entries(components).forEach(([path, loader]) => {
      // 2. 從路徑中提取檔案名稱 (例如: ./FormInputGeneral.vue -> FormInputGeneral)
      const fileName = path
        .split("/")
        .pop()
        ?.replace(/\.vue$/, "");

      if (fileName) {
        // 3. 註冊全域組件
        // 使用 defineAsyncComponent 可以優化效能，只有用到時才載入
        app.component(fileName, defineAsyncComponent(loader as any));

        // console.log(`[Component Auto-Load] ✅ Registered: ${fileName}`);
      }
    });
  },
};
