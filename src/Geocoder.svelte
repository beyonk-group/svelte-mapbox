<div bind:this={container} />

<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import loader from '@beyonk/async-script-loader'

  const dispatch = createEventDispatcher()

  export let accessToken
  export let options
  export let version = 'v4.5.1'
  export let types = [ 'country', 'region', 'postcode', 'district', 'place', 'locality', 'neighborhood', 'address' ]

  let container
  let geocoder

  const onResult = p => dispatch('result', p)
  const onResults = p => dispatch('results', p)
  const onError = p => dispatch('error', p)
  const onLoading = p => dispatch('loading', p)

  onMount(() => {
    loader(
      `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${version}/mapbox-gl-geocoder.min.js`,
      () => !!window.MapboxGeocoder,
      onAvailable
    )

    const link = document.createElement('link')
		link.rel = 'stylesheet'
    link.href = '//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.css'
    document.head.appendChild(link)

    return () => {
      geocoder
        .off('results', onResults)
        .off('result', onResult)
        .off('loading', onLoading)
        .off('error', onError)
      link.parentNode.removeChild(link)
    }
  })

  function onAvailable () {
    const optionsWithDefaults = Object.assign({
        accessToken,
        types: types.join(',')
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
</script>

<style>
  div {
    padding: 0;
  }
</style>