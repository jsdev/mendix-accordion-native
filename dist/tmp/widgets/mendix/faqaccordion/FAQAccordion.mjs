import { jsx, jsxs } from 'react/jsx-runtime';
import { useMemo, useState, useEffect } from 'react';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var classnames = {exports: {}};

/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/

var hasRequiredClassnames;

function requireClassnames () {
	if (hasRequiredClassnames) return classnames.exports;
	hasRequiredClassnames = 1;
	(function (module) {
		/* global define */

		(function () {

		  var hasOwn = {}.hasOwnProperty;
		  function classNames() {
		    var classes = '';
		    for (var i = 0; i < arguments.length; i++) {
		      var arg = arguments[i];
		      if (arg) {
		        classes = appendClass(classes, parseValue(arg));
		      }
		    }
		    return classes;
		  }
		  function parseValue(arg) {
		    if (typeof arg === 'string' || typeof arg === 'number') {
		      return arg;
		    }
		    if (typeof arg !== 'object') {
		      return '';
		    }
		    if (Array.isArray(arg)) {
		      return classNames.apply(null, arg);
		    }
		    if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
		      return arg.toString();
		    }
		    var classes = '';
		    for (var key in arg) {
		      if (hasOwn.call(arg, key) && arg[key]) {
		        classes = appendClass(classes, key);
		      }
		    }
		    return classes;
		  }
		  function appendClass(value, newClass) {
		    if (!newClass) {
		      return value;
		    }
		    if (value) {
		      return value + ' ' + newClass;
		    }
		    return value + newClass;
		  }
		  if (module.exports) {
		    classNames.default = classNames;
		    module.exports = classNames;
		  } else {
		    window.classNames = classNames;
		  }
		})(); 
	} (classnames));
	return classnames.exports;
}

var classnamesExports = requireClassnames();
var classNames = /*@__PURE__*/getDefaultExportFromCjs(classnamesExports);

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

/**
 * Normalizes content format value to valid format or defaults to HTML
 * @param format - Raw format value from database or configuration
 * @returns Valid ContentFormatEnum value
 */
function normalizeContentFormat(format) {
    if (!format) {
        return "html";
    }
    const normalized = format.toLowerCase().trim();
    // Check if it's a valid format
    if (normalized === "html" || normalized === "markdown" || normalized === "text") {
        return normalized;
    }
    // Unrecognized format - default to HTML
    console.warn(`FAQ Accordion: Unrecognized content format "${format}", defaulting to HTML`);
    return "html";
}
function FAQAccordion(props) {
    const { dataSourceType, faqItems, dataSource, summaryAttribute, contentAttribute, formatAttribute, defaultExpandAll, showToggleButton, toggleButtonText, animationDuration } = props;
    // Get FAQ items from either static configuration or database
    const items = useMemo(() => {
        if (dataSourceType === "database" && dataSource && dataSource.status === "available") {
            // Database mode: read from data source
            return dataSource.items?.map((item) => {
                const summary = summaryAttribute?.get(item).value || "Question";
                const content = contentAttribute?.get(item).value || "";
                const formatValue = formatAttribute?.get(item).value;
                const format = normalizeContentFormat(formatValue);
                return {
                    summary,
                    content,
                    contentFormat: format
                };
            }) || [];
        }
        else {
            // Static mode: use configured items
            return faqItems?.map(item => ({
                summary: item.summary?.value || "Question",
                content: item.content?.value || "",
                contentFormat: normalizeContentFormat(item.contentFormat)
            })) || [];
        }
    }, [dataSourceType, dataSource, faqItems, summaryAttribute, contentAttribute, formatAttribute]);
    // State to track which items are expanded
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [allExpanded, setAllExpanded] = useState(defaultExpandAll);
    // Initialize expanded state based on defaultExpandAll
    useEffect(() => {
        if (defaultExpandAll) {
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
        }
    }, [defaultExpandAll, items]);
    // Toggle individual item
    const toggleItem = (index) => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            }
            else {
                newSet.add(index);
            }
            return newSet;
        });
    };
    // Toggle all items
    const toggleAll = () => {
        if (allExpanded) {
            // Collapse all
            setExpandedItems(new Set());
            setAllExpanded(false);
        }
        else {
            // Expand all
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
            setAllExpanded(true);
        }
    };
    // Update allExpanded state based on individual toggles
    useEffect(() => {
        if (items) {
            const allAreExpanded = items.length > 0 && expandedItems.size === items.length;
            setAllExpanded(allAreExpanded);
        }
    }, [expandedItems, items]);
    // Show loading state for database mode
    if (dataSourceType === "database" && dataSource && dataSource.status === "loading") {
        return (jsx("div", { className: "faq-accordion-loading", children: jsx("p", { children: "Loading FAQ items..." }) }));
    }
    if (!items || items.length === 0) {
        return (jsx("div", { className: "faq-accordion-empty", children: jsx("p", { children: "No FAQ items configured" }) }));
    }
    const getToggleButtonText = () => {
        if (toggleButtonText && toggleButtonText.value) {
            return toggleButtonText.value;
        }
        return allExpanded ? "Hide All" : "Show All";
    };
    return (jsxs("div", { className: "faq-accordion-container", children: [showToggleButton && (jsx("div", { className: "faq-accordion-header", children: jsx("button", { className: classNames("faq-toggle-all-btn", {
                        "faq-toggle-all-btn--expanded": allExpanded
                    }), onClick: toggleAll, type: "button", children: getToggleButtonText() }) })), jsx("div", { className: "faq-accordion-items", children: items.map((item, index) => {
                    const isExpanded = expandedItems.has(index);
                    const summaryValue = item.summary;
                    const contentValue = item.content;
                    const contentFormat = item.contentFormat;
                    // Process content based on format and sanitize
                    const processedContent = processContent(contentValue, contentFormat);
                    // Get validation warnings (only for HTML format)
                    const warnings = getContentWarnings(contentValue, contentFormat);
                    return (jsxs("details", { className: classNames("faq-item", {
                            "faq-item--expanded": isExpanded
                        }), open: isExpanded, style: {
                            "--animation-duration": `${animationDuration || 300}ms`
                        }, children: [jsxs("summary", { className: "faq-item-summary", onClick: (e) => {
                                    e.preventDefault();
                                    toggleItem(index);
                                }, onKeyDown: (e) => {
                                    // Handle keyboard navigation
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleItem(index);
                                    }
                                }, tabIndex: 0, role: "button", "aria-expanded": isExpanded, children: [jsx("span", { className: "faq-item-summary-text", children: summaryValue }), jsx("span", { className: classNames("faq-item-icon", {
                                            "faq-item-icon--expanded": isExpanded
                                        }), children: jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: jsx("path", { d: "M4 6L8 10L12 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }), jsxs("div", { className: "faq-item-content", children: [warnings.length > 0 && (jsx("div", { className: "faq-item-warnings", children: warnings.map((warning, wIndex) => (jsxs("div", { className: "faq-item-warning", children: ["\u26A0\uFE0F ", warning] }, wIndex))) })), jsx("div", { className: "faq-item-content-inner", dangerouslySetInnerHTML: { __html: processedContent } })] })] }, index));
                }) })] }));
}

export { FAQAccordion };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRkFRQWNjb3JkaW9uLm1qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsYXNzbmFtZXMvaW5kZXguanMiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZG9tcHVyaWZ5L2Rpc3QvcHVyaWZ5LmVzLm1qcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC5lc20uanMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvdXRpbHMvY29udGVudFByb2Nlc3Nvci50cyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9GQVFBY2NvcmRpb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuXHRDb3B5cmlnaHQgKGMpIDIwMTggSmVkIFdhdHNvbi5cblx0TGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcblx0aHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoYXJnKSB7XG5cdFx0XHRcdGNsYXNzZXMgPSBhcHBlbmRDbGFzcyhjbGFzc2VzLCBwYXJzZVZhbHVlKGFyZykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzO1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VWYWx1ZSAoYXJnKSB7XG5cdFx0aWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG5cdFx0XHRyZXR1cm4gYXJnO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYXJnICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblxuXHRcdGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdHJldHVybiBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cdFx0fVxuXG5cdFx0aWYgKGFyZy50b1N0cmluZyAhPT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAmJiAhYXJnLnRvU3RyaW5nLnRvU3RyaW5nKCkuaW5jbHVkZXMoJ1tuYXRpdmUgY29kZV0nKSkge1xuXHRcdFx0cmV0dXJuIGFyZy50b1N0cmluZygpO1xuXHRcdH1cblxuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdGNsYXNzZXMgPSBhcHBlbmRDbGFzcyhjbGFzc2VzLCBrZXkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kQ2xhc3MgKHZhbHVlLCBuZXdDbGFzcykge1xuXHRcdGlmICghbmV3Q2xhc3MpIHtcblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9XG5cdFxuXHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0cmV0dXJuIHZhbHVlICsgJyAnICsgbmV3Q2xhc3M7XG5cdFx0fVxuXHRcblx0XHRyZXR1cm4gdmFsdWUgKyBuZXdDbGFzcztcblx0fVxuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdGNsYXNzTmFtZXMuZGVmYXVsdCA9IGNsYXNzTmFtZXM7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBjbGFzc05hbWVzO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyByZWdpc3RlciBhcyAnY2xhc3NuYW1lcycsIGNvbnNpc3RlbnQgd2l0aCBucG0gcGFja2FnZSBuYW1lXG5cdFx0ZGVmaW5lKCdjbGFzc25hbWVzJywgW10sIGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBjbGFzc05hbWVzO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5jbGFzc05hbWVzID0gY2xhc3NOYW1lcztcblx0fVxufSgpKTtcbiIsIi8qISBAbGljZW5zZSBET01QdXJpZnkgMy4zLjEgfCAoYykgQ3VyZTUzIGFuZCBvdGhlciBjb250cmlidXRvcnMgfCBSZWxlYXNlZCB1bmRlciB0aGUgQXBhY2hlIGxpY2Vuc2UgMi4wIGFuZCBNb3ppbGxhIFB1YmxpYyBMaWNlbnNlIDIuMCB8IGdpdGh1Yi5jb20vY3VyZTUzL0RPTVB1cmlmeS9ibG9iLzMuMy4xL0xJQ0VOU0UgKi9cblxuY29uc3Qge1xuICBlbnRyaWVzLFxuICBzZXRQcm90b3R5cGVPZixcbiAgaXNGcm96ZW4sXG4gIGdldFByb3RvdHlwZU9mLFxuICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Jcbn0gPSBPYmplY3Q7XG5sZXQge1xuICBmcmVlemUsXG4gIHNlYWwsXG4gIGNyZWF0ZVxufSA9IE9iamVjdDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvbm8tbXV0YWJsZS1leHBvcnRzXG5sZXQge1xuICBhcHBseSxcbiAgY29uc3RydWN0XG59ID0gdHlwZW9mIFJlZmxlY3QgIT09ICd1bmRlZmluZWQnICYmIFJlZmxlY3Q7XG5pZiAoIWZyZWV6ZSkge1xuICBmcmVlemUgPSBmdW5jdGlvbiBmcmVlemUoeCkge1xuICAgIHJldHVybiB4O1xuICB9O1xufVxuaWYgKCFzZWFsKSB7XG4gIHNlYWwgPSBmdW5jdGlvbiBzZWFsKHgpIHtcbiAgICByZXR1cm4geDtcbiAgfTtcbn1cbmlmICghYXBwbHkpIHtcbiAgYXBwbHkgPSBmdW5jdGlvbiBhcHBseShmdW5jLCB0aGlzQXJnKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDIgPyBfbGVuIC0gMiA6IDApLCBfa2V5ID0gMjsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMl0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICB9O1xufVxuaWYgKCFjb25zdHJ1Y3QpIHtcbiAgY29uc3RydWN0ID0gZnVuY3Rpb24gY29uc3RydWN0KEZ1bmMpIHtcbiAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIgPiAxID8gX2xlbjIgLSAxIDogMCksIF9rZXkyID0gMTsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgYXJnc1tfa2V5MiAtIDFdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGdW5jKC4uLmFyZ3MpO1xuICB9O1xufVxuY29uc3QgYXJyYXlGb3JFYWNoID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUuZm9yRWFjaCk7XG5jb25zdCBhcnJheUxhc3RJbmRleE9mID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YpO1xuY29uc3QgYXJyYXlQb3AgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wb3ApO1xuY29uc3QgYXJyYXlQdXNoID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUucHVzaCk7XG5jb25zdCBhcnJheVNwbGljZSA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnNwbGljZSk7XG5jb25zdCBzdHJpbmdUb0xvd2VyQ2FzZSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50b0xvd2VyQ2FzZSk7XG5jb25zdCBzdHJpbmdUb1N0cmluZyA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyk7XG5jb25zdCBzdHJpbmdNYXRjaCA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5tYXRjaCk7XG5jb25zdCBzdHJpbmdSZXBsYWNlID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnJlcGxhY2UpO1xuY29uc3Qgc3RyaW5nSW5kZXhPZiA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mKTtcbmNvbnN0IHN0cmluZ1RyaW0gPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudHJpbSk7XG5jb25zdCBvYmplY3RIYXNPd25Qcm9wZXJ0eSA9IHVuYXBwbHkoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5jb25zdCByZWdFeHBUZXN0ID0gdW5hcHBseShSZWdFeHAucHJvdG90eXBlLnRlc3QpO1xuY29uc3QgdHlwZUVycm9yQ3JlYXRlID0gdW5jb25zdHJ1Y3QoVHlwZUVycm9yKTtcbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbiB3aXRoIGEgc3BlY2lmaWVkIHRoaXNBcmcgYW5kIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byBiZSB3cmFwcGVkIGFuZCBjYWxsZWQuXG4gKiBAcmV0dXJucyBBIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbiB3aXRoIGEgc3BlY2lmaWVkIHRoaXNBcmcgYW5kIGFyZ3VtZW50cy5cbiAqL1xuZnVuY3Rpb24gdW5hcHBseShmdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodGhpc0FyZykge1xuICAgIGlmICh0aGlzQXJnIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICB0aGlzQXJnLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMyA+IDEgPyBfbGVuMyAtIDEgOiAwKSwgX2tleTMgPSAxOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICBhcmdzW19rZXkzIC0gMV0gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgIH1cbiAgICByZXR1cm4gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncyk7XG4gIH07XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIGZ1bmMgLSBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gdG8gYmUgd3JhcHBlZCBhbmQgY2FsbGVkLlxuICogQHJldHVybnMgQSBuZXcgZnVuY3Rpb24gdGhhdCBjb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHMuXG4gKi9cbmZ1bmN0aW9uIHVuY29uc3RydWN0KEZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjQpLCBfa2V5NCA9IDA7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgIGFyZ3NbX2tleTRdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnN0cnVjdChGdW5jLCBhcmdzKTtcbiAgfTtcbn1cbi8qKlxuICogQWRkIHByb3BlcnRpZXMgdG8gYSBsb29rdXAgdGFibGVcbiAqXG4gKiBAcGFyYW0gc2V0IC0gVGhlIHNldCB0byB3aGljaCBlbGVtZW50cyB3aWxsIGJlIGFkZGVkLlxuICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgZWxlbWVudHMgdG8gYmUgYWRkZWQgdG8gdGhlIHNldC5cbiAqIEBwYXJhbSB0cmFuc2Zvcm1DYXNlRnVuYyAtIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybSB0aGUgY2FzZSBvZiBlYWNoIGVsZW1lbnQgYmVmb3JlIGFkZGluZyB0byB0aGUgc2V0LlxuICogQHJldHVybnMgVGhlIG1vZGlmaWVkIHNldCB3aXRoIGFkZGVkIGVsZW1lbnRzLlxuICovXG5mdW5jdGlvbiBhZGRUb1NldChzZXQsIGFycmF5KSB7XG4gIGxldCB0cmFuc2Zvcm1DYXNlRnVuYyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogc3RyaW5nVG9Mb3dlckNhc2U7XG4gIGlmIChzZXRQcm90b3R5cGVPZikge1xuICAgIC8vIE1ha2UgJ2luJyBhbmQgdHJ1dGh5IGNoZWNrcyBsaWtlIEJvb2xlYW4oc2V0LmNvbnN0cnVjdG9yKVxuICAgIC8vIGluZGVwZW5kZW50IG9mIGFueSBwcm9wZXJ0aWVzIGRlZmluZWQgb24gT2JqZWN0LnByb3RvdHlwZS5cbiAgICAvLyBQcmV2ZW50IHByb3RvdHlwZSBzZXR0ZXJzIGZyb20gaW50ZXJjZXB0aW5nIHNldCBhcyBhIHRoaXMgdmFsdWUuXG4gICAgc2V0UHJvdG90eXBlT2Yoc2V0LCBudWxsKTtcbiAgfVxuICBsZXQgbCA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKGwtLSkge1xuICAgIGxldCBlbGVtZW50ID0gYXJyYXlbbF07XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgbGNFbGVtZW50ID0gdHJhbnNmb3JtQ2FzZUZ1bmMoZWxlbWVudCk7XG4gICAgICBpZiAobGNFbGVtZW50ICE9PSBlbGVtZW50KSB7XG4gICAgICAgIC8vIENvbmZpZyBwcmVzZXRzIChlLmcuIHRhZ3MuanMsIGF0dHJzLmpzKSBhcmUgaW1tdXRhYmxlLlxuICAgICAgICBpZiAoIWlzRnJvemVuKGFycmF5KSkge1xuICAgICAgICAgIGFycmF5W2xdID0gbGNFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQgPSBsY0VsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHNldFtlbGVtZW50XSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIHNldDtcbn1cbi8qKlxuICogQ2xlYW4gdXAgYW4gYXJyYXkgdG8gaGFyZGVuIGFnYWluc3QgQ1NQUFxuICpcbiAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSB0byBiZSBjbGVhbmVkLlxuICogQHJldHVybnMgVGhlIGNsZWFuZWQgdmVyc2lvbiBvZiB0aGUgYXJyYXlcbiAqL1xuZnVuY3Rpb24gY2xlYW5BcnJheShhcnJheSkge1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgYXJyYXkubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgY29uc3QgaXNQcm9wZXJ0eUV4aXN0ID0gb2JqZWN0SGFzT3duUHJvcGVydHkoYXJyYXksIGluZGV4KTtcbiAgICBpZiAoIWlzUHJvcGVydHlFeGlzdCkge1xuICAgICAgYXJyYXlbaW5kZXhdID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuLyoqXG4gKiBTaGFsbG93IGNsb25lIGFuIG9iamVjdFxuICpcbiAqIEBwYXJhbSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIGJlIGNsb25lZC5cbiAqIEByZXR1cm5zIEEgbmV3IG9iamVjdCB0aGF0IGNvcGllcyB0aGUgb3JpZ2luYWwuXG4gKi9cbmZ1bmN0aW9uIGNsb25lKG9iamVjdCkge1xuICBjb25zdCBuZXdPYmplY3QgPSBjcmVhdGUobnVsbCk7XG4gIGZvciAoY29uc3QgW3Byb3BlcnR5LCB2YWx1ZV0gb2YgZW50cmllcyhvYmplY3QpKSB7XG4gICAgY29uc3QgaXNQcm9wZXJ0eUV4aXN0ID0gb2JqZWN0SGFzT3duUHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgaWYgKGlzUHJvcGVydHlFeGlzdCkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSBjbGVhbkFycmF5KHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSBjbG9uZSh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdPYmplY3Q7XG59XG4vKipcbiAqIFRoaXMgbWV0aG9kIGF1dG9tYXRpY2FsbHkgY2hlY2tzIGlmIHRoZSBwcm9wIGlzIGZ1bmN0aW9uIG9yIGdldHRlciBhbmQgYmVoYXZlcyBhY2NvcmRpbmdseS5cbiAqXG4gKiBAcGFyYW0gb2JqZWN0IC0gVGhlIG9iamVjdCB0byBsb29rIHVwIHRoZSBnZXR0ZXIgZnVuY3Rpb24gaW4gaXRzIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSBwcm9wIC0gVGhlIHByb3BlcnR5IG5hbWUgZm9yIHdoaWNoIHRvIGZpbmQgdGhlIGdldHRlciBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIFRoZSBnZXR0ZXIgZnVuY3Rpb24gZm91bmQgaW4gdGhlIHByb3RvdHlwZSBjaGFpbiBvciBhIGZhbGxiYWNrIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBsb29rdXBHZXR0ZXIob2JqZWN0LCBwcm9wKSB7XG4gIHdoaWxlIChvYmplY3QgIT09IG51bGwpIHtcbiAgICBjb25zdCBkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcCk7XG4gICAgaWYgKGRlc2MpIHtcbiAgICAgIGlmIChkZXNjLmdldCkge1xuICAgICAgICByZXR1cm4gdW5hcHBseShkZXNjLmdldCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGRlc2MudmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy52YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIG9iamVjdCA9IGdldFByb3RvdHlwZU9mKG9iamVjdCk7XG4gIH1cbiAgZnVuY3Rpb24gZmFsbGJhY2tWYWx1ZSgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZmFsbGJhY2tWYWx1ZTtcbn1cblxuY29uc3QgaHRtbCQxID0gZnJlZXplKFsnYScsICdhYmJyJywgJ2Fjcm9ueW0nLCAnYWRkcmVzcycsICdhcmVhJywgJ2FydGljbGUnLCAnYXNpZGUnLCAnYXVkaW8nLCAnYicsICdiZGknLCAnYmRvJywgJ2JpZycsICdibGluaycsICdibG9ja3F1b3RlJywgJ2JvZHknLCAnYnInLCAnYnV0dG9uJywgJ2NhbnZhcycsICdjYXB0aW9uJywgJ2NlbnRlcicsICdjaXRlJywgJ2NvZGUnLCAnY29sJywgJ2NvbGdyb3VwJywgJ2NvbnRlbnQnLCAnZGF0YScsICdkYXRhbGlzdCcsICdkZCcsICdkZWNvcmF0b3InLCAnZGVsJywgJ2RldGFpbHMnLCAnZGZuJywgJ2RpYWxvZycsICdkaXInLCAnZGl2JywgJ2RsJywgJ2R0JywgJ2VsZW1lbnQnLCAnZW0nLCAnZmllbGRzZXQnLCAnZmlnY2FwdGlvbicsICdmaWd1cmUnLCAnZm9udCcsICdmb290ZXInLCAnZm9ybScsICdoMScsICdoMicsICdoMycsICdoNCcsICdoNScsICdoNicsICdoZWFkJywgJ2hlYWRlcicsICdoZ3JvdXAnLCAnaHInLCAnaHRtbCcsICdpJywgJ2ltZycsICdpbnB1dCcsICdpbnMnLCAna2JkJywgJ2xhYmVsJywgJ2xlZ2VuZCcsICdsaScsICdtYWluJywgJ21hcCcsICdtYXJrJywgJ21hcnF1ZWUnLCAnbWVudScsICdtZW51aXRlbScsICdtZXRlcicsICduYXYnLCAnbm9icicsICdvbCcsICdvcHRncm91cCcsICdvcHRpb24nLCAnb3V0cHV0JywgJ3AnLCAncGljdHVyZScsICdwcmUnLCAncHJvZ3Jlc3MnLCAncScsICdycCcsICdydCcsICdydWJ5JywgJ3MnLCAnc2FtcCcsICdzZWFyY2gnLCAnc2VjdGlvbicsICdzZWxlY3QnLCAnc2hhZG93JywgJ3Nsb3QnLCAnc21hbGwnLCAnc291cmNlJywgJ3NwYWNlcicsICdzcGFuJywgJ3N0cmlrZScsICdzdHJvbmcnLCAnc3R5bGUnLCAnc3ViJywgJ3N1bW1hcnknLCAnc3VwJywgJ3RhYmxlJywgJ3Rib2R5JywgJ3RkJywgJ3RlbXBsYXRlJywgJ3RleHRhcmVhJywgJ3Rmb290JywgJ3RoJywgJ3RoZWFkJywgJ3RpbWUnLCAndHInLCAndHJhY2snLCAndHQnLCAndScsICd1bCcsICd2YXInLCAndmlkZW8nLCAnd2JyJ10pO1xuY29uc3Qgc3ZnJDEgPSBmcmVlemUoWydzdmcnLCAnYScsICdhbHRnbHlwaCcsICdhbHRnbHlwaGRlZicsICdhbHRnbHlwaGl0ZW0nLCAnYW5pbWF0ZWNvbG9yJywgJ2FuaW1hdGVtb3Rpb24nLCAnYW5pbWF0ZXRyYW5zZm9ybScsICdjaXJjbGUnLCAnY2xpcHBhdGgnLCAnZGVmcycsICdkZXNjJywgJ2VsbGlwc2UnLCAnZW50ZXJrZXloaW50JywgJ2V4cG9ydHBhcnRzJywgJ2ZpbHRlcicsICdmb250JywgJ2cnLCAnZ2x5cGgnLCAnZ2x5cGhyZWYnLCAnaGtlcm4nLCAnaW1hZ2UnLCAnaW5wdXRtb2RlJywgJ2xpbmUnLCAnbGluZWFyZ3JhZGllbnQnLCAnbWFya2VyJywgJ21hc2snLCAnbWV0YWRhdGEnLCAnbXBhdGgnLCAncGFydCcsICdwYXRoJywgJ3BhdHRlcm4nLCAncG9seWdvbicsICdwb2x5bGluZScsICdyYWRpYWxncmFkaWVudCcsICdyZWN0JywgJ3N0b3AnLCAnc3R5bGUnLCAnc3dpdGNoJywgJ3N5bWJvbCcsICd0ZXh0JywgJ3RleHRwYXRoJywgJ3RpdGxlJywgJ3RyZWYnLCAndHNwYW4nLCAndmlldycsICd2a2VybiddKTtcbmNvbnN0IHN2Z0ZpbHRlcnMgPSBmcmVlemUoWydmZUJsZW5kJywgJ2ZlQ29sb3JNYXRyaXgnLCAnZmVDb21wb25lbnRUcmFuc2ZlcicsICdmZUNvbXBvc2l0ZScsICdmZUNvbnZvbHZlTWF0cml4JywgJ2ZlRGlmZnVzZUxpZ2h0aW5nJywgJ2ZlRGlzcGxhY2VtZW50TWFwJywgJ2ZlRGlzdGFudExpZ2h0JywgJ2ZlRHJvcFNoYWRvdycsICdmZUZsb29kJywgJ2ZlRnVuY0EnLCAnZmVGdW5jQicsICdmZUZ1bmNHJywgJ2ZlRnVuY1InLCAnZmVHYXVzc2lhbkJsdXInLCAnZmVJbWFnZScsICdmZU1lcmdlJywgJ2ZlTWVyZ2VOb2RlJywgJ2ZlTW9ycGhvbG9neScsICdmZU9mZnNldCcsICdmZVBvaW50TGlnaHQnLCAnZmVTcGVjdWxhckxpZ2h0aW5nJywgJ2ZlU3BvdExpZ2h0JywgJ2ZlVGlsZScsICdmZVR1cmJ1bGVuY2UnXSk7XG4vLyBMaXN0IG9mIFNWRyBlbGVtZW50cyB0aGF0IGFyZSBkaXNhbGxvd2VkIGJ5IGRlZmF1bHQuXG4vLyBXZSBzdGlsbCBuZWVkIHRvIGtub3cgdGhlbSBzbyB0aGF0IHdlIGNhbiBkbyBuYW1lc3BhY2Vcbi8vIGNoZWNrcyBwcm9wZXJseSBpbiBjYXNlIG9uZSB3YW50cyB0byBhZGQgdGhlbSB0b1xuLy8gYWxsb3ctbGlzdC5cbmNvbnN0IHN2Z0Rpc2FsbG93ZWQgPSBmcmVlemUoWydhbmltYXRlJywgJ2NvbG9yLXByb2ZpbGUnLCAnY3Vyc29yJywgJ2Rpc2NhcmQnLCAnZm9udC1mYWNlJywgJ2ZvbnQtZmFjZS1mb3JtYXQnLCAnZm9udC1mYWNlLW5hbWUnLCAnZm9udC1mYWNlLXNyYycsICdmb250LWZhY2UtdXJpJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGF0Y2gnLCAnaGF0Y2hwYXRoJywgJ21lc2gnLCAnbWVzaGdyYWRpZW50JywgJ21lc2hwYXRjaCcsICdtZXNocm93JywgJ21pc3NpbmctZ2x5cGgnLCAnc2NyaXB0JywgJ3NldCcsICdzb2xpZGNvbG9yJywgJ3Vua25vd24nLCAndXNlJ10pO1xuY29uc3QgbWF0aE1sJDEgPSBmcmVlemUoWydtYXRoJywgJ21lbmNsb3NlJywgJ21lcnJvcicsICdtZmVuY2VkJywgJ21mcmFjJywgJ21nbHlwaCcsICdtaScsICdtbGFiZWxlZHRyJywgJ21tdWx0aXNjcmlwdHMnLCAnbW4nLCAnbW8nLCAnbW92ZXInLCAnbXBhZGRlZCcsICdtcGhhbnRvbScsICdtcm9vdCcsICdtcm93JywgJ21zJywgJ21zcGFjZScsICdtc3FydCcsICdtc3R5bGUnLCAnbXN1YicsICdtc3VwJywgJ21zdWJzdXAnLCAnbXRhYmxlJywgJ210ZCcsICdtdGV4dCcsICdtdHInLCAnbXVuZGVyJywgJ211bmRlcm92ZXInLCAnbXByZXNjcmlwdHMnXSk7XG4vLyBTaW1pbGFybHkgdG8gU1ZHLCB3ZSB3YW50IHRvIGtub3cgYWxsIE1hdGhNTCBlbGVtZW50cyxcbi8vIGV2ZW4gdGhvc2UgdGhhdCB3ZSBkaXNhbGxvdyBieSBkZWZhdWx0LlxuY29uc3QgbWF0aE1sRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ21hY3Rpb24nLCAnbWFsaWduZ3JvdXAnLCAnbWFsaWdubWFyaycsICdtbG9uZ2RpdicsICdtc2NhcnJpZXMnLCAnbXNjYXJyeScsICdtc2dyb3VwJywgJ21zdGFjaycsICdtc2xpbmUnLCAnbXNyb3cnLCAnc2VtYW50aWNzJywgJ2Fubm90YXRpb24nLCAnYW5ub3RhdGlvbi14bWwnLCAnbXByZXNjcmlwdHMnLCAnbm9uZSddKTtcbmNvbnN0IHRleHQgPSBmcmVlemUoWycjdGV4dCddKTtcblxuY29uc3QgaHRtbCA9IGZyZWV6ZShbJ2FjY2VwdCcsICdhY3Rpb24nLCAnYWxpZ24nLCAnYWx0JywgJ2F1dG9jYXBpdGFsaXplJywgJ2F1dG9jb21wbGV0ZScsICdhdXRvcGljdHVyZWlucGljdHVyZScsICdhdXRvcGxheScsICdiYWNrZ3JvdW5kJywgJ2JnY29sb3InLCAnYm9yZGVyJywgJ2NhcHR1cmUnLCAnY2VsbHBhZGRpbmcnLCAnY2VsbHNwYWNpbmcnLCAnY2hlY2tlZCcsICdjaXRlJywgJ2NsYXNzJywgJ2NsZWFyJywgJ2NvbG9yJywgJ2NvbHMnLCAnY29sc3BhbicsICdjb250cm9scycsICdjb250cm9sc2xpc3QnLCAnY29vcmRzJywgJ2Nyb3Nzb3JpZ2luJywgJ2RhdGV0aW1lJywgJ2RlY29kaW5nJywgJ2RlZmF1bHQnLCAnZGlyJywgJ2Rpc2FibGVkJywgJ2Rpc2FibGVwaWN0dXJlaW5waWN0dXJlJywgJ2Rpc2FibGVyZW1vdGVwbGF5YmFjaycsICdkb3dubG9hZCcsICdkcmFnZ2FibGUnLCAnZW5jdHlwZScsICdlbnRlcmtleWhpbnQnLCAnZXhwb3J0cGFydHMnLCAnZmFjZScsICdmb3InLCAnaGVhZGVycycsICdoZWlnaHQnLCAnaGlkZGVuJywgJ2hpZ2gnLCAnaHJlZicsICdocmVmbGFuZycsICdpZCcsICdpbmVydCcsICdpbnB1dG1vZGUnLCAnaW50ZWdyaXR5JywgJ2lzbWFwJywgJ2tpbmQnLCAnbGFiZWwnLCAnbGFuZycsICdsaXN0JywgJ2xvYWRpbmcnLCAnbG9vcCcsICdsb3cnLCAnbWF4JywgJ21heGxlbmd0aCcsICdtZWRpYScsICdtZXRob2QnLCAnbWluJywgJ21pbmxlbmd0aCcsICdtdWx0aXBsZScsICdtdXRlZCcsICduYW1lJywgJ25vbmNlJywgJ25vc2hhZGUnLCAnbm92YWxpZGF0ZScsICdub3dyYXAnLCAnb3BlbicsICdvcHRpbXVtJywgJ3BhcnQnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdwbGF5c2lubGluZScsICdwb3BvdmVyJywgJ3BvcG92ZXJ0YXJnZXQnLCAncG9wb3ZlcnRhcmdldGFjdGlvbicsICdwb3N0ZXInLCAncHJlbG9hZCcsICdwdWJkYXRlJywgJ3JhZGlvZ3JvdXAnLCAncmVhZG9ubHknLCAncmVsJywgJ3JlcXVpcmVkJywgJ3JldicsICdyZXZlcnNlZCcsICdyb2xlJywgJ3Jvd3MnLCAncm93c3BhbicsICdzcGVsbGNoZWNrJywgJ3Njb3BlJywgJ3NlbGVjdGVkJywgJ3NoYXBlJywgJ3NpemUnLCAnc2l6ZXMnLCAnc2xvdCcsICdzcGFuJywgJ3NyY2xhbmcnLCAnc3RhcnQnLCAnc3JjJywgJ3NyY3NldCcsICdzdGVwJywgJ3N0eWxlJywgJ3N1bW1hcnknLCAndGFiaW5kZXgnLCAndGl0bGUnLCAndHJhbnNsYXRlJywgJ3R5cGUnLCAndXNlbWFwJywgJ3ZhbGlnbicsICd2YWx1ZScsICd3aWR0aCcsICd3cmFwJywgJ3htbG5zJywgJ3Nsb3QnXSk7XG5jb25zdCBzdmcgPSBmcmVlemUoWydhY2NlbnQtaGVpZ2h0JywgJ2FjY3VtdWxhdGUnLCAnYWRkaXRpdmUnLCAnYWxpZ25tZW50LWJhc2VsaW5lJywgJ2FtcGxpdHVkZScsICdhc2NlbnQnLCAnYXR0cmlidXRlbmFtZScsICdhdHRyaWJ1dGV0eXBlJywgJ2F6aW11dGgnLCAnYmFzZWZyZXF1ZW5jeScsICdiYXNlbGluZS1zaGlmdCcsICdiZWdpbicsICdiaWFzJywgJ2J5JywgJ2NsYXNzJywgJ2NsaXAnLCAnY2xpcHBhdGh1bml0cycsICdjbGlwLXBhdGgnLCAnY2xpcC1ydWxlJywgJ2NvbG9yJywgJ2NvbG9yLWludGVycG9sYXRpb24nLCAnY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzJywgJ2NvbG9yLXByb2ZpbGUnLCAnY29sb3ItcmVuZGVyaW5nJywgJ2N4JywgJ2N5JywgJ2QnLCAnZHgnLCAnZHknLCAnZGlmZnVzZWNvbnN0YW50JywgJ2RpcmVjdGlvbicsICdkaXNwbGF5JywgJ2Rpdmlzb3InLCAnZHVyJywgJ2VkZ2Vtb2RlJywgJ2VsZXZhdGlvbicsICdlbmQnLCAnZXhwb25lbnQnLCAnZmlsbCcsICdmaWxsLW9wYWNpdHknLCAnZmlsbC1ydWxlJywgJ2ZpbHRlcicsICdmaWx0ZXJ1bml0cycsICdmbG9vZC1jb2xvcicsICdmbG9vZC1vcGFjaXR5JywgJ2ZvbnQtZmFtaWx5JywgJ2ZvbnQtc2l6ZScsICdmb250LXNpemUtYWRqdXN0JywgJ2ZvbnQtc3RyZXRjaCcsICdmb250LXN0eWxlJywgJ2ZvbnQtdmFyaWFudCcsICdmb250LXdlaWdodCcsICdmeCcsICdmeScsICdnMScsICdnMicsICdnbHlwaC1uYW1lJywgJ2dseXBocmVmJywgJ2dyYWRpZW50dW5pdHMnLCAnZ3JhZGllbnR0cmFuc2Zvcm0nLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnaW1hZ2UtcmVuZGVyaW5nJywgJ2luJywgJ2luMicsICdpbnRlcmNlcHQnLCAnaycsICdrMScsICdrMicsICdrMycsICdrNCcsICdrZXJuaW5nJywgJ2tleXBvaW50cycsICdrZXlzcGxpbmVzJywgJ2tleXRpbWVzJywgJ2xhbmcnLCAnbGVuZ3RoYWRqdXN0JywgJ2xldHRlci1zcGFjaW5nJywgJ2tlcm5lbG1hdHJpeCcsICdrZXJuZWx1bml0bGVuZ3RoJywgJ2xpZ2h0aW5nLWNvbG9yJywgJ2xvY2FsJywgJ21hcmtlci1lbmQnLCAnbWFya2VyLW1pZCcsICdtYXJrZXItc3RhcnQnLCAnbWFya2VyaGVpZ2h0JywgJ21hcmtlcnVuaXRzJywgJ21hcmtlcndpZHRoJywgJ21hc2tjb250ZW50dW5pdHMnLCAnbWFza3VuaXRzJywgJ21heCcsICdtYXNrJywgJ21hc2stdHlwZScsICdtZWRpYScsICdtZXRob2QnLCAnbW9kZScsICdtaW4nLCAnbmFtZScsICdudW1vY3RhdmVzJywgJ29mZnNldCcsICdvcGVyYXRvcicsICdvcGFjaXR5JywgJ29yZGVyJywgJ29yaWVudCcsICdvcmllbnRhdGlvbicsICdvcmlnaW4nLCAnb3ZlcmZsb3cnLCAncGFpbnQtb3JkZXInLCAncGF0aCcsICdwYXRobGVuZ3RoJywgJ3BhdHRlcm5jb250ZW50dW5pdHMnLCAncGF0dGVybnRyYW5zZm9ybScsICdwYXR0ZXJudW5pdHMnLCAncG9pbnRzJywgJ3ByZXNlcnZlYWxwaGEnLCAncHJlc2VydmVhc3BlY3RyYXRpbycsICdwcmltaXRpdmV1bml0cycsICdyJywgJ3J4JywgJ3J5JywgJ3JhZGl1cycsICdyZWZ4JywgJ3JlZnknLCAncmVwZWF0Y291bnQnLCAncmVwZWF0ZHVyJywgJ3Jlc3RhcnQnLCAncmVzdWx0JywgJ3JvdGF0ZScsICdzY2FsZScsICdzZWVkJywgJ3NoYXBlLXJlbmRlcmluZycsICdzbG9wZScsICdzcGVjdWxhcmNvbnN0YW50JywgJ3NwZWN1bGFyZXhwb25lbnQnLCAnc3ByZWFkbWV0aG9kJywgJ3N0YXJ0b2Zmc2V0JywgJ3N0ZGRldmlhdGlvbicsICdzdGl0Y2h0aWxlcycsICdzdG9wLWNvbG9yJywgJ3N0b3Atb3BhY2l0eScsICdzdHJva2UtZGFzaGFycmF5JywgJ3N0cm9rZS1kYXNob2Zmc2V0JywgJ3N0cm9rZS1saW5lY2FwJywgJ3N0cm9rZS1saW5lam9pbicsICdzdHJva2UtbWl0ZXJsaW1pdCcsICdzdHJva2Utb3BhY2l0eScsICdzdHJva2UnLCAnc3Ryb2tlLXdpZHRoJywgJ3N0eWxlJywgJ3N1cmZhY2VzY2FsZScsICdzeXN0ZW1sYW5ndWFnZScsICd0YWJpbmRleCcsICd0YWJsZXZhbHVlcycsICd0YXJnZXR4JywgJ3RhcmdldHknLCAndHJhbnNmb3JtJywgJ3RyYW5zZm9ybS1vcmlnaW4nLCAndGV4dC1hbmNob3InLCAndGV4dC1kZWNvcmF0aW9uJywgJ3RleHQtcmVuZGVyaW5nJywgJ3RleHRsZW5ndGgnLCAndHlwZScsICd1MScsICd1MicsICd1bmljb2RlJywgJ3ZhbHVlcycsICd2aWV3Ym94JywgJ3Zpc2liaWxpdHknLCAndmVyc2lvbicsICd2ZXJ0LWFkdi15JywgJ3ZlcnQtb3JpZ2luLXgnLCAndmVydC1vcmlnaW4teScsICd3aWR0aCcsICd3b3JkLXNwYWNpbmcnLCAnd3JhcCcsICd3cml0aW5nLW1vZGUnLCAneGNoYW5uZWxzZWxlY3RvcicsICd5Y2hhbm5lbHNlbGVjdG9yJywgJ3gnLCAneDEnLCAneDInLCAneG1sbnMnLCAneScsICd5MScsICd5MicsICd6JywgJ3pvb21hbmRwYW4nXSk7XG5jb25zdCBtYXRoTWwgPSBmcmVlemUoWydhY2NlbnQnLCAnYWNjZW50dW5kZXInLCAnYWxpZ24nLCAnYmV2ZWxsZWQnLCAnY2xvc2UnLCAnY29sdW1uc2FsaWduJywgJ2NvbHVtbmxpbmVzJywgJ2NvbHVtbnNwYW4nLCAnZGVub21hbGlnbicsICdkZXB0aCcsICdkaXInLCAnZGlzcGxheScsICdkaXNwbGF5c3R5bGUnLCAnZW5jb2RpbmcnLCAnZmVuY2UnLCAnZnJhbWUnLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnbGFyZ2VvcCcsICdsZW5ndGgnLCAnbGluZXRoaWNrbmVzcycsICdsc3BhY2UnLCAnbHF1b3RlJywgJ21hdGhiYWNrZ3JvdW5kJywgJ21hdGhjb2xvcicsICdtYXRoc2l6ZScsICdtYXRodmFyaWFudCcsICdtYXhzaXplJywgJ21pbnNpemUnLCAnbW92YWJsZWxpbWl0cycsICdub3RhdGlvbicsICdudW1hbGlnbicsICdvcGVuJywgJ3Jvd2FsaWduJywgJ3Jvd2xpbmVzJywgJ3Jvd3NwYWNpbmcnLCAncm93c3BhbicsICdyc3BhY2UnLCAncnF1b3RlJywgJ3NjcmlwdGxldmVsJywgJ3NjcmlwdG1pbnNpemUnLCAnc2NyaXB0c2l6ZW11bHRpcGxpZXInLCAnc2VsZWN0aW9uJywgJ3NlcGFyYXRvcicsICdzZXBhcmF0b3JzJywgJ3N0cmV0Y2h5JywgJ3N1YnNjcmlwdHNoaWZ0JywgJ3N1cHNjcmlwdHNoaWZ0JywgJ3N5bW1ldHJpYycsICd2b2Zmc2V0JywgJ3dpZHRoJywgJ3htbG5zJ10pO1xuY29uc3QgeG1sID0gZnJlZXplKFsneGxpbms6aHJlZicsICd4bWw6aWQnLCAneGxpbms6dGl0bGUnLCAneG1sOnNwYWNlJywgJ3htbG5zOnhsaW5rJ10pO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9iZXR0ZXItcmVnZXhcbmNvbnN0IE1VU1RBQ0hFX0VYUFIgPSBzZWFsKC9cXHtcXHtbXFx3XFxXXSp8W1xcd1xcV10qXFx9XFx9L2dtKTsgLy8gU3BlY2lmeSB0ZW1wbGF0ZSBkZXRlY3Rpb24gcmVnZXggZm9yIFNBRkVfRk9SX1RFTVBMQVRFUyBtb2RlXG5jb25zdCBFUkJfRVhQUiA9IHNlYWwoLzwlW1xcd1xcV10qfFtcXHdcXFddKiU+L2dtKTtcbmNvbnN0IFRNUExJVF9FWFBSID0gc2VhbCgvXFwkXFx7W1xcd1xcV10qL2dtKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1bmljb3JuL2JldHRlci1yZWdleFxuY29uc3QgREFUQV9BVFRSID0gc2VhbCgvXmRhdGEtW1xcLVxcdy5cXHUwMEI3LVxcdUZGRkZdKyQvKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuY29uc3QgQVJJQV9BVFRSID0gc2VhbCgvXmFyaWEtW1xcLVxcd10rJC8pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG5jb25zdCBJU19BTExPV0VEX1VSSSA9IHNlYWwoL14oPzooPzooPzpmfGh0KXRwcz98bWFpbHRvfHRlbHxjYWxsdG98c21zfGNpZHx4bXBwfG1hdHJpeCk6fFteYS16XXxbYS16Ky5cXC1dKyg/OlteYS16Ky5cXC06XXwkKSkvaSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4pO1xuY29uc3QgSVNfU0NSSVBUX09SX0RBVEEgPSBzZWFsKC9eKD86XFx3K3NjcmlwdHxkYXRhKTovaSk7XG5jb25zdCBBVFRSX1dISVRFU1BBQ0UgPSBzZWFsKC9bXFx1MDAwMC1cXHUwMDIwXFx1MDBBMFxcdTE2ODBcXHUxODBFXFx1MjAwMC1cXHUyMDI5XFx1MjA1RlxcdTMwMDBdL2cgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb250cm9sLXJlZ2V4XG4pO1xuY29uc3QgRE9DVFlQRV9OQU1FID0gc2VhbCgvXmh0bWwkL2kpO1xuY29uc3QgQ1VTVE9NX0VMRU1FTlQgPSBzZWFsKC9eW2Etel1bLlxcd10qKC1bLlxcd10rKSskL2kpO1xuXG52YXIgRVhQUkVTU0lPTlMgPSAvKiNfX1BVUkVfXyovT2JqZWN0LmZyZWV6ZSh7XG4gIF9fcHJvdG9fXzogbnVsbCxcbiAgQVJJQV9BVFRSOiBBUklBX0FUVFIsXG4gIEFUVFJfV0hJVEVTUEFDRTogQVRUUl9XSElURVNQQUNFLFxuICBDVVNUT01fRUxFTUVOVDogQ1VTVE9NX0VMRU1FTlQsXG4gIERBVEFfQVRUUjogREFUQV9BVFRSLFxuICBET0NUWVBFX05BTUU6IERPQ1RZUEVfTkFNRSxcbiAgRVJCX0VYUFI6IEVSQl9FWFBSLFxuICBJU19BTExPV0VEX1VSSTogSVNfQUxMT1dFRF9VUkksXG4gIElTX1NDUklQVF9PUl9EQVRBOiBJU19TQ1JJUFRfT1JfREFUQSxcbiAgTVVTVEFDSEVfRVhQUjogTVVTVEFDSEVfRVhQUixcbiAgVE1QTElUX0VYUFI6IFRNUExJVF9FWFBSXG59KTtcblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2luZGVudCAqL1xuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGVcbmNvbnN0IE5PREVfVFlQRSA9IHtcbiAgZWxlbWVudDogMSxcbiAgYXR0cmlidXRlOiAyLFxuICB0ZXh0OiAzLFxuICBjZGF0YVNlY3Rpb246IDQsXG4gIGVudGl0eVJlZmVyZW5jZTogNSxcbiAgLy8gRGVwcmVjYXRlZFxuICBlbnRpdHlOb2RlOiA2LFxuICAvLyBEZXByZWNhdGVkXG4gIHByb2dyZXNzaW5nSW5zdHJ1Y3Rpb246IDcsXG4gIGNvbW1lbnQ6IDgsXG4gIGRvY3VtZW50OiA5LFxuICBkb2N1bWVudFR5cGU6IDEwLFxuICBkb2N1bWVudEZyYWdtZW50OiAxMSxcbiAgbm90YXRpb246IDEyIC8vIERlcHJlY2F0ZWRcbn07XG5jb25zdCBnZXRHbG9iYWwgPSBmdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiB3aW5kb3c7XG59O1xuLyoqXG4gKiBDcmVhdGVzIGEgbm8tb3AgcG9saWN5IGZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAqIERvbid0IGV4cG9ydCB0aGlzIGZ1bmN0aW9uIG91dHNpZGUgdGhpcyBtb2R1bGUhXG4gKiBAcGFyYW0gdHJ1c3RlZFR5cGVzIFRoZSBwb2xpY3kgZmFjdG9yeS5cbiAqIEBwYXJhbSBwdXJpZnlIb3N0RWxlbWVudCBUaGUgU2NyaXB0IGVsZW1lbnQgdXNlZCB0byBsb2FkIERPTVB1cmlmeSAodG8gZGV0ZXJtaW5lIHBvbGljeSBuYW1lIHN1ZmZpeCkuXG4gKiBAcmV0dXJuIFRoZSBwb2xpY3kgY3JlYXRlZCAob3IgbnVsbCwgaWYgVHJ1c3RlZCBUeXBlc1xuICogYXJlIG5vdCBzdXBwb3J0ZWQgb3IgY3JlYXRpbmcgdGhlIHBvbGljeSBmYWlsZWQpLlxuICovXG5jb25zdCBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5ID0gZnVuY3Rpb24gX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSh0cnVzdGVkVHlwZXMsIHB1cmlmeUhvc3RFbGVtZW50KSB7XG4gIGlmICh0eXBlb2YgdHJ1c3RlZFR5cGVzICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgdHJ1c3RlZFR5cGVzLmNyZWF0ZVBvbGljeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8vIEFsbG93IHRoZSBjYWxsZXJzIHRvIGNvbnRyb2wgdGhlIHVuaXF1ZSBwb2xpY3kgbmFtZVxuICAvLyBieSBhZGRpbmcgYSBkYXRhLXR0LXBvbGljeS1zdWZmaXggdG8gdGhlIHNjcmlwdCBlbGVtZW50IHdpdGggdGhlIERPTVB1cmlmeS5cbiAgLy8gUG9saWN5IGNyZWF0aW9uIHdpdGggZHVwbGljYXRlIG5hbWVzIHRocm93cyBpbiBUcnVzdGVkIFR5cGVzLlxuICBsZXQgc3VmZml4ID0gbnVsbDtcbiAgY29uc3QgQVRUUl9OQU1FID0gJ2RhdGEtdHQtcG9saWN5LXN1ZmZpeCc7XG4gIGlmIChwdXJpZnlIb3N0RWxlbWVudCAmJiBwdXJpZnlIb3N0RWxlbWVudC5oYXNBdHRyaWJ1dGUoQVRUUl9OQU1FKSkge1xuICAgIHN1ZmZpeCA9IHB1cmlmeUhvc3RFbGVtZW50LmdldEF0dHJpYnV0ZShBVFRSX05BTUUpO1xuICB9XG4gIGNvbnN0IHBvbGljeU5hbWUgPSAnZG9tcHVyaWZ5JyArIChzdWZmaXggPyAnIycgKyBzdWZmaXggOiAnJyk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kocG9saWN5TmFtZSwge1xuICAgICAgY3JlYXRlSFRNTChodG1sKSB7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVNjcmlwdFVSTChzY3JpcHRVcmwpIHtcbiAgICAgICAgcmV0dXJuIHNjcmlwdFVybDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoXykge1xuICAgIC8vIFBvbGljeSBjcmVhdGlvbiBmYWlsZWQgKG1vc3QgbGlrZWx5IGFub3RoZXIgRE9NUHVyaWZ5IHNjcmlwdCBoYXNcbiAgICAvLyBhbHJlYWR5IHJ1bikuIFNraXAgY3JlYXRpbmcgdGhlIHBvbGljeSwgYXMgdGhpcyB3aWxsIG9ubHkgY2F1c2UgZXJyb3JzXG4gICAgLy8gaWYgVFQgYXJlIGVuZm9yY2VkLlxuICAgIGNvbnNvbGUud2FybignVHJ1c3RlZFR5cGVzIHBvbGljeSAnICsgcG9saWN5TmFtZSArICcgY291bGQgbm90IGJlIGNyZWF0ZWQuJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5jb25zdCBfY3JlYXRlSG9va3NNYXAgPSBmdW5jdGlvbiBfY3JlYXRlSG9va3NNYXAoKSB7XG4gIHJldHVybiB7XG4gICAgYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXM6IFtdLFxuICAgIGFmdGVyU2FuaXRpemVFbGVtZW50czogW10sXG4gICAgYWZ0ZXJTYW5pdGl6ZVNoYWRvd0RPTTogW10sXG4gICAgYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzOiBbXSxcbiAgICBiZWZvcmVTYW5pdGl6ZUVsZW1lbnRzOiBbXSxcbiAgICBiZWZvcmVTYW5pdGl6ZVNoYWRvd0RPTTogW10sXG4gICAgdXBvblNhbml0aXplQXR0cmlidXRlOiBbXSxcbiAgICB1cG9uU2FuaXRpemVFbGVtZW50OiBbXSxcbiAgICB1cG9uU2FuaXRpemVTaGFkb3dOb2RlOiBbXVxuICB9O1xufTtcbmZ1bmN0aW9uIGNyZWF0ZURPTVB1cmlmeSgpIHtcbiAgbGV0IHdpbmRvdyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZ2V0R2xvYmFsKCk7XG4gIGNvbnN0IERPTVB1cmlmeSA9IHJvb3QgPT4gY3JlYXRlRE9NUHVyaWZ5KHJvb3QpO1xuICBET01QdXJpZnkudmVyc2lvbiA9ICczLjMuMSc7XG4gIERPTVB1cmlmeS5yZW1vdmVkID0gW107XG4gIGlmICghd2luZG93IHx8ICF3aW5kb3cuZG9jdW1lbnQgfHwgd2luZG93LmRvY3VtZW50Lm5vZGVUeXBlICE9PSBOT0RFX1RZUEUuZG9jdW1lbnQgfHwgIXdpbmRvdy5FbGVtZW50KSB7XG4gICAgLy8gTm90IHJ1bm5pbmcgaW4gYSBicm93c2VyLCBwcm92aWRlIGEgZmFjdG9yeSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgeW91IGNhbiBwYXNzIHlvdXIgb3duIFdpbmRvd1xuICAgIERPTVB1cmlmeS5pc1N1cHBvcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiBET01QdXJpZnk7XG4gIH1cbiAgbGV0IHtcbiAgICBkb2N1bWVudFxuICB9ID0gd2luZG93O1xuICBjb25zdCBvcmlnaW5hbERvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IGN1cnJlbnRTY3JpcHQgPSBvcmlnaW5hbERvY3VtZW50LmN1cnJlbnRTY3JpcHQ7XG4gIGNvbnN0IHtcbiAgICBEb2N1bWVudEZyYWdtZW50LFxuICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQsXG4gICAgTm9kZSxcbiAgICBFbGVtZW50LFxuICAgIE5vZGVGaWx0ZXIsXG4gICAgTmFtZWROb2RlTWFwID0gd2luZG93Lk5hbWVkTm9kZU1hcCB8fCB3aW5kb3cuTW96TmFtZWRBdHRyTWFwLFxuICAgIEhUTUxGb3JtRWxlbWVudCxcbiAgICBET01QYXJzZXIsXG4gICAgdHJ1c3RlZFR5cGVzXG4gIH0gPSB3aW5kb3c7XG4gIGNvbnN0IEVsZW1lbnRQcm90b3R5cGUgPSBFbGVtZW50LnByb3RvdHlwZTtcbiAgY29uc3QgY2xvbmVOb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjbG9uZU5vZGUnKTtcbiAgY29uc3QgcmVtb3ZlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdyZW1vdmUnKTtcbiAgY29uc3QgZ2V0TmV4dFNpYmxpbmcgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ25leHRTaWJsaW5nJyk7XG4gIGNvbnN0IGdldENoaWxkTm9kZXMgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ2NoaWxkTm9kZXMnKTtcbiAgY29uc3QgZ2V0UGFyZW50Tm9kZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAncGFyZW50Tm9kZScpO1xuICAvLyBBcyBwZXIgaXNzdWUgIzQ3LCB0aGUgd2ViLWNvbXBvbmVudHMgcmVnaXN0cnkgaXMgaW5oZXJpdGVkIGJ5IGFcbiAgLy8gbmV3IGRvY3VtZW50IGNyZWF0ZWQgdmlhIGNyZWF0ZUhUTUxEb2N1bWVudC4gQXMgcGVyIHRoZSBzcGVjXG4gIC8vIChodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvY3VzdG9tLyNjcmVhdGluZy1hbmQtcGFzc2luZy1yZWdpc3RyaWVzKVxuICAvLyBhIG5ldyBlbXB0eSByZWdpc3RyeSBpcyB1c2VkIHdoZW4gY3JlYXRpbmcgYSB0ZW1wbGF0ZSBjb250ZW50cyBvd25lclxuICAvLyBkb2N1bWVudCwgc28gd2UgdXNlIHRoYXQgYXMgb3VyIHBhcmVudCBkb2N1bWVudCB0byBlbnN1cmUgbm90aGluZ1xuICAvLyBpcyBpbmhlcml0ZWQuXG4gIGlmICh0eXBlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICBpZiAodGVtcGxhdGUuY29udGVudCAmJiB0ZW1wbGF0ZS5jb250ZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgIGRvY3VtZW50ID0gdGVtcGxhdGUuY29udGVudC5vd25lckRvY3VtZW50O1xuICAgIH1cbiAgfVxuICBsZXQgdHJ1c3RlZFR5cGVzUG9saWN5O1xuICBsZXQgZW1wdHlIVE1MID0gJyc7XG4gIGNvbnN0IHtcbiAgICBpbXBsZW1lbnRhdGlvbixcbiAgICBjcmVhdGVOb2RlSXRlcmF0b3IsXG4gICAgY3JlYXRlRG9jdW1lbnRGcmFnbWVudCxcbiAgICBnZXRFbGVtZW50c0J5VGFnTmFtZVxuICB9ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IHtcbiAgICBpbXBvcnROb2RlXG4gIH0gPSBvcmlnaW5hbERvY3VtZW50O1xuICBsZXQgaG9va3MgPSBfY3JlYXRlSG9va3NNYXAoKTtcbiAgLyoqXG4gICAqIEV4cG9zZSB3aGV0aGVyIHRoaXMgYnJvd3NlciBzdXBwb3J0cyBydW5uaW5nIHRoZSBmdWxsIERPTVB1cmlmeS5cbiAgICovXG4gIERPTVB1cmlmeS5pc1N1cHBvcnRlZCA9IHR5cGVvZiBlbnRyaWVzID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBnZXRQYXJlbnROb2RlID09PSAnZnVuY3Rpb24nICYmIGltcGxlbWVudGF0aW9uICYmIGltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCAhPT0gdW5kZWZpbmVkO1xuICBjb25zdCB7XG4gICAgTVVTVEFDSEVfRVhQUixcbiAgICBFUkJfRVhQUixcbiAgICBUTVBMSVRfRVhQUixcbiAgICBEQVRBX0FUVFIsXG4gICAgQVJJQV9BVFRSLFxuICAgIElTX1NDUklQVF9PUl9EQVRBLFxuICAgIEFUVFJfV0hJVEVTUEFDRSxcbiAgICBDVVNUT01fRUxFTUVOVFxuICB9ID0gRVhQUkVTU0lPTlM7XG4gIGxldCB7XG4gICAgSVNfQUxMT1dFRF9VUkk6IElTX0FMTE9XRURfVVJJJDFcbiAgfSA9IEVYUFJFU1NJT05TO1xuICAvKipcbiAgICogV2UgY29uc2lkZXIgdGhlIGVsZW1lbnRzIGFuZCBhdHRyaWJ1dGVzIGJlbG93IHRvIGJlIHNhZmUuIElkZWFsbHlcbiAgICogZG9uJ3QgYWRkIGFueSBuZXcgb25lcyBidXQgZmVlbCBmcmVlIHRvIHJlbW92ZSB1bndhbnRlZCBvbmVzLlxuICAgKi9cbiAgLyogYWxsb3dlZCBlbGVtZW50IG5hbWVzICovXG4gIGxldCBBTExPV0VEX1RBR1MgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0FMTE9XRURfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4uaHRtbCQxLCAuLi5zdmckMSwgLi4uc3ZnRmlsdGVycywgLi4ubWF0aE1sJDEsIC4uLnRleHRdKTtcbiAgLyogQWxsb3dlZCBhdHRyaWJ1dGUgbmFtZXMgKi9cbiAgbGV0IEFMTE9XRURfQVRUUiA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9BVFRSID0gYWRkVG9TZXQoe30sIFsuLi5odG1sLCAuLi5zdmcsIC4uLm1hdGhNbCwgLi4ueG1sXSk7XG4gIC8qXG4gICAqIENvbmZpZ3VyZSBob3cgRE9NUHVyaWZ5IHNob3VsZCBoYW5kbGUgY3VzdG9tIGVsZW1lbnRzIGFuZCB0aGVpciBhdHRyaWJ1dGVzIGFzIHdlbGwgYXMgY3VzdG9taXplZCBidWlsdC1pbiBlbGVtZW50cy5cbiAgICogQHByb3BlcnR5IHtSZWdFeHB8RnVuY3Rpb258bnVsbH0gdGFnTmFtZUNoZWNrIG9uZSBvZiBbbnVsbCwgcmVnZXhQYXR0ZXJuLCBwcmVkaWNhdGVdLiBEZWZhdWx0OiBgbnVsbGAgKGRpc2FsbG93IGFueSBjdXN0b20gZWxlbWVudHMpXG4gICAqIEBwcm9wZXJ0eSB7UmVnRXhwfEZ1bmN0aW9ufG51bGx9IGF0dHJpYnV0ZU5hbWVDaGVjayBvbmUgb2YgW251bGwsIHJlZ2V4UGF0dGVybiwgcHJlZGljYXRlXS4gRGVmYXVsdDogYG51bGxgIChkaXNhbGxvdyBhbnkgYXR0cmlidXRlcyBub3Qgb24gdGhlIGFsbG93IGxpc3QpXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzIGFsbG93IGN1c3RvbSBlbGVtZW50cyBkZXJpdmVkIGZyb20gYnVpbHQtaW5zIGlmIHRoZXkgcGFzcyBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2suIERlZmF1bHQ6IGBmYWxzZWAuXG4gICAqL1xuICBsZXQgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgPSBPYmplY3Quc2VhbChjcmVhdGUobnVsbCwge1xuICAgIHRhZ05hbWVDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfSxcbiAgICBhdHRyaWJ1dGVOYW1lQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sXG4gICAgYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGZhbHNlXG4gICAgfVxuICB9KSk7XG4gIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIHRhZ3MgKG92ZXJyaWRlcyBBTExPV0VEX1RBR1MvQUREX1RBR1MpICovXG4gIGxldCBGT1JCSURfVEFHUyA9IG51bGw7XG4gIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIGF0dHJpYnV0ZXMgKG92ZXJyaWRlcyBBTExPV0VEX0FUVFIvQUREX0FUVFIpICovXG4gIGxldCBGT1JCSURfQVRUUiA9IG51bGw7XG4gIC8qIENvbmZpZyBvYmplY3QgdG8gc3RvcmUgQUREX1RBR1MvQUREX0FUVFIgZnVuY3Rpb25zICh3aGVuIHVzZWQgYXMgZnVuY3Rpb25zKSAqL1xuICBjb25zdCBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HID0gT2JqZWN0LnNlYWwoY3JlYXRlKG51bGwsIHtcbiAgICB0YWdDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfSxcbiAgICBhdHRyaWJ1dGVDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfVxuICB9KSk7XG4gIC8qIERlY2lkZSBpZiBBUklBIGF0dHJpYnV0ZXMgYXJlIG9rYXkgKi9cbiAgbGV0IEFMTE9XX0FSSUFfQVRUUiA9IHRydWU7XG4gIC8qIERlY2lkZSBpZiBjdXN0b20gZGF0YSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gIGxldCBBTExPV19EQVRBX0FUVFIgPSB0cnVlO1xuICAvKiBEZWNpZGUgaWYgdW5rbm93biBwcm90b2NvbHMgYXJlIG9rYXkgKi9cbiAgbGV0IEFMTE9XX1VOS05PV05fUFJPVE9DT0xTID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBzZWxmLWNsb3NpbmcgdGFncyBpbiBhdHRyaWJ1dGVzIGFyZSBhbGxvd2VkLlxuICAgKiBVc3VhbGx5IHJlbW92ZWQgZHVlIHRvIGEgbVhTUyBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gIGxldCBBTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgPSB0cnVlO1xuICAvKiBPdXRwdXQgc2hvdWxkIGJlIHNhZmUgZm9yIGNvbW1vbiB0ZW1wbGF0ZSBlbmdpbmVzLlxuICAgKiBUaGlzIG1lYW5zLCBET01QdXJpZnkgcmVtb3ZlcyBkYXRhIGF0dHJpYnV0ZXMsIG11c3RhY2hlcyBhbmQgRVJCXG4gICAqL1xuICBsZXQgU0FGRV9GT1JfVEVNUExBVEVTID0gZmFsc2U7XG4gIC8qIE91dHB1dCBzaG91bGQgYmUgc2FmZSBldmVuIGZvciBYTUwgdXNlZCB3aXRoaW4gSFRNTCBhbmQgYWxpa2UuXG4gICAqIFRoaXMgbWVhbnMsIERPTVB1cmlmeSByZW1vdmVzIGNvbW1lbnRzIHdoZW4gY29udGFpbmluZyByaXNreSBjb250ZW50LlxuICAgKi9cbiAgbGV0IFNBRkVfRk9SX1hNTCA9IHRydWU7XG4gIC8qIERlY2lkZSBpZiBkb2N1bWVudCB3aXRoIDxodG1sPi4uLiBzaG91bGQgYmUgcmV0dXJuZWQgKi9cbiAgbGV0IFdIT0xFX0RPQ1VNRU5UID0gZmFsc2U7XG4gIC8qIFRyYWNrIHdoZXRoZXIgY29uZmlnIGlzIGFscmVhZHkgc2V0IG9uIHRoaXMgaW5zdGFuY2Ugb2YgRE9NUHVyaWZ5LiAqL1xuICBsZXQgU0VUX0NPTkZJRyA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgYWxsIGVsZW1lbnRzIChlLmcuIHN0eWxlLCBzY3JpcHQpIG11c3QgYmUgY2hpbGRyZW4gb2ZcbiAgICogZG9jdW1lbnQuYm9keS4gQnkgZGVmYXVsdCwgYnJvd3NlcnMgbWlnaHQgbW92ZSB0aGVtIHRvIGRvY3VtZW50LmhlYWQgKi9cbiAgbGV0IEZPUkNFX0JPRFkgPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIGEgRE9NIGBIVE1MQm9keUVsZW1lbnRgIHNob3VsZCBiZSByZXR1cm5lZCwgaW5zdGVhZCBvZiBhIGh0bWxcbiAgICogc3RyaW5nIChvciBhIFRydXN0ZWRIVE1MIG9iamVjdCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBzdXBwb3J0ZWQpLlxuICAgKiBJZiBgV0hPTEVfRE9DVU1FTlRgIGlzIGVuYWJsZWQgYSBgSFRNTEh0bWxFbGVtZW50YCB3aWxsIGJlIHJldHVybmVkIGluc3RlYWRcbiAgICovXG4gIGxldCBSRVRVUk5fRE9NID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBhIERPTSBgRG9jdW1lbnRGcmFnbWVudGAgc2hvdWxkIGJlIHJldHVybmVkLCBpbnN0ZWFkIG9mIGEgaHRtbFxuICAgKiBzdHJpbmcgIChvciBhIFRydXN0ZWRIVE1MIG9iamVjdCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBzdXBwb3J0ZWQpICovXG4gIGxldCBSRVRVUk5fRE9NX0ZSQUdNRU5UID0gZmFsc2U7XG4gIC8qIFRyeSB0byByZXR1cm4gYSBUcnVzdGVkIFR5cGUgb2JqZWN0IGluc3RlYWQgb2YgYSBzdHJpbmcsIHJldHVybiBhIHN0cmluZyBpblxuICAgKiBjYXNlIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBzdXBwb3J0ZWQgICovXG4gIGxldCBSRVRVUk5fVFJVU1RFRF9UWVBFID0gZmFsc2U7XG4gIC8qIE91dHB1dCBzaG91bGQgYmUgZnJlZSBmcm9tIERPTSBjbG9iYmVyaW5nIGF0dGFja3M/XG4gICAqIFRoaXMgc2FuaXRpemVzIG1hcmt1cHMgbmFtZWQgd2l0aCBjb2xsaWRpbmcsIGNsb2JiZXJhYmxlIGJ1aWx0LWluIERPTSBBUElzLlxuICAgKi9cbiAgbGV0IFNBTklUSVpFX0RPTSA9IHRydWU7XG4gIC8qIEFjaGlldmUgZnVsbCBET00gQ2xvYmJlcmluZyBwcm90ZWN0aW9uIGJ5IGlzb2xhdGluZyB0aGUgbmFtZXNwYWNlIG9mIG5hbWVkXG4gICAqIHByb3BlcnRpZXMgYW5kIEpTIHZhcmlhYmxlcywgbWl0aWdhdGluZyBhdHRhY2tzIHRoYXQgYWJ1c2UgdGhlIEhUTUwvRE9NIHNwZWMgcnVsZXMuXG4gICAqXG4gICAqIEhUTUwvRE9NIHNwZWMgcnVsZXMgdGhhdCBlbmFibGUgRE9NIENsb2JiZXJpbmc6XG4gICAqICAgLSBOYW1lZCBBY2Nlc3Mgb24gV2luZG93ICjCpzcuMy4zKVxuICAgKiAgIC0gRE9NIFRyZWUgQWNjZXNzb3JzICjCpzMuMS41KVxuICAgKiAgIC0gRm9ybSBFbGVtZW50IFBhcmVudC1DaGlsZCBSZWxhdGlvbnMgKMKnNC4xMC4zKVxuICAgKiAgIC0gSWZyYW1lIHNyY2RvYyAvIE5lc3RlZCBXaW5kb3dQcm94aWVzICjCpzQuOC41KVxuICAgKiAgIC0gSFRNTENvbGxlY3Rpb24gKMKnNC4yLjEwLjIpXG4gICAqXG4gICAqIE5hbWVzcGFjZSBpc29sYXRpb24gaXMgaW1wbGVtZW50ZWQgYnkgcHJlZml4aW5nIGBpZGAgYW5kIGBuYW1lYCBhdHRyaWJ1dGVzXG4gICAqIHdpdGggYSBjb25zdGFudCBzdHJpbmcsIGkuZS4sIGB1c2VyLWNvbnRlbnQtYFxuICAgKi9cbiAgbGV0IFNBTklUSVpFX05BTUVEX1BST1BTID0gZmFsc2U7XG4gIGNvbnN0IFNBTklUSVpFX05BTUVEX1BST1BTX1BSRUZJWCA9ICd1c2VyLWNvbnRlbnQtJztcbiAgLyogS2VlcCBlbGVtZW50IGNvbnRlbnQgd2hlbiByZW1vdmluZyBlbGVtZW50PyAqL1xuICBsZXQgS0VFUF9DT05URU5UID0gdHJ1ZTtcbiAgLyogSWYgYSBgTm9kZWAgaXMgcGFzc2VkIHRvIHNhbml0aXplKCksIHRoZW4gcGVyZm9ybXMgc2FuaXRpemF0aW9uIGluLXBsYWNlIGluc3RlYWRcbiAgICogb2YgaW1wb3J0aW5nIGl0IGludG8gYSBuZXcgRG9jdW1lbnQgYW5kIHJldHVybmluZyBhIHNhbml0aXplZCBjb3B5ICovXG4gIGxldCBJTl9QTEFDRSA9IGZhbHNlO1xuICAvKiBBbGxvdyB1c2FnZSBvZiBwcm9maWxlcyBsaWtlIGh0bWwsIHN2ZyBhbmQgbWF0aE1sICovXG4gIGxldCBVU0VfUFJPRklMRVMgPSB7fTtcbiAgLyogVGFncyB0byBpZ25vcmUgY29udGVudCBvZiB3aGVuIEtFRVBfQ09OVEVOVCBpcyB0cnVlICovXG4gIGxldCBGT1JCSURfQ09OVEVOVFMgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0ZPUkJJRF9DT05URU5UUyA9IGFkZFRvU2V0KHt9LCBbJ2Fubm90YXRpb24teG1sJywgJ2F1ZGlvJywgJ2NvbGdyb3VwJywgJ2Rlc2MnLCAnZm9yZWlnbm9iamVjdCcsICdoZWFkJywgJ2lmcmFtZScsICdtYXRoJywgJ21pJywgJ21uJywgJ21vJywgJ21zJywgJ210ZXh0JywgJ25vZW1iZWQnLCAnbm9mcmFtZXMnLCAnbm9zY3JpcHQnLCAncGxhaW50ZXh0JywgJ3NjcmlwdCcsICdzdHlsZScsICdzdmcnLCAndGVtcGxhdGUnLCAndGhlYWQnLCAndGl0bGUnLCAndmlkZW8nLCAneG1wJ10pO1xuICAvKiBUYWdzIHRoYXQgYXJlIHNhZmUgZm9yIGRhdGE6IFVSSXMgKi9cbiAgbGV0IERBVEFfVVJJX1RBR1MgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0RBVEFfVVJJX1RBR1MgPSBhZGRUb1NldCh7fSwgWydhdWRpbycsICd2aWRlbycsICdpbWcnLCAnc291cmNlJywgJ2ltYWdlJywgJ3RyYWNrJ10pO1xuICAvKiBBdHRyaWJ1dGVzIHNhZmUgZm9yIHZhbHVlcyBsaWtlIFwiamF2YXNjcmlwdDpcIiAqL1xuICBsZXQgVVJJX1NBRkVfQVRUUklCVVRFUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUyA9IGFkZFRvU2V0KHt9LCBbJ2FsdCcsICdjbGFzcycsICdmb3InLCAnaWQnLCAnbGFiZWwnLCAnbmFtZScsICdwYXR0ZXJuJywgJ3BsYWNlaG9sZGVyJywgJ3JvbGUnLCAnc3VtbWFyeScsICd0aXRsZScsICd2YWx1ZScsICdzdHlsZScsICd4bWxucyddKTtcbiAgY29uc3QgTUFUSE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MJztcbiAgY29uc3QgU1ZHX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gIGNvbnN0IEhUTUxfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnO1xuICAvKiBEb2N1bWVudCBuYW1lc3BhY2UgKi9cbiAgbGV0IE5BTUVTUEFDRSA9IEhUTUxfTkFNRVNQQUNFO1xuICBsZXQgSVNfRU1QVFlfSU5QVVQgPSBmYWxzZTtcbiAgLyogQWxsb3dlZCBYSFRNTCtYTUwgbmFtZXNwYWNlcyAqL1xuICBsZXQgQUxMT1dFRF9OQU1FU1BBQ0VTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9BTExPV0VEX05BTUVTUEFDRVMgPSBhZGRUb1NldCh7fSwgW01BVEhNTF9OQU1FU1BBQ0UsIFNWR19OQU1FU1BBQ0UsIEhUTUxfTkFNRVNQQUNFXSwgc3RyaW5nVG9TdHJpbmcpO1xuICBsZXQgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnbWknLCAnbW8nLCAnbW4nLCAnbXMnLCAnbXRleHQnXSk7XG4gIGxldCBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGFkZFRvU2V0KHt9LCBbJ2Fubm90YXRpb24teG1sJ10pO1xuICAvLyBDZXJ0YWluIGVsZW1lbnRzIGFyZSBhbGxvd2VkIGluIGJvdGggU1ZHIGFuZCBIVE1MXG4gIC8vIG5hbWVzcGFjZS4gV2UgbmVlZCB0byBzcGVjaWZ5IHRoZW0gZXhwbGljaXRseVxuICAvLyBzbyB0aGF0IHRoZXkgZG9uJ3QgZ2V0IGVycm9uZW91c2x5IGRlbGV0ZWQgZnJvbVxuICAvLyBIVE1MIG5hbWVzcGFjZS5cbiAgY29uc3QgQ09NTU9OX1NWR19BTkRfSFRNTF9FTEVNRU5UUyA9IGFkZFRvU2V0KHt9LCBbJ3RpdGxlJywgJ3N0eWxlJywgJ2ZvbnQnLCAnYScsICdzY3JpcHQnXSk7XG4gIC8qIFBhcnNpbmcgb2Ygc3RyaWN0IFhIVE1MIGRvY3VtZW50cyAqL1xuICBsZXQgUEFSU0VSX01FRElBX1RZUEUgPSBudWxsO1xuICBjb25zdCBTVVBQT1JURURfUEFSU0VSX01FRElBX1RZUEVTID0gWydhcHBsaWNhdGlvbi94aHRtbCt4bWwnLCAndGV4dC9odG1sJ107XG4gIGNvbnN0IERFRkFVTFRfUEFSU0VSX01FRElBX1RZUEUgPSAndGV4dC9odG1sJztcbiAgbGV0IHRyYW5zZm9ybUNhc2VGdW5jID0gbnVsbDtcbiAgLyogS2VlcCBhIHJlZmVyZW5jZSB0byBjb25maWcgdG8gcGFzcyB0byBob29rcyAqL1xuICBsZXQgQ09ORklHID0gbnVsbDtcbiAgLyogSWRlYWxseSwgZG8gbm90IHRvdWNoIGFueXRoaW5nIGJlbG93IHRoaXMgbGluZSAqL1xuICAvKiBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fICovXG4gIGNvbnN0IGZvcm1FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICBjb25zdCBpc1JlZ2V4T3JGdW5jdGlvbiA9IGZ1bmN0aW9uIGlzUmVnZXhPckZ1bmN0aW9uKHRlc3RWYWx1ZSkge1xuICAgIHJldHVybiB0ZXN0VmFsdWUgaW5zdGFuY2VvZiBSZWdFeHAgfHwgdGVzdFZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb247XG4gIH07XG4gIC8qKlxuICAgKiBfcGFyc2VDb25maWdcbiAgICpcbiAgICogQHBhcmFtIGNmZyBvcHRpb25hbCBjb25maWcgbGl0ZXJhbFxuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgY29uc3QgX3BhcnNlQ29uZmlnID0gZnVuY3Rpb24gX3BhcnNlQ29uZmlnKCkge1xuICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGlmIChDT05GSUcgJiYgQ09ORklHID09PSBjZmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gdGFtcGVyaW5nICovXG4gICAgaWYgKCFjZmcgfHwgdHlwZW9mIGNmZyAhPT0gJ29iamVjdCcpIHtcbiAgICAgIGNmZyA9IHt9O1xuICAgIH1cbiAgICAvKiBTaGllbGQgY29uZmlndXJhdGlvbiBvYmplY3QgZnJvbSBwcm90b3R5cGUgcG9sbHV0aW9uICovXG4gICAgY2ZnID0gY2xvbmUoY2ZnKTtcbiAgICBQQVJTRVJfTUVESUFfVFlQRSA9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWluY2x1ZGVzXG4gICAgU1VQUE9SVEVEX1BBUlNFUl9NRURJQV9UWVBFUy5pbmRleE9mKGNmZy5QQVJTRVJfTUVESUFfVFlQRSkgPT09IC0xID8gREVGQVVMVF9QQVJTRVJfTUVESUFfVFlQRSA6IGNmZy5QQVJTRVJfTUVESUFfVFlQRTtcbiAgICAvLyBIVE1MIHRhZ3MgYW5kIGF0dHJpYnV0ZXMgYXJlIG5vdCBjYXNlLXNlbnNpdGl2ZSwgY29udmVydGluZyB0byBsb3dlcmNhc2UuIEtlZXBpbmcgWEhUTUwgYXMgaXMuXG4gICAgdHJhbnNmb3JtQ2FzZUZ1bmMgPSBQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgPyBzdHJpbmdUb1N0cmluZyA6IHN0cmluZ1RvTG93ZXJDYXNlO1xuICAgIC8qIFNldCBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKi9cbiAgICBBTExPV0VEX1RBR1MgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX1RBR1MnKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0FMTE9XRURfVEFHUztcbiAgICBBTExPV0VEX0FUVFIgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX0FUVFInKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0FMTE9XRURfQVRUUjtcbiAgICBBTExPV0VEX05BTUVTUEFDRVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX05BTUVTUEFDRVMnKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9OQU1FU1BBQ0VTLCBzdHJpbmdUb1N0cmluZykgOiBERUZBVUxUX0FMTE9XRURfTkFNRVNQQUNFUztcbiAgICBVUklfU0FGRV9BVFRSSUJVVEVTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUREX1VSSV9TQUZFX0FUVFInKSA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUyksIGNmZy5BRERfVVJJX1NBRkVfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTO1xuICAgIERBVEFfVVJJX1RBR1MgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBRERfREFUQV9VUklfVEFHUycpID8gYWRkVG9TZXQoY2xvbmUoREVGQVVMVF9EQVRBX1VSSV9UQUdTKSwgY2ZnLkFERF9EQVRBX1VSSV9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0RBVEFfVVJJX1RBR1M7XG4gICAgRk9SQklEX0NPTlRFTlRTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX0NPTlRFTlRTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9GT1JCSURfQ09OVEVOVFM7XG4gICAgRk9SQklEX1RBR1MgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdGT1JCSURfVEFHUycpID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogY2xvbmUoe30pO1xuICAgIEZPUkJJRF9BVFRSID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX0FUVFInKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IGNsb25lKHt9KTtcbiAgICBVU0VfUFJPRklMRVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdVU0VfUFJPRklMRVMnKSA/IGNmZy5VU0VfUFJPRklMRVMgOiBmYWxzZTtcbiAgICBBTExPV19BUklBX0FUVFIgPSBjZmcuQUxMT1dfQVJJQV9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgQUxMT1dfREFUQV9BVFRSID0gY2ZnLkFMTE9XX0RBVEFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIEFMTE9XX1VOS05PV05fUFJPVE9DT0xTID0gY2ZnLkFMTE9XX1VOS05PV05fUFJPVE9DT0xTIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSID0gY2ZnLkFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIFNBRkVfRk9SX1RFTVBMQVRFUyA9IGNmZy5TQUZFX0ZPUl9URU1QTEFURVMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBTQUZFX0ZPUl9YTUwgPSBjZmcuU0FGRV9GT1JfWE1MICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgV0hPTEVfRE9DVU1FTlQgPSBjZmcuV0hPTEVfRE9DVU1FTlQgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBSRVRVUk5fRE9NID0gY2ZnLlJFVFVSTl9ET00gfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBSRVRVUk5fRE9NX0ZSQUdNRU5UID0gY2ZnLlJFVFVSTl9ET01fRlJBR01FTlQgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBSRVRVUk5fVFJVU1RFRF9UWVBFID0gY2ZnLlJFVFVSTl9UUlVTVEVEX1RZUEUgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBGT1JDRV9CT0RZID0gY2ZnLkZPUkNFX0JPRFkgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBTQU5JVElaRV9ET00gPSBjZmcuU0FOSVRJWkVfRE9NICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgU0FOSVRJWkVfTkFNRURfUFJPUFMgPSBjZmcuU0FOSVRJWkVfTkFNRURfUFJPUFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBLRUVQX0NPTlRFTlQgPSBjZmcuS0VFUF9DT05URU5UICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgSU5fUExBQ0UgPSBjZmcuSU5fUExBQ0UgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBJU19BTExPV0VEX1VSSSQxID0gY2ZnLkFMTE9XRURfVVJJX1JFR0VYUCB8fCBJU19BTExPV0VEX1VSSTtcbiAgICBOQU1FU1BBQ0UgPSBjZmcuTkFNRVNQQUNFIHx8IEhUTUxfTkFNRVNQQUNFO1xuICAgIE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGNmZy5NQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgfHwgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTO1xuICAgIEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gY2ZnLkhUTUxfSU5URUdSQVRJT05fUE9JTlRTIHx8IEhUTUxfSU5URUdSQVRJT05fUE9JTlRTO1xuICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HIHx8IHt9O1xuICAgIGlmIChjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgJiYgaXNSZWdleE9yRnVuY3Rpb24oY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaykpIHtcbiAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2s7XG4gICAgfVxuICAgIGlmIChjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgJiYgaXNSZWdleE9yRnVuY3Rpb24oY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjaykpIHtcbiAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2s7XG4gICAgfVxuICAgIGlmIChjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgJiYgdHlwZW9mIGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgPT09ICdib29sZWFuJykge1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cztcbiAgICB9XG4gICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgQUxMT1dfREFUQV9BVFRSID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICBSRVRVUk5fRE9NID0gdHJ1ZTtcbiAgICB9XG4gICAgLyogUGFyc2UgcHJvZmlsZSBpbmZvICovXG4gICAgaWYgKFVTRV9QUk9GSUxFUykge1xuICAgICAgQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIHRleHQpO1xuICAgICAgQUxMT1dFRF9BVFRSID0gW107XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLmh0bWwgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBodG1sJDEpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIGh0bWwpO1xuICAgICAgfVxuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5zdmcgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBzdmckMSk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgfVxuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5zdmdGaWx0ZXJzID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnRmlsdGVycyk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgfVxuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5tYXRoTWwgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBtYXRoTWwkMSk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgbWF0aE1sKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBNZXJnZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKi9cbiAgICBpZiAoY2ZnLkFERF9UQUdTKSB7XG4gICAgICBpZiAodHlwZW9mIGNmZy5BRERfVEFHUyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLnRhZ0NoZWNrID0gY2ZnLkFERF9UQUdTO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKEFMTE9XRURfVEFHUyA9PT0gREVGQVVMVF9BTExPV0VEX1RBR1MpIHtcbiAgICAgICAgICBBTExPV0VEX1RBR1MgPSBjbG9uZShBTExPV0VEX1RBR1MpO1xuICAgICAgICB9XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgY2ZnLkFERF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjZmcuQUREX0FUVFIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2ZnLkFERF9BVFRSID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIEVYVFJBX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlQ2hlY2sgPSBjZmcuQUREX0FUVFI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoQUxMT1dFRF9BVFRSID09PSBERUZBVUxUX0FMTE9XRURfQVRUUikge1xuICAgICAgICAgIEFMTE9XRURfQVRUUiA9IGNsb25lKEFMTE9XRURfQVRUUik7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBjZmcuQUREX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNmZy5BRERfVVJJX1NBRkVfQVRUUikge1xuICAgICAgYWRkVG9TZXQoVVJJX1NBRkVfQVRUUklCVVRFUywgY2ZnLkFERF9VUklfU0FGRV9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgfVxuICAgIGlmIChjZmcuRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICBpZiAoRk9SQklEX0NPTlRFTlRTID09PSBERUZBVUxUX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgICBGT1JCSURfQ09OVEVOVFMgPSBjbG9uZShGT1JCSURfQ09OVEVOVFMpO1xuICAgICAgfVxuICAgICAgYWRkVG9TZXQoRk9SQklEX0NPTlRFTlRTLCBjZmcuRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgfVxuICAgIGlmIChjZmcuQUREX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgaWYgKEZPUkJJRF9DT05URU5UUyA9PT0gREVGQVVMVF9GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgICAgRk9SQklEX0NPTlRFTlRTID0gY2xvbmUoRk9SQklEX0NPTlRFTlRTKTtcbiAgICAgIH1cbiAgICAgIGFkZFRvU2V0KEZPUkJJRF9DT05URU5UUywgY2ZnLkFERF9GT1JCSURfQ09OVEVOVFMsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICB9XG4gICAgLyogQWRkICN0ZXh0IGluIGNhc2UgS0VFUF9DT05URU5UIGlzIHNldCB0byB0cnVlICovXG4gICAgaWYgKEtFRVBfQ09OVEVOVCkge1xuICAgICAgQUxMT1dFRF9UQUdTWycjdGV4dCddID0gdHJ1ZTtcbiAgICB9XG4gICAgLyogQWRkIGh0bWwsIGhlYWQgYW5kIGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgV0hPTEVfRE9DVU1FTlQgaXMgdHJ1ZSAqL1xuICAgIGlmIChXSE9MRV9ET0NVTUVOVCkge1xuICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBbJ2h0bWwnLCAnaGVhZCcsICdib2R5J10pO1xuICAgIH1cbiAgICAvKiBBZGQgdGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgdGFibGVzIGFyZSBwZXJtaXR0ZWQsIHNlZSAjMjg2LCAjMzY1ICovXG4gICAgaWYgKEFMTE9XRURfVEFHUy50YWJsZSkge1xuICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBbJ3Rib2R5J10pO1xuICAgICAgZGVsZXRlIEZPUkJJRF9UQUdTLnRib2R5O1xuICAgIH1cbiAgICBpZiAoY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZKSB7XG4gICAgICBpZiAodHlwZW9mIGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWS5jcmVhdGVIVE1MICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnVFJVU1RFRF9UWVBFU19QT0xJQ1kgY29uZmlndXJhdGlvbiBvcHRpb24gbXVzdCBwcm92aWRlIGEgXCJjcmVhdGVIVE1MXCIgaG9vay4nKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZLmNyZWF0ZVNjcmlwdFVSTCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ1RSVVNURURfVFlQRVNfUE9MSUNZIGNvbmZpZ3VyYXRpb24gb3B0aW9uIG11c3QgcHJvdmlkZSBhIFwiY3JlYXRlU2NyaXB0VVJMXCIgaG9vay4nKTtcbiAgICAgIH1cbiAgICAgIC8vIE92ZXJ3cml0ZSBleGlzdGluZyBUcnVzdGVkVHlwZXMgcG9saWN5LlxuICAgICAgdHJ1c3RlZFR5cGVzUG9saWN5ID0gY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZO1xuICAgICAgLy8gU2lnbiBsb2NhbCB2YXJpYWJsZXMgcmVxdWlyZWQgYnkgYHNhbml0aXplYC5cbiAgICAgIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKCcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVW5pbml0aWFsaXplZCBwb2xpY3ksIGF0dGVtcHQgdG8gaW5pdGlhbGl6ZSB0aGUgaW50ZXJuYWwgZG9tcHVyaWZ5IHBvbGljeS5cbiAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0cnVzdGVkVHlwZXNQb2xpY3kgPSBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5KHRydXN0ZWRUeXBlcywgY3VycmVudFNjcmlwdCk7XG4gICAgICB9XG4gICAgICAvLyBJZiBjcmVhdGluZyB0aGUgaW50ZXJuYWwgcG9saWN5IHN1Y2NlZWRlZCBzaWduIGludGVybmFsIHZhcmlhYmxlcy5cbiAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgIT09IG51bGwgJiYgdHlwZW9mIGVtcHR5SFRNTCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZW1wdHlIVE1MID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoJycpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBQcmV2ZW50IGZ1cnRoZXIgbWFuaXB1bGF0aW9uIG9mIGNvbmZpZ3VyYXRpb24uXG4gICAgLy8gTm90IGF2YWlsYWJsZSBpbiBJRTgsIFNhZmFyaSA1LCBldGMuXG4gICAgaWYgKGZyZWV6ZSkge1xuICAgICAgZnJlZXplKGNmZyk7XG4gICAgfVxuICAgIENPTkZJRyA9IGNmZztcbiAgfTtcbiAgLyogS2VlcCB0cmFjayBvZiBhbGwgcG9zc2libGUgU1ZHIGFuZCBNYXRoTUwgdGFnc1xuICAgKiBzbyB0aGF0IHdlIGNhbiBwZXJmb3JtIHRoZSBuYW1lc3BhY2UgY2hlY2tzXG4gICAqIGNvcnJlY3RseS4gKi9cbiAgY29uc3QgQUxMX1NWR19UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5zdmckMSwgLi4uc3ZnRmlsdGVycywgLi4uc3ZnRGlzYWxsb3dlZF0pO1xuICBjb25zdCBBTExfTUFUSE1MX1RBR1MgPSBhZGRUb1NldCh7fSwgWy4uLm1hdGhNbCQxLCAuLi5tYXRoTWxEaXNhbGxvd2VkXSk7XG4gIC8qKlxuICAgKiBAcGFyYW0gZWxlbWVudCBhIERPTSBlbGVtZW50IHdob3NlIG5hbWVzcGFjZSBpcyBiZWluZyBjaGVja2VkXG4gICAqIEByZXR1cm5zIFJldHVybiBmYWxzZSBpZiB0aGUgZWxlbWVudCBoYXMgYVxuICAgKiAgbmFtZXNwYWNlIHRoYXQgYSBzcGVjLWNvbXBsaWFudCBwYXJzZXIgd291bGQgbmV2ZXJcbiAgICogIHJldHVybi4gUmV0dXJuIHRydWUgb3RoZXJ3aXNlLlxuICAgKi9cbiAgY29uc3QgX2NoZWNrVmFsaWROYW1lc3BhY2UgPSBmdW5jdGlvbiBfY2hlY2tWYWxpZE5hbWVzcGFjZShlbGVtZW50KSB7XG4gICAgbGV0IHBhcmVudCA9IGdldFBhcmVudE5vZGUoZWxlbWVudCk7XG4gICAgLy8gSW4gSlNET00sIGlmIHdlJ3JlIGluc2lkZSBzaGFkb3cgRE9NLCB0aGVuIHBhcmVudE5vZGVcbiAgICAvLyBjYW4gYmUgbnVsbC4gV2UganVzdCBzaW11bGF0ZSBwYXJlbnQgaW4gdGhpcyBjYXNlLlxuICAgIGlmICghcGFyZW50IHx8ICFwYXJlbnQudGFnTmFtZSkge1xuICAgICAgcGFyZW50ID0ge1xuICAgICAgICBuYW1lc3BhY2VVUkk6IE5BTUVTUEFDRSxcbiAgICAgICAgdGFnTmFtZTogJ3RlbXBsYXRlJ1xuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdGFnTmFtZSA9IHN0cmluZ1RvTG93ZXJDYXNlKGVsZW1lbnQudGFnTmFtZSk7XG4gICAgY29uc3QgcGFyZW50VGFnTmFtZSA9IHN0cmluZ1RvTG93ZXJDYXNlKHBhcmVudC50YWdOYW1lKTtcbiAgICBpZiAoIUFMTE9XRURfTkFNRVNQQUNFU1tlbGVtZW50Lm5hbWVzcGFjZVVSSV0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gU1ZHXG4gICAgICAvLyBpcyB2aWEgPHN2Zz4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgIC8vIGl0IHNob3VsZCBiZSBraWxsZWQuXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdzdmcnO1xuICAgICAgfVxuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIE1hdGhNTCB0byBTVkcgaXMgdmlhYFxuICAgICAgLy8gc3ZnIGlmIHBhcmVudCBpcyBlaXRoZXIgPGFubm90YXRpb24teG1sPiBvciBNYXRoTUxcbiAgICAgIC8vIHRleHQgaW50ZWdyYXRpb24gcG9pbnRzLlxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdzdmcnICYmIChwYXJlbnRUYWdOYW1lID09PSAnYW5ub3RhdGlvbi14bWwnIHx8IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSk7XG4gICAgICB9XG4gICAgICAvLyBXZSBvbmx5IGFsbG93IGVsZW1lbnRzIHRoYXQgYXJlIGRlZmluZWQgaW4gU1ZHXG4gICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIFNWRyBuYW1lc3BhY2UuXG4gICAgICByZXR1cm4gQm9vbGVhbihBTExfU1ZHX1RBR1NbdGFnTmFtZV0pO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBIVE1MIG5hbWVzcGFjZSB0byBNYXRoTUxcbiAgICAgIC8vIGlzIHZpYSA8bWF0aD4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgIC8vIGl0IHNob3VsZCBiZSBraWxsZWQuXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJztcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gTWF0aE1MIGlzIHZpYVxuICAgICAgLy8gPG1hdGg+IGFuZCBIVE1MIGludGVncmF0aW9uIHBvaW50c1xuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJyAmJiBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIG9ubHkgYWxsb3cgZWxlbWVudHMgdGhhdCBhcmUgZGVmaW5lZCBpbiBNYXRoTUxcbiAgICAgIC8vIHNwZWMuIEFsbCBvdGhlcnMgYXJlIGRpc2FsbG93ZWQgaW4gTWF0aE1MIG5hbWVzcGFjZS5cbiAgICAgIHJldHVybiBCb29sZWFuKEFMTF9NQVRITUxfVEFHU1t0YWdOYW1lXSk7XG4gICAgfVxuICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gSFRNTCBpcyB2aWFcbiAgICAgIC8vIEhUTUwgaW50ZWdyYXRpb24gcG9pbnRzLCBhbmQgZnJvbSBNYXRoTUwgdG8gSFRNTFxuICAgICAgLy8gaXMgdmlhIE1hdGhNTCB0ZXh0IGludGVncmF0aW9uIHBvaW50c1xuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UgJiYgIUhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFICYmICFNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gV2UgZGlzYWxsb3cgdGFncyB0aGF0IGFyZSBzcGVjaWZpYyBmb3IgTWF0aE1MXG4gICAgICAvLyBvciBTVkcgYW5kIHNob3VsZCBuZXZlciBhcHBlYXIgaW4gSFRNTCBuYW1lc3BhY2VcbiAgICAgIHJldHVybiAhQUxMX01BVEhNTF9UQUdTW3RhZ05hbWVdICYmIChDT01NT05fU1ZHX0FORF9IVE1MX0VMRU1FTlRTW3RhZ05hbWVdIHx8ICFBTExfU1ZHX1RBR1NbdGFnTmFtZV0pO1xuICAgIH1cbiAgICAvLyBGb3IgWEhUTUwgYW5kIFhNTCBkb2N1bWVudHMgdGhhdCBzdXBwb3J0IGN1c3RvbSBuYW1lc3BhY2VzXG4gICAgaWYgKFBBUlNFUl9NRURJQV9UWVBFID09PSAnYXBwbGljYXRpb24veGh0bWwreG1sJyAmJiBBTExPV0VEX05BTUVTUEFDRVNbZWxlbWVudC5uYW1lc3BhY2VVUkldKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gVGhlIGNvZGUgc2hvdWxkIG5ldmVyIHJlYWNoIHRoaXMgcGxhY2UgKHRoaXMgbWVhbnNcbiAgICAvLyB0aGF0IHRoZSBlbGVtZW50IHNvbWVob3cgZ290IG5hbWVzcGFjZSB0aGF0IGlzIG5vdFxuICAgIC8vIEhUTUwsIFNWRywgTWF0aE1MIG9yIGFsbG93ZWQgdmlhIEFMTE9XRURfTkFNRVNQQUNFUykuXG4gICAgLy8gUmV0dXJuIGZhbHNlIGp1c3QgaW4gY2FzZS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIC8qKlxuICAgKiBfZm9yY2VSZW1vdmVcbiAgICpcbiAgICogQHBhcmFtIG5vZGUgYSBET00gbm9kZVxuICAgKi9cbiAgY29uc3QgX2ZvcmNlUmVtb3ZlID0gZnVuY3Rpb24gX2ZvcmNlUmVtb3ZlKG5vZGUpIHtcbiAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgIGVsZW1lbnQ6IG5vZGVcbiAgICB9KTtcbiAgICB0cnkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLXJlbW92ZVxuICAgICAgZ2V0UGFyZW50Tm9kZShub2RlKS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICByZW1vdmUobm9kZSk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogX3JlbW92ZUF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBhbiBBdHRyaWJ1dGUgbmFtZVxuICAgKiBAcGFyYW0gZWxlbWVudCBhIERPTSBub2RlXG4gICAqL1xuICBjb25zdCBfcmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24gX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBlbGVtZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgICBhdHRyaWJ1dGU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlTm9kZShuYW1lKSxcbiAgICAgICAgZnJvbTogZWxlbWVudFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogbnVsbCxcbiAgICAgICAgZnJvbTogZWxlbWVudFxuICAgICAgfSk7XG4gICAgfVxuICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIC8vIFdlIHZvaWQgYXR0cmlidXRlIHZhbHVlcyBmb3IgdW5yZW1vdmFibGUgXCJpc1wiIGF0dHJpYnV0ZXNcbiAgICBpZiAobmFtZSA9PT0gJ2lzJykge1xuICAgICAgaWYgKFJFVFVSTl9ET00gfHwgUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIF9mb3JjZVJlbW92ZShlbGVtZW50KTtcbiAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgJycpO1xuICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIF9pbml0RG9jdW1lbnRcbiAgICpcbiAgICogQHBhcmFtIGRpcnR5IC0gYSBzdHJpbmcgb2YgZGlydHkgbWFya3VwXG4gICAqIEByZXR1cm4gYSBET00sIGZpbGxlZCB3aXRoIHRoZSBkaXJ0eSBtYXJrdXBcbiAgICovXG4gIGNvbnN0IF9pbml0RG9jdW1lbnQgPSBmdW5jdGlvbiBfaW5pdERvY3VtZW50KGRpcnR5KSB7XG4gICAgLyogQ3JlYXRlIGEgSFRNTCBkb2N1bWVudCAqL1xuICAgIGxldCBkb2MgPSBudWxsO1xuICAgIGxldCBsZWFkaW5nV2hpdGVzcGFjZSA9IG51bGw7XG4gICAgaWYgKEZPUkNFX0JPRFkpIHtcbiAgICAgIGRpcnR5ID0gJzxyZW1vdmU+PC9yZW1vdmU+JyArIGRpcnR5O1xuICAgIH0gZWxzZSB7XG4gICAgICAvKiBJZiBGT1JDRV9CT0RZIGlzbid0IHVzZWQsIGxlYWRpbmcgd2hpdGVzcGFjZSBuZWVkcyB0byBiZSBwcmVzZXJ2ZWQgbWFudWFsbHkgKi9cbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBzdHJpbmdNYXRjaChkaXJ0eSwgL15bXFxyXFxuXFx0IF0rLyk7XG4gICAgICBsZWFkaW5nV2hpdGVzcGFjZSA9IG1hdGNoZXMgJiYgbWF0Y2hlc1swXTtcbiAgICB9XG4gICAgaWYgKFBBUlNFUl9NRURJQV9UWVBFID09PSAnYXBwbGljYXRpb24veGh0bWwreG1sJyAmJiBOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBSb290IG9mIFhIVE1MIGRvYyBtdXN0IGNvbnRhaW4geG1sbnMgZGVjbGFyYXRpb24gKHNlZSBodHRwczovL3d3dy53My5vcmcvVFIveGh0bWwxL25vcm1hdGl2ZS5odG1sI3N0cmljdClcbiAgICAgIGRpcnR5ID0gJzxodG1sIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiPjxoZWFkPjwvaGVhZD48Ym9keT4nICsgZGlydHkgKyAnPC9ib2R5PjwvaHRtbD4nO1xuICAgIH1cbiAgICBjb25zdCBkaXJ0eVBheWxvYWQgPSB0cnVzdGVkVHlwZXNQb2xpY3kgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChkaXJ0eSkgOiBkaXJ0eTtcbiAgICAvKlxuICAgICAqIFVzZSB0aGUgRE9NUGFyc2VyIEFQSSBieSBkZWZhdWx0LCBmYWxsYmFjayBsYXRlciBpZiBuZWVkcyBiZVxuICAgICAqIERPTVBhcnNlciBub3Qgd29yayBmb3Igc3ZnIHdoZW4gaGFzIG11bHRpcGxlIHJvb3QgZWxlbWVudC5cbiAgICAgKi9cbiAgICBpZiAoTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhkaXJ0eVBheWxvYWQsIFBBUlNFUl9NRURJQV9UWVBFKTtcbiAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgfVxuICAgIC8qIFVzZSBjcmVhdGVIVE1MRG9jdW1lbnQgaW4gY2FzZSBET01QYXJzZXIgaXMgbm90IGF2YWlsYWJsZSAqL1xuICAgIGlmICghZG9jIHx8ICFkb2MuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICBkb2MgPSBpbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudChOQU1FU1BBQ0UsICd0ZW1wbGF0ZScsIG51bGwpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZG9jLmRvY3VtZW50RWxlbWVudC5pbm5lckhUTUwgPSBJU19FTVBUWV9JTlBVVCA/IGVtcHR5SFRNTCA6IGRpcnR5UGF5bG9hZDtcbiAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgLy8gU3ludGF4IGVycm9yIGlmIGRpcnR5UGF5bG9hZCBpcyBpbnZhbGlkIHhtbFxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBib2R5ID0gZG9jLmJvZHkgfHwgZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICBpZiAoZGlydHkgJiYgbGVhZGluZ1doaXRlc3BhY2UpIHtcbiAgICAgIGJvZHkuaW5zZXJ0QmVmb3JlKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGxlYWRpbmdXaGl0ZXNwYWNlKSwgYm9keS5jaGlsZE5vZGVzWzBdIHx8IG51bGwpO1xuICAgIH1cbiAgICAvKiBXb3JrIG9uIHdob2xlIGRvY3VtZW50IG9yIGp1c3QgaXRzIGJvZHkgKi9cbiAgICBpZiAoTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgcmV0dXJuIGdldEVsZW1lbnRzQnlUYWdOYW1lLmNhbGwoZG9jLCBXSE9MRV9ET0NVTUVOVCA/ICdodG1sJyA6ICdib2R5JylbMF07XG4gICAgfVxuICAgIHJldHVybiBXSE9MRV9ET0NVTUVOVCA/IGRvYy5kb2N1bWVudEVsZW1lbnQgOiBib2R5O1xuICB9O1xuICAvKipcbiAgICogQ3JlYXRlcyBhIE5vZGVJdGVyYXRvciBvYmplY3QgdGhhdCB5b3UgY2FuIHVzZSB0byB0cmF2ZXJzZSBmaWx0ZXJlZCBsaXN0cyBvZiBub2RlcyBvciBlbGVtZW50cyBpbiBhIGRvY3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gcm9vdCBUaGUgcm9vdCBlbGVtZW50IG9yIG5vZGUgdG8gc3RhcnQgdHJhdmVyc2luZyBvbi5cbiAgICogQHJldHVybiBUaGUgY3JlYXRlZCBOb2RlSXRlcmF0b3JcbiAgICovXG4gIGNvbnN0IF9jcmVhdGVOb2RlSXRlcmF0b3IgPSBmdW5jdGlvbiBfY3JlYXRlTm9kZUl0ZXJhdG9yKHJvb3QpIHtcbiAgICByZXR1cm4gY3JlYXRlTm9kZUl0ZXJhdG9yLmNhbGwocm9vdC5vd25lckRvY3VtZW50IHx8IHJvb3QsIHJvb3QsXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2VcbiAgICBOb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCB8IE5vZGVGaWx0ZXIuU0hPV19DT01NRU5UIHwgTm9kZUZpbHRlci5TSE9XX1RFWFQgfCBOb2RlRmlsdGVyLlNIT1dfUFJPQ0VTU0lOR19JTlNUUlVDVElPTiB8IE5vZGVGaWx0ZXIuU0hPV19DREFUQV9TRUNUSU9OLCBudWxsKTtcbiAgfTtcbiAgLyoqXG4gICAqIF9pc0Nsb2JiZXJlZFxuICAgKlxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGNoZWNrIGZvciBjbG9iYmVyaW5nIGF0dGFja3NcbiAgICogQHJldHVybiB0cnVlIGlmIGNsb2JiZXJlZCwgZmFsc2UgaWYgc2FmZVxuICAgKi9cbiAgY29uc3QgX2lzQ2xvYmJlcmVkID0gZnVuY3Rpb24gX2lzQ2xvYmJlcmVkKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCAmJiAodHlwZW9mIGVsZW1lbnQubm9kZU5hbWUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50LnRleHRDb250ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudC5yZW1vdmVDaGlsZCAhPT0gJ2Z1bmN0aW9uJyB8fCAhKGVsZW1lbnQuYXR0cmlidXRlcyBpbnN0YW5jZW9mIE5hbWVkTm9kZU1hcCkgfHwgdHlwZW9mIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50LnNldEF0dHJpYnV0ZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgZWxlbWVudC5uYW1lc3BhY2VVUkkgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50Lmluc2VydEJlZm9yZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgZWxlbWVudC5oYXNDaGlsZE5vZGVzICE9PSAnZnVuY3Rpb24nKTtcbiAgfTtcbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBET00gbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIG9iamVjdCB0byBjaGVjayB3aGV0aGVyIGl0J3MgYSBET00gbm9kZVxuICAgKiBAcmV0dXJuIHRydWUgaXMgb2JqZWN0IGlzIGEgRE9NIG5vZGVcbiAgICovXG4gIGNvbnN0IF9pc05vZGUgPSBmdW5jdGlvbiBfaXNOb2RlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBOb2RlID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgTm9kZTtcbiAgfTtcbiAgZnVuY3Rpb24gX2V4ZWN1dGVIb29rcyhob29rcywgY3VycmVudE5vZGUsIGRhdGEpIHtcbiAgICBhcnJheUZvckVhY2goaG9va3MsIGhvb2sgPT4ge1xuICAgICAgaG9vay5jYWxsKERPTVB1cmlmeSwgY3VycmVudE5vZGUsIGRhdGEsIENPTkZJRyk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIF9zYW5pdGl6ZUVsZW1lbnRzXG4gICAqXG4gICAqIEBwcm90ZWN0IG5vZGVOYW1lXG4gICAqIEBwcm90ZWN0IHRleHRDb250ZW50XG4gICAqIEBwcm90ZWN0IHJlbW92ZUNoaWxkXG4gICAqIEBwYXJhbSBjdXJyZW50Tm9kZSB0byBjaGVjayBmb3IgcGVybWlzc2lvbiB0byBleGlzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgbm9kZSB3YXMga2lsbGVkLCBmYWxzZSBpZiBsZWZ0IGFsaXZlXG4gICAqL1xuICBjb25zdCBfc2FuaXRpemVFbGVtZW50cyA9IGZ1bmN0aW9uIF9zYW5pdGl6ZUVsZW1lbnRzKGN1cnJlbnROb2RlKSB7XG4gICAgbGV0IGNvbnRlbnQgPSBudWxsO1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmJlZm9yZVNhbml0aXplRWxlbWVudHMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgICAvKiBDaGVjayBpZiBlbGVtZW50IGlzIGNsb2JiZXJlZCBvciBjYW4gY2xvYmJlciAqL1xuICAgIGlmIChfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIE5vdyBsZXQncyBjaGVjayB0aGUgZWxlbWVudCdzIHR5cGUgYW5kIG5hbWUgKi9cbiAgICBjb25zdCB0YWdOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoY3VycmVudE5vZGUubm9kZU5hbWUpO1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZUVsZW1lbnQsIGN1cnJlbnROb2RlLCB7XG4gICAgICB0YWdOYW1lLFxuICAgICAgYWxsb3dlZFRhZ3M6IEFMTE9XRURfVEFHU1xuICAgIH0pO1xuICAgIC8qIERldGVjdCBtWFNTIGF0dGVtcHRzIGFidXNpbmcgbmFtZXNwYWNlIGNvbmZ1c2lvbiAqL1xuICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgY3VycmVudE5vZGUuaGFzQ2hpbGROb2RlcygpICYmICFfaXNOb2RlKGN1cnJlbnROb2RlLmZpcnN0RWxlbWVudENoaWxkKSAmJiByZWdFeHBUZXN0KC88Wy9cXHchXS9nLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpICYmIHJlZ0V4cFRlc3QoLzxbL1xcdyFdL2csIGN1cnJlbnROb2RlLnRleHRDb250ZW50KSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBSZW1vdmUgYW55IG9jY3VycmVuY2Ugb2YgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbnMgKi9cbiAgICBpZiAoY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5wcm9ncmVzc2luZ0luc3RydWN0aW9uKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFJlbW92ZSBhbnkga2luZCBvZiBwb3NzaWJseSBoYXJtZnVsIGNvbW1lbnRzICovXG4gICAgaWYgKFNBRkVfRk9SX1hNTCAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLmNvbW1lbnQgJiYgcmVnRXhwVGVzdCgvPFsvXFx3XS9nLCBjdXJyZW50Tm9kZS5kYXRhKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBSZW1vdmUgZWxlbWVudCBpZiBhbnl0aGluZyBmb3JiaWRzIGl0cyBwcmVzZW5jZSAqL1xuICAgIGlmICghKEVYVFJBX0VMRU1FTlRfSEFORExJTkcudGFnQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLnRhZ0NoZWNrKHRhZ05hbWUpKSAmJiAoIUFMTE9XRURfVEFHU1t0YWdOYW1lXSB8fCBGT1JCSURfVEFHU1t0YWdOYW1lXSkpIHtcbiAgICAgIC8qIENoZWNrIGlmIHdlIGhhdmUgYSBjdXN0b20gZWxlbWVudCB0byBoYW5kbGUgKi9cbiAgICAgIGlmICghRk9SQklEX1RBR1NbdGFnTmFtZV0gJiYgX2lzQmFzaWNDdXN0b21FbGVtZW50KHRhZ05hbWUpKSB7XG4gICAgICAgIGlmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIHRhZ05hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sodGFnTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8qIEtlZXAgY29udGVudCBleGNlcHQgZm9yIGJhZC1saXN0ZWQgZWxlbWVudHMgKi9cbiAgICAgIGlmIChLRUVQX0NPTlRFTlQgJiYgIUZPUkJJRF9DT05URU5UU1t0YWdOYW1lXSkge1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50Tm9kZShjdXJyZW50Tm9kZSkgfHwgY3VycmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgY29uc3QgY2hpbGROb2RlcyA9IGdldENoaWxkTm9kZXMoY3VycmVudE5vZGUpIHx8IGN1cnJlbnROb2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGlmIChjaGlsZE5vZGVzICYmIHBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZENvdW50ID0gY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IGNoaWxkQ291bnQgLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRDbG9uZSA9IGNsb25lTm9kZShjaGlsZE5vZGVzW2ldLCB0cnVlKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuX19yZW1vdmFsQ291bnQgPSAoY3VycmVudE5vZGUuX19yZW1vdmFsQ291bnQgfHwgMCkgKyAxO1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2hpbGRDbG9uZSwgZ2V0TmV4dFNpYmxpbmcoY3VycmVudE5vZGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogQ2hlY2sgd2hldGhlciBlbGVtZW50IGhhcyBhIHZhbGlkIG5hbWVzcGFjZSAqL1xuICAgIGlmIChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIV9jaGVja1ZhbGlkTmFtZXNwYWNlKGN1cnJlbnROb2RlKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBNYWtlIHN1cmUgdGhhdCBvbGRlciBicm93c2VycyBkb24ndCBnZXQgZmFsbGJhY2stdGFnIG1YU1MgKi9cbiAgICBpZiAoKHRhZ05hbWUgPT09ICdub3NjcmlwdCcgfHwgdGFnTmFtZSA9PT0gJ25vZW1iZWQnIHx8IHRhZ05hbWUgPT09ICdub2ZyYW1lcycpICYmIHJlZ0V4cFRlc3QoLzxcXC9ubyhzY3JpcHR8ZW1iZWR8ZnJhbWVzKS9pLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFNhbml0aXplIGVsZW1lbnQgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUyAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLnRleHQpIHtcbiAgICAgIC8qIEdldCB0aGUgZWxlbWVudCdzIHRleHQgY29udGVudCAqL1xuICAgICAgY29udGVudCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xuICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgY29udGVudCA9IHN0cmluZ1JlcGxhY2UoY29udGVudCwgZXhwciwgJyAnKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50ICE9PSBjb250ZW50KSB7XG4gICAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgICAgIGVsZW1lbnQ6IGN1cnJlbnROb2RlLmNsb25lTm9kZSgpXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVFbGVtZW50cywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIF9pc1ZhbGlkQXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSBsY1RhZyBMb3dlcmNhc2UgdGFnIG5hbWUgb2YgY29udGFpbmluZyBlbGVtZW50LlxuICAgKiBAcGFyYW0gbGNOYW1lIExvd2VyY2FzZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICogQHBhcmFtIHZhbHVlIEF0dHJpYnV0ZSB2YWx1ZS5cbiAgICogQHJldHVybiBSZXR1cm5zIHRydWUgaWYgYHZhbHVlYCBpcyB2YWxpZCwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgY29uc3QgX2lzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkge1xuICAgIC8qIE1ha2Ugc3VyZSBhdHRyaWJ1dGUgY2Fubm90IGNsb2JiZXIgKi9cbiAgICBpZiAoU0FOSVRJWkVfRE9NICYmIChsY05hbWUgPT09ICdpZCcgfHwgbGNOYW1lID09PSAnbmFtZScpICYmICh2YWx1ZSBpbiBkb2N1bWVudCB8fCB2YWx1ZSBpbiBmb3JtRWxlbWVudCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyogQWxsb3cgdmFsaWQgZGF0YS0qIGF0dHJpYnV0ZXM6IEF0IGxlYXN0IG9uZSBjaGFyYWN0ZXIgYWZ0ZXIgXCItXCJcbiAgICAgICAgKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2VtYmVkZGluZy1jdXN0b20tbm9uLXZpc2libGUtZGF0YS13aXRoLXRoZS1kYXRhLSotYXR0cmlidXRlcylcbiAgICAgICAgWE1MLWNvbXBhdGlibGUgKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZnJhc3RydWN0dXJlLmh0bWwjeG1sLWNvbXBhdGlibGUgYW5kIGh0dHA6Ly93d3cudzMub3JnL1RSL3htbC8jZDBlODA0KVxuICAgICAgICBXZSBkb24ndCBuZWVkIHRvIGNoZWNrIHRoZSB2YWx1ZTsgaXQncyBhbHdheXMgVVJJIHNhZmUuICovXG4gICAgaWYgKEFMTE9XX0RBVEFfQVRUUiAmJiAhRk9SQklEX0FUVFJbbGNOYW1lXSAmJiByZWdFeHBUZXN0KERBVEFfQVRUUiwgbGNOYW1lKSkgOyBlbHNlIGlmIChBTExPV19BUklBX0FUVFIgJiYgcmVnRXhwVGVzdChBUklBX0FUVFIsIGxjTmFtZSkpIDsgZWxzZSBpZiAoRVhUUkFfRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIEVYVFJBX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlQ2hlY2sobGNOYW1lLCBsY1RhZykpIDsgZWxzZSBpZiAoIUFMTE9XRURfQVRUUltsY05hbWVdIHx8IEZPUkJJRF9BVFRSW2xjTmFtZV0pIHtcbiAgICAgIGlmIChcbiAgICAgIC8vIEZpcnN0IGNvbmRpdGlvbiBkb2VzIGEgdmVyeSBiYXNpYyBjaGVjayBpZiBhKSBpdCdzIGJhc2ljYWxseSBhIHZhbGlkIGN1c3RvbSBlbGVtZW50IHRhZ25hbWUgQU5EXG4gICAgICAvLyBiKSBpZiB0aGUgdGFnTmFtZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVja1xuICAgICAgLy8gYW5kIGMpIGlmIHRoZSBhdHRyaWJ1dGUgbmFtZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVja1xuICAgICAgX2lzQmFzaWNDdXN0b21FbGVtZW50KGxjVGFnKSAmJiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLCBsY1RhZykgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKGxjVGFnKSkgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjaywgbGNOYW1lKSB8fCBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sobGNOYW1lLCBsY1RhZykpIHx8XG4gICAgICAvLyBBbHRlcm5hdGl2ZSwgc2Vjb25kIGNvbmRpdGlvbiBjaGVja3MgaWYgaXQncyBhbiBgaXNgLWF0dHJpYnV0ZSwgQU5EXG4gICAgICAvLyB0aGUgdmFsdWUgcGFzc2VzIHdoYXRldmVyIHRoZSB1c2VyIGhhcyBjb25maWd1cmVkIGZvciBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2tcbiAgICAgIGxjTmFtZSA9PT0gJ2lzJyAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgdmFsdWUpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayh2YWx1ZSkpKSA7IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvKiBDaGVjayB2YWx1ZSBpcyBzYWZlLiBGaXJzdCwgaXMgYXR0ciBpbmVydD8gSWYgc28sIGlzIHNhZmUgKi9cbiAgICB9IGVsc2UgaWYgKFVSSV9TQUZFX0FUVFJJQlVURVNbbGNOYW1lXSkgOyBlbHNlIGlmIChyZWdFeHBUZXN0KElTX0FMTE9XRURfVVJJJDEsIHN0cmluZ1JlcGxhY2UodmFsdWUsIEFUVFJfV0hJVEVTUEFDRSwgJycpKSkgOyBlbHNlIGlmICgobGNOYW1lID09PSAnc3JjJyB8fCBsY05hbWUgPT09ICd4bGluazpocmVmJyB8fCBsY05hbWUgPT09ICdocmVmJykgJiYgbGNUYWcgIT09ICdzY3JpcHQnICYmIHN0cmluZ0luZGV4T2YodmFsdWUsICdkYXRhOicpID09PSAwICYmIERBVEFfVVJJX1RBR1NbbGNUYWddKSA7IGVsc2UgaWYgKEFMTE9XX1VOS05PV05fUFJPVE9DT0xTICYmICFyZWdFeHBUZXN0KElTX1NDUklQVF9PUl9EQVRBLCBzdHJpbmdSZXBsYWNlKHZhbHVlLCBBVFRSX1dISVRFU1BBQ0UsICcnKSkpIDsgZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICAvKipcbiAgICogX2lzQmFzaWNDdXN0b21FbGVtZW50XG4gICAqIGNoZWNrcyBpZiBhdCBsZWFzdCBvbmUgZGFzaCBpcyBpbmNsdWRlZCBpbiB0YWdOYW1lLCBhbmQgaXQncyBub3QgdGhlIGZpcnN0IGNoYXJcbiAgICogZm9yIG1vcmUgc29waGlzdGljYXRlZCBjaGVja2luZyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy92YWxpZGF0ZS1lbGVtZW50LW5hbWVcbiAgICpcbiAgICogQHBhcmFtIHRhZ05hbWUgbmFtZSBvZiB0aGUgdGFnIG9mIHRoZSBub2RlIHRvIHNhbml0aXplXG4gICAqIEByZXR1cm5zIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGFnIG5hbWUgbWVldHMgdGhlIGJhc2ljIGNyaXRlcmlhIGZvciBhIGN1c3RvbSBlbGVtZW50LCBvdGhlcndpc2UgZmFsc2UuXG4gICAqL1xuICBjb25zdCBfaXNCYXNpY0N1c3RvbUVsZW1lbnQgPSBmdW5jdGlvbiBfaXNCYXNpY0N1c3RvbUVsZW1lbnQodGFnTmFtZSkge1xuICAgIHJldHVybiB0YWdOYW1lICE9PSAnYW5ub3RhdGlvbi14bWwnICYmIHN0cmluZ01hdGNoKHRhZ05hbWUsIENVU1RPTV9FTEVNRU5UKTtcbiAgfTtcbiAgLyoqXG4gICAqIF9zYW5pdGl6ZUF0dHJpYnV0ZXNcbiAgICpcbiAgICogQHByb3RlY3QgYXR0cmlidXRlc1xuICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgKiBAcHJvdGVjdCByZW1vdmVBdHRyaWJ1dGVcbiAgICogQHByb3RlY3Qgc2V0QXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSBjdXJyZW50Tm9kZSB0byBzYW5pdGl6ZVxuICAgKi9cbiAgY29uc3QgX3Nhbml0aXplQXR0cmlidXRlcyA9IGZ1bmN0aW9uIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoY3VycmVudE5vZGUpIHtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZUF0dHJpYnV0ZXMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgICBjb25zdCB7XG4gICAgICBhdHRyaWJ1dGVzXG4gICAgfSA9IGN1cnJlbnROb2RlO1xuICAgIC8qIENoZWNrIGlmIHdlIGhhdmUgYXR0cmlidXRlczsgaWYgbm90IHdlIG1pZ2h0IGhhdmUgYSB0ZXh0IG5vZGUgKi9cbiAgICBpZiAoIWF0dHJpYnV0ZXMgfHwgX2lzQ2xvYmJlcmVkKGN1cnJlbnROb2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBob29rRXZlbnQgPSB7XG4gICAgICBhdHRyTmFtZTogJycsXG4gICAgICBhdHRyVmFsdWU6ICcnLFxuICAgICAga2VlcEF0dHI6IHRydWUsXG4gICAgICBhbGxvd2VkQXR0cmlidXRlczogQUxMT1dFRF9BVFRSLFxuICAgICAgZm9yY2VLZWVwQXR0cjogdW5kZWZpbmVkXG4gICAgfTtcbiAgICBsZXQgbCA9IGF0dHJpYnV0ZXMubGVuZ3RoO1xuICAgIC8qIEdvIGJhY2t3YXJkcyBvdmVyIGFsbCBhdHRyaWJ1dGVzOyBzYWZlbHkgcmVtb3ZlIGJhZCBvbmVzICovXG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJpYnV0ZXNbbF07XG4gICAgICBjb25zdCB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIG5hbWVzcGFjZVVSSSxcbiAgICAgICAgdmFsdWU6IGF0dHJWYWx1ZVxuICAgICAgfSA9IGF0dHI7XG4gICAgICBjb25zdCBsY05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhuYW1lKTtcbiAgICAgIGNvbnN0IGluaXRWYWx1ZSA9IGF0dHJWYWx1ZTtcbiAgICAgIGxldCB2YWx1ZSA9IG5hbWUgPT09ICd2YWx1ZScgPyBpbml0VmFsdWUgOiBzdHJpbmdUcmltKGluaXRWYWx1ZSk7XG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBob29rRXZlbnQuYXR0ck5hbWUgPSBsY05hbWU7XG4gICAgICBob29rRXZlbnQuYXR0clZhbHVlID0gdmFsdWU7XG4gICAgICBob29rRXZlbnQua2VlcEF0dHIgPSB0cnVlO1xuICAgICAgaG9va0V2ZW50LmZvcmNlS2VlcEF0dHIgPSB1bmRlZmluZWQ7IC8vIEFsbG93cyBkZXZlbG9wZXJzIHRvIHNlZSB0aGlzIGlzIGEgcHJvcGVydHkgdGhleSBjYW4gc2V0XG4gICAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZUF0dHJpYnV0ZSwgY3VycmVudE5vZGUsIGhvb2tFdmVudCk7XG4gICAgICB2YWx1ZSA9IGhvb2tFdmVudC5hdHRyVmFsdWU7XG4gICAgICAvKiBGdWxsIERPTSBDbG9iYmVyaW5nIHByb3RlY3Rpb24gdmlhIG5hbWVzcGFjZSBpc29sYXRpb24sXG4gICAgICAgKiBQcmVmaXggaWQgYW5kIG5hbWUgYXR0cmlidXRlcyB3aXRoIGB1c2VyLWNvbnRlbnQtYFxuICAgICAgICovXG4gICAgICBpZiAoU0FOSVRJWkVfTkFNRURfUFJPUFMgJiYgKGxjTmFtZSA9PT0gJ2lkJyB8fCBsY05hbWUgPT09ICduYW1lJykpIHtcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGlzIHZhbHVlXG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICAvLyBQcmVmaXggdGhlIHZhbHVlIGFuZCBsYXRlciByZS1jcmVhdGUgdGhlIGF0dHJpYnV0ZSB3aXRoIHRoZSBzYW5pdGl6ZWQgdmFsdWVcbiAgICAgICAgdmFsdWUgPSBTQU5JVElaRV9OQU1FRF9QUk9QU19QUkVGSVggKyB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIC8qIFdvcmsgYXJvdW5kIGEgc2VjdXJpdHkgaXNzdWUgd2l0aCBjb21tZW50cyBpbnNpZGUgYXR0cmlidXRlcyAqL1xuICAgICAgaWYgKFNBRkVfRk9SX1hNTCAmJiByZWdFeHBUZXN0KC8oKC0tIT98XSk+KXw8XFwvKHN0eWxlfHRpdGxlfHRleHRhcmVhKS9pLCB2YWx1ZSkpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogTWFrZSBzdXJlIHdlIGNhbm5vdCBlYXNpbHkgdXNlIGFuaW1hdGVkIGhyZWZzLCBldmVuIGlmIGFuaW1hdGlvbnMgYXJlIGFsbG93ZWQgKi9cbiAgICAgIGlmIChsY05hbWUgPT09ICdhdHRyaWJ1dGVuYW1lJyAmJiBzdHJpbmdNYXRjaCh2YWx1ZSwgJ2hyZWYnKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBEaWQgdGhlIGhvb2tzIGFwcHJvdmUgb2YgdGhlIGF0dHJpYnV0ZT8gKi9cbiAgICAgIGlmIChob29rRXZlbnQuZm9yY2VLZWVwQXR0cikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIERpZCB0aGUgaG9va3MgYXBwcm92ZSBvZiB0aGUgYXR0cmlidXRlPyAqL1xuICAgICAgaWYgKCFob29rRXZlbnQua2VlcEF0dHIpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogV29yayBhcm91bmQgYSBzZWN1cml0eSBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gICAgICBpZiAoIUFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiAmJiByZWdFeHBUZXN0KC9cXC8+L2ksIHZhbHVlKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBTYW5pdGl6ZSBhdHRyaWJ1dGUgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICAgIGFycmF5Rm9yRWFjaChbTVVTVEFDSEVfRVhQUiwgRVJCX0VYUFIsIFRNUExJVF9FWFBSXSwgZXhwciA9PiB7XG4gICAgICAgICAgdmFsdWUgPSBzdHJpbmdSZXBsYWNlKHZhbHVlLCBleHByLCAnICcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8qIElzIGB2YWx1ZWAgdmFsaWQgZm9yIHRoaXMgYXR0cmlidXRlPyAqL1xuICAgICAgY29uc3QgbGNUYWcgPSB0cmFuc2Zvcm1DYXNlRnVuYyhjdXJyZW50Tm9kZS5ub2RlTmFtZSk7XG4gICAgICBpZiAoIV9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBIYW5kbGUgYXR0cmlidXRlcyB0aGF0IHJlcXVpcmUgVHJ1c3RlZCBUeXBlcyAqL1xuICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSAmJiB0eXBlb2YgdHJ1c3RlZFR5cGVzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdHJ1c3RlZFR5cGVzLmdldEF0dHJpYnV0ZVR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZVVSSSkgOyBlbHNlIHtcbiAgICAgICAgICBzd2l0Y2ggKHRydXN0ZWRUeXBlcy5nZXRBdHRyaWJ1dGVUeXBlKGxjVGFnLCBsY05hbWUpKSB7XG4gICAgICAgICAgICBjYXNlICdUcnVzdGVkSFRNTCc6XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnVHJ1c3RlZFNjcmlwdFVSTCc6XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVTY3JpcHRVUkwodmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvKiBIYW5kbGUgaW52YWxpZCBkYXRhLSogYXR0cmlidXRlIHNldCBieSB0cnktY2F0Y2hpbmcgaXQgKi9cbiAgICAgIGlmICh2YWx1ZSAhPT0gaW5pdFZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG5hbWVzcGFjZVVSSSkge1xuICAgICAgICAgICAgY3VycmVudE5vZGUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8qIEZhbGxiYWNrIHRvIHNldEF0dHJpYnV0ZSgpIGZvciBicm93c2VyLXVucmVjb2duaXplZCBuYW1lc3BhY2VzIGUuZy4gXCJ4LXNjaGVtYVwiLiAqL1xuICAgICAgICAgICAgY3VycmVudE5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFycmF5UG9wKERPTVB1cmlmeS5yZW1vdmVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplQXR0cmlidXRlcywgY3VycmVudE5vZGUsIG51bGwpO1xuICB9O1xuICAvKipcbiAgICogX3Nhbml0aXplU2hhZG93RE9NXG4gICAqXG4gICAqIEBwYXJhbSBmcmFnbWVudCB0byBpdGVyYXRlIG92ZXIgcmVjdXJzaXZlbHlcbiAgICovXG4gIGNvbnN0IF9zYW5pdGl6ZVNoYWRvd0RPTSA9IGZ1bmN0aW9uIF9zYW5pdGl6ZVNoYWRvd0RPTShmcmFnbWVudCkge1xuICAgIGxldCBzaGFkb3dOb2RlID0gbnVsbDtcbiAgICBjb25zdCBzaGFkb3dJdGVyYXRvciA9IF9jcmVhdGVOb2RlSXRlcmF0b3IoZnJhZ21lbnQpO1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmJlZm9yZVNhbml0aXplU2hhZG93RE9NLCBmcmFnbWVudCwgbnVsbCk7XG4gICAgd2hpbGUgKHNoYWRvd05vZGUgPSBzaGFkb3dJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZVNoYWRvd05vZGUsIHNoYWRvd05vZGUsIG51bGwpO1xuICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgIF9zYW5pdGl6ZUVsZW1lbnRzKHNoYWRvd05vZGUpO1xuICAgICAgLyogQ2hlY2sgYXR0cmlidXRlcyBuZXh0ICovXG4gICAgICBfc2FuaXRpemVBdHRyaWJ1dGVzKHNoYWRvd05vZGUpO1xuICAgICAgLyogRGVlcCBzaGFkb3cgRE9NIGRldGVjdGVkICovXG4gICAgICBpZiAoc2hhZG93Tm9kZS5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oc2hhZG93Tm9kZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYWZ0ZXJTYW5pdGl6ZVNoYWRvd0RPTSwgZnJhZ21lbnQsIG51bGwpO1xuICB9O1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICBET01QdXJpZnkuc2FuaXRpemUgPSBmdW5jdGlvbiAoZGlydHkpIHtcbiAgICBsZXQgY2ZnID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBsZXQgYm9keSA9IG51bGw7XG4gICAgbGV0IGltcG9ydGVkTm9kZSA9IG51bGw7XG4gICAgbGV0IGN1cnJlbnROb2RlID0gbnVsbDtcbiAgICBsZXQgcmV0dXJuTm9kZSA9IG51bGw7XG4gICAgLyogTWFrZSBzdXJlIHdlIGhhdmUgYSBzdHJpbmcgdG8gc2FuaXRpemUuXG4gICAgICBETyBOT1QgcmV0dXJuIGVhcmx5LCBhcyB0aGlzIHdpbGwgcmV0dXJuIHRoZSB3cm9uZyB0eXBlIGlmXG4gICAgICB0aGUgdXNlciBoYXMgcmVxdWVzdGVkIGEgRE9NIG9iamVjdCByYXRoZXIgdGhhbiBhIHN0cmluZyAqL1xuICAgIElTX0VNUFRZX0lOUFVUID0gIWRpcnR5O1xuICAgIGlmIChJU19FTVBUWV9JTlBVVCkge1xuICAgICAgZGlydHkgPSAnPCEtLT4nO1xuICAgIH1cbiAgICAvKiBTdHJpbmdpZnksIGluIGNhc2UgZGlydHkgaXMgYW4gb2JqZWN0ICovXG4gICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycgJiYgIV9pc05vZGUoZGlydHkpKSB7XG4gICAgICBpZiAodHlwZW9mIGRpcnR5LnRvU3RyaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGRpcnR5ID0gZGlydHkudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ2RpcnR5IGlzIG5vdCBhIHN0cmluZywgYWJvcnRpbmcnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCd0b1N0cmluZyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBSZXR1cm4gZGlydHkgSFRNTCBpZiBET01QdXJpZnkgY2Fubm90IHJ1biAqL1xuICAgIGlmICghRE9NUHVyaWZ5LmlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIC8qIEFzc2lnbiBjb25maWcgdmFycyAqL1xuICAgIGlmICghU0VUX0NPTkZJRykge1xuICAgICAgX3BhcnNlQ29uZmlnKGNmZyk7XG4gICAgfVxuICAgIC8qIENsZWFuIHVwIHJlbW92ZWQgZWxlbWVudHMgKi9cbiAgICBET01QdXJpZnkucmVtb3ZlZCA9IFtdO1xuICAgIC8qIENoZWNrIGlmIGRpcnR5IGlzIGNvcnJlY3RseSB0eXBlZCBmb3IgSU5fUExBQ0UgKi9cbiAgICBpZiAodHlwZW9mIGRpcnR5ID09PSAnc3RyaW5nJykge1xuICAgICAgSU5fUExBQ0UgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKElOX1BMQUNFKSB7XG4gICAgICAvKiBEbyBzb21lIGVhcmx5IHByZS1zYW5pdGl6YXRpb24gdG8gYXZvaWQgdW5zYWZlIHJvb3Qgbm9kZXMgKi9cbiAgICAgIGlmIChkaXJ0eS5ub2RlTmFtZSkge1xuICAgICAgICBjb25zdCB0YWdOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoZGlydHkubm9kZU5hbWUpO1xuICAgICAgICBpZiAoIUFMTE9XRURfVEFHU1t0YWdOYW1lXSB8fCBGT1JCSURfVEFHU1t0YWdOYW1lXSkge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgncm9vdCBub2RlIGlzIGZvcmJpZGRlbiBhbmQgY2Fubm90IGJlIHNhbml0aXplZCBpbi1wbGFjZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChkaXJ0eSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgIC8qIElmIGRpcnR5IGlzIGEgRE9NIGVsZW1lbnQsIGFwcGVuZCB0byBhbiBlbXB0eSBkb2N1bWVudCB0byBhdm9pZFxuICAgICAgICAgZWxlbWVudHMgYmVpbmcgc3RyaXBwZWQgYnkgdGhlIHBhcnNlciAqL1xuICAgICAgYm9keSA9IF9pbml0RG9jdW1lbnQoJzwhLS0tLT4nKTtcbiAgICAgIGltcG9ydGVkTm9kZSA9IGJvZHkub3duZXJEb2N1bWVudC5pbXBvcnROb2RlKGRpcnR5LCB0cnVlKTtcbiAgICAgIGlmIChpbXBvcnRlZE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5lbGVtZW50ICYmIGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0JPRFknKSB7XG4gICAgICAgIC8qIE5vZGUgaXMgYWxyZWFkeSBhIGJvZHksIHVzZSBhcyBpcyAqL1xuICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgfSBlbHNlIGlmIChpbXBvcnRlZE5vZGUubm9kZU5hbWUgPT09ICdIVE1MJykge1xuICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLWFwcGVuZFxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKGltcG9ydGVkTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIEV4aXQgZGlyZWN0bHkgaWYgd2UgaGF2ZSBub3RoaW5nIHRvIGRvICovXG4gICAgICBpZiAoIVJFVFVSTl9ET00gJiYgIVNBRkVfRk9SX1RFTVBMQVRFUyAmJiAhV0hPTEVfRE9DVU1FTlQgJiZcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1pbmNsdWRlc1xuICAgICAgZGlydHkuaW5kZXhPZignPCcpID09PSAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChkaXJ0eSkgOiBkaXJ0eTtcbiAgICAgIH1cbiAgICAgIC8qIEluaXRpYWxpemUgdGhlIGRvY3VtZW50IHRvIHdvcmsgb24gKi9cbiAgICAgIGJvZHkgPSBfaW5pdERvY3VtZW50KGRpcnR5KTtcbiAgICAgIC8qIENoZWNrIHdlIGhhdmUgYSBET00gbm9kZSBmcm9tIHRoZSBkYXRhICovXG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgcmV0dXJuIFJFVFVSTl9ET00gPyBudWxsIDogUkVUVVJOX1RSVVNURURfVFlQRSA/IGVtcHR5SFRNTCA6ICcnO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBSZW1vdmUgZmlyc3QgZWxlbWVudCBub2RlIChvdXJzKSBpZiBGT1JDRV9CT0RZIGlzIHNldCAqL1xuICAgIGlmIChib2R5ICYmIEZPUkNFX0JPRFkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShib2R5LmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICAvKiBHZXQgbm9kZSBpdGVyYXRvciAqL1xuICAgIGNvbnN0IG5vZGVJdGVyYXRvciA9IF9jcmVhdGVOb2RlSXRlcmF0b3IoSU5fUExBQ0UgPyBkaXJ0eSA6IGJvZHkpO1xuICAgIC8qIE5vdyBzdGFydCBpdGVyYXRpbmcgb3ZlciB0aGUgY3JlYXRlZCBkb2N1bWVudCAqL1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSA9IG5vZGVJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAvKiBTYW5pdGl6ZSB0YWdzIGFuZCBlbGVtZW50cyAqL1xuICAgICAgX3Nhbml0aXplRWxlbWVudHMoY3VycmVudE5vZGUpO1xuICAgICAgLyogQ2hlY2sgYXR0cmlidXRlcyBuZXh0ICovXG4gICAgICBfc2FuaXRpemVBdHRyaWJ1dGVzKGN1cnJlbnROb2RlKTtcbiAgICAgIC8qIFNoYWRvdyBET00gZGV0ZWN0ZWQsIHNhbml0aXplIGl0ICovXG4gICAgICBpZiAoY3VycmVudE5vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgX3Nhbml0aXplU2hhZG93RE9NKGN1cnJlbnROb2RlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBJZiB3ZSBzYW5pdGl6ZWQgYGRpcnR5YCBpbi1wbGFjZSwgcmV0dXJuIGl0LiAqL1xuICAgIGlmIChJTl9QTEFDRSkge1xuICAgICAgcmV0dXJuIGRpcnR5O1xuICAgIH1cbiAgICAvKiBSZXR1cm4gc2FuaXRpemVkIHN0cmluZyBvciBET00gKi9cbiAgICBpZiAoUkVUVVJOX0RPTSkge1xuICAgICAgaWYgKFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgICAgcmV0dXJuTm9kZSA9IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQuY2FsbChib2R5Lm93bmVyRG9jdW1lbnQpO1xuICAgICAgICB3aGlsZSAoYm9keS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLWFwcGVuZFxuICAgICAgICAgIHJldHVybk5vZGUuYXBwZW5kQ2hpbGQoYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuTm9kZSA9IGJvZHk7XG4gICAgICB9XG4gICAgICBpZiAoQUxMT1dFRF9BVFRSLnNoYWRvd3Jvb3QgfHwgQUxMT1dFRF9BVFRSLnNoYWRvd3Jvb3Rtb2RlKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAgQWRvcHROb2RlKCkgaXMgbm90IHVzZWQgYmVjYXVzZSBpbnRlcm5hbCBzdGF0ZSBpcyBub3QgcmVzZXRcbiAgICAgICAgICAoZS5nLiB0aGUgcGFzdCBuYW1lcyBtYXAgb2YgYSBIVE1MRm9ybUVsZW1lbnQpLCB0aGlzIGlzIHNhZmVcbiAgICAgICAgICBpbiB0aGVvcnkgYnV0IHdlIHdvdWxkIHJhdGhlciBub3QgcmlzayBhbm90aGVyIGF0dGFjayB2ZWN0b3IuXG4gICAgICAgICAgVGhlIHN0YXRlIHRoYXQgaXMgY2xvbmVkIGJ5IGltcG9ydE5vZGUoKSBpcyBleHBsaWNpdGx5IGRlZmluZWRcbiAgICAgICAgICBieSB0aGUgc3BlY3MuXG4gICAgICAgICovXG4gICAgICAgIHJldHVybk5vZGUgPSBpbXBvcnROb2RlLmNhbGwob3JpZ2luYWxEb2N1bWVudCwgcmV0dXJuTm9kZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0dXJuTm9kZTtcbiAgICB9XG4gICAgbGV0IHNlcmlhbGl6ZWRIVE1MID0gV0hPTEVfRE9DVU1FTlQgPyBib2R5Lm91dGVySFRNTCA6IGJvZHkuaW5uZXJIVE1MO1xuICAgIC8qIFNlcmlhbGl6ZSBkb2N0eXBlIGlmIGFsbG93ZWQgKi9cbiAgICBpZiAoV0hPTEVfRE9DVU1FTlQgJiYgQUxMT1dFRF9UQUdTWychZG9jdHlwZSddICYmIGJvZHkub3duZXJEb2N1bWVudCAmJiBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZSAmJiBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZS5uYW1lICYmIHJlZ0V4cFRlc3QoRE9DVFlQRV9OQU1FLCBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZS5uYW1lKSkge1xuICAgICAgc2VyaWFsaXplZEhUTUwgPSAnPCFET0NUWVBFICcgKyBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZS5uYW1lICsgJz5cXG4nICsgc2VyaWFsaXplZEhUTUw7XG4gICAgfVxuICAgIC8qIFNhbml0aXplIGZpbmFsIHN0cmluZyB0ZW1wbGF0ZS1zYWZlICovXG4gICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgc2VyaWFsaXplZEhUTUwgPSBzdHJpbmdSZXBsYWNlKHNlcmlhbGl6ZWRIVE1MLCBleHByLCAnICcpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVzdGVkVHlwZXNQb2xpY3kgJiYgUkVUVVJOX1RSVVNURURfVFlQRSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKHNlcmlhbGl6ZWRIVE1MKSA6IHNlcmlhbGl6ZWRIVE1MO1xuICB9O1xuICBET01QdXJpZnkuc2V0Q29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIF9wYXJzZUNvbmZpZyhjZmcpO1xuICAgIFNFVF9DT05GSUcgPSB0cnVlO1xuICB9O1xuICBET01QdXJpZnkuY2xlYXJDb25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgQ09ORklHID0gbnVsbDtcbiAgICBTRVRfQ09ORklHID0gZmFsc2U7XG4gIH07XG4gIERPTVB1cmlmeS5pc1ZhbGlkQXR0cmlidXRlID0gZnVuY3Rpb24gKHRhZywgYXR0ciwgdmFsdWUpIHtcbiAgICAvKiBJbml0aWFsaXplIHNoYXJlZCBjb25maWcgdmFycyBpZiBuZWNlc3NhcnkuICovXG4gICAgaWYgKCFDT05GSUcpIHtcbiAgICAgIF9wYXJzZUNvbmZpZyh7fSk7XG4gICAgfVxuICAgIGNvbnN0IGxjVGFnID0gdHJhbnNmb3JtQ2FzZUZ1bmModGFnKTtcbiAgICBjb25zdCBsY05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhhdHRyKTtcbiAgICByZXR1cm4gX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpO1xuICB9O1xuICBET01QdXJpZnkuYWRkSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50LCBob29rRnVuY3Rpb24pIHtcbiAgICBpZiAodHlwZW9mIGhvb2tGdW5jdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhcnJheVB1c2goaG9va3NbZW50cnlQb2ludF0sIGhvb2tGdW5jdGlvbik7XG4gIH07XG4gIERPTVB1cmlmeS5yZW1vdmVIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQsIGhvb2tGdW5jdGlvbikge1xuICAgIGlmIChob29rRnVuY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5kZXggPSBhcnJheUxhc3RJbmRleE9mKGhvb2tzW2VudHJ5UG9pbnRdLCBob29rRnVuY3Rpb24pO1xuICAgICAgcmV0dXJuIGluZGV4ID09PSAtMSA/IHVuZGVmaW5lZCA6IGFycmF5U3BsaWNlKGhvb2tzW2VudHJ5UG9pbnRdLCBpbmRleCwgMSlbMF07XG4gICAgfVxuICAgIHJldHVybiBhcnJheVBvcChob29rc1tlbnRyeVBvaW50XSk7XG4gIH07XG4gIERPTVB1cmlmeS5yZW1vdmVIb29rcyA9IGZ1bmN0aW9uIChlbnRyeVBvaW50KSB7XG4gICAgaG9va3NbZW50cnlQb2ludF0gPSBbXTtcbiAgfTtcbiAgRE9NUHVyaWZ5LnJlbW92ZUFsbEhvb2tzID0gZnVuY3Rpb24gKCkge1xuICAgIGhvb2tzID0gX2NyZWF0ZUhvb2tzTWFwKCk7XG4gIH07XG4gIHJldHVybiBET01QdXJpZnk7XG59XG52YXIgcHVyaWZ5ID0gY3JlYXRlRE9NUHVyaWZ5KCk7XG5cbmV4cG9ydCB7IHB1cmlmeSBhcyBkZWZhdWx0IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wdXJpZnkuZXMubWpzLm1hcFxuIiwiLyoqXG4gKiBtYXJrZWQgdjE3LjAuMSAtIGEgbWFya2Rvd24gcGFyc2VyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgtMjAyNSwgTWFya2VkSlMuIChNSVQgTGljZW5zZSlcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDE4LCBDaHJpc3RvcGhlciBKZWZmcmV5LiAoTUlUIExpY2Vuc2UpXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbWFya2VkanMvbWFya2VkXG4gKi9cblxuLyoqXG4gKiBETyBOT1QgRURJVCBUSElTIEZJTEVcbiAqIFRoZSBjb2RlIGluIHRoaXMgZmlsZSBpcyBnZW5lcmF0ZWQgZnJvbSBmaWxlcyBpbiAuL3NyYy9cbiAqL1xuXG5mdW5jdGlvbiBMKCl7cmV0dXJue2FzeW5jOiExLGJyZWFrczohMSxleHRlbnNpb25zOm51bGwsZ2ZtOiEwLGhvb2tzOm51bGwscGVkYW50aWM6ITEscmVuZGVyZXI6bnVsbCxzaWxlbnQ6ITEsdG9rZW5pemVyOm51bGwsd2Fsa1Rva2VuczpudWxsfX12YXIgVD1MKCk7ZnVuY3Rpb24gWih1KXtUPXV9dmFyIEM9e2V4ZWM6KCk9Pm51bGx9O2Z1bmN0aW9uIGsodSxlPVwiXCIpe2xldCB0PXR5cGVvZiB1PT1cInN0cmluZ1wiP3U6dS5zb3VyY2Usbj17cmVwbGFjZToocixpKT0+e2xldCBzPXR5cGVvZiBpPT1cInN0cmluZ1wiP2k6aS5zb3VyY2U7cmV0dXJuIHM9cy5yZXBsYWNlKG0uY2FyZXQsXCIkMVwiKSx0PXQucmVwbGFjZShyLHMpLG59LGdldFJlZ2V4OigpPT5uZXcgUmVnRXhwKHQsZSl9O3JldHVybiBufXZhciBtZT0oKCk9Pnt0cnl7cmV0dXJuISFuZXcgUmVnRXhwKFwiKD88PTEpKD88ITEpXCIpfWNhdGNoe3JldHVybiExfX0pKCksbT17Y29kZVJlbW92ZUluZGVudDovXig/OiB7MSw0fXwgezAsM31cXHQpL2dtLG91dHB1dExpbmtSZXBsYWNlOi9cXFxcKFtcXFtcXF1dKS9nLGluZGVudENvZGVDb21wZW5zYXRpb246L14oXFxzKykoPzpgYGApLyxiZWdpbm5pbmdTcGFjZTovXlxccysvLGVuZGluZ0hhc2g6LyMkLyxzdGFydGluZ1NwYWNlQ2hhcjovXiAvLGVuZGluZ1NwYWNlQ2hhcjovICQvLG5vblNwYWNlQ2hhcjovW14gXS8sbmV3TGluZUNoYXJHbG9iYWw6L1xcbi9nLHRhYkNoYXJHbG9iYWw6L1xcdC9nLG11bHRpcGxlU3BhY2VHbG9iYWw6L1xccysvZyxibGFua0xpbmU6L15bIFxcdF0qJC8sZG91YmxlQmxhbmtMaW5lOi9cXG5bIFxcdF0qXFxuWyBcXHRdKiQvLGJsb2NrcXVvdGVTdGFydDovXiB7MCwzfT4vLGJsb2NrcXVvdGVTZXRleHRSZXBsYWNlOi9cXG4gezAsM30oKD86PSt8LSspICopKD89XFxufCQpL2csYmxvY2txdW90ZVNldGV4dFJlcGxhY2UyOi9eIHswLDN9PlsgXFx0XT8vZ20sbGlzdFJlcGxhY2VUYWJzOi9eXFx0Ky8sbGlzdFJlcGxhY2VOZXN0aW5nOi9eIHsxLDR9KD89KCB7NH0pKlteIF0pL2csbGlzdElzVGFzazovXlxcW1sgeFhdXFxdICtcXFMvLGxpc3RSZXBsYWNlVGFzazovXlxcW1sgeFhdXFxdICsvLGxpc3RUYXNrQ2hlY2tib3g6L1xcW1sgeFhdXFxdLyxhbnlMaW5lOi9cXG4uKlxcbi8saHJlZkJyYWNrZXRzOi9ePCguKik+JC8sdGFibGVEZWxpbWl0ZXI6L1s6fF0vLHRhYmxlQWxpZ25DaGFyczovXlxcfHxcXHwgKiQvZyx0YWJsZVJvd0JsYW5rTGluZTovXFxuWyBcXHRdKiQvLHRhYmxlQWxpZ25SaWdodDovXiAqLSs6ICokLyx0YWJsZUFsaWduQ2VudGVyOi9eICo6LSs6ICokLyx0YWJsZUFsaWduTGVmdDovXiAqOi0rICokLyxzdGFydEFUYWc6L148YSAvaSxlbmRBVGFnOi9ePFxcL2E+L2ksc3RhcnRQcmVTY3JpcHRUYWc6L148KHByZXxjb2RlfGtiZHxzY3JpcHQpKFxcc3w+KS9pLGVuZFByZVNjcmlwdFRhZzovXjxcXC8ocHJlfGNvZGV8a2JkfHNjcmlwdCkoXFxzfD4pL2ksc3RhcnRBbmdsZUJyYWNrZXQ6L148LyxlbmRBbmdsZUJyYWNrZXQ6Lz4kLyxwZWRhbnRpY0hyZWZUaXRsZTovXihbXidcIl0qW15cXHNdKVxccysoWydcIl0pKC4qKVxcMi8sdW5pY29kZUFscGhhTnVtZXJpYzovW1xccHtMfVxccHtOfV0vdSxlc2NhcGVUZXN0Oi9bJjw+XCInXS8sZXNjYXBlUmVwbGFjZTovWyY8PlwiJ10vZyxlc2NhcGVUZXN0Tm9FbmNvZGU6L1s8PlwiJ118Jig/ISgjXFxkezEsN318I1tYeF1bYS1mQS1GMC05XXsxLDZ9fFxcdyspOykvLGVzY2FwZVJlcGxhY2VOb0VuY29kZTovWzw+XCInXXwmKD8hKCNcXGR7MSw3fXwjW1h4XVthLWZBLUYwLTldezEsNn18XFx3Kyk7KS9nLHVuZXNjYXBlVGVzdDovJigjKD86XFxkKyl8KD86I3hbMC05QS1GYS1mXSspfCg/OlxcdyspKTs/L2lnLGNhcmV0Oi8oXnxbXlxcW10pXFxeL2cscGVyY2VudERlY29kZTovJTI1L2csZmluZFBpcGU6L1xcfC9nLHNwbGl0UGlwZTovIFxcfC8sc2xhc2hQaXBlOi9cXFxcXFx8L2csY2FycmlhZ2VSZXR1cm46L1xcclxcbnxcXHIvZyxzcGFjZUxpbmU6L14gKyQvZ20sbm90U3BhY2VTdGFydDovXlxcUyovLGVuZGluZ05ld2xpbmU6L1xcbiQvLGxpc3RJdGVtUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiggezAsM30ke3V9KSgoPzpbXHQgXVteXFxcXG5dKik/KD86XFxcXG58JCkpYCksbmV4dEJ1bGxldFJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSg/OlsqKy1dfFxcXFxkezEsOX1bLildKSgoPzpbIFx0XVteXFxcXG5dKik/KD86XFxcXG58JCkpYCksaHJSZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0oKD86LSAqKXszLH18KD86XyAqKXszLH18KD86XFxcXCogKil7Myx9KSg/OlxcXFxuK3wkKWApLGZlbmNlc0JlZ2luUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19KD86XFxgXFxgXFxgfH5+filgKSxoZWFkaW5nQmVnaW5SZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0jYCksaHRtbEJlZ2luUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19PCg/OlthLXpdLio+fCEtLSlgLFwiaVwiKX0seGU9L14oPzpbIFxcdF0qKD86XFxufCQpKSsvLGJlPS9eKCg/OiB7NH18IHswLDN9XFx0KVteXFxuXSsoPzpcXG4oPzpbIFxcdF0qKD86XFxufCQpKSopPykrLyxSZT0vXiB7MCwzfShgezMsfSg/PVteYFxcbl0qKD86XFxufCQpKXx+ezMsfSkoW15cXG5dKikoPzpcXG58JCkoPzp8KFtcXHNcXFNdKj8pKD86XFxufCQpKSg/OiB7MCwzfVxcMVt+YF0qICooPz1cXG58JCl8JCkvLEk9L14gezAsM30oKD86LVtcXHQgXSopezMsfXwoPzpfWyBcXHRdKil7Myx9fCg/OlxcKlsgXFx0XSopezMsfSkoPzpcXG4rfCQpLyxUZT0vXiB7MCwzfSgjezEsNn0pKD89XFxzfCQpKC4qKSg/Olxcbit8JCkvLE49Lyg/OlsqKy1dfFxcZHsxLDl9Wy4pXSkvLHJlPS9eKD8hYnVsbCB8YmxvY2tDb2RlfGZlbmNlc3xibG9ja3F1b3RlfGhlYWRpbmd8aHRtbHx0YWJsZSkoKD86LnxcXG4oPyFcXHMqP1xcbnxidWxsIHxibG9ja0NvZGV8ZmVuY2VzfGJsb2NrcXVvdGV8aGVhZGluZ3xodG1sfHRhYmxlKSkrPylcXG4gezAsM30oPSt8LSspICooPzpcXG4rfCQpLyxzZT1rKHJlKS5yZXBsYWNlKC9idWxsL2csTikucmVwbGFjZSgvYmxvY2tDb2RlL2csLyg/OiB7NH18IHswLDN9XFx0KS8pLnJlcGxhY2UoL2ZlbmNlcy9nLC8gezAsM30oPzpgezMsfXx+ezMsfSkvKS5yZXBsYWNlKC9ibG9ja3F1b3RlL2csLyB7MCwzfT4vKS5yZXBsYWNlKC9oZWFkaW5nL2csLyB7MCwzfSN7MSw2fS8pLnJlcGxhY2UoL2h0bWwvZywvIHswLDN9PFteXFxuPl0rPlxcbi8pLnJlcGxhY2UoL1xcfHRhYmxlL2csXCJcIikuZ2V0UmVnZXgoKSxPZT1rKHJlKS5yZXBsYWNlKC9idWxsL2csTikucmVwbGFjZSgvYmxvY2tDb2RlL2csLyg/OiB7NH18IHswLDN9XFx0KS8pLnJlcGxhY2UoL2ZlbmNlcy9nLC8gezAsM30oPzpgezMsfXx+ezMsfSkvKS5yZXBsYWNlKC9ibG9ja3F1b3RlL2csLyB7MCwzfT4vKS5yZXBsYWNlKC9oZWFkaW5nL2csLyB7MCwzfSN7MSw2fS8pLnJlcGxhY2UoL2h0bWwvZywvIHswLDN9PFteXFxuPl0rPlxcbi8pLnJlcGxhY2UoL3RhYmxlL2csLyB7MCwzfVxcfD8oPzpbOlxcLSBdKlxcfCkrW1xcOlxcLSBdKlxcbi8pLmdldFJlZ2V4KCksUT0vXihbXlxcbl0rKD86XFxuKD8haHJ8aGVhZGluZ3xsaGVhZGluZ3xibG9ja3F1b3RlfGZlbmNlc3xsaXN0fGh0bWx8dGFibGV8ICtcXG4pW15cXG5dKykqKS8sd2U9L15bXlxcbl0rLyxGPS8oPyFcXHMqXFxdKSg/OlxcXFxbXFxzXFxTXXxbXlxcW1xcXVxcXFxdKSsvLHllPWsoL14gezAsM31cXFsobGFiZWwpXFxdOiAqKD86XFxuWyBcXHRdKik/KFtePFxcc11bXlxcc10qfDwuKj8+KSg/Oig/OiArKD86XFxuWyBcXHRdKik/fCAqXFxuWyBcXHRdKikodGl0bGUpKT8gKig/Olxcbit8JCkvKS5yZXBsYWNlKFwibGFiZWxcIixGKS5yZXBsYWNlKFwidGl0bGVcIiwvKD86XCIoPzpcXFxcXCI/fFteXCJcXFxcXSkqXCJ8J1teJ1xcbl0qKD86XFxuW14nXFxuXSspKlxcbj8nfFxcKFteKCldKlxcKSkvKS5nZXRSZWdleCgpLFBlPWsoL14oIHswLDN9YnVsbCkoWyBcXHRdW15cXG5dKz8pPyg/OlxcbnwkKS8pLnJlcGxhY2UoL2J1bGwvZyxOKS5nZXRSZWdleCgpLHY9XCJhZGRyZXNzfGFydGljbGV8YXNpZGV8YmFzZXxiYXNlZm9udHxibG9ja3F1b3RlfGJvZHl8Y2FwdGlvbnxjZW50ZXJ8Y29sfGNvbGdyb3VwfGRkfGRldGFpbHN8ZGlhbG9nfGRpcnxkaXZ8ZGx8ZHR8ZmllbGRzZXR8ZmlnY2FwdGlvbnxmaWd1cmV8Zm9vdGVyfGZvcm18ZnJhbWV8ZnJhbWVzZXR8aFsxLTZdfGhlYWR8aGVhZGVyfGhyfGh0bWx8aWZyYW1lfGxlZ2VuZHxsaXxsaW5rfG1haW58bWVudXxtZW51aXRlbXxtZXRhfG5hdnxub2ZyYW1lc3xvbHxvcHRncm91cHxvcHRpb258cHxwYXJhbXxzZWFyY2h8c2VjdGlvbnxzdW1tYXJ5fHRhYmxlfHRib2R5fHRkfHRmb290fHRofHRoZWFkfHRpdGxlfHRyfHRyYWNrfHVsXCIsaj0vPCEtLSg/Oi0/PnxbXFxzXFxTXSo/KD86LS0+fCQpKS8sU2U9ayhcIl4gezAsM30oPzo8KHNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpW1xcXFxzPl1bXFxcXHNcXFxcU10qPyg/OjwvXFxcXDE+W15cXFxcbl0qXFxcXG4rfCQpfGNvbW1lbnRbXlxcXFxuXSooXFxcXG4rfCQpfDxcXFxcP1tcXFxcc1xcXFxTXSo/KD86XFxcXD8+XFxcXG4qfCQpfDwhW0EtWl1bXFxcXHNcXFxcU10qPyg/Oj5cXFxcbip8JCl8PCFcXFxcW0NEQVRBXFxcXFtbXFxcXHNcXFxcU10qPyg/OlxcXFxdXFxcXF0+XFxcXG4qfCQpfDwvPyh0YWcpKD86ICt8XFxcXG58Lz8+KVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG5bIFx0XSopK1xcXFxufCQpfDwoPyFzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKShbYS16XVtcXFxcdy1dKikoPzphdHRyaWJ1dGUpKj8gKi8/Pig/PVsgXFxcXHRdKig/OlxcXFxufCQpKVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG5bIFx0XSopK1xcXFxufCQpfDwvKD8hc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSlbYS16XVtcXFxcdy1dKlxcXFxzKj4oPz1bIFxcXFx0XSooPzpcXFxcbnwkKSlbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuWyBcdF0qKStcXFxcbnwkKSlcIixcImlcIikucmVwbGFjZShcImNvbW1lbnRcIixqKS5yZXBsYWNlKFwidGFnXCIsdikucmVwbGFjZShcImF0dHJpYnV0ZVwiLC8gK1thLXpBLVo6X11bXFx3LjotXSooPzogKj0gKlwiW15cIlxcbl0qXCJ8ICo9IConW14nXFxuXSonfCAqPSAqW15cXHNcIic9PD5gXSspPy8pLmdldFJlZ2V4KCksaWU9ayhRKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLFwiIHswLDN9I3sxLDZ9KD86XFxcXHN8JClcIikucmVwbGFjZShcInxsaGVhZGluZ1wiLFwiXCIpLnJlcGxhY2UoXCJ8dGFibGVcIixcIlwiKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwiZmVuY2VzXCIsXCIgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG5cIikucmVwbGFjZShcImxpc3RcIixcIiB7MCwzfSg/OlsqKy1dfDFbLildKSBcIikucmVwbGFjZShcImh0bWxcIixcIjwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSlcIikucmVwbGFjZShcInRhZ1wiLHYpLmdldFJlZ2V4KCksJGU9aygvXiggezAsM30+ID8ocGFyYWdyYXBofFteXFxuXSopKD86XFxufCQpKSsvKS5yZXBsYWNlKFwicGFyYWdyYXBoXCIsaWUpLmdldFJlZ2V4KCksVT17YmxvY2txdW90ZTokZSxjb2RlOmJlLGRlZjp5ZSxmZW5jZXM6UmUsaGVhZGluZzpUZSxocjpJLGh0bWw6U2UsbGhlYWRpbmc6c2UsbGlzdDpQZSxuZXdsaW5lOnhlLHBhcmFncmFwaDppZSx0YWJsZTpDLHRleHQ6d2V9LHRlPWsoXCJeICooW15cXFxcbiBdLiopXFxcXG4gezAsM30oKD86XFxcXHwgKik/Oj8tKzo/ICooPzpcXFxcfCAqOj8tKzo/ICopKig/OlxcXFx8ICopPykoPzpcXFxcbigoPzooPyEgKlxcXFxufGhyfGhlYWRpbmd8YmxvY2txdW90ZXxjb2RlfGZlbmNlc3xsaXN0fGh0bWwpLiooPzpcXFxcbnwkKSkqKVxcXFxuKnwkKVwiKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLFwiIHswLDN9I3sxLDZ9KD86XFxcXHN8JClcIikucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcImNvZGVcIixcIig/OiB7NH18IHswLDN9XHQpW15cXFxcbl1cIikucmVwbGFjZShcImZlbmNlc1wiLFwiIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuXCIpLnJlcGxhY2UoXCJsaXN0XCIsXCIgezAsM30oPzpbKistXXwxWy4pXSkgXCIpLnJlcGxhY2UoXCJodG1sXCIsXCI8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pXCIpLnJlcGxhY2UoXCJ0YWdcIix2KS5nZXRSZWdleCgpLF9lPXsuLi5VLGxoZWFkaW5nOk9lLHRhYmxlOnRlLHBhcmFncmFwaDprKFEpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsXCIgezAsM30jezEsNn0oPzpcXFxcc3wkKVwiKS5yZXBsYWNlKFwifGxoZWFkaW5nXCIsXCJcIikucmVwbGFjZShcInRhYmxlXCIsdGUpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJmZW5jZXNcIixcIiB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcblwiKS5yZXBsYWNlKFwibGlzdFwiLFwiIHswLDN9KD86WyorLV18MVsuKV0pIFwiKS5yZXBsYWNlKFwiaHRtbFwiLFwiPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKVwiKS5yZXBsYWNlKFwidGFnXCIsdikuZ2V0UmVnZXgoKX0sTGU9ey4uLlUsaHRtbDprKGBeICooPzpjb21tZW50ICooPzpcXFxcbnxcXFxccyokKXw8KHRhZylbXFxcXHNcXFxcU10rPzwvXFxcXDE+ICooPzpcXFxcbnsyLH18XFxcXHMqJCl8PHRhZyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xcXFxcc1teJ1wiLz5cXFxcc10qKSo/Lz8+ICooPzpcXFxcbnsyLH18XFxcXHMqJCkpYCkucmVwbGFjZShcImNvbW1lbnRcIixqKS5yZXBsYWNlKC90YWcvZyxcIig/ISg/OmF8ZW18c3Ryb25nfHNtYWxsfHN8Y2l0ZXxxfGRmbnxhYmJyfGRhdGF8dGltZXxjb2RlfHZhcnxzYW1wfGtiZHxzdWJ8c3VwfGl8Ynx1fG1hcmt8cnVieXxydHxycHxiZGl8YmRvfHNwYW58YnJ8d2JyfGluc3xkZWx8aW1nKVxcXFxiKVxcXFx3Kyg/ITp8W15cXFxcd1xcXFxzQF0qQClcXFxcYlwiKS5nZXRSZWdleCgpLGRlZjovXiAqXFxbKFteXFxdXSspXFxdOiAqPD8oW15cXHM+XSspPj8oPzogKyhbXCIoXVteXFxuXStbXCIpXSkpPyAqKD86XFxuK3wkKS8saGVhZGluZzovXigjezEsNn0pKC4qKSg/Olxcbit8JCkvLGZlbmNlczpDLGxoZWFkaW5nOi9eKC4rPylcXG4gezAsM30oPSt8LSspICooPzpcXG4rfCQpLyxwYXJhZ3JhcGg6ayhRKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLGAgKiN7MSw2fSAqW15cbl1gKS5yZXBsYWNlKFwibGhlYWRpbmdcIixzZSkucmVwbGFjZShcInx0YWJsZVwiLFwiXCIpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJ8ZmVuY2VzXCIsXCJcIikucmVwbGFjZShcInxsaXN0XCIsXCJcIikucmVwbGFjZShcInxodG1sXCIsXCJcIikucmVwbGFjZShcInx0YWdcIixcIlwiKS5nZXRSZWdleCgpfSxNZT0vXlxcXFwoWyFcIiMkJSYnKCkqKyxcXC0uLzo7PD0+P0BcXFtcXF1cXFxcXl9ge3x9fl0pLyx6ZT0vXihgKykoW15gXXxbXmBdW1xcc1xcU10qP1teYF0pXFwxKD8hYCkvLG9lPS9eKCB7Mix9fFxcXFwpXFxuKD8hXFxzKiQpLyxBZT0vXihgK3xbXmBdKSg/Oig/PSB7Mix9XFxuKXxbXFxzXFxTXSo/KD86KD89W1xcXFw8IVxcW2AqX118XFxiX3wkKXxbXiBdKD89IHsyLH1cXG4pKSkvLEQ9L1tcXHB7UH1cXHB7U31dL3UsSz0vW1xcc1xccHtQfVxccHtTfV0vdSxhZT0vW15cXHNcXHB7UH1cXHB7U31dL3UsQ2U9aygvXigoPyFbKl9dKXB1bmN0U3BhY2UpLyxcInVcIikucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEspLmdldFJlZ2V4KCksbGU9Lyg/IX4pW1xccHtQfVxccHtTfV0vdSxJZT0vKD8hfilbXFxzXFxwe1B9XFxwe1N9XS91LEVlPS8oPzpbXlxcc1xccHtQfVxccHtTfV18fikvdSxCZT1rKC9saW5rfHByZWNvZGUtY29kZXxodG1sLyxcImdcIikucmVwbGFjZShcImxpbmtcIiwvXFxbKD86W15cXFtcXF1gXXwoPzxhPmArKVteYF0rXFxrPGE+KD8hYCkpKj9cXF1cXCgoPzpcXFxcW1xcc1xcU118W15cXFxcXFwoXFwpXXxcXCgoPzpcXFxcW1xcc1xcU118W15cXFxcXFwoXFwpXSkqXFwpKSpcXCkvKS5yZXBsYWNlKFwicHJlY29kZS1cIixtZT9cIig/PCFgKSgpXCI6XCIoXl58W15gXSlcIikucmVwbGFjZShcImNvZGVcIiwvKD88Yj5gKylbXmBdK1xcazxiPig/IWApLykucmVwbGFjZShcImh0bWxcIiwvPCg/ISApW148Pl0qPz4vKS5nZXRSZWdleCgpLHVlPS9eKD86XFwqKyg/OigoPyFcXCopcHVuY3QpfFteXFxzKl0pKXxeXysoPzooKD8hXylwdW5jdCl8KFteXFxzX10pKS8scWU9ayh1ZSxcInVcIikucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLHZlPWsodWUsXCJ1XCIpLnJlcGxhY2UoL3B1bmN0L2csbGUpLmdldFJlZ2V4KCkscGU9XCJeW15fKl0qP19fW15fKl0qP1xcXFwqW15fKl0qPyg/PV9fKXxbXipdKyg/PVteKl0pfCg/IVxcXFwqKXB1bmN0KFxcXFwqKykoPz1bXFxcXHNdfCQpfG5vdFB1bmN0U3BhY2UoXFxcXCorKSg/IVxcXFwqKSg/PXB1bmN0U3BhY2V8JCl8KD8hXFxcXCopcHVuY3RTcGFjZShcXFxcKispKD89bm90UHVuY3RTcGFjZSl8W1xcXFxzXShcXFxcKispKD8hXFxcXCopKD89cHVuY3QpfCg/IVxcXFwqKXB1bmN0KFxcXFwqKykoPyFcXFxcKikoPz1wdW5jdCl8bm90UHVuY3RTcGFjZShcXFxcKispKD89bm90UHVuY3RTcGFjZSlcIixEZT1rKHBlLFwiZ3VcIikucmVwbGFjZSgvbm90UHVuY3RTcGFjZS9nLGFlKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSykucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLEhlPWsocGUsXCJndVwiKS5yZXBsYWNlKC9ub3RQdW5jdFNwYWNlL2csRWUpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxJZSkucmVwbGFjZSgvcHVuY3QvZyxsZSkuZ2V0UmVnZXgoKSxaZT1rKFwiXlteXypdKj9cXFxcKlxcXFwqW15fKl0qP19bXl8qXSo/KD89XFxcXCpcXFxcKil8W15fXSsoPz1bXl9dKXwoPyFfKXB1bmN0KF8rKSg/PVtcXFxcc118JCl8bm90UHVuY3RTcGFjZShfKykoPyFfKSg/PXB1bmN0U3BhY2V8JCl8KD8hXylwdW5jdFNwYWNlKF8rKSg/PW5vdFB1bmN0U3BhY2UpfFtcXFxcc10oXyspKD8hXykoPz1wdW5jdCl8KD8hXylwdW5jdChfKykoPyFfKSg/PXB1bmN0KVwiLFwiZ3VcIikucmVwbGFjZSgvbm90UHVuY3RTcGFjZS9nLGFlKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSykucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLEdlPWsoL1xcXFwocHVuY3QpLyxcImd1XCIpLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSxOZT1rKC9ePChzY2hlbWU6W15cXHNcXHgwMC1cXHgxZjw+XSp8ZW1haWwpPi8pLnJlcGxhY2UoXCJzY2hlbWVcIiwvW2EtekEtWl1bYS16QS1aMC05Ky4tXXsxLDMxfS8pLnJlcGxhY2UoXCJlbWFpbFwiLC9bYS16QS1aMC05LiEjJCUmJyorLz0/Xl9ge3x9fi1dKyhAKVthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykrKD8hWy1fXSkvKS5nZXRSZWdleCgpLFFlPWsoaikucmVwbGFjZShcIig/Oi0tPnwkKVwiLFwiLS0+XCIpLmdldFJlZ2V4KCksRmU9ayhcIl5jb21tZW50fF48L1thLXpBLVpdW1xcXFx3Oi1dKlxcXFxzKj58XjxbYS16QS1aXVtcXFxcdy1dKig/OmF0dHJpYnV0ZSkqP1xcXFxzKi8/PnxePFxcXFw/W1xcXFxzXFxcXFNdKj9cXFxcPz58XjwhW2EtekEtWl0rXFxcXHNbXFxcXHNcXFxcU10qPz58XjwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj9cXFxcXVxcXFxdPlwiKS5yZXBsYWNlKFwiY29tbWVudFwiLFFlKS5yZXBsYWNlKFwiYXR0cmlidXRlXCIsL1xccytbYS16QS1aOl9dW1xcdy46LV0qKD86XFxzKj1cXHMqXCJbXlwiXSpcInxcXHMqPVxccyonW14nXSonfFxccyo9XFxzKlteXFxzXCInPTw+YF0rKT8vKS5nZXRSZWdleCgpLHE9Lyg/OlxcWyg/OlxcXFxbXFxzXFxTXXxbXlxcW1xcXVxcXFxdKSpcXF18XFxcXFtcXHNcXFNdfGArW15gXSo/YCsoPyFgKXxbXlxcW1xcXVxcXFxgXSkqPy8samU9aygvXiE/XFxbKGxhYmVsKVxcXVxcKFxccyooaHJlZikoPzooPzpbIFxcdF0qKD86XFxuWyBcXHRdKik/KSh0aXRsZSkpP1xccypcXCkvKS5yZXBsYWNlKFwibGFiZWxcIixxKS5yZXBsYWNlKFwiaHJlZlwiLC88KD86XFxcXC58W15cXG48PlxcXFxdKSs+fFteIFxcdFxcblxceDAwLVxceDFmXSovKS5yZXBsYWNlKFwidGl0bGVcIiwvXCIoPzpcXFxcXCI/fFteXCJcXFxcXSkqXCJ8Jyg/OlxcXFwnP3xbXidcXFxcXSkqJ3xcXCgoPzpcXFxcXFwpP3xbXilcXFxcXSkqXFwpLykuZ2V0UmVnZXgoKSxjZT1rKC9eIT9cXFsobGFiZWwpXFxdXFxbKHJlZilcXF0vKS5yZXBsYWNlKFwibGFiZWxcIixxKS5yZXBsYWNlKFwicmVmXCIsRikuZ2V0UmVnZXgoKSxoZT1rKC9eIT9cXFsocmVmKVxcXSg/OlxcW1xcXSk/LykucmVwbGFjZShcInJlZlwiLEYpLmdldFJlZ2V4KCksVWU9ayhcInJlZmxpbmt8bm9saW5rKD8hXFxcXCgpXCIsXCJnXCIpLnJlcGxhY2UoXCJyZWZsaW5rXCIsY2UpLnJlcGxhY2UoXCJub2xpbmtcIixoZSkuZ2V0UmVnZXgoKSxuZT0vW2hIXVt0VF1bdFRdW3BQXVtzU10/fFtmRl1bdFRdW3BQXS8sVz17X2JhY2twZWRhbDpDLGFueVB1bmN0dWF0aW9uOkdlLGF1dG9saW5rOk5lLGJsb2NrU2tpcDpCZSxicjpvZSxjb2RlOnplLGRlbDpDLGVtU3Ryb25nTERlbGltOnFlLGVtU3Ryb25nUkRlbGltQXN0OkRlLGVtU3Ryb25nUkRlbGltVW5kOlplLGVzY2FwZTpNZSxsaW5rOmplLG5vbGluazpoZSxwdW5jdHVhdGlvbjpDZSxyZWZsaW5rOmNlLHJlZmxpbmtTZWFyY2g6VWUsdGFnOkZlLHRleHQ6QWUsdXJsOkN9LEtlPXsuLi5XLGxpbms6aygvXiE/XFxbKGxhYmVsKVxcXVxcKCguKj8pXFwpLykucmVwbGFjZShcImxhYmVsXCIscSkuZ2V0UmVnZXgoKSxyZWZsaW5rOmsoL14hP1xcWyhsYWJlbClcXF1cXHMqXFxbKFteXFxdXSopXFxdLykucmVwbGFjZShcImxhYmVsXCIscSkuZ2V0UmVnZXgoKX0sRz17Li4uVyxlbVN0cm9uZ1JEZWxpbUFzdDpIZSxlbVN0cm9uZ0xEZWxpbTp2ZSx1cmw6aygvXigoPzpwcm90b2NvbCk6XFwvXFwvfHd3d1xcLikoPzpbYS16QS1aMC05XFwtXStcXC4/KStbXlxcczxdKnxeZW1haWwvKS5yZXBsYWNlKFwicHJvdG9jb2xcIixuZSkucmVwbGFjZShcImVtYWlsXCIsL1tBLVphLXowLTkuXystXSsoQClbYS16QS1aMC05LV9dKyg/OlxcLlthLXpBLVowLTktX10qW2EtekEtWjAtOV0pKyg/IVstX10pLykuZ2V0UmVnZXgoKSxfYmFja3BlZGFsOi8oPzpbXj8hLiw6OypfJ1wifigpJl0rfFxcKFteKV0qXFwpfCYoPyFbYS16QS1aMC05XSs7JCl8Wz8hLiw6OypfJ1wifildKyg/ISQpKSsvLGRlbDovXih+fj8pKD89W15cXHN+XSkoKD86XFxcXFtcXHNcXFNdfFteXFxcXF0pKj8oPzpcXFxcW1xcc1xcU118W15cXHN+XFxcXF0pKVxcMSg/PVtefl18JCkvLHRleHQ6aygvXihbYH5dK3xbXmB+XSkoPzooPz0gezIsfVxcbil8KD89W2EtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXStAKXxbXFxzXFxTXSo/KD86KD89W1xcXFw8IVxcW2Aqfl9dfFxcYl98cHJvdG9jb2w6XFwvXFwvfHd3d1xcLnwkKXxbXiBdKD89IHsyLH1cXG4pfFteYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dKD89W2EtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXStAKSkpLykucmVwbGFjZShcInByb3RvY29sXCIsbmUpLmdldFJlZ2V4KCl9LFdlPXsuLi5HLGJyOmsob2UpLnJlcGxhY2UoXCJ7Mix9XCIsXCIqXCIpLmdldFJlZ2V4KCksdGV4dDprKEcudGV4dCkucmVwbGFjZShcIlxcXFxiX1wiLFwiXFxcXGJffCB7Mix9XFxcXG5cIikucmVwbGFjZSgvXFx7MixcXH0vZyxcIipcIikuZ2V0UmVnZXgoKX0sRT17bm9ybWFsOlUsZ2ZtOl9lLHBlZGFudGljOkxlfSxNPXtub3JtYWw6VyxnZm06RyxicmVha3M6V2UscGVkYW50aWM6S2V9O3ZhciBYZT17XCImXCI6XCImYW1wO1wiLFwiPFwiOlwiJmx0O1wiLFwiPlwiOlwiJmd0O1wiLCdcIic6XCImcXVvdDtcIixcIidcIjpcIiYjMzk7XCJ9LGtlPXU9PlhlW3VdO2Z1bmN0aW9uIHcodSxlKXtpZihlKXtpZihtLmVzY2FwZVRlc3QudGVzdCh1KSlyZXR1cm4gdS5yZXBsYWNlKG0uZXNjYXBlUmVwbGFjZSxrZSl9ZWxzZSBpZihtLmVzY2FwZVRlc3ROb0VuY29kZS50ZXN0KHUpKXJldHVybiB1LnJlcGxhY2UobS5lc2NhcGVSZXBsYWNlTm9FbmNvZGUsa2UpO3JldHVybiB1fWZ1bmN0aW9uIFgodSl7dHJ5e3U9ZW5jb2RlVVJJKHUpLnJlcGxhY2UobS5wZXJjZW50RGVjb2RlLFwiJVwiKX1jYXRjaHtyZXR1cm4gbnVsbH1yZXR1cm4gdX1mdW5jdGlvbiBKKHUsZSl7bGV0IHQ9dS5yZXBsYWNlKG0uZmluZFBpcGUsKGkscyxhKT0+e2xldCBvPSExLGw9cztmb3IoOy0tbD49MCYmYVtsXT09PVwiXFxcXFwiOylvPSFvO3JldHVybiBvP1wifFwiOlwiIHxcIn0pLG49dC5zcGxpdChtLnNwbGl0UGlwZSkscj0wO2lmKG5bMF0udHJpbSgpfHxuLnNoaWZ0KCksbi5sZW5ndGg+MCYmIW4uYXQoLTEpPy50cmltKCkmJm4ucG9wKCksZSlpZihuLmxlbmd0aD5lKW4uc3BsaWNlKGUpO2Vsc2UgZm9yKDtuLmxlbmd0aDxlOyluLnB1c2goXCJcIik7Zm9yKDtyPG4ubGVuZ3RoO3IrKyluW3JdPW5bcl0udHJpbSgpLnJlcGxhY2UobS5zbGFzaFBpcGUsXCJ8XCIpO3JldHVybiBufWZ1bmN0aW9uIHoodSxlLHQpe2xldCBuPXUubGVuZ3RoO2lmKG49PT0wKXJldHVyblwiXCI7bGV0IHI9MDtmb3IoO3I8bjspe2xldCBpPXUuY2hhckF0KG4tci0xKTtpZihpPT09ZSYmIXQpcisrO2Vsc2UgaWYoaSE9PWUmJnQpcisrO2Vsc2UgYnJlYWt9cmV0dXJuIHUuc2xpY2UoMCxuLXIpfWZ1bmN0aW9uIGRlKHUsZSl7aWYodS5pbmRleE9mKGVbMV0pPT09LTEpcmV0dXJuLTE7bGV0IHQ9MDtmb3IobGV0IG49MDtuPHUubGVuZ3RoO24rKylpZih1W25dPT09XCJcXFxcXCIpbisrO2Vsc2UgaWYodVtuXT09PWVbMF0pdCsrO2Vsc2UgaWYodVtuXT09PWVbMV0mJih0LS0sdDwwKSlyZXR1cm4gbjtyZXR1cm4gdD4wPy0yOi0xfWZ1bmN0aW9uIGdlKHUsZSx0LG4scil7bGV0IGk9ZS5ocmVmLHM9ZS50aXRsZXx8bnVsbCxhPXVbMV0ucmVwbGFjZShyLm90aGVyLm91dHB1dExpbmtSZXBsYWNlLFwiJDFcIik7bi5zdGF0ZS5pbkxpbms9ITA7bGV0IG89e3R5cGU6dVswXS5jaGFyQXQoMCk9PT1cIiFcIj9cImltYWdlXCI6XCJsaW5rXCIscmF3OnQsaHJlZjppLHRpdGxlOnMsdGV4dDphLHRva2VuczpuLmlubGluZVRva2VucyhhKX07cmV0dXJuIG4uc3RhdGUuaW5MaW5rPSExLG99ZnVuY3Rpb24gSmUodSxlLHQpe2xldCBuPXUubWF0Y2godC5vdGhlci5pbmRlbnRDb2RlQ29tcGVuc2F0aW9uKTtpZihuPT09bnVsbClyZXR1cm4gZTtsZXQgcj1uWzFdO3JldHVybiBlLnNwbGl0KGBcbmApLm1hcChpPT57bGV0IHM9aS5tYXRjaCh0Lm90aGVyLmJlZ2lubmluZ1NwYWNlKTtpZihzPT09bnVsbClyZXR1cm4gaTtsZXRbYV09cztyZXR1cm4gYS5sZW5ndGg+PXIubGVuZ3RoP2kuc2xpY2Uoci5sZW5ndGgpOml9KS5qb2luKGBcbmApfXZhciB5PWNsYXNze29wdGlvbnM7cnVsZXM7bGV4ZXI7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFR9c3BhY2UoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5uZXdsaW5lLmV4ZWMoZSk7aWYodCYmdFswXS5sZW5ndGg+MClyZXR1cm57dHlwZTpcInNwYWNlXCIscmF3OnRbMF19fWNvZGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5jb2RlLmV4ZWMoZSk7aWYodCl7bGV0IG49dFswXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuY29kZVJlbW92ZUluZGVudCxcIlwiKTtyZXR1cm57dHlwZTpcImNvZGVcIixyYXc6dFswXSxjb2RlQmxvY2tTdHlsZTpcImluZGVudGVkXCIsdGV4dDp0aGlzLm9wdGlvbnMucGVkYW50aWM/bjp6KG4sYFxuYCl9fX1mZW5jZXMoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5mZW5jZXMuZXhlYyhlKTtpZih0KXtsZXQgbj10WzBdLHI9SmUobix0WzNdfHxcIlwiLHRoaXMucnVsZXMpO3JldHVybnt0eXBlOlwiY29kZVwiLHJhdzpuLGxhbmc6dFsyXT90WzJdLnRyaW0oKS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIik6dFsyXSx0ZXh0OnJ9fX1oZWFkaW5nKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suaGVhZGluZy5leGVjKGUpO2lmKHQpe2xldCBuPXRbMl0udHJpbSgpO2lmKHRoaXMucnVsZXMub3RoZXIuZW5kaW5nSGFzaC50ZXN0KG4pKXtsZXQgcj16KG4sXCIjXCIpOyh0aGlzLm9wdGlvbnMucGVkYW50aWN8fCFyfHx0aGlzLnJ1bGVzLm90aGVyLmVuZGluZ1NwYWNlQ2hhci50ZXN0KHIpKSYmKG49ci50cmltKCkpfXJldHVybnt0eXBlOlwiaGVhZGluZ1wiLHJhdzp0WzBdLGRlcHRoOnRbMV0ubGVuZ3RoLHRleHQ6bix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUobil9fX1ocihlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmhyLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImhyXCIscmF3OnoodFswXSxgXG5gKX19YmxvY2txdW90ZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmJsb2NrcXVvdGUuZXhlYyhlKTtpZih0KXtsZXQgbj16KHRbMF0sYFxuYCkuc3BsaXQoYFxuYCkscj1cIlwiLGk9XCJcIixzPVtdO2Zvcig7bi5sZW5ndGg+MDspe2xldCBhPSExLG89W10sbDtmb3IobD0wO2w8bi5sZW5ndGg7bCsrKWlmKHRoaXMucnVsZXMub3RoZXIuYmxvY2txdW90ZVN0YXJ0LnRlc3QobltsXSkpby5wdXNoKG5bbF0pLGE9ITA7ZWxzZSBpZighYSlvLnB1c2gobltsXSk7ZWxzZSBicmVhaztuPW4uc2xpY2UobCk7bGV0IHA9by5qb2luKGBcbmApLGM9cC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuYmxvY2txdW90ZVNldGV4dFJlcGxhY2UsYFxuICAgICQxYCkucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmJsb2NrcXVvdGVTZXRleHRSZXBsYWNlMixcIlwiKTtyPXI/YCR7cn1cbiR7cH1gOnAsaT1pP2Ake2l9XG4ke2N9YDpjO2xldCBnPXRoaXMubGV4ZXIuc3RhdGUudG9wO2lmKHRoaXMubGV4ZXIuc3RhdGUudG9wPSEwLHRoaXMubGV4ZXIuYmxvY2tUb2tlbnMoYyxzLCEwKSx0aGlzLmxleGVyLnN0YXRlLnRvcD1nLG4ubGVuZ3RoPT09MClicmVhaztsZXQgaD1zLmF0KC0xKTtpZihoPy50eXBlPT09XCJjb2RlXCIpYnJlYWs7aWYoaD8udHlwZT09PVwiYmxvY2txdW90ZVwiKXtsZXQgUj1oLGY9Ui5yYXcrYFxuYCtuLmpvaW4oYFxuYCksTz10aGlzLmJsb2NrcXVvdGUoZik7c1tzLmxlbmd0aC0xXT1PLHI9ci5zdWJzdHJpbmcoMCxyLmxlbmd0aC1SLnJhdy5sZW5ndGgpK08ucmF3LGk9aS5zdWJzdHJpbmcoMCxpLmxlbmd0aC1SLnRleHQubGVuZ3RoKStPLnRleHQ7YnJlYWt9ZWxzZSBpZihoPy50eXBlPT09XCJsaXN0XCIpe2xldCBSPWgsZj1SLnJhdytgXG5gK24uam9pbihgXG5gKSxPPXRoaXMubGlzdChmKTtzW3MubGVuZ3RoLTFdPU8scj1yLnN1YnN0cmluZygwLHIubGVuZ3RoLWgucmF3Lmxlbmd0aCkrTy5yYXcsaT1pLnN1YnN0cmluZygwLGkubGVuZ3RoLVIucmF3Lmxlbmd0aCkrTy5yYXcsbj1mLnN1YnN0cmluZyhzLmF0KC0xKS5yYXcubGVuZ3RoKS5zcGxpdChgXG5gKTtjb250aW51ZX19cmV0dXJue3R5cGU6XCJibG9ja3F1b3RlXCIscmF3OnIsdG9rZW5zOnMsdGV4dDppfX19bGlzdChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmxpc3QuZXhlYyhlKTtpZih0KXtsZXQgbj10WzFdLnRyaW0oKSxyPW4ubGVuZ3RoPjEsaT17dHlwZTpcImxpc3RcIixyYXc6XCJcIixvcmRlcmVkOnIsc3RhcnQ6cj8rbi5zbGljZSgwLC0xKTpcIlwiLGxvb3NlOiExLGl0ZW1zOltdfTtuPXI/YFxcXFxkezEsOX1cXFxcJHtuLnNsaWNlKC0xKX1gOmBcXFxcJHtufWAsdGhpcy5vcHRpb25zLnBlZGFudGljJiYobj1yP246XCJbKistXVwiKTtsZXQgcz10aGlzLnJ1bGVzLm90aGVyLmxpc3RJdGVtUmVnZXgobiksYT0hMTtmb3IoO2U7KXtsZXQgbD0hMSxwPVwiXCIsYz1cIlwiO2lmKCEodD1zLmV4ZWMoZSkpfHx0aGlzLnJ1bGVzLmJsb2NrLmhyLnRlc3QoZSkpYnJlYWs7cD10WzBdLGU9ZS5zdWJzdHJpbmcocC5sZW5ndGgpO2xldCBnPXRbMl0uc3BsaXQoYFxuYCwxKVswXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYWJzLE89PlwiIFwiLnJlcGVhdCgzKk8ubGVuZ3RoKSksaD1lLnNwbGl0KGBcbmAsMSlbMF0sUj0hZy50cmltKCksZj0wO2lmKHRoaXMub3B0aW9ucy5wZWRhbnRpYz8oZj0yLGM9Zy50cmltU3RhcnQoKSk6Uj9mPXRbMV0ubGVuZ3RoKzE6KGY9dFsyXS5zZWFyY2godGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIpLGY9Zj40PzE6ZixjPWcuc2xpY2UoZiksZis9dFsxXS5sZW5ndGgpLFImJnRoaXMucnVsZXMub3RoZXIuYmxhbmtMaW5lLnRlc3QoaCkmJihwKz1oK2BcbmAsZT1lLnN1YnN0cmluZyhoLmxlbmd0aCsxKSxsPSEwKSwhbCl7bGV0IE89dGhpcy5ydWxlcy5vdGhlci5uZXh0QnVsbGV0UmVnZXgoZiksVj10aGlzLnJ1bGVzLm90aGVyLmhyUmVnZXgoZiksWT10aGlzLnJ1bGVzLm90aGVyLmZlbmNlc0JlZ2luUmVnZXgoZiksZWU9dGhpcy5ydWxlcy5vdGhlci5oZWFkaW5nQmVnaW5SZWdleChmKSxmZT10aGlzLnJ1bGVzLm90aGVyLmh0bWxCZWdpblJlZ2V4KGYpO2Zvcig7ZTspe2xldCBIPWUuc3BsaXQoYFxuYCwxKVswXSxBO2lmKGg9SCx0aGlzLm9wdGlvbnMucGVkYW50aWM/KGg9aC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VOZXN0aW5nLFwiICBcIiksQT1oKTpBPWgucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYkNoYXJHbG9iYWwsXCIgICAgXCIpLFkudGVzdChoKXx8ZWUudGVzdChoKXx8ZmUudGVzdChoKXx8Ty50ZXN0KGgpfHxWLnRlc3QoaCkpYnJlYWs7aWYoQS5zZWFyY2godGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIpPj1mfHwhaC50cmltKCkpYys9YFxuYCtBLnNsaWNlKGYpO2Vsc2V7aWYoUnx8Zy5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFiQ2hhckdsb2JhbCxcIiAgICBcIikuc2VhcmNoKHRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyKT49NHx8WS50ZXN0KGcpfHxlZS50ZXN0KGcpfHxWLnRlc3QoZykpYnJlYWs7Yys9YFxuYCtofSFSJiYhaC50cmltKCkmJihSPSEwKSxwKz1IK2BcbmAsZT1lLnN1YnN0cmluZyhILmxlbmd0aCsxKSxnPUEuc2xpY2UoZil9fWkubG9vc2V8fChhP2kubG9vc2U9ITA6dGhpcy5ydWxlcy5vdGhlci5kb3VibGVCbGFua0xpbmUudGVzdChwKSYmKGE9ITApKSxpLml0ZW1zLnB1c2goe3R5cGU6XCJsaXN0X2l0ZW1cIixyYXc6cCx0YXNrOiEhdGhpcy5vcHRpb25zLmdmbSYmdGhpcy5ydWxlcy5vdGhlci5saXN0SXNUYXNrLnRlc3QoYyksbG9vc2U6ITEsdGV4dDpjLHRva2VuczpbXX0pLGkucmF3Kz1wfWxldCBvPWkuaXRlbXMuYXQoLTEpO2lmKG8pby5yYXc9by5yYXcudHJpbUVuZCgpLG8udGV4dD1vLnRleHQudHJpbUVuZCgpO2Vsc2UgcmV0dXJuO2kucmF3PWkucmF3LnRyaW1FbmQoKTtmb3IobGV0IGwgb2YgaS5pdGVtcyl7aWYodGhpcy5sZXhlci5zdGF0ZS50b3A9ITEsbC50b2tlbnM9dGhpcy5sZXhlci5ibG9ja1Rva2VucyhsLnRleHQsW10pLGwudGFzayl7aWYobC50ZXh0PWwudGV4dC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpLGwudG9rZW5zWzBdPy50eXBlPT09XCJ0ZXh0XCJ8fGwudG9rZW5zWzBdPy50eXBlPT09XCJwYXJhZ3JhcGhcIil7bC50b2tlbnNbMF0ucmF3PWwudG9rZW5zWzBdLnJhdy5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpLGwudG9rZW5zWzBdLnRleHQ9bC50b2tlbnNbMF0udGV4dC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpO2ZvcihsZXQgYz10aGlzLmxleGVyLmlubGluZVF1ZXVlLmxlbmd0aC0xO2M+PTA7Yy0tKWlmKHRoaXMucnVsZXMub3RoZXIubGlzdElzVGFzay50ZXN0KHRoaXMubGV4ZXIuaW5saW5lUXVldWVbY10uc3JjKSl7dGhpcy5sZXhlci5pbmxpbmVRdWV1ZVtjXS5zcmM9dGhpcy5sZXhlci5pbmxpbmVRdWV1ZVtjXS5zcmMucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKTticmVha319bGV0IHA9dGhpcy5ydWxlcy5vdGhlci5saXN0VGFza0NoZWNrYm94LmV4ZWMobC5yYXcpO2lmKHApe2xldCBjPXt0eXBlOlwiY2hlY2tib3hcIixyYXc6cFswXStcIiBcIixjaGVja2VkOnBbMF0hPT1cIlsgXVwifTtsLmNoZWNrZWQ9Yy5jaGVja2VkLGkubG9vc2U/bC50b2tlbnNbMF0mJltcInBhcmFncmFwaFwiLFwidGV4dFwiXS5pbmNsdWRlcyhsLnRva2Vuc1swXS50eXBlKSYmXCJ0b2tlbnNcImluIGwudG9rZW5zWzBdJiZsLnRva2Vuc1swXS50b2tlbnM/KGwudG9rZW5zWzBdLnJhdz1jLnJhdytsLnRva2Vuc1swXS5yYXcsbC50b2tlbnNbMF0udGV4dD1jLnJhdytsLnRva2Vuc1swXS50ZXh0LGwudG9rZW5zWzBdLnRva2Vucy51bnNoaWZ0KGMpKTpsLnRva2Vucy51bnNoaWZ0KHt0eXBlOlwicGFyYWdyYXBoXCIscmF3OmMucmF3LHRleHQ6Yy5yYXcsdG9rZW5zOltjXX0pOmwudG9rZW5zLnVuc2hpZnQoYyl9fWlmKCFpLmxvb3NlKXtsZXQgcD1sLnRva2Vucy5maWx0ZXIoZz0+Zy50eXBlPT09XCJzcGFjZVwiKSxjPXAubGVuZ3RoPjAmJnAuc29tZShnPT50aGlzLnJ1bGVzLm90aGVyLmFueUxpbmUudGVzdChnLnJhdykpO2kubG9vc2U9Y319aWYoaS5sb29zZSlmb3IobGV0IGwgb2YgaS5pdGVtcyl7bC5sb29zZT0hMDtmb3IobGV0IHAgb2YgbC50b2tlbnMpcC50eXBlPT09XCJ0ZXh0XCImJihwLnR5cGU9XCJwYXJhZ3JhcGhcIil9cmV0dXJuIGl9fWh0bWwoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5odG1sLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImh0bWxcIixibG9jazohMCxyYXc6dFswXSxwcmU6dFsxXT09PVwicHJlXCJ8fHRbMV09PT1cInNjcmlwdFwifHx0WzFdPT09XCJzdHlsZVwiLHRleHQ6dFswXX19ZGVmKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suZGVmLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsxXS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5tdWx0aXBsZVNwYWNlR2xvYmFsLFwiIFwiKSxyPXRbMl0/dFsyXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuaHJlZkJyYWNrZXRzLFwiJDFcIikucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpOlwiXCIsaT10WzNdP3RbM10uc3Vic3RyaW5nKDEsdFszXS5sZW5ndGgtMSkucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpOnRbM107cmV0dXJue3R5cGU6XCJkZWZcIix0YWc6bixyYXc6dFswXSxocmVmOnIsdGl0bGU6aX19fXRhYmxlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2sudGFibGUuZXhlYyhlKTtpZighdHx8IXRoaXMucnVsZXMub3RoZXIudGFibGVEZWxpbWl0ZXIudGVzdCh0WzJdKSlyZXR1cm47bGV0IG49Sih0WzFdKSxyPXRbMl0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25DaGFycyxcIlwiKS5zcGxpdChcInxcIiksaT10WzNdPy50cmltKCk/dFszXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFibGVSb3dCbGFua0xpbmUsXCJcIikuc3BsaXQoYFxuYCk6W10scz17dHlwZTpcInRhYmxlXCIscmF3OnRbMF0saGVhZGVyOltdLGFsaWduOltdLHJvd3M6W119O2lmKG4ubGVuZ3RoPT09ci5sZW5ndGgpe2ZvcihsZXQgYSBvZiByKXRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnblJpZ2h0LnRlc3QoYSk/cy5hbGlnbi5wdXNoKFwicmlnaHRcIik6dGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduQ2VudGVyLnRlc3QoYSk/cy5hbGlnbi5wdXNoKFwiY2VudGVyXCIpOnRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnbkxlZnQudGVzdChhKT9zLmFsaWduLnB1c2goXCJsZWZ0XCIpOnMuYWxpZ24ucHVzaChudWxsKTtmb3IobGV0IGE9MDthPG4ubGVuZ3RoO2ErKylzLmhlYWRlci5wdXNoKHt0ZXh0Om5bYV0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG5bYV0pLGhlYWRlcjohMCxhbGlnbjpzLmFsaWduW2FdfSk7Zm9yKGxldCBhIG9mIGkpcy5yb3dzLnB1c2goSihhLHMuaGVhZGVyLmxlbmd0aCkubWFwKChvLGwpPT4oe3RleHQ6byx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUobyksaGVhZGVyOiExLGFsaWduOnMuYWxpZ25bbF19KSkpO3JldHVybiBzfX1saGVhZGluZyhlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmxoZWFkaW5nLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImhlYWRpbmdcIixyYXc6dFswXSxkZXB0aDp0WzJdLmNoYXJBdCgwKT09PVwiPVwiPzE6Mix0ZXh0OnRbMV0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKHRbMV0pfX1wYXJhZ3JhcGgoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5wYXJhZ3JhcGguZXhlYyhlKTtpZih0KXtsZXQgbj10WzFdLmNoYXJBdCh0WzFdLmxlbmd0aC0xKT09PWBcbmA/dFsxXS5zbGljZSgwLC0xKTp0WzFdO3JldHVybnt0eXBlOlwicGFyYWdyYXBoXCIscmF3OnRbMF0sdGV4dDpuLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShuKX19fXRleHQoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay50ZXh0LmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcInRleHRcIixyYXc6dFswXSx0ZXh0OnRbMF0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKHRbMF0pfX1lc2NhcGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuZXNjYXBlLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImVzY2FwZVwiLHJhdzp0WzBdLHRleHQ6dFsxXX19dGFnKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLnRhZy5leGVjKGUpO2lmKHQpcmV0dXJuIXRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rJiZ0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0QVRhZy50ZXN0KHRbMF0pP3RoaXMubGV4ZXIuc3RhdGUuaW5MaW5rPSEwOnRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rJiZ0aGlzLnJ1bGVzLm90aGVyLmVuZEFUYWcudGVzdCh0WzBdKSYmKHRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rPSExKSwhdGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrJiZ0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0UHJlU2NyaXB0VGFnLnRlc3QodFswXSk/dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrPSEwOnRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayYmdGhpcy5ydWxlcy5vdGhlci5lbmRQcmVTY3JpcHRUYWcudGVzdCh0WzBdKSYmKHRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jaz0hMSkse3R5cGU6XCJodG1sXCIscmF3OnRbMF0saW5MaW5rOnRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rLGluUmF3QmxvY2s6dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrLGJsb2NrOiExLHRleHQ6dFswXX19bGluayhlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5saW5rLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsyXS50cmltKCk7aWYoIXRoaXMub3B0aW9ucy5wZWRhbnRpYyYmdGhpcy5ydWxlcy5vdGhlci5zdGFydEFuZ2xlQnJhY2tldC50ZXN0KG4pKXtpZighdGhpcy5ydWxlcy5vdGhlci5lbmRBbmdsZUJyYWNrZXQudGVzdChuKSlyZXR1cm47bGV0IHM9eihuLnNsaWNlKDAsLTEpLFwiXFxcXFwiKTtpZigobi5sZW5ndGgtcy5sZW5ndGgpJTI9PT0wKXJldHVybn1lbHNle2xldCBzPWRlKHRbMl0sXCIoKVwiKTtpZihzPT09LTIpcmV0dXJuO2lmKHM+LTEpe2xldCBvPSh0WzBdLmluZGV4T2YoXCIhXCIpPT09MD81OjQpK3RbMV0ubGVuZ3RoK3M7dFsyXT10WzJdLnN1YnN0cmluZygwLHMpLHRbMF09dFswXS5zdWJzdHJpbmcoMCxvKS50cmltKCksdFszXT1cIlwifX1sZXQgcj10WzJdLGk9XCJcIjtpZih0aGlzLm9wdGlvbnMucGVkYW50aWMpe2xldCBzPXRoaXMucnVsZXMub3RoZXIucGVkYW50aWNIcmVmVGl0bGUuZXhlYyhyKTtzJiYocj1zWzFdLGk9c1szXSl9ZWxzZSBpPXRbM10/dFszXS5zbGljZSgxLC0xKTpcIlwiO3JldHVybiByPXIudHJpbSgpLHRoaXMucnVsZXMub3RoZXIuc3RhcnRBbmdsZUJyYWNrZXQudGVzdChyKSYmKHRoaXMub3B0aW9ucy5wZWRhbnRpYyYmIXRoaXMucnVsZXMub3RoZXIuZW5kQW5nbGVCcmFja2V0LnRlc3Qobik/cj1yLnNsaWNlKDEpOnI9ci5zbGljZSgxLC0xKSksZ2UodCx7aHJlZjpyJiZyLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKSx0aXRsZTppJiZpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKX0sdFswXSx0aGlzLmxleGVyLHRoaXMucnVsZXMpfX1yZWZsaW5rKGUsdCl7bGV0IG47aWYoKG49dGhpcy5ydWxlcy5pbmxpbmUucmVmbGluay5leGVjKGUpKXx8KG49dGhpcy5ydWxlcy5pbmxpbmUubm9saW5rLmV4ZWMoZSkpKXtsZXQgcj0oblsyXXx8blsxXSkucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLm11bHRpcGxlU3BhY2VHbG9iYWwsXCIgXCIpLGk9dFtyLnRvTG93ZXJDYXNlKCldO2lmKCFpKXtsZXQgcz1uWzBdLmNoYXJBdCgwKTtyZXR1cm57dHlwZTpcInRleHRcIixyYXc6cyx0ZXh0OnN9fXJldHVybiBnZShuLGksblswXSx0aGlzLmxleGVyLHRoaXMucnVsZXMpfX1lbVN0cm9uZyhlLHQsbj1cIlwiKXtsZXQgcj10aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZ0xEZWxpbS5leGVjKGUpO2lmKCFyfHxyWzNdJiZuLm1hdGNoKHRoaXMucnVsZXMub3RoZXIudW5pY29kZUFscGhhTnVtZXJpYykpcmV0dXJuO2lmKCEoclsxXXx8clsyXXx8XCJcIil8fCFufHx0aGlzLnJ1bGVzLmlubGluZS5wdW5jdHVhdGlvbi5leGVjKG4pKXtsZXQgcz1bLi4uclswXV0ubGVuZ3RoLTEsYSxvLGw9cyxwPTAsYz1yWzBdWzBdPT09XCIqXCI/dGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmdSRGVsaW1Bc3Q6dGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmdSRGVsaW1VbmQ7Zm9yKGMubGFzdEluZGV4PTAsdD10LnNsaWNlKC0xKmUubGVuZ3RoK3MpOyhyPWMuZXhlYyh0KSkhPW51bGw7KXtpZihhPXJbMV18fHJbMl18fHJbM118fHJbNF18fHJbNV18fHJbNl0sIWEpY29udGludWU7aWYobz1bLi4uYV0ubGVuZ3RoLHJbM118fHJbNF0pe2wrPW87Y29udGludWV9ZWxzZSBpZigocls1XXx8cls2XSkmJnMlMyYmISgocytvKSUzKSl7cCs9bztjb250aW51ZX1pZihsLT1vLGw+MCljb250aW51ZTtvPU1hdGgubWluKG8sbytsK3ApO2xldCBnPVsuLi5yWzBdXVswXS5sZW5ndGgsaD1lLnNsaWNlKDAscytyLmluZGV4K2crbyk7aWYoTWF0aC5taW4ocyxvKSUyKXtsZXQgZj1oLnNsaWNlKDEsLTEpO3JldHVybnt0eXBlOlwiZW1cIixyYXc6aCx0ZXh0OmYsdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKGYpfX1sZXQgUj1oLnNsaWNlKDIsLTIpO3JldHVybnt0eXBlOlwic3Ryb25nXCIscmF3OmgsdGV4dDpSLHRva2Vuczp0aGlzLmxleGVyLmlubGluZVRva2VucyhSKX19fX1jb2Rlc3BhbihlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5jb2RlLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsyXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubmV3TGluZUNoYXJHbG9iYWwsXCIgXCIpLHI9dGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIudGVzdChuKSxpPXRoaXMucnVsZXMub3RoZXIuc3RhcnRpbmdTcGFjZUNoYXIudGVzdChuKSYmdGhpcy5ydWxlcy5vdGhlci5lbmRpbmdTcGFjZUNoYXIudGVzdChuKTtyZXR1cm4gciYmaSYmKG49bi5zdWJzdHJpbmcoMSxuLmxlbmd0aC0xKSkse3R5cGU6XCJjb2Rlc3BhblwiLHJhdzp0WzBdLHRleHQ6bn19fWJyKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmJyLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImJyXCIscmF3OnRbMF19fWRlbChlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5kZWwuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiZGVsXCIscmF3OnRbMF0sdGV4dDp0WzJdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZVRva2Vucyh0WzJdKX19YXV0b2xpbmsoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuYXV0b2xpbmsuZXhlYyhlKTtpZih0KXtsZXQgbixyO3JldHVybiB0WzJdPT09XCJAXCI/KG49dFsxXSxyPVwibWFpbHRvOlwiK24pOihuPXRbMV0scj1uKSx7dHlwZTpcImxpbmtcIixyYXc6dFswXSx0ZXh0Om4saHJlZjpyLHRva2Vuczpbe3R5cGU6XCJ0ZXh0XCIscmF3Om4sdGV4dDpufV19fX11cmwoZSl7bGV0IHQ7aWYodD10aGlzLnJ1bGVzLmlubGluZS51cmwuZXhlYyhlKSl7bGV0IG4scjtpZih0WzJdPT09XCJAXCIpbj10WzBdLHI9XCJtYWlsdG86XCIrbjtlbHNle2xldCBpO2RvIGk9dFswXSx0WzBdPXRoaXMucnVsZXMuaW5saW5lLl9iYWNrcGVkYWwuZXhlYyh0WzBdKT8uWzBdPz9cIlwiO3doaWxlKGkhPT10WzBdKTtuPXRbMF0sdFsxXT09PVwid3d3LlwiP3I9XCJodHRwOi8vXCIrdFswXTpyPXRbMF19cmV0dXJue3R5cGU6XCJsaW5rXCIscmF3OnRbMF0sdGV4dDpuLGhyZWY6cix0b2tlbnM6W3t0eXBlOlwidGV4dFwiLHJhdzpuLHRleHQ6bn1dfX19aW5saW5lVGV4dChlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS50ZXh0LmV4ZWMoZSk7aWYodCl7bGV0IG49dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrO3JldHVybnt0eXBlOlwidGV4dFwiLHJhdzp0WzBdLHRleHQ6dFswXSxlc2NhcGVkOm59fX19O3ZhciB4PWNsYXNzIHV7dG9rZW5zO29wdGlvbnM7c3RhdGU7aW5saW5lUXVldWU7dG9rZW5pemVyO2NvbnN0cnVjdG9yKGUpe3RoaXMudG9rZW5zPVtdLHRoaXMudG9rZW5zLmxpbmtzPU9iamVjdC5jcmVhdGUobnVsbCksdGhpcy5vcHRpb25zPWV8fFQsdGhpcy5vcHRpb25zLnRva2VuaXplcj10aGlzLm9wdGlvbnMudG9rZW5pemVyfHxuZXcgeSx0aGlzLnRva2VuaXplcj10aGlzLm9wdGlvbnMudG9rZW5pemVyLHRoaXMudG9rZW5pemVyLm9wdGlvbnM9dGhpcy5vcHRpb25zLHRoaXMudG9rZW5pemVyLmxleGVyPXRoaXMsdGhpcy5pbmxpbmVRdWV1ZT1bXSx0aGlzLnN0YXRlPXtpbkxpbms6ITEsaW5SYXdCbG9jazohMSx0b3A6ITB9O2xldCB0PXtvdGhlcjptLGJsb2NrOkUubm9ybWFsLGlubGluZTpNLm5vcm1hbH07dGhpcy5vcHRpb25zLnBlZGFudGljPyh0LmJsb2NrPUUucGVkYW50aWMsdC5pbmxpbmU9TS5wZWRhbnRpYyk6dGhpcy5vcHRpb25zLmdmbSYmKHQuYmxvY2s9RS5nZm0sdGhpcy5vcHRpb25zLmJyZWFrcz90LmlubGluZT1NLmJyZWFrczp0LmlubGluZT1NLmdmbSksdGhpcy50b2tlbml6ZXIucnVsZXM9dH1zdGF0aWMgZ2V0IHJ1bGVzKCl7cmV0dXJue2Jsb2NrOkUsaW5saW5lOk19fXN0YXRpYyBsZXgoZSx0KXtyZXR1cm4gbmV3IHUodCkubGV4KGUpfXN0YXRpYyBsZXhJbmxpbmUoZSx0KXtyZXR1cm4gbmV3IHUodCkuaW5saW5lVG9rZW5zKGUpfWxleChlKXtlPWUucmVwbGFjZShtLmNhcnJpYWdlUmV0dXJuLGBcbmApLHRoaXMuYmxvY2tUb2tlbnMoZSx0aGlzLnRva2Vucyk7Zm9yKGxldCB0PTA7dDx0aGlzLmlubGluZVF1ZXVlLmxlbmd0aDt0Kyspe2xldCBuPXRoaXMuaW5saW5lUXVldWVbdF07dGhpcy5pbmxpbmVUb2tlbnMobi5zcmMsbi50b2tlbnMpfXJldHVybiB0aGlzLmlubGluZVF1ZXVlPVtdLHRoaXMudG9rZW5zfWJsb2NrVG9rZW5zKGUsdD1bXSxuPSExKXtmb3IodGhpcy5vcHRpb25zLnBlZGFudGljJiYoZT1lLnJlcGxhY2UobS50YWJDaGFyR2xvYmFsLFwiICAgIFwiKS5yZXBsYWNlKG0uc3BhY2VMaW5lLFwiXCIpKTtlOyl7bGV0IHI7aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LmJsb2NrPy5zb21lKHM9PihyPXMuY2FsbCh7bGV4ZXI6dGhpc30sZSx0KSk/KGU9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gociksITApOiExKSljb250aW51ZTtpZihyPXRoaXMudG9rZW5pemVyLnNwYWNlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7ci5yYXcubGVuZ3RoPT09MSYmcyE9PXZvaWQgMD9zLnJhdys9YFxuYDp0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5jb2RlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7cz8udHlwZT09PVwicGFyYWdyYXBoXCJ8fHM/LnR5cGU9PT1cInRleHRcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnRleHQsdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuZmVuY2VzKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuaGVhZGluZyhlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmhyKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuYmxvY2txdW90ZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmxpc3QoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5odG1sKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuZGVmKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7cz8udHlwZT09PVwicGFyYWdyYXBoXCJ8fHM/LnR5cGU9PT1cInRleHRcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnJhdyx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0aGlzLnRva2Vucy5saW5rc1tyLnRhZ118fCh0aGlzLnRva2Vucy5saW5rc1tyLnRhZ109e2hyZWY6ci5ocmVmLHRpdGxlOnIudGl0bGV9LHQucHVzaChyKSk7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci50YWJsZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmxoZWFkaW5nKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWxldCBpPWU7aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnN0YXJ0QmxvY2spe2xldCBzPTEvMCxhPWUuc2xpY2UoMSksbzt0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5zdGFydEJsb2NrLmZvckVhY2gobD0+e289bC5jYWxsKHtsZXhlcjp0aGlzfSxhKSx0eXBlb2Ygbz09XCJudW1iZXJcIiYmbz49MCYmKHM9TWF0aC5taW4ocyxvKSl9KSxzPDEvMCYmcz49MCYmKGk9ZS5zdWJzdHJpbmcoMCxzKzEpKX1pZih0aGlzLnN0YXRlLnRvcCYmKHI9dGhpcy50b2tlbml6ZXIucGFyYWdyYXBoKGkpKSl7bGV0IHM9dC5hdCgtMSk7biYmcz8udHlwZT09PVwicGFyYWdyYXBoXCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci50ZXh0LHRoaXMuaW5saW5lUXVldWUucG9wKCksdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dC5wdXNoKHIpLG49aS5sZW5ndGghPT1lLmxlbmd0aCxlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci50ZXh0KGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7cz8udHlwZT09PVwidGV4dFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IudGV4dCx0aGlzLmlubGluZVF1ZXVlLnBvcCgpLHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnQucHVzaChyKTtjb250aW51ZX1pZihlKXtsZXQgcz1cIkluZmluaXRlIGxvb3Agb24gYnl0ZTogXCIrZS5jaGFyQ29kZUF0KDApO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpe2NvbnNvbGUuZXJyb3Iocyk7YnJlYWt9ZWxzZSB0aHJvdyBuZXcgRXJyb3Iocyl9fXJldHVybiB0aGlzLnN0YXRlLnRvcD0hMCx0fWlubGluZShlLHQ9W10pe3JldHVybiB0aGlzLmlubGluZVF1ZXVlLnB1c2goe3NyYzplLHRva2Vuczp0fSksdH1pbmxpbmVUb2tlbnMoZSx0PVtdKXtsZXQgbj1lLHI9bnVsbDtpZih0aGlzLnRva2Vucy5saW5rcyl7bGV0IG89T2JqZWN0LmtleXModGhpcy50b2tlbnMubGlua3MpO2lmKG8ubGVuZ3RoPjApZm9yKDsocj10aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUucmVmbGlua1NlYXJjaC5leGVjKG4pKSE9bnVsbDspby5pbmNsdWRlcyhyWzBdLnNsaWNlKHJbMF0ubGFzdEluZGV4T2YoXCJbXCIpKzEsLTEpKSYmKG49bi5zbGljZSgwLHIuaW5kZXgpK1wiW1wiK1wiYVwiLnJlcGVhdChyWzBdLmxlbmd0aC0yKStcIl1cIituLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5yZWZsaW5rU2VhcmNoLmxhc3RJbmRleCkpfWZvcig7KHI9dGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLmV4ZWMobikpIT1udWxsOyluPW4uc2xpY2UoMCxyLmluZGV4KStcIisrXCIrbi5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24ubGFzdEluZGV4KTtsZXQgaTtmb3IoOyhyPXRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5ibG9ja1NraXAuZXhlYyhuKSkhPW51bGw7KWk9clsyXT9yWzJdLmxlbmd0aDowLG49bi5zbGljZSgwLHIuaW5kZXgraSkrXCJbXCIrXCJhXCIucmVwZWF0KHJbMF0ubGVuZ3RoLWktMikrXCJdXCIrbi5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYmxvY2tTa2lwLmxhc3RJbmRleCk7bj10aGlzLm9wdGlvbnMuaG9va3M/LmVtU3Ryb25nTWFzaz8uY2FsbCh7bGV4ZXI6dGhpc30sbik/P247bGV0IHM9ITEsYT1cIlwiO2Zvcig7ZTspe3N8fChhPVwiXCIpLHM9ITE7bGV0IG87aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LmlubGluZT8uc29tZShwPT4obz1wLmNhbGwoe2xleGVyOnRoaXN9LGUsdCkpPyhlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pLCEwKTohMSkpY29udGludWU7aWYobz10aGlzLnRva2VuaXplci5lc2NhcGUoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci50YWcoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5saW5rKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIucmVmbGluayhlLHRoaXMudG9rZW5zLmxpbmtzKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpO2xldCBwPXQuYXQoLTEpO28udHlwZT09PVwidGV4dFwiJiZwPy50eXBlPT09XCJ0ZXh0XCI/KHAucmF3Kz1vLnJhdyxwLnRleHQrPW8udGV4dCk6dC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuZW1TdHJvbmcoZSxuLGEpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuY29kZXNwYW4oZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5icihlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmRlbChlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmF1dG9saW5rKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKCF0aGlzLnN0YXRlLmluTGluayYmKG89dGhpcy50b2tlbml6ZXIudXJsKGUpKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1sZXQgbD1lO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5zdGFydElubGluZSl7bGV0IHA9MS8wLGM9ZS5zbGljZSgxKSxnO3RoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0SW5saW5lLmZvckVhY2goaD0+e2c9aC5jYWxsKHtsZXhlcjp0aGlzfSxjKSx0eXBlb2YgZz09XCJudW1iZXJcIiYmZz49MCYmKHA9TWF0aC5taW4ocCxnKSl9KSxwPDEvMCYmcD49MCYmKGw9ZS5zdWJzdHJpbmcoMCxwKzEpKX1pZihvPXRoaXMudG9rZW5pemVyLmlubGluZVRleHQobCkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSxvLnJhdy5zbGljZSgtMSkhPT1cIl9cIiYmKGE9by5yYXcuc2xpY2UoLTEpKSxzPSEwO2xldCBwPXQuYXQoLTEpO3A/LnR5cGU9PT1cInRleHRcIj8ocC5yYXcrPW8ucmF3LHAudGV4dCs9by50ZXh0KTp0LnB1c2gobyk7Y29udGludWV9aWYoZSl7bGV0IHA9XCJJbmZpbml0ZSBsb29wIG9uIGJ5dGU6IFwiK2UuY2hhckNvZGVBdCgwKTtpZih0aGlzLm9wdGlvbnMuc2lsZW50KXtjb25zb2xlLmVycm9yKHApO2JyZWFrfWVsc2UgdGhyb3cgbmV3IEVycm9yKHApfX1yZXR1cm4gdH19O3ZhciBQPWNsYXNze29wdGlvbnM7cGFyc2VyO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxUfXNwYWNlKGUpe3JldHVyblwiXCJ9Y29kZSh7dGV4dDplLGxhbmc6dCxlc2NhcGVkOm59KXtsZXQgcj0odHx8XCJcIikubWF0Y2gobS5ub3RTcGFjZVN0YXJ0KT8uWzBdLGk9ZS5yZXBsYWNlKG0uZW5kaW5nTmV3bGluZSxcIlwiKStgXG5gO3JldHVybiByPyc8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtJyt3KHIpKydcIj4nKyhuP2k6dyhpLCEwKSkrYDwvY29kZT48L3ByZT5cbmA6XCI8cHJlPjxjb2RlPlwiKyhuP2k6dyhpLCEwKSkrYDwvY29kZT48L3ByZT5cbmB9YmxvY2txdW90ZSh7dG9rZW5zOmV9KXtyZXR1cm5gPGJsb2NrcXVvdGU+XG4ke3RoaXMucGFyc2VyLnBhcnNlKGUpfTwvYmxvY2txdW90ZT5cbmB9aHRtbCh7dGV4dDplfSl7cmV0dXJuIGV9ZGVmKGUpe3JldHVyblwiXCJ9aGVhZGluZyh7dG9rZW5zOmUsZGVwdGg6dH0pe3JldHVybmA8aCR7dH0+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L2gke3R9PlxuYH1ocihlKXtyZXR1cm5gPGhyPlxuYH1saXN0KGUpe2xldCB0PWUub3JkZXJlZCxuPWUuc3RhcnQscj1cIlwiO2ZvcihsZXQgYT0wO2E8ZS5pdGVtcy5sZW5ndGg7YSsrKXtsZXQgbz1lLml0ZW1zW2FdO3IrPXRoaXMubGlzdGl0ZW0obyl9bGV0IGk9dD9cIm9sXCI6XCJ1bFwiLHM9dCYmbiE9PTE/JyBzdGFydD1cIicrbisnXCInOlwiXCI7cmV0dXJuXCI8XCIraStzK2A+XG5gK3IrXCI8L1wiK2krYD5cbmB9bGlzdGl0ZW0oZSl7cmV0dXJuYDxsaT4ke3RoaXMucGFyc2VyLnBhcnNlKGUudG9rZW5zKX08L2xpPlxuYH1jaGVja2JveCh7Y2hlY2tlZDplfSl7cmV0dXJuXCI8aW5wdXQgXCIrKGU/J2NoZWNrZWQ9XCJcIiAnOlwiXCIpKydkaXNhYmxlZD1cIlwiIHR5cGU9XCJjaGVja2JveFwiPiAnfXBhcmFncmFwaCh7dG9rZW5zOmV9KXtyZXR1cm5gPHA+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L3A+XG5gfXRhYmxlKGUpe2xldCB0PVwiXCIsbj1cIlwiO2ZvcihsZXQgaT0wO2k8ZS5oZWFkZXIubGVuZ3RoO2krKyluKz10aGlzLnRhYmxlY2VsbChlLmhlYWRlcltpXSk7dCs9dGhpcy50YWJsZXJvdyh7dGV4dDpufSk7bGV0IHI9XCJcIjtmb3IobGV0IGk9MDtpPGUucm93cy5sZW5ndGg7aSsrKXtsZXQgcz1lLnJvd3NbaV07bj1cIlwiO2ZvcihsZXQgYT0wO2E8cy5sZW5ndGg7YSsrKW4rPXRoaXMudGFibGVjZWxsKHNbYV0pO3IrPXRoaXMudGFibGVyb3coe3RleHQ6bn0pfXJldHVybiByJiYocj1gPHRib2R5PiR7cn08L3Rib2R5PmApLGA8dGFibGU+XG48dGhlYWQ+XG5gK3QrYDwvdGhlYWQ+XG5gK3IrYDwvdGFibGU+XG5gfXRhYmxlcm93KHt0ZXh0OmV9KXtyZXR1cm5gPHRyPlxuJHtlfTwvdHI+XG5gfXRhYmxlY2VsbChlKXtsZXQgdD10aGlzLnBhcnNlci5wYXJzZUlubGluZShlLnRva2Vucyksbj1lLmhlYWRlcj9cInRoXCI6XCJ0ZFwiO3JldHVybihlLmFsaWduP2A8JHtufSBhbGlnbj1cIiR7ZS5hbGlnbn1cIj5gOmA8JHtufT5gKSt0K2A8LyR7bn0+XG5gfXN0cm9uZyh7dG9rZW5zOmV9KXtyZXR1cm5gPHN0cm9uZz4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvc3Ryb25nPmB9ZW0oe3Rva2VuczplfSl7cmV0dXJuYDxlbT4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvZW0+YH1jb2Rlc3Bhbih7dGV4dDplfSl7cmV0dXJuYDxjb2RlPiR7dyhlLCEwKX08L2NvZGU+YH1icihlKXtyZXR1cm5cIjxicj5cIn1kZWwoe3Rva2VuczplfSl7cmV0dXJuYDxkZWw+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L2RlbD5gfWxpbmsoe2hyZWY6ZSx0aXRsZTp0LHRva2VuczpufSl7bGV0IHI9dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUobiksaT1YKGUpO2lmKGk9PT1udWxsKXJldHVybiByO2U9aTtsZXQgcz0nPGEgaHJlZj1cIicrZSsnXCInO3JldHVybiB0JiYocys9JyB0aXRsZT1cIicrdyh0KSsnXCInKSxzKz1cIj5cIityK1wiPC9hPlwiLHN9aW1hZ2Uoe2hyZWY6ZSx0aXRsZTp0LHRleHQ6bix0b2tlbnM6cn0pe3ImJihuPXRoaXMucGFyc2VyLnBhcnNlSW5saW5lKHIsdGhpcy5wYXJzZXIudGV4dFJlbmRlcmVyKSk7bGV0IGk9WChlKTtpZihpPT09bnVsbClyZXR1cm4gdyhuKTtlPWk7bGV0IHM9YDxpbWcgc3JjPVwiJHtlfVwiIGFsdD1cIiR7bn1cImA7cmV0dXJuIHQmJihzKz1gIHRpdGxlPVwiJHt3KHQpfVwiYCkscys9XCI+XCIsc310ZXh0KGUpe3JldHVyblwidG9rZW5zXCJpbiBlJiZlLnRva2Vucz90aGlzLnBhcnNlci5wYXJzZUlubGluZShlLnRva2Vucyk6XCJlc2NhcGVkXCJpbiBlJiZlLmVzY2FwZWQ/ZS50ZXh0OncoZS50ZXh0KX19O3ZhciAkPWNsYXNze3N0cm9uZyh7dGV4dDplfSl7cmV0dXJuIGV9ZW0oe3RleHQ6ZX0pe3JldHVybiBlfWNvZGVzcGFuKHt0ZXh0OmV9KXtyZXR1cm4gZX1kZWwoe3RleHQ6ZX0pe3JldHVybiBlfWh0bWwoe3RleHQ6ZX0pe3JldHVybiBlfXRleHQoe3RleHQ6ZX0pe3JldHVybiBlfWxpbmsoe3RleHQ6ZX0pe3JldHVyblwiXCIrZX1pbWFnZSh7dGV4dDplfSl7cmV0dXJuXCJcIitlfWJyKCl7cmV0dXJuXCJcIn1jaGVja2JveCh7cmF3OmV9KXtyZXR1cm4gZX19O3ZhciBiPWNsYXNzIHV7b3B0aW9ucztyZW5kZXJlcjt0ZXh0UmVuZGVyZXI7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFQsdGhpcy5vcHRpb25zLnJlbmRlcmVyPXRoaXMub3B0aW9ucy5yZW5kZXJlcnx8bmV3IFAsdGhpcy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXIsdGhpcy5yZW5kZXJlci5vcHRpb25zPXRoaXMub3B0aW9ucyx0aGlzLnJlbmRlcmVyLnBhcnNlcj10aGlzLHRoaXMudGV4dFJlbmRlcmVyPW5ldyAkfXN0YXRpYyBwYXJzZShlLHQpe3JldHVybiBuZXcgdSh0KS5wYXJzZShlKX1zdGF0aWMgcGFyc2VJbmxpbmUoZSx0KXtyZXR1cm4gbmV3IHUodCkucGFyc2VJbmxpbmUoZSl9cGFyc2UoZSl7bGV0IHQ9XCJcIjtmb3IobGV0IG49MDtuPGUubGVuZ3RoO24rKyl7bGV0IHI9ZVtuXTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8ucmVuZGVyZXJzPy5bci50eXBlXSl7bGV0IHM9cixhPXRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1tzLnR5cGVdLmNhbGwoe3BhcnNlcjp0aGlzfSxzKTtpZihhIT09ITF8fCFbXCJzcGFjZVwiLFwiaHJcIixcImhlYWRpbmdcIixcImNvZGVcIixcInRhYmxlXCIsXCJibG9ja3F1b3RlXCIsXCJsaXN0XCIsXCJodG1sXCIsXCJkZWZcIixcInBhcmFncmFwaFwiLFwidGV4dFwiXS5pbmNsdWRlcyhzLnR5cGUpKXt0Kz1hfHxcIlwiO2NvbnRpbnVlfX1sZXQgaT1yO3N3aXRjaChpLnR5cGUpe2Nhc2VcInNwYWNlXCI6e3QrPXRoaXMucmVuZGVyZXIuc3BhY2UoaSk7YnJlYWt9Y2FzZVwiaHJcIjp7dCs9dGhpcy5yZW5kZXJlci5ocihpKTticmVha31jYXNlXCJoZWFkaW5nXCI6e3QrPXRoaXMucmVuZGVyZXIuaGVhZGluZyhpKTticmVha31jYXNlXCJjb2RlXCI6e3QrPXRoaXMucmVuZGVyZXIuY29kZShpKTticmVha31jYXNlXCJ0YWJsZVwiOnt0Kz10aGlzLnJlbmRlcmVyLnRhYmxlKGkpO2JyZWFrfWNhc2VcImJsb2NrcXVvdGVcIjp7dCs9dGhpcy5yZW5kZXJlci5ibG9ja3F1b3RlKGkpO2JyZWFrfWNhc2VcImxpc3RcIjp7dCs9dGhpcy5yZW5kZXJlci5saXN0KGkpO2JyZWFrfWNhc2VcImNoZWNrYm94XCI6e3QrPXRoaXMucmVuZGVyZXIuY2hlY2tib3goaSk7YnJlYWt9Y2FzZVwiaHRtbFwiOnt0Kz10aGlzLnJlbmRlcmVyLmh0bWwoaSk7YnJlYWt9Y2FzZVwiZGVmXCI6e3QrPXRoaXMucmVuZGVyZXIuZGVmKGkpO2JyZWFrfWNhc2VcInBhcmFncmFwaFwiOnt0Kz10aGlzLnJlbmRlcmVyLnBhcmFncmFwaChpKTticmVha31jYXNlXCJ0ZXh0XCI6e3QrPXRoaXMucmVuZGVyZXIudGV4dChpKTticmVha31kZWZhdWx0OntsZXQgcz0nVG9rZW4gd2l0aCBcIicraS50eXBlKydcIiB0eXBlIHdhcyBub3QgZm91bmQuJztpZih0aGlzLm9wdGlvbnMuc2lsZW50KXJldHVybiBjb25zb2xlLmVycm9yKHMpLFwiXCI7dGhyb3cgbmV3IEVycm9yKHMpfX19cmV0dXJuIHR9cGFyc2VJbmxpbmUoZSx0PXRoaXMucmVuZGVyZXIpe2xldCBuPVwiXCI7Zm9yKGxldCByPTA7cjxlLmxlbmd0aDtyKyspe2xldCBpPWVbcl07aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnJlbmRlcmVycz8uW2kudHlwZV0pe2xldCBhPXRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1tpLnR5cGVdLmNhbGwoe3BhcnNlcjp0aGlzfSxpKTtpZihhIT09ITF8fCFbXCJlc2NhcGVcIixcImh0bWxcIixcImxpbmtcIixcImltYWdlXCIsXCJzdHJvbmdcIixcImVtXCIsXCJjb2Rlc3BhblwiLFwiYnJcIixcImRlbFwiLFwidGV4dFwiXS5pbmNsdWRlcyhpLnR5cGUpKXtuKz1hfHxcIlwiO2NvbnRpbnVlfX1sZXQgcz1pO3N3aXRjaChzLnR5cGUpe2Nhc2VcImVzY2FwZVwiOntuKz10LnRleHQocyk7YnJlYWt9Y2FzZVwiaHRtbFwiOntuKz10Lmh0bWwocyk7YnJlYWt9Y2FzZVwibGlua1wiOntuKz10Lmxpbmsocyk7YnJlYWt9Y2FzZVwiaW1hZ2VcIjp7bis9dC5pbWFnZShzKTticmVha31jYXNlXCJjaGVja2JveFwiOntuKz10LmNoZWNrYm94KHMpO2JyZWFrfWNhc2VcInN0cm9uZ1wiOntuKz10LnN0cm9uZyhzKTticmVha31jYXNlXCJlbVwiOntuKz10LmVtKHMpO2JyZWFrfWNhc2VcImNvZGVzcGFuXCI6e24rPXQuY29kZXNwYW4ocyk7YnJlYWt9Y2FzZVwiYnJcIjp7bis9dC5icihzKTticmVha31jYXNlXCJkZWxcIjp7bis9dC5kZWwocyk7YnJlYWt9Y2FzZVwidGV4dFwiOntuKz10LnRleHQocyk7YnJlYWt9ZGVmYXVsdDp7bGV0IGE9J1Rva2VuIHdpdGggXCInK3MudHlwZSsnXCIgdHlwZSB3YXMgbm90IGZvdW5kLic7aWYodGhpcy5vcHRpb25zLnNpbGVudClyZXR1cm4gY29uc29sZS5lcnJvcihhKSxcIlwiO3Rocm93IG5ldyBFcnJvcihhKX19fXJldHVybiBufX07dmFyIFM9Y2xhc3N7b3B0aW9ucztibG9jaztjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VH1zdGF0aWMgcGFzc1Rocm91Z2hIb29rcz1uZXcgU2V0KFtcInByZXByb2Nlc3NcIixcInBvc3Rwcm9jZXNzXCIsXCJwcm9jZXNzQWxsVG9rZW5zXCIsXCJlbVN0cm9uZ01hc2tcIl0pO3N0YXRpYyBwYXNzVGhyb3VnaEhvb2tzUmVzcGVjdEFzeW5jPW5ldyBTZXQoW1wicHJlcHJvY2Vzc1wiLFwicG9zdHByb2Nlc3NcIixcInByb2Nlc3NBbGxUb2tlbnNcIl0pO3ByZXByb2Nlc3MoZSl7cmV0dXJuIGV9cG9zdHByb2Nlc3MoZSl7cmV0dXJuIGV9cHJvY2Vzc0FsbFRva2VucyhlKXtyZXR1cm4gZX1lbVN0cm9uZ01hc2soZSl7cmV0dXJuIGV9cHJvdmlkZUxleGVyKCl7cmV0dXJuIHRoaXMuYmxvY2s/eC5sZXg6eC5sZXhJbmxpbmV9cHJvdmlkZVBhcnNlcigpe3JldHVybiB0aGlzLmJsb2NrP2IucGFyc2U6Yi5wYXJzZUlubGluZX19O3ZhciBCPWNsYXNze2RlZmF1bHRzPUwoKTtvcHRpb25zPXRoaXMuc2V0T3B0aW9ucztwYXJzZT10aGlzLnBhcnNlTWFya2Rvd24oITApO3BhcnNlSW5saW5lPXRoaXMucGFyc2VNYXJrZG93bighMSk7UGFyc2VyPWI7UmVuZGVyZXI9UDtUZXh0UmVuZGVyZXI9JDtMZXhlcj14O1Rva2VuaXplcj15O0hvb2tzPVM7Y29uc3RydWN0b3IoLi4uZSl7dGhpcy51c2UoLi4uZSl9d2Fsa1Rva2VucyhlLHQpe2xldCBuPVtdO2ZvcihsZXQgciBvZiBlKXN3aXRjaChuPW4uY29uY2F0KHQuY2FsbCh0aGlzLHIpKSxyLnR5cGUpe2Nhc2VcInRhYmxlXCI6e2xldCBpPXI7Zm9yKGxldCBzIG9mIGkuaGVhZGVyKW49bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKHMudG9rZW5zLHQpKTtmb3IobGV0IHMgb2YgaS5yb3dzKWZvcihsZXQgYSBvZiBzKW49bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGEudG9rZW5zLHQpKTticmVha31jYXNlXCJsaXN0XCI6e2xldCBpPXI7bj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoaS5pdGVtcyx0KSk7YnJlYWt9ZGVmYXVsdDp7bGV0IGk9cjt0aGlzLmRlZmF1bHRzLmV4dGVuc2lvbnM/LmNoaWxkVG9rZW5zPy5baS50eXBlXT90aGlzLmRlZmF1bHRzLmV4dGVuc2lvbnMuY2hpbGRUb2tlbnNbaS50eXBlXS5mb3JFYWNoKHM9PntsZXQgYT1pW3NdLmZsYXQoMS8wKTtuPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhhLHQpKX0pOmkudG9rZW5zJiYobj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoaS50b2tlbnMsdCkpKX19cmV0dXJuIG59dXNlKC4uLmUpe2xldCB0PXRoaXMuZGVmYXVsdHMuZXh0ZW5zaW9uc3x8e3JlbmRlcmVyczp7fSxjaGlsZFRva2Vuczp7fX07cmV0dXJuIGUuZm9yRWFjaChuPT57bGV0IHI9ey4uLm59O2lmKHIuYXN5bmM9dGhpcy5kZWZhdWx0cy5hc3luY3x8ci5hc3luY3x8ITEsbi5leHRlbnNpb25zJiYobi5leHRlbnNpb25zLmZvckVhY2goaT0+e2lmKCFpLm5hbWUpdGhyb3cgbmV3IEVycm9yKFwiZXh0ZW5zaW9uIG5hbWUgcmVxdWlyZWRcIik7aWYoXCJyZW5kZXJlclwiaW4gaSl7bGV0IHM9dC5yZW5kZXJlcnNbaS5uYW1lXTtzP3QucmVuZGVyZXJzW2kubmFtZV09ZnVuY3Rpb24oLi4uYSl7bGV0IG89aS5yZW5kZXJlci5hcHBseSh0aGlzLGEpO3JldHVybiBvPT09ITEmJihvPXMuYXBwbHkodGhpcyxhKSksb306dC5yZW5kZXJlcnNbaS5uYW1lXT1pLnJlbmRlcmVyfWlmKFwidG9rZW5pemVyXCJpbiBpKXtpZighaS5sZXZlbHx8aS5sZXZlbCE9PVwiYmxvY2tcIiYmaS5sZXZlbCE9PVwiaW5saW5lXCIpdGhyb3cgbmV3IEVycm9yKFwiZXh0ZW5zaW9uIGxldmVsIG11c3QgYmUgJ2Jsb2NrJyBvciAnaW5saW5lJ1wiKTtsZXQgcz10W2kubGV2ZWxdO3M/cy51bnNoaWZ0KGkudG9rZW5pemVyKTp0W2kubGV2ZWxdPVtpLnRva2VuaXplcl0saS5zdGFydCYmKGkubGV2ZWw9PT1cImJsb2NrXCI/dC5zdGFydEJsb2NrP3Quc3RhcnRCbG9jay5wdXNoKGkuc3RhcnQpOnQuc3RhcnRCbG9jaz1baS5zdGFydF06aS5sZXZlbD09PVwiaW5saW5lXCImJih0LnN0YXJ0SW5saW5lP3Quc3RhcnRJbmxpbmUucHVzaChpLnN0YXJ0KTp0LnN0YXJ0SW5saW5lPVtpLnN0YXJ0XSkpfVwiY2hpbGRUb2tlbnNcImluIGkmJmkuY2hpbGRUb2tlbnMmJih0LmNoaWxkVG9rZW5zW2kubmFtZV09aS5jaGlsZFRva2Vucyl9KSxyLmV4dGVuc2lvbnM9dCksbi5yZW5kZXJlcil7bGV0IGk9dGhpcy5kZWZhdWx0cy5yZW5kZXJlcnx8bmV3IFAodGhpcy5kZWZhdWx0cyk7Zm9yKGxldCBzIGluIG4ucmVuZGVyZXIpe2lmKCEocyBpbiBpKSl0aHJvdyBuZXcgRXJyb3IoYHJlbmRlcmVyICcke3N9JyBkb2VzIG5vdCBleGlzdGApO2lmKFtcIm9wdGlvbnNcIixcInBhcnNlclwiXS5pbmNsdWRlcyhzKSljb250aW51ZTtsZXQgYT1zLG89bi5yZW5kZXJlclthXSxsPWlbYV07aVthXT0oLi4ucCk9PntsZXQgYz1vLmFwcGx5KGkscCk7cmV0dXJuIGM9PT0hMSYmKGM9bC5hcHBseShpLHApKSxjfHxcIlwifX1yLnJlbmRlcmVyPWl9aWYobi50b2tlbml6ZXIpe2xldCBpPXRoaXMuZGVmYXVsdHMudG9rZW5pemVyfHxuZXcgeSh0aGlzLmRlZmF1bHRzKTtmb3IobGV0IHMgaW4gbi50b2tlbml6ZXIpe2lmKCEocyBpbiBpKSl0aHJvdyBuZXcgRXJyb3IoYHRva2VuaXplciAnJHtzfScgZG9lcyBub3QgZXhpc3RgKTtpZihbXCJvcHRpb25zXCIsXCJydWxlc1wiLFwibGV4ZXJcIl0uaW5jbHVkZXMocykpY29udGludWU7bGV0IGE9cyxvPW4udG9rZW5pemVyW2FdLGw9aVthXTtpW2FdPSguLi5wKT0+e2xldCBjPW8uYXBwbHkoaSxwKTtyZXR1cm4gYz09PSExJiYoYz1sLmFwcGx5KGkscCkpLGN9fXIudG9rZW5pemVyPWl9aWYobi5ob29rcyl7bGV0IGk9dGhpcy5kZWZhdWx0cy5ob29rc3x8bmV3IFM7Zm9yKGxldCBzIGluIG4uaG9va3Mpe2lmKCEocyBpbiBpKSl0aHJvdyBuZXcgRXJyb3IoYGhvb2sgJyR7c30nIGRvZXMgbm90IGV4aXN0YCk7aWYoW1wib3B0aW9uc1wiLFwiYmxvY2tcIl0uaW5jbHVkZXMocykpY29udGludWU7bGV0IGE9cyxvPW4uaG9va3NbYV0sbD1pW2FdO1MucGFzc1Rocm91Z2hIb29rcy5oYXMocyk/aVthXT1wPT57aWYodGhpcy5kZWZhdWx0cy5hc3luYyYmUy5wYXNzVGhyb3VnaEhvb2tzUmVzcGVjdEFzeW5jLmhhcyhzKSlyZXR1cm4oYXN5bmMoKT0+e2xldCBnPWF3YWl0IG8uY2FsbChpLHApO3JldHVybiBsLmNhbGwoaSxnKX0pKCk7bGV0IGM9by5jYWxsKGkscCk7cmV0dXJuIGwuY2FsbChpLGMpfTppW2FdPSguLi5wKT0+e2lmKHRoaXMuZGVmYXVsdHMuYXN5bmMpcmV0dXJuKGFzeW5jKCk9PntsZXQgZz1hd2FpdCBvLmFwcGx5KGkscCk7cmV0dXJuIGc9PT0hMSYmKGc9YXdhaXQgbC5hcHBseShpLHApKSxnfSkoKTtsZXQgYz1vLmFwcGx5KGkscCk7cmV0dXJuIGM9PT0hMSYmKGM9bC5hcHBseShpLHApKSxjfX1yLmhvb2tzPWl9aWYobi53YWxrVG9rZW5zKXtsZXQgaT10aGlzLmRlZmF1bHRzLndhbGtUb2tlbnMscz1uLndhbGtUb2tlbnM7ci53YWxrVG9rZW5zPWZ1bmN0aW9uKGEpe2xldCBvPVtdO3JldHVybiBvLnB1c2gocy5jYWxsKHRoaXMsYSkpLGkmJihvPW8uY29uY2F0KGkuY2FsbCh0aGlzLGEpKSksb319dGhpcy5kZWZhdWx0cz17Li4udGhpcy5kZWZhdWx0cywuLi5yfX0pLHRoaXN9c2V0T3B0aW9ucyhlKXtyZXR1cm4gdGhpcy5kZWZhdWx0cz17Li4udGhpcy5kZWZhdWx0cywuLi5lfSx0aGlzfWxleGVyKGUsdCl7cmV0dXJuIHgubGV4KGUsdD8/dGhpcy5kZWZhdWx0cyl9cGFyc2VyKGUsdCl7cmV0dXJuIGIucGFyc2UoZSx0Pz90aGlzLmRlZmF1bHRzKX1wYXJzZU1hcmtkb3duKGUpe3JldHVybihuLHIpPT57bGV0IGk9ey4uLnJ9LHM9ey4uLnRoaXMuZGVmYXVsdHMsLi4uaX0sYT10aGlzLm9uRXJyb3IoISFzLnNpbGVudCwhIXMuYXN5bmMpO2lmKHRoaXMuZGVmYXVsdHMuYXN5bmM9PT0hMCYmaS5hc3luYz09PSExKXJldHVybiBhKG5ldyBFcnJvcihcIm1hcmtlZCgpOiBUaGUgYXN5bmMgb3B0aW9uIHdhcyBzZXQgdG8gdHJ1ZSBieSBhbiBleHRlbnNpb24uIFJlbW92ZSBhc3luYzogZmFsc2UgZnJvbSB0aGUgcGFyc2Ugb3B0aW9ucyBvYmplY3QgdG8gcmV0dXJuIGEgUHJvbWlzZS5cIikpO2lmKHR5cGVvZiBuPlwidVwifHxuPT09bnVsbClyZXR1cm4gYShuZXcgRXJyb3IoXCJtYXJrZWQoKTogaW5wdXQgcGFyYW1ldGVyIGlzIHVuZGVmaW5lZCBvciBudWxsXCIpKTtpZih0eXBlb2YgbiE9XCJzdHJpbmdcIilyZXR1cm4gYShuZXcgRXJyb3IoXCJtYXJrZWQoKTogaW5wdXQgcGFyYW1ldGVyIGlzIG9mIHR5cGUgXCIrT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG4pK1wiLCBzdHJpbmcgZXhwZWN0ZWRcIikpO2lmKHMuaG9va3MmJihzLmhvb2tzLm9wdGlvbnM9cyxzLmhvb2tzLmJsb2NrPWUpLHMuYXN5bmMpcmV0dXJuKGFzeW5jKCk9PntsZXQgbz1zLmhvb2tzP2F3YWl0IHMuaG9va3MucHJlcHJvY2VzcyhuKTpuLHA9YXdhaXQocy5ob29rcz9hd2FpdCBzLmhvb2tzLnByb3ZpZGVMZXhlcigpOmU/eC5sZXg6eC5sZXhJbmxpbmUpKG8scyksYz1zLmhvb2tzP2F3YWl0IHMuaG9va3MucHJvY2Vzc0FsbFRva2VucyhwKTpwO3Mud2Fsa1Rva2VucyYmYXdhaXQgUHJvbWlzZS5hbGwodGhpcy53YWxrVG9rZW5zKGMscy53YWxrVG9rZW5zKSk7bGV0IGg9YXdhaXQocy5ob29rcz9hd2FpdCBzLmhvb2tzLnByb3ZpZGVQYXJzZXIoKTplP2IucGFyc2U6Yi5wYXJzZUlubGluZSkoYyxzKTtyZXR1cm4gcy5ob29rcz9hd2FpdCBzLmhvb2tzLnBvc3Rwcm9jZXNzKGgpOmh9KSgpLmNhdGNoKGEpO3RyeXtzLmhvb2tzJiYobj1zLmhvb2tzLnByZXByb2Nlc3MobikpO2xldCBsPShzLmhvb2tzP3MuaG9va3MucHJvdmlkZUxleGVyKCk6ZT94LmxleDp4LmxleElubGluZSkobixzKTtzLmhvb2tzJiYobD1zLmhvb2tzLnByb2Nlc3NBbGxUb2tlbnMobCkpLHMud2Fsa1Rva2VucyYmdGhpcy53YWxrVG9rZW5zKGwscy53YWxrVG9rZW5zKTtsZXQgYz0ocy5ob29rcz9zLmhvb2tzLnByb3ZpZGVQYXJzZXIoKTplP2IucGFyc2U6Yi5wYXJzZUlubGluZSkobCxzKTtyZXR1cm4gcy5ob29rcyYmKGM9cy5ob29rcy5wb3N0cHJvY2VzcyhjKSksY31jYXRjaChvKXtyZXR1cm4gYShvKX19fW9uRXJyb3IoZSx0KXtyZXR1cm4gbj0+e2lmKG4ubWVzc2FnZSs9YFxuUGxlYXNlIHJlcG9ydCB0aGlzIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWQuYCxlKXtsZXQgcj1cIjxwPkFuIGVycm9yIG9jY3VycmVkOjwvcD48cHJlPlwiK3cobi5tZXNzYWdlK1wiXCIsITApK1wiPC9wcmU+XCI7cmV0dXJuIHQ/UHJvbWlzZS5yZXNvbHZlKHIpOnJ9aWYodClyZXR1cm4gUHJvbWlzZS5yZWplY3Qobik7dGhyb3cgbn19fTt2YXIgXz1uZXcgQjtmdW5jdGlvbiBkKHUsZSl7cmV0dXJuIF8ucGFyc2UodSxlKX1kLm9wdGlvbnM9ZC5zZXRPcHRpb25zPWZ1bmN0aW9uKHUpe3JldHVybiBfLnNldE9wdGlvbnModSksZC5kZWZhdWx0cz1fLmRlZmF1bHRzLFooZC5kZWZhdWx0cyksZH07ZC5nZXREZWZhdWx0cz1MO2QuZGVmYXVsdHM9VDtkLnVzZT1mdW5jdGlvbiguLi51KXtyZXR1cm4gXy51c2UoLi4udSksZC5kZWZhdWx0cz1fLmRlZmF1bHRzLFooZC5kZWZhdWx0cyksZH07ZC53YWxrVG9rZW5zPWZ1bmN0aW9uKHUsZSl7cmV0dXJuIF8ud2Fsa1Rva2Vucyh1LGUpfTtkLnBhcnNlSW5saW5lPV8ucGFyc2VJbmxpbmU7ZC5QYXJzZXI9YjtkLnBhcnNlcj1iLnBhcnNlO2QuUmVuZGVyZXI9UDtkLlRleHRSZW5kZXJlcj0kO2QuTGV4ZXI9eDtkLmxleGVyPXgubGV4O2QuVG9rZW5pemVyPXk7ZC5Ib29rcz1TO2QucGFyc2U9ZDt2YXIgRHQ9ZC5vcHRpb25zLEh0PWQuc2V0T3B0aW9ucyxadD1kLnVzZSxHdD1kLndhbGtUb2tlbnMsTnQ9ZC5wYXJzZUlubGluZSxRdD1kLEZ0PWIucGFyc2UsanQ9eC5sZXg7ZXhwb3J0e1MgYXMgSG9va3MseCBhcyBMZXhlcixCIGFzIE1hcmtlZCxiIGFzIFBhcnNlcixQIGFzIFJlbmRlcmVyLCQgYXMgVGV4dFJlbmRlcmVyLHkgYXMgVG9rZW5pemVyLFQgYXMgZGVmYXVsdHMsTCBhcyBnZXREZWZhdWx0cyxqdCBhcyBsZXhlcixkIGFzIG1hcmtlZCxEdCBhcyBvcHRpb25zLFF0IGFzIHBhcnNlLE50IGFzIHBhcnNlSW5saW5lLEZ0IGFzIHBhcnNlcixIdCBhcyBzZXRPcHRpb25zLFp0IGFzIHVzZSxHdCBhcyB3YWxrVG9rZW5zfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hcmtlZC5lc20uanMubWFwXG4iLCJpbXBvcnQgRE9NUHVyaWZ5IGZyb20gXCJkb21wdXJpZnlcIjtcbmltcG9ydCB7IG1hcmtlZCB9IGZyb20gXCJtYXJrZWRcIjtcblxuLyoqXG4gKiBDb250ZW50IGZvcm1hdCB0eXBlc1xuICovXG5leHBvcnQgdHlwZSBDb250ZW50Rm9ybWF0ID0gXCJodG1sXCIgfCBcIm1hcmtkb3duXCIgfCBcInRleHRcIjtcbi8qKlxuICogQ29uZmlndXJhdGlvbiBmb3IgSFRNTCBzYW5pdGl6YXRpb25cbiAqIFVwZGF0ZWQgZm9yIEZBUSBjb250ZW50OiBQcmlvcml0aXplcyBzYWZlLCByZWFkYWJsZSByaWNoIHRleHQgd2l0aCBmdWxsIGxpbmsgc3VwcG9ydC5cbiAqIEVuaGFuY2VzIHRhYmxlIHN1cHBvcnQgKGluY2x1ZGluZyBjYXB0aW9ucyBhbmQgc3RydWN0dXJhbCBhdHRyaWJ1dGVzIGZvciBiZXR0ZXIgYWNjZXNzaWJpbGl0eS9jb21wbGV4aXR5KS5cbiAqIEFkZHMgb3B0aW9uYWwgdmlkZW8gc3VwcG9ydCAoY29tbWVudGVkIG91dCBieSBkZWZhdWx04oCUdW5jb21tZW50IGlmIGVtYmVkZGluZyB2aWRlb3MgaXMgZGVzaXJlZCBmb3IgRkFRcztcbiAqIG5vdGU6IHRoaXMgaW5jcmVhc2VzIHNlY3VyaXR5IHJldmlldyBuZWVkcyBkdWUgdG8gcG90ZW50aWFsIGV4ZWN1dGFibGUgY29udGVudCkuXG4gKiBSZW1vdmVzIGhlYWRpbmdzIChoMS1oNikgYXMgdGhleSdyZSBsaWtlbHkgdW5uZWNlc3NhcnkgZm9yIEZBUSByZXNwb25zZXMuXG4gKiBSZXRhaW5zIGNvcmUgZm9ybWF0dGluZywgbGlzdHMsIGltYWdlcywgYW5kIHRhYmxlcyBmb3Igc3RydWN0dXJlZCBhbnN3ZXJzLlxuICovXG5jb25zdCBTQU5JVElaRV9DT05GSUcgPSB7XG4gICAgQUxMT1dFRF9UQUdTOiBbXG4gICAgICAgIFwicFwiLFxuICAgICAgICBcImJyXCIsXG4gICAgICAgIFwic3Ryb25nXCIsXG4gICAgICAgIFwiZW1cIixcbiAgICAgICAgXCJ1XCIsXG4gICAgICAgIFwic1wiLFxuICAgICAgICBcImJcIixcbiAgICAgICAgXCJpXCIsXG4gICAgICAgIFwiYVwiLFxuICAgICAgICBcInVsXCIsXG4gICAgICAgIFwib2xcIixcbiAgICAgICAgXCJsaVwiLFxuICAgICAgICBcImNvZGVcIixcbiAgICAgICAgXCJwcmVcIixcbiAgICAgICAgXCJoclwiLFxuICAgICAgICBcInRhYmxlXCIsXG4gICAgICAgIFwiY2FwdGlvblwiLCAgLy8gQWRkZWQgZm9yIHRhYmxlIHRpdGxlcy9kZXNjcmlwdGlvbnNcbiAgICAgICAgXCJ0aGVhZFwiLFxuICAgICAgICBcInRib2R5XCIsXG4gICAgICAgIFwidGZvb3RcIiwgICAgLy8gQWRkZWQgZm9yIHRhYmxlIGZvb3RlcnMgKGUuZy4sIHN1bW1hcmllcy90b3RhbHMpXG4gICAgICAgIFwidHJcIixcbiAgICAgICAgXCJ0aFwiLFxuICAgICAgICBcInRkXCIsXG4gICAgICAgIFwiY29sXCIsICAgICAgLy8gQWRkZWQgZm9yIGNvbHVtbiBwcm9wZXJ0aWVzXG4gICAgICAgIFwiY29sZ3JvdXBcIiwgLy8gQWRkZWQgZm9yIGdyb3VwaW5nIGNvbHVtbnNcbiAgICAgICAgXCJpbWdcIixcbiAgICAgICAgXCJkaXZcIixcbiAgICAgICAgXCJzcGFuXCIsXG4gICAgICAgIFwidmlkZW9cIiwgIC8vIFVuY29tbWVudCB0byBlbmFibGUgPHZpZGVvPiBmb3IgZW1iZWRkZWQgdmlkZW9zXG4gICAgICAgIFwic291cmNlXCIsIC8vIFVuY29tbWVudCBpZiBlbmFibGluZyB2aWRlbyAoZm9yIDx2aWRlbz4gc291cmNlcylcbiAgICAgICAgXCJmaWd1cmVcIiwgLy8gT3B0aW9uYWw6IEZvciB3cmFwcGluZyBpbWFnZXMvdGFibGVzIHdpdGggY2FwdGlvbnNcbiAgICAgICAgXCJmaWdjYXB0aW9uXCIgLy8gT3B0aW9uYWw6IEZvciBmaWd1cmUgZGVzY3JpcHRpb25zXG4gICAgXSxcbiAgICBBTExPV0VEX0FUVFI6IFtcbiAgICAgICAgXCJocmVmXCIsXG4gICAgICAgIFwidGl0bGVcIixcbiAgICAgICAgXCJ0YXJnZXRcIixcbiAgICAgICAgXCJyZWxcIixcbiAgICAgICAgXCJzcmNcIixcbiAgICAgICAgXCJhbHRcIixcbiAgICAgICAgXCJ3aWR0aFwiLFxuICAgICAgICBcImhlaWdodFwiLFxuICAgICAgICBcImNsYXNzXCIsXG4gICAgICAgIFwiaWRcIixcbiAgICAgICAgXCJzdHlsZVwiLFxuICAgICAgICAvLyBUYWJsZS1zcGVjaWZpYyBhdHRyaWJ1dGVzIGZvciBzdHJ1Y3R1cmUgYW5kIGFjY2Vzc2liaWxpdHlcbiAgICAgICAgXCJyb3dzcGFuXCIsXG4gICAgICAgIFwiY29sc3BhblwiLFxuICAgICAgICBcInNjb3BlXCIsICAgIC8vIEZvciA8dGg+IChlLmcuLCByb3csIGNvbCwgcm93Z3JvdXApXG4gICAgICAgIFwiaGVhZGVyc1wiLCAgLy8gRm9yIGFzc29jaWF0aW5nIDx0ZD4gd2l0aCA8dGg+XG4gICAgICAgIC8vIFZpZGVvLXNwZWNpZmljICh1bmNvbW1lbnQgaWYgZW5hYmxpbmcgdmlkZW8pXG4gICAgICAgIFwiY29udHJvbHNcIixcbiAgICAgICAgXCJhdXRvcGxheVwiLFxuICAgICAgICBcImxvb3BcIixcbiAgICAgICAgXCJtdXRlZFwiLFxuICAgICAgICBcInBvc3RlclwiXG4gICAgXSxcbiAgICBBTExPV19EQVRBX0FUVFI6IGZhbHNlLCAgLy8gS2VlcCBmYWxzZSBmb3Igc2VjdXJpdHk7IGVuYWJsZSBvbmx5IGlmIGN1c3RvbSBkYXRhIGF0dHJzIGFyZSB2ZXR0ZWRcbiAgICBBTExPV0VEX1VSSV9SRUdFWFA6IC9eKD86KD86KD86ZnxodCl0cHM/fG1haWx0b3x0ZWx8Y2FsbHRvfHNtc3xjaWR8eG1wcCk6fFteYS16XXxbYS16Ky5cXC1dKyg/OlteYS16Ky5cXC06XXwkKSkvaVxufTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIHNhbml0aXplcyBIVE1MIGNvbnRlbnRcbiAqIEBwYXJhbSBodG1sIC0gVGhlIEhUTUwgc3RyaW5nIHRvIHNhbml0aXplXG4gKiBAcmV0dXJucyBTYW5pdGl6ZWQgSFRNTCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplSFRNTChodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghaHRtbCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBDb25maWd1cmUgRE9NUHVyaWZ5XG4gICAgICAgIGNvbnN0IGNsZWFuSFRNTCA9IERPTVB1cmlmeS5zYW5pdGl6ZShodG1sLCBTQU5JVElaRV9DT05GSUcpO1xuICAgICAgICByZXR1cm4gY2xlYW5IVE1MO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzYW5pdGl6aW5nIEhUTUw6XCIsIGVycm9yKTtcbiAgICAgICAgLy8gUmV0dXJuIGVzY2FwZWQgdGV4dCBhcyBmYWxsYmFja1xuICAgICAgICByZXR1cm4gZXNjYXBlSFRNTChodG1sKTtcbiAgICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIEhUTUwgY29udGVudCBhbmQgcmV0dXJucyB2YWxpZGF0aW9uIGVycm9yc1xuICogQHBhcmFtIGh0bWwgLSBUaGUgSFRNTCBzdHJpbmcgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm5zIEFycmF5IG9mIHZhbGlkYXRpb24gZXJyb3IgbWVzc2FnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSFRNTChodG1sOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKCFodG1sKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHNjcmlwdCB0YWdzIChzaG91bGQgYmUgYmxvY2tlZClcbiAgICBpZiAoLzxzY3JpcHRbXj5dKj5bXFxzXFxTXSo/PFxcL3NjcmlwdD4vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIlNjcmlwdCB0YWdzIGFyZSBub3QgYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29uc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgZXZlbnQgaGFuZGxlcnMgKHNob3VsZCBiZSBibG9ja2VkKVxuICAgIGlmICgvb25cXHcrXFxzKj0vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIkV2ZW50IGhhbmRsZXJzIChvbmNsaWNrLCBvbmxvYWQsIGV0Yy4pIGFyZSBub3QgYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29uc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgamF2YXNjcmlwdDogcHJvdG9jb2xcbiAgICBpZiAoL2phdmFzY3JpcHQ6L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJKYXZhU2NyaXB0IHByb3RvY29sIGluIFVSTHMgaXMgbm90IGFsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGRhdGE6IHByb3RvY29sIChleGNlcHQgZm9yIGltYWdlcylcbiAgICBpZiAoL2RhdGE6KD8haW1hZ2UpL2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJEYXRhIFVSTHMgYXJlIG9ubHkgYWxsb3dlZCBmb3IgaW1hZ2VzXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBpZnJhbWUgKG5vdCBpbiBhbGxvd2VkIHRhZ3MpXG4gICAgaWYgKC88aWZyYW1lW14+XSo+L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJJZnJhbWUgdGFncyBhcmUgbm90IGFsbG93ZWRcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG9iamVjdCBhbmQgZW1iZWQgdGFnc1xuICAgIGlmICgvPChvYmplY3R8ZW1iZWQpW14+XSo+L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJPYmplY3QgYW5kIGVtYmVkIHRhZ3MgYXJlIG5vdCBhbGxvd2VkXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJvcnM7XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIEhUTUwgc3ludGF4IGZvciBtYWxmb3JtZWQgbWFya3VwXG4gKiBAcGFyYW0gaHRtbCAtIFRoZSBIVE1MIHN0cmluZyB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgQXJyYXkgb2Ygc3ludGF4IGVycm9yIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUhUTUxTeW50YXgoaHRtbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmICghaHRtbCkge1xuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBhdHRyaWJ1dGUgcXVvdGVzXG4gICAgLy8gTWF0Y2hlczogYXR0cj1cIiBvciBhdHRyPScgd2l0aG91dCBjbG9zaW5nIHF1b3RlIGJlZm9yZSA+IG9yIGFub3RoZXIgYXR0cmlidXRlXG4gICAgY29uc3QgdW5jbG9zZWRRdW90ZVBhdHRlcm4gPSAvKFxcdyspXFxzKj1cXHMqW1wiJ10oPzpbXlwiJz5dKig/OltcIiddW15cIic+XStbXCInXSkqW15cIic+XSopPyg/PVteXCInPl0qPikvZztcbiAgICBjb25zdCBhbGxUYWdzID0gaHRtbC5tYXRjaCgvPFtePl0rPi9nKSB8fCBbXTtcbiAgICBcbiAgICBhbGxUYWdzLmZvckVhY2godGFnID0+IHtcbiAgICAgICAgLy8gQ2hlY2sgZm9yIGF0dHJpYnV0ZXMgd2l0aCB1bmNsb3NlZCBxdW90ZXNcbiAgICAgICAgLy8gTG9vayBmb3IgYXR0cj1cIiBvciBhdHRyPScgdGhhdCBkb2Vzbid0IGhhdmUgYSBtYXRjaGluZyBjbG9zaW5nIHF1b3RlXG4gICAgICAgIGNvbnN0IHNpbmdsZVF1b3RlTWF0Y2hlcyA9IHRhZy5tYXRjaCgvXFx3K1xccyo9XFxzKidbXiddKiQvKTtcbiAgICAgICAgY29uc3QgZG91YmxlUXVvdGVNYXRjaGVzID0gdGFnLm1hdGNoKC9cXHcrXFxzKj1cXHMqXCJbXlwiXSokLyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoc2luZ2xlUXVvdGVNYXRjaGVzIHx8IGRvdWJsZVF1b3RlTWF0Y2hlcykge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goYFVuY2xvc2VkIGF0dHJpYnV0ZSBxdW90ZSBpbiB0YWc6ICR7dGFnLnN1YnN0cmluZygwLCA1MCl9JHt0YWcubGVuZ3RoID4gNTAgPyAnLi4uJyA6ICcnfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIG9wZW5pbmcgdGFnIChtaXNzaW5nID4pXG4gICAgICAgIGlmICh0YWcuc3RhcnRzV2l0aCgnPCcpICYmICF0YWcuZW5kc1dpdGgoJz4nKSkge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goYFVuY2xvc2VkIHRhZyBicmFja2V0OiAke3RhZy5zdWJzdHJpbmcoMCwgNTApfSR7dGFnLmxlbmd0aCA+IDUwID8gJy4uLicgOiAnJ31gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGJhbGFuY2VkIHRhZ3MgKG9wZW5pbmcgYW5kIGNsb3NpbmcpXG4gICAgLy8gU2VsZi1jbG9zaW5nIHRhZ3MgdGhhdCBkb24ndCBuZWVkIGNsb3NpbmcgdGFnc1xuICAgIGNvbnN0IHNlbGZDbG9zaW5nVGFncyA9IFsnYXJlYScsICdiYXNlJywgJ2JyJywgJ2NvbCcsICdlbWJlZCcsICdocicsICdpbWcnLCAnaW5wdXQnLCAnbGluaycsICdtZXRhJywgJ3BhcmFtJywgJ3NvdXJjZScsICd0cmFjaycsICd3YnInXTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IGFsbCB0YWdzIChvcGVuaW5nIGFuZCBjbG9zaW5nKVxuICAgIGNvbnN0IHRhZ1N0YWNrOiBBcnJheTx7IHRhZzogc3RyaW5nOyBwb3NpdGlvbjogbnVtYmVyIH0+ID0gW107XG4gICAgY29uc3QgdGFnUmVnZXggPSAvPFxcLz8oW2EtekEtWl1bYS16QS1aMC05XSopW14+XSo+L2c7XG4gICAgbGV0IG1hdGNoO1xuXG4gICAgd2hpbGUgKChtYXRjaCA9IHRhZ1JlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGZ1bGxUYWcgPSBtYXRjaFswXTtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IGlzQ2xvc2luZyA9IGZ1bGxUYWcuc3RhcnRzV2l0aCgnPC8nKTtcbiAgICAgICAgY29uc3QgaXNTZWxmQ2xvc2luZyA9IGZ1bGxUYWcuZW5kc1dpdGgoJy8+JykgfHwgc2VsZkNsb3NpbmdUYWdzLmluY2x1ZGVzKHRhZ05hbWUpO1xuXG4gICAgICAgIGlmIChpc0Nsb3NpbmcpIHtcbiAgICAgICAgICAgIC8vIENsb3NpbmcgdGFnIC0gcG9wIGZyb20gc3RhY2tcbiAgICAgICAgICAgIGlmICh0YWdTdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgT3JwaGFuZWQgY2xvc2luZyB0YWc6IDwvJHt0YWdOYW1lfT5gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFzdE9wZW5lZCA9IHRhZ1N0YWNrW3RhZ1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmIChsYXN0T3BlbmVkLnRhZyA9PT0gdGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0YWdTdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBNaXNtYXRjaGVkIHRhZ1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgTWlzbWF0Y2hlZCB0YWdzOiBFeHBlY3RlZCBjbG9zaW5nIHRhZyBmb3IgPCR7bGFzdE9wZW5lZC50YWd9PiwgZm91bmQgPC8ke3RhZ05hbWV9PmApO1xuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gZmluZCBtYXRjaGluZyBvcGVuaW5nIHRhZyBpbiBzdGFja1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaEluZGV4ID0gdGFnU3RhY2suZmluZEluZGV4KHQgPT4gdC50YWcgPT09IHRhZ05hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdTdGFjay5zcGxpY2UobWF0Y2hJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzU2VsZkNsb3NpbmcpIHtcbiAgICAgICAgICAgIC8vIE9wZW5pbmcgdGFnIC0gcHVzaCB0byBzdGFja1xuICAgICAgICAgICAgdGFnU3RhY2sucHVzaCh7IHRhZzogdGFnTmFtZSwgcG9zaXRpb246IG1hdGNoLmluZGV4IH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIHRhZ3MgcmVtYWluaW5nIGluIHN0YWNrXG4gICAgaWYgKHRhZ1N0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGFnU3RhY2suZm9yRWFjaCgoeyB0YWcgfSkgPT4ge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goYFVuY2xvc2VkIHRhZzogPCR7dGFnfT4gaXMgbWlzc2luZyBjbG9zaW5nIHRhZyA8LyR7dGFnfT5gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG1hbGZvcm1lZCBhdHRyaWJ1dGVzIChubyB2YWx1ZSwgbWFsZm9ybWVkIHN5bnRheClcbiAgICBjb25zdCBtYWxmb3JtZWRBdHRyUGF0dGVybiA9IC88W14+XStcXHMrKFxcdyspXFxzKj1cXHMqKD8hW1wiXFx3XSlbXj5dKj4vZztcbiAgICBsZXQgYXR0ck1hdGNoO1xuICAgIHdoaWxlICgoYXR0ck1hdGNoID0gbWFsZm9ybWVkQXR0clBhdHRlcm4uZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goYE1hbGZvcm1lZCBhdHRyaWJ1dGUgc3ludGF4OiAke2F0dHJNYXRjaFswXS5zdWJzdHJpbmcoMCwgNTApfSR7YXR0ck1hdGNoWzBdLmxlbmd0aCA+IDUwID8gJy4uLicgOiAnJ31gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3JzO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIG1hcmtkb3duIHRvIEhUTUxcbiAqIEBwYXJhbSBtYXJrZG93biAtIFRoZSBtYXJrZG93biBzdHJpbmcgdG8gY29udmVydFxuICogQHJldHVybnMgSFRNTCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtkb3duVG9IVE1MKG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghbWFya2Rvd24pIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gQ29uZmlndXJlIG1hcmtlZCBmb3Igc2VjdXJpdHlcbiAgICAgICAgbWFya2VkLnNldE9wdGlvbnMoe1xuICAgICAgICAgICAgYnJlYWtzOiB0cnVlLFxuICAgICAgICAgICAgZ2ZtOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGh0bWwgPSBtYXJrZWQucGFyc2UobWFya2Rvd24pIGFzIHN0cmluZztcbiAgICAgICAgLy8gU2FuaXRpemUgdGhlIGdlbmVyYXRlZCBIVE1MXG4gICAgICAgIHJldHVybiBzYW5pdGl6ZUhUTUwoaHRtbCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHBhcnNpbmcgbWFya2Rvd246XCIsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGVzY2FwZUhUTUwobWFya2Rvd24pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBFc2NhcGVzIEhUTUwgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gKiBAcGFyYW0gdGV4dCAtIFRoZSB0ZXh0IHRvIGVzY2FwZVxuICogQHJldHVybnMgRXNjYXBlZCB0ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVIVE1MKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBkaXYudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgIHJldHVybiBkaXYuaW5uZXJIVE1MO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHBsYWluIHRleHQgdG8gSFRNTCB3aXRoIGxpbmUgYnJlYWtzXG4gKiBAcGFyYW0gdGV4dCAtIFRoZSBwbGFpbiB0ZXh0IHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIEhUTUwgc3RyaW5nIHdpdGggbGluZSBicmVha3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRUb0hUTUwodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgLy8gRXNjYXBlIEhUTUwgY2hhcmFjdGVycyBhbmQgY29udmVydCBsaW5lIGJyZWFrcyB0byA8YnI+XG4gICAgY29uc3QgZXNjYXBlZCA9IGVzY2FwZUhUTUwodGV4dCk7XG4gICAgcmV0dXJuIGVzY2FwZWQucmVwbGFjZSgvXFxuL2csIFwiPGJyPlwiKTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgY29udGVudCBiYXNlZCBvbiBmb3JtYXQgYW5kIHJldHVybnMgc2FuaXRpemVkIEhUTUxcbiAqIEBwYXJhbSBjb250ZW50IC0gVGhlIGNvbnRlbnQgc3RyaW5nXG4gKiBAcGFyYW0gZm9ybWF0IC0gVGhlIGNvbnRlbnQgZm9ybWF0IChodG1sLCBtYXJrZG93biwgb3IgdGV4dClcbiAqIEByZXR1cm5zIFNhbml0aXplZCBIVE1MIHN0cmluZyBvciBlc2NhcGVkIG1hcmtkb3duXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzQ29udGVudChjb250ZW50OiBzdHJpbmcsIGZvcm1hdDogQ29udGVudEZvcm1hdCk6IHN0cmluZyB7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgIGNhc2UgXCJodG1sXCI6XG4gICAgICAgICAgICByZXR1cm4gc2FuaXRpemVIVE1MKGNvbnRlbnQpO1xuICAgICAgICBjYXNlIFwibWFya2Rvd25cIjpcbiAgICAgICAgICAgIC8vIENvbnZlcnQgbWFya2Rvd24gdG8gSFRNTCBhbmQgc2FuaXRpemUgaXRcbiAgICAgICAgICAgIHJldHVybiBtYXJrZG93blRvSFRNTChjb250ZW50KTtcbiAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgIHJldHVybiB0ZXh0VG9IVE1MKGNvbnRlbnQpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVW5yZWNvZ25pemVkIGZvcm1hdCAtIHRyZWF0IGFzIEhUTUwgYW5kIHNhbml0aXplIGZvciBzYWZldHlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5yZWNvZ25pemVkIGNvbnRlbnQgZm9ybWF0IFwiJHtmb3JtYXR9XCIsIHRyZWF0aW5nIGFzIEhUTUxgKTtcbiAgICAgICAgICAgIHJldHVybiBzYW5pdGl6ZUhUTUwoY29udGVudCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldHMgdmFsaWRhdGlvbiB3YXJuaW5ncyBmb3IgY29udGVudCBiYXNlZCBvbiBmb3JtYXRcbiAqIEBwYXJhbSBjb250ZW50IC0gVGhlIGNvbnRlbnQgc3RyaW5nXG4gKiBAcGFyYW0gZm9ybWF0IC0gVGhlIGNvbnRlbnQgZm9ybWF0XG4gKiBAcmV0dXJucyBBcnJheSBvZiB3YXJuaW5nIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZW50V2FybmluZ3MoY29udGVudDogc3RyaW5nLCBmb3JtYXQ6IENvbnRlbnRGb3JtYXQpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgYm90aCBzZWN1cml0eSBpc3N1ZXMgYW5kIHN5bnRheFxuICAgICAgICAgICAgY29uc3Qgc2VjdXJpdHlXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTChjb250ZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHN5bnRheFdhcm5pbmdzID0gdmFsaWRhdGVIVE1MU3ludGF4KGNvbnRlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIFsuLi5zZWN1cml0eVdhcm5pbmdzLCAuLi5zeW50YXhXYXJuaW5nc107XG4gICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGRhbmdlcm91cyBIVE1MIGVtYmVkZGVkIGluIG1hcmtkb3duXG4gICAgICAgICAgICAvLyBVc2VycyBtaWdodCB0cnkgdG8gaW5jbHVkZSA8c2NyaXB0PiB0YWdzIGluIHRoZWlyIG1hcmtkb3duXG4gICAgICAgICAgICBjb25zdCBodG1sUGF0dGVybiA9IC88W14+XSs+L2c7XG4gICAgICAgICAgICBjb25zdCBodG1sTWF0Y2hlcyA9IGNvbnRlbnQubWF0Y2goaHRtbFBhdHRlcm4pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaHRtbE1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGp1c3QgdGhlIEhUTUwgcGFydHMgYW5kIHZhbGlkYXRlIHRoZW1cbiAgICAgICAgICAgICAgICBjb25zdCBodG1sQ29udGVudCA9IGh0bWxNYXRjaGVzLmpvaW4oXCJcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbFNlY3VyaXR5V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUwoaHRtbENvbnRlbnQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGh0bWxTeW50YXhXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTFN5bnRheChodG1sQ29udGVudCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsV2FybmluZ3MgPSBbLi4uaHRtbFNlY3VyaXR5V2FybmluZ3MsIC4uLmh0bWxTeW50YXhXYXJuaW5nc107XG4gICAgICAgICAgICAgICAgaWYgKGFsbFdhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsbFdhcm5pbmdzLm1hcCh3YXJuaW5nID0+IFxuICAgICAgICAgICAgICAgICAgICAgICAgYEVtYmVkZGVkIEhUTUwgaW4gbWFya2Rvd246ICR7d2FybmluZ31gXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgICAgLy8gVGV4dCBmb3JtYXQgZG9lc24ndCBuZWVkIHZhbGlkYXRpb24gKGV2ZXJ5dGhpbmcgaXMgZXNjYXBlZClcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQsIGNyZWF0ZUVsZW1lbnQsIHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZU1lbW8gfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IEZBUUFjY29yZGlvbkNvbnRhaW5lclByb3BzLCBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgXCIuL3VpL0ZBUUFjY29yZGlvbi5zY3NzXCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuaW1wb3J0IHsgcHJvY2Vzc0NvbnRlbnQsIGdldENvbnRlbnRXYXJuaW5ncyB9IGZyb20gXCIuL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3JcIjtcbmltcG9ydCB7IE9iamVjdEl0ZW0gfSBmcm9tIFwibWVuZGl4XCI7XG5cbmludGVyZmFjZSBGQVFJdGVtIHtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgY29udGVudDogc3RyaW5nO1xuICAgIGNvbnRlbnRGb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgY29udGVudCBmb3JtYXQgdmFsdWUgdG8gdmFsaWQgZm9ybWF0IG9yIGRlZmF1bHRzIHRvIEhUTUxcbiAqIEBwYXJhbSBmb3JtYXQgLSBSYXcgZm9ybWF0IHZhbHVlIGZyb20gZGF0YWJhc2Ugb3IgY29uZmlndXJhdGlvblxuICogQHJldHVybnMgVmFsaWQgQ29udGVudEZvcm1hdEVudW0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplQ29udGVudEZvcm1hdChmb3JtYXQ6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBDb250ZW50Rm9ybWF0RW51bSB7XG4gICAgaWYgKCFmb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIFwiaHRtbFwiO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBub3JtYWxpemVkID0gZm9ybWF0LnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgIFxuICAgIC8vIENoZWNrIGlmIGl0J3MgYSB2YWxpZCBmb3JtYXRcbiAgICBpZiAobm9ybWFsaXplZCA9PT0gXCJodG1sXCIgfHwgbm9ybWFsaXplZCA9PT0gXCJtYXJrZG93blwiIHx8IG5vcm1hbGl6ZWQgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVkIGFzIENvbnRlbnRGb3JtYXRFbnVtO1xuICAgIH1cbiAgICBcbiAgICAvLyBVbnJlY29nbml6ZWQgZm9ybWF0IC0gZGVmYXVsdCB0byBIVE1MXG4gICAgY29uc29sZS53YXJuKGBGQVEgQWNjb3JkaW9uOiBVbnJlY29nbml6ZWQgY29udGVudCBmb3JtYXQgXCIke2Zvcm1hdH1cIiwgZGVmYXVsdGluZyB0byBIVE1MYCk7XG4gICAgcmV0dXJuIFwiaHRtbFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRkFRQWNjb3JkaW9uKHByb3BzOiBGQVFBY2NvcmRpb25Db250YWluZXJQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3Qge1xuICAgICAgICBkYXRhU291cmNlVHlwZSxcbiAgICAgICAgZmFxSXRlbXMsXG4gICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgIHN1bW1hcnlBdHRyaWJ1dGUsXG4gICAgICAgIGNvbnRlbnRBdHRyaWJ1dGUsXG4gICAgICAgIGZvcm1hdEF0dHJpYnV0ZSxcbiAgICAgICAgZGVmYXVsdEV4cGFuZEFsbCxcbiAgICAgICAgc2hvd1RvZ2dsZUJ1dHRvbixcbiAgICAgICAgdG9nZ2xlQnV0dG9uVGV4dCxcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb25cbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBHZXQgRkFRIGl0ZW1zIGZyb20gZWl0aGVyIHN0YXRpYyBjb25maWd1cmF0aW9uIG9yIGRhdGFiYXNlXG4gICAgY29uc3QgaXRlbXMgPSB1c2VNZW1vPEZBUUl0ZW1bXT4oKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIGRhdGFTb3VyY2Uuc3RhdHVzID09PSBcImF2YWlsYWJsZVwiKSB7XG4gICAgICAgICAgICAvLyBEYXRhYmFzZSBtb2RlOiByZWFkIGZyb20gZGF0YSBzb3VyY2VcbiAgICAgICAgICAgIHJldHVybiBkYXRhU291cmNlLml0ZW1zPy5tYXAoKGl0ZW06IE9iamVjdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gc3VtbWFyeUF0dHJpYnV0ZT8uZ2V0KGl0ZW0pLnZhbHVlIHx8IFwiUXVlc3Rpb25cIjtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gY29udGVudEF0dHJpYnV0ZT8uZ2V0KGl0ZW0pLnZhbHVlIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0VmFsdWUgPSBmb3JtYXRBdHRyaWJ1dGU/LmdldChpdGVtKS52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBub3JtYWxpemVDb250ZW50Rm9ybWF0KGZvcm1hdFZhbHVlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50Rm9ybWF0OiBmb3JtYXRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkgfHwgW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdGF0aWMgbW9kZTogdXNlIGNvbmZpZ3VyZWQgaXRlbXNcbiAgICAgICAgICAgIHJldHVybiBmYXFJdGVtcz8ubWFwKGl0ZW0gPT4gKHtcbiAgICAgICAgICAgICAgICBzdW1tYXJ5OiBpdGVtLnN1bW1hcnk/LnZhbHVlIHx8IFwiUXVlc3Rpb25cIixcbiAgICAgICAgICAgICAgICBjb250ZW50OiBpdGVtLmNvbnRlbnQ/LnZhbHVlIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogbm9ybWFsaXplQ29udGVudEZvcm1hdChpdGVtLmNvbnRlbnRGb3JtYXQpXG4gICAgICAgICAgICB9KSkgfHwgW107XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFTb3VyY2UsIGZhcUl0ZW1zLCBzdW1tYXJ5QXR0cmlidXRlLCBjb250ZW50QXR0cmlidXRlLCBmb3JtYXRBdHRyaWJ1dGVdKTtcblxuICAgIC8vIFN0YXRlIHRvIHRyYWNrIHdoaWNoIGl0ZW1zIGFyZSBleHBhbmRlZFxuICAgIGNvbnN0IFtleHBhbmRlZEl0ZW1zLCBzZXRFeHBhbmRlZEl0ZW1zXSA9IHVzZVN0YXRlPFNldDxudW1iZXI+PihuZXcgU2V0KCkpO1xuICAgIGNvbnN0IFthbGxFeHBhbmRlZCwgc2V0QWxsRXhwYW5kZWRdID0gdXNlU3RhdGUoZGVmYXVsdEV4cGFuZEFsbCk7XG5cbiAgICAvLyBJbml0aWFsaXplIGV4cGFuZGVkIHN0YXRlIGJhc2VkIG9uIGRlZmF1bHRFeHBhbmRBbGxcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoZGVmYXVsdEV4cGFuZEFsbCkge1xuICAgICAgICAgICAgY29uc3QgYWxsSW5kaWNlcyA9IG5ldyBTZXQoaXRlbXM/Lm1hcCgoXywgaW5kZXgpID0+IGluZGV4KSB8fCBbXSk7XG4gICAgICAgICAgICBzZXRFeHBhbmRlZEl0ZW1zKGFsbEluZGljZXMpO1xuICAgICAgICB9XG4gICAgfSwgW2RlZmF1bHRFeHBhbmRBbGwsIGl0ZW1zXSk7XG5cbiAgICAvLyBUb2dnbGUgaW5kaXZpZHVhbCBpdGVtXG4gICAgY29uc3QgdG9nZ2xlSXRlbSA9IChpbmRleDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEV4cGFuZGVkSXRlbXMoKHByZXYpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NldCA9IG5ldyBTZXQocHJldik7XG4gICAgICAgICAgICBpZiAobmV3U2V0LmhhcyhpbmRleCkpIHtcbiAgICAgICAgICAgICAgICBuZXdTZXQuZGVsZXRlKGluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3U2V0LmFkZChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3U2V0O1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gVG9nZ2xlIGFsbCBpdGVtc1xuICAgIGNvbnN0IHRvZ2dsZUFsbCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGFsbEV4cGFuZGVkKSB7XG4gICAgICAgICAgICAvLyBDb2xsYXBzZSBhbGxcbiAgICAgICAgICAgIHNldEV4cGFuZGVkSXRlbXMobmV3IFNldCgpKTtcbiAgICAgICAgICAgIHNldEFsbEV4cGFuZGVkKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEV4cGFuZCBhbGxcbiAgICAgICAgICAgIGNvbnN0IGFsbEluZGljZXMgPSBuZXcgU2V0KGl0ZW1zPy5tYXAoKF8sIGluZGV4KSA9PiBpbmRleCkgfHwgW10pO1xuICAgICAgICAgICAgc2V0RXhwYW5kZWRJdGVtcyhhbGxJbmRpY2VzKTtcbiAgICAgICAgICAgIHNldEFsbEV4cGFuZGVkKHRydWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFVwZGF0ZSBhbGxFeHBhbmRlZCBzdGF0ZSBiYXNlZCBvbiBpbmRpdmlkdWFsIHRvZ2dsZXNcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoaXRlbXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGFsbEFyZUV4cGFuZGVkID0gaXRlbXMubGVuZ3RoID4gMCAmJiBleHBhbmRlZEl0ZW1zLnNpemUgPT09IGl0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgIHNldEFsbEV4cGFuZGVkKGFsbEFyZUV4cGFuZGVkKTtcbiAgICAgICAgfVxuICAgIH0sIFtleHBhbmRlZEl0ZW1zLCBpdGVtc10pO1xuXG4gICAgLy8gU2hvdyBsb2FkaW5nIHN0YXRlIGZvciBkYXRhYmFzZSBtb2RlXG4gICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZSAmJiBkYXRhU291cmNlLnN0YXR1cyA9PT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1sb2FkaW5nXCI+XG4gICAgICAgICAgICAgICAgPHA+TG9hZGluZyBGQVEgaXRlbXMuLi48L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWl0ZW1zIHx8IGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWVtcHR5XCI+XG4gICAgICAgICAgICAgICAgPHA+Tm8gRkFRIGl0ZW1zIGNvbmZpZ3VyZWQ8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBnZXRUb2dnbGVCdXR0b25UZXh0ID0gKCk6IHN0cmluZyA9PiB7XG4gICAgICAgIGlmICh0b2dnbGVCdXR0b25UZXh0ICYmIHRvZ2dsZUJ1dHRvblRleHQudmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0b2dnbGVCdXR0b25UZXh0LnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGxFeHBhbmRlZCA/IFwiSGlkZSBBbGxcIiA6IFwiU2hvdyBBbGxcIjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAge3Nob3dUb2dnbGVCdXR0b24gJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLXRvZ2dsZS1hbGwtYnRuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS10b2dnbGUtYWxsLWJ0bi0tZXhwYW5kZWRcIjogYWxsRXhwYW5kZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dG9nZ2xlQWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtnZXRUb2dnbGVCdXR0b25UZXh0KCl9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWl0ZW1zXCI+XG4gICAgICAgICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNFeHBhbmRlZCA9IGV4cGFuZGVkSXRlbXMuaGFzKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeVZhbHVlID0gaXRlbS5zdW1tYXJ5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50VmFsdWUgPSBpdGVtLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRGb3JtYXQgPSBpdGVtLmNvbnRlbnRGb3JtYXQ7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0IGFuZCBzYW5pdGl6ZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9jZXNzZWRDb250ZW50ID0gcHJvY2Vzc0NvbnRlbnQoY29udGVudFZhbHVlLCBjb250ZW50Rm9ybWF0KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB2YWxpZGF0aW9uIHdhcm5pbmdzIChvbmx5IGZvciBIVE1MIGZvcm1hdClcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2FybmluZ3MgPSBnZXRDb250ZW50V2FybmluZ3MoY29udGVudFZhbHVlLCBjb250ZW50Rm9ybWF0KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRldGFpbHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2luZGV4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtaXRlbS0tZXhwYW5kZWRcIjogaXNFeHBhbmRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW49e2lzRXhwYW5kZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIi0tYW5pbWF0aW9uLWR1cmF0aW9uXCI6IGAke2FuaW1hdGlvbkR1cmF0aW9uIHx8IDMwMH1tc2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBSZWFjdC5DU1NQcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdW1tYXJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1pdGVtLXN1bW1hcnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlSXRlbShpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBrZXlib2FyZCBuYXZpZ2F0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIiB8fCBlLmtleSA9PT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlSXRlbShpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYkluZGV4PXswfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb2xlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1leHBhbmRlZD17aXNFeHBhbmRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhcS1pdGVtLXN1bW1hcnktdGV4dFwiPntzdW1tYXJ5VmFsdWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW0taWNvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtaXRlbS1pY29uLS1leHBhbmRlZFwiOiBpc0V4cGFuZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPVwiMTZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD1cIjE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsPVwibm9uZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZD1cIk00IDZMOCAxMEwxMiA2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9XCIyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLXdhcm5pbmdzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3dhcm5pbmdzLm1hcCgod2FybmluZywgd0luZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt3SW5kZXh9IGNsYXNzTmFtZT1cImZhcS1pdGVtLXdhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKaoO+4jyB7d2FybmluZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tY29udGVudC1pbm5lclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHByb2Nlc3NlZENvbnRlbnQgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIl0sIm5hbWVzIjpbImhhc093biIsImhhc093blByb3BlcnR5IiwiY2xhc3NOYW1lcyIsImNsYXNzZXMiLCJpIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiYXJnIiwiYXBwZW5kQ2xhc3MiLCJwYXJzZVZhbHVlIiwiQXJyYXkiLCJpc0FycmF5IiwiYXBwbHkiLCJ0b1N0cmluZyIsIk9iamVjdCIsInByb3RvdHlwZSIsImluY2x1ZGVzIiwia2V5IiwiY2FsbCIsInZhbHVlIiwibmV3Q2xhc3MiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCIsIndpbmRvdyIsImVudHJpZXMiLCJzZXRQcm90b3R5cGVPZiIsImlzRnJvemVuIiwiZ2V0UHJvdG90eXBlT2YiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJmcmVlemUiLCJzZWFsIiwiY3JlYXRlIiwiY29uc3RydWN0IiwiUmVmbGVjdCIsIngiLCJmdW5jIiwidGhpc0FyZyIsIl9sZW4iLCJhcmdzIiwiX2tleSIsIkZ1bmMiLCJfbGVuMiIsIl9rZXkyIiwiYXJyYXlGb3JFYWNoIiwidW5hcHBseSIsImZvckVhY2giLCJhcnJheUxhc3RJbmRleE9mIiwibGFzdEluZGV4T2YiLCJhcnJheVBvcCIsInBvcCIsImFycmF5UHVzaCIsInB1c2giLCJhcnJheVNwbGljZSIsInNwbGljZSIsInN0cmluZ1RvTG93ZXJDYXNlIiwiU3RyaW5nIiwidG9Mb3dlckNhc2UiLCJzdHJpbmdUb1N0cmluZyIsInN0cmluZ01hdGNoIiwibWF0Y2giLCJzdHJpbmdSZXBsYWNlIiwicmVwbGFjZSIsInN0cmluZ0luZGV4T2YiLCJpbmRleE9mIiwic3RyaW5nVHJpbSIsInRyaW0iLCJvYmplY3RIYXNPd25Qcm9wZXJ0eSIsInJlZ0V4cFRlc3QiLCJSZWdFeHAiLCJ0ZXN0IiwidHlwZUVycm9yQ3JlYXRlIiwidW5jb25zdHJ1Y3QiLCJUeXBlRXJyb3IiLCJsYXN0SW5kZXgiLCJfbGVuMyIsIl9rZXkzIiwiX2xlbjQiLCJfa2V5NCIsImFkZFRvU2V0Iiwic2V0IiwiYXJyYXkiLCJ0cmFuc2Zvcm1DYXNlRnVuYyIsInVuZGVmaW5lZCIsImwiLCJlbGVtZW50IiwibGNFbGVtZW50IiwiY2xlYW5BcnJheSIsImluZGV4IiwiaXNQcm9wZXJ0eUV4aXN0IiwiY2xvbmUiLCJvYmplY3QiLCJuZXdPYmplY3QiLCJwcm9wZXJ0eSIsImNvbnN0cnVjdG9yIiwibG9va3VwR2V0dGVyIiwicHJvcCIsImRlc2MiLCJnZXQiLCJmYWxsYmFja1ZhbHVlIiwiTCIsImFzeW5jIiwiYnJlYWtzIiwiZXh0ZW5zaW9ucyIsImdmbSIsImhvb2tzIiwicGVkYW50aWMiLCJyZW5kZXJlciIsInNpbGVudCIsInRva2VuaXplciIsIndhbGtUb2tlbnMiLCJUIiwiWiIsInUiLCJET01QdXJpZnkiLCJtYXJrZWQiLCJfanN4IiwiX2pzeHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtBOztBQUVDLEVBQUEsQ0FBWSxZQUFBOztBQUdaLElBQUEsSUFBSUEsTUFBTSxHQUFHLEVBQUUsQ0FBQ0MsY0FBYyxDQUFBO0lBRTlCLFNBQVNDLFVBQVVBLEdBQUk7TUFDdEIsSUFBSUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtBQUVoQixNQUFBLEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHQyxTQUFTLENBQUNDLE1BQU0sRUFBRUYsQ0FBQyxFQUFFLEVBQUU7QUFDMUMsUUFBQSxJQUFJRyxHQUFHLEdBQUdGLFNBQVMsQ0FBQ0QsQ0FBQyxDQUFDLENBQUE7UUFDdEIsSUFBSUcsR0FBRyxFQUFFO1VBQ1JKLE9BQU8sR0FBR0ssV0FBVyxDQUFDTCxPQUFPLEVBQUVNLFVBQVUsQ0FBQ0YsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNoRCxTQUFBO0FBQ0QsT0FBQTtBQUVBLE1BQUEsT0FBT0osT0FBTyxDQUFBO0FBQ2YsS0FBQTtJQUVBLFNBQVNNLFVBQVVBLENBQUVGLEdBQUcsRUFBRTtNQUN6QixJQUFJLE9BQU9BLEdBQUcsS0FBSyxRQUFRLElBQUksT0FBT0EsR0FB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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM5TU8sU0FBU0MsSUFBNEc7RUFDMUgsT0FBTztBQUNMQyxJQUFBQSxLQUFBLEVBQU8sQ0FBQSxDQUFBO0FBQ1BDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7QUFDUkMsSUFBQUEsVUFBQSxFQUFZLElBQUE7QUFDWkMsSUFBQUEsR0FBQSxFQUFLLENBQUEsQ0FBQTtBQUNMQyxJQUFBQSxLQUFBLEVBQU8sSUFBQTtBQUNQQyxJQUFBQSxRQUFBLEVBQVUsQ0FBQSxDQUFBO0FBQ1ZDLElBQUFBLFFBQUEsRUFBVSxJQUFBO0FBQ1ZDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7QUFDUkMsSUFBQUEsU0FBQSxFQUFXLElBQUE7QUFDWEMsSUFBQUEsVUFBQSxFQUFZLElBQUE7R0FFaEIsQ0FBQTtBQUFBLENBQUE7QUFFTyxJQUFJQyxDQUFBLEdBQXFDWCxDQUFBLEVBQWEsQ0FBQTtBQUV0RCxTQUFTWSxDQUFBQSxDQUErREMsQ0FBQSxFQUEwRDtBQUN2SUYsRUFBQUEsQ0FBQSxHQUFZRSxDQUNkLENBQUE7QUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
