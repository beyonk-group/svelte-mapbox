<p align="center">
  <img width="186" height="90" src="https://user-images.githubusercontent.com/218949/44782765-377e7c80-ab80-11e8-9dd8-fce0e37c235b.png" alt="Beyonk" />
</p>

## Svelte MapBox

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![CircleCI](https://circleci.com/gh/beyonk-adventures/svelte-mapbox.svg?style=shield)](https://circleci.com/gh/beyonk-adventures/svelte-mapbox)  [![svelte-v2](https://img.shields.io/badge/svelte-v2-orange.svg)](https://v2.svelte.dev) [![svelte-v3](https://img.shields.io/badge/svelte-v3-blueviolet.svg)](https://svelte.dev)

Maps and Geocoding (Autocomplete) components in Vanilla JS (or Svelte)

* SSR Ready
* Lightweight
* No clientside dependencies
* Allow creation of custom Svelte components on the map

## WIP

Documentation is a WIP. 

## Basic Usage (Map)

The container component is the map, and there are a variety of components which go on the map.

```jsx
<Map
  accessToken="<your api key>" // add your api key here
  on:recentre={e => console.log(e.detail.center.lat, e.detail.center.lng) } // recentre events
>
  <Earthquakes /> // Any custom component you create or want here - see marker example
  <Marker lat={someLat} lng={someLng} /> // built in Marker component
  <NavigationControl />
  <GeolocateControl options={{ some: 'control-option' }} />
  <ScalingControl />
</Map>

<script>
  import { Map, Geocoder, controls } from '@beyonk/svelte-mapbox'
	import Earthquakes from './Earthquakes.svelte' // custom component
  
  const { GeolocateControl, NavigationControl, ScalingControl } = controls
</script>
```

## Basic Usage (Geocoder)

The Geocoder is an autocompleting place lookup, which returns a lat and lng for a place.

```jsx
<Geocoder accessToken="<your api key>" on:place-changed={somePlaceChangeEvent} label="Some Label" />

<script>
  import { Geocoder } from '@beyonk/svelte-mapbox'
</script>
```

Note the label prop is used for `aria-*` attributes on the search input, this component doesn't have a built-in label.

## Context API

This implementation makes use of the Context API, so you can wrap custom components in the Map, and inside those components you can do:

```js
import { contextKey } from './mapbox.js'

const { getMap, getMapbox } = getContext(contextKey)
const map = getMap()
const mapbox = getMapbox()
```

* `map` is a reference to the Map object.
* `mapbox` is a reference to the mapbox library.

## Demo

To see the earthquakes demo:

`
npm run dev
`

