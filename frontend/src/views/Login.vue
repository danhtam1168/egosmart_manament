<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-4">
        <div class="card">
          <div class="card-header bg-primary text-white">Đăng nhập</div>
          <div class="card-body">
            <form @submit.prevent="login">
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="email" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Mật khẩu</label>
                <input v-model="password" type="password" class="form-control" required />
              </div>
              <button class="btn btn-primary w-100" :disabled="loading">Đăng nhập</button>
            </form>
            <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
            <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../main';
import { signInWithEmailAndPassword } from 'firebase/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const router = useRouter();

async function login() {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    success.value = 'Đăng nhập thành công!';
    router.push('/admin');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
