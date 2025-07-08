<template>
  <div class="teacher-management">
    <div class="row mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center">
        <h2 class="mb-0">👩‍🏫 Quản lý Giáo viên</h2>
          <button class="btn btn-primary" @click="showAddModal = true">
            <i class="bi bi-plus"></i> Thêm giáo viên mới
          </button>
      </div>
    </div>

    <!-- Search -->
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Tìm kiếm giáo viên..." v-model="searchTerm" @input="filterTeachers">
          <button class="btn btn-outline-secondary" type="button">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Teachers Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading && !teachers.length" class="text-center py-5">
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
                  <th>Tên giáo viên</th>
                  <th>Ký hiệu</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedTeachers.length === 0">
                  <td colspan="4" class="text-center">Không có dữ liệu.</td>
                </tr>
                <tr v-for="teacher in paginatedTeachers" :key="teacher.id">
                  <td>{{ teacher.id }}</td>
                  <td>{{ teacher.name }}</td>
                  <td>{{ teacher.symbol }}</td>
                  <td>
                    <div class="btn-group" role="group">
                      <button class="btn btn-sm btn-outline-primary" @click="editTeacher(teacher)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(teacher.id)">
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
    <div class="modal fade" :class="{ show: showAddModal || showEditModal }" :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-md">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTeacher">
              <div class="mb-3">
                <label class="form-label">Tên giáo viên *</label>
                <input type="text" class="form-control" v-model="teacherForm.name" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Ký hiệu *</label>
                <input type="text" class="form-control" v-model="teacherForm.symbol" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="loading">Hủy</button>
            <button type="button" class="btn btn-primary" @click="saveTeacher" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm') }}
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div class="modal fade" :class="{ show: showDeleteModal }" :style="{ display: showDeleteModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Xác nhận xóa</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Bạn có chắc chắn muốn xóa giáo viên này?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false" :disabled="loading">Hủy</button>
            <button type="button" class="btn btn-danger" @click="deleteTeacher" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Đang xóa...' : 'Xóa' }}
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showAddModal || showEditModal || showDeleteModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFirestoreCrud } from '../composables/useFirestoreCrud.js'

const searchTerm = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const deleteId = ref(null)

const teacherForm = ref({
  id: null,
  name: '',
  symbol: ''
})

const { items: teachers, loading, error, fetchData, addOrUpdateItem, deleteItem } = useFirestoreCrud('teachers')


const filteredTeachers = computed(() => {
  let filtered = teachers.value
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(teacher =>
      (teacher.name && teacher.name.toLowerCase().includes(term)) ||
      (teacher.symbol && teacher.symbol.toLowerCase().includes(term)) ||
      (teacher.id && teacher.id.toLowerCase().includes(term))
    )
  }
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredTeachers.value.length / itemsPerPage.value))

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredTeachers.value.slice(start, start + itemsPerPage.value)
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

const filterTeachers = () => {
  currentPage.value = 1
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const editTeacher = (teacher) => {
  teacherForm.value = { ...teacher }
  isEditing.value = true
  showEditModal.value = true
}

const saveTeacher = async () => {
  const success = await addOrUpdateItem(teacherForm.value, isEditing.value);
  if (success) {
    closeModal();
  }
};


const confirmDelete = (id) => {
  deleteId.value = id
  showDeleteModal.value = true
}

const deleteTeacher = async () => {
  const success = await deleteItem(deleteId.value);
  if (success) {
    showDeleteModal.value = false;
    deleteId.value = null;
  }
};


const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  isEditing.value = false
  teacherForm.value = {
    id: null,
    name: '',
    symbol: ''
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.teacher-management {
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
