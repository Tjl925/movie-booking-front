import {createRouter, createWebHistory} from "vue-router";
import Home from "@/views/Home.vue";
import Layout from "@/views/Layout.vue";
import UserInfo from "@/views/user/UserInfo.vue";
import UserList from "@/views/user/UserList.vue";
import RestPassword from "@/views/user/RestPassword.vue";
import Login from "@/views/Login.vue";
import adminPage from "@/views/admin/adminPage.vue";
import superadminPage from "@/views/superadmin/superadminPage.vue";



// 定义路由关系
const routes = [
  {path: '/Home', component: Home},  // 一级路由
  {
    path: '/',
    redirect: '/login',  // 重定向
    component: Layout,
    // 子路由
    children: [
      {path: '/user/list', component: UserList},
      {path: '/user/info', component: UserInfo},
      {path: '/user/resetPassword', component: RestPassword},
    ]
  },
  {path: '/Login', component: Login},
  {path: '/admin', component: adminPage},
  {path: '/superadmin', component: superadminPage},
]

// 创建路由器
const router = createRouter({
  history: createWebHistory(), // 路由模式
  routes: routes
})

//导出暴露
export default router
