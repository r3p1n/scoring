import { onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'

import { prefix } from '../router'

export default function NotFound() {
  const navigate = useNavigate()

  onMount(async () => {
    navigate(`${prefix}/`)
  })

  return <></>
}