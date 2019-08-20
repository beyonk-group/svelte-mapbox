<script>
	import { getContext } from 'svelte'
	import { mapbox, contextKey } from '../mapbox.js'

	const { getMap } = getContext(contextKey)
  const map = getMap()

  export let position = 'top-left'
  export let options = {}
  
  const geolocate = new mapbox.GeolocateControl({
    ...options
  })
  map.addControl(geolocate, position)
</script>