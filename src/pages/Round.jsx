import { createSignal, onMount, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useParams, Link, useNavigate } from '@solidjs/router'

import Grid from '@suid/material/Grid'
import Typography from '@suid/material/Typography'
import Button from '@suid/material/Button'
import Table from '@suid/material/Table'
import TableHead from '@suid/material/TableHead'
import TableBody from '@suid/material/TableBody'
import TableRow from '@suid/material/TableRow'
import TableCell from '@suid/material/TableCell'
import TextField from '@suid/material/TextField'
import Alert from '@suid/material/Alert'
import SettingsIcon from '@suid/icons-material/Settings'

import { prefix } from '../router'
import db from '../mixins/database'

export default function Round() {
  const params = useParams()
  const navigate = useNavigate()
  const [roundNumber, setRoundNumber] = createSignal(0)
  const [gameNotFound, setGameNotFound] = createSignal(false)
  const [emptyScore, setEmptyScore] = createSignal(false)
  const [scores, setScores] = createStore([])
  const [goal, setGoal] = createSignal(0)

  onMount(async () => {
    if (await isFinishedGame(params.id)) {
      navigate(`${prefix}/game/${params.id}/results`)
    } else {
      await getRound(params.id)
      await getScore(params.id)
      const rows = await db.getGameGoal(params.id)
      if (rows.length) {
        setGoal(rows[0].goal)
      }
    }
  })

  const isFinishedGame = async (gameId) => {
    const rows = await db.getGameFinishedAt(gameId)
    if (rows.length && rows[0].finished_at) {
      return true
    }
    return false
  }

  const getRound = async (gameId) => {
    const lastRound = await db.getLastRound(gameId)
    setRoundNumber(lastRound + 1)
  }

  const getScore = async (gameId) => {
    const rows = await db.getLastRoundScore(gameId)
    if (!rows.length) {
      setGameNotFound(true)
      return
    }
    setScores([...rows])
  }

  const isNotEmptyScore = () => scores.find(s => s.score !== 0)
  const isNotEmptyTotalScore = () => scores.find(s => s.total_score !== 0)
  const isGoalAchieved = () => scores.find(s => s.total_score > goal())

  const saveRoundData = async (gameId) => {
    const newRoundId = await db.addRound(gameId, roundNumber())
    if (!newRoundId) {
      return false
    }
    scores.forEach(async score => await db.addScore(newRoundId, score.player_id, score.score))
    return true
  }

  const handlerChangeScores = id => event => {
    const newScore = +event.target.value.replace(/[^0-9]/g, '')
    const lastRoundScore = scores.find(score => score.player_id === id).last_round_score
    setScores(score => score.player_id === id, 'score', newScore)
    setScores(score => score.player_id === id, 'total_score', lastRoundScore + newScore)
    setEmptyScore(false)
    if (newScore === 0 && event.target.selectionStart === 0) {
      const end = event.target.value.length
      event.target.focus()
      event.target.setSelectionRange(end, end)
    }
  }

  const handlerClickFinishGame = async () => {
    if (isNotEmptyScore()) {
      const success = await saveRoundData(params.id)
      if (!success) {
        return
      }
    }

    if (!isNotEmptyTotalScore()) {
      setEmptyScore(true)
      return
    }

    const rowsAffected = await db.setGameFinishedAtNow(params.id)
    if (!rowsAffected) {
      return
    }

    navigate(`${prefix}/game/${params.id}/results`)
  }

  const handlerClickNextRound = async () => {
    if (!isNotEmptyScore()) {
      setEmptyScore(true)
      return
    }

    if (goal() > 0 && isGoalAchieved()) {
      await handlerClickFinishGame()
      return
    }

    const success = await saveRoundData(params.id)
    if (!success) {
      return
    }
    await getRound(params.id)
    await getScore(params.id)
  }

  const handlerSettings = () => {
    navigate(`${prefix}/game/${params.id}/settings`)
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">Round { roundNumber() }</Typography>
      </Grid>

      <Grid item xs={12} container justifyContent="end">
        <Button onClick={ handlerSettings } variant="contained" startIcon={<SettingsIcon />}>Settings</Button>
      </Grid>

      <Grid item xs={12}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell align="right">Score by round</TableCell>
              <TableCell align="right">Total score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { scores.map(score => {
              return <>
                <TableRow key={ score.player_id }>
                  <TableCell>{ score.player_name }</TableCell>
                  <TableCell align="right">
                    <TextField value={ score.score.toString() }
                      key={ score.player_id }
                      onChange={ handlerChangeScores(score.player_id) }
                      sx={{ maxWidth: '120px' }}
                      inputProps={{ inputMode: 'numeric' }}
                    />
                  </TableCell>
                  <TableCell align="right">{ score.total_score.toString() }</TableCell>
                </TableRow>
              </>
            }) }
          </TableBody>
        </Table>
      </Grid>

      <Show when={emptyScore()}>
        <Grid item xs={12} container justifyContent="center">
          <Alert severity="error">Empty score</Alert>
        </Grid>
      </Show>

      <Show when={!gameNotFound()}
        fallback={
          <Grid item xs={12} container justifyContent="center">
            <Alert severity="error">Game not found</Alert>
          </Grid>
        }
      >
        <Grid item xs={12} container justifyContent="center">
          <Button onClick={ handlerClickNextRound } sx={{ minWidth: '200px', mb: 1 }} variant="contained" color="success">Next Round</Button>
        </Grid>

        <Grid item xs={12} container justifyContent="center">
          <Button onClick={ handlerClickFinishGame } sx={{ minWidth: '200px', mb: 1 }} variant="contained">Finish the Game</Button>
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