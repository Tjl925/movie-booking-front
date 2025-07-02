<template>
  <el-dialog
    :title="isEdit ? '编辑电影' : '添加电影'"
    v-model="dialogVisible"
    width="50%"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="电影名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入电影名称"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入电影描述"
        ></el-input>
      </el-form-item>
      <el-form-item label="导演" prop="director">
        <el-input v-model="form.director" placeholder="请输入导演姓名"></el-input>
      </el-form-item>
      <el-form-item label="主演" prop="actors">
        <el-input v-model="form.actors" placeholder="请输入主演姓名，多个演员用逗号分隔"></el-input>
      </el-form-item>
      <el-form-item label="类型" prop="genre">
        <el-input v-model="form.genre" placeholder="请输入电影类型，多个类型用逗号分隔"></el-input>
      </el-form-item>
      <el-form-item label="时长(分钟)" prop="durationMinutes">
        <el-input-number v-model="form.durationMinutes" :min="1" :max="999"></el-input-number>
      </el-form-item>
      <el-form-item label="语言" prop="language">
        <el-input v-model="form.language" placeholder="请输入电影语言"></el-input>
      </el-form-item>
      <el-form-item label="上映日期" prop="releaseDate">
        <el-date-picker
          v-model="form.releaseDate"
          type="date"
          placeholder="选择上映日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="下映日期" prop="endDate">
        <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="选择下映日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="国家/地区" prop="country">
        <el-input v-model="form.country" placeholder="请输入国家/地区"></el-input>
      </el-form-item>
      <el-form-item label="基础票价" prop="basePrice">
        <el-input-number v-model="form.basePrice" :min="0" :precision="2" :step="5" placeholder="请输入基础票价"></el-input-number>
      </el-form-item>
      <el-form-item label="海报" prop="posterUrl">
        <el-image
          v-if="form.posterUrl"
          :src="getUrl(form.posterUrl)"
          style="width: 150px; height: 200px"
        ></el-image>
        <el-upload
          class="avatar-uploader"
          action=""
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handlePosterChange"
          style="margin-left: 20px"
        >
          <el-button type="primary">选择新海报</el-button>
          <template #tip>
            <div class="el-upload__tip">支持 JPG/PNG 格式，大小不超过 2MB</div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {createMovie, updateMovie, uploadPoster} from '@/api/movie';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  movieData: {
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

const posterFile = ref(null);
const trailerFile = ref(null);

// 表单数据
const form = ref({});

// 监听props.visible变化，同步到dialogVisible
watch(() => props.visible, (newVal, oldVal) => {
  dialogVisible.value = newVal;
  if (newVal) {
    // 当对话框打开时，根据isEdit决定是否填充数据
    if (props.isEdit) {
      // 编辑模式：复制movieData到表单
      form.value = { ...props.movieData };
    } else {
      // 添加模式：重置表单为空
      form.value = {
        title: '',
        description: '',
        director: '',
        actors: '',
        genre: '',
        durationMinutes: 90,
        language: '',
        releaseDate: '',
        endDate: '',
        country: '',
        posterUrl: '',
        basePrice: 30.00
      };
    }
  } else if (oldVal && !newVal) {
    // 当对话框关闭时，清除文件引用
    if (posterFile.value) {
      URL.revokeObjectURL(posterFile.value);
      posterFile.value = null;
    }
  }
}, { immediate: true });

// 监听dialogVisible变化，同步回props.visible
watch(() => dialogVisible.value, (newVal) => {
  emit('update:visible', newVal);
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入电影名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  durationMinutes: [
    { required: true, message: '请输入电影时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '时长必须大于0', trigger: 'blur' }
  ],
  releaseDate: [
    { required: true, message: '请选择上映日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择下映日期', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        const releaseDate = form.value.releaseDate; // 注意这里改为 form.value
        if (!releaseDate || !value) {
          callback(); // 如果任一日期为空，跳过验证（由required规则处理）
          return;
        }
        if (new Date(value) <= new Date(releaseDate)) {
          callback(new Error('下映日期必须在上映日期之后'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  director: [
    { required: true, message: '请输入导演姓名', trigger: 'blur' }
  ],
  genre: [
    { required: true, message: '请输入电影类型', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback();
        // 检查是否包含非法分隔符
        if (/[\s、]/.test(value)) {
          return callback(new Error('请使用逗号(,)分隔多个类型'));
        }
        // 检查是否至少有一个逗号（如果有多个类型）
        if (value.includes(',') || value.includes('，')) {
          callback();
        } else {
          if (/[和与及]/.test(value)) {
            return callback(new Error('请使用逗号(,)分隔多个类型'));
          }
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  language: [
    { required: true, message: '请输入电影语言', trigger: 'blur' }
  ],
  country: [
    { required: true, message: '请输入国家/地区', trigger: 'blur' }
  ],
  basePrice: [
    { required: true, message: '请输入基础票价', trigger: 'blur' },
    { type: 'number', min: 0, message: '票价不能为负数', trigger: 'blur' }
  ]
};

const getUrl =(url)=>{
  return `http://127.0.0.1:8888/uploads${url}`;
}

const handlePosterChange = async (file) => {
  // 验证文件类型和大小
  const isJpgOrPng = file.raw.type === 'image/jpeg' || file.raw.type === 'image/png';
  const isLt2M = file.raw.size / 1024 / 1024 < 2;

  if (!isJpgOrPng) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!');
    return false;
  }

  try {
    // 先释放之前的URL
    if (posterFile.value) {
      URL.revokeObjectURL(posterFile.value);
    }
    posterFile.value = file.raw;

    // 立即上传图片到后端
    // 如果是编辑模式且有ID，使用ID上传；否则使用临时ID
    const movieId = props.isEdit && props.movieData.id ? props.movieData.id : 'temp';
    const uploadRes = await uploadPoster(movieId, posterFile.value);
    const posterUrl = uploadRes.data; // 假设返回的是海报URL字符串
    form.value.posterUrl = posterUrl; // 让用户立即看到新海报
    ElMessage.success('海报上传成功');
  } catch (error) {
    console.error('海报上传失败:', error);
    ElMessage.error('海报上传失败');
    return false;
  }
  return true;
};

// 表单引用
const formRef = ref(null);

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  emit('update:visible', false);
  // 重置表单
  if (formRef.value) {
    formRef.value.resetFields();
  }
  // 清除文件引用
  if (posterFile.value) {
    URL.revokeObjectURL(posterFile.value);
    posterFile.value = null;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // 准备提交的数据
        const movieData = { ...form.value };
        if (props.isEdit) {
          // 编辑模式
          await updateMovie(movieData.id, movieData);
          ElMessage.success('电影更新成功');
        } else {
          // 添加模式
          await createMovie(movieData);
          ElMessage.success('电影添加成功');
        }
        
        dialogVisible.value = false;
        emit('update:visible', false); // 更新父组件的visible属性
        emit('refresh'); // 通知父组件刷新数据
        
        // 重置表单
        formRef.value.resetFields();
        
        // 清除文件引用
        if (posterFile.value) {
          URL.revokeObjectURL(posterFile.value);
          posterFile.value = null;
        }
      } catch (error) {
        console.error('提交失败:', error);
        ElMessage.error('操作失败: ' + (error.message || '未知错误'));
      }
    } else {
      console.log('验证失败:', fields);
    }
  });
};
</script>

<style scoped>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 200px;
  text-align: center;
  line-height: 200px;
}

.el-upload__tip {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>