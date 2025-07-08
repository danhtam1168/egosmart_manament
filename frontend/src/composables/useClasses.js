import { ref } from 'vue'
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../main.js'

export function useClasses() {
  const firstClass = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const fetchFirstClass = async () => {
    loading.value = true
    error.value = null
    try {
      // Query the 'classes' collection, order by 'name' or any field, limit to 1
      const classesCollection = collection(db, 'classes')
      const q = query(classesCollection, orderBy('name'), limit(1))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        firstClass.value = { id: doc.id, ...doc.data() }
      } else {
        firstClass.value = null
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch first class'
      firstClass.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    firstClass,
    error,
    loading,
    fetchFirstClass
  }
}
