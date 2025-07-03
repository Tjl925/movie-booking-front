<script setup>
import { ref } from 'vue';
import SubMenu2 from "@/views/components/SubMenu2.vue";
import TopNav4Admin from "@/views/components/TopNav4Admin.vue";
import UserManagement from "../user/UserManagement.vue";
import UserGroupManagement from "../user/UserGroupManagement.vue";
import MovieInfo from "../movie/MovieInfo.vue";
import MovieGenre from "../movie/MovieGenre.vue";
import MovieRegion from "../movie/MovieRegion.vue";
import MovieSession from "../movie/MovieSession.vue";
import OrderInfo from "../order/OrderInfo.vue";
import UserRole from "../user/UserRole.vue";
import Statistics from "../Statistics.vue";

// 当前激活的菜单项
const activeMenu = ref('1'); // 默认显示

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
        <!-- 首页内容 -->
        <div v-if="activeMenu === '1'" class="content-panel">
          <Statistics />
        </div>

        <!-- 用户列表内容 -->
        <div v-if="activeMenu === '2-1'" class="content-panel">
          <user-management />
        </div>

        <!-- 分组管理内容 -->
        <div v-if="activeMenu === '2-2'" class="content-panel">
          <user-group-management />
        </div>

        <!-- 电影信息内容 -->
        <div v-if="activeMenu === '3-1'" class="content-panel">
          <movie-info />
        </div>

        <!-- 电影类型管理内容 -->
        <div v-if="activeMenu === '3-2'" class="content-panel">
          <movie-genre />
        </div>

        <!-- 电影区域管理内容 -->
        <div v-if="activeMenu === '3-3'" class="content-panel">
          <movie-region />
        </div>

        <!-- 场次管理内容 -->
        <div v-if="activeMenu === '3-4'" class="content-panel">
          <movie-session />
        </div>

        <!-- 订单信息内容 -->
        <div v-if="activeMenu === '4'" class="content-panel">
          <order-info />
        </div>

        <!-- 角色权限内容 -->
        <div v-if="activeMenu === '5'" class="content-panel">
          <UserRole />
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