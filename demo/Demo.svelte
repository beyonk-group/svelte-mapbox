<svelte:head>
	<link href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&subset=latin,cyrillic' rel='stylesheet' type='text/css'>
</svelte:head>
<header>
	<div class="container">
		<div class="row">
			<div class="col-lg-2 col-xs-12 left">
				<div id="logo">
					<img src="{logo}" alt="vdoc">
				</div>
			</div>
			<div class="col-lg-8 col-md-7 col-xs-12">
				<div class="slogan">
					Svelte MapBox Developer Documentation
				</div>
			</div>
			<div class="col-lg-2 col-md-3 col-xs-12 right">
				<a class="btn" href="http://www.github.com/beyonk-adventures/svelte-googlemaps">Github</a>
			</div>
		</div>
	</div>
</header>
<section class="content">
	<div class="container">
		<div class="content-wrap">
			<div class="row">
				<aside>
					<div class="menu-box">
						<h4>Navigation</h4>	
						<nav>
							<ul>
								<li><a href="#geocoder" on:click={() => { navigate('geocoder') } } class:current={page === 'geocoder'}>Geocoder</a></li>
								<li><a href="#map" on:click={() => { navigate('map') }} class:current={page === 'map'}>Map</a></li>
							</ul>					
						</nav>
					</div>
				</aside>
				<div class="content-info">
					<div class="section-txt" id="geocoder">
						<form on:submit|preventDefault={() => console.log('form submitted') }>
						<Geocoder accessToken="%API_KEY%" on:place-changed={placeChanged} />
            {#if place}
              <dl>
								<dt>Name:</dt>
								<dd>{place.label}</dd>
								<dt>Geolocation:</dt>
								<dd>lat: {place.geometry.lat}, lng: {place.geometry.lng}</dd>
							</dl>
            {/if}
						</form>
          </div>
					<div class="section-txt" id="map">
						<div class="map-wrap">
							<Map
								bind:this={mapComponent}
								accessToken="%API_KEY%"
								controls={{ navigation: {}, geolocate: {} }}
								on:recentre={e => console.log(e.detail.center.lat, e.detail.center.lng) }
								on:ready={e => cluster(e.detail.map)}	
							/>
						</div>
						{#if center}
							<dt>Geolocation:</dt>
							<dd>lat: {center.lat}, lng: {center.lng}</dd>
						{/if}
          </div>
				</div>
			</div>
		</div>
	</div>
</section>
<div class="footer-area">
	<div class="container">
		<div class="row">
			<div class="col-lg-12 center">
				Powered by Beyonk Open Source
			</div>
		</div>
	</div>
</div>
<footer>
	<div class="container">
		<div class="row">
			<div class="col-lg-12 center">
				© 2019 Beyonk. All rights reserved.
			</div>
		</div>
	</div>
</footer>

<style>
	.map-wrap {
		width: 100%;
		height: 300px;
	}
</style>

<script>
  import './normalize.css'
  import './prettify.css'
  import './style.css'
	import { Map, Geocoder } from '../src/components.js'
	import MiniScroller from './MiniScroller.svelte'
	import logo from './logo.svg'
	
	if (typeof window !== 'undefined') {
		window.global = {}
	}

	let page = 'about'
	let place = null
	let center
	let mapComponent

	function navigate (next) {
		page = next
	}

	function placeChanged (e) {
		place = e.detail
		mapComponent.setCenter(e.detail.geometry, 14)
	}
	
	function cluster (map) {
		// Add a new source from our GeoJSON data and set the
		// 'cluster' option to true. GL-JS will add the point_count property to your source data.
		map.addSource("earthquakes", {
				type: "geojson",
				// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
				// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
				data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
				cluster: true,
				clusterMaxZoom: 14, // Max zoom to cluster points on
				clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
		});

		map.addLayer({
				id: "clusters",
				type: "circle",
				source: "earthquakes",
				filter: ["has", "point_count"],
				paint: {
						// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
						// with three steps to implement three types of circles:
						//   * Blue, 20px circles when point count is less than 100
						//   * Yellow, 30px circles when point count is between 100 and 750
						//   * Pink, 40px circles when point count is greater than or equal to 750
						"circle-color": [
								"step",
								["get", "point_count"],
								"#51bbd6",
								100,
								"#f1f075",
								750,
								"#f28cb1"
						],
						"circle-radius": [
								"step",
								["get", "point_count"],
								20,
								100,
								30,
								750,
								40
						]
				}
		});

		map.addLayer({
				id: "cluster-count",
				type: "symbol",
				source: "earthquakes",
				filter: ["has", "point_count"],
				layout: {
						"text-field": "{point_count_abbreviated}",
						"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
						"text-size": 12
				}
		});

		map.addLayer({
				id: "unclustered-point",
				type: "circle",
				source: "earthquakes",
				filter: ["!", ["has", "point_count"]],
				paint: {
						"circle-color": "#11b4da",
						"circle-radius": 4,
						"circle-stroke-width": 1,
						"circle-stroke-color": "#fff"
				}
		});

		map.on('click', 'clusters', function(e) {
				var features = map.queryRenderedFeatures(e.point, {
						layers: ['clusters']
				});
				var clusterId = features[0].properties.cluster_id;
				map.getSource('earthquakes').getClusterExpansionZoom(clusterId, function(err, zoom) {
						if (err)
								return;

						map.easeTo({
								center: features[0].geometry.coordinates,
								zoom: zoom
						});
				});
		});

		map.on('mouseenter', 'clusters', function() {
				map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'clusters', function() {
				map.getCanvas().style.cursor = '';
		});

		map.on('click', 'unclustered-point', function (e) {
			var coordinates = e.features[0].geometry.coordinates.slice();
			var description = e.features[0].properties.description;
			
			// Ensure that if the map is zoomed out such that multiple
			// copies of the feature are visible, the popup appears
			// over the copy being pointed to.
			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}
			
			map.setCenter(coordinates)
			mapComponent.popup(coordinates, '<div id="mini-scroller"></div>')
			new MiniScroller({ target: document.getElementById('mini-scroller'), props: {} })
		});
			
		map.on('mouseenter', 'unclustered-point', function () {
			map.getCanvas().style.cursor = 'pointer';
		});
			
		map.on('mouseleave', 'unclustered-point', function () {
			map.getCanvas().style.cursor = '';
		});
	}
</script>