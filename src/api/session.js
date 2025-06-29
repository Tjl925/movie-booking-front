import request from "@/utils/request";

// ================= 后台管理接口 =================

// 获取场次列表（后台管理）
export const getSessionList = (params) => request.get('/api/sessions', { params });

// 创建场次
export const createSession = (data) => request.post('/api/sessions', data);

// 更新场次
export const updateSession = (id, data) => request.put(`/api/sessions/${id}`, data);

// 删除场次
export const deleteSession = (id) => request.delete(`/api/sessions/${id}`);

// 检查场次时间冲突
export const checkSessionConflict = (hallId, startTime, endTime, excludeSessionId = null) => {
  const params = { hallId, startTime, endTime };
  if (excludeSessionId) {
    params.excludeSessionId = excludeSessionId;
  }
  return request.get('/api/sessions/admin/check-conflict', { params });
};

// ================= 前台公共接口 =================

// 获取某电影某天的所有场次
export const getMovieSessionsByDate = (movieId, date) => 
  request.get(`/api/sessions/public/movie/${movieId}/date/${date}`);

// 获取电影的场次列表（用于电影详情页显示）
export const getMovieSessionList = (movieId, params) => 
  request.get(`/api/sessions/movie/${movieId}`, { params });

// 获取场次详情
export const getSessionDetail = (id) => request.get(`/api/sessions/public/${id}`);

// 获取某场次的座位图及状态
export const getSessionSeats = (id) => request.get(`/api/sessions/public/${id}/seats`);

// 获取某电影的所有场次完整信息
export const getSessionInfosByMovieId = (movieId) => 
  request.get(`/api/sessions/public/movie/${movieId}/session-infos`);

// 获取场次座位选择状态
export const getSeatsForSelection = (id) => 
  request.get(`/api/sessions/public/${id}/seat-selection`);

// 更新单个座位状态
export const updateSeatStatus = (data) => 
  request.post('/api/sessions/public/update-seat-status', data);