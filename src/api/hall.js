import request from "@/utils/request";

// 获取所有影厅列表
export const getHallList = (params) => request.get('/api/halls', { params });

// 获取可用的影厅列表（状态为ACTIVE的影厅）
export const getActiveHalls = () => request.get('/api/halls/active');

// 获取影厅详情
export const getHallDetail = (id) => request.get(`/api/halls/${id}`);

// 创建影厅
export const createHall = (data) => request.post('/api/halls', data);

// 更新影厅
export const updateHall = (id, data) => request.put(`/api/halls/${id}`, data);

// 删除影厅
export const deleteHall = (id) => request.delete(`/api/halls/${id}`);

// 更新影厅状态
export const updateHallStatus = (id, status) => request.put(`/api/halls/${id}/status?status=${status}`);