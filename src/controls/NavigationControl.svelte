<script>
	import { getContext } from 'svelte'
	import { contextKey } from '../mapbox.js'

	const { getMap, getMapbox } = getContext(contextKey)
	const map = getMap()
	const mapbox = getMapbox()

	export let position = 'top-right'
	export let options = {}

	const nav = new mapbox.NavigationControl(options)
	map.addControl(nav, position)
</script>