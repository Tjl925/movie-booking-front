<script setup>
import {onBeforeUnmount, ref} from 'vue'
import {ArrowDown} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessage } from "element-plus";
import {updateUserProfile, uploadAvatar, changePassword, logout, sendVerificationCode} from "@/api/user";
import {useUserInfoStore} from "@/stores/userInfo";

const router = useRouter();
const userInfoStore = useUserInfoStore();

const countDown = ref(0)
let timer = null

// 1. 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'log_out') {
    const token = userInfoStore.userInfo.token;
    if (token) {
      logout(token).then((res) => {
        console.info(res);
        userInfoStore.removeUserInfo();
        ElMessage.success('登出成功');
        router.push('/Home');
      });
    }
  } else if (command === 'update') {
    showUpdate();
  } else if (command === 'changePassword') {
    showChangePassword();
  }
};

// 2. 通用工具函数
const previewUrls = ref([]);
const getUrl =(url)=>{
  console.log(userInfoStore.userInfo);
  return `http://127.0.0.1:8888/uploads${url}`;
}
const getPreviewUrl = (file) => {
  if (!file) return '';

  // 生成预览URL
  const url = URL.createObjectURL(file);

  // 存储URL以便后续释放
  previewUrls.value.push(url);

  return url;
};
// 组件卸载时释放所有预览URL，避免内存泄漏
onBeforeUnmount(() => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url));
  previewUrls.value = [];
});
// 信息脱敏函数
// 手机号脱敏：显示前3位和后4位
const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.length > 7
      ? `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}`
      : '****';
};
const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;

  const maskedUsername = username.length > 3
      ? `${username.substring(0, 3)}****`
      : '****';

  return `${maskedUsername}@${domain}`;
};

// 3. 用户信息修改相关
const updateDialogVisible = ref(false);
const updateDTO = ref({
  username: "",
  email: "",
  phone: "",
  avatar: "",
  code:""
});

const handleGetCode = () => {
  // 先简单校验邮箱格式
  const emailReg = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!emailReg.test(updateDTO.value.email)) {
    ElMessage.error('请输入正确的邮箱格式')
    return
  }
  // 模拟发送验证码，实际需调接口
  updateDTO.value.email = updateDTO.value.email;
  sendVerificationCode(updateDTO.value).then((res) => {
    console.log(res)
    if (res.status) {
      ElMessage.success('验证码已发送至邮箱，请查收~')
      // 启动倒计时
      countDown.value = 60
      timer = setInterval(() => {
        countDown.value--
        if (countDown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }else{
      ElMessage.error(res.message || '发送失败，请稍后重试');
    }
  })
}

const avatarFile = ref(null);
// 表单数据
const showUpdate = () => {
  updateDTO.value = {
    username: "",
    email: "",
    phone: "",
    avatar: ""
  };
  updateDialogVisible.value = true;
};

const update = async () => {
  const userId = userInfoStore.userInfo?.id;
  if (!userId) throw new Error('用户未登录');

  // 1. 如果有新头像，先上传头像
  let avatarUrl = null;
  if (avatarFile.value) {
    const uploadRes = await uploadAvatar(userId, avatarFile.value);
    avatarUrl = uploadRes.data; // 假设返回的是头像URL字符串
  }

  // 2. 更新用户信息
  const payload = {
    username: updateDTO.value.username || undefined,
    email: updateDTO.value.email || undefined,
    phone: updateDTO.value.phone || undefined,
    avatar: avatarUrl || undefined,
    code:updateDTO.value.code||undefined,
  };

  // 移除undefined字段
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  // 3. 执行更新
  updateUserProfile(userId, payload).then(res=>{
    if(res.status) {
      console.log('修改返回'+res.data);
      // 4. 更新本地store数据
      userInfoStore.setUserInfo({
        ...userInfoStore.userInfo,
        ...payload
      });

      ElMessage.success('修改成功！');
      updateDialogVisible.value = false;
      avatarFile.value = null;
    }else{
      ElMessage.error(res.message);
    }
  })
}

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

// 4. 密码修改相关
const passwordDialogVisible = ref(false);
const ChangePasswordDTO = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
  userId:null
});

const showChangePassword = () => {
  passwordDialogVisible.value=true;
}
const handlePasswordUpdate = async () => {
  ChangePasswordDTO.value.userId=userInfoStore.userInfo.id;
  changePassword(ChangePasswordDTO.value).then((res) => {
    if (res.status) {
      // 成功逻辑
      ElMessage.success(res.message || '密码修改成功');
      passwordDialogVisible.value = false;
      const username = userInfoStore.userInfo.username;
      userInfoStore.removeUserInfo(); // 清除用户信息
      router.push({
        path: '/Login',
        query: {username}
      });
    } else {
      // 失败逻辑
      ElMessage.error(res.message || '密码修改失败，请检查输入');
    }
  })

};
</script>

<template>
  <div class="top-nav">
    <div class="nav-container">
      <!-- Logo 区域 -->
      <div class="logo-box">
        <img src="@/assets/logo.png" alt="logo" class="logo-img"/>
        <span class="logo-text">猫眼电影</span>
      </div>

      <!-- 头像区域 -->
      <div class="avatar-box">
        <el-dropdown size="mini" @command="handleCommand">
          <span class="el-dropdown-trigger">
            <template v-if="userInfoStore.userInfo.id!=null">
              <el-avatar
                  :src="getUrl(userInfoStore.userInfo.avatar) || '@/assets/default-avatar.jpg'"
                  class="avatar"
              />
              <span class="username">{{ userInfoStore.userInfo.username }}</span>
            </template>
            <template v-else>
              <el-avatar icon="el-icon-user" class="avatar"/>
            </template>
            <el-icon class="dropdown-arrow">
              <ArrowDown/>
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu class="custom-dropdown-menu">
              <el-dropdown-item command="update">基本信息</el-dropdown-item>
              <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
              <el-dropdown-item command="log_out">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>

  <!-- 修改用户信息对话框 -->
  <el-dialog v-model="updateDialogVisible" title="修改个人信息" width="700">
    <el-form :model="updateDTO">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="current-info">
            <h4>当前信息</h4>
            <el-form-item label="用户名">
              <div class="readonly-field">
                {{ userInfoStore.userInfo.username }}
              </div>
            </el-form-item>
            <el-form-item label="邮箱">
              <div class="readonly-field">
                {{ maskEmail(userInfoStore.userInfo.email) }}
              </div>
            </el-form-item>
            <el-form-item label="手机号">
              <div class="readonly-field">
                {{ maskPhone(userInfoStore.userInfo.phone) }}
              </div>
            </el-form-item>
            <el-form-item label="头像">
              <el-avatar :size="100" :src="getUrl(userInfoStore.userInfo.avatar)" />
            </el-form-item>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="update-info">
            <h4>修改信息</h4>
            <el-form-item label="新用户名">
              <el-input v-model="updateDTO.username" placeholder="输入新用户名" />
            </el-form-item>
            <el-form-item label="新邮箱">
              <el-input v-model="updateDTO.email" placeholder="输入新邮箱" />
            </el-form-item>
            <el-form-item label="验证码" prop="code">
              <div style="display: flex; gap: 10px; align-items: center">
                <el-input
                    v-model="updateDTO.code"
                    placeholder="请输入验证码"
                    clearable
                    :maxlength="6"
                    style="flex: 1"
                />
                <el-button
                    type="primary"
                    @click="handleGetCode"
                    :disabled="countDown > 0"
                    style="width: 100px"

                >
                  {{ countDown > 0 ? `${countDown}s后重试` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="新手机号">
              <el-input v-model="updateDTO.phone" placeholder="输入新手机号" />
            </el-form-item>
            <el-form-item label="新头像">
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
          </div>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="updateDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="update">确认修改</el-button>
    </template>
  </el-dialog>

  <!-- 修改密码对话框 -->
  <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500">
    <el-form :model="ChangePasswordDTO" label-width="100px">
      <el-form-item label="旧密码" prop="newPassword">
        <el-input
            v-model="ChangePasswordDTO.oldPassword"
            type="password"
            show-password
            placeholder="请输入当前密码"
        />
      </el-form-item>
      <el-form-item label="新密码" prop="confirmPassword">
        <el-input
            v-model="ChangePasswordDTO.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
            v-model="ChangePasswordDTO.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="passwordDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handlePasswordUpdate">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 头部容器：居中布局 + 固定宽度 */
.top-nav {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.nav-container {
  width: 1200px;
  height: 60px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

/* Logo 样式 */
.logo-box {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-box:hover {
  background-color: #f5f5f5;
  border-radius: 4px;
}

.logo-img {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
}

/* 头像容器：用于控制触发区域的布局 */
.avatar-box {
  position: relative;
  display: inline-block;
}

/* 触发区域样式：头像和箭头水平排列 */
.el-dropdown-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  border: none !important;
  color: red;
}

/* 头像样式 */
.avatar {
  width: 40px;
  height: 40px;
}

/* 下拉箭头样式 */
.dropdown-arrow {
  margin-left: 4px;
  font-size: 14px;
  color: #999;
}

/* 关键：下拉菜单居中 */
.custom-dropdown-menu {
  left: 50% !important;
  transform: translateX(-50%) !important;
  margin-top: 8px !important;
}

.username {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

.avatar-preview {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 只读输入框样式 */
:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
  cursor: not-allowed;
}

.readonly-field {
  padding: 6px 12px;
  min-height: 32px;
  line-height: 1.5;
  border-radius: 4px;
  background-color: #f5f7fa;
  color: #606266;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
}

/* 进一步区分左右列 */
.current-info {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 20px;
}

.update-info {
  padding: 20px;
}
</style>