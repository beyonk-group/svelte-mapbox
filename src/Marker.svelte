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

  function move (lng, lat) {
    marker.setLngLat({ lng, lat })
  }

  export let lat
  export let lng
  export let label = 'Marker'
  export let popupClassName = 'beyonk-mapbox-popup'
  export let markerOffset = [ 0, 0 ]
  export let popupOffset = 10
  export let color = randomColour()
  export let popup = true

  let marker
  let elementMarker
  let elementPopup

  $: marker && move(lng, lat)

  onMount(() => {
    if(elementMarker.hasChildNodes()) {
      marker = new mapbox.Marker({ element, offset: markerOffset })
    } else {
      marker = new mapbox.Marker({ color, offset: markerOffset })
    }

    if (popup) {
      const popupEl = new mapbox.Popup({
        offset: popupOffset,
        className: popupClassName
      })
      if (elementPopup.hasChildNodes()) {
        popupEl.setHTML(elementPopup)
      } else {
        popupEl.setText(label)
      }

      marker.setPopup(popupEl)
    }

    marker
      .setLngLat({ lng, lat })
      .addTo(map)

    return () => marker.remove()
  })

  export function getMarker () {
    return marker
  }
</script>

<div bind:this={elementMarker}>
  <slot></slot>
</div>

<div bind:this={elementPopup}>
  <slot name="popup"></slot>
</div>
