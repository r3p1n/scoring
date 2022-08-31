import { createSignal, onMount, Show, For, Switch, Match } from 'solid-js'
import { useParams, Link } from '@solidjs/router'

import styled from '@suid/system/styled'
import Grid from '@suid/material/Grid'
import Typography from '@suid/material/Typography'
import Table from '@suid/material/Table'
import TableHead from '@suid/material/TableHead'
import TableBody from '@suid/material/TableBody'
import TableRow from '@suid/material/TableRow'
import TableCell from '@suid/material/TableCell'
import Button from '@suid/material/Button'
import Alert from '@suid/material/Alert'
import IconButton from '@suid/material/IconButton'
import PivotTableChartIcon from '@suid/icons-material/PivotTableChart'

import { dbExec } from '../websql'
import { prefix } from '../router'

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#eee',
  },
}))

export default function Results() {
  const params = useParams()
  const [results, setResults] = createSignal([])
  const [isActiveGame, setIsActiveGame] = createSignal(false)
  const [isRowByPlayer, setIsRowByPlayer] = createSignal(true)

  onMount(async () => {
    getRowByPlayer()
  })

  const gerRandomColor = () => {
    const letters = '789ABCDEF'
    let color = '#'
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 9)]
    }
    return color
  }

  const getRowByPlayer = async () => {
    try {
      let result = await dbExec(`
        SELECT p.id, u.name, SUM(s.score) total_score, null scores FROM games g
          JOIN users u ON u.id = p.user_id
          JOIN players p ON p.game_id = g.id
          JOIN rounds r ON r.game_id = g.id
          JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
          WHERE g.id = ? -- AND NOT g.finished_at IS NULL
          GROUP BY p.id
          ORDER BY SUM(s.score) DESC
      `, [params.id])
      
      if (!result.rows.length) {
        setIsActiveGame(true)
        return
      }

      const players = [...result.rows]
      for (const item of players) {
        result = await dbExec(`
          SELECT r.number round_number, s.score FROM games g
            JOIN players p ON p.game_id = g.id AND p.id = ?
            JOIN rounds r ON r.game_id = g.id
            JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
            WHERE g.id = ?
            ORDER BY r.number
        `, [item.id, params.id])
        item.scores = [...result.rows]
      }
      setResults(players)
    } catch (e) {
      console.error(e)
    }
  }

  const getRowByRound = async () => {
    try {
      let result = await dbExec(`
        SELECT r.id, r.number, null scores FROM games g
          JOIN rounds r ON r.game_id = g.id
          WHERE g.id = ?
          ORDER BY r.number
      `, [params.id])

      if (!result.rows.length) {
        setIsActiveGame(true)
        return
      }

      const rounds = [...result.rows]

      result = await dbExec(`
        SELECT p.id, u.name, SUM(s.score) total_score FROM games g
          JOIN users u ON u.id = p.user_id
          JOIN players p ON p.game_id = g.id
          JOIN rounds r ON r.game_id = g.id
          JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
          WHERE g.id = ?
          GROUP BY p.id
          ORDER BY SUM(s.score) DESC
      `, [params.id])

      const players = [...result.rows]

      for (const round of rounds) {
        for (const player of players) {
          result = await dbExec(`
            SELECT p.id, s.score FROM games g
              JOIN players p ON p.game_id = g.id AND p.id = ?
              JOIN rounds r ON r.game_id = g.id AND r.id = ?
              JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
              WHERE g.id = ?
          `, [player.id, round.id, params.id])
          round.scores = round.scores === null ? [...result.rows] : [...round.scores, ...result.rows]
        }
      }

      let colors = []
      for (const player of players) {
        colors = [...colors, gerRandomColor()]
      }
      
      setResults({players, rounds, colors})
    } catch (e) {
      console.error(e)
    }
  }

  const handlerClickChangeFormat = async () => {
    setIsRowByPlayer(!isRowByPlayer())

    isRowByPlayer() ? await getRowByPlayer() : await getRowByRound()
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography id="modal-modal-title" variant="h4" component="h1">Game results</Typography>
      </Grid>

      <Grid item xs={12} container justifyContent="end">
        <IconButton onClick={ handlerClickChangeFormat } color="primary">
          <PivotTableChartIcon />
        </IconButton>
      </Grid> 

      <Grid item xs={12} sx={{ overflow: 'auto' }}>
        <Switch>
          <Match when={isRowByPlayer()}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#ddd' }}>
                  <TableCell>Player</TableCell>
                  <TableCell align="right" sx={{ minWidth: '100px' }}>Total score</TableCell>
                  <Show when={results().length > 0 && results()[0].scores}>
                    <For each={results()[0].scores}>
                      { score => <TableCell align="right" sx={{ minWidth: '100px' }}>Round { score.round_number }</TableCell> }
                    </For>
                  </Show>
                </TableRow>
              </TableHead>
              <TableBody>
                <Show when={results().length > 0 && results()[0].scores}>
                  <For each={results()}>
                    { p => (
                      <StyledTableRow>
                        <TableCell>{ p.name }</TableCell>
                        <TableCell align="right">
                          <strong>{ p.total_score }</strong>
                        </TableCell>
                        <For each={p.scores}>
                          { score => <TableCell align="right">{ score.score }</TableCell> }
                        </For>
                      </StyledTableRow>
                    )}
                  </For>
                </Show>
              </TableBody>
            </Table>
          </Match>
          <Match when={!isRowByPlayer()}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#ddd' }}>
                  <TableCell sx={{ width: 100 }}>Player</TableCell>
                  <Show when={results().hasOwnProperty('players')}>
                    <For each={results().players}>
                      { (p, i) => (
                        <TableCell sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', backgroundColor: results().colors[i()] }}>
                          { p.name }
                        </TableCell>
                      )}
                    </For>
                  </Show>
                </TableRow>
              </TableHead>
              <TableBody>
                <Show when={results().hasOwnProperty('rounds')}>
                  <For each={results().rounds}>
                    { r => (
                      <StyledTableRow>
                        <TableCell>Round { r.number }</TableCell>
                        <For each={r.scores}>
                          { (s, i) => <TableCell  align="center" sx={{ backgroundColor: results().colors[i()] }}>{ s.score }</TableCell> }
                        </For>
                      </StyledTableRow>
                    )}
                  </For>
                  <StyledTableRow style={{ fontWeight: 'bold' }}>
                    <TableCell>
                      <strong>Total Score</strong>
                    </TableCell>
                    <For each={results().players}>
                      { (p, i) => (
                        <TableCell align="center" sx={{ backgroundColor: results().colors[i()] }}>
                          <strong>{ p.total_score }</strong>
                        </TableCell>
                      )}
                    </For>
                  </StyledTableRow>
                </Show>
              </TableBody>
            </Table>
          </Match>
        </Switch>
      </Grid>

      <Show when={isActiveGame()}>
        <Grid item xs={12} container justifyContent="center">
          <Alert severity="error">Game not found</Alert>
        </Grid>
      </Show>

      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/`}>
          <Button sx={{ minWidth: '200px', mb: 1 }} variant="contained">Main Menu</Button>
        </Link>
      </Grid>
    </Grid>
  </>
}