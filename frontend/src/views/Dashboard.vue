<template>
  <div class="dashboard">
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="mb-3">📊 Thống kê tổng quan</h2>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col-md-3 mb-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h4 class="card-title">Tổng học sinh</h4>
                <h2 class="mb-0">{{ stats.totalStudents || 0 }}</h2>
              </div>
              <div class="align-self-center">
                <i class="fas fa-user-graduate fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h4 class="card-title">Tổng lớp học</h4>
                <h2 class="mb-0">{{ stats.totalClasses || 0 }}</h2>
              </div>
              <div class="align-self-center">
                <i class="fas fa-chalkboard-teacher fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h4 class="card-title">Điểm danh hôm nay</h4>
                <h2 class="mb-0">{{ stats.attendanceToday || 0 }}</h2>
              </div>
              <div class="align-self-center">
                <i class="fas fa-clipboard-check fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h4 class="card-title">Tổng giáo viên</h4>
                <h2 class="mb-0">{{ stats.totalTeachers || 0 }}</h2>
              </div>
              <div class="align-self-center">
                <i class="fas fa-user-tie fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">👨‍🎓 Học sinh mới nhất</h5>
          </div>
          <div class="card-body">
            <div v-if="recentStudents.length === 0" class="text-center text-muted">
              <p>Chưa có dữ liệu</p>
            </div>
            <div v-else class="list-group list-group-flush">
              <div v-for="student in recentStudents" :key="student.id" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">{{ student.name }}</h6>
                  <small class="text-muted">{{ student.class }}</small>
                </div>
                <span class="badge bg-primary rounded-pill">{{ student.gender }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">📅 Điểm danh gần đây</h5>
          </div>
          <div class="card-body">
            <div v-if="recentAttendance.length === 0" class="text-center text-muted">
              <p>Chưa có dữ liệu điểm danh thực tế.</p>
            </div>
            <div v-else class="list-group list-group-flush">
              <div v-for="attendance in recentAttendance" :key="attendance.id" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">{{ attendance.studentName }}</h6>
                  <small class="text-muted">{{ attendance.class }}</small>
                </div>
                <span :class="getAttendanceStatusClass(attendance.status)">
                  {{ attendance.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../main';
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const stats = ref({
  totalStudents: 0,
  totalClasses: 0,
  attendanceToday: 0,
  totalTeachers: 0
})
const recentStudents = ref([])
const recentAttendance = ref([])

function getVietnameseDayOfWeek() {
  const days = [
    "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", 
    "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
  ];
  const today = new Date().getDay();
  // Firestore data has inconsistent casing, so we handle it here.
  // e.g., "Thứ SáU", "Thứ BảY", "Chủ NhậT"
  switch (days[today]) {
    case "Thứ Sáu": return "Thứ SáU";
    case "Thứ Bảy": return "Thứ BảY";
    case "Chủ Nhật": return "Chủ NhậT";
    default: return days[today];
  }
}

const getAttendanceStatusClass = (status) => {
  switch (status) {
    case 'Có mặt':
      return 'badge bg-success rounded-pill'
    case 'Vắng mặt':
      return 'badge bg-danger rounded-pill'
    default:
      return 'badge bg-secondary rounded-pill'
  }
}

const fetchDashboardData = async () => {
  try {
    // 1. Lấy các thống kê tổng quan một cách hiệu quả
    const studentCountPromise = getCountFromServer(collection(db, 'students'));
    const classCountPromise = getCountFromServer(collection(db, 'classes'));
    const teacherCountPromise = getCountFromServer(collection(db, 'teachers'));

    // 2. Lấy số lịch học được xếp cho hôm nay
    const todayString = getVietnameseDayOfWeek();
    const attendanceQuery = query(collection(db, 'schedules'), where('dayOfWeek', '==', todayString));
    const attendanceCountPromise = getCountFromServer(attendanceQuery);

    // 3. Lấy danh sách học sinh gần đây (sắp xếp theo tên)
    const recentStudentsQuery = query(collection(db, 'students'),limit(5));
    const recentStudentsPromise = getDocs(recentStudentsQuery);

    // Thực thi tất cả các promise đồng thời
    const [studentSnap, classSnap, teacherSnap, attendanceSnap, studentsSnap] = await Promise.all([
      studentCountPromise, classCountPromise, teacherCountPromise, attendanceCountPromise, recentStudentsPromise
    ]);

    stats.value.totalStudents = studentSnap.data().count;
    stats.value.totalClasses = classSnap.data().count;
    stats.value.totalTeachers = teacherSnap.data().count;
    stats.value.attendanceToday = attendanceSnap.data().count;

    recentStudents.value = studentsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().fullName, class: doc.data().class,
      gender: doc.data().gender

     }));
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px 0;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.list-group-item {
  border: none;
  border-bottom: 1px solid #eee;
}

.list-group-item:last-child {
  border-bottom: none;
}
</style>
