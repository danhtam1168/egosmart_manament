<template>
  <div class="student-management">
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center">
        <h2 class="mb-0">👨‍🎓 Quản lý Học sinh</h2>
        <button class="btn btn-primary" @click="showAddModal = true">
          <i class="bi bi-plus"></i> Thêm học sinh mới
        </button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Tìm kiếm học sinh..." v-model="searchTerm"
            @input="filterStudents">
          <button class="btn btn-outline-secondary" type="button">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="filterClass" @change="filterStudents">
          <option value="">Tất cả lớp</option>
          <option v-for="classItem in classes" :key="classItem" :value="classItem">
            {{ classItem }}
          </option>
        </select>
      </div>
      <div class="col-md-3">
        <select class="form-select" v-model="filterStatus" @change="filterStudents">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>
    </div>

    <!-- Students Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading && !students.length" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-else>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Ngày sinh</th>
                  <th>Lớp</th>
                  <th>Trạng thái</th>
                  <th>Gia đình (Anh/Chị/Em)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedStudents.length === 0">
                  <td colspan="7" class="text-center">Không có dữ liệu.</td>
                </tr>
                <tr v-for="student in paginatedStudents" :key="student.id" @click="openStudentDetailModal(student)" style="cursor: pointer;">
                  <td>{{ student.id }}</td>
                  <td>{{ student.fullName }}</td>

                  <td>{{ student.birthDate ? new Date(student.birthDate).toLocaleDateString() : '' }}</td>
                  <td>{{ student.class }}</td>
                  <td>
                    <span :class="getStatusClass(student.status)">
                      {{ getStatusText(student.status) }}
                    </span>
                  </td>
                  <td>{{ student.siblings || 'Không có' }}</td>
                  <td>
                    <div class="btn-group" role="group">
                      <button class="btn btn-sm btn-outline-primary" @click="editStudent(student)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteStudent(student.id)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <nav v-if="totalPages > 1" class="mt-4">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Trước</a>
              </li>
              <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Sau</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>


    <!-- Add/Edit Modal -->
    <div class="modal fade" :class="{ show: showAddModal || showEditModal }"
      :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveStudent">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Họ tên *</label>
                  <input type="text" class="form-control" v-model="studentForm.fullName" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Ngày sinh *</label>
                  <input type="date" class="form-control" v-model="studentForm.birthDate" required>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Lớp *</label>
                  <input type="text" class="form-control" v-model="studentForm.class" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Trạng thái *</label>
                  <select class="form-select" v-model="studentForm.status" required>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 mb-3">
                  <label class="form-label">Mã gia đình (Family ID)</label>
                  <input type="text" class="form-control" v-model="studentForm.familyId" placeholder="Dùng để nhóm anh/chị/em">
                </div>
              </div>

            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="loading">Hủy</button>
            <button type="button" class="btn btn-primary" @click="saveStudent" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm') }}
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showAddModal || showEditModal || showDetailModal" class="modal-backdrop fade show"></div>

    <!-- Student Detail Modal -->
    <div class="modal fade" :class="{ show: showDetailModal }" :style="{ display: showDetailModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Chi tiết học sinh: {{ studentDetailData.student?.fullName }}</h5>
            <button type="button" class="btn-close" @click="closeDetailModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="detailLoading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </div>
            <div v-else>
              <h6>Thông tin cơ bản</h6>
              <ul>
                <li><strong>Mã HS:</strong> {{ studentDetailData.student?.id }}</li>
                <li><strong>Ngày sinh:</strong> {{ studentDetailData.student?.birthDate }}</li>
                <li><strong>Trạng thái:</strong> {{ getStatusText(studentDetailData.student?.status) }}</li>
              </ul>
              <hr>
              <h6>Thông tin lớp học</h6>
              <div v-if="studentDetailData.classInfo">
                <ul>
                  <li><strong>Lớp:</strong> {{ studentDetailData.classInfo.name }} ({{ studentDetailData.classInfo.id }})</li>
                  <li><strong>Giáo viên phụ trách:</strong> {{ studentDetailData.teacherName || 'Chưa có' }}</li>
                </ul>
                <h6>Lịch học</h6>
                <table v-if="studentDetailData.schedules.length > 0" class="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Thứ</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="schedule in studentDetailData.schedules" :key="schedule.id">
                      <td>{{ schedule.dayOfWeek }}</td>
                      <td>{{ schedule.startTime }} - {{ schedule.endTime }}</td>
                    </tr>
                  </tbody>
                </table>
                <p v-else>Chưa có lịch học cho lớp này.</p>
              </div>
              <p v-else>Học sinh chưa được xếp lớp.</p>
              <hr>

              <h6>Học phí</h6>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Chọn tháng</label>
                  <select v-model="selectedMonth" @change="recalculateTuition" class="form-select">
                    <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Chọn năm</label>
                   <select v-model="selectedYear" @change="recalculateTuition" class="form-select">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                  </select>
                </div>
              </div>
              <div v-if="studentDetailData.tuition">
                 <ul>
                  <li v-if="studentDetailData.tuition.isEstimate" class="text-muted small">Đây là học phí ước tính.</li>
                  <li v-else class="text-success small">Học phí đã được ghi nhận.</li>
                  <li><strong>Học phí / buổi:</strong> {{ studentDetailData.tuition.feeSession.toLocaleString() }} VND</li>
                  <li><strong>Giảm giá / tháng:</strong> {{ studentDetailData.tuition.feeDiscountMonth.toLocaleString() }} VND</li>
                  <li><strong>Số buổi học trong tháng:</strong> {{ studentDetailData.tuition.sessionsInMonth }}</li>
                  <li class="fs-5"><strong>Tổng cộng:</strong> <strong>{{ studentDetailData.tuition.total.toLocaleString() }} VND</strong></li>
                </ul>
              </div>
              <p v-else>Không có dữ liệu học phí cho tháng đã chọn.</p>

            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailModal">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect, reactive } from 'vue'
import { useFirestoreCrud } from '../composables/useFirestoreCrud'
import { db } from '../main.js'
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore'

const { items: students, loading, error, fetchData: fetchStudents, addOrUpdateItem, deleteItem } = useFirestoreCrud('students')

const processedStudents = ref([])

const searchTerm = ref('')
const filterClass = ref('')
const filterStatus = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const isEditing = ref(false)
const showDetailModal = ref(false)
const detailLoading = ref(false)

const currentPage = ref(1)
const itemsPerPage = ref(10)

const studentDetailData = reactive({
  student: null,
  classInfo: null,
  teacherName: '',
  schedules: [],
  tuition: null
})


const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
});


const studentForm = ref({


  id: null,
  fullName: '',
  birthDate: '',
  class: '',
  status: 'active',
  familyId: ''
})

// Lấy danh sách lớp duy nhất từ students (raw data)
const classes = computed(() => {
  const set = new Set(students.value.map(s => s.class).filter(Boolean));
  return Array.from(set).sort();
});

// Xử lý dữ liệu thô từ composable để thêm trường `siblings`
watchEffect(() => {
  const allStudents = students.value
  const familyMap = {}
  allStudents.forEach(student => {
    if (student.familyId) {
      if (!familyMap[student.familyId]) {
        familyMap[student.familyId] = []
      }
      familyMap[student.familyId].push(student)
    }
  })

  processedStudents.value = allStudents.map(student => {
    if (student.familyId && familyMap[student.familyId]) {
      const siblings = familyMap[student.familyId]
        .filter(sib => sib.id !== student.id)
        .map(sib => sib.fullName || sib.id)
      return { ...student, siblings: siblings.length > 0 ? siblings.join(', ') : 'Không có' }
    } else {
      return { ...student, siblings: 'Không có' }
    }
  })
})

const filteredStudents = computed(() => {
  let filtered = processedStudents.value

  if (searchTerm.value) {
    filtered = filtered.filter(student =>
      (student.fullName && student.fullName.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (student.id && student.id.toLowerCase().includes(searchTerm.value.toLowerCase()))
    )
  }

  if (filterClass.value) {
    filtered = filtered.filter(student => student.class === filterClass.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(student => student.status === filterStatus.value)
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredStudents.value.slice(start, start + itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const getStatusClass = (status) => {
  switch (status) {
    case 'active':
      return 'badge bg-success'
    case 'inactive':
      return 'badge bg-danger'
    default:
      return 'badge bg-secondary'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'active':
      return 'Hoạt động'
    case 'inactive':
      return 'Không hoạt động'
    default:
      return 'Không xác định'
  }
}

const filterStudents = () => {
  currentPage.value = 1
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const editStudent = (student) => {
  // Make sure to get the raw student data without the 'siblings' field if it's not in the form
  const { siblings, ...studentData } = student
  studentForm.value = { ...studentData }
  isEditing.value = true
  showEditModal.value = true
}


const deleteStudent = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
    await deleteItem(id)
  }
}


const saveStudent = async () => {
  const studentData = { ...studentForm.value }
  // Ensure we don't save empty strings for optional fields if Firestore expects them to be absent
  if (!studentData.familyId) {
    delete studentData.familyId
  }

  const success = await addOrUpdateItem(studentData, isEditing.value)
  if (success) {
    closeModal()
  }
}


const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  isEditing.value = false
  studentForm.value = {
    id: null,
    fullName: '',
    birthDate: '',
    class: '',
    status: 'active',
    familyId: ''
  }
}

// --- Detail Modal Logic ---
const closeDetailModal = () => {
  showDetailModal.value = false
  Object.assign(studentDetailData, {
    student: null,
    classInfo: null,
    teacherName: '',
    schedules: [],
    tuition: null
  })
}

const countWeekdaysInMonth = (weekday, year, month) => {
  const dayMap = { 'Chủ Nhật': 0, 'Thứ Hai': 1, 'Thứ Ba': 2, 'Thứ Tư': 3, 'Thứ Năm': 4, 'Thứ Sáu': 5, 'Thứ Bảy': 6 }
  const targetDay = dayMap[weekday]
  if (targetDay === undefined) return 0

  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() === targetDay) {
      count++
    }
  }
  return count
}

const calculateAndSetTuition = async (student, classInfo, schedules, year, month) => {
  studentDetailData.tuition = null // Reset before calculation

  if (!classInfo || !student) return

  // Step 1: Check for existing tuition data in 'tuition' collection
  const tuitionDocId = `${classInfo.id}_${year}_${month}`
  const tuitionRef = doc(db, 'tuition', tuitionDocId)
  const tuitionSnap = await getDoc(tuitionRef)

  if (tuitionSnap.exists()) {
    const tuitionData = tuitionSnap.data()
    if (tuitionData.feePerStudent && tuitionData.feePerStudent[student.id] !== undefined) {
      // Found pre-calculated data
      studentDetailData.tuition = {
        feeSession: student.feeSession || 0, // Still show these for context
        feeDiscountMonth: student.feeDiscountMonth || 0,
        sessionsInMonth: 'N/A', // Not applicable for pre-calculated
        total: tuitionData.feePerStudent[student.id],
        isEstimate: false
      }
      return
    }
  }

  // Step 2: Calculate on-the-fly if no data exists
  const feeSession = student.feeSession || 0
  const feeDiscountMonth = student.feeDiscountMonth || 0

  if (feeSession > 0 && schedules.length > 0) {
    let sessionsInMonth = 0
    for (const s of schedules) {
      sessionsInMonth += countWeekdaysInMonth(s.dayOfWeek, year, month)
    }

    studentDetailData.tuition = {
      feeSession,
      feeDiscountMonth,
      sessionsInMonth,
      total: (feeSession * sessionsInMonth) - feeDiscountMonth,
      isEstimate: true
    }
  }
}

const recalculateTuition = () => {
  if (studentDetailData.student && studentDetailData.classInfo) {
    calculateAndSetTuition(
      studentDetailData.student,
      studentDetailData.classInfo,
      studentDetailData.schedules,
      selectedYear.value,
      selectedMonth.value
    )
  }
}

const openStudentDetailModal = async (student) => {
  showDetailModal.value = true
  detailLoading.value = true
  studentDetailData.student = student

  // Reset month/year to current
  selectedMonth.value = new Date().getMonth() + 1
  selectedYear.value = new Date().getFullYear()

  try {
    // Find the class the student belongs to from the schedules collection
    const scheduleQuery = query(collection(db, 'schedules'), where('studentId', '==', student.id))
    const scheduleSnap = await getDocs(scheduleQuery)

    let studentClassId = null;
    if (!scheduleSnap.empty) {
      // Assuming a student has only one active schedule for simplicity in this view
      studentClassId = scheduleSnap.docs[0].data().classId;
    }

    if (studentClassId) {
      const classRef = doc(db, 'classes', studentClassId)
      const classSnap = await getDoc(classRef)
      if (classSnap.exists()) {
        const studentClass = { id: classSnap.id, ...classSnap.data() }
        studentDetailData.classInfo = studentClass

        // Fetch teacher info
        if (studentClass.mainTeacherId) {
          const teacherRef = doc(db, 'teachers', studentClass.mainTeacherId)
          const teacherSnap = await getDoc(teacherRef)
          if (teacherSnap.exists()) {
            studentDetailData.teacherName = teacherSnap.data().name
          }
        }

        // Fetch schedule info for the assigned class
        const classScheduleQuery = query(collection(db, 'schedules'), where('classId', '==', studentClass.id))
        const classScheduleSnap = await getDocs(classScheduleQuery)
        const allSchedules = classScheduleSnap.docs.map(doc => doc.data())
        const uniqueSchedules = []
        const seen = new Set()
        for (const s of allSchedules) {
          const key = `${s.dayOfWeek}-${s.startTime}-${s.endTime}`
          if (!seen.has(key)) {
            uniqueSchedules.push(s)
            seen.add(key)
          }
        }
        studentDetailData.schedules = uniqueSchedules

        // Initial tuition calculation for the current month
        await calculateAndSetTuition(student, studentClass, uniqueSchedules, selectedYear.value, selectedMonth.value)
      }
    } else {
      // No class assigned to student
      studentDetailData.classInfo = null;
      studentDetailData.teacherName = '';
      studentDetailData.schedules = [];
      studentDetailData.tuition = null;
    }
  } catch (e) {
    console.error("Error fetching student details:", e)
  } finally {
    detailLoading.value = false
  }
}




onMounted(() => {
  fetchStudents()
})
</script>



<style scoped>
.student-management {
  padding: 20px 0;
}

.table th {
  border-top: none;
  font-weight: 600;
}

.btn-group .btn {
  margin-right: 2px;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
