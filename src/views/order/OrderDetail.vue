<template>
  <div class="movie-pay-container">
    <!-- 步骤条 -->
    <el-steps :active="2" finish-status="success" align-center style="margin-bottom: 20px;">
      <el-step title="选择影片场次" />
      <el-step title="选择座位" />
      <el-step title="15 分钟内付款" />
      <el-step title="影院取票观影" />
    </el-steps>

    <el-alert
        :title="`请在 ${countdownDisplay} 内完成支付`"
        type="warning"
        description="超时订单会自动取消，如遇支付问题，请致电客服：1010-5335"
        show-icon
        style="margin-bottom: 20px;"
        :closable="false"
    />

    <!-- 信息确认提示 -->
    <el-tag type="warning" style="margin-bottom: 10px;">请仔细核对场次信息，出票后将无法退票和改签</el-tag>

    <!-- 订单信息表格 -->
    <el-table :data="tableData" border style="width: 100%; margin-bottom: 20px;">
      <el-table-column prop="film" label="影片" />
      <el-table-column prop="start_time" label="开始时间" />
      <el-table-column prop="end_time" label="截止时间" />
      <el-table-column prop="seat" label="座位" />
    </el-table>

    <!-- 实际支付及确认支付按钮 -->
    <div class="pay-info">
      <span class="actual-pay">实际支付：¥{{ actualPay }}</span>
      <el-button type="primary" @click="handlePay">确认支付</el-button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useOrderStore } from "@/stores/orderInfo"
import { getOrderDetails } from '@/api/orders'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import {useUserInfoStore} from "@/stores/userInfo";
const route = useRoute()
const orderStore = useOrderStore()
const userInfoStore = useUserInfoStore();
// 定义倒计时相关变量
const orderCreateTime = ref(null)
const expirationTime = ref(null)

// 从路由参数获取orderId
const orderId=ref(null)

// 订单信息
const tableData = ref([{
  film: '',
  start_time: '',
  end_time: '',
  seat: '',
}])
const actualPay = ref(0)

// 计算剩余时间（秒）
const remainingSeconds = computed(() => {
  if (!expirationTime.value) return 0
  return Math.max(0, Math.floor((expirationTime.value - Date.now()) / 1000))
})

// 格式化显示
const countdownDisplay = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60)
  const secs = remainingSeconds.value % 60
  return `${mins} 分 ${secs} 秒`
})

// 获取订单详情
const fetchOrderDetails = async () => {
  try {
    if (!orderId.value) throw new Error('未找到订单信息');

    const res = await getOrderDetails(orderId.value, userInfoStore.userInfo.id);
    const data = res.data;

    // 更新订单信息
    tableData.value = [{
      film: data.filmName || orderStore.filmInfo,
      start_time: formatDateTime(data.session?.startTime) || orderStore.startTime,
      end_time: formatDateTime(data.session?.endTime) || orderStore.endTime,
      seat: data.seatNumbers || orderStore.seats
    }];

    actualPay.value = data.totalAmount || 0;
    orderCreateTime.value = new Date(data.createdAt);
    expirationTime.value = new Date(data.createdAt.getTime() + 15 * 60 * 1000); // 15分钟过期

    startTimer(); // 启动倒计时
  } catch (error) {
    console.error('获取订单详情失败:', error);
    ElMessage.error(error.message || '获取订单详情失败');
    if (error.code === 40001) {
      orderStore.clearOrder();
      localStorage.removeItem('currentOrderId');
    }
  }
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  return isNaN(date) ? dateTime : date.toLocaleString();
}

// 定时器逻辑
let timer = null
const startTimer = () => {
  clearInterval(timer)
  timer = setInterval(() => {
    if (remainingSeconds.value <= 0) {
      clearInterval(timer)
      handleTimeout()
    }
  }, 1000)
}

const handleTimeout = () => {
  ElMessage.error('订单已超时，请重新选择')
}

onMounted(() => {
  orderId.value = route.params.id
  console.log('订单号为：'+orderId.value)
  tableData.value.film =orderStore.filmInfo
  tableData.value.start_time = orderStore.startTime
  tableData.value.end_time = orderStore.endTime
  tableData.value.seat = orderStore.seats
  fetchOrderDetails()

})

onBeforeUnmount(() => {
  clearInterval(timer)
})

const handlePay = () => {
  // 支付逻辑
  ElMessage.success('支付功能待实现')
}
</script>

<style scoped>
.movie-pay-container {
  width: 800px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
}

.pay-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actual-pay {
  font-size: 16px;
  color: #ff4949;
  font-weight: bold;
}
</style>