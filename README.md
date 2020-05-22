<p align="center">
  <img width="186" height="90" src="https://user-images.githubusercontent.com/218949/44782765-377e7c80-ab80-11e8-9dd8-fce0e37c235b.png" alt="Beyonk" />
</p>

## Svelte MapBox

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![CircleCI](https://circleci.com/gh/beyonk-adventures/svelte-mapbox.svg?style=shield)](https://circleci.com/gh/beyonk-adventures/svelte-mapbox)  [![svelte-v2](https://img.shields.io/badge/svelte-v2-orange.svg)](https://v2.svelte.dev) [![svelte-v3](https://img.shields.io/badge/svelte-v3-blueviolet.svg)](https://svelte.dev)

Maps and Geocoding (Autocomplete) components in Vanilla JS (or Svelte)

* SSR Ready
* Lightweight
* No clientside dependencies (Map)
* Allow creation of custom Svelte components on the map

* Note that the GeoCoder has a clientside dependency, since it appears to be extremely difficult to bundle.

## WIP

Documentation is a WIP. 

## Basic Usage (Map)

The container component is the map, and there are a variety of components which go on the map.

```jsx
<Map
  accessToken="<your api key>" // add your api key here
  bind:this={mapComponent} // Get reference to your map component to use methods
  on:recentre={e => console.log(e.detail.center.lat, e.detail.center.lng) } // recentre events
>
  <Earthquakes /> // Any custom component you create or want here - see marker example
  <Marker lat={someLat} lng={someLng} color="rgb(255,255,255)" label="some marker label" popupClassName="class-name" /> // built in Marker component
  <NavigationControl />
  <GeolocateControl options={{ some: 'control-option' }} />
  <ScalingControl />
</Map>

<script>
  import { Map, Geocoder, Marker, controls } from '@beyonk/svelte-mapbox'
	import Earthquakes from './Earthquakes.svelte' // custom component
  
  const { GeolocateControl, NavigationControl, ScalingControl } = controls

  // Usage of methods like setCenter and flyto
  mapComponent.setCenter([lng,lat],zoom) // zoom is optional
  mapComponent.flyTo({center:[lng,lat]}) // documentation (https://docs.mapbox.com/mapbox-gl-js/example/flyto)
</script>
```
## Basic Usage (Geocoder)

The Geocoder is an autocompleting place lookup, which returns a lat and lng for a place.

```jsx
<Geocoder accessToken="<your api key>" on:result={somePlaceChangeFunction} />

<script>
  import { Geocoder } from '@beyonk/svelte-mapbox'
</script>
```

The geocoder has five events you can subscribe to: `on:loading`, `on:result`, `on:results`, `on:clear`, and `on:error` which are [documented here](https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md#on)

The most important event is `on:result` which is fired when a user selects an autocomplete result.

There is a sixth event specific to this library, which is `on:ready`, which is fired when the component is ready for use. You can likely ignore it.

## Demo

To see the earthquakes demo:

`
npm run dev
`

