<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="text-dark"><i class="bi bi-journal-bookmark-fill me-2"></i>Danh sách Lớp học</h2>
      <button class="btn btn-success" @click="openEditModal(null)">Thêm lớp mới</button>
    </div>
    
    <div class="card shadow-sm">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
        <table v-else class="table table-hover">
          <thead>
            <tr>
  <th scope="col" class="text-center">Mã Lớp</th>
  <th scope="col" class="text-center">Tên Lớp</th>
  <th scope="col" class="text-center">Mô tả</th>
  <th scope="col" class="text-center">Lịch học</th>
  <th scope="col" class="text-center">Hành động</th>
</tr>
          </thead>
          <tbody>
            <tr v-for="cls in classesWithSchedules" :key="cls.id" style="cursor: pointer;">
              <td @click="openDetailModal(cls.id)">{{ cls.id }}</td>

              <td @click="openDetailModal(cls.id)">{{ cls.name }}</td>
              <td @click="openDetailModal(cls.id)">
                {{ cls.description || 'Không có mô tả' }}
              </td>
              <td>
                <table class="table table-sm table-borderless mb-0">
                  <thead>
                    <tr>
                      <th v-for="schedule in cls.schedules" :key="schedule.dayOfWeek" class="text-center">
                        {{ schedule.dayOfWeek }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="schedule in cls.schedules" :key="schedule.dayOfWeek" class="text-center">
                        {{ schedule.startTime }}-{{ schedule.endTime }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="!cls.schedules || cls.schedules.length === 0" class="text-muted mb-0">
                  Chưa có lịch học
                </p>
              </td>
              <td class="text-end">
                <button class="btn btn-primary btn-sm me-1" @click.stop="openDetailModal(cls.id)">
                  Xem
                </button>
                <button class="btn btn-warning btn-sm me-1" @click.stop="openEditModal(cls)">
                  Sửa
                </button>
                <button class="btn btn-danger btn-sm" @click.stop="confirmDeleteClass(cls.id)">
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Chi tiết Lớp học -->
    <div class="modal fade" :class="{ show: showDetailModal }" :style="{ display: showDetailModal ? 'block' : 'none' }" 
         tabindex="-1" role="dialog" aria-labelledby="detailModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="detailModalLabel">{{ classDetailData.classInfo?.name || 'Chi tiết lớp học' }}</h5>
            <button type="button" class="btn-close" @click="closeDetailModal" aria-label="Đóng"></button>
          </div>
          <div class="modal-body">
            <div v-if="detailLoading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </div>
            <div v-else-if="detailError" class="alert alert-danger" role="alert">{{ detailError }}</div>
            <div v-else-if="classDetailData.classInfo">
              <h6 class="text-muted">Mã lớp: {{ classDetailData.classInfo.id }}</h6>
              <p><strong>Mô tả:</strong> {{ classDetailData.classInfo.description || 'Không có mô tả' }}</p>
              <p v-if="classDetailData.teacher">
                <strong>Giáo viên phụ trách:</strong> {{ classDetailData.teacher.name }} ({{ classDetailData.teacher.id }})
              </p>
              <hr>
              <h4>Lịch học</h4>
              <table v-if="classDetailData.classInfo.schedules?.length > 0" class="table table-bordered">
                <thead>
                  <tr>
                    <th>Ngày trong tuần</th>
                    <th>Giờ bắt đầu</th>
                    <th>Giờ kết thúc</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="schedule in classDetailData.classInfo.schedules" :key="schedule.dayOfWeek">
                    <td>{{ schedule.dayOfWeek }}</td>
                    <td>{{ schedule.startTime }}</td>
                    <td>{{ schedule.endTime }}</td>
                    <td>{{ schedule.note || 'Không có ghi chú' }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="text-muted">Chưa có lịch học.</p>
              
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailModal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Thêm/Sửa Lớp -->
    <div class="modal fade" :class="{ show: showEditModal }" :style="{ display: showEditModal ? 'block' : 'none' }" 
         tabindex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editModalLabel">{{ isEditing ? 'Chỉnh sửa Lớp' : 'Thêm Lớp mới' }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal" aria-label="Đóng"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveClass">
              <div class="mb-3">
                <label for="classId" class="form-label">Mã Lớp</label>
                <input type="text" id="classId" class="form-control" v-model="classForm.id" 
                       :disabled="isEditing" required placeholder="Nhập mã lớp" />
              </div>
              <div class="mb-3">
                <label for="className" class="form-label">Tên Lớp</label>
                <input type="text" id="className" class="form-control" v-model="classForm.name" 
                       required placeholder="Nhập tên lớp" />
              </div>
              <div class="mb-3">
                <label for="classDescription" class="form-label">Mô tả</label>
                <textarea id="classDescription" class="form-control" v-model="classForm.description" 
                          placeholder="Nhập mô tả (tùy chọn)"></textarea>
              </div>
              <button type="submit" class="btn btn-primary w-100">
                {{ isEditing ? 'Cập nhật' : 'Thêm' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditModal || showDetailModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watchEffect } from 'vue';
import { collection, getDocs, query, doc, getDoc, where, deleteDoc, documentId } from 'firebase/firestore';
import { db } from '../main';
import { useFirestoreCrud } from '../composables/useFirestoreCrud';

const { items: classes, loading, error, fetchData: fetchClasses, addOrUpdateItem, deleteItem } = useFirestoreCrud('classes');
const classesWithSchedules = ref([]);


const showDetailModal = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const classDetailData = reactive({
  classInfo: null,
  teacher: null
});

const showEditModal = ref(false);
const isEditing = ref(false);
const classForm = reactive({
  id: '',
  name: '',
  description: ''
});

// Watch for changes in classes from the composable and fetch their schedules
watchEffect(async () => {
  if (classes.value.length > 0) {
    const tempClasses = JSON.parse(JSON.stringify(classes.value));
    const schedulePromises = tempClasses.map(async (cls) => {
      const qSchedule = query(collection(db, 'schedules'), where('classId', '==', cls.id));
      const scheduleSnapshot = await getDocs(qSchedule);
      const allSchedules = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Deduplicate schedules based on day and time
      const uniqueSchedules = [];
      const seen = new Set();
      for (const schedule of allSchedules) {
        const uniqueKey = `${schedule.dayOfWeek}-${schedule.startTime}-${schedule.endTime}`;
        if (!seen.has(uniqueKey)) {
          uniqueSchedules.push(schedule);
          seen.add(uniqueKey);
        }
      }
      cls.schedules = uniqueSchedules;
      return cls;
    });
    classesWithSchedules.value = await Promise.all(schedulePromises);
  } else {
    classesWithSchedules.value = [];
  }
});



async function openDetailModal(classId) {
  showDetailModal.value = true;
  detailLoading.value = true;
  resetDetailData();

  try {
    const classRef = doc(db, 'classes', classId);

    const classSnap = await getDoc(classRef);
    if (!classSnap.exists()) {
      throw new Error(`Không tìm thấy lớp học với ID: ${classId}`);
    }
    const data = classSnap.data();
    classDetailData.classInfo = { id: classSnap.id, ...data, schedules: [] };

    // Fetch schedules for the class
    const qSchedule = query(collection(db, 'schedules'), where('classId', '==', classId));
    const scheduleSnapshot = await getDocs(qSchedule);
    const allSchedules = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Deduplicate schedules based on day and time
    const uniqueSchedules = [];
    const seen = new Set();
    for (const schedule of allSchedules) {
      const uniqueKey = `${schedule.dayOfWeek}-${schedule.startTime}-${schedule.endTime}`;
      if (!seen.has(uniqueKey)) {
        uniqueSchedules.push(schedule);
        seen.add(uniqueKey);
      }
    }
    classDetailData.classInfo.schedules = uniqueSchedules;

    const teacherPromise = data.mainTeacherId ? getDoc(doc(db, 'teachers', data.mainTeacherId)) : Promise.resolve(null);

    

    const [teacherSnap] = await Promise.all([teacherPromise]);
    
    if (teacherSnap?.exists()) {
      classDetailData.teacher = { id: teacherSnap.id, ...teacherSnap.data() };
    }

  } catch (err) {
    console.error("Lỗi khi tải thông tin chi tiết lớp học:", err);
    detailError.value = "Không thể tải dữ liệu. Vui lòng thử lại.";
  } finally {
    detailLoading.value = false;
  }
}



function closeDetailModal() {
  showDetailModal.value = false;
  resetDetailData();
}

function resetDetailData() {
  classDetailData.classInfo = null;
  classDetailData.teacher = null;
  detailError.value = '';
}

function openEditModal(cls) {
  showEditModal.value = true;
  isEditing.value = !!cls;
  if (cls) {
    Object.assign(classForm, {
      id: cls.id,
      name: cls.name,
      description: cls.description || ''
    });
  } else {
    Object.assign(classForm, {
      id: '',
      name: '',
      description: ''
    });
  }
}

async function saveClass() {
  const classData = {
    id: classForm.id,
    name: classForm.name,
    description: classForm.description || ''
  };

  if (!isEditing.value) {
    classData.studentIds = [];
    classData.mainTeacherId = null;
  }

  // Use addOrUpdateItem from composable
  // Note: The composable's addOrUpdateItem doesn't support 'merge:true' out of the box.
  // The current implementation is fine for adding new or fully updating existing.
  const success = await addOrUpdateItem(classData, isEditing.value);
  
  if (success) {
    closeEditModal();
  }
  // Error is handled by the composable's `error` ref.
}


async function confirmDeleteClass(classId) {
  if (!confirm(`Bạn có chắc muốn xóa lớp ${classId}? Thao tác này cũng sẽ xóa tất cả lịch học liên quan.`)) return;
  
  try {
    // Delete associated schedules first
    const qSchedule = query(collection(db, 'schedules'), where('classId', '==', classId));
    const scheduleSnapshot = await getDocs(qSchedule);
    const deleteSchedulePromises = scheduleSnapshot.docs.map(scheduleDoc => deleteDoc(scheduleDoc.ref));
    await Promise.all(deleteSchedulePromises);

    // Then delete the class using the composable
    await deleteItem(classId);

  } catch (err) {
    console.error("Lỗi khi xóa lớp học hoặc lịch học liên quan:", err);
    // The composable will set its own error, but we can set a more specific one if needed.
    error.value = "Không thể xóa lớp học hoặc lịch học liên quan. Vui lòng thử lại.";
  }
}


function closeEditModal() {
  showEditModal.value = false;
  Object.assign(classForm, { id: '', name: '', description: '' });
}

onMounted(fetchClasses);
</script>

<style scoped>
.container-fluid {
  padding: 2rem;
}

.card {
  background-color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table {
  color: #212529;
}

.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}

.table-sm th, .table-sm td {
  padding: 0.3rem;
  font-size: 0.9rem;
}

.modal-content {
  border-radius: 0.5rem;
  background-color: #ffffff;
}

.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
}

.list-group-item {
  border-color: #dee2e6;
}

.btn-close {
  filter: none;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
}
</style>
