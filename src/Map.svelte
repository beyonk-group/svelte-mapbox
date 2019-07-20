<div bind:this={container}></div>

<style>
  @import '//api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css';

  div {
    width: 100%;
    height: 100%;
  }
</style>

<script>
  import { onMount, createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let container
  let el
  let mapboxgl

  export let controls = {}
  export let accessToken

  const controlTypes = {
    scaling: (position = 'bottom-right', options = {}) => {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric',
        ...options
      })
      el.addControl(scale, position)
    },
    navigation: (position = 'top-right', options = {}) => {
      const nav = new mapboxgl.NavigationControl({
        ...options
      })
      el.addControl(nav, position)
    },
    geolocate: (position = 'top-left', options = {}) => {
      const geolocate = new mapboxgl.GeolocateControl({
        ...options
      })
      el.addControl(geolocate, position)
    }
  }

  onMount(async () => {
    const mbgl = await import('mapbox-gl/dist/mapbox-gl.js')
    mapboxgl = mbgl.default
    mapboxgl.accessToken = accessToken
    el = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11'
    })

    el.on('dragend', () => dispatch('recentre', { center: el.getCenter() }))

    Object
      .keys(controls)
      .forEach(control => {
        const { position, options } = controls[control]
        controlTypes[control](position, options)
      })

    el.on('load', () => dispatch('ready', { map: el }))
  })
</script>