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
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
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
let outros;
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

const globals = (typeof window !== 'undefined' ? window : global);

function bind(component, name, callback) {
    if (component.$$.props.indexOf(name) === -1)
        return;
    component.$$.bound[name] = callback;
    callback(component.$$.ctx[name]);
}
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

var css = "html{font-family:sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}\nbody{margin:0;}\narticle,\naside,\ndetails,\nfigcaption,\nfigure,\nfooter,\nheader,\nhgroup,\nmain,\nmenu,\nnav,\nsection,\nsummary{display:block;}\naudio,\ncanvas,\nprogress,\nvideo{display:inline-block;vertical-align:baseline;}\naudio:not([controls]){display:none;height:0;}\n[hidden],\ntemplate{display:none;}\na{background-color:transparent;}\na:active,\na:hover{outline:0;}\nabbr[title]{border-bottom:1px dotted;}\nb,\nstrong{font-weight:bold;}\ndfn{font-style:italic;}\nh1{font-size:2em;margin:0.67em 0;}\nmark{background:#ff0;color:#000;}\nsmall{font-size:80%;}\nsub,\nsup{font-size:75%;line-height:0;position:relative;vertical-align:baseline;}\nsup{top:-0.5em;}\nsub{bottom:-0.25em;}\nimg{border:0;}\nsvg:not(:root){overflow:hidden;}\nfigure{margin:1em 40px;}\nhr{-moz-box-sizing:content-box;box-sizing:content-box;height:0;}\npre{overflow:auto;}\ncode,\nkbd,\npre,\nsamp{font-family:monospace, monospace;font-size:1em;}\nbutton,\ninput,\noptgroup,\nselect,\ntextarea{color:inherit;font:inherit;margin:0;}\nbutton{overflow:visible;}\nbutton,\nselect{text-transform:none;}\nbutton,\nhtml input[type=\"button\"],\ninput[type=\"reset\"],\ninput[type=\"submit\"]{-webkit-appearance:button;cursor:pointer;}\nbutton[disabled],\nhtml input[disabled]{cursor:default;}\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner{border:0;padding:0;}\ninput{line-height:normal;}\ninput[type=\"checkbox\"],\ninput[type=\"radio\"]{box-sizing:border-box;padding:0;}\ninput[type=\"number\"]::-webkit-inner-spin-button,\ninput[type=\"number\"]::-webkit-outer-spin-button{height:auto;}\ninput[type=\"search\"]{-webkit-appearance:textfield;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;box-sizing:content-box;}\ninput[type=\"search\"]::-webkit-search-cancel-button,\ninput[type=\"search\"]::-webkit-search-decoration{-webkit-appearance:none;}\nfieldset{border:1px solid #c0c0c0;margin:0 2px;padding:0.35em 0.625em 0.75em;}\nlegend{border:0;padding:0;}\ntextarea{overflow:auto;}\noptgroup{font-weight:bold;}\ntable{border-collapse:collapse;border-spacing:0;}\ntd,\nth{padding:0;}";
styleInject(css);

var css$1 = "/**\n * @license\n * Copyright (C) 2015 Google Inc.\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n *      http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n/* Pretty printing styles. Used with prettify.js. */\n\n\n/* SPAN elements with the classes below are added by prettyprint. */\n.pln { color: #000 }  /* plain text */\n\n@media screen {\n  .str { color: #080 }  /* string content */\n  .kwd { color: #008 }  /* a keyword */\n  .com { color: #800 }  /* a comment */\n  .typ { color: #606 }  /* a type name */\n  .lit { color: #066 }  /* a literal value */\n  /* punctuation, lisp open bracket, lisp close bracket */\n  .pun, .opn, .clo { color: #660 }\n  .tag { color: #008 }  /* a markup tag name */\n  .atn { color: #606 }  /* a markup attribute name */\n  .atv { color: #080 }  /* a markup attribute value */\n  .dec, .var { color: #606 }  /* a declaration; a variable name */\n  .fun { color: red }  /* a function name */\n}\n\n/* Use higher contrast and text-weight for printable form. */\n@media print, projection {\n  .str { color: #060 }\n  .kwd { color: #006; font-weight: bold }\n  .com { color: #600; font-style: italic }\n  .typ { color: #404; font-weight: bold }\n  .lit { color: #044 }\n  .pun, .opn, .clo { color: #440 }\n  .tag { color: #006; font-weight: bold }\n  .atn { color: #404 }\n  .atv { color: #060 }\n}\n\n/* Put a border around prettyprinted code snippets. */\npre.prettyprint { padding: 20px; border: 0!important; background: #f5f5f5!important;margin-bottom:14px; }\n\n/* Specify class=linenums on a pre to get line numbering */\nol.linenums { margin-top: 0; margin-bottom: 0 } /* IE indents via margin-left */\nli.L0,\nli.L1,\nli.L2,\nli.L3,\nli.L5,\nli.L6,\nli.L7,\nli.L8 { list-style-type: decimal !important }\n/* Alternate shading for lines */\nli.L1,\nli.L3,\nli.L5,\nli.L7,\nli.L9 { background: #f5f5f5!important }";
styleInject(css$1);

var css$2 = "body {\n  font-family: 'Open Sans', sans-serif;\n  background:#eaedf2;\n  color:#666;\n  font-size:14px;\n}\n* {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\na{\n  -webkit-transition: all .3s ease;\n  -moz-transition: all .3s ease;\n  -o-transition: all .3s ease;\n  transition: all .3s ease;\n  text-decoration:none;\n}\n.content-info a{\ncolor:#22A7F0\n}\n.content-info a:hover{\ncolor:#000;\n}\na img { \n  border:0;\n}\n\nsection img{\ndisplay:block;\nmax-width:100%;\nheight:auto;\nmargin:15px 0 15px 0;\n}\n\narticle, aside, details, figcaption, figure, footer, header, hgroup, main, nav, section, summary {\ndisplay: block;\n}\nsection{\nposition:relative;\n}\nh1, h2, h3, h4, h5, h6{\nfont-weight:400;\n}\nh1{\nfont-size:36px;\nmargin:0 0 30px 0;\n}\nh2{\nfont-size:30px;\nmargin:0 0 30px 0;\n}\nh3{\nfont-size:24px;\nmargin:0 0 30px 0;\n}\nh4{\nfont-size:20px;\nmargin:0 0 20px 0;\n}\nh5{\nfont-size:18px;\nmargin:0 0 15px 0;\n}\nh6{\nfont-size:16px;\nmargin:0 0 10px 0;\n}\n\n.container {\npadding-right: 15px;\npadding-left: 15px;\nmargin-right: auto;\nmargin-left: auto;\nwidth: 1200px;\n}\n.container:before, .container:after, .clearfix:before, .row:before, .clearfix:after, .row:after {\ndisplay: table;\ncontent: \" \";\n}\n.container:after, .clearfix:after, .row:after {\nclear: both;\n}\n.row {\nmargin-right: -15px;\nmargin-left: -15px;\n}\n\n.col-lg-1, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-5, .col-lg-6, .col-lg-7, .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11 {\nfloat: left;\n}\n.col-xs-1, \n.col-sm-1, \n.col-md-1, \n.col-lg-1, \n.col-xs-2, \n.col-sm-2, \n.col-md-2, \n.col-lg-2, \n.col-xs-3, \n.col-sm-3, \n.col-md-3, \n.col-lg-3, \n.col-xs-4, \n.col-sm-4, \n.col-md-4, \n.col-lg-4, \n.col-xs-5, \n.col-sm-5, \n.col-md-5, \n.col-lg-5, \n.col-xs-6, \n.col-sm-6, \n.col-md-6, \n.col-lg-6, \n.col-xs-7, \n.col-sm-7, \n.col-md-7, \n.col-lg-7, \n.col-xs-8, \n.col-sm-8, \n.col-md-8, \n.col-lg-8, \n.col-xs-9, \n.col-sm-9, \n.col-md-9, \n.col-lg-9, \n.col-xs-10, \n.col-sm-10, \n.col-md-10, \n.col-lg-10, \n.col-xs-11, \n.col-sm-11, \n.col-md-11, \n.col-lg-11, .col-xs-12, .col-sm-12, .col-md-12, .col-lg-12 {\nposition: relative;\nmin-height: 1px;\npadding-right: 15px;\npadding-left: 15px;\n}\n.col-lg-12 {\nwidth: 100%;\n}\n.col-lg-11 {\nwidth: 91.66666667%;\n}\n.col-lg-10 {\nwidth: 83.33333333%;\n}\n.col-lg-9 {\nwidth: 75%;\n}\n.col-lg-8 {\nwidth: 66.66666667%;\n}\n.col-lg-7 {\nwidth: 58.33333333%;\n}\n.col-lg-6 {\nwidth: 50%;\n}\n.col-lg-5 {\nwidth: 41.66666667%;\n}\n.col-lg-4 {\nwidth: 33.33333333%;\n}\n.col-lg-3 {\nwidth: 25%;\n}\n.col-lg-2 {\nwidth: 16.66666667%;\n}\n.col-lg-1 {\nwidth: 8.33333333%;\n}\n.center{\ntext-align:center;\n}\n.left{\ntext-align:left;\n}\n.right{\ntext-align:right;\n}\n.btn{\ndisplay:inline-block;\nwidth:160px;\nheight:40px;\nline-height:38px;\nbackground:#3498db;\ncolor:#fff;\nfont-weight:400;\ntext-align:center;\ntext-transform:uppercase;\nfont-size:14px;\nborder-bottom:2px solid #2a8bcc;\n}\n.btn:hover{\nbackground:#2a8bcc\n}\nheader{\nmargin:0 0 50px 0;\npadding:20px 0;\nbackground:#22A7F0\n}\n.slogan{\ncolor:#fff;\nfont-weight:300;\nfont-size:20px;\nline-height:34px;\n}\n#logo img{\ndisplay:block;\nheight:34px;\n}\n\nsection .container{\n  background:#fff;\n}\n\n.content-wrap{\npadding:50px 0\n}\n\naside{\ncolor:#fff;\nfloat:left;\npadding-left:15px;\nwidth:285px;\n}\n.fixed{\nposition:fixed;\ntop:15px;\n}\naside h4{\nfont-size:20px;\nfont-weight:400;\nmargin:0 0 30px 0;\n}\n\n.menu-box{\npadding:20px;\nbackground:#34495e;\n}\n.menu-box ul{\nmargin:0;\npadding:0;\n}\n.menu-box li{\ndisplay:block;\n}\n.menu-box li a{\ndisplay:block;\npadding:15px 20px;\nmargin-left: -20px;\n  margin-right: -20px;\ncolor:#fff;\nborder-bottom:1px solid #314559;\n}\n.menu-box li a:hover, .menu-box li a.current{\nbackground:#2c3e50;\n}\n.menu-box li:last-child a{\nborder-bottom:0;\n}\n\n.content-info{\npadding-right:15px;\npadding-left:315px;\n}\n.section-txt{\npadding-bottom:15px;\nmargin-bottom:30px;\nborder-bottom:1px solid #dcdcdc;\n}\n.section-txt:last-child{\nmargin-bottom:0;\npadding-bottom:0;\nborder-bottom:0;\n}\n.content-info h3{\nfont-size:24px;\nfont-weight:400;\ncolor:#444;\nmargin:0 0 30px 0;\n}\n.content-info p{\ncolor:#666;\nline-height:24px;\nfont-size:16px;\nfont-weight:300;\n}\n.content-info ul{\nmargin:0 0 14px 0;\n}\n.content-info ul li{\nline-height:24px;\nfont-size:16px;\nfont-weight:300;\n}\n\n.content-info iframe {\n  width: 100%!important;\n  height: 350px;\n  border: 0!important;\n}\n\n.footer-area{\nmargin-top:50px;\npadding:60px 0;\nbackground:#222;\nfont-size:16px;\nline-height:24px;\ncolor:#fff;\nfont-weight:300;\n}\n\n.footer-area a{\ncolor:#999;\n}\n.footer-area a:hover{\ncolor:#eee\n}\nfooter{\nbackground:#111;\npadding:20px 0;\nfont-weight:300;\nfont-size:12px;\n}\n\n@media only screen and (max-width: 1200px) {\n  .container{\n      width:970px;\n  }\n.hidden-md{\n  display:none;\n}\n.col-md-12 {\n  width: 100%;\n  }\n.col-md-11 {\n  width: 91.66666667%;\n  }\n.col-md-10 {\n  width: 83.33333333%;\n  }\n.col-md-9 {\n  width: 75%;\n  }\n.col-md-8 {\n  width: 66.66666667%;\n  }\n.col-md-7 {\n  width: 58.33333333%;\n  }\n.col-md-6 {\n  width: 50%;\n  }\n.col-md-5 {\n  width: 41.66666667%;\n  }\n.col-md-4 {\n  width: 33.33333333%;\n  }\n.col-md-3 {\n  width: 25%;\n  }\n.col-md-2 {\n  width: 16.66666667%;\n  }\n.col-md-1 {\n  width: 8.33333333%;\n}\n\n}\n\n\n@media only screen and (max-width: 992px){\n.container{\n  width:750px;\n}\n.hidden-sm{\n  display:none;\n}\n.col-sm-12 {\n  width: 100%;\n  }\n.col-sm-11 {\n  width: 91.66666667%;\n  }\n.col-sm-10 {\n  width: 83.33333333%;\n  }\n.col-sm-9 {\n  width: 75%;\n  }\n.col-sm-8 {\n  width: 66.66666667%;\n  }\n.col-sm-7 {\n  width: 58.33333333%;\n  }\n.col-sm-6 {\n  width: 50%;\n  }\n.col-sm-5 {\n  width: 41.66666667%;\n  }\n.col-sm-4 {\n  width: 33.33333333%;\n  }\n.col-sm-3 {\n  width: 25%;\n  }\n.col-sm-2 {\n  width: 16.66666667%;\n  }\n.col-sm-1 {\n  width: 8.33333333%;\n}\n.slogan {\n  font-size: 16px;\n}\n\n}\n\n@media only screen and (max-width: 768px){\n.container{\n  width:100%;\n}\n.hidden-xs{\n  display:none;\n}\n.col-xs-12 {\n  width: 100%;\n  }\n.col-xs-11 {\n  width: 91.66666667%;\n  }\n.col-xs-10 {\n  width: 83.33333333%;\n  }\n.col-xs-9 {\n  width: 75%;\n  }\n.col-xs-8 {\n  width: 66.66666667%;\n  }\n.col-xs-7 {\n  width: 58.33333333%;\n  }\n.col-xs-6 {\n  width: 50%;\n  }\n.col-xs-5 {\n  width: 41.66666667%;\n  }\n.col-xs-4 {\n  width: 33.33333333%;\n  }\n.col-xs-3 {\n  width: 25%;\n  }\n.col-xs-2 {\n  width: 16.66666667%;\n  }\n.col-xs-1 {\n  width: 8.33333333%;\n}\nheader{\n  margin-bottom:30px;\n}\n.content-wrap {\n  padding: 30px 0;\n}\n.slogan{\n  text-align:center;\n  line-height:22px;\n  margin-bottom:15px;\n}\n#logo {\n  text-align:center;\n  margin-bottom:15px;\n}\n#logo img{\n  margin:0 auto;\n}\n.btn{\n  display:block;\n  margin:0 auto;\n}\naside{\n  width:100%;\n  float:none;\n  padding:0 15px;\n  margin-bottom:30px;\n}\n.content-info {\n  padding-right: 15px;\n  padding-left: 15px;\n}\n.content-info p, .content-info ul li{\n  font-size:14px;\n  line-height:22px;\n}\n.content-info h3 {\n  font-size: 20px;\n}\nh1{\n  font-size:32px;\n}\nh2{\n  font-size:26px;\n}\nh3{\n  font-size:20px;\n}\nh4{\n  font-size:18px;\n}\nh5{\n  font-size:16px;\n}\nh6{\n  font-size:14px;\n}\n.footer-area {\n  margin-top: 30px;\n  padding: 50px 0;\n  font-size:14px;\n}\n}";
styleInject(css$2);

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

var logo = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIyLjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAyNjMuMiAxMjciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI2My4yIDEyNzsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiNGRkZGRkY7fQo8L3N0eWxlPgo8dGl0bGU+QmV5b25rLW9jdG90aG9ycGU8L3RpdGxlPgo8ZyBpZD0iTGF5ZXJfMl8xXyI+Cgk8ZyBpZD0iTGF5ZXJfMS0yIj4KCQk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjYzLjIsMjguNXYtNS45aC0yMi41VjBoLTUuOXYyMi41SDI4LjVWMGgtNS45djIyLjVIMHY1LjloMjIuNXY3MC4xSDB2NS45aDIyLjVWMTI3aDUuOXYtMjIuNWgyMDYuNFYxMjcKCQkJaDUuOXYtMjIuNWgyMi41di01LjloLTIyLjVWMjguNUgyNjMuMnogTTIzNC44LDk4LjVIMjguNVYyOC41aDIwNi40Vjk4LjV6IE01MC45LDUyLjJoOS4zYzEuNy0wLjEsMy40LDAuNCw0LjcsMS41CgkJCWMxLjEsMS4xLDEuNywyLjcsMS42LDQuM2MwLDEtMC4yLDItMC42LDIuOGMtMC40LDAuOC0xLjEsMS40LTEuOSwxLjljMC43LDAuMSwxLjUsMC40LDIuMSwwLjdjMC42LDAuMywxLDAuNywxLjQsMS4yCgkJCWMwLjQsMC41LDAuNiwxLDAuOCwxLjZjMC4yLDAuNiwwLjIsMS4zLDAuMiwxLjljMCwxLTAuMiwxLjktMC42LDIuOGMtMC40LDAuOC0wLjksMS41LTEuNiwyLjFjLTAuNywwLjYtMS41LDEtMi40LDEuMgoJCQljLTEuMSwwLjMtMi4xLDAuNC0zLjIsMC40SDUxTDUwLjksNTIuMnogTTU2LjgsNjEuMWgxLjdjMS44LDAsMi44LTAuNywyLjgtMi4ycy0wLjktMi4yLTIuOC0yLjJoLTEuN1Y2MS4xeiBNNTYuOCw3MC4yaDEuOQoJCQljMS4xLDAuMSwyLjItMC4xLDMuMi0wLjZjMS0wLjcsMS4zLTIuMSwwLjUtMy4xYy0wLjEtMC4yLTAuMy0wLjQtMC41LTAuNWMtMS0wLjUtMi4xLTAuNi0zLjItMC42aC0xLjlWNzAuMnogTTkzLDU3LjJoLTkuOVY2MQoJCQloOS42djVoLTkuNnYzLjlIOTN2NUg3Ny4yVjUyLjJIOTNWNTcuMnogTTEwOC4yLDY1LjdsLTguMi0xMy41aDdsNC4yLDcuM2w0LjItNy4zaDdMMTE0LDY1Ljd2OWgtNS44VjY1Ljd6IE0xMjYsNjMuNQoJCQljMC0xLjYsMC4zLTMuMiwwLjktNC43YzEuMi0yLjksMy42LTUuMiw2LjUtNi4zYzMuMi0xLjIsNi44LTEuMiwxMC4xLDBjMS41LDAuNiwyLjksMS40LDQsMi41YzEuMSwxLjEsMiwyLjQsMi41LDMuOAoJCQljMS4yLDMsMS4yLDYuNCwwLDkuNGMtMC42LDEuNC0xLjUsMi43LTIuNiwzLjhjLTEuMSwxLjEtMi41LDItNCwyLjVjLTMuMiwxLjItNi44LDEuMi0xMC4xLDBjLTEuNS0wLjYtMi44LTEuNC0zLjktMi41CgkJCWMtMS4xLTEuMS0yLTIuNC0yLjYtMy44QzEyNi4zLDY2LjcsMTI2LDY1LjEsMTI2LDYzLjV6IE0xMzIuMSw2My41YzAsMC45LDAuMiwxLjcsMC41LDIuNWMwLjYsMS41LDEuOSwyLjcsMy40LDMuMwoJCQljMi40LDEsNS4xLDAuNCw2LjktMS4zYzAuNi0wLjYsMS4xLTEuMiwxLjQtMmMwLjctMS42LDAuNy0zLjQsMC01Yy0wLjMtMC44LTAuOC0xLjQtMS40LTJjLTEuOS0xLjctNC41LTIuMi02LjktMS4zCgkJCWMtMS41LDAuNi0yLjcsMS44LTMuNCwzLjRDMTMyLjMsNjEuOCwxMzIuMSw2Mi42LDEzMi4xLDYzLjVMMTMyLjEsNjMuNXogTTE1OC42LDc0LjhWNTIuMmg1LjlMMTc1LjMsNjZWNTIuMmg1Ljh2MjIuNWgtNS44CgkJCUwxNjQuNSw2MXYxMy44SDE1OC42eiBNMTk2LjcsNjEuNWw3LjEtOS4zaDcuMmwtOC45LDEwLjdsOS44LDExLjloLTcuNmwtNy42LTkuOHY5LjhoLTUuOVY1Mi4yaDUuOVY2MS41eiIvPgoJPC9nPgo8L2c+Cjwvc3ZnPg==';

/* demo/Demo.svelte generated by Svelte v3.6.7 */

function add_css$2() {
	var style = element("style");
	style.id = 'svelte-14q3vry-style';
	style.textContent = ".map-wrap.svelte-14q3vry{width:100%;height:300px}";
	append(document.head, style);
}

// (42:12) {#if place}
function create_if_block_1(ctx) {
	var dl, dt0, dd0, t1_value = ctx.place.label, t1, dt1, dd1, t3, t4_value = ctx.place.geometry.lat, t4, t5, t6_value = ctx.place.geometry.lng, t6;

	return {
		c() {
			dl = element("dl");
			dt0 = element("dt");
			dt0.textContent = "Name:";
			dd0 = element("dd");
			t1 = text(t1_value);
			dt1 = element("dt");
			dt1.textContent = "Geolocation:";
			dd1 = element("dd");
			t3 = text("lat: ");
			t4 = text(t4_value);
			t5 = text(", lng: ");
			t6 = text(t6_value);
		},

		m(target, anchor) {
			insert(target, dl, anchor);
			append(dl, dt0);
			append(dl, dd0);
			append(dd0, t1);
			append(dl, dt1);
			append(dl, dd1);
			append(dd1, t3);
			append(dd1, t4);
			append(dd1, t5);
			append(dd1, t6);
		},

		p(changed, ctx) {
			if ((changed.place) && t1_value !== (t1_value = ctx.place.label)) {
				set_data(t1, t1_value);
			}

			if ((changed.place) && t4_value !== (t4_value = ctx.place.geometry.lat)) {
				set_data(t4, t4_value);
			}

			if ((changed.place) && t6_value !== (t6_value = ctx.place.geometry.lng)) {
				set_data(t6, t6_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(dl);
			}
		}
	};
}

// (56:6) {#if center}
function create_if_block(ctx) {
	var dt, t1, dd, t2, t3_value = ctx.center.lat, t3, t4, t5_value = ctx.center.lng, t5;

	return {
		c() {
			dt = element("dt");
			dt.textContent = "Geolocation:";
			t1 = space();
			dd = element("dd");
			t2 = text("lat: ");
			t3 = text(t3_value);
			t4 = text(", lng: ");
			t5 = text(t5_value);
		},

		m(target, anchor) {
			insert(target, dt, anchor);
			insert(target, t1, anchor);
			insert(target, dd, anchor);
			append(dd, t2);
			append(dd, t3);
			append(dd, t4);
			append(dd, t5);
		},

		p: noop,

		d(detaching) {
			if (detaching) {
				detach(dt);
				detach(t1);
				detach(dd);
			}
		}
	};
}

function create_fragment$2(ctx) {
	var link, t0, header, div6, div5, div1, div0, img, t1, div3, t3, div4, t5, section, div14, div13, div12, aside, div7, h4, t7, nav, ul, li0, a1, t9, li1, a2, t11, div11, div8, form, updating_value, t12, t13, div10, div9, t14, t15, div18, t17, footer, current, dispose;

	function geocoder_value_binding(value) {
		ctx.geocoder_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let geocoder_props = { accessToken: "undefined" };
	if (ctx.place !== void 0) {
		geocoder_props.value = ctx.place;
	}
	var geocoder = new Geocoder({ props: geocoder_props });

	binding_callbacks.push(() => bind(geocoder, 'value', geocoder_value_binding));

	var if_block0 = (ctx.place) && create_if_block_1(ctx);

	var map = new Map$1({
		props: {
		accessToken: "undefined",
		controls: { navigation: {}, geolocate: {} }
	}
	});
	map.$on("recentre", recentre_handler);
	map.$on("ready", ctx.ready_handler);

	var if_block1 = (ctx.center) && create_if_block(ctx);

	return {
		c() {
			link = element("link");
			t0 = space();
			header = element("header");
			div6 = element("div");
			div5 = element("div");
			div1 = element("div");
			div0 = element("div");
			img = element("img");
			t1 = space();
			div3 = element("div");
			div3.innerHTML = `<div class="slogan">
								Svelte MapBox Developer Documentation
							</div>`;
			t3 = space();
			div4 = element("div");
			div4.innerHTML = `<a class="btn" href="http://www.github.com/beyonk-adventures/svelte-googlemaps">Github</a>`;
			t5 = space();
			section = element("section");
			div14 = element("div");
			div13 = element("div");
			div12 = element("div");
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
			div11 = element("div");
			div8 = element("div");
			form = element("form");
			geocoder.$$.fragment.c();
			t12 = space();
			if (if_block0) if_block0.c();
			t13 = space();
			div10 = element("div");
			div9 = element("div");
			map.$$.fragment.c();
			t14 = space();
			if (if_block1) if_block1.c();
			t15 = space();
			div18 = element("div");
			div18.innerHTML = `<div class="container"><div class="row"><div class="col-lg-12 center">
							Powered by Beyonk Open Source
						</div></div></div>`;
			t17 = space();
			footer = element("footer");
			footer.innerHTML = `<div class="container"><div class="row"><div class="col-lg-12 center">
							© 2019 Beyonk. All rights reserved.
						</div></div></div>`;
			attr(link, "href", "https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700⊂=latin,cyrillic");
			attr(link, "rel", "stylesheet");
			attr(link, "type", "text/css");
			attr(img, "src", logo);
			attr(img, "alt", "vdoc");
			attr(div0, "id", "logo");
			attr(div1, "class", "col-lg-2 col-xs-12 left");
			attr(div3, "class", "col-lg-8 col-md-7 col-xs-12");
			attr(div4, "class", "col-lg-2 col-md-3 col-xs-12 right");
			attr(div5, "class", "row");
			attr(div6, "class", "container");
			attr(a1, "href", "#geocoder");
			toggle_class(a1, "current", ctx.page === 'geocoder');
			attr(a2, "href", "#map");
			toggle_class(a2, "current", ctx.page === 'map');
			attr(div7, "class", "menu-box");
			attr(div8, "class", "section-txt");
			attr(div8, "id", "geocoder");
			attr(div9, "class", "map-wrap svelte-14q3vry");
			attr(div10, "class", "section-txt");
			attr(div10, "id", "map");
			attr(div11, "class", "content-info");
			attr(div12, "class", "row");
			attr(div13, "class", "content-wrap");
			attr(div14, "class", "container");
			attr(section, "class", "content");
			attr(div18, "class", "footer-area");

			dispose = [
				listen(a1, "click", ctx.click_handler),
				listen(a2, "click", ctx.click_handler_1),
				listen(form, "submit", prevent_default(submit_handler))
			];
		},

		m(target, anchor) {
			append(document.head, link);
			insert(target, t0, anchor);
			insert(target, header, anchor);
			append(header, div6);
			append(div6, div5);
			append(div5, div1);
			append(div1, div0);
			append(div0, img);
			append(div5, t1);
			append(div5, div3);
			append(div5, t3);
			append(div5, div4);
			insert(target, t5, anchor);
			insert(target, section, anchor);
			append(section, div14);
			append(div14, div13);
			append(div13, div12);
			append(div12, aside);
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
			append(div12, t11);
			append(div12, div11);
			append(div11, div8);
			append(div8, form);
			mount_component(geocoder, form, null);
			append(form, t12);
			if (if_block0) if_block0.m(form, null);
			append(div11, t13);
			append(div11, div10);
			append(div10, div9);
			mount_component(map, div9, null);
			append(div10, t14);
			if (if_block1) if_block1.m(div10, null);
			insert(target, t15, anchor);
			insert(target, div18, anchor);
			insert(target, t17, anchor);
			insert(target, footer, anchor);
			current = true;
		},

		p(changed, ctx) {
			if (changed.page) {
				toggle_class(a1, "current", ctx.page === 'geocoder');
				toggle_class(a2, "current", ctx.page === 'map');
			}

			var geocoder_changes = {};
			if (!updating_value && changed.place) {
				geocoder_changes.value = ctx.place;
			}
			geocoder.$set(geocoder_changes);

			if (ctx.place) {
				if (if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					if_block0.m(form, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (ctx.center) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block(ctx);
					if_block1.c();
					if_block1.m(div10, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
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

			if (detaching) {
				detach(t0);
				detach(header);
				detach(t5);
				detach(section);
			}

			destroy_component(geocoder, );

			if (if_block0) if_block0.d();

			destroy_component(map, );

			if (if_block1) if_block1.d();

			if (detaching) {
				detach(t15);
				detach(div18);
				detach(t17);
				detach(footer);
			}

			run_all(dispose);
		}
	};
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

	// inspect a cluster on click
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
}

function submit_handler() {
	return console.log('form submitted');
}

function recentre_handler(e) {
	return console.log(e.detail.center.lat, e.detail.center.lng);
}

function instance$2($$self, $$props, $$invalidate) {
	
	
	if (typeof window !== 'undefined') {
		window.global = {};
	}

	let page = 'about';
	let place = null;
	let center;

	function navigate (next) {
		$$invalidate('page', page = next);
	}

	function click_handler() { navigate('geocoder'); }

	function click_handler_1() { navigate('map'); }

	function geocoder_value_binding(value) {
		place = value;
		$$invalidate('place', place);
	}

	function ready_handler(e) {
		return cluster(e.detail.map);
	}

	return {
		page,
		place,
		center,
		navigate,
		click_handler,
		click_handler_1,
		geocoder_value_binding,
		ready_handler
	};
}

class Demo extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-14q3vry-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
	}
}

new Demo({ target: document.body });
