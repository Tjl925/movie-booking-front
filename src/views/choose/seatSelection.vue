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
  seat.status === 'AVAILABLE' ? 'available' : '',
  seat.status === 'RESERVED' ? 'reserved' : '',
  seat.status === 'OCCUPIED' ? 'occupied' : '',
  seat.status === 'MAINTENANCE' ? 'maintenance' : '',
  selectedSeats.includes(`${rowIndex}-${seatIndex}`) ? 'selected' : ''
]"
                  @click="seat?.status === 'AVAILABLE' ? selectSeat(rowIndex, seatIndex) : null"
              >
                {{ String.fromCharCode(65 + rowIndex) }}{{ seatIndex + 1 }}
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
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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

// 从路由获取参数
const router = useRouter()
const route = useRoute()
const movieId = route.params.movieId
const sessionId = route.params.sessionId
const sessionStore = useSessionStore()
const sessionInfo = computed(() => sessionStore.currentSession)

// 表单验证规则
const formRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 数据定义
const movie = ref({})
const cinema = ref({ name: 'CGV影城(新都IMAX店)' })
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

// 图例项
const legendItems = ref([
  { type: 'available', text: '可选座位' },
  { type: 'reserved', text: '已预定座位' },
  { type: 'occupied', text: '已售座位' },
  { type: 'maintenance', text: '维修中座位' },
  { type: 'selected', text: '已选座位' }
])

// 方法定义
const getMovieDetail = async () => {
  const res = await getMovieById(movieId)
  if (res.status) {
    movie.value = res.data
  }
}

const loadSeats = async () => {
  try {
    const response = await getSeatsForSelection(sessionId);
    console.log('Backend seats data:', response.data);

    if (response.data) {
      // 1. 获取影厅行列数（从后端返回或使用默认值）
      const rows = response.data.totalRows || 8;
      const cols = response.data.totalColumns || 10;

      // 2. 创建并初始化座位图（全部设为OCCUPIED）
      const seatsMap = Array(rows).fill().map((_, rowIndex) =>
          Array(cols).fill().map((_, colIndex) => ({
            status: 'OCCUPIED',
            seatRow: rowIndex + 1,
            seatColumn: colIndex + 1,
            id: null,
            seatNumber: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
          }))
      );

      // 3. 用后端数据覆盖有效座位
      response.data.seats.forEach(seat => {
        // 注意：使用 rowNumber 和 columnNumber 而不是 seatRow/seatColumn
        const row = Number(seat.rowNumber) - 1;
        const col = Number(seat.columnNumber) - 1;

        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          seatsMap[row][col] = {
            ...seat,
            // 确保字段名一致
            seatRow: seat.rowNumber,
            seatColumn: seat.columnNumber,
            seatNumber: `${String.fromCharCode(65 + row)}${col + 1}`,
            status: seat.status || 'AVAILABLE'
          };
        } else {
          console.warn('Seat position out of range:', seat);
        }
      });

      seatRows.value = seatsMap;
      console.log('Processed seats map:', seatRows.value);
    }
  } catch (error) {
    console.error('加载座位失败:', error);
    ElMessage.error('加载座位失败');
  }
};

const getFullUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

const selectSeat = async (rowIndex, seatIndex) => {
  const seat = seatRows.value[rowIndex][seatIndex];

  if (!seat || seat.status !== 'AVAILABLE') {
    ElMessage.warning('该座位不可选');
    return;
  }

  const seatKey = `${rowIndex}-${seatIndex}`;
  const isSelected = selectedSeats.value.includes(seatKey);

  try {
    // 乐观更新UI
    if (isSelected) {
      selectedSeats.value = selectedSeats.value.filter(s => s !== seatKey);
    } else {
      if (selectedSeats.value.length >= 6) {
        ElMessage.warning('最多只能选择6个座位');
        return;
      }
      selectedSeats.value.push(seatKey);
    }

    // 修改请求数据格式以匹配后端DTO
    const requestData = {
      seatId: seat.id,
      status: isSelected ? 'AVAILABLE' : 'RESERVED'
    };

    const response = await updateSeatForSelection(requestData);

    if (!response?.success) {
      // 回滚UI状态
      selectedSeats.value = isSelected
          ? [...selectedSeats.value, seatKey]
          : selectedSeats.value.filter(s => s !== seatKey);
      ElMessage.error(response?.message || '操作失败');
      return;
    }

    // 只更新当前座位状态，而不是重新加载整个座位图
    seatRows.value[rowIndex][seatIndex].status = isSelected ? 'AVAILABLE' : 'RESERVED';

  } catch (error) {
    console.error('更新座位状态失败:', error);
    // 回滚UI状态
    selectedSeats.value = isSelected
        ? [...selectedSeats.value, seatKey]
        : selectedSeats.value.filter(s => s !== seatKey);

    if (error.response?.data) {
      ElMessage.error(`服务器错误: ${error.response.data.message || error.response.statusText}`);
    } else {
      ElMessage.error('网络错误，请检查连接');
    }
  }
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
    ElMessage.error('请选择座位')
    return
  }

  try {
    await formRef.value.validate()

    // 这里可以添加跳转到支付页面的逻辑
    router.push({
      path: `/payment/${movieId}/${sessionId}`,
      query: {
        seats: selectedSeatsDisplay.value.join(','),
        totalPrice: totalPrice.value,
        phone: form.value.phone
      }
    })

  } catch (error) {
    console.error('表单验证失败', error)
  }
}

// 计算属性
const totalPrice = computed(() => {
  return selectedSeats.value.reduce((total, pos) => {
    const [row, col] = pos.split('-')
    const seat = seatRows.value[row][col]
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