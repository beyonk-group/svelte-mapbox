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
				<a class="btn" href="http://www.github.com/beyonk-adventures/svelte-mapbox">Github</a>
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
		  			<button id="fly-to" on:click={flyToRandomPlace}>Fly to random location</button>
					<div class="section-txt" id="geocoder">
						<form on:submit|preventDefault={() => console.log('form submitted') }>
						<Geocoder accessToken="%API_KEY%" on:result={placeChanged} />
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
								on:recentre={e => console.log(e.detail.center.lat, e.detail.center.lng) }
								options={{ center }}
							>
								<Earthquakes />
                <NavigationControl />
                <GeolocateControl />
								<Marker lat={center.lat} lon={center.lng} />
							</Map>
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
	#fly-to{
		display: block;
        position: relative;
        margin: 0px auto;
        width: 50%;
        height: 40px;
        padding: 10px;
        border: none;
        border-radius: 3px;
        font-size: 12px;
        text-align: center;
        color: #fff;
        background: #ee8a65;
	}
</style>

<script>
  import './normalize.css'
  import './prettify.css'
  import './style.css'
  import { Map, Geocoder, Marker, controls } from '../src/components.js'
	import Earthquakes from './Earthquakes.svelte'
  import logo from './logo.svg'
  
  const { GeolocateControl, NavigationControl } = controls
	
	if (typeof window !== 'undefined') {
		window.global = {}
	}

	let page = 'about'
	let place = null
	let center = { lng: randomLng(), lat: randomLat() }
	let mapComponent

	function navigate (next) {
		page = next
	}

	function placeChanged (e) {
    const { result } = e.detail
		mapComponent.setCenter(result.center, 14)
	}
	
	function randomLng () {
		return 77 + (Math.random() - 0.5) * 30
	}

	function randomLat () {
		return 13 + (Math.random() - 0.5) * 30
	}
  
	function flyToRandomPlace () {
		mapComponent.flyTo({
      center: [
				randomLng(),
				randomLat()
      ],
      essential:true
    })
	}
</script>