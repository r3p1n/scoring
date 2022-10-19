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
import Modal from '@suid/material/Modal'
import Paper from '@suid/material/Paper'
import IconButton from '@suid/material/IconButton'
import Stack from '@suid/material/Stack'

import SettingsIcon from '@suid/icons-material/Settings'
import QueryStatsIcon from '@suid/icons-material/QueryStats'
import EditIcon from '@suid/icons-material/Edit'

import { prefix } from '../router'
import db from '../mixins/database'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 310,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
}

export default function Round() {
  const params = useParams()
  const navigate = useNavigate()
  const [roundNumber, setRoundNumber] = createSignal(0)
  const [gameNotFound, setGameNotFound] = createSignal(false)
  const [emptyScore, setEmptyScore] = createSignal(false)
  const [goal, setGoal] = createSignal(0)
  const [openModal, setOpenModal] = createSignal(false)
  const [modalParams, setModalParams] = createSignal({ playerId: 0, score: 0 })
  const [multiplier, setMultiplier] = createSignal(1)
  const [lastRoundMaxScorePlayerId, setLastRoundMaxScorePlayerId] = createSignal(0)
  const [scores, setScores] = createStore([])

  onMount(async () => {
    if (await isFinishedGame(params.id)) {
      navigate(`${prefix}/game/${params.id}/results`)
    } else {
      await getRound(params.id)
      await getScore(params.id)
      await getLastRoundMaxScorePlayerId(params.id)
      setGoal(await db.getGameGoal(params.id))
    }
  })

  const isFinishedGame = async (gameId) => {
    const finishedAt = await db.getGameFinishedAt(gameId)
    return finishedAt !== null
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
    setScores(rows)
  }

  const getLastRoundMaxScorePlayerId = async (gameId) => {
    const rows = await db.getLastRoundMaxScore(gameId)
    if (!rows.length) {
      setLastRoundMaxScorePlayerId(0)
    } else if (rows.length > 1) {
      const id = rows.map(v => v.player_id)[getRndInteger(0, rows.length)]
      setLastRoundMaxScorePlayerId(id)
    } else {
      setLastRoundMaxScorePlayerId(rows[0].player_id)
    }
  }

  const isNotEmptyScore = () => scores.find(s => s.score !== 0)
  const isNotEmptyTotalScore = () => scores.find(s => s.total_score !== 0)
  const isGoalAchieved = () => scores.find(s => s.total_score > goal())
  const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min)) + min

  const saveRoundData = async (gameId) => {
    const newRoundId = await db.addRound(gameId, roundNumber())
    if (!newRoundId) {
      return false
    }
    scores.forEach(async score => await db.addScore(newRoundId, score.player_id, calcScore(score.score, multiplier())))
    return true
  }

  const calcScore = (score, multiplier) => score * multiplier

  const getRowBgColor = (playerId) => lastRoundMaxScorePlayerId() === playerId ? 'radial-gradient(circle, rgba(200,200,200,1) 0%, rgba(0,0,0,0) 100%)' : ''

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
    setMultiplier(1)
  }

  const handlerSetMultiplier = () => {
    const mult = multiplier() + 1
    setMultiplier(mult <= 5 ? mult : 1)
  }

  const handlerStats = () => {
    navigate(`${prefix}/game/${params.id}/stats`)
  }

  const handlerSettings = () => {
    navigate(`${prefix}/game/${params.id}/settings`)
  }

  const handleOpenModal = params => event => {
    setModalParams(params)
    setOpenModal(true)
  }
  
  const handleCloseModal = () => {
    setOpenModal(false)
  }

  const handleSetModalScore = () => {
    const lastRoundScore = scores.find(score => score.player_id === modalParams().playerId).last_round_score
    setScores(score => score.player_id === modalParams().playerId, 'score', modalParams().score)
    setScores(score => score.player_id === modalParams().playerId, 'total_score', lastRoundScore + modalParams().score)
    setEmptyScore(false)
    handleCloseModal()
  }

  const handlerChangeModalScores = id => event => {
    const newScore = +event.target.value.replace(/[^0-9]/g, '')
    if (newScore === 0 && event.target.selectionStart === 0) {
      const end = event.target.value.length
      event.target.focus()
      event.target.setSelectionRange(end, end)
    }
    setModalParams({ playerId: id, score: newScore })
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">Round { roundNumber() }</Typography>
      </Grid>

      <Grid item xs={12} container justifyContent="end">
        <Stack direction="row" spacing={3}>
          <IconButton onClick={ handlerSetMultiplier } edge="end" color="primary">x{ multiplier() }</IconButton>
          <IconButton onClick={ handlerStats } edge="end" color="primary">
            <QueryStatsIcon />
          </IconButton>
          <IconButton onClick={ handlerSettings } edge="end" color="primary">
            <SettingsIcon />
          </IconButton>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { scores.map(score => {
              return <>
                <TableRow key={ score.player_id } sx={{ background: getRowBgColor(score.player_id) }}>
                  <TableCell>{ score.player_name }</TableCell>
                  <TableCell sx={{ minWidth: '120px' }} align="right">
                    <Show when={multiplier() > 1} fallback={ score.score }>
                      { score.score } x { multiplier() } = { calcScore(score.score, multiplier()) }
                    </Show>
                    <hr />
                    Total: { score.total_score }
                  </TableCell>
                  <TableCell sx={{ p: 0 }} align="center">
                    <IconButton onClick={ handleOpenModal({ playerId: score.player_id, score: score.score }) } edge="end" color="primary">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </>
            }) }

            <Show when={goal() > 0}>
              <TableRow>
                <TableCell></TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2">Goal: { goal() }</Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </Show>

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

    <Modal
      open={ openModal() }
      onClose={ handleCloseModal }
      aria-labelledby="modal-modal-title"
    >
      <Paper sx={ style }>
        <Grid container justifyContent="center" alignItems="center" alignContent="center" spacing={ 1 }>
          <Typography id="modal-modal-title" variant="h6" component="h2">Set Score</Typography>

          <Grid item xs={12}>
            <TextField sx={{ width: '100%' }}
              label="Score"
              variant="outlined"
              inputProps={{ inputMode: 'numeric' }}
              value={ modalParams().score.toString() }
              onChange={ handlerChangeModalScores(modalParams().playerId) }
            />
          </Grid>

          <Grid item xs={12} container justifyContent="end">
            <Button onClick={ handleCloseModal } sx={{ minWidth: '100px', marginRight: '1rem' }} >Close</Button>
            <Button onClick={ handleSetModalScore } sx={{ minWidth: '100px' }} variant="contained">Apply</Button>
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  </>
}