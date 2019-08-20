<script>
	import { getContext } from 'svelte'
	import { mapbox, contextKey } from '../mapbox.js'

	const { getMap } = getContext(contextKey)
  const map = getMap()

  export let position = 'top-right'
  export let options = {}
  
  const nav = new mapbox.NavigationControl({
    ...options
  })
  map.addControl(nav, position)
</script>