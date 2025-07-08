import { createRouter, createWebHistory } from "vue-router";
import adminRoutes from "./adminRoutes.js";
import publicRoutes from "./publicRoutes.js";
import { auth } from "../main.js"; // Giả sử bạn export auth từ main.js
import { onAuthStateChanged } from "firebase/auth";

const routes = [...publicRoutes, ...adminRoutes];

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser();
  if (!user && to.meta.requiresAuth) {
    next('/login');
  } else {
    next();
  }
});

export default router;
