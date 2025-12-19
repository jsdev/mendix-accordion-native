'use strict';

var jsxRuntime = require('react/jsx-runtime');

/*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE */

const {
  entries,
  setPrototypeOf,
  isFrozen,
  getPrototypeOf,
  getOwnPropertyDescriptor
} = Object;
let {
  freeze,
  seal,
  create
} = Object; // eslint-disable-line import/no-mutable-exports
let {
  apply,
  construct
} = typeof Reflect !== 'undefined' && Reflect;
if (!freeze) {
  freeze = function freeze(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
/**
 * Creates a new function that calls the given function with a specified thisArg and arguments.
 *
 * @param func - The function to be wrapped and called.
 * @returns A new function that calls the given function with a specified thisArg and arguments.
 */
function unapply(func) {
  return function (thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
/**
 * Creates a new function that constructs an instance of the given constructor function with the provided arguments.
 *
 * @param func - The constructor function to be wrapped and called.
 * @returns A new function that constructs an instance of the given constructor function with the provided arguments.
 */
function unconstruct(Func) {
  return function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
/**
 * Add properties to a lookup table
 *
 * @param set - The set to which elements will be added.
 * @param array - The array containing elements to be added to the set.
 * @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
 * @returns The modified set with added elements.
 */
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    // Make 'in' and truthy checks like Boolean(set.constructor)
    // independent of any properties defined on Object.prototype.
    // Prevent prototype setters from intercepting set as a this value.
    setPrototypeOf(set, null);
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === 'string') {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        // Config presets (e.g. tags.js, attrs.js) are immutable.
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
/**
 * Clean up an array to harden against CSPP
 *
 * @param array - The array to be cleaned.
 * @returns The cleaned version of the array
 */
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
/**
 * Shallow clone an object
 *
 * @param object - The object to be cloned.
 * @returns A new object that copies the original.
 */
function clone(object) {
  const newObject = create(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
/**
 * This method automatically checks if the prop is function or getter and behaves accordingly.
 *
 * @param object - The object to look up the getter function in its prototype chain.
 * @param prop - The property name for which to find the getter function.
 * @returns The getter function found in the prototype chain or a fallback function.
 */
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === 'function') {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
const html$1 = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);
const svg$1 = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'enterkeyhint', 'exportparts', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'inputmode', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'part', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);
const svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);
// List of SVG elements that are disallowed by default.
// We still need to know them so that we can do namespace
// checks properly in case one wants to add them to
// allow-list.
const svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);
const mathMl$1 = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'mprescripts']);
// Similarly to SVG, we want to know all MathML elements,
// even those that we disallow by default.
const mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);
const text = freeze(['#text']);
const html = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'exportparts', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inert', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'nonce', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'part', 'pattern', 'placeholder', 'playsinline', 'popover', 'popovertarget', 'popovertargetaction', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'slot', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'wrap', 'xmlns', 'slot']);
const svg = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'amplitude', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'exponent', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'intercept', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'mask-type', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'slope', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'tablevalues', 'targetx', 'targety', 'transform', 'transform-origin', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);
const mathMl = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);
const xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

// eslint-disable-next-line unicorn/better-regex
const MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
const ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
const TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm); // eslint-disable-line unicorn/better-regex
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/); // eslint-disable-line no-useless-escape
const ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ARIA_ATTR: ARIA_ATTR,
  ATTR_WHITESPACE: ATTR_WHITESPACE,
  CUSTOM_ELEMENT: CUSTOM_ELEMENT,
  DATA_ATTR: DATA_ATTR,
  DOCTYPE_NAME: DOCTYPE_NAME,
  ERB_EXPR: ERB_EXPR,
  IS_ALLOWED_URI: IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR: MUSTACHE_EXPR,
  TMPLIT_EXPR: TMPLIT_EXPR
});

/* eslint-disable @typescript-eslint/indent */
// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
const NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12 // Deprecated
};
const getGlobal = function getGlobal() {
  return typeof window === 'undefined' ? null : window;
};
/**
 * Creates a no-op policy for internal use only.
 * Don't export this function outside this module!
 * @param trustedTypes The policy factory.
 * @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
 * @return The policy created (or null, if Trusted Types
 * are not supported or creating the policy failed).
 */
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
    return null;
  }
  // Allow the callers to control the unique policy name
  // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
  // Policy creation with duplicate names throws in Trusted Types.
  let suffix = null;
  const ATTR_NAME = 'data-tt-policy-suffix';
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = 'dompurify' + (suffix ? '#' + suffix : '');
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html) {
        return html;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    // Policy creation failed (most likely another DOMPurify script has
    // already run). Skip creating the policy, as this will only cause errors
    // if TT are enforced.
    console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
    return null;
  }
};
const _createHooksMap = function _createHooksMap() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();
  const DOMPurify = root => createDOMPurify(root);
  DOMPurify.version = '3.3.1';
  DOMPurify.removed = [];
  if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
    // Not running in a browser, provide a factory function
    // so that you can pass your own Window
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let {
    document
  } = window;
  const originalDocument = document;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node,
    Element,
    NodeFilter,
    NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser,
    trustedTypes
  } = window;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
  const remove = lookupGetter(ElementPrototype, 'remove');
  const getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
  const getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
  const getParentNode = lookupGetter(ElementPrototype, 'parentNode');
  // As per issue #47, the web-components registry is inherited by a
  // new document created via createHTMLDocument. As per the spec
  // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
  // a new empty registry is used when creating a template contents owner
  // document, so we use that as our parent document to ensure nothing
  // is inherited.
  if (typeof HTMLTemplateElement === 'function') {
    const template = document.createElement('template');
    if (template.content && template.content.ownerDocument) {
      document = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = '';
  const {
    implementation,
    createNodeIterator,
    createDocumentFragment,
    getElementsByTagName
  } = document;
  const {
    importNode
  } = originalDocument;
  let hooks = _createHooksMap();
  /**
   * Expose whether this browser supports running the full DOMPurify.
   */
  DOMPurify.isSupported = typeof entries === 'function' && typeof getParentNode === 'function' && implementation && implementation.createHTMLDocument !== undefined;
  const {
    MUSTACHE_EXPR,
    ERB_EXPR,
    TMPLIT_EXPR,
    DATA_ATTR,
    ARIA_ATTR,
    IS_SCRIPT_OR_DATA,
    ATTR_WHITESPACE,
    CUSTOM_ELEMENT
  } = EXPRESSIONS;
  let {
    IS_ALLOWED_URI: IS_ALLOWED_URI$1
  } = EXPRESSIONS;
  /**
   * We consider the elements and attributes below to be safe. Ideally
   * don't add any new ones but feel free to remove unwanted ones.
   */
  /* allowed element names */
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  /* Allowed attribute names */
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  /*
   * Configure how DOMPurify should handle custom elements and their attributes as well as customized built-in elements.
   * @property {RegExp|Function|null} tagNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any custom elements)
   * @property {RegExp|Function|null} attributeNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any attributes not on the allow list)
   * @property {boolean} allowCustomizedBuiltInElements allow custom elements derived from built-ins if they pass CUSTOM_ELEMENT_HANDLING.tagNameCheck. Default: `false`.
   */
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
  let FORBID_TAGS = null;
  /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
  let FORBID_ATTR = null;
  /* Config object to store ADD_TAGS/ADD_ATTR functions (when used as functions) */
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  /* Decide if ARIA attributes are okay */
  let ALLOW_ARIA_ATTR = true;
  /* Decide if custom data attributes are okay */
  let ALLOW_DATA_ATTR = true;
  /* Decide if unknown protocols are okay */
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  /* Decide if self-closing tags in attributes are allowed.
   * Usually removed due to a mXSS issue in jQuery 3.0 */
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  /* Output should be safe for common template engines.
   * This means, DOMPurify removes data attributes, mustaches and ERB
   */
  let SAFE_FOR_TEMPLATES = false;
  /* Output should be safe even for XML used within HTML and alike.
   * This means, DOMPurify removes comments when containing risky content.
   */
  let SAFE_FOR_XML = true;
  /* Decide if document with <html>... should be returned */
  let WHOLE_DOCUMENT = false;
  /* Track whether config is already set on this instance of DOMPurify. */
  let SET_CONFIG = false;
  /* Decide if all elements (e.g. style, script) must be children of
   * document.body. By default, browsers might move them to document.head */
  let FORCE_BODY = false;
  /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
   * string (or a TrustedHTML object if Trusted Types are supported).
   * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
   */
  let RETURN_DOM = false;
  /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
   * string  (or a TrustedHTML object if Trusted Types are supported) */
  let RETURN_DOM_FRAGMENT = false;
  /* Try to return a Trusted Type object instead of a string, return a string in
   * case Trusted Types are not supported  */
  let RETURN_TRUSTED_TYPE = false;
  /* Output should be free from DOM clobbering attacks?
   * This sanitizes markups named with colliding, clobberable built-in DOM APIs.
   */
  let SANITIZE_DOM = true;
  /* Achieve full DOM Clobbering protection by isolating the namespace of named
   * properties and JS variables, mitigating attacks that abuse the HTML/DOM spec rules.
   *
   * HTML/DOM spec rules that enable DOM Clobbering:
   *   - Named Access on Window (§7.3.3)
   *   - DOM Tree Accessors (§3.1.5)
   *   - Form Element Parent-Child Relations (§4.10.3)
   *   - Iframe srcdoc / Nested WindowProxies (§4.8.5)
   *   - HTMLCollection (§4.2.10.2)
   *
   * Namespace isolation is implemented by prefixing `id` and `name` attributes
   * with a constant string, i.e., `user-content-`
   */
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = 'user-content-';
  /* Keep element content when removing element? */
  let KEEP_CONTENT = true;
  /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
   * of importing it into a new Document and returning a sanitized copy */
  let IN_PLACE = false;
  /* Allow usage of profiles like html, svg and mathMl */
  let USE_PROFILES = {};
  /* Tags to ignore content of when KEEP_CONTENT is true */
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);
  /* Tags that are safe for data: URIs */
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
  /* Attributes safe for values like "javascript:" */
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);
  const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
  /* Document namespace */
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  /* Allowed XHTML+XML namespaces */
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ['mi', 'mo', 'mn', 'ms', 'mtext']);
  let HTML_INTEGRATION_POINTS = addToSet({}, ['annotation-xml']);
  // Certain elements are allowed in both SVG and HTML
  // namespace. We need to specify them explicitly
  // so that they don't get erroneously deleted from
  // HTML namespace.
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ['title', 'style', 'font', 'a', 'script']);
  /* Parsing of strict XHTML documents */
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ['application/xhtml+xml', 'text/html'];
  const DEFAULT_PARSER_MEDIA_TYPE = 'text/html';
  let transformCaseFunc = null;
  /* Keep a reference to config to pass to hooks */
  let CONFIG = null;
  /* Ideally, do not touch anything below this line */
  /* ______________________________________________ */
  const formElement = document.createElement('form');
  const isRegexOrFunction = function isRegexOrFunction(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  /**
   * _parseConfig
   *
   * @param cfg optional config literal
   */
  // eslint-disable-next-line complexity
  const _parseConfig = function _parseConfig() {
    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    /* Shield configuration object from tampering */
    if (!cfg || typeof cfg !== 'object') {
      cfg = {};
    }
    /* Shield configuration object from prototype pollution */
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE =
    // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    // HTML tags and attributes are not case-sensitive, converting to lowercase. Keeping XHTML as is.
    transformCaseFunc = PARSER_MEDIA_TYPE === 'application/xhtml+xml' ? stringToString : stringToLowerCase;
    /* Set configuration parameters */
    ALLOWED_TAGS = objectHasOwnProperty(cfg, 'ALLOWED_TAGS') ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, 'ALLOWED_ATTR') ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, 'ALLOWED_NAMESPACES') ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, 'ADD_URI_SAFE_ATTR') ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, 'ADD_DATA_URI_TAGS') ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, 'FORBID_CONTENTS') ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, 'FORBID_TAGS') ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, 'FORBID_ATTR') ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, 'USE_PROFILES') ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false; // Default true
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false; // Default true
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
    RETURN_DOM = cfg.RETURN_DOM || false; // Default false
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
    FORCE_BODY = cfg.FORCE_BODY || false; // Default false
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false; // Default false
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
    IN_PLACE = cfg.IN_PLACE || false; // Default false
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === 'boolean') {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    /* Parse profile info */
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = [];
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    /* Merge configuration parameters */
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === 'function') {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === 'function') {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (cfg.ADD_FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    /* Add #text in case KEEP_CONTENT is set to true */
    if (KEEP_CONTENT) {
      ALLOWED_TAGS['#text'] = true;
    }
    /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
    }
    /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ['tbody']);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== 'function') {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== 'function') {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      // Overwrite existing TrustedTypes policy.
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      // Sign local variables required by `sanitize`.
      emptyHTML = trustedTypesPolicy.createHTML('');
    } else {
      // Uninitialized policy, attempt to initialize the internal dompurify policy.
      if (trustedTypesPolicy === undefined) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      // If creating the internal policy succeeded sign internal variables.
      if (trustedTypesPolicy !== null && typeof emptyHTML === 'string') {
        emptyHTML = trustedTypesPolicy.createHTML('');
      }
    }
    // Prevent further manipulation of configuration.
    // Not available in IE8, Safari 5, etc.
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  /* Keep track of all possible SVG and MathML tags
   * so that we can perform the namespace checks
   * correctly. */
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  /**
   * @param element a DOM element whose namespace is being checked
   * @returns Return false if the element has a
   *  namespace that a spec-compliant parser would never
   *  return. Return true otherwise.
   */
  const _checkValidNamespace = function _checkValidNamespace(element) {
    let parent = getParentNode(element);
    // In JSDOM, if we're inside shadow DOM, then parentNode
    // can be null. We just simulate parent in this case.
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: 'template'
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      // The only way to switch from HTML namespace to SVG
      // is via <svg>. If it happens via any other tag, then
      // it should be killed.
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === 'svg';
      }
      // The only way to switch from MathML to SVG is via`
      // svg if parent is either <annotation-xml> or MathML
      // text integration points.
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      // We only allow elements that are defined in SVG
      // spec. All others are disallowed in SVG namespace.
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      // The only way to switch from HTML namespace to MathML
      // is via <math>. If it happens via any other tag, then
      // it should be killed.
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === 'math';
      }
      // The only way to switch from SVG to MathML is via
      // <math> and HTML integration points
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
      }
      // We only allow elements that are defined in MathML
      // spec. All others are disallowed in MathML namespace.
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      // The only way to switch from SVG to HTML is via
      // HTML integration points, and from MathML to HTML
      // is via MathML text integration points
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      // We disallow tags that are specific for MathML
      // or SVG and should never appear in HTML namespace
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    // For XHTML and XML documents that support custom namespaces
    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    // The code should never reach this place (this means
    // that the element somehow got namespace that is not
    // HTML, SVG, MathML or allowed via ALLOWED_NAMESPACES).
    // Return false just in case.
    return false;
  };
  /**
   * _forceRemove
   *
   * @param node a DOM node
   */
  const _forceRemove = function _forceRemove(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
    }
  };
  /**
   * _removeAttribute
   *
   * @param name an Attribute name
   * @param element a DOM node
   */
  const _removeAttribute = function _removeAttribute(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    // We void attribute values for unremovable "is" attributes
    if (name === 'is') {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {}
      } else {
        try {
          element.setAttribute(name, '');
        } catch (_) {}
      }
    }
  };
  /**
   * _initDocument
   *
   * @param dirty - a string of dirty markup
   * @return a DOM, filled with the dirty markup
   */
  const _initDocument = function _initDocument(dirty) {
    /* Create a HTML document */
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = '<remove></remove>' + dirty;
    } else {
      /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && NAMESPACE === HTML_NAMESPACE) {
      // Root of XHTML doc must contain xmlns declaration (see https://www.w3.org/TR/xhtml1/normative.html#strict)
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + '</body></html>';
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    /*
     * Use the DOMParser API by default, fallback later if needs be
     * DOMParser not work for svg when has multiple root element.
     */
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {}
    }
    /* Use createHTMLDocument in case DOMParser is not available */
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, 'template', null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
        // Syntax error if dirtyPayload is invalid xml
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    /* Work on whole document or just its body */
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  /**
   * Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
   *
   * @param root The root element or node to start traversing on.
   * @return The created NodeIterator
   */
  const _createNodeIterator = function _createNodeIterator(root) {
    return createNodeIterator.call(root.ownerDocument || root, root,
    // eslint-disable-next-line no-bitwise
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
  };
  /**
   * _isClobbered
   *
   * @param element element to check for clobbering attacks
   * @return true if clobbered, false if safe
   */
  const _isClobbered = function _isClobbered(element) {
    return element instanceof HTMLFormElement && (typeof element.nodeName !== 'string' || typeof element.textContent !== 'string' || typeof element.removeChild !== 'function' || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== 'function' || typeof element.setAttribute !== 'function' || typeof element.namespaceURI !== 'string' || typeof element.insertBefore !== 'function' || typeof element.hasChildNodes !== 'function');
  };
  /**
   * Checks whether the given object is a DOM node.
   *
   * @param value object to check whether it's a DOM node
   * @return true is object is a DOM node
   */
  const _isNode = function _isNode(value) {
    return typeof Node === 'function' && value instanceof Node;
  };
  function _executeHooks(hooks, currentNode, data) {
    arrayForEach(hooks, hook => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  /**
   * _sanitizeElements
   *
   * @protect nodeName
   * @protect textContent
   * @protect removeChild
   * @param currentNode to check for permission to exist
   * @return true if node was killed, false if left alive
   */
  const _sanitizeElements = function _sanitizeElements(currentNode) {
    let content = null;
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    /* Check if element is clobbered or can clobber */
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Now let's check the element's type and name */
    const tagName = transformCaseFunc(currentNode.nodeName);
    /* Execute a hook if present */
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    /* Detect mXSS attempts abusing namespace confusion */
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove any occurrence of processing instructions */
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove any kind of possibly harmful comments */
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove element if anything forbids its presence */
    if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
      /* Check if we have a custom element to handle */
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      /* Keep content except for bad-listed elements */
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    /* Check whether element has a valid namespace */
    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Make sure that older browsers don't get fallback-tag mXSS */
    if ((tagName === 'noscript' || tagName === 'noembed' || tagName === 'noframes') && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Sanitize element content to be template-safe */
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      /* Get the element's text content */
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
        content = stringReplace(content, expr, ' ');
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  /**
   * _isValidAttribute
   *
   * @param lcTag Lowercase tag name of containing element.
   * @param lcName Lowercase attribute name.
   * @param value Attribute value.
   * @return Returns true if `value` is valid, otherwise false.
   */
  // eslint-disable-next-line complexity
  const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
    /* Make sure attribute cannot clobber */
    if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
      return false;
    }
    /* Allow valid data-* attributes: At least one character after "-"
        (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
        XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
        We don't need to check the value; it's always URI safe. */
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR, lcName)) ;else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR, lcName)) ;else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ;else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
      // First condition does a very basic check if a) it's basically a valid custom element tagname AND
      // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
      // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
      _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) ||
      // Alternative, second condition checks if it's an `is`-attribute, AND
      // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
      lcName === 'is' && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))) ;else {
        return false;
      }
      /* Check value is safe. First, is attr inert? If so, is safe */
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE, ''))) ;else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ;else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA, stringReplace(value, ATTR_WHITESPACE, ''))) ;else if (value) {
      return false;
    } else ;
    return true;
  };
  /**
   * _isBasicCustomElement
   * checks if at least one dash is included in tagName, and it's not the first char
   * for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
   *
   * @param tagName name of the tag of the node to sanitize
   * @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
   */
  const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
    return tagName !== 'annotation-xml' && stringMatch(tagName, CUSTOM_ELEMENT);
  };
  /**
   * _sanitizeAttributes
   *
   * @protect attributes
   * @protect nodeName
   * @protect removeAttribute
   * @protect setAttribute
   *
   * @param currentNode to sanitize
   */
  const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const {
      attributes
    } = currentNode;
    /* Check if we have attributes; if not we might have a text node */
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: '',
      attrValue: '',
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: undefined
    };
    let l = attributes.length;
    /* Go backwards over all attributes; safely remove bad ones */
    while (l--) {
      const attr = attributes[l];
      const {
        name,
        namespaceURI,
        value: attrValue
      } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === 'value' ? initValue : stringTrim(initValue);
      /* Execute a hook if present */
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      /* Full DOM Clobbering protection via namespace isolation,
       * Prefix id and name attributes with `user-content-`
       */
      if (SANITIZE_NAMED_PROPS && (lcName === 'id' || lcName === 'name')) {
        // Remove the attribute with this value
        _removeAttribute(name, currentNode);
        // Prefix the value and later re-create the attribute with the sanitized value
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      /* Work around a security issue with comments inside attributes */
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Make sure we cannot easily use animated hrefs, even if animations are allowed */
      if (lcName === 'attributename' && stringMatch(value, 'href')) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Did the hooks approve of the attribute? */
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      /* Did the hooks approve of the attribute? */
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Work around a security issue in jQuery 3.0 */
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Sanitize attribute content to be template-safe */
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
          value = stringReplace(value, expr, ' ');
        });
      }
      /* Is `value` valid for this attribute? */
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Handle attributes that require Trusted Types */
      if (trustedTypesPolicy && typeof trustedTypes === 'object' && typeof trustedTypes.getAttributeType === 'function') {
        if (namespaceURI) ;else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case 'TrustedHTML':
              {
                value = trustedTypesPolicy.createHTML(value);
                break;
              }
            case 'TrustedScriptURL':
              {
                value = trustedTypesPolicy.createScriptURL(value);
                break;
              }
          }
        }
      }
      /* Handle invalid data-* attribute set by try-catching it */
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  /**
   * _sanitizeShadowDOM
   *
   * @param fragment to iterate over recursively
   */
  const _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      /* Execute a hook if present */
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      /* Sanitize tags and elements */
      _sanitizeElements(shadowNode);
      /* Check attributes next */
      _sanitizeAttributes(shadowNode);
      /* Deep shadow DOM detected */
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(shadowNode.content);
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  // eslint-disable-next-line complexity
  DOMPurify.sanitize = function (dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    /* Make sure we have a string to sanitize.
      DO NOT return early, as this will return the wrong type if
      the user has requested a DOM object rather than a string */
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = '<!-->';
    }
    /* Stringify, in case dirty is an object */
    if (typeof dirty !== 'string' && !_isNode(dirty)) {
      if (typeof dirty.toString === 'function') {
        dirty = dirty.toString();
        if (typeof dirty !== 'string') {
          throw typeErrorCreate('dirty is not a string, aborting');
        }
      } else {
        throw typeErrorCreate('toString is not a function');
      }
    }
    /* Return dirty HTML if DOMPurify cannot run */
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    /* Assign config vars */
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    /* Clean up removed elements */
    DOMPurify.removed = [];
    /* Check if dirty is correctly typed for IN_PLACE */
    if (typeof dirty === 'string') {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      /* Do some early pre-sanitization to avoid unsafe root nodes */
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate('root node is forbidden and cannot be sanitized in-place');
        }
      }
    } else if (dirty instanceof Node) {
      /* If dirty is a DOM element, append to an empty document to avoid
         elements being stripped by the parser */
      body = _initDocument('<!---->');
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === 'BODY') {
        /* Node is already a body, use as is */
        body = importedNode;
      } else if (importedNode.nodeName === 'HTML') {
        body = importedNode;
      } else {
        // eslint-disable-next-line unicorn/prefer-dom-node-append
        body.appendChild(importedNode);
      }
    } else {
      /* Exit directly if we have nothing to do */
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
      // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf('<') === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      /* Initialize the document to work on */
      body = _initDocument(dirty);
      /* Check we have a DOM node from the data */
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : '';
      }
    }
    /* Remove first element node (ours) if FORCE_BODY is set */
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    /* Get node iterator */
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    /* Now start iterating over the created document */
    while (currentNode = nodeIterator.nextNode()) {
      /* Sanitize tags and elements */
      _sanitizeElements(currentNode);
      /* Check attributes next */
      _sanitizeAttributes(currentNode);
      /* Shadow DOM detected, sanitize it */
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }
    }
    /* If we sanitized `dirty` in-place, return it. */
    if (IN_PLACE) {
      return dirty;
    }
    /* Return sanitized string or DOM */
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          // eslint-disable-next-line unicorn/prefer-dom-node-append
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        /*
          AdoptNode() is not used because internal state is not reset
          (e.g. the past names map of a HTMLFormElement), this is safe
          in theory but we would rather not risk another attack vector.
          The state that is cloned by importNode() is explicitly defined
          by the specs.
        */
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    /* Serialize doctype if allowed */
    if (WHOLE_DOCUMENT && ALLOWED_TAGS['!doctype'] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = '<!DOCTYPE ' + body.ownerDocument.doctype.name + '>\n' + serializedHTML;
    }
    /* Sanitize final string template-safe */
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
        serializedHTML = stringReplace(serializedHTML, expr, ' ');
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function () {
    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function () {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function (tag, attr, value) {
    /* Initialize shared config vars if necessary. */
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function (entryPoint, hookFunction) {
    if (typeof hookFunction !== 'function') {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function (entryPoint, hookFunction) {
    if (hookFunction !== undefined) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? undefined : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function (entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function () {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

/**
 * marked v17.0.1 - a markdown parser
 * Copyright (c) 2018-2025, MarkedJS. (MIT License)
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */

function L() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
var T = L();
function Z(u) {
  T = u;
}
var C = {
  exec: () => null
};
function k(u, e = "") {
  let t = typeof u == "string" ? u : u.source,
    n = {
      replace: (r, i) => {
        let s = typeof i == "string" ? i : i.source;
        return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
      },
      getRegex: () => new RegExp(t, e)
    };
  return n;
}
var me = (() => {
    try {
      return !!new RegExp("(?<=1)(?<!1)");
    } catch {
      return !1;
    }
  })(),
  m = {
    codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
    outputLinkReplace: /\\([\[\]])/g,
    indentCodeCompensation: /^(\s+)(?:```)/,
    beginningSpace: /^\s+/,
    endingHash: /#$/,
    startingSpaceChar: /^ /,
    endingSpaceChar: / $/,
    nonSpaceChar: /[^ ]/,
    newLineCharGlobal: /\n/g,
    tabCharGlobal: /\t/g,
    multipleSpaceGlobal: /\s+/g,
    blankLine: /^[ \t]*$/,
    doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
    blockquoteStart: /^ {0,3}>/,
    blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
    blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
    listReplaceTabs: /^\t+/,
    listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
    listIsTask: /^\[[ xX]\] +\S/,
    listReplaceTask: /^\[[ xX]\] +/,
    listTaskCheckbox: /\[[ xX]\]/,
    anyLine: /\n.*\n/,
    hrefBrackets: /^<(.*)>$/,
    tableDelimiter: /[:|]/,
    tableAlignChars: /^\||\| *$/g,
    tableRowBlankLine: /\n[ \t]*$/,
    tableAlignRight: /^ *-+: *$/,
    tableAlignCenter: /^ *:-+: *$/,
    tableAlignLeft: /^ *:-+ *$/,
    startATag: /^<a /i,
    endATag: /^<\/a>/i,
    startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
    endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
    startAngleBracket: /^</,
    endAngleBracket: />$/,
    pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
    unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
    caret: /(^|[^\[])\^/g,
    percentDecode: /%25/g,
    findPipe: /\|/g,
    splitPipe: / \|/,
    slashPipe: /\\\|/g,
    carriageReturn: /\r\n|\r/g,
    spaceLine: /^ +$/gm,
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    listItemRegex: u => new RegExp(`^( {0,3}${u})((?:[	 ][^\\n]*)?(?:\\n|$))`),
    nextBulletRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
    hrRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
    fencesBeginRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}(?:\`\`\`|~~~)`),
    headingBeginRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}#`),
    htmlBeginRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}<(?:[a-z].*>|!--)`, "i")
  },
  xe = /^(?:[ \t]*(?:\n|$))+/,
  be = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,
  Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  I = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
  Te = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  N = /(?:[*+-]|\d{1,9}[.)])/,
  re = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  se = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(),
  Oe = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),
  Q = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  we = /^[^\n]+/,
  F = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,
  ye = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", F).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),
  Pe = k(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, N).getRegex(),
  v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",
  j = /<!--(?:-?>|[\s\S]*?(?:-->|$))/,
  Se = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", j).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),
  ie = k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex(),
  $e = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ie).getRegex(),
  U = {
    blockquote: $e,
    code: be,
    def: ye,
    fences: Re,
    heading: Te,
    hr: I,
    html: Se,
    lheading: se,
    list: Pe,
    newline: xe,
    paragraph: ie,
    table: C,
    text: we
  },
  te = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex(),
  _e = {
    ...U,
    lheading: Oe,
    table: te,
    paragraph: k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", te).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex()
  },
  Le = {
    ...U,
    html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", j).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: C,
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: k(Q).replace("hr", I).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", se).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
  },
  Me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  ze = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  oe = /^( {2,}|\\)\n(?!\s*$)/,
  Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  D = /[\p{P}\p{S}]/u,
  K = /[\s\p{P}\p{S}]/u,
  ae = /[^\s\p{P}\p{S}]/u,
  Ce = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, K).getRegex(),
  le = /(?!~)[\p{P}\p{S}]/u,
  Ie = /(?!~)[\s\p{P}\p{S}]/u,
  Ee = /(?:[^\s\p{P}\p{S}]|~)/u,
  Be = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", me ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(),
  ue = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,
  qe = k(ue, "u").replace(/punct/g, D).getRegex(),
  ve = k(ue, "u").replace(/punct/g, le).getRegex(),
  pe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",
  De = k(pe, "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex(),
  He = k(pe, "gu").replace(/notPunctSpace/g, Ee).replace(/punctSpace/g, Ie).replace(/punct/g, le).getRegex(),
  Ze = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex(),
  Ge = k(/\\(punct)/, "gu").replace(/punct/g, D).getRegex(),
  Ne = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),
  Qe = k(j).replace("(?:-->|$)", "-->").getRegex(),
  Fe = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Qe).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),
  q = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,
  je = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),
  ce = k(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", F).getRegex(),
  he = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", F).getRegex(),
  Ue = k("reflink|nolink(?!\\()", "g").replace("reflink", ce).replace("nolink", he).getRegex(),
  ne = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,
  W = {
    _backpedal: C,
    anyPunctuation: Ge,
    autolink: Ne,
    blockSkip: Be,
    br: oe,
    code: ze,
    del: C,
    emStrongLDelim: qe,
    emStrongRDelimAst: De,
    emStrongRDelimUnd: Ze,
    escape: Me,
    link: je,
    nolink: he,
    punctuation: Ce,
    reflink: ce,
    reflinkSearch: Ue,
    tag: Fe,
    text: Ae,
    url: C
  },
  Ke = {
    ...W,
    link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(),
    reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex()
  },
  G = {
    ...W,
    emStrongRDelimAst: He,
    emStrongLDelim: ve,
    url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ne).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
    text: k(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ne).getRegex()
  },
  We = {
    ...G,
    br: k(oe).replace("{2,}", "*").getRegex(),
    text: k(G.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
  },
  E = {
    normal: U,
    gfm: _e,
    pedantic: Le
  },
  M = {
    normal: W,
    gfm: G,
    breaks: We,
    pedantic: Ke
  };
var Xe = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  },
  ke = u => Xe[u];
function w(u, e) {
  if (e) {
    if (m.escapeTest.test(u)) return u.replace(m.escapeReplace, ke);
  } else if (m.escapeTestNoEncode.test(u)) return u.replace(m.escapeReplaceNoEncode, ke);
  return u;
}
function X(u) {
  try {
    u = encodeURI(u).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return u;
}
function J(u, e) {
  let t = u.replace(m.findPipe, (i, s, a) => {
      let o = !1,
        l = s;
      for (; --l >= 0 && a[l] === "\\";) o = !o;
      return o ? "|" : " |";
    }),
    n = t.split(m.splitPipe),
    r = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);else for (; n.length < e;) n.push("");
  for (; r < n.length; r++) n[r] = n[r].trim().replace(m.slashPipe, "|");
  return n;
}
function z(u, e, t) {
  let n = u.length;
  if (n === 0) return "";
  let r = 0;
  for (; r < n;) {
    let i = u.charAt(n - r - 1);
    if (i === e && !t) r++;else if (i !== e && t) r++;else break;
  }
  return u.slice(0, n - r);
}
function de(u, e) {
  if (u.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < u.length; n++) if (u[n] === "\\") n++;else if (u[n] === e[0]) t++;else if (u[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function ge(u, e, t, n, r) {
  let i = e.href,
    s = e.title || null,
    a = u[1].replace(r.other.outputLinkReplace, "$1");
  n.state.inLink = !0;
  let o = {
    type: u[0].charAt(0) === "!" ? "image" : "link",
    raw: t,
    href: i,
    title: s,
    text: a,
    tokens: n.inlineTokens(a)
  };
  return n.state.inLink = !1, o;
}
function Je(u, e, t) {
  let n = u.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let r = n[1];
  return e.split(`
`).map(i => {
    let s = i.match(t.other.beginningSpace);
    if (s === null) return i;
    let [a] = s;
    return a.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var y = class {
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return {
      type: "space",
      raw: t[0]
    };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : z(n, `
`)
      };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0],
        r = Je(n, t[3] || "", this.rules);
      return {
        type: "code",
        raw: n,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: r
      };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let r = z(n, "#");
        (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return {
      type: "hr",
      raw: z(t[0], `
`)
    };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = z(t[0], `
`).split(`
`),
        r = "",
        i = "",
        s = [];
      for (; n.length > 0;) {
        let a = !1,
          o = [],
          l;
        for (l = 0; l < n.length; l++) if (this.rules.other.blockquoteStart.test(n[l])) o.push(n[l]), a = !0;else if (!a) o.push(n[l]);else break;
        n = n.slice(l);
        let p = o.join(`
`),
          c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        r = r ? `${r}
${p}` : p, i = i ? `${i}
${c}` : c;
        let g = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, s, !0), this.lexer.state.top = g, n.length === 0) break;
        let h = s.at(-1);
        if (h?.type === "code") break;
        if (h?.type === "blockquote") {
          let R = h,
            f = R.raw + `
` + n.join(`
`),
            O = this.blockquote(f);
          s[s.length - 1] = O, r = r.substring(0, r.length - R.raw.length) + O.raw, i = i.substring(0, i.length - R.text.length) + O.text;
          break;
        } else if (h?.type === "list") {
          let R = h,
            f = R.raw + `
` + n.join(`
`),
            O = this.list(f);
          s[s.length - 1] = O, r = r.substring(0, r.length - h.raw.length) + O.raw, i = i.substring(0, i.length - R.raw.length) + O.raw, n = f.substring(s.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: r,
        tokens: s,
        text: i
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(),
        r = n.length > 1,
        i = {
          type: "list",
          raw: "",
          ordered: r,
          start: r ? +n.slice(0, -1) : "",
          loose: !1,
          items: []
        };
      n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
      let s = this.rules.other.listItemRegex(n),
        a = !1;
      for (; e;) {
        let l = !1,
          p = "",
          c = "";
        if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
        p = t[0], e = e.substring(p.length);
        let g = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, O => " ".repeat(3 * O.length)),
          h = e.split(`
`, 1)[0],
          R = !g.trim(),
          f = 0;
        if (this.options.pedantic ? (f = 2, c = g.trimStart()) : R ? f = t[1].length + 1 : (f = t[2].search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = g.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (p += h + `
`, e = e.substring(h.length + 1), l = !0), !l) {
          let O = this.rules.other.nextBulletRegex(f),
            V = this.rules.other.hrRegex(f),
            Y = this.rules.other.fencesBeginRegex(f),
            ee = this.rules.other.headingBeginRegex(f),
            fe = this.rules.other.htmlBeginRegex(f);
          for (; e;) {
            let H = e.split(`
`, 1)[0],
              A;
            if (h = H, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), A = h) : A = h.replace(this.rules.other.tabCharGlobal, "    "), Y.test(h) || ee.test(h) || fe.test(h) || O.test(h) || V.test(h)) break;
            if (A.search(this.rules.other.nonSpaceChar) >= f || !h.trim()) c += `
` + A.slice(f);else {
              if (R || g.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(g) || ee.test(g) || V.test(g)) break;
              c += `
` + h;
            }
            !R && !h.trim() && (R = !0), p += H + `
`, e = e.substring(H.length + 1), g = A.slice(f);
          }
        }
        i.loose || (a ? i.loose = !0 : this.rules.other.doubleBlankLine.test(p) && (a = !0)), i.items.push({
          type: "list_item",
          raw: p,
          task: !!this.options.gfm && this.rules.other.listIsTask.test(c),
          loose: !1,
          text: c,
          tokens: []
        }), i.raw += p;
      }
      let o = i.items.at(-1);
      if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();else return;
      i.raw = i.raw.trimEnd();
      for (let l of i.items) {
        if (this.lexer.state.top = !1, l.tokens = this.lexer.blockTokens(l.text, []), l.task) {
          if (l.text = l.text.replace(this.rules.other.listReplaceTask, ""), l.tokens[0]?.type === "text" || l.tokens[0]?.type === "paragraph") {
            l.tokens[0].raw = l.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l.tokens[0].text = l.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let c = this.lexer.inlineQueue.length - 1; c >= 0; c--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)) {
              this.lexer.inlineQueue[c].src = this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let p = this.rules.other.listTaskCheckbox.exec(l.raw);
          if (p) {
            let c = {
              type: "checkbox",
              raw: p[0] + " ",
              checked: p[0] !== "[ ]"
            };
            l.checked = c.checked, i.loose ? l.tokens[0] && ["paragraph", "text"].includes(l.tokens[0].type) && "tokens" in l.tokens[0] && l.tokens[0].tokens ? (l.tokens[0].raw = c.raw + l.tokens[0].raw, l.tokens[0].text = c.raw + l.tokens[0].text, l.tokens[0].tokens.unshift(c)) : l.tokens.unshift({
              type: "paragraph",
              raw: c.raw,
              text: c.raw,
              tokens: [c]
            }) : l.tokens.unshift(c);
          }
        }
        if (!i.loose) {
          let p = l.tokens.filter(g => g.type === "space"),
            c = p.length > 0 && p.some(g => this.rules.other.anyLine.test(g.raw));
          i.loose = c;
        }
      }
      if (i.loose) for (let l of i.items) {
        l.loose = !0;
        for (let p of l.tokens) p.type === "text" && (p.type = "paragraph");
      }
      return i;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) return {
      type: "html",
      block: !0,
      raw: t[0],
      pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
      text: t[0]
    };
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "),
        r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "",
        i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: n,
        raw: t[0],
        href: r,
        title: i
      };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = J(t[1]),
      r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"),
      i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [],
      s = {
        type: "table",
        raw: t[0],
        header: [],
        align: [],
        rows: []
      };
    if (n.length === r.length) {
      for (let a of r) this.rules.other.tableAlignRight.test(a) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s.align.push("left") : s.align.push(null);
      for (let a = 0; a < n.length; a++) s.header.push({
        text: n[a],
        tokens: this.lexer.inline(n[a]),
        header: !0,
        align: s.align[a]
      });
      for (let a of i) s.rows.push(J(a, s.header.length).map((o, l) => ({
        text: o,
        tokens: this.lexer.inline(o),
        header: !1,
        align: s.align[l]
      })));
      return s;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) return {
      type: "heading",
      raw: t[0],
      depth: t[2].charAt(0) === "=" ? 1 : 2,
      text: t[1],
      tokens: this.lexer.inline(t[1])
    };
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return {
      type: "text",
      raw: t[0],
      text: t[0],
      tokens: this.lexer.inline(t[0])
    };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return {
      type: "escape",
      raw: t[0],
      text: t[1]
    };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
      type: "html",
      raw: t[0],
      inLink: this.lexer.state.inLink,
      inRawBlock: this.lexer.state.inRawBlock,
      block: !1,
      text: t[0]
    };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n)) return;
        let s = z(n.slice(0, -1), "\\");
        if ((n.length - s.length) % 2 === 0) return;
      } else {
        let s = de(t[2], "()");
        if (s === -2) return;
        if (s > -1) {
          let o = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
          t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, o).trim(), t[3] = "";
        }
      }
      let r = t[2],
        i = "";
      if (this.options.pedantic) {
        let s = this.rules.other.pedanticHrefTitle.exec(r);
        s && (r = s[1], i = s[3]);
      } else i = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), ge(t, {
        href: r && r.replace(this.rules.inline.anyPunctuation, "$1"),
        title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "),
        i = t[r.toLowerCase()];
      if (!i) {
        let s = n[0].charAt(0);
        return {
          type: "text",
          raw: s,
          text: s
        };
      }
      return ge(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let r = this.rules.inline.emStrongLDelim.exec(e);
    if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let s = [...r[0]].length - 1,
        a,
        o,
        l = s,
        p = 0,
        c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = c.exec(t)) != null;) {
        if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
        if (o = [...a].length, r[3] || r[4]) {
          l += o;
          continue;
        } else if ((r[5] || r[6]) && s % 3 && !((s + o) % 3)) {
          p += o;
          continue;
        }
        if (l -= o, l > 0) continue;
        o = Math.min(o, o + l + p);
        let g = [...r[0]][0].length,
          h = e.slice(0, s + r.index + g + o);
        if (Math.min(s, o) % 2) {
          let f = h.slice(1, -1);
          return {
            type: "em",
            raw: h,
            text: f,
            tokens: this.lexer.inlineTokens(f)
          };
        }
        let R = h.slice(2, -2);
        return {
          type: "strong",
          raw: h,
          text: R,
          tokens: this.lexer.inlineTokens(R)
        };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "),
        r = this.rules.other.nonSpaceChar.test(n),
        i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return r && i && (n = n.substring(1, n.length - 1)), {
        type: "codespan",
        raw: t[0],
        text: n
      };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return {
      type: "br",
      raw: t[0]
    };
  }
  del(e) {
    let t = this.rules.inline.del.exec(e);
    if (t) return {
      type: "del",
      raw: t[0],
      text: t[2],
      tokens: this.lexer.inlineTokens(t[2])
    };
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, r;
      return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), {
        type: "link",
        raw: t[0],
        text: n,
        href: r,
        tokens: [{
          type: "text",
          raw: n,
          text: n
        }]
      };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, r;
      if (t[2] === "@") n = t[0], r = "mailto:" + n;else {
        let i;
        do i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? ""; while (i !== t[0]);
        n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: n,
        href: r,
        tokens: [{
          type: "text",
          raw: n,
          text: n
        }]
      };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        escaped: n
      };
    }
  }
};
var x = class u {
  constructor(e) {
    this.tokens = [], this.tokens.links = Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    let t = {
      other: m,
      block: E.normal,
      inline: M.normal
    };
    this.options.pedantic ? (t.block = E.pedantic, t.inline = M.pedantic) : this.options.gfm && (t.block = E.gfm, this.options.breaks ? t.inline = M.breaks : t.inline = M.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return {
      block: E,
      inline: M
    };
  }
  static lex(e, t) {
    return new u(t).lex(e);
  }
  static lexInline(e, t) {
    return new u(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = !1) {
    for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, "")); e;) {
      let r;
      if (this.options.extensions?.block?.some(s => (r = s.call({
        lexer: this
      }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        r.raw.length === 1 && s !== void 0 ? s.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
          href: r.href,
          title: r.title
        }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let s = 1 / 0,
          a = e.slice(1),
          o;
        this.options.extensions.startBlock.forEach(l => {
          o = l.call({
            lexer: this
          }, a), typeof o == "number" && o >= 0 && (s = Math.min(s, o));
        }), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let s = t.at(-1);
        n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (e) {
        let s = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(s);
          break;
        } else throw new Error(s);
      }
    }
    return this.state.top = !0, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({
      src: e,
      tokens: t
    }), t;
  }
  inlineTokens(e, t = []) {
    let n = e,
      r = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null;) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null;) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let i;
    for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null;) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n = this.options.hooks?.emStrongMask?.call({
      lexer: this
    }, n) ?? n;
    let s = !1,
      a = "";
    for (; e;) {
      s || (a = ""), s = !1;
      let o;
      if (this.options.extensions?.inline?.some(p => (o = p.call({
        lexer: this
      }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let p = t.at(-1);
        o.type === "text" && p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, a)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let l = e;
      if (this.options.extensions?.startInline) {
        let p = 1 / 0,
          c = e.slice(1),
          g;
        this.options.extensions.startInline.forEach(h => {
          g = h.call({
            lexer: this
          }, c), typeof g == "number" && g >= 0 && (p = Math.min(p, g));
        }), p < 1 / 0 && p >= 0 && (l = e.substring(0, p + 1));
      }
      if (o = this.tokenizer.inlineText(l)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (a = o.raw.slice(-1)), s = !0;
        let p = t.at(-1);
        p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let p = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(p);
          break;
        } else throw new Error(p);
      }
    }
    return t;
  }
};
var P = class {
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    return "";
  }
  code({
    text: e,
    lang: t,
    escaped: n
  }) {
    let r = (t || "").match(m.notSpaceStart)?.[0],
      i = e.replace(m.endingNewline, "") + `
`;
    return r ? '<pre><code class="language-' + w(r) + '">' + (n ? i : w(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : w(i, !0)) + `</code></pre>
`;
  }
  blockquote({
    tokens: e
  }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({
    text: e
  }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({
    tokens: e,
    depth: t
  }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered,
      n = e.start,
      r = "";
    for (let a = 0; a < e.items.length; a++) {
      let o = e.items[a];
      r += this.listitem(o);
    }
    let i = t ? "ol" : "ul",
      s = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + s + `>
` + r + "</" + i + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({
    checked: e
  }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({
    tokens: e
  }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "",
      n = "";
    for (let i = 0; i < e.header.length; i++) n += this.tablecell(e.header[i]);
    t += this.tablerow({
      text: n
    });
    let r = "";
    for (let i = 0; i < e.rows.length; i++) {
      let s = e.rows[i];
      n = "";
      for (let a = 0; a < s.length; a++) n += this.tablecell(s[a]);
      r += this.tablerow({
        text: n
      });
    }
    return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
  }
  tablerow({
    text: e
  }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens),
      n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({
    tokens: e
  }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({
    tokens: e
  }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({
    text: e
  }) {
    return `<code>${w(e, !0)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({
    tokens: e
  }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({
    href: e,
    title: t,
    tokens: n
  }) {
    let r = this.parser.parseInline(n),
      i = X(e);
    if (i === null) return r;
    e = i;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + w(t) + '"'), s += ">" + r + "</a>", s;
  }
  image({
    href: e,
    title: t,
    text: n,
    tokens: r
  }) {
    r && (n = this.parser.parseInline(r, this.parser.textRenderer));
    let i = X(e);
    if (i === null) return w(n);
    e = i;
    let s = `<img src="${e}" alt="${n}"`;
    return t && (s += ` title="${w(t)}"`), s += ">", s;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : w(e.text);
  }
};
var $ = class {
  strong({
    text: e
  }) {
    return e;
  }
  em({
    text: e
  }) {
    return e;
  }
  codespan({
    text: e
  }) {
    return e;
  }
  del({
    text: e
  }) {
    return e;
  }
  html({
    text: e
  }) {
    return e;
  }
  text({
    text: e
  }) {
    return e;
  }
  link({
    text: e
  }) {
    return "" + e;
  }
  image({
    text: e
  }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({
    raw: e
  }) {
    return e;
  }
};
var b = class u {
  constructor(e) {
    this.options = e || T, this.options.renderer = this.options.renderer || new P(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $();
  }
  static parse(e, t) {
    return new u(t).parse(e);
  }
  static parseInline(e, t) {
    return new u(t).parseInline(e);
  }
  parse(e) {
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let r = e[n];
      if (this.options.extensions?.renderers?.[r.type]) {
        let s = r,
          a = this.options.extensions.renderers[s.type].call({
            parser: this
          }, s);
        if (a !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(s.type)) {
          t += a || "";
          continue;
        }
      }
      let i = r;
      switch (i.type) {
        case "space":
          {
            t += this.renderer.space(i);
            break;
          }
        case "hr":
          {
            t += this.renderer.hr(i);
            break;
          }
        case "heading":
          {
            t += this.renderer.heading(i);
            break;
          }
        case "code":
          {
            t += this.renderer.code(i);
            break;
          }
        case "table":
          {
            t += this.renderer.table(i);
            break;
          }
        case "blockquote":
          {
            t += this.renderer.blockquote(i);
            break;
          }
        case "list":
          {
            t += this.renderer.list(i);
            break;
          }
        case "checkbox":
          {
            t += this.renderer.checkbox(i);
            break;
          }
        case "html":
          {
            t += this.renderer.html(i);
            break;
          }
        case "def":
          {
            t += this.renderer.def(i);
            break;
          }
        case "paragraph":
          {
            t += this.renderer.paragraph(i);
            break;
          }
        case "text":
          {
            t += this.renderer.text(i);
            break;
          }
        default:
          {
            let s = 'Token with "' + i.type + '" type was not found.';
            if (this.options.silent) return console.error(s), "";
            throw new Error(s);
          }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    let n = "";
    for (let r = 0; r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let a = this.options.extensions.renderers[i.type].call({
          parser: this
        }, i);
        if (a !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += a || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "escape":
          {
            n += t.text(s);
            break;
          }
        case "html":
          {
            n += t.html(s);
            break;
          }
        case "link":
          {
            n += t.link(s);
            break;
          }
        case "image":
          {
            n += t.image(s);
            break;
          }
        case "checkbox":
          {
            n += t.checkbox(s);
            break;
          }
        case "strong":
          {
            n += t.strong(s);
            break;
          }
        case "em":
          {
            n += t.em(s);
            break;
          }
        case "codespan":
          {
            n += t.codespan(s);
            break;
          }
        case "br":
          {
            n += t.br(s);
            break;
          }
        case "del":
          {
            n += t.del(s);
            break;
          }
        case "text":
          {
            n += t.text(s);
            break;
          }
        default:
          {
            let a = 'Token with "' + s.type + '" type was not found.';
            if (this.options.silent) return console.error(a), "";
            throw new Error(a);
          }
      }
    }
    return n;
  }
};
var S = class {
  constructor(e) {
    this.options = e || T;
  }
  static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer() {
    return this.block ? x.lex : x.lexInline;
  }
  provideParser() {
    return this.block ? b.parse : b.parseInline;
  }
};
var B = class {
  defaults = L();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = b;
  Renderer = P;
  TextRenderer = $;
  Lexer = x;
  Tokenizer = y;
  Hooks = S;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
      case "table":
        {
          let i = r;
          for (let s of i.header) n = n.concat(this.walkTokens(s.tokens, t));
          for (let s of i.rows) for (let a of s) n = n.concat(this.walkTokens(a.tokens, t));
          break;
        }
      case "list":
        {
          let i = r;
          n = n.concat(this.walkTokens(i.items, t));
          break;
        }
      default:
        {
          let i = r;
          this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach(s => {
            let a = i[s].flat(1 / 0);
            n = n.concat(this.walkTokens(a, t));
          }) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
        }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || {
      renderers: {},
      childTokens: {}
    };
    return e.forEach(n => {
      let r = {
        ...n
      };
      if (r.async = this.defaults.async || r.async || !1, n.extensions && (n.extensions.forEach(i => {
        if (!i.name) throw new Error("extension name required");
        if ("renderer" in i) {
          let s = t.renderers[i.name];
          s ? t.renderers[i.name] = function (...a) {
            let o = i.renderer.apply(this, a);
            return o === !1 && (o = s.apply(this, a)), o;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let s = t[i.level];
          s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), r.extensions = t), n.renderer) {
        let i = this.defaults.renderer || new P(this.defaults);
        for (let s in n.renderer) {
          if (!(s in i)) throw new Error(`renderer '${s}' does not exist`);
          if (["options", "parser"].includes(s)) continue;
          let a = s,
            o = n.renderer[a],
            l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === !1 && (c = l.apply(i, p)), c || "";
          };
        }
        r.renderer = i;
      }
      if (n.tokenizer) {
        let i = this.defaults.tokenizer || new y(this.defaults);
        for (let s in n.tokenizer) {
          if (!(s in i)) throw new Error(`tokenizer '${s}' does not exist`);
          if (["options", "rules", "lexer"].includes(s)) continue;
          let a = s,
            o = n.tokenizer[a],
            l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === !1 && (c = l.apply(i, p)), c;
          };
        }
        r.tokenizer = i;
      }
      if (n.hooks) {
        let i = this.defaults.hooks || new S();
        for (let s in n.hooks) {
          if (!(s in i)) throw new Error(`hook '${s}' does not exist`);
          if (["options", "block"].includes(s)) continue;
          let a = s,
            o = n.hooks[a],
            l = i[a];
          S.passThroughHooks.has(s) ? i[a] = p => {
            if (this.defaults.async && S.passThroughHooksRespectAsync.has(s)) return (async () => {
              let g = await o.call(i, p);
              return l.call(i, g);
            })();
            let c = o.call(i, p);
            return l.call(i, c);
          } : i[a] = (...p) => {
            if (this.defaults.async) return (async () => {
              let g = await o.apply(i, p);
              return g === !1 && (g = await l.apply(i, p)), g;
            })();
            let c = o.apply(i, p);
            return c === !1 && (c = l.apply(i, p)), c;
          };
        }
        r.hooks = i;
      }
      if (n.walkTokens) {
        let i = this.defaults.walkTokens,
          s = n.walkTokens;
        r.walkTokens = function (a) {
          let o = [];
          return o.push(s.call(this, a)), i && (o = o.concat(i.call(this, a))), o;
        };
      }
      this.defaults = {
        ...this.defaults,
        ...r
      };
    }), this;
  }
  setOptions(e) {
    return this.defaults = {
      ...this.defaults,
      ...e
    }, this;
  }
  lexer(e, t) {
    return x.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return b.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, r) => {
      let i = {
          ...r
        },
        s = {
          ...this.defaults,
          ...i
        },
        a = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === !0 && i.async === !1) return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return a(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (s.hooks && (s.hooks.options = s, s.hooks.block = e), s.async) return (async () => {
        let o = s.hooks ? await s.hooks.preprocess(n) : n,
          p = await (s.hooks ? await s.hooks.provideLexer() : e ? x.lex : x.lexInline)(o, s),
          c = s.hooks ? await s.hooks.processAllTokens(p) : p;
        s.walkTokens && (await Promise.all(this.walkTokens(c, s.walkTokens)));
        let h = await (s.hooks ? await s.hooks.provideParser() : e ? b.parse : b.parseInline)(c, s);
        return s.hooks ? await s.hooks.postprocess(h) : h;
      })().catch(a);
      try {
        s.hooks && (n = s.hooks.preprocess(n));
        let l = (s.hooks ? s.hooks.provideLexer() : e ? x.lex : x.lexInline)(n, s);
        s.hooks && (l = s.hooks.processAllTokens(l)), s.walkTokens && this.walkTokens(l, s.walkTokens);
        let c = (s.hooks ? s.hooks.provideParser() : e ? b.parse : b.parseInline)(l, s);
        return s.hooks && (c = s.hooks.postprocess(c)), c;
      } catch (o) {
        return a(o);
      }
    };
  }
  onError(e, t) {
    return n => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let r = "<p>An error occurred:</p><pre>" + w(n.message + "", !0) + "</pre>";
        return t ? Promise.resolve(r) : r;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var _ = new B();
function d(u, e) {
  return _.parse(u, e);
}
d.options = d.setOptions = function (u) {
  return _.setOptions(u), d.defaults = _.defaults, Z(d.defaults), d;
};
d.getDefaults = L;
d.defaults = T;
d.use = function (...u) {
  return _.use(...u), d.defaults = _.defaults, Z(d.defaults), d;
};
d.walkTokens = function (u, e) {
  return _.walkTokens(u, e);
};
d.parseInline = _.parseInline;
d.Parser = b;
d.parser = b.parse;
d.Renderer = P;
d.TextRenderer = $;
d.Lexer = x;
d.lexer = x.lex;
d.Tokenizer = y;
d.Hooks = S;
d.parse = d;
d.options;
  d.setOptions;
  d.use;
  d.walkTokens;
  d.parseInline;
  b.parse;
  x.lex;

/**
 * Configuration for HTML sanitization
 * Updated for FAQ content: Prioritizes safe, readable rich text with full link support.
 * Enhances table support (including captions and structural attributes for better accessibility/complexity).
 * Adds optional video support (commented out by default—uncomment if embedding videos is desired for FAQs;
 * note: this increases security review needs due to potential executable content).
 * Removes headings (h1-h6) as they're likely unnecessary for FAQ responses.
 * Retains core formatting, lists, images, and tables for structured answers.
 */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "b",
        "i",
        "a",
        "ul",
        "ol",
        "li",
        "code",
        "pre",
        "hr",
        "table",
        "caption", // Added for table titles/descriptions
        "thead",
        "tbody",
        "tfoot", // Added for table footers (e.g., summaries/totals)
        "tr",
        "th",
        "td",
        "col", // Added for column properties
        "colgroup", // Added for grouping columns
        "img",
        "div",
        "span",
        "video", // Uncomment to enable <video> for embedded videos
        "source", // Uncomment if enabling video (for <video> sources)
        "figure", // Optional: For wrapping images/tables with captions
        "figcaption" // Optional: For figure descriptions
    ],
    ALLOWED_ATTR: [
        "href",
        "title",
        "target",
        "rel",
        "src",
        "alt",
        "width",
        "height",
        "class",
        "id",
        "style",
        // Table-specific attributes for structure and accessibility
        "rowspan",
        "colspan",
        "scope", // For <th> (e.g., row, col, rowgroup)
        "headers", // For associating <td> with <th>
        // Video-specific (uncomment if enabling video)
        "controls",
        "autoplay",
        "loop",
        "muted",
        "poster"
    ],
    ALLOW_DATA_ATTR: false, // Keep false for security; enable only if custom data attrs are vetted
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};
/**
 * Validates and sanitizes HTML content
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
function sanitizeHTML(html) {
    if (!html) {
        return "";
    }
    try {
        // Configure DOMPurify
        const cleanHTML = purify.sanitize(html, SANITIZE_CONFIG);
        return cleanHTML;
    }
    catch (error) {
        console.error("Error sanitizing HTML:", error);
        // Return escaped text as fallback
        return escapeHTML(html);
    }
}
/**
 * Validates HTML content and returns validation errors
 * @param html - The HTML string to validate
 * @returns Array of validation error messages
 */
function validateHTML(html) {
    const errors = [];
    if (!html) {
        return errors;
    }
    // Check for script tags (should be blocked)
    if (/<script[^>]*>[\s\S]*?<\/script>/gi.test(html)) {
        errors.push("Script tags are not allowed for security reasons");
    }
    // Check for event handlers (should be blocked)
    if (/on\w+\s*=/gi.test(html)) {
        errors.push("Event handlers (onclick, onload, etc.) are not allowed for security reasons");
    }
    // Check for javascript: protocol
    if (/javascript:/gi.test(html)) {
        errors.push("JavaScript protocol in URLs is not allowed for security reasons");
    }
    // Check for data: protocol (except for images)
    if (/data:(?!image)/gi.test(html)) {
        errors.push("Data URLs are only allowed for images");
    }
    // Check for iframe (not in allowed tags)
    if (/<iframe[^>]*>/gi.test(html)) {
        errors.push("Iframe tags are not allowed");
    }
    // Check for object and embed tags
    if (/<(object|embed)[^>]*>/gi.test(html)) {
        errors.push("Object and embed tags are not allowed");
    }
    return errors;
}
/**
 * Validates HTML syntax for malformed markup
 * @param html - The HTML string to validate
 * @returns Array of syntax error messages
 */
function validateHTMLSyntax(html) {
    const errors = [];
    if (!html) {
        return errors;
    }
    const allTags = html.match(/<[^>]+>/g) || [];
    allTags.forEach(tag => {
        // Check for attributes with unclosed quotes
        // Look for attr=" or attr=' that doesn't have a matching closing quote
        const singleQuoteMatches = tag.match(/\w+\s*=\s*'[^']*$/);
        const doubleQuoteMatches = tag.match(/\w+\s*=\s*"[^"]*$/);
        if (singleQuoteMatches || doubleQuoteMatches) {
            errors.push(`Unclosed attribute quote in tag: ${tag.substring(0, 50)}${tag.length > 50 ? '...' : ''}`);
        }
        // Check for unclosed opening tag (missing >)
        if (tag.startsWith('<') && !tag.endsWith('>')) {
            errors.push(`Unclosed tag bracket: ${tag.substring(0, 50)}${tag.length > 50 ? '...' : ''}`);
        }
    });
    // Check for balanced tags (opening and closing)
    // Self-closing tags that don't need closing tags
    const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    // Extract all tags (opening and closing)
    const tagStack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        const isClosing = fullTag.startsWith('</');
        const isSelfClosing = fullTag.endsWith('/>') || selfClosingTags.includes(tagName);
        if (isClosing) {
            // Closing tag - pop from stack
            if (tagStack.length === 0) {
                errors.push(`Orphaned closing tag: </${tagName}>`);
            }
            else {
                const lastOpened = tagStack[tagStack.length - 1];
                if (lastOpened.tag === tagName) {
                    tagStack.pop();
                }
                else {
                    // Mismatched tag
                    errors.push(`Mismatched tags: Expected closing tag for <${lastOpened.tag}>, found </${tagName}>`);
                    // Try to find matching opening tag in stack
                    const matchIndex = tagStack.findIndex(t => t.tag === tagName);
                    if (matchIndex >= 0) {
                        tagStack.splice(matchIndex, 1);
                    }
                }
            }
        }
        else if (!isSelfClosing) {
            // Opening tag - push to stack
            tagStack.push({ tag: tagName, position: match.index });
        }
    }
    // Check for unclosed tags remaining in stack
    if (tagStack.length > 0) {
        tagStack.forEach(({ tag }) => {
            errors.push(`Unclosed tag: <${tag}> is missing closing tag </${tag}>`);
        });
    }
    // Check for malformed attributes (no value, malformed syntax)
    const malformedAttrPattern = /<[^>]+\s+(\w+)\s*=\s*(?!["\w])[^>]*>/g;
    let attrMatch;
    while ((attrMatch = malformedAttrPattern.exec(html)) !== null) {
        errors.push(`Malformed attribute syntax: ${attrMatch[0].substring(0, 50)}${attrMatch[0].length > 50 ? '...' : ''}`);
    }
    return errors;
}
/**
 * Converts markdown to HTML
 * @param markdown - The markdown string to convert
 * @returns HTML string
 */
function markdownToHTML(markdown) {
    if (!markdown) {
        return "";
    }
    try {
        // Configure marked for security
        d.setOptions({
            breaks: true,
            gfm: true
        });
        const html = d.parse(markdown);
        // Sanitize the generated HTML
        return sanitizeHTML(html);
    }
    catch (error) {
        console.error("Error parsing markdown:", error);
        return escapeHTML(markdown);
    }
}
/**
 * Escapes HTML special characters
 * @param text - The text to escape
 * @returns Escaped text
 */
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Converts plain text to HTML with line breaks
 * @param text - The plain text to convert
 * @returns HTML string with line breaks
 */
function textToHTML(text) {
    if (!text) {
        return "";
    }
    // Escape HTML characters and convert line breaks to <br>
    const escaped = escapeHTML(text);
    return escaped.replace(/\n/g, "<br>");
}
/**
 * Processes content based on format and returns sanitized HTML
 * @param content - The content string
 * @param format - The content format (html, markdown, or text)
 * @returns Sanitized HTML string or escaped markdown
 */
function processContent(content, format) {
    if (!content) {
        return "";
    }
    switch (format) {
        case "html":
            return sanitizeHTML(content);
        case "markdown":
            // Convert markdown to HTML and sanitize it
            return markdownToHTML(content);
        case "text":
            return textToHTML(content);
        default:
            // Unrecognized format - treat as HTML and sanitize for safety
            console.warn(`Unrecognized content format "${format}", treating as HTML`);
            return sanitizeHTML(content);
    }
}
/**
 * Gets validation warnings for content based on format
 * @param content - The content string
 * @param format - The content format
 * @returns Array of warning messages
 */
function getContentWarnings(content, format) {
    if (!content) {
        return [];
    }
    switch (format) {
        case "html":
            // Validate both security issues and syntax
            const securityWarnings = validateHTML(content);
            const syntaxWarnings = validateHTMLSyntax(content);
            return [...securityWarnings, ...syntaxWarnings];
        case "markdown":
            // Check for dangerous HTML embedded in markdown
            // Users might try to include <script> tags in their markdown
            const htmlPattern = /<[^>]+>/g;
            const htmlMatches = content.match(htmlPattern);
            if (htmlMatches) {
                // Extract just the HTML parts and validate them
                const htmlContent = htmlMatches.join("");
                const htmlSecurityWarnings = validateHTML(htmlContent);
                const htmlSyntaxWarnings = validateHTMLSyntax(htmlContent);
                const allWarnings = [...htmlSecurityWarnings, ...htmlSyntaxWarnings];
                if (allWarnings.length > 0) {
                    return allWarnings.map(warning => `Embedded HTML in markdown: ${warning}`);
                }
            }
            return [];
        case "text":
            // Text format doesn't need validation (everything is escaped)
            return [];
        default:
            return [];
    }
}

// Helper to get format label
function getFormatLabel(format) {
    switch (format) {
        case "markdown":
            return "MD";
        case "text":
            return "TXT";
        case "html":
        default:
            return "HTML";
    }
}
// Check if sanitization modified the content
function checkSanitization(content, format) {
    if (!content || format === "text") {
        return { modified: false, originalHtml: "", sanitizedHtml: "" };
    }
    let originalHtml = content;
    // For markdown, convert to HTML first
    if (format === "markdown") {
        try {
            // Simple markdown to HTML conversion for comparison
            // In production, this uses marked.js, but for preview we'll do basic detection
            const hasMarkdownSyntax = /[*_#\[\]`]/.test(content);
            if (hasMarkdownSyntax) {
                // If it has markdown syntax, we know it will be converted
                originalHtml = content; // Keep as is for now
            }
        }
        catch (e) {
            // Ignore errors
        }
    }
    // Sanitize the HTML
    const sanitizedHtml = sanitizeHTML(originalHtml);
    // Check if sanitization changed the content
    // Normalize whitespace for comparison
    const normalizedOriginal = originalHtml.replace(/\s+/g, " ").trim();
    const normalizedSanitized = sanitizedHtml.replace(/\s+/g, " ").trim();
    return {
        modified: normalizedOriginal !== normalizedSanitized,
        originalHtml,
        sanitizedHtml
    };
}
// Preview content based on format - returns JSX for rendering with SANITIZED content
function previewContent(content, format) {
    if (!content) {
        return jsxRuntime.jsx("span", { style: { fontStyle: "italic", color: "#999" }, children: "[No content]" });
    }
    const maxLength = 300;
    // Process content through the same pipeline as runtime
    const processedHtml = processContent(content, format);
    const truncated = processedHtml.length > maxLength ? processedHtml.substring(0, maxLength) + "..." : processedHtml;
    switch (format) {
        case "markdown":
            // Show rendered HTML from markdown (same as runtime)
            return (jsxRuntime.jsx("div", { dangerouslySetInnerHTML: { __html: truncated }, style: {
                    wordWrap: "break-word",
                    overflowWrap: "break-word"
                } }));
        case "text":
            // Show processed text (with <br> tags, same as runtime)
            return (jsxRuntime.jsx("div", { dangerouslySetInnerHTML: { __html: truncated }, style: {
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap"
                } }));
        case "html":
        default:
            // Show SANITIZED HTML (same as runtime)
            return (jsxRuntime.jsx("div", { dangerouslySetInnerHTML: { __html: truncated }, style: {
                    wordWrap: "break-word",
                    overflowWrap: "break-word"
                } }));
    }
}
function preview(props) {
    const { dataSourceType, faqItems, dataSource, showToggleButton } = props;
    // Determine item count and source
    let itemCount = 0;
    let sourceLabel = "";
    if (dataSourceType === "database") {
        // Database mode
        sourceLabel = "Database Entity";
        if (dataSource && typeof dataSource === "object" && "caption" in dataSource) {
            sourceLabel = `Database: ${dataSource.caption}`;
        }
        // In preview mode, we can't get actual count, show placeholder
        itemCount = 0;
    }
    else {
        // Static mode
        sourceLabel = "Static Items";
        itemCount = faqItems ? faqItems.length : 0;
    }
    return (jsxRuntime.jsxs("div", { className: "faq-accordion-preview", style: {
            border: "1px solid #e5e5e5",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#fafafa"
        }, children: [showToggleButton && (jsxRuntime.jsx("div", { style: { marginBottom: "12px", textAlign: "right" }, children: jsxRuntime.jsx("button", { style: {
                        padding: "8px 24px",
                        backgroundColor: "#f5f5f5",
                        color: "#333333",
                        border: "2px solid #d1d1d1",
                        borderRadius: "6px",
                        cursor: "default",
                        fontWeight: 500
                    }, children: "Hide All" }) })), jsxRuntime.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: dataSourceType === "database" ? (
                // Database mode preview
                jsxRuntime.jsxs("div", { style: {
                        padding: "32px",
                        textAlign: "center",
                        color: "#0070f3",
                        border: "2px dashed #0070f3",
                        borderRadius: "8px",
                        backgroundColor: "#f0f7ff"
                    }, children: [jsxRuntime.jsxs("p", { style: { margin: "0 0 8px 0", fontWeight: "bold", fontSize: "16px" }, children: ["\uD83D\uDCCA ", sourceLabel] }), jsxRuntime.jsxs("p", { style: { margin: 0, fontSize: "12px", color: "#666" }, children: ["FAQ items will be loaded from the configured data source at runtime.", jsxRuntime.jsx("br", {}), jsxRuntime.jsx("br", {}), jsxRuntime.jsx("strong", { children: "Configuration:" }), jsxRuntime.jsx("br", {}), "Summary: ", props.summaryAttribute || "[Not configured]", jsxRuntime.jsx("br", {}), "Content: ", props.contentAttribute || "[Not configured]", jsxRuntime.jsx("br", {}), "Format: ", props.formatAttribute || "[Optional - defaults to HTML]"] })] })) : itemCount > 0 ? (
                // Static mode preview
                faqItems?.map((item, index) => {
                    const contentValue = item.content || "";
                    const format = item.contentFormat || "html";
                    // Get validation warnings
                    const warnings = getContentWarnings(contentValue, format);
                    // Check if sanitization will modify the content
                    const sanitizationCheck = checkSanitization(contentValue, format);
                    // Combine all issues
                    const allWarnings = [...warnings];
                    if (sanitizationCheck.modified) {
                        allWarnings.push("Content will be sanitized at runtime (dangerous elements removed)");
                    }
                    const hasIssues = allWarnings.length > 0;
                    return (jsxRuntime.jsxs("div", { style: {
                            border: hasIssues ? "2px solid #ff8c00" : "1px solid #0070f3",
                            borderRadius: "8px",
                            backgroundColor: "#ffffff",
                            overflow: "hidden"
                        }, children: [jsxRuntime.jsxs("div", { style: {
                                    padding: "12px 16px",
                                    backgroundColor: "#f0f7ff",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontWeight: 500,
                                    color: "#0070f3"
                                }, children: [jsxRuntime.jsx("span", { style: { flex: 1 }, children: item.summary || "[Question/Summary]" }), jsxRuntime.jsx("span", { style: {
                                            fontSize: "10px",
                                            padding: "2px 6px",
                                            backgroundColor: hasIssues ? "#fff3e0" : "#e8f4ff",
                                            borderRadius: "3px",
                                            marginRight: "8px",
                                            color: hasIssues ? "#ff8c00" : "#0070f3",
                                            fontWeight: "bold",
                                            border: `1px solid ${hasIssues ? "#ffd699" : "#c3e0ff"}`
                                        }, children: getFormatLabel(format) }), jsxRuntime.jsx("span", { style: { color: "#0070f3", transform: "rotate(180deg)", display: "inline-block" }, children: "\u25BC" })] }), jsxRuntime.jsxs("div", { style: {
                                    padding: "12px 16px",
                                    backgroundColor: "#ffffff",
                                    borderTop: "1px solid #e5e5e5"
                                }, children: [hasIssues && (jsxRuntime.jsxs("div", { style: {
                                            backgroundColor: "#fff8f0",
                                            border: "1px solid #ffd699",
                                            borderRadius: "4px",
                                            padding: "8px 12px",
                                            marginBottom: "8px"
                                        }, children: [jsxRuntime.jsx("div", { style: { fontWeight: "bold", color: "#ff8c00", fontSize: "12px", marginBottom: "4px" }, children: "\u26A0\uFE0F Content Warnings:" }), jsxRuntime.jsx("ul", { style: { margin: "0", paddingLeft: "20px", color: "#d97700", fontSize: "11px" }, children: allWarnings.map((warning, i) => (jsxRuntime.jsx("li", { children: warning }, i))) }), sanitizationCheck.modified && (jsxRuntime.jsx("div", { style: {
                                                    marginTop: "8px",
                                                    fontSize: "11px",
                                                    color: "#666",
                                                    fontStyle: "italic"
                                                }, children: "\uD83D\uDCA1 Preview shows sanitized output (matching runtime behavior)" }))] })), jsxRuntime.jsx("div", { style: {
                                            color: "#555555",
                                            fontSize: "14px",
                                            lineHeight: "1.6"
                                        }, children: previewContent(contentValue, format) })] })] }, index));
                })) : (
                // Empty state
                jsxRuntime.jsx("div", { style: {
                        padding: "32px",
                        textAlign: "center",
                        color: "#999999",
                        border: "1px dashed #d1d1d1",
                        borderRadius: "8px"
                    }, children: jsxRuntime.jsxs("p", { style: { margin: 0 }, children: ["No FAQ items configured", jsxRuntime.jsx("br", {}), jsxRuntime.jsx("small", { children: dataSourceType === "database"
                                    ? "Configure the data source in the properties panel"
                                    : "Add FAQ items in the properties panel" })] }) })) }), jsxRuntime.jsxs("div", { style: {
                    marginTop: "12px",
                    padding: "8px",
                    backgroundColor: "#f0f7ff",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#0070f3",
                    textAlign: "center"
                }, children: ["FAQ Accordion Widget - ", sourceLabel, dataSourceType === "static" && ` (${itemCount} item${itemCount !== 1 ? "s" : ""})`, dataSourceType === "static" && itemCount > 0 && " - Preview shows expanded state"] })] }));
}
function getPreviewCss() {
    return `
.faq-accordion-preview {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.faq-accordion-preview a {
    color: #0070f3;
    text-decoration: underline;
}

.faq-accordion-preview strong,
.faq-accordion-preview b {
    font-weight: 600;
    color: #333;
}

.faq-accordion-preview em,
.faq-accordion-preview i {
    font-style: italic;
}

.faq-accordion-preview code {
    padding: 2px 4px;
    background-color: #f5f5f5;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    font-family: "Courier New", Courier, monospace;
    font-size: 0.9em;
}

.faq-accordion-preview ul,
.faq-accordion-preview ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.faq-accordion-preview li {
    margin: 0.25rem 0;
}

.faq-accordion-preview p {
    margin: 0.5rem 0;
}

.faq-accordion-preview h1,
.faq-accordion-preview h2,
.faq-accordion-preview h3,
.faq-accordion-preview h4,
.faq-accordion-preview h5,
.faq-accordion-preview h6 {
    margin: 0.5rem 0;
    font-weight: 600;
    color: #333;
}

.faq-accordion-preview blockquote {
    margin: 0.5rem 0;
    padding-left: 1rem;
    border-left: 4px solid #0070f3;
    color: #666;
    font-style: italic;
}
`;
}

exports.getPreviewCss = getPreviewCss;
exports.preview = preview;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRkFRQWNjb3JkaW9uLmVkaXRvclByZXZpZXcuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kb21wdXJpZnkvZGlzdC9wdXJpZnkuZXMubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL21hcmtlZC9saWIvbWFya2VkLmVzbS5qcyIsIi4uLy4uLy4uL3NyYy91dGlscy9jb250ZW50UHJvY2Vzc29yLnRzIiwiLi4vLi4vLi4vc3JjL0ZBUUFjY29yZGlvbi5lZGl0b3JQcmV2aWV3LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgQGxpY2Vuc2UgRE9NUHVyaWZ5IDMuMy4xIHwgKGMpIEN1cmU1MyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIHwgUmVsZWFzZWQgdW5kZXIgdGhlIEFwYWNoZSBsaWNlbnNlIDIuMCBhbmQgTW96aWxsYSBQdWJsaWMgTGljZW5zZSAyLjAgfCBnaXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvYmxvYi8zLjMuMS9MSUNFTlNFICovXG5cbmNvbnN0IHtcbiAgZW50cmllcyxcbiAgc2V0UHJvdG90eXBlT2YsXG4gIGlzRnJvemVuLFxuICBnZXRQcm90b3R5cGVPZixcbiAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yXG59ID0gT2JqZWN0O1xubGV0IHtcbiAgZnJlZXplLFxuICBzZWFsLFxuICBjcmVhdGVcbn0gPSBPYmplY3Q7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaW1wb3J0L25vLW11dGFibGUtZXhwb3J0c1xubGV0IHtcbiAgYXBwbHksXG4gIGNvbnN0cnVjdFxufSA9IHR5cGVvZiBSZWZsZWN0ICE9PSAndW5kZWZpbmVkJyAmJiBSZWZsZWN0O1xuaWYgKCFmcmVlemUpIHtcbiAgZnJlZXplID0gZnVuY3Rpb24gZnJlZXplKHgpIHtcbiAgICByZXR1cm4geDtcbiAgfTtcbn1cbmlmICghc2VhbCkge1xuICBzZWFsID0gZnVuY3Rpb24gc2VhbCh4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG59XG5pZiAoIWFwcGx5KSB7XG4gIGFwcGx5ID0gZnVuY3Rpb24gYXBwbHkoZnVuYywgdGhpc0FyZykge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAyID8gX2xlbiAtIDIgOiAwKSwgX2tleSA9IDI7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDJdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgfTtcbn1cbmlmICghY29uc3RydWN0KSB7XG4gIGNvbnN0cnVjdCA9IGZ1bmN0aW9uIGNvbnN0cnVjdChGdW5jKSB7XG4gICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yID4gMSA/IF9sZW4yIC0gMSA6IDApLCBfa2V5MiA9IDE7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgIGFyZ3NbX2tleTIgLSAxXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgfVxuICAgIHJldHVybiBuZXcgRnVuYyguLi5hcmdzKTtcbiAgfTtcbn1cbmNvbnN0IGFycmF5Rm9yRWFjaCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLmZvckVhY2gpO1xuY29uc3QgYXJyYXlMYXN0SW5kZXhPZiA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mKTtcbmNvbnN0IGFycmF5UG9wID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUucG9wKTtcbmNvbnN0IGFycmF5UHVzaCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuY29uc3QgYXJyYXlTcGxpY2UgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5zcGxpY2UpO1xuY29uc3Qgc3RyaW5nVG9Mb3dlckNhc2UgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudG9Mb3dlckNhc2UpO1xuY29uc3Qgc3RyaW5nVG9TdHJpbmcgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcpO1xuY29uc3Qgc3RyaW5nTWF0Y2ggPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUubWF0Y2gpO1xuY29uc3Qgc3RyaW5nUmVwbGFjZSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlKTtcbmNvbnN0IHN0cmluZ0luZGV4T2YgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZik7XG5jb25zdCBzdHJpbmdUcmltID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRyaW0pO1xuY29uc3Qgb2JqZWN0SGFzT3duUHJvcGVydHkgPSB1bmFwcGx5KE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuY29uc3QgcmVnRXhwVGVzdCA9IHVuYXBwbHkoUmVnRXhwLnByb3RvdHlwZS50ZXN0KTtcbmNvbnN0IHR5cGVFcnJvckNyZWF0ZSA9IHVuY29uc3RydWN0KFR5cGVFcnJvcik7XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb24gd2l0aCBhIHNwZWNpZmllZCB0aGlzQXJnIGFuZCBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIGZ1bmMgLSBUaGUgZnVuY3Rpb24gdG8gYmUgd3JhcHBlZCBhbmQgY2FsbGVkLlxuICogQHJldHVybnMgQSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb24gd2l0aCBhIHNwZWNpZmllZCB0aGlzQXJnIGFuZCBhcmd1bWVudHMuXG4gKi9cbmZ1bmN0aW9uIHVuYXBwbHkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24gKHRoaXNBcmcpIHtcbiAgICBpZiAodGhpc0FyZyBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgdGhpc0FyZy5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjMgPiAxID8gX2xlbjMgLSAxIDogMCksIF9rZXkzID0gMTsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgYXJnc1tfa2V5MyAtIDFdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICB9XG4gICAgcmV0dXJuIGFwcGx5KGZ1bmMsIHRoaXNBcmcsIGFyZ3MpO1xuICB9O1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY29uc3RydWN0cyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IgZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSBmdW5jIC0gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGJlIHdyYXBwZWQgYW5kIGNhbGxlZC5cbiAqIEByZXR1cm5zIEEgbmV3IGZ1bmN0aW9uIHRoYXQgY29uc3RydWN0cyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IgZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzLlxuICovXG5mdW5jdGlvbiB1bmNvbnN0cnVjdChGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW40KSwgX2tleTQgPSAwOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICBhcmdzW19rZXk0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgfVxuICAgIHJldHVybiBjb25zdHJ1Y3QoRnVuYywgYXJncyk7XG4gIH07XG59XG4vKipcbiAqIEFkZCBwcm9wZXJ0aWVzIHRvIGEgbG9va3VwIHRhYmxlXG4gKlxuICogQHBhcmFtIHNldCAtIFRoZSBzZXQgdG8gd2hpY2ggZWxlbWVudHMgd2lsbCBiZSBhZGRlZC5cbiAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIGVsZW1lbnRzIHRvIGJlIGFkZGVkIHRvIHRoZSBzZXQuXG4gKiBAcGFyYW0gdHJhbnNmb3JtQ2FzZUZ1bmMgLSBBbiBvcHRpb25hbCBmdW5jdGlvbiB0byB0cmFuc2Zvcm0gdGhlIGNhc2Ugb2YgZWFjaCBlbGVtZW50IGJlZm9yZSBhZGRpbmcgdG8gdGhlIHNldC5cbiAqIEByZXR1cm5zIFRoZSBtb2RpZmllZCBzZXQgd2l0aCBhZGRlZCBlbGVtZW50cy5cbiAqL1xuZnVuY3Rpb24gYWRkVG9TZXQoc2V0LCBhcnJheSkge1xuICBsZXQgdHJhbnNmb3JtQ2FzZUZ1bmMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHN0cmluZ1RvTG93ZXJDYXNlO1xuICBpZiAoc2V0UHJvdG90eXBlT2YpIHtcbiAgICAvLyBNYWtlICdpbicgYW5kIHRydXRoeSBjaGVja3MgbGlrZSBCb29sZWFuKHNldC5jb25zdHJ1Y3RvcilcbiAgICAvLyBpbmRlcGVuZGVudCBvZiBhbnkgcHJvcGVydGllcyBkZWZpbmVkIG9uIE9iamVjdC5wcm90b3R5cGUuXG4gICAgLy8gUHJldmVudCBwcm90b3R5cGUgc2V0dGVycyBmcm9tIGludGVyY2VwdGluZyBzZXQgYXMgYSB0aGlzIHZhbHVlLlxuICAgIHNldFByb3RvdHlwZU9mKHNldCwgbnVsbCk7XG4gIH1cbiAgbGV0IGwgPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChsLS0pIHtcbiAgICBsZXQgZWxlbWVudCA9IGFycmF5W2xdO1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGxjRWxlbWVudCA9IHRyYW5zZm9ybUNhc2VGdW5jKGVsZW1lbnQpO1xuICAgICAgaWYgKGxjRWxlbWVudCAhPT0gZWxlbWVudCkge1xuICAgICAgICAvLyBDb25maWcgcHJlc2V0cyAoZS5nLiB0YWdzLmpzLCBhdHRycy5qcykgYXJlIGltbXV0YWJsZS5cbiAgICAgICAgaWYgKCFpc0Zyb3plbihhcnJheSkpIHtcbiAgICAgICAgICBhcnJheVtsXSA9IGxjRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50ID0gbGNFbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBzZXRbZWxlbWVudF0gPSB0cnVlO1xuICB9XG4gIHJldHVybiBzZXQ7XG59XG4vKipcbiAqIENsZWFuIHVwIGFuIGFycmF5IHRvIGhhcmRlbiBhZ2FpbnN0IENTUFBcbiAqXG4gKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgdG8gYmUgY2xlYW5lZC5cbiAqIEByZXR1cm5zIFRoZSBjbGVhbmVkIHZlcnNpb24gb2YgdGhlIGFycmF5XG4gKi9cbmZ1bmN0aW9uIGNsZWFuQXJyYXkoYXJyYXkpIHtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGFycmF5Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgIGNvbnN0IGlzUHJvcGVydHlFeGlzdCA9IG9iamVjdEhhc093blByb3BlcnR5KGFycmF5LCBpbmRleCk7XG4gICAgaWYgKCFpc1Byb3BlcnR5RXhpc3QpIHtcbiAgICAgIGFycmF5W2luZGV4XSA9IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cbi8qKlxuICogU2hhbGxvdyBjbG9uZSBhbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0gb2JqZWN0IC0gVGhlIG9iamVjdCB0byBiZSBjbG9uZWQuXG4gKiBAcmV0dXJucyBBIG5ldyBvYmplY3QgdGhhdCBjb3BpZXMgdGhlIG9yaWdpbmFsLlxuICovXG5mdW5jdGlvbiBjbG9uZShvYmplY3QpIHtcbiAgY29uc3QgbmV3T2JqZWN0ID0gY3JlYXRlKG51bGwpO1xuICBmb3IgKGNvbnN0IFtwcm9wZXJ0eSwgdmFsdWVdIG9mIGVudHJpZXMob2JqZWN0KSkge1xuICAgIGNvbnN0IGlzUHJvcGVydHlFeGlzdCA9IG9iamVjdEhhc093blByb3BlcnR5KG9iamVjdCwgcHJvcGVydHkpO1xuICAgIGlmIChpc1Byb3BlcnR5RXhpc3QpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gY2xlYW5BcnJheSh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gY2xvbmUodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3T2JqZWN0O1xufVxuLyoqXG4gKiBUaGlzIG1ldGhvZCBhdXRvbWF0aWNhbGx5IGNoZWNrcyBpZiB0aGUgcHJvcCBpcyBmdW5jdGlvbiBvciBnZXR0ZXIgYW5kIGJlaGF2ZXMgYWNjb3JkaW5nbHkuXG4gKlxuICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gbG9vayB1cCB0aGUgZ2V0dGVyIGZ1bmN0aW9uIGluIGl0cyBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0gcHJvcCAtIFRoZSBwcm9wZXJ0eSBuYW1lIGZvciB3aGljaCB0byBmaW5kIHRoZSBnZXR0ZXIgZnVuY3Rpb24uXG4gKiBAcmV0dXJucyBUaGUgZ2V0dGVyIGZ1bmN0aW9uIGZvdW5kIGluIHRoZSBwcm90b3R5cGUgY2hhaW4gb3IgYSBmYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbG9va3VwR2V0dGVyKG9iamVjdCwgcHJvcCkge1xuICB3aGlsZSAob2JqZWN0ICE9PSBudWxsKSB7XG4gICAgY29uc3QgZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3ApO1xuICAgIGlmIChkZXNjKSB7XG4gICAgICBpZiAoZGVzYy5nZXQpIHtcbiAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy5nZXQpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBkZXNjLnZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB1bmFwcGx5KGRlc2MudmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBvYmplY3QgPSBnZXRQcm90b3R5cGVPZihvYmplY3QpO1xuICB9XG4gIGZ1bmN0aW9uIGZhbGxiYWNrVmFsdWUoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGZhbGxiYWNrVmFsdWU7XG59XG5cbmNvbnN0IGh0bWwkMSA9IGZyZWV6ZShbJ2EnLCAnYWJicicsICdhY3JvbnltJywgJ2FkZHJlc3MnLCAnYXJlYScsICdhcnRpY2xlJywgJ2FzaWRlJywgJ2F1ZGlvJywgJ2InLCAnYmRpJywgJ2JkbycsICdiaWcnLCAnYmxpbmsnLCAnYmxvY2txdW90ZScsICdib2R5JywgJ2JyJywgJ2J1dHRvbicsICdjYW52YXMnLCAnY2FwdGlvbicsICdjZW50ZXInLCAnY2l0ZScsICdjb2RlJywgJ2NvbCcsICdjb2xncm91cCcsICdjb250ZW50JywgJ2RhdGEnLCAnZGF0YWxpc3QnLCAnZGQnLCAnZGVjb3JhdG9yJywgJ2RlbCcsICdkZXRhaWxzJywgJ2RmbicsICdkaWFsb2cnLCAnZGlyJywgJ2RpdicsICdkbCcsICdkdCcsICdlbGVtZW50JywgJ2VtJywgJ2ZpZWxkc2V0JywgJ2ZpZ2NhcHRpb24nLCAnZmlndXJlJywgJ2ZvbnQnLCAnZm9vdGVyJywgJ2Zvcm0nLCAnaDEnLCAnaDInLCAnaDMnLCAnaDQnLCAnaDUnLCAnaDYnLCAnaGVhZCcsICdoZWFkZXInLCAnaGdyb3VwJywgJ2hyJywgJ2h0bWwnLCAnaScsICdpbWcnLCAnaW5wdXQnLCAnaW5zJywgJ2tiZCcsICdsYWJlbCcsICdsZWdlbmQnLCAnbGknLCAnbWFpbicsICdtYXAnLCAnbWFyaycsICdtYXJxdWVlJywgJ21lbnUnLCAnbWVudWl0ZW0nLCAnbWV0ZXInLCAnbmF2JywgJ25vYnInLCAnb2wnLCAnb3B0Z3JvdXAnLCAnb3B0aW9uJywgJ291dHB1dCcsICdwJywgJ3BpY3R1cmUnLCAncHJlJywgJ3Byb2dyZXNzJywgJ3EnLCAncnAnLCAncnQnLCAncnVieScsICdzJywgJ3NhbXAnLCAnc2VhcmNoJywgJ3NlY3Rpb24nLCAnc2VsZWN0JywgJ3NoYWRvdycsICdzbG90JywgJ3NtYWxsJywgJ3NvdXJjZScsICdzcGFjZXInLCAnc3BhbicsICdzdHJpa2UnLCAnc3Ryb25nJywgJ3N0eWxlJywgJ3N1YicsICdzdW1tYXJ5JywgJ3N1cCcsICd0YWJsZScsICd0Ym9keScsICd0ZCcsICd0ZW1wbGF0ZScsICd0ZXh0YXJlYScsICd0Zm9vdCcsICd0aCcsICd0aGVhZCcsICd0aW1lJywgJ3RyJywgJ3RyYWNrJywgJ3R0JywgJ3UnLCAndWwnLCAndmFyJywgJ3ZpZGVvJywgJ3diciddKTtcbmNvbnN0IHN2ZyQxID0gZnJlZXplKFsnc3ZnJywgJ2EnLCAnYWx0Z2x5cGgnLCAnYWx0Z2x5cGhkZWYnLCAnYWx0Z2x5cGhpdGVtJywgJ2FuaW1hdGVjb2xvcicsICdhbmltYXRlbW90aW9uJywgJ2FuaW1hdGV0cmFuc2Zvcm0nLCAnY2lyY2xlJywgJ2NsaXBwYXRoJywgJ2RlZnMnLCAnZGVzYycsICdlbGxpcHNlJywgJ2VudGVya2V5aGludCcsICdleHBvcnRwYXJ0cycsICdmaWx0ZXInLCAnZm9udCcsICdnJywgJ2dseXBoJywgJ2dseXBocmVmJywgJ2hrZXJuJywgJ2ltYWdlJywgJ2lucHV0bW9kZScsICdsaW5lJywgJ2xpbmVhcmdyYWRpZW50JywgJ21hcmtlcicsICdtYXNrJywgJ21ldGFkYXRhJywgJ21wYXRoJywgJ3BhcnQnLCAncGF0aCcsICdwYXR0ZXJuJywgJ3BvbHlnb24nLCAncG9seWxpbmUnLCAncmFkaWFsZ3JhZGllbnQnLCAncmVjdCcsICdzdG9wJywgJ3N0eWxlJywgJ3N3aXRjaCcsICdzeW1ib2wnLCAndGV4dCcsICd0ZXh0cGF0aCcsICd0aXRsZScsICd0cmVmJywgJ3RzcGFuJywgJ3ZpZXcnLCAndmtlcm4nXSk7XG5jb25zdCBzdmdGaWx0ZXJzID0gZnJlZXplKFsnZmVCbGVuZCcsICdmZUNvbG9yTWF0cml4JywgJ2ZlQ29tcG9uZW50VHJhbnNmZXInLCAnZmVDb21wb3NpdGUnLCAnZmVDb252b2x2ZU1hdHJpeCcsICdmZURpZmZ1c2VMaWdodGluZycsICdmZURpc3BsYWNlbWVudE1hcCcsICdmZURpc3RhbnRMaWdodCcsICdmZURyb3BTaGFkb3cnLCAnZmVGbG9vZCcsICdmZUZ1bmNBJywgJ2ZlRnVuY0InLCAnZmVGdW5jRycsICdmZUZ1bmNSJywgJ2ZlR2F1c3NpYW5CbHVyJywgJ2ZlSW1hZ2UnLCAnZmVNZXJnZScsICdmZU1lcmdlTm9kZScsICdmZU1vcnBob2xvZ3knLCAnZmVPZmZzZXQnLCAnZmVQb2ludExpZ2h0JywgJ2ZlU3BlY3VsYXJMaWdodGluZycsICdmZVNwb3RMaWdodCcsICdmZVRpbGUnLCAnZmVUdXJidWxlbmNlJ10pO1xuLy8gTGlzdCBvZiBTVkcgZWxlbWVudHMgdGhhdCBhcmUgZGlzYWxsb3dlZCBieSBkZWZhdWx0LlxuLy8gV2Ugc3RpbGwgbmVlZCB0byBrbm93IHRoZW0gc28gdGhhdCB3ZSBjYW4gZG8gbmFtZXNwYWNlXG4vLyBjaGVja3MgcHJvcGVybHkgaW4gY2FzZSBvbmUgd2FudHMgdG8gYWRkIHRoZW0gdG9cbi8vIGFsbG93LWxpc3QuXG5jb25zdCBzdmdEaXNhbGxvd2VkID0gZnJlZXplKFsnYW5pbWF0ZScsICdjb2xvci1wcm9maWxlJywgJ2N1cnNvcicsICdkaXNjYXJkJywgJ2ZvbnQtZmFjZScsICdmb250LWZhY2UtZm9ybWF0JywgJ2ZvbnQtZmFjZS1uYW1lJywgJ2ZvbnQtZmFjZS1zcmMnLCAnZm9udC1mYWNlLXVyaScsICdmb3JlaWdub2JqZWN0JywgJ2hhdGNoJywgJ2hhdGNocGF0aCcsICdtZXNoJywgJ21lc2hncmFkaWVudCcsICdtZXNocGF0Y2gnLCAnbWVzaHJvdycsICdtaXNzaW5nLWdseXBoJywgJ3NjcmlwdCcsICdzZXQnLCAnc29saWRjb2xvcicsICd1bmtub3duJywgJ3VzZSddKTtcbmNvbnN0IG1hdGhNbCQxID0gZnJlZXplKFsnbWF0aCcsICdtZW5jbG9zZScsICdtZXJyb3InLCAnbWZlbmNlZCcsICdtZnJhYycsICdtZ2x5cGgnLCAnbWknLCAnbWxhYmVsZWR0cicsICdtbXVsdGlzY3JpcHRzJywgJ21uJywgJ21vJywgJ21vdmVyJywgJ21wYWRkZWQnLCAnbXBoYW50b20nLCAnbXJvb3QnLCAnbXJvdycsICdtcycsICdtc3BhY2UnLCAnbXNxcnQnLCAnbXN0eWxlJywgJ21zdWInLCAnbXN1cCcsICdtc3Vic3VwJywgJ210YWJsZScsICdtdGQnLCAnbXRleHQnLCAnbXRyJywgJ211bmRlcicsICdtdW5kZXJvdmVyJywgJ21wcmVzY3JpcHRzJ10pO1xuLy8gU2ltaWxhcmx5IHRvIFNWRywgd2Ugd2FudCB0byBrbm93IGFsbCBNYXRoTUwgZWxlbWVudHMsXG4vLyBldmVuIHRob3NlIHRoYXQgd2UgZGlzYWxsb3cgYnkgZGVmYXVsdC5cbmNvbnN0IG1hdGhNbERpc2FsbG93ZWQgPSBmcmVlemUoWydtYWN0aW9uJywgJ21hbGlnbmdyb3VwJywgJ21hbGlnbm1hcmsnLCAnbWxvbmdkaXYnLCAnbXNjYXJyaWVzJywgJ21zY2FycnknLCAnbXNncm91cCcsICdtc3RhY2snLCAnbXNsaW5lJywgJ21zcm93JywgJ3NlbWFudGljcycsICdhbm5vdGF0aW9uJywgJ2Fubm90YXRpb24teG1sJywgJ21wcmVzY3JpcHRzJywgJ25vbmUnXSk7XG5jb25zdCB0ZXh0ID0gZnJlZXplKFsnI3RleHQnXSk7XG5cbmNvbnN0IGh0bWwgPSBmcmVlemUoWydhY2NlcHQnLCAnYWN0aW9uJywgJ2FsaWduJywgJ2FsdCcsICdhdXRvY2FwaXRhbGl6ZScsICdhdXRvY29tcGxldGUnLCAnYXV0b3BpY3R1cmVpbnBpY3R1cmUnLCAnYXV0b3BsYXknLCAnYmFja2dyb3VuZCcsICdiZ2NvbG9yJywgJ2JvcmRlcicsICdjYXB0dXJlJywgJ2NlbGxwYWRkaW5nJywgJ2NlbGxzcGFjaW5nJywgJ2NoZWNrZWQnLCAnY2l0ZScsICdjbGFzcycsICdjbGVhcicsICdjb2xvcicsICdjb2xzJywgJ2NvbHNwYW4nLCAnY29udHJvbHMnLCAnY29udHJvbHNsaXN0JywgJ2Nvb3JkcycsICdjcm9zc29yaWdpbicsICdkYXRldGltZScsICdkZWNvZGluZycsICdkZWZhdWx0JywgJ2RpcicsICdkaXNhYmxlZCcsICdkaXNhYmxlcGljdHVyZWlucGljdHVyZScsICdkaXNhYmxlcmVtb3RlcGxheWJhY2snLCAnZG93bmxvYWQnLCAnZHJhZ2dhYmxlJywgJ2VuY3R5cGUnLCAnZW50ZXJrZXloaW50JywgJ2V4cG9ydHBhcnRzJywgJ2ZhY2UnLCAnZm9yJywgJ2hlYWRlcnMnLCAnaGVpZ2h0JywgJ2hpZGRlbicsICdoaWdoJywgJ2hyZWYnLCAnaHJlZmxhbmcnLCAnaWQnLCAnaW5lcnQnLCAnaW5wdXRtb2RlJywgJ2ludGVncml0eScsICdpc21hcCcsICdraW5kJywgJ2xhYmVsJywgJ2xhbmcnLCAnbGlzdCcsICdsb2FkaW5nJywgJ2xvb3AnLCAnbG93JywgJ21heCcsICdtYXhsZW5ndGgnLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21pbicsICdtaW5sZW5ndGgnLCAnbXVsdGlwbGUnLCAnbXV0ZWQnLCAnbmFtZScsICdub25jZScsICdub3NoYWRlJywgJ25vdmFsaWRhdGUnLCAnbm93cmFwJywgJ29wZW4nLCAnb3B0aW11bScsICdwYXJ0JywgJ3BhdHRlcm4nLCAncGxhY2Vob2xkZXInLCAncGxheXNpbmxpbmUnLCAncG9wb3ZlcicsICdwb3BvdmVydGFyZ2V0JywgJ3BvcG92ZXJ0YXJnZXRhY3Rpb24nLCAncG9zdGVyJywgJ3ByZWxvYWQnLCAncHViZGF0ZScsICdyYWRpb2dyb3VwJywgJ3JlYWRvbmx5JywgJ3JlbCcsICdyZXF1aXJlZCcsICdyZXYnLCAncmV2ZXJzZWQnLCAncm9sZScsICdyb3dzJywgJ3Jvd3NwYW4nLCAnc3BlbGxjaGVjaycsICdzY29wZScsICdzZWxlY3RlZCcsICdzaGFwZScsICdzaXplJywgJ3NpemVzJywgJ3Nsb3QnLCAnc3BhbicsICdzcmNsYW5nJywgJ3N0YXJ0JywgJ3NyYycsICdzcmNzZXQnLCAnc3RlcCcsICdzdHlsZScsICdzdW1tYXJ5JywgJ3RhYmluZGV4JywgJ3RpdGxlJywgJ3RyYW5zbGF0ZScsICd0eXBlJywgJ3VzZW1hcCcsICd2YWxpZ24nLCAndmFsdWUnLCAnd2lkdGgnLCAnd3JhcCcsICd4bWxucycsICdzbG90J10pO1xuY29uc3Qgc3ZnID0gZnJlZXplKFsnYWNjZW50LWhlaWdodCcsICdhY2N1bXVsYXRlJywgJ2FkZGl0aXZlJywgJ2FsaWdubWVudC1iYXNlbGluZScsICdhbXBsaXR1ZGUnLCAnYXNjZW50JywgJ2F0dHJpYnV0ZW5hbWUnLCAnYXR0cmlidXRldHlwZScsICdhemltdXRoJywgJ2Jhc2VmcmVxdWVuY3knLCAnYmFzZWxpbmUtc2hpZnQnLCAnYmVnaW4nLCAnYmlhcycsICdieScsICdjbGFzcycsICdjbGlwJywgJ2NsaXBwYXRodW5pdHMnLCAnY2xpcC1wYXRoJywgJ2NsaXAtcnVsZScsICdjb2xvcicsICdjb2xvci1pbnRlcnBvbGF0aW9uJywgJ2NvbG9yLWludGVycG9sYXRpb24tZmlsdGVycycsICdjb2xvci1wcm9maWxlJywgJ2NvbG9yLXJlbmRlcmluZycsICdjeCcsICdjeScsICdkJywgJ2R4JywgJ2R5JywgJ2RpZmZ1c2Vjb25zdGFudCcsICdkaXJlY3Rpb24nLCAnZGlzcGxheScsICdkaXZpc29yJywgJ2R1cicsICdlZGdlbW9kZScsICdlbGV2YXRpb24nLCAnZW5kJywgJ2V4cG9uZW50JywgJ2ZpbGwnLCAnZmlsbC1vcGFjaXR5JywgJ2ZpbGwtcnVsZScsICdmaWx0ZXInLCAnZmlsdGVydW5pdHMnLCAnZmxvb2QtY29sb3InLCAnZmxvb2Qtb3BhY2l0eScsICdmb250LWZhbWlseScsICdmb250LXNpemUnLCAnZm9udC1zaXplLWFkanVzdCcsICdmb250LXN0cmV0Y2gnLCAnZm9udC1zdHlsZScsICdmb250LXZhcmlhbnQnLCAnZm9udC13ZWlnaHQnLCAnZngnLCAnZnknLCAnZzEnLCAnZzInLCAnZ2x5cGgtbmFtZScsICdnbHlwaHJlZicsICdncmFkaWVudHVuaXRzJywgJ2dyYWRpZW50dHJhbnNmb3JtJywgJ2hlaWdodCcsICdocmVmJywgJ2lkJywgJ2ltYWdlLXJlbmRlcmluZycsICdpbicsICdpbjInLCAnaW50ZXJjZXB0JywgJ2snLCAnazEnLCAnazInLCAnazMnLCAnazQnLCAna2VybmluZycsICdrZXlwb2ludHMnLCAna2V5c3BsaW5lcycsICdrZXl0aW1lcycsICdsYW5nJywgJ2xlbmd0aGFkanVzdCcsICdsZXR0ZXItc3BhY2luZycsICdrZXJuZWxtYXRyaXgnLCAna2VybmVsdW5pdGxlbmd0aCcsICdsaWdodGluZy1jb2xvcicsICdsb2NhbCcsICdtYXJrZXItZW5kJywgJ21hcmtlci1taWQnLCAnbWFya2VyLXN0YXJ0JywgJ21hcmtlcmhlaWdodCcsICdtYXJrZXJ1bml0cycsICdtYXJrZXJ3aWR0aCcsICdtYXNrY29udGVudHVuaXRzJywgJ21hc2t1bml0cycsICdtYXgnLCAnbWFzaycsICdtYXNrLXR5cGUnLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21vZGUnLCAnbWluJywgJ25hbWUnLCAnbnVtb2N0YXZlcycsICdvZmZzZXQnLCAnb3BlcmF0b3InLCAnb3BhY2l0eScsICdvcmRlcicsICdvcmllbnQnLCAnb3JpZW50YXRpb24nLCAnb3JpZ2luJywgJ292ZXJmbG93JywgJ3BhaW50LW9yZGVyJywgJ3BhdGgnLCAncGF0aGxlbmd0aCcsICdwYXR0ZXJuY29udGVudHVuaXRzJywgJ3BhdHRlcm50cmFuc2Zvcm0nLCAncGF0dGVybnVuaXRzJywgJ3BvaW50cycsICdwcmVzZXJ2ZWFscGhhJywgJ3ByZXNlcnZlYXNwZWN0cmF0aW8nLCAncHJpbWl0aXZldW5pdHMnLCAncicsICdyeCcsICdyeScsICdyYWRpdXMnLCAncmVmeCcsICdyZWZ5JywgJ3JlcGVhdGNvdW50JywgJ3JlcGVhdGR1cicsICdyZXN0YXJ0JywgJ3Jlc3VsdCcsICdyb3RhdGUnLCAnc2NhbGUnLCAnc2VlZCcsICdzaGFwZS1yZW5kZXJpbmcnLCAnc2xvcGUnLCAnc3BlY3VsYXJjb25zdGFudCcsICdzcGVjdWxhcmV4cG9uZW50JywgJ3NwcmVhZG1ldGhvZCcsICdzdGFydG9mZnNldCcsICdzdGRkZXZpYXRpb24nLCAnc3RpdGNodGlsZXMnLCAnc3RvcC1jb2xvcicsICdzdG9wLW9wYWNpdHknLCAnc3Ryb2tlLWRhc2hhcnJheScsICdzdHJva2UtZGFzaG9mZnNldCcsICdzdHJva2UtbGluZWNhcCcsICdzdHJva2UtbGluZWpvaW4nLCAnc3Ryb2tlLW1pdGVybGltaXQnLCAnc3Ryb2tlLW9wYWNpdHknLCAnc3Ryb2tlJywgJ3N0cm9rZS13aWR0aCcsICdzdHlsZScsICdzdXJmYWNlc2NhbGUnLCAnc3lzdGVtbGFuZ3VhZ2UnLCAndGFiaW5kZXgnLCAndGFibGV2YWx1ZXMnLCAndGFyZ2V0eCcsICd0YXJnZXR5JywgJ3RyYW5zZm9ybScsICd0cmFuc2Zvcm0tb3JpZ2luJywgJ3RleHQtYW5jaG9yJywgJ3RleHQtZGVjb3JhdGlvbicsICd0ZXh0LXJlbmRlcmluZycsICd0ZXh0bGVuZ3RoJywgJ3R5cGUnLCAndTEnLCAndTInLCAndW5pY29kZScsICd2YWx1ZXMnLCAndmlld2JveCcsICd2aXNpYmlsaXR5JywgJ3ZlcnNpb24nLCAndmVydC1hZHYteScsICd2ZXJ0LW9yaWdpbi14JywgJ3ZlcnQtb3JpZ2luLXknLCAnd2lkdGgnLCAnd29yZC1zcGFjaW5nJywgJ3dyYXAnLCAnd3JpdGluZy1tb2RlJywgJ3hjaGFubmVsc2VsZWN0b3InLCAneWNoYW5uZWxzZWxlY3RvcicsICd4JywgJ3gxJywgJ3gyJywgJ3htbG5zJywgJ3knLCAneTEnLCAneTInLCAneicsICd6b29tYW5kcGFuJ10pO1xuY29uc3QgbWF0aE1sID0gZnJlZXplKFsnYWNjZW50JywgJ2FjY2VudHVuZGVyJywgJ2FsaWduJywgJ2JldmVsbGVkJywgJ2Nsb3NlJywgJ2NvbHVtbnNhbGlnbicsICdjb2x1bW5saW5lcycsICdjb2x1bW5zcGFuJywgJ2Rlbm9tYWxpZ24nLCAnZGVwdGgnLCAnZGlyJywgJ2Rpc3BsYXknLCAnZGlzcGxheXN0eWxlJywgJ2VuY29kaW5nJywgJ2ZlbmNlJywgJ2ZyYW1lJywgJ2hlaWdodCcsICdocmVmJywgJ2lkJywgJ2xhcmdlb3AnLCAnbGVuZ3RoJywgJ2xpbmV0aGlja25lc3MnLCAnbHNwYWNlJywgJ2xxdW90ZScsICdtYXRoYmFja2dyb3VuZCcsICdtYXRoY29sb3InLCAnbWF0aHNpemUnLCAnbWF0aHZhcmlhbnQnLCAnbWF4c2l6ZScsICdtaW5zaXplJywgJ21vdmFibGVsaW1pdHMnLCAnbm90YXRpb24nLCAnbnVtYWxpZ24nLCAnb3BlbicsICdyb3dhbGlnbicsICdyb3dsaW5lcycsICdyb3dzcGFjaW5nJywgJ3Jvd3NwYW4nLCAncnNwYWNlJywgJ3JxdW90ZScsICdzY3JpcHRsZXZlbCcsICdzY3JpcHRtaW5zaXplJywgJ3NjcmlwdHNpemVtdWx0aXBsaWVyJywgJ3NlbGVjdGlvbicsICdzZXBhcmF0b3InLCAnc2VwYXJhdG9ycycsICdzdHJldGNoeScsICdzdWJzY3JpcHRzaGlmdCcsICdzdXBzY3JpcHRzaGlmdCcsICdzeW1tZXRyaWMnLCAndm9mZnNldCcsICd3aWR0aCcsICd4bWxucyddKTtcbmNvbnN0IHhtbCA9IGZyZWV6ZShbJ3hsaW5rOmhyZWYnLCAneG1sOmlkJywgJ3hsaW5rOnRpdGxlJywgJ3htbDpzcGFjZScsICd4bWxuczp4bGluayddKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vYmV0dGVyLXJlZ2V4XG5jb25zdCBNVVNUQUNIRV9FWFBSID0gc2VhbCgvXFx7XFx7W1xcd1xcV10qfFtcXHdcXFddKlxcfVxcfS9nbSk7IC8vIFNwZWNpZnkgdGVtcGxhdGUgZGV0ZWN0aW9uIHJlZ2V4IGZvciBTQUZFX0ZPUl9URU1QTEFURVMgbW9kZVxuY29uc3QgRVJCX0VYUFIgPSBzZWFsKC88JVtcXHdcXFddKnxbXFx3XFxXXSolPi9nbSk7XG5jb25zdCBUTVBMSVRfRVhQUiA9IHNlYWwoL1xcJFxce1tcXHdcXFddKi9nbSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdW5pY29ybi9iZXR0ZXItcmVnZXhcbmNvbnN0IERBVEFfQVRUUiA9IHNlYWwoL15kYXRhLVtcXC1cXHcuXFx1MDBCNy1cXHVGRkZGXSskLyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbmNvbnN0IEFSSUFfQVRUUiA9IHNlYWwoL15hcmlhLVtcXC1cXHddKyQvKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuY29uc3QgSVNfQUxMT1dFRF9VUkkgPSBzZWFsKC9eKD86KD86KD86ZnxodCl0cHM/fG1haWx0b3x0ZWx8Y2FsbHRvfHNtc3xjaWR8eG1wcHxtYXRyaXgpOnxbXmEtel18W2EteisuXFwtXSsoPzpbXmEteisuXFwtOl18JCkpL2kgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuKTtcbmNvbnN0IElTX1NDUklQVF9PUl9EQVRBID0gc2VhbCgvXig/OlxcdytzY3JpcHR8ZGF0YSk6L2kpO1xuY29uc3QgQVRUUl9XSElURVNQQUNFID0gc2VhbCgvW1xcdTAwMDAtXFx1MDAyMFxcdTAwQTBcXHUxNjgwXFx1MTgwRVxcdTIwMDAtXFx1MjAyOVxcdTIwNUZcXHUzMDAwXS9nIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29udHJvbC1yZWdleFxuKTtcbmNvbnN0IERPQ1RZUEVfTkFNRSA9IHNlYWwoL15odG1sJC9pKTtcbmNvbnN0IENVU1RPTV9FTEVNRU5UID0gc2VhbCgvXlthLXpdWy5cXHddKigtWy5cXHddKykrJC9pKTtcblxudmFyIEVYUFJFU1NJT05TID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIEFSSUFfQVRUUjogQVJJQV9BVFRSLFxuICBBVFRSX1dISVRFU1BBQ0U6IEFUVFJfV0hJVEVTUEFDRSxcbiAgQ1VTVE9NX0VMRU1FTlQ6IENVU1RPTV9FTEVNRU5ULFxuICBEQVRBX0FUVFI6IERBVEFfQVRUUixcbiAgRE9DVFlQRV9OQU1FOiBET0NUWVBFX05BTUUsXG4gIEVSQl9FWFBSOiBFUkJfRVhQUixcbiAgSVNfQUxMT1dFRF9VUkk6IElTX0FMTE9XRURfVVJJLFxuICBJU19TQ1JJUFRfT1JfREFUQTogSVNfU0NSSVBUX09SX0RBVEEsXG4gIE1VU1RBQ0hFX0VYUFI6IE1VU1RBQ0hFX0VYUFIsXG4gIFRNUExJVF9FWFBSOiBUTVBMSVRfRVhQUlxufSk7XG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9pbmRlbnQgKi9cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL25vZGVUeXBlXG5jb25zdCBOT0RFX1RZUEUgPSB7XG4gIGVsZW1lbnQ6IDEsXG4gIGF0dHJpYnV0ZTogMixcbiAgdGV4dDogMyxcbiAgY2RhdGFTZWN0aW9uOiA0LFxuICBlbnRpdHlSZWZlcmVuY2U6IDUsXG4gIC8vIERlcHJlY2F0ZWRcbiAgZW50aXR5Tm9kZTogNixcbiAgLy8gRGVwcmVjYXRlZFxuICBwcm9ncmVzc2luZ0luc3RydWN0aW9uOiA3LFxuICBjb21tZW50OiA4LFxuICBkb2N1bWVudDogOSxcbiAgZG9jdW1lbnRUeXBlOiAxMCxcbiAgZG9jdW1lbnRGcmFnbWVudDogMTEsXG4gIG5vdGF0aW9uOiAxMiAvLyBEZXByZWNhdGVkXG59O1xuY29uc3QgZ2V0R2xvYmFsID0gZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogd2luZG93O1xufTtcbi8qKlxuICogQ3JlYXRlcyBhIG5vLW9wIHBvbGljeSBmb3IgaW50ZXJuYWwgdXNlIG9ubHkuXG4gKiBEb24ndCBleHBvcnQgdGhpcyBmdW5jdGlvbiBvdXRzaWRlIHRoaXMgbW9kdWxlIVxuICogQHBhcmFtIHRydXN0ZWRUeXBlcyBUaGUgcG9saWN5IGZhY3RvcnkuXG4gKiBAcGFyYW0gcHVyaWZ5SG9zdEVsZW1lbnQgVGhlIFNjcmlwdCBlbGVtZW50IHVzZWQgdG8gbG9hZCBET01QdXJpZnkgKHRvIGRldGVybWluZSBwb2xpY3kgbmFtZSBzdWZmaXgpLlxuICogQHJldHVybiBUaGUgcG9saWN5IGNyZWF0ZWQgKG9yIG51bGwsIGlmIFRydXN0ZWQgVHlwZXNcbiAqIGFyZSBub3Qgc3VwcG9ydGVkIG9yIGNyZWF0aW5nIHRoZSBwb2xpY3kgZmFpbGVkKS5cbiAqL1xuY29uc3QgX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSA9IGZ1bmN0aW9uIF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBwdXJpZnlIb3N0RWxlbWVudCkge1xuICBpZiAodHlwZW9mIHRydXN0ZWRUeXBlcyAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBBbGxvdyB0aGUgY2FsbGVycyB0byBjb250cm9sIHRoZSB1bmlxdWUgcG9saWN5IG5hbWVcbiAgLy8gYnkgYWRkaW5nIGEgZGF0YS10dC1wb2xpY3ktc3VmZml4IHRvIHRoZSBzY3JpcHQgZWxlbWVudCB3aXRoIHRoZSBET01QdXJpZnkuXG4gIC8vIFBvbGljeSBjcmVhdGlvbiB3aXRoIGR1cGxpY2F0ZSBuYW1lcyB0aHJvd3MgaW4gVHJ1c3RlZCBUeXBlcy5cbiAgbGV0IHN1ZmZpeCA9IG51bGw7XG4gIGNvbnN0IEFUVFJfTkFNRSA9ICdkYXRhLXR0LXBvbGljeS1zdWZmaXgnO1xuICBpZiAocHVyaWZ5SG9zdEVsZW1lbnQgJiYgcHVyaWZ5SG9zdEVsZW1lbnQuaGFzQXR0cmlidXRlKEFUVFJfTkFNRSkpIHtcbiAgICBzdWZmaXggPSBwdXJpZnlIb3N0RWxlbWVudC5nZXRBdHRyaWJ1dGUoQVRUUl9OQU1FKTtcbiAgfVxuICBjb25zdCBwb2xpY3lOYW1lID0gJ2RvbXB1cmlmeScgKyAoc3VmZml4ID8gJyMnICsgc3VmZml4IDogJycpO1xuICB0cnkge1xuICAgIHJldHVybiB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5KHBvbGljeU5hbWUsIHtcbiAgICAgIGNyZWF0ZUhUTUwoaHRtbCkge1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVTY3JpcHRVUkwoc2NyaXB0VXJsKSB7XG4gICAgICAgIHJldHVybiBzY3JpcHRVcmw7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKF8pIHtcbiAgICAvLyBQb2xpY3kgY3JlYXRpb24gZmFpbGVkIChtb3N0IGxpa2VseSBhbm90aGVyIERPTVB1cmlmeSBzY3JpcHQgaGFzXG4gICAgLy8gYWxyZWFkeSBydW4pLiBTa2lwIGNyZWF0aW5nIHRoZSBwb2xpY3ksIGFzIHRoaXMgd2lsbCBvbmx5IGNhdXNlIGVycm9yc1xuICAgIC8vIGlmIFRUIGFyZSBlbmZvcmNlZC5cbiAgICBjb25zb2xlLndhcm4oJ1RydXN0ZWRUeXBlcyBwb2xpY3kgJyArIHBvbGljeU5hbWUgKyAnIGNvdWxkIG5vdCBiZSBjcmVhdGVkLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuY29uc3QgX2NyZWF0ZUhvb2tzTWFwID0gZnVuY3Rpb24gX2NyZWF0ZUhvb2tzTWFwKCkge1xuICByZXR1cm4ge1xuICAgIGFmdGVyU2FuaXRpemVBdHRyaWJ1dGVzOiBbXSxcbiAgICBhZnRlclNhbml0aXplRWxlbWVudHM6IFtdLFxuICAgIGFmdGVyU2FuaXRpemVTaGFkb3dET006IFtdLFxuICAgIGJlZm9yZVNhbml0aXplQXR0cmlidXRlczogW10sXG4gICAgYmVmb3JlU2FuaXRpemVFbGVtZW50czogW10sXG4gICAgYmVmb3JlU2FuaXRpemVTaGFkb3dET006IFtdLFxuICAgIHVwb25TYW5pdGl6ZUF0dHJpYnV0ZTogW10sXG4gICAgdXBvblNhbml0aXplRWxlbWVudDogW10sXG4gICAgdXBvblNhbml0aXplU2hhZG93Tm9kZTogW11cbiAgfTtcbn07XG5mdW5jdGlvbiBjcmVhdGVET01QdXJpZnkoKSB7XG4gIGxldCB3aW5kb3cgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGdldEdsb2JhbCgpO1xuICBjb25zdCBET01QdXJpZnkgPSByb290ID0+IGNyZWF0ZURPTVB1cmlmeShyb290KTtcbiAgRE9NUHVyaWZ5LnZlcnNpb24gPSAnMy4zLjEnO1xuICBET01QdXJpZnkucmVtb3ZlZCA9IFtdO1xuICBpZiAoIXdpbmRvdyB8fCAhd2luZG93LmRvY3VtZW50IHx8IHdpbmRvdy5kb2N1bWVudC5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLmRvY3VtZW50IHx8ICF3aW5kb3cuRWxlbWVudCkge1xuICAgIC8vIE5vdCBydW5uaW5nIGluIGEgYnJvd3NlciwgcHJvdmlkZSBhIGZhY3RvcnkgZnVuY3Rpb25cbiAgICAvLyBzbyB0aGF0IHlvdSBjYW4gcGFzcyB5b3VyIG93biBXaW5kb3dcbiAgICBET01QdXJpZnkuaXNTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gRE9NUHVyaWZ5O1xuICB9XG4gIGxldCB7XG4gICAgZG9jdW1lbnRcbiAgfSA9IHdpbmRvdztcbiAgY29uc3Qgb3JpZ2luYWxEb2N1bWVudCA9IGRvY3VtZW50O1xuICBjb25zdCBjdXJyZW50U2NyaXB0ID0gb3JpZ2luYWxEb2N1bWVudC5jdXJyZW50U2NyaXB0O1xuICBjb25zdCB7XG4gICAgRG9jdW1lbnRGcmFnbWVudCxcbiAgICBIVE1MVGVtcGxhdGVFbGVtZW50LFxuICAgIE5vZGUsXG4gICAgRWxlbWVudCxcbiAgICBOb2RlRmlsdGVyLFxuICAgIE5hbWVkTm9kZU1hcCA9IHdpbmRvdy5OYW1lZE5vZGVNYXAgfHwgd2luZG93Lk1vek5hbWVkQXR0ck1hcCxcbiAgICBIVE1MRm9ybUVsZW1lbnQsXG4gICAgRE9NUGFyc2VyLFxuICAgIHRydXN0ZWRUeXBlc1xuICB9ID0gd2luZG93O1xuICBjb25zdCBFbGVtZW50UHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGU7XG4gIGNvbnN0IGNsb25lTm9kZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnY2xvbmVOb2RlJyk7XG4gIGNvbnN0IHJlbW92ZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAncmVtb3ZlJyk7XG4gIGNvbnN0IGdldE5leHRTaWJsaW5nID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICduZXh0U2libGluZycpO1xuICBjb25zdCBnZXRDaGlsZE5vZGVzID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjaGlsZE5vZGVzJyk7XG4gIGNvbnN0IGdldFBhcmVudE5vZGUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ3BhcmVudE5vZGUnKTtcbiAgLy8gQXMgcGVyIGlzc3VlICM0NywgdGhlIHdlYi1jb21wb25lbnRzIHJlZ2lzdHJ5IGlzIGluaGVyaXRlZCBieSBhXG4gIC8vIG5ldyBkb2N1bWVudCBjcmVhdGVkIHZpYSBjcmVhdGVIVE1MRG9jdW1lbnQuIEFzIHBlciB0aGUgc3BlY1xuICAvLyAoaHR0cDovL3czYy5naXRodWIuaW8vd2ViY29tcG9uZW50cy9zcGVjL2N1c3RvbS8jY3JlYXRpbmctYW5kLXBhc3NpbmctcmVnaXN0cmllcylcbiAgLy8gYSBuZXcgZW1wdHkgcmVnaXN0cnkgaXMgdXNlZCB3aGVuIGNyZWF0aW5nIGEgdGVtcGxhdGUgY29udGVudHMgb3duZXJcbiAgLy8gZG9jdW1lbnQsIHNvIHdlIHVzZSB0aGF0IGFzIG91ciBwYXJlbnQgZG9jdW1lbnQgdG8gZW5zdXJlIG5vdGhpbmdcbiAgLy8gaXMgaW5oZXJpdGVkLlxuICBpZiAodHlwZW9mIEhUTUxUZW1wbGF0ZUVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgaWYgKHRlbXBsYXRlLmNvbnRlbnQgJiYgdGVtcGxhdGUuY29udGVudC5vd25lckRvY3VtZW50KSB7XG4gICAgICBkb2N1bWVudCA9IHRlbXBsYXRlLmNvbnRlbnQub3duZXJEb2N1bWVudDtcbiAgICB9XG4gIH1cbiAgbGV0IHRydXN0ZWRUeXBlc1BvbGljeTtcbiAgbGV0IGVtcHR5SFRNTCA9ICcnO1xuICBjb25zdCB7XG4gICAgaW1wbGVtZW50YXRpb24sXG4gICAgY3JlYXRlTm9kZUl0ZXJhdG9yLFxuICAgIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQsXG4gICAgZ2V0RWxlbWVudHNCeVRhZ05hbWVcbiAgfSA9IGRvY3VtZW50O1xuICBjb25zdCB7XG4gICAgaW1wb3J0Tm9kZVxuICB9ID0gb3JpZ2luYWxEb2N1bWVudDtcbiAgbGV0IGhvb2tzID0gX2NyZWF0ZUhvb2tzTWFwKCk7XG4gIC8qKlxuICAgKiBFeHBvc2Ugd2hldGhlciB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgcnVubmluZyB0aGUgZnVsbCBET01QdXJpZnkuXG4gICAqL1xuICBET01QdXJpZnkuaXNTdXBwb3J0ZWQgPSB0eXBlb2YgZW50cmllcyA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZ2V0UGFyZW50Tm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpbXBsZW1lbnRhdGlvbiAmJiBpbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQgIT09IHVuZGVmaW5lZDtcbiAgY29uc3Qge1xuICAgIE1VU1RBQ0hFX0VYUFIsXG4gICAgRVJCX0VYUFIsXG4gICAgVE1QTElUX0VYUFIsXG4gICAgREFUQV9BVFRSLFxuICAgIEFSSUFfQVRUUixcbiAgICBJU19TQ1JJUFRfT1JfREFUQSxcbiAgICBBVFRSX1dISVRFU1BBQ0UsXG4gICAgQ1VTVE9NX0VMRU1FTlRcbiAgfSA9IEVYUFJFU1NJT05TO1xuICBsZXQge1xuICAgIElTX0FMTE9XRURfVVJJOiBJU19BTExPV0VEX1VSSSQxXG4gIH0gPSBFWFBSRVNTSU9OUztcbiAgLyoqXG4gICAqIFdlIGNvbnNpZGVyIHRoZSBlbGVtZW50cyBhbmQgYXR0cmlidXRlcyBiZWxvdyB0byBiZSBzYWZlLiBJZGVhbGx5XG4gICAqIGRvbid0IGFkZCBhbnkgbmV3IG9uZXMgYnV0IGZlZWwgZnJlZSB0byByZW1vdmUgdW53YW50ZWQgb25lcy5cbiAgICovXG4gIC8qIGFsbG93ZWQgZWxlbWVudCBuYW1lcyAqL1xuICBsZXQgQUxMT1dFRF9UQUdTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9BTExPV0VEX1RBR1MgPSBhZGRUb1NldCh7fSwgWy4uLmh0bWwkMSwgLi4uc3ZnJDEsIC4uLnN2Z0ZpbHRlcnMsIC4uLm1hdGhNbCQxLCAuLi50ZXh0XSk7XG4gIC8qIEFsbG93ZWQgYXR0cmlidXRlIG5hbWVzICovXG4gIGxldCBBTExPV0VEX0FUVFIgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0FMTE9XRURfQVRUUiA9IGFkZFRvU2V0KHt9LCBbLi4uaHRtbCwgLi4uc3ZnLCAuLi5tYXRoTWwsIC4uLnhtbF0pO1xuICAvKlxuICAgKiBDb25maWd1cmUgaG93IERPTVB1cmlmeSBzaG91bGQgaGFuZGxlIGN1c3RvbSBlbGVtZW50cyBhbmQgdGhlaXIgYXR0cmlidXRlcyBhcyB3ZWxsIGFzIGN1c3RvbWl6ZWQgYnVpbHQtaW4gZWxlbWVudHMuXG4gICAqIEBwcm9wZXJ0eSB7UmVnRXhwfEZ1bmN0aW9ufG51bGx9IHRhZ05hbWVDaGVjayBvbmUgb2YgW251bGwsIHJlZ2V4UGF0dGVybiwgcHJlZGljYXRlXS4gRGVmYXVsdDogYG51bGxgIChkaXNhbGxvdyBhbnkgY3VzdG9tIGVsZW1lbnRzKVxuICAgKiBAcHJvcGVydHkge1JlZ0V4cHxGdW5jdGlvbnxudWxsfSBhdHRyaWJ1dGVOYW1lQ2hlY2sgb25lIG9mIFtudWxsLCByZWdleFBhdHRlcm4sIHByZWRpY2F0ZV0uIERlZmF1bHQ6IGBudWxsYCAoZGlzYWxsb3cgYW55IGF0dHJpYnV0ZXMgbm90IG9uIHRoZSBhbGxvdyBsaXN0KVxuICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IGFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyBhbGxvdyBjdXN0b20gZWxlbWVudHMgZGVyaXZlZCBmcm9tIGJ1aWx0LWlucyBpZiB0aGV5IHBhc3MgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLiBEZWZhdWx0OiBgZmFsc2VgLlxuICAgKi9cbiAgbGV0IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HID0gT2JqZWN0LnNlYWwoY3JlYXRlKG51bGwsIHtcbiAgICB0YWdOYW1lQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sXG4gICAgYXR0cmlidXRlTmFtZUNoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9LFxuICAgIGFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50czoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBmYWxzZVxuICAgIH1cbiAgfSkpO1xuICAvKiBFeHBsaWNpdGx5IGZvcmJpZGRlbiB0YWdzIChvdmVycmlkZXMgQUxMT1dFRF9UQUdTL0FERF9UQUdTKSAqL1xuICBsZXQgRk9SQklEX1RBR1MgPSBudWxsO1xuICAvKiBFeHBsaWNpdGx5IGZvcmJpZGRlbiBhdHRyaWJ1dGVzIChvdmVycmlkZXMgQUxMT1dFRF9BVFRSL0FERF9BVFRSKSAqL1xuICBsZXQgRk9SQklEX0FUVFIgPSBudWxsO1xuICAvKiBDb25maWcgb2JqZWN0IHRvIHN0b3JlIEFERF9UQUdTL0FERF9BVFRSIGZ1bmN0aW9ucyAod2hlbiB1c2VkIGFzIGZ1bmN0aW9ucykgKi9cbiAgY29uc3QgRVhUUkFfRUxFTUVOVF9IQU5ETElORyA9IE9iamVjdC5zZWFsKGNyZWF0ZShudWxsLCB7XG4gICAgdGFnQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sXG4gICAgYXR0cmlidXRlQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH1cbiAgfSkpO1xuICAvKiBEZWNpZGUgaWYgQVJJQSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gIGxldCBBTExPV19BUklBX0FUVFIgPSB0cnVlO1xuICAvKiBEZWNpZGUgaWYgY3VzdG9tIGRhdGEgYXR0cmlidXRlcyBhcmUgb2theSAqL1xuICBsZXQgQUxMT1dfREFUQV9BVFRSID0gdHJ1ZTtcbiAgLyogRGVjaWRlIGlmIHVua25vd24gcHJvdG9jb2xzIGFyZSBva2F5ICovXG4gIGxldCBBTExPV19VTktOT1dOX1BST1RPQ09MUyA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgc2VsZi1jbG9zaW5nIHRhZ3MgaW4gYXR0cmlidXRlcyBhcmUgYWxsb3dlZC5cbiAgICogVXN1YWxseSByZW1vdmVkIGR1ZSB0byBhIG1YU1MgaXNzdWUgaW4galF1ZXJ5IDMuMCAqL1xuICBsZXQgQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSID0gdHJ1ZTtcbiAgLyogT3V0cHV0IHNob3VsZCBiZSBzYWZlIGZvciBjb21tb24gdGVtcGxhdGUgZW5naW5lcy5cbiAgICogVGhpcyBtZWFucywgRE9NUHVyaWZ5IHJlbW92ZXMgZGF0YSBhdHRyaWJ1dGVzLCBtdXN0YWNoZXMgYW5kIEVSQlxuICAgKi9cbiAgbGV0IFNBRkVfRk9SX1RFTVBMQVRFUyA9IGZhbHNlO1xuICAvKiBPdXRwdXQgc2hvdWxkIGJlIHNhZmUgZXZlbiBmb3IgWE1MIHVzZWQgd2l0aGluIEhUTUwgYW5kIGFsaWtlLlxuICAgKiBUaGlzIG1lYW5zLCBET01QdXJpZnkgcmVtb3ZlcyBjb21tZW50cyB3aGVuIGNvbnRhaW5pbmcgcmlza3kgY29udGVudC5cbiAgICovXG4gIGxldCBTQUZFX0ZPUl9YTUwgPSB0cnVlO1xuICAvKiBEZWNpZGUgaWYgZG9jdW1lbnQgd2l0aCA8aHRtbD4uLi4gc2hvdWxkIGJlIHJldHVybmVkICovXG4gIGxldCBXSE9MRV9ET0NVTUVOVCA9IGZhbHNlO1xuICAvKiBUcmFjayB3aGV0aGVyIGNvbmZpZyBpcyBhbHJlYWR5IHNldCBvbiB0aGlzIGluc3RhbmNlIG9mIERPTVB1cmlmeS4gKi9cbiAgbGV0IFNFVF9DT05GSUcgPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIGFsbCBlbGVtZW50cyAoZS5nLiBzdHlsZSwgc2NyaXB0KSBtdXN0IGJlIGNoaWxkcmVuIG9mXG4gICAqIGRvY3VtZW50LmJvZHkuIEJ5IGRlZmF1bHQsIGJyb3dzZXJzIG1pZ2h0IG1vdmUgdGhlbSB0byBkb2N1bWVudC5oZWFkICovXG4gIGxldCBGT1JDRV9CT0RZID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBhIERPTSBgSFRNTEJvZHlFbGVtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAqIHN0cmluZyAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKS5cbiAgICogSWYgYFdIT0xFX0RPQ1VNRU5UYCBpcyBlbmFibGVkIGEgYEhUTUxIdG1sRWxlbWVudGAgd2lsbCBiZSByZXR1cm5lZCBpbnN0ZWFkXG4gICAqL1xuICBsZXQgUkVUVVJOX0RPTSA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgYSBET00gYERvY3VtZW50RnJhZ21lbnRgIHNob3VsZCBiZSByZXR1cm5lZCwgaW5zdGVhZCBvZiBhIGh0bWxcbiAgICogc3RyaW5nICAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKSAqL1xuICBsZXQgUkVUVVJOX0RPTV9GUkFHTUVOVCA9IGZhbHNlO1xuICAvKiBUcnkgdG8gcmV0dXJuIGEgVHJ1c3RlZCBUeXBlIG9iamVjdCBpbnN0ZWFkIG9mIGEgc3RyaW5nLCByZXR1cm4gYSBzdHJpbmcgaW5cbiAgICogY2FzZSBUcnVzdGVkIFR5cGVzIGFyZSBub3Qgc3VwcG9ydGVkICAqL1xuICBsZXQgUkVUVVJOX1RSVVNURURfVFlQRSA9IGZhbHNlO1xuICAvKiBPdXRwdXQgc2hvdWxkIGJlIGZyZWUgZnJvbSBET00gY2xvYmJlcmluZyBhdHRhY2tzP1xuICAgKiBUaGlzIHNhbml0aXplcyBtYXJrdXBzIG5hbWVkIHdpdGggY29sbGlkaW5nLCBjbG9iYmVyYWJsZSBidWlsdC1pbiBET00gQVBJcy5cbiAgICovXG4gIGxldCBTQU5JVElaRV9ET00gPSB0cnVlO1xuICAvKiBBY2hpZXZlIGZ1bGwgRE9NIENsb2JiZXJpbmcgcHJvdGVjdGlvbiBieSBpc29sYXRpbmcgdGhlIG5hbWVzcGFjZSBvZiBuYW1lZFxuICAgKiBwcm9wZXJ0aWVzIGFuZCBKUyB2YXJpYWJsZXMsIG1pdGlnYXRpbmcgYXR0YWNrcyB0aGF0IGFidXNlIHRoZSBIVE1ML0RPTSBzcGVjIHJ1bGVzLlxuICAgKlxuICAgKiBIVE1ML0RPTSBzcGVjIHJ1bGVzIHRoYXQgZW5hYmxlIERPTSBDbG9iYmVyaW5nOlxuICAgKiAgIC0gTmFtZWQgQWNjZXNzIG9uIFdpbmRvdyAowqc3LjMuMylcbiAgICogICAtIERPTSBUcmVlIEFjY2Vzc29ycyAowqczLjEuNSlcbiAgICogICAtIEZvcm0gRWxlbWVudCBQYXJlbnQtQ2hpbGQgUmVsYXRpb25zICjCpzQuMTAuMylcbiAgICogICAtIElmcmFtZSBzcmNkb2MgLyBOZXN0ZWQgV2luZG93UHJveGllcyAowqc0LjguNSlcbiAgICogICAtIEhUTUxDb2xsZWN0aW9uICjCpzQuMi4xMC4yKVxuICAgKlxuICAgKiBOYW1lc3BhY2UgaXNvbGF0aW9uIGlzIGltcGxlbWVudGVkIGJ5IHByZWZpeGluZyBgaWRgIGFuZCBgbmFtZWAgYXR0cmlidXRlc1xuICAgKiB3aXRoIGEgY29uc3RhbnQgc3RyaW5nLCBpLmUuLCBgdXNlci1jb250ZW50LWBcbiAgICovXG4gIGxldCBTQU5JVElaRV9OQU1FRF9QUk9QUyA9IGZhbHNlO1xuICBjb25zdCBTQU5JVElaRV9OQU1FRF9QUk9QU19QUkVGSVggPSAndXNlci1jb250ZW50LSc7XG4gIC8qIEtlZXAgZWxlbWVudCBjb250ZW50IHdoZW4gcmVtb3ZpbmcgZWxlbWVudD8gKi9cbiAgbGV0IEtFRVBfQ09OVEVOVCA9IHRydWU7XG4gIC8qIElmIGEgYE5vZGVgIGlzIHBhc3NlZCB0byBzYW5pdGl6ZSgpLCB0aGVuIHBlcmZvcm1zIHNhbml0aXphdGlvbiBpbi1wbGFjZSBpbnN0ZWFkXG4gICAqIG9mIGltcG9ydGluZyBpdCBpbnRvIGEgbmV3IERvY3VtZW50IGFuZCByZXR1cm5pbmcgYSBzYW5pdGl6ZWQgY29weSAqL1xuICBsZXQgSU5fUExBQ0UgPSBmYWxzZTtcbiAgLyogQWxsb3cgdXNhZ2Ugb2YgcHJvZmlsZXMgbGlrZSBodG1sLCBzdmcgYW5kIG1hdGhNbCAqL1xuICBsZXQgVVNFX1BST0ZJTEVTID0ge307XG4gIC8qIFRhZ3MgdG8gaWdub3JlIGNvbnRlbnQgb2Ygd2hlbiBLRUVQX0NPTlRFTlQgaXMgdHJ1ZSAqL1xuICBsZXQgRk9SQklEX0NPTlRFTlRTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9GT1JCSURfQ09OVEVOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCcsICdhdWRpbycsICdjb2xncm91cCcsICdkZXNjJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGVhZCcsICdpZnJhbWUnLCAnbWF0aCcsICdtaScsICdtbicsICdtbycsICdtcycsICdtdGV4dCcsICdub2VtYmVkJywgJ25vZnJhbWVzJywgJ25vc2NyaXB0JywgJ3BsYWludGV4dCcsICdzY3JpcHQnLCAnc3R5bGUnLCAnc3ZnJywgJ3RlbXBsYXRlJywgJ3RoZWFkJywgJ3RpdGxlJywgJ3ZpZGVvJywgJ3htcCddKTtcbiAgLyogVGFncyB0aGF0IGFyZSBzYWZlIGZvciBkYXRhOiBVUklzICovXG4gIGxldCBEQVRBX1VSSV9UQUdTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9EQVRBX1VSSV9UQUdTID0gYWRkVG9TZXQoe30sIFsnYXVkaW8nLCAndmlkZW8nLCAnaW1nJywgJ3NvdXJjZScsICdpbWFnZScsICd0cmFjayddKTtcbiAgLyogQXR0cmlidXRlcyBzYWZlIGZvciB2YWx1ZXMgbGlrZSBcImphdmFzY3JpcHQ6XCIgKi9cbiAgbGV0IFVSSV9TQUZFX0FUVFJJQlVURVMgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMgPSBhZGRUb1NldCh7fSwgWydhbHQnLCAnY2xhc3MnLCAnZm9yJywgJ2lkJywgJ2xhYmVsJywgJ25hbWUnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdyb2xlJywgJ3N1bW1hcnknLCAndGl0bGUnLCAndmFsdWUnLCAnc3R5bGUnLCAneG1sbnMnXSk7XG4gIGNvbnN0IE1BVEhNTF9OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTCc7XG4gIGNvbnN0IFNWR19OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICBjb25zdCBIVE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcbiAgLyogRG9jdW1lbnQgbmFtZXNwYWNlICovXG4gIGxldCBOQU1FU1BBQ0UgPSBIVE1MX05BTUVTUEFDRTtcbiAgbGV0IElTX0VNUFRZX0lOUFVUID0gZmFsc2U7XG4gIC8qIEFsbG93ZWQgWEhUTUwrWE1MIG5hbWVzcGFjZXMgKi9cbiAgbGV0IEFMTE9XRURfTkFNRVNQQUNFUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9OQU1FU1BBQ0VTID0gYWRkVG9TZXQoe30sIFtNQVRITUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFLCBIVE1MX05BTUVTUEFDRV0sIHN0cmluZ1RvU3RyaW5nKTtcbiAgbGV0IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGFkZFRvU2V0KHt9LCBbJ21pJywgJ21vJywgJ21uJywgJ21zJywgJ210ZXh0J10pO1xuICBsZXQgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCddKTtcbiAgLy8gQ2VydGFpbiBlbGVtZW50cyBhcmUgYWxsb3dlZCBpbiBib3RoIFNWRyBhbmQgSFRNTFxuICAvLyBuYW1lc3BhY2UuIFdlIG5lZWQgdG8gc3BlY2lmeSB0aGVtIGV4cGxpY2l0bHlcbiAgLy8gc28gdGhhdCB0aGV5IGRvbid0IGdldCBlcnJvbmVvdXNseSBkZWxldGVkIGZyb21cbiAgLy8gSFRNTCBuYW1lc3BhY2UuXG4gIGNvbnN0IENPTU1PTl9TVkdfQU5EX0hUTUxfRUxFTUVOVFMgPSBhZGRUb1NldCh7fSwgWyd0aXRsZScsICdzdHlsZScsICdmb250JywgJ2EnLCAnc2NyaXB0J10pO1xuICAvKiBQYXJzaW5nIG9mIHN0cmljdCBYSFRNTCBkb2N1bWVudHMgKi9cbiAgbGV0IFBBUlNFUl9NRURJQV9UWVBFID0gbnVsbDtcbiAgY29uc3QgU1VQUE9SVEVEX1BBUlNFUl9NRURJQV9UWVBFUyA9IFsnYXBwbGljYXRpb24veGh0bWwreG1sJywgJ3RleHQvaHRtbCddO1xuICBjb25zdCBERUZBVUxUX1BBUlNFUl9NRURJQV9UWVBFID0gJ3RleHQvaHRtbCc7XG4gIGxldCB0cmFuc2Zvcm1DYXNlRnVuYyA9IG51bGw7XG4gIC8qIEtlZXAgYSByZWZlcmVuY2UgdG8gY29uZmlnIHRvIHBhc3MgdG8gaG9va3MgKi9cbiAgbGV0IENPTkZJRyA9IG51bGw7XG4gIC8qIElkZWFsbHksIGRvIG5vdCB0b3VjaCBhbnl0aGluZyBiZWxvdyB0aGlzIGxpbmUgKi9cbiAgLyogX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyAqL1xuICBjb25zdCBmb3JtRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgY29uc3QgaXNSZWdleE9yRnVuY3Rpb24gPSBmdW5jdGlvbiBpc1JlZ2V4T3JGdW5jdGlvbih0ZXN0VmFsdWUpIHtcbiAgICByZXR1cm4gdGVzdFZhbHVlIGluc3RhbmNlb2YgUmVnRXhwIHx8IHRlc3RWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xuICB9O1xuICAvKipcbiAgICogX3BhcnNlQ29uZmlnXG4gICAqXG4gICAqIEBwYXJhbSBjZmcgb3B0aW9uYWwgY29uZmlnIGxpdGVyYWxcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIGNvbnN0IF9wYXJzZUNvbmZpZyA9IGZ1bmN0aW9uIF9wYXJzZUNvbmZpZygpIHtcbiAgICBsZXQgY2ZnID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBpZiAoQ09ORklHICYmIENPTkZJRyA9PT0gY2ZnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8qIFNoaWVsZCBjb25maWd1cmF0aW9uIG9iamVjdCBmcm9tIHRhbXBlcmluZyAqL1xuICAgIGlmICghY2ZnIHx8IHR5cGVvZiBjZmcgIT09ICdvYmplY3QnKSB7XG4gICAgICBjZmcgPSB7fTtcbiAgICB9XG4gICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gcHJvdG90eXBlIHBvbGx1dGlvbiAqL1xuICAgIGNmZyA9IGNsb25lKGNmZyk7XG4gICAgUEFSU0VSX01FRElBX1RZUEUgPVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1pbmNsdWRlc1xuICAgIFNVUFBPUlRFRF9QQVJTRVJfTUVESUFfVFlQRVMuaW5kZXhPZihjZmcuUEFSU0VSX01FRElBX1RZUEUpID09PSAtMSA/IERFRkFVTFRfUEFSU0VSX01FRElBX1RZUEUgOiBjZmcuUEFSU0VSX01FRElBX1RZUEU7XG4gICAgLy8gSFRNTCB0YWdzIGFuZCBhdHRyaWJ1dGVzIGFyZSBub3QgY2FzZS1zZW5zaXRpdmUsIGNvbnZlcnRpbmcgdG8gbG93ZXJjYXNlLiBLZWVwaW5nIFhIVE1MIGFzIGlzLlxuICAgIHRyYW5zZm9ybUNhc2VGdW5jID0gUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnID8gc3RyaW5nVG9TdHJpbmcgOiBzdHJpbmdUb0xvd2VyQ2FzZTtcbiAgICAvKiBTZXQgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzICovXG4gICAgQUxMT1dFRF9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9UQUdTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9BTExPV0VEX1RBR1M7XG4gICAgQUxMT1dFRF9BVFRSID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9BVFRSJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9BTExPV0VEX0FUVFI7XG4gICAgQUxMT1dFRF9OQU1FU1BBQ0VTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9OQU1FU1BBQ0VTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfTkFNRVNQQUNFUywgc3RyaW5nVG9TdHJpbmcpIDogREVGQVVMVF9BTExPV0VEX05BTUVTUEFDRVM7XG4gICAgVVJJX1NBRkVfQVRUUklCVVRFUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FERF9VUklfU0FGRV9BVFRSJykgPyBhZGRUb1NldChjbG9uZShERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMpLCBjZmcuQUREX1VSSV9TQUZFX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUztcbiAgICBEQVRBX1VSSV9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUREX0RBVEFfVVJJX1RBR1MnKSA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfREFUQV9VUklfVEFHUyksIGNmZy5BRERfREFUQV9VUklfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9EQVRBX1VSSV9UQUdTO1xuICAgIEZPUkJJRF9DT05URU5UUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9DT05URU5UUycpID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfQ09OVEVOVFMsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTO1xuICAgIEZPUkJJRF9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX1RBR1MnKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IGNsb25lKHt9KTtcbiAgICBGT1JCSURfQVRUUiA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9BVFRSJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBjbG9uZSh7fSk7XG4gICAgVVNFX1BST0ZJTEVTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnVVNFX1BST0ZJTEVTJykgPyBjZmcuVVNFX1BST0ZJTEVTIDogZmFsc2U7XG4gICAgQUxMT1dfQVJJQV9BVFRSID0gY2ZnLkFMTE9XX0FSSUFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIEFMTE9XX0RBVEFfQVRUUiA9IGNmZy5BTExPV19EQVRBX0FUVFIgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBBTExPV19VTktOT1dOX1BST1RPQ09MUyA9IGNmZy5BTExPV19VTktOT1dOX1BST1RPQ09MUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIEFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiA9IGNmZy5BTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBTQUZFX0ZPUl9URU1QTEFURVMgPSBjZmcuU0FGRV9GT1JfVEVNUExBVEVTIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgU0FGRV9GT1JfWE1MID0gY2ZnLlNBRkVfRk9SX1hNTCAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIFdIT0xFX0RPQ1VNRU5UID0gY2ZnLldIT0xFX0RPQ1VNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgUkVUVVJOX0RPTSA9IGNmZy5SRVRVUk5fRE9NIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgUkVUVVJOX0RPTV9GUkFHTUVOVCA9IGNmZy5SRVRVUk5fRE9NX0ZSQUdNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgUkVUVVJOX1RSVVNURURfVFlQRSA9IGNmZy5SRVRVUk5fVFJVU1RFRF9UWVBFIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgRk9SQ0VfQk9EWSA9IGNmZy5GT1JDRV9CT0RZIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgU0FOSVRJWkVfRE9NID0gY2ZnLlNBTklUSVpFX0RPTSAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIFNBTklUSVpFX05BTUVEX1BST1BTID0gY2ZnLlNBTklUSVpFX05BTUVEX1BST1BTIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgS0VFUF9DT05URU5UID0gY2ZnLktFRVBfQ09OVEVOVCAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIElOX1BMQUNFID0gY2ZnLklOX1BMQUNFIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgSVNfQUxMT1dFRF9VUkkkMSA9IGNmZy5BTExPV0VEX1VSSV9SRUdFWFAgfHwgSVNfQUxMT1dFRF9VUkk7XG4gICAgTkFNRVNQQUNFID0gY2ZnLk5BTUVTUEFDRSB8fCBIVE1MX05BTUVTUEFDRTtcbiAgICBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgPSBjZmcuTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTIHx8IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUztcbiAgICBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGNmZy5IVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyB8fCBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUztcbiAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORyA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyB8fCB7fTtcbiAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIGlzUmVnZXhPckZ1bmN0aW9uKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2spKSB7XG4gICAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrO1xuICAgIH1cbiAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIGlzUmVnZXhPckZ1bmN0aW9uKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2spKSB7XG4gICAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrO1xuICAgIH1cbiAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIHR5cGVvZiBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzID09PSAnYm9vbGVhbicpIHtcbiAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHM7XG4gICAgfVxuICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgIEFMTE9XX0RBVEFfQVRUUiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgUkVUVVJOX0RPTSA9IHRydWU7XG4gICAgfVxuICAgIC8qIFBhcnNlIHByb2ZpbGUgaW5mbyAqL1xuICAgIGlmIChVU0VfUFJPRklMRVMpIHtcbiAgICAgIEFMTE9XRURfVEFHUyA9IGFkZFRvU2V0KHt9LCB0ZXh0KTtcbiAgICAgIEFMTE9XRURfQVRUUiA9IFtdO1xuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5odG1sID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgaHRtbCQxKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBodG1sKTtcbiAgICAgIH1cbiAgICAgIGlmIChVU0VfUFJPRklMRVMuc3ZnID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnJDEpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHN2Zyk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgIH1cbiAgICAgIGlmIChVU0VfUFJPRklMRVMuc3ZnRmlsdGVycyA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIHN2Z0ZpbHRlcnMpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHN2Zyk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgIH1cbiAgICAgIGlmIChVU0VfUFJPRklMRVMubWF0aE1sID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgbWF0aE1sJDEpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIG1hdGhNbCk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogTWVyZ2UgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzICovXG4gICAgaWYgKGNmZy5BRERfVEFHUykge1xuICAgICAgaWYgKHR5cGVvZiBjZmcuQUREX1RBR1MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgRVhUUkFfRUxFTUVOVF9IQU5ETElORy50YWdDaGVjayA9IGNmZy5BRERfVEFHUztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChBTExPV0VEX1RBR1MgPT09IERFRkFVTFRfQUxMT1dFRF9UQUdTKSB7XG4gICAgICAgICAgQUxMT1dFRF9UQUdTID0gY2xvbmUoQUxMT1dFRF9UQUdTKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGNmZy5BRERfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2ZnLkFERF9BVFRSKSB7XG4gICAgICBpZiAodHlwZW9mIGNmZy5BRERfQVRUUiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZUNoZWNrID0gY2ZnLkFERF9BVFRSO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKEFMTE9XRURfQVRUUiA9PT0gREVGQVVMVF9BTExPV0VEX0FUVFIpIHtcbiAgICAgICAgICBBTExPV0VEX0FUVFIgPSBjbG9uZShBTExPV0VEX0FUVFIpO1xuICAgICAgICB9XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgY2ZnLkFERF9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjZmcuQUREX1VSSV9TQUZFX0FUVFIpIHtcbiAgICAgIGFkZFRvU2V0KFVSSV9TQUZFX0FUVFJJQlVURVMsIGNmZy5BRERfVVJJX1NBRkVfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY2ZnLkZPUkJJRF9DT05URU5UUykge1xuICAgICAgaWYgKEZPUkJJRF9DT05URU5UUyA9PT0gREVGQVVMVF9GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgICAgRk9SQklEX0NPTlRFTlRTID0gY2xvbmUoRk9SQklEX0NPTlRFTlRTKTtcbiAgICAgIH1cbiAgICAgIGFkZFRvU2V0KEZPUkJJRF9DT05URU5UUywgY2ZnLkZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY2ZnLkFERF9GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgIGlmIChGT1JCSURfQ09OVEVOVFMgPT09IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICAgIEZPUkJJRF9DT05URU5UUyA9IGNsb25lKEZPUkJJRF9DT05URU5UUyk7XG4gICAgICB9XG4gICAgICBhZGRUb1NldChGT1JCSURfQ09OVEVOVFMsIGNmZy5BRERfRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgfVxuICAgIC8qIEFkZCAjdGV4dCBpbiBjYXNlIEtFRVBfQ09OVEVOVCBpcyBzZXQgdG8gdHJ1ZSAqL1xuICAgIGlmIChLRUVQX0NPTlRFTlQpIHtcbiAgICAgIEFMTE9XRURfVEFHU1snI3RleHQnXSA9IHRydWU7XG4gICAgfVxuICAgIC8qIEFkZCBodG1sLCBoZWFkIGFuZCBib2R5IHRvIEFMTE9XRURfVEFHUyBpbiBjYXNlIFdIT0xFX0RPQ1VNRU5UIGlzIHRydWUgKi9cbiAgICBpZiAoV0hPTEVfRE9DVU1FTlQpIHtcbiAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWydodG1sJywgJ2hlYWQnLCAnYm9keSddKTtcbiAgICB9XG4gICAgLyogQWRkIHRib2R5IHRvIEFMTE9XRURfVEFHUyBpbiBjYXNlIHRhYmxlcyBhcmUgcGVybWl0dGVkLCBzZWUgIzI4NiwgIzM2NSAqL1xuICAgIGlmIChBTExPV0VEX1RBR1MudGFibGUpIHtcbiAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWyd0Ym9keSddKTtcbiAgICAgIGRlbGV0ZSBGT1JCSURfVEFHUy50Ym9keTtcbiAgICB9XG4gICAgaWYgKGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWSkge1xuICAgICAgaWYgKHR5cGVvZiBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1kuY3JlYXRlSFRNTCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ1RSVVNURURfVFlQRVNfUE9MSUNZIGNvbmZpZ3VyYXRpb24gb3B0aW9uIG11c3QgcHJvdmlkZSBhIFwiY3JlYXRlSFRNTFwiIGhvb2suJyk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWS5jcmVhdGVTY3JpcHRVUkwgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdUUlVTVEVEX1RZUEVTX1BPTElDWSBjb25maWd1cmF0aW9uIG9wdGlvbiBtdXN0IHByb3ZpZGUgYSBcImNyZWF0ZVNjcmlwdFVSTFwiIGhvb2suJyk7XG4gICAgICB9XG4gICAgICAvLyBPdmVyd3JpdGUgZXhpc3RpbmcgVHJ1c3RlZFR5cGVzIHBvbGljeS5cbiAgICAgIHRydXN0ZWRUeXBlc1BvbGljeSA9IGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWTtcbiAgICAgIC8vIFNpZ24gbG9jYWwgdmFyaWFibGVzIHJlcXVpcmVkIGJ5IGBzYW5pdGl6ZWAuXG4gICAgICBlbXB0eUhUTUwgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCgnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVuaW5pdGlhbGl6ZWQgcG9saWN5LCBhdHRlbXB0IHRvIGluaXRpYWxpemUgdGhlIGludGVybmFsIGRvbXB1cmlmeSBwb2xpY3kuXG4gICAgICBpZiAodHJ1c3RlZFR5cGVzUG9saWN5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHJ1c3RlZFR5cGVzUG9saWN5ID0gX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSh0cnVzdGVkVHlwZXMsIGN1cnJlbnRTY3JpcHQpO1xuICAgICAgfVxuICAgICAgLy8gSWYgY3JlYXRpbmcgdGhlIGludGVybmFsIHBvbGljeSBzdWNjZWVkZWQgc2lnbiBpbnRlcm5hbCB2YXJpYWJsZXMuXG4gICAgICBpZiAodHJ1c3RlZFR5cGVzUG9saWN5ICE9PSBudWxsICYmIHR5cGVvZiBlbXB0eUhUTUwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKCcnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUHJldmVudCBmdXJ0aGVyIG1hbmlwdWxhdGlvbiBvZiBjb25maWd1cmF0aW9uLlxuICAgIC8vIE5vdCBhdmFpbGFibGUgaW4gSUU4LCBTYWZhcmkgNSwgZXRjLlxuICAgIGlmIChmcmVlemUpIHtcbiAgICAgIGZyZWV6ZShjZmcpO1xuICAgIH1cbiAgICBDT05GSUcgPSBjZmc7XG4gIH07XG4gIC8qIEtlZXAgdHJhY2sgb2YgYWxsIHBvc3NpYmxlIFNWRyBhbmQgTWF0aE1MIHRhZ3NcbiAgICogc28gdGhhdCB3ZSBjYW4gcGVyZm9ybSB0aGUgbmFtZXNwYWNlIGNoZWNrc1xuICAgKiBjb3JyZWN0bHkuICovXG4gIGNvbnN0IEFMTF9TVkdfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4uc3ZnJDEsIC4uLnN2Z0ZpbHRlcnMsIC4uLnN2Z0Rpc2FsbG93ZWRdKTtcbiAgY29uc3QgQUxMX01BVEhNTF9UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5tYXRoTWwkMSwgLi4ubWF0aE1sRGlzYWxsb3dlZF0pO1xuICAvKipcbiAgICogQHBhcmFtIGVsZW1lbnQgYSBET00gZWxlbWVudCB3aG9zZSBuYW1lc3BhY2UgaXMgYmVpbmcgY2hlY2tlZFxuICAgKiBAcmV0dXJucyBSZXR1cm4gZmFsc2UgaWYgdGhlIGVsZW1lbnQgaGFzIGFcbiAgICogIG5hbWVzcGFjZSB0aGF0IGEgc3BlYy1jb21wbGlhbnQgcGFyc2VyIHdvdWxkIG5ldmVyXG4gICAqICByZXR1cm4uIFJldHVybiB0cnVlIG90aGVyd2lzZS5cbiAgICovXG4gIGNvbnN0IF9jaGVja1ZhbGlkTmFtZXNwYWNlID0gZnVuY3Rpb24gX2NoZWNrVmFsaWROYW1lc3BhY2UoZWxlbWVudCkge1xuICAgIGxldCBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKGVsZW1lbnQpO1xuICAgIC8vIEluIEpTRE9NLCBpZiB3ZSdyZSBpbnNpZGUgc2hhZG93IERPTSwgdGhlbiBwYXJlbnROb2RlXG4gICAgLy8gY2FuIGJlIG51bGwuIFdlIGp1c3Qgc2ltdWxhdGUgcGFyZW50IGluIHRoaXMgY2FzZS5cbiAgICBpZiAoIXBhcmVudCB8fCAhcGFyZW50LnRhZ05hbWUpIHtcbiAgICAgIHBhcmVudCA9IHtcbiAgICAgICAgbmFtZXNwYWNlVVJJOiBOQU1FU1BBQ0UsXG4gICAgICAgIHRhZ05hbWU6ICd0ZW1wbGF0ZSdcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHRhZ05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShlbGVtZW50LnRhZ05hbWUpO1xuICAgIGNvbnN0IHBhcmVudFRhZ05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShwYXJlbnQudGFnTmFtZSk7XG4gICAgaWYgKCFBTExPV0VEX05BTUVTUEFDRVNbZWxlbWVudC5uYW1lc3BhY2VVUkldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSkge1xuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIEhUTUwgbmFtZXNwYWNlIHRvIFNWR1xuICAgICAgLy8gaXMgdmlhIDxzdmc+LiBJZiBpdCBoYXBwZW5zIHZpYSBhbnkgb3RoZXIgdGFnLCB0aGVuXG4gICAgICAvLyBpdCBzaG91bGQgYmUga2lsbGVkLlxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnc3ZnJztcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBNYXRoTUwgdG8gU1ZHIGlzIHZpYWBcbiAgICAgIC8vIHN2ZyBpZiBwYXJlbnQgaXMgZWl0aGVyIDxhbm5vdGF0aW9uLXhtbD4gb3IgTWF0aE1MXG4gICAgICAvLyB0ZXh0IGludGVncmF0aW9uIHBvaW50cy5cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnc3ZnJyAmJiAocGFyZW50VGFnTmFtZSA9PT0gJ2Fubm90YXRpb24teG1sJyB8fCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pO1xuICAgICAgfVxuICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIFNWR1xuICAgICAgLy8gc3BlYy4gQWxsIG90aGVycyBhcmUgZGlzYWxsb3dlZCBpbiBTVkcgbmFtZXNwYWNlLlxuICAgICAgcmV0dXJuIEJvb2xlYW4oQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gTWF0aE1MXG4gICAgICAvLyBpcyB2aWEgPG1hdGg+LiBJZiBpdCBoYXBwZW5zIHZpYSBhbnkgb3RoZXIgdGFnLCB0aGVuXG4gICAgICAvLyBpdCBzaG91bGQgYmUga2lsbGVkLlxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnbWF0aCc7XG4gICAgICB9XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gU1ZHIHRvIE1hdGhNTCBpcyB2aWFcbiAgICAgIC8vIDxtYXRoPiBhbmQgSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnbWF0aCcgJiYgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV07XG4gICAgICB9XG4gICAgICAvLyBXZSBvbmx5IGFsbG93IGVsZW1lbnRzIHRoYXQgYXJlIGRlZmluZWQgaW4gTWF0aE1MXG4gICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIE1hdGhNTCBuYW1lc3BhY2UuXG4gICAgICByZXR1cm4gQm9vbGVhbihBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0pO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gU1ZHIHRvIEhUTUwgaXMgdmlhXG4gICAgICAvLyBIVE1MIGludGVncmF0aW9uIHBvaW50cywgYW5kIGZyb20gTWF0aE1MIHRvIEhUTUxcbiAgICAgIC8vIGlzIHZpYSBNYXRoTUwgdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFICYmICFIVE1MX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSAmJiAhTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGRpc2FsbG93IHRhZ3MgdGhhdCBhcmUgc3BlY2lmaWMgZm9yIE1hdGhNTFxuICAgICAgLy8gb3IgU1ZHIGFuZCBzaG91bGQgbmV2ZXIgYXBwZWFyIGluIEhUTUwgbmFtZXNwYWNlXG4gICAgICByZXR1cm4gIUFMTF9NQVRITUxfVEFHU1t0YWdOYW1lXSAmJiAoQ09NTU9OX1NWR19BTkRfSFRNTF9FTEVNRU5UU1t0YWdOYW1lXSB8fCAhQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICB9XG4gICAgLy8gRm9yIFhIVE1MIGFuZCBYTUwgZG9jdW1lbnRzIHRoYXQgc3VwcG9ydCBjdXN0b20gbmFtZXNwYWNlc1xuICAgIGlmIChQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgJiYgQUxMT1dFRF9OQU1FU1BBQ0VTW2VsZW1lbnQubmFtZXNwYWNlVVJJXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIFRoZSBjb2RlIHNob3VsZCBuZXZlciByZWFjaCB0aGlzIHBsYWNlICh0aGlzIG1lYW5zXG4gICAgLy8gdGhhdCB0aGUgZWxlbWVudCBzb21laG93IGdvdCBuYW1lc3BhY2UgdGhhdCBpcyBub3RcbiAgICAvLyBIVE1MLCBTVkcsIE1hdGhNTCBvciBhbGxvd2VkIHZpYSBBTExPV0VEX05BTUVTUEFDRVMpLlxuICAgIC8vIFJldHVybiBmYWxzZSBqdXN0IGluIGNhc2UuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICAvKipcbiAgICogX2ZvcmNlUmVtb3ZlXG4gICAqXG4gICAqIEBwYXJhbSBub2RlIGEgRE9NIG5vZGVcbiAgICovXG4gIGNvbnN0IF9mb3JjZVJlbW92ZSA9IGZ1bmN0aW9uIF9mb3JjZVJlbW92ZShub2RlKSB7XG4gICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICBlbGVtZW50OiBub2RlXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1yZW1vdmVcbiAgICAgIGdldFBhcmVudE5vZGUobm9kZSkucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgcmVtb3ZlKG5vZGUpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIF9yZW1vdmVBdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIG5hbWUgYW4gQXR0cmlidXRlIG5hbWVcbiAgICogQHBhcmFtIGVsZW1lbnQgYSBET00gbm9kZVxuICAgKi9cbiAgY29uc3QgX3JlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgZWxlbWVudCkge1xuICAgIHRyeSB7XG4gICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgYXR0cmlidXRlOiBlbGVtZW50LmdldEF0dHJpYnV0ZU5vZGUobmFtZSksXG4gICAgICAgIGZyb206IGVsZW1lbnRcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgICBhdHRyaWJ1dGU6IG51bGwsXG4gICAgICAgIGZyb206IGVsZW1lbnRcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAvLyBXZSB2b2lkIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIHVucmVtb3ZhYmxlIFwiaXNcIiBhdHRyaWJ1dGVzXG4gICAgaWYgKG5hbWUgPT09ICdpcycpIHtcbiAgICAgIGlmIChSRVRVUk5fRE9NIHx8IFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBfZm9yY2VSZW1vdmUoZWxlbWVudCk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsICcnKTtcbiAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBfaW5pdERvY3VtZW50XG4gICAqXG4gICAqIEBwYXJhbSBkaXJ0eSAtIGEgc3RyaW5nIG9mIGRpcnR5IG1hcmt1cFxuICAgKiBAcmV0dXJuIGEgRE9NLCBmaWxsZWQgd2l0aCB0aGUgZGlydHkgbWFya3VwXG4gICAqL1xuICBjb25zdCBfaW5pdERvY3VtZW50ID0gZnVuY3Rpb24gX2luaXREb2N1bWVudChkaXJ0eSkge1xuICAgIC8qIENyZWF0ZSBhIEhUTUwgZG9jdW1lbnQgKi9cbiAgICBsZXQgZG9jID0gbnVsbDtcbiAgICBsZXQgbGVhZGluZ1doaXRlc3BhY2UgPSBudWxsO1xuICAgIGlmIChGT1JDRV9CT0RZKSB7XG4gICAgICBkaXJ0eSA9ICc8cmVtb3ZlPjwvcmVtb3ZlPicgKyBkaXJ0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgLyogSWYgRk9SQ0VfQk9EWSBpc24ndCB1c2VkLCBsZWFkaW5nIHdoaXRlc3BhY2UgbmVlZHMgdG8gYmUgcHJlc2VydmVkIG1hbnVhbGx5ICovXG4gICAgICBjb25zdCBtYXRjaGVzID0gc3RyaW5nTWF0Y2goZGlydHksIC9eW1xcclxcblxcdCBdKy8pO1xuICAgICAgbGVhZGluZ1doaXRlc3BhY2UgPSBtYXRjaGVzICYmIG1hdGNoZXNbMF07XG4gICAgfVxuICAgIGlmIChQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgJiYgTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgLy8gUm9vdCBvZiBYSFRNTCBkb2MgbXVzdCBjb250YWluIHhtbG5zIGRlY2xhcmF0aW9uIChzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3hodG1sMS9ub3JtYXRpdmUuaHRtbCNzdHJpY3QpXG4gICAgICBkaXJ0eSA9ICc8aHRtbCB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIj48aGVhZD48L2hlYWQ+PGJvZHk+JyArIGRpcnR5ICsgJzwvYm9keT48L2h0bWw+JztcbiAgICB9XG4gICAgY29uc3QgZGlydHlQYXlsb2FkID0gdHJ1c3RlZFR5cGVzUG9saWN5ID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoZGlydHkpIDogZGlydHk7XG4gICAgLypcbiAgICAgKiBVc2UgdGhlIERPTVBhcnNlciBBUEkgYnkgZGVmYXVsdCwgZmFsbGJhY2sgbGF0ZXIgaWYgbmVlZHMgYmVcbiAgICAgKiBET01QYXJzZXIgbm90IHdvcmsgZm9yIHN2ZyB3aGVuIGhhcyBtdWx0aXBsZSByb290IGVsZW1lbnQuXG4gICAgICovXG4gICAgaWYgKE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoZGlydHlQYXlsb2FkLCBQQVJTRVJfTUVESUFfVFlQRSk7XG4gICAgICB9IGNhdGNoIChfKSB7fVxuICAgIH1cbiAgICAvKiBVc2UgY3JlYXRlSFRNTERvY3VtZW50IGluIGNhc2UgRE9NUGFyc2VyIGlzIG5vdCBhdmFpbGFibGUgKi9cbiAgICBpZiAoIWRvYyB8fCAhZG9jLmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgZG9jID0gaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoTkFNRVNQQUNFLCAndGVtcGxhdGUnLCBudWxsKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuaW5uZXJIVE1MID0gSVNfRU1QVFlfSU5QVVQgPyBlbXB0eUhUTUwgOiBkaXJ0eVBheWxvYWQ7XG4gICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIFN5bnRheCBlcnJvciBpZiBkaXJ0eVBheWxvYWQgaXMgaW52YWxpZCB4bWxcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYm9keSA9IGRvYy5ib2R5IHx8IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG4gICAgaWYgKGRpcnR5ICYmIGxlYWRpbmdXaGl0ZXNwYWNlKSB7XG4gICAgICBib2R5Lmluc2VydEJlZm9yZShkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZWFkaW5nV2hpdGVzcGFjZSksIGJvZHkuY2hpbGROb2Rlc1swXSB8fCBudWxsKTtcbiAgICB9XG4gICAgLyogV29yayBvbiB3aG9sZSBkb2N1bWVudCBvciBqdXN0IGl0cyBib2R5ICovXG4gICAgaWYgKE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIHJldHVybiBnZXRFbGVtZW50c0J5VGFnTmFtZS5jYWxsKGRvYywgV0hPTEVfRE9DVU1FTlQgPyAnaHRtbCcgOiAnYm9keScpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gV0hPTEVfRE9DVU1FTlQgPyBkb2MuZG9jdW1lbnRFbGVtZW50IDogYm9keTtcbiAgfTtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBOb2RlSXRlcmF0b3Igb2JqZWN0IHRoYXQgeW91IGNhbiB1c2UgdG8gdHJhdmVyc2UgZmlsdGVyZWQgbGlzdHMgb2Ygbm9kZXMgb3IgZWxlbWVudHMgaW4gYSBkb2N1bWVudC5cbiAgICpcbiAgICogQHBhcmFtIHJvb3QgVGhlIHJvb3QgZWxlbWVudCBvciBub2RlIHRvIHN0YXJ0IHRyYXZlcnNpbmcgb24uXG4gICAqIEByZXR1cm4gVGhlIGNyZWF0ZWQgTm9kZUl0ZXJhdG9yXG4gICAqL1xuICBjb25zdCBfY3JlYXRlTm9kZUl0ZXJhdG9yID0gZnVuY3Rpb24gX2NyZWF0ZU5vZGVJdGVyYXRvcihyb290KSB7XG4gICAgcmV0dXJuIGNyZWF0ZU5vZGVJdGVyYXRvci5jYWxsKHJvb3Qub3duZXJEb2N1bWVudCB8fCByb290LCByb290LFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG4gICAgTm9kZUZpbHRlci5TSE9XX0VMRU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfQ09NTUVOVCB8IE5vZGVGaWx0ZXIuU0hPV19URVhUIHwgTm9kZUZpbHRlci5TSE9XX1BST0NFU1NJTkdfSU5TVFJVQ1RJT04gfCBOb2RlRmlsdGVyLlNIT1dfQ0RBVEFfU0VDVElPTiwgbnVsbCk7XG4gIH07XG4gIC8qKlxuICAgKiBfaXNDbG9iYmVyZWRcbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBjaGVjayBmb3IgY2xvYmJlcmluZyBhdHRhY2tzXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiBjbG9iYmVyZWQsIGZhbHNlIGlmIHNhZmVcbiAgICovXG4gIGNvbnN0IF9pc0Nsb2JiZXJlZCA9IGZ1bmN0aW9uIF9pc0Nsb2JiZXJlZChlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQgJiYgKHR5cGVvZiBlbGVtZW50Lm5vZGVOYW1lICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudC50ZXh0Q29udGVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQucmVtb3ZlQ2hpbGQgIT09ICdmdW5jdGlvbicgfHwgIShlbGVtZW50LmF0dHJpYnV0ZXMgaW5zdGFuY2VvZiBOYW1lZE5vZGVNYXApIHx8IHR5cGVvZiBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgZWxlbWVudC5zZXRBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQubmFtZXNwYWNlVVJJICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudC5pbnNlcnRCZWZvcmUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQuaGFzQ2hpbGROb2RlcyAhPT0gJ2Z1bmN0aW9uJyk7XG4gIH07XG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBvYmplY3QgdG8gY2hlY2sgd2hldGhlciBpdCdzIGEgRE9NIG5vZGVcbiAgICogQHJldHVybiB0cnVlIGlzIG9iamVjdCBpcyBhIERPTSBub2RlXG4gICAqL1xuICBjb25zdCBfaXNOb2RlID0gZnVuY3Rpb24gX2lzTm9kZSh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgTm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIE5vZGU7XG4gIH07XG4gIGZ1bmN0aW9uIF9leGVjdXRlSG9va3MoaG9va3MsIGN1cnJlbnROb2RlLCBkYXRhKSB7XG4gICAgYXJyYXlGb3JFYWNoKGhvb2tzLCBob29rID0+IHtcbiAgICAgIGhvb2suY2FsbChET01QdXJpZnksIGN1cnJlbnROb2RlLCBkYXRhLCBDT05GSUcpO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBfc2FuaXRpemVFbGVtZW50c1xuICAgKlxuICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgKiBAcHJvdGVjdCB0ZXh0Q29udGVudFxuICAgKiBAcHJvdGVjdCByZW1vdmVDaGlsZFxuICAgKiBAcGFyYW0gY3VycmVudE5vZGUgdG8gY2hlY2sgZm9yIHBlcm1pc3Npb24gdG8gZXhpc3RcbiAgICogQHJldHVybiB0cnVlIGlmIG5vZGUgd2FzIGtpbGxlZCwgZmFsc2UgaWYgbGVmdCBhbGl2ZVxuICAgKi9cbiAgY29uc3QgX3Nhbml0aXplRWxlbWVudHMgPSBmdW5jdGlvbiBfc2FuaXRpemVFbGVtZW50cyhjdXJyZW50Tm9kZSkge1xuICAgIGxldCBjb250ZW50ID0gbnVsbDtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZUVsZW1lbnRzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgLyogQ2hlY2sgaWYgZWxlbWVudCBpcyBjbG9iYmVyZWQgb3IgY2FuIGNsb2JiZXIgKi9cbiAgICBpZiAoX2lzQ2xvYmJlcmVkKGN1cnJlbnROb2RlKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBOb3cgbGV0J3MgY2hlY2sgdGhlIGVsZW1lbnQncyB0eXBlIGFuZCBuYW1lICovXG4gICAgY29uc3QgdGFnTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKGN1cnJlbnROb2RlLm5vZGVOYW1lKTtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVFbGVtZW50LCBjdXJyZW50Tm9kZSwge1xuICAgICAgdGFnTmFtZSxcbiAgICAgIGFsbG93ZWRUYWdzOiBBTExPV0VEX1RBR1NcbiAgICB9KTtcbiAgICAvKiBEZXRlY3QgbVhTUyBhdHRlbXB0cyBhYnVzaW5nIG5hbWVzcGFjZSBjb25mdXNpb24gKi9cbiAgICBpZiAoU0FGRV9GT1JfWE1MICYmIGN1cnJlbnROb2RlLmhhc0NoaWxkTm9kZXMoKSAmJiAhX2lzTm9kZShjdXJyZW50Tm9kZS5maXJzdEVsZW1lbnRDaGlsZCkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3IV0vZywgY3VycmVudE5vZGUuaW5uZXJIVE1MKSAmJiByZWdFeHBUZXN0KC88Wy9cXHchXS9nLCBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogUmVtb3ZlIGFueSBvY2N1cnJlbmNlIG9mIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb25zICovXG4gICAgaWYgKGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUucHJvZ3Jlc3NpbmdJbnN0cnVjdGlvbikge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBSZW1vdmUgYW55IGtpbmQgb2YgcG9zc2libHkgaGFybWZ1bCBjb21tZW50cyAqL1xuICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5jb21tZW50ICYmIHJlZ0V4cFRlc3QoLzxbL1xcd10vZywgY3VycmVudE5vZGUuZGF0YSkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogUmVtb3ZlIGVsZW1lbnQgaWYgYW55dGhpbmcgZm9yYmlkcyBpdHMgcHJlc2VuY2UgKi9cbiAgICBpZiAoIShFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLnRhZ0NoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgRVhUUkFfRUxFTUVOVF9IQU5ETElORy50YWdDaGVjayh0YWdOYW1lKSkgJiYgKCFBTExPV0VEX1RBR1NbdGFnTmFtZV0gfHwgRk9SQklEX1RBR1NbdGFnTmFtZV0pKSB7XG4gICAgICAvKiBDaGVjayBpZiB3ZSBoYXZlIGEgY3VzdG9tIGVsZW1lbnQgdG8gaGFuZGxlICovXG4gICAgICBpZiAoIUZPUkJJRF9UQUdTW3RhZ05hbWVdICYmIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCh0YWdOYW1lKSkge1xuICAgICAgICBpZiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLCB0YWdOYW1lKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKHRhZ05hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvKiBLZWVwIGNvbnRlbnQgZXhjZXB0IGZvciBiYWQtbGlzdGVkIGVsZW1lbnRzICovXG4gICAgICBpZiAoS0VFUF9DT05URU5UICYmICFGT1JCSURfQ09OVEVOVFNbdGFnTmFtZV0pIHtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGdldFBhcmVudE5vZGUoY3VycmVudE5vZGUpIHx8IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBnZXRDaGlsZE5vZGVzKGN1cnJlbnROb2RlKSB8fCBjdXJyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICBpZiAoY2hpbGROb2RlcyAmJiBwYXJlbnROb2RlKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRDb3VudCA9IGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgICAgICAgIGZvciAobGV0IGkgPSBjaGlsZENvdW50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkQ2xvbmUgPSBjbG9uZU5vZGUoY2hpbGROb2Rlc1tpXSwgdHJ1ZSk7XG4gICAgICAgICAgICBjaGlsZENsb25lLl9fcmVtb3ZhbENvdW50ID0gKGN1cnJlbnROb2RlLl9fcmVtb3ZhbENvdW50IHx8IDApICsgMTtcbiAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNoaWxkQ2xvbmUsIGdldE5leHRTaWJsaW5nKGN1cnJlbnROb2RlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIENoZWNrIHdoZXRoZXIgZWxlbWVudCBoYXMgYSB2YWxpZCBuYW1lc3BhY2UgKi9cbiAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50ICYmICFfY2hlY2tWYWxpZE5hbWVzcGFjZShjdXJyZW50Tm9kZSkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogTWFrZSBzdXJlIHRoYXQgb2xkZXIgYnJvd3NlcnMgZG9uJ3QgZ2V0IGZhbGxiYWNrLXRhZyBtWFNTICovXG4gICAgaWYgKCh0YWdOYW1lID09PSAnbm9zY3JpcHQnIHx8IHRhZ05hbWUgPT09ICdub2VtYmVkJyB8fCB0YWdOYW1lID09PSAnbm9mcmFtZXMnKSAmJiByZWdFeHBUZXN0KC88XFwvbm8oc2NyaXB0fGVtYmVkfGZyYW1lcykvaSwgY3VycmVudE5vZGUuaW5uZXJIVE1MKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBTYW5pdGl6ZSBlbGVtZW50IGNvbnRlbnQgdG8gYmUgdGVtcGxhdGUtc2FmZSAqL1xuICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS50ZXh0KSB7XG4gICAgICAvKiBHZXQgdGhlIGVsZW1lbnQncyB0ZXh0IGNvbnRlbnQgKi9cbiAgICAgIGNvbnRlbnQgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudDtcbiAgICAgIGFycmF5Rm9yRWFjaChbTVVTVEFDSEVfRVhQUiwgRVJCX0VYUFIsIFRNUExJVF9FWFBSXSwgZXhwciA9PiB7XG4gICAgICAgIGNvbnRlbnQgPSBzdHJpbmdSZXBsYWNlKGNvbnRlbnQsIGV4cHIsICcgJyk7XG4gICAgICB9KTtcbiAgICAgIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudCAhPT0gY29udGVudCkge1xuICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICBlbGVtZW50OiBjdXJyZW50Tm9kZS5jbG9uZU5vZGUoKVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudE5vZGUudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplRWxlbWVudHMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIC8qKlxuICAgKiBfaXNWYWxpZEF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcGFyYW0gbGNUYWcgTG93ZXJjYXNlIHRhZyBuYW1lIG9mIGNvbnRhaW5pbmcgZWxlbWVudC5cbiAgICogQHBhcmFtIGxjTmFtZSBMb3dlcmNhc2UgYXR0cmlidXRlIG5hbWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBBdHRyaWJ1dGUgdmFsdWUuXG4gICAqIEByZXR1cm4gUmV0dXJucyB0cnVlIGlmIGB2YWx1ZWAgaXMgdmFsaWQsIG90aGVyd2lzZSBmYWxzZS5cbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIGNvbnN0IF9pc1ZhbGlkQXR0cmlidXRlID0gZnVuY3Rpb24gX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpIHtcbiAgICAvKiBNYWtlIHN1cmUgYXR0cmlidXRlIGNhbm5vdCBjbG9iYmVyICovXG4gICAgaWYgKFNBTklUSVpFX0RPTSAmJiAobGNOYW1lID09PSAnaWQnIHx8IGxjTmFtZSA9PT0gJ25hbWUnKSAmJiAodmFsdWUgaW4gZG9jdW1lbnQgfHwgdmFsdWUgaW4gZm9ybUVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qIEFsbG93IHZhbGlkIGRhdGEtKiBhdHRyaWJ1dGVzOiBBdCBsZWFzdCBvbmUgY2hhcmFjdGVyIGFmdGVyIFwiLVwiXG4gICAgICAgIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9kb20uaHRtbCNlbWJlZGRpbmctY3VzdG9tLW5vbi12aXNpYmxlLWRhdGEtd2l0aC10aGUtZGF0YS0qLWF0dHJpYnV0ZXMpXG4gICAgICAgIFhNTC1jb21wYXRpYmxlIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmZyYXN0cnVjdHVyZS5odG1sI3htbC1jb21wYXRpYmxlIGFuZCBodHRwOi8vd3d3LnczLm9yZy9UUi94bWwvI2QwZTgwNClcbiAgICAgICAgV2UgZG9uJ3QgbmVlZCB0byBjaGVjayB0aGUgdmFsdWU7IGl0J3MgYWx3YXlzIFVSSSBzYWZlLiAqL1xuICAgIGlmIChBTExPV19EQVRBX0FUVFIgJiYgIUZPUkJJRF9BVFRSW2xjTmFtZV0gJiYgcmVnRXhwVGVzdChEQVRBX0FUVFIsIGxjTmFtZSkpIDsgZWxzZSBpZiAoQUxMT1dfQVJJQV9BVFRSICYmIHJlZ0V4cFRlc3QoQVJJQV9BVFRSLCBsY05hbWUpKSA7IGVsc2UgaWYgKEVYVFJBX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZUNoZWNrKGxjTmFtZSwgbGNUYWcpKSA7IGVsc2UgaWYgKCFBTExPV0VEX0FUVFJbbGNOYW1lXSB8fCBGT1JCSURfQVRUUltsY05hbWVdKSB7XG4gICAgICBpZiAoXG4gICAgICAvLyBGaXJzdCBjb25kaXRpb24gZG9lcyBhIHZlcnkgYmFzaWMgY2hlY2sgaWYgYSkgaXQncyBiYXNpY2FsbHkgYSB2YWxpZCBjdXN0b20gZWxlbWVudCB0YWduYW1lIEFORFxuICAgICAgLy8gYikgaWYgdGhlIHRhZ05hbWUgcGFzc2VzIHdoYXRldmVyIHRoZSB1c2VyIGhhcyBjb25maWd1cmVkIGZvciBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2tcbiAgICAgIC8vIGFuZCBjKSBpZiB0aGUgYXR0cmlidXRlIG5hbWUgcGFzc2VzIHdoYXRldmVyIHRoZSB1c2VyIGhhcyBjb25maWd1cmVkIGZvciBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2tcbiAgICAgIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudChsY1RhZykgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgbGNUYWcpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayhsY1RhZykpICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2ssIGxjTmFtZSkgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrKGxjTmFtZSwgbGNUYWcpKSB8fFxuICAgICAgLy8gQWx0ZXJuYXRpdmUsIHNlY29uZCBjb25kaXRpb24gY2hlY2tzIGlmIGl0J3MgYW4gYGlzYC1hdHRyaWJ1dGUsIEFORFxuICAgICAgLy8gdGhlIHZhbHVlIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrXG4gICAgICBsY05hbWUgPT09ICdpcycgJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIHZhbHVlKSB8fCBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sodmFsdWUpKSkgOyBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLyogQ2hlY2sgdmFsdWUgaXMgc2FmZS4gRmlyc3QsIGlzIGF0dHIgaW5lcnQ/IElmIHNvLCBpcyBzYWZlICovXG4gICAgfSBlbHNlIGlmIChVUklfU0FGRV9BVFRSSUJVVEVTW2xjTmFtZV0pIDsgZWxzZSBpZiAocmVnRXhwVGVzdChJU19BTExPV0VEX1VSSSQxLCBzdHJpbmdSZXBsYWNlKHZhbHVlLCBBVFRSX1dISVRFU1BBQ0UsICcnKSkpIDsgZWxzZSBpZiAoKGxjTmFtZSA9PT0gJ3NyYycgfHwgbGNOYW1lID09PSAneGxpbms6aHJlZicgfHwgbGNOYW1lID09PSAnaHJlZicpICYmIGxjVGFnICE9PSAnc2NyaXB0JyAmJiBzdHJpbmdJbmRleE9mKHZhbHVlLCAnZGF0YTonKSA9PT0gMCAmJiBEQVRBX1VSSV9UQUdTW2xjVGFnXSkgOyBlbHNlIGlmIChBTExPV19VTktOT1dOX1BST1RPQ09MUyAmJiAhcmVnRXhwVGVzdChJU19TQ1JJUFRfT1JfREFUQSwgc3RyaW5nUmVwbGFjZSh2YWx1ZSwgQVRUUl9XSElURVNQQUNFLCAnJykpKSA7IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgLyoqXG4gICAqIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudFxuICAgKiBjaGVja3MgaWYgYXQgbGVhc3Qgb25lIGRhc2ggaXMgaW5jbHVkZWQgaW4gdGFnTmFtZSwgYW5kIGl0J3Mgbm90IHRoZSBmaXJzdCBjaGFyXG4gICAqIGZvciBtb3JlIHNvcGhpc3RpY2F0ZWQgY2hlY2tpbmcgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvdmFsaWRhdGUtZWxlbWVudC1uYW1lXG4gICAqXG4gICAqIEBwYXJhbSB0YWdOYW1lIG5hbWUgb2YgdGhlIHRhZyBvZiB0aGUgbm9kZSB0byBzYW5pdGl6ZVxuICAgKiBAcmV0dXJucyBSZXR1cm5zIHRydWUgaWYgdGhlIHRhZyBuYW1lIG1lZXRzIHRoZSBiYXNpYyBjcml0ZXJpYSBmb3IgYSBjdXN0b20gZWxlbWVudCwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgKi9cbiAgY29uc3QgX2lzQmFzaWNDdXN0b21FbGVtZW50ID0gZnVuY3Rpb24gX2lzQmFzaWNDdXN0b21FbGVtZW50KHRhZ05hbWUpIHtcbiAgICByZXR1cm4gdGFnTmFtZSAhPT0gJ2Fubm90YXRpb24teG1sJyAmJiBzdHJpbmdNYXRjaCh0YWdOYW1lLCBDVVNUT01fRUxFTUVOVCk7XG4gIH07XG4gIC8qKlxuICAgKiBfc2FuaXRpemVBdHRyaWJ1dGVzXG4gICAqXG4gICAqIEBwcm90ZWN0IGF0dHJpYnV0ZXNcbiAgICogQHByb3RlY3Qgbm9kZU5hbWVcbiAgICogQHByb3RlY3QgcmVtb3ZlQXR0cmlidXRlXG4gICAqIEBwcm90ZWN0IHNldEF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcGFyYW0gY3VycmVudE5vZGUgdG8gc2FuaXRpemVcbiAgICovXG4gIGNvbnN0IF9zYW5pdGl6ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbiBfc2FuaXRpemVBdHRyaWJ1dGVzKGN1cnJlbnROb2RlKSB7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgY29uc3Qge1xuICAgICAgYXR0cmlidXRlc1xuICAgIH0gPSBjdXJyZW50Tm9kZTtcbiAgICAvKiBDaGVjayBpZiB3ZSBoYXZlIGF0dHJpYnV0ZXM7IGlmIG5vdCB3ZSBtaWdodCBoYXZlIGEgdGV4dCBub2RlICovXG4gICAgaWYgKCFhdHRyaWJ1dGVzIHx8IF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaG9va0V2ZW50ID0ge1xuICAgICAgYXR0ck5hbWU6ICcnLFxuICAgICAgYXR0clZhbHVlOiAnJyxcbiAgICAgIGtlZXBBdHRyOiB0cnVlLFxuICAgICAgYWxsb3dlZEF0dHJpYnV0ZXM6IEFMTE9XRURfQVRUUixcbiAgICAgIGZvcmNlS2VlcEF0dHI6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgbGV0IGwgPSBhdHRyaWJ1dGVzLmxlbmd0aDtcbiAgICAvKiBHbyBiYWNrd2FyZHMgb3ZlciBhbGwgYXR0cmlidXRlczsgc2FmZWx5IHJlbW92ZSBiYWQgb25lcyAqL1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBhdHRyaWJ1dGVzW2xdO1xuICAgICAgY29uc3Qge1xuICAgICAgICBuYW1lLFxuICAgICAgICBuYW1lc3BhY2VVUkksXG4gICAgICAgIHZhbHVlOiBhdHRyVmFsdWVcbiAgICAgIH0gPSBhdHRyO1xuICAgICAgY29uc3QgbGNOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMobmFtZSk7XG4gICAgICBjb25zdCBpbml0VmFsdWUgPSBhdHRyVmFsdWU7XG4gICAgICBsZXQgdmFsdWUgPSBuYW1lID09PSAndmFsdWUnID8gaW5pdFZhbHVlIDogc3RyaW5nVHJpbShpbml0VmFsdWUpO1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgaG9va0V2ZW50LmF0dHJOYW1lID0gbGNOYW1lO1xuICAgICAgaG9va0V2ZW50LmF0dHJWYWx1ZSA9IHZhbHVlO1xuICAgICAgaG9va0V2ZW50LmtlZXBBdHRyID0gdHJ1ZTtcbiAgICAgIGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyID0gdW5kZWZpbmVkOyAvLyBBbGxvd3MgZGV2ZWxvcGVycyB0byBzZWUgdGhpcyBpcyBhIHByb3BlcnR5IHRoZXkgY2FuIHNldFxuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVBdHRyaWJ1dGUsIGN1cnJlbnROb2RlLCBob29rRXZlbnQpO1xuICAgICAgdmFsdWUgPSBob29rRXZlbnQuYXR0clZhbHVlO1xuICAgICAgLyogRnVsbCBET00gQ2xvYmJlcmluZyBwcm90ZWN0aW9uIHZpYSBuYW1lc3BhY2UgaXNvbGF0aW9uLFxuICAgICAgICogUHJlZml4IGlkIGFuZCBuYW1lIGF0dHJpYnV0ZXMgd2l0aCBgdXNlci1jb250ZW50LWBcbiAgICAgICAqL1xuICAgICAgaWYgKFNBTklUSVpFX05BTUVEX1BST1BTICYmIChsY05hbWUgPT09ICdpZCcgfHwgbGNOYW1lID09PSAnbmFtZScpKSB7XG4gICAgICAgIC8vIFJlbW92ZSB0aGUgYXR0cmlidXRlIHdpdGggdGhpcyB2YWx1ZVxuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgLy8gUHJlZml4IHRoZSB2YWx1ZSBhbmQgbGF0ZXIgcmUtY3JlYXRlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc2FuaXRpemVkIHZhbHVlXG4gICAgICAgIHZhbHVlID0gU0FOSVRJWkVfTkFNRURfUFJPUFNfUFJFRklYICsgdmFsdWU7XG4gICAgICB9XG4gICAgICAvKiBXb3JrIGFyb3VuZCBhIHNlY3VyaXR5IGlzc3VlIHdpdGggY29tbWVudHMgaW5zaWRlIGF0dHJpYnV0ZXMgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgcmVnRXhwVGVzdCgvKCgtLSE/fF0pPil8PFxcLyhzdHlsZXx0aXRsZXx0ZXh0YXJlYSkvaSwgdmFsdWUpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIE1ha2Ugc3VyZSB3ZSBjYW5ub3QgZWFzaWx5IHVzZSBhbmltYXRlZCBocmVmcywgZXZlbiBpZiBhbmltYXRpb25zIGFyZSBhbGxvd2VkICovXG4gICAgICBpZiAobGNOYW1lID09PSAnYXR0cmlidXRlbmFtZScgJiYgc3RyaW5nTWF0Y2godmFsdWUsICdocmVmJykpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogRGlkIHRoZSBob29rcyBhcHByb3ZlIG9mIHRoZSBhdHRyaWJ1dGU/ICovXG4gICAgICBpZiAoaG9va0V2ZW50LmZvcmNlS2VlcEF0dHIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBEaWQgdGhlIGhvb2tzIGFwcHJvdmUgb2YgdGhlIGF0dHJpYnV0ZT8gKi9cbiAgICAgIGlmICghaG9va0V2ZW50LmtlZXBBdHRyKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIFdvcmsgYXJvdW5kIGEgc2VjdXJpdHkgaXNzdWUgaW4galF1ZXJ5IDMuMCAqL1xuICAgICAgaWYgKCFBTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgJiYgcmVnRXhwVGVzdCgvXFwvPi9pLCB2YWx1ZSkpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogU2FuaXRpemUgYXR0cmlidXRlIGNvbnRlbnQgdG8gYmUgdGVtcGxhdGUtc2FmZSAqL1xuICAgICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICAgIHZhbHVlID0gc3RyaW5nUmVwbGFjZSh2YWx1ZSwgZXhwciwgJyAnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvKiBJcyBgdmFsdWVgIHZhbGlkIGZvciB0aGlzIGF0dHJpYnV0ZT8gKi9cbiAgICAgIGNvbnN0IGxjVGFnID0gdHJhbnNmb3JtQ2FzZUZ1bmMoY3VycmVudE5vZGUubm9kZU5hbWUpO1xuICAgICAgaWYgKCFfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogSGFuZGxlIGF0dHJpYnV0ZXMgdGhhdCByZXF1aXJlIFRydXN0ZWQgVHlwZXMgKi9cbiAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgJiYgdHlwZW9mIHRydXN0ZWRUeXBlcyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHRydXN0ZWRUeXBlcy5nZXRBdHRyaWJ1dGVUeXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2VVUkkpIDsgZWxzZSB7XG4gICAgICAgICAgc3dpdGNoICh0cnVzdGVkVHlwZXMuZ2V0QXR0cmlidXRlVHlwZShsY1RhZywgbGNOYW1lKSkge1xuICAgICAgICAgICAgY2FzZSAnVHJ1c3RlZEhUTUwnOlxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ1RydXN0ZWRTY3JpcHRVUkwnOlxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlU2NyaXB0VVJMKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogSGFuZGxlIGludmFsaWQgZGF0YS0qIGF0dHJpYnV0ZSBzZXQgYnkgdHJ5LWNhdGNoaW5nIGl0ICovXG4gICAgICBpZiAodmFsdWUgIT09IGluaXRWYWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChuYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiBGYWxsYmFjayB0byBzZXRBdHRyaWJ1dGUoKSBmb3IgYnJvd3Nlci11bnJlY29nbml6ZWQgbmFtZXNwYWNlcyBlLmcuIFwieC1zY2hlbWFcIi4gKi9cbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheVBvcChET01QdXJpZnkucmVtb3ZlZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgfTtcbiAgLyoqXG4gICAqIF9zYW5pdGl6ZVNoYWRvd0RPTVxuICAgKlxuICAgKiBAcGFyYW0gZnJhZ21lbnQgdG8gaXRlcmF0ZSBvdmVyIHJlY3Vyc2l2ZWx5XG4gICAqL1xuICBjb25zdCBfc2FuaXRpemVTaGFkb3dET00gPSBmdW5jdGlvbiBfc2FuaXRpemVTaGFkb3dET00oZnJhZ21lbnQpIHtcbiAgICBsZXQgc2hhZG93Tm9kZSA9IG51bGw7XG4gICAgY29uc3Qgc2hhZG93SXRlcmF0b3IgPSBfY3JlYXRlTm9kZUl0ZXJhdG9yKGZyYWdtZW50KTtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZVNoYWRvd0RPTSwgZnJhZ21lbnQsIG51bGwpO1xuICAgIHdoaWxlIChzaGFkb3dOb2RlID0gc2hhZG93SXRlcmF0b3IubmV4dE5vZGUoKSkge1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVTaGFkb3dOb2RlLCBzaGFkb3dOb2RlLCBudWxsKTtcbiAgICAgIC8qIFNhbml0aXplIHRhZ3MgYW5kIGVsZW1lbnRzICovXG4gICAgICBfc2FuaXRpemVFbGVtZW50cyhzaGFkb3dOb2RlKTtcbiAgICAgIC8qIENoZWNrIGF0dHJpYnV0ZXMgbmV4dCAqL1xuICAgICAgX3Nhbml0aXplQXR0cmlidXRlcyhzaGFkb3dOb2RlKTtcbiAgICAgIC8qIERlZXAgc2hhZG93IERPTSBkZXRlY3RlZCAqL1xuICAgICAgaWYgKHNoYWRvd05vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgX3Nhbml0aXplU2hhZG93RE9NKHNoYWRvd05vZGUuY29udGVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVTaGFkb3dET00sIGZyYWdtZW50LCBudWxsKTtcbiAgfTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgRE9NUHVyaWZ5LnNhbml0aXplID0gZnVuY3Rpb24gKGRpcnR5KSB7XG4gICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgbGV0IGJvZHkgPSBudWxsO1xuICAgIGxldCBpbXBvcnRlZE5vZGUgPSBudWxsO1xuICAgIGxldCBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgbGV0IHJldHVybk5vZGUgPSBudWxsO1xuICAgIC8qIE1ha2Ugc3VyZSB3ZSBoYXZlIGEgc3RyaW5nIHRvIHNhbml0aXplLlxuICAgICAgRE8gTk9UIHJldHVybiBlYXJseSwgYXMgdGhpcyB3aWxsIHJldHVybiB0aGUgd3JvbmcgdHlwZSBpZlxuICAgICAgdGhlIHVzZXIgaGFzIHJlcXVlc3RlZCBhIERPTSBvYmplY3QgcmF0aGVyIHRoYW4gYSBzdHJpbmcgKi9cbiAgICBJU19FTVBUWV9JTlBVVCA9ICFkaXJ0eTtcbiAgICBpZiAoSVNfRU1QVFlfSU5QVVQpIHtcbiAgICAgIGRpcnR5ID0gJzwhLS0+JztcbiAgICB9XG4gICAgLyogU3RyaW5naWZ5LCBpbiBjYXNlIGRpcnR5IGlzIGFuIG9iamVjdCAqL1xuICAgIGlmICh0eXBlb2YgZGlydHkgIT09ICdzdHJpbmcnICYmICFfaXNOb2RlKGRpcnR5KSkge1xuICAgICAgaWYgKHR5cGVvZiBkaXJ0eS50b1N0cmluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBkaXJ0eSA9IGRpcnR5LnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICh0eXBlb2YgZGlydHkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdkaXJ0eSBpcyBub3QgYSBzdHJpbmcsIGFib3J0aW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgndG9TdHJpbmcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogUmV0dXJuIGRpcnR5IEhUTUwgaWYgRE9NUHVyaWZ5IGNhbm5vdCBydW4gKi9cbiAgICBpZiAoIURPTVB1cmlmeS5pc1N1cHBvcnRlZCkge1xuICAgICAgcmV0dXJuIGRpcnR5O1xuICAgIH1cbiAgICAvKiBBc3NpZ24gY29uZmlnIHZhcnMgKi9cbiAgICBpZiAoIVNFVF9DT05GSUcpIHtcbiAgICAgIF9wYXJzZUNvbmZpZyhjZmcpO1xuICAgIH1cbiAgICAvKiBDbGVhbiB1cCByZW1vdmVkIGVsZW1lbnRzICovXG4gICAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcbiAgICAvKiBDaGVjayBpZiBkaXJ0eSBpcyBjb3JyZWN0bHkgdHlwZWQgZm9yIElOX1BMQUNFICovXG4gICAgaWYgKHR5cGVvZiBkaXJ0eSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIElOX1BMQUNFID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChJTl9QTEFDRSkge1xuICAgICAgLyogRG8gc29tZSBlYXJseSBwcmUtc2FuaXRpemF0aW9uIHRvIGF2b2lkIHVuc2FmZSByb290IG5vZGVzICovXG4gICAgICBpZiAoZGlydHkubm9kZU5hbWUpIHtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKGRpcnR5Lm5vZGVOYW1lKTtcbiAgICAgICAgaWYgKCFBTExPV0VEX1RBR1NbdGFnTmFtZV0gfHwgRk9SQklEX1RBR1NbdGFnTmFtZV0pIHtcbiAgICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ3Jvb3Qgbm9kZSBpcyBmb3JiaWRkZW4gYW5kIGNhbm5vdCBiZSBzYW5pdGl6ZWQgaW4tcGxhY2UnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGlydHkgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAvKiBJZiBkaXJ0eSBpcyBhIERPTSBlbGVtZW50LCBhcHBlbmQgdG8gYW4gZW1wdHkgZG9jdW1lbnQgdG8gYXZvaWRcbiAgICAgICAgIGVsZW1lbnRzIGJlaW5nIHN0cmlwcGVkIGJ5IHRoZSBwYXJzZXIgKi9cbiAgICAgIGJvZHkgPSBfaW5pdERvY3VtZW50KCc8IS0tLS0+Jyk7XG4gICAgICBpbXBvcnRlZE5vZGUgPSBib2R5Lm93bmVyRG9jdW1lbnQuaW1wb3J0Tm9kZShkaXJ0eSwgdHJ1ZSk7XG4gICAgICBpZiAoaW1wb3J0ZWROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUuZWxlbWVudCAmJiBpbXBvcnRlZE5vZGUubm9kZU5hbWUgPT09ICdCT0RZJykge1xuICAgICAgICAvKiBOb2RlIGlzIGFscmVhZHkgYSBib2R5LCB1c2UgYXMgaXMgKi9cbiAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgIH0gZWxzZSBpZiAoaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnSFRNTCcpIHtcbiAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1hcHBlbmRcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChpbXBvcnRlZE5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBFeGl0IGRpcmVjdGx5IGlmIHdlIGhhdmUgbm90aGluZyB0byBkbyAqL1xuICAgICAgaWYgKCFSRVRVUk5fRE9NICYmICFTQUZFX0ZPUl9URU1QTEFURVMgJiYgIVdIT0xFX0RPQ1VNRU5UICYmXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItaW5jbHVkZXNcbiAgICAgIGRpcnR5LmluZGV4T2YoJzwnKSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoZGlydHkpIDogZGlydHk7XG4gICAgICB9XG4gICAgICAvKiBJbml0aWFsaXplIHRoZSBkb2N1bWVudCB0byB3b3JrIG9uICovXG4gICAgICBib2R5ID0gX2luaXREb2N1bWVudChkaXJ0eSk7XG4gICAgICAvKiBDaGVjayB3ZSBoYXZlIGEgRE9NIG5vZGUgZnJvbSB0aGUgZGF0YSAqL1xuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIHJldHVybiBSRVRVUk5fRE9NID8gbnVsbCA6IFJFVFVSTl9UUlVTVEVEX1RZUEUgPyBlbXB0eUhUTUwgOiAnJztcbiAgICAgIH1cbiAgICB9XG4gICAgLyogUmVtb3ZlIGZpcnN0IGVsZW1lbnQgbm9kZSAob3VycykgaWYgRk9SQ0VfQk9EWSBpcyBzZXQgKi9cbiAgICBpZiAoYm9keSAmJiBGT1JDRV9CT0RZKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoYm9keS5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgLyogR2V0IG5vZGUgaXRlcmF0b3IgKi9cbiAgICBjb25zdCBub2RlSXRlcmF0b3IgPSBfY3JlYXRlTm9kZUl0ZXJhdG9yKElOX1BMQUNFID8gZGlydHkgOiBib2R5KTtcbiAgICAvKiBOb3cgc3RhcnQgaXRlcmF0aW5nIG92ZXIgdGhlIGNyZWF0ZWQgZG9jdW1lbnQgKi9cbiAgICB3aGlsZSAoY3VycmVudE5vZGUgPSBub2RlSXRlcmF0b3IubmV4dE5vZGUoKSkge1xuICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgIF9zYW5pdGl6ZUVsZW1lbnRzKGN1cnJlbnROb2RlKTtcbiAgICAgIC8qIENoZWNrIGF0dHJpYnV0ZXMgbmV4dCAqL1xuICAgICAgX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSk7XG4gICAgICAvKiBTaGFkb3cgRE9NIGRldGVjdGVkLCBzYW5pdGl6ZSBpdCAqL1xuICAgICAgaWYgKGN1cnJlbnROb2RlLmNvbnRlbnQgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgICAgIF9zYW5pdGl6ZVNoYWRvd0RPTShjdXJyZW50Tm9kZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogSWYgd2Ugc2FuaXRpemVkIGBkaXJ0eWAgaW4tcGxhY2UsIHJldHVybiBpdC4gKi9cbiAgICBpZiAoSU5fUExBQ0UpIHtcbiAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgLyogUmV0dXJuIHNhbml0aXplZCBzdHJpbmcgb3IgRE9NICovXG4gICAgaWYgKFJFVFVSTl9ET00pIHtcbiAgICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgIHJldHVybk5vZGUgPSBjcmVhdGVEb2N1bWVudEZyYWdtZW50LmNhbGwoYm9keS5vd25lckRvY3VtZW50KTtcbiAgICAgICAgd2hpbGUgKGJvZHkuZmlyc3RDaGlsZCkge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1hcHBlbmRcbiAgICAgICAgICByZXR1cm5Ob2RlLmFwcGVuZENoaWxkKGJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybk5vZGUgPSBib2R5O1xuICAgICAgfVxuICAgICAgaWYgKEFMTE9XRURfQVRUUi5zaGFkb3dyb290IHx8IEFMTE9XRURfQVRUUi5zaGFkb3dyb290bW9kZSkge1xuICAgICAgICAvKlxuICAgICAgICAgIEFkb3B0Tm9kZSgpIGlzIG5vdCB1c2VkIGJlY2F1c2UgaW50ZXJuYWwgc3RhdGUgaXMgbm90IHJlc2V0XG4gICAgICAgICAgKGUuZy4gdGhlIHBhc3QgbmFtZXMgbWFwIG9mIGEgSFRNTEZvcm1FbGVtZW50KSwgdGhpcyBpcyBzYWZlXG4gICAgICAgICAgaW4gdGhlb3J5IGJ1dCB3ZSB3b3VsZCByYXRoZXIgbm90IHJpc2sgYW5vdGhlciBhdHRhY2sgdmVjdG9yLlxuICAgICAgICAgIFRoZSBzdGF0ZSB0aGF0IGlzIGNsb25lZCBieSBpbXBvcnROb2RlKCkgaXMgZXhwbGljaXRseSBkZWZpbmVkXG4gICAgICAgICAgYnkgdGhlIHNwZWNzLlxuICAgICAgICAqL1xuICAgICAgICByZXR1cm5Ob2RlID0gaW1wb3J0Tm9kZS5jYWxsKG9yaWdpbmFsRG9jdW1lbnQsIHJldHVybk5vZGUsIHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldHVybk5vZGU7XG4gICAgfVxuICAgIGxldCBzZXJpYWxpemVkSFRNTCA9IFdIT0xFX0RPQ1VNRU5UID8gYm9keS5vdXRlckhUTUwgOiBib2R5LmlubmVySFRNTDtcbiAgICAvKiBTZXJpYWxpemUgZG9jdHlwZSBpZiBhbGxvd2VkICovXG4gICAgaWYgKFdIT0xFX0RPQ1VNRU5UICYmIEFMTE9XRURfVEFHU1snIWRvY3R5cGUnXSAmJiBib2R5Lm93bmVyRG9jdW1lbnQgJiYgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUgJiYgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSAmJiByZWdFeHBUZXN0KERPQ1RZUEVfTkFNRSwgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSkpIHtcbiAgICAgIHNlcmlhbGl6ZWRIVE1MID0gJzwhRE9DVFlQRSAnICsgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSArICc+XFxuJyArIHNlcmlhbGl6ZWRIVE1MO1xuICAgIH1cbiAgICAvKiBTYW5pdGl6ZSBmaW5hbCBzdHJpbmcgdGVtcGxhdGUtc2FmZSAqL1xuICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgIGFycmF5Rm9yRWFjaChbTVVTVEFDSEVfRVhQUiwgRVJCX0VYUFIsIFRNUExJVF9FWFBSXSwgZXhwciA9PiB7XG4gICAgICAgIHNlcmlhbGl6ZWRIVE1MID0gc3RyaW5nUmVwbGFjZShzZXJpYWxpemVkSFRNTCwgZXhwciwgJyAnKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChzZXJpYWxpemVkSFRNTCkgOiBzZXJpYWxpemVkSFRNTDtcbiAgfTtcbiAgRE9NUHVyaWZ5LnNldENvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgY2ZnID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICBTRVRfQ09ORklHID0gdHJ1ZTtcbiAgfTtcbiAgRE9NUHVyaWZ5LmNsZWFyQ29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgIENPTkZJRyA9IG51bGw7XG4gICAgU0VUX0NPTkZJRyA9IGZhbHNlO1xuICB9O1xuICBET01QdXJpZnkuaXNWYWxpZEF0dHJpYnV0ZSA9IGZ1bmN0aW9uICh0YWcsIGF0dHIsIHZhbHVlKSB7XG4gICAgLyogSW5pdGlhbGl6ZSBzaGFyZWQgY29uZmlnIHZhcnMgaWYgbmVjZXNzYXJ5LiAqL1xuICAgIGlmICghQ09ORklHKSB7XG4gICAgICBfcGFyc2VDb25maWcoe30pO1xuICAgIH1cbiAgICBjb25zdCBsY1RhZyA9IHRyYW5zZm9ybUNhc2VGdW5jKHRhZyk7XG4gICAgY29uc3QgbGNOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoYXR0cik7XG4gICAgcmV0dXJuIF9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKTtcbiAgfTtcbiAgRE9NUHVyaWZ5LmFkZEhvb2sgPSBmdW5jdGlvbiAoZW50cnlQb2ludCwgaG9va0Z1bmN0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBob29rRnVuY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXJyYXlQdXNoKGhvb2tzW2VudHJ5UG9pbnRdLCBob29rRnVuY3Rpb24pO1xuICB9O1xuICBET01QdXJpZnkucmVtb3ZlSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50LCBob29rRnVuY3Rpb24pIHtcbiAgICBpZiAoaG9va0Z1bmN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gYXJyYXlMYXN0SW5kZXhPZihob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgICAgIHJldHVybiBpbmRleCA9PT0gLTEgPyB1bmRlZmluZWQgOiBhcnJheVNwbGljZShob29rc1tlbnRyeVBvaW50XSwgaW5kZXgsIDEpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlQb3AoaG9va3NbZW50cnlQb2ludF0pO1xuICB9O1xuICBET01QdXJpZnkucmVtb3ZlSG9va3MgPSBmdW5jdGlvbiAoZW50cnlQb2ludCkge1xuICAgIGhvb2tzW2VudHJ5UG9pbnRdID0gW107XG4gIH07XG4gIERPTVB1cmlmeS5yZW1vdmVBbGxIb29rcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBob29rcyA9IF9jcmVhdGVIb29rc01hcCgpO1xuICB9O1xuICByZXR1cm4gRE9NUHVyaWZ5O1xufVxudmFyIHB1cmlmeSA9IGNyZWF0ZURPTVB1cmlmeSgpO1xuXG5leHBvcnQgeyBwdXJpZnkgYXMgZGVmYXVsdCB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHVyaWZ5LmVzLm1qcy5tYXBcbiIsIi8qKlxuICogbWFya2VkIHYxNy4wLjEgLSBhIG1hcmtkb3duIHBhcnNlclxuICogQ29weXJpZ2h0IChjKSAyMDE4LTIwMjUsIE1hcmtlZEpTLiAoTUlUIExpY2Vuc2UpXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxOCwgQ2hyaXN0b3BoZXIgSmVmZnJleS4gKE1JVCBMaWNlbnNlKVxuICogaHR0cHM6Ly9naXRodWIuY29tL21hcmtlZGpzL21hcmtlZFxuICovXG5cbi8qKlxuICogRE8gTk9UIEVESVQgVEhJUyBGSUxFXG4gKiBUaGUgY29kZSBpbiB0aGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGZyb20gZmlsZXMgaW4gLi9zcmMvXG4gKi9cblxuZnVuY3Rpb24gTCgpe3JldHVybnthc3luYzohMSxicmVha3M6ITEsZXh0ZW5zaW9uczpudWxsLGdmbTohMCxob29rczpudWxsLHBlZGFudGljOiExLHJlbmRlcmVyOm51bGwsc2lsZW50OiExLHRva2VuaXplcjpudWxsLHdhbGtUb2tlbnM6bnVsbH19dmFyIFQ9TCgpO2Z1bmN0aW9uIFoodSl7VD11fXZhciBDPXtleGVjOigpPT5udWxsfTtmdW5jdGlvbiBrKHUsZT1cIlwiKXtsZXQgdD10eXBlb2YgdT09XCJzdHJpbmdcIj91OnUuc291cmNlLG49e3JlcGxhY2U6KHIsaSk9PntsZXQgcz10eXBlb2YgaT09XCJzdHJpbmdcIj9pOmkuc291cmNlO3JldHVybiBzPXMucmVwbGFjZShtLmNhcmV0LFwiJDFcIiksdD10LnJlcGxhY2UocixzKSxufSxnZXRSZWdleDooKT0+bmV3IFJlZ0V4cCh0LGUpfTtyZXR1cm4gbn12YXIgbWU9KCgpPT57dHJ5e3JldHVybiEhbmV3IFJlZ0V4cChcIig/PD0xKSg/PCExKVwiKX1jYXRjaHtyZXR1cm4hMX19KSgpLG09e2NvZGVSZW1vdmVJbmRlbnQ6L14oPzogezEsNH18IHswLDN9XFx0KS9nbSxvdXRwdXRMaW5rUmVwbGFjZTovXFxcXChbXFxbXFxdXSkvZyxpbmRlbnRDb2RlQ29tcGVuc2F0aW9uOi9eKFxccyspKD86YGBgKS8sYmVnaW5uaW5nU3BhY2U6L15cXHMrLyxlbmRpbmdIYXNoOi8jJC8sc3RhcnRpbmdTcGFjZUNoYXI6L14gLyxlbmRpbmdTcGFjZUNoYXI6LyAkLyxub25TcGFjZUNoYXI6L1teIF0vLG5ld0xpbmVDaGFyR2xvYmFsOi9cXG4vZyx0YWJDaGFyR2xvYmFsOi9cXHQvZyxtdWx0aXBsZVNwYWNlR2xvYmFsOi9cXHMrL2csYmxhbmtMaW5lOi9eWyBcXHRdKiQvLGRvdWJsZUJsYW5rTGluZTovXFxuWyBcXHRdKlxcblsgXFx0XSokLyxibG9ja3F1b3RlU3RhcnQ6L14gezAsM30+LyxibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZTovXFxuIHswLDN9KCg/Oj0rfC0rKSAqKSg/PVxcbnwkKS9nLGJsb2NrcXVvdGVTZXRleHRSZXBsYWNlMjovXiB7MCwzfT5bIFxcdF0/L2dtLGxpc3RSZXBsYWNlVGFiczovXlxcdCsvLGxpc3RSZXBsYWNlTmVzdGluZzovXiB7MSw0fSg/PSggezR9KSpbXiBdKS9nLGxpc3RJc1Rhc2s6L15cXFtbIHhYXVxcXSArXFxTLyxsaXN0UmVwbGFjZVRhc2s6L15cXFtbIHhYXVxcXSArLyxsaXN0VGFza0NoZWNrYm94Oi9cXFtbIHhYXVxcXS8sYW55TGluZTovXFxuLipcXG4vLGhyZWZCcmFja2V0czovXjwoLiopPiQvLHRhYmxlRGVsaW1pdGVyOi9bOnxdLyx0YWJsZUFsaWduQ2hhcnM6L15cXHx8XFx8ICokL2csdGFibGVSb3dCbGFua0xpbmU6L1xcblsgXFx0XSokLyx0YWJsZUFsaWduUmlnaHQ6L14gKi0rOiAqJC8sdGFibGVBbGlnbkNlbnRlcjovXiAqOi0rOiAqJC8sdGFibGVBbGlnbkxlZnQ6L14gKjotKyAqJC8sc3RhcnRBVGFnOi9ePGEgL2ksZW5kQVRhZzovXjxcXC9hPi9pLHN0YXJ0UHJlU2NyaXB0VGFnOi9ePChwcmV8Y29kZXxrYmR8c2NyaXB0KShcXHN8PikvaSxlbmRQcmVTY3JpcHRUYWc6L148XFwvKHByZXxjb2RlfGtiZHxzY3JpcHQpKFxcc3w+KS9pLHN0YXJ0QW5nbGVCcmFja2V0Oi9ePC8sZW5kQW5nbGVCcmFja2V0Oi8+JC8scGVkYW50aWNIcmVmVGl0bGU6L14oW14nXCJdKlteXFxzXSlcXHMrKFsnXCJdKSguKilcXDIvLHVuaWNvZGVBbHBoYU51bWVyaWM6L1tcXHB7TH1cXHB7Tn1dL3UsZXNjYXBlVGVzdDovWyY8PlwiJ10vLGVzY2FwZVJlcGxhY2U6L1smPD5cIiddL2csZXNjYXBlVGVzdE5vRW5jb2RlOi9bPD5cIiddfCYoPyEoI1xcZHsxLDd9fCNbWHhdW2EtZkEtRjAtOV17MSw2fXxcXHcrKTspLyxlc2NhcGVSZXBsYWNlTm9FbmNvZGU6L1s8PlwiJ118Jig/ISgjXFxkezEsN318I1tYeF1bYS1mQS1GMC05XXsxLDZ9fFxcdyspOykvZyx1bmVzY2FwZVRlc3Q6LyYoIyg/OlxcZCspfCg/OiN4WzAtOUEtRmEtZl0rKXwoPzpcXHcrKSk7Py9pZyxjYXJldDovKF58W15cXFtdKVxcXi9nLHBlcmNlbnREZWNvZGU6LyUyNS9nLGZpbmRQaXBlOi9cXHwvZyxzcGxpdFBpcGU6LyBcXHwvLHNsYXNoUGlwZTovXFxcXFxcfC9nLGNhcnJpYWdlUmV0dXJuOi9cXHJcXG58XFxyL2csc3BhY2VMaW5lOi9eICskL2dtLG5vdFNwYWNlU3RhcnQ6L15cXFMqLyxlbmRpbmdOZXdsaW5lOi9cXG4kLyxsaXN0SXRlbVJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4oIHswLDN9JHt1fSkoKD86W1x0IF1bXlxcXFxuXSopPyg/OlxcXFxufCQpKWApLG5leHRCdWxsZXRSZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0oPzpbKistXXxcXFxcZHsxLDl9Wy4pXSkoKD86WyBcdF1bXlxcXFxuXSopPyg/OlxcXFxufCQpKWApLGhyUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19KCg/Oi0gKil7Myx9fCg/Ol8gKil7Myx9fCg/OlxcXFwqICopezMsfSkoPzpcXFxcbit8JClgKSxmZW5jZXNCZWdpblJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSg/OlxcYFxcYFxcYHx+fn4pYCksaGVhZGluZ0JlZ2luUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19I2ApLGh0bWxCZWdpblJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fTwoPzpbYS16XS4qPnwhLS0pYCxcImlcIil9LHhlPS9eKD86WyBcXHRdKig/OlxcbnwkKSkrLyxiZT0vXigoPzogezR9fCB7MCwzfVxcdClbXlxcbl0rKD86XFxuKD86WyBcXHRdKig/OlxcbnwkKSkqKT8pKy8sUmU9L14gezAsM30oYHszLH0oPz1bXmBcXG5dKig/OlxcbnwkKSl8fnszLH0pKFteXFxuXSopKD86XFxufCQpKD86fChbXFxzXFxTXSo/KSg/OlxcbnwkKSkoPzogezAsM31cXDFbfmBdKiAqKD89XFxufCQpfCQpLyxJPS9eIHswLDN9KCg/Oi1bXFx0IF0qKXszLH18KD86X1sgXFx0XSopezMsfXwoPzpcXCpbIFxcdF0qKXszLH0pKD86XFxuK3wkKS8sVGU9L14gezAsM30oI3sxLDZ9KSg/PVxcc3wkKSguKikoPzpcXG4rfCQpLyxOPS8oPzpbKistXXxcXGR7MSw5fVsuKV0pLyxyZT0vXig/IWJ1bGwgfGJsb2NrQ29kZXxmZW5jZXN8YmxvY2txdW90ZXxoZWFkaW5nfGh0bWx8dGFibGUpKCg/Oi58XFxuKD8hXFxzKj9cXG58YnVsbCB8YmxvY2tDb2RlfGZlbmNlc3xibG9ja3F1b3RlfGhlYWRpbmd8aHRtbHx0YWJsZSkpKz8pXFxuIHswLDN9KD0rfC0rKSAqKD86XFxuK3wkKS8sc2U9ayhyZSkucmVwbGFjZSgvYnVsbC9nLE4pLnJlcGxhY2UoL2Jsb2NrQ29kZS9nLC8oPzogezR9fCB7MCwzfVxcdCkvKS5yZXBsYWNlKC9mZW5jZXMvZywvIHswLDN9KD86YHszLH18fnszLH0pLykucmVwbGFjZSgvYmxvY2txdW90ZS9nLC8gezAsM30+LykucmVwbGFjZSgvaGVhZGluZy9nLC8gezAsM30jezEsNn0vKS5yZXBsYWNlKC9odG1sL2csLyB7MCwzfTxbXlxcbj5dKz5cXG4vKS5yZXBsYWNlKC9cXHx0YWJsZS9nLFwiXCIpLmdldFJlZ2V4KCksT2U9ayhyZSkucmVwbGFjZSgvYnVsbC9nLE4pLnJlcGxhY2UoL2Jsb2NrQ29kZS9nLC8oPzogezR9fCB7MCwzfVxcdCkvKS5yZXBsYWNlKC9mZW5jZXMvZywvIHswLDN9KD86YHszLH18fnszLH0pLykucmVwbGFjZSgvYmxvY2txdW90ZS9nLC8gezAsM30+LykucmVwbGFjZSgvaGVhZGluZy9nLC8gezAsM30jezEsNn0vKS5yZXBsYWNlKC9odG1sL2csLyB7MCwzfTxbXlxcbj5dKz5cXG4vKS5yZXBsYWNlKC90YWJsZS9nLC8gezAsM31cXHw/KD86WzpcXC0gXSpcXHwpK1tcXDpcXC0gXSpcXG4vKS5nZXRSZWdleCgpLFE9L14oW15cXG5dKyg/Olxcbig/IWhyfGhlYWRpbmd8bGhlYWRpbmd8YmxvY2txdW90ZXxmZW5jZXN8bGlzdHxodG1sfHRhYmxlfCArXFxuKVteXFxuXSspKikvLHdlPS9eW15cXG5dKy8sRj0vKD8hXFxzKlxcXSkoPzpcXFxcW1xcc1xcU118W15cXFtcXF1cXFxcXSkrLyx5ZT1rKC9eIHswLDN9XFxbKGxhYmVsKVxcXTogKig/OlxcblsgXFx0XSopPyhbXjxcXHNdW15cXHNdKnw8Lio/PikoPzooPzogKyg/OlxcblsgXFx0XSopP3wgKlxcblsgXFx0XSopKHRpdGxlKSk/ICooPzpcXG4rfCQpLykucmVwbGFjZShcImxhYmVsXCIsRikucmVwbGFjZShcInRpdGxlXCIsLyg/OlwiKD86XFxcXFwiP3xbXlwiXFxcXF0pKlwifCdbXidcXG5dKig/OlxcblteJ1xcbl0rKSpcXG4/J3xcXChbXigpXSpcXCkpLykuZ2V0UmVnZXgoKSxQZT1rKC9eKCB7MCwzfWJ1bGwpKFsgXFx0XVteXFxuXSs/KT8oPzpcXG58JCkvKS5yZXBsYWNlKC9idWxsL2csTikuZ2V0UmVnZXgoKSx2PVwiYWRkcmVzc3xhcnRpY2xlfGFzaWRlfGJhc2V8YmFzZWZvbnR8YmxvY2txdW90ZXxib2R5fGNhcHRpb258Y2VudGVyfGNvbHxjb2xncm91cHxkZHxkZXRhaWxzfGRpYWxvZ3xkaXJ8ZGl2fGRsfGR0fGZpZWxkc2V0fGZpZ2NhcHRpb258ZmlndXJlfGZvb3Rlcnxmb3JtfGZyYW1lfGZyYW1lc2V0fGhbMS02XXxoZWFkfGhlYWRlcnxocnxodG1sfGlmcmFtZXxsZWdlbmR8bGl8bGlua3xtYWlufG1lbnV8bWVudWl0ZW18bWV0YXxuYXZ8bm9mcmFtZXN8b2x8b3B0Z3JvdXB8b3B0aW9ufHB8cGFyYW18c2VhcmNofHNlY3Rpb258c3VtbWFyeXx0YWJsZXx0Ym9keXx0ZHx0Zm9vdHx0aHx0aGVhZHx0aXRsZXx0cnx0cmFja3x1bFwiLGo9LzwhLS0oPzotPz58W1xcc1xcU10qPyg/Oi0tPnwkKSkvLFNlPWsoXCJeIHswLDN9KD86PChzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKVtcXFxccz5dW1xcXFxzXFxcXFNdKj8oPzo8L1xcXFwxPlteXFxcXG5dKlxcXFxuK3wkKXxjb21tZW50W15cXFxcbl0qKFxcXFxuK3wkKXw8XFxcXD9bXFxcXHNcXFxcU10qPyg/OlxcXFw/PlxcXFxuKnwkKXw8IVtBLVpdW1xcXFxzXFxcXFNdKj8oPzo+XFxcXG4qfCQpfDwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj8oPzpcXFxcXVxcXFxdPlxcXFxuKnwkKXw8Lz8odGFnKSg/OiArfFxcXFxufC8/PilbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuWyBcdF0qKStcXFxcbnwkKXw8KD8hc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSkoW2Etel1bXFxcXHctXSopKD86YXR0cmlidXRlKSo/ICovPz4oPz1bIFxcXFx0XSooPzpcXFxcbnwkKSlbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuWyBcdF0qKStcXFxcbnwkKXw8Lyg/IXNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpW2Etel1bXFxcXHctXSpcXFxccyo+KD89WyBcXFxcdF0qKD86XFxcXG58JCkpW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcblsgXHRdKikrXFxcXG58JCkpXCIsXCJpXCIpLnJlcGxhY2UoXCJjb21tZW50XCIsaikucmVwbGFjZShcInRhZ1wiLHYpLnJlcGxhY2UoXCJhdHRyaWJ1dGVcIiwvICtbYS16QS1aOl9dW1xcdy46LV0qKD86ICo9ICpcIlteXCJcXG5dKlwifCAqPSAqJ1teJ1xcbl0qJ3wgKj0gKlteXFxzXCInPTw+YF0rKT8vKS5nZXRSZWdleCgpLGllPWsoUSkucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixcIiB7MCwzfSN7MSw2fSg/OlxcXFxzfCQpXCIpLnJlcGxhY2UoXCJ8bGhlYWRpbmdcIixcIlwiKS5yZXBsYWNlKFwifHRhYmxlXCIsXCJcIikucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcImZlbmNlc1wiLFwiIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuXCIpLnJlcGxhY2UoXCJsaXN0XCIsXCIgezAsM30oPzpbKistXXwxWy4pXSkgXCIpLnJlcGxhY2UoXCJodG1sXCIsXCI8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pXCIpLnJlcGxhY2UoXCJ0YWdcIix2KS5nZXRSZWdleCgpLCRlPWsoL14oIHswLDN9PiA/KHBhcmFncmFwaHxbXlxcbl0qKSg/OlxcbnwkKSkrLykucmVwbGFjZShcInBhcmFncmFwaFwiLGllKS5nZXRSZWdleCgpLFU9e2Jsb2NrcXVvdGU6JGUsY29kZTpiZSxkZWY6eWUsZmVuY2VzOlJlLGhlYWRpbmc6VGUsaHI6SSxodG1sOlNlLGxoZWFkaW5nOnNlLGxpc3Q6UGUsbmV3bGluZTp4ZSxwYXJhZ3JhcGg6aWUsdGFibGU6Qyx0ZXh0OndlfSx0ZT1rKFwiXiAqKFteXFxcXG4gXS4qKVxcXFxuIHswLDN9KCg/OlxcXFx8ICopPzo/LSs6PyAqKD86XFxcXHwgKjo/LSs6PyAqKSooPzpcXFxcfCAqKT8pKD86XFxcXG4oKD86KD8hICpcXFxcbnxocnxoZWFkaW5nfGJsb2NrcXVvdGV8Y29kZXxmZW5jZXN8bGlzdHxodG1sKS4qKD86XFxcXG58JCkpKilcXFxcbip8JClcIikucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixcIiB7MCwzfSN7MSw2fSg/OlxcXFxzfCQpXCIpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJjb2RlXCIsXCIoPzogezR9fCB7MCwzfVx0KVteXFxcXG5dXCIpLnJlcGxhY2UoXCJmZW5jZXNcIixcIiB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcblwiKS5yZXBsYWNlKFwibGlzdFwiLFwiIHswLDN9KD86WyorLV18MVsuKV0pIFwiKS5yZXBsYWNlKFwiaHRtbFwiLFwiPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKVwiKS5yZXBsYWNlKFwidGFnXCIsdikuZ2V0UmVnZXgoKSxfZT17Li4uVSxsaGVhZGluZzpPZSx0YWJsZTp0ZSxwYXJhZ3JhcGg6ayhRKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLFwiIHswLDN9I3sxLDZ9KD86XFxcXHN8JClcIikucmVwbGFjZShcInxsaGVhZGluZ1wiLFwiXCIpLnJlcGxhY2UoXCJ0YWJsZVwiLHRlKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwiZmVuY2VzXCIsXCIgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG5cIikucmVwbGFjZShcImxpc3RcIixcIiB7MCwzfSg/OlsqKy1dfDFbLildKSBcIikucmVwbGFjZShcImh0bWxcIixcIjwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSlcIikucmVwbGFjZShcInRhZ1wiLHYpLmdldFJlZ2V4KCl9LExlPXsuLi5VLGh0bWw6ayhgXiAqKD86Y29tbWVudCAqKD86XFxcXG58XFxcXHMqJCl8PCh0YWcpW1xcXFxzXFxcXFNdKz88L1xcXFwxPiAqKD86XFxcXG57Mix9fFxcXFxzKiQpfDx0YWcoPzpcIlteXCJdKlwifCdbXiddKid8XFxcXHNbXidcIi8+XFxcXHNdKikqPy8/PiAqKD86XFxcXG57Mix9fFxcXFxzKiQpKWApLnJlcGxhY2UoXCJjb21tZW50XCIsaikucmVwbGFjZSgvdGFnL2csXCIoPyEoPzphfGVtfHN0cm9uZ3xzbWFsbHxzfGNpdGV8cXxkZm58YWJicnxkYXRhfHRpbWV8Y29kZXx2YXJ8c2FtcHxrYmR8c3VifHN1cHxpfGJ8dXxtYXJrfHJ1Ynl8cnR8cnB8YmRpfGJkb3xzcGFufGJyfHdicnxpbnN8ZGVsfGltZylcXFxcYilcXFxcdysoPyE6fFteXFxcXHdcXFxcc0BdKkApXFxcXGJcIikuZ2V0UmVnZXgoKSxkZWY6L14gKlxcWyhbXlxcXV0rKVxcXTogKjw/KFteXFxzPl0rKT4/KD86ICsoW1wiKF1bXlxcbl0rW1wiKV0pKT8gKig/Olxcbit8JCkvLGhlYWRpbmc6L14oI3sxLDZ9KSguKikoPzpcXG4rfCQpLyxmZW5jZXM6QyxsaGVhZGluZzovXiguKz8pXFxuIHswLDN9KD0rfC0rKSAqKD86XFxuK3wkKS8scGFyYWdyYXBoOmsoUSkucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixgICojezEsNn0gKlteXG5dYCkucmVwbGFjZShcImxoZWFkaW5nXCIsc2UpLnJlcGxhY2UoXCJ8dGFibGVcIixcIlwiKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwifGZlbmNlc1wiLFwiXCIpLnJlcGxhY2UoXCJ8bGlzdFwiLFwiXCIpLnJlcGxhY2UoXCJ8aHRtbFwiLFwiXCIpLnJlcGxhY2UoXCJ8dGFnXCIsXCJcIikuZ2V0UmVnZXgoKX0sTWU9L15cXFxcKFshXCIjJCUmJygpKissXFwtLi86Ozw9Pj9AXFxbXFxdXFxcXF5fYHt8fX5dKS8semU9L14oYCspKFteYF18W15gXVtcXHNcXFNdKj9bXmBdKVxcMSg/IWApLyxvZT0vXiggezIsfXxcXFxcKVxcbig/IVxccyokKS8sQWU9L14oYCt8W15gXSkoPzooPz0gezIsfVxcbil8W1xcc1xcU10qPyg/Oig/PVtcXFxcPCFcXFtgKl9dfFxcYl98JCl8W14gXSg/PSB7Mix9XFxuKSkpLyxEPS9bXFxwe1B9XFxwe1N9XS91LEs9L1tcXHNcXHB7UH1cXHB7U31dL3UsYWU9L1teXFxzXFxwe1B9XFxwe1N9XS91LENlPWsoL14oKD8hWypfXSlwdW5jdFNwYWNlKS8sXCJ1XCIpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxLKS5nZXRSZWdleCgpLGxlPS8oPyF+KVtcXHB7UH1cXHB7U31dL3UsSWU9Lyg/IX4pW1xcc1xccHtQfVxccHtTfV0vdSxFZT0vKD86W15cXHNcXHB7UH1cXHB7U31dfH4pL3UsQmU9aygvbGlua3xwcmVjb2RlLWNvZGV8aHRtbC8sXCJnXCIpLnJlcGxhY2UoXCJsaW5rXCIsL1xcWyg/OlteXFxbXFxdYF18KD88YT5gKylbXmBdK1xcazxhPig/IWApKSo/XFxdXFwoKD86XFxcXFtcXHNcXFNdfFteXFxcXFxcKFxcKV18XFwoKD86XFxcXFtcXHNcXFNdfFteXFxcXFxcKFxcKV0pKlxcKSkqXFwpLykucmVwbGFjZShcInByZWNvZGUtXCIsbWU/XCIoPzwhYCkoKVwiOlwiKF5efFteYF0pXCIpLnJlcGxhY2UoXCJjb2RlXCIsLyg/PGI+YCspW15gXStcXGs8Yj4oPyFgKS8pLnJlcGxhY2UoXCJodG1sXCIsLzwoPyEgKVtePD5dKj8+LykuZ2V0UmVnZXgoKSx1ZT0vXig/OlxcKisoPzooKD8hXFwqKXB1bmN0KXxbXlxccypdKSl8Xl8rKD86KCg/IV8pcHVuY3QpfChbXlxcc19dKSkvLHFlPWsodWUsXCJ1XCIpLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSx2ZT1rKHVlLFwidVwiKS5yZXBsYWNlKC9wdW5jdC9nLGxlKS5nZXRSZWdleCgpLHBlPVwiXlteXypdKj9fX1teXypdKj9cXFxcKlteXypdKj8oPz1fXyl8W14qXSsoPz1bXipdKXwoPyFcXFxcKilwdW5jdChcXFxcKispKD89W1xcXFxzXXwkKXxub3RQdW5jdFNwYWNlKFxcXFwqKykoPyFcXFxcKikoPz1wdW5jdFNwYWNlfCQpfCg/IVxcXFwqKXB1bmN0U3BhY2UoXFxcXCorKSg/PW5vdFB1bmN0U3BhY2UpfFtcXFxcc10oXFxcXCorKSg/IVxcXFwqKSg/PXB1bmN0KXwoPyFcXFxcKilwdW5jdChcXFxcKispKD8hXFxcXCopKD89cHVuY3QpfG5vdFB1bmN0U3BhY2UoXFxcXCorKSg/PW5vdFB1bmN0U3BhY2UpXCIsRGU9ayhwZSxcImd1XCIpLnJlcGxhY2UoL25vdFB1bmN0U3BhY2UvZyxhZSkucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEspLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSxIZT1rKHBlLFwiZ3VcIikucmVwbGFjZSgvbm90UHVuY3RTcGFjZS9nLEVlKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSWUpLnJlcGxhY2UoL3B1bmN0L2csbGUpLmdldFJlZ2V4KCksWmU9ayhcIl5bXl8qXSo/XFxcXCpcXFxcKlteXypdKj9fW15fKl0qPyg/PVxcXFwqXFxcXCopfFteX10rKD89W15fXSl8KD8hXylwdW5jdChfKykoPz1bXFxcXHNdfCQpfG5vdFB1bmN0U3BhY2UoXyspKD8hXykoPz1wdW5jdFNwYWNlfCQpfCg/IV8pcHVuY3RTcGFjZShfKykoPz1ub3RQdW5jdFNwYWNlKXxbXFxcXHNdKF8rKSg/IV8pKD89cHVuY3QpfCg/IV8pcHVuY3QoXyspKD8hXykoPz1wdW5jdClcIixcImd1XCIpLnJlcGxhY2UoL25vdFB1bmN0U3BhY2UvZyxhZSkucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEspLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSxHZT1rKC9cXFxcKHB1bmN0KS8sXCJndVwiKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksTmU9aygvXjwoc2NoZW1lOlteXFxzXFx4MDAtXFx4MWY8Pl0qfGVtYWlsKT4vKS5yZXBsYWNlKFwic2NoZW1lXCIsL1thLXpBLVpdW2EtekEtWjAtOSsuLV17MSwzMX0vKS5yZXBsYWNlKFwiZW1haWxcIiwvW2EtekEtWjAtOS4hIyQlJicqKy89P15fYHt8fX4tXSsoQClbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKyg/IVstX10pLykuZ2V0UmVnZXgoKSxRZT1rKGopLnJlcGxhY2UoXCIoPzotLT58JClcIixcIi0tPlwiKS5nZXRSZWdleCgpLEZlPWsoXCJeY29tbWVudHxePC9bYS16QS1aXVtcXFxcdzotXSpcXFxccyo+fF48W2EtekEtWl1bXFxcXHctXSooPzphdHRyaWJ1dGUpKj9cXFxccyovPz58XjxcXFxcP1tcXFxcc1xcXFxTXSo/XFxcXD8+fF48IVthLXpBLVpdK1xcXFxzW1xcXFxzXFxcXFNdKj8+fF48IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/XFxcXF1cXFxcXT5cIikucmVwbGFjZShcImNvbW1lbnRcIixRZSkucmVwbGFjZShcImF0dHJpYnV0ZVwiLC9cXHMrW2EtekEtWjpfXVtcXHcuOi1dKig/Olxccyo9XFxzKlwiW15cIl0qXCJ8XFxzKj1cXHMqJ1teJ10qJ3xcXHMqPVxccypbXlxcc1wiJz08PmBdKyk/LykuZ2V0UmVnZXgoKSxxPS8oPzpcXFsoPzpcXFxcW1xcc1xcU118W15cXFtcXF1cXFxcXSkqXFxdfFxcXFxbXFxzXFxTXXxgK1teYF0qP2ArKD8hYCl8W15cXFtcXF1cXFxcYF0pKj8vLGplPWsoL14hP1xcWyhsYWJlbClcXF1cXChcXHMqKGhyZWYpKD86KD86WyBcXHRdKig/OlxcblsgXFx0XSopPykodGl0bGUpKT9cXHMqXFwpLykucmVwbGFjZShcImxhYmVsXCIscSkucmVwbGFjZShcImhyZWZcIiwvPCg/OlxcXFwufFteXFxuPD5cXFxcXSkrPnxbXiBcXHRcXG5cXHgwMC1cXHgxZl0qLykucmVwbGFjZShcInRpdGxlXCIsL1wiKD86XFxcXFwiP3xbXlwiXFxcXF0pKlwifCcoPzpcXFxcJz98W14nXFxcXF0pKid8XFwoKD86XFxcXFxcKT98W14pXFxcXF0pKlxcKS8pLmdldFJlZ2V4KCksY2U9aygvXiE/XFxbKGxhYmVsKVxcXVxcWyhyZWYpXFxdLykucmVwbGFjZShcImxhYmVsXCIscSkucmVwbGFjZShcInJlZlwiLEYpLmdldFJlZ2V4KCksaGU9aygvXiE/XFxbKHJlZilcXF0oPzpcXFtcXF0pPy8pLnJlcGxhY2UoXCJyZWZcIixGKS5nZXRSZWdleCgpLFVlPWsoXCJyZWZsaW5rfG5vbGluayg/IVxcXFwoKVwiLFwiZ1wiKS5yZXBsYWNlKFwicmVmbGlua1wiLGNlKS5yZXBsYWNlKFwibm9saW5rXCIsaGUpLmdldFJlZ2V4KCksbmU9L1toSF1bdFRdW3RUXVtwUF1bc1NdP3xbZkZdW3RUXVtwUF0vLFc9e19iYWNrcGVkYWw6QyxhbnlQdW5jdHVhdGlvbjpHZSxhdXRvbGluazpOZSxibG9ja1NraXA6QmUsYnI6b2UsY29kZTp6ZSxkZWw6QyxlbVN0cm9uZ0xEZWxpbTpxZSxlbVN0cm9uZ1JEZWxpbUFzdDpEZSxlbVN0cm9uZ1JEZWxpbVVuZDpaZSxlc2NhcGU6TWUsbGluazpqZSxub2xpbms6aGUscHVuY3R1YXRpb246Q2UscmVmbGluazpjZSxyZWZsaW5rU2VhcmNoOlVlLHRhZzpGZSx0ZXh0OkFlLHVybDpDfSxLZT17Li4uVyxsaW5rOmsoL14hP1xcWyhsYWJlbClcXF1cXCgoLio/KVxcKS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLmdldFJlZ2V4KCkscmVmbGluazprKC9eIT9cXFsobGFiZWwpXFxdXFxzKlxcWyhbXlxcXV0qKVxcXS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLmdldFJlZ2V4KCl9LEc9ey4uLlcsZW1TdHJvbmdSRGVsaW1Bc3Q6SGUsZW1TdHJvbmdMRGVsaW06dmUsdXJsOmsoL14oKD86cHJvdG9jb2wpOlxcL1xcL3x3d3dcXC4pKD86W2EtekEtWjAtOVxcLV0rXFwuPykrW15cXHM8XSp8XmVtYWlsLykucmVwbGFjZShcInByb3RvY29sXCIsbmUpLnJlcGxhY2UoXCJlbWFpbFwiLC9bQS1aYS16MC05Ll8rLV0rKEApW2EtekEtWjAtOS1fXSsoPzpcXC5bYS16QS1aMC05LV9dKlthLXpBLVowLTldKSsoPyFbLV9dKS8pLmdldFJlZ2V4KCksX2JhY2twZWRhbDovKD86W14/IS4sOjsqXydcIn4oKSZdK3xcXChbXildKlxcKXwmKD8hW2EtekEtWjAtOV0rOyQpfFs/IS4sOjsqXydcIn4pXSsoPyEkKSkrLyxkZWw6L14ofn4/KSg/PVteXFxzfl0pKCg/OlxcXFxbXFxzXFxTXXxbXlxcXFxdKSo/KD86XFxcXFtcXHNcXFNdfFteXFxzflxcXFxdKSlcXDEoPz1bXn5dfCQpLyx0ZXh0OmsoL14oW2B+XSt8W15gfl0pKD86KD89IHsyLH1cXG4pfCg/PVthLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0rQCl8W1xcc1xcU10qPyg/Oig/PVtcXFxcPCFcXFtgKn5fXXxcXGJffHByb3RvY29sOlxcL1xcL3x3d3dcXC58JCl8W14gXSg/PSB7Mix9XFxuKXxbXmEtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXSg/PVthLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0rQCkpKS8pLnJlcGxhY2UoXCJwcm90b2NvbFwiLG5lKS5nZXRSZWdleCgpfSxXZT17Li4uRyxicjprKG9lKS5yZXBsYWNlKFwiezIsfVwiLFwiKlwiKS5nZXRSZWdleCgpLHRleHQ6ayhHLnRleHQpLnJlcGxhY2UoXCJcXFxcYl9cIixcIlxcXFxiX3wgezIsfVxcXFxuXCIpLnJlcGxhY2UoL1xcezIsXFx9L2csXCIqXCIpLmdldFJlZ2V4KCl9LEU9e25vcm1hbDpVLGdmbTpfZSxwZWRhbnRpYzpMZX0sTT17bm9ybWFsOlcsZ2ZtOkcsYnJlYWtzOldlLHBlZGFudGljOktlfTt2YXIgWGU9e1wiJlwiOlwiJmFtcDtcIixcIjxcIjpcIiZsdDtcIixcIj5cIjpcIiZndDtcIiwnXCInOlwiJnF1b3Q7XCIsXCInXCI6XCImIzM5O1wifSxrZT11PT5YZVt1XTtmdW5jdGlvbiB3KHUsZSl7aWYoZSl7aWYobS5lc2NhcGVUZXN0LnRlc3QodSkpcmV0dXJuIHUucmVwbGFjZShtLmVzY2FwZVJlcGxhY2Usa2UpfWVsc2UgaWYobS5lc2NhcGVUZXN0Tm9FbmNvZGUudGVzdCh1KSlyZXR1cm4gdS5yZXBsYWNlKG0uZXNjYXBlUmVwbGFjZU5vRW5jb2RlLGtlKTtyZXR1cm4gdX1mdW5jdGlvbiBYKHUpe3RyeXt1PWVuY29kZVVSSSh1KS5yZXBsYWNlKG0ucGVyY2VudERlY29kZSxcIiVcIil9Y2F0Y2h7cmV0dXJuIG51bGx9cmV0dXJuIHV9ZnVuY3Rpb24gSih1LGUpe2xldCB0PXUucmVwbGFjZShtLmZpbmRQaXBlLChpLHMsYSk9PntsZXQgbz0hMSxsPXM7Zm9yKDstLWw+PTAmJmFbbF09PT1cIlxcXFxcIjspbz0hbztyZXR1cm4gbz9cInxcIjpcIiB8XCJ9KSxuPXQuc3BsaXQobS5zcGxpdFBpcGUpLHI9MDtpZihuWzBdLnRyaW0oKXx8bi5zaGlmdCgpLG4ubGVuZ3RoPjAmJiFuLmF0KC0xKT8udHJpbSgpJiZuLnBvcCgpLGUpaWYobi5sZW5ndGg+ZSluLnNwbGljZShlKTtlbHNlIGZvcig7bi5sZW5ndGg8ZTspbi5wdXNoKFwiXCIpO2Zvcig7cjxuLmxlbmd0aDtyKyspbltyXT1uW3JdLnRyaW0oKS5yZXBsYWNlKG0uc2xhc2hQaXBlLFwifFwiKTtyZXR1cm4gbn1mdW5jdGlvbiB6KHUsZSx0KXtsZXQgbj11Lmxlbmd0aDtpZihuPT09MClyZXR1cm5cIlwiO2xldCByPTA7Zm9yKDtyPG47KXtsZXQgaT11LmNoYXJBdChuLXItMSk7aWYoaT09PWUmJiF0KXIrKztlbHNlIGlmKGkhPT1lJiZ0KXIrKztlbHNlIGJyZWFrfXJldHVybiB1LnNsaWNlKDAsbi1yKX1mdW5jdGlvbiBkZSh1LGUpe2lmKHUuaW5kZXhPZihlWzFdKT09PS0xKXJldHVybi0xO2xldCB0PTA7Zm9yKGxldCBuPTA7bjx1Lmxlbmd0aDtuKyspaWYodVtuXT09PVwiXFxcXFwiKW4rKztlbHNlIGlmKHVbbl09PT1lWzBdKXQrKztlbHNlIGlmKHVbbl09PT1lWzFdJiYodC0tLHQ8MCkpcmV0dXJuIG47cmV0dXJuIHQ+MD8tMjotMX1mdW5jdGlvbiBnZSh1LGUsdCxuLHIpe2xldCBpPWUuaHJlZixzPWUudGl0bGV8fG51bGwsYT11WzFdLnJlcGxhY2Uoci5vdGhlci5vdXRwdXRMaW5rUmVwbGFjZSxcIiQxXCIpO24uc3RhdGUuaW5MaW5rPSEwO2xldCBvPXt0eXBlOnVbMF0uY2hhckF0KDApPT09XCIhXCI/XCJpbWFnZVwiOlwibGlua1wiLHJhdzp0LGhyZWY6aSx0aXRsZTpzLHRleHQ6YSx0b2tlbnM6bi5pbmxpbmVUb2tlbnMoYSl9O3JldHVybiBuLnN0YXRlLmluTGluaz0hMSxvfWZ1bmN0aW9uIEplKHUsZSx0KXtsZXQgbj11Lm1hdGNoKHQub3RoZXIuaW5kZW50Q29kZUNvbXBlbnNhdGlvbik7aWYobj09PW51bGwpcmV0dXJuIGU7bGV0IHI9blsxXTtyZXR1cm4gZS5zcGxpdChgXG5gKS5tYXAoaT0+e2xldCBzPWkubWF0Y2godC5vdGhlci5iZWdpbm5pbmdTcGFjZSk7aWYocz09PW51bGwpcmV0dXJuIGk7bGV0W2FdPXM7cmV0dXJuIGEubGVuZ3RoPj1yLmxlbmd0aD9pLnNsaWNlKHIubGVuZ3RoKTppfSkuam9pbihgXG5gKX12YXIgeT1jbGFzc3tvcHRpb25zO3J1bGVzO2xleGVyO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxUfXNwYWNlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2submV3bGluZS5leGVjKGUpO2lmKHQmJnRbMF0ubGVuZ3RoPjApcmV0dXJue3R5cGU6XCJzcGFjZVwiLHJhdzp0WzBdfX1jb2RlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suY29kZS5leGVjKGUpO2lmKHQpe2xldCBuPXRbMF0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmNvZGVSZW1vdmVJbmRlbnQsXCJcIik7cmV0dXJue3R5cGU6XCJjb2RlXCIscmF3OnRbMF0sY29kZUJsb2NrU3R5bGU6XCJpbmRlbnRlZFwiLHRleHQ6dGhpcy5vcHRpb25zLnBlZGFudGljP246eihuLGBcbmApfX19ZmVuY2VzKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suZmVuY2VzLmV4ZWMoZSk7aWYodCl7bGV0IG49dFswXSxyPUplKG4sdFszXXx8XCJcIix0aGlzLnJ1bGVzKTtyZXR1cm57dHlwZTpcImNvZGVcIixyYXc6bixsYW5nOnRbMl0/dFsyXS50cmltKCkucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpOnRbMl0sdGV4dDpyfX19aGVhZGluZyhlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmhlYWRpbmcuZXhlYyhlKTtpZih0KXtsZXQgbj10WzJdLnRyaW0oKTtpZih0aGlzLnJ1bGVzLm90aGVyLmVuZGluZ0hhc2gudGVzdChuKSl7bGV0IHI9eihuLFwiI1wiKTsodGhpcy5vcHRpb25zLnBlZGFudGljfHwhcnx8dGhpcy5ydWxlcy5vdGhlci5lbmRpbmdTcGFjZUNoYXIudGVzdChyKSkmJihuPXIudHJpbSgpKX1yZXR1cm57dHlwZTpcImhlYWRpbmdcIixyYXc6dFswXSxkZXB0aDp0WzFdLmxlbmd0aCx0ZXh0Om4sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG4pfX19aHIoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5oci5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJoclwiLHJhdzp6KHRbMF0sYFxuYCl9fWJsb2NrcXVvdGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5ibG9ja3F1b3RlLmV4ZWMoZSk7aWYodCl7bGV0IG49eih0WzBdLGBcbmApLnNwbGl0KGBcbmApLHI9XCJcIixpPVwiXCIscz1bXTtmb3IoO24ubGVuZ3RoPjA7KXtsZXQgYT0hMSxvPVtdLGw7Zm9yKGw9MDtsPG4ubGVuZ3RoO2wrKylpZih0aGlzLnJ1bGVzLm90aGVyLmJsb2NrcXVvdGVTdGFydC50ZXN0KG5bbF0pKW8ucHVzaChuW2xdKSxhPSEwO2Vsc2UgaWYoIWEpby5wdXNoKG5bbF0pO2Vsc2UgYnJlYWs7bj1uLnNsaWNlKGwpO2xldCBwPW8uam9pbihgXG5gKSxjPXAucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmJsb2NrcXVvdGVTZXRleHRSZXBsYWNlLGBcbiAgICAkMWApLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5ibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZTIsXCJcIik7cj1yP2Ake3J9XG4ke3B9YDpwLGk9aT9gJHtpfVxuJHtjfWA6YztsZXQgZz10aGlzLmxleGVyLnN0YXRlLnRvcDtpZih0aGlzLmxleGVyLnN0YXRlLnRvcD0hMCx0aGlzLmxleGVyLmJsb2NrVG9rZW5zKGMscywhMCksdGhpcy5sZXhlci5zdGF0ZS50b3A9ZyxuLmxlbmd0aD09PTApYnJlYWs7bGV0IGg9cy5hdCgtMSk7aWYoaD8udHlwZT09PVwiY29kZVwiKWJyZWFrO2lmKGg/LnR5cGU9PT1cImJsb2NrcXVvdGVcIil7bGV0IFI9aCxmPVIucmF3K2BcbmArbi5qb2luKGBcbmApLE89dGhpcy5ibG9ja3F1b3RlKGYpO3Nbcy5sZW5ndGgtMV09TyxyPXIuc3Vic3RyaW5nKDAsci5sZW5ndGgtUi5yYXcubGVuZ3RoKStPLnJhdyxpPWkuc3Vic3RyaW5nKDAsaS5sZW5ndGgtUi50ZXh0Lmxlbmd0aCkrTy50ZXh0O2JyZWFrfWVsc2UgaWYoaD8udHlwZT09PVwibGlzdFwiKXtsZXQgUj1oLGY9Ui5yYXcrYFxuYCtuLmpvaW4oYFxuYCksTz10aGlzLmxpc3QoZik7c1tzLmxlbmd0aC0xXT1PLHI9ci5zdWJzdHJpbmcoMCxyLmxlbmd0aC1oLnJhdy5sZW5ndGgpK08ucmF3LGk9aS5zdWJzdHJpbmcoMCxpLmxlbmd0aC1SLnJhdy5sZW5ndGgpK08ucmF3LG49Zi5zdWJzdHJpbmcocy5hdCgtMSkucmF3Lmxlbmd0aCkuc3BsaXQoYFxuYCk7Y29udGludWV9fXJldHVybnt0eXBlOlwiYmxvY2txdW90ZVwiLHJhdzpyLHRva2VuczpzLHRleHQ6aX19fWxpc3QoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5saXN0LmV4ZWMoZSk7aWYodCl7bGV0IG49dFsxXS50cmltKCkscj1uLmxlbmd0aD4xLGk9e3R5cGU6XCJsaXN0XCIscmF3OlwiXCIsb3JkZXJlZDpyLHN0YXJ0OnI/K24uc2xpY2UoMCwtMSk6XCJcIixsb29zZTohMSxpdGVtczpbXX07bj1yP2BcXFxcZHsxLDl9XFxcXCR7bi5zbGljZSgtMSl9YDpgXFxcXCR7bn1gLHRoaXMub3B0aW9ucy5wZWRhbnRpYyYmKG49cj9uOlwiWyorLV1cIik7bGV0IHM9dGhpcy5ydWxlcy5vdGhlci5saXN0SXRlbVJlZ2V4KG4pLGE9ITE7Zm9yKDtlOyl7bGV0IGw9ITEscD1cIlwiLGM9XCJcIjtpZighKHQ9cy5leGVjKGUpKXx8dGhpcy5ydWxlcy5ibG9jay5oci50ZXN0KGUpKWJyZWFrO3A9dFswXSxlPWUuc3Vic3RyaW5nKHAubGVuZ3RoKTtsZXQgZz10WzJdLnNwbGl0KGBcbmAsMSlbMF0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFicyxPPT5cIiBcIi5yZXBlYXQoMypPLmxlbmd0aCkpLGg9ZS5zcGxpdChgXG5gLDEpWzBdLFI9IWcudHJpbSgpLGY9MDtpZih0aGlzLm9wdGlvbnMucGVkYW50aWM/KGY9MixjPWcudHJpbVN0YXJ0KCkpOlI/Zj10WzFdLmxlbmd0aCsxOihmPXRbMl0uc2VhcmNoKHRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyKSxmPWY+ND8xOmYsYz1nLnNsaWNlKGYpLGYrPXRbMV0ubGVuZ3RoKSxSJiZ0aGlzLnJ1bGVzLm90aGVyLmJsYW5rTGluZS50ZXN0KGgpJiYocCs9aCtgXG5gLGU9ZS5zdWJzdHJpbmcoaC5sZW5ndGgrMSksbD0hMCksIWwpe2xldCBPPXRoaXMucnVsZXMub3RoZXIubmV4dEJ1bGxldFJlZ2V4KGYpLFY9dGhpcy5ydWxlcy5vdGhlci5oclJlZ2V4KGYpLFk9dGhpcy5ydWxlcy5vdGhlci5mZW5jZXNCZWdpblJlZ2V4KGYpLGVlPXRoaXMucnVsZXMub3RoZXIuaGVhZGluZ0JlZ2luUmVnZXgoZiksZmU9dGhpcy5ydWxlcy5vdGhlci5odG1sQmVnaW5SZWdleChmKTtmb3IoO2U7KXtsZXQgSD1lLnNwbGl0KGBcbmAsMSlbMF0sQTtpZihoPUgsdGhpcy5vcHRpb25zLnBlZGFudGljPyhoPWgucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlTmVzdGluZyxcIiAgXCIpLEE9aCk6QT1oLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJDaGFyR2xvYmFsLFwiICAgIFwiKSxZLnRlc3QoaCl8fGVlLnRlc3QoaCl8fGZlLnRlc3QoaCl8fE8udGVzdChoKXx8Vi50ZXN0KGgpKWJyZWFrO2lmKEEuc2VhcmNoKHRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyKT49Znx8IWgudHJpbSgpKWMrPWBcbmArQS5zbGljZShmKTtlbHNle2lmKFJ8fGcucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYkNoYXJHbG9iYWwsXCIgICAgXCIpLnNlYXJjaCh0aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhcik+PTR8fFkudGVzdChnKXx8ZWUudGVzdChnKXx8Vi50ZXN0KGcpKWJyZWFrO2MrPWBcbmAraH0hUiYmIWgudHJpbSgpJiYoUj0hMCkscCs9SCtgXG5gLGU9ZS5zdWJzdHJpbmcoSC5sZW5ndGgrMSksZz1BLnNsaWNlKGYpfX1pLmxvb3NlfHwoYT9pLmxvb3NlPSEwOnRoaXMucnVsZXMub3RoZXIuZG91YmxlQmxhbmtMaW5lLnRlc3QocCkmJihhPSEwKSksaS5pdGVtcy5wdXNoKHt0eXBlOlwibGlzdF9pdGVtXCIscmF3OnAsdGFzazohIXRoaXMub3B0aW9ucy5nZm0mJnRoaXMucnVsZXMub3RoZXIubGlzdElzVGFzay50ZXN0KGMpLGxvb3NlOiExLHRleHQ6Yyx0b2tlbnM6W119KSxpLnJhdys9cH1sZXQgbz1pLml0ZW1zLmF0KC0xKTtpZihvKW8ucmF3PW8ucmF3LnRyaW1FbmQoKSxvLnRleHQ9by50ZXh0LnRyaW1FbmQoKTtlbHNlIHJldHVybjtpLnJhdz1pLnJhdy50cmltRW5kKCk7Zm9yKGxldCBsIG9mIGkuaXRlbXMpe2lmKHRoaXMubGV4ZXIuc3RhdGUudG9wPSExLGwudG9rZW5zPXRoaXMubGV4ZXIuYmxvY2tUb2tlbnMobC50ZXh0LFtdKSxsLnRhc2spe2lmKGwudGV4dD1sLnRleHQucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKSxsLnRva2Vuc1swXT8udHlwZT09PVwidGV4dFwifHxsLnRva2Vuc1swXT8udHlwZT09PVwicGFyYWdyYXBoXCIpe2wudG9rZW5zWzBdLnJhdz1sLnRva2Vuc1swXS5yYXcucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKSxsLnRva2Vuc1swXS50ZXh0PWwudG9rZW5zWzBdLnRleHQucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKTtmb3IobGV0IGM9dGhpcy5sZXhlci5pbmxpbmVRdWV1ZS5sZW5ndGgtMTtjPj0wO2MtLSlpZih0aGlzLnJ1bGVzLm90aGVyLmxpc3RJc1Rhc2sudGVzdCh0aGlzLmxleGVyLmlubGluZVF1ZXVlW2NdLnNyYykpe3RoaXMubGV4ZXIuaW5saW5lUXVldWVbY10uc3JjPXRoaXMubGV4ZXIuaW5saW5lUXVldWVbY10uc3JjLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIik7YnJlYWt9fWxldCBwPXRoaXMucnVsZXMub3RoZXIubGlzdFRhc2tDaGVja2JveC5leGVjKGwucmF3KTtpZihwKXtsZXQgYz17dHlwZTpcImNoZWNrYm94XCIscmF3OnBbMF0rXCIgXCIsY2hlY2tlZDpwWzBdIT09XCJbIF1cIn07bC5jaGVja2VkPWMuY2hlY2tlZCxpLmxvb3NlP2wudG9rZW5zWzBdJiZbXCJwYXJhZ3JhcGhcIixcInRleHRcIl0uaW5jbHVkZXMobC50b2tlbnNbMF0udHlwZSkmJlwidG9rZW5zXCJpbiBsLnRva2Vuc1swXSYmbC50b2tlbnNbMF0udG9rZW5zPyhsLnRva2Vuc1swXS5yYXc9Yy5yYXcrbC50b2tlbnNbMF0ucmF3LGwudG9rZW5zWzBdLnRleHQ9Yy5yYXcrbC50b2tlbnNbMF0udGV4dCxsLnRva2Vuc1swXS50b2tlbnMudW5zaGlmdChjKSk6bC50b2tlbnMudW5zaGlmdCh7dHlwZTpcInBhcmFncmFwaFwiLHJhdzpjLnJhdyx0ZXh0OmMucmF3LHRva2VuczpbY119KTpsLnRva2Vucy51bnNoaWZ0KGMpfX1pZighaS5sb29zZSl7bGV0IHA9bC50b2tlbnMuZmlsdGVyKGc9PmcudHlwZT09PVwic3BhY2VcIiksYz1wLmxlbmd0aD4wJiZwLnNvbWUoZz0+dGhpcy5ydWxlcy5vdGhlci5hbnlMaW5lLnRlc3QoZy5yYXcpKTtpLmxvb3NlPWN9fWlmKGkubG9vc2UpZm9yKGxldCBsIG9mIGkuaXRlbXMpe2wubG9vc2U9ITA7Zm9yKGxldCBwIG9mIGwudG9rZW5zKXAudHlwZT09PVwidGV4dFwiJiYocC50eXBlPVwicGFyYWdyYXBoXCIpfXJldHVybiBpfX1odG1sKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suaHRtbC5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJodG1sXCIsYmxvY2s6ITAscmF3OnRbMF0scHJlOnRbMV09PT1cInByZVwifHx0WzFdPT09XCJzY3JpcHRcInx8dFsxXT09PVwic3R5bGVcIix0ZXh0OnRbMF19fWRlZihlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmRlZi5leGVjKGUpO2lmKHQpe2xldCBuPXRbMV0udG9Mb3dlckNhc2UoKS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubXVsdGlwbGVTcGFjZUdsb2JhbCxcIiBcIikscj10WzJdP3RbMl0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmhyZWZCcmFja2V0cyxcIiQxXCIpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKTpcIlwiLGk9dFszXT90WzNdLnN1YnN0cmluZygxLHRbM10ubGVuZ3RoLTEpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKTp0WzNdO3JldHVybnt0eXBlOlwiZGVmXCIsdGFnOm4scmF3OnRbMF0saHJlZjpyLHRpdGxlOml9fX10YWJsZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLnRhYmxlLmV4ZWMoZSk7aWYoIXR8fCF0aGlzLnJ1bGVzLm90aGVyLnRhYmxlRGVsaW1pdGVyLnRlc3QodFsyXSkpcmV0dXJuO2xldCBuPUoodFsxXSkscj10WzJdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduQ2hhcnMsXCJcIikuc3BsaXQoXCJ8XCIpLGk9dFszXT8udHJpbSgpP3RbM10ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYmxlUm93QmxhbmtMaW5lLFwiXCIpLnNwbGl0KGBcbmApOltdLHM9e3R5cGU6XCJ0YWJsZVwiLHJhdzp0WzBdLGhlYWRlcjpbXSxhbGlnbjpbXSxyb3dzOltdfTtpZihuLmxlbmd0aD09PXIubGVuZ3RoKXtmb3IobGV0IGEgb2Ygcil0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25SaWdodC50ZXN0KGEpP3MuYWxpZ24ucHVzaChcInJpZ2h0XCIpOnRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnbkNlbnRlci50ZXN0KGEpP3MuYWxpZ24ucHVzaChcImNlbnRlclwiKTp0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25MZWZ0LnRlc3QoYSk/cy5hbGlnbi5wdXNoKFwibGVmdFwiKTpzLmFsaWduLnB1c2gobnVsbCk7Zm9yKGxldCBhPTA7YTxuLmxlbmd0aDthKyspcy5oZWFkZXIucHVzaCh7dGV4dDpuW2FdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShuW2FdKSxoZWFkZXI6ITAsYWxpZ246cy5hbGlnblthXX0pO2ZvcihsZXQgYSBvZiBpKXMucm93cy5wdXNoKEooYSxzLmhlYWRlci5sZW5ndGgpLm1hcCgobyxsKT0+KHt0ZXh0Om8sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG8pLGhlYWRlcjohMSxhbGlnbjpzLmFsaWduW2xdfSkpKTtyZXR1cm4gc319bGhlYWRpbmcoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5saGVhZGluZy5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJoZWFkaW5nXCIscmF3OnRbMF0sZGVwdGg6dFsyXS5jaGFyQXQoMCk9PT1cIj1cIj8xOjIsdGV4dDp0WzFdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZSh0WzFdKX19cGFyYWdyYXBoKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2sucGFyYWdyYXBoLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsxXS5jaGFyQXQodFsxXS5sZW5ndGgtMSk9PT1gXG5gP3RbMV0uc2xpY2UoMCwtMSk6dFsxXTtyZXR1cm57dHlwZTpcInBhcmFncmFwaFwiLHJhdzp0WzBdLHRleHQ6bix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUobil9fX10ZXh0KGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2sudGV4dC5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJ0ZXh0XCIscmF3OnRbMF0sdGV4dDp0WzBdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZSh0WzBdKX19ZXNjYXBlKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmVzY2FwZS5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJlc2NhcGVcIixyYXc6dFswXSx0ZXh0OnRbMV19fXRhZyhlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS50YWcuZXhlYyhlKTtpZih0KXJldHVybiF0aGlzLmxleGVyLnN0YXRlLmluTGluayYmdGhpcy5ydWxlcy5vdGhlci5zdGFydEFUYWcudGVzdCh0WzBdKT90aGlzLmxleGVyLnN0YXRlLmluTGluaz0hMDp0aGlzLmxleGVyLnN0YXRlLmluTGluayYmdGhpcy5ydWxlcy5vdGhlci5lbmRBVGFnLnRlc3QodFswXSkmJih0aGlzLmxleGVyLnN0YXRlLmluTGluaz0hMSksIXRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayYmdGhpcy5ydWxlcy5vdGhlci5zdGFydFByZVNjcmlwdFRhZy50ZXN0KHRbMF0pP3RoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jaz0hMDp0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2smJnRoaXMucnVsZXMub3RoZXIuZW5kUHJlU2NyaXB0VGFnLnRlc3QodFswXSkmJih0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2s9ITEpLHt0eXBlOlwiaHRtbFwiLHJhdzp0WzBdLGluTGluazp0aGlzLmxleGVyLnN0YXRlLmluTGluayxpblJhd0Jsb2NrOnRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayxibG9jazohMSx0ZXh0OnRbMF19fWxpbmsoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUubGluay5leGVjKGUpO2lmKHQpe2xldCBuPXRbMl0udHJpbSgpO2lmKCF0aGlzLm9wdGlvbnMucGVkYW50aWMmJnRoaXMucnVsZXMub3RoZXIuc3RhcnRBbmdsZUJyYWNrZXQudGVzdChuKSl7aWYoIXRoaXMucnVsZXMub3RoZXIuZW5kQW5nbGVCcmFja2V0LnRlc3QobikpcmV0dXJuO2xldCBzPXoobi5zbGljZSgwLC0xKSxcIlxcXFxcIik7aWYoKG4ubGVuZ3RoLXMubGVuZ3RoKSUyPT09MClyZXR1cm59ZWxzZXtsZXQgcz1kZSh0WzJdLFwiKClcIik7aWYocz09PS0yKXJldHVybjtpZihzPi0xKXtsZXQgbz0odFswXS5pbmRleE9mKFwiIVwiKT09PTA/NTo0KSt0WzFdLmxlbmd0aCtzO3RbMl09dFsyXS5zdWJzdHJpbmcoMCxzKSx0WzBdPXRbMF0uc3Vic3RyaW5nKDAsbykudHJpbSgpLHRbM109XCJcIn19bGV0IHI9dFsyXSxpPVwiXCI7aWYodGhpcy5vcHRpb25zLnBlZGFudGljKXtsZXQgcz10aGlzLnJ1bGVzLm90aGVyLnBlZGFudGljSHJlZlRpdGxlLmV4ZWMocik7cyYmKHI9c1sxXSxpPXNbM10pfWVsc2UgaT10WzNdP3RbM10uc2xpY2UoMSwtMSk6XCJcIjtyZXR1cm4gcj1yLnRyaW0oKSx0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0QW5nbGVCcmFja2V0LnRlc3QocikmJih0aGlzLm9wdGlvbnMucGVkYW50aWMmJiF0aGlzLnJ1bGVzLm90aGVyLmVuZEFuZ2xlQnJhY2tldC50ZXN0KG4pP3I9ci5zbGljZSgxKTpyPXIuc2xpY2UoMSwtMSkpLGdlKHQse2hyZWY6ciYmci5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIiksdGl0bGU6aSYmaS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIil9LHRbMF0sdGhpcy5sZXhlcix0aGlzLnJ1bGVzKX19cmVmbGluayhlLHQpe2xldCBuO2lmKChuPXRoaXMucnVsZXMuaW5saW5lLnJlZmxpbmsuZXhlYyhlKSl8fChuPXRoaXMucnVsZXMuaW5saW5lLm5vbGluay5leGVjKGUpKSl7bGV0IHI9KG5bMl18fG5bMV0pLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5tdWx0aXBsZVNwYWNlR2xvYmFsLFwiIFwiKSxpPXRbci50b0xvd2VyQ2FzZSgpXTtpZighaSl7bGV0IHM9blswXS5jaGFyQXQoMCk7cmV0dXJue3R5cGU6XCJ0ZXh0XCIscmF3OnMsdGV4dDpzfX1yZXR1cm4gZ2UobixpLG5bMF0sdGhpcy5sZXhlcix0aGlzLnJ1bGVzKX19ZW1TdHJvbmcoZSx0LG49XCJcIil7bGV0IHI9dGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmdMRGVsaW0uZXhlYyhlKTtpZighcnx8clszXSYmbi5tYXRjaCh0aGlzLnJ1bGVzLm90aGVyLnVuaWNvZGVBbHBoYU51bWVyaWMpKXJldHVybjtpZighKHJbMV18fHJbMl18fFwiXCIpfHwhbnx8dGhpcy5ydWxlcy5pbmxpbmUucHVuY3R1YXRpb24uZXhlYyhuKSl7bGV0IHM9Wy4uLnJbMF1dLmxlbmd0aC0xLGEsbyxsPXMscD0wLGM9clswXVswXT09PVwiKlwiP3RoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nUkRlbGltQXN0OnRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nUkRlbGltVW5kO2ZvcihjLmxhc3RJbmRleD0wLHQ9dC5zbGljZSgtMSplLmxlbmd0aCtzKTsocj1jLmV4ZWModCkpIT1udWxsOyl7aWYoYT1yWzFdfHxyWzJdfHxyWzNdfHxyWzRdfHxyWzVdfHxyWzZdLCFhKWNvbnRpbnVlO2lmKG89Wy4uLmFdLmxlbmd0aCxyWzNdfHxyWzRdKXtsKz1vO2NvbnRpbnVlfWVsc2UgaWYoKHJbNV18fHJbNl0pJiZzJTMmJiEoKHMrbyklMykpe3ArPW87Y29udGludWV9aWYobC09byxsPjApY29udGludWU7bz1NYXRoLm1pbihvLG8rbCtwKTtsZXQgZz1bLi4uclswXV1bMF0ubGVuZ3RoLGg9ZS5zbGljZSgwLHMrci5pbmRleCtnK28pO2lmKE1hdGgubWluKHMsbyklMil7bGV0IGY9aC5zbGljZSgxLC0xKTtyZXR1cm57dHlwZTpcImVtXCIscmF3OmgsdGV4dDpmLHRva2Vuczp0aGlzLmxleGVyLmlubGluZVRva2VucyhmKX19bGV0IFI9aC5zbGljZSgyLC0yKTtyZXR1cm57dHlwZTpcInN0cm9uZ1wiLHJhdzpoLHRleHQ6Uix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmVUb2tlbnMoUil9fX19Y29kZXNwYW4oZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuY29kZS5leGVjKGUpO2lmKHQpe2xldCBuPXRbMl0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLm5ld0xpbmVDaGFyR2xvYmFsLFwiIFwiKSxyPXRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyLnRlc3QobiksaT10aGlzLnJ1bGVzLm90aGVyLnN0YXJ0aW5nU3BhY2VDaGFyLnRlc3QobikmJnRoaXMucnVsZXMub3RoZXIuZW5kaW5nU3BhY2VDaGFyLnRlc3Qobik7cmV0dXJuIHImJmkmJihuPW4uc3Vic3RyaW5nKDEsbi5sZW5ndGgtMSkpLHt0eXBlOlwiY29kZXNwYW5cIixyYXc6dFswXSx0ZXh0Om59fX1icihlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5ici5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJiclwiLHJhdzp0WzBdfX1kZWwoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuZGVsLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImRlbFwiLHJhdzp0WzBdLHRleHQ6dFsyXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmVUb2tlbnModFsyXSl9fWF1dG9saW5rKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmF1dG9saW5rLmV4ZWMoZSk7aWYodCl7bGV0IG4scjtyZXR1cm4gdFsyXT09PVwiQFwiPyhuPXRbMV0scj1cIm1haWx0bzpcIituKToobj10WzFdLHI9bikse3R5cGU6XCJsaW5rXCIscmF3OnRbMF0sdGV4dDpuLGhyZWY6cix0b2tlbnM6W3t0eXBlOlwidGV4dFwiLHJhdzpuLHRleHQ6bn1dfX19dXJsKGUpe2xldCB0O2lmKHQ9dGhpcy5ydWxlcy5pbmxpbmUudXJsLmV4ZWMoZSkpe2xldCBuLHI7aWYodFsyXT09PVwiQFwiKW49dFswXSxyPVwibWFpbHRvOlwiK247ZWxzZXtsZXQgaTtkbyBpPXRbMF0sdFswXT10aGlzLnJ1bGVzLmlubGluZS5fYmFja3BlZGFsLmV4ZWModFswXSk/LlswXT8/XCJcIjt3aGlsZShpIT09dFswXSk7bj10WzBdLHRbMV09PT1cInd3dy5cIj9yPVwiaHR0cDovL1wiK3RbMF06cj10WzBdfXJldHVybnt0eXBlOlwibGlua1wiLHJhdzp0WzBdLHRleHQ6bixocmVmOnIsdG9rZW5zOlt7dHlwZTpcInRleHRcIixyYXc6bix0ZXh0Om59XX19fWlubGluZVRleHQoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUudGV4dC5leGVjKGUpO2lmKHQpe2xldCBuPXRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jaztyZXR1cm57dHlwZTpcInRleHRcIixyYXc6dFswXSx0ZXh0OnRbMF0sZXNjYXBlZDpufX19fTt2YXIgeD1jbGFzcyB1e3Rva2VucztvcHRpb25zO3N0YXRlO2lubGluZVF1ZXVlO3Rva2VuaXplcjtjb25zdHJ1Y3RvcihlKXt0aGlzLnRva2Vucz1bXSx0aGlzLnRva2Vucy5saW5rcz1PYmplY3QuY3JlYXRlKG51bGwpLHRoaXMub3B0aW9ucz1lfHxULHRoaXMub3B0aW9ucy50b2tlbml6ZXI9dGhpcy5vcHRpb25zLnRva2VuaXplcnx8bmV3IHksdGhpcy50b2tlbml6ZXI9dGhpcy5vcHRpb25zLnRva2VuaXplcix0aGlzLnRva2VuaXplci5vcHRpb25zPXRoaXMub3B0aW9ucyx0aGlzLnRva2VuaXplci5sZXhlcj10aGlzLHRoaXMuaW5saW5lUXVldWU9W10sdGhpcy5zdGF0ZT17aW5MaW5rOiExLGluUmF3QmxvY2s6ITEsdG9wOiEwfTtsZXQgdD17b3RoZXI6bSxibG9jazpFLm5vcm1hbCxpbmxpbmU6TS5ub3JtYWx9O3RoaXMub3B0aW9ucy5wZWRhbnRpYz8odC5ibG9jaz1FLnBlZGFudGljLHQuaW5saW5lPU0ucGVkYW50aWMpOnRoaXMub3B0aW9ucy5nZm0mJih0LmJsb2NrPUUuZ2ZtLHRoaXMub3B0aW9ucy5icmVha3M/dC5pbmxpbmU9TS5icmVha3M6dC5pbmxpbmU9TS5nZm0pLHRoaXMudG9rZW5pemVyLnJ1bGVzPXR9c3RhdGljIGdldCBydWxlcygpe3JldHVybntibG9jazpFLGlubGluZTpNfX1zdGF0aWMgbGV4KGUsdCl7cmV0dXJuIG5ldyB1KHQpLmxleChlKX1zdGF0aWMgbGV4SW5saW5lKGUsdCl7cmV0dXJuIG5ldyB1KHQpLmlubGluZVRva2VucyhlKX1sZXgoZSl7ZT1lLnJlcGxhY2UobS5jYXJyaWFnZVJldHVybixgXG5gKSx0aGlzLmJsb2NrVG9rZW5zKGUsdGhpcy50b2tlbnMpO2ZvcihsZXQgdD0wO3Q8dGhpcy5pbmxpbmVRdWV1ZS5sZW5ndGg7dCsrKXtsZXQgbj10aGlzLmlubGluZVF1ZXVlW3RdO3RoaXMuaW5saW5lVG9rZW5zKG4uc3JjLG4udG9rZW5zKX1yZXR1cm4gdGhpcy5pbmxpbmVRdWV1ZT1bXSx0aGlzLnRva2Vuc31ibG9ja1Rva2VucyhlLHQ9W10sbj0hMSl7Zm9yKHRoaXMub3B0aW9ucy5wZWRhbnRpYyYmKGU9ZS5yZXBsYWNlKG0udGFiQ2hhckdsb2JhbCxcIiAgICBcIikucmVwbGFjZShtLnNwYWNlTGluZSxcIlwiKSk7ZTspe2xldCByO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5ibG9jaz8uc29tZShzPT4ocj1zLmNhbGwoe2xleGVyOnRoaXN9LGUsdCkpPyhlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpLCEwKTohMSkpY29udGludWU7aWYocj10aGlzLnRva2VuaXplci5zcGFjZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3IucmF3Lmxlbmd0aD09PTEmJnMhPT12b2lkIDA/cy5yYXcrPWBcbmA6dC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuY29kZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3M/LnR5cGU9PT1cInBhcmFncmFwaFwifHxzPy50eXBlPT09XCJ0ZXh0XCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci50ZXh0LHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmZlbmNlcyhlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmhlYWRpbmcoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5ocihlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmJsb2NrcXVvdGUoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5saXN0KGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuaHRtbChlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmRlZihlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3M/LnR5cGU9PT1cInBhcmFncmFwaFwifHxzPy50eXBlPT09XCJ0ZXh0XCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci5yYXcsdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dGhpcy50b2tlbnMubGlua3Nbci50YWddfHwodGhpcy50b2tlbnMubGlua3Nbci50YWddPXtocmVmOnIuaHJlZix0aXRsZTpyLnRpdGxlfSx0LnB1c2gocikpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIudGFibGUoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5saGVhZGluZyhlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1sZXQgaT1lO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5zdGFydEJsb2NrKXtsZXQgcz0xLzAsYT1lLnNsaWNlKDEpLG87dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRCbG9jay5mb3JFYWNoKGw9PntvPWwuY2FsbCh7bGV4ZXI6dGhpc30sYSksdHlwZW9mIG89PVwibnVtYmVyXCImJm8+PTAmJihzPU1hdGgubWluKHMsbykpfSksczwxLzAmJnM+PTAmJihpPWUuc3Vic3RyaW5nKDAscysxKSl9aWYodGhpcy5zdGF0ZS50b3AmJihyPXRoaXMudG9rZW5pemVyLnBhcmFncmFwaChpKSkpe2xldCBzPXQuYXQoLTEpO24mJnM/LnR5cGU9PT1cInBhcmFncmFwaFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IudGV4dCx0aGlzLmlubGluZVF1ZXVlLnBvcCgpLHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnQucHVzaChyKSxuPWkubGVuZ3RoIT09ZS5sZW5ndGgsZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIudGV4dChlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3M/LnR5cGU9PT1cInRleHRcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnRleHQsdGhpcy5pbmxpbmVRdWV1ZS5wb3AoKSx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0LnB1c2gocik7Y29udGludWV9aWYoZSl7bGV0IHM9XCJJbmZpbml0ZSBsb29wIG9uIGJ5dGU6IFwiK2UuY2hhckNvZGVBdCgwKTtpZih0aGlzLm9wdGlvbnMuc2lsZW50KXtjb25zb2xlLmVycm9yKHMpO2JyZWFrfWVsc2UgdGhyb3cgbmV3IEVycm9yKHMpfX1yZXR1cm4gdGhpcy5zdGF0ZS50b3A9ITAsdH1pbmxpbmUoZSx0PVtdKXtyZXR1cm4gdGhpcy5pbmxpbmVRdWV1ZS5wdXNoKHtzcmM6ZSx0b2tlbnM6dH0pLHR9aW5saW5lVG9rZW5zKGUsdD1bXSl7bGV0IG49ZSxyPW51bGw7aWYodGhpcy50b2tlbnMubGlua3Mpe2xldCBvPU9iamVjdC5rZXlzKHRoaXMudG9rZW5zLmxpbmtzKTtpZihvLmxlbmd0aD4wKWZvcig7KHI9dGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLnJlZmxpbmtTZWFyY2guZXhlYyhuKSkhPW51bGw7KW8uaW5jbHVkZXMoclswXS5zbGljZShyWzBdLmxhc3RJbmRleE9mKFwiW1wiKSsxLC0xKSkmJihuPW4uc2xpY2UoMCxyLmluZGV4KStcIltcIitcImFcIi5yZXBlYXQoclswXS5sZW5ndGgtMikrXCJdXCIrbi5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUucmVmbGlua1NlYXJjaC5sYXN0SW5kZXgpKX1mb3IoOyhyPXRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbi5leGVjKG4pKSE9bnVsbDspbj1uLnNsaWNlKDAsci5pbmRleCkrXCIrK1wiK24uc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLmxhc3RJbmRleCk7bGV0IGk7Zm9yKDsocj10aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYmxvY2tTa2lwLmV4ZWMobikpIT1udWxsOylpPXJbMl0/clsyXS5sZW5ndGg6MCxuPW4uc2xpY2UoMCxyLmluZGV4K2kpK1wiW1wiK1wiYVwiLnJlcGVhdChyWzBdLmxlbmd0aC1pLTIpK1wiXVwiK24uc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmJsb2NrU2tpcC5sYXN0SW5kZXgpO249dGhpcy5vcHRpb25zLmhvb2tzPy5lbVN0cm9uZ01hc2s/LmNhbGwoe2xleGVyOnRoaXN9LG4pPz9uO2xldCBzPSExLGE9XCJcIjtmb3IoO2U7KXtzfHwoYT1cIlwiKSxzPSExO2xldCBvO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5pbmxpbmU/LnNvbWUocD0+KG89cC5jYWxsKHtsZXhlcjp0aGlzfSxlLHQpKT8oZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKSwhMCk6ITEpKWNvbnRpbnVlO2lmKG89dGhpcy50b2tlbml6ZXIuZXNjYXBlKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIudGFnKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIubGluayhlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLnJlZmxpbmsoZSx0aGlzLnRva2Vucy5saW5rcykpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKTtsZXQgcD10LmF0KC0xKTtvLnR5cGU9PT1cInRleHRcIiYmcD8udHlwZT09PVwidGV4dFwiPyhwLnJhdys9by5yYXcscC50ZXh0Kz1vLnRleHQpOnQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmVtU3Ryb25nKGUsbixhKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmNvZGVzcGFuKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuYnIoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5kZWwoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5hdXRvbGluayhlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZighdGhpcy5zdGF0ZS5pbkxpbmsmJihvPXRoaXMudG9rZW5pemVyLnVybChlKSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9bGV0IGw9ZTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uc3RhcnRJbmxpbmUpe2xldCBwPTEvMCxjPWUuc2xpY2UoMSksZzt0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5zdGFydElubGluZS5mb3JFYWNoKGg9PntnPWguY2FsbCh7bGV4ZXI6dGhpc30sYyksdHlwZW9mIGc9PVwibnVtYmVyXCImJmc+PTAmJihwPU1hdGgubWluKHAsZykpfSkscDwxLzAmJnA+PTAmJihsPWUuc3Vic3RyaW5nKDAscCsxKSl9aWYobz10aGlzLnRva2VuaXplci5pbmxpbmVUZXh0KGwpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksby5yYXcuc2xpY2UoLTEpIT09XCJfXCImJihhPW8ucmF3LnNsaWNlKC0xKSkscz0hMDtsZXQgcD10LmF0KC0xKTtwPy50eXBlPT09XCJ0ZXh0XCI/KHAucmF3Kz1vLnJhdyxwLnRleHQrPW8udGV4dCk6dC5wdXNoKG8pO2NvbnRpbnVlfWlmKGUpe2xldCBwPVwiSW5maW5pdGUgbG9vcCBvbiBieXRlOiBcIitlLmNoYXJDb2RlQXQoMCk7aWYodGhpcy5vcHRpb25zLnNpbGVudCl7Y29uc29sZS5lcnJvcihwKTticmVha31lbHNlIHRocm93IG5ldyBFcnJvcihwKX19cmV0dXJuIHR9fTt2YXIgUD1jbGFzc3tvcHRpb25zO3BhcnNlcjtjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VH1zcGFjZShlKXtyZXR1cm5cIlwifWNvZGUoe3RleHQ6ZSxsYW5nOnQsZXNjYXBlZDpufSl7bGV0IHI9KHR8fFwiXCIpLm1hdGNoKG0ubm90U3BhY2VTdGFydCk/LlswXSxpPWUucmVwbGFjZShtLmVuZGluZ05ld2xpbmUsXCJcIikrYFxuYDtyZXR1cm4gcj8nPHByZT48Y29kZSBjbGFzcz1cImxhbmd1YWdlLScrdyhyKSsnXCI+Jysobj9pOncoaSwhMCkpK2A8L2NvZGU+PC9wcmU+XG5gOlwiPHByZT48Y29kZT5cIisobj9pOncoaSwhMCkpK2A8L2NvZGU+PC9wcmU+XG5gfWJsb2NrcXVvdGUoe3Rva2VuczplfSl7cmV0dXJuYDxibG9ja3F1b3RlPlxuJHt0aGlzLnBhcnNlci5wYXJzZShlKX08L2Jsb2NrcXVvdGU+XG5gfWh0bWwoe3RleHQ6ZX0pe3JldHVybiBlfWRlZihlKXtyZXR1cm5cIlwifWhlYWRpbmcoe3Rva2VuczplLGRlcHRoOnR9KXtyZXR1cm5gPGgke3R9PiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9oJHt0fT5cbmB9aHIoZSl7cmV0dXJuYDxocj5cbmB9bGlzdChlKXtsZXQgdD1lLm9yZGVyZWQsbj1lLnN0YXJ0LHI9XCJcIjtmb3IobGV0IGE9MDthPGUuaXRlbXMubGVuZ3RoO2ErKyl7bGV0IG89ZS5pdGVtc1thXTtyKz10aGlzLmxpc3RpdGVtKG8pfWxldCBpPXQ/XCJvbFwiOlwidWxcIixzPXQmJm4hPT0xPycgc3RhcnQ9XCInK24rJ1wiJzpcIlwiO3JldHVyblwiPFwiK2krcytgPlxuYCtyK1wiPC9cIitpK2A+XG5gfWxpc3RpdGVtKGUpe3JldHVybmA8bGk+JHt0aGlzLnBhcnNlci5wYXJzZShlLnRva2Vucyl9PC9saT5cbmB9Y2hlY2tib3goe2NoZWNrZWQ6ZX0pe3JldHVyblwiPGlucHV0IFwiKyhlPydjaGVja2VkPVwiXCIgJzpcIlwiKSsnZGlzYWJsZWQ9XCJcIiB0eXBlPVwiY2hlY2tib3hcIj4gJ31wYXJhZ3JhcGgoe3Rva2VuczplfSl7cmV0dXJuYDxwPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9wPlxuYH10YWJsZShlKXtsZXQgdD1cIlwiLG49XCJcIjtmb3IobGV0IGk9MDtpPGUuaGVhZGVyLmxlbmd0aDtpKyspbis9dGhpcy50YWJsZWNlbGwoZS5oZWFkZXJbaV0pO3QrPXRoaXMudGFibGVyb3coe3RleHQ6bn0pO2xldCByPVwiXCI7Zm9yKGxldCBpPTA7aTxlLnJvd3MubGVuZ3RoO2krKyl7bGV0IHM9ZS5yb3dzW2ldO249XCJcIjtmb3IobGV0IGE9MDthPHMubGVuZ3RoO2ErKyluKz10aGlzLnRhYmxlY2VsbChzW2FdKTtyKz10aGlzLnRhYmxlcm93KHt0ZXh0Om59KX1yZXR1cm4gciYmKHI9YDx0Ym9keT4ke3J9PC90Ym9keT5gKSxgPHRhYmxlPlxuPHRoZWFkPlxuYCt0K2A8L3RoZWFkPlxuYCtyK2A8L3RhYmxlPlxuYH10YWJsZXJvdyh7dGV4dDplfSl7cmV0dXJuYDx0cj5cbiR7ZX08L3RyPlxuYH10YWJsZWNlbGwoZSl7bGV0IHQ9dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZS50b2tlbnMpLG49ZS5oZWFkZXI/XCJ0aFwiOlwidGRcIjtyZXR1cm4oZS5hbGlnbj9gPCR7bn0gYWxpZ249XCIke2UuYWxpZ259XCI+YDpgPCR7bn0+YCkrdCtgPC8ke259PlxuYH1zdHJvbmcoe3Rva2VuczplfSl7cmV0dXJuYDxzdHJvbmc+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L3N0cm9uZz5gfWVtKHt0b2tlbnM6ZX0pe3JldHVybmA8ZW0+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L2VtPmB9Y29kZXNwYW4oe3RleHQ6ZX0pe3JldHVybmA8Y29kZT4ke3coZSwhMCl9PC9jb2RlPmB9YnIoZSl7cmV0dXJuXCI8YnI+XCJ9ZGVsKHt0b2tlbnM6ZX0pe3JldHVybmA8ZGVsPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9kZWw+YH1saW5rKHtocmVmOmUsdGl0bGU6dCx0b2tlbnM6bn0pe2xldCByPXRoaXMucGFyc2VyLnBhcnNlSW5saW5lKG4pLGk9WChlKTtpZihpPT09bnVsbClyZXR1cm4gcjtlPWk7bGV0IHM9JzxhIGhyZWY9XCInK2UrJ1wiJztyZXR1cm4gdCYmKHMrPScgdGl0bGU9XCInK3codCkrJ1wiJykscys9XCI+XCIrcitcIjwvYT5cIixzfWltYWdlKHtocmVmOmUsdGl0bGU6dCx0ZXh0Om4sdG9rZW5zOnJ9KXtyJiYobj10aGlzLnBhcnNlci5wYXJzZUlubGluZShyLHRoaXMucGFyc2VyLnRleHRSZW5kZXJlcikpO2xldCBpPVgoZSk7aWYoaT09PW51bGwpcmV0dXJuIHcobik7ZT1pO2xldCBzPWA8aW1nIHNyYz1cIiR7ZX1cIiBhbHQ9XCIke259XCJgO3JldHVybiB0JiYocys9YCB0aXRsZT1cIiR7dyh0KX1cImApLHMrPVwiPlwiLHN9dGV4dChlKXtyZXR1cm5cInRva2Vuc1wiaW4gZSYmZS50b2tlbnM/dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZS50b2tlbnMpOlwiZXNjYXBlZFwiaW4gZSYmZS5lc2NhcGVkP2UudGV4dDp3KGUudGV4dCl9fTt2YXIgJD1jbGFzc3tzdHJvbmcoe3RleHQ6ZX0pe3JldHVybiBlfWVtKHt0ZXh0OmV9KXtyZXR1cm4gZX1jb2Rlc3Bhbih7dGV4dDplfSl7cmV0dXJuIGV9ZGVsKHt0ZXh0OmV9KXtyZXR1cm4gZX1odG1sKHt0ZXh0OmV9KXtyZXR1cm4gZX10ZXh0KHt0ZXh0OmV9KXtyZXR1cm4gZX1saW5rKHt0ZXh0OmV9KXtyZXR1cm5cIlwiK2V9aW1hZ2Uoe3RleHQ6ZX0pe3JldHVyblwiXCIrZX1icigpe3JldHVyblwiXCJ9Y2hlY2tib3goe3JhdzplfSl7cmV0dXJuIGV9fTt2YXIgYj1jbGFzcyB1e29wdGlvbnM7cmVuZGVyZXI7dGV4dFJlbmRlcmVyO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxULHRoaXMub3B0aW9ucy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXJ8fG5ldyBQLHRoaXMucmVuZGVyZXI9dGhpcy5vcHRpb25zLnJlbmRlcmVyLHRoaXMucmVuZGVyZXIub3B0aW9ucz10aGlzLm9wdGlvbnMsdGhpcy5yZW5kZXJlci5wYXJzZXI9dGhpcyx0aGlzLnRleHRSZW5kZXJlcj1uZXcgJH1zdGF0aWMgcGFyc2UoZSx0KXtyZXR1cm4gbmV3IHUodCkucGFyc2UoZSl9c3RhdGljIHBhcnNlSW5saW5lKGUsdCl7cmV0dXJuIG5ldyB1KHQpLnBhcnNlSW5saW5lKGUpfXBhcnNlKGUpe2xldCB0PVwiXCI7Zm9yKGxldCBuPTA7bjxlLmxlbmd0aDtuKyspe2xldCByPWVbbl07aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnJlbmRlcmVycz8uW3IudHlwZV0pe2xldCBzPXIsYT10aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5yZW5kZXJlcnNbcy50eXBlXS5jYWxsKHtwYXJzZXI6dGhpc30scyk7aWYoYSE9PSExfHwhW1wic3BhY2VcIixcImhyXCIsXCJoZWFkaW5nXCIsXCJjb2RlXCIsXCJ0YWJsZVwiLFwiYmxvY2txdW90ZVwiLFwibGlzdFwiLFwiaHRtbFwiLFwiZGVmXCIsXCJwYXJhZ3JhcGhcIixcInRleHRcIl0uaW5jbHVkZXMocy50eXBlKSl7dCs9YXx8XCJcIjtjb250aW51ZX19bGV0IGk9cjtzd2l0Y2goaS50eXBlKXtjYXNlXCJzcGFjZVwiOnt0Kz10aGlzLnJlbmRlcmVyLnNwYWNlKGkpO2JyZWFrfWNhc2VcImhyXCI6e3QrPXRoaXMucmVuZGVyZXIuaHIoaSk7YnJlYWt9Y2FzZVwiaGVhZGluZ1wiOnt0Kz10aGlzLnJlbmRlcmVyLmhlYWRpbmcoaSk7YnJlYWt9Y2FzZVwiY29kZVwiOnt0Kz10aGlzLnJlbmRlcmVyLmNvZGUoaSk7YnJlYWt9Y2FzZVwidGFibGVcIjp7dCs9dGhpcy5yZW5kZXJlci50YWJsZShpKTticmVha31jYXNlXCJibG9ja3F1b3RlXCI6e3QrPXRoaXMucmVuZGVyZXIuYmxvY2txdW90ZShpKTticmVha31jYXNlXCJsaXN0XCI6e3QrPXRoaXMucmVuZGVyZXIubGlzdChpKTticmVha31jYXNlXCJjaGVja2JveFwiOnt0Kz10aGlzLnJlbmRlcmVyLmNoZWNrYm94KGkpO2JyZWFrfWNhc2VcImh0bWxcIjp7dCs9dGhpcy5yZW5kZXJlci5odG1sKGkpO2JyZWFrfWNhc2VcImRlZlwiOnt0Kz10aGlzLnJlbmRlcmVyLmRlZihpKTticmVha31jYXNlXCJwYXJhZ3JhcGhcIjp7dCs9dGhpcy5yZW5kZXJlci5wYXJhZ3JhcGgoaSk7YnJlYWt9Y2FzZVwidGV4dFwiOnt0Kz10aGlzLnJlbmRlcmVyLnRleHQoaSk7YnJlYWt9ZGVmYXVsdDp7bGV0IHM9J1Rva2VuIHdpdGggXCInK2kudHlwZSsnXCIgdHlwZSB3YXMgbm90IGZvdW5kLic7aWYodGhpcy5vcHRpb25zLnNpbGVudClyZXR1cm4gY29uc29sZS5lcnJvcihzKSxcIlwiO3Rocm93IG5ldyBFcnJvcihzKX19fXJldHVybiB0fXBhcnNlSW5saW5lKGUsdD10aGlzLnJlbmRlcmVyKXtsZXQgbj1cIlwiO2ZvcihsZXQgcj0wO3I8ZS5sZW5ndGg7cisrKXtsZXQgaT1lW3JdO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5yZW5kZXJlcnM/LltpLnR5cGVdKXtsZXQgYT10aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5yZW5kZXJlcnNbaS50eXBlXS5jYWxsKHtwYXJzZXI6dGhpc30saSk7aWYoYSE9PSExfHwhW1wiZXNjYXBlXCIsXCJodG1sXCIsXCJsaW5rXCIsXCJpbWFnZVwiLFwic3Ryb25nXCIsXCJlbVwiLFwiY29kZXNwYW5cIixcImJyXCIsXCJkZWxcIixcInRleHRcIl0uaW5jbHVkZXMoaS50eXBlKSl7bis9YXx8XCJcIjtjb250aW51ZX19bGV0IHM9aTtzd2l0Y2gocy50eXBlKXtjYXNlXCJlc2NhcGVcIjp7bis9dC50ZXh0KHMpO2JyZWFrfWNhc2VcImh0bWxcIjp7bis9dC5odG1sKHMpO2JyZWFrfWNhc2VcImxpbmtcIjp7bis9dC5saW5rKHMpO2JyZWFrfWNhc2VcImltYWdlXCI6e24rPXQuaW1hZ2Uocyk7YnJlYWt9Y2FzZVwiY2hlY2tib3hcIjp7bis9dC5jaGVja2JveChzKTticmVha31jYXNlXCJzdHJvbmdcIjp7bis9dC5zdHJvbmcocyk7YnJlYWt9Y2FzZVwiZW1cIjp7bis9dC5lbShzKTticmVha31jYXNlXCJjb2Rlc3BhblwiOntuKz10LmNvZGVzcGFuKHMpO2JyZWFrfWNhc2VcImJyXCI6e24rPXQuYnIocyk7YnJlYWt9Y2FzZVwiZGVsXCI6e24rPXQuZGVsKHMpO2JyZWFrfWNhc2VcInRleHRcIjp7bis9dC50ZXh0KHMpO2JyZWFrfWRlZmF1bHQ6e2xldCBhPSdUb2tlbiB3aXRoIFwiJytzLnR5cGUrJ1wiIHR5cGUgd2FzIG5vdCBmb3VuZC4nO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpcmV0dXJuIGNvbnNvbGUuZXJyb3IoYSksXCJcIjt0aHJvdyBuZXcgRXJyb3IoYSl9fX1yZXR1cm4gbn19O3ZhciBTPWNsYXNze29wdGlvbnM7YmxvY2s7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFR9c3RhdGljIHBhc3NUaHJvdWdoSG9va3M9bmV3IFNldChbXCJwcmVwcm9jZXNzXCIsXCJwb3N0cHJvY2Vzc1wiLFwicHJvY2Vzc0FsbFRva2Vuc1wiLFwiZW1TdHJvbmdNYXNrXCJdKTtzdGF0aWMgcGFzc1Rocm91Z2hIb29rc1Jlc3BlY3RBc3luYz1uZXcgU2V0KFtcInByZXByb2Nlc3NcIixcInBvc3Rwcm9jZXNzXCIsXCJwcm9jZXNzQWxsVG9rZW5zXCJdKTtwcmVwcm9jZXNzKGUpe3JldHVybiBlfXBvc3Rwcm9jZXNzKGUpe3JldHVybiBlfXByb2Nlc3NBbGxUb2tlbnMoZSl7cmV0dXJuIGV9ZW1TdHJvbmdNYXNrKGUpe3JldHVybiBlfXByb3ZpZGVMZXhlcigpe3JldHVybiB0aGlzLmJsb2NrP3gubGV4OngubGV4SW5saW5lfXByb3ZpZGVQYXJzZXIoKXtyZXR1cm4gdGhpcy5ibG9jaz9iLnBhcnNlOmIucGFyc2VJbmxpbmV9fTt2YXIgQj1jbGFzc3tkZWZhdWx0cz1MKCk7b3B0aW9ucz10aGlzLnNldE9wdGlvbnM7cGFyc2U9dGhpcy5wYXJzZU1hcmtkb3duKCEwKTtwYXJzZUlubGluZT10aGlzLnBhcnNlTWFya2Rvd24oITEpO1BhcnNlcj1iO1JlbmRlcmVyPVA7VGV4dFJlbmRlcmVyPSQ7TGV4ZXI9eDtUb2tlbml6ZXI9eTtIb29rcz1TO2NvbnN0cnVjdG9yKC4uLmUpe3RoaXMudXNlKC4uLmUpfXdhbGtUb2tlbnMoZSx0KXtsZXQgbj1bXTtmb3IobGV0IHIgb2YgZSlzd2l0Y2gobj1uLmNvbmNhdCh0LmNhbGwodGhpcyxyKSksci50eXBlKXtjYXNlXCJ0YWJsZVwiOntsZXQgaT1yO2ZvcihsZXQgcyBvZiBpLmhlYWRlciluPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhzLnRva2Vucyx0KSk7Zm9yKGxldCBzIG9mIGkucm93cylmb3IobGV0IGEgb2YgcyluPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhhLnRva2Vucyx0KSk7YnJlYWt9Y2FzZVwibGlzdFwiOntsZXQgaT1yO249bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGkuaXRlbXMsdCkpO2JyZWFrfWRlZmF1bHQ6e2xldCBpPXI7dGhpcy5kZWZhdWx0cy5leHRlbnNpb25zPy5jaGlsZFRva2Vucz8uW2kudHlwZV0/dGhpcy5kZWZhdWx0cy5leHRlbnNpb25zLmNoaWxkVG9rZW5zW2kudHlwZV0uZm9yRWFjaChzPT57bGV0IGE9aVtzXS5mbGF0KDEvMCk7bj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoYSx0KSl9KTppLnRva2VucyYmKG49bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGkudG9rZW5zLHQpKSl9fXJldHVybiBufXVzZSguLi5lKXtsZXQgdD10aGlzLmRlZmF1bHRzLmV4dGVuc2lvbnN8fHtyZW5kZXJlcnM6e30sY2hpbGRUb2tlbnM6e319O3JldHVybiBlLmZvckVhY2gobj0+e2xldCByPXsuLi5ufTtpZihyLmFzeW5jPXRoaXMuZGVmYXVsdHMuYXN5bmN8fHIuYXN5bmN8fCExLG4uZXh0ZW5zaW9ucyYmKG4uZXh0ZW5zaW9ucy5mb3JFYWNoKGk9PntpZighaS5uYW1lKXRocm93IG5ldyBFcnJvcihcImV4dGVuc2lvbiBuYW1lIHJlcXVpcmVkXCIpO2lmKFwicmVuZGVyZXJcImluIGkpe2xldCBzPXQucmVuZGVyZXJzW2kubmFtZV07cz90LnJlbmRlcmVyc1tpLm5hbWVdPWZ1bmN0aW9uKC4uLmEpe2xldCBvPWkucmVuZGVyZXIuYXBwbHkodGhpcyxhKTtyZXR1cm4gbz09PSExJiYobz1zLmFwcGx5KHRoaXMsYSkpLG99OnQucmVuZGVyZXJzW2kubmFtZV09aS5yZW5kZXJlcn1pZihcInRva2VuaXplclwiaW4gaSl7aWYoIWkubGV2ZWx8fGkubGV2ZWwhPT1cImJsb2NrXCImJmkubGV2ZWwhPT1cImlubGluZVwiKXRocm93IG5ldyBFcnJvcihcImV4dGVuc2lvbiBsZXZlbCBtdXN0IGJlICdibG9jaycgb3IgJ2lubGluZSdcIik7bGV0IHM9dFtpLmxldmVsXTtzP3MudW5zaGlmdChpLnRva2VuaXplcik6dFtpLmxldmVsXT1baS50b2tlbml6ZXJdLGkuc3RhcnQmJihpLmxldmVsPT09XCJibG9ja1wiP3Quc3RhcnRCbG9jaz90LnN0YXJ0QmxvY2sucHVzaChpLnN0YXJ0KTp0LnN0YXJ0QmxvY2s9W2kuc3RhcnRdOmkubGV2ZWw9PT1cImlubGluZVwiJiYodC5zdGFydElubGluZT90LnN0YXJ0SW5saW5lLnB1c2goaS5zdGFydCk6dC5zdGFydElubGluZT1baS5zdGFydF0pKX1cImNoaWxkVG9rZW5zXCJpbiBpJiZpLmNoaWxkVG9rZW5zJiYodC5jaGlsZFRva2Vuc1tpLm5hbWVdPWkuY2hpbGRUb2tlbnMpfSksci5leHRlbnNpb25zPXQpLG4ucmVuZGVyZXIpe2xldCBpPXRoaXMuZGVmYXVsdHMucmVuZGVyZXJ8fG5ldyBQKHRoaXMuZGVmYXVsdHMpO2ZvcihsZXQgcyBpbiBuLnJlbmRlcmVyKXtpZighKHMgaW4gaSkpdGhyb3cgbmV3IEVycm9yKGByZW5kZXJlciAnJHtzfScgZG9lcyBub3QgZXhpc3RgKTtpZihbXCJvcHRpb25zXCIsXCJwYXJzZXJcIl0uaW5jbHVkZXMocykpY29udGludWU7bGV0IGE9cyxvPW4ucmVuZGVyZXJbYV0sbD1pW2FdO2lbYV09KC4uLnApPT57bGV0IGM9by5hcHBseShpLHApO3JldHVybiBjPT09ITEmJihjPWwuYXBwbHkoaSxwKSksY3x8XCJcIn19ci5yZW5kZXJlcj1pfWlmKG4udG9rZW5pemVyKXtsZXQgaT10aGlzLmRlZmF1bHRzLnRva2VuaXplcnx8bmV3IHkodGhpcy5kZWZhdWx0cyk7Zm9yKGxldCBzIGluIG4udG9rZW5pemVyKXtpZighKHMgaW4gaSkpdGhyb3cgbmV3IEVycm9yKGB0b2tlbml6ZXIgJyR7c30nIGRvZXMgbm90IGV4aXN0YCk7aWYoW1wib3B0aW9uc1wiLFwicnVsZXNcIixcImxleGVyXCJdLmluY2x1ZGVzKHMpKWNvbnRpbnVlO2xldCBhPXMsbz1uLnRva2VuaXplclthXSxsPWlbYV07aVthXT0oLi4ucCk9PntsZXQgYz1vLmFwcGx5KGkscCk7cmV0dXJuIGM9PT0hMSYmKGM9bC5hcHBseShpLHApKSxjfX1yLnRva2VuaXplcj1pfWlmKG4uaG9va3Mpe2xldCBpPXRoaXMuZGVmYXVsdHMuaG9va3N8fG5ldyBTO2ZvcihsZXQgcyBpbiBuLmhvb2tzKXtpZighKHMgaW4gaSkpdGhyb3cgbmV3IEVycm9yKGBob29rICcke3N9JyBkb2VzIG5vdCBleGlzdGApO2lmKFtcIm9wdGlvbnNcIixcImJsb2NrXCJdLmluY2x1ZGVzKHMpKWNvbnRpbnVlO2xldCBhPXMsbz1uLmhvb2tzW2FdLGw9aVthXTtTLnBhc3NUaHJvdWdoSG9va3MuaGFzKHMpP2lbYV09cD0+e2lmKHRoaXMuZGVmYXVsdHMuYXN5bmMmJlMucGFzc1Rocm91Z2hIb29rc1Jlc3BlY3RBc3luYy5oYXMocykpcmV0dXJuKGFzeW5jKCk9PntsZXQgZz1hd2FpdCBvLmNhbGwoaSxwKTtyZXR1cm4gbC5jYWxsKGksZyl9KSgpO2xldCBjPW8uY2FsbChpLHApO3JldHVybiBsLmNhbGwoaSxjKX06aVthXT0oLi4ucCk9PntpZih0aGlzLmRlZmF1bHRzLmFzeW5jKXJldHVybihhc3luYygpPT57bGV0IGc9YXdhaXQgby5hcHBseShpLHApO3JldHVybiBnPT09ITEmJihnPWF3YWl0IGwuYXBwbHkoaSxwKSksZ30pKCk7bGV0IGM9by5hcHBseShpLHApO3JldHVybiBjPT09ITEmJihjPWwuYXBwbHkoaSxwKSksY319ci5ob29rcz1pfWlmKG4ud2Fsa1Rva2Vucyl7bGV0IGk9dGhpcy5kZWZhdWx0cy53YWxrVG9rZW5zLHM9bi53YWxrVG9rZW5zO3Iud2Fsa1Rva2Vucz1mdW5jdGlvbihhKXtsZXQgbz1bXTtyZXR1cm4gby5wdXNoKHMuY2FsbCh0aGlzLGEpKSxpJiYobz1vLmNvbmNhdChpLmNhbGwodGhpcyxhKSkpLG99fXRoaXMuZGVmYXVsdHM9ey4uLnRoaXMuZGVmYXVsdHMsLi4ucn19KSx0aGlzfXNldE9wdGlvbnMoZSl7cmV0dXJuIHRoaXMuZGVmYXVsdHM9ey4uLnRoaXMuZGVmYXVsdHMsLi4uZX0sdGhpc31sZXhlcihlLHQpe3JldHVybiB4LmxleChlLHQ/P3RoaXMuZGVmYXVsdHMpfXBhcnNlcihlLHQpe3JldHVybiBiLnBhcnNlKGUsdD8/dGhpcy5kZWZhdWx0cyl9cGFyc2VNYXJrZG93bihlKXtyZXR1cm4obixyKT0+e2xldCBpPXsuLi5yfSxzPXsuLi50aGlzLmRlZmF1bHRzLC4uLml9LGE9dGhpcy5vbkVycm9yKCEhcy5zaWxlbnQsISFzLmFzeW5jKTtpZih0aGlzLmRlZmF1bHRzLmFzeW5jPT09ITAmJmkuYXN5bmM9PT0hMSlyZXR1cm4gYShuZXcgRXJyb3IoXCJtYXJrZWQoKTogVGhlIGFzeW5jIG9wdGlvbiB3YXMgc2V0IHRvIHRydWUgYnkgYW4gZXh0ZW5zaW9uLiBSZW1vdmUgYXN5bmM6IGZhbHNlIGZyb20gdGhlIHBhcnNlIG9wdGlvbnMgb2JqZWN0IHRvIHJldHVybiBhIFByb21pc2UuXCIpKTtpZih0eXBlb2Ygbj5cInVcInx8bj09PW51bGwpcmV0dXJuIGEobmV3IEVycm9yKFwibWFya2VkKCk6IGlucHV0IHBhcmFtZXRlciBpcyB1bmRlZmluZWQgb3IgbnVsbFwiKSk7aWYodHlwZW9mIG4hPVwic3RyaW5nXCIpcmV0dXJuIGEobmV3IEVycm9yKFwibWFya2VkKCk6IGlucHV0IHBhcmFtZXRlciBpcyBvZiB0eXBlIFwiK09iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuKStcIiwgc3RyaW5nIGV4cGVjdGVkXCIpKTtpZihzLmhvb2tzJiYocy5ob29rcy5vcHRpb25zPXMscy5ob29rcy5ibG9jaz1lKSxzLmFzeW5jKXJldHVybihhc3luYygpPT57bGV0IG89cy5ob29rcz9hd2FpdCBzLmhvb2tzLnByZXByb2Nlc3Mobik6bixwPWF3YWl0KHMuaG9va3M/YXdhaXQgcy5ob29rcy5wcm92aWRlTGV4ZXIoKTplP3gubGV4OngubGV4SW5saW5lKShvLHMpLGM9cy5ob29rcz9hd2FpdCBzLmhvb2tzLnByb2Nlc3NBbGxUb2tlbnMocCk6cDtzLndhbGtUb2tlbnMmJmF3YWl0IFByb21pc2UuYWxsKHRoaXMud2Fsa1Rva2VucyhjLHMud2Fsa1Rva2VucykpO2xldCBoPWF3YWl0KHMuaG9va3M/YXdhaXQgcy5ob29rcy5wcm92aWRlUGFyc2VyKCk6ZT9iLnBhcnNlOmIucGFyc2VJbmxpbmUpKGMscyk7cmV0dXJuIHMuaG9va3M/YXdhaXQgcy5ob29rcy5wb3N0cHJvY2VzcyhoKTpofSkoKS5jYXRjaChhKTt0cnl7cy5ob29rcyYmKG49cy5ob29rcy5wcmVwcm9jZXNzKG4pKTtsZXQgbD0ocy5ob29rcz9zLmhvb2tzLnByb3ZpZGVMZXhlcigpOmU/eC5sZXg6eC5sZXhJbmxpbmUpKG4scyk7cy5ob29rcyYmKGw9cy5ob29rcy5wcm9jZXNzQWxsVG9rZW5zKGwpKSxzLndhbGtUb2tlbnMmJnRoaXMud2Fsa1Rva2VucyhsLHMud2Fsa1Rva2Vucyk7bGV0IGM9KHMuaG9va3M/cy5ob29rcy5wcm92aWRlUGFyc2VyKCk6ZT9iLnBhcnNlOmIucGFyc2VJbmxpbmUpKGwscyk7cmV0dXJuIHMuaG9va3MmJihjPXMuaG9va3MucG9zdHByb2Nlc3MoYykpLGN9Y2F0Y2gobyl7cmV0dXJuIGEobyl9fX1vbkVycm9yKGUsdCl7cmV0dXJuIG49PntpZihuLm1lc3NhZ2UrPWBcblBsZWFzZSByZXBvcnQgdGhpcyB0byBodHRwczovL2dpdGh1Yi5jb20vbWFya2VkanMvbWFya2VkLmAsZSl7bGV0IHI9XCI8cD5BbiBlcnJvciBvY2N1cnJlZDo8L3A+PHByZT5cIit3KG4ubWVzc2FnZStcIlwiLCEwKStcIjwvcHJlPlwiO3JldHVybiB0P1Byb21pc2UucmVzb2x2ZShyKTpyfWlmKHQpcmV0dXJuIFByb21pc2UucmVqZWN0KG4pO3Rocm93IG59fX07dmFyIF89bmV3IEI7ZnVuY3Rpb24gZCh1LGUpe3JldHVybiBfLnBhcnNlKHUsZSl9ZC5vcHRpb25zPWQuc2V0T3B0aW9ucz1mdW5jdGlvbih1KXtyZXR1cm4gXy5zZXRPcHRpb25zKHUpLGQuZGVmYXVsdHM9Xy5kZWZhdWx0cyxaKGQuZGVmYXVsdHMpLGR9O2QuZ2V0RGVmYXVsdHM9TDtkLmRlZmF1bHRzPVQ7ZC51c2U9ZnVuY3Rpb24oLi4udSl7cmV0dXJuIF8udXNlKC4uLnUpLGQuZGVmYXVsdHM9Xy5kZWZhdWx0cyxaKGQuZGVmYXVsdHMpLGR9O2Qud2Fsa1Rva2Vucz1mdW5jdGlvbih1LGUpe3JldHVybiBfLndhbGtUb2tlbnModSxlKX07ZC5wYXJzZUlubGluZT1fLnBhcnNlSW5saW5lO2QuUGFyc2VyPWI7ZC5wYXJzZXI9Yi5wYXJzZTtkLlJlbmRlcmVyPVA7ZC5UZXh0UmVuZGVyZXI9JDtkLkxleGVyPXg7ZC5sZXhlcj14LmxleDtkLlRva2VuaXplcj15O2QuSG9va3M9UztkLnBhcnNlPWQ7dmFyIER0PWQub3B0aW9ucyxIdD1kLnNldE9wdGlvbnMsWnQ9ZC51c2UsR3Q9ZC53YWxrVG9rZW5zLE50PWQucGFyc2VJbmxpbmUsUXQ9ZCxGdD1iLnBhcnNlLGp0PXgubGV4O2V4cG9ydHtTIGFzIEhvb2tzLHggYXMgTGV4ZXIsQiBhcyBNYXJrZWQsYiBhcyBQYXJzZXIsUCBhcyBSZW5kZXJlciwkIGFzIFRleHRSZW5kZXJlcix5IGFzIFRva2VuaXplcixUIGFzIGRlZmF1bHRzLEwgYXMgZ2V0RGVmYXVsdHMsanQgYXMgbGV4ZXIsZCBhcyBtYXJrZWQsRHQgYXMgb3B0aW9ucyxRdCBhcyBwYXJzZSxOdCBhcyBwYXJzZUlubGluZSxGdCBhcyBwYXJzZXIsSHQgYXMgc2V0T3B0aW9ucyxadCBhcyB1c2UsR3QgYXMgd2Fsa1Rva2Vuc307XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYXJrZWQuZXNtLmpzLm1hcFxuIiwiaW1wb3J0IERPTVB1cmlmeSBmcm9tIFwiZG9tcHVyaWZ5XCI7XG5pbXBvcnQgeyBtYXJrZWQgfSBmcm9tIFwibWFya2VkXCI7XG5cbi8qKlxuICogQ29udGVudCBmb3JtYXQgdHlwZXNcbiAqL1xuZXhwb3J0IHR5cGUgQ29udGVudEZvcm1hdCA9IFwiaHRtbFwiIHwgXCJtYXJrZG93blwiIHwgXCJ0ZXh0XCI7XG4vKipcbiAqIENvbmZpZ3VyYXRpb24gZm9yIEhUTUwgc2FuaXRpemF0aW9uXG4gKiBVcGRhdGVkIGZvciBGQVEgY29udGVudDogUHJpb3JpdGl6ZXMgc2FmZSwgcmVhZGFibGUgcmljaCB0ZXh0IHdpdGggZnVsbCBsaW5rIHN1cHBvcnQuXG4gKiBFbmhhbmNlcyB0YWJsZSBzdXBwb3J0IChpbmNsdWRpbmcgY2FwdGlvbnMgYW5kIHN0cnVjdHVyYWwgYXR0cmlidXRlcyBmb3IgYmV0dGVyIGFjY2Vzc2liaWxpdHkvY29tcGxleGl0eSkuXG4gKiBBZGRzIG9wdGlvbmFsIHZpZGVvIHN1cHBvcnQgKGNvbW1lbnRlZCBvdXQgYnkgZGVmYXVsdOKAlHVuY29tbWVudCBpZiBlbWJlZGRpbmcgdmlkZW9zIGlzIGRlc2lyZWQgZm9yIEZBUXM7XG4gKiBub3RlOiB0aGlzIGluY3JlYXNlcyBzZWN1cml0eSByZXZpZXcgbmVlZHMgZHVlIHRvIHBvdGVudGlhbCBleGVjdXRhYmxlIGNvbnRlbnQpLlxuICogUmVtb3ZlcyBoZWFkaW5ncyAoaDEtaDYpIGFzIHRoZXkncmUgbGlrZWx5IHVubmVjZXNzYXJ5IGZvciBGQVEgcmVzcG9uc2VzLlxuICogUmV0YWlucyBjb3JlIGZvcm1hdHRpbmcsIGxpc3RzLCBpbWFnZXMsIGFuZCB0YWJsZXMgZm9yIHN0cnVjdHVyZWQgYW5zd2Vycy5cbiAqL1xuY29uc3QgU0FOSVRJWkVfQ09ORklHID0ge1xuICAgIEFMTE9XRURfVEFHUzogW1xuICAgICAgICBcInBcIixcbiAgICAgICAgXCJiclwiLFxuICAgICAgICBcInN0cm9uZ1wiLFxuICAgICAgICBcImVtXCIsXG4gICAgICAgIFwidVwiLFxuICAgICAgICBcInNcIixcbiAgICAgICAgXCJiXCIsXG4gICAgICAgIFwiaVwiLFxuICAgICAgICBcImFcIixcbiAgICAgICAgXCJ1bFwiLFxuICAgICAgICBcIm9sXCIsXG4gICAgICAgIFwibGlcIixcbiAgICAgICAgXCJjb2RlXCIsXG4gICAgICAgIFwicHJlXCIsXG4gICAgICAgIFwiaHJcIixcbiAgICAgICAgXCJ0YWJsZVwiLFxuICAgICAgICBcImNhcHRpb25cIiwgIC8vIEFkZGVkIGZvciB0YWJsZSB0aXRsZXMvZGVzY3JpcHRpb25zXG4gICAgICAgIFwidGhlYWRcIixcbiAgICAgICAgXCJ0Ym9keVwiLFxuICAgICAgICBcInRmb290XCIsICAgIC8vIEFkZGVkIGZvciB0YWJsZSBmb290ZXJzIChlLmcuLCBzdW1tYXJpZXMvdG90YWxzKVxuICAgICAgICBcInRyXCIsXG4gICAgICAgIFwidGhcIixcbiAgICAgICAgXCJ0ZFwiLFxuICAgICAgICBcImNvbFwiLCAgICAgIC8vIEFkZGVkIGZvciBjb2x1bW4gcHJvcGVydGllc1xuICAgICAgICBcImNvbGdyb3VwXCIsIC8vIEFkZGVkIGZvciBncm91cGluZyBjb2x1bW5zXG4gICAgICAgIFwiaW1nXCIsXG4gICAgICAgIFwiZGl2XCIsXG4gICAgICAgIFwic3BhblwiLFxuICAgICAgICBcInZpZGVvXCIsICAvLyBVbmNvbW1lbnQgdG8gZW5hYmxlIDx2aWRlbz4gZm9yIGVtYmVkZGVkIHZpZGVvc1xuICAgICAgICBcInNvdXJjZVwiLCAvLyBVbmNvbW1lbnQgaWYgZW5hYmxpbmcgdmlkZW8gKGZvciA8dmlkZW8+IHNvdXJjZXMpXG4gICAgICAgIFwiZmlndXJlXCIsIC8vIE9wdGlvbmFsOiBGb3Igd3JhcHBpbmcgaW1hZ2VzL3RhYmxlcyB3aXRoIGNhcHRpb25zXG4gICAgICAgIFwiZmlnY2FwdGlvblwiIC8vIE9wdGlvbmFsOiBGb3IgZmlndXJlIGRlc2NyaXB0aW9uc1xuICAgIF0sXG4gICAgQUxMT1dFRF9BVFRSOiBbXG4gICAgICAgIFwiaHJlZlwiLFxuICAgICAgICBcInRpdGxlXCIsXG4gICAgICAgIFwidGFyZ2V0XCIsXG4gICAgICAgIFwicmVsXCIsXG4gICAgICAgIFwic3JjXCIsXG4gICAgICAgIFwiYWx0XCIsXG4gICAgICAgIFwid2lkdGhcIixcbiAgICAgICAgXCJoZWlnaHRcIixcbiAgICAgICAgXCJjbGFzc1wiLFxuICAgICAgICBcImlkXCIsXG4gICAgICAgIFwic3R5bGVcIixcbiAgICAgICAgLy8gVGFibGUtc3BlY2lmaWMgYXR0cmlidXRlcyBmb3Igc3RydWN0dXJlIGFuZCBhY2Nlc3NpYmlsaXR5XG4gICAgICAgIFwicm93c3BhblwiLFxuICAgICAgICBcImNvbHNwYW5cIixcbiAgICAgICAgXCJzY29wZVwiLCAgICAvLyBGb3IgPHRoPiAoZS5nLiwgcm93LCBjb2wsIHJvd2dyb3VwKVxuICAgICAgICBcImhlYWRlcnNcIiwgIC8vIEZvciBhc3NvY2lhdGluZyA8dGQ+IHdpdGggPHRoPlxuICAgICAgICAvLyBWaWRlby1zcGVjaWZpYyAodW5jb21tZW50IGlmIGVuYWJsaW5nIHZpZGVvKVxuICAgICAgICBcImNvbnRyb2xzXCIsXG4gICAgICAgIFwiYXV0b3BsYXlcIixcbiAgICAgICAgXCJsb29wXCIsXG4gICAgICAgIFwibXV0ZWRcIixcbiAgICAgICAgXCJwb3N0ZXJcIlxuICAgIF0sXG4gICAgQUxMT1dfREFUQV9BVFRSOiBmYWxzZSwgIC8vIEtlZXAgZmFsc2UgZm9yIHNlY3VyaXR5OyBlbmFibGUgb25seSBpZiBjdXN0b20gZGF0YSBhdHRycyBhcmUgdmV0dGVkXG4gICAgQUxMT1dFRF9VUklfUkVHRVhQOiAvXig/Oig/Oig/OmZ8aHQpdHBzP3xtYWlsdG98dGVsfGNhbGx0b3xzbXN8Y2lkfHhtcHApOnxbXmEtel18W2EteisuXFwtXSsoPzpbXmEteisuXFwtOl18JCkpL2lcbn07XG5cbi8qKlxuICogVmFsaWRhdGVzIGFuZCBzYW5pdGl6ZXMgSFRNTCBjb250ZW50XG4gKiBAcGFyYW0gaHRtbCAtIFRoZSBIVE1MIHN0cmluZyB0byBzYW5pdGl6ZVxuICogQHJldHVybnMgU2FuaXRpemVkIEhUTUwgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUhUTUwoaHRtbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIWh0bWwpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gQ29uZmlndXJlIERPTVB1cmlmeVxuICAgICAgICBjb25zdCBjbGVhbkhUTUwgPSBET01QdXJpZnkuc2FuaXRpemUoaHRtbCwgU0FOSVRJWkVfQ09ORklHKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuSFRNTDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2FuaXRpemluZyBIVE1MOlwiLCBlcnJvcik7XG4gICAgICAgIC8vIFJldHVybiBlc2NhcGVkIHRleHQgYXMgZmFsbGJhY2tcbiAgICAgICAgcmV0dXJuIGVzY2FwZUhUTUwoaHRtbCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBIVE1MIGNvbnRlbnQgYW5kIHJldHVybnMgdmFsaWRhdGlvbiBlcnJvcnNcbiAqIEBwYXJhbSBodG1sIC0gVGhlIEhUTUwgc3RyaW5nIHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBBcnJheSBvZiB2YWxpZGF0aW9uIGVycm9yIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUhUTUwoaHRtbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmICghaHRtbCkge1xuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBzY3JpcHQgdGFncyAoc2hvdWxkIGJlIGJsb2NrZWQpXG4gICAgaWYgKC88c2NyaXB0W14+XSo+W1xcc1xcU10qPzxcXC9zY3JpcHQ+L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJTY3JpcHQgdGFncyBhcmUgbm90IGFsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGV2ZW50IGhhbmRsZXJzIChzaG91bGQgYmUgYmxvY2tlZClcbiAgICBpZiAoL29uXFx3K1xccyo9L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJFdmVudCBoYW5kbGVycyAob25jbGljaywgb25sb2FkLCBldGMuKSBhcmUgbm90IGFsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGphdmFzY3JpcHQ6IHByb3RvY29sXG4gICAgaWYgKC9qYXZhc2NyaXB0Oi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiSmF2YVNjcmlwdCBwcm90b2NvbCBpbiBVUkxzIGlzIG5vdCBhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBkYXRhOiBwcm90b2NvbCAoZXhjZXB0IGZvciBpbWFnZXMpXG4gICAgaWYgKC9kYXRhOig/IWltYWdlKS9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiRGF0YSBVUkxzIGFyZSBvbmx5IGFsbG93ZWQgZm9yIGltYWdlc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgaWZyYW1lIChub3QgaW4gYWxsb3dlZCB0YWdzKVxuICAgIGlmICgvPGlmcmFtZVtePl0qPi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiSWZyYW1lIHRhZ3MgYXJlIG5vdCBhbGxvd2VkXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBvYmplY3QgYW5kIGVtYmVkIHRhZ3NcbiAgICBpZiAoLzwob2JqZWN0fGVtYmVkKVtePl0qPi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiT2JqZWN0IGFuZCBlbWJlZCB0YWdzIGFyZSBub3QgYWxsb3dlZFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3JzO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBIVE1MIHN5bnRheCBmb3IgbWFsZm9ybWVkIG1hcmt1cFxuICogQHBhcmFtIGh0bWwgLSBUaGUgSFRNTCBzdHJpbmcgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm5zIEFycmF5IG9mIHN5bnRheCBlcnJvciBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVIVE1MU3ludGF4KGh0bWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoIWh0bWwpIHtcbiAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgdW5jbG9zZWQgYXR0cmlidXRlIHF1b3Rlc1xuICAgIC8vIE1hdGNoZXM6IGF0dHI9XCIgb3IgYXR0cj0nIHdpdGhvdXQgY2xvc2luZyBxdW90ZSBiZWZvcmUgPiBvciBhbm90aGVyIGF0dHJpYnV0ZVxuICAgIGNvbnN0IHVuY2xvc2VkUXVvdGVQYXR0ZXJuID0gLyhcXHcrKVxccyo9XFxzKltcIiddKD86W15cIic+XSooPzpbXCInXVteXCInPl0rW1wiJ10pKlteXCInPl0qKT8oPz1bXlwiJz5dKj4pL2c7XG4gICAgY29uc3QgYWxsVGFncyA9IGh0bWwubWF0Y2goLzxbXj5dKz4vZykgfHwgW107XG4gICAgXG4gICAgYWxsVGFncy5mb3JFYWNoKHRhZyA9PiB7XG4gICAgICAgIC8vIENoZWNrIGZvciBhdHRyaWJ1dGVzIHdpdGggdW5jbG9zZWQgcXVvdGVzXG4gICAgICAgIC8vIExvb2sgZm9yIGF0dHI9XCIgb3IgYXR0cj0nIHRoYXQgZG9lc24ndCBoYXZlIGEgbWF0Y2hpbmcgY2xvc2luZyBxdW90ZVxuICAgICAgICBjb25zdCBzaW5nbGVRdW90ZU1hdGNoZXMgPSB0YWcubWF0Y2goL1xcdytcXHMqPVxccyonW14nXSokLyk7XG4gICAgICAgIGNvbnN0IGRvdWJsZVF1b3RlTWF0Y2hlcyA9IHRhZy5tYXRjaCgvXFx3K1xccyo9XFxzKlwiW15cIl0qJC8pO1xuICAgICAgICBcbiAgICAgICAgaWYgKHNpbmdsZVF1b3RlTWF0Y2hlcyB8fCBkb3VibGVRdW90ZU1hdGNoZXMpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBVbmNsb3NlZCBhdHRyaWJ1dGUgcXVvdGUgaW4gdGFnOiAke3RhZy5zdWJzdHJpbmcoMCwgNTApfSR7dGFnLmxlbmd0aCA+IDUwID8gJy4uLicgOiAnJ31gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBvcGVuaW5nIHRhZyAobWlzc2luZyA+KVxuICAgICAgICBpZiAodGFnLnN0YXJ0c1dpdGgoJzwnKSAmJiAhdGFnLmVuZHNXaXRoKCc+JykpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBVbmNsb3NlZCB0YWcgYnJhY2tldDogJHt0YWcuc3Vic3RyaW5nKDAsIDUwKX0ke3RhZy5sZW5ndGggPiA1MCA/ICcuLi4nIDogJyd9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENoZWNrIGZvciBiYWxhbmNlZCB0YWdzIChvcGVuaW5nIGFuZCBjbG9zaW5nKVxuICAgIC8vIFNlbGYtY2xvc2luZyB0YWdzIHRoYXQgZG9uJ3QgbmVlZCBjbG9zaW5nIHRhZ3NcbiAgICBjb25zdCBzZWxmQ2xvc2luZ1RhZ3MgPSBbJ2FyZWEnLCAnYmFzZScsICdicicsICdjb2wnLCAnZW1iZWQnLCAnaHInLCAnaW1nJywgJ2lucHV0JywgJ2xpbmsnLCAnbWV0YScsICdwYXJhbScsICdzb3VyY2UnLCAndHJhY2snLCAnd2JyJ107XG4gICAgXG4gICAgLy8gRXh0cmFjdCBhbGwgdGFncyAob3BlbmluZyBhbmQgY2xvc2luZylcbiAgICBjb25zdCB0YWdTdGFjazogQXJyYXk8eyB0YWc6IHN0cmluZzsgcG9zaXRpb246IG51bWJlciB9PiA9IFtdO1xuICAgIGNvbnN0IHRhZ1JlZ2V4ID0gLzxcXC8/KFthLXpBLVpdW2EtekEtWjAtOV0qKVtePl0qPi9nO1xuICAgIGxldCBtYXRjaDtcblxuICAgIHdoaWxlICgobWF0Y2ggPSB0YWdSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBmdWxsVGFnID0gbWF0Y2hbMF07XG4gICAgICAgIGNvbnN0IHRhZ05hbWUgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBjb25zdCBpc0Nsb3NpbmcgPSBmdWxsVGFnLnN0YXJ0c1dpdGgoJzwvJyk7XG4gICAgICAgIGNvbnN0IGlzU2VsZkNsb3NpbmcgPSBmdWxsVGFnLmVuZHNXaXRoKCcvPicpIHx8IHNlbGZDbG9zaW5nVGFncy5pbmNsdWRlcyh0YWdOYW1lKTtcblxuICAgICAgICBpZiAoaXNDbG9zaW5nKSB7XG4gICAgICAgICAgICAvLyBDbG9zaW5nIHRhZyAtIHBvcCBmcm9tIHN0YWNrXG4gICAgICAgICAgICBpZiAodGFnU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goYE9ycGhhbmVkIGNsb3NpbmcgdGFnOiA8LyR7dGFnTmFtZX0+YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RPcGVuZWQgPSB0YWdTdGFja1t0YWdTdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAobGFzdE9wZW5lZC50YWcgPT09IHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnU3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWlzbWF0Y2hlZCB0YWdcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goYE1pc21hdGNoZWQgdGFnczogRXhwZWN0ZWQgY2xvc2luZyB0YWcgZm9yIDwke2xhc3RPcGVuZWQudGFnfT4sIGZvdW5kIDwvJHt0YWdOYW1lfT5gKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgbWF0Y2hpbmcgb3BlbmluZyB0YWcgaW4gc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hJbmRleCA9IHRhZ1N0YWNrLmZpbmRJbmRleCh0ID0+IHQudGFnID09PSB0YWdOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoSW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnU3RhY2suc3BsaWNlKG1hdGNoSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFpc1NlbGZDbG9zaW5nKSB7XG4gICAgICAgICAgICAvLyBPcGVuaW5nIHRhZyAtIHB1c2ggdG8gc3RhY2tcbiAgICAgICAgICAgIHRhZ1N0YWNrLnB1c2goeyB0YWc6IHRhZ05hbWUsIHBvc2l0aW9uOiBtYXRjaC5pbmRleCB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCB0YWdzIHJlbWFpbmluZyBpbiBzdGFja1xuICAgIGlmICh0YWdTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRhZ1N0YWNrLmZvckVhY2goKHsgdGFnIH0pID0+IHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBVbmNsb3NlZCB0YWc6IDwke3RhZ30+IGlzIG1pc3NpbmcgY2xvc2luZyB0YWcgPC8ke3RhZ30+YCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBtYWxmb3JtZWQgYXR0cmlidXRlcyAobm8gdmFsdWUsIG1hbGZvcm1lZCBzeW50YXgpXG4gICAgY29uc3QgbWFsZm9ybWVkQXR0clBhdHRlcm4gPSAvPFtePl0rXFxzKyhcXHcrKVxccyo9XFxzKig/IVtcIlxcd10pW14+XSo+L2c7XG4gICAgbGV0IGF0dHJNYXRjaDtcbiAgICB3aGlsZSAoKGF0dHJNYXRjaCA9IG1hbGZvcm1lZEF0dHJQYXR0ZXJuLmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGBNYWxmb3JtZWQgYXR0cmlidXRlIHN5bnRheDogJHthdHRyTWF0Y2hbMF0uc3Vic3RyaW5nKDAsIDUwKX0ke2F0dHJNYXRjaFswXS5sZW5ndGggPiA1MCA/ICcuLi4nIDogJyd9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVycm9ycztcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBtYXJrZG93biB0byBIVE1MXG4gKiBAcGFyYW0gbWFya2Rvd24gLSBUaGUgbWFya2Rvd24gc3RyaW5nIHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIEhUTUwgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrZG93blRvSFRNTChtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIW1hcmtkb3duKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIENvbmZpZ3VyZSBtYXJrZWQgZm9yIHNlY3VyaXR5XG4gICAgICAgIG1hcmtlZC5zZXRPcHRpb25zKHtcbiAgICAgICAgICAgIGJyZWFrczogdHJ1ZSxcbiAgICAgICAgICAgIGdmbTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBodG1sID0gbWFya2VkLnBhcnNlKG1hcmtkb3duKSBhcyBzdHJpbmc7XG4gICAgICAgIC8vIFNhbml0aXplIHRoZSBnZW5lcmF0ZWQgSFRNTFxuICAgICAgICByZXR1cm4gc2FuaXRpemVIVE1MKGh0bWwpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBwYXJzaW5nIG1hcmtkb3duOlwiLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBlc2NhcGVIVE1MKG1hcmtkb3duKTtcbiAgICB9XG59XG5cbi8qKlxuICogRXNjYXBlcyBIVE1MIHNwZWNpYWwgY2hhcmFjdGVyc1xuICogQHBhcmFtIHRleHQgLSBUaGUgdGV4dCB0byBlc2NhcGVcbiAqIEByZXR1cm5zIEVzY2FwZWQgdGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlSFRNTCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZGl2LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICByZXR1cm4gZGl2LmlubmVySFRNTDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBwbGFpbiB0ZXh0IHRvIEhUTUwgd2l0aCBsaW5lIGJyZWFrc1xuICogQHBhcmFtIHRleHQgLSBUaGUgcGxhaW4gdGV4dCB0byBjb252ZXJ0XG4gKiBAcmV0dXJucyBIVE1MIHN0cmluZyB3aXRoIGxpbmUgYnJlYWtzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0VG9IVE1MKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIC8vIEVzY2FwZSBIVE1MIGNoYXJhY3RlcnMgYW5kIGNvbnZlcnQgbGluZSBicmVha3MgdG8gPGJyPlxuICAgIGNvbnN0IGVzY2FwZWQgPSBlc2NhcGVIVE1MKHRleHQpO1xuICAgIHJldHVybiBlc2NhcGVkLnJlcGxhY2UoL1xcbi9nLCBcIjxicj5cIik7XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0IGFuZCByZXR1cm5zIHNhbml0aXplZCBIVE1MXG4gKiBAcGFyYW0gY29udGVudCAtIFRoZSBjb250ZW50IHN0cmluZ1xuICogQHBhcmFtIGZvcm1hdCAtIFRoZSBjb250ZW50IGZvcm1hdCAoaHRtbCwgbWFya2Rvd24sIG9yIHRleHQpXG4gKiBAcmV0dXJucyBTYW5pdGl6ZWQgSFRNTCBzdHJpbmcgb3IgZXNjYXBlZCBtYXJrZG93blxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0NvbnRlbnQoY29udGVudDogc3RyaW5nLCBmb3JtYXQ6IENvbnRlbnRGb3JtYXQpOiBzdHJpbmcge1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgcmV0dXJuIHNhbml0aXplSFRNTChjb250ZW50KTtcbiAgICAgICAgY2FzZSBcIm1hcmtkb3duXCI6XG4gICAgICAgICAgICAvLyBDb252ZXJ0IG1hcmtkb3duIHRvIEhUTUwgYW5kIHNhbml0aXplIGl0XG4gICAgICAgICAgICByZXR1cm4gbWFya2Rvd25Ub0hUTUwoY29udGVudCk7XG4gICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICByZXR1cm4gdGV4dFRvSFRNTChjb250ZW50KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFVucmVjb2duaXplZCBmb3JtYXQgLSB0cmVhdCBhcyBIVE1MIGFuZCBzYW5pdGl6ZSBmb3Igc2FmZXR5XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVucmVjb2duaXplZCBjb250ZW50IGZvcm1hdCBcIiR7Zm9ybWF0fVwiLCB0cmVhdGluZyBhcyBIVE1MYCk7XG4gICAgICAgICAgICByZXR1cm4gc2FuaXRpemVIVE1MKGNvbnRlbnQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXRzIHZhbGlkYXRpb24gd2FybmluZ3MgZm9yIGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0XG4gKiBAcGFyYW0gY29udGVudCAtIFRoZSBjb250ZW50IHN0cmluZ1xuICogQHBhcmFtIGZvcm1hdCAtIFRoZSBjb250ZW50IGZvcm1hdFxuICogQHJldHVybnMgQXJyYXkgb2Ygd2FybmluZyBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGVudFdhcm5pbmdzKGNvbnRlbnQ6IHN0cmluZywgZm9ybWF0OiBDb250ZW50Rm9ybWF0KTogc3RyaW5nW10ge1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSBcImh0bWxcIjpcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIGJvdGggc2VjdXJpdHkgaXNzdWVzIGFuZCBzeW50YXhcbiAgICAgICAgICAgIGNvbnN0IHNlY3VyaXR5V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUwoY29udGVudCk7XG4gICAgICAgICAgICBjb25zdCBzeW50YXhXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTFN5bnRheChjb250ZW50KTtcbiAgICAgICAgICAgIHJldHVybiBbLi4uc2VjdXJpdHlXYXJuaW5ncywgLi4uc3ludGF4V2FybmluZ3NdO1xuICAgICAgICBjYXNlIFwibWFya2Rvd25cIjpcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBkYW5nZXJvdXMgSFRNTCBlbWJlZGRlZCBpbiBtYXJrZG93blxuICAgICAgICAgICAgLy8gVXNlcnMgbWlnaHQgdHJ5IHRvIGluY2x1ZGUgPHNjcmlwdD4gdGFncyBpbiB0aGVpciBtYXJrZG93blxuICAgICAgICAgICAgY29uc3QgaHRtbFBhdHRlcm4gPSAvPFtePl0rPi9nO1xuICAgICAgICAgICAgY29uc3QgaHRtbE1hdGNoZXMgPSBjb250ZW50Lm1hdGNoKGh0bWxQYXR0ZXJuKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGh0bWxNYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBqdXN0IHRoZSBIVE1MIHBhcnRzIGFuZCB2YWxpZGF0ZSB0aGVtXG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBodG1sTWF0Y2hlcy5qb2luKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGh0bWxTZWN1cml0eVdhcm5pbmdzID0gdmFsaWRhdGVIVE1MKGh0bWxDb250ZW50KTtcbiAgICAgICAgICAgICAgICBjb25zdCBodG1sU3ludGF4V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUxTeW50YXgoaHRtbENvbnRlbnQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGFsbFdhcm5pbmdzID0gWy4uLmh0bWxTZWN1cml0eVdhcm5pbmdzLCAuLi5odG1sU3ludGF4V2FybmluZ3NdO1xuICAgICAgICAgICAgICAgIGlmIChhbGxXYXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGxXYXJuaW5ncy5tYXAod2FybmluZyA9PiBcbiAgICAgICAgICAgICAgICAgICAgICAgIGBFbWJlZGRlZCBIVE1MIGluIG1hcmtkb3duOiAke3dhcm5pbmd9YFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgIC8vIFRleHQgZm9ybWF0IGRvZXNuJ3QgbmVlZCB2YWxpZGF0aW9uIChldmVyeXRoaW5nIGlzIGVzY2FwZWQpXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgY3JlYXRlRWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgRkFRQWNjb3JkaW9uUHJldmlld1Byb3BzIH0gZnJvbSBcIi4uL3R5cGluZ3MvRkFRQWNjb3JkaW9uUHJvcHNcIjtcbmltcG9ydCB7IHByb2Nlc3NDb250ZW50LCBzYW5pdGl6ZUhUTUwsIGdldENvbnRlbnRXYXJuaW5ncywgQ29udGVudEZvcm1hdCB9IGZyb20gXCIuL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3JcIjtcblxuLy8gSGVscGVyIHRvIGdldCBmb3JtYXQgbGFiZWxcbmZ1bmN0aW9uIGdldEZvcm1hdExhYmVsKGZvcm1hdD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSBcIm1hcmtkb3duXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJNRFwiO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgICAgcmV0dXJuIFwiVFhUXCI7XG4gICAgICAgIGNhc2UgXCJodG1sXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gXCJIVE1MXCI7XG4gICAgfVxufVxuXG4vLyBDaGVjayBpZiBzYW5pdGl6YXRpb24gbW9kaWZpZWQgdGhlIGNvbnRlbnRcbmZ1bmN0aW9uIGNoZWNrU2FuaXRpemF0aW9uKGNvbnRlbnQ6IHN0cmluZywgZm9ybWF0OiBzdHJpbmcpOiB7IG1vZGlmaWVkOiBib29sZWFuOyBvcmlnaW5hbEh0bWw6IHN0cmluZzsgc2FuaXRpemVkSHRtbDogc3RyaW5nIH0ge1xuICAgIGlmICghY29udGVudCB8fCBmb3JtYXQgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIHJldHVybiB7IG1vZGlmaWVkOiBmYWxzZSwgb3JpZ2luYWxIdG1sOiBcIlwiLCBzYW5pdGl6ZWRIdG1sOiBcIlwiIH07XG4gICAgfVxuXG4gICAgbGV0IG9yaWdpbmFsSHRtbCA9IGNvbnRlbnQ7XG4gICAgXG4gICAgLy8gRm9yIG1hcmtkb3duLCBjb252ZXJ0IHRvIEhUTUwgZmlyc3RcbiAgICBpZiAoZm9ybWF0ID09PSBcIm1hcmtkb3duXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFNpbXBsZSBtYXJrZG93biB0byBIVE1MIGNvbnZlcnNpb24gZm9yIGNvbXBhcmlzb25cbiAgICAgICAgICAgIC8vIEluIHByb2R1Y3Rpb24sIHRoaXMgdXNlcyBtYXJrZWQuanMsIGJ1dCBmb3IgcHJldmlldyB3ZSdsbCBkbyBiYXNpYyBkZXRlY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IGhhc01hcmtkb3duU3ludGF4ID0gL1sqXyNcXFtcXF1gXS8udGVzdChjb250ZW50KTtcbiAgICAgICAgICAgIGlmIChoYXNNYXJrZG93blN5bnRheCkge1xuICAgICAgICAgICAgICAgIC8vIElmIGl0IGhhcyBtYXJrZG93biBzeW50YXgsIHdlIGtub3cgaXQgd2lsbCBiZSBjb252ZXJ0ZWRcbiAgICAgICAgICAgICAgICBvcmlnaW5hbEh0bWwgPSBjb250ZW50OyAvLyBLZWVwIGFzIGlzIGZvciBub3dcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gSWdub3JlIGVycm9yc1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIFNhbml0aXplIHRoZSBIVE1MXG4gICAgY29uc3Qgc2FuaXRpemVkSHRtbCA9IHNhbml0aXplSFRNTChvcmlnaW5hbEh0bWwpO1xuICAgIFxuICAgIC8vIENoZWNrIGlmIHNhbml0aXphdGlvbiBjaGFuZ2VkIHRoZSBjb250ZW50XG4gICAgLy8gTm9ybWFsaXplIHdoaXRlc3BhY2UgZm9yIGNvbXBhcmlzb25cbiAgICBjb25zdCBub3JtYWxpemVkT3JpZ2luYWwgPSBvcmlnaW5hbEh0bWwucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWRTYW5pdGl6ZWQgPSBzYW5pdGl6ZWRIdG1sLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICBtb2RpZmllZDogbm9ybWFsaXplZE9yaWdpbmFsICE9PSBub3JtYWxpemVkU2FuaXRpemVkLFxuICAgICAgICBvcmlnaW5hbEh0bWwsXG4gICAgICAgIHNhbml0aXplZEh0bWxcbiAgICB9O1xufVxuXG4vLyBQcmV2aWV3IGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0IC0gcmV0dXJucyBKU1ggZm9yIHJlbmRlcmluZyB3aXRoIFNBTklUSVpFRCBjb250ZW50XG5mdW5jdGlvbiBwcmV2aWV3Q29udGVudChjb250ZW50OiBzdHJpbmcsIGZvcm1hdDogc3RyaW5nKTogSlNYLkVsZW1lbnQge1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgICByZXR1cm4gPHNwYW4gc3R5bGU9e3sgZm9udFN0eWxlOiBcIml0YWxpY1wiLCBjb2xvcjogXCIjOTk5XCIgfX0+W05vIGNvbnRlbnRdPC9zcGFuPjtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgbWF4TGVuZ3RoID0gMzAwO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgY29udGVudCB0aHJvdWdoIHRoZSBzYW1lIHBpcGVsaW5lIGFzIHJ1bnRpbWVcbiAgICBjb25zdCBwcm9jZXNzZWRIdG1sID0gcHJvY2Vzc0NvbnRlbnQoY29udGVudCwgZm9ybWF0IGFzIENvbnRlbnRGb3JtYXQpO1xuICAgIGNvbnN0IHRydW5jYXRlZCA9IHByb2Nlc3NlZEh0bWwubGVuZ3RoID4gbWF4TGVuZ3RoID8gcHJvY2Vzc2VkSHRtbC5zdWJzdHJpbmcoMCwgbWF4TGVuZ3RoKSArIFwiLi4uXCIgOiBwcm9jZXNzZWRIdG1sO1xuICAgIFxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgLy8gU2hvdyByZW5kZXJlZCBIVE1MIGZyb20gbWFya2Rvd24gKHNhbWUgYXMgcnVudGltZSlcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiB0cnVuY2F0ZWQgfX1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JkV3JhcDogXCJicmVhay13b3JkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvd1dyYXA6IFwiYnJlYWstd29yZFwiXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICAvLyBTaG93IHByb2Nlc3NlZCB0ZXh0ICh3aXRoIDxicj4gdGFncywgc2FtZSBhcyBydW50aW1lKVxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHRydW5jYXRlZCB9fVxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmRXcmFwOiBcImJyZWFrLXdvcmRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93V3JhcDogXCJicmVhay13b3JkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiBcInByZS13cmFwXCJcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgY2FzZSBcImh0bWxcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFNob3cgU0FOSVRJWkVEIEhUTUwgKHNhbWUgYXMgcnVudGltZSlcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiB0cnVuY2F0ZWQgfX1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JkV3JhcDogXCJicmVhay13b3JkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvd1dyYXA6IFwiYnJlYWstd29yZFwiXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJldmlldyhwcm9wczogRkFRQWNjb3JkaW9uUHJldmlld1Byb3BzKSB7XG4gICAgY29uc3QgeyBkYXRhU291cmNlVHlwZSwgZmFxSXRlbXMsIGRhdGFTb3VyY2UsIHNob3dUb2dnbGVCdXR0b24gfSA9IHByb3BzO1xuICAgIFxuICAgIC8vIERldGVybWluZSBpdGVtIGNvdW50IGFuZCBzb3VyY2VcbiAgICBsZXQgaXRlbUNvdW50ID0gMDtcbiAgICBsZXQgc291cmNlTGFiZWwgPSBcIlwiO1xuICAgIFxuICAgIGlmIChkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgIC8vIERhdGFiYXNlIG1vZGVcbiAgICAgICAgc291cmNlTGFiZWwgPSBcIkRhdGFiYXNlIEVudGl0eVwiO1xuICAgICAgICBpZiAoZGF0YVNvdXJjZSAmJiB0eXBlb2YgZGF0YVNvdXJjZSA9PT0gXCJvYmplY3RcIiAmJiBcImNhcHRpb25cIiBpbiBkYXRhU291cmNlKSB7XG4gICAgICAgICAgICBzb3VyY2VMYWJlbCA9IGBEYXRhYmFzZTogJHtkYXRhU291cmNlLmNhcHRpb259YDtcbiAgICAgICAgfVxuICAgICAgICAvLyBJbiBwcmV2aWV3IG1vZGUsIHdlIGNhbid0IGdldCBhY3R1YWwgY291bnQsIHNob3cgcGxhY2Vob2xkZXJcbiAgICAgICAgaXRlbUNvdW50ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdGF0aWMgbW9kZVxuICAgICAgICBzb3VyY2VMYWJlbCA9IFwiU3RhdGljIEl0ZW1zXCI7XG4gICAgICAgIGl0ZW1Db3VudCA9IGZhcUl0ZW1zID8gZmFxSXRlbXMubGVuZ3RoIDogMDtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLXByZXZpZXdcIlxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNlNWU1ZTVcIixcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAgICAgICAgICAgcGFkZGluZzogXCIxNnB4XCIsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmYWZhZmFcIlxuICAgICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgICAge3Nob3dUb2dnbGVCdXR0b24gJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgbWFyZ2luQm90dG9tOiBcIjEycHhcIiwgdGV4dEFsaWduOiBcInJpZ2h0XCIgfX0+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCI4cHggMjRweFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZjVmNWY1XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiIzMzMzMzM1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogXCIycHggc29saWQgI2QxZDFkMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogXCI2cHhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6IFwiZGVmYXVsdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IDUwMFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgSGlkZSBBbGxcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIiwgZ2FwOiBcIjhweFwiIH19PlxuICAgICAgICAgICAgICAgIHtkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiID8gKFxuICAgICAgICAgICAgICAgICAgICAvLyBEYXRhYmFzZSBtb2RlIHByZXZpZXdcbiAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIjMycHhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiIzAwNzBmM1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogXCIycHggZGFzaGVkICMwMDcwZjNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiNmMGY3ZmZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9e3sgbWFyZ2luOiBcIjAgMCA4cHggMFwiLCBmb250V2VpZ2h0OiBcImJvbGRcIiwgZm9udFNpemU6IFwiMTZweFwiIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIPCfk4oge3NvdXJjZUxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9e3sgbWFyZ2luOiAwLCBmb250U2l6ZTogXCIxMnB4XCIsIGNvbG9yOiBcIiM2NjZcIiB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGQVEgaXRlbXMgd2lsbCBiZSBsb2FkZWQgZnJvbSB0aGUgY29uZmlndXJlZCBkYXRhIHNvdXJjZSBhdCBydW50aW1lLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+Q29uZmlndXJhdGlvbjo8L3N0cm9uZz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdW1tYXJ5OiB7cHJvcHMuc3VtbWFyeUF0dHJpYnV0ZSB8fCBcIltOb3QgY29uZmlndXJlZF1cIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb250ZW50OiB7cHJvcHMuY29udGVudEF0dHJpYnV0ZSB8fCBcIltOb3QgY29uZmlndXJlZF1cIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb3JtYXQ6IHtwcm9wcy5mb3JtYXRBdHRyaWJ1dGUgfHwgXCJbT3B0aW9uYWwgLSBkZWZhdWx0cyB0byBIVE1MXVwifVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApIDogaXRlbUNvdW50ID4gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgLy8gU3RhdGljIG1vZGUgcHJldmlld1xuICAgICAgICAgICAgICAgICAgICBmYXFJdGVtcz8ubWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudFZhbHVlID0gaXRlbS5jb250ZW50IHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBpdGVtLmNvbnRlbnRGb3JtYXQgfHwgXCJodG1sXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB2YWxpZGF0aW9uIHdhcm5pbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3YXJuaW5ncyA9IGdldENvbnRlbnRXYXJuaW5ncyhjb250ZW50VmFsdWUsIGZvcm1hdCBhcyBDb250ZW50Rm9ybWF0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgc2FuaXRpemF0aW9uIHdpbGwgbW9kaWZ5IHRoZSBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6YXRpb25DaGVjayA9IGNoZWNrU2FuaXRpemF0aW9uKGNvbnRlbnRWYWx1ZSwgZm9ybWF0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tYmluZSBhbGwgaXNzdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhbGxXYXJuaW5ncyA9IFsuLi53YXJuaW5nc107XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2FuaXRpemF0aW9uQ2hlY2subW9kaWZpZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxXYXJuaW5ncy5wdXNoKFwiQ29udGVudCB3aWxsIGJlIHNhbml0aXplZCBhdCBydW50aW1lIChkYW5nZXJvdXMgZWxlbWVudHMgcmVtb3ZlZClcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc0lzc3VlcyA9IGFsbFdhcm5pbmdzLmxlbmd0aCA+IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2luZGV4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBoYXNJc3N1ZXMgPyBcIjJweCBzb2xpZCAjZmY4YzAwXCIgOiBcIjFweCBzb2xpZCAjMDA3MGYzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIxMnB4IDE2cHhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2YwZjdmZlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiBcInNwYWNlLWJldHdlZW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRXZWlnaHQ6IDUwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjMDA3MGYzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZsZXg6IDEgfX0+e2l0ZW0uc3VtbWFyeSB8fCBcIltRdWVzdGlvbi9TdW1tYXJ5XVwifTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IFwiMTBweFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIjJweCA2cHhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBoYXNJc3N1ZXMgPyBcIiNmZmYzZTBcIiA6IFwiI2U4ZjRmZlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiM3B4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiBcIjhweFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogaGFzSXNzdWVzID8gXCIjZmY4YzAwXCIgOiBcIiMwMDcwZjNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke2hhc0lzc3VlcyA/IFwiI2ZmZDY5OVwiIDogXCIjYzNlMGZmXCJ9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2dldEZvcm1hdExhYmVsKGZvcm1hdCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBjb2xvcjogXCIjMDA3MGYzXCIsIHRyYW5zZm9ybTogXCJyb3RhdGUoMTgwZGVnKVwiLCBkaXNwbGF5OiBcImlubGluZS1ibG9ja1wiIH19PuKWvDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBFeHBhbmRlZCBjb250ZW50IHByZXZpZXcgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIxMnB4IDE2cHhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclRvcDogXCIxcHggc29saWQgI2U1ZTVlNVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aGFzSXNzdWVzICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2ZmZjhmMFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjZmZkNjk5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIjhweCAxMnB4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Cb3R0b206IFwiOHB4XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFdlaWdodDogXCJib2xkXCIsIGNvbG9yOiBcIiNmZjhjMDBcIiwgZm9udFNpemU6IFwiMTJweFwiLCBtYXJnaW5Cb3R0b206IFwiNHB4XCIgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDimqDvuI8gQ29udGVudCBXYXJuaW5nczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBzdHlsZT17eyBtYXJnaW46IFwiMFwiLCBwYWRkaW5nTGVmdDogXCIyMHB4XCIsIGNvbG9yOiBcIiNkOTc3MDBcIiwgZm9udFNpemU6IFwiMTFweFwiIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2FsbFdhcm5pbmdzLm1hcCgod2FybmluZywgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2l9Pnt3YXJuaW5nfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Nhbml0aXphdGlvbkNoZWNrLm1vZGlmaWVkICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiBcIjhweFwiLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogXCIxMXB4XCIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBcIiM2NjZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U3R5bGU6IFwiaXRhbGljXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIPCfkqEgUHJldmlldyBzaG93cyBzYW5pdGl6ZWQgb3V0cHV0IChtYXRjaGluZyBydW50aW1lIGJlaGF2aW9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBcIiM1NTU1NTVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IFwiMTRweFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiBcIjEuNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cHJldmlld0NvbnRlbnQoY29udGVudFZhbHVlLCBmb3JtYXQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAvLyBFbXB0eSBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiMzJweFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRBbGlnbjogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjOTk5OTk5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBkYXNoZWQgI2QxZDFkMVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9e3sgbWFyZ2luOiAwIH19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vIEZBUSBpdGVtcyBjb25maWd1cmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNtYWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiBhcyBhbnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJDb25maWd1cmUgdGhlIGRhdGEgc291cmNlIGluIHRoZSBwcm9wZXJ0aWVzIHBhbmVsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJBZGQgRkFRIGl0ZW1zIGluIHRoZSBwcm9wZXJ0aWVzIHBhbmVsXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zbWFsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICAgIG1hcmdpblRvcDogXCIxMnB4XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZjBmN2ZmXCIsXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IFwiMTJweFwiLFxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjMDA3MGYzXCIsXG4gICAgICAgICAgICAgICAgICAgIHRleHRBbGlnbjogXCJjZW50ZXJcIlxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgRkFRIEFjY29yZGlvbiBXaWRnZXQgLSB7c291cmNlTGFiZWx9XG4gICAgICAgICAgICAgICAge2RhdGFTb3VyY2VUeXBlID09PSBcInN0YXRpY1wiICYmIGAgKCR7aXRlbUNvdW50fSBpdGVtJHtpdGVtQ291bnQgIT09IDEgPyBcInNcIiA6IFwiXCJ9KWB9XG4gICAgICAgICAgICAgICAge2RhdGFTb3VyY2VUeXBlID09PSBcInN0YXRpY1wiICYmIGl0ZW1Db3VudCA+IDAgJiYgXCIgLSBQcmV2aWV3IHNob3dzIGV4cGFuZGVkIHN0YXRlXCJ9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpZXdDc3MoKSB7XG4gICAgcmV0dXJuIGBcbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcge1xuICAgIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEFyaWFsLCBzYW5zLXNlcmlmO1xufVxuXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IGEge1xuICAgIGNvbG9yOiAjMDA3MGYzO1xuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xufVxuXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IHN0cm9uZyxcbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcgYiB7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICBjb2xvcjogIzMzMztcbn1cblxuLmZhcS1hY2NvcmRpb24tcHJldmlldyBlbSxcbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcgaSB7XG4gICAgZm9udC1zdHlsZTogaXRhbGljO1xufVxuXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IGNvZGUge1xuICAgIHBhZGRpbmc6IDJweCA0cHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2Y1ZjVmNTtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjZTVlNWU1O1xuICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICBmb250LWZhbWlseTogXCJDb3VyaWVyIE5ld1wiLCBDb3VyaWVyLCBtb25vc3BhY2U7XG4gICAgZm9udC1zaXplOiAwLjllbTtcbn1cblxuLmZhcS1hY2NvcmRpb24tcHJldmlldyB1bCxcbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcgb2wge1xuICAgIG1hcmdpbjogMC41cmVtIDA7XG4gICAgcGFkZGluZy1sZWZ0OiAxLjVyZW07XG59XG5cbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcgbGkge1xuICAgIG1hcmdpbjogMC4yNXJlbSAwO1xufVxuXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IHAge1xuICAgIG1hcmdpbjogMC41cmVtIDA7XG59XG5cbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcgaDEsXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IGgyLFxuLmZhcS1hY2NvcmRpb24tcHJldmlldyBoMyxcbi5mYXEtYWNjb3JkaW9uLXByZXZpZXcgaDQsXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IGg1LFxuLmZhcS1hY2NvcmRpb24tcHJldmlldyBoNiB7XG4gICAgbWFyZ2luOiAwLjVyZW0gMDtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGNvbG9yOiAjMzMzO1xufVxuXG4uZmFxLWFjY29yZGlvbi1wcmV2aWV3IGJsb2NrcXVvdGUge1xuICAgIG1hcmdpbjogMC41cmVtIDA7XG4gICAgcGFkZGluZy1sZWZ0OiAxcmVtO1xuICAgIGJvcmRlci1sZWZ0OiA0cHggc29saWQgIzAwNzBmMztcbiAgICBjb2xvcjogIzY2NjtcbiAgICBmb250LXN0eWxlOiBpdGFsaWM7XG59XG5gO1xufVxuIl0sIm5hbWVzIjpbImVudHJpZXMiLCJzZXRQcm90b3R5cGVPZiIsImlzRnJvemVuIiwiZ2V0UHJvdG90eXBlT2YiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJPYmplY3QiLCJmcmVlemUiLCJzZWFsIiwiY3JlYXRlIiwiYXBwbHkiLCJjb25zdHJ1Y3QiLCJSZWZsZWN0IiwieCIsImZ1bmMiLCJ0aGlzQXJnIiwiX2xlbiIsImFyZ3VtZW50cyIsImxlbmd0aCIsImFyZ3MiLCJBcnJheSIsIl9rZXkiLCJGdW5jIiwiX2xlbjIiLCJfa2V5MiIsImFycmF5Rm9yRWFjaCIsInVuYXBwbHkiLCJwcm90b3R5cGUiLCJmb3JFYWNoIiwiYXJyYXlMYXN0SW5kZXhPZiIsImxhc3RJbmRleE9mIiwiYXJyYXlQb3AiLCJwb3AiLCJhcnJheVB1c2giLCJwdXNoIiwiYXJyYXlTcGxpY2UiLCJzcGxpY2UiLCJzdHJpbmdUb0xvd2VyQ2FzZSIsIlN0cmluZyIsInRvTG93ZXJDYXNlIiwic3RyaW5nVG9TdHJpbmciLCJ0b1N0cmluZyIsInN0cmluZ01hdGNoIiwibWF0Y2giLCJzdHJpbmdSZXBsYWNlIiwicmVwbGFjZSIsInN0cmluZ0luZGV4T2YiLCJpbmRleE9mIiwic3RyaW5nVHJpbSIsInRyaW0iLCJvYmplY3RIYXNPd25Qcm9wZXJ0eSIsImhhc093blByb3BlcnR5IiwicmVnRXhwVGVzdCIsIlJlZ0V4cCIsInRlc3QiLCJ0eXBlRXJyb3JDcmVhdGUiLCJ1bmNvbnN0cnVjdCIsIlR5cGVFcnJvciIsImxhc3RJbmRleCIsIl9sZW4zIiwiX2tleTMiLCJfbGVuNCIsIl9rZXk0IiwiYWRkVG9TZXQiLCJzZXQiLCJhcnJheSIsInRyYW5zZm9ybUNhc2VGdW5jIiwidW5kZWZpbmVkIiwibCIsImVsZW1lbnQiLCJsY0VsZW1lbnQiLCJjbGVhbkFycmF5IiwiaW5kZXgiLCJpc1Byb3BlcnR5RXhpc3QiLCJjbG9uZSIsIm9iamVjdCIsIm5ld09iamVjdCIsInByb3BlcnR5IiwidmFsdWUiLCJpc0FycmF5IiwiY29uc3RydWN0b3IiLCJsb29rdXBHZXR0ZXIiLCJwcm9wIiwiZGVzYyIsImdldCIsImZhbGxiYWNrVmFsdWUiLCJMIiwiYXN5bmMiLCJicmVha3MiLCJleHRlbnNpb25zIiwiZ2ZtIiwiaG9va3MiLCJwZWRhbnRpYyIsInJlbmRlcmVyIiwic2lsZW50IiwidG9rZW5pemVyIiwid2Fsa1Rva2VucyIsIlQiLCJaIiwidSIsIkRPTVB1cmlmeSIsIm1hcmtlZCIsIl9qc3giLCJfanN4cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsTUFBTTtFQUNKQSxPQUFPO0VBQ1BDLGNBQWM7RUFDZEMsUUFBUTtFQUNSQyxjQUFjO0FBQ2RDLEVBQUFBLHdCQUFBQTtBQUNELENBQUEsR0FBR0MsTUFBTSxDQUFBO0FBRVYsSUFBSTtFQUFFQyxNQUFNO0VBQUVDLElBQUk7QUFBRUMsRUFBQUEsTUFBQUE7QUFBTSxDQUFFLEdBQUdILE1BQU0sQ0FBQztBQUN0QyxJQUFJO0VBQUVJLEtBQUs7QUFBRUMsRUFBQUEsU0FBQUE7QUFBVyxDQUFBLEdBQUcsT0FBT0MsT0FBTyxLQUFLLFdBQVcsSUFBSUEsT0FBTyxDQUFBO0FBRXBFLElBQUksQ0FBQ0wsTUFBTSxFQUFFO0FBQ1hBLEVBQUFBLE1BQU0sR0FBRyxTQUFBQSxNQUFhQSxDQUFBTSxDQUFJLEVBQUE7QUFDeEIsSUFBQSxPQUFPQSxDQUFDLENBQUE7QUFDVCxHQUFBLENBQUE7QUFDSCxDQUFBO0FBRUEsSUFBSSxDQUFDTCxJQUFJLEVBQUU7QUFDVEEsRUFBQUEsSUFBSSxHQUFHLFNBQUFBLElBQWFBLENBQUFLLENB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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM5TU8sU0FBU0MsSUFBNEc7RUFDMUgsT0FBTztBQUNMQyxJQUFBQSxLQUFBLEVBQU8sQ0FBQSxDQUFBO0FBQ1BDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7QUFDUkMsSUFBQUEsVUFBQSxFQUFZLElBQUE7QUFDWkMsSUFBQUEsR0FBQSxFQUFLLENBQUEsQ0FBQTtBQUNMQyxJQUFBQSxLQUFBLEVBQU8sSUFBQTtBQUNQQyxJQUFBQSxRQUFBLEVBQVUsQ0FBQSxDQUFBO0FBQ1ZDLElBQUFBLFFBQUEsRUFBVSxJQUFBO0FBQ1ZDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7QUFDUkMsSUFBQUEsU0FBQSxFQUFXLElBQUE7QUFDWEMsSUFBQUEsVUFBQSxFQUFZLElBQUE7R0FFaEIsQ0FBQTtBQUFBLENBQUE7QUFFTyxJQUFJQyxDQUFBLEdBQXFDWCxDQUFBLEVBQWEsQ0FBQTtBQUV0RCxTQUFTWSxDQUFBQSxDQUErREMsQ0FBQSxFQUEwRDtBQUN2SUYsRUFBQUEsQ0FBQSxHQUFZRSxDQUNkLENBQUE7QUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
