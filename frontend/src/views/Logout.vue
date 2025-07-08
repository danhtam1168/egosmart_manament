<template>
  <div>Đang đăng xuất...</div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../main.js';

const router = useRouter();

onMounted(async () => {
  try {
    // Sign out the user using Firebase auth or clear session here
    await auth.signOut();
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
  } finally {
    // Redirect to login page after logout
    router.push('/login');
  }
});
</script>
