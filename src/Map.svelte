<div bind:this={container}>
  {#if map}
  <slot></slot>
  {/if}
</div>

<style>
  div {
    width: 100%;
    height: 100%;
  }
</style>

<script>
  import { onMount, createEventDispatcher, setContext } from 'svelte'
  import { contextKey } from './mapbox.js'

  setContext(contextKey, {
    getMap: () => map,
    getMapbox: () => mapbox
	})

  const dispatch = createEventDispatcher()

  let container
  let map
  let mapbox

  export let options = {}
  export let accessToken
  export let style = 'mapbox://styles/mapbox/streets-v11'

  export function setCenter (center, zoom) {
    el.setCenter(center)
    if (zoom && Number.isInteger(zoom)) {
      el.setZoom(zoom)
    }
  }

  onMount(async () => {
    const mapboxModule = await import('mapbox-gl')
    mapbox = mapboxModule.default
    mapbox.accessToken = accessToken

    const link = document.createElement('link')
		link.rel = 'stylesheet'
		link.href = 'https://unpkg.com/mapbox-gl/dist/mapbox-gl.css'

    let el

		link.onload = () => {
      el = new mapbox.Map({
        container,
        style,
        ...options
      })

      el.on('dragend', () => dispatch('recentre', { center: el.getCenter() }))

      el.on('load', () => {
        map = el
        dispatch('ready')
      })
    }

    document.head.appendChild(link)

    return () => {
      map.remove()
      link.parentNode.removeChild(link)
    }
  })
</script>