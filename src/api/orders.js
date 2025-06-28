import request from "@/utils/request";

export const createOrder = (orderCreationDTO,uid) => request.post(`/api/orders?uid=${uid}`, orderCreationDTO)
export const getById = (id) => request.get(`/api/seats/${id}`);