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
            <a href="#" @click.prevent>查看全部 ></a>
          </div>
        </div>
        <div class="movie-list">
          <!-- 电影项循环 - 模拟数据 -->
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
          <!-- TOP10电影循环 - 模拟数据 -->
          <div
              v-for="(movie, index) in top10Movies"
              :key="movie.id"
              class="top10-item"
              @click="goToDetail(movie.id)"
          >
            <div class="top10-rank">{{ index + 1 }}</div>
            <div class="top10-info">
              <h3 class="top10-title">{{ movie.title }}</h3>
              <div class="top10-rating">{{ movie.rating }}</div>
            </div>
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
// 模拟电影数据
const movies = ref([])
const top10Movies = ref([])
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
const gettop10Movies =async  ()=>{
  getTop10Movies().then(res=>{
    top10Movies.value=res.data;
  })
}
const getUrl =(url)=>{
  return `http://127.0.0.1:8888/uploads${url}`;
}

const router = useRouter();

// 跳转到电影详情页
const goToDetail = (movieId) => {
  // 修复原代码中的错误路径和括号
  router.push({
    path: `/movie/${movieId}`  // 确保路由路径匹配你的路由配置
  });
};

// 跳转到购票界面
const goToBooking = (movieId) => {
  router.push({
    path: `/chooseSessions/${movieId}`  // 确保路由路径匹配你的路由配置
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
  /* 确保左侧与logo对齐，右侧与头像对齐 */
  position: relative;
  /* 假设logo左边界位置为50px，头像右边界为1200px */
  max-width: 1200px;
  margin: 0 auto;
}

.left-section {
  flex: 3; /* 增大左侧区域宽度 */
  margin-right: 30px;
  /* 左侧与logo左边界对齐 */
  position: relative;
  left: 0;
}

.right-section {
  flex: 1; /* 缩小右侧区域宽度 */
  /* 右侧与头像右边界对齐 */
  position: relative;
  right: 0;
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
  grid-template-columns: repeat(4, 1fr); /* 每行显示四个缩略图 */
  gap: 20px;
}

.movie-item {
  cursor: pointer;
  transition: transform 0.3s;
}

.movie-item:hover {
  transform: translateY(-5px);
}

.movie-thumbnail {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.poster-image {
  width: 100%;
  height: auto;
  display: block;
}

.movie-info {
  margin-top: 10px;
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
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.top10-item:last-child {
  border-bottom: none;
}

.top10-item:hover {
  background-color: #f5f5f5;
}

.top10-rank {
  width: 24px;
  height: 24px;
  background-color: #e64340;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}

.top10-info {
  flex: 1;
  cursor: pointer;
}

.top10-title {
  font-size: 14px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top10-rating {
  color: #ff9900;
  font-size: 12px;
}
</style>