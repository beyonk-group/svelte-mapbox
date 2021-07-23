import { load } from '../asset-loader.js'
import { bindEvents } from '../event-bindings.js'

export default function action (node, options = {}) {
  let map

  const resources = [
    { type: 'script', value: `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${options.version}/mapbox-gl-geocoder.min.js`, id: 'byk-gc-js' },
    { type: 'link', value: `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${options.version}/mapbox-gl-geocoder.css`, id: 'byk-gc-css' }
  ]

  const customStylesheetUrl = options.customStylesheetUrl
  if (customStylesheetUrl) {
    resources.push({ type: 'link', value: customStylesheetUrl, id: 'byk-gcsu-css' })
  }

  let unbind = () => {}
  load(resources, () => {
    unbind = init(options, node)
  })

  return {
    destroy () {
      unbind()
      map && map.remove && map.remove()
    }
  }
}

function init (options, node) {
  const geocoder = new window.MapboxGeocoder(options)
  geocoder.addTo(`#${node.id}`)
  if (options.value) {
    geocoder.setInput(options.value)
  }

  return bindEvents(geocoder, handlers, false, node)
}

const handlers = {
  results: (el, ev) => {
    return [ 'results', ev ]
  },
  result: (el, ev) => {
    return [ 'result', ev ]
  },
  loading: (el, ev) => {
    return [ 'loading', ev ]
  },
  error: (el, ev) => {
    return [ 'error', ev ]
  },
  clear: (el, ev) => {
    return [ 'clear', ev ]
  },
  load: el => {
    return [ 'ready', { geocoder: el } ]
  }
}
