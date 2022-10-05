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
import PivotTableChartIcon from '@suid/icons-material/PivotTableChart'

import { prefix } from '../router'
import db from '../mixins/database'
import { randomColor } from '../mixins/global'

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#eee',
  },
}))

export default function Results() {
  const params = useParams()
  const [results, setResults] = createSignal([])
  const [isActiveGame, setIsActiveGame] = createSignal(false)
  const [view, setView] = createSignal('rounds')

  onMount(async () => {
    const view = await db.getSetting('RESULT_VIEW')
    view && setView(view)
    await changeFormat()
  })

  

  const setSettingsView = async () => {
    await db.setSetting('RESULT_VIEW', view())
  }

  const getViewByPlayer = async () => {
    let rows = await db.getPlayersAndTotalScoreAndScores(params.id)
    if (!rows.length) {
      setIsActiveGame(true)
      return
    }
    const players = rows

    for (const player of players) {
      rows = await db.getRoundAndScoreByPlayerId(params.id, player.id)
      player.scores = rows
    }
    setResults(players)
  }

  const getViewByRound = async () => {
    let rows = await db.getRoundByNumber(params.id)
    if (!rows.length) {
      setIsActiveGame(true)
      return
    }
    const rounds = rows

    const players = await db.getPlayersAndTotalScore(params.id)
    for (const round of rounds) {
      for (const player of players) {
        rows = await db.getScoreByPlayerIdAndRoundId(params.id, player.id, round.id)
        round.scores = round.scores === null ? rows : [...round.scores, ...rows]
      }
    }

    let colors = []
    players.forEach(() => colors = [...colors, randomColor()])
    setResults({players, rounds, colors})
  }

  const changeFormat = async () => {
    view() === 'players' ? await getViewByPlayer() : await getViewByRound()
  }

  const handlerClickChangeFormat = () => {
    setView(view() === 'players' ? 'rounds' : 'players')
    changeFormat()
    setSettingsView()
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography id="modal-modal-title" variant="h4" component="h1">Game results</Typography>
      </Grid>

      <Grid item xs={12} container justifyContent="end">
        <Button onClick={ handlerClickChangeFormat } variant="contained" startIcon={<PivotTableChartIcon />}>Change view</Button>
      </Grid>

      <Grid item xs={12} sx={{ overflow: 'auto' }}>
        <Switch>
          <Match when={view() === 'players'}>
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
          <Match when={view() === 'rounds'}>
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
          <Button sx={{ minWidth: '200px', mb: 1 }} variant="outlined">Main Menu</Button>
        </Link>
      </Grid>
    </Grid>
  </>
}