if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target, firstSource) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  // Yes, there's really no need for `Object.defineProperty` here
  NodeList.prototype.forEach = Array.prototype.forEach
  if (typeof Symbol !== 'undefined' && Symbol.iterator && !NodeList.prototype[Symbol.iterator]) {
    Object.defineProperty(NodeList.prototype, Symbol.iterator, {
      value: Array.prototype[Symbol.itereator],
      writable: true,
      configurable: true
    })
  }
}

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

})));

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
      typeof define === 'function' && define.amd ? define(['exports'], factory) :
          (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
        'FileReader' in self &&
        'Blob' in self &&
        (function() {
          try {
            new Blob();
            return true
          } catch (e) {
            return false
          }
        })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
        ArrayBuffer.isView ||
        function(obj) {
          return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
        };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

// CustomEvent micro-polyfill for Internet Explorer (Required for LazyLoad)
;(function () {
  if (typeof window.CustomEvent === 'function') {
    return false
  }

  function CustomEvent(event, params) {
    params = params || {bubbles: false, cancelable: false, detail: undefined}
    var evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
    return evt
  }

  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent
})()

"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

;

(function (window) {
  if (!!window.BX) {
    return;
  }

  var BX = {};
  BX.type = {
    isString: function isString(item) {
      return item === '' ? true : item ? typeof item == 'string' || item instanceof String : false;
    },
    isNotEmptyString: function isNotEmptyString(item) {
      return BX.type.isString(item) ? item.length > 0 : false;
    },
    isBoolean: function isBoolean(item) {
      return item === true || item === false;
    },
    isNumber: function isNumber(item) {
      return item === 0 ? true : item ? typeof item == 'number' || item instanceof Number : false;
    },
    isFunction: function isFunction(item) {
      return item === null ? false : typeof item == 'function' || item instanceof Function;
    },
    isElementNode: function isElementNode(item) {
      //document.body.ELEMENT_NODE;
      return item && _typeof(item) == 'object' && 'nodeType' in item && item.nodeType == 1 && item.tagName && item.tagName.toUpperCase() != 'SCRIPT' && item.tagName.toUpperCase() != 'STYLE' && item.tagName.toUpperCase() != 'LINK';
    },
    isDomNode: function isDomNode(item) {
      return item && _typeof(item) == 'object' && 'nodeType' in item;
    },
    isArray: function isArray(item) {
      return item && Object.prototype.toString.call(item) == '[object Array]';
    },
    isDate: function isDate(item) {
      return item && Object.prototype.toString.call(item) == '[object Date]';
    },
    isNotEmptyObject: function isNotEmptyObject(item) {
      for (var i in item) {
        if (item.hasOwnProperty(i)) return true;
      }

      return false;
    }
  };

  BX.ajax = function () {};

  BX.showWait = function () {};

  BX.closeWait = function () {};

  window.BX = BX;
})(window);
"use strict";

var createElementFromHTML = function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim(); // Change this to div.childNodes to support multiple top-level nodes

  return div.firstChild;
};
"use strict";

var getScrollBarWidth = function getScrollBarWidth() {
  var inner = document.createElement('p');
  inner.style.width = '100%';
  inner.style.height = '200px';
  var outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.left = '0px';
  outer.style.visibility = 'hidden';
  outer.style.width = '200px';
  outer.style.height = '150px';
  outer.style.overflow = 'hidden';
  outer.appendChild(inner);
  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 === w2) w2 = outer.clientWidth;
  document.body.removeChild(outer);
  return w1 - w2;
};
"use strict";

var getStyle = function getStyle(el, styleProp) {
  var value,
      defaultView = (el.ownerDocument || document).defaultView; // W3C standard way:

  if (defaultView && defaultView.getComputedStyle) {
    // sanitize property name to css notation
    // (hypen separated words eg. font-Size)
    styleProp = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase();
    return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  } else if (el.currentStyle) {
    // IE
    // sanitize property name to camelCase
    styleProp = styleProp.replace(/\-(\w)/g, function (str, letter) {
      return letter.toUpperCase();
    });
    value = el.currentStyle[styleProp]; // convert other units to pixels on IE

    if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
      return function (value) {
        var oldLeft = el.style.left,
            oldRsLeft = el.runtimeStyle.left;
        el.runtimeStyle.left = el.currentStyle.left;
        el.style.left = value || 0;
        value = el.style.pixelLeft + 'px';
        el.style.left = oldLeft;
        el.runtimeStyle.left = oldRsLeft;
        return value;
      }(value);
    }

    return value;
  }
};
"use strict";

var getWindowWidth = function getWindowWidth() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};
"use strict";

var loadScript = function loadScript(src, callback) {
  var s, r, t;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = src;

  s.onload = s.onreadystatechange = function () {
    //console.log( this.readyState ); //uncomment this line to see which ready states are called.
    if (!r && (!this.readyState || this.readyState === 'complete')) {
      r = true;

      if (BX.type.isFunction(callback)) {
        callback();
      }
    }
  };

  t = document.getElementsByTagName('script')[0];
  t.parentNode.insertBefore(s, t);
};
"use strict";

var legancy = {};
window.legancy = legancy;
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

;

(function (window) {
  var options = {},
      defaultOptions = {
    cache: true,
    // сохранять ли кеш запроса
    display: 'block',
    data: {},
    paddingRightElements: [],
    title: 'Окно',
    closeButton: true,
    onAfterAppend: null,
    onAfterOpen: null,
    onAfterClose: null
  };
  /**
   * Создаёт обёртку попапа
   * @returns {HTMLDivElement}
   */

  var createWrap = function createWrap(closeButton) {
    var wrap = document.createElement('div');
    wrap.dataset.close = 'true';
    wrap.classList.add('popup');
    wrap.innerHTML = "\n    <div class=\"popup__wrap\">\n    ".concat(closeButton ? '<div class="popup__close" data-close="true"><span class="popup__close_1"></span><span class="popup__close_2"></span></div>' : '', "\n    <div class=\"popup__content-wrap\"><h3 class=\"popup__title\"></h3></div>\n    </div>");
    return wrap;
  };
  /**
   * Установка паддингов, чтобы элементы не прыгали при скрытии скрола у body
   * @param padding
   */


  var setPadding = function setPadding(padding) {
    window.document.body.style.overflowY = padding ? 'hidden' : 'scroll';
    window.document.body.style.paddingRight = padding;

    if (!BX.type.isArray(options.paddingRightElements)) {
      return;
    }

    for (var i in options.paddingRightElements) {
      var selector = options.paddingRightElements[i],
          nodeList = document.querySelectorAll(selector);

      if (!nodeList.length) {
        continue;
      }

      for (var j in nodeList) {
        var currentElement = nodeList[j];

        if (!BX.type.isElementNode(currentElement)) {
          continue;
        }

        currentElement.style.paddingRight = padding;
      }
    }
  };
  /**
   * Возвращает объект попапа
   *
   * @param params
   * @returns {{close(): void, open(): void}}
   */


  window.legancyPopup = function (params) {
    params = _typeof(params) === 'object' ? params : {};
    options = Object.assign({}, defaultOptions, params);
    var promise,
        content = options.content,
        wrap = createWrap(options.closeButton);

    if (typeof content === 'string') {
      if (content.indexOf('/') >= 0 || options.ajax === true) {
        promise = fetch(content).then(function (value) {
          return value.ok ? value.text() : '404 Not found';
        }, function (error) {
          return 'Check your internet connection';
        });
      } else {
        promise = new Promise(function (resolve, reject) {
          var popupElement = document.querySelector(content);

          if (BX.type.isElementNode(popupElement)) {
            resolve(popupElement.innerHTML);
          } else {
            reject('Selector content not found');
          }
        });
      }
    } else if (BX.type.isElementNode(content)) {
      promise = new Promise(function (resolve) {
        resolve(content.innerHTML);
      });
    } else {
      promise = new Promise(function (resolve) {
        resolve('Content Type Not Supported');
      });
    }

    var elem = wrap.querySelector('.popup__content-wrap');

    if (options.title === false || !options.title) {
      elem.removeChild(elem.querySelector('.popup__title'));
    } else {
      elem.querySelector('.popup__title').innerHTML = options.title;
    }

    promise.then(function (result) {
      elem.insertAdjacentHTML('beforeend', result);
      document.body.appendChild(wrap);

      if (typeof params.onAfterAppend === 'function') {
        params.onAfterAppend(wrap);
      }
    }, function (error) {
      elem.insertAdjacentHTML('afterBegin', 'Something went wrong');
      console.log(error);
    });
    var closing = false;
    var ANIMATION_SPEED = 200;

    var escClickHandler = function escClickHandler(evt) {
      if (evt.keyCode === 27) {
        methods.close();
      }
    };
    /**
     * @type {{close(): void, open(): void}}
     */


    var methods = {
      open: function open() {
        !closing && wrap.classList.add('popup_open');
        setPadding(getScrollBarWidth() + 'px');
        document.addEventListener('keydown', escClickHandler);

        if (typeof params.onAfterOpen === 'function') {
          params.onAfterOpen(wrap);
        }
      },
      close: function close() {
        closing = true;
        wrap.classList.remove('popup_open');
        wrap.classList.add('popup_hide');
        setTimeout(function () {
          wrap.classList.remove('popup_hide');
          setPadding(0);
          document.removeEventListener('keydown', escClickHandler);
          closing = false;
        }, ANIMATION_SPEED);

        if (typeof params.onAfterClose === 'function') {
          params.onAfterClose(wrap);
        }
      }
    };
    wrap.addEventListener('click', function (ev) {
      if (ev.target.dataset.close) {
        methods.close();
      }
    });
    return methods;
  };
  /**
   * Чтобы не передавать options при каждом открытии попапа
   * можно заранее назначить некоторые опции
   *
   * @param params
   */


  window.legancyPopupInit = function (params) {
    params = _typeof(params) === 'object' ? params : {};
    defaultOptions = Object.assign({}, defaultOptions, params);
  };
})(window);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// Scroll top
legancy.scrollTop = function (options) {
  options = _typeof(options) === 'object' ? options : {};
  var scroll = document.createElement('div');
  scroll.classList.add('scroll-top');
  scroll.innerHTML = '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 32h62M50 20l12 12-12 12" stroke="#c5a262" stroke-width="2"/></svg>';
  scroll.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  var showTop = options.showTop || 500;

  var scrollTop = function scrollTop() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > showTop) {
      scroll.classList.add('scroll-top_show');
    } else {
      scroll.classList.remove('scroll-top_show');
    }
  };

  document.addEventListener('DOMContentLoaded', scrollTop);
  window.addEventListener('scroll', scrollTop);
  return {
    init: function init() {
      document.body.appendChild(scroll);
    },
    destroy: function destroy() {
      document.body.removeChild(scroll);
      window.removeEventListener('scroll', scrollTop);
    }
  };
};
"use strict";

// Слайдер видео
;

(function () {
  var videoSliders = document.querySelectorAll('.js-slider-video');

  if (videoSliders.length) {
    videoSliders.forEach(function (videoSlider) {
      var container = videoSlider.querySelector('.swiper-container');
      var next = videoSlider.querySelector('.swiper-button-next');
      var prev = videoSlider.querySelector('.swiper-button-prev');
      var settingsSlider = {
        direction: 'horizontal',
        loop: false,
        navigation: {
          nextEl: next,
          prevEl: prev
        },
        slidesPerView: 1
      };
      var swiper = new Swiper(container, settingsSlider);
    });
  }

  var sliderImgSmiles = document.querySelectorAll('.js-slider-img-smile');

  if (sliderImgSmiles.length) {
    sliderImgSmiles.forEach(function (sliderImgSmile) {
      var container = sliderImgSmile.querySelector('.swiper-container');
      var next = sliderImgSmile.querySelector('.swiper-button-next');
      var prev = sliderImgSmile.querySelector('.swiper-button-prev');
      var settingsSlider = {
        direction: 'horizontal',
        loop: false,
        navigation: {
          nextEl: next,
          prevEl: prev
        },
        slidesPerView: 3
      };
      var swiper = new Swiper(container, settingsSlider);
    });
  }

  var sliderImgBigs = document.querySelectorAll('.js-slider-img-big');

  if (sliderImgBigs.length) {
    sliderImgBigs.forEach(function (sliderImgBig) {
      var container = sliderImgBig.querySelector('.swiper-container');
      var next = sliderImgBig.querySelector('.swiper-button-next');
      var prev = sliderImgBig.querySelector('.swiper-button-prev');
      var settingsSlider = {
        direction: 'horizontal',
        loop: false,
        navigation: {
          nextEl: next,
          prevEl: prev
        },
        slidesPerView: 1
      };
      var swiper = new Swiper(container, settingsSlider);
    });
  }
})();
"use strict";

;

(function () {
  function animateTriangle(approach) {
    var horizontalLine = approach.querySelector('.js-horizontal-line');
    var verticalLine = approach.querySelector('.js-vertica-line');
    horizontalLine.classList.add('animate');
    verticalLine.classList.add('animate');
  }

  document.addEventListener('scroll', onScroll);

  function onScroll() {
    var approach = document.querySelector('.js-approach');

    if (approach) {
      var posTop = approach.getBoundingClientRect().top;

      if (posTop + approach.clientHeight / 2 <= window.innerHeight && posTop >= 0) {
        animateTriangle(approach);
        document.removeEventListener('scroll', onScroll);
      }
    }
  }
})();
"use strict";

function validation(input) {
  var validationStatus;
  var rules = {
    name: {
      required: true,
      rule: false,
      errorText: false
    },
    phone: {
      required: true,
      rule: '^((8|\\+7)[\\- ]?)?(\\(?\\d{3}\\)?[\\- ]?)?[\\d\\- ]{7,10}$',
      errorText: 'Некоректный номер телефона'
    },
    mail: {
      required: true,
      rule: '^([a-z0-9_-]+\\.)*[a-z0-9_-]+@[a-z0-9_-]+(\\.[a-z0-9_-]+)*\\.[a-z]{2,6}$',
      errorText: 'Некоректный mail'
    }
  };
  var errorSpan = input.parentElement.querySelector('.valid-error-span');
  var name = input.dataset.validated_name;
  var value = input.value;
  var result = validate(name, value);

  if (result) {
    innerHtmlError(result, input, errorSpan);
    validationStatus = false;
  } else {
    innerHtmlSucces(errorSpan);
    validationStatus = true;
  }

  function innerHtmlError(errorText, input, errorSpan) {
    var wrap = document.createElement('span');
    wrap.classList.add('valid-error-span');
    wrap.innerHTML = errorText;

    if (errorSpan) {
      errorSpan.remove();
    }

    input.after(wrap);
  }

  function innerHtmlSucces(errorSpan) {
    if (errorSpan) {
      errorSpan.remove();
    }
  }

  function validate(name, value) {
    var required = rules[name].required;

    if (value !== "") {
      if (required) {
        var regex = new RegExp(rules[name].rule);
        var test = regex.test(value);

        if (!test) {
          return rules[name].errorText;
        }
      }
    } else {
      if (required) {
        return 'Заполните поле';
      }
    }
  }

  return validationStatus;
}

function checkingBeforeSending(buttonSubmit) {
  var inputs = buttonSubmit.closest('form').querySelectorAll('.js-validated-field');
  inputs.forEach(function (input) {
    var result = validation(input);
  });
}

function validationReplay(input) {
  var errorSpan = input.parentElement.querySelector('.valid-error-span');

  if (errorSpan) {
    errorSpan.remove();
  }
}
"use strict";

// LazyLoad
;

(function () {
  // Set the options to make LazyLoad self-initialize
  window.lazyLoadOptions = {
    elements_selector: '.lazy' // ... more custom settings?

  }; // Listen to the initialization event and get the instance of LazyLoad

  window.addEventListener('LazyLoad::Initialized', function (event) {
    window.lazyLoadInstance = event.detail.instance;
    window.lazyLoadInstance.update();
  }, false);
})() // Scroll top
;

(function () {
  var scrollTop = legancy.scrollTop();
  scrollTop.init();
})() // SVG
;

(function () {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/svg4everybody/2.1.9/svg4everybody.min.js', function () {
    svg4everybody();
  });
})();

(function () {
  // mobile menu
  document.addEventListener('DOMContentLoaded', function () {
    mobileMenu();
  });
  window.addEventListener('resize', function () {
    mobileMenu();
  }); // Мобильное меню

  function mobileMenu() {
    var burger = document.querySelector('.header__burger');

    if (burger) {
      var header = document.querySelector('.header');
      var body = document.body;

      if (body.clientWidth < 1226) {
        //По умолчанию открытое меню
        header.classList.add('nav-mobile', 'nav-mobile_close');

        burger.onclick = function () {
          if (header.classList.contains('nav-mobile_open')) {
            header.classList.remove('nav-mobile_open');
            header.classList.add('nav-mobile_close');
            body.classList.remove('no-scroll');
          } else {
            header.classList.remove('nav-mobile_close');
            header.classList.add('nav-mobile_open');
            body.classList.add('no-scroll');
          }
        };
      } else {
        header.classList.remove('nav-mobile', 'nav-mobile_close');
      }
    }
  }
})() // popups
;

(function () {
  var servicesPopup = function servicesPopup(el) {
    var popup = legancyPopup({
      content: document.querySelector('#popup-services'),
      title: false,
      onAfterAppend: function onAfterAppend(result) {}
    });
    popup.open();
  };

  var feedbackPopup = legancyPopup({
    content: document.querySelector('#popup-feedback'),
    title: 'ЗАПИСАТЬСЯ НА ОНЛАЙН ВСТРЕЧУ',
    onAfterAppend: function onAfterAppend() {
      initMaskPhone();
      var formAll = document.querySelectorAll('.js-validated-form');

      if (formAll.length) {
        formAll.forEach(function (form) {
          var buttonSubmit = form.querySelector('.js-button-submit');
          buttonSubmit.addEventListener('click', function () {
            checkingBeforeSending(buttonSubmit);
          });
          var validatedFieldList = form.querySelectorAll('.js-validated-field');

          if (validatedFieldList.length) {
            validatedFieldList.forEach(function (validatedField) {
              validatedField.addEventListener('focus', function () {
                validationReplay(validatedField);
              });
              validatedField.addEventListener('blur', function () {
                validation(validatedField);
              });
            });
          }
        });
      }
    }
  });
  var calculateProjectPopup = legancyPopup({
    content: document.querySelector('#popup-calculate-project'),
    title: 'РАССЧИТАТЬ ПРОЕКТ',
    onAfterAppend: function onAfterAppend() {
      initMaskPhone();
      /* На валидируемую форму навесить класс js-validated-form
           Если необходимо дополнительно валидировать перед отправлением то на кнопку класс js-button-submit
           На валидируемый инпут навесить класс js-validated-field и атрибут data-validated_name="NAME" где NAME соответствует правилу rules.NAME*/

      var formAll = document.querySelectorAll('.js-validated-form');

      if (formAll.length) {
        formAll.forEach(function (form) {
          var buttonSubmit = form.querySelector('.js-button-submit');
          buttonSubmit.addEventListener('click', function () {
            checkingBeforeSending(buttonSubmit);
          });
          var validatedFieldList = form.querySelectorAll('.js-validated-field');

          if (validatedFieldList.length) {
            validatedFieldList.forEach(function (validatedField) {
              validatedField.addEventListener('focus', function () {
                validationReplay(validatedField);
              });
              validatedField.addEventListener('blur', function () {
                validation(validatedField);
              });
            });
          }
        });
      }
    }
  });
  var popupsTriggers = document.querySelectorAll('[data-popup]');
  popupsTriggers.forEach(function (el) {
    switch (el.dataset.popup) {
      case 'services-popup':
        el.addEventListener('click', function (event) {
          event.preventDefault(); //const idEl = el.href;

          servicesPopup(el);
        });
        break;

      case 'feedback-popup':
        el.addEventListener('click', function () {
          feedbackPopup.open();
        });
        break;

      case 'calculate-project-popup':
        el.addEventListener('click', function () {
          calculateProjectPopup.open();
        });
        break;
    }
  }); // Маска на телефон

  function initMaskPhone() {
    var inputPhoneAll = document.querySelectorAll('.mask-phone-js');
    var im = new Inputmask({
      "mask": "+7 (999) 999-99-99",
      showMaskOnHover: false
    });

    if (inputPhoneAll.length) {
      inputPhoneAll.forEach(function (el) {
        im.mask(el);
      });
    }
  }
})();