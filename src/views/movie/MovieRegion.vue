<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>电影区域管理</span>
      </div>
    </template>
    <el-table :data="regionList" height="540">
      <el-table-column prop="name" label="区域名称" />
      <el-table-column prop="movieCount" label="电影数量"/>
      <el-table-column label="操作"  fixed="right">
        <template #default="scope">
          <el-button
              size="small"
              type="primary"
              @click="handleViewMovies(scope.row)"
          >查看</el-button>
          <el-button size="small" @click="handleEditRegion(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDeleteRegion(scope.row)"
          >下架</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑区域对话框 -->
    <el-dialog
      title="编辑区域"
      v-model="dialogVisible"
      width="30%"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入区域名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看电影对话框 -->
    <el-dialog
      :title="`${currentRegion}区域电影列表`"
      v-model="moviesDialogVisible"
      width="80%"
      align-center
    >
      <el-table :data="moviesList" height="500" style="width: 100%" v-loading="moviesLoading">
        <el-table-column prop="id" label="ID" width="80" align="center"/>
        <el-table-column prop="title" label="电影名称" align="center"/>
        <el-table-column prop="director" label="导演" align="center"/>
        <el-table-column prop="durationMinutes" label="时长(分钟)" width="100" align="center"/>
        <el-table-column prop="releaseDate" label="上映日期" width="120" align="center"/>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="100" align="center"/>
        <el-table-column prop="viewCount" label="观看人数" width="100" align="center"/>
        <el-table-column label="海报" width="140" align="center">
          <template #default="scope">
            <el-image
                style="width: 100px; height: 120px"
                :src="getUrl(scope.row.posterUrl)"
                :preview-src-list="[scope.row.posterUrl]"
                fit="cover"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAllRegions, getMoviesByRegion, deleteMoviesByRegion, updateMoviesByRegion } from '@/api/movie';

// 区域列表数据
const regionList = ref([]);
const dialogVisible = ref(false);
const formRef = ref(null);

// 电影列表数据
const moviesList = ref([]);
const moviesDialogVisible = ref(false);
const moviesLoading = ref(false);
const currentRegion = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 表单数据
const form = reactive({
  name: '',
  oldName: '' // 保存原始名称，用于API调用
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入区域名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
};

const getUrl =(url)=>{
  return `http://127.0.0.1:8888/uploads${url}`;
}

// 获取区域列表
const fetchRegionList = async () => {
  try {
    const response = await getAllRegions();
    regionList.value = response.data;
  } catch (error) {
    console.error('获取区域列表失败:', error);
    ElMessage.error('获取区域列表失败');
  }
};

// 根据区域获取电影列表
const fetchMoviesByRegion = async () => {
  try {
    moviesLoading.value = true;
    const params = {
      page: currentPage.value,
      size: pageSize.value
    };
    const response = await getMoviesByRegion(currentRegion.value, params);
    moviesList.value = response.data.records;
    total.value = response.data.total;
    moviesLoading.value = false;
  } catch (error) {
    console.error('获取电影列表失败:', error);
    ElMessage.error('获取电影列表失败');
    moviesLoading.value = false;
  }
};

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchMoviesByRegion();
};

// 处理当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchMoviesByRegion();
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

// 查看电影列表
const handleViewMovies = (row) => {
  currentRegion.value = row.name;
  currentPage.value = 1;
  pageSize.value = 10;
  moviesDialogVisible.value = true;
  fetchMoviesByRegion();
};

// 编辑区域
const handleEditRegion = (row) => {
  form.name = row.name;
  form.oldName = row.name; // 保存原始名称，用于API调用
  dialogVisible.value = true;
};

// 下架区域
const handleDeleteRegion = (row) => {
  ElMessageBox.confirm(
    `确定要下架区域 "${row.name}" 吗？这将下架所有该区域的电影！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        // 调用API下架该区域的所有电影
        await deleteMoviesByRegion(row.name);
        ElMessage.success('下架成功');
        // 刷新区域列表
        fetchRegionList();
      } catch (error) {
        console.error('下架失败:', error);
        ElMessage.error('下架失败: ' + (error.response?.data?.message || '未知错误'));
      }
    })
    .catch(() => {
      // 取消下架
    });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.name = '';
  form.oldName = '';
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // 调用API更新电影区域
        await updateMoviesByRegion(form.oldName, form.name);
        ElMessage.success('更新成功');
        dialogVisible.value = false;
        resetForm();
        // 刷新区域列表
        fetchRegionList();
      } catch (error) {
        console.error('提交失败:', error);
        ElMessage.error('操作失败: ' + (error.response?.data?.message || '未知错误'));
      }
    } else {
      console.log('验证失败:', fields);
    }
  });
};

// 页面加载时获取区域列表
onMounted(() => {
  fetchRegionList();
});
</script>

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

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>