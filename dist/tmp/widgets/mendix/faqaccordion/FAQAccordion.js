define(['exports', 'react/jsx-runtime', 'react'], (function (exports, jsxRuntime, react) { 'use strict';

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
	 * Utility functions for editing mode and role-based access control
	 */
	/**
	 * Checks if the current user has the required role for editing
	 * @param requiredRole - The role name required (empty string = all authenticated users)
	 * @returns Promise<boolean> - True if user has access
	 */
	async function checkUserRole(requiredRole) {
	    // If no role specified, allow all authenticated users
	    if (!requiredRole || requiredRole.trim() === "") {
	        return true;
	    }
	    try {
	        // Use Mendix Client API to check user roles
	        // Note: In actual Mendix runtime, you'd use mx.session or similar
	        // This is a placeholder - Mendix widgets typically use server-side validation
	        // For now, we'll return true and rely on microflow validation
	        console.log(`Checking role: ${requiredRole}`);
	        return true;
	    }
	    catch (error) {
	        console.error("Error checking user role:", error);
	        return false;
	    }
	}
	/**
	 * Validates if editing is allowed based on configuration
	 * @param allowEditing - Whether editing is enabled
	 * @param dataSourceType - Type of data source
	 * @param hasRole - Whether user has required role
	 * @returns boolean - True if editing should be allowed
	 */
	function canEdit(allowEditing, dataSourceType, hasRole) {
	    // Editing only works with database mode
	    if (dataSourceType !== "database") {
	        return false;
	    }
	    // Editing must be enabled
	    if (!allowEditing) {
	        return false;
	    }
	    // User must have required role
	    return hasRole;
	}

	/**
	 * Action buttons for editing mode - Edit, Delete, Move Up, Move Down
	 */
	function FAQItemActions(props) {
	    const { onEdit, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown } = props;
	    return (jsxRuntime.jsxs("div", { className: "faq-item-actions", children: [jsxRuntime.jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-move-up"), onClick: (e) => {
	                    e.stopPropagation();
	                    onMoveUp();
	                }, disabled: !canMoveUp, title: "Move up", "aria-label": "Move FAQ item up", children: jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M8 3L3 8h3v5h4V8h3z" }) }) }), jsxRuntime.jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-move-down"), onClick: (e) => {
	                    e.stopPropagation();
	                    onMoveDown();
	                }, disabled: !canMoveDown, title: "Move down", "aria-label": "Move FAQ item down", children: jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M8 13l5-5h-3V3H6v5H3z" }) }) }), jsxRuntime.jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-edit"), onClick: (e) => {
	                    e.stopPropagation();
	                    onEdit();
	                }, title: "Edit FAQ", "aria-label": "Edit FAQ item", children: jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" }) }) }), jsxRuntime.jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-delete"), onClick: (e) => {
	                    e.stopPropagation();
	                    onDelete();
	                }, title: "Delete FAQ", "aria-label": "Delete FAQ item", children: jsxRuntime.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [jsxRuntime.jsx("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), jsxRuntime.jsx("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" })] }) })] }));
	}

	/**
	 * Confirmation dialog modal for destructive actions (e.g., delete)
	 */
	function ConfirmDialog(props) {
	    const { isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false } = props;
	    if (!isOpen) {
	        return null;
	    }
	    const handleOverlayClick = (e) => {
	        if (e.target === e.currentTarget) {
	            onCancel();
	        }
	    };
	    return (jsxRuntime.jsx("div", { className: "faq-confirm-dialog-overlay", onClick: handleOverlayClick, role: "presentation", children: jsxRuntime.jsxs("div", { className: "faq-confirm-dialog", role: "alertdialog", "aria-labelledby": "dialog-title", "aria-describedby": "dialog-message", children: [jsxRuntime.jsxs("div", { className: "faq-confirm-dialog-header", children: [isDestructive && (jsxRuntime.jsx("svg", { className: "faq-confirm-dialog-icon-warning", width: "24", height: "24", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" }) })), jsxRuntime.jsx("h3", { id: "dialog-title", className: "faq-confirm-dialog-title", children: title })] }), jsxRuntime.jsx("div", { id: "dialog-message", className: "faq-confirm-dialog-message", children: message }), jsxRuntime.jsxs("div", { className: "faq-confirm-dialog-actions", children: [jsxRuntime.jsx("button", { type: "button", className: classNames("faq-confirm-dialog-btn", "faq-btn-cancel"), onClick: onCancel, children: cancelText }), jsxRuntime.jsx("button", { type: "button", className: classNames("faq-confirm-dialog-btn", "faq-btn-confirm", {
	                                "faq-btn-destructive": isDestructive
	                            }), onClick: onConfirm, children: confirmText })] })] }) }));
	}

	/**
	 * Toggle button for switching between view and edit modes
	 */
	function EditModeToggle(props) {
	    const { editMode, onToggle, disabled = false } = props;
	    return (jsxRuntime.jsx("button", { type: "button", className: classNames("faq-edit-mode-toggle", {
	            "faq-edit-mode-active": editMode
	        }), onClick: onToggle, disabled: disabled, "aria-label": editMode ? "Switch to view mode" : "Switch to edit mode", title: editMode ? "View Mode" : "Edit Mode", children: editMode ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [jsxRuntime.jsx("path", { d: "M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" }), jsxRuntime.jsx("path", { d: "M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" })] }), jsxRuntime.jsx("span", { children: "View" })] })) : (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" }) }), jsxRuntime.jsx("span", { children: "Edit" })] })) }));
	}

	function EditFAQForm(props) {
	    const { summary: initialSummary, content: initialContent, format: initialFormat, onSave, onCancel, isNew = false } = props;
	    const [summary, setSummary] = react.useState(initialSummary);
	    const [content, setContent] = react.useState(initialContent);
	    const [format, setFormat] = react.useState(initialFormat);
	    const [showPreview, setShowPreview] = react.useState(false);
	    // Validation warnings
	    const warnings = getContentWarnings(content, format);
	    const hasWarnings = warnings.length > 0;
	    const handleSave = () => {
	        if (!summary.trim()) {
	            alert("Summary/Question is required");
	            return;
	        }
	        if (!content.trim()) {
	            alert("Content/Answer is required");
	            return;
	        }
	        onSave(summary.trim(), content.trim(), format);
	    };
	    return (jsxRuntime.jsxs("div", { className: "faq-edit-form", children: [jsxRuntime.jsxs("div", { className: "faq-edit-form-header", children: [jsxRuntime.jsx("h3", { children: isNew ? "Add New FAQ" : "Edit FAQ" }), jsxRuntime.jsx("button", { className: "faq-edit-form-close", onClick: onCancel, type: "button", "aria-label": "Close", children: "\u2715" })] }), jsxRuntime.jsxs("div", { className: "faq-edit-form-body", children: [jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-summary", children: ["Question/Summary ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsx("input", { id: "faq-summary", type: "text", className: "faq-form-input", value: summary, onChange: (e) => setSummary(e.target.value), placeholder: "Enter the question or summary...", required: true })] }), jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-format", children: ["Content Format ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsxs("select", { id: "faq-format", className: "faq-form-select", value: format, onChange: (e) => setFormat(e.target.value), children: [jsxRuntime.jsx("option", { value: "html", children: "HTML" }), jsxRuntime.jsx("option", { value: "markdown", children: "Markdown" }), jsxRuntime.jsx("option", { value: "text", children: "Plain Text" })] }), jsxRuntime.jsxs("small", { className: "faq-form-help", children: [format === "html" && "Allows rich formatting with HTML tags", format === "markdown" && "Uses Markdown syntax (e.g., **bold**, # heading)", format === "text" && "Plain text only, HTML will be escaped"] })] }), jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-content", children: ["Answer/Content ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsx("textarea", { id: "faq-content", className: classNames("faq-form-textarea", {
	                                    "faq-form-textarea--warning": hasWarnings
	                                }), value: content, onChange: (e) => setContent(e.target.value), placeholder: "Enter the answer or content...", rows: 10, required: true }), hasWarnings && (jsxRuntime.jsxs("div", { className: "faq-form-warnings", children: [jsxRuntime.jsx("strong", { children: "\u26A0\uFE0F Content Warnings:" }), jsxRuntime.jsx("ul", { children: warnings.map((warning, i) => (jsxRuntime.jsx("li", { children: warning }, i))) })] }))] }), jsxRuntime.jsx("div", { className: "faq-form-field", children: jsxRuntime.jsxs("button", { type: "button", className: "faq-preview-toggle", onClick: () => setShowPreview(!showPreview), children: [showPreview ? "Hide" : "Show", " Preview"] }) }), showPreview && (jsxRuntime.jsxs("div", { className: "faq-form-preview", children: [jsxRuntime.jsx("h4", { children: "Preview:" }), jsxRuntime.jsx("div", { className: "faq-form-preview-content", dangerouslySetInnerHTML: { __html: processContent(content, format) } })] }))] }), jsxRuntime.jsxs("div", { className: "faq-edit-form-footer", children: [jsxRuntime.jsx("button", { type: "button", className: "faq-btn faq-btn-secondary", onClick: onCancel, children: "Cancel" }), jsxRuntime.jsx("button", { type: "button", className: "faq-btn faq-btn-primary", onClick: handleSave, disabled: !summary.trim() || !content.trim(), children: isNew ? "Create FAQ" : "Save Changes" })] })] }));
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
	    const { dataSourceType, faqItems, dataSource, summaryAttribute, contentAttribute, formatAttribute, defaultExpandAll, showToggleButton, toggleButtonText, animationDuration, allowEditing, editorRole, onSaveAction, onDeleteAction, onCreateAction, sortOrderAttribute } = props;
	    // Get FAQ items from either static configuration or database
	    const items = react.useMemo(() => {
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
	    const [expandedItems, setExpandedItems] = react.useState(new Set());
	    const [allExpanded, setAllExpanded] = react.useState(defaultExpandAll);
	    // Editing state
	    const [editMode, setEditMode] = react.useState(false);
	    const [editingItemIndex, setEditingItemIndex] = react.useState(null);
	    const [showCreateForm, setShowCreateForm] = react.useState(false);
	    const [userHasRole, setUserHasRole] = react.useState(false);
	    const [deleteConfirmIndex, setDeleteConfirmIndex] = react.useState(null);
	    // Check if user has required role
	    react.useEffect(() => {
	        const checkRole = async () => {
	            if (allowEditing && editorRole) {
	                const hasRole = await checkUserRole(editorRole);
	                setUserHasRole(hasRole);
	            }
	            else if (allowEditing && !editorRole) {
	                // No role restriction - allow editing for all users
	                setUserHasRole(true);
	            }
	            else {
	                setUserHasRole(false);
	            }
	        };
	        checkRole();
	    }, [allowEditing, editorRole]);
	    // Initialize expanded state based on defaultExpandAll
	    react.useEffect(() => {
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
	    react.useEffect(() => {
	        if (items) {
	            const allAreExpanded = items.length > 0 && expandedItems.size === items.length;
	            setAllExpanded(allAreExpanded);
	        }
	    }, [expandedItems, items]);
	    // Determine if editing is enabled
	    const isEditingEnabled = canEdit(allowEditing, dataSourceType, userHasRole);
	    // Placeholder handlers for CRUD operations (to be implemented in Sprint 3)
	    const handleToggleEditMode = () => {
	        setEditMode(!editMode);
	        setEditingItemIndex(null);
	        setShowCreateForm(false);
	    };
	    const handleEditItem = (index) => {
	        setEditingItemIndex(index);
	        setShowCreateForm(false);
	    };
	    const handleDeleteItem = (index) => {
	        setDeleteConfirmIndex(index);
	    };
	    const handleConfirmDelete = () => {
	        if (deleteConfirmIndex === null || !dataSource || dataSourceType !== "database") {
	            setDeleteConfirmIndex(null);
	            return;
	        }
	        const item = dataSource.items?.[deleteConfirmIndex];
	        if (!item) {
	            setDeleteConfirmIndex(null);
	            return;
	        }
	        // Execute delete action
	        if (onDeleteAction && onDeleteAction.canExecute) {
	            onDeleteAction.execute();
	        }
	        setDeleteConfirmIndex(null);
	    };
	    const handleCancelDelete = () => {
	        setDeleteConfirmIndex(null);
	    };
	    const handleMoveUp = (index) => {
	        // TODO: Implement in Sprint 4
	        console.log("Move up:", index);
	    };
	    const handleMoveDown = (index) => {
	        // TODO: Implement in Sprint 4
	        console.log("Move down:", index);
	    };
	    const handleSaveEdit = (summary, content, format) => {
	        if (editingItemIndex === null || !dataSource || dataSourceType !== "database") {
	            setEditingItemIndex(null);
	            return;
	        }
	        const item = dataSource.items?.[editingItemIndex];
	        if (!item) {
	            setEditingItemIndex(null);
	            return;
	        }
	        // Update attributes
	        if (summaryAttribute) {
	            summaryAttribute.get(item).setValue(summary);
	        }
	        if (contentAttribute) {
	            contentAttribute.get(item).setValue(content);
	        }
	        if (formatAttribute) {
	            formatAttribute.get(item).setValue(format);
	        }
	        // Execute save action
	        if (onSaveAction && onSaveAction.canExecute) {
	            onSaveAction.execute();
	        }
	        setEditingItemIndex(null);
	    };
	    const handleCancelEdit = () => {
	        setEditingItemIndex(null);
	        setShowCreateForm(false);
	    };
	    const handleCreateNew = () => {
	        setShowCreateForm(true);
	        setEditingItemIndex(null);
	    };
	    const handleSaveNew = (summary, content, format) => {
	        if (!dataSource || dataSourceType !== "database") {
	            setShowCreateForm(false);
	            return;
	        }
	        // For creating new items, we rely on the onCreateAction microflow/nanoflow
	        // to create the object and set initial values. The form data could be passed
	        // as parameters if the action supports it.
	        // Execute create action - the microflow should handle object creation
	        if (onCreateAction && onCreateAction.canExecute) {
	            onCreateAction.execute();
	        }
	        // Note: In a real implementation, you might want to store the form data
	        // temporarily and have the action callback update the newly created object
	        setShowCreateForm(false);
	    };
	    // Show loading state for database mode
	    if (dataSourceType === "database" && dataSource && dataSource.status === "loading") {
	        return (jsxRuntime.jsx("div", { className: "faq-accordion-loading", children: jsxRuntime.jsx("p", { children: "Loading FAQ items..." }) }));
	    }
	    if (!items || items.length === 0) {
	        return (jsxRuntime.jsx("div", { className: "faq-accordion-empty", children: jsxRuntime.jsx("p", { children: "No FAQ items configured" }) }));
	    }
	    const getToggleButtonText = () => {
	        if (toggleButtonText && toggleButtonText.value) {
	            return toggleButtonText.value;
	        }
	        return allExpanded ? "Hide All" : "Show All";
	    };
	    return (jsxRuntime.jsxs("div", { className: "faq-accordion-container", children: [(showToggleButton || isEditingEnabled) && (jsxRuntime.jsxs("div", { className: "faq-accordion-header", children: [showToggleButton && (jsxRuntime.jsx("button", { className: classNames("faq-toggle-all-btn", {
	                            "faq-toggle-all-btn--expanded": allExpanded
	                        }), onClick: toggleAll, type: "button", children: getToggleButtonText() })), isEditingEnabled && (jsxRuntime.jsxs("div", { className: "faq-editing-controls", children: [editMode && (jsxRuntime.jsxs("button", { type: "button", className: "faq-create-new-btn", onClick: handleCreateNew, "aria-label": "Create new FAQ item", children: [jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" }) }), "Create New"] })), jsxRuntime.jsx(EditModeToggle, { editMode: editMode, onToggle: handleToggleEditMode })] }))] })), jsxRuntime.jsx("div", { className: "faq-accordion-items", children: items.map((item, index) => {
	                    const isExpanded = expandedItems.has(index);
	                    const summaryValue = item.summary;
	                    const contentValue = item.content;
	                    const contentFormat = item.contentFormat;
	                    // Process content based on format and sanitize
	                    const processedContent = processContent(contentValue, contentFormat);
	                    // Get validation warnings (only for HTML format)
	                    const warnings = getContentWarnings(contentValue, contentFormat);
	                    return (jsxRuntime.jsxs("details", { className: classNames("faq-item", {
	                            "faq-item--expanded": isExpanded
	                        }), open: isExpanded, style: {
	                            "--animation-duration": `${animationDuration || 300}ms`
	                        }, children: [jsxRuntime.jsxs("summary", { className: "faq-item-summary", onClick: (e) => {
	                                    e.preventDefault();
	                                    toggleItem(index);
	                                }, onKeyDown: (e) => {
	                                    // Handle keyboard navigation
	                                    if (e.key === "Enter" || e.key === " ") {
	                                        e.preventDefault();
	                                        toggleItem(index);
	                                    }
	                                }, tabIndex: 0, role: "button", "aria-expanded": isExpanded, children: [jsxRuntime.jsx("span", { className: "faq-item-summary-text", children: summaryValue }), jsxRuntime.jsxs("div", { className: "faq-item-summary-controls", children: [editMode && isEditingEnabled && (jsxRuntime.jsx(FAQItemActions, { onEdit: () => handleEditItem(index), onDelete: () => handleDeleteItem(index), onMoveUp: () => handleMoveUp(index), onMoveDown: () => handleMoveDown(index), canMoveUp: index > 0, canMoveDown: index < items.length - 1 })), jsxRuntime.jsx("span", { className: classNames("faq-item-icon", {
	                                                    "faq-item-icon--expanded": isExpanded
	                                                }), children: jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: jsxRuntime.jsx("path", { d: "M4 6L8 10L12 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), jsxRuntime.jsxs("div", { className: "faq-item-content", children: [warnings.length > 0 && (jsxRuntime.jsx("div", { className: "faq-item-warnings", children: warnings.map((warning, wIndex) => (jsxRuntime.jsxs("div", { className: "faq-item-warning", children: ["\u26A0\uFE0F ", warning] }, wIndex))) })), jsxRuntime.jsx("div", { className: "faq-item-content-inner", dangerouslySetInnerHTML: { __html: processedContent } })] })] }, index));
	                }) }), editingItemIndex !== null && items[editingItemIndex] && (jsxRuntime.jsx(EditFAQForm, { summary: items[editingItemIndex].summary, content: items[editingItemIndex].content, format: items[editingItemIndex].contentFormat, onSave: handleSaveEdit, onCancel: handleCancelEdit, isNew: false })), showCreateForm && (jsxRuntime.jsx(EditFAQForm, { summary: "", content: "", format: "html", onSave: handleSaveNew, onCancel: handleCancelEdit, isNew: true })), jsxRuntime.jsx(ConfirmDialog, { isOpen: deleteConfirmIndex !== null, title: "Delete FAQ Item", message: "Are you sure you want to delete this FAQ item? This action cannot be undone.", onConfirm: handleConfirmDelete, onCancel: handleCancelDelete, confirmText: "Delete", cancelText: "Cancel", isDestructive: true })] }));
	}

	exports.FAQAccordion = FAQAccordion;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRkFRQWNjb3JkaW9uLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9kb21wdXJpZnkvZGlzdC9wdXJpZnkuZXMubWpzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL21hcmtlZC9saWIvbWFya2VkLmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL3NyYy91dGlscy9jb250ZW50UHJvY2Vzc29yLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL3V0aWxzL2VkaXRpbmdVdGlscy50cyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ZBUUl0ZW1BY3Rpb25zLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbmZpcm1EaWFsb2cudHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRWRpdE1vZGVUb2dnbGUudHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRWRpdEZBUUZvcm0udHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL0ZBUUFjY29yZGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG5cdENvcHlyaWdodCAoYykgMjAxOCBKZWQgV2F0c29uLlxuXHRMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UgKE1JVCksIHNlZVxuXHRodHRwOi8vamVkd2F0c29uLmdpdGh1Yi5pby9jbGFzc25hbWVzXG4qL1xuLyogZ2xvYmFsIGRlZmluZSAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGhhc093biA9IHt9Lmhhc093blByb3BlcnR5O1xuXG5cdGZ1bmN0aW9uIGNsYXNzTmFtZXMgKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdGlmIChhcmcpIHtcblx0XHRcdFx0Y2xhc3NlcyA9IGFwcGVuZENsYXNzKGNsYXNzZXMsIHBhcnNlVmFsdWUoYXJnKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVZhbHVlIChhcmcpIHtcblx0XHRpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcblx0XHRcdHJldHVybiBhcmc7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBhcmcgIT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKTtcblx0XHR9XG5cblx0XHRpZiAoYXJnLnRvU3RyaW5nICE9PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nICYmICFhcmcudG9TdHJpbmcudG9TdHJpbmcoKS5pbmNsdWRlcygnW25hdGl2ZSBjb2RlXScpKSB7XG5cdFx0XHRyZXR1cm4gYXJnLnRvU3RyaW5nKCk7XG5cdFx0fVxuXG5cdFx0dmFyIGNsYXNzZXMgPSAnJztcblxuXHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdGlmIChoYXNPd24uY2FsbChhcmcsIGtleSkgJiYgYXJnW2tleV0pIHtcblx0XHRcdFx0Y2xhc3NlcyA9IGFwcGVuZENsYXNzKGNsYXNzZXMsIGtleSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRDbGFzcyAodmFsdWUsIG5ld0NsYXNzKSB7XG5cdFx0aWYgKCFuZXdDbGFzcykge1xuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0XG5cdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRyZXR1cm4gdmFsdWUgKyAnICcgKyBuZXdDbGFzcztcblx0XHR9XG5cdFxuXHRcdHJldHVybiB2YWx1ZSArIG5ld0NsYXNzO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0Y2xhc3NOYW1lcy5kZWZhdWx0ID0gY2xhc3NOYW1lcztcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuIiwiLyohIEBsaWNlbnNlIERPTVB1cmlmeSAzLjMuMSB8IChjKSBDdXJlNTMgYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyB8IFJlbGVhc2VkIHVuZGVyIHRoZSBBcGFjaGUgbGljZW5zZSAyLjAgYW5kIE1vemlsbGEgUHVibGljIExpY2Vuc2UgMi4wIHwgZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L2Jsb2IvMy4zLjEvTElDRU5TRSAqL1xuXG5jb25zdCB7XG4gIGVudHJpZXMsXG4gIHNldFByb3RvdHlwZU9mLFxuICBpc0Zyb3plbixcbiAgZ2V0UHJvdG90eXBlT2YsXG4gIGdldE93blByb3BlcnR5RGVzY3JpcHRvclxufSA9IE9iamVjdDtcbmxldCB7XG4gIGZyZWV6ZSxcbiAgc2VhbCxcbiAgY3JlYXRlXG59ID0gT2JqZWN0OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGltcG9ydC9uby1tdXRhYmxlLWV4cG9ydHNcbmxldCB7XG4gIGFwcGx5LFxuICBjb25zdHJ1Y3Rcbn0gPSB0eXBlb2YgUmVmbGVjdCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVmbGVjdDtcbmlmICghZnJlZXplKSB7XG4gIGZyZWV6ZSA9IGZ1bmN0aW9uIGZyZWV6ZSh4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG59XG5pZiAoIXNlYWwpIHtcbiAgc2VhbCA9IGZ1bmN0aW9uIHNlYWwoeCkge1xuICAgIHJldHVybiB4O1xuICB9O1xufVxuaWYgKCFhcHBseSkge1xuICBhcHBseSA9IGZ1bmN0aW9uIGFwcGx5KGZ1bmMsIHRoaXNBcmcpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMiA/IF9sZW4gLSAyIDogMCksIF9rZXkgPSAyOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXkgLSAyXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gIH07XG59XG5pZiAoIWNvbnN0cnVjdCkge1xuICBjb25zdHJ1Y3QgPSBmdW5jdGlvbiBjb25zdHJ1Y3QoRnVuYykge1xuICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiA+IDEgPyBfbGVuMiAtIDEgOiAwKSwgX2tleTIgPSAxOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICBhcmdzW19rZXkyIC0gMV0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEZ1bmMoLi4uYXJncyk7XG4gIH07XG59XG5jb25zdCBhcnJheUZvckVhY2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5mb3JFYWNoKTtcbmNvbnN0IGFycmF5TGFzdEluZGV4T2YgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZik7XG5jb25zdCBhcnJheVBvcCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnBvcCk7XG5jb25zdCBhcnJheVB1c2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wdXNoKTtcbmNvbnN0IGFycmF5U3BsaWNlID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUuc3BsaWNlKTtcbmNvbnN0IHN0cmluZ1RvTG93ZXJDYXNlID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlKTtcbmNvbnN0IHN0cmluZ1RvU3RyaW5nID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nKTtcbmNvbnN0IHN0cmluZ01hdGNoID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLm1hdGNoKTtcbmNvbnN0IHN0cmluZ1JlcGxhY2UgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSk7XG5jb25zdCBzdHJpbmdJbmRleE9mID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLmluZGV4T2YpO1xuY29uc3Qgc3RyaW5nVHJpbSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50cmltKTtcbmNvbnN0IG9iamVjdEhhc093blByb3BlcnR5ID0gdW5hcHBseShPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcbmNvbnN0IHJlZ0V4cFRlc3QgPSB1bmFwcGx5KFJlZ0V4cC5wcm90b3R5cGUudGVzdCk7XG5jb25zdCB0eXBlRXJyb3JDcmVhdGUgPSB1bmNvbnN0cnVjdChUeXBlRXJyb3IpO1xuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggYSBzcGVjaWZpZWQgdGhpc0FyZyBhbmQgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIGJlIHdyYXBwZWQgYW5kIGNhbGxlZC5cbiAqIEByZXR1cm5zIEEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggYSBzcGVjaWZpZWQgdGhpc0FyZyBhbmQgYXJndW1lbnRzLlxuICovXG5mdW5jdGlvbiB1bmFwcGx5KGZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0aGlzQXJnKSB7XG4gICAgaWYgKHRoaXNBcmcgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIHRoaXNBcmcubGFzdEluZGV4ID0gMDtcbiAgICB9XG4gICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4zID4gMSA/IF9sZW4zIC0gMSA6IDApLCBfa2V5MyA9IDE7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgIGFyZ3NbX2tleTMgLSAxXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgfVxuICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzQXJnLCBhcmdzKTtcbiAgfTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNvbnN0cnVjdHMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gZnVuYyAtIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBiZSB3cmFwcGVkIGFuZCBjYWxsZWQuXG4gKiBAcmV0dXJucyBBIG5ldyBmdW5jdGlvbiB0aGF0IGNvbnN0cnVjdHMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50cy5cbiAqL1xuZnVuY3Rpb24gdW5jb25zdHJ1Y3QoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCksIF9rZXk0ID0gMDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgYXJnc1tfa2V5NF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgIH1cbiAgICByZXR1cm4gY29uc3RydWN0KEZ1bmMsIGFyZ3MpO1xuICB9O1xufVxuLyoqXG4gKiBBZGQgcHJvcGVydGllcyB0byBhIGxvb2t1cCB0YWJsZVxuICpcbiAqIEBwYXJhbSBzZXQgLSBUaGUgc2V0IHRvIHdoaWNoIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQuXG4gKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyBlbGVtZW50cyB0byBiZSBhZGRlZCB0byB0aGUgc2V0LlxuICogQHBhcmFtIHRyYW5zZm9ybUNhc2VGdW5jIC0gQW4gb3B0aW9uYWwgZnVuY3Rpb24gdG8gdHJhbnNmb3JtIHRoZSBjYXNlIG9mIGVhY2ggZWxlbWVudCBiZWZvcmUgYWRkaW5nIHRvIHRoZSBzZXQuXG4gKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgc2V0IHdpdGggYWRkZWQgZWxlbWVudHMuXG4gKi9cbmZ1bmN0aW9uIGFkZFRvU2V0KHNldCwgYXJyYXkpIHtcbiAgbGV0IHRyYW5zZm9ybUNhc2VGdW5jID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBzdHJpbmdUb0xvd2VyQ2FzZTtcbiAgaWYgKHNldFByb3RvdHlwZU9mKSB7XG4gICAgLy8gTWFrZSAnaW4nIGFuZCB0cnV0aHkgY2hlY2tzIGxpa2UgQm9vbGVhbihzZXQuY29uc3RydWN0b3IpXG4gICAgLy8gaW5kZXBlbmRlbnQgb2YgYW55IHByb3BlcnRpZXMgZGVmaW5lZCBvbiBPYmplY3QucHJvdG90eXBlLlxuICAgIC8vIFByZXZlbnQgcHJvdG90eXBlIHNldHRlcnMgZnJvbSBpbnRlcmNlcHRpbmcgc2V0IGFzIGEgdGhpcyB2YWx1ZS5cbiAgICBzZXRQcm90b3R5cGVPZihzZXQsIG51bGwpO1xuICB9XG4gIGxldCBsID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobC0tKSB7XG4gICAgbGV0IGVsZW1lbnQgPSBhcnJheVtsXTtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBsY0VsZW1lbnQgPSB0cmFuc2Zvcm1DYXNlRnVuYyhlbGVtZW50KTtcbiAgICAgIGlmIChsY0VsZW1lbnQgIT09IGVsZW1lbnQpIHtcbiAgICAgICAgLy8gQ29uZmlnIHByZXNldHMgKGUuZy4gdGFncy5qcywgYXR0cnMuanMpIGFyZSBpbW11dGFibGUuXG4gICAgICAgIGlmICghaXNGcm96ZW4oYXJyYXkpKSB7XG4gICAgICAgICAgYXJyYXlbbF0gPSBsY0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudCA9IGxjRWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgc2V0W2VsZW1lbnRdID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gc2V0O1xufVxuLyoqXG4gKiBDbGVhbiB1cCBhbiBhcnJheSB0byBoYXJkZW4gYWdhaW5zdCBDU1BQXG4gKlxuICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IHRvIGJlIGNsZWFuZWQuXG4gKiBAcmV0dXJucyBUaGUgY2xlYW5lZCB2ZXJzaW9uIG9mIHRoZSBhcnJheVxuICovXG5mdW5jdGlvbiBjbGVhbkFycmF5KGFycmF5KSB7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBhcnJheS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBjb25zdCBpc1Byb3BlcnR5RXhpc3QgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShhcnJheSwgaW5kZXgpO1xuICAgIGlmICghaXNQcm9wZXJ0eUV4aXN0KSB7XG4gICAgICBhcnJheVtpbmRleF0gPSBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG4vKipcbiAqIFNoYWxsb3cgY2xvbmUgYW4gb2JqZWN0XG4gKlxuICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gYmUgY2xvbmVkLlxuICogQHJldHVybnMgQSBuZXcgb2JqZWN0IHRoYXQgY29waWVzIHRoZSBvcmlnaW5hbC5cbiAqL1xuZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gIGNvbnN0IG5ld09iamVjdCA9IGNyZWF0ZShudWxsKTtcbiAgZm9yIChjb25zdCBbcHJvcGVydHksIHZhbHVlXSBvZiBlbnRyaWVzKG9iamVjdCkpIHtcbiAgICBjb25zdCBpc1Byb3BlcnR5RXhpc3QgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5KTtcbiAgICBpZiAoaXNQcm9wZXJ0eUV4aXN0KSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IGNsZWFuQXJyYXkodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBPYmplY3QpIHtcbiAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IGNsb25lKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ld09iamVjdDtcbn1cbi8qKlxuICogVGhpcyBtZXRob2QgYXV0b21hdGljYWxseSBjaGVja3MgaWYgdGhlIHByb3AgaXMgZnVuY3Rpb24gb3IgZ2V0dGVyIGFuZCBiZWhhdmVzIGFjY29yZGluZ2x5LlxuICpcbiAqIEBwYXJhbSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIGxvb2sgdXAgdGhlIGdldHRlciBmdW5jdGlvbiBpbiBpdHMgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIHByb3AgLSBUaGUgcHJvcGVydHkgbmFtZSBmb3Igd2hpY2ggdG8gZmluZCB0aGUgZ2V0dGVyIGZ1bmN0aW9uLlxuICogQHJldHVybnMgVGhlIGdldHRlciBmdW5jdGlvbiBmb3VuZCBpbiB0aGUgcHJvdG90eXBlIGNoYWluIG9yIGEgZmFsbGJhY2sgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGxvb2t1cEdldHRlcihvYmplY3QsIHByb3ApIHtcbiAgd2hpbGUgKG9iamVjdCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wKTtcbiAgICBpZiAoZGVzYykge1xuICAgICAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgICAgIHJldHVybiB1bmFwcGx5KGRlc2MuZ2V0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgZGVzYy52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdW5hcHBseShkZXNjLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgb2JqZWN0ID0gZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgfVxuICBmdW5jdGlvbiBmYWxsYmFja1ZhbHVlKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBmYWxsYmFja1ZhbHVlO1xufVxuXG5jb25zdCBodG1sJDEgPSBmcmVlemUoWydhJywgJ2FiYnInLCAnYWNyb255bScsICdhZGRyZXNzJywgJ2FyZWEnLCAnYXJ0aWNsZScsICdhc2lkZScsICdhdWRpbycsICdiJywgJ2JkaScsICdiZG8nLCAnYmlnJywgJ2JsaW5rJywgJ2Jsb2NrcXVvdGUnLCAnYm9keScsICdicicsICdidXR0b24nLCAnY2FudmFzJywgJ2NhcHRpb24nLCAnY2VudGVyJywgJ2NpdGUnLCAnY29kZScsICdjb2wnLCAnY29sZ3JvdXAnLCAnY29udGVudCcsICdkYXRhJywgJ2RhdGFsaXN0JywgJ2RkJywgJ2RlY29yYXRvcicsICdkZWwnLCAnZGV0YWlscycsICdkZm4nLCAnZGlhbG9nJywgJ2RpcicsICdkaXYnLCAnZGwnLCAnZHQnLCAnZWxlbWVudCcsICdlbScsICdmaWVsZHNldCcsICdmaWdjYXB0aW9uJywgJ2ZpZ3VyZScsICdmb250JywgJ2Zvb3RlcicsICdmb3JtJywgJ2gxJywgJ2gyJywgJ2gzJywgJ2g0JywgJ2g1JywgJ2g2JywgJ2hlYWQnLCAnaGVhZGVyJywgJ2hncm91cCcsICdocicsICdodG1sJywgJ2knLCAnaW1nJywgJ2lucHV0JywgJ2lucycsICdrYmQnLCAnbGFiZWwnLCAnbGVnZW5kJywgJ2xpJywgJ21haW4nLCAnbWFwJywgJ21hcmsnLCAnbWFycXVlZScsICdtZW51JywgJ21lbnVpdGVtJywgJ21ldGVyJywgJ25hdicsICdub2JyJywgJ29sJywgJ29wdGdyb3VwJywgJ29wdGlvbicsICdvdXRwdXQnLCAncCcsICdwaWN0dXJlJywgJ3ByZScsICdwcm9ncmVzcycsICdxJywgJ3JwJywgJ3J0JywgJ3J1YnknLCAncycsICdzYW1wJywgJ3NlYXJjaCcsICdzZWN0aW9uJywgJ3NlbGVjdCcsICdzaGFkb3cnLCAnc2xvdCcsICdzbWFsbCcsICdzb3VyY2UnLCAnc3BhY2VyJywgJ3NwYW4nLCAnc3RyaWtlJywgJ3N0cm9uZycsICdzdHlsZScsICdzdWInLCAnc3VtbWFyeScsICdzdXAnLCAndGFibGUnLCAndGJvZHknLCAndGQnLCAndGVtcGxhdGUnLCAndGV4dGFyZWEnLCAndGZvb3QnLCAndGgnLCAndGhlYWQnLCAndGltZScsICd0cicsICd0cmFjaycsICd0dCcsICd1JywgJ3VsJywgJ3ZhcicsICd2aWRlbycsICd3YnInXSk7XG5jb25zdCBzdmckMSA9IGZyZWV6ZShbJ3N2ZycsICdhJywgJ2FsdGdseXBoJywgJ2FsdGdseXBoZGVmJywgJ2FsdGdseXBoaXRlbScsICdhbmltYXRlY29sb3InLCAnYW5pbWF0ZW1vdGlvbicsICdhbmltYXRldHJhbnNmb3JtJywgJ2NpcmNsZScsICdjbGlwcGF0aCcsICdkZWZzJywgJ2Rlc2MnLCAnZWxsaXBzZScsICdlbnRlcmtleWhpbnQnLCAnZXhwb3J0cGFydHMnLCAnZmlsdGVyJywgJ2ZvbnQnLCAnZycsICdnbHlwaCcsICdnbHlwaHJlZicsICdoa2VybicsICdpbWFnZScsICdpbnB1dG1vZGUnLCAnbGluZScsICdsaW5lYXJncmFkaWVudCcsICdtYXJrZXInLCAnbWFzaycsICdtZXRhZGF0YScsICdtcGF0aCcsICdwYXJ0JywgJ3BhdGgnLCAncGF0dGVybicsICdwb2x5Z29uJywgJ3BvbHlsaW5lJywgJ3JhZGlhbGdyYWRpZW50JywgJ3JlY3QnLCAnc3RvcCcsICdzdHlsZScsICdzd2l0Y2gnLCAnc3ltYm9sJywgJ3RleHQnLCAndGV4dHBhdGgnLCAndGl0bGUnLCAndHJlZicsICd0c3BhbicsICd2aWV3JywgJ3ZrZXJuJ10pO1xuY29uc3Qgc3ZnRmlsdGVycyA9IGZyZWV6ZShbJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsICdmZUNvbXBvbmVudFRyYW5zZmVyJywgJ2ZlQ29tcG9zaXRlJywgJ2ZlQ29udm9sdmVNYXRyaXgnLCAnZmVEaWZmdXNlTGlnaHRpbmcnLCAnZmVEaXNwbGFjZW1lbnRNYXAnLCAnZmVEaXN0YW50TGlnaHQnLCAnZmVEcm9wU2hhZG93JywgJ2ZlRmxvb2QnLCAnZmVGdW5jQScsICdmZUZ1bmNCJywgJ2ZlRnVuY0cnLCAnZmVGdW5jUicsICdmZUdhdXNzaWFuQmx1cicsICdmZUltYWdlJywgJ2ZlTWVyZ2UnLCAnZmVNZXJnZU5vZGUnLCAnZmVNb3JwaG9sb2d5JywgJ2ZlT2Zmc2V0JywgJ2ZlUG9pbnRMaWdodCcsICdmZVNwZWN1bGFyTGlnaHRpbmcnLCAnZmVTcG90TGlnaHQnLCAnZmVUaWxlJywgJ2ZlVHVyYnVsZW5jZSddKTtcbi8vIExpc3Qgb2YgU1ZHIGVsZW1lbnRzIHRoYXQgYXJlIGRpc2FsbG93ZWQgYnkgZGVmYXVsdC5cbi8vIFdlIHN0aWxsIG5lZWQgdG8ga25vdyB0aGVtIHNvIHRoYXQgd2UgY2FuIGRvIG5hbWVzcGFjZVxuLy8gY2hlY2tzIHByb3Blcmx5IGluIGNhc2Ugb25lIHdhbnRzIHRvIGFkZCB0aGVtIHRvXG4vLyBhbGxvdy1saXN0LlxuY29uc3Qgc3ZnRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ2FuaW1hdGUnLCAnY29sb3ItcHJvZmlsZScsICdjdXJzb3InLCAnZGlzY2FyZCcsICdmb250LWZhY2UnLCAnZm9udC1mYWNlLWZvcm1hdCcsICdmb250LWZhY2UtbmFtZScsICdmb250LWZhY2Utc3JjJywgJ2ZvbnQtZmFjZS11cmknLCAnZm9yZWlnbm9iamVjdCcsICdoYXRjaCcsICdoYXRjaHBhdGgnLCAnbWVzaCcsICdtZXNoZ3JhZGllbnQnLCAnbWVzaHBhdGNoJywgJ21lc2hyb3cnLCAnbWlzc2luZy1nbHlwaCcsICdzY3JpcHQnLCAnc2V0JywgJ3NvbGlkY29sb3InLCAndW5rbm93bicsICd1c2UnXSk7XG5jb25zdCBtYXRoTWwkMSA9IGZyZWV6ZShbJ21hdGgnLCAnbWVuY2xvc2UnLCAnbWVycm9yJywgJ21mZW5jZWQnLCAnbWZyYWMnLCAnbWdseXBoJywgJ21pJywgJ21sYWJlbGVkdHInLCAnbW11bHRpc2NyaXB0cycsICdtbicsICdtbycsICdtb3ZlcicsICdtcGFkZGVkJywgJ21waGFudG9tJywgJ21yb290JywgJ21yb3cnLCAnbXMnLCAnbXNwYWNlJywgJ21zcXJ0JywgJ21zdHlsZScsICdtc3ViJywgJ21zdXAnLCAnbXN1YnN1cCcsICdtdGFibGUnLCAnbXRkJywgJ210ZXh0JywgJ210cicsICdtdW5kZXInLCAnbXVuZGVyb3ZlcicsICdtcHJlc2NyaXB0cyddKTtcbi8vIFNpbWlsYXJseSB0byBTVkcsIHdlIHdhbnQgdG8ga25vdyBhbGwgTWF0aE1MIGVsZW1lbnRzLFxuLy8gZXZlbiB0aG9zZSB0aGF0IHdlIGRpc2FsbG93IGJ5IGRlZmF1bHQuXG5jb25zdCBtYXRoTWxEaXNhbGxvd2VkID0gZnJlZXplKFsnbWFjdGlvbicsICdtYWxpZ25ncm91cCcsICdtYWxpZ25tYXJrJywgJ21sb25nZGl2JywgJ21zY2FycmllcycsICdtc2NhcnJ5JywgJ21zZ3JvdXAnLCAnbXN0YWNrJywgJ21zbGluZScsICdtc3JvdycsICdzZW1hbnRpY3MnLCAnYW5ub3RhdGlvbicsICdhbm5vdGF0aW9uLXhtbCcsICdtcHJlc2NyaXB0cycsICdub25lJ10pO1xuY29uc3QgdGV4dCA9IGZyZWV6ZShbJyN0ZXh0J10pO1xuXG5jb25zdCBodG1sID0gZnJlZXplKFsnYWNjZXB0JywgJ2FjdGlvbicsICdhbGlnbicsICdhbHQnLCAnYXV0b2NhcGl0YWxpemUnLCAnYXV0b2NvbXBsZXRlJywgJ2F1dG9waWN0dXJlaW5waWN0dXJlJywgJ2F1dG9wbGF5JywgJ2JhY2tncm91bmQnLCAnYmdjb2xvcicsICdib3JkZXInLCAnY2FwdHVyZScsICdjZWxscGFkZGluZycsICdjZWxsc3BhY2luZycsICdjaGVja2VkJywgJ2NpdGUnLCAnY2xhc3MnLCAnY2xlYXInLCAnY29sb3InLCAnY29scycsICdjb2xzcGFuJywgJ2NvbnRyb2xzJywgJ2NvbnRyb2xzbGlzdCcsICdjb29yZHMnLCAnY3Jvc3NvcmlnaW4nLCAnZGF0ZXRpbWUnLCAnZGVjb2RpbmcnLCAnZGVmYXVsdCcsICdkaXInLCAnZGlzYWJsZWQnLCAnZGlzYWJsZXBpY3R1cmVpbnBpY3R1cmUnLCAnZGlzYWJsZXJlbW90ZXBsYXliYWNrJywgJ2Rvd25sb2FkJywgJ2RyYWdnYWJsZScsICdlbmN0eXBlJywgJ2VudGVya2V5aGludCcsICdleHBvcnRwYXJ0cycsICdmYWNlJywgJ2ZvcicsICdoZWFkZXJzJywgJ2hlaWdodCcsICdoaWRkZW4nLCAnaGlnaCcsICdocmVmJywgJ2hyZWZsYW5nJywgJ2lkJywgJ2luZXJ0JywgJ2lucHV0bW9kZScsICdpbnRlZ3JpdHknLCAnaXNtYXAnLCAna2luZCcsICdsYWJlbCcsICdsYW5nJywgJ2xpc3QnLCAnbG9hZGluZycsICdsb29wJywgJ2xvdycsICdtYXgnLCAnbWF4bGVuZ3RoJywgJ21lZGlhJywgJ21ldGhvZCcsICdtaW4nLCAnbWlubGVuZ3RoJywgJ211bHRpcGxlJywgJ211dGVkJywgJ25hbWUnLCAnbm9uY2UnLCAnbm9zaGFkZScsICdub3ZhbGlkYXRlJywgJ25vd3JhcCcsICdvcGVuJywgJ29wdGltdW0nLCAncGFydCcsICdwYXR0ZXJuJywgJ3BsYWNlaG9sZGVyJywgJ3BsYXlzaW5saW5lJywgJ3BvcG92ZXInLCAncG9wb3ZlcnRhcmdldCcsICdwb3BvdmVydGFyZ2V0YWN0aW9uJywgJ3Bvc3RlcicsICdwcmVsb2FkJywgJ3B1YmRhdGUnLCAncmFkaW9ncm91cCcsICdyZWFkb25seScsICdyZWwnLCAncmVxdWlyZWQnLCAncmV2JywgJ3JldmVyc2VkJywgJ3JvbGUnLCAncm93cycsICdyb3dzcGFuJywgJ3NwZWxsY2hlY2snLCAnc2NvcGUnLCAnc2VsZWN0ZWQnLCAnc2hhcGUnLCAnc2l6ZScsICdzaXplcycsICdzbG90JywgJ3NwYW4nLCAnc3JjbGFuZycsICdzdGFydCcsICdzcmMnLCAnc3Jjc2V0JywgJ3N0ZXAnLCAnc3R5bGUnLCAnc3VtbWFyeScsICd0YWJpbmRleCcsICd0aXRsZScsICd0cmFuc2xhdGUnLCAndHlwZScsICd1c2VtYXAnLCAndmFsaWduJywgJ3ZhbHVlJywgJ3dpZHRoJywgJ3dyYXAnLCAneG1sbnMnLCAnc2xvdCddKTtcbmNvbnN0IHN2ZyA9IGZyZWV6ZShbJ2FjY2VudC1oZWlnaHQnLCAnYWNjdW11bGF0ZScsICdhZGRpdGl2ZScsICdhbGlnbm1lbnQtYmFzZWxpbmUnLCAnYW1wbGl0dWRlJywgJ2FzY2VudCcsICdhdHRyaWJ1dGVuYW1lJywgJ2F0dHJpYnV0ZXR5cGUnLCAnYXppbXV0aCcsICdiYXNlZnJlcXVlbmN5JywgJ2Jhc2VsaW5lLXNoaWZ0JywgJ2JlZ2luJywgJ2JpYXMnLCAnYnknLCAnY2xhc3MnLCAnY2xpcCcsICdjbGlwcGF0aHVuaXRzJywgJ2NsaXAtcGF0aCcsICdjbGlwLXJ1bGUnLCAnY29sb3InLCAnY29sb3ItaW50ZXJwb2xhdGlvbicsICdjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnMnLCAnY29sb3ItcHJvZmlsZScsICdjb2xvci1yZW5kZXJpbmcnLCAnY3gnLCAnY3knLCAnZCcsICdkeCcsICdkeScsICdkaWZmdXNlY29uc3RhbnQnLCAnZGlyZWN0aW9uJywgJ2Rpc3BsYXknLCAnZGl2aXNvcicsICdkdXInLCAnZWRnZW1vZGUnLCAnZWxldmF0aW9uJywgJ2VuZCcsICdleHBvbmVudCcsICdmaWxsJywgJ2ZpbGwtb3BhY2l0eScsICdmaWxsLXJ1bGUnLCAnZmlsdGVyJywgJ2ZpbHRlcnVuaXRzJywgJ2Zsb29kLWNvbG9yJywgJ2Zsb29kLW9wYWNpdHknLCAnZm9udC1mYW1pbHknLCAnZm9udC1zaXplJywgJ2ZvbnQtc2l6ZS1hZGp1c3QnLCAnZm9udC1zdHJldGNoJywgJ2ZvbnQtc3R5bGUnLCAnZm9udC12YXJpYW50JywgJ2ZvbnQtd2VpZ2h0JywgJ2Z4JywgJ2Z5JywgJ2cxJywgJ2cyJywgJ2dseXBoLW5hbWUnLCAnZ2x5cGhyZWYnLCAnZ3JhZGllbnR1bml0cycsICdncmFkaWVudHRyYW5zZm9ybScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdpbWFnZS1yZW5kZXJpbmcnLCAnaW4nLCAnaW4yJywgJ2ludGVyY2VwdCcsICdrJywgJ2sxJywgJ2syJywgJ2szJywgJ2s0JywgJ2tlcm5pbmcnLCAna2V5cG9pbnRzJywgJ2tleXNwbGluZXMnLCAna2V5dGltZXMnLCAnbGFuZycsICdsZW5ndGhhZGp1c3QnLCAnbGV0dGVyLXNwYWNpbmcnLCAna2VybmVsbWF0cml4JywgJ2tlcm5lbHVuaXRsZW5ndGgnLCAnbGlnaHRpbmctY29sb3InLCAnbG9jYWwnLCAnbWFya2VyLWVuZCcsICdtYXJrZXItbWlkJywgJ21hcmtlci1zdGFydCcsICdtYXJrZXJoZWlnaHQnLCAnbWFya2VydW5pdHMnLCAnbWFya2Vyd2lkdGgnLCAnbWFza2NvbnRlbnR1bml0cycsICdtYXNrdW5pdHMnLCAnbWF4JywgJ21hc2snLCAnbWFzay10eXBlJywgJ21lZGlhJywgJ21ldGhvZCcsICdtb2RlJywgJ21pbicsICduYW1lJywgJ251bW9jdGF2ZXMnLCAnb2Zmc2V0JywgJ29wZXJhdG9yJywgJ29wYWNpdHknLCAnb3JkZXInLCAnb3JpZW50JywgJ29yaWVudGF0aW9uJywgJ29yaWdpbicsICdvdmVyZmxvdycsICdwYWludC1vcmRlcicsICdwYXRoJywgJ3BhdGhsZW5ndGgnLCAncGF0dGVybmNvbnRlbnR1bml0cycsICdwYXR0ZXJudHJhbnNmb3JtJywgJ3BhdHRlcm51bml0cycsICdwb2ludHMnLCAncHJlc2VydmVhbHBoYScsICdwcmVzZXJ2ZWFzcGVjdHJhdGlvJywgJ3ByaW1pdGl2ZXVuaXRzJywgJ3InLCAncngnLCAncnknLCAncmFkaXVzJywgJ3JlZngnLCAncmVmeScsICdyZXBlYXRjb3VudCcsICdyZXBlYXRkdXInLCAncmVzdGFydCcsICdyZXN1bHQnLCAncm90YXRlJywgJ3NjYWxlJywgJ3NlZWQnLCAnc2hhcGUtcmVuZGVyaW5nJywgJ3Nsb3BlJywgJ3NwZWN1bGFyY29uc3RhbnQnLCAnc3BlY3VsYXJleHBvbmVudCcsICdzcHJlYWRtZXRob2QnLCAnc3RhcnRvZmZzZXQnLCAnc3RkZGV2aWF0aW9uJywgJ3N0aXRjaHRpbGVzJywgJ3N0b3AtY29sb3InLCAnc3RvcC1vcGFjaXR5JywgJ3N0cm9rZS1kYXNoYXJyYXknLCAnc3Ryb2tlLWRhc2hvZmZzZXQnLCAnc3Ryb2tlLWxpbmVjYXAnLCAnc3Ryb2tlLWxpbmVqb2luJywgJ3N0cm9rZS1taXRlcmxpbWl0JywgJ3N0cm9rZS1vcGFjaXR5JywgJ3N0cm9rZScsICdzdHJva2Utd2lkdGgnLCAnc3R5bGUnLCAnc3VyZmFjZXNjYWxlJywgJ3N5c3RlbWxhbmd1YWdlJywgJ3RhYmluZGV4JywgJ3RhYmxldmFsdWVzJywgJ3RhcmdldHgnLCAndGFyZ2V0eScsICd0cmFuc2Zvcm0nLCAndHJhbnNmb3JtLW9yaWdpbicsICd0ZXh0LWFuY2hvcicsICd0ZXh0LWRlY29yYXRpb24nLCAndGV4dC1yZW5kZXJpbmcnLCAndGV4dGxlbmd0aCcsICd0eXBlJywgJ3UxJywgJ3UyJywgJ3VuaWNvZGUnLCAndmFsdWVzJywgJ3ZpZXdib3gnLCAndmlzaWJpbGl0eScsICd2ZXJzaW9uJywgJ3ZlcnQtYWR2LXknLCAndmVydC1vcmlnaW4teCcsICd2ZXJ0LW9yaWdpbi15JywgJ3dpZHRoJywgJ3dvcmQtc3BhY2luZycsICd3cmFwJywgJ3dyaXRpbmctbW9kZScsICd4Y2hhbm5lbHNlbGVjdG9yJywgJ3ljaGFubmVsc2VsZWN0b3InLCAneCcsICd4MScsICd4MicsICd4bWxucycsICd5JywgJ3kxJywgJ3kyJywgJ3onLCAnem9vbWFuZHBhbiddKTtcbmNvbnN0IG1hdGhNbCA9IGZyZWV6ZShbJ2FjY2VudCcsICdhY2NlbnR1bmRlcicsICdhbGlnbicsICdiZXZlbGxlZCcsICdjbG9zZScsICdjb2x1bW5zYWxpZ24nLCAnY29sdW1ubGluZXMnLCAnY29sdW1uc3BhbicsICdkZW5vbWFsaWduJywgJ2RlcHRoJywgJ2RpcicsICdkaXNwbGF5JywgJ2Rpc3BsYXlzdHlsZScsICdlbmNvZGluZycsICdmZW5jZScsICdmcmFtZScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdsYXJnZW9wJywgJ2xlbmd0aCcsICdsaW5ldGhpY2tuZXNzJywgJ2xzcGFjZScsICdscXVvdGUnLCAnbWF0aGJhY2tncm91bmQnLCAnbWF0aGNvbG9yJywgJ21hdGhzaXplJywgJ21hdGh2YXJpYW50JywgJ21heHNpemUnLCAnbWluc2l6ZScsICdtb3ZhYmxlbGltaXRzJywgJ25vdGF0aW9uJywgJ251bWFsaWduJywgJ29wZW4nLCAncm93YWxpZ24nLCAncm93bGluZXMnLCAncm93c3BhY2luZycsICdyb3dzcGFuJywgJ3JzcGFjZScsICdycXVvdGUnLCAnc2NyaXB0bGV2ZWwnLCAnc2NyaXB0bWluc2l6ZScsICdzY3JpcHRzaXplbXVsdGlwbGllcicsICdzZWxlY3Rpb24nLCAnc2VwYXJhdG9yJywgJ3NlcGFyYXRvcnMnLCAnc3RyZXRjaHknLCAnc3Vic2NyaXB0c2hpZnQnLCAnc3Vwc2NyaXB0c2hpZnQnLCAnc3ltbWV0cmljJywgJ3ZvZmZzZXQnLCAnd2lkdGgnLCAneG1sbnMnXSk7XG5jb25zdCB4bWwgPSBmcmVlemUoWyd4bGluazpocmVmJywgJ3htbDppZCcsICd4bGluazp0aXRsZScsICd4bWw6c3BhY2UnLCAneG1sbnM6eGxpbmsnXSk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL2JldHRlci1yZWdleFxuY29uc3QgTVVTVEFDSEVfRVhQUiA9IHNlYWwoL1xce1xce1tcXHdcXFddKnxbXFx3XFxXXSpcXH1cXH0vZ20pOyAvLyBTcGVjaWZ5IHRlbXBsYXRlIGRldGVjdGlvbiByZWdleCBmb3IgU0FGRV9GT1JfVEVNUExBVEVTIG1vZGVcbmNvbnN0IEVSQl9FWFBSID0gc2VhbCgvPCVbXFx3XFxXXSp8W1xcd1xcV10qJT4vZ20pO1xuY29uc3QgVE1QTElUX0VYUFIgPSBzZWFsKC9cXCRcXHtbXFx3XFxXXSovZ20pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVuaWNvcm4vYmV0dGVyLXJlZ2V4XG5jb25zdCBEQVRBX0FUVFIgPSBzZWFsKC9eZGF0YS1bXFwtXFx3LlxcdTAwQjctXFx1RkZGRl0rJC8pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG5jb25zdCBBUklBX0FUVFIgPSBzZWFsKC9eYXJpYS1bXFwtXFx3XSskLyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbmNvbnN0IElTX0FMTE9XRURfVVJJID0gc2VhbCgvXig/Oig/Oig/OmZ8aHQpdHBzP3xtYWlsdG98dGVsfGNhbGx0b3xzbXN8Y2lkfHhtcHB8bWF0cml4KTp8W15hLXpdfFthLXorLlxcLV0rKD86W15hLXorLlxcLTpdfCQpKS9pIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbik7XG5jb25zdCBJU19TQ1JJUFRfT1JfREFUQSA9IHNlYWwoL14oPzpcXHcrc2NyaXB0fGRhdGEpOi9pKTtcbmNvbnN0IEFUVFJfV0hJVEVTUEFDRSA9IHNlYWwoL1tcXHUwMDAwLVxcdTAwMjBcXHUwMEEwXFx1MTY4MFxcdTE4MEVcXHUyMDAwLVxcdTIwMjlcXHUyMDVGXFx1MzAwMF0vZyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbik7XG5jb25zdCBET0NUWVBFX05BTUUgPSBzZWFsKC9eaHRtbCQvaSk7XG5jb25zdCBDVVNUT01fRUxFTUVOVCA9IHNlYWwoL15bYS16XVsuXFx3XSooLVsuXFx3XSspKyQvaSk7XG5cbnZhciBFWFBSRVNTSU9OUyA9IC8qI19fUFVSRV9fKi9PYmplY3QuZnJlZXplKHtcbiAgX19wcm90b19fOiBudWxsLFxuICBBUklBX0FUVFI6IEFSSUFfQVRUUixcbiAgQVRUUl9XSElURVNQQUNFOiBBVFRSX1dISVRFU1BBQ0UsXG4gIENVU1RPTV9FTEVNRU5UOiBDVVNUT01fRUxFTUVOVCxcbiAgREFUQV9BVFRSOiBEQVRBX0FUVFIsXG4gIERPQ1RZUEVfTkFNRTogRE9DVFlQRV9OQU1FLFxuICBFUkJfRVhQUjogRVJCX0VYUFIsXG4gIElTX0FMTE9XRURfVVJJOiBJU19BTExPV0VEX1VSSSxcbiAgSVNfU0NSSVBUX09SX0RBVEE6IElTX1NDUklQVF9PUl9EQVRBLFxuICBNVVNUQUNIRV9FWFBSOiBNVVNUQUNIRV9FWFBSLFxuICBUTVBMSVRfRVhQUjogVE1QTElUX0VYUFJcbn0pO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvaW5kZW50ICovXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZVxuY29uc3QgTk9ERV9UWVBFID0ge1xuICBlbGVtZW50OiAxLFxuICBhdHRyaWJ1dGU6IDIsXG4gIHRleHQ6IDMsXG4gIGNkYXRhU2VjdGlvbjogNCxcbiAgZW50aXR5UmVmZXJlbmNlOiA1LFxuICAvLyBEZXByZWNhdGVkXG4gIGVudGl0eU5vZGU6IDYsXG4gIC8vIERlcHJlY2F0ZWRcbiAgcHJvZ3Jlc3NpbmdJbnN0cnVjdGlvbjogNyxcbiAgY29tbWVudDogOCxcbiAgZG9jdW1lbnQ6IDksXG4gIGRvY3VtZW50VHlwZTogMTAsXG4gIGRvY3VtZW50RnJhZ21lbnQ6IDExLFxuICBub3RhdGlvbjogMTIgLy8gRGVwcmVjYXRlZFxufTtcbmNvbnN0IGdldEdsb2JhbCA9IGZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHdpbmRvdztcbn07XG4vKipcbiAqIENyZWF0ZXMgYSBuby1vcCBwb2xpY3kgZm9yIGludGVybmFsIHVzZSBvbmx5LlxuICogRG9uJ3QgZXhwb3J0IHRoaXMgZnVuY3Rpb24gb3V0c2lkZSB0aGlzIG1vZHVsZSFcbiAqIEBwYXJhbSB0cnVzdGVkVHlwZXMgVGhlIHBvbGljeSBmYWN0b3J5LlxuICogQHBhcmFtIHB1cmlmeUhvc3RFbGVtZW50IFRoZSBTY3JpcHQgZWxlbWVudCB1c2VkIHRvIGxvYWQgRE9NUHVyaWZ5ICh0byBkZXRlcm1pbmUgcG9saWN5IG5hbWUgc3VmZml4KS5cbiAqIEByZXR1cm4gVGhlIHBvbGljeSBjcmVhdGVkIChvciBudWxsLCBpZiBUcnVzdGVkIFR5cGVzXG4gKiBhcmUgbm90IHN1cHBvcnRlZCBvciBjcmVhdGluZyB0aGUgcG9saWN5IGZhaWxlZCkuXG4gKi9cbmNvbnN0IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kgPSBmdW5jdGlvbiBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5KHRydXN0ZWRUeXBlcywgcHVyaWZ5SG9zdEVsZW1lbnQpIHtcbiAgaWYgKHR5cGVvZiB0cnVzdGVkVHlwZXMgIT09ICdvYmplY3QnIHx8IHR5cGVvZiB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gQWxsb3cgdGhlIGNhbGxlcnMgdG8gY29udHJvbCB0aGUgdW5pcXVlIHBvbGljeSBuYW1lXG4gIC8vIGJ5IGFkZGluZyBhIGRhdGEtdHQtcG9saWN5LXN1ZmZpeCB0byB0aGUgc2NyaXB0IGVsZW1lbnQgd2l0aCB0aGUgRE9NUHVyaWZ5LlxuICAvLyBQb2xpY3kgY3JlYXRpb24gd2l0aCBkdXBsaWNhdGUgbmFtZXMgdGhyb3dzIGluIFRydXN0ZWQgVHlwZXMuXG4gIGxldCBzdWZmaXggPSBudWxsO1xuICBjb25zdCBBVFRSX05BTUUgPSAnZGF0YS10dC1wb2xpY3ktc3VmZml4JztcbiAgaWYgKHB1cmlmeUhvc3RFbGVtZW50ICYmIHB1cmlmeUhvc3RFbGVtZW50Lmhhc0F0dHJpYnV0ZShBVFRSX05BTUUpKSB7XG4gICAgc3VmZml4ID0gcHVyaWZ5SG9zdEVsZW1lbnQuZ2V0QXR0cmlidXRlKEFUVFJfTkFNRSk7XG4gIH1cbiAgY29uc3QgcG9saWN5TmFtZSA9ICdkb21wdXJpZnknICsgKHN1ZmZpeCA/ICcjJyArIHN1ZmZpeCA6ICcnKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gdHJ1c3RlZFR5cGVzLmNyZWF0ZVBvbGljeShwb2xpY3lOYW1lLCB7XG4gICAgICBjcmVhdGVIVE1MKGh0bWwpIHtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICB9LFxuICAgICAgY3JlYXRlU2NyaXB0VVJMKHNjcmlwdFVybCkge1xuICAgICAgICByZXR1cm4gc2NyaXB0VXJsO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChfKSB7XG4gICAgLy8gUG9saWN5IGNyZWF0aW9uIGZhaWxlZCAobW9zdCBsaWtlbHkgYW5vdGhlciBET01QdXJpZnkgc2NyaXB0IGhhc1xuICAgIC8vIGFscmVhZHkgcnVuKS4gU2tpcCBjcmVhdGluZyB0aGUgcG9saWN5LCBhcyB0aGlzIHdpbGwgb25seSBjYXVzZSBlcnJvcnNcbiAgICAvLyBpZiBUVCBhcmUgZW5mb3JjZWQuXG4gICAgY29uc29sZS53YXJuKCdUcnVzdGVkVHlwZXMgcG9saWN5ICcgKyBwb2xpY3lOYW1lICsgJyBjb3VsZCBub3QgYmUgY3JlYXRlZC4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbmNvbnN0IF9jcmVhdGVIb29rc01hcCA9IGZ1bmN0aW9uIF9jcmVhdGVIb29rc01hcCgpIHtcbiAgcmV0dXJuIHtcbiAgICBhZnRlclNhbml0aXplQXR0cmlidXRlczogW10sXG4gICAgYWZ0ZXJTYW5pdGl6ZUVsZW1lbnRzOiBbXSxcbiAgICBhZnRlclNhbml0aXplU2hhZG93RE9NOiBbXSxcbiAgICBiZWZvcmVTYW5pdGl6ZUF0dHJpYnV0ZXM6IFtdLFxuICAgIGJlZm9yZVNhbml0aXplRWxlbWVudHM6IFtdLFxuICAgIGJlZm9yZVNhbml0aXplU2hhZG93RE9NOiBbXSxcbiAgICB1cG9uU2FuaXRpemVBdHRyaWJ1dGU6IFtdLFxuICAgIHVwb25TYW5pdGl6ZUVsZW1lbnQ6IFtdLFxuICAgIHVwb25TYW5pdGl6ZVNoYWRvd05vZGU6IFtdXG4gIH07XG59O1xuZnVuY3Rpb24gY3JlYXRlRE9NUHVyaWZ5KCkge1xuICBsZXQgd2luZG93ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBnZXRHbG9iYWwoKTtcbiAgY29uc3QgRE9NUHVyaWZ5ID0gcm9vdCA9PiBjcmVhdGVET01QdXJpZnkocm9vdCk7XG4gIERPTVB1cmlmeS52ZXJzaW9uID0gJzMuMy4xJztcbiAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcbiAgaWYgKCF3aW5kb3cgfHwgIXdpbmRvdy5kb2N1bWVudCB8fCB3aW5kb3cuZG9jdW1lbnQubm9kZVR5cGUgIT09IE5PREVfVFlQRS5kb2N1bWVudCB8fCAhd2luZG93LkVsZW1lbnQpIHtcbiAgICAvLyBOb3QgcnVubmluZyBpbiBhIGJyb3dzZXIsIHByb3ZpZGUgYSBmYWN0b3J5IGZ1bmN0aW9uXG4gICAgLy8gc28gdGhhdCB5b3UgY2FuIHBhc3MgeW91ciBvd24gV2luZG93XG4gICAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIERPTVB1cmlmeTtcbiAgfVxuICBsZXQge1xuICAgIGRvY3VtZW50XG4gIH0gPSB3aW5kb3c7XG4gIGNvbnN0IG9yaWdpbmFsRG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgY29uc3QgY3VycmVudFNjcmlwdCA9IG9yaWdpbmFsRG9jdW1lbnQuY3VycmVudFNjcmlwdDtcbiAgY29uc3Qge1xuICAgIERvY3VtZW50RnJhZ21lbnQsXG4gICAgSFRNTFRlbXBsYXRlRWxlbWVudCxcbiAgICBOb2RlLFxuICAgIEVsZW1lbnQsXG4gICAgTm9kZUZpbHRlcixcbiAgICBOYW1lZE5vZGVNYXAgPSB3aW5kb3cuTmFtZWROb2RlTWFwIHx8IHdpbmRvdy5Nb3pOYW1lZEF0dHJNYXAsXG4gICAgSFRNTEZvcm1FbGVtZW50LFxuICAgIERPTVBhcnNlcixcbiAgICB0cnVzdGVkVHlwZXNcbiAgfSA9IHdpbmRvdztcbiAgY29uc3QgRWxlbWVudFByb3RvdHlwZSA9IEVsZW1lbnQucHJvdG90eXBlO1xuICBjb25zdCBjbG9uZU5vZGUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ2Nsb25lTm9kZScpO1xuICBjb25zdCByZW1vdmUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ3JlbW92ZScpO1xuICBjb25zdCBnZXROZXh0U2libGluZyA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnbmV4dFNpYmxpbmcnKTtcbiAgY29uc3QgZ2V0Q2hpbGROb2RlcyA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnY2hpbGROb2RlcycpO1xuICBjb25zdCBnZXRQYXJlbnROb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdwYXJlbnROb2RlJyk7XG4gIC8vIEFzIHBlciBpc3N1ZSAjNDcsIHRoZSB3ZWItY29tcG9uZW50cyByZWdpc3RyeSBpcyBpbmhlcml0ZWQgYnkgYVxuICAvLyBuZXcgZG9jdW1lbnQgY3JlYXRlZCB2aWEgY3JlYXRlSFRNTERvY3VtZW50LiBBcyBwZXIgdGhlIHNwZWNcbiAgLy8gKGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9jdXN0b20vI2NyZWF0aW5nLWFuZC1wYXNzaW5nLXJlZ2lzdHJpZXMpXG4gIC8vIGEgbmV3IGVtcHR5IHJlZ2lzdHJ5IGlzIHVzZWQgd2hlbiBjcmVhdGluZyBhIHRlbXBsYXRlIGNvbnRlbnRzIG93bmVyXG4gIC8vIGRvY3VtZW50LCBzbyB3ZSB1c2UgdGhhdCBhcyBvdXIgcGFyZW50IGRvY3VtZW50IHRvIGVuc3VyZSBub3RoaW5nXG4gIC8vIGlzIGluaGVyaXRlZC5cbiAgaWYgKHR5cGVvZiBIVE1MVGVtcGxhdGVFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgIGlmICh0ZW1wbGF0ZS5jb250ZW50ICYmIHRlbXBsYXRlLmNvbnRlbnQub3duZXJEb2N1bWVudCkge1xuICAgICAgZG9jdW1lbnQgPSB0ZW1wbGF0ZS5jb250ZW50Lm93bmVyRG9jdW1lbnQ7XG4gICAgfVxuICB9XG4gIGxldCB0cnVzdGVkVHlwZXNQb2xpY3k7XG4gIGxldCBlbXB0eUhUTUwgPSAnJztcbiAgY29uc3Qge1xuICAgIGltcGxlbWVudGF0aW9uLFxuICAgIGNyZWF0ZU5vZGVJdGVyYXRvcixcbiAgICBjcmVhdGVEb2N1bWVudEZyYWdtZW50LFxuICAgIGdldEVsZW1lbnRzQnlUYWdOYW1lXG4gIH0gPSBkb2N1bWVudDtcbiAgY29uc3Qge1xuICAgIGltcG9ydE5vZGVcbiAgfSA9IG9yaWdpbmFsRG9jdW1lbnQ7XG4gIGxldCBob29rcyA9IF9jcmVhdGVIb29rc01hcCgpO1xuICAvKipcbiAgICogRXhwb3NlIHdoZXRoZXIgdGhpcyBicm93c2VyIHN1cHBvcnRzIHJ1bm5pbmcgdGhlIGZ1bGwgRE9NUHVyaWZ5LlxuICAgKi9cbiAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gdHlwZW9mIGVudHJpZXMgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGdldFBhcmVudE5vZGUgPT09ICdmdW5jdGlvbicgJiYgaW1wbGVtZW50YXRpb24gJiYgaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50ICE9PSB1bmRlZmluZWQ7XG4gIGNvbnN0IHtcbiAgICBNVVNUQUNIRV9FWFBSLFxuICAgIEVSQl9FWFBSLFxuICAgIFRNUExJVF9FWFBSLFxuICAgIERBVEFfQVRUUixcbiAgICBBUklBX0FUVFIsXG4gICAgSVNfU0NSSVBUX09SX0RBVEEsXG4gICAgQVRUUl9XSElURVNQQUNFLFxuICAgIENVU1RPTV9FTEVNRU5UXG4gIH0gPSBFWFBSRVNTSU9OUztcbiAgbGV0IHtcbiAgICBJU19BTExPV0VEX1VSSTogSVNfQUxMT1dFRF9VUkkkMVxuICB9ID0gRVhQUkVTU0lPTlM7XG4gIC8qKlxuICAgKiBXZSBjb25zaWRlciB0aGUgZWxlbWVudHMgYW5kIGF0dHJpYnV0ZXMgYmVsb3cgdG8gYmUgc2FmZS4gSWRlYWxseVxuICAgKiBkb24ndCBhZGQgYW55IG5ldyBvbmVzIGJ1dCBmZWVsIGZyZWUgdG8gcmVtb3ZlIHVud2FudGVkIG9uZXMuXG4gICAqL1xuICAvKiBhbGxvd2VkIGVsZW1lbnQgbmFtZXMgKi9cbiAgbGV0IEFMTE9XRURfVEFHUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5odG1sJDEsIC4uLnN2ZyQxLCAuLi5zdmdGaWx0ZXJzLCAuLi5tYXRoTWwkMSwgLi4udGV4dF0pO1xuICAvKiBBbGxvd2VkIGF0dHJpYnV0ZSBuYW1lcyAqL1xuICBsZXQgQUxMT1dFRF9BVFRSID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9BTExPV0VEX0FUVFIgPSBhZGRUb1NldCh7fSwgWy4uLmh0bWwsIC4uLnN2ZywgLi4ubWF0aE1sLCAuLi54bWxdKTtcbiAgLypcbiAgICogQ29uZmlndXJlIGhvdyBET01QdXJpZnkgc2hvdWxkIGhhbmRsZSBjdXN0b20gZWxlbWVudHMgYW5kIHRoZWlyIGF0dHJpYnV0ZXMgYXMgd2VsbCBhcyBjdXN0b21pemVkIGJ1aWx0LWluIGVsZW1lbnRzLlxuICAgKiBAcHJvcGVydHkge1JlZ0V4cHxGdW5jdGlvbnxudWxsfSB0YWdOYW1lQ2hlY2sgb25lIG9mIFtudWxsLCByZWdleFBhdHRlcm4sIHByZWRpY2F0ZV0uIERlZmF1bHQ6IGBudWxsYCAoZGlzYWxsb3cgYW55IGN1c3RvbSBlbGVtZW50cylcbiAgICogQHByb3BlcnR5IHtSZWdFeHB8RnVuY3Rpb258bnVsbH0gYXR0cmlidXRlTmFtZUNoZWNrIG9uZSBvZiBbbnVsbCwgcmVnZXhQYXR0ZXJuLCBwcmVkaWNhdGVdLiBEZWZhdWx0OiBgbnVsbGAgKGRpc2FsbG93IGFueSBhdHRyaWJ1dGVzIG5vdCBvbiB0aGUgYWxsb3cgbGlzdClcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBhbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgYWxsb3cgY3VzdG9tIGVsZW1lbnRzIGRlcml2ZWQgZnJvbSBidWlsdC1pbnMgaWYgdGhleSBwYXNzIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjay4gRGVmYXVsdDogYGZhbHNlYC5cbiAgICovXG4gIGxldCBDVVNUT01fRUxFTUVOVF9IQU5ETElORyA9IE9iamVjdC5zZWFsKGNyZWF0ZShudWxsLCB7XG4gICAgdGFnTmFtZUNoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9LFxuICAgIGF0dHJpYnV0ZU5hbWVDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfSxcbiAgICBhbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHM6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogZmFsc2VcbiAgICB9XG4gIH0pKTtcbiAgLyogRXhwbGljaXRseSBmb3JiaWRkZW4gdGFncyAob3ZlcnJpZGVzIEFMTE9XRURfVEFHUy9BRERfVEFHUykgKi9cbiAgbGV0IEZPUkJJRF9UQUdTID0gbnVsbDtcbiAgLyogRXhwbGljaXRseSBmb3JiaWRkZW4gYXR0cmlidXRlcyAob3ZlcnJpZGVzIEFMTE9XRURfQVRUUi9BRERfQVRUUikgKi9cbiAgbGV0IEZPUkJJRF9BVFRSID0gbnVsbDtcbiAgLyogQ29uZmlnIG9iamVjdCB0byBzdG9yZSBBRERfVEFHUy9BRERfQVRUUiBmdW5jdGlvbnMgKHdoZW4gdXNlZCBhcyBmdW5jdGlvbnMpICovXG4gIGNvbnN0IEVYVFJBX0VMRU1FTlRfSEFORExJTkcgPSBPYmplY3Quc2VhbChjcmVhdGUobnVsbCwge1xuICAgIHRhZ0NoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9LFxuICAgIGF0dHJpYnV0ZUNoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9XG4gIH0pKTtcbiAgLyogRGVjaWRlIGlmIEFSSUEgYXR0cmlidXRlcyBhcmUgb2theSAqL1xuICBsZXQgQUxMT1dfQVJJQV9BVFRSID0gdHJ1ZTtcbiAgLyogRGVjaWRlIGlmIGN1c3RvbSBkYXRhIGF0dHJpYnV0ZXMgYXJlIG9rYXkgKi9cbiAgbGV0IEFMTE9XX0RBVEFfQVRUUiA9IHRydWU7XG4gIC8qIERlY2lkZSBpZiB1bmtub3duIHByb3RvY29scyBhcmUgb2theSAqL1xuICBsZXQgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIHNlbGYtY2xvc2luZyB0YWdzIGluIGF0dHJpYnV0ZXMgYXJlIGFsbG93ZWQuXG4gICAqIFVzdWFsbHkgcmVtb3ZlZCBkdWUgdG8gYSBtWFNTIGlzc3VlIGluIGpRdWVyeSAzLjAgKi9cbiAgbGV0IEFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiA9IHRydWU7XG4gIC8qIE91dHB1dCBzaG91bGQgYmUgc2FmZSBmb3IgY29tbW9uIHRlbXBsYXRlIGVuZ2luZXMuXG4gICAqIFRoaXMgbWVhbnMsIERPTVB1cmlmeSByZW1vdmVzIGRhdGEgYXR0cmlidXRlcywgbXVzdGFjaGVzIGFuZCBFUkJcbiAgICovXG4gIGxldCBTQUZFX0ZPUl9URU1QTEFURVMgPSBmYWxzZTtcbiAgLyogT3V0cHV0IHNob3VsZCBiZSBzYWZlIGV2ZW4gZm9yIFhNTCB1c2VkIHdpdGhpbiBIVE1MIGFuZCBhbGlrZS5cbiAgICogVGhpcyBtZWFucywgRE9NUHVyaWZ5IHJlbW92ZXMgY29tbWVudHMgd2hlbiBjb250YWluaW5nIHJpc2t5IGNvbnRlbnQuXG4gICAqL1xuICBsZXQgU0FGRV9GT1JfWE1MID0gdHJ1ZTtcbiAgLyogRGVjaWRlIGlmIGRvY3VtZW50IHdpdGggPGh0bWw+Li4uIHNob3VsZCBiZSByZXR1cm5lZCAqL1xuICBsZXQgV0hPTEVfRE9DVU1FTlQgPSBmYWxzZTtcbiAgLyogVHJhY2sgd2hldGhlciBjb25maWcgaXMgYWxyZWFkeSBzZXQgb24gdGhpcyBpbnN0YW5jZSBvZiBET01QdXJpZnkuICovXG4gIGxldCBTRVRfQ09ORklHID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBhbGwgZWxlbWVudHMgKGUuZy4gc3R5bGUsIHNjcmlwdCkgbXVzdCBiZSBjaGlsZHJlbiBvZlxuICAgKiBkb2N1bWVudC5ib2R5LiBCeSBkZWZhdWx0LCBicm93c2VycyBtaWdodCBtb3ZlIHRoZW0gdG8gZG9jdW1lbnQuaGVhZCAqL1xuICBsZXQgRk9SQ0VfQk9EWSA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgYSBET00gYEhUTUxCb2R5RWxlbWVudGAgc2hvdWxkIGJlIHJldHVybmVkLCBpbnN0ZWFkIG9mIGEgaHRtbFxuICAgKiBzdHJpbmcgKG9yIGEgVHJ1c3RlZEhUTUwgb2JqZWN0IGlmIFRydXN0ZWQgVHlwZXMgYXJlIHN1cHBvcnRlZCkuXG4gICAqIElmIGBXSE9MRV9ET0NVTUVOVGAgaXMgZW5hYmxlZCBhIGBIVE1MSHRtbEVsZW1lbnRgIHdpbGwgYmUgcmV0dXJuZWQgaW5zdGVhZFxuICAgKi9cbiAgbGV0IFJFVFVSTl9ET00gPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIGEgRE9NIGBEb2N1bWVudEZyYWdtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAqIHN0cmluZyAgKG9yIGEgVHJ1c3RlZEhUTUwgb2JqZWN0IGlmIFRydXN0ZWQgVHlwZXMgYXJlIHN1cHBvcnRlZCkgKi9cbiAgbGV0IFJFVFVSTl9ET01fRlJBR01FTlQgPSBmYWxzZTtcbiAgLyogVHJ5IHRvIHJldHVybiBhIFRydXN0ZWQgVHlwZSBvYmplY3QgaW5zdGVhZCBvZiBhIHN0cmluZywgcmV0dXJuIGEgc3RyaW5nIGluXG4gICAqIGNhc2UgVHJ1c3RlZCBUeXBlcyBhcmUgbm90IHN1cHBvcnRlZCAgKi9cbiAgbGV0IFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBmYWxzZTtcbiAgLyogT3V0cHV0IHNob3VsZCBiZSBmcmVlIGZyb20gRE9NIGNsb2JiZXJpbmcgYXR0YWNrcz9cbiAgICogVGhpcyBzYW5pdGl6ZXMgbWFya3VwcyBuYW1lZCB3aXRoIGNvbGxpZGluZywgY2xvYmJlcmFibGUgYnVpbHQtaW4gRE9NIEFQSXMuXG4gICAqL1xuICBsZXQgU0FOSVRJWkVfRE9NID0gdHJ1ZTtcbiAgLyogQWNoaWV2ZSBmdWxsIERPTSBDbG9iYmVyaW5nIHByb3RlY3Rpb24gYnkgaXNvbGF0aW5nIHRoZSBuYW1lc3BhY2Ugb2YgbmFtZWRcbiAgICogcHJvcGVydGllcyBhbmQgSlMgdmFyaWFibGVzLCBtaXRpZ2F0aW5nIGF0dGFja3MgdGhhdCBhYnVzZSB0aGUgSFRNTC9ET00gc3BlYyBydWxlcy5cbiAgICpcbiAgICogSFRNTC9ET00gc3BlYyBydWxlcyB0aGF0IGVuYWJsZSBET00gQ2xvYmJlcmluZzpcbiAgICogICAtIE5hbWVkIEFjY2VzcyBvbiBXaW5kb3cgKMKnNy4zLjMpXG4gICAqICAgLSBET00gVHJlZSBBY2Nlc3NvcnMgKMKnMy4xLjUpXG4gICAqICAgLSBGb3JtIEVsZW1lbnQgUGFyZW50LUNoaWxkIFJlbGF0aW9ucyAowqc0LjEwLjMpXG4gICAqICAgLSBJZnJhbWUgc3JjZG9jIC8gTmVzdGVkIFdpbmRvd1Byb3hpZXMgKMKnNC44LjUpXG4gICAqICAgLSBIVE1MQ29sbGVjdGlvbiAowqc0LjIuMTAuMilcbiAgICpcbiAgICogTmFtZXNwYWNlIGlzb2xhdGlvbiBpcyBpbXBsZW1lbnRlZCBieSBwcmVmaXhpbmcgYGlkYCBhbmQgYG5hbWVgIGF0dHJpYnV0ZXNcbiAgICogd2l0aCBhIGNvbnN0YW50IHN0cmluZywgaS5lLiwgYHVzZXItY29udGVudC1gXG4gICAqL1xuICBsZXQgU0FOSVRJWkVfTkFNRURfUFJPUFMgPSBmYWxzZTtcbiAgY29uc3QgU0FOSVRJWkVfTkFNRURfUFJPUFNfUFJFRklYID0gJ3VzZXItY29udGVudC0nO1xuICAvKiBLZWVwIGVsZW1lbnQgY29udGVudCB3aGVuIHJlbW92aW5nIGVsZW1lbnQ/ICovXG4gIGxldCBLRUVQX0NPTlRFTlQgPSB0cnVlO1xuICAvKiBJZiBhIGBOb2RlYCBpcyBwYXNzZWQgdG8gc2FuaXRpemUoKSwgdGhlbiBwZXJmb3JtcyBzYW5pdGl6YXRpb24gaW4tcGxhY2UgaW5zdGVhZFxuICAgKiBvZiBpbXBvcnRpbmcgaXQgaW50byBhIG5ldyBEb2N1bWVudCBhbmQgcmV0dXJuaW5nIGEgc2FuaXRpemVkIGNvcHkgKi9cbiAgbGV0IElOX1BMQUNFID0gZmFsc2U7XG4gIC8qIEFsbG93IHVzYWdlIG9mIHByb2ZpbGVzIGxpa2UgaHRtbCwgc3ZnIGFuZCBtYXRoTWwgKi9cbiAgbGV0IFVTRV9QUk9GSUxFUyA9IHt9O1xuICAvKiBUYWdzIHRvIGlnbm9yZSBjb250ZW50IG9mIHdoZW4gS0VFUF9DT05URU5UIGlzIHRydWUgKi9cbiAgbGV0IEZPUkJJRF9DT05URU5UUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTID0gYWRkVG9TZXQoe30sIFsnYW5ub3RhdGlvbi14bWwnLCAnYXVkaW8nLCAnY29sZ3JvdXAnLCAnZGVzYycsICdmb3JlaWdub2JqZWN0JywgJ2hlYWQnLCAnaWZyYW1lJywgJ21hdGgnLCAnbWknLCAnbW4nLCAnbW8nLCAnbXMnLCAnbXRleHQnLCAnbm9lbWJlZCcsICdub2ZyYW1lcycsICdub3NjcmlwdCcsICdwbGFpbnRleHQnLCAnc2NyaXB0JywgJ3N0eWxlJywgJ3N2ZycsICd0ZW1wbGF0ZScsICd0aGVhZCcsICd0aXRsZScsICd2aWRlbycsICd4bXAnXSk7XG4gIC8qIFRhZ3MgdGhhdCBhcmUgc2FmZSBmb3IgZGF0YTogVVJJcyAqL1xuICBsZXQgREFUQV9VUklfVEFHUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfREFUQV9VUklfVEFHUyA9IGFkZFRvU2V0KHt9LCBbJ2F1ZGlvJywgJ3ZpZGVvJywgJ2ltZycsICdzb3VyY2UnLCAnaW1hZ2UnLCAndHJhY2snXSk7XG4gIC8qIEF0dHJpYnV0ZXMgc2FmZSBmb3IgdmFsdWVzIGxpa2UgXCJqYXZhc2NyaXB0OlwiICovXG4gIGxldCBVUklfU0FGRV9BVFRSSUJVVEVTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTID0gYWRkVG9TZXQoe30sIFsnYWx0JywgJ2NsYXNzJywgJ2ZvcicsICdpZCcsICdsYWJlbCcsICduYW1lJywgJ3BhdHRlcm4nLCAncGxhY2Vob2xkZXInLCAncm9sZScsICdzdW1tYXJ5JywgJ3RpdGxlJywgJ3ZhbHVlJywgJ3N0eWxlJywgJ3htbG5zJ10pO1xuICBjb25zdCBNQVRITUxfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUwnO1xuICBjb25zdCBTVkdfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgY29uc3QgSFRNTF9OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCc7XG4gIC8qIERvY3VtZW50IG5hbWVzcGFjZSAqL1xuICBsZXQgTkFNRVNQQUNFID0gSFRNTF9OQU1FU1BBQ0U7XG4gIGxldCBJU19FTVBUWV9JTlBVVCA9IGZhbHNlO1xuICAvKiBBbGxvd2VkIFhIVE1MK1hNTCBuYW1lc3BhY2VzICovXG4gIGxldCBBTExPV0VEX05BTUVTUEFDRVMgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0FMTE9XRURfTkFNRVNQQUNFUyA9IGFkZFRvU2V0KHt9LCBbTUFUSE1MX05BTUVTUEFDRSwgU1ZHX05BTUVTUEFDRSwgSFRNTF9OQU1FU1BBQ0VdLCBzdHJpbmdUb1N0cmluZyk7XG4gIGxldCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgPSBhZGRUb1NldCh7fSwgWydtaScsICdtbycsICdtbicsICdtcycsICdtdGV4dCddKTtcbiAgbGV0IEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnYW5ub3RhdGlvbi14bWwnXSk7XG4gIC8vIENlcnRhaW4gZWxlbWVudHMgYXJlIGFsbG93ZWQgaW4gYm90aCBTVkcgYW5kIEhUTUxcbiAgLy8gbmFtZXNwYWNlLiBXZSBuZWVkIHRvIHNwZWNpZnkgdGhlbSBleHBsaWNpdGx5XG4gIC8vIHNvIHRoYXQgdGhleSBkb24ndCBnZXQgZXJyb25lb3VzbHkgZGVsZXRlZCBmcm9tXG4gIC8vIEhUTUwgbmFtZXNwYWNlLlxuICBjb25zdCBDT01NT05fU1ZHX0FORF9IVE1MX0VMRU1FTlRTID0gYWRkVG9TZXQoe30sIFsndGl0bGUnLCAnc3R5bGUnLCAnZm9udCcsICdhJywgJ3NjcmlwdCddKTtcbiAgLyogUGFyc2luZyBvZiBzdHJpY3QgWEhUTUwgZG9jdW1lbnRzICovXG4gIGxldCBQQVJTRVJfTUVESUFfVFlQRSA9IG51bGw7XG4gIGNvbnN0IFNVUFBPUlRFRF9QQVJTRVJfTUVESUFfVFlQRVMgPSBbJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcsICd0ZXh0L2h0bWwnXTtcbiAgY29uc3QgREVGQVVMVF9QQVJTRVJfTUVESUFfVFlQRSA9ICd0ZXh0L2h0bWwnO1xuICBsZXQgdHJhbnNmb3JtQ2FzZUZ1bmMgPSBudWxsO1xuICAvKiBLZWVwIGEgcmVmZXJlbmNlIHRvIGNvbmZpZyB0byBwYXNzIHRvIGhvb2tzICovXG4gIGxldCBDT05GSUcgPSBudWxsO1xuICAvKiBJZGVhbGx5LCBkbyBub3QgdG91Y2ggYW55dGhpbmcgYmVsb3cgdGhpcyBsaW5lICovXG4gIC8qIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gKi9cbiAgY29uc3QgZm9ybUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gIGNvbnN0IGlzUmVnZXhPckZ1bmN0aW9uID0gZnVuY3Rpb24gaXNSZWdleE9yRnVuY3Rpb24odGVzdFZhbHVlKSB7XG4gICAgcmV0dXJuIHRlc3RWYWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCB8fCB0ZXN0VmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbjtcbiAgfTtcbiAgLyoqXG4gICAqIF9wYXJzZUNvbmZpZ1xuICAgKlxuICAgKiBAcGFyYW0gY2ZnIG9wdGlvbmFsIGNvbmZpZyBsaXRlcmFsXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICBjb25zdCBfcGFyc2VDb25maWcgPSBmdW5jdGlvbiBfcGFyc2VDb25maWcoKSB7XG4gICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgaWYgKENPTkZJRyAmJiBDT05GSUcgPT09IGNmZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvKiBTaGllbGQgY29uZmlndXJhdGlvbiBvYmplY3QgZnJvbSB0YW1wZXJpbmcgKi9cbiAgICBpZiAoIWNmZyB8fCB0eXBlb2YgY2ZnICE9PSAnb2JqZWN0Jykge1xuICAgICAgY2ZnID0ge307XG4gICAgfVxuICAgIC8qIFNoaWVsZCBjb25maWd1cmF0aW9uIG9iamVjdCBmcm9tIHByb3RvdHlwZSBwb2xsdXRpb24gKi9cbiAgICBjZmcgPSBjbG9uZShjZmcpO1xuICAgIFBBUlNFUl9NRURJQV9UWVBFID1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItaW5jbHVkZXNcbiAgICBTVVBQT1JURURfUEFSU0VSX01FRElBX1RZUEVTLmluZGV4T2YoY2ZnLlBBUlNFUl9NRURJQV9UWVBFKSA9PT0gLTEgPyBERUZBVUxUX1BBUlNFUl9NRURJQV9UWVBFIDogY2ZnLlBBUlNFUl9NRURJQV9UWVBFO1xuICAgIC8vIEhUTUwgdGFncyBhbmQgYXR0cmlidXRlcyBhcmUgbm90IGNhc2Utc2Vuc2l0aXZlLCBjb252ZXJ0aW5nIHRvIGxvd2VyY2FzZS4gS2VlcGluZyBYSFRNTCBhcyBpcy5cbiAgICB0cmFuc2Zvcm1DYXNlRnVuYyA9IFBBUlNFUl9NRURJQV9UWVBFID09PSAnYXBwbGljYXRpb24veGh0bWwreG1sJyA/IHN0cmluZ1RvU3RyaW5nIDogc3RyaW5nVG9Mb3dlckNhc2U7XG4gICAgLyogU2V0IGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAqL1xuICAgIEFMTE9XRURfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfVEFHUycpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfQUxMT1dFRF9UQUdTO1xuICAgIEFMTE9XRURfQVRUUiA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfQVRUUicpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfQUxMT1dFRF9BVFRSO1xuICAgIEFMTE9XRURfTkFNRVNQQUNFUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfTkFNRVNQQUNFUycpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX05BTUVTUEFDRVMsIHN0cmluZ1RvU3RyaW5nKSA6IERFRkFVTFRfQUxMT1dFRF9OQU1FU1BBQ0VTO1xuICAgIFVSSV9TQUZFX0FUVFJJQlVURVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBRERfVVJJX1NBRkVfQVRUUicpID8gYWRkVG9TZXQoY2xvbmUoREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTKSwgY2ZnLkFERF9VUklfU0FGRV9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVM7XG4gICAgREFUQV9VUklfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FERF9EQVRBX1VSSV9UQUdTJykgPyBhZGRUb1NldChjbG9uZShERUZBVUxUX0RBVEFfVVJJX1RBR1MpLCBjZmcuQUREX0RBVEFfVVJJX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfREFUQV9VUklfVEFHUztcbiAgICBGT1JCSURfQ09OVEVOVFMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdGT1JCSURfQ09OVEVOVFMnKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0ZPUkJJRF9DT05URU5UUztcbiAgICBGT1JCSURfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9UQUdTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBjbG9uZSh7fSk7XG4gICAgRk9SQklEX0FUVFIgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdGT1JCSURfQVRUUicpID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogY2xvbmUoe30pO1xuICAgIFVTRV9QUk9GSUxFUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ1VTRV9QUk9GSUxFUycpID8gY2ZnLlVTRV9QUk9GSUxFUyA6IGZhbHNlO1xuICAgIEFMTE9XX0FSSUFfQVRUUiA9IGNmZy5BTExPV19BUklBX0FUVFIgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBBTExPV19EQVRBX0FUVFIgPSBjZmcuQUxMT1dfREFUQV9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBjZmcuQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBBTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgPSBjZmcuQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgU0FGRV9GT1JfVEVNUExBVEVTID0gY2ZnLlNBRkVfRk9SX1RFTVBMQVRFUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFNBRkVfRk9SX1hNTCA9IGNmZy5TQUZFX0ZPUl9YTUwgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBXSE9MRV9ET0NVTUVOVCA9IGNmZy5XSE9MRV9ET0NVTUVOVCB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFJFVFVSTl9ET00gPSBjZmcuUkVUVVJOX0RPTSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFJFVFVSTl9ET01fRlJBR01FTlQgPSBjZmcuUkVUVVJOX0RPTV9GUkFHTUVOVCB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBjZmcuUkVUVVJOX1RSVVNURURfVFlQRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIEZPUkNFX0JPRFkgPSBjZmcuRk9SQ0VfQk9EWSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFNBTklUSVpFX0RPTSA9IGNmZy5TQU5JVElaRV9ET00gIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBTQU5JVElaRV9OQU1FRF9QUk9QUyA9IGNmZy5TQU5JVElaRV9OQU1FRF9QUk9QUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIEtFRVBfQ09OVEVOVCA9IGNmZy5LRUVQX0NPTlRFTlQgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBJTl9QTEFDRSA9IGNmZy5JTl9QTEFDRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIElTX0FMTE9XRURfVVJJJDEgPSBjZmcuQUxMT1dFRF9VUklfUkVHRVhQIHx8IElTX0FMTE9XRURfVVJJO1xuICAgIE5BTUVTUEFDRSA9IGNmZy5OQU1FU1BBQ0UgfHwgSFRNTF9OQU1FU1BBQ0U7XG4gICAgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTID0gY2ZnLk1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyB8fCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFM7XG4gICAgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFMgPSBjZmcuSFRNTF9JTlRFR1JBVElPTl9QT0lOVFMgfHwgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFM7XG4gICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgfHwge307XG4gICAgaWYgKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyAmJiBpc1JlZ2V4T3JGdW5jdGlvbihjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKSkge1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaztcbiAgICB9XG4gICAgaWYgKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyAmJiBpc1JlZ2V4T3JGdW5jdGlvbihjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrKSkge1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjaztcbiAgICB9XG4gICAgaWYgKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyAmJiB0eXBlb2YgY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzO1xuICAgIH1cbiAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICBBTExPV19EQVRBX0FUVFIgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgIFJFVFVSTl9ET00gPSB0cnVlO1xuICAgIH1cbiAgICAvKiBQYXJzZSBwcm9maWxlIGluZm8gKi9cbiAgICBpZiAoVVNFX1BST0ZJTEVTKSB7XG4gICAgICBBTExPV0VEX1RBR1MgPSBhZGRUb1NldCh7fSwgdGV4dCk7XG4gICAgICBBTExPV0VEX0FUVFIgPSBbXTtcbiAgICAgIGlmIChVU0VfUFJPRklMRVMuaHRtbCA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGh0bWwkMSk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgaHRtbCk7XG4gICAgICB9XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2ZyA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIHN2ZyQxKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBzdmcpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICB9XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2Z0ZpbHRlcnMgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBzdmdGaWx0ZXJzKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBzdmcpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICB9XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLm1hdGhNbCA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIG1hdGhNbCQxKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBtYXRoTWwpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIE1lcmdlIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAqL1xuICAgIGlmIChjZmcuQUREX1RBR1MpIHtcbiAgICAgIGlmICh0eXBlb2YgY2ZnLkFERF9UQUdTID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIEVYVFJBX0VMRU1FTlRfSEFORExJTkcudGFnQ2hlY2sgPSBjZmcuQUREX1RBR1M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoQUxMT1dFRF9UQUdTID09PSBERUZBVUxUX0FMTE9XRURfVEFHUykge1xuICAgICAgICAgIEFMTE9XRURfVEFHUyA9IGNsb25lKEFMTE9XRURfVEFHUyk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBjZmcuQUREX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNmZy5BRERfQVRUUikge1xuICAgICAgaWYgKHR5cGVvZiBjZmcuQUREX0FUVFIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgRVhUUkFfRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVDaGVjayA9IGNmZy5BRERfQVRUUjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChBTExPV0VEX0FUVFIgPT09IERFRkFVTFRfQUxMT1dFRF9BVFRSKSB7XG4gICAgICAgICAgQUxMT1dFRF9BVFRSID0gY2xvbmUoQUxMT1dFRF9BVFRSKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIGNmZy5BRERfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2ZnLkFERF9VUklfU0FGRV9BVFRSKSB7XG4gICAgICBhZGRUb1NldChVUklfU0FGRV9BVFRSSUJVVEVTLCBjZmcuQUREX1VSSV9TQUZFX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNmZy5GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgIGlmIChGT1JCSURfQ09OVEVOVFMgPT09IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICAgIEZPUkJJRF9DT05URU5UUyA9IGNsb25lKEZPUkJJRF9DT05URU5UUyk7XG4gICAgICB9XG4gICAgICBhZGRUb1NldChGT1JCSURfQ09OVEVOVFMsIGNmZy5GT1JCSURfQ09OVEVOVFMsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNmZy5BRERfRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICBpZiAoRk9SQklEX0NPTlRFTlRTID09PSBERUZBVUxUX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgICBGT1JCSURfQ09OVEVOVFMgPSBjbG9uZShGT1JCSURfQ09OVEVOVFMpO1xuICAgICAgfVxuICAgICAgYWRkVG9TZXQoRk9SQklEX0NPTlRFTlRTLCBjZmcuQUREX0ZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgIH1cbiAgICAvKiBBZGQgI3RleHQgaW4gY2FzZSBLRUVQX0NPTlRFTlQgaXMgc2V0IHRvIHRydWUgKi9cbiAgICBpZiAoS0VFUF9DT05URU5UKSB7XG4gICAgICBBTExPV0VEX1RBR1NbJyN0ZXh0J10gPSB0cnVlO1xuICAgIH1cbiAgICAvKiBBZGQgaHRtbCwgaGVhZCBhbmQgYm9keSB0byBBTExPV0VEX1RBR1MgaW4gY2FzZSBXSE9MRV9ET0NVTUVOVCBpcyB0cnVlICovXG4gICAgaWYgKFdIT0xFX0RPQ1VNRU5UKSB7XG4gICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIFsnaHRtbCcsICdoZWFkJywgJ2JvZHknXSk7XG4gICAgfVxuICAgIC8qIEFkZCB0Ym9keSB0byBBTExPV0VEX1RBR1MgaW4gY2FzZSB0YWJsZXMgYXJlIHBlcm1pdHRlZCwgc2VlICMyODYsICMzNjUgKi9cbiAgICBpZiAoQUxMT1dFRF9UQUdTLnRhYmxlKSB7XG4gICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIFsndGJvZHknXSk7XG4gICAgICBkZWxldGUgRk9SQklEX1RBR1MudGJvZHk7XG4gICAgfVxuICAgIGlmIChjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1kpIHtcbiAgICAgIGlmICh0eXBlb2YgY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZLmNyZWF0ZUhUTUwgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdUUlVTVEVEX1RZUEVTX1BPTElDWSBjb25maWd1cmF0aW9uIG9wdGlvbiBtdXN0IHByb3ZpZGUgYSBcImNyZWF0ZUhUTUxcIiBob29rLicpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1kuY3JlYXRlU2NyaXB0VVJMICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnVFJVU1RFRF9UWVBFU19QT0xJQ1kgY29uZmlndXJhdGlvbiBvcHRpb24gbXVzdCBwcm92aWRlIGEgXCJjcmVhdGVTY3JpcHRVUkxcIiBob29rLicpO1xuICAgICAgfVxuICAgICAgLy8gT3ZlcndyaXRlIGV4aXN0aW5nIFRydXN0ZWRUeXBlcyBwb2xpY3kuXG4gICAgICB0cnVzdGVkVHlwZXNQb2xpY3kgPSBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1k7XG4gICAgICAvLyBTaWduIGxvY2FsIHZhcmlhYmxlcyByZXF1aXJlZCBieSBgc2FuaXRpemVgLlxuICAgICAgZW1wdHlIVE1MID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVbmluaXRpYWxpemVkIHBvbGljeSwgYXR0ZW1wdCB0byBpbml0aWFsaXplIHRoZSBpbnRlcm5hbCBkb21wdXJpZnkgcG9saWN5LlxuICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRydXN0ZWRUeXBlc1BvbGljeSA9IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBjdXJyZW50U2NyaXB0KTtcbiAgICAgIH1cbiAgICAgIC8vIElmIGNyZWF0aW5nIHRoZSBpbnRlcm5hbCBwb2xpY3kgc3VjY2VlZGVkIHNpZ24gaW50ZXJuYWwgdmFyaWFibGVzLlxuICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSAhPT0gbnVsbCAmJiB0eXBlb2YgZW1wdHlIVE1MID09PSAnc3RyaW5nJykge1xuICAgICAgICBlbXB0eUhUTUwgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCgnJyk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFByZXZlbnQgZnVydGhlciBtYW5pcHVsYXRpb24gb2YgY29uZmlndXJhdGlvbi5cbiAgICAvLyBOb3QgYXZhaWxhYmxlIGluIElFOCwgU2FmYXJpIDUsIGV0Yy5cbiAgICBpZiAoZnJlZXplKSB7XG4gICAgICBmcmVlemUoY2ZnKTtcbiAgICB9XG4gICAgQ09ORklHID0gY2ZnO1xuICB9O1xuICAvKiBLZWVwIHRyYWNrIG9mIGFsbCBwb3NzaWJsZSBTVkcgYW5kIE1hdGhNTCB0YWdzXG4gICAqIHNvIHRoYXQgd2UgY2FuIHBlcmZvcm0gdGhlIG5hbWVzcGFjZSBjaGVja3NcbiAgICogY29ycmVjdGx5LiAqL1xuICBjb25zdCBBTExfU1ZHX1RBR1MgPSBhZGRUb1NldCh7fSwgWy4uLnN2ZyQxLCAuLi5zdmdGaWx0ZXJzLCAuLi5zdmdEaXNhbGxvd2VkXSk7XG4gIGNvbnN0IEFMTF9NQVRITUxfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4ubWF0aE1sJDEsIC4uLm1hdGhNbERpc2FsbG93ZWRdKTtcbiAgLyoqXG4gICAqIEBwYXJhbSBlbGVtZW50IGEgRE9NIGVsZW1lbnQgd2hvc2UgbmFtZXNwYWNlIGlzIGJlaW5nIGNoZWNrZWRcbiAgICogQHJldHVybnMgUmV0dXJuIGZhbHNlIGlmIHRoZSBlbGVtZW50IGhhcyBhXG4gICAqICBuYW1lc3BhY2UgdGhhdCBhIHNwZWMtY29tcGxpYW50IHBhcnNlciB3b3VsZCBuZXZlclxuICAgKiAgcmV0dXJuLiBSZXR1cm4gdHJ1ZSBvdGhlcndpc2UuXG4gICAqL1xuICBjb25zdCBfY2hlY2tWYWxpZE5hbWVzcGFjZSA9IGZ1bmN0aW9uIF9jaGVja1ZhbGlkTmFtZXNwYWNlKGVsZW1lbnQpIHtcbiAgICBsZXQgcGFyZW50ID0gZ2V0UGFyZW50Tm9kZShlbGVtZW50KTtcbiAgICAvLyBJbiBKU0RPTSwgaWYgd2UncmUgaW5zaWRlIHNoYWRvdyBET00sIHRoZW4gcGFyZW50Tm9kZVxuICAgIC8vIGNhbiBiZSBudWxsLiBXZSBqdXN0IHNpbXVsYXRlIHBhcmVudCBpbiB0aGlzIGNhc2UuXG4gICAgaWYgKCFwYXJlbnQgfHwgIXBhcmVudC50YWdOYW1lKSB7XG4gICAgICBwYXJlbnQgPSB7XG4gICAgICAgIG5hbWVzcGFjZVVSSTogTkFNRVNQQUNFLFxuICAgICAgICB0YWdOYW1lOiAndGVtcGxhdGUnXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCB0YWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UoZWxlbWVudC50YWdOYW1lKTtcbiAgICBjb25zdCBwYXJlbnRUYWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UocGFyZW50LnRhZ05hbWUpO1xuICAgIGlmICghQUxMT1dFRF9OQU1FU1BBQ0VTW2VsZW1lbnQubmFtZXNwYWNlVVJJXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBIVE1MIG5hbWVzcGFjZSB0byBTVkdcbiAgICAgIC8vIGlzIHZpYSA8c3ZnPi4gSWYgaXQgaGFwcGVucyB2aWEgYW55IG90aGVyIHRhZywgdGhlblxuICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ3N2Zyc7XG4gICAgICB9XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gTWF0aE1MIHRvIFNWRyBpcyB2aWFgXG4gICAgICAvLyBzdmcgaWYgcGFyZW50IGlzIGVpdGhlciA8YW5ub3RhdGlvbi14bWw+IG9yIE1hdGhNTFxuICAgICAgLy8gdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHMuXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ3N2ZycgJiYgKHBhcmVudFRhZ05hbWUgPT09ICdhbm5vdGF0aW9uLXhtbCcgfHwgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIG9ubHkgYWxsb3cgZWxlbWVudHMgdGhhdCBhcmUgZGVmaW5lZCBpbiBTVkdcbiAgICAgIC8vIHNwZWMuIEFsbCBvdGhlcnMgYXJlIGRpc2FsbG93ZWQgaW4gU1ZHIG5hbWVzcGFjZS5cbiAgICAgIHJldHVybiBCb29sZWFuKEFMTF9TVkdfVEFHU1t0YWdOYW1lXSk7XG4gICAgfVxuICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIEhUTUwgbmFtZXNwYWNlIHRvIE1hdGhNTFxuICAgICAgLy8gaXMgdmlhIDxtYXRoPi4gSWYgaXQgaGFwcGVucyB2aWEgYW55IG90aGVyIHRhZywgdGhlblxuICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ21hdGgnO1xuICAgICAgfVxuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIFNWRyB0byBNYXRoTUwgaXMgdmlhXG4gICAgICAvLyA8bWF0aD4gYW5kIEhUTUwgaW50ZWdyYXRpb24gcG9pbnRzXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ21hdGgnICYmIEhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdO1xuICAgICAgfVxuICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIE1hdGhNTFxuICAgICAgLy8gc3BlYy4gQWxsIG90aGVycyBhcmUgZGlzYWxsb3dlZCBpbiBNYXRoTUwgbmFtZXNwYWNlLlxuICAgICAgcmV0dXJuIEJvb2xlYW4oQUxMX01BVEhNTF9UQUdTW3RhZ05hbWVdKTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQubmFtZXNwYWNlVVJJID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIFNWRyB0byBIVE1MIGlzIHZpYVxuICAgICAgLy8gSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHMsIGFuZCBmcm9tIE1hdGhNTCB0byBIVE1MXG4gICAgICAvLyBpcyB2aWEgTWF0aE1MIHRleHQgaW50ZWdyYXRpb24gcG9pbnRzXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSAmJiAhSFRNTF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UgJiYgIU1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBXZSBkaXNhbGxvdyB0YWdzIHRoYXQgYXJlIHNwZWNpZmljIGZvciBNYXRoTUxcbiAgICAgIC8vIG9yIFNWRyBhbmQgc2hvdWxkIG5ldmVyIGFwcGVhciBpbiBIVE1MIG5hbWVzcGFjZVxuICAgICAgcmV0dXJuICFBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0gJiYgKENPTU1PTl9TVkdfQU5EX0hUTUxfRUxFTUVOVFNbdGFnTmFtZV0gfHwgIUFMTF9TVkdfVEFHU1t0YWdOYW1lXSk7XG4gICAgfVxuICAgIC8vIEZvciBYSFRNTCBhbmQgWE1MIGRvY3VtZW50cyB0aGF0IHN1cHBvcnQgY3VzdG9tIG5hbWVzcGFjZXNcbiAgICBpZiAoUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnICYmIEFMTE9XRURfTkFNRVNQQUNFU1tlbGVtZW50Lm5hbWVzcGFjZVVSSV0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBUaGUgY29kZSBzaG91bGQgbmV2ZXIgcmVhY2ggdGhpcyBwbGFjZSAodGhpcyBtZWFuc1xuICAgIC8vIHRoYXQgdGhlIGVsZW1lbnQgc29tZWhvdyBnb3QgbmFtZXNwYWNlIHRoYXQgaXMgbm90XG4gICAgLy8gSFRNTCwgU1ZHLCBNYXRoTUwgb3IgYWxsb3dlZCB2aWEgQUxMT1dFRF9OQU1FU1BBQ0VTKS5cbiAgICAvLyBSZXR1cm4gZmFsc2UganVzdCBpbiBjYXNlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIF9mb3JjZVJlbW92ZVxuICAgKlxuICAgKiBAcGFyYW0gbm9kZSBhIERPTSBub2RlXG4gICAqL1xuICBjb25zdCBfZm9yY2VSZW1vdmUgPSBmdW5jdGlvbiBfZm9yY2VSZW1vdmUobm9kZSkge1xuICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgZWxlbWVudDogbm9kZVxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtcmVtb3ZlXG4gICAgICBnZXRQYXJlbnROb2RlKG5vZGUpLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIHJlbW92ZShub2RlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBfcmVtb3ZlQXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIGFuIEF0dHJpYnV0ZSBuYW1lXG4gICAqIEBwYXJhbSBlbGVtZW50IGEgRE9NIG5vZGVcbiAgICovXG4gIGNvbnN0IF9yZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbiBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGVsZW1lbnQpIHtcbiAgICB0cnkge1xuICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogZWxlbWVudC5nZXRBdHRyaWJ1dGVOb2RlKG5hbWUpLFxuICAgICAgICBmcm9tOiBlbGVtZW50XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgYXR0cmlidXRlOiBudWxsLFxuICAgICAgICBmcm9tOiBlbGVtZW50XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgLy8gV2Ugdm9pZCBhdHRyaWJ1dGUgdmFsdWVzIGZvciB1bnJlbW92YWJsZSBcImlzXCIgYXR0cmlidXRlc1xuICAgIGlmIChuYW1lID09PSAnaXMnKSB7XG4gICAgICBpZiAoUkVUVVJOX0RPTSB8fCBSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgX2ZvcmNlUmVtb3ZlKGVsZW1lbnQpO1xuICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCAnJyk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogX2luaXREb2N1bWVudFxuICAgKlxuICAgKiBAcGFyYW0gZGlydHkgLSBhIHN0cmluZyBvZiBkaXJ0eSBtYXJrdXBcbiAgICogQHJldHVybiBhIERPTSwgZmlsbGVkIHdpdGggdGhlIGRpcnR5IG1hcmt1cFxuICAgKi9cbiAgY29uc3QgX2luaXREb2N1bWVudCA9IGZ1bmN0aW9uIF9pbml0RG9jdW1lbnQoZGlydHkpIHtcbiAgICAvKiBDcmVhdGUgYSBIVE1MIGRvY3VtZW50ICovXG4gICAgbGV0IGRvYyA9IG51bGw7XG4gICAgbGV0IGxlYWRpbmdXaGl0ZXNwYWNlID0gbnVsbDtcbiAgICBpZiAoRk9SQ0VfQk9EWSkge1xuICAgICAgZGlydHkgPSAnPHJlbW92ZT48L3JlbW92ZT4nICsgZGlydHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIElmIEZPUkNFX0JPRFkgaXNuJ3QgdXNlZCwgbGVhZGluZyB3aGl0ZXNwYWNlIG5lZWRzIHRvIGJlIHByZXNlcnZlZCBtYW51YWxseSAqL1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHN0cmluZ01hdGNoKGRpcnR5LCAvXltcXHJcXG5cXHQgXSsvKTtcbiAgICAgIGxlYWRpbmdXaGl0ZXNwYWNlID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzBdO1xuICAgIH1cbiAgICBpZiAoUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnICYmIE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFJvb3Qgb2YgWEhUTUwgZG9jIG11c3QgY29udGFpbiB4bWxucyBkZWNsYXJhdGlvbiAoc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvbm9ybWF0aXZlLmh0bWwjc3RyaWN0KVxuICAgICAgZGlydHkgPSAnPGh0bWwgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI+PGhlYWQ+PC9oZWFkPjxib2R5PicgKyBkaXJ0eSArICc8L2JvZHk+PC9odG1sPic7XG4gICAgfVxuICAgIGNvbnN0IGRpcnR5UGF5bG9hZCA9IHRydXN0ZWRUeXBlc1BvbGljeSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKGRpcnR5KSA6IGRpcnR5O1xuICAgIC8qXG4gICAgICogVXNlIHRoZSBET01QYXJzZXIgQVBJIGJ5IGRlZmF1bHQsIGZhbGxiYWNrIGxhdGVyIGlmIG5lZWRzIGJlXG4gICAgICogRE9NUGFyc2VyIG5vdCB3b3JrIGZvciBzdmcgd2hlbiBoYXMgbXVsdGlwbGUgcm9vdCBlbGVtZW50LlxuICAgICAqL1xuICAgIGlmIChOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICB0cnkge1xuICAgICAgICBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGRpcnR5UGF5bG9hZCwgUEFSU0VSX01FRElBX1RZUEUpO1xuICAgICAgfSBjYXRjaCAoXykge31cbiAgICB9XG4gICAgLyogVXNlIGNyZWF0ZUhUTUxEb2N1bWVudCBpbiBjYXNlIERPTVBhcnNlciBpcyBub3QgYXZhaWxhYmxlICovXG4gICAgaWYgKCFkb2MgfHwgIWRvYy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgIGRvYyA9IGltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KE5BTUVTUEFDRSwgJ3RlbXBsYXRlJywgbnVsbCk7XG4gICAgICB0cnkge1xuICAgICAgICBkb2MuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTCA9IElTX0VNUFRZX0lOUFVUID8gZW1wdHlIVE1MIDogZGlydHlQYXlsb2FkO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvLyBTeW50YXggZXJyb3IgaWYgZGlydHlQYXlsb2FkIGlzIGludmFsaWQgeG1sXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGJvZHkgPSBkb2MuYm9keSB8fCBkb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgIGlmIChkaXJ0eSAmJiBsZWFkaW5nV2hpdGVzcGFjZSkge1xuICAgICAgYm9keS5pbnNlcnRCZWZvcmUoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobGVhZGluZ1doaXRlc3BhY2UpLCBib2R5LmNoaWxkTm9kZXNbMF0gfHwgbnVsbCk7XG4gICAgfVxuICAgIC8qIFdvcmsgb24gd2hvbGUgZG9jdW1lbnQgb3IganVzdCBpdHMgYm9keSAqL1xuICAgIGlmIChOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICByZXR1cm4gZ2V0RWxlbWVudHNCeVRhZ05hbWUuY2FsbChkb2MsIFdIT0xFX0RPQ1VNRU5UID8gJ2h0bWwnIDogJ2JvZHknKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIFdIT0xFX0RPQ1VNRU5UID8gZG9jLmRvY3VtZW50RWxlbWVudCA6IGJvZHk7XG4gIH07XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgTm9kZUl0ZXJhdG9yIG9iamVjdCB0aGF0IHlvdSBjYW4gdXNlIHRvIHRyYXZlcnNlIGZpbHRlcmVkIGxpc3RzIG9mIG5vZGVzIG9yIGVsZW1lbnRzIGluIGEgZG9jdW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSByb290IFRoZSByb290IGVsZW1lbnQgb3Igbm9kZSB0byBzdGFydCB0cmF2ZXJzaW5nIG9uLlxuICAgKiBAcmV0dXJuIFRoZSBjcmVhdGVkIE5vZGVJdGVyYXRvclxuICAgKi9cbiAgY29uc3QgX2NyZWF0ZU5vZGVJdGVyYXRvciA9IGZ1bmN0aW9uIF9jcmVhdGVOb2RlSXRlcmF0b3Iocm9vdCkge1xuICAgIHJldHVybiBjcmVhdGVOb2RlSXRlcmF0b3IuY2FsbChyb290Lm93bmVyRG9jdW1lbnQgfHwgcm9vdCwgcm9vdCxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZVxuICAgIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5UIHwgTm9kZUZpbHRlci5TSE9XX0NPTU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfVEVYVCB8IE5vZGVGaWx0ZXIuU0hPV19QUk9DRVNTSU5HX0lOU1RSVUNUSU9OIHwgTm9kZUZpbHRlci5TSE9XX0NEQVRBX1NFQ1RJT04sIG51bGwpO1xuICB9O1xuICAvKipcbiAgICogX2lzQ2xvYmJlcmVkXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgdG8gY2hlY2sgZm9yIGNsb2JiZXJpbmcgYXR0YWNrc1xuICAgKiBAcmV0dXJuIHRydWUgaWYgY2xvYmJlcmVkLCBmYWxzZSBpZiBzYWZlXG4gICAqL1xuICBjb25zdCBfaXNDbG9iYmVyZWQgPSBmdW5jdGlvbiBfaXNDbG9iYmVyZWQoZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50ICYmICh0eXBlb2YgZWxlbWVudC5ub2RlTmFtZSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQudGV4dENvbnRlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50LnJlbW92ZUNoaWxkICE9PSAnZnVuY3Rpb24nIHx8ICEoZWxlbWVudC5hdHRyaWJ1dGVzIGluc3RhbmNlb2YgTmFtZWROb2RlTWFwKSB8fCB0eXBlb2YgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQuc2V0QXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50Lm5hbWVzcGFjZVVSSSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQuaW5zZXJ0QmVmb3JlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50Lmhhc0NoaWxkTm9kZXMgIT09ICdmdW5jdGlvbicpO1xuICB9O1xuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIERPTSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgb2JqZWN0IHRvIGNoZWNrIHdoZXRoZXIgaXQncyBhIERPTSBub2RlXG4gICAqIEByZXR1cm4gdHJ1ZSBpcyBvYmplY3QgaXMgYSBET00gbm9kZVxuICAgKi9cbiAgY29uc3QgX2lzTm9kZSA9IGZ1bmN0aW9uIF9pc05vZGUodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIE5vZGUgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBOb2RlO1xuICB9O1xuICBmdW5jdGlvbiBfZXhlY3V0ZUhvb2tzKGhvb2tzLCBjdXJyZW50Tm9kZSwgZGF0YSkge1xuICAgIGFycmF5Rm9yRWFjaChob29rcywgaG9vayA9PiB7XG4gICAgICBob29rLmNhbGwoRE9NUHVyaWZ5LCBjdXJyZW50Tm9kZSwgZGF0YSwgQ09ORklHKTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogX3Nhbml0aXplRWxlbWVudHNcbiAgICpcbiAgICogQHByb3RlY3Qgbm9kZU5hbWVcbiAgICogQHByb3RlY3QgdGV4dENvbnRlbnRcbiAgICogQHByb3RlY3QgcmVtb3ZlQ2hpbGRcbiAgICogQHBhcmFtIGN1cnJlbnROb2RlIHRvIGNoZWNrIGZvciBwZXJtaXNzaW9uIHRvIGV4aXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiBub2RlIHdhcyBraWxsZWQsIGZhbHNlIGlmIGxlZnQgYWxpdmVcbiAgICovXG4gIGNvbnN0IF9zYW5pdGl6ZUVsZW1lbnRzID0gZnVuY3Rpb24gX3Nhbml0aXplRWxlbWVudHMoY3VycmVudE5vZGUpIHtcbiAgICBsZXQgY29udGVudCA9IG51bGw7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVFbGVtZW50cywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIC8qIENoZWNrIGlmIGVsZW1lbnQgaXMgY2xvYmJlcmVkIG9yIGNhbiBjbG9iYmVyICovXG4gICAgaWYgKF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogTm93IGxldCdzIGNoZWNrIHRoZSBlbGVtZW50J3MgdHlwZSBhbmQgbmFtZSAqL1xuICAgIGNvbnN0IHRhZ05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhjdXJyZW50Tm9kZS5ub2RlTmFtZSk7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MudXBvblNhbml0aXplRWxlbWVudCwgY3VycmVudE5vZGUsIHtcbiAgICAgIHRhZ05hbWUsXG4gICAgICBhbGxvd2VkVGFnczogQUxMT1dFRF9UQUdTXG4gICAgfSk7XG4gICAgLyogRGV0ZWN0IG1YU1MgYXR0ZW1wdHMgYWJ1c2luZyBuYW1lc3BhY2UgY29uZnVzaW9uICovXG4gICAgaWYgKFNBRkVfRk9SX1hNTCAmJiBjdXJyZW50Tm9kZS5oYXNDaGlsZE5vZGVzKCkgJiYgIV9pc05vZGUoY3VycmVudE5vZGUuZmlyc3RFbGVtZW50Q2hpbGQpICYmIHJlZ0V4cFRlc3QoLzxbL1xcdyFdL2csIGN1cnJlbnROb2RlLmlubmVySFRNTCkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3IV0vZywgY3VycmVudE5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFJlbW92ZSBhbnkgb2NjdXJyZW5jZSBvZiBwcm9jZXNzaW5nIGluc3RydWN0aW9ucyAqL1xuICAgIGlmIChjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLnByb2dyZXNzaW5nSW5zdHJ1Y3Rpb24pIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogUmVtb3ZlIGFueSBraW5kIG9mIHBvc3NpYmx5IGhhcm1mdWwgY29tbWVudHMgKi9cbiAgICBpZiAoU0FGRV9GT1JfWE1MICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUuY29tbWVudCAmJiByZWdFeHBUZXN0KC88Wy9cXHddL2csIGN1cnJlbnROb2RlLmRhdGEpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFJlbW92ZSBlbGVtZW50IGlmIGFueXRoaW5nIGZvcmJpZHMgaXRzIHByZXNlbmNlICovXG4gICAgaWYgKCEoRVhUUkFfRUxFTUVOVF9IQU5ETElORy50YWdDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIEVYVFJBX0VMRU1FTlRfSEFORExJTkcudGFnQ2hlY2sodGFnTmFtZSkpICYmICghQUxMT1dFRF9UQUdTW3RhZ05hbWVdIHx8IEZPUkJJRF9UQUdTW3RhZ05hbWVdKSkge1xuICAgICAgLyogQ2hlY2sgaWYgd2UgaGF2ZSBhIGN1c3RvbSBlbGVtZW50IHRvIGhhbmRsZSAqL1xuICAgICAgaWYgKCFGT1JCSURfVEFHU1t0YWdOYW1lXSAmJiBfaXNCYXNpY0N1c3RvbUVsZW1lbnQodGFnTmFtZSkpIHtcbiAgICAgICAgaWYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgdGFnTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayh0YWdOYW1lKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogS2VlcCBjb250ZW50IGV4Y2VwdCBmb3IgYmFkLWxpc3RlZCBlbGVtZW50cyAqL1xuICAgICAgaWYgKEtFRVBfQ09OVEVOVCAmJiAhRk9SQklEX0NPTlRFTlRTW3RhZ05hbWVdKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnROb2RlKGN1cnJlbnROb2RlKSB8fCBjdXJyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICBjb25zdCBjaGlsZE5vZGVzID0gZ2V0Q2hpbGROb2RlcyhjdXJyZW50Tm9kZSkgfHwgY3VycmVudE5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgaWYgKGNoaWxkTm9kZXMgJiYgcGFyZW50Tm9kZSkge1xuICAgICAgICAgIGNvbnN0IGNoaWxkQ291bnQgPSBjaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgICBmb3IgKGxldCBpID0gY2hpbGRDb3VudCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZENsb25lID0gY2xvbmVOb2RlKGNoaWxkTm9kZXNbaV0sIHRydWUpO1xuICAgICAgICAgICAgY2hpbGRDbG9uZS5fX3JlbW92YWxDb3VudCA9IChjdXJyZW50Tm9kZS5fX3JlbW92YWxDb3VudCB8fCAwKSArIDE7XG4gICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShjaGlsZENsb25lLCBnZXROZXh0U2libGluZyhjdXJyZW50Tm9kZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBDaGVjayB3aGV0aGVyIGVsZW1lbnQgaGFzIGEgdmFsaWQgbmFtZXNwYWNlICovXG4gICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCAmJiAhX2NoZWNrVmFsaWROYW1lc3BhY2UoY3VycmVudE5vZGUpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIE1ha2Ugc3VyZSB0aGF0IG9sZGVyIGJyb3dzZXJzIGRvbid0IGdldCBmYWxsYmFjay10YWcgbVhTUyAqL1xuICAgIGlmICgodGFnTmFtZSA9PT0gJ25vc2NyaXB0JyB8fCB0YWdOYW1lID09PSAnbm9lbWJlZCcgfHwgdGFnTmFtZSA9PT0gJ25vZnJhbWVzJykgJiYgcmVnRXhwVGVzdCgvPFxcL25vKHNjcmlwdHxlbWJlZHxmcmFtZXMpL2ksIGN1cnJlbnROb2RlLmlubmVySFRNTCkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogU2FuaXRpemUgZWxlbWVudCBjb250ZW50IHRvIGJlIHRlbXBsYXRlLXNhZmUgKi9cbiAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUudGV4dCkge1xuICAgICAgLyogR2V0IHRoZSBlbGVtZW50J3MgdGV4dCBjb250ZW50ICovXG4gICAgICBjb250ZW50ID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICBjb250ZW50ID0gc3RyaW5nUmVwbGFjZShjb250ZW50LCBleHByLCAnICcpO1xuICAgICAgfSk7XG4gICAgICBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQgIT09IGNvbnRlbnQpIHtcbiAgICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgICAgZWxlbWVudDogY3VycmVudE5vZGUuY2xvbmVOb2RlKClcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnROb2RlLnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYWZ0ZXJTYW5pdGl6ZUVsZW1lbnRzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICAvKipcbiAgICogX2lzVmFsaWRBdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIGxjVGFnIExvd2VyY2FzZSB0YWcgbmFtZSBvZiBjb250YWluaW5nIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBsY05hbWUgTG93ZXJjYXNlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKiBAcGFyYW0gdmFsdWUgQXR0cmlidXRlIHZhbHVlLlxuICAgKiBAcmV0dXJuIFJldHVybnMgdHJ1ZSBpZiBgdmFsdWVgIGlzIHZhbGlkLCBvdGhlcndpc2UgZmFsc2UuXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICBjb25zdCBfaXNWYWxpZEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIF9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKSB7XG4gICAgLyogTWFrZSBzdXJlIGF0dHJpYnV0ZSBjYW5ub3QgY2xvYmJlciAqL1xuICAgIGlmIChTQU5JVElaRV9ET00gJiYgKGxjTmFtZSA9PT0gJ2lkJyB8fCBsY05hbWUgPT09ICduYW1lJykgJiYgKHZhbHVlIGluIGRvY3VtZW50IHx8IHZhbHVlIGluIGZvcm1FbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKiBBbGxvdyB2YWxpZCBkYXRhLSogYXR0cmlidXRlczogQXQgbGVhc3Qgb25lIGNoYXJhY3RlciBhZnRlciBcIi1cIlxuICAgICAgICAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZG9tLmh0bWwjZW1iZWRkaW5nLWN1c3RvbS1ub24tdmlzaWJsZS1kYXRhLXdpdGgtdGhlLWRhdGEtKi1hdHRyaWJ1dGVzKVxuICAgICAgICBYTUwtY29tcGF0aWJsZSAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5mcmFzdHJ1Y3R1cmUuaHRtbCN4bWwtY29tcGF0aWJsZSBhbmQgaHR0cDovL3d3dy53My5vcmcvVFIveG1sLyNkMGU4MDQpXG4gICAgICAgIFdlIGRvbid0IG5lZWQgdG8gY2hlY2sgdGhlIHZhbHVlOyBpdCdzIGFsd2F5cyBVUkkgc2FmZS4gKi9cbiAgICBpZiAoQUxMT1dfREFUQV9BVFRSICYmICFGT1JCSURfQVRUUltsY05hbWVdICYmIHJlZ0V4cFRlc3QoREFUQV9BVFRSLCBsY05hbWUpKSA7IGVsc2UgaWYgKEFMTE9XX0FSSUFfQVRUUiAmJiByZWdFeHBUZXN0KEFSSUFfQVRUUiwgbGNOYW1lKSkgOyBlbHNlIGlmIChFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgRVhUUkFfRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVDaGVjayhsY05hbWUsIGxjVGFnKSkgOyBlbHNlIGlmICghQUxMT1dFRF9BVFRSW2xjTmFtZV0gfHwgRk9SQklEX0FUVFJbbGNOYW1lXSkge1xuICAgICAgaWYgKFxuICAgICAgLy8gRmlyc3QgY29uZGl0aW9uIGRvZXMgYSB2ZXJ5IGJhc2ljIGNoZWNrIGlmIGEpIGl0J3MgYmFzaWNhbGx5IGEgdmFsaWQgY3VzdG9tIGVsZW1lbnQgdGFnbmFtZSBBTkRcbiAgICAgIC8vIGIpIGlmIHRoZSB0YWdOYW1lIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrXG4gICAgICAvLyBhbmQgYykgaWYgdGhlIGF0dHJpYnV0ZSBuYW1lIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrXG4gICAgICBfaXNCYXNpY0N1c3RvbUVsZW1lbnQobGNUYWcpICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIGxjVGFnKSB8fCBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sobGNUYWcpKSAmJiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrLCBsY05hbWUpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayhsY05hbWUsIGxjVGFnKSkgfHxcbiAgICAgIC8vIEFsdGVybmF0aXZlLCBzZWNvbmQgY29uZGl0aW9uIGNoZWNrcyBpZiBpdCdzIGFuIGBpc2AtYXR0cmlidXRlLCBBTkRcbiAgICAgIC8vIHRoZSB2YWx1ZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVja1xuICAgICAgbGNOYW1lID09PSAnaXMnICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyAmJiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLCB2YWx1ZSkgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKHZhbHVlKSkpIDsgZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8qIENoZWNrIHZhbHVlIGlzIHNhZmUuIEZpcnN0LCBpcyBhdHRyIGluZXJ0PyBJZiBzbywgaXMgc2FmZSAqL1xuICAgIH0gZWxzZSBpZiAoVVJJX1NBRkVfQVRUUklCVVRFU1tsY05hbWVdKSA7IGVsc2UgaWYgKHJlZ0V4cFRlc3QoSVNfQUxMT1dFRF9VUkkkMSwgc3RyaW5nUmVwbGFjZSh2YWx1ZSwgQVRUUl9XSElURVNQQUNFLCAnJykpKSA7IGVsc2UgaWYgKChsY05hbWUgPT09ICdzcmMnIHx8IGxjTmFtZSA9PT0gJ3hsaW5rOmhyZWYnIHx8IGxjTmFtZSA9PT0gJ2hyZWYnKSAmJiBsY1RhZyAhPT0gJ3NjcmlwdCcgJiYgc3RyaW5nSW5kZXhPZih2YWx1ZSwgJ2RhdGE6JykgPT09IDAgJiYgREFUQV9VUklfVEFHU1tsY1RhZ10pIDsgZWxzZSBpZiAoQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgJiYgIXJlZ0V4cFRlc3QoSVNfU0NSSVBUX09SX0RBVEEsIHN0cmluZ1JlcGxhY2UodmFsdWUsIEFUVFJfV0hJVEVTUEFDRSwgJycpKSkgOyBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSA7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIC8qKlxuICAgKiBfaXNCYXNpY0N1c3RvbUVsZW1lbnRcbiAgICogY2hlY2tzIGlmIGF0IGxlYXN0IG9uZSBkYXNoIGlzIGluY2x1ZGVkIGluIHRhZ05hbWUsIGFuZCBpdCdzIG5vdCB0aGUgZmlyc3QgY2hhclxuICAgKiBmb3IgbW9yZSBzb3BoaXN0aWNhdGVkIGNoZWNraW5nIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3ZhbGlkYXRlLWVsZW1lbnQtbmFtZVxuICAgKlxuICAgKiBAcGFyYW0gdGFnTmFtZSBuYW1lIG9mIHRoZSB0YWcgb2YgdGhlIG5vZGUgdG8gc2FuaXRpemVcbiAgICogQHJldHVybnMgUmV0dXJucyB0cnVlIGlmIHRoZSB0YWcgbmFtZSBtZWV0cyB0aGUgYmFzaWMgY3JpdGVyaWEgZm9yIGEgY3VzdG9tIGVsZW1lbnQsIG90aGVyd2lzZSBmYWxzZS5cbiAgICovXG4gIGNvbnN0IF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCA9IGZ1bmN0aW9uIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCh0YWdOYW1lKSB7XG4gICAgcmV0dXJuIHRhZ05hbWUgIT09ICdhbm5vdGF0aW9uLXhtbCcgJiYgc3RyaW5nTWF0Y2godGFnTmFtZSwgQ1VTVE9NX0VMRU1FTlQpO1xuICB9O1xuICAvKipcbiAgICogX3Nhbml0aXplQXR0cmlidXRlc1xuICAgKlxuICAgKiBAcHJvdGVjdCBhdHRyaWJ1dGVzXG4gICAqIEBwcm90ZWN0IG5vZGVOYW1lXG4gICAqIEBwcm90ZWN0IHJlbW92ZUF0dHJpYnV0ZVxuICAgKiBAcHJvdGVjdCBzZXRBdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIGN1cnJlbnROb2RlIHRvIHNhbml0aXplXG4gICAqL1xuICBjb25zdCBfc2FuaXRpemVBdHRyaWJ1dGVzID0gZnVuY3Rpb24gX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSkge1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmJlZm9yZVNhbml0aXplQXR0cmlidXRlcywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIGNvbnN0IHtcbiAgICAgIGF0dHJpYnV0ZXNcbiAgICB9ID0gY3VycmVudE5vZGU7XG4gICAgLyogQ2hlY2sgaWYgd2UgaGF2ZSBhdHRyaWJ1dGVzOyBpZiBub3Qgd2UgbWlnaHQgaGF2ZSBhIHRleHQgbm9kZSAqL1xuICAgIGlmICghYXR0cmlidXRlcyB8fCBfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGhvb2tFdmVudCA9IHtcbiAgICAgIGF0dHJOYW1lOiAnJyxcbiAgICAgIGF0dHJWYWx1ZTogJycsXG4gICAgICBrZWVwQXR0cjogdHJ1ZSxcbiAgICAgIGFsbG93ZWRBdHRyaWJ1dGVzOiBBTExPV0VEX0FUVFIsXG4gICAgICBmb3JjZUtlZXBBdHRyOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIGxldCBsID0gYXR0cmlidXRlcy5sZW5ndGg7XG4gICAgLyogR28gYmFja3dhcmRzIG92ZXIgYWxsIGF0dHJpYnV0ZXM7IHNhZmVseSByZW1vdmUgYmFkIG9uZXMgKi9cbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICBjb25zdCBhdHRyID0gYXR0cmlidXRlc1tsXTtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgbmFtZXNwYWNlVVJJLFxuICAgICAgICB2YWx1ZTogYXR0clZhbHVlXG4gICAgICB9ID0gYXR0cjtcbiAgICAgIGNvbnN0IGxjTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKG5hbWUpO1xuICAgICAgY29uc3QgaW5pdFZhbHVlID0gYXR0clZhbHVlO1xuICAgICAgbGV0IHZhbHVlID0gbmFtZSA9PT0gJ3ZhbHVlJyA/IGluaXRWYWx1ZSA6IHN0cmluZ1RyaW0oaW5pdFZhbHVlKTtcbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIGhvb2tFdmVudC5hdHRyTmFtZSA9IGxjTmFtZTtcbiAgICAgIGhvb2tFdmVudC5hdHRyVmFsdWUgPSB2YWx1ZTtcbiAgICAgIGhvb2tFdmVudC5rZWVwQXR0ciA9IHRydWU7XG4gICAgICBob29rRXZlbnQuZm9yY2VLZWVwQXR0ciA9IHVuZGVmaW5lZDsgLy8gQWxsb3dzIGRldmVsb3BlcnMgdG8gc2VlIHRoaXMgaXMgYSBwcm9wZXJ0eSB0aGV5IGNhbiBzZXRcbiAgICAgIF9leGVjdXRlSG9va3MoaG9va3MudXBvblNhbml0aXplQXR0cmlidXRlLCBjdXJyZW50Tm9kZSwgaG9va0V2ZW50KTtcbiAgICAgIHZhbHVlID0gaG9va0V2ZW50LmF0dHJWYWx1ZTtcbiAgICAgIC8qIEZ1bGwgRE9NIENsb2JiZXJpbmcgcHJvdGVjdGlvbiB2aWEgbmFtZXNwYWNlIGlzb2xhdGlvbixcbiAgICAgICAqIFByZWZpeCBpZCBhbmQgbmFtZSBhdHRyaWJ1dGVzIHdpdGggYHVzZXItY29udGVudC1gXG4gICAgICAgKi9cbiAgICAgIGlmIChTQU5JVElaRV9OQU1FRF9QUk9QUyAmJiAobGNOYW1lID09PSAnaWQnIHx8IGxjTmFtZSA9PT0gJ25hbWUnKSkge1xuICAgICAgICAvLyBSZW1vdmUgdGhlIGF0dHJpYnV0ZSB3aXRoIHRoaXMgdmFsdWVcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIC8vIFByZWZpeCB0aGUgdmFsdWUgYW5kIGxhdGVyIHJlLWNyZWF0ZSB0aGUgYXR0cmlidXRlIHdpdGggdGhlIHNhbml0aXplZCB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IFNBTklUSVpFX05BTUVEX1BST1BTX1BSRUZJWCArIHZhbHVlO1xuICAgICAgfVxuICAgICAgLyogV29yayBhcm91bmQgYSBzZWN1cml0eSBpc3N1ZSB3aXRoIGNvbW1lbnRzIGluc2lkZSBhdHRyaWJ1dGVzICovXG4gICAgICBpZiAoU0FGRV9GT1JfWE1MICYmIHJlZ0V4cFRlc3QoLygoLS0hP3xdKT4pfDxcXC8oc3R5bGV8dGl0bGV8dGV4dGFyZWEpL2ksIHZhbHVlKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBNYWtlIHN1cmUgd2UgY2Fubm90IGVhc2lseSB1c2UgYW5pbWF0ZWQgaHJlZnMsIGV2ZW4gaWYgYW5pbWF0aW9ucyBhcmUgYWxsb3dlZCAqL1xuICAgICAgaWYgKGxjTmFtZSA9PT0gJ2F0dHJpYnV0ZW5hbWUnICYmIHN0cmluZ01hdGNoKHZhbHVlLCAnaHJlZicpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIERpZCB0aGUgaG9va3MgYXBwcm92ZSBvZiB0aGUgYXR0cmlidXRlPyAqL1xuICAgICAgaWYgKGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogRGlkIHRoZSBob29rcyBhcHByb3ZlIG9mIHRoZSBhdHRyaWJ1dGU/ICovXG4gICAgICBpZiAoIWhvb2tFdmVudC5rZWVwQXR0cikge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBXb3JrIGFyb3VuZCBhIHNlY3VyaXR5IGlzc3VlIGluIGpRdWVyeSAzLjAgKi9cbiAgICAgIGlmICghQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSICYmIHJlZ0V4cFRlc3QoL1xcLz4vaSwgdmFsdWUpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIFNhbml0aXplIGF0dHJpYnV0ZSBjb250ZW50IHRvIGJlIHRlbXBsYXRlLXNhZmUgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgICB2YWx1ZSA9IHN0cmluZ1JlcGxhY2UodmFsdWUsIGV4cHIsICcgJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLyogSXMgYHZhbHVlYCB2YWxpZCBmb3IgdGhpcyBhdHRyaWJ1dGU/ICovXG4gICAgICBjb25zdCBsY1RhZyA9IHRyYW5zZm9ybUNhc2VGdW5jKGN1cnJlbnROb2RlLm5vZGVOYW1lKTtcbiAgICAgIGlmICghX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIEhhbmRsZSBhdHRyaWJ1dGVzIHRoYXQgcmVxdWlyZSBUcnVzdGVkIFR5cGVzICovXG4gICAgICBpZiAodHJ1c3RlZFR5cGVzUG9saWN5ICYmIHR5cGVvZiB0cnVzdGVkVHlwZXMgPT09ICdvYmplY3QnICYmIHR5cGVvZiB0cnVzdGVkVHlwZXMuZ2V0QXR0cmlidXRlVHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAobmFtZXNwYWNlVVJJKSA7IGVsc2Uge1xuICAgICAgICAgIHN3aXRjaCAodHJ1c3RlZFR5cGVzLmdldEF0dHJpYnV0ZVR5cGUobGNUYWcsIGxjTmFtZSkpIHtcbiAgICAgICAgICAgIGNhc2UgJ1RydXN0ZWRIVE1MJzpcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwodmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdUcnVzdGVkU2NyaXB0VVJMJzpcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZVNjcmlwdFVSTCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8qIEhhbmRsZSBpbnZhbGlkIGRhdGEtKiBhdHRyaWJ1dGUgc2V0IGJ5IHRyeS1jYXRjaGluZyBpdCAqL1xuICAgICAgaWYgKHZhbHVlICE9PSBpbml0VmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAobmFtZXNwYWNlVVJJKSB7XG4gICAgICAgICAgICBjdXJyZW50Tm9kZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLyogRmFsbGJhY2sgdG8gc2V0QXR0cmlidXRlKCkgZm9yIGJyb3dzZXItdW5yZWNvZ25pemVkIG5hbWVzcGFjZXMgZS5nLiBcIngtc2NoZW1hXCIuICovXG4gICAgICAgICAgICBjdXJyZW50Tm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX2lzQ2xvYmJlcmVkKGN1cnJlbnROb2RlKSkge1xuICAgICAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyYXlQb3AoRE9NUHVyaWZ5LnJlbW92ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVBdHRyaWJ1dGVzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gIH07XG4gIC8qKlxuICAgKiBfc2FuaXRpemVTaGFkb3dET01cbiAgICpcbiAgICogQHBhcmFtIGZyYWdtZW50IHRvIGl0ZXJhdGUgb3ZlciByZWN1cnNpdmVseVxuICAgKi9cbiAgY29uc3QgX3Nhbml0aXplU2hhZG93RE9NID0gZnVuY3Rpb24gX3Nhbml0aXplU2hhZG93RE9NKGZyYWdtZW50KSB7XG4gICAgbGV0IHNoYWRvd05vZGUgPSBudWxsO1xuICAgIGNvbnN0IHNoYWRvd0l0ZXJhdG9yID0gX2NyZWF0ZU5vZGVJdGVyYXRvcihmcmFnbWVudCk7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVTaGFkb3dET00sIGZyYWdtZW50LCBudWxsKTtcbiAgICB3aGlsZSAoc2hhZG93Tm9kZSA9IHNoYWRvd0l0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9va3MoaG9va3MudXBvblNhbml0aXplU2hhZG93Tm9kZSwgc2hhZG93Tm9kZSwgbnVsbCk7XG4gICAgICAvKiBTYW5pdGl6ZSB0YWdzIGFuZCBlbGVtZW50cyAqL1xuICAgICAgX3Nhbml0aXplRWxlbWVudHMoc2hhZG93Tm9kZSk7XG4gICAgICAvKiBDaGVjayBhdHRyaWJ1dGVzIG5leHQgKi9cbiAgICAgIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoc2hhZG93Tm9kZSk7XG4gICAgICAvKiBEZWVwIHNoYWRvdyBET00gZGV0ZWN0ZWQgKi9cbiAgICAgIGlmIChzaGFkb3dOb2RlLmNvbnRlbnQgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgICAgIF9zYW5pdGl6ZVNoYWRvd0RPTShzaGFkb3dOb2RlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplU2hhZG93RE9NLCBmcmFnbWVudCwgbnVsbCk7XG4gIH07XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIERPTVB1cmlmeS5zYW5pdGl6ZSA9IGZ1bmN0aW9uIChkaXJ0eSkge1xuICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGxldCBib2R5ID0gbnVsbDtcbiAgICBsZXQgaW1wb3J0ZWROb2RlID0gbnVsbDtcbiAgICBsZXQgY3VycmVudE5vZGUgPSBudWxsO1xuICAgIGxldCByZXR1cm5Ob2RlID0gbnVsbDtcbiAgICAvKiBNYWtlIHN1cmUgd2UgaGF2ZSBhIHN0cmluZyB0byBzYW5pdGl6ZS5cbiAgICAgIERPIE5PVCByZXR1cm4gZWFybHksIGFzIHRoaXMgd2lsbCByZXR1cm4gdGhlIHdyb25nIHR5cGUgaWZcbiAgICAgIHRoZSB1c2VyIGhhcyByZXF1ZXN0ZWQgYSBET00gb2JqZWN0IHJhdGhlciB0aGFuIGEgc3RyaW5nICovXG4gICAgSVNfRU1QVFlfSU5QVVQgPSAhZGlydHk7XG4gICAgaWYgKElTX0VNUFRZX0lOUFVUKSB7XG4gICAgICBkaXJ0eSA9ICc8IS0tPic7XG4gICAgfVxuICAgIC8qIFN0cmluZ2lmeSwgaW4gY2FzZSBkaXJ0eSBpcyBhbiBvYmplY3QgKi9cbiAgICBpZiAodHlwZW9mIGRpcnR5ICE9PSAnc3RyaW5nJyAmJiAhX2lzTm9kZShkaXJ0eSkpIHtcbiAgICAgIGlmICh0eXBlb2YgZGlydHkudG9TdHJpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZGlydHkgPSBkaXJ0eS50b1N0cmluZygpO1xuICAgICAgICBpZiAodHlwZW9mIGRpcnR5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnZGlydHkgaXMgbm90IGEgc3RyaW5nLCBhYm9ydGluZycpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ3RvU3RyaW5nIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIFJldHVybiBkaXJ0eSBIVE1MIGlmIERPTVB1cmlmeSBjYW5ub3QgcnVuICovXG4gICAgaWYgKCFET01QdXJpZnkuaXNTdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgLyogQXNzaWduIGNvbmZpZyB2YXJzICovXG4gICAgaWYgKCFTRVRfQ09ORklHKSB7XG4gICAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICB9XG4gICAgLyogQ2xlYW4gdXAgcmVtb3ZlZCBlbGVtZW50cyAqL1xuICAgIERPTVB1cmlmeS5yZW1vdmVkID0gW107XG4gICAgLyogQ2hlY2sgaWYgZGlydHkgaXMgY29ycmVjdGx5IHR5cGVkIGZvciBJTl9QTEFDRSAqL1xuICAgIGlmICh0eXBlb2YgZGlydHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICBJTl9QTEFDRSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoSU5fUExBQ0UpIHtcbiAgICAgIC8qIERvIHNvbWUgZWFybHkgcHJlLXNhbml0aXphdGlvbiB0byBhdm9pZCB1bnNhZmUgcm9vdCBub2RlcyAqL1xuICAgICAgaWYgKGRpcnR5Lm5vZGVOYW1lKSB7XG4gICAgICAgIGNvbnN0IHRhZ05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhkaXJ0eS5ub2RlTmFtZSk7XG4gICAgICAgIGlmICghQUxMT1dFRF9UQUdTW3RhZ05hbWVdIHx8IEZPUkJJRF9UQUdTW3RhZ05hbWVdKSB7XG4gICAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdyb290IG5vZGUgaXMgZm9yYmlkZGVuIGFuZCBjYW5ub3QgYmUgc2FuaXRpemVkIGluLXBsYWNlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRpcnR5IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgLyogSWYgZGlydHkgaXMgYSBET00gZWxlbWVudCwgYXBwZW5kIHRvIGFuIGVtcHR5IGRvY3VtZW50IHRvIGF2b2lkXG4gICAgICAgICBlbGVtZW50cyBiZWluZyBzdHJpcHBlZCBieSB0aGUgcGFyc2VyICovXG4gICAgICBib2R5ID0gX2luaXREb2N1bWVudCgnPCEtLS0tPicpO1xuICAgICAgaW1wb3J0ZWROb2RlID0gYm9keS5vd25lckRvY3VtZW50LmltcG9ydE5vZGUoZGlydHksIHRydWUpO1xuICAgICAgaWYgKGltcG9ydGVkTm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLmVsZW1lbnQgJiYgaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnQk9EWScpIHtcbiAgICAgICAgLyogTm9kZSBpcyBhbHJlYWR5IGEgYm9keSwgdXNlIGFzIGlzICovXG4gICAgICAgIGJvZHkgPSBpbXBvcnRlZE5vZGU7XG4gICAgICB9IGVsc2UgaWYgKGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgIGJvZHkgPSBpbXBvcnRlZE5vZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtYXBwZW5kXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoaW1wb3J0ZWROb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLyogRXhpdCBkaXJlY3RseSBpZiB3ZSBoYXZlIG5vdGhpbmcgdG8gZG8gKi9cbiAgICAgIGlmICghUkVUVVJOX0RPTSAmJiAhU0FGRV9GT1JfVEVNUExBVEVTICYmICFXSE9MRV9ET0NVTUVOVCAmJlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWluY2x1ZGVzXG4gICAgICBkaXJ0eS5pbmRleE9mKCc8JykgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVzdGVkVHlwZXNQb2xpY3kgJiYgUkVUVVJOX1RSVVNURURfVFlQRSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKGRpcnR5KSA6IGRpcnR5O1xuICAgICAgfVxuICAgICAgLyogSW5pdGlhbGl6ZSB0aGUgZG9jdW1lbnQgdG8gd29yayBvbiAqL1xuICAgICAgYm9keSA9IF9pbml0RG9jdW1lbnQoZGlydHkpO1xuICAgICAgLyogQ2hlY2sgd2UgaGF2ZSBhIERPTSBub2RlIGZyb20gdGhlIGRhdGEgKi9cbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICByZXR1cm4gUkVUVVJOX0RPTSA/IG51bGwgOiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gZW1wdHlIVE1MIDogJyc7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIFJlbW92ZSBmaXJzdCBlbGVtZW50IG5vZGUgKG91cnMpIGlmIEZPUkNFX0JPRFkgaXMgc2V0ICovXG4gICAgaWYgKGJvZHkgJiYgRk9SQ0VfQk9EWSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGJvZHkuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIC8qIEdldCBub2RlIGl0ZXJhdG9yICovXG4gICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gX2NyZWF0ZU5vZGVJdGVyYXRvcihJTl9QTEFDRSA/IGRpcnR5IDogYm9keSk7XG4gICAgLyogTm93IHN0YXJ0IGl0ZXJhdGluZyBvdmVyIHRoZSBjcmVhdGVkIGRvY3VtZW50ICovXG4gICAgd2hpbGUgKGN1cnJlbnROb2RlID0gbm9kZUl0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgIC8qIFNhbml0aXplIHRhZ3MgYW5kIGVsZW1lbnRzICovXG4gICAgICBfc2FuaXRpemVFbGVtZW50cyhjdXJyZW50Tm9kZSk7XG4gICAgICAvKiBDaGVjayBhdHRyaWJ1dGVzIG5leHQgKi9cbiAgICAgIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoY3VycmVudE5vZGUpO1xuICAgICAgLyogU2hhZG93IERPTSBkZXRlY3RlZCwgc2FuaXRpemUgaXQgKi9cbiAgICAgIGlmIChjdXJyZW50Tm9kZS5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oY3VycmVudE5vZGUuY29udGVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIElmIHdlIHNhbml0aXplZCBgZGlydHlgIGluLXBsYWNlLCByZXR1cm4gaXQuICovXG4gICAgaWYgKElOX1BMQUNFKSB7XG4gICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIC8qIFJldHVybiBzYW5pdGl6ZWQgc3RyaW5nIG9yIERPTSAqL1xuICAgIGlmIChSRVRVUk5fRE9NKSB7XG4gICAgICBpZiAoUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICByZXR1cm5Ob2RlID0gY3JlYXRlRG9jdW1lbnRGcmFnbWVudC5jYWxsKGJvZHkub3duZXJEb2N1bWVudCk7XG4gICAgICAgIHdoaWxlIChib2R5LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtYXBwZW5kXG4gICAgICAgICAgcmV0dXJuTm9kZS5hcHBlbmRDaGlsZChib2R5LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm5Ob2RlID0gYm9keTtcbiAgICAgIH1cbiAgICAgIGlmIChBTExPV0VEX0FUVFIuc2hhZG93cm9vdCB8fCBBTExPV0VEX0FUVFIuc2hhZG93cm9vdG1vZGUpIHtcbiAgICAgICAgLypcbiAgICAgICAgICBBZG9wdE5vZGUoKSBpcyBub3QgdXNlZCBiZWNhdXNlIGludGVybmFsIHN0YXRlIGlzIG5vdCByZXNldFxuICAgICAgICAgIChlLmcuIHRoZSBwYXN0IG5hbWVzIG1hcCBvZiBhIEhUTUxGb3JtRWxlbWVudCksIHRoaXMgaXMgc2FmZVxuICAgICAgICAgIGluIHRoZW9yeSBidXQgd2Ugd291bGQgcmF0aGVyIG5vdCByaXNrIGFub3RoZXIgYXR0YWNrIHZlY3Rvci5cbiAgICAgICAgICBUaGUgc3RhdGUgdGhhdCBpcyBjbG9uZWQgYnkgaW1wb3J0Tm9kZSgpIGlzIGV4cGxpY2l0bHkgZGVmaW5lZFxuICAgICAgICAgIGJ5IHRoZSBzcGVjcy5cbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuTm9kZSA9IGltcG9ydE5vZGUuY2FsbChvcmlnaW5hbERvY3VtZW50LCByZXR1cm5Ob2RlLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXR1cm5Ob2RlO1xuICAgIH1cbiAgICBsZXQgc2VyaWFsaXplZEhUTUwgPSBXSE9MRV9ET0NVTUVOVCA/IGJvZHkub3V0ZXJIVE1MIDogYm9keS5pbm5lckhUTUw7XG4gICAgLyogU2VyaWFsaXplIGRvY3R5cGUgaWYgYWxsb3dlZCAqL1xuICAgIGlmIChXSE9MRV9ET0NVTUVOVCAmJiBBTExPV0VEX1RBR1NbJyFkb2N0eXBlJ10gJiYgYm9keS5vd25lckRvY3VtZW50ICYmIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlICYmIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUgJiYgcmVnRXhwVGVzdChET0NUWVBFX05BTUUsIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUpKSB7XG4gICAgICBzZXJpYWxpemVkSFRNTCA9ICc8IURPQ1RZUEUgJyArIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUgKyAnPlxcbicgKyBzZXJpYWxpemVkSFRNTDtcbiAgICB9XG4gICAgLyogU2FuaXRpemUgZmluYWwgc3RyaW5nIHRlbXBsYXRlLXNhZmUgKi9cbiAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICBzZXJpYWxpemVkSFRNTCA9IHN0cmluZ1JlcGxhY2Uoc2VyaWFsaXplZEhUTUwsIGV4cHIsICcgJyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoc2VyaWFsaXplZEhUTUwpIDogc2VyaWFsaXplZEhUTUw7XG4gIH07XG4gIERPTVB1cmlmeS5zZXRDb25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgX3BhcnNlQ29uZmlnKGNmZyk7XG4gICAgU0VUX0NPTkZJRyA9IHRydWU7XG4gIH07XG4gIERPTVB1cmlmeS5jbGVhckNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBDT05GSUcgPSBudWxsO1xuICAgIFNFVF9DT05GSUcgPSBmYWxzZTtcbiAgfTtcbiAgRE9NUHVyaWZ5LmlzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiAodGFnLCBhdHRyLCB2YWx1ZSkge1xuICAgIC8qIEluaXRpYWxpemUgc2hhcmVkIGNvbmZpZyB2YXJzIGlmIG5lY2Vzc2FyeS4gKi9cbiAgICBpZiAoIUNPTkZJRykge1xuICAgICAgX3BhcnNlQ29uZmlnKHt9KTtcbiAgICB9XG4gICAgY29uc3QgbGNUYWcgPSB0cmFuc2Zvcm1DYXNlRnVuYyh0YWcpO1xuICAgIGNvbnN0IGxjTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKGF0dHIpO1xuICAgIHJldHVybiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSk7XG4gIH07XG4gIERPTVB1cmlmeS5hZGRIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQsIGhvb2tGdW5jdGlvbikge1xuICAgIGlmICh0eXBlb2YgaG9va0Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGFycmF5UHVzaChob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgfTtcbiAgRE9NUHVyaWZ5LnJlbW92ZUhvb2sgPSBmdW5jdGlvbiAoZW50cnlQb2ludCwgaG9va0Z1bmN0aW9uKSB7XG4gICAgaWYgKGhvb2tGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGFycmF5TGFzdEluZGV4T2YoaG9va3NbZW50cnlQb2ludF0sIGhvb2tGdW5jdGlvbik7XG4gICAgICByZXR1cm4gaW5kZXggPT09IC0xID8gdW5kZWZpbmVkIDogYXJyYXlTcGxpY2UoaG9va3NbZW50cnlQb2ludF0sIGluZGV4LCAxKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5UG9wKGhvb2tzW2VudHJ5UG9pbnRdKTtcbiAgfTtcbiAgRE9NUHVyaWZ5LnJlbW92ZUhvb2tzID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQpIHtcbiAgICBob29rc1tlbnRyeVBvaW50XSA9IFtdO1xuICB9O1xuICBET01QdXJpZnkucmVtb3ZlQWxsSG9va3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgaG9va3MgPSBfY3JlYXRlSG9va3NNYXAoKTtcbiAgfTtcbiAgcmV0dXJuIERPTVB1cmlmeTtcbn1cbnZhciBwdXJpZnkgPSBjcmVhdGVET01QdXJpZnkoKTtcblxuZXhwb3J0IHsgcHVyaWZ5IGFzIGRlZmF1bHQgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXB1cmlmeS5lcy5tanMubWFwXG4iLCIvKipcbiAqIG1hcmtlZCB2MTcuMC4xIC0gYSBtYXJrZG93biBwYXJzZXJcbiAqIENvcHlyaWdodCAoYykgMjAxOC0yMDI1LCBNYXJrZWRKUy4gKE1JVCBMaWNlbnNlKVxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTgsIENocmlzdG9waGVyIEplZmZyZXkuIChNSVQgTGljZW5zZSlcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWRcbiAqL1xuXG4vKipcbiAqIERPIE5PVCBFRElUIFRISVMgRklMRVxuICogVGhlIGNvZGUgaW4gdGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBmcm9tIGZpbGVzIGluIC4vc3JjL1xuICovXG5cbmZ1bmN0aW9uIEwoKXtyZXR1cm57YXN5bmM6ITEsYnJlYWtzOiExLGV4dGVuc2lvbnM6bnVsbCxnZm06ITAsaG9va3M6bnVsbCxwZWRhbnRpYzohMSxyZW5kZXJlcjpudWxsLHNpbGVudDohMSx0b2tlbml6ZXI6bnVsbCx3YWxrVG9rZW5zOm51bGx9fXZhciBUPUwoKTtmdW5jdGlvbiBaKHUpe1Q9dX12YXIgQz17ZXhlYzooKT0+bnVsbH07ZnVuY3Rpb24gayh1LGU9XCJcIil7bGV0IHQ9dHlwZW9mIHU9PVwic3RyaW5nXCI/dTp1LnNvdXJjZSxuPXtyZXBsYWNlOihyLGkpPT57bGV0IHM9dHlwZW9mIGk9PVwic3RyaW5nXCI/aTppLnNvdXJjZTtyZXR1cm4gcz1zLnJlcGxhY2UobS5jYXJldCxcIiQxXCIpLHQ9dC5yZXBsYWNlKHIscyksbn0sZ2V0UmVnZXg6KCk9Pm5ldyBSZWdFeHAodCxlKX07cmV0dXJuIG59dmFyIG1lPSgoKT0+e3RyeXtyZXR1cm4hIW5ldyBSZWdFeHAoXCIoPzw9MSkoPzwhMSlcIil9Y2F0Y2h7cmV0dXJuITF9fSkoKSxtPXtjb2RlUmVtb3ZlSW5kZW50Oi9eKD86IHsxLDR9fCB7MCwzfVxcdCkvZ20sb3V0cHV0TGlua1JlcGxhY2U6L1xcXFwoW1xcW1xcXV0pL2csaW5kZW50Q29kZUNvbXBlbnNhdGlvbjovXihcXHMrKSg/OmBgYCkvLGJlZ2lubmluZ1NwYWNlOi9eXFxzKy8sZW5kaW5nSGFzaDovIyQvLHN0YXJ0aW5nU3BhY2VDaGFyOi9eIC8sZW5kaW5nU3BhY2VDaGFyOi8gJC8sbm9uU3BhY2VDaGFyOi9bXiBdLyxuZXdMaW5lQ2hhckdsb2JhbDovXFxuL2csdGFiQ2hhckdsb2JhbDovXFx0L2csbXVsdGlwbGVTcGFjZUdsb2JhbDovXFxzKy9nLGJsYW5rTGluZTovXlsgXFx0XSokLyxkb3VibGVCbGFua0xpbmU6L1xcblsgXFx0XSpcXG5bIFxcdF0qJC8sYmxvY2txdW90ZVN0YXJ0Oi9eIHswLDN9Pi8sYmxvY2txdW90ZVNldGV4dFJlcGxhY2U6L1xcbiB7MCwzfSgoPzo9K3wtKykgKikoPz1cXG58JCkvZyxibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZTI6L14gezAsM30+WyBcXHRdPy9nbSxsaXN0UmVwbGFjZVRhYnM6L15cXHQrLyxsaXN0UmVwbGFjZU5lc3Rpbmc6L14gezEsNH0oPz0oIHs0fSkqW14gXSkvZyxsaXN0SXNUYXNrOi9eXFxbWyB4WF1cXF0gK1xcUy8sbGlzdFJlcGxhY2VUYXNrOi9eXFxbWyB4WF1cXF0gKy8sbGlzdFRhc2tDaGVja2JveDovXFxbWyB4WF1cXF0vLGFueUxpbmU6L1xcbi4qXFxuLyxocmVmQnJhY2tldHM6L148KC4qKT4kLyx0YWJsZURlbGltaXRlcjovWzp8XS8sdGFibGVBbGlnbkNoYXJzOi9eXFx8fFxcfCAqJC9nLHRhYmxlUm93QmxhbmtMaW5lOi9cXG5bIFxcdF0qJC8sdGFibGVBbGlnblJpZ2h0Oi9eICotKzogKiQvLHRhYmxlQWxpZ25DZW50ZXI6L14gKjotKzogKiQvLHRhYmxlQWxpZ25MZWZ0Oi9eICo6LSsgKiQvLHN0YXJ0QVRhZzovXjxhIC9pLGVuZEFUYWc6L148XFwvYT4vaSxzdGFydFByZVNjcmlwdFRhZzovXjwocHJlfGNvZGV8a2JkfHNjcmlwdCkoXFxzfD4pL2ksZW5kUHJlU2NyaXB0VGFnOi9ePFxcLyhwcmV8Y29kZXxrYmR8c2NyaXB0KShcXHN8PikvaSxzdGFydEFuZ2xlQnJhY2tldDovXjwvLGVuZEFuZ2xlQnJhY2tldDovPiQvLHBlZGFudGljSHJlZlRpdGxlOi9eKFteJ1wiXSpbXlxcc10pXFxzKyhbJ1wiXSkoLiopXFwyLyx1bmljb2RlQWxwaGFOdW1lcmljOi9bXFxwe0x9XFxwe059XS91LGVzY2FwZVRlc3Q6L1smPD5cIiddLyxlc2NhcGVSZXBsYWNlOi9bJjw+XCInXS9nLGVzY2FwZVRlc3ROb0VuY29kZTovWzw+XCInXXwmKD8hKCNcXGR7MSw3fXwjW1h4XVthLWZBLUYwLTldezEsNn18XFx3Kyk7KS8sZXNjYXBlUmVwbGFjZU5vRW5jb2RlOi9bPD5cIiddfCYoPyEoI1xcZHsxLDd9fCNbWHhdW2EtZkEtRjAtOV17MSw2fXxcXHcrKTspL2csdW5lc2NhcGVUZXN0Oi8mKCMoPzpcXGQrKXwoPzojeFswLTlBLUZhLWZdKyl8KD86XFx3KykpOz8vaWcsY2FyZXQ6LyhefFteXFxbXSlcXF4vZyxwZXJjZW50RGVjb2RlOi8lMjUvZyxmaW5kUGlwZTovXFx8L2csc3BsaXRQaXBlOi8gXFx8LyxzbGFzaFBpcGU6L1xcXFxcXHwvZyxjYXJyaWFnZVJldHVybjovXFxyXFxufFxcci9nLHNwYWNlTGluZTovXiArJC9nbSxub3RTcGFjZVN0YXJ0Oi9eXFxTKi8sZW5kaW5nTmV3bGluZTovXFxuJC8sbGlzdEl0ZW1SZWdleDp1PT5uZXcgUmVnRXhwKGBeKCB7MCwzfSR7dX0pKCg/OltcdCBdW15cXFxcbl0qKT8oPzpcXFxcbnwkKSlgKSxuZXh0QnVsbGV0UmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19KD86WyorLV18XFxcXGR7MSw5fVsuKV0pKCg/OlsgXHRdW15cXFxcbl0qKT8oPzpcXFxcbnwkKSlgKSxoclJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSgoPzotICopezMsfXwoPzpfICopezMsfXwoPzpcXFxcKiAqKXszLH0pKD86XFxcXG4rfCQpYCksZmVuY2VzQmVnaW5SZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0oPzpcXGBcXGBcXGB8fn5+KWApLGhlYWRpbmdCZWdpblJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSNgKSxodG1sQmVnaW5SZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX08KD86W2Etel0uKj58IS0tKWAsXCJpXCIpfSx4ZT0vXig/OlsgXFx0XSooPzpcXG58JCkpKy8sYmU9L14oKD86IHs0fXwgezAsM31cXHQpW15cXG5dKyg/Olxcbig/OlsgXFx0XSooPzpcXG58JCkpKik/KSsvLFJlPS9eIHswLDN9KGB7Myx9KD89W15gXFxuXSooPzpcXG58JCkpfH57Myx9KShbXlxcbl0qKSg/OlxcbnwkKSg/OnwoW1xcc1xcU10qPykoPzpcXG58JCkpKD86IHswLDN9XFwxW35gXSogKig/PVxcbnwkKXwkKS8sST0vXiB7MCwzfSgoPzotW1xcdCBdKil7Myx9fCg/Ol9bIFxcdF0qKXszLH18KD86XFwqWyBcXHRdKil7Myx9KSg/Olxcbit8JCkvLFRlPS9eIHswLDN9KCN7MSw2fSkoPz1cXHN8JCkoLiopKD86XFxuK3wkKS8sTj0vKD86WyorLV18XFxkezEsOX1bLildKS8scmU9L14oPyFidWxsIHxibG9ja0NvZGV8ZmVuY2VzfGJsb2NrcXVvdGV8aGVhZGluZ3xodG1sfHRhYmxlKSgoPzoufFxcbig/IVxccyo/XFxufGJ1bGwgfGJsb2NrQ29kZXxmZW5jZXN8YmxvY2txdW90ZXxoZWFkaW5nfGh0bWx8dGFibGUpKSs/KVxcbiB7MCwzfSg9K3wtKykgKig/Olxcbit8JCkvLHNlPWsocmUpLnJlcGxhY2UoL2J1bGwvZyxOKS5yZXBsYWNlKC9ibG9ja0NvZGUvZywvKD86IHs0fXwgezAsM31cXHQpLykucmVwbGFjZSgvZmVuY2VzL2csLyB7MCwzfSg/OmB7Myx9fH57Myx9KS8pLnJlcGxhY2UoL2Jsb2NrcXVvdGUvZywvIHswLDN9Pi8pLnJlcGxhY2UoL2hlYWRpbmcvZywvIHswLDN9I3sxLDZ9LykucmVwbGFjZSgvaHRtbC9nLC8gezAsM308W15cXG4+XSs+XFxuLykucmVwbGFjZSgvXFx8dGFibGUvZyxcIlwiKS5nZXRSZWdleCgpLE9lPWsocmUpLnJlcGxhY2UoL2J1bGwvZyxOKS5yZXBsYWNlKC9ibG9ja0NvZGUvZywvKD86IHs0fXwgezAsM31cXHQpLykucmVwbGFjZSgvZmVuY2VzL2csLyB7MCwzfSg/OmB7Myx9fH57Myx9KS8pLnJlcGxhY2UoL2Jsb2NrcXVvdGUvZywvIHswLDN9Pi8pLnJlcGxhY2UoL2hlYWRpbmcvZywvIHswLDN9I3sxLDZ9LykucmVwbGFjZSgvaHRtbC9nLC8gezAsM308W15cXG4+XSs+XFxuLykucmVwbGFjZSgvdGFibGUvZywvIHswLDN9XFx8Pyg/Ols6XFwtIF0qXFx8KStbXFw6XFwtIF0qXFxuLykuZ2V0UmVnZXgoKSxRPS9eKFteXFxuXSsoPzpcXG4oPyFocnxoZWFkaW5nfGxoZWFkaW5nfGJsb2NrcXVvdGV8ZmVuY2VzfGxpc3R8aHRtbHx0YWJsZXwgK1xcbilbXlxcbl0rKSopLyx3ZT0vXlteXFxuXSsvLEY9Lyg/IVxccypcXF0pKD86XFxcXFtcXHNcXFNdfFteXFxbXFxdXFxcXF0pKy8seWU9aygvXiB7MCwzfVxcWyhsYWJlbClcXF06ICooPzpcXG5bIFxcdF0qKT8oW148XFxzXVteXFxzXSp8PC4qPz4pKD86KD86ICsoPzpcXG5bIFxcdF0qKT98ICpcXG5bIFxcdF0qKSh0aXRsZSkpPyAqKD86XFxuK3wkKS8pLnJlcGxhY2UoXCJsYWJlbFwiLEYpLnJlcGxhY2UoXCJ0aXRsZVwiLC8oPzpcIig/OlxcXFxcIj98W15cIlxcXFxdKSpcInwnW14nXFxuXSooPzpcXG5bXidcXG5dKykqXFxuPyd8XFwoW14oKV0qXFwpKS8pLmdldFJlZ2V4KCksUGU9aygvXiggezAsM31idWxsKShbIFxcdF1bXlxcbl0rPyk/KD86XFxufCQpLykucmVwbGFjZSgvYnVsbC9nLE4pLmdldFJlZ2V4KCksdj1cImFkZHJlc3N8YXJ0aWNsZXxhc2lkZXxiYXNlfGJhc2Vmb250fGJsb2NrcXVvdGV8Ym9keXxjYXB0aW9ufGNlbnRlcnxjb2x8Y29sZ3JvdXB8ZGR8ZGV0YWlsc3xkaWFsb2d8ZGlyfGRpdnxkbHxkdHxmaWVsZHNldHxmaWdjYXB0aW9ufGZpZ3VyZXxmb290ZXJ8Zm9ybXxmcmFtZXxmcmFtZXNldHxoWzEtNl18aGVhZHxoZWFkZXJ8aHJ8aHRtbHxpZnJhbWV8bGVnZW5kfGxpfGxpbmt8bWFpbnxtZW51fG1lbnVpdGVtfG1ldGF8bmF2fG5vZnJhbWVzfG9sfG9wdGdyb3VwfG9wdGlvbnxwfHBhcmFtfHNlYXJjaHxzZWN0aW9ufHN1bW1hcnl8dGFibGV8dGJvZHl8dGR8dGZvb3R8dGh8dGhlYWR8dGl0bGV8dHJ8dHJhY2t8dWxcIixqPS88IS0tKD86LT8+fFtcXHNcXFNdKj8oPzotLT58JCkpLyxTZT1rKFwiXiB7MCwzfSg/Ojwoc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSlbXFxcXHM+XVtcXFxcc1xcXFxTXSo/KD86PC9cXFxcMT5bXlxcXFxuXSpcXFxcbit8JCl8Y29tbWVudFteXFxcXG5dKihcXFxcbit8JCl8PFxcXFw/W1xcXFxzXFxcXFNdKj8oPzpcXFxcPz5cXFxcbip8JCl8PCFbQS1aXVtcXFxcc1xcXFxTXSo/KD86PlxcXFxuKnwkKXw8IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/KD86XFxcXF1cXFxcXT5cXFxcbip8JCl8PC8/KHRhZykoPzogK3xcXFxcbnwvPz4pW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcblsgXHRdKikrXFxcXG58JCl8PCg/IXNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpKFthLXpdW1xcXFx3LV0qKSg/OmF0dHJpYnV0ZSkqPyAqLz8+KD89WyBcXFxcdF0qKD86XFxcXG58JCkpW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcblsgXHRdKikrXFxcXG58JCl8PC8oPyFzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKVthLXpdW1xcXFx3LV0qXFxcXHMqPig/PVsgXFxcXHRdKig/OlxcXFxufCQpKVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG5bIFx0XSopK1xcXFxufCQpKVwiLFwiaVwiKS5yZXBsYWNlKFwiY29tbWVudFwiLGopLnJlcGxhY2UoXCJ0YWdcIix2KS5yZXBsYWNlKFwiYXR0cmlidXRlXCIsLyArW2EtekEtWjpfXVtcXHcuOi1dKig/OiAqPSAqXCJbXlwiXFxuXSpcInwgKj0gKidbXidcXG5dKid8ICo9ICpbXlxcc1wiJz08PmBdKyk/LykuZ2V0UmVnZXgoKSxpZT1rKFEpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsXCIgezAsM30jezEsNn0oPzpcXFxcc3wkKVwiKS5yZXBsYWNlKFwifGxoZWFkaW5nXCIsXCJcIikucmVwbGFjZShcInx0YWJsZVwiLFwiXCIpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJmZW5jZXNcIixcIiB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcblwiKS5yZXBsYWNlKFwibGlzdFwiLFwiIHswLDN9KD86WyorLV18MVsuKV0pIFwiKS5yZXBsYWNlKFwiaHRtbFwiLFwiPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKVwiKS5yZXBsYWNlKFwidGFnXCIsdikuZ2V0UmVnZXgoKSwkZT1rKC9eKCB7MCwzfT4gPyhwYXJhZ3JhcGh8W15cXG5dKikoPzpcXG58JCkpKy8pLnJlcGxhY2UoXCJwYXJhZ3JhcGhcIixpZSkuZ2V0UmVnZXgoKSxVPXtibG9ja3F1b3RlOiRlLGNvZGU6YmUsZGVmOnllLGZlbmNlczpSZSxoZWFkaW5nOlRlLGhyOkksaHRtbDpTZSxsaGVhZGluZzpzZSxsaXN0OlBlLG5ld2xpbmU6eGUscGFyYWdyYXBoOmllLHRhYmxlOkMsdGV4dDp3ZX0sdGU9ayhcIl4gKihbXlxcXFxuIF0uKilcXFxcbiB7MCwzfSgoPzpcXFxcfCAqKT86Py0rOj8gKig/OlxcXFx8ICo6Py0rOj8gKikqKD86XFxcXHwgKik/KSg/OlxcXFxuKCg/Oig/ISAqXFxcXG58aHJ8aGVhZGluZ3xibG9ja3F1b3RlfGNvZGV8ZmVuY2VzfGxpc3R8aHRtbCkuKig/OlxcXFxufCQpKSopXFxcXG4qfCQpXCIpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsXCIgezAsM30jezEsNn0oPzpcXFxcc3wkKVwiKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwiY29kZVwiLFwiKD86IHs0fXwgezAsM31cdClbXlxcXFxuXVwiKS5yZXBsYWNlKFwiZmVuY2VzXCIsXCIgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG5cIikucmVwbGFjZShcImxpc3RcIixcIiB7MCwzfSg/OlsqKy1dfDFbLildKSBcIikucmVwbGFjZShcImh0bWxcIixcIjwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSlcIikucmVwbGFjZShcInRhZ1wiLHYpLmdldFJlZ2V4KCksX2U9ey4uLlUsbGhlYWRpbmc6T2UsdGFibGU6dGUscGFyYWdyYXBoOmsoUSkucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixcIiB7MCwzfSN7MSw2fSg/OlxcXFxzfCQpXCIpLnJlcGxhY2UoXCJ8bGhlYWRpbmdcIixcIlwiKS5yZXBsYWNlKFwidGFibGVcIix0ZSkucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcImZlbmNlc1wiLFwiIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuXCIpLnJlcGxhY2UoXCJsaXN0XCIsXCIgezAsM30oPzpbKistXXwxWy4pXSkgXCIpLnJlcGxhY2UoXCJodG1sXCIsXCI8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pXCIpLnJlcGxhY2UoXCJ0YWdcIix2KS5nZXRSZWdleCgpfSxMZT17Li4uVSxodG1sOmsoYF4gKig/OmNvbW1lbnQgKig/OlxcXFxufFxcXFxzKiQpfDwodGFnKVtcXFxcc1xcXFxTXSs/PC9cXFxcMT4gKig/OlxcXFxuezIsfXxcXFxccyokKXw8dGFnKD86XCJbXlwiXSpcInwnW14nXSonfFxcXFxzW14nXCIvPlxcXFxzXSopKj8vPz4gKig/OlxcXFxuezIsfXxcXFxccyokKSlgKS5yZXBsYWNlKFwiY29tbWVudFwiLGopLnJlcGxhY2UoL3RhZy9nLFwiKD8hKD86YXxlbXxzdHJvbmd8c21hbGx8c3xjaXRlfHF8ZGZufGFiYnJ8ZGF0YXx0aW1lfGNvZGV8dmFyfHNhbXB8a2JkfHN1YnxzdXB8aXxifHV8bWFya3xydWJ5fHJ0fHJwfGJkaXxiZG98c3Bhbnxicnx3YnJ8aW5zfGRlbHxpbWcpXFxcXGIpXFxcXHcrKD8hOnxbXlxcXFx3XFxcXHNAXSpAKVxcXFxiXCIpLmdldFJlZ2V4KCksZGVmOi9eICpcXFsoW15cXF1dKylcXF06ICo8PyhbXlxccz5dKyk+Pyg/OiArKFtcIihdW15cXG5dK1tcIildKSk/ICooPzpcXG4rfCQpLyxoZWFkaW5nOi9eKCN7MSw2fSkoLiopKD86XFxuK3wkKS8sZmVuY2VzOkMsbGhlYWRpbmc6L14oLis/KVxcbiB7MCwzfSg9K3wtKykgKig/Olxcbit8JCkvLHBhcmFncmFwaDprKFEpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsYCAqI3sxLDZ9ICpbXlxuXWApLnJlcGxhY2UoXCJsaGVhZGluZ1wiLHNlKS5yZXBsYWNlKFwifHRhYmxlXCIsXCJcIikucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcInxmZW5jZXNcIixcIlwiKS5yZXBsYWNlKFwifGxpc3RcIixcIlwiKS5yZXBsYWNlKFwifGh0bWxcIixcIlwiKS5yZXBsYWNlKFwifHRhZ1wiLFwiXCIpLmdldFJlZ2V4KCl9LE1lPS9eXFxcXChbIVwiIyQlJicoKSorLFxcLS4vOjs8PT4/QFxcW1xcXVxcXFxeX2B7fH1+XSkvLHplPS9eKGArKShbXmBdfFteYF1bXFxzXFxTXSo/W15gXSlcXDEoPyFgKS8sb2U9L14oIHsyLH18XFxcXClcXG4oPyFcXHMqJCkvLEFlPS9eKGArfFteYF0pKD86KD89IHsyLH1cXG4pfFtcXHNcXFNdKj8oPzooPz1bXFxcXDwhXFxbYCpfXXxcXGJffCQpfFteIF0oPz0gezIsfVxcbikpKS8sRD0vW1xccHtQfVxccHtTfV0vdSxLPS9bXFxzXFxwe1B9XFxwe1N9XS91LGFlPS9bXlxcc1xccHtQfVxccHtTfV0vdSxDZT1rKC9eKCg/IVsqX10pcHVuY3RTcGFjZSkvLFwidVwiKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSykuZ2V0UmVnZXgoKSxsZT0vKD8hfilbXFxwe1B9XFxwe1N9XS91LEllPS8oPyF+KVtcXHNcXHB7UH1cXHB7U31dL3UsRWU9Lyg/OlteXFxzXFxwe1B9XFxwe1N9XXx+KS91LEJlPWsoL2xpbmt8cHJlY29kZS1jb2RlfGh0bWwvLFwiZ1wiKS5yZXBsYWNlKFwibGlua1wiLC9cXFsoPzpbXlxcW1xcXWBdfCg/PGE+YCspW15gXStcXGs8YT4oPyFgKSkqP1xcXVxcKCg/OlxcXFxbXFxzXFxTXXxbXlxcXFxcXChcXCldfFxcKCg/OlxcXFxbXFxzXFxTXXxbXlxcXFxcXChcXCldKSpcXCkpKlxcKS8pLnJlcGxhY2UoXCJwcmVjb2RlLVwiLG1lP1wiKD88IWApKClcIjpcIiheXnxbXmBdKVwiKS5yZXBsYWNlKFwiY29kZVwiLC8oPzxiPmArKVteYF0rXFxrPGI+KD8hYCkvKS5yZXBsYWNlKFwiaHRtbFwiLC88KD8hIClbXjw+XSo/Pi8pLmdldFJlZ2V4KCksdWU9L14oPzpcXCorKD86KCg/IVxcKilwdW5jdCl8W15cXHMqXSkpfF5fKyg/OigoPyFfKXB1bmN0KXwoW15cXHNfXSkpLyxxZT1rKHVlLFwidVwiKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksdmU9ayh1ZSxcInVcIikucmVwbGFjZSgvcHVuY3QvZyxsZSkuZ2V0UmVnZXgoKSxwZT1cIl5bXl8qXSo/X19bXl8qXSo/XFxcXCpbXl8qXSo/KD89X18pfFteKl0rKD89W14qXSl8KD8hXFxcXCopcHVuY3QoXFxcXCorKSg/PVtcXFxcc118JCl8bm90UHVuY3RTcGFjZShcXFxcKispKD8hXFxcXCopKD89cHVuY3RTcGFjZXwkKXwoPyFcXFxcKilwdW5jdFNwYWNlKFxcXFwqKykoPz1ub3RQdW5jdFNwYWNlKXxbXFxcXHNdKFxcXFwqKykoPyFcXFxcKikoPz1wdW5jdCl8KD8hXFxcXCopcHVuY3QoXFxcXCorKSg/IVxcXFwqKSg/PXB1bmN0KXxub3RQdW5jdFNwYWNlKFxcXFwqKykoPz1ub3RQdW5jdFNwYWNlKVwiLERlPWsocGUsXCJndVwiKS5yZXBsYWNlKC9ub3RQdW5jdFNwYWNlL2csYWUpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxLKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksSGU9ayhwZSxcImd1XCIpLnJlcGxhY2UoL25vdFB1bmN0U3BhY2UvZyxFZSkucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEllKS5yZXBsYWNlKC9wdW5jdC9nLGxlKS5nZXRSZWdleCgpLFplPWsoXCJeW15fKl0qP1xcXFwqXFxcXCpbXl8qXSo/X1teXypdKj8oPz1cXFxcKlxcXFwqKXxbXl9dKyg/PVteX10pfCg/IV8pcHVuY3QoXyspKD89W1xcXFxzXXwkKXxub3RQdW5jdFNwYWNlKF8rKSg/IV8pKD89cHVuY3RTcGFjZXwkKXwoPyFfKXB1bmN0U3BhY2UoXyspKD89bm90UHVuY3RTcGFjZSl8W1xcXFxzXShfKykoPyFfKSg/PXB1bmN0KXwoPyFfKXB1bmN0KF8rKSg/IV8pKD89cHVuY3QpXCIsXCJndVwiKS5yZXBsYWNlKC9ub3RQdW5jdFNwYWNlL2csYWUpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxLKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksR2U9aygvXFxcXChwdW5jdCkvLFwiZ3VcIikucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLE5lPWsoL148KHNjaGVtZTpbXlxcc1xceDAwLVxceDFmPD5dKnxlbWFpbCk+LykucmVwbGFjZShcInNjaGVtZVwiLC9bYS16QS1aXVthLXpBLVowLTkrLi1dezEsMzF9LykucmVwbGFjZShcImVtYWlsXCIsL1thLXpBLVowLTkuISMkJSYnKisvPT9eX2B7fH1+LV0rKEApW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSsoPyFbLV9dKS8pLmdldFJlZ2V4KCksUWU9ayhqKS5yZXBsYWNlKFwiKD86LS0+fCQpXCIsXCItLT5cIikuZ2V0UmVnZXgoKSxGZT1rKFwiXmNvbW1lbnR8XjwvW2EtekEtWl1bXFxcXHc6LV0qXFxcXHMqPnxePFthLXpBLVpdW1xcXFx3LV0qKD86YXR0cmlidXRlKSo/XFxcXHMqLz8+fF48XFxcXD9bXFxcXHNcXFxcU10qP1xcXFw/PnxePCFbYS16QS1aXStcXFxcc1tcXFxcc1xcXFxTXSo/PnxePCFcXFxcW0NEQVRBXFxcXFtbXFxcXHNcXFxcU10qP1xcXFxdXFxcXF0+XCIpLnJlcGxhY2UoXCJjb21tZW50XCIsUWUpLnJlcGxhY2UoXCJhdHRyaWJ1dGVcIiwvXFxzK1thLXpBLVo6X11bXFx3LjotXSooPzpcXHMqPVxccypcIlteXCJdKlwifFxccyo9XFxzKidbXiddKid8XFxzKj1cXHMqW15cXHNcIic9PD5gXSspPy8pLmdldFJlZ2V4KCkscT0vKD86XFxbKD86XFxcXFtcXHNcXFNdfFteXFxbXFxdXFxcXF0pKlxcXXxcXFxcW1xcc1xcU118YCtbXmBdKj9gKyg/IWApfFteXFxbXFxdXFxcXGBdKSo/LyxqZT1rKC9eIT9cXFsobGFiZWwpXFxdXFwoXFxzKihocmVmKSg/Oig/OlsgXFx0XSooPzpcXG5bIFxcdF0qKT8pKHRpdGxlKSk/XFxzKlxcKS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLnJlcGxhY2UoXCJocmVmXCIsLzwoPzpcXFxcLnxbXlxcbjw+XFxcXF0pKz58W14gXFx0XFxuXFx4MDAtXFx4MWZdKi8pLnJlcGxhY2UoXCJ0aXRsZVwiLC9cIig/OlxcXFxcIj98W15cIlxcXFxdKSpcInwnKD86XFxcXCc/fFteJ1xcXFxdKSonfFxcKCg/OlxcXFxcXCk/fFteKVxcXFxdKSpcXCkvKS5nZXRSZWdleCgpLGNlPWsoL14hP1xcWyhsYWJlbClcXF1cXFsocmVmKVxcXS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLnJlcGxhY2UoXCJyZWZcIixGKS5nZXRSZWdleCgpLGhlPWsoL14hP1xcWyhyZWYpXFxdKD86XFxbXFxdKT8vKS5yZXBsYWNlKFwicmVmXCIsRikuZ2V0UmVnZXgoKSxVZT1rKFwicmVmbGlua3xub2xpbmsoPyFcXFxcKClcIixcImdcIikucmVwbGFjZShcInJlZmxpbmtcIixjZSkucmVwbGFjZShcIm5vbGlua1wiLGhlKS5nZXRSZWdleCgpLG5lPS9baEhdW3RUXVt0VF1bcFBdW3NTXT98W2ZGXVt0VF1bcFBdLyxXPXtfYmFja3BlZGFsOkMsYW55UHVuY3R1YXRpb246R2UsYXV0b2xpbms6TmUsYmxvY2tTa2lwOkJlLGJyOm9lLGNvZGU6emUsZGVsOkMsZW1TdHJvbmdMRGVsaW06cWUsZW1TdHJvbmdSRGVsaW1Bc3Q6RGUsZW1TdHJvbmdSRGVsaW1VbmQ6WmUsZXNjYXBlOk1lLGxpbms6amUsbm9saW5rOmhlLHB1bmN0dWF0aW9uOkNlLHJlZmxpbms6Y2UscmVmbGlua1NlYXJjaDpVZSx0YWc6RmUsdGV4dDpBZSx1cmw6Q30sS2U9ey4uLlcsbGluazprKC9eIT9cXFsobGFiZWwpXFxdXFwoKC4qPylcXCkvKS5yZXBsYWNlKFwibGFiZWxcIixxKS5nZXRSZWdleCgpLHJlZmxpbms6aygvXiE/XFxbKGxhYmVsKVxcXVxccypcXFsoW15cXF1dKilcXF0vKS5yZXBsYWNlKFwibGFiZWxcIixxKS5nZXRSZWdleCgpfSxHPXsuLi5XLGVtU3Ryb25nUkRlbGltQXN0OkhlLGVtU3Ryb25nTERlbGltOnZlLHVybDprKC9eKCg/OnByb3RvY29sKTpcXC9cXC98d3d3XFwuKSg/OlthLXpBLVowLTlcXC1dK1xcLj8pK1teXFxzPF0qfF5lbWFpbC8pLnJlcGxhY2UoXCJwcm90b2NvbFwiLG5lKS5yZXBsYWNlKFwiZW1haWxcIiwvW0EtWmEtejAtOS5fKy1dKyhAKVthLXpBLVowLTktX10rKD86XFwuW2EtekEtWjAtOS1fXSpbYS16QS1aMC05XSkrKD8hWy1fXSkvKS5nZXRSZWdleCgpLF9iYWNrcGVkYWw6Lyg/OltePyEuLDo7Kl8nXCJ+KCkmXSt8XFwoW14pXSpcXCl8Jig/IVthLXpBLVowLTldKzskKXxbPyEuLDo7Kl8nXCJ+KV0rKD8hJCkpKy8sZGVsOi9eKH5+PykoPz1bXlxcc35dKSgoPzpcXFxcW1xcc1xcU118W15cXFxcXSkqPyg/OlxcXFxbXFxzXFxTXXxbXlxcc35cXFxcXSkpXFwxKD89W15+XXwkKS8sdGV4dDprKC9eKFtgfl0rfFteYH5dKSg/Oig/PSB7Mix9XFxuKXwoPz1bYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dK0ApfFtcXHNcXFNdKj8oPzooPz1bXFxcXDwhXFxbYCp+X118XFxiX3xwcm90b2NvbDpcXC9cXC98d3d3XFwufCQpfFteIF0oPz0gezIsfVxcbil8W15hLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0oPz1bYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dK0ApKSkvKS5yZXBsYWNlKFwicHJvdG9jb2xcIixuZSkuZ2V0UmVnZXgoKX0sV2U9ey4uLkcsYnI6ayhvZSkucmVwbGFjZShcInsyLH1cIixcIipcIikuZ2V0UmVnZXgoKSx0ZXh0OmsoRy50ZXh0KS5yZXBsYWNlKFwiXFxcXGJfXCIsXCJcXFxcYl98IHsyLH1cXFxcblwiKS5yZXBsYWNlKC9cXHsyLFxcfS9nLFwiKlwiKS5nZXRSZWdleCgpfSxFPXtub3JtYWw6VSxnZm06X2UscGVkYW50aWM6TGV9LE09e25vcm1hbDpXLGdmbTpHLGJyZWFrczpXZSxwZWRhbnRpYzpLZX07dmFyIFhlPXtcIiZcIjpcIiZhbXA7XCIsXCI8XCI6XCImbHQ7XCIsXCI+XCI6XCImZ3Q7XCIsJ1wiJzpcIiZxdW90O1wiLFwiJ1wiOlwiJiMzOTtcIn0sa2U9dT0+WGVbdV07ZnVuY3Rpb24gdyh1LGUpe2lmKGUpe2lmKG0uZXNjYXBlVGVzdC50ZXN0KHUpKXJldHVybiB1LnJlcGxhY2UobS5lc2NhcGVSZXBsYWNlLGtlKX1lbHNlIGlmKG0uZXNjYXBlVGVzdE5vRW5jb2RlLnRlc3QodSkpcmV0dXJuIHUucmVwbGFjZShtLmVzY2FwZVJlcGxhY2VOb0VuY29kZSxrZSk7cmV0dXJuIHV9ZnVuY3Rpb24gWCh1KXt0cnl7dT1lbmNvZGVVUkkodSkucmVwbGFjZShtLnBlcmNlbnREZWNvZGUsXCIlXCIpfWNhdGNoe3JldHVybiBudWxsfXJldHVybiB1fWZ1bmN0aW9uIEoodSxlKXtsZXQgdD11LnJlcGxhY2UobS5maW5kUGlwZSwoaSxzLGEpPT57bGV0IG89ITEsbD1zO2Zvcig7LS1sPj0wJiZhW2xdPT09XCJcXFxcXCI7KW89IW87cmV0dXJuIG8/XCJ8XCI6XCIgfFwifSksbj10LnNwbGl0KG0uc3BsaXRQaXBlKSxyPTA7aWYoblswXS50cmltKCl8fG4uc2hpZnQoKSxuLmxlbmd0aD4wJiYhbi5hdCgtMSk/LnRyaW0oKSYmbi5wb3AoKSxlKWlmKG4ubGVuZ3RoPmUpbi5zcGxpY2UoZSk7ZWxzZSBmb3IoO24ubGVuZ3RoPGU7KW4ucHVzaChcIlwiKTtmb3IoO3I8bi5sZW5ndGg7cisrKW5bcl09bltyXS50cmltKCkucmVwbGFjZShtLnNsYXNoUGlwZSxcInxcIik7cmV0dXJuIG59ZnVuY3Rpb24geih1LGUsdCl7bGV0IG49dS5sZW5ndGg7aWYobj09PTApcmV0dXJuXCJcIjtsZXQgcj0wO2Zvcig7cjxuOyl7bGV0IGk9dS5jaGFyQXQobi1yLTEpO2lmKGk9PT1lJiYhdClyKys7ZWxzZSBpZihpIT09ZSYmdClyKys7ZWxzZSBicmVha31yZXR1cm4gdS5zbGljZSgwLG4tcil9ZnVuY3Rpb24gZGUodSxlKXtpZih1LmluZGV4T2YoZVsxXSk9PT0tMSlyZXR1cm4tMTtsZXQgdD0wO2ZvcihsZXQgbj0wO248dS5sZW5ndGg7bisrKWlmKHVbbl09PT1cIlxcXFxcIiluKys7ZWxzZSBpZih1W25dPT09ZVswXSl0Kys7ZWxzZSBpZih1W25dPT09ZVsxXSYmKHQtLSx0PDApKXJldHVybiBuO3JldHVybiB0PjA/LTI6LTF9ZnVuY3Rpb24gZ2UodSxlLHQsbixyKXtsZXQgaT1lLmhyZWYscz1lLnRpdGxlfHxudWxsLGE9dVsxXS5yZXBsYWNlKHIub3RoZXIub3V0cHV0TGlua1JlcGxhY2UsXCIkMVwiKTtuLnN0YXRlLmluTGluaz0hMDtsZXQgbz17dHlwZTp1WzBdLmNoYXJBdCgwKT09PVwiIVwiP1wiaW1hZ2VcIjpcImxpbmtcIixyYXc6dCxocmVmOmksdGl0bGU6cyx0ZXh0OmEsdG9rZW5zOm4uaW5saW5lVG9rZW5zKGEpfTtyZXR1cm4gbi5zdGF0ZS5pbkxpbms9ITEsb31mdW5jdGlvbiBKZSh1LGUsdCl7bGV0IG49dS5tYXRjaCh0Lm90aGVyLmluZGVudENvZGVDb21wZW5zYXRpb24pO2lmKG49PT1udWxsKXJldHVybiBlO2xldCByPW5bMV07cmV0dXJuIGUuc3BsaXQoYFxuYCkubWFwKGk9PntsZXQgcz1pLm1hdGNoKHQub3RoZXIuYmVnaW5uaW5nU3BhY2UpO2lmKHM9PT1udWxsKXJldHVybiBpO2xldFthXT1zO3JldHVybiBhLmxlbmd0aD49ci5sZW5ndGg/aS5zbGljZShyLmxlbmd0aCk6aX0pLmpvaW4oYFxuYCl9dmFyIHk9Y2xhc3N7b3B0aW9ucztydWxlcztsZXhlcjtjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VH1zcGFjZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLm5ld2xpbmUuZXhlYyhlKTtpZih0JiZ0WzBdLmxlbmd0aD4wKXJldHVybnt0eXBlOlwic3BhY2VcIixyYXc6dFswXX19Y29kZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmNvZGUuZXhlYyhlKTtpZih0KXtsZXQgbj10WzBdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5jb2RlUmVtb3ZlSW5kZW50LFwiXCIpO3JldHVybnt0eXBlOlwiY29kZVwiLHJhdzp0WzBdLGNvZGVCbG9ja1N0eWxlOlwiaW5kZW50ZWRcIix0ZXh0OnRoaXMub3B0aW9ucy5wZWRhbnRpYz9uOnoobixgXG5gKX19fWZlbmNlcyhlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmZlbmNlcy5leGVjKGUpO2lmKHQpe2xldCBuPXRbMF0scj1KZShuLHRbM118fFwiXCIsdGhpcy5ydWxlcyk7cmV0dXJue3R5cGU6XCJjb2RlXCIscmF3Om4sbGFuZzp0WzJdP3RbMl0udHJpbSgpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKTp0WzJdLHRleHQ6cn19fWhlYWRpbmcoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5oZWFkaW5nLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsyXS50cmltKCk7aWYodGhpcy5ydWxlcy5vdGhlci5lbmRpbmdIYXNoLnRlc3Qobikpe2xldCByPXoobixcIiNcIik7KHRoaXMub3B0aW9ucy5wZWRhbnRpY3x8IXJ8fHRoaXMucnVsZXMub3RoZXIuZW5kaW5nU3BhY2VDaGFyLnRlc3QocikpJiYobj1yLnRyaW0oKSl9cmV0dXJue3R5cGU6XCJoZWFkaW5nXCIscmF3OnRbMF0sZGVwdGg6dFsxXS5sZW5ndGgsdGV4dDpuLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShuKX19fWhyKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suaHIuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiaHJcIixyYXc6eih0WzBdLGBcbmApfX1ibG9ja3F1b3RlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suYmxvY2txdW90ZS5leGVjKGUpO2lmKHQpe2xldCBuPXoodFswXSxgXG5gKS5zcGxpdChgXG5gKSxyPVwiXCIsaT1cIlwiLHM9W107Zm9yKDtuLmxlbmd0aD4wOyl7bGV0IGE9ITEsbz1bXSxsO2ZvcihsPTA7bDxuLmxlbmd0aDtsKyspaWYodGhpcy5ydWxlcy5vdGhlci5ibG9ja3F1b3RlU3RhcnQudGVzdChuW2xdKSlvLnB1c2gobltsXSksYT0hMDtlbHNlIGlmKCFhKW8ucHVzaChuW2xdKTtlbHNlIGJyZWFrO249bi5zbGljZShsKTtsZXQgcD1vLmpvaW4oYFxuYCksYz1wLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5ibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZSxgXG4gICAgJDFgKS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuYmxvY2txdW90ZVNldGV4dFJlcGxhY2UyLFwiXCIpO3I9cj9gJHtyfVxuJHtwfWA6cCxpPWk/YCR7aX1cbiR7Y31gOmM7bGV0IGc9dGhpcy5sZXhlci5zdGF0ZS50b3A7aWYodGhpcy5sZXhlci5zdGF0ZS50b3A9ITAsdGhpcy5sZXhlci5ibG9ja1Rva2VucyhjLHMsITApLHRoaXMubGV4ZXIuc3RhdGUudG9wPWcsbi5sZW5ndGg9PT0wKWJyZWFrO2xldCBoPXMuYXQoLTEpO2lmKGg/LnR5cGU9PT1cImNvZGVcIilicmVhaztpZihoPy50eXBlPT09XCJibG9ja3F1b3RlXCIpe2xldCBSPWgsZj1SLnJhdytgXG5gK24uam9pbihgXG5gKSxPPXRoaXMuYmxvY2txdW90ZShmKTtzW3MubGVuZ3RoLTFdPU8scj1yLnN1YnN0cmluZygwLHIubGVuZ3RoLVIucmF3Lmxlbmd0aCkrTy5yYXcsaT1pLnN1YnN0cmluZygwLGkubGVuZ3RoLVIudGV4dC5sZW5ndGgpK08udGV4dDticmVha31lbHNlIGlmKGg/LnR5cGU9PT1cImxpc3RcIil7bGV0IFI9aCxmPVIucmF3K2BcbmArbi5qb2luKGBcbmApLE89dGhpcy5saXN0KGYpO3Nbcy5sZW5ndGgtMV09TyxyPXIuc3Vic3RyaW5nKDAsci5sZW5ndGgtaC5yYXcubGVuZ3RoKStPLnJhdyxpPWkuc3Vic3RyaW5nKDAsaS5sZW5ndGgtUi5yYXcubGVuZ3RoKStPLnJhdyxuPWYuc3Vic3RyaW5nKHMuYXQoLTEpLnJhdy5sZW5ndGgpLnNwbGl0KGBcbmApO2NvbnRpbnVlfX1yZXR1cm57dHlwZTpcImJsb2NrcXVvdGVcIixyYXc6cix0b2tlbnM6cyx0ZXh0Oml9fX1saXN0KGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2subGlzdC5leGVjKGUpO2lmKHQpe2xldCBuPXRbMV0udHJpbSgpLHI9bi5sZW5ndGg+MSxpPXt0eXBlOlwibGlzdFwiLHJhdzpcIlwiLG9yZGVyZWQ6cixzdGFydDpyPytuLnNsaWNlKDAsLTEpOlwiXCIsbG9vc2U6ITEsaXRlbXM6W119O249cj9gXFxcXGR7MSw5fVxcXFwke24uc2xpY2UoLTEpfWA6YFxcXFwke259YCx0aGlzLm9wdGlvbnMucGVkYW50aWMmJihuPXI/bjpcIlsqKy1dXCIpO2xldCBzPXRoaXMucnVsZXMub3RoZXIubGlzdEl0ZW1SZWdleChuKSxhPSExO2Zvcig7ZTspe2xldCBsPSExLHA9XCJcIixjPVwiXCI7aWYoISh0PXMuZXhlYyhlKSl8fHRoaXMucnVsZXMuYmxvY2suaHIudGVzdChlKSlicmVhaztwPXRbMF0sZT1lLnN1YnN0cmluZyhwLmxlbmd0aCk7bGV0IGc9dFsyXS5zcGxpdChgXG5gLDEpWzBdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhYnMsTz0+XCIgXCIucmVwZWF0KDMqTy5sZW5ndGgpKSxoPWUuc3BsaXQoYFxuYCwxKVswXSxSPSFnLnRyaW0oKSxmPTA7aWYodGhpcy5vcHRpb25zLnBlZGFudGljPyhmPTIsYz1nLnRyaW1TdGFydCgpKTpSP2Y9dFsxXS5sZW5ndGgrMTooZj10WzJdLnNlYXJjaCh0aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhciksZj1mPjQ/MTpmLGM9Zy5zbGljZShmKSxmKz10WzFdLmxlbmd0aCksUiYmdGhpcy5ydWxlcy5vdGhlci5ibGFua0xpbmUudGVzdChoKSYmKHArPWgrYFxuYCxlPWUuc3Vic3RyaW5nKGgubGVuZ3RoKzEpLGw9ITApLCFsKXtsZXQgTz10aGlzLnJ1bGVzLm90aGVyLm5leHRCdWxsZXRSZWdleChmKSxWPXRoaXMucnVsZXMub3RoZXIuaHJSZWdleChmKSxZPXRoaXMucnVsZXMub3RoZXIuZmVuY2VzQmVnaW5SZWdleChmKSxlZT10aGlzLnJ1bGVzLm90aGVyLmhlYWRpbmdCZWdpblJlZ2V4KGYpLGZlPXRoaXMucnVsZXMub3RoZXIuaHRtbEJlZ2luUmVnZXgoZik7Zm9yKDtlOyl7bGV0IEg9ZS5zcGxpdChgXG5gLDEpWzBdLEE7aWYoaD1ILHRoaXMub3B0aW9ucy5wZWRhbnRpYz8oaD1oLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZU5lc3RpbmcsXCIgIFwiKSxBPWgpOkE9aC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFiQ2hhckdsb2JhbCxcIiAgICBcIiksWS50ZXN0KGgpfHxlZS50ZXN0KGgpfHxmZS50ZXN0KGgpfHxPLnRlc3QoaCl8fFYudGVzdChoKSlicmVhaztpZihBLnNlYXJjaCh0aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhcik+PWZ8fCFoLnRyaW0oKSljKz1gXG5gK0Euc2xpY2UoZik7ZWxzZXtpZihSfHxnLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJDaGFyR2xvYmFsLFwiICAgIFwiKS5zZWFyY2godGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIpPj00fHxZLnRlc3QoZyl8fGVlLnRlc3QoZyl8fFYudGVzdChnKSlicmVhaztjKz1gXG5gK2h9IVImJiFoLnRyaW0oKSYmKFI9ITApLHArPUgrYFxuYCxlPWUuc3Vic3RyaW5nKEgubGVuZ3RoKzEpLGc9QS5zbGljZShmKX19aS5sb29zZXx8KGE/aS5sb29zZT0hMDp0aGlzLnJ1bGVzLm90aGVyLmRvdWJsZUJsYW5rTGluZS50ZXN0KHApJiYoYT0hMCkpLGkuaXRlbXMucHVzaCh7dHlwZTpcImxpc3RfaXRlbVwiLHJhdzpwLHRhc2s6ISF0aGlzLm9wdGlvbnMuZ2ZtJiZ0aGlzLnJ1bGVzLm90aGVyLmxpc3RJc1Rhc2sudGVzdChjKSxsb29zZTohMSx0ZXh0OmMsdG9rZW5zOltdfSksaS5yYXcrPXB9bGV0IG89aS5pdGVtcy5hdCgtMSk7aWYobylvLnJhdz1vLnJhdy50cmltRW5kKCksby50ZXh0PW8udGV4dC50cmltRW5kKCk7ZWxzZSByZXR1cm47aS5yYXc9aS5yYXcudHJpbUVuZCgpO2ZvcihsZXQgbCBvZiBpLml0ZW1zKXtpZih0aGlzLmxleGVyLnN0YXRlLnRvcD0hMSxsLnRva2Vucz10aGlzLmxleGVyLmJsb2NrVG9rZW5zKGwudGV4dCxbXSksbC50YXNrKXtpZihsLnRleHQ9bC50ZXh0LnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIiksbC50b2tlbnNbMF0/LnR5cGU9PT1cInRleHRcInx8bC50b2tlbnNbMF0/LnR5cGU9PT1cInBhcmFncmFwaFwiKXtsLnRva2Vuc1swXS5yYXc9bC50b2tlbnNbMF0ucmF3LnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIiksbC50b2tlbnNbMF0udGV4dD1sLnRva2Vuc1swXS50ZXh0LnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIik7Zm9yKGxldCBjPXRoaXMubGV4ZXIuaW5saW5lUXVldWUubGVuZ3RoLTE7Yz49MDtjLS0paWYodGhpcy5ydWxlcy5vdGhlci5saXN0SXNUYXNrLnRlc3QodGhpcy5sZXhlci5pbmxpbmVRdWV1ZVtjXS5zcmMpKXt0aGlzLmxleGVyLmlubGluZVF1ZXVlW2NdLnNyYz10aGlzLmxleGVyLmlubGluZVF1ZXVlW2NdLnNyYy5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpO2JyZWFrfX1sZXQgcD10aGlzLnJ1bGVzLm90aGVyLmxpc3RUYXNrQ2hlY2tib3guZXhlYyhsLnJhdyk7aWYocCl7bGV0IGM9e3R5cGU6XCJjaGVja2JveFwiLHJhdzpwWzBdK1wiIFwiLGNoZWNrZWQ6cFswXSE9PVwiWyBdXCJ9O2wuY2hlY2tlZD1jLmNoZWNrZWQsaS5sb29zZT9sLnRva2Vuc1swXSYmW1wicGFyYWdyYXBoXCIsXCJ0ZXh0XCJdLmluY2x1ZGVzKGwudG9rZW5zWzBdLnR5cGUpJiZcInRva2Vuc1wiaW4gbC50b2tlbnNbMF0mJmwudG9rZW5zWzBdLnRva2Vucz8obC50b2tlbnNbMF0ucmF3PWMucmF3K2wudG9rZW5zWzBdLnJhdyxsLnRva2Vuc1swXS50ZXh0PWMucmF3K2wudG9rZW5zWzBdLnRleHQsbC50b2tlbnNbMF0udG9rZW5zLnVuc2hpZnQoYykpOmwudG9rZW5zLnVuc2hpZnQoe3R5cGU6XCJwYXJhZ3JhcGhcIixyYXc6Yy5yYXcsdGV4dDpjLnJhdyx0b2tlbnM6W2NdfSk6bC50b2tlbnMudW5zaGlmdChjKX19aWYoIWkubG9vc2Upe2xldCBwPWwudG9rZW5zLmZpbHRlcihnPT5nLnR5cGU9PT1cInNwYWNlXCIpLGM9cC5sZW5ndGg+MCYmcC5zb21lKGc9PnRoaXMucnVsZXMub3RoZXIuYW55TGluZS50ZXN0KGcucmF3KSk7aS5sb29zZT1jfX1pZihpLmxvb3NlKWZvcihsZXQgbCBvZiBpLml0ZW1zKXtsLmxvb3NlPSEwO2ZvcihsZXQgcCBvZiBsLnRva2VucylwLnR5cGU9PT1cInRleHRcIiYmKHAudHlwZT1cInBhcmFncmFwaFwiKX1yZXR1cm4gaX19aHRtbChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmh0bWwuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiaHRtbFwiLGJsb2NrOiEwLHJhdzp0WzBdLHByZTp0WzFdPT09XCJwcmVcInx8dFsxXT09PVwic2NyaXB0XCJ8fHRbMV09PT1cInN0eWxlXCIsdGV4dDp0WzBdfX1kZWYoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5kZWYuZXhlYyhlKTtpZih0KXtsZXQgbj10WzFdLnRvTG93ZXJDYXNlKCkucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLm11bHRpcGxlU3BhY2VHbG9iYWwsXCIgXCIpLHI9dFsyXT90WzJdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5ocmVmQnJhY2tldHMsXCIkMVwiKS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIik6XCJcIixpPXRbM10/dFszXS5zdWJzdHJpbmcoMSx0WzNdLmxlbmd0aC0xKS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIik6dFszXTtyZXR1cm57dHlwZTpcImRlZlwiLHRhZzpuLHJhdzp0WzBdLGhyZWY6cix0aXRsZTppfX19dGFibGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay50YWJsZS5leGVjKGUpO2lmKCF0fHwhdGhpcy5ydWxlcy5vdGhlci50YWJsZURlbGltaXRlci50ZXN0KHRbMl0pKXJldHVybjtsZXQgbj1KKHRbMV0pLHI9dFsyXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnbkNoYXJzLFwiXCIpLnNwbGl0KFwifFwiKSxpPXRbM10/LnRyaW0oKT90WzNdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJsZVJvd0JsYW5rTGluZSxcIlwiKS5zcGxpdChgXG5gKTpbXSxzPXt0eXBlOlwidGFibGVcIixyYXc6dFswXSxoZWFkZXI6W10sYWxpZ246W10scm93czpbXX07aWYobi5sZW5ndGg9PT1yLmxlbmd0aCl7Zm9yKGxldCBhIG9mIHIpdGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduUmlnaHQudGVzdChhKT9zLmFsaWduLnB1c2goXCJyaWdodFwiKTp0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25DZW50ZXIudGVzdChhKT9zLmFsaWduLnB1c2goXCJjZW50ZXJcIik6dGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduTGVmdC50ZXN0KGEpP3MuYWxpZ24ucHVzaChcImxlZnRcIik6cy5hbGlnbi5wdXNoKG51bGwpO2ZvcihsZXQgYT0wO2E8bi5sZW5ndGg7YSsrKXMuaGVhZGVyLnB1c2goe3RleHQ6blthXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUoblthXSksaGVhZGVyOiEwLGFsaWduOnMuYWxpZ25bYV19KTtmb3IobGV0IGEgb2YgaSlzLnJvd3MucHVzaChKKGEscy5oZWFkZXIubGVuZ3RoKS5tYXAoKG8sbCk9Pih7dGV4dDpvLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShvKSxoZWFkZXI6ITEsYWxpZ246cy5hbGlnbltsXX0pKSk7cmV0dXJuIHN9fWxoZWFkaW5nKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2subGhlYWRpbmcuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiaGVhZGluZ1wiLHJhdzp0WzBdLGRlcHRoOnRbMl0uY2hhckF0KDApPT09XCI9XCI/MToyLHRleHQ6dFsxXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUodFsxXSl9fXBhcmFncmFwaChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLnBhcmFncmFwaC5leGVjKGUpO2lmKHQpe2xldCBuPXRbMV0uY2hhckF0KHRbMV0ubGVuZ3RoLTEpPT09YFxuYD90WzFdLnNsaWNlKDAsLTEpOnRbMV07cmV0dXJue3R5cGU6XCJwYXJhZ3JhcGhcIixyYXc6dFswXSx0ZXh0Om4sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG4pfX19dGV4dChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLnRleHQuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwidGV4dFwiLHJhdzp0WzBdLHRleHQ6dFswXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUodFswXSl9fWVzY2FwZShlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5lc2NhcGUuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiZXNjYXBlXCIscmF3OnRbMF0sdGV4dDp0WzFdfX10YWcoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUudGFnLmV4ZWMoZSk7aWYodClyZXR1cm4hdGhpcy5sZXhlci5zdGF0ZS5pbkxpbmsmJnRoaXMucnVsZXMub3RoZXIuc3RhcnRBVGFnLnRlc3QodFswXSk/dGhpcy5sZXhlci5zdGF0ZS5pbkxpbms9ITA6dGhpcy5sZXhlci5zdGF0ZS5pbkxpbmsmJnRoaXMucnVsZXMub3RoZXIuZW5kQVRhZy50ZXN0KHRbMF0pJiYodGhpcy5sZXhlci5zdGF0ZS5pbkxpbms9ITEpLCF0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2smJnRoaXMucnVsZXMub3RoZXIuc3RhcnRQcmVTY3JpcHRUYWcudGVzdCh0WzBdKT90aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2s9ITA6dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrJiZ0aGlzLnJ1bGVzLm90aGVyLmVuZFByZVNjcmlwdFRhZy50ZXN0KHRbMF0pJiYodGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrPSExKSx7dHlwZTpcImh0bWxcIixyYXc6dFswXSxpbkxpbms6dGhpcy5sZXhlci5zdGF0ZS5pbkxpbmssaW5SYXdCbG9jazp0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2ssYmxvY2s6ITEsdGV4dDp0WzBdfX1saW5rKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmxpbmsuZXhlYyhlKTtpZih0KXtsZXQgbj10WzJdLnRyaW0oKTtpZighdGhpcy5vcHRpb25zLnBlZGFudGljJiZ0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0QW5nbGVCcmFja2V0LnRlc3Qobikpe2lmKCF0aGlzLnJ1bGVzLm90aGVyLmVuZEFuZ2xlQnJhY2tldC50ZXN0KG4pKXJldHVybjtsZXQgcz16KG4uc2xpY2UoMCwtMSksXCJcXFxcXCIpO2lmKChuLmxlbmd0aC1zLmxlbmd0aCklMj09PTApcmV0dXJufWVsc2V7bGV0IHM9ZGUodFsyXSxcIigpXCIpO2lmKHM9PT0tMilyZXR1cm47aWYocz4tMSl7bGV0IG89KHRbMF0uaW5kZXhPZihcIiFcIik9PT0wPzU6NCkrdFsxXS5sZW5ndGgrczt0WzJdPXRbMl0uc3Vic3RyaW5nKDAscyksdFswXT10WzBdLnN1YnN0cmluZygwLG8pLnRyaW0oKSx0WzNdPVwiXCJ9fWxldCByPXRbMl0saT1cIlwiO2lmKHRoaXMub3B0aW9ucy5wZWRhbnRpYyl7bGV0IHM9dGhpcy5ydWxlcy5vdGhlci5wZWRhbnRpY0hyZWZUaXRsZS5leGVjKHIpO3MmJihyPXNbMV0saT1zWzNdKX1lbHNlIGk9dFszXT90WzNdLnNsaWNlKDEsLTEpOlwiXCI7cmV0dXJuIHI9ci50cmltKCksdGhpcy5ydWxlcy5vdGhlci5zdGFydEFuZ2xlQnJhY2tldC50ZXN0KHIpJiYodGhpcy5vcHRpb25zLnBlZGFudGljJiYhdGhpcy5ydWxlcy5vdGhlci5lbmRBbmdsZUJyYWNrZXQudGVzdChuKT9yPXIuc2xpY2UoMSk6cj1yLnNsaWNlKDEsLTEpKSxnZSh0LHtocmVmOnImJnIucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpLHRpdGxlOmkmJmkucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpfSx0WzBdLHRoaXMubGV4ZXIsdGhpcy5ydWxlcyl9fXJlZmxpbmsoZSx0KXtsZXQgbjtpZigobj10aGlzLnJ1bGVzLmlubGluZS5yZWZsaW5rLmV4ZWMoZSkpfHwobj10aGlzLnJ1bGVzLmlubGluZS5ub2xpbmsuZXhlYyhlKSkpe2xldCByPShuWzJdfHxuWzFdKS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubXVsdGlwbGVTcGFjZUdsb2JhbCxcIiBcIiksaT10W3IudG9Mb3dlckNhc2UoKV07aWYoIWkpe2xldCBzPW5bMF0uY2hhckF0KDApO3JldHVybnt0eXBlOlwidGV4dFwiLHJhdzpzLHRleHQ6c319cmV0dXJuIGdlKG4saSxuWzBdLHRoaXMubGV4ZXIsdGhpcy5ydWxlcyl9fWVtU3Ryb25nKGUsdCxuPVwiXCIpe2xldCByPXRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nTERlbGltLmV4ZWMoZSk7aWYoIXJ8fHJbM10mJm4ubWF0Y2godGhpcy5ydWxlcy5vdGhlci51bmljb2RlQWxwaGFOdW1lcmljKSlyZXR1cm47aWYoIShyWzFdfHxyWzJdfHxcIlwiKXx8IW58fHRoaXMucnVsZXMuaW5saW5lLnB1bmN0dWF0aW9uLmV4ZWMobikpe2xldCBzPVsuLi5yWzBdXS5sZW5ndGgtMSxhLG8sbD1zLHA9MCxjPXJbMF1bMF09PT1cIipcIj90aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZ1JEZWxpbUFzdDp0aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZ1JEZWxpbVVuZDtmb3IoYy5sYXN0SW5kZXg9MCx0PXQuc2xpY2UoLTEqZS5sZW5ndGgrcyk7KHI9Yy5leGVjKHQpKSE9bnVsbDspe2lmKGE9clsxXXx8clsyXXx8clszXXx8cls0XXx8cls1XXx8cls2XSwhYSljb250aW51ZTtpZihvPVsuLi5hXS5sZW5ndGgsclszXXx8cls0XSl7bCs9bztjb250aW51ZX1lbHNlIGlmKChyWzVdfHxyWzZdKSYmcyUzJiYhKChzK28pJTMpKXtwKz1vO2NvbnRpbnVlfWlmKGwtPW8sbD4wKWNvbnRpbnVlO289TWF0aC5taW4obyxvK2wrcCk7bGV0IGc9Wy4uLnJbMF1dWzBdLmxlbmd0aCxoPWUuc2xpY2UoMCxzK3IuaW5kZXgrZytvKTtpZihNYXRoLm1pbihzLG8pJTIpe2xldCBmPWguc2xpY2UoMSwtMSk7cmV0dXJue3R5cGU6XCJlbVwiLHJhdzpoLHRleHQ6Zix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmVUb2tlbnMoZil9fWxldCBSPWguc2xpY2UoMiwtMik7cmV0dXJue3R5cGU6XCJzdHJvbmdcIixyYXc6aCx0ZXh0OlIsdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKFIpfX19fWNvZGVzcGFuKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmNvZGUuZXhlYyhlKTtpZih0KXtsZXQgbj10WzJdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5uZXdMaW5lQ2hhckdsb2JhbCxcIiBcIikscj10aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhci50ZXN0KG4pLGk9dGhpcy5ydWxlcy5vdGhlci5zdGFydGluZ1NwYWNlQ2hhci50ZXN0KG4pJiZ0aGlzLnJ1bGVzLm90aGVyLmVuZGluZ1NwYWNlQ2hhci50ZXN0KG4pO3JldHVybiByJiZpJiYobj1uLnN1YnN0cmluZygxLG4ubGVuZ3RoLTEpKSx7dHlwZTpcImNvZGVzcGFuXCIscmF3OnRbMF0sdGV4dDpufX19YnIoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuYnIuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiYnJcIixyYXc6dFswXX19ZGVsKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmRlbC5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJkZWxcIixyYXc6dFswXSx0ZXh0OnRbMl0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKHRbMl0pfX1hdXRvbGluayhlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5hdXRvbGluay5leGVjKGUpO2lmKHQpe2xldCBuLHI7cmV0dXJuIHRbMl09PT1cIkBcIj8obj10WzFdLHI9XCJtYWlsdG86XCIrbik6KG49dFsxXSxyPW4pLHt0eXBlOlwibGlua1wiLHJhdzp0WzBdLHRleHQ6bixocmVmOnIsdG9rZW5zOlt7dHlwZTpcInRleHRcIixyYXc6bix0ZXh0Om59XX19fXVybChlKXtsZXQgdDtpZih0PXRoaXMucnVsZXMuaW5saW5lLnVybC5leGVjKGUpKXtsZXQgbixyO2lmKHRbMl09PT1cIkBcIiluPXRbMF0scj1cIm1haWx0bzpcIituO2Vsc2V7bGV0IGk7ZG8gaT10WzBdLHRbMF09dGhpcy5ydWxlcy5pbmxpbmUuX2JhY2twZWRhbC5leGVjKHRbMF0pPy5bMF0/P1wiXCI7d2hpbGUoaSE9PXRbMF0pO249dFswXSx0WzFdPT09XCJ3d3cuXCI/cj1cImh0dHA6Ly9cIit0WzBdOnI9dFswXX1yZXR1cm57dHlwZTpcImxpbmtcIixyYXc6dFswXSx0ZXh0Om4saHJlZjpyLHRva2Vuczpbe3R5cGU6XCJ0ZXh0XCIscmF3Om4sdGV4dDpufV19fX1pbmxpbmVUZXh0KGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLnRleHQuZXhlYyhlKTtpZih0KXtsZXQgbj10aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2s7cmV0dXJue3R5cGU6XCJ0ZXh0XCIscmF3OnRbMF0sdGV4dDp0WzBdLGVzY2FwZWQ6bn19fX07dmFyIHg9Y2xhc3MgdXt0b2tlbnM7b3B0aW9ucztzdGF0ZTtpbmxpbmVRdWV1ZTt0b2tlbml6ZXI7Y29uc3RydWN0b3IoZSl7dGhpcy50b2tlbnM9W10sdGhpcy50b2tlbnMubGlua3M9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLm9wdGlvbnM9ZXx8VCx0aGlzLm9wdGlvbnMudG9rZW5pemVyPXRoaXMub3B0aW9ucy50b2tlbml6ZXJ8fG5ldyB5LHRoaXMudG9rZW5pemVyPXRoaXMub3B0aW9ucy50b2tlbml6ZXIsdGhpcy50b2tlbml6ZXIub3B0aW9ucz10aGlzLm9wdGlvbnMsdGhpcy50b2tlbml6ZXIubGV4ZXI9dGhpcyx0aGlzLmlubGluZVF1ZXVlPVtdLHRoaXMuc3RhdGU9e2luTGluazohMSxpblJhd0Jsb2NrOiExLHRvcDohMH07bGV0IHQ9e290aGVyOm0sYmxvY2s6RS5ub3JtYWwsaW5saW5lOk0ubm9ybWFsfTt0aGlzLm9wdGlvbnMucGVkYW50aWM/KHQuYmxvY2s9RS5wZWRhbnRpYyx0LmlubGluZT1NLnBlZGFudGljKTp0aGlzLm9wdGlvbnMuZ2ZtJiYodC5ibG9jaz1FLmdmbSx0aGlzLm9wdGlvbnMuYnJlYWtzP3QuaW5saW5lPU0uYnJlYWtzOnQuaW5saW5lPU0uZ2ZtKSx0aGlzLnRva2VuaXplci5ydWxlcz10fXN0YXRpYyBnZXQgcnVsZXMoKXtyZXR1cm57YmxvY2s6RSxpbmxpbmU6TX19c3RhdGljIGxleChlLHQpe3JldHVybiBuZXcgdSh0KS5sZXgoZSl9c3RhdGljIGxleElubGluZShlLHQpe3JldHVybiBuZXcgdSh0KS5pbmxpbmVUb2tlbnMoZSl9bGV4KGUpe2U9ZS5yZXBsYWNlKG0uY2FycmlhZ2VSZXR1cm4sYFxuYCksdGhpcy5ibG9ja1Rva2VucyhlLHRoaXMudG9rZW5zKTtmb3IobGV0IHQ9MDt0PHRoaXMuaW5saW5lUXVldWUubGVuZ3RoO3QrKyl7bGV0IG49dGhpcy5pbmxpbmVRdWV1ZVt0XTt0aGlzLmlubGluZVRva2VucyhuLnNyYyxuLnRva2Vucyl9cmV0dXJuIHRoaXMuaW5saW5lUXVldWU9W10sdGhpcy50b2tlbnN9YmxvY2tUb2tlbnMoZSx0PVtdLG49ITEpe2Zvcih0aGlzLm9wdGlvbnMucGVkYW50aWMmJihlPWUucmVwbGFjZShtLnRhYkNoYXJHbG9iYWwsXCIgICAgXCIpLnJlcGxhY2UobS5zcGFjZUxpbmUsXCJcIikpO2U7KXtsZXQgcjtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uYmxvY2s/LnNvbWUocz0+KHI9cy5jYWxsKHtsZXhlcjp0aGlzfSxlLHQpKT8oZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKSwhMCk6ITEpKWNvbnRpbnVlO2lmKHI9dGhpcy50b2tlbml6ZXIuc3BhY2UoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtyLnJhdy5sZW5ndGg9PT0xJiZzIT09dm9pZCAwP3MucmF3Kz1gXG5gOnQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmNvZGUoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtzPy50eXBlPT09XCJwYXJhZ3JhcGhcInx8cz8udHlwZT09PVwidGV4dFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IudGV4dCx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5mZW5jZXMoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5oZWFkaW5nKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuaHIoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5ibG9ja3F1b3RlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIubGlzdChlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmh0bWwoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5kZWYoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtzPy50eXBlPT09XCJwYXJhZ3JhcGhcInx8cz8udHlwZT09PVwidGV4dFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IucmF3LHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnRoaXMudG9rZW5zLmxpbmtzW3IudGFnXXx8KHRoaXMudG9rZW5zLmxpbmtzW3IudGFnXT17aHJlZjpyLmhyZWYsdGl0bGU6ci50aXRsZX0sdC5wdXNoKHIpKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLnRhYmxlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIubGhlYWRpbmcoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9bGV0IGk9ZTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uc3RhcnRCbG9jayl7bGV0IHM9MS8wLGE9ZS5zbGljZSgxKSxvO3RoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0QmxvY2suZm9yRWFjaChsPT57bz1sLmNhbGwoe2xleGVyOnRoaXN9LGEpLHR5cGVvZiBvPT1cIm51bWJlclwiJiZvPj0wJiYocz1NYXRoLm1pbihzLG8pKX0pLHM8MS8wJiZzPj0wJiYoaT1lLnN1YnN0cmluZygwLHMrMSkpfWlmKHRoaXMuc3RhdGUudG9wJiYocj10aGlzLnRva2VuaXplci5wYXJhZ3JhcGgoaSkpKXtsZXQgcz10LmF0KC0xKTtuJiZzPy50eXBlPT09XCJwYXJhZ3JhcGhcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnRleHQsdGhpcy5pbmxpbmVRdWV1ZS5wb3AoKSx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0LnB1c2gociksbj1pLmxlbmd0aCE9PWUubGVuZ3RoLGU9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLnRleHQoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtzPy50eXBlPT09XCJ0ZXh0XCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci50ZXh0LHRoaXMuaW5saW5lUXVldWUucG9wKCksdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dC5wdXNoKHIpO2NvbnRpbnVlfWlmKGUpe2xldCBzPVwiSW5maW5pdGUgbG9vcCBvbiBieXRlOiBcIitlLmNoYXJDb2RlQXQoMCk7aWYodGhpcy5vcHRpb25zLnNpbGVudCl7Y29uc29sZS5lcnJvcihzKTticmVha31lbHNlIHRocm93IG5ldyBFcnJvcihzKX19cmV0dXJuIHRoaXMuc3RhdGUudG9wPSEwLHR9aW5saW5lKGUsdD1bXSl7cmV0dXJuIHRoaXMuaW5saW5lUXVldWUucHVzaCh7c3JjOmUsdG9rZW5zOnR9KSx0fWlubGluZVRva2VucyhlLHQ9W10pe2xldCBuPWUscj1udWxsO2lmKHRoaXMudG9rZW5zLmxpbmtzKXtsZXQgbz1PYmplY3Qua2V5cyh0aGlzLnRva2Vucy5saW5rcyk7aWYoby5sZW5ndGg+MClmb3IoOyhyPXRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5yZWZsaW5rU2VhcmNoLmV4ZWMobikpIT1udWxsOylvLmluY2x1ZGVzKHJbMF0uc2xpY2UoclswXS5sYXN0SW5kZXhPZihcIltcIikrMSwtMSkpJiYobj1uLnNsaWNlKDAsci5pbmRleCkrXCJbXCIrXCJhXCIucmVwZWF0KHJbMF0ubGVuZ3RoLTIpK1wiXVwiK24uc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLnJlZmxpbmtTZWFyY2gubGFzdEluZGV4KSl9Zm9yKDsocj10aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24uZXhlYyhuKSkhPW51bGw7KW49bi5zbGljZSgwLHIuaW5kZXgpK1wiKytcIituLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbi5sYXN0SW5kZXgpO2xldCBpO2Zvcig7KHI9dGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmJsb2NrU2tpcC5leGVjKG4pKSE9bnVsbDspaT1yWzJdP3JbMl0ubGVuZ3RoOjAsbj1uLnNsaWNlKDAsci5pbmRleCtpKStcIltcIitcImFcIi5yZXBlYXQoclswXS5sZW5ndGgtaS0yKStcIl1cIituLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5ibG9ja1NraXAubGFzdEluZGV4KTtuPXRoaXMub3B0aW9ucy5ob29rcz8uZW1TdHJvbmdNYXNrPy5jYWxsKHtsZXhlcjp0aGlzfSxuKT8/bjtsZXQgcz0hMSxhPVwiXCI7Zm9yKDtlOyl7c3x8KGE9XCJcIikscz0hMTtsZXQgbztpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uaW5saW5lPy5zb21lKHA9PihvPXAuY2FsbCh7bGV4ZXI6dGhpc30sZSx0KSk/KGU9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyksITApOiExKSljb250aW51ZTtpZihvPXRoaXMudG9rZW5pemVyLmVzY2FwZShlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLnRhZyhlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmxpbmsoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5yZWZsaW5rKGUsdGhpcy50b2tlbnMubGlua3MpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCk7bGV0IHA9dC5hdCgtMSk7by50eXBlPT09XCJ0ZXh0XCImJnA/LnR5cGU9PT1cInRleHRcIj8ocC5yYXcrPW8ucmF3LHAudGV4dCs9by50ZXh0KTp0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5lbVN0cm9uZyhlLG4sYSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5jb2Rlc3BhbihlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmJyKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuZGVsKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuYXV0b2xpbmsoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYoIXRoaXMuc3RhdGUuaW5MaW5rJiYobz10aGlzLnRva2VuaXplci51cmwoZSkpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWxldCBsPWU7aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnN0YXJ0SW5saW5lKXtsZXQgcD0xLzAsYz1lLnNsaWNlKDEpLGc7dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRJbmxpbmUuZm9yRWFjaChoPT57Zz1oLmNhbGwoe2xleGVyOnRoaXN9LGMpLHR5cGVvZiBnPT1cIm51bWJlclwiJiZnPj0wJiYocD1NYXRoLm1pbihwLGcpKX0pLHA8MS8wJiZwPj0wJiYobD1lLnN1YnN0cmluZygwLHArMSkpfWlmKG89dGhpcy50b2tlbml6ZXIuaW5saW5lVGV4dChsKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLG8ucmF3LnNsaWNlKC0xKSE9PVwiX1wiJiYoYT1vLnJhdy5zbGljZSgtMSkpLHM9ITA7bGV0IHA9dC5hdCgtMSk7cD8udHlwZT09PVwidGV4dFwiPyhwLnJhdys9by5yYXcscC50ZXh0Kz1vLnRleHQpOnQucHVzaChvKTtjb250aW51ZX1pZihlKXtsZXQgcD1cIkluZmluaXRlIGxvb3Agb24gYnl0ZTogXCIrZS5jaGFyQ29kZUF0KDApO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpe2NvbnNvbGUuZXJyb3IocCk7YnJlYWt9ZWxzZSB0aHJvdyBuZXcgRXJyb3IocCl9fXJldHVybiB0fX07dmFyIFA9Y2xhc3N7b3B0aW9ucztwYXJzZXI7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFR9c3BhY2UoZSl7cmV0dXJuXCJcIn1jb2RlKHt0ZXh0OmUsbGFuZzp0LGVzY2FwZWQ6bn0pe2xldCByPSh0fHxcIlwiKS5tYXRjaChtLm5vdFNwYWNlU3RhcnQpPy5bMF0saT1lLnJlcGxhY2UobS5lbmRpbmdOZXdsaW5lLFwiXCIpK2BcbmA7cmV0dXJuIHI/JzxwcmU+PGNvZGUgY2xhc3M9XCJsYW5ndWFnZS0nK3cocikrJ1wiPicrKG4/aTp3KGksITApKStgPC9jb2RlPjwvcHJlPlxuYDpcIjxwcmU+PGNvZGU+XCIrKG4/aTp3KGksITApKStgPC9jb2RlPjwvcHJlPlxuYH1ibG9ja3F1b3RlKHt0b2tlbnM6ZX0pe3JldHVybmA8YmxvY2txdW90ZT5cbiR7dGhpcy5wYXJzZXIucGFyc2UoZSl9PC9ibG9ja3F1b3RlPlxuYH1odG1sKHt0ZXh0OmV9KXtyZXR1cm4gZX1kZWYoZSl7cmV0dXJuXCJcIn1oZWFkaW5nKHt0b2tlbnM6ZSxkZXB0aDp0fSl7cmV0dXJuYDxoJHt0fT4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvaCR7dH0+XG5gfWhyKGUpe3JldHVybmA8aHI+XG5gfWxpc3QoZSl7bGV0IHQ9ZS5vcmRlcmVkLG49ZS5zdGFydCxyPVwiXCI7Zm9yKGxldCBhPTA7YTxlLml0ZW1zLmxlbmd0aDthKyspe2xldCBvPWUuaXRlbXNbYV07cis9dGhpcy5saXN0aXRlbShvKX1sZXQgaT10P1wib2xcIjpcInVsXCIscz10JiZuIT09MT8nIHN0YXJ0PVwiJytuKydcIic6XCJcIjtyZXR1cm5cIjxcIitpK3MrYD5cbmArcitcIjwvXCIraStgPlxuYH1saXN0aXRlbShlKXtyZXR1cm5gPGxpPiR7dGhpcy5wYXJzZXIucGFyc2UoZS50b2tlbnMpfTwvbGk+XG5gfWNoZWNrYm94KHtjaGVja2VkOmV9KXtyZXR1cm5cIjxpbnB1dCBcIisoZT8nY2hlY2tlZD1cIlwiICc6XCJcIikrJ2Rpc2FibGVkPVwiXCIgdHlwZT1cImNoZWNrYm94XCI+ICd9cGFyYWdyYXBoKHt0b2tlbnM6ZX0pe3JldHVybmA8cD4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvcD5cbmB9dGFibGUoZSl7bGV0IHQ9XCJcIixuPVwiXCI7Zm9yKGxldCBpPTA7aTxlLmhlYWRlci5sZW5ndGg7aSsrKW4rPXRoaXMudGFibGVjZWxsKGUuaGVhZGVyW2ldKTt0Kz10aGlzLnRhYmxlcm93KHt0ZXh0Om59KTtsZXQgcj1cIlwiO2ZvcihsZXQgaT0wO2k8ZS5yb3dzLmxlbmd0aDtpKyspe2xldCBzPWUucm93c1tpXTtuPVwiXCI7Zm9yKGxldCBhPTA7YTxzLmxlbmd0aDthKyspbis9dGhpcy50YWJsZWNlbGwoc1thXSk7cis9dGhpcy50YWJsZXJvdyh7dGV4dDpufSl9cmV0dXJuIHImJihyPWA8dGJvZHk+JHtyfTwvdGJvZHk+YCksYDx0YWJsZT5cbjx0aGVhZD5cbmArdCtgPC90aGVhZD5cbmArcitgPC90YWJsZT5cbmB9dGFibGVyb3coe3RleHQ6ZX0pe3JldHVybmA8dHI+XG4ke2V9PC90cj5cbmB9dGFibGVjZWxsKGUpe2xldCB0PXRoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUudG9rZW5zKSxuPWUuaGVhZGVyP1widGhcIjpcInRkXCI7cmV0dXJuKGUuYWxpZ24/YDwke259IGFsaWduPVwiJHtlLmFsaWdufVwiPmA6YDwke259PmApK3QrYDwvJHtufT5cbmB9c3Ryb25nKHt0b2tlbnM6ZX0pe3JldHVybmA8c3Ryb25nPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9zdHJvbmc+YH1lbSh7dG9rZW5zOmV9KXtyZXR1cm5gPGVtPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9lbT5gfWNvZGVzcGFuKHt0ZXh0OmV9KXtyZXR1cm5gPGNvZGU+JHt3KGUsITApfTwvY29kZT5gfWJyKGUpe3JldHVyblwiPGJyPlwifWRlbCh7dG9rZW5zOmV9KXtyZXR1cm5gPGRlbD4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvZGVsPmB9bGluayh7aHJlZjplLHRpdGxlOnQsdG9rZW5zOm59KXtsZXQgcj10aGlzLnBhcnNlci5wYXJzZUlubGluZShuKSxpPVgoZSk7aWYoaT09PW51bGwpcmV0dXJuIHI7ZT1pO2xldCBzPSc8YSBocmVmPVwiJytlKydcIic7cmV0dXJuIHQmJihzKz0nIHRpdGxlPVwiJyt3KHQpKydcIicpLHMrPVwiPlwiK3IrXCI8L2E+XCIsc31pbWFnZSh7aHJlZjplLHRpdGxlOnQsdGV4dDpuLHRva2VuczpyfSl7ciYmKG49dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUocix0aGlzLnBhcnNlci50ZXh0UmVuZGVyZXIpKTtsZXQgaT1YKGUpO2lmKGk9PT1udWxsKXJldHVybiB3KG4pO2U9aTtsZXQgcz1gPGltZyBzcmM9XCIke2V9XCIgYWx0PVwiJHtufVwiYDtyZXR1cm4gdCYmKHMrPWAgdGl0bGU9XCIke3codCl9XCJgKSxzKz1cIj5cIixzfXRleHQoZSl7cmV0dXJuXCJ0b2tlbnNcImluIGUmJmUudG9rZW5zP3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUudG9rZW5zKTpcImVzY2FwZWRcImluIGUmJmUuZXNjYXBlZD9lLnRleHQ6dyhlLnRleHQpfX07dmFyICQ9Y2xhc3N7c3Ryb25nKHt0ZXh0OmV9KXtyZXR1cm4gZX1lbSh7dGV4dDplfSl7cmV0dXJuIGV9Y29kZXNwYW4oe3RleHQ6ZX0pe3JldHVybiBlfWRlbCh7dGV4dDplfSl7cmV0dXJuIGV9aHRtbCh7dGV4dDplfSl7cmV0dXJuIGV9dGV4dCh7dGV4dDplfSl7cmV0dXJuIGV9bGluayh7dGV4dDplfSl7cmV0dXJuXCJcIitlfWltYWdlKHt0ZXh0OmV9KXtyZXR1cm5cIlwiK2V9YnIoKXtyZXR1cm5cIlwifWNoZWNrYm94KHtyYXc6ZX0pe3JldHVybiBlfX07dmFyIGI9Y2xhc3MgdXtvcHRpb25zO3JlbmRlcmVyO3RleHRSZW5kZXJlcjtjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VCx0aGlzLm9wdGlvbnMucmVuZGVyZXI9dGhpcy5vcHRpb25zLnJlbmRlcmVyfHxuZXcgUCx0aGlzLnJlbmRlcmVyPXRoaXMub3B0aW9ucy5yZW5kZXJlcix0aGlzLnJlbmRlcmVyLm9wdGlvbnM9dGhpcy5vcHRpb25zLHRoaXMucmVuZGVyZXIucGFyc2VyPXRoaXMsdGhpcy50ZXh0UmVuZGVyZXI9bmV3ICR9c3RhdGljIHBhcnNlKGUsdCl7cmV0dXJuIG5ldyB1KHQpLnBhcnNlKGUpfXN0YXRpYyBwYXJzZUlubGluZShlLHQpe3JldHVybiBuZXcgdSh0KS5wYXJzZUlubGluZShlKX1wYXJzZShlKXtsZXQgdD1cIlwiO2ZvcihsZXQgbj0wO248ZS5sZW5ndGg7bisrKXtsZXQgcj1lW25dO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5yZW5kZXJlcnM/LltyLnR5cGVdKXtsZXQgcz1yLGE9dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW3MudHlwZV0uY2FsbCh7cGFyc2VyOnRoaXN9LHMpO2lmKGEhPT0hMXx8IVtcInNwYWNlXCIsXCJoclwiLFwiaGVhZGluZ1wiLFwiY29kZVwiLFwidGFibGVcIixcImJsb2NrcXVvdGVcIixcImxpc3RcIixcImh0bWxcIixcImRlZlwiLFwicGFyYWdyYXBoXCIsXCJ0ZXh0XCJdLmluY2x1ZGVzKHMudHlwZSkpe3QrPWF8fFwiXCI7Y29udGludWV9fWxldCBpPXI7c3dpdGNoKGkudHlwZSl7Y2FzZVwic3BhY2VcIjp7dCs9dGhpcy5yZW5kZXJlci5zcGFjZShpKTticmVha31jYXNlXCJoclwiOnt0Kz10aGlzLnJlbmRlcmVyLmhyKGkpO2JyZWFrfWNhc2VcImhlYWRpbmdcIjp7dCs9dGhpcy5yZW5kZXJlci5oZWFkaW5nKGkpO2JyZWFrfWNhc2VcImNvZGVcIjp7dCs9dGhpcy5yZW5kZXJlci5jb2RlKGkpO2JyZWFrfWNhc2VcInRhYmxlXCI6e3QrPXRoaXMucmVuZGVyZXIudGFibGUoaSk7YnJlYWt9Y2FzZVwiYmxvY2txdW90ZVwiOnt0Kz10aGlzLnJlbmRlcmVyLmJsb2NrcXVvdGUoaSk7YnJlYWt9Y2FzZVwibGlzdFwiOnt0Kz10aGlzLnJlbmRlcmVyLmxpc3QoaSk7YnJlYWt9Y2FzZVwiY2hlY2tib3hcIjp7dCs9dGhpcy5yZW5kZXJlci5jaGVja2JveChpKTticmVha31jYXNlXCJodG1sXCI6e3QrPXRoaXMucmVuZGVyZXIuaHRtbChpKTticmVha31jYXNlXCJkZWZcIjp7dCs9dGhpcy5yZW5kZXJlci5kZWYoaSk7YnJlYWt9Y2FzZVwicGFyYWdyYXBoXCI6e3QrPXRoaXMucmVuZGVyZXIucGFyYWdyYXBoKGkpO2JyZWFrfWNhc2VcInRleHRcIjp7dCs9dGhpcy5yZW5kZXJlci50ZXh0KGkpO2JyZWFrfWRlZmF1bHQ6e2xldCBzPSdUb2tlbiB3aXRoIFwiJytpLnR5cGUrJ1wiIHR5cGUgd2FzIG5vdCBmb3VuZC4nO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpcmV0dXJuIGNvbnNvbGUuZXJyb3IocyksXCJcIjt0aHJvdyBuZXcgRXJyb3Iocyl9fX1yZXR1cm4gdH1wYXJzZUlubGluZShlLHQ9dGhpcy5yZW5kZXJlcil7bGV0IG49XCJcIjtmb3IobGV0IHI9MDtyPGUubGVuZ3RoO3IrKyl7bGV0IGk9ZVtyXTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8ucmVuZGVyZXJzPy5baS50eXBlXSl7bGV0IGE9dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW2kudHlwZV0uY2FsbCh7cGFyc2VyOnRoaXN9LGkpO2lmKGEhPT0hMXx8IVtcImVzY2FwZVwiLFwiaHRtbFwiLFwibGlua1wiLFwiaW1hZ2VcIixcInN0cm9uZ1wiLFwiZW1cIixcImNvZGVzcGFuXCIsXCJiclwiLFwiZGVsXCIsXCJ0ZXh0XCJdLmluY2x1ZGVzKGkudHlwZSkpe24rPWF8fFwiXCI7Y29udGludWV9fWxldCBzPWk7c3dpdGNoKHMudHlwZSl7Y2FzZVwiZXNjYXBlXCI6e24rPXQudGV4dChzKTticmVha31jYXNlXCJodG1sXCI6e24rPXQuaHRtbChzKTticmVha31jYXNlXCJsaW5rXCI6e24rPXQubGluayhzKTticmVha31jYXNlXCJpbWFnZVwiOntuKz10LmltYWdlKHMpO2JyZWFrfWNhc2VcImNoZWNrYm94XCI6e24rPXQuY2hlY2tib3gocyk7YnJlYWt9Y2FzZVwic3Ryb25nXCI6e24rPXQuc3Ryb25nKHMpO2JyZWFrfWNhc2VcImVtXCI6e24rPXQuZW0ocyk7YnJlYWt9Y2FzZVwiY29kZXNwYW5cIjp7bis9dC5jb2Rlc3BhbihzKTticmVha31jYXNlXCJiclwiOntuKz10LmJyKHMpO2JyZWFrfWNhc2VcImRlbFwiOntuKz10LmRlbChzKTticmVha31jYXNlXCJ0ZXh0XCI6e24rPXQudGV4dChzKTticmVha31kZWZhdWx0OntsZXQgYT0nVG9rZW4gd2l0aCBcIicrcy50eXBlKydcIiB0eXBlIHdhcyBub3QgZm91bmQuJztpZih0aGlzLm9wdGlvbnMuc2lsZW50KXJldHVybiBjb25zb2xlLmVycm9yKGEpLFwiXCI7dGhyb3cgbmV3IEVycm9yKGEpfX19cmV0dXJuIG59fTt2YXIgUz1jbGFzc3tvcHRpb25zO2Jsb2NrO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxUfXN0YXRpYyBwYXNzVGhyb3VnaEhvb2tzPW5ldyBTZXQoW1wicHJlcHJvY2Vzc1wiLFwicG9zdHByb2Nlc3NcIixcInByb2Nlc3NBbGxUb2tlbnNcIixcImVtU3Ryb25nTWFza1wiXSk7c3RhdGljIHBhc3NUaHJvdWdoSG9va3NSZXNwZWN0QXN5bmM9bmV3IFNldChbXCJwcmVwcm9jZXNzXCIsXCJwb3N0cHJvY2Vzc1wiLFwicHJvY2Vzc0FsbFRva2Vuc1wiXSk7cHJlcHJvY2VzcyhlKXtyZXR1cm4gZX1wb3N0cHJvY2VzcyhlKXtyZXR1cm4gZX1wcm9jZXNzQWxsVG9rZW5zKGUpe3JldHVybiBlfWVtU3Ryb25nTWFzayhlKXtyZXR1cm4gZX1wcm92aWRlTGV4ZXIoKXtyZXR1cm4gdGhpcy5ibG9jaz94LmxleDp4LmxleElubGluZX1wcm92aWRlUGFyc2VyKCl7cmV0dXJuIHRoaXMuYmxvY2s/Yi5wYXJzZTpiLnBhcnNlSW5saW5lfX07dmFyIEI9Y2xhc3N7ZGVmYXVsdHM9TCgpO29wdGlvbnM9dGhpcy5zZXRPcHRpb25zO3BhcnNlPXRoaXMucGFyc2VNYXJrZG93bighMCk7cGFyc2VJbmxpbmU9dGhpcy5wYXJzZU1hcmtkb3duKCExKTtQYXJzZXI9YjtSZW5kZXJlcj1QO1RleHRSZW5kZXJlcj0kO0xleGVyPXg7VG9rZW5pemVyPXk7SG9va3M9Uztjb25zdHJ1Y3RvciguLi5lKXt0aGlzLnVzZSguLi5lKX13YWxrVG9rZW5zKGUsdCl7bGV0IG49W107Zm9yKGxldCByIG9mIGUpc3dpdGNoKG49bi5jb25jYXQodC5jYWxsKHRoaXMscikpLHIudHlwZSl7Y2FzZVwidGFibGVcIjp7bGV0IGk9cjtmb3IobGV0IHMgb2YgaS5oZWFkZXIpbj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMocy50b2tlbnMsdCkpO2ZvcihsZXQgcyBvZiBpLnJvd3MpZm9yKGxldCBhIG9mIHMpbj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoYS50b2tlbnMsdCkpO2JyZWFrfWNhc2VcImxpc3RcIjp7bGV0IGk9cjtuPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhpLml0ZW1zLHQpKTticmVha31kZWZhdWx0OntsZXQgaT1yO3RoaXMuZGVmYXVsdHMuZXh0ZW5zaW9ucz8uY2hpbGRUb2tlbnM/LltpLnR5cGVdP3RoaXMuZGVmYXVsdHMuZXh0ZW5zaW9ucy5jaGlsZFRva2Vuc1tpLnR5cGVdLmZvckVhY2gocz0+e2xldCBhPWlbc10uZmxhdCgxLzApO249bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGEsdCkpfSk6aS50b2tlbnMmJihuPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhpLnRva2Vucyx0KSkpfX1yZXR1cm4gbn11c2UoLi4uZSl7bGV0IHQ9dGhpcy5kZWZhdWx0cy5leHRlbnNpb25zfHx7cmVuZGVyZXJzOnt9LGNoaWxkVG9rZW5zOnt9fTtyZXR1cm4gZS5mb3JFYWNoKG49PntsZXQgcj17Li4ubn07aWYoci5hc3luYz10aGlzLmRlZmF1bHRzLmFzeW5jfHxyLmFzeW5jfHwhMSxuLmV4dGVuc2lvbnMmJihuLmV4dGVuc2lvbnMuZm9yRWFjaChpPT57aWYoIWkubmFtZSl0aHJvdyBuZXcgRXJyb3IoXCJleHRlbnNpb24gbmFtZSByZXF1aXJlZFwiKTtpZihcInJlbmRlcmVyXCJpbiBpKXtsZXQgcz10LnJlbmRlcmVyc1tpLm5hbWVdO3M/dC5yZW5kZXJlcnNbaS5uYW1lXT1mdW5jdGlvbiguLi5hKXtsZXQgbz1pLnJlbmRlcmVyLmFwcGx5KHRoaXMsYSk7cmV0dXJuIG89PT0hMSYmKG89cy5hcHBseSh0aGlzLGEpKSxvfTp0LnJlbmRlcmVyc1tpLm5hbWVdPWkucmVuZGVyZXJ9aWYoXCJ0b2tlbml6ZXJcImluIGkpe2lmKCFpLmxldmVsfHxpLmxldmVsIT09XCJibG9ja1wiJiZpLmxldmVsIT09XCJpbmxpbmVcIil0aHJvdyBuZXcgRXJyb3IoXCJleHRlbnNpb24gbGV2ZWwgbXVzdCBiZSAnYmxvY2snIG9yICdpbmxpbmUnXCIpO2xldCBzPXRbaS5sZXZlbF07cz9zLnVuc2hpZnQoaS50b2tlbml6ZXIpOnRbaS5sZXZlbF09W2kudG9rZW5pemVyXSxpLnN0YXJ0JiYoaS5sZXZlbD09PVwiYmxvY2tcIj90LnN0YXJ0QmxvY2s/dC5zdGFydEJsb2NrLnB1c2goaS5zdGFydCk6dC5zdGFydEJsb2NrPVtpLnN0YXJ0XTppLmxldmVsPT09XCJpbmxpbmVcIiYmKHQuc3RhcnRJbmxpbmU/dC5zdGFydElubGluZS5wdXNoKGkuc3RhcnQpOnQuc3RhcnRJbmxpbmU9W2kuc3RhcnRdKSl9XCJjaGlsZFRva2Vuc1wiaW4gaSYmaS5jaGlsZFRva2VucyYmKHQuY2hpbGRUb2tlbnNbaS5uYW1lXT1pLmNoaWxkVG9rZW5zKX0pLHIuZXh0ZW5zaW9ucz10KSxuLnJlbmRlcmVyKXtsZXQgaT10aGlzLmRlZmF1bHRzLnJlbmRlcmVyfHxuZXcgUCh0aGlzLmRlZmF1bHRzKTtmb3IobGV0IHMgaW4gbi5yZW5kZXJlcil7aWYoIShzIGluIGkpKXRocm93IG5ldyBFcnJvcihgcmVuZGVyZXIgJyR7c30nIGRvZXMgbm90IGV4aXN0YCk7aWYoW1wib3B0aW9uc1wiLFwicGFyc2VyXCJdLmluY2x1ZGVzKHMpKWNvbnRpbnVlO2xldCBhPXMsbz1uLnJlbmRlcmVyW2FdLGw9aVthXTtpW2FdPSguLi5wKT0+e2xldCBjPW8uYXBwbHkoaSxwKTtyZXR1cm4gYz09PSExJiYoYz1sLmFwcGx5KGkscCkpLGN8fFwiXCJ9fXIucmVuZGVyZXI9aX1pZihuLnRva2VuaXplcil7bGV0IGk9dGhpcy5kZWZhdWx0cy50b2tlbml6ZXJ8fG5ldyB5KHRoaXMuZGVmYXVsdHMpO2ZvcihsZXQgcyBpbiBuLnRva2VuaXplcil7aWYoIShzIGluIGkpKXRocm93IG5ldyBFcnJvcihgdG9rZW5pemVyICcke3N9JyBkb2VzIG5vdCBleGlzdGApO2lmKFtcIm9wdGlvbnNcIixcInJ1bGVzXCIsXCJsZXhlclwiXS5pbmNsdWRlcyhzKSljb250aW51ZTtsZXQgYT1zLG89bi50b2tlbml6ZXJbYV0sbD1pW2FdO2lbYV09KC4uLnApPT57bGV0IGM9by5hcHBseShpLHApO3JldHVybiBjPT09ITEmJihjPWwuYXBwbHkoaSxwKSksY319ci50b2tlbml6ZXI9aX1pZihuLmhvb2tzKXtsZXQgaT10aGlzLmRlZmF1bHRzLmhvb2tzfHxuZXcgUztmb3IobGV0IHMgaW4gbi5ob29rcyl7aWYoIShzIGluIGkpKXRocm93IG5ldyBFcnJvcihgaG9vayAnJHtzfScgZG9lcyBub3QgZXhpc3RgKTtpZihbXCJvcHRpb25zXCIsXCJibG9ja1wiXS5pbmNsdWRlcyhzKSljb250aW51ZTtsZXQgYT1zLG89bi5ob29rc1thXSxsPWlbYV07Uy5wYXNzVGhyb3VnaEhvb2tzLmhhcyhzKT9pW2FdPXA9PntpZih0aGlzLmRlZmF1bHRzLmFzeW5jJiZTLnBhc3NUaHJvdWdoSG9va3NSZXNwZWN0QXN5bmMuaGFzKHMpKXJldHVybihhc3luYygpPT57bGV0IGc9YXdhaXQgby5jYWxsKGkscCk7cmV0dXJuIGwuY2FsbChpLGcpfSkoKTtsZXQgYz1vLmNhbGwoaSxwKTtyZXR1cm4gbC5jYWxsKGksYyl9OmlbYV09KC4uLnApPT57aWYodGhpcy5kZWZhdWx0cy5hc3luYylyZXR1cm4oYXN5bmMoKT0+e2xldCBnPWF3YWl0IG8uYXBwbHkoaSxwKTtyZXR1cm4gZz09PSExJiYoZz1hd2FpdCBsLmFwcGx5KGkscCkpLGd9KSgpO2xldCBjPW8uYXBwbHkoaSxwKTtyZXR1cm4gYz09PSExJiYoYz1sLmFwcGx5KGkscCkpLGN9fXIuaG9va3M9aX1pZihuLndhbGtUb2tlbnMpe2xldCBpPXRoaXMuZGVmYXVsdHMud2Fsa1Rva2VucyxzPW4ud2Fsa1Rva2VucztyLndhbGtUb2tlbnM9ZnVuY3Rpb24oYSl7bGV0IG89W107cmV0dXJuIG8ucHVzaChzLmNhbGwodGhpcyxhKSksaSYmKG89by5jb25jYXQoaS5jYWxsKHRoaXMsYSkpKSxvfX10aGlzLmRlZmF1bHRzPXsuLi50aGlzLmRlZmF1bHRzLC4uLnJ9fSksdGhpc31zZXRPcHRpb25zKGUpe3JldHVybiB0aGlzLmRlZmF1bHRzPXsuLi50aGlzLmRlZmF1bHRzLC4uLmV9LHRoaXN9bGV4ZXIoZSx0KXtyZXR1cm4geC5sZXgoZSx0Pz90aGlzLmRlZmF1bHRzKX1wYXJzZXIoZSx0KXtyZXR1cm4gYi5wYXJzZShlLHQ/P3RoaXMuZGVmYXVsdHMpfXBhcnNlTWFya2Rvd24oZSl7cmV0dXJuKG4scik9PntsZXQgaT17Li4ucn0scz17Li4udGhpcy5kZWZhdWx0cywuLi5pfSxhPXRoaXMub25FcnJvcighIXMuc2lsZW50LCEhcy5hc3luYyk7aWYodGhpcy5kZWZhdWx0cy5hc3luYz09PSEwJiZpLmFzeW5jPT09ITEpcmV0dXJuIGEobmV3IEVycm9yKFwibWFya2VkKCk6IFRoZSBhc3luYyBvcHRpb24gd2FzIHNldCB0byB0cnVlIGJ5IGFuIGV4dGVuc2lvbi4gUmVtb3ZlIGFzeW5jOiBmYWxzZSBmcm9tIHRoZSBwYXJzZSBvcHRpb25zIG9iamVjdCB0byByZXR1cm4gYSBQcm9taXNlLlwiKSk7aWYodHlwZW9mIG4+XCJ1XCJ8fG49PT1udWxsKXJldHVybiBhKG5ldyBFcnJvcihcIm1hcmtlZCgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgdW5kZWZpbmVkIG9yIG51bGxcIikpO2lmKHR5cGVvZiBuIT1cInN0cmluZ1wiKXJldHVybiBhKG5ldyBFcnJvcihcIm1hcmtlZCgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgb2YgdHlwZSBcIitPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobikrXCIsIHN0cmluZyBleHBlY3RlZFwiKSk7aWYocy5ob29rcyYmKHMuaG9va3Mub3B0aW9ucz1zLHMuaG9va3MuYmxvY2s9ZSkscy5hc3luYylyZXR1cm4oYXN5bmMoKT0+e2xldCBvPXMuaG9va3M/YXdhaXQgcy5ob29rcy5wcmVwcm9jZXNzKG4pOm4scD1hd2FpdChzLmhvb2tzP2F3YWl0IHMuaG9va3MucHJvdmlkZUxleGVyKCk6ZT94LmxleDp4LmxleElubGluZSkobyxzKSxjPXMuaG9va3M/YXdhaXQgcy5ob29rcy5wcm9jZXNzQWxsVG9rZW5zKHApOnA7cy53YWxrVG9rZW5zJiZhd2FpdCBQcm9taXNlLmFsbCh0aGlzLndhbGtUb2tlbnMoYyxzLndhbGtUb2tlbnMpKTtsZXQgaD1hd2FpdChzLmhvb2tzP2F3YWl0IHMuaG9va3MucHJvdmlkZVBhcnNlcigpOmU/Yi5wYXJzZTpiLnBhcnNlSW5saW5lKShjLHMpO3JldHVybiBzLmhvb2tzP2F3YWl0IHMuaG9va3MucG9zdHByb2Nlc3MoaCk6aH0pKCkuY2F0Y2goYSk7dHJ5e3MuaG9va3MmJihuPXMuaG9va3MucHJlcHJvY2VzcyhuKSk7bGV0IGw9KHMuaG9va3M/cy5ob29rcy5wcm92aWRlTGV4ZXIoKTplP3gubGV4OngubGV4SW5saW5lKShuLHMpO3MuaG9va3MmJihsPXMuaG9va3MucHJvY2Vzc0FsbFRva2VucyhsKSkscy53YWxrVG9rZW5zJiZ0aGlzLndhbGtUb2tlbnMobCxzLndhbGtUb2tlbnMpO2xldCBjPShzLmhvb2tzP3MuaG9va3MucHJvdmlkZVBhcnNlcigpOmU/Yi5wYXJzZTpiLnBhcnNlSW5saW5lKShsLHMpO3JldHVybiBzLmhvb2tzJiYoYz1zLmhvb2tzLnBvc3Rwcm9jZXNzKGMpKSxjfWNhdGNoKG8pe3JldHVybiBhKG8pfX19b25FcnJvcihlLHQpe3JldHVybiBuPT57aWYobi5tZXNzYWdlKz1gXG5QbGVhc2UgcmVwb3J0IHRoaXMgdG8gaHR0cHM6Ly9naXRodWIuY29tL21hcmtlZGpzL21hcmtlZC5gLGUpe2xldCByPVwiPHA+QW4gZXJyb3Igb2NjdXJyZWQ6PC9wPjxwcmU+XCIrdyhuLm1lc3NhZ2UrXCJcIiwhMCkrXCI8L3ByZT5cIjtyZXR1cm4gdD9Qcm9taXNlLnJlc29sdmUocik6cn1pZih0KXJldHVybiBQcm9taXNlLnJlamVjdChuKTt0aHJvdyBufX19O3ZhciBfPW5ldyBCO2Z1bmN0aW9uIGQodSxlKXtyZXR1cm4gXy5wYXJzZSh1LGUpfWQub3B0aW9ucz1kLnNldE9wdGlvbnM9ZnVuY3Rpb24odSl7cmV0dXJuIF8uc2V0T3B0aW9ucyh1KSxkLmRlZmF1bHRzPV8uZGVmYXVsdHMsWihkLmRlZmF1bHRzKSxkfTtkLmdldERlZmF1bHRzPUw7ZC5kZWZhdWx0cz1UO2QudXNlPWZ1bmN0aW9uKC4uLnUpe3JldHVybiBfLnVzZSguLi51KSxkLmRlZmF1bHRzPV8uZGVmYXVsdHMsWihkLmRlZmF1bHRzKSxkfTtkLndhbGtUb2tlbnM9ZnVuY3Rpb24odSxlKXtyZXR1cm4gXy53YWxrVG9rZW5zKHUsZSl9O2QucGFyc2VJbmxpbmU9Xy5wYXJzZUlubGluZTtkLlBhcnNlcj1iO2QucGFyc2VyPWIucGFyc2U7ZC5SZW5kZXJlcj1QO2QuVGV4dFJlbmRlcmVyPSQ7ZC5MZXhlcj14O2QubGV4ZXI9eC5sZXg7ZC5Ub2tlbml6ZXI9eTtkLkhvb2tzPVM7ZC5wYXJzZT1kO3ZhciBEdD1kLm9wdGlvbnMsSHQ9ZC5zZXRPcHRpb25zLFp0PWQudXNlLEd0PWQud2Fsa1Rva2VucyxOdD1kLnBhcnNlSW5saW5lLFF0PWQsRnQ9Yi5wYXJzZSxqdD14LmxleDtleHBvcnR7UyBhcyBIb29rcyx4IGFzIExleGVyLEIgYXMgTWFya2VkLGIgYXMgUGFyc2VyLFAgYXMgUmVuZGVyZXIsJCBhcyBUZXh0UmVuZGVyZXIseSBhcyBUb2tlbml6ZXIsVCBhcyBkZWZhdWx0cyxMIGFzIGdldERlZmF1bHRzLGp0IGFzIGxleGVyLGQgYXMgbWFya2VkLER0IGFzIG9wdGlvbnMsUXQgYXMgcGFyc2UsTnQgYXMgcGFyc2VJbmxpbmUsRnQgYXMgcGFyc2VyLEh0IGFzIHNldE9wdGlvbnMsWnQgYXMgdXNlLEd0IGFzIHdhbGtUb2tlbnN9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFya2VkLmVzbS5qcy5tYXBcbiIsImltcG9ydCBET01QdXJpZnkgZnJvbSBcImRvbXB1cmlmeVwiO1xuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSBcIm1hcmtlZFwiO1xuXG4vKipcbiAqIENvbnRlbnQgZm9ybWF0IHR5cGVzXG4gKi9cbmV4cG9ydCB0eXBlIENvbnRlbnRGb3JtYXQgPSBcImh0bWxcIiB8IFwibWFya2Rvd25cIiB8IFwidGV4dFwiO1xuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBIVE1MIHNhbml0aXphdGlvblxuICogVXBkYXRlZCBmb3IgRkFRIGNvbnRlbnQ6IFByaW9yaXRpemVzIHNhZmUsIHJlYWRhYmxlIHJpY2ggdGV4dCB3aXRoIGZ1bGwgbGluayBzdXBwb3J0LlxuICogRW5oYW5jZXMgdGFibGUgc3VwcG9ydCAoaW5jbHVkaW5nIGNhcHRpb25zIGFuZCBzdHJ1Y3R1cmFsIGF0dHJpYnV0ZXMgZm9yIGJldHRlciBhY2Nlc3NpYmlsaXR5L2NvbXBsZXhpdHkpLlxuICogQWRkcyBvcHRpb25hbCB2aWRlbyBzdXBwb3J0IChjb21tZW50ZWQgb3V0IGJ5IGRlZmF1bHTigJR1bmNvbW1lbnQgaWYgZW1iZWRkaW5nIHZpZGVvcyBpcyBkZXNpcmVkIGZvciBGQVFzO1xuICogbm90ZTogdGhpcyBpbmNyZWFzZXMgc2VjdXJpdHkgcmV2aWV3IG5lZWRzIGR1ZSB0byBwb3RlbnRpYWwgZXhlY3V0YWJsZSBjb250ZW50KS5cbiAqIFJlbW92ZXMgaGVhZGluZ3MgKGgxLWg2KSBhcyB0aGV5J3JlIGxpa2VseSB1bm5lY2Vzc2FyeSBmb3IgRkFRIHJlc3BvbnNlcy5cbiAqIFJldGFpbnMgY29yZSBmb3JtYXR0aW5nLCBsaXN0cywgaW1hZ2VzLCBhbmQgdGFibGVzIGZvciBzdHJ1Y3R1cmVkIGFuc3dlcnMuXG4gKi9cbmNvbnN0IFNBTklUSVpFX0NPTkZJRyA9IHtcbiAgICBBTExPV0VEX1RBR1M6IFtcbiAgICAgICAgXCJwXCIsXG4gICAgICAgIFwiYnJcIixcbiAgICAgICAgXCJzdHJvbmdcIixcbiAgICAgICAgXCJlbVwiLFxuICAgICAgICBcInVcIixcbiAgICAgICAgXCJzXCIsXG4gICAgICAgIFwiYlwiLFxuICAgICAgICBcImlcIixcbiAgICAgICAgXCJhXCIsXG4gICAgICAgIFwidWxcIixcbiAgICAgICAgXCJvbFwiLFxuICAgICAgICBcImxpXCIsXG4gICAgICAgIFwiY29kZVwiLFxuICAgICAgICBcInByZVwiLFxuICAgICAgICBcImhyXCIsXG4gICAgICAgIFwidGFibGVcIixcbiAgICAgICAgXCJjYXB0aW9uXCIsICAvLyBBZGRlZCBmb3IgdGFibGUgdGl0bGVzL2Rlc2NyaXB0aW9uc1xuICAgICAgICBcInRoZWFkXCIsXG4gICAgICAgIFwidGJvZHlcIixcbiAgICAgICAgXCJ0Zm9vdFwiLCAgICAvLyBBZGRlZCBmb3IgdGFibGUgZm9vdGVycyAoZS5nLiwgc3VtbWFyaWVzL3RvdGFscylcbiAgICAgICAgXCJ0clwiLFxuICAgICAgICBcInRoXCIsXG4gICAgICAgIFwidGRcIixcbiAgICAgICAgXCJjb2xcIiwgICAgICAvLyBBZGRlZCBmb3IgY29sdW1uIHByb3BlcnRpZXNcbiAgICAgICAgXCJjb2xncm91cFwiLCAvLyBBZGRlZCBmb3IgZ3JvdXBpbmcgY29sdW1uc1xuICAgICAgICBcImltZ1wiLFxuICAgICAgICBcImRpdlwiLFxuICAgICAgICBcInNwYW5cIixcbiAgICAgICAgXCJ2aWRlb1wiLCAgLy8gVW5jb21tZW50IHRvIGVuYWJsZSA8dmlkZW8+IGZvciBlbWJlZGRlZCB2aWRlb3NcbiAgICAgICAgXCJzb3VyY2VcIiwgLy8gVW5jb21tZW50IGlmIGVuYWJsaW5nIHZpZGVvIChmb3IgPHZpZGVvPiBzb3VyY2VzKVxuICAgICAgICBcImZpZ3VyZVwiLCAvLyBPcHRpb25hbDogRm9yIHdyYXBwaW5nIGltYWdlcy90YWJsZXMgd2l0aCBjYXB0aW9uc1xuICAgICAgICBcImZpZ2NhcHRpb25cIiAvLyBPcHRpb25hbDogRm9yIGZpZ3VyZSBkZXNjcmlwdGlvbnNcbiAgICBdLFxuICAgIEFMTE9XRURfQVRUUjogW1xuICAgICAgICBcImhyZWZcIixcbiAgICAgICAgXCJ0aXRsZVwiLFxuICAgICAgICBcInRhcmdldFwiLFxuICAgICAgICBcInJlbFwiLFxuICAgICAgICBcInNyY1wiLFxuICAgICAgICBcImFsdFwiLFxuICAgICAgICBcIndpZHRoXCIsXG4gICAgICAgIFwiaGVpZ2h0XCIsXG4gICAgICAgIFwiY2xhc3NcIixcbiAgICAgICAgXCJpZFwiLFxuICAgICAgICBcInN0eWxlXCIsXG4gICAgICAgIC8vIFRhYmxlLXNwZWNpZmljIGF0dHJpYnV0ZXMgZm9yIHN0cnVjdHVyZSBhbmQgYWNjZXNzaWJpbGl0eVxuICAgICAgICBcInJvd3NwYW5cIixcbiAgICAgICAgXCJjb2xzcGFuXCIsXG4gICAgICAgIFwic2NvcGVcIiwgICAgLy8gRm9yIDx0aD4gKGUuZy4sIHJvdywgY29sLCByb3dncm91cClcbiAgICAgICAgXCJoZWFkZXJzXCIsICAvLyBGb3IgYXNzb2NpYXRpbmcgPHRkPiB3aXRoIDx0aD5cbiAgICAgICAgLy8gVmlkZW8tc3BlY2lmaWMgKHVuY29tbWVudCBpZiBlbmFibGluZyB2aWRlbylcbiAgICAgICAgXCJjb250cm9sc1wiLFxuICAgICAgICBcImF1dG9wbGF5XCIsXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBcIm11dGVkXCIsXG4gICAgICAgIFwicG9zdGVyXCJcbiAgICBdLFxuICAgIEFMTE9XX0RBVEFfQVRUUjogZmFsc2UsICAvLyBLZWVwIGZhbHNlIGZvciBzZWN1cml0eTsgZW5hYmxlIG9ubHkgaWYgY3VzdG9tIGRhdGEgYXR0cnMgYXJlIHZldHRlZFxuICAgIEFMTE9XRURfVVJJX1JFR0VYUDogL14oPzooPzooPzpmfGh0KXRwcz98bWFpbHRvfHRlbHxjYWxsdG98c21zfGNpZHx4bXBwKTp8W15hLXpdfFthLXorLlxcLV0rKD86W15hLXorLlxcLTpdfCQpKS9pXG59O1xuXG4vKipcbiAqIFZhbGlkYXRlcyBhbmQgc2FuaXRpemVzIEhUTUwgY29udGVudFxuICogQHBhcmFtIGh0bWwgLSBUaGUgSFRNTCBzdHJpbmcgdG8gc2FuaXRpemVcbiAqIEByZXR1cm5zIFNhbml0aXplZCBIVE1MIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVIVE1MKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFodG1sKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIENvbmZpZ3VyZSBET01QdXJpZnlcbiAgICAgICAgY29uc3QgY2xlYW5IVE1MID0gRE9NUHVyaWZ5LnNhbml0aXplKGh0bWwsIFNBTklUSVpFX0NPTkZJRyk7XG4gICAgICAgIHJldHVybiBjbGVhbkhUTUw7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNhbml0aXppbmcgSFRNTDpcIiwgZXJyb3IpO1xuICAgICAgICAvLyBSZXR1cm4gZXNjYXBlZCB0ZXh0IGFzIGZhbGxiYWNrXG4gICAgICAgIHJldHVybiBlc2NhcGVIVE1MKGh0bWwpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgSFRNTCBjb250ZW50IGFuZCByZXR1cm5zIHZhbGlkYXRpb24gZXJyb3JzXG4gKiBAcGFyYW0gaHRtbCAtIFRoZSBIVE1MIHN0cmluZyB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgQXJyYXkgb2YgdmFsaWRhdGlvbiBlcnJvciBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVIVE1MKGh0bWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoIWh0bWwpIHtcbiAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igc2NyaXB0IHRhZ3MgKHNob3VsZCBiZSBibG9ja2VkKVxuICAgIGlmICgvPHNjcmlwdFtePl0qPltcXHNcXFNdKj88XFwvc2NyaXB0Pi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiU2NyaXB0IHRhZ3MgYXJlIG5vdCBhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBldmVudCBoYW5kbGVycyAoc2hvdWxkIGJlIGJsb2NrZWQpXG4gICAgaWYgKC9vblxcdytcXHMqPS9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiRXZlbnQgaGFuZGxlcnMgKG9uY2xpY2ssIG9ubG9hZCwgZXRjLikgYXJlIG5vdCBhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBqYXZhc2NyaXB0OiBwcm90b2NvbFxuICAgIGlmICgvamF2YXNjcmlwdDovZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIkphdmFTY3JpcHQgcHJvdG9jb2wgaW4gVVJMcyBpcyBub3QgYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29uc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgZGF0YTogcHJvdG9jb2wgKGV4Y2VwdCBmb3IgaW1hZ2VzKVxuICAgIGlmICgvZGF0YTooPyFpbWFnZSkvZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIkRhdGEgVVJMcyBhcmUgb25seSBhbGxvd2VkIGZvciBpbWFnZXNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGlmcmFtZSAobm90IGluIGFsbG93ZWQgdGFncylcbiAgICBpZiAoLzxpZnJhbWVbXj5dKj4vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIklmcmFtZSB0YWdzIGFyZSBub3QgYWxsb3dlZFwiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igb2JqZWN0IGFuZCBlbWJlZCB0YWdzXG4gICAgaWYgKC88KG9iamVjdHxlbWJlZClbXj5dKj4vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIk9iamVjdCBhbmQgZW1iZWQgdGFncyBhcmUgbm90IGFsbG93ZWRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVycm9ycztcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgSFRNTCBzeW50YXggZm9yIG1hbGZvcm1lZCBtYXJrdXBcbiAqIEBwYXJhbSBodG1sIC0gVGhlIEhUTUwgc3RyaW5nIHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBBcnJheSBvZiBzeW50YXggZXJyb3IgbWVzc2FnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSFRNTFN5bnRheChodG1sOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKCFodG1sKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIGF0dHJpYnV0ZSBxdW90ZXNcbiAgICAvLyBNYXRjaGVzOiBhdHRyPVwiIG9yIGF0dHI9JyB3aXRob3V0IGNsb3NpbmcgcXVvdGUgYmVmb3JlID4gb3IgYW5vdGhlciBhdHRyaWJ1dGVcbiAgICBjb25zdCB1bmNsb3NlZFF1b3RlUGF0dGVybiA9IC8oXFx3KylcXHMqPVxccypbXCInXSg/OlteXCInPl0qKD86W1wiJ11bXlwiJz5dK1tcIiddKSpbXlwiJz5dKik/KD89W15cIic+XSo+KS9nO1xuICAgIGNvbnN0IGFsbFRhZ3MgPSBodG1sLm1hdGNoKC88W14+XSs+L2cpIHx8IFtdO1xuICAgIFxuICAgIGFsbFRhZ3MuZm9yRWFjaCh0YWcgPT4ge1xuICAgICAgICAvLyBDaGVjayBmb3IgYXR0cmlidXRlcyB3aXRoIHVuY2xvc2VkIHF1b3Rlc1xuICAgICAgICAvLyBMb29rIGZvciBhdHRyPVwiIG9yIGF0dHI9JyB0aGF0IGRvZXNuJ3QgaGF2ZSBhIG1hdGNoaW5nIGNsb3NpbmcgcXVvdGVcbiAgICAgICAgY29uc3Qgc2luZ2xlUXVvdGVNYXRjaGVzID0gdGFnLm1hdGNoKC9cXHcrXFxzKj1cXHMqJ1teJ10qJC8pO1xuICAgICAgICBjb25zdCBkb3VibGVRdW90ZU1hdGNoZXMgPSB0YWcubWF0Y2goL1xcdytcXHMqPVxccypcIlteXCJdKiQvKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChzaW5nbGVRdW90ZU1hdGNoZXMgfHwgZG91YmxlUXVvdGVNYXRjaGVzKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgVW5jbG9zZWQgYXR0cmlidXRlIHF1b3RlIGluIHRhZzogJHt0YWcuc3Vic3RyaW5nKDAsIDUwKX0ke3RhZy5sZW5ndGggPiA1MCA/ICcuLi4nIDogJyd9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgdW5jbG9zZWQgb3BlbmluZyB0YWcgKG1pc3NpbmcgPilcbiAgICAgICAgaWYgKHRhZy5zdGFydHNXaXRoKCc8JykgJiYgIXRhZy5lbmRzV2l0aCgnPicpKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgVW5jbG9zZWQgdGFnIGJyYWNrZXQ6ICR7dGFnLnN1YnN0cmluZygwLCA1MCl9JHt0YWcubGVuZ3RoID4gNTAgPyAnLi4uJyA6ICcnfWApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBmb3IgYmFsYW5jZWQgdGFncyAob3BlbmluZyBhbmQgY2xvc2luZylcbiAgICAvLyBTZWxmLWNsb3NpbmcgdGFncyB0aGF0IGRvbid0IG5lZWQgY2xvc2luZyB0YWdzXG4gICAgY29uc3Qgc2VsZkNsb3NpbmdUYWdzID0gWydhcmVhJywgJ2Jhc2UnLCAnYnInLCAnY29sJywgJ2VtYmVkJywgJ2hyJywgJ2ltZycsICdpbnB1dCcsICdsaW5rJywgJ21ldGEnLCAncGFyYW0nLCAnc291cmNlJywgJ3RyYWNrJywgJ3diciddO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgYWxsIHRhZ3MgKG9wZW5pbmcgYW5kIGNsb3NpbmcpXG4gICAgY29uc3QgdGFnU3RhY2s6IEFycmF5PHsgdGFnOiBzdHJpbmc7IHBvc2l0aW9uOiBudW1iZXIgfT4gPSBbXTtcbiAgICBjb25zdCB0YWdSZWdleCA9IC88XFwvPyhbYS16QS1aXVthLXpBLVowLTldKilbXj5dKj4vZztcbiAgICBsZXQgbWF0Y2g7XG5cbiAgICB3aGlsZSAoKG1hdGNoID0gdGFnUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZnVsbFRhZyA9IG1hdGNoWzBdO1xuICAgICAgICBjb25zdCB0YWdOYW1lID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgaXNDbG9zaW5nID0gZnVsbFRhZy5zdGFydHNXaXRoKCc8LycpO1xuICAgICAgICBjb25zdCBpc1NlbGZDbG9zaW5nID0gZnVsbFRhZy5lbmRzV2l0aCgnLz4nKSB8fCBzZWxmQ2xvc2luZ1RhZ3MuaW5jbHVkZXModGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKGlzQ2xvc2luZykge1xuICAgICAgICAgICAgLy8gQ2xvc2luZyB0YWcgLSBwb3AgZnJvbSBzdGFja1xuICAgICAgICAgICAgaWYgKHRhZ1N0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGBPcnBoYW5lZCBjbG9zaW5nIHRhZzogPC8ke3RhZ05hbWV9PmApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXN0T3BlbmVkID0gdGFnU3RhY2tbdGFnU3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RPcGVuZWQudGFnID09PSB0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZ1N0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1pc21hdGNoZWQgdGFnXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGBNaXNtYXRjaGVkIHRhZ3M6IEV4cGVjdGVkIGNsb3NpbmcgdGFnIGZvciA8JHtsYXN0T3BlbmVkLnRhZ30+LCBmb3VuZCA8LyR7dGFnTmFtZX0+YCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBmaW5kIG1hdGNoaW5nIG9wZW5pbmcgdGFnIGluIHN0YWNrXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoSW5kZXggPSB0YWdTdGFjay5maW5kSW5kZXgodCA9PiB0LnRhZyA9PT0gdGFnTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaEluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1N0YWNrLnNwbGljZShtYXRjaEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghaXNTZWxmQ2xvc2luZykge1xuICAgICAgICAgICAgLy8gT3BlbmluZyB0YWcgLSBwdXNoIHRvIHN0YWNrXG4gICAgICAgICAgICB0YWdTdGFjay5wdXNoKHsgdGFnOiB0YWdOYW1lLCBwb3NpdGlvbjogbWF0Y2guaW5kZXggfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgdW5jbG9zZWQgdGFncyByZW1haW5pbmcgaW4gc3RhY2tcbiAgICBpZiAodGFnU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICB0YWdTdGFjay5mb3JFYWNoKCh7IHRhZyB9KSA9PiB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgVW5jbG9zZWQgdGFnOiA8JHt0YWd9PiBpcyBtaXNzaW5nIGNsb3NpbmcgdGFnIDwvJHt0YWd9PmApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgbWFsZm9ybWVkIGF0dHJpYnV0ZXMgKG5vIHZhbHVlLCBtYWxmb3JtZWQgc3ludGF4KVxuICAgIGNvbnN0IG1hbGZvcm1lZEF0dHJQYXR0ZXJuID0gLzxbXj5dK1xccysoXFx3KylcXHMqPVxccyooPyFbXCJcXHddKVtePl0qPi9nO1xuICAgIGxldCBhdHRyTWF0Y2g7XG4gICAgd2hpbGUgKChhdHRyTWF0Y2ggPSBtYWxmb3JtZWRBdHRyUGF0dGVybi5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBlcnJvcnMucHVzaChgTWFsZm9ybWVkIGF0dHJpYnV0ZSBzeW50YXg6ICR7YXR0ck1hdGNoWzBdLnN1YnN0cmluZygwLCA1MCl9JHthdHRyTWF0Y2hbMF0ubGVuZ3RoID4gNTAgPyAnLi4uJyA6ICcnfWApO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJvcnM7XG59XG5cbi8qKlxuICogQ29udmVydHMgbWFya2Rvd24gdG8gSFRNTFxuICogQHBhcmFtIG1hcmtkb3duIC0gVGhlIG1hcmtkb3duIHN0cmluZyB0byBjb252ZXJ0XG4gKiBAcmV0dXJucyBIVE1MIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya2Rvd25Ub0hUTUwobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFtYXJrZG93bikge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBDb25maWd1cmUgbWFya2VkIGZvciBzZWN1cml0eVxuICAgICAgICBtYXJrZWQuc2V0T3B0aW9ucyh7XG4gICAgICAgICAgICBicmVha3M6IHRydWUsXG4gICAgICAgICAgICBnZm06IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgaHRtbCA9IG1hcmtlZC5wYXJzZShtYXJrZG93bikgYXMgc3RyaW5nO1xuICAgICAgICAvLyBTYW5pdGl6ZSB0aGUgZ2VuZXJhdGVkIEhUTUxcbiAgICAgICAgcmV0dXJuIHNhbml0aXplSFRNTChodG1sKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcGFyc2luZyBtYXJrZG93bjpcIiwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gZXNjYXBlSFRNTChtYXJrZG93bik7XG4gICAgfVxufVxuXG4vKipcbiAqIEVzY2FwZXMgSFRNTCBzcGVjaWFsIGNoYXJhY3RlcnNcbiAqIEBwYXJhbSB0ZXh0IC0gVGhlIHRleHQgdG8gZXNjYXBlXG4gKiBAcmV0dXJucyBFc2NhcGVkIHRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUhUTUwodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGRpdi50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgcmV0dXJuIGRpdi5pbm5lckhUTUw7XG59XG5cbi8qKlxuICogQ29udmVydHMgcGxhaW4gdGV4dCB0byBIVE1MIHdpdGggbGluZSBicmVha3NcbiAqIEBwYXJhbSB0ZXh0IC0gVGhlIHBsYWluIHRleHQgdG8gY29udmVydFxuICogQHJldHVybnMgSFRNTCBzdHJpbmcgd2l0aCBsaW5lIGJyZWFrc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dFRvSFRNTCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghdGV4dCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICAvLyBFc2NhcGUgSFRNTCBjaGFyYWN0ZXJzIGFuZCBjb252ZXJ0IGxpbmUgYnJlYWtzIHRvIDxicj5cbiAgICBjb25zdCBlc2NhcGVkID0gZXNjYXBlSFRNTCh0ZXh0KTtcbiAgICByZXR1cm4gZXNjYXBlZC5yZXBsYWNlKC9cXG4vZywgXCI8YnI+XCIpO1xufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBjb250ZW50IGJhc2VkIG9uIGZvcm1hdCBhbmQgcmV0dXJucyBzYW5pdGl6ZWQgSFRNTFxuICogQHBhcmFtIGNvbnRlbnQgLSBUaGUgY29udGVudCBzdHJpbmdcbiAqIEBwYXJhbSBmb3JtYXQgLSBUaGUgY29udGVudCBmb3JtYXQgKGh0bWwsIG1hcmtkb3duLCBvciB0ZXh0KVxuICogQHJldHVybnMgU2FuaXRpemVkIEhUTUwgc3RyaW5nIG9yIGVzY2FwZWQgbWFya2Rvd25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NDb250ZW50KGNvbnRlbnQ6IHN0cmluZywgZm9ybWF0OiBDb250ZW50Rm9ybWF0KTogc3RyaW5nIHtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSBcImh0bWxcIjpcbiAgICAgICAgICAgIHJldHVybiBzYW5pdGl6ZUhUTUwoY29udGVudCk7XG4gICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgLy8gQ29udmVydCBtYXJrZG93biB0byBIVE1MIGFuZCBzYW5pdGl6ZSBpdFxuICAgICAgICAgICAgcmV0dXJuIG1hcmtkb3duVG9IVE1MKGNvbnRlbnQpO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgICAgcmV0dXJuIHRleHRUb0hUTUwoY29udGVudCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBVbnJlY29nbml6ZWQgZm9ybWF0IC0gdHJlYXQgYXMgSFRNTCBhbmQgc2FuaXRpemUgZm9yIHNhZmV0eVxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBVbnJlY29nbml6ZWQgY29udGVudCBmb3JtYXQgXCIke2Zvcm1hdH1cIiwgdHJlYXRpbmcgYXMgSFRNTGApO1xuICAgICAgICAgICAgcmV0dXJuIHNhbml0aXplSFRNTChjb250ZW50KTtcbiAgICB9XG59XG5cbi8qKlxuICogR2V0cyB2YWxpZGF0aW9uIHdhcm5pbmdzIGZvciBjb250ZW50IGJhc2VkIG9uIGZvcm1hdFxuICogQHBhcmFtIGNvbnRlbnQgLSBUaGUgY29udGVudCBzdHJpbmdcbiAqIEBwYXJhbSBmb3JtYXQgLSBUaGUgY29udGVudCBmb3JtYXRcbiAqIEByZXR1cm5zIEFycmF5IG9mIHdhcm5pbmcgbWVzc2FnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRlbnRXYXJuaW5ncyhjb250ZW50OiBzdHJpbmcsIGZvcm1hdDogQ29udGVudEZvcm1hdCk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgIGNhc2UgXCJodG1sXCI6XG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBib3RoIHNlY3VyaXR5IGlzc3VlcyBhbmQgc3ludGF4XG4gICAgICAgICAgICBjb25zdCBzZWN1cml0eVdhcm5pbmdzID0gdmFsaWRhdGVIVE1MKGNvbnRlbnQpO1xuICAgICAgICAgICAgY29uc3Qgc3ludGF4V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUxTeW50YXgoY29udGVudCk7XG4gICAgICAgICAgICByZXR1cm4gWy4uLnNlY3VyaXR5V2FybmluZ3MsIC4uLnN5bnRheFdhcm5pbmdzXTtcbiAgICAgICAgY2FzZSBcIm1hcmtkb3duXCI6XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgZGFuZ2Vyb3VzIEhUTUwgZW1iZWRkZWQgaW4gbWFya2Rvd25cbiAgICAgICAgICAgIC8vIFVzZXJzIG1pZ2h0IHRyeSB0byBpbmNsdWRlIDxzY3JpcHQ+IHRhZ3MgaW4gdGhlaXIgbWFya2Rvd25cbiAgICAgICAgICAgIGNvbnN0IGh0bWxQYXR0ZXJuID0gLzxbXj5dKz4vZztcbiAgICAgICAgICAgIGNvbnN0IGh0bWxNYXRjaGVzID0gY29udGVudC5tYXRjaChodG1sUGF0dGVybik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChodG1sTWF0Y2hlcykge1xuICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QganVzdCB0aGUgSFRNTCBwYXJ0cyBhbmQgdmFsaWRhdGUgdGhlbVxuICAgICAgICAgICAgICAgIGNvbnN0IGh0bWxDb250ZW50ID0gaHRtbE1hdGNoZXMuam9pbihcIlwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBodG1sU2VjdXJpdHlXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTChodG1sQ29udGVudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbFN5bnRheFdhcm5pbmdzID0gdmFsaWRhdGVIVE1MU3ludGF4KGh0bWxDb250ZW50KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBhbGxXYXJuaW5ncyA9IFsuLi5odG1sU2VjdXJpdHlXYXJuaW5ncywgLi4uaHRtbFN5bnRheFdhcm5pbmdzXTtcbiAgICAgICAgICAgICAgICBpZiAoYWxsV2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxsV2FybmluZ3MubWFwKHdhcm5pbmcgPT4gXG4gICAgICAgICAgICAgICAgICAgICAgICBgRW1iZWRkZWQgSFRNTCBpbiBtYXJrZG93bjogJHt3YXJuaW5nfWBcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICAvLyBUZXh0IGZvcm1hdCBkb2Vzbid0IG5lZWQgdmFsaWRhdGlvbiAoZXZlcnl0aGluZyBpcyBlc2NhcGVkKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbn1cbiIsIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIGVkaXRpbmcgbW9kZSBhbmQgcm9sZS1iYXNlZCBhY2Nlc3MgY29udHJvbFxuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IHVzZXIgaGFzIHRoZSByZXF1aXJlZCByb2xlIGZvciBlZGl0aW5nXG4gKiBAcGFyYW0gcmVxdWlyZWRSb2xlIC0gVGhlIHJvbGUgbmFtZSByZXF1aXJlZCAoZW1wdHkgc3RyaW5nID0gYWxsIGF1dGhlbnRpY2F0ZWQgdXNlcnMpXG4gKiBAcmV0dXJucyBQcm9taXNlPGJvb2xlYW4+IC0gVHJ1ZSBpZiB1c2VyIGhhcyBhY2Nlc3NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrVXNlclJvbGUocmVxdWlyZWRSb2xlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAvLyBJZiBubyByb2xlIHNwZWNpZmllZCwgYWxsb3cgYWxsIGF1dGhlbnRpY2F0ZWQgdXNlcnNcbiAgICBpZiAoIXJlcXVpcmVkUm9sZSB8fCByZXF1aXJlZFJvbGUudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIFVzZSBNZW5kaXggQ2xpZW50IEFQSSB0byBjaGVjayB1c2VyIHJvbGVzXG4gICAgICAgIC8vIE5vdGU6IEluIGFjdHVhbCBNZW5kaXggcnVudGltZSwgeW91J2QgdXNlIG14LnNlc3Npb24gb3Igc2ltaWxhclxuICAgICAgICAvLyBUaGlzIGlzIGEgcGxhY2Vob2xkZXIgLSBNZW5kaXggd2lkZ2V0cyB0eXBpY2FsbHkgdXNlIHNlcnZlci1zaWRlIHZhbGlkYXRpb25cbiAgICAgICAgLy8gRm9yIG5vdywgd2UnbGwgcmV0dXJuIHRydWUgYW5kIHJlbHkgb24gbWljcm9mbG93IHZhbGlkYXRpb25cbiAgICAgICAgY29uc29sZS5sb2coYENoZWNraW5nIHJvbGU6ICR7cmVxdWlyZWRSb2xlfWApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2hlY2tpbmcgdXNlciByb2xlOlwiLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGlmIGVkaXRpbmcgaXMgYWxsb3dlZCBiYXNlZCBvbiBjb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gYWxsb3dFZGl0aW5nIC0gV2hldGhlciBlZGl0aW5nIGlzIGVuYWJsZWRcbiAqIEBwYXJhbSBkYXRhU291cmNlVHlwZSAtIFR5cGUgb2YgZGF0YSBzb3VyY2VcbiAqIEBwYXJhbSBoYXNSb2xlIC0gV2hldGhlciB1c2VyIGhhcyByZXF1aXJlZCByb2xlXG4gKiBAcmV0dXJucyBib29sZWFuIC0gVHJ1ZSBpZiBlZGl0aW5nIHNob3VsZCBiZSBhbGxvd2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5FZGl0KFxuICAgIGFsbG93RWRpdGluZzogYm9vbGVhbixcbiAgICBkYXRhU291cmNlVHlwZTogc3RyaW5nLFxuICAgIGhhc1JvbGU6IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICAgIC8vIEVkaXRpbmcgb25seSB3b3JrcyB3aXRoIGRhdGFiYXNlIG1vZGVcbiAgICBpZiAoZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRWRpdGluZyBtdXN0IGJlIGVuYWJsZWRcbiAgICBpZiAoIWFsbG93RWRpdGluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVXNlciBtdXN0IGhhdmUgcmVxdWlyZWQgcm9sZVxuICAgIHJldHVybiBoYXNSb2xlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHRlbXBvcmFyeSBJRCBmb3IgbmV3IEZBUSBpdGVtcyBiZWZvcmUgdGhleSdyZSBzYXZlZFxuICogQHJldHVybnMgc3RyaW5nIC0gVGVtcG9yYXJ5IElEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVRlbXBJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgdGVtcF8ke0RhdGUubm93KCl9XyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpfWA7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQsIGNyZWF0ZUVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcblxuaW50ZXJmYWNlIEZBUUl0ZW1BY3Rpb25zUHJvcHMge1xuICAgIG9uRWRpdDogKCkgPT4gdm9pZDtcbiAgICBvbkRlbGV0ZTogKCkgPT4gdm9pZDtcbiAgICBvbk1vdmVVcDogKCkgPT4gdm9pZDtcbiAgICBvbk1vdmVEb3duOiAoKSA9PiB2b2lkO1xuICAgIGNhbk1vdmVVcDogYm9vbGVhbjtcbiAgICBjYW5Nb3ZlRG93bjogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBY3Rpb24gYnV0dG9ucyBmb3IgZWRpdGluZyBtb2RlIC0gRWRpdCwgRGVsZXRlLCBNb3ZlIFVwLCBNb3ZlIERvd25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZBUUl0ZW1BY3Rpb25zKHByb3BzOiBGQVFJdGVtQWN0aW9uc1Byb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7IG9uRWRpdCwgb25EZWxldGUsIG9uTW92ZVVwLCBvbk1vdmVEb3duLCBjYW5Nb3ZlVXAsIGNhbk1vdmVEb3duIH0gPSBwcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tYWN0aW9uc1wiPlxuICAgICAgICAgICAgey8qIE1vdmUgVXAgQnV0dG9uICovfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtLWFjdGlvbi1idG5cIiwgXCJmYXEtYWN0aW9uLW1vdmUtdXBcIil9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgb25Nb3ZlVXAoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXshY2FuTW92ZVVwfVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiTW92ZSB1cFwiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk1vdmUgRkFRIGl0ZW0gdXBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk04IDNMMyA4aDN2NWg0VjhoM3pcIiAvPlxuICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHsvKiBNb3ZlIERvd24gQnV0dG9uICovfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtLWFjdGlvbi1idG5cIiwgXCJmYXEtYWN0aW9uLW1vdmUtZG93blwiKX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBvbk1vdmVEb3duKCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWNhbk1vdmVEb3dufVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiTW92ZSBkb3duXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiTW92ZSBGQVEgaXRlbSBkb3duXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNOCAxM2w1LTVoLTNWM0g2djVIM3pcIiAvPlxuICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHsvKiBFZGl0IEJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbS1hY3Rpb24tYnRuXCIsIFwiZmFxLWFjdGlvbi1lZGl0XCIpfVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIG9uRWRpdCgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgdGl0bGU9XCJFZGl0IEZBUVwiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkVkaXQgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMi44NTQgMS4xNDZhLjUuNSAwIDAgMC0uNzA4IDBMMTAgMy4yOTMgMTIuNzA3IDZsMi4xNDctMi4xNDZhLjUuNSAwIDAgMCAwLS43MDhsLTItMnpNMTEuMjkzIDRMMiAxMy4yOTNWMTZoMi43MDdMMTQgNi43MDcgMTEuMjkzIDR6XCIgLz5cbiAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICB7LyogRGVsZXRlIEJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbS1hY3Rpb24tYnRuXCIsIFwiZmFxLWFjdGlvbi1kZWxldGVcIil9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGUoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiRGVsZXRlIEZBUVwiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkRlbGV0ZSBGQVEgaXRlbVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTUuNSA1LjVBLjUuNSAwIDAgMSA2IDZ2NmEuNS41IDAgMCAxLTEgMFY2YS41LjUgMCAwIDEgLjUtLjV6bTIuNSAwYS41LjUgMCAwIDEgLjUuNXY2YS41LjUgMCAwIDEtMSAwVjZhLjUuNSAwIDAgMSAuNS0uNXptMyAuNWEuNS41IDAgMCAwLTEgMHY2YS41LjUgMCAwIDAgMSAwVjZ6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZmlsbFJ1bGU9XCJldmVub2RkXCIgZD1cIk0xNC41IDNhMSAxIDAgMCAxLTEgMUgxM3Y5YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjRoLS41YTEgMSAwIDAgMS0xLTFWMmExIDEgMCAwIDEgMS0xSDZhMSAxIDAgMCAxIDEtMWgyYTEgMSAwIDAgMSAxIDFoMy41YTEgMSAwIDAgMSAxIDF2MXpNNC4xMTggNEw0IDQuMDU5VjEzYTEgMSAwIDAgMCAxIDFoNmExIDEgMCAwIDAgMS0xVjQuMDU5TDExLjg4MiA0SDQuMTE4ek0yLjUgM1YyaDExdjFoLTExelwiIC8+XG4gICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCwgY3JlYXRlRWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5pbnRlcmZhY2UgQ29uZmlybURpYWxvZ1Byb3BzIHtcbiAgICBpc09wZW46IGJvb2xlYW47XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgb25Db25maXJtOiAoKSA9PiB2b2lkO1xuICAgIG9uQ2FuY2VsOiAoKSA9PiB2b2lkO1xuICAgIGNvbmZpcm1UZXh0Pzogc3RyaW5nO1xuICAgIGNhbmNlbFRleHQ/OiBzdHJpbmc7XG4gICAgaXNEZXN0cnVjdGl2ZT86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29uZmlybWF0aW9uIGRpYWxvZyBtb2RhbCBmb3IgZGVzdHJ1Y3RpdmUgYWN0aW9ucyAoZS5nLiwgZGVsZXRlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gQ29uZmlybURpYWxvZyhwcm9wczogQ29uZmlybURpYWxvZ1Byb3BzKTogUmVhY3RFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3Qge1xuICAgICAgICBpc09wZW4sXG4gICAgICAgIHRpdGxlLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBvbkNvbmZpcm0sXG4gICAgICAgIG9uQ2FuY2VsLFxuICAgICAgICBjb25maXJtVGV4dCA9IFwiQ29uZmlybVwiLFxuICAgICAgICBjYW5jZWxUZXh0ID0gXCJDYW5jZWxcIixcbiAgICAgICAgaXNEZXN0cnVjdGl2ZSA9IGZhbHNlXG4gICAgfSA9IHByb3BzO1xuXG4gICAgaWYgKCFpc09wZW4pIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaGFuZGxlT3ZlcmxheUNsaWNrID0gKGU6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTERpdkVsZW1lbnQ+KSA9PiB7XG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gZS5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICBvbkNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLW92ZXJsYXlcIiBvbkNsaWNrPXtoYW5kbGVPdmVybGF5Q2xpY2t9IHJvbGU9XCJwcmVzZW50YXRpb25cIj5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2dcIlxuICAgICAgICAgICAgICAgIHJvbGU9XCJhbGVydGRpYWxvZ1wiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbGxlZGJ5PVwiZGlhbG9nLXRpdGxlXCJcbiAgICAgICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PVwiZGlhbG9nLW1lc3NhZ2VcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICB7aXNEZXN0cnVjdGl2ZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLWljb24td2FybmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9XCIyNFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PVwiMjRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNOC45ODIgMS41NjZhMS4xMyAxLjEzIDAgMCAwLTEuOTYgMEwuMTY1IDEzLjIzM2MtLjQ1Ny43NzguMDkxIDEuNzY3Ljk4IDEuNzY3aDEzLjcxM2MuODg5IDAgMS40MzgtLjk5Ljk4LTEuNzY3TDguOTgyIDEuNTY2ek04IDVjLjUzNSAwIC45NTQuNDYyLjkuOTk1bC0uMzUgMy41MDdhLjU1Mi41NTIgMCAwIDEtMS4xIDBMNy4xIDUuOTk1QS45MDUuOTA1IDAgMCAxIDggNXptLjAwMiA2YTEgMSAwIDEgMSAwIDIgMSAxIDAgMCAxIDAtMnpcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDxoMyBpZD1cImRpYWxvZy10aXRsZVwiIGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBpZD1cImRpYWxvZy1tZXNzYWdlXCIgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLW1lc3NhZ2VcIj5cbiAgICAgICAgICAgICAgICAgICAge21lc3NhZ2V9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy1hY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWNvbmZpcm0tZGlhbG9nLWJ0blwiLCBcImZhcS1idG4tY2FuY2VsXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17b25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5jZWxUZXh0fVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtY29uZmlybS1kaWFsb2ctYnRuXCIsIFwiZmFxLWJ0bi1jb25maXJtXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1idG4tZGVzdHJ1Y3RpdmVcIjogaXNEZXN0cnVjdGl2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNvbmZpcm19XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjb25maXJtVGV4dH1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCwgY3JlYXRlRWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5pbnRlcmZhY2UgRWRpdE1vZGVUb2dnbGVQcm9wcyB7XG4gICAgZWRpdE1vZGU6IGJvb2xlYW47XG4gICAgb25Ub2dnbGU6ICgpID0+IHZvaWQ7XG4gICAgZGlzYWJsZWQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRvZ2dsZSBidXR0b24gZm9yIHN3aXRjaGluZyBiZXR3ZWVuIHZpZXcgYW5kIGVkaXQgbW9kZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEVkaXRNb2RlVG9nZ2xlKHByb3BzOiBFZGl0TW9kZVRvZ2dsZVByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7IGVkaXRNb2RlLCBvblRvZ2dsZSwgZGlzYWJsZWQgPSBmYWxzZSB9ID0gcHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1lZGl0LW1vZGUtdG9nZ2xlXCIsIHtcbiAgICAgICAgICAgICAgICBcImZhcS1lZGl0LW1vZGUtYWN0aXZlXCI6IGVkaXRNb2RlXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uVG9nZ2xlfVxuICAgICAgICAgICAgZGlzYWJsZWQ9e2Rpc2FibGVkfVxuICAgICAgICAgICAgYXJpYS1sYWJlbD17ZWRpdE1vZGUgPyBcIlN3aXRjaCB0byB2aWV3IG1vZGVcIiA6IFwiU3dpdGNoIHRvIGVkaXQgbW9kZVwifVxuICAgICAgICAgICAgdGl0bGU9e2VkaXRNb2RlID8gXCJWaWV3IE1vZGVcIiA6IFwiRWRpdCBNb2RlXCJ9XG4gICAgICAgID5cbiAgICAgICAgICAgIHtlZGl0TW9kZSA/IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEwLjUgOGEyLjUgMi41IDAgMSAxLTUgMCAyLjUgMi41IDAgMCAxIDUgMHpcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0wIDhzMy01LjUgOC01LjVTMTYgOCAxNiA4cy0zIDUuNS04IDUuNVMwIDggMCA4em04IDMuNWEzLjUgMy41IDAgMSAwIDAtNyAzLjUgMy41IDAgMCAwIDAgN3pcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+Vmlldzwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMi44NTQgMS4xNDZhLjUuNSAwIDAgMC0uNzA4IDBMMTAgMy4yOTMgMTIuNzA3IDZsMi4xNDctMi4xNDZhLjUuNSAwIDAgMCAwLS43MDhsLTItMnpNMTEuMjkzIDRMMiAxMy4yOTNWMTZoMi43MDdMMTQgNi43MDcgMTEuMjkzIDR6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkVkaXQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50LCBjcmVhdGVFbGVtZW50LCB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgeyBwcm9jZXNzQ29udGVudCwgZ2V0Q29udGVudFdhcm5pbmdzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3JcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5cbmludGVyZmFjZSBFZGl0RkFRRm9ybVByb3BzIHtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgY29udGVudDogc3RyaW5nO1xuICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW07XG4gICAgb25TYXZlOiAoc3VtbWFyeTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcsIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0pID0+IHZvaWQ7XG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQ7XG4gICAgaXNOZXc/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRWRpdEZBUUZvcm0ocHJvcHM6IEVkaXRGQVFGb3JtUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHsgc3VtbWFyeTogaW5pdGlhbFN1bW1hcnksIGNvbnRlbnQ6IGluaXRpYWxDb250ZW50LCBmb3JtYXQ6IGluaXRpYWxGb3JtYXQsIG9uU2F2ZSwgb25DYW5jZWwsIGlzTmV3ID0gZmFsc2UgfSA9IHByb3BzO1xuXG4gICAgY29uc3QgW3N1bW1hcnksIHNldFN1bW1hcnldID0gdXNlU3RhdGUoaW5pdGlhbFN1bW1hcnkpO1xuICAgIGNvbnN0IFtjb250ZW50LCBzZXRDb250ZW50XSA9IHVzZVN0YXRlKGluaXRpYWxDb250ZW50KTtcbiAgICBjb25zdCBbZm9ybWF0LCBzZXRGb3JtYXRdID0gdXNlU3RhdGU8Q29udGVudEZvcm1hdEVudW0+KGluaXRpYWxGb3JtYXQpO1xuICAgIGNvbnN0IFtzaG93UHJldmlldywgc2V0U2hvd1ByZXZpZXddID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gICAgLy8gVmFsaWRhdGlvbiB3YXJuaW5nc1xuICAgIGNvbnN0IHdhcm5pbmdzID0gZ2V0Q29udGVudFdhcm5pbmdzKGNvbnRlbnQsIGZvcm1hdCk7XG4gICAgY29uc3QgaGFzV2FybmluZ3MgPSB3YXJuaW5ncy5sZW5ndGggPiAwO1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFzdW1tYXJ5LnRyaW0oKSkge1xuICAgICAgICAgICAgYWxlcnQoXCJTdW1tYXJ5L1F1ZXN0aW9uIGlzIHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ29udGVudC9BbnN3ZXIgaXMgcmVxdWlyZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb25TYXZlKHN1bW1hcnkudHJpbSgpLCBjb250ZW50LnRyaW0oKSwgZm9ybWF0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZWRpdC1mb3JtXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0LWZvcm0taGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgPGgzPntpc05ldyA/IFwiQWRkIE5ldyBGQVFcIiA6IFwiRWRpdCBGQVFcIn08L2gzPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWVkaXQtZm9ybS1jbG9zZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkNsb3NlXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIOKclVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWVkaXQtZm9ybS1ib2R5XCI+XG4gICAgICAgICAgICAgICAgey8qIFN1bW1hcnkgRmllbGQgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZhcS1zdW1tYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBRdWVzdGlvbi9TdW1tYXJ5IDxzcGFuIGNsYXNzTmFtZT1cImZhcS1yZXF1aXJlZFwiPio8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJmYXEtc3VtbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZm9ybS1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c3VtbWFyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U3VtbWFyeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkVudGVyIHRoZSBxdWVzdGlvbiBvciBzdW1tYXJ5Li4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogRm9ybWF0IEZpZWxkICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmYXEtZm9ybWF0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBDb250ZW50IEZvcm1hdCA8c3BhbiBjbGFzc05hbWU9XCJmYXEtcmVxdWlyZWRcIj4qPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZhcS1mb3JtYXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWZvcm0tc2VsZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtYXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1hdChlLnRhcmdldC52YWx1ZSBhcyBDb250ZW50Rm9ybWF0RW51bSl9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJodG1sXCI+SFRNTDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIm1hcmtkb3duXCI+TWFya2Rvd248L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ0ZXh0XCI+UGxhaW4gVGV4dDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzTmFtZT1cImZhcS1mb3JtLWhlbHBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXQgPT09IFwiaHRtbFwiICYmIFwiQWxsb3dzIHJpY2ggZm9ybWF0dGluZyB3aXRoIEhUTUwgdGFnc1wifVxuICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdCA9PT0gXCJtYXJrZG93blwiICYmIFwiVXNlcyBNYXJrZG93biBzeW50YXggKGUuZy4sICoqYm9sZCoqLCAjIGhlYWRpbmcpXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0ID09PSBcInRleHRcIiAmJiBcIlBsYWluIHRleHQgb25seSwgSFRNTCB3aWxsIGJlIGVzY2FwZWRcIn1cbiAgICAgICAgICAgICAgICAgICAgPC9zbWFsbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBDb250ZW50IEZpZWxkICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmYXEtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQW5zd2VyL0NvbnRlbnQgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLXJlcXVpcmVkXCI+Kjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZhcS1jb250ZW50XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1mb3JtLXRleHRhcmVhXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1mb3JtLXRleHRhcmVhLS13YXJuaW5nXCI6IGhhc1dhcm5pbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRDb250ZW50KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgdGhlIGFuc3dlciBvciBjb250ZW50Li4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezEwfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHsvKiBWYWxpZGF0aW9uIFdhcm5pbmdzICovfVxuICAgICAgICAgICAgICAgICAgICB7aGFzV2FybmluZ3MgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS13YXJuaW5nc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+4pqg77iPIENvbnRlbnQgV2FybmluZ3M6PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubWFwKCh3YXJuaW5nLCBpKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkga2V5PXtpfT57d2FybmluZ308L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogUHJldmlldyBUb2dnbGUgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1wcmV2aWV3LXRvZ2dsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93UHJldmlldyghc2hvd1ByZXZpZXcpfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2hvd1ByZXZpZXcgPyBcIkhpZGVcIiA6IFwiU2hvd1wifSBQcmV2aWV3XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIFByZXZpZXcgKi99XG4gICAgICAgICAgICAgICAge3Nob3dQcmV2aWV3ICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1wcmV2aWV3XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDQ+UHJldmlldzo8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1mb3JtLXByZXZpZXctY29udGVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBwcm9jZXNzQ29udGVudChjb250ZW50LCBmb3JtYXQpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBGb3JtIEFjdGlvbnMgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0LWZvcm0tZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWJ0biBmYXEtYnRuLXNlY29uZGFyeVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgQ2FuY2VsXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWJ0biBmYXEtYnRuLXByaW1hcnlcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTYXZlfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXN1bW1hcnkudHJpbSgpIHx8ICFjb250ZW50LnRyaW0oKX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtpc05ldyA/IFwiQ3JlYXRlIEZBUVwiIDogXCJTYXZlIENoYW5nZXNcIn1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50LCBjcmVhdGVFbGVtZW50LCB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBGQVFBY2NvcmRpb25Db250YWluZXJQcm9wcywgQ29udGVudEZvcm1hdEVudW0gfSBmcm9tIFwiLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuaW1wb3J0IFwiLi91aS9GQVFBY2NvcmRpb24uc2Nzc1wiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCB7IHByb2Nlc3NDb250ZW50LCBnZXRDb250ZW50V2FybmluZ3MgfSBmcm9tIFwiLi91dGlscy9jb250ZW50UHJvY2Vzc29yXCI7XG5pbXBvcnQgeyBjaGVja1VzZXJSb2xlLCBjYW5FZGl0IH0gZnJvbSBcIi4vdXRpbHMvZWRpdGluZ1V0aWxzXCI7XG5pbXBvcnQgeyBPYmplY3RJdGVtIH0gZnJvbSBcIm1lbmRpeFwiO1xuaW1wb3J0IHsgRkFRSXRlbUFjdGlvbnMgfSBmcm9tIFwiLi9jb21wb25lbnRzL0ZBUUl0ZW1BY3Rpb25zXCI7XG5pbXBvcnQgeyBDb25maXJtRGlhbG9nIH0gZnJvbSBcIi4vY29tcG9uZW50cy9Db25maXJtRGlhbG9nXCI7XG5pbXBvcnQgeyBFZGl0TW9kZVRvZ2dsZSB9IGZyb20gXCIuL2NvbXBvbmVudHMvRWRpdE1vZGVUb2dnbGVcIjtcbmltcG9ydCB7IEVkaXRGQVFGb3JtIH0gZnJvbSBcIi4vY29tcG9uZW50cy9FZGl0RkFRRm9ybVwiO1xuXG5pbnRlcmZhY2UgRkFRSXRlbSB7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICBjb250ZW50Rm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGNvbnRlbnQgZm9ybWF0IHZhbHVlIHRvIHZhbGlkIGZvcm1hdCBvciBkZWZhdWx0cyB0byBIVE1MXG4gKiBAcGFyYW0gZm9ybWF0IC0gUmF3IGZvcm1hdCB2YWx1ZSBmcm9tIGRhdGFiYXNlIG9yIGNvbmZpZ3VyYXRpb25cbiAqIEByZXR1cm5zIFZhbGlkIENvbnRlbnRGb3JtYXRFbnVtIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0OiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogQ29udGVudEZvcm1hdEVudW0ge1xuICAgIGlmICghZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiBcImh0bWxcIjtcbiAgICB9XG4gICAgXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGZvcm1hdC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBcbiAgICAvLyBDaGVjayBpZiBpdCdzIGEgdmFsaWQgZm9ybWF0XG4gICAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiaHRtbFwiIHx8IG5vcm1hbGl6ZWQgPT09IFwibWFya2Rvd25cIiB8fCBub3JtYWxpemVkID09PSBcInRleHRcIikge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplZCBhcyBDb250ZW50Rm9ybWF0RW51bTtcbiAgICB9XG4gICAgXG4gICAgLy8gVW5yZWNvZ25pemVkIGZvcm1hdCAtIGRlZmF1bHQgdG8gSFRNTFxuICAgIGNvbnNvbGUud2FybihgRkFRIEFjY29yZGlvbjogVW5yZWNvZ25pemVkIGNvbnRlbnQgZm9ybWF0IFwiJHtmb3JtYXR9XCIsIGRlZmF1bHRpbmcgdG8gSFRNTGApO1xuICAgIHJldHVybiBcImh0bWxcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZBUUFjY29yZGlvbihwcm9wczogRkFRQWNjb3JkaW9uQ29udGFpbmVyUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHtcbiAgICAgICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgICAgIGZhcUl0ZW1zLFxuICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICBzdW1tYXJ5QXR0cmlidXRlLFxuICAgICAgICBjb250ZW50QXR0cmlidXRlLFxuICAgICAgICBmb3JtYXRBdHRyaWJ1dGUsXG4gICAgICAgIGRlZmF1bHRFeHBhbmRBbGwsXG4gICAgICAgIHNob3dUb2dnbGVCdXR0b24sXG4gICAgICAgIHRvZ2dsZUJ1dHRvblRleHQsXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICBhbGxvd0VkaXRpbmcsXG4gICAgICAgIGVkaXRvclJvbGUsXG4gICAgICAgIG9uU2F2ZUFjdGlvbixcbiAgICAgICAgb25EZWxldGVBY3Rpb24sXG4gICAgICAgIG9uQ3JlYXRlQWN0aW9uLFxuICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGVcbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBHZXQgRkFRIGl0ZW1zIGZyb20gZWl0aGVyIHN0YXRpYyBjb25maWd1cmF0aW9uIG9yIGRhdGFiYXNlXG4gICAgY29uc3QgaXRlbXMgPSB1c2VNZW1vPEZBUUl0ZW1bXT4oKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIGRhdGFTb3VyY2Uuc3RhdHVzID09PSBcImF2YWlsYWJsZVwiKSB7XG4gICAgICAgICAgICAvLyBEYXRhYmFzZSBtb2RlOiByZWFkIGZyb20gZGF0YSBzb3VyY2VcbiAgICAgICAgICAgIHJldHVybiBkYXRhU291cmNlLml0ZW1zPy5tYXAoKGl0ZW06IE9iamVjdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gc3VtbWFyeUF0dHJpYnV0ZT8uZ2V0KGl0ZW0pLnZhbHVlIHx8IFwiUXVlc3Rpb25cIjtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gY29udGVudEF0dHJpYnV0ZT8uZ2V0KGl0ZW0pLnZhbHVlIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0VmFsdWUgPSBmb3JtYXRBdHRyaWJ1dGU/LmdldChpdGVtKS52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBub3JtYWxpemVDb250ZW50Rm9ybWF0KGZvcm1hdFZhbHVlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50Rm9ybWF0OiBmb3JtYXRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkgfHwgW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdGF0aWMgbW9kZTogdXNlIGNvbmZpZ3VyZWQgaXRlbXNcbiAgICAgICAgICAgIHJldHVybiBmYXFJdGVtcz8ubWFwKGl0ZW0gPT4gKHtcbiAgICAgICAgICAgICAgICBzdW1tYXJ5OiBpdGVtLnN1bW1hcnk/LnZhbHVlIHx8IFwiUXVlc3Rpb25cIixcbiAgICAgICAgICAgICAgICBjb250ZW50OiBpdGVtLmNvbnRlbnQ/LnZhbHVlIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogbm9ybWFsaXplQ29udGVudEZvcm1hdChpdGVtLmNvbnRlbnRGb3JtYXQpXG4gICAgICAgICAgICB9KSkgfHwgW107XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFTb3VyY2UsIGZhcUl0ZW1zLCBzdW1tYXJ5QXR0cmlidXRlLCBjb250ZW50QXR0cmlidXRlLCBmb3JtYXRBdHRyaWJ1dGVdKTtcblxuICAgIC8vIFN0YXRlIHRvIHRyYWNrIHdoaWNoIGl0ZW1zIGFyZSBleHBhbmRlZFxuICAgIGNvbnN0IFtleHBhbmRlZEl0ZW1zLCBzZXRFeHBhbmRlZEl0ZW1zXSA9IHVzZVN0YXRlPFNldDxudW1iZXI+PihuZXcgU2V0KCkpO1xuICAgIGNvbnN0IFthbGxFeHBhbmRlZCwgc2V0QWxsRXhwYW5kZWRdID0gdXNlU3RhdGUoZGVmYXVsdEV4cGFuZEFsbCk7XG5cbiAgICAvLyBFZGl0aW5nIHN0YXRlXG4gICAgY29uc3QgW2VkaXRNb2RlLCBzZXRFZGl0TW9kZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2VkaXRpbmdJdGVtSW5kZXgsIHNldEVkaXRpbmdJdGVtSW5kZXhdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG4gICAgY29uc3QgW3Nob3dDcmVhdGVGb3JtLCBzZXRTaG93Q3JlYXRlRm9ybV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW3VzZXJIYXNSb2xlLCBzZXRVc2VySGFzUm9sZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2RlbGV0ZUNvbmZpcm1JbmRleCwgc2V0RGVsZXRlQ29uZmlybUluZGV4XSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgcmVxdWlyZWQgcm9sZVxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoZWNrUm9sZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmIChhbGxvd0VkaXRpbmcgJiYgZWRpdG9yUm9sZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1JvbGUgPSBhd2FpdCBjaGVja1VzZXJSb2xlKGVkaXRvclJvbGUpO1xuICAgICAgICAgICAgICAgIHNldFVzZXJIYXNSb2xlKGhhc1JvbGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhbGxvd0VkaXRpbmcgJiYgIWVkaXRvclJvbGUpIHtcbiAgICAgICAgICAgICAgICAvLyBObyByb2xlIHJlc3RyaWN0aW9uIC0gYWxsb3cgZWRpdGluZyBmb3IgYWxsIHVzZXJzXG4gICAgICAgICAgICAgICAgc2V0VXNlckhhc1JvbGUodHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFVzZXJIYXNSb2xlKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGNoZWNrUm9sZSgpO1xuICAgIH0sIFthbGxvd0VkaXRpbmcsIGVkaXRvclJvbGVdKTtcblxuICAgIC8vIEluaXRpYWxpemUgZXhwYW5kZWQgc3RhdGUgYmFzZWQgb24gZGVmYXVsdEV4cGFuZEFsbFxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChkZWZhdWx0RXhwYW5kQWxsKSB7XG4gICAgICAgICAgICBjb25zdCBhbGxJbmRpY2VzID0gbmV3IFNldChpdGVtcz8ubWFwKChfLCBpbmRleCkgPT4gaW5kZXgpIHx8IFtdKTtcbiAgICAgICAgICAgIHNldEV4cGFuZGVkSXRlbXMoYWxsSW5kaWNlcyk7XG4gICAgICAgIH1cbiAgICB9LCBbZGVmYXVsdEV4cGFuZEFsbCwgaXRlbXNdKTtcblxuICAgIC8vIFRvZ2dsZSBpbmRpdmlkdWFsIGl0ZW1cbiAgICBjb25zdCB0b2dnbGVJdGVtID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RXhwYW5kZWRJdGVtcygocHJldikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3U2V0ID0gbmV3IFNldChwcmV2KTtcbiAgICAgICAgICAgIGlmIChuZXdTZXQuaGFzKGluZGV4KSkge1xuICAgICAgICAgICAgICAgIG5ld1NldC5kZWxldGUoaW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdTZXQuYWRkKGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdTZXQ7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBUb2dnbGUgYWxsIGl0ZW1zXG4gICAgY29uc3QgdG9nZ2xlQWxsID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoYWxsRXhwYW5kZWQpIHtcbiAgICAgICAgICAgIC8vIENvbGxhcHNlIGFsbFxuICAgICAgICAgICAgc2V0RXhwYW5kZWRJdGVtcyhuZXcgU2V0KCkpO1xuICAgICAgICAgICAgc2V0QWxsRXhwYW5kZWQoZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRXhwYW5kIGFsbFxuICAgICAgICAgICAgY29uc3QgYWxsSW5kaWNlcyA9IG5ldyBTZXQoaXRlbXM/Lm1hcCgoXywgaW5kZXgpID0+IGluZGV4KSB8fCBbXSk7XG4gICAgICAgICAgICBzZXRFeHBhbmRlZEl0ZW1zKGFsbEluZGljZXMpO1xuICAgICAgICAgICAgc2V0QWxsRXhwYW5kZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gVXBkYXRlIGFsbEV4cGFuZGVkIHN0YXRlIGJhc2VkIG9uIGluZGl2aWR1YWwgdG9nZ2xlc1xuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChpdGVtcykge1xuICAgICAgICAgICAgY29uc3QgYWxsQXJlRXhwYW5kZWQgPSBpdGVtcy5sZW5ndGggPiAwICYmIGV4cGFuZGVkSXRlbXMuc2l6ZSA9PT0gaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgc2V0QWxsRXhwYW5kZWQoYWxsQXJlRXhwYW5kZWQpO1xuICAgICAgICB9XG4gICAgfSwgW2V4cGFuZGVkSXRlbXMsIGl0ZW1zXSk7XG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgZWRpdGluZyBpcyBlbmFibGVkXG4gICAgY29uc3QgaXNFZGl0aW5nRW5hYmxlZCA9IGNhbkVkaXQoYWxsb3dFZGl0aW5nLCBkYXRhU291cmNlVHlwZSwgdXNlckhhc1JvbGUpO1xuXG4gICAgLy8gUGxhY2Vob2xkZXIgaGFuZGxlcnMgZm9yIENSVUQgb3BlcmF0aW9ucyAodG8gYmUgaW1wbGVtZW50ZWQgaW4gU3ByaW50IDMpXG4gICAgY29uc3QgaGFuZGxlVG9nZ2xlRWRpdE1vZGUgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRNb2RlKCFlZGl0TW9kZSk7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlRWRpdEl0ZW0gPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFZGl0aW5nSXRlbUluZGV4KGluZGV4KTtcbiAgICAgICAgc2V0U2hvd0NyZWF0ZUZvcm0oZmFsc2UpO1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVEZWxldGVJdGVtID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KGluZGV4KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlQ29uZmlybURlbGV0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGRlbGV0ZUNvbmZpcm1JbmRleCA9PT0gbnVsbCB8fCAhZGF0YVNvdXJjZSB8fCBkYXRhU291cmNlVHlwZSAhPT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgICAgICBzZXREZWxldGVDb25maXJtSW5kZXgobnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtID0gZGF0YVNvdXJjZS5pdGVtcz8uW2RlbGV0ZUNvbmZpcm1JbmRleF07XG4gICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXhlY3V0ZSBkZWxldGUgYWN0aW9uXG4gICAgICAgIGlmIChvbkRlbGV0ZUFjdGlvbiAmJiBvbkRlbGV0ZUFjdGlvbi5jYW5FeGVjdXRlKSB7XG4gICAgICAgICAgICBvbkRlbGV0ZUFjdGlvbi5leGVjdXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXREZWxldGVDb25maXJtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZUNhbmNlbERlbGV0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KG51bGwpO1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVNb3ZlVXAgPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgaW4gU3ByaW50IDRcbiAgICAgICAgY29uc29sZS5sb2coXCJNb3ZlIHVwOlwiLCBpbmRleCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZU1vdmVEb3duID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGluIFNwcmludCA0XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW92ZSBkb3duOlwiLCBpbmRleCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmVFZGl0ID0gKHN1bW1hcnk6IHN0cmluZywgY29udGVudDogc3RyaW5nLCBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChlZGl0aW5nSXRlbUluZGV4ID09PSBudWxsIHx8ICFkYXRhU291cmNlIHx8IGRhdGFTb3VyY2VUeXBlICE9PSBcImRhdGFiYXNlXCIpIHtcbiAgICAgICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtID0gZGF0YVNvdXJjZS5pdGVtcz8uW2VkaXRpbmdJdGVtSW5kZXhdO1xuICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgYXR0cmlidXRlc1xuICAgICAgICBpZiAoc3VtbWFyeUF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgc3VtbWFyeUF0dHJpYnV0ZS5nZXQoaXRlbSkuc2V0VmFsdWUoc3VtbWFyeSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnRBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgIGNvbnRlbnRBdHRyaWJ1dGUuZ2V0KGl0ZW0pLnNldFZhbHVlKGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmb3JtYXRBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgIGZvcm1hdEF0dHJpYnV0ZS5nZXQoaXRlbSkuc2V0VmFsdWUoZm9ybWF0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEV4ZWN1dGUgc2F2ZSBhY3Rpb25cbiAgICAgICAgaWYgKG9uU2F2ZUFjdGlvbiAmJiBvblNhdmVBY3Rpb24uY2FuRXhlY3V0ZSkge1xuICAgICAgICAgICAgb25TYXZlQWN0aW9uLmV4ZWN1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZUNhbmNlbEVkaXQgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlQ3JlYXRlTmV3ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybSh0cnVlKTtcbiAgICAgICAgc2V0RWRpdGluZ0l0ZW1JbmRleChudWxsKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZU5ldyA9IChzdW1tYXJ5OiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZywgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoIWRhdGFTb3VyY2UgfHwgZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICAgICAgc2V0U2hvd0NyZWF0ZUZvcm0oZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm9yIGNyZWF0aW5nIG5ldyBpdGVtcywgd2UgcmVseSBvbiB0aGUgb25DcmVhdGVBY3Rpb24gbWljcm9mbG93L25hbm9mbG93XG4gICAgICAgIC8vIHRvIGNyZWF0ZSB0aGUgb2JqZWN0IGFuZCBzZXQgaW5pdGlhbCB2YWx1ZXMuIFRoZSBmb3JtIGRhdGEgY291bGQgYmUgcGFzc2VkXG4gICAgICAgIC8vIGFzIHBhcmFtZXRlcnMgaWYgdGhlIGFjdGlvbiBzdXBwb3J0cyBpdC5cbiAgICAgICAgXG4gICAgICAgIC8vIEV4ZWN1dGUgY3JlYXRlIGFjdGlvbiAtIHRoZSBtaWNyb2Zsb3cgc2hvdWxkIGhhbmRsZSBvYmplY3QgY3JlYXRpb25cbiAgICAgICAgaWYgKG9uQ3JlYXRlQWN0aW9uICYmIG9uQ3JlYXRlQWN0aW9uLmNhbkV4ZWN1dGUpIHtcbiAgICAgICAgICAgIG9uQ3JlYXRlQWN0aW9uLmV4ZWN1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdGU6IEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgeW91IG1pZ2h0IHdhbnQgdG8gc3RvcmUgdGhlIGZvcm0gZGF0YVxuICAgICAgICAvLyB0ZW1wb3JhcmlseSBhbmQgaGF2ZSB0aGUgYWN0aW9uIGNhbGxiYWNrIHVwZGF0ZSB0aGUgbmV3bHkgY3JlYXRlZCBvYmplY3RcbiAgICAgICAgXG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgLy8gU2hvdyBsb2FkaW5nIHN0YXRlIGZvciBkYXRhYmFzZSBtb2RlXG4gICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZSAmJiBkYXRhU291cmNlLnN0YXR1cyA9PT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1sb2FkaW5nXCI+XG4gICAgICAgICAgICAgICAgPHA+TG9hZGluZyBGQVEgaXRlbXMuLi48L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWl0ZW1zIHx8IGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWVtcHR5XCI+XG4gICAgICAgICAgICAgICAgPHA+Tm8gRkFRIGl0ZW1zIGNvbmZpZ3VyZWQ8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBnZXRUb2dnbGVCdXR0b25UZXh0ID0gKCk6IHN0cmluZyA9PiB7XG4gICAgICAgIGlmICh0b2dnbGVCdXR0b25UZXh0ICYmIHRvZ2dsZUJ1dHRvblRleHQudmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0b2dnbGVCdXR0b25UZXh0LnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGxFeHBhbmRlZCA/IFwiSGlkZSBBbGxcIiA6IFwiU2hvdyBBbGxcIjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgeyhzaG93VG9nZ2xlQnV0dG9uIHx8IGlzRWRpdGluZ0VuYWJsZWQpICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24taGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIHtzaG93VG9nZ2xlQnV0dG9uICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtdG9nZ2xlLWFsbC1idG5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS10b2dnbGUtYWxsLWJ0bi0tZXhwYW5kZWRcIjogYWxsRXhwYW5kZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0b2dnbGVBbGx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2dldFRvZ2dsZUJ1dHRvblRleHQoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nRW5hYmxlZCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0aW5nLWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRNb2RlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtY3JlYXRlLW5ldy1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlQ3JlYXRlTmV3fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkNyZWF0ZSBuZXcgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk04IDJhLjUuNSAwIDAgMSAuNS41djVoNWEuNS41IDAgMCAxIDAgMWgtNXY1YS41LjUgMCAwIDEtMSAwdi01aC01YS41LjUgMCAwIDEgMC0xaDV2LTVBLjUuNSAwIDAgMSA4IDJ6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ3JlYXRlIE5ld1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0TW9kZVRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0TW9kZT17ZWRpdE1vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uVG9nZ2xlPXtoYW5kbGVUb2dnbGVFZGl0TW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24taXRlbXNcIj5cbiAgICAgICAgICAgICAgICB7aXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0V4cGFuZGVkID0gZXhwYW5kZWRJdGVtcy5oYXMoaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5VmFsdWUgPSBpdGVtLnN1bW1hcnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRWYWx1ZSA9IGl0ZW0uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudEZvcm1hdCA9IGl0ZW0uY29udGVudEZvcm1hdDtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgY29udGVudCBiYXNlZCBvbiBmb3JtYXQgYW5kIHNhbml0aXplXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvbnRlbnQgPSBwcm9jZXNzQ29udGVudChjb250ZW50VmFsdWUsIGNvbnRlbnRGb3JtYXQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHZhbGlkYXRpb24gd2FybmluZ3MgKG9ubHkgZm9yIEhUTUwgZm9ybWF0KVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB3YXJuaW5ncyA9IGdldENvbnRlbnRXYXJuaW5ncyhjb250ZW50VmFsdWUsIGNvbnRlbnRGb3JtYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGV0YWlsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aW5kZXh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW1cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1pdGVtLS1leHBhbmRlZFwiOiBpc0V4cGFuZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Blbj17aXNFeHBhbmRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiLS1hbmltYXRpb24tZHVyYXRpb25cIjogYCR7YW5pbWF0aW9uRHVyYXRpb24gfHwgMzAwfW1zYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIFJlYWN0LkNTU1Byb3BlcnRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN1bW1hcnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tc3VtbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVJdGVtKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlIGtleWJvYXJkIG5hdmlnYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiIHx8IGUua2V5ID09PSBcIiBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVJdGVtKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPXtpc0V4cGFuZGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLWl0ZW0tc3VtbWFyeS10ZXh0XCI+e3N1bW1hcnlWYWx1ZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tc3VtbWFyeS1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2VkaXRNb2RlICYmIGlzRWRpdGluZ0VuYWJsZWQgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxGQVFJdGVtQWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkVkaXQ9eygpID0+IGhhbmRsZUVkaXRJdGVtKGluZGV4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EZWxldGU9eygpID0+IGhhbmRsZURlbGV0ZUl0ZW0oaW5kZXgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbk1vdmVVcD17KCkgPT4gaGFuZGxlTW92ZVVwKGluZGV4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3ZlRG93bj17KCkgPT4gaGFuZGxlTW92ZURvd24oaW5kZXgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5Nb3ZlVXA9e2luZGV4ID4gMH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuTW92ZURvd249e2luZGV4IDwgaXRlbXMubGVuZ3RoIC0gMX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW0taWNvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZmFxLWl0ZW0taWNvbi0tZXhwYW5kZWRcIjogaXNFeHBhbmRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9XCIxNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD1cIjE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw9XCJub25lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZD1cIk00IDZMOCAxMEwxMiA2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aD1cIjJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3YXJuaW5ncy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0td2FybmluZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubWFwKCh3YXJuaW5nLCB3SW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3dJbmRleH0gY2xhc3NOYW1lPVwiZmFxLWl0ZW0td2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pqg77iPIHt3YXJuaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtaXRlbS1jb250ZW50LWlubmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogcHJvY2Vzc2VkQ29udGVudCB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBFZGl0IEZvcm0gTW9kYWwgKi99XG4gICAgICAgICAgICB7ZWRpdGluZ0l0ZW1JbmRleCAhPT0gbnVsbCAmJiBpdGVtc1tlZGl0aW5nSXRlbUluZGV4XSAmJiAoXG4gICAgICAgICAgICAgICAgPEVkaXRGQVFGb3JtXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk9e2l0ZW1zW2VkaXRpbmdJdGVtSW5kZXhdLnN1bW1hcnl9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9e2l0ZW1zW2VkaXRpbmdJdGVtSW5kZXhdLmNvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdD17aXRlbXNbZWRpdGluZ0l0ZW1JbmRleF0uY29udGVudEZvcm1hdH1cbiAgICAgICAgICAgICAgICAgICAgb25TYXZlPXtoYW5kbGVTYXZlRWRpdH1cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbEVkaXR9XG4gICAgICAgICAgICAgICAgICAgIGlzTmV3PXtmYWxzZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgey8qIENyZWF0ZSBGb3JtIE1vZGFsICovfVxuICAgICAgICAgICAge3Nob3dDcmVhdGVGb3JtICYmIChcbiAgICAgICAgICAgICAgICA8RWRpdEZBUUZvcm1cbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeT1cIlwiXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9XCJcIlxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ9XCJodG1sXCJcbiAgICAgICAgICAgICAgICAgICAgb25TYXZlPXtoYW5kbGVTYXZlTmV3fVxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17aGFuZGxlQ2FuY2VsRWRpdH1cbiAgICAgICAgICAgICAgICAgICAgaXNOZXc9e3RydWV9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHsvKiBEZWxldGUgQ29uZmlybWF0aW9uIERpYWxvZyAqL31cbiAgICAgICAgICAgIDxDb25maXJtRGlhbG9nXG4gICAgICAgICAgICAgICAgaXNPcGVuPXtkZWxldGVDb25maXJtSW5kZXggIT09IG51bGx9XG4gICAgICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgRkFRIEl0ZW1cIlxuICAgICAgICAgICAgICAgIG1lc3NhZ2U9XCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgRkFRIGl0ZW0/IFRoaXMgYWN0aW9uIGNhbm5vdCBiZSB1bmRvbmUuXCJcbiAgICAgICAgICAgICAgICBvbkNvbmZpcm09e2hhbmRsZUNvbmZpcm1EZWxldGV9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbERlbGV0ZX1cbiAgICAgICAgICAgICAgICBjb25maXJtVGV4dD1cIkRlbGV0ZVwiXG4gICAgICAgICAgICAgICAgY2FuY2VsVGV4dD1cIkNhbmNlbFwiXG4gICAgICAgICAgICAgICAgaXNEZXN0cnVjdGl2ZT17dHJ1ZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iXSwibmFtZXMiOlsiaGFzT3duIiwiaGFzT3duUHJvcGVydHkiLCJjbGFzc05hbWVzIiwiY2xhc3NlcyIsImkiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJhcmciLCJhcHBlbmRDbGFzcyIsInBhcnNlVmFsdWUiLCJBcnJheSIsImlzQXJyYXkiLCJhcHBseSIsInRvU3RyaW5nIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaW5jbHVkZXMiLCJrZXkiLCJjYWxsIiwidmFsdWUiLCJuZXdDbGFzcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZWZhdWx0Iiwid2luZG93IiwiZW50cmllcyIsInNldFByb3RvdHlwZU9mIiwiaXNGcm96ZW4iLCJnZXRQcm90b3R5cGVPZiIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImZyZWV6ZSIsInNlYWwiLCJjcmVhdGUiLCJjb25zdHJ1Y3QiLCJSZWZsZWN0IiwieCIsImZ1bmMiLCJ0aGlzQXJnIiwiX2xlbiIsImFyZ3MiLCJfa2V5IiwiRnVuYyIsIl9sZW4yIiwiX2tleTIiLCJhcnJheUZvckVhY2giLCJ1bmFwcGx5IiwiZm9yRWFjaCIsImFycmF5TGFzdEluZGV4T2YiLCJsYXN0SW5kZXhPZiIsImFycmF5UG9wIiwicG9wIiwiYXJyYXlQdXNoIiwicHVzaCIsImFycmF5U3BsaWNlIiwic3BsaWNlIiwic3RyaW5nVG9Mb3dlckNhc2UiLCJTdHJpbmciLCJ0b0xvd2VyQ2FzZSIsInN0cmluZ1RvU3RyaW5nIiwic3RyaW5nTWF0Y2giLCJtYXRjaCIsInN0cmluZ1JlcGxhY2UiLCJyZXBsYWNlIiwic3RyaW5nSW5kZXhPZiIsImluZGV4T2YiLCJzdHJpbmdUcmltIiwidHJpbSIsIm9iamVjdEhhc093blByb3BlcnR5IiwicmVnRXhwVGVzdCIsIlJlZ0V4cCIsInRlc3QiLCJ0eXBlRXJyb3JDcmVhdGUiLCJ1bmNvbnN0cnVjdCIsIlR5cGVFcnJvciIsImxhc3RJbmRleCIsIl9sZW4zIiwiX2tleTMiLCJfbGVuNCIsIl9rZXk0IiwiYWRkVG9TZXQiLCJzZXQiLCJhcnJheSIsInRyYW5zZm9ybUNhc2VGdW5jIiwidW5kZWZpbmVkIiwibCIsImVsZW1lbnQiLCJsY0VsZW1lbnQiLCJjbGVhbkFycmF5IiwiaW5kZXgiLCJpc1Byb3BlcnR5RXhpc3QiLCJjbG9uZSIsIm9iamVjdCIsIm5ld09iamVjdCIsInByb3BlcnR5IiwiY29uc3RydWN0b3IiLCJsb29rdXBHZXR0ZXIiLCJwcm9wIiwiZGVzYyIsImdldCIsImZhbGxiYWNrVmFsdWUiLCJMIiwiYXN5bmMiLCJicmVha3MiLCJleHRlbnNpb25zIiwiZ2ZtIiwiaG9va3MiLCJwZWRhbnRpYyIsInJlbmRlcmVyIiwic2lsZW50IiwidG9rZW5pemVyIiwid2Fsa1Rva2VucyIsIlQiLCJaIiwidSIsIkRPTVB1cmlmeSIsIm1hcmtlZCIsIl9qc3hzIiwiX2pzeCIsIl9GcmFnbWVudCIsInVzZVN0YXRlIiwidXNlTWVtbyIsInVzZUVmZmVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FLQTs7Q0FFQyxFQUFBLENBQVksWUFBQTs7Q0FHWixJQUFBLElBQUlBLE1BQU0sR0FBRyxFQUFFLENBQUNDLGNBQWMsQ0FBQTtLQUU5QixTQUFTQyxVQUFVQSxHQUFJO09BQ3RCLElBQUlDLE9BQU8sR0FBRyxFQUFFLENBQUE7Q0FFaEIsTUFBQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0MsU0FBUyxD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QWEsQ0FBQTtDQUN0QixDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NDOU1PLFNBQVNDLElBQTRHO0dBQzFILE9BQU87Q0FDTEMsSUFBQUEsS0FBQSxFQUFPLENBQUEsQ0FBQTtDQUNQQyxJQUFBQSxNQUFBLEVBQVEsQ0FBQSxDQUFBO0NBQ1JDLElBQUFBLFVBQUEsRUFBWSxJQUFBO0NBQ1pDLElBQUFBLEdBQUEsRUFBSyxDQUFBLENBQUE7Q0FDTEMsSUFBQUEsS0FBQSxFQUFPLElBQUE7Q0FDUEMsSUFBQUEsUUFBQSxFQUFVLENBQUEsQ0FBQTtDQUNWQyxJQUFBQSxRQUFBLEVBQVUsSUFBQTtDQUNWQyxJQUFBQSxNQUFBLEVBQVEsQ0FBQSxDQUFBO0NBQ1JDLElBQUFBLFNBQUEsRUFBVyxJQUFBO0NBQ1hDLElBQUFBLFVBQUEsRUFBWSxJQUFBO0lBRWhCLENBQUE7Q0FBQSxDQUFBO0NBRU8sSUFBSUMsQ0FBQSxHQUFxQ1gsQ0FBQSxFQUFhLENBQUE7Q0FFdEQsU0FBU1ksQ0FBQUEsQ0FBK0RDLENBQUEsRUFBMEQ7Q0FDdklGLEVBQUFBLENBQUEsR0FBWUUsQ0FDZCxDQUFBO0NBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
