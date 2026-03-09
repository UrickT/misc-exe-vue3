import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from '@/router';

// 引入自動化插件中心
import plugins from "@/plugins";
import AtomComponents from "@/components/atoms";
import InputComponents from "@/components/inputs";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(plugins); // 自動跑完 plugins/ 下所有的 install 邏輯
app.use(AtomComponents);
app.use(InputComponents);

app.mount("#app");
