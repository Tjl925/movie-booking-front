import request from "@/utils/request";

export const createOrder = (orderCreationDTO,uid) => request.post(`/api/orders?uid=${uid}`, orderCreationDTO)
export const getById = (id) => request.get(`/api/seats/${id}`);
export const getOrderDetails = (orderId) => {
    return request({
        url: `/api/orders/${orderId}`,
        method: 'get'
    })
}