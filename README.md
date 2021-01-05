<p align="center">
  <img width="186" height="90" src="https://user-images.githubusercontent.com/218949/44782765-377e7c80-ab80-11e8-9dd8-fce0e37c235b.png" alt="Beyonk" />
</p>

## Svelte MapBox

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![svelte-v3](https://img.shields.io/badge/svelte-v3-blueviolet.svg)](https://svelte.dev) ![publish](https://github.com/beyonk-adventures/svelte-mapbox/workflows/publish/badge.svg)

Maps and Geocoding (Autocomplete) components in Vanilla JS (or Svelte)

* SSR Ready
* Lightweight
* No clientside dependencies (Map)
* Allow creation of custom Svelte components on the map

* Note that the GeoCoder has a clientside dependency, since it adds about 0.5mb to the bundle size, and significant time to the build time if bundled.

## Installing

**It is PARAMOUNT that you install this as a development dependency, not a runtime dependency. It won't work otherwise. Svelte bundles everything, so you should not need any runtime dependencies at all**

```
npm install --save-dev @beyonk/svelte-mapbox
```

## Basic Usage (Map)

The container component is the map, and there are a variety of components which go on the map.

```jsx
<Map
  accessToken="<your api key>" // add your api key here
  bind:this={mapComponent} // Get reference to your map component to use methods
  on:recentre={e => console.log(e.detail.center.lat, e.detail.center.lng) } // recentre events
  options={{ scrollZoom: false }} // // add arbitrary options to the map from the mapbox api
>
  <Earthquakes /> // Any custom component you create or want here - see marker example
  <Marker lat={someLat} lng={someLng} color="rgb(255,255,255)" label="some marker label" popupClassName="class-name" /> // built in Marker component
  <NavigationControl />
  <GeolocateControl options={{ some: 'control-option' }} on:eventname={eventHandler} />
  <ScaleControl />
</Map>

<script>
  import { Map, Geocoder, Marker, controls } from '@beyonk/svelte-mapbox'
	import Earthquakes from './Earthquakes.svelte' // custom component
  
  const { GeolocateControl, NavigationControl, ScaleControl } = controls

  // Usage of methods like setCenter and flyto
  mapComponent.setCenter([lng,lat],zoom) // zoom is optional
  mapComponent.flyTo({center:[lng,lat]}) // documentation (https://docs.mapbox.com/mapbox-gl-js/example/flyto)

  // Define this to handle `eventname` events - see [GeoLocate Events](https://docs.mapbox.com/mapbox-gl-js/api/markers/#geolocatecontrol-events)
  function eventHandler (e) {
    const data = e.detail
    // do something with `data`, it's the result returned from the mapbox event
  }
</script>

<style>
    :global(.mapboxgl-map) {
        height: 200px;
        // sometimes mapbox objects don't render as expected; troubleshoot by changing the height/width to px
    }
</style>
```

## Markers

By default, markers have a popup. To turn this off, set `popup={false}` on the `Marker`:

```jsx
<Marker popup={false} />
```

## Reactive Properties

The map has reactive properties for `center` and `zoom`. This means that if you set these properties, or modify them whilst the map is displayed, the map will react accordingly.

This also means that if you bind these properties to a variable, that variable will automatically be updated with the current `center` and `zoom` of the map if the user moves or zooms the map.

This is often easier than waiting for events such as `recentre` or `zoom` to be fired, to update markers and similar:

```jsx
<Map accessToken="<your api key>" bind:center bind:zoom>
  <Marker bind:lat bind:lng />
</Map>

<script>
  let center
  let zoom

  $: lng = center[0]
  $: lat = center[1]
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

## Custom CSS

You can add additional css to override mapbox provided CSS by passing the `customStylesheetUrl` property to either the `Map` or `Geocoder` components.

## Demo

To see the earthquakes demo:

`
npm run dev
`

