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
  import loader from '@beyonk/async-script-loader'
  import { onMount, createEventDispatcher, setContext } from 'svelte'
  import { contextKey } from './mapbox.js'

  setContext(contextKey, {
    getMap: () => map,
    getMapbox: () => mapbox
	})

  const dispatch = createEventDispatcher()

  export let map = null
  export let version = 'v1.10.0'

  let container
  let mapbox

  export let options = {}
  export let accessToken
  export let style = 'mapbox://styles/mapbox/streets-v11'

  export function setCenter (center, zoom) {
    if (map) {
      map.setCenter(center)
      if (zoom && Number.isInteger(zoom)) {
        map.setZoom(zoom)
      }
    }
  }

  export function flyTo(destination) {
    map && map.flyTo(destination)
  }

  export function resize () {
    map && map.resize()
  }

  export function getMap () {
    return map
  }

  function onAvailable () {
    mapbox = mapboxgl
    mapboxgl.accessToken = accessToken
    const optionsWithDefaults = Object.assign({
      container,
      style
    }, options)

    const el = new mapbox.Map(optionsWithDefaults)

    el.on('dragend', () => dispatch('recentre', { center: el.getCenter() }))

    el.on('load', () => {
      map = el
      dispatch('ready')
    })
  }

  onMount(async () => {
    loader([
        { type: 'script', url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.js` },
        { type: 'style', url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.css` }
      ],
      () => !!window.mapboxgl,
      onAvailable
    )

    return () => {
      map.remove()
    }
  })
</script>
