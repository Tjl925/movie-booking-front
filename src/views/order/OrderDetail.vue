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

    <!-- 订单信息表格 -->
    <el-table :data="tableData" border style="width: 100%; margin-bottom: 20px;">
      <el-table-column prop="film" label="影片" />
      <el-table-column prop="start_time" label="开始时间" />
      <el-table-column prop="end_time" label="截止时间" />
      <el-table-column prop="seat" label="座位" />
    </el-table>

    <!-- 支付方式选择 -->
    <div class="payment-methods">
      <h3>选择支付方式</h3>
      <el-radio-group v-model="paymentMethod">
        <el-radio label="ALIPAY">
          <img src="/src/assets/alipay.png" alt="支付宝" class="payment-icon" />
          支付宝支付
        </el-radio>
      </el-radio-group>
    </div>

    <!-- 实际支付及确认支付按钮 -->
    <div class="pay-info">
      <span class="actual-pay">实际支付：¥{{ actualPay }}</span>
      <div class="action-buttons">
        <el-button @click="handleCancel">取消订单</el-button>
        <el-button type="primary" @click="handlePay" :loading="payLoading">确认支付</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref, computed, watch} from 'vue'
import { useOrderStore } from "@/stores/orderInfo"
import {getOrderDetail, cancelOrder, getBySeatId} from '@/api/orders'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useUserInfoStore } from "@/stores/userInfo";
import request from "@/utils/request";

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const userInfoStore = useUserInfoStore();

// 定义倒计时相关变量
const orderCreateTime = ref(null)
const expirationTime = ref(null)

// 从路由参数获取orderId
const orderId = ref(null)

// 支付相关状态
const paymentMethod = ref('ALIPAY') // 默认支付宝
const payLoading = ref(false)

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
const countdownDisplay = ref('')

watch(remainingSeconds, (newVal) => {
  const mins = Math.floor(newVal / 60)
  const secs = newVal % 60
  countdownDisplay.value = `${mins} 分 ${secs} 秒`
}, { immediate: true, flush: 'sync' })



// 获取订单详情
const fetchOrderDetails = async () => {
  try {
    if (!orderId.value) throw new Error('未找到订单信息');

    const res = await getOrderDetail(orderId.value, userInfoStore.userInfo.id);
    const data = res.data;
    console.log('订单详情数据:', data);

    // 更新订单信息
    const seatIds = data.orderItems?.map(item => item.seatId);
    const seats = await Promise.all(seatIds.map(id => getBySeatId(id).then(r => r.data))) || orderStore.seats;
    tableData.value = [{
      film: data.session.movie.title || orderStore.filmInfo,
      start_time: formatDateTime(data.session?.sessionTime) || orderStore.startTime,
      end_time: formatDateTime(data.session?.endTime) || orderStore.endTime,
      seat: seats.map(seat => `${seat.seatRow}排${seat.seatColumn}座`).join('，')
    }];

    actualPay.value = data.totalAmount || 0;
    
    // 确保创建时间正确解析
    if (data.createdAt) {
      orderCreateTime.value = new Date(data.createdAt);
      // 设置过期时间为创建时间后15分钟
      expirationTime.value = new Date(orderCreateTime.value.getTime() + 15 * 60 * 1000);
    } else {
      console.error('订单创建时间不存在');
    }

    // 清除之前的定时器并启动新的倒计时
    clearInterval(timer);
    startTimer();
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
    // 强制更新remainingSeconds的值，触发计算属性重新计算
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expirationTime.value - now) / 1000))
    
    // 直接更新显示值
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    countdownDisplay.value = `${mins} 分 ${secs} 秒`
    
    if (remaining <= 0) {
      clearInterval(timer)
      handleTimeout()
    }
  }, 1000)
}

const handleTimeout = () => {
  ElMessage.error('订单已超时，请重新选择')
  router.push('/') // 超时返回首页
}

// 处理支付
const handlePay = async () => {
  try {
    if (remainingSeconds.value <= 0) {
      ElMessage.error('订单已超时，请重新选择')
      return
    }

    payLoading.value = true
    
    // 根据支付方式调用不同的支付接口
    const paymentEndpoint = '/api/alipay/pay'

    // 构建订单数据
    const seatStr = tableData.value[0].seat; // 例："01排05座，02排06座"
    const seatNumbers = seatStr.split('，').map(s => {
      const match = s.match(/(\d+)排(\d+)座/);
      if (match) {
        const row = match[1].padStart(2, '0');
        const col = match[2].padStart(2, '0');
        return `${row}${col}`;
      }
      return '';
    }).filter(Boolean).join(',');
    const orderData = {
      id: orderId.value,
      seatNumbers
    }
    console.log('反向映射后的座位列表:', seatNumbers)
    
    // 发送支付请求
    const response = await request.post(paymentEndpoint, orderData, {
      headers: {
        'token': userInfoStore.userInfo.token
      }
    })
    
    if (paymentMethod.value === 'ALIPAY') {
      // 支付宝支付 - 返回的是HTML表单，直接插入到页面中
      const payDiv = document.createElement('div')
      payDiv.innerHTML = response.data
      document.body.appendChild(payDiv)
      document.forms[0].submit() // 自动提交表单
    }
  } catch (error) {
    console.error('支付请求失败:', error)
    ElMessage.error(error.message || '支付请求失败')
  } finally {
    payLoading.value = false
  }
}

// 取消订单
const handleCancel = async () => {
  try {
    await cancelOrder(orderId.value, userInfoStore.userInfo.id)
    ElMessage.success('订单已取消')
    router.push('/')
  } catch (error) {
    console.error('取消订单失败:', error)
    ElMessage.error(error.message || '取消订单失败')
  }
}

// 用于存储所有需要清除的定时器
let refreshTimer = null

onMounted(async () => {
  orderId.value = route.params.id
  tableData.value[0].film = orderStore.filmInfo
  tableData.value[0].start_time = orderStore.startTime
  tableData.value[0].end_time = orderStore.endTime
  tableData.value[0].seat = orderStore.seats.map(seat => `${seat.seatRow}排${seat.seatColumn}座`).join('，')
  
  // 立即获取订单详情并初始化倒计时
  await fetchOrderDetails()
  
  // 设置定期刷新订单详情的定时器（每30秒刷新一次）
  refreshTimer = setInterval(async () => {
    await fetchOrderDetails()
  }, 30000) // 30秒刷新一次
})

// 组件卸载时清除所有定时器
onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(refreshTimer)
})
</script>

<style scoped>
.movie-pay-container {
  width: 1000px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
}

.payment-methods {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.payment-icon {
  width: 24px;
  height: 24px;
  margin-right: 5px;
  vertical-align: middle;
}

.pay-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.actual-pay {
  font-size: 16px;
  color: #ff4949;
  font-weight: bold;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>