<p align="center">
  <img width="186" height="90" src="https://user-images.githubusercontent.com/218949/44782765-377e7c80-ab80-11e8-9dd8-fce0e37c235b.png" alt="Beyonk" />
</p>

## Svelte MapBox

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![svelte-v3](https://img.shields.io/badge/svelte-v3-blueviolet.svg)](https://svelte.dev) ![publish](https://github.com/beyonk-adventures/svelte-mapbox/workflows/publish/badge.svg)

Maps and Geocoding (Autocomplete) [MapBox](https://www.mapbox.com/) components in Vanilla JS (or Svelte)

* SvelteKit Ready
* SSR Ready
* Lightweight
* No clientside dependencies (Map)
* Allow creation of custom Svelte components on the map

* Note that the GeoCoder has a clientside dependency, since it adds about 0.5mb to the bundle size, and significant time to the build time if bundled.

## Installing

```
npm install --save-dev @beyonk/svelte-mapbox
```

### Basic Usage (Map)

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

### Markers

By default, markers are typical map pins to which you can pass a color property.

```jsx
<Marker color={brandColour} />
```

You may also create a custom pin with the default slot.

```jsx
<Marker
lat={waypoint.geo.lat}
lng={waypoint.geo.lng}
> 
  <a href={waypoint.slug}>
    <div class='myMarker {($mapData.activeMarker == waypoint.id) ? 'active' : ''}' 
    style="
    color:{mainPoint.color};
    background-image: url('{(waypoint.images != undefined) ? waypoint.images[0].thumb.url : ''}');
    ">
    </div>
  </a>
</Marker>
```

### Marker Popups
By default a popup is revealed when you click a pin.  It is populated with text provided in the label property.

```jsx
<Marker label={markerText} />
```

To indicate interactivity, you may target the marker with some custom CSS:

```jsx
<style>
    :global(.mapboxgl-marker){
      cursor: pointer;
    }   
</style>
```

Optionally, disable the popup with the `popup={false}` property:

```jsx
<Marker popup={false} />
```

You may alternatively pass a custom DOM element to the marker to use as a popup. 

```jsx
<Marker lat={pin.coordinates.latitude} lng={pin.coordinates.longitude}>
    <div class="content" slot="popup">
      <h3>{pin.name}</h3>
        <Markdown source={pin.description} />
      </div>
      <img src="{pin.images.length > 0 ? pin.images[0].url : ""}" alt="{pin.name}"/>
    </div> 
</Marker>
```

### Reactive Properties

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

### Methods

The map has a variety of methods which delegate to a queue. The reason for this is that MapBox is quite a heavy library, and rendering a map is a pretty heavy operation. It's hard to guarantee
when everything is ready in your browser, and when you can start doing things with it.

In case you want raw map access to interact directly with the map, you can call `getMap` on the map and interact with it that way. However we don't recommend it, as you have no guarantees that the
map is ready in your browser when you call it this way.

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

