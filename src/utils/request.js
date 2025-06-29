import axios from "axios";
import {ElMessage} from "element-plus";
import router from "@/router";
import { useUserInfoStore } from '@/stores/userInfo';

//{baseURL: '/api'}
const instance = axios.create();


// axios 请求拦截
instance.interceptors.request.use(
    config => {
      // 从store中获取token
      const userInfoStore = useUserInfoStore();
      const token = userInfoStore.token;
      
      // 如果有token，添加到请求头
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return config;
    },
    error => {
      return Promise.reject(error);
    }
)

// axios 相应拦截
instance.interceptors.response.use(
    result => {
        if (result.data.status) {
            return result.data;
        } else {
            ElMessage.error(result.data.message || '服务异常');
            return Promise.reject(result.data);
        }
    },
    error => {
        // 如果后端返回了结构化的 JSON 错误
        if (error.response && error.response.data) {
            ElMessage.error(error.response.data.message || '服务异常');
            return Promise.reject(error.response.data);
        }
        ElMessage.error('网络错误或服务异常');
        return Promise.reject(error);
    }
)

export default instance
