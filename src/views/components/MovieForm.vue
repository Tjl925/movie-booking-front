<template>
  <el-dialog
    :title="isEdit ? '编辑电影' : '添加电影'"
    v-model="dialogVisible"
    width="50%"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
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
        <el-input v-model="form.genre" placeholder="请输入电影类型，如动作、喜剧等"></el-input>
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
      <el-form-item label="海报" prop="posterUrl">
        <el-upload
          class="avatar-uploader"
          action="#"
          :http-request="uploadPoster"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
        >
          <img v-if="form.posterUrl" :src="form.posterUrl" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { createMovie, updateMovie, uploadPoster as uploadPosterApi } from '@/api/movie';

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
const formRef = ref(null);

// 表单数据
const form = reactive({
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
  posterUrl: ''
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入电影名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  durationInMinutes: [
    { required: true, message: '请输入电影时长', trigger: 'blur' },
    { type: 'number', min: 1, message: '时长必须大于0', trigger: 'blur' }
  ],
  releaseDate: [
    { required: true, message: '请选择上映日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择下映日期', trigger: 'change' }
  ],
};

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal && props.isEdit && props.movieData) {
    // 编辑模式，填充表单数据
    Object.keys(form).forEach(key => {
      if (props.movieData[key] !== undefined) {
        form[key] = props.movieData[key];
      }
    });
  } else if (newVal) {
    // 添加模式，重置表单
    resetForm();
  }
});

// 监听dialogVisible变化，同步到父组件
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal);
});

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.title = '';
  form.description = '';
  form.director = '';
  form.actors = '';
  form.genre = '';
  form.durationMinutes = 90;
  form.language = '';
  form.releaseDate = '';
  form.endDate = '';
  form.country = '';
  form.posterUrl = '';
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 上传海报前的验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg';
  const isPNG = file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG && !isPNG) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 上传海报
const uploadPoster = async (options) => {
  try {
    const response = await uploadPosterApi(options.file);
    form.posterUrl = response.data;
    ElMessage.success('上传成功');
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error('上传失败');
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // 准备提交的数据
        const movieData = { ...form };
        if (props.isEdit) {
          // 编辑模式
          await updateMovie(props.movieData.id, movieData);
          ElMessage.success('电影更新成功');
        } else {
          // 添加模式
          await createMovie(movieData);
          ElMessage.success('电影添加成功');
        }
        
        dialogVisible.value = false;
        resetForm();
        emit('refresh'); // 通知父组件刷新数据
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
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
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
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}
</style>