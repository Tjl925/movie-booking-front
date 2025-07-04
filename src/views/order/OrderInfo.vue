<script setup>
import { ref, onMounted } from 'vue';
import {getAllOrders, deleteOrder, refundOrder} from '@/api/orders';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import dayjs from "dayjs";

// 表格数据
const tableData = ref([]);
const allOrders = ref([]); // 存储所有订单数据
// 加载状态
const loading = ref(false);
// 分页参数
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 搜索条件
const searchQuery = ref('');
const searchType = ref('movie'); // 默认按电影名搜索，可选值：movie, userId

// 状态筛选
const statusFilter = ref('');

// 获取所有订单
const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await getAllOrders(1, 1000); // 获取所有订单数据，用于全局筛选
    if (response.status) {
      console.log('获取订单列表成功:', response.data.records);
      allOrders.value = response.data.records;
      applyFiltersAndPagination();
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

// 应用筛选和分页
const applyFiltersAndPagination = () => {
  let filteredData = [...allOrders.value];
  
  // 应用搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    if (searchType.value === 'movie') {
      filteredData = filteredData.filter(order => 
        order.session && order.session.movie.title.toLowerCase().includes(query)
      );
    } else if (searchType.value === 'userId') {
      filteredData = filteredData.filter(order => 
        order.userId && order.userId.toString() === query
      );
    }
  }
  
  // 应用状态筛选
  if (statusFilter.value) {
    filteredData = filteredData.filter(order => order.status === statusFilter.value);
  }
  
  // 计算总数
  pagination.value.total = filteredData.length;
  
  // 应用分页
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  tableData.value = filteredData.slice(start, end);
};

// 处理搜索
const handleSearch = () => {
  pagination.value.currentPage = 1; // 重置到第一页
  applyFiltersAndPagination();
};

// 处理状态筛选
const handleStatusFilterChange = (value) => {
  statusFilter.value = value;
  pagination.value.currentPage = 1; // 重置到第一页
  applyFiltersAndPagination();
};

// 处理分页变化
const handleCurrentChange = (val) => {
  pagination.value.currentPage = val;
  applyFiltersAndPagination();
};

const handleSizeChange = (val) => {
  pagination.value.pageSize = val;
  pagination.value.currentPage = 1;
  applyFiltersAndPagination();
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm');
};

// 格式化订单状态
const formatStatus = (status) => {
  const statusMap = {
    'PENDING': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'REFUNDED': '已退款',
    'COMPLETED': '已完成'
  };
  return statusMap[status] || status;
};

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'PENDING': 'warning',
    'PAID': 'success',
    'CANCELLED': 'info',
    'REFUNDED': 'danger',
    'COMPLETED': 'success'
  };
  return typeMap[status] || '';
};

// 处理删除订单
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除订单 ${row.orderNumber} 吗？`,
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
          ElMessage.success('删除成功');
          fetchOrders(); // 重新加载数据
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除订单出错:', error);
        ElMessage.error('删除订单出错');
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

// 处理退款
const handleRefund = (row) => {
  ElMessageBox.prompt(
    '请输入退款原因',
    '申请退款',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '退款原因不能为空'
    }
  )
    .then(async ({ value: refundReason }) => {
      try {
        loading.value = true;
        const response = await refundOrder(row.id, refundReason);
        if (response.status) {
          ElMessage.success('退款申请成功');
          fetchOrders(); // 重新加载数据
        } else {
          ElMessage.error(response.message || '退款申请失败');
        }
      } catch (error) {
        console.error('退款申请出错:', error);
        ElMessage.error('退款申请出错');
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      ElMessage.info('已取消退款申请');
    });
};

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <el-card class="order-info-container">
    <template #header>
      <div class="header">
        <span>订单信息管理</span>
        <!-- 搜索和筛选区域 -->
        <div class="search-box">
          <el-select v-model="searchType" placeholder="搜索类型" style="width: 120px">
            <el-option label="电影名" value="movie"></el-option>
            <el-option label="用户ID" value="userId"></el-option>
          </el-select>
          
          <el-input
            v-model="searchQuery"
            placeholder="请输入搜索内容"
            clearable
            style="width: 300px; margin-left: 10px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
          
          <el-select 
            v-model="statusFilter" 
            placeholder="订单状态" 
            clearable 
            style="width: 120px; margin-left: 10px"
            @change="handleStatusFilterChange"
          >
            <el-option label="待支付" value="PENDING"></el-option>
            <el-option label="已支付" value="PAID"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
            <el-option label="已退款" value="REFUNDED"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
          </el-select>
        </div>
      </div>
    </template>
    
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
      stripe
      row-key="id"
      height="480"
    >
      <el-table-column type="expand">
        <template #default="props">
          <div class="expanded-row">
            <el-descriptions title="订单详情" :column="2" border>
              <el-descriptions-item label="订单号">{{ props.row.orderNumber }}</el-descriptions-item>
              <el-descriptions-item label="用户ID">{{ props.row.userId }}</el-descriptions-item>
              <el-descriptions-item label="总金额">¥{{ props.row.totalAmount.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="票数">{{ props.row.ticketCount }}</el-descriptions-item>
              <el-descriptions-item label="座位号">{{ props.row.seatNumbers }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(props.row.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="支付方式">
                {{ props.row.payment ? props.row.payment.paymentMethod : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="支付时间">
                {{ props.row.payment ? formatDateTime(props.row.payment.paymentTime) : '-' }}
              </el-descriptions-item>
            </el-descriptions>
            
            <div v-if="props.row.session" class="session-info">
              <h3>场次信息</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="电影名称">{{ props.row.session.movie.title }}</el-descriptions-item>
                <el-descriptions-item label="影厅">{{ props.row.session.hall.hallName }}</el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ formatDateTime(props.row.session.sessionTime) }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">{{ formatDateTime(props.row.session.endTime) }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="orderNumber" label="订单号" width="250" show-overflow-tooltip/>
      <el-table-column label="电影">
        <template #default="scope">
          {{ scope.row.session ? scope.row.session.movie.title : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="场次时间" width="200">
        <template #default="scope">
          {{ scope.row.session ? formatDateTime(scope.row.session.sessionTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" width="100">
        <template #default="scope">
          ¥{{ scope.row.totalAmount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ formatStatus(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="200">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button
              type="primary"
              size="small"
              @click="handleRefund(scope.row)"
              :disabled="scope.row.status !== 'PAID' && scope.row.status !== 'COMPLETED'"
            >
              退款
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<style scoped>
.order-info-container {
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

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.expanded-row {
  padding: 20px;
}

.session-info {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>