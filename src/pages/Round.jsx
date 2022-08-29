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

import { dbExec } from '../websql'
import { prefix } from '../router'

export default function Round() {
  const params = useParams()
  const navigate = useNavigate()
  const [roundNumber, setRoundNumber] = createSignal(0)
  const [gameNotFound, setGameNotFound] = createSignal(false)
  const [emptyScore, setEmptyScore] = createSignal(false)
  const [scores, setScores] = createStore([])

  onMount(async () => {
    if (await isFinishedGame(params.id)) {
      navigate(`${prefix}/game/${params.id}/results`)
    } else {
      await getRound(params.id)
      await getScore(params.id)
    }
  })

  const isFinishedGame = async (gameId) => {
    try {
      let result = await dbExec("SELECT finished_at FROM games WHERE id = ?", [gameId])
      if (result.rows.length && result.rows[0].finished_at) {
        return true
      }
      return false
    } catch (e) {
      console.error(e)
    }
  }

  const getRound = async (gameId) => {
    try {
      let result = await dbExec("SELECT r.number, r.id FROM rounds r WHERE r.game_id = ? ORDER BY id DESC LIMIT 1", [gameId])
      if (result.rows.length) {
        setRoundNumber(result.rows[0].number + 1)
      } else {
        setRoundNumber(1)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getScore = async (gameId) => {
    try {
      let result = await dbExec(`
        SELECT p.id AS player_id, u.name AS player_name, SUM(IFNULL(s.score, 0)) AS last_round_score, 0 AS score,
          SUM(IFNULL(s.score, 0)) AS total_score, g.finished_at FROM games g
          JOIN users u ON u.id = p.user_id
          JOIN players p ON p.game_id = g.id
          LEFT JOIN rounds r ON r.game_id = g.id
          LEFT JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
          WHERE g.id = ?
          GROUP BY p.id
      `, [gameId])
      if (!result.rows.length) {
        setGameNotFound(true)
        return
      }
      setScores([...result.rows])
    } catch (e) {
      console.error(e)
    }
  }

  const isNotEmptyScore = () => scores.find(s => s.score !== 0)
  const isNotEmptyTotalScore = () => scores.find(s => s.total_score !== 0)

  const saveRoundData = async (gameId) => {
    try {
      let result = await dbExec("INSERT INTO rounds (number, game_id) VALUES (?, ?)", [roundNumber(), gameId])
      let newRoundId = result.insertId
      scores.forEach(async score => {
        await dbExec("INSERT INTO scores (round_id, player_id, score) VALUES (?, ?, ?)", [newRoundId, score.player_id, score.score])
      })
    } catch (e) {
      console.error(e)
      return false
    }
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

    try {
      await dbExec("UPDATE games SET finished_at = datetime('now') WHERE id = ?", [params.id])
    } catch (e) {
      console.error(e)
      return
    }

    navigate(`${prefix}/game/${params.id}/results`)
  }

  const handlerClickNextRound = async () => {
    if (!isNotEmptyScore()) {
      setEmptyScore(true)
      return false
    }
    const success = await saveRoundData(params.id)
    if (!success) {
      return
    }
    await getRound(params.id)
    await getScore(params.id)
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">Round { roundNumber() }</Typography>
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