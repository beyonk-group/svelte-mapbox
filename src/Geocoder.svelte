<input class={styleClass} bind:this={input} bind:value={query} {placeholder} />

<style>
  :global(.by-mb-autocomplete) {
    background: white;
    z-index: 52;
    overflow: auto;
    box-sizing: border-box;
    border: 1px solid rgba(50, 50, 50, 0.6);
  }

  :global(.by-mb-autocomplete) * {
      font: inherit;
  }

  :global(.by-mb-autocomplete) > div {
    display: flex;
    padding: 12px;
  }

  :global(.by-mb-autocomplete) > div > .place,
  :global(.by-mb-autocomplete) > div > .context {
    padding: 0 6px;
  }
  
  :global(.by-mb-autocomplete) > div > .place {
    color: teal;
    font-weight: 700;
  }

  :global(.by-mb-autocomplete) > div > .context {
    color: darkslategray;
  }

  :global(.by-mb-autocomplete) > div:hover:not(.group),
  :global(.by-mb-autocomplete) > div.selected {
      background: #81ca91;
      cursor: pointer;
  }

  :global(.by-mb-autocomplete) > div > .marker {
    border-radius: 50% 50% 50% 0;
    border: 4px solid teal;
    width: 16px;
    height: 16px;
    transform: rotate(-45deg);
  }

  :global(.by-mb-autocomplete) > div.selected > .marker {
    border-color: #fff;
  }

  :global(.by-mb-autocomplete) > div > .marker::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    margin-left: -5px;
    margin-top: -5px;
    background-color: #fff;
  }
</style>

<script>
  import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js'
  import autocomplete from './autocompleter.js'
  import { onMount } from 'svelte'

  let input
  let query = null
  
  export let value = null
  export let placeholder = 'Enter Location'
  export let styleClass = ''

  export let apiUrl = 'https://api.mapbox.com'
  export let endpoint = 'mapbox.places'
  export let accessToken
  export let debounceWaitMs = 500
  export let minLength = 3

  function getSearchUrl () {
    return `${apiUrl}/geocoding/v5/${endpoint}/${query}.json?access_token=${accessToken}&autocomplete=true`
  }

  function parseSuggestions (payload) {
    return payload.features.map(p => {
      const [ lat, lng ] = p.center
      return {
        label: p.place_name,
        place: p.text,
        context: p.context.map(c => c.text),
        geometry: {
          lat,
          lng
        }
      }
    })
  }

  function getAutocompleteResults (text, update) {
    const url = getSearchUrl()
    fetch(url)
    .then(r => r.json())
    .then(results => {
      const suggestions = parseSuggestions(results)
      update(suggestions)
    })
  }

  function onSelect (item) {
    input.value = item.label
    value = item
  }

  function renderItem (item, currentValue) {
    const itemElement = document.createElement('div')
    const { place, context } = item
    
    const output = [
      '<div class="marker"></div>',
      '<span class="place">',
      place,
      '</span> <span class="context">',
      context.join(', '),
      '</span>'
    ].join('')

    itemElement.innerHTML = output
    return itemElement
  }

  onMount(() => {
    autocomplete({
      input,
      fetch: getAutocompleteResults,
      onSelect,
      debounceWaitMs,
      minLength,
      render: renderItem,
      className: 'by-mb-autocomplete'
    })
  })
</script>