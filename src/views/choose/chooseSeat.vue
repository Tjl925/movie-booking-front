<template>
  <TopNav />
  <div class="choose-seat-container">
    <!-- 顶部：电影海报轮播 -->
    <div class="top-carousel-section">
      <!-- 增加高度到400px -->
      <el-carousel
          :interval="4000"
          height="400px"
          indicator-position="outside"
      >
        <el-carousel-item v-for="movie in movies" :key="movie.id">
          <div class="carousel-image-container">
            <img
                :src="getUrl(movie.posterUrl)"
                class="carousel-poster"
                @click="goToMovieDetail(movie.id)"
            />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 中部：同影厅同日期电影海报 -->
    <div class="same-hall-movies">
      <h2 class="section-title">
        {{ selectedHall }} · {{ formatDate(selectedDate) }} 的其他电影
      </h2>
      <div class="movie-carousel-container">
        <el-carousel
            :interval="0"
            arrow="always"
            indicator-position="none"
            height="240px"
            @change="handleCarouselChange"
        >
          <el-carousel-item
              v-for="(page, index) in paginatedMovies"
              :key="index"
          >
            <div class="movie-page">
              <div
                  v-for="movie in page"
                  :key="movie.id"
                  class="poster-item"
                  :class="{ 'active': movie.id === currentMovieId }"
                  @click="switchMovie(movie.id)"
              >
                <img :src="getUrl(movie.posterUrl)" class="poster-image" />
                <p class="movie-title">{{ movie.title }}</p>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>

    <!-- 底部：场次信息表格 -->
    <div class="showtime-info">
      <h2 class="section-title">场次信息</h2>
      <div class="showtime-table-container">
        <table>
          <thead>
          <tr>
            <th class="time-column">放映时间</th>
            <th class="lang-column">语言版本</th>
            <th class="hall-column">影厅</th>
            <th class="price-column">售价</th>
            <th class="action-column">操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="session in currentSessions" :key="session.id">
            <td class="time-column">{{ session.time }}</td>
            <td class="lang-column">{{ session.language }}</td>
            <td class="hall-column">{{ session.hall }}</td>
            <td class="price-column">
              <span class="price-tag">{{ session.price }}</span>
            </td>
            <td class="action-column">
              <el-button
                  type="primary"
                  size="small"
                  @click="goToSeatSelection(session.id)"
                  class="select-seat-btn"
              >
                在线选座
              </el-button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import TopNav from "@/views/components/TopNav.vue"
import {getShowingMoives} from "@/api/user"


const route = useRoute()
const router = useRouter()

//顶部轮播热映电影
const movies = ref([])
const Page=ref({
  current:1,
  size:8,
})
const getMovies =async  ()=>{
  getShowingMoives(Page.value.current,Page.value.size).then(res=>{
    movies.value=res.data.records;
    console.log(res.data.records);
    console.log(movies);
  })
}
onMounted(async () => {
  await getMovies();
});
// 模拟数据
const mockMovies = [
  {
    id: '1',
    title: '疯狂动物城',
    posterUrl: '/posters/zootopia.jpg',
    duration: 108,
    genre: '动画/冒险'
  },
  {
    id: '2',
    title: '流浪地球',
    posterUrl: '/posters/wandering-earth.jpg',
    duration: 125,
    genre: '科幻/灾难'
  }
]

const mockSessions = [
  {
    id: '101',
    movieId: '1',
    date: '2024-10-01',
    time: '14:00 - 16:00',
    language: '中文',
    hall: '杜比厅',
    price: '50元'
  },
  {
    id: '102',
    movieId: '1',
    date: '2024-10-01',
    time: '19:00 - 21:00',
    language: '英文',
    hall: '杜比厅',
    price: '60元'
  }
]

// 从路由参数获取初始数据
const initialSessionId = route.params.sessionId || '101'
const currentMovieId = ref('1')
const selectedDate = ref('2024-10-01')
const selectedHall = ref('杜比厅')

// 数据状态 - 使用模拟数据
const showingMovies = ref(mockMovies.slice(0, 2))       // 顶部轮播的电影
const sameHallMovies = ref(mockMovies)                 // 同影厅同日期电影
const allSessions = ref(mockSessions)                  // 所有场次数据
const currentSessions = ref(mockSessions)              // 当前显示的场次

// 获取完整图片URL
const getUrl =(url)=>{
  return `http://127.0.0.1:8888/uploads${url}`;
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

// 跳转到电影详情
const goToMovieDetail = (movieId) => {
  console.log(`跳转到电影详情: ${movieId}`)
  // router.push(`/movie-detail/${movieId}`)
}

// 切换电影
const switchMovie = (movieId) => {
  currentMovieId.value = movieId
  updateCurrentSessions()
}

// 更新当前显示的场次
const updateCurrentSessions = () => {
  currentSessions.value = allSessions.value.filter(
      session => session.movieId === currentMovieId.value
  )
}

// 跳转到选座
const goToSeatSelection = (sessionId) => {
  console.log(`跳转到选座: ${sessionId}`)
}

onMounted(() => {
  // 初始化时确保选中电影的场次正确
  updateCurrentSessions()
})
</script>

<!-- 保持原有的样式不变 -->
<style scoped>
/* 原有的所有样式保持不变 */
.movie-carousel-container {
  margin: 0 auto;
  width: 100%;
  position: relative;
}

.movie-page {
  display: flex;
  justify-content: space-around;
  padding: 0 20px;
}

.poster-item {
  width: calc(100% / 7 - 10px);
  min-width: 120px;
  margin: 0 5px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.poster-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.poster-item:hover .poster-image {
  transform: scale(1.05);
}

.movie-title {
  margin-top: 8px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.showtime-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.showtime-table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px; /* 确保表格不会过窄 */
}

th, td {
  padding: 12px 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  background: #f7f7f7;
  font-weight: 500;
  color: #333;
}

/* 列宽调整 */
.time-column {
  width: 20%;
}
.lang-column {
  width: 15%;
}
.hall-column {
  width: 20%;
}
.price-column {
  width: 20%;
}
.action-column {
  width: 25%;
}

/* 价格样式 */
.price-tag {
  font-size: 16px;
  font-weight: bold;
  color: #ff4d4f;
}

/* 选座按钮样式 */
.select-seat-btn {
  background: #ff4d4f;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  transition: all 0.3s;
}

.select-seat-btn:hover {
  background: #ff7875;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  th, td {
    padding: 10px 8px;
    font-size: 14px;
  }

  .select-seat-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}
/* 调整轮播箭头样式 */
:deep(.el-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 20px;
}

:deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.5);
}
.choose-seat-container {
  width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.top-carousel-section {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.carousel-poster {
  width: 100%;
  height: 300px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}
/* 顶部轮播样式 */
.top-carousel-section {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 400px; /* 与el-carousel高度一致 */
}

.carousel-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 深色背景更适合电影海报 */
  /* 渐变背景更高级 */
  background: #000 linear-gradient(135deg, #1a1a1a 0%, #000 100%);
}

.carousel-poster {
  height: 90%; /* 给图片留出呼吸空间 */
  width: auto;
  max-width: 90%;
  object-fit: contain;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); /* 添加轻微阴影提升层次感 */
}
/* 响应式调整 */
.carousel-poster:hover {
  transform: scale(1.02); /* 悬停时有轻微放大效果 */
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}
/* ...其他样式保持不变... */
</style>