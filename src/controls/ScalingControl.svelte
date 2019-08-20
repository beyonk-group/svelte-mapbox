<script>
	import { getContext } from 'svelte'
	import { mapbox, contextKey } from '../mapbox.js'

	const { getMap } = getContext(contextKey)
  const map = getMap()

  export let position = 'bottom-right'
  export let options = {}
  
  const scale = new mapbox.ScaleControl({
    maxWidth: 80,
    unit: 'metric',
    ...options
  })
  map.addControl(scale, position)
</script>