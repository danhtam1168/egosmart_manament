<template>
  <div class="student-schedule">
    <h2>Sắp lớp cho học sinh</h2>
    <p>Chọn một ô để gán học sinh vào lớp tương ứng.</p>
    
    <div v-if="loading" class="alert alert-info">Đang tải dữ liệu...</div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="!loading && !error">
      <div class="table-responsive">
        <table class="table table-bordered table-hover text-center">
          <thead>
            <tr>
              <th class="sticky-col">Học sinh</th>
              <th v-for="cls in classes" :key="cls.id">{{ cls.description }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="sticky-col">{{ student.fullName }}</td>
              <td v-for="cls in classes" :key="cls.id" @click="assignClass(student, cls.id)" :class="{ 'table-success': studentClass[student.id] === cls.id, 'clickable': true }">
                <i v-if="studentClass[student.id] === cls.id" class="bi bi-check-circle-fill"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button @click="saveChanges" class="btn btn-primary mt-3" :disabled="Object.keys(changes).length === 0">
        Lưu thay đổi
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../main.js';
import { useFirestoreCrud } from '../composables/useFirestoreCrud';

const { items: students, fetchData: fetchStudents } = useFirestoreCrud('students');
const { items: classes, fetchData: fetchClasses } = useFirestoreCrud('classes');
const { items: schedules, fetchData: fetchSchedules } = useFirestoreCrud('schedules');

const loading = ref(true);
const error = ref(null);
const changes = ref({});

// This will be our local, mutable state for UI binding
const studentClass = ref({});

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    await Promise.all([fetchStudents(), fetchClasses(), fetchSchedules()]);

    // Populate the local state from schedules
    schedules.value.forEach(schedule => {
      studentClass.value[schedule.studentId] = schedule.classId;
    });

    students.value.sort((a, b) => a.fullName.localeCompare(b.fullName));
    classes.value.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error("Failed to fetch data:", e);
    error.value = "Không thể tải dữ liệu. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
});

const assignClass = (student, classId) => {
  if (studentClass.value[student.id] !== classId) {
    studentClass.value[student.id] = classId; // Update local state for UI
    changes.value[student.id] = classId; // Track the change for saving
  }
};

const saveChanges = async () => {
  if (Object.keys(changes.value).length === 0) {
    alert("Không có thay đổi nào để lưu.");
    return;
  }

  if (!confirm(`Bạn có chắc muốn lưu thay đổi cho ${Object.keys(changes.value).length} học sinh?`)) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const batch = writeBatch(db);
    const studentIds = Object.keys(changes.value);

    const schedulesQuery = query(collection(db, 'schedules'), where('studentId', 'in', studentIds));
    const schedulesSnapshot = await getDocs(schedulesQuery);
    
    const studentScheduleDocIds = {};
    const existingSchedules = {};
    
    schedulesSnapshot.forEach(doc => {
      const data = doc.data();
      studentScheduleDocIds[data.studentId] = doc.id;
      existingSchedules[data.studentId] = data;
    });

    for (const studentId of studentIds) {
      const newClassId = changes.value[studentId];
      const scheduleDocId = studentScheduleDocIds[studentId];
      const newClassDetails = classes.value.find(c => c.id === newClassId);
      const existingSchedule = existingSchedules[studentId] || {};

      if (!newClassDetails) {
          console.error(`Could not find details for classId: ${newClassId}`);
          alert(`Không tìm thấy thông tin chi tiết cho lớp ${newClassId}. Bỏ qua học sinh ${studentId}.`);
          continue; 
      }

      // Chỉ cập nhật những trường có giá trị mới, giữ nguyên giá trị cũ cho những trường null/undefined
      const scheduleData = {
        studentId: studentId,
        classId: newClassId,
        dayOfWeek: newClassDetails.dayOfWeek || existingSchedule.dayOfWeek || "Chưa có",
        startTime: newClassDetails.startTime || existingSchedule.startTime || "Chưa có",
        endTime: newClassDetails.endTime || existingSchedule.endTime || "Chưa có",
        teacherId: newClassDetails.teacherId || existingSchedule.teacherId || "Chưa có",
        note: newClassDetails.note !== undefined ? newClassDetails.note : (existingSchedule.note || "")
      };

      if (scheduleDocId) {
        const scheduleRef = doc(db, 'schedules', scheduleDocId);
        batch.update(scheduleRef, scheduleData);
      } else {
        const newScheduleRef = doc(collection(db, 'schedules'));
        batch.set(newScheduleRef, scheduleData);
      }
    }

    await batch.commit();
    alert("Cập nhật lớp cho học sinh thành công!");
    changes.value = {};
    
    // Refetch schedules to ensure UI consistency after save
    await fetchSchedules();
    studentClass.value = {};
    schedules.value.forEach(schedule => {
      studentClass.value[schedule.studentId] = schedule.classId;
    });

  } catch (e) {
    console.error("Lỗi khi lưu thay đổi:", e);
    error.value = "Đã xảy ra lỗi khi lưu thay đổi. Vui lòng thử lại.";
    alert(error.value);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.student-schedule {
  padding: 20px;
}
.table-responsive {
  max-height: 70vh;
  overflow: auto;
}
th, td {
  vertical-align: middle;
}
.sticky-col {
  position: sticky;
  left: 0;
  background-color: #f8f9fa;
  z-index: 2;
  border-right: 2px solid #dee2e6;
}
thead th {
  position: sticky;
  top: 0;
  background-color: #e9ecef;
  z-index: 3;
}
.clickable {
  cursor: pointer;
}
.clickable:hover {
  background-color: #e9f5ff;
}
.table-success {
  background-color: #d1e7dd !important;
  font-weight: bold;
}
.bi-check-circle-fill {
  color: green;
  font-size: 1.2rem;
}
</style>
