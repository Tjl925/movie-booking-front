import { defineStore } from 'pinia'
import { ref } from 'vue'


export const useOrderStore = defineStore('order', () => {
    // 订单基本信息
    const filmInfo = ref(null)
    const startTime = ref(null)
    const endTime = ref(null)

    // 座位信息
    const seats = ref([])
    const loading = ref(false)

    // 设置基本信息
    const setBasicInfo = (film, start, end, seatsInfo) => {
        filmInfo.value = film
        startTime.value = start
        endTime.value = end
        seats.value = seatsInfo // 直接赋值而不是push
    }

    // 清空订单信息
    const clearOrder = () => {
        filmInfo.value = null
        startTime.value = null
        endTime.value = null
        seats.value = []
    }

    return {
        filmInfo,
        startTime,
        endTime,
        seats,
        loading,
        setBasicInfo,
        clearOrder
    }
})