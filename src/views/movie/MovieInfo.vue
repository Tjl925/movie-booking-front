<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>电影信息管理</span>
        <div class="search-box">
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
      </div>
    </template>
    <div class="button-container">
      <el-icon><Plus /></el-icon>
      <el-button type="primary" @click="handleAddMovie">添加电影</el-button>
    </div>
    <el-table :data="movieList" border style="width: 100%">
      <el-table-column prop="id" label="ID" />
      <el-table-column prop="title" label="电影名称" />
      <el-table-column prop="director" label="导演"/>
      <el-table-column prop="actors" label="主演" />
      <el-table-column prop="duration" label="时长(分钟)" />
      <el-table-column prop="releaseDate" label="上映日期" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'NOW_SHOWING' ? 'success' : 'info'">
            {{ scope.row.status === 'SHOWING' ? '上映中' : '未上映' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="handleEditMovie(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDeleteMovie(scope.row)"
          >删除</el-button>
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
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import {Plus, Search} from '@element-plus/icons-vue';

// 电影管理相关数据和方法
const movieSearchKeyword = ref('');
const movieCurrentPage = ref(1);
const moviePageSize = ref(10);
const movieTotal = ref(0);
const movieList = ref([]); // 这里应该从API获取数据

// 模拟一些电影数据
movieList.value = [
  {
    id: 1,
    title: '流浪地球2',
    director: '郭帆',
    actors: '吴京,刘德华,李雪健',
    duration: 173,
    releaseDate: '2023-01-22',
    status: 'SHOWING'
  },
  {
    id: 2,
    title: '满江红',
    director: '张艺谋',
    actors: '沈腾,易烊千玺,张译',
    duration: 159,
    releaseDate: '2023-01-22',
    status: 'SHOWING'
  }
];
movieTotal.value = movieList.value.length;

const handleMovieSearch = () => {
  // 实现电影搜索逻辑
  console.log('搜索关键词:', movieSearchKeyword.value);
  // 这里应该调用API进行搜索
};

const handleMovieSizeChange = (size) => {
  moviePageSize.value = size;
  // 重新加载数据
};

const handleMovieCurrentChange = (page) => {
  movieCurrentPage.value = page;
  // 重新加载数据
};

const handleAddMovie = () => {
  console.log('添加电影');
  // 实现添加电影逻辑
};

const handleEditMovie = (row) => {
  console.log('编辑电影:', row);
  // 实现编辑逻辑
};

const handleDeleteMovie = (row) => {
  console.log('删除电影:', row);
  // 实现删除逻辑
};
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

.search-box {
  width: 350px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.button-container {
  width: 120px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>