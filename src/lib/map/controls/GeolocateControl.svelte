<div
	bind:this={dispatcher}
	on:error
	on:geolocate
	on:outofmaxbounds
	on:trackuserlocationend
	on:trackuserlocationstart
/>

<script>
	import { getContext, onMount } from 'svelte'
	import { contextKey } from '../../mapbox.js'
	import { bindEvents } from '../../event-bindings.js'

	const { getMap, getMapbox } = getContext(contextKey)
	const map = getMap()
	const mapbox = getMapbox()

	export let position = 'top-left'
	export let options = {}

	let dispatcher

	const handlers = {
	  error: (el, ev) => {
	    return [ 'error', ev ]
	  },
	  geolocate: (el, ev) => {
	    return [ 'geolocate', ev ]
	  },
	  outofmaxbounds: (el, ev) => {
	    return [ 'outofmaxbounds', ev ]
	  },
	  trackuserlocationend: (el, ev) => {
	    return [ 'trackuserlocationend', ev ]
	  },
	  trackuserlocationstart: (el, ev) => {
	    return [ 'trackuserlocationstart', ev ]
	  }
	}

	const geolocate = new mapbox.GeolocateControl(options)
	map.addControl(geolocate, position)

	onMount(() => {
	  return bindEvents(geolocate, handlers, mapbox, dispatcher)
	})

	export function trigger () {
	  geolocate.trigger()
	}
</script>

<style>
	div { display: none; }
</style>
