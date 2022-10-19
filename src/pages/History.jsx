import { createSignal, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Link } from '@solidjs/router'

import Grid from '@suid/material/Grid'
import Typography from '@suid/material/Typography'
import Button from '@suid/material/Button'
import Table from '@suid/material/Table'
import TableHead from '@suid/material/TableHead'
import TableBody from '@suid/material/TableBody'
import TableRow from '@suid/material/TableRow'
import TableCell from '@suid/material/TableCell'
import Alert from '@suid/material/Alert'

import { prefix } from '../router'
import db from '../mixins/database'
import { formatDatetime } from '../mixins/global'

export default function History() {
  const [games, setGames] = createStore([])
  const [noFinishedGame, setNoFinishedGame] = createSignal(false)

  onMount(async () => {
    await getFinishedGames()
  })

  const getFinishedGames = async () => {
    const rows = await db.getFinishedGames()
    if (!rows.length) {
      setNoFinishedGame(true)
      return
    }
    setGames(rows)
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">History</Typography>
      </Grid>

      <Grid item xs={12} sx={{ overflow: 'auto' }}>
        <Typography variant="h6">Games</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Finished at</TableCell>
              <TableCell>Goal</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { games.map(game => {
              return <>
                <TableRow key={ game.id }>
                  <TableCell>{ game.id }</TableCell>
                  <TableCell>{ formatDatetime(game.finished_at) }</TableCell>
                  <TableCell>{ game.goal }</TableCell>
                  <TableCell align="center">
                    <Link class="btn-link" href={`${prefix}/game/${game.id}/results`}>
                      <Button variant="contained">Stats</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              </>
            }) }
          </TableBody>
        </Table>
      </Grid>

      <Show when={noFinishedGame()}>
        <Grid item xs={12} container justifyContent="center">
          <Alert severity="error">No finished game</Alert>
        </Grid>
      </Show>

      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/`}>
          <Button sx={{ minWidth: '200px', mb: 1 }} variant="outlined">Main Menu</Button>
        </Link>
      </Grid>
    </Grid>
  </>
}