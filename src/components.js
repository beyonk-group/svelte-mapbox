'use strict'

import Map from './Map.svelte'
import Marker from './Marker.svelte'
import Geocoder from './Geocoder.svelte'
import { contextKey } from './mapbox.js'
import GeolocateControl from './controls/GeolocateControl.svelte'
import NavigationControl from './controls/NavigationControl.svelte'
import ScalingControl from './controls/ScalingControl.svelte'

const controls = {
  GeolocateControl,
  NavigationControl,
  ScalingControl
}

export {
  Map,
  Marker,
  Geocoder,
  contextKey,
  controls
}
