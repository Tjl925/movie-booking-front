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

    <!-- 支付方式选择 -->
    <div class="payment-methods">
      <h3>选择支付方式</h3>
      <el-radio-group v-model="paymentMethod">
        <el-radio label="ALIPAY">
          <img src="/src/assets/alipay.png" alt="支付宝" class="payment-icon" />
          支付宝支付
        </el-radio>
        <el-radio label="WECHAT">
          <img src="/src/assets/wechat.png" alt="微信支付" class="payment-icon" />
          微信支付
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

    <!-- 支付二维码弹窗 -->
    <el-dialog
      v-model="qrCodeDialogVisible"
      title="请扫码支付"
      width="400px"
      center
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="qrcode-container">
        <div v-if="paymentMethod === 'WECHAT'" class="qrcode-content">
          <div v-html="paymentQrCode"></div>
          <p>请使用微信扫一扫</p>
        </div>
        <div v-else-if="paymentMethod === 'ALIPAY'" class="qrcode-content">
          <div v-html="paymentQrCode"></div>
          <p>请使用支付宝扫一扫</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelPayment">取消支付</el-button>
          <el-button type="success" @click="checkPaymentStatus">已完成支付</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useOrderStore } from "@/stores/orderInfo"
import { getOrderDetail, cancelOrder, checkOrderStatus } from '@/api/orders'
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
const qrCodeDialogVisible = ref(false)
const paymentQrCode = ref('')

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

    const res = await getOrderDetail(orderId.value, userInfoStore.userInfo.id);
    const data = res.data;

    // 更新订单信息
    tableData.value = [{
      film: data.filmName || orderStore.filmInfo,
      start_time: formatDateTime(data.session?.sessionTime) || orderStore.startTime,
      end_time: formatDateTime(data.session?.endTime) || orderStore.endTime,
      seat: data.seatNumbers || orderStore.seats
    }];
    console.log('后端获取的电影名', data.filmName)
    console.log('后端获取的座位', data.seatNumbers)

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
    const paymentEndpoint = paymentMethod.value === 'ALIPAY' ? '/api/alipay/pay' : '/api/wxpay/pay'
    
    // 构建订单数据
    const orderData = {
      id: orderId.value,
      seatNumbers: tableData.value[0].seat
    }
    console.log('从后端得到的座位列表:', tableData.value[0].seat)
    
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
    } else {
      // 微信支付 - 返回的是二维码链接，显示二维码弹窗
      paymentQrCode.value = response.data
      qrCodeDialogVisible.value = true
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

// 取消支付
const cancelPayment = () => {
  qrCodeDialogVisible.value = false
  ElMessage.info('已取消支付')
}

// 检查支付状态
const checkPaymentStatus = async () => {
  try {
    const res = await checkOrderStatus(orderId.value)
    if (res.data.status === 'PAID') {
      ElMessage.success('支付成功')
      qrCodeDialogVisible.value = false
      router.push('/payment-success/' + orderId.value) // 支付成功后跳转到支付成功页面
    } else {
      ElMessage.warning('未检测到支付完成，请稍后再试')
    }
  } catch (error) {
    console.error('检查支付状态失败:', error)
    ElMessage.error(error.message || '检查支付状态失败')
  }
}

onMounted(() => {
  orderId.value = route.params.id
  console.log('订单号为：'+orderId.value)
  tableData.value[0].film = orderStore.filmInfo
  tableData.value[0].start_time = orderStore.startTime
  tableData.value[0].end_time = orderStore.endTime
  tableData.value[0].seat = orderStore.seats
  fetchOrderDetails()
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
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