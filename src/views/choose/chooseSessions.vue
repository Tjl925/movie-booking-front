<template>
  <TopNav />
  <div class="movie-details-container">
    <!-- 主要内容区域 -->
    <div class="movie-content">
      <!-- 电影基本信息区域 -->
      <el-row :gutter="30" class="info-section">
        <el-col :span="8">
          <div class="poster-container">
            <img :src="getFullUrl(movie.posterUrl)" alt="电影海报" class="movie-poster">
          </div>
        </el-col>
        <el-col :span="16">
          <div class="movie-info">
            <h1 class="mainmovie-title">{{ movie.title }}</h1>
            <!-- 电影标签 -->
            <div class="movie-tags">
              <el-tag v-for="tag in movie.tags" :key="tag" type="warning" size="medium">{{ tag }}</el-tag>
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
              <p>
                <span>累计票房：</span>
                <br>
                <span :class="['artistic-font', { 'text-gray-500': !movie.boxOffice }]">
                  {{ formattedBoxOffice }}
                </span>
              </p>
            </div>

            <!-- 评分和票房区域 -->
            <div class="rating-box">
              <div class="rating-score">
                <el-rate v-model="movie.rating" disabled text-color="#ffd700" size="large" />
                <span class="score-number">{{ movie.rating }}分</span>
                <span class="rating-count">({{ movie.ratingCount }}人评分)</span>
              </div>
              <div class="box-office">
                <span>观看人数：{{movie.viewCount}}人</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 场次列表区域 -->
      <div class="showtime-list-container">
        <h2 class="section-title">选择场次</h2>
        <div class="showtime-filter">
          <el-select v-model="selectedDate" placeholder="选择日期" style="width: 180px;">
            <el-option label="全部日期" value="" />
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
              v-for="showtime in paginatedShowtimes"
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
          <div class="pagination-container">
            <el-pagination
                v-model:current-page="currentPage"
                :page-size="pageSize"
                :total="filteredShowtimes.length"
                layout="prev, pager, next, jumper"
                background
                @current-change="handlePageChange"
            />
          </div>
        </div>
        <div v-else class="showtime-list">
          <el-empty description="暂无场次可选，敬请期待~" />
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
const cinemaOptions = ref([{ id: 0, name: '全部影厅' }]);
const dateOptions = ref([]);
const selectedDate = ref('')
const selectedCinema = ref(0)
const loading = ref(false);
const movie = ref({});
const currentPage = ref(1)
const pageSize = ref(10)

// 计算当前页显示的场次
const paginatedShowtimes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredShowtimes.value.slice(start, end)
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredShowtimes.value.length / pageSize.value)
})
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  // 可以添加滚动到顶部的行为
  window.scrollTo({
    top: document.querySelector('.showtime-list-container').offsetTop - 20,
    behavior: 'smooth'
  })
}
// 格式化票房数字
const formattedBoxOffice = computed(() => {
  if (!movie.value.boxOffice || movie.value.boxOffice === 0) {
    return '暂无数据';
  }
  return formatBoxOffice(movie.value.boxOffice);
});

const formatBoxOffice = (amount) => {
  if (!amount || amount === 0) return '暂无数据';
  const inWan = amount / 10000;
  if (inWan >= 10000) {
    const yi = Math.floor(inWan / 10000);
    const remainingWan = Math.floor(inWan % 10000);
    return `${yi}.${Math.floor(remainingWan/1000)}亿`;
  } else if (inWan >= 1) {
    return `${inWan.toFixed(1)}万`;
  } else {
    return amount.toString();
  }
};

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
      const now = dayjs();
      const today = now.format('YYYY-MM-DD');

      // 转换数据结构
      showtimes.value = sessionsRes.data.map(session => {
        const startTime = dayjs(session.sessionTime);
        return {
          id: session.sessionId,
          movieId: movieId,
          showDate: startTime.format('YYYY-MM-DD'),
          startTime: startTime.format('HH:mm'),
          endTime: dayjs(session.endTime).format('HH:mm'),
          cinemaName: session.cinemaName || '默认影院',
          hallName: session.hallName || '未知影厅',
          hallType: session.hallType || '标准厅',
          price: session.basePrice * (session.priceAdjustment || 1),
          availableSeats: session.availableSeats || 0,
          rawStartTime: startTime
        };
      });
      console.log(showtimes.value)
      // 生成日期选项（按日期排序）
      dateOptions.value = [...new Set(showtimes.value.map(item => item.showDate))]
          .sort((a, b) => new Date(a) - new Date(b));
      console.log(dateOptions.value)
      // 生成影厅选项
      const uniqueHalls = showtimes.value.reduce((acc, item) => {
        if (!acc.some(hall => hall.name === item.hallName)) {
          acc.push({ id: acc.length + 1, name: item.hallName });
        }
        return acc;
      }, []);

      cinemaOptions.value = [{ id: 0, name: '全部影厅' }, ...uniqueHalls];

      // 默认选中今天（如果今天有场次）
      const hasTodaySessions = showtimes.value.some(s => s.showDate === today);
      selectedDate.value = hasTodaySessions ? today : '';
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 修改筛选逻辑
const filteredShowtimes = computed(() => {
  return showtimes.value
      .filter(showtime => {
        // 日期匹配：如果没选日期则显示全部，否则匹配选中日期
        const dateMatch = !selectedDate.value || showtime.showDate === selectedDate.value;

        // 影厅匹配
        const hallMatch = selectedCinema.value === 0 ||
            showtime.hallName === cinemaOptions.value.find(c => c.id === selectedCinema.value)?.name;

        return dateMatch && hallMatch;
      })
      .sort((a, b) => a.rawStartTime - b.rawStartTime);
});

// 跳转到选座界面
const goToSeatSelection = (movieId, sessionId) => {
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
  if (!date) return '全部日期';
  return dayjs(date).format('YYYY年MM月DD日');
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 全局样式变量 */
:root {
  --primary-color: #f8fafc;
  --secondary-color: #ffffff;
  --accent-color: #e53e3e;
  --text-color: #1a202c;
  --light-text: #4a5568;
  --gold-color: #d4af37;
  --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
}

.movie-details-container {
  background: var(--bg-gradient);
  color: var(--text-color);
  min-height: 100vh;
  padding-bottom: 50px;
}

.movie-content {
  width: 1200px;
  margin: 0 auto;
  padding: 30px 0;
}

/* 信息区域样式 */
.info-section {
  background: var(--secondary-color);
  border-radius: 16px;
  padding: 15px 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  position: relative;
}

.info-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #e53e3e, #f56565, #ed8936);
  animation: gradientMove 15s linear infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.poster-container {
  position: relative;
  width: 95%;
  height: 50px;
  padding-bottom: 130%;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
}

.movie-poster {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.movie-poster:hover {
  transform: scale(1.03);
}

.movie-info {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mainmovie-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
  position: relative;
}

.mainmovie-title::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--accent-color);
  border-radius: 3px;
}

.movie-tags {
  margin: 15px 0;
}

.el-tag {
  background-color: #ebf8ff;
  border-color: #bee3f8;
  color: #3182ce;
  transition: all 0.3s ease;
  margin-right: 8px;
}

.el-tag:hover {
  background-color: #3182ce;
  border-color: #3182ce;
  color: white;
  transform: translateY(-3px);
}

.base-info {
  color: var(--light-text);
  line-height: 2;
  margin: 20px 0;
  font-size: 16px;
}

.base-info span {
  color: var(--text-color);
  margin-right: 10px;
  font-weight: 500;
}

/* 评分区域样式 */
.rating-box {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 15px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  width: 100%;
}

.rating-score {
  display: flex;
  align-items: center;
}

.score-number {
  font-size: 32px;
  font-weight: bold;
  color: #e53e3e;
  margin: 0 15px;
}

.rating-count, .box-office span {
  color: var(--light-text);
  font-size: 16px;
}

.artistic-font {
  font-family: 'Alex Brush', cursive;
  font-size: 28px;
  font-weight: normal;
  color: #6a11cb;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.text-gray-500 {
  color: #a0aec0;
}

/* 场次列表样式 */
.showtime-list-container {
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--text-color);
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--accent-color);
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .movie-content {
    width: 90%;
  }
}

@media (max-width: 992px) {
  .info-section {
    flex-direction: column;
  }

  .el-col {
    width: 100% !important;
    flex: none !important;
  }

  .rating-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .poster-container {
    padding-bottom: 100%;
  }

  .base-info, .rating-count, .box-office span {
    font-size: 14px;
  }
}

@media (max-width: 576px) {
  .movie-content {
    padding: 20px 15px;
  }

  .info-section {
    padding: 20px;
  }

  .score-number {
    font-size: 28px;
  }
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 15px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-pagination {
    --el-pagination-button-width: 28px;
    --el-pagination-button-height: 28px;
    font-size: 12px;
  }

  .el-pagination .btn-prev,
  .el-pagination .btn-next,
  .el-pagination .number {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
  }
}
</style>