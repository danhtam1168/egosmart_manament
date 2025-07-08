<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header bg-success text-white">Đăng ký người dùng mới</div>
          <div class="card-body">
            <form @submit.prevent="register">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email</label>
                  <input v-model="email" class="form-control" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Mật khẩu</label>
                  <input v-model="password" type="password" class="form-control" required />
                </div>
              </div>
              <button class="btn btn-success w-100" :disabled="loading">Đăng ký</button>
            </form>
            <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
            <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '../main';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const router = useRouter();

async function register() {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    success.value = 'Đăng ký thành công!';
    router.push('/login');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
