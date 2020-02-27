<div bind:this={container}>
  <input type="text" disabled />
</div>

<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import loader from '@beyonk/async-script-loader'

  const dispatch = createEventDispatcher()

  export let accessToken
  export let options
  export let version = 'v4.5.1'
  export let types = [ 'country', 'region', 'postcode', 'district', 'place', 'locality', 'neighbourhood', 'address' ]

  let container
  let geocoder

  onMount(() => {
    loader(
      `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${version}/mapbox-gl-geocoder.min.js`,
      () => !!window.MapboxGeocoder,
      onAvailable
    )
  })

  const onResult = p => dispatch('result', p)
  const onResults = p => dispatch('results', p)
  const onError = p => dispatch('error', p)
  const onLoading = p => dispatch('loading', p)

  function onAvailable () {
    const optionsWithDefaults = Object.assign({
        accessToken,
        types
      }, options)
    geocoder = new MapboxGeocoder(optionsWithDefaults)
    geocoder
      .addTo(`.${container.className}`)

    geocoder
      .on('results', onResults)
      .on('result', onResult)
      .on('loading', onLoading)
      .on('error', onError)
    dispatch('ready')
  }

  onDestroy(() => {
    geocoder
      .off('results', onResults)
      .off('result', onResult)
      .off('loading', onLoading)
      .off('error', onError)
  })
</script>

<style>
  @import '//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.css';

  div {
    padding: 0;
  }
</style>