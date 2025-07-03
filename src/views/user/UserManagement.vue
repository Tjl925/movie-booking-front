<script setup>
import {ref, onMounted, reactive} from 'vue';
import {Search, Edit, Delete, Warning, Connection} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  getUserList, 
  updateUser,
  updateUserStatus, 
  getGroupsByUser,
  addUserToGroup,
  removeUserFromGroup,
  getUserGroups
} from '@/api/admin';
import {uploadAvatar} from "@/api/user";
import dayjs from "dayjs";

// 用户管理相关数据和方法
const searchKeyword = ref('');
const searchType = ref('username'); // 默认按用户名搜索，可选值：username, email, phone
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const userList = ref([]);
const allUsers = ref([]); // 存储所有用户数据，用于全局筛选
const loading = ref(false);
const userGroups = ref([]);
// 多选数据
const multipleSelection = ref([]);

// 处理表格多选
const handleSelectionChange = (val) => {
  multipleSelection.value = val;
};

// 批量启用用户
const batchEnableUsers = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择用户');
    return;
  }

  // 过滤出状态为禁用的用户
  const disabledUsers = multipleSelection.value.filter(user => user.status === 'INACTIVE' && user.roleId !== 1);

  if (disabledUsers.length === 0) {
    ElMessage.warning('所选用户中没有禁用状态的用户');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要启用选中的 ${disabledUsers.length} 个用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 批量处理启用操作
    const promises = disabledUsers.map(user => updateUserStatus(user.id, 'ACTIVE'));
    await Promise.all(promises);

    ElMessage.success(`成功启用 ${disabledUsers.length} 个用户`);
    await loadUserList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量启用用户失败:', error);
      ElMessage.error('批量启用用户失败');
    }
  }
};

// 批量禁用用户
const batchDisableUsers = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择用户');
    return;
  }

  // 过滤出状态为正常的用户，且不是超级管理员
  const enabledUsers = multipleSelection.value.filter(user => user.status === 'ACTIVE' && user.roleId !== 1);

  if (enabledUsers.length === 0) {
    ElMessage.warning('所选用户中没有可禁用的用户或包含超级管理员');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要禁用选中的 ${enabledUsers.length} 个用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 批量处理禁用操作
    const promises = enabledUsers.map(user => updateUserStatus(user.id, 'INACTIVE'));
    await Promise.all(promises);

    ElMessage.success(`成功禁用 ${enabledUsers.length} 个用户`);
    await loadUserList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量禁用用户失败:', error);
      ElMessage.error('批量禁用用户失败');
    }
  }
};

// 筛选条件
const roleFilter = ref(''); // 角色筛选
const statusFilter = ref(''); // 状态筛选

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
    // 获取所有用户数据
    const params = {
      current: 1,
      size: 1000
    };

    const response = await getUserList(params);
    console.info('响应:', response)
    if (response.status) {
      userList.value = response.data.records;
      total.value = response.data.total;
      allUsers.value = response.data.records; // 存储所有用户数据，用于全局筛选
      
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
  // 应用搜索筛选
  let filteredUsers = allUsers.value.filter(user => {
    // 搜索关键词筛选
    if (searchKeyword.value) {
      if (searchType.value === 'username' && !user.username.toLowerCase().includes(searchKeyword.value.toLowerCase())) {
        return false;
      }
      if (searchType.value === 'email' && !user.email.toLowerCase().includes(searchKeyword.value.toLowerCase())) {
        return false;
      }
      if (searchType.value === 'phone' && !user.phone.includes(searchKeyword.value)) {
        return false;
      }
    }
    
    // 角色筛选
    if (roleFilter.value && user.roleName !== roleFilter.value) {
      return false;
    }
    
    // 状态筛选
    if (statusFilter.value && user.status !== statusFilter.value) {
      return false;
    }
    
    return true;
  });
  
  // 更新总数
  total.value = filteredUsers.length;
  
  // 应用分页
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  userList.value = filteredUsers.slice(startIndex, endIndex);
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
  currentPage.value = 1; // 重置到第一页
  applyFiltersAndPagination(); // 应用筛选而不是重新加载
};

// 处理搜索类型变化
const handleSearchTypeChange = () => {
  handleSearch(); // 搜索类型变化时重新应用搜索
};

// 处理角色筛选变化
const handleRoleFilterChange = () => {
  currentPage.value = 1; // 重置页码
  applyFiltersAndPagination();
};

// 处理状态筛选变化
const handleStatusFilterChange = () => {
  currentPage.value = 1; // 重置页码
  applyFiltersAndPagination();
};

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
  applyFiltersAndPagination();
};

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  applyFiltersAndPagination();
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

    let avatarUrl = null;
    if (avatarFile.value) {
      const uploadRes = await uploadAvatar(editForm.value.id, avatarFile.value);
      avatarUrl = uploadRes.data; // 假设返回的是头像URL字符串
    }
    editForm.value.avatar = avatarUrl;
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

// 更新用户状态（禁用/启用）
const handleStatusChange = async (row) => {
  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const statusText = newStatus === 'ACTIVE' ? '启用' : '禁用';

  try {
    const response = await updateUserStatus(row.id, newStatus);
    if (response.status) {
      ElMessage.success(`用户${statusText}成功`);
      await loadUserList(); // 重新加载用户列表
    }
  } catch (error) {
    console.error(`${statusText}用户失败:`, error);
    ElMessage.error(`${statusText}用户失败`);
  }
};

//处理头像
const avatarFile = ref(null);
const previewUrls = ref([]);
const getPreviewUrl = (file) => {
  if (!file) return '';

  // 生成预览URL
  const url = URL.createObjectURL(file);

  // 存储URL以便后续释放
  previewUrls.value.push(url);

  return url;
};
const handleAvatarChange = (file) => {
  // 验证文件类型和大小
  const isJpgOrPng = file.raw.type === 'image/jpeg' || file.raw.type === 'image/png';
  const isLt2M = file.raw.size / 1024 / 1024 < 2;

  if (!isJpgOrPng) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }

  // 先释放之前的URL
  if (avatarFile.value) {
    URL.revokeObjectURL(avatarFile.value);
  }

  avatarFile.value = file.raw;
  return true; // 确保返回true表示验证通过
};
const getUrl =(url)=>{
  return `http://127.0.0.1:8888/uploads${url}`;
}
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

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm');
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
        <div class="search-container">
          <el-select v-model="searchType" placeholder="搜索类型" style="width: 150px" @change="handleSearchTypeChange">
            <el-option label="用户名" value="username" />
            <el-option label="邮箱" value="email" />
            <el-option label="手机号" value="phone" />
          </el-select>
          <el-input
              v-model="searchKeyword"
              :placeholder="`搜索${searchType === 'username' ? '用户名' : searchType === 'email' ? '邮箱' : '手机号'}`"
              clearable
              @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="roleFilter" placeholder="角色" clearable @change="handleRoleFilterChange" style="width: 150px; margin-left: 10px">
            <el-option label="超级管理员" value="SUPER_ADMIN" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="普通用户" value="USER" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="状态" clearable @change="handleStatusFilterChange" style="width: 150px; margin-left: 10px">
            <el-option label="正常" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
          </el-select>
        </div>
      </div>
    </template>

    <!-- 批量操作按钮 -->
    <div class="batch-actions">
      <el-button-group>
        <el-button type="success" @click="batchEnableUsers" :disabled="multipleSelection.length === 0">
          批量启用
        </el-button>
        <el-button type="warning" @click="batchDisableUsers" :disabled="multipleSelection.length === 0">
          批量禁用
        </el-button>
      </el-button-group>

      <span v-if="multipleSelection.length > 0" class="selection-info">
        已选择 {{ multipleSelection.length }} 个用户
      </span>
    </div>

    <!-- 用户列表表格 -->
    <div>
      <el-table
          :data="userList"
          border
          style="width: 100%"
          v-loading="loading"
          element-loading-text="加载中..."
          height="450px"
          @selection-change="handleSelectionChange"
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
                  :src="getUrl(props.row.avatar)"
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
            <el-descriptions-item label="创建时间" align="center">{{ formatDateTime(props.row.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="上次登录时间" align="center">{{ formatDateTime(props.row.lastLogin) }}</el-descriptions-item>
            <el-descriptions-item label="登录次数" align="center">{{ props.row.loginCount }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column type="selection" width="60"/>
      <el-table-column prop="id" label="ID" width="80"/>
      <el-table-column prop="username" label="用户名"/>
      <el-table-column prop="email" label="邮箱"/>
      <el-table-column prop="phone" label="手机号" width="150"/>
      <el-table-column prop="roleName" label="角色" width="120">
        <template #default="scope">
          <span>
            {{
              scope.row.roleName === 'SUPER_ADMIN' ? '超级管理员' : scope.row.roleName === 'ADMIN' ? '管理员' : '普通用户'
            }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ scope.row.status === 'ACTIVE' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="280">
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
          <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              :accept="'image/jpeg,image/png'"
          >
            <el-button type="primary">选择新头像</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 JPG/PNG 格式，大小不超过 2MB</div>
            </template>
          </el-upload>
          <div v-if="avatarFile" class="avatar-preview">  <!-- 移除 && avatarFile.value -->
            <span>新头像预览：</span>
            <el-avatar :size="100" :src="getPreviewUrl(avatarFile)" />  <!-- 直接使用 avatarFile -->
          </div>
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
  margin-bottom: 10px;
}

.page-container ::v-deep(.el-card__header) {
  margin-bottom: -7px;
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

.batch-actions {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.selection-info{
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

</style>