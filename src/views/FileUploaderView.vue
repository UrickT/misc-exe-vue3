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
} from "@mdi/js";
import SvgIcon from "@/components/atoms/SvgIcon.vue";

interface Props {
  maxSizeMB?: number;
  accept?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxSizeMB: 5,
  accept: "image/*,application/pdf,.doc,.docx,.xls,.xlsx",
});

const emit = defineEmits(["change"]);

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const showPreviewOnMobile = ref(false);
const temporaryFiles = ref<any[]>([]);

const currentPreview = reactive({
  index: -1,
  name: "",
  mediaType: "",
  previewUrl: undefined as string | undefined,
  file: undefined as File | undefined,
});

// --- 檔案處理邏輯 ---
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
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      const newFile = {
        name: file.name,
        mediaType,
        previewUrl:
          mediaType === "image" || mediaType === "pdf" ? result : undefined,
        file: file,
        size: (file.size / 1024).toFixed(1) + " KB",
      };
      temporaryFiles.value.push(newFile);
      setPreview(temporaryFiles.value.length - 1, newFile);
    };

    if (mediaType === "image" || mediaType === "pdf")
      reader.readAsDataURL(file);
    else reader.readAsArrayBuffer(file);
  }
  emit("change", temporaryFiles.value);
};

// TS 安全的 Change 事件
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target && target.files) {
    processFiles(target.files);
    target.value = ""; // 重置以允許選取同檔名
  }
};

const setPreview = (index: number, file: any) => {
  currentPreview.index = index;
  currentPreview.name = file.name;
  currentPreview.mediaType = file.mediaType;
  currentPreview.previewUrl = file.previewUrl;
  currentPreview.file = file.file;
  if (window.innerWidth < 768) showPreviewOnMobile.value = true;
};

const downloadCurrentFile = () => {
  if (!currentPreview.file) return;
  const url = URL.createObjectURL(currentPreview.file);
  const a = document.createElement("a");
  a.href = url;
  a.download = currentPreview.name;
  a.click();
  URL.revokeObjectURL(url);
};

const removeFile = (index: number) => {
  temporaryFiles.value.splice(index, 1);
  if (currentPreview.index === index) {
    currentPreview.index = -1;
    currentPreview.previewUrl = undefined;
    currentPreview.name = "";
    showPreviewOnMobile.value = false;
  } else if (currentPreview.index > index) {
    currentPreview.index--;
  }
  emit("change", temporaryFiles.value);
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
          <h6 class="mb-0 fw-bold text-dark">
            待上傳 ({{ temporaryFiles.length }})
          </h6>
          <button class="btn-add" @click="fileInput?.click()">
            <SvgIcon :path="mdiUpload" :size="16" /> 新增
          </button>
          <input
            ref="fileInput"
            type="file"
            multiple
            :accept="accept"
            class="d-none"
            @change="onFileChange"
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
              v-for="(file, index) in temporaryFiles"
              :key="index"
              class="file-item"
              :class="{ active: currentPreview.index === index }"
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

                <button class="btn-delete" @click.stop="removeFile(index)">
                  <SvgIcon :path="mdiClose" :size="12" style="flex-shrink: 0" />
                </button>
              </div>
              <div class="thumb-label">{{ file.name }}</div>
            </div>
          </div>
          <div v-if="!temporaryFiles.length" class="empty-state">
            <SvgIcon :path="mdiUpload" :size="48" class="text-muted mb-3" />
            <p>將檔案拖拽至此或點擊新增</p>
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

        <div
          class="preview-body flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-5"
        >
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
                    : mdiFileExcel
                "
                :size="100"
                :class="`icon-${currentPreview.mediaType} mb-4`"
              />
              <h4 class="fw-bold">{{ currentPreview.name }}</h4>
              <p class="text-muted mb-4">
                此檔案類型不支援直接預覽，請下載後查看內容。
              </p>
              <button class="btn-download-big" @click="downloadCurrentFile">
                <SvgIcon :path="mdiDownload" :size="20" class="me-2" /> 下載檔案
              </button>
            </div>
          </template>

          <div v-else class="text-muted text-center d-none d-md-block">
            <SvgIcon :path="mdiFileDocumentOutline" :size="60" class="mb-3" />
            <p>尚未選取檔案</p>
          </div>
        </div>

        <div
          v-if="currentPreview.name"
          class="preview-footer d-none d-md-block"
        >
          {{ currentPreview.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器高度 */
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

/* 按鈕樣式 */
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
.btn-add:hover {
  background: #4f46e5;
}
.btn-back {
  background: none;
  border: none;
  color: #333;
  padding: 0;
  cursor: pointer;
}

/* 刪除按鈕 */
.btn-delete {
  /* 1. 定位與層級 */
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;

  /* 2. 強制正圓形的核心設定 */
  width: 22px;
  height: 22px;
  padding: 0; /* 移除內距防止撐開 */
  aspect-ratio: 1 / 1; /* 強制寬高比 1:1 */
  border-radius: 50%; /* 圓角 50% */
  flex-shrink: 0; /* 絕對不允許被擠壓 */

  /* 3. 內部置中 (使用 grid 通常比 flex 更精準) */
  display: grid;
  place-items: center;

  /* 4. 視覺效果 */
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  line-height: 0; /* 移除行高造成的位移 */
}

/* 確保 SVG 圖示本身不帶任何 margin */
.btn-delete svg {
  display: block;
  margin: 0;
}

.file-item:hover .btn-delete {
  opacity: 1;
}
.btn-delete:hover {
  background: #ef4444;
}

/* 檔案清單 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}
.file-item {
  cursor: pointer;
  text-align: center;
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
  width: 100%;
  padding: 0 4px;
}

/* 預覽元件 */
.main-preview-img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
.main-preview-pdf {
  width: 100%;
  height: 100%;
  border: none;
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

/* 顏色 */
.icon-word {
  color: #2b579a;
}
.icon-excel {
  color: #217346;
}
.icon-pdf {
  color: #f40f02;
}

/* RWD 邏輯 */
@media (max-width: 767.98px) {
  .mobile-hidden {
    display: none !important;
  }
  .preview-section {
    display: none;
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
.preview-footer {
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 12px;
  background: #fff;
  border-top: 1px solid #eee;
  color: #999;
}
</style>
