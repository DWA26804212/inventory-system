import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import './main.css';

createApp(App)
  .use(router)
  .use(ElementPlus)
  .use(store)
  .mount('#app')
