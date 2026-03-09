import { type App } from "vue";

/**
 * 自動化插件引入套件
 * 掃描當前目錄下所有 .ts 檔案，排除 index.ts 與隱藏檔
 */
export default {
  install(app: App) {
    // 1. 取得目錄下所有 .ts 檔案
    // eager: true 表示立即引入，而非懶載入
    const modules = import.meta.glob("./*.ts", { eager: true });

    Object.entries(modules).forEach(([path, definition]: [string, any]) => {
      // 2. 取得檔案名稱 (例如: ./bootstrap.ts -> bootstrap)
      const fileName = path.split("/").pop()?.replace(/\.ts$/, "");

      // 3. 過濾規則：排除 index, 隱藏檔 (_), 或禁用檔 (.disabled)
      if (
        !fileName ||
        fileName === "index" ||
        fileName.startsWith("_") ||
        fileName.includes(".disabled")
      ) {
        return;
      }

      // 4. 執行插件的 install 方法
      // 支援 export default 或具名匯出的 install
      const plugin = definition.default || definition;

      if (plugin && typeof plugin.install === "function") {
        app.use(plugin);
        // console.log(`[Plugin Auto-Load] ✅ Registered: ${fileName}`);
      } else {
        // console.warn(
        //   `[Plugin Auto-Load] ⚠️ ${fileName}.ts missing install method.`,
        // );
      }
    });
  },
};
