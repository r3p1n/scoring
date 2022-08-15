import { Link } from '@solidjs/router'

import Grid from '@suid/material/Grid'
import Button from '@suid/material/Button'

import { prefix } from '../router'

export default function Home() {
  return <>
    <Grid container justifyContent="center" alignItems="center" alignContent="center" style={{ height: "100vh" }}>
      <Grid item xs={12} container justifyContent="center">
        <h1>Welcome to Scoring!</h1>
      </Grid>
      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/new-game`}>
          <Button variant="contained">New Game</Button>
        </Link>
      </Grid>
    </Grid>
  </>
}