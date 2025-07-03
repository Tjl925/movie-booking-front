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

// 获取电影的场次列表（用于电影详情页显示）
export const getMovieSessionList = (movieId, params) => 
  request.get(`/api/sessions/movie/${movieId}`, { params });

// 获取场次座位选择状态
export const getSeatsForSelection = (id) => 
  request.get(`/api/sessions/public/${id}/seat-selection`);
