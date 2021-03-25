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

  let container
  let mapbox
  let animationInProgress = false
  const queue = new EventQueue(worker)

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

  export function fitBounds (bbox, options = {}) {
    queue.send('fitBounds', [ bbox, options ])
}

  export function flyTo (destination, options = {}) {
    queue.send('flyTo', [ destination, options ])
  }

  export function resize () {
    queue.send('resize')
  }

  export function setCenter (coords, eventData = {}) {
    queue.send('setCenter', [ coords, eventData ])
  }

  export function addControl (control, position = 'top-right') {
    queue.send('addControl', [ control, position ])
  }

  export function getMap () {
    return map
  }

  export function getMapbox () {
    return mapbox
  }

  function setZoom (zoom, eventData = {}) {
    queue.send('setZoom', [ zoom, eventData ])
  }

  function onAvailable () {
    window.mapboxgl.accessToken = accessToken
    mapbox = window.mapboxgl
    const optionsWithDefaults = Object.assign({
      container,
      style,
      center,
      zoom,
      zoomRate,
      wheelZoomRate
    }, options)

    const el = new mapbox.Map(optionsWithDefaults)

    el.on('dragend', () => {
      const { lng, lat } = el.getCenter()
      center = [ lng, lat ]
      dispatch('recentre', { center })
    })
  
    el.on('click', e => dispatch('click', { lng: e.lngLat.lng, lat: e.lngLat.lat }))

    el.on('zoomstart', () => {
      animationInProgress = true
      zoom = el.getZoom()
      dispatch('zoomstart', { zoom })
    })

    el.on('zoom', () => {
      zoom = el.getZoom()
      dispatch('zoom', { zoom })
    })

    el.on('zoomend', () => {
      animationInProgress = false
      zoom = el.getZoom()
      dispatch('zoomend', { zoom })
    })

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

  onMount(() => {
    const resources = [
      { type: 'script', url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.js` },
      { type: 'style', url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.css` }
    ]

    if (customStylesheetUrl) {
      resources.push({ type: 'style', url: customStylesheetUrl })
    }

    loader(
      resources,
      () => !!window.mapboxgl,
      onAvailable
    )

    return () => {
      queue.stop()
      if (map && map.remove) {
        map.remove()
      }
    }
  })

  $: !animationInProgress && setZoom(zoom)
</script>
