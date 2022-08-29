import { Link } from '@solidjs/router'

import Grid from '@suid/material/Grid'
import Button from '@suid/material/Button'
import Typography from '@suid/material/Typography'

import { prefix } from '../router'

export default function Home() {
  return <>
    <Grid container justifyContent="center" alignItems="center" alignContent="center" sx={{ height: "100vh" }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1" align="center">Welcome to Scoring!</Typography>
      </Grid>

      <Grid item xs={12} container justifyContent="center">
        <span style={{color: 'rgba(0,0,0,0.25)', 'font-size': '0.75rem'}}>
          { import.meta.env.VITE_VERSION }
        </span>
      </Grid>

      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/new-game`}>
          <Button variant="contained" sx={{ minWidth: '200px', mt: 2 }} color="success">New Game</Button>
        </Link>
      </Grid>

      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/continue`}>
          <Button variant="contained" sx={{ minWidth: '200px', mt: 2 }}>Continue</Button>
        </Link>
      </Grid>
    </Grid>
  </>
}