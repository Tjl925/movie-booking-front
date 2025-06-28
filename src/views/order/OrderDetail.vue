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
        :title="`请在 ${minutes} 分 ${seconds} 秒内完成支付`"
        type="warning"
        description="超时订单会自动取消，如遇支付问题，请致电客服：1010-5335"
        show-icon
        style="margin-bottom: 20px;"
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
import {ElSteps, ElStep, ElAlert, ElTag, ElTable, ElTableColumn, ElButton, ElMessage} from 'element-plus'
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {useOrderStore} from "@/stores/orderInfo";

const orderStore = useOrderStore()

// 新增座位格式化函数
const formatSeatNumber = (seatCode) => {
  if (!seatCode) return '';

  // 将数字转为字符串并补零到4位
  const codeStr = String(seatCode).padStart(4, '0');

  // 提取排数和座位号
  const row = parseInt(codeStr.substring(0, 2));
  const seat = parseInt(codeStr.substring(2));

  return `${row}排${seat}座`;
}



// 倒计时相关变量
const totalTime = 15 * 60 // 15分钟的总秒数
const remainingTime = ref(totalTime)
const timer = ref(null)
const minutes = ref(0)
const seconds = ref(0)

// 格式化时间显示
const formatTime = () => {
  minutes.value = Math.floor(remainingTime.value / 60)
  seconds.value = remainingTime.value % 60
}

// 开始倒计时
const startTimer = () => {
  timer.value = setInterval(() => {
    remainingTime.value--
    formatTime()

    if (remainingTime.value <= 0) {
      clearInterval(timer.value)
      handleTimeout()
    }
  }, 1000)
}

// 倒计时结束处理
const handleTimeout = () => {
  ElMessage.error('订单已超时，请重新选择')
  // 这里可以添加更多超时处理逻辑，如跳转页面或调用API取消订单
}
// 组件挂载时启动定时器
onMounted(() => {
  formatTime()
  startTimer()

  // 正确更新tableData
  tableData.value = [{
    film: orderStore.filmInfo,
    start_time: orderStore.startTime,
    end_time: orderStore.endTime,
    seat: orderStore.seats.map(s => s.seatNumber).join(', ')
  }]
})

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
const tableData = ref([
  {
    film: '',
    start_time: '',
    end_time: '',
    seat: '',
  }
])
const actualPay = ref(65)

const handlePay = () => {
  // 这里可编写调用支付接口等逻辑，示例仅做简单提示
  alert('确认支付，后续可完善支付流程逻辑')
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