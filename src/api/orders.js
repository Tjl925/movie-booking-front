import request from "@/utils/request";

export const createOrder = (orderCreationDTO, uid) => request.post('/api/orders', orderCreationDTO, { params: { uid } })
export const getBySeatId = (id) => request.get(`/api/seats/${id}`);
export const getByOrderId = (id) => request.get(`/api/orders/${id}`);
export const getOrderDetail = (orderId, userId) => request.post('/api/orders/detail', { orderId, userId });
export const getAllOrdersByUserId=(userId)=>Request.get(`/api/orders/user/${userId}/all`);
export const cancelOrder = (orderId, userId) => {
    return request({
        url: `/api/orders/${orderId}/cancel`,
        method: 'post',
        params: { uid: userId }
    })
}

// 管理员获取所有订单
export const getAllOrders = (current = 1, size = 10) => {
    return request({
        url: '/api/orders/admin/all',
        method: 'get',
        params: { current, size }
    })
}

// 管理员删除订单
export const deleteOrder = (orderId) => {
    return request({
        url: `/api/orders/admin/${orderId}`,
        method: 'delete'
    })
}

// 用户获取自己的订单列表
export const getUserOrders = (current = 1, size = 10, uid) => {
    return request({
        url: '/api/orders',
        method: 'get',
        params: { current, size, uid }
    })
}

// 申请退款
export const refundOrder = (orderId, refundReason) => {
    return request({
        url: '/api/alipay/refund',
        method: 'post',
        data: { orderId, refundReason } // 使用data而不是params，确保请求方法为POST
    })
}
export const getIsRated=(id)=>request.get(`/api/orders/${id}/rated`)