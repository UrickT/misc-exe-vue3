<script setup lang="ts">
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
  mdiCloudUpload,
} from "@mdi/js";
import SvgIcon from "@/components/atoms/SvgIcon.vue";
import { uploadedFileApi } from "@/api/apiServices/uploadedFile";
import type { UploadedFile } from "@/schema/uploadedFile";

interface Props {
  maxSizeMB?: number;
  accept?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxSizeMB: 5,
  accept: "image/*,application/pdf,.doc,.docx,.xls,.xlsx",
});

// --- 狀態定義 ---
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const isUploading = ref(false);
const showPreviewOnMobile = ref(false);

const serverFiles = ref<UploadedFile[]>([]);
const temporaryFiles = ref<any[]>([]);

const currentPreview = reactive({
  index: -1,
  name: "",
  mediaType: "",
  previewUrl: undefined as string | undefined,
  isServer: false,
  fileSN: null as number | null,
});

// --- 初始化 ---
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

// --- 合併顯示列表 (處理 undefined 與中文編碼) ---
const allFilesDisplay = computed(() => {
  // 💡 防錯：若 .env 沒抓到，則給予後端預設地址
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8201";

  const server = serverFiles.value.map((f) => {
    const ext = f.originalName.split(".").pop()?.toLowerCase();
    let mediaType = "other";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext!))
      mediaType = "image";
    else if (ext === "pdf") mediaType = "pdf";
    else if (["doc", "docx"].includes(ext!)) mediaType = "word";
    else if (["xls", "xlsx", "csv"].includes(ext!)) mediaType = "excel";

    // 💡 修正路徑斜線並組合 URL
    const cleanPath = f.path.replace(/\\/g, "/");

    return {
      id: `server-${f.fileSN}`,
      isServer: true,
      name: decodeURIComponent(f.originalName), // 解碼 URL 編碼的中文
      fileSN: f.fileSN,
      mediaType,
      previewUrl:
        mediaType === "image" || mediaType === "pdf"
          ? `${baseUrl}/${cleanPath}`
          : undefined,
    };
  });

  const local = temporaryFiles.value.map((f, index) => ({
    ...f,
    id: `local-${index}`,
    isServer: false,
    localIndex: index,
  }));

  return [...server, ...local];
});

// --- 檔案選取 ---
const processFiles = async (files: FileList | File[]) => {
  const fileArray = Array.from(files);
  for (const file of fileArray) {
    if (file.size / 1024 / 1024 > props.maxSizeMB) {
      alert(`檔案 ${file.name} 超過 ${props.maxSizeMB}MB`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    let mediaType = "other";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext!))
      mediaType = "image";
    else if (ext === "pdf") mediaType = "pdf";
    else if (["doc", "docx"].includes(ext!)) mediaType = "word";
    else if (["xls", "xlsx", "csv"].includes(ext!)) mediaType = "excel";

    const reader = new FileReader();
    reader.onload = (e) => {
      temporaryFiles.value.push({
        name: file.name,
        mediaType,
        previewUrl:
          mediaType === "image" || mediaType === "pdf"
            ? e.target?.result
            : undefined,
        file: file,
      });
    };

    if (mediaType === "image" || mediaType === "pdf")
      reader.readAsDataURL(file);
    else reader.readAsArrayBuffer(file);
  }
};

// --- API 操作 ---
const uploadAll = async () => {
  if (temporaryFiles.value.length === 0) return;
  isUploading.value = true;
  try {
    for (const item of temporaryFiles.value) {
      await uploadedFileApi.upload(item.file);
    }
    temporaryFiles.value = [];
    await fetchServerFiles();
  } catch (error) {
    alert("上傳失敗");
  } finally {
    isUploading.value = false;
  }
};

const handleRemove = async (file: any) => {
  if (file.isServer) {
    if (confirm(`確定刪除 ${file.name}？`)) {
      await uploadedFileApi.deleteBySn(file.fileSN);
      await fetchServerFiles();
    }
  } else {
    temporaryFiles.value.splice(file.localIndex, 1);
  }

  if (currentPreview.name === file.name) {
    currentPreview.name = "";
    currentPreview.previewUrl = undefined;
    showPreviewOnMobile.value = false;
  }
};

const setPreview = (index: number, file: any) => {
  currentPreview.index = index;
  currentPreview.name = file.name;
  currentPreview.mediaType = file.mediaType;
  currentPreview.previewUrl = file.previewUrl;
  currentPreview.isServer = file.isServer;
  if (window.innerWidth < 768) showPreviewOnMobile.value = true;
};

const downloadFile = () => {
  if (!currentPreview.previewUrl) return;
  window.open(currentPreview.previewUrl, "_blank");
};
</script>

<template>
  <div class="uploader-fullscreen">
    <div class="row g-0 h-100 flex-nowrap">
      <div
        class="col-12 col-md-5 d-flex flex-column border-end list-section"
        :class="{ 'mobile-hidden': showPreviewOnMobile }"
      >
        <div
          class="section-header d-flex justify-content-between align-items-center px-3"
        >
          <h6 class="mb-0 fw-bold">檔案管理 ({{ allFilesDisplay.length }})</h6>
          <div class="d-flex gap-2">
            <button
              v-if="temporaryFiles.length > 0"
              class="btn-upload-all"
              @click="uploadAll"
              :disabled="isUploading"
            >
              <SvgIcon :path="mdiCloudUpload" :size="16" />
              {{ isUploading ? "上傳中" : "上傳" }}
            </button>
            <button class="btn-add" @click="fileInput?.click()">
              <SvgIcon :path="mdiUpload" :size="16" /> 新增
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            :accept="accept"
            class="d-none"
            @change="
              (e) => {
                processFiles((e.target as HTMLInputElement).files!);
                (e.target as HTMLInputElement).value = '';
              }
            "
          />
        </div>

        <div
          class="list-body flex-grow-1 overflow-auto p-3"
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="
            isDragging = false;
            processFiles($event.dataTransfer!.files);
          "
        >
          <div class="file-grid">
            <div
              v-for="(file, index) in allFilesDisplay"
              :key="file.id"
              class="file-item"
              :class="{ active: currentPreview.name === file.name }"
              @click="setPreview(index, file)"
            >
              <div class="thumb-container">
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

                <button class="btn-delete" @click.stop="handleRemove(file)">
                  <SvgIcon :path="mdiClose" :size="12" />
                </button>
              </div>
              <div class="thumb-label">{{ file.name }}</div>
            </div>
          </div>
          <div v-if="!allFilesDisplay.length" class="empty-state">
            <SvgIcon :path="mdiUpload" :size="48" class="text-muted mb-3" />
            <p>拖拽或點擊新增檔案</p>
          </div>
        </div>
      </div>

      <div
        class="col-12 col-md-7 d-flex flex-column preview-section bg-light"
        :class="{ 'mobile-visible': showPreviewOnMobile }"
      >
        <div class="section-header d-flex align-items-center d-md-none px-3">
          <button class="btn-back" @click="showPreviewOnMobile = false">
            <SvgIcon :path="mdiChevronLeft" :size="24" />
          </button>
          <span class="ms-2 fw-bold text-truncate">{{
            currentPreview.name || "檔案預覽"
          }}</span>
        </div>

        <div class="preview-body">
          <template v-if="currentPreview.name">
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

            <div v-else class="no-preview-card text-center shadow-sm">
              <SvgIcon
                :path="
                  currentPreview.mediaType === 'word'
                    ? mdiFileWord
                    : currentPreview.mediaType === 'excel'
                      ? mdiFileExcel
                      : mdiFileDocumentOutline
                "
                :size="100"
                :class="`icon-${currentPreview.mediaType} mb-4`"
              />
              <h4 class="fw-bold">{{ currentPreview.name }}</h4>
              <p class="text-muted mb-4">此類型不支援預覽，請下載後查看。</p>
              <button class="btn-download-big" @click="downloadFile">
                <SvgIcon :path="mdiDownload" :size="20" class="me-2" /> 下載檔案
              </button>
            </div>
          </template>
          <div v-else class="text-muted text-center d-none d-md-block">
            <SvgIcon :path="mdiFileDocumentOutline" :size="60" class="mb-3" />
            <p>尚未選取檔案</p>
          </div>
        </div>

        <div v-if="currentPreview.name" class="preview-footer">
          {{ currentPreview.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uploader-fullscreen {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #fff;
}
.section-header {
  height: 64px;
  border-bottom: 1px solid #eee;
  background: #fff;
  flex-shrink: 0;
}

.btn-add {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 25px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-upload-all {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 25px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}
.file-item:hover .btn-delete {
  opacity: 1;
}
.btn-delete:hover {
  background: #ef4444;
}

.status-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  color: #10b981;
  background: white;
  border-radius: 50%;
  line-height: 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}
.thumb-container {
  aspect-ratio: 1;
  background: #f9fafb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
}
.file-item.active .thumb-container {
  border-color: #6366f1;
  background: #f5f3ff;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-label {
  font-size: 12px;
  margin-top: 8px;
  color: #4b5563;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0 4px;
}

/* 💡 預覽區佈局修正 */
.preview-body {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 24px;
}

.main-preview-img {
  max-width: 100%;
  max-height: 100%; /* 確保圖片不超出預覽容器 */
  object-fit: contain; /* 保持比例縮放 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.main-preview-pdf {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-footer {
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 12px;
  background: #fff;
  border-top: 1px solid #eee;
  color: #666;
  flex-shrink: 0; /* 禁止 footer 被擠壓 */
  z-index: 10;
  font-weight: 500;
}

.no-preview-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  max-width: 400px;
  width: 90%;
}
.btn-download-big {
  background: #111827;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
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

@media (max-width: 767.98px) {
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

.is-dragging {
  background-color: #f5f3ff !important;
  outline: 2px dashed #6366f1;
  outline-offset: -12px;
}
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
</style>
