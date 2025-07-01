<template>
  <div class="movie-details-container">
    <!-- 顶部导航 -->
    <TopNav />
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
            <h1 class="movie-title">{{ movie.title }}</h1>
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

            <!-- 评分和票房区域 - 优化布局 -->
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
      <!-- 特惠购票按钮 - 优化样式 -->
      <div class="booking-button-container movie-booking-btn">
        <el-button type="danger" size="large" @click="goToBooking" class="book-btn">
          <i class="el-icon-ticket" /> 特惠购票
        </el-button>
      </div>
      <!-- 标签页导航（优化样式） -->
      <el-tabs v-model="activeTab" class="tabs" type="card">
        <el-tab-pane label="介绍" name="intro">
          <div class="tab-content">
            <p class="plot-summary">{{ movie.description }}</p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="预告片" name="trailers">
          <div class="tab-content">
            <div v-if="movie.trailerUrl" class="trailer-player">
              <video-player
                  :src="getFullUrl(movie.trailerUrl)"
                  type="video/mp4"
                  :options="{
                  autoplay: false,
                  muted: true,
                  controls: true,
                  responsive: true,
                  techOrder: ['html5'],
                  fluid: true
                }"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div class="recommendations-section">
        <h3 class="section-title">猜你喜欢</h3>
        <div class="movie-grid">
          <div v-for="(movie, index) in recommendedMovies" :key="index" class="movie-card" @click="goToDetail(movie.id)">
            <img :src="getFullUrl(movie.posterUrl)" :alt="movie.title" class="movie-thumbnail">
            <div class="movie-info">
              <h4 class="movie-title">{{ movie.title }}</h4>
              <div class="movie-meta">
                <el-rate v-model="movie.rating" disabled show-score text-color="#ff9900" score-template="{value}分" />
                <span class="genre">{{ movie.genre }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, nextTick} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElTabs, ElTabPane, ElRate, ElButton, ElCarousel, ElCarouselItem, ElIcon
} from 'element-plus'
import dayjs from 'dayjs'
import TopNav from "@/views/components/TopNav.vue";
import {getMovieById,getMovieRecommendations} from "@/api/movie"
import { VideoPlayer } from '@videojs-player/vue';
import 'video.js/dist/video-js.css';
// 接收路由参数
const route = useRoute();
const router = useRouter();
let movieId = route.params.id;
// 标签页激活状态
const activeTab = ref('intro');
const recommendedMovies = ref([]);
// 电影详情数据
const movie = ref({});
const getMovieDetail= async ()=>{
  getMovieById(movieId).then(res=>{
    console.log(res)
    if(res.status ){
      movie.value=res.data
    }
  })
}
const getMovieRecommend= async ()=>{
  getMovieRecommendations(movieId).then(res=>{
    console.log(res)
    if(res.status ){
      recommendedMovies.value=res.data
    }
  })
}
const goToDetail = (movieIds) => {
  movieId=movieIds
  loadPage()
};
const loadPage = async () => {
  await getMovieDetail();
  await getMovieRecommend();
  await nextTick(); // 等待DOM更新
  window.scrollTo(0, 0);
};
onMounted(async () => {
  await getMovieDetail();
  await getMovieRecommend();
})
// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日');
};

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
// 获取完整图片URL
const getFullUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`;
};

// 跳转到购票页面
const goToBooking = () => {
  router.push(`/chooseSessions/${movieId}`);
};

// 播放预告片
</script>

<style scoped>
/* 全局样式变量 - 优化颜色对比度 */
:root {
  --primary-color: #f8fafc;         /* 浅色背景 */
  --secondary-color: #ffffff;       /* 卡片背景 */
  --accent-color: #e53e3e;           /* 强调色-红色 */
  --text-color: #1a202c;             /* 主要文字-深灰色 */
  --light-text: #4a5568;             /* 次要文字-中灰色 */
  --gold-color: #d4af37;             /* 评分金色 */
  --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); /* 浅色渐变背景 */
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

.movie-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 10px;
  color: var(--text-color);
  position: relative;
  display: inline-block;
}

.movie-title::after {
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

/* 购票按钮样式 */
.booking-button-container {
  margin: 30px auto 20px; /* 上下边距，水平居中 */
  text-align: center;
  width: 100%; /* 占满父容器宽度 */
}

.book-btn {
  /* 放大尺寸 */
  font-size: 24px;
  padding: 16px 40px;
  border-radius: 35px;

  /* 突出视觉效果 */
  background: linear-gradient(135deg, #e53e3e, #f56565); /* 渐变背景 */
  box-shadow: 0 8px 25px rgba(229, 62, 62, 0.3); /* 更强阴影 */
  color: white; /* 文字颜色改为白色 */

  /* 动画效果 */
  transition: all 0.3s ease;
}

.book-btn:hover {
  transform: translateY(-5px); /* 悬停上移效果更明显 */
  box-shadow: 0 12px 35px rgba(229, 62, 62, 0.4);
  background: linear-gradient(135deg, #c53030, #ed8936); /* 悬停时渐变变化 */
}

.book-btn i {
  margin-right: 12px;
  font-size: 24px; /* 图标同步放大 */
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
/* 标签页样式 */
.tabs {
  margin-bottom: 30px;
}

.el-tabs {
  background: var(--secondary-color);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.el-tabs__header {
  border-bottom: none;
}

.el-tabs__item {
  color: var(--light-text);
  font-size: 18px;
  font-weight: 500;
  padding: 15px 25px;
  transition: all 0.3s ease;
}

.el-tabs__item.is-active {
  color: var(--accent-color);
  position: relative;
  font-weight: 600;
}

.el-tabs__item.is-active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 3px;
  background: var(--accent-color);
  border-radius: 3px;
}

.el-tabs__item:hover {
  color: #4a5568;
}

.tab-content {
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-top: 20px;
}

h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--text-color);
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

h3::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--accent-color);
}

.plot-summary {
  line-height: 1.8;
  color: var(--light-text);
  font-size: 16px;
  text-align: left;
}

/* 预告片播放器样式 */
.trailer-player {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
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

  .movie-title {
    font-size: 32px;
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

  .movie-title {
    font-size: 28px;
  }

  .base-info, .rating-count, .box-office span {
    font-size: 14px;
  }

  .book-btn {
    font-size: 16px;
    padding: 10px 20px;
  }
}

@media (max-width: 576px) {
  .movie-content {
    padding: 20px 15px;
  }

  .info-section {
    padding: 20px;
  }

  .movie-title {
    font-size: 24px;
  }

  .score-number {
    font-size: 28px;
  }
}
.recommendations-section {
  margin-top: 40px;
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

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.movie-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.movie-thumbnail {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}

.movie-info {
  padding: 12px;
}

.movie-info .movie-title {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.movie-meta .genre {
  font-size: 13px;
  color: var(--light-text);
}

/* 响应式调整 */
@media (max-width: 992px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .movie-thumbnail {
    height: 220px;
  }
}

@media (max-width: 768px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }

  .movie-thumbnail {
    height: 180px;
  }

  .movie-info .movie-title {
    font-size: 14px;
  }
}

@media (max-width: 576px) {
  .movie-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recommendations-section {
    padding: 15px;
  }
}
@media (max-width: 768px) {
  .book-btn {
    font-size: 20px;
    padding: 14px 30px;
  }
}

@media (max-width: 576px) {
  .book-btn {
    font-size: 18px;
    padding: 12px 25px;
  }
}
</style>