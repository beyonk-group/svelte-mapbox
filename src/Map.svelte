<div bind:this={container}></div>

<style>
  @import '//api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css';

  div {
    width: 100%;
    height: 100%;
  }
</style>

<script>
  import { onMount } from 'svelte'
  import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'

  let container
  let el

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

  onMount(() => {
    mapboxgl.accessToken = accessToken
    el = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11'
    })

    Object
      .keys(controls)
      .forEach(control => {
        const { position, options } = controls[control]
        controlTypes[control](position, options)
      })
  })
</script>