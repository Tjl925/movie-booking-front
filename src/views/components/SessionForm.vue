<template>
  <el-dialog
      :title="isEdit ? '编辑场次' : '添加场次'"
      v-model="dialogVisible"
      width="90%"
      top="5vh"
      class="combined-dialog"
      @close="handleClose"
  >
    <!-- 一周场次表 -->
    <div class="week-schedule-section">
      <h3 class="section-title">一周场次安排</h3>
      <div class="week-schedule-container">
        <div class="week-header">
          <div
              v-for="date in weekDays"
              :key="date"
              class="day-header"
          >
            <div class="weekday">{{ getWeekDay(date) }}</div>
            <div class="date">{{ date }}</div>
          </div>
        </div>

        <div class="week-content">
          <div
              v-for="date in weekDays"
              :key="date + 'content'"
              class="day-column"
          >
            <div
                v-for="session in groupSessionsByDate[date]"
                :key="session.id"
                class="session-card"
                :class="{ 'current-session': session.id === form.id }"
            >
              <div class="session-time">
                {{ formatDateTime(session.sessionTime).split(' ')[1] }} -
                {{ formatDateTime(session.endTime).split(' ')[1] }}
              </div>
              <div class="session-movie">
                {{ session.movie?.title || '未知电影' }}
              </div>
              <div class="session-hall">
                {{ session.hall?.hallName || '未知影厅' }}
              </div>
            </div>
            <div v-if="!groupSessionsByDate[date]?.length" class="no-session">
              暂无场次
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改表单 -->
    <div class="edit-form-section">
      <h3 class="section-title">{{ isEdit ? '编辑场次信息' : '添加新场次' }}</h3>
      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          label-position="right"
          :inline="true"
      >
        <el-form-item label="电影" prop="movieId">
          <el-input v-model="form.movieTitle" disabled />
        </el-form-item>

        <el-form-item label="影厅" prop="hallId">
          <el-select
              v-model="form.hallId"
              placeholder="请选择影厅"
              style="width: 150px"
              @change="checkConflict"
          >
            <el-option
                v-for="hall in hallList"
                :key="hall.id"
                :label="`${hall.hallName} (${getHallTypeText(hall.hallType)})`"
                :value="hall.id"
                :disabled="hall.status !== 'ACTIVE'"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ hall.hallName }}</span>
                <el-tag size="small" :type="hall.status === 'ACTIVE' ? 'success' : 'danger'">
                  {{ hall.status === 'ACTIVE' ? '可用' : '不可用' }}
                </el-tag>
              </div>
              <div style="font-size: 12px; color: #999">
                {{ getHallTypeText(hall.hallType) }} | {{ hall.totalSeats }}座位
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="开始时间" prop="sessionTime">
          <el-date-picker
              v-model="form.sessionTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledDate"
              style="width: 100%"
              @change="calculateEndTime"
          />
        </el-form-item>

        <el-form-item label="结束时间">
          <el-input v-model="endTimeDisplay" disabled />
          <div class="tip-text" v-if="form.sessionTime && movieData">
            结束时间自动计算：开始时间 + {{ movieData.durationMinutes }}分钟
          </div>
        </el-form-item>

        <el-form-item v-if="conflictMessage" class="conflict-message">
          <el-alert
              :title="conflictMessage"
              type="error"
              :closable="false"
              show-icon
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm" :disabled="!!conflictMessage">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {ElMessage} from 'element-plus';
import {getActiveHalls} from '@/api/hall';
import {checkSessionConflict, createSession, updateSession, getSessionList} from '@/api/session';
import dayjs from 'dayjs';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  movieData: {
    type: Object,
    default: () => ({})
  },
  sessionData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'refresh']);

const dialogVisible = ref(false);
const formRef = ref(null);
const hallList = ref([]);
const conflictMessage = ref('');

const form = reactive({
  id: '',
  movieId: '',
  movieTitle: '',
  hallId: '',
  sessionTime: '',
});

const rules = {
  hallId: [
    { required: true, message: '请选择影厅', trigger: 'change' }
  ],
  sessionTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ]
};

// 计算结束时间
const endTimeDisplay = computed(() => {
  if (!form.sessionTime || !props.movieData.durationMinutes) {
    return '';
  }

  const startTime = dayjs(form.sessionTime);
  const endTime = startTime.add(props.movieData.durationMinutes, 'minute');
  return endTime.format('YYYY-MM-DD HH:mm:ss');
});

// 计算结束时间（用于提交表单）
const calculateEndTime = () => {
  if (!form.sessionTime || !props.movieData.durationMinutes) {
    return '';
  }
  checkConflict();
};

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7;
};

// 获取影厅类型文本
const getHallTypeText = (type) => {
  const typeMap = {
    'REGULAR': '普通厅',
    'VIP': 'VIP厅',
    'IMAX': 'IMAX厅',
    'DOLBY': '杜比厅'
  };
  return typeMap[type] || type;
};

// 检查时间冲突
const checkConflict = async () => {
  conflictMessage.value = '';

  if (!form.hallId || !form.sessionTime || !props.movieData.durationMinutes) {
    return;
  }

  const startTime = dayjs(form.sessionTime).format('YYYY-MM-DD HH:mm:ss');
  const endTime = dayjs(form.sessionTime).add(props.movieData.durationMinutes, 'minute').format('YYYY-MM-DD HH:mm:ss');

  if(endTime >= props.movieData.endDate || startTime <= props.movieData.releaseDate) {
    conflictMessage.value = "时间冲突：场次不在电影上映期间";
    return;
  }

  try {
    const excludeSessionId = props.isEdit ? props.sessionData.id : null;
    const { data } = await checkSessionConflict(form.hallId, startTime, endTime, excludeSessionId);

    if (data.conflict) {
      conflictMessage.value = `时间冲突：该影厅在所选时间段内已有其他场次安排 (${data.conflictSession.movieTitle} ${dayjs(data.conflictSession.sessionTime).format('HH:mm')}~${dayjs(data.conflictSession.endTime).format('HH:mm')})`;
    }
  } catch (error) {
    console.error('检查冲突失败:', error);
    ElMessage.error('检查时间冲突失败');
  }
};

// 获取影厅列表
const fetchHallList = async () => {
  try {
    const { data } = await getActiveHalls();
    hallList.value = data;
  } catch (error) {
    console.error('获取影厅列表失败:', error);
    ElMessage.error('获取影厅列表失败');
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (conflictMessage.value) {
        ElMessage.warning('存在时间冲突，请调整时间');
        return;
      }

      const sessionData = {
        movieId: form.movieId,
        hallId: form.hallId,
        sessionTime: dayjs(form.sessionTime).format('YYYY-MM-DD HH:mm:ss')
      };

      try {
        if (props.isEdit) {
          await updateSession(form.id, sessionData);
          ElMessage.success('场次更新成功');
        } else {
          await createSession(sessionData);
          ElMessage.success('场次添加成功');
        }

        handleClose();
        emit('refresh');
      } catch (error) {
        console.error('保存场次失败:', error);
        ElMessage.error('保存场次失败');
      }
    }
  });
};

// 初始化表单
const initForm = () => {
  form.id = props.sessionData?.id || '';
  form.movieId = props.movieData.id || '';
  form.movieTitle = props.movieData.title || '';

  if (props.isEdit && props.sessionData) {
    form.hallId = props.sessionData.hallId;
    form.sessionTime = props.sessionData.sessionTime;
  } else {
    form.hallId = '';
    form.sessionTime = '';
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  emit('update:visible', false);
  formRef.value?.resetFields();
  conflictMessage.value = '';
};

// 一周场次相关数据
const weekScheduleData = ref([]);
const weekDays = ref([]);

// 获取近一周的日期
const getWeekDates = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(dayjs(date).format('YYYY-MM-DD'));
  }
  return days;
};

// 获取一周场次数据
const fetchWeekSessions = async () => {
  try {
    const params = {
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(6, 'day').format('YYYY-MM-DD'),
      size: 1000
    };

    const { data } = await getSessionList(params);
    weekScheduleData.value = data.records || [];
    weekDays.value = getWeekDates();
  } catch (error) {
    console.error('获取一周场次失败:', error);
    ElMessage.error('获取一周场次失败: ' + (error.message || '未知错误'));
  }
};

// 按日期分组场次
const groupSessionsByDate = computed(() => {
  const grouped = {};
  weekDays.value.forEach(date => {
    grouped[date] = [];
  });

  weekScheduleData.value.forEach(session => {
    const date = dayjs(session.sessionTime).format('YYYY-MM-DD');
    if (grouped[date]) {
      grouped[date].push(session);
    }
  });

  // 按时间排序
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) =>
        new Date(a.sessionTime) - new Date(b.sessionTime)
    );
  });

  return grouped;
});

// 获取星期几
const getWeekDay = (date) => {
  const weekDayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const day = dayjs(date).day();
  return weekDayMap[day];
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm');
};

// 监听visible变化
watch(
    () => props.visible,
    (newVal) => {
      dialogVisible.value = newVal;
      if (newVal) {
        initForm();
        fetchHallList();
        fetchWeekSessions();
      }
    }
);

onMounted(() => {
  dialogVisible.value = props.visible;
  if (props.visible) {
    initForm();
    fetchHallList();
    fetchWeekSessions();
  }
});
</script>

<style scoped>
.combined-dialog {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.section-title {
  margin-bottom: 15px;
  color: #606266;
  font-size: 16px;
  font-weight: bold;
}

.week-schedule-section {
  margin-bottom: 10px;
}

.week-schedule-container {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.week-header {
  display: flex;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  z-index: 1;
}

.day-header {
  flex: 1;
  min-width: 0;
  padding: 12px;
  text-align: center;
  border-right: 1px solid #ebeef5;
}

.day-header:last-child {
  border-right: none;
}

.weekday {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.date {
  font-size: 12px;
  color: #909399;
}

.week-content {
  display: flex;
  height: calc(100% - 45px);
}

.day-column {
  flex: 1;
  min-width: 0;
  padding: 8px;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
}

.day-column:last-child {
  border-right: none;
}

.session-card {
  background-color: #f8f8f8;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.session-card:hover {
  background-color: #eef7ff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.current-session {
  border: 2px solid #409eff;
  background-color: #e6f7ff;
}

.session-time {
  font-weight: bold;
  color: #409eff;
  font-size: 13px;
  margin-bottom: 4px;
}

.session-movie {
  font-size: 13px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-hall {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.no-session {
  color: #c0c4cc;
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
}

.edit-form-section {
  margin-top: 20px;
}

.conflict-message {
  margin-top: 15px;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>