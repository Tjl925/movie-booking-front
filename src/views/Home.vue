<template>
  <div class="home">
    <TopNav />
    <!-- 主内容区域 - 左右分栏布局 -->
    <div class="main-content">
      <!-- 左侧电影列表区域 -->
      <div class="left-section">
        <div class="section-header">
          <h2 class="section-title">正在热映</h2>
          <div class="more-movies">
            <a href="#" @click="handleAllMovies">查看全部 ></a>
          </div>
        </div>
        <div class="movie-list">
          <!-- 电影项循环 -->
          <div
              v-for="movie in movies"
              :key="movie.id"
              class="movie-item"
              @click="goToDetail(movie.id)"
          >
            <div class="movie-thumbnail">
              <img :src="getUrl(movie.posterUrl)" alt="电影海报" class="poster-image">
            </div>
            <div class="movie-info">
              <h3 class="movie-title">{{ movie.title }}</h3>
              <div class="movie-rating">{{ movie.rating }}</div>
              <button
                  class="buy-ticket-btn"
                  @click.stop="goToBooking(movie.id)"
              >
                购票
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧评分最高TOP10区域 -->
      <div class="right-section">
        <h2 class="section-title">评分最高</h2>
        <div class="top10-list">
          <div
              v-for="(movie, index) in top10Movies"
              :key="movie.id"
              class="top10-item"
              @mouseenter="hoverIndex = index"
              @mouseleave="hoverIndex = -1"
              :class="{
                'hover-effect': hoverIndex === index,
                'top3-item': index < 3,
                'hover-top3': hoverIndex === index && index < 3
              }"
              @click="goToDetail(movie.id)"
          >
            <div class="top10-rank" :class="{'top3-rank': index < 3}">
              {{ index + 1 }}
            </div>
            <div class="top10-info">
              <h3 class="top10-title">{{ movie.title }}</h3>
              <div class="top10-rating">{{ movie.rating }}分</div>
            </div>
            <!-- 前三名海报（悬停时显示） -->
            <div
                v-if="index < 3"
                class="poster-preview"
                :style="{backgroundImage: `url(${getUrl(movie.posterUrl)})`}"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import TopNav from './components/TopNav.vue';
import { useRouter } from "vue-router";
import {getShowingMoives} from "@/api/user"
import {onMounted, ref} from "vue";
import {getTop10Movies} from "@/api/user"

const movies = ref([])
const top10Movies = ref([])
const hoverIndex = ref(-1) // 新增悬停状态跟踪
const Page = ref({
  current:1,
  size:8,
})

const getMovies = async () => {
  getShowingMoives(Page.value.current,Page.value.size).then(res=>{
    movies.value=res.data.records;
  })
}

const gettop10Movies = async () => {
  getTop10Movies().then(res=>{
    top10Movies.value=res.data;
  })
}
const handleAllMovies=()=>{
  router.push('/MovieList');
}
const getUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`;
}

const router = useRouter();

const goToDetail = (movieId) => {
  router.push({
    path: `/movie/${movieId}`
  });
};

const goToBooking = (movieId) => {
  router.push({
    path: `/chooseSessions/${movieId}`
  });
};

onMounted(async () => {
  await getMovies();
  await gettop10Movies();
});
</script>

<style scoped>
.home {
  padding: 20px;
}

.main-content {
  display: flex;
  margin-top: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.left-section {
  flex: 3;
  margin-right: 30px;
}

.right-section {
  flex: 1;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.movie-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.movie-item {
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.movie-item:hover {
  transform: translateY(-5px);
}

.movie-thumbnail {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 0;
  padding-bottom: 140%;
}

.poster-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.movie-info {
  margin-top: 10px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.movie-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-rating {
  color: #ff9900;
  font-size: 12px;
  margin-bottom: 10px;
}

.buy-ticket-btn {
  background-color: #e64340;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s;
}

.buy-ticket-btn:hover {
  background-color: #cc3330;
}

.more-movies {
  text-align: right;
}

.more-movies a {
  color: #666;
  text-decoration: none;
}

.more-movies a:hover {
  color: #e64340;
}

.top10-list {
  list-style: none;
  padding: 0;
}

.top10-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  background: #fff;
  border: 1px solid #f0f0f0;
}

/* 第4-10名悬停效果 */
.top10-item.hover-effect:not(.top3-item) {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #e64340;
}

/* 前三名基础样式 */
.top3-item {
  position: relative;
  padding-right: 12px;
}

/* 前三名悬停效果 */
.top3-item.hover-top3 {
  padding-right: 100px;
  background: #fffaf8;
}

/* 海报预览 */
.poster-preview {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 0;
  height: 0;
  opacity: 0;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* 前三名悬停时显示海报 */
.top3-item.hover-top3 .poster-preview {
  width: 80px;
  height: 120px;
  opacity: 1;
}

/* 排名样式 */
.top10-rank {
  width: 24px;
  height: 24px;
  background: #e0e0e0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

/* 前三名排名特殊样式 */
.top3-rank {
  background: linear-gradient(135deg, #e64340, #ff6600);
  color: white;
  font-size: 16px;
  width: 28px;
  height: 28px;
}

.top10-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.top10-rating {
  color: #ff9900;
  font-size: 12px;
}
</style>