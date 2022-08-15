import { lazy } from 'solid-js'

export const prefix = '/scoring'

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