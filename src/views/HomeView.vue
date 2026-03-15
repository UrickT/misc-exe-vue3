<script setup lang="ts">
import { useRouter } from "vue-router";

// 定義作品集卡片介面
interface PortfolioCard {
  title: string;
  route: string;
  description: string;
  tags: string[];
}

const router = useRouter();

const cardList: PortfolioCard[] = [
  {
    title: "紙材選擇器",
    route: "PaperSelector",
    description:
      "針對印刷產業開發。結合動態篩選演算法，將上百種紙張規格轉化為直觀的檢索介面，解決傳統查詢耗時的問題。",
    tags: ["Vue 3", "MongoDB"],
  },
  {
    title: "檔案上傳器",
    route: "FileUploader",
    description:
      "整合雲端儲存與 JSZip 技術。克服跨來源 (CORS) 預覽衝突，支援多格式即時預覽與前端批量壓縮下載。",
    tags: ["Cloudinary", "JSZip", "MongoDB"],
  },
];

/**
 * 頁面跳轉導航
 * @param routeName 路由名稱
 */
const navigateToView = (routeName: string) => {
  router.push({ name: routeName });
};
</script>

<template>
  <div class="portfolio-container p-4 p-md-5 min-vh-100">
    <BRow class="g-4 d-flex justify-content-center align-items-center">
      <BCol
        v-for="(card, index) in cardList"
        :key="card.title"
        cols="12"
        md="6"
        lg="4"
      >
        <ElCard
          shadow="hover"
          class="h-100 clickable-card border-0"
          @click="navigateToView(card.route)"
        >
          <template #header>
            <div class="d-flex align-items-center justify-content-between">
              <span class="font-bold text-lg text-dark">{{ card.title }}</span>
              <span class="index-number">{{
                (index + 1).toString().padStart(2, "0")
              }}</span>
            </div>
          </template>

          <div class="card-content d-flex flex-column h-100">
            <p class="description-text mb-4 flex-grow-1">
              {{ card.description }}
            </p>

            <div class="mt-auto">
              <div class="d-flex flex-wrap gap-2">
                <span v-for="tag in card.tags" :key="tag" class="tech-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </ElCard>
      </BCol>
    </BRow>
  </div>
</template>

<style scoped>
.portfolio-container {
  background-color: #ffffff;
}

.clickable-card {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border: 1px solid #eeeeee !important; /* 極細淺灰邊框 */
  background-color: #ffffff;
}

/* 懸停效果：黑色加深與位移 */
.clickable-card:hover {
  transform: translateY(-5px);
  border-color: #c0c0c0 !important; /* 懸浮時邊框變黑 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
}

.index-number {
  font-family: "Inter", sans-serif;
  font-size: 0.8rem;
  color: #bbbbbb; /* 淺灰色序號 */
  letter-spacing: 1px;
}

.font-bold {
  font-weight: 600;
  color: #1a1a1a; /* 深近黑色 */
}

.description-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #666666; /* 中灰色描述 */
}

.tech-tag {
  font-size: 0.7rem;
  padding: 3px 12px;
  background-color: #f5f5f5;
  color: #333333; /* 深灰文字 */
  border: 1px solid #e0e0e0;
  border-radius: 4px; /* 方中帶圓的硬朗風格 */
  font-weight: 500;
  transition: all 0.2s ease;
}

.card-content {
  min-height: 110px;
}
</style>
