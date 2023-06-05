<a href="https://beyonk.com">
    <br />
    <br />
    <img src="https://user-images.githubusercontent.com/218949/144224348-1b3a20d5-d68e-4a7a-b6ac-6946f19f4a86.png" width="198" />
    <br />
    <br />
</a>

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

Svelte-Mapbox is based on the official mapbox-gl package.
You can find the [full documentation of methods and properties on docs.mapbox.com.](https://docs.mapbox.com/mapbox-gl-js/api/map/)

**Basic Typescript Example:**

```jsx
  <script lang="ts">
    import { Map } from '@beyonk/svelte-mapbox'
    let mapComponent: Map;
    const PUBLIC_MAP_TOKEN = '<YOUR TOKEN>';

    function onMapReady() {
      mapComponent.setZoom(12);
      mapComponent.flyTo({center:[4.349984, 50.844985]});
    }
  </script>

  <div style="height: 400px; width: 100%;">
    <Map accessToken="{PUBLIC_MAPBOX_TOKEN}"
         style="mapbox://styles/mapbox/outdoors-v11"
         bind:this={mapComponent}
         on:ready={onMapReady}>
    </Map>
  </div>
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

Make sure you copy the `.env` file to `.env.local` and then populate it with your mapbox key.

`
npm run dev
`

