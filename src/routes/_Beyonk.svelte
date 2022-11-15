<script>
  import { getContext } from 'svelte'
  import { contextKey } from '$lib/components.js'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  const { getMap, getMapbox } = getContext(contextKey)
  const map = getMap()
  const mapbox = getMapbox()

  const source = 'experiences'
  map.addSource(source, {
      type: 'geojson',
      data: `https://api.beyonk.com/api/v1/experiences/all.geojson`,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: source,
      filter: [ 'has', 'point_count' ],
      paint: {
        'circle-color': [
          'step',
          [ 'get', 'point_count' ],
          [ 'rgba', 255, 60, 38, 0.20 ],
          4,
          [ 'rgba', 255, 60, 38, 0.50 ],
          10,
          [ 'rgba', 255, 60, 38, 0.75 ]
        ],
        'circle-radius': [
          'step',
          [ 'get', 'point_count' ],
          20,
          4,
          25,
          10,
          28
        ]
      }
    })

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: source,
      filter: [ 'has', 'point_count' ],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': [ 'DIN Offc Pro Medium', 'Arial Unicode MS Bold' ],
        'text-size': 12
      },
      paint: {
        'text-color': [ 'rgba', 25, 95, 22, 1 ]
      }
    })

    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: source,
      filter: [ '!', [ 'has', 'point_count' ] ],
      paint: {
        'circle-stroke-color': [ 'rgba', 200, 100, 11, 1 ],
        'circle-stroke-width': 2,
        'circle-color': [ 'rgba', 200, 50, 11, 1 ],
        'circle-radius': 6
      }
    })

    map.on('click', 'unclustered-point', e => {
      const coordinates = e.features[0].geometry.coordinates.slice()

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }

      map.setCenter(coordinates)

      const feature = e.features[0]
      const content = `<b>${feature.properties.title} (${feature.properties.id})</b><dl><dt>area</dt><dd>${feature.properties.area}</dd><dt>tags</dt><dd>${JSON.parse(feature.properties.categories).join(', ')}</dd></dl><br />`

      const popup = new mapboxgl.Popup({ closeOnClick: true })
        .setLngLat(coordinates)
        .setHTML(content)
        .addTo(map)
    })

    map.on('click', 'clusters', function (e) {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [ 'clusters' ]
      })

      const clusterId = features[0].properties.cluster_id

      map.getSource(source).getClusterExpansionZoom(clusterId, function (err, zoom) {
        if (err) {
          return
        }

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        })
      })
    })

    const interactable = [ 'clusters', 'unclustered-point' ]

    interactable.forEach(layer => {
      map.on('mouseenter', layer, function () {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', layer, function () {
        map.getCanvas().style.cursor = ''
      })
    })
</script>