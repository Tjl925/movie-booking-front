<script setup>
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

// 用户管理相关数据和方法
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const userList = ref([]); // 这里应该从API获取数据

// 模拟一些用户数据
userList.value = [
  {
    id: 1,
    username: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    roleName: '普通用户',
    status: 'ACTIVE',
    lastLogin: '2023-06-01 10:30:00'
  },
  {
    id: 2,
    username: '李四',
    email: 'lisi@example.com',
    phone: '13900139000',
    roleName: '管理员',
    status: 'ACTIVE',
    lastLogin: '2023-06-02 14:20:00'
  }
];
total.value = userList.value.length;

const handleSearch = () => {
  // 实现搜索逻辑
  console.log('搜索关键词:', searchKeyword.value);
  // 这里应该调用API进行搜索
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  // 重新加载数据
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  // 重新加载数据
};

const handleEdit = (row) => {
  console.log('编辑用户:', row);
  // 实现编辑逻辑
};

const handleDelete = (row) => {
  console.log('删除用户:', row);
  // 实现删除逻辑
};

const handleDeactive = (row) => {
  console.log('禁用用户:', row);
  // 实现禁用逻辑
};

</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>用户管理</span>
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入用户名或邮箱搜索"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </template>
    <el-table :data="userList" border style="width: 100%">
      <el-table-column prop="id" label="ID"  />
      <el-table-column prop="username" label="用户名"  />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="roleName" label="角色" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ scope.row.status === 'ACTIVE' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最后登录时间" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
              size="small"
              type="info"
              @click="handleDeactive(scope.row)"
          >禁用</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDelete(scope.row)"
          >删除</el-button>
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

.search-box {
  width: 350px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>