<script>
	import { getContext } from 'svelte'
	import { contextKey } from '../mapbox.js'

	const { getMap, getMapbox } = getContext(contextKey)
	const map = getMap()
	const mapbox = getMapbox()

	export let position = 'bottom-right'
	export let options = {}

	const optionsWithDefaults = Object.assign({
	  maxWidth: 80,
	  unit: 'metric'
	}, options)

	const scale = new mapbox.ScaleControl(optionsWithDefaults)
	map.addControl(scale, position)
</script>