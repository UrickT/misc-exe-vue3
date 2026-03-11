<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  mdiClose,
  mdiUpload,
  mdiFileDocumentOutline,
  mdiFilePdfBox,
  mdiFileWord,
  mdiFileExcel,
  mdiChevronLeft,
  mdiDownload,
  mdiCheckCircle,
  mdiCheckBold,
} from "@mdi/js";
import SvgIcon from "@/components/atoms/SvgIcon.vue";
import { uploadedFileApi } from "@/api/apiServices/uploadedFile";
import type { UploadedFile } from "@/schema/uploadedFile";
import JSZip from "jszip";

// --- 狀態與資料邏輯 ---
const isMultiSelectMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const fileInput = ref<HTMLInputElement | null>(null);
const showPreviewOnMobile = ref(false);
const serverFiles = ref<UploadedFile[]>([]);
const temporaryFiles = ref<any[]>([]);

const currentPreview = reactive({
  id: "",
  name: "",
  mediaType: "",
  previewUrl: undefined as string | undefined,
  isServer: false,
});

onMounted(async () => {
  await fetchServerFiles();
});

const fetchServerFiles = async () => {
  try {
    const data = await uploadedFileApi.getAll();
    serverFiles.value = data;
  } catch (error) {
    console.error("無法獲取檔案清單", error);
  }
};

const allFilesDisplay = computed(() => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8201";
  const server = serverFiles.value.map((f) => {
    const ext = f.originalName.split(".").pop()?.toLowerCase();
    let mediaType = "other";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext!))
      mediaType = "image";
    else if (ext === "pdf") mediaType = "pdf";
    else if (["doc", "docx"].includes(ext!)) mediaType = "word";
    else if (["xls", "xlsx", "csv"].includes(ext!)) mediaType = "excel";
    return {
      id: `server-${f.fileSN}`,
      isServer: true,
      name: decodeURIComponent(f.originalName),
      mediaType,
      previewUrl: `${baseUrl}/${f.path.replace(/\\/g, "/")}`,
    };
  });
  const local = temporaryFiles.value.map((f, index) => ({
    ...f,
    id: `local-${index}`,
    isServer: false,
  }));
  return [...server, ...local];
});

const handleDownloadAction = async () => {
  if (isMultiSelectMode.value) {
    if (selectedIds.value.size === 0) return;
    const zip = new JSZip();
    const filesToZip = allFilesDisplay.value.filter((f) =>
      selectedIds.value.has(f.id),
    );
    for (const f of filesToZip) {
      const res = await fetch(f.previewUrl!);
      const blob = await res.blob();
      zip.file(f.name, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveBlob(content, `批量下載_${Date.now()}.zip`);
  } else if (currentPreview.previewUrl) {
    const res = await fetch(currentPreview.previewUrl);
    const blob = await res.blob();
    saveBlob(blob, currentPreview.name);
  }
};

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const setPreview = (file: any) => {
  if (isMultiSelectMode.value) {
    if (selectedIds.value.has(file.id)) selectedIds.value.delete(file.id);
    else selectedIds.value.add(file.id);
    return;
  }
  Object.assign(currentPreview, file);
  if (window.innerWidth < 768) showPreviewOnMobile.value = true;
};
</script>

<template>
  <div class="uploader-fullscreen">
    <div class="row g-0 h-100 flex-nowrap">
      <div
        class="col-12 col-md-5 d-flex flex-column border-end list-section"
        :class="{ 'mobile-hidden': showPreviewOnMobile }"
      >
        <div class="section-header px-3">
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="d-flex align-items-center gap-2">
              <h6 class="mb-0 fw-bold title-text">
                檔案管理 ({{ allFilesDisplay.length }})
              </h6>
              <button
                class="btn-add-outline"
                @click="
                  isMultiSelectMode = !isMultiSelectMode;
                  selectedIds.clear();
                "
              >
                {{ isMultiSelectMode ? "離開多選" : "開啟多選" }}
              </button>
            </div>
            <button class="btn-add" @click="fileInput?.click()">
              <SvgIcon :path="mdiUpload" :size="16" /> 新增
            </button>
            <input ref="fileInput" type="file" multiple class="d-none" />
          </div>
        </div>

        <div class="list-body flex-grow-1 overflow-auto p-3">
          <div class="file-grid">
            <div
              v-for="file in allFilesDisplay"
              :key="file.id"
              class="file-item"
              :class="{
                active: currentPreview.id === file.id,
                'is-selected': selectedIds.has(file.id),
              }"
              @click="setPreview(file)"
            >
              <div class="thumb-container">
                <div
                  v-if="isMultiSelectMode && selectedIds.has(file.id)"
                  class="selected-mask"
                >
                  <div class="check-circle-main">
                    <SvgIcon :path="mdiCheckBold" :size="20" color="#fff" />
                  </div>
                </div>
                <img
                  v-if="file.mediaType === 'image'"
                  :src="file.previewUrl"
                  class="thumb-img"
                />
                <SvgIcon
                  v-else
                  :path="
                    file.mediaType === 'pdf'
                      ? mdiFilePdfBox
                      : file.mediaType === 'word'
                        ? mdiFileWord
                        : file.mediaType === 'excel'
                          ? mdiFileExcel
                          : mdiFileDocumentOutline
                  "
                  :size="28"
                  :class="`icon-${file.mediaType}`"
                />
                <div v-if="file.isServer" class="status-badge">
                  <SvgIcon :path="mdiCheckCircle" :size="14" />
                </div>
                <button class="btn-delete" @click.stop="">
                  <SvgIcon :path="mdiClose" :size="12" />
                </button>
              </div>
              <div class="thumb-label">{{ file.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="col-12 col-md-7 d-flex flex-column preview-section bg-light"
        :class="{ 'mobile-visible': showPreviewOnMobile }"
      >
        <div class="section-header px-3">
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="d-flex align-items-center overflow-hidden">
              <button
                class="btn-back d-md-none"
                @click="showPreviewOnMobile = false"
              >
                <SvgIcon :path="mdiChevronLeft" :size="24" />
              </button>
              <span class="ms-2 fw-bold text-truncate preview-title">
                {{
                  isMultiSelectMode
                    ? `已選取 ${selectedIds.size} 個檔案`
                    : currentPreview.name || "檔案預覽"
                }}
              </span>
            </div>
            <button
              v-if="
                isMultiSelectMode ? selectedIds.size > 0 : currentPreview.name
              "
              class="btn-add"
              @click="handleDownloadAction"
            >
              <SvgIcon :path="mdiDownload" :size="18" />
              <span class="ms-1">{{
                isMultiSelectMode ? "打包下載" : "下載"
              }}</span>
            </button>
          </div>
        </div>

        <div class="preview-body">
          <template v-if="!isMultiSelectMode && currentPreview.name">
            <img
              v-if="currentPreview.mediaType === 'image'"
              :src="currentPreview.previewUrl"
              class="main-preview-img"
            />
            <iframe
              v-else-if="currentPreview.mediaType === 'pdf'"
              :src="currentPreview.previewUrl"
              class="main-preview-pdf"
            ></iframe>

            <div v-else class="no-preview-card text-center">
              <div
                class="icon-circle mb-4"
                :class="`bg-light-${currentPreview.mediaType}`"
              >
                <SvgIcon
                  :path="
                    currentPreview.mediaType === 'word'
                      ? mdiFileWord
                      : currentPreview.mediaType === 'excel'
                        ? mdiFileExcel
                        : mdiFileDocumentOutline
                  "
                  :size="64"
                  :class="`icon-${currentPreview.mediaType}`"
                />
              </div>
              <h4 class="fw-bold name-display mb-2 text-truncate w-100">
                {{ currentPreview.name }}
              </h4>
              <p class="text-muted info-text mb-4">
                此檔案類型不支援預覽，請下載後查看
              </p>
              <!-- <button class="btn-add mx-auto" @click="handleDownloadAction">
                <SvgIcon :path="mdiDownload" :size="18" /> 立即下載
              </button> -->
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 佈局與齊平 Header --- */
.uploader-fullscreen {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #fff;
}
.section-header {
  height: 4rem;
  border-bottom: 0.0625rem solid #eee;
  background: #fff;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* --- 文字樣式 --- */
.title-text,
.preview-title {
  font-size: 1rem;
}
.name-display {
  font-size: 1.25rem;
  color: #1f2937;
  padding: 0 1rem;
}
.info-text {
  font-size: 0.875rem;
}

/* --- 統一橢圓按鈕 --- */
.btn-add {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.5rem 1.125rem;
  border-radius: 1.5625rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  transition: 0.2s;
}
.btn-add-outline {
  background: white;
  color: #4b5563;
  border: 0.0625rem solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 1.5625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  height: 2.25rem;
  transition: 0.2s;
}

/* --- 檔案列表 (不放大) --- */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.25rem, 1fr));
  gap: 1rem;
}
.thumb-container {
  aspect-ratio: 1;
  background: #f9fafb;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 0.125rem solid transparent;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}
.file-item.active .thumb-container {
  border-color: #6366f1;
  background: #f5f3ff;
}

/* --- 優化後的預覽字卡樣式 --- */
.no-preview-card {
  background: #ffffff;
  padding: 3.5rem 2rem;
  border-radius: 1.5rem;
  max-width: 28rem;
  width: 90%;
  box-shadow:
    0 0.25rem 0.5rem rgba(0, 0, 0, 0.02),
    0 1rem 2.5rem rgba(0, 0, 0, 0.08); /* 柔和多重陰影 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-circle {
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 根據類型的淺色底座 */
.bg-light-word {
  background-color: #eff6ff;
}
.bg-light-excel {
  background-color: #f0fdf4;
}
.bg-light-other {
  background-color: #f9fafb;
}

/* Icon 顏色 */
.icon-word {
  color: #2b579a;
}
.icon-excel {
  color: #217346;
}
.icon-pdf {
  color: #f40f02;
}

/* --- 其他元件 --- */
.btn-delete {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: 0.2s;
}
.file-item:hover .btn-delete {
  opacity: 1;
}
.status-badge {
  position: absolute;
  bottom: 0.375rem;
  left: 0.375rem;
  color: #10b981;
  background: white;
  border-radius: 50%;
  line-height: 0;
}
.selected-mask {
  position: absolute;
  inset: 0;
  background: rgba(99, 102, 241, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}
.check-circle-main {
  background: #6366f1;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-label {
  font-size: 0.75rem;
  margin-top: 0.5rem;
  color: #4b5563;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
}

.preview-body {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}
.main-preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.2);
  border-radius: 0.375rem;
}
.main-preview-pdf {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 47.99rem) {
  .mobile-hidden {
    display: none !important;
  }
  .mobile-visible {
    display: flex !important;
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
}
</style>
