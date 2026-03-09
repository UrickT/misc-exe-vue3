<script setup lang="ts">
import { type FieldConfig, useFieldStore } from "@/schema/field";
import { type InputConfig } from "@/schema/input";

interface Props {
  fieldConfig: FieldConfig;
  inputConfig: InputConfig;
}
const props = defineProps<Props>();
const emit = defineEmits([
  "update:stateOfCurrentValue",
  "update:isDisabled",
  "handle:isValidated",
]);

/** 禁用狀態自動同步 */
const checkDisability = (p: Props) => {
  // 這是根據配置算出來的「功能性」禁用
  const isFunctionallyDisabled = computed(
    () => !(p.fieldConfig.hasFunctionality?.[p.inputConfig.mode] ?? true),
  );

  // 這是最終的綜合狀態
  const finalDisabledStatus = computed(
    () => p.inputConfig.isDisabled || isFunctionallyDisabled.value,
  );

  watch(
    finalDisabledStatus,
    (newValue) => {
      // 【關鍵判斷】：
      // 只有當「父層原本沒說要禁用 (false)」，但「我們算出要禁用 (true)」時，才需要通知。
      // 如果父層已經是 true 了，不論我們算出什麼都不用再回傳，避免無限循環。
      if (!p.inputConfig.isDisabled && newValue === true) {
        emit("update:isDisabled", true);
        console.log("STEP 3: 檢測到功能權限衝突，強制通知父層禁用");
      }
    },
    { immediate: true },
  );
};

/** 獲取當前輸入值的 state */
const getStateOfCurrentValue = (p: Props) => {
  /** 封裝驗證邏輯：獨立出來，方便內部 watch 呼叫與外部 emit */
  const isValidated = (validatorPrior = null) => {
    // 1. Delete 模式不驗證
    if (p.inputConfig.mode === "delete") return null;

    // 2. 決定驗證器與必填狀態
    const effectiveValidator = validatorPrior || p.fieldConfig.validator;
    const mode = p.inputConfig.mode;

    const isRequired =
      p.inputConfig.isRequired?.[mode] ??
      p.fieldConfig.isRequired?.[mode] ??
      false;

    // 3. 執行 Pinia Store 驗證
    const isValid = fieldStore.inputState(
      isRequired,
      p.inputConfig.currentValue,
      effectiveValidator,
    );

    // 4. 回傳格式化後的結果 (符合 BootstrapVue)
    return isValid === false ? false : null;
  };

  // --- 合併監聽數據變動 ---
  // 當「值」改變、或是「必填規則」改變、或是「禁用狀態」改變時，統一重新計算
  watch(
    [
      () => p.inputConfig.currentValue,
      () => p.inputConfig.isRequired,
      () => p.inputConfig.isDisabled,
    ],
    () => {
      const validity = p.inputConfig.isDisabled ? null : isValidated();

      // if (p.inputConfig.isDisabled) {
      //   console.log(
      //     "STEP 4: 禁填狀態，validity為null ",
      //     p.inputConfig.currentValue,
      //     validity,
      //   );
      // } else {
      //   console.log(
      //     "STEP 4: 開啟填寫狀態，則驗證內容validity: ",
      //     p.inputConfig.currentValue,
      //     validity,
      //   );
      // }

      // 由於 inputConfig 是父組件傳下來的 reactive 物件，這裡改了，父組件也會同步更新
      props.inputConfig.stateOfCurrentValue = validity;
      emit("update:stateOfCurrentValue", validity);
    },
    { immediate: true, deep: true }, // deep 確保物件內部屬性改變也能偵測
  );

  // 將驗證函式「提拔」給父組件使用
  onMounted(() => {
    emit("handle:isValidated", isValidated);
  });
};

/** 執行順序
 * 1. 自動生成col比例，實時調整畫面input樣式
 * 2. 檢查最終禁用狀態，回傳父層，呼叫父層調整畫面input禁用狀態
 * 3. 驗證當前值currentValue，計算當前值是否通過必填以及符合條件驗證，回傳父層，呼叫父層調整畫面input驗證樣式
 */

// 實例化一次 Store 供下方所有函式共享
const fieldStore = useFieldStore();

// 1. 啟動禁用狀態監控 (副作用：更新父層 isDisabled)
checkDisability(props);

// 2. 啟動值校驗監控 (副作用：更新父層 stateOfCurrentValue 並暴露驗證函式)
getStateOfCurrentValue(props);
</script>

<template>
  <div id="form-input-container">
    <ElFormItem
      :label="props.inputConfig.label ?? props.fieldConfig.label"
      :label-position="props.inputConfig.labelPosition"
      :prop="props.fieldConfig.key"
      class="mb-0"
    >
      <!-- 「施工中」：hasDatabase: false (變成虛線框，寫著未建立)。 -->
      <template v-if="fieldConfig.hasDatabase === false">
        <ElInput
          placeholder="(後端資料庫未建立)"
          disabled
          :size="props.inputConfig.size"
        />
      </template>

      <template v-else>
        <div class="w-100 input-slot-wrapper">
          <slot
            name="form-input-content"
            :disabled="props.inputConfig.isDisabled"
          />
        </div>

        <Transition name="slide-fade">
          <div
            v-if="
              props.inputConfig.errorHint &&
              props.inputConfig.stateOfCurrentValue === false
            "
            class="error-text"
          >
            {{ props.inputConfig.errorHint }}
          </div>
        </Transition>

        <div
          v-if="props.inputConfig.hint"
          v-html="
            Array.isArray(props.inputConfig.hint)
              ? props.inputConfig.hint.join('<br>')
              : props.inputConfig.hint
          "
          class="hint-text"
        />
      </template>
    </ElFormItem>
    <!-- 驗證使用 -->
    <!-- <code> value: {{ props.inputConfig.currentValue }} </code><br /> -->
  </div>
</template>
