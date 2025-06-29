<template>
  <div class="movie-details-container">
    <!-- 顶部导航 -->
    <TopNav />
    <!-- 主要内容区域 -->
    <div class="movie-content">
      <!-- 电影基本信息区域 -->
      <el-row :gutter="30" class="info-section">
        <!-- 原有内容保持不变 -->
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
            <!-- 评分和票房区域 - 新增按钮位置 -->
            <div class="rating-box">
              <div class="rating-score">
                <el-rate v-model="movie.rating" disabled text-color="#ff9900" />
                <span class="score-number">{{ movie.rating }}分</span>
                <span class="rating-count">({{ movie.ratingCount }}人评分)</span>
              </div>
              <div class="box-office">
                <span>觀看人數：{{movie.viewCount}}人</span>
              </div>
              <!-- 特惠购票按钮移动至此 -->
              <div class="booking-button-container movie-booking-btn">
                <el-button type="primary" size="large" @click="goToBooking">特惠购票</el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      <!-- 标签页导航（移除原按钮） -->
      <el-tabs v-model="activeTab" class="tabs">
        <el-tab-pane label="介绍" name="intro">
          {{ movie.description }}
          <!-- 原按钮位置改为空容器或删除 -->
        </el-tab-pane>
        <el-tab-pane label="演职人员" name="cast"></el-tab-pane>
        <el-tab-pane label="奖项" name="awards"></el-tab-pane>
        <el-tab-pane label="图集" name="gallery"></el-tab-pane>
        <el-tab-pane label="预告片" name="trailers">
          <div>
            <video-player
                v-if="movie.trailerUrl"
                :src="getFullUrl(movie.trailerUrl)"
                type="video/mp4"
                :options="{
        autoplay: false,
        muted: true,
        controls: true,
        responsive: true,
        techOrder: ['html5']
    }"
                style="width: 800px; height: 450px"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElTabs, ElTabPane, ElRate, ElButton, ElCarousel, ElCarouselItem, ElIcon
} from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue' // 关键修复点
import dayjs from 'dayjs'
import TopNav from "@/views/components/TopNav.vue";
import {getMovieById} from "@/api/user"
import { VideoPlayer } from '@videojs-player/vue';
import 'video.js/dist/video-js.css';
// 接收路由参数
const route = useRoute();
const router = useRouter();
const movieId = route.params.id;

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
onMounted(async () => {
  await getMovieDetail();
})
// 标签页激活状态
const activeTab = ref('intro');

// 计算属性 - 处理演员列表
const getActorsList = computed(() => {
  return movie.value.actors.split(', ');
});

// 计算属性 - 处理图集
const getGalleryImages = computed(() => {
  return movie.value.galleryImages.map(img => `uploads/${img}`);
});

// 计算属性 - 处理预告片
const getTrailers = computed(() => {
  return movie.value.trailers;
});

// 生命周期钩子 - 组件挂载时加载数据
onMounted(() => {
  // 实际开发中这里应该通过API获取电影详情
  // loadMovieDetail(movieId);
});

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY年MM月DD日');
};

// 格式化时间（秒转分秒）
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
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
const playTrailer = (url) => {
  window.open(url, '_blank');
};
</script>

<style scoped>
.movie-details-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.movie-content {
  width: 1200px; /* 与 TopNav 的 nav-container 宽度一致 */
  margin: 0 auto; /* 水平居中 */
  padding: 20px 0; /* 上下留白 */
}
.rating-box {
  display: flex;
  flex-direction: column; /* 改为垂直布局 */
  justify-content: flex-start;
  align-items: flex-start; /* 左对齐 */
  margin-top: 20px;
  gap: 15px; /* 元素间距 */
}

.rating-score, .box-office {
  display: flex;
  align-items: center;
}

/* 按钮样式优化 */
.movie-booking-btn {
  margin-top: 15px; /* 与评分区域保持间距 */
  width: 100%; /* 占满父容器宽度 */
  text-align: right; /* 按钮右对齐 */
}

.movie-booking-btn .el-button {
  width: 180px; /* 调整按钮宽度 */
  height: 45px;
  font-size: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .movie-booking-btn .el-button {
    width: 100%; /* 移动端全宽 */
  }
}
.info-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  flex: 3; /* 增大左侧区域宽度 */
  margin-right: 30px;
  /* 左侧与logo左边界对齐 */
  position: relative;
  left: 0;
  flex: 1; /* 缩小右侧区域宽度 */
  /* 右侧与头像右边界对齐 */
  position: relative;
  right: 0;
}

.poster-container {
  position: relative;
  text-align: center;
  width: 100%; /* 确保宽度填满容器 */
  height: 0; /* 高度设置为0，通过padding-bottom控制比例 */
  padding-bottom: 140%; /* 设置宽高比为 1:1.4 (常见电影海报比例) */
  overflow: hidden; /* 隐藏超出部分 */
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.movie-poster {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 关键属性：保持比例填充整个容器 */
  border-radius: 8px;
}

.movie-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}
.booking-button-container {
  margin-top: 30px;
  text-align: center;
  padding: 20px 0;
}

/* 调整按钮样式 */
.booking-button-container .el-button {
  width: 200px;
  height: 50px;
  font-size: 18px;
}
.movie-tags {
  margin-bottom: 15px;
}

.base-info {
  color: #666;
  line-height: 2;
  margin-bottom: 20px;
}

.rating-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.rating-score {
  display: flex;
  align-items: center;
}

.score-number {
  font-size: 24px;
  font-weight: bold;
  color: #ff9900;
  margin: 0 10px;
}

.rating-count, .box-office span {
  color: #999;
}

.tabs {
  margin-bottom: 20px;
}

.tab-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.plot-summary {
  line-height: 1.8;
  color: #333;
  text-align: justify;
}

.crew-item, .cast-item {
  display: inline-block;
  margin-right: 15px;
  margin-bottom: 10px;
  padding: 5px 12px;
  background-color: #f0f9ff;
  border-radius: 4px;
  color: #3498db;
}

.cast-list {
  display: flex;
  flex-wrap: wrap;
}

.awards-content {
  line-height: 1.8;
}

.no-data {
  color: #999;
  padding: 20px 0;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.trailer-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.trailer-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.trailer-item:hover {
  transform: translateY(-5px);
}

.trailer-cover {
  position: relative;
  height: 150px;
}

.trailer-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.trailer-info {
  padding: 10px;
}

.trailer-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trailer-meta {
  font-size: 12px;
  color: #999;
}
</style>