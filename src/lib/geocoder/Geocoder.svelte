<div
  use:action={optionsWithDefaults}
  on:ready={init}
  on:results
  on:result
  on:loading
  on:error
  on:clear
  on:load
/>

<script>
  import action from './geocoder-action.js'

  export let accessToken
  export let options = {}
  export let version = 'v4.7.2'
  export let types = [ 'country', 'region', 'postcode', 'district', 'place', 'locality', 'neighborhood', 'address' ]
  export let placeholder = 'Search'
  export let value = null
  export let customStylesheetUrl = false
  export let geocoder

  const optionsWithDefaults = Object.assign({
    version,
    accessToken,
    types: types.join(','),
    placeholder,
    customStylesheetUrl,
    value
  }, options)

  function init ({ detail }) {
    geocoder = detail.geocoder
  }
</script>

<style>
  div {
    padding: 0;
  }
</style>