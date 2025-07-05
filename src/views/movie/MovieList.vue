<template>
  <div class="app-container">
    <!-- 替换为TopNav组件 -->
    <TopNav />

    <!-- 主内容区 -->
    <el-main class="main-content">
      <!-- 页面标题和标签切换 -->
      <div class="page-title">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="正在热映" name="nowShowing"></el-tab-pane>
          <el-tab-pane label="即将上映" name="upComing"></el-tab-pane>
        </el-tabs>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-container">
        <!-- 类型筛选 -->
        <div class="filter-row">
          <span class="filter-label">类型:</span>
          <el-radio-group v-model="selectedType" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button v-for="type in movieTypes" :key="type.id" :label="type.name">{{ type.name }}</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 区域筛选 -->
        <div class="filter-row">
          <span class="filter-label">区域:</span>
          <el-radio-group v-model="selectedRegion" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button v-for="region in movieRegions" :key="region.id" :label="region.name">{{ region.name }}</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 年代筛选 -->
        <div class="filter-row">
          <span class="filter-label">年代:</span>
          <el-radio-group v-model="selectedYear" size="small">
            <el-radio-button v-for="year in movieYears" :key="year.id" :label="year.id">{{ year.name }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 排序选项 -->
      <div class="sort-container">
        <el-radio-group v-model="sortType" size="small">
          <el-radio-button label="hot">按热门排序</el-radio-button>
          <el-radio-button label="time">按时间排序</el-radio-button>
          <el-radio-button label="rating">按评分排序</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 电影列表 -->
      <div class="movie-list">
        <el-card class="movie-card" shadow="hover" v-for="movie in filteredMovies" :key="movie.id" @click="goToDetail(movie.id)">
          <template #header>
            <div class="movie-header">
              <el-image
                  :src="getUrl(movie.posterUrl)"
                  :alt="movie.title"
                  class="movie-poster"
                  fit="cover"
                  lazy
              >
                <template #placeholder>
                  <div class="image-placeholder">加载中...</div>
                </template>
              </el-image>
              <div class="movie-info">
                <h3 class="movie-title">{{ movie.title }}</h3>
                <p class="movie-duration">{{ movie.duration }}分钟</p>
                <div class="movie-tags">
                  <el-tag size="small" v-for="tag in movie.tags" :key="tag">{{ tag }}</el-tag>
                </div>
                <div class="movie-rating" v-if="movie.rating">
                  <el-rate v-model="movie.rating" disabled show-text text-color="#ff0000" size="small" />
                </div>
                <div class="movie-rating" v-else>
                  <span class="no-rating">暂无评分</span>
                </div>
              </div>
            </div>
          </template>
          <div class="movie-actions">
            <el-button type="danger" size="small"@click.stop="goToBooking(movie.id)">选座购票</el-button>
            <el-button type="text" size="small">查看详情</el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="Page.current"
            :page-sizes="[4,9, 12, 18]"
            :page-size="Page.size"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalMovies"
            :prev-text="'上一页'"
            :next-text="'下一页'"
        >
        </el-pagination>
      </div>
    </el-main>

    <!-- 页脚 -->
    <el-footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="#">关于我们</a>
          <a href="#">联系我们</a>
          <a href="#">隐私政策</a>
          <a href="#">用户协议</a>
        </div>
        <div class="footer-info">
          <p>© 2025 电影票务平台 版权所有</p>
          <p>客服电话：400-123-4567</p>
        </div>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue';
import TopNav from '../components/TopNav.vue';
import {getAllGenres, getAllMovies, getAllRegions} from "@/api/movie"
import router from "@/router";
import {useRoute} from "vue-router";
import {ElMessage} from "element-plus";
const activeTab = ref('nowShowing');
// 筛选条件
const selectedType = ref('all');
const selectedRegion = ref('all');
const selectedYear = ref('all');
const sortType = ref('hot');
const Page = ref({
  current:1,
  size:9,
})
// 分页控制
const totalMovies = ref(0);

// 电影数据
const nowShowingMovies = ref([]);
const upComingMovies = ref([]); // 即将上映电影
const currentMovies = computed(() => {
  return activeTab.value === 'nowShowing' ? nowShowingMovies.value : upComingMovies.value;
});
const getMovies = async () => {
  try {
    const status = activeTab.value === 'nowShowing' ? 'NOW_SHOWING' : 'UPCOMING';
    const res = await getAllMovies(status);

    console.log('API原始数据:', res); // 检查数据结构
    console.log('records是否存在:', res.data);

    const processed = processMovieData(res.data || []);
    console.log('处理后数据:', processed); // 检查处理后的数据

    if (activeTab.value === 'nowShowing') {
      nowShowingMovies.value = processed;
    } else {
      upComingMovies.value = processed;
    }

    totalMovies.value = processed.length;
  } catch (error) {
    console.error('获取电影失败:', error);
    ElMessage.error('加载电影列表失败');
  }
};

const processMovieData = (records) => {
  return records.map(movie => ({
    id: movie.id,
    title: movie.title,
    duration: movie.durationMinutes,
    posterUrl: movie.posterUrl,
    rating: movie.rating ? parseFloat(movie.rating) : null,
    tags: movie.genre ? movie.genre.split(',') : [],
    type: movie.genre ? movie.genre.split(',')[0] : 'unknown',
    region: movie.country,
    year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
  }));
};
// 模拟电影数据
const getUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`;
}
const handleTabChange = () => {
  Page.value.current = 1; // 切换标签时重置到第一页
  getMovies();
};
// 电影类型筛选选项
const movieTypes = ref([]); // 替换原来的静态数据
// 获取电影类型
const fetchGenreList = async () => {
  try {
    const response = await getAllGenres();
    movieTypes.value = response.data.map(genre => ({
      id: genre.id,
      name: genre.name
    }));
  } catch (error) {
    console.error('获取类型列表失败:', error);
    ElMessage.error('获取类型列表失败');
  }
};
// 电影区域筛选选项
const movieRegions=ref([])
// 获取区域列表
const fetchRegionList = async () => {
  try {
    const response = await getAllRegions();
    movieRegions.value = response.data;
  } catch (error) {
    console.error('获取区域列表失败:', error);
    ElMessage.error('获取区域列表失败');
  }
};
// 电影年代筛选选项
const movieYears = [
  { id: 'all', name: '全部' },
  { id: 2025, name: '2025' },
  { id: 2024, name: '2024' },
  { id: 2023, name: '2023' },
  { id: 'earlier', name: '更早' }
];

// 获取筛选后的电影列表
const filteredMovies = computed(() => {
  try {
    // 确保总是返回数组
    const sourceData = [...(currentMovies.value || [])];
    console.log('源数据:', sourceData); // 调试

    // 筛选逻辑
    let result = sourceData.filter(movie => {
      const typePass = selectedType.value === 'all' ||
          movie.tags?.includes(selectedType.value);
      const regionPass = selectedRegion.value === 'all' ||
          movie.region === selectedRegion.value;
      const yearPass = selectedYear.value === 'all' ||
          (selectedYear.value === 'earlier' ?
              movie.year < 2023 :
              movie.year === parseInt(selectedYear.value));

      return typePass && regionPass && yearPass;
    });
    console.log('筛选后数据:', result); // 调试

    // 排序
    switch(sortType.value) {
      case 'hot': result.sort((a,b) => (b.viewCount||0)-(a.viewCount||0)); break;
      case 'time': result.sort((a,b) => (b.year||0)-(a.year||0)); break;
      case 'rating': result.sort((a,b) => (b.rating||0)-(a.rating||0)); break;
    }

    // 分页
    totalMovies.value = result.length;
    const start = (Page.value.current - 1) * Page.value.size;
    const end = Math.min(start + Page.value.size, result.length);
    const pageData = result.slice(start, end);

    console.log('分页结果:', {start, end, pageData}); // 调试
    return pageData;
  } catch (error) {
    console.error('筛选出错:', error);
    return [];
  }
});


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
const handleSizeChange = (newSize) => {
  Page.value.size = newSize;
  Page.value.current = 1; // 改变每页大小时回到第一页
};

const handleCurrentChange = (newPage) => {
  Page.value.current = newPage;
};
watch([selectedType, selectedRegion, selectedYear, sortType], () => {
  Page.value.current = 1;
});

// 初始化数据
onMounted(() => {
  const route = useRoute();
  if (route.query.tab === 'upComing') {
    activeTab.value = 'upComing';
  }
  fetchRegionList();
  fetchGenreList(); // 获取电影类型
  getMovies();
});
</script>

<style scoped>
.app-container {
  min-height: 100vh; /* 使用min-height而不是height */
  display: flex;
  flex-direction: column;
}

.main-content {
  padding: 20px;
  background-color: #f5f5f5;
  flex: 1;
  /* 移除overflow设置，使用浏览器默认滚动 */
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  /* 确保内容不会导致内部滚动 */
  min-height: 0; /* 重要：防止flex容器无限扩展 */
}
.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}
.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-container {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column; /* 改为垂直排列 */
  gap: 15px; /* 行间距 */
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap; /* 允许选项换行 */
}

.filter-label {
  font-weight: bold;
  min-width: 60px;
}
.sort-container {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.movie-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  /* 移除任何可能限制高度的设置 */
}

.movie-card {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.movie-header {
  display: flex;
  gap: 15px;
}

.movie-poster {
  width: 100px;
  height: 150px;
  border-radius: 4px;
}

.image-placeholder {
  width: 100px;
  height: 150px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
}

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.movie-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.movie-duration {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.movie-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.movie-rating {
  margin-top: 5px;
}

.no-rating {
  color: #999;
  font-size: 14px;
}

.movie-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.footer {
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  text-align: center;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.footer-links a {
  color: white;
  text-decoration: none;
}

.footer-info {
  font-size: 14px;
  color: #ccc;
}

/* 修改蓝色为红色 */
:deep(.el-radio-button__orig-radio:checked+.el-radio-button__inner) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
  background-color: #f56c6c;
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
  color: #f56c6c;
}

:deep(.el-rate__icon) {
  color: #f56c6c;
}
</style>