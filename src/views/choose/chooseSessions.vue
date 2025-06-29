<template>
  <TopNav />
  <div class="booking-page">
    <!-- 电影基本信息区域 -->
    <div class="movie-info-card">
      <el-row :gutter="30" class="info-section">
        <el-col :span="8">
          <div class="poster-container">
            <img :src="getFullUrl(movie.posterUrl)" alt="电影海报" class="movie-poster">
          </div>
        </el-col>
        <el-col :span="16">
          <div class="movie-info">
            <h1 class="movie-title">{{ movie.title }}</h1>

            <!-- 电影标签 -->
            <div class="movie-tags">
              <el-tag v-for="tag in movie.tags" :key="tag" type="info" size="small">{{ tag }}</el-tag>
            </div>

            <!-- 基本信息 -->
            <div class="base-info">
              <p>
                <span>导演：{{ movie.director }}</span>
              </p>
              <p>
                <span>主演：{{ movie.actors }}</span>
              </p>
              <p>
                <span>类型：{{ movie.genre }}</span>
                <span>地区：{{ movie.country }}</span>
              </p>
              <p>
                <span>时长：{{ movie.durationMinutes }}分钟</span>
                <span>上映日期：{{ formatDate(movie.releaseDate) }}</span>
              </p>
            </div>

            <!-- 评分和票房 -->
            <div class="rating-box">
              <div class="rating-score">
                <el-rate v-model="movie.rating" disabled text-color="#ff9900" />
                <span class="score-number">{{ movie.rating }}分</span>
                <span class="rating-count">({{ movie.ratingCount }}人评分)</span>
              </div>
              <div class="box-office">
                <span>觀看人數：{{movie.viewCount}}人</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 场次列表区域 -->
    <div class="showtime-list-container">
      <h2 class="section-title">选择场次</h2>
      <div class="showtime-filter">
        <el-select v-model="selectedDate" placeholder="选择日期" style="width: 180px;">
          <el-option
              v-for="date in dateOptions"
              :key="date"
              :label="formatDate(date)"
              :value="date"
          />
        </el-select>
        <el-select v-model="selectedCinema" placeholder="选择影院" style="width: 180px;">
          <el-option
              v-for="cinema in cinemaOptions"
              :key="cinema.id"
              :label="cinema.name"
              :value="cinema.id"
          />
        </el-select>
      </div>

      <div v-if="filteredShowtimes.length > 0" class="showtime-list">
        <div
            v-for="showtime in filteredShowtimes"
            :key="showtime.id"
            class="showtime-item"
        >
          <div class="showtime-info">
            <div class="showtime-cinema">{{ showtime.cinemaName }}</div>
            <div class="showtime-time-row">
              <span class="showtime-date">{{ formatDate(showtime.showDate) }}</span>
              <span class="showtime-time">{{ showtime.startTime }} - {{ showtime.endTime }}</span>
            </div>
            <div class="showtime-hall-row">
              <el-tag class="hall-type-tag" effect="dark" :type="getHallTypeTagType(showtime.hallType)">
                {{ showtime.hallType }}
              </el-tag>
              <span class="hall-name">{{ showtime.hallName }}</span>
            </div>
            <div class="showtime-seats" :class="{ 'low-seats': showtime.availableSeats < 10 }">
              剩余座位: {{ showtime.availableSeats }}
            </div>
          </div>
          <div class="showtime-actions">
            <div class="price-container">
              <span class="price">¥{{ showtime.price.toFixed(2) }}</span>
              <span class="price-hint">起</span>
            </div>
            <el-button
                type="primary"
                @click="goToSeatSelection(showtime.movieId, showtime.id)"
                :disabled="showtime.availableSeats <= 0"
            >
              {{ showtime.availableSeats > 0 ? '选座购票' : '已售罄' }}
            </el-button>
          </div>
        </div>
      </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElSelect, ElOption, ElButton, ElRate, ElTag } from 'element-plus'
import dayjs from 'dayjs'
import { getSessionInfosByMovieId } from "@/api/user";
import TopNav from "@/views/components/TopNav.vue";
import { useSessionStore } from '@/stores/session'
import { getMovieById } from "@/api/movie";

const route = useRoute()
const router = useRouter()
const movieId = route.params.id;

const showtimes = ref([]);
const cinemaOptions = ref([{ id: 0, name: '全部影厅' }]); // 改为影厅选择
const dateOptions = ref([]);
const selectedDate = ref('')
const selectedCinema = ref(0) // 现在实际是选择影厅
const loading = ref(false);
const movie = ref({});
const getHallTypeTagType = (hallType) => {
  const typeMap = {
    'IMAX': 'danger',
    '杜比全景声': 'warning',
    '4DX': 'success',
    '巨幕': '',
    '标准厅': 'info'
  };
  return typeMap[hallType] || 'info';
};
const fetchData = async () => {
  loading.value = true;
  try {
    // 获取电影详情
    const movieRes = await getMovieById(movieId);
    if (movieRes.status) {
      movie.value = movieRes.data;
    }

    // 获取场次数据
    const sessionsRes = await getSessionInfosByMovieId(movieId);
    console.log('API返回的场次数据:', sessionsRes.data);

    if (sessionsRes.status) {
      // 转换数据结构 - 根据SessionInfo结构调整
      showtimes.value = sessionsRes.data.map(session => ({
        id: session.sessionId,
        movieId: movieId,
        showDate: dayjs(session.startTime).format('YYYY-MM-DD'),
        startTime: dayjs(session.startTime).format('HH:mm'),
        endTime: dayjs(session.endTime).format('HH:mm'),
        cinemaId: 0, // 没有影院ID，统一设为0
        cinemaName: '默认影院', // 因为没有影院信息
        hallId: 0, // 没有hallId返回，可能需要调整
        hallName: session.hallName || '未知影厅',
        hallType: session.hallType || '标准厅',
        price: session.minPrice ? Number(session.minPrice) : 0, // 使用minPrice作为价格
        availableSeats: session.availableSeats || 0
      }));

      // 生成日期选项
      dateOptions.value = [...new Set(showtimes.value.map(item => item.showDate))].sort();

      // 生成影厅选项（因为没有影院，改为影厅筛选）
      const uniqueHalls = showtimes.value.reduce((acc, item) => {
        if (!acc.some(hall => hall.name === item.hallName)) {
          acc.push({
            id: acc.length + 1, // 生成唯一ID
            name: item.hallName
          });
        }
        return acc;
      }, []);

      cinemaOptions.value = [{ id: 0, name: '全部影厅' }, ...uniqueHalls];

      // 设置默认选中第一个日期
      if (dateOptions.value.length > 0) {
        selectedDate.value = dateOptions.value[0];
      }
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 计算属性：筛选后的场次列表
const filteredShowtimes = computed(() => {
  return showtimes.value.filter(showtime => {
    const dateMatch = !selectedDate.value || showtime.showDate === selectedDate.value;
    // 现在cinemaId没有意义，改为按影厅名称筛选
    const hallMatch = selectedCinema.value === 0 ||
        showtime.hallName === cinemaOptions.value.find(c => c.id === selectedCinema.value)?.name;
    return dateMatch && hallMatch;
  });
});

// 跳转到选座界面
const goToSeatSelection = (movieId, sessionId) => {
  // 找到当前点击的场次
  const selectedShowtime = showtimes.value.find(s => s.id === sessionId)
  if (!selectedShowtime) return

  const sessionStore = useSessionStore()
  sessionStore.setCurrentSession({
    id: sessionId,
    movieId: movieId,
    showDate: selectedShowtime.showDate,
    startTime: selectedShowtime.startTime,
    endTime: selectedShowtime.endTime,
    hallName: selectedShowtime.hallName,
    hallType: selectedShowtime.hallType,
    price: selectedShowtime.price,
    availableSeats: selectedShowtime.availableSeats
  })
  router.push(`/seat-selection/${movieId}/${sessionId}`)
}

// 获取完整图片URL
const getFullUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.booking-page {
  width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
  /* 改为渐变色背景，增加层次感 */
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  min-height: 100vh; /* 确保背景覆盖整个视口 */
}
.booking-page::after {
  content: "";
  display: block;
  height: 80px;
  width: 100%;
  background: linear-gradient(to top, #4a90e2, transparent);
  margin-top: 30px;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}
/* 电影信息卡片 */
.movie-info-card,
.showtime-list-container {
  background-color: #fff;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  /* 增强阴影效果，模拟悬浮感 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

/* 鼠标悬停时微抬升效果 */
.movie-info-card:hover,
.showtime-list-container:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
}

.poster-container {
  position: relative;
  text-align: center;
}

.movie-poster {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

.movie-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

/* 场次列表 */
.showtime-list-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.showtime-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.showtime-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.showtime-item:hover {
  background-color: #f5f5f5;
}

.showtime-info {
  flex: 1;
  min-width: 0;
}

.showtime-cinema {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.showtime-time-row {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.showtime-date,
.showtime-time {
  color: #666;
  font-size: 14px;
}

.showtime-hall-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hall-type-tag {
  height: 24px;
  line-height: 22px;
  font-size: 12px;
}

.hall-name {
  color: #666;
  font-size: 14px;
}

.showtime-seats {
  color: #666;
  font-size: 14px;
}

.showtime-seats.low-seats {
  color: #e64340;
  font-weight: bold;
}

.showtime-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.price-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price {
  color: #e64340;
  font-weight: bold;
  font-size: 18px;
  line-height: 1;
}

.price-hint {
  color: #999;
  font-size: 12px;
  margin-top: 2px;
}

.no-sessions {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>