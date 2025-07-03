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
              v-for="movie in movies.slice(0,8)"
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
        <div class="section-header">
          <h2 class="section-title">即将上映</h2>
          <div class="more-movies">
            <a href="#" @click="handleUpcomingMovies">查看全部 ></a>
          </div>
        </div>
        <div class="movie-list">
          <div
              v-for="movie in upComingMovies.slice(0,8)"
              :key="movie.id"
              class="movie-item"
              @click="goToDetail(movie.id)"
          >
            <div class="movie-thumbnail">
              <img :src="getUrl(movie.posterUrl)" alt="电影海报" class="poster-image">
            </div>
            <div class="movie-info">
              <h3 class="movie-title">{{ movie.title }}</h3>
              <div class="movie-rating no-rating">暂无评分</div>
              <button
                  class="buy-ticket-btn-booking"

              >
                预购
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- 右侧评分最高TOP5区域 -->
      <div class="right-section">

        <div v-if="isLoggedIn.valueOf()" class="top-list-container">
          <h2 class="section-title">猜你喜欢</h2>
          <div class="top5-list">
            <div
                v-for="(movie, index) in mayLikeMovies"
                :key="movie.id"
                class="top5-item"
                @mouseenter="hoverIndex = index"
                @mouseleave="hoverIndex = -1"
                :class="{
          'hover-effect': hoverIndex === index,
          'top3-item': index < 3,
          'hover-top3': hoverIndex === index && index < 3
        }"
                @click="goToDetail(movie.id)"
            >
              <div class="top5-rank" :class="{'top3-rank': index < 3}">
                {{ index + 1 }}
              </div>
              <div class="top5-info">
                <h3 class="top5-title">{{ movie.title }}</h3>
                <div class="top5-rating">{{ movie.rating }}分</div>
              </div>
              <div
                  v-if="index < 3"
                  class="poster-preview"
                  :style="{backgroundImage: `url(${getUrl(movie.posterUrl)})`}"
              ></div>
            </div>
          </div>
        </div>


        <!-- 评分最高TOP5 -->
        <div v-if="!isLoggedIn.valueOf()" class="top-list-container">
          <h2 class="section-title">评分最高</h2>
          <div class="top5-list">
            <div
                v-for="(movie, index) in top5Movies.slice(0, 5)"
                :key="movie.id"
                class="top5-item"
                @mouseenter="hoverIndex = index"
                @mouseleave="hoverIndex = -1"
                :class="{
          'hover-effect': hoverIndex === index,
          'top3-item': index < 3,
          'hover-top3': hoverIndex === index && index < 3
        }"
                @click="goToDetail(movie.id)"
            >
              <div class="top5-rank" :class="{'top3-rank': index < 3}">
                {{ index + 1 }}
              </div>
              <div class="top5-info">
                <h3 class="top5-title">{{ movie.title }}</h3>
                <div class="top5-rating">{{ movie.rating }}分</div>
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

        <!-- 票房最高TOP5 -->
        <div class="top-list-container">
          <h2 class="section-title">当前票房</h2>
          <div class="top5-list">
            <div
                v-for="(movie, index) in bestBoxOfficeMovies.slice(0, 5)"
                :key="movie.id"
                class="top5-item"
                @mouseenter="boxOfficeHoverIndex = index"
                @mouseleave="boxOfficeHoverIndex = -1"
                :class="{
          'hover-effect': boxOfficeHoverIndex === index,
          'top3-item': index < 3,
          'hover-top3': boxOfficeHoverIndex === index && index < 3
        }"
                @click="goToDetail(movie.id)"
            >
              <div class="top5-rank" :class="{'top3-rank': index < 3}">
                {{ index + 1 }}
              </div>
              <div class="top5-info">
                <h3 class="top5-title">{{ movie.title }}</h3>
                <div class="top5-box-office">{{ formatBoxOffice(movie.boxOffice) }}</div>
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
  </div>
</template>

<script setup>
import TopNav from './components/TopNav.vue';
import { useRouter } from "vue-router";
import {getShowingMoives, getUpcomingMovies} from "@/api/user"
import {computed, onMounted, ref} from "vue";
import {getTop5Movies} from "@/api/user"
import {getBestBoxOfficeMovies, getMovieRecommendation} from "@/api/movie";
import {useUserInfoStore} from "@/stores/userInfo";
const movies = ref([])
const top5Movies = ref([])
const mayLikeMovies = ref([])
const bestBoxOfficeMovies = ref([])
const upComingMovies = ref([]); // 即将上映电影
const hoverIndex = ref(-1)// 新增悬停状态跟踪
const boxOfficeHoverIndex = ref(-1) // 票房列表悬停状态跟踪
const userInfoStore = useUserInfoStore();
const Page = ref({
  current:1,
  size:8,
})
const isLoggedIn = ref(computed(() => !(!userInfoStore || !userInfoStore.userInfo.token)));
const getMovies = async () => {
  getShowingMoives(Page.value.current,Page.value.size).then(res=>{
    movies.value=res.data.records;
  })
}

const gettop5Movies = async () => {
  getTop5Movies().then(res=>{
    top5Movies.value=res.data;
  })
}
const getMayLike = async () => {
  const userInfoStore = useUserInfoStore();
  getMovieRecommendation(userInfoStore.userInfo.id).then(res=>{
    mayLikeMovies.value=res.data;
  })
}
const getBestBoxOfficeMoviesList = async () => {
  getBestBoxOfficeMovies().then(res=>{
    bestBoxOfficeMovies.value=res.data;
  })
}
const getUpComingMovies = async () => {
    getUpcomingMovies(Page.value.current, Page.value.size).then(res => {
      upComingMovies.value = res.data.records;
    });
};
const handleAllMovies=()=>{
  router.push('/MovieList');
}
const handleUpcomingMovies = () => {
  router.push({
    path: '/MovieList',
    query: { tab: 'upComing' }
  });
};
const getUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`;
}

const router = useRouter();

const goToDetail = (movieId) => {
  router.push({
    path: `/movie-info/${movieId}`
  });
};

const goToBooking = (movieId) => {
  router.push({
    path: `/chooseSessions/${movieId}`
  });
};
const formatBoxOffice = (amount) => {
  if (!amount) return '0'

  const inWan = amount / 10000

  if (inWan >= 10000) {
    const yi = Math.floor(inWan / 10000)
    const remainingWan = Math.floor(inWan % 10000)
    return `${yi}.${Math.floor(remainingWan/1000)}亿`

  } else if (inWan >= 1) {
    return `${inWan.toFixed(1)}万`
  } else {
    return amount.toString()
  }
}
onMounted(async () => {
  await getMovies();
  await getBestBoxOfficeMoviesList();
  await getUpComingMovies();
  console.log(isLoggedIn.value)
  console.log(userInfoStore)
  await getMayLike();
  await gettop5Movies();
});
</script>

<style scoped>
.home {
  padding: 5px;
}

.main-content {
  display: flex;
  margin-top: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.left-section {
  flex: 3;
  margin-right: 50px;
}

.right-section {
  flex: 1;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 25px;
  font-weight: bold;
  margin-top: 50px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
  position: relative;
  color: #EF4238;
}
.section-title::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 40px;
  height: 2px;
  background: #e64340;
}
.top5-list {
  list-style: none;
  padding: 0;
}

.top5-item {
  display: flex;
  align-items: center;
  padding: 30px;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  background: #fff;
  border: 1px solid #f0f0f0;
  position: relative;
}

/* 第4-5名悬停效果 */
.top5-item.hover-effect:not(.top3-item) {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #e64340;
}

/* 前三名基础样式 */
.top5-item.top3-item {
  padding-right: 12px;
}

/* 前三名悬停效果 */
.top5-item.hover-top3 {
  padding-right: 100px;
  background: #fffaf8;
}

/* 排名样式 */
.top5-rank {
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
  flex-shrink: 0;
}

/* 前三名排名特殊样式 */
.top5-rank.top3-rank {
  background: linear-gradient(135deg, #e64340, #ff6600);
  color: white;
  font-size: 16px;
  width: 28px;
  height: 28px;
}

/* 评分第一名特殊样式 */
.top5-rank:first-child {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.top5-info {
  flex-grow: 1;
  min-width: 0;
}

.top5-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top5-rating {
  color: #ff9900;
  font-size: 12px;
}

.top5-box-office {
  color: #e64340;
  font-size: 12px;
  font-weight: bold;
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
.top5-item.hover-top3 .poster-preview {
  width: 80px;
  height: 120px;
  opacity: 1;
}

/* 两个列表之间的分隔线 */
.top-list-container:first-child {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
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
.buy-ticket-btn-booking {
  background-color: red;
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
.top-list-container {
  flex: 1;
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
.no-rating {
  color: #999;
}

.buy-ticket-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.buy-ticket-btn.disabled:hover {
  background-color: #ccc;
}
</style>