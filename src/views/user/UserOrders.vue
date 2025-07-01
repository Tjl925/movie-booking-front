<script setup>
import { ref, onMounted } from 'vue';
import { getUserOrders, cancelOrder, deleteOrder, refundOrder } from '@/api/orders';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserInfoStore } from '@/stores/userInfo';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown, ArrowUp, Delete } from '@element-plus/icons-vue';

// 获取用户信息和路由参数
const userInfoStore = useUserInfoStore();
const route = useRoute();
const router = useRouter();
const userId = ref(route.params.id || userInfoStore.userInfo.id);

// 表格数据
const tableData = ref([]);
// 加载状态
const loading = ref(false);
// 分页参数
const pagination = ref({
  currentPage: 1,
  pageSize: 6,
  total: 0
});

// 展开详情的订单ID
const expandedOrderId = ref(null);

// 切换展开/收起详情
const toggleExpand = (orderId) => {
  if (expandedOrderId.value === orderId) {
    expandedOrderId.value = null;
  } else {
    expandedOrderId.value = orderId;
  }
};

// 获取用户订单
const fetchUserOrders = async () => {
  loading.value = true;
  try {
    const response = await getUserOrders(
      pagination.value.currentPage, 
      pagination.value.pageSize, 
      userId.value
    );
    if (response.status) {
      tableData.value = response.data.records;
      pagination.value.total = response.data.total;
    } else {
      ElMessage.error('获取订单列表失败');
    }
  } catch (error) {
    console.error('获取订单列表出错:', error);
    ElMessage.error('获取订单列表出错');
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handleCurrentChange = (val) => {
  pagination.value.currentPage = val;
  fetchUserOrders();
};

const handleSizeChange = (val) => {
  pagination.value.pageSize = val;
  fetchUserOrders();
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replaceAll('/', '-');
};

// 格式化日期（年月日）
const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replaceAll('/', '-');
};

// 格式化时间为星期几 月日 时分秒
const formatTimeWithWeekday = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  
  return `星期${weekday} ${month}月${day}日 ${hour}:${minute}:${second}`;
};

// 格式化订单状态
const formatStatus = (status) => {
  const statusMap = {
    'PENDING': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'REFUNDED': '已退款'
  };
  return statusMap[status] || status;
};

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'PENDING': 'warning',
    'PAID': 'success',
    'CANCELLED': 'info',
    'REFUNDED': 'danger'
  };
  return typeMap[status] || '';
};

// 处理取消订单
const handleCancel = (row) => {
  ElMessageBox.confirm(
    `确定要取消订单 ${row.orderNumber} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const response = await cancelOrder(row.id, userId.value);
        if (response.status) {
          ElMessage.success('订单已取消');
          fetchUserOrders(); // 重新加载数据
        } else {
          ElMessage.error(response.message || '取消失败');
        }
      } catch (error) {
        console.error('取消订单出错:', error);
        ElMessage.error('取消订单出错');
      }
    })
    .catch(() => {
      ElMessage.info('已取消操作');
    });
};

// 处理申请退款
const handleRefund = (row) => {
  ElMessageBox.confirm(
    '确定要申请退款吗？退款后订单将无法恢复。',
    '申请退款',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 弹出输入框，让用户输入退款原因
      return ElMessageBox.prompt('请输入退款原因', '退款原因', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：个人原因取消观影',
      });
    })
    .then(({ value: refundReason }) => {
      loading.value = true;
      // 调用退款API
      return refundOrder(row.id, refundReason || '用户申请退款');
    })
    .then((response) => {
      console.log('退款申请响应:', response);
      loading.value = false;
      if (response.data === '退款成功') {
        ElMessage.success('退款申请成功');
        // 刷新订单列表
        fetchOrders();
      } else {
        ElMessage.error(response.message || '退款申请失败');
      }
    })
    .catch((error) => {
      loading.value = false;
      if (error !== 'cancel' && error !== 'close') {
        console.error('退款申请错误:', error);
        ElMessage.error('退款申请发生错误，请稍后重试');
      }
    });
};

// 处理删除订单
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除订单 ${row.orderNumber} 吗？删除后无法恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const response = await deleteOrder(row.id);
        if (response.status) {
          ElMessage.success('订单已删除');
          fetchUserOrders(); // 重新加载数据
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除订单出错:', error);
        ElMessage.error('删除订单出错');
      }
    })
    .catch(() => {
      ElMessage.info('已取消操作');
    });
};

// 跳转到电影详情页
const goToMovieDetail = (event, movieId) => {
  event.stopPropagation();
  if (movieId) {
    router.push(`/movie-info/${movieId}`);
  } else {
    ElMessage.info('电影信息不完整，无法查看详情');
  }
};

onMounted(() => {
  fetchUserOrders();
});
</script>

<template>
  <div class="user-orders">
    <h2>我的订单</h2>
    
    <div v-loading="loading" element-loading-text="加载中..." class="orders-container">
      <div v-if="tableData.length === 0 && !loading" class="no-orders">
        <el-empty description="暂无订单数据" />
      </div>
      
      <!-- 订单列表 -->
      <div v-if="tableData.length > 0" class="order-cards">
        <el-card 
          v-for="order in tableData" 
          :key="order.id" 
          class="order-card"
          :body-style="{ padding: '0px' }"
          shadow="hover"
          @click="toggleExpand(order.id)"
        >
          <!-- 卡片顶部栏 -->
          <div class="card-header">
            <div class="header-left">
              <span class="date">{{ formatDate(order.session?.sessionTime) }}</span>
              <span class="order-number">订单号: {{ order.orderNumber }}</span>
            </div>
            <div class="header-right-actions">
              <el-button 
                type="danger" 
                :icon="Delete" 
                circle 
                size="small" 
                @click.stop="handleDelete(order)"
                class="delete-btn"
              />
            </div>
          </div>
        <div class="order-card-content">
           <!-- 左侧电影海报 -->
           <div 
             class="movie-poster" 
             @click.stop="goToMovieDetail($event, order.session?.movie?.id)"
             :class="{ 'clickable': order.session?.movie?.id }"
           >
             <img 
               v-if="order.session && order.session.movie && order.session.movie.posterUrl" 
               :src="`http://127.0.0.1:8888/uploads${order.session.movie.posterUrl}`" 
               alt="电影海报"
             >
             <div v-else class="no-poster">暂无海报</div>
           </div>
           
           <!-- 中间订单信息 -->
           <div class="order-info">
             <div class="order-header">
               <h3 
                 class="movie-title" 
                 @click.stop="goToMovieDetail($event, order.session?.movie?.id)"
                 :class="{ 'clickable': order.session?.movie?.id }"
               >
                 {{ order.session ? order.session.movie.title : '未知电影' }}
               </h3>
               <div class="header-right">
                 <el-tag :type="getStatusType(order.status)" class="status-tag">
                   {{ formatStatus(order.status) }}
                 </el-tag>
                 <el-button 
                    type="text" 
                    class="expand-btn" 
                    @click.stop="toggleExpand(order.id)"
                  >
                   <el-icon>
                     <arrow-down v-if="expandedOrderId !== order.id" />
                     <arrow-up v-else />
                   </el-icon>
                   {{ expandedOrderId === order.id ? '收起' : '详情' }}
                 </el-button>
               </div>
             </div>
             
             <div class="order-details">
               <div class="detail-item">
                 <span class="label">开始时间：</span>
                 <span class="value">{{ order.session ? formatTimeWithWeekday(order.session.sessionTime) : '-' }}</span>
               </div>
               <div class="detail-item">
                 <span class="label">结束时间：</span>
                 <span class="value">{{ order.session ? formatTimeWithWeekday(order.session.endTime) : '-' }}</span>
               </div>
               <div class="detail-item">
                  <span class="label">影厅：</span>
                  <span class="value">{{ order.session ? (order.session.hall.hallName || order.session.hall.name) : '-' }}</span>
                </div>
               <div class="detail-item">
                 <span class="label">座位：</span>
                 <span class="value">{{ order.seatNumbers }}</span>
               </div>
               <div class="detail-item">
                 <span class="label">票数：</span>
                 <span class="value">{{ order.ticketCount }}张</span>
               </div>
               <div class="detail-item">
                 <span class="label">总金额：</span>
                 <span class="value price">¥{{ order.totalAmount.toFixed(2) }}</span>
               </div>
             </div>
             
             <!-- 展开的详细信息 -->
             <div v-if="expandedOrderId === order.id" class="expanded-details" style="display: flex;">
               <div class="divider"></div>
               <div class="expanded-section">
                 <h4>支付信息</h4>
                 <div class="detail-item">
                   <span class="label">支付方式：</span>
                   <span class="value">{{ order.payment ? order.payment.paymentMethod : '-' }}</span>
                 </div>
                 <div class="detail-item">
                   <span class="label">支付时间：</span>
                   <span class="value">{{ order.payment ? formatDateTime(order.payment.paymentTime) : '-' }}</span>
                 </div>
               </div>
               <div v-if="order.session" class="expanded-section">
                 <h4>场次详情</h4>
                 <div class="detail-item">
                   <span class="label">开始时间：</span>
                   <span class="value">{{ formatDateTime(order.session.sessionTime) }}</span>
                 </div>
                 <div class="detail-item">
                   <span class="label">结束时间：</span>
                   <span class="value">{{ formatDateTime(order.session.endTime) }}</span>
                 </div>
               </div>
             </div>
           </div>
          
          <!-- 右侧操作按钮 -->
          <div class="order-actions" @click.stop>
            <el-button
              type="warning"
              :disabled="order.status !== 'PENDING'"
              @click="handleCancel(order)"
              class="action-btn"
            >
              取消订单
            </el-button>
            <el-button
              type="danger"
              :disabled="order.status !== 'PAID'"
              @click="handleRefund(order)"
              class="action-btn"
            >
              申请退款
            </el-button>
          </div>
        </div>
      </el-card>
        </div>
      
        <div v-if="tableData.length > 0" class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[6, 12, 24, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
  </div>
</template>

<style scoped>
.user-orders {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.no-orders {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

h2 {
  margin-bottom: 20px;
  color: #EC443F;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 10px;
}

.orders-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* 卡片顶部栏样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.date {
  font-weight: bold;
}

.order-number {
  color: #606266;
  font-size: 0.9em;
}

.header-right-actions {
  display: flex;
  gap: 10px;
}

.delete-btn:hover {
  background-color: #f56c6c;
  color: white;
}

.order-card-content {
  display: flex;
  min-height: 200px;
}

.movie-poster {
  width: 140px;
  height: 200px;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.movie-poster.clickable {
  cursor: pointer;
  position: relative;
}

.movie-poster.clickable::after {
  content: '查看详情';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
  font-size: 12px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.movie-poster.clickable:hover::after {
  opacity: 1;
}

.movie-poster img {
  width: 90%;
  height: 90%;
  object-fit: cover;
}

.no-poster {
  color: #909399;
  font-size: 14px;
}

.order-info {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px dashed #EBEEF5;
  padding-bottom: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.movie-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: bold;
}

.movie-title.clickable {
  cursor: pointer;
  transition: color 0.3s ease;
}

.movie-title.clickable:hover {
  color: #409EFF;
  text-decoration: underline;
}

.status-tag {
  font-size: 14px;
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #409EFF;
  padding: 0;
  height: auto;
}

.expand-btn .el-icon {
  margin-right: 2px;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 10px;
  row-gap: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.label {
  color: #909399;
  font-size: 14px;
  margin-right: 5px;
  white-space: nowrap;
}

.value {
  color: #606266;
  font-size: 14px;
  word-break: break-all;
}

.price {
  color: #F56C6C;
  font-weight: bold;
}

.expanded-details {
  margin-top: 10px;
  animation: fadeIn 0.3s ease;
}

.expanded-section {
  margin-top: 10px;
  display: inline-block;
  vertical-align: top;
  width: 50%;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 10px 0;
}

.expanded-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.order-actions {
  width: 120px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  border-left: 1px solid #EBEEF5;
}

.action-btn {
  width: 100%;
  margin: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>