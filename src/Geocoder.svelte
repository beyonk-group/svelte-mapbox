<div bind:this={container} id={fieldId} />

<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import loader from '@beyonk/async-script-loader'

  const dispatch = createEventDispatcher()

  const fieldId = 'bsm-' + Math.random().toString(36).substring(6)

  export let accessToken
  export let options = {}
  export let version = 'v4.5.1'
  export let types = [ 'country', 'region', 'postcode', 'district', 'place', 'locality', 'neighborhood', 'address' ]
  export let placeholder = 'Search'
  export let value = null
  export let customStylesheetUrl = false

  export let geocoder = null

  let container
  let ready = false

  const onResult = p => dispatch('result', p)
  const onResults = p => dispatch('results', p)
  const onError = p => dispatch('error', p)
  const onLoading = p => dispatch('loading', p)
  const onClear = p => dispatch('clear', p)

  onMount(() => {
    const resources = [
      { type: 'script', url: `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${version}/mapbox-gl-geocoder.min.js` },
      { type: 'style', url: `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${version}/mapbox-gl-geocoder.css` }
    ]

    if (customStylesheetUrl) {
      resources.push({ type: 'style', url: customStylesheetUrl })
    }

    loader(
      resources,
      () => !!window.MapboxGeocoder,
      onAvailable
    )

    return () => {
      geocoder
        .off('results', onResults)
        .off('result', onResult)
        .off('loading', onLoading)
        .off('error', onError)
        .off('clear', onClear)
    }
  })

  function onAvailable () {
    const optionsWithDefaults = Object.assign({
      accessToken,
      types: types.join(','),
      placeholder
    }, options)
    geocoder = new window.MapboxGeocoder(optionsWithDefaults)
    geocoder.addTo(`#${fieldId}`)
  
    geocoder
      .on('results', onResults)
      .on('result', onResult)
      .on('loading', onLoading)
      .on('error', onError)
      .on('clear', onClear)

    geocoder.setInput(value)

    ready = true
    dispatch('ready')
  }

  $: ready && value && geocoder.setInput(value)
</script>

<style>
  div {
    padding: 0;
  }
</style>