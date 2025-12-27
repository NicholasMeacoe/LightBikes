var e = Object.defineProperty,
    t = Object.defineProperties,
    r = Object.getOwnPropertyDescriptors,
    n = Object.getOwnPropertySymbols,
    i = Object.prototype.hasOwnProperty,
    o = Object.prototype.propertyIsEnumerable,
    a = (t, r, n) =>
        r in t ? e(t, r, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (t[r] = n),
    s = (e, t) => {
        for (var r in t || (t = {})) i.call(t, r) && a(e, r, t[r]);
        if (n) for (var r of n(t)) o.call(t, r) && a(e, r, t[r]);
        return e;
    },
    u = (e, n) => t(e, r(n)),
    l = (e, t, r) =>
        new Promise((n, i) => {
            var o = (e) => {
                    try {
                        s(r.next(e));
                    } catch (t) {
                        i(t);
                    }
                },
                a = (e) => {
                    try {
                        s(r.throw(e));
                    } catch (t) {
                        i(t);
                    }
                },
                s = (e) => (e.done ? n(e.value) : Promise.resolve(e.value).then(o, a));
            s((r = r.apply(e, t)).next());
        });
function c(e, t) {
    for (var r = 0; r < t.length; r++) {
        const n = t[r];
        if ('string' != typeof n && !Array.isArray(n))
            for (const t in n)
                if ('default' !== t && !(t in e)) {
                    const r = Object.getOwnPropertyDescriptor(n, t);
                    r &&
                        Object.defineProperty(
                            e,
                            t,
                            r.get ? r : { enumerable: !0, get: () => n[t] }
                        );
                }
    }
    return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }));
}
var f =
    'undefined' != typeof globalThis
        ? globalThis
        : 'undefined' != typeof window
          ? window
          : 'undefined' != typeof global
            ? global
            : 'undefined' != typeof self
              ? self
              : {};
function d(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
function h(e) {
    if (Object.prototype.hasOwnProperty.call(e, '__esModule')) return e;
    var t = e.default;
    if ('function' == typeof t) {
        var r = function e() {
            var r = !1;
            try {
                r = this instanceof e;
            } catch (n) {}
            return r ? Reflect.construct(t, arguments, this.constructor) : t.apply(this, arguments);
        };
        r.prototype = t.prototype;
    } else r = {};
    return (
        Object.defineProperty(r, '__esModule', { value: !0 }),
        Object.keys(e).forEach(function (t) {
            var n = Object.getOwnPropertyDescriptor(e, t);
            Object.defineProperty(
                r,
                t,
                n.get
                    ? n
                    : {
                          enumerable: !0,
                          get: function () {
                              return e[t];
                          },
                      }
            );
        }),
        r
    );
}
var p,
    y,
    m = {},
    g = {};
function b() {
    if (y) return p;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(t, r, i) {
        return (
            (r = o(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, n() ? Reflect.construct(r, i || [], o(t).constructor) : r.apply(t, i))
        );
    }
    function r(e) {
        var t = 'function' == typeof Map ? new Map() : void 0;
        return (
            (r = function (e) {
                if (
                    null === e ||
                    !(function (e) {
                        try {
                            return -1 !== Function.toString.call(e).indexOf('[native code]');
                        } catch (t) {
                            return 'function' == typeof e;
                        }
                    })(e)
                )
                    return e;
                if ('function' != typeof e)
                    throw new TypeError('Super expression must either be null or a function');
                if (void 0 !== t) {
                    if (t.has(e)) return t.get(e);
                    t.set(e, r);
                }
                function r() {
                    return (function (e, t, r) {
                        if (n()) return Reflect.construct.apply(null, arguments);
                        var o = [null];
                        o.push.apply(o, t);
                        var a = new (e.bind.apply(e, o))();
                        return (r && i(a, r.prototype), a);
                    })(e, arguments, o(this).constructor);
                }
                return (
                    (r.prototype = Object.create(e.prototype, {
                        constructor: { value: r, enumerable: !1, writable: !0, configurable: !0 },
                    })),
                    i(r, e)
                );
            }),
            r(e)
        );
    }
    function n() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (n = function () {
            return !!e;
        })();
    }
    function i(e, t) {
        return (i = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    function o(e) {
        return (o = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    y = 1;
    var a = (function (e) {
        function r(e) {
            var n;
            return (
                (function (e, t) {
                    if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                })(this, r),
                (n = t(this, r, [
                    'Format functions must be synchronous taking a two arguments: (info, opts)\nFound: '.concat(
                        e.toString().split('\n')[0],
                        '\n'
                    ),
                ])),
                Error.captureStackTrace(n, r),
                n
            );
        }
        return (
            (function (e, t) {
                if ('function' != typeof t && null !== t)
                    throw new TypeError('Super expression must either be null or a function');
                ((e.prototype = Object.create(t && t.prototype, {
                    constructor: { value: e, writable: !0, configurable: !0 },
                })),
                    Object.defineProperty(e, 'prototype', { writable: !1 }),
                    t && i(e, t));
            })(r, e),
            (n = r),
            Object.defineProperty(n, 'prototype', { writable: !1 }),
            n
        );
        var n;
    })(r(Error));
    return (
        (p = function (e) {
            if (e.length > 2) throw new a(e);
            function t() {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                this.options = e;
            }
            function r(e) {
                return new t(e);
            }
            return ((t.prototype.transform = e), (r.Format = t), r);
        }),
        p
    );
}
var v,
    w,
    _,
    S,
    E,
    k,
    O,
    T,
    M,
    A,
    x,
    P,
    R,
    j,
    C,
    L,
    I,
    D,
    N,
    F,
    B,
    U,
    z,
    G,
    $,
    W,
    H,
    V,
    q,
    Y,
    K,
    J,
    Z,
    X,
    Q,
    ee,
    te,
    re,
    ne,
    ie,
    oe,
    ae,
    se,
    ue,
    le,
    ce,
    fe,
    de,
    he,
    pe,
    ye,
    me,
    ge,
    be,
    ve,
    we,
    _e,
    Se,
    Ee,
    ke,
    Oe,
    Te,
    Me,
    Ae,
    xe,
    Pe,
    Re,
    je,
    Ce,
    Le,
    Ie,
    De,
    Ne,
    Fe,
    Be,
    Ue,
    ze,
    Ge,
    $e,
    We,
    He,
    Ve,
    qe,
    Ye,
    Ke,
    Je,
    Ze,
    Xe,
    Qe,
    et,
    tt = { exports: {} },
    rt = { exports: {} },
    nt = { exports: {} },
    it = {},
    ot = {};
function at() {
    return w
        ? v
        : ((w = 1),
          (v = function () {
              if ('function' != typeof Symbol || 'function' != typeof Object.getOwnPropertySymbols)
                  return !1;
              if ('symbol' == typeof Symbol.iterator) return !0;
              var e = {},
                  t = Symbol('test'),
                  r = Object(t);
              if ('string' == typeof t) return !1;
              if ('[object Symbol]' !== Object.prototype.toString.call(t)) return !1;
              if ('[object Symbol]' !== Object.prototype.toString.call(r)) return !1;
              for (var n in ((e[t] = 42), e)) return !1;
              if ('function' == typeof Object.keys && 0 !== Object.keys(e).length) return !1;
              if (
                  'function' == typeof Object.getOwnPropertyNames &&
                  0 !== Object.getOwnPropertyNames(e).length
              )
                  return !1;
              var i = Object.getOwnPropertySymbols(e);
              if (1 !== i.length || i[0] !== t) return !1;
              if (!Object.prototype.propertyIsEnumerable.call(e, t)) return !1;
              if ('function' == typeof Object.getOwnPropertyDescriptor) {
                  var o = Object.getOwnPropertyDescriptor(e, t);
                  if (42 !== o.value || !0 !== o.enumerable) return !1;
              }
              return !0;
          }));
}
function st() {
    if (S) return _;
    S = 1;
    var e = at();
    return (_ = function () {
        return e() && !!Symbol.toStringTag;
    });
}
function ut() {
    return k ? E : ((k = 1), (E = Object));
}
function lt() {
    return T ? O : ((T = 1), (O = Error));
}
function ct() {
    return A ? M : ((A = 1), (M = EvalError));
}
function ft() {
    return P ? x : ((P = 1), (x = RangeError));
}
function dt() {
    return j ? R : ((j = 1), (R = ReferenceError));
}
function ht() {
    return L ? C : ((L = 1), (C = SyntaxError));
}
function pt() {
    return D ? I : ((D = 1), (I = TypeError));
}
function yt() {
    return F ? N : ((F = 1), (N = URIError));
}
function mt() {
    return U ? B : ((U = 1), (B = Math.abs));
}
function gt() {
    return G ? z : ((G = 1), (z = Math.floor));
}
function bt() {
    return W ? $ : ((W = 1), ($ = Math.max));
}
function vt() {
    return V ? H : ((V = 1), (H = Math.min));
}
function wt() {
    return Y ? q : ((Y = 1), (q = Math.pow));
}
function _t() {
    return J ? K : ((J = 1), (K = Math.round));
}
function St() {
    return X
        ? Z
        : ((X = 1),
          (Z =
              Number.isNaN ||
              function (e) {
                  return e != e;
              }));
}
function Et() {
    if (ee) return Q;
    ee = 1;
    var e = St();
    return (Q = function (t) {
        return e(t) || 0 === t ? t : t < 0 ? -1 : 1;
    });
}
function kt() {
    return re ? te : ((re = 1), (te = Object.getOwnPropertyDescriptor));
}
function Ot() {
    if (ie) return ne;
    ie = 1;
    var e = kt();
    if (e)
        try {
            e([], 'length');
        } catch (t) {
            e = null;
        }
    return (ne = e);
}
function Tt() {
    if (ae) return oe;
    ae = 1;
    var e = Object.defineProperty || !1;
    if (e)
        try {
            e({}, 'a', { value: 1 });
        } catch (t) {
            e = !1;
        }
    return (oe = e);
}
function Mt() {
    return ce
        ? le
        : ((ce = 1), (le = ('undefined' != typeof Reflect && Reflect.getPrototypeOf) || null));
}
function At() {
    return de ? fe : ((de = 1), (fe = ut().getPrototypeOf || null));
}
function xt() {
    if (me) return ye;
    me = 1;
    var e = (function () {
        if (pe) return he;
        pe = 1;
        var e = Object.prototype.toString,
            t = Math.max,
            r = function (e, t) {
                for (var r = [], n = 0; n < e.length; n += 1) r[n] = e[n];
                for (var i = 0; i < t.length; i += 1) r[i + e.length] = t[i];
                return r;
            };
        return (
            (he = function (n) {
                var i = this;
                if ('function' != typeof i || '[object Function]' !== e.apply(i))
                    throw new TypeError('Function.prototype.bind called on incompatible ' + i);
                for (
                    var o,
                        a = (function (e) {
                            for (var t = [], r = 1, n = 0; r < e.length; r += 1, n += 1)
                                t[n] = e[r];
                            return t;
                        })(arguments),
                        s = t(0, i.length - a.length),
                        u = [],
                        l = 0;
                    l < s;
                    l++
                )
                    u[l] = '$' + l;
                if (
                    ((o = Function(
                        'binder',
                        'return function (' +
                            (function (e, t) {
                                for (var r = '', n = 0; n < e.length; n += 1)
                                    ((r += e[n]), n + 1 < e.length && (r += t));
                                return r;
                            })(u, ',') +
                            '){ return binder.apply(this,arguments); }'
                    )(function () {
                        if (this instanceof o) {
                            var e = i.apply(this, r(a, arguments));
                            return Object(e) === e ? e : this;
                        }
                        return i.apply(n, r(a, arguments));
                    })),
                    i.prototype)
                ) {
                    var c = function () {};
                    ((c.prototype = i.prototype), (o.prototype = new c()), (c.prototype = null));
                }
                return o;
            }),
            he
        );
    })();
    return (ye = Function.prototype.bind || e);
}
function Pt() {
    return be ? ge : ((be = 1), (ge = Function.prototype.call));
}
function Rt() {
    return we ? ve : ((we = 1), (ve = Function.prototype.apply));
}
function jt() {
    if (ke) return Ee;
    ke = 1;
    var e = xt(),
        t = Rt(),
        r = Pt(),
        n = Se ? _e : ((Se = 1), (_e = 'undefined' != typeof Reflect && Reflect && Reflect.apply));
    return (Ee = n || e.call(r, t));
}
function Ct() {
    if (Te) return Oe;
    Te = 1;
    var e = xt(),
        t = pt(),
        r = Pt(),
        n = jt();
    return (Oe = function (i) {
        if (i.length < 1 || 'function' != typeof i[0]) throw new t('a function is required');
        return n(e, r, i);
    });
}
function Lt() {
    if (Ae) return Me;
    Ae = 1;
    var e,
        t = Ct(),
        r = Ot();
    try {
        e = [].__proto__ === Array.prototype;
    } catch (a) {
        if (!a || 'object' != typeof a || !('code' in a) || 'ERR_PROTO_ACCESS' !== a.code) throw a;
    }
    var n = !!e && r && r(Object.prototype, '__proto__'),
        i = Object,
        o = i.getPrototypeOf;
    return (Me =
        n && 'function' == typeof n.get
            ? t([n.get])
            : 'function' == typeof o &&
              function (e) {
                  return o(null == e ? e : i(e));
              });
}
function It() {
    if (Pe) return xe;
    Pe = 1;
    var e = Mt(),
        t = At(),
        r = Lt();
    return (xe = e
        ? function (t) {
              return e(t);
          }
        : t
          ? function (e) {
                if (!e || ('object' != typeof e && 'function' != typeof e))
                    throw new TypeError('getProto: not an object');
                return t(e);
            }
          : r
            ? function (e) {
                  return r(e);
              }
            : null);
}
function Dt() {
    if (je) return Re;
    je = 1;
    var e = Function.prototype.call,
        t = Object.prototype.hasOwnProperty,
        r = xt();
    return (Re = r.call(e, t));
}
function Nt() {
    if (Le) return Ce;
    var e;
    Le = 1;
    var t = ut(),
        r = lt(),
        n = ct(),
        i = ft(),
        o = dt(),
        a = ht(),
        s = pt(),
        u = yt(),
        l = mt(),
        c = gt(),
        f = bt(),
        d = vt(),
        h = wt(),
        p = _t(),
        y = Et(),
        m = Function,
        g = function (e) {
            try {
                return m('"use strict"; return (' + e + ').constructor;')();
            } catch (t) {}
        },
        b = Ot(),
        v = Tt(),
        w = function () {
            throw new s();
        },
        _ = b
            ? (function () {
                  try {
                      return w;
                  } catch (e) {
                      try {
                          return b(arguments, 'callee').get;
                      } catch (t) {
                          return w;
                      }
                  }
              })()
            : w,
        S = (function () {
            if (ue) return se;
            ue = 1;
            var e = 'undefined' != typeof Symbol && Symbol,
                t = at();
            return (se = function () {
                return (
                    'function' == typeof e &&
                    'function' == typeof Symbol &&
                    'symbol' == typeof e('foo') &&
                    'symbol' == typeof Symbol('bar') &&
                    t()
                );
            });
        })()(),
        E = It(),
        k = At(),
        O = Mt(),
        T = Rt(),
        M = Pt(),
        A = {},
        x = 'undefined' != typeof Uint8Array && E ? E(Uint8Array) : e,
        P = {
            __proto__: null,
            '%AggregateError%': 'undefined' == typeof AggregateError ? e : AggregateError,
            '%Array%': Array,
            '%ArrayBuffer%': 'undefined' == typeof ArrayBuffer ? e : ArrayBuffer,
            '%ArrayIteratorPrototype%': S && E ? E([][Symbol.iterator]()) : e,
            '%AsyncFromSyncIteratorPrototype%': e,
            '%AsyncFunction%': A,
            '%AsyncGenerator%': A,
            '%AsyncGeneratorFunction%': A,
            '%AsyncIteratorPrototype%': A,
            '%Atomics%': 'undefined' == typeof Atomics ? e : Atomics,
            '%BigInt%': 'undefined' == typeof BigInt ? e : BigInt,
            '%BigInt64Array%': 'undefined' == typeof BigInt64Array ? e : BigInt64Array,
            '%BigUint64Array%': 'undefined' == typeof BigUint64Array ? e : BigUint64Array,
            '%Boolean%': Boolean,
            '%DataView%': 'undefined' == typeof DataView ? e : DataView,
            '%Date%': Date,
            '%decodeURI%': decodeURI,
            '%decodeURIComponent%': decodeURIComponent,
            '%encodeURI%': encodeURI,
            '%encodeURIComponent%': encodeURIComponent,
            '%Error%': r,
            '%eval%': eval,
            '%EvalError%': n,
            '%Float16Array%': 'undefined' == typeof Float16Array ? e : Float16Array,
            '%Float32Array%': 'undefined' == typeof Float32Array ? e : Float32Array,
            '%Float64Array%': 'undefined' == typeof Float64Array ? e : Float64Array,
            '%FinalizationRegistry%':
                'undefined' == typeof FinalizationRegistry ? e : FinalizationRegistry,
            '%Function%': m,
            '%GeneratorFunction%': A,
            '%Int8Array%': 'undefined' == typeof Int8Array ? e : Int8Array,
            '%Int16Array%': 'undefined' == typeof Int16Array ? e : Int16Array,
            '%Int32Array%': 'undefined' == typeof Int32Array ? e : Int32Array,
            '%isFinite%': isFinite,
            '%isNaN%': isNaN,
            '%IteratorPrototype%': S && E ? E(E([][Symbol.iterator]())) : e,
            '%JSON%': 'object' == typeof JSON ? JSON : e,
            '%Map%': 'undefined' == typeof Map ? e : Map,
            '%MapIteratorPrototype%':
                'undefined' != typeof Map && S && E ? E(new Map()[Symbol.iterator]()) : e,
            '%Math%': Math,
            '%Number%': Number,
            '%Object%': t,
            '%Object.getOwnPropertyDescriptor%': b,
            '%parseFloat%': parseFloat,
            '%parseInt%': parseInt,
            '%Promise%': 'undefined' == typeof Promise ? e : Promise,
            '%Proxy%': 'undefined' == typeof Proxy ? e : Proxy,
            '%RangeError%': i,
            '%ReferenceError%': o,
            '%Reflect%': 'undefined' == typeof Reflect ? e : Reflect,
            '%RegExp%': RegExp,
            '%Set%': 'undefined' == typeof Set ? e : Set,
            '%SetIteratorPrototype%':
                'undefined' != typeof Set && S && E ? E(new Set()[Symbol.iterator]()) : e,
            '%SharedArrayBuffer%': 'undefined' == typeof SharedArrayBuffer ? e : SharedArrayBuffer,
            '%String%': String,
            '%StringIteratorPrototype%': S && E ? E(''[Symbol.iterator]()) : e,
            '%Symbol%': S ? Symbol : e,
            '%SyntaxError%': a,
            '%ThrowTypeError%': _,
            '%TypedArray%': x,
            '%TypeError%': s,
            '%Uint8Array%': 'undefined' == typeof Uint8Array ? e : Uint8Array,
            '%Uint8ClampedArray%': 'undefined' == typeof Uint8ClampedArray ? e : Uint8ClampedArray,
            '%Uint16Array%': 'undefined' == typeof Uint16Array ? e : Uint16Array,
            '%Uint32Array%': 'undefined' == typeof Uint32Array ? e : Uint32Array,
            '%URIError%': u,
            '%WeakMap%': 'undefined' == typeof WeakMap ? e : WeakMap,
            '%WeakRef%': 'undefined' == typeof WeakRef ? e : WeakRef,
            '%WeakSet%': 'undefined' == typeof WeakSet ? e : WeakSet,
            '%Function.prototype.call%': M,
            '%Function.prototype.apply%': T,
            '%Object.defineProperty%': v,
            '%Object.getPrototypeOf%': k,
            '%Math.abs%': l,
            '%Math.floor%': c,
            '%Math.max%': f,
            '%Math.min%': d,
            '%Math.pow%': h,
            '%Math.round%': p,
            '%Math.sign%': y,
            '%Reflect.getPrototypeOf%': O,
        };
    if (E)
        try {
            null.error;
        } catch (W) {
            var R = E(E(W));
            P['%Error.prototype%'] = R;
        }
    var j = function e(t) {
            var r;
            if ('%AsyncFunction%' === t) r = g('async function () {}');
            else if ('%GeneratorFunction%' === t) r = g('function* () {}');
            else if ('%AsyncGeneratorFunction%' === t) r = g('async function* () {}');
            else if ('%AsyncGenerator%' === t) {
                var n = e('%AsyncGeneratorFunction%');
                n && (r = n.prototype);
            } else if ('%AsyncIteratorPrototype%' === t) {
                var i = e('%AsyncGenerator%');
                i && E && (r = E(i.prototype));
            }
            return ((P[t] = r), r);
        },
        C = {
            __proto__: null,
            '%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
            '%ArrayPrototype%': ['Array', 'prototype'],
            '%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
            '%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
            '%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
            '%ArrayProto_values%': ['Array', 'prototype', 'values'],
            '%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
            '%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
            '%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
            '%BooleanPrototype%': ['Boolean', 'prototype'],
            '%DataViewPrototype%': ['DataView', 'prototype'],
            '%DatePrototype%': ['Date', 'prototype'],
            '%ErrorPrototype%': ['Error', 'prototype'],
            '%EvalErrorPrototype%': ['EvalError', 'prototype'],
            '%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
            '%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
            '%FunctionPrototype%': ['Function', 'prototype'],
            '%Generator%': ['GeneratorFunction', 'prototype'],
            '%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
            '%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
            '%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
            '%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
            '%JSONParse%': ['JSON', 'parse'],
            '%JSONStringify%': ['JSON', 'stringify'],
            '%MapPrototype%': ['Map', 'prototype'],
            '%NumberPrototype%': ['Number', 'prototype'],
            '%ObjectPrototype%': ['Object', 'prototype'],
            '%ObjProto_toString%': ['Object', 'prototype', 'toString'],
            '%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
            '%PromisePrototype%': ['Promise', 'prototype'],
            '%PromiseProto_then%': ['Promise', 'prototype', 'then'],
            '%Promise_all%': ['Promise', 'all'],
            '%Promise_reject%': ['Promise', 'reject'],
            '%Promise_resolve%': ['Promise', 'resolve'],
            '%RangeErrorPrototype%': ['RangeError', 'prototype'],
            '%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
            '%RegExpPrototype%': ['RegExp', 'prototype'],
            '%SetPrototype%': ['Set', 'prototype'],
            '%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
            '%StringPrototype%': ['String', 'prototype'],
            '%SymbolPrototype%': ['Symbol', 'prototype'],
            '%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
            '%TypedArrayPrototype%': ['TypedArray', 'prototype'],
            '%TypeErrorPrototype%': ['TypeError', 'prototype'],
            '%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
            '%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
            '%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
            '%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
            '%URIErrorPrototype%': ['URIError', 'prototype'],
            '%WeakMapPrototype%': ['WeakMap', 'prototype'],
            '%WeakSetPrototype%': ['WeakSet', 'prototype'],
        },
        L = xt(),
        I = Dt(),
        D = L.call(M, Array.prototype.concat),
        N = L.call(T, Array.prototype.splice),
        F = L.call(M, String.prototype.replace),
        B = L.call(M, String.prototype.slice),
        U = L.call(M, RegExp.prototype.exec),
        z =
            /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g,
        G = /\\(\\)?/g,
        $ = function (e, t) {
            var r,
                n = e;
            if ((I(C, n) && (n = '%' + (r = C[n])[0] + '%'), I(P, n))) {
                var i = P[n];
                if ((i === A && (i = j(n)), void 0 === i && !t))
                    throw new s(
                        'intrinsic ' + e + ' exists, but is not available. Please file an issue!'
                    );
                return { alias: r, name: n, value: i };
            }
            throw new a('intrinsic ' + e + ' does not exist!');
        };
    return (
        (Ce = function (e, t) {
            if ('string' != typeof e || 0 === e.length)
                throw new s('intrinsic name must be a non-empty string');
            if (arguments.length > 1 && 'boolean' != typeof t)
                throw new s('"allowMissing" argument must be a boolean');
            if (null === U(/^%?[^%]*%?$/, e))
                throw new a(
                    '`%` may not be present anywhere but at the beginning and end of the intrinsic name'
                );
            var r = (function (e) {
                    var t = B(e, 0, 1),
                        r = B(e, -1);
                    if ('%' === t && '%' !== r)
                        throw new a('invalid intrinsic syntax, expected closing `%`');
                    if ('%' === r && '%' !== t)
                        throw new a('invalid intrinsic syntax, expected opening `%`');
                    var n = [];
                    return (
                        F(e, z, function (e, t, r, i) {
                            n[n.length] = r ? F(i, G, '$1') : t || e;
                        }),
                        n
                    );
                })(e),
                n = r.length > 0 ? r[0] : '',
                i = $('%' + n + '%', t),
                o = i.name,
                u = i.value,
                l = !1,
                c = i.alias;
            c && ((n = c[0]), N(r, D([0, 1], c)));
            for (var f = 1, d = !0; f < r.length; f += 1) {
                var h = r[f],
                    p = B(h, 0, 1),
                    y = B(h, -1);
                if (
                    ('"' === p || "'" === p || '`' === p || '"' === y || "'" === y || '`' === y) &&
                    p !== y
                )
                    throw new a('property names with quotes must have matching quotes');
                if (
                    (('constructor' !== h && d) || (l = !0), I(P, (o = '%' + (n += '.' + h) + '%')))
                )
                    u = P[o];
                else if (null != u) {
                    if (!(h in u)) {
                        if (!t)
                            throw new s(
                                'base intrinsic for ' +
                                    e +
                                    ' exists, but the property is not available.'
                            );
                        return;
                    }
                    if (b && f + 1 >= r.length) {
                        var m = b(u, h);
                        u = (d = !!m) && 'get' in m && !('originalValue' in m.get) ? m.get : u[h];
                    } else ((d = I(u, h)), (u = u[h]));
                    d && !l && (P[o] = u);
                }
            }
            return u;
        }),
        Ce
    );
}
function Ft() {
    if (De) return Ie;
    De = 1;
    var e = Nt(),
        t = Ct(),
        r = t([e('%String.prototype.indexOf%')]);
    return (Ie = function (n, i) {
        var o = e(n, !!i);
        return 'function' == typeof o && r(n, '.prototype.') > -1 ? t([o]) : o;
    });
}
function Bt() {
    if (Fe) return Ne;
    Fe = 1;
    var e = st()(),
        t = Ft()('Object.prototype.toString'),
        r = function (r) {
            return (
                !(e && r && 'object' == typeof r && Symbol.toStringTag in r) &&
                '[object Arguments]' === t(r)
            );
        },
        n = function (e) {
            return (
                !!r(e) ||
                (null !== e &&
                    'object' == typeof e &&
                    'length' in e &&
                    'number' == typeof e.length &&
                    e.length >= 0 &&
                    '[object Array]' !== t(e) &&
                    'callee' in e &&
                    '[object Function]' === t(e.callee))
            );
        },
        i = (function () {
            return r(arguments);
        })();
    return ((r.isLegacyArguments = n), (Ne = i ? r : n));
}
function Ut() {
    if (Ge) return ze;
    Ge = 1;
    var e = Ft(),
        t = (function () {
            if (Ue) return Be;
            Ue = 1;
            var e,
                t = Ft(),
                r = st()(),
                n = Dt(),
                i = Ot();
            if (r) {
                var o = t('RegExp.prototype.exec'),
                    a = {},
                    s = function () {
                        throw a;
                    },
                    u = { toString: s, valueOf: s };
                ('symbol' == typeof Symbol.toPrimitive && (u[Symbol.toPrimitive] = s),
                    (e = function (e) {
                        if (!e || 'object' != typeof e) return !1;
                        var t = i(e, 'lastIndex');
                        if (!t || !n(t, 'value')) return !1;
                        try {
                            o(e, u);
                        } catch (r) {
                            return r === a;
                        }
                    }));
            } else {
                var l = t('Object.prototype.toString');
                e = function (e) {
                    return (
                        !(!e || ('object' != typeof e && 'function' != typeof e)) &&
                        '[object RegExp]' === l(e)
                    );
                };
            }
            return (Be = e);
        })(),
        r = e('RegExp.prototype.exec'),
        n = pt();
    return (ze = function (e) {
        if (!t(e)) throw new n('`regex` must be a RegExp');
        return function (t) {
            return null !== r(e, t);
        };
    });
}
function zt() {
    if (We) return $e;
    We = 1;
    const e = function* () {}.constructor;
    return ($e = () => e);
}
function Gt() {
    if (Je) return Ke;
    Je = 1;
    var e = (function () {
            if (Ye) return qe;
            Ye = 1;
            var e,
                t,
                r = Function.prototype.toString,
                n = 'object' == typeof Reflect && null !== Reflect && Reflect.apply;
            if ('function' == typeof n && 'function' == typeof Object.defineProperty)
                try {
                    ((e = Object.defineProperty({}, 'length', {
                        get: function () {
                            throw t;
                        },
                    })),
                        (t = {}),
                        n(
                            function () {
                                throw 42;
                            },
                            null,
                            e
                        ));
                } catch (d) {
                    d !== t && (n = null);
                }
            else n = null;
            var i = /^\s*class\b/,
                o = function (e) {
                    try {
                        var t = r.call(e);
                        return i.test(t);
                    } catch (n) {
                        return !1;
                    }
                },
                a = function (e) {
                    try {
                        return !o(e) && (r.call(e), !0);
                    } catch (t) {
                        return !1;
                    }
                },
                s = Object.prototype.toString,
                u = 'function' == typeof Symbol && !!Symbol.toStringTag,
                l = !(0 in [,]),
                c = function () {
                    return !1;
                };
            if ('object' == typeof document) {
                var f = document.all;
                s.call(f) === s.call(document.all) &&
                    (c = function (e) {
                        if ((l || !e) && (void 0 === e || 'object' == typeof e))
                            try {
                                var t = s.call(e);
                                return (
                                    ('[object HTMLAllCollection]' === t ||
                                        '[object HTML document.all class]' === t ||
                                        '[object HTMLCollection]' === t ||
                                        '[object Object]' === t) &&
                                    null == e('')
                                );
                            } catch (r) {}
                        return !1;
                    });
            }
            return (qe = n
                ? function (r) {
                      if (c(r)) return !0;
                      if (!r) return !1;
                      if ('function' != typeof r && 'object' != typeof r) return !1;
                      try {
                          n(r, null, e);
                      } catch (i) {
                          if (i !== t) return !1;
                      }
                      return !o(r) && a(r);
                  }
                : function (e) {
                      if (c(e)) return !0;
                      if (!e) return !1;
                      if ('function' != typeof e && 'object' != typeof e) return !1;
                      if (u) return a(e);
                      if (o(e)) return !1;
                      var t = s.call(e);
                      return (
                          !(
                              '[object Function]' !== t &&
                              '[object GeneratorFunction]' !== t &&
                              !/^\[object HTML/.test(t)
                          ) && a(e)
                      );
                  });
        })(),
        t = Object.prototype.toString,
        r = Object.prototype.hasOwnProperty;
    return (
        (Ke = function (n, i, o) {
            if (!e(i)) throw new TypeError('iterator must be a function');
            var a, s;
            (arguments.length >= 3 && (a = o),
                (s = n),
                '[object Array]' === t.call(s)
                    ? (function (e, t, n) {
                          for (var i = 0, o = e.length; i < o; i++)
                              r.call(e, i) && (null == n ? t(e[i], i, e) : t.call(n, e[i], i, e));
                      })(n, i, a)
                    : 'string' == typeof n
                      ? (function (e, t, r) {
                            for (var n = 0, i = e.length; n < i; n++)
                                null == r ? t(e.charAt(n), n, e) : t.call(r, e.charAt(n), n, e);
                        })(n, i, a)
                      : (function (e, t, n) {
                            for (var i in e)
                                r.call(e, i) && (null == n ? t(e[i], i, e) : t.call(n, e[i], i, e));
                        })(n, i, a));
        }),
        Ke
    );
}
function $t() {
    return Xe
        ? Ze
        : ((Xe = 1),
          (Ze = [
              'Float16Array',
              'Float32Array',
              'Float64Array',
              'Int8Array',
              'Int16Array',
              'Int32Array',
              'Uint8Array',
              'Uint8ClampedArray',
              'Uint16Array',
              'Uint32Array',
              'BigInt64Array',
              'BigUint64Array',
          ]));
}
function Wt() {
    if (et) return Qe;
    et = 1;
    var e = $t(),
        t = 'undefined' == typeof globalThis ? f : globalThis;
    return (Qe = function () {
        for (var r = [], n = 0; n < e.length; n++)
            'function' == typeof t[e[n]] && (r[r.length] = e[n]);
        return r;
    });
}
var Ht,
    Vt,
    qt,
    Yt,
    Kt,
    Jt,
    Zt,
    Xt,
    Qt,
    er,
    tr,
    rr,
    nr,
    ir,
    or,
    ar,
    sr = { exports: {} };
function ur() {
    if (Vt) return Ht;
    Vt = 1;
    var e = Tt(),
        t = ht(),
        r = pt(),
        n = Ot();
    return (
        (Ht = function (i, o, a) {
            if (!i || ('object' != typeof i && 'function' != typeof i))
                throw new r('`obj` must be an object or a function`');
            if ('string' != typeof o && 'symbol' != typeof o)
                throw new r('`property` must be a string or a symbol`');
            if (arguments.length > 3 && 'boolean' != typeof arguments[3] && null !== arguments[3])
                throw new r('`nonEnumerable`, if provided, must be a boolean or null');
            if (arguments.length > 4 && 'boolean' != typeof arguments[4] && null !== arguments[4])
                throw new r('`nonWritable`, if provided, must be a boolean or null');
            if (arguments.length > 5 && 'boolean' != typeof arguments[5] && null !== arguments[5])
                throw new r('`nonConfigurable`, if provided, must be a boolean or null');
            if (arguments.length > 6 && 'boolean' != typeof arguments[6])
                throw new r('`loose`, if provided, must be a boolean');
            var s = arguments.length > 3 ? arguments[3] : null,
                u = arguments.length > 4 ? arguments[4] : null,
                l = arguments.length > 5 ? arguments[5] : null,
                c = arguments.length > 6 && arguments[6],
                f = !!n && n(i, o);
            if (e)
                e(i, o, {
                    configurable: null === l && f ? f.configurable : !l,
                    enumerable: null === s && f ? f.enumerable : !s,
                    value: a,
                    writable: null === u && f ? f.writable : !u,
                });
            else {
                if (!c && (s || u || l))
                    throw new t(
                        'This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.'
                    );
                i[o] = a;
            }
        }),
        Ht
    );
}
function lr() {
    if (Yt) return qt;
    Yt = 1;
    var e = Tt(),
        t = function () {
            return !!e;
        };
    return (
        (t.hasArrayLengthDefineBug = function () {
            if (!e) return null;
            try {
                return 1 !== e([], 'length', { value: 1 }).length;
            } catch (t) {
                return !0;
            }
        }),
        (qt = t)
    );
}
function cr() {
    if (Jt) return Kt;
    Jt = 1;
    var e = Nt(),
        t = ur(),
        r = lr()(),
        n = Ot(),
        i = pt(),
        o = e('%Math.floor%');
    return (
        (Kt = function (e, a) {
            if ('function' != typeof e) throw new i('`fn` is not a function');
            if ('number' != typeof a || a < 0 || a > 4294967295 || o(a) !== a)
                throw new i('`length` must be a positive 32-bit integer');
            var s = arguments.length > 2 && !!arguments[2],
                u = !0,
                l = !0;
            if ('length' in e && n) {
                var c = n(e, 'length');
                (c && !c.configurable && (u = !1), c && !c.writable && (l = !1));
            }
            return ((u || l || !s) && (r ? t(e, 'length', a, !0, !0) : t(e, 'length', a)), e);
        }),
        Kt
    );
}
function fr() {
    return (
        Qt ||
            ((Qt = 1),
            (e = sr),
            (t = cr()),
            (r = Tt()),
            (n = Ct()),
            (i = (function () {
                if (Xt) return Zt;
                Xt = 1;
                var e = xt(),
                    t = Rt(),
                    r = jt();
                return (
                    (Zt = function () {
                        return r(e, t, arguments);
                    }),
                    Zt
                );
            })()),
            (e.exports = function (e) {
                var r = n(arguments),
                    i = e.length - (arguments.length - 1);
                return t(r, 1 + (i > 0 ? i : 0), !0);
            }),
            r ? r(e.exports, 'apply', { value: i }) : (e.exports.apply = i)),
        sr.exports
    );
    var e, t, r, n, i;
}
function dr() {
    if (tr) return er;
    tr = 1;
    var e = Gt(),
        t = Wt(),
        r = fr(),
        n = Ft(),
        i = Ot(),
        o = It(),
        a = n('Object.prototype.toString'),
        s = st()(),
        u = 'undefined' == typeof globalThis ? f : globalThis,
        l = t(),
        c = n('String.prototype.slice'),
        d =
            n('Array.prototype.indexOf', !0) ||
            function (e, t) {
                for (var r = 0; r < e.length; r += 1) if (e[r] === t) return r;
                return -1;
            },
        h = { __proto__: null };
    e(
        l,
        s && i && o
            ? function (e) {
                  var t = new u[e]();
                  if (Symbol.toStringTag in t && o) {
                      var n = o(t),
                          a = i(n, Symbol.toStringTag);
                      if (!a && n) {
                          var s = o(n);
                          a = i(s, Symbol.toStringTag);
                      }
                      h['$' + e] = r(a.get);
                  }
              }
            : function (e) {
                  var t = new u[e](),
                      n = t.slice || t.set;
                  n && (h['$' + e] = r(n));
              }
    );
    return (er = function (t) {
        if (!t || 'object' != typeof t) return !1;
        if (!s) {
            var r = c(a(t), 8, -1);
            return d(l, r) > -1
                ? r
                : 'Object' === r &&
                      (function (t) {
                          var r = !1;
                          return (
                              e(h, function (e, n) {
                                  if (!r)
                                      try {
                                          (e(t), (r = c(n, 1)));
                                      } catch (i) {}
                              }),
                              r
                          );
                      })(t);
        }
        return i
            ? (function (t) {
                  var r = !1;
                  return (
                      e(h, function (e, n) {
                          if (!r)
                              try {
                                  '$' + e(t) === n && (r = c(n, 1));
                              } catch (i) {}
                      }),
                      r
                  );
              })(t)
            : null;
    });
}
function hr() {
    if (nr) return rr;
    nr = 1;
    var e = dr();
    return (rr = function (t) {
        return !!e(t);
    });
}
function pr() {
    return (
        ir ||
            ((ir = 1),
            (function (e) {
                var t = Bt(),
                    r = (function () {
                        if (Ve) return He;
                        Ve = 1;
                        var e = Ft(),
                            t = Ut()(/^\s*(?:function)?\*/),
                            r = st()(),
                            n = It(),
                            i = e('Object.prototype.toString'),
                            o = e('Function.prototype.toString'),
                            a = zt();
                        return (He = function (e) {
                            if ('function' != typeof e) return !1;
                            if (t(o(e))) return !0;
                            if (!r) return '[object GeneratorFunction]' === i(e);
                            if (!n) return !1;
                            var s = a();
                            return s && n(e) === s.prototype;
                        });
                    })(),
                    n = dr(),
                    i = hr();
                function o(e) {
                    return e.call.bind(e);
                }
                var a = 'undefined' != typeof BigInt,
                    s = 'undefined' != typeof Symbol,
                    u = o(Object.prototype.toString),
                    l = o(Number.prototype.valueOf),
                    c = o(String.prototype.valueOf),
                    f = o(Boolean.prototype.valueOf);
                if (a) var d = o(BigInt.prototype.valueOf);
                if (s) var h = o(Symbol.prototype.valueOf);
                function p(e, t) {
                    if ('object' != typeof e) return !1;
                    try {
                        return (t(e), !0);
                    } catch (r) {
                        return !1;
                    }
                }
                function y(e) {
                    return '[object Map]' === u(e);
                }
                function m(e) {
                    return '[object Set]' === u(e);
                }
                function g(e) {
                    return '[object WeakMap]' === u(e);
                }
                function b(e) {
                    return '[object WeakSet]' === u(e);
                }
                function v(e) {
                    return '[object ArrayBuffer]' === u(e);
                }
                function w(e) {
                    return (
                        'undefined' != typeof ArrayBuffer &&
                        (v.working ? v(e) : e instanceof ArrayBuffer)
                    );
                }
                function _(e) {
                    return '[object DataView]' === u(e);
                }
                function S(e) {
                    return (
                        'undefined' != typeof DataView && (_.working ? _(e) : e instanceof DataView)
                    );
                }
                ((e.isArgumentsObject = t),
                    (e.isGeneratorFunction = r),
                    (e.isTypedArray = i),
                    (e.isPromise = function (e) {
                        return (
                            ('undefined' != typeof Promise && e instanceof Promise) ||
                            (null !== e &&
                                'object' == typeof e &&
                                'function' == typeof e.then &&
                                'function' == typeof e.catch)
                        );
                    }),
                    (e.isArrayBufferView = function (e) {
                        return 'undefined' != typeof ArrayBuffer && ArrayBuffer.isView
                            ? ArrayBuffer.isView(e)
                            : i(e) || S(e);
                    }),
                    (e.isUint8Array = function (e) {
                        return 'Uint8Array' === n(e);
                    }),
                    (e.isUint8ClampedArray = function (e) {
                        return 'Uint8ClampedArray' === n(e);
                    }),
                    (e.isUint16Array = function (e) {
                        return 'Uint16Array' === n(e);
                    }),
                    (e.isUint32Array = function (e) {
                        return 'Uint32Array' === n(e);
                    }),
                    (e.isInt8Array = function (e) {
                        return 'Int8Array' === n(e);
                    }),
                    (e.isInt16Array = function (e) {
                        return 'Int16Array' === n(e);
                    }),
                    (e.isInt32Array = function (e) {
                        return 'Int32Array' === n(e);
                    }),
                    (e.isFloat32Array = function (e) {
                        return 'Float32Array' === n(e);
                    }),
                    (e.isFloat64Array = function (e) {
                        return 'Float64Array' === n(e);
                    }),
                    (e.isBigInt64Array = function (e) {
                        return 'BigInt64Array' === n(e);
                    }),
                    (e.isBigUint64Array = function (e) {
                        return 'BigUint64Array' === n(e);
                    }),
                    (y.working = 'undefined' != typeof Map && y(new Map())),
                    (e.isMap = function (e) {
                        return 'undefined' != typeof Map && (y.working ? y(e) : e instanceof Map);
                    }),
                    (m.working = 'undefined' != typeof Set && m(new Set())),
                    (e.isSet = function (e) {
                        return 'undefined' != typeof Set && (m.working ? m(e) : e instanceof Set);
                    }),
                    (g.working = 'undefined' != typeof WeakMap && g(new WeakMap())),
                    (e.isWeakMap = function (e) {
                        return (
                            'undefined' != typeof WeakMap &&
                            (g.working ? g(e) : e instanceof WeakMap)
                        );
                    }),
                    (b.working = 'undefined' != typeof WeakSet && b(new WeakSet())),
                    (e.isWeakSet = function (e) {
                        return b(e);
                    }),
                    (v.working = 'undefined' != typeof ArrayBuffer && v(new ArrayBuffer())),
                    (e.isArrayBuffer = w),
                    (_.working =
                        'undefined' != typeof ArrayBuffer &&
                        'undefined' != typeof DataView &&
                        _(new DataView(new ArrayBuffer(1), 0, 1))),
                    (e.isDataView = S));
                var E = 'undefined' != typeof SharedArrayBuffer ? SharedArrayBuffer : void 0;
                function k(e) {
                    return '[object SharedArrayBuffer]' === u(e);
                }
                function O(e) {
                    return (
                        void 0 !== E &&
                        (void 0 === k.working && (k.working = k(new E())),
                        k.working ? k(e) : e instanceof E)
                    );
                }
                function T(e) {
                    return p(e, l);
                }
                function M(e) {
                    return p(e, c);
                }
                function A(e) {
                    return p(e, f);
                }
                function x(e) {
                    return a && p(e, d);
                }
                function P(e) {
                    return s && p(e, h);
                }
                ((e.isSharedArrayBuffer = O),
                    (e.isAsyncFunction = function (e) {
                        return '[object AsyncFunction]' === u(e);
                    }),
                    (e.isMapIterator = function (e) {
                        return '[object Map Iterator]' === u(e);
                    }),
                    (e.isSetIterator = function (e) {
                        return '[object Set Iterator]' === u(e);
                    }),
                    (e.isGeneratorObject = function (e) {
                        return '[object Generator]' === u(e);
                    }),
                    (e.isWebAssemblyCompiledModule = function (e) {
                        return '[object WebAssembly.Module]' === u(e);
                    }),
                    (e.isNumberObject = T),
                    (e.isStringObject = M),
                    (e.isBooleanObject = A),
                    (e.isBigIntObject = x),
                    (e.isSymbolObject = P),
                    (e.isBoxedPrimitive = function (e) {
                        return T(e) || M(e) || A(e) || x(e) || P(e);
                    }),
                    (e.isAnyArrayBuffer = function (e) {
                        return 'undefined' != typeof Uint8Array && (w(e) || O(e));
                    }),
                    ['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function (t) {
                        Object.defineProperty(e, t, {
                            enumerable: !1,
                            value: function () {
                                throw new Error(t + ' is not supported in userland');
                            },
                        });
                    }));
            })(ot)),
        ot
    );
}
var yr,
    mr,
    gr = { exports: {} };
function br() {
    return (
        yr ||
            ((yr = 1),
            'function' == typeof Object.create
                ? (gr.exports = function (e, t) {
                      t &&
                          ((e.super_ = t),
                          (e.prototype = Object.create(t.prototype, {
                              constructor: {
                                  value: e,
                                  enumerable: !1,
                                  writable: !0,
                                  configurable: !0,
                              },
                          })));
                  })
                : (gr.exports = function (e, t) {
                      if (t) {
                          e.super_ = t;
                          var r = function () {};
                          ((r.prototype = t.prototype),
                              (e.prototype = new r()),
                              (e.prototype.constructor = e));
                      }
                  })),
        gr.exports
    );
}
function vr() {
    return (
        mr ||
            ((mr = 1),
            (function (e) {
                var t = {},
                    r =
                        Object.getOwnPropertyDescriptors ||
                        function (e) {
                            for (var t = Object.keys(e), r = {}, n = 0; n < t.length; n++)
                                r[t[n]] = Object.getOwnPropertyDescriptor(e, t[n]);
                            return r;
                        },
                    n = /%[sdj%]/g;
                ((e.format = function (e) {
                    if (!g(e)) {
                        for (var t = [], r = 0; r < arguments.length; r++) t.push(s(arguments[r]));
                        return t.join(' ');
                    }
                    r = 1;
                    for (
                        var i = arguments,
                            o = i.length,
                            a = String(e).replace(n, function (e) {
                                if ('%%' === e) return '%';
                                if (r >= o) return e;
                                switch (e) {
                                    case '%s':
                                        return String(i[r++]);
                                    case '%d':
                                        return Number(i[r++]);
                                    case '%j':
                                        try {
                                            return JSON.stringify(i[r++]);
                                        } catch (t) {
                                            return '[Circular]';
                                        }
                                    default:
                                        return e;
                                }
                            }),
                            u = i[r];
                        r < o;
                        u = i[++r]
                    )
                        y(u) || !w(u) ? (a += ' ' + u) : (a += ' ' + s(u));
                    return a;
                }),
                    (e.deprecate = function (t, r) {
                        if ('undefined' != typeof process && !0 === process.noDeprecation) return t;
                        if ('undefined' == typeof process)
                            return function () {
                                return e.deprecate(t, r).apply(this, arguments);
                            };
                        var n = !1;
                        return function () {
                            if (!n) {
                                if (process.throwDeprecation) throw new Error(r);
                                (process.traceDeprecation, (n = !0));
                            }
                            return t.apply(this, arguments);
                        };
                    }));
                var i = {},
                    o = /^$/;
                if (t.NODE_DEBUG) {
                    var a = t.NODE_DEBUG;
                    ((a = a
                        .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
                        .replace(/\*/g, '.*')
                        .replace(/,/g, '$|^')
                        .toUpperCase()),
                        (o = new RegExp('^' + a + '$', 'i')));
                }
                function s(t, r) {
                    var n = { seen: [], stylize: l };
                    return (
                        arguments.length >= 3 && (n.depth = arguments[2]),
                        arguments.length >= 4 && (n.colors = arguments[3]),
                        p(r) ? (n.showHidden = r) : r && e._extend(n, r),
                        b(n.showHidden) && (n.showHidden = !1),
                        b(n.depth) && (n.depth = 2),
                        b(n.colors) && (n.colors = !1),
                        b(n.customInspect) && (n.customInspect = !0),
                        n.colors && (n.stylize = u),
                        c(n, t, n.depth)
                    );
                }
                function u(e, t) {
                    var r = s.styles[t];
                    return r ? '[' + s.colors[r][0] + 'm' + e + '[' + s.colors[r][1] + 'm' : e;
                }
                function l(e, t) {
                    return e;
                }
                function c(t, r, n) {
                    if (
                        t.customInspect &&
                        r &&
                        E(r.inspect) &&
                        r.inspect !== e.inspect &&
                        (!r.constructor || r.constructor.prototype !== r)
                    ) {
                        var i = r.inspect(n, t);
                        return (g(i) || (i = c(t, i, n)), i);
                    }
                    var o = (function (e, t) {
                        if (b(t)) return e.stylize('undefined', 'undefined');
                        if (g(t)) {
                            var r =
                                "'" +
                                JSON.stringify(t)
                                    .replace(/^"|"$/g, '')
                                    .replace(/'/g, "\\'")
                                    .replace(/\\"/g, '"') +
                                "'";
                            return e.stylize(r, 'string');
                        }
                        if (m(t)) return e.stylize('' + t, 'number');
                        if (p(t)) return e.stylize('' + t, 'boolean');
                        if (y(t)) return e.stylize('null', 'null');
                    })(t, r);
                    if (o) return o;
                    var a = Object.keys(r),
                        s = (function (e) {
                            var t = {};
                            return (
                                e.forEach(function (e, r) {
                                    t[e] = !0;
                                }),
                                t
                            );
                        })(a);
                    if (
                        (t.showHidden && (a = Object.getOwnPropertyNames(r)),
                        S(r) && (a.indexOf('message') >= 0 || a.indexOf('description') >= 0))
                    )
                        return f(r);
                    if (0 === a.length) {
                        if (E(r)) {
                            var u = r.name ? ': ' + r.name : '';
                            return t.stylize('[Function' + u + ']', 'special');
                        }
                        if (v(r)) return t.stylize(RegExp.prototype.toString.call(r), 'regexp');
                        if (_(r)) return t.stylize(Date.prototype.toString.call(r), 'date');
                        if (S(r)) return f(r);
                    }
                    var l,
                        w = '',
                        k = !1,
                        T = ['{', '}'];
                    (h(r) && ((k = !0), (T = ['[', ']'])), E(r)) &&
                        (w = ' [Function' + (r.name ? ': ' + r.name : '') + ']');
                    return (
                        v(r) && (w = ' ' + RegExp.prototype.toString.call(r)),
                        _(r) && (w = ' ' + Date.prototype.toUTCString.call(r)),
                        S(r) && (w = ' ' + f(r)),
                        0 !== a.length || (k && 0 != r.length)
                            ? n < 0
                                ? v(r)
                                    ? t.stylize(RegExp.prototype.toString.call(r), 'regexp')
                                    : t.stylize('[Object]', 'special')
                                : (t.seen.push(r),
                                  (l = k
                                      ? (function (e, t, r, n, i) {
                                            for (var o = [], a = 0, s = t.length; a < s; ++a)
                                                O(t, String(a))
                                                    ? o.push(d(e, t, r, n, String(a), !0))
                                                    : o.push('');
                                            return (
                                                i.forEach(function (i) {
                                                    i.match(/^\d+$/) ||
                                                        o.push(d(e, t, r, n, i, !0));
                                                }),
                                                o
                                            );
                                        })(t, r, n, s, a)
                                      : a.map(function (e) {
                                            return d(t, r, n, s, e, k);
                                        })),
                                  t.seen.pop(),
                                  (function (e, t, r) {
                                      var n = e.reduce(function (e, t) {
                                          return (
                                              t.indexOf('\n'),
                                              e + t.replace(/\u001b\[\d\d?m/g, '').length + 1
                                          );
                                      }, 0);
                                      if (n > 60)
                                          return (
                                              r[0] +
                                              ('' === t ? '' : t + '\n ') +
                                              ' ' +
                                              e.join(',\n  ') +
                                              ' ' +
                                              r[1]
                                          );
                                      return r[0] + t + ' ' + e.join(', ') + ' ' + r[1];
                                  })(l, w, T))
                            : T[0] + w + T[1]
                    );
                }
                function f(e) {
                    return '[' + Error.prototype.toString.call(e) + ']';
                }
                function d(e, t, r, n, i, o) {
                    var a, s, u;
                    if (
                        ((u = Object.getOwnPropertyDescriptor(t, i) || { value: t[i] }).get
                            ? (s = u.set
                                  ? e.stylize('[Getter/Setter]', 'special')
                                  : e.stylize('[Getter]', 'special'))
                            : u.set && (s = e.stylize('[Setter]', 'special')),
                        O(n, i) || (a = '[' + i + ']'),
                        s ||
                            (e.seen.indexOf(u.value) < 0
                                ? (s = y(r) ? c(e, u.value, null) : c(e, u.value, r - 1)).indexOf(
                                      '\n'
                                  ) > -1 &&
                                  (s = o
                                      ? s
                                            .split('\n')
                                            .map(function (e) {
                                                return '  ' + e;
                                            })
                                            .join('\n')
                                            .slice(2)
                                      : '\n' +
                                        s
                                            .split('\n')
                                            .map(function (e) {
                                                return '   ' + e;
                                            })
                                            .join('\n'))
                                : (s = e.stylize('[Circular]', 'special'))),
                        b(a))
                    ) {
                        if (o && i.match(/^\d+$/)) return s;
                        (a = JSON.stringify('' + i)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)
                            ? ((a = a.slice(1, -1)), (a = e.stylize(a, 'name')))
                            : ((a = a
                                  .replace(/'/g, "\\'")
                                  .replace(/\\"/g, '"')
                                  .replace(/(^"|"$)/g, "'")),
                              (a = e.stylize(a, 'string')));
                    }
                    return a + ': ' + s;
                }
                function h(e) {
                    return Array.isArray(e);
                }
                function p(e) {
                    return 'boolean' == typeof e;
                }
                function y(e) {
                    return null === e;
                }
                function m(e) {
                    return 'number' == typeof e;
                }
                function g(e) {
                    return 'string' == typeof e;
                }
                function b(e) {
                    return void 0 === e;
                }
                function v(e) {
                    return w(e) && '[object RegExp]' === k(e);
                }
                function w(e) {
                    return 'object' == typeof e && null !== e;
                }
                function _(e) {
                    return w(e) && '[object Date]' === k(e);
                }
                function S(e) {
                    return w(e) && ('[object Error]' === k(e) || e instanceof Error);
                }
                function E(e) {
                    return 'function' == typeof e;
                }
                function k(e) {
                    return Object.prototype.toString.call(e);
                }
                ((e.debuglog = function (t) {
                    if (((t = t.toUpperCase()), !i[t]))
                        if (o.test(t)) {
                            process.pid;
                            i[t] = function () {
                                e.format.apply(e, arguments);
                            };
                        } else i[t] = function () {};
                    return i[t];
                }),
                    (e.inspect = s),
                    (s.colors = {
                        bold: [1, 22],
                        italic: [3, 23],
                        underline: [4, 24],
                        inverse: [7, 27],
                        white: [37, 39],
                        grey: [90, 39],
                        black: [30, 39],
                        blue: [34, 39],
                        cyan: [36, 39],
                        green: [32, 39],
                        magenta: [35, 39],
                        red: [31, 39],
                        yellow: [33, 39],
                    }),
                    (s.styles = {
                        special: 'cyan',
                        number: 'yellow',
                        boolean: 'yellow',
                        undefined: 'grey',
                        null: 'bold',
                        string: 'green',
                        date: 'magenta',
                        regexp: 'red',
                    }),
                    (e.types = pr()),
                    (e.isArray = h),
                    (e.isBoolean = p),
                    (e.isNull = y),
                    (e.isNullOrUndefined = function (e) {
                        return null == e;
                    }),
                    (e.isNumber = m),
                    (e.isString = g),
                    (e.isSymbol = function (e) {
                        return 'symbol' == typeof e;
                    }),
                    (e.isUndefined = b),
                    (e.isRegExp = v),
                    (e.types.isRegExp = v),
                    (e.isObject = w),
                    (e.isDate = _),
                    (e.types.isDate = _),
                    (e.isError = S),
                    (e.types.isNativeError = S),
                    (e.isFunction = E),
                    (e.isPrimitive = function (e) {
                        return (
                            null === e ||
                            'boolean' == typeof e ||
                            'number' == typeof e ||
                            'string' == typeof e ||
                            'symbol' == typeof e ||
                            void 0 === e
                        );
                    }),
                    (e.isBuffer = ar
                        ? or
                        : ((ar = 1),
                          (or = function (e) {
                              return (
                                  e &&
                                  'object' == typeof e &&
                                  'function' == typeof e.copy &&
                                  'function' == typeof e.fill &&
                                  'function' == typeof e.readUInt8
                              );
                          }))));
                function O(e, t) {
                    return Object.prototype.hasOwnProperty.call(e, t);
                }
                ((e.log = function () {}),
                    (e.inherits = br()),
                    (e._extend = function (e, t) {
                        if (!t || !w(t)) return e;
                        for (var r = Object.keys(t), n = r.length; n--; ) e[r[n]] = t[r[n]];
                        return e;
                    }));
                var T = 'undefined' != typeof Symbol ? Symbol('util.promisify.custom') : void 0;
                function M(e, t) {
                    if (!e) {
                        var r = new Error('Promise was rejected with a falsy value');
                        ((r.reason = e), (e = r));
                    }
                    return t(e);
                }
                ((e.promisify = function (e) {
                    if ('function' != typeof e)
                        throw new TypeError('The "original" argument must be of type Function');
                    if (T && e[T]) {
                        var t;
                        if ('function' != typeof (t = e[T]))
                            throw new TypeError(
                                'The "util.promisify.custom" argument must be of type Function'
                            );
                        return (
                            Object.defineProperty(t, T, {
                                value: t,
                                enumerable: !1,
                                writable: !1,
                                configurable: !0,
                            }),
                            t
                        );
                    }
                    function t() {
                        for (
                            var t,
                                r,
                                n = new Promise(function (e, n) {
                                    ((t = e), (r = n));
                                }),
                                i = [],
                                o = 0;
                            o < arguments.length;
                            o++
                        )
                            i.push(arguments[o]);
                        i.push(function (e, n) {
                            e ? r(e) : t(n);
                        });
                        try {
                            e.apply(this, i);
                        } catch (a) {
                            r(a);
                        }
                        return n;
                    }
                    return (
                        Object.setPrototypeOf(t, Object.getPrototypeOf(e)),
                        T &&
                            Object.defineProperty(t, T, {
                                value: t,
                                enumerable: !1,
                                writable: !1,
                                configurable: !0,
                            }),
                        Object.defineProperties(t, r(e))
                    );
                }),
                    (e.promisify.custom = T),
                    (e.callbackify = function (e) {
                        if ('function' != typeof e)
                            throw new TypeError('The "original" argument must be of type Function');
                        function t() {
                            for (var t = [], r = 0; r < arguments.length; r++) t.push(arguments[r]);
                            var n = t.pop();
                            if ('function' != typeof n)
                                throw new TypeError('The last argument must be of type Function');
                            var i = this,
                                o = function () {
                                    return n.apply(i, arguments);
                                };
                            e.apply(this, t).then(
                                function (e) {
                                    process.nextTick(o.bind(null, null, e));
                                },
                                function (e) {
                                    process.nextTick(M.bind(null, e, o));
                                }
                            );
                        }
                        return (
                            Object.setPrototypeOf(t, Object.getPrototypeOf(e)),
                            Object.defineProperties(t, r(e)),
                            t
                        );
                    }));
            })(it)),
        it
    );
}
var wr,
    _r = { exports: {} };
const Sr = h(
    Object.freeze(
        Object.defineProperty({ __proto__: null, default: {} }, Symbol.toStringTag, {
            value: 'Module',
        })
    )
);
var Er, kr, Or, Tr;
function Mr() {
    if (Tr) return Or;
    Tr = 1;
    var e = Sr,
        t = kr
            ? Er
            : ((kr = 1),
              (Er = function (e, t) {
                  var r = (t = t || process.argv || []).indexOf('--'),
                      n = /^-{1,2}/.test(e) ? '' : '--',
                      i = t.indexOf(n + e);
                  return -1 !== i && (-1 === r || i < r);
              })),
        r = {},
        n = void 0;
    function i(i) {
        var o = (function (i) {
            if (!1 === n) return 0;
            if (t('color=16m') || t('color=full') || t('color=truecolor')) return 3;
            if (t('color=256')) return 2;
            if (i && !i.isTTY && !0 !== n) return 0;
            var o = n ? 1 : 0;
            if ('win32' === process.platform) {
                var a = e.release().split('.');
                return Number(process.versions.node.split('.')[0]) >= 8 &&
                    Number(a[0]) >= 10 &&
                    Number(a[2]) >= 10586
                    ? Number(a[2]) >= 14931
                        ? 3
                        : 2
                    : 1;
            }
            if ('CI' in r)
                return ['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(function (e) {
                    return e in r;
                }) || 'codeship' === r.CI_NAME
                    ? 1
                    : o;
            if ('TEAMCITY_VERSION' in r)
                return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(r.TEAMCITY_VERSION) ? 1 : 0;
            if ('TERM_PROGRAM' in r) {
                var s = parseInt((r.TERM_PROGRAM_VERSION || '').split('.')[0], 10);
                switch (r.TERM_PROGRAM) {
                    case 'iTerm.app':
                        return s >= 3 ? 3 : 2;
                    case 'Hyper':
                        return 3;
                    case 'Apple_Terminal':
                        return 2;
                }
            }
            return /-256(color)?$/i.test(r.TERM)
                ? 2
                : /^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(r.TERM) ||
                    'COLORTERM' in r
                  ? 1
                  : o;
        })(i);
        return (function (e) {
            return 0 !== e && { level: e, hasBasic: !0, has256: e >= 2, has16m: e >= 3 };
        })(o);
    }
    return (
        t('no-color') || t('no-colors') || t('color=false')
            ? (n = !1)
            : (t('color') || t('colors') || t('color=true') || t('color=always')) && (n = !0),
        'FORCE_COLOR' in r && (n = 0 === r.FORCE_COLOR.length || 0 !== parseInt(r.FORCE_COLOR, 10)),
        (Or = { supportsColor: i, stdout: i(process.stdout), stderr: i(process.stderr) })
    );
}
var Ar,
    xr = { exports: {} };
var Pr,
    Rr = { exports: {} };
var jr,
    Cr = { exports: {} };
var Lr,
    Ir = { exports: {} };
var Dr,
    Nr = { exports: {} };
var Fr,
    Br,
    Ur,
    zr = { exports: {} };
function Gr() {
    return (
        Br ||
            ((Br = 1),
            (function () {
                var e = {};
                ((nt.exports = e), (e.themes = {}));
                var t = vr(),
                    r = (e.styles =
                        (wr ||
                            ((wr = 1),
                            (function () {
                                var e = {};
                                _r.exports = e;
                                var t = {
                                    reset: [0, 0],
                                    bold: [1, 22],
                                    dim: [2, 22],
                                    italic: [3, 23],
                                    underline: [4, 24],
                                    inverse: [7, 27],
                                    hidden: [8, 28],
                                    strikethrough: [9, 29],
                                    black: [30, 39],
                                    red: [31, 39],
                                    green: [32, 39],
                                    yellow: [33, 39],
                                    blue: [34, 39],
                                    magenta: [35, 39],
                                    cyan: [36, 39],
                                    white: [37, 39],
                                    gray: [90, 39],
                                    grey: [90, 39],
                                    brightRed: [91, 39],
                                    brightGreen: [92, 39],
                                    brightYellow: [93, 39],
                                    brightBlue: [94, 39],
                                    brightMagenta: [95, 39],
                                    brightCyan: [96, 39],
                                    brightWhite: [97, 39],
                                    bgBlack: [40, 49],
                                    bgRed: [41, 49],
                                    bgGreen: [42, 49],
                                    bgYellow: [43, 49],
                                    bgBlue: [44, 49],
                                    bgMagenta: [45, 49],
                                    bgCyan: [46, 49],
                                    bgWhite: [47, 49],
                                    bgGray: [100, 49],
                                    bgGrey: [100, 49],
                                    bgBrightRed: [101, 49],
                                    bgBrightGreen: [102, 49],
                                    bgBrightYellow: [103, 49],
                                    bgBrightBlue: [104, 49],
                                    bgBrightMagenta: [105, 49],
                                    bgBrightCyan: [106, 49],
                                    bgBrightWhite: [107, 49],
                                    blackBG: [40, 49],
                                    redBG: [41, 49],
                                    greenBG: [42, 49],
                                    yellowBG: [43, 49],
                                    blueBG: [44, 49],
                                    magentaBG: [45, 49],
                                    cyanBG: [46, 49],
                                    whiteBG: [47, 49],
                                };
                                Object.keys(t).forEach(function (r) {
                                    var n = t[r],
                                        i = (e[r] = []);
                                    ((i.open = '[' + n[0] + 'm'), (i.close = '[' + n[1] + 'm'));
                                });
                            })()),
                        _r.exports)),
                    n = Object.defineProperties,
                    i = new RegExp(/[\r\n]+/g);
                ((e.supportsColor = Mr().supportsColor),
                    void 0 === e.enabled && (e.enabled = !1 !== e.supportsColor()),
                    (e.enable = function () {
                        e.enabled = !0;
                    }),
                    (e.disable = function () {
                        e.enabled = !1;
                    }),
                    (e.stripColors = e.strip =
                        function (e) {
                            return ('' + e).replace(/\x1B\[\d+m/g, '');
                        }),
                    (e.stylize = function (t, n) {
                        if (!e.enabled) return t + '';
                        var i = r[n];
                        return !i && n in e ? e[n](t) : i.open + t + i.close;
                    }));
                var o = /[|\\{}()[\]^$+*?.]/g;
                function a(e) {
                    var t = function e() {
                        return c.apply(e, arguments);
                    };
                    return ((t._styles = e), (t.__proto__ = l), t);
                }
                var s,
                    u =
                        ((s = {}),
                        (r.grey = r.gray),
                        Object.keys(r).forEach(function (e) {
                            ((r[e].closeRe = new RegExp(
                                (function (e) {
                                    if ('string' != typeof e)
                                        throw new TypeError('Expected a string');
                                    return e.replace(o, '\\$&');
                                })(r[e].close),
                                'g'
                            )),
                                (s[e] = {
                                    get: function () {
                                        return a(this._styles.concat(e));
                                    },
                                }));
                        }),
                        s),
                    l = n(function () {}, u);
                function c() {
                    var n = Array.prototype.slice
                        .call(arguments)
                        .map(function (e) {
                            return null != e && e.constructor === String ? e : t.inspect(e);
                        })
                        .join(' ');
                    if (!e.enabled || !n) return n;
                    for (var o = -1 != n.indexOf('\n'), a = this._styles, s = a.length; s--; ) {
                        var u = r[a[s]];
                        ((n = u.open + n.replace(u.closeRe, u.open) + u.close),
                            o &&
                                (n = n.replace(i, function (e) {
                                    return u.close + e + u.open;
                                })));
                    }
                    return n;
                }
                e.setTheme = function (t) {
                    if ('string' != typeof t)
                        for (var r in t)
                            (function (r) {
                                e[r] = function (n) {
                                    if ('object' == typeof t[r]) {
                                        var i = n;
                                        for (var o in t[r]) i = e[t[r][o]](i);
                                        return i;
                                    }
                                    return e[t[r]](n);
                                };
                            })(r);
                };
                var f = function (e, t) {
                    var r = t.split('');
                    return (r = r.map(e)).join('');
                };
                for (var d in ((e.trap = Ar
                    ? xr.exports
                    : ((Ar = 1),
                      (xr.exports = function (e, t) {
                          var r = '';
                          e = (e = e || 'Run the trap, drop the bass').split('');
                          var n = {
                              a: ['@', 'Ą', 'Ⱥ', 'Ʌ', 'Δ', 'Λ', 'Д'],
                              b: ['ß', 'Ɓ', 'Ƀ', 'ɮ', 'β', '฿'],
                              c: ['©', 'Ȼ', 'Ͼ'],
                              d: ['Ð', 'Ɗ', 'Ԁ', 'ԁ', 'Ԃ', 'ԃ'],
                              e: ['Ë', 'ĕ', 'Ǝ', 'ɘ', 'Σ', 'ξ', 'Ҽ', '੬'],
                              f: ['Ӻ'],
                              g: ['ɢ'],
                              h: ['Ħ', 'ƕ', 'Ң', 'Һ', 'Ӈ', 'Ԋ'],
                              i: ['༏'],
                              j: ['Ĵ'],
                              k: ['ĸ', 'Ҡ', 'Ӄ', 'Ԟ'],
                              l: ['Ĺ'],
                              m: ['ʍ', 'Ӎ', 'ӎ', 'Ԡ', 'ԡ', '൩'],
                              n: ['Ñ', 'ŋ', 'Ɲ', 'Ͷ', 'Π', 'Ҋ'],
                              o: ['Ø', 'õ', 'ø', 'Ǿ', 'ʘ', 'Ѻ', 'ם', '۝', '๏'],
                              p: ['Ƿ', 'Ҏ'],
                              q: ['্'],
                              r: ['®', 'Ʀ', 'Ȑ', 'Ɍ', 'ʀ', 'Я'],
                              s: ['§', 'Ϟ', 'ϟ', 'Ϩ'],
                              t: ['Ł', 'Ŧ', 'ͳ'],
                              u: ['Ʊ', 'Ս'],
                              v: ['ט'],
                              w: ['Ш', 'Ѡ', 'Ѽ', '൰'],
                              x: ['Ҳ', 'Ӿ', 'Ӽ', 'ӽ'],
                              y: ['¥', 'Ұ', 'Ӌ'],
                              z: ['Ƶ', 'ɀ'],
                          };
                          return (
                              e.forEach(function (e) {
                                  e = e.toLowerCase();
                                  var t = n[e] || [' '],
                                      i = Math.floor(Math.random() * t.length);
                                  r += void 0 !== n[e] ? n[e][i] : e;
                              }),
                              r
                          );
                      }))),
                (e.zalgo = Pr
                    ? Rr.exports
                    : ((Pr = 1),
                      (Rr.exports = function (e, t) {
                          e = e || '   he is here   ';
                          var r = {
                                  up: [
                                      '̍',
                                      '̎',
                                      '̄',
                                      '̅',
                                      '̿',
                                      '̑',
                                      '̆',
                                      '̐',
                                      '͒',
                                      '͗',
                                      '͑',
                                      '̇',
                                      '̈',
                                      '̊',
                                      '͂',
                                      '̓',
                                      '̈',
                                      '͊',
                                      '͋',
                                      '͌',
                                      '̃',
                                      '̂',
                                      '̌',
                                      '͐',
                                      '̀',
                                      '́',
                                      '̋',
                                      '̏',
                                      '̒',
                                      '̓',
                                      '̔',
                                      '̽',
                                      '̉',
                                      'ͣ',
                                      'ͤ',
                                      'ͥ',
                                      'ͦ',
                                      'ͧ',
                                      'ͨ',
                                      'ͩ',
                                      'ͪ',
                                      'ͫ',
                                      'ͬ',
                                      'ͭ',
                                      'ͮ',
                                      'ͯ',
                                      '̾',
                                      '͛',
                                      '͆',
                                      '̚',
                                  ],
                                  down: [
                                      '̖',
                                      '̗',
                                      '̘',
                                      '̙',
                                      '̜',
                                      '̝',
                                      '̞',
                                      '̟',
                                      '̠',
                                      '̤',
                                      '̥',
                                      '̦',
                                      '̩',
                                      '̪',
                                      '̫',
                                      '̬',
                                      '̭',
                                      '̮',
                                      '̯',
                                      '̰',
                                      '̱',
                                      '̲',
                                      '̳',
                                      '̹',
                                      '̺',
                                      '̻',
                                      '̼',
                                      'ͅ',
                                      '͇',
                                      '͈',
                                      '͉',
                                      '͍',
                                      '͎',
                                      '͓',
                                      '͔',
                                      '͕',
                                      '͖',
                                      '͙',
                                      '͚',
                                      '̣',
                                  ],
                                  mid: [
                                      '̕',
                                      '̛',
                                      '̀',
                                      '́',
                                      '͘',
                                      '̡',
                                      '̢',
                                      '̧',
                                      '̨',
                                      '̴',
                                      '̵',
                                      '̶',
                                      '͜',
                                      '͝',
                                      '͞',
                                      '͟',
                                      '͠',
                                      '͢',
                                      '̸',
                                      '̷',
                                      '͡',
                                      ' ҉',
                                  ],
                              },
                              n = [].concat(r.up, r.down, r.mid);
                          function i(e) {
                              return Math.floor(Math.random() * e);
                          }
                          function o(e) {
                              var t = !1;
                              return (
                                  n.filter(function (r) {
                                      t = r === e;
                                  }),
                                  t
                              );
                          }
                          return (function (e, t) {
                              var n,
                                  a,
                                  s = '';
                              for (a in (((t = t || {}).up = void 0 === t.up || t.up),
                              (t.mid = void 0 === t.mid || t.mid),
                              (t.down = void 0 === t.down || t.down),
                              (t.size = void 0 !== t.size ? t.size : 'maxi'),
                              (e = e.split(''))))
                                  if (!o(a)) {
                                      switch (
                                          ((s += e[a]), (n = { up: 0, down: 0, mid: 0 }), t.size)
                                      ) {
                                          case 'mini':
                                              ((n.up = i(8)), (n.mid = i(2)), (n.down = i(8)));
                                              break;
                                          case 'maxi':
                                              ((n.up = i(16) + 3),
                                                  (n.mid = i(4) + 1),
                                                  (n.down = i(64) + 3));
                                              break;
                                          default:
                                              ((n.up = i(8) + 1),
                                                  (n.mid = i(6) / 2),
                                                  (n.down = i(8) + 1));
                                      }
                                      var u = ['up', 'mid', 'down'];
                                      for (var l in u)
                                          for (var c = u[l], f = 0; f <= n[c]; f++)
                                              t[c] && (s += r[c][i(r[c].length)]);
                                  }
                              return s;
                          })(e, t);
                      }))),
                (e.maps = {}),
                (e.maps.america = (
                    jr
                        ? Cr.exports
                        : ((jr = 1),
                          (Cr.exports = function (e) {
                              return function (t, r, n) {
                                  if (' ' === t) return t;
                                  switch (r % 3) {
                                      case 0:
                                          return e.red(t);
                                      case 1:
                                          return e.white(t);
                                      case 2:
                                          return e.blue(t);
                                  }
                              };
                          }))
                )(e)),
                (e.maps.zebra = (
                    Lr
                        ? Ir.exports
                        : ((Lr = 1),
                          (Ir.exports = function (e) {
                              return function (t, r, n) {
                                  return r % 2 == 0 ? t : e.inverse(t);
                              };
                          }))
                )(e)),
                (e.maps.rainbow = (
                    Dr
                        ? Nr.exports
                        : ((Dr = 1),
                          (Nr.exports = function (e) {
                              var t = ['red', 'yellow', 'green', 'blue', 'magenta'];
                              return function (r, n, i) {
                                  return ' ' === r ? r : e[t[n++ % t.length]](r);
                              };
                          }))
                )(e)),
                (e.maps.random = (
                    Fr
                        ? zr.exports
                        : ((Fr = 1),
                          (zr.exports = function (e) {
                              var t = [
                                  'underline',
                                  'inverse',
                                  'grey',
                                  'yellow',
                                  'red',
                                  'green',
                                  'blue',
                                  'white',
                                  'cyan',
                                  'magenta',
                                  'brightYellow',
                                  'brightRed',
                                  'brightGreen',
                                  'brightBlue',
                                  'brightWhite',
                                  'brightCyan',
                                  'brightMagenta',
                              ];
                              return function (r, n, i) {
                                  return ' ' === r
                                      ? r
                                      : e[t[Math.round(Math.random() * (t.length - 2))]](r);
                              };
                          }))
                )(e)),
                e.maps))
                    (function (t) {
                        e[t] = function (r) {
                            return f(e.maps[t], r);
                        };
                    })(d);
                n(
                    e,
                    (function () {
                        var e = {};
                        return (
                            Object.keys(u).forEach(function (t) {
                                e[t] = {
                                    get: function () {
                                        return a([t]);
                                    },
                                };
                            }),
                            e
                        );
                    })()
                );
            })()),
        nt.exports
    );
}
function $r() {
    return (Ur || ((Ur = 1), (e = rt), (t = Gr()), (e.exports = t)), rt.exports);
    var e, t;
}
var Wr,
    Hr = {},
    Vr = {},
    qr = {};
var Yr,
    Kr = {};
var Jr,
    Zr,
    Xr,
    Qr,
    en,
    tn,
    rn,
    nn,
    on = {};
function an() {
    return (
        Zr ||
            ((Zr = 1),
            (e = Vr),
            Object.defineProperty(e, 'cli', {
                value:
                    (Wr ||
                        ((Wr = 1),
                        (qr.levels = {
                            error: 0,
                            warn: 1,
                            help: 2,
                            data: 3,
                            info: 4,
                            debug: 5,
                            prompt: 6,
                            verbose: 7,
                            input: 8,
                            silly: 9,
                        }),
                        (qr.colors = {
                            error: 'red',
                            warn: 'yellow',
                            help: 'cyan',
                            data: 'grey',
                            info: 'green',
                            debug: 'blue',
                            prompt: 'grey',
                            verbose: 'cyan',
                            input: 'grey',
                            silly: 'magenta',
                        })),
                    qr),
            }),
            Object.defineProperty(e, 'npm', {
                value:
                    (Yr ||
                        ((Yr = 1),
                        (Kr.levels = {
                            error: 0,
                            warn: 1,
                            info: 2,
                            http: 3,
                            verbose: 4,
                            debug: 5,
                            silly: 6,
                        }),
                        (Kr.colors = {
                            error: 'red',
                            warn: 'yellow',
                            info: 'green',
                            http: 'green',
                            verbose: 'cyan',
                            debug: 'blue',
                            silly: 'magenta',
                        })),
                    Kr),
            }),
            Object.defineProperty(e, 'syslog', {
                value:
                    (Jr ||
                        ((Jr = 1),
                        (on.levels = {
                            emerg: 0,
                            alert: 1,
                            crit: 2,
                            error: 3,
                            warning: 4,
                            notice: 5,
                            info: 6,
                            debug: 7,
                        }),
                        (on.colors = {
                            emerg: 'red',
                            alert: 'yellow',
                            crit: 'red',
                            error: 'red',
                            warning: 'red',
                            notice: 'yellow',
                            info: 'green',
                            debug: 'blue',
                        })),
                    on),
            })),
        Vr
    );
    var e;
}
function sn() {
    return (
        Xr ||
            ((Xr = 1),
            (e = Hr),
            Object.defineProperty(e, 'LEVEL', { value: Symbol.for('level') }),
            Object.defineProperty(e, 'MESSAGE', { value: Symbol.for('message') }),
            Object.defineProperty(e, 'SPLAT', { value: Symbol.for('splat') }),
            Object.defineProperty(e, 'configs', { value: an() })),
        Hr
    );
    var e;
}
function un() {
    if (Qr) return tt.exports;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t) {
        for (var n = 0; n < t.length; n++) {
            var i = t[n];
            ((i.enumerable = i.enumerable || !1),
                (i.configurable = !0),
                'value' in i && (i.writable = !0),
                Object.defineProperty(e, r(i.key), i));
        }
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    Qr = 1;
    var n = $r(),
        i = sn(),
        o = i.LEVEL,
        a = i.MESSAGE;
    n.enabled = !0;
    var s = /\s+/,
        u = (function () {
            function e() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                (!(function (e, t) {
                    if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                })(this, e),
                    t.colors && this.addColors(t.colors),
                    (this.options = t));
            }
            return (
                (r = e),
                (u = [
                    {
                        key: 'addColors',
                        value: function (t) {
                            var r = Object.keys(t).reduce(function (e, r) {
                                return ((e[r] = s.test(t[r]) ? t[r].split(s) : t[r]), e);
                            }, {});
                            return (
                                (e.allColors = Object.assign({}, e.allColors || {}, r)),
                                e.allColors
                            );
                        },
                    },
                ]),
                (i = [
                    {
                        key: 'addColors',
                        value: function (t) {
                            return e.addColors(t);
                        },
                    },
                    {
                        key: 'colorize',
                        value: function (t, r, i) {
                            if ((void 0 === i && (i = r), !Array.isArray(e.allColors[t])))
                                return n[e.allColors[t]](i);
                            for (var o = 0, a = e.allColors[t].length; o < a; o++)
                                i = n[e.allColors[t][o]](i);
                            return i;
                        },
                    },
                    {
                        key: 'transform',
                        value: function (e, t) {
                            return (
                                t.all &&
                                    'string' == typeof e[a] &&
                                    (e[a] = this.colorize(e[o], e.level, e[a])),
                                (t.level || t.all || !t.message) &&
                                    (e.level = this.colorize(e[o], e.level)),
                                (t.all || t.message) &&
                                    (e.message = this.colorize(e[o], e.level, e.message)),
                                e
                            );
                        },
                    },
                ]) && t(r.prototype, i),
                u && t(r, u),
                Object.defineProperty(r, 'prototype', { writable: !1 }),
                r
            );
            var r, i, u;
        })();
    return (
        (tt.exports = function (e) {
            return new u(e);
        }),
        (tt.exports.Colorizer = tt.exports.Format = u),
        tt.exports
    );
}
function ln() {
    if (nn) return rn;
    nn = 1;
    var e = b();
    return (rn = e(function (e) {
        return ((e.message = '\t'.concat(e.message)), e);
    }));
}
var cn,
    fn,
    dn = { exports: {} },
    hn = { exports: {} };
function pn() {
    if (cn) return hn.exports;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e) {
        return (
            (function (e) {
                if (Array.isArray(e)) return r(e);
            })(e) ||
            (function (e) {
                if (
                    ('undefined' != typeof Symbol && null != e[Symbol.iterator]) ||
                    null != e['@@iterator']
                )
                    return Array.from(e);
            })(e) ||
            (function (e, t) {
                if (e) {
                    if ('string' == typeof e) return r(e, t);
                    var n = {}.toString.call(e).slice(8, -1);
                    return (
                        'Object' === n && e.constructor && (n = e.constructor.name),
                        'Map' === n || 'Set' === n
                            ? Array.from(e)
                            : 'Arguments' === n ||
                                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
                              ? r(e, t)
                              : void 0
                    );
                }
            })(e) ||
            (function () {
                throw new TypeError(
                    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
                );
            })()
        );
    }
    function r(e, t) {
        (null == t || t > e.length) && (t = e.length);
        for (var r = 0, n = Array(t); r < t; r++) n[r] = e[r];
        return n;
    }
    function n(e, t) {
        for (var r = 0; r < t.length; r++) {
            var n = t[r];
            ((n.enumerable = n.enumerable || !1),
                (n.configurable = !0),
                'value' in n && (n.writable = !0),
                Object.defineProperty(e, i(n.key), n));
        }
    }
    function i(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    cn = 1;
    var o = sn(),
        a = o.configs,
        s = o.LEVEL,
        u = o.MESSAGE,
        l = (function () {
            function e() {
                var t =
                    arguments.length > 0 && void 0 !== arguments[0]
                        ? arguments[0]
                        : { levels: a.npm.levels };
                (!(function (e, t) {
                    if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                })(this, e),
                    (this.paddings = e.paddingForLevels(t.levels, t.filler)),
                    (this.options = t));
            }
            return (
                (r = e),
                (o = [
                    {
                        key: 'getLongestLevel',
                        value: function (e) {
                            var r = Object.keys(e).map(function (e) {
                                return e.length;
                            });
                            return Math.max.apply(Math, t(r));
                        },
                    },
                    {
                        key: 'paddingForLevel',
                        value: function (e, t, r) {
                            var n = r + 1 - e.length,
                                i = Math.floor(n / t.length);
                            return ''.concat(t).concat(t.repeat(i)).slice(0, n);
                        },
                    },
                    {
                        key: 'paddingForLevels',
                        value: function (t) {
                            var r =
                                    arguments.length > 1 && void 0 !== arguments[1]
                                        ? arguments[1]
                                        : ' ',
                                n = e.getLongestLevel(t);
                            return Object.keys(t).reduce(function (t, i) {
                                return ((t[i] = e.paddingForLevel(i, r, n)), t);
                            }, {});
                        },
                    },
                ]),
                (i = [
                    {
                        key: 'transform',
                        value: function (e, t) {
                            return (
                                (e.message = ''.concat(this.paddings[e[s]]).concat(e.message)),
                                e[u] && (e[u] = ''.concat(this.paddings[e[s]]).concat(e[u])),
                                e
                            );
                        },
                    },
                ]) && n(r.prototype, i),
                o && n(r, o),
                Object.defineProperty(r, 'prototype', { writable: !1 }),
                r
            );
            var r, i, o;
        })();
    return (
        (hn.exports = function (e) {
            return new l(e);
        }),
        (hn.exports.Padder = hn.exports.Format = l),
        hn.exports
    );
}
function yn() {
    if (fn) return dn.exports;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    fn = 1;
    var n = un().Colorizer,
        i = pn().Padder,
        o = sn(),
        a = o.configs,
        s = o.MESSAGE,
        u = (function () {
            return t(
                function e() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                    (!(function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, e),
                        t.levels || (t.levels = a.cli.levels),
                        (this.colorizer = new n(t)),
                        (this.padder = new i(t)),
                        (this.options = t));
                },
                [
                    {
                        key: 'transform',
                        value: function (e, t) {
                            return (
                                this.colorizer.transform(this.padder.transform(e, t), t),
                                (e[s] = ''.concat(e.level, ':').concat(e.message)),
                                e
                            );
                        },
                    },
                ]
            );
        })();
    return (
        (dn.exports = function (e) {
            return new u(e);
        }),
        (dn.exports.Format = u),
        dn.exports
    );
}
var mn,
    gn,
    bn,
    vn = { exports: {} };
function wn() {
    if (mn) return vn.exports;
    mn = 1;
    var e = b();
    function t(e) {
        if (e.every(r))
            return function (t) {
                for (var r = t, n = 0; n < e.length; n++)
                    if (!(r = e[n].transform(r, e[n].options))) return !1;
                return r;
            };
    }
    function r(e) {
        if ('function' != typeof e.transform)
            throw new Error(
                [
                    'No transform function found on format. Did you create a format instance?',
                    'const myFormat = format(formatFn);',
                    'const instance = myFormat();',
                ].join('\n')
            );
        return !0;
    }
    return (
        (vn.exports = function () {
            for (var r = arguments.length, n = new Array(r), i = 0; i < r; i++) n[i] = arguments[i];
            var o = e(t(n)),
                a = o();
            return ((a.Format = o.Format), a);
        }),
        (vn.exports.cascade = t),
        vn.exports
    );
}
function _n() {
    if (bn) return gn;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(t, r, n) {
        return (
            (r = (function (t) {
                var r = (function (t, r) {
                    if ('object' != e(t) || !t) return t;
                    var n = t[Symbol.toPrimitive];
                    if (void 0 !== n) {
                        var i = n.call(t, r);
                        if ('object' != e(i)) return i;
                        throw new TypeError('@@toPrimitive must return a primitive value.');
                    }
                    return ('string' === r ? String : Number)(t);
                })(t, 'string');
                return 'symbol' == e(r) ? r : r + '';
            })(r)) in t
                ? Object.defineProperty(t, r, {
                      value: n,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (t[r] = n),
            t
        );
    }
    bn = 1;
    var r = b(),
        n = sn(),
        i = n.LEVEL,
        o = n.MESSAGE;
    return (gn = r(function (e, r) {
        var n = r.stack,
            a = r.cause;
        if (e instanceof Error) {
            var s = Object.assign(
                {},
                e,
                t(
                    t(t({ level: e.level }, i, e[i] || e.level), 'message', e.message),
                    o,
                    e[o] || e.message
                )
            );
            return (n && (s.stack = e.stack), a && (s.cause = e.cause), s);
        }
        if (!(e.message instanceof Error)) return e;
        var u = e.message;
        return (
            Object.assign(e, u),
            (e.message = u.message),
            (e[o] = u.message),
            n && (e.stack = u.stack),
            a && (e.cause = u.cause),
            e
        );
    }));
}
var Sn,
    En,
    kn,
    On,
    Tn,
    Mn,
    An,
    xn,
    Pn,
    Rn,
    jn,
    Cn,
    Ln,
    In,
    Dn,
    Nn = { exports: {} };
function Fn() {
    return (
        Sn ||
            ((Sn = 1),
            (function (e, t) {
                const { hasOwnProperty: r } = Object.prototype,
                    n = h();
                ((n.configure = h),
                    (n.stringify = n),
                    (n.default = n),
                    (t.stringify = n),
                    (t.configure = h),
                    (e.exports = n));
                const i = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
                function o(e) {
                    return e.length < 5e3 && !i.test(e) ? `"${e}"` : JSON.stringify(e);
                }
                function a(e, t) {
                    if (e.length > 200 || t) return e.sort(t);
                    for (let r = 1; r < e.length; r++) {
                        const t = e[r];
                        let n = r;
                        for (; 0 !== n && e[n - 1] > t; ) ((e[n] = e[n - 1]), n--);
                        e[n] = t;
                    }
                    return e;
                }
                const u = Object.getOwnPropertyDescriptor(
                    Object.getPrototypeOf(Object.getPrototypeOf(new Int8Array())),
                    Symbol.toStringTag
                ).get;
                function l(e) {
                    return void 0 !== u.call(e) && 0 !== e.length;
                }
                function c(e, t, r) {
                    e.length < r && (r = e.length);
                    const n = ',' === t ? '' : ' ';
                    let i = `"0":${n}${e[0]}`;
                    for (let o = 1; o < r; o++) i += `${t}"${o}":${n}${e[o]}`;
                    return i;
                }
                function f(e, t) {
                    let n;
                    if (r.call(e, t)) {
                        if (((n = e[t]), 'number' != typeof n))
                            throw new TypeError(`The "${t}" argument must be of type number`);
                        if (!Number.isInteger(n))
                            throw new TypeError(`The "${t}" argument must be an integer`);
                        if (n < 1) throw new RangeError(`The "${t}" argument must be >= 1`);
                    }
                    return void 0 === n ? 1 / 0 : n;
                }
                function d(e) {
                    return 1 === e ? '1 item' : `${e} items`;
                }
                function h(e) {
                    const t = (function (e) {
                        if (r.call(e, 'strict')) {
                            const t = e.strict;
                            if ('boolean' != typeof t)
                                throw new TypeError(
                                    'The "strict" argument must be of type boolean'
                                );
                            if (t)
                                return (e) => {
                                    let t =
                                        'Object can not safely be stringified. Received type ' +
                                        typeof e;
                                    throw (
                                        'function' != typeof e && (t += ` (${e.toString()})`),
                                        new Error(t)
                                    );
                                };
                        }
                    })((e = s({}, e)));
                    t &&
                        (void 0 === e.bigint && (e.bigint = !1),
                        'circularValue' in e || (e.circularValue = Error));
                    const n = (function (e) {
                            if (r.call(e, 'circularValue')) {
                                const t = e.circularValue;
                                if ('string' == typeof t) return `"${t}"`;
                                if (null == t) return t;
                                if (t === Error || t === TypeError)
                                    return {
                                        toString() {
                                            throw new TypeError(
                                                'Converting circular structure to JSON'
                                            );
                                        },
                                    };
                                throw new TypeError(
                                    'The "circularValue" argument must be of type string or the value null or undefined'
                                );
                            }
                            return '"[Circular]"';
                        })(e),
                        i = (function (e, t) {
                            let n;
                            if (r.call(e, t) && ((n = e[t]), 'boolean' != typeof n))
                                throw new TypeError(`The "${t}" argument must be of type boolean`);
                            return void 0 === n || n;
                        })(e, 'bigint'),
                        u = (function (e) {
                            let t;
                            if (
                                r.call(e, 'deterministic') &&
                                ((t = e.deterministic),
                                'boolean' != typeof t && 'function' != typeof t)
                            )
                                throw new TypeError(
                                    'The "deterministic" argument must be of type boolean or comparator function'
                                );
                            return void 0 === t || t;
                        })(e),
                        h = 'function' == typeof u ? u : void 0,
                        p = f(e, 'maximumDepth'),
                        y = f(e, 'maximumBreadth');
                    function m(e, r, s, c, f, g) {
                        let b = r[e];
                        switch (
                            ('object' == typeof b &&
                                null !== b &&
                                'function' == typeof b.toJSON &&
                                (b = b.toJSON(e)),
                            (b = c.call(r, e, b)),
                            typeof b)
                        ) {
                            case 'string':
                                return o(b);
                            case 'object': {
                                if (null === b) return 'null';
                                if (-1 !== s.indexOf(b)) return n;
                                let e = '',
                                    t = ',';
                                const r = g;
                                if (Array.isArray(b)) {
                                    if (0 === b.length) return '[]';
                                    if (p < s.length + 1) return '"[Array]"';
                                    (s.push(b),
                                        '' !== f && ((e += `\n${(g += f)}`), (t = `,\n${g}`)));
                                    const n = Math.min(b.length, y);
                                    let i = 0;
                                    for (; i < n - 1; i++) {
                                        const r = m(String(i), b, s, c, f, g);
                                        ((e += void 0 !== r ? r : 'null'), (e += t));
                                    }
                                    const o = m(String(i), b, s, c, f, g);
                                    if (((e += void 0 !== o ? o : 'null'), b.length - 1 > y)) {
                                        e += `${t}"... ${d(b.length - y - 1)} not stringified"`;
                                    }
                                    return ('' !== f && (e += `\n${r}`), s.pop(), `[${e}]`);
                                }
                                let i = Object.keys(b);
                                const v = i.length;
                                if (0 === v) return '{}';
                                if (p < s.length + 1) return '"[Object]"';
                                let w = '',
                                    _ = '';
                                '' !== f && ((t = `,\n${(g += f)}`), (w = ' '));
                                const S = Math.min(v, y);
                                (u && !l(b) && (i = a(i, h)), s.push(b));
                                for (let n = 0; n < S; n++) {
                                    const r = i[n],
                                        a = m(r, b, s, c, f, g);
                                    void 0 !== a && ((e += `${_}${o(r)}:${w}${a}`), (_ = t));
                                }
                                if (v > y) {
                                    ((e += `${_}"...":${w}"${d(v - y)} not stringified"`), (_ = t));
                                }
                                return (
                                    '' !== f && _.length > 1 && (e = `\n${g}${e}\n${r}`),
                                    s.pop(),
                                    `{${e}}`
                                );
                            }
                            case 'number':
                                return isFinite(b) ? String(b) : t ? t(b) : 'null';
                            case 'boolean':
                                return !0 === b ? 'true' : 'false';
                            case 'undefined':
                                return;
                            case 'bigint':
                                if (i) return String(b);
                            default:
                                return t ? t(b) : void 0;
                        }
                    }
                    function g(e, r, a, s, u, l) {
                        switch (
                            ('object' == typeof r &&
                                null !== r &&
                                'function' == typeof r.toJSON &&
                                (r = r.toJSON(e)),
                            typeof r)
                        ) {
                            case 'string':
                                return o(r);
                            case 'object': {
                                if (null === r) return 'null';
                                if (-1 !== a.indexOf(r)) return n;
                                const e = l;
                                let t = '',
                                    i = ',';
                                if (Array.isArray(r)) {
                                    if (0 === r.length) return '[]';
                                    if (p < a.length + 1) return '"[Array]"';
                                    (a.push(r),
                                        '' !== u && ((t += `\n${(l += u)}`), (i = `,\n${l}`)));
                                    const n = Math.min(r.length, y);
                                    let o = 0;
                                    for (; o < n - 1; o++) {
                                        const e = g(String(o), r[o], a, s, u, l);
                                        ((t += void 0 !== e ? e : 'null'), (t += i));
                                    }
                                    const c = g(String(o), r[o], a, s, u, l);
                                    if (((t += void 0 !== c ? c : 'null'), r.length - 1 > y)) {
                                        t += `${i}"... ${d(r.length - y - 1)} not stringified"`;
                                    }
                                    return ('' !== u && (t += `\n${e}`), a.pop(), `[${t}]`);
                                }
                                a.push(r);
                                let c = '';
                                '' !== u && ((i = `,\n${(l += u)}`), (c = ' '));
                                let f = '';
                                for (const n of s) {
                                    const e = g(n, r[n], a, s, u, l);
                                    void 0 !== e && ((t += `${f}${o(n)}:${c}${e}`), (f = i));
                                }
                                return (
                                    '' !== u && f.length > 1 && (t = `\n${l}${t}\n${e}`),
                                    a.pop(),
                                    `{${t}}`
                                );
                            }
                            case 'number':
                                return isFinite(r) ? String(r) : t ? t(r) : 'null';
                            case 'boolean':
                                return !0 === r ? 'true' : 'false';
                            case 'undefined':
                                return;
                            case 'bigint':
                                if (i) return String(r);
                            default:
                                return t ? t(r) : void 0;
                        }
                    }
                    function b(e, r, s, f, m) {
                        switch (typeof r) {
                            case 'string':
                                return o(r);
                            case 'object': {
                                if (null === r) return 'null';
                                if ('function' == typeof r.toJSON) {
                                    if ('object' != typeof (r = r.toJSON(e)))
                                        return b(e, r, s, f, m);
                                    if (null === r) return 'null';
                                }
                                if (-1 !== s.indexOf(r)) return n;
                                const t = m;
                                if (Array.isArray(r)) {
                                    if (0 === r.length) return '[]';
                                    if (p < s.length + 1) return '"[Array]"';
                                    s.push(r);
                                    let e = `\n${(m += f)}`;
                                    const n = `,\n${m}`,
                                        i = Math.min(r.length, y);
                                    let o = 0;
                                    for (; o < i - 1; o++) {
                                        const t = b(String(o), r[o], s, f, m);
                                        ((e += void 0 !== t ? t : 'null'), (e += n));
                                    }
                                    const a = b(String(o), r[o], s, f, m);
                                    if (((e += void 0 !== a ? a : 'null'), r.length - 1 > y)) {
                                        e += `${n}"... ${d(r.length - y - 1)} not stringified"`;
                                    }
                                    return ((e += `\n${t}`), s.pop(), `[${e}]`);
                                }
                                let i = Object.keys(r);
                                const g = i.length;
                                if (0 === g) return '{}';
                                if (p < s.length + 1) return '"[Object]"';
                                const v = `,\n${(m += f)}`;
                                let w = '',
                                    _ = '',
                                    S = Math.min(g, y);
                                (l(r) &&
                                    ((w += c(r, v, y)),
                                    (i = i.slice(r.length)),
                                    (S -= r.length),
                                    (_ = v)),
                                    u && (i = a(i, h)),
                                    s.push(r));
                                for (let e = 0; e < S; e++) {
                                    const t = i[e],
                                        n = b(t, r[t], s, f, m);
                                    void 0 !== n && ((w += `${_}${o(t)}: ${n}`), (_ = v));
                                }
                                if (g > y) {
                                    ((w += `${_}"...": "${d(g - y)} not stringified"`), (_ = v));
                                }
                                return ('' !== _ && (w = `\n${m}${w}\n${t}`), s.pop(), `{${w}}`);
                            }
                            case 'number':
                                return isFinite(r) ? String(r) : t ? t(r) : 'null';
                            case 'boolean':
                                return !0 === r ? 'true' : 'false';
                            case 'undefined':
                                return;
                            case 'bigint':
                                if (i) return String(r);
                            default:
                                return t ? t(r) : void 0;
                        }
                    }
                    function v(e, r, s) {
                        switch (typeof r) {
                            case 'string':
                                return o(r);
                            case 'object': {
                                if (null === r) return 'null';
                                if ('function' == typeof r.toJSON) {
                                    if ('object' != typeof (r = r.toJSON(e))) return v(e, r, s);
                                    if (null === r) return 'null';
                                }
                                if (-1 !== s.indexOf(r)) return n;
                                let t = '';
                                const i = void 0 !== r.length;
                                if (i && Array.isArray(r)) {
                                    if (0 === r.length) return '[]';
                                    if (p < s.length + 1) return '"[Array]"';
                                    s.push(r);
                                    const e = Math.min(r.length, y);
                                    let n = 0;
                                    for (; n < e - 1; n++) {
                                        const e = v(String(n), r[n], s);
                                        ((t += void 0 !== e ? e : 'null'), (t += ','));
                                    }
                                    const i = v(String(n), r[n], s);
                                    if (((t += void 0 !== i ? i : 'null'), r.length - 1 > y)) {
                                        t += `,"... ${d(r.length - y - 1)} not stringified"`;
                                    }
                                    return (s.pop(), `[${t}]`);
                                }
                                let f = Object.keys(r);
                                const m = f.length;
                                if (0 === m) return '{}';
                                if (p < s.length + 1) return '"[Object]"';
                                let g = '',
                                    b = Math.min(m, y);
                                (i &&
                                    l(r) &&
                                    ((t += c(r, ',', y)),
                                    (f = f.slice(r.length)),
                                    (b -= r.length),
                                    (g = ',')),
                                    u && (f = a(f, h)),
                                    s.push(r));
                                for (let e = 0; e < b; e++) {
                                    const n = f[e],
                                        i = v(n, r[n], s);
                                    void 0 !== i && ((t += `${g}${o(n)}:${i}`), (g = ','));
                                }
                                if (m > y) {
                                    t += `${g}"...":"${d(m - y)} not stringified"`;
                                }
                                return (s.pop(), `{${t}}`);
                            }
                            case 'number':
                                return isFinite(r) ? String(r) : t ? t(r) : 'null';
                            case 'boolean':
                                return !0 === r ? 'true' : 'false';
                            case 'undefined':
                                return;
                            case 'bigint':
                                if (i) return String(r);
                            default:
                                return t ? t(r) : void 0;
                        }
                    }
                    return function (e, t, r) {
                        if (arguments.length > 1) {
                            let n = '';
                            if (
                                ('number' == typeof r
                                    ? (n = ' '.repeat(Math.min(r, 10)))
                                    : 'string' == typeof r && (n = r.slice(0, 10)),
                                null != t)
                            ) {
                                if ('function' == typeof t) return m('', { '': e }, [], t, n, '');
                                if (Array.isArray(t))
                                    return g(
                                        '',
                                        e,
                                        [],
                                        (function (e) {
                                            const t = new Set();
                                            for (const r of e)
                                                ('string' != typeof r && 'number' != typeof r) ||
                                                    t.add(String(r));
                                            return t;
                                        })(t),
                                        n,
                                        ''
                                    );
                            }
                            if (0 !== n.length) return b('', e, [], n, '');
                        }
                        return v('', e, []);
                    };
                }
            })(Nn, Nn.exports)),
        Nn.exports
    );
}
function Bn() {
    if (kn) return En;
    kn = 1;
    var e = b(),
        t = sn().MESSAGE,
        r = Fn();
    function n(e, t) {
        return 'bigint' == typeof t ? t.toString() : t;
    }
    return (En = e(function (e, i) {
        var o = r.configure(i);
        return ((e[t] = o(e, i.replacer || n, i.space)), e);
    }));
}
function Un() {
    if (Tn) return On;
    Tn = 1;
    var e = b();
    return (On = e(function (e, t) {
        return t.message
            ? ((e.message = '['.concat(t.label, '] ').concat(e.message)), e)
            : ((e.label = t.label), e);
    }));
}
function zn() {
    if (An) return Mn;
    An = 1;
    var e = b(),
        t = sn().MESSAGE,
        r = Fn();
    return (Mn = e(function (e) {
        var n = {};
        return (
            e.message && ((n['@message'] = e.message), delete e.message),
            e.timestamp && ((n['@timestamp'] = e.timestamp), delete e.timestamp),
            (n['@fields'] = e),
            (e[t] = r(n)),
            e
        );
    }));
}
function Gn() {
    if (Pn) return xn;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(t, r, n) {
        return (
            (r = (function (t) {
                var r = (function (t, r) {
                    if ('object' != e(t) || !t) return t;
                    var n = t[Symbol.toPrimitive];
                    if (void 0 !== n) {
                        var i = n.call(t, r);
                        if ('object' != e(i)) return i;
                        throw new TypeError('@@toPrimitive must return a primitive value.');
                    }
                    return ('string' === r ? String : Number)(t);
                })(t, 'string');
                return 'symbol' == e(r) ? r : r + '';
            })(r)) in t
                ? Object.defineProperty(t, r, {
                      value: n,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (t[r] = n),
            t
        );
    }
    Pn = 1;
    var r = b();
    return (
        (xn = r(function (e) {
            var r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                n = 'metadata';
            r.key && (n = r.key);
            var i = [];
            return (
                r.fillExcept || r.fillWith || (i.push('level'), i.push('message')),
                r.fillExcept && (i = r.fillExcept),
                i.length > 0
                    ? (function (e, r, n) {
                          var i = r.reduce(function (t, r) {
                                  return ((t[r] = e[r]), delete e[r], t);
                              }, {}),
                              o = Object.keys(e).reduce(function (t, r) {
                                  return ((t[r] = e[r]), delete e[r], t);
                              }, {});
                          return (Object.assign(e, i, t({}, n, o)), e);
                      })(e, i, n)
                    : r.fillWith
                      ? (function (e, t, r) {
                            return (
                                (e[r] = t.reduce(function (t, r) {
                                    return ((t[r] = e[r]), delete e[r], t);
                                }, {})),
                                e
                            );
                        })(e, r.fillWith, n)
                      : e
            );
        })),
        xn
    );
}
function $n() {
    if (jn) return Rn;
    jn = 1;
    var e = 1e3,
        t = 60 * e,
        r = 60 * t,
        n = 24 * r,
        i = 7 * n,
        o = 365.25 * n;
    function a(e, t, r, n) {
        var i = t >= 1.5 * r;
        return Math.round(e / r) + ' ' + n + (i ? 's' : '');
    }
    return (Rn = function (s, u) {
        u = u || {};
        var l = typeof s;
        if ('string' === l && s.length > 0)
            return (function (a) {
                if ((a = String(a)).length > 100) return;
                var s =
                    /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
                        a
                    );
                if (!s) return;
                var u = parseFloat(s[1]);
                switch ((s[2] || 'ms').toLowerCase()) {
                    case 'years':
                    case 'year':
                    case 'yrs':
                    case 'yr':
                    case 'y':
                        return u * o;
                    case 'weeks':
                    case 'week':
                    case 'w':
                        return u * i;
                    case 'days':
                    case 'day':
                    case 'd':
                        return u * n;
                    case 'hours':
                    case 'hour':
                    case 'hrs':
                    case 'hr':
                    case 'h':
                        return u * r;
                    case 'minutes':
                    case 'minute':
                    case 'mins':
                    case 'min':
                    case 'm':
                        return u * t;
                    case 'seconds':
                    case 'second':
                    case 'secs':
                    case 'sec':
                    case 's':
                        return u * e;
                    case 'milliseconds':
                    case 'millisecond':
                    case 'msecs':
                    case 'msec':
                    case 'ms':
                        return u;
                    default:
                        return;
                }
            })(s);
        if ('number' === l && isFinite(s))
            return u.long
                ? (function (i) {
                      var o = Math.abs(i);
                      if (o >= n) return a(i, o, n, 'day');
                      if (o >= r) return a(i, o, r, 'hour');
                      if (o >= t) return a(i, o, t, 'minute');
                      if (o >= e) return a(i, o, e, 'second');
                      return i + ' ms';
                  })(s)
                : (function (i) {
                      var o = Math.abs(i);
                      if (o >= n) return Math.round(i / n) + 'd';
                      if (o >= r) return Math.round(i / r) + 'h';
                      if (o >= t) return Math.round(i / t) + 'm';
                      if (o >= e) return Math.round(i / e) + 's';
                      return i + 'ms';
                  })(s);
        throw new Error(
            'val is not a non-empty string or a valid number. val=' + JSON.stringify(s)
        );
    });
}
function Wn() {
    if (Ln) return Cn;
    Ln = 1;
    var e = void 0,
        t = b(),
        r = $n();
    return (Cn = t(function (t) {
        var n = +new Date();
        return (
            (e.diff = n - (e.prevTime || n)),
            (e.prevTime = n),
            (t.ms = '+'.concat(r(e.diff))),
            t
        );
    }));
}
function Hn() {
    if (Dn) return In;
    Dn = 1;
    var e = vr().inspect,
        t = b(),
        r = sn(),
        n = r.LEVEL,
        i = r.MESSAGE,
        o = r.SPLAT;
    return (
        (In = t(function (t) {
            var r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                a = Object.assign({}, t);
            return (
                delete a[n],
                delete a[i],
                delete a[o],
                (t[i] = e(a, !1, r.depth || null, r.colorize)),
                t
            );
        })),
        In
    );
}
var Vn,
    qn,
    Yn,
    Kn,
    Jn,
    Zn = { exports: {} };
function Xn() {
    if (Vn) return Zn.exports;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    Vn = 1;
    var n = sn().MESSAGE,
        i = (function () {
            return t(
                function e(t) {
                    (!(function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, e),
                        (this.template = t));
                },
                [
                    {
                        key: 'transform',
                        value: function (e) {
                            return ((e[n] = this.template(e)), e);
                        },
                    },
                ]
            );
        })();
    return (
        (Zn.exports = function (e) {
            return new i(e);
        }),
        (Zn.exports.Printf = Zn.exports.Format = i),
        Zn.exports
    );
}
function Qn() {
    if (Yn) return qn;
    Yn = 1;
    var e = b(),
        t = sn().MESSAGE,
        r = Fn();
    return (qn = e(function (e) {
        var n = r(Object.assign({}, e, { level: void 0, message: void 0, splat: void 0 })),
            i = (e.padding && e.padding[e.level]) || '';
        return (
            (e[t] =
                '{}' !== n
                    ? ''.concat(e.level, ':').concat(i, ' ').concat(e.message, ' ').concat(n)
                    : ''.concat(e.level, ':').concat(i, ' ').concat(e.message)),
            e
        );
    }));
}
function ei() {
    if (Jn) return Kn;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e) {
        return (
            (function (e) {
                if (Array.isArray(e)) return r(e);
            })(e) ||
            (function (e) {
                if (
                    ('undefined' != typeof Symbol && null != e[Symbol.iterator]) ||
                    null != e['@@iterator']
                )
                    return Array.from(e);
            })(e) ||
            (function (e, t) {
                if (e) {
                    if ('string' == typeof e) return r(e, t);
                    var n = {}.toString.call(e).slice(8, -1);
                    return (
                        'Object' === n && e.constructor && (n = e.constructor.name),
                        'Map' === n || 'Set' === n
                            ? Array.from(e)
                            : 'Arguments' === n ||
                                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
                              ? r(e, t)
                              : void 0
                    );
                }
            })(e) ||
            (function () {
                throw new TypeError(
                    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
                );
            })()
        );
    }
    function r(e, t) {
        (null == t || t > e.length) && (t = e.length);
        for (var r = 0, n = Array(t); r < t; r++) n[r] = e[r];
        return n;
    }
    function n(e, t, r) {
        return (
            t &&
                (function (e, t) {
                    for (var r = 0; r < t.length; r++) {
                        var n = t[r];
                        ((n.enumerable = n.enumerable || !1),
                            (n.configurable = !0),
                            'value' in n && (n.writable = !0),
                            Object.defineProperty(e, i(n.key), n));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function i(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    Jn = 1;
    var o = vr(),
        a = sn().SPLAT,
        s = /%[scdjifoO%]/g,
        u = /%%/g,
        l = (function () {
            return n(
                function e(t) {
                    (!(function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, e),
                        (this.options = t));
                },
                [
                    {
                        key: '_splat',
                        value: function (e, r) {
                            var n = e.message,
                                i = e[a] || e.splat || [],
                                s = n.match(u),
                                l = (s && s.length) || 0,
                                c = r.length - l - i.length,
                                f = c < 0 ? i.splice(c, -1 * c) : [],
                                d = f.length;
                            if (d) for (var h = 0; h < d; h++) Object.assign(e, f[h]);
                            return ((e.message = o.format.apply(o, [n].concat(t(i)))), e);
                        },
                    },
                    {
                        key: 'transform',
                        value: function (e) {
                            var t = e.message,
                                r = e[a] || e.splat;
                            if (!r || !r.length) return e;
                            var n = t && t.match && t.match(s);
                            if (!n && (r || r.length)) {
                                var i = r.length > 1 ? r.splice(0) : r,
                                    o = i.length;
                                if (o) for (var u = 0; u < o; u++) Object.assign(e, i[u]);
                                return e;
                            }
                            return n ? this._splat(e, n) : e;
                        },
                    },
                ]
            );
        })();
    return (Kn = function (e) {
        return new l(e);
    });
}
var ti = /d{1,4}|M{1,4}|YY(?:YY)?|S{1,3}|Do|ZZ|Z|([HhMsDm])\1?|[aA]|"[^"]*"|'[^']*'/g,
    ri = '\\d\\d?',
    ni = '\\d\\d',
    ii = '[^\\s]+',
    oi = /\[([^]*?)\]/gm;
function ai(e, t) {
    for (var r = [], n = 0, i = e.length; n < i; n++) r.push(e[n].substr(0, t));
    return r;
}
var si = function (e) {
    return function (t, r) {
        var n = r[e]
            .map(function (e) {
                return e.toLowerCase();
            })
            .indexOf(t.toLowerCase());
        return n > -1 ? n : null;
    };
};
function ui(e) {
    for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
    for (var n = 0, i = t; n < i.length; n++) {
        var o = i[n];
        for (var a in o) e[a] = o[a];
    }
    return e;
}
var li = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ci = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    fi = ai(ci, 3),
    di = {
        dayNamesShort: ai(li, 3),
        dayNames: li,
        monthNamesShort: fi,
        monthNames: ci,
        amPm: ['am', 'pm'],
        DoFn: function (e) {
            return (
                e +
                ['th', 'st', 'nd', 'rd'][e % 10 > 3 ? 0 : ((e - (e % 10) != 10 ? 1 : 0) * e) % 10]
            );
        },
    },
    hi = ui({}, di),
    pi = function (e) {
        return (hi = ui(hi, e));
    },
    yi = function (e) {
        return e.replace(/[|\\{()[^$+*?.-]/g, '\\$&');
    },
    mi = function (e, t) {
        for (void 0 === t && (t = 2), e = String(e); e.length < t; ) e = '0' + e;
        return e;
    },
    gi = {
        D: function (e) {
            return String(e.getDate());
        },
        DD: function (e) {
            return mi(e.getDate());
        },
        Do: function (e, t) {
            return t.DoFn(e.getDate());
        },
        d: function (e) {
            return String(e.getDay());
        },
        dd: function (e) {
            return mi(e.getDay());
        },
        ddd: function (e, t) {
            return t.dayNamesShort[e.getDay()];
        },
        dddd: function (e, t) {
            return t.dayNames[e.getDay()];
        },
        M: function (e) {
            return String(e.getMonth() + 1);
        },
        MM: function (e) {
            return mi(e.getMonth() + 1);
        },
        MMM: function (e, t) {
            return t.monthNamesShort[e.getMonth()];
        },
        MMMM: function (e, t) {
            return t.monthNames[e.getMonth()];
        },
        YY: function (e) {
            return mi(String(e.getFullYear()), 4).substr(2);
        },
        YYYY: function (e) {
            return mi(e.getFullYear(), 4);
        },
        h: function (e) {
            return String(e.getHours() % 12 || 12);
        },
        hh: function (e) {
            return mi(e.getHours() % 12 || 12);
        },
        H: function (e) {
            return String(e.getHours());
        },
        HH: function (e) {
            return mi(e.getHours());
        },
        m: function (e) {
            return String(e.getMinutes());
        },
        mm: function (e) {
            return mi(e.getMinutes());
        },
        s: function (e) {
            return String(e.getSeconds());
        },
        ss: function (e) {
            return mi(e.getSeconds());
        },
        S: function (e) {
            return String(Math.round(e.getMilliseconds() / 100));
        },
        SS: function (e) {
            return mi(Math.round(e.getMilliseconds() / 10), 2);
        },
        SSS: function (e) {
            return mi(e.getMilliseconds(), 3);
        },
        a: function (e, t) {
            return e.getHours() < 12 ? t.amPm[0] : t.amPm[1];
        },
        A: function (e, t) {
            return e.getHours() < 12 ? t.amPm[0].toUpperCase() : t.amPm[1].toUpperCase();
        },
        ZZ: function (e) {
            var t = e.getTimezoneOffset();
            return (
                (t > 0 ? '-' : '+') + mi(100 * Math.floor(Math.abs(t) / 60) + (Math.abs(t) % 60), 4)
            );
        },
        Z: function (e) {
            var t = e.getTimezoneOffset();
            return (
                (t > 0 ? '-' : '+') +
                mi(Math.floor(Math.abs(t) / 60), 2) +
                ':' +
                mi(Math.abs(t) % 60, 2)
            );
        },
    },
    bi = function (e) {
        return +e - 1;
    },
    vi = [null, ri],
    wi = [null, ii],
    _i = [
        'isPm',
        ii,
        function (e, t) {
            var r = e.toLowerCase();
            return r === t.amPm[0] ? 0 : r === t.amPm[1] ? 1 : null;
        },
    ],
    Si = [
        'timezoneOffset',
        '[^\\s]*?[\\+\\-]\\d\\d:?\\d\\d|[^\\s]*?Z?',
        function (e) {
            var t = (e + '').match(/([+-]|\d\d)/gi);
            if (t) {
                var r = 60 * +t[1] + parseInt(t[2], 10);
                return '+' === t[0] ? r : -r;
            }
            return 0;
        },
    ],
    Ei = {
        D: ['day', ri],
        DD: ['day', ni],
        Do: [
            'day',
            ri + ii,
            function (e) {
                return parseInt(e, 10);
            },
        ],
        M: ['month', ri, bi],
        MM: ['month', ni, bi],
        YY: [
            'year',
            ni,
            function (e) {
                var t = +('' + new Date().getFullYear()).substr(0, 2);
                return +('' + (+e > 68 ? t - 1 : t) + e);
            },
        ],
        h: ['hour', ri, void 0, 'isPm'],
        hh: ['hour', ni, void 0, 'isPm'],
        H: ['hour', ri],
        HH: ['hour', ni],
        m: ['minute', ri],
        mm: ['minute', ni],
        s: ['second', ri],
        ss: ['second', ni],
        YYYY: ['year', '\\d{4}'],
        S: [
            'millisecond',
            '\\d',
            function (e) {
                return 100 * +e;
            },
        ],
        SS: [
            'millisecond',
            ni,
            function (e) {
                return 10 * +e;
            },
        ],
        SSS: ['millisecond', '\\d{3}'],
        d: vi,
        dd: vi,
        ddd: wi,
        dddd: wi,
        MMM: ['month', ii, si('monthNamesShort')],
        MMMM: ['month', ii, si('monthNames')],
        a: _i,
        A: _i,
        ZZ: Si,
        Z: Si,
    },
    ki = {
        default: 'ddd MMM DD YYYY HH:mm:ss',
        shortDate: 'M/D/YY',
        mediumDate: 'MMM D, YYYY',
        longDate: 'MMMM D, YYYY',
        fullDate: 'dddd, MMMM D, YYYY',
        isoDate: 'YYYY-MM-DD',
        isoDateTime: 'YYYY-MM-DDTHH:mm:ssZ',
        shortTime: 'HH:mm',
        mediumTime: 'HH:mm:ss',
        longTime: 'HH:mm:ss.SSS',
    },
    Oi = function (e) {
        return ui(ki, e);
    },
    Ti = function (e, t, r) {
        if (
            (void 0 === t && (t = ki.default),
            void 0 === r && (r = {}),
            'number' == typeof e && (e = new Date(e)),
            '[object Date]' !== Object.prototype.toString.call(e) || isNaN(e.getTime()))
        )
            throw new Error('Invalid Date pass to format');
        var n = [];
        t = (t = ki[t] || t).replace(oi, function (e, t) {
            return (n.push(t), '@@@');
        });
        var i = ui(ui({}, hi), r);
        return (t = t.replace(ti, function (t) {
            return gi[t](e, i);
        })).replace(/@@@/g, function () {
            return n.shift();
        });
    };
function Mi(e, t, r) {
    if ((void 0 === r && (r = {}), 'string' != typeof t))
        throw new Error('Invalid format in fecha parse');
    if (((t = ki[t] || t), e.length > 1e3)) return null;
    var n = {
            year: new Date().getFullYear(),
            month: 0,
            day: 1,
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0,
            isPm: null,
            timezoneOffset: null,
        },
        i = [],
        o = [],
        a = t.replace(oi, function (e, t) {
            return (o.push(yi(t)), '@@@');
        }),
        s = {},
        u = {};
    ((a = yi(a).replace(ti, function (e) {
        var t = Ei[e],
            r = t[0],
            n = t[1],
            o = t[3];
        if (s[r]) throw new Error('Invalid format. ' + r + ' specified twice in format');
        return ((s[r] = !0), o && (u[o] = !0), i.push(t), '(' + n + ')');
    })),
        Object.keys(u).forEach(function (e) {
            if (!s[e]) throw new Error('Invalid format. ' + e + ' is required in specified format');
        }),
        (a = a.replace(/@@@/g, function () {
            return o.shift();
        })));
    var l = e.match(new RegExp(a, 'i'));
    if (!l) return null;
    for (var c, f = ui(ui({}, hi), r), d = 1; d < l.length; d++) {
        var h = i[d - 1],
            p = h[0],
            y = h[2],
            m = y ? y(l[d], f) : +l[d];
        if (null == m) return null;
        n[p] = m;
    }
    if (
        (1 === n.isPm && null != n.hour && 12 !== +n.hour
            ? (n.hour = +n.hour + 12)
            : 0 === n.isPm && 12 === +n.hour && (n.hour = 0),
        null == n.timezoneOffset)
    ) {
        c = new Date(n.year, n.month, n.day, n.hour, n.minute, n.second, n.millisecond);
        for (
            var g = [
                    ['month', 'getMonth'],
                    ['day', 'getDate'],
                    ['hour', 'getHours'],
                    ['minute', 'getMinutes'],
                    ['second', 'getSeconds'],
                ],
                b = ((d = 0), g.length);
            d < b;
            d++
        )
            if (s[g[d][0]] && n[g[d][0]] !== c[g[d][1]]()) return null;
    } else if (
        ((c = new Date(
            Date.UTC(
                n.year,
                n.month,
                n.day,
                n.hour,
                n.minute - n.timezoneOffset,
                n.second,
                n.millisecond
            )
        )),
        n.month > 11 ||
            n.month < 0 ||
            n.day > 31 ||
            n.day < 1 ||
            n.hour > 23 ||
            n.hour < 0 ||
            n.minute > 59 ||
            n.minute < 0 ||
            n.second > 59 ||
            n.second < 0)
    )
        return null;
    return c;
}
var Ai = { format: Ti, parse: Mi, defaultI18n: di, setGlobalDateI18n: pi, setGlobalDateMasks: Oi };
const xi = h(
    Object.freeze(
        Object.defineProperty(
            {
                __proto__: null,
                assign: ui,
                default: Ai,
                defaultI18n: di,
                format: Ti,
                parse: Mi,
                setGlobalDateI18n: pi,
                setGlobalDateMasks: Oi,
            },
            Symbol.toStringTag,
            { value: 'Module' }
        )
    )
);
var Pi, Ri, ji, Ci, Li;
function Ii() {
    if (Ri) return Pi;
    Ri = 1;
    var e = xi,
        t = b();
    return (
        (Pi = t(function (t) {
            var r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            return (
                r.format &&
                    (t.timestamp =
                        'function' == typeof r.format
                            ? r.format()
                            : e.format(new Date(), r.format)),
                t.timestamp || (t.timestamp = new Date().toISOString()),
                r.alias && (t[r.alias] = t.timestamp),
                t
            );
        })),
        Pi
    );
}
function Di() {
    if (Ci) return ji;
    Ci = 1;
    var e = $r(),
        t = b(),
        r = sn().MESSAGE;
    return (ji = t(function (t, n) {
        return (
            !1 !== n.level && (t.level = e.strip(t.level)),
            !1 !== n.message && (t.message = e.strip(String(t.message))),
            !1 !== n.raw && t[r] && (t[r] = e.strip(String(t[r]))),
            t
        );
    }));
}
function Ni() {
    if (Li) return g;
    Li = 1;
    var e = (g.format = b());
    return (
        (g.levels = (function () {
            if (tn) return en;
            tn = 1;
            var e = un().Colorizer;
            return (en = function (t) {
                return (e.addColors(t.colors || t), t);
            });
        })()),
        Object.defineProperty(e, 'align', { value: ln() }),
        Object.defineProperty(e, 'cli', { value: yn() }),
        Object.defineProperty(e, 'colorize', { value: un() }),
        Object.defineProperty(e, 'combine', { value: wn() }),
        Object.defineProperty(e, 'errors', { value: _n() }),
        Object.defineProperty(e, 'json', { value: Bn() }),
        Object.defineProperty(e, 'label', { value: Un() }),
        Object.defineProperty(e, 'logstash', { value: zn() }),
        Object.defineProperty(e, 'metadata', { value: Gn() }),
        Object.defineProperty(e, 'ms', { value: Wn() }),
        Object.defineProperty(e, 'padLevels', { value: pn() }),
        Object.defineProperty(e, 'prettyPrint', { value: Hn() }),
        Object.defineProperty(e, 'printf', { value: Xn() }),
        Object.defineProperty(e, 'simple', { value: Qn() }),
        Object.defineProperty(e, 'splat', { value: ei() }),
        Object.defineProperty(e, 'timestamp', { value: Ii() }),
        Object.defineProperty(e, 'uncolorize', { value: Di() }),
        g
    );
}
var Fi,
    Bi = {};
function Ui() {
    return (
        Fi ||
            ((Fi = 1),
            (e = Bi),
            (t = vr().format),
            (e.warn = {
                deprecated: function (e) {
                    return function () {
                        throw new Error(t('{ %s } was removed in winston@3.0.0.', e));
                    };
                },
                useFormat: function (e) {
                    return function () {
                        throw new Error(
                            [
                                t('{ %s } was removed in winston@3.0.0.', e),
                                'Use a custom winston.format = winston.format(function) instead.',
                            ].join('\n')
                        );
                    };
                },
                forFunctions: function (t, r, n) {
                    n.forEach(function (n) {
                        t[n] = e.warn[r](n);
                    });
                },
                forProperties: function (t, r, n) {
                    n.forEach(function (n) {
                        var i = e.warn[r](n);
                        Object.defineProperty(t, n, { get: i, set: i });
                    });
                },
            })),
        Bi
    );
    var e, t;
}
const zi = '3.18.3';
var Gi,
    $i,
    Wi = {},
    Hi = { exports: {} },
    Vi = { exports: {} };
function qi() {
    if ($i) return Gi;
    function e(e) {
        try {
            if (!f.localStorage) return !1;
        } catch (r) {
            return !1;
        }
        var t = f.localStorage[e];
        return null != t && 'true' === String(t).toLowerCase();
    }
    return (
        ($i = 1),
        (Gi = function (t, r) {
            if (e('noDeprecation')) return t;
            var n = !1;
            return function () {
                if (!n) {
                    if (e('throwDeprecation')) throw new Error(r);
                    (e('traceDeprecation'), (n = !0));
                }
                return t.apply(this, arguments);
            };
        }),
        Gi
    );
}
var Yi,
    Ki,
    Ji,
    Zi = { exports: {} };
function Xi() {
    if (Yi) return Zi.exports;
    Yi = 1;
    var e,
        t = 'object' == typeof Reflect ? Reflect : null,
        r =
            t && 'function' == typeof t.apply
                ? t.apply
                : function (e, t, r) {
                      return Function.prototype.apply.call(e, t, r);
                  };
    e =
        t && 'function' == typeof t.ownKeys
            ? t.ownKeys
            : Object.getOwnPropertySymbols
              ? function (e) {
                    return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
                }
              : function (e) {
                    return Object.getOwnPropertyNames(e);
                };
    var n =
        Number.isNaN ||
        function (e) {
            return e != e;
        };
    function i() {
        i.init.call(this);
    }
    ((Zi.exports = i),
        (Zi.exports.once = function (e, t) {
            return new Promise(function (r, n) {
                function i(r) {
                    (e.removeListener(t, o), n(r));
                }
                function o() {
                    ('function' == typeof e.removeListener && e.removeListener('error', i),
                        r([].slice.call(arguments)));
                }
                (p(e, t, o, { once: !0 }),
                    'error' !== t &&
                        (function (e, t, r) {
                            'function' == typeof e.on && p(e, 'error', t, r);
                        })(e, i, { once: !0 }));
            });
        }),
        (i.EventEmitter = i),
        (i.prototype._events = void 0),
        (i.prototype._eventsCount = 0),
        (i.prototype._maxListeners = void 0));
    var o = 10;
    function a(e) {
        if ('function' != typeof e)
            throw new TypeError(
                'The "listener" argument must be of type Function. Received type ' + typeof e
            );
    }
    function s(e) {
        return void 0 === e._maxListeners ? i.defaultMaxListeners : e._maxListeners;
    }
    function u(e, t, r, n) {
        var i, o, u;
        if (
            (a(r),
            void 0 === (o = e._events)
                ? ((o = e._events = Object.create(null)), (e._eventsCount = 0))
                : (void 0 !== o.newListener &&
                      (e.emit('newListener', t, r.listener ? r.listener : r), (o = e._events)),
                  (u = o[t])),
            void 0 === u)
        )
            ((u = o[t] = r), ++e._eventsCount);
        else if (
            ('function' == typeof u
                ? (u = o[t] = n ? [r, u] : [u, r])
                : n
                  ? u.unshift(r)
                  : u.push(r),
            (i = s(e)) > 0 && u.length > i && !u.warned)
        ) {
            u.warned = !0;
            var l = new Error(
                'Possible EventEmitter memory leak detected. ' +
                    u.length +
                    ' ' +
                    String(t) +
                    ' listeners added. Use emitter.setMaxListeners() to increase limit'
            );
            ((l.name = 'MaxListenersExceededWarning'),
                (l.emitter = e),
                (l.type = t),
                (l.count = u.length),
                console && console.warn);
        }
        return e;
    }
    function l() {
        if (!this.fired)
            return (
                this.target.removeListener(this.type, this.wrapFn),
                (this.fired = !0),
                0 === arguments.length
                    ? this.listener.call(this.target)
                    : this.listener.apply(this.target, arguments)
            );
    }
    function c(e, t, r) {
        var n = { fired: !1, wrapFn: void 0, target: e, type: t, listener: r },
            i = l.bind(n);
        return ((i.listener = r), (n.wrapFn = i), i);
    }
    function f(e, t, r) {
        var n = e._events;
        if (void 0 === n) return [];
        var i = n[t];
        return void 0 === i
            ? []
            : 'function' == typeof i
              ? r
                  ? [i.listener || i]
                  : [i]
              : r
                ? (function (e) {
                      for (var t = new Array(e.length), r = 0; r < t.length; ++r)
                          t[r] = e[r].listener || e[r];
                      return t;
                  })(i)
                : h(i, i.length);
    }
    function d(e) {
        var t = this._events;
        if (void 0 !== t) {
            var r = t[e];
            if ('function' == typeof r) return 1;
            if (void 0 !== r) return r.length;
        }
        return 0;
    }
    function h(e, t) {
        for (var r = new Array(t), n = 0; n < t; ++n) r[n] = e[n];
        return r;
    }
    function p(e, t, r, n) {
        if ('function' == typeof e.on) n.once ? e.once(t, r) : e.on(t, r);
        else {
            if ('function' != typeof e.addEventListener)
                throw new TypeError(
                    'The "emitter" argument must be of type EventEmitter. Received type ' + typeof e
                );
            e.addEventListener(t, function i(o) {
                (n.once && e.removeEventListener(t, i), r(o));
            });
        }
    }
    return (
        Object.defineProperty(i, 'defaultMaxListeners', {
            enumerable: !0,
            get: function () {
                return o;
            },
            set: function (e) {
                if ('number' != typeof e || e < 0 || n(e))
                    throw new RangeError(
                        'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' +
                            e +
                            '.'
                    );
                o = e;
            },
        }),
        (i.init = function () {
            ((void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events) ||
                ((this._events = Object.create(null)), (this._eventsCount = 0)),
                (this._maxListeners = this._maxListeners || void 0));
        }),
        (i.prototype.setMaxListeners = function (e) {
            if ('number' != typeof e || e < 0 || n(e))
                throw new RangeError(
                    'The value of "n" is out of range. It must be a non-negative number. Received ' +
                        e +
                        '.'
                );
            return ((this._maxListeners = e), this);
        }),
        (i.prototype.getMaxListeners = function () {
            return s(this);
        }),
        (i.prototype.emit = function (e) {
            for (var t = [], n = 1; n < arguments.length; n++) t.push(arguments[n]);
            var i = 'error' === e,
                o = this._events;
            if (void 0 !== o) i = i && void 0 === o.error;
            else if (!i) return !1;
            if (i) {
                var a;
                if ((t.length > 0 && (a = t[0]), a instanceof Error)) throw a;
                var s = new Error('Unhandled error.' + (a ? ' (' + a.message + ')' : ''));
                throw ((s.context = a), s);
            }
            var u = o[e];
            if (void 0 === u) return !1;
            if ('function' == typeof u) r(u, this, t);
            else {
                var l = u.length,
                    c = h(u, l);
                for (n = 0; n < l; ++n) r(c[n], this, t);
            }
            return !0;
        }),
        (i.prototype.addListener = function (e, t) {
            return u(this, e, t, !1);
        }),
        (i.prototype.on = i.prototype.addListener),
        (i.prototype.prependListener = function (e, t) {
            return u(this, e, t, !0);
        }),
        (i.prototype.once = function (e, t) {
            return (a(t), this.on(e, c(this, e, t)), this);
        }),
        (i.prototype.prependOnceListener = function (e, t) {
            return (a(t), this.prependListener(e, c(this, e, t)), this);
        }),
        (i.prototype.removeListener = function (e, t) {
            var r, n, i, o, s;
            if ((a(t), void 0 === (n = this._events))) return this;
            if (void 0 === (r = n[e])) return this;
            if (r === t || r.listener === t)
                0 === --this._eventsCount
                    ? (this._events = Object.create(null))
                    : (delete n[e],
                      n.removeListener && this.emit('removeListener', e, r.listener || t));
            else if ('function' != typeof r) {
                for (i = -1, o = r.length - 1; o >= 0; o--)
                    if (r[o] === t || r[o].listener === t) {
                        ((s = r[o].listener), (i = o));
                        break;
                    }
                if (i < 0) return this;
                (0 === i
                    ? r.shift()
                    : (function (e, t) {
                          for (; t + 1 < e.length; t++) e[t] = e[t + 1];
                          e.pop();
                      })(r, i),
                    1 === r.length && (n[e] = r[0]),
                    void 0 !== n.removeListener && this.emit('removeListener', e, s || t));
            }
            return this;
        }),
        (i.prototype.off = i.prototype.removeListener),
        (i.prototype.removeAllListeners = function (e) {
            var t, r, n;
            if (void 0 === (r = this._events)) return this;
            if (void 0 === r.removeListener)
                return (
                    0 === arguments.length
                        ? ((this._events = Object.create(null)), (this._eventsCount = 0))
                        : void 0 !== r[e] &&
                          (0 === --this._eventsCount
                              ? (this._events = Object.create(null))
                              : delete r[e]),
                    this
                );
            if (0 === arguments.length) {
                var i,
                    o = Object.keys(r);
                for (n = 0; n < o.length; ++n)
                    'removeListener' !== (i = o[n]) && this.removeAllListeners(i);
                return (
                    this.removeAllListeners('removeListener'),
                    (this._events = Object.create(null)),
                    (this._eventsCount = 0),
                    this
                );
            }
            if ('function' == typeof (t = r[e])) this.removeListener(e, t);
            else if (void 0 !== t) for (n = t.length - 1; n >= 0; n--) this.removeListener(e, t[n]);
            return this;
        }),
        (i.prototype.listeners = function (e) {
            return f(this, e, !0);
        }),
        (i.prototype.rawListeners = function (e) {
            return f(this, e, !1);
        }),
        (i.listenerCount = function (e, t) {
            return 'function' == typeof e.listenerCount ? e.listenerCount(t) : d.call(e, t);
        }),
        (i.prototype.listenerCount = d),
        (i.prototype.eventNames = function () {
            return this._eventsCount > 0 ? e(this._events) : [];
        }),
        Zi.exports
    );
}
function Qi() {
    return Ji ? Ki : ((Ji = 1), (Ki = Xi().EventEmitter));
}
var eo,
    to = {},
    ro = {};
var no,
    io,
    oo,
    ao,
    so = {};
function uo() {
    return (
        io ||
            ((io = 1),
            (function (e) {
                var t = (function () {
                        if (eo) return ro;
                        ((eo = 1),
                            (ro.byteLength = function (e) {
                                var t = o(e),
                                    r = t[0],
                                    n = t[1];
                                return (3 * (r + n)) / 4 - n;
                            }),
                            (ro.toByteArray = function (e) {
                                var n,
                                    i,
                                    a = o(e),
                                    s = a[0],
                                    u = a[1],
                                    l = new r(
                                        (function (e, t, r) {
                                            return (3 * (t + r)) / 4 - r;
                                        })(0, s, u)
                                    ),
                                    c = 0,
                                    f = u > 0 ? s - 4 : s;
                                for (i = 0; i < f; i += 4)
                                    ((n =
                                        (t[e.charCodeAt(i)] << 18) |
                                        (t[e.charCodeAt(i + 1)] << 12) |
                                        (t[e.charCodeAt(i + 2)] << 6) |
                                        t[e.charCodeAt(i + 3)]),
                                        (l[c++] = (n >> 16) & 255),
                                        (l[c++] = (n >> 8) & 255),
                                        (l[c++] = 255 & n));
                                return (
                                    2 === u &&
                                        ((n =
                                            (t[e.charCodeAt(i)] << 2) |
                                            (t[e.charCodeAt(i + 1)] >> 4)),
                                        (l[c++] = 255 & n)),
                                    1 === u &&
                                        ((n =
                                            (t[e.charCodeAt(i)] << 10) |
                                            (t[e.charCodeAt(i + 1)] << 4) |
                                            (t[e.charCodeAt(i + 2)] >> 2)),
                                        (l[c++] = (n >> 8) & 255),
                                        (l[c++] = 255 & n)),
                                    l
                                );
                            }),
                            (ro.fromByteArray = function (t) {
                                for (
                                    var r,
                                        n = t.length,
                                        i = n % 3,
                                        o = [],
                                        a = 16383,
                                        u = 0,
                                        l = n - i;
                                    u < l;
                                    u += a
                                )
                                    o.push(s(t, u, u + a > l ? l : u + a));
                                return (
                                    1 === i
                                        ? ((r = t[n - 1]),
                                          o.push(e[r >> 2] + e[(r << 4) & 63] + '=='))
                                        : 2 === i &&
                                          ((r = (t[n - 2] << 8) + t[n - 1]),
                                          o.push(
                                              e[r >> 10] + e[(r >> 4) & 63] + e[(r << 2) & 63] + '='
                                          )),
                                    o.join('')
                                );
                            }));
                        for (
                            var e = [],
                                t = [],
                                r = 'undefined' != typeof Uint8Array ? Uint8Array : Array,
                                n =
                                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                                i = 0;
                            i < 64;
                            ++i
                        )
                            ((e[i] = n[i]), (t[n.charCodeAt(i)] = i));
                        function o(e) {
                            var t = e.length;
                            if (t % 4 > 0)
                                throw new Error('Invalid string. Length must be a multiple of 4');
                            var r = e.indexOf('=');
                            return (-1 === r && (r = t), [r, r === t ? 0 : 4 - (r % 4)]);
                        }
                        function a(t) {
                            return (
                                e[(t >> 18) & 63] + e[(t >> 12) & 63] + e[(t >> 6) & 63] + e[63 & t]
                            );
                        }
                        function s(e, t, r) {
                            for (var n, i = [], o = t; o < r; o += 3)
                                ((n =
                                    ((e[o] << 16) & 16711680) +
                                    ((e[o + 1] << 8) & 65280) +
                                    (255 & e[o + 2])),
                                    i.push(a(n)));
                            return i.join('');
                        }
                        return ((t['-'.charCodeAt(0)] = 62), (t['_'.charCodeAt(0)] = 63), ro);
                    })(),
                    r =
                        (no ||
                            ((no = 1),
                            (so.read = function (e, t, r, n, i) {
                                var o,
                                    a,
                                    s = 8 * i - n - 1,
                                    u = (1 << s) - 1,
                                    l = u >> 1,
                                    c = -7,
                                    f = r ? i - 1 : 0,
                                    d = r ? -1 : 1,
                                    h = e[t + f];
                                for (
                                    f += d, o = h & ((1 << -c) - 1), h >>= -c, c += s;
                                    c > 0;
                                    o = 256 * o + e[t + f], f += d, c -= 8
                                );
                                for (
                                    a = o & ((1 << -c) - 1), o >>= -c, c += n;
                                    c > 0;
                                    a = 256 * a + e[t + f], f += d, c -= 8
                                );
                                if (0 === o) o = 1 - l;
                                else {
                                    if (o === u) return a ? NaN : (1 / 0) * (h ? -1 : 1);
                                    ((a += Math.pow(2, n)), (o -= l));
                                }
                                return (h ? -1 : 1) * a * Math.pow(2, o - n);
                            }),
                            (so.write = function (e, t, r, n, i, o) {
                                var a,
                                    s,
                                    u,
                                    l = 8 * o - i - 1,
                                    c = (1 << l) - 1,
                                    f = c >> 1,
                                    d = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                                    h = n ? 0 : o - 1,
                                    p = n ? 1 : -1,
                                    y = t < 0 || (0 === t && 1 / t < 0) ? 1 : 0;
                                for (
                                    t = Math.abs(t),
                                        isNaN(t) || t === 1 / 0
                                            ? ((s = isNaN(t) ? 1 : 0), (a = c))
                                            : ((a = Math.floor(Math.log(t) / Math.LN2)),
                                              t * (u = Math.pow(2, -a)) < 1 && (a--, (u *= 2)),
                                              (t += a + f >= 1 ? d / u : d * Math.pow(2, 1 - f)) *
                                                  u >=
                                                  2 && (a++, (u /= 2)),
                                              a + f >= c
                                                  ? ((s = 0), (a = c))
                                                  : a + f >= 1
                                                    ? ((s = (t * u - 1) * Math.pow(2, i)), (a += f))
                                                    : ((s =
                                                          t * Math.pow(2, f - 1) * Math.pow(2, i)),
                                                      (a = 0)));
                                    i >= 8;
                                    e[r + h] = 255 & s, h += p, s /= 256, i -= 8
                                );
                                for (
                                    a = (a << i) | s, l += i;
                                    l > 0;
                                    e[r + h] = 255 & a, h += p, a /= 256, l -= 8
                                );
                                e[r + h - p] |= 128 * y;
                            })),
                        so);
                ((e.Buffer = o),
                    (e.SlowBuffer = function (e) {
                        +e != e && (e = 0);
                        return o.alloc(+e);
                    }),
                    (e.INSPECT_MAX_BYTES = 50));
                var n = 2147483647;
                function i(e) {
                    if (e > n)
                        throw new RangeError('The value "' + e + '" is invalid for option "size"');
                    var t = new Uint8Array(e);
                    return ((t.__proto__ = o.prototype), t);
                }
                function o(e, t, r) {
                    if ('number' == typeof e) {
                        if ('string' == typeof t)
                            throw new TypeError(
                                'The "string" argument must be of type string. Received type number'
                            );
                        return u(e);
                    }
                    return a(e, t, r);
                }
                function a(e, t, r) {
                    if ('string' == typeof e)
                        return (function (e, t) {
                            ('string' == typeof t && '' !== t) || (t = 'utf8');
                            if (!o.isEncoding(t)) throw new TypeError('Unknown encoding: ' + t);
                            var r = 0 | f(e, t),
                                n = i(r),
                                a = n.write(e, t);
                            a !== r && (n = n.slice(0, a));
                            return n;
                        })(e, t);
                    if (ArrayBuffer.isView(e)) return l(e);
                    if (null == e)
                        throw TypeError(
                            'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                                typeof e
                        );
                    if (B(e, ArrayBuffer) || (e && B(e.buffer, ArrayBuffer)))
                        return (function (e, t, r) {
                            if (t < 0 || e.byteLength < t)
                                throw new RangeError('"offset" is outside of buffer bounds');
                            if (e.byteLength < t + (r || 0))
                                throw new RangeError('"length" is outside of buffer bounds');
                            var n;
                            n =
                                void 0 === t && void 0 === r
                                    ? new Uint8Array(e)
                                    : void 0 === r
                                      ? new Uint8Array(e, t)
                                      : new Uint8Array(e, t, r);
                            return ((n.__proto__ = o.prototype), n);
                        })(e, t, r);
                    if ('number' == typeof e)
                        throw new TypeError(
                            'The "value" argument must not be of type number. Received type number'
                        );
                    var n = e.valueOf && e.valueOf();
                    if (null != n && n !== e) return o.from(n, t, r);
                    var a = (function (e) {
                        if (o.isBuffer(e)) {
                            var t = 0 | c(e.length),
                                r = i(t);
                            return (0 === r.length || e.copy(r, 0, 0, t), r);
                        }
                        if (void 0 !== e.length)
                            return 'number' != typeof e.length || U(e.length) ? i(0) : l(e);
                        if ('Buffer' === e.type && Array.isArray(e.data)) return l(e.data);
                    })(e);
                    if (a) return a;
                    if (
                        'undefined' != typeof Symbol &&
                        null != Symbol.toPrimitive &&
                        'function' == typeof e[Symbol.toPrimitive]
                    )
                        return o.from(e[Symbol.toPrimitive]('string'), t, r);
                    throw new TypeError(
                        'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                            typeof e
                    );
                }
                function s(e) {
                    if ('number' != typeof e)
                        throw new TypeError('"size" argument must be of type number');
                    if (e < 0)
                        throw new RangeError('The value "' + e + '" is invalid for option "size"');
                }
                function u(e) {
                    return (s(e), i(e < 0 ? 0 : 0 | c(e)));
                }
                function l(e) {
                    for (var t = e.length < 0 ? 0 : 0 | c(e.length), r = i(t), n = 0; n < t; n += 1)
                        r[n] = 255 & e[n];
                    return r;
                }
                function c(e) {
                    if (e >= n)
                        throw new RangeError(
                            'Attempt to allocate Buffer larger than maximum size: 0x' +
                                n.toString(16) +
                                ' bytes'
                        );
                    return 0 | e;
                }
                function f(e, t) {
                    if (o.isBuffer(e)) return e.length;
                    if (ArrayBuffer.isView(e) || B(e, ArrayBuffer)) return e.byteLength;
                    if ('string' != typeof e)
                        throw new TypeError(
                            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' +
                                typeof e
                        );
                    var r = e.length,
                        n = arguments.length > 2 && !0 === arguments[2];
                    if (!n && 0 === r) return 0;
                    for (var i = !1; ; )
                        switch (t) {
                            case 'ascii':
                            case 'latin1':
                            case 'binary':
                                return r;
                            case 'utf8':
                            case 'utf-8':
                                return D(e).length;
                            case 'ucs2':
                            case 'ucs-2':
                            case 'utf16le':
                            case 'utf-16le':
                                return 2 * r;
                            case 'hex':
                                return r >>> 1;
                            case 'base64':
                                return N(e).length;
                            default:
                                if (i) return n ? -1 : D(e).length;
                                ((t = ('' + t).toLowerCase()), (i = !0));
                        }
                }
                function d(e, t, r) {
                    var n = !1;
                    if (((void 0 === t || t < 0) && (t = 0), t > this.length)) return '';
                    if (((void 0 === r || r > this.length) && (r = this.length), r <= 0)) return '';
                    if ((r >>>= 0) <= (t >>>= 0)) return '';
                    for (e || (e = 'utf8'); ; )
                        switch (e) {
                            case 'hex':
                                return M(this, t, r);
                            case 'utf8':
                            case 'utf-8':
                                return E(this, t, r);
                            case 'ascii':
                                return O(this, t, r);
                            case 'latin1':
                            case 'binary':
                                return T(this, t, r);
                            case 'base64':
                                return S(this, t, r);
                            case 'ucs2':
                            case 'ucs-2':
                            case 'utf16le':
                            case 'utf-16le':
                                return A(this, t, r);
                            default:
                                if (n) throw new TypeError('Unknown encoding: ' + e);
                                ((e = (e + '').toLowerCase()), (n = !0));
                        }
                }
                function h(e, t, r) {
                    var n = e[t];
                    ((e[t] = e[r]), (e[r] = n));
                }
                function p(e, t, r, n, i) {
                    if (0 === e.length) return -1;
                    if (
                        ('string' == typeof r
                            ? ((n = r), (r = 0))
                            : r > 2147483647
                              ? (r = 2147483647)
                              : r < -2147483648 && (r = -2147483648),
                        U((r = +r)) && (r = i ? 0 : e.length - 1),
                        r < 0 && (r = e.length + r),
                        r >= e.length)
                    ) {
                        if (i) return -1;
                        r = e.length - 1;
                    } else if (r < 0) {
                        if (!i) return -1;
                        r = 0;
                    }
                    if (('string' == typeof t && (t = o.from(t, n)), o.isBuffer(t)))
                        return 0 === t.length ? -1 : y(e, t, r, n, i);
                    if ('number' == typeof t)
                        return (
                            (t &= 255),
                            'function' == typeof Uint8Array.prototype.indexOf
                                ? i
                                    ? Uint8Array.prototype.indexOf.call(e, t, r)
                                    : Uint8Array.prototype.lastIndexOf.call(e, t, r)
                                : y(e, [t], r, n, i)
                        );
                    throw new TypeError('val must be string, number or Buffer');
                }
                function y(e, t, r, n, i) {
                    var o,
                        a = 1,
                        s = e.length,
                        u = t.length;
                    if (
                        void 0 !== n &&
                        ('ucs2' === (n = String(n).toLowerCase()) ||
                            'ucs-2' === n ||
                            'utf16le' === n ||
                            'utf-16le' === n)
                    ) {
                        if (e.length < 2 || t.length < 2) return -1;
                        ((a = 2), (s /= 2), (u /= 2), (r /= 2));
                    }
                    function l(e, t) {
                        return 1 === a ? e[t] : e.readUInt16BE(t * a);
                    }
                    if (i) {
                        var c = -1;
                        for (o = r; o < s; o++)
                            if (l(e, o) === l(t, -1 === c ? 0 : o - c)) {
                                if ((-1 === c && (c = o), o - c + 1 === u)) return c * a;
                            } else (-1 !== c && (o -= o - c), (c = -1));
                    } else
                        for (r + u > s && (r = s - u), o = r; o >= 0; o--) {
                            for (var f = !0, d = 0; d < u; d++)
                                if (l(e, o + d) !== l(t, d)) {
                                    f = !1;
                                    break;
                                }
                            if (f) return o;
                        }
                    return -1;
                }
                function m(e, t, r, n) {
                    r = Number(r) || 0;
                    var i = e.length - r;
                    n ? (n = Number(n)) > i && (n = i) : (n = i);
                    var o = t.length;
                    n > o / 2 && (n = o / 2);
                    for (var a = 0; a < n; ++a) {
                        var s = parseInt(t.substr(2 * a, 2), 16);
                        if (U(s)) return a;
                        e[r + a] = s;
                    }
                    return a;
                }
                function g(e, t, r, n) {
                    return F(D(t, e.length - r), e, r, n);
                }
                function b(e, t, r, n) {
                    return F(
                        (function (e) {
                            for (var t = [], r = 0; r < e.length; ++r)
                                t.push(255 & e.charCodeAt(r));
                            return t;
                        })(t),
                        e,
                        r,
                        n
                    );
                }
                function v(e, t, r, n) {
                    return b(e, t, r, n);
                }
                function w(e, t, r, n) {
                    return F(N(t), e, r, n);
                }
                function _(e, t, r, n) {
                    return F(
                        (function (e, t) {
                            for (var r, n, i, o = [], a = 0; a < e.length && !((t -= 2) < 0); ++a)
                                ((n = (r = e.charCodeAt(a)) >> 8),
                                    (i = r % 256),
                                    o.push(i),
                                    o.push(n));
                            return o;
                        })(t, e.length - r),
                        e,
                        r,
                        n
                    );
                }
                function S(e, r, n) {
                    return 0 === r && n === e.length
                        ? t.fromByteArray(e)
                        : t.fromByteArray(e.slice(r, n));
                }
                function E(e, t, r) {
                    r = Math.min(e.length, r);
                    for (var n = [], i = t; i < r; ) {
                        var o,
                            a,
                            s,
                            u,
                            l = e[i],
                            c = null,
                            f = l > 239 ? 4 : l > 223 ? 3 : l > 191 ? 2 : 1;
                        if (i + f <= r)
                            switch (f) {
                                case 1:
                                    l < 128 && (c = l);
                                    break;
                                case 2:
                                    128 == (192 & (o = e[i + 1])) &&
                                        (u = ((31 & l) << 6) | (63 & o)) > 127 &&
                                        (c = u);
                                    break;
                                case 3:
                                    ((o = e[i + 1]),
                                        (a = e[i + 2]),
                                        128 == (192 & o) &&
                                            128 == (192 & a) &&
                                            (u = ((15 & l) << 12) | ((63 & o) << 6) | (63 & a)) >
                                                2047 &&
                                            (u < 55296 || u > 57343) &&
                                            (c = u));
                                    break;
                                case 4:
                                    ((o = e[i + 1]),
                                        (a = e[i + 2]),
                                        (s = e[i + 3]),
                                        128 == (192 & o) &&
                                            128 == (192 & a) &&
                                            128 == (192 & s) &&
                                            (u =
                                                ((15 & l) << 18) |
                                                ((63 & o) << 12) |
                                                ((63 & a) << 6) |
                                                (63 & s)) > 65535 &&
                                            u < 1114112 &&
                                            (c = u));
                            }
                        (null === c
                            ? ((c = 65533), (f = 1))
                            : c > 65535 &&
                              ((c -= 65536),
                              n.push(((c >>> 10) & 1023) | 55296),
                              (c = 56320 | (1023 & c))),
                            n.push(c),
                            (i += f));
                    }
                    return (function (e) {
                        var t = e.length;
                        if (t <= k) return String.fromCharCode.apply(String, e);
                        var r = '',
                            n = 0;
                        for (; n < t; )
                            r += String.fromCharCode.apply(String, e.slice(n, (n += k)));
                        return r;
                    })(n);
                }
                ((e.kMaxLength = n),
                    (o.TYPED_ARRAY_SUPPORT = (function () {
                        try {
                            var e = new Uint8Array(1);
                            return (
                                (e.__proto__ = {
                                    __proto__: Uint8Array.prototype,
                                    foo: function () {
                                        return 42;
                                    },
                                }),
                                42 === e.foo()
                            );
                        } catch (t) {
                            return !1;
                        }
                    })()),
                    !o.TYPED_ARRAY_SUPPORT && 'undefined' != typeof console && console.error,
                    Object.defineProperty(o.prototype, 'parent', {
                        enumerable: !0,
                        get: function () {
                            if (o.isBuffer(this)) return this.buffer;
                        },
                    }),
                    Object.defineProperty(o.prototype, 'offset', {
                        enumerable: !0,
                        get: function () {
                            if (o.isBuffer(this)) return this.byteOffset;
                        },
                    }),
                    'undefined' != typeof Symbol &&
                        null != Symbol.species &&
                        o[Symbol.species] === o &&
                        Object.defineProperty(o, Symbol.species, {
                            value: null,
                            configurable: !0,
                            enumerable: !1,
                            writable: !1,
                        }),
                    (o.poolSize = 8192),
                    (o.from = function (e, t, r) {
                        return a(e, t, r);
                    }),
                    (o.prototype.__proto__ = Uint8Array.prototype),
                    (o.__proto__ = Uint8Array),
                    (o.alloc = function (e, t, r) {
                        return (function (e, t, r) {
                            return (
                                s(e),
                                e <= 0
                                    ? i(e)
                                    : void 0 !== t
                                      ? 'string' == typeof r
                                          ? i(e).fill(t, r)
                                          : i(e).fill(t)
                                      : i(e)
                            );
                        })(e, t, r);
                    }),
                    (o.allocUnsafe = function (e) {
                        return u(e);
                    }),
                    (o.allocUnsafeSlow = function (e) {
                        return u(e);
                    }),
                    (o.isBuffer = function (e) {
                        return null != e && !0 === e._isBuffer && e !== o.prototype;
                    }),
                    (o.compare = function (e, t) {
                        if (
                            (B(e, Uint8Array) && (e = o.from(e, e.offset, e.byteLength)),
                            B(t, Uint8Array) && (t = o.from(t, t.offset, t.byteLength)),
                            !o.isBuffer(e) || !o.isBuffer(t))
                        )
                            throw new TypeError(
                                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                            );
                        if (e === t) return 0;
                        for (var r = e.length, n = t.length, i = 0, a = Math.min(r, n); i < a; ++i)
                            if (e[i] !== t[i]) {
                                ((r = e[i]), (n = t[i]));
                                break;
                            }
                        return r < n ? -1 : n < r ? 1 : 0;
                    }),
                    (o.isEncoding = function (e) {
                        switch (String(e).toLowerCase()) {
                            case 'hex':
                            case 'utf8':
                            case 'utf-8':
                            case 'ascii':
                            case 'latin1':
                            case 'binary':
                            case 'base64':
                            case 'ucs2':
                            case 'ucs-2':
                            case 'utf16le':
                            case 'utf-16le':
                                return !0;
                            default:
                                return !1;
                        }
                    }),
                    (o.concat = function (e, t) {
                        if (!Array.isArray(e))
                            throw new TypeError('"list" argument must be an Array of Buffers');
                        if (0 === e.length) return o.alloc(0);
                        var r;
                        if (void 0 === t) for (t = 0, r = 0; r < e.length; ++r) t += e[r].length;
                        var n = o.allocUnsafe(t),
                            i = 0;
                        for (r = 0; r < e.length; ++r) {
                            var a = e[r];
                            if ((B(a, Uint8Array) && (a = o.from(a)), !o.isBuffer(a)))
                                throw new TypeError('"list" argument must be an Array of Buffers');
                            (a.copy(n, i), (i += a.length));
                        }
                        return n;
                    }),
                    (o.byteLength = f),
                    (o.prototype._isBuffer = !0),
                    (o.prototype.swap16 = function () {
                        var e = this.length;
                        if (e % 2 != 0)
                            throw new RangeError('Buffer size must be a multiple of 16-bits');
                        for (var t = 0; t < e; t += 2) h(this, t, t + 1);
                        return this;
                    }),
                    (o.prototype.swap32 = function () {
                        var e = this.length;
                        if (e % 4 != 0)
                            throw new RangeError('Buffer size must be a multiple of 32-bits');
                        for (var t = 0; t < e; t += 4) (h(this, t, t + 3), h(this, t + 1, t + 2));
                        return this;
                    }),
                    (o.prototype.swap64 = function () {
                        var e = this.length;
                        if (e % 8 != 0)
                            throw new RangeError('Buffer size must be a multiple of 64-bits');
                        for (var t = 0; t < e; t += 8)
                            (h(this, t, t + 7),
                                h(this, t + 1, t + 6),
                                h(this, t + 2, t + 5),
                                h(this, t + 3, t + 4));
                        return this;
                    }),
                    (o.prototype.toString = function () {
                        var e = this.length;
                        return 0 === e
                            ? ''
                            : 0 === arguments.length
                              ? E(this, 0, e)
                              : d.apply(this, arguments);
                    }),
                    (o.prototype.toLocaleString = o.prototype.toString),
                    (o.prototype.equals = function (e) {
                        if (!o.isBuffer(e)) throw new TypeError('Argument must be a Buffer');
                        return this === e || 0 === o.compare(this, e);
                    }),
                    (o.prototype.inspect = function () {
                        var t = '',
                            r = e.INSPECT_MAX_BYTES;
                        return (
                            (t = this.toString('hex', 0, r)
                                .replace(/(.{2})/g, '$1 ')
                                .trim()),
                            this.length > r && (t += ' ... '),
                            '<Buffer ' + t + '>'
                        );
                    }),
                    (o.prototype.compare = function (e, t, r, n, i) {
                        if (
                            (B(e, Uint8Array) && (e = o.from(e, e.offset, e.byteLength)),
                            !o.isBuffer(e))
                        )
                            throw new TypeError(
                                'The "target" argument must be one of type Buffer or Uint8Array. Received type ' +
                                    typeof e
                            );
                        if (
                            (void 0 === t && (t = 0),
                            void 0 === r && (r = e ? e.length : 0),
                            void 0 === n && (n = 0),
                            void 0 === i && (i = this.length),
                            t < 0 || r > e.length || n < 0 || i > this.length)
                        )
                            throw new RangeError('out of range index');
                        if (n >= i && t >= r) return 0;
                        if (n >= i) return -1;
                        if (t >= r) return 1;
                        if (this === e) return 0;
                        for (
                            var a = (i >>>= 0) - (n >>>= 0),
                                s = (r >>>= 0) - (t >>>= 0),
                                u = Math.min(a, s),
                                l = this.slice(n, i),
                                c = e.slice(t, r),
                                f = 0;
                            f < u;
                            ++f
                        )
                            if (l[f] !== c[f]) {
                                ((a = l[f]), (s = c[f]));
                                break;
                            }
                        return a < s ? -1 : s < a ? 1 : 0;
                    }),
                    (o.prototype.includes = function (e, t, r) {
                        return -1 !== this.indexOf(e, t, r);
                    }),
                    (o.prototype.indexOf = function (e, t, r) {
                        return p(this, e, t, r, !0);
                    }),
                    (o.prototype.lastIndexOf = function (e, t, r) {
                        return p(this, e, t, r, !1);
                    }),
                    (o.prototype.write = function (e, t, r, n) {
                        if (void 0 === t) ((n = 'utf8'), (r = this.length), (t = 0));
                        else if (void 0 === r && 'string' == typeof t)
                            ((n = t), (r = this.length), (t = 0));
                        else {
                            if (!isFinite(t))
                                throw new Error(
                                    'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                                );
                            ((t >>>= 0),
                                isFinite(r)
                                    ? ((r >>>= 0), void 0 === n && (n = 'utf8'))
                                    : ((n = r), (r = void 0)));
                        }
                        var i = this.length - t;
                        if (
                            ((void 0 === r || r > i) && (r = i),
                            (e.length > 0 && (r < 0 || t < 0)) || t > this.length)
                        )
                            throw new RangeError('Attempt to write outside buffer bounds');
                        n || (n = 'utf8');
                        for (var o = !1; ; )
                            switch (n) {
                                case 'hex':
                                    return m(this, e, t, r);
                                case 'utf8':
                                case 'utf-8':
                                    return g(this, e, t, r);
                                case 'ascii':
                                    return b(this, e, t, r);
                                case 'latin1':
                                case 'binary':
                                    return v(this, e, t, r);
                                case 'base64':
                                    return w(this, e, t, r);
                                case 'ucs2':
                                case 'ucs-2':
                                case 'utf16le':
                                case 'utf-16le':
                                    return _(this, e, t, r);
                                default:
                                    if (o) throw new TypeError('Unknown encoding: ' + n);
                                    ((n = ('' + n).toLowerCase()), (o = !0));
                            }
                    }),
                    (o.prototype.toJSON = function () {
                        return {
                            type: 'Buffer',
                            data: Array.prototype.slice.call(this._arr || this, 0),
                        };
                    }));
                var k = 4096;
                function O(e, t, r) {
                    var n = '';
                    r = Math.min(e.length, r);
                    for (var i = t; i < r; ++i) n += String.fromCharCode(127 & e[i]);
                    return n;
                }
                function T(e, t, r) {
                    var n = '';
                    r = Math.min(e.length, r);
                    for (var i = t; i < r; ++i) n += String.fromCharCode(e[i]);
                    return n;
                }
                function M(e, t, r) {
                    var n = e.length;
                    ((!t || t < 0) && (t = 0), (!r || r < 0 || r > n) && (r = n));
                    for (var i = '', o = t; o < r; ++o) i += I(e[o]);
                    return i;
                }
                function A(e, t, r) {
                    for (var n = e.slice(t, r), i = '', o = 0; o < n.length; o += 2)
                        i += String.fromCharCode(n[o] + 256 * n[o + 1]);
                    return i;
                }
                function x(e, t, r) {
                    if (e % 1 != 0 || e < 0) throw new RangeError('offset is not uint');
                    if (e + t > r) throw new RangeError('Trying to access beyond buffer length');
                }
                function P(e, t, r, n, i, a) {
                    if (!o.isBuffer(e))
                        throw new TypeError('"buffer" argument must be a Buffer instance');
                    if (t > i || t < a) throw new RangeError('"value" argument is out of bounds');
                    if (r + n > e.length) throw new RangeError('Index out of range');
                }
                function R(e, t, r, n, i, o) {
                    if (r + n > e.length) throw new RangeError('Index out of range');
                    if (r < 0) throw new RangeError('Index out of range');
                }
                function j(e, t, n, i, o) {
                    return (
                        (t = +t),
                        (n >>>= 0),
                        o || R(e, 0, n, 4),
                        r.write(e, t, n, i, 23, 4),
                        n + 4
                    );
                }
                function C(e, t, n, i, o) {
                    return (
                        (t = +t),
                        (n >>>= 0),
                        o || R(e, 0, n, 8),
                        r.write(e, t, n, i, 52, 8),
                        n + 8
                    );
                }
                ((o.prototype.slice = function (e, t) {
                    var r = this.length;
                    ((e = ~~e) < 0 ? (e += r) < 0 && (e = 0) : e > r && (e = r),
                        (t = void 0 === t ? r : ~~t) < 0
                            ? (t += r) < 0 && (t = 0)
                            : t > r && (t = r),
                        t < e && (t = e));
                    var n = this.subarray(e, t);
                    return ((n.__proto__ = o.prototype), n);
                }),
                    (o.prototype.readUIntLE = function (e, t, r) {
                        ((e >>>= 0), (t >>>= 0), r || x(e, t, this.length));
                        for (var n = this[e], i = 1, o = 0; ++o < t && (i *= 256); )
                            n += this[e + o] * i;
                        return n;
                    }),
                    (o.prototype.readUIntBE = function (e, t, r) {
                        ((e >>>= 0), (t >>>= 0), r || x(e, t, this.length));
                        for (var n = this[e + --t], i = 1; t > 0 && (i *= 256); )
                            n += this[e + --t] * i;
                        return n;
                    }),
                    (o.prototype.readUInt8 = function (e, t) {
                        return ((e >>>= 0), t || x(e, 1, this.length), this[e]);
                    }),
                    (o.prototype.readUInt16LE = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 2, this.length),
                            this[e] | (this[e + 1] << 8)
                        );
                    }),
                    (o.prototype.readUInt16BE = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 2, this.length),
                            (this[e] << 8) | this[e + 1]
                        );
                    }),
                    (o.prototype.readUInt32LE = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 4, this.length),
                            (this[e] | (this[e + 1] << 8) | (this[e + 2] << 16)) +
                                16777216 * this[e + 3]
                        );
                    }),
                    (o.prototype.readUInt32BE = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 4, this.length),
                            16777216 * this[e] +
                                ((this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3])
                        );
                    }),
                    (o.prototype.readIntLE = function (e, t, r) {
                        ((e >>>= 0), (t >>>= 0), r || x(e, t, this.length));
                        for (var n = this[e], i = 1, o = 0; ++o < t && (i *= 256); )
                            n += this[e + o] * i;
                        return (n >= (i *= 128) && (n -= Math.pow(2, 8 * t)), n);
                    }),
                    (o.prototype.readIntBE = function (e, t, r) {
                        ((e >>>= 0), (t >>>= 0), r || x(e, t, this.length));
                        for (var n = t, i = 1, o = this[e + --n]; n > 0 && (i *= 256); )
                            o += this[e + --n] * i;
                        return (o >= (i *= 128) && (o -= Math.pow(2, 8 * t)), o);
                    }),
                    (o.prototype.readInt8 = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 1, this.length),
                            128 & this[e] ? -1 * (255 - this[e] + 1) : this[e]
                        );
                    }),
                    (o.prototype.readInt16LE = function (e, t) {
                        ((e >>>= 0), t || x(e, 2, this.length));
                        var r = this[e] | (this[e + 1] << 8);
                        return 32768 & r ? 4294901760 | r : r;
                    }),
                    (o.prototype.readInt16BE = function (e, t) {
                        ((e >>>= 0), t || x(e, 2, this.length));
                        var r = this[e + 1] | (this[e] << 8);
                        return 32768 & r ? 4294901760 | r : r;
                    }),
                    (o.prototype.readInt32LE = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 4, this.length),
                            this[e] | (this[e + 1] << 8) | (this[e + 2] << 16) | (this[e + 3] << 24)
                        );
                    }),
                    (o.prototype.readInt32BE = function (e, t) {
                        return (
                            (e >>>= 0),
                            t || x(e, 4, this.length),
                            (this[e] << 24) | (this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3]
                        );
                    }),
                    (o.prototype.readFloatLE = function (e, t) {
                        return ((e >>>= 0), t || x(e, 4, this.length), r.read(this, e, !0, 23, 4));
                    }),
                    (o.prototype.readFloatBE = function (e, t) {
                        return ((e >>>= 0), t || x(e, 4, this.length), r.read(this, e, !1, 23, 4));
                    }),
                    (o.prototype.readDoubleLE = function (e, t) {
                        return ((e >>>= 0), t || x(e, 8, this.length), r.read(this, e, !0, 52, 8));
                    }),
                    (o.prototype.readDoubleBE = function (e, t) {
                        return ((e >>>= 0), t || x(e, 8, this.length), r.read(this, e, !1, 52, 8));
                    }),
                    (o.prototype.writeUIntLE = function (e, t, r, n) {
                        ((e = +e), (t >>>= 0), (r >>>= 0), n) ||
                            P(this, e, t, r, Math.pow(2, 8 * r) - 1, 0);
                        var i = 1,
                            o = 0;
                        for (this[t] = 255 & e; ++o < r && (i *= 256); )
                            this[t + o] = (e / i) & 255;
                        return t + r;
                    }),
                    (o.prototype.writeUIntBE = function (e, t, r, n) {
                        ((e = +e), (t >>>= 0), (r >>>= 0), n) ||
                            P(this, e, t, r, Math.pow(2, 8 * r) - 1, 0);
                        var i = r - 1,
                            o = 1;
                        for (this[t + i] = 255 & e; --i >= 0 && (o *= 256); )
                            this[t + i] = (e / o) & 255;
                        return t + r;
                    }),
                    (o.prototype.writeUInt8 = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 1, 255, 0),
                            (this[t] = 255 & e),
                            t + 1
                        );
                    }),
                    (o.prototype.writeUInt16LE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 2, 65535, 0),
                            (this[t] = 255 & e),
                            (this[t + 1] = e >>> 8),
                            t + 2
                        );
                    }),
                    (o.prototype.writeUInt16BE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 2, 65535, 0),
                            (this[t] = e >>> 8),
                            (this[t + 1] = 255 & e),
                            t + 2
                        );
                    }),
                    (o.prototype.writeUInt32LE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 4, 4294967295, 0),
                            (this[t + 3] = e >>> 24),
                            (this[t + 2] = e >>> 16),
                            (this[t + 1] = e >>> 8),
                            (this[t] = 255 & e),
                            t + 4
                        );
                    }),
                    (o.prototype.writeUInt32BE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 4, 4294967295, 0),
                            (this[t] = e >>> 24),
                            (this[t + 1] = e >>> 16),
                            (this[t + 2] = e >>> 8),
                            (this[t + 3] = 255 & e),
                            t + 4
                        );
                    }),
                    (o.prototype.writeIntLE = function (e, t, r, n) {
                        if (((e = +e), (t >>>= 0), !n)) {
                            var i = Math.pow(2, 8 * r - 1);
                            P(this, e, t, r, i - 1, -i);
                        }
                        var o = 0,
                            a = 1,
                            s = 0;
                        for (this[t] = 255 & e; ++o < r && (a *= 256); )
                            (e < 0 && 0 === s && 0 !== this[t + o - 1] && (s = 1),
                                (this[t + o] = (((e / a) | 0) - s) & 255));
                        return t + r;
                    }),
                    (o.prototype.writeIntBE = function (e, t, r, n) {
                        if (((e = +e), (t >>>= 0), !n)) {
                            var i = Math.pow(2, 8 * r - 1);
                            P(this, e, t, r, i - 1, -i);
                        }
                        var o = r - 1,
                            a = 1,
                            s = 0;
                        for (this[t + o] = 255 & e; --o >= 0 && (a *= 256); )
                            (e < 0 && 0 === s && 0 !== this[t + o + 1] && (s = 1),
                                (this[t + o] = (((e / a) | 0) - s) & 255));
                        return t + r;
                    }),
                    (o.prototype.writeInt8 = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 1, 127, -128),
                            e < 0 && (e = 255 + e + 1),
                            (this[t] = 255 & e),
                            t + 1
                        );
                    }),
                    (o.prototype.writeInt16LE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 2, 32767, -32768),
                            (this[t] = 255 & e),
                            (this[t + 1] = e >>> 8),
                            t + 2
                        );
                    }),
                    (o.prototype.writeInt16BE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 2, 32767, -32768),
                            (this[t] = e >>> 8),
                            (this[t + 1] = 255 & e),
                            t + 2
                        );
                    }),
                    (o.prototype.writeInt32LE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 4, 2147483647, -2147483648),
                            (this[t] = 255 & e),
                            (this[t + 1] = e >>> 8),
                            (this[t + 2] = e >>> 16),
                            (this[t + 3] = e >>> 24),
                            t + 4
                        );
                    }),
                    (o.prototype.writeInt32BE = function (e, t, r) {
                        return (
                            (e = +e),
                            (t >>>= 0),
                            r || P(this, e, t, 4, 2147483647, -2147483648),
                            e < 0 && (e = 4294967295 + e + 1),
                            (this[t] = e >>> 24),
                            (this[t + 1] = e >>> 16),
                            (this[t + 2] = e >>> 8),
                            (this[t + 3] = 255 & e),
                            t + 4
                        );
                    }),
                    (o.prototype.writeFloatLE = function (e, t, r) {
                        return j(this, e, t, !0, r);
                    }),
                    (o.prototype.writeFloatBE = function (e, t, r) {
                        return j(this, e, t, !1, r);
                    }),
                    (o.prototype.writeDoubleLE = function (e, t, r) {
                        return C(this, e, t, !0, r);
                    }),
                    (o.prototype.writeDoubleBE = function (e, t, r) {
                        return C(this, e, t, !1, r);
                    }),
                    (o.prototype.copy = function (e, t, r, n) {
                        if (!o.isBuffer(e)) throw new TypeError('argument should be a Buffer');
                        if (
                            (r || (r = 0),
                            n || 0 === n || (n = this.length),
                            t >= e.length && (t = e.length),
                            t || (t = 0),
                            n > 0 && n < r && (n = r),
                            n === r)
                        )
                            return 0;
                        if (0 === e.length || 0 === this.length) return 0;
                        if (t < 0) throw new RangeError('targetStart out of bounds');
                        if (r < 0 || r >= this.length) throw new RangeError('Index out of range');
                        if (n < 0) throw new RangeError('sourceEnd out of bounds');
                        (n > this.length && (n = this.length),
                            e.length - t < n - r && (n = e.length - t + r));
                        var i = n - r;
                        if (this === e && 'function' == typeof Uint8Array.prototype.copyWithin)
                            this.copyWithin(t, r, n);
                        else if (this === e && r < t && t < n)
                            for (var a = i - 1; a >= 0; --a) e[a + t] = this[a + r];
                        else Uint8Array.prototype.set.call(e, this.subarray(r, n), t);
                        return i;
                    }),
                    (o.prototype.fill = function (e, t, r, n) {
                        if ('string' == typeof e) {
                            if (
                                ('string' == typeof t
                                    ? ((n = t), (t = 0), (r = this.length))
                                    : 'string' == typeof r && ((n = r), (r = this.length)),
                                void 0 !== n && 'string' != typeof n)
                            )
                                throw new TypeError('encoding must be a string');
                            if ('string' == typeof n && !o.isEncoding(n))
                                throw new TypeError('Unknown encoding: ' + n);
                            if (1 === e.length) {
                                var i = e.charCodeAt(0);
                                (('utf8' === n && i < 128) || 'latin1' === n) && (e = i);
                            }
                        } else 'number' == typeof e && (e &= 255);
                        if (t < 0 || this.length < t || this.length < r)
                            throw new RangeError('Out of range index');
                        if (r <= t) return this;
                        var a;
                        if (
                            ((t >>>= 0),
                            (r = void 0 === r ? this.length : r >>> 0),
                            e || (e = 0),
                            'number' == typeof e)
                        )
                            for (a = t; a < r; ++a) this[a] = e;
                        else {
                            var s = o.isBuffer(e) ? e : o.from(e, n),
                                u = s.length;
                            if (0 === u)
                                throw new TypeError(
                                    'The value "' + e + '" is invalid for argument "value"'
                                );
                            for (a = 0; a < r - t; ++a) this[a + t] = s[a % u];
                        }
                        return this;
                    }));
                var L = /[^+/0-9A-Za-z-_]/g;
                function I(e) {
                    return e < 16 ? '0' + e.toString(16) : e.toString(16);
                }
                function D(e, t) {
                    var r;
                    t = t || 1 / 0;
                    for (var n = e.length, i = null, o = [], a = 0; a < n; ++a) {
                        if ((r = e.charCodeAt(a)) > 55295 && r < 57344) {
                            if (!i) {
                                if (r > 56319) {
                                    (t -= 3) > -1 && o.push(239, 191, 189);
                                    continue;
                                }
                                if (a + 1 === n) {
                                    (t -= 3) > -1 && o.push(239, 191, 189);
                                    continue;
                                }
                                i = r;
                                continue;
                            }
                            if (r < 56320) {
                                ((t -= 3) > -1 && o.push(239, 191, 189), (i = r));
                                continue;
                            }
                            r = 65536 + (((i - 55296) << 10) | (r - 56320));
                        } else i && (t -= 3) > -1 && o.push(239, 191, 189);
                        if (((i = null), r < 128)) {
                            if ((t -= 1) < 0) break;
                            o.push(r);
                        } else if (r < 2048) {
                            if ((t -= 2) < 0) break;
                            o.push((r >> 6) | 192, (63 & r) | 128);
                        } else if (r < 65536) {
                            if ((t -= 3) < 0) break;
                            o.push((r >> 12) | 224, ((r >> 6) & 63) | 128, (63 & r) | 128);
                        } else {
                            if (!(r < 1114112)) throw new Error('Invalid code point');
                            if ((t -= 4) < 0) break;
                            o.push(
                                (r >> 18) | 240,
                                ((r >> 12) & 63) | 128,
                                ((r >> 6) & 63) | 128,
                                (63 & r) | 128
                            );
                        }
                    }
                    return o;
                }
                function N(e) {
                    return t.toByteArray(
                        (function (e) {
                            if ((e = (e = e.split('=')[0]).trim().replace(L, '')).length < 2)
                                return '';
                            for (; e.length % 4 != 0; ) e += '=';
                            return e;
                        })(e)
                    );
                }
                function F(e, t, r, n) {
                    for (var i = 0; i < n && !(i + r >= t.length || i >= e.length); ++i)
                        t[i + r] = e[i];
                    return i;
                }
                function B(e, t) {
                    return (
                        e instanceof t ||
                        (null != e &&
                            null != e.constructor &&
                            null != e.constructor.name &&
                            e.constructor.name === t.name)
                    );
                }
                function U(e) {
                    return e != e;
                }
            })(to)),
        to
    );
}
function lo() {
    if (ao) return oo;
    function e(e, n) {
        (r(e, n), t(e));
    }
    function t(e) {
        (e._writableState && !e._writableState.emitClose) ||
            (e._readableState && !e._readableState.emitClose) ||
            e.emit('close');
    }
    function r(e, t) {
        e.emit('error', t);
    }
    return (
        (ao = 1),
        (oo = {
            destroy: function (n, i) {
                var o = this,
                    a = this._readableState && this._readableState.destroyed,
                    s = this._writableState && this._writableState.destroyed;
                return a || s
                    ? (i
                          ? i(n)
                          : n &&
                            (this._writableState
                                ? this._writableState.errorEmitted ||
                                  ((this._writableState.errorEmitted = !0),
                                  process.nextTick(r, this, n))
                                : process.nextTick(r, this, n)),
                      this)
                    : (this._readableState && (this._readableState.destroyed = !0),
                      this._writableState && (this._writableState.destroyed = !0),
                      this._destroy(n || null, function (r) {
                          !i && r
                              ? o._writableState
                                  ? o._writableState.errorEmitted
                                      ? process.nextTick(t, o)
                                      : ((o._writableState.errorEmitted = !0),
                                        process.nextTick(e, o, r))
                                  : process.nextTick(e, o, r)
                              : i
                                ? (process.nextTick(t, o), i(r))
                                : process.nextTick(t, o);
                      }),
                      this);
            },
            undestroy: function () {
                (this._readableState &&
                    ((this._readableState.destroyed = !1),
                    (this._readableState.reading = !1),
                    (this._readableState.ended = !1),
                    (this._readableState.endEmitted = !1)),
                    this._writableState &&
                        ((this._writableState.destroyed = !1),
                        (this._writableState.ended = !1),
                        (this._writableState.ending = !1),
                        (this._writableState.finalCalled = !1),
                        (this._writableState.prefinished = !1),
                        (this._writableState.finished = !1),
                        (this._writableState.errorEmitted = !1)));
            },
            errorOrDestroy: function (e, t) {
                var r = e._readableState,
                    n = e._writableState;
                (r && r.autoDestroy) || (n && n.autoDestroy) ? e.destroy(t) : e.emit('error', t);
            },
        })
    );
}
var co,
    fo,
    ho,
    po,
    yo,
    mo = {};
function go() {
    if (co) return mo;
    co = 1;
    var e = {};
    function t(t, r, n) {
        n || (n = Error);
        var i = (function (e) {
            var t, n;
            function i(t, n, i) {
                return (
                    e.call(
                        this,
                        (function (e, t, n) {
                            return 'string' == typeof r ? r : r(e, t, n);
                        })(t, n, i)
                    ) || this
                );
            }
            return (
                (n = e),
                ((t = i).prototype = Object.create(n.prototype)),
                (t.prototype.constructor = t),
                (t.__proto__ = n),
                i
            );
        })(n);
        ((i.prototype.name = n.name), (i.prototype.code = t), (e[t] = i));
    }
    function r(e, t) {
        if (Array.isArray(e)) {
            var r = e.length;
            return (
                (e = e.map(function (e) {
                    return String(e);
                })),
                r > 2
                    ? 'one of '.concat(t, ' ').concat(e.slice(0, r - 1).join(', '), ', or ') +
                      e[r - 1]
                    : 2 === r
                      ? 'one of '.concat(t, ' ').concat(e[0], ' or ').concat(e[1])
                      : 'of '.concat(t, ' ').concat(e[0])
            );
        }
        return 'of '.concat(t, ' ').concat(String(e));
    }
    return (
        t(
            'ERR_INVALID_OPT_VALUE',
            function (e, t) {
                return 'The value "' + t + '" is invalid for option "' + e + '"';
            },
            TypeError
        ),
        t(
            'ERR_INVALID_ARG_TYPE',
            function (e, t, n) {
                var i, o, a;
                if (
                    ('string' == typeof t && ((o = 'not '), t.substr(0, o.length) === o)
                        ? ((i = 'must not be'), (t = t.replace(/^not /, '')))
                        : (i = 'must be'),
                    (function (e, t, r) {
                        return (
                            (void 0 === r || r > e.length) && (r = e.length),
                            e.substring(r - t.length, r) === t
                        );
                    })(e, ' argument'))
                )
                    a = 'The '.concat(e, ' ').concat(i, ' ').concat(r(t, 'type'));
                else {
                    var s = (function (e, t, r) {
                        return (
                            'number' != typeof r && (r = 0),
                            !(r + t.length > e.length) && -1 !== e.indexOf(t, r)
                        );
                    })(e, '.')
                        ? 'property'
                        : 'argument';
                    a = 'The "'.concat(e, '" ').concat(s, ' ').concat(i, ' ').concat(r(t, 'type'));
                }
                return (a += '. Received type '.concat(typeof n));
            },
            TypeError
        ),
        t('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF'),
        t('ERR_METHOD_NOT_IMPLEMENTED', function (e) {
            return 'The ' + e + ' method is not implemented';
        }),
        t('ERR_STREAM_PREMATURE_CLOSE', 'Premature close'),
        t('ERR_STREAM_DESTROYED', function (e) {
            return 'Cannot call ' + e + ' after a stream was destroyed';
        }),
        t('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times'),
        t('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable'),
        t('ERR_STREAM_WRITE_AFTER_END', 'write after end'),
        t('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError),
        t(
            'ERR_UNKNOWN_ENCODING',
            function (e) {
                return 'Unknown encoding: ' + e;
            },
            TypeError
        ),
        t('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event'),
        (mo.codes = e),
        mo
    );
}
function bo() {
    if (ho) return fo;
    ho = 1;
    var e = go().codes.ERR_INVALID_OPT_VALUE;
    return (fo = {
        getHighWaterMark: function (t, r, n, i) {
            var o = (function (e, t, r) {
                return null != e.highWaterMark ? e.highWaterMark : t ? e[r] : null;
            })(r, i, n);
            if (null != o) {
                if (!isFinite(o) || Math.floor(o) !== o || o < 0)
                    throw new e(i ? n : 'highWaterMark', o);
                return Math.floor(o);
            }
            return t.objectMode ? 16 : 16384;
        },
    });
}
function vo() {
    if (yo) return po;
    function e(e, t) {
        var r = Object.keys(e);
        if (Object.getOwnPropertySymbols) {
            var n = Object.getOwnPropertySymbols(e);
            (t &&
                (n = n.filter(function (t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable;
                })),
                r.push.apply(r, n));
        }
        return r;
    }
    function t(t) {
        for (var n = 1; n < arguments.length; n++) {
            var i = null != arguments[n] ? arguments[n] : {};
            n % 2
                ? e(Object(i), !0).forEach(function (e) {
                      r(t, e, i[e]);
                  })
                : Object.getOwnPropertyDescriptors
                  ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(i))
                  : e(Object(i)).forEach(function (e) {
                        Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(i, e));
                    });
        }
        return t;
    }
    function r(e, t, r) {
        return (
            (t = i(t)) in e
                ? Object.defineProperty(e, t, {
                      value: r,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (e[t] = r),
            e
        );
    }
    function n(e, t, r) {
        return (
            t &&
                (function (e, t) {
                    for (var r = 0; r < t.length; r++) {
                        var n = t[r];
                        ((n.enumerable = n.enumerable || !1),
                            (n.configurable = !0),
                            'value' in n && (n.writable = !0),
                            Object.defineProperty(e, i(n.key), n));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function i(e) {
        var t = (function (e, t) {
            if ('object' != typeof e || null === e) return e;
            var r = e[Symbol.toPrimitive];
            if (void 0 !== r) {
                var n = r.call(e, t);
                if ('object' != typeof n) return n;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(e);
        })(e, 'string');
        return 'symbol' == typeof t ? t : String(t);
    }
    yo = 1;
    var o = uo().Buffer,
        a = Sr.inspect,
        s = (a && a.custom) || 'inspect';
    function u(e, t, r) {
        o.prototype.copy.call(e, t, r);
    }
    return (po = (function () {
        function e() {
            (!(function (e, t) {
                if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
            })(this, e),
                (this.head = null),
                (this.tail = null),
                (this.length = 0));
        }
        return (
            n(e, [
                {
                    key: 'push',
                    value: function (e) {
                        var t = { data: e, next: null };
                        (this.length > 0 ? (this.tail.next = t) : (this.head = t),
                            (this.tail = t),
                            ++this.length);
                    },
                },
                {
                    key: 'unshift',
                    value: function (e) {
                        var t = { data: e, next: this.head };
                        (0 === this.length && (this.tail = t), (this.head = t), ++this.length);
                    },
                },
                {
                    key: 'shift',
                    value: function () {
                        if (0 !== this.length) {
                            var e = this.head.data;
                            return (
                                1 === this.length
                                    ? (this.head = this.tail = null)
                                    : (this.head = this.head.next),
                                --this.length,
                                e
                            );
                        }
                    },
                },
                {
                    key: 'clear',
                    value: function () {
                        ((this.head = this.tail = null), (this.length = 0));
                    },
                },
                {
                    key: 'join',
                    value: function (e) {
                        if (0 === this.length) return '';
                        for (var t = this.head, r = '' + t.data; (t = t.next); ) r += e + t.data;
                        return r;
                    },
                },
                {
                    key: 'concat',
                    value: function (e) {
                        if (0 === this.length) return o.alloc(0);
                        for (var t = o.allocUnsafe(e >>> 0), r = this.head, n = 0; r; )
                            (u(r.data, t, n), (n += r.data.length), (r = r.next));
                        return t;
                    },
                },
                {
                    key: 'consume',
                    value: function (e, t) {
                        var r;
                        return (
                            e < this.head.data.length
                                ? ((r = this.head.data.slice(0, e)),
                                  (this.head.data = this.head.data.slice(e)))
                                : (r =
                                      e === this.head.data.length
                                          ? this.shift()
                                          : t
                                            ? this._getString(e)
                                            : this._getBuffer(e)),
                            r
                        );
                    },
                },
                {
                    key: 'first',
                    value: function () {
                        return this.head.data;
                    },
                },
                {
                    key: '_getString',
                    value: function (e) {
                        var t = this.head,
                            r = 1,
                            n = t.data;
                        for (e -= n.length; (t = t.next); ) {
                            var i = t.data,
                                o = e > i.length ? i.length : e;
                            if (
                                (o === i.length ? (n += i) : (n += i.slice(0, e)), 0 === (e -= o))
                            ) {
                                o === i.length
                                    ? (++r,
                                      t.next
                                          ? (this.head = t.next)
                                          : (this.head = this.tail = null))
                                    : ((this.head = t), (t.data = i.slice(o)));
                                break;
                            }
                            ++r;
                        }
                        return ((this.length -= r), n);
                    },
                },
                {
                    key: '_getBuffer',
                    value: function (e) {
                        var t = o.allocUnsafe(e),
                            r = this.head,
                            n = 1;
                        for (r.data.copy(t), e -= r.data.length; (r = r.next); ) {
                            var i = r.data,
                                a = e > i.length ? i.length : e;
                            if ((i.copy(t, t.length - e, 0, a), 0 === (e -= a))) {
                                a === i.length
                                    ? (++n,
                                      r.next
                                          ? (this.head = r.next)
                                          : (this.head = this.tail = null))
                                    : ((this.head = r), (r.data = i.slice(a)));
                                break;
                            }
                            ++n;
                        }
                        return ((this.length -= n), t);
                    },
                },
                {
                    key: s,
                    value: function (e, r) {
                        return a(this, t(t({}, r), {}, { depth: 0, customInspect: !1 }));
                    },
                },
            ]),
            e
        );
    })());
}
var wo,
    _o,
    So,
    Eo,
    ko,
    Oo,
    To,
    Mo,
    Ao,
    xo,
    Po,
    Ro,
    jo,
    Co,
    Lo,
    Io = {},
    Do = { exports: {} };
function No() {
    if (_o) return Io;
    _o = 1;
    var e = (wo ||
            ((wo = 1),
            (function (e, t) {
                var r = uo(),
                    n = r.Buffer;
                function i(e, t) {
                    for (var r in e) t[r] = e[r];
                }
                function o(e, t, r) {
                    return n(e, t, r);
                }
                (n.from && n.alloc && n.allocUnsafe && n.allocUnsafeSlow
                    ? (e.exports = r)
                    : (i(r, t), (t.Buffer = o)),
                    (o.prototype = Object.create(n.prototype)),
                    i(n, o),
                    (o.from = function (e, t, r) {
                        if ('number' == typeof e)
                            throw new TypeError('Argument must not be a number');
                        return n(e, t, r);
                    }),
                    (o.alloc = function (e, t, r) {
                        if ('number' != typeof e) throw new TypeError('Argument must be a number');
                        var i = n(e);
                        return (
                            void 0 !== t
                                ? 'string' == typeof r
                                    ? i.fill(t, r)
                                    : i.fill(t)
                                : i.fill(0),
                            i
                        );
                    }),
                    (o.allocUnsafe = function (e) {
                        if ('number' != typeof e) throw new TypeError('Argument must be a number');
                        return n(e);
                    }),
                    (o.allocUnsafeSlow = function (e) {
                        if ('number' != typeof e) throw new TypeError('Argument must be a number');
                        return r.SlowBuffer(e);
                    }));
            })(Do, Do.exports)),
        Do.exports).Buffer,
        t =
            e.isEncoding ||
            function (e) {
                switch ((e = '' + e) && e.toLowerCase()) {
                    case 'hex':
                    case 'utf8':
                    case 'utf-8':
                    case 'ascii':
                    case 'binary':
                    case 'base64':
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                    case 'raw':
                        return !0;
                    default:
                        return !1;
                }
            };
    function r(r) {
        var n;
        switch (
            ((this.encoding = (function (r) {
                var n = (function (e) {
                    if (!e) return 'utf8';
                    for (var t; ; )
                        switch (e) {
                            case 'utf8':
                            case 'utf-8':
                                return 'utf8';
                            case 'ucs2':
                            case 'ucs-2':
                            case 'utf16le':
                            case 'utf-16le':
                                return 'utf16le';
                            case 'latin1':
                            case 'binary':
                                return 'latin1';
                            case 'base64':
                            case 'ascii':
                            case 'hex':
                                return e;
                            default:
                                if (t) return;
                                ((e = ('' + e).toLowerCase()), (t = !0));
                        }
                })(r);
                if ('string' != typeof n && (e.isEncoding === t || !t(r)))
                    throw new Error('Unknown encoding: ' + r);
                return n || r;
            })(r)),
            this.encoding)
        ) {
            case 'utf16le':
                ((this.text = o), (this.end = a), (n = 4));
                break;
            case 'utf8':
                ((this.fillLast = i), (n = 4));
                break;
            case 'base64':
                ((this.text = s), (this.end = u), (n = 3));
                break;
            default:
                return ((this.write = l), void (this.end = c));
        }
        ((this.lastNeed = 0), (this.lastTotal = 0), (this.lastChar = e.allocUnsafe(n)));
    }
    function n(e) {
        return e <= 127
            ? 0
            : e >> 5 == 6
              ? 2
              : e >> 4 == 14
                ? 3
                : e >> 3 == 30
                  ? 4
                  : e >> 6 == 2
                    ? -1
                    : -2;
    }
    function i(e) {
        var t = this.lastTotal - this.lastNeed,
            r = (function (e, t) {
                if (128 != (192 & t[0])) return ((e.lastNeed = 0), '�');
                if (e.lastNeed > 1 && t.length > 1) {
                    if (128 != (192 & t[1])) return ((e.lastNeed = 1), '�');
                    if (e.lastNeed > 2 && t.length > 2 && 128 != (192 & t[2]))
                        return ((e.lastNeed = 2), '�');
                }
            })(this, e);
        return void 0 !== r
            ? r
            : this.lastNeed <= e.length
              ? (e.copy(this.lastChar, t, 0, this.lastNeed),
                this.lastChar.toString(this.encoding, 0, this.lastTotal))
              : (e.copy(this.lastChar, t, 0, e.length), void (this.lastNeed -= e.length));
    }
    function o(e, t) {
        if ((e.length - t) % 2 == 0) {
            var r = e.toString('utf16le', t);
            if (r) {
                var n = r.charCodeAt(r.length - 1);
                if (n >= 55296 && n <= 56319)
                    return (
                        (this.lastNeed = 2),
                        (this.lastTotal = 4),
                        (this.lastChar[0] = e[e.length - 2]),
                        (this.lastChar[1] = e[e.length - 1]),
                        r.slice(0, -1)
                    );
            }
            return r;
        }
        return (
            (this.lastNeed = 1),
            (this.lastTotal = 2),
            (this.lastChar[0] = e[e.length - 1]),
            e.toString('utf16le', t, e.length - 1)
        );
    }
    function a(e) {
        var t = e && e.length ? this.write(e) : '';
        if (this.lastNeed) {
            var r = this.lastTotal - this.lastNeed;
            return t + this.lastChar.toString('utf16le', 0, r);
        }
        return t;
    }
    function s(e, t) {
        var r = (e.length - t) % 3;
        return 0 === r
            ? e.toString('base64', t)
            : ((this.lastNeed = 3 - r),
              (this.lastTotal = 3),
              1 === r
                  ? (this.lastChar[0] = e[e.length - 1])
                  : ((this.lastChar[0] = e[e.length - 2]), (this.lastChar[1] = e[e.length - 1])),
              e.toString('base64', t, e.length - r));
    }
    function u(e) {
        var t = e && e.length ? this.write(e) : '';
        return this.lastNeed ? t + this.lastChar.toString('base64', 0, 3 - this.lastNeed) : t;
    }
    function l(e) {
        return e.toString(this.encoding);
    }
    function c(e) {
        return e && e.length ? this.write(e) : '';
    }
    return (
        (Io.StringDecoder = r),
        (r.prototype.write = function (e) {
            if (0 === e.length) return '';
            var t, r;
            if (this.lastNeed) {
                if (void 0 === (t = this.fillLast(e))) return '';
                ((r = this.lastNeed), (this.lastNeed = 0));
            } else r = 0;
            return r < e.length ? (t ? t + this.text(e, r) : this.text(e, r)) : t || '';
        }),
        (r.prototype.end = function (e) {
            var t = e && e.length ? this.write(e) : '';
            return this.lastNeed ? t + '�' : t;
        }),
        (r.prototype.text = function (e, t) {
            var r = (function (e, t, r) {
                var i = t.length - 1;
                if (i < r) return 0;
                var o = n(t[i]);
                if (o >= 0) return (o > 0 && (e.lastNeed = o - 1), o);
                if (--i < r || -2 === o) return 0;
                if (((o = n(t[i])), o >= 0)) return (o > 0 && (e.lastNeed = o - 2), o);
                if (--i < r || -2 === o) return 0;
                if (((o = n(t[i])), o >= 0))
                    return (o > 0 && (2 === o ? (o = 0) : (e.lastNeed = o - 3)), o);
                return 0;
            })(this, e, t);
            if (!this.lastNeed) return e.toString('utf8', t);
            this.lastTotal = r;
            var i = e.length - (r - this.lastNeed);
            return (e.copy(this.lastChar, 0, i), e.toString('utf8', t, i));
        }),
        (r.prototype.fillLast = function (e) {
            if (this.lastNeed <= e.length)
                return (
                    e.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed),
                    this.lastChar.toString(this.encoding, 0, this.lastTotal)
                );
            (e.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, e.length),
                (this.lastNeed -= e.length));
        }),
        Io
    );
}
function Fo() {
    if (Eo) return So;
    Eo = 1;
    var e = go().codes.ERR_STREAM_PREMATURE_CLOSE;
    function t() {}
    return (
        (So = function r(n, i, o) {
            if ('function' == typeof i) return r(n, null, i);
            (i || (i = {}),
                (o = (function (e) {
                    var t = !1;
                    return function () {
                        if (!t) {
                            t = !0;
                            for (var r = arguments.length, n = new Array(r), i = 0; i < r; i++)
                                n[i] = arguments[i];
                            e.apply(this, n);
                        }
                    };
                })(o || t)));
            var a = i.readable || (!1 !== i.readable && n.readable),
                s = i.writable || (!1 !== i.writable && n.writable),
                u = function () {
                    n.writable || c();
                },
                l = n._writableState && n._writableState.finished,
                c = function () {
                    ((s = !1), (l = !0), a || o.call(n));
                },
                f = n._readableState && n._readableState.endEmitted,
                d = function () {
                    ((a = !1), (f = !0), s || o.call(n));
                },
                h = function (e) {
                    o.call(n, e);
                },
                p = function () {
                    var t;
                    return a && !f
                        ? ((n._readableState && n._readableState.ended) || (t = new e()),
                          o.call(n, t))
                        : s && !l
                          ? ((n._writableState && n._writableState.ended) || (t = new e()),
                            o.call(n, t))
                          : void 0;
                },
                y = function () {
                    n.req.on('finish', c);
                };
            return (
                !(function (e) {
                    return e.setHeader && 'function' == typeof e.abort;
                })(n)
                    ? s && !n._writableState && (n.on('end', u), n.on('close', u))
                    : (n.on('complete', c), n.on('abort', p), n.req ? y() : n.on('request', y)),
                n.on('end', d),
                n.on('finish', c),
                !1 !== i.error && n.on('error', h),
                n.on('close', p),
                function () {
                    (n.removeListener('complete', c),
                        n.removeListener('abort', p),
                        n.removeListener('request', y),
                        n.req && n.req.removeListener('finish', c),
                        n.removeListener('end', u),
                        n.removeListener('close', u),
                        n.removeListener('finish', c),
                        n.removeListener('end', d),
                        n.removeListener('error', h),
                        n.removeListener('close', p));
                }
            );
        }),
        So
    );
}
function Bo() {
    if (Oo) return ko;
    var e;
    function t(e, t, r) {
        return (
            (t = (function (e) {
                var t = (function (e, t) {
                    if ('object' != typeof e || null === e) return e;
                    var r = e[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var n = r.call(e, t);
                        if ('object' != typeof n) return n;
                        throw new TypeError('@@toPrimitive must return a primitive value.');
                    }
                    return ('string' === t ? String : Number)(e);
                })(e, 'string');
                return 'symbol' == typeof t ? t : String(t);
            })(t)) in e
                ? Object.defineProperty(e, t, {
                      value: r,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (e[t] = r),
            e
        );
    }
    Oo = 1;
    var r = Fo(),
        n = Symbol('lastResolve'),
        i = Symbol('lastReject'),
        o = Symbol('error'),
        a = Symbol('ended'),
        s = Symbol('lastPromise'),
        u = Symbol('handlePromise'),
        l = Symbol('stream');
    function c(e, t) {
        return { value: e, done: t };
    }
    function f(e) {
        var t = e[n];
        if (null !== t) {
            var r = e[l].read();
            null !== r && ((e[s] = null), (e[n] = null), (e[i] = null), t(c(r, !1)));
        }
    }
    function d(e) {
        process.nextTick(f, e);
    }
    var h = Object.getPrototypeOf(function () {}),
        p = Object.setPrototypeOf(
            (t(
                (e = {
                    get stream() {
                        return this[l];
                    },
                    next: function () {
                        var e = this,
                            t = this[o];
                        if (null !== t) return Promise.reject(t);
                        if (this[a]) return Promise.resolve(c(void 0, !0));
                        if (this[l].destroyed)
                            return new Promise(function (t, r) {
                                process.nextTick(function () {
                                    e[o] ? r(e[o]) : t(c(void 0, !0));
                                });
                            });
                        var r,
                            n = this[s];
                        if (n)
                            r = new Promise(
                                (function (e, t) {
                                    return function (r, n) {
                                        e.then(function () {
                                            t[a] ? r(c(void 0, !0)) : t[u](r, n);
                                        }, n);
                                    };
                                })(n, this)
                            );
                        else {
                            var i = this[l].read();
                            if (null !== i) return Promise.resolve(c(i, !1));
                            r = new Promise(this[u]);
                        }
                        return ((this[s] = r), r);
                    },
                }),
                Symbol.asyncIterator,
                function () {
                    return this;
                }
            ),
            t(e, 'return', function () {
                var e = this;
                return new Promise(function (t, r) {
                    e[l].destroy(null, function (e) {
                        e ? r(e) : t(c(void 0, !0));
                    });
                });
            }),
            e),
            h
        );
    return (ko = function (e) {
        var f,
            h = Object.create(
                p,
                (t((f = {}), l, { value: e, writable: !0 }),
                t(f, n, { value: null, writable: !0 }),
                t(f, i, { value: null, writable: !0 }),
                t(f, o, { value: null, writable: !0 }),
                t(f, a, { value: e._readableState.endEmitted, writable: !0 }),
                t(f, u, {
                    value: function (e, t) {
                        var r = h[l].read();
                        r
                            ? ((h[s] = null), (h[n] = null), (h[i] = null), e(c(r, !1)))
                            : ((h[n] = e), (h[i] = t));
                    },
                    writable: !0,
                }),
                f)
            );
        return (
            (h[s] = null),
            r(e, function (e) {
                if (e && 'ERR_STREAM_PREMATURE_CLOSE' !== e.code) {
                    var t = h[i];
                    return (
                        null !== t && ((h[s] = null), (h[n] = null), (h[i] = null), t(e)),
                        void (h[o] = e)
                    );
                }
                var r = h[n];
                (null !== r && ((h[s] = null), (h[n] = null), (h[i] = null), r(c(void 0, !0))),
                    (h[a] = !0));
            }),
            e.on('readable', d.bind(null, h)),
            h
        );
    });
}
function Uo() {
    if (xo) return Ao;
    var e;
    ((xo = 1), (Ao = S), (S.ReadableState = _), Xi().EventEmitter);
    var t = function (e, t) {
            return e.listeners(t).length;
        },
        r = Qi(),
        n = uo().Buffer,
        i =
            (void 0 !== f
                ? f
                : 'undefined' != typeof window
                  ? window
                  : 'undefined' != typeof self
                    ? self
                    : {}
            ).Uint8Array || function () {};
    var o,
        a = Sr;
    o = a && a.debuglog ? a.debuglog('stream') : function () {};
    var s,
        u,
        l,
        c = vo(),
        d = lo(),
        h = bo().getHighWaterMark,
        p = go().codes,
        y = p.ERR_INVALID_ARG_TYPE,
        m = p.ERR_STREAM_PUSH_AFTER_EOF,
        g = p.ERR_METHOD_NOT_IMPLEMENTED,
        b = p.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    br()(S, r);
    var v = d.errorOrDestroy,
        w = ['error', 'close', 'destroy', 'pause', 'resume'];
    function _(t, r, n) {
        ((e = e || zo()),
            (t = t || {}),
            'boolean' != typeof n && (n = r instanceof e),
            (this.objectMode = !!t.objectMode),
            n && (this.objectMode = this.objectMode || !!t.readableObjectMode),
            (this.highWaterMark = h(this, t, 'readableHighWaterMark', n)),
            (this.buffer = new c()),
            (this.length = 0),
            (this.pipes = null),
            (this.pipesCount = 0),
            (this.flowing = null),
            (this.ended = !1),
            (this.endEmitted = !1),
            (this.reading = !1),
            (this.sync = !0),
            (this.needReadable = !1),
            (this.emittedReadable = !1),
            (this.readableListening = !1),
            (this.resumeScheduled = !1),
            (this.paused = !0),
            (this.emitClose = !1 !== t.emitClose),
            (this.autoDestroy = !!t.autoDestroy),
            (this.destroyed = !1),
            (this.defaultEncoding = t.defaultEncoding || 'utf8'),
            (this.awaitDrain = 0),
            (this.readingMore = !1),
            (this.decoder = null),
            (this.encoding = null),
            t.encoding &&
                (s || (s = No().StringDecoder),
                (this.decoder = new s(t.encoding)),
                (this.encoding = t.encoding)));
    }
    function S(t) {
        if (((e = e || zo()), !(this instanceof S))) return new S(t);
        var n = this instanceof e;
        ((this._readableState = new _(t, this, n)),
            (this.readable = !0),
            t &&
                ('function' == typeof t.read && (this._read = t.read),
                'function' == typeof t.destroy && (this._destroy = t.destroy)),
            r.call(this));
    }
    function E(e, t, r, a, s) {
        o('readableAddChunk', t);
        var u,
            l = e._readableState;
        if (null === t)
            ((l.reading = !1),
                (function (e, t) {
                    if ((o('onEofChunk'), t.ended)) return;
                    if (t.decoder) {
                        var r = t.decoder.end();
                        r &&
                            r.length &&
                            (t.buffer.push(r), (t.length += t.objectMode ? 1 : r.length));
                    }
                    ((t.ended = !0),
                        t.sync
                            ? M(e)
                            : ((t.needReadable = !1),
                              t.emittedReadable || ((t.emittedReadable = !0), A(e))));
                })(e, l));
        else if (
            (s ||
                (u = (function (e, t) {
                    var r;
                    ((o = t),
                        n.isBuffer(o) ||
                            o instanceof i ||
                            'string' == typeof t ||
                            void 0 === t ||
                            e.objectMode ||
                            (r = new y('chunk', ['string', 'Buffer', 'Uint8Array'], t)));
                    var o;
                    return r;
                })(l, t)),
            u)
        )
            v(e, u);
        else if (l.objectMode || (t && t.length > 0))
            if (
                ('string' == typeof t ||
                    l.objectMode ||
                    Object.getPrototypeOf(t) === n.prototype ||
                    (t = (function (e) {
                        return n.from(e);
                    })(t)),
                a)
            )
                l.endEmitted ? v(e, new b()) : k(e, l, t, !0);
            else if (l.ended) v(e, new m());
            else {
                if (l.destroyed) return !1;
                ((l.reading = !1),
                    l.decoder && !r
                        ? ((t = l.decoder.write(t)),
                          l.objectMode || 0 !== t.length ? k(e, l, t, !1) : x(e, l))
                        : k(e, l, t, !1));
            }
        else a || ((l.reading = !1), x(e, l));
        return !l.ended && (l.length < l.highWaterMark || 0 === l.length);
    }
    function k(e, t, r, n) {
        (t.flowing && 0 === t.length && !t.sync
            ? ((t.awaitDrain = 0), e.emit('data', r))
            : ((t.length += t.objectMode ? 1 : r.length),
              n ? t.buffer.unshift(r) : t.buffer.push(r),
              t.needReadable && M(e)),
            x(e, t));
    }
    (Object.defineProperty(S.prototype, 'destroyed', {
        enumerable: !1,
        get: function () {
            return void 0 !== this._readableState && this._readableState.destroyed;
        },
        set: function (e) {
            this._readableState && (this._readableState.destroyed = e);
        },
    }),
        (S.prototype.destroy = d.destroy),
        (S.prototype._undestroy = d.undestroy),
        (S.prototype._destroy = function (e, t) {
            t(e);
        }),
        (S.prototype.push = function (e, t) {
            var r,
                i = this._readableState;
            return (
                i.objectMode
                    ? (r = !0)
                    : 'string' == typeof e &&
                      ((t = t || i.defaultEncoding) !== i.encoding &&
                          ((e = n.from(e, t)), (t = '')),
                      (r = !0)),
                E(this, e, t, !1, r)
            );
        }),
        (S.prototype.unshift = function (e) {
            return E(this, e, null, !0, !1);
        }),
        (S.prototype.isPaused = function () {
            return !1 === this._readableState.flowing;
        }),
        (S.prototype.setEncoding = function (e) {
            s || (s = No().StringDecoder);
            var t = new s(e);
            ((this._readableState.decoder = t),
                (this._readableState.encoding = this._readableState.decoder.encoding));
            for (var r = this._readableState.buffer.head, n = ''; null !== r; )
                ((n += t.write(r.data)), (r = r.next));
            return (
                this._readableState.buffer.clear(),
                '' !== n && this._readableState.buffer.push(n),
                (this._readableState.length = n.length),
                this
            );
        }));
    var O = 1073741824;
    function T(e, t) {
        return e <= 0 || (0 === t.length && t.ended)
            ? 0
            : t.objectMode
              ? 1
              : e != e
                ? t.flowing && t.length
                    ? t.buffer.head.data.length
                    : t.length
                : (e > t.highWaterMark &&
                      (t.highWaterMark = (function (e) {
                          return (
                              e >= O
                                  ? (e = O)
                                  : (e--,
                                    (e |= e >>> 1),
                                    (e |= e >>> 2),
                                    (e |= e >>> 4),
                                    (e |= e >>> 8),
                                    (e |= e >>> 16),
                                    e++),
                              e
                          );
                      })(e)),
                  e <= t.length ? e : t.ended ? t.length : ((t.needReadable = !0), 0));
    }
    function M(e) {
        var t = e._readableState;
        (o('emitReadable', t.needReadable, t.emittedReadable),
            (t.needReadable = !1),
            t.emittedReadable ||
                (o('emitReadable', t.flowing), (t.emittedReadable = !0), process.nextTick(A, e)));
    }
    function A(e) {
        var t = e._readableState;
        (o('emitReadable_', t.destroyed, t.length, t.ended),
            t.destroyed ||
                (!t.length && !t.ended) ||
                (e.emit('readable'), (t.emittedReadable = !1)),
            (t.needReadable = !t.flowing && !t.ended && t.length <= t.highWaterMark),
            L(e));
    }
    function x(e, t) {
        t.readingMore || ((t.readingMore = !0), process.nextTick(P, e, t));
    }
    function P(e, t) {
        for (
            ;
            !t.reading && !t.ended && (t.length < t.highWaterMark || (t.flowing && 0 === t.length));
        ) {
            var r = t.length;
            if ((o('maybeReadMore read 0'), e.read(0), r === t.length)) break;
        }
        t.readingMore = !1;
    }
    function R(e) {
        var t = e._readableState;
        ((t.readableListening = e.listenerCount('readable') > 0),
            t.resumeScheduled && !t.paused
                ? (t.flowing = !0)
                : e.listenerCount('data') > 0 && e.resume());
    }
    function j(e) {
        (o('readable nexttick read 0'), e.read(0));
    }
    function C(e, t) {
        (o('resume', t.reading),
            t.reading || e.read(0),
            (t.resumeScheduled = !1),
            e.emit('resume'),
            L(e),
            t.flowing && !t.reading && e.read(0));
    }
    function L(e) {
        var t = e._readableState;
        for (o('flow', t.flowing); t.flowing && null !== e.read(); );
    }
    function I(e, t) {
        return 0 === t.length
            ? null
            : (t.objectMode
                  ? (r = t.buffer.shift())
                  : !e || e >= t.length
                    ? ((r = t.decoder
                          ? t.buffer.join('')
                          : 1 === t.buffer.length
                            ? t.buffer.first()
                            : t.buffer.concat(t.length)),
                      t.buffer.clear())
                    : (r = t.buffer.consume(e, t.decoder)),
              r);
        var r;
    }
    function D(e) {
        var t = e._readableState;
        (o('endReadable', t.endEmitted),
            t.endEmitted || ((t.ended = !0), process.nextTick(N, t, e)));
    }
    function N(e, t) {
        if (
            (o('endReadableNT', e.endEmitted, e.length),
            !e.endEmitted &&
                0 === e.length &&
                ((e.endEmitted = !0), (t.readable = !1), t.emit('end'), e.autoDestroy))
        ) {
            var r = t._writableState;
            (!r || (r.autoDestroy && r.finished)) && t.destroy();
        }
    }
    function F(e, t) {
        for (var r = 0, n = e.length; r < n; r++) if (e[r] === t) return r;
        return -1;
    }
    return (
        (S.prototype.read = function (e) {
            (o('read', e), (e = parseInt(e, 10)));
            var t = this._readableState,
                r = e;
            if (
                (0 !== e && (t.emittedReadable = !1),
                0 === e &&
                    t.needReadable &&
                    ((0 !== t.highWaterMark ? t.length >= t.highWaterMark : t.length > 0) ||
                        t.ended))
            )
                return (
                    o('read: emitReadable', t.length, t.ended),
                    0 === t.length && t.ended ? D(this) : M(this),
                    null
                );
            if (0 === (e = T(e, t)) && t.ended) return (0 === t.length && D(this), null);
            var n,
                i = t.needReadable;
            return (
                o('need readable', i),
                (0 === t.length || t.length - e < t.highWaterMark) &&
                    o('length less than watermark', (i = !0)),
                t.ended || t.reading
                    ? o('reading or ended', (i = !1))
                    : i &&
                      (o('do read'),
                      (t.reading = !0),
                      (t.sync = !0),
                      0 === t.length && (t.needReadable = !0),
                      this._read(t.highWaterMark),
                      (t.sync = !1),
                      t.reading || (e = T(r, t))),
                null === (n = e > 0 ? I(e, t) : null)
                    ? ((t.needReadable = t.length <= t.highWaterMark), (e = 0))
                    : ((t.length -= e), (t.awaitDrain = 0)),
                0 === t.length && (t.ended || (t.needReadable = !0), r !== e && t.ended && D(this)),
                null !== n && this.emit('data', n),
                n
            );
        }),
        (S.prototype._read = function (e) {
            v(this, new g('_read()'));
        }),
        (S.prototype.pipe = function (e, r) {
            var n = this,
                i = this._readableState;
            switch (i.pipesCount) {
                case 0:
                    i.pipes = e;
                    break;
                case 1:
                    i.pipes = [i.pipes, e];
                    break;
                default:
                    i.pipes.push(e);
            }
            ((i.pipesCount += 1), o('pipe count=%d opts=%j', i.pipesCount, r));
            var a = (!r || !1 !== r.end) && e !== process.stdout && e !== process.stderr ? u : y;
            function s(t, r) {
                (o('onunpipe'),
                    t === n &&
                        r &&
                        !1 === r.hasUnpiped &&
                        ((r.hasUnpiped = !0),
                        o('cleanup'),
                        e.removeListener('close', h),
                        e.removeListener('finish', p),
                        e.removeListener('drain', l),
                        e.removeListener('error', d),
                        e.removeListener('unpipe', s),
                        n.removeListener('end', u),
                        n.removeListener('end', y),
                        n.removeListener('data', f),
                        (c = !0),
                        !i.awaitDrain || (e._writableState && !e._writableState.needDrain) || l()));
            }
            function u() {
                (o('onend'), e.end());
            }
            (i.endEmitted ? process.nextTick(a) : n.once('end', a), e.on('unpipe', s));
            var l = (function (e) {
                return function () {
                    var r = e._readableState;
                    (o('pipeOnDrain', r.awaitDrain),
                        r.awaitDrain && r.awaitDrain--,
                        0 === r.awaitDrain && t(e, 'data') && ((r.flowing = !0), L(e)));
                };
            })(n);
            e.on('drain', l);
            var c = !1;
            function f(t) {
                o('ondata');
                var r = e.write(t);
                (o('dest.write', r),
                    !1 === r &&
                        (((1 === i.pipesCount && i.pipes === e) ||
                            (i.pipesCount > 1 && -1 !== F(i.pipes, e))) &&
                            !c &&
                            (o('false write response, pause', i.awaitDrain), i.awaitDrain++),
                        n.pause()));
            }
            function d(r) {
                (o('onerror', r),
                    y(),
                    e.removeListener('error', d),
                    0 === t(e, 'error') && v(e, r));
            }
            function h() {
                (e.removeListener('finish', p), y());
            }
            function p() {
                (o('onfinish'), e.removeListener('close', h), y());
            }
            function y() {
                (o('unpipe'), n.unpipe(e));
            }
            return (
                n.on('data', f),
                (function (e, t, r) {
                    if ('function' == typeof e.prependListener) return e.prependListener(t, r);
                    e._events && e._events[t]
                        ? Array.isArray(e._events[t])
                            ? e._events[t].unshift(r)
                            : (e._events[t] = [r, e._events[t]])
                        : e.on(t, r);
                })(e, 'error', d),
                e.once('close', h),
                e.once('finish', p),
                e.emit('pipe', n),
                i.flowing || (o('pipe resume'), n.resume()),
                e
            );
        }),
        (S.prototype.unpipe = function (e) {
            var t = this._readableState,
                r = { hasUnpiped: !1 };
            if (0 === t.pipesCount) return this;
            if (1 === t.pipesCount)
                return (
                    (e && e !== t.pipes) ||
                        (e || (e = t.pipes),
                        (t.pipes = null),
                        (t.pipesCount = 0),
                        (t.flowing = !1),
                        e && e.emit('unpipe', this, r)),
                    this
                );
            if (!e) {
                var n = t.pipes,
                    i = t.pipesCount;
                ((t.pipes = null), (t.pipesCount = 0), (t.flowing = !1));
                for (var o = 0; o < i; o++) n[o].emit('unpipe', this, { hasUnpiped: !1 });
                return this;
            }
            var a = F(t.pipes, e);
            return (
                -1 === a ||
                    (t.pipes.splice(a, 1),
                    (t.pipesCount -= 1),
                    1 === t.pipesCount && (t.pipes = t.pipes[0]),
                    e.emit('unpipe', this, r)),
                this
            );
        }),
        (S.prototype.on = function (e, t) {
            var n = r.prototype.on.call(this, e, t),
                i = this._readableState;
            return (
                'data' === e
                    ? ((i.readableListening = this.listenerCount('readable') > 0),
                      !1 !== i.flowing && this.resume())
                    : 'readable' === e &&
                      (i.endEmitted ||
                          i.readableListening ||
                          ((i.readableListening = i.needReadable = !0),
                          (i.flowing = !1),
                          (i.emittedReadable = !1),
                          o('on readable', i.length, i.reading),
                          i.length ? M(this) : i.reading || process.nextTick(j, this))),
                n
            );
        }),
        (S.prototype.addListener = S.prototype.on),
        (S.prototype.removeListener = function (e, t) {
            var n = r.prototype.removeListener.call(this, e, t);
            return ('readable' === e && process.nextTick(R, this), n);
        }),
        (S.prototype.removeAllListeners = function (e) {
            var t = r.prototype.removeAllListeners.apply(this, arguments);
            return (('readable' !== e && void 0 !== e) || process.nextTick(R, this), t);
        }),
        (S.prototype.resume = function () {
            var e = this._readableState;
            return (
                e.flowing ||
                    (o('resume'),
                    (e.flowing = !e.readableListening),
                    (function (e, t) {
                        t.resumeScheduled || ((t.resumeScheduled = !0), process.nextTick(C, e, t));
                    })(this, e)),
                (e.paused = !1),
                this
            );
        }),
        (S.prototype.pause = function () {
            return (
                o('call pause flowing=%j', this._readableState.flowing),
                !1 !== this._readableState.flowing &&
                    (o('pause'), (this._readableState.flowing = !1), this.emit('pause')),
                (this._readableState.paused = !0),
                this
            );
        }),
        (S.prototype.wrap = function (e) {
            var t = this,
                r = this._readableState,
                n = !1;
            for (var i in (e.on('end', function () {
                if ((o('wrapped end'), r.decoder && !r.ended)) {
                    var e = r.decoder.end();
                    e && e.length && t.push(e);
                }
                t.push(null);
            }),
            e.on('data', function (i) {
                (o('wrapped data'),
                r.decoder && (i = r.decoder.write(i)),
                r.objectMode && null == i) ||
                    ((r.objectMode || (i && i.length)) && (t.push(i) || ((n = !0), e.pause())));
            }),
            e))
                void 0 === this[i] &&
                    'function' == typeof e[i] &&
                    (this[i] = (function (t) {
                        return function () {
                            return e[t].apply(e, arguments);
                        };
                    })(i));
            for (var a = 0; a < w.length; a++) e.on(w[a], this.emit.bind(this, w[a]));
            return (
                (this._read = function (t) {
                    (o('wrapped _read', t), n && ((n = !1), e.resume()));
                }),
                this
            );
        }),
        'function' == typeof Symbol &&
            (S.prototype[Symbol.asyncIterator] = function () {
                return (void 0 === u && (u = Bo()), u(this));
            }),
        Object.defineProperty(S.prototype, 'readableHighWaterMark', {
            enumerable: !1,
            get: function () {
                return this._readableState.highWaterMark;
            },
        }),
        Object.defineProperty(S.prototype, 'readableBuffer', {
            enumerable: !1,
            get: function () {
                return this._readableState && this._readableState.buffer;
            },
        }),
        Object.defineProperty(S.prototype, 'readableFlowing', {
            enumerable: !1,
            get: function () {
                return this._readableState.flowing;
            },
            set: function (e) {
                this._readableState && (this._readableState.flowing = e);
            },
        }),
        (S._fromList = I),
        Object.defineProperty(S.prototype, 'readableLength', {
            enumerable: !1,
            get: function () {
                return this._readableState.length;
            },
        }),
        'function' == typeof Symbol &&
            (S.from = function (e, t) {
                return (
                    void 0 === l &&
                        (l = Mo
                            ? To
                            : ((Mo = 1),
                              (To = function () {
                                  throw new Error('Readable.from is not available in the browser');
                              }))),
                    l(S, e, t)
                );
            }),
        Ao
    );
}
function zo() {
    if (Ro) return Po;
    Ro = 1;
    var e =
        Object.keys ||
        function (e) {
            var t = [];
            for (var r in e) t.push(r);
            return t;
        };
    Po = a;
    var t = Uo(),
        r = Go();
    br()(a, t);
    for (var n = e(r.prototype), i = 0; i < n.length; i++) {
        var o = n[i];
        a.prototype[o] || (a.prototype[o] = r.prototype[o]);
    }
    function a(e) {
        if (!(this instanceof a)) return new a(e);
        (t.call(this, e),
            r.call(this, e),
            (this.allowHalfOpen = !0),
            e &&
                (!1 === e.readable && (this.readable = !1),
                !1 === e.writable && (this.writable = !1),
                !1 === e.allowHalfOpen && ((this.allowHalfOpen = !1), this.once('end', s))));
    }
    function s() {
        this._writableState.ended || process.nextTick(u, this);
    }
    function u(e) {
        e.end();
    }
    return (
        Object.defineProperty(a.prototype, 'writableHighWaterMark', {
            enumerable: !1,
            get: function () {
                return this._writableState.highWaterMark;
            },
        }),
        Object.defineProperty(a.prototype, 'writableBuffer', {
            enumerable: !1,
            get: function () {
                return this._writableState && this._writableState.getBuffer();
            },
        }),
        Object.defineProperty(a.prototype, 'writableLength', {
            enumerable: !1,
            get: function () {
                return this._writableState.length;
            },
        }),
        Object.defineProperty(a.prototype, 'destroyed', {
            enumerable: !1,
            get: function () {
                return (
                    void 0 !== this._readableState &&
                    void 0 !== this._writableState &&
                    this._readableState.destroyed &&
                    this._writableState.destroyed
                );
            },
            set: function (e) {
                void 0 !== this._readableState &&
                    void 0 !== this._writableState &&
                    ((this._readableState.destroyed = e), (this._writableState.destroyed = e));
            },
        }),
        Po
    );
}
function Go() {
    if (Co) return jo;
    function e(e) {
        var t = this;
        ((this.next = null),
            (this.entry = null),
            (this.finish = function () {
                !(function (e, t, r) {
                    var n = e.entry;
                    e.entry = null;
                    for (; n; ) {
                        var i = n.callback;
                        (t.pendingcb--, i(r), (n = n.next));
                    }
                    t.corkedRequestsFree.next = e;
                })(t, e);
            }));
    }
    var t;
    ((Co = 1), (jo = S), (S.WritableState = _));
    var r = { deprecate: qi() },
        n = Qi(),
        i = uo().Buffer,
        o =
            (void 0 !== f
                ? f
                : 'undefined' != typeof window
                  ? window
                  : 'undefined' != typeof self
                    ? self
                    : {}
            ).Uint8Array || function () {};
    var a,
        s = lo(),
        u = bo().getHighWaterMark,
        l = go().codes,
        c = l.ERR_INVALID_ARG_TYPE,
        d = l.ERR_METHOD_NOT_IMPLEMENTED,
        h = l.ERR_MULTIPLE_CALLBACK,
        p = l.ERR_STREAM_CANNOT_PIPE,
        y = l.ERR_STREAM_DESTROYED,
        m = l.ERR_STREAM_NULL_VALUES,
        g = l.ERR_STREAM_WRITE_AFTER_END,
        b = l.ERR_UNKNOWN_ENCODING,
        v = s.errorOrDestroy;
    function w() {}
    function _(r, n, i) {
        ((t = t || zo()),
            (r = r || {}),
            'boolean' != typeof i && (i = n instanceof t),
            (this.objectMode = !!r.objectMode),
            i && (this.objectMode = this.objectMode || !!r.writableObjectMode),
            (this.highWaterMark = u(this, r, 'writableHighWaterMark', i)),
            (this.finalCalled = !1),
            (this.needDrain = !1),
            (this.ending = !1),
            (this.ended = !1),
            (this.finished = !1),
            (this.destroyed = !1));
        var o = !1 === r.decodeStrings;
        ((this.decodeStrings = !o),
            (this.defaultEncoding = r.defaultEncoding || 'utf8'),
            (this.length = 0),
            (this.writing = !1),
            (this.corked = 0),
            (this.sync = !0),
            (this.bufferProcessing = !1),
            (this.onwrite = function (e) {
                !(function (e, t) {
                    var r = e._writableState,
                        n = r.sync,
                        i = r.writecb;
                    if ('function' != typeof i) throw new h();
                    if (
                        ((function (e) {
                            ((e.writing = !1),
                                (e.writecb = null),
                                (e.length -= e.writelen),
                                (e.writelen = 0));
                        })(r),
                        t)
                    )
                        !(function (e, t, r, n, i) {
                            (--t.pendingcb,
                                r
                                    ? (process.nextTick(i, n),
                                      process.nextTick(A, e, t),
                                      (e._writableState.errorEmitted = !0),
                                      v(e, n))
                                    : (i(n),
                                      (e._writableState.errorEmitted = !0),
                                      v(e, n),
                                      A(e, t)));
                        })(e, r, n, t, i);
                    else {
                        var o = T(r) || e.destroyed;
                        (o || r.corked || r.bufferProcessing || !r.bufferedRequest || O(e, r),
                            n ? process.nextTick(k, e, r, o, i) : k(e, r, o, i));
                    }
                })(n, e);
            }),
            (this.writecb = null),
            (this.writelen = 0),
            (this.bufferedRequest = null),
            (this.lastBufferedRequest = null),
            (this.pendingcb = 0),
            (this.prefinished = !1),
            (this.errorEmitted = !1),
            (this.emitClose = !1 !== r.emitClose),
            (this.autoDestroy = !!r.autoDestroy),
            (this.bufferedRequestCount = 0),
            (this.corkedRequestsFree = new e(this)));
    }
    function S(e) {
        var r = this instanceof (t = t || zo());
        if (!r && !a.call(S, this)) return new S(e);
        ((this._writableState = new _(e, this, r)),
            (this.writable = !0),
            e &&
                ('function' == typeof e.write && (this._write = e.write),
                'function' == typeof e.writev && (this._writev = e.writev),
                'function' == typeof e.destroy && (this._destroy = e.destroy),
                'function' == typeof e.final && (this._final = e.final)),
            n.call(this));
    }
    function E(e, t, r, n, i, o, a) {
        ((t.writelen = n),
            (t.writecb = a),
            (t.writing = !0),
            (t.sync = !0),
            t.destroyed
                ? t.onwrite(new y('write'))
                : r
                  ? e._writev(i, t.onwrite)
                  : e._write(i, o, t.onwrite),
            (t.sync = !1));
    }
    function k(e, t, r, n) {
        (r ||
            (function (e, t) {
                0 === t.length && t.needDrain && ((t.needDrain = !1), e.emit('drain'));
            })(e, t),
            t.pendingcb--,
            n(),
            A(e, t));
    }
    function O(t, r) {
        r.bufferProcessing = !0;
        var n = r.bufferedRequest;
        if (t._writev && n && n.next) {
            var i = r.bufferedRequestCount,
                o = new Array(i),
                a = r.corkedRequestsFree;
            a.entry = n;
            for (var s = 0, u = !0; n; ) ((o[s] = n), n.isBuf || (u = !1), (n = n.next), (s += 1));
            ((o.allBuffers = u),
                E(t, r, !0, r.length, o, '', a.finish),
                r.pendingcb++,
                (r.lastBufferedRequest = null),
                a.next
                    ? ((r.corkedRequestsFree = a.next), (a.next = null))
                    : (r.corkedRequestsFree = new e(r)),
                (r.bufferedRequestCount = 0));
        } else {
            for (; n; ) {
                var l = n.chunk,
                    c = n.encoding,
                    f = n.callback;
                if (
                    (E(t, r, !1, r.objectMode ? 1 : l.length, l, c, f),
                    (n = n.next),
                    r.bufferedRequestCount--,
                    r.writing)
                )
                    break;
            }
            null === n && (r.lastBufferedRequest = null);
        }
        ((r.bufferedRequest = n), (r.bufferProcessing = !1));
    }
    function T(e) {
        return (
            e.ending && 0 === e.length && null === e.bufferedRequest && !e.finished && !e.writing
        );
    }
    function M(e, t) {
        e._final(function (r) {
            (t.pendingcb--, r && v(e, r), (t.prefinished = !0), e.emit('prefinish'), A(e, t));
        });
    }
    function A(e, t) {
        var r = T(t);
        if (
            r &&
            ((function (e, t) {
                t.prefinished ||
                    t.finalCalled ||
                    ('function' != typeof e._final || t.destroyed
                        ? ((t.prefinished = !0), e.emit('prefinish'))
                        : (t.pendingcb++, (t.finalCalled = !0), process.nextTick(M, e, t)));
            })(e, t),
            0 === t.pendingcb && ((t.finished = !0), e.emit('finish'), t.autoDestroy))
        ) {
            var n = e._readableState;
            (!n || (n.autoDestroy && n.endEmitted)) && e.destroy();
        }
        return r;
    }
    return (
        br()(S, n),
        (_.prototype.getBuffer = function () {
            for (var e = this.bufferedRequest, t = []; e; ) (t.push(e), (e = e.next));
            return t;
        }),
        (function () {
            try {
                Object.defineProperty(_.prototype, 'buffer', {
                    get: r.deprecate(
                        function () {
                            return this.getBuffer();
                        },
                        '_writableState.buffer is deprecated. Use _writableState.getBuffer instead.',
                        'DEP0003'
                    ),
                });
            } catch (e) {}
        })(),
        'function' == typeof Symbol &&
        Symbol.hasInstance &&
        'function' == typeof Function.prototype[Symbol.hasInstance]
            ? ((a = Function.prototype[Symbol.hasInstance]),
              Object.defineProperty(S, Symbol.hasInstance, {
                  value: function (e) {
                      return (
                          !!a.call(this, e) || (this === S && e && e._writableState instanceof _)
                      );
                  },
              }))
            : (a = function (e) {
                  return e instanceof this;
              }),
        (S.prototype.pipe = function () {
            v(this, new p());
        }),
        (S.prototype.write = function (e, t, r) {
            var n,
                a = this._writableState,
                s = !1,
                u = !a.objectMode && ((n = e), i.isBuffer(n) || n instanceof o);
            return (
                u &&
                    !i.isBuffer(e) &&
                    (e = (function (e) {
                        return i.from(e);
                    })(e)),
                'function' == typeof t && ((r = t), (t = null)),
                u ? (t = 'buffer') : t || (t = a.defaultEncoding),
                'function' != typeof r && (r = w),
                a.ending
                    ? (function (e, t) {
                          var r = new g();
                          (v(e, r), process.nextTick(t, r));
                      })(this, r)
                    : (u ||
                          (function (e, t, r, n) {
                              var i;
                              return (
                                  null === r
                                      ? (i = new m())
                                      : 'string' == typeof r ||
                                        t.objectMode ||
                                        (i = new c('chunk', ['string', 'Buffer'], r)),
                                  !i || (v(e, i), process.nextTick(n, i), !1)
                              );
                          })(this, a, e, r)) &&
                      (a.pendingcb++,
                      (s = (function (e, t, r, n, o, a) {
                          if (!r) {
                              var s = (function (e, t, r) {
                                  e.objectMode ||
                                      !1 === e.decodeStrings ||
                                      'string' != typeof t ||
                                      (t = i.from(t, r));
                                  return t;
                              })(t, n, o);
                              n !== s && ((r = !0), (o = 'buffer'), (n = s));
                          }
                          var u = t.objectMode ? 1 : n.length;
                          t.length += u;
                          var l = t.length < t.highWaterMark;
                          l || (t.needDrain = !0);
                          if (t.writing || t.corked) {
                              var c = t.lastBufferedRequest;
                              ((t.lastBufferedRequest = {
                                  chunk: n,
                                  encoding: o,
                                  isBuf: r,
                                  callback: a,
                                  next: null,
                              }),
                                  c
                                      ? (c.next = t.lastBufferedRequest)
                                      : (t.bufferedRequest = t.lastBufferedRequest),
                                  (t.bufferedRequestCount += 1));
                          } else E(e, t, !1, u, n, o, a);
                          return l;
                      })(this, a, u, e, t, r))),
                s
            );
        }),
        (S.prototype.cork = function () {
            this._writableState.corked++;
        }),
        (S.prototype.uncork = function () {
            var e = this._writableState;
            e.corked &&
                (e.corked--,
                e.writing || e.corked || e.bufferProcessing || !e.bufferedRequest || O(this, e));
        }),
        (S.prototype.setDefaultEncoding = function (e) {
            if (
                ('string' == typeof e && (e = e.toLowerCase()),
                !(
                    [
                        'hex',
                        'utf8',
                        'utf-8',
                        'ascii',
                        'binary',
                        'base64',
                        'ucs2',
                        'ucs-2',
                        'utf16le',
                        'utf-16le',
                        'raw',
                    ].indexOf((e + '').toLowerCase()) > -1
                ))
            )
                throw new b(e);
            return ((this._writableState.defaultEncoding = e), this);
        }),
        Object.defineProperty(S.prototype, 'writableBuffer', {
            enumerable: !1,
            get: function () {
                return this._writableState && this._writableState.getBuffer();
            },
        }),
        Object.defineProperty(S.prototype, 'writableHighWaterMark', {
            enumerable: !1,
            get: function () {
                return this._writableState.highWaterMark;
            },
        }),
        (S.prototype._write = function (e, t, r) {
            r(new d('_write()'));
        }),
        (S.prototype._writev = null),
        (S.prototype.end = function (e, t, r) {
            var n = this._writableState;
            return (
                'function' == typeof e
                    ? ((r = e), (e = null), (t = null))
                    : 'function' == typeof t && ((r = t), (t = null)),
                null != e && this.write(e, t),
                n.corked && ((n.corked = 1), this.uncork()),
                n.ending ||
                    (function (e, t, r) {
                        ((t.ending = !0),
                            A(e, t),
                            r && (t.finished ? process.nextTick(r) : e.once('finish', r)));
                        ((t.ended = !0), (e.writable = !1));
                    })(this, n, r),
                this
            );
        }),
        Object.defineProperty(S.prototype, 'writableLength', {
            enumerable: !1,
            get: function () {
                return this._writableState.length;
            },
        }),
        Object.defineProperty(S.prototype, 'destroyed', {
            enumerable: !1,
            get: function () {
                return void 0 !== this._writableState && this._writableState.destroyed;
            },
            set: function (e) {
                this._writableState && (this._writableState.destroyed = e);
            },
        }),
        (S.prototype.destroy = s.destroy),
        (S.prototype._undestroy = s.undestroy),
        (S.prototype._destroy = function (e, t) {
            t(e);
        }),
        jo
    );
}
function $o() {
    if (Lo) return Vi.exports;
    Lo = 1;
    var e = vr(),
        t = Go(),
        r = sn().LEVEL,
        n = (Vi.exports = function () {
            var e = this,
                r = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
            (t.call(this, { objectMode: !0, highWaterMark: r.highWaterMark }),
                (this.format = r.format),
                (this.level = r.level),
                (this.handleExceptions = r.handleExceptions),
                (this.handleRejections = r.handleRejections),
                (this.silent = r.silent),
                r.log && (this.log = r.log),
                r.logv && (this.logv = r.logv),
                r.close && (this.close = r.close),
                this.once('pipe', function (t) {
                    ((e.levels = t.levels), (e.parent = t));
                }),
                this.once('unpipe', function (t) {
                    t === e.parent && ((e.parent = null), e.close && e.close());
                }));
        });
    return (
        e.inherits(n, t),
        (n.prototype._write = function (e, t, n) {
            if (this.silent || (!0 === e.exception && !this.handleExceptions)) return n(null);
            var i = this.level || (this.parent && this.parent.level);
            if (!i || this.levels[i] >= this.levels[e[r]]) {
                if (e && !this.format) return this.log(e, n);
                var o = void 0,
                    a = void 0;
                try {
                    a = this.format.transform(Object.assign({}, e), this.format.options);
                } catch (s) {
                    o = s;
                }
                if (o || !a) {
                    if ((n(), o)) throw o;
                    return;
                }
                return this.log(a, n);
            }
            return ((this._writableState.sync = !1), n(null));
        }),
        (n.prototype._writev = function (e, t) {
            if (this.logv) {
                var r = e.filter(this._accept, this);
                return r.length ? this.logv(r, t) : t(null);
            }
            for (var n = 0; n < e.length; n++)
                if (this._accept(e[n]))
                    if (!e[n].chunk || this.format) {
                        var i = void 0,
                            o = void 0;
                        try {
                            o = this.format.transform(
                                Object.assign({}, e[n].chunk),
                                this.format.options
                            );
                        } catch (a) {
                            i = a;
                        }
                        if (i || !o) {
                            if ((e[n].callback(), i)) throw (t(null), i);
                        } else this.log(o, e[n].callback);
                    } else this.log(e[n].chunk, e[n].callback);
            return t(null);
        }),
        (n.prototype._accept = function (e) {
            var t = e.chunk;
            if (this.silent) return !1;
            var n = this.level || (this.parent && this.parent.level);
            return !(
                (!0 !== t.exception && n && !(this.levels[n] >= this.levels[t[r]])) ||
                (!this.handleExceptions && !0 === t.exception)
            );
        }),
        (n.prototype._nop = function () {}),
        Vi.exports
    );
}
var Wo,
    Ho,
    Vo,
    qo,
    Yo = { exports: {} };
function Ko() {
    return (
        Ho ||
            ((Ho = 1),
            (Hi.exports = $o()),
            (Hi.exports.LegacyTransportStream = (function () {
                if (Wo) return Yo.exports;
                Wo = 1;
                var e = vr(),
                    t = sn().LEVEL,
                    r = $o(),
                    n = (Yo.exports = function () {
                        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                        if ((r.call(this, e), !e.transport || 'function' != typeof e.transport.log))
                            throw new Error(
                                'Invalid transport, must be an object with a log method.'
                            );
                        ((this.transport = e.transport),
                            (this.level = this.level || e.transport.level),
                            (this.handleExceptions =
                                this.handleExceptions || e.transport.handleExceptions),
                            this._deprecated(),
                            this.transport.__winstonError ||
                                ((this.transport.__winstonError = function (e) {
                                    this.emit('error', e, this.transport);
                                }.bind(this)),
                                this.transport.on('error', this.transport.__winstonError)));
                    });
                return (
                    e.inherits(n, r),
                    (n.prototype._write = function (e, r, n) {
                        if (this.silent || (!0 === e.exception && !this.handleExceptions))
                            return n(null);
                        ((!this.level || this.levels[this.level] >= this.levels[e[t]]) &&
                            this.transport.log(e[t], e.message, e, this._nop),
                            n(null));
                    }),
                    (n.prototype._writev = function (e, r) {
                        for (var n = 0; n < e.length; n++)
                            this._accept(e[n]) &&
                                (this.transport.log(
                                    e[n].chunk[t],
                                    e[n].chunk.message,
                                    e[n].chunk,
                                    this._nop
                                ),
                                e[n].callback());
                        return r(null);
                    }),
                    (n.prototype._deprecated = function () {}),
                    (n.prototype.close = function () {
                        (this.transport.close && this.transport.close(),
                            this.transport.__winstonError &&
                                (this.transport.removeListener(
                                    'error',
                                    this.transport.__winstonError
                                ),
                                (this.transport.__winstonError = null)));
                    }),
                    Yo.exports
                );
            })())),
        Hi.exports
    );
}
function Jo() {
    if (qo) return Vo;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    function n(t, r, n) {
        return (
            (r = o(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, i() ? Reflect.construct(r, n || [], o(t).constructor) : r.apply(t, n))
        );
    }
    function i() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (i = function () {
            return !!e;
        })();
    }
    function o(e) {
        return (o = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function a(e, t) {
        return (a = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    qo = 1;
    var s = Sr,
        u = sn(),
        l = u.LEVEL,
        c = u.MESSAGE,
        f = Ko();
    return (
        (Vo = (function (e) {
            function r() {
                var e,
                    t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                return (
                    (function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, r),
                    ((e = n(this, r, [t])).name = t.name || 'console'),
                    (e.stderrLevels = e._stringArrayToSet(t.stderrLevels)),
                    (e.consoleWarnLevels = e._stringArrayToSet(t.consoleWarnLevels)),
                    (e.eol = 'string' == typeof t.eol ? t.eol : s.EOL),
                    (e.forceConsole = t.forceConsole || !1),
                    (e._consoleLog = function () {}.bind()),
                    (e._consoleWarn = function () {}.bind()),
                    (e._consoleError = function () {}.bind()),
                    e.setMaxListeners(30),
                    e
                );
            }
            return (
                (function (e, t) {
                    if ('function' != typeof t && null !== t)
                        throw new TypeError('Super expression must either be null or a function');
                    ((e.prototype = Object.create(t && t.prototype, {
                        constructor: { value: e, writable: !0, configurable: !0 },
                    })),
                        Object.defineProperty(e, 'prototype', { writable: !1 }),
                        t && a(e, t));
                })(r, e),
                t(r, [
                    {
                        key: 'log',
                        value: function (e, t) {
                            var r = this;
                            return (
                                setImmediate(function () {
                                    return r.emit('logged', e);
                                }),
                                this.stderrLevels[e[l]]
                                    ? ((console._stderr && !this.forceConsole) ||
                                          this._consoleError(e[c]),
                                      void (t && t()))
                                    : this.consoleWarnLevels[e[l]]
                                      ? ((console._stderr && !this.forceConsole) ||
                                            this._consoleWarn(e[c]),
                                        void (t && t()))
                                      : ((console._stdout && !this.forceConsole) ||
                                            this._consoleLog(e[c]),
                                        void (t && t()))
                            );
                        },
                    },
                    {
                        key: '_stringArrayToSet',
                        value: function (e, t) {
                            if (!e) return {};
                            if (
                                ((t =
                                    t ||
                                    'Cannot make set from type other than Array of string elements'),
                                !Array.isArray(e))
                            )
                                throw new Error(t);
                            return e.reduce(function (e, r) {
                                if ('string' != typeof r) throw new Error(t);
                                return ((e[r] = !0), e);
                            }, {});
                        },
                    },
                ])
            );
        })(f)),
        Vo
    );
}
var Zo,
    Xo = { exports: {} },
    Qo = { exports: {} },
    ea = { exports: {} };
function ta() {
    return (
        Zo ||
            ((Zo = 1),
            (e = ea),
            (t = ea.exports),
            Object.defineProperty(t, '__esModule', { value: !0 }),
            (t.default = function (e) {
                return e && 'number' == typeof e.length && e.length >= 0 && e.length % 1 == 0;
            }),
            (e.exports = t.default)),
        ea.exports
    );
    var e, t;
}
var ra,
    na = {},
    ia = { exports: {} },
    oa = { exports: {} };
var aa,
    sa,
    ua,
    la = {};
function ca() {
    return (
        sa ||
            ((sa = 1),
            (function (e, t) {
                (Object.defineProperty(t, '__esModule', { value: !0 }),
                    (t.default = function (e) {
                        if ((0, o.isAsync)(e))
                            return function (...t) {
                                const r = t.pop();
                                return s(e.apply(this, t), r);
                            };
                        return (0, n.default)(function (t, r) {
                            var n;
                            try {
                                n = e.apply(this, t);
                            } catch (i) {
                                return r(i);
                            }
                            if (n && 'function' == typeof n.then) return s(n, r);
                            r(null, n);
                        });
                    }));
                var r = (function () {
                        return (
                            ra ||
                                ((ra = 1),
                                (e = oa),
                                (t = oa.exports),
                                Object.defineProperty(t, '__esModule', { value: !0 }),
                                (t.default = function (e) {
                                    return function (...t) {
                                        var r = t.pop();
                                        return e.call(this, t, r);
                                    };
                                }),
                                (e.exports = t.default)),
                            oa.exports
                        );
                        var e, t;
                    })(),
                    n = a(r),
                    i = a(
                        (function () {
                            if (aa) return la;
                            ((aa = 1),
                                Object.defineProperty(la, '__esModule', { value: !0 }),
                                (la.fallback = i),
                                (la.wrap = o));
                            var e,
                                t = (la.hasQueueMicrotask =
                                    'function' == typeof queueMicrotask && queueMicrotask),
                                r = (la.hasSetImmediate =
                                    'function' == typeof setImmediate && setImmediate),
                                n = (la.hasNextTick =
                                    'object' == typeof process &&
                                    'function' == typeof process.nextTick);
                            function i(e) {
                                setTimeout(e, 0);
                            }
                            function o(e) {
                                return (t, ...r) => e(() => t(...r));
                            }
                            return (
                                (e = t
                                    ? queueMicrotask
                                    : r
                                      ? setImmediate
                                      : n
                                        ? process.nextTick
                                        : i),
                                (la.default = o(e)),
                                la
                            );
                        })()
                    ),
                    o = fa();
                function a(e) {
                    return e && e.__esModule ? e : { default: e };
                }
                function s(e, t) {
                    return e.then(
                        (e) => {
                            u(t, null, e);
                        },
                        (e) => {
                            u(t, e && (e instanceof Error || e.message) ? e : new Error(e));
                        }
                    );
                }
                function u(e, t, r) {
                    try {
                        e(t, r);
                    } catch (n) {
                        (0, i.default)((e) => {
                            throw e;
                        }, n);
                    }
                }
                e.exports = t.default;
            })(ia, ia.exports)),
        ia.exports
    );
}
function fa() {
    if (ua) return na;
    ((ua = 1),
        Object.defineProperty(na, '__esModule', { value: !0 }),
        (na.isAsyncIterable = na.isAsyncGenerator = na.isAsync = void 0));
    var e,
        t = ca(),
        r = (e = t) && e.__esModule ? e : { default: e };
    function n(e) {
        return 'AsyncFunction' === e[Symbol.toStringTag];
    }
    return (
        (na.default = function (e) {
            if ('function' != typeof e) throw new Error('expected a function');
            return n(e) ? (0, r.default)(e) : e;
        }),
        (na.isAsync = n),
        (na.isAsyncGenerator = function (e) {
            return 'AsyncGenerator' === e[Symbol.toStringTag];
        }),
        (na.isAsyncIterable = function (e) {
            return 'function' == typeof e[Symbol.asyncIterator];
        }),
        na
    );
}
var da,
    ha,
    pa = { exports: {} };
function ya() {
    return (
        da ||
            ((da = 1),
            (e = pa),
            (t = pa.exports),
            Object.defineProperty(t, '__esModule', { value: !0 }),
            (t.default = function (e, t) {
                if ((t || (t = e.length), !t)) throw new Error('arity is undefined');
                return function (...r) {
                    return 'function' == typeof r[t - 1]
                        ? e.apply(this, r)
                        : new Promise((n, i) => {
                              ((r[t - 1] = (e, ...t) => {
                                  if (e) return i(e);
                                  n(t.length > 1 ? t : t[0]);
                              }),
                                  e.apply(this, r));
                          });
                };
            }),
            (e.exports = t.default)),
        pa.exports
    );
    var e, t;
}
var ma,
    ga = { exports: {} },
    ba = { exports: {} },
    va = { exports: {} },
    wa = { exports: {} };
function _a() {
    return (
        ma ||
            ((ma = 1),
            (e = wa),
            (t = wa.exports),
            Object.defineProperty(t, '__esModule', { value: !0 }),
            (t.default = function (e) {
                function t(...t) {
                    if (null !== e) {
                        var r = e;
                        ((e = null), r.apply(this, t));
                    }
                }
                return (Object.assign(t, e), t);
            }),
            (e.exports = t.default)),
        wa.exports
    );
    var e, t;
}
var Sa,
    Ea,
    ka = { exports: {} },
    Oa = { exports: {} };
function Ta() {
    return (
        Ea ||
            ((Ea = 1),
            (function (e, t) {
                (Object.defineProperty(t, '__esModule', { value: !0 }),
                    (t.default = function (e) {
                        if ((0, r.default)(e))
                            return (function (e) {
                                var t = -1,
                                    r = e.length;
                                return function () {
                                    return ++t < r ? { value: e[t], key: t } : null;
                                };
                            })(e);
                        var t = (0, i.default)(e);
                        return t
                            ? (function (e) {
                                  var t = -1;
                                  return function () {
                                      var r = e.next();
                                      return r.done ? null : (t++, { value: r.value, key: t });
                                  };
                              })(t)
                            : ((n = e),
                              (o = n ? Object.keys(n) : []),
                              (a = -1),
                              (s = o.length),
                              function e() {
                                  var t = o[++a];
                                  return '__proto__' === t
                                      ? e()
                                      : a < s
                                        ? { value: n[t], key: t }
                                        : null;
                              });
                        var n, o, a, s;
                    }));
                var r = o(ta()),
                    n = (function () {
                        return (
                            Sa ||
                                ((Sa = 1),
                                (e = Oa),
                                (t = Oa.exports),
                                Object.defineProperty(t, '__esModule', { value: !0 }),
                                (t.default = function (e) {
                                    return e[Symbol.iterator] && e[Symbol.iterator]();
                                }),
                                (e.exports = t.default)),
                            Oa.exports
                        );
                        var e, t;
                    })(),
                    i = o(n);
                function o(e) {
                    return e && e.__esModule ? e : { default: e };
                }
                e.exports = t.default;
            })(ka, ka.exports)),
        ka.exports
    );
}
var Ma,
    Aa = { exports: {} };
function xa() {
    return (
        Ma ||
            ((Ma = 1),
            (e = Aa),
            (t = Aa.exports),
            Object.defineProperty(t, '__esModule', { value: !0 }),
            (t.default = function (e) {
                return function (...t) {
                    if (null === e) throw new Error('Callback was already called.');
                    var r = e;
                    ((e = null), r.apply(this, t));
                };
            }),
            (e.exports = t.default)),
        Aa.exports
    );
    var e, t;
}
var Pa,
    Ra,
    ja,
    Ca,
    La,
    Ia,
    Da = { exports: {} },
    Na = { exports: {} };
function Fa() {
    return (
        Pa ||
            ((Pa = 1),
            (function (e, t) {
                Object.defineProperty(t, '__esModule', { value: !0 });
                ((t.default = {}), (e.exports = t.default));
            })(Na, Na.exports)),
        Na.exports
    );
}
function Ba() {
    return (
        ja ||
            ((ja = 1),
            (function (e, t) {
                Object.defineProperty(t, '__esModule', { value: !0 });
                var r = l(_a()),
                    n = l(Ta()),
                    i = l(xa()),
                    o = fa(),
                    a =
                        (Ra ||
                            ((Ra = 1),
                            (function (e, t) {
                                (Object.defineProperty(t, '__esModule', { value: !0 }),
                                    (t.default = function (e, t, r, i) {
                                        let o = !1,
                                            a = !1,
                                            s = !1,
                                            u = 0,
                                            l = 0;
                                        function c() {
                                            u >= t ||
                                                s ||
                                                o ||
                                                ((s = !0),
                                                e
                                                    .next()
                                                    .then(({ value: e, done: t }) => {
                                                        if (!a && !o) {
                                                            if (((s = !1), t))
                                                                return (
                                                                    (o = !0),
                                                                    void (u <= 0 && i(null))
                                                                );
                                                            (u++, r(e, l, f), l++, c());
                                                        }
                                                    })
                                                    .catch(d));
                                        }
                                        function f(e, t) {
                                            if (((u -= 1), !a))
                                                return e
                                                    ? d(e)
                                                    : !1 === e
                                                      ? ((o = !0), void (a = !0))
                                                      : t === n.default || (o && u <= 0)
                                                        ? ((o = !0), i(null))
                                                        : void c();
                                        }
                                        function d(e) {
                                            a || ((s = !1), (o = !0), i(e));
                                        }
                                        c();
                                    }));
                                var r,
                                    n = (r = Fa()) && r.__esModule ? r : { default: r };
                                e.exports = t.default;
                            })(Da, Da.exports)),
                        Da.exports),
                    s = l(a),
                    u = l(Fa());
                function l(e) {
                    return e && e.__esModule ? e : { default: e };
                }
                ((t.default = (e) => (t, a, l) => {
                    if (((l = (0, r.default)(l)), e <= 0))
                        throw new RangeError('concurrency limit cannot be less than 1');
                    if (!t) return l(null);
                    if ((0, o.isAsyncGenerator)(t)) return (0, s.default)(t, e, a, l);
                    if ((0, o.isAsyncIterable)(t))
                        return (0, s.default)(t[Symbol.asyncIterator](), e, a, l);
                    var c = (0, n.default)(t),
                        f = !1,
                        d = !1,
                        h = 0,
                        p = !1;
                    function y(e, t) {
                        if (!d)
                            if (((h -= 1), e)) ((f = !0), l(e));
                            else if (!1 === e) ((f = !0), (d = !0));
                            else {
                                if (t === u.default || (f && h <= 0)) return ((f = !0), l(null));
                                p || m();
                            }
                    }
                    function m() {
                        for (p = !0; h < e && !f; ) {
                            var t = c();
                            if (null === t) return ((f = !0), void (h <= 0 && l(null)));
                            ((h += 1), a(t.value, t.key, (0, i.default)(y)));
                        }
                        p = !1;
                    }
                    m();
                }),
                    (e.exports = t.default));
            })(va, va.exports)),
        va.exports
    );
}
function Ua() {
    return (
        Ca ||
            ((Ca = 1),
            (function (e, t) {
                Object.defineProperty(t, '__esModule', { value: !0 });
                var r = o(Ba()),
                    n = o(fa()),
                    i = o(ya());
                function o(e) {
                    return e && e.__esModule ? e : { default: e };
                }
                ((t.default = (0, i.default)(function (e, t, i, o) {
                    return (0, r.default)(t)(e, (0, n.default)(i), o);
                }, 4)),
                    (e.exports = t.default));
            })(ba, ba.exports)),
        ba.exports
    );
}
function za() {
    return (
        Ia ||
            ((Ia = 1),
            (function (e, t) {
                (Object.defineProperty(t, '__esModule', { value: !0 }),
                    (t.default = function (e, t) {
                        return (0, n.default)(o.default, e, t);
                    }));
                var r =
                        (ha ||
                            ((ha = 1),
                            (function (e, t) {
                                Object.defineProperty(t, '__esModule', { value: !0 });
                                var r = o(ta()),
                                    n = o(fa()),
                                    i = o(ya());
                                function o(e) {
                                    return e && e.__esModule ? e : { default: e };
                                }
                                ((t.default = (0, i.default)((e, t, i) => {
                                    var o = (0, r.default)(t) ? [] : {};
                                    e(
                                        t,
                                        (e, t, r) => {
                                            (0, n.default)(e)((e, ...n) => {
                                                (n.length < 2 && ([n] = n), (o[t] = n), r(e));
                                            });
                                        },
                                        (e) => i(e, o)
                                    );
                                }, 3)),
                                    (e.exports = t.default));
                            })(Qo, Qo.exports)),
                        Qo.exports),
                    n = a(r),
                    i =
                        (La ||
                            ((La = 1),
                            (function (e, t) {
                                Object.defineProperty(t, '__esModule', { value: !0 });
                                var r = i(Ua()),
                                    n = i(ya());
                                function i(e) {
                                    return e && e.__esModule ? e : { default: e };
                                }
                                ((t.default = (0, n.default)(function (e, t, n) {
                                    return (0, r.default)(e, 1, t, n);
                                }, 3)),
                                    (e.exports = t.default));
                            })(ga, ga.exports)),
                        ga.exports),
                    o = a(i);
                function a(e) {
                    return e && e.__esModule ? e : { default: e };
                }
                e.exports = t.default;
            })(Xo, Xo.exports)),
        Xo.exports
    );
}
var Ga,
    $a,
    Wa,
    Ha,
    Va,
    qa,
    Ya = { exports: {} };
function Ka() {
    return $a ? Ga : (($a = 1), (Ga = Xi().EventEmitter));
}
function Ja() {
    if (Ha) return Wa;
    function e(e, t) {
        var r = Object.keys(e);
        if (Object.getOwnPropertySymbols) {
            var n = Object.getOwnPropertySymbols(e);
            (t &&
                (n = n.filter(function (t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable;
                })),
                r.push.apply(r, n));
        }
        return r;
    }
    function t(t) {
        for (var n = 1; n < arguments.length; n++) {
            var i = null != arguments[n] ? arguments[n] : {};
            n % 2
                ? e(Object(i), !0).forEach(function (e) {
                      r(t, e, i[e]);
                  })
                : Object.getOwnPropertyDescriptors
                  ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(i))
                  : e(Object(i)).forEach(function (e) {
                        Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(i, e));
                    });
        }
        return t;
    }
    function r(e, t, r) {
        return (
            (t = i(t)) in e
                ? Object.defineProperty(e, t, {
                      value: r,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (e[t] = r),
            e
        );
    }
    function n(e, t, r) {
        return (
            t &&
                (function (e, t) {
                    for (var r = 0; r < t.length; r++) {
                        var n = t[r];
                        ((n.enumerable = n.enumerable || !1),
                            (n.configurable = !0),
                            'value' in n && (n.writable = !0),
                            Object.defineProperty(e, i(n.key), n));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function i(e) {
        var t = (function (e, t) {
            if ('object' != typeof e || null === e) return e;
            var r = e[Symbol.toPrimitive];
            if (void 0 !== r) {
                var n = r.call(e, t);
                if ('object' != typeof n) return n;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(e);
        })(e, 'string');
        return 'symbol' == typeof t ? t : String(t);
    }
    Ha = 1;
    var o = uo().Buffer,
        a = Sr.inspect,
        s = (a && a.custom) || 'inspect';
    function u(e, t, r) {
        o.prototype.copy.call(e, t, r);
    }
    return (Wa = (function () {
        function e() {
            (!(function (e, t) {
                if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
            })(this, e),
                (this.head = null),
                (this.tail = null),
                (this.length = 0));
        }
        return (
            n(e, [
                {
                    key: 'push',
                    value: function (e) {
                        var t = { data: e, next: null };
                        (this.length > 0 ? (this.tail.next = t) : (this.head = t),
                            (this.tail = t),
                            ++this.length);
                    },
                },
                {
                    key: 'unshift',
                    value: function (e) {
                        var t = { data: e, next: this.head };
                        (0 === this.length && (this.tail = t), (this.head = t), ++this.length);
                    },
                },
                {
                    key: 'shift',
                    value: function () {
                        if (0 !== this.length) {
                            var e = this.head.data;
                            return (
                                1 === this.length
                                    ? (this.head = this.tail = null)
                                    : (this.head = this.head.next),
                                --this.length,
                                e
                            );
                        }
                    },
                },
                {
                    key: 'clear',
                    value: function () {
                        ((this.head = this.tail = null), (this.length = 0));
                    },
                },
                {
                    key: 'join',
                    value: function (e) {
                        if (0 === this.length) return '';
                        for (var t = this.head, r = '' + t.data; (t = t.next); ) r += e + t.data;
                        return r;
                    },
                },
                {
                    key: 'concat',
                    value: function (e) {
                        if (0 === this.length) return o.alloc(0);
                        for (var t = o.allocUnsafe(e >>> 0), r = this.head, n = 0; r; )
                            (u(r.data, t, n), (n += r.data.length), (r = r.next));
                        return t;
                    },
                },
                {
                    key: 'consume',
                    value: function (e, t) {
                        var r;
                        return (
                            e < this.head.data.length
                                ? ((r = this.head.data.slice(0, e)),
                                  (this.head.data = this.head.data.slice(e)))
                                : (r =
                                      e === this.head.data.length
                                          ? this.shift()
                                          : t
                                            ? this._getString(e)
                                            : this._getBuffer(e)),
                            r
                        );
                    },
                },
                {
                    key: 'first',
                    value: function () {
                        return this.head.data;
                    },
                },
                {
                    key: '_getString',
                    value: function (e) {
                        var t = this.head,
                            r = 1,
                            n = t.data;
                        for (e -= n.length; (t = t.next); ) {
                            var i = t.data,
                                o = e > i.length ? i.length : e;
                            if (
                                (o === i.length ? (n += i) : (n += i.slice(0, e)), 0 === (e -= o))
                            ) {
                                o === i.length
                                    ? (++r,
                                      t.next
                                          ? (this.head = t.next)
                                          : (this.head = this.tail = null))
                                    : ((this.head = t), (t.data = i.slice(o)));
                                break;
                            }
                            ++r;
                        }
                        return ((this.length -= r), n);
                    },
                },
                {
                    key: '_getBuffer',
                    value: function (e) {
                        var t = o.allocUnsafe(e),
                            r = this.head,
                            n = 1;
                        for (r.data.copy(t), e -= r.data.length; (r = r.next); ) {
                            var i = r.data,
                                a = e > i.length ? i.length : e;
                            if ((i.copy(t, t.length - e, 0, a), 0 === (e -= a))) {
                                a === i.length
                                    ? (++n,
                                      r.next
                                          ? (this.head = r.next)
                                          : (this.head = this.tail = null))
                                    : ((this.head = r), (r.data = i.slice(a)));
                                break;
                            }
                            ++n;
                        }
                        return ((this.length -= n), t);
                    },
                },
                {
                    key: s,
                    value: function (e, r) {
                        return a(this, t(t({}, r), {}, { depth: 0, customInspect: !1 }));
                    },
                },
            ]),
            e
        );
    })());
}
function Za() {
    if (qa) return Va;
    function e(e, n) {
        (r(e, n), t(e));
    }
    function t(e) {
        (e._writableState && !e._writableState.emitClose) ||
            (e._readableState && !e._readableState.emitClose) ||
            e.emit('close');
    }
    function r(e, t) {
        e.emit('error', t);
    }
    return (
        (qa = 1),
        (Va = {
            destroy: function (n, i) {
                var o = this,
                    a = this._readableState && this._readableState.destroyed,
                    s = this._writableState && this._writableState.destroyed;
                return a || s
                    ? (i
                          ? i(n)
                          : n &&
                            (this._writableState
                                ? this._writableState.errorEmitted ||
                                  ((this._writableState.errorEmitted = !0),
                                  process.nextTick(r, this, n))
                                : process.nextTick(r, this, n)),
                      this)
                    : (this._readableState && (this._readableState.destroyed = !0),
                      this._writableState && (this._writableState.destroyed = !0),
                      this._destroy(n || null, function (r) {
                          !i && r
                              ? o._writableState
                                  ? o._writableState.errorEmitted
                                      ? process.nextTick(t, o)
                                      : ((o._writableState.errorEmitted = !0),
                                        process.nextTick(e, o, r))
                                  : process.nextTick(e, o, r)
                              : i
                                ? (process.nextTick(t, o), i(r))
                                : process.nextTick(t, o);
                      }),
                      this);
            },
            undestroy: function () {
                (this._readableState &&
                    ((this._readableState.destroyed = !1),
                    (this._readableState.reading = !1),
                    (this._readableState.ended = !1),
                    (this._readableState.endEmitted = !1)),
                    this._writableState &&
                        ((this._writableState.destroyed = !1),
                        (this._writableState.ended = !1),
                        (this._writableState.ending = !1),
                        (this._writableState.finalCalled = !1),
                        (this._writableState.prefinished = !1),
                        (this._writableState.finished = !1),
                        (this._writableState.errorEmitted = !1)));
            },
            errorOrDestroy: function (e, t) {
                var r = e._readableState,
                    n = e._writableState;
                (r && r.autoDestroy) || (n && n.autoDestroy) ? e.destroy(t) : e.emit('error', t);
            },
        })
    );
}
var Xa,
    Qa,
    es,
    ts,
    rs,
    ns,
    is,
    os,
    as,
    ss,
    us,
    ls,
    cs,
    fs,
    ds,
    hs,
    ps,
    ys,
    ms,
    gs,
    bs,
    vs,
    ws = {};
function _s() {
    if (Xa) return ws;
    Xa = 1;
    var e = {};
    function t(t, r, n) {
        n || (n = Error);
        var i = (function (e) {
            var t, n;
            function i(t, n, i) {
                return (
                    e.call(
                        this,
                        (function (e, t, n) {
                            return 'string' == typeof r ? r : r(e, t, n);
                        })(t, n, i)
                    ) || this
                );
            }
            return (
                (n = e),
                ((t = i).prototype = Object.create(n.prototype)),
                (t.prototype.constructor = t),
                (t.__proto__ = n),
                i
            );
        })(n);
        ((i.prototype.name = n.name), (i.prototype.code = t), (e[t] = i));
    }
    function r(e, t) {
        if (Array.isArray(e)) {
            var r = e.length;
            return (
                (e = e.map(function (e) {
                    return String(e);
                })),
                r > 2
                    ? 'one of '.concat(t, ' ').concat(e.slice(0, r - 1).join(', '), ', or ') +
                      e[r - 1]
                    : 2 === r
                      ? 'one of '.concat(t, ' ').concat(e[0], ' or ').concat(e[1])
                      : 'of '.concat(t, ' ').concat(e[0])
            );
        }
        return 'of '.concat(t, ' ').concat(String(e));
    }
    return (
        t(
            'ERR_INVALID_OPT_VALUE',
            function (e, t) {
                return 'The value "' + t + '" is invalid for option "' + e + '"';
            },
            TypeError
        ),
        t(
            'ERR_INVALID_ARG_TYPE',
            function (e, t, n) {
                var i, o, a;
                if (
                    ('string' == typeof t && ((o = 'not '), t.substr(0, o.length) === o)
                        ? ((i = 'must not be'), (t = t.replace(/^not /, '')))
                        : (i = 'must be'),
                    (function (e, t, r) {
                        return (
                            (void 0 === r || r > e.length) && (r = e.length),
                            e.substring(r - t.length, r) === t
                        );
                    })(e, ' argument'))
                )
                    a = 'The '.concat(e, ' ').concat(i, ' ').concat(r(t, 'type'));
                else {
                    var s = (function (e, t, r) {
                        return (
                            'number' != typeof r && (r = 0),
                            !(r + t.length > e.length) && -1 !== e.indexOf(t, r)
                        );
                    })(e, '.')
                        ? 'property'
                        : 'argument';
                    a = 'The "'.concat(e, '" ').concat(s, ' ').concat(i, ' ').concat(r(t, 'type'));
                }
                return (a += '. Received type '.concat(typeof n));
            },
            TypeError
        ),
        t('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF'),
        t('ERR_METHOD_NOT_IMPLEMENTED', function (e) {
            return 'The ' + e + ' method is not implemented';
        }),
        t('ERR_STREAM_PREMATURE_CLOSE', 'Premature close'),
        t('ERR_STREAM_DESTROYED', function (e) {
            return 'Cannot call ' + e + ' after a stream was destroyed';
        }),
        t('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times'),
        t('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable'),
        t('ERR_STREAM_WRITE_AFTER_END', 'write after end'),
        t('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError),
        t(
            'ERR_UNKNOWN_ENCODING',
            function (e) {
                return 'Unknown encoding: ' + e;
            },
            TypeError
        ),
        t('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event'),
        (ws.codes = e),
        ws
    );
}
function Ss() {
    if (es) return Qa;
    es = 1;
    var e = _s().codes.ERR_INVALID_OPT_VALUE;
    return (Qa = {
        getHighWaterMark: function (t, r, n, i) {
            var o = (function (e, t, r) {
                return null != e.highWaterMark ? e.highWaterMark : t ? e[r] : null;
            })(r, i, n);
            if (null != o) {
                if (!isFinite(o) || Math.floor(o) !== o || o < 0)
                    throw new e(i ? n : 'highWaterMark', o);
                return Math.floor(o);
            }
            return t.objectMode ? 16 : 16384;
        },
    });
}
function Es() {
    if (rs) return ts;
    function e(e) {
        var t = this;
        ((this.next = null),
            (this.entry = null),
            (this.finish = function () {
                !(function (e, t, r) {
                    var n = e.entry;
                    e.entry = null;
                    for (; n; ) {
                        var i = n.callback;
                        (t.pendingcb--, i(r), (n = n.next));
                    }
                    t.corkedRequestsFree.next = e;
                })(t, e);
            }));
    }
    var t;
    ((rs = 1), (ts = S), (S.WritableState = _));
    var r = { deprecate: qi() },
        n = Ka(),
        i = uo().Buffer,
        o =
            (void 0 !== f
                ? f
                : 'undefined' != typeof window
                  ? window
                  : 'undefined' != typeof self
                    ? self
                    : {}
            ).Uint8Array || function () {};
    var a,
        s = Za(),
        u = Ss().getHighWaterMark,
        l = _s().codes,
        c = l.ERR_INVALID_ARG_TYPE,
        d = l.ERR_METHOD_NOT_IMPLEMENTED,
        h = l.ERR_MULTIPLE_CALLBACK,
        p = l.ERR_STREAM_CANNOT_PIPE,
        y = l.ERR_STREAM_DESTROYED,
        m = l.ERR_STREAM_NULL_VALUES,
        g = l.ERR_STREAM_WRITE_AFTER_END,
        b = l.ERR_UNKNOWN_ENCODING,
        v = s.errorOrDestroy;
    function w() {}
    function _(r, n, i) {
        ((t = t || ks()),
            (r = r || {}),
            'boolean' != typeof i && (i = n instanceof t),
            (this.objectMode = !!r.objectMode),
            i && (this.objectMode = this.objectMode || !!r.writableObjectMode),
            (this.highWaterMark = u(this, r, 'writableHighWaterMark', i)),
            (this.finalCalled = !1),
            (this.needDrain = !1),
            (this.ending = !1),
            (this.ended = !1),
            (this.finished = !1),
            (this.destroyed = !1));
        var o = !1 === r.decodeStrings;
        ((this.decodeStrings = !o),
            (this.defaultEncoding = r.defaultEncoding || 'utf8'),
            (this.length = 0),
            (this.writing = !1),
            (this.corked = 0),
            (this.sync = !0),
            (this.bufferProcessing = !1),
            (this.onwrite = function (e) {
                !(function (e, t) {
                    var r = e._writableState,
                        n = r.sync,
                        i = r.writecb;
                    if ('function' != typeof i) throw new h();
                    if (
                        ((function (e) {
                            ((e.writing = !1),
                                (e.writecb = null),
                                (e.length -= e.writelen),
                                (e.writelen = 0));
                        })(r),
                        t)
                    )
                        !(function (e, t, r, n, i) {
                            (--t.pendingcb,
                                r
                                    ? (process.nextTick(i, n),
                                      process.nextTick(A, e, t),
                                      (e._writableState.errorEmitted = !0),
                                      v(e, n))
                                    : (i(n),
                                      (e._writableState.errorEmitted = !0),
                                      v(e, n),
                                      A(e, t)));
                        })(e, r, n, t, i);
                    else {
                        var o = T(r) || e.destroyed;
                        (o || r.corked || r.bufferProcessing || !r.bufferedRequest || O(e, r),
                            n ? process.nextTick(k, e, r, o, i) : k(e, r, o, i));
                    }
                })(n, e);
            }),
            (this.writecb = null),
            (this.writelen = 0),
            (this.bufferedRequest = null),
            (this.lastBufferedRequest = null),
            (this.pendingcb = 0),
            (this.prefinished = !1),
            (this.errorEmitted = !1),
            (this.emitClose = !1 !== r.emitClose),
            (this.autoDestroy = !!r.autoDestroy),
            (this.bufferedRequestCount = 0),
            (this.corkedRequestsFree = new e(this)));
    }
    function S(e) {
        var r = this instanceof (t = t || ks());
        if (!r && !a.call(S, this)) return new S(e);
        ((this._writableState = new _(e, this, r)),
            (this.writable = !0),
            e &&
                ('function' == typeof e.write && (this._write = e.write),
                'function' == typeof e.writev && (this._writev = e.writev),
                'function' == typeof e.destroy && (this._destroy = e.destroy),
                'function' == typeof e.final && (this._final = e.final)),
            n.call(this));
    }
    function E(e, t, r, n, i, o, a) {
        ((t.writelen = n),
            (t.writecb = a),
            (t.writing = !0),
            (t.sync = !0),
            t.destroyed
                ? t.onwrite(new y('write'))
                : r
                  ? e._writev(i, t.onwrite)
                  : e._write(i, o, t.onwrite),
            (t.sync = !1));
    }
    function k(e, t, r, n) {
        (r ||
            (function (e, t) {
                0 === t.length && t.needDrain && ((t.needDrain = !1), e.emit('drain'));
            })(e, t),
            t.pendingcb--,
            n(),
            A(e, t));
    }
    function O(t, r) {
        r.bufferProcessing = !0;
        var n = r.bufferedRequest;
        if (t._writev && n && n.next) {
            var i = r.bufferedRequestCount,
                o = new Array(i),
                a = r.corkedRequestsFree;
            a.entry = n;
            for (var s = 0, u = !0; n; ) ((o[s] = n), n.isBuf || (u = !1), (n = n.next), (s += 1));
            ((o.allBuffers = u),
                E(t, r, !0, r.length, o, '', a.finish),
                r.pendingcb++,
                (r.lastBufferedRequest = null),
                a.next
                    ? ((r.corkedRequestsFree = a.next), (a.next = null))
                    : (r.corkedRequestsFree = new e(r)),
                (r.bufferedRequestCount = 0));
        } else {
            for (; n; ) {
                var l = n.chunk,
                    c = n.encoding,
                    f = n.callback;
                if (
                    (E(t, r, !1, r.objectMode ? 1 : l.length, l, c, f),
                    (n = n.next),
                    r.bufferedRequestCount--,
                    r.writing)
                )
                    break;
            }
            null === n && (r.lastBufferedRequest = null);
        }
        ((r.bufferedRequest = n), (r.bufferProcessing = !1));
    }
    function T(e) {
        return (
            e.ending && 0 === e.length && null === e.bufferedRequest && !e.finished && !e.writing
        );
    }
    function M(e, t) {
        e._final(function (r) {
            (t.pendingcb--, r && v(e, r), (t.prefinished = !0), e.emit('prefinish'), A(e, t));
        });
    }
    function A(e, t) {
        var r = T(t);
        if (
            r &&
            ((function (e, t) {
                t.prefinished ||
                    t.finalCalled ||
                    ('function' != typeof e._final || t.destroyed
                        ? ((t.prefinished = !0), e.emit('prefinish'))
                        : (t.pendingcb++, (t.finalCalled = !0), process.nextTick(M, e, t)));
            })(e, t),
            0 === t.pendingcb && ((t.finished = !0), e.emit('finish'), t.autoDestroy))
        ) {
            var n = e._readableState;
            (!n || (n.autoDestroy && n.endEmitted)) && e.destroy();
        }
        return r;
    }
    return (
        br()(S, n),
        (_.prototype.getBuffer = function () {
            for (var e = this.bufferedRequest, t = []; e; ) (t.push(e), (e = e.next));
            return t;
        }),
        (function () {
            try {
                Object.defineProperty(_.prototype, 'buffer', {
                    get: r.deprecate(
                        function () {
                            return this.getBuffer();
                        },
                        '_writableState.buffer is deprecated. Use _writableState.getBuffer instead.',
                        'DEP0003'
                    ),
                });
            } catch (e) {}
        })(),
        'function' == typeof Symbol &&
        Symbol.hasInstance &&
        'function' == typeof Function.prototype[Symbol.hasInstance]
            ? ((a = Function.prototype[Symbol.hasInstance]),
              Object.defineProperty(S, Symbol.hasInstance, {
                  value: function (e) {
                      return (
                          !!a.call(this, e) || (this === S && e && e._writableState instanceof _)
                      );
                  },
              }))
            : (a = function (e) {
                  return e instanceof this;
              }),
        (S.prototype.pipe = function () {
            v(this, new p());
        }),
        (S.prototype.write = function (e, t, r) {
            var n,
                a = this._writableState,
                s = !1,
                u = !a.objectMode && ((n = e), i.isBuffer(n) || n instanceof o);
            return (
                u &&
                    !i.isBuffer(e) &&
                    (e = (function (e) {
                        return i.from(e);
                    })(e)),
                'function' == typeof t && ((r = t), (t = null)),
                u ? (t = 'buffer') : t || (t = a.defaultEncoding),
                'function' != typeof r && (r = w),
                a.ending
                    ? (function (e, t) {
                          var r = new g();
                          (v(e, r), process.nextTick(t, r));
                      })(this, r)
                    : (u ||
                          (function (e, t, r, n) {
                              var i;
                              return (
                                  null === r
                                      ? (i = new m())
                                      : 'string' == typeof r ||
                                        t.objectMode ||
                                        (i = new c('chunk', ['string', 'Buffer'], r)),
                                  !i || (v(e, i), process.nextTick(n, i), !1)
                              );
                          })(this, a, e, r)) &&
                      (a.pendingcb++,
                      (s = (function (e, t, r, n, o, a) {
                          if (!r) {
                              var s = (function (e, t, r) {
                                  e.objectMode ||
                                      !1 === e.decodeStrings ||
                                      'string' != typeof t ||
                                      (t = i.from(t, r));
                                  return t;
                              })(t, n, o);
                              n !== s && ((r = !0), (o = 'buffer'), (n = s));
                          }
                          var u = t.objectMode ? 1 : n.length;
                          t.length += u;
                          var l = t.length < t.highWaterMark;
                          l || (t.needDrain = !0);
                          if (t.writing || t.corked) {
                              var c = t.lastBufferedRequest;
                              ((t.lastBufferedRequest = {
                                  chunk: n,
                                  encoding: o,
                                  isBuf: r,
                                  callback: a,
                                  next: null,
                              }),
                                  c
                                      ? (c.next = t.lastBufferedRequest)
                                      : (t.bufferedRequest = t.lastBufferedRequest),
                                  (t.bufferedRequestCount += 1));
                          } else E(e, t, !1, u, n, o, a);
                          return l;
                      })(this, a, u, e, t, r))),
                s
            );
        }),
        (S.prototype.cork = function () {
            this._writableState.corked++;
        }),
        (S.prototype.uncork = function () {
            var e = this._writableState;
            e.corked &&
                (e.corked--,
                e.writing || e.corked || e.bufferProcessing || !e.bufferedRequest || O(this, e));
        }),
        (S.prototype.setDefaultEncoding = function (e) {
            if (
                ('string' == typeof e && (e = e.toLowerCase()),
                !(
                    [
                        'hex',
                        'utf8',
                        'utf-8',
                        'ascii',
                        'binary',
                        'base64',
                        'ucs2',
                        'ucs-2',
                        'utf16le',
                        'utf-16le',
                        'raw',
                    ].indexOf((e + '').toLowerCase()) > -1
                ))
            )
                throw new b(e);
            return ((this._writableState.defaultEncoding = e), this);
        }),
        Object.defineProperty(S.prototype, 'writableBuffer', {
            enumerable: !1,
            get: function () {
                return this._writableState && this._writableState.getBuffer();
            },
        }),
        Object.defineProperty(S.prototype, 'writableHighWaterMark', {
            enumerable: !1,
            get: function () {
                return this._writableState.highWaterMark;
            },
        }),
        (S.prototype._write = function (e, t, r) {
            r(new d('_write()'));
        }),
        (S.prototype._writev = null),
        (S.prototype.end = function (e, t, r) {
            var n = this._writableState;
            return (
                'function' == typeof e
                    ? ((r = e), (e = null), (t = null))
                    : 'function' == typeof t && ((r = t), (t = null)),
                null != e && this.write(e, t),
                n.corked && ((n.corked = 1), this.uncork()),
                n.ending ||
                    (function (e, t, r) {
                        ((t.ending = !0),
                            A(e, t),
                            r && (t.finished ? process.nextTick(r) : e.once('finish', r)));
                        ((t.ended = !0), (e.writable = !1));
                    })(this, n, r),
                this
            );
        }),
        Object.defineProperty(S.prototype, 'writableLength', {
            enumerable: !1,
            get: function () {
                return this._writableState.length;
            },
        }),
        Object.defineProperty(S.prototype, 'destroyed', {
            enumerable: !1,
            get: function () {
                return void 0 !== this._writableState && this._writableState.destroyed;
            },
            set: function (e) {
                this._writableState && (this._writableState.destroyed = e);
            },
        }),
        (S.prototype.destroy = s.destroy),
        (S.prototype._undestroy = s.undestroy),
        (S.prototype._destroy = function (e, t) {
            t(e);
        }),
        ts
    );
}
function ks() {
    if (is) return ns;
    is = 1;
    var e =
        Object.keys ||
        function (e) {
            var t = [];
            for (var r in e) t.push(r);
            return t;
        };
    ns = a;
    var t = Ms(),
        r = Es();
    br()(a, t);
    for (var n = e(r.prototype), i = 0; i < n.length; i++) {
        var o = n[i];
        a.prototype[o] || (a.prototype[o] = r.prototype[o]);
    }
    function a(e) {
        if (!(this instanceof a)) return new a(e);
        (t.call(this, e),
            r.call(this, e),
            (this.allowHalfOpen = !0),
            e &&
                (!1 === e.readable && (this.readable = !1),
                !1 === e.writable && (this.writable = !1),
                !1 === e.allowHalfOpen && ((this.allowHalfOpen = !1), this.once('end', s))));
    }
    function s() {
        this._writableState.ended || process.nextTick(u, this);
    }
    function u(e) {
        e.end();
    }
    return (
        Object.defineProperty(a.prototype, 'writableHighWaterMark', {
            enumerable: !1,
            get: function () {
                return this._writableState.highWaterMark;
            },
        }),
        Object.defineProperty(a.prototype, 'writableBuffer', {
            enumerable: !1,
            get: function () {
                return this._writableState && this._writableState.getBuffer();
            },
        }),
        Object.defineProperty(a.prototype, 'writableLength', {
            enumerable: !1,
            get: function () {
                return this._writableState.length;
            },
        }),
        Object.defineProperty(a.prototype, 'destroyed', {
            enumerable: !1,
            get: function () {
                return (
                    void 0 !== this._readableState &&
                    void 0 !== this._writableState &&
                    this._readableState.destroyed &&
                    this._writableState.destroyed
                );
            },
            set: function (e) {
                void 0 !== this._readableState &&
                    void 0 !== this._writableState &&
                    ((this._readableState.destroyed = e), (this._writableState.destroyed = e));
            },
        }),
        ns
    );
}
function Os() {
    if (as) return os;
    as = 1;
    var e = _s().codes.ERR_STREAM_PREMATURE_CLOSE;
    function t() {}
    return (
        (os = function r(n, i, o) {
            if ('function' == typeof i) return r(n, null, i);
            (i || (i = {}),
                (o = (function (e) {
                    var t = !1;
                    return function () {
                        if (!t) {
                            t = !0;
                            for (var r = arguments.length, n = new Array(r), i = 0; i < r; i++)
                                n[i] = arguments[i];
                            e.apply(this, n);
                        }
                    };
                })(o || t)));
            var a = i.readable || (!1 !== i.readable && n.readable),
                s = i.writable || (!1 !== i.writable && n.writable),
                u = function () {
                    n.writable || c();
                },
                l = n._writableState && n._writableState.finished,
                c = function () {
                    ((s = !1), (l = !0), a || o.call(n));
                },
                f = n._readableState && n._readableState.endEmitted,
                d = function () {
                    ((a = !1), (f = !0), s || o.call(n));
                },
                h = function (e) {
                    o.call(n, e);
                },
                p = function () {
                    var t;
                    return a && !f
                        ? ((n._readableState && n._readableState.ended) || (t = new e()),
                          o.call(n, t))
                        : s && !l
                          ? ((n._writableState && n._writableState.ended) || (t = new e()),
                            o.call(n, t))
                          : void 0;
                },
                y = function () {
                    n.req.on('finish', c);
                };
            return (
                !(function (e) {
                    return e.setHeader && 'function' == typeof e.abort;
                })(n)
                    ? s && !n._writableState && (n.on('end', u), n.on('close', u))
                    : (n.on('complete', c), n.on('abort', p), n.req ? y() : n.on('request', y)),
                n.on('end', d),
                n.on('finish', c),
                !1 !== i.error && n.on('error', h),
                n.on('close', p),
                function () {
                    (n.removeListener('complete', c),
                        n.removeListener('abort', p),
                        n.removeListener('request', y),
                        n.req && n.req.removeListener('finish', c),
                        n.removeListener('end', u),
                        n.removeListener('close', u),
                        n.removeListener('finish', c),
                        n.removeListener('end', d),
                        n.removeListener('error', h),
                        n.removeListener('close', p));
                }
            );
        }),
        os
    );
}
function Ts() {
    if (us) return ss;
    var e;
    function t(e, t, r) {
        return (
            (t = (function (e) {
                var t = (function (e, t) {
                    if ('object' != typeof e || null === e) return e;
                    var r = e[Symbol.toPrimitive];
                    if (void 0 !== r) {
                        var n = r.call(e, t);
                        if ('object' != typeof n) return n;
                        throw new TypeError('@@toPrimitive must return a primitive value.');
                    }
                    return ('string' === t ? String : Number)(e);
                })(e, 'string');
                return 'symbol' == typeof t ? t : String(t);
            })(t)) in e
                ? Object.defineProperty(e, t, {
                      value: r,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (e[t] = r),
            e
        );
    }
    us = 1;
    var r = Os(),
        n = Symbol('lastResolve'),
        i = Symbol('lastReject'),
        o = Symbol('error'),
        a = Symbol('ended'),
        s = Symbol('lastPromise'),
        u = Symbol('handlePromise'),
        l = Symbol('stream');
    function c(e, t) {
        return { value: e, done: t };
    }
    function f(e) {
        var t = e[n];
        if (null !== t) {
            var r = e[l].read();
            null !== r && ((e[s] = null), (e[n] = null), (e[i] = null), t(c(r, !1)));
        }
    }
    function d(e) {
        process.nextTick(f, e);
    }
    var h = Object.getPrototypeOf(function () {}),
        p = Object.setPrototypeOf(
            (t(
                (e = {
                    get stream() {
                        return this[l];
                    },
                    next: function () {
                        var e = this,
                            t = this[o];
                        if (null !== t) return Promise.reject(t);
                        if (this[a]) return Promise.resolve(c(void 0, !0));
                        if (this[l].destroyed)
                            return new Promise(function (t, r) {
                                process.nextTick(function () {
                                    e[o] ? r(e[o]) : t(c(void 0, !0));
                                });
                            });
                        var r,
                            n = this[s];
                        if (n)
                            r = new Promise(
                                (function (e, t) {
                                    return function (r, n) {
                                        e.then(function () {
                                            t[a] ? r(c(void 0, !0)) : t[u](r, n);
                                        }, n);
                                    };
                                })(n, this)
                            );
                        else {
                            var i = this[l].read();
                            if (null !== i) return Promise.resolve(c(i, !1));
                            r = new Promise(this[u]);
                        }
                        return ((this[s] = r), r);
                    },
                }),
                Symbol.asyncIterator,
                function () {
                    return this;
                }
            ),
            t(e, 'return', function () {
                var e = this;
                return new Promise(function (t, r) {
                    e[l].destroy(null, function (e) {
                        e ? r(e) : t(c(void 0, !0));
                    });
                });
            }),
            e),
            h
        );
    return (ss = function (e) {
        var f,
            h = Object.create(
                p,
                (t((f = {}), l, { value: e, writable: !0 }),
                t(f, n, { value: null, writable: !0 }),
                t(f, i, { value: null, writable: !0 }),
                t(f, o, { value: null, writable: !0 }),
                t(f, a, { value: e._readableState.endEmitted, writable: !0 }),
                t(f, u, {
                    value: function (e, t) {
                        var r = h[l].read();
                        r
                            ? ((h[s] = null), (h[n] = null), (h[i] = null), e(c(r, !1)))
                            : ((h[n] = e), (h[i] = t));
                    },
                    writable: !0,
                }),
                f)
            );
        return (
            (h[s] = null),
            r(e, function (e) {
                if (e && 'ERR_STREAM_PREMATURE_CLOSE' !== e.code) {
                    var t = h[i];
                    return (
                        null !== t && ((h[s] = null), (h[n] = null), (h[i] = null), t(e)),
                        void (h[o] = e)
                    );
                }
                var r = h[n];
                (null !== r && ((h[s] = null), (h[n] = null), (h[i] = null), r(c(void 0, !0))),
                    (h[a] = !0));
            }),
            e.on('readable', d.bind(null, h)),
            h
        );
    });
}
function Ms() {
    if (ds) return fs;
    var e;
    ((ds = 1), (fs = S), (S.ReadableState = _), Xi().EventEmitter);
    var t = function (e, t) {
            return e.listeners(t).length;
        },
        r = Ka(),
        n = uo().Buffer,
        i =
            (void 0 !== f
                ? f
                : 'undefined' != typeof window
                  ? window
                  : 'undefined' != typeof self
                    ? self
                    : {}
            ).Uint8Array || function () {};
    var o,
        a = Sr;
    o = a && a.debuglog ? a.debuglog('stream') : function () {};
    var s,
        u,
        l,
        c = Ja(),
        d = Za(),
        h = Ss().getHighWaterMark,
        p = _s().codes,
        y = p.ERR_INVALID_ARG_TYPE,
        m = p.ERR_STREAM_PUSH_AFTER_EOF,
        g = p.ERR_METHOD_NOT_IMPLEMENTED,
        b = p.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    br()(S, r);
    var v = d.errorOrDestroy,
        w = ['error', 'close', 'destroy', 'pause', 'resume'];
    function _(t, r, n) {
        ((e = e || ks()),
            (t = t || {}),
            'boolean' != typeof n && (n = r instanceof e),
            (this.objectMode = !!t.objectMode),
            n && (this.objectMode = this.objectMode || !!t.readableObjectMode),
            (this.highWaterMark = h(this, t, 'readableHighWaterMark', n)),
            (this.buffer = new c()),
            (this.length = 0),
            (this.pipes = null),
            (this.pipesCount = 0),
            (this.flowing = null),
            (this.ended = !1),
            (this.endEmitted = !1),
            (this.reading = !1),
            (this.sync = !0),
            (this.needReadable = !1),
            (this.emittedReadable = !1),
            (this.readableListening = !1),
            (this.resumeScheduled = !1),
            (this.paused = !0),
            (this.emitClose = !1 !== t.emitClose),
            (this.autoDestroy = !!t.autoDestroy),
            (this.destroyed = !1),
            (this.defaultEncoding = t.defaultEncoding || 'utf8'),
            (this.awaitDrain = 0),
            (this.readingMore = !1),
            (this.decoder = null),
            (this.encoding = null),
            t.encoding &&
                (s || (s = No().StringDecoder),
                (this.decoder = new s(t.encoding)),
                (this.encoding = t.encoding)));
    }
    function S(t) {
        if (((e = e || ks()), !(this instanceof S))) return new S(t);
        var n = this instanceof e;
        ((this._readableState = new _(t, this, n)),
            (this.readable = !0),
            t &&
                ('function' == typeof t.read && (this._read = t.read),
                'function' == typeof t.destroy && (this._destroy = t.destroy)),
            r.call(this));
    }
    function E(e, t, r, a, s) {
        o('readableAddChunk', t);
        var u,
            l = e._readableState;
        if (null === t)
            ((l.reading = !1),
                (function (e, t) {
                    if ((o('onEofChunk'), t.ended)) return;
                    if (t.decoder) {
                        var r = t.decoder.end();
                        r &&
                            r.length &&
                            (t.buffer.push(r), (t.length += t.objectMode ? 1 : r.length));
                    }
                    ((t.ended = !0),
                        t.sync
                            ? M(e)
                            : ((t.needReadable = !1),
                              t.emittedReadable || ((t.emittedReadable = !0), A(e))));
                })(e, l));
        else if (
            (s ||
                (u = (function (e, t) {
                    var r;
                    ((o = t),
                        n.isBuffer(o) ||
                            o instanceof i ||
                            'string' == typeof t ||
                            void 0 === t ||
                            e.objectMode ||
                            (r = new y('chunk', ['string', 'Buffer', 'Uint8Array'], t)));
                    var o;
                    return r;
                })(l, t)),
            u)
        )
            v(e, u);
        else if (l.objectMode || (t && t.length > 0))
            if (
                ('string' == typeof t ||
                    l.objectMode ||
                    Object.getPrototypeOf(t) === n.prototype ||
                    (t = (function (e) {
                        return n.from(e);
                    })(t)),
                a)
            )
                l.endEmitted ? v(e, new b()) : k(e, l, t, !0);
            else if (l.ended) v(e, new m());
            else {
                if (l.destroyed) return !1;
                ((l.reading = !1),
                    l.decoder && !r
                        ? ((t = l.decoder.write(t)),
                          l.objectMode || 0 !== t.length ? k(e, l, t, !1) : x(e, l))
                        : k(e, l, t, !1));
            }
        else a || ((l.reading = !1), x(e, l));
        return !l.ended && (l.length < l.highWaterMark || 0 === l.length);
    }
    function k(e, t, r, n) {
        (t.flowing && 0 === t.length && !t.sync
            ? ((t.awaitDrain = 0), e.emit('data', r))
            : ((t.length += t.objectMode ? 1 : r.length),
              n ? t.buffer.unshift(r) : t.buffer.push(r),
              t.needReadable && M(e)),
            x(e, t));
    }
    (Object.defineProperty(S.prototype, 'destroyed', {
        enumerable: !1,
        get: function () {
            return void 0 !== this._readableState && this._readableState.destroyed;
        },
        set: function (e) {
            this._readableState && (this._readableState.destroyed = e);
        },
    }),
        (S.prototype.destroy = d.destroy),
        (S.prototype._undestroy = d.undestroy),
        (S.prototype._destroy = function (e, t) {
            t(e);
        }),
        (S.prototype.push = function (e, t) {
            var r,
                i = this._readableState;
            return (
                i.objectMode
                    ? (r = !0)
                    : 'string' == typeof e &&
                      ((t = t || i.defaultEncoding) !== i.encoding &&
                          ((e = n.from(e, t)), (t = '')),
                      (r = !0)),
                E(this, e, t, !1, r)
            );
        }),
        (S.prototype.unshift = function (e) {
            return E(this, e, null, !0, !1);
        }),
        (S.prototype.isPaused = function () {
            return !1 === this._readableState.flowing;
        }),
        (S.prototype.setEncoding = function (e) {
            s || (s = No().StringDecoder);
            var t = new s(e);
            ((this._readableState.decoder = t),
                (this._readableState.encoding = this._readableState.decoder.encoding));
            for (var r = this._readableState.buffer.head, n = ''; null !== r; )
                ((n += t.write(r.data)), (r = r.next));
            return (
                this._readableState.buffer.clear(),
                '' !== n && this._readableState.buffer.push(n),
                (this._readableState.length = n.length),
                this
            );
        }));
    var O = 1073741824;
    function T(e, t) {
        return e <= 0 || (0 === t.length && t.ended)
            ? 0
            : t.objectMode
              ? 1
              : e != e
                ? t.flowing && t.length
                    ? t.buffer.head.data.length
                    : t.length
                : (e > t.highWaterMark &&
                      (t.highWaterMark = (function (e) {
                          return (
                              e >= O
                                  ? (e = O)
                                  : (e--,
                                    (e |= e >>> 1),
                                    (e |= e >>> 2),
                                    (e |= e >>> 4),
                                    (e |= e >>> 8),
                                    (e |= e >>> 16),
                                    e++),
                              e
                          );
                      })(e)),
                  e <= t.length ? e : t.ended ? t.length : ((t.needReadable = !0), 0));
    }
    function M(e) {
        var t = e._readableState;
        (o('emitReadable', t.needReadable, t.emittedReadable),
            (t.needReadable = !1),
            t.emittedReadable ||
                (o('emitReadable', t.flowing), (t.emittedReadable = !0), process.nextTick(A, e)));
    }
    function A(e) {
        var t = e._readableState;
        (o('emitReadable_', t.destroyed, t.length, t.ended),
            t.destroyed ||
                (!t.length && !t.ended) ||
                (e.emit('readable'), (t.emittedReadable = !1)),
            (t.needReadable = !t.flowing && !t.ended && t.length <= t.highWaterMark),
            L(e));
    }
    function x(e, t) {
        t.readingMore || ((t.readingMore = !0), process.nextTick(P, e, t));
    }
    function P(e, t) {
        for (
            ;
            !t.reading && !t.ended && (t.length < t.highWaterMark || (t.flowing && 0 === t.length));
        ) {
            var r = t.length;
            if ((o('maybeReadMore read 0'), e.read(0), r === t.length)) break;
        }
        t.readingMore = !1;
    }
    function R(e) {
        var t = e._readableState;
        ((t.readableListening = e.listenerCount('readable') > 0),
            t.resumeScheduled && !t.paused
                ? (t.flowing = !0)
                : e.listenerCount('data') > 0 && e.resume());
    }
    function j(e) {
        (o('readable nexttick read 0'), e.read(0));
    }
    function C(e, t) {
        (o('resume', t.reading),
            t.reading || e.read(0),
            (t.resumeScheduled = !1),
            e.emit('resume'),
            L(e),
            t.flowing && !t.reading && e.read(0));
    }
    function L(e) {
        var t = e._readableState;
        for (o('flow', t.flowing); t.flowing && null !== e.read(); );
    }
    function I(e, t) {
        return 0 === t.length
            ? null
            : (t.objectMode
                  ? (r = t.buffer.shift())
                  : !e || e >= t.length
                    ? ((r = t.decoder
                          ? t.buffer.join('')
                          : 1 === t.buffer.length
                            ? t.buffer.first()
                            : t.buffer.concat(t.length)),
                      t.buffer.clear())
                    : (r = t.buffer.consume(e, t.decoder)),
              r);
        var r;
    }
    function D(e) {
        var t = e._readableState;
        (o('endReadable', t.endEmitted),
            t.endEmitted || ((t.ended = !0), process.nextTick(N, t, e)));
    }
    function N(e, t) {
        if (
            (o('endReadableNT', e.endEmitted, e.length),
            !e.endEmitted &&
                0 === e.length &&
                ((e.endEmitted = !0), (t.readable = !1), t.emit('end'), e.autoDestroy))
        ) {
            var r = t._writableState;
            (!r || (r.autoDestroy && r.finished)) && t.destroy();
        }
    }
    function F(e, t) {
        for (var r = 0, n = e.length; r < n; r++) if (e[r] === t) return r;
        return -1;
    }
    return (
        (S.prototype.read = function (e) {
            (o('read', e), (e = parseInt(e, 10)));
            var t = this._readableState,
                r = e;
            if (
                (0 !== e && (t.emittedReadable = !1),
                0 === e &&
                    t.needReadable &&
                    ((0 !== t.highWaterMark ? t.length >= t.highWaterMark : t.length > 0) ||
                        t.ended))
            )
                return (
                    o('read: emitReadable', t.length, t.ended),
                    0 === t.length && t.ended ? D(this) : M(this),
                    null
                );
            if (0 === (e = T(e, t)) && t.ended) return (0 === t.length && D(this), null);
            var n,
                i = t.needReadable;
            return (
                o('need readable', i),
                (0 === t.length || t.length - e < t.highWaterMark) &&
                    o('length less than watermark', (i = !0)),
                t.ended || t.reading
                    ? o('reading or ended', (i = !1))
                    : i &&
                      (o('do read'),
                      (t.reading = !0),
                      (t.sync = !0),
                      0 === t.length && (t.needReadable = !0),
                      this._read(t.highWaterMark),
                      (t.sync = !1),
                      t.reading || (e = T(r, t))),
                null === (n = e > 0 ? I(e, t) : null)
                    ? ((t.needReadable = t.length <= t.highWaterMark), (e = 0))
                    : ((t.length -= e), (t.awaitDrain = 0)),
                0 === t.length && (t.ended || (t.needReadable = !0), r !== e && t.ended && D(this)),
                null !== n && this.emit('data', n),
                n
            );
        }),
        (S.prototype._read = function (e) {
            v(this, new g('_read()'));
        }),
        (S.prototype.pipe = function (e, r) {
            var n = this,
                i = this._readableState;
            switch (i.pipesCount) {
                case 0:
                    i.pipes = e;
                    break;
                case 1:
                    i.pipes = [i.pipes, e];
                    break;
                default:
                    i.pipes.push(e);
            }
            ((i.pipesCount += 1), o('pipe count=%d opts=%j', i.pipesCount, r));
            var a = (!r || !1 !== r.end) && e !== process.stdout && e !== process.stderr ? u : y;
            function s(t, r) {
                (o('onunpipe'),
                    t === n &&
                        r &&
                        !1 === r.hasUnpiped &&
                        ((r.hasUnpiped = !0),
                        o('cleanup'),
                        e.removeListener('close', h),
                        e.removeListener('finish', p),
                        e.removeListener('drain', l),
                        e.removeListener('error', d),
                        e.removeListener('unpipe', s),
                        n.removeListener('end', u),
                        n.removeListener('end', y),
                        n.removeListener('data', f),
                        (c = !0),
                        !i.awaitDrain || (e._writableState && !e._writableState.needDrain) || l()));
            }
            function u() {
                (o('onend'), e.end());
            }
            (i.endEmitted ? process.nextTick(a) : n.once('end', a), e.on('unpipe', s));
            var l = (function (e) {
                return function () {
                    var r = e._readableState;
                    (o('pipeOnDrain', r.awaitDrain),
                        r.awaitDrain && r.awaitDrain--,
                        0 === r.awaitDrain && t(e, 'data') && ((r.flowing = !0), L(e)));
                };
            })(n);
            e.on('drain', l);
            var c = !1;
            function f(t) {
                o('ondata');
                var r = e.write(t);
                (o('dest.write', r),
                    !1 === r &&
                        (((1 === i.pipesCount && i.pipes === e) ||
                            (i.pipesCount > 1 && -1 !== F(i.pipes, e))) &&
                            !c &&
                            (o('false write response, pause', i.awaitDrain), i.awaitDrain++),
                        n.pause()));
            }
            function d(r) {
                (o('onerror', r),
                    y(),
                    e.removeListener('error', d),
                    0 === t(e, 'error') && v(e, r));
            }
            function h() {
                (e.removeListener('finish', p), y());
            }
            function p() {
                (o('onfinish'), e.removeListener('close', h), y());
            }
            function y() {
                (o('unpipe'), n.unpipe(e));
            }
            return (
                n.on('data', f),
                (function (e, t, r) {
                    if ('function' == typeof e.prependListener) return e.prependListener(t, r);
                    e._events && e._events[t]
                        ? Array.isArray(e._events[t])
                            ? e._events[t].unshift(r)
                            : (e._events[t] = [r, e._events[t]])
                        : e.on(t, r);
                })(e, 'error', d),
                e.once('close', h),
                e.once('finish', p),
                e.emit('pipe', n),
                i.flowing || (o('pipe resume'), n.resume()),
                e
            );
        }),
        (S.prototype.unpipe = function (e) {
            var t = this._readableState,
                r = { hasUnpiped: !1 };
            if (0 === t.pipesCount) return this;
            if (1 === t.pipesCount)
                return (
                    (e && e !== t.pipes) ||
                        (e || (e = t.pipes),
                        (t.pipes = null),
                        (t.pipesCount = 0),
                        (t.flowing = !1),
                        e && e.emit('unpipe', this, r)),
                    this
                );
            if (!e) {
                var n = t.pipes,
                    i = t.pipesCount;
                ((t.pipes = null), (t.pipesCount = 0), (t.flowing = !1));
                for (var o = 0; o < i; o++) n[o].emit('unpipe', this, { hasUnpiped: !1 });
                return this;
            }
            var a = F(t.pipes, e);
            return (
                -1 === a ||
                    (t.pipes.splice(a, 1),
                    (t.pipesCount -= 1),
                    1 === t.pipesCount && (t.pipes = t.pipes[0]),
                    e.emit('unpipe', this, r)),
                this
            );
        }),
        (S.prototype.on = function (e, t) {
            var n = r.prototype.on.call(this, e, t),
                i = this._readableState;
            return (
                'data' === e
                    ? ((i.readableListening = this.listenerCount('readable') > 0),
                      !1 !== i.flowing && this.resume())
                    : 'readable' === e &&
                      (i.endEmitted ||
                          i.readableListening ||
                          ((i.readableListening = i.needReadable = !0),
                          (i.flowing = !1),
                          (i.emittedReadable = !1),
                          o('on readable', i.length, i.reading),
                          i.length ? M(this) : i.reading || process.nextTick(j, this))),
                n
            );
        }),
        (S.prototype.addListener = S.prototype.on),
        (S.prototype.removeListener = function (e, t) {
            var n = r.prototype.removeListener.call(this, e, t);
            return ('readable' === e && process.nextTick(R, this), n);
        }),
        (S.prototype.removeAllListeners = function (e) {
            var t = r.prototype.removeAllListeners.apply(this, arguments);
            return (('readable' !== e && void 0 !== e) || process.nextTick(R, this), t);
        }),
        (S.prototype.resume = function () {
            var e = this._readableState;
            return (
                e.flowing ||
                    (o('resume'),
                    (e.flowing = !e.readableListening),
                    (function (e, t) {
                        t.resumeScheduled || ((t.resumeScheduled = !0), process.nextTick(C, e, t));
                    })(this, e)),
                (e.paused = !1),
                this
            );
        }),
        (S.prototype.pause = function () {
            return (
                o('call pause flowing=%j', this._readableState.flowing),
                !1 !== this._readableState.flowing &&
                    (o('pause'), (this._readableState.flowing = !1), this.emit('pause')),
                (this._readableState.paused = !0),
                this
            );
        }),
        (S.prototype.wrap = function (e) {
            var t = this,
                r = this._readableState,
                n = !1;
            for (var i in (e.on('end', function () {
                if ((o('wrapped end'), r.decoder && !r.ended)) {
                    var e = r.decoder.end();
                    e && e.length && t.push(e);
                }
                t.push(null);
            }),
            e.on('data', function (i) {
                (o('wrapped data'),
                r.decoder && (i = r.decoder.write(i)),
                r.objectMode && null == i) ||
                    ((r.objectMode || (i && i.length)) && (t.push(i) || ((n = !0), e.pause())));
            }),
            e))
                void 0 === this[i] &&
                    'function' == typeof e[i] &&
                    (this[i] = (function (t) {
                        return function () {
                            return e[t].apply(e, arguments);
                        };
                    })(i));
            for (var a = 0; a < w.length; a++) e.on(w[a], this.emit.bind(this, w[a]));
            return (
                (this._read = function (t) {
                    (o('wrapped _read', t), n && ((n = !1), e.resume()));
                }),
                this
            );
        }),
        'function' == typeof Symbol &&
            (S.prototype[Symbol.asyncIterator] = function () {
                return (void 0 === u && (u = Ts()), u(this));
            }),
        Object.defineProperty(S.prototype, 'readableHighWaterMark', {
            enumerable: !1,
            get: function () {
                return this._readableState.highWaterMark;
            },
        }),
        Object.defineProperty(S.prototype, 'readableBuffer', {
            enumerable: !1,
            get: function () {
                return this._readableState && this._readableState.buffer;
            },
        }),
        Object.defineProperty(S.prototype, 'readableFlowing', {
            enumerable: !1,
            get: function () {
                return this._readableState.flowing;
            },
            set: function (e) {
                this._readableState && (this._readableState.flowing = e);
            },
        }),
        (S._fromList = I),
        Object.defineProperty(S.prototype, 'readableLength', {
            enumerable: !1,
            get: function () {
                return this._readableState.length;
            },
        }),
        'function' == typeof Symbol &&
            (S.from = function (e, t) {
                return (
                    void 0 === l &&
                        (l = cs
                            ? ls
                            : ((cs = 1),
                              (ls = function () {
                                  throw new Error('Readable.from is not available in the browser');
                              }))),
                    l(S, e, t)
                );
            }),
        fs
    );
}
function As() {
    if (ps) return hs;
    ((ps = 1), (hs = s));
    var e = _s().codes,
        t = e.ERR_METHOD_NOT_IMPLEMENTED,
        r = e.ERR_MULTIPLE_CALLBACK,
        n = e.ERR_TRANSFORM_ALREADY_TRANSFORMING,
        i = e.ERR_TRANSFORM_WITH_LENGTH_0,
        o = ks();
    function a(e, t) {
        var n = this._transformState;
        n.transforming = !1;
        var i = n.writecb;
        if (null === i) return this.emit('error', new r());
        ((n.writechunk = null), (n.writecb = null), null != t && this.push(t), i(e));
        var o = this._readableState;
        ((o.reading = !1),
            (o.needReadable || o.length < o.highWaterMark) && this._read(o.highWaterMark));
    }
    function s(e) {
        if (!(this instanceof s)) return new s(e);
        (o.call(this, e),
            (this._transformState = {
                afterTransform: a.bind(this),
                needTransform: !1,
                transforming: !1,
                writecb: null,
                writechunk: null,
                writeencoding: null,
            }),
            (this._readableState.needReadable = !0),
            (this._readableState.sync = !1),
            e &&
                ('function' == typeof e.transform && (this._transform = e.transform),
                'function' == typeof e.flush && (this._flush = e.flush)),
            this.on('prefinish', u));
    }
    function u() {
        var e = this;
        'function' != typeof this._flush || this._readableState.destroyed
            ? l(this, null, null)
            : this._flush(function (t, r) {
                  l(e, t, r);
              });
    }
    function l(e, t, r) {
        if (t) return e.emit('error', t);
        if ((null != r && e.push(r), e._writableState.length)) throw new i();
        if (e._transformState.transforming) throw new n();
        return e.push(null);
    }
    return (
        br()(s, o),
        (s.prototype.push = function (e, t) {
            return ((this._transformState.needTransform = !1), o.prototype.push.call(this, e, t));
        }),
        (s.prototype._transform = function (e, r, n) {
            n(new t('_transform()'));
        }),
        (s.prototype._write = function (e, t, r) {
            var n = this._transformState;
            if (((n.writecb = r), (n.writechunk = e), (n.writeencoding = t), !n.transforming)) {
                var i = this._readableState;
                (n.needTransform || i.needReadable || i.length < i.highWaterMark) &&
                    this._read(i.highWaterMark);
            }
        }),
        (s.prototype._read = function (e) {
            var t = this._transformState;
            null === t.writechunk || t.transforming
                ? (t.needTransform = !0)
                : ((t.transforming = !0),
                  this._transform(t.writechunk, t.writeencoding, t.afterTransform));
        }),
        (s.prototype._destroy = function (e, t) {
            o.prototype._destroy.call(this, e, function (e) {
                t(e);
            });
        }),
        hs
    );
}
function xs() {
    if (bs) return gs;
    var e;
    bs = 1;
    var t = _s().codes,
        r = t.ERR_MISSING_ARGS,
        n = t.ERR_STREAM_DESTROYED;
    function i(e) {
        if (e) throw e;
    }
    function o(e) {
        e();
    }
    function a(e, t) {
        return e.pipe(t);
    }
    return (
        (gs = function () {
            for (var t = arguments.length, s = new Array(t), u = 0; u < t; u++) s[u] = arguments[u];
            var l,
                c = (function (e) {
                    return e.length ? ('function' != typeof e[e.length - 1] ? i : e.pop()) : i;
                })(s);
            if ((Array.isArray(s[0]) && (s = s[0]), s.length < 2)) throw new r('streams');
            var f = s.map(function (t, r) {
                var i = r < s.length - 1;
                return (function (t, r, i, o) {
                    o = (function (e) {
                        var t = !1;
                        return function () {
                            t || ((t = !0), e.apply(void 0, arguments));
                        };
                    })(o);
                    var a = !1;
                    (t.on('close', function () {
                        a = !0;
                    }),
                        void 0 === e && (e = Os()),
                        e(t, { readable: r, writable: i }, function (e) {
                            if (e) return o(e);
                            ((a = !0), o());
                        }));
                    var s = !1;
                    return function (e) {
                        if (!a && !s)
                            return (
                                (s = !0),
                                (function (e) {
                                    return e.setHeader && 'function' == typeof e.abort;
                                })(t)
                                    ? t.abort()
                                    : 'function' == typeof t.destroy
                                      ? t.destroy()
                                      : void o(e || new n('pipe'))
                            );
                    };
                })(t, i, r > 0, function (e) {
                    (l || (l = e), e && f.forEach(o), i || (f.forEach(o), c(l)));
                });
            });
            return s.reduce(a);
        }),
        gs
    );
}
function Ps() {
    return (
        vs ||
            ((vs = 1),
            (e = Ya.exports),
            ((e = Ya.exports = Ms()).Stream = e),
            (e.Readable = e),
            (e.Writable = Es()),
            (e.Duplex = ks()),
            (e.Transform = As()),
            (e.PassThrough = (function () {
                if (ms) return ys;
                ((ms = 1), (ys = t));
                var e = As();
                function t(r) {
                    if (!(this instanceof t)) return new t(r);
                    e.call(this, r);
                }
                return (
                    br()(t, e),
                    (t.prototype._transform = function (e, t, r) {
                        r(null, e);
                    }),
                    ys
                );
            })()),
            (e.finished = Os()),
            (e.pipeline = xs())),
        Ya.exports
    );
    var e;
}
var Rs,
    js,
    Cs,
    Ls,
    Is,
    Ds,
    Ns,
    Fs,
    Bs,
    Us,
    zs,
    Gs,
    $s,
    Ws,
    Hs,
    Vs,
    qs = { exports: {} };
function Ys() {
    if (Ls) return Cs;
    Ls = 1;
    var e = (function () {
            if (js) return Rs;
            js = 1;
            var e = [],
                t = [],
                r = function () {};
            function n(t) {
                return !~e.indexOf(t) && (e.push(t), !0);
            }
            function i(e) {
                r = e;
            }
            function o(t) {
                for (var r = [], n = 0; n < e.length; n++)
                    if (e[n].async) r.push(e[n]);
                    else if (e[n](t)) return !0;
                return (
                    !!r.length &&
                    new Promise(function (e) {
                        Promise.all(
                            r.map(function (e) {
                                return e(t);
                            })
                        ).then(function (t) {
                            e(t.some(Boolean));
                        });
                    })
                );
            }
            function a(e) {
                return !~t.indexOf(e) && (t.push(e), !0);
            }
            function s() {
                r.apply(r, arguments);
            }
            function u(e) {
                for (var r = 0; r < t.length; r++) e = t[r].apply(t[r], arguments);
                return e;
            }
            function l(e, t) {
                var r = Object.prototype.hasOwnProperty;
                for (var n in t) r.call(t, n) && (e[n] = t[n]);
                return e;
            }
            function c(e) {
                return (
                    (e.enabled = !1),
                    (e.modify = a),
                    (e.set = i),
                    (e.use = n),
                    l(function () {
                        return !1;
                    }, e)
                );
            }
            function f(e) {
                return (
                    (e.enabled = !0),
                    (e.modify = a),
                    (e.set = i),
                    (e.use = n),
                    l(function () {
                        var t = Array.prototype.slice.call(arguments, 0);
                        return (s.call(s, e, u(t, e)), !0);
                    }, e)
                );
            }
            return (Rs = function (e) {
                return (
                    (e.introduce = l),
                    (e.enabled = o),
                    (e.process = u),
                    (e.modify = a),
                    (e.write = s),
                    (e.nope = c),
                    (e.yep = f),
                    (e.set = i),
                    (e.use = n),
                    e
                );
            });
        })(),
        t = e(function e(t, r) {
            return (
                ((r = r || {}).namespace = t),
                (r.prod = !0),
                (r.dev = !1),
                r.force || e.force ? e.yep(r) : e.nope(r)
            );
        });
    return (Cs = t);
}
function Ks() {
    return (Is || ((Is = 1), (qs.exports = Ys())), qs.exports);
}
function Js() {
    if (Bs) return Fs;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    function n(t, r, n) {
        return (
            (r = o(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, i() ? Reflect.construct(r, n || [], o(t).constructor) : r.apply(t, n))
        );
    }
    function i() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (i = function () {
            return !!e;
        })();
    }
    function o(e) {
        return (o = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function a(e, t) {
        return (a = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    Bs = 1;
    var s = Sr,
        u = Sr,
        l = za(),
        c = Sr,
        f = sn().MESSAGE,
        d = Ps(),
        h = d.Stream,
        p = d.PassThrough,
        y = Ko(),
        m = Ks()('winston:file'),
        g = Sr,
        b = (function () {
            if (Ns) return Ds;
            Ns = 1;
            var e = Sr,
                t = No().StringDecoder,
                r = Ps().Stream;
            function n() {}
            return (Ds = function (i, o) {
                var a = Buffer.alloc(65536),
                    s = new t('utf8'),
                    u = new r(),
                    l = '',
                    c = 0,
                    f = 0;
                return (
                    -1 === i.start && delete i.start,
                    (u.readable = !0),
                    (u.destroy = function () {
                        ((u.destroyed = !0), u.emit('end'), u.emit('close'));
                    }),
                    e.open(i.file, 'a+', '0644', function (t, r) {
                        if (t) return (o ? o(t) : u.emit('error', t), void u.destroy());
                        !(function t() {
                            if (!u.destroyed)
                                return e.read(r, a, 0, a.length, c, function (e, r) {
                                    if (e) return (o ? o(e) : u.emit('error', e), void u.destroy());
                                    if (!r)
                                        return (
                                            l &&
                                                ((null == i.start || f > i.start) &&
                                                    (o ? o(null, l) : u.emit('line', l)),
                                                f++,
                                                (l = '')),
                                            setTimeout(t, 1e3)
                                        );
                                    var n = s.write(a.slice(0, r));
                                    o || u.emit('data', n);
                                    for (
                                        var d = (n = (l + n).split(/\n+/)).length - 1, h = 0;
                                        h < d;
                                        h++
                                    )
                                        ((null == i.start || f > i.start) &&
                                            (o ? o(null, n[h]) : u.emit('line', n[h])),
                                            f++);
                                    return ((l = n[d]), (c += r), t());
                                });
                            e.close(r, n);
                        })();
                    }),
                    o ? u.destroy : u
                );
            });
        })();
    return (
        (Fs = (function (r) {
            function i() {
                var e,
                    t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                function r(e) {
                    for (
                        var r = arguments.length, n = new Array(r > 1 ? r - 1 : 0), i = 1;
                        i < r;
                        i++
                    )
                        n[i - 1] = arguments[i];
                    n.slice(1).forEach(function (r) {
                        if (t[r])
                            throw new Error(
                                'Cannot set '.concat(r, ' and ').concat(e, ' together')
                            );
                    });
                }
                if (
                    ((function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, i),
                    ((e = n(this, i, [t])).name = t.name || 'file'),
                    (e._stream = new p()),
                    e._stream.setMaxListeners(30),
                    (e._onError = e._onError.bind(e)),
                    t.filename || t.dirname)
                )
                    (r('filename or dirname', 'stream'),
                        (e._basename = e.filename =
                            t.filename ? u.basename(t.filename) : 'winston.log'),
                        (e.dirname = t.dirname || u.dirname(t.filename)),
                        (e.options = t.options || { flags: 'a' }));
                else {
                    if (!t.stream)
                        throw new Error('Cannot log to file without filename or stream.');
                    (r('stream', 'filename', 'maxsize'),
                        (e._dest = e._stream.pipe(e._setupStream(t.stream))),
                        (e.dirname = u.dirname(e._dest.path)));
                }
                return (
                    (e.maxsize = t.maxsize || null),
                    (e.rotationFormat = t.rotationFormat || !1),
                    (e.zippedArchive = t.zippedArchive || !1),
                    (e.maxFiles = t.maxFiles || null),
                    (e.eol = 'string' == typeof t.eol ? t.eol : g.EOL),
                    (e.tailable = t.tailable || !1),
                    (e.lazy = t.lazy || !1),
                    (e._size = 0),
                    (e._pendingSize = 0),
                    (e._created = 0),
                    (e._drain = !1),
                    (e._opening = !1),
                    (e._ending = !1),
                    (e._fileExist = !1),
                    e.dirname && e._createLogDirIfNotExist(e.dirname),
                    e.lazy || e.open(),
                    e
                );
            }
            return (
                (function (e, t) {
                    if ('function' != typeof t && null !== t)
                        throw new TypeError('Super expression must either be null or a function');
                    ((e.prototype = Object.create(t && t.prototype, {
                        constructor: { value: e, writable: !0, configurable: !0 },
                    })),
                        Object.defineProperty(e, 'prototype', { writable: !1 }),
                        t && a(e, t));
                })(i, r),
                t(i, [
                    {
                        key: 'finishIfEnding',
                        value: function () {
                            var e = this;
                            this._ending &&
                                (this._opening
                                    ? this.once('open', function () {
                                          (e._stream.once('finish', function () {
                                              return e.emit('finish');
                                          }),
                                              setImmediate(function () {
                                                  return e._stream.end();
                                              }));
                                      })
                                    : (this._stream.once('finish', function () {
                                          return e.emit('finish');
                                      }),
                                      setImmediate(function () {
                                          return e._stream.end();
                                      })));
                        },
                    },
                    {
                        key: 'log',
                        value: function (e) {
                            var t = this,
                                r =
                                    arguments.length > 1 && void 0 !== arguments[1]
                                        ? arguments[1]
                                        : function () {};
                            if (this.silent) return (r(), !0);
                            if (this._drain)
                                this._stream.once('drain', function () {
                                    ((t._drain = !1), t.log(e, r));
                                });
                            else {
                                if (!this._rotate) {
                                    if (this.lazy) {
                                        if (!this._fileExist)
                                            return (
                                                this._opening || this.open(),
                                                void this.once('open', function () {
                                                    ((t._fileExist = !0), t.log(e, r));
                                                })
                                            );
                                        if (this._needsNewFile(this._pendingSize))
                                            return void this._dest.once('close', function () {
                                                (t._opening || t.open(),
                                                    t.once('open', function () {
                                                        t.log(e, r);
                                                    }));
                                            });
                                    }
                                    var n = ''.concat(e[f]).concat(this.eol),
                                        i = Buffer.byteLength(n);
                                    ((this._pendingSize += i),
                                        this._opening &&
                                            !this.rotatedWhileOpening &&
                                            this._needsNewFile(this._size + this._pendingSize) &&
                                            (this.rotatedWhileOpening = !0));
                                    var o = this._stream.write(
                                        n,
                                        function () {
                                            var t = this;
                                            ((this._size += i),
                                                (this._pendingSize -= i),
                                                m('logged %s %s', this._size, n),
                                                this.emit('logged', e),
                                                this._rotate ||
                                                    this._opening ||
                                                    (this._needsNewFile() &&
                                                        (this.lazy
                                                            ? this._endStream(function () {
                                                                  t.emit('fileclosed');
                                                              })
                                                            : ((this._rotate = !0),
                                                              this._endStream(function () {
                                                                  return t._rotateFile();
                                                              })))));
                                        }.bind(this)
                                    );
                                    return (
                                        o
                                            ? r()
                                            : ((this._drain = !0),
                                              this._stream.once('drain', function () {
                                                  ((t._drain = !1), r());
                                              })),
                                        m('written', o, this._drain),
                                        this.finishIfEnding(),
                                        o
                                    );
                                }
                                this._stream.once('rotate', function () {
                                    ((t._rotate = !1), t.log(e, r));
                                });
                            }
                        },
                    },
                    {
                        key: 'query',
                        value: function (t, r) {
                            ('function' == typeof t && ((r = t), (t = {})),
                                (t = (function (t) {
                                    (((t = t || {}).rows = t.rows || t.limit || 10),
                                        (t.start = t.start || 0),
                                        (t.until = t.until || new Date()),
                                        'object' !== e(t.until) && (t.until = new Date(t.until)));
                                    ((t.from = t.from || t.until - 864e5),
                                        'object' !== e(t.from) && (t.from = new Date(t.from)));
                                    return ((t.order = t.order || 'desc'), t);
                                })(t)));
                            var n = u.join(this.dirname, this.filename),
                                i = '',
                                o = [],
                                a = 0,
                                l = s.createReadStream(n, { encoding: 'utf8' });
                            function c(r, n) {
                                try {
                                    var i = JSON.parse(r);
                                    (function (r) {
                                        if (!r) return;
                                        if ('object' !== e(r)) return;
                                        var n = new Date(r.timestamp);
                                        if (
                                            (t.from && n < t.from) ||
                                            (t.until && n > t.until) ||
                                            (t.level && t.level !== r.level)
                                        )
                                            return;
                                        return !0;
                                    })(i) &&
                                        (function (e) {
                                            if (t.rows && o.length >= t.rows && 'desc' !== t.order)
                                                return void (l.readable && l.destroy());
                                            t.fields &&
                                                (e = t.fields.reduce(function (t, r) {
                                                    return ((t[r] = e[r]), t);
                                                }, {}));
                                            'desc' === t.order && o.length >= t.rows && o.shift();
                                            o.push(e);
                                        })(i);
                                } catch (a) {
                                    n || l.emit('error', a);
                                }
                            }
                            (l.on('error', function (e) {
                                if ((l.readable && l.destroy(), r))
                                    return 'ENOENT' !== e.code ? r(e) : r(null, o);
                            }),
                                l.on('data', function (e) {
                                    for (
                                        var r = (e = (i + e).split(/\n+/)).length - 1, n = 0;
                                        n < r;
                                        n++
                                    )
                                        ((!t.start || a >= t.start) && c(e[n]), a++);
                                    i = e[r];
                                }),
                                l.on('close', function () {
                                    (i && c(i, !0),
                                        'desc' === t.order && (o = o.reverse()),
                                        r && r(null, o));
                                }));
                        },
                    },
                    {
                        key: 'stream',
                        value: function () {
                            var e =
                                    arguments.length > 0 && void 0 !== arguments[0]
                                        ? arguments[0]
                                        : {},
                                t = u.join(this.dirname, this.filename),
                                r = new h(),
                                n = { file: t, start: e.start };
                            return (
                                (r.destroy = b(n, function (e, t) {
                                    if (e) return r.emit('error', e);
                                    try {
                                        (r.emit('data', t), (t = JSON.parse(t)), r.emit('log', t));
                                    } catch (n) {
                                        r.emit('error', n);
                                    }
                                })),
                                r
                            );
                        },
                    },
                    {
                        key: 'open',
                        value: function () {
                            var e = this;
                            this.filename &&
                                (this._opening ||
                                    ((this._opening = !0),
                                    this.stat(function (t, r) {
                                        if (t) return e.emit('error', t);
                                        (m('stat done: %s { size: %s }', e.filename, r),
                                            (e._size = r),
                                            (e._dest = e._createStream(e._stream)),
                                            (e._opening = !1),
                                            e.once('open', function () {
                                                e._stream.emit('rotate') || (e._rotate = !1);
                                            }));
                                    })));
                        },
                    },
                    {
                        key: 'stat',
                        value: function (e) {
                            var t = this,
                                r = this._getFile(),
                                n = u.join(this.dirname, r);
                            s.stat(n, function (i, o) {
                                return i && 'ENOENT' === i.code
                                    ? (m('ENOENT ok', n), (t.filename = r), e(null, 0))
                                    : i
                                      ? (m('err '.concat(i.code, ' ').concat(n)), e(i))
                                      : !o || t._needsNewFile(o.size)
                                        ? t._incFile(function () {
                                              return t.stat(e);
                                          })
                                        : ((t.filename = r), void e(null, o.size));
                            });
                        },
                    },
                    {
                        key: 'close',
                        value: function (e) {
                            var t = this;
                            this._stream &&
                                this._stream.end(function () {
                                    (e && e(), t.emit('flush'), t.emit('closed'));
                                });
                        },
                    },
                    {
                        key: '_needsNewFile',
                        value: function (e) {
                            return ((e = e || this._size), this.maxsize && e >= this.maxsize);
                        },
                    },
                    {
                        key: '_onError',
                        value: function (e) {
                            this.emit('error', e);
                        },
                    },
                    {
                        key: '_setupStream',
                        value: function (e) {
                            return (e.on('error', this._onError), e);
                        },
                    },
                    {
                        key: '_cleanupStream',
                        value: function (e) {
                            return (e.removeListener('error', this._onError), e.destroy(), e);
                        },
                    },
                    {
                        key: '_rotateFile',
                        value: function () {
                            var e = this;
                            this._incFile(function () {
                                return e.open();
                            });
                        },
                    },
                    {
                        key: '_endStream',
                        value: function () {
                            var e = this,
                                t =
                                    arguments.length > 0 && void 0 !== arguments[0]
                                        ? arguments[0]
                                        : function () {};
                            this._dest
                                ? (this._stream.unpipe(this._dest),
                                  this._dest.end(function () {
                                      (e._cleanupStream(e._dest), t());
                                  }))
                                : t();
                        },
                    },
                    {
                        key: '_createStream',
                        value: function (e) {
                            var t = this,
                                r = u.join(this.dirname, this.filename);
                            m('create stream start', r, this.options);
                            var n = s
                                .createWriteStream(r, this.options)
                                .on('error', function (e) {
                                    return m(e);
                                })
                                .on('close', function () {
                                    return m('close', n.path, n.bytesWritten);
                                })
                                .on('open', function () {
                                    (m('file open ok', r),
                                        t.emit('open', r),
                                        e.pipe(n),
                                        t.rotatedWhileOpening &&
                                            ((t._stream = new p()),
                                            t._stream.setMaxListeners(30),
                                            t._rotateFile(),
                                            (t.rotatedWhileOpening = !1),
                                            t._cleanupStream(n),
                                            e.end()));
                                });
                            return (m('create stream ok', r), n);
                        },
                    },
                    {
                        key: '_incFile',
                        value: function (e) {
                            m('_incFile', this.filename);
                            var t = u.extname(this._basename),
                                r = u.basename(this._basename, t),
                                n = [];
                            (this.zippedArchive &&
                                n.push(
                                    function (e) {
                                        var n =
                                            this._created > 0 && !this.tailable
                                                ? this._created
                                                : '';
                                        this._compressFile(
                                            u.join(this.dirname, ''.concat(r).concat(n).concat(t)),
                                            u.join(
                                                this.dirname,
                                                ''.concat(r).concat(n).concat(t, '.gz')
                                            ),
                                            e
                                        );
                                    }.bind(this)
                                ),
                                n.push(
                                    function (e) {
                                        this.tailable
                                            ? this._checkMaxFilesTailable(t, r, e)
                                            : ((this._created += 1),
                                              this._checkMaxFilesIncrementing(t, r, e));
                                    }.bind(this)
                                ),
                                l(n, e));
                        },
                    },
                    {
                        key: '_getFile',
                        value: function () {
                            var e = u.extname(this._basename),
                                t = u.basename(this._basename, e),
                                r = this.rotationFormat ? this.rotationFormat() : this._created;
                            return !this.tailable && this._created
                                ? ''.concat(t).concat(r).concat(e)
                                : ''.concat(t).concat(e);
                        },
                    },
                    {
                        key: '_checkMaxFilesIncrementing',
                        value: function (e, t, r) {
                            if (!this.maxFiles || this._created < this.maxFiles)
                                return setImmediate(r);
                            var n = this._created - this.maxFiles,
                                i = 0 !== n ? n : '',
                                o = this.zippedArchive ? '.gz' : '',
                                a = ''.concat(t).concat(i).concat(e).concat(o),
                                l = u.join(this.dirname, a);
                            s.unlink(l, r);
                        },
                    },
                    {
                        key: '_checkMaxFilesTailable',
                        value: function (e, t, r) {
                            var n = this,
                                i = [];
                            if (this.maxFiles) {
                                for (
                                    var o = this.zippedArchive ? '.gz' : '', a = this.maxFiles - 1;
                                    a > 1;
                                    a--
                                )
                                    i.push(
                                        function (r, n) {
                                            var i = this,
                                                a = ''
                                                    .concat(t)
                                                    .concat(r - 1)
                                                    .concat(e)
                                                    .concat(o),
                                                l = u.join(this.dirname, a);
                                            s.exists(l, function (c) {
                                                if (!c) return n(null);
                                                ((a = ''.concat(t).concat(r).concat(e).concat(o)),
                                                    s.rename(l, u.join(i.dirname, a), n));
                                            });
                                        }.bind(this, a)
                                    );
                                l(i, function () {
                                    s.rename(
                                        u.join(n.dirname, ''.concat(t).concat(e).concat(o)),
                                        u.join(n.dirname, ''.concat(t, '1').concat(e).concat(o)),
                                        r
                                    );
                                });
                            }
                        },
                    },
                    {
                        key: '_compressFile',
                        value: function (e, t, r) {
                            s.access(e, s.F_OK, function (n) {
                                if (n) return r();
                                var i = c.createGzip(),
                                    o = s.createReadStream(e),
                                    a = s.createWriteStream(t);
                                (a.on('finish', function () {
                                    s.unlink(e, r);
                                }),
                                    o.pipe(i).pipe(a));
                            });
                        },
                    },
                    {
                        key: '_createLogDirIfNotExist',
                        value: function (e) {
                            s.existsSync(e) || s.mkdirSync(e, { recursive: !0 });
                        },
                    },
                ])
            );
        })(y)),
        Fs
    );
}
function Zs() {
    if (zs) return Us;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t) {
        var r = Object.keys(e);
        if (Object.getOwnPropertySymbols) {
            var n = Object.getOwnPropertySymbols(e);
            (t &&
                (n = n.filter(function (t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable;
                })),
                r.push.apply(r, n));
        }
        return r;
    }
    function r(e) {
        for (var r = 1; r < arguments.length; r++) {
            var i = null != arguments[r] ? arguments[r] : {};
            r % 2
                ? t(Object(i), !0).forEach(function (t) {
                      n(e, t, i[t]);
                  })
                : Object.getOwnPropertyDescriptors
                  ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(i))
                  : t(Object(i)).forEach(function (t) {
                        Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(i, t));
                    });
        }
        return e;
    }
    function n(e, t, r) {
        return (
            (t = o(t)) in e
                ? Object.defineProperty(e, t, {
                      value: r,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (e[t] = r),
            e
        );
    }
    function i(e, t, r) {
        return (
            t &&
                (function (e, t) {
                    for (var r = 0; r < t.length; r++) {
                        var n = t[r];
                        ((n.enumerable = n.enumerable || !1),
                            (n.configurable = !0),
                            'value' in n && (n.writable = !0),
                            Object.defineProperty(e, o(n.key), n));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function o(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    function a(t, r, n) {
        return (
            (r = u(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, s() ? Reflect.construct(r, n || [], u(t).constructor) : r.apply(t, n))
        );
    }
    function s() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (s = function () {
            return !!e;
        })();
    }
    function u(e) {
        return (u = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function l(e, t) {
        return (l = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    zs = 1;
    var c = Sr,
        f = Sr,
        d = Ps().Stream,
        h = Ko(),
        p = Fn().configure;
    return (
        (Us = (function (e) {
            function t() {
                var e,
                    r = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                return (
                    (function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, t),
                    ((e = a(this, t, [r])).options = r),
                    (e.name = r.name || 'http'),
                    (e.ssl = !!r.ssl),
                    (e.host = r.host || 'localhost'),
                    (e.port = r.port),
                    (e.auth = r.auth),
                    (e.path = r.path || ''),
                    (e.maximumDepth = r.maximumDepth),
                    (e.agent = r.agent),
                    (e.headers = r.headers || {}),
                    (e.headers['content-type'] = 'application/json'),
                    (e.batch = r.batch || !1),
                    (e.batchInterval = r.batchInterval || 5e3),
                    (e.batchCount = r.batchCount || 10),
                    (e.batchOptions = []),
                    (e.batchTimeoutID = -1),
                    (e.batchCallback = {}),
                    e.port || (e.port = e.ssl ? 443 : 80),
                    e
                );
            }
            return (
                (function (e, t) {
                    if ('function' != typeof t && null !== t)
                        throw new TypeError('Super expression must either be null or a function');
                    ((e.prototype = Object.create(t && t.prototype, {
                        constructor: { value: e, writable: !0, configurable: !0 },
                    })),
                        Object.defineProperty(e, 'prototype', { writable: !1 }),
                        t && l(e, t));
                })(t, e),
                i(t, [
                    {
                        key: 'log',
                        value: function (e, t) {
                            var r = this;
                            (this._request(e, null, null, function (t, n) {
                                (n &&
                                    200 !== n.statusCode &&
                                    (t = new Error(
                                        'Invalid HTTP Status Code: '.concat(n.statusCode)
                                    )),
                                    t ? r.emit('warn', t) : r.emit('logged', e));
                            }),
                                t && setImmediate(t));
                        },
                    },
                    {
                        key: 'query',
                        value: function (e, t) {
                            'function' == typeof e && ((t = e), (e = {}));
                            var r =
                                (e = { method: 'query', params: this.normalizeQuery(e) }).params
                                    .auth || null;
                            delete e.params.auth;
                            var n = e.params.path || null;
                            (delete e.params.path,
                                this._request(e, r, n, function (e, r, n) {
                                    if (
                                        (r &&
                                            200 !== r.statusCode &&
                                            (e = new Error(
                                                'Invalid HTTP Status Code: '.concat(r.statusCode)
                                            )),
                                        e)
                                    )
                                        return t(e);
                                    if ('string' == typeof n)
                                        try {
                                            n = JSON.parse(n);
                                        } catch (i) {
                                            return t(i);
                                        }
                                    t(null, n);
                                }));
                        },
                    },
                    {
                        key: 'stream',
                        value: function () {
                            var e =
                                    arguments.length > 0 && void 0 !== arguments[0]
                                        ? arguments[0]
                                        : {},
                                t = new d(),
                                r = (e = { method: 'stream', params: e }).params.path || null;
                            delete e.params.path;
                            var n = e.params.auth || null;
                            delete e.params.auth;
                            var i = '',
                                o = this._request(e, n, r);
                            return (
                                (t.destroy = function () {
                                    return o.destroy();
                                }),
                                o.on('data', function (e) {
                                    for (
                                        var r = (e = (i + e).split(/\n+/)).length - 1, n = 0;
                                        n < r;
                                        n++
                                    )
                                        try {
                                            t.emit('log', JSON.parse(e[n]));
                                        } catch (o) {
                                            t.emit('error', o);
                                        }
                                    i = e[r];
                                }),
                                o.on('error', function (e) {
                                    return t.emit('error', e);
                                }),
                                t
                            );
                        },
                    },
                    {
                        key: '_request',
                        value: function (e, t, r, n) {
                            ((e = e || {}),
                                (t = t || this.auth),
                                (r = r || this.path || ''),
                                this.batch
                                    ? this._doBatch(e, n, t, r)
                                    : this._doRequest(e, n, t, r));
                        },
                    },
                    {
                        key: '_doBatch',
                        value: function (e, t, r, n) {
                            if ((this.batchOptions.push(e), 1 === this.batchOptions.length)) {
                                var i = this;
                                ((this.batchCallback = t),
                                    (this.batchTimeoutID = setTimeout(function () {
                                        ((i.batchTimeoutID = -1),
                                            i._doBatchRequest(i.batchCallback, r, n));
                                    }, this.batchInterval)));
                            }
                            this.batchOptions.length === this.batchCount &&
                                this._doBatchRequest(this.batchCallback, r, n);
                        },
                    },
                    {
                        key: '_doBatchRequest',
                        value: function (e, t, r) {
                            this.batchTimeoutID > 0 &&
                                (clearTimeout(this.batchTimeoutID), (this.batchTimeoutID = -1));
                            var n = this.batchOptions.slice();
                            ((this.batchOptions = []), this._doRequest(n, e, t, r));
                        },
                    },
                    {
                        key: '_doRequest',
                        value: function (e, t, n, i) {
                            var o = Object.assign({}, this.headers);
                            n && n.bearer && (o.Authorization = 'Bearer '.concat(n.bearer));
                            var a = (this.ssl ? f : c).request(
                                r(
                                    r({}, this.options),
                                    {},
                                    {
                                        method: 'POST',
                                        host: this.host,
                                        port: this.port,
                                        path: '/'.concat(i.replace(/^\//, '')),
                                        headers: o,
                                        auth:
                                            n && n.username && n.password
                                                ? ''.concat(n.username, ':').concat(n.password)
                                                : '',
                                        agent: this.agent,
                                    }
                                )
                            );
                            (a.on('error', t),
                                a.on('response', function (e) {
                                    return e
                                        .on('end', function () {
                                            return t(null, e);
                                        })
                                        .resume();
                                }));
                            var s = p(
                                r({}, this.maximumDepth && { maximumDepth: this.maximumDepth })
                            );
                            a.end(Buffer.from(s(e, this.options.replacer), 'utf8'));
                        },
                    },
                ])
            );
        })(h)),
        Us
    );
}
function Xs() {
    if ($s) return Gs;
    $s = 1;
    const e = (e) => null !== e && 'object' == typeof e && 'function' == typeof e.pipe;
    return (
        (e.writable = (t) =>
            e(t) &&
            !1 !== t.writable &&
            'function' == typeof t._write &&
            'object' == typeof t._writableState),
        (e.readable = (t) =>
            e(t) &&
            !1 !== t.readable &&
            'function' == typeof t._read &&
            'object' == typeof t._readableState),
        (e.duplex = (t) => e.writable(t) && e.readable(t)),
        (e.transform = (t) => e.duplex(t) && 'function' == typeof t._transform),
        (Gs = e)
    );
}
function Qs() {
    if (Hs) return Ws;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    function n(t, r, n) {
        return (
            (r = o(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, i() ? Reflect.construct(r, n || [], o(t).constructor) : r.apply(t, n))
        );
    }
    function i() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (i = function () {
            return !!e;
        })();
    }
    function o(e) {
        return (o = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function a(e, t) {
        return (a = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    Hs = 1;
    var s = Xs(),
        u = sn().MESSAGE,
        l = Sr,
        c = Ko();
    return (
        (Ws = (function (e) {
            function r() {
                var e,
                    t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                if (
                    ((function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, r),
                    (e = n(this, r, [t])),
                    !t.stream || !s(t.stream))
                )
                    throw new Error('options.stream is required.');
                return (
                    (e._stream = t.stream),
                    e._stream.setMaxListeners(1 / 0),
                    (e.isObjectMode = t.stream._writableState.objectMode),
                    (e.eol = 'string' == typeof t.eol ? t.eol : l.EOL),
                    e
                );
            }
            return (
                (function (e, t) {
                    if ('function' != typeof t && null !== t)
                        throw new TypeError('Super expression must either be null or a function');
                    ((e.prototype = Object.create(t && t.prototype, {
                        constructor: { value: e, writable: !0, configurable: !0 },
                    })),
                        Object.defineProperty(e, 'prototype', { writable: !1 }),
                        t && a(e, t));
                })(r, e),
                t(r, [
                    {
                        key: 'log',
                        value: function (e, t) {
                            var r = this;
                            if (
                                (setImmediate(function () {
                                    return r.emit('logged', e);
                                }),
                                this.isObjectMode)
                            )
                                return (this._stream.write(e), void (t && t()));
                            (this._stream.write(''.concat(e[u]).concat(this.eol)), t && t());
                        },
                    },
                ])
            );
        })(c)),
        Ws
    );
}
var eu,
    tu = {};
function ru() {
    if (eu) return tu;
    eu = 1;
    var e = Ni(),
        t = sn().configs;
    return (
        (tu.cli = e.levels(t.cli)),
        (tu.npm = e.levels(t.npm)),
        (tu.syslog = e.levels(t.syslog)),
        (tu.addColors = e.levels),
        tu
    );
}
var nu,
    iu = { exports: {} },
    ou = { exports: {} };
var au,
    su,
    uu,
    lu,
    cu,
    fu,
    du = { exports: {} };
function hu() {
    return (
        su ||
            ((su = 1),
            (function (e, t) {
                Object.defineProperty(t, '__esModule', { value: !0 });
                var r =
                        (nu ||
                            ((nu = 1),
                            (function (e, t) {
                                Object.defineProperty(t, '__esModule', { value: !0 });
                                var r = l(ta()),
                                    n = l(Fa()),
                                    i = l(Ua()),
                                    o = l(_a()),
                                    a = l(xa()),
                                    s = l(fa()),
                                    u = l(ya());
                                function l(e) {
                                    return e && e.__esModule ? e : { default: e };
                                }
                                function c(e, t, r) {
                                    r = (0, o.default)(r);
                                    var i = 0,
                                        s = 0,
                                        { length: u } = e,
                                        l = !1;
                                    function c(e, t) {
                                        (!1 === e && (l = !0),
                                            !0 !== l &&
                                                (e
                                                    ? r(e)
                                                    : (++s !== u && t !== n.default) || r(null)));
                                    }
                                    for (0 === u && r(null); i < u; i++)
                                        t(e[i], i, (0, a.default)(c));
                                }
                                function f(e, t, r) {
                                    return (0, i.default)(e, 1 / 0, t, r);
                                }
                                ((t.default = (0, u.default)(function (e, t, n) {
                                    return ((0, r.default)(e) ? c : f)(e, (0, s.default)(t), n);
                                }, 3)),
                                    (e.exports = t.default));
                            })(ou, ou.exports)),
                        ou.exports),
                    n = u(r),
                    i = (function () {
                        return (
                            au ||
                                ((au = 1),
                                (e = du),
                                (t = du.exports),
                                Object.defineProperty(t, '__esModule', { value: !0 }),
                                (t.default = function (e) {
                                    return (t, r, n) => e(t, n);
                                }),
                                (e.exports = t.default)),
                            du.exports
                        );
                        var e, t;
                    })(),
                    o = u(i),
                    a = u(fa()),
                    s = u(ya());
                function u(e) {
                    return e && e.__esModule ? e : { default: e };
                }
                ((t.default = (0, s.default)(function (e, t, r) {
                    return (0, n.default)(e, (0, o.default)((0, a.default)(t)), r);
                }, 3)),
                    (e.exports = t.default));
            })(iu, iu.exports)),
        iu.exports
    );
}
function pu() {
    if (fu) return cu;
    fu = 1;
    var e = (function () {
        if (lu) return uu;
        lu = 1;
        var e = Object.prototype.toString;
        return (uu = function (t) {
            if ('string' == typeof t.displayName && t.constructor.name) return t.displayName;
            if ('string' == typeof t.name && t.name) return t.name;
            if ('object' == typeof t && t.constructor && 'string' == typeof t.constructor.name)
                return t.constructor.name;
            var r = t.toString(),
                n = e.call(t).slice(8, -1);
            return (
                (r = 'Function' === n ? r.substring(r.indexOf('(') + 1, r.indexOf(')')) : n) ||
                'anonymous'
            );
        });
    })();
    return (
        (cu = function (t) {
            var r,
                n = 0;
            function i() {
                return (n || ((n = 1), (r = t.apply(this, arguments)), (t = null)), r);
            }
            return ((i.displayName = e(t)), i);
        }),
        cu
    );
}
var yu,
    mu,
    gu,
    bu,
    vu,
    wu,
    _u,
    Su,
    Eu,
    ku = {};
function Ou() {
    return (
        yu ||
            ((yu = 1),
            (function (e) {
                function t(e) {
                    for (var t in e) this[t] = e[t];
                }
                ((e.get = function (t) {
                    var r = Error.stackTraceLimit;
                    Error.stackTraceLimit = 1 / 0;
                    var n = {},
                        i = Error.prepareStackTrace;
                    ((Error.prepareStackTrace = function (e, t) {
                        return t;
                    }),
                        Error.captureStackTrace(n, t || e.get));
                    var o = n.stack;
                    return ((Error.prepareStackTrace = i), (Error.stackTraceLimit = r), o);
                }),
                    (e.parse = function (e) {
                        if (!e.stack) return [];
                        var t = this;
                        return e.stack
                            .split('\n')
                            .slice(1)
                            .map(function (e) {
                                if (e.match(/^\s*[-]{4,}$/))
                                    return t._createParsedCallSite({
                                        fileName: e,
                                        lineNumber: null,
                                        functionName: null,
                                        typeName: null,
                                        methodName: null,
                                        columnNumber: null,
                                        native: null,
                                    });
                                var r = e.match(
                                    /at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/
                                );
                                if (r) {
                                    var n = null,
                                        i = null,
                                        o = null,
                                        a = null,
                                        s = null,
                                        u = 'native' === r[5];
                                    if (r[1]) {
                                        var l = (o = r[1]).lastIndexOf('.');
                                        if (('.' == o[l - 1] && l--, l > 0)) {
                                            ((n = o.substr(0, l)), (i = o.substr(l + 1)));
                                            var c = n.indexOf('.Module');
                                            c > 0 && ((o = o.substr(c + 1)), (n = n.substr(0, c)));
                                        }
                                        a = null;
                                    }
                                    (i && ((a = n), (s = i)),
                                        '<anonymous>' === i && ((s = null), (o = null)));
                                    var f = {
                                        fileName: r[2] || null,
                                        lineNumber: parseInt(r[3], 10) || null,
                                        functionName: o,
                                        typeName: a,
                                        methodName: s,
                                        columnNumber: parseInt(r[4], 10) || null,
                                        native: u,
                                    };
                                    return t._createParsedCallSite(f);
                                }
                            })
                            .filter(function (e) {
                                return !!e;
                            });
                    }));
                ([
                    'this',
                    'typeName',
                    'functionName',
                    'methodName',
                    'fileName',
                    'lineNumber',
                    'columnNumber',
                    'function',
                    'evalOrigin',
                ].forEach(function (e) {
                    ((t.prototype[e] = null),
                        (t.prototype['get' + e[0].toUpperCase() + e.substr(1)] = function () {
                            return this[e];
                        }));
                }),
                    ['topLevel', 'eval', 'native', 'constructor'].forEach(function (e) {
                        ((t.prototype[e] = !1),
                            (t.prototype['is' + e[0].toUpperCase() + e.substr(1)] = function () {
                                return this[e];
                            }));
                    }),
                    (e._createParsedCallSite = function (e) {
                        return new t(e);
                    }));
            })(ku)),
        ku
    );
}
function Tu() {
    if (gu) return mu;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    function n(t, r, n) {
        return (
            (r = o(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, i() ? Reflect.construct(r, n || [], o(t).constructor) : r.apply(t, n))
        );
    }
    function i() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (i = function () {
            return !!e;
        })();
    }
    function o(e) {
        return (o = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function a(e, t) {
        return (a = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    gu = 1;
    var s = Ps().Writable;
    return (mu = (function (e) {
        function r(e) {
            var t;
            if (
                ((function (e, t) {
                    if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                })(this, r),
                (t = n(this, r, [{ objectMode: !0 }])),
                !e)
            )
                throw new Error('ExceptionStream requires a TransportStream instance.');
            return ((t.handleExceptions = !0), (t.transport = e), t);
        }
        return (
            (function (e, t) {
                if ('function' != typeof t && null !== t)
                    throw new TypeError('Super expression must either be null or a function');
                ((e.prototype = Object.create(t && t.prototype, {
                    constructor: { value: e, writable: !0, configurable: !0 },
                })),
                    Object.defineProperty(e, 'prototype', { writable: !1 }),
                    t && a(e, t));
            })(r, e),
            t(r, [
                {
                    key: '_write',
                    value: function (e, t, r) {
                        return e.exception ? this.transport.log(e, r) : (r(), !0);
                    },
                },
            ])
        );
    })(s));
}
function Mu() {
    if (vu) return bu;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    vu = 1;
    var n = Sr,
        i = hu(),
        o = Ks()('winston:exception'),
        a = pu(),
        s = Ou(),
        u = Tu();
    return (
        (bu = (function () {
            return t(
                function e(t) {
                    if (
                        ((function (e, t) {
                            if (!(e instanceof t))
                                throw new TypeError('Cannot call a class as a function');
                        })(this, e),
                        !t)
                    )
                        throw new Error('Logger is required to handle exceptions');
                    ((this.logger = t), (this.handlers = new Map()));
                },
                [
                    {
                        key: 'handle',
                        value: function () {
                            for (
                                var e = this, t = arguments.length, r = new Array(t), n = 0;
                                n < t;
                                n++
                            )
                                r[n] = arguments[n];
                            (r.forEach(function (t) {
                                if (Array.isArray(t))
                                    return t.forEach(function (t) {
                                        return e._addHandler(t);
                                    });
                                e._addHandler(t);
                            }),
                                this.catcher ||
                                    ((this.catcher = this._uncaughtException.bind(this)),
                                    process.on('uncaughtException', this.catcher)));
                        },
                    },
                    {
                        key: 'unhandle',
                        value: function () {
                            var e = this;
                            this.catcher &&
                                (process.removeListener('uncaughtException', this.catcher),
                                (this.catcher = !1),
                                Array.from(this.handlers.values()).forEach(function (t) {
                                    return e.logger.unpipe(t);
                                }));
                        },
                    },
                    {
                        key: 'getAllInfo',
                        value: function (e) {
                            var t = null;
                            return (
                                e && (t = 'string' == typeof e ? e : e.message),
                                {
                                    error: e,
                                    level: 'error',
                                    message: [
                                        'uncaughtException: '.concat(t || '(no error message)'),
                                        (e && e.stack) || '  No stack trace',
                                    ].join('\n'),
                                    stack: e && e.stack,
                                    exception: !0,
                                    date: new Date().toString(),
                                    process: this.getProcessInfo(),
                                    os: this.getOsInfo(),
                                    trace: this.getTrace(e),
                                }
                            );
                        },
                    },
                    {
                        key: 'getProcessInfo',
                        value: function () {
                            return {
                                pid: process.pid,
                                uid: process.getuid ? process.getuid() : null,
                                gid: process.getgid ? process.getgid() : null,
                                cwd: process.cwd(),
                                execPath: process.execPath,
                                version: process.version,
                                argv: process.argv,
                                memoryUsage: process.memoryUsage(),
                            };
                        },
                    },
                    {
                        key: 'getOsInfo',
                        value: function () {
                            return { loadavg: n.loadavg(), uptime: n.uptime() };
                        },
                    },
                    {
                        key: 'getTrace',
                        value: function (e) {
                            return (e ? s.parse(e) : s.get()).map(function (e) {
                                return {
                                    column: e.getColumnNumber(),
                                    file: e.getFileName(),
                                    function: e.getFunctionName(),
                                    line: e.getLineNumber(),
                                    method: e.getMethodName(),
                                    native: e.isNative(),
                                };
                            });
                        },
                    },
                    {
                        key: '_addHandler',
                        value: function (e) {
                            if (!this.handlers.has(e)) {
                                e.handleExceptions = !0;
                                var t = new u(e);
                                (this.handlers.set(e, t), this.logger.pipe(t));
                            }
                        },
                    },
                    {
                        key: '_uncaughtException',
                        value: function (e) {
                            var t,
                                r = this.getAllInfo(e),
                                n = this._getExceptionHandlers(),
                                s =
                                    'function' == typeof this.logger.exitOnError
                                        ? this.logger.exitOnError(e)
                                        : this.logger.exitOnError;
                            function u() {
                                (o('doExit', s),
                                    o('process._exiting', process._exiting),
                                    s &&
                                        !process._exiting &&
                                        (t && clearTimeout(t), process.exit(1)));
                            }
                            if ((!n.length && s && (s = !1), !n || 0 === n.length))
                                return process.nextTick(u);
                            (i(
                                n,
                                function (e, t) {
                                    var r = a(t),
                                        n = e.transport || e;
                                    function i(e) {
                                        return function () {
                                            (o(e), r());
                                        };
                                    }
                                    ((n._ending = !0),
                                        n.once('finish', i('finished')),
                                        n.once('error', i('error')));
                                },
                                function () {
                                    return s && u();
                                }
                            ),
                                this.logger.log(r),
                                s && (t = setTimeout(u, 3e3)));
                        },
                    },
                    {
                        key: '_getExceptionHandlers',
                        value: function () {
                            return this.logger.transports.filter(function (e) {
                                return (e.transport || e).handleExceptions;
                            });
                        },
                    },
                ]
            );
        })()),
        bu
    );
}
function Au() {
    if (_u) return wu;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    function n(t, r, n) {
        return (
            (r = o(r)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, i() ? Reflect.construct(r, n || [], o(t).constructor) : r.apply(t, n))
        );
    }
    function i() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (i = function () {
            return !!e;
        })();
    }
    function o(e) {
        return (o = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function a(e, t) {
        return (a = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    _u = 1;
    var s = Ps().Writable;
    return (wu = (function (e) {
        function r(e) {
            var t;
            if (
                ((function (e, t) {
                    if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                })(this, r),
                (t = n(this, r, [{ objectMode: !0 }])),
                !e)
            )
                throw new Error('RejectionStream requires a TransportStream instance.');
            return ((t.handleRejections = !0), (t.transport = e), t);
        }
        return (
            (function (e, t) {
                if ('function' != typeof t && null !== t)
                    throw new TypeError('Super expression must either be null or a function');
                ((e.prototype = Object.create(t && t.prototype, {
                    constructor: { value: e, writable: !0, configurable: !0 },
                })),
                    Object.defineProperty(e, 'prototype', { writable: !1 }),
                    t && a(e, t));
            })(r, e),
            t(r, [
                {
                    key: '_write',
                    value: function (e, t, r) {
                        return e.rejection ? this.transport.log(e, r) : (r(), !0);
                    },
                },
            ])
        );
    })(s));
}
function xu() {
    if (Eu) return Su;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    Eu = 1;
    var n = Sr,
        i = hu(),
        o = Ks()('winston:rejection'),
        a = pu(),
        s = Ou(),
        u = Au();
    return (
        (Su = (function () {
            return t(
                function e(t) {
                    if (
                        ((function (e, t) {
                            if (!(e instanceof t))
                                throw new TypeError('Cannot call a class as a function');
                        })(this, e),
                        !t)
                    )
                        throw new Error('Logger is required to handle rejections');
                    ((this.logger = t), (this.handlers = new Map()));
                },
                [
                    {
                        key: 'handle',
                        value: function () {
                            for (
                                var e = this, t = arguments.length, r = new Array(t), n = 0;
                                n < t;
                                n++
                            )
                                r[n] = arguments[n];
                            (r.forEach(function (t) {
                                if (Array.isArray(t))
                                    return t.forEach(function (t) {
                                        return e._addHandler(t);
                                    });
                                e._addHandler(t);
                            }),
                                this.catcher ||
                                    ((this.catcher = this._unhandledRejection.bind(this)),
                                    process.on('unhandledRejection', this.catcher)));
                        },
                    },
                    {
                        key: 'unhandle',
                        value: function () {
                            var e = this;
                            this.catcher &&
                                (process.removeListener('unhandledRejection', this.catcher),
                                (this.catcher = !1),
                                Array.from(this.handlers.values()).forEach(function (t) {
                                    return e.logger.unpipe(t);
                                }));
                        },
                    },
                    {
                        key: 'getAllInfo',
                        value: function (e) {
                            var t = null;
                            return (
                                e && (t = 'string' == typeof e ? e : e.message),
                                {
                                    error: e,
                                    level: 'error',
                                    message: [
                                        'unhandledRejection: '.concat(t || '(no error message)'),
                                        (e && e.stack) || '  No stack trace',
                                    ].join('\n'),
                                    stack: e && e.stack,
                                    rejection: !0,
                                    date: new Date().toString(),
                                    process: this.getProcessInfo(),
                                    os: this.getOsInfo(),
                                    trace: this.getTrace(e),
                                }
                            );
                        },
                    },
                    {
                        key: 'getProcessInfo',
                        value: function () {
                            return {
                                pid: process.pid,
                                uid: process.getuid ? process.getuid() : null,
                                gid: process.getgid ? process.getgid() : null,
                                cwd: process.cwd(),
                                execPath: process.execPath,
                                version: process.version,
                                argv: process.argv,
                                memoryUsage: process.memoryUsage(),
                            };
                        },
                    },
                    {
                        key: 'getOsInfo',
                        value: function () {
                            return { loadavg: n.loadavg(), uptime: n.uptime() };
                        },
                    },
                    {
                        key: 'getTrace',
                        value: function (e) {
                            return (e ? s.parse(e) : s.get()).map(function (e) {
                                return {
                                    column: e.getColumnNumber(),
                                    file: e.getFileName(),
                                    function: e.getFunctionName(),
                                    line: e.getLineNumber(),
                                    method: e.getMethodName(),
                                    native: e.isNative(),
                                };
                            });
                        },
                    },
                    {
                        key: '_addHandler',
                        value: function (e) {
                            if (!this.handlers.has(e)) {
                                e.handleRejections = !0;
                                var t = new u(e);
                                (this.handlers.set(e, t), this.logger.pipe(t));
                            }
                        },
                    },
                    {
                        key: '_unhandledRejection',
                        value: function (e) {
                            var t,
                                r = this.getAllInfo(e),
                                n = this._getRejectionHandlers(),
                                s =
                                    'function' == typeof this.logger.exitOnError
                                        ? this.logger.exitOnError(e)
                                        : this.logger.exitOnError;
                            function u() {
                                (o('doExit', s),
                                    o('process._exiting', process._exiting),
                                    s &&
                                        !process._exiting &&
                                        (t && clearTimeout(t), process.exit(1)));
                            }
                            if ((!n.length && s && (s = !1), !n || 0 === n.length))
                                return process.nextTick(u);
                            (i(
                                n,
                                function (e, t) {
                                    var r = a(t),
                                        n = e.transport || e;
                                    function i(e) {
                                        return function () {
                                            (o(e), r());
                                        };
                                    }
                                    ((n._ending = !0),
                                        n.once('finish', i('finished')),
                                        n.once('error', i('error')));
                                },
                                function () {
                                    return s && u();
                                }
                            ),
                                this.logger.log(r),
                                s && (t = setTimeout(u, 3e3)));
                        },
                    },
                    {
                        key: '_getRejectionHandlers',
                        value: function () {
                            return this.logger.transports.filter(function (e) {
                                return (e.transport || e).handleRejections;
                            });
                        },
                    },
                ]
            );
        })()),
        Su
    );
}
var Pu,
    Ru,
    ju,
    Cu,
    Lu,
    Iu,
    Du,
    Nu,
    Fu,
    Bu,
    Uu,
    zu,
    Gu,
    $u,
    Wu,
    Hu = { exports: {} },
    Vu = { exports: {} };
function qu() {
    if (Ru) return Hu.exports;
    Ru = 1;
    const e = vr(),
        { LEVEL: t } = sn(),
        r = (function () {
            if (Pu) return Vu.exports;
            Pu = 1;
            const e = vr(),
                t = Go(),
                { LEVEL: r } = sn(),
                n = (Vu.exports = function (e = {}) {
                    (t.call(this, { objectMode: !0, highWaterMark: e.highWaterMark }),
                        (this.format = e.format),
                        (this.level = e.level),
                        (this.handleExceptions = e.handleExceptions),
                        (this.handleRejections = e.handleRejections),
                        (this.silent = e.silent),
                        e.log && (this.log = e.log),
                        e.logv && (this.logv = e.logv),
                        e.close && (this.close = e.close),
                        this.once('pipe', (e) => {
                            ((this.levels = e.levels), (this.parent = e));
                        }),
                        this.once('unpipe', (e) => {
                            e === this.parent && ((this.parent = null), this.close && this.close());
                        }));
                });
            return (
                e.inherits(n, t),
                (n.prototype._write = function (e, t, n) {
                    if (this.silent || (!0 === e.exception && !this.handleExceptions))
                        return n(null);
                    const i = this.level || (this.parent && this.parent.level);
                    if (!i || this.levels[i] >= this.levels[e[r]]) {
                        if (e && !this.format) return this.log(e, n);
                        let t, r;
                        try {
                            r = this.format.transform(Object.assign({}, e), this.format.options);
                        } catch (o) {
                            t = o;
                        }
                        if (t || !r) {
                            if ((n(), t)) throw t;
                            return;
                        }
                        return this.log(r, n);
                    }
                    return ((this._writableState.sync = !1), n(null));
                }),
                (n.prototype._writev = function (e, t) {
                    if (this.logv) {
                        const r = e.filter(this._accept, this);
                        return r.length ? this.logv(r, t) : t(null);
                    }
                    for (let n = 0; n < e.length; n++) {
                        if (!this._accept(e[n])) continue;
                        if (e[n].chunk && !this.format) {
                            this.log(e[n].chunk, e[n].callback);
                            continue;
                        }
                        let i, o;
                        try {
                            o = this.format.transform(
                                Object.assign({}, e[n].chunk),
                                this.format.options
                            );
                        } catch (r) {
                            i = r;
                        }
                        if (i || !o) {
                            if ((e[n].callback(), i)) throw (t(null), i);
                        } else this.log(o, e[n].callback);
                    }
                    return t(null);
                }),
                (n.prototype._accept = function (e) {
                    const t = e.chunk;
                    if (this.silent) return !1;
                    const n = this.level || (this.parent && this.parent.level);
                    return !(
                        (!0 !== t.exception && n && !(this.levels[n] >= this.levels[t[r]])) ||
                        (!this.handleExceptions && !0 === t.exception)
                    );
                }),
                (n.prototype._nop = function () {}),
                Vu.exports
            );
        })(),
        n = (Hu.exports = function (e = {}) {
            if ((r.call(this, e), !e.transport || 'function' != typeof e.transport.log))
                throw new Error('Invalid transport, must be an object with a log method.');
            ((this.transport = e.transport),
                (this.level = this.level || e.transport.level),
                (this.handleExceptions = this.handleExceptions || e.transport.handleExceptions),
                this._deprecated(),
                this.transport.__winstonError ||
                    ((this.transport.__winstonError = function (e) {
                        this.emit('error', e, this.transport);
                    }.bind(this)),
                    this.transport.on('error', this.transport.__winstonError)));
        });
    return (
        e.inherits(n, r),
        (n.prototype._write = function (e, r, n) {
            if (this.silent || (!0 === e.exception && !this.handleExceptions)) return n(null);
            ((!this.level || this.levels[this.level] >= this.levels[e[t]]) &&
                this.transport.log(e[t], e.message, e, this._nop),
                n(null));
        }),
        (n.prototype._writev = function (e, r) {
            for (let n = 0; n < e.length; n++)
                this._accept(e[n]) &&
                    (this.transport.log(e[n].chunk[t], e[n].chunk.message, e[n].chunk, this._nop),
                    e[n].callback());
            return r(null);
        }),
        (n.prototype._deprecated = function () {}),
        (n.prototype.close = function () {
            (this.transport.close && this.transport.close(),
                this.transport.__winstonError &&
                    (this.transport.removeListener('error', this.transport.__winstonError),
                    (this.transport.__winstonError = null)));
        }),
        Hu.exports
    );
}
function Yu() {
    if (Cu) return ju;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    Cu = 1;
    var n = (function () {
        return t(
            function t(r) {
                !(function (e, t) {
                    if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                })(this, t);
                var n = Ju();
                if ('object' !== e(r) || Array.isArray(r) || !(r instanceof n))
                    throw new Error('Logger is required for profiling');
                ((this.logger = r), (this.start = Date.now()));
            },
            [
                {
                    key: 'done',
                    value: function () {
                        for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
                            r[n] = arguments[n];
                        'function' == typeof r[r.length - 1] && r.pop();
                        var i = 'object' === e(r[r.length - 1]) ? r.pop() : {};
                        return (
                            (i.level = i.level || 'info'),
                            (i.durationMs = Date.now() - this.start),
                            this.logger.write(i)
                        );
                    },
                },
            ]
        );
    })();
    return (ju = n);
}
function Ku() {
    if (Nu) return Du;
    Nu = 1;
    const e = (function () {
            if (Iu) return Lu;
            Iu = 1;
            class e extends Error {
                constructor(t) {
                    (super(
                        `Format functions must be synchronous taking a two arguments: (info, opts)\nFound: ${t.toString().split('\n')[0]}\n`
                    ),
                        Error.captureStackTrace(this, e));
                }
            }
            return (Lu = (t) => {
                if (t.length > 2) throw new e(t);
                function r(e = {}) {
                    this.options = e;
                }
                function n(e) {
                    return new r(e);
                }
                return ((r.prototype.transform = t), (n.Format = r), n);
            });
        })(),
        { MESSAGE: t } = sn(),
        r = Fn();
    function n(e, t) {
        return 'bigint' == typeof t ? t.toString() : t;
    }
    return (Du = e((e, i) => {
        const o = r.configure(i);
        return ((e[t] = o(e, i.replacer || n, i.space)), e);
    }));
}
function Ju() {
    if (Bu) return Fu;
    function e(e, t, r) {
        return (
            (t = n(t)) in e
                ? Object.defineProperty(e, t, {
                      value: r,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0,
                  })
                : (e[t] = r),
            e
        );
    }
    function t(e) {
        return (t =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(e);
    }
    function r(e, t, r) {
        return (
            t &&
                (function (e, t) {
                    for (var r = 0; r < t.length; r++) {
                        var i = t[r];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, n(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function n(e) {
        var r = (function (e, r) {
            if ('object' != t(e) || !e) return e;
            var n = e[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(e, r);
                if ('object' != t(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(e);
        })(e, 'string');
        return 'symbol' == t(r) ? r : r + '';
    }
    function i(e, r, n) {
        return (
            (r = a(r)),
            (function (e, r) {
                if (r && ('object' == t(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(e);
            })(e, o() ? Reflect.construct(r, n || [], a(e).constructor) : r.apply(e, n))
        );
    }
    function o() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (o = function () {
            return !!e;
        })();
    }
    function a(e) {
        return (a = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function s(e, t) {
        return (s = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    Bu = 1;
    var u = Ps(),
        l = u.Stream,
        c = u.Transform,
        f = hu(),
        d = sn(),
        h = d.LEVEL,
        p = d.SPLAT,
        y = Xs(),
        m = Mu(),
        g = xu(),
        b = qu(),
        v = Yu(),
        w = Ui().warn,
        _ = ru(),
        S = /%[scdjifoO%]/g,
        E = (function (n) {
            function o(e) {
                var t;
                return (
                    (function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, o),
                    (t = i(this, o, [{ objectMode: !0 }])).configure(e),
                    t
                );
            }
            return (
                (function (e, t) {
                    if ('function' != typeof t && null !== t)
                        throw new TypeError('Super expression must either be null or a function');
                    ((e.prototype = Object.create(t && t.prototype, {
                        constructor: { value: e, writable: !0, configurable: !0 },
                    })),
                        Object.defineProperty(e, 'prototype', { writable: !1 }),
                        t && s(e, t));
                })(o, n),
                r(o, [
                    {
                        key: 'child',
                        value: function (e) {
                            var t = this;
                            return Object.create(t, {
                                write: {
                                    value: function (r) {
                                        var n = Object.assign({}, e, r);
                                        (r instanceof Error &&
                                            ((n.stack = r.stack), (n.message = r.message)),
                                            t.write(n));
                                    },
                                },
                            });
                        },
                    },
                    {
                        key: 'configure',
                        value: function () {
                            var e = this,
                                t =
                                    arguments.length > 0 && void 0 !== arguments[0]
                                        ? arguments[0]
                                        : {},
                                r = t.silent,
                                n = t.format,
                                i = t.defaultMeta,
                                o = t.levels,
                                a = t.level,
                                s = void 0 === a ? 'info' : a,
                                u = t.exitOnError,
                                l = void 0 === u || u,
                                c = t.transports,
                                f = t.colors,
                                d = t.emitErrs,
                                h = t.formatters,
                                p = t.padLevels,
                                y = t.rewriters,
                                b = t.stripColors,
                                v = t.exceptionHandlers,
                                w = t.rejectionHandlers;
                            if (
                                (this.transports.length && this.clear(),
                                (this.silent = r),
                                (this.format = n || this.format || Ku()()),
                                (this.defaultMeta = i || null),
                                (this.levels = o || this.levels || _.npm.levels),
                                (this.level = s),
                                this.exceptions && this.exceptions.unhandle(),
                                this.rejections && this.rejections.unhandle(),
                                (this.exceptions = new m(this)),
                                (this.rejections = new g(this)),
                                (this.profilers = {}),
                                (this.exitOnError = l),
                                c &&
                                    (c = Array.isArray(c) ? c : [c]).forEach(function (t) {
                                        return e.add(t);
                                    }),
                                f || d || h || p || y || b)
                            )
                                throw new Error(
                                    [
                                        '{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.',
                                        'Use a custom winston.format(function) instead.',
                                        'See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md',
                                    ].join('\n')
                                );
                            (v && this.exceptions.handle(v), w && this.rejections.handle(w));
                        },
                    },
                    {
                        key: 'getHighestLogLevel',
                        value: function () {
                            var e = this,
                                t = k(this.levels, this.level);
                            return this.transports && 0 !== this.transports.length
                                ? this.transports.reduce(function (t, r) {
                                      var n = k(e.levels, r.level);
                                      return null !== n && n > t ? n : t;
                                  }, t)
                                : t;
                        },
                    },
                    {
                        key: 'isLevelEnabled',
                        value: function (e) {
                            var t = this,
                                r = k(this.levels, e);
                            if (null === r) return !1;
                            var n = k(this.levels, this.level);
                            return (
                                null !== n &&
                                (this.transports && 0 !== this.transports.length
                                    ? -1 !==
                                      this.transports.findIndex(function (e) {
                                          var i = k(t.levels, e.level);
                                          return (null === i && (i = n), i >= r);
                                      })
                                    : n >= r)
                            );
                        },
                    },
                    {
                        key: 'log',
                        value: function (r, n) {
                            for (
                                var i = arguments.length, o = new Array(i > 2 ? i - 2 : 0), a = 2;
                                a < i;
                                a++
                            )
                                o[a - 2] = arguments[a];
                            if (1 === arguments.length)
                                return (
                                    (r[h] = r.level),
                                    this._addDefaultMeta(r),
                                    this.write(r),
                                    this
                                );
                            if (2 === arguments.length)
                                return n && 'object' === t(n)
                                    ? ((n[h] = n.level = r),
                                      this._addDefaultMeta(n),
                                      this.write(n),
                                      this)
                                    : ((n = e(e(e({}, h, r), 'level', r), 'message', n)),
                                      this._addDefaultMeta(n),
                                      this.write(n),
                                      this);
                            var s = o[0];
                            if ('object' === t(s) && null !== s && !(n && n.match && n.match(S))) {
                                var u = Object.assign(
                                    {},
                                    this.defaultMeta,
                                    s,
                                    e(e(e(e({}, h, r), p, o), 'level', r), 'message', n)
                                );
                                return (
                                    s.message &&
                                        (u.message = ''.concat(u.message, ' ').concat(s.message)),
                                    s.stack && (u.stack = s.stack),
                                    s.cause && (u.cause = s.cause),
                                    this.write(u),
                                    this
                                );
                            }
                            return (
                                this.write(
                                    Object.assign(
                                        {},
                                        this.defaultMeta,
                                        e(e(e(e({}, h, r), p, o), 'level', r), 'message', n)
                                    )
                                ),
                                this
                            );
                        },
                    },
                    {
                        key: '_transform',
                        value: function (e, t, r) {
                            if (this.silent) return r();
                            (e[h] || (e[h] = e.level),
                                !this.levels[e[h]] && this.levels[e[h]],
                                this._readableState.pipes);
                            try {
                                this.push(this.format.transform(e, this.format.options));
                            } finally {
                                ((this._writableState.sync = !1), r());
                            }
                        },
                    },
                    {
                        key: '_final',
                        value: function (e) {
                            var t = this.transports.slice();
                            f(
                                t,
                                function (e, t) {
                                    if (!e || e.finished) return setImmediate(t);
                                    (e.once('finish', t), e.end());
                                },
                                e
                            );
                        },
                    },
                    {
                        key: 'add',
                        value: function (e) {
                            var t = !y(e) || e.log.length > 2 ? new b({ transport: e }) : e;
                            if (!t._writableState || !t._writableState.objectMode)
                                throw new Error(
                                    'Transports must WritableStreams in objectMode. Set { objectMode: true }.'
                                );
                            return (
                                this._onEvent('error', t),
                                this._onEvent('warn', t),
                                this.pipe(t),
                                e.handleExceptions && this.exceptions.handle(),
                                e.handleRejections && this.rejections.handle(),
                                this
                            );
                        },
                    },
                    {
                        key: 'remove',
                        value: function (e) {
                            if (!e) return this;
                            var t = e;
                            return (
                                (!y(e) || e.log.length > 2) &&
                                    (t = this.transports.filter(function (t) {
                                        return t.transport === e;
                                    })[0]),
                                t && this.unpipe(t),
                                this
                            );
                        },
                    },
                    {
                        key: 'clear',
                        value: function () {
                            return (this.unpipe(), this);
                        },
                    },
                    {
                        key: 'close',
                        value: function () {
                            return (
                                this.exceptions.unhandle(),
                                this.rejections.unhandle(),
                                this.clear(),
                                this.emit('close'),
                                this
                            );
                        },
                    },
                    {
                        key: 'setLevels',
                        value: function () {
                            w.deprecated('setLevels');
                        },
                    },
                    {
                        key: 'query',
                        value: function (e, t) {
                            ('function' == typeof e && ((t = e), (e = {})), (e = e || {}));
                            var r = {},
                                n = Object.assign({}, e.query || {});
                            f(
                                this.transports.filter(function (e) {
                                    return !!e.query;
                                }),
                                function (t, i) {
                                    !(function (t, r) {
                                        (e.query &&
                                            'function' == typeof t.formatQuery &&
                                            (e.query = t.formatQuery(n)),
                                            t.query(e, function (n, i) {
                                                if (n) return r(n);
                                                ('function' == typeof t.formatResults &&
                                                    (i = t.formatResults(i, e.format)),
                                                    r(null, i));
                                            }));
                                    })(t, function (e, n) {
                                        (i && ((n = e || n) && (r[t.name] = n), i()), (i = null));
                                    });
                                },
                                function () {
                                    return t(null, r);
                                }
                            );
                        },
                    },
                    {
                        key: 'stream',
                        value: function () {
                            var e =
                                    arguments.length > 0 && void 0 !== arguments[0]
                                        ? arguments[0]
                                        : {},
                                t = new l(),
                                r = [];
                            return (
                                (t._streams = r),
                                (t.destroy = function () {
                                    for (var e = r.length; e--; ) r[e].destroy();
                                }),
                                this.transports
                                    .filter(function (e) {
                                        return !!e.stream;
                                    })
                                    .forEach(function (n) {
                                        var i = n.stream(e);
                                        i &&
                                            (r.push(i),
                                            i.on('log', function (e) {
                                                ((e.transport = e.transport || []),
                                                    e.transport.push(n.name),
                                                    t.emit('log', e));
                                            }),
                                            i.on('error', function (e) {
                                                ((e.transport = e.transport || []),
                                                    e.transport.push(n.name),
                                                    t.emit('error', e));
                                            }));
                                    }),
                                t
                            );
                        },
                    },
                    {
                        key: 'startTimer',
                        value: function () {
                            return new v(this);
                        },
                    },
                    {
                        key: 'profile',
                        value: function (e) {
                            var r = Date.now();
                            if (this.profilers[e]) {
                                var n = this.profilers[e];
                                delete this.profilers[e];
                                for (
                                    var i = arguments.length,
                                        o = new Array(i > 1 ? i - 1 : 0),
                                        a = 1;
                                    a < i;
                                    a++
                                )
                                    o[a - 1] = arguments[a];
                                'function' == typeof o[o.length - 2] && o.pop();
                                var s = 'object' === t(o[o.length - 1]) ? o.pop() : {};
                                return (
                                    (s.level = s.level || 'info'),
                                    (s.durationMs = r - n),
                                    (s.message = s.message || e),
                                    this.write(s)
                                );
                            }
                            return ((this.profilers[e] = r), this);
                        },
                    },
                    {
                        key: 'handleExceptions',
                        value: function () {
                            var e;
                            (e = this.exceptions).handle.apply(e, arguments);
                        },
                    },
                    {
                        key: 'unhandleExceptions',
                        value: function () {
                            var e;
                            (e = this.exceptions).unhandle.apply(e, arguments);
                        },
                    },
                    {
                        key: 'cli',
                        value: function () {
                            throw new Error(
                                [
                                    'Logger.cli() was removed in winston@3.0.0',
                                    'Use a custom winston.formats.cli() instead.',
                                    'See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md',
                                ].join('\n')
                            );
                        },
                    },
                    {
                        key: '_onEvent',
                        value: function (e, t) {
                            t['__winston' + e] ||
                                ((t['__winston' + e] = function (r) {
                                    ('error' !== e || this.transports.includes(t) || this.add(t),
                                        this.emit(e, r, t));
                                }.bind(this)),
                                t.on(e, t['__winston' + e]));
                        },
                    },
                    {
                        key: '_addDefaultMeta',
                        value: function (e) {
                            this.defaultMeta && Object.assign(e, this.defaultMeta);
                        },
                    },
                ])
            );
        })(c);
    function k(e, t) {
        var r = e[t];
        return r || 0 === r ? r : null;
    }
    return (
        Object.defineProperty(E.prototype, 'transports', {
            configurable: !1,
            enumerable: !0,
            get: function () {
                var e = this._readableState.pipes;
                return Array.isArray(e) ? e : [e].filter(Boolean);
            },
        }),
        (Fu = E)
    );
}
function Zu() {
    if (zu) return Uu;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(t, i, o) {
        return (
            (i = n(i)),
            (function (t, r) {
                if (r && ('object' == e(r) || 'function' == typeof r)) return r;
                if (void 0 !== r)
                    throw new TypeError('Derived constructors may only return object or undefined');
                return (function (e) {
                    if (void 0 === e)
                        throw new ReferenceError(
                            "this hasn't been initialised - super() hasn't been called"
                        );
                    return e;
                })(t);
            })(t, r() ? Reflect.construct(i, o || [], n(t).constructor) : i.apply(t, o))
        );
    }
    function r() {
        try {
            var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        } catch (t) {}
        return (r = function () {
            return !!e;
        })();
    }
    function n(e) {
        return (n = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (e) {
                  return e.__proto__ || Object.getPrototypeOf(e);
              })(e);
    }
    function i(e, t) {
        return (i = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (e, t) {
                  return ((e.__proto__ = t), e);
              })(e, t);
    }
    zu = 1;
    var o = sn().LEVEL,
        a = ru(),
        s = Ju(),
        u = Ks()('winston:create-logger');
    return (
        (Uu = function () {
            var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
            e.levels = e.levels || a.npm.levels;
            var r = (function (e) {
                    function r(e) {
                        return (
                            (function (e, t) {
                                if (!(e instanceof t))
                                    throw new TypeError('Cannot call a class as a function');
                            })(this, r),
                            t(this, r, [e])
                        );
                    }
                    return (
                        (function (e, t) {
                            if ('function' != typeof t && null !== t)
                                throw new TypeError(
                                    'Super expression must either be null or a function'
                                );
                            ((e.prototype = Object.create(t && t.prototype, {
                                constructor: { value: e, writable: !0, configurable: !0 },
                            })),
                                Object.defineProperty(e, 'prototype', { writable: !1 }),
                                t && i(e, t));
                        })(r, e),
                        (n = r),
                        Object.defineProperty(n, 'prototype', { writable: !1 }),
                        n
                    );
                    var n;
                })(s),
                n = new r(e);
            return (
                Object.keys(e.levels).forEach(function (e) {
                    (u('Define prototype method for "%s"', e),
                        'log' !== e &&
                            ((r.prototype[e] = function () {
                                for (
                                    var t = this || n,
                                        r = arguments.length,
                                        i = new Array(r),
                                        a = 0;
                                    a < r;
                                    a++
                                )
                                    i[a] = arguments[a];
                                if (1 === i.length) {
                                    var s = i[0],
                                        u = (s && s.message && s) || { message: s };
                                    return (
                                        (u.level = u[o] = e),
                                        t._addDefaultMeta(u),
                                        t.write(u),
                                        this || n
                                    );
                                }
                                return 0 === i.length
                                    ? (t.log(e, ''), t)
                                    : t.log.apply(t, [e].concat(i));
                            }),
                            (r.prototype[
                                (function (e) {
                                    return (
                                        'is' + e.charAt(0).toUpperCase() + e.slice(1) + 'Enabled'
                                    );
                                })(e)
                            ] = function () {
                                return (this || n).isLevelEnabled(e);
                            })));
                }),
                n
            );
        }),
        Uu
    );
}
function Xu() {
    if ($u) return Gu;
    function e(t) {
        return (e =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (e) {
                      return typeof e;
                  }
                : function (e) {
                      return e &&
                          'function' == typeof Symbol &&
                          e.constructor === Symbol &&
                          e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                  })(t);
    }
    function t(e, t, n) {
        return (
            t &&
                (function (e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var i = t[n];
                        ((i.enumerable = i.enumerable || !1),
                            (i.configurable = !0),
                            'value' in i && (i.writable = !0),
                            Object.defineProperty(e, r(i.key), i));
                    }
                })(e.prototype, t),
            Object.defineProperty(e, 'prototype', { writable: !1 }),
            e
        );
    }
    function r(t) {
        var r = (function (t, r) {
            if ('object' != e(t) || !t) return t;
            var n = t[Symbol.toPrimitive];
            if (void 0 !== n) {
                var i = n.call(t, r);
                if ('object' != e(i)) return i;
                throw new TypeError('@@toPrimitive must return a primitive value.');
            }
            return String(t);
        })(t, 'string');
        return 'symbol' == e(r) ? r : r + '';
    }
    $u = 1;
    var n = Zu();
    return (
        (Gu = (function () {
            return t(
                function e() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                    (!(function (e, t) {
                        if (!(e instanceof t))
                            throw new TypeError('Cannot call a class as a function');
                    })(this, e),
                        (this.loggers = new Map()),
                        (this.options = t));
                },
                [
                    {
                        key: 'add',
                        value: function (e, t) {
                            var r = this;
                            if (!this.loggers.has(e)) {
                                var i =
                                    (t = Object.assign({}, t || this.options)).transports ||
                                    this.options.transports;
                                t.transports = i ? (Array.isArray(i) ? i.slice() : [i]) : [];
                                var o = n(t);
                                (o.on('close', function () {
                                    return r._delete(e);
                                }),
                                    this.loggers.set(e, o));
                            }
                            return this.loggers.get(e);
                        },
                    },
                    {
                        key: 'get',
                        value: function (e, t) {
                            return this.add(e, t);
                        },
                    },
                    {
                        key: 'has',
                        value: function (e) {
                            return !!this.loggers.has(e);
                        },
                    },
                    {
                        key: 'close',
                        value: function (e) {
                            var t = this;
                            if (e) return this._removeLogger(e);
                            this.loggers.forEach(function (e, r) {
                                return t._removeLogger(r);
                            });
                        },
                    },
                    {
                        key: '_removeLogger',
                        value: function (e) {
                            this.loggers.has(e) && (this.loggers.get(e).close(), this._delete(e));
                        },
                    },
                    {
                        key: '_delete',
                        value: function (e) {
                            this.loggers.delete(e);
                        },
                    },
                ]
            );
        })()),
        Gu
    );
}
var Qu =
    (Wu ||
        ((Wu = 1),
        (function (e) {
            var t = Ni(),
                r = Ui().warn;
            ((e.version = zi),
                (e.transports = (function () {
                    return (
                        Vs ||
                            ((Vs = 1),
                            (e = Wi),
                            Object.defineProperty(e, 'Console', {
                                configurable: !0,
                                enumerable: !0,
                                get: function () {
                                    return Jo();
                                },
                            }),
                            Object.defineProperty(e, 'File', {
                                configurable: !0,
                                enumerable: !0,
                                get: function () {
                                    return Js();
                                },
                            }),
                            Object.defineProperty(e, 'Http', {
                                configurable: !0,
                                enumerable: !0,
                                get: function () {
                                    return Zs();
                                },
                            }),
                            Object.defineProperty(e, 'Stream', {
                                configurable: !0,
                                enumerable: !0,
                                get: function () {
                                    return Qs();
                                },
                            })),
                        Wi
                    );
                    var e;
                })()),
                (e.config = ru()),
                (e.addColors = t.levels),
                (e.format = t.format),
                (e.createLogger = Zu()),
                (e.Logger = Ju()),
                (e.ExceptionHandler = Mu()),
                (e.RejectionHandler = xu()),
                (e.Container = Xu()),
                (e.Transport = Ko()),
                (e.loggers = new e.Container()));
            var n = e.createLogger();
            (Object.keys(e.config.npm.levels)
                .concat([
                    'log',
                    'query',
                    'stream',
                    'add',
                    'remove',
                    'clear',
                    'profile',
                    'startTimer',
                    'handleExceptions',
                    'unhandleExceptions',
                    'handleRejections',
                    'unhandleRejections',
                    'configure',
                    'child',
                ])
                .forEach(function (t) {
                    return (e[t] = function () {
                        return n[t].apply(n, arguments);
                    });
                }),
                Object.defineProperty(e, 'level', {
                    get: function () {
                        return n.level;
                    },
                    set: function (e) {
                        n.level = e;
                    },
                }),
                Object.defineProperty(e, 'exceptions', {
                    get: function () {
                        return n.exceptions;
                    },
                }),
                Object.defineProperty(e, 'rejections', {
                    get: function () {
                        return n.rejections;
                    },
                }),
                ['exitOnError'].forEach(function (t) {
                    Object.defineProperty(e, t, {
                        get: function () {
                            return n[t];
                        },
                        set: function (e) {
                            n[t] = e;
                        },
                    });
                }),
                Object.defineProperty(e, 'default', {
                    get: function () {
                        return {
                            exceptionHandlers: n.exceptionHandlers,
                            rejectionHandlers: n.rejectionHandlers,
                            transports: n.transports,
                        };
                    },
                }),
                r.deprecated(e, 'setLevels'),
                r.forFunctions(e, 'useFormat', ['cli']),
                r.forProperties(e, 'useFormat', ['padLevels', 'stripColors']),
                r.forFunctions(e, 'deprecated', ['addRewriter', 'addFilter', 'clone', 'extend']),
                r.forProperties(e, 'deprecated', ['emitErrs', 'levelLength']));
        })(m)),
    m);
const el = d(Qu);
var tl = { exports: {} };
const rl = el || c({ __proto__: null, default: el }, [Qu]),
    nl = {}.LOG_LEVEL || 'info',
    il = rl.createLogger({
        level: nl,
        format: rl.format.combine(
            rl.format.timestamp(),
            rl.format.errors({ stack: !0 }),
            rl.format.json()
        ),
        defaultMeta: { service: 'lightbikes' },
        transports: [
            new rl.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new rl.transports.File({ filename: 'logs/combined.log' }),
        ],
    });
class ol {
    constructor(e = 'app') {
        this.namespace = e;
    }
    static create(e) {
        return new ol(e);
    }
    _formatMessage(e) {
        return `[${this.namespace}] ${e}`;
    }
    debug(e, t = {}) {
        il.debug(this._formatMessage(e), t);
    }
    info(e, t = {}) {
        il.info(this._formatMessage(e), t);
    }
    warn(e, t = {}) {
        il.warn(this._formatMessage(e), t);
    }
    error(e, t = {}) {
        t instanceof Error
            ? il.error(this._formatMessage(e), { error: t.message, stack: t.stack })
            : il.error(this._formatMessage(e), t);
    }
    log(e, t, r = {}) {
        il.log(e, this._formatMessage(t), r);
    }
}
const al = new ol('app');
tl.exports = { Logger: ol, logger: al, createLogger: ol.create };
const sl = (null == tl.exports ? {} : tl.exports).default || tl.exports,
    ul = Object.freeze(
        Object.defineProperty({ __proto__: null, default: sl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var ll = { exports: {} };
const { logger: cl } = sl || ul;
ll.exports = {
    MusicTrack: class {
        constructor(e, t, r = {}) {
            ((this.id = e),
                (this.url = t),
                (this.fallbackUrl = r.fallbackUrl || null),
                (this.metadata = {
                    name: r.name || e,
                    energyLevel: r.energyLevel || 'ambient',
                    duration: r.duration || null,
                    loop: !1 !== r.loop,
                    preload: !1 !== r.preload,
                    description: r.description || '',
                }),
                (this.loadingState = 'not_loaded'),
                (this.audioBuffer = null),
                (this.error = null),
                (this.usingFallback = !1),
                (this.audioContext = null));
        }
        setAudioContext(e) {
            this.audioContext = e;
        }
        load() {
            return l(this, null, function* () {
                if ('loaded' === this.loadingState) return Promise.resolve();
                if ('loading' === this.loadingState) return this.loadingPromise;
                if ('none' === this.id || !this.url)
                    return ((this.loadingState = 'loaded'), Promise.resolve());
                ((this.loadingState = 'loading'),
                    (this.error = null),
                    (this.loadingPromise = this._performLoad()));
                try {
                    (yield this.loadingPromise, (this.loadingState = 'loaded'));
                } catch (e) {
                    throw ((this.loadingState = 'error'), (this.error = e.message), e);
                } finally {
                    this.loadingPromise = null;
                }
            });
        }
        _performLoad() {
            return l(this, null, function* () {
                if (!this.audioContext) throw new Error('Audio context not set for track loading');
                let e = null,
                    t = 1e4;
                for (let a = 0; a <= 3; a++)
                    try {
                        t = Math.min(1e4 + 5e3 * a, 3e4);
                        const e = new AbortController(),
                            i = setTimeout(() => e.abort(), t);
                        try {
                            const t = yield fetch(this.url, {
                                signal: e.signal,
                                cache: a > 0 ? 'reload' : 'default',
                                headers: {
                                    Accept: 'audio/*,*/*;q=0.9',
                                    'Cache-Control': a > 0 ? 'no-cache' : 'default',
                                },
                            });
                            if ((clearTimeout(i), !t.ok)) {
                                const e = `HTTP ${t.status}: ${t.statusText}`;
                                throw 404 === t.status
                                    ? new Error(`Track file not found: ${e}`)
                                    : 403 === t.status
                                      ? new Error(`Access denied to track file: ${e}`)
                                      : t.status >= 500
                                        ? new Error(`Server error loading track: ${e}`)
                                        : new Error(`Network error loading track: ${e}`);
                            }
                            const n = t.headers.get('content-type');
                            n &&
                                !n.startsWith('audio/') &&
                                cl.warn(`Unexpected content type for ${this.id}: ${n}`);
                            const o = yield t.arrayBuffer();
                            if (!o || 0 === o.byteLength)
                                throw new Error(
                                    `Empty or invalid audio file received for track ${this.id}`
                                );
                            try {
                                this.audioBuffer = yield this.audioContext.decodeAudioData(o);
                            } catch (r) {
                                throw new Error(
                                    `Audio decode failed for track ${this.id}: ${r.message}. File may be corrupted or in unsupported format.`
                                );
                            }
                            if (!this.audioBuffer || 0 === this.audioBuffer.length)
                                throw new Error(
                                    `Decoded audio buffer is empty for track ${this.id}`
                                );
                            return (
                                !this.metadata.duration &&
                                    this.audioBuffer &&
                                    (this.metadata.duration = this.audioBuffer.duration),
                                void cl.info(
                                    `Successfully loaded track ${this.id} (${this.audioBuffer.duration.toFixed(2)}s, ${this.audioBuffer.numberOfChannels} channels)`
                                )
                            );
                        } catch (n) {
                            throw (clearTimeout(i), n);
                        }
                    } catch (i) {
                        if (((e = i), 'AbortError' === i.name))
                            throw new Error(
                                `Loading timeout for track ${this.id} after ${Math.round(t / 1e3)} seconds`
                            );
                        if (
                            i.message.includes('not found') ||
                            i.message.includes('Access denied') ||
                            i.message.includes('decode failed')
                        )
                            throw i;
                        if (3 === a) break;
                        const r = 1e3 * Math.pow(2, a) + 1e3 * Math.random();
                        (cl.warn(
                            `Loading attempt ${a + 1} failed for track ${this.id}, retrying in ${Math.round(r)}ms:`,
                            { error: i.message }
                        ),
                            yield new Promise((e) => setTimeout(e, r)));
                    }
                if (this.fallbackUrl && !this.usingFallback) {
                    (cl.warn(
                        `Primary URL failed for track ${this.id}, trying fallback: ${this.fallbackUrl}`
                    ),
                        (this.usingFallback = !0));
                    const e = this.url;
                    this.url = this.fallbackUrl;
                    try {
                        return (
                            (this.loadingState = 'loading'),
                            (this.error = null),
                            yield this._performLoad(),
                            void cl.info(`Successfully loaded track ${this.id} using fallback URL`)
                        );
                    } catch (o) {
                        throw (
                            (this.url = e),
                            (this.usingFallback = !1),
                            new Error(
                                `Failed to load music track ${this.id} from both primary (${e}) and fallback (${this.fallbackUrl}) URLs: ${o.message}`
                            )
                        );
                    }
                }
                throw new Error(
                    `Failed to load music track ${this.id} from ${this.url} after 4 attempts: ${e.message}`
                );
            });
        }
        preload() {
            return l(this, null, function* () {
                return this.metadata.preload ? this.load() : Promise.resolve();
            });
        }
        isLoaded() {
            return 'loaded' === this.loadingState;
        }
        isLoading() {
            return 'loading' === this.loadingState;
        }
        hasError() {
            return 'error' === this.loadingState;
        }
        getId() {
            return this.id;
        }
        getName() {
            return this.metadata.name;
        }
        getEnergyLevel() {
            return this.metadata.energyLevel;
        }
        getDuration() {
            return this.metadata.duration;
        }
        shouldLoop() {
            return this.metadata.loop;
        }
        getAudioBuffer() {
            return this.audioBuffer;
        }
        createSource() {
            if (!this.audioContext || !this.audioBuffer) return null;
            try {
                const e = this.audioContext.createBufferSource();
                return ((e.buffer = this.audioBuffer), (e.loop = this.shouldLoop()), e);
            } catch (e) {
                return (
                    cl.warn(`Failed to create audio source for track ${this.id}:`, { error: e }),
                    null
                );
            }
        }
        getLoadingState() {
            return this.loadingState;
        }
        getError() {
            return this.error;
        }
        isUsingFallback() {
            return this.usingFallback;
        }
        getActiveUrl() {
            return this.url;
        }
        getFallbackUrl() {
            return this.fallbackUrl;
        }
        getMetadata() {
            return u(s({}, this.metadata), {
                id: this.id,
                url: this.url,
                fallbackUrl: this.fallbackUrl,
                usingFallback: this.usingFallback,
                loadingState: this.loadingState,
                error: this.error,
            });
        }
        cleanup() {
            ((this.audioBuffer = null),
                (this.audioContext = null),
                (this.loadingState = 'not_loaded'),
                (this.error = null),
                (this.usingFallback = !1));
        }
    },
};
const fl = (null == ll.exports ? {} : ll.exports).default || ll.exports,
    dl = Object.freeze(
        Object.defineProperty({ __proto__: null, default: fl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var hl = { exports: {} };
const { logger: pl } = sl || ul;
hl.exports = {
    MusicSettings: class {
        constructor() {
            ((this.schema = {
                musicVolume: { type: 'number', min: 0, max: 1, default: 0.7 },
                selectedTrack: {
                    type: 'string',
                    enum: ['ambient-space', 'cyber-pulse', 'neon-rush', 'none'],
                    default: 'ambient-space',
                },
                fadeInDuration: { type: 'number', min: 0.1, max: 2, default: 0.5 },
                fadeOutDuration: { type: 'number', min: 0.1, max: 2, default: 0.5 },
                duckingLevel: { type: 'number', min: 0, max: 1, default: 0.3 },
                duckingDuration: { type: 'number', min: 0.1, max: 1, default: 0.2 },
            }),
                (this.settingsVersion = 1),
                (this.settings = {}),
                (this.storageKey = 'lightbikes_music_settings'),
                this.load());
        }
        getMusicVolume() {
            return this.settings.musicVolume;
        }
        setMusicVolume(e) {
            return (
                !!this._validateSetting('musicVolume', e) &&
                ((this.settings.musicVolume = e), this.save(), !0)
            );
        }
        getSelectedTrack() {
            return this.settings.selectedTrack;
        }
        setSelectedTrack(e) {
            return (
                !!this._validateSetting('selectedTrack', e) &&
                ((this.settings.selectedTrack = e), this.save(), !0)
            );
        }
        getFadeInDuration() {
            return this.settings.fadeInDuration;
        }
        setFadeInDuration(e) {
            return (
                !!this._validateSetting('fadeInDuration', e) &&
                ((this.settings.fadeInDuration = e), this.save(), !0)
            );
        }
        getFadeOutDuration() {
            return this.settings.fadeOutDuration;
        }
        setFadeOutDuration(e) {
            return (
                !!this._validateSetting('fadeOutDuration', e) &&
                ((this.settings.fadeOutDuration = e), this.save(), !0)
            );
        }
        getDuckingLevel() {
            return this.settings.duckingLevel;
        }
        setDuckingLevel(e) {
            return (
                !!this._validateSetting('duckingLevel', e) &&
                ((this.settings.duckingLevel = e), this.save(), !0)
            );
        }
        getDuckingDuration() {
            return this.settings.duckingDuration;
        }
        setDuckingDuration(e) {
            return (
                !!this._validateSetting('duckingDuration', e) &&
                ((this.settings.duckingDuration = e), this.save(), !0)
            );
        }
        getAllSettings() {
            return s({}, this.settings);
        }
        updateSettings(e) {
            const t = {};
            for (const [r, n] of Object.entries(e))
                if (this.schema[r]) {
                    if (!this._validateSetting(r, n))
                        return (pl.warn(`Invalid value for music setting ${r}:`, { value: n }), !1);
                    t[r] = n;
                } else pl.warn(`Unknown music setting: ${r}`);
            return (Object.assign(this.settings, t), this.save(), !0);
        }
        save() {
            try {
                const e = { version: this.settingsVersion, settings: this.settings },
                    t = JSON.stringify(e);
                return (localStorage.setItem(this.storageKey, t), !0);
            } catch (e) {
                return (
                    pl.warn('Failed to save music settings to localStorage:', { error: e }),
                    !1
                );
            }
        }
        load() {
            try {
                const e = localStorage.getItem(this.storageKey);
                if (e) {
                    const t = JSON.parse(e);
                    this._migrationOccurred = !1;
                    const r = this._migrateSettings(t);
                    ((this.settings = this._mergeWithDefaults(r)),
                        this._migrationOccurred && this.save());
                } else this.settings = this.getDefaults();
                return !0;
            } catch (e) {
                return (
                    pl.warn('Failed to load music settings from localStorage:', { error: e }),
                    (this.settings = this.getDefaults()),
                    !1
                );
            }
        }
        reset() {
            return ((this.settings = this.getDefaults()), this.save());
        }
        getDefaults() {
            const e = {};
            for (const [t, r] of Object.entries(this.schema)) e[t] = r.default;
            return e;
        }
        validateSettings(e) {
            if (!e || 'object' != typeof e) return !1;
            for (const [t, r] of Object.entries(e))
                if (this.schema[t] && !this._validateSetting(t, r)) return !1;
            return !0;
        }
        getSchema() {
            return JSON.parse(JSON.stringify(this.schema));
        }
        _validateSetting(e, t) {
            const r = this.schema[e];
            if (!r) return !1;
            if (typeof t !== r.type) return !1;
            if ('number' === r.type) {
                if ('number' == typeof r.min && t < r.min) return !1;
                if ('number' == typeof r.max && t > r.max) return !1;
            }
            return !('string' === r.type && r.enum && !r.enum.includes(t));
        }
        _migrateSettings(e) {
            if (!e.version && !e.settings)
                return (
                    pl.info('Migrating legacy music settings format'),
                    (this._migrationOccurred = !0),
                    e
                );
            if (e.version && e.settings) {
                return (e.version, e.settings);
            }
            return e;
        }
        getSettingsVersion() {
            return this.settingsVersion;
        }
        isStorageAvailable() {
            try {
                const e = 'lightbikes_storage_test';
                return (localStorage.setItem(e, 'test'), localStorage.removeItem(e), !0);
            } catch (e) {
                return !1;
            }
        }
        clearStorage() {
            try {
                return (localStorage.removeItem(this.storageKey), !0);
            } catch (e) {
                return (
                    pl.warn('Failed to clear music settings from localStorage:', { error: e }),
                    !1
                );
            }
        }
        _mergeWithDefaults(e) {
            const t = this.getDefaults(),
                r = s({}, t);
            for (const [n, i] of Object.entries(e))
                this.schema[n] && this._validateSetting(n, i)
                    ? (r[n] = i)
                    : this.schema[n] &&
                      pl.warn(`Invalid music setting ${n} loaded from storage, using default:`, {
                          value: i,
                      });
            return r;
        }
    },
};
const yl = (null == hl.exports ? {} : hl.exports).default || hl.exports,
    ml = Object.freeze(
        Object.defineProperty({ __proto__: null, default: yl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var gl = { exports: {} };
const bl = {
        'ambient-space': {
            id: 'ambient-space',
            name: 'Ambient Space',
            url: 'sounds/music/ambient-space.mp3',
            fallbackUrl: 'sounds/engine.mp3',
            energyLevel: 'ambient',
            loop: !0,
            preload: !0,
            description: 'Calm, atmospheric background music for focused gameplay',
        },
        'cyber-pulse': {
            id: 'cyber-pulse',
            name: 'Cyber Pulse',
            url: 'sounds/music/cyber-pulse.mp3',
            fallbackUrl: 'sounds/victory.mp3',
            energyLevel: 'upbeat',
            loop: !0,
            preload: !0,
            description: 'Energetic electronic beats matching the cyberpunk aesthetic',
        },
        'neon-rush': {
            id: 'neon-rush',
            name: 'Neon Rush',
            url: 'sounds/music/neon-rush.mp3',
            fallbackUrl: 'sounds/explosion.mp3',
            energyLevel: 'intense',
            loop: !0,
            preload: !0,
            description: 'High-intensity music for competitive and fast-paced gameplay',
        },
        none: {
            id: 'none',
            name: 'No Music',
            url: null,
            fallbackUrl: null,
            energyLevel: null,
            loop: !1,
            preload: !1,
            description: 'Disable background music',
        },
    },
    vl = {
        defaultVolume: 0.7,
        fadeInDuration: 0.5,
        fadeOutDuration: 0.5,
        duckingLevel: 0.3,
        duckingDuration: 0.2,
        maxRetries: 3,
        loadTimeout: 1e4,
        MAX_CONCURRENT_FADE_OPERATIONS: 4,
        AUDIO_BUFFER_CLEANUP_INTERVAL: 6e4,
    },
    wl = {
        explosion: { duckingLevel: 0.2, duration: 0.3, recoveryDelay: 1e3 },
        victory: { duckingLevel: 0.3, duration: 0.2, recoveryDelay: 2e3 },
        defeat: { duckingLevel: 0.3, duration: 0.2, recoveryDelay: 2e3 },
        collision: { duckingLevel: 0.4, duration: 0.1, recoveryDelay: 500 },
    },
    _l = {
        isValidTrackId: (e) => 'string' == typeof e && bl.hasOwnProperty(e),
        getDuckingConfig: (e) => wl[e] || null,
        getAvailableTrackIds: () => Object.keys(bl),
        getTrackConfig: (e) => bl[e] || null,
        getTrackUrl(e, t = !1) {
            const r = bl[e];
            return r ? (t && r.fallbackUrl ? r.fallbackUrl : r.url) : null;
        },
        hasFallback(e) {
            const t = bl[e];
            return t && null !== t.fallbackUrl;
        },
        getDefaultConfig: () => s({}, vl),
    };
gl.exports = {
    MUSIC_TRACKS: bl,
    ENERGY_LEVELS: { AMBIENT: 'ambient', UPBEAT: 'upbeat', INTENSE: 'intense' },
    PLAYBACK_STATES: {
        STOPPED: 'stopped',
        LOADING: 'loading',
        PLAYING: 'playing',
        PAUSED: 'paused',
        FADING_IN: 'fading_in',
        FADING_OUT: 'fading_out',
        DUCKED: 'ducked',
        ERROR: 'error',
    },
    MUSIC_SYSTEM_CONFIG: vl,
    DUCKING_TRIGGERS: wl,
    ERROR_TYPES: {
        LOADING_FAILED: 'loading_failed',
        NETWORK_ERROR: 'network_error',
        FORMAT_UNSUPPORTED: 'format_unsupported',
        AUTOPLAY_BLOCKED: 'autoplay_blocked',
        CONTEXT_ERROR: 'context_error',
        PLAYBACK_FAILED: 'playback_failed',
        SETTINGS_ERROR: 'settings_error',
        UNKNOWN_ERROR: 'unknown_error',
    },
    AUDIO_MIME_TYPES: { MP3: 'audio/mpeg', OGG: 'audio/ogg', WAV: 'audio/wav', M4A: 'audio/mp4' },
    MusicConfigUtils: _l,
};
const Sl = (null == gl.exports ? {} : gl.exports).default || gl.exports,
    El = Object.freeze(
        Object.defineProperty({ __proto__: null, default: Sl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var kl = { exports: {} };
const { ERROR_TYPES: Ol, MUSIC_SYSTEM_CONFIG: Tl, AUDIO_MIME_TYPES: Ml } = Sl || El,
    { logger: Al } = sl || ul;
kl.exports = {
    MusicErrorHandler: class {
        constructor() {
            ((this.errorLog = []),
                (this.retryAttempts = new Map()),
                (this.networkStatus = 'online'),
                (this.lastNetworkCheck = 0),
                this._setupNetworkMonitoring());
        }
        handleLoadingError(e, t, r, n = 0) {
            return l(this, null, function* () {
                const i = this._analyzeError(e, r);
                this._logError(i, t, n);
                const o = this._determineRecoveryStrategy(i, n);
                switch (o.type) {
                    case 'retry':
                        return yield this._handleRetry(t, r, n, o);
                    case 'format_fallback':
                        return yield this._handleFormatFallback(t, r, o);
                    case 'graceful_degradation':
                        return this._handleGracefulDegradation(t, i, o.reason);
                    case 'user_notification':
                        return this._handleUserNotification(t, i);
                    default:
                        return this._handleFinalFailure(t, i);
                }
            });
        }
        handlePlaybackError(e, t, r = {}) {
            const n = this._analyzeError(e, r.url);
            return (
                (n.operation = t),
                (n.context = r),
                this._logError(n, r.trackId || 'unknown'),
                this._isRecoverablePlaybackError(n)
                    ? this._handleRecoverablePlaybackError(n)
                    : this._handleNonRecoverablePlaybackError(n)
            );
        }
        handleAudioContextError(e, t) {
            const r = this._analyzeError(e);
            return (
                (r.contextState = t ? t.state : 'unknown'),
                this._logError(r, 'audio_context'),
                this._isAutoplayPolicyError(r)
                    ? this._handleAutoplayPolicyError(r)
                    : this._isSuspendedContextError(r)
                      ? this._handleSuspendedContextError(r, t)
                      : this._handleGenericContextError(r)
            );
        }
        getUserFriendlyMessage(e, t) {
            const r = {
                [Ol.LOADING_FAILED]: `Unable to load music track "${e}". Playing without background music.`,
                [Ol.NETWORK_ERROR]:
                    'Network connection issue. Music will be available when connection is restored.',
                [Ol.FORMAT_UNSUPPORTED]: `Audio format not supported for "${e}". Trying alternative format.`,
                [Ol.AUTOPLAY_BLOCKED]: 'Click anywhere to enable background music.',
                [Ol.CONTEXT_ERROR]:
                    'Audio system initialization failed. Some features may be unavailable.',
                [Ol.PLAYBACK_FAILED]: `Playback error for "${e}". Continuing without background music.`,
                [Ol.SETTINGS_ERROR]:
                    'Music settings could not be saved. Changes will be temporary.',
                [Ol.UNKNOWN_ERROR]:
                    'An unexpected audio error occurred. Continuing without background music.',
            };
            return r[t] || r[Ol.UNKNOWN_ERROR];
        }
        shouldAttemptRecovery(e, t) {
            const r = this.retryAttempts.get(e) || 0,
                n = Tl.maxRetries;
            return [Ol.NETWORK_ERROR, Ol.LOADING_FAILED, Ol.CONTEXT_ERROR].includes(t) && r < n;
        }
        getErrorStatistics() {
            const e = {
                totalErrors: this.errorLog.length,
                errorsByType: {},
                errorsByTrack: {},
                recentErrors: this.errorLog.slice(-10),
                networkStatus: this.networkStatus,
                lastNetworkCheck: this.lastNetworkCheck,
            };
            return (
                this.errorLog.forEach((t) => {
                    ((e.errorsByType[t.type] = (e.errorsByType[t.type] || 0) + 1),
                        (e.errorsByTrack[t.trackId] = (e.errorsByTrack[t.trackId] || 0) + 1));
                }),
                e
            );
        }
        clearErrorLog() {
            ((this.errorLog = []), this.retryAttempts.clear());
        }
        _analyzeError(e, t = null) {
            const r = {
                message: e.message,
                name: e.name,
                stack: e.stack,
                url: t,
                timestamp: Date.now(),
                type: Ol.UNKNOWN_ERROR,
            };
            return (
                this._isNetworkError(e)
                    ? (r.type = Ol.NETWORK_ERROR)
                    : this._isLoadingError(e)
                      ? (r.type = Ol.LOADING_FAILED)
                      : this._isFormatError(e)
                        ? (r.type = Ol.FORMAT_UNSUPPORTED)
                        : this._isAutoplayError(e)
                          ? (r.type = Ol.AUTOPLAY_BLOCKED)
                          : this._isContextError(e)
                            ? (r.type = Ol.CONTEXT_ERROR)
                            : this._isPlaybackError(e) && (r.type = Ol.PLAYBACK_FAILED),
                r
            );
        }
        _determineRecoveryStrategy(e, t) {
            const r = Tl.maxRetries;
            if (e.type === Ol.NETWORK_ERROR && t < r)
                return {
                    type: 'retry',
                    delay: Math.min(1e3 * Math.pow(2, t), 1e4),
                    reason: 'Network error - retrying with backoff',
                };
            if (e.type === Ol.FORMAT_UNSUPPORTED)
                return { type: 'format_fallback', reason: 'Unsupported format - trying fallback' };
            if (e.type === Ol.LOADING_FAILED) {
                if (e.message.includes('HTTP 404') || e.message.includes('HTTP 403'))
                    return {
                        type: 'graceful_degradation',
                        reason: 'Permanent loading error - file not found or access denied',
                    };
                if (t < r)
                    return { type: 'retry', delay: 2e3, reason: 'Loading failed - retrying once' };
            }
            return e.type === Ol.AUTOPLAY_BLOCKED
                ? {
                      type: 'user_notification',
                      reason: 'Autoplay blocked - user interaction required',
                  }
                : e.type === Ol.CONTEXT_ERROR && t < 1
                  ? { type: 'retry', delay: 1e3, reason: 'Context error - attempting recovery' }
                  : {
                        type: 'graceful_degradation',
                        reason: 'Maximum retries exceeded or non-recoverable error',
                    };
        }
        _handleRetry(e, t, r, n) {
            return l(this, null, function* () {
                return (
                    this.retryAttempts.set(e, r + 1),
                    n.delay > 0 && (yield new Promise((e) => setTimeout(e, n.delay))),
                    { action: 'retry', url: t, attempt: r + 1, delay: n.delay, reason: n.reason }
                );
            });
        }
        _handleFormatFallback(e, t, r) {
            return l(this, null, function* () {
                const n = this._generateFallbackUrl(t);
                return n && n !== t
                    ? { action: 'fallback', url: n, originalUrl: t, reason: r.reason }
                    : this._handleGracefulDegradation(e, { type: Ol.FORMAT_UNSUPPORTED });
            });
        }
        _handleGracefulDegradation(e, t, r = null) {
            return {
                action: 'degrade',
                trackId: e,
                message: this.getUserFriendlyMessage(e, t.type),
                continueWithoutMusic: !0,
                reason: r || 'Graceful degradation - continue without music',
            };
        }
        _handleUserNotification(e, t) {
            return {
                action: 'notify_user',
                trackId: e,
                message: this.getUserFriendlyMessage(e, t.type),
                requiresInteraction: !0,
                reason: 'User interaction required for audio playback',
            };
        }
        _handleFinalFailure(e, t) {
            return {
                action: 'fail',
                trackId: e,
                message: this.getUserFriendlyMessage(e, t.type),
                permanent: !0,
                reason: 'All recovery attempts failed',
            };
        }
        _generateFallbackUrl(e) {
            if (!e) return null;
            const t = { '.mp3': '.ogg', '.ogg': '.mp3', '.wav': '.mp3', '.m4a': '.mp3' };
            for (const [r, n] of Object.entries(t)) if (e.endsWith(r)) return e.replace(r, n);
            return null;
        }
        _logError(e, t, r = 0) {
            const n = u(s({}, e), { trackId: t, attempt: r, timestamp: Date.now() });
            (this.errorLog.push(n),
                this.errorLog.length > 100 && (this.errorLog = this.errorLog.slice(-50)),
                Al.warn(`Music system error [${e.type}] for track ${t}:`, { error: e.message }));
        }
        _setupNetworkMonitoring() {
            'undefined' != typeof navigator &&
                'onLine' in navigator &&
                ((this.networkStatus = navigator.onLine ? 'online' : 'offline'),
                window.addEventListener('online', () => {
                    ((this.networkStatus = 'online'), (this.lastNetworkCheck = Date.now()));
                }),
                window.addEventListener('offline', () => {
                    ((this.networkStatus = 'offline'), (this.lastNetworkCheck = Date.now()));
                }));
        }
        _isNetworkError(e) {
            return (
                [
                    'fetch',
                    'network',
                    'timeout',
                    'connection',
                    'offline',
                    'ERR_NETWORK',
                    'ERR_INTERNET_DISCONNECTED',
                ].some((t) => e.message.toLowerCase().includes(t.toLowerCase())) ||
                'offline' === this.networkStatus
            );
        }
        _isLoadingError(e) {
            return [
                'loading',
                'load',
                'HTTP 404',
                'HTTP 403',
                'HTTP 500',
                'not found',
                'failed to fetch',
            ].some((t) => e.message.toLowerCase().includes(t.toLowerCase()));
        }
        _isFormatError(e) {
            return [
                'decode',
                'format',
                'codec',
                'unsupported',
                'invalid audio',
                'decodeAudioData',
            ].some((t) => e.message.toLowerCase().includes(t.toLowerCase()));
        }
        _isAutoplayError(e) {
            return ['autoplay', 'user interaction', 'gesture', 'gesture', 'not allowed'].some((t) =>
                e.message.toLowerCase().includes(t.toLowerCase())
            );
        }
        _isContextError(e) {
            return [
                'audiocontext',
                'audio context',
                'webaudio',
                'createGain',
                'createBufferSource',
            ].some((t) => e.message.toLowerCase().includes(t.toLowerCase()));
        }
        _isPlaybackError(e) {
            return ['playback', 'play', 'start', 'stop', 'source'].some((t) =>
                e.message.toLowerCase().includes(t.toLowerCase())
            );
        }
        _isRecoverablePlaybackError(e) {
            return [Ol.NETWORK_ERROR, Ol.CONTEXT_ERROR, Ol.AUTOPLAY_BLOCKED].includes(e.type);
        }
        _handleRecoverablePlaybackError(e) {
            return {
                action: 'pause_and_retry',
                canRetry: !0,
                message: 'Temporary playback issue - will retry automatically',
                retryDelay: 2e3,
            };
        }
        _handleNonRecoverablePlaybackError(e) {
            return {
                action: 'stop_playback',
                canRetry: !1,
                message: this.getUserFriendlyMessage('current', e.type),
                permanent: !0,
            };
        }
        _isAutoplayPolicyError(e) {
            return (
                e.type === Ol.AUTOPLAY_BLOCKED ||
                ('suspended' === e.contextState && e.message.toLowerCase().includes('autoplay'))
            );
        }
        _isSuspendedContextError(e) {
            return 'suspended' === e.contextState && !e.message.toLowerCase().includes('autoplay');
        }
        _handleAutoplayPolicyError(e) {
            return {
                action: 'require_interaction',
                message: this.getUserFriendlyMessage('music', Ol.AUTOPLAY_BLOCKED),
                requiresUserGesture: !0,
            };
        }
        _handleSuspendedContextError(e, t) {
            return {
                action: 'resume_context',
                audioContext: t,
                message: 'Resuming audio context...',
                canAutoRecover: !0,
            };
        }
        _handleGenericContextError(e) {
            return {
                action: 'reinitialize_audio',
                message: this.getUserFriendlyMessage('audio', Ol.CONTEXT_ERROR),
                requiresReinitialization: !0,
            };
        }
    },
};
const xl = (null == kl.exports ? {} : kl.exports).default || kl.exports,
    Pl = Object.freeze(
        Object.defineProperty({ __proto__: null, default: xl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var Rl = { exports: {} };
const { MUSIC_SYSTEM_CONFIG: jl } = Sl || El,
    { logger: Cl } = sl || ul;
Rl.exports = {
    MusicPerformanceMonitor: class {
        constructor() {
            ((this.metrics = {
                memory: {
                    audioBuffers: 0,
                    totalAllocated: 0,
                    peakUsage: 0,
                    lastCleanup: Date.now(),
                },
                loading: {
                    totalTracks: 0,
                    loadedTracks: 0,
                    failedTracks: 0,
                    averageLoadTime: 0,
                    loadTimes: [],
                },
                playback: {
                    totalPlayTime: 0,
                    fadeOperations: 0,
                    duckingOperations: 0,
                    contextSwitches: 0,
                    lastPerformanceCheck: Date.now(),
                },
                frameRate: { baseline: 0, current: 0, impactDetected: !1, measurements: [] },
            }),
                (this.performanceObserver = null),
                (this.memoryCleanupInterval = null),
                (this.frameRateMonitor = null),
                this._initializeMonitoring());
        }
        startMonitoring() {
            (this._startMemoryMonitoring(),
                this._startFrameRateMonitoring(),
                this._startPerformanceObserver(),
                Cl.info('Music performance monitoring started'));
        }
        stopMonitoring() {
            (this._stopMemoryMonitoring(),
                this._stopFrameRateMonitoring(),
                this._stopPerformanceObserver(),
                Cl.info('Music performance monitoring stopped'));
        }
        recordLoadingStart(e, t = 0) {
            const r = { trackId: e, startTime: performance.now(), fileSize: t, completed: !1 };
            (this.metrics.loading.loadTimes.push(r), this.metrics.loading.totalTracks++);
        }
        recordLoadingComplete(e, t, r = null) {
            const n = this.metrics.loading.loadTimes.find((t) => t.trackId === e && !t.completed);
            n &&
                ((n.completed = !0),
                (n.endTime = performance.now()),
                (n.duration = n.endTime - n.startTime),
                (n.success = t),
                t
                    ? (this.metrics.loading.loadedTracks++,
                      r && this._recordAudioBufferMemory(e, r),
                      this._updateAverageLoadTime())
                    : this.metrics.loading.failedTracks++);
        }
        recordFadeOperation(e, t) {
            this.metrics.playback.fadeOperations++;
            const r = this.metrics.playback.fadeOperations;
            r > jl.MAX_CONCURRENT_FADE_OPERATIONS &&
                Cl.warn('High number of concurrent fade operations detected:', { count: r });
        }
        recordDuckingOperation(e, t) {
            this.metrics.playback.duckingOperations++;
        }
        recordContextSwitch() {
            (this.metrics.playback.contextSwitches++,
                this.metrics.playback.contextSwitches > 5 &&
                    Cl.warn('Frequent audio context switches detected - may impact performance'));
        }
        getMetrics() {
            return u(s({}, this.metrics), {
                timestamp: Date.now(),
                recommendations: this._generateRecommendations(),
            });
        }
        getMemoryUsage() {
            return {
                audioBuffers: this.metrics.memory.audioBuffers,
                totalAllocated: this.metrics.memory.totalAllocated,
                peakUsage: this.metrics.memory.peakUsage,
                lastCleanup: this.metrics.memory.lastCleanup,
                recommendedCleanup: this._shouldPerformCleanup(),
            };
        }
        getLoadingPerformance() {
            const e =
                this.metrics.loading.totalTracks > 0
                    ? (this.metrics.loading.loadedTracks / this.metrics.loading.totalTracks) * 100
                    : 0;
            return {
                totalTracks: this.metrics.loading.totalTracks,
                loadedTracks: this.metrics.loading.loadedTracks,
                failedTracks: this.metrics.loading.failedTracks,
                successRate: e,
                averageLoadTime: this.metrics.loading.averageLoadTime,
                slowestLoad: this._getSlowestLoadTime(),
                fastestLoad: this._getFastestLoadTime(),
            };
        }
        getFrameRateImpact() {
            return {
                baseline: this.metrics.frameRate.baseline,
                current: this.metrics.frameRate.current,
                impactDetected: this.metrics.frameRate.impactDetected,
                impactPercentage: this._calculateFrameRateImpact(),
                recommendation: this._getFrameRateRecommendation(),
            };
        }
        performMemoryCleanup() {
            const e = this.metrics.memory.totalAllocated;
            this.metrics.memory.lastCleanup = Date.now();
            const t = this.metrics.memory.totalAllocated;
            return { freedMemory: e - t, beforeCleanup: e, afterCleanup: t, timestamp: Date.now() };
        }
        needsOptimization() {
            return this._generateRecommendations().length > 0;
        }
        getOptimizationRecommendations() {
            return this._generateRecommendations();
        }
        resetMetrics() {
            this.metrics = {
                memory: {
                    audioBuffers: 0,
                    totalAllocated: 0,
                    peakUsage: 0,
                    lastCleanup: Date.now(),
                },
                loading: {
                    totalTracks: 0,
                    loadedTracks: 0,
                    failedTracks: 0,
                    averageLoadTime: 0,
                    loadTimes: [],
                },
                playback: {
                    totalPlayTime: 0,
                    fadeOperations: 0,
                    duckingOperations: 0,
                    contextSwitches: 0,
                    lastPerformanceCheck: Date.now(),
                },
                frameRate: { baseline: 0, current: 0, impactDetected: !1, measurements: [] },
            };
        }
        _initializeMonitoring() {
            this.memoryCleanupInterval = setInterval(() => {
                this._shouldPerformCleanup() &&
                    Cl.info('Memory cleanup recommended for music system');
            }, jl.AUDIO_BUFFER_CLEANUP_INTERVAL);
        }
        _startMemoryMonitoring() {
            'memory' in performance &&
                (this._memoryMonitorInterval = setInterval(() => {
                    this._checkMemoryUsage();
                }, 5e3));
        }
        _stopMemoryMonitoring() {
            this._memoryMonitorInterval &&
                (clearInterval(this._memoryMonitorInterval), (this._memoryMonitorInterval = null));
        }
        _startFrameRateMonitoring() {
            if ('requestAnimationFrame' in window) {
                let e = 0,
                    t = performance.now();
                const r = () => {
                    e++;
                    const n = performance.now();
                    if (n - t >= 1e3) {
                        const r = Math.round((1e3 * e) / (n - t));
                        (this._recordFrameRate(r), (e = 0), (t = n));
                    }
                    this.frameRateMonitor = requestAnimationFrame(r);
                };
                this.frameRateMonitor = requestAnimationFrame(r);
            }
        }
        _stopFrameRateMonitoring() {
            this.frameRateMonitor &&
                (cancelAnimationFrame(this.frameRateMonitor), (this.frameRateMonitor = null));
        }
        _startPerformanceObserver() {
            if ('PerformanceObserver' in window)
                try {
                    ((this.performanceObserver = new PerformanceObserver((e) => {
                        e.getEntries().forEach((e) => {
                            (e.name.includes('music') || e.name.includes('audio')) &&
                                this._recordPerformanceEntry(e);
                        });
                    })),
                        this.performanceObserver.observe({
                            entryTypes: ['measure', 'navigation'],
                        }));
                } catch (e) {
                    Cl.warn('Performance observer not available:', { error: e });
                }
        }
        _stopPerformanceObserver() {
            this.performanceObserver &&
                (this.performanceObserver.disconnect(), (this.performanceObserver = null));
        }
        _recordAudioBufferMemory(e, t) {
            if (!t) return;
            const r = t.numberOfChannels * t.length * 4;
            (this.metrics.memory.audioBuffers++,
                (this.metrics.memory.totalAllocated += r),
                this.metrics.memory.totalAllocated > this.metrics.memory.peakUsage &&
                    (this.metrics.memory.peakUsage = this.metrics.memory.totalAllocated));
        }
        _updateAverageLoadTime() {
            const e = this.metrics.loading.loadTimes.filter((e) => e.completed && e.success);
            if (e.length > 0) {
                const t = e.reduce((e, t) => e + t.duration, 0);
                this.metrics.loading.averageLoadTime = t / e.length;
            }
        }
        _getSlowestLoadTime() {
            const e = this.metrics.loading.loadTimes.filter((e) => e.completed && e.success);
            return e.length > 0 ? Math.max(...e.map((e) => e.duration)) : 0;
        }
        _getFastestLoadTime() {
            const e = this.metrics.loading.loadTimes.filter((e) => e.completed && e.success);
            return e.length > 0 ? Math.min(...e.map((e) => e.duration)) : 0;
        }
        _recordFrameRate(e) {
            ((this.metrics.frameRate.current = e),
                this.metrics.frameRate.measurements.push({ fps: e, timestamp: Date.now() }),
                this.metrics.frameRate.measurements.length > 60 &&
                    (this.metrics.frameRate.measurements =
                        this.metrics.frameRate.measurements.slice(-30)),
                0 === this.metrics.frameRate.baseline && (this.metrics.frameRate.baseline = e));
            const t = this._calculateFrameRateImpact();
            this.metrics.frameRate.impactDetected = t > 10;
        }
        _calculateFrameRateImpact() {
            if (0 === this.metrics.frameRate.baseline) return 0;
            const e =
                ((this.metrics.frameRate.baseline - this.metrics.frameRate.current) /
                    this.metrics.frameRate.baseline) *
                100;
            return Math.max(0, e);
        }
        _getFrameRateRecommendation() {
            const e = this._calculateFrameRateImpact();
            return e > 20
                ? 'Significant frame rate impact detected. Consider reducing audio quality or disabling music.'
                : e > 10
                  ? 'Moderate frame rate impact detected. Monitor performance closely.'
                  : 'No significant frame rate impact detected.';
        }
        _shouldPerformCleanup() {
            return (
                Date.now() - this.metrics.memory.lastCleanup > jl.AUDIO_BUFFER_CLEANUP_INTERVAL ||
                this.metrics.memory.totalAllocated > 52428800
            );
        }
        _checkMemoryUsage() {
            if ('memory' in performance) {
                const e = performance.memory;
                e.usedJSHeapSize > 0.8 * e.jsHeapSizeLimit &&
                    Cl.warn('High memory usage detected - consider cleaning up audio buffers');
            }
        }
        _recordPerformanceEntry(e) {
            e.duration > 16 &&
                Cl.info(`Long-running music operation detected: ${e.name} (${e.duration}ms)`);
        }
        _generateRecommendations() {
            const e = [];
            (this._shouldPerformCleanup() &&
                e.push({
                    type: 'memory',
                    priority: 'medium',
                    message: 'Audio buffer cleanup recommended to free memory',
                    action: 'cleanup_buffers',
                }),
                this.metrics.loading.averageLoadTime > 5e3 &&
                    e.push({
                        type: 'loading',
                        priority: 'high',
                        message:
                            'Slow audio loading detected. Consider reducing file sizes or using compression',
                        action: 'optimize_files',
                    }),
                this.metrics.frameRate.impactDetected &&
                    e.push({
                        type: 'performance',
                        priority: 'high',
                        message:
                            'Frame rate impact detected. Consider reducing audio processing complexity',
                        action: 'reduce_complexity',
                    }),
                this.metrics.playback.contextSwitches > 3 &&
                    e.push({
                        type: 'stability',
                        priority: 'medium',
                        message:
                            'Frequent audio context switches detected. Check for initialization issues',
                        action: 'fix_context_handling',
                    }));
            return (
                (this.metrics.loading.totalTracks > 0
                    ? (this.metrics.loading.failedTracks / this.metrics.loading.totalTracks) * 100
                    : 0) > 20 &&
                    e.push({
                        type: 'reliability',
                        priority: 'high',
                        message:
                            'High audio loading failure rate. Check network connectivity and file availability',
                        action: 'improve_reliability',
                    }),
                this.metrics.playback.fadeOperations > 50 &&
                    e.push({
                        type: 'performance',
                        priority: 'medium',
                        message:
                            'High number of fade operations detected. Consider reducing audio transitions',
                        action: 'reduce_transitions',
                    }),
                e
            );
        }
        cleanup() {
            (this.stopMonitoring(),
                this.memoryCleanupInterval &&
                    (clearInterval(this.memoryCleanupInterval),
                    (this.memoryCleanupInterval = null)));
        }
    },
};
const Ll = (null == Rl.exports ? {} : Rl.exports).default || Rl.exports,
    Il = Object.freeze(
        Object.defineProperty({ __proto__: null, default: Ll }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var Dl = { exports: {} };
const { MUSIC_SYSTEM_CONFIG: Nl } = Sl || El,
    { logger: Fl } = sl || ul;
Dl.exports = {
    MusicBufferManager: class {
        constructor(e = null) {
            ((this.performanceMonitor = e),
                (this.buffers = new Map()),
                (this.loadingQueue = []),
                (this.cleanupInterval = null),
                (this.memoryThreshold = 52428800),
                (this.lastAccessTimes = new Map()),
                (this.preloadStrategy = 'selective'),
                this._startCleanupInterval());
        }
        registerBuffer(e, t, r = {}) {
            if (!t) return;
            const n = {
                buffer: t,
                size: this._calculateBufferSize(t),
                registeredAt: Date.now(),
                lastAccessed: Date.now(),
                accessCount: 0,
                metadata: s(
                    {
                        duration: t.duration,
                        channels: t.numberOfChannels,
                        sampleRate: t.sampleRate,
                    },
                    r
                ),
            };
            (this.buffers.set(e, n),
                this.lastAccessTimes.set(e, Date.now()),
                this.performanceMonitor && this.performanceMonitor.recordLoadingComplete(e, !0, t),
                this._checkMemoryUsage());
        }
        getBuffer(e) {
            const t = this.buffers.get(e);
            return t
                ? ((t.lastAccessed = Date.now()),
                  t.accessCount++,
                  this.lastAccessTimes.set(e, Date.now()),
                  t.buffer)
                : null;
        }
        removeBuffer(e) {
            const t = this.buffers.delete(e);
            return (
                this.lastAccessTimes.delete(e),
                t && Fl.info(`Removed audio buffer for track: ${e}`),
                t
            );
        }
        hasBuffer(e) {
            return this.buffers.has(e);
        }
        getBufferInfo(e) {
            const t = this.buffers.get(e);
            return t
                ? {
                      size: t.size,
                      registeredAt: t.registeredAt,
                      lastAccessed: t.lastAccessed,
                      accessCount: t.accessCount,
                      metadata: t.metadata,
                  }
                : null;
        }
        getMemoryUsage() {
            let e = 0,
                t = 0;
            const r = [];
            for (const n of this.buffers.values()) ((e += n.size), t++, r.push(n.size));
            return {
                totalSize: e,
                bufferCount: t,
                averageSize: t > 0 ? e / t : 0,
                largestBuffer: r.length > 0 ? Math.max(...r) : 0,
                smallestBuffer: r.length > 0 ? Math.min(...r) : 0,
                memoryThreshold: this.memoryThreshold,
                utilizationPercentage: (e / this.memoryThreshold) * 100,
            };
        }
        performCleanup(e = {}) {
            const { maxAge: t = 18e5, minAccessCount: r = 1, forceCleanup: n = !1 } = e,
                i = this.getMemoryUsage(),
                o = [],
                a = Date.now();
            for (const [l, c] of this.buffers.entries()) {
                const e = a - c.lastAccessed;
                (n ||
                    (e > t && c.accessCount >= r) ||
                    (i.totalSize > this.memoryThreshold && e > t / 2)) &&
                    (o.push({ trackId: l, size: c.size, age: e, accessCount: c.accessCount }),
                    this.removeBuffer(l));
            }
            const s = this.getMemoryUsage(),
                u = i.totalSize - s.totalSize;
            return (
                o.length > 0 &&
                    Fl.info(
                        `Audio buffer cleanup: freed ${this._formatBytes(u)} from ${o.length} buffers`
                    ),
                {
                    freedMemory: u,
                    removedBuffers: o,
                    beforeCleanup: i,
                    afterCleanup: s,
                    timestamp: a,
                }
            );
        }
        setMemoryThreshold(e) {
            ((this.memoryThreshold = Math.max(e, 10485760)),
                Fl.info(
                    `Audio buffer memory threshold set to ${this._formatBytes(this.memoryThreshold)}`
                ));
        }
        setPreloadStrategy(e) {
            const t = ['all', 'selective', 'on-demand'];
            t.includes(e)
                ? ((this.preloadStrategy = e),
                  Fl.info(`Audio buffer preload strategy set to: ${e}`))
                : Fl.warn(`Invalid preload strategy: ${e}. Valid options: ${t.join(', ')}`);
        }
        getRecommendedPreloadStrategy() {
            if ('memory' in performance) {
                const e = performance.memory,
                    t = e.jsHeapSizeLimit - e.usedJSHeapSize;
                return t < 52428800 ? 'on-demand' : t < 104857600 ? 'selective' : 'all';
            }
            if ('connection' in navigator) {
                const e = navigator.connection;
                if ('slow-2g' === e.effectiveType || '2g' === e.effectiveType) return 'on-demand';
                if ('3g' === e.effectiveType) return 'selective';
            }
            return 'selective';
        }
        optimizeLoadingStrategy() {
            const e = this.getMemoryUsage(),
                t = this.getRecommendedPreloadStrategy(),
                r = [];
            if (
                (e.utilizationPercentage > 80 &&
                    (this.performCleanup({ forceCleanup: !1 }),
                    r.push('Performed memory cleanup due to high utilization')),
                this.preloadStrategy !== t)
            ) {
                const e = this.preloadStrategy;
                (this.setPreloadStrategy(t), r.push(`Changed preload strategy from ${e} to ${t}`));
            }
            if ('memory' in performance) {
                const e = performance.memory,
                    t = Math.min(0.1 * e.jsHeapSizeLimit, 104857600);
                Math.abs(this.memoryThreshold - t) > 10485760 &&
                    (this.setMemoryThreshold(t),
                    r.push(`Adjusted memory threshold to ${this._formatBytes(t)}`));
            }
            return {
                optimizations: r,
                currentStrategy: this.preloadStrategy,
                memoryUsage: e,
                timestamp: Date.now(),
            };
        }
        getStatistics() {
            const e = {
                    totalBuffers: this.buffers.size,
                    memoryUsage: this.getMemoryUsage(),
                    accessPatterns: {},
                    ageDistribution: {},
                    preloadStrategy: this.preloadStrategy,
                },
                t = [],
                r = [],
                n = Date.now();
            for (const i of this.buffers.values())
                (t.push(i.accessCount), r.push(n - i.registeredAt));
            return (
                t.length > 0 &&
                    (e.accessPatterns = {
                        average: t.reduce((e, t) => e + t, 0) / t.length,
                        max: Math.max(...t),
                        min: Math.min(...t),
                    }),
                r.length > 0 &&
                    (e.ageDistribution = {
                        averageAge: r.reduce((e, t) => e + t, 0) / r.length,
                        oldestBuffer: Math.max(...r),
                        newestBuffer: Math.min(...r),
                    }),
                e
            );
        }
        _calculateBufferSize(e) {
            return e.numberOfChannels * e.length * 4;
        }
        _checkMemoryUsage() {
            const e = this.getMemoryUsage();
            e.totalSize > this.memoryThreshold &&
                (Fl.warn(
                    `Audio buffer memory usage (${this._formatBytes(e.totalSize)}) exceeds threshold (${this._formatBytes(this.memoryThreshold)})`
                ),
                this.performCleanup({ maxAge: 9e5, forceCleanup: !1 }));
        }
        _startCleanupInterval() {
            this.cleanupInterval = setInterval(() => {
                this.performCleanup();
            }, Nl.AUDIO_BUFFER_CLEANUP_INTERVAL);
        }
        _stopCleanupInterval() {
            this.cleanupInterval &&
                (clearInterval(this.cleanupInterval), (this.cleanupInterval = null));
        }
        _formatBytes(e) {
            if (0 === e) return '0 B';
            const t = Math.floor(Math.log(e) / Math.log(1024));
            return (
                parseFloat((e / Math.pow(1024, t)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][t]
            );
        }
        cleanup() {
            this._stopCleanupInterval();
            const e = this.buffers.size;
            (this.buffers.clear(),
                this.lastAccessTimes.clear(),
                (this.loadingQueue = []),
                Fl.info(`Audio buffer manager cleanup: removed ${e} buffers`));
        }
    },
};
const Bl = (null == Dl.exports ? {} : Dl.exports).default || Dl.exports,
    Ul = Object.freeze(
        Object.defineProperty({ __proto__: null, default: Bl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var zl = { exports: {} };
const { MUSIC_SYSTEM_CONFIG: Gl } = Sl || El,
    { logger: $l } = sl || ul;
zl.exports = {
    MusicLoadingOptimizer: class {
        constructor(e = null) {
            ((this.performanceMonitor = e),
                (this.loadingHistory = []),
                (this.networkConditions = {
                    effectiveType: 'unknown',
                    downlink: 0,
                    rtt: 0,
                    saveData: !1,
                }),
                (this.deviceCapabilities = {
                    memory: 'unknown',
                    cores: navigator.hardwareConcurrency || 4,
                    isMobile: this._detectMobile(),
                }),
                this._initializeNetworkMonitoring(),
                this._detectDeviceCapabilities());
        }
        optimizeLoadingStrategy(e, t = {}) {
            const {
                    priorityTrack: r = null,
                    maxConcurrentLoads: n = this._getOptimalConcurrency(),
                    respectDataSaver: i = !0,
                    minimizeStartupDelay: o = !0,
                } = t,
                a = {
                    immediate: [],
                    background: [],
                    onDemand: [],
                    deferred: [],
                    loadingOrder: [],
                    estimatedTime: 0,
                    concurrency: n,
                };
            for (const s of e) {
                a[this._categorizeTrack(s, r, i)].push(s);
            }
            return (
                (a.immediate = this._optimizeLoadingOrder(a.immediate, 'immediate')),
                (a.background = this._optimizeLoadingOrder(a.background, 'background')),
                (a.onDemand = this._optimizeLoadingOrder(a.onDemand, 'onDemand')),
                (a.deferred = this._optimizeLoadingOrder(a.deferred, 'deferred')),
                (a.loadingOrder = [...a.immediate, ...a.background.slice(0, n), ...a.deferred]),
                (a.estimatedTime = this._estimateLoadingTime(a)),
                (a.recommendations = this._generateLoadingRecommendations(a)),
                a
            );
        }
        progressiveLoad(e, t = null, r = null) {
            return l(this, null, function* () {
                const n = this.optimizeLoadingStrategy(e),
                    i = { loaded: [], failed: [], totalTime: 0, phases: {} },
                    o = performance.now();
                try {
                    if (n.immediate.length > 0) {
                        const e = performance.now(),
                            o = yield this._loadTracksSequentially(n.immediate, t, r);
                        ((i.phases.immediate = {
                            duration: performance.now() - e,
                            loaded: o.loaded,
                            failed: o.failed,
                        }),
                            i.loaded.push(...o.loaded),
                            i.failed.push(...o.failed));
                    }
                    if (n.background.length > 0) {
                        const e = performance.now();
                        this._loadTracksConcurrently(n.background, n.concurrency, t, r).then(
                            (t) => {
                                ((i.phases.background = {
                                    duration: performance.now() - e,
                                    loaded: t.loaded,
                                    failed: t.failed,
                                }),
                                    i.loaded.push(...t.loaded),
                                    i.failed.push(...t.failed));
                            }
                        );
                    }
                    n.deferred.length > 0 &&
                        setTimeout(
                            () =>
                                l(this, null, function* () {
                                    const e = performance.now(),
                                        o = yield this._loadTracksConcurrently(
                                            n.deferred,
                                            Math.max(1, Math.floor(n.concurrency / 2)),
                                            t,
                                            r
                                        );
                                    ((i.phases.deferred = {
                                        duration: performance.now() - e,
                                        loaded: o.loaded,
                                        failed: o.failed,
                                    }),
                                        i.loaded.push(...o.loaded),
                                        i.failed.push(...o.failed));
                                }),
                            2e3
                        );
                } catch (a) {
                    $l.error('Progressive loading error:', { error: a });
                }
                return ((i.totalTime = performance.now() - o), i);
            });
        }
        adaptStrategy(e) {
            const t = [],
                r = s({}, e);
            (('slow-2g' !== this.networkConditions.effectiveType &&
                '2g' !== this.networkConditions.effectiveType) ||
                (r.onDemand.push(...r.background),
                (r.background = []),
                t.push('Moved background tracks to on-demand due to slow network')),
                this.networkConditions.saveData &&
                    (r.onDemand.push(...r.background, ...r.deferred),
                    (r.background = []),
                    (r.deferred = []),
                    t.push('Enabled on-demand loading due to data saver mode')),
                'low' === this.deviceCapabilities.memory &&
                    ((r.concurrency = Math.max(1, Math.floor(r.concurrency / 2))),
                    t.push('Reduced concurrency due to low memory')));
            return (
                this._getRecentFailures().length > 2 &&
                    ((r.concurrency = Math.max(1, r.concurrency - 1)),
                    t.push('Reduced concurrency due to recent loading failures')),
                (r.adaptations = t),
                r
            );
        }
        _getOptimalConcurrency() {
            let e = 3;
            return (
                '4g' === this.networkConditions.effectiveType
                    ? (e = 4)
                    : '3g' === this.networkConditions.effectiveType
                      ? (e = 2)
                      : ('slow-2g' !== this.networkConditions.effectiveType &&
                            '2g' !== this.networkConditions.effectiveType) ||
                        (e = 1),
                this.deviceCapabilities.cores >= 8
                    ? (e += 1)
                    : this.deviceCapabilities.cores <= 2 && (e = Math.max(1, e - 1)),
                'low' === this.deviceCapabilities.memory && (e = Math.max(1, Math.floor(e / 2))),
                Math.min(e, 6)
            );
        }
        _categorizeTrack(e, t, r) {
            return e.id === t
                ? 'immediate'
                : r && this.networkConditions.saveData
                  ? 'onDemand'
                  : (e.estimatedSize && e.estimatedSize < 1048576) ||
                      'ambient' === e.energyLevel ||
                      !0 === e.preload
                    ? 'background'
                    : 'slow-2g' === this.networkConditions.effectiveType ||
                        '2g' === this.networkConditions.effectiveType
                      ? 'onDemand'
                      : 'deferred';
        }
        _optimizeLoadingOrder(e, t) {
            return e.length <= 1
                ? e
                : e.sort((e, t) => {
                      let r = 0,
                          n = 0;
                      (e.estimatedSize &&
                          t.estimatedSize &&
                          (r += (t.estimatedSize - e.estimatedSize) / 1e3),
                          e.preload && (r += 10),
                          t.preload && (n += 10),
                          'ambient' === e.energyLevel && (r += 5),
                          'ambient' === t.energyLevel && (n += 5));
                      const i = this._getTrackLoadingHistory(e.id),
                          o = this._getTrackLoadingHistory(t.id);
                      return (
                          i.successRate > o.successRate && (r += 3),
                          o.successRate > i.successRate && (n += 3),
                          n - r
                      );
                  });
        }
        _loadTracksSequentially(e, t, r) {
            return l(this, null, function* () {
                const n = { loaded: [], failed: [] };
                for (let o = 0; o < e.length; o++) {
                    const a = e[o],
                        s = performance.now();
                    try {
                        (this.performanceMonitor &&
                            this.performanceMonitor.recordLoadingStart(a.id, a.estimatedSize),
                            yield this._simulateTrackLoading(a));
                        const i = performance.now() - s;
                        (this._recordLoadingResult(a.id, !0, i),
                            n.loaded.push(a.id),
                            r && r(a.id, !0, i),
                            t && t((o + 1) / e.length, a.id));
                    } catch (i) {
                        const e = performance.now() - s;
                        (this._recordLoadingResult(a.id, !1, e, i.message),
                            n.failed.push({ trackId: a.id, error: i.message }),
                            r && r(a.id, !1, e, i));
                    }
                }
                return n;
            });
        }
        _loadTracksConcurrently(e, t, r, n) {
            return l(this, null, function* () {
                const i = { loaded: [], failed: [] };
                new Array(t).fill(null);
                let o = 0;
                const a = (t) =>
                        l(this, null, function* () {
                            const a = performance.now();
                            try {
                                (this.performanceMonitor &&
                                    this.performanceMonitor.recordLoadingStart(
                                        t.id,
                                        t.estimatedSize
                                    ),
                                    yield this._simulateTrackLoading(t));
                                const e = performance.now() - a;
                                (this._recordLoadingResult(t.id, !0, e),
                                    i.loaded.push(t.id),
                                    n && n(t.id, !0, e));
                            } catch (s) {
                                const e = performance.now() - a;
                                (this._recordLoadingResult(t.id, !1, e, s.message),
                                    i.failed.push({ trackId: t.id, error: s.message }),
                                    n && n(t.id, !1, e, s));
                            }
                            (o++, r && r(o / e.length, t.id));
                        }),
                    s = [];
                for (let r = 0; r < e.length; r += t) {
                    const n = e.slice(r, r + t).map((e) => a(e));
                    (s.push(...n), yield Promise.allSettled(n));
                }
                return (yield Promise.allSettled(s), i);
            });
        }
        _simulateTrackLoading(e) {
            return l(this, null, function* () {
                const t =
                    (e.estimatedSize ? (e.estimatedSize / 1024 / 1024) * 1e3 : 2e3) *
                    this._getNetworkSpeedMultiplier();
                return new Promise((e, r) => {
                    setTimeout(() => {
                        Math.random() < 0.05 ? r(new Error('Simulated loading failure')) : e();
                    }, t);
                });
            });
        }
        _getNetworkSpeedMultiplier() {
            switch (this.networkConditions.effectiveType) {
                case '4g':
                    return 0.5;
                case '3g':
                default:
                    return 1;
                case '2g':
                    return 3;
                case 'slow-2g':
                    return 6;
            }
        }
        _recordLoadingResult(e, t, r, n = null) {
            const i = {
                trackId: e,
                success: t,
                loadTime: r,
                error: n,
                timestamp: Date.now(),
                networkConditions: s({}, this.networkConditions),
            };
            (this.loadingHistory.push(i),
                this.loadingHistory.length > 100 &&
                    (this.loadingHistory = this.loadingHistory.slice(-50)));
        }
        _getTrackLoadingHistory(e) {
            const t = this.loadingHistory.filter((t) => t.trackId === e),
                r = t.filter((e) => e.success).length;
            return {
                attempts: t.length,
                successes: r,
                failures: t.length - r,
                successRate: t.length > 0 ? r / t.length : 0,
                averageLoadTime:
                    t.length > 0 ? t.reduce((e, t) => e + t.loadTime, 0) / t.length : 0,
            };
        }
        _getRecentFailures() {
            const e = Date.now() - 3e5;
            return this.loadingHistory.filter((t) => !t.success && t.timestamp > e);
        }
        _estimateLoadingTime(e) {
            let t = 0;
            for (const r of e.immediate) {
                t +=
                    (r.estimatedSize ? (r.estimatedSize / 1024 / 1024) * 1e3 : 2e3) *
                    this._getNetworkSpeedMultiplier();
            }
            if (e.background.length > 0) {
                t += Math.max(
                    ...e.background.map(
                        (e) =>
                            (e.estimatedSize ? (e.estimatedSize / 1024 / 1024) * 1e3 : 2e3) *
                            this._getNetworkSpeedMultiplier()
                    )
                );
            }
            return t;
        }
        _generateLoadingRecommendations(e) {
            const t = [];
            return (
                e.immediate.length > 3 &&
                    t.push({
                        type: 'performance',
                        message:
                            'Consider reducing immediate loading tracks to improve startup time',
                        priority: 'medium',
                    }),
                this.networkConditions.saveData &&
                    e.background.length > 0 &&
                    t.push({
                        type: 'data_usage',
                        message: 'Data saver mode detected - consider on-demand loading only',
                        priority: 'high',
                    }),
                e.estimatedTime > 1e4 &&
                    t.push({
                        type: 'performance',
                        message: 'Long loading time estimated - consider progressive loading',
                        priority: 'high',
                    }),
                t
            );
        }
        _initializeNetworkMonitoring() {
            if ('connection' in navigator) {
                const e = navigator.connection;
                ((this.networkConditions = {
                    effectiveType: e.effectiveType || 'unknown',
                    downlink: e.downlink || 0,
                    rtt: e.rtt || 0,
                    saveData: e.saveData || !1,
                }),
                    e.addEventListener('change', () => {
                        this.networkConditions = {
                            effectiveType: e.effectiveType || 'unknown',
                            downlink: e.downlink || 0,
                            rtt: e.rtt || 0,
                            saveData: e.saveData || !1,
                        };
                    }));
            }
        }
        _detectDeviceCapabilities() {
            if ('memory' in performance) {
                const e = performance.memory;
                e.jsHeapSizeLimit < 1073741824
                    ? (this.deviceCapabilities.memory = 'low')
                    : e.jsHeapSizeLimit < 4294967296
                      ? (this.deviceCapabilities.memory = 'medium')
                      : (this.deviceCapabilities.memory = 'high');
            }
        }
        _detectMobile() {
            return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
        }
        cleanup() {
            this.loadingHistory = [];
        }
    },
};
const Wl = (null == zl.exports ? {} : zl.exports).default || zl.exports,
    Hl = Object.freeze(
        Object.defineProperty({ __proto__: null, default: Wl }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var Vl = { exports: {} };
const { MusicTrack: ql } = fl || dl,
    { MusicSettings: Yl } = yl || ml,
    { MusicErrorHandler: Kl } = xl || Pl,
    { MusicPerformanceMonitor: Jl } = Ll || Il,
    { MusicBufferManager: Zl } = Bl || Ul,
    { MusicLoadingOptimizer: Xl } = Wl || Hl,
    {
        MUSIC_TRACKS: Ql,
        PLAYBACK_STATES: ec,
        MUSIC_SYSTEM_CONFIG: tc,
        DUCKING_TRIGGERS: rc,
        MusicConfigUtils: nc,
    } = Sl || El,
    { logger: ic } = sl || ul;
Vl.exports = {
    MusicPlayer: class {
        constructor(e, t = null) {
            ((this.audioManager = e),
                (this.settings = t || new Yl()),
                (this.errorHandler = new Kl()),
                (this.performanceMonitor = new Jl()),
                (this.bufferManager = new Zl(this.performanceMonitor)),
                (this.loadingOptimizer = new Xl(this.performanceMonitor)),
                (this.audioContext = null),
                (this.tracks = new Map()),
                (this.currentTrack = null),
                (this.currentSource = null),
                (this.playbackState = ec.STOPPED),
                (this.isInitialized = !1),
                (this.masterGainNode = null),
                (this.currentVolume = this.settings.getMusicVolume()),
                (this.fadeState = {
                    active: !1,
                    type: null,
                    startTime: 0,
                    duration: 0,
                    startVolume: 0,
                    targetVolume: 0,
                }),
                (this.duckingState = {
                    active: !1,
                    originalVolume: 0,
                    duckLevel: 0,
                    recoveryTimeout: null,
                }),
                (this.errorCount = 0),
                (this.lastError = null),
                this._initializeTracks());
        }
        _initializeTracks() {
            for (const [e, t] of Object.entries(Ql)) {
                const r = new ql(e, t.url, t);
                this.tracks.set(e, r);
            }
        }
        initialize(e) {
            return l(this, null, function* () {
                if (this.isInitialized) return !0;
                if (!e) return !1;
                if ('closed' === e.state) return !1;
                try {
                    if (((this.audioContext = e), 'suspended' === this.audioContext.state))
                        try {
                            yield this.audioContext.resume();
                        } catch (t) {
                            ic.info('Autoplay prevented, waiting for user interaction');
                        }
                    this.performanceMonitor.startMonitoring();
                    for (const t of this.tracks.values()) t.setAudioContext(e);
                    ((this.masterGainNode = this.audioContext.createGain()),
                        (this.masterGainNode.gain.value = this.currentVolume),
                        this.masterGainNode.connect(this.audioContext.destination));
                    const r = this.settings.getSelectedTrack();
                    if ('none' !== r) {
                        const e = Object.values(Ql).filter((e) => 'none' !== e.id),
                            n = this.loadingOptimizer.optimizeLoadingStrategy(e, {
                                priorityTrack: r,
                                minimizeStartupDelay: !0,
                            });
                        for (const r of n.immediate) {
                            const e = this.tracks.get(r.id);
                            if (e) {
                                this.performanceMonitor.recordLoadingStart(r.id);
                                try {
                                    yield e.preload();
                                    const t = e.getAudioBuffer();
                                    (t && this.bufferManager.registerBuffer(r.id, t, r),
                                        this.performanceMonitor.recordLoadingComplete(r.id, !0, t));
                                } catch (t) {
                                    this.performanceMonitor.recordLoadingComplete(r.id, !1);
                                    const n = yield this.errorHandler.handleLoadingError(
                                        t,
                                        r.id,
                                        e.url,
                                        0
                                    );
                                    'degrade' === n.action &&
                                        ic.warn(
                                            `Preloading failed for ${r.id}, continuing without music:`,
                                            { error: n.message }
                                        );
                                }
                            }
                        }
                        n.background.length > 0 && this._startBackgroundLoading(n.background);
                    }
                    return (
                        (this.isInitialized = !0),
                        ic.info('MusicPlayer initialized successfully'),
                        !0
                    );
                } catch (t) {
                    const r = this.errorHandler.handleAudioContextError(t, e);
                    return (
                        this._handleError(t, 'initialization'),
                        'reinitialize_audio' === r.action &&
                            ic.warn('Audio context initialization failed, music system disabled'),
                        !1
                    );
                }
            });
        }
        play() {
            if (!this.isInitialized || this.playbackState === ec.PLAYING) return !1;
            if (this.audioContext && 'suspended' === this.audioContext.state) return !1;
            try {
                const e = this.settings.getSelectedTrack();
                if ('none' === e) return ((this.playbackState = ec.STOPPED), !0);
                const t = this.tracks.get(e);
                return t && t.isLoaded()
                    ? (this.stop(),
                      (this.currentSource = t.createSource()),
                      this.currentSource
                          ? (this.currentSource.connect(this.masterGainNode),
                            (this.currentSource.loop = t.shouldLoop()),
                            (this.currentSource.onended = () => {
                                this.playbackState === ec.PLAYING &&
                                    ((this.playbackState = ec.STOPPED),
                                    (this.currentSource = null));
                            }),
                            this.currentSource.start(0),
                            (this.currentTrack = t),
                            (this.playbackState = ec.PLAYING),
                            !0)
                          : (this._handleError(
                                new Error(`Failed to create source for ${e}`),
                                'play'
                            ),
                            !1))
                    : (this._handleError(new Error(`Track ${e} not loaded`), 'play'), !1);
            } catch (e) {
                return (this._handleError(e, 'play'), !1);
            }
        }
        pause() {
            if (this.playbackState !== ec.PLAYING) return !1;
            try {
                return (this.stop(), (this.playbackState = ec.PAUSED), !0);
            } catch (e) {
                return (this._handleError(e, 'pause'), !1);
            }
        }
        stop() {
            if (this.playbackState === ec.STOPPED) return !0;
            try {
                return (
                    this.currentSource && (this.currentSource.stop(), (this.currentSource = null)),
                    (this.fadeState.active = !1),
                    this._clearDucking(),
                    (this.playbackState = ec.STOPPED),
                    (this.currentTrack = null),
                    !0
                );
            } catch (e) {
                return (this._handleError(e, 'stop'), !1);
            }
        }
        setTrack(e) {
            if (!nc.isValidTrackId(e))
                return (this._handleError(new Error(`Invalid track ID: ${e}`), 'setTrack'), !1);
            try {
                if (!this.settings.setSelectedTrack(e)) return !1;
                return (
                    !(this.playbackState === ec.PLAYING) ||
                    (this.stop(), 'none' === e) ||
                    this.play()
                );
            } catch (t) {
                return (this._handleError(t, 'setTrack'), !1);
            }
        }
        getAvailableTracks() {
            const e = [];
            for (const t of this.tracks.values())
                e.push({
                    id: t.getId(),
                    name: t.getName(),
                    energyLevel: t.getEnergyLevel(),
                    duration: t.getDuration(),
                    isLoaded: t.isLoaded(),
                    loadingState: t.getLoadingState(),
                });
            return e;
        }
        getCurrentTrack() {
            return this.currentTrack
                ? {
                      id: this.currentTrack.getId(),
                      name: this.currentTrack.getName(),
                      energyLevel: this.currentTrack.getEnergyLevel(),
                      duration: this.currentTrack.getDuration(),
                      playbackState: this.playbackState,
                  }
                : null;
        }
        setVolume(e) {
            if ('number' != typeof e || e < 0 || e > 1)
                return (
                    this._handleError(new Error(`Invalid volume level: ${e}`), 'setVolume'),
                    !1
                );
            try {
                return (
                    !!this.settings.setMusicVolume(e) &&
                    ((this.currentVolume = e),
                    this.masterGainNode &&
                        (this.fadeState.active
                            ? (this.fadeState.targetVolume = e)
                            : (this.masterGainNode.gain.value = e)),
                    !0)
                );
            } catch (t) {
                return (this._handleError(t, 'setVolume'), !1);
            }
        }
        getVolume() {
            return this.currentVolume;
        }
        isPlaying() {
            return this.playbackState === ec.PLAYING;
        }
        isPaused() {
            return this.playbackState === ec.PAUSED;
        }
        getPlaybackState() {
            return this.playbackState;
        }
        _handleError(e, t, r = {}) {
            (this.errorCount++,
                (this.lastError = { message: e.message, operation: t, timestamp: Date.now() }));
            const n = this.errorHandler.handlePlaybackError(
                e,
                t,
                u(s({}, r), { trackId: this.currentTrack ? this.currentTrack.getId() : 'unknown' })
            );
            (ic.warn(`MusicPlayer error in ${t}:`, { error: e }),
                'pause_and_retry' === n.action && n.canRetry
                    ? setTimeout(() => {
                          this.playbackState === ec.STOPPED && this.play();
                      }, n.retryDelay || 2e3)
                    : 'stop_playback' === n.action && this.stop(),
                this.errorCount > 5 && (this.playbackState = ec.ERROR));
        }
        _clearDucking() {
            (this.duckingState.recoveryTimeout &&
                (clearTimeout(this.duckingState.recoveryTimeout),
                (this.duckingState.recoveryTimeout = null)),
                (this.duckingState.active = !1),
                (this.duckingState.originalVolume = 0),
                (this.duckingState.duckLevel = 0));
        }
        getLastError() {
            return this.lastError;
        }
        getStatus() {
            return {
                isInitialized: this.isInitialized,
                playbackState: this.playbackState,
                currentTrack: this.getCurrentTrack(),
                volume: this.currentVolume,
                selectedTrackId: this.settings.getSelectedTrack(),
                fadeActive: this.fadeState.active,
                duckingActive: this.duckingState.active,
                errorCount: this.errorCount,
                lastError: this.lastError,
            };
        }
        fadeIn(e = null) {
            return l(this, null, function* () {
                if (!this.isInitialized || !this.masterGainNode) return !1;
                let t = e || this.settings.getFadeInDuration();
                try {
                    if (
                        (this.performanceMonitor.recordFadeOperation('in', t),
                        this.playbackState !== ec.PLAYING &&
                            ((this.masterGainNode.gain.value = 0), !this.play()))
                    )
                        return !1;
                    ((this.fadeState = {
                        active: !0,
                        type: 'in',
                        startTime: this.audioContext.currentTime,
                        duration: t,
                        startVolume: this.masterGainNode.gain.value,
                        targetVolume: this.currentVolume,
                    }),
                        (this.playbackState = ec.FADING_IN));
                    const e = this.audioContext.currentTime;
                    return (
                        this.masterGainNode.gain.cancelScheduledValues(e),
                        this.masterGainNode.gain.setValueAtTime(0, e),
                        this.masterGainNode.gain.linearRampToValueAtTime(this.currentVolume, e + t),
                        yield this._waitForFade(t),
                        (this.fadeState.active = !1),
                        (this.playbackState = ec.PLAYING),
                        !0
                    );
                } catch (r) {
                    return (
                        this._handleError(r, 'fadeIn', { duration: t }),
                        (this.fadeState.active = !1),
                        !1
                    );
                }
            });
        }
        fadeOut(e = null) {
            return l(this, null, function* () {
                if (
                    !this.isInitialized ||
                    !this.masterGainNode ||
                    this.playbackState === ec.STOPPED
                )
                    return !1;
                try {
                    const t = e || this.settings.getFadeOutDuration();
                    ((this.fadeState = {
                        active: !0,
                        type: 'out',
                        startTime: this.audioContext.currentTime,
                        duration: t,
                        startVolume: this.masterGainNode.gain.value,
                        targetVolume: 0,
                    }),
                        (this.playbackState = ec.FADING_OUT));
                    const r = this.audioContext.currentTime;
                    return (
                        this.masterGainNode.gain.cancelScheduledValues(r),
                        this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, r),
                        this.masterGainNode.gain.linearRampToValueAtTime(0, r + t),
                        yield this._waitForFade(t),
                        this.stop(),
                        (this.masterGainNode.gain.value = this.currentVolume),
                        !0
                    );
                } catch (t) {
                    return (this._handleError(t, 'fadeOut'), (this.fadeState.active = !1), !1);
                }
            });
        }
        _waitForFade(e) {
            return new Promise((t) => {
                setTimeout(() => {
                    t();
                }, 1e3 * e);
            });
        }
        isFading() {
            return this.fadeState.active;
        }
        getFadeState() {
            return {
                active: this.fadeState.active,
                type: this.fadeState.type,
                progress: this._calculateFadeProgress(),
                duration: this.fadeState.duration,
            };
        }
        _calculateFadeProgress() {
            if (!this.fadeState.active || !this.audioContext) return 0;
            const e = this.audioContext.currentTime - this.fadeState.startTime,
                t = Math.min(e / this.fadeState.duration, 1);
            return Math.max(t, 0);
        }
        cancelFade() {
            if (!this.fadeState.active || !this.masterGainNode) return !1;
            try {
                const e = this.audioContext.currentTime;
                return (
                    this.masterGainNode.gain.cancelScheduledValues(e),
                    this.masterGainNode.gain.setValueAtTime(this.currentVolume, e),
                    (this.fadeState.active = !1),
                    (this.playbackState !== ec.FADING_IN && this.playbackState !== ec.FADING_OUT) ||
                        (this.playbackState = this.currentSource ? ec.PLAYING : ec.STOPPED),
                    !0
                );
            } catch (e) {
                return (this._handleError(e, 'cancelFade'), !1);
            }
        }
        smoothVolumeTransition(e, t = 0.5) {
            return l(this, null, function* () {
                if (!this.isInitialized || !this.masterGainNode) return !1;
                if (e < 0 || e > 1)
                    return (
                        this._handleError(
                            new Error(`Invalid target volume: ${e}`),
                            'smoothVolumeTransition'
                        ),
                        !1
                    );
                try {
                    this.cancelFade();
                    const r = this.audioContext.currentTime,
                        n = this.masterGainNode.gain.value;
                    return (
                        this.masterGainNode.gain.cancelScheduledValues(r),
                        this.masterGainNode.gain.setValueAtTime(n, r),
                        this.masterGainNode.gain.linearRampToValueAtTime(e, r + t),
                        (this.currentVolume = e),
                        this.settings.setMusicVolume(e),
                        yield this._waitForFade(t),
                        !0
                    );
                } catch (r) {
                    return (this._handleError(r, 'smoothVolumeTransition'), !1);
                }
            });
        }
        _scheduleDuckingRecovery(e) {
            (this.duckingState.recoveryTimeout && clearTimeout(this.duckingState.recoveryTimeout),
                (this.duckingState.recoveryTimeout = setTimeout(() => {
                    this.unduck();
                }, e)));
        }
        duck(e = null, t = null) {
            if (!this.isInitialized || !this.masterGainNode || this.playbackState !== ec.PLAYING)
                return !1;
            try {
                const r = null !== e ? e : this.settings.getDuckingLevel(),
                    n = null !== t ? t : this.settings.getDuckingDuration();
                if ((this.performanceMonitor.recordDuckingOperation(r, n), r < 0 || r > 1))
                    return (this._handleError(new Error(`Invalid duck level: ${r}`), 'duck'), !1);
                this.duckingState.active ||
                    (this.duckingState.originalVolume = this.masterGainNode.gain.value);
                const i = this.duckingState.originalVolume * r,
                    o = this.audioContext.currentTime;
                return (
                    this.masterGainNode.gain.cancelScheduledValues(o),
                    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, o),
                    this.masterGainNode.gain.linearRampToValueAtTime(i, o + n),
                    (this.duckingState.active = !0),
                    (this.duckingState.duckLevel = r),
                    (this.playbackState = ec.DUCKED),
                    !0
                );
            } catch (r) {
                return (this._handleError(r, 'duck'), !1);
            }
        }
        unduck(e = null) {
            if (!this.isInitialized || !this.masterGainNode || !this.duckingState.active) return !1;
            try {
                const t = null !== e ? e : this.settings.getDuckingRecovery(),
                    r = this.audioContext.currentTime;
                return (
                    this.masterGainNode.gain.cancelScheduledValues(r),
                    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, r),
                    this.masterGainNode.gain.linearRampToValueAtTime(
                        this.duckingState.originalVolume,
                        r + t
                    ),
                    this._clearDucking(),
                    this.playbackState === ec.DUCKED && (this.playbackState = ec.PLAYING),
                    !0
                );
            } catch (t) {
                return (this._handleError(t, 'unduck'), !1);
            }
        }
        isDucked() {
            return this.duckingState.active;
        }
        getDuckingState() {
            return {
                active: this.duckingState.active,
                duckLevel: this.duckingState.duckLevel || 0,
                originalVolume: this.duckingState.originalVolume,
                recoveryTimeout: null !== this.duckingState.recoveryTimeout,
            };
        }
        onSoundEffect(e) {
            if (!rc[e]) return !1;
            const t = rc[e];
            return (
                this.duck(t.level, t.duration),
                this.duckingState.recoveryTimeout &&
                    clearTimeout(this.duckingState.recoveryTimeout),
                (this.duckingState.recoveryTimeout = setTimeout(
                    () => {
                        this.unduck(t.recovery);
                    },
                    1e3 * (t.duration + t.hold)
                )),
                !0
            );
        }
        onExplosionSound() {
            return this.onSoundEffect('explosion');
        }
        onCollisionSound() {
            return this.onSoundEffect('collision');
        }
        onVictorySound() {
            return this.onSoundEffect('victory');
        }
        onDefeatSound() {
            return this.onSoundEffect('defeat');
        }
        onGameStart() {
            return l(this, null, function* () {
                if (!this.isInitialized) return !1;
                if ('none' !== this.settings.getSelectedTrack()) {
                    this.settings.getFadeInDuration() > 0 ? yield this.fadeIn() : this.play();
                }
                return !0;
            });
        }
        onGamePause() {
            return l(this, null, function* () {
                return !!this.isInitialized && (this.isPlaying() && (yield this.fadeOut(0.5)), !0);
            });
        }
        onGameResume() {
            return l(this, null, function* () {
                return !!this.isInitialized && (this.isPaused() && (yield this.fadeIn(0.5)), !0);
            });
        }
        onGameEnd() {
            return l(this, null, function* () {
                return !!this.isInitialized && (this.isPlaying() && (yield this.fadeOut(2)), !0);
            });
        }
        onGameRestart() {
            return l(this, null, function* () {
                return !!this.isInitialized && (this.stop(), yield this.onGameStart(), !0);
            });
        }
        _startBackgroundLoading(e) {
            setTimeout(
                () =>
                    l(this, null, function* () {
                        try {
                            const t = yield this.loadingOptimizer.progressiveLoad(
                                e,
                                (e, t) => {
                                    ic.debug(
                                        `Background loading progress: ${Math.round(100 * e)}% (${t})`
                                    );
                                },
                                (e, t, r, n) => {
                                    if (t) {
                                        const t = this.tracks.get(e);
                                        if (t) {
                                            const r = t.getAudioBuffer();
                                            if (r) {
                                                const t = Ql[e];
                                                this.bufferManager.registerBuffer(e, r, t);
                                            }
                                        }
                                    }
                                }
                            );
                            ic.info(
                                `Background loading completed: ${t.loaded.length} loaded, ${t.failed.length} failed`
                            );
                        } catch (t) {
                            ic.warn('Background loading error:', t);
                        }
                    }),
                100
            );
        }
        getSystemStatus() {
            return u(s({}, this.getStatus()), {
                errorStatistics: this.errorHandler.getErrorStatistics(),
                performanceMetrics: this.performanceMonitor.getMetrics(),
                memoryUsage: this.performanceMonitor.getMemoryUsage(),
                loadingPerformance: this.performanceMonitor.getLoadingPerformance(),
                frameRateImpact: this.performanceMonitor.getFrameRateImpact(),
                optimizationRecommendations:
                    this.performanceMonitor.getOptimizationRecommendations(),
                bufferStatistics: this.bufferManager.getStatistics(),
                bufferMemoryUsage: this.bufferManager.getMemoryUsage(),
            });
        }
        performOptimization() {
            return l(this, null, function* () {
                const e = this.performanceMonitor.getOptimizationRecommendations(),
                    t = { performed: [], skipped: [], errors: [] };
                try {
                    const e = this.bufferManager.optimizeLoadingStrategy();
                    e.optimizations.length > 0 &&
                        t.performed.push({ action: 'buffer_optimization', result: e });
                } catch (r) {
                    t.errors.push({ action: 'buffer_optimization', error: r.message });
                }
                if (this.bufferManager.getMemoryUsage().utilizationPercentage > 80)
                    try {
                        const e = this.bufferManager.performCleanup({ forceCleanup: !1 });
                        t.performed.push({ action: 'memory_cleanup', result: e });
                    } catch (r) {
                        t.errors.push({ action: 'memory_cleanup', error: r.message });
                    }
                for (const n of e)
                    try {
                        switch (n.action) {
                            case 'cleanup_buffers':
                                const e = this.bufferManager.performCleanup();
                                t.performed.push({ action: n.action, result: e });
                                break;
                            case 'reduce_complexity':
                                (this.settings.setMusicVolume(
                                    Math.min(this.settings.getMusicVolume(), 0.7)
                                ),
                                    t.performed.push({
                                        action: n.action,
                                        result: 'Reduced volume to minimize processing load',
                                    }));
                                break;
                            case 'optimize_files':
                                const r = this.bufferManager.preloadStrategy,
                                    i = this.bufferManager.getRecommendedPreloadStrategy();
                                r !== i
                                    ? (this.bufferManager.setPreloadStrategy(i),
                                      t.performed.push({
                                          action: n.action,
                                          result: `Changed preload strategy from ${r} to ${i}`,
                                      }))
                                    : t.skipped.push({
                                          action: n.action,
                                          reason: 'Already using optimal preload strategy',
                                      });
                                break;
                            default:
                                t.skipped.push({
                                    action: n.action,
                                    reason: 'No automatic optimization available',
                                });
                        }
                    } catch (r) {
                        t.errors.push({ action: n.action, error: r.message });
                    }
                return t;
            });
        }
        cleanup() {
            (this.stop(),
                this._clearDucking(),
                this.cancelFade(),
                this.performanceMonitor && this.performanceMonitor.cleanup(),
                this.bufferManager && this.bufferManager.cleanup(),
                this.loadingOptimizer && this.loadingOptimizer.cleanup(),
                this.errorHandler && this.errorHandler.clearErrorLog(),
                (this.isInitialized = !1),
                (this.audioContext = null));
            for (const e of this.tracks.values()) e.cleanup();
            (this.tracks.clear(),
                this.masterGainNode &&
                    (this.masterGainNode.disconnect(), (this.masterGainNode = null)),
                (this.audioContext = null),
                (this.isInitialized = !1));
        }
    },
};
const oc = (null == Vl.exports ? {} : Vl.exports).default || Vl.exports,
    ac = Object.freeze(
        Object.defineProperty({ __proto__: null, default: oc }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
var sc = { exports: {} };
const { logger: uc } = sl || ul;
sc.exports = {
    AudioManager: class {
        constructor() {
            ((this.audioContext = null),
                (this.musicPlayer = null),
                (this.musicSettings = null),
                (this.musicInitialized = !1),
                (this.sounds = {}),
                (this.isMuted = !1),
                (this.isInitialized = !1),
                (this.currentEngine = null),
                (this.soundConfig = {
                    turn: { volume: 0.3, maxConcurrent: 1, cooldown: 100 },
                    engine: { volume: 0.2, loop: !0, fadeIn: 200, fadeOut: 200 },
                    explosion: { volume: 0.8, priority: 'high', interruptOthers: !0 },
                    victory: { volume: 0.6, delay: 500 },
                    defeat: { volume: 0.4, delay: 500 },
                    powerup_collect: { volume: 0.5, maxConcurrent: 2, cooldown: 50 },
                    shrink_warning: { volume: 0.4, maxConcurrent: 1, cooldown: 1e3 },
                    shrink_execute: { volume: 0.6, maxConcurrent: 1, priority: 'medium' },
                }),
                (this.maxConcurrentSounds = 5),
                (this.activeSounds = []),
                (this.lastTurnTime = 0),
                (this.bufferCleanupInterval = null),
                (this.bufferCleanupFrequency = 3e4),
                (this.performanceMetrics = {
                    activeSoundsCount: 0,
                    bufferMemoryUsage: 0,
                    lastCleanupTime: 0,
                }),
                this.loadMuteState());
        }
        loadMuteState() {
            try {
                const e = localStorage.getItem('lightbikes_audio_muted');
                null !== e && (this.isMuted = JSON.parse(e));
            } catch (e) {
                this.handleAudioError(e, 'localStorage');
            }
        }
        saveMuteState() {
            try {
                localStorage.setItem('lightbikes_audio_muted', JSON.stringify(this.isMuted));
            } catch (e) {
                this.handleAudioError(e, 'localStorage');
            }
        }
        handleAudioError(e, t) {
            uc.warn(`Audio error for ${t}:`, { error: e });
            switch (this.categorizeError(e)) {
                case 'autoplay_blocked':
                    uc.info(
                        'Audio blocked by autoplay policy. Audio will start after user interaction.'
                    );
                    break;
                case 'format_unsupported':
                    (uc.warn(`Audio format not supported for ${t}. Trying fallback formats.`),
                        this.tryAlternativeFormat(t));
                    break;
                case 'network_error':
                    (uc.warn(`Network error loading ${t}. Audio will be disabled for this sound.`),
                        this.markSoundUnavailable(t));
                    break;
                case 'context_error':
                    (uc.error('Audio context error. Attempting to reinitialize audio system.'),
                        this.handleContextError());
                    break;
                case 'playback_error':
                    uc.warn(`Playback error for ${t}. Continuing without this sound.`);
                    break;
                default:
                    uc.warn(`Unknown audio error for ${t}. Continuing with graceful degradation.`);
            }
            this.sounds[t] &&
                (this.sounds[t] = { type: 'failed', buffer: null, loaded: !1, error: e.message });
        }
        categorizeError(e) {
            const t = e.message.toLowerCase();
            return t.includes('autoplay') || t.includes('user activation')
                ? 'autoplay_blocked'
                : t.includes('format') || t.includes('codec') || t.includes('decode')
                  ? 'format_unsupported'
                  : t.includes('network') || t.includes('fetch') || t.includes('load')
                    ? 'network_error'
                    : t.includes('context') || t.includes('suspended')
                      ? 'context_error'
                      : t.includes('play') || t.includes('start')
                        ? 'playback_error'
                        : 'unknown';
        }
        tryAlternativeFormat(e) {
            const t = this.detectBrowserCapabilities(),
                r = this.getSoundFileList()[e];
            if (!r) return;
            const n = [];
            (t.formats.ogg && r.includes('.mp3') && n.push(r.replace('.mp3', '.ogg')),
                t.formats.wav && n.push(r.replace(/\.(mp3|ogg)$/, '.wav')),
                n.forEach((t) =>
                    l(this, null, function* () {
                        try {
                            (yield this.loadSoundBuffer(e, t),
                                uc.info(`Successfully loaded alternative format for ${e}: ${t}`));
                        } catch (r) {
                            uc.warn(`Alternative format also failed for ${e}: ${t}`);
                        }
                    })
                ));
        }
        markSoundUnavailable(e) {
            this.sounds[e] = {
                type: 'unavailable',
                buffer: null,
                loaded: !1,
                error: 'Sound marked as unavailable due to loading failure',
            };
        }
        handleContextError() {
            if (this.audioContext)
                try {
                    ('suspended' === this.audioContext.state &&
                        this.audioContext.resume().catch((e) => {
                            uc.warn('Failed to resume audio context:', { error: e });
                        }),
                        'closed' === this.audioContext.state &&
                            ((this.audioContext = null),
                            (this.isInitialized = !1),
                            uc.info(
                                'Audio context closed. Will reinitialize on next audio interaction.'
                            )));
                } catch (e) {
                    (uc.error('Audio context recovery failed:', { error: e }),
                        (this.audioContext = null),
                        (this.isInitialized = !1));
                }
        }
        isWebAudioSupported() {
            return !(!window.AudioContext && !window.webkitAudioContext);
        }
        checkAutoplayPolicy() {
            return l(this, null, function* () {
                if (!this.audioContext) return !1;
                try {
                    const e = this.audioContext.createBuffer(1, 1, 22050),
                        t = this.audioContext.createBufferSource();
                    return (
                        (t.buffer = e),
                        t.connect(this.audioContext.destination),
                        t.start(0),
                        !0
                    );
                } catch (e) {
                    return (uc.warn('Autoplay policy may be blocking audio:', { error: e }), !1);
                }
            });
        }
        detectBrowserCapabilities() {
            const e = {
                webAudio: this.isWebAudioSupported(),
                html5Audio: !!window.Audio,
                formats: { mp3: !1, ogg: !1, wav: !1, m4a: !1 },
                autoplayBlocked: !1,
            };
            if (e.html5Audio) {
                const t = new Audio();
                ((e.formats.mp3 = !(!t.canPlayType || !t.canPlayType('audio/mpeg'))),
                    (e.formats.ogg = !(!t.canPlayType || !t.canPlayType('audio/ogg'))),
                    (e.formats.wav = !(!t.canPlayType || !t.canPlayType('audio/wav'))),
                    (e.formats.m4a = !(!t.canPlayType || !t.canPlayType('audio/mp4'))));
            }
            return e;
        }
        handleUserInteraction() {
            return l(this, null, function* () {
                if (!this.isInitialized) return yield this.initialize();
                if (this.audioContext && 'suspended' === this.audioContext.state)
                    try {
                        return (
                            yield this.audioContext.resume(),
                            uc.info('Audio context activated by user interaction'),
                            !0
                        );
                    } catch (e) {
                        return (this.handleAudioError(e, 'user_interaction'), !1);
                    }
                return !0;
            });
        }
        getMuted() {
            return this.isMuted;
        }
        setMuted(e) {
            ((this.isMuted = e),
                this.saveMuteState(),
                e && (this.stopAllAudio(), this.stopMusic()));
        }
        stopAllAudio() {
            if (this.currentEngine) {
                try {
                    this.currentEngine &&
                        'function' == typeof this.currentEngine.stop &&
                        this.currentEngine.stop();
                } catch (e) {
                    this.handleAudioError(e, 'engine_stop');
                }
                this.currentEngine = null;
            }
            (this.activeSounds.forEach((t) => {
                try {
                    t && t.stop && t.stop();
                } catch (e) {
                    this.handleAudioError(e, 'active_sound_stop');
                }
            }),
                (this.activeSounds = []));
        }
        initialize() {
            return l(this, null, function* () {
                if (this.isInitialized) return !0;
                try {
                    if (!this.isWebAudioSupported())
                        return (
                            uc.warn('Web Audio API not supported, falling back to HTML5 Audio'),
                            this.initializeHTMLAudio()
                        );
                    const t = window.AudioContext || window.webkitAudioContext;
                    if (((this.audioContext = new t()), 'suspended' === this.audioContext.state))
                        try {
                            (yield this.audioContext.resume(),
                                uc.info('Audio context resumed successfully'));
                        } catch (e) {
                            uc.warn('Failed to resume audio context, may need user interaction:', {
                                error: e,
                            });
                        }
                    (yield this.checkAutoplayPolicy()) ||
                        uc.info(
                            'Autoplay may be blocked. Audio will start after user interaction.'
                        );
                    return (yield this.preloadSounds())
                        ? ((this.isInitialized = !0),
                          this.startBufferCleanup(),
                          yield this.initializeMusicSystem(),
                          uc.info('AudioManager initialized successfully'),
                          !0)
                        : (uc.warn(
                              'AudioManager initialization completed with some audio loading failures'
                          ),
                          (this.isInitialized = !0),
                          this.startBufferCleanup(),
                          !1);
                } catch (t) {
                    return (this.handleAudioError(t, 'initialization'), !1);
                }
            });
        }
        initializeHTMLAudio() {
            return l(this, null, function* () {
                try {
                    const t = this.getSoundFileList();
                    for (const [r, n] of Object.entries(t))
                        try {
                            const e = new Audio();
                            ((e.preload = 'auto'),
                                (e.src = n),
                                (this.sounds[r] = { type: 'html5', element: e, loaded: !1 }),
                                yield new Promise((t, n) => {
                                    const i = setTimeout(() => {
                                        n(new Error(`Timeout loading ${r}`));
                                    }, 5e3);
                                    (e.addEventListener('canplaythrough', () => {
                                        (clearTimeout(i), (this.sounds[r].loaded = !0), t());
                                    }),
                                        e.addEventListener('error', () => {
                                            (clearTimeout(i), n(new Error(`Failed to load ${r}`)));
                                        }));
                                }));
                        } catch (e) {
                            this.handleAudioError(e, r);
                        }
                    return (
                        (this.isInitialized = !0),
                        this.startBufferCleanup(),
                        uc.info('AudioManager initialized with HTML5 Audio fallback'),
                        !0
                    );
                } catch (e) {
                    return (this.handleAudioError(e, 'html5_initialization'), !1);
                }
            });
        }
        preloadSounds() {
            return l(this, null, function* () {
                const e = this.getSoundFileList(),
                    t = [];
                for (const [o, a] of Object.entries(e)) {
                    const e = this.loadSoundBuffer(o, a)
                        .then(() => {
                            uc.info(`Successfully loaded ${o}`);
                        })
                        .catch((e) => (this.handleAudioError(e, o), this.tryFallbackFormat(o, a)));
                    t.push(e);
                }
                yield Promise.allSettled(t);
                let r = 0;
                const n = Object.keys(e).length;
                for (const o of Object.keys(e)) this.sounds[o] && this.sounds[o].loaded && r++;
                const i = r === n;
                return (
                    i
                        ? uc.info('All audio files preloaded successfully')
                        : uc.warn(`Audio preloading completed: ${r}/${n} sounds loaded`),
                    i
                );
            });
        }
        loadSoundBuffer(e, t) {
            return l(this, null, function* () {
                try {
                    const r = yield fetch(t);
                    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                    const n = yield r.arrayBuffer(),
                        i = yield this.audioContext.decodeAudioData(n);
                    this.sounds[e] = { type: 'webaudio', buffer: i, loaded: !0 };
                } catch (r) {
                    throw new Error(`Failed to load ${e} from ${t}: ${r.message}`);
                }
            });
        }
        tryFallbackFormat(e, t) {
            return l(this, null, function* () {
                try {
                    const r = t.replace('.mp3', '.ogg');
                    if (r === t) throw new Error('No fallback format available');
                    return (
                        uc.info(`Trying fallback format for ${e}: ${r}`),
                        yield this.loadSoundBuffer(e, r),
                        Promise.resolve()
                    );
                } catch (r) {
                    return (
                        (this.sounds[e] = { type: 'failed', buffer: null, loaded: !1 }),
                        uc.warn(
                            `All formats failed for ${e}, audio will be disabled for this sound`
                        ),
                        Promise.resolve()
                    );
                }
            });
        }
        getSoundFileList() {
            return {
                turn: 'sounds/turn.mp3',
                engine: 'sounds/engine.mp3',
                explosion: 'sounds/explosion.mp3',
                victory: 'sounds/victory.mp3',
                defeat: 'sounds/defeat.mp3',
                powerup_collect: 'sounds/turn.mp3',
                shrink_warning: 'sounds/turn.mp3',
                shrink_execute: 'sounds/explosion.mp3',
            };
        }
        playTurnSound() {
            if (this.isMuted || !this.isInitialized) return;
            const e = Date.now();
            if (!(e - this.lastTurnTime < this.soundConfig.turn.cooldown)) {
                this.lastTurnTime = e;
                try {
                    const e = this.sounds.turn;
                    if (!e || !e.loaded) return;
                    'webaudio' === e.type
                        ? this.playWebAudioSound('turn', e.buffer)
                        : 'html5' === e.type && this.playHTML5Sound('turn', e.element);
                } catch (t) {
                    this.handleAudioError(t, 'turn_playback');
                }
            }
        }
        playWebAudioSound(e, t) {
            if (this.audioContext && t)
                try {
                    const r = this.audioContext.createBufferSource();
                    r.buffer = t;
                    const n = this.audioContext.createGain(),
                        i = this.soundConfig[e];
                    return (
                        (n.gain.value = i ? i.volume : 0.5),
                        r.connect(n),
                        n.connect(this.audioContext.destination),
                        i && i.loop && (r.loop = !0),
                        r.start(0),
                        this.activeSounds.push(r),
                        r.loop ||
                            (r.onended = () => {
                                const e = this.activeSounds.indexOf(r);
                                e > -1 && this.activeSounds.splice(e, 1);
                            }),
                        this.enforcePlaybackLimits(),
                        r
                    );
                } catch (r) {
                    return (this.handleAudioError(r, `${e}_webaudio_playback`), null);
                }
        }
        playHTML5Sound(e, t) {
            if (t)
                try {
                    const r = t.cloneNode(),
                        n = this.soundConfig[e];
                    ((r.volume = n ? n.volume : 0.5), n && n.loop && (r.loop = !0));
                    const i = r.play();
                    return (
                        void 0 !== i &&
                            i.catch((t) => {
                                this.handleAudioError(t, `${e}_html5_playback`);
                            }),
                        this.activeSounds.push(r),
                        this.enforcePlaybackLimits(),
                        r.loop ||
                            (r.onended = () => {
                                const e = this.activeSounds.indexOf(r);
                                e > -1 && this.activeSounds.splice(e, 1);
                            }),
                        r
                    );
                } catch (r) {
                    return (this.handleAudioError(r, `${e}_html5_playback`), null);
                }
        }
        startEngineSound() {
            if (!this.isMuted && this.isInitialized && !this.currentEngine)
                try {
                    const e = this.sounds.engine;
                    if (!e || !e.loaded) return;
                    'webaudio' === e.type
                        ? (this.currentEngine = this.startWebAudioEngine(e.buffer))
                        : 'html5' === e.type &&
                          (this.currentEngine = this.startHTML5Engine(e.element));
                } catch (e) {
                    this.handleAudioError(e, 'engine_start');
                }
        }
        stopEngineSound() {
            if (this.currentEngine)
                try {
                    const e = this.currentEngine;
                    e.stop ? e.stop() : e.pause && (e.pause(), (e.currentTime = 0));
                    const t = this.activeSounds.indexOf(this.currentEngine);
                    (t > -1 && this.activeSounds.splice(t, 1), (this.currentEngine = null));
                } catch (e) {
                    (this.handleAudioError(e, 'engine_stop'), (this.currentEngine = null));
                }
        }
        startWebAudioEngine(e) {
            if (!this.audioContext || !e) return null;
            try {
                const t = this.audioContext.createBufferSource();
                ((t.buffer = e), (t.loop = !0));
                const r = this.audioContext.createGain(),
                    n = this.soundConfig.engine;
                r.gain.setValueAtTime(0, this.audioContext.currentTime);
                const i = (n.fadeIn || 200) / 1e3;
                return (
                    r.gain.linearRampToValueAtTime(
                        n.volume || 0.2,
                        this.audioContext.currentTime + i
                    ),
                    t.connect(r),
                    r.connect(this.audioContext.destination),
                    t.start(0),
                    this.activeSounds.push(t),
                    (t.gainNode = r),
                    t
                );
            } catch (t) {
                return (this.handleAudioError(t, 'engine_webaudio_start'), null);
            }
        }
        startHTML5Engine(e) {
            if (!e) return null;
            try {
                const t = e.cloneNode(),
                    r = this.soundConfig.engine;
                ((t.loop = !0), (t.volume = r.volume || 0.2));
                const n = t.play();
                return (
                    void 0 !== n &&
                        n.catch((e) => {
                            this.handleAudioError(e, 'engine_html5_start');
                        }),
                    this.activeSounds.push(t),
                    t
                );
            } catch (t) {
                return (this.handleAudioError(t, 'engine_html5_start'), null);
            }
        }
        playExplosionSound() {
            if (!this.isMuted && this.isInitialized)
                try {
                    (this.duckMusicForSoundEffect('explosion'), this.stopEngineSound());
                    const e = this.sounds.explosion;
                    if (!e || !e.loaded) return;
                    'webaudio' === e.type
                        ? this.playWebAudioSound('explosion', e.buffer)
                        : 'html5' === e.type && this.playHTML5Sound('explosion', e.element);
                } catch (e) {
                    this.handleAudioError(e, 'explosion_playback');
                }
        }
        playVictorySound() {
            if (!this.isMuted && this.isInitialized)
                try {
                    const e = this.sounds.victory;
                    if (!e || !e.loaded) return;
                    const t = this.soundConfig.victory.delay || 500;
                    setTimeout(() => {
                        this.isMuted ||
                            (this.duckMusicForSoundEffect('victory'),
                            'webaudio' === e.type
                                ? this.playWebAudioSound('victory', e.buffer)
                                : 'html5' === e.type && this.playHTML5Sound('victory', e.element));
                    }, t);
                } catch (e) {
                    this.handleAudioError(e, 'victory_playback');
                }
        }
        playDefeatSound() {
            if (!this.isMuted && this.isInitialized)
                try {
                    const e = this.sounds.defeat;
                    if (!e || !e.loaded) return;
                    const t = this.soundConfig.defeat.delay || 500;
                    setTimeout(() => {
                        this.isMuted ||
                            (this.duckMusicForSoundEffect('defeat'),
                            'webaudio' === e.type
                                ? this.playWebAudioSound('defeat', e.buffer)
                                : 'html5' === e.type && this.playHTML5Sound('defeat', e.element));
                    }, t);
                } catch (e) {
                    this.handleAudioError(e, 'defeat_playback');
                }
        }
        handleGameStart() {
            return l(this, null, function* () {
                if (!this.isInitialized || this.isMuted) return !1;
                try {
                    return (
                        this.startEngineSound(),
                        !this.musicPlayer || (yield this.musicPlayer.onGameStart())
                    );
                } catch (e) {
                    return (this.handleAudioError(e, 'game_start'), !1);
                }
            });
        }
        handleGamePause() {
            return l(this, null, function* () {
                if (!this.isInitialized) return !1;
                try {
                    return (
                        this.stopEngineSound(),
                        !this.musicPlayer || (yield this.musicPlayer.onGamePause())
                    );
                } catch (e) {
                    return (this.handleAudioError(e, 'game_pause'), !1);
                }
            });
        }
        handleGameResume() {
            return l(this, null, function* () {
                if (!this.isInitialized || this.isMuted) return !1;
                try {
                    return (
                        this.startEngineSound(),
                        !this.musicPlayer || (yield this.musicPlayer.onGameResume())
                    );
                } catch (e) {
                    return (this.handleAudioError(e, 'game_resume'), !1);
                }
            });
        }
        handleGameEnd() {
            return l(this, null, function* () {
                if (!this.isInitialized) return !1;
                try {
                    return (
                        this.stopAllAudio(),
                        !this.musicPlayer || (yield this.musicPlayer.onGameEnd())
                    );
                } catch (e) {
                    return (this.handleAudioError(e, 'game_end'), !1);
                }
            });
        }
        handleGameRestart() {
            return l(this, null, function* () {
                if (!this.isInitialized || this.isMuted) return !1;
                try {
                    return !this.musicPlayer || (yield this.musicPlayer.onGameRestart());
                } catch (e) {
                    return (this.handleAudioError(e, 'game_restart'), !1);
                }
            });
        }
        playPowerUpCollectionSound() {
            if (!this.isMuted && this.isInitialized)
                try {
                    const e = this.sounds.powerup_collect;
                    if (!e || !e.loaded) return;
                    'webaudio' === e.type
                        ? this.playWebAudioSound('powerup_collect', e.buffer)
                        : 'html5' === e.type && this.playHTML5Sound('powerup_collect', e.element);
                } catch (e) {
                    this.handleAudioError(e, 'powerup_collection_playback');
                }
        }
        playShrinkWarningSound() {
            if (!this.isMuted && this.isInitialized)
                try {
                    const e = this.sounds.shrink_warning;
                    if (!e || !e.loaded) return;
                    'webaudio' === e.type
                        ? this.playWebAudioSound('shrink_warning', e.buffer)
                        : 'html5' === e.type && this.playHTML5Sound('shrink_warning', e.element);
                } catch (e) {
                    this.handleAudioError(e, 'shrink_warning_playback');
                }
        }
        playShrinkExecuteSound() {
            if (!this.isMuted && this.isInitialized)
                try {
                    const e = this.sounds.shrink_execute;
                    if (!e || !e.loaded) return;
                    'webaudio' === e.type
                        ? this.playWebAudioSound('shrink_execute', e.buffer)
                        : 'html5' === e.type && this.playHTML5Sound('shrink_execute', e.element);
                } catch (e) {
                    this.handleAudioError(e, 'shrink_execute_playback');
                }
        }
        startBufferCleanup() {
            this.bufferCleanupInterval ||
                (this.bufferCleanupInterval = setInterval(() => {
                    this.performBufferCleanup();
                }, this.bufferCleanupFrequency));
        }
        stopBufferCleanup() {
            this.bufferCleanupInterval &&
                (clearInterval(this.bufferCleanupInterval), (this.bufferCleanupInterval = null));
        }
        performBufferCleanup() {
            try {
                ((this.activeSounds = this.activeSounds.filter(
                    (e) =>
                        !!e &&
                        !(
                            'finished' === e.playbackState ||
                            (e.context && 'closed' === e.context.state)
                        ) &&
                        !e.ended &&
                        !e.paused
                )),
                    (this.performanceMetrics.activeSoundsCount = this.activeSounds.length),
                    (this.performanceMetrics.lastCleanupTime = Date.now()));
                let e = 0;
                for (const t in this.sounds) {
                    const r = this.sounds[t];
                    r &&
                        r.buffer &&
                        r.buffer.length &&
                        (e += r.buffer.numberOfChannels * r.buffer.length * 4);
                }
                this.performanceMetrics.bufferMemoryUsage = e;
            } catch (e) {
                this.handleAudioError(e, 'buffer_cleanup');
            }
        }
        enforcePlaybackLimits() {
            for (; this.activeSounds.length > this.maxConcurrentSounds; ) {
                const t = this.activeSounds.shift();
                if (t)
                    try {
                        t.stop ? t.stop() : t.pause && t.pause();
                    } catch (e) {
                        this.handleAudioError(e, 'playback_limit_enforcement');
                    }
            }
        }
        getPerformanceMetrics() {
            return u(s({}, this.performanceMetrics), {
                maxConcurrentSounds: this.maxConcurrentSounds,
                isInitialized: this.isInitialized,
                isMuted: this.isMuted,
            });
        }
        initializeMusicSystem() {
            return l(this, null, function* () {
                if (this.musicInitialized || !this.audioContext) return !1;
                try {
                    const { MusicPlayer: e } = oc || ac,
                        { MusicSettings: t } = yl || ml;
                    ((this.musicSettings = new t()),
                        (this.musicPlayer = new e(this, this.musicSettings)));
                    return (yield this.musicPlayer.initialize(this.audioContext))
                        ? ((this.musicInitialized = !0),
                          uc.info('Music system initialized successfully'),
                          !0)
                        : (uc.warn('Music system initialization failed, continuing without music'),
                          !1);
                } catch (e) {
                    return (
                        this.handleAudioError(e, 'music_initialization'),
                        uc.warn('Music system unavailable, continuing without music'),
                        !1
                    );
                }
            });
        }
        getMusicPlayer() {
            return this.musicPlayer;
        }
        getMusicSettings() {
            return this.musicSettings;
        }
        isMusicAvailable() {
            return !!(this.musicInitialized && this.musicPlayer && this.musicSettings);
        }
        startMusic() {
            if (!this.isMusicAvailable() || this.isMuted) return !1;
            try {
                return this.musicPlayer.play();
            } catch (e) {
                return (this.handleAudioError(e, 'music_start'), !1);
            }
        }
        stopMusic() {
            if (!this.isMusicAvailable()) return !1;
            try {
                return this.musicPlayer.stop();
            } catch (e) {
                return (this.handleAudioError(e, 'music_stop'), !1);
            }
        }
        pauseMusic() {
            if (!this.isMusicAvailable()) return !1;
            try {
                return this.musicPlayer.pause();
            } catch (e) {
                return (this.handleAudioError(e, 'music_pause'), !1);
            }
        }
        resumeMusic() {
            if (!this.isMusicAvailable() || this.isMuted) return !1;
            try {
                return this.musicPlayer.play();
            } catch (e) {
                return (this.handleAudioError(e, 'music_resume'), !1);
            }
        }
        setMusicVolume(e) {
            if (!this.isMusicAvailable()) return !1;
            try {
                return this.musicPlayer.setVolume(e);
            } catch (t) {
                return (this.handleAudioError(t, 'music_volume'), !1);
            }
        }
        getMusicVolume() {
            if (!this.isMusicAvailable()) return 0;
            try {
                return this.musicPlayer.getVolume();
            } catch (e) {
                return (this.handleAudioError(e, 'music_get_volume'), 0);
            }
        }
        setMusicTrack(e) {
            if (!this.isMusicAvailable()) return !1;
            try {
                return this.musicPlayer.setTrack(e);
            } catch (t) {
                return (this.handleAudioError(t, 'music_set_track'), !1);
            }
        }
        getAvailableMusicTracks() {
            if (!this.isMusicAvailable()) return [];
            try {
                return this.musicPlayer.getAvailableTracks();
            } catch (e) {
                return (this.handleAudioError(e, 'music_get_tracks'), []);
            }
        }
        isMusicPlaying() {
            if (!this.isMusicAvailable()) return !1;
            try {
                return this.musicPlayer.isPlaying();
            } catch (e) {
                return (this.handleAudioError(e, 'music_is_playing'), !1);
            }
        }
        fadeMusicIn(e = null) {
            return l(this, null, function* () {
                if (!this.isMusicAvailable() || this.isMuted) return !1;
                try {
                    return yield this.musicPlayer.fadeIn(e);
                } catch (t) {
                    return (this.handleAudioError(t, 'music_fade_in'), !1);
                }
            });
        }
        fadeMusicOut(e = null) {
            return l(this, null, function* () {
                if (!this.isMusicAvailable()) return !1;
                try {
                    return yield this.musicPlayer.fadeOut(e);
                } catch (t) {
                    return (this.handleAudioError(t, 'music_fade_out'), !1);
                }
            });
        }
        duckMusicForSoundEffect(e) {
            if (!this.isMusicAvailable()) return !1;
            try {
                return this.musicPlayer.onSoundEffect(e);
            } catch (t) {
                return (this.handleAudioError(t, 'music_ducking'), !1);
            }
        }
        cleanup() {
            if ((this.stopAllAudio(), this.stopBufferCleanup(), this.musicPlayer)) {
                try {
                    this.musicPlayer.cleanup();
                } catch (e) {
                    this.handleAudioError(e, 'music_cleanup');
                }
                this.musicPlayer = null;
            }
            if (
                ((this.musicSettings = null),
                (this.musicInitialized = !1),
                this.audioContext && 'closed' !== this.audioContext.state)
            )
                try {
                    this.audioContext.close();
                } catch (e) {
                    this.handleAudioError(e, 'context_cleanup');
                }
            ((this.sounds = {}), (this.audioContext = null), (this.isInitialized = !1));
        }
    },
};
const lc = (null == sc.exports ? {} : sc.exports).default || sc.exports,
    cc = Object.freeze(
        Object.defineProperty({ __proto__: null, default: lc }, Symbol.toStringTag, {
            value: 'Module',
        })
    );
export { sl as _, ul as a, lc as b, cc as c };
//# sourceMappingURL=audio-HEIL7APB.js.map
