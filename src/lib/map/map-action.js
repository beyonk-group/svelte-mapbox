import { load } from '../asset-loader.js'
import { bindEvents } from '../event-bindings.js'

export default function action (node, options = {}) {
  let map

  const resources = [
    { type: 'script', attr: 'src', value: `//api.mapbox.com/mapbox-gl-js/${options.version}/mapbox-gl.js`, id: 'byk-gl-js' },
    { type: 'link', attr: 'href', value: `//api.mapbox.com/mapbox-gl-js/${options.version}/mapbox-gl.css`, id: 'byk-gl-css' }
  ]

  const customStylesheetUrl = options.customStylesheetUrl
  if (customStylesheetUrl) {
    resources.push({ type: 'link', attr: 'href', value: customStylesheetUrl, id: 'byk-mcsu-css' })
  }

  let unbind = () => {}
  load(resources, () => {
    unbind = init({ ...options, container: node }, node)
  })

  return {
    destroy () {
      unbind()
      map && map.remove && map.remove()
    }
  }
}

function init (options, node) {
  window.mapboxgl.accessToken = options.accessToken
  const el = new window.mapboxgl.Map(options)

  return bindEvents(el, handlers, window.mapboxgl, node)
}

const handlers = {
  dragend: el => {
    return [ 'dragend', { center: el.getCenter() } ]
  },
  drag: el => {
    return [ 'drag', { center: el.getCenter() } ]
  },
  moveend: el => {
    return [ 'recentre', { center: el.getCenter() } ]
  },
  click: (el, { lngLat }) => {
    return [ 'click', { lng: lngLat.lng, lat: lngLat.lat } ]
  },
  zoomstart: el => {
    return [ 'zoomstart', { zoom: el.getZoom() } ]
  },
  zoom: el => {
    return [ 'zoom', { zoom: el.getZoom() } ]
  },
  zoomend: el => {
    return [ 'zoomend', { zoom: el.getZoom() } ]
  },
  load: (el, ev, mapbox) => {
    return [ 'ready', { map: el, mapbox } ]
  }
}
