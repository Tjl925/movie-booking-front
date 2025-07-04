<template>
  <div class="payment-success-container">
    <div class="success-card">
      <div class="success-icon">
        <el-icon :size="64" color="#67C23A"><CircleCheckFilled /></el-icon>
      </div>
      <h1 class="success-title">支付成功</h1>
      <p class="success-message">您的订单已支付完成，感谢您的购买！</p>
      <div class="order-info">
        <p><span class="label">订单号：</span>{{ orderId }}</p>
        <p><span class="label">影片：</span>{{ filmName }}</p>
        <p><span class="label">场次：</span>{{ sessionTime }}</p>
        <p><span class="label">座位：</span>{{ seatInfo }}</p>
        <p><span class="label">支付金额：</span>¥{{ amount }}</p>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="goToHome">返回首页</el-button>
        <el-button @click="viewOrderDetail">查看订单详情</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { getOrderDetail } from '@/api/orders'
import { useUserInfoStore } from '@/stores/userInfo'
import dayjs from "dayjs";

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

// 订单信息
const orderId = ref('')
const filmName = ref('')
const sessionTime = ref('')
const seatInfo = ref('')
const amount = ref(0)

// 获取订单详情
const fetchOrderDetails = async () => {
  try {
    // 从路由参数获取订单ID
    const id = route.params.id
    console.log('订单ID:', id)
    if (!id) {
      ElMessage.error('订单信息不存在')
      return
    }

    orderId.value = id
    const res = await getOrderDetail(id, userInfoStore.userInfo.id)
    const data = res.data

    // 更新订单信息
    filmName.value = data.session.movie.title || ''
    sessionTime.value = formatDateTime(data.session?.sessionTime) || ''
    seatInfo.value = data.seatNumbers
    amount.value = data.totalAmount || 0
  } catch (error) {
    console.error('获取订单详情失败:', error)
    await router.push('/')
  }
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm');
};

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 查看订单详情
const viewOrderDetail = () => {
  router.push(`/user-orders/${userInfoStore.userInfo.id}`)
}

onMounted(() => {
  fetchOrderDetails()
})
</script>

<style scoped>
.payment-success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f7fa;
}

.success-card {
  width: 600px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.success-icon {
  margin-bottom: 20px;
}

.success-title {
  font-size: 24px;
  color: #67C23A;
  margin-bottom: 10px;
}

.success-message {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.order-info {
  text-align: left;
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.label {
  font-weight: bold;
  color: #303133;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>