import { type App } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-tw"; // 按需引入語系，預設為英文

// 擴充插件（例如相對時間），可以在此處引入
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

export { dayjs };
export default {
  install: (app: App) => {
    // 1. 全域註冊：在元件內可透過 inject('dayjs') 取得
    app.provide("dayjs", dayjs);

    // 2. 配置全域屬性：在模板中可透過 $dayjs 訪問
    app.config.globalProperties.$dayjs = dayjs;
  },
};
