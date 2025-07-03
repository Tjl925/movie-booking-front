<script setup>
import {ref, onMounted, computed} from 'vue';
import {ElLoading, ElMessage, ElMessageBox} from 'element-plus';
import {Search, Delete, Edit, Grid} from '@element-plus/icons-vue';
import {getSessionList, deleteSession, getSeatsForSelection} from '@/api/session';
import SessionForm from '@/views/components/SessionForm.vue';
import dayjs from 'dayjs';

// 场次列表数据
const sessionList = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 搜索关键字
const searchKeyword = ref('');

// 场次表单相关
const sessionFormVisible = ref(false);
const currentSession = ref({});
const currentMovie = ref({});
const isEditSession = ref(false);

const getUrl =(url)=>{
  return `http://127.0.0.1:8888/uploads${url}`;
}

// 获取场次列表
const fetchSessionList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value || undefined
    };
    
    const { data } = await getSessionList(params);
    sessionList.value = data.records || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error('获取场次列表失败:', error);
    ElMessage.error('获取场次列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchSessionList();
};

// 处理分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchSessionList();
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchSessionList();
};

// 编辑场次
const handleEditSession = (row) => {
  console.log(row);
  currentSession.value = { ...row };
  currentMovie.value = row.movie || {};
  isEditSession.value = true;
  sessionFormVisible.value = true;
};

// 删除场次
const handleDeleteSession = (row) => {
  ElMessageBox.confirm(
    `确定要删除电影 "${row.movie?.title || '未知电影'}" 在 ${row.hall?.hallName || '未知影厅'} 的场次吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await deleteSession(row.id);
        ElMessage.success('删除成功');
        fetchSessionList();
      } catch (error) {
        console.error('删除失败:', error);
        ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message || '未知错误'));
      }
    })
    .catch(() => {
      // 取消删除
    });
};
const frontSeatsInfo = ref([]); // 用于界面展示的座位状态
const backSeatsInfo = ref([]);
const seatDialogVisible=ref(false);
const seatRows = ref([])
const handleOpenSessionSeats = async (row) => {
  let loading = null;
  try {
    loading = ElLoading.service({
      lock: true,
      text: '正在加载座位图...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    // 记录当前影厅名
    currentHallName.value = row.hall?.hallName || '';

    const response = await getSeatsForSelection(row.id);
    console.log('座位数据:', response);

    if (response.data) {
      const rows = response.data.totalRows || 8;
      const cols = response.data.totalColumns || 10;
      // 初始化座位图
      const initSeatMap = () => Array(rows).fill().map((_, rowIndex) =>
          Array(cols).fill().map((_, colIndex) => ({
            status: 'AVAILABLE',
            seatRow: rowIndex + 1,
            seatColumn: colIndex + 1,
            id: null,
            seatNumber: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`
          }))
      );

      frontSeatsInfo.value = initSeatMap();
      backSeatsInfo.value = initSeatMap();

      if (response.data.seatSessions) {
        response.data.seatSessions.forEach(seatSession => {
          const rowIdx = Number(seatSession.rowNumber) - 1;
          const colIdx = Number(seatSession.columnNumber) - 1;

          if (rowIdx >= 0 && rowIdx < rows && colIdx >= 0 && colIdx < cols) {
            const seatData = {
              ...seatSession,
              seatRow: seatSession.rowNumber,
              seatColumn: seatSession.columnNumber,
              seatNumber: `${String.fromCharCode(65 + rowIdx)}${colIdx + 1}`,
              status: seatSession.status || 'AVAILABLE'
            };

            frontSeatsInfo.value[rowIdx][colIdx] = { ...seatData };
            backSeatsInfo.value[rowIdx][colIdx] = { ...seatData };
          }
        });
      }
      // 更新显示数据
      seatRows.value = frontSeatsInfo.value;
      seatDialogVisible.value = true;
    }
  } catch (error) {
    console.error('加载座位失败:', error);
    ElMessage.error('加载座位失败: ' + (error.message || '未知错误'));
  } finally {
    loading?.close();
  }
}

// 根据影厅名动态设置座位图弹窗宽度
const currentHallName = ref('');
const getDialogWidth = computed(() => {
  switch (currentHallName.value) {
    case 'IMAX厅':
      return '1200px';
    case '2号厅':
      return '900px';
    case '杜比厅':
      return '1100px';
    default:
      return '800px';
  }
});

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm');
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

// 获取影厅类型文本
const getHallTypeText = (type) => {
  const typeMap = {
    'REGULAR': '普通厅',
    'VIP': 'VIP厅',
    'IMAX': 'IMAX厅',
    'DOLBY': '杜比厅'
  };
  return typeMap[type] || type;
};

// 页面加载时获取场次列表
onMounted(() => {
  fetchSessionList();
});
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>场次管理</span>
        <div class="search-box">
          <div class="search-item">
            <el-input
              v-model="searchKeyword"
              placeholder="请输入电影名/影厅名/状态搜索"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </template>
    
    <el-table 
      :data="sessionList" 
      border 
      style="width: 100%" 
      v-loading="loading"
      height="480"
    >
      <el-table-column label="电影" min-width="180">
        <template #default="scope">
          <div class="movie-info">
            <el-image 
              v-if="scope.row.movie?.posterUrl" 
              :src="getUrl(scope.row.movie.posterUrl)"
              style="width: 50px; height: 70px; margin-right: 10px;"
              fit="cover"
            />
            <div class="movie-details">
              <div class="movie-title">{{ scope.row.movie?.title || '未知电影' }}</div>
              <div class="movie-meta">
                <el-tag size="small" :type="getStatusType(scope.row.movie?.status)">
                  {{ getStatusText(scope.row.movie?.status) }}
                </el-tag>
                <span class="duration">{{ scope.row.movie?.durationMinutes || 0 }}分钟</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="影厅" width="150">
        <template #default="scope">
          <div>
            <div>{{ scope.row.hall?.hallName || '未知影厅' }}</div>
            <div class="hall-type">{{ getHallTypeText(scope.row.hall?.hallType) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.sessionTime) }}
        </template>
      </el-table-column>
      <el-table-column label="结束时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button 
              size="small" 
              type="primary" 
              :icon="Edit"
              @click="handleEditSession(scope.row)"
              :disabled="scope.row.sessionTime && new Date(scope.row.sessionTime) < new Date()"
            >编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              :icon="Delete"
              @click="handleDeleteSession(scope.row)"
            >删除</el-button>
            <el-button
                size="small"
                type="warning"
                :icon="Grid"
                @click="handleOpenSessionSeats(scope.row)"
            >查看</el-button>

          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 场次表单组件 -->
    <session-form
      v-model:visible="sessionFormVisible"
      :movie-data="currentMovie"
      :session-data="currentSession"
      :is-edit="isEditSession"
      @refresh="fetchSessionList"
    />
  </el-card>
  <el-dialog
      title="影厅座位图"
      v-model="seatDialogVisible"
      :width="getDialogWidth"
      top="5vh"
  >
    <div class="seat-map-container">
      <div class="screen">银幕</div>

      <div class="seat-grid">
        <div
            v-for="(row, rowIndex) in seatRows"
            :key="rowIndex"
            class="seat-row"
        >
          <div
              v-for="(seat, colIndex) in row"
              :key="colIndex"
              class="seat"
              :class="{
              'available': seat.status === 'AVAILABLE',
              'reserved': seat.status === 'RESERVED',
              'occupied': seat.status === 'OCCUPIED',
              'maintenance': seat.status === 'MAINTENANCE'
            }"
          >
            {{ seat.seatNumber }}
          </div>
        </div>
      </div>

      <div class="seat-legend">
        <div class="legend-item" v-for="item in [
          { type: 'available', text: '可选座位' },
          { type: 'reserved', text: '已预定' },
          { type: 'occupied', text: '已售出' },
          { type: 'maintenance', text: '维修中' }
        ]" :key="item.type">
          <div :class="['legend-marker', item.type]"></div>
          <span class="legend-text">{{ item.text }}</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header span {
  font-size: 18px;
  font-weight: bold;
}

.seat-map-container {
  text-align: center;
  padding: 20px;
}

.screen {
  width: 90%;
  height: 30px;
  margin: 0 auto 30px;
  background: linear-gradient(to bottom, #e0e0e0, #b0b0b0);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.seat-row {
  display: flex;
  gap: 8px;
  align-items: center;
}


.seat {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  cursor: default;
}

.seat.available {
  background-color: #f0f9eb;
  border: 1px solid #67c23a;
  color: #67c23a;
}

.seat.reserved {
  background-color: #fdf6ec;
  border: 1px solid #e6a23c;
  color: #e6a23c;
}

.seat.occupied {
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
  color: #f56c6c;
}

.seat.maintenance {
  background-color: #f4f4f5;
  border: 1px solid #909399;
  color: #909399;
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-marker {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-marker.available {
  background-color: #67c23a;
}

.legend-marker.reserved {
  background-color: #e6a23c;
}

.legend-marker.occupied {
  background-color: #f56c6c;
}

.legend-marker.maintenance {
  background-color: #909399;
}

.legend-text {
  font-size: 14px;
  color: #666;
}



.page-container {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-item {
  width: 350px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.operation-buttons {
  display: flex;
  gap: 8px;
}

.movie-info {
  display: flex;
  align-items: center;
}

.movie-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.movie-title {
  font-weight: bold;
}

.movie-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.duration {
  color: #909399;
}

.hall-type {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>