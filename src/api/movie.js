import request from "@/utils/request";

// 获取电影列表
export const getMovieList = (params) => request.get('/api/movies/admin', { params });

export const getMovieById = (id)=>request.get(`/api/movies/public/${id}`)

// 创建电影
export const createMovie = (data) => request.post('/api/movies', data);

// 更新电影
export const updateMovie = (id, data) => request.put(`/api/movies/${id}`, data);

// 删除电影
export const deleteMovie = (id) => request.delete(`/api/movies/${id}`);

// 更新电影状态
export const updateMovieStatus = (id, status) => request.put(`/api/movies/${id}/status?status=${status}`);

// 上传电影海报
export const uploadPoster = (movieId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post(`/api/movies/${movieId}/poster`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 上传电影视频
export const uploadVideo = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post(`/api/movies/${id}/video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 获取所有电影类型及其电影数量
export const getAllGenres = () => request.get('/api/movies/genres');

// 根据类型获取电影列表
export const getMoviesByGenre = (genre, params) => request.get(`/api/movies/genres/${genre}`, { params });

// 根据类型批量删除电影
export const deleteMoviesByGenre = (genre) => request.delete(`/api/movies/genres/${genre}`);

// 更新电影类型
export const updateMoviesByGenre = (oldGenre, newGenre) => request.put(`/api/movies/genres/${oldGenre}?newGenre=${newGenre}`);

// 获取所有电影区域及其电影数量
export const getAllRegions = () => request.get('/api/movies/regions');

// 根据区域获取电影列表
export const getMoviesByRegion = (region, params) => request.get(`/api/movies/regions/${region}`, { params });

// 根据区域批量删除电影
export const deleteMoviesByRegion = (region) => request.delete(`/api/movies/regions/${region}`);

// 更新电影区域
export const updateMoviesByRegion = (oldRegion, newRegion) => request.put(`/api/movies/regions/${oldRegion}?newRegion=${newRegion}`);

//推荐电影
export const getMovieRecommendations = (movieId, limit = 5) =>
    request.get(`/api/movies/public/${movieId}/recommendations`, {
      params: { limit }
    });
export const getBestBoxOfficeMovies=()=>request.get('/api/movies/public/boxOffice', {})
export const ratingMovies=(ratingDTO)=>request.post('/api/movies/public/rate',ratingDTO);
export const getMovieRecommendation = (userId = 5) => request.get(`/api/movies/public/recommendations/${userId}`);

export const getShowingMoives = (current, size) =>
    request.get('/api/movies/public/showing', {
      params: { current, size }  // 关键：使用 `params` 而不是直接传对象
    })
export const getUpcomingMovies = (current, size) =>
    request.get('/api/movies/public/coming', {
      params: { current, size }  // 关键：使用 `params` 而不是直接传对象
    })
export const getTop5Movies=()=>request.get('/api/movies/public/top5', {})
export const getSearchList = (current,size,key) => request.get('/api/movies/public/search', {params:current, size, key})
export const getAllMovies = (status) =>
    request.get('/api/movies/public/all', {
        params: { status }  // 关键：使用 `params` 而不是直接传对象
    })