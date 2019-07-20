import { c as createCommonjsModule, a as commonjsGlobal } from './chunk-cffaff9d.js';

function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
    const component = current_component;
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}

const globals = (typeof window !== 'undefined' ? window : global);
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/Map.svelte generated by Svelte v3.6.7 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-izdtmm-style';
	style.textContent = "@import '//api.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css';div.svelte-izdtmm{width:100%;height:100%}";
	append(document.head, style);
}

function create_fragment(ctx) {
	var div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "svelte-izdtmm");
		},

		m(target, anchor) {
			insert(target, div, anchor);
			ctx.div_binding(div);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			ctx.div_binding(null);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();

  let container;
  let el;
  let mapboxgl;

  let { controls = {}, accessToken } = $$props;

  const controlTypes = {
    scaling: (position = 'bottom-right', options = {}) => {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric',
        ...options
      });
      el.addControl(scale, position);
    },
    navigation: (position = 'top-right', options = {}) => {
      const nav = new mapboxgl.NavigationControl({
        ...options
      });
      el.addControl(nav, position);
    },
    geolocate: (position = 'top-left', options = {}) => {
      const geolocate = new mapboxgl.GeolocateControl({
        ...options
      });
      el.addControl(geolocate, position);
    }
  };

  onMount(async () => {
    mapboxgl = await import('./mapbox-gl-cdb155be.js');
    mapboxgl.accessToken = accessToken;    el = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11'
    });

    el.on('dragend', () => dispatch('recentre', { center: el.getCenter() }));

    Object
      .keys(controls)
      .forEach(control => {
        const { position, options } = controls[control];
        controlTypes[control](position, options);
      });

    el.on('load', () => dispatch('ready', { map: el }));
  });

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('container', container = $$value);
		});
	}

	$$self.$set = $$props => {
		if ('controls' in $$props) $$invalidate('controls', controls = $$props.controls);
		if ('accessToken' in $$props) $$invalidate('accessToken', accessToken = $$props.accessToken);
	};

	return {
		container,
		controls,
		accessToken,
		div_binding
	};
}

class Map$1 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-izdtmm-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["controls", "accessToken"]);
	}
}

var autocompleter = createCommonjsModule(function (module, exports) {
(function (global, factory) {
   module.exports = factory() ;
}(commonjsGlobal, function () {
  /*
   * https://github.com/kraaden/autocomplete
   * Copyright (c) 2016 Denys Krasnoshchok
   * MIT License
   */
  function autocomplete(settings) {
      // just an alias to minimize JS file size
      var doc = document;
      var container = doc.createElement("div");
      var containerStyle = container.style;
      var userAgent = navigator.userAgent;
      var mobileFirefox = userAgent.indexOf("Firefox") !== -1 && userAgent.indexOf("Mobile") !== -1;
      var debounceWaitMs = settings.debounceWaitMs || 0;
      // 'keyup' event will not be fired on Mobile Firefox, so we have to use 'input' event instead
      var keyUpEventName = mobileFirefox ? "input" : "keyup";
      var items = [];
      var inputValue = "";
      var minLen = 2;
      var showOnFocus = settings.showOnFocus;
      var selected;
      var keypressCounter = 0;
      var debounceTimer;
      if (settings.minLength !== undefined) {
          minLen = settings.minLength;
      }
      if (!settings.input) {
          throw new Error("input undefined");
      }
      var input = settings.input;
      container.className = "autocomplete " + (settings.className || "");
      containerStyle.position = "fixed";
      /**
       * Detach the container from DOM
       */
      function detach() {
          var parent = container.parentNode;
          if (parent) {
              parent.removeChild(container);
          }
      }
      /**
       * Clear debouncing timer if assigned
       */
      function clearDebounceTimer() {
          if (debounceTimer) {
              window.clearTimeout(debounceTimer);
          }
      }
      /**
       * Attach the container to DOM
       */
      function attach() {
          if (!container.parentNode) {
              doc.body.appendChild(container);
          }
      }
      /**
       * Check if container for autocomplete is displayed
       */
      function containerDisplayed() {
          return !!container.parentNode;
      }
      /**
       * Clear autocomplete state and hide container
       */
      function clear() {
          keypressCounter++;
          items = [];
          inputValue = "";
          selected = undefined;
          detach();
      }
      /**
       * Update autocomplete position
       */
      function updatePosition() {
          if (!containerDisplayed()) {
              return;
          }
          containerStyle.height = "auto";
          // containerStyle.width = input.offsetWidth + "px";
          var inputRect = input.getBoundingClientRect();
          var top = inputRect.top + input.offsetHeight;
          var maxHeight = window.innerHeight - top;
          if (maxHeight < 0) {
              maxHeight = 0;
          }
          containerStyle.top = top + "px";
          containerStyle.bottom = "";
          containerStyle.left = inputRect.left + "px";
          containerStyle.maxHeight = maxHeight + "px";
          if (settings.customize) {
              settings.customize(input, inputRect, container, maxHeight);
          }
      }
      /**
       * Redraw the autocomplete div element with suggestions
       */
      function update() {
          // delete all children from autocomplete DOM container
          while (container.firstChild) {
              container.removeChild(container.firstChild);
          }
          // function for rendering autocomplete suggestions
          var render = function (item, currentValue) {
              var itemElement = doc.createElement("div");
              itemElement.textContent = item.label || "";
              return itemElement;
          };
          if (settings.render) {
              render = settings.render;
          }
          // function to render autocomplete groups
          var renderGroup = function (groupName, currentValue) {
              var groupDiv = doc.createElement("div");
              groupDiv.textContent = groupName;
              return groupDiv;
          };
          if (settings.renderGroup) {
              renderGroup = settings.renderGroup;
          }
          var fragment = doc.createDocumentFragment();
          var prevGroup = "#9?$";
          items.forEach(function (item) {
              if (item.group && item.group !== prevGroup) {
                  prevGroup = item.group;
                  var groupDiv = renderGroup(item.group, inputValue);
                  if (groupDiv) {
                      groupDiv.className += " group";
                      fragment.appendChild(groupDiv);
                  }
              }
              var div = render(item, inputValue);
              if (div) {
                  div.addEventListener("click", function (ev) {
                      settings.onSelect(item, input);
                      clear();
                      ev.preventDefault();
                      ev.stopPropagation();
                  });
                  if (item === selected) {
                      div.className += " selected";
                  }
                  fragment.appendChild(div);
              }
          });
          container.appendChild(fragment);
          if (items.length < 1) {
              if (settings.emptyMsg) {
                  var empty = doc.createElement("div");
                  empty.className = "empty";
                  empty.textContent = settings.emptyMsg;
                  container.appendChild(empty);
              }
              else {
                  clear();
                  return;
              }
          }
          attach();
          updatePosition();
          updateScroll();
      }
      function updateIfDisplayed() {
          if (containerDisplayed()) {
              update();
          }
      }
      function resizeEventHandler() {
          updateIfDisplayed();
      }
      function scrollEventHandler(e) {
          if (e.target !== container) {
              updateIfDisplayed();
          }
          else {
              e.preventDefault();
          }
      }
      function keyupEventHandler(ev) {
          var keyCode = ev.which || ev.keyCode || 0;
          var ignore = [38 /* Up */, 13 /* Enter */, 27 /* Esc */, 39 /* Right */, 37 /* Left */, 16 /* Shift */, 17 /* Ctrl */, 18 /* Alt */, 20 /* CapsLock */, 91 /* WindowsKey */, 9 /* Tab */];
          for (var _i = 0, ignore_1 = ignore; _i < ignore_1.length; _i++) {
              var key = ignore_1[_i];
              if (keyCode === key) {
                  return;
              }
          }
          // the down key is used to open autocomplete
          if (keyCode === 40 /* Down */ && containerDisplayed()) {
              return;
          }
          startFetch(0 /* Keyboard */);
      }
      /**
       * Automatically move scroll bar if selected item is not visible
       */
      function updateScroll() {
          var elements = container.getElementsByClassName("selected");
          if (elements.length > 0) {
              var element = elements[0];
              // make group visible
              var previous = element.previousElementSibling;
              if (previous && previous.className.indexOf("group") !== -1 && !previous.previousElementSibling) {
                  element = previous;
              }
              if (element.offsetTop < container.scrollTop) {
                  container.scrollTop = element.offsetTop;
              }
              else {
                  var selectBottom = element.offsetTop + element.offsetHeight;
                  var containerBottom = container.scrollTop + container.offsetHeight;
                  if (selectBottom > containerBottom) {
                      container.scrollTop += selectBottom - containerBottom;
                  }
              }
          }
      }
      /**
       * Select the previous item in suggestions
       */
      function selectPrev() {
          if (items.length < 1) {
              selected = undefined;
          }
          else {
              if (selected === items[0]) {
                  selected = items[items.length - 1];
              }
              else {
                  for (var i = items.length - 1; i > 0; i--) {
                      if (selected === items[i] || i === 1) {
                          selected = items[i - 1];
                          break;
                      }
                  }
              }
          }
      }
      /**
       * Select the next item in suggestions
       */
      function selectNext() {
          if (items.length < 1) {
              selected = undefined;
          }
          if (!selected || selected === items[items.length - 1]) {
              selected = items[0];
              return;
          }
          for (var i = 0; i < (items.length - 1); i++) {
              if (selected === items[i]) {
                  selected = items[i + 1];
                  break;
              }
          }
      }
      function keydownEventHandler(ev) {
          var keyCode = ev.which || ev.keyCode || 0;
          if (keyCode === 38 /* Up */ || keyCode === 40 /* Down */ || keyCode === 27 /* Esc */) {
              var containerIsDisplayed = containerDisplayed();
              if (keyCode === 27 /* Esc */) {
                  clear();
              }
              else {
                  if (!containerDisplayed || items.length < 1) {
                      return;
                  }
                  keyCode === 38 /* Up */
                      ? selectPrev()
                      : selectNext();
                  update();
              }
              ev.preventDefault();
              if (containerIsDisplayed) {
                  ev.stopPropagation();
              }
              return;
          }
          if (keyCode === 13 /* Enter */ && selected) {
              settings.onSelect(selected, input);
              clear();
          }
      }
      function focusEventHandler() {
          if (showOnFocus) {
              startFetch(1 /* Focus */);
          }
      }
      function startFetch(trigger) {
          // if multiple keys were pressed, before we get update from server,
          // this may cause redrawing our autocomplete multiple times after the last key press.
          // to avoid this, the number of times keyboard was pressed will be
          // saved and checked before redraw our autocomplete box.
          var savedKeypressCounter = ++keypressCounter;
          var val = input.value;
          if (val.length >= minLen || trigger === 1 /* Focus */) {
              clearDebounceTimer();
              debounceTimer = window.setTimeout(function () {
                  settings.fetch(val, function (elements) {
                      if (keypressCounter === savedKeypressCounter && elements) {
                          items = elements;
                          inputValue = val;
                          selected = items.length > 0 ? items[0] : undefined;
                          update();
                      }
                  }, 0 /* Keyboard */);
              }, trigger === 0 /* Keyboard */ ? debounceWaitMs : 0);
          }
          else {
              clear();
          }
      }
      function blurEventHandler() {
          // we need to delay clear, because when we click on an item, blur will be called before click and remove items from DOM
          setTimeout(function () {
              if (doc.activeElement !== input) {
                  clear();
              }
          }, 200);
      }
      /**
       * Fixes #26: on long clicks focus will be lost and onSelect method will not be called
       */
      container.addEventListener("mousedown", function (evt) {
          evt.stopPropagation();
          evt.preventDefault();
      });
      /**
       * This function will remove DOM elements and clear event handlers
       */
      function destroy() {
          input.removeEventListener("focus", focusEventHandler);
          input.removeEventListener("keydown", keydownEventHandler);
          input.removeEventListener(keyUpEventName, keyupEventHandler);
          input.removeEventListener("blur", blurEventHandler);
          window.removeEventListener("resize", resizeEventHandler);
          doc.removeEventListener("scroll", scrollEventHandler, true);
          clearDebounceTimer();
          clear();
          // prevent the update call if there are pending AJAX requests
          keypressCounter++;
      }
      // setup event handlers
      input.addEventListener("keydown", keydownEventHandler);
      input.addEventListener(keyUpEventName, keyupEventHandler);
      input.addEventListener("blur", blurEventHandler);
      input.addEventListener("focus", focusEventHandler);
      window.addEventListener("resize", resizeEventHandler);
      doc.addEventListener("scroll", scrollEventHandler, true);
      return {
          destroy: destroy
      };
  }

  return autocomplete;

}));

});

/* src/Geocoder.svelte generated by Svelte v3.6.7 */
const { document: document_1 } = globals;

function add_css$1() {
	var style = element("style");
	style.id = 'svelte-13oy11h-style';
	style.textContent = ".by-mb-autocomplete{background:white;z-index:52;overflow:auto;box-sizing:border-box;border:1px solid rgba(50, 50, 50, 0.6)}.by-mb-autocomplete .svelte-13oy11h{font:inherit}.by-mb-autocomplete>div{display:flex;padding:12px}.by-mb-autocomplete>div>.place.svelte-13oy11h,.by-mb-autocomplete>div>.context.svelte-13oy11h{padding:0 6px}.by-mb-autocomplete>div>.place.svelte-13oy11h{color:teal;font-weight:700}.by-mb-autocomplete>div>.context.svelte-13oy11h{color:darkslategray}.by-mb-autocomplete>div:hover:not(.group),.by-mb-autocomplete>div.selected{background:#81ca91;cursor:pointer}.by-mb-autocomplete>div>.marker.svelte-13oy11h{border-radius:50% 50% 50% 0;border:4px solid teal;width:16px;height:16px;transform:rotate(-45deg)}.by-mb-autocomplete>div.selected>.marker.svelte-13oy11h{border-color:#fff}.by-mb-autocomplete>div>.marker.svelte-13oy11h::after{content:'';width:10px;height:10px;border-radius:50%;top:50%;left:50%;margin-left:-5px;margin-top:-5px;background-color:#fff}";
	append(document_1.head, style);
}

function create_fragment$1(ctx) {
	var input_1, dispose;

	return {
		c() {
			input_1 = element("input");
			attr(input_1, "class", "" + ctx.styleClass + " svelte-13oy11h");
			attr(input_1, "placeholder", ctx.placeholder);
			dispose = listen(input_1, "input", ctx.input_1_input_handler);
		},

		m(target, anchor) {
			insert(target, input_1, anchor);

			input_1.value = ctx.query;

			ctx.input_1_binding(input_1);
		},

		p(changed, ctx) {
			if (changed.query && (input_1.value !== ctx.query)) input_1.value = ctx.query;

			if (changed.styleClass) {
				attr(input_1, "class", "" + ctx.styleClass + " svelte-13oy11h");
			}

			if (changed.placeholder) {
				attr(input_1, "placeholder", ctx.placeholder);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(input_1);
			}

			ctx.input_1_binding(null);
			dispose();
		}
	};
}

function parseSuggestions (payload) {
  return payload.features.map(p => {
    const [ lat, lng ] = p.center;
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

function renderItem (item, currentValue) {
  const itemElement = document.createElement('div');
  const { place, context } = item;
  
  const output = [
    '<div class="marker"></div>',
    '<span class="place">',
    place,
    '</span> <span class="context">',
    context.join(', '),
    '</span>'
  ].join('');

  itemElement.innerHTML = output;
  return itemElement
}

function instance$1($$self, $$props, $$invalidate) {
	

  let input;
  let mapboxgl;
  let query = null;
  
  let { value = null, placeholder = 'Enter Location', styleClass = '', apiUrl = 'https://api.mapbox.com', endpoint = 'mapbox.places', accessToken, debounceWaitMs = 500, minLength = 3 } = $$props;

  function getSearchUrl () {
    return `${apiUrl}/geocoding/v5/${endpoint}/${query}.json?access_token=${accessToken}&autocomplete=true`
  }

  function getAutocompleteResults (text, update) {
    const url = getSearchUrl();
    fetch(url)
    .then(r => r.json())
    .then(results => {
      const suggestions = parseSuggestions(results);
      update(suggestions);
    });
  }

  function onSelect (item) {
    input.value = item.label; $$invalidate('input', input);
    $$invalidate('value', value = item);
  }

  onMount(async () => {
    mapboxgl = await import('./mapbox-gl-cdb155be.js');
    autocompleter({
      input,
      fetch: getAutocompleteResults,
      onSelect,
      debounceWaitMs,
      minLength,
      render: renderItem,
      className: 'by-mb-autocomplete'
    });
  });

	function input_1_input_handler() {
		query = this.value;
		$$invalidate('query', query);
	}

	function input_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('input', input = $$value);
		});
	}

	$$self.$set = $$props => {
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
		if ('styleClass' in $$props) $$invalidate('styleClass', styleClass = $$props.styleClass);
		if ('apiUrl' in $$props) $$invalidate('apiUrl', apiUrl = $$props.apiUrl);
		if ('endpoint' in $$props) $$invalidate('endpoint', endpoint = $$props.endpoint);
		if ('accessToken' in $$props) $$invalidate('accessToken', accessToken = $$props.accessToken);
		if ('debounceWaitMs' in $$props) $$invalidate('debounceWaitMs', debounceWaitMs = $$props.debounceWaitMs);
		if ('minLength' in $$props) $$invalidate('minLength', minLength = $$props.minLength);
	};

	return {
		input,
		query,
		value,
		placeholder,
		styleClass,
		apiUrl,
		endpoint,
		accessToken,
		debounceWaitMs,
		minLength,
		input_1_input_handler,
		input_1_binding
	};
}

class Geocoder extends SvelteComponent {
	constructor(options) {
		super();
		if (!document_1.getElementById("svelte-13oy11h-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["value", "placeholder", "styleClass", "apiUrl", "endpoint", "accessToken", "debounceWaitMs", "minLength"]);
	}
}

export { Geocoder, Map$1 as Map };
