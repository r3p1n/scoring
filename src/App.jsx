import { onMount, Show } from 'solid-js'
import { useRoutes } from '@solidjs/router'

import Container from '@suid/material/Container'
import CssBaseline from '@suid/material/CssBaseline'

import { routes } from './router'
import { isWebSQL } from './websql'
import db from './mixins/database'

export default function App() {
  onMount(async () => {
    const tables = await db.getTables()
    await db.createTables()
    if (!tables.length) {
      await db.setSetting('VERSION', db.version)
    }

    const version = await db.getSetting('VERSION')
    if (!version || version !== db.version) {
      await db.updateTables(version)
      await db.setSetting('VERSION', db.version)
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
