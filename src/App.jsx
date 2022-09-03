import { onMount, Show } from 'solid-js'
import { useRoutes } from '@solidjs/router'

import Container from '@suid/material/Container'
import CssBaseline from '@suid/material/CssBaseline'

import { routes } from './router'
import { isWebSQL, dbExec } from './websql'
import { getSetting } from './mixins'

export default function App() {
  onMount(async () => {
    try {
      await dbExec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT
      )`)
      await dbExec(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP DEFAULT NULL,
        goal INTEGER
      )`)
      await dbExec(`CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY,
        game_id INTEGER,
        user_id INTEGER
      )`)
      await dbExec(`CREATE TABLE IF NOT EXISTS rounds (
        id INTEGER PRIMARY KEY,
        number INTEGER,
        game_id INTEGER
      )`)
      await dbExec(`CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY,
        round_id INTEGER,
        player_id INTEGER,
        score INTEGER
      )`)
      await dbExec(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        key TEXT,
        value TEXT
      )`)
    } catch (e) {
      console.error(e)
    }

    const version = await getSetting('VERSION')
    if (!version) {
      try {
        await dbExec(`ALTER TABLE games ADD goal INTEGER`)
      } catch (e) {
        console.error(e)
      }
      await dbExec(`INSERT INTO settings (key, value) VALUES ('VERSION', '220903')`)
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
