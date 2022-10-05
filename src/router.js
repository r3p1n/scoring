import { lazy } from 'solid-js'

export const prefix = import.meta.env.VITE_URL_PREFIX

export const routes = [
  {
    path: prefix +'/',
    component: lazy(() => import('./pages/Home'))
  },
  {
    path: prefix +'/new-game',
    component: lazy(() => import('./pages/Game'))
  },
  {
    path: prefix +'/continue',
    component: lazy(() => import('./pages/Continue'))
  },
  {
    path: prefix +'/history',
    component: lazy(() => import('./pages/History'))
  },
  {
    path: prefix +'/game/:id/round',
    component: lazy(() => import('./pages/Round'))
  },
  {
    path: prefix +'/game/:id/results',
    component: lazy(() => import('./pages/Results'))
  },
  {
    path: prefix +'/game/:id/stats',
    component: lazy(() => import('./pages/Results'))
  },
  {
    path: prefix +'/game/:id/settings',
    component: lazy(() => import('./pages/Game'))
  },
  {
    path: prefix +'/*',
    component: lazy(() => import('./pages/NotFound'))
  },
]