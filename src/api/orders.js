import request from "@/utils/request";

export const createOrder = (orderCreationDTO,uid) => request.post('/api/orders', orderCreationDTO, uid)
export const getById = (id) => request.get(`/api/seats/${id}`);
export const getOrderDetail = (orderId, userId) => {
    return request({
        url: `/api/orders/${orderId}?uid=${userId}`,
        method: 'get'
    })
}

export const cancelOrder = (orderId, userId) => {
    return request({
        url: `/api/orders/${orderId}/cancel?uid=${userId}`,
        method: 'post'
    })
}

export const checkOrderStatus = (orderId) => {
    return request({
        url: `/api/orders/${orderId}/status`,
        method: 'get'
    })
}