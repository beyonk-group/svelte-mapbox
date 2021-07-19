<div use:action={opts} on:ready={init}>
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
  import { setContext, onDestroy } from 'svelte'
  import { contextKey } from './mapbox.js'
  import action from './mapbox-action.js'
  import { EventQueue } from './queue.js'

  setContext(contextKey, {
    getMap: () => map,
    getMapbox: () => mapbox
  })

  let container
  let mapbox
  // let animationInProgress = false

  export let map = null
  export let version = 'v1.11.1'
  export let center = [ 0, 0 ]
  export let zoom = 9
  export let zoomRate = 1
  export let wheelZoomRate = 1
  export let options = {}
  export let accessToken
  export let customStylesheetUrl = false
  export let style = 'mapbox://styles/mapbox/streets-v11'

  const opts = Object.assign({
    accessToken,
    container,
    style,
    center,
    zoom,
    zoomRate,
    wheelZoomRate,
    version,
    customStylesheetUrl,
    map
  }, options)

  const queue = new EventQueue()

  function init (c) {
    queue.start(c.map)
  }

  onDestroy(() => queue.stop())

  export function fitBounds (bbox, data = {}) {
    queue.send('fitBounds', [ bbox, data ])
  }

  export function flyTo (destination, data = {}) {
    queue.send('flyTo', [ destination, data ])
  }

  export function resize () {
    queue.send('resize')
  }

  export function setCenter (coords, data = {}) {
    queue.send('setCenter', [ coords, data ])
  }

  export function addControl (control, position = 'top-right') {
    queue.send('addControl', [ control, position ])
  }

  function setZoom (zoom, data = {}) {
    queue.send('setZoom', [ zoom, data ])
  }

  export function getMap () {
    return map
  }

  export function getMapbox () {
    return mapbox
  }

  // $: !animationInProgress && setZoom(zoom)
</script>
