/// <reference types="vitest/config" />
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { BootstrapVueNextResolver } from "bootstrap-vue-next";

// https://vite.dev/config/
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const LOCAL_URL = "http://localhost:3008";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  server: {
    proxy: {
      "/api_1": {
        target: LOCAL_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_1/, "/misc-exe-vue3-api"),
        configure: (proxy, _options) => {
          // proxy 是 http-proxy 的實例
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            console.log("真實送到後端的路徑：", proxyReq.path);
          });
          proxy.on("proxyRes", (_proxyRes, req, _res) => {
            // 注意：這裡直接抓不到原本定義的 BASE_URL，通常印出 req.url 即可
            console.log("前端原始請求路徑：", req.url);
          });
        },
      },
    },
  },
  plugins: [
    vue(),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
        {
          lodash: [["default", "_"]],
          "@/config/validators": [["default", "VALIDATORS"]],
        },

        // 自定義想自動引入的函式庫
      ],
      // 自動引入自己寫的工具函式目錄
      dirs: ["./src/schema/**", "./src/mock/**", "./src/config/**"],
      // 生成類型宣告檔，讓 TS 不會報錯
      dts: "src/auto-imports.d.ts",
      eslintrc: {
        enabled: true, // 產生 .eslintrc-auto-import.json
      },
      vueTemplate: true, // 支援在 <template> 裡也能直接用 _ 或工具函式
    }),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
  ],
  resolve: {
    alias: {
      // 設置 @ 指向 src 目錄
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
