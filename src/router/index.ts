import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'daily-items',
        name: 'daily-items',
        component: () => import('@/pages/DailyItemsPage.vue'),
        meta: { title: '日常记录' },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/pages/TaskListPage.vue'),
        meta: { title: '任务列表' },
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/pages/ProjectsPage.vue'),
        meta: { title: '项目列表' },
      },
      {
        path: 'projects/:id',
        name: 'project-detail',
        component: () => import('@/pages/ProjectDetailPage.vue'),
        meta: { title: '项目详情' },
        props: true,
      },
      {
        path: 'version',
        name: 'version',
        component: () => import('@/pages/VersionManagementPage.vue'),
        meta: { title: '版本管理' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/pages/WeeklyReportsPage.vue'),
        meta: { title: '周报管理' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
