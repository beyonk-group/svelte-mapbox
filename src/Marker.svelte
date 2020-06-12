<script>
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

	const popup = new mapbox.Popup({
	  offset: 25,
	  className: popupClassName
	})
	  .setText(label)

	new mapbox.Marker({
	  color
	})
	  .setLngLat([ lng || lon, lat ])
	  .setPopup(popup)
	  .addTo(map)
</script>