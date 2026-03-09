import { type App } from 'vue';
import { createBootstrap } from 'bootstrap-vue-next';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

export default {
  install: (app: App) => {
    app.use(createBootstrap());
  },
};