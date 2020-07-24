<script>
	import { onMount } from 'svelte'
	import { getContext } from 'svelte'
	import { contextKey } from './mapbox.js'

	const { getMap, getMapbox } = getContext(contextKey)
	const map = getMap()
	const mapbox = getMapbox()
	
	function randomColour () {
	  return Math.round(Math.random() * 255)
	}

	export let lat
	export let lng
	export let label = 'Marker'
	export let lon
	export let popupClassName = 'beyonk-mapbox-popup'
	export let color = randomColour()

	let marker = null

	onMount(() => {
	  const popup = new mapbox.Popup({
	    offset: 25,
	    className: popupClassName
	  })
	    .setText(label)

	  marker = new mapbox.Marker({
	    color
	  })
	    .setLngLat([ lon, lat ])
	    .setPopup(popup)
	    .addTo(map)

	  return () => marker.remove()
	})

	export function getMarker () {
	  return marker
	}
</script>
