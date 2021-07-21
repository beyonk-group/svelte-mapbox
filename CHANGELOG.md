# Svelte-Mapbox Changelog

# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
 
## [8.0.0]

### Recentre event
  
Events made more predictable - the recentre event from a map used to actually be `dragend`. It is now triggered by `moveend` - which means it will be fired for anything which moves the map. `dragend` now fires the `dragend` event.

To retain prior behaviour - change uses of `recentre` on `Map` to be `dragend`.
 
### SvelteKit Support

All external dependencies have been removed (except Mapbox of course!)
`fastq` is removed in favour of svelte stores, and because it didn't support ESM.
`@beyonk/svelte-loader` is removed in favour of using actions to load dependencies.
This module should work fine with `SvelteKit` now.

### IE11 Support

This module no longer attempts to support IE11, and neither should you.

### Actions driven

Both components now use Svelte `actions` instead of `onMount`, resulting in faster loading.