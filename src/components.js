'use strict'

import Map from './Map.svelte'
import Marker from './Marker.svelte'
import Geocoder from './Geocoder.svelte'
import { contextKey } from './mapbox.js'
import GeolocateControl from './controls/GeolocateControl.svelte'
import NavigationControl from './controls/NavigationControl.svelte'
import ScaleControl from './controls/ScaleControl.svelte'

const controls = {
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  ScalingControl: ScaleControl
}

export {
  Map,
  Marker,
  Geocoder,
  contextKey,
  controls
}
