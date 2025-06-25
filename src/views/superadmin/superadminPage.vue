<script setup>
import { ref } from 'vue';
import TopNav4Admin from "@/views/components/TopNav4Admin.vue";
import UserManagement from "../user/UserManagement.vue";
import MovieInfo from "../movie/MovieInfo.vue";
import SubMenu2 from "@/views/components/SubMenu2.vue";

// 当前激活的菜单项
const activeMenu = ref('2'); // 默认显示用户管理

// 处理菜单点击事件
const handleMenuClick = (menuIndex) => {
  activeMenu.value = menuIndex;
};
</script>

<template>
  <div class="admin-container">
    <TopNav4Admin/>
    <div class="content-container">
      <div class="sidebar">
        <sub-menu2 @menu-click="handleMenuClick"/>
      </div>
      <div class="main-content">
        <!-- 用户管理内容 -->
        <div v-if="activeMenu === '2'" class="content-panel">
          <user-management />
        </div>

        <!-- 电影信息内容 -->
        <div v-if="activeMenu === '3-1'" class="content-panel">
          <movie-info />
        </div>

        <!-- 其他菜单项的内容区域，可以根据需要添加 -->
        <div v-if="activeMenu !== '2' && activeMenu !== '3-1'" class="content-panel">
          <el-empty description="暂未实现该功能，敬请期待" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-container {
  display: flex;
  flex: 1;
  margin-top: 10px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  margin-left: 10px;
}
</style>