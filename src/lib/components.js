'use strict'

import Map from './map/Map.svelte'
import Marker from './map/Marker.svelte'
import Geocoder from './geocoder/Geocoder.svelte'
import { contextKey } from './mapbox.js'
import GeolocateControl from './map/controls/GeolocateControl.svelte'
import NavigationControl from './map/controls/NavigationControl.svelte'
import ScaleControl from './map/controls/ScaleControl.svelte'

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
