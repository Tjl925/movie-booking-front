import request from "@/utils/request";
import axios from 'axios'
export const login = (loginDTO) => request.post('/api/auth/login', loginDTO)
export const register = (registerDTO) => request.post('/api/auth/register', registerDTO)
export const getShowingMoives=(current,size)=>request.get('/api/movies/public/showing', {current,size})
export const getUpcomingMovies=(current,size)=>request.get('/api/movies/public/coming', {current,size})
export const getTop10Movies=()=>request.get('/api/movies/public/top10', {})

export const logout = (token) => request.post('/api/auth/logout', token)
export const updateUserProfile = (id, updateDTO) =>
    request.post(`/api/users/profile/${id}`, updateDTO)
export const uploadAvatar = (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post(`/api/users/${userId}/avatar`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};
export const getSearchList = (current,size,key) => request.get('/api/movies/public/search', {params:current, size, key})
export const changePassword = (ChangePasswordDTO) => request.post('http://localhost:8888/api/users/change-password', ChangePasswordDTO);
export const getSessionInfosByMovieId = (movieId) => request.get(`/api/sessions/public/movie/${movieId}/session-infos`);
