<template>
  <el-dialog
    :title="isEdit ? '编辑场次' : '添加场次'"
    v-model="dialogVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="电影" prop="movieId">
        <el-input v-model="form.movieTitle" disabled />
      </el-form-item>
      
      <el-form-item label="影厅" prop="hallId">
        <el-select
          v-model="form.hallId"
          placeholder="请选择影厅"
          style="width: 100%"
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
import {checkSessionConflict, createSession, updateSession} from '@/api/session';
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
  return time.getTime() < Date.now() - 8.64e7; // 禁用今天之前的日期
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
  if(endTime>=props.movieData.endDate||startTime<=props.movieData.releaseDate)
  {
    conflictMessage.value = "时间冲突：场次不在电影上映期间"
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
      
      const startTime = dayjs(form.sessionTime);
      const endTime = startTime.add(props.movieData.durationMinutes, 'minute').format('YYYY-MM-DD HH:mm:ss');
      
      const sessionData = {
        movieId: form.movieId,
        hallId: form.hallId,
        sessionTime: dayjs(form.sessionTime).format('YYYY-MM-DD HH:mm:ss')
      };
      
      try {
        if (props.isEdit) {
          console.log(props.sessionData.id)
          await updateSession(props.sessionData.id,sessionData);
          ElMessage.success('场次更新成功');
        } else {
          await createSession(sessionData);
          ElMessage.success('场次添加成功');
        }
        
        handleClose();
        emit('refresh');
      } catch (error) {
        console.error('保存场次失败:', error);
      }
    }
  });
};

// 初始化表单
const initForm = () => {
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

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal;
    if (newVal) {
      initForm();
      fetchHallList();
    }
  }
);

onMounted(() => {
  dialogVisible.value = props.visible;
  if (props.visible) {
    initForm();
    fetchHallList();
  }
});
</script>

<style scoped>
.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.conflict-message {
  margin-top: 15px;
}
</style>