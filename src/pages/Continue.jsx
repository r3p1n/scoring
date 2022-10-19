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

export default function Continue() {
  const [games, setGames] = createStore([])
  const [noActiveGame, setNoActiveGame] = createSignal(false)

  onMount(async () => {
    await getUnfinishedGames()
  })

  const getUnfinishedGames = async () => {
    const rows = await db.getUnfinishedGames()
    if (!rows.length) {
      setNoActiveGame(true)
      return
    }
    setGames(rows)
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">Continue</Typography>
      </Grid>

      <Grid item xs={12} sx={{ overflow: 'auto' }}>
        <Typography variant="h6">Games</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Started at</TableCell>
              <TableCell>Goal</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { games.map(game => {
              return <>
                <TableRow key={ game.id }>
                  <TableCell>{ game.id }</TableCell>
                  <TableCell>{ formatDatetime(game.created_at) }</TableCell>
                  <TableCell>{ game.goal }</TableCell>
                  <TableCell align="right">
                    <Link class="btn-link" href={`${prefix}/game/${game.id}/round`}>
                      <Button variant="contained">Play</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              </>
            }) }
          </TableBody>
        </Table>
      </Grid>

      <Show when={noActiveGame()}>
        <Grid item xs={12} container justifyContent="center">
          <Alert severity="error">No active game</Alert>
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