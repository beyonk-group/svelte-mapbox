<div>
  <Map
    bind:this={mapComponent}
    accessToken={mapboxToken}
    {center}
    bind:zoom
  >
    <Beyonk />
    <NavigationControl />
    <GeolocateControl />
  </Map>
</div>

<script>
  import { mapboxToken } from '$lib/conf.js'
  import { Map, Geocoder, Marker, controls } from '$lib/components.js'
  import Beyonk from '../_Beyonk.svelte'

  const { GeolocateControl, NavigationControl } = controls
  const place = null

  let center = { lat: 53.3358627, lng: -2.8572362 }
  let zoom = 11.15
  let mapComponent
</script>

<style>
  div {
    width: 100vw;
    height: 100vh;
  }
</style>