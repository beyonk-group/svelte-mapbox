<script>
	import { getContext } from 'svelte'
  import { contextKey } from './mapbox.js'

	const { getMap, getMapbox } = getContext(contextKey)
  const map = getMap()
  const mapbox = getMapbox()

	export let lat
	export let lng
	export let label = 'Marker'
	export let lon
	export let popupClassName = 'beyonk-mapbox-popup'

	const popup = new mapbox.Popup({
		offset: 25,
		className: popupClassName
	})
	.setText(label)

	const marker = new mapbox.Marker()
		.setLngLat([lng || lon, lat])
		.setPopup(popup)
		.addTo(map)
</script>