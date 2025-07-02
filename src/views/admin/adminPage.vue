<script setup>
import { ref } from 'vue';
import SubMenu1 from "@/views/components/SubMenu1.vue";
import TopNav4Admin from "@/views/components/TopNav4Admin.vue";
import UserManagement from "../user/UserManagement.vue";
import UserGroupManagement from "../user/UserGroupManagement.vue";
import MovieInfo from "../movie/MovieInfo.vue";
import MovieGenre from "../movie/MovieGenre.vue";
import MovieRegion from "../movie/MovieRegion.vue";
import MovieSession from "../movie/MovieSession.vue";
import OrderInfo from "../order/OrderInfo.vue";
import Home from "../Home.vue";

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
        <sub-menu1 @menu-click="handleMenuClick"/>
      </div>
      <div class="main-content">
        <div v-if="activeMenu === '1'" class="content-panel">
          <Home />
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

        <!-- 其他菜单项的内容区域，可以根据需要添加 -->
        <div v-if="activeMenu === '1'" class="content-panel">
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