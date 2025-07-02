<script lang="ts" setup>
import {Document, Menu as IconMenu, Setting, User, Film} from '@element-plus/icons-vue'
import { defineEmits } from 'vue';

const emit = defineEmits(['menu-click']);

const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
  emit('menu-click', key);
}

</script>

<template>
  <!-- 管理员 -->
  <el-menu
    default-active="1"
    :default-openeds="['2','3','4']"
    class="el-menu-vertical-demo"
    active-text-color="red"
    @select="handleSelect"
  >
    <el-menu-item index="1">
      <el-icon><icon-menu /></el-icon>
      <span>系统首页</span>
    </el-menu-item>
    <el-sub-menu index="2">
      <template #title>
        <el-icon><user /></el-icon>
        <span>用户管理</span>
      </template>
      <el-menu-item index="2-1">用户信息</el-menu-item>
      <el-menu-item index="2-2">分组管理</el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="3">
      <template #title>
        <el-icon><film /></el-icon>
        <span>电影管理</span>
      </template>
      <el-menu-item index="3-1">电影信息</el-menu-item>
      <el-menu-item index="3-2">电影类型</el-menu-item>
      <el-menu-item index="3-3">电影区域</el-menu-item>
      <el-menu-item index="3-4">场次管理</el-menu-item>
    </el-sub-menu>
    <el-menu-item index="4">
      <el-icon><Document /></el-icon>
      <span>订单管理</span>
    </el-menu-item>
  </el-menu>
</template>