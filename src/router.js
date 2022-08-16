import { lazy } from 'solid-js'

export const prefix = import.meta.env.VITE_URL_PREFIX

export const routes = [
  {
    path: prefix +'/',
    component: lazy(() => import('./pages/Home'))
  },
  {
    path: prefix +'/new-game',
    component: lazy(() => import('./pages/NewGame'))
  },
  {
    path: prefix +'/game/:id/new-round',
    component: lazy(() => import('./pages/NewRound'))
  },
  {
    path: prefix +'/game/:id/results',
    component: lazy(() => import('./pages/Results'))
  },
  {
    path: prefix +'/*',
    component: lazy(() => import('./pages/NotFound'))
  },
]