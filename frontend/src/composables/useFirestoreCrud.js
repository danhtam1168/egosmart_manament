import { ref } from 'vue';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../main.js';

export function useFirestoreCrud(collectionName) {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      items.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      error.value = `Lỗi khi tải dữ liệu: ${e.message}`;
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  const addOrUpdateItem = async (itemData, isEdit = false) => {
    loading.value = true;
    error.value = null;
    const { id, ...data } = itemData;

    try {
      if (isEdit) {
        if (!id) throw new Error("Cần có ID để cập nhật.");
        const itemRef = doc(db, collectionName, id);
        await updateDoc(itemRef, data);
        
        // Optimistic update
        const index = items.value.findIndex(i => i.id === id);
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...data };
        }
      } else {
        const docRef = await addDoc(collection(db, collectionName), data);
        
        // Optimistic update
        items.value.unshift({ id: docRef.id, ...data });
      }
      return true;
    } catch (e) {
      error.value = `Lỗi khi lưu dữ liệu: ${e.message}`;
      console.error(e);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const deleteItem = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      if (!id) throw new Error("Cần có ID để xóa.");
      await deleteDoc(doc(db, collectionName, id));
      
      // Optimistic update
      items.value = items.value.filter(item => item.id !== id);
      return true;
    } catch (e) {
      error.value = `Lỗi khi xóa dữ liệu: ${e.message}`;
      console.error(e);
      // Optional: Re-fetch data to ensure consistency if optimistic update fails
      // await fetchData(); 
      return false;
    } finally {
      loading.value = false;
    }
  };

  return { items, loading, error, fetchData, addOrUpdateItem, deleteItem };
}
