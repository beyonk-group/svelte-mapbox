<div bind:this={container} {id}>

</div>

<script>
  import { onMount, createEventDispatcher, setContext } from 'svelte'

  const dispatch = createEventDispatcher()

  const id = `byk-${Math.random().toString(36).substring(2, 8)}`

  let container
  let map
  let mapbox

  export let options = {}
  export let accessToken
  // export let style = 'mapbox://styles/mapbox/streets-v11'


  onMount(async () => {
    window.process = {}
    window.process.env = {}
    const mapboxModule = await import('@mapbox/mapbox-gl-geocoder')
    const MapboxGeocoder = mapboxModule.default

    var geocoder = new MapboxGeocoder({ accessToken })
    geocoder.addTo(`#${id}`)

    // // const link = document.createElement('link')
		// // link.rel = 'stylesheet'
		// // link.href = 'https://unpkg.com/mapbox-gl/dist/mapbox-gl.css'

    // let el

		// link.onload = () => {
    //   const optionsWithDefaults = Object.assign({
    //     container,
    //     style
    //   }, options)
    //   el = new mapbox.Map(optionsWithDefaults)

    //   el.on('dragend', () => dispatch('recentre', { center: el.getCenter() }))

    //   el.on('load', () => {
    //     map = el
    //     dispatch('ready')
    //   })
    // }

    // document.head.appendChild(link)

    // return () => {
    //   map.remove()
    //   link.parentNode.removeChild(link)
    // }
  })
</script>