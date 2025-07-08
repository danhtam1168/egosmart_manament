<template>
  <div class="card">
    <div class="card-header">
      <h2>Công cụ Import Dữ liệu có Chuẩn hóa</h2>
    </div>
    <div class="card-body">
      <p>
        Thực hiện import theo từng bước để đảm bảo dữ liệu được liên kết chính xác.
      </p>

      <!-- Step 1: Teachers and Subjects -->
      <div class="import-step">
        <h4>Bước 1: Import Giáo viên & Môn học</h4>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Nội dung file <strong>giaovien.json</strong></label>
            <textarea v-model="teacherJson" rows="8" class="form-control" placeholder="Dán nội dung file giaovien.json..."></textarea>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Nội dung file <strong>monhoc.json</strong></label>
            <textarea v-model="subjectJson" rows="8" class="form-control" placeholder="Dán nội dung file monhoc.json..."></textarea>
          </div>
        </div>
        <button @click="importStep1" class="btn btn-primary" :disabled="loading.step1">
          <span v-if="loading.step1" class="spinner-border spinner-border-sm"></span> Import Bước 1
        </button>
        <div v-if="messages.step1" class="alert mt-2" :class="errors.step1 ? 'alert-danger' : 'alert-success'">{{ messages.step1 }}</div>
      </div>

      <hr class="my-4">

      <!-- Step 2: Students and Classes -->
      <div class="import-step">
        <h4>Bước 2: Import Học sinh & Lớp học</h4>
        <p class="text-muted">Gộp và dán nội dung của 3 file <strong>tieuhoc.json</strong>, <strong>thcs.json</strong>, và <strong>thpt.json</strong> vào ô dưới đây.</p>
        <textarea v-model="classStudentJson" rows="10" class="form-control mb-3" placeholder="Dán nội dung các file lớp học..."></textarea>
        <button @click="importStep2" class="btn btn-primary" :disabled="loading.step2 || !isStep1Complete">
          <span v-if="loading.step2" class="spinner-border spinner-border-sm"></span> Import Bước 2
        </button>
        <div v-if="!isStep1Complete" class="text-danger mt-1 small">Vui lòng hoàn thành Bước 1 trước.</div>
        <div v-if="messages.step2" class="alert mt-2" :class="errors.step2 ? 'alert-danger' : 'alert-success'">{{ messages.step2 }}</div>
      </div>

      <hr class="my-4">

      <!-- Step 3: Schedules -->
      <div class="import-step">
        <h4>Bước 3: Import Lịch học chi tiết</h4>
        <p class="text-muted">Dán nội dung file <strong>data.json</strong> vào ô dưới đây.</p>
        <textarea v-model="scheduleJson" rows="10" class="form-control mb-3" placeholder="Dán nội dung file data.json..."></textarea>
        <button @click="importStep3" class="btn btn-primary" :disabled="loading.step3 || !isStep1Complete">
          <span v-if="loading.step3" class="spinner-border spinner-border-sm"></span> Import Bước 3
        </button>
        <div v-if="!isStep1Complete" class="text-danger mt-1 small">Vui lòng hoàn thành Bước 1 trước.</div>
        <div v-if="messages.step3" class="alert mt-2" :class="errors.step3 ? 'alert-danger' : 'alert-success'">{{ messages.step3 }}</div>
      </div>

      <hr class="my-4">

      <!-- Alternative Single Import Section -->
      <div class="import-step">
        <h4>Import Học sinh (Chung)</h4>
        <p class="text-muted">Dán dữ liệu JSON để import trực tiếp vào collection 'students'. Dữ liệu sẽ được lưu nguyên bản. Nếu có trường 'id' hoặc 'Mã HS', nó sẽ được dùng làm ID của tài liệu.</p>
        <textarea v-model="jsonData" rows="8" class="form-control mb-3" placeholder="Dán mảng dữ liệu JSON của học sinh..."></textarea>
        <button @click="startImport" class="btn btn-secondary" :disabled="loading.simple">
          <span v-if="loading.simple" class="spinner-border spinner-border-sm"></span> Import Học sinh
        </button>
        <div v-if="progress > 0" class="progress mt-2">
          <div class="progress-bar" :style="{ width: progress + '%' }">{{ Math.round(progress) }}%</div>
        </div>
        <div v-if="message" class="alert mt-2" :class="isError ? 'alert-danger' : 'alert-success'">{{ message }}</div>
      </div>


      <hr class="my-4">

      <!-- Import Student List from student.json -->
      <div class="import-step">
        <h4>Import Danh sách Học sinh (student.json)</h4>
        <p class="text-muted">Dán nội dung file <strong>student.json</strong> vào ô dưới đây để import danh sách học sinh vào collection 'students'.</p>
        <textarea v-model="studentListJson" rows="10" class="form-control mb-3" placeholder="Dán nội dung file student.json..."></textarea>
        <button @click="importStudentList" class="btn btn-info" :disabled="loadingStudentList">
          <span v-if="loadingStudentList" class="spinner-border spinner-border-sm"></span> Import Danh sách Học sinh
        </button>
        <div v-if="messageStudentList" class="alert mt-2" :class="errorStudentList ? 'alert-danger' : 'alert-success'">{{ messageStudentList }}</div>
      </div>

      <hr class="my-4">

      <!-- Section to add/update a field for all documents in a collection -->
      <div class="import-step">
        <h4>Thêm/Cập nhật Trường cho Collection</h4>
        <div class="alert alert-warning">
          <strong>Cảnh báo:</strong> Chức năng này sẽ thay đổi TẤT CẢ các tài liệu trong collection đã chọn. Hãy chắc chắn về hành động của bạn.
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">Chọn Collection</label>
            <select v-model="selectedCollection" class="form-select">
              <option disabled value="">-- Chọn một collection --</option>
              <option v-for="col in availableCollections" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Tên trường (Field Name)</label>
            <input type="text" v-model="newFieldName" class="form-control" placeholder="Ví dụ: status">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Giá trị (Value)</label>
            <input type="text" v-model="newFieldValue" class="form-control" placeholder="Ví dụ: active">
          </div>
        </div>
        <button @click="updateCollection" class="btn btn-danger" :disabled="updateLoading || !selectedCollection || !newFieldName">
          <span v-if="updateLoading" class="spinner-border spinner-border-sm"></span> Cập nhật Toàn bộ Collection
        </button>
        <div v-if="updateProgress > 0" class="progress mt-2">
          <div class="progress-bar bg-danger" :style="{ width: updateProgress + '%' }">{{ Math.round(updateProgress) }}%</div>
        </div>
        <div v-if="updateMessage" class="alert mt-2" :class="updateError ? 'alert-danger' : 'alert-success'">{{ updateMessage }}</div>
      </div>

      <hr class="my-4">

      <!-- Section to export a collection to JSON -->
      <div class="import-step">
        <h4>Xuất Dữ liệu Collection ra JSON</h4>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">Chọn Collection để Xuất</label>
            <select v-model="exportCollectionName" class="form-select">
              <option disabled value="">-- Chọn một collection --</option>
              <option v-for="col in availableCollections" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
        </div>
        <button @click="exportCollection" class="btn btn-success" :disabled="exportLoading || !exportCollectionName">
          <span v-if="exportLoading" class="spinner-border spinner-border-sm"></span> Xuất ra JSON
        </button>
        <div v-if="exportMessage" class="alert mt-2" :class="exportError ? 'alert-danger' : 'alert-success'">{{ exportMessage }}</div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, computed } from 'vue';
import { db } from '../main';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';


// Data for step-by-step import
const teacherJson = ref('');
const subjectJson = ref('');
const classStudentJson = ref('');
const scheduleJson = ref('');

const loading = reactive({ step1: false, step2: false, step3: false, simple: false });
const messages = reactive({ step1: '', step2: '', step3: '' });
const errors = reactive({ step1: false, step2: false, step3: false });

// Maps để tra cứu ID từ tên hoặc ký hiệu
const teacherNameToIdMap = ref(new Map());
const teacherSymbolToIdMap = ref(new Map());
const subjectNameToIdMap = ref(new Map());

const isStep1Complete = computed(() => teacherNameToIdMap.value.size > 0 && subjectNameToIdMap.value.size > 0);

// Data for simple import
const jsonData = ref('');
const message = ref('');
const isError = ref(false);
const progress = ref(0);

const BATCH_LIMIT = 400;

// Thêm biến cho import student.json
const studentListJson = ref('');
const loadingStudentList = ref(false);
const messageStudentList = ref('');
const errorStudentList = ref(false);

// Refs for the new update collection feature
const selectedCollection = ref('');
const newFieldName = ref('');
const newFieldValue = ref('');
const updateLoading = ref(false);
const updateMessage = ref('');
const updateError = ref(false);
const updateProgress = ref(0);
const availableCollections = ['students', 'teachers', 'classes', 'schedules'];

// Refs for the new export collection feature
const exportCollectionName = ref('');
const exportLoading = ref(false);
const exportMessage = ref('');
const exportError = ref(false);



// Step 1: Import Teachers and Subjects
async function importStep1() {
  loading.step1 = true;
  messages.step1 = '';
  errors.step1 = false;

  try {
    // Import Teachers
    const teachers = JSON.parse(teacherJson.value);
    const teacherBatch = writeBatch(db);
    let teacherCount = 0;
    for (const teacher of teachers) {
      const teacherId = teacher['Mã số'];
      const teacherRef = doc(db, 'teachers', teacherId);
      teacherBatch.set(teacherRef, {
        name: teacher['Tên giáo viên'],
        symbol: teacher['Kí hiệu']
      });
      teacherNameToIdMap.value.set(teacher['Tên giáo viên'], teacherId);
      teacherSymbolToIdMap.value.set(teacher['Kí hiệu'], teacherId);
      teacherCount++;
    }
    await teacherBatch.commit();

    // Import Subjects
    const subjects = JSON.parse(subjectJson.value);
    const subjectBatch = writeBatch(db);
    let subjectCount = 0;
    for (const subject of subjects) {
      const subjectId = subject['Kí hiệu'];
      const subjectRef = doc(db, 'subjects', subjectId);
      subjectBatch.set(subjectRef, { name: subject['Môn học'] });
      subjectNameToIdMap.value.set(subject['Môn học'], subjectId);
      subjectCount++;
    }
    await subjectBatch.commit();

    messages.step1 = `Import thành công ${teacherCount} giáo viên và ${subjectCount} môn học.`;

  } catch (e) {
    console.error("Lỗi Bước 1:", e);
    messages.step1 = 'Lỗi: ' + e.message;
    errors.step1 = true;
  } finally {
    loading.step1 = false;
  }
}

// Step 2: Import Students and Classes
async function importStep2() {
  loading.step2 = true;
  messages.step2 = '';
  errors.step2 = false;

  try {
    const data = JSON.parse(classStudentJson.value);
    const studentsMap = new Map();
    const classesMap = new Map();

    // Trích xuất dữ liệu học sinh và lớp học
    for (const row of data) {
      const studentId = row['Mã HS'];
      const classId = row['Mã lớp'];

      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          name: row['Học sinh'],
          grade: row['Lớp']
        });
      }

      if (!classesMap.has(classId)) {
        const mainTeacherId = teacherNameToIdMap.value.get(row['Phụ trách']) || null;
        const subjectId = subjectNameToIdMap.value.get(row['Môn học']) || null;
        classesMap.set(classId, {
          name: row['Tên lớp'],
          description: row['Mô tả'],
          mainTeacherId: mainTeacherId,
          subjectId: subjectId,
          studentIds: new Set()
        });
      }
      classesMap.get(classId).studentIds.add(studentId);
    }

    // Batch write Students
    const studentBatch = writeBatch(db);
    for (const [id, studentData] of studentsMap.entries()) {
      const studentRef = doc(db, 'students', id);
      studentBatch.set(studentRef, studentData);
    }
    await studentBatch.commit();

    // Batch write Classes
    const classBatch = writeBatch(db);
    for (const [id, classData] of classesMap.entries()) {
      const classRef = doc(db, 'classes', id);
      classBatch.set(classRef, {
        ...classData,
        studentIds: Array.from(classData.studentIds) // Chuyển Set thành Array
      });
    }
    await classBatch.commit();

    messages.step2 = `Import thành công ${studentsMap.size} học sinh và ${classesMap.size} lớp học.`;

  } catch (e) {
    console.error("Lỗi Bước 2:", e);
    messages.step2 = 'Lỗi: ' + e.message;
    errors.step2 = true;
  } finally {
    loading.step2 = false;
  }
}

// Step 3: Import Schedules
async function importStep3() {
  loading.step3 = true;
  messages.step3 = '';
  errors.step3 = false;

  try {
    const data = JSON.parse(scheduleJson.value);
    const schedulesCollection = collection(db, 'schedules');
    let importedCount = 0;

    const weekdays = {
      "Thứ Hai": "Thứ Hai", "Thứ Ba": "Thứ Ba", "Thứ Tư": "Thứ Tư",
      "Thứ Năm": "Thứ Năm", "Thứ SáU": "Thứ Sáu", "Thứ BảY": "Thứ Bảy", "Chủ NhậT": "Chủ Nhật"
    };

    for (let i = 0; i < data.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.slice(i, i + BATCH_LIMIT);

      for (const row of chunk) {
        const classId = row['Mã lớp'];
        const studentId = row['Mã HS'];

        for (const [key, dayName] of Object.entries(weekdays)) {
          if (row[key]) {
            const teacherSymbol = row[key];
            const teacherId = teacherSymbolToIdMap.value.get(teacherSymbol);

            if (teacherId) {
              const newScheduleRef = doc(schedulesCollection); // Tự tạo ID
              batch.set(newScheduleRef, {
                classId: classId,
                studentId: studentId,
                dayOfWeek: dayName,
                startTime: row['Giờ đến'] || '',
                endTime: row['Giờ về'] || '',
                teacherId: teacherId,
                note: row['Ghi chú'] || ''
              });
              importedCount++;
            }
          }
        }
      }
      await batch.commit();
    }

    messages.step3 = `Import thành công ${importedCount} lịch học chi tiết.`;

  } catch (e) {
    console.error("Lỗi Bước 3:", e);
    messages.step3 = 'Lỗi: ' + e.message;
    errors.step3 = true;
  } finally {
    loading.step3 = false;
  }
}

// Simple import function
async function startImport() {
  loading.simple = true;
  message.value = '';
  isError.value = false;
  progress.value = 0;

  let data;
  try {
    data = JSON.parse(jsonData.value);
    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu JSON phải là một mảng (array).");
    }
  } catch (e) {
    message.value = 'Lỗi phân tích JSON: ' + e.message;
    isError.value = true;
    loading.simple = false;
    return;
  }

  if (data.length === 0) {
    message.value = 'Không có dữ liệu để import.';
    isError.value = true;
    loading.simple = false;
    return;
  }

  const targetCollection = collection(db, 'students');
  const totalItems = data.length;
  let importedCount = 0;

  try {
    // Firestore giới hạn 500 thao tác mỗi batch, ta dùng 400 cho an toàn
    for (let i = 0; i < totalItems; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.slice(i, i + BATCH_LIMIT);

      for (const item of chunk) {
        const docId = item.id || item['Mã HS'] || undefined;
        const docRef = docId ? doc(targetCollection, docId) : doc(targetCollection);
        batch.set(docRef, item);
      }
      
      await batch.commit();
      importedCount += chunk.length;
      progress.value = (importedCount / totalItems) * 100;
    }

    message.value = `Import thành công ${importedCount} / ${totalItems} học sinh.`;
    isError.value = false;
  } catch (err) {
    console.error("Lỗi khi import dữ liệu:", err);
    message.value = 'Đã xảy ra lỗi trong quá trình import: ' + err.message;
    isError.value = true;
  } finally {
    loading.simple = false;
  }
}


// Thêm hàm importStudentList
async function importStudentList() {
  loadingStudentList.value = true;
  messageStudentList.value = '';
  errorStudentList.value = false;

  let data;
  try {
    data = JSON.parse(studentListJson.value);
    if (!Array.isArray(data)) {
      throw new Error("Dữ liệu JSON phải là một mảng (array).");
    }
  } catch (e) {
    messageStudentList.value = 'Lỗi phân tích JSON: ' + e.message;
    errorStudentList.value = true;
    loadingStudentList.value = false;
    return;
  }

  if (data.length === 0) {
    messageStudentList.value = 'Không có dữ liệu để import.';
    errorStudentList.value = true;
    loadingStudentList.value = false;
    return;
  }

  const studentsCollection = collection(db, 'students');
  const totalItems = data.length;
  let importedCount = 0;

  try {
    for (let i = 0; i < totalItems; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = data.slice(i, i + BATCH_LIMIT);

      for (const item of chunk) {
        // Nếu student.json có trường 'Mã HS' thì dùng làm ID, nếu không thì để Firestore tự tạo
        const studentId = item['Mã HS'] || undefined;
        const studentRef = studentId ? doc(studentsCollection, studentId) : doc(studentsCollection);
        // Lưu toàn bộ object, hoặc có thể ánh xạ lại trường nếu muốn
        batch.set(studentRef, item);
      }
      await batch.commit();
      importedCount += chunk.length;
    }
    messageStudentList.value = `Import thành công ${importedCount} học sinh từ student.json.`;
    errorStudentList.value = false;
  } catch (err) {
    console.error("Lỗi khi import student.json:", err);
    messageStudentList.value = 'Đã xảy ra lỗi trong quá trình import: ' + err.message;
    errorStudentList.value = true;
  } finally {
    loadingStudentList.value = false;
  }
}

// Function to update all documents in a collection
async function updateCollection() {
  if (!confirm(`Bạn có chắc chắn muốn thêm trường '${newFieldName.value}' với giá trị '${newFieldValue.value}' cho TẤT CẢ tài liệu trong collection '${selectedCollection.value}' không? Hành động này không thể hoàn tác.`)) {
    return;
  }

  updateLoading.value = true;
  updateMessage.value = '';
  updateError.value = false;
  updateProgress.value = 0;

  try {
    const colRef = collection(db, selectedCollection.value);
    const querySnapshot = await getDocs(colRef);
    const totalDocs = querySnapshot.size;
    let processedCount = 0;

    if (totalDocs === 0) {
      updateMessage.value = "Collection không có tài liệu nào để cập nhật.";
      updateLoading.value = false;
      return;
    }

    const docs = querySnapshot.docs;
    for (let i = 0; i < totalDocs; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_LIMIT);
      
      for (const doc of chunk) {
        batch.update(doc.ref, { [newFieldName.value]: newFieldValue.value });
      }
      
      await batch.commit();
      processedCount += chunk.length;
      updateProgress.value = (processedCount / totalDocs) * 100;
    }

    updateMessage.value = `Cập nhật thành công ${processedCount} tài liệu trong collection '${selectedCollection.value}'.`;
    updateError.value = false;

  } catch (e) {
    console.error("Lỗi khi cập nhật collection:", e);
    updateMessage.value = `Đã xảy ra lỗi: ${e.message}`;
    updateError.value = true;
  } finally {
    updateLoading.value = false;
  }
}

// Function to export a collection to a JSON file
async function exportCollection() {
  exportLoading.value = true;
  exportMessage.value = '';
  exportError.value = false;

  try {
    const colRef = collection(db, exportCollectionName.value);
    const querySnapshot = await getDocs(colRef);
    
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (data.length === 0) {
      exportMessage.value = "Collection rỗng hoặc không tồn tại.";
      exportError.value = true;
      exportLoading.value = false;
      return;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportCollectionName.value}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    exportMessage.value = `Xuất thành công ${data.length} tài liệu từ collection '${exportCollectionName.value}'.`;
    exportError.value = false;

  } catch (e) {
    console.error("Lỗi khi xuất collection:", e);
    exportMessage.value = `Đã xảy ra lỗi: ${e.message}`;
    exportError.value = true;
  } finally {
    exportLoading.value = false;
  }
}
</script>



<style scoped>
.import-step {
  border: 1px solid #ddd;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}
</style>
