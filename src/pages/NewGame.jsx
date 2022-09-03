import { onMount, createSignal, Show } from 'solid-js'
import { Link, useNavigate } from '@solidjs/router'

import Grid from '@suid/material/Grid'
import Button from '@suid/material/Button'
import Paper from '@suid/material/Paper'
import List from '@suid/material/List'
import ListItem from '@suid/material/ListItem'
import ListItemButton from '@suid/material/ListItemButton'
import ListItemText from '@suid/material/ListItemText'
import Checkbox from '@suid/material/Checkbox'
import Modal from '@suid/material/Modal'
import Typography from '@suid/material/Typography'
import TextField from '@suid/material/TextField'
import Alert from '@suid/material/Alert'
import IconButton from '@suid/material/IconButton'
import FormControlLabel from '@suid/material/FormControlLabel'
import EditIcon from '@suid/icons-material/Edit'
import PlaylistAddIcon from '@suid/icons-material/PlaylistAdd'

import { dbExec } from '../websql'
import { prefix } from '../router'
import { getSetting } from '../mixins'

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

export default function NewGame() {
  const navigate = useNavigate()
  const [player, setPlayer] = createSignal('')
  const [players, setPlayers] = createSignal([])
  const [checked, setChecked] = createSignal([])
  const [exception, setException] = createSignal(false)
  const [open, setOpen] = createSignal(false)
  const [updateUserId, setUpdateUserId] = createSignal(null)
  const [goalChecked, setGoalChecked] = createSignal(false)
  const [goal, setGoal] = createSignal('250')

  onMount(async () => {
    const goal = await getSetting('GOAL')
    goal && setGoal(goal)
    await getPlayers()
  })

  const getPlayers = async () => {
    try {
      let result = await dbExec("SELECT * FROM users")
      setPlayers([...result.rows])
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggle = (value) => () => {
    const currentIndex = checked().indexOf(value)
    const newChecked = [...checked()]

    if (currentIndex === -1) {
      newChecked.push(value)
    } else {
      newChecked.splice(currentIndex, 1)
    }

    setChecked(newChecked)
  }

  const handleCreateGame = async () => {
    if (checked().length < 2) {
      setException(true)
      return
    }

    let g = null
    if (goalChecked()) {
      g = +goal() > 0 ? +goal() : null
      try {
        let result = await dbExec(`UPDATE settings SET value = ? WHERE key = 'GOAL'`, [g.toString()])
        if (!result.rowsAffected) {
          await dbExec(`INSERT INTO settings (key, value) VALUES ('GOAL', ?)`, [g.toString()])
        }
      } catch (e) {
        console.error(e)
      }
    }

    let newGameId
    try {
      let result = await dbExec("INSERT INTO games (goal) VALUES (?)", [g])
      newGameId = result.insertId
      checked().forEach(async value => {
        await dbExec("INSERT INTO players (game_id, user_id) VALUES (?, ?)", [newGameId, value])
      })
    } catch (e) {
      console.error(e)
      return
    }

    navigate(`${prefix}/game/${newGameId}/round`)
  }

  const handleModalOpen = () => setOpen(true)
  
  const handleCloseModal = () => {
    setOpen(false)
    setPlayer('')
    setUpdateUserId(null)
  }

  const handleAddPlayer = async () => {
    let newPlayerId
    try {
      let result = await dbExec("INSERT INTO users (name) VALUES (?)", [player()])
      newPlayerId = result.insertId
    } catch (e) {
      console.error(e)
      return
    }
    const newPlayer = { id: newPlayerId, name: player() }
    setPlayers([...players(), newPlayer])
    handleCloseModal()
  }

  const handleModalEdit = (user) => () => {
    setPlayer(user.name)
    setUpdateUserId(user.id)
    setOpen(true)
  }

  const handleEditPlayer = async () => {
    try {
      await dbExec("UPDATE users SET name = ? WHERE id = ?", [player(), updateUserId()])
    } catch (e) {
      console.error(e)
      return
    }
    const updatedPlayer = { id: updateUserId(), name: player() }
    setPlayers(players().map(p => p.id === updatedPlayer.id ? updatedPlayer : p))
    handleCloseModal()
  }

  const handleGoalChecked = (event) => {
    setGoalChecked(!event.target.checked)
  }

  const handleGoal = (event) => {
    const goal = event.target.value.replace(/[^0-9]/g, '')
    setGoal(goal)
  }

  return <>
    <Grid container alignContent="center" rowSpacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1">New game</Typography>
      </Grid>

      <Grid item xs={12} container justifyContent="end">
        <Button onClick={ handleModalOpen } variant="contained" startIcon={<PlaylistAddIcon />}>Add Player</Button>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6">Players</Typography>
        <Paper sx={{ width: '100%', maxHeight: '200px', overflow: 'auto', margin: '0 auto' }} variant="outlined">
          <List dense sx={{ width: '100%', minHeight: '190px', bgcolor: 'background.paper' }}>
            { players().map((value) => {
              const labelId = `checkbox-list-secondary-label-${value.id}`
              return <>
                <ListItem sx={{ height: '50px'}} disablePadding
                  secondaryAction={
                    <IconButton onClick={ handleModalEdit(value) } edge="end" color="primary">
                      <EditIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={ handleToggle(value.id) }>
                    <Checkbox edge="start"
                      checked={ checked().indexOf(value.id) !== -1 }
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                    <ListItemText primary={ value.name } />
                  </ListItemButton>
                </ListItem>
              </>
            }) }
          </List>
        </Paper>
      </Grid>

      <Show when={exception()}>
        <Grid item xs={12} container justifyContent="center">
          <Alert severity="error">Select at least two players</Alert>
        </Grid>
      </Show>

      <Grid item xs={12} container justifyContent="center">
        <FormControlLabel label="Set goal" control={
          <Checkbox checked={ goalChecked() } onChange={ handleGoalChecked } sx={{ '& .MuiSvgIcon-root': { fontSize: 30 } }} />
        } />
        <Show when={ goalChecked() }>
          <TextField value={ goal() }
            onChange={ handleGoal }
            sx={{ maxWidth: '120px' }}
            inputProps={{ inputMode: 'numeric' }}
          />
        </Show>
      </Grid>

      <Grid item xs={12} container justifyContent="center">
        <Button onClick={ handleCreateGame } sx={{ minWidth: '200px' }} variant="contained" color="success">Start the Game</Button>
      </Grid>

      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/`}>
          <Button sx={{ minWidth: '200px' }} variant="outlined">Main Menu</Button>
        </Link>
      </Grid>
    </Grid>

    <Modal
      open={ open() }
      onClose={ handleCloseModal }
      aria-labelledby="modal-modal-title"
    >
      <Paper sx={style}>
        <Grid container justifyContent="center" alignItems="center" alignContent="center" spacing={1}>
          <Typography id="modal-modal-title" variant="h6" component="h2">Add Player</Typography>

          <Grid item xs={12}>
            <TextField value={ player() }
              onChange={(event) => setPlayer(event.target.value)}
              sx={{ width: '100%' }}
              label="Player"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} container justifyContent="end">
            <Button onClick={ handleCloseModal } sx={{ minWidth: '100px', marginRight: '1rem' }} >Close</Button>
            <Show when={updateUserId()} fallback={
              <Button onClick={ handleAddPlayer } sx={{ minWidth: '100px' }} variant="contained">Add</Button>
            }>
              <Button onClick={ handleEditPlayer } sx={{ minWidth: '100px' }} variant="contained">Edit</Button>
            </Show>
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  </>
}