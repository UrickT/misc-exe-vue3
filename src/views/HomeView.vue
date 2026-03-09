<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const navigateToView = (name: string) => {
  router.push({ name: name });
};

const cardList = [
  {
    title: "紙材選擇器",
    route: "PaperSelector",
    description: "查詢與選擇紙張",
  },
  { title: "檔案上傳器", route: "FileUploader", description: "內容預留區" },
  { title: "（待）", route: "Home", description: "內容預留區" },
];
</script>

<template>
  <div class="p-4 p-md-5 min-vh-100">
    <BRow class="g-4 d-flex justify-content-center align-items-center">
      <BCol
        v-for="(card, index) in cardList"
        :key="card.title"
        cols="12"
        md="4"
      >
        <ElCard
          shadow="hover"
          class="h-100 clickable-card"
          @click="navigateToView(card.route)"
        >
          <template #header>
            <div class="font-bold">{{ index + 1 }}. {{ card.title }}</div>
          </template>
          <div class="card-content">
            <p class="text-muted">{{ card.description }}</p>
          </div>
        </ElCard>
      </BCol>
    </BRow>
  </div>
</template>

<style scoped>
.clickable-card {
  cursor: pointer;
  border-radius: 0.7rem;
}
.font-bold {
  font-weight: 700;
  font-size: 1.1rem;
}
</style>
