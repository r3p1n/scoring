import { Link } from '@solidjs/router'

import Grid from '@suid/material/Grid'
import Button from '@suid/material/Button'
import Typography from '@suid/material/Typography'

import { prefix } from '../router'

export default function Home() {
  return <>
    <Grid container justifyContent="center" alignItems="center" alignContent="center" rowSpacing={2} sx={{ height: "100vh" }}>
      <Grid item xs={12} container justifyContent="center">
        <Typography variant="h4" component="h1" align="center">Welcome to Scoring!</Typography>
      </Grid>
      <Grid item xs={12} container justifyContent="center">
        <Link class="btn-link" href={`${prefix}/new-game`}>
          <Button variant="contained" sx={{ minWidth: '200px' }} >New Game</Button>
        </Link>
      </Grid>
    </Grid>
  </>
}