import { onMount, Show } from 'solid-js'
import { useRoutes } from '@solidjs/router'

import Container from '@suid/material/Container'
import CssBaseline from '@suid/material/CssBaseline'

import { routes } from './router'
import { isWebSQL } from './websql'
import db from './mixins/database'

export default function App() {
  onMount(async () => {
    await db.createTables()

    const version = await db.getSetting('VERSION')
    if (!version) {
      await db.updateTables()
      await db.setSetting('VERSION', '220903')
    }
  })

  const Routes = useRoutes(routes)
  return <>
    <Show when={isWebSQL}
      fallback={
        <h1 style={{ color: 'red' }}>This browser does not support WebSQL :'(</h1>
      }
    >
      <CssBaseline />
      <Container>
        <Routes />
      </Container>
    </Show>
  </>
}
