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

import { dbExec } from '../websql'
import { prefix } from '../router'

export default function Continue() {
  const [games, setGames] = createStore([])
  const [noActiveGame, setNoActiveGame] = createSignal(false)

  onMount(async () => {
    await getUnfinishedGames()
  })

  const formatDatetime = (datetime) => {
    let dt = new Date(datetime);
    return (
      ("0" + dt.getUTCDate()).slice(-2) + "." +
      ("0" + (dt.getUTCMonth()+1)).slice(-2) + "." +
      dt.getUTCFullYear() + " " +
      ("0" + dt.getUTCHours()).slice(-2) + ":" +
      ("0" + dt.getUTCMinutes()).slice(-2) + ":" +
      ("0" + dt.getUTCSeconds()).slice(-2)
    )
  }

  const getUnfinishedGames = async () => {
    try {
      let result = await dbExec("SELECT * FROM games WHERE finished_at is NULL")
      if (!result.rows.length) {
        setNoActiveGame(true)
        return
      }
      setGames([...result.rows])
    } catch (e) {
      console.error(e)
    }
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">Continue</Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6">Games</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Started at</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { games.map(game => {
              return <>
                <TableRow key={ game.id }>
                  <TableCell>{ game.id }</TableCell>
                  <TableCell>{ formatDatetime(game.created_at) }</TableCell>
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
          <Alert severity="error">Not active game</Alert>
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