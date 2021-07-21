'use strict'

import Map from '$lib/map/Map.svelte'
import Marker from '$lib/map/Marker.svelte'
import Geocoder from '$lib/geocoder/Geocoder.svelte'
import { contextKey } from '$lib/mapbox.js'
import GeolocateControl from '$lib/map/controls/GeolocateControl.svelte'
import NavigationControl from '$lib/map/controls/NavigationControl.svelte'
import ScaleControl from '$lib/map/controls/ScaleControl.svelte'

const controls = {
  GeolocateControl,
  NavigationControl,
  ScaleControl
}

export {
  Map,
  Marker,
  Geocoder,
  contextKey,
  controls
}
