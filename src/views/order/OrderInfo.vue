<script setup>
import { ref, onMounted } from 'vue';
import {getAllOrders, deleteOrder, getByOrderId, getBySeatId} from '@/api/orders';
import { ElMessage, ElMessageBox } from 'element-plus';

// 表格数据
const tableData = ref([]);
// 加载状态
const loading = ref(false);
// 分页参数
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 获取所有订单
const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await getAllOrders(pagination.value.currentPage, pagination.value.pageSize);
    if (response.status) {
      console.log('获取订单列表成功:', response.data.records);
      // 先处理所有订单的异步orderNumber获取
      const ordersWithOrderNumber = await Promise.all(
          response.data.records.map(async order => {
            const seatIds = (order.orderItems || [])
                .map(item => item.seatId);
            const seats = await Promise.all(
                seatIds.map(id => getBySeatId(id).then(r => r.data))
            );
            const seatNumbers = seats
                .map(item => item && item.seatRow && item.seatColumn ? `${item.seatRow}排${item.seatColumn}座` : '')
                .filter(Boolean)
                .join('，');
            console.log('处理订单座位号:', seatNumbers);
            return {
              ...order,
              seatNumbers
            };
          })
      );
      tableData.value = ordersWithOrderNumber;
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
  fetchOrders();
};

const handleSizeChange = (val) => {
  pagination.value.pageSize = val;
  fetchOrders();
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
  });
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

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="order-info-container">
    <h2>订单信息管理</h2>
    
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
      stripe
      row-key="id"
      height="500"
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
      <el-table-column label="操作" fixed="right" width="100">
        <template #default="scope">
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
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
  </div>
</template>

<style scoped>
.order-info-container {
  padding: 20px;
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
</style>