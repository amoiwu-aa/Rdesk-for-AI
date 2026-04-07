function _mergeNamespaces(n2, m2) {
  for (var i = 0; i < m2.length; i++) {
    const e = m2[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k2 in e) {
        if (k2 !== "default" && !(k2 in n2)) {
          const d = Object.getOwnPropertyDescriptor(e, k2);
          if (d) {
            Object.defineProperty(n2, k2, d.get ? d : {
              enumerable: true,
              get: () => e[k2]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n2, Symbol.toStringTag, { value: "Module" }));
}
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1 = Symbol.for("react.element"), n$1 = Symbol.for("react.portal"), p$2 = Symbol.for("react.fragment"), q$1 = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v$1 = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$1(a) {
  if (null === a || "object" !== typeof a) return null;
  a = z$1 && a[z$1] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$1 = {};
function E$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a, b) {
  if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a, b, "setState");
};
E$1.prototype.forceUpdate = function(a) {
  this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
var H$1 = G$1.prototype = new F();
H$1.constructor = G$1;
C$1(H$1, E$1.prototype);
H$1.isPureReactComponent = true;
var I$1 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$1 = { key: true, ref: true, __self: true, __source: true };
function M$1(a, b, e) {
  var d, c = {}, k2 = null, h = null;
  if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k2 = "" + b.key), b) J.call(b, d) && !L$1.hasOwnProperty(d) && (c[d] = b[d]);
  var g = arguments.length - 2;
  if (1 === g) c.children = e;
  else if (1 < g) {
    for (var f2 = Array(g), m2 = 0; m2 < g; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
  return { $$typeof: l$1, type: a, key: k2, ref: h, props: c, _owner: K$1.current };
}
function N$1(a, b) {
  return { $$typeof: l$1, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
}
function O$1(a) {
  return "object" === typeof a && null !== a && a.$$typeof === l$1;
}
function escape(a) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a.replace(/[=:]/g, function(a2) {
    return b[a2];
  });
}
var P$1 = /\/+/g;
function Q$1(a, b) {
  return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R$1(a, b, e, d, c) {
  var k2 = typeof a;
  if ("undefined" === k2 || "boolean" === k2) a = null;
  var h = false;
  if (null === a) h = true;
  else switch (k2) {
    case "string":
    case "number":
      h = true;
      break;
    case "object":
      switch (a.$$typeof) {
        case l$1:
        case n$1:
          h = true;
      }
  }
  if (h) return h = a, c = c(h), a = "" === d ? "." + Q$1(h, 0) : d, I$1(c) ? (e = "", null != a && (e = a.replace(P$1, "$&/") + "/"), R$1(c, b, e, "", function(a2) {
    return a2;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P$1, "$&/") + "/") + a)), b.push(c)), 1;
  h = 0;
  d = "" === d ? "." : d + ":";
  if (I$1(a)) for (var g = 0; g < a.length; g++) {
    k2 = a[g];
    var f2 = d + Q$1(k2, g);
    h += R$1(k2, b, e, f2, c);
  }
  else if (f2 = A$1(a), "function" === typeof f2) for (a = f2.call(a), g = 0; !(k2 = a.next()).done; ) k2 = k2.value, f2 = d + Q$1(k2, g++), h += R$1(k2, b, e, f2, c);
  else if ("object" === k2) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h;
}
function S$1(a, b, e) {
  if (null == a) return a;
  var d = [], c = 0;
  R$1(a, d, "", "", function(a2) {
    return b.call(e, a2, c++);
  });
  return d;
}
function T$1(a) {
  if (-1 === a._status) {
    var b = a._result;
    b = b();
    b.then(function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
    }, function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
    });
    -1 === a._status && (a._status = 0, a._result = b);
  }
  if (1 === a._status) return a._result.default;
  throw a._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
function X$1() {
  throw Error("act(...) is not supported in production builds of React.");
}
react_production_min.Children = { map: S$1, forEach: function(a, b, e) {
  S$1(a, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a) {
  var b = 0;
  S$1(a, function() {
    b++;
  });
  return b;
}, toArray: function(a) {
  return S$1(a, function(a2) {
    return a2;
  }) || [];
}, only: function(a) {
  if (!O$1(a)) throw Error("React.Children.only expected to receive a single React element child.");
  return a;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$2;
react_production_min.Profiler = r;
react_production_min.PureComponent = G$1;
react_production_min.StrictMode = q$1;
react_production_min.Suspense = w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.act = X$1;
react_production_min.cloneElement = function(a, b, e) {
  if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
  var d = C$1({}, a.props), c = a.key, k2 = a.ref, h = a._owner;
  if (null != b) {
    void 0 !== b.ref && (k2 = b.ref, h = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$1.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d.children = e;
  else if (1 < f2) {
    g = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g[m2] = arguments[m2 + 2];
    d.children = g;
  }
  return { $$typeof: l$1, type: a.type, key: c, ref: k2, props: d, _owner: h };
};
react_production_min.createContext = function(a) {
  a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a.Provider = { $$typeof: t, _context: a };
  return a.Consumer = a;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a) {
  var b = M$1.bind(null, a);
  b.type = a;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a) {
  return { $$typeof: v$1, render: a };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a) {
  return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T$1 };
};
react_production_min.memo = function(a, b) {
  return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = X$1;
react_production_min.useCallback = function(a, b) {
  return U$1.current.useCallback(a, b);
};
react_production_min.useContext = function(a) {
  return U$1.current.useContext(a);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a) {
  return U$1.current.useDeferredValue(a);
};
react_production_min.useEffect = function(a, b) {
  return U$1.current.useEffect(a, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a, b, e) {
  return U$1.current.useImperativeHandle(a, b, e);
};
react_production_min.useInsertionEffect = function(a, b) {
  return U$1.current.useInsertionEffect(a, b);
};
react_production_min.useLayoutEffect = function(a, b) {
  return U$1.current.useLayoutEffect(a, b);
};
react_production_min.useMemo = function(a, b) {
  return U$1.current.useMemo(a, b);
};
react_production_min.useReducer = function(a, b, e) {
  return U$1.current.useReducer(a, b, e);
};
react_production_min.useRef = function(a) {
  return U$1.current.useRef(a);
};
react_production_min.useState = function(a) {
  return U$1.current.useState(a);
};
react_production_min.useSyncExternalStore = function(a, b, e) {
  return U$1.current.useSyncExternalStore(a, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.3.1";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
const React$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: React
}, [reactExports]);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = reactExports, k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m$1 = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p$1 = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a) m$1.call(a, b) && !p$1.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports$1) {
  function f2(a, b) {
    var c = a.length;
    a.push(b);
    a: for (; 0 < c; ) {
      var d = c - 1 >>> 1, e = a[d];
      if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
      else break a;
    }
  }
  function h(a) {
    return 0 === a.length ? null : a[0];
  }
  function k2(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
      a[0] = c;
      a: for (var d = 0, e = a.length, w2 = e >>> 1; d < w2; ) {
        var m2 = 2 * (d + 1) - 1, C2 = a[m2], n2 = m2 + 1, x2 = a[n2];
        if (0 > g(C2, c)) n2 < e && 0 > g(x2, C2) ? (a[d] = x2, a[n2] = c, d = n2) : (a[d] = C2, a[m2] = c, d = m2);
        else if (n2 < e && 0 > g(x2, c)) a[d] = x2, a[n2] = c, d = n2;
        else break a;
      }
    }
    return b;
  }
  function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports$1.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports$1.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a) {
    for (var b = h(t2); null !== b; ) {
      if (null === b.callback) k2(t2);
      else if (b.startTime <= a) k2(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h(t2);
    }
  }
  function H2(a) {
    B2 = false;
    G2(a);
    if (!A2) if (null !== h(r2)) A2 = true, I2(J2);
    else {
      var b = h(t2);
      null !== b && K2(H2, b.startTime - a);
    }
  }
  function J2(a, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h(r2); null !== v2 && (!(v2.expirationTime > b) || a && !M2()); ) {
        var d = v2.callback;
        if ("function" === typeof d) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d(v2.expirationTime <= b);
          b = exports$1.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h(r2) && k2(r2);
          G2(b);
        } else k2(r2);
        v2 = h(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports$1.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a = exports$1.unstable_now();
      Q2 = a;
      var b = true;
      try {
        b = O2(true, a);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a) {
    O2 = a;
    N2 || (N2 = true, S2());
  }
  function K2(a, b) {
    L2 = D2(function() {
      a(exports$1.unstable_now());
    }, b);
  }
  exports$1.unstable_IdlePriority = 5;
  exports$1.unstable_ImmediatePriority = 1;
  exports$1.unstable_LowPriority = 4;
  exports$1.unstable_NormalPriority = 3;
  exports$1.unstable_Profiling = null;
  exports$1.unstable_UserBlockingPriority = 2;
  exports$1.unstable_cancelCallback = function(a) {
    a.callback = null;
  };
  exports$1.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports$1.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a ? Math.floor(1e3 / a) : 5;
  };
  exports$1.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports$1.unstable_getFirstCallbackNode = function() {
    return h(r2);
  };
  exports$1.unstable_next = function(a) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_pauseExecution = function() {
  };
  exports$1.unstable_requestPaint = function() {
  };
  exports$1.unstable_runWithPriority = function(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a = 3;
    }
    var c = y2;
    y2 = a;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports$1.unstable_scheduleCallback = function(a, b, c) {
    var d = exports$1.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch (a) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a = { id: u2++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d ? (a.sortIndex = c, f2(t2, a), null === h(r2) && a === h(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d))) : (a.sortIndex = e, f2(r2, a), A2 || z2 || (A2 = true, I2(J2)));
    return a;
  };
  exports$1.unstable_shouldYield = M2;
  exports$1.unstable_wrapCallback = function(a) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p(a) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a, b) {
  ha(a, b);
  ha(a + "Capture", b);
}
function ha(a, b) {
  ea[a] = b;
  for (a = 0; a < b.length; a++) da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
  if (ja.call(ma, a)) return true;
  if (ja.call(la, a)) return false;
  if (ka.test(a)) return ma[a] = true;
  la[a] = true;
  return false;
}
function pa(a, b, c, d) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d) return false;
      if (null !== c) return !c.acceptsBooleans;
      a = a.toLowerCase().slice(0, 5);
      return "data-" !== a && "aria-" !== a;
    default:
      return false;
  }
}
function qa(a, b, c, d) {
  if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
  if (d) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v(a, b, c, d, e, f2, g) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
  z[a] = new v(a, 0, false, a, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
  var b = a[0];
  z[b] = new v(b, 1, false, a[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
  z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
  z[a] = new v(a, 2, false, a, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
  z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a) {
  z[a] = new v(a, 3, true, a, null, false, false);
});
["capture", "download"].forEach(function(a) {
  z[a] = new v(a, 4, false, a, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a) {
  z[a] = new v(a, 6, false, a, null, false, false);
});
["rowSpan", "start"].forEach(function(a) {
  z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
  return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
  var b = a.replace(
    ra,
    sa
  );
  z[b] = new v(b, 1, false, a, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
});
z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
});
function ta(a, b, c, d) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a) {
  if (null === a || "object" !== typeof a) return null;
  a = Ja && a[Ja] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a;
}
var Na = false;
function Oa(a, b) {
  if (!a || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d = l2;
      }
      Reflect.construct(a, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d = l2;
      }
      a.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d = l2;
      }
      a();
    }
  } catch (l2) {
    if (l2 && d && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e[g] !== f2[h]; ) h--;
      for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f2[h]) {
        if (1 !== g || 1 !== h) {
          do
            if (g--, h--, 0 > h || e[g] !== f2[h]) {
              var k2 = "\n" + e[g].replace(" at new ", " at ");
              a.displayName && k2.includes("<anonymous>") && (k2 = k2.replace("<anonymous>", a.displayName));
              return k2;
            }
          while (1 <= g && 0 <= h);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
  switch (a.tag) {
    case 5:
      return Ma(a.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a = Oa(a.type, false), a;
    case 11:
      return a = Oa(a.type.render, false), a;
    case 1:
      return a = Oa(a.type, true), a;
    default:
      return "";
  }
}
function Qa(a) {
  if (null == a) return null;
  if ("function" === typeof a) return a.displayName || a.name || null;
  if ("string" === typeof a) return a;
  switch (a) {
    case ya:
      return "Fragment";
    case wa:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a) switch (a.$$typeof) {
    case Ca:
      return (a.displayName || "Context") + ".Consumer";
    case Ba:
      return (a._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a.render;
      a = a.displayName;
      a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      return a;
    case Ga:
      return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
    case Ha:
      b = a._payload;
      a = a._init;
      try {
        return Qa(a(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a) {
  var b = a.type;
  switch (a.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a) {
  switch (typeof a) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a;
    case "object":
      return a;
    default:
      return "";
  }
}
function Ta(a) {
  var b = a.type;
  return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
  var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
  if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a2) {
      d = "" + a2;
      f2.call(this, a2);
    } });
    Object.defineProperty(a, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a2) {
      d = "" + a2;
    }, stopTracking: function() {
      a._valueTracker = null;
      delete a[b];
    } };
  }
}
function Va(a) {
  a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
  if (!a) return false;
  var b = a._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d = "";
  a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
  a = d;
  return a !== c ? (b.setValue(a), true) : false;
}
function Xa(a) {
  a = a || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a) return null;
  try {
    return a.activeElement || a.body;
  } catch (b) {
    return a.body;
  }
}
function Ya(a, b) {
  var c = b.checked;
  return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
}
function Za(a, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a, b) {
  b = b.checked;
  null != b && ta(a, "checked", b, false);
}
function bb(a, b) {
  ab(a, b);
  var c = Sa(b.value), d = b.type;
  if (null != c) if ("number" === d) {
    if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
  } else a.value !== "" + c && (a.value = "" + c);
  else if ("submit" === d || "reset" === d) {
    a.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d = b.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
    b = "" + a._wrapperState.initialValue;
    c || b === a.value || (a.value = b);
    a.defaultValue = b;
  }
  c = a.name;
  "" !== c && (a.name = "");
  a.defaultChecked = !!a._wrapperState.initialChecked;
  "" !== c && (a.name = c);
}
function cb(a, b, c) {
  if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
  a = a.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a.length; e++) {
      if (a[e].value === c) {
        a[e].selected = true;
        d && (a[e].defaultSelected = true);
        return;
      }
      null !== b || a[e].disabled || (b = a[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
  return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
}
function hb(a, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a._wrapperState = { initialValue: Sa(c) };
}
function ib(a, b) {
  var c = Sa(b.value), d = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
  null != d && (a.defaultValue = "" + d);
}
function jb(a) {
  var b = a.textContent;
  b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
  switch (a) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a, b) {
  return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a(b, c, d, e);
    });
  } : a;
}(function(a, b) {
  if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
    for (; b.firstChild; ) a.appendChild(b.firstChild);
  }
});
function ob(a, b) {
  if (b) {
    var c = a.firstChild;
    if (c && c === a.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a) {
  qb.forEach(function(b) {
    b = b + a.charAt(0).toUpperCase() + a.substring(1);
    pb[b] = pb[a];
  });
});
function rb(a, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
  a = a.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
    "float" === c && (c = "cssFloat");
    d ? a.setProperty(c, e) : a[c] = e;
  }
}
var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a, b) {
  if (b) {
    if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
  }
}
function vb(a, b) {
  if (-1 === a.indexOf("-")) return "string" === typeof b.is;
  switch (a) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a) {
  a = a.target || a.srcElement || window;
  a.correspondingUseElement && (a = a.correspondingUseElement);
  return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
  if (a = Cb(a)) {
    if ("function" !== typeof yb) throw Error(p(280));
    var b = a.stateNode;
    b && (b = Db(b), yb(a.stateNode, a.type, b));
  }
}
function Eb(a) {
  zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
}
function Fb() {
  if (zb) {
    var a = zb, b = Ab;
    Ab = zb = null;
    Bb(a);
    if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
  }
}
function Gb(a, b) {
  return a(b);
}
function Hb() {
}
var Ib = false;
function Jb(a, b, c) {
  if (Ib) return a(b, c);
  Ib = true;
  try {
    return Gb(a, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a, b) {
  var c = a.stateNode;
  if (null === c) return null;
  var d = Db(c);
  if (null === d) return null;
  c = d[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
      a = !d;
      break a;
    default:
      a = false;
  }
  if (a) return null;
  if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a) {
  Lb = false;
}
function Nb(a, b, c, d, e, f2, g, h, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
  Ob = true;
  Pb = a;
} };
function Tb(a, b, c, d, e, f2, g, h, k2) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f2, g, h, k2) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a) {
  var b = a, c = a;
  if (a.alternate) for (; b.return; ) b = b.return;
  else {
    a = b;
    do
      b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
    while (a);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a) {
  if (13 === a.tag) {
    var b = a.memoizedState;
    null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a) {
  if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
  var b = a.alternate;
  if (!b) {
    b = Vb(a);
    if (null === b) throw Error(p(188));
    return b !== a ? null : a;
  }
  for (var c = a, d = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d = e.return;
      if (null !== d) {
        c = d;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a;
        if (f2 === d) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p(188));
    }
    if (c.return !== d.return) c = e, d = f2;
    else {
      for (var g = false, h = e.child; h; ) {
        if (h === c) {
          g = true;
          c = e;
          d = f2;
          break;
        }
        if (h === d) {
          g = true;
          d = e;
          c = f2;
          break;
        }
        h = h.sibling;
      }
      if (!g) {
        for (h = f2.child; h; ) {
          if (h === c) {
            g = true;
            c = f2;
            d = e;
            break;
          }
          if (h === d) {
            g = true;
            d = f2;
            c = e;
            break;
          }
          h = h.sibling;
        }
        if (!g) throw Error(p(189));
      }
    }
    if (c.alternate !== d) throw Error(p(190));
  }
  if (3 !== c.tag) throw Error(p(188));
  return c.stateNode.current === c ? a : b;
}
function Zb(a) {
  a = Yb(a);
  return null !== a ? $b(a) : null;
}
function $b(a) {
  if (5 === a.tag || 6 === a.tag) return a;
  for (a = a.child; null !== a; ) {
    var b = $b(a);
    if (null !== b) return b;
    a = a.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
  a >>>= 0;
  return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
  switch (a & -a) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a;
  }
}
function uc(a, b) {
  var c = a.pendingLanes;
  if (0 === c) return 0;
  var d = 0, e = a.suspendedLanes, f2 = a.pingedLanes, g = c & 268435455;
  if (0 !== g) {
    var h = g & ~e;
    0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
  } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
  if (0 === d) return 0;
  if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d & 4) && (d |= c & 16);
  b = a.entangledLanes;
  if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
  return d;
}
function vc(a, b) {
  switch (a) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a, b) {
  for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f2 = a.pendingLanes; 0 < f2; ) {
    var g = 31 - oc(f2), h = 1 << g, k2 = e[g];
    if (-1 === k2) {
      if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
    } else k2 <= b && (a.expiredLanes |= h);
    f2 &= ~h;
  }
}
function xc(a) {
  a = a.pendingLanes & -1073741825;
  return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a;
}
function zc(a) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a);
  return b;
}
function Ac(a, b, c) {
  a.pendingLanes |= b;
  536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
  a = a.eventTimes;
  b = 31 - oc(b);
  a[b] = c;
}
function Bc(a, b) {
  var c = a.pendingLanes & ~b;
  a.pendingLanes = b;
  a.suspendedLanes = 0;
  a.pingedLanes = 0;
  a.expiredLanes &= b;
  a.mutableReadLanes &= b;
  a.entangledLanes &= b;
  b = a.entanglements;
  var d = a.eventTimes;
  for (a = a.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d[e] = -1;
    a[e] = -1;
    c &= ~f2;
  }
}
function Cc(a, b) {
  var c = a.entangledLanes |= b;
  for (a = a.entanglements; c; ) {
    var d = 31 - oc(c), e = 1 << d;
    e & b | a[d] & b && (a[d] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a) {
  a &= -a;
  return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
  switch (a) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a, b, c, d, e, f2) {
  if (null === a || a.nativeEvent !== f2) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
  a.eventSystemFlags |= d;
  b = a.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a;
}
function Uc(a, b, c, d, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a, b, c, d, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a, b, c, d, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a, b, c, d, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a, b, c, d, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a, b, c, d, e)), true;
  }
  return false;
}
function Vc(a) {
  var b = Wc(a.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a.blockedOn = b;
          Ic(a.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a.blockedOn = null;
}
function Xc(a) {
  if (null !== a.blockedOn) return false;
  for (var b = a.targetContainers; 0 < b.length; ) {
    var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
    if (null === c) {
      c = a.nativeEvent;
      var d = new c.constructor(c.type, c);
      wb = d;
      c.target.dispatchEvent(d);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a, b, c) {
  Xc(a) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a, b) {
  a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
  function b(b2) {
    return ad(b2, a);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a);
    for (var c = 1; c < Kc.length; c++) {
      var d = Kc[c];
      d.blockedOn === a && (d.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a);
  null !== Mc && ad(Mc, a);
  null !== Nc && ad(Nc, a);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = true;
function ed(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a, b, c, d) {
  if (dd) {
    var e = Yc(a, b, c, d);
    if (null === e) hd(a, b, d, id, c), Sc(a, d);
    else if (Uc(e, a, b, c, d)) d.stopPropagation();
    else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a, b, c, d);
        null === f2 && hd(a, b, d, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d.stopPropagation();
    } else hd(a, b, d, null, c);
  }
}
var id = null;
function Yc(a, b, c, d) {
  id = null;
  a = xb(d);
  a = Wc(a);
  if (null !== a) if (b = Vb(a), null === b) a = null;
  else if (c = b.tag, 13 === c) {
    a = Wb(b);
    if (null !== a) return a;
    a = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a = null;
  } else b !== a && (a = null);
  id = a;
  return null;
}
function jd(a) {
  switch (a) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a = 0; a < c && b[a] === e[a]; a++) ;
  var g = c - a;
  for (d = 1; d <= g && b[c - d] === e[f2 - d]; d++) ;
  return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
  var b = a.keyCode;
  "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
  10 === a && (a = 13);
  return 32 <= a || 13 === a ? a : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a) {
  function b(b2, d, e, f2, g) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d;
    this.nativeEvent = f2;
    this.target = g;
    this.currentTarget = null;
    for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a2 = this.nativeEvent;
    a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a2 = this.nativeEvent;
    a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
  return a.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
  return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
}, movementX: function(a) {
  if ("movementX" in a) return a.movementX;
  a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
  return wd;
}, movementY: function(a) {
  return "movementY" in a ? a.movementY : xd;
} }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a) {
  return "clipboardData" in a ? a.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
}
function zd() {
  return Pd;
}
var Qd = A({}, ud, { key: function(a) {
  if (a.key) {
    var b = Md[a.key] || a.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
  return "keypress" === a.type ? od(a) : 0;
}, keyCode: function(a) {
  return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
}, which: function(a) {
  return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
} }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
  deltaX: function(a) {
    return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
  },
  deltaY: function(a) {
    return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
function ge(a, b) {
  switch (a) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he(a) {
  a = a.detail;
  return "object" === typeof a && "data" in a ? a.data : null;
}
var ie = false;
function je(a, b) {
  switch (a) {
    case "compositionend":
      return he(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe = true;
      return ee;
    case "textInput":
      return a = b.data, a === ee && fe ? null : a;
    default:
      return null;
  }
}
function ke(a, b) {
  if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
  switch (a) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
}
function ne(a, b, c, d) {
  Eb(d);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a) {
  se(a, 0);
}
function te(a) {
  var b = ue(a);
  if (Wa(b)) return a;
}
function ve(a, b) {
  if ("change" === a) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
  if ("value" === a.propertyName && te(qe)) {
    var b = [];
    ne(b, qe, a, xb(a));
    Jb(re, b);
  }
}
function Ce(a, b, c) {
  "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De(a) {
  if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
}
function Ee(a, b) {
  if ("click" === a) return te(b);
}
function Fe(a, b) {
  if ("input" === a || "change" === a) return te(b);
}
function Ge(a, b) {
  return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
  if (He(a, b)) return true;
  if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a), d = Object.keys(b);
  if (c.length !== d.length) return false;
  for (d = 0; d < c.length; d++) {
    var e = c[d];
    if (!ja.call(b, e) || !He(a[e], b[e])) return false;
  }
  return true;
}
function Je(a) {
  for (; a && a.firstChild; ) a = a.firstChild;
  return a;
}
function Ke(a, b) {
  var c = Je(a);
  a = 0;
  for (var d; c; ) {
    if (3 === c.nodeType) {
      d = a + c.textContent.length;
      if (a <= b && d >= b) return { node: c, offset: b - a };
      a = d;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a, b) {
  return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
}
function Me() {
  for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d) {
      c = false;
    }
    if (c) a = b.contentWindow;
    else break;
    b = Xa(a.document);
  }
  return b;
}
function Ne(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe(a) {
  var b = Me(), c = a.focusedElem, d = a.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d && Ne(c)) {
      if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
      else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
        a = a.getSelection();
        var e = c.textContent.length, f2 = Math.min(d.start, e);
        d = void 0 === d.end ? f2 : Math.min(d.end, e);
        !a.extend && f2 > d && (e = d, d = f2, f2 = e);
        e = Ke(c, f2);
        var g = Ke(
          c,
          d
        );
        e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f2 > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
      }
    }
    b = [];
    for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a, b, c) {
  var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
}
function Ve(a, b) {
  var c = {};
  c[a.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a] = "webkit" + b;
  c["Moz" + a] = "moz" + b;
  return c;
}
var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
  if (Xe[a]) return Xe[a];
  if (!We[a]) return a;
  var b = We[a], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
  return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
  df.set(a, b);
  fa(b, [a]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
  var d = a.type || "unknown-event";
  a.currentTarget = c;
  Ub(d, b, void 0, a);
  a.currentTarget = null;
}
function se(a, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a.length; c++) {
    var d = a[c], e = d.event;
    d = d.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g = d.length - 1; 0 <= g; g--) {
        var h = d[g], k2 = h.instance, l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
      else for (g = 0; g < d.length; g++) {
        h = d[g];
        k2 = h.instance;
        l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
    }
  }
  if (Qb) throw a = Rb, Qb = false, Rb = null, a;
}
function D(a, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d = a + "__bubble";
  c.has(d) || (pf(b, a, 2, false), c.add(d));
}
function qf(a, b, c) {
  var d = 0;
  b && (d |= 4);
  pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
  if (!a[rf]) {
    a[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
    });
    var b = 9 === a.nodeType ? a : a.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a, b, c, d) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
}
function hd(a, b, c, d, e) {
  var f2 = d;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
    if (null === d) return;
    var g = d.tag;
    if (3 === g || 4 === g) {
      var h = d.stateNode.containerInfo;
      if (h === e || 8 === h.nodeType && h.parentNode === e) break;
      if (4 === g) for (g = d.return; null !== g; ) {
        var k2 = g.tag;
        if (3 === k2 || 4 === k2) {
          if (k2 = g.stateNode.containerInfo, k2 === e || 8 === k2.nodeType && k2.parentNode === e) return;
        }
        g = g.return;
      }
      for (; null !== h; ) {
        g = Wc(h);
        if (null === g) return;
        k2 = g.tag;
        if (5 === k2 || 6 === k2) {
          d = f2 = g;
          continue a;
        }
        h = h.parentNode;
      }
    }
    d = d.return;
  }
  Jb(function() {
    var d2 = f2, e2 = xb(c), g2 = [];
    a: {
      var h2 = df.get(a);
      if (void 0 !== h2) {
        var k3 = td, n2 = a;
        switch (a) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k3 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k3 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k3 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k3 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k3 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k3 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k3 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k3 = Hd;
            break;
          case cf:
            k3 = Xd;
            break;
          case "scroll":
            k3 = vd;
            break;
          case "wheel":
            k3 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k3 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k3 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a, x2 = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
        t2 = [];
        for (var w2 = d2, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h2 = new k3(h2, n2, null, c, e2), g2.push({ event: h2, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h2 = "mouseover" === a || "pointerover" === a;
        k3 = "mouseout" === a || "pointerout" === a;
        if (h2 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k3 || h2) {
          h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
          if (k3) {
            if (n2 = c.relatedTarget || c.toElement, k3 = d2, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k3 = null, n2 = d2;
          if (k3 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a || "pointerover" === a) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k3 ? h2 : ue(k3);
            u2 = null == n2 ? h2 : ue(n2);
            h2 = new t2(F2, w2 + "leave", k3, c, e2);
            h2.target = J2;
            h2.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d2 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k3 && n2) b: {
              t2 = k3;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k3 && wf(g2, h2, k3, t2, false);
            null !== n2 && null !== J2 && wf(g2, J2, n2, t2, true);
          }
        }
      }
      a: {
        h2 = d2 ? ue(d2) : window;
        k3 = h2.nodeName && h2.nodeName.toLowerCase();
        if ("select" === k3 || "input" === k3 && "file" === h2.type) var na = ve;
        else if (me(h2)) if (we) na = Fe;
        else {
          na = De;
          var xa = Ce;
        }
        else (k3 = h2.nodeName) && "input" === k3.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
        if (na && (na = na(a, d2))) {
          ne(g2, na, c, e2);
          break a;
        }
        xa && xa(a, h2, d2);
        "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
      }
      xa = d2 ? ue(d2) : window;
      switch (a) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g2, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g2, c, e2);
      }
      var $a;
      if (ae) b: {
        switch (a) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
    }
    se(g2, b);
  });
}
function tf(a, b, c) {
  return { instance: a, listener: b, currentTarget: c };
}
function oe(a, b) {
  for (var c = b + "Capture", d = []; null !== a; ) {
    var e = a, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a, c), null != f2 && d.unshift(tf(a, f2, e)), f2 = Kb(a, b), null != f2 && d.push(tf(a, f2, e)));
    a = a.return;
  }
  return d;
}
function vf(a) {
  if (null === a) return null;
  do
    a = a.return;
  while (a && 5 !== a.tag);
  return a ? a : null;
}
function wf(a, b, c, d, e) {
  for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
    var h = c, k2 = h.alternate, l2 = h.stateNode;
    if (null !== k2 && k2 === d) break;
    5 === h.tag && null !== l2 && (h = l2, e ? (k2 = Kb(c, f2), null != k2 && g.unshift(tf(c, k2, h))) : e || (k2 = Kb(c, f2), null != k2 && g.push(tf(c, k2, h))));
    c = c.return;
  }
  0 !== g.length && a.push({ event: b, listeners: g });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
  return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
  b = zf(b);
  if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a, b) {
  return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
  return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
  setTimeout(function() {
    throw a;
  });
}
function Kf(a, b) {
  var c = b, d = 0;
  do {
    var e = c.nextSibling;
    a.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d) {
        a.removeChild(e);
        bd(b);
        return;
      }
      d--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a) {
  for (; null != a; a = a.nextSibling) {
    var b = a.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a;
}
function Mf(a) {
  a = a.previousSibling;
  for (var b = 0; a; ) {
    if (8 === a.nodeType) {
      var c = a.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a;
        b--;
      } else "/$" === c && b++;
    }
    a = a.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
  var b = a[Of];
  if (b) return b;
  for (var c = a.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
        if (c = a[Of]) return c;
        a = Mf(a);
      }
      return b;
    }
    a = c;
    c = a.parentNode;
  }
  return null;
}
function Cb(a) {
  a = a[Of] || a[uf];
  return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
  if (5 === a.tag || 6 === a.tag) return a.stateNode;
  throw Error(p(33));
}
function Db(a) {
  return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
  return { current: a };
}
function E(a) {
  0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G(a, b) {
  Tf++;
  Sf[Tf] = a.current;
  a.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a, b) {
  var c = a.type.contextTypes;
  if (!c) return Vf;
  var d = a.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a) {
  a = a.childContextTypes;
  return null !== a && void 0 !== a;
}
function $f() {
  E(Wf);
  E(H);
}
function ag(a, b, c) {
  if (H.current !== Vf) throw Error(p(168));
  G(H, b);
  G(Wf, c);
}
function bg(a, b, c) {
  var d = a.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d.getChildContext) return c;
  d = d.getChildContext();
  for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
  return A({}, c, d);
}
function cg(a) {
  a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H.current;
  G(H, a);
  G(Wf, Wf.current);
  return true;
}
function dg(a, b, c) {
  var d = a.stateNode;
  if (!d) throw Error(p(169));
  c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
  G(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a) {
  null === eg ? eg = [a] : eg.push(a);
}
function ig(a) {
  fg = true;
  hg(a);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a < c.length; a++) {
        var d = c[a];
        do
          d = d(true);
        while (null !== d);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a;
  ng = b;
}
function ug(a, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a;
  var d = rg;
  a = sg;
  var e = 32 - oc(d) - 1;
  d &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g = e - e % 5;
    f2 = (d & (1 << g) - 1).toString(32);
    d >>= g;
    e -= g;
    rg = 1 << 32 - oc(b) + e | c << e | d;
    sg = f2 + a;
  } else rg = 1 << f2 | c << e | d, sg = a;
}
function vg(a) {
  null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
  for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = false, zg = null;
function Ag(a, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a;
  b = a.deletions;
  null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
  switch (a.tag) {
    case 5:
      var c = a.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a) {
  return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
  if (I) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a, b)) {
        if (Dg(a)) throw Error(p(418));
        b = Lf(c.nextSibling);
        var d = xg;
        b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
      }
    } else {
      if (Dg(a)) throw Error(p(418));
      a.flags = a.flags & -4097 | 2;
      I = false;
      xg = a;
    }
  }
}
function Fg(a) {
  for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
  xg = a;
}
function Gg(a) {
  if (a !== xg) return false;
  if (!I) return Fg(a), I = true, false;
  var b;
  (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a)) throw Hg(), Error(p(418));
    for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
  }
  Fg(a);
  if (13 === a.tag) {
    a = a.memoizedState;
    a = null !== a ? a.dehydrated : null;
    if (!a) throw Error(p(317));
    a: {
      a = a.nextSibling;
      for (b = 0; a; ) {
        if (8 === a.nodeType) {
          var c = a.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a = a.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a = yg; a; ) a = Lf(a.nextSibling);
}
function Ig() {
  yg = xg = null;
  I = false;
}
function Jg(a) {
  null === zg ? zg = [a] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
  a = c.ref;
  if (null !== a && "function" !== typeof a && "object" !== typeof a) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p(309));
        var d = c.stateNode;
      }
      if (!d) throw Error(p(147, a));
      var e = d, f2 = "" + a;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a2) {
        var b2 = e.refs;
        null === a2 ? delete b2[f2] : b2[f2] = a2;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a) throw Error(p(284));
    if (!c._owner) throw Error(p(290, a));
  }
  return a;
}
function Mg(a, b) {
  a = Object.prototype.toString.call(b);
  throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
  var b = a._init;
  return b(a._payload);
}
function Og(a) {
  function b(b2, c2) {
    if (a) {
      var d2 = b2.deletions;
      null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
    }
  }
  function c(c2, d2) {
    if (!a) return null;
    for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
    return null;
  }
  function d(a2, b2) {
    for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
    return a2;
  }
  function e(a2, b2) {
    a2 = Pg(a2, b2);
    a2.index = 0;
    a2.sibling = null;
    return a2;
  }
  function f2(b2, c2, d2) {
    b2.index = d2;
    if (!a) return b2.flags |= 1048576, c2;
    d2 = b2.alternate;
    if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
    b2.flags |= 2;
    return c2;
  }
  function g(b2) {
    a && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h(a2, b2, c2, d2) {
    if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function k2(a2, b2, c2, d2) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a2, b2, c2.props.children, d2, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
    d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
    d2.ref = Lg(a2, b2, c2);
    d2.return = a2;
    return d2;
  }
  function l2(a2, b2, c2, d2) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a2;
    return b2;
  }
  function m2(a2, b2, c2, d2, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f3), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function q2(a2, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
        case wa:
          return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
        case Ha:
          var d2 = b2._init;
          return q2(a2, d2(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
      Mg(a2, b2);
    }
    return null;
  }
  function r2(a2, b2, c2, d2) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k2(a2, b2, c2, d2) : null;
        case wa:
          return c2.key === e2 ? l2(a2, b2, c2, d2) : null;
        case Ha:
          return e2 = c2._init, r2(
            a2,
            b2,
            e2(c2._payload),
            d2
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a2, b2, c2, d2, null);
      Mg(a2, c2);
    }
    return null;
  }
  function y2(a2, b2, c2, d2, e2) {
    if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case va:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k2(b2, a2, d2, e2);
        case wa:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l2(b2, a2, d2, e2);
        case Ha:
          var f3 = d2._init;
          return y2(a2, b2, c2, f3(d2._payload), e2);
      }
      if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m2(b2, a2, d2, e2, null);
      Mg(b2, d2);
    }
    return null;
  }
  function n2(e2, g2, h2, k3) {
    for (var l3 = null, m3 = null, u2 = g2, w2 = g2 = 0, x2 = null; null !== u2 && w2 < h2.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h2[w2], k3);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a && u2 && null === n3.alternate && b(e2, u2);
      g2 = f2(n3, g2, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h2.length) return c(e2, u2), I && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h2.length; w2++) u2 = q2(e2, h2[w2], k3), null !== u2 && (g2 = f2(u2, g2, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I && tg(e2, w2);
      return l3;
    }
    for (u2 = d(e2, u2); w2 < h2.length; w2++) x2 = y2(u2, e2, w2, h2[w2], k3), null !== x2 && (a && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g2 = f2(x2, g2, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a && u2.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function t2(e2, g2, h2, k3) {
    var l3 = Ka(h2);
    if ("function" !== typeof l3) throw Error(p(150));
    h2 = l3.call(h2);
    if (null == h2) throw Error(p(151));
    for (var u2 = l3 = null, m3 = g2, w2 = g2 = 0, x2 = null, n3 = h2.next(); null !== m3 && !n3.done; w2++, n3 = h2.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k3);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a && m3 && null === t3.alternate && b(e2, m3);
      g2 = f2(t3, g2, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h2.next()) n3 = q2(e2, n3.value, k3), null !== n3 && (g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I && tg(e2, w2);
      return l3;
    }
    for (m3 = d(e2, m3); !n3.done; w2++, n3 = h2.next()) n3 = y2(m3, e2, w2, n3.value, k3), null !== n3 && (a && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a && m3.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function J2(a2, d2, f3, h2) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k3 = f3.key, l3 = d2; null !== l3; ) {
              if (l3.key === k3) {
                k3 = f3.type;
                if (k3 === ya) {
                  if (7 === l3.tag) {
                    c(a2, l3.sibling);
                    d2 = e(l3, f3.props.children);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                } else if (l3.elementType === k3 || "object" === typeof k3 && null !== k3 && k3.$$typeof === Ha && Ng(k3) === l3.type) {
                  c(a2, l3.sibling);
                  d2 = e(l3, f3.props);
                  d2.ref = Lg(a2, l3, f3);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                }
                c(a2, l3);
                break;
              } else b(a2, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d2 = Tg(f3.props.children, a2.mode, h2, f3.key), d2.return = a2, a2 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f3), h2.return = a2, a2 = h2);
          }
          return g(a2);
        case wa:
          a: {
            for (l3 = f3.key; null !== d2; ) {
              if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                c(a2, d2.sibling);
                d2 = e(d2, f3.children || []);
                d2.return = a2;
                a2 = d2;
                break a;
              } else {
                c(a2, d2);
                break;
              }
              else b(a2, d2);
              d2 = d2.sibling;
            }
            d2 = Sg(f3, a2.mode, h2);
            d2.return = a2;
            a2 = d2;
          }
          return g(a2);
        case Ha:
          return l3 = f3._init, J2(a2, d2, l3(f3._payload), h2);
      }
      if (eb(f3)) return n2(a2, d2, f3, h2);
      if (Ka(f3)) return t2(a2, d2, f3, h2);
      Mg(a2, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f3), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f3, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
  }
  return J2;
}
var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
  Zg = Yg = Xg = null;
}
function ah(a) {
  var b = Wg.current;
  E(Wg);
  a._currentValue = b;
}
function bh(a, b, c) {
  for (; null !== a; ) {
    var d = a.alternate;
    (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
    if (a === c) break;
    a = a.return;
  }
}
function ch(a, b) {
  Xg = a;
  Zg = Yg = null;
  a = a.dependencies;
  null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
}
function eh(a) {
  var b = a._currentValue;
  if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
    if (null === Xg) throw Error(p(308));
    Yg = a;
    Xg.dependencies = { lanes: 0, firstContext: a };
  } else Yg = Yg.next = a;
  return b;
}
var fh = null;
function gh(a) {
  null === fh ? fh = [a] : fh.push(a);
}
function hh(a, b, c, d) {
  var e = b.interleaved;
  null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return ih(a, d);
}
function ih(a, b) {
  a.lanes |= b;
  var c = a.alternate;
  null !== c && (c.lanes |= b);
  c = a;
  for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
  return 3 === c.tag ? c.stateNode : null;
}
var jh = false;
function kh(a) {
  a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function lh(a, b) {
  a = a.updateQueue;
  b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
}
function mh(a, b) {
  return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function nh(a, b, c) {
  var d = a.updateQueue;
  if (null === d) return null;
  d = d.shared;
  if (0 !== (K & 2)) {
    var e = d.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d.pending = b;
    return ih(a, c);
  }
  e = d.interleaved;
  null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
  d.interleaved = b;
  return ih(a, c);
}
function oh(a, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
function ph(a, b) {
  var c = a.updateQueue, d = a.alternate;
  if (null !== d && (d = d.updateQueue, c === d)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g : f2 = f2.next = g;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
    a.updateQueue = c;
    return;
  }
  a = c.lastBaseUpdate;
  null === a ? c.firstBaseUpdate = b : a.next = b;
  c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
  var e = a.updateQueue;
  jh = false;
  var f2 = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
  if (null !== h) {
    e.shared.pending = null;
    var k2 = h, l2 = k2.next;
    k2.next = null;
    null === g ? f2 = l2 : g.next = l2;
    g = k2;
    var m2 = a.alternate;
    null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g && (null === h ? m2.firstBaseUpdate = l2 : h.next = l2, m2.lastBaseUpdate = k2));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g = 0;
    m2 = l2 = k2 = null;
    h = f2;
    do {
      var r2 = h.lane, y2 = h.eventTime;
      if ((d & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h.tag,
          payload: h.payload,
          callback: h.callback,
          next: null
        });
        a: {
          var n2 = a, t2 = h;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A({}, q2, r2);
              break a;
            case 2:
              jh = true;
          }
        }
        null !== h.callback && 0 !== h.lane && (a.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h] : r2.push(h));
      } else y2 = { eventTime: y2, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l2 = m2 = y2, k2 = q2) : m2 = m2.next = y2, g |= r2;
      h = h.next;
      if (null === h) if (h = e.shared.pending, null === h) break;
      else r2 = h, h = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k2 = q2);
    e.baseState = k2;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    rh |= g;
    a.lanes = g;
    a.memoizedState = q2;
  }
}
function sh(a, b, c) {
  a = b.effects;
  b.effects = null;
  if (null !== a) for (b = 0; b < a.length; b++) {
    var d = a[b], e = d.callback;
    if (null !== e) {
      d.callback = null;
      d = c;
      if ("function" !== typeof e) throw Error(p(191, e));
      e.call(d);
    }
  }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
  if (a === th) throw Error(p(174));
  return a;
}
function yh(a, b) {
  G(wh, b);
  G(vh, a);
  G(uh, th);
  a = b.nodeType;
  switch (a) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
  }
  E(uh);
  G(uh, b);
}
function zh() {
  E(uh);
  E(vh);
  E(wh);
}
function Ah(a) {
  xh(wh.current);
  var b = xh(uh.current);
  var c = lb(b, a.type);
  b !== c && (G(vh, a), G(uh, c));
}
function Bh(a) {
  vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
  for (var b = a; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Dh = [];
function Eh() {
  for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
  Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
function P() {
  throw Error(p(321));
}
function Mh(a, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
  return true;
}
function Nh(a, b, c, d, e, f2) {
  Hh = f2;
  M = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
  a = c(d, e);
  if (Jh) {
    f2 = 0;
    do {
      Jh = false;
      Kh = 0;
      if (25 <= f2) throw Error(p(301));
      f2 += 1;
      O = N = null;
      b.updateQueue = null;
      Fh.current = Qh;
      a = c(d, e);
    } while (Jh);
  }
  Fh.current = Rh;
  b = null !== N && null !== N.next;
  Hh = 0;
  O = N = M = null;
  Ih = false;
  if (b) throw Error(p(300));
  return a;
}
function Sh() {
  var a = 0 !== Kh;
  Kh = 0;
  return a;
}
function Th() {
  var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === O ? M.memoizedState = O = a : O = O.next = a;
  return O;
}
function Uh() {
  if (null === N) {
    var a = M.alternate;
    a = null !== a ? a.memoizedState : null;
  } else a = N.next;
  var b = null === O ? M.memoizedState : O.next;
  if (null !== b) O = b, N = a;
  else {
    if (null === a) throw Error(p(310));
    N = a;
    a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
  }
  return O;
}
function Vh(a, b) {
  return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = N, e = d.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g = e.next;
      e.next = f2.next;
      f2.next = g;
    }
    d.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d = d.baseState;
    var h = g = null, k2 = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Hh & m2) === m2) null !== k2 && (k2 = k2.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a(d, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k2 ? (h = k2 = q2, g = d) : k2 = k2.next = q2;
        M.lanes |= m2;
        rh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k2 ? g = d : k2.next = h;
    He(d, b.memoizedState) || (dh = true);
    b.memoizedState = d;
    b.baseState = g;
    b.baseQueue = k2;
    c.lastRenderedState = d;
  }
  a = c.interleaved;
  if (null !== a) {
    e = a;
    do
      f2 = e.lane, M.lanes |= f2, rh |= f2, e = e.next;
    while (e !== a);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function Xh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g = e = e.next;
    do
      f2 = a(f2, g.action), g = g.next;
    while (g !== e);
    He(f2, b.memoizedState) || (dh = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d];
}
function Yh() {
}
function Zh(a, b) {
  var c = M, d = Uh(), e = b(), f2 = !He(d.memoizedState, e);
  f2 && (d.memoizedState = e, dh = true);
  d = d.queue;
  $h(ai.bind(null, c, d, a), [a]);
  if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
    c.flags |= 2048;
    bi(9, ci.bind(null, c, d, e, b), void 0, null);
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(c, b, e);
  }
  return e;
}
function di(a, b, c) {
  a.flags |= 16384;
  a = { getSnapshot: b, value: c };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
}
function ci(a, b, c, d) {
  b.value = c;
  b.getSnapshot = d;
  ei(b) && fi(a);
}
function ai(a, b, c) {
  return c(function() {
    ei(b) && fi(a);
  });
}
function ei(a) {
  var b = a.getSnapshot;
  a = a.value;
  try {
    var c = b();
    return !He(a, c);
  } catch (d) {
    return true;
  }
}
function fi(a) {
  var b = ih(a, 1);
  null !== b && gi(b, a, 1, -1);
}
function hi(a) {
  var b = Th();
  "function" === typeof a && (a = a());
  b.memoizedState = b.baseState = a;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
  b.queue = a;
  a = a.dispatch = ii.bind(null, M, a);
  return [b.memoizedState, a];
}
function bi(a, b, c, d) {
  a = { tag: a, create: b, destroy: c, deps: d, next: null };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
  return a;
}
function ji() {
  return Uh().memoizedState;
}
function ki(a, b, c, d) {
  var e = Th();
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
  var e = Uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== N) {
    var g = N.memoizedState;
    f2 = g.destroy;
    if (null !== d && Mh(d, g.deps)) {
      e.memoizedState = bi(b, c, f2, d);
      return;
    }
  }
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, f2, d);
}
function mi(a, b) {
  return ki(8390656, 8, a, b);
}
function $h(a, b) {
  return li(2048, 8, a, b);
}
function ni(a, b) {
  return li(4, 2, a, b);
}
function oi(a, b) {
  return li(4, 4, a, b);
}
function pi(a, b) {
  if ("function" === typeof b) return a = a(), b(a), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
    b.current = null;
  };
}
function qi(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {
}
function si(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  c.memoizedState = [a, b];
  return a;
}
function ti(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  a = a();
  c.memoizedState = [a, b];
  return a;
}
function ui(a, b, c) {
  if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
  He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
  return b;
}
function vi(a, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a(true);
  var d = Gh.transition;
  Gh.transition = {};
  try {
    a(false), b();
  } finally {
    C = c, Gh.transition = d;
  }
}
function wi() {
  return Uh().memoizedState;
}
function xi(a, b, c) {
  var d = yi(a);
  c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, c);
  else if (c = hh(a, b, c, d), null !== c) {
    var e = R();
    gi(c, a, d, e);
    Bi(c, b, d);
  }
}
function ii(a, b, c) {
  var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, e);
  else {
    var f2 = a.alternate;
    if (0 === a.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g = b.lastRenderedState, h = f2(g, c);
      e.hasEagerState = true;
      e.eagerState = h;
      if (He(h, g)) {
        var k2 = b.interleaved;
        null === k2 ? (e.next = e, gh(b)) : (e.next = k2.next, k2.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = hh(a, b, e, d);
    null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
  }
}
function zi(a) {
  var b = a.alternate;
  return a === M || null !== b && b === M;
}
function Ai(a, b) {
  Jh = Ih = true;
  var c = a.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a.pending = b;
}
function Bi(a, b, c) {
  if (0 !== (c & 4194240)) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
  Th().memoizedState = [a, void 0 === b ? null : b];
  return a;
}, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return ki(
    4194308,
    4,
    pi.bind(null, b, a),
    c
  );
}, useLayoutEffect: function(a, b) {
  return ki(4194308, 4, a, b);
}, useInsertionEffect: function(a, b) {
  return ki(4, 2, a, b);
}, useMemo: function(a, b) {
  var c = Th();
  b = void 0 === b ? null : b;
  a = a();
  c.memoizedState = [a, b];
  return a;
}, useReducer: function(a, b, c) {
  var d = Th();
  b = void 0 !== c ? c(b) : b;
  d.memoizedState = d.baseState = b;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
  d.queue = a;
  a = a.dispatch = xi.bind(null, M, a);
  return [d.memoizedState, a];
}, useRef: function(a) {
  var b = Th();
  a = { current: a };
  return b.memoizedState = a;
}, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
  return Th().memoizedState = a;
}, useTransition: function() {
  var a = hi(false), b = a[0];
  a = vi.bind(null, a[1]);
  Th().memoizedState = a;
  return [b, a];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a, b, c) {
  var d = M, e = Th();
  if (I) {
    if (void 0 === c) throw Error(p(407));
    c = c();
  } else {
    c = b();
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(d, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  mi(ai.bind(
    null,
    d,
    f2,
    a
  ), [a]);
  d.flags |= 2048;
  bi(9, ci.bind(null, d, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a = Th(), b = Q.identifierPrefix;
  if (I) {
    var c = sg;
    var d = rg;
    c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Kh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a.memoizedState = b;
}, unstable_isNewReconciler: false }, Ph = {
  readContext: eh,
  useCallback: si,
  useContext: eh,
  useEffect: $h,
  useImperativeHandle: qi,
  useInsertionEffect: ni,
  useLayoutEffect: oi,
  useMemo: ti,
  useReducer: Wh,
  useRef: ji,
  useState: function() {
    return Wh(Vh);
  },
  useDebugValue: ri,
  useDeferredValue: function(a) {
    var b = Uh();
    return ui(b, N.memoizedState, a);
  },
  useTransition: function() {
    var a = Wh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  },
  useMutableSource: Yh,
  useSyncExternalStore: Zh,
  useId: wi,
  unstable_isNewReconciler: false
}, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
  return Xh(Vh);
}, useDebugValue: ri, useDeferredValue: function(a) {
  var b = Uh();
  return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
}, useTransition: function() {
  var a = Xh(Vh)[0], b = Uh().memoizedState;
  return [a, b];
}, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
function Ci(a, b) {
  if (a && a.defaultProps) {
    b = A({}, b);
    a = a.defaultProps;
    for (var c in a) void 0 === b[c] && (b[c] = a[c]);
    return b;
  }
  return b;
}
function Di(a, b, c, d) {
  b = a.memoizedState;
  c = c(d, b);
  c = null === c || void 0 === c ? b : A({}, b, c);
  a.memoizedState = c;
  0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = { isMounted: function(a) {
  return (a = a._reactInternals) ? Vb(a) === a : false;
}, enqueueSetState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueReplaceState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueForceUpdate: function(a, b) {
  a = a._reactInternals;
  var c = R(), d = yi(a), e = mh(c, d);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = nh(a, e, d);
  null !== b && (gi(b, a, d, c), oh(b, a, d));
} };
function Fi(a, b, c, d, e, f2, g) {
  a = a.stateNode;
  return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f2) : true;
}
function Gi(a, b, c) {
  var d = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
  b = new b(c, f2);
  a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = Ei;
  a.stateNode = b;
  b._reactInternals = a;
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function Hi(a, b, c, d) {
  a = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
  b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
  var e = a.stateNode;
  e.props = c;
  e.state = a.memoizedState;
  e.refs = {};
  kh(a);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e.context = Yf(a, f2));
  e.state = a.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (Di(a, b, f2, c), e.state = a.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
  "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
  try {
    var c = "", d = b;
    do
      c += Pa(d), d = d.return;
    while (d);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a, source: b, stack: e, digest: null };
}
function Ki(a, b, c) {
  return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Li(a, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d = b.value;
  c.callback = function() {
    Oi || (Oi = true, Pi = d);
    Li(a, b);
  };
  return c;
}
function Qi(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  var d = a.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e = b.value;
    c.payload = function() {
      return d(e);
    };
    c.callback = function() {
      Li(a, b);
    };
  }
  var f2 = a.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Li(a, b);
    "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Si(a, b, c) {
  var d = a.pingCache;
  if (null === d) {
    d = a.pingCache = new Mi();
    var e = /* @__PURE__ */ new Set();
    d.set(b, e);
  } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
  e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
  do {
    var b;
    if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a;
    a = a.return;
  } while (null !== a);
  return null;
}
function Vi(a, b, c, d, e) {
  if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
  a.flags |= 65536;
  a.lanes = e;
  return a;
}
var Wi = ua.ReactCurrentOwner, dh = false;
function Xi(a, b, c, d) {
  b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
  c = c.render;
  var f2 = b.ref;
  ch(b, e);
  d = Nh(a, b, c, d, f2, e);
  c = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && c && vg(b);
  b.flags |= 1;
  Xi(a, b, d, e);
  return b.child;
}
function $i(a, b, c, d, e) {
  if (null === a) {
    var f2 = c.type;
    if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, bj(a, b, f2, d, e);
    a = Rg(c.type, null, d, b, b.mode, e);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  f2 = a.child;
  if (0 === (a.lanes & e)) {
    var g = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
  }
  b.flags |= 1;
  a = Pg(f2, d);
  a.ref = b.ref;
  a.return = b;
  return b.child = a;
}
function bj(a, b, c, d, e) {
  if (null !== a) {
    var f2 = a.memoizedProps;
    if (Ie(f2, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
    else return b.lanes = a.lanes, Zi(a, b, e);
  }
  return cj(a, b, c, d, e);
}
function dj(a, b, c) {
  var d = b.pendingProps, e = d.children, f2 = null !== a ? a.memoizedState : null;
  if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
  else {
    if (0 === (c & 1073741824)) return a = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d = null !== f2 ? f2.baseLanes : c;
    G(ej, fj);
    fj |= d;
  }
  else null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
  Xi(a, b, e, c);
  return b.child;
}
function gj(a, b) {
  var c = b.ref;
  if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
  var f2 = Zf(c) ? Xf : H.current;
  f2 = Yf(b, f2);
  ch(b, e);
  c = Nh(a, b, c, d, f2, e);
  d = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && d && vg(b);
  b.flags |= 1;
  Xi(a, b, c, e);
  return b.child;
}
function hj(a, b, c, d, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  ch(b, e);
  if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
  else if (null === a) {
    var g = b.stateNode, h = b.memoizedProps;
    g.props = h;
    var k2 = g.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c) ? Xf : H.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k2 !== l2) && Hi(b, g, d, l2);
    jh = false;
    var r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    k2 = b.memoizedState;
    h !== d || r2 !== k2 || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k2 = b.memoizedState), (h = jh || Fi(b, c, h, d, r2, k2, l2)) ? (q2 || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k2), g.props = d, g.state = k2, g.context = l2, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
  } else {
    g = b.stateNode;
    lh(a, b);
    h = b.memoizedProps;
    l2 = b.type === b.elementType ? h : Ci(b.type, h);
    g.props = l2;
    q2 = b.pendingProps;
    r2 = g.context;
    k2 = c.contextType;
    "object" === typeof k2 && null !== k2 ? k2 = eh(k2) : (k2 = Zf(c) ? Xf : H.current, k2 = Yf(b, k2));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q2 || r2 !== k2) && Hi(b, g, d, k2);
    jh = false;
    r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    var n2 = b.memoizedState;
    h !== q2 || r2 !== n2 || Wf.current || jh ? ("function" === typeof y2 && (Di(b, c, y2, d), n2 = b.memoizedState), (l2 = jh || Fi(b, c, l2, d, r2, n2, k2) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n2, k2), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n2, k2)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n2), g.props = d, g.state = n2, g.context = k2, d = l2) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), d = false);
  }
  return jj(a, b, c, d, f2, e);
}
function jj(a, b, c, d, e, f2) {
  gj(a, b);
  var g = 0 !== (b.flags & 128);
  if (!d && !g) return e && dg(b, c, false), Zi(a, b, f2);
  d = b.stateNode;
  Wi.current = b;
  var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
  b.flags |= 1;
  null !== a && g ? (b.child = Ug(b, a.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a, b, h, f2);
  b.memoizedState = d.state;
  e && dg(b, c, true);
  return b.child;
}
function kj(a) {
  var b = a.stateNode;
  b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
  yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Xi(a, b, c, d);
  return b.child;
}
var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
function nj(a) {
  return { baseLanes: a, cachePool: null, transitions: null };
}
function oj(a, b, c) {
  var d = b.pendingProps, e = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
  (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
  if (h) f2 = true, b.flags &= -129;
  else if (null === a || null !== a.memoizedState) e |= 1;
  G(L, e & 1);
  if (null === a) {
    Eg(b);
    a = b.memoizedState;
    if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g = d.children;
    a = d.fallback;
    return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a = Tg(a, d, c, null), f2.return = b, a.return = b, f2.sibling = a, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
  }
  e = a.memoizedState;
  if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
  if (f2) {
    f2 = d.fallback;
    g = b.mode;
    e = a.child;
    h = e.sibling;
    var k2 = { mode: "hidden", children: d.children };
    0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k2, b.deletions = null) : (d = Pg(e, k2), d.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
    f2.return = b;
    d.return = b;
    d.sibling = f2;
    b.child = d;
    d = f2;
    f2 = b.child;
    g = a.child.memoizedState;
    g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
    f2.memoizedState = g;
    f2.childLanes = a.childLanes & ~c;
    b.memoizedState = mj;
    return d;
  }
  f2 = a.child;
  a = f2.sibling;
  d = Pg(f2, { mode: "visible", children: d.children });
  0 === (b.mode & 1) && (d.lanes = c);
  d.return = b;
  d.sibling = null;
  null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
  b.child = d;
  b.memoizedState = null;
  return d;
}
function qj(a, b) {
  b = pj({ mode: "visible", children: b }, a.mode, 0, null);
  b.return = a;
  return a.child = b;
}
function sj(a, b, c, d) {
  null !== d && Jg(d);
  Ug(b, a.child, null, c);
  a = qj(b, b.pendingProps.children);
  a.flags |= 2;
  b.memoizedState = null;
  return a;
}
function rj(a, b, c, d, e, f2, g) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
    if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
    f2 = d.fallback;
    e = b.mode;
    d = pj({ mode: "visible", children: d.children }, e, 0, null);
    f2 = Tg(f2, e, g, null);
    f2.flags |= 2;
    d.return = b;
    f2.return = b;
    d.sibling = f2;
    b.child = d;
    0 !== (b.mode & 1) && Ug(b, a.child, null, g);
    b.child.memoizedState = nj(g);
    b.memoizedState = mj;
    return f2;
  }
  if (0 === (b.mode & 1)) return sj(a, b, g, null);
  if ("$!" === e.data) {
    d = e.nextSibling && e.nextSibling.dataset;
    if (d) var h = d.dgst;
    d = h;
    f2 = Error(p(419));
    d = Ki(f2, d, void 0);
    return sj(a, b, g, d);
  }
  h = 0 !== (g & a.childLanes);
  if (dh || h) {
    d = Q;
    if (null !== d) {
      switch (g & -g) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, ih(a, e), gi(d, a, e, -1));
    }
    tj();
    d = Ki(Error(p(421)));
    return sj(a, b, g, d);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
  a = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I = true;
  zg = null;
  null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
  b = qj(b, d.children);
  b.flags |= 4096;
  return b;
}
function vj(a, b, c) {
  a.lanes |= b;
  var d = a.alternate;
  null !== d && (d.lanes |= b);
  bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
  var f2 = a.memoizedState;
  null === f2 ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e);
}
function xj(a, b, c) {
  var d = b.pendingProps, e = d.revealOrder, f2 = d.tail;
  Xi(a, b, d.children, c);
  d = L.current;
  if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
  else {
    if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
      if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
      else if (19 === a.tag) vj(a, c, b);
      else if (null !== a.child) {
        a.child.return = a;
        a = a.child;
        continue;
      }
      if (a === b) break a;
      for (; null === a.sibling; ) {
        if (null === a.return || a.return === b) break a;
        a = a.return;
      }
      a.sibling.return = a.return;
      a = a.sibling;
    }
    d &= 1;
  }
  G(L, d);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      wj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a = e.alternate;
        if (null !== a && null === Ch(a)) {
          b.child = e;
          break;
        }
        a = e.sibling;
        e.sibling = c;
        c = e;
        e = a;
      }
      wj(b, true, c, null, f2);
      break;
    case "together":
      wj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function ij(a, b) {
  0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
  null !== a && (b.dependencies = a.dependencies);
  rh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a && b.child !== a.child) throw Error(p(153));
  if (null !== b.child) {
    a = b.child;
    c = Pg(a, a.pendingProps);
    b.child = c;
    for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function yj(a, b, c) {
  switch (b.tag) {
    case 3:
      kj(b);
      Ig();
      break;
    case 5:
      Ah(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      yh(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d = b.type._context, e = b.memoizedProps.value;
      G(Wg, d._currentValue);
      d._currentValue = e;
      break;
    case 13:
      d = b.memoizedState;
      if (null !== d) {
        if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
        G(L, L.current & 1);
        a = Zi(a, b, c);
        return null !== a ? a.sibling : null;
      }
      G(L, L.current & 1);
      break;
    case 19:
      d = 0 !== (c & b.childLanes);
      if (0 !== (a.flags & 128)) {
        if (d) return xj(a, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G(L, L.current);
      if (d) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, dj(a, b, c);
  }
  return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Aj = function() {
};
Bj = function(a, b, c, d) {
  var e = a.memoizedProps;
  if (e !== d) {
    a = b.stateNode;
    xh(uh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a, e);
        d = Ya(a, d);
        f2 = [];
        break;
      case "select":
        e = A({}, e, { value: void 0 });
        d = A({}, d, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a, e);
        d = gb(a, d);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
    }
    ub(c, d);
    var g;
    c = null;
    for (l2 in e) if (!d.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h = e[l2];
      for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d) {
      var k2 = d[l2];
      h = null != e ? e[l2] : void 0;
      if (d.hasOwnProperty(l2) && k2 !== h && (null != k2 || null != h)) if ("style" === l2) if (h) {
        for (g in h) !h.hasOwnProperty(g) || k2 && k2.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
        for (g in k2) k2.hasOwnProperty(g) && h[g] !== k2[g] && (c || (c = {}), c[g] = k2[g]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k2;
      else "dangerouslySetInnerHTML" === l2 ? (k2 = k2 ? k2.__html : void 0, h = h ? h.__html : void 0, null != k2 && h !== k2 && (f2 = f2 || []).push(l2, k2)) : "children" === l2 ? "string" !== typeof k2 && "number" !== typeof k2 || (f2 = f2 || []).push(l2, "" + k2) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k2 && "onScroll" === l2 && D("scroll", a), f2 || h === k2 || (f2 = [])) : (f2 = f2 || []).push(l2, k2));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Cj = function(a, b, c, d) {
  c !== d && (b.flags |= 4);
};
function Dj(a, b) {
  if (!I) switch (a.tailMode) {
    case "hidden":
      b = a.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a.tail;
      for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
      null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
  }
}
function S(a) {
  var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
  if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
  else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
  a.subtreeFlags |= d;
  a.childLanes = c;
  return b;
}
function Ej(a, b, c) {
  var d = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S(b), null;
    case 1:
      return Zf(b.type) && $f(), S(b), null;
    case 3:
      d = b.stateNode;
      zh();
      E(Wf);
      E(H);
      Eh();
      d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
      if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
      Aj(a, b);
      S(b);
      return null;
    case 5:
      Bh(b);
      var e = xh(wh.current);
      c = b.type;
      if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d) {
          if (null === b.stateNode) throw Error(p(166));
          S(b);
          return null;
        }
        a = xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d[Of] = b;
          d[Pf] = f2;
          a = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D("cancel", d);
              D("close", d);
              break;
            case "iframe":
            case "object":
            case "embed":
              D("load", d);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D(lf[e], d);
              break;
            case "source":
              D("error", d);
              break;
            case "img":
            case "image":
            case "link":
              D(
                "error",
                d
              );
              D("load", d);
              break;
            case "details":
              D("toggle", d);
              break;
            case "input":
              Za(d, f2);
              D("invalid", d);
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              D("invalid", d);
              break;
            case "textarea":
              hb(d, f2), D("invalid", d);
          }
          ub(c, f2);
          e = null;
          for (var g in f2) if (f2.hasOwnProperty(g)) {
            var h = f2[g];
            "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
              d.textContent,
              h,
              a
            ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
          }
          switch (c) {
            case "input":
              Va(d);
              db(d, f2, true);
              break;
            case "textarea":
              Va(d);
              jb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = Bf);
          }
          d = e;
          b.updateQueue = d;
          null !== d && (b.flags |= 4);
        } else {
          g = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
          "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
          a[Of] = b;
          a[Pf] = d;
          zj(a, b, false, false);
          b.stateNode = a;
          a: {
            g = vb(c, d);
            switch (c) {
              case "dialog":
                D("cancel", a);
                D("close", a);
                e = d;
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", a);
                e = d;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], a);
                e = d;
                break;
              case "source":
                D("error", a);
                e = d;
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  a
                );
                D("load", a);
                e = d;
                break;
              case "details":
                D("toggle", a);
                e = d;
                break;
              case "input":
                Za(a, d);
                e = Ya(a, d);
                D("invalid", a);
                break;
              case "option":
                e = d;
                break;
              case "select":
                a._wrapperState = { wasMultiple: !!d.multiple };
                e = A({}, d, { value: void 0 });
                D("invalid", a);
                break;
              case "textarea":
                hb(a, d);
                e = gb(a, d);
                D("invalid", a);
                break;
              default:
                e = d;
            }
            ub(c, e);
            h = e;
            for (f2 in h) if (h.hasOwnProperty(f2)) {
              var k2 = h[f2];
              "style" === f2 ? sb(a, k2) : "dangerouslySetInnerHTML" === f2 ? (k2 = k2 ? k2.__html : void 0, null != k2 && nb(a, k2)) : "children" === f2 ? "string" === typeof k2 ? ("textarea" !== c || "" !== k2) && ob(a, k2) : "number" === typeof k2 && ob(a, "" + k2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k2 && "onScroll" === f2 && D("scroll", a) : null != k2 && ta(a, f2, k2, g));
            }
            switch (c) {
              case "input":
                Va(a);
                db(a, d, false);
                break;
              case "textarea":
                Va(a);
                jb(a);
                break;
              case "option":
                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                break;
              case "select":
                a.multiple = !!d.multiple;
                f2 = d.value;
                null != f2 ? fb(a, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                  a,
                  !!d.multiple,
                  d.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d = !!d.autoFocus;
                break a;
              case "img":
                d = true;
                break a;
              default:
                d = false;
            }
          }
          d && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S(b);
      return null;
    case 6:
      if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
        c = xh(wh.current);
        xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.memoizedProps;
          d[Of] = b;
          if (f2 = d.nodeValue !== c) {
            if (a = xg, null !== a) switch (a.tag) {
              case 3:
                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                break;
              case 5:
                true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
      }
      S(b);
      return null;
    case 13:
      E(L);
      d = b.memoizedState;
      if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
        if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
          if (null === a) {
            if (!f2) throw Error(p(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S(b);
          f2 = false;
        } else null !== zg && (Fj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d = null !== d;
      d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
      null !== b.updateQueue && (b.flags |= 4);
      S(b);
      return null;
    case 4:
      return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
    case 10:
      return ah(b.type._context), S(b), null;
    case 17:
      return Zf(b.type) && $f(), S(b), null;
    case 19:
      E(L);
      f2 = b.memoizedState;
      if (null === f2) return S(b), null;
      d = 0 !== (b.flags & 128);
      g = f2.rendering;
      if (null === g) if (d) Dj(f2, false);
      else {
        if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
          g = Ch(a);
          if (null !== g) {
            b.flags |= 128;
            Dj(f2, false);
            d = g.updateQueue;
            null !== d && (b.updateQueue = d, b.flags |= 4);
            b.subtreeFlags = 0;
            d = c;
            for (c = b.child; null !== c; ) f2 = c, a = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a = g.dependencies, f2.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
            G(L, L.current & 1 | 2);
            return b.child;
          }
          a = a.sibling;
        }
        null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d) if (a = Ch(g), null !== a) {
          if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
        } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
      S(b);
      return null;
    case 22:
    case 23:
      return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p(156, b.tag));
}
function Ij(a, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 3:
      return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
    case 5:
      return Bh(b), null;
    case 13:
      E(L);
      a = b.memoizedState;
      if (null !== a && null !== a.dehydrated) {
        if (null === b.alternate) throw Error(p(340));
        Ig();
      }
      a = b.flags;
      return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 19:
      return E(L), null;
    case 4:
      return zh(), null;
    case 10:
      return ah(b.type._context), null;
    case 22:
    case 23:
      return Hj(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
  var c = a.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d) {
    W(a, b, d);
  }
  else c.current = null;
}
function Mj(a, b, c) {
  try {
    c();
  } catch (d) {
    W(a, b, d);
  }
}
var Nj = false;
function Oj(a, b) {
  Cf = dd;
  a = Me();
  if (Ne(a)) {
    if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
    else a: {
      c = (c = a.ownerDocument) && c.defaultView || window;
      var d = c.getSelection && c.getSelection();
      if (d && 0 !== d.rangeCount) {
        c = d.anchorNode;
        var e = d.anchorOffset, f2 = d.focusNode;
        d = d.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g = 0, h = -1, k2 = -1, l2 = 0, m2 = 0, q2 = a, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h = g + e);
            q2 !== f2 || 0 !== d && 3 !== q2.nodeType || (k2 = g + d);
            3 === q2.nodeType && (g += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a) break b;
            r2 === c && ++l2 === e && (h = g);
            r2 === f2 && ++m2 === d && (k2 = g);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h || -1 === k2 ? null : { start: h, end: k2 };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a = b.sibling;
    if (null !== a) {
      a.return = b.return;
      V = a;
      break;
    }
    V = b.return;
  }
  n2 = Nj;
  Nj = false;
  return n2;
}
function Pj(a, b, c) {
  var d = b.updateQueue;
  d = null !== d ? d.lastEffect : null;
  if (null !== d) {
    var e = d = d.next;
    do {
      if ((e.tag & a) === a) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Mj(b, c, f2);
      }
      e = e.next;
    } while (e !== d);
  }
}
function Qj(a, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a) === a) {
        var d = c.create;
        c.destroy = d();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Rj(a) {
  var b = a.ref;
  if (null !== b) {
    var c = a.stateNode;
    switch (a.tag) {
      case 5:
        a = c;
        break;
      default:
        a = c;
    }
    "function" === typeof b ? b(a) : b.current = a;
  }
}
function Sj(a) {
  var b = a.alternate;
  null !== b && (a.alternate = null, Sj(b));
  a.child = null;
  a.deletions = null;
  a.sibling = null;
  5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a.stateNode = null;
  a.return = null;
  a.dependencies = null;
  a.memoizedProps = null;
  a.memoizedState = null;
  a.pendingProps = null;
  a.stateNode = null;
  a.updateQueue = null;
}
function Tj(a) {
  return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
  a: for (; ; ) {
    for (; null === a.sibling; ) {
      if (null === a.return || Tj(a.return)) return null;
      a = a.return;
    }
    a.sibling.return = a.return;
    for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
      if (a.flags & 2) continue a;
      if (null === a.child || 4 === a.tag) continue a;
      else a.child.return = a, a = a.child;
    }
    if (!(a.flags & 2)) return a.stateNode;
  }
}
function Vj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
  else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
}
var X = null, Xj = false;
function Yj(a, b, c) {
  for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h) {
  }
  switch (c.tag) {
    case 5:
      U || Lj(c, b);
    case 6:
      var d = X, e = Xj;
      X = null;
      Yj(a, b, c);
      X = d;
      Xj = e;
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
      break;
    case 18:
      null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
      break;
    case 4:
      d = X;
      e = Xj;
      X = c.stateNode.containerInfo;
      Xj = true;
      Yj(a, b, c);
      X = d;
      Xj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
        e = d = d.next;
        do {
          var f2 = e, g = f2.destroy;
          f2 = f2.tag;
          void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
          e = e.next;
        } while (e !== d);
      }
      Yj(a, b, c);
      break;
    case 1:
      if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
        d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
      } catch (h) {
        W(c, b, h);
      }
      Yj(a, b, c);
      break;
    case 21:
      Yj(a, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
      break;
    default:
      Yj(a, b, c);
  }
}
function ak(a) {
  var b = a.updateQueue;
  if (null !== b) {
    a.updateQueue = null;
    var c = a.stateNode;
    null === c && (c = a.stateNode = new Kj());
    b.forEach(function(b2) {
      var d = bk.bind(null, a, b2);
      c.has(b2) || (c.add(b2), b2.then(d, d));
    });
  }
}
function ck(a, b) {
  var c = b.deletions;
  if (null !== c) for (var d = 0; d < c.length; d++) {
    var e = c[d];
    try {
      var f2 = a, g = b, h = g;
      a: for (; null !== h; ) {
        switch (h.tag) {
          case 5:
            X = h.stateNode;
            Xj = false;
            break a;
          case 3:
            X = h.stateNode.containerInfo;
            Xj = true;
            break a;
          case 4:
            X = h.stateNode.containerInfo;
            Xj = true;
            break a;
        }
        h = h.return;
      }
      if (null === X) throw Error(p(160));
      Zj(f2, g, e);
      X = null;
      Xj = false;
      var k2 = e.alternate;
      null !== k2 && (k2.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
}
function dk(a, b) {
  var c = a.alternate, d = a.flags;
  switch (a.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ck(b, a);
      ek(a);
      if (d & 4) {
        try {
          Pj(3, a, a.return), Qj(3, a);
        } catch (t2) {
          W(a, a.return, t2);
        }
        try {
          Pj(5, a, a.return);
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 1:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      break;
    case 5:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      if (a.flags & 32) {
        var e = a.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      if (d & 4 && (e = a.stateNode, null != e)) {
        var f2 = a.memoizedProps, g = null !== c ? c.memoizedProps : f2, h = a.type, k2 = a.updateQueue;
        a.updateQueue = null;
        if (null !== k2) try {
          "input" === h && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h, g);
          var l2 = vb(h, f2);
          for (g = 0; g < k2.length; g += 2) {
            var m2 = k2[g], q2 = k2[g + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 6:
      ck(b, a);
      ek(a);
      if (d & 4) {
        if (null === a.stateNode) throw Error(p(162));
        e = a.stateNode;
        f2 = a.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 3:
      ck(b, a);
      ek(a);
      if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a, a.return, t2);
      }
      break;
    case 4:
      ck(b, a);
      ek(a);
      break;
    case 13:
      ck(b, a);
      ek(a);
      e = a.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
      d & 4 && ak(a);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a.mode & 1 ? (U = (l2 = U) || m2, ck(b, a), U = l2) : ck(b, a);
      ek(a);
      if (d & 8192) {
        l2 = null !== a.memoizedState;
        if ((a.stateNode.isHidden = l2) && !m2 && 0 !== (a.mode & 1)) for (V = a, m2 = a.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Pj(4, r2, r2.return);
                break;
              case 1:
                Lj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d = r2;
                  c = r2.return;
                  try {
                    b = d, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d, c, t2);
                  }
                }
                break;
              case 5:
                Lj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  gk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : gk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q2.stateNode, k2 = q2.memoizedProps.style, g = void 0 !== k2 && null !== k2 && k2.hasOwnProperty("display") ? k2.display : null, h.style.display = rb("display", g));
              } catch (t2) {
                W(a, a.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a, a.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      ck(b, a);
      ek(a);
      d & 4 && ak(a);
      break;
    case 21:
      break;
    default:
      ck(
        b,
        a
      ), ek(a);
  }
}
function ek(a) {
  var b = a.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a.return; null !== c; ) {
          if (Tj(c)) {
            var d = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p(160));
      }
      switch (d.tag) {
        case 5:
          var e = d.stateNode;
          d.flags & 32 && (ob(e, ""), d.flags &= -33);
          var f2 = Uj(a);
          Wj(a, f2, e);
          break;
        case 3:
        case 4:
          var g = d.stateNode.containerInfo, h = Uj(a);
          Vj(a, h, g);
          break;
        default:
          throw Error(p(161));
      }
    } catch (k2) {
      W(a, a.return, k2);
    }
    a.flags &= -3;
  }
  b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
  V = a;
  ik(a);
}
function ik(a, b, c) {
  for (var d = 0 !== (a.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d) {
      var g = null !== e.memoizedState || Jj;
      if (!g) {
        var h = e.alternate, k2 = null !== h && null !== h.memoizedState || U;
        h = Jj;
        var l2 = U;
        Jj = g;
        if ((U = k2) && !l2) for (V = e; null !== V; ) g = V, k2 = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k2 ? (k2.return = g, V = k2) : jk(e);
        for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
        V = e;
        Jj = h;
        U = l2;
      }
      kk(a);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : kk(a);
  }
}
function kk(a) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Qj(5, b);
            break;
          case 1:
            var d = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
              d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && sh(b, f2, d);
            break;
          case 3:
            var g = b.updateQueue;
            if (null !== g) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              sh(b, g, c);
            }
            break;
          case 5:
            var h = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h;
              var k2 = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k2.autoFocus && c.focus();
                  break;
                case "img":
                  k2.src && (c.src = k2.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p(163));
        }
        U || b.flags & 512 && Rj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function gk(a) {
  for (; null !== V; ) {
    var b = V;
    if (b === a) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function jk(a) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Qj(4, b);
          } catch (k2) {
            W(b, c, k2);
          }
          break;
        case 1:
          var d = b.stateNode;
          if ("function" === typeof d.componentDidMount) {
            var e = b.return;
            try {
              d.componentDidMount();
            } catch (k2) {
              W(b, e, k2);
            }
          }
          var f2 = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, f2, k2);
          }
          break;
        case 5:
          var g = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, g, k2);
          }
      }
    } catch (k2) {
      W(b, b.return, k2);
    }
    if (b === a) {
      V = null;
      break;
    }
    var h = b.sibling;
    if (null !== h) {
      h.return = b.return;
      V = h;
      break;
    }
    V = b.return;
  }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
  return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
  if (0 === (a.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
  if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
  a = C;
  if (0 !== a) return a;
  a = window.event;
  a = void 0 === a ? 16 : jd(a.type);
  return a;
}
function gi(a, b, c, d) {
  if (50 < yk) throw yk = 0, zk = null, Error(p(185));
  Ac(a, c, d);
  if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
  var c = a.callbackNode;
  wc(a, b);
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
  else if (b = d & -d, a.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Fk(c, Gk.bind(null, a));
    }
    a.callbackPriority = b;
    a.callbackNode = c;
  }
}
function Gk(a, b) {
  Ak = -1;
  Bk = 0;
  if (0 !== (K & 6)) throw Error(p(327));
  var c = a.callbackNode;
  if (Hk() && a.callbackNode !== c) return null;
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) return null;
  if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
  else {
    b = d;
    var e = K;
    K |= 2;
    var f2 = Jk();
    if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
    do
      try {
        Lk();
        break;
      } catch (h) {
        Mk(a, h);
      }
    while (1);
    $g();
    mk.current = f2;
    K = e;
    null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
    if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
    if (6 === b) Ck(a, d);
    else {
      e = a.current.alternate;
      if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f2 = xc(a), 0 !== f2 && (d = f2, b = Nk(a, f2))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      a.finishedWork = e;
      a.finishedLanes = d;
      switch (b) {
        case 0:
        case 1:
          throw Error(p(345));
        case 2:
          Pk(a, tk, uk);
          break;
        case 3:
          Ck(a, d);
          if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
            if (0 !== uc(a, 0)) break;
            e = a.suspendedLanes;
            if ((e & d) !== d) {
              R();
              a.pingedLanes |= a.suspendedLanes & e;
              break;
            }
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 4:
          Ck(a, d);
          if ((d & 4194240) === d) break;
          b = a.eventTimes;
          for (e = -1; 0 < d; ) {
            var g = 31 - oc(d);
            f2 = 1 << g;
            g = b[g];
            g > e && (e = g);
            d &= ~f2;
          }
          d = e;
          d = B() - d;
          d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
          if (10 < d) {
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 5:
          Pk(a, tk, uk);
          break;
        default:
          throw Error(p(329));
      }
    }
  }
  Dk(a, B());
  return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
  var c = sk;
  a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
  a = Ik(a, b);
  2 !== a && (b = tk, tk = c, null !== b && Fj(b));
  return a;
}
function Fj(a) {
  null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
  for (var b = a; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
        var e = c[d], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He(f2(), e)) return false;
        } catch (g) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Ck(a, b) {
  b &= ~rk;
  b &= ~qk;
  a.suspendedLanes |= b;
  a.pingedLanes &= ~b;
  for (a = a.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d = 1 << c;
    a[c] = -1;
    b &= ~d;
  }
}
function Ek(a) {
  if (0 !== (K & 6)) throw Error(p(327));
  Hk();
  var b = uc(a, 0);
  if (0 === (b & 1)) return Dk(a, B()), null;
  var c = Ik(a, b);
  if (0 !== a.tag && 2 === c) {
    var d = xc(a);
    0 !== d && (b = d, c = Nk(a, d));
  }
  if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
  if (6 === c) throw Error(p(345));
  a.finishedWork = a.current.alternate;
  a.finishedLanes = b;
  Pk(a, tk, uk);
  Dk(a, B());
  return null;
}
function Qk(a, b) {
  var c = K;
  K |= 1;
  try {
    return a(b);
  } finally {
    K = c, 0 === K && (Gj = B() + 500, fg && jg());
  }
}
function Rk(a) {
  null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
  var b = K;
  K |= 1;
  var c = ok.transition, d = C;
  try {
    if (ok.transition = null, C = 1, a) return a();
  } finally {
    C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Hj() {
  fj = ej.current;
  E(ej);
}
function Kk(a, b) {
  a.finishedWork = null;
  a.finishedLanes = 0;
  var c = a.timeoutHandle;
  -1 !== c && (a.timeoutHandle = -1, Gf(c));
  if (null !== Y) for (c = Y.return; null !== c; ) {
    var d = c;
    wg(d);
    switch (d.tag) {
      case 1:
        d = d.type.childContextTypes;
        null !== d && void 0 !== d && $f();
        break;
      case 3:
        zh();
        E(Wf);
        E(H);
        Eh();
        break;
      case 5:
        Bh(d);
        break;
      case 4:
        zh();
        break;
      case 13:
        E(L);
        break;
      case 19:
        E(L);
        break;
      case 10:
        ah(d.type._context);
        break;
      case 22:
      case 23:
        Hj();
    }
    c = c.return;
  }
  Q = a;
  Y = a = Pg(a.current, null);
  Z = fj = b;
  T = 0;
  pk = null;
  rk = qk = rh = 0;
  tk = sk = null;
  if (null !== fh) {
    for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
      c.interleaved = null;
      var e = d.next, f2 = c.pending;
      if (null !== f2) {
        var g = f2.next;
        f2.next = e;
        d.next = g;
      }
      c.pending = d;
    }
    fh = null;
  }
  return a;
}
function Mk(a, b) {
  do {
    var c = Y;
    try {
      $g();
      Fh.current = Rh;
      if (Ih) {
        for (var d = M.memoizedState; null !== d; ) {
          var e = d.queue;
          null !== e && (e.pending = null);
          d = d.next;
        }
        Ih = false;
      }
      Hh = 0;
      O = N = M = null;
      Jh = false;
      Kh = 0;
      nk.current = null;
      if (null === c || null === c.return) {
        T = 1;
        pk = b;
        Y = null;
        break;
      }
      a: {
        var f2 = a, g = c.return, h = c, k2 = b;
        b = Z;
        h.flags |= 32768;
        if (null !== k2 && "object" === typeof k2 && "function" === typeof k2.then) {
          var l2 = k2, m2 = h, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Ui(g);
          if (null !== y2) {
            y2.flags &= -257;
            Vi(y2, g, h, f2, b);
            y2.mode & 1 && Si(f2, l2, b);
            b = y2;
            k2 = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k2);
              b.updateQueue = t2;
            } else n2.add(k2);
            break a;
          } else {
            if (0 === (b & 1)) {
              Si(f2, l2, b);
              tj();
              break a;
            }
            k2 = Error(p(426));
          }
        } else if (I && h.mode & 1) {
          var J2 = Ui(g);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Vi(J2, g, h, f2, b);
            Jg(Ji(k2, h));
            break a;
          }
        }
        f2 = k2 = Ji(k2, h);
        4 !== T && (T = 2);
        null === sk ? sk = [f2] : sk.push(f2);
        f2 = g;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Ni(f2, k2, b);
              ph(f2, x2);
              break a;
            case 1:
              h = k2;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Ri || !Ri.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Qi(f2, h, b);
                ph(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Sk(c);
    } catch (na) {
      b = na;
      Y === c && null !== c && (Y = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Jk() {
  var a = mk.current;
  mk.current = Rh;
  return null === a ? Rh : a;
}
function tj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
}
function Ik(a, b) {
  var c = K;
  K |= 2;
  var d = Jk();
  if (Q !== a || Z !== b) uk = null, Kk(a, b);
  do
    try {
      Tk();
      break;
    } catch (e) {
      Mk(a, e);
    }
  while (1);
  $g();
  K = c;
  mk.current = d;
  if (null !== Y) throw Error(p(261));
  Q = null;
  Z = 0;
  return T;
}
function Tk() {
  for (; null !== Y; ) Uk(Y);
}
function Lk() {
  for (; null !== Y && !cc(); ) Uk(Y);
}
function Uk(a) {
  var b = Vk(a.alternate, a, fj);
  a.memoizedProps = a.pendingProps;
  null === b ? Sk(a) : Y = b;
  nk.current = null;
}
function Sk(a) {
  var b = a;
  do {
    var c = b.alternate;
    a = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Ej(c, b, fj), null !== c) {
        Y = c;
        return;
      }
    } else {
      c = Ij(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y = c;
        return;
      }
      if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
      else {
        T = 6;
        Y = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y = b;
      return;
    }
    Y = b = a;
  } while (null !== b);
  0 === T && (T = 5);
}
function Pk(a, b, c) {
  var d = C, e = ok.transition;
  try {
    ok.transition = null, C = 1, Wk(a, b, c, d);
  } finally {
    ok.transition = e, C = d;
  }
  return null;
}
function Wk(a, b, c, d) {
  do
    Hk();
  while (null !== wk);
  if (0 !== (K & 6)) throw Error(p(327));
  c = a.finishedWork;
  var e = a.finishedLanes;
  if (null === c) return null;
  a.finishedWork = null;
  a.finishedLanes = 0;
  if (c === a.current) throw Error(p(177));
  a.callbackNode = null;
  a.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a, f2);
  a === Q && (Y = Q = null, Z = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
    Hk();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = ok.transition;
    ok.transition = null;
    var g = C;
    C = 1;
    var h = K;
    K |= 4;
    nk.current = null;
    Oj(a, c);
    dk(c, a);
    Oe(Df);
    dd = !!Cf;
    Df = Cf = null;
    a.current = c;
    hk(c);
    dc();
    K = h;
    C = g;
    ok.transition = f2;
  } else a.current = c;
  vk && (vk = false, wk = a, xk = e);
  f2 = a.pendingLanes;
  0 === f2 && (Ri = null);
  mc(c.stateNode);
  Dk(a, B());
  if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
  if (Oi) throw Oi = false, a = Pi, Pi = null, a;
  0 !== (xk & 1) && 0 !== a.tag && Hk();
  f2 = a.pendingLanes;
  0 !== (f2 & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
  jg();
  return null;
}
function Hk() {
  if (null !== wk) {
    var a = Dc(xk), b = ok.transition, c = C;
    try {
      ok.transition = null;
      C = 16 > a ? 16 : a;
      if (null === wk) var d = false;
      else {
        a = wk;
        wk = null;
        xk = 0;
        if (0 !== (K & 6)) throw Error(p(331));
        var e = K;
        K |= 4;
        for (V = a.current; null !== V; ) {
          var f2 = V, g = f2.child;
          if (0 !== (V.flags & 16)) {
            var h = f2.deletions;
            if (null !== h) {
              for (var k2 = 0; k2 < h.length; k2++) {
                var l2 = h[k2];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Sj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Pj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a.current;
        for (V = w2; null !== V; ) {
          g = V;
          var u2 = g.child;
          if (0 !== (g.subtreeFlags & 2064) && null !== u2) u2.return = g, V = u2;
          else b: for (g = w2; null !== V; ) {
            h = V;
            if (0 !== (h.flags & 2048)) try {
              switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Qj(9, h);
              }
            } catch (na) {
              W(h, h.return, na);
            }
            if (h === g) {
              V = null;
              break b;
            }
            var F2 = h.sibling;
            if (null !== F2) {
              F2.return = h.return;
              V = F2;
              break b;
            }
            V = h.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a);
        } catch (na) {
        }
        d = true;
      }
      return d;
    } finally {
      C = c, ok.transition = b;
    }
  }
  return false;
}
function Xk(a, b, c) {
  b = Ji(c, b);
  b = Ni(a, b, 1);
  a = nh(a, b, 1);
  b = R();
  null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
  if (3 === a.tag) Xk(a, a, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Xk(b, a, c);
      break;
    } else if (1 === b.tag) {
      var d = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
        a = Ji(c, a);
        a = Qi(b, a, 1);
        b = nh(b, a, 1);
        a = R();
        null !== b && (Ac(b, 1, a), Dk(b, a));
        break;
      }
    }
    b = b.return;
  }
}
function Ti(a, b, c) {
  var d = a.pingCache;
  null !== d && d.delete(b);
  b = R();
  a.pingedLanes |= a.suspendedLanes & c;
  Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
  Dk(a, b);
}
function Yk(a, b) {
  0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = R();
  a = ih(a, b);
  null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
  var b = a.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Yk(a, c);
}
function bk(a, b) {
  var c = 0;
  switch (a.tag) {
    case 13:
      var d = a.stateNode;
      var e = a.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d = a.stateNode;
      break;
    default:
      throw Error(p(314));
  }
  null !== d && d.delete(b);
  Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
  if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
  else {
    if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
    dh = 0 !== (a.flags & 131072) ? true : false;
  }
  else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d = b.type;
      ij(a, b);
      a = b.pendingProps;
      var e = Yf(b, H.current);
      ch(b, c);
      e = Nh(null, b, d, a, e, c);
      var f2 = Sh();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d = b.elementType;
      a: {
        ij(a, b);
        a = b.pendingProps;
        e = d._init;
        d = e(d._payload);
        b.type = d;
        e = b.tag = Zk(d);
        a = Ci(d, a);
        switch (e) {
          case 0:
            b = cj(null, b, d, a, c);
            break a;
          case 1:
            b = hj(null, b, d, a, c);
            break a;
          case 11:
            b = Yi(null, b, d, a, c);
            break a;
          case 14:
            b = $i(null, b, d, Ci(d.type, a), c);
            break a;
        }
        throw Error(p(
          306,
          d,
          ""
        ));
      }
      return b;
    case 0:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
    case 1:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
    case 3:
      a: {
        kj(b);
        if (null === a) throw Error(p(387));
        d = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        lh(a, b);
        qh(b, d, null, c);
        var g = b.memoizedState;
        d = g.element;
        if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ji(Error(p(423)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else if (d !== e) {
          e = Ji(Error(p(424)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d === e) {
            b = Zi(a, b, c);
            break a;
          }
          Xi(a, b, d, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f2 = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
    case 6:
      return null === a && Eg(b), null;
    case 13:
      return oj(a, b, c);
    case 4:
      return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
    case 11:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
    case 7:
      return Xi(a, b, b.pendingProps, c), b.child;
    case 8:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 12:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g = e.value;
        G(Wg, d._currentValue);
        d._currentValue = g;
        if (null !== f2) if (He(f2.value, g)) {
          if (f2.children === e.children && !Wf.current) {
            b = Zi(a, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h = f2.dependencies;
          if (null !== h) {
            g = f2.child;
            for (var k2 = h.firstContext; null !== k2; ) {
              if (k2.context === d) {
                if (1 === f2.tag) {
                  k2 = mh(-1, c & -c);
                  k2.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k2.next = k2 : (k2.next = m2.next, m2.next = k2);
                    l2.pending = k2;
                  }
                }
                f2.lanes |= c;
                k2 = f2.alternate;
                null !== k2 && (k2.lanes |= c);
                bh(
                  f2.return,
                  c,
                  b
                );
                h.lanes |= c;
                break;
              }
              k2 = k2.next;
            }
          } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g = f2.return;
            if (null === g) throw Error(p(341));
            g.lanes |= c;
            h = g.alternate;
            null !== h && (h.lanes |= c);
            bh(g, c, b);
            g = f2.sibling;
          } else g = f2.child;
          if (null !== g) g.return = f2;
          else for (g = f2; null !== g; ) {
            if (g === b) {
              g = null;
              break;
            }
            f2 = g.sibling;
            if (null !== f2) {
              f2.return = g.return;
              g = f2;
              break;
            }
            g = g.return;
          }
          f2 = g;
        }
        Xi(a, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
    case 14:
      return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
    case 15:
      return bj(a, b, b.type, b.pendingProps, c);
    case 17:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
    case 19:
      return xj(a, b, c);
    case 22:
      return dj(a, b, c);
  }
  throw Error(p(156, b.tag));
};
function Fk(a, b) {
  return ac(a, b);
}
function $k(a, b, c, d) {
  this.tag = a;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a, b, c, d) {
  return new $k(a, b, c, d);
}
function aj(a) {
  a = a.prototype;
  return !(!a || !a.isReactComponent);
}
function Zk(a) {
  if ("function" === typeof a) return aj(a) ? 1 : 0;
  if (void 0 !== a && null !== a) {
    a = a.$$typeof;
    if (a === Da) return 11;
    if (a === Ga) return 14;
  }
  return 2;
}
function Pg(a, b) {
  var c = a.alternate;
  null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a.flags & 14680064;
  c.childLanes = a.childLanes;
  c.lanes = a.lanes;
  c.child = a.child;
  c.memoizedProps = a.memoizedProps;
  c.memoizedState = a.memoizedState;
  c.updateQueue = a.updateQueue;
  b = a.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a.sibling;
  c.index = a.index;
  c.ref = a.ref;
  return c;
}
function Rg(a, b, c, d, e, f2) {
  var g = 2;
  d = a;
  if ("function" === typeof a) aj(a) && (g = 1);
  else if ("string" === typeof a) g = 5;
  else a: switch (a) {
    case ya:
      return Tg(c.children, e, f2, b);
    case za:
      g = 8;
      e |= 8;
      break;
    case Aa:
      return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f2, a;
    case Ea:
      return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f2, a;
    case Fa:
      return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f2, a;
    case Ia:
      return pj(c, e, f2, b);
    default:
      if ("object" === typeof a && null !== a) switch (a.$$typeof) {
        case Ba:
          g = 10;
          break a;
        case Ca:
          g = 9;
          break a;
        case Da:
          g = 11;
          break a;
        case Ga:
          g = 14;
          break a;
        case Ha:
          g = 16;
          d = null;
          break a;
      }
      throw Error(p(130, null == a ? a : typeof a, ""));
  }
  b = Bg(g, c, b, e);
  b.elementType = a;
  b.type = d;
  b.lanes = f2;
  return b;
}
function Tg(a, b, c, d) {
  a = Bg(7, a, d, b);
  a.lanes = c;
  return a;
}
function pj(a, b, c, d) {
  a = Bg(22, a, d, b);
  a.elementType = Ia;
  a.lanes = c;
  a.stateNode = { isHidden: false };
  return a;
}
function Qg(a, b, c) {
  a = Bg(6, a, null, b);
  a.lanes = c;
  return a;
}
function Sg(a, b, c) {
  b = Bg(4, null !== a.children ? a.children : [], a.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
  return b;
}
function al(a, b, c, d, e) {
  this.tag = b;
  this.containerInfo = a;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f2, g, h, k2) {
  a = new al(a, b, c, h, k2);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a.current = f2;
  f2.stateNode = a;
  f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  kh(f2);
  return a;
}
function cl(a, b, c) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
}
function dl(a) {
  if (!a) return Vf;
  a = a._reactInternals;
  a: {
    if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
    var b = a;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p(171));
  }
  if (1 === a.tag) {
    var c = a.type;
    if (Zf(c)) return bg(a, c, b);
  }
  return b;
}
function el(a, b, c, d, e, f2, g, h, k2) {
  a = bl(c, d, true, a, e, f2, g, h, k2);
  a.context = dl(null);
  c = a.current;
  d = R();
  e = yi(c);
  f2 = mh(d, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  nh(c, f2, e);
  a.current.lanes = e;
  Ac(a, e, d);
  Dk(a, d);
  return a;
}
function fl(a, b, c, d) {
  var e = b.current, f2 = R(), g = yi(e);
  c = dl(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = mh(f2, g);
  b.payload = { element: a };
  d = void 0 === d ? null : d;
  null !== d && (b.callback = d);
  a = nh(e, b, g);
  null !== a && (gi(a, e, g, f2), oh(a, e, g));
  return g;
}
function gl(a) {
  a = a.current;
  if (!a.child) return null;
  switch (a.child.tag) {
    case 5:
      return a.child.stateNode;
    default:
      return a.child.stateNode;
  }
}
function hl(a, b) {
  a = a.memoizedState;
  if (null !== a && null !== a.dehydrated) {
    var c = a.retryLane;
    a.retryLane = 0 !== c && c < b ? c : b;
  }
}
function il(a, b) {
  hl(a, b);
  (a = a.alternate) && hl(a, b);
}
function jl() {
  return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
  console.error(a);
};
function ll(a) {
  this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
  var b = this._internalRoot;
  if (null === b) throw Error(p(409));
  fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
  var a = this._internalRoot;
  if (null !== a) {
    this._internalRoot = null;
    var b = a.containerInfo;
    Rk(function() {
      fl(null, a, null, null);
    });
    b[uf] = null;
  }
};
function ml(a) {
  this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
  if (a) {
    var b = Hc();
    a = { blockedOn: null, target: a, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a);
    0 === c && Vc(a);
  }
};
function nl(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {
}
function ql(a, b, c, d, e) {
  if (e) {
    if ("function" === typeof d) {
      var f2 = d;
      d = function() {
        var a2 = gl(g);
        f2.call(a2);
      };
    }
    var g = el(b, d, a, 0, null, false, false, "", pl);
    a._reactRootContainer = g;
    a[uf] = g.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk();
    return g;
  }
  for (; e = a.lastChild; ) a.removeChild(e);
  if ("function" === typeof d) {
    var h = d;
    d = function() {
      var a2 = gl(k2);
      h.call(a2);
    };
  }
  var k2 = bl(a, 0, false, null, null, false, false, "", pl);
  a._reactRootContainer = k2;
  a[uf] = k2.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  Rk(function() {
    fl(b, k2, c, d);
  });
  return k2;
}
function rl(a, b, c, d, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g = f2;
    if ("function" === typeof e) {
      var h = e;
      e = function() {
        var a2 = gl(g);
        h.call(a2);
      };
    }
    fl(b, g, a, e);
  } else g = ql(c, b, a, e, d);
  return gl(g);
}
Ec = function(a) {
  switch (a.tag) {
    case 3:
      var b = a.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
      }
      break;
    case 13:
      Rk(function() {
        var b2 = ih(a, 1);
        if (null !== b2) {
          var c2 = R();
          gi(b2, a, 1, c2);
        }
      }), il(a, 1);
  }
};
Fc = function(a) {
  if (13 === a.tag) {
    var b = ih(a, 134217728);
    if (null !== b) {
      var c = R();
      gi(b, a, 134217728, c);
    }
    il(a, 134217728);
  }
};
Gc = function(a) {
  if (13 === a.tag) {
    var b = yi(a), c = ih(a, b);
    if (null !== c) {
      var d = R();
      gi(c, a, b, d);
    }
    il(a, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a, b) {
  var c = C;
  try {
    return C = a, b();
  } finally {
    C = c;
  }
};
yb = function(a, b, c) {
  switch (b) {
    case "input":
      bb(a, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d = c[b];
          if (d !== a && d.form === a.form) {
            var e = Db(d);
            if (!e) throw Error(p(90));
            Wa(d);
            bb(d, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a, c);
      break;
    case "select":
      b = c.value, null != b && fb(a, !!c.multiple, b, false);
  }
};
Gb = Qk;
Hb = Rk;
var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
  a = Zb(a);
  return null === a ? null : a.stateNode;
}, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!vl.isDisabled && vl.supportsFiber) try {
    kc = vl.inject(ul), lc = vl;
  } catch (a) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
reactDom_production_min.createPortal = function(a, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!nl(b)) throw Error(p(200));
  return cl(a, b, null, c);
};
reactDom_production_min.createRoot = function(a, b) {
  if (!nl(a)) throw Error(p(299));
  var c = false, d = "", e = kl;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = bl(a, 1, false, null, null, c, false, d, e);
  a[uf] = b.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  return new ll(b);
};
reactDom_production_min.findDOMNode = function(a) {
  if (null == a) return null;
  if (1 === a.nodeType) return a;
  var b = a._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a.render) throw Error(p(188));
    a = Object.keys(a).join(",");
    throw Error(p(268, a));
  }
  a = Zb(b);
  a = null === a ? null : a.stateNode;
  return a;
};
reactDom_production_min.flushSync = function(a) {
  return Rk(a);
};
reactDom_production_min.hydrate = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a, b, c) {
  if (!nl(a)) throw Error(p(405));
  var d = null != c && c.hydratedSources || null, e = false, f2 = "", g = kl;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
  b = el(b, null, a, 1, null != c ? c : null, e, false, f2, g);
  a[uf] = b.current;
  sf(a);
  if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new ml(b);
};
reactDom_production_min.render = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a) {
  if (!ol(a)) throw Error(p(40));
  return a._reactRootContainer ? (Rk(function() {
    rl(null, null, a, false, function() {
      a._reactRootContainer = null;
      a[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
  if (!ol(c)) throw Error(p(200));
  if (null == a || void 0 === a._reactInternals) throw Error(p(38));
  return rl(a, b, c, false, d);
};
reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
/**
 * @remix-run/router v1.23.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function _extends$1() {
  _extends$1 = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends$1.apply(this, arguments);
}
var Action;
(function(Action2) {
  Action2["Pop"] = "POP";
  Action2["Push"] = "PUSH";
  Action2["Replace"] = "REPLACE";
})(Action || (Action = {}));
const PopStateEventType = "popstate";
function createHashHistory(options) {
  if (options === void 0) {
    options = {};
  }
  function createHashLocation(window2, globalHistory) {
    let {
      pathname = "/",
      search = "",
      hash = ""
    } = parsePath(window2.location.hash.substr(1));
    if (!pathname.startsWith("/") && !pathname.startsWith(".")) {
      pathname = "/" + pathname;
    }
    return createLocation(
      "",
      {
        pathname,
        search,
        hash
      },
      // state defaults to `null` because `window.history.state` does
      globalHistory.state && globalHistory.state.usr || null,
      globalHistory.state && globalHistory.state.key || "default"
    );
  }
  function createHashHref(window2, to) {
    let base = window2.document.querySelector("base");
    let href = "";
    if (base && base.getAttribute("href")) {
      let url = window2.location.href;
      let hashIndex = url.indexOf("#");
      href = hashIndex === -1 ? url : url.slice(0, hashIndex);
    }
    return href + "#" + (typeof to === "string" ? to : createPath(to));
  }
  function validateHashLocation(location, to) {
    warning(location.pathname.charAt(0) === "/", "relative pathnames are not supported in hash history.push(" + JSON.stringify(to) + ")");
  }
  return getUrlBasedHistory(createHashLocation, createHashHref, validateHashLocation, options);
}
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
function warning(cond, message) {
  if (!cond) {
    if (typeof console !== "undefined") console.warn(message);
    try {
      throw new Error(message);
    } catch (e) {
    }
  }
}
function createKey() {
  return Math.random().toString(36).substr(2, 8);
}
function getHistoryState(location, index) {
  return {
    usr: location.state,
    key: location.key,
    idx: index
  };
}
function createLocation(current, to, state, key) {
  if (state === void 0) {
    state = null;
  }
  let location = _extends$1({
    pathname: typeof current === "string" ? current : current.pathname,
    search: "",
    hash: ""
  }, typeof to === "string" ? parsePath(to) : to, {
    state,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: to && to.key || key || createKey()
  });
  return location;
}
function createPath(_ref) {
  let {
    pathname = "/",
    search = "",
    hash = ""
  } = _ref;
  if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}
function parsePath(path) {
  let parsedPath = {};
  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substr(hashIndex);
      path = path.substr(0, hashIndex);
    }
    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substr(searchIndex);
      path = path.substr(0, searchIndex);
    }
    if (path) {
      parsedPath.pathname = path;
    }
  }
  return parsedPath;
}
function getUrlBasedHistory(getLocation, createHref, validateLocation, options) {
  if (options === void 0) {
    options = {};
  }
  let {
    window: window2 = document.defaultView,
    v5Compat = false
  } = options;
  let globalHistory = window2.history;
  let action = Action.Pop;
  let listener = null;
  let index = getIndex();
  if (index == null) {
    index = 0;
    globalHistory.replaceState(_extends$1({}, globalHistory.state, {
      idx: index
    }), "");
  }
  function getIndex() {
    let state = globalHistory.state || {
      idx: null
    };
    return state.idx;
  }
  function handlePop() {
    action = Action.Pop;
    let nextIndex = getIndex();
    let delta = nextIndex == null ? null : nextIndex - index;
    index = nextIndex;
    if (listener) {
      listener({
        action,
        location: history.location,
        delta
      });
    }
  }
  function push(to, state) {
    action = Action.Push;
    let location = createLocation(history.location, to, state);
    if (validateLocation) validateLocation(location, to);
    index = getIndex() + 1;
    let historyState = getHistoryState(location, index);
    let url = history.createHref(location);
    try {
      globalHistory.pushState(historyState, "", url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "DataCloneError") {
        throw error;
      }
      window2.location.assign(url);
    }
    if (v5Compat && listener) {
      listener({
        action,
        location: history.location,
        delta: 1
      });
    }
  }
  function replace(to, state) {
    action = Action.Replace;
    let location = createLocation(history.location, to, state);
    if (validateLocation) validateLocation(location, to);
    index = getIndex();
    let historyState = getHistoryState(location, index);
    let url = history.createHref(location);
    globalHistory.replaceState(historyState, "", url);
    if (v5Compat && listener) {
      listener({
        action,
        location: history.location,
        delta: 0
      });
    }
  }
  function createURL(to) {
    let base = window2.location.origin !== "null" ? window2.location.origin : window2.location.href;
    let href = typeof to === "string" ? to : createPath(to);
    href = href.replace(/ $/, "%20");
    invariant(base, "No window.location.(origin|href) available to create URL for href: " + href);
    return new URL(href, base);
  }
  let history = {
    get action() {
      return action;
    },
    get location() {
      return getLocation(window2, globalHistory);
    },
    listen(fn) {
      if (listener) {
        throw new Error("A history only accepts one active listener");
      }
      window2.addEventListener(PopStateEventType, handlePop);
      listener = fn;
      return () => {
        window2.removeEventListener(PopStateEventType, handlePop);
        listener = null;
      };
    },
    createHref(to) {
      return createHref(window2, to);
    },
    createURL,
    encodeLocation(to) {
      let url = createURL(to);
      return {
        pathname: url.pathname,
        search: url.search,
        hash: url.hash
      };
    },
    push,
    replace,
    go(n2) {
      return globalHistory.go(n2);
    }
  };
  return history;
}
var ResultType;
(function(ResultType2) {
  ResultType2["data"] = "data";
  ResultType2["deferred"] = "deferred";
  ResultType2["redirect"] = "redirect";
  ResultType2["error"] = "error";
})(ResultType || (ResultType = {}));
function matchRoutes(routes, locationArg, basename) {
  if (basename === void 0) {
    basename = "/";
  }
  return matchRoutesImpl(routes, locationArg, basename);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
  let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
  let pathname = stripBasename(location.pathname || "/", basename);
  if (pathname == null) {
    return null;
  }
  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);
  let matches = null;
  for (let i = 0; matches == null && i < branches.length; ++i) {
    let decoded = decodePath(pathname);
    matches = matchRouteBranch(branches[i], decoded);
  }
  return matches;
}
function flattenRoutes(routes, branches, parentsMeta, parentPath) {
  if (branches === void 0) {
    branches = [];
  }
  if (parentsMeta === void 0) {
    parentsMeta = [];
  }
  if (parentPath === void 0) {
    parentPath = "";
  }
  let flattenRoute = (route, index, relativePath) => {
    let meta = {
      relativePath: relativePath === void 0 ? route.path || "" : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route
    };
    if (meta.relativePath.startsWith("/")) {
      invariant(meta.relativePath.startsWith(parentPath), 'Absolute route path "' + meta.relativePath + '" nested under path ' + ('"' + parentPath + '" is not valid. An absolute child route path ') + "must start with the combined path of all its parent routes.");
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }
    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);
    if (route.children && route.children.length > 0) {
      invariant(
        // Our types know better, but runtime JS may not!
        // @ts-expect-error
        route.index !== true,
        "Index routes must not have child routes. Please remove " + ('all child routes from route path "' + path + '".')
      );
      flattenRoutes(route.children, branches, routesMeta, path);
    }
    if (route.path == null && !route.index) {
      return;
    }
    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta
    });
  };
  routes.forEach((route, index) => {
    var _route$path;
    if (route.path === "" || !((_route$path = route.path) != null && _route$path.includes("?"))) {
      flattenRoute(route, index);
    } else {
      for (let exploded of explodeOptionalSegments(route.path)) {
        flattenRoute(route, index, exploded);
      }
    }
  });
  return branches;
}
function explodeOptionalSegments(path) {
  let segments = path.split("/");
  if (segments.length === 0) return [];
  let [first, ...rest] = segments;
  let isOptional = first.endsWith("?");
  let required = first.replace(/\?$/, "");
  if (rest.length === 0) {
    return isOptional ? [required, ""] : [required];
  }
  let restExploded = explodeOptionalSegments(rest.join("/"));
  let result = [];
  result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
  if (isOptional) {
    result.push(...restExploded);
  }
  return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
  branches.sort((a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
}
const paramRe = /^:[\w-]+$/;
const dynamicSegmentValue = 3;
const indexRouteValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s) => s === "*";
function computeScore(path, index) {
  let segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }
  if (index) {
    initialScore += indexRouteValue;
  }
  return segments.filter((s) => !isSplat(s)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a, b) {
  let siblings = a.length === b.length && a.slice(0, -1).every((n2, i) => n2 === b[i]);
  return siblings ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    a[a.length - 1] - b[b.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function matchRouteBranch(branch, pathname, allowPartial) {
  let {
    routesMeta
  } = branch;
  let matchedParams = {};
  let matchedPathname = "/";
  let matches = [];
  for (let i = 0; i < routesMeta.length; ++i) {
    let meta = routesMeta[i];
    let end = i === routesMeta.length - 1;
    let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
    let match = matchPath({
      path: meta.relativePath,
      caseSensitive: meta.caseSensitive,
      end
    }, remainingPathname);
    let route = meta.route;
    if (!match) {
      return null;
    }
    Object.assign(matchedParams, match.params);
    matches.push({
      // TODO: Can this as be avoided?
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
      route
    });
    if (match.pathnameBase !== "/") {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }
  return matches;
}
function matchPath(pattern, pathname) {
  if (typeof pattern === "string") {
    pattern = {
      path: pattern,
      caseSensitive: false,
      end: true
    };
  }
  let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
  let match = pathname.match(matcher);
  if (!match) return null;
  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params = compiledParams.reduce((memo, _ref, index) => {
    let {
      paramName,
      isOptional
    } = _ref;
    if (paramName === "*") {
      let splatValue = captureGroups[index] || "";
      pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
    }
    const value = captureGroups[index];
    if (isOptional && !value) {
      memo[paramName] = void 0;
    } else {
      memo[paramName] = (value || "").replace(/%2F/g, "/");
    }
    return memo;
  }, {});
  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}
function compilePath(path, caseSensitive, end) {
  if (caseSensitive === void 0) {
    caseSensitive = false;
  }
  if (end === void 0) {
    end = true;
  }
  warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), 'Route path "' + path + '" will be treated as if it were ' + ('"' + path.replace(/\*$/, "/*") + '" because the `*` character must ') + "always follow a `/` in the pattern. To get rid of this warning, " + ('please change the route path to "' + path.replace(/\*$/, "/*") + '".'));
  let params = [];
  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
    params.push({
      paramName,
      isOptional: isOptional != null
    });
    return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
  });
  if (path.endsWith("*")) {
    params.push({
      paramName: "*"
    });
    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
  } else if (end) {
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    regexpSource += "(?:(?=\\/|$))";
  } else ;
  let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
  return [matcher, params];
}
function decodePath(value) {
  try {
    return value.split("/").map((v2) => decodeURIComponent(v2).replace(/\//g, "%2F")).join("/");
  } catch (error) {
    warning(false, 'The URL path "' + value + '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' + ("encoding (" + error + ")."));
    return value;
  }
}
function stripBasename(pathname, basename) {
  if (basename === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }
  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
  let nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return null;
  }
  return pathname.slice(startIndex) || "/";
}
const ABSOLUTE_URL_REGEX$1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const isAbsoluteUrl = (url) => ABSOLUTE_URL_REGEX$1.test(url);
function resolvePath(to, fromPathname) {
  if (fromPathname === void 0) {
    fromPathname = "/";
  }
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;
  let pathname;
  if (toPathname) {
    if (isAbsoluteUrl(toPathname)) {
      pathname = toPathname;
    } else {
      if (toPathname.includes("//")) {
        let oldPathname = toPathname;
        toPathname = toPathname.replace(/\/\/+/g, "/");
        warning(false, "Pathnames cannot have embedded double slashes - normalizing " + (oldPathname + " -> " + toPathname));
      }
      if (toPathname.startsWith("/")) {
        pathname = resolvePathname(toPathname.substring(1), "/");
      } else {
        pathname = resolvePathname(toPathname, fromPathname);
      }
    }
  } else {
    pathname = fromPathname;
  }
  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}
function resolvePathname(relativePath, fromPathname) {
  let segments = fromPathname.replace(/\/+$/, "").split("/");
  let relativeSegments = relativePath.split("/");
  relativeSegments.forEach((segment) => {
    if (segment === "..") {
      if (segments.length > 1) segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });
  return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
  return "Cannot include a '" + char + "' character in a manually specified " + ("`to." + field + "` field [" + JSON.stringify(path) + "].  Please separate it out to the ") + ("`to." + dest + "` field. Alternatively you may provide the full path as ") + 'a string in <Link to="..."> and the router will parse it for you.';
}
function getPathContributingMatches(matches) {
  return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches, v7_relativeSplatPath) {
  let pathMatches = getPathContributingMatches(matches);
  if (v7_relativeSplatPath) {
    return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
  }
  return pathMatches.map((match) => match.pathnameBase);
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative) {
  if (isPathRelative === void 0) {
    isPathRelative = false;
  }
  let to;
  if (typeof toArg === "string") {
    to = parsePath(toArg);
  } else {
    to = _extends$1({}, toArg);
    invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
    invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
    invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
  }
  let isEmptyPath = toArg === "" || to.pathname === "";
  let toPathname = isEmptyPath ? "/" : to.pathname;
  let from;
  if (toPathname == null) {
    from = locationPathname;
  } else {
    let routePathnameIndex = routePathnames.length - 1;
    if (!isPathRelative && toPathname.startsWith("..")) {
      let toSegments = toPathname.split("/");
      while (toSegments[0] === "..") {
        toSegments.shift();
        routePathnameIndex -= 1;
      }
      to.pathname = toSegments.join("/");
    }
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
  }
  let path = resolvePath(to, from);
  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
    path.pathname += "/";
  }
  return path;
}
const joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
const normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
const normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
const normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
function isRouteErrorResponse(error) {
  return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
const validMutationMethodsArr = ["post", "put", "patch", "delete"];
new Set(validMutationMethodsArr);
const validRequestMethodsArr = ["get", ...validMutationMethodsArr];
new Set(validRequestMethodsArr);
/**
 * React Router v6.30.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
const DataRouterContext = /* @__PURE__ */ reactExports.createContext(null);
const DataRouterStateContext = /* @__PURE__ */ reactExports.createContext(null);
const NavigationContext = /* @__PURE__ */ reactExports.createContext(null);
const LocationContext = /* @__PURE__ */ reactExports.createContext(null);
const RouteContext = /* @__PURE__ */ reactExports.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false
});
const RouteErrorContext = /* @__PURE__ */ reactExports.createContext(null);
function useInRouterContext() {
  return reactExports.useContext(LocationContext) != null;
}
function useLocation() {
  !useInRouterContext() ? invariant(false) : void 0;
  return reactExports.useContext(LocationContext).location;
}
function useIsomorphicLayoutEffect(cb2) {
  let isStatic = reactExports.useContext(NavigationContext).static;
  if (!isStatic) {
    reactExports.useLayoutEffect(cb2);
  }
}
function useNavigate() {
  let {
    isDataRoute
  } = reactExports.useContext(RouteContext);
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
  !useInRouterContext() ? invariant(false) : void 0;
  let dataRouterContext = reactExports.useContext(DataRouterContext);
  let {
    basename,
    future,
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  let activeRef = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = reactExports.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    if (!activeRef.current) return;
    if (typeof to === "number") {
      navigator2.go(to);
      return;
    }
    let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
    if (dataRouterContext == null && basename !== "/") {
      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
    }
    (!!options.replace ? navigator2.replace : navigator2.push)(path, options.state, options);
  }, [basename, navigator2, routePathnamesJson, locationPathname, dataRouterContext]);
  return navigate;
}
function useParams() {
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? routeMatch.params : {};
}
function useRoutes(routes, locationArg) {
  return useRoutesImpl(routes, locationArg);
}
function useRoutesImpl(routes, locationArg, dataRouterState, future) {
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    matches: parentMatches
  } = reactExports.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  routeMatch && routeMatch.route;
  let locationFromContext = useLocation();
  let location;
  if (locationArg) {
    var _parsedLocationArg$pa;
    let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    !(parentPathnameBase === "/" || ((_parsedLocationArg$pa = parsedLocationArg.pathname) == null ? void 0 : _parsedLocationArg$pa.startsWith(parentPathnameBase))) ? invariant(false) : void 0;
    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }
  let pathname = location.pathname || "/";
  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }
  let matches = matchRoutes(routes, {
    pathname: remainingPathname
  });
  let renderedMatches = _renderMatches(matches && matches.map((match) => Object.assign({}, match, {
    params: Object.assign({}, parentParams, match.params),
    pathname: joinPaths([
      parentPathnameBase,
      // Re-encode pathnames that were decoded inside matchRoutes
      navigator2.encodeLocation ? navigator2.encodeLocation(match.pathname).pathname : match.pathname
    ]),
    pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([
      parentPathnameBase,
      // Re-encode pathnames that were decoded inside matchRoutes
      navigator2.encodeLocation ? navigator2.encodeLocation(match.pathnameBase).pathname : match.pathnameBase
    ])
  })), parentMatches, dataRouterState, future);
  if (locationArg && renderedMatches) {
    return /* @__PURE__ */ reactExports.createElement(LocationContext.Provider, {
      value: {
        location: _extends({
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: "default"
        }, location),
        navigationType: Action.Pop
      }
    }, renderedMatches);
  }
  return renderedMatches;
}
function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error) ? error.status + " " + error.statusText : error instanceof Error ? error.message : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = {
    padding: "0.5rem",
    backgroundColor: lightgrey
  };
  let devInfo = null;
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ reactExports.createElement("h3", {
    style: {
      fontStyle: "italic"
    }
  }, message), stack ? /* @__PURE__ */ reactExports.createElement("pre", {
    style: preStyles
  }, stack) : null, devInfo);
}
const defaultErrorElement = /* @__PURE__ */ reactExports.createElement(DefaultErrorComponent, null);
class RenderErrorBoundary extends reactExports.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation
      };
    }
    return {
      error: props.error !== void 0 ? props.error : state.error,
      location: state.location,
      revalidation: props.revalidation || state.revalidation
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Router caught the following error during render", error, errorInfo);
  }
  render() {
    return this.state.error !== void 0 ? /* @__PURE__ */ reactExports.createElement(RouteContext.Provider, {
      value: this.props.routeContext
    }, /* @__PURE__ */ reactExports.createElement(RouteErrorContext.Provider, {
      value: this.state.error,
      children: this.props.component
    })) : this.props.children;
  }
}
function RenderedRoute(_ref) {
  let {
    routeContext,
    match,
    children
  } = _ref;
  let dataRouterContext = reactExports.useContext(DataRouterContext);
  if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }
  return /* @__PURE__ */ reactExports.createElement(RouteContext.Provider, {
    value: routeContext
  }, children);
}
function _renderMatches(matches, parentMatches, dataRouterState, future) {
  var _dataRouterState;
  if (parentMatches === void 0) {
    parentMatches = [];
  }
  if (dataRouterState === void 0) {
    dataRouterState = null;
  }
  if (future === void 0) {
    future = null;
  }
  if (matches == null) {
    var _future;
    if (!dataRouterState) {
      return null;
    }
    if (dataRouterState.errors) {
      matches = dataRouterState.matches;
    } else if ((_future = future) != null && _future.v7_partialHydration && parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
      matches = dataRouterState.matches;
    } else {
      return null;
    }
  }
  let renderedMatches = matches;
  let errors = (_dataRouterState = dataRouterState) == null ? void 0 : _dataRouterState.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex((m2) => m2.route.id && (errors == null ? void 0 : errors[m2.route.id]) !== void 0);
    !(errorIndex >= 0) ? invariant(false) : void 0;
    renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
  }
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterState && future && future.v7_partialHydration) {
    for (let i = 0; i < renderedMatches.length; i++) {
      let match = renderedMatches[i];
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i;
      }
      if (match.route.id) {
        let {
          loaderData,
          errors: errors2
        } = dataRouterState;
        let needsToRunLoader = match.route.loader && loaderData[match.route.id] === void 0 && (!errors2 || errors2[match.route.id] === void 0);
        if (match.route.lazy || needsToRunLoader) {
          renderFallback = true;
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }
  return renderedMatches.reduceRight((outlet, match, index) => {
    let error;
    let shouldRenderHydrateFallback = false;
    let errorElement = null;
    let hydrateFallbackElement = null;
    if (dataRouterState) {
      error = errors && match.route.id ? errors[match.route.id] : void 0;
      errorElement = match.route.errorElement || defaultErrorElement;
      if (renderFallback) {
        if (fallbackIndex < 0 && index === 0) {
          warningOnce("route-fallback");
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = null;
        } else if (fallbackIndex === index) {
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = match.route.hydrateFallbackElement || null;
        }
      }
    }
    let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
    let getChildren = () => {
      let children;
      if (error) {
        children = errorElement;
      } else if (shouldRenderHydrateFallback) {
        children = hydrateFallbackElement;
      } else if (match.route.Component) {
        children = /* @__PURE__ */ reactExports.createElement(match.route.Component, null);
      } else if (match.route.element) {
        children = match.route.element;
      } else {
        children = outlet;
      }
      return /* @__PURE__ */ reactExports.createElement(RenderedRoute, {
        match,
        routeContext: {
          outlet,
          matches: matches2,
          isDataRoute: dataRouterState != null
        },
        children
      });
    };
    return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ reactExports.createElement(RenderErrorBoundary, {
      location: dataRouterState.location,
      revalidation: dataRouterState.revalidation,
      component: errorElement,
      error,
      children: getChildren(),
      routeContext: {
        outlet: null,
        matches: matches2,
        isDataRoute: true
      }
    }) : getChildren();
  }, null);
}
var DataRouterHook$1 = /* @__PURE__ */ function(DataRouterHook2) {
  DataRouterHook2["UseBlocker"] = "useBlocker";
  DataRouterHook2["UseRevalidator"] = "useRevalidator";
  DataRouterHook2["UseNavigateStable"] = "useNavigate";
  return DataRouterHook2;
}(DataRouterHook$1 || {});
var DataRouterStateHook$1 = /* @__PURE__ */ function(DataRouterStateHook2) {
  DataRouterStateHook2["UseBlocker"] = "useBlocker";
  DataRouterStateHook2["UseLoaderData"] = "useLoaderData";
  DataRouterStateHook2["UseActionData"] = "useActionData";
  DataRouterStateHook2["UseRouteError"] = "useRouteError";
  DataRouterStateHook2["UseNavigation"] = "useNavigation";
  DataRouterStateHook2["UseRouteLoaderData"] = "useRouteLoaderData";
  DataRouterStateHook2["UseMatches"] = "useMatches";
  DataRouterStateHook2["UseRevalidator"] = "useRevalidator";
  DataRouterStateHook2["UseNavigateStable"] = "useNavigate";
  DataRouterStateHook2["UseRouteId"] = "useRouteId";
  return DataRouterStateHook2;
}(DataRouterStateHook$1 || {});
function useDataRouterContext(hookName) {
  let ctx = reactExports.useContext(DataRouterContext);
  !ctx ? invariant(false) : void 0;
  return ctx;
}
function useDataRouterState(hookName) {
  let state = reactExports.useContext(DataRouterStateContext);
  !state ? invariant(false) : void 0;
  return state;
}
function useRouteContext(hookName) {
  let route = reactExports.useContext(RouteContext);
  !route ? invariant(false) : void 0;
  return route;
}
function useCurrentRouteId(hookName) {
  let route = useRouteContext();
  let thisRoute = route.matches[route.matches.length - 1];
  !thisRoute.route.id ? invariant(false) : void 0;
  return thisRoute.route.id;
}
function useRouteError() {
  var _state$errors;
  let error = reactExports.useContext(RouteErrorContext);
  let state = useDataRouterState();
  let routeId = useCurrentRouteId();
  if (error !== void 0) {
    return error;
  }
  return (_state$errors = state.errors) == null ? void 0 : _state$errors[routeId];
}
function useNavigateStable() {
  let {
    router
  } = useDataRouterContext(DataRouterHook$1.UseNavigateStable);
  let id2 = useCurrentRouteId(DataRouterStateHook$1.UseNavigateStable);
  let activeRef = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = reactExports.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    if (!activeRef.current) return;
    if (typeof to === "number") {
      router.navigate(to);
    } else {
      router.navigate(to, _extends({
        fromRouteId: id2
      }, options));
    }
  }, [router, id2]);
  return navigate;
}
const alreadyWarned$1 = {};
function warningOnce(key, cond, message) {
  if (!alreadyWarned$1[key]) {
    alreadyWarned$1[key] = true;
  }
}
function logV6DeprecationWarnings(renderFuture, routerFuture) {
  if ((renderFuture == null ? void 0 : renderFuture.v7_startTransition) === void 0) ;
  if ((renderFuture == null ? void 0 : renderFuture.v7_relativeSplatPath) === void 0 && true) ;
}
function Route(_props) {
  invariant(false);
}
function Router(_ref5) {
  let {
    basename: basenameProp = "/",
    children = null,
    location: locationProp,
    navigationType = Action.Pop,
    navigator: navigator2,
    static: staticProp = false,
    future
  } = _ref5;
  !!useInRouterContext() ? invariant(false) : void 0;
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = reactExports.useMemo(() => ({
    basename,
    navigator: navigator2,
    static: staticProp,
    future: _extends({
      v7_relativeSplatPath: false
    }, future)
  }), [basename, future, navigator2, staticProp]);
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }
  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default"
  } = locationProp;
  let locationContext = reactExports.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);
    if (trailingPathname == null) {
      return null;
    }
    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key
      },
      navigationType
    };
  }, [basename, pathname, search, hash, state, key, navigationType]);
  if (locationContext == null) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(NavigationContext.Provider, {
    value: navigationContext
  }, /* @__PURE__ */ reactExports.createElement(LocationContext.Provider, {
    children,
    value: locationContext
  }));
}
function Routes(_ref6) {
  let {
    children,
    location
  } = _ref6;
  return useRoutes(createRoutesFromChildren(children), location);
}
new Promise(() => {
});
function createRoutesFromChildren(children, parentPath) {
  if (parentPath === void 0) {
    parentPath = [];
  }
  let routes = [];
  reactExports.Children.forEach(children, (element, index) => {
    if (!/* @__PURE__ */ reactExports.isValidElement(element)) {
      return;
    }
    let treePath = [...parentPath, index];
    if (element.type === reactExports.Fragment) {
      routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
      return;
    }
    !(element.type === Route) ? invariant(false) : void 0;
    !(!element.props.index || !element.props.children) ? invariant(false) : void 0;
    let route = {
      id: element.props.id || treePath.join("-"),
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      Component: element.props.Component,
      index: element.props.index,
      path: element.props.path,
      loader: element.props.loader,
      action: element.props.action,
      errorElement: element.props.errorElement,
      ErrorBoundary: element.props.ErrorBoundary,
      hasErrorBoundary: element.props.ErrorBoundary != null || element.props.errorElement != null,
      shouldRevalidate: element.props.shouldRevalidate,
      handle: element.props.handle,
      lazy: element.props.lazy
    };
    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children, treePath);
    }
    routes.push(route);
  });
  return routes;
}
/**
 * React Router DOM v6.30.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function createSearchParams(init) {
  if (init === void 0) {
    init = "";
  }
  return new URLSearchParams(typeof init === "string" || Array.isArray(init) || init instanceof URLSearchParams ? init : Object.keys(init).reduce((memo, key) => {
    let value = init[key];
    return memo.concat(Array.isArray(value) ? value.map((v2) => [key, v2]) : [[key, value]]);
  }, []));
}
function getSearchParamsForLocation(locationSearch, defaultSearchParams) {
  let searchParams = createSearchParams(locationSearch);
  if (defaultSearchParams) {
    defaultSearchParams.forEach((_, key) => {
      if (!searchParams.has(key)) {
        defaultSearchParams.getAll(key).forEach((value) => {
          searchParams.append(key, value);
        });
      }
    });
  }
  return searchParams;
}
const REACT_ROUTER_VERSION = "6";
try {
  window.__reactRouterVersion = REACT_ROUTER_VERSION;
} catch (e) {
}
const START_TRANSITION = "startTransition";
const startTransitionImpl = React$1[START_TRANSITION];
function HashRouter(_ref5) {
  let {
    basename,
    children,
    future,
    window: window2
  } = _ref5;
  let historyRef = reactExports.useRef();
  if (historyRef.current == null) {
    historyRef.current = createHashHistory({
      window: window2,
      v5Compat: true
    });
  }
  let history = historyRef.current;
  let [state, setStateImpl] = reactExports.useState({
    action: history.action,
    location: history.location
  });
  let {
    v7_startTransition
  } = future || {};
  let setState = reactExports.useCallback((newState) => {
    v7_startTransition && startTransitionImpl ? startTransitionImpl(() => setStateImpl(newState)) : setStateImpl(newState);
  }, [setStateImpl, v7_startTransition]);
  reactExports.useLayoutEffect(() => history.listen(setState), [history, setState]);
  reactExports.useEffect(() => logV6DeprecationWarnings(future), [future]);
  return /* @__PURE__ */ reactExports.createElement(Router, {
    basename,
    children,
    location: state.location,
    navigationType: state.action,
    navigator: history,
    future
  });
}
var DataRouterHook;
(function(DataRouterHook2) {
  DataRouterHook2["UseScrollRestoration"] = "useScrollRestoration";
  DataRouterHook2["UseSubmit"] = "useSubmit";
  DataRouterHook2["UseSubmitFetcher"] = "useSubmitFetcher";
  DataRouterHook2["UseFetcher"] = "useFetcher";
  DataRouterHook2["useViewTransitionState"] = "useViewTransitionState";
})(DataRouterHook || (DataRouterHook = {}));
var DataRouterStateHook;
(function(DataRouterStateHook2) {
  DataRouterStateHook2["UseFetcher"] = "useFetcher";
  DataRouterStateHook2["UseFetchers"] = "useFetchers";
  DataRouterStateHook2["UseScrollRestoration"] = "useScrollRestoration";
})(DataRouterStateHook || (DataRouterStateHook = {}));
function useSearchParams(defaultInit) {
  let defaultSearchParamsRef = reactExports.useRef(createSearchParams(defaultInit));
  let hasSetSearchParamsRef = reactExports.useRef(false);
  let location = useLocation();
  let searchParams = reactExports.useMemo(() => (
    // Only merge in the defaults if we haven't yet called setSearchParams.
    // Once we call that we want those to take precedence, otherwise you can't
    // remove a param with setSearchParams({}) if it has an initial value
    getSearchParamsForLocation(location.search, hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current)
  ), [location.search]);
  let navigate = useNavigate();
  let setSearchParams = reactExports.useCallback((nextInit, navigateOptions) => {
    const newSearchParams = createSearchParams(typeof nextInit === "function" ? nextInit(searchParams) : nextInit);
    hasSetSearchParamsRef.current = true;
    navigate("?" + newSearchParams, navigateOptions);
  }, [navigate, searchParams]);
  return [searchParams, setSearchParams];
}
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api2 = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api2);
  return api2;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
const identity = (arg) => arg;
function useStore(api2, selector = identity) {
  const slice = React.useSyncExternalStore(
    api2.subscribe,
    React.useCallback(() => selector(api2.getState()), [api2, selector]),
    React.useCallback(() => selector(api2.getInitialState()), [api2, selector])
  );
  React.useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  const api2 = createStore(createState);
  const useBoundStore = (selector) => useStore(api2, selector);
  Object.assign(useBoundStore, api2);
  return useBoundStore;
};
const create = (createState) => createState ? createImpl(createState) : createImpl;
let _baseUrl = "";
let _token = "";
function setBaseUrl(url) {
  _baseUrl = url.replace(/\/+$/, "");
}
function setToken(token) {
  _token = token;
}
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function request(method, path, body) {
  if (!_baseUrl) throw new ApiError(0, "API server not configured");
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const resp = await fetch(`${_baseUrl}${path}`, {
    method,
    headers,
    body: body !== void 0 ? JSON.stringify(body) : void 0
  });
  if (resp.status === 401) {
    _token = "";
    throw new ApiError(401, "Unauthorized");
  }
  if (!resp.ok) {
    let msg = resp.statusText;
    try {
      const err = await resp.json();
      msg = err.error || err.message || msg;
    } catch {
    }
    throw new ApiError(resp.status, msg);
  }
  const text = await resp.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path, body) => request("DELETE", path, body)
};
async function login(username, password, deviceId) {
  return api.post("/api/login", {
    username,
    password,
    id: ""
  });
}
async function logout() {
  await api.post("/api/logout");
}
async function getCurrentUser() {
  return api.post("/api/currentUser");
}
const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: "",
  isLoggedIn: false,
  loading: false,
  error: "",
  login: async (username, password) => {
    set({ loading: true, error: "" });
    try {
      const res = await login(username, password);
      setToken(res.access_token);
      set({
        user: res.user,
        accessToken: res.access_token,
        isLoggedIn: true,
        loading: false,
        error: ""
      });
      await window.api.configSet("accessToken", res.access_token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      set({ loading: false, error: msg });
      throw err;
    }
  },
  logout: async () => {
    try {
      await logout();
    } catch {
    }
    setToken("");
    set({ user: null, accessToken: "", isLoggedIn: false });
    await window.api.configSet("accessToken", "");
  },
  refreshUser: async () => {
    try {
      const user = await getCurrentUser();
      set({ user, isLoggedIn: true });
    } catch {
      get().clearAuth();
    }
  },
  clearAuth: () => {
    setToken("");
    set({ user: null, accessToken: "", isLoggedIn: false });
    window.api.configSet("accessToken", "");
  },
  initFromConfig: async () => {
    const config = await window.api.configGetAll();
    const apiServer = config.apiServer;
    const token = config.accessToken;
    if (apiServer) setBaseUrl(apiServer);
    if (token) {
      setToken(token);
      set({ accessToken: token });
      try {
        const user = await getCurrentUser();
        set({ user, isLoggedIn: true });
      } catch {
        setToken("");
        set({ accessToken: "" });
        await window.api.configSet("accessToken", "");
      }
    }
  }
}));
async function getServerConfig() {
  return api.get("/api/server-config");
}
const NATIVE_OPTION_MAP = {
  idServer: "custom-rendezvous-server",
  relayServer: "relay-server",
  key: "key",
  apiServer: "api-server"
};
function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
}
async function syncToNative(key, value) {
  const nativeKey = NATIVE_OPTION_MAP[key];
  if (nativeKey) {
    try {
      await window.api.native.setOption(nativeKey, value);
    } catch {
    }
  }
}
const useSettingsStore = create((set, get) => ({
  apiServer: "",
  idServer: "",
  relayServer: "",
  key: "",
  theme: "dark",
  language: "zh-CN",
  displayQuality: "balanced",
  fps: 30,
  codec: "auto",
  updateSetting: async (key, value) => {
    set({ [key]: value });
    await window.api.configSet(key, value);
    if (typeof value === "string") {
      await syncToNative(key, value);
    }
    if (key === "apiServer" && typeof value === "string") {
      setBaseUrl(value);
    }
    if (key === "theme") {
      applyTheme(value);
    }
  },
  fetchServerConfig: async () => {
    try {
      const config = await getServerConfig();
      set({
        idServer: config.id_server || "",
        relayServer: config.relay_server || "",
        key: config.key || ""
      });
      await window.api.configSet("idServer", config.id_server || "");
      await window.api.configSet("relayServer", config.relay_server || "");
      await window.api.configSet("key", config.key || "");
      await syncToNative("idServer", config.id_server || "");
      await syncToNative("relayServer", config.relay_server || "");
      await syncToNative("key", config.key || "");
    } catch {
    }
  },
  loadFromConfig: async () => {
    const config = await window.api.configGetAll();
    const state = {};
    if (config.apiServer) state.apiServer = config.apiServer;
    if (config.idServer) state.idServer = config.idServer;
    if (config.relayServer) state.relayServer = config.relayServer;
    if (config.key) state.key = config.key;
    if (config.theme) state.theme = config.theme;
    if (config.language) state.language = config.language;
    if (config.displayQuality) state.displayQuality = config.displayQuality;
    if (config.fps) state.fps = config.fps;
    if (config.codec) state.codec = config.codec;
    set(state);
    if (state.apiServer) setBaseUrl(state.apiServer);
    applyTheme(state.theme || "dark");
    await syncToNative("idServer", state.idServer || "");
    await syncToNative("relayServer", state.relayServer || "");
    await syncToNative("key", state.key || "");
    await syncToNative("apiServer", state.apiServer || "");
  }
}));
let nextId = 0;
const useToastStore = create((set) => ({
  toasts: [],
  add: (message, type) => {
    const id2 = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id: id2, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t2) => t2.id !== id2) })), 3500);
  },
  remove: (id2) => set((s) => ({ toasts: s.toasts.filter((t2) => t2.id !== id2) }))
}));
function showToast(message, type = "info") {
  useToastStore.getState().add(message, type);
}
const icons = {
  success: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 6L9 17l-5-5" }) }),
  error: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M15 9l-6 6M9 9l6 6" })
  ] }),
  info: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 16v-4M12 8h.01" })
  ] })
};
const accentColors = {
  success: "from-emerald-500/90 to-emerald-600/90",
  error: "from-red-500/90 to-red-600/90",
  info: "from-blue-500/90 to-blue-600/90"
};
const barColors = {
  success: "bg-emerald-300",
  error: "bg-red-300",
  info: "bg-blue-300"
};
function ToastItem({ item, onRemove }) {
  const [exiting, setExiting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onRemove, 300);
    }, 3e3);
    return () => clearTimeout(timer);
  }, [onRemove]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative bg-gradient-to-r ${accentColors[item.type]} backdrop-blur-lg text-white pl-3.5 pr-3 py-3 rounded-xl shadow-lg max-w-xs flex items-center gap-2.5 overflow-hidden ${exiting ? "animate-toast-out" : "animate-toast-in"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 opacity-90", children: icons[item.type] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm font-medium leading-snug", children: item.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setExiting(true);
              setTimeout(onRemove, 300);
            },
            className: "opacity-60 hover:opacity-100 shrink-0 transition-opacity ml-1",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 2l6 6M8 2l-6 6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-[2px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full ${barColors[item.type]} opacity-50`, style: { animation: "progress-bar 3s linear forwards" } }) })
      ]
    }
  );
}
function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-14 right-4 z-[9999] flex flex-col gap-2.5", children: toasts.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToastItem, { item: t2, onRemove: () => remove(t2.id) }, t2.id)) });
}
const en = {
  // Sidebar
  "nav.remote": "Remote",
  "nav.addressBook": "Address",
  "nav.devices": "Devices",
  "nav.settings": "Settings",
  // Home
  "home.title": "Remote Desktop",
  "home.yourId": "Your ID",
  "home.password": "Password",
  "home.notRegistered": "Not registered",
  "home.requiresCore": "Requires Rust core",
  "home.connectTo": "Connect to Remote Device",
  "home.enterRemoteId": "Enter remote ID",
  "home.connect": "Connect",
  "home.forceRelay": "Always use relay (recommended if using VPN)",
  "home.recentConnections": "Recent Connections",
  "home.clear": "Clear",
  "home.noRecent": "No recent connections",
  "home.noRecentHint": "Enter a remote ID above to get started",
  "home.idCopied": "ID copied",
  "home.loggedInAs": "Logged in as",
  // Remote Desktop
  "remote.passwordRequired": "Password Required",
  "remote.enterPassword": "Enter the password for the remote device",
  "remote.password": "Password",
  "remote.rememberPassword": "Remember password",
  "remote.cancel": "Cancel",
  "remote.login": "Login",
  "remote.disconnect": "Disconnect",
  "remote.refresh": "Refresh",
  "remote.lockScreen": "Lock Screen",
  "remote.fullscreen": "Fullscreen",
  "remote.connectingTo": "Connecting to",
  "remote.connectingViaRelay": "Connecting via relay to",
  "remote.connectionError": "Connection Error",
  "remote.retry": "Retry",
  "remote.retryViaRelay": "Retry via Relay",
  "remote.close": "Close",
  "remote.disconnected": "Disconnected",
  "remote.reconnect": "Reconnect",
  "remote.invalidSession": "Invalid session parameters",
  "remote.status.connecting": "Connecting",
  "remote.status.connected": "Connected",
  "remote.status.loginRequired": "Login Required",
  "remote.status.disconnected": "Disconnected",
  "remote.status.error": "Error",
  // Settings
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.notLoggedIn": "Not logged in",
  "settings.login": "Login",
  "settings.logout": "Logout",
  "settings.loggedOut": "Logged out",
  "settings.general": "General",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.langZh": "Chinese (Simplified)",
  "settings.langEn": "English",
  "settings.security": "Security",
  "settings.securityHint": "Password management and approval settings require Rust core integration (Coming Soon)",
  "settings.network": "Network",
  "settings.apiServer": "API Server",
  "settings.idServer": "ID Server",
  "settings.relayServer": "Relay Server",
  "settings.key": "Key",
  "settings.fetchConfig": "Fetch Server Config",
  "settings.fetchSuccess": "Server config fetched successfully",
  "settings.fetchFailed": "Failed to fetch server config",
  "settings.display": "Display",
  "settings.quality": "Quality",
  "settings.qualityAuto": "Auto",
  "settings.qualityBest": "Best Quality",
  "settings.qualityBalanced": "Balanced",
  "settings.qualityLow": "Low Bandwidth",
  "settings.fps": "FPS",
  "settings.codec": "Codec",
  "settings.displayHint": "Display settings take effect when Rust core is integrated",
  "settings.about": "About",
  "settings.app": "App",
  "settings.version": "Version",
  "settings.platform": "Platform",
  "settings.hostname": "Hostname",
  "settings.osVersion": "OS Version",
  // Login Dialog
  "login.title": "Login to RDesk",
  "login.apiServer": "API Server",
  "login.username": "Username",
  "login.password": "Password",
  "login.enterUsername": "Enter username",
  "login.enterPassword": "Enter password",
  "login.submit": "Login",
  "login.loggingIn": "Logging in...",
  "login.success": "Login successful",
  "login.apiServerHint": "Auto-filled from Settings if configured",
  // Address Book
  "ab.loginRequired": "Please login to access address book",
  "ab.loginHint": "Go to Settings > Account to login",
  "ab.myAddressBook": "My Address Book",
  "ab.tags": "Tags",
  "ab.searchDevices": "Search devices...",
  "ab.deviceCount": "{0} devices",
  "ab.addDevice": "+ Add Device",
  "ab.noDevices": "No devices found",
  "ab.noDevicesSearch": "Try a different search",
  "ab.noDevicesAdd": 'Click "+ Add Device" to get started',
  "ab.noDevicesEmpty": "This address book is empty",
  "ab.deleteDevice": "Delete Device",
  "ab.deleteConfirm": "Are you sure you want to remove this device from the address book?",
  "ab.delete": "Delete",
  "ab.deviceRemoved": "Device removed",
  "ab.deleteFailed": "Failed to delete",
  "ab.deviceAdded": "Device added",
  "ab.deviceUpdated": "Device updated",
  "ab.listHeaderName": "Name",
  "ab.listHeaderUser": "User",
  "ab.listHeaderPlatform": "Platform",
  "ab.listHeaderTags": "Tags",
  // Accessible Devices
  "devices.loginRequired": "Please login to view accessible devices",
  "devices.loginHint": "Go to Settings > Account to login",
  "devices.groups": "Groups",
  "devices.users": "Users",
  "devices.allDevices": "All Devices",
  "devices.noGroups": "No groups",
  "devices.noUsers": "No users",
  "devices.searchDevices": "Search devices...",
  "devices.deviceCount": "{0} devices",
  "devices.noDevices": "No devices found",
  "devices.headerDeviceName": "Device Name",
  "devices.headerUser": "User",
  "devices.headerOS": "OS",
  "devices.headerGroup": "Group",
  "devices.headerStatus": "Status",
  "devices.online": "Online",
  "devices.offline": "Offline",
  // Add/Edit Peer Dialog
  "addPeer.addDevice": "Add Device",
  "addPeer.editDevice": "Edit Device",
  "addPeer.deviceId": "Device ID",
  "addPeer.deviceIdRequired": "Device ID is required",
  "addPeer.deviceIdPlaceholder": "e.g. 123 456 789",
  "addPeer.alias": "Alias",
  "addPeer.displayName": "Display name",
  "addPeer.note": "Note",
  "addPeer.optionalNote": "Optional note",
  "addPeer.tags": "Tags",
  "addPeer.cancel": "Cancel",
  "addPeer.saving": "Saving...",
  "addPeer.add": "Add",
  "addPeer.save": "Save",
  "addPeer.operationFailed": "Operation failed",
  // Peer Card / Context Menu
  "peer.connect": "Connect",
  "peer.copyId": "Copy ID",
  "peer.idCopied": "ID copied",
  "peer.edit": "Edit",
  "peer.delete": "Delete",
  // Tag List
  "tag.all": "All",
  "tag.untagged": "Untagged",
  "tag.tagName": "Tag name",
  "tag.addTag": "+ Add Tag",
  // Dialog defaults
  "dialog.cancel": "Cancel",
  "dialog.ok": "OK",
  // Home extra
  "home.passwordRefreshHint": "Password refresh requires Rust core (Coming Soon)",
  // TitleBar
  "titlebar.login": "Login",
  "titlebar.minimize": "Minimize",
  "titlebar.maximize": "Maximize",
  "titlebar.restore": "Restore",
  "titlebar.close": "Close",
  // Floating Ball
  "ball.hint": "RDesk - Click to expand, double-click for main window",
  "ball.connections": "Connections",
  "ball.openMain": "Open main window",
  "ball.collapse": "Collapse",
  "ball.noConnections": "No active connections",
  "ball.noConnectionsHint": "Connect to a remote device to see it here",
  "ball.connected": "Connected",
  // Chat
  "chat.title": "Chat",
  "chat.noMessages": "No messages yet",
  "chat.placeholder": "Type a message...",
  "chat.send": "Send",
  // File Transfer
  "file.title": "File Transfer",
  "file.browser": "Browser",
  "file.transfers": "Transfers",
  "file.local": "Local",
  "file.remote": "Remote",
  "file.upload": "Upload",
  "file.download": "Download",
  "file.noTransfers": "No active transfers",
  "file.completed": "Done",
  "file.failed": "Failed",
  // Remote session extras
  "remote.quality": "Quality Settings",
  "remote.performanceMode": "Performance Mode",
  "remote.modeOffice": "Office",
  "remote.modeStandard": "Standard",
  "remote.modeGame": "Game",
  "remote.qualitySettings": "Image Quality",
  "remote.toggles": "Options",
  "remote.showRemoteCursor": "Show remote cursor",
  "remote.disableAudio": "Disable audio",
  "remote.disableClipboard": "Disable clipboard",
  "remote.lockAfterDisconnect": "Lock after disconnect",
  "remote.chat": "Chat",
  "remote.fileTransfer": "File Transfer",
  // Multi-display
  "remote.displays": "Displays",
  "remote.allDisplays": "All Displays",
  "remote.connectionSecure": "Secure",
  "remote.connectionInsecure": "Insecure",
  "remote.connectionDirect": "Direct",
  "remote.connectionRelay": "Relay",
  // Session control actions
  "remote.actions": "Actions",
  "remote.restartDevice": "Restart remote device",
  "remote.restartConfirm": "Are you sure you want to restart the remote device?",
  "remote.blockInput": "Block user input",
  "remote.unblockInput": "Unblock user input",
  "remote.screenshot": "Screenshot",
  "remote.screenshotTaking": "Taking screenshot...",
  "remote.recording": "Recording",
  "remote.recordStart": "Start recording",
  "remote.recordStop": "Stop recording",
  "remote.privacyMode": "Privacy mode",
  "remote.elevation": "Request elevation",
  "remote.viewOnly": "View only",
  // Keyboard & input
  "remote.keyboardMode": "Keyboard mode",
  "remote.modeLegacy": "Legacy",
  "remote.modeMap": "Map",
  "remote.modeTranslate": "Translate (Beta)",
  "remote.reverseWheel": "Reverse mouse wheel",
  "remote.swapMouse": "Swap mouse buttons",
  "remote.swapCtrlCmd": "Swap Ctrl-Cmd",
  // Toolbar
  "remote.pinToolbar": "Pin toolbar",
  "remote.unpinToolbar": "Unpin toolbar",
  "remote.adjustWindow": "Adjust window",
  // Advanced display
  "remote.trueColor": "True Color (4:4:4)",
  "remote.followCursor": "Follow remote cursor",
  "remote.zoomCursor": "Zoom cursor"
};
const zhCN = {
  // Sidebar
  "nav.remote": "远程",
  "nav.addressBook": "地址簿",
  "nav.devices": "设备",
  "nav.settings": "设置",
  // Home
  "home.title": "远程桌面",
  "home.yourId": "你的 ID",
  "home.password": "密码",
  "home.notRegistered": "未注册",
  "home.requiresCore": "需要 Rust 核心",
  "home.connectTo": "连接到远程设备",
  "home.enterRemoteId": "输入远程 ID",
  "home.connect": "连接",
  "home.forceRelay": "始终使用中继（使用 VPN 时建议开启）",
  "home.recentConnections": "最近连接",
  "home.clear": "清除",
  "home.noRecent": "没有最近连接",
  "home.noRecentHint": "在上方输入远程 ID 开始连接",
  "home.idCopied": "ID 已复制",
  "home.loggedInAs": "已登录",
  // Remote Desktop
  "remote.passwordRequired": "需要密码",
  "remote.enterPassword": "请输入远程设备的密码",
  "remote.password": "密码",
  "remote.rememberPassword": "记住密码",
  "remote.cancel": "取消",
  "remote.login": "登录",
  "remote.disconnect": "断开连接",
  "remote.refresh": "刷新",
  "remote.lockScreen": "锁定屏幕",
  "remote.fullscreen": "全屏",
  "remote.connectingTo": "正在连接",
  "remote.connectingViaRelay": "正在通过中继连接",
  "remote.connectionError": "连接错误",
  "remote.retry": "重试",
  "remote.retryViaRelay": "通过中继重试",
  "remote.close": "关闭",
  "remote.disconnected": "已断开",
  "remote.reconnect": "重新连接",
  "remote.invalidSession": "无效的会话参数",
  "remote.status.connecting": "连接中",
  "remote.status.connected": "已连接",
  "remote.status.loginRequired": "需要登录",
  "remote.status.disconnected": "已断开",
  "remote.status.error": "错误",
  // Settings
  "settings.title": "设置",
  "settings.account": "账户",
  "settings.notLoggedIn": "未登录",
  "settings.login": "登录",
  "settings.logout": "退出登录",
  "settings.loggedOut": "已退出",
  "settings.general": "通用",
  "settings.language": "语言",
  "settings.theme": "主题",
  "settings.themeDark": "深色",
  "settings.themeLight": "浅色",
  "settings.langZh": "简体中文",
  "settings.langEn": "English",
  "settings.security": "安全",
  "settings.securityHint": "密码管理和审批设置需要 Rust 核心集成（即将推出）",
  "settings.network": "网络",
  "settings.apiServer": "API 服务器",
  "settings.idServer": "ID 服务器",
  "settings.relayServer": "中继服务器",
  "settings.key": "密钥",
  "settings.fetchConfig": "获取服务器配置",
  "settings.fetchSuccess": "服务器配置获取成功",
  "settings.fetchFailed": "获取服务器配置失败",
  "settings.display": "显示",
  "settings.quality": "画质",
  "settings.qualityAuto": "自动",
  "settings.qualityBest": "最佳画质",
  "settings.qualityBalanced": "平衡",
  "settings.qualityLow": "低带宽",
  "settings.fps": "帧率",
  "settings.codec": "编解码器",
  "settings.displayHint": "显示设置在 Rust 核心集成后生效",
  "settings.about": "关于",
  "settings.app": "应用",
  "settings.version": "版本",
  "settings.platform": "平台",
  "settings.hostname": "主机名",
  "settings.osVersion": "系统版本",
  // Login Dialog
  "login.title": "登录 RDesk",
  "login.apiServer": "API 服务器",
  "login.username": "用户名",
  "login.password": "密码",
  "login.enterUsername": "输入用户名",
  "login.enterPassword": "输入密码",
  "login.submit": "登录",
  "login.loggingIn": "登录中...",
  "login.success": "登录成功",
  "login.apiServerHint": "已从设置中自动填入（如已配置）",
  // Address Book
  "ab.loginRequired": "请登录以访问地址簿",
  "ab.loginHint": "前往 设置 > 账户 登录",
  "ab.myAddressBook": "我的地址簿",
  "ab.tags": "标签",
  "ab.searchDevices": "搜索设备...",
  "ab.deviceCount": "{0} 台设备",
  "ab.addDevice": "+ 添加设备",
  "ab.noDevices": "未找到设备",
  "ab.noDevicesSearch": "尝试其他搜索",
  "ab.noDevicesAdd": '点击"+ 添加设备"开始',
  "ab.noDevicesEmpty": "此地址簿为空",
  "ab.deleteDevice": "删除设备",
  "ab.deleteConfirm": "确定要从地址簿中移除此设备吗？",
  "ab.delete": "删除",
  "ab.deviceRemoved": "设备已移除",
  "ab.deleteFailed": "删除失败",
  "ab.deviceAdded": "设备已添加",
  "ab.deviceUpdated": "设备已更新",
  "ab.listHeaderName": "名称",
  "ab.listHeaderUser": "用户",
  "ab.listHeaderPlatform": "平台",
  "ab.listHeaderTags": "标签",
  // Accessible Devices
  "devices.loginRequired": "请登录以查看可访问设备",
  "devices.loginHint": "前往 设置 > 账户 登录",
  "devices.groups": "分组",
  "devices.users": "用户",
  "devices.allDevices": "全部设备",
  "devices.noGroups": "无分组",
  "devices.noUsers": "无用户",
  "devices.searchDevices": "搜索设备...",
  "devices.deviceCount": "{0} 台设备",
  "devices.noDevices": "未找到设备",
  "devices.headerDeviceName": "设备名称",
  "devices.headerUser": "用户",
  "devices.headerOS": "系统",
  "devices.headerGroup": "分组",
  "devices.headerStatus": "状态",
  "devices.online": "在线",
  "devices.offline": "离线",
  // Add/Edit Peer Dialog
  "addPeer.addDevice": "添加设备",
  "addPeer.editDevice": "编辑设备",
  "addPeer.deviceId": "设备 ID",
  "addPeer.deviceIdRequired": "设备 ID 不能为空",
  "addPeer.deviceIdPlaceholder": "例如 123 456 789",
  "addPeer.alias": "别名",
  "addPeer.displayName": "显示名称",
  "addPeer.note": "备注",
  "addPeer.optionalNote": "可选备注",
  "addPeer.tags": "标签",
  "addPeer.cancel": "取消",
  "addPeer.saving": "保存中...",
  "addPeer.add": "添加",
  "addPeer.save": "保存",
  "addPeer.operationFailed": "操作失败",
  // Peer Card / Context Menu
  "peer.connect": "连接",
  "peer.copyId": "复制 ID",
  "peer.idCopied": "ID 已复制",
  "peer.edit": "编辑",
  "peer.delete": "删除",
  // Tag List
  "tag.all": "全部",
  "tag.untagged": "未标记",
  "tag.tagName": "标签名称",
  "tag.addTag": "+ 添加标签",
  // Dialog defaults
  "dialog.cancel": "取消",
  "dialog.ok": "确定",
  // Home extra
  "home.passwordRefreshHint": "刷新密码需要 Rust 核心（即将推出）",
  // TitleBar
  "titlebar.login": "登录",
  "titlebar.minimize": "最小化",
  "titlebar.maximize": "最大化",
  "titlebar.restore": "还原",
  "titlebar.close": "关闭",
  // Floating Ball
  "ball.hint": "RDesk - 点击展开，双击打开主窗口",
  "ball.connections": "连接",
  "ball.openMain": "打开主窗口",
  "ball.collapse": "收起",
  "ball.noConnections": "无活跃连接",
  "ball.noConnectionsHint": "连接到远程设备后会显示在这里",
  "ball.connected": "已连接",
  // Chat
  "chat.title": "聊天",
  "chat.noMessages": "暂无消息",
  "chat.placeholder": "输入消息...",
  "chat.send": "发送",
  // File Transfer
  "file.title": "文件传输",
  "file.browser": "浏览",
  "file.transfers": "传输",
  "file.local": "本地",
  "file.remote": "远程",
  "file.upload": "上传",
  "file.download": "下载",
  "file.noTransfers": "无活跃传输",
  "file.completed": "完成",
  "file.failed": "失败",
  // Remote session extras
  "remote.quality": "画质设置",
  "remote.performanceMode": "性能模式",
  "remote.modeOffice": "办公模式",
  "remote.modeStandard": "普通模式",
  "remote.modeGame": "游戏模式",
  "remote.qualitySettings": "画面质量",
  "remote.toggles": "选项",
  "remote.showRemoteCursor": "显示远程光标",
  "remote.disableAudio": "禁用音频",
  "remote.disableClipboard": "禁用剪贴板",
  "remote.lockAfterDisconnect": "断开后锁屏",
  "remote.chat": "聊天",
  "remote.fileTransfer": "文件传输",
  // 多显示器
  "remote.displays": "显示器",
  "remote.allDisplays": "全部显示器",
  "remote.connectionSecure": "安全",
  "remote.connectionInsecure": "不安全",
  "remote.connectionDirect": "直连",
  "remote.connectionRelay": "中继",
  // 会话控制
  "remote.actions": "操作",
  "remote.restartDevice": "重启远程设备",
  "remote.restartConfirm": "确定要重启远程设备吗？",
  "remote.blockInput": "屏蔽用户输入",
  "remote.unblockInput": "解除屏蔽",
  "remote.screenshot": "截图",
  "remote.screenshotTaking": "正在截图...",
  "remote.recording": "录屏",
  "remote.recordStart": "开始录屏",
  "remote.recordStop": "停止录屏",
  "remote.privacyMode": "隐私模式",
  "remote.elevation": "请求提权",
  "remote.viewOnly": "仅查看",
  // 键盘与输入
  "remote.keyboardMode": "键盘模式",
  "remote.modeLegacy": "传统模式",
  "remote.modeMap": "映射模式",
  "remote.modeTranslate": "翻译模式 (Beta)",
  "remote.reverseWheel": "反转鼠标滚轮",
  "remote.swapMouse": "交换鼠标左右键",
  "remote.swapCtrlCmd": "交换 Ctrl-Cmd",
  // 工具栏
  "remote.pinToolbar": "固定工具栏",
  "remote.unpinToolbar": "取消固定",
  "remote.adjustWindow": "适配窗口",
  // 高级显示
  "remote.trueColor": "True Color (4:4:4)",
  "remote.followCursor": "跟随远程光标",
  "remote.zoomCursor": "放大光标"
};
const locales = {
  en,
  "zh-CN": zhCN
};
function useT() {
  const language = useSettingsStore((s) => s.language);
  const dict = locales[language] || locales["en"];
  return function t2(key) {
    return dict[key] || locales["en"][key] || key;
  };
}
function LoginDialog({ open, onClose }) {
  const t2 = useT();
  const [username, setUsername] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const { login: login2, loading, error } = useAuthStore();
  const { apiServer, updateSetting } = useSettingsStore();
  const [serverUrl, setServerUrl] = reactExports.useState(apiServer);
  reactExports.useEffect(() => {
    if (apiServer && !serverUrl) {
      setServerUrl(apiServer);
    }
  }, [apiServer]);
  reactExports.useEffect(() => {
    if (open && apiServer) {
      setServerUrl(apiServer);
    }
  }, [open]);
  if (!open) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (serverUrl !== apiServer) {
      await updateSetting("apiServer", serverUrl);
    }
    try {
      await login2(username, password);
      showToast(t2("login.success"), "success");
      onClose();
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-[9000] flex items-center justify-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-[400px] animate-slide-up", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl shadow-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative px-7 pt-7 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-text-primary", children: t2("login.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-text-secondary/60 mt-0.5", children: t2("login.apiServerHint") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:bg-surface-lighter/50 transition-all duration-200",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1.5 1.5l7 7M8.5 1.5l-7 7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "px-7 pb-7 pt-4", children: [
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 animate-fade-in", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("login.apiServer") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: serverUrl,
                onChange: (e) => setServerUrl(e.target.value),
                placeholder: "https://api.example.com",
                className: "w-full bg-surface/80 border border-surface-lighter/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("login.username") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: username,
                onChange: (e) => setUsername(e.target.value),
                placeholder: t2("login.enterUsername"),
                autoFocus: true,
                className: "w-full bg-surface/80 border border-surface-lighter/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("login.password") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: t2("login.enterPassword"),
                className: "w-full bg-surface/80 border border-surface-lighter/60 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            disabled: loading || !username || !password || !serverUrl,
            className: "btn-primary w-full py-3 rounded-xl text-sm font-semibold",
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
              t2("login.loggingIn")
            ] }) : t2("login.submit")
          }
        )
      ] })
    ] }) })
  ] });
}
function TitleBar() {
  const t2 = useT();
  const [maximized, setMaximized] = reactExports.useState(false);
  const [loginOpen, setLoginOpen] = reactExports.useState(false);
  const [userMenuOpen, setUserMenuOpen] = reactExports.useState(false);
  const { isLoggedIn, user, logout: logout2 } = useAuthStore();
  const menuRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    window.api.isMaximized().then(setMaximized);
  }, []);
  reactExports.useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);
  const handleMaximize = () => {
    window.api.maximize();
    setMaximized(!maximized);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "drag-region h-10 bg-surface/80 backdrop-blur-md flex items-center justify-between px-3 select-none shrink-0 border-b border-surface-lighter/30 relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] font-semibold text-text-primary tracking-tight", children: "RDesk" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex items-center gap-0.5", children: [
      isLoggedIn ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mr-1.5", ref: menuRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setUserMenuOpen(!userMenuOpen),
            className: "w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-[11px] font-semibold hover:shadow-glow-sm transition-all duration-200 hover:scale-105",
            title: user?.name || "User",
            children: user?.name?.charAt(0).toUpperCase() || "U"
          }
        ),
        userMenuOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-9 glass rounded-xl shadow-lg py-1 min-w-[160px] z-50 animate-scale-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3 border-b border-surface-lighter/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-text-primary", children: user?.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-text-secondary mt-0.5", children: user?.email || "" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                logout2();
                setUserMenuOpen(false);
              },
              className: "w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors rounded-b-xl",
              children: t2("settings.logout")
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setLoginOpen(true),
          className: "mr-1.5 text-[11px] text-text-secondary hover:text-primary transition-all duration-200 px-2.5 py-1 rounded-lg hover:bg-primary/10",
          children: t2("titlebar.login")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => window.api.minimize(),
          className: "w-10 h-8 flex items-center justify-center rounded-md hover:bg-surface-lighter/50 transition-colors duration-150",
          title: t2("titlebar.minimize"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "1", viewBox: "0 0 10 1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "10", height: "1", fill: "currentColor", className: "text-text-secondary" }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleMaximize,
          className: "w-10 h-8 flex items-center justify-center rounded-md hover:bg-surface-lighter/50 transition-colors duration-150",
          title: maximized ? t2("titlebar.restore") : t2("titlebar.maximize"),
          children: maximized ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", className: "text-text-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 0h8v8h-2v2H0V2h2V0zm1 1v1h5v5h1V1H3zM1 3v6h6V3H1z", fill: "currentColor" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", className: "text-text-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "0.5", y: "0.5", width: "9", height: "9", rx: "1", stroke: "currentColor", strokeWidth: "1", fill: "none" }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => window.api.close(),
          className: "w-10 h-8 flex items-center justify-center rounded-md hover:bg-red-500/80 hover:text-white transition-colors duration-150 text-text-secondary",
          title: t2("titlebar.close"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 1l8 8M9 1l-8 8", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoginDialog, { open: loginOpen, onClose: () => setLoginOpen(false) })
  ] });
}
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const t2 = useT();
  const navItems = [
    { path: "/", label: t2("nav.remote"), icon: MonitorIcon },
    { path: "/address-book", label: t2("nav.addressBook"), icon: BookIcon },
    { path: "/accessible", label: t2("nav.devices"), icon: DevicesIcon },
    { path: "/settings", label: t2("nav.settings"), icon: GearIcon }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[68px] bg-surface flex flex-col items-center py-3 gap-0.5 border-r border-surface-lighter/50 shrink-0 relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" }),
    navItems.map((item) => {
      const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate(item.path),
          className: `relative w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-spring group ${active ? "text-white" : "text-text-secondary hover:text-text-primary"}`,
          title: item.label,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute inset-0 rounded-xl transition-all duration-300 ease-[var(--ease-smooth)] ${active ? "bg-gradient-primary shadow-glow-sm opacity-100" : "bg-surface-lighter/0 group-hover:bg-surface-lighter/40 opacity-100"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 transition-transform duration-300 group-hover:scale-110", children: /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative z-10 text-[9px] leading-none font-medium", children: item.label })
          ]
        },
        item.path
      );
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-auto w-6 h-[2px] rounded-full bg-surface-lighter/50" })
  ] });
}
function MonitorIcon({ size = 20 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
  ] });
}
function BookIcon({ size = 20 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
  ] });
}
function DevicesIcon({ size = 20 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "1", y: "3", width: "15", height: "11", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "10", y: "10", width: "13", height: "10", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "5", y1: "17", x2: "12", y2: "17" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8.5", y1: "14", x2: "8.5", y2: "17" })
  ] });
}
function GearIcon({ size = 20 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })
  ] });
}
const useDialogStore = create((set) => ({
  isOpen: false,
  config: null,
  open: (config) => set({ isOpen: true, config }),
  close: () => set({ isOpen: false, config: null })
}));
function openDialog(config) {
  useDialogStore.getState().open(config);
}
function DialogContainer() {
  const t2 = useT();
  const { isOpen, config, close } = useDialogStore();
  if (!isOpen || !config) return null;
  const handleConfirm = async () => {
    await config.onConfirm?.();
    close();
  };
  const handleCancel = () => {
    config.onCancel?.();
    close();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-[9000] flex items-center justify-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in", onClick: handleCancel }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative glass rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slide-up overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 left-0 right-0 h-1 ${config.danger ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-primary"}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-7 pt-7 pb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-text-primary mb-2", children: config.title }),
        config.content && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-text-secondary leading-relaxed", children: config.content })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2.5 px-7 pb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleCancel,
            className: "px-5 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface-lighter/50 transition-all duration-200 font-medium",
            children: config.cancelText || t2("dialog.cancel")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleConfirm,
            className: `px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 ${config.danger ? "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:-translate-y-px" : "btn-primary"}`,
            children: config.confirmText || t2("dialog.ok")
          }
        )
      ] })
    ] })
  ] });
}
const initial = { visible: false, x: 0, y: 0, items: [] };
let _setState = null;
function showContextMenu(e, items) {
  e.preventDefault();
  e.stopPropagation();
  _setState?.({ visible: true, x: e.clientX, y: e.clientY, items });
}
function ContextMenuContainer() {
  const [state, setState] = reactExports.useState(initial);
  const ref = reactExports.useRef(null);
  _setState = setState;
  const close = reactExports.useCallback(() => setState(initial), []);
  reactExports.useEffect(() => {
    if (!state.visible) return;
    const handler = () => close();
    document.addEventListener("click", handler);
    document.addEventListener("contextmenu", handler);
    const esc = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("contextmenu", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [state.visible, close]);
  reactExports.useEffect(() => {
    if (!state.visible || !ref.current) return;
    const el2 = ref.current;
    const rect = el2.getBoundingClientRect();
    let { x: x2, y: y2 } = state;
    if (x2 + rect.width > window.innerWidth) x2 = window.innerWidth - rect.width - 8;
    if (y2 + rect.height > window.innerHeight) y2 = window.innerHeight - rect.height - 8;
    if (x2 !== state.x || y2 !== state.y) setState({ ...state, x: x2, y: y2 });
  }, [state.visible]);
  if (!state.visible) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: "fixed z-[8000] glass rounded-xl shadow-2xl py-1.5 min-w-[170px] animate-scale-in",
      style: { left: state.x, top: state.y },
      children: state.items.map(
        (item, i) => item.separator ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1 mx-3" }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              close();
              item.onClick();
            },
            disabled: item.disabled,
            className: `w-full text-left px-4 py-2 text-[13px] transition-all duration-150 ${item.disabled ? "text-text-secondary/30 cursor-not-allowed" : item.danger ? "text-red-400 hover:bg-red-500/10" : "text-text-primary hover:bg-surface-lighter/40 hover:pl-5"}`,
            children: item.label
          },
          i
        )
      )
    }
  );
}
const useConnectionStore = create((set, get) => ({
  myId: "",
  myPassword: "",
  activeConnections: [],
  recentConnections: [],
  setMyId: (id2) => set({ myId: id2 }),
  setMyPassword: (pw) => set({ myPassword: pw }),
  addActiveConnection: (conn) => set((s) => ({ activeConnections: [...s.activeConnections, conn] })),
  removeActiveConnection: (id2) => set((s) => ({ activeConnections: s.activeConnections.filter((c) => c.id !== id2) })),
  clearActiveConnections: () => set({ activeConnections: [] }),
  addRecentConnection: async (conn) => {
    const existing = get().recentConnections.filter((c) => c.id !== conn.id);
    const updated = [conn, ...existing].slice(0, 20);
    set({ recentConnections: updated });
    await window.api.configSet("recentConnections", updated);
  },
  clearRecentConnections: async () => {
    set({ recentConnections: [] });
    await window.api.configSet("recentConnections", []);
  },
  loadRecent: async () => {
    const config = await window.api.configGetAll();
    const recent = config.recentConnections || [];
    set({ recentConnections: recent });
  }
}));
function Home() {
  const t2 = useT();
  const [remoteId, setRemoteId] = reactExports.useState("");
  const [forceRelay, setForceRelay] = reactExports.useState(false);
  const { myId, myPassword, recentConnections, loadRecent, setMyId, addRecentConnection } = useConnectionStore();
  reactExports.useEffect(() => {
    loadRecent();
    window.api.native.getDeviceId().then((id2) => {
      if (id2) setMyId(id2);
    }).catch(() => {
    });
  }, []);
  const handleConnect = () => {
    const cleanId = remoteId.replace(/\s/g, "");
    if (!cleanId) return;
    const sessionId = crypto.randomUUID();
    addRecentConnection({ id: cleanId, name: "", lastConnected: Date.now() });
    window.api.native.openRemoteWindow(cleanId, sessionId, forceRelay);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-text-primary mb-5 flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-5 rounded-full bg-gradient-primary" }),
        t2("home.title")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-5 max-w-xl stagger-children", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-2xl p-5 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-text-secondary mb-3 uppercase tracking-widest font-medium", children: t2("home.yourId") }),
          myId ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "text-2xl font-mono font-bold tracking-wider cursor-pointer transition-all duration-300 bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent hover:drop-shadow-[0_0_8px_rgba(33,211,117,0.4)]",
              onClick: () => {
                navigator.clipboard.writeText(myId);
                showToast(t2("home.idCopied"), "success");
              },
              children: myId
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-text-secondary/50", children: [
            t2("home.notRegistered"),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] mt-1.5 text-text-secondary/30", children: t2("home.requiresCore") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-2xl p-5 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-text-secondary mb-3 uppercase tracking-widest font-medium", children: t2("home.password") }),
          myPassword ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-mono font-bold text-text-primary tracking-wider", children: myPassword }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => showToast(t2("home.passwordRefreshHint"), "info"),
                className: "w-7 h-7 rounded-lg bg-surface-lighter/50 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all duration-200",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 4v6h-6" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 20v-6h6" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })
                ] })
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-text-secondary/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono tracking-[0.3em]", children: "------" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] mt-1.5 text-text-secondary/30", children: t2("home.requiresCore") })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 max-w-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary mb-3 font-medium uppercase tracking-wider", children: t2("home.connectTo") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 relative group", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: remoteId,
            onChange: (e) => setRemoteId(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleConnect(),
            placeholder: t2("home.enterRemoteId"),
            className: "w-full bg-surface-light border border-surface-lighter/60 rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-primary/50 transition-all duration-200 font-mono text-sm"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleConnect,
            disabled: !remoteId.trim(),
            className: "btn-primary px-7 py-3 rounded-xl text-sm",
            children: t2("home.connect")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2.5 mt-3 text-xs text-text-secondary/70 cursor-pointer select-none hover:text-text-secondary transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: forceRelay,
            onChange: (e) => setForceRelay(e.target.checked)
          }
        ),
        t2("home.forceRelay")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-text-secondary font-medium uppercase tracking-wider", children: t2("home.recentConnections") }),
        recentConnections.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => useConnectionStore.getState().clearRecentConnections(),
            className: "text-[11px] text-text-secondary/50 hover:text-red-400 transition-colors",
            children: t2("home.clear")
          }
        )
      ] }),
      recentConnections.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16 text-text-secondary/30 animate-fade-in-up", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "mx-auto mb-4 text-text-secondary/20", width: "52", height: "52", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: t2("home.noRecent") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs mt-1.5", children: t2("home.noRecentHint") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children", children: recentConnections.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          onClick: () => {
            const sid = crypto.randomUUID();
            addRecentConnection({ id: c.id, name: c.name, lastConnected: Date.now() });
            window.api.native.openRemoteWindow(c.id, sid, forceRelay);
          },
          className: "glass-card rounded-xl p-3.5 cursor-pointer group",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors", children: c.name || c.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-text-secondary/60 font-mono mt-0.5", children: c.id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 12h14M12 5l7 7-7 7" }) }) })
          ] })
        },
        c.id
      )) })
    ] })
  ] });
}
async function getPersonalGuid() {
  const res = await api.post("/api/ab/personal");
  return res.guid;
}
async function getSharedProfiles() {
  const res = await api.post("/api/ab/shared/profiles");
  return res.data || [];
}
async function getPersonalAbData() {
  const res = await api.get("/api/ab");
  if (!res.data) return { peers: [], tags: [] };
  let parsed;
  try {
    parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  } catch {
    return { peers: [], tags: [] };
  }
  const peers = (parsed.peers || []).map((p2) => ({
    id: p2.id,
    alias: p2.alias,
    tags: p2.tags,
    hash: p2.hash,
    username: p2.username,
    hostname: p2.hostname,
    platform: p2.platform,
    note: p2.note
  }));
  const tagColors = parsed.tag_colors || {};
  const tags = (parsed.tags || []).map((name) => ({
    name,
    color: tagColors[name] || 0
  }));
  return { peers, tags };
}
async function getSharedPeers(abGuid, page = 1, pageSize = 100) {
  const allPeers = [];
  let current = page;
  let total = 0;
  do {
    const params = new URLSearchParams({
      current: String(current),
      pageSize: String(pageSize),
      ab: abGuid
    });
    const res = await api.post(`/api/ab/peers?${params}`);
    if (res.total && total === 0) total = res.total;
    if (Array.isArray(res.data)) {
      allPeers.push(...res.data);
    }
    current++;
  } while (current * pageSize < total);
  return allPeers;
}
async function getSharedTags(abGuid) {
  try {
    const res = await api.post(`/api/ab/tags/${abGuid}`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch {
    return [];
  }
}
async function addPeer(abGuid, peer) {
  await api.post(`/api/ab/peer/add/${abGuid}`, peer);
}
async function updatePeer(abGuid, peer) {
  await api.post(`/api/ab/peer/update/${abGuid}`, peer);
}
async function deletePeers(abGuid, peerIds) {
  await api.del(`/api/ab/peer/${abGuid}`, peerIds);
}
async function addTag(abGuid, tag) {
  await api.post(`/api/ab/tag/add/${abGuid}`, tag);
}
async function renameTag(abGuid, oldName, newName) {
  await api.put(`/api/ab/tag/rename/${abGuid}`, { old: oldName, new: newName });
}
async function deleteTags(abGuid, tagNames) {
  await api.del(`/api/ab/tag/${abGuid}`, tagNames);
}
const useAddressBookStore = create((set, get) => ({
  personalGuid: "",
  sharedProfiles: [],
  currentAbGuid: "",
  currentAbName: "My Address Book",
  currentAbRule: 0,
  peers: [],
  tags: [],
  selectedTags: [],
  viewMode: "grid",
  searchQuery: "",
  loading: false,
  error: "",
  fetchPersonalAb: async () => {
    try {
      const guid = await getPersonalGuid();
      set({ personalGuid: guid });
      if (!get().currentAbGuid) {
        await get().selectAb(guid, "My Address Book", 0);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch address book" });
    }
  },
  fetchSharedProfiles: async () => {
    try {
      const profiles = await getSharedProfiles();
      set({ sharedProfiles: profiles });
    } catch {
    }
  },
  selectAb: async (guid, name, rule) => {
    set({
      currentAbGuid: guid,
      currentAbName: name || "Address Book",
      currentAbRule: rule ?? 0,
      peers: [],
      tags: [],
      selectedTags: [],
      searchQuery: ""
    });
    await Promise.all([get().fetchPeers(), get().fetchTags()]);
  },
  fetchPeers: async () => {
    const { currentAbGuid, personalGuid } = get();
    if (!currentAbGuid) return;
    set({ loading: true });
    try {
      const isPersonal = currentAbGuid === personalGuid;
      if (isPersonal) {
        const abData = await getPersonalAbData();
        set({ peers: abData.peers, tags: abData.tags, loading: false });
      } else {
        const peers = await getSharedPeers(currentAbGuid);
        set({ peers, loading: false });
      }
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Failed to fetch peers" });
    }
  },
  fetchTags: async () => {
    const { currentAbGuid, personalGuid } = get();
    if (!currentAbGuid) return;
    if (currentAbGuid === personalGuid) return;
    try {
      const tags = await getSharedTags(currentAbGuid);
      set({ tags: Array.isArray(tags) ? tags : [] });
    } catch {
    }
  },
  addPeer: async (peer) => {
    const { currentAbGuid } = get();
    await addPeer(currentAbGuid, peer);
    await get().fetchPeers();
  },
  updatePeer: async (peer) => {
    const { currentAbGuid } = get();
    await updatePeer(currentAbGuid, peer);
    await get().fetchPeers();
  },
  deletePeers: async (ids) => {
    const { currentAbGuid } = get();
    await deletePeers(currentAbGuid, ids);
    await get().fetchPeers();
  },
  addTag: async (name, color) => {
    const { currentAbGuid } = get();
    await addTag(currentAbGuid, { name, color });
    await get().fetchTags();
  },
  renameTag: async (oldName, newName) => {
    const { currentAbGuid } = get();
    await renameTag(currentAbGuid, oldName, newName);
    await get().fetchTags();
    await get().fetchPeers();
  },
  deleteTags: async (names) => {
    const { currentAbGuid } = get();
    await deleteTags(currentAbGuid, names);
    await get().fetchTags();
    set({ selectedTags: get().selectedTags.filter((t2) => !names.includes(t2)) });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearch: (query) => set({ searchQuery: query }),
  toggleTag: (tagName) => {
    const { selectedTags } = get();
    if (selectedTags.includes(tagName)) {
      set({ selectedTags: selectedTags.filter((t2) => t2 !== tagName) });
    } else {
      set({ selectedTags: [...selectedTags, tagName] });
    }
  },
  getFilteredPeers: () => {
    const { peers, selectedTags, searchQuery } = get();
    let result = peers;
    if (searchQuery) {
      const q2 = searchQuery.toLowerCase();
      result = result.filter(
        (p2) => p2.alias?.toLowerCase().includes(q2) || p2.id.toLowerCase().includes(q2) || p2.hostname?.toLowerCase().includes(q2) || p2.username?.toLowerCase().includes(q2)
      );
    }
    if (selectedTags.length > 0) {
      result = result.filter(
        (p2) => p2.tags?.some((t2) => selectedTags.includes(t2))
      );
    }
    return result;
  }
}));
function PeerCard({ peer, viewMode, canEdit, onEdit, onDelete }) {
  const t2 = useT();
  const handleConnect = () => {
    const sessionId = crypto.randomUUID();
    window.api.native.openRemoteWindow(peer.id, sessionId, false);
  };
  const handleContextMenu = (e) => {
    const items = [
      { label: t2("peer.connect"), onClick: handleConnect },
      { label: t2("peer.copyId"), onClick: () => {
        navigator.clipboard.writeText(peer.id);
        showToast(t2("peer.idCopied"), "success");
      } }
    ];
    if (canEdit !== false) {
      items.push(
        { label: "", onClick: () => {
        }, separator: true },
        { label: t2("peer.edit"), onClick: () => onEdit?.(peer) },
        { label: t2("peer.delete"), onClick: () => onDelete?.(peer.id), danger: true }
      );
    }
    showContextMenu(e, items);
  };
  if (viewMode === "list") return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      onContextMenu: handleContextMenu,
      onDoubleClick: handleConnect,
      className: "flex items-center gap-3 px-4 py-2.5 hover:bg-surface-lighter/40 cursor-pointer transition-all duration-200 group border-b border-surface-lighter/30 last:border-0",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformIcon, { platform: peer.platform }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-28 text-sm font-mono text-text-primary truncate", children: peer.id }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-text-primary truncate", children: peer.alias || peer.hostname || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 text-xs text-text-secondary/70 truncate", children: peer.username || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20 text-xs text-text-secondary/70 truncate", children: peer.platform || "-" }),
        peer.tags && peer.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
          peer.tags.slice(0, 2).map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium", children: tag }, tag)),
          peer.tags.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-text-secondary/50", children: [
            "+",
            peer.tags.length - 2
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              handleConnect();
            },
            className: "text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-blue-400",
            children: t2("peer.connect")
          }
        )
      ]
    }
  );
  if (viewMode === "tile") return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      onContextMenu: handleContextMenu,
      onDoubleClick: handleConnect,
      className: "glass-card rounded-xl p-3 cursor-pointer group w-40",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformIcon, { platform: peer.platform, size: 14 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-mono text-text-secondary/60 truncate", children: peer.id })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors", children: peer.alias || peer.hostname || peer.id })
      ]
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      onContextMenu: handleContextMenu,
      onDoubleClick: handleConnect,
      className: "glass-card rounded-2xl p-4 cursor-pointer group",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PlatformIcon, { platform: peer.platform }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors duration-200", children: peer.alias || peer.hostname || peer.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-text-secondary/50 font-mono mt-0.5", children: peer.id })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 12h14M12 5l7 7-7 7" }) }) })
        ] }),
        peer.username && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-text-secondary/60 mb-2 truncate", children: peer.username }),
        peer.tags && peer.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mb-2", children: peer.tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium", children: tag }, tag)) }),
        peer.platform && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-text-secondary/40 font-medium", children: peer.platform })
      ]
    }
  );
}
function PlatformIcon({ platform, size = 16 }) {
  const p2 = (platform || "").toLowerCase();
  const isWin = p2.includes("windows") || p2.includes("win");
  const isMac = p2.includes("mac") || p2.includes("darwin");
  const isLinux = p2.includes("linux") || p2.includes("ubuntu") || p2.includes("debian");
  const bgColor = isWin ? "bg-blue-500/10 text-blue-400" : isMac ? "bg-gray-400/10 text-gray-400" : isLinux ? "bg-orange-500/10 text-orange-400" : "bg-surface-lighter/50 text-text-secondary/50";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105`, children: isWin ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M0 2.3l6.5-.9v6.3H0V2.3zm7.3-1l8.7-1.3v7.7H7.3V1.3zM16 8.5v7.7l-8.7-1.2V8.5H16zM6.5 14.7L0 13.8V8.5h6.5v6.2z" }) }) : isMac ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: size - 2, height: size, viewBox: "0 0 14 16", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M11.2 8.4c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7C2.6 3.6.8 4.9.8 8.5c0 2.1.8 4.4 1.8 5.8.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.8-1.1-2.8-4.2zM9 2.3c.7-.8 1.1-1.9 1-3-.9 0-2.1.7-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.5 2.8-1.5z" }) }) : isLinux ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: size - 2, height: size, viewBox: "0 0 14 16", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M7 0C4.8 0 3.3 2.2 3.3 5c0 1.5.4 2.8 1.1 3.8-.8.5-2.4 1.7-2.4 3.4 0 2 1.5 3.8 5 3.8s5-1.8 5-3.8c0-1.7-1.6-2.9-2.4-3.4.7-1 1.1-2.3 1.1-3.8C10.7 2.2 9.2 0 7 0z" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
  ] }) });
}
const TAG_COLORS = [
  29183,
  2216821,
  16096779,
  15680580,
  9133302,
  15485081,
  440020,
  8702998,
  16347926,
  6514417
];
function TagList({ tags, selectedTags, onToggleTag, onAddTag, peers = [], canEdit }) {
  const t2 = useT();
  const [adding, setAdding] = reactExports.useState(false);
  const [newTagName, setNewTagName] = reactExports.useState("");
  const getPeerCount = (tagName) => {
    if (tagName === "__all__") return peers.length;
    if (tagName === "__untagged__") return peers.filter((p2) => !p2.tags || p2.tags.length === 0).length;
    return peers.filter((p2) => p2.tags?.includes(tagName)).length;
  };
  const handleAdd = () => {
    if (!newTagName.trim()) return;
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    onAddTag?.(newTagName.trim(), color);
    setNewTagName("");
    setAdding(false);
  };
  const intToHex = (n2) => {
    const hex = (n2 >>> 0).toString(16).padStart(6, "0");
    return `#${hex}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => {
          selectedTags.forEach((tag) => onToggleTag(tag));
        },
        className: `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${selectedTags.length === 0 ? "bg-primary/15 text-primary shadow-sm" : "text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("tag.all") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] opacity-50 font-mono", children: getPeerCount("__all__") })
        ]
      }
    ),
    tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => onToggleTag(tag.name),
        className: `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${selectedTags.includes(tag.name) ? "bg-primary/15 text-primary shadow-sm" : "text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-surface",
                style: {
                  backgroundColor: tag.color ? intToHex(tag.color) : "#0071FF",
                  ringColor: tag.color ? `${intToHex(tag.color)}33` : "rgba(0,113,255,0.2)"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: tag.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] opacity-50 shrink-0 font-mono", children: getPeerCount(tag.name) })
        ]
      },
      tag.name
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => onToggleTag("__untagged__"),
        className: `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${selectedTags.includes("__untagged__") ? "bg-primary/15 text-primary shadow-sm" : "text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2("tag.untagged") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] opacity-50 font-mono", children: getPeerCount("__untagged__") })
        ]
      }
    ),
    canEdit !== false && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-3", children: adding ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 animate-fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          value: newTagName,
          onChange: (e) => setNewTagName(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && handleAdd(),
          placeholder: t2("tag.tagName"),
          autoFocus: true,
          className: "flex-1 bg-surface/80 border border-surface-lighter/50 rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary/50"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleAdd, className: "w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors text-sm font-bold", children: "+" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        setAdding(false);
        setNewTagName("");
      }, className: "w-7 h-7 rounded-lg bg-surface-lighter/30 text-text-secondary hover:bg-surface-lighter/50 flex items-center justify-center transition-colors text-xs", children: "x" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setAdding(true),
        className: "w-full text-[11px] text-text-secondary/40 hover:text-primary transition-all duration-200 py-2 rounded-lg hover:bg-primary/5 font-medium",
        children: t2("tag.addTag")
      }
    ) })
  ] });
}
function AddPeerDialog({ open, mode, peer, tags, onClose, onSubmit }) {
  const t2 = useT();
  const [id2, setId] = reactExports.useState("");
  const [alias, setAlias] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const [selectedTags, setSelectedTags] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (open && peer && mode === "edit") {
      setId(peer.id);
      setAlias(peer.alias || "");
      setNote(peer.note || "");
      setSelectedTags(peer.tags || []);
    } else if (open && mode === "add") {
      setId("");
      setAlias("");
      setNote("");
      setSelectedTags([]);
    }
    setError("");
  }, [open, peer, mode]);
  if (!open) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id2.trim()) {
      setError(t2("addPeer.deviceIdRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ id: id2.trim(), alias, tags: selectedTags, note });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t2("addPeer.operationFailed"));
    } finally {
      setLoading(false);
    }
  };
  const toggleTag = (name) => {
    setSelectedTags(
      (prev) => prev.includes(name) ? prev.filter((t22) => t22 !== name) : [...prev, name]
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-[9000] flex items-center justify-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-[420px] animate-slide-up", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass rounded-2xl shadow-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-7 pt-7 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-bold text-text-primary", children: mode === "add" ? t2("addPeer.addDevice") : t2("addPeer.editDevice") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:bg-surface-lighter/50 transition-all duration-200",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1.5 1.5l7 7M8.5 1.5l-7 7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "px-7 pb-7 pt-3", children: [
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 animate-fade-in", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("addPeer.deviceId") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: id2,
                onChange: (e) => setId(e.target.value),
                disabled: mode === "edit",
                placeholder: t2("addPeer.deviceIdPlaceholder"),
                autoFocus: mode === "add",
                className: "w-full bg-surface/80 border border-surface-lighter/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50 disabled:opacity-40"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("addPeer.alias") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: alias,
                onChange: (e) => setAlias(e.target.value),
                placeholder: t2("addPeer.displayName"),
                className: "w-full bg-surface/80 border border-surface-lighter/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("addPeer.note") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: note,
                onChange: (e) => setNote(e.target.value),
                placeholder: t2("addPeer.optionalNote"),
                className: "w-full bg-surface/80 border border-surface-lighter/50 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
              }
            )
          ] }),
          tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] text-text-secondary/70 mb-1.5 font-medium uppercase tracking-wider", children: t2("addPeer.tags") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: tags.map((tag) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => toggleTag(tag.name),
                className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${selectedTags.includes(tag.name) ? "bg-primary text-white shadow-glow-sm" : "bg-surface-lighter/40 text-text-secondary hover:text-text-primary hover:bg-surface-lighter/60"}`,
                children: tag.name
              },
              tag.name
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "px-5 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface-lighter/50 transition-all duration-200 font-medium",
              children: t2("addPeer.cancel")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "submit",
              disabled: loading || !id2.trim(),
              className: "btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold",
              children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
                t2("addPeer.saving")
              ] }) : mode === "add" ? t2("addPeer.add") : t2("addPeer.save")
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function AddressBook() {
  const t2 = useT();
  const auth = useAuthStore();
  const ab2 = useAddressBookStore();
  const [peerDialog, setPeerDialog] = reactExports.useState({
    open: false,
    mode: "add"
  });
  reactExports.useEffect(() => {
    if (auth.isLoggedIn) {
      ab2.fetchPersonalAb();
      ab2.fetchSharedProfiles();
    }
  }, [auth.isLoggedIn]);
  const filteredPeers = ab2.getFilteredPeers();
  const canEdit = ab2.currentAbRule === 0 || ab2.currentAbRule >= 2;
  const handleSelectAb = async (guid) => {
    if (guid === ab2.personalGuid) {
      await ab2.selectAb(guid, t2("ab.myAddressBook"), 0);
    } else {
      const profile = ab2.sharedProfiles.find((p2) => p2.guid === guid);
      if (profile) {
        await ab2.selectAb(guid, profile.name, profile.rule);
      }
    }
  };
  const handleDeletePeer = (peerId) => {
    openDialog({
      title: t2("ab.deleteDevice"),
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        t2("ab.deleteConfirm"),
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-text-primary", children: peerId })
      ] }),
      confirmText: t2("ab.delete"),
      danger: true,
      onConfirm: async () => {
        try {
          await ab2.deletePeers([peerId]);
          showToast(t2("ab.deviceRemoved"), "success");
        } catch {
          showToast(t2("ab.deleteFailed"), "error");
        }
      }
    });
  };
  const handlePeerSubmit = async (peer) => {
    if (peerDialog.mode === "add") {
      await ab2.addPeer(peer);
      showToast(t2("ab.deviceAdded"), "success");
    } else {
      await ab2.updatePeer(peer);
      showToast(t2("ab.deviceUpdated"), "success");
    }
  };
  if (!auth.isLoggedIn) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-text-secondary/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "mx-auto mb-4 text-text-secondary/20", width: "52", height: "52", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "7", r: "4" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium mb-1", children: t2("ab.loginRequired") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs", children: t2("ab.loginHint") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-56 border-r border-surface-lighter/30 flex flex-col p-3 shrink-0 bg-surface/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: ab2.currentAbGuid,
          onChange: (e) => handleSelectAb(e.target.value),
          className: "w-full bg-surface/80 border border-surface-lighter/40 rounded-xl px-3 py-2 text-xs text-text-primary mb-3 focus:outline-none focus:border-primary/50",
          children: [
            ab2.personalGuid && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: ab2.personalGuid, children: t2("ab.myAddressBook") }),
            ab2.sharedProfiles.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: p2.guid, children: [
              p2.name,
              " (",
              p2.rule >= 2 ? "RW" : "R",
              ")"
            ] }, p2.guid))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-text-secondary/50 uppercase tracking-widest mb-2 font-semibold", children: t2("ab.tags") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TagList,
          {
            tags: ab2.tags,
            selectedTags: ab2.selectedTags,
            onToggleTag: ab2.toggleTag,
            onAddTag: canEdit ? ab2.addTag : void 0,
            peers: ab2.peers,
            canEdit
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col p-4 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: ab2.searchQuery,
            onChange: (e) => ab2.setSearch(e.target.value),
            placeholder: t2("ab.searchDevices"),
            className: "flex-1 max-w-xs bg-surface-light/80 border border-surface-lighter/40 rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-surface-light/60 rounded-xl border border-surface-lighter/30 p-0.5", children: ["grid", "tile", "list"].map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => ab2.setViewMode(mode),
            className: `px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${ab2.viewMode === mode ? "bg-gradient-primary text-white shadow-glow-sm" : "text-text-secondary hover:text-text-primary"}`,
            children: mode === "grid" ? "▦" : mode === "tile" ? "▣" : "☰"
          },
          mode
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] text-text-secondary/50 font-medium", children: t2("ab.deviceCount").replace("{0}", String(filteredPeers.length)) }),
        canEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setPeerDialog({ open: true, mode: "add" }),
            className: "ml-auto btn-primary px-4 py-2 rounded-xl text-xs font-semibold",
            children: t2("ab.addDevice")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: ab2.loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" }) }) : filteredPeers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16 text-text-secondary/30 animate-fade-in-up", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "mx-auto mb-4 text-text-secondary/15", width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: t2("ab.noDevices") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs mt-1", children: ab2.searchQuery ? t2("ab.noDevicesSearch") : canEdit ? t2("ab.noDevicesAdd") : t2("ab.noDevicesEmpty") })
      ] }) : ab2.viewMode === "list" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-2xl hover:translate-y-0 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-2.5 border-b border-surface-lighter/20 text-[10px] text-text-secondary/50 uppercase tracking-widest font-semibold bg-surface/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-7" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-28", children: "ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: t2("ab.listHeaderName") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24", children: t2("ab.listHeaderUser") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20", children: t2("ab.listHeaderPlatform") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20", children: t2("ab.listHeaderTags") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-14" })
        ] }),
        filteredPeers.map((peer) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          PeerCard,
          {
            peer,
            viewMode: "list",
            canEdit,
            onEdit: (p2) => setPeerDialog({ open: true, mode: "edit", peer: p2 }),
            onDelete: handleDeletePeer
          },
          peer.id
        ))
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `grid gap-3 stagger-children ${ab2.viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`, children: filteredPeers.map((peer) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        PeerCard,
        {
          peer,
          viewMode: ab2.viewMode,
          canEdit,
          onEdit: (p2) => setPeerDialog({ open: true, mode: "edit", peer: p2 }),
          onDelete: handleDeletePeer
        },
        peer.id
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddPeerDialog,
      {
        open: peerDialog.open,
        mode: peerDialog.mode,
        peer: peerDialog.peer,
        tags: ab2.tags,
        onClose: () => setPeerDialog({ open: false, mode: "add" }),
        onSubmit: handlePeerSubmit
      }
    )
  ] });
}
async function getDeviceGroups(page = 1, pageSize = 100) {
  const res = await api.get(
    `/api/device-group/accessible?current=${page}&pageSize=${pageSize}`
  );
  return res.data || [];
}
async function getAccessibleUsers(page = 1, pageSize = 100) {
  const res = await api.get(
    `/api/users?accessible=&status=1&current=${page}&pageSize=${pageSize}`
  );
  return res.data || [];
}
async function getAccessiblePeers(page = 1, pageSize = 100) {
  const res = await api.get(
    `/api/peers?accessible=&status=1&current=${page}&pageSize=${pageSize}`
  );
  return res.data || [];
}
const useGroupStore = create((set, get) => ({
  groups: [],
  users: [],
  peers: [],
  selectedType: null,
  selectedName: "",
  loading: false,
  error: "",
  fetchAll: async () => {
    set({ loading: true, error: "" });
    try {
      const [groups, users, peers] = await Promise.all([
        getDeviceGroups(),
        getAccessibleUsers(),
        getAccessiblePeers()
      ]);
      set({ groups, users, peers, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Failed to fetch" });
    }
  },
  selectGroup: (name) => set({ selectedType: "group", selectedName: name }),
  selectUser: (name) => set({ selectedType: "user", selectedName: name }),
  clearSelection: () => set({ selectedType: null, selectedName: "" }),
  getFilteredPeers: () => {
    const { peers, selectedType, selectedName } = get();
    if (!selectedType || !selectedName) return peers;
    if (selectedType === "group") {
      return peers.filter((p2) => p2.device_group_name === selectedName);
    }
    return peers.filter((p2) => p2.user_name === selectedName);
  }
}));
function AccessibleDevices() {
  const t2 = useT();
  const auth = useAuthStore();
  const store = useGroupStore();
  const [tab, setTab] = reactExports.useState("groups");
  const [search, setSearch] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (auth.isLoggedIn) {
      store.fetchAll();
    }
  }, [auth.isLoggedIn]);
  const filteredPeers = store.getFilteredPeers().filter((p2) => {
    if (!search) return true;
    const q2 = search.toLowerCase();
    return p2.id.toLowerCase().includes(q2) || p2.info.device_name?.toLowerCase().includes(q2) || p2.info.username?.toLowerCase().includes(q2);
  });
  if (!auth.isLoggedIn) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-text-secondary/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "mx-auto mb-4 text-text-secondary/20", width: "52", height: "52", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "7", r: "4" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium mb-1", children: t2("devices.loginRequired") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs", children: t2("devices.loginHint") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-56 border-r border-surface-lighter/30 flex flex-col shrink-0 bg-surface/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b border-surface-lighter/30 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute bottom-0 h-[2px] bg-gradient-primary rounded-full transition-all duration-300 ease-spring",
            style: {
              width: "50%",
              left: tab === "groups" ? "0%" : "50%"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setTab("groups");
              store.clearSelection();
            },
            className: `flex-1 py-3 text-xs font-semibold transition-colors duration-200 ${tab === "groups" ? "text-primary" : "text-text-secondary/60 hover:text-text-secondary"}`,
            children: [
              t2("devices.groups"),
              " (",
              store.groups.length,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setTab("users");
              store.clearSelection();
            },
            className: `flex-1 py-3 text-xs font-semibold transition-colors duration-200 ${tab === "users" ? "text-primary" : "text-text-secondary/60 hover:text-text-secondary"}`,
            children: [
              t2("devices.users"),
              " (",
              store.users.length,
              ")"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-auto p-2 stagger-children", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => store.clearSelection(),
            className: `w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 mb-1 font-medium ${!store.selectedName ? "bg-primary/15 text-primary shadow-sm" : "text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary"}`,
            children: t2("devices.allDevices")
          }
        ),
        tab === "groups" ? store.groups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary/30 text-center py-6", children: t2("devices.noGroups") }) : store.groups.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => store.selectGroup(g.name),
            className: `w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${store.selectedType === "group" && store.selectedName === g.name ? "bg-primary/15 text-primary shadow-sm" : "text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary"}`,
            children: g.name
          },
          g.name
        )) : store.users.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary/30 text-center py-6", children: t2("devices.noUsers") }) : store.users.map((u2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => store.selectUser(u2.name),
            className: `w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 font-medium ${store.selectedType === "user" && store.selectedName === u2.name ? "bg-primary/15 text-primary shadow-sm" : "text-text-secondary/60 hover:bg-surface-lighter/40 hover:text-text-secondary"}`,
            children: u2.name
          },
          u2.name
        ))
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col p-4 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: t2("devices.searchDevices"),
            className: "flex-1 max-w-xs bg-surface-light/80 border border-surface-lighter/40 rounded-xl px-4 py-2 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-text-secondary/50 font-medium", children: [
          t2("devices.deviceCount").replace("{0}", String(filteredPeers.length)),
          store.selectedName && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px]", children: store.selectedName })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: store.loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" }) }) : filteredPeers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16 text-text-secondary/30 animate-fade-in-up", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "mx-auto mb-4 text-text-secondary/15", width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "1", y: "3", width: "15", height: "11", rx: "1.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "10", y: "10", width: "13", height: "10", rx: "1.5" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: t2("devices.noDevices") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-2xl hover:translate-y-0 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-2.5 border-b border-surface-lighter/20 text-[10px] text-text-secondary/50 uppercase tracking-widest font-semibold bg-surface/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-28", children: "ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: t2("devices.headerDeviceName") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24", children: t2("devices.headerUser") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20", children: t2("devices.headerOS") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20", children: t2("devices.headerGroup") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-16", children: t2("devices.headerStatus") })
        ] }),
        filteredPeers.map((peer) => /* @__PURE__ */ jsxRuntimeExports.jsx(PeerRow, { peer }, peer.id))
      ] }) })
    ] })
  ] });
}
function PeerRow({ peer }) {
  const t2 = useT();
  const handleConnect = () => {
    const sessionId = crypto.randomUUID();
    window.api.native.openRemoteWindow(peer.id, sessionId, false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      onDoubleClick: handleConnect,
      className: "flex items-center gap-3 px-4 py-2.5 hover:bg-surface-lighter/30 cursor-pointer transition-all duration-200 group border-b border-surface-lighter/15 last:border-0",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-28 text-sm font-mono text-text-primary truncate group-hover:text-primary transition-colors", children: peer.id }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm text-text-primary/80 truncate", children: peer.info.device_name || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 text-[11px] text-text-secondary/60 truncate", children: peer.user_name || peer.info.username || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20 text-[11px] text-text-secondary/60 truncate", children: peer.info.os || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20 text-[11px] text-text-secondary/60 truncate", children: peer.device_group_name || "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-16 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `relative w-2 h-2 rounded-full ${peer.status === 1 ? "bg-accent" : "bg-text-secondary/30"}`, children: peer.status === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full bg-accent animate-pulse-dot" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-medium ${peer.status === 1 ? "text-accent" : "text-text-secondary/40"}`, children: peer.status === 1 ? t2("devices.online") : t2("devices.offline") })
        ] })
      ]
    }
  );
}
function SettingSection({ title, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 animate-fade-in-up", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-[11px] font-semibold text-text-secondary/60 uppercase tracking-widest mb-2.5 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-3 rounded-full bg-gradient-primary" }),
      title
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-card rounded-2xl p-5 space-y-4 hover:translate-y-0", children })
  ] });
}
function SettingInput({ label, value, onChange, placeholder, type = "text", disabled }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "w-32 text-sm text-text-secondary/80 shrink-0 font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder,
        disabled,
        className: "flex-1 bg-surface/80 border border-surface-lighter/50 rounded-xl px-3.5 py-2 text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50 transition-all duration-200 disabled:opacity-40"
      }
    )
  ] });
}
function SettingSelect({ label, value, options, onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "w-32 text-sm text-text-secondary/80 shrink-0 font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "select",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        className: "flex-1 bg-surface/80 border border-surface-lighter/50 rounded-xl px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all duration-200",
        children: options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o.value, children: o.label }, o.value))
      }
    )
  ] });
}
function SettingSlider({ label, value, min, max, step, onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "w-32 text-sm text-text-secondary/80 shrink-0 font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "range",
        value,
        min,
        max,
        step: step || 1,
        onChange: (e) => onChange(Number(e.target.value)),
        className: "flex-1"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono text-text-primary w-10 text-right font-medium", children: value })
  ] });
}
function SettingInfo({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "w-32 text-sm text-text-secondary/80 shrink-0 font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-text-primary/80 font-mono", children: value })
  ] });
}
function SettingButton({ label, buttonText, onClick, variant = "primary" }) {
  const styles = {
    primary: "btn-primary",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:-translate-y-px text-white",
    secondary: "bg-surface-lighter/60 hover:bg-surface-lighter text-text-primary"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "w-32 text-sm text-text-secondary/80 shrink-0 font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick,
        className: `px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${styles[variant]}`,
        children: buttonText
      }
    )
  ] });
}
function Settings() {
  const t2 = useT();
  const auth = useAuthStore();
  const settings = useSettingsStore();
  const [loginOpen, setLoginOpen] = reactExports.useState(false);
  const [platformInfo, setPlatformInfo] = reactExports.useState({ platform: "", arch: "", hostname: "", version: "" });
  const [appVersion, setAppVersion] = reactExports.useState("");
  reactExports.useEffect(() => {
    window.api.getPlatformInfo().then(setPlatformInfo);
    window.api.getAppVersion().then(setAppVersion);
  }, []);
  const handleFetchConfig = async () => {
    try {
      await settings.fetchServerConfig();
      showToast(t2("settings.fetchSuccess"), "success");
    } catch {
      showToast(t2("settings.fetchFailed"), "error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full p-6 overflow-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-text-primary mb-6 flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-5 rounded-full bg-gradient-primary" }),
      t2("settings.title")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg stagger-children", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingSection, { title: t2("settings.account"), children: auth.isLoggedIn ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm", children: auth.user?.name?.charAt(0).toUpperCase() || "U" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-text-primary", children: auth.user?.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-text-secondary/60 flex items-center gap-1.5", children: [
              auth.user?.email || "",
              auth.user?.is_admin && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-md text-[9px] font-semibold uppercase", children: "Admin" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingButton, { label: "", buttonText: t2("settings.logout"), onClick: () => {
          auth.logout();
          showToast(t2("settings.loggedOut"), "info");
        }, variant: "danger" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SettingButton, { label: t2("settings.notLoggedIn"), buttonText: t2("settings.login"), onClick: () => setLoginOpen(true) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingSection, { title: t2("settings.general"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingSelect,
          {
            label: t2("settings.language"),
            value: settings.language,
            options: [
              { value: "zh-CN", label: t2("settings.langZh") },
              { value: "en", label: t2("settings.langEn") }
            ],
            onChange: (v2) => settings.updateSetting("language", v2)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingSelect,
          {
            label: t2("settings.theme"),
            value: settings.theme,
            options: [
              { value: "dark", label: t2("settings.themeDark") },
              { value: "light", label: t2("settings.themeLight") }
            ],
            onChange: (v2) => settings.updateSetting("theme", v2)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SettingSection, { title: t2("settings.security"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary/50 bg-surface/50 rounded-xl px-4 py-3 border border-surface-lighter/20 leading-relaxed", children: t2("settings.securityHint") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingSection, { title: t2("settings.network"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingInput,
          {
            label: t2("settings.apiServer"),
            value: settings.apiServer,
            onChange: (v2) => settings.updateSetting("apiServer", v2),
            placeholder: "https://api.example.com"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingInput,
          {
            label: t2("settings.idServer"),
            value: settings.idServer,
            onChange: (v2) => settings.updateSetting("idServer", v2),
            placeholder: "ID/Rendezvous server"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingInput,
          {
            label: t2("settings.relayServer"),
            value: settings.relayServer,
            onChange: (v2) => settings.updateSetting("relayServer", v2),
            placeholder: "Relay server"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingInput,
          {
            label: t2("settings.key"),
            value: settings.key,
            onChange: (v2) => settings.updateSetting("key", v2),
            placeholder: "Public key"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingButton, { label: "", buttonText: t2("settings.fetchConfig"), onClick: handleFetchConfig })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingSection, { title: t2("settings.display"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingSelect,
          {
            label: t2("settings.quality"),
            value: settings.displayQuality,
            options: [
              { value: "auto", label: t2("settings.qualityAuto") },
              { value: "best", label: t2("settings.qualityBest") },
              { value: "balanced", label: t2("settings.qualityBalanced") },
              { value: "low", label: t2("settings.qualityLow") }
            ],
            onChange: (v2) => settings.updateSetting("displayQuality", v2)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingSlider,
          {
            label: t2("settings.fps"),
            value: settings.fps,
            min: 5,
            max: 60,
            step: 5,
            onChange: (v2) => settings.updateSetting("fps", v2)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SettingSelect,
          {
            label: t2("settings.codec"),
            value: settings.codec,
            options: [
              { value: "auto", label: t2("settings.qualityAuto") },
              { value: "vp9", label: "VP9" },
              { value: "h264", label: "H.264" },
              { value: "h265", label: "H.265" }
            ],
            onChange: (v2) => settings.updateSetting("codec", v2)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary/50 bg-surface/50 rounded-xl px-4 py-3 border border-surface-lighter/20 leading-relaxed", children: t2("settings.displayHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingSection, { title: t2("settings.about"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingInfo, { label: t2("settings.app"), value: "RDesk Electron UI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingInfo, { label: t2("settings.version"), value: appVersion || "0.1.0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingInfo, { label: t2("settings.platform"), value: `${platformInfo.platform} ${platformInfo.arch}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingInfo, { label: t2("settings.hostname"), value: platformInfo.hostname }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingInfo, { label: t2("settings.osVersion"), value: platformInfo.version })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoginDialog, { open: loginOpen, onClose: () => setLoginOpen(false) })
  ] });
}
function FloatingBall() {
  const t2 = useT();
  const [expanded, setExpanded] = reactExports.useState(false);
  const [connections, setConnections] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const cleanup1 = window.api.onBallExpanded((isExpanded) => {
      setExpanded(isExpanded);
    });
    const cleanup2 = window.api.onConnectionsChanged((conns) => {
      setConnections(conns);
    });
    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);
  const handleClick = () => {
    if (expanded) {
      window.api.collapseBall();
    } else {
      window.api.expandBall();
    }
  };
  const handleDoubleClick = () => {
    window.api.showMainWindow();
  };
  if (!expanded) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "w-14 h-14 rounded-full bg-accent hover:bg-accent-dark cursor-pointer flex items-center justify-center shadow-lg transition-colors drag-region select-none",
        onClick: handleClick,
        onDoubleClick: handleDoubleClick,
        title: t2("ball.hint"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex flex-col items-center", onClick: handleClick, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-[10px] font-bold leading-none mt-0.5", children: connections.length })
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[320px] h-[420px] bg-surface rounded-xl border border-surface-lighter shadow-2xl flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "drag-region flex items-center justify-between px-4 py-3 bg-surface-light border-b border-surface-lighter", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full bg-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-text-primary", children: [
          t2("ball.connections"),
          " (",
          connections.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleDoubleClick,
            className: "w-7 h-7 rounded flex items-center justify-center hover:bg-surface-lighter transition-colors",
            title: t2("ball.openMain"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "#A0A0B0", strokeWidth: "2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 3 21 3 21 9" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 21 3 21 3 15" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "3", x2: "14", y2: "10" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "21", x2: "10", y2: "14" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleClick,
            className: "w-7 h-7 rounded flex items-center justify-center hover:bg-surface-lighter transition-colors",
            title: t2("ball.collapse"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "0", y: "4", width: "10", height: "2", fill: "#A0A0B0" }) })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-2", children: connections.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full text-text-secondary/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs mt-2", children: t2("ball.noConnections") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] mt-1 text-center px-4", children: t2("ball.noConnectionsHint") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: connections.map((conn) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors group",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#0071FF", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-text-primary font-medium", children: conn.peerId }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-accent", children: t2("ball.connected") })
          ] })
        ] })
      },
      conn.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-2 border-t border-surface-lighter bg-surface-light/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-text-secondary", children: "RDesk" }) }) })
  ] });
}
function parseFps(raw) {
  if (raw == null || raw === "") return null;
  const str = String(raw);
  const num = Number(str);
  if (!isNaN(num) && str.indexOf("{") === -1) return num;
  try {
    const map = JSON.parse(str);
    if (typeof map === "object" && map !== null) {
      const vals = Object.values(map);
      if (vals.length > 0) return vals[0];
    }
  } catch {
  }
  return null;
}
const NETWORK_ERROR_PATTERNS = [
  "os error 10053",
  // WSAECONNABORTED
  "os error 10054",
  // WSAECONNRESET
  "os error 10060",
  // WSAETIMEDOUT
  "os error 10061",
  // WSAECONNREFUSED
  "connection reset",
  "connection refused",
  "connection timed out",
  "connection aborted",
  "timed out",
  "timeout"
];
function isNetworkError(text) {
  const lower = text.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((p2) => lower.includes(p2));
}
function useRemoteSession({ sessionId, peerId: rawPeerId, forceRelay = false, onFrame }) {
  const peerId = rawPeerId.replace(/\s/g, "");
  const [status, setStatus] = reactExports.useState("connecting");
  const [peerInfo, setPeerInfo] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [msgbox, setMsgbox] = reactExports.useState(null);
  const [usingRelay, setUsingRelay] = reactExports.useState(forceRelay);
  const [qualityStatus, setQualityStatus] = reactExports.useState(null);
  const [connectionInfo, setConnectionInfo] = reactExports.useState(null);
  const [permissions, setPermissions] = reactExports.useState({
    keyboard: true,
    clipboard: true,
    audio: true,
    file: true,
    restart: true,
    recording: true,
    blockInput: false
  });
  const [recording, setRecording] = reactExports.useState(false);
  const [blockInput, setBlockInput] = reactExports.useState(false);
  const onFrameRef = reactExports.useRef(onFrame);
  onFrameRef.current = onFrame;
  const triedAutoRelayRef = reactExports.useRef(forceRelay);
  const handleEvent = reactExports.useCallback((evtSessionId, eventJson) => {
    if (evtSessionId !== sessionId) return;
    try {
      const evt = JSON.parse(eventJson);
      const name = evt.name;
      switch (name) {
        case "peer_info": {
          const info = {
            username: evt.username || "",
            hostname: evt.hostname || "",
            platform: evt.platform || "",
            displays: evt.displays || [],
            currentDisplay: evt.current_display || 0
          };
          setPeerInfo(info);
          setStatus("connected");
          setMsgbox(null);
          break;
        }
        case "msgbox": {
          const msgType = evt.type || "";
          const title = evt.title || "";
          const text = evt.text || "";
          const link = evt.link || "";
          const hasRetry = evt.hasRetry || false;
          if (msgType === "input-password" || msgType === "password") {
            setStatus("login_required");
            setMsgbox({ type: msgType, title, text, link, hasRetry });
          } else if (msgType === "error" || msgType === "re-input-password") {
            if (msgType === "re-input-password") {
              setStatus("login_required");
            } else {
              if (!triedAutoRelayRef.current && isNetworkError(text)) {
                console.log("[session] Direct connection failed, auto-retrying via relay:", text);
                triedAutoRelayRef.current = true;
                setUsingRelay(true);
                setStatus("connecting");
                setError("");
                window.api.native.sessionReconnect(sessionId, true).catch((e) => {
                  console.error("[session] Auto-relay retry failed:", e);
                  setStatus("error");
                  setError(text);
                  setMsgbox({ type: msgType, title, text, link, hasRetry });
                });
                return;
              }
              setStatus("error");
            }
            setError(text);
            setMsgbox({ type: msgType, title, text, link, hasRetry });
          } else if (msgType === "connecting") {
            setStatus("connecting");
          } else {
            setMsgbox({ type: msgType, title, text, link, hasRetry });
          }
          break;
        }
        case "connection_ready":
          setStatus("connected");
          setConnectionInfo({
            secure: evt.secure === "true",
            direct: evt.direct === "true",
            streamType: evt.stream_type || ""
          });
          break;
        case "permission": {
          const permUpdates = {};
          for (const [key, val] of Object.entries(evt)) {
            if (key === "name") continue;
            const boolVal = val === "true" || val === true;
            if (key === "keyboard") permUpdates.keyboard = boolVal;
            else if (key === "clipboard") permUpdates.clipboard = boolVal;
            else if (key === "audio") permUpdates.audio = boolVal;
            else if (key === "file") permUpdates.file = boolVal;
            else if (key === "restart") permUpdates.restart = boolVal;
            else if (key === "recording") permUpdates.recording = boolVal;
            else if (key === "block_input") permUpdates.blockInput = boolVal;
          }
          setPermissions((prev) => ({ ...prev, ...permUpdates }));
          break;
        }
        case "record_status":
          setRecording(evt.start === "true" || evt.start === true);
          break;
        case "update_block_input_state":
          setBlockInput(evt.input_state === "on");
          break;
        case "update_quality_status": {
          setQualityStatus((prev) => {
            const incoming = {
              speed: evt.speed || "",
              fps: parseFps(evt.fps),
              decodeFps: evt.decode_fps ? Number(evt.decode_fps) || null : null,
              delay: evt.delay ? Number(evt.delay) || null : null,
              codecFormat: evt.codec_format || "",
              decoderType: evt.decoder_type || "",
              targetBitrate: evt.target_bitrate || "",
              chroma: evt.chroma || ""
            };
            if (!prev) return incoming;
            return {
              speed: incoming.speed || prev.speed,
              fps: incoming.fps ?? prev.fps,
              decodeFps: incoming.decodeFps ?? prev.decodeFps,
              delay: incoming.delay ?? prev.delay,
              codecFormat: incoming.codecFormat || prev.codecFormat,
              decoderType: incoming.decoderType || prev.decoderType,
              targetBitrate: incoming.targetBitrate || prev.targetBitrate,
              chroma: incoming.chroma || prev.chroma
            };
          });
          break;
        }
        case "close":
          setStatus("disconnected");
          break;
        default:
          break;
      }
    } catch {
    }
  }, [sessionId]);
  reactExports.useEffect(() => {
    let cancelled = false;
    const native = window.api.native;
    const unsubEvent = native.onEvent(handleEvent);
    const unsubFrame = native.onFrame((sid, frameJson) => {
      if (sid !== sessionId) return;
      try {
        const frame = JSON.parse(frameJson);
        onFrameRef.current?.(frame);
      } catch {
      }
    });
    const startSession = async () => {
      try {
        await native.sessionCreate(sessionId, peerId, {
          forceRelay
        });
        if (cancelled) return;
        await native.sessionStart(sessionId);
      } catch (e) {
        if (!cancelled) {
          console.error("Session start failed:", e);
          setStatus("error");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    };
    startSession();
    return () => {
      cancelled = true;
      unsubEvent();
      unsubFrame();
      native.sessionClose(sessionId).catch(() => {
      });
    };
  }, [sessionId, peerId, forceRelay, handleEvent]);
  const login2 = reactExports.useCallback(async (password, remember) => {
    try {
      setStatus("connecting");
      setMsgbox(null);
      setError("");
      await window.api.native.sessionLogin(sessionId, "", "", password, remember);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [sessionId]);
  const reconnect = reactExports.useCallback(async (forceRelay2) => {
    try {
      setStatus("connecting");
      setError("");
      setMsgbox(null);
      if (forceRelay2) {
        setUsingRelay(true);
        triedAutoRelayRef.current = true;
      }
      await window.api.native.sessionReconnect(sessionId, forceRelay2);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [sessionId]);
  const disconnect = reactExports.useCallback(async () => {
    try {
      await window.api.native.sessionClose(sessionId);
      setStatus("disconnected");
    } catch {
    }
  }, [sessionId]);
  return {
    status,
    peerInfo,
    error,
    msgbox,
    usingRelay,
    qualityStatus,
    connectionInfo,
    permissions,
    recording,
    blockInput,
    login: login2,
    reconnect,
    disconnect
  };
}
const VERT_SRC = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;
const FRAG_SRC = `#version 300 es
precision mediump float;
in vec2 v_texCoord;
out vec4 fragColor;
uniform sampler2D u_texture;
void main() {
  vec4 c = texture(u_texture, v_texCoord);
  fragColor = vec4(c.b, c.g, c.r, c.a);
}
`;
function initWebGL(canvas) {
  const gl2 = canvas.getContext("webgl2", { alpha: false, antialias: false, desynchronized: true });
  if (!gl2) return null;
  const vert = gl2.createShader(gl2.VERTEX_SHADER);
  gl2.shaderSource(vert, VERT_SRC);
  gl2.compileShader(vert);
  if (!gl2.getShaderParameter(vert, gl2.COMPILE_STATUS)) {
    console.error("Vertex shader error:", gl2.getShaderInfoLog(vert));
    return null;
  }
  const frag = gl2.createShader(gl2.FRAGMENT_SHADER);
  gl2.shaderSource(frag, FRAG_SRC);
  gl2.compileShader(frag);
  if (!gl2.getShaderParameter(frag, gl2.COMPILE_STATUS)) {
    console.error("Fragment shader error:", gl2.getShaderInfoLog(frag));
    return null;
  }
  const program = gl2.createProgram();
  gl2.attachShader(program, vert);
  gl2.attachShader(program, frag);
  gl2.linkProgram(program);
  if (!gl2.getProgramParameter(program, gl2.LINK_STATUS)) {
    console.error("Program link error:", gl2.getProgramInfoLog(program));
    return null;
  }
  gl2.useProgram(program);
  const vertices = new Float32Array([
    -1,
    -1,
    0,
    1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    0,
    0,
    1,
    1,
    1,
    0
  ]);
  const vao = gl2.createVertexArray();
  gl2.bindVertexArray(vao);
  const vbo = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, vbo);
  gl2.bufferData(gl2.ARRAY_BUFFER, vertices, gl2.STATIC_DRAW);
  const posLoc = gl2.getAttribLocation(program, "a_position");
  gl2.enableVertexAttribArray(posLoc);
  gl2.vertexAttribPointer(posLoc, 2, gl2.FLOAT, false, 16, 0);
  const texLoc = gl2.getAttribLocation(program, "a_texCoord");
  gl2.enableVertexAttribArray(texLoc);
  gl2.vertexAttribPointer(texLoc, 2, gl2.FLOAT, false, 16, 8);
  const texture = gl2.createTexture();
  gl2.bindTexture(gl2.TEXTURE_2D, texture);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
  return { gl: gl2, program, texture, vao };
}
function RemoteCanvas({ sessionId, frameInfo, style }) {
  const canvasRef = reactExports.useRef(null);
  const glRef = reactExports.useRef(null);
  const rafRef = reactExports.useRef(0);
  const frameInfoRef = reactExports.useRef(null);
  const [canvasSize, setCanvasSize] = reactExports.useState({ width: 0, height: 0 });
  const fetchingRef = reactExports.useRef(false);
  frameInfoRef.current = frameInfo;
  reactExports.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = initWebGL(canvas);
    if (!state) {
      console.error("Failed to initialize WebGL2");
      return;
    }
    glRef.current = state;
    canvas.focus();
    return () => {
      glRef.current = null;
    };
  }, []);
  reactExports.useEffect(() => {
    if (frameInfo && frameInfo.width > 0 && frameInfo.height > 0) {
      setCanvasSize({ width: frameInfo.width, height: frameInfo.height });
    }
  }, [frameInfo?.width, frameInfo?.height]);
  reactExports.useEffect(() => {
    let running = true;
    const renderFrame = async () => {
      if (!running) return;
      const glState = glRef.current;
      const fi2 = frameInfoRef.current;
      if (glState && fi2 && fi2.width > 0 && !fetchingRef.current) {
        fetchingRef.current = true;
        try {
          const rgba = await window.api.native.getFrameRgba(sessionId, fi2.display);
          if (rgba && rgba.length > 0 && running) {
            const { gl: gl2, texture, vao } = glState;
            const canvas = canvasRef.current;
            if (canvas) {
              if (canvas.width !== fi2.width || canvas.height !== fi2.height) {
                canvas.width = fi2.width;
                canvas.height = fi2.height;
              }
              gl2.viewport(0, 0, fi2.width, fi2.height);
              gl2.bindTexture(gl2.TEXTURE_2D, texture);
              gl2.texImage2D(
                gl2.TEXTURE_2D,
                0,
                gl2.RGBA,
                fi2.width,
                fi2.height,
                0,
                gl2.RGBA,
                gl2.UNSIGNED_BYTE,
                new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength)
              );
              gl2.bindVertexArray(vao);
              gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
            }
          }
        } catch {
        }
        fetchingRef.current = false;
      }
      if (running) {
        rafRef.current = requestAnimationFrame(renderFrame);
      }
    };
    rafRef.current = requestAnimationFrame(renderFrame);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [sessionId]);
  const MOUSE_TYPE_DOWN = 1;
  const MOUSE_TYPE_UP = 2;
  const MOUSE_TYPE_WHEEL = 3;
  const MOUSE_BUTTON_LEFT = 1 << 3;
  const MOUSE_BUTTON_RIGHT = 2 << 3;
  const MOUSE_BUTTON_MIDDLE = 4 << 3;
  const MOUSE_BUTTON_BACK = 8 << 3;
  const MOUSE_BUTTON_FORWARD = 16 << 3;
  const buttonBitMap = {
    0: MOUSE_BUTTON_LEFT,
    1: MOUSE_BUTTON_MIDDLE,
    2: MOUSE_BUTTON_RIGHT,
    3: MOUSE_BUTTON_BACK,
    4: MOUSE_BUTTON_FORWARD
  };
  const canvasToRemote = reactExports.useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const fi2 = frameInfoRef.current;
    if (!canvas || !fi2 || fi2.width === 0 || fi2.height === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const canvasAspect = fi2.width / fi2.height;
    const elemAspect = rect.width / rect.height;
    let renderW, renderH, offsetX, offsetY;
    if (canvasAspect > elemAspect) {
      renderW = rect.width;
      renderH = rect.width / canvasAspect;
      offsetX = 0;
      offsetY = (rect.height - renderH) / 2;
    } else {
      renderH = rect.height;
      renderW = rect.height * canvasAspect;
      offsetX = (rect.width - renderW) / 2;
      offsetY = 0;
    }
    const localX = clientX - rect.left - offsetX;
    const localY = clientY - rect.top - offsetY;
    const x2 = Math.round(Math.max(0, Math.min(fi2.width - 1, localX * fi2.width / renderW)));
    const y2 = Math.round(Math.max(0, Math.min(fi2.height - 1, localY * fi2.height / renderH)));
    return { x: x2, y: y2 };
  }, []);
  const sendMouse = reactExports.useCallback((e, eventType) => {
    const coords = canvasToRemote(e.clientX, e.clientY);
    if (!coords) return;
    let mask = 0;
    if (eventType === "down") {
      mask = MOUSE_TYPE_DOWN | (buttonBitMap[e.button] || 0);
    } else if (eventType === "up") {
      mask = MOUSE_TYPE_UP | (buttonBitMap[e.button] || 0);
    }
    const msg = JSON.stringify({ mask, x: coords.x, y: coords.y, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, command: e.metaKey });
    window.api.native.sendMouse(sessionId, msg).catch(() => {
    });
  }, [sessionId, canvasToRemote]);
  const handleWheel = reactExports.useCallback((e) => {
    const coords = canvasToRemote(e.clientX, e.clientY);
    if (!coords) return;
    const mask = MOUSE_TYPE_WHEEL;
    const scrollY = e.deltaY > 0 ? 120 : -120;
    const msg = JSON.stringify({ mask, x: coords.x, y: scrollY, alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, command: e.metaKey });
    window.api.native.sendMouse(sessionId, msg).catch(() => {
    });
  }, [sessionId, canvasToRemote]);
  const CODE_TO_VK = {
    KeyA: "VK_A",
    KeyB: "VK_B",
    KeyC: "VK_C",
    KeyD: "VK_D",
    KeyE: "VK_E",
    KeyF: "VK_F",
    KeyG: "VK_G",
    KeyH: "VK_H",
    KeyI: "VK_I",
    KeyJ: "VK_J",
    KeyK: "VK_K",
    KeyL: "VK_L",
    KeyM: "VK_M",
    KeyN: "VK_N",
    KeyO: "VK_O",
    KeyP: "VK_P",
    KeyQ: "VK_Q",
    KeyR: "VK_R",
    KeyS: "VK_S",
    KeyT: "VK_T",
    KeyU: "VK_U",
    KeyV: "VK_V",
    KeyW: "VK_W",
    KeyX: "VK_X",
    KeyY: "VK_Y",
    KeyZ: "VK_Z",
    Digit0: "VK_0",
    Digit1: "VK_1",
    Digit2: "VK_2",
    Digit3: "VK_3",
    Digit4: "VK_4",
    Digit5: "VK_5",
    Digit6: "VK_6",
    Digit7: "VK_7",
    Digit8: "VK_8",
    Digit9: "VK_9",
    F1: "VK_F1",
    F2: "VK_F2",
    F3: "VK_F3",
    F4: "VK_F4",
    F5: "VK_F5",
    F6: "VK_F6",
    F7: "VK_F7",
    F8: "VK_F8",
    F9: "VK_F9",
    F10: "VK_F10",
    F11: "VK_F11",
    F12: "VK_F12",
    ArrowLeft: "VK_LEFT",
    ArrowRight: "VK_RIGHT",
    ArrowUp: "VK_UP",
    ArrowDown: "VK_DOWN",
    Home: "VK_HOME",
    End: "VK_END",
    PageUp: "VK_PRIOR",
    PageDown: "VK_NEXT",
    Insert: "VK_INSERT",
    Backspace: "VK_BACK",
    Delete: "VK_DELETE",
    Enter: "VK_ENTER",
    NumpadEnter: "VK_ENTER",
    Tab: "VK_TAB",
    Escape: "VK_ESCAPE",
    Space: "VK_SPACE",
    ShiftLeft: "VK_SHIFT",
    ShiftRight: "RShift",
    ControlLeft: "VK_CONTROL",
    ControlRight: "RControl",
    AltLeft: "VK_MENU",
    AltRight: "RAlt",
    MetaLeft: "Meta",
    MetaRight: "RWin",
    CapsLock: "VK_CAPITAL",
    NumLock: "VK_NUMLOCK",
    ScrollLock: "VK_SCROLL",
    Numpad0: "VK_NUMPAD0",
    Numpad1: "VK_NUMPAD1",
    Numpad2: "VK_NUMPAD2",
    Numpad3: "VK_NUMPAD3",
    Numpad4: "VK_NUMPAD4",
    Numpad5: "VK_NUMPAD5",
    Numpad6: "VK_NUMPAD6",
    Numpad7: "VK_NUMPAD7",
    Numpad8: "VK_NUMPAD8",
    Numpad9: "VK_NUMPAD9",
    NumpadAdd: "VK_ADD",
    NumpadSubtract: "VK_SUBTRACT",
    NumpadMultiply: "VK_MULTIPLY",
    NumpadDivide: "VK_DIVIDE",
    NumpadDecimal: "VK_DECIMAL",
    Semicolon: "VK_OEM_1",
    Equal: "VK_OEM_PLUS",
    Comma: "VK_OEM_COMMA",
    Minus: "VK_OEM_MINUS",
    Period: "VK_OEM_PERIOD",
    Slash: "VK_OEM_2",
    Backquote: "VK_OEM_3",
    BracketLeft: "VK_OEM_4",
    Backslash: "VK_OEM_5",
    BracketRight: "VK_OEM_6",
    Quote: "VK_OEM_7",
    PrintScreen: "VK_SNAPSHOT",
    Pause: "VK_PAUSE",
    ContextMenu: "VK_APPS"
  };
  const handleKeyEvent = reactExports.useCallback((e, isDown) => {
    e.preventDefault();
    e.stopPropagation();
    const vkName = CODE_TO_VK[e.code] || (e.key.length === 1 ? e.key : null);
    if (!vkName) return;
    const down = isDown && !e.repeat;
    const press = isDown && e.repeat;
    window.api.native.inputKey(
      sessionId,
      vkName,
      down,
      press,
      e.altKey,
      e.ctrlKey,
      e.shiftKey,
      e.metaKey
    ).catch(() => {
    });
  }, [sessionId]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      width: canvasSize.width || 1,
      height: canvasSize.height || 1,
      tabIndex: 0,
      style: {
        outline: "none",
        cursor: "default",
        objectFit: "contain",
        width: "100%",
        height: "100%",
        ...style
      },
      onMouseDown: (e) => {
        e.preventDefault();
        canvasRef.current?.focus();
        sendMouse(e, "down");
      },
      onMouseUp: (e) => sendMouse(e, "up"),
      onMouseMove: (e) => sendMouse(e, "move"),
      onWheel: handleWheel,
      onKeyDown: (e) => handleKeyEvent(e, true),
      onKeyUp: (e) => handleKeyEvent(e, false),
      onContextMenu: (e) => e.preventDefault()
    }
  );
}
function ChatPanel({ sessionId, onClose }) {
  const t2 = useT();
  const [messages, setMessages] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const listRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const unsub = window.api.native.onEvent((sid, eventJson) => {
      if (sid !== sessionId) return;
      try {
        const evt = JSON.parse(eventJson);
        if (evt.name === "chat_client_mode") {
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            text: evt.text || "",
            isMe: false,
            time: Date.now()
          }]);
        }
      } catch {
      }
    });
    return unsub;
  }, [sessionId]);
  reactExports.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      text,
      isMe: true,
      time: Date.now()
    }]);
    window.api.native.sendChat(sessionId, text).catch(() => {
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-72 h-full flex flex-col bg-surface border-l border-surface-lighter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-surface-lighter", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-text-primary", children: t2("chat.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "w-6 h-6 rounded flex items-center justify-center hover:bg-surface-lighter text-text-secondary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 1l8 8M9 1l-8 8", stroke: "currentColor", strokeWidth: "1.5" }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: listRef, className: "flex-1 overflow-auto p-3 space-y-2", children: messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary/40 text-center py-8", children: t2("chat.noMessages") }) : messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${msg.isMe ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[85%] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${msg.isMe ? "bg-primary/20 text-text-primary rounded-br-sm" : "bg-surface-lighter/50 text-text-primary rounded-bl-sm"}`, children: [
      msg.text,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-[9px] mt-0.5 ${msg.isMe ? "text-primary/50" : "text-text-secondary/30"}`, children: new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
    ] }) }, msg.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-t border-surface-lighter", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && handleSend(),
          placeholder: t2("chat.placeholder"),
          className: "flex-1 bg-surface-light border border-surface-lighter/50 rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none focus:border-primary/50"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleSend,
          disabled: !input.trim(),
          className: "px-3 py-1.5 bg-primary/80 hover:bg-primary disabled:bg-surface-lighter rounded-lg text-white text-xs transition-colors",
          children: t2("chat.send")
        }
      )
    ] }) })
  ] });
}
function FileTransferPanel({ sessionId, onClose }) {
  const t2 = useT();
  const [localPath, setLocalPath] = reactExports.useState("C:\\");
  const [remotePath, setRemotePath] = reactExports.useState("/");
  const [localEntries, setLocalEntries] = reactExports.useState([]);
  const [remoteEntries, setRemoteEntries] = reactExports.useState([]);
  const [jobs, setJobs] = reactExports.useState([]);
  const [activeTab, setActiveTab] = reactExports.useState("browser");
  const [nextJobId, setNextJobId] = reactExports.useState(1);
  const loadLocal = reactExports.useCallback(async (path) => {
    try {
      const result = await window.api.native.readLocalDir(path, false);
      const data = JSON.parse(result);
      if (data.entries) {
        setLocalEntries(data.entries);
        setLocalPath(data.path);
      }
    } catch {
    }
  }, []);
  const loadRemote = reactExports.useCallback((path) => {
    setRemotePath(path);
    window.api.native.readRemoteDir(sessionId, path, false).catch(() => {
    });
  }, [sessionId]);
  reactExports.useEffect(() => {
    const unsub = window.api.native.onEvent((sid, eventJson) => {
      if (sid !== sessionId) return;
      try {
        const evt = JSON.parse(eventJson);
        if (evt.name === "file_dir" && evt.is_local === "false") {
          const fd2 = JSON.parse(evt.value || "{}");
          if (fd2.entries) {
            const entries = fd2.entries.map((e) => ({
              name: e.name,
              isDir: e.is_dir || false,
              size: e.size || 0,
              modified: e.modified_time || 0
            }));
            setRemoteEntries(entries);
            if (fd2.path) setRemotePath(fd2.path);
          }
        } else if (evt.name === "job_progress") {
          setJobs((prev) => prev.map(
            (j) => j.id === Number(evt.id) ? { ...j, progress: Number(evt.finished_size) || 0, speed: evt.speed || "", status: "transferring" } : j
          ));
        } else if (evt.name === "job_done") {
          setJobs((prev) => prev.map(
            (j) => j.id === Number(evt.id) ? { ...j, status: "done", progress: 100 } : j
          ));
        } else if (evt.name === "job_error") {
          setJobs((prev) => prev.map(
            (j) => j.id === Number(evt.id) ? { ...j, status: "error", error: evt.err } : j
          ));
        }
      } catch {
      }
    });
    return unsub;
  }, [sessionId]);
  reactExports.useEffect(() => {
    loadLocal(localPath);
    loadRemote(remotePath);
  }, []);
  const navigateLocal = (entry) => {
    if (!entry.isDir) return;
    const sep = localPath.includes("\\") ? "\\" : "/";
    const newPath = localPath.endsWith(sep) ? localPath + entry.name : localPath + sep + entry.name;
    loadLocal(newPath);
  };
  const navigateRemote = (entry) => {
    if (!entry.isDir) return;
    const newPath = remotePath.endsWith("/") ? remotePath + entry.name : remotePath + "/" + entry.name;
    loadRemote(newPath);
  };
  const goUpLocal = () => {
    const sep = localPath.includes("\\") ? "\\" : "/";
    const parts = localPath.split(sep).filter(Boolean);
    if (parts.length <= 1) {
      loadLocal(localPath.includes("\\") ? parts[0] + "\\" : "/");
    } else {
      parts.pop();
      loadLocal(parts.join(sep) + sep);
    }
  };
  const goUpRemote = () => {
    const parts = remotePath.split("/").filter(Boolean);
    if (parts.length <= 0) return;
    parts.pop();
    loadRemote("/" + parts.join("/"));
  };
  const uploadFile = (entry) => {
    if (entry.isDir) return;
    const id2 = nextJobId;
    setNextJobId(id2 + 1);
    const sep = localPath.includes("\\") ? "\\" : "/";
    const from = localPath.endsWith(sep) ? localPath + entry.name : localPath + sep + entry.name;
    const to = remotePath.endsWith("/") ? remotePath : remotePath + "/";
    setJobs((prev) => [...prev, { id: id2, fileName: entry.name, isUpload: true, progress: 0, speed: "", status: "transferring" }]);
    setActiveTab("transfers");
    window.api.native.sendFiles(sessionId, id2, from, to, 0, false, false).catch(() => {
    });
  };
  const downloadFile = (entry) => {
    if (entry.isDir) return;
    const id2 = nextJobId;
    setNextJobId(id2 + 1);
    const from = remotePath.endsWith("/") ? remotePath + entry.name : remotePath + "/" + entry.name;
    const to = localPath.endsWith("\\") || localPath.endsWith("/") ? localPath : localPath + "\\";
    setJobs((prev) => [...prev, { id: id2, fileName: entry.name, isUpload: false, progress: 0, speed: "", status: "transferring" }]);
    setActiveTab("transfers");
    window.api.native.sendFiles(sessionId, id2, from, to, 0, false, true).catch(() => {
    });
  };
  const cancelJob = (id2) => {
    window.api.native.cancelJob(sessionId, id2).catch(() => {
    });
    setJobs((prev) => prev.filter((j) => j.id !== id2));
  };
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex flex-col bg-surface", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-surface-lighter shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-text-primary", children: t2("file.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-surface-light/60 rounded-lg border border-surface-lighter/30 p-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setActiveTab("browser"),
              className: `px-2.5 py-1 text-[10px] rounded transition-colors ${activeTab === "browser" ? "bg-primary/20 text-primary" : "text-text-secondary"}`,
              children: t2("file.browser")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setActiveTab("transfers"),
              className: `px-2.5 py-1 text-[10px] rounded transition-colors ${activeTab === "transfers" ? "bg-primary/20 text-primary" : "text-text-secondary"}`,
              children: [
                t2("file.transfers"),
                " ",
                jobs.length > 0 && `(${jobs.length})`
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "w-6 h-6 rounded flex items-center justify-center hover:bg-surface-lighter text-text-secondary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 1l8 8M9 1l-8 8", stroke: "currentColor", strokeWidth: "1.5" }) }) })
    ] }),
    activeTab === "browser" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col border-r border-surface-lighter/30 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-1.5 border-b border-surface-lighter/20 flex items-center gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-text-secondary font-semibold uppercase", children: t2("file.local") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goUpLocal, className: "text-[10px] text-primary hover:text-primary-dark", children: ".." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-[10px] text-text-secondary/60 truncate font-mono", children: localPath })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: localEntries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onDoubleClick: () => navigateLocal(entry),
            className: "flex items-center gap-2 px-3 py-1 hover:bg-surface-lighter/30 cursor-pointer group text-xs",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary/60", children: entry.isDir ? "📁" : "📄" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-text-primary truncate", children: entry.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-text-secondary/40", children: entry.isDir ? "" : formatSize(entry.size) }),
              !entry.isDir && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    uploadFile(entry);
                  },
                  className: "opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary rounded transition-opacity",
                  title: t2("file.upload"),
                  children: "→"
                }
              )
            ]
          },
          entry.name
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-1.5 border-b border-surface-lighter/20 flex items-center gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-text-secondary font-semibold uppercase", children: t2("file.remote") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goUpRemote, className: "text-[10px] text-primary hover:text-primary-dark", children: ".." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-[10px] text-text-secondary/60 truncate font-mono", children: remotePath })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto", children: remoteEntries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onDoubleClick: () => navigateRemote(entry),
            className: "flex items-center gap-2 px-3 py-1 hover:bg-surface-lighter/30 cursor-pointer group text-xs",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary/60", children: entry.isDir ? "📁" : "📄" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-text-primary truncate", children: entry.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-text-secondary/40", children: entry.isDir ? "" : formatSize(entry.size) }),
              !entry.isDir && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    downloadFile(entry);
                  },
                  className: "opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-accent/20 text-accent rounded transition-opacity",
                  title: t2("file.download"),
                  children: "←"
                }
              )
            ]
          },
          entry.name
        )) })
      ] })
    ] }) : (
      /* Transfers tab */
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-3", children: jobs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary/40 text-center py-8", children: t2("file.noTransfers") }) : jobs.map((job) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-light/50 mb-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-text-secondary/60 text-xs", children: job.isUpload ? "↑" : "↓" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-primary truncate", children: job.fileName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1 bg-surface-lighter rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `h-full rounded-full transition-all ${job.status === "done" ? "bg-accent" : job.status === "error" ? "bg-danger" : "bg-primary"}`,
                style: { width: `${Math.min(100, job.progress)}%` }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-text-secondary/50", children: job.status === "done" ? t2("file.completed") : job.status === "error" ? t2("file.failed") : job.speed || "..." })
          ] })
        ] }),
        job.status === "transferring" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => cancelJob(job.id), className: "text-text-secondary/50 hover:text-danger text-xs transition-colors", children: "✕" })
      ] }, job.id)) })
    )
  ] });
}
function PasswordDialog({
  error,
  onSubmit,
  onCancel
}) {
  const t2 = useT();
  const [password, setPassword] = reactExports.useState("");
  const [remember, setRemember] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/60 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-surface-light rounded-xl p-6 w-80 border border-surface-lighter shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-text-primary mb-1", children: t2("remote.passwordRequired") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-secondary mb-4", children: t2("remote.enterPassword") }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-red-400 bg-red-400/10 rounded-lg p-2 mb-3", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "password",
        value: password,
        onChange: (e) => setPassword(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && password && onSubmit(password, remember),
        placeholder: t2("remote.password"),
        autoFocus: true,
        className: "w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors mb-3"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs text-text-secondary mb-4 cursor-pointer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "checkbox",
          checked: remember,
          onChange: (e) => setRemember(e.target.checked),
          className: "rounded border-surface-lighter"
        }
      ),
      t2("remote.rememberPassword")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onCancel,
          className: "flex-1 px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary transition-colors text-sm",
          children: t2("remote.cancel")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => password && onSubmit(password, remember),
          disabled: !password,
          className: "flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-surface-lighter disabled:text-text-secondary rounded-lg text-white text-sm transition-colors",
          children: t2("remote.login")
        }
      )
    ] })
  ] }) });
}
function RemoteDesktop() {
  const t2 = useT();
  const loadSettings = useSettingsStore((s) => s.loadFromConfig);
  const { peerId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session") || "";
  const forceRelay = searchParams.get("relay") === "1";
  const [frameInfo, setFrameInfo] = reactExports.useState(null);
  const [isFullscreen, setIsFullscreen] = reactExports.useState(false);
  const [maximized, setMaximized] = reactExports.useState(false);
  const [showChat, setShowChat] = reactExports.useState(false);
  const [showFiles, setShowFiles] = reactExports.useState(false);
  const [showQuality, setShowQuality] = reactExports.useState(false);
  const [showActions, setShowActions] = reactExports.useState(false);
  const [showDisplays, setShowDisplays] = reactExports.useState(false);
  const qualityRef = reactExports.useRef(null);
  const actionsRef = reactExports.useRef(null);
  const displaysRef = reactExports.useRef(null);
  const [screenshotCooldown, setScreenshotCooldown] = reactExports.useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = reactExports.useState(false);
  const [toolbarPinned, setToolbarPinned] = reactExports.useState(true);
  const [toolbarVisible, setToolbarVisible] = reactExports.useState(true);
  const toolbarHideTimer = reactExports.useRef(null);
  const [currentDisplay, setCurrentDisplay] = reactExports.useState(0);
  const [allDisplaysMode, setAllDisplaysMode] = reactExports.useState(false);
  const [curQuality, setCurQuality] = reactExports.useState("balanced");
  const [curCodec, setCurCodec] = reactExports.useState("");
  const [curFps, setCurFps] = reactExports.useState(60);
  const [curMode, setCurMode] = reactExports.useState("standard");
  const [toggleStates, setToggleStates] = reactExports.useState({});
  reactExports.useEffect(() => {
    loadSettings();
  }, []);
  reactExports.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  reactExports.useEffect(() => {
    window.api.isMaximized().then(setMaximized);
  }, []);
  reactExports.useEffect(() => {
    if (!showQuality && !showActions && !showDisplays) return;
    const handler = (e) => {
      if (showQuality && qualityRef.current && !qualityRef.current.contains(e.target)) {
        setShowQuality(false);
      }
      if (showActions && actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
      if (showDisplays && displaysRef.current && !displaysRef.current.contains(e.target)) {
        setShowDisplays(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showQuality, showActions, showDisplays]);
  reactExports.useEffect(() => {
    if (toolbarPinned || isFullscreen) return;
    if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
    toolbarHideTimer.current = setTimeout(() => {
      setToolbarVisible(false);
    }, 2e3);
    return () => {
      if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
    };
  }, [toolbarPinned, isFullscreen, toolbarVisible]);
  reactExports.useEffect(() => {
    const handler = async (e) => {
      if (e.ctrlKey && e.key === "v") {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            window.api.native.setClipboard(sessionId, text).catch(() => {
            });
          }
        } catch {
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sessionId]);
  const onFrame = reactExports.useCallback((frame) => {
    setFrameInfo(frame);
  }, []);
  const {
    status,
    peerInfo,
    error,
    usingRelay,
    qualityStatus,
    connectionInfo,
    permissions,
    recording,
    blockInput,
    login: login2,
    reconnect,
    disconnect
  } = useRemoteSession({
    sessionId,
    peerId: peerId || "",
    forceRelay,
    onFrame
  });
  const handleDisconnect = async () => {
    await disconnect();
    window.api.close();
  };
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  const handleMaximize = () => {
    window.api.maximize();
    setMaximized(!maximized);
  };
  const handleCtrlAltDel = () => {
    window.api.native.ctrlAltDel(sessionId).catch(() => {
    });
  };
  const handleLockScreen = () => {
    window.api.native.lockScreen(sessionId).catch(() => {
    });
  };
  const handleRefresh = () => {
    window.api.native.refresh(sessionId, frameInfo?.display || 0).catch(() => {
    });
  };
  const handleToggleOption = async (opt) => {
    await window.api.native.toggleOption(sessionId, opt).catch(() => {
    });
    const newVal = await window.api.native.getToggleOption(sessionId, opt).catch(() => false);
    setToggleStates((prev) => ({ ...prev, [opt]: newVal }));
  };
  const handleSwitchDisplay = async (display) => {
    setCurrentDisplay(display);
    setAllDisplaysMode(false);
    await window.api.native.switchDisplay(sessionId, display).catch(() => {
    });
    setShowDisplays(false);
  };
  const handleAllDisplays = async () => {
    if (!peerInfo?.displays) return;
    const allIndices = peerInfo.displays.map((_, i) => i);
    setAllDisplaysMode(true);
    await window.api.native.captureDisplays(sessionId, [], [], allIndices).catch(() => {
    });
    setShowDisplays(false);
  };
  const handleRestartDevice = async () => {
    await window.api.native.restartRemoteDevice(sessionId).catch(() => {
    });
    setShowRestartConfirm(false);
    setShowActions(false);
  };
  const handleToggleBlockInput = async () => {
    await window.api.native.toggleOption(sessionId, "block-input").catch(() => {
    });
  };
  const handleScreenshot = async () => {
    if (screenshotCooldown) return;
    setScreenshotCooldown(true);
    await window.api.native.takeScreenshot(sessionId, frameInfo?.display || 0).catch(() => {
    });
    setTimeout(() => setScreenshotCooldown(false), 3e3);
  };
  const handleToggleRecording = async () => {
    await window.api.native.recordScreen(sessionId, !recording).catch(() => {
    });
  };
  const handleTogglePrivacyMode = async () => {
    const currentlyOn = toggleStates["privacy-mode"] || false;
    await window.api.native.togglePrivacyMode(sessionId, "", !currentlyOn).catch(() => {
    });
    setToggleStates((prev) => ({ ...prev, "privacy-mode": !currentlyOn }));
  };
  const handleElevation = async () => {
    await window.api.native.elevateDirect(sessionId).catch(() => {
    });
    setShowActions(false);
  };
  const [curKeyboardMode, setCurKeyboardMode] = reactExports.useState("");
  const handleToolbarMouseEnter = () => {
    if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current);
    setToolbarVisible(true);
  };
  const handleToolbarMouseLeave = () => {
    if (toolbarPinned || isFullscreen) return;
    toolbarHideTimer.current = setTimeout(() => {
      setToolbarVisible(false);
    }, 2e3);
  };
  reactExports.useEffect(() => {
    if (!showQuality || !sessionId) return;
    const opts = ["show-remote-cursor", "disable-audio", "disable-clipboard", "lock-after-session-end", "view-only", "reverse-mouse-wheel", "swap-left-right-mouse", "allow_swap_key", "i444", "follow-remote-cursor", "zoom-cursor"];
    Promise.all(opts.map(async (opt) => {
      const val = await window.api.native.getToggleOption(sessionId, opt).catch(() => false);
      return [opt, val];
    })).then((pairs) => {
      setToggleStates(Object.fromEntries(pairs));
    });
    window.api.native.sessionGetOption(sessionId, "codec-preference").then((v2) => setCurCodec(v2 || "")).catch(() => {
    });
    window.api.native.getKeyboardMode(sessionId).then((v2) => setCurKeyboardMode(v2 || "legacy")).catch(() => {
    });
  }, [showQuality, sessionId]);
  const applyPerformanceMode = async (mode) => {
    let quality, fps, codec;
    switch (mode) {
      case "office":
        quality = "low";
        fps = 30;
        codec = "vp9";
        break;
      case "game":
        quality = "best";
        fps = 120;
        codec = "h264";
        break;
      case "standard":
      default:
        quality = "balanced";
        fps = 60;
        codec = "";
        break;
    }
    setCurMode(mode);
    setCurQuality(quality);
    setCurFps(fps);
    setCurCodec(codec);
    await window.api.native.saveImageQuality(sessionId, quality).catch(() => {
    });
    await window.api.native.setCustomFps(sessionId, fps).catch(() => {
    });
    await window.api.native.sessionSetOption(sessionId, "codec-preference", codec).catch(() => {
    });
    window.api.native.changePreferCodec(sessionId).catch(() => {
    });
    setShowQuality(false);
  };
  if (!peerId || !sessionId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-text-secondary", children: t2("remote.invalidSession") }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen flex flex-col bg-black relative", children: [
    !isFullscreen && (toolbarPinned || toolbarVisible) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-between bg-surface border-b border-surface-lighter shrink-0 select-none",
        onMouseEnter: handleToolbarMouseEnter,
        onMouseLeave: handleToolbarMouseLeave,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "drag-region flex-1 flex items-center gap-3 px-4 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleDisconnect,
                className: "no-drag text-text-secondary hover:text-red-400 transition-colors",
                title: t2("remote.disconnect"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-text-primary font-medium", children: peerInfo?.hostname || peerId }),
            peerInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-text-secondary", children: [
              peerInfo.username,
              "@",
              peerInfo.platform
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status }),
            connectionInfo && status === "connected" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `no-drag text-[10px] px-2 py-0.5 rounded-full ${connectionInfo.secure ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`, children: connectionInfo.secure ? t2("remote.connectionSecure") : t2("remote.connectionInsecure") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `no-drag text-[10px] px-2 py-0.5 rounded-full ${connectionInfo.direct ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`, children: connectionInfo.direct ? t2("remote.connectionDirect") : t2("remote.connectionRelay") })
            ] }),
            !connectionInfo && usingRelay && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400", children: "Relay" }),
            qualityStatus && status === "connected" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] text-text-secondary ml-2", children: [
              qualityStatus.fps != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "FPS", children: [
                qualityStatus.fps,
                " fps"
              ] }),
              qualityStatus.decodeFps != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "Decode FPS", children: [
                "d:",
                qualityStatus.decodeFps
              ] }),
              qualityStatus.delay != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "Latency", className: qualityStatus.delay > 200 ? "text-red-400" : qualityStatus.delay > 100 ? "text-orange-400" : "", children: [
                qualityStatus.delay,
                "ms"
              ] }),
              qualityStatus.speed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title: "Speed", children: qualityStatus.speed }),
              (qualityStatus.codecFormat || qualityStatus.decoderType) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0 rounded bg-surface-lighter/50", title: "Codec / Decoder", children: qualityStatus.codecFormat || qualityStatus.decoderType }),
              qualityStatus.chroma && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title: "Chroma", children: qualityStatus.chroma })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-drag flex items-center", children: [
            peerInfo && peerInfo.displays.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: displaysRef, className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.displays"), onClick: () => setShowDisplays(!showDisplays), active: showDisplays, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
              ] }) }),
              showDisplays && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-full right-0 mt-1 w-44 bg-surface-light border border-surface-lighter rounded-lg shadow-xl py-1 z-20", children: [
                peerInfo.displays.map((disp, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => handleSwitchDisplay(i),
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${!allDisplaysMode && currentDisplay === i ? "text-primary bg-primary/10" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
                      ] }),
                      t2("remote.displays"),
                      " ",
                      i + 1,
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] text-text-secondary/60 ml-auto", children: [
                        disp.width,
                        "x",
                        disp.height
                      ] })
                    ]
                  },
                  i
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleAllDisplays,
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${allDisplaysMode ? "text-primary bg-primary/10" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "1", y: "4", width: "10", height: "7", rx: "1" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "13", y: "4", width: "10", height: "7", rx: "1" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "18", x2: "16", y2: "18" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "14", x2: "12", y2: "18" })
                      ] }),
                      t2("remote.allDisplays")
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.refresh"), onClick: handleRefresh, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 4v6h-6" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 20v-6h6" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: qualityRef, className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.quality"), onClick: () => setShowQuality(!showQuality), active: showQuality, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
              ] }) }),
              showQuality && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-full right-0 mt-1 w-56 bg-surface-light border border-surface-lighter rounded-lg shadow-xl py-1 z-20 max-h-[80vh] overflow-y-auto", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide", children: t2("remote.performanceMode") }),
                [
                  { label: t2("remote.modeOffice"), value: "office", desc: "30fps / Low / VP9" },
                  { label: t2("remote.modeStandard"), value: "standard", desc: "60fps / Balanced / Auto" },
                  { label: t2("remote.modeGame"), value: "game", desc: "120fps / Best / H264" }
                ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => applyPerformanceMode(item.value),
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${curMode === item.value ? "text-primary bg-primary/10" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-text-secondary/60", children: item.desc })
                    ]
                  },
                  item.value
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide", children: t2("remote.qualitySettings") }),
                [
                  { label: t2("settings.qualityBest"), value: "best" },
                  { label: t2("settings.qualityBalanced"), value: "balanced" },
                  { label: t2("settings.qualityLow"), value: "low" }
                ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => {
                      setCurQuality(item.value);
                      setCurMode("");
                      window.api.native.saveImageQuality(sessionId, item.value).catch(() => {
                      });
                    },
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${curQuality === item.value ? "text-primary bg-primary/10" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-3 text-center ${curQuality === item.value ? "" : "opacity-0"}`, children: "✓" }),
                      item.label
                    ]
                  },
                  item.value
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide", children: "FPS" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 flex flex-wrap gap-1", children: [15, 30, 60, 120].map((fps) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => {
                      setCurFps(fps);
                      setCurMode("");
                      window.api.native.setCustomFps(sessionId, fps).catch(() => {
                      });
                    },
                    className: `px-2.5 py-1 rounded text-[11px] transition-colors ${curFps === fps ? "bg-primary text-white" : "bg-surface-lighter/60 text-text-secondary hover:bg-surface-lighter hover:text-text-primary"}`,
                    children: fps
                  },
                  fps
                )) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide", children: t2("settings.codec") }),
                [
                  { label: "Auto", value: "" },
                  { label: "VP9", value: "vp9" },
                  { label: "H264", value: "h264" },
                  { label: "H265", value: "h265" },
                  { label: "AV1", value: "av1" }
                ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: async () => {
                      setCurCodec(item.value);
                      setCurMode("");
                      await window.api.native.sessionSetOption(sessionId, "codec-preference", item.value).catch(() => {
                      });
                      window.api.native.changePreferCodec(sessionId).catch(() => {
                      });
                    },
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${curCodec === item.value ? "text-primary bg-primary/10" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-3 text-center ${curCodec === item.value ? "" : "opacity-0"}`, children: "✓" }),
                      item.label
                    ]
                  },
                  item.value || "auto"
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide", children: t2("remote.keyboardMode") }),
                [
                  { label: t2("remote.modeLegacy"), value: "legacy" },
                  { label: t2("remote.modeMap"), value: "map" },
                  { label: t2("remote.modeTranslate"), value: "translate" }
                ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: async () => {
                      setCurKeyboardMode(item.value);
                      await window.api.native.saveKeyboardMode(sessionId, item.value).catch(() => {
                      });
                    },
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${curKeyboardMode === item.value ? "text-primary bg-primary/10" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-3 text-center ${curKeyboardMode === item.value ? "" : "opacity-0"}`, children: "✓" }),
                      item.label
                    ]
                  },
                  item.value
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide", children: t2("remote.toggles") }),
                [
                  { label: t2("remote.showRemoteCursor"), opt: "show-remote-cursor" },
                  { label: t2("remote.disableAudio"), opt: "disable-audio" },
                  { label: t2("remote.disableClipboard"), opt: "disable-clipboard" },
                  { label: t2("remote.lockAfterDisconnect"), opt: "lock-after-session-end" },
                  { label: t2("remote.viewOnly"), opt: "view-only" },
                  { label: t2("remote.reverseWheel"), opt: "reverse-mouse-wheel" },
                  { label: t2("remote.swapMouse"), opt: "swap-left-right-mouse" },
                  { label: t2("remote.swapCtrlCmd"), opt: "allow_swap_key" },
                  { label: t2("remote.trueColor"), opt: "i444" },
                  { label: t2("remote.followCursor"), opt: "follow-remote-cursor" },
                  { label: t2("remote.zoomCursor"), opt: "zoom-cursor" }
                ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => handleToggleOption(item.opt),
                    className: "w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-8 h-4 rounded-full relative transition-colors inline-block ${toggleStates[item.opt] ? "bg-primary" : "bg-surface-lighter"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${toggleStates[item.opt] ? "translate-x-4" : "translate-x-0.5"}` }) }),
                      item.label
                    ]
                  },
                  item.opt
                ))
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: actionsRef, className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.actions"), onClick: () => setShowActions(!showActions), active: showActions, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "5", r: "1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "19", r: "1" })
              ] }) }),
              showActions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-full right-0 mt-1 w-52 bg-surface-light border border-surface-lighter rounded-lg shadow-xl py-1 z-20", children: [
                permissions.restart && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => setShowRestartConfirm(true),
                    className: "w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 4v6h-6" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })
                      ] }),
                      t2("remote.restartDevice")
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleToggleBlockInput,
                    className: "w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-8 h-4 rounded-full relative transition-colors inline-block ${blockInput ? "bg-primary" : "bg-surface-lighter"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${blockInput ? "translate-x-4" : "translate-x-0.5"}` }) }),
                      blockInput ? t2("remote.unblockInput") : t2("remote.blockInput")
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleScreenshot,
                    disabled: screenshotCooldown,
                    className: `w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${screenshotCooldown ? "text-text-secondary/50" : "text-text-primary hover:bg-surface-lighter/50"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" })
                      ] }),
                      screenshotCooldown ? t2("remote.screenshotTaking") : t2("remote.screenshot")
                    ]
                  }
                ),
                permissions.recording && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleToggleRecording,
                    className: "w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-2 h-2 rounded-full inline-block ${recording ? "bg-red-500 animate-pulse" : "bg-text-secondary/30"}` }),
                      recording ? t2("remote.recordStop") : t2("remote.recordStart")
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-surface-lighter/30 my-1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleTogglePrivacyMode,
                    className: "w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
                        toggleStates["privacy-mode"] && /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "1", y1: "1", x2: "23", y2: "23" })
                      ] }),
                      t2("remote.privacyMode")
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleElevation,
                    className: "w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) }),
                      t2("remote.elevation")
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: "Ctrl+Alt+Del", onClick: handleCtrlAltDel, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono", children: "C+A+D" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.lockScreen"), onClick: handleLockScreen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.chat"), onClick: () => {
              setShowChat(!showChat);
              setShowFiles(false);
            }, active: showChat, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.fileTransfer"), onClick: () => {
              setShowFiles(!showFiles);
              setShowChat(false);
            }, active: showFiles, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "13 2 13 9 20 9" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToolbarButton, { title: t2("remote.fullscreen"), onClick: handleToggleFullscreen, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ToolbarButton,
              {
                title: toolbarPinned ? t2("remote.unpinToolbar") : t2("remote.pinToolbar"),
                onClick: () => setToolbarPinned(!toolbarPinned),
                active: toolbarPinned,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: toolbarPinned ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "22" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "2", y1: "2", x2: "22", y2: "22" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12", y2: "22" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" })
                ] }) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-5 bg-surface-lighter mx-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => window.api.minimize(),
                className: "w-11 h-9 flex items-center justify-center hover:bg-surface-light transition-colors",
                title: t2("titlebar.minimize"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "1", viewBox: "0 0 10 1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "10", height: "1", fill: "#A0A0B0" }) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleMaximize,
                className: "w-11 h-9 flex items-center justify-center hover:bg-surface-light transition-colors",
                title: maximized ? t2("titlebar.restore") : t2("titlebar.maximize"),
                children: maximized ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 0h8v8h-2v2H0V2h2V0zm1 1v1h5v5h1V1H3zM1 3v6h6V3H1z", fill: "#A0A0B0" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "0", y: "0", width: "10", height: "10", stroke: "#A0A0B0", strokeWidth: "1", fill: "none" }) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => window.api.close(),
                className: "w-11 h-9 flex items-center justify-center hover:bg-red-600 transition-colors",
                title: t2("titlebar.close"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 1l8 8M9 1l-8 8", stroke: "#A0A0B0", strokeWidth: "1.2" }) })
              }
            )
          ] })
        ]
      }
    ),
    !isFullscreen && !toolbarPinned && !toolbarVisible && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-1 bg-primary/30 shrink-0 cursor-pointer hover:h-2 hover:bg-primary/60 transition-all",
        onMouseEnter: () => setToolbarVisible(true)
      }
    ),
    showRestartConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/60 z-30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-surface-light rounded-xl p-6 w-80 border border-surface-lighter shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-text-primary mb-3", children: t2("remote.restartDevice") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-secondary mb-4", children: t2("remote.restartConfirm") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowRestartConfirm(false),
            className: "flex-1 px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary transition-colors text-sm",
            children: t2("remote.cancel")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleRestartDevice,
            className: "flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm transition-colors",
            children: t2("remote.restartDevice")
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative overflow-hidden flex items-center justify-center bg-black", children: [
        status === "connected" && frameInfo && /* @__PURE__ */ jsxRuntimeExports.jsx(RemoteCanvas, { sessionId, frameInfo }),
        status === "connecting" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-text-secondary text-sm", children: [
            usingRelay ? t2("remote.connectingViaRelay") : t2("remote.connectingTo"),
            " ",
            peerId,
            "..."
          ] })
        ] }),
        status === "login_required" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PasswordDialog,
          {
            error,
            onSubmit: login2,
            onCancel: handleDisconnect
          }
        ),
        status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-red-400 text-lg", children: t2("remote.connectionError") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-text-secondary text-sm max-w-md text-center", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => reconnect(),
                className: "px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm transition-colors",
                children: t2("remote.retry")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => reconnect(true),
                className: "px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors",
                children: t2("remote.retryViaRelay")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleDisconnect,
                className: "px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors",
                children: t2("remote.close")
              }
            )
          ] })
        ] }),
        status === "disconnected" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-text-secondary text-lg", children: t2("remote.disconnected") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => reconnect(),
                className: "px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm transition-colors",
                children: t2("remote.reconnect")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleDisconnect,
                className: "px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors",
                children: t2("remote.close")
              }
            )
          ] })
        ] })
      ] }),
      showChat && /* @__PURE__ */ jsxRuntimeExports.jsx(ChatPanel, { sessionId, onClose: () => setShowChat(false) }),
      showFiles && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[520px] shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileTransferPanel, { sessionId, onClose: () => setShowFiles(false) }) })
    ] })
  ] });
}
function StatusBadge({ status }) {
  const t2 = useT();
  const colors = {
    connecting: "bg-yellow-500/20 text-yellow-400",
    connected: "bg-green-500/20 text-green-400",
    login_required: "bg-blue-500/20 text-blue-400",
    disconnected: "bg-gray-500/20 text-gray-400",
    error: "bg-red-500/20 text-red-400"
  };
  const labelKeys = {
    connecting: "remote.status.connecting",
    connected: "remote.status.connected",
    login_required: "remote.status.loginRequired",
    disconnected: "remote.status.disconnected",
    error: "remote.status.error"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] px-2 py-0.5 rounded-full ${colors[status] || colors.disconnected}`, children: t2(labelKeys[status] || status) });
}
function ToolbarButton({ title, onClick, children, active }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      onClick,
      title,
      className: `p-1.5 rounded hover:bg-surface-lighter text-text-secondary hover:text-text-primary transition-colors ${active ? "bg-surface-lighter text-primary" : ""}`,
      children
    }
  );
}
function MainLayout() {
  const initAuth = useAuthStore((s) => s.initFromConfig);
  const loadSettings = useSettingsStore((s) => s.loadFromConfig);
  reactExports.useEffect(() => {
    loadSettings().then(() => initAuth());
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen flex flex-col bg-surface", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TitleBar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Home, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/address-book", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AddressBook, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/accessible", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AccessibleDevices, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/settings", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, {}) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContainer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContextMenuContainer, {})
  ] });
}
function App() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(HashRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/floating-ball", element: /* @__PURE__ */ jsxRuntimeExports.jsx(FloatingBall, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/remote/:peerId", element: /* @__PURE__ */ jsxRuntimeExports.jsx(RemoteDesktop, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, {}) })
  ] }) });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
