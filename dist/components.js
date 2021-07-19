function noop$1() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
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
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
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
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
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
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
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
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
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
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop$1,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop$1;
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
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$2 = "html{font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}\nbody{margin:0;}\narticle,\naside,\ndetails,\nfigcaption,\nfigure,\nfooter,\nheader,\nhgroup,\nmain,\nmenu,\nnav,\nsection,\nsummary{display:block;}\naudio,\ncanvas,\nprogress,\nvideo{display:inline-block;vertical-align:baseline;}\naudio:not([controls]){display:none;height:0;}\n[hidden],\ntemplate{display:none;}\na{background-color:transparent;}\na:active,\na:hover{outline:0;}\nabbr[title]{border-bottom:1px dotted;}\nb,\nstrong{font-weight:bold;}\ndfn{font-style:italic;}\nh1{font-size:2em;margin:0.67em 0;}\nmark{background:#ff0;color:#000;}\nsmall{font-size:80%;}\nsub,\nsup{font-size:75%;line-height:0;position:relative;vertical-align:baseline;}\nsup{top:-0.5em;}\nsub{bottom:-0.25em;}\nimg{border:0;}\nsvg:not(:root){overflow:hidden;}\nfigure{margin:1em 40px;}\nhr{-moz-box-sizing:content-box;box-sizing:content-box;height:0;}\npre{overflow:auto;}\ncode,\nkbd,\npre,\nsamp{font-family:monospace, monospace;font-size:1em;}\nbutton,\ninput,\noptgroup,\nselect,\ntextarea{color:inherit;font:inherit;margin:0;}\nbutton{overflow:visible;}\nbutton,\nselect{text-transform:none;}\nbutton,\nhtml input[type=\"button\"],\ninput[type=\"reset\"],\ninput[type=\"submit\"]{-webkit-appearance:button;cursor:pointer;}\nbutton[disabled],\nhtml input[disabled]{cursor:default;}\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner{border:0;padding:0;}\ninput{line-height:normal;}\ninput[type=\"checkbox\"],\ninput[type=\"radio\"]{box-sizing:border-box;padding:0;}\ninput[type=\"number\"]::-webkit-inner-spin-button,\ninput[type=\"number\"]::-webkit-outer-spin-button{height:auto;}\ninput[type=\"search\"]{-webkit-appearance:textfield;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;box-sizing:content-box;}\ninput[type=\"search\"]::-webkit-search-cancel-button,\ninput[type=\"search\"]::-webkit-search-decoration{-webkit-appearance:none;}\nfieldset{border:1px solid #c0c0c0;margin:0 2px;padding:0.35em 0.625em 0.75em;}\nlegend{border:0;padding:0;}\ntextarea{overflow:auto;}\noptgroup{font-weight:bold;}\ntable{border-collapse:collapse;border-spacing:0;}\ntd,\nth{padding:0;}";
styleInject(css_248z$2);

var css_248z$1 = "/**\n * @license\n * Copyright (C) 2015 Google Inc.\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n *      http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n/* Pretty printing styles. Used with prettify.js. */\n\n\n/* SPAN elements with the classes below are added by prettyprint. */\n.pln { color: #000 }  /* plain text */\n\n@media screen {\n  .str { color: #080 }  /* string content */\n  .kwd { color: #008 }  /* a keyword */\n  .com { color: #800 }  /* a comment */\n  .typ { color: #606 }  /* a type name */\n  .lit { color: #066 }  /* a literal value */\n  /* punctuation, lisp open bracket, lisp close bracket */\n  .pun, .opn, .clo { color: #660 }\n  .tag { color: #008 }  /* a markup tag name */\n  .atn { color: #606 }  /* a markup attribute name */\n  .atv { color: #080 }  /* a markup attribute value */\n  .dec, .var { color: #606 }  /* a declaration; a variable name */\n  .fun { color: red }  /* a function name */\n}\n\n/* Use higher contrast and text-weight for printable form. */\n@media print, projection {\n  .str { color: #060 }\n  .kwd { color: #006; font-weight: bold }\n  .com { color: #600; font-style: italic }\n  .typ { color: #404; font-weight: bold }\n  .lit { color: #044 }\n  .pun, .opn, .clo { color: #440 }\n  .tag { color: #006; font-weight: bold }\n  .atn { color: #404 }\n  .atv { color: #060 }\n}\n\n/* Put a border around prettyprinted code snippets. */\npre.prettyprint { padding: 20px; border: 0!important; background: #f5f5f5!important;margin-bottom:14px; }\n\n/* Specify class=linenums on a pre to get line numbering */\nol.linenums { margin-top: 0; margin-bottom: 0 } /* IE indents via margin-left */\nli.L0,\nli.L1,\nli.L2,\nli.L3,\nli.L5,\nli.L6,\nli.L7,\nli.L8 { list-style-type: decimal !important }\n/* Alternate shading for lines */\nli.L1,\nli.L3,\nli.L5,\nli.L7,\nli.L9 { background: #f5f5f5!important }";
styleInject(css_248z$1);

var css_248z = "body {\n  font-family: 'Open Sans', sans-serif;\n  background:#eaedf2;\n  color:#666;\n  font-size:14px;\n}\n* {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\na{\n  -webkit-transition: all .3s ease;\n  -moz-transition: all .3s ease;\n  -o-transition: all .3s ease;\n  transition: all .3s ease;\n  text-decoration:none;\n}\n.content-info a{\ncolor:#22A7F0\n}\n.content-info a:hover{\ncolor:#000;\n}\na img { \n  border:0;\n}\n\nsection img{\ndisplay:block;\nmax-width:100%;\nheight:auto;\nmargin:15px 0 15px 0;\n}\n\narticle, aside, details, figcaption, figure, footer, header, hgroup, main, nav, section, summary {\ndisplay: block;\n}\nsection{\nposition:relative;\n}\nh1, h2, h3, h4, h5, h6{\nfont-weight:400;\n}\nh1{\nfont-size:36px;\nmargin:0 0 30px 0;\n}\nh2{\nfont-size:30px;\nmargin:0 0 30px 0;\n}\nh3{\nfont-size:24px;\nmargin:0 0 30px 0;\n}\nh4{\nfont-size:20px;\nmargin:0 0 20px 0;\n}\nh5{\nfont-size:18px;\nmargin:0 0 15px 0;\n}\nh6{\nfont-size:16px;\nmargin:0 0 10px 0;\n}\n\n.container {\npadding-right: 15px;\npadding-left: 15px;\nmargin-right: auto;\nmargin-left: auto;\nwidth: 1200px;\n}\n.container:before, .container:after, .clearfix:before, .row:before, .clearfix:after, .row:after {\ndisplay: table;\ncontent: \" \";\n}\n.container:after, .clearfix:after, .row:after {\nclear: both;\n}\n.row {\nmargin-right: -15px;\nmargin-left: -15px;\n}\n\n.col-lg-1, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-5, .col-lg-6, .col-lg-7, .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11 {\nfloat: left;\n}\n.col-xs-1, \n.col-sm-1, \n.col-md-1, \n.col-lg-1, \n.col-xs-2, \n.col-sm-2, \n.col-md-2, \n.col-lg-2, \n.col-xs-3, \n.col-sm-3, \n.col-md-3, \n.col-lg-3, \n.col-xs-4, \n.col-sm-4, \n.col-md-4, \n.col-lg-4, \n.col-xs-5, \n.col-sm-5, \n.col-md-5, \n.col-lg-5, \n.col-xs-6, \n.col-sm-6, \n.col-md-6, \n.col-lg-6, \n.col-xs-7, \n.col-sm-7, \n.col-md-7, \n.col-lg-7, \n.col-xs-8, \n.col-sm-8, \n.col-md-8, \n.col-lg-8, \n.col-xs-9, \n.col-sm-9, \n.col-md-9, \n.col-lg-9, \n.col-xs-10, \n.col-sm-10, \n.col-md-10, \n.col-lg-10, \n.col-xs-11, \n.col-sm-11, \n.col-md-11, \n.col-lg-11, .col-xs-12, .col-sm-12, .col-md-12, .col-lg-12 {\nposition: relative;\nmin-height: 1px;\npadding-right: 15px;\npadding-left: 15px;\n}\n.col-lg-12 {\nwidth: 100%;\n}\n.col-lg-11 {\nwidth: 91.66666667%;\n}\n.col-lg-10 {\nwidth: 83.33333333%;\n}\n.col-lg-9 {\nwidth: 75%;\n}\n.col-lg-8 {\nwidth: 66.66666667%;\n}\n.col-lg-7 {\nwidth: 58.33333333%;\n}\n.col-lg-6 {\nwidth: 50%;\n}\n.col-lg-5 {\nwidth: 41.66666667%;\n}\n.col-lg-4 {\nwidth: 33.33333333%;\n}\n.col-lg-3 {\nwidth: 25%;\n}\n.col-lg-2 {\nwidth: 16.66666667%;\n}\n.col-lg-1 {\nwidth: 8.33333333%;\n}\n.center{\ntext-align:center;\n}\n.left{\ntext-align:left;\n}\n.right{\ntext-align:right;\n}\n.btn{\ndisplay:inline-block;\nwidth:160px;\nheight:40px;\nline-height:38px;\nbackground:#3498db;\ncolor:#fff;\nfont-weight:400;\ntext-align:center;\ntext-transform:uppercase;\nfont-size:14px;\nborder-bottom:2px solid #2a8bcc;\n}\n.btn:hover{\nbackground:#2a8bcc\n}\nheader{\nmargin:0 0 50px 0;\npadding:20px 0;\nbackground:#22A7F0\n}\n.slogan{\ncolor:#fff;\nfont-weight:300;\nfont-size:20px;\nline-height:34px;\n}\n#logo img{\ndisplay:block;\nheight:34px;\n}\n\nsection .container{\n  background:#fff;\n}\n\n.content-wrap{\npadding:50px 0\n}\n\naside{\ncolor:#fff;\nfloat:left;\npadding-left:15px;\nwidth:285px;\n}\n.fixed{\nposition:fixed;\ntop:15px;\n}\naside h4{\nfont-size:20px;\nfont-weight:400;\nmargin:0 0 30px 0;\n}\n\n.menu-box{\npadding:20px;\nbackground:#34495e;\n}\n.menu-box ul{\nmargin:0;\npadding:0;\n}\n.menu-box li{\ndisplay:block;\n}\n.menu-box li a{\ndisplay:block;\npadding:15px 20px;\nmargin-left: -20px;\n  margin-right: -20px;\ncolor:#fff;\nborder-bottom:1px solid #314559;\n}\n.menu-box li a:hover, .menu-box li a.current{\nbackground:#2c3e50;\n}\n.menu-box li:last-child a{\nborder-bottom:0;\n}\n\n.content-info{\npadding-right:15px;\npadding-left:315px;\n}\n.section-txt{\npadding-bottom:15px;\nmargin-bottom:30px;\nborder-bottom:1px solid #dcdcdc;\n}\n.section-txt:last-child{\nmargin-bottom:0;\npadding-bottom:0;\nborder-bottom:0;\n}\n.content-info h3{\nfont-size:24px;\nfont-weight:400;\ncolor:#444;\nmargin:0 0 30px 0;\n}\n.content-info p{\ncolor:#666;\nline-height:24px;\nfont-size:16px;\nfont-weight:300;\n}\n.content-info ul{\nmargin:0 0 14px 0;\n}\n.content-info ul li{\nline-height:24px;\nfont-size:16px;\nfont-weight:300;\n}\n\n.content-info iframe {\n  width: 100%!important;\n  height: 350px;\n  border: 0!important;\n}\n\n.footer-area{\nmargin-top:50px;\npadding:60px 0;\nbackground:#222;\nfont-size:16px;\nline-height:24px;\ncolor:#fff;\nfont-weight:300;\n}\n\n.footer-area a{\ncolor:#999;\n}\n.footer-area a:hover{\ncolor:#eee\n}\nfooter{\nbackground:#111;\npadding:20px 0;\nfont-weight:300;\nfont-size:12px;\n}\n\n@media only screen and (max-width: 1200px) {\n  .container{\n      width:970px;\n  }\n.hidden-md{\n  display:none;\n}\n.col-md-12 {\n  width: 100%;\n  }\n.col-md-11 {\n  width: 91.66666667%;\n  }\n.col-md-10 {\n  width: 83.33333333%;\n  }\n.col-md-9 {\n  width: 75%;\n  }\n.col-md-8 {\n  width: 66.66666667%;\n  }\n.col-md-7 {\n  width: 58.33333333%;\n  }\n.col-md-6 {\n  width: 50%;\n  }\n.col-md-5 {\n  width: 41.66666667%;\n  }\n.col-md-4 {\n  width: 33.33333333%;\n  }\n.col-md-3 {\n  width: 25%;\n  }\n.col-md-2 {\n  width: 16.66666667%;\n  }\n.col-md-1 {\n  width: 8.33333333%;\n}\n\n}\n\n\n@media only screen and (max-width: 992px){\n.container{\n  width:750px;\n}\n.hidden-sm{\n  display:none;\n}\n.col-sm-12 {\n  width: 100%;\n  }\n.col-sm-11 {\n  width: 91.66666667%;\n  }\n.col-sm-10 {\n  width: 83.33333333%;\n  }\n.col-sm-9 {\n  width: 75%;\n  }\n.col-sm-8 {\n  width: 66.66666667%;\n  }\n.col-sm-7 {\n  width: 58.33333333%;\n  }\n.col-sm-6 {\n  width: 50%;\n  }\n.col-sm-5 {\n  width: 41.66666667%;\n  }\n.col-sm-4 {\n  width: 33.33333333%;\n  }\n.col-sm-3 {\n  width: 25%;\n  }\n.col-sm-2 {\n  width: 16.66666667%;\n  }\n.col-sm-1 {\n  width: 8.33333333%;\n}\n.slogan {\n  font-size: 16px;\n}\n\n}\n\n@media only screen and (max-width: 768px){\n.container{\n  width:100%;\n}\n.hidden-xs{\n  display:none;\n}\n.col-xs-12 {\n  width: 100%;\n  }\n.col-xs-11 {\n  width: 91.66666667%;\n  }\n.col-xs-10 {\n  width: 83.33333333%;\n  }\n.col-xs-9 {\n  width: 75%;\n  }\n.col-xs-8 {\n  width: 66.66666667%;\n  }\n.col-xs-7 {\n  width: 58.33333333%;\n  }\n.col-xs-6 {\n  width: 50%;\n  }\n.col-xs-5 {\n  width: 41.66666667%;\n  }\n.col-xs-4 {\n  width: 33.33333333%;\n  }\n.col-xs-3 {\n  width: 25%;\n  }\n.col-xs-2 {\n  width: 16.66666667%;\n  }\n.col-xs-1 {\n  width: 8.33333333%;\n}\nheader{\n  margin-bottom:30px;\n}\n.content-wrap {\n  padding: 30px 0;\n}\n.slogan{\n  text-align:center;\n  line-height:22px;\n  margin-bottom:15px;\n}\n#logo {\n  text-align:center;\n  margin-bottom:15px;\n}\n#logo img{\n  margin:0 auto;\n}\n.btn{\n  display:block;\n  margin:0 auto;\n}\naside{\n  width:100%;\n  float:none;\n  padding:0 15px;\n  margin-bottom:30px;\n}\n.content-info {\n  padding-right: 15px;\n  padding-left: 15px;\n}\n.content-info p, .content-info ul li{\n  font-size:14px;\n  line-height:22px;\n}\n.content-info h3 {\n  font-size: 20px;\n}\nh1{\n  font-size:32px;\n}\nh2{\n  font-size:26px;\n}\nh3{\n  font-size:20px;\n}\nh4{\n  font-size:18px;\n}\nh5{\n  font-size:16px;\n}\nh6{\n  font-size:14px;\n}\n.footer-area {\n  margin-top: 30px;\n  padding: 50px 0;\n  font-size:14px;\n}\n}";
styleInject(css_248z);

function loader (urls, test, callback) {
  let remaining = urls.length;

  function maybeCallback () {
    remaining = --remaining;
    if (remaining < 1) {
      callback();
    }
  }

  if (!test()) {
    urls.forEach(({ type, url, options = { async: true, defer: true }}) => {
      const isScript = type === 'script';
      const tag = document.createElement(isScript ? 'script': 'link');
      if (isScript) {
        tag.src = url;
        tag.async = options.async;
        tag.defer = options.defer;
      } else {
        tag.rel = 'stylesheet';
		    tag.href = url;
      }
      tag.onload = maybeCallback;
      document.body.appendChild(tag);
    });
  } else {
    callback();
  }
}

const contextKey = {};

function reusify (Constructor) {
  var head = new Constructor();
  var tail = head;

  function get () {
    var current = head;

    if (current.next) {
      head = current.next;
    } else {
      head = new Constructor();
      tail = head;
    }

    current.next = null;

    return current
  }

  function release (obj) {
    tail.next = obj;
    tail = obj;
  }

  return {
    get: get,
    release: release
  }
}

var reusify_1 = reusify;

function fastqueue (context, worker, concurrency) {
  if (typeof context === 'function') {
    concurrency = worker;
    worker = context;
    context = null;
  }

  if (concurrency < 1) {
    throw new Error('fastqueue concurrency must be greater than 1')
  }

  var cache = reusify_1(Task);
  var queueHead = null;
  var queueTail = null;
  var _running = 0;
  var errorHandler = null;

  var self = {
    push: push,
    drain: noop,
    saturated: noop,
    pause: pause,
    paused: false,
    concurrency: concurrency,
    running: running,
    resume: resume,
    idle: idle,
    length: length,
    getQueue: getQueue,
    unshift: unshift,
    empty: noop,
    kill: kill,
    killAndDrain: killAndDrain,
    error: error
  };

  return self

  function running () {
    return _running
  }

  function pause () {
    self.paused = true;
  }

  function length () {
    var current = queueHead;
    var counter = 0;

    while (current) {
      current = current.next;
      counter++;
    }

    return counter
  }

  function getQueue () {
    var current = queueHead;
    var tasks = [];

    while (current) {
      tasks.push(current.value);
      current = current.next;
    }

    return tasks
  }

  function resume () {
    if (!self.paused) return
    self.paused = false;
    for (var i = 0; i < self.concurrency; i++) {
      _running++;
      release();
    }
  }

  function idle () {
    return _running === 0 && self.length() === 0
  }

  function push (value, done) {
    var current = cache.get();

    current.context = context;
    current.release = release;
    current.value = value;
    current.callback = done || noop;
    current.errorHandler = errorHandler;

    if (_running === self.concurrency || self.paused) {
      if (queueTail) {
        queueTail.next = current;
        queueTail = current;
      } else {
        queueHead = current;
        queueTail = current;
        self.saturated();
      }
    } else {
      _running++;
      worker.call(context, current.value, current.worked);
    }
  }

  function unshift (value, done) {
    var current = cache.get();

    current.context = context;
    current.release = release;
    current.value = value;
    current.callback = done || noop;

    if (_running === self.concurrency || self.paused) {
      if (queueHead) {
        current.next = queueHead;
        queueHead = current;
      } else {
        queueHead = current;
        queueTail = current;
        self.saturated();
      }
    } else {
      _running++;
      worker.call(context, current.value, current.worked);
    }
  }

  function release (holder) {
    if (holder) {
      cache.release(holder);
    }
    var next = queueHead;
    if (next) {
      if (!self.paused) {
        if (queueTail === queueHead) {
          queueTail = null;
        }
        queueHead = next.next;
        next.next = null;
        worker.call(context, next.value, next.worked);
        if (queueTail === null) {
          self.empty();
        }
      } else {
        _running--;
      }
    } else if (--_running === 0) {
      self.drain();
    }
  }

  function kill () {
    queueHead = null;
    queueTail = null;
    self.drain = noop;
  }

  function killAndDrain () {
    queueHead = null;
    queueTail = null;
    self.drain();
    self.drain = noop;
  }

  function error (handler) {
    errorHandler = handler;
  }
}

function noop () {}

function Task () {
  this.value = null;
  this.callback = noop;
  this.next = null;
  this.release = noop;
  this.context = null;
  this.errorHandler = null;

  var self = this;

  this.worked = function worked (err, result) {
    var callback = self.callback;
    var errorHandler = self.errorHandler;
    var val = self.value;
    self.value = null;
    self.callback = noop;
    if (self.errorHandler) {
      errorHandler(err, val);
    }
    callback.call(self.context, err, result);
    self.release(self);
  };
}

function queueAsPromised (context, worker, concurrency) {
  if (typeof context === 'function') {
    concurrency = worker;
    worker = context;
    context = null;
  }

  function asyncWrapper (arg, cb) {
    worker.call(this, arg)
      .then(function (res) {
        cb(null, res);
      }, cb);
  }

  var queue = fastqueue(context, asyncWrapper, concurrency);

  var pushCb = queue.push;
  var unshiftCb = queue.unshift;

  queue.push = push;
  queue.unshift = unshift;

  return queue

  function push (value) {
    return new Promise(function (resolve, reject) {
      pushCb(value, function (err, result) {
        if (err) {
          reject(err);
          return
        }
        resolve(result);
      });
    })
  }

  function unshift (value) {
    return new Promise(function (resolve, reject) {
      unshiftCb(value, function (err, result) {
        if (err) {
          reject(err);
          return
        }
        resolve(result);
      });
    })
  }
}

var queue = fastqueue;
var promise = queueAsPromised;
queue.promise = promise;

class EventQueue {
  constructor (worker) {
    this.queue = new queue(this, worker, 1);
    this.queue.pause();
  }

  send (command, params = []) {
    if (!command) { return }
    this.queue.push([ command, params ]);
  }

  start () {
    this.queue.resume();
  }

  stop () {
    this.queue.kill();
  }
}

/* src/Map.svelte generated by Svelte v3.35.0 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-1kuj9kb-style";
	style.textContent = "div.svelte-1kuj9kb{width:100%;height:100%}";
	append(document.head, style);
}

// (2:2) {#if map}
function create_if_block$1(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[20].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 524288) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$4(ctx) {
	let div;
	let current;
	let if_block = /*map*/ ctx[0] && create_if_block$1(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "svelte-1kuj9kb");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			/*div_binding*/ ctx[21](div);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*map*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*map*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			/*div_binding*/ ctx[21](null);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	setContext(contextKey, {
		getMap: () => map,
		getMapbox: () => mapbox
	});

	const dispatch = createEventDispatcher();
	let container;
	let mapbox;
	let animationInProgress = false;
	const queue = new EventQueue(worker);
	let { map = null } = $$props;
	let { version = "v1.11.1" } = $$props;
	let { center = [0, 0] } = $$props;
	let { zoom = 9 } = $$props;
	let { zoomRate = 1 } = $$props;
	let { wheelZoomRate = 1 } = $$props;
	let { options = {} } = $$props;
	let { accessToken } = $$props;
	let { customStylesheetUrl = false } = $$props;
	let { style = "mapbox://styles/mapbox/streets-v11" } = $$props;

	function fitBounds(bbox, options = {}) {
		queue.send("fitBounds", [bbox, options]);
	}

	function flyTo(destination, options = {}) {
		queue.send("flyTo", [destination, options]);
	}

	function resize() {
		queue.send("resize");
	}

	function setCenter(coords, eventData = {}) {
		queue.send("setCenter", [coords, eventData]);
	}

	function addControl(control, position = "top-right") {
		queue.send("addControl", [control, position]);
	}

	function getMap() {
		return map;
	}

	function getMapbox() {
		return mapbox;
	}

	function setZoom(zoom, eventData = {}) {
		queue.send("setZoom", [zoom, eventData]);
	}

	function onAvailable() {
		window.mapboxgl.accessToken = accessToken;
		mapbox = window.mapboxgl;

		const optionsWithDefaults = Object.assign(
			{
				container,
				style,
				center,
				zoom,
				zoomRate,
				wheelZoomRate
			},
			options
		);

		const el = new mapbox.Map(optionsWithDefaults);

		el.on("dragend", () => {
			const { lng, lat } = el.getCenter();
			$$invalidate(3, center = [lng, lat]);
			dispatch("recentre", { center });
		});

		el.on("click", e => dispatch("click", { lng: e.lngLat.lng, lat: e.lngLat.lat }));

		el.on("zoomstart", () => {
			$$invalidate(18, animationInProgress = true);
			$$invalidate(2, zoom = el.getZoom());
			dispatch("zoomstart", { zoom });
		});

		el.on("zoom", () => {
			$$invalidate(2, zoom = el.getZoom());
			dispatch("zoom", { zoom });
		});

		el.on("zoomend", () => {
			$$invalidate(18, animationInProgress = false);
			$$invalidate(2, zoom = el.getZoom());
			dispatch("zoomend", { zoom });
		});

		el.on("load", () => {
			$$invalidate(0, map = el);
			queue.start();
			dispatch("ready");
		});
	}

	function worker(cmd, cb) {
		const [command, params] = cmd;
		map[command].apply(map, params);
		cb(null);
	}

	onMount(() => {
		const resources = [
			{
				type: "script",
				url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.js`
			},
			{
				type: "style",
				url: `//api.mapbox.com/mapbox-gl-js/${version}/mapbox-gl.css`
			}
		];

		if (customStylesheetUrl) {
			resources.push({ type: "style", url: customStylesheetUrl });
		}

		loader(resources, () => !!window.mapboxgl, onAvailable);

		return () => {
			queue.stop();

			if (map && map.remove) {
				map.remove();
			}
		};
	});

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			container = $$value;
			$$invalidate(1, container);
		});
	}

	$$self.$$set = $$props => {
		if ("map" in $$props) $$invalidate(0, map = $$props.map);
		if ("version" in $$props) $$invalidate(4, version = $$props.version);
		if ("center" in $$props) $$invalidate(3, center = $$props.center);
		if ("zoom" in $$props) $$invalidate(2, zoom = $$props.zoom);
		if ("zoomRate" in $$props) $$invalidate(5, zoomRate = $$props.zoomRate);
		if ("wheelZoomRate" in $$props) $$invalidate(6, wheelZoomRate = $$props.wheelZoomRate);
		if ("options" in $$props) $$invalidate(7, options = $$props.options);
		if ("accessToken" in $$props) $$invalidate(8, accessToken = $$props.accessToken);
		if ("customStylesheetUrl" in $$props) $$invalidate(9, customStylesheetUrl = $$props.customStylesheetUrl);
		if ("style" in $$props) $$invalidate(10, style = $$props.style);
		if ("$$scope" in $$props) $$invalidate(19, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*animationInProgress, zoom*/ 262148) {
			!animationInProgress && setZoom(zoom);
		}
	};

	return [
		map,
		container,
		zoom,
		center,
		version,
		zoomRate,
		wheelZoomRate,
		options,
		accessToken,
		customStylesheetUrl,
		style,
		fitBounds,
		flyTo,
		resize,
		setCenter,
		addControl,
		getMap,
		getMapbox,
		animationInProgress,
		$$scope,
		slots,
		div_binding
	];
}

class Map$1 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1kuj9kb-style")) add_css$2();

		init(this, options, instance$7, create_fragment$4, safe_not_equal, {
			map: 0,
			version: 4,
			center: 3,
			zoom: 2,
			zoomRate: 5,
			wheelZoomRate: 6,
			options: 7,
			accessToken: 8,
			customStylesheetUrl: 9,
			style: 10,
			fitBounds: 11,
			flyTo: 12,
			resize: 13,
			setCenter: 14,
			addControl: 15,
			getMap: 16,
			getMapbox: 17
		});
	}

	get fitBounds() {
		return this.$$.ctx[11];
	}

	get flyTo() {
		return this.$$.ctx[12];
	}

	get resize() {
		return this.$$.ctx[13];
	}

	get setCenter() {
		return this.$$.ctx[14];
	}

	get addControl() {
		return this.$$.ctx[15];
	}

	get getMap() {
		return this.$$.ctx[16];
	}

	get getMapbox() {
		return this.$$.ctx[17];
	}
}

/* src/Marker.svelte generated by Svelte v3.35.0 */
const get_popup_slot_changes = dirty => ({});
const get_popup_slot_context = ctx => ({});

function create_fragment$3(ctx) {
	let div0;
	let t;
	let div1;
	let current;
	const default_slot_template = /*#slots*/ ctx[15].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);
	const popup_slot_template = /*#slots*/ ctx[15].popup;
	const popup_slot = create_slot(popup_slot_template, ctx, /*$$scope*/ ctx[14], get_popup_slot_context);

	return {
		c() {
			div0 = element("div");
			if (default_slot) default_slot.c();
			t = space();
			div1 = element("div");
			if (popup_slot) popup_slot.c();
			attr(div1, "class", "popup");
		},
		m(target, anchor) {
			insert(target, div0, anchor);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			/*div0_binding*/ ctx[16](div0);
			insert(target, t, anchor);
			insert(target, div1, anchor);

			if (popup_slot) {
				popup_slot.m(div1, null);
			}

			/*div1_binding*/ ctx[17](div1);
			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 16384) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
				}
			}

			if (popup_slot) {
				if (popup_slot.p && dirty & /*$$scope*/ 16384) {
					update_slot(popup_slot, popup_slot_template, ctx, /*$$scope*/ ctx[14], dirty, get_popup_slot_changes, get_popup_slot_context);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(popup_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			transition_out(popup_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (default_slot) default_slot.d(detaching);
			/*div0_binding*/ ctx[16](null);
			if (detaching) detach(t);
			if (detaching) detach(div1);
			if (popup_slot) popup_slot.d(detaching);
			/*div1_binding*/ ctx[17](null);
		}
	};
}

function randomColour() {
	return Math.round(Math.random() * 255);
}

function instance$6($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const { getMap, getMapbox } = getContext(contextKey);
	const map = getMap();
	const mapbox = getMapbox();

	function move(lng, lat) {
		marker.setLngLat({ lng, lat });
	}

	let { lat } = $$props;
	let { lng } = $$props;
	let { label = "Marker" } = $$props;
	let { popupClassName = "beyonk-mapbox-popup" } = $$props;
	let { markerOffset = [0, 0] } = $$props;
	let { popupOffset = 10 } = $$props;
	let { color = randomColour() } = $$props;
	let { popup = true } = $$props;
	let { popupOptions = {} } = $$props;
	let { markerOptions = {} } = $$props;
	let marker;
	let element;
	let elementPopup;

	onMount(() => {
		let namedParams;

		if (element.hasChildNodes()) {
			namedParams = { element, offset: markerOffset };
		} else {
			namedParams = { color, offset: markerOffset };
		}

		$$invalidate(13, marker = new mapbox.Marker(Object.assign(namedParams, markerOptions)));

		if (popup) {
			let namedPopupParams = {
				offset: popupOffset,
				className: popupClassName
			};

			const popupEl = new mapbox.Popup(Object.assign(namedPopupParams, popupOptions));

			if (elementPopup.hasChildNodes()) {
				popupEl.setDOMContent(elementPopup);
			} else {
				popupEl.setText(label);
			}

			marker.setPopup(popupEl);
		}

		marker.setLngLat({ lng, lat }).addTo(map);
		return () => marker.remove();
	});

	function getMarker() {
		return marker;
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			element = $$value;
			$$invalidate(0, element);
		});
	}

	function div1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			elementPopup = $$value;
			$$invalidate(1, elementPopup);
		});
	}

	$$self.$$set = $$props => {
		if ("lat" in $$props) $$invalidate(2, lat = $$props.lat);
		if ("lng" in $$props) $$invalidate(3, lng = $$props.lng);
		if ("label" in $$props) $$invalidate(4, label = $$props.label);
		if ("popupClassName" in $$props) $$invalidate(5, popupClassName = $$props.popupClassName);
		if ("markerOffset" in $$props) $$invalidate(6, markerOffset = $$props.markerOffset);
		if ("popupOffset" in $$props) $$invalidate(7, popupOffset = $$props.popupOffset);
		if ("color" in $$props) $$invalidate(8, color = $$props.color);
		if ("popup" in $$props) $$invalidate(9, popup = $$props.popup);
		if ("popupOptions" in $$props) $$invalidate(10, popupOptions = $$props.popupOptions);
		if ("markerOptions" in $$props) $$invalidate(11, markerOptions = $$props.markerOptions);
		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*marker, lng, lat*/ 8204) {
			marker && move(lng, lat);
		}
	};

	return [
		element,
		elementPopup,
		lat,
		lng,
		label,
		popupClassName,
		markerOffset,
		popupOffset,
		color,
		popup,
		popupOptions,
		markerOptions,
		getMarker,
		marker,
		$$scope,
		slots,
		div0_binding,
		div1_binding
	];
}

class Marker extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$6, create_fragment$3, safe_not_equal, {
			lat: 2,
			lng: 3,
			label: 4,
			popupClassName: 5,
			markerOffset: 6,
			popupOffset: 7,
			color: 8,
			popup: 9,
			popupOptions: 10,
			markerOptions: 11,
			getMarker: 12
		});
	}

	get getMarker() {
		return this.$$.ctx[12];
	}
}

/* src/Geocoder.svelte generated by Svelte v3.35.0 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1k1b3t4-style";
	style.textContent = "div.svelte-1k1b3t4{padding:0}";
	append(document.head, style);
}

function create_fragment$2(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "id", /*fieldId*/ ctx[1]);
			attr(div, "class", "svelte-1k1b3t4");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			/*div_binding*/ ctx[11](div);
		},
		p: noop$1,
		i: noop$1,
		o: noop$1,
		d(detaching) {
			if (detaching) detach(div);
			/*div_binding*/ ctx[11](null);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	const fieldId = "bsm-" + Math.random().toString(36).substring(6);
	let { accessToken } = $$props;
	let { options = {} } = $$props;
	let { version = "v4.5.1" } = $$props;

	let { types = [
		"country",
		"region",
		"postcode",
		"district",
		"place",
		"locality",
		"neighborhood",
		"address"
	] } = $$props;

	let { placeholder = "Search" } = $$props;
	let { value = null } = $$props;
	let { customStylesheetUrl = false } = $$props;
	let { geocoder = null } = $$props;
	let container;
	let ready = false;
	const onResult = p => dispatch("result", p);
	const onResults = p => dispatch("results", p);
	const onError = p => dispatch("error", p);
	const onLoading = p => dispatch("loading", p);
	const onClear = p => dispatch("clear", p);

	onMount(() => {
		const resources = [
			{
				type: "script",
				url: `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${version}/mapbox-gl-geocoder.min.js`
			},
			{
				type: "style",
				url: `//api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/${version}/mapbox-gl-geocoder.css`
			}
		];

		if (customStylesheetUrl) {
			resources.push({ type: "style", url: customStylesheetUrl });
		}

		loader(resources, () => !!window.MapboxGeocoder, onAvailable);

		return () => {
			geocoder && geocoder.off("results", onResults).off("result", onResult).off("loading", onLoading).off("error", onError).off("clear", onClear);
		};
	});

	function onAvailable() {
		const optionsWithDefaults = Object.assign(
			{
				accessToken,
				types: types.join(","),
				placeholder
			},
			options
		);

		$$invalidate(2, geocoder = new window.MapboxGeocoder(optionsWithDefaults));
		geocoder.addTo(`#${fieldId}`);
		geocoder.on("results", onResults).on("result", onResult).on("loading", onLoading).on("error", onError).on("clear", onClear);
		geocoder.setInput(value);
		$$invalidate(10, ready = true);
		dispatch("ready");
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			container = $$value;
			$$invalidate(0, container);
		});
	}

	$$self.$$set = $$props => {
		if ("accessToken" in $$props) $$invalidate(3, accessToken = $$props.accessToken);
		if ("options" in $$props) $$invalidate(4, options = $$props.options);
		if ("version" in $$props) $$invalidate(5, version = $$props.version);
		if ("types" in $$props) $$invalidate(6, types = $$props.types);
		if ("placeholder" in $$props) $$invalidate(7, placeholder = $$props.placeholder);
		if ("value" in $$props) $$invalidate(8, value = $$props.value);
		if ("customStylesheetUrl" in $$props) $$invalidate(9, customStylesheetUrl = $$props.customStylesheetUrl);
		if ("geocoder" in $$props) $$invalidate(2, geocoder = $$props.geocoder);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*ready, value, geocoder*/ 1284) {
			ready && value && geocoder && geocoder.setInput(value);
		}
	};

	return [
		container,
		fieldId,
		geocoder,
		accessToken,
		options,
		version,
		types,
		placeholder,
		value,
		customStylesheetUrl,
		ready,
		div_binding
	];
}

class Geocoder extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1k1b3t4-style")) add_css$1();

		init(this, options, instance$5, create_fragment$2, safe_not_equal, {
			accessToken: 3,
			options: 4,
			version: 5,
			types: 6,
			placeholder: 7,
			value: 8,
			customStylesheetUrl: 9,
			geocoder: 2
		});
	}
}

function createDispatchers (target, dispatch, events) {
  const dispatchers = events.map(name => {
    const dispatcher = data => dispatch(name, data);
    target.on(name, dispatcher);
    return { name, dispatcher }
  });

  return () => {
    dispatchers.forEach(({ name, dispatcher }) => target.off(name, dispatcher));
  }
}

/* src/controls/GeolocateControl.svelte generated by Svelte v3.35.0 */

function instance$4($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	const { getMap, getMapbox } = getContext(contextKey);
	const map = getMap();
	const mapbox = getMapbox();
	let { position = "top-left" } = $$props;
	let { options = {} } = $$props;

	const events = [
		"error",
		"geolocate",
		"outofmaxbounds",
		"trackuserlocationend",
		"trackuserlocationstart"
	];

	const geolocate = new mapbox.GeolocateControl(options);
	map.addControl(geolocate, position);
	const destroyDispatchers = createDispatchers(geolocate, dispatch, events);
	onDestroy(destroyDispatchers);

	function trigger() {
		geolocate.trigger();
	}

	$$self.$$set = $$props => {
		if ("position" in $$props) $$invalidate(0, position = $$props.position);
		if ("options" in $$props) $$invalidate(1, options = $$props.options);
	};

	return [position, options, trigger];
}

class GeolocateControl extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, null, safe_not_equal, { position: 0, options: 1, trigger: 2 });
	}

	get trigger() {
		return this.$$.ctx[2];
	}
}

/* src/controls/NavigationControl.svelte generated by Svelte v3.35.0 */

function instance$3($$self, $$props, $$invalidate) {
	const { getMap, getMapbox } = getContext(contextKey);
	const map = getMap();
	const mapbox = getMapbox();
	let { position = "top-right" } = $$props;
	let { options = {} } = $$props;
	const nav = new mapbox.NavigationControl(options);
	map.addControl(nav, position);

	$$self.$$set = $$props => {
		if ("position" in $$props) $$invalidate(0, position = $$props.position);
		if ("options" in $$props) $$invalidate(1, options = $$props.options);
	};

	return [position, options];
}

class NavigationControl extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, null, safe_not_equal, { position: 0, options: 1 });
	}
}

/* src/controls/ScaleControl.svelte generated by Svelte v3.35.0 */

function instance$2($$self, $$props, $$invalidate) {
	const { getMap, getMapbox } = getContext(contextKey);
	const map = getMap();
	const mapbox = getMapbox();
	let { position = "bottom-right" } = $$props;
	let { options = {} } = $$props;
	const optionsWithDefaults = Object.assign({ maxWidth: 80, unit: "metric" }, options);
	const scale = new mapbox.ScaleControl(optionsWithDefaults);
	map.addControl(scale, position);

	$$self.$$set = $$props => {
		if ("position" in $$props) $$invalidate(0, position = $$props.position);
		if ("options" in $$props) $$invalidate(1, options = $$props.options);
	};

	return [position, options];
}

class ScaleControl extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, null, safe_not_equal, { position: 0, options: 1 });
	}
}

const controls = {
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  ScalingControl: ScaleControl
};

/* demo/MiniScroller.svelte generated by Svelte v3.35.0 */

function create_fragment$1(ctx) {
	let h2;

	return {
		c() {
			h2 = element("h2");
			h2.textContent = "hello";
		},
		m(target, anchor) {
			insert(target, h2, anchor);
		},
		p: noop$1,
		i: noop$1,
		o: noop$1,
		d(detaching) {
			if (detaching) detach(h2);
		}
	};
}

class MiniScroller extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$1, safe_not_equal, {});
	}
}

/* demo/Earthquakes.svelte generated by Svelte v3.35.0 */

function instance$1($$self) {
	const { getMap, getMapbox } = getContext(contextKey);
	const map = getMap();
	const mapbox = getMapbox();

	// Add a new source from our GeoJSON data and set the
	// 'cluster' option to true. GL-JS will add the point_count property to your source data.
	map.addSource("earthquakes", {
		type: "geojson",
		// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
		// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
		data: "https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson",
		cluster: true,
		clusterMaxZoom: 14, // Max zoom to cluster points on
		clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
		
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
			"circle-color": ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
			"circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40]
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

	map.on("click", "clusters", function (e) {
		var features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
		var clusterId = features[0].properties.cluster_id;

		map.getSource("earthquakes").getClusterExpansionZoom(clusterId, function (err, zoom) {
			if (err) return;

			map.easeTo({
				center: features[0].geometry.coordinates,
				zoom
			});
		});
	});

	map.on("mouseenter", "clusters", function () {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", "clusters", function () {
		map.getCanvas().style.cursor = "";
	});

	map.on("click", "unclustered-point", function (e) {
		var coordinates = e.features[0].geometry.coordinates.slice();
		e.features[0].properties.description;

		// Ensure that if the map is zoomed out such that multiple
		// copies of the feature are visible, the popup appears
		// over the copy being pointed to.
		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}

		map.setCenter(coordinates);
		new mapbox.Popup({}).setLngLat(coordinates).setHTML("<div id=\"mini-scroller\"></div>").addTo(map);

		new MiniScroller({
				target: document.getElementById("mini-scroller"),
				props: {}
			});
	});

	map.on("mouseenter", "unclustered-point", function () {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", "unclustered-point", function () {
		map.getCanvas().style.cursor = "";
	});

	return [];
}

class Earthquakes extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, null, safe_not_equal, {});
	}
}

/* demo/Demo.svelte generated by Svelte v3.35.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-1jvh96g-style";
	style.textContent = "#logo svg{fill:white;height:60px}.slogan.svelte-1jvh96g{margin-top:14px}.map-wrap.svelte-1jvh96g{width:100%;height:300px}.action-buttons.svelte-1jvh96g{display:flex;justify-content:space-between}#fly-to.svelte-1jvh96g,#change-zoom.svelte-1jvh96g{display:block;position:relative;margin:0px auto;height:40px;padding:10px;border:none;border-radius:3px;font-size:12px;text-align:center;color:#fff;background:#ee8a65}";
	append(document.head, style);
}

// (85:7) <Map         bind:this={mapComponent}         accessToken="pk.eyJ1IjoiYmV5b25rIiwiYSI6ImNqeWJrZGQzajBhYTkzaHBiaDM0enUxNHkifQ.T20bO9f8tbx_HhGK9HAvxg"         on:recentre={e => console.log(e.detail) }         {center}         bind:zoom        >
function create_default_slot(ctx) {
	let earthquakes;
	let t0;
	let navigationcontrol;
	let t1;
	let geolocatecontrol;
	let t2;
	let marker;
	let current;
	earthquakes = new Earthquakes({});
	navigationcontrol = new /*NavigationControl*/ ctx[4]({});
	geolocatecontrol = new /*GeolocateControl*/ ctx[3]({});

	marker = new Marker({
			props: {
				lat: /*center*/ ctx[5].lat,
				lng: /*center*/ ctx[5].lng
			}
		});

	return {
		c() {
			create_component(earthquakes.$$.fragment);
			t0 = space();
			create_component(navigationcontrol.$$.fragment);
			t1 = space();
			create_component(geolocatecontrol.$$.fragment);
			t2 = space();
			create_component(marker.$$.fragment);
		},
		m(target, anchor) {
			mount_component(earthquakes, target, anchor);
			insert(target, t0, anchor);
			mount_component(navigationcontrol, target, anchor);
			insert(target, t1, anchor);
			mount_component(geolocatecontrol, target, anchor);
			insert(target, t2, anchor);
			mount_component(marker, target, anchor);
			current = true;
		},
		p: noop$1,
		i(local) {
			if (current) return;
			transition_in(earthquakes.$$.fragment, local);
			transition_in(navigationcontrol.$$.fragment, local);
			transition_in(geolocatecontrol.$$.fragment, local);
			transition_in(marker.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(earthquakes.$$.fragment, local);
			transition_out(navigationcontrol.$$.fragment, local);
			transition_out(geolocatecontrol.$$.fragment, local);
			transition_out(marker.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(earthquakes, detaching);
			if (detaching) detach(t0);
			destroy_component(navigationcontrol, detaching);
			if (detaching) detach(t1);
			destroy_component(geolocatecontrol, detaching);
			if (detaching) detach(t2);
			destroy_component(marker, detaching);
		}
	};
}

// (98:6) {#if center}
function create_if_block(ctx) {
	let dt;
	let t1;
	let dd;

	return {
		c() {
			dt = element("dt");
			dt.textContent = "Geolocation:";
			t1 = space();
			dd = element("dd");
			dd.textContent = `lat: ${/*center*/ ctx[5].lat}, lng: ${/*center*/ ctx[5].lng}`;
		},
		m(target, anchor) {
			insert(target, dt, anchor);
			insert(target, t1, anchor);
			insert(target, dd, anchor);
		},
		p: noop$1,
		d(detaching) {
			if (detaching) detach(dt);
			if (detaching) detach(t1);
			if (detaching) detach(dd);
		}
	};
}

function create_fragment(ctx) {
	let link;
	let t0;
	let header;
	let t5;
	let section;
	let div15;
	let div14;
	let div13;
	let aside;
	let div7;
	let h4;
	let t7;
	let nav;
	let ul;
	let li0;
	let a1;
	let t9;
	let li1;
	let a2;
	let t11;
	let div12;
	let div8;
	let button0;
	let t13;
	let button1;
	let t15;
	let div9;
	let form;
	let geocoder;
	let t16;
	let t17;
	let div11;
	let div10;
	let map;
	let updating_zoom;
	let t18;
	let t19;
	let div19;
	let t21;
	let footer;
	let current;
	let mounted;
	let dispose;

	geocoder = new Geocoder({
			props: {
				accessToken: "pk.eyJ1IjoiYmV5b25rIiwiYSI6ImNqeWJrZGQzajBhYTkzaHBiaDM0enUxNHkifQ.T20bO9f8tbx_HhGK9HAvxg"
			}
		});

	geocoder.$on("result", /*placeChanged*/ ctx[7]);

	function map_zoom_binding(value) {
		/*map_zoom_binding*/ ctx[14](value);
	}

	let map_props = {
		accessToken: "pk.eyJ1IjoiYmV5b25rIiwiYSI6ImNqeWJrZGQzajBhYTkzaHBiaDM0enUxNHkifQ.T20bO9f8tbx_HhGK9HAvxg",
		center: /*center*/ ctx[5],
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	};

	if (/*zoom*/ ctx[1] !== void 0) {
		map_props.zoom = /*zoom*/ ctx[1];
	}

	map = new Map$1({ props: map_props });
	/*map_binding*/ ctx[13](map);
	binding_callbacks.push(() => bind(map, "zoom", map_zoom_binding));
	map.$on("recentre", /*recentre_handler*/ ctx[15]);
	let if_block1 = /*center*/ ctx[5] && create_if_block(ctx);

	return {
		c() {
			link = element("link");
			t0 = space();
			header = element("header");

			header.innerHTML = `<div class="container"><div class="row"><div class="col-lg-2 col-xs-12 left"><div id="logo"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 263.2 127" style="enable-background:new 0 0 263.2 127;" xml:space="preserve"><g id="Layer_2_1_"><g id="Layer_1-2"><path class="st0" d="M263.2,28.5v-5.9h-22.5V0h-5.9v22.5H28.5V0h-5.9v22.5H0v5.9h22.5v70.1H0v5.9h22.5V127h5.9v-22.5h206.4V127
									h5.9v-22.5h22.5v-5.9h-22.5V28.5H263.2z M234.8,98.5H28.5V28.5h206.4V98.5z M50.9,52.2h9.3c1.7-0.1,3.4,0.4,4.7,1.5
									c1.1,1.1,1.7,2.7,1.6,4.3c0,1-0.2,2-0.6,2.8c-0.4,0.8-1.1,1.4-1.9,1.9c0.7,0.1,1.5,0.4,2.1,0.7c0.6,0.3,1,0.7,1.4,1.2
									c0.4,0.5,0.6,1,0.8,1.6c0.2,0.6,0.2,1.3,0.2,1.9c0,1-0.2,1.9-0.6,2.8c-0.4,0.8-0.9,1.5-1.6,2.1c-0.7,0.6-1.5,1-2.4,1.2
									c-1.1,0.3-2.1,0.4-3.2,0.4H51L50.9,52.2z M56.8,61.1h1.7c1.8,0,2.8-0.7,2.8-2.2s-0.9-2.2-2.8-2.2h-1.7V61.1z M56.8,70.2h1.9
									c1.1,0.1,2.2-0.1,3.2-0.6c1-0.7,1.3-2.1,0.5-3.1c-0.1-0.2-0.3-0.4-0.5-0.5c-1-0.5-2.1-0.6-3.2-0.6h-1.9V70.2z M93,57.2h-9.9V61
									h9.6v5h-9.6v3.9H93v5H77.2V52.2H93V57.2z M108.2,65.7l-8.2-13.5h7l4.2,7.3l4.2-7.3h7L114,65.7v9h-5.8V65.7z M126,63.5
									c0-1.6,0.3-3.2,0.9-4.7c1.2-2.9,3.6-5.2,6.5-6.3c3.2-1.2,6.8-1.2,10.1,0c1.5,0.6,2.9,1.4,4,2.5c1.1,1.1,2,2.4,2.5,3.8
									c1.2,3,1.2,6.4,0,9.4c-0.6,1.4-1.5,2.7-2.6,3.8c-1.1,1.1-2.5,2-4,2.5c-3.2,1.2-6.8,1.2-10.1,0c-1.5-0.6-2.8-1.4-3.9-2.5
									c-1.1-1.1-2-2.4-2.6-3.8C126.3,66.7,126,65.1,126,63.5z M132.1,63.5c0,0.9,0.2,1.7,0.5,2.5c0.6,1.5,1.9,2.7,3.4,3.3
									c2.4,1,5.1,0.4,6.9-1.3c0.6-0.6,1.1-1.2,1.4-2c0.7-1.6,0.7-3.4,0-5c-0.3-0.8-0.8-1.4-1.4-2c-1.9-1.7-4.5-2.2-6.9-1.3
									c-1.5,0.6-2.7,1.8-3.4,3.4C132.3,61.8,132.1,62.6,132.1,63.5L132.1,63.5z M158.6,74.8V52.2h5.9L175.3,66V52.2h5.8v22.5h-5.8
									L164.5,61v13.8H158.6z M196.7,61.5l7.1-9.3h7.2l-8.9,10.7l9.8,11.9h-7.6l-7.6-9.8v9.8h-5.9V52.2h5.9V61.5z"></path></g></g></svg></div></div> 
			<div class="col-lg-8 col-md-7 col-xs-12"><div class="slogan svelte-1jvh96g">Svelte MapBox Developer Documentation</div></div> 
			<div class="col-lg-2 col-md-3 col-xs-12 right"><a class="btn" href="http://www.github.com/beyonk-adventures/svelte-mapbox">Github</a></div></div></div>`;

			t5 = space();
			section = element("section");
			div15 = element("div");
			div14 = element("div");
			div13 = element("div");
			aside = element("aside");
			div7 = element("div");
			h4 = element("h4");
			h4.textContent = "Navigation";
			t7 = space();
			nav = element("nav");
			ul = element("ul");
			li0 = element("li");
			a1 = element("a");
			a1.textContent = "Geocoder";
			t9 = space();
			li1 = element("li");
			a2 = element("a");
			a2.textContent = "Map";
			t11 = space();
			div12 = element("div");
			div8 = element("div");
			button0 = element("button");
			button0.textContent = "Fly to random location";
			t13 = space();
			button1 = element("button");
			button1.textContent = "Change Zoom Level";
			t15 = space();
			div9 = element("div");
			form = element("form");
			create_component(geocoder.$$.fragment);
			t16 = space();
			t17 = space();
			div11 = element("div");
			div10 = element("div");
			create_component(map.$$.fragment);
			t18 = space();
			if (if_block1) if_block1.c();
			t19 = space();
			div19 = element("div");
			div19.innerHTML = `<div class="container"><div class="row"><div class="col-lg-12 center">Powered by Beyonk Open Source</div></div></div>`;
			t21 = space();
			footer = element("footer");
			footer.innerHTML = `<div class="container"><div class="row"><div class="col-lg-12 center">© 2019 Beyonk. All rights reserved.</div></div></div>`;
			attr(link, "href", "https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700⊂=latin,cyrillic");
			attr(link, "rel", "stylesheet");
			attr(link, "type", "text/css");
			attr(a1, "href", "#geocoder");
			toggle_class(a1, "current", /*page*/ ctx[0] === "geocoder");
			attr(a2, "href", "#map");
			toggle_class(a2, "current", /*page*/ ctx[0] === "map");
			attr(div7, "class", "menu-box");
			attr(button0, "id", "fly-to");
			attr(button0, "class", "svelte-1jvh96g");
			attr(button1, "id", "change-zoom");
			attr(button1, "class", "svelte-1jvh96g");
			attr(div8, "class", "action-buttons svelte-1jvh96g");
			attr(div9, "class", "section-txt");
			attr(div9, "id", "geocoder");
			attr(div10, "class", "map-wrap svelte-1jvh96g");
			attr(div11, "class", "section-txt");
			attr(div11, "id", "map");
			attr(div12, "class", "content-info");
			attr(div13, "class", "row");
			attr(div14, "class", "content-wrap");
			attr(div15, "class", "container");
			attr(section, "class", "content");
			attr(div19, "class", "footer-area");
		},
		m(target, anchor) {
			append(document.head, link);
			insert(target, t0, anchor);
			insert(target, header, anchor);
			insert(target, t5, anchor);
			insert(target, section, anchor);
			append(section, div15);
			append(div15, div14);
			append(div14, div13);
			append(div13, aside);
			append(aside, div7);
			append(div7, h4);
			append(div7, t7);
			append(div7, nav);
			append(nav, ul);
			append(ul, li0);
			append(li0, a1);
			append(ul, t9);
			append(ul, li1);
			append(li1, a2);
			append(div13, t11);
			append(div13, div12);
			append(div12, div8);
			append(div8, button0);
			append(div8, t13);
			append(div8, button1);
			append(div12, t15);
			append(div12, div9);
			append(div9, form);
			mount_component(geocoder, form, null);
			append(form, t16);
			append(div12, t17);
			append(div12, div11);
			append(div11, div10);
			mount_component(map, div10, null);
			append(div11, t18);
			if (if_block1) if_block1.m(div11, null);
			insert(target, t19, anchor);
			insert(target, div19, anchor);
			insert(target, t21, anchor);
			insert(target, footer, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(a1, "click", /*click_handler*/ ctx[9]),
					listen(a2, "click", /*click_handler_1*/ ctx[10]),
					listen(button0, "click", /*flyToRandomPlace*/ ctx[8]),
					listen(button1, "click", /*click_handler_2*/ ctx[11]),
					listen(form, "submit", prevent_default(/*submit_handler*/ ctx[12]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*page*/ 1) {
				toggle_class(a1, "current", /*page*/ ctx[0] === "geocoder");
			}

			if (dirty & /*page*/ 1) {
				toggle_class(a2, "current", /*page*/ ctx[0] === "map");
			}
			const map_changes = {};

			if (dirty & /*$$scope*/ 65536) {
				map_changes.$$scope = { dirty, ctx };
			}

			if (!updating_zoom && dirty & /*zoom*/ 2) {
				updating_zoom = true;
				map_changes.zoom = /*zoom*/ ctx[1];
				add_flush_callback(() => updating_zoom = false);
			}

			map.$set(map_changes);
			if (/*center*/ ctx[5]) if_block1.p(ctx, dirty);
		},
		i(local) {
			if (current) return;
			transition_in(geocoder.$$.fragment, local);
			transition_in(map.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(geocoder.$$.fragment, local);
			transition_out(map.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			detach(link);
			if (detaching) detach(t0);
			if (detaching) detach(header);
			if (detaching) detach(t5);
			if (detaching) detach(section);
			destroy_component(geocoder);
			/*map_binding*/ ctx[13](null);
			destroy_component(map);
			if (if_block1) if_block1.d();
			if (detaching) detach(t19);
			if (detaching) detach(div19);
			if (detaching) detach(t21);
			if (detaching) detach(footer);
			mounted = false;
			run_all(dispose);
		}
	};
}

function randomLng() {
	return 77 + (Math.random() - 0.5) * 30;
}

function randomLat() {
	return 13 + (Math.random() - 0.5) * 30;
}

function instance($$self, $$props, $$invalidate) {
	const { GeolocateControl, NavigationControl } = controls;

	if (typeof window !== "undefined") {
		window.global = {};
	}

	let page = "about";
	let center = { lat: 53.3358627, lng: -2.8572362 };
	let zoom = 11.15;
	let mapComponent;

	function navigate(next) {
		$$invalidate(0, page = next);
	}

	function placeChanged(e) {
		const { result } = e.detail;
		mapComponent.setCenter(result.center, 14);
	}

	function flyToRandomPlace() {
		mapComponent.flyTo({
			center: [randomLng(), randomLat()],
			essential: true
		});
	}

	const click_handler = () => {
		navigate("geocoder");
	};

	const click_handler_1 = () => {
		navigate("map");
	};

	const click_handler_2 = () => $$invalidate(1, zoom = Math.floor(Math.random() * 10));
	const submit_handler = () => console.log("form submitted");

	function map_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			mapComponent = $$value;
			$$invalidate(2, mapComponent);
		});
	}

	function map_zoom_binding(value) {
		zoom = value;
		$$invalidate(1, zoom);
	}

	const recentre_handler = e => console.log(e.detail);

	return [
		page,
		zoom,
		mapComponent,
		GeolocateControl,
		NavigationControl,
		center,
		navigate,
		placeChanged,
		flyToRandomPlace,
		click_handler,
		click_handler_1,
		click_handler_2,
		submit_handler,
		map_binding,
		map_zoom_binding,
		recentre_handler
	];
}

class Demo extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1jvh96g-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

new Demo({ target: document.body });
