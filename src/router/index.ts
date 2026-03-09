// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
    meta: { title: "主頁" },
  },
  {
    path: "/paper-selector",
    name: "PaperSelector",
    component: () =>
      import("@/views/PaperSelectorView.vue"),
    meta: { title: "紙材查詢器" },
  },
  {
    path: "/file-uploader",
    name: "FileUploader",
    component: () =>
      import("@/views/FileUploaderView.vue"),
    meta: { title: "檔案上傳器" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // 切換頁面時自動回到頂部
    return { top: 0 };
  },
});

// 路由守衛：動態切換標題
router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router;
