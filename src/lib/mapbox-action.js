export default function action (node, options = {}) {
  let map

  const resources = [
    { type: 'script', attr: 'src', value: `//api.mapbox.com/mapbox-gl-js/${options.version}/mapbox-gl.js`, id: 'byk-gl-js' },
    { type: 'link', attr: 'href', value: `//api.mapbox.com/mapbox-gl-js/${options.version}/mapbox-gl.css`, id: 'byk-gl-css' }
  ]

  const customStylesheetUrl = options.customStylesheetUrl
  if (customStylesheetUrl) {
    resources.push({ type: 'link', attr: 'href', value: customStylesheetUrl, id: 'byk-csu-css' })
  }

  load(resources, { ...options, container: node })

  return {
    destroy () {
      if (map && map.remove) {
        map.remove()
      }
    }
  }
}

function init (options) {
  window.mapboxgl.accessToken = options.accessToken
  const el = new window.mapboxgl.Map(options)

  for (const [ handler, fn ] of Object.entries(handlers)) {
    el.on(handler, ev => {
      const [ eventName, detail ] = fn(el, ev)
      options.container.dispatchEvent(
        new CustomEvent(eventName, { detail })
      )
    })
  }
}

function load (assets, options) {
  for (const { type, attr, value, id } of assets) {
    const existing = document.getElementById(id)
    if (existing) { return }
    const tag = document.createElement(type)
    tag[attr] = value
    if (type === 'script') {
      tag.async = true
      tag.defer = true
      tag.onload = () => init(options)
    } else {
      tag.rel = 'stylesheet'
    }
    document.body.appendChild(tag)
  }
}

const handlers = {
  dragend: el => {
    const { lng, lat } = el.getCenter()
    const center = [ lng, lat ]
    return [ 'recentre', { center } ]
  },
  click: (el, e) => {
    return [ 'click', { lng: e.lngLat.lng, lat: e.lngLat.lat } ]
  },
  zoomstart: el => {
    animationInProgress = true
    const zoom = el.getZoom()
    return [ 'zoomstart', { zoom } ]
  },
  zoom: el => {
    const zoom = el.getZoom()
    return [ 'zoom', { zoom } ]
  },
  zoomend: el => {
    animationInProgress = false
    const zoom = el.getZoom()
    return [ 'zoomend', { zoom } ]
  },
  load: el => {
    return [ 'ready', { map: el } ]
  }
}