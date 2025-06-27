<script setup>
import {ref, onMounted, reactive} from 'vue';
import {Search, Edit, Delete, Warning, Connection} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  getUserList, 
  updateUser, 
  deleteUser, 
  updateUserStatus, 
  getGroupsByUser,
  addUserToGroup,
  removeUserFromGroup,
  getUserGroups
} from '@/api/admin';

// 用户管理相关数据和方法
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const userList = ref([]);
const loading = ref(false);
const userGroups = ref([]);

// 搜索参数
const searchParams = reactive({
  username: '',
  email: '',
});

// 编辑用户对话框
const editDialogVisible = ref(false);
const editForm = ref({
  id: null,
  username: '',
  email: '',
  phone: '',
  roleId: null,
  avatar: ''
});

// 用户分组关联对话框
const userGroupDialogVisible = ref(false);
const selectedUser = ref(null);
const userGroupsLoading = ref(false);
const selectedGroups = ref([]);

// 加载用户列表数据
const loadUserList = async () => {
  loading.value = true;
  try {
    const params = {
      current: currentPage.value,
      size: pageSize.value
    };

    // 添加搜索条件
    if (searchParams.username) params.username = searchParams.username;
    if (searchParams.email) params.email = searchParams.email;

    const response = await getUserList(params);
    console.info('响应:', response)
    if (response.status) {
      userList.value = response.data.records;
      total.value = response.data.total;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载用户分组
const loadUserGroups = async () => {
  try {
    const res = await getUserGroups();
    console.info('用户分组:', res);
    userGroups.value = res.data;
  } catch (error) {
    console.error('获取用户分组失败:', error);
    ElMessage.error('获取用户分组失败');
  }
};

// 搜索用户
const handleSearch = () => {
  // 根据搜索关键词设置搜索参数
  if (searchKeyword.value) {
    // 判断是否是邮箱格式
    if (searchKeyword.value.includes('@')) {
      searchParams.email = searchKeyword.value;
      searchParams.username = '';
    } else {
      searchParams.username = searchKeyword.value;
      searchParams.email = '';
    }
  } else {
    searchParams.username = '';
    searchParams.email = '';
  }

  currentPage.value = 1; // 重置到第一页
  loadUserList();
};

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  loadUserList();
};

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadUserList();
};

// 打开编辑对话框
const handleEdit = (row) => {
  editForm.value = {
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    roleId: row.roleId,
    avatar: row.avatar || ''
  };
  editDialogVisible.value = true;
};

// 提交编辑表单
const submitEditForm = async () => {
  try {
    const response = await updateUser(editForm.value.id, editForm.value);
    if (response.status) {
      ElMessage.success('用户更新成功');
      editDialogVisible.value = false;
      loadUserList(); // 重新加载用户列表
    }
  } catch (error) {
    console.error('更新用户失败:', error);
    ElMessage.error('更新用户失败');
  }
};

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
      `确定要删除用户 ${row.username} 吗？此操作不可逆。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(async () => {
    try {
      const response = await deleteUser(row.id);
      if (response.status) {
        ElMessage.success('用户删除成功');
        loadUserList(); // 重新加载用户列表
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      ElMessage.error('删除用户失败');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 更新用户状态（禁用/启用）
const handleStatusChange = async (row) => {
  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const statusText = newStatus === 'ACTIVE' ? '启用' : '禁用';

  try {
    const response = await updateUserStatus(row.id, newStatus);
    if (response.status) {
      ElMessage.success(`用户${statusText}成功`);
      loadUserList(); // 重新加载用户列表
    }
  } catch (error) {
    console.error(`${statusText}用户失败:`, error);
    ElMessage.error(`${statusText}用户失败`);
  }
};



// 打开用户分组关联对话框
const handleManageUserGroups = async (user) => {
  try {
    selectedUser.value = user;
    userGroupsLoading.value = true;
    userGroupDialogVisible.value = true;
    
    // 获取用户所属的分组列表
    const res = await getGroupsByUser(user.id);
    console.info(res);
    selectedGroups.value = res.data.map(group => group.id);
  } catch (error) {
    console.error('获取用户分组失败:', error);
    ElMessage.error('获取用户分组失败');
  } finally {
    userGroupsLoading.value = false;
  }
};

// 保存用户分组关联
const saveUserGroups = async () => {
  try {
    const userId = selectedUser.value.id;
    const currentGroups = await getGroupsByUser(userId);
    const currentGroupIds = currentGroups.data.map(group => group.id);
    
    // 需要添加的分组
    const groupsToAdd = selectedGroups.value.filter(groupId => !currentGroupIds.includes(groupId));
    
    // 需要移除的分组
    const groupsToRemove = currentGroupIds.filter(groupId => !selectedGroups.value.includes(groupId));
    
    // 添加用户到分组
    for (const groupId of groupsToAdd) {
      await addUserToGroup(groupId, userId);
    }
    
    // 从分组中移除用户
    for (const groupId of groupsToRemove) {
      await removeUserFromGroup(groupId, userId);
    }
    
    ElMessage.success('更新用户分组成功');
    userGroupDialogVisible.value = false;
  } catch (error) {
    console.error('更新用户分组失败:', error);
    ElMessage.error('更新用户分组失败');
  }
};

// 组件挂载时加载用户列表和分组
onMounted(() => {
  loadUserList();
  loadUserGroups();
});

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

    <!-- 用户列表表格 -->
    <div>
      <el-table
          :data="userList"
          border
          style="width: 100%"
          v-loading="loading"
          element-loading-text="加载中..."
      >
      <el-table-column type="expand">
        <template #default="props">
          <el-descriptions border :column="4">
            <el-descriptions-item
                :rowspan="3"
                :width="140"
                label="头像"
                align="center"
            >
              <el-image
                  style="width: 100px; height: 100px"
                  src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
              />
            </el-descriptions-item>
            <el-descriptions-item label="ID" align="center">{{ props.row.id }}</el-descriptions-item>
            <el-descriptions-item label="用户名" align="center">{{ props.row.username }}</el-descriptions-item>
            <el-descriptions-item label="角色" align="center">
                <span>
                  {{
                    props.row.roleName === 'SUPER_ADMIN' ? '超级管理员' : props.row.roleName === 'ADMIN' ? '管理员' : '普通用户'
                  }}
                </span>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱" align="center">{{ props.row.email }}</el-descriptions-item>
            <el-descriptions-item label="手机号" align="center">{{ props.row.phone }}</el-descriptions-item>
            <el-descriptions-item label="状态" align="center">{{ props.row.status }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" align="center">{{ props.row.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="上次登录时间" align="center">{{ props.row.lastLogin }}</el-descriptions-item>
            <el-descriptions-item label="登录次数" align="center">{{ props.row.loginCount }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="60"/>
      <el-table-column prop="username" label="用户名"/>
      <el-table-column prop="email" label="邮箱"/>
      <el-table-column prop="phone" label="手机号" width="150"/>
      <el-table-column prop="roleName" label="角色" width="120" :filters="[
        { text: '超级管理员', value: 'SUPER_ADMIN' },
        { text: '管理员', value: 'ADMIN' },
        { text: '普通用户', value: 'USER' }
      ]" :filter-method="(value, row) => row.roleName === value" filter-placement="bottom">
        <template #default="scope">
          <span>
            {{
              scope.row.roleName === 'SUPER_ADMIN' ? '超级管理员' : scope.row.roleName === 'ADMIN' ? '管理员' : '普通用户'
            }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" :filters="[
        { text: '正常', value: 'ACTIVE' },
        { text: '禁用', value: 'INACTIVE' }
      ]" :filter-method="(value, row) => row.status === value" filter-placement="bottom">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ scope.row.status === 'ACTIVE' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="350">
        <template #default="scope">
          <el-button
              size="small"
              type="primary"
              :icon="Edit"
              @click="handleEdit(scope.row)"
          >编辑
          </el-button>
          <el-button
              size="small"
              :type="scope.row.status === 'ACTIVE' ? 'warning' : 'success'"
              :icon="Warning"
              @click="handleStatusChange(scope.row)"
          >{{ scope.row.status === 'ACTIVE' ? '禁用' : '启用' }}
          </el-button>
          <el-button
              size="small"
              type="info"
              :icon="Connection"
              @click="handleManageUserGroups(scope.row)"
          >分组
          </el-button>
          <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDelete(scope.row)"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控件 -->
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
    </div>

    <!-- 编辑用户对话框 -->
    <el-dialog
        title="编辑用户"
        v-model="editDialogVisible"
        width="500px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="角色ID">
          <el-input v-model.number="editForm.roleId" placeholder="请输入角色ID"></el-input>
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="editForm.avatar" placeholder="请输入头像URL"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户分组关联对话框 -->
    <el-dialog
        :title="`管理用户分组 - ${selectedUser?.username}`"
        v-model="userGroupDialogVisible"
        width="600px"
    >
      <div v-loading="userGroupsLoading">
        <el-checkbox-group v-model="selectedGroups">
          <el-checkbox 
            v-for="group in userGroups" 
            :key="group.id" 
            :label="group.id"
          >
            {{ group.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userGroupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUserGroups">确定</el-button>
        </span>
      </template>
    </el-dialog>


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

.tab-actions {
  flex: 1;
  margin: 0 20px;
}

.search-box {
  width: 350px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.el-checkbox {
  margin-right: 0 !important;
}
</style>