<script>
	import { getContext } from 'svelte'
	import { contextKey } from '../mapbox.js'

	const { getMap, getMapbox } = getContext(contextKey)
  const map = getMap()
  const mapbox = getMapbox()

  export let position = 'bottom-right'
  export let options = {}
  
  const scale = new mapbox.ScaleControl({
    maxWidth: 80,
    unit: 'metric',
    ...options
  })
  map.addControl(scale, position)
</script>