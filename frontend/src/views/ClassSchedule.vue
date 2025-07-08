<template>
  <div class="class-schedule">
    <h2>📅 Quản lý lịch học lớp</h2>

    <div class="mb-3">
      <label for="classSelect" class="form-label">Chọn lớp:</label>
      <select id="classSelect" class="form-select" v-model="selectedClassId" @change="onClassChange">
        <option value="">-- Chọn lớp --</option>
        <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
      </select>
    </div>

    <div v-if="selectedClassId">
      <!-- Form thêm khung thời gian -->
      <h4>Thêm khung thời gian mới</h4>
      <form @submit.prevent="addTimeSlot" class="mb-4">
        <div class="row g-3">
          <div class="col">
            <label for="startTime" class="form-label">Giờ bắt đầu (HH:mm)</label>
            <input type="text" id="startTime" class="form-control" v-model="newTimeSlot.start" placeholder="HH:mm"
                   pattern="([0-1][0-9]|2[0-3]):[0-5][0-9]" required />
          </div>
          <div class="col">
            <label for="endTime" class="form-label">Giờ kết thúc (HH:mm)</label>
            <input type="text" id="endTime" class="form-control" v-model="newTimeSlot.end" placeholder="HH:mm"
                   pattern="([0-1][0-9]|2[0-3]):[0-5][0-9]" required />
          </div>
          <div class="col-auto align-self-end">
            <button type="submit" class="btn btn-success">Thêm khung giờ</button>
          </div>
        </div>
        <div v-if="timeSlotError" class="alert alert-danger mt-2">{{ timeSlotError }}</div>
      </form>

      <!-- Danh sách khung thời gian hiện có -->
      <h4>Khung thời gian hiện có</h4>
      <ul class="list-group mb-4">
        <li v-for="(slot, index) in timeSlots" :key="index" class="list-group-item d-flex justify-content-between align-items-center">
          {{ slot }}
          <button class="btn btn-danger btn-sm" @click="deleteTimeSlot(slot)" :disabled="isTimeSlotUsed(slot)">
            <i class="bi bi-x"></i>
          </button>
        </li>
        <li v-if="timeSlots.length === 0" class="list-group-item text-muted">
          Chưa có khung thời gian nào được sử dụng.
        </li>
      </ul>

      <h4>Thêm / Sửa lịch học cho lớp</h4>
      <form @submit.prevent="saveSchedule">
        <table class="table table-bordered text-center">
          <thead>
            <tr>
              <th>Khung giờ</th>
              <th>Thứ 2</th>
              <th>Thứ 3</th>
              <th>Thứ 4</th>
              <th>Thứ 5</th>
              <th>Thứ 6</th>
              <th>Thứ 7</th>
              <th>Chủ Nhật</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(timeSlot, index) in timeSlots" :key="index">
              <td>{{ timeSlot }}</td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Thứ Hai', time: timeSlot }" /></td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Thứ Ba', time: timeSlot }" /></td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Thứ Tư', time: timeSlot }" /></td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Thứ Năm', time: timeSlot }" /></td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Thứ Sáu', time: timeSlot }" /></td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Thứ Bảy', time: timeSlot }" /></td>
              <td><input type="checkbox" v-model="scheduleForm.selectedSlots" :value="{ day: 'Chủ Nhật', time: timeSlot }" /></td>
            </tr>
          </tbody>
        </table>
        <div class="mb-3">
          <label class="form-label">Ghi chú</label>
          <input type="text" class="form-control" v-model="scheduleForm.note" />
        </div>
        <button type="submit" class="btn btn-primary">Lưu lịch học</button>
      </form>

      <h4 class="mt-4">Lịch học của lớp</h4>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Ngày trong tuần</th>
            <th>Giờ bắt đầu</th>
            <th>Giờ kết thúc</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in classSchedules" :key="item.id">
            <td>{{ item.dayOfWeek }}</td>
            <td>{{ item.startTime }}</td>
            <td>{{ item.endTime }}</td>
            <td>{{ item.note }}</td>
          </tr>
        </tbody>
      </table>
      <button type="button" class="btn btn-danger mt-2" @click="deleteAllSchedules" v-if="classSchedules.length > 0">
        Xóa tất cả lịch học
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../main.js';
import { useFirestoreCrud } from '../composables/useFirestoreCrud';

const { items: classes, fetchData: fetchClasses } = useFirestoreCrud('classes');

const selectedClassId = ref('');
const timeSlotError = ref('');

const scheduleForm = ref({
  selectedSlots: [],
  note: ''
});

const newTimeSlot = ref({
  start: '',
  end: ''
});

const classSchedules = ref([]);

// Lấy timeSlots từ classSchedules, trả về danh sách cố định nếu không có lịch
const timeSlots = computed(() => {
  if (classSchedules.value.length === 0) {
    return ['16:30-18:00', '18:30-20:00', '20:30-22:00'].sort();
  }
  const slots = new Set();
  classSchedules.value.forEach(schedule => {
    slots.add(`${schedule.startTime}-${schedule.endTime}`);
  });
  return Array.from(slots).sort();
});

const fetchSchedules = async () => {
  if (!selectedClassId.value) {
    classSchedules.value = [];
    scheduleForm.value.selectedSlots = [];
    return;
  }
  const qClass = query(collection(db, 'schedules'), where('classId', '==', selectedClassId.value));
  const querySnapshotClass = await getDocs(qClass);
  classSchedules.value = querySnapshotClass.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  scheduleForm.value.selectedSlots = classSchedules.value.map(item => ({
    day: item.dayOfWeek,
    time: `${item.startTime}-${item.endTime}`
  }));
};

const onClassChange = async () => {
  await fetchSchedules();
};

const validateTimeFormat = (time) => {
  const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

const validateTimeSlot = (start, end) => {
  if (!validateTimeFormat(start) || !validateTimeFormat(end)) {
    return 'Thời gian phải có định dạng HH:mm';
  }
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  if (endTime <= startTime) {
    return 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
  }
  const newSlot = `${start}-${end}`;
  if (timeSlots.value.includes(newSlot)) {
    return 'Khung thời gian này đã tồn tại';
  }
  return null;
};

const addTimeSlot = () => {
  const { start, end } = newTimeSlot.value;
  const error = validateTimeSlot(start, end);
  if (error) {
    timeSlotError.value = error;
    return;
  }
  // Thêm khung thời gian mới bằng cách tạo một lịch giả để cập nhật timeSlots
  classSchedules.value.push({
    id: 'temp-' + Date.now(),
    classId: selectedClassId.value,
    teacherId: '',
    dayOfWeek: 'Thứ Hai', // Ngày mặc định, không ảnh hưởng vì chỉ cần timeSlot
    startTime: start.trim(),
    endTime: end.trim(),
    note: ''
  });
  timeSlotError.value = '';
  newTimeSlot.value = { start: '', end: '' };
};

const isTimeSlotUsed = (timeSlot) => {
  return classSchedules.value.some(
    schedule => `${schedule.startTime}-${schedule.endTime}` === timeSlot && schedule.dayOfWeek !== 'Thứ Hai'
  );
};

const deleteTimeSlot = (timeSlot) => {
  if (isTimeSlotUsed(timeSlot)) {
    alert('Không thể xóa khung thời gian này vì đang được sử dụng trong lịch học.');
    return;
  }
  if (confirm(`Bạn có chắc chắn muốn xóa khung thời gian ${timeSlot}?`)) {
    classSchedules.value = classSchedules.value.filter(
      schedule => `${schedule.startTime}-${schedule.endTime}` !== timeSlot
    );
  }
};

const saveSchedule = async () => {
  if (!selectedClassId.value) {
    alert('Vui lòng chọn lớp trước khi thêm lịch học.');
    return;
  }
  if (scheduleForm.value.selectedSlots.length === 0) {
    alert('Vui lòng chọn ít nhất một khung giờ trong tuần.');
    return;
  }
  try {
    const q = query(collection(db, 'schedules'), where('classId', '==', selectedClassId.value));
    const querySnapshot = await getDocs(q);
    const batchDeletes = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'schedules', docSnap.id)));
    await Promise.all(batchDeletes);

    for (const slot of scheduleForm.value.selectedSlots) {
      const [startTime, endTime] = slot.time.split('-');
      await addDoc(collection(db, 'schedules'), {
        classId: selectedClassId.value,
        teacherId: '',
        dayOfWeek: slot.day,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        note: scheduleForm.value.note || ''
      });
    }
    scheduleForm.value = {
      selectedSlots: [],
      note: ''
    };
    await fetchSchedules();
  } catch (error) {
    console.error('Lỗi khi lưu lịch học:', error);
    alert('Lỗi khi lưu lịch học. Vui lòng thử lại.');
  }
};

const deleteAllSchedules = async () => {
  if (!selectedClassId.value) {
    alert('Vui lòng chọn lớp trước khi xóa lịch học.');
    return;
  }
  if (!confirm('Bạn có chắc chắn muốn xóa tất cả lịch học của lớp này?')) {
    return;
  }
  try {
    const q = query(collection(db, 'schedules'), where('classId', '==', selectedClassId.value));
    const querySnapshot = await getDocs(q);
    const batchDeletes = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'schedules', docSnap.id)));
    await Promise.all(batchDeletes);
    await fetchSchedules();
    scheduleForm.value.selectedSlots = [];
  } catch (error) {
    console.error('Lỗi khi xóa lịch học:', error);
    alert('Lỗi khi xóa lịch học. Vui lòng thử lại.');
  }
};

onMounted(async () => {
  await fetchClasses();
});
</script>

<style scoped>
.class-schedule {
  padding: 20px;
}

h2, h4 {
  margin-bottom: 20px;
}

.list-group-item {
  font-weight: 500;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
}

.alert {
  margin-top: 10px;
}
</style>
