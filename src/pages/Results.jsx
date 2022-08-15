import { createSignal, onMount, Show, For } from 'solid-js'
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

  onMount(async () => {
    // get rounds, players, scores  CREATE TEMP TABLE players_by_high_score AS
    try {
      /*
      await transaction(db, `
        CREATE TEMPORARY TABLE tmp (
          id INTEGER PRIMARY KEY,
          player_id INTEGER,
          player_name TEXT,
          total_score INTEGER,
          game_id INTEGER,
          number_of_rounds INTEGER
        )
      `)

      await transaction(db, `
        INSERT INTO tmp (player_id, player_name, total_score, game_id, number_of_rounds)
          SELECT p.id, u.name, SUM(s.score), g.id, MAX(r.number) FROM games g
            JOIN users u ON u.id = p.user_id
            JOIN players p ON p.game_id = g.id
            JOIN rounds r ON r.game_id = g.id
            JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
            WHERE g.id = ? -- AND NOT g.finished_at IS NULL
            GROUP BY p.id
            ORDER BY SUM(s.score) DESC
      `, [params.id])

      let result = await transaction(db, `
        SELECT p.player_id, p.player_name, p.total_score, r.number round_number, s.score, p.number_of_rounds FROM tmp p
          JOIN rounds r ON r.game_id = p.game_id
          JOIN scores s ON s.round_id = r.id AND s.player_id = p.player_id
          ORDER BY p.id, r.number
      `)

      await transaction(db, `
        DROP TABLE tmp
      `)
      */

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
  })

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography id="modal-modal-title" variant="h4" component="h1">Game results</Typography>
      </Grid>

      <Grid item xs={12} sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#ddd' }}>
              <TableCell>Player</TableCell>
              <Show when={results().length > 0 && results()[0].scores}>
                <For each={results()[0].scores}>
                  { score => <TableCell align="right" sx={{ minWidth: '100px' }}>Round { score.round_number }</TableCell> }
                </For>
              </Show>
              <TableCell align="right" sx={{ minWidth: '100px' }}>Total score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <Show when={results().length > 0 && results()[0].scores}>
              <For each={results()}>
                { p => (
                  <StyledTableRow>
                    <TableCell>{ p.name }</TableCell>
                      <For each={p.scores}>
                        { score => <TableCell align="right">{ score.score }</TableCell> }
                      </For>
                    <TableCell align="right">
                      <strong>{ p.total_score }</strong>
                    </TableCell>
                  </StyledTableRow>
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
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