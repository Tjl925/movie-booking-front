import {createRouter, createWebHistory} from "vue-router";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import adminPage from "@/views/admin/adminPage.vue";
import superadminPage from "@/views/superadmin/superadminPage.vue";
import { useUserInfoStore } from '@/stores/userInfo';
import { ElMessage } from 'element-plus';
import UserManagement from "@/views/user/UserManagement.vue";
import MovieInfo from "@/views/movie/MovieInfo.vue";



// 定义路由关系
const routes = [
  {path: '/Home', component: Home},  // 一级路由
  {path: '/', redirect: '/Home'}, // 重定向到首页
  {path: '/Login', component: Login},
  {path: '/admin', component: adminPage},
  {path: '/superadmin', component: superadminPage},
  {path: '/user', component: UserManagement},
  {path: '/movie', component: MovieInfo},
]

// 创建路由器
const router = createRouter({
  history: createWebHistory(), // 路由模式
  routes: routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 获取用户信息
  const userInfoStore = useUserInfoStore();
  const userInfo = userInfoStore.userInfo;
  
  // 登录页面允许直接访问
  if (to.path === '/Login') {
    next();
    return;
  }
  
  // 检查是否已登录（判断token是否存在）
  if (!userInfo.token && to.path !== '/Home') {
    ElMessage.warning('请先登录');
    next('/Login');
    return;
  }
  
  // 根据角色控制页面访问权限
  const roleId = Number(userInfo.roleId);
  
  // 超级管理员页面
  if (to.path === '/superadmin' && roleId !== 1) {
    ElMessage.error('无权访问超级管理员页面');
    next(getDefaultRouteByRole(roleId));
    return;
  }
  
  // 管理员页面
  if (to.path === '/admin' && roleId !== 2 && roleId !== 1) {
    ElMessage.error('无权访问管理员页面');
    next(getDefaultRouteByRole(roleId));
    return;
  }
  
  // 用户管理相关页面，只有管理员和超级管理员可访问
  if (to.path.startsWith('/user') && roleId === 3) {
    ElMessage.error('无权访问用户管理页面');
    next(getDefaultRouteByRole(roleId));
    return;
  }
  
  // 其他情况放行
  next();
});

// 根据角色获取默认路由
function getDefaultRouteByRole(roleId) {
  switch (roleId) {
    case 1:
      return '/superadmin';
    case 2:
      return '/admin';
    default:
      return '/Home';
  }
}

//导出暴露
export default router
