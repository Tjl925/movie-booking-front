<template>
  <div class="movie-details">
    <!-- 顶部导航 -->
    <TopNav />

    <!-- 电影基本信息区域 -->
    <el-row :gutter="30" class="info-section">
      <el-col :span="8">
        <div class="poster-container">
          <img :src="getFullUrl(movie.posterUrl)" alt="电影海报" class="movie-poster">
          <el-button type="primary" @click="goToBooking">特惠购票</el-button>
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

    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" class="tabs">
      <el-tab-pane label="介绍" name="intro">
        {{ movie.description }}
      </el-tab-pane>
      <el-tab-pane label="演职人员" name="cast"></el-tab-pane>
      <el-tab-pane label="奖项" name="awards"></el-tab-pane>
      <el-tab-pane label="图集" name="gallery"></el-tab-pane>
      <el-tab-pane label="预告片" name="trailers">

      </el-tab-pane>
    </el-tabs>
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
.movie-details {
  padding: 20px;
  background-color: #f5f5f5;
}

.info-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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
  margin-bottom: 15px;
}

.el-button {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.movie-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
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