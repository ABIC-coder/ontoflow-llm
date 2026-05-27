import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: 60000, // 增加到60秒
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error.response?.data?.detail ||
      error.response?.statusText ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(msg));
  },
);

export default client;
