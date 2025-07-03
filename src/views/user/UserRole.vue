<script setup>
import {ref, onMounted, reactive} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {getUserList, updateUser, getAllRoles} from '@/api/admin.js';
import {Search} from "@element-plus/icons-vue";

// 分页参数
const pageParams = reactive({
  current: 1,
  size: 10,
  total: 0
});

const searchQuery = ref('');
const roleFilter = ref('');
const allUsers = ref([]);

// 用户列表数据
const userList = ref([]);

// 角色列表数据
const roleList = ref([]);

// 加载状态
const loading = ref(false);
const roleLoading = ref(false);

// 根据角色ID获取角色名称
const getRoleDisplayName = (roleId) => {
  const role = roleList.value.find(r => r.id === roleId);
  return role ? role.displayName : '未知角色';
};

// 根据角色ID获取角色描述
const getRoleDescription = (roleId) => {
  const role = roleList.value.find(r => r.id === roleId);
  return role ? role.description : '未知角色描述';
};

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true;
  try {
    const params = {
      current: 1,
      size: 1000,
    };
    const response = await getUserList(params);
    console.log('获取用户列表响应:', response);
    if (response.status) {
      userList.value = response.data.records;
      pageParams.total = response.data.total;
      allUsers.value = response.data.records;

      // 应用筛选
      applyFiltersAndPagination();
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 应用筛选和分页
const applyFiltersAndPagination = () => {
  let filteredData = allUsers.value.filter(user => {
    if (searchQuery.value) {
      if (!user.username.toLowerCase().includes(searchQuery.value.toLowerCase())) {
        return false;
      }
    }

    // 角色筛选
    if (roleFilter.value && user.roleName !== roleFilter.value) {
      return false;
    }
    return true;
  });

  // 计算总数
  pageParams.total = filteredData.length;

  // 应用分页
  const startIndex = (pageParams.current - 1) * pageParams.size;
  const endIndex = startIndex + pageParams.size;
  userList.value = filteredData.slice(startIndex, endIndex);
};

const handleSearch = () => {
  pageParams.current = 1;
  applyFiltersAndPagination();
};

// 处理状态筛选
const handleRoleFilterChange = (value) => {
  roleFilter.value = value;
  pageParams.current = 1; // 重置到第一页
  applyFiltersAndPagination();
};

// 处理分页变化
const handleCurrentChange = (val) => {
  pageParams.current = val;
  applyFiltersAndPagination();
};

const handleSizeChange = (val) => {
  pageParams.size = val;
  pageParams.current = 1;
  applyFiltersAndPagination();
};

// 授权为管理员
const authorizeAsAdmin = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要将用户 ${row.username} 授权为管理员吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await updateUser(row.id, {roleId: 2}); // 2 是管理员角色ID
    ElMessage.success('授权成功');
    fetchUserList(); // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('授权失败:', error);
      ElMessage.error('授权失败');
    }
  }
};

// 收回权限为普通用户
const revokeToUser = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要将 ${row.username} 的权限收回为普通用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await updateUser(row.id, {roleId: 3}); // 3 是普通用户角色ID
    ElMessage.success('权限收回成功');
    fetchUserList(); // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('权限收回失败:', error);
      ElMessage.error('权限收回失败');
    }
  }
};

// 获取角色列表
const fetchRoleList = async () => {
  roleLoading.value = true;
  try {
    const response = await getAllRoles();
    console.log('获取角色列表响应:', response);
    roleList.value = response.data;
  } catch (error) {
    console.error('获取角色列表失败:', error);
    ElMessage.error('获取角色列表失败');
  } finally {
    roleLoading.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchUserList();
  fetchRoleList();
});
</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>权限管理</span>
        <div class="search-container">
          <el-input
              v-model="searchQuery"
              placeholder="请输入用户名搜索"
              clearable
              style="width: 300px; margin-left: 10px"
              @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon>
                  <Search/>
                </el-icon>
              </el-button>
            </template>
          </el-input>
          <el-select v-model="roleFilter" placeholder="角色" clearable @change="handleRoleFilterChange"
                     style="width: 150px; margin-left: 10px">
            <el-option label="超级管理员" value="SUPER_ADMIN"/>
            <el-option label="管理员" value="ADMIN"/>
            <el-option label="普通用户" value="USER"/>
          </el-select>
        </div>
      </div>
    </template>

    <!-- 用户列表表格 -->
    <el-table
        v-loading="loading || roleLoading"
        :data="userList"
        style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="100"/>
      <el-table-column prop="username" label="用户名"/>
      <el-table-column label="角色名">
        <template #default="scope">
          <span>{{ scope.row.roleName || getRoleDisplayName(scope.row.roleId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色描述">
        <template #default="scope">
          <span>{{ getRoleDescription(scope.row.roleId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button
              type="primary"
              size="small"
              :disabled="scope.row.roleId !== 3"
              @click="authorizeAsAdmin(scope.row)"
          >
            授权
          </el-button>
          <el-button
              type="danger"
              size="small"
              :disabled="scope.row.roleId !== 2"
              @click="revokeToUser(scope.row)"
          >
            收权
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
          v-model:current-page="pageParams.current"
          v-model:page-size="pageParams.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageParams.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<style scoped>
.page-container {
  margin-bottom: 10px;
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

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

</style>