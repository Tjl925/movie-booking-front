import {createRouter, createWebHistory} from "vue-router";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import adminPage from "@/views/admin/adminPage.vue";
import superadminPage from "@/views/superadmin/superadminPage.vue";
import { useUserInfoStore } from '@/stores/userInfo';
import { ElMessage } from 'element-plus';
import UserManagement from "@/views/user/UserManagement.vue";
import SearchList from "@/views/SearchList.vue";
import movieDetails from "@/views/movie/moviedetails.vue";
import MovieInfo from "@/views/movie/MovieInfo.vue";
import chooseSessions from "@/views/choose/chooseSessions.vue";
import seatSelection from "@/views/choose/seatSelection.vue";
import OrderDetail from "@/views/order/OrderDetail.vue";
import MovieList from "@/views/movie/MovieList.vue";
import QQAuthRedirect from "@/views/user/QQAuthRedirect.vue";

/* eslint-disable no-unused-vars */
/**
 * @typedef {Object} RouteMeta
 * @property {boolean} [skipAuth] - 是否跳过认证
 */
import OrderInfo from "@/views/order/OrderInfo.vue";
import userOrders from "@/views/user/UserOrders.vue";
import paymentSuccess from "@/views/order/PaymentSuccess.vue";


// 定义路由关系
const routes = [
  {path: '/Home', component: Home},  // 一级路由
  {path: '/', redirect: '/Home'}, // 重定向到首页
  {path: '/Login', component: Login},
  {path: '/admin', component: adminPage},
  {path: '/superadmin', component: superadminPage},
  {path: '/user', component: UserManagement},
  {path: '/movie', component: MovieInfo},
  {path: '/movie-info/:id', component: movieDetails},
  {path: '/MovieList', component: MovieList},
  {path: '/SearchList', component: SearchList},
  {path: '/chooseSessions/:id', component: chooseSessions},
  {
    path: '/seat-selection/:movieId/:sessionId',
    name: 'seatSelection',
    component: seatSelection,
    props: true
  },
  {
    path: '/user-orders/:id',
    name: 'userOrders',
    component: userOrders,
    props: true
  },
  {path: '/order-info/:id', component: OrderDetail},
  {path:'/order', component: OrderInfo},
  {path:'/payment-success/:id', component: paymentSuccess},
  {
    path: '/qq-auth-redirect',
    component: QQAuthRedirect,
    meta: { skipAuth: true }  // 注意：meta 要放在路由对象内部
  },
  {  // 注意：每个路由对象之间要用逗号分隔
    path: '/bind-qq',
    component: () => import('@/views/user/QQBind.vue'),
    meta: { skipAuth: true }
  }
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
  if (to.meta.skipAuth) {// eslint-disable-line no-undef
    next();
    return;
  }
  // 登录页面允许直接访问
  if (to.path === '/Login') {
    next();
    return;
  }

  // 检查是否已登录（判断token是否存在）
  if (!userInfo.token && to.path.startsWith('/seat-selection')) {
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

  // 允许普通用户访问 /user-orders/:userId
  if (to.path.startsWith('/user-orders')) {
    next();
    return;
  }

  // 用户管理相关页面，只有管理员和超级管理员可访问
  if (to.path.startsWith('/user') && roleId === 3) {
    ElMessage.error('无权访问用户管理页面');
    next(getDefaultRouteByRole(roleId));
    return;
  }

  // 允许普通用户访问 /movie-info/:movieId
  if (to.path.startsWith('/movie-info')) {
    next();
    return;
  }

  // 电影管理相关页面，只有管理员和超级管理员可访问
  if (to.path.startsWith('/movie') && roleId === 3) {
    ElMessage.error('无权访问电影管理页面');
    next(getDefaultRouteByRole(roleId));
    return;
  }

  // 允许普通用户访问 /movie-info/:movieId
  if (to.path.startsWith('/order-info')) {
    next();
    return;
  }

  // 订单管理相关页面，只有管理员和超级管理员可访问
  if (to.path.startsWith('/order') && roleId === 3) {
    ElMessage.error('无权访问订单管理页面');
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
