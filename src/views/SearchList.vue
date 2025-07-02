<template>
  <div class="search-list">
    <TopNav />

    <div class="search-container">
      <h2>搜索结果: "{{ route.query.key }}"</h2>

      <div v-if="loading" class="loading">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else>
        <div v-if="movies.length === 0" class="no-result">
          没有找到相关电影
        </div>

        <div v-else class="movie-grid">
          <div
              v-for="movie in movies"
              :key="movie.id"
              class="movie-card"
              @click="goToDetail(movie.id)"
          >
            <img :src="getFullUrl(movie.posterUrl)" class="poster">
            <div class="info">
              <h3>{{ movie.title }}</h3>
              <div class="meta">
                <span>{{ movie.rating }}分</span>
                <span>{{ movie.durationMinutes
                  }}分钟</span>
              </div>
            </div>
          </div>
        </div>

        <el-pagination
            v-if="total > size"
            :current-page="current"
            :page-size="size"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {getSearchList} from '@/api/user';
import TopNav from '@/views/components/TopNav.vue';

const route = useRoute();
const router = useRouter();
const searchKeyword = ref(route.query.key || '');
const movies = ref([]);
const loading = ref(false);
const current = ref(1);
const size = ref(10);
const total = ref(0);

const fetchSearchResults = async () => {
  getSearchList({
    current: current.value,
    size: size.value,
    keyword: searchKeyword.value
  }).then(res=>{
    console.log(res)
    if(res.status ){
      movies.value=res.data.records
    }
  })
};
const getFullUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`;
};
// 初始化加载和监听参数变化
watch(
    () => route.query.key,
    (newVal) => {
      searchKeyword.value = newVal || '';
      current.value = 1;
      fetchSearchResults();
    },
    { immediate: true }
);

const handlePageChange = (page) => {
  current.value = page;
  fetchSearchResults();
};
const goToDetail = (movieId) => {
  router.push({
    path: `/movie-info/${movieId}`
  });
};
</script>

<style scoped>
.search-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.movie-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.movie-card:hover {
  transform: translateY(-5px);
}

.poster {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.info {
  padding: 10px 0;
}

.meta {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 14px;
}

.no-result {
  text-align: center;
  padding: 50px;
  color: #999;
}

.loading {
  padding: 20px;
}
</style>