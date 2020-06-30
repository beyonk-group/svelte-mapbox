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
  import { EventQueue } from './queue.js'

  setContext(contextKey, {
    getMap: () => map,
    getMapbox: () => mapbox
  })

  const dispatch = createEventDispatcher()

  export let map = null
  export let version = 'v1.11.0'

  let container
  let mapbox
  let queue

  export let options = {}
  export let accessToken
  export let style = 'mapbox://styles/mapbox/streets-v11'

  export function setCenter (center, zoom) {
    queue.send('setCenter', [ center ])
    if (zoom && Number.isInteger(zoom)) {
      queue.send('setZoom', [ zoom ])
    }
  }
  export function fitBounds (bbox) {
    queue.send('fitBounds', [ bbox ])
  }

  export function flyTo (destination) {
    queue.send('flyTo', [ destination ])
  }

  export function resize () {
    queue.send('resize')
  }

  export function getMap () {
    return map
  }

  export function getMapbox () {
    return mapbox
  }

  function onAvailable () {
    window.mapboxgl.accessToken = accessToken
    mapbox = window.mapboxgl
    const optionsWithDefaults = Object.assign({
      container,
      style
    }, options)

    const el = new mapbox.Map(optionsWithDefaults)

    el.on('dragend', () => dispatch('recentre', { center: el.getCenter() }))

    el.on('load', () => {
      map = el
      queue.start()
      dispatch('ready')
    })
  }

function worker (cmd, cb) {
    const [ command, params ] = cmd
    map[command].apply(map, params)
    cb(null)
  }

  onMount(async () => {
    queue = new EventQueue(worker)

    loader([
      { type: 'script', url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.js` },
      { type: 'style', url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.css` }
    ],
    () => !!window.mapboxgl,
    onAvailable
    )

    return () => {
      queue.stop()
      map.remove()
    }
  })
</script>
