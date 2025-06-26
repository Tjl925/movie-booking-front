import request from "@/utils/request";

export const login = (loginDTO) => request.post('/api/auth/login', loginDTO)
export const register = (registerDTO) => request.post('/api/auth/register', registerDTO)
export const logout = (token) => request.post('/api/auth/logout', token)