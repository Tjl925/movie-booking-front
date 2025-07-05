<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import MovieForm from '@/views/components/MovieForm.vue';
import SessionForm from '@/views/components/SessionForm.vue';
import { getMovieList, deleteMovie, updateMovieStatus } from '@/api/movie';

// 电影管理相关数据和方法
const movieSearchKeyword = ref('');
const movieCurrentPage = ref(1);
const moviePageSize = ref(10);
const movieTotal = ref(0);
const movieList = ref([]);
const movieFormVisible = ref(false);
const currentMovie = ref({});
const isEditMovie = ref(false);
const statusFilter = ref(''); // 电影状态筛选

// 场次管理相关数据
const sessionFormVisible = ref(false);
const currentSession = ref({});
const isEditSession = ref(false);

// 电影状态选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'UPCOMING', label: '即将上映' },
  { value: 'NOW_SHOWING', label: '上映中' },
  { value: 'ENDED', label: '已下架' }
];
const getFullUrl = (url) => {
  return `http://127.0.0.1:8888/uploads${url}`;
};
// 获取电影列表
const fetchMovieList = async () => {
  try {
    const params = {
      current: movieCurrentPage.value,
      size: moviePageSize.value,
      title: movieSearchKeyword.value || undefined,
      status: statusFilter.value || undefined
    };
    const response = await getMovieList(params);
    movieList.value = response.data.records || [];
    movieTotal.value = response.data.total || 0;
  } catch (error) {
    console.error('获取电影列表失败:', error);
    ElMessage.error('获取电影列表失败');
  }
};

const handleMovieSearch = () => {
  movieCurrentPage.value = 1;
  fetchMovieList();
};

// 处理状态筛选变化
const handleStatusChange = () => {
  movieCurrentPage.value = 1;
  fetchMovieList();
};

const handleMovieSizeChange = (size) => {
  moviePageSize.value = size;
  fetchMovieList();
};

const handleMovieCurrentChange = (page) => {
  movieCurrentPage.value = page;
  fetchMovieList();
};

const handleAddMovie = () => {
  isEditMovie.value = false;
  currentMovie.value = {};
  movieFormVisible.value = true;
};

const handleEditMovie = (row) => {
  isEditMovie.value = true;
  currentMovie.value = { ...row };
  movieFormVisible.value = true;
};

const handleDeleteMovie = (row) => {
  // 如果电影已经是下架状态，不允许再次下架
  if (row.status === 'ENDED') {
    ElMessage.warning('该电影已下架');
    return;
  }
  
  ElMessageBox.confirm(
      `确定要下架电影 "${row.title}" 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  )
      .then(async () => {
        try {
          await deleteMovie(row.id);
          ElMessage.success('下架成功');
          fetchMovieList();
        } catch (error) {
          console.error('下架失败:', error);
          ElMessage.error('下架失败');
        }
      })
      .catch(() => {
        // 取消删除
      });
};

// 处理电影上映
const handleReleaseMovie = (row) => {
  // 如果电影已经是上架状态，不允许再次上架
  if (row.status === 'UPCOMING') {
    ElMessage.warning('该电影已上架');
    return;
  }
  
  ElMessageBox.confirm(
      `确定要将电影 "${row.title}" 设置为上架吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
  )
      .then(async () => {
        try {
          await updateMovieStatus(row.id, 'UPCOMING');
          ElMessage.success('电影已设置为上架');
          fetchMovieList();
        } catch (error) {
          console.error('设置上架状态失败:', error);
          ElMessage.error('设置上架状态失败');
        }
      })
      .catch(() => {
        // 取消操作
      });
};

// 处理场次分配
const handleAssignSession = (row) => {
  currentMovie.value = { ...row };
  isEditSession.value = false;
  currentSession.value = {};
  sessionFormVisible.value = true;
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'NOW_SHOWING':
      return 'success';
    case 'UPCOMING':
      return 'info';
    case 'ENDED':
      return 'danger';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'NOW_SHOWING':
      return '上映中';
    case 'UPCOMING':
      return '即将上映';
    case 'ENDED':
      return '已下架';
  }
};

// 页面加载时获取电影列表
onMounted(() => {
  fetchMovieList();
});
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <div class="head-container">
          <span>电影管理</span>
          <div class="button-container">
            <el-button type="primary" :icon="Plus" @click="handleAddMovie">上架电影</el-button>
          </div>
        </div>
        <div class="search-box">
          <div class="search-item">
            <el-input
              v-model="movieSearchKeyword"
              placeholder="请输入电影名称搜索"
              clearable
              @keyup.enter="handleMovieSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleMovieSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
          <div class="search-item">
            <el-select
              v-model="statusFilter"
              placeholder="电影状态"
              clearable
              @change="handleStatusChange"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>
      </div>
    </template>
    <el-table :data="movieList" height="480" border style="width: 100%">
      <el-table-column type="expand">
        <template #default="props">
          <el-descriptions border :column="4" size="small">
            <el-descriptions-item
              :rowspan="3"
              :width="70"
              label="电影海报"
              align="center"
            >
              <el-image
                v-if="props.row.posterUrl"
                style="width: 50px; height: 70px"
                :src="getFullUrl(props.row.posterUrl)"
              />
              <span v-else>暂无海报</span>
            </el-descriptions-item>
            <el-descriptions-item label="电影ID" align="center">{{ props.row.id }}</el-descriptions-item>
            <el-descriptions-item label="电影名称" align="center">{{ props.row.title }}</el-descriptions-item>
            <el-descriptions-item label="导演" align="center">{{ props.row.director }}</el-descriptions-item>
            <el-descriptions-item label="状态" align="center">
              <el-tag :type="getStatusType(props.row.status)">
                {{ getStatusText(props.row.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="主演" align="center">{{ props.row.actors }}</el-descriptions-item>
            <el-descriptions-item label="类型" align="center">{{ props.row.genre }}</el-descriptions-item>
            <el-descriptions-item label="语言" align="center">{{ props.row.language }}</el-descriptions-item>
            <el-descriptions-item label="国家/地区" align="center">{{ props.row.country }}</el-descriptions-item>
            <el-descriptions-item label="时长(分钟)" align="center">{{ props.row.durationMinutes }}</el-descriptions-item>
            <el-descriptions-item label="评分" align="center">{{ props.row.rating }}</el-descriptions-item>
            <el-descriptions-item label="基础票价" align="center">{{ props.row.basePrice }}</el-descriptions-item>
            <el-descriptions-item label="上映日期" align="center">{{ props.row.releaseDate }}</el-descriptions-item>
            <el-descriptions-item label="下映日期" align="center">{{ props.row.endDate }}</el-descriptions-item>
            <el-descriptions-item label="评分人数" align="center">{{ props.row.ratingCount }}</el-descriptions-item>
            <el-descriptions-item label="观看次数" align="center">{{ props.row.viewCount }}</el-descriptions-item>
            <el-descriptions-item label="预告片" align="center">
              <el-link 
                v-if="props.row.trailerUrl" 
                type="primary" 
                :href="getFullUrl(props.row.trailerUrl)"
                target="_blank"
              >
                观看预告片
              </el-link>
              <span v-else>暂无预告片</span>
            </el-descriptions-item>
            <el-descriptions-item label="描述" align="center">
              {{ props.row.description || '暂无描述' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="电影名称" />
      <el-table-column prop="durationMinutes" label="时长(分钟)" width="100" />
      <el-table-column prop="releaseDate" label="上映日期" width="150" />
      <el-table-column prop="endDate" label="下映日期" width="150" />
      <el-table-column prop="genre" label="类型" width="150"/>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="海报" width="140">
        <template #default="scope">
          <el-image
            style="width: 100px; height: 120px"
            :src="getFullUrl(scope.row.posterUrl)"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <div class="operation-buttons">
            <div class="button-row">
              <el-button size="small" @click="handleEditMovie(scope.row)">编辑</el-button>
              <el-button 
                size="small" 
                type="warning" 
                @click="handleAssignSession(scope.row)"
                :disabled="scope.row.status === 'ENDED'"
              >分配</el-button>
            </div>
            <div class="button-row">
              <el-button 
                size="small" 
                type="success" 
                @click="handleReleaseMovie(scope.row)"
                :disabled="scope.row.status !== 'ENDED'"
              >上架</el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDeleteMovie(scope.row)"
                :disabled="scope.row.status === 'ENDED'"
              >下架</el-button>
            </div>

          </div>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="movieCurrentPage"
        v-model:page-size="moviePageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="movieTotal"
        @size-change="handleMovieSizeChange"
        @current-change="handleMovieCurrentChange"
        :prev-text="'上一页'"
        :next-text="'下一页'"
      />
    </div>

    <!-- 电影表单组件 -->
    <movie-form
      v-model:visible="movieFormVisible"
      :movie-data="currentMovie"
      :is-edit="isEditMovie"
      @refresh="fetchMovieList"
    />
    
    <!-- 场次表单组件 -->
    <session-form
      v-model:visible="sessionFormVisible"
      :movie-data="currentMovie"
      :session-data="currentSession"
      :is-edit="isEditSession"
      @refresh="fetchMovieList"
    />
  </el-card>
</template>

<style scoped>
.page-container {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header span {
  font-size: 18px;
  font-weight: bold;
}

.head-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-item:first-child {
  width: 350px;
}

.search-item:last-child {
  width: 150px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.button-row {
  display: flex;
  gap: 5px;
}

.session-list-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
}

.session-table table {
  width: 100%;
  border-collapse: collapse;
}

.session-table th,
.session-table td {
  border: 1px solid #ebeef5;
  padding: 8px 12px;
  text-align: center;
}

.session-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
}

.session-table tr:hover td {
  background-color: #f5f7fa;
}
</style>