import axios from "axios";
import {ElMessage} from "element-plus";
import { useUserInfoStore } from '@/stores/userInfo';

// 创建axios实例并配置
const instance = axios.create({
  // 设置合理的超时时间，单位是毫秒
  timeout: 60000, // 60秒超时，可根据实际情况调整
  // 如果有统一的baseURL，可以在这里设置
  // baseURL: '/api'
});


// axios 请求拦截
instance.interceptors.request.use(
    config => {
      // 从store中获取token
      const userInfoStore = useUserInfoStore();
      const token = userInfoStore.userInfo.token;
      
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
