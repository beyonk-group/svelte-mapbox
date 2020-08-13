<script>
	import { getContext, onDestroy, createEventDispatcher } from 'svelte'
	import { contextKey } from '../mapbox.js'
	import { createDispatchers } from '../event-dispatchers'

	const dispatch = createEventDispatcher()
	const { getMap, getMapbox } = getContext(contextKey)
	const map = getMap()
	const mapbox = getMapbox()

	export let position = 'top-left'
	export let options = {}

	const events = [
	  'error',
	  'geolocate',
	  'outofmaxbounds',
	  'trackuserlocationend',
	  'trackuserlocationstart'
	]

	const geolocate = new mapbox.GeolocateControl(options)
	map.addControl(geolocate, position)

	const destroyDispatchers = createDispatchers(geolocate, dispatch, events)
	onDestroy(destroyDispatchers)

	export function trigger () {
	  geolocate.trigger()
	}
</script>