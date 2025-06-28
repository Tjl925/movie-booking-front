<template>
  <div class="seat-selection-container">
    <!-- 电影信息头部 -->
    <el-card shadow="hover" class="movie-info-card">
      <div class="movie-header">
        <el-image
            :src="getFullUrl(movie.posterUrl)"
            class="poster-img"
            fit="cover"
        ></el-image>
        <div class="movie-details">
          <h1 class="movie-title">{{ movie.title }}</h1>
          <div class="movie-tags">
            <el-tag
                v-for="tag in movie.tags"
                :key="tag"
                size="small"
                type="info"
            >{{ tag }}</el-tag>
          </div>
          <div class="movie-meta">
            <div class="meta-item">
              <el-icon><VideoCamera /></el-icon>
              <span>{{ movie.genre }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ movie.durationMinutes }}分钟</span>
            </div>
          </div>
          <div class="session-info">
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span> {{ session.hallName }}</span>
            </div>
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>放映时间:{{ formatDate(session.showDate) }} {{ session.startTime }}——{{ session.endTime }}</span>
            </div>
            <div class="info-item">
              <el-icon><Tickets /></el-icon>
              <span>{{ session.hallType }}</span>
            </div>
            <div class="info-item price">
              <el-icon><Money /></el-icon>
              <span>¥{{ session.price }}/张</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 进度条部分 -->
    <div class="progress-section">
      <el-steps :active="1" align-center>
        <el-step title="选择场次" description="已选择" />
        <el-step title="选择座位" description="进行中" />
        <el-step title="支付订单" description="待完成" />
      </el-steps>
    </div>

    <!-- 座位选择区域 -->
    <el-card shadow="hover" class="seat-selection-card">
      <template #header>
        <div class="card-header">
          <el-icon><Position /></el-icon>
          <span>座位选择</span>
        </div>
      </template>
      <div class="seat-area">
        <div class="screen-area">
          <div class="screen">
            <span>银幕中央</span>
          </div>
        </div>
        <div class="seat-map-container">
          <div class="seat-map">
            <div
                v-for="(row, rowIndex) in seatRows"
                :key="rowIndex"
                class="seat-row"
            >
              <div class="row-label">{{ String.fromCharCode(65 + rowIndex) }}</div>
              <div
                  v-for="(seat, seatIndex) in row"
                  :key="seatIndex"
                  :class="[
    'seat',
    seat.status === seatStatus.AVAILABLE ? 'available' : '',
    seat.status === seatStatus.RESERVED ? 'reserved' : '',
    seat.status === seatStatus.OCCUPIED ? 'occupied' : '',
    seat.status === seatStatus.MAINTENANCE ? 'maintenance' : '',
    seat.status === seatStatus.SELECTING ? 'selecting' : '',
    selectedSeats.includes(`${rowIndex}-${seatIndex}`) ? 'selected' : ''
  ]"
                  @click="selectSeat(rowIndex, seatIndex)"
              >
                {{ seat.seatNumber }}
              </div>
            </div>
          </div>
        </div>
        <div class="seat-legend">
          <div class="legend-item" v-for="item in legendItems" :key="item.type">
            <div :class="['legend-marker', item.type]"></div>
            <span class="legend-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 订单确认区域 -->
    <el-card shadow="hover" class="order-card">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>订单确认</span>
        </div>
      </template>
      <div class="order-content">
        <div class="selected-seats-section">
          <h4>已选座位：</h4>
          <div class="seat-tags">
            <el-tag
                v-for="(seat, index) in selectedSeatsDisplay"
                :key="index"
                type="danger"
                size="large"
                closable
                @close="removeSeat(seat)"
            >
              {{ seat }}
            </el-tag>
          </div>
        </div>
        <div class="total-price-section">
          <h4>总价：</h4>
          <span class="total-price">¥{{ totalPrice }}</span>
        </div>
        <el-form :model="form" class="contact-form" :rules="formRules" ref="formRef">
          <el-form-item label="手机号" prop="phone">
            <el-input
                v-model="form.phone"
                placeholder="请输入手机号"
                clearable
            >
              <template #prefix>
                <el-icon><Iphone /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        <el-button
            type="danger"
            size="large"
            class="confirm-btn"
            @click="confirmOrder"
        >
          确认选座
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted,nextTick } from 'vue'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { ElMessage,ElLoading } from 'element-plus'
import {
  getMovieById,
  updateSeatForSelection,
  getSeatsForSelection
} from "@/api/user"
import {
  VideoCamera,
  Clock,
  Location,
  Calendar,
  Tickets,
  Money,
  Position,
  Document,
  Iphone
} from '@element-plus/icons-vue'
import { useSessionStore } from '@/stores/session'
import {createOrder,getById} from "@/api/orders";
import {useUserInfoStore} from "@/stores/userInfo";
import {useOrderStore} from "@/stores/orderInfo";

// 从路由获取参数
const router = useRouter()
const route = useRoute()
const movieId = route.params.movieId
const sessionId = route.params.sessionId
const sessionStore = useSessionStore()
const sessionInfo = computed(() => sessionStore.currentSession)
const seatsInfo=ref({})
const frontSeatsInfo = ref([]); // 用于界面展示的座位状态
const backSeatsInfo = ref([]);  // 用于判断是否可选的真实座位状态
const userInfoStore = useUserInfoStore();
const orderStore = useOrderStore()
// 表单验证规则
const formRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 数据定义
const movie = ref({})
const session = ref({
  id: sessionId,
  movieId: movieId,
  showDate: '2024-06-26',
  startTime: '17:20',
  endTime: '19:07',
  hallName: '1厅',
  hallType: '中文2D',
  price: 40,
  availableSeats: 120
})
const seatRows = ref([])
const selectedSeats = ref([])
const form = ref({ phone: '' })
const formRef = ref(null)
// 数据定义
const seatStatus = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  SELECTING: 'SELECTING' // 新增的"当前选座"状态
}
// 图例项
const legendItems = ref([
  { type: 'available', text: '可选座位' },
  { type: 'reserved', text: '已预定座位' },
  { type: 'occupied', text: '已售座位' },
  { type: 'maintenance', text: '维修中座位' },
  { type: 'selecting', text: '当前选座' }, // 新增图例
])

// 方法定义
const getMovieDetail = async () => {
  const res = await getMovieById(movieId)
  if (res.status) {
    movie.value = res.data
  }
}
const getFullUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日')
}
const loadSeats = async () => {
  try {
    const response = await getSeatsForSelection(sessionId);
    console.log(response)
    if (response.data) {
      const rows = response.data.totalRows || 8;
      const cols = response.data.totalColumns || 10;

      // 初始化函数
      const initSeatMap = () => Array(rows).fill().map((_, rowIndex) =>
          Array(cols).fill().map((_, colIndex) => ({
            status: 'OCCUPIED',
            seatRow: rowIndex + 1,
            seatColumn: colIndex + 1,
            id: null,
            seatNumber: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
          }))
      );

      // 初始化前端状态图（可自由修改）
      frontSeatsInfo.value = initSeatMap();
      // 保存后端初始状态（只读参考）
      backSeatsInfo.value = initSeatMap();

      // 填充数据
      response.data.seats.forEach(seat => {
        const row = Number(seat.rowNumber) - 1;
        const col = Number(seat.columnNumber) - 1;

        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          const seatData = {
            ...seat,
            seatRow: seat.rowNumber,
            seatColumn: seat.columnNumber,
            seatNumber: `${String.fromCharCode(65 + row)}${col + 1}`,
            status: seat.status || 'AVAILABLE'
          };

          // 两个状态图初始状态相同
          frontSeatsInfo.value[row][col] = { ...seatData };
          backSeatsInfo.value[row][col] = { ...seatData };
        }
      });

      // 将前端状态图赋值给界面
      seatRows.value = frontSeatsInfo.value;
    }
  } catch (error) {
    console.error('加载座位失败:', error);
    ElMessage.error('加载座位失败');
  }
};

// 纯前端座位选择（完全不考虑后端状态）
// 修改selectSeat方法，确保状态一致性
const selectSeat = (rowIndex, seatIndex) => {
  const seat = frontSeatsInfo.value[rowIndex][seatIndex];
  const seatKey = `${rowIndex}-${seatIndex}`;

  // 只允许从AVAILABLE状态切换到SELECTING
  if (seat.status === 'AVAILABLE') {
    seat.status = 'SELECTING';
    selectedSeats.value.push(seatKey);
  }
  // 允许从SELECTING状态切换回AVAILABLE
  else if (seat.status === 'SELECTING') {
    seat.status = 'AVAILABLE';
    selectedSeats.value = selectedSeats.value.filter(s => s !== seatKey);
  }
  // 其他状态不允许操作
  else {
    ElMessage.warning('该座位当前不可选');
    return;
  }

  // 更新视图
  seatRows.value = [...frontSeatsInfo.value];
};

const removeSeat = (seatNumber) => {
  for (let i = 0; i < seatRows.value.length; i++) {
    for (let j = 0; j < seatRows.value[i].length; j++) {
      if (seatRows.value[i][j].seatNumber === seatNumber) {
        const index = selectedSeats.value.indexOf(`${i}-${j}`)
        if (index > -1) {
          selectedSeats.value.splice(index, 1)
        }
        return
      }
    }
  }
}

const confirmOrder = async () => {
  if (selectedSeats.value.length === 0) {
    ElMessage.error('请选择座位');
    return;
  }

  try {
    // 1. 验证表单
    await formRef.value.validate();

    // 2. 准备数据并验证
    const seatIds = new Set();
    const seatsToCheck = [];
    const seatDetails = []; // 新增：用于存储座位详情

    for (const pos of selectedSeats.value) {
      const [row, col] = pos.split('-').map(Number);
      const seat = seatRows.value[row][col];

      // 验证座位状态
      if (!seat || seat.status !== 'SELECTING') {
        throw new Error(`座位 ${seat?.seatNumber || '未知'} 状态无效`);
      }

      // 验证座位ID是否存在
      if (!seat.id) {
        throw new Error(`座位 ${seat.seatNumber} 缺少ID`);
      }

      // 检查重复座位
      if (seatIds.has(seat.id)) {
        throw new Error(`座位 ${seat.seatNumber} 被重复选择`);
      }
      seatIds.add(seat.id);

      seatsToCheck.push({
        seatId: seat.id,
        seatNumber: seat.seatNumber
      });

      // 收集座位详情
      seatDetails.push({
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        row: seat.seatRow,
        column: seat.seatColumn,
        price: session.value.price * (seat.priceMultiplier || 1)
      });
    }

    // 3. 显示加载中
    const loading = ElLoading.service({
      lock: true,
      text: '正在创建订单...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    try {
      // 4. 调用API创建订单
      const orderData = {
        sessionId: Number(sessionId),
        movieId: Number(movieId),
        userId: userInfoStore.userInfo.id,
        phone: form.value.phone,
        seatIds: seatsToCheck.map(seat => seat.seatId),
        seatDetails: seatDetails, // 新增座位详情
        totalPrice: totalPrice.value,
        movieTitle: movie.value.title,
        sessionInfo: {
          hallName: session.value.hallName,
          showTime: `${session.value.showDate} ${session.value.startTime}`
        }
      };

      console.log(orderData);
      const res = await createOrder(orderData, userInfoStore.userInfo.id);

      if (res.status) {
        console.log(res.data)
        const seatIds = res.data.orderItems.map(item => item.seatId)
        const seatsInfo = await Promise.all(
            seatIds.map(id => getById(id).then(r => r.data))
        )
        // 设置基本信息
        orderStore.setBasicInfo(
            res.data.session.movie.title,
            res.data.session.sessionTime,
            res.data.session.endTime,
            seatsInfo
        )

        // 确保数据已设置后再跳转
        await nextTick()

        router.push({
          path: `/order/${res.data.id}`,
          query: {
            totalPrice: totalPrice.value,
            phone: form.value.phone
          }
        })
      } else {
        await loadSeats();
        ElMessage.error(res.message || '创建订单失败');
      }
    } finally {
      loading.close();
    }
  } catch (error) {
    console.error('订单创建失败:', error);
    if (error.response) {
      ElMessage.error(error.response.data?.message || '创建订单失败');
    } else {
      ElMessage.error(error.message || '创建订单失败，请重试');
    }
    await loadSeats();
  }
};

// 计算属性
const totalPrice = computed(() => {
  return selectedSeats.value.reduce((total, pos) => {
    const [row, col] = pos.split('-')
    const seat = seatRows.value[row][col]
    console.log(seat.priceMultiplier)
    return total + (session.value.price * (seat.priceMultiplier || 1))
  }, 0)
})

const selectedSeatsDisplay = computed(() => {
  return selectedSeats.value.map(pos => {
    const [row, col] = pos.split('-')
    return seatRows.value[row][col].seatNumber
  })
})

// 初始化
onMounted(async () => {
  await getMovieDetail()
  if (!sessionInfo.value) {
    ElMessage.error('场次信息不存在，请重新选择')
    router.back()
    return
  }

  // 使用 store 中的数据
  session.value = {
    id: sessionId,
    movieId: movieId,
    showDate: sessionInfo.value.showDate,
    startTime: sessionInfo.value.startTime,
    endTime: sessionInfo.value.endTime,
    hallName: sessionInfo.value.hallName,
    hallType: sessionInfo.value.hallType,
    price: sessionInfo.value.price,
    availableSeats: sessionInfo.value.availableSeats
  }

  await loadSeats()
})
</script>

<style scoped lang="scss">
.seat-selection-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.seat-map {
  .seat-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    // 过道样式（假设第5列后有过道）
    &:not(.no-aisle) .seat:nth-child(5) {
      margin-right: 20px; // 过道宽度
    }
  }
}
.movie-info-card {
  margin-bottom: 24px;

  .movie-header {
    display: flex;
    gap: 24px;
    align-items: flex-start;

    .poster-img {
      width: 180px;
      height: 250px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .movie-details {
      flex: 1;

      .movie-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 16px 0;
        color: #333;
      }

      .movie-tags {
        margin-bottom: 20px;

        .el-tag {
          margin-right: 8px;
        }
      }

      .movie-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 16px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;

          .el-icon {
            font-size: 18px;
          }
        }
      }

      .session-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;

          .el-icon {
            color: var(--el-color-primary);
          }

          &.price {
            color: var(--el-color-danger);

            .el-icon {
              color: var(--el-color-danger);
            }
          }
        }
      }
    }
  }
}

.progress-section {
  margin: 32px 0;

  :deep(.el-step) {
    .el-step__head {
      &.is-process {
        color: var(--el-color-danger);
        border-color: var(--el-color-danger);

        .el-step__icon {
          background-color: var(--el-color-danger);
          color: white;
        }
      }
    }

    .el-step__title {
      font-weight: 500;

      &.is-process {
        color: var(--el-color-danger);
        font-weight: bold;
      }
    }
  }
}

.seat-selection-card {
  margin-bottom: 24px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .seat-area {
    .screen-area {
      margin-bottom: 24px;

      .screen {
        height: 40px;
        background: linear-gradient(to bottom, #e0e0e0, #f5f5f5);
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &::before,
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 2px;
          background: linear-gradient(to right, transparent, #ccc, transparent);
        }

        &::before {
          left: 0;
        }

        &::after {
          right: 0;
        }

        span {
          position: relative;
          z-index: 1;
          font-weight: bold;
          color: #666;
          letter-spacing: 2px;
        }
      }
    }

    .seat-map-container {
      display: flex;
      justify-content: center;

      .seat-map {
        .seat-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;

          .row-label {
            width: 24px;
            text-align: center;
            font-weight: bold;
            color: #666;
            margin-right: 8px;
          }

          .seat {
            width: 36px;
            height: 36px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            margin: 0 4px;
            transition: all 0.2s;

            &.available {
              background-color: var(--el-color-success);
              color: white;

              &:hover {
                transform: scale(1.1);
                box-shadow: 0 0 0 2px rgba(var(--el-color-success-rgb), 0.3);
              }
            }

            &.reserved {
              background-color: var(--el-color-warning);
              color: white;
              cursor: not-allowed;
            }

            &.occupied {
              background-color: #dcdfe6;
              color: #909399;
              cursor: not-allowed;
            }

            &.maintenance {
              background-color: var(--el-color-info);
              color: white;
              cursor: not-allowed;
            }
            &.selecting {
              background-color: var(--el-color-warning); /* 改为橙色或其他颜色 */
              color: white; /* 文字颜色改为白色 */
              cursor: pointer;
              transform: scale(1.1);
              box-shadow: 0 0 0 2px rgba(var(--el-color-warning-rgb), 0.3);
            }



            // 修改不可选状态的鼠标样式
            &.reserved, &.occupied, &.maintenance {
              cursor: not-allowed;
            }
            &.selected {


              background-color: var(--el-color-danger);
              color: white;
              transform: scale(1.1);
              box-shadow: 0 0 0 2px rgba(var(--el-color-danger-rgb), 0.3);

              &:hover {
                background-color: var(--el-color-danger-light-3);
              }
            }
          }
        }
      }
    }

    .seat-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 24px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .legend-marker {
          width: 16px;
          height: 16px;
          border-radius: 2px;

          &.available {
            background-color: var(--el-color-success);
          }

          &.reserved {
            background-color: var(--el-color-warning);
          }

          &.occupied {
            background-color: #dcdfe6;
          }

          &.maintenance {
            background-color: var(--el-color-info);
          }
          &.selecting {
            background-color: var(--el-color-danger);
          }
          &.selected {
            background-color: var(--el-color-danger);
          }
        }

        .legend-text {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }
}

.order-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .order-content {
    .selected-seats-section {
      margin-bottom: 20px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #666;
      }

      .seat-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .total-price-section {
      display: flex;
      align-items: center;
      margin-bottom: 24px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #666;
      }

      .total-price {
        margin-left: 12px;
        font-size: 24px;
        font-weight: bold;
        color: var(--el-color-danger);
      }
    }

    .contact-form {
      margin-bottom: 24px;
    }

    .confirm-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: bold;
    }
  }
}
</style>