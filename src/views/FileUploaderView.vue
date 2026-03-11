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
  mdiLoading,
  mdiCloudUpload,
} from "@mdi/js";
import SvgIcon from "@/components/atoms/SvgIcon.vue";
import { uploadedFileApi } from "@/api/apiServices/uploadedFile";
import type { UploadedFile } from "@/schema/uploadedFile";
import JSZip from "jszip";

// --- 1. 狀態定義 ---
const isMultiSelectMode = ref(false);
const isUploading = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const fileInput = ref<HTMLInputElement | null>(null);
const showPreviewOnMobile = ref(false);

const serverFiles = ref<UploadedFile[]>([]);
const temporaryFiles = ref<
  {
    file: File;
    id: string;
    name: string;
    mediaType: string;
    previewUrl: string;
    isServer: boolean;
  }[]
>([]);

const currentPreview = reactive({
  id: "",
  name: "",
  mediaType: "",
  previewUrl: undefined as string | undefined,
  isServer: false,
});

// --- 2. 生命週期與 API ---
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

// --- 3. 檔案選取與上傳邏輯 ---
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;

  const files = Array.from(target.files);
  files.forEach((file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let mediaType = "other";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext!))
      mediaType = "image";
    else if (ext === "pdf") mediaType = "pdf";
    else if (["doc", "docx"].includes(ext!)) mediaType = "word";
    else if (["xls", "xlsx", "csv"].includes(ext!)) mediaType = "excel";

    temporaryFiles.value.push({
      file,
      id: `local-${Date.now()}-${Math.random()}`,
      name: file.name,
      mediaType,
      previewUrl: URL.createObjectURL(file),
      isServer: false,
    });
  });
  target.value = "";
};

const handleUploadToServer = async () => {
  if (temporaryFiles.value.length === 0 || isUploading.value) return;

  isUploading.value = true;
  try {
    for (const item of temporaryFiles.value) {
      await uploadedFileApi.upload(item.file);
    }

    // 清空暫存並刷新列表
    temporaryFiles.value = [];
    await fetchServerFiles();
    alert("上傳成功！");
  } catch (error) {
    console.error("上傳失敗", error);
    alert("上傳過程中發生錯誤");
  } finally {
    isUploading.value = false;
  }
};

// --- 4. 刪除與下載邏輯 ---
const handleDeleteFile = async (file: any) => {
  if (file.isServer) {
    if (confirm(`確定要刪除「${file.name}」嗎？`)) {
      try {
        await uploadedFileApi.deleteBySn(file.id.replace("server-", ""));
        await fetchServerFiles();
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    temporaryFiles.value = temporaryFiles.value.filter((f) => f.id !== file.id);
  }

  if (currentPreview.id === file.id) {
    Object.assign(currentPreview, {
      id: "",
      name: "",
      mediaType: "",
      previewUrl: undefined,
      isServer: false,
    });
  }
};

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

// --- 5. 顯示轉換計算 ---
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
  return [...server, ...temporaryFiles.value];
});

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
                {{ isMultiSelectMode ? "取消多選" : "多選模式" }}
              </button>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button
                v-if="temporaryFiles.length > 0"
                class="btn-upload-run"
                :disabled="isUploading"
                @click="handleUploadToServer"
              >
                <SvgIcon
                  :path="isUploading ? mdiLoading : mdiCloudUpload"
                  :size="16"
                  :class="{ rotate: isUploading }"
                />
                {{ isUploading ? "上傳中" : `上傳 (${temporaryFiles.length})` }}
              </button>

              <button
                class="btn-add"
                @click="fileInput?.click()"
                :disabled="isUploading"
              >
                <SvgIcon :path="mdiUpload" :size="16" /> 新增
              </button>
            </div>
            <input
              ref="fileInput"
              type="file"
              multiple
              class="d-none"
              @change="handleFileChange"
            />
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
                'is-temp': !file.isServer,
              }"
              @click="setPreview(file)"
            >
              <div class="thumb-container">
                <button class="btn-delete" @click.stop="handleDeleteFile(file)">
                  <SvgIcon :path="mdiClose" :size="12" />
                </button>
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
                <div v-else class="temp-badge">待上傳</div>
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
                isMultiSelectMode ? "打包下載" : "下載檔案"
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
              <p class="text-muted info-text mb-4">此檔案類型不支援直接預覽</p>
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
/* --- 基礎佈局與齊平 Header --- */
.uploader-fullscreen {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.section-header {
  height: 4rem;
  border-bottom: 0.0625rem solid #eee;
  background: #fff;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* --- 統一橢圓按鈕樣式 --- */
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
.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.btn-upload-run {
  background: #10b981;
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

/* --- 縮圖列表 (禁止放大) --- */
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
  transform: none !important;
}
.file-item.is-selected .thumb-container {
  border-color: #6366f1;
  transform: none !important;
}
.file-item.is-temp .thumb-container {
  border-style: dashed;
  border-color: #10b981;
}

/* --- 功能小元件 --- */
.btn-delete {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
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
.temp-badge {
  position: absolute;
  bottom: 0.375rem;
  right: 0.375rem;
  background: #10b981;
  color: white;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
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

/* --- 預覽卡片樣式 --- */
.no-preview-card {
  background: #ffffff;
  padding: 3.5rem 2rem;
  border-radius: 1.5rem;
  max-width: 28rem;
  width: 90%;
  box-shadow:
    0 0.25rem 0.5rem rgba(0, 0, 0, 0.02),
    0 1rem 2.5rem rgba(0, 0, 0, 0.08);
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
.bg-light-word {
  background-color: #eff6ff;
}
.bg-light-excel {
  background-color: #f0fdf4;
}
.bg-light-other {
  background-color: #f9fafb;
}
.icon-word {
  color: #2b579a;
}
.icon-excel {
  color: #217346;
}
.icon-pdf {
  color: #f40f02;
}

/* --- 輔助類 --- */
.rotate {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

/* --- RWD 返回按鈕優化 --- */
.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: none;
  background: #f3f4f6; /* 淺灰色底 */
  color: #4b5563;
  transition: all 0.2s ease;
  padding: 0;
  cursor: pointer;
}

.btn-back:hover {
  background: #e5e7eb;
  color: #111827;
}

/* --- RWD --- */
@media (max-width: 47.99rem) {
  .mobile-hidden {
    display: none !important;
  }
  .mobile-visible {
    display: flex !important;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #fff;
  }
  .section-header {
    padding: 0 1rem;
  }

  .preview-section .section-header {
    padding-left: 0.75rem !important; /* 縮小邊距讓按鈕不擁擠 */
  }
  .preview-title {
    font-size: 1.1rem;
    margin-left: 0.5rem;
    color: #1f2937;
  }
}
</style>
