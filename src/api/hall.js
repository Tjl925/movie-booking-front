import request from "@/utils/request";

// 获取可用的影厅列表（状态为ACTIVE的影厅）
export const getActiveHalls = () => request.get('/api/halls/active');
