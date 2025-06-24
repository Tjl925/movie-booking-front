<script setup>
import {login} from'@/api/user';
import {ref} from "vue";
import {register} from "@/api/user";
import {ElMessage} from "element-plus";


const dialogVisible=ref(false);
const showdialog=()=>{
  dialogVisible.value=true
}
const registerDTO=ref({
  username:"",
  password:"",
  confirmPassword:"",
  email:"",
  phone:""
})
const add=()=>{
  register(registerDTO.value).then(res => {
    if(res.status){
      ElMessage({
        message: '添加成功啦！',
        type: 'success',
        plain: true,
      })
      dialogVisible.value = false;
    }
    else{
      ElMessage({
        message: '遭得甩',
        type: 'warning',
        plain: true,
      })
    }
  })
}
const loginDTO=ref({
username: "",
  password: "",
})

const onSubmit = () => {
  const loginData = loginDTO.value;
  login(loginData).then(res=>{
    console.info(res);
    if(res.status){
      //跳转
      ElMessage({
        message: '登录成功啦！',
        type: 'success',
        plain: true,
      })
      router.push({path: '/user/list'});
    }
    else{
      ElMessage({
        message: '用户名密码错误',
        type: 'warning',
        plain: true,
      })
    }
  })
}

</script>

<template>
  <div>
    <el-form label-width="auto" style="max-width: 600px">
      <el-form-item label="用户名">
        <el-input v-model="loginDTO.username" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="loginDTO.password" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">登录</el-button>
        <el-button plain @click="showdialog">
         注册
        </el-button>

      </el-form-item>
    </el-form>

    <el-dialog
        v-model="dialogVisible"
        title="新建成员"
        width="500"
        :before-close="handleClose"
    >
      <el-form :model="registerDTO" label-width="auto" style="max-width: 600px">
        <el-form-item label="用户名">
          <el-input v-model="registerDTO.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerDTO.password" autocomplete="off" />
        </el-form-item>
        <el-form-item label="再次确认">
          <el-input v-model="registerDTO.confirmPassword" autocomplete="off" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="registerDTO.email" autocomplete="off" />
        </el-form-item>
        <el-form-item label="电话号码">
          <el-input v-model="registerDTO.phone" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="add">
            提交
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>

</style>
