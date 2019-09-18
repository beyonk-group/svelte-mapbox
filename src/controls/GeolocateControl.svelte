<script>
	import { getContext } from 'svelte'
	import { contextKey } from '../mapbox.js'

	const { getMap, getMapbox } = getContext(contextKey)
  const map = getMap()
  const mapbox = getMapbox()

  export let position = 'top-left'
  export let options = {}
  
  const geolocate = new mapbox.GeolocateControl(options)
  map.addControl(geolocate, position)
</script>