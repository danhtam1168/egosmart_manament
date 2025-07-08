import AdminLayout from "../layouts/AdminLayout.vue";
import Dashboard from "../views/Dashboard.vue";
import Student from "../views/Student.vue";
import Teacher from "../views/Teacher.vue";
import ImportData from "../views/ImportData.vue";
import ClassList from '../views/ClassList.vue';
import ClassSchedule from "../views/ClassSchedule.vue";
import StudentSchedule from "../views/StudentSchedule.vue";


export default [
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "Dashboard", component: Dashboard },     
      { path: "students", name: "Students", component: Student },
      { path: "teachers", name: "Teacher", component: Teacher },
      { path: "import", name: "ImportData", component: ImportData },
      {
        path: "classes",
        name: "ClassList",
        component: ClassList,
      },
      {
        path: "classSchedule",
        name: "ClassSchedule",
        component: ClassSchedule,
      },
      {
        path: "studentSchedule",
        name: "StudentSchedule",
        component: StudentSchedule,
      },
    ],
  },
];
