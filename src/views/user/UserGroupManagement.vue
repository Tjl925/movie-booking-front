<script setup>
import {ref, onMounted} from 'vue';
import {Edit, Delete, Plus, UserFilled} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  getUserGroups, 
  createUserGroup, 
  updateUserGroup, 
  deleteUserGroup,
  getUsersInGroup,
  removeUserFromGroup
} from '@/api/admin';
import dayjs from "dayjs";

// 用户分组相关数据和方法
const userGroups = ref([]);
const groupLoading = ref(false);

// 创建分组对话框
const createGroupDialogVisible = ref(false);
const groupForm = ref({
  name: '',
  description: '',
  type: 'CUSTOM' // 默认为自定义分组
});

// 编辑分组对话框
const editGroupDialogVisible = ref(false);
const editGroupForm = ref({
  id: null,
  name: '',
  description: '',
  type: ''
});

// 分组用户对话框
const groupUsersDialogVisible = ref(false);
const selectedGroup = ref(null);
const groupUsersLoading = ref(false);
const groupUsersList = ref([]);
const groupUsersTotal = ref(0);
const groupUsersCurrentPage = ref(1);
const groupUsersPageSize = ref(10);

// 加载用户分组列表
const loadUserGroups = async () => {
  try {
    groupLoading.value = true;
    const res = await getUserGroups();
    userGroups.value = res.data;
    console.log('用户分组列表:', res.data);
  } catch (error) {
    console.error('加载用户分组失败:', error);
    ElMessage.error('加载用户分组失败');
  } finally {
    groupLoading.value = false;
  }
};

// 创建用户分组
const createGroup = async () => {
  try {
    await createUserGroup(groupForm.value);
    ElMessage.success('创建分组成功');
    createGroupDialogVisible.value = false;
    // 重置表单
    groupForm.value = {
      name: '',
      description: '',
      type: 'CUSTOM'
    };
    // 重新加载分组列表
    loadUserGroups();
  } catch (error) {
    console.error('创建分组失败:', error);
    ElMessage.error('创建分组失败');
  }
};

// 编辑用户分组
const editGroup = async () => {
  try {
    await updateUserGroup(editGroupForm.value.id, editGroupForm.value);
    ElMessage.success('更新分组成功');
    editGroupDialogVisible.value = false;
    // 重新加载分组列表
    loadUserGroups();
  } catch (error) {
    console.error('更新分组失败:', error);
    ElMessage.error('更新分组失败');
  }
};

// 删除用户分组
const handleDeleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm(`确定要删除分组 "${group.name}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await deleteUserGroup(group.id);
    ElMessage.success('删除分组成功');
    // 重新加载分组列表
    loadUserGroups();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分组失败:', error);
      ElMessage.error('删除分组失败');
    }
  }
};

// 打开编辑分组对话框
const handleEditGroup = (group) => {
  editGroupForm.value = {
    id: group.id,
    name: group.name,
    description: group.description,
    type: group.type
  };
  editGroupDialogVisible.value = true;
};

// 打开分组用户对话框
const handleViewGroupUsers = async (group) => {
  try {
    selectedGroup.value = group;
    groupUsersDialogVisible.value = true;
    groupUsersCurrentPage.value = 1;
    await loadGroupUsers();
  } catch (error) {
    console.error('获取分组用户失败:', error);
    ElMessage.error('获取分组用户失败');
  }
};

// 加载分组用户列表
const loadGroupUsers = async () => {
  try {
    if (!selectedGroup.value) return;
    
    groupUsersLoading.value = true;
    const params = {
      page: groupUsersCurrentPage.value,
      size: groupUsersPageSize.value
    };
    
    const res = await getUsersInGroup(selectedGroup.value.id, params);
    console.info("分组用户列表:", res.data.records);
    groupUsersList.value = res.data.records;
    groupUsersTotal.value = res.data.total;
  } catch (error) {
    console.error('加载分组用户失败:', error);
    ElMessage.error('加载分组用户失败');
  } finally {
    groupUsersLoading.value = false;
  }
};

// 分组用户分页变化
const handleGroupUsersSizeChange = (val) => {
  groupUsersPageSize.value = val;
  loadGroupUsers();
};

const handleGroupUsersCurrentChange = (val) => {
  groupUsersCurrentPage.value = val;
  loadGroupUsers();
};

// 从分组中移除用户
const handleRemoveUserFromGroup = async (userId) => {
  try {
    await ElMessageBox.confirm('确定要从该分组中移除此用户吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await removeUserFromGroup(selectedGroup.value.id, userId);
    ElMessage.success('移除用户成功');
    await loadGroupUsers();
    await loadUserGroups();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除用户失败:', error);
      ElMessage.error('移除用户失败');
    }
  }
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm');
};

// 组件挂载时加载分组列表
onMounted(() => {
  loadUserGroups();
});

</script>

<template>
  <el-card class="page-container">
    <template #header>
      <div class="header">
        <span>用户分组管理</span>
        <div class="action-buttons">
          <el-button type="primary" :icon="Plus" @click="createGroupDialogVisible = true">创建分组</el-button>
        </div>
      </div>
    </template>
    
    <!-- 用户分组管理 -->
    <el-table
        :data="userGroups"
        border
        height="530"
        style="width: 100%"
        v-loading="groupLoading"
        element-loading-text="加载中..."
    >
      <el-table-column prop="id" label="ID" width="80"/>
      <el-table-column prop="name" label="分组名称"/>
      <el-table-column prop="description" label="描述"/>
      <el-table-column prop="type" label="类型" width="120" :filters="[
        { text: '系统分组', value: 'SYSTEM' },
        { text: '自定义分组', value: 'CUSTOM' }
      ]" :filter-method="(value, row) => row.type === value" filter-placement="bottom">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'SYSTEM' ? 'danger' : 'primary'">
            {{ scope.row.type === 'SYSTEM' ? '系统分组' : '自定义分组' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户数量" width="100">
        <template #default="scope">
          {{ scope.row.userCount || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="250">
        <template #default="scope">
          <el-button
              size="small"
              type="primary"
              :icon="UserFilled"
              @click="handleViewGroupUsers(scope.row)"
          >查看
          </el-button>
          <el-button
              size="small"
              type="warning"
              :icon="Edit"
              @click="handleEditGroup(scope.row)"
              :disabled="scope.row.type === 'SYSTEM'"
          >编辑
          </el-button>
          <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDeleteGroup(scope.row)"
              :disabled="scope.row.type === 'SYSTEM'"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建分组对话框 -->
    <el-dialog
        title="创建用户分组"
        v-model="createGroupDialogVisible"
        width="500px"
    >
      <el-form :model="groupForm" label-width="100px">
        <el-form-item label="分组名称">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="groupForm.description" placeholder="请输入分组描述" type="textarea" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createGroupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createGroup">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑分组对话框 -->
    <el-dialog
        title="编辑用户分组"
        v-model="editGroupDialogVisible"
        width="500px"
    >
      <el-form :model="editGroupForm" label-width="100px">
        <el-form-item label="分组名称">
          <el-input v-model="editGroupForm.name" placeholder="请输入分组名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editGroupForm.description" placeholder="请输入分组描述" type="textarea" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editGroupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="editGroup">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分组用户对话框 -->
    <el-dialog
        :title="`分组用户 - ${selectedGroup?.name}`"
        v-model="groupUsersDialogVisible"
        width="900px"
    >
      <el-table
          :data="groupUsersList"
          border
          style="width: 100%"
          v-loading="groupUsersLoading"
          element-loading-text="加载中..."
      >
        <el-table-column prop="id" label="ID" width="60"/>
        <el-table-column prop="username" label="用户名"/>
        <el-table-column prop="email" label="邮箱"/>
        <el-table-column prop="phone" label="手机号" width="150"/>
        <el-table-column prop="roleId" label="角色" width="120">
          <template #default="scope">
            <span>
              {{
                scope.row.roleId === 1 ? '超级管理员' : scope.row.roleId === 2 ? '管理员' : '普通用户'
              }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleRemoveUserFromGroup(scope.row.id)"
            >移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
            v-model:current-page="groupUsersCurrentPage"
            v-model:page-size="groupUsersPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="groupUsersTotal"
            @size-change="handleGroupUsersSizeChange"
            @current-change="handleGroupUsersCurrentChange"
        />
      </div>
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

.header span {
  font-size: 18px;
  font-weight: bold;
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
</style>