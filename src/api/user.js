import request from "@/utils/request";
export const login = (loginDTO) => request.post('/api/auth/login', loginDTO)
export const register = (registerDTO) => request.post('/api/auth/register', registerDTO)
export const validate = (registerDTO) => request.post('/api/auth/validate', registerDTO)
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

export const getUserById = (id) => request.get(`/api/users/${id}`);

export const changePassword = (ChangePasswordDTO) => request.post('http://localhost:8888/api/users/change-password', ChangePasswordDTO);

//验证码相关
export const sendVerificationCode = (emailRequestDTO) => request.post('/api/email/send-code', emailRequestDTO)
export const verifyCode = (emailRequestDTO) => request.post('/api/email/verify-code',  emailRequestDTO )
export const sendPassWordCode = (emailRequestDTO) => request.post('/api/email/send-password', emailRequestDTO)