import request from "@/utils/request";

// 获取用户列表
export const getUserList = (params) => request.get('/api/users', { params });

// 根据ID获取用户
export const getUserById = (id) => request.get(`/api/users/${id}`);

// 创建用户
export const createUser = (data) => request.post('/api/users', data);

// 更新用户
export const updateUser = (id, data) => request.put(`/api/users/${id}`, data);

// 删除用户
export const deleteUser = (id) => request.delete(`/api/users/${id}`);

// 更新用户状态
export const updateUserStatus = (id, status) => request.put(`/api/users/${id}/status?status=${status}`);

// 重置用户密码
export const resetPassword = (id, data) => request.put(`/api/users/${id}/reset-password`, data);

// 获取用户分组列表
export const getUserGroups = () => request.get('/api/user-groups');

// 创建用户分组
export const createUserGroup = (data) => request.post('/api/user-groups', data);

// 更新用户分组
export const updateUserGroup = (id, data) => request.put(`/api/user-groups/${id}`, data);

// 删除用户分组
export const deleteUserGroup = (id) => request.delete(`/api/user-groups/${id}`);

// 获取所有角色列表
export const getAllRoles = () => request.get('/api/roles');

// 根据ID获取角色及其权限
export const getRoleById = (id) => request.get(`/api/roles/${id}`);

// 将用户添加到分组
export const addUserToGroup = (groupId, userId) => request.post(`/api/user-groups/${groupId}/users/${userId}`);

// 将用户从分组中移除
export const removeUserFromGroup = (groupId, userId) => request.delete(`/api/user-groups/${groupId}/users/${userId}`);

// 获取分组中的用户列表
export const getUsersInGroup = (groupId, params) => request.get(`/api/user-groups/${groupId}/users`, { params });

// 获取用户所属的分组列表
export const getGroupsByUser = (userId) => request.get(`/api/users/${userId}/groups`);