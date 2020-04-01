/*!
 * ====================================================
 * Kity Minder Core - v1.4.51 - 2020-04-01
 * https://github.com/fex-team/kityminder-core
 * GitHub: https://github.com/fex-team/kityminder-core.git 
 * Copyright (c) 2020 Baidu FEX; Licensed BSD-3-Clause
 * ====================================================
 */

(function () {
var _p = {
    r: function(index) {
        if (_p[index].inited) {
            return _p[index].value;
        }
        if (typeof _p[index].value === "function") {
            var module = {
                exports: {}
            }, returnValue = _p[index].value(null, module.exports, module);
            _p[index].inited = true;
            _p[index].value = returnValue;
            if (returnValue !== undefined) {
                return returnValue;
            } else {
                for (var key in module.exports) {
                    if (module.exports.hasOwnProperty(key)) {
                        _p[index].inited = true;
                        _p[index].value = module.exports;
                        return module.exports;
                    }
                }
            }
        } else {
            _p[index].inited = true;
            return _p[index].value;
        }
    }
};

//src/connect/arc.js
/**
 * @fileOverview
 *
 * 圆弧连线
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[0] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        var connectMarker = new kity.Marker().pipe(function() {
            var r = 7;
            var dot = new kity.Circle(r - 1);
            this.addShape(dot);
            this.setRef(r - 1, 0).setViewBox(-r, -r, r + r, r + r).setWidth(r).setHeight(r);
            this.dot = dot;
            this.node.setAttribute("markerUnits", "userSpaceOnUse");
        });
        connect.register("arc", function(node, parent, connection, width, color) {
            var box = node.getLayoutBox(), pBox = parent.getLayoutBox();
            var start, end, vector;
            var abs = Math.abs;
            var pathData = [];
            var side = box.x > pBox.x ? "right" : "left";
            node.getMinder().getPaper().addResource(connectMarker);
            start = new kity.Point(pBox.cx, pBox.cy);
            end = side == "left" ? new kity.Point(box.right + 2, box.cy) : new kity.Point(box.left - 2, box.cy);
            vector = kity.Vector.fromPoints(start, end);
            pathData.push("M", start);
            pathData.push("A", abs(vector.x), abs(vector.y), 0, 0, vector.x * vector.y > 0 ? 0 : 1, end);
            connection.setMarker(connectMarker);
            connectMarker.dot.fill(color);
            connection.setPathData(pathData);
        });
    }
};

//src/connect/arc_tp.js
/**
 *
 * 圆弧连线
 *
 * @author: along
 * @copyright: bpd729@163.com , 2015
 */
_p[1] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        var connectMarker = new kity.Marker().pipe(function() {
            var r = 7;
            var dot = new kity.Circle(r - 1);
            this.addShape(dot);
            this.setRef(r - 1, 0).setViewBox(-r, -r, r + r, r + r).setWidth(r).setHeight(r);
            this.dot = dot;
            this.node.setAttribute("markerUnits", "userSpaceOnUse");
        });
        /**
     * 天盘图连线除了连接当前节点和前一个节点外, 还需要渲染当前节点和后一个节点的连接, 防止样式上的断线
     * 这是天盘图与其余的模板不同的地方
     */
        connect.register("arc_tp", function(node, parent, connection, width, color) {
            var end_box = node.getLayoutBox(), start_box = parent.getLayoutBox();
            var index = node.getIndex();
            var nextNode = parent.getChildren()[index + 1];
            if (node.getIndex() > 0) {
                start_box = parent.getChildren()[index - 1].getLayoutBox();
            }
            var start, end, vector;
            var abs = Math.abs;
            var pathData = [];
            var side = end_box.x > start_box.x ? "right" : "left";
            node.getMinder().getPaper().addResource(connectMarker);
            start = new kity.Point(start_box.cx, start_box.cy);
            end = new kity.Point(end_box.cx, end_box.cy);
            var jl = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2));
            //两圆中心点距离
            jl = node.getIndex() == 0 ? jl * .4 : jl;
            vector = kity.Vector.fromPoints(start, end);
            pathData.push("M", start);
            pathData.push("A", jl, jl, 0, 0, 1, end);
            connection.setMarker(connectMarker);
            connectMarker.dot.fill(color);
            connection.setPathData(pathData);
            // 设置下一个的节点的连接线
            if (nextNode && nextNode.getConnection()) {
                var nextConnection = nextNode.getConnection();
                var next_end_box = nextNode.getLayoutBox();
                var next_end = new kity.Point(next_end_box.cx, next_end_box.cy);
                var jl2 = Math.sqrt(Math.pow(end.x - next_end.x, 2) + Math.pow(end.y - next_end.y, 2));
                //两圆中心点距离
                pathData = [];
                pathData.push("M", end);
                pathData.push("A", jl2, jl2, 0, 0, 1, next_end);
                nextConnection.setMarker(connectMarker);
                connectMarker.dot.fill(color);
                nextConnection.setPathData(pathData);
            }
        });
    }
};

//src/connect/bezier.js
/**
 * @fileOverview
 *
 * 提供折线相连的方法
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[2] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        connect.register("bezier", function(node, parent, connection) {
            // 连线起点和终点
            var po = parent.getLayoutVertexOut(), pi = node.getLayoutVertexIn();
            // 连线矢量和方向
            var v = parent.getLayoutVectorOut().normalize();
            var r = Math.round;
            var abs = Math.abs;
            var pathData = [];
            pathData.push("M", r(po.x), r(po.y));
            if (abs(v.x) > abs(v.y)) {
                // x - direction
                var hx = (pi.x + po.x) / 2;
                pathData.push("C", hx, po.y, hx, pi.y, pi.x, pi.y);
            } else {
                // y - direction
                var hy = (pi.y + po.y) / 2;
                pathData.push("C", po.x, hy, pi.x, hy, pi.x, pi.y);
            }
            connection.setMarker(null);
            connection.setPathData(pathData);
        });
    }
};

//src/connect/fish-bone-master.js
/**
 * @fileOverview
 *
 * 鱼骨头主干连线
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[3] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        connect.register("fish-bone-master", function(node, parent, connection) {
            var pout = parent.getLayoutVertexOut(), pin = node.getLayoutVertexIn();
            var abs = Math.abs;
            var dy = abs(pout.y - pin.y), dx = abs(pout.x - pin.x);
            var pathData = [];
            pathData.push("M", pout.x, pout.y);
            pathData.push("h", dx - dy);
            pathData.push("L", pin.x, pin.y);
            connection.setMarker(null);
            connection.setPathData(pathData);
        });
    }
};

//src/connect/l.js
/**
 * @fileOverview
 *
 * "L" 连线
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[4] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        connect.register("l", function(node, parent, connection) {
            var po = parent.getLayoutVertexOut();
            var pi = node.getLayoutVertexIn();
            var vo = parent.getLayoutVectorOut();
            var pathData = [];
            var r = Math.round, abs = Math.abs;
            pathData.push("M", po.round());
            if (abs(vo.x) > abs(vo.y)) {
                pathData.push("H", r(pi.x));
            } else {
                pathData.push("V", pi.y);
            }
            pathData.push("L", pi);
            connection.setPathData(pathData);
        });
    }
};

//src/connect/leader-line.js
/*! LeaderLine v1.0.5 (c) anseki https://anseki.github.io/leader-line/ */
/*
by zhh 2020-3-17 10:42:31
修改1._p[5]={
value: function(require, exports) {原内容;exports.LeaderLine = LeaderLine;}
修改2.pointer-events:none!important;=>pointer-events:auto!important;
*/
_p[5] = {
    value: function(require, exports) {
        var LeaderLine = function() {
            "use strict";
            var te, g, y, S, _, o, t, h, f, p, a, i, l, v = "leader-line", M = 1, I = 2, C = 3, L = 4, n = {
                top: M,
                right: I,
                bottom: C,
                left: L
            }, A = 1, V = 2, P = 3, N = 4, T = 5, m = {
                straight: A,
                arc: V,
                fluid: P,
                magnet: N,
                grid: T
            }, ne = "behind", r = v + "-defs", s = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="leader-line-defs"><style><![CDATA[.leader-line{position:absolute;overflow:visible!important;pointer-events:none!important;font-size:16px;z-index: 99;}#leader-line-defs{width:0;height:0;position:absolute;left:0;top:0}.leader-line-line-path{fill:none}.leader-line-mask-bg-rect{fill:#fff}.leader-line-caps-mask-anchor,.leader-line-caps-mask-marker-shape{fill:#000}.leader-line-caps-mask-anchor{stroke:#000}.leader-line-caps-mask-line,.leader-line-plugs-face{stroke:transparent}.leader-line-line-mask-shape{stroke:#fff}.leader-line-line-outline-mask-shape{stroke:#000}.leader-line-plug-mask-shape{fill:#fff;stroke:#000}.leader-line-plug-outline-mask-shape{fill:#000;stroke:#fff}.leader-line-areaAnchor{position:absolute;overflow:visible!important}]]></style><defs><circle id="leader-line-disc" cx="0" cy="0" r="5"/><rect id="leader-line-square" x="-5" y="-5" width="10" height="10"/><polygon id="leader-line-arrow1" points="-8,-8 8,0 -8,8 -5,0"/><polygon id="leader-line-arrow2" points="-4,-8 4,0 -4,8 -7,5 -2,0 -7,-5"/><polygon id="leader-line-arrow3" points="-4,-5 8,0 -4,5"/><g id="leader-line-hand"><path style="fill: #fcfcfc" d="M9.19 11.14h4.75c1.38 0 2.49-1.11 2.49-2.49 0-.51-.15-.98-.41-1.37h1.3c1.38 0 2.49-1.11 2.49-2.49s-1.11-2.53-2.49-2.53h1.02c1.38 0 2.49-1.11 2.49-2.49s-1.11-2.49-2.49-2.49h14.96c1.37 0 2.49-1.11 2.49-2.49s-1.11-2.49-2.49-2.49H16.58C16-9.86 14.28-11.14 9.7-11.14c-4.79 0-6.55 3.42-7.87 4.73H-2.14v13.23h3.68C3.29 9.97 5.47 11.14 9.19 11.14L9.19 11.14Z"/><path style="fill: black" d="M13.95 12c1.85 0 3.35-1.5 3.35-3.35 0-.17-.02-.34-.04-.51h.07c1.85 0 3.35-1.5 3.35-3.35 0-.79-.27-1.51-.72-2.08 1.03-.57 1.74-1.67 1.74-2.93 0-.59-.16-1.15-.43-1.63h12.04c1.85 0 3.35-1.5 3.35-3.35 0-1.85-1.5-3.35-3.35-3.35H17.2C16.26-10.93 13.91-12 9.7-12 5.36-12 3.22-9.4 1.94-7.84c0 0-.29.33-.5.57-.63 0-3.58 0-3.58 0C-2.61-7.27-3-6.88-3-6.41v13.23c0 .47.39.86.86.86 0 0 2.48 0 3.2 0C2.9 10.73 5.29 12 9.19 12L13.95 12ZM9.19 10.28c-3.46 0-5.33-1.05-6.9-3.87-.15-.27-.44-.44-.75-.44 0 0-1.81 0-2.82 0V-5.55c1.06 0 3.11 0 3.11 0 .25 0 .44-.06.61-.25l.83-.95c1.23-1.49 2.91-3.53 6.43-3.53 3.45 0 4.9.74 5.57 1.72h-4.3c-.48 0-.86.38-.86.86s.39.86.86.86h22.34c.9 0 1.63.73 1.63 1.63 0 .9-.73 1.63-1.63 1.63H15.83c-.48 0-.86.38-.86.86 0 .47.39.86.86.86h2.52c.9 0 1.63.73 1.63 1.63s-.73 1.63-1.63 1.63h-3.12c-.48 0-.86.38-.86.86 0 .47.39.86.86.86h2.11c.88 0 1.63.76 1.63 1.67 0 .9-.73 1.63-1.63 1.63h-3.2c-.48 0-.86.39-.86.86 0 .47.39.86.86.86h1.36c.05.16.09.34.09.51 0 .9-.73 1.63-1.63 1.63C13.95 10.28 9.19 10.28 9.19 10.28Z"/></g><g id="leader-line-crosshair"><path d="M0-78.97c-43.54 0-78.97 35.43-78.97 78.97 0 43.54 35.43 78.97 78.97 78.97s78.97-35.43 78.97-78.97C78.97-43.54 43.55-78.97 0-78.97ZM76.51-1.21h-9.91v-9.11h-2.43v9.11h-11.45c-.64-28.12-23.38-50.86-51.5-51.5V-64.17h9.11V-66.6h-9.11v-9.91C42.46-75.86 75.86-42.45 76.51-1.21ZM-1.21-30.76h-9.11v2.43h9.11V-4.2c-1.44.42-2.57 1.54-2.98 2.98H-28.33v-9.11h-2.43v9.11H-50.29C-49.65-28-27.99-49.65-1.21-50.29V-30.76ZM-30.76 1.21v9.11h2.43v-9.11H-4.2c.42 1.44 1.54 2.57 2.98 2.98v24.13h-9.11v2.43h9.11v19.53C-27.99 49.65-49.65 28-50.29 1.21H-30.76ZM1.22 30.75h9.11v-2.43h-9.11V4.2c1.44-.42 2.56-1.54 2.98-2.98h24.13v9.11h2.43v-9.11h19.53C49.65 28 28 49.65 1.22 50.29V30.75ZM30.76-1.21v-9.11h-2.43v9.11H4.2c-.42-1.44-1.54-2.56-2.98-2.98V-28.33h9.11v-2.43h-9.11V-50.29C28-49.65 49.65-28 50.29-1.21H30.76ZM-1.21-76.51v9.91h-9.11v2.43h9.11v11.45c-28.12.64-50.86 23.38-51.5 51.5H-64.17v-9.11H-66.6v9.11h-9.91C-75.86-42.45-42.45-75.86-1.21-76.51ZM-76.51 1.21h9.91v9.11h2.43v-9.11h11.45c.64 28.12 23.38 50.86 51.5 51.5v11.45h-9.11v2.43h9.11v9.91C-42.45 75.86-75.86 42.45-76.51 1.21ZM1.22 76.51v-9.91h9.11v-2.43h-9.11v-11.45c28.12-.64 50.86-23.38 51.5-51.5h11.45v9.11h2.43v-9.11h9.91C75.86 42.45 42.45 75.86 1.22 76.51Z"/><path d="M0 83.58-7.1 96 7.1 96Z"/><path d="M0-83.58 7.1-96-7.1-96"/><path d="M83.58 0 96 7.1 96-7.1Z"/><path d="M-83.58 0-96-7.1-96 7.1Z"/></g></defs></svg>', ae = {
                disc: {
                    elmId: "leader-line-disc",
                    noRotate: !0,
                    bBox: {
                        left: -5,
                        top: -5,
                        width: 10,
                        height: 10,
                        right: 5,
                        bottom: 5
                    },
                    widthR: 2.5,
                    heightR: 2.5,
                    bCircle: 5,
                    sideLen: 5,
                    backLen: 5,
                    overhead: 0,
                    outlineBase: 1,
                    outlineMax: 4
                },
                square: {
                    elmId: "leader-line-square",
                    noRotate: !0,
                    bBox: {
                        left: -5,
                        top: -5,
                        width: 10,
                        height: 10,
                        right: 5,
                        bottom: 5
                    },
                    widthR: 2.5,
                    heightR: 2.5,
                    bCircle: 5,
                    sideLen: 5,
                    backLen: 5,
                    overhead: 0,
                    outlineBase: 1,
                    outlineMax: 4
                },
                arrow1: {
                    elmId: "leader-line-arrow1",
                    bBox: {
                        left: -8,
                        top: -8,
                        width: 16,
                        height: 16,
                        right: 8,
                        bottom: 8
                    },
                    widthR: 4,
                    heightR: 4,
                    bCircle: 8,
                    sideLen: 8,
                    backLen: 8,
                    overhead: 8,
                    outlineBase: 2,
                    outlineMax: 1.5
                },
                arrow2: {
                    elmId: "leader-line-arrow2",
                    bBox: {
                        left: -7,
                        top: -8,
                        width: 11,
                        height: 16,
                        right: 4,
                        bottom: 8
                    },
                    widthR: 2.75,
                    heightR: 4,
                    bCircle: 8,
                    sideLen: 8,
                    backLen: 7,
                    overhead: 4,
                    outlineBase: 1,
                    outlineMax: 1.75
                },
                arrow3: {
                    elmId: "leader-line-arrow3",
                    bBox: {
                        left: -4,
                        top: -5,
                        width: 12,
                        height: 10,
                        right: 8,
                        bottom: 5
                    },
                    widthR: 3,
                    heightR: 2.5,
                    bCircle: 8,
                    sideLen: 5,
                    backLen: 4,
                    overhead: 8,
                    outlineBase: 1,
                    outlineMax: 2.5
                },
                hand: {
                    elmId: "leader-line-hand",
                    bBox: {
                        left: -3,
                        top: -12,
                        width: 40,
                        height: 24,
                        right: 37,
                        bottom: 12
                    },
                    widthR: 10,
                    heightR: 6,
                    bCircle: 37,
                    sideLen: 12,
                    backLen: 3,
                    overhead: 37
                },
                crosshair: {
                    elmId: "leader-line-crosshair",
                    noRotate: !0,
                    bBox: {
                        left: -96,
                        top: -96,
                        width: 192,
                        height: 192,
                        right: 96,
                        bottom: 96
                    },
                    widthR: 48,
                    heightR: 48,
                    bCircle: 96,
                    sideLen: 96,
                    backLen: 96,
                    overhead: 0
                }
            }, E = {
                behind: ne,
                disc: "disc",
                square: "square",
                arrow1: "arrow1",
                arrow2: "arrow2",
                arrow3: "arrow3",
                hand: "hand",
                crosshair: "crosshair"
            }, ie = {
                disc: "disc",
                square: "square",
                arrow1: "arrow1",
                arrow2: "arrow2",
                arrow3: "arrow3",
                hand: "hand",
                crosshair: "crosshair"
            }, W = [ M, I, C, L ], x = "auto", oe = {
                x: "left",
                y: "top",
                width: "width",
                height: "height"
            }, B = 80, R = 4, F = 5, G = 120, D = 8, z = 3.75, j = 10, H = 30, U = .5522847, Z = .25 * Math.PI, u = /^\s*(\-?[\d\.]+)\s*(\%)?\s*$/, b = "http://www.w3.org/2000/svg", e = "-ms-scroll-limit" in document.documentElement.style && "-ms-ime-align" in document.documentElement.style && !window.navigator.msPointerEnabled, le = !e && !!document.uniqueID, re = "MozAppearance" in document.documentElement.style, se = !(e || re || !window.chrome || !window.CSS), ue = !e && !le && !re && !se && !window.chrome && "WebkitAppearance" in document.documentElement.style, he = le || e ? .2 : .1, pe = {
                path: P,
                lineColor: "coral",
                lineSize: 4,
                plugSE: [ ne, "arrow1" ],
                plugSizeSE: [ 1, 1 ],
                lineOutlineEnabled: !1,
                lineOutlineColor: "indianred",
                lineOutlineSize: .25,
                plugOutlineEnabledSE: [ !1, !1 ],
                plugOutlineSizeSE: [ 1, 1 ]
            }, k = (a = {}.toString, i = {}.hasOwnProperty.toString, l = i.call(Object), function(e) {
                var t, n;
                return e && "[object Object]" === a.call(e) && (!(t = Object.getPrototypeOf(e)) || (n = t.hasOwnProperty("constructor") && t.constructor) && "function" == typeof n && i.call(n) === l);
            }), w = Number.isFinite || function(e) {
                return "number" == typeof e && window.isFinite(e);
            }, c = function() {
                var e, x = {
                    ease: [ .25, .1, .25, 1 ],
                    linear: [ 0, 0, 1, 1 ],
                    "ease-in": [ .42, 0, 1, 1 ],
                    "ease-out": [ 0, 0, .58, 1 ],
                    "ease-in-out": [ .42, 0, .58, 1 ]
                }, b = 1e3 / 60 / 2, t = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(e) {
                    setTimeout(e, b);
                }, n = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(e) {
                    clearTimeout(e);
                }, a = Number.isFinite || function(e) {
                    return "number" == typeof e && window.isFinite(e);
                }, k = [], w = 0;
                function l() {
                    var i = Date.now(), o = !1;
                    e && (n.call(window, e), e = null), k.forEach(function(e) {
                        var t, n, a;
                        if (e.framesStart) {
                            if ((t = i - e.framesStart) >= e.duration && e.count && e.loopsLeft <= 1) return a = e.frames[e.lastFrame = e.reverse ? 0 : e.frames.length - 1], 
                            e.frameCallback(a.value, !0, a.timeRatio, a.outputRatio), void (e.framesStart = null);
                            if (t > e.duration) {
                                if (n = Math.floor(t / e.duration), e.count) {
                                    if (n >= e.loopsLeft) return a = e.frames[e.lastFrame = e.reverse ? 0 : e.frames.length - 1], 
                                    e.frameCallback(a.value, !0, a.timeRatio, a.outputRatio), void (e.framesStart = null);
                                    e.loopsLeft -= n;
                                }
                                e.framesStart += e.duration * n, t = i - e.framesStart;
                            }
                            e.reverse && (t = e.duration - t), a = e.frames[e.lastFrame = Math.round(t / b)], 
                            !1 !== e.frameCallback(a.value, !1, a.timeRatio, a.outputRatio) ? o = !0 : e.framesStart = null;
                        }
                    }), o && (e = t.call(window, l));
                }
                function O(e, t) {
                    e.framesStart = Date.now(), null != t && (e.framesStart -= e.duration * (e.reverse ? 1 - t : t)), 
                    e.loopsLeft = e.count, e.lastFrame = null, l();
                }
                return {
                    add: function(n, e, t, a, i, o, l) {
                        var r, s, u, h, p, c, d, f, y, S, m, g, _, v = ++w;
                        function E(e, t) {
                            return {
                                value: n(t),
                                timeRatio: e,
                                outputRatio: t
                            };
                        }
                        if ("string" == typeof i && (i = x[i]), n = n || function() {}, t < b) s = [ E(0, 0), E(1, 1) ]; else {
                            if (u = b / t, s = [ E(0, 0) ], 0 === i[0] && 0 === i[1] && 1 === i[2] && 1 === i[3]) for (p = u; p <= 1; p += u) s.push(E(p, p)); else for (c = h = (p = u) / 10; c <= 1; c += h) void 0, 
                            S = (y = (f = c) * f) * f, _ = 3 * (m = 1 - f) * y, p <= (d = {
                                x: (g = 3 * (m * m) * f) * i[0] + _ * i[2] + S,
                                y: g * i[1] + _ * i[3] + S
                            }).x && (s.push(E(d.x, d.y)), p += u);
                            s.push(E(1, 1));
                        }
                        return r = {
                            animId: v,
                            frameCallback: e,
                            duration: t,
                            count: a,
                            frames: s,
                            reverse: !!o
                        }, k.push(r), !1 !== l && O(r, l), v;
                    },
                    remove: function(n) {
                        var a;
                        k.some(function(e, t) {
                            return e.animId === n && (a = t, !(e.framesStart = null));
                        }) && k.splice(a, 1);
                    },
                    start: function(t, n, a) {
                        k.some(function(e) {
                            return e.animId === t && (e.reverse = !!n, O(e, a), !0);
                        });
                    },
                    stop: function(t, n) {
                        var a;
                        return k.some(function(e) {
                            return e.animId === t && (n ? null != e.lastFrame && (a = e.frames[e.lastFrame].timeRatio) : (a = (Date.now() - e.framesStart) / e.duration, 
                            e.reverse && (a = 1 - a), a < 0 ? a = 0 : 1 < a && (a = 1)), !(e.framesStart = null));
                        }), a;
                    },
                    validTiming: function(t) {
                        return "string" == typeof t ? x[t] : Array.isArray(t) && [ 0, 1, 2, 3 ].every(function(e) {
                            return a(t[e]) && 0 <= t[e] && t[e] <= 1;
                        }) ? [ t[0], t[1], t[2], t[3] ] : null;
                    }
                };
            }(), d = function(e) {
                e.SVGPathElement.prototype.getPathData && e.SVGPathElement.prototype.setPathData || function() {
                    var i = {
                        Z: "Z",
                        M: "M",
                        L: "L",
                        C: "C",
                        Q: "Q",
                        A: "A",
                        H: "H",
                        V: "V",
                        S: "S",
                        T: "T",
                        z: "Z",
                        m: "m",
                        l: "l",
                        c: "c",
                        q: "q",
                        a: "a",
                        h: "h",
                        v: "v",
                        s: "s",
                        t: "t"
                    }, o = function(e) {
                        this._string = e, this._currentIndex = 0, this._endIndex = this._string.length, 
                        this._prevCommand = null, this._skipOptionalSpaces();
                    }, l = -1 !== e.navigator.userAgent.indexOf("MSIE ");
                    o.prototype = {
                        parseSegment: function() {
                            var e = this._string[this._currentIndex], t = i[e] ? i[e] : null;
                            if (null === t) {
                                if (null === this._prevCommand) return null;
                                if (null === (t = ("+" === e || "-" === e || "." === e || "0" <= e && e <= "9") && "Z" !== this._prevCommand ? "M" === this._prevCommand ? "L" : "m" === this._prevCommand ? "l" : this._prevCommand : null)) return null;
                            } else this._currentIndex += 1;
                            var n = null, a = (this._prevCommand = t).toUpperCase();
                            return "H" === a || "V" === a ? n = [ this._parseNumber() ] : "M" === a || "L" === a || "T" === a ? n = [ this._parseNumber(), this._parseNumber() ] : "S" === a || "Q" === a ? n = [ this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber() ] : "C" === a ? n = [ this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber() ] : "A" === a ? n = [ this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseArcFlag(), this._parseArcFlag(), this._parseNumber(), this._parseNumber() ] : "Z" === a && (this._skipOptionalSpaces(), 
                            n = []), null === n || 0 <= n.indexOf(null) ? null : {
                                type: t,
                                values: n
                            };
                        },
                        hasMoreData: function() {
                            return this._currentIndex < this._endIndex;
                        },
                        peekSegmentType: function() {
                            var e = this._string[this._currentIndex];
                            return i[e] ? i[e] : null;
                        },
                        initialCommandIsMoveTo: function() {
                            if (!this.hasMoreData()) return !0;
                            var e = this.peekSegmentType();
                            return "M" === e || "m" === e;
                        },
                        _isCurrentSpace: function() {
                            var e = this._string[this._currentIndex];
                            return e <= " " && (" " === e || "\n" === e || "\t" === e || "\r" === e || "\f" === e);
                        },
                        _skipOptionalSpaces: function() {
                            for (;this._currentIndex < this._endIndex && this._isCurrentSpace(); ) this._currentIndex += 1;
                            return this._currentIndex < this._endIndex;
                        },
                        _skipOptionalSpacesOrDelimiter: function() {
                            return !(this._currentIndex < this._endIndex && !this._isCurrentSpace() && "," !== this._string[this._currentIndex]) && (this._skipOptionalSpaces() && this._currentIndex < this._endIndex && "," === this._string[this._currentIndex] && (this._currentIndex += 1, 
                            this._skipOptionalSpaces()), this._currentIndex < this._endIndex);
                        },
                        _parseNumber: function() {
                            var e = 0, t = 0, n = 1, a = 0, i = 1, o = 1, l = this._currentIndex;
                            if (this._skipOptionalSpaces(), this._currentIndex < this._endIndex && "+" === this._string[this._currentIndex] ? this._currentIndex += 1 : this._currentIndex < this._endIndex && "-" === this._string[this._currentIndex] && (this._currentIndex += 1, 
                            i = -1), this._currentIndex === this._endIndex || (this._string[this._currentIndex] < "0" || "9" < this._string[this._currentIndex]) && "." !== this._string[this._currentIndex]) return null;
                            for (var r = this._currentIndex; this._currentIndex < this._endIndex && "0" <= this._string[this._currentIndex] && this._string[this._currentIndex] <= "9"; ) this._currentIndex += 1;
                            if (this._currentIndex !== r) for (var s = this._currentIndex - 1, u = 1; r <= s; ) t += u * (this._string[s] - "0"), 
                            s -= 1, u *= 10;
                            if (this._currentIndex < this._endIndex && "." === this._string[this._currentIndex]) {
                                if (this._currentIndex += 1, this._currentIndex >= this._endIndex || this._string[this._currentIndex] < "0" || "9" < this._string[this._currentIndex]) return null;
                                for (;this._currentIndex < this._endIndex && "0" <= this._string[this._currentIndex] && this._string[this._currentIndex] <= "9"; ) n *= 10, 
                                a += (this._string.charAt(this._currentIndex) - "0") / n, this._currentIndex += 1;
                            }
                            if (this._currentIndex !== l && this._currentIndex + 1 < this._endIndex && ("e" === this._string[this._currentIndex] || "E" === this._string[this._currentIndex]) && "x" !== this._string[this._currentIndex + 1] && "m" !== this._string[this._currentIndex + 1]) {
                                if (this._currentIndex += 1, "+" === this._string[this._currentIndex] ? this._currentIndex += 1 : "-" === this._string[this._currentIndex] && (this._currentIndex += 1, 
                                o = -1), this._currentIndex >= this._endIndex || this._string[this._currentIndex] < "0" || "9" < this._string[this._currentIndex]) return null;
                                for (;this._currentIndex < this._endIndex && "0" <= this._string[this._currentIndex] && this._string[this._currentIndex] <= "9"; ) e *= 10, 
                                e += this._string[this._currentIndex] - "0", this._currentIndex += 1;
                            }
                            var h = t + a;
                            return h *= i, e && (h *= Math.pow(10, o * e)), l === this._currentIndex ? null : (this._skipOptionalSpacesOrDelimiter(), 
                            h);
                        },
                        _parseArcFlag: function() {
                            if (this._currentIndex >= this._endIndex) return null;
                            var e = null, t = this._string[this._currentIndex];
                            if (this._currentIndex += 1, "0" === t) e = 0; else {
                                if ("1" !== t) return null;
                                e = 1;
                            }
                            return this._skipOptionalSpacesOrDelimiter(), e;
                        }
                    };
                    var a = function(e) {
                        if (!e || 0 === e.length) return [];
                        var t = new o(e), n = [];
                        if (t.initialCommandIsMoveTo()) for (;t.hasMoreData(); ) {
                            var a = t.parseSegment();
                            if (null === a) break;
                            n.push(a);
                        }
                        return n;
                    }, n = e.SVGPathElement.prototype.setAttribute, r = e.SVGPathElement.prototype.removeAttribute, d = e.Symbol ? e.Symbol() : "__cachedPathData", f = e.Symbol ? e.Symbol() : "__cachedNormalizedPathData", U = function(e, t, n, a, i, o, l, r, s, u) {
                        var h, p, c, d, f, y = function(e, t, n) {
                            return {
                                x: e * Math.cos(n) - t * Math.sin(n),
                                y: e * Math.sin(n) + t * Math.cos(n)
                            };
                        }, S = (h = l, Math.PI * h / 180), m = [];
                        if (u) p = u[0], c = u[1], d = u[2], f = u[3]; else {
                            var g = y(e, t, -S);
                            e = g.x, t = g.y;
                            var _ = y(n, a, -S), v = (e - (n = _.x)) / 2, E = (t - (a = _.y)) / 2, x = v * v / (i * i) + E * E / (o * o);
                            1 < x && (i *= x = Math.sqrt(x), o *= x);
                            var b = i * i, k = o * o, w = b * k - b * E * E - k * v * v, O = b * E * E + k * v * v, M = (r === s ? -1 : 1) * Math.sqrt(Math.abs(w / O));
                            d = M * i * E / o + (e + n) / 2, f = M * -o * v / i + (t + a) / 2, p = Math.asin(parseFloat(((t - f) / o).toFixed(9))), 
                            c = Math.asin(parseFloat(((a - f) / o).toFixed(9))), e < d && (p = Math.PI - p), 
                            n < d && (c = Math.PI - c), p < 0 && (p = 2 * Math.PI + p), c < 0 && (c = 2 * Math.PI + c), 
                            s && c < p && (p -= 2 * Math.PI), !s && p < c && (c -= 2 * Math.PI);
                        }
                        var I = c - p;
                        if (Math.abs(I) > 120 * Math.PI / 180) {
                            var C = c, L = n, A = a;
                            c = s && p < c ? p + 120 * Math.PI / 180 * 1 : p + 120 * Math.PI / 180 * -1, n = d + i * Math.cos(c), 
                            a = f + o * Math.sin(c), m = U(n, a, L, A, i, o, l, 0, s, [ c, C, d, f ]);
                        }
                        I = c - p;
                        var V = Math.cos(p), P = Math.sin(p), N = Math.cos(c), T = Math.sin(c), W = Math.tan(I / 4), B = 4 / 3 * i * W, R = 4 / 3 * o * W, F = [ e, t ], G = [ e + B * P, t - R * V ], D = [ n + B * T, a - R * N ], z = [ n, a ];
                        if (G[0] = 2 * F[0] - G[0], G[1] = 2 * F[1] - G[1], u) return [ G, D, z ].concat(m);
                        m = [ G, D, z ].concat(m).join().split(",");
                        var j = [], H = [];
                        return m.forEach(function(e, t) {
                            t % 2 ? H.push(y(m[t - 1], m[t], S).y) : H.push(y(m[t], m[t + 1], S).x), 6 === H.length && (j.push(H), 
                            H = []);
                        }), j;
                    }, y = function(e) {
                        return e.map(function(e) {
                            return {
                                type: e.type,
                                values: Array.prototype.slice.call(e.values)
                            };
                        });
                    }, S = function(e) {
                        var S = [], m = null, g = null, _ = null, v = null, E = null, x = null, b = null;
                        return e.forEach(function(e) {
                            if ("M" === e.type) {
                                var t = e.values[0], n = e.values[1];
                                S.push({
                                    type: "M",
                                    values: [ t, n ]
                                }), v = x = t, E = b = n;
                            } else if ("C" === e.type) {
                                var a = e.values[0], i = e.values[1], o = e.values[2], l = e.values[3];
                                t = e.values[4], n = e.values[5];
                                S.push({
                                    type: "C",
                                    values: [ a, i, o, l, t, n ]
                                }), g = o, _ = l, v = t, E = n;
                            } else if ("L" === e.type) {
                                t = e.values[0], n = e.values[1];
                                S.push({
                                    type: "L",
                                    values: [ t, n ]
                                }), v = t, E = n;
                            } else if ("H" === e.type) {
                                t = e.values[0];
                                S.push({
                                    type: "L",
                                    values: [ t, E ]
                                }), v = t;
                            } else if ("V" === e.type) {
                                n = e.values[0];
                                S.push({
                                    type: "L",
                                    values: [ v, n ]
                                }), E = n;
                            } else if ("S" === e.type) {
                                o = e.values[0], l = e.values[1], t = e.values[2], n = e.values[3];
                                "C" === m || "S" === m ? (r = v + (v - g), s = E + (E - _)) : (r = v, s = E), S.push({
                                    type: "C",
                                    values: [ r, s, o, l, t, n ]
                                }), g = o, _ = l, v = t, E = n;
                            } else if ("T" === e.type) {
                                t = e.values[0], n = e.values[1];
                                "Q" === m || "T" === m ? (a = v + (v - g), i = E + (E - _)) : (a = v, i = E);
                                var r = v + 2 * (a - v) / 3, s = E + 2 * (i - E) / 3, u = t + 2 * (a - t) / 3, h = n + 2 * (i - n) / 3;
                                S.push({
                                    type: "C",
                                    values: [ r, s, u, h, t, n ]
                                }), g = a, _ = i, v = t, E = n;
                            } else if ("Q" === e.type) {
                                a = e.values[0], i = e.values[1], t = e.values[2], n = e.values[3], r = v + 2 * (a - v) / 3, 
                                s = E + 2 * (i - E) / 3, u = t + 2 * (a - t) / 3, h = n + 2 * (i - n) / 3;
                                S.push({
                                    type: "C",
                                    values: [ r, s, u, h, t, n ]
                                }), g = a, _ = i, v = t, E = n;
                            } else if ("A" === e.type) {
                                var p = e.values[0], c = e.values[1], d = e.values[2], f = e.values[3], y = e.values[4];
                                t = e.values[5], n = e.values[6];
                                if (0 === p || 0 === c) S.push({
                                    type: "C",
                                    values: [ v, E, t, n, t, n ]
                                }), v = t, E = n; else if (v !== t || E !== n) U(v, E, t, n, p, c, d, f, y).forEach(function(e) {
                                    S.push({
                                        type: "C",
                                        values: e
                                    }), v = t, E = n;
                                });
                            } else "Z" === e.type && (S.push(e), v = x, E = b);
                            m = e.type;
                        }), S;
                    };
                    e.SVGPathElement.prototype.setAttribute = function(e, t) {
                        "d" === e && (this[d] = null, this[f] = null), n.call(this, e, t);
                    }, e.SVGPathElement.prototype.removeAttribute = function(e, t) {
                        "d" === e && (this[d] = null, this[f] = null), r.call(this, e);
                    }, e.SVGPathElement.prototype.getPathData = function(e) {
                        if (e && e.normalize) {
                            if (this[f]) return y(this[f]);
                            this[d] ? n = y(this[d]) : (n = a(this.getAttribute("d") || ""), this[d] = y(n));
                            var t = S((s = [], c = p = h = u = null, n.forEach(function(e) {
                                var t = e.type;
                                if ("M" === t) {
                                    var n = e.values[0], a = e.values[1];
                                    s.push({
                                        type: "M",
                                        values: [ n, a ]
                                    }), u = p = n, h = c = a;
                                } else if ("m" === t) n = u + e.values[0], a = h + e.values[1], s.push({
                                    type: "M",
                                    values: [ n, a ]
                                }), u = p = n, h = c = a; else if ("L" === t) n = e.values[0], a = e.values[1], 
                                s.push({
                                    type: "L",
                                    values: [ n, a ]
                                }), u = n, h = a; else if ("l" === t) n = u + e.values[0], a = h + e.values[1], 
                                s.push({
                                    type: "L",
                                    values: [ n, a ]
                                }), u = n, h = a; else if ("C" === t) {
                                    var i = e.values[0], o = e.values[1], l = e.values[2], r = e.values[3];
                                    n = e.values[4], a = e.values[5], s.push({
                                        type: "C",
                                        values: [ i, o, l, r, n, a ]
                                    }), u = n, h = a;
                                } else "c" === t ? (i = u + e.values[0], o = h + e.values[1], l = u + e.values[2], 
                                r = h + e.values[3], n = u + e.values[4], a = h + e.values[5], s.push({
                                    type: "C",
                                    values: [ i, o, l, r, n, a ]
                                }), u = n, h = a) : "Q" === t ? (i = e.values[0], o = e.values[1], n = e.values[2], 
                                a = e.values[3], s.push({
                                    type: "Q",
                                    values: [ i, o, n, a ]
                                }), u = n, h = a) : "q" === t ? (i = u + e.values[0], o = h + e.values[1], n = u + e.values[2], 
                                a = h + e.values[3], s.push({
                                    type: "Q",
                                    values: [ i, o, n, a ]
                                }), u = n, h = a) : "A" === t ? (n = e.values[5], a = e.values[6], s.push({
                                    type: "A",
                                    values: [ e.values[0], e.values[1], e.values[2], e.values[3], e.values[4], n, a ]
                                }), u = n, h = a) : "a" === t ? (n = u + e.values[5], a = h + e.values[6], s.push({
                                    type: "A",
                                    values: [ e.values[0], e.values[1], e.values[2], e.values[3], e.values[4], n, a ]
                                }), u = n, h = a) : "H" === t ? (n = e.values[0], s.push({
                                    type: "H",
                                    values: [ n ]
                                }), u = n) : "h" === t ? (n = u + e.values[0], s.push({
                                    type: "H",
                                    values: [ n ]
                                }), u = n) : "V" === t ? (a = e.values[0], s.push({
                                    type: "V",
                                    values: [ a ]
                                }), h = a) : "v" === t ? (a = h + e.values[0], s.push({
                                    type: "V",
                                    values: [ a ]
                                }), h = a) : "S" === t ? (l = e.values[0], r = e.values[1], n = e.values[2], a = e.values[3], 
                                s.push({
                                    type: "S",
                                    values: [ l, r, n, a ]
                                }), u = n, h = a) : "s" === t ? (l = u + e.values[0], r = h + e.values[1], n = u + e.values[2], 
                                a = h + e.values[3], s.push({
                                    type: "S",
                                    values: [ l, r, n, a ]
                                }), u = n, h = a) : "T" === t ? (n = e.values[0], a = e.values[1], s.push({
                                    type: "T",
                                    values: [ n, a ]
                                }), u = n, h = a) : "t" === t ? (n = u + e.values[0], a = h + e.values[1], s.push({
                                    type: "T",
                                    values: [ n, a ]
                                }), u = n, h = a) : "Z" !== t && "z" !== t || (s.push({
                                    type: "Z",
                                    values: []
                                }), u = p, h = c);
                            }), s));
                            return this[f] = y(t), t;
                        }
                        if (this[d]) return y(this[d]);
                        var s, u, h, p, c, n = a(this.getAttribute("d") || "");
                        return this[d] = y(n), n;
                    }, e.SVGPathElement.prototype.setPathData = function(e) {
                        if (0 === e.length) l ? this.setAttribute("d", "") : this.removeAttribute("d"); else {
                            for (var t = "", n = 0, a = e.length; n < a; n += 1) {
                                var i = e[n];
                                0 < n && (t += " "), t += i.type, i.values && 0 < i.values.length && (t += " " + i.values.join(" "));
                            }
                            this.setAttribute("d", t);
                        }
                    }, e.SVGRectElement.prototype.getPathData = function(e) {
                        var t = this.x.baseVal.value, n = this.y.baseVal.value, a = this.width.baseVal.value, i = this.height.baseVal.value, o = this.hasAttribute("rx") ? this.rx.baseVal.value : this.ry.baseVal.value, l = this.hasAttribute("ry") ? this.ry.baseVal.value : this.rx.baseVal.value;
                        a / 2 < o && (o = a / 2), i / 2 < l && (l = i / 2);
                        var r = [ {
                            type: "M",
                            values: [ t + o, n ]
                        }, {
                            type: "H",
                            values: [ t + a - o ]
                        }, {
                            type: "A",
                            values: [ o, l, 0, 0, 1, t + a, n + l ]
                        }, {
                            type: "V",
                            values: [ n + i - l ]
                        }, {
                            type: "A",
                            values: [ o, l, 0, 0, 1, t + a - o, n + i ]
                        }, {
                            type: "H",
                            values: [ t + o ]
                        }, {
                            type: "A",
                            values: [ o, l, 0, 0, 1, t, n + i - l ]
                        }, {
                            type: "V",
                            values: [ n + l ]
                        }, {
                            type: "A",
                            values: [ o, l, 0, 0, 1, t + o, n ]
                        }, {
                            type: "Z",
                            values: []
                        } ];
                        return r = r.filter(function(e) {
                            return "A" !== e.type || 0 !== e.values[0] && 0 !== e.values[1];
                        }), e && !0 === e.normalize && (r = S(r)), r;
                    }, e.SVGCircleElement.prototype.getPathData = function(e) {
                        var t = this.cx.baseVal.value, n = this.cy.baseVal.value, a = this.r.baseVal.value, i = [ {
                            type: "M",
                            values: [ t + a, n ]
                        }, {
                            type: "A",
                            values: [ a, a, 0, 0, 1, t, n + a ]
                        }, {
                            type: "A",
                            values: [ a, a, 0, 0, 1, t - a, n ]
                        }, {
                            type: "A",
                            values: [ a, a, 0, 0, 1, t, n - a ]
                        }, {
                            type: "A",
                            values: [ a, a, 0, 0, 1, t + a, n ]
                        }, {
                            type: "Z",
                            values: []
                        } ];
                        return e && !0 === e.normalize && (i = S(i)), i;
                    }, e.SVGEllipseElement.prototype.getPathData = function(e) {
                        var t = this.cx.baseVal.value, n = this.cy.baseVal.value, a = this.rx.baseVal.value, i = this.ry.baseVal.value, o = [ {
                            type: "M",
                            values: [ t + a, n ]
                        }, {
                            type: "A",
                            values: [ a, i, 0, 0, 1, t, n + i ]
                        }, {
                            type: "A",
                            values: [ a, i, 0, 0, 1, t - a, n ]
                        }, {
                            type: "A",
                            values: [ a, i, 0, 0, 1, t, n - i ]
                        }, {
                            type: "A",
                            values: [ a, i, 0, 0, 1, t + a, n ]
                        }, {
                            type: "Z",
                            values: []
                        } ];
                        return e && !0 === e.normalize && (o = S(o)), o;
                    }, e.SVGLineElement.prototype.getPathData = function() {
                        return [ {
                            type: "M",
                            values: [ this.x1.baseVal.value, this.y1.baseVal.value ]
                        }, {
                            type: "L",
                            values: [ this.x2.baseVal.value, this.y2.baseVal.value ]
                        } ];
                    }, e.SVGPolylineElement.prototype.getPathData = function() {
                        for (var e = [], t = 0; t < this.points.numberOfItems; t += 1) {
                            var n = this.points.getItem(t);
                            e.push({
                                type: 0 === t ? "M" : "L",
                                values: [ n.x, n.y ]
                            });
                        }
                        return e;
                    }, e.SVGPolygonElement.prototype.getPathData = function() {
                        for (var e = [], t = 0; t < this.points.numberOfItems; t += 1) {
                            var n = this.points.getItem(t);
                            e.push({
                                type: 0 === t ? "M" : "L",
                                values: [ n.x, n.y ]
                            });
                        }
                        return e.push({
                            type: "Z",
                            values: []
                        }), e;
                    };
                }();
            }, O = function(n) {
                var a = {};
                function i(e) {
                    if (a[e]) return a[e].exports;
                    var t = a[e] = {
                        i: e,
                        l: !1,
                        exports: {}
                    };
                    return n[e].call(t.exports, t, t.exports, i), t.l = !0, t.exports;
                }
                return i.m = n, i.c = a, i.d = function(e, t, n) {
                    i.o(e, t) || Object.defineProperty(e, t, {
                        configurable: !1,
                        enumerable: !0,
                        get: n
                    });
                }, i.r = function(e) {
                    Object.defineProperty(e, "__esModule", {
                        value: !0
                    });
                }, i.n = function(e) {
                    var t = e && e.__esModule ? function() {
                        return e.default;
                    } : function() {
                        return e;
                    };
                    return i.d(t, "a", t), t;
                }, i.o = function(e, t) {
                    return Object.prototype.hasOwnProperty.call(e, t);
                }, i.p = "", i(i.s = 0);
            }([ function(e, t, n) {
                n.r(t);
                var a = 500, i = [], o = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(e) {
                    return setTimeout(e, 1e3 / 60);
                }, l = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(e) {
                    return clearTimeout(e);
                }, r = void 0, s = Date.now();
                function u() {
                    var t = void 0, e = void 0;
                    r && (l.call(window, r), r = null), i.forEach(function(e) {
                        e.event && (e.listener(e.event), e.event = null, t = !0);
                    }), t ? (s = Date.now(), e = !0) : Date.now() - s < a && (e = !0), e && (r = o.call(window, u));
                }
                function h(n) {
                    var a = -1;
                    return i.some(function(e, t) {
                        return e.listener === n && (a = t, !0);
                    }), a;
                }
                var p = {
                    add: function(e) {
                        var t = void 0;
                        return -1 === h(e) ? (i.push(t = {
                            listener: e
                        }), function(e) {
                            t.event = e, r || u();
                        }) : null;
                    },
                    remove: function(e) {
                        var t;
                        -1 < (t = h(e)) && (i.splice(t, 1), !i.length && r && (l.call(window, r), r = null));
                    }
                };
                t.default = p;
            } ]).default, Y = {
                line_altColor: {
                    iniValue: !1
                },
                line_color: {},
                line_colorTra: {
                    iniValue: !1
                },
                line_strokeWidth: {},
                plug_enabled: {
                    iniValue: !1
                },
                plug_enabledSE: {
                    hasSE: !0,
                    iniValue: !1
                },
                plug_plugSE: {
                    hasSE: !0,
                    iniValue: ne
                },
                plug_colorSE: {
                    hasSE: !0
                },
                plug_colorTraSE: {
                    hasSE: !0,
                    iniValue: !1
                },
                plug_markerWidthSE: {
                    hasSE: !0
                },
                plug_markerHeightSE: {
                    hasSE: !0
                },
                lineOutline_enabled: {
                    iniValue: !1
                },
                lineOutline_color: {},
                lineOutline_colorTra: {
                    iniValue: !1
                },
                lineOutline_strokeWidth: {},
                lineOutline_inStrokeWidth: {},
                plugOutline_enabledSE: {
                    hasSE: !0,
                    iniValue: !1
                },
                plugOutline_plugSE: {
                    hasSE: !0,
                    iniValue: ne
                },
                plugOutline_colorSE: {
                    hasSE: !0
                },
                plugOutline_colorTraSE: {
                    hasSE: !0,
                    iniValue: !1
                },
                plugOutline_strokeWidthSE: {
                    hasSE: !0
                },
                plugOutline_inStrokeWidthSE: {
                    hasSE: !0
                },
                position_socketXYSE: {
                    hasSE: !0,
                    hasProps: !0
                },
                position_plugOverheadSE: {
                    hasSE: !0
                },
                position_path: {},
                position_lineStrokeWidth: {},
                position_socketGravitySE: {
                    hasSE: !0
                },
                path_pathData: {},
                path_edge: {
                    hasProps: !0
                },
                viewBox_bBox: {
                    hasProps: !0
                },
                viewBox_plugBCircleSE: {
                    hasSE: !0
                },
                lineMask_enabled: {
                    iniValue: !1
                },
                lineMask_outlineMode: {
                    iniValue: !1
                },
                lineMask_x: {},
                lineMask_y: {},
                lineOutlineMask_x: {},
                lineOutlineMask_y: {},
                maskBGRect_x: {},
                maskBGRect_y: {},
                capsMaskAnchor_enabledSE: {
                    hasSE: !0,
                    iniValue: !1
                },
                capsMaskAnchor_pathDataSE: {
                    hasSE: !0
                },
                capsMaskAnchor_strokeWidthSE: {
                    hasSE: !0
                },
                capsMaskMarker_enabled: {
                    iniValue: !1
                },
                capsMaskMarker_enabledSE: {
                    hasSE: !0,
                    iniValue: !1
                },
                capsMaskMarker_plugSE: {
                    hasSE: !0,
                    iniValue: ne
                },
                capsMaskMarker_markerWidthSE: {
                    hasSE: !0
                },
                capsMaskMarker_markerHeightSE: {
                    hasSE: !0
                },
                caps_enabled: {
                    iniValue: !1
                },
                attach_plugSideLenSE: {
                    hasSE: !0
                },
                attach_plugBackLenSE: {
                    hasSE: !0
                }
            }, X = {
                show_on: {},
                show_effect: {},
                show_animOptions: {},
                show_animId: {},
                show_inAnim: {}
            }, q = "fade", Q = [], K = {}, J = 0, $ = {}, ee = 0;
            function ce(t, n) {
                var e, a;
                return typeof t != typeof n || (e = k(t) ? "obj" : Array.isArray(t) ? "array" : "") != (k(n) ? "obj" : Array.isArray(n) ? "array" : "") || ("obj" === e ? ce(a = Object.keys(t).sort(), Object.keys(n).sort()) || a.some(function(e) {
                    return ce(t[e], n[e]);
                }) : "array" === e ? t.length !== n.length || t.some(function(e, t) {
                    return ce(e, n[t]);
                }) : t !== n);
            }
            function de(n) {
                return n ? k(n) ? Object.keys(n).reduce(function(e, t) {
                    return e[t] = de(n[t]), e;
                }, {}) : Array.isArray(n) ? n.map(de) : n : n;
            }
            function fe(e) {
                var t, n, a, i = 1, o = e = (e + "").trim();
                function l(e) {
                    var t = 1, n = u.exec(e);
                    return n && (t = parseFloat(n[1]), n[2] ? t = 0 <= t && t <= 100 ? t / 100 : 1 : (t < 0 || 1 < t) && (t = 1)), 
                    t;
                }
                return (t = /^(rgba|hsla|hwb|gray|device\-cmyk)\s*\(([\s\S]+)\)$/i.exec(e)) ? (n = t[1].toLowerCase(), 
                a = t[2].trim().split(/\s*,\s*/), "rgba" === n && 4 === a.length ? (i = l(a[3]), 
                o = "rgb(" + a.slice(0, 3).join(", ") + ")") : "hsla" === n && 4 === a.length ? (i = l(a[3]), 
                o = "hsl(" + a.slice(0, 3).join(", ") + ")") : "hwb" === n && 4 === a.length ? (i = l(a[3]), 
                o = "hwb(" + a.slice(0, 3).join(", ") + ")") : "gray" === n && 2 === a.length ? (i = l(a[1]), 
                o = "gray(" + a[0] + ")") : "device-cmyk" === n && 5 <= a.length && (i = l(a[4]), 
                o = "device-cmyk(" + a.slice(0, 4).join(", ") + ")")) : (t = /^\#(?:([\da-f]{6})([\da-f]{2})|([\da-f]{3})([\da-f]))$/i.exec(e)) ? t[1] ? (i = parseInt(t[2], 16) / 255, 
                o = "#" + t[1]) : (i = parseInt(t[4] + t[4], 16) / 255, o = "#" + t[3]) : "transparent" === e.toLocaleLowerCase() && (i = 0), 
                [ i, o ];
            }
            function ye(e) {
                return !(!e || e.nodeType !== Node.ELEMENT_NODE || "function" != typeof e.getBoundingClientRect);
            }
            function Se(e, t) {
                var n, a, i, o, l = {};
                if (!(i = e.ownerDocument)) return console.error("Cannot get document that contains the element."), 
                null;
                if (e.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_DISCONNECTED) return console.error("A disconnected element was passed."), 
                null;
                for (a in n = e.getBoundingClientRect()) l[a] = n[a];
                if (!t) {
                    if (!(o = i.defaultView)) return console.error("Cannot get window that contains the element."), 
                    null;
                    l.left += o.pageXOffset, l.right += o.pageXOffset, l.top += o.pageYOffset, l.bottom += o.pageYOffset;
                }
                return l;
            }
            function me(e, t) {
                var n, a, i = [], o = e;
                for (t = t || window; ;) {
                    if (!(n = o.ownerDocument)) return console.error("Cannot get document that contains the element."), 
                    null;
                    if (!(a = n.defaultView)) return console.error("Cannot get window that contains the element."), 
                    null;
                    if (a === t) break;
                    if (!(o = a.frameElement)) return console.error("`baseWindow` was not found."), 
                    null;
                    i.unshift(o);
                }
                return i;
            }
            function ge(e, t) {
                var n, a, o = 0, l = 0;
                return (a = me(e, t = t || window)) ? a.length ? (a.forEach(function(e, t) {
                    var n, a, i = Se(e, 0 < t);
                    o += i.left, l += i.top, a = (n = e).ownerDocument.defaultView.getComputedStyle(n, ""), 
                    i = {
                        left: n.clientLeft + parseFloat(a.paddingLeft),
                        top: n.clientTop + parseFloat(a.paddingTop)
                    }, o += i.left, l += i.top;
                }), (n = Se(e, !0)).left += o, n.right += o, n.top += l, n.bottom += l, n) : Se(e) : null;
            }
            function _e(e, t) {
                var n = e.x - t.x, a = e.y - t.y;
                return Math.sqrt(n * n + a * a);
            }
            function ve(e, t, n) {
                var a = t.x - e.x, i = t.y - e.y;
                return {
                    x: e.x + a * n,
                    y: e.y + i * n,
                    angle: Math.atan2(i, a) / (Math.PI / 180)
                };
            }
            function Ee(e, t, n) {
                var a = Math.atan2(e.y - t.y, t.x - e.x);
                return {
                    x: t.x + Math.cos(a) * n,
                    y: t.y + Math.sin(a) * n * -1
                };
            }
            function xe(e, t, n, a, i) {
                var o = i * i, l = o * i, r = 1 - i, s = r * r, u = s * r, h = u * e.x + 3 * s * i * t.x + 3 * r * o * n.x + l * a.x, p = u * e.y + 3 * s * i * t.y + 3 * r * o * n.y + l * a.y, c = e.x + 2 * i * (t.x - e.x) + o * (n.x - 2 * t.x + e.x), d = e.y + 2 * i * (t.y - e.y) + o * (n.y - 2 * t.y + e.y), f = t.x + 2 * i * (n.x - t.x) + o * (a.x - 2 * n.x + t.x), y = t.y + 2 * i * (n.y - t.y) + o * (a.y - 2 * n.y + t.y), S = r * e.x + i * t.x, m = r * e.y + i * t.y, g = r * n.x + i * a.x, _ = r * n.y + i * a.y, v = 90 - 180 * Math.atan2(c - f, d - y) / Math.PI;
                return {
                    x: h,
                    y: p,
                    fromP2: {
                        x: c,
                        y: d
                    },
                    toP1: {
                        x: f,
                        y: y
                    },
                    fromP1: {
                        x: S,
                        y: m
                    },
                    toP2: {
                        x: g,
                        y: _
                    },
                    angle: v += 180 < v ? -180 : 180
                };
            }
            function be(n, a, i, o, e) {
                function l(e, t, n, a, i) {
                    return e * (e * (-3 * t + 9 * n - 9 * a + 3 * i) + 6 * t - 12 * n + 6 * a) - 3 * t + 3 * n;
                }
                var r, s, u, h, p, c = [ .2491, .2491, .2335, .2335, .2032, .2032, .1601, .1601, .1069, .1069, .0472, .0472 ], d = 0;
                return r = (e = null == e || 1 < e ? 1 : e < 0 ? 0 : e) / 2, [ -.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816 ].forEach(function(e, t) {
                    u = l(s = r * e + r, n.x, a.x, i.x, o.x), h = l(s, n.y, a.y, i.y, o.y), p = u * u + h * h, 
                    d += c[t] * Math.sqrt(p);
                }), r * d;
            }
            function ke(e, t, n, a, i) {
                for (var o, l = .5, r = 1 - l; o = be(e, t, n, a, r), !(Math.abs(o - i) <= .01); ) r += (o < i ? 1 : -1) * (l /= 2);
                return r;
            }
            function we(e, n) {
                var a;
                return e.forEach(function(e) {
                    var t = n ? e.map(function(e) {
                        var t = {
                            x: e.x,
                            y: e.y
                        };
                        return n(t), t;
                    }) : e;
                    a || (a = [ {
                        type: "M",
                        values: [ t[0].x, t[0].y ]
                    } ]), a.push(t.length ? 2 === t.length ? {
                        type: "L",
                        values: [ t[1].x, t[1].y ]
                    } : {
                        type: "C",
                        values: [ t[1].x, t[1].y, t[2].x, t[2].y, t[3].x, t[3].y ]
                    } : {
                        type: "Z",
                        values: []
                    });
                }), a;
            }
            function Oe(e) {
                var n = [], a = 0;
                return e.forEach(function(e) {
                    var t = (2 === e.length ? _e : be).apply(null, e);
                    n.push(t), a += t;
                }), {
                    segsLen: n,
                    lenAll: a
                };
            }
            function Me(e, a) {
                return null == e || null == a || e.length !== a.length || e.some(function(e, t) {
                    var n = a[t];
                    return e.type !== n.type || e.values.some(function(e, t) {
                        return e !== n.values[t];
                    });
                });
            }
            function Ie(e, t, n) {
                e.events[t] ? e.events[t].indexOf(n) < 0 && e.events[t].push(n) : e.events[t] = [ n ];
            }
            function Ce(e, t, n) {
                var a;
                e.events[t] && -1 < (a = e.events[t].indexOf(n)) && e.events[t].splice(a, 1);
            }
            function Le(e) {
                t && clearTimeout(t), Q.push(e), t = setTimeout(function() {
                    Q.forEach(function(e) {
                        e();
                    }), Q = [];
                }, 0);
            }
            function Ae(e, t) {
                e.reflowTargets.indexOf(t) < 0 && e.reflowTargets.push(t);
            }
            function Ve(e) {
                e.reflowTargets.forEach(function(e) {
                    var n;
                    n = e, setTimeout(function() {
                        var e = n.parentNode, t = n.nextSibling;
                        e.insertBefore(e.removeChild(n), t);
                    }, 0);
                }), e.reflowTargets = [];
            }
            function Pe(e, t, n, a, i, o, l) {
                var r, s, u;
                "auto-start-reverse" === n ? ("boolean" != typeof h && (t.setAttribute("orient", "auto-start-reverse"), 
                h = t.orientType.baseVal === SVGMarkerElement.SVG_MARKER_ORIENT_UNKNOWN), h ? t.setAttribute("orient", n) : ((r = i.createSVGTransform()).setRotate(180, 0, 0), 
                o.transform.baseVal.appendItem(r), t.setAttribute("orient", "auto"), u = !0)) : (t.setAttribute("orient", n), 
                !1 === h && o.transform.baseVal.clear()), s = t.viewBox.baseVal, u ? (s.x = -a.right, 
                s.y = -a.bottom) : (s.x = a.left, s.y = a.top), s.width = a.width, s.height = a.height, 
                le && Ae(e, l);
            }
            function Ne(e, t) {
                return {
                    prop: e ? "markerEnd" : "markerStart",
                    orient: t ? t.noRotate ? "0" : e ? "auto" : "auto-start-reverse" : null
                };
            }
            function Te(n, a) {
                Object.keys(a).forEach(function(e) {
                    var t = a[e];
                    n[e] = null != t.iniValue ? t.hasSE ? [ t.iniValue, t.iniValue ] : t.iniValue : t.hasSE ? t.hasProps ? [ {}, {} ] : [] : t.hasProps ? {} : null;
                });
            }
            function We(t, e, n, a, i) {
                return a !== e[n] && (e[n] = a, i && i.forEach(function(e) {
                    e(t, a, n);
                }), !0);
            }
            function Be(e) {
                function t(e, t) {
                    return e + parseFloat(t);
                }
                var n = e.document, a = e.getComputedStyle(n.documentElement, ""), i = e.getComputedStyle(n.body, ""), o = {
                    x: 0,
                    y: 0
                };
                return "static" !== i.position ? (o.x -= [ a.marginLeft, a.borderLeftWidth, a.paddingLeft, i.marginLeft, i.borderLeftWidth ].reduce(t, 0), 
                o.y -= [ a.marginTop, a.borderTopWidth, a.paddingTop, i.marginTop, i.borderTopWidth ].reduce(t, 0)) : "static" !== a.position && (o.x -= [ a.marginLeft, a.borderLeftWidth ].reduce(t, 0), 
                o.y -= [ a.marginTop, a.borderTopWidth ].reduce(t, 0)), o;
            }
            function Re(e) {
                var t, n = e.document;
                n.getElementById(r) || (t = new e.DOMParser().parseFromString(s, "image/svg+xml"), 
                n.body.appendChild(t.documentElement), d(e));
            }
            function Fe(u) {
                var _, f, v, e, n, a, i, y, s, h, p, t, o, l, r, c, d, S, m, g = u.options, E = u.curStats, x = u.aplStats, b = E.position_socketXYSE, k = !1;
                function w(e, t) {
                    var n = t === M ? {
                        x: e.left + e.width / 2,
                        y: e.top
                    } : t === I ? {
                        x: e.right,
                        y: e.top + e.height / 2
                    } : t === C ? {
                        x: e.left + e.width / 2,
                        y: e.bottom
                    } : {
                        x: e.left,
                        y: e.top + e.height / 2
                    };
                    return n.socketId = t, n;
                }
                function O(e) {
                    return {
                        x: e.x,
                        y: e.y
                    };
                }
                if (E.position_path = g.path, E.position_lineStrokeWidth = E.line_strokeWidth, E.position_socketGravitySE = _ = de(g.socketGravitySE), 
                f = [ 0, 1 ].map(function(e) {
                    var t, n, a, i = g.anchorSE[e], o = u.optionIsAttach.anchorSE[e], l = !1 !== o ? $[i._id] : null, r = !1 !== o && l.conf.getStrokeWidth ? l.conf.getStrokeWidth(l, u) : 0, s = !1 !== o && l.conf.getBBoxNest ? l.conf.getBBoxNest(l, u, r) : ge(i, u.baseWindow);
                    return E.capsMaskAnchor_pathDataSE[e] = !1 !== o && l.conf.getPathData ? l.conf.getPathData(l, u, r) : (n = null != (t = s).right ? t.right : t.left + t.width, 
                    a = null != t.bottom ? t.bottom : t.top + t.height, [ {
                        type: "M",
                        values: [ t.left, t.top ]
                    }, {
                        type: "L",
                        values: [ n, t.top ]
                    }, {
                        type: "L",
                        values: [ n, a ]
                    }, {
                        type: "L",
                        values: [ t.left, a ]
                    }, {
                        type: "Z",
                        values: []
                    } ]), E.capsMaskAnchor_strokeWidthSE[e] = r, s;
                }), i = -1, g.socketSE[0] && g.socketSE[1] ? (b[0] = w(f[0], g.socketSE[0]), b[1] = w(f[1], g.socketSE[1])) : (g.socketSE[0] || g.socketSE[1] ? (g.socketSE[0] ? (n = 0, 
                a = 1) : (n = 1, a = 0), b[n] = w(f[n], g.socketSE[n]), (e = W.map(function(e) {
                    return w(f[a], e);
                })).forEach(function(e) {
                    var t = _e(e, b[n]);
                    (t < i || -1 === i) && (b[a] = e, i = t);
                })) : (e = W.map(function(e) {
                    return w(f[1], e);
                }), W.map(function(e) {
                    return w(f[0], e);
                }).forEach(function(n) {
                    e.forEach(function(e) {
                        var t = _e(n, e);
                        (t < i || -1 === i) && (b[0] = n, b[1] = e, i = t);
                    });
                })), [ 0, 1 ].forEach(function(e) {
                    var t, n;
                    g.socketSE[e] || (f[e].width || f[e].height ? f[e].width || b[e].socketId !== L && b[e].socketId !== I ? f[e].height || b[e].socketId !== M && b[e].socketId !== C || (b[e].socketId = 0 <= b[e ? 0 : 1].y - f[e].top ? C : M) : b[e].socketId = 0 <= b[e ? 0 : 1].x - f[e].left ? I : L : (t = b[e ? 0 : 1].x - f[e].left, 
                    n = b[e ? 0 : 1].y - f[e].top, b[e].socketId = Math.abs(t) >= Math.abs(n) ? 0 <= t ? I : L : 0 <= n ? C : M));
                })), E.position_path !== x.position_path || E.position_lineStrokeWidth !== x.position_lineStrokeWidth || [ 0, 1 ].some(function(e) {
                    return E.position_plugOverheadSE[e] !== x.position_plugOverheadSE[e] || (i = b[e], 
                    o = x.position_socketXYSE[e], i.x !== o.x || i.y !== o.y || i.socketId !== o.socketId) || (t = _[e], 
                    n = x.position_socketGravitySE[e], (a = null == t ? "auto" : Array.isArray(t) ? "array" : "number") !== (null == n ? "auto" : Array.isArray(n) ? "array" : "number") || ("array" === a ? t[0] !== n[0] || t[1] !== n[1] : t !== n));
                    var t, n, a, i, o;
                })) {
                    switch (u.pathList.baseVal = v = [], u.pathList.animVal = null, E.position_path) {
                      case A:
                        v.push([ O(b[0]), O(b[1]) ]);
                        break;

                      case V:
                        t = "number" == typeof _[0] && 0 < _[0] || "number" == typeof _[1] && 0 < _[1], 
                        o = Z * (t ? -1 : 1), l = Math.atan2(b[1].y - b[0].y, b[1].x - b[0].x), r = -l + o, 
                        c = Math.PI - l - o, d = _e(b[0], b[1]) / Math.sqrt(2) * U, S = {
                            x: b[0].x + Math.cos(r) * d,
                            y: b[0].y + Math.sin(r) * d * -1
                        }, m = {
                            x: b[1].x + Math.cos(c) * d,
                            y: b[1].y + Math.sin(c) * d * -1
                        }, v.push([ O(b[0]), S, m, O(b[1]) ]);
                        break;

                      case P:
                      case N:
                        s = [ _[0], E.position_path === N ? 0 : _[1] ], h = [], p = [], b.forEach(function(e, t) {
                            var n, a, i, o, l, r = s[t];
                            Array.isArray(r) ? n = {
                                x: r[0],
                                y: r[1]
                            } : "number" == typeof r ? n = e.socketId === M ? {
                                x: 0,
                                y: -r
                            } : e.socketId === I ? {
                                x: r,
                                y: 0
                            } : e.socketId === C ? {
                                x: 0,
                                y: r
                            } : {
                                x: -r,
                                y: 0
                            } : (a = b[t ? 0 : 1], o = 0 < (i = E.position_plugOverheadSE[t]) ? G + (D < i ? (i - D) * z : 0) : B + (E.position_lineStrokeWidth > R ? (E.position_lineStrokeWidth - R) * F : 0), 
                            e.socketId === M ? ((l = (e.y - a.y) / 2) < o && (l = o), n = {
                                x: 0,
                                y: -l
                            }) : e.socketId === I ? ((l = (a.x - e.x) / 2) < o && (l = o), n = {
                                x: l,
                                y: 0
                            }) : e.socketId === C ? ((l = (a.y - e.y) / 2) < o && (l = o), n = {
                                x: 0,
                                y: l
                            }) : ((l = (e.x - a.x) / 2) < o && (l = o), n = {
                                x: -l,
                                y: 0
                            })), h[t] = e.x + n.x, p[t] = e.y + n.y;
                        }), v.push([ O(b[0]), {
                            x: h[0],
                            y: p[0]
                        }, {
                            x: h[1],
                            y: p[1]
                        }, O(b[1]) ]);
                        break;

                      case T:
                        !function() {
                            var a, o = 1, l = 2, r = 3, s = 4, u = [ [], [] ], h = [];
                            function p(e) {
                                return e === o ? r : e === l ? s : e === r ? o : l;
                            }
                            function c(e) {
                                return e === l || e === s ? "x" : "y";
                            }
                            function d(e, t, n) {
                                var a = {
                                    x: e.x,
                                    y: e.y
                                };
                                if (n) {
                                    if (n === p(e.dirId)) throw new Error("Invalid dirId: " + n);
                                    a.dirId = n;
                                } else a.dirId = e.dirId;
                                return a.dirId === o ? a.y -= t : a.dirId === l ? a.x += t : a.dirId === r ? a.y += t : a.x -= t, 
                                a;
                            }
                            function f(e, t) {
                                return t.dirId === o ? e.y <= t.y : t.dirId === l ? e.x >= t.x : t.dirId === r ? e.y >= t.y : e.x <= t.x;
                            }
                            function y(e, t) {
                                return t.dirId === o || t.dirId === r ? e.x === t.x : e.y === t.y;
                            }
                            function S(e) {
                                return e[0] ? {
                                    contain: 0,
                                    notContain: 1
                                } : {
                                    contain: 1,
                                    notContain: 0
                                };
                            }
                            function m(e, t, n) {
                                return Math.abs(t[n] - e[n]);
                            }
                            function g(e, t, n) {
                                return "x" === n ? e.x < t.x ? l : s : e.y < t.y ? r : o;
                            }
                            function e() {
                                var e, t, a, i, n = [ f(h[1], h[0]), f(h[0], h[1]) ], o = [ c(h[0].dirId), c(h[1].dirId) ];
                                if (o[0] === o[1]) {
                                    if (n[0] && n[1]) return y(h[1], h[0]) || (h[0][o[0]] === h[1][o[1]] ? (u[0].push(h[0]), 
                                    u[1].push(h[1])) : (e = h[0][o[0]] + (h[1][o[1]] - h[0][o[0]]) / 2, u[0].push(d(h[0], Math.abs(e - h[0][o[0]]))), 
                                    u[1].push(d(h[1], Math.abs(e - h[1][o[1]]))))), !1;
                                    n[0] !== n[1] ? (t = S(n), (a = m(h[t.notContain], h[t.contain], o[t.notContain])) < H && (h[t.notContain] = d(h[t.notContain], H - a)), 
                                    u[t.notContain].push(h[t.notContain]), h[t.notContain] = d(h[t.notContain], H, y(h[t.contain], h[t.notContain]) ? "x" === o[t.notContain] ? r : l : g(h[t.notContain], h[t.contain], "x" === o[t.notContain] ? "y" : "x"))) : (a = m(h[0], h[1], "x" === o[0] ? "y" : "x"), 
                                    u.forEach(function(e, t) {
                                        var n = 0 === t ? 1 : 0;
                                        e.push(h[t]), h[t] = d(h[t], H, 2 * H <= a ? g(h[t], h[n], "x" === o[t] ? "y" : "x") : "x" === o[t] ? r : l);
                                    }));
                                } else {
                                    if (n[0] && n[1]) return y(h[1], h[0]) ? u[1].push(h[1]) : y(h[0], h[1]) ? u[0].push(h[0]) : u[0].push("x" === o[0] ? {
                                        x: h[1].x,
                                        y: h[0].y
                                    } : {
                                        x: h[0].x,
                                        y: h[1].y
                                    }), !1;
                                    n[0] !== n[1] ? (t = S(n), u[t.notContain].push(h[t.notContain]), h[t.notContain] = d(h[t.notContain], H, m(h[t.notContain], h[t.contain], o[t.contain]) >= H ? g(h[t.notContain], h[t.contain], o[t.contain]) : h[t.contain].dirId)) : (i = [ {
                                        x: h[0].x,
                                        y: h[0].y
                                    }, {
                                        x: h[1].x,
                                        y: h[1].y
                                    } ], u.forEach(function(e, t) {
                                        var n = 0 === t ? 1 : 0, a = m(i[t], i[n], o[t]);
                                        a < H && (h[t] = d(h[t], H - a)), e.push(h[t]), h[t] = d(h[t], H, g(h[t], h[n], o[n]));
                                    }));
                                }
                                return !0;
                            }
                            for (b.forEach(function(e, t) {
                                var n, a = O(e), i = _[t];
                                n = Array.isArray(i) ? i[0] < 0 ? [ s, -i[0] ] : 0 < i[0] ? [ l, i[0] ] : i[1] < 0 ? [ o, -i[1] ] : 0 < i[1] ? [ r, i[1] ] : [ e.socketId, 0 ] : "number" != typeof i ? [ e.socketId, H ] : 0 <= i ? [ e.socketId, i ] : [ p(e.socketId), -i ], 
                                a.dirId = n[0], i = n[1], u[t].push(a), h[t] = d(a, i);
                            }); e(); ) ;
                            u[1].reverse(), u[0].concat(u[1]).forEach(function(e, t) {
                                var n = {
                                    x: e.x,
                                    y: e.y
                                };
                                0 < t && v.push([ a, n ]), a = n;
                            });
                        }();
                    }
                    y = [], E.position_plugOverheadSE.forEach(function(e, t) {
                        var n, a, i, o, l, r, s, u, h, p, c, d = !t;
                        0 < e ? 2 === (n = v[a = d ? 0 : v.length - 1]).length ? (y[a] = y[a] || _e.apply(null, n), 
                        y[a] > j && (y[a] - e < j && (e = y[a] - j), i = ve(n[0], n[1], (d ? e : y[a] - e) / y[a]), 
                        v[a] = d ? [ i, n[1] ] : [ n[0], i ], y[a] -= e)) : (y[a] = y[a] || be.apply(null, n), 
                        y[a] > j && (y[a] - e < j && (e = y[a] - j), i = xe(n[0], n[1], n[2], n[3], ke(n[0], n[1], n[2], n[3], d ? e : y[a] - e)), 
                        d ? (o = n[0], l = i.toP1) : (o = n[3], l = i.fromP2), r = Math.atan2(o.y - i.y, i.x - o.x), 
                        s = _e(i, l), i.x = o.x + Math.cos(r) * e, i.y = o.y + Math.sin(r) * e * -1, l.x = i.x + Math.cos(r) * s, 
                        l.y = i.y + Math.sin(r) * s * -1, v[a] = d ? [ i, i.toP1, i.toP2, n[3] ] : [ n[0], i.fromP1, i.fromP2, i ], 
                        y[a] = null)) : e < 0 && (n = v[a = d ? 0 : v.length - 1], u = b[t].socketId, h = u === L || u === I ? "x" : "y", 
                        e < (c = -f[t]["x" === h ? "width" : "height"]) && (e = c), p = e * (u === L || u === M ? -1 : 1), 
                        2 === n.length ? n[d ? 0 : n.length - 1][h] += p : (d ? [ 0, 1 ] : [ n.length - 2, n.length - 1 ]).forEach(function(e) {
                            n[e][h] += p;
                        }), y[a] = null);
                    }), x.position_socketXYSE = de(b), x.position_plugOverheadSE = de(E.position_plugOverheadSE), 
                    x.position_path = E.position_path, x.position_lineStrokeWidth = E.position_lineStrokeWidth, 
                    x.position_socketGravitySE = de(_), k = !0, u.events.apl_position && u.events.apl_position.forEach(function(e) {
                        e(u, v);
                    });
                }
                return k;
            }
            function Ge(t, n) {
                n !== t.isShown && (!!n != !!t.isShown && (t.svg.style.visibility = n ? "" : "hidden"), 
                t.isShown = n, t.events && t.events.svgShow && t.events.svgShow.forEach(function(e) {
                    e(t, n);
                }));
            }
            function De(e, t) {
                var n, a, i, o, l, h, p, c, d, f, r, s, u, y, S, m, g, _, v, E, x, b, k, w, O, M, I, C, L, A, V, P, N, T, W, B, R, F, G, D, z, j, H, U, Z, Y, X, q, Q, K, J, $, ee = {};
                t.line && (ee.line = (a = (n = e).options, i = n.curStats, o = n.events, l = !1, 
                l = We(n, i, "line_color", a.lineColor, o.cur_line_color) || l, l = We(n, i, "line_colorTra", fe(i.line_color)[0] < 1) || l, 
                l = We(n, i, "line_strokeWidth", a.lineSize, o.cur_line_strokeWidth) || l)), (t.plug || ee.line) && (ee.plug = (p = (h = e).options, 
                c = h.curStats, d = h.events, f = !1, [ 0, 1 ].forEach(function(e) {
                    var t, n, a, i, o, l, r, s, u = p.plugSE[e];
                    f = We(h, c.plug_enabledSE, e, u !== ne) || f, f = We(h, c.plug_plugSE, e, u) || f, 
                    f = We(h, c.plug_colorSE, e, s = p.plugColorSE[e] || c.line_color, d.cur_plug_colorSE) || f, 
                    f = We(h, c.plug_colorTraSE, e, fe(s)[0] < 1) || f, u !== ne && (i = n = (t = ae[ie[u]]).widthR * p.plugSizeSE[e], 
                    o = a = t.heightR * p.plugSizeSE[e], ue && (i *= c.line_strokeWidth, o *= c.line_strokeWidth), 
                    f = We(h, c.plug_markerWidthSE, e, i) || f, f = We(h, c.plug_markerHeightSE, e, o) || f, 
                    c.capsMaskMarker_markerWidthSE[e] = n, c.capsMaskMarker_markerHeightSE[e] = a), 
                    c.plugOutline_plugSE[e] = c.capsMaskMarker_plugSE[e] = u, c.plug_enabledSE[e] ? (s = c.line_strokeWidth / pe.lineSize * p.plugSizeSE[e], 
                    c.position_plugOverheadSE[e] = t.overhead * s, c.viewBox_plugBCircleSE[e] = t.bCircle * s, 
                    l = t.sideLen * s, r = t.backLen * s) : (c.position_plugOverheadSE[e] = -c.line_strokeWidth / 2, 
                    c.viewBox_plugBCircleSE[e] = l = r = 0), We(h, c.attach_plugSideLenSE, e, l, d.cur_attach_plugSideLenSE), 
                    We(h, c.attach_plugBackLenSE, e, r, d.cur_attach_plugBackLenSE), c.capsMaskAnchor_enabledSE[e] = !c.plug_enabledSE[e];
                }), f = We(h, c, "plug_enabled", c.plug_enabledSE[0] || c.plug_enabledSE[1]) || f)), 
                (t.lineOutline || ee.line) && (ee.lineOutline = (u = (r = e).options, y = r.curStats, 
                S = !1, S = We(r, y, "lineOutline_enabled", u.lineOutlineEnabled) || S, S = We(r, y, "lineOutline_color", u.lineOutlineColor) || S, 
                S = We(r, y, "lineOutline_colorTra", fe(y.lineOutline_color)[0] < 1) || S, s = y.line_strokeWidth * u.lineOutlineSize, 
                S = We(r, y, "lineOutline_strokeWidth", y.line_strokeWidth - 2 * s) || S, S = We(r, y, "lineOutline_inStrokeWidth", y.lineOutline_colorTra ? y.lineOutline_strokeWidth + 2 * he : y.line_strokeWidth - s) || S)), 
                (t.plugOutline || ee.line || ee.plug || ee.lineOutline) && (ee.plugOutline = (g = (m = e).options, 
                _ = m.curStats, v = !1, [ 0, 1 ].forEach(function(e) {
                    var t, n = _.plugOutline_plugSE[e], a = n !== ne ? ae[ie[n]] : null;
                    v = We(m, _.plugOutline_enabledSE, e, g.plugOutlineEnabledSE[e] && _.plug_enabled && _.plug_enabledSE[e] && !!a && !!a.outlineBase) || v, 
                    v = We(m, _.plugOutline_colorSE, e, t = g.plugOutlineColorSE[e] || _.lineOutline_color) || v, 
                    v = We(m, _.plugOutline_colorTraSE, e, fe(t)[0] < 1) || v, a && a.outlineBase && ((t = g.plugOutlineSizeSE[e]) > a.outlineMax && (t = a.outlineMax), 
                    t *= 2 * a.outlineBase, v = We(m, _.plugOutline_strokeWidthSE, e, t) || v, v = We(m, _.plugOutline_inStrokeWidthSE, e, _.plugOutline_colorTraSE[e] ? t - he / (_.line_strokeWidth / pe.lineSize) / g.plugSizeSE[e] * 2 : t / 2) || v);
                }), v)), (t.faces || ee.line || ee.plug || ee.lineOutline || ee.plugOutline) && (ee.faces = (b = (E = e).curStats, 
                k = E.aplStats, w = E.events, O = !1, !b.line_altColor && We(E, k, "line_color", x = b.line_color, w.apl_line_color) && (E.lineFace.style.stroke = x, 
                O = !0), We(E, k, "line_strokeWidth", x = b.line_strokeWidth, w.apl_line_strokeWidth) && (E.lineShape.style.strokeWidth = x + "px", 
                O = !0, (re || le) && (Ae(E, E.lineShape), le && (Ae(E, E.lineFace), Ae(E, E.lineMaskCaps)))), 
                We(E, k, "lineOutline_enabled", x = b.lineOutline_enabled, w.apl_lineOutline_enabled) && (E.lineOutlineFace.style.display = x ? "inline" : "none", 
                O = !0), b.lineOutline_enabled && (We(E, k, "lineOutline_color", x = b.lineOutline_color, w.apl_lineOutline_color) && (E.lineOutlineFace.style.stroke = x, 
                O = !0), We(E, k, "lineOutline_strokeWidth", x = b.lineOutline_strokeWidth, w.apl_lineOutline_strokeWidth) && (E.lineOutlineMaskShape.style.strokeWidth = x + "px", 
                O = !0, le && (Ae(E, E.lineOutlineMaskCaps), Ae(E, E.lineOutlineFace))), We(E, k, "lineOutline_inStrokeWidth", x = b.lineOutline_inStrokeWidth, w.apl_lineOutline_inStrokeWidth) && (E.lineMaskShape.style.strokeWidth = x + "px", 
                O = !0, le && (Ae(E, E.lineOutlineMaskCaps), Ae(E, E.lineOutlineFace)))), We(E, k, "plug_enabled", x = b.plug_enabled, w.apl_plug_enabled) && (E.plugsFace.style.display = x ? "inline" : "none", 
                O = !0), b.plug_enabled && [ 0, 1 ].forEach(function(n) {
                    var e = b.plug_plugSE[n], t = e !== ne ? ae[ie[e]] : null, a = Ne(n, t);
                    We(E, k.plug_enabledSE, n, x = b.plug_enabledSE[n], w.apl_plug_enabledSE) && (E.plugsFace.style[a.prop] = x ? "url(#" + E.plugMarkerIdSE[n] + ")" : "none", 
                    O = !0), b.plug_enabledSE[n] && (We(E, k.plug_plugSE, n, e, w.apl_plug_plugSE) && (E.plugFaceSE[n].href.baseVal = "#" + t.elmId, 
                    Pe(E, E.plugMarkerSE[n], a.orient, t.bBox, E.svg, E.plugMarkerShapeSE[n], E.plugsFace), 
                    O = !0, re && Ae(E, E.plugsFace)), We(E, k.plug_colorSE, n, x = b.plug_colorSE[n], w.apl_plug_colorSE) && (E.plugFaceSE[n].style.fill = x, 
                    O = !0, (se || ue || le) && !b.line_colorTra && Ae(E, le ? E.lineMaskCaps : E.capsMaskLine)), 
                    [ "markerWidth", "markerHeight" ].forEach(function(e) {
                        var t = "plug_" + e + "SE";
                        We(E, k[t], n, x = b[t][n], w["apl_" + t]) && (E.plugMarkerSE[n][e].baseVal.value = x, 
                        O = !0);
                    }), We(E, k.plugOutline_enabledSE, n, x = b.plugOutline_enabledSE[n], w.apl_plugOutline_enabledSE) && (x ? (E.plugFaceSE[n].style.mask = "url(#" + E.plugMaskIdSE[n] + ")", 
                    E.plugOutlineFaceSE[n].style.display = "inline") : (E.plugFaceSE[n].style.mask = "none", 
                    E.plugOutlineFaceSE[n].style.display = "none"), O = !0), b.plugOutline_enabledSE[n] && (We(E, k.plugOutline_plugSE, n, e, w.apl_plugOutline_plugSE) && (E.plugOutlineFaceSE[n].href.baseVal = E.plugMaskShapeSE[n].href.baseVal = E.plugOutlineMaskShapeSE[n].href.baseVal = "#" + t.elmId, 
                    [ E.plugMaskSE[n], E.plugOutlineMaskSE[n] ].forEach(function(e) {
                        e.x.baseVal.value = t.bBox.left, e.y.baseVal.value = t.bBox.top, e.width.baseVal.value = t.bBox.width, 
                        e.height.baseVal.value = t.bBox.height;
                    }), O = !0), We(E, k.plugOutline_colorSE, n, x = b.plugOutline_colorSE[n], w.apl_plugOutline_colorSE) && (E.plugOutlineFaceSE[n].style.fill = x, 
                    O = !0, le && (Ae(E, E.lineMaskCaps), Ae(E, E.lineOutlineMaskCaps))), We(E, k.plugOutline_strokeWidthSE, n, x = b.plugOutline_strokeWidthSE[n], w.apl_plugOutline_strokeWidthSE) && (E.plugOutlineMaskShapeSE[n].style.strokeWidth = x + "px", 
                    O = !0), We(E, k.plugOutline_inStrokeWidthSE, n, x = b.plugOutline_inStrokeWidthSE[n], w.apl_plugOutline_inStrokeWidthSE) && (E.plugMaskShapeSE[n].style.strokeWidth = x + "px", 
                    O = !0)));
                }), O)), (t.position || ee.line || ee.plug) && (ee.position = Fe(e)), (t.path || ee.position) && (ee.path = (C = (M = e).curStats, 
                L = M.aplStats, A = M.pathList.animVal || M.pathList.baseVal, V = C.path_edge, P = !1, 
                A && (V.x1 = V.x2 = A[0][0].x, V.y1 = V.y2 = A[0][0].y, C.path_pathData = I = we(A, function(e) {
                    e.x < V.x1 && (V.x1 = e.x), e.y < V.y1 && (V.y1 = e.y), e.x > V.x2 && (V.x2 = e.x), 
                    e.y > V.y2 && (V.y2 = e.y);
                }), Me(I, L.path_pathData) && (M.linePath.setPathData(I), L.path_pathData = I, P = !0, 
                le ? (Ae(M, M.plugsFace), Ae(M, M.lineMaskCaps)) : re && Ae(M, M.linePath), M.events.apl_path && M.events.apl_path.forEach(function(e) {
                    e(M, I);
                }))), P)), ee.viewBox = (B = (N = e).curStats, R = N.aplStats, F = B.path_edge, 
                G = B.viewBox_bBox, D = R.viewBox_bBox, z = N.svg.viewBox.baseVal, j = N.svg.style, 
                H = !1, T = Math.max(B.line_strokeWidth / 2, B.viewBox_plugBCircleSE[0] || 0, B.viewBox_plugBCircleSE[1] || 0), 
                W = {
                    x1: F.x1 - T,
                    y1: F.y1 - T,
                    x2: F.x2 + T,
                    y2: F.y2 + T
                }, N.events.new_edge4viewBox && N.events.new_edge4viewBox.forEach(function(e) {
                    e(N, W);
                }), G.x = B.lineMask_x = B.lineOutlineMask_x = B.maskBGRect_x = W.x1, G.y = B.lineMask_y = B.lineOutlineMask_y = B.maskBGRect_y = W.y1, 
                G.width = W.x2 - W.x1, G.height = W.y2 - W.y1, [ "x", "y", "width", "height" ].forEach(function(e) {
                    var t;
                    (t = G[e]) !== D[e] && (z[e] = D[e] = t, j[oe[e]] = t + ("x" === e || "y" === e ? N.bodyOffset[e] : 0) + "px", 
                    H = !0);
                }), H), ee.mask = (Y = (U = e).curStats, X = U.aplStats, q = !1, Y.plug_enabled ? [ 0, 1 ].forEach(function(e) {
                    Y.capsMaskMarker_enabledSE[e] = Y.plug_enabledSE[e] && Y.plug_colorTraSE[e] || Y.plugOutline_enabledSE[e] && Y.plugOutline_colorTraSE[e];
                }) : Y.capsMaskMarker_enabledSE[0] = Y.capsMaskMarker_enabledSE[1] = !1, Y.capsMaskMarker_enabled = Y.capsMaskMarker_enabledSE[0] || Y.capsMaskMarker_enabledSE[1], 
                Y.lineMask_outlineMode = Y.lineOutline_enabled, Y.caps_enabled = Y.capsMaskMarker_enabled || Y.capsMaskAnchor_enabledSE[0] || Y.capsMaskAnchor_enabledSE[1], 
                Y.lineMask_enabled = Y.caps_enabled || Y.lineMask_outlineMode, (Y.lineMask_enabled && !Y.lineMask_outlineMode || Y.lineOutline_enabled) && [ "x", "y" ].forEach(function(e) {
                    var t = "maskBGRect_" + e;
                    We(U, X, t, Z = Y[t]) && (U.maskBGRect[e].baseVal.value = Z, q = !0);
                }), We(U, X, "lineMask_enabled", Z = Y.lineMask_enabled) && (U.lineFace.style.mask = Z ? "url(#" + U.lineMaskId + ")" : "none", 
                q = !0, ue && Ae(U, U.lineMask)), Y.lineMask_enabled && (We(U, X, "lineMask_outlineMode", Z = Y.lineMask_outlineMode) && (Z ? (U.lineMaskBG.style.display = "none", 
                U.lineMaskShape.style.display = "inline") : (U.lineMaskBG.style.display = "inline", 
                U.lineMaskShape.style.display = "none"), q = !0), [ "x", "y" ].forEach(function(e) {
                    var t = "lineMask_" + e;
                    We(U, X, t, Z = Y[t]) && (U.lineMask[e].baseVal.value = Z, q = !0);
                }), We(U, X, "caps_enabled", Z = Y.caps_enabled) && (U.lineMaskCaps.style.display = U.lineOutlineMaskCaps.style.display = Z ? "inline" : "none", 
                q = !0, ue && Ae(U, U.capsMaskLine)), Y.caps_enabled && ([ 0, 1 ].forEach(function(e) {
                    var t;
                    We(U, X.capsMaskAnchor_enabledSE, e, Z = Y.capsMaskAnchor_enabledSE[e]) && (U.capsMaskAnchorSE[e].style.display = Z ? "inline" : "none", 
                    q = !0, ue && Ae(U, U.lineMask)), Y.capsMaskAnchor_enabledSE[e] && (Me(t = Y.capsMaskAnchor_pathDataSE[e], X.capsMaskAnchor_pathDataSE[e]) && (U.capsMaskAnchorSE[e].setPathData(t), 
                    X.capsMaskAnchor_pathDataSE[e] = t, q = !0), We(U, X.capsMaskAnchor_strokeWidthSE, e, Z = Y.capsMaskAnchor_strokeWidthSE[e]) && (U.capsMaskAnchorSE[e].style.strokeWidth = Z + "px", 
                    q = !0));
                }), We(U, X, "capsMaskMarker_enabled", Z = Y.capsMaskMarker_enabled) && (U.capsMaskLine.style.display = Z ? "inline" : "none", 
                q = !0), Y.capsMaskMarker_enabled && [ 0, 1 ].forEach(function(n) {
                    var e = Y.capsMaskMarker_plugSE[n], t = e !== ne ? ae[ie[e]] : null, a = Ne(n, t);
                    We(U, X.capsMaskMarker_enabledSE, n, Z = Y.capsMaskMarker_enabledSE[n]) && (U.capsMaskLine.style[a.prop] = Z ? "url(#" + U.lineMaskMarkerIdSE[n] + ")" : "none", 
                    q = !0), Y.capsMaskMarker_enabledSE[n] && (We(U, X.capsMaskMarker_plugSE, n, e) && (U.capsMaskMarkerShapeSE[n].href.baseVal = "#" + t.elmId, 
                    Pe(U, U.capsMaskMarkerSE[n], a.orient, t.bBox, U.svg, U.capsMaskMarkerShapeSE[n], U.capsMaskLine), 
                    q = !0, re && (Ae(U, U.capsMaskLine), Ae(U, U.lineFace))), [ "markerWidth", "markerHeight" ].forEach(function(e) {
                        var t = "capsMaskMarker_" + e + "SE";
                        We(U, X[t], n, Z = Y[t][n]) && (U.capsMaskMarkerSE[n][e].baseVal.value = Z, q = !0);
                    }));
                }))), Y.lineOutline_enabled && [ "x", "y" ].forEach(function(e) {
                    var t = "lineOutlineMask_" + e;
                    We(U, X, t, Z = Y[t]) && (U.lineOutlineMask[e].baseVal.value = Z, q = !0);
                }), q), t.effect && (J = (Q = e).curStats, $ = Q.aplStats, Object.keys(te).forEach(function(e) {
                    var t = te[e], n = e + "_enabled", a = e + "_options", i = J[a];
                    We(Q, $, n, K = J[n]) ? (K && ($[a] = de(i)), t[K ? "init" : "remove"](Q)) : K && ce(i, $[a]) && (t.remove(Q), 
                    $[n] = !0, $[a] = de(i), t.init(Q));
                })), (se || ue) && ee.line && !ee.path && Ae(e, e.lineShape), se && ee.plug && !ee.line && Ae(e, e.plugsFace), 
                Ve(e);
            }
            function ze(e, t) {
                return {
                    duration: w(e.duration) && 0 < e.duration ? e.duration : t.duration,
                    timing: c.validTiming(e.timing) ? e.timing : de(t.timing)
                };
            }
            function je(e, t, n, a) {
                var i, o = e.curStats, l = e.aplStats, r = {};
                function s() {
                    [ "show_on", "show_effect", "show_animOptions" ].forEach(function(e) {
                        l[e] = o[e];
                    });
                }
                o.show_on = t, n && g[n] && (o.show_effect = n, o.show_animOptions = ze(k(a) ? a : {}, g[n].defaultAnimOptions)), 
                r.show_on = o.show_on !== l.show_on, r.show_effect = o.show_effect !== l.show_effect, 
                r.show_animOptions = ce(o.show_animOptions, l.show_animOptions), r.show_effect || r.show_animOptions ? o.show_inAnim ? (i = r.show_effect ? g[l.show_effect].stop(e, !0, !0) : g[l.show_effect].stop(e), 
                s(), g[l.show_effect].init(e, i)) : r.show_on && (l.show_effect && r.show_effect && g[l.show_effect].stop(e, !0, !0), 
                s(), g[l.show_effect].init(e)) : r.show_on && (s(), g[l.show_effect].start(e));
            }
            function He(e, t, n) {
                var a = {
                    props: e,
                    optionName: n
                };
                return !(!(e.attachments.indexOf(t) < 0) || t.conf.bind && !t.conf.bind(t, a)) && (e.attachments.push(t), 
                t.boundTargets.push(a), !0);
            }
            function Ue(n, a, e) {
                var i = n.attachments.indexOf(a);
                -1 < i && n.attachments.splice(i, 1), a.boundTargets.some(function(e, t) {
                    return e.props === n && (a.conf.unbind && a.conf.unbind(a, e), i = t, !0);
                }) && (a.boundTargets.splice(i, 1), e || Le(function() {
                    a.boundTargets.length || o(a);
                }));
            }
            function Ze(s, u) {
                var e, i, h = s.options, p = {};
                function f(e, t, n, a, i) {
                    var o = {};
                    return n ? null != a ? (o.container = e[n], o.key = a) : (o.container = e, o.key = n) : (o.container = e, 
                    o.key = t), o.default = i, o.acceptsAuto = null == o.default, o;
                }
                function c(e, t, n, a, i, o, l) {
                    var r, s, u, h = f(e, n, i, o, l);
                    return null != t[n] && (s = (t[n] + "").toLowerCase()) && (h.acceptsAuto && s === x || (u = a[s])) && u !== h.container[h.key] && (h.container[h.key] = u, 
                    r = !0), null != h.container[h.key] || h.acceptsAuto || (h.container[h.key] = h.default, 
                    r = !0), r;
                }
                function d(e, t, n, a, i, o, l, r, s) {
                    var u, h, p, c, d = f(e, n, i, o, l);
                    if (!a) {
                        if (null == d.default) throw new Error("Invalid `type`: " + n);
                        a = typeof d.default;
                    }
                    return null != t[n] && (d.acceptsAuto && (t[n] + "").toLowerCase() === x || (p = h = t[n], 
                    ("number" === (c = a) ? w(p) : typeof p === c) && (h = s && "string" === a && h ? h.trim() : h, 
                    1) && (!r || r(h)))) && h !== d.container[d.key] && (d.container[d.key] = h, u = !0), 
                    null != d.container[d.key] || d.acceptsAuto || (d.container[d.key] = d.default, 
                    u = !0), u;
                }
                if (u = u || {}, [ "start", "end" ].forEach(function(e, t) {
                    var n = u[e], a = !1;
                    if (n && (ye(n) || (a = _(n, "anchor"))) && n !== h.anchorSE[t]) {
                        if (!1 !== s.optionIsAttach.anchorSE[t] && Ue(s, $[h.anchorSE[t]._id]), a && !He(s, $[n._id], e)) throw new Error("Can't bind attachment");
                        h.anchorSE[t] = n, s.optionIsAttach.anchorSE[t] = a, i = p.position = !0;
                    }
                }), !h.anchorSE[0] || !h.anchorSE[1] || h.anchorSE[0] === h.anchorSE[1]) throw new Error("`start` and `end` are required.");
                i && (e = function(e, t) {
                    var n, a, i;
                    if (!(n = me(e)) || !(a = me(t))) throw new Error("Cannot get frames.");
                    return n.length && a.length && (n.reverse(), a.reverse(), n.some(function(t) {
                        return a.some(function(e) {
                            return e === t && (i = e.contentWindow, !0);
                        });
                    })), i || window;
                }(!1 !== s.optionIsAttach.anchorSE[0] ? $[h.anchorSE[0]._id].element : h.anchorSE[0], !1 !== s.optionIsAttach.anchorSE[1] ? $[h.anchorSE[1]._id].element : h.anchorSE[1])) !== s.baseWindow && (!function(a, e) {
                    var t, n, i, o, l, r, s, u, h, p, c = a.aplStats, d = e.document, f = v + "-" + a._id;
                    function y(e) {
                        var t = n.appendChild(d.createElementNS(b, "mask"));
                        return t.id = e, t.maskUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE, 
                        [ t.x, t.y, t.width, t.height ].forEach(function(e) {
                            e.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
                        }), t;
                    }
                    function S(e) {
                        var t = n.appendChild(d.createElementNS(b, "marker"));
                        return t.id = e, t.markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH, 
                        t.viewBox.baseVal || t.setAttribute("viewBox", "0 0 0 0"), t;
                    }
                    function m(e) {
                        return [ e.width, e.height ].forEach(function(e) {
                            e.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
                        }), e;
                    }
                    a.pathList = {}, Te(c, Y), Object.keys(te).forEach(function(e) {
                        var t = e + "_enabled";
                        c[t] && (te[e].remove(a), c[t] = !1);
                    }), a.baseWindow && a.svg && a.baseWindow.document.body.removeChild(a.svg), Re(a.baseWindow = e), 
                    a.bodyOffset = Be(e), a.svg = t = d.createElementNS(b, "svg"), t.className.baseVal = v, 
                    t.viewBox.baseVal || t.setAttribute("viewBox", "0 0 0 0"), a.defs = n = t.appendChild(d.createElementNS(b, "defs")), 
                    a.linePath = o = n.appendChild(d.createElementNS(b, "path")), o.id = l = f + "-line-path", 
                    o.className.baseVal = v + "-line-path", ue && (o.style.fill = "none"), a.lineShape = o = n.appendChild(d.createElementNS(b, "use")), 
                    o.id = r = f + "-line-shape", o.href.baseVal = "#" + l, (i = n.appendChild(d.createElementNS(b, "g"))).id = s = f + "-caps", 
                    a.capsMaskAnchorSE = [ 0, 1 ].map(function() {
                        var e = i.appendChild(d.createElementNS(b, "path"));
                        return e.className.baseVal = v + "-caps-mask-anchor", e;
                    }), a.lineMaskMarkerIdSE = [ f + "-caps-mask-marker-0", f + "-caps-mask-marker-1" ], 
                    a.capsMaskMarkerSE = [ 0, 1 ].map(function(e) {
                        return S(a.lineMaskMarkerIdSE[e]);
                    }), a.capsMaskMarkerShapeSE = [ 0, 1 ].map(function(e) {
                        var t = a.capsMaskMarkerSE[e].appendChild(d.createElementNS(b, "use"));
                        return t.className.baseVal = v + "-caps-mask-marker-shape", t;
                    }), a.capsMaskLine = o = i.appendChild(d.createElementNS(b, "use")), o.className.baseVal = v + "-caps-mask-line", 
                    o.href.baseVal = "#" + r, a.maskBGRect = o = m(n.appendChild(d.createElementNS(b, "rect"))), 
                    o.id = u = f + "-mask-bg-rect", o.className.baseVal = v + "-mask-bg-rect", ue && (o.style.fill = "white"), 
                    a.lineMask = m(y(a.lineMaskId = f + "-line-mask")), a.lineMaskBG = o = a.lineMask.appendChild(d.createElementNS(b, "use")), 
                    o.href.baseVal = "#" + u, a.lineMaskShape = o = a.lineMask.appendChild(d.createElementNS(b, "use")), 
                    o.className.baseVal = v + "-line-mask-shape", o.href.baseVal = "#" + l, o.style.display = "none", 
                    a.lineMaskCaps = o = a.lineMask.appendChild(d.createElementNS(b, "use")), o.href.baseVal = "#" + s, 
                    a.lineOutlineMask = m(y(h = f + "-line-outline-mask")), (o = a.lineOutlineMask.appendChild(d.createElementNS(b, "use"))).href.baseVal = "#" + u, 
                    a.lineOutlineMaskShape = o = a.lineOutlineMask.appendChild(d.createElementNS(b, "use")), 
                    o.className.baseVal = v + "-line-outline-mask-shape", o.href.baseVal = "#" + l, 
                    a.lineOutlineMaskCaps = o = a.lineOutlineMask.appendChild(d.createElementNS(b, "use")), 
                    o.href.baseVal = "#" + s, a.face = t.appendChild(d.createElementNS(b, "g")), a.lineFace = o = a.face.appendChild(d.createElementNS(b, "use")), 
                    o.href.baseVal = "#" + r, a.lineOutlineFace = o = a.face.appendChild(d.createElementNS(b, "use")), 
                    o.href.baseVal = "#" + r, o.style.mask = "url(#" + h + ")", o.style.display = "none", 
                    a.plugMaskIdSE = [ f + "-plug-mask-0", f + "-plug-mask-1" ], a.plugMaskSE = [ 0, 1 ].map(function(e) {
                        return y(a.plugMaskIdSE[e]);
                    }), a.plugMaskShapeSE = [ 0, 1 ].map(function(e) {
                        var t = a.plugMaskSE[e].appendChild(d.createElementNS(b, "use"));
                        return t.className.baseVal = v + "-plug-mask-shape", t;
                    }), p = [], a.plugOutlineMaskSE = [ 0, 1 ].map(function(e) {
                        return y(p[e] = f + "-plug-outline-mask-" + e);
                    }), a.plugOutlineMaskShapeSE = [ 0, 1 ].map(function(e) {
                        var t = a.plugOutlineMaskSE[e].appendChild(d.createElementNS(b, "use"));
                        return t.className.baseVal = v + "-plug-outline-mask-shape", t;
                    }), a.plugMarkerIdSE = [ f + "-plug-marker-0", f + "-plug-marker-1" ], a.plugMarkerSE = [ 0, 1 ].map(function(e) {
                        var t = S(a.plugMarkerIdSE[e]);
                        return ue && (t.markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_USERSPACEONUSE), 
                        t;
                    }), a.plugMarkerShapeSE = [ 0, 1 ].map(function(e) {
                        return a.plugMarkerSE[e].appendChild(d.createElementNS(b, "g"));
                    }), a.plugFaceSE = [ 0, 1 ].map(function(e) {
                        return a.plugMarkerShapeSE[e].appendChild(d.createElementNS(b, "use"));
                    }), a.plugOutlineFaceSE = [ 0, 1 ].map(function(e) {
                        var t = a.plugMarkerShapeSE[e].appendChild(d.createElementNS(b, "use"));
                        return t.style.mask = "url(#" + p[e] + ")", t.style.display = "none", t;
                    }), a.plugsFace = o = a.face.appendChild(d.createElementNS(b, "use")), o.className.baseVal = v + "-plugs-face", 
                    o.href.baseVal = "#" + r, o.style.display = "none", a.curStats.show_inAnim ? (a.isShown = 1, 
                    g[c.show_effect].stop(a, !0)) : a.isShown || (t.style.visibility = "hidden"), d.body.appendChild(t), 
                    [ 0, 1, 2 ].forEach(function(e) {
                        var t, n = a.options.labelSEM[e];
                        n && _(n, "label") && (t = $[n._id]).conf.initSvg && t.conf.initSvg(t, a);
                    });
                }(s, e), p.line = p.plug = p.lineOutline = p.plugOutline = p.faces = p.effect = !0), 
                p.position = c(h, u, "path", m, null, null, pe.path) || p.position, p.position = c(h, u, "startSocket", n, "socketSE", 0) || p.position, 
                p.position = c(h, u, "endSocket", n, "socketSE", 1) || p.position, [ u.startSocketGravity, u.endSocketGravity ].forEach(function(e, t) {
                    var n, a, i = !1;
                    null != e && (Array.isArray(e) ? w(e[0]) && w(e[1]) && (i = [ e[0], e[1] ], Array.isArray(h.socketGravitySE[t]) && (n = i, 
                    a = h.socketGravitySE[t], n.length === a.length && n.every(function(e, t) {
                        return e === a[t];
                    })) && (i = !1)) : ((e + "").toLowerCase() === x ? i = null : w(e) && 0 <= e && (i = e), 
                    i === h.socketGravitySE[t] && (i = !1)), !1 !== i && (h.socketGravitySE[t] = i, 
                    p.position = !0));
                }), p.line = d(h, u, "color", null, "lineColor", null, pe.lineColor, null, !0) || p.line, 
                p.line = d(h, u, "size", null, "lineSize", null, pe.lineSize, function(e) {
                    return 0 < e;
                }) || p.line, [ "startPlug", "endPlug" ].forEach(function(e, t) {
                    p.plug = c(h, u, e, E, "plugSE", t, pe.plugSE[t]) || p.plug, p.plug = d(h, u, e + "Color", "string", "plugColorSE", t, null, null, !0) || p.plug, 
                    p.plug = d(h, u, e + "Size", null, "plugSizeSE", t, pe.plugSizeSE[t], function(e) {
                        return 0 < e;
                    }) || p.plug;
                }), p.lineOutline = d(h, u, "outline", null, "lineOutlineEnabled", null, pe.lineOutlineEnabled) || p.lineOutline, 
                p.lineOutline = d(h, u, "outlineColor", null, "lineOutlineColor", null, pe.lineOutlineColor, null, !0) || p.lineOutline, 
                p.lineOutline = d(h, u, "outlineSize", null, "lineOutlineSize", null, pe.lineOutlineSize, function(e) {
                    return 0 < e && e <= .48;
                }) || p.lineOutline, [ "startPlugOutline", "endPlugOutline" ].forEach(function(e, t) {
                    p.plugOutline = d(h, u, e, null, "plugOutlineEnabledSE", t, pe.plugOutlineEnabledSE[t]) || p.plugOutline, 
                    p.plugOutline = d(h, u, e + "Color", "string", "plugOutlineColorSE", t, null, null, !0) || p.plugOutline, 
                    p.plugOutline = d(h, u, e + "Size", null, "plugOutlineSizeSE", t, pe.plugOutlineSizeSE[t], function(e) {
                        return 1 <= e;
                    }) || p.plugOutline;
                }), [ "startLabel", "endLabel", "middleLabel" ].forEach(function(e, t) {
                    var n, a, i, o = u[e], l = h.labelSEM[t] && !s.optionIsAttach.labelSEM[t] ? $[h.labelSEM[t]._id].text : h.labelSEM[t], r = !1;
                    if ((n = "string" == typeof o) && (o = o.trim()), (n || o && (r = _(o, "label"))) && o !== l) {
                        if (h.labelSEM[t] && (Ue(s, $[h.labelSEM[t]._id]), h.labelSEM[t] = ""), o) {
                            if (r ? (a = $[(i = o)._id]).boundTargets.slice().forEach(function(e) {
                                a.conf.removeOption(a, e);
                            }) : i = new S(y.captionLabel, [ o ]), !He(s, $[i._id], e)) throw new Error("Can't bind attachment");
                            h.labelSEM[t] = i;
                        }
                        s.optionIsAttach.labelSEM[t] = r;
                    }
                }), Object.keys(te).forEach(function(a) {
                    var e, t, o = te[a], n = a + "_enabled", i = a + "_options";
                    function l(a) {
                        var i = {};
                        return o.optionsConf.forEach(function(e) {
                            var t = e[0], n = e[3];
                            null == e[4] || i[n] || (i[n] = []), ("function" == typeof t ? t : "id" === t ? c : d).apply(null, [ i, a ].concat(e.slice(1)));
                        }), i;
                    }
                    function r(e) {
                        var t, n = a + "_animOptions";
                        return e.hasOwnProperty("animation") ? k(e.animation) ? t = s.curStats[n] = ze(e.animation, o.defaultAnimOptions) : (t = !!e.animation, 
                        s.curStats[n] = t ? ze({}, o.defaultAnimOptions) : null) : (t = !!o.defaultEnabled, 
                        s.curStats[n] = t ? ze({}, o.defaultAnimOptions) : null), t;
                    }
                    u.hasOwnProperty(a) && (e = u[a], k(e) ? (s.curStats[n] = !0, t = s.curStats[i] = l(e), 
                    o.anim && (s.curStats[i].animation = r(e))) : (t = s.curStats[n] = !!e) && (s.curStats[i] = l({}), 
                    o.anim && (s.curStats[i].animation = r({}))), ce(t, h[a]) && (h[a] = t, p.effect = !0));
                }), De(s, p);
            }
            function Ye(e, t, n) {
                var a = {
                    options: {
                        anchorSE: [],
                        socketSE: [],
                        socketGravitySE: [],
                        plugSE: [],
                        plugColorSE: [],
                        plugSizeSE: [],
                        plugOutlineEnabledSE: [],
                        plugOutlineColorSE: [],
                        plugOutlineSizeSE: [],
                        labelSEM: [ "", "", "" ]
                    },
                    optionIsAttach: {
                        anchorSE: [ !1, !1 ],
                        labelSEM: [ !1, !1, !1 ]
                    },
                    curStats: {},
                    aplStats: {},
                    attachments: [],
                    events: {},
                    reflowTargets: []
                };
                Te(a.curStats, Y), Te(a.aplStats, Y), Object.keys(te).forEach(function(e) {
                    var t = te[e].stats;
                    Te(a.curStats, t), Te(a.aplStats, t), a.options[e] = !1;
                }), Te(a.curStats, X), Te(a.aplStats, X), a.curStats.show_effect = q, a.curStats.show_animOptions = de(g[q].defaultAnimOptions), 
                Object.defineProperty(this, "_id", {
                    value: ++J
                }), a._id = this._id, K[this._id] = a, 1 === arguments.length && (n = e, e = null), 
                n = n || {}, (e || t) && (n = de(n), e && (n.start = e), t && (n.end = t)), a.isShown = a.aplStats.show_on = !n.hide, 
                this.setOptions(n);
            }
            return te = {
                dash: {
                    stats: {
                        dash_len: {},
                        dash_gap: {},
                        dash_maxOffset: {}
                    },
                    anim: !0,
                    defaultAnimOptions: {
                        duration: 1e3,
                        timing: "linear"
                    },
                    optionsConf: [ [ "type", "len", "number", null, null, null, function(e) {
                        return 0 < e;
                    } ], [ "type", "gap", "number", null, null, null, function(e) {
                        return 0 < e;
                    } ] ],
                    init: function(e) {
                        Ie(e, "apl_line_strokeWidth", te.dash.update), e.lineFace.style.strokeDashoffset = 0, 
                        te.dash.update(e);
                    },
                    remove: function(e) {
                        var t = e.curStats;
                        Ce(e, "apl_line_strokeWidth", te.dash.update), t.dash_animId && (c.remove(t.dash_animId), 
                        t.dash_animId = null), e.lineFace.style.strokeDasharray = "none", e.lineFace.style.strokeDashoffset = 0, 
                        Te(e.aplStats, te.dash.stats);
                    },
                    update: function(t) {
                        var e, n = t.curStats, a = t.aplStats, i = a.dash_options, o = !1;
                        n.dash_len = i.len || 2 * a.line_strokeWidth, n.dash_gap = i.gap || a.line_strokeWidth, 
                        n.dash_maxOffset = n.dash_len + n.dash_gap, o = We(t, a, "dash_len", n.dash_len) || o, 
                        (o = We(t, a, "dash_gap", n.dash_gap) || o) && (t.lineFace.style.strokeDasharray = a.dash_len + "," + a.dash_gap), 
                        n.dash_animOptions ? (o = We(t, a, "dash_maxOffset", n.dash_maxOffset), a.dash_animOptions && (o || ce(n.dash_animOptions, a.dash_animOptions)) && (n.dash_animId && (e = c.stop(n.dash_animId), 
                        c.remove(n.dash_animId)), a.dash_animOptions = null), a.dash_animOptions || (n.dash_animId = c.add(function(e) {
                            return (1 - e) * a.dash_maxOffset + "px";
                        }, function(e) {
                            t.lineFace.style.strokeDashoffset = e;
                        }, n.dash_animOptions.duration, 0, n.dash_animOptions.timing, !1, e), a.dash_animOptions = de(n.dash_animOptions))) : a.dash_animOptions && (n.dash_animId && (c.remove(n.dash_animId), 
                        n.dash_animId = null), t.lineFace.style.strokeDashoffset = 0, a.dash_animOptions = null);
                    }
                },
                gradient: {
                    stats: {
                        gradient_colorSE: {
                            hasSE: !0
                        },
                        gradient_pointSE: {
                            hasSE: !0,
                            hasProps: !0
                        }
                    },
                    optionsConf: [ [ "type", "startColor", "string", "colorSE", 0, null, null, !0 ], [ "type", "endColor", "string", "colorSE", 1, null, null, !0 ] ],
                    init: function(e) {
                        var t, a = e.baseWindow.document, n = e.defs, i = v + "-" + e._id + "-gradient";
                        e.efc_gradient_gradient = t = n.appendChild(a.createElementNS(b, "linearGradient")), 
                        t.id = i, t.gradientUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE, [ t.x1, t.y1, t.x2, t.y2 ].forEach(function(e) {
                            e.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
                        }), e.efc_gradient_stopSE = [ 0, 1 ].map(function(t) {
                            var n = e.efc_gradient_gradient.appendChild(a.createElementNS(b, "stop"));
                            try {
                                n.offset.baseVal = t;
                            } catch (e) {
                                if (e.code !== DOMException.NO_MODIFICATION_ALLOWED_ERR) throw e;
                                n.setAttribute("offset", t);
                            }
                            return n;
                        }), Ie(e, "cur_plug_colorSE", te.gradient.update), Ie(e, "apl_path", te.gradient.update), 
                        e.curStats.line_altColor = !0, e.lineFace.style.stroke = "url(#" + i + ")", te.gradient.update(e);
                    },
                    remove: function(e) {
                        e.efc_gradient_gradient && (e.defs.removeChild(e.efc_gradient_gradient), e.efc_gradient_gradient = e.efc_gradient_stopSE = null), 
                        Ce(e, "cur_plug_colorSE", te.gradient.update), Ce(e, "apl_path", te.gradient.update), 
                        e.curStats.line_altColor = !1, e.lineFace.style.stroke = e.curStats.line_color, 
                        Te(e.aplStats, te.gradient.stats);
                    },
                    update: function(a) {
                        var e, t, i = a.curStats, o = a.aplStats, n = o.gradient_options, l = a.pathList.animVal || a.pathList.baseVal;
                        [ 0, 1 ].forEach(function(e) {
                            i.gradient_colorSE[e] = n.colorSE[e] || i.plug_colorSE[e];
                        }), t = l[0][0], i.gradient_pointSE[0] = {
                            x: t.x,
                            y: t.y
                        }, t = (e = l[l.length - 1])[e.length - 1], i.gradient_pointSE[1] = {
                            x: t.x,
                            y: t.y
                        }, [ 0, 1 ].forEach(function(t) {
                            var n;
                            We(a, o.gradient_colorSE, t, n = i.gradient_colorSE[t]) && (ue ? (n = fe(n), a.efc_gradient_stopSE[t].style.stopColor = n[1], 
                            a.efc_gradient_stopSE[t].style.stopOpacity = n[0]) : a.efc_gradient_stopSE[t].style.stopColor = n), 
                            [ "x", "y" ].forEach(function(e) {
                                (n = i.gradient_pointSE[t][e]) !== o.gradient_pointSE[t][e] && (a.efc_gradient_gradient[e + (t + 1)].baseVal.value = o.gradient_pointSE[t][e] = n);
                            });
                        });
                    }
                },
                dropShadow: {
                    stats: {
                        dropShadow_dx: {},
                        dropShadow_dy: {},
                        dropShadow_blur: {},
                        dropShadow_color: {},
                        dropShadow_opacity: {},
                        dropShadow_x: {},
                        dropShadow_y: {}
                    },
                    optionsConf: [ [ "type", "dx", null, null, null, 2 ], [ "type", "dy", null, null, null, 4 ], [ "type", "blur", null, null, null, 3, function(e) {
                        return 0 <= e;
                    } ], [ "type", "color", null, null, null, "#000", null, !0 ], [ "type", "opacity", null, null, null, .8, function(e) {
                        return 0 <= e && e <= 1;
                    } ] ],
                    init: function(t) {
                        var e, n, a, i, o, l = t.baseWindow.document, r = t.defs, s = v + "-" + t._id + "-dropShadow", u = (e = l, 
                        n = s, o = {}, "boolean" != typeof p && (p = !!window.SVGFEDropShadowElement && !ue), 
                        o.elmsAppend = [ o.elmFilter = a = e.createElementNS(b, "filter") ], a.filterUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE, 
                        a.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0), a.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0), 
                        a.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100), 
                        a.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100), 
                        a.id = n, p ? (o.elmOffset = o.elmBlur = i = a.appendChild(e.createElementNS(b, "feDropShadow")), 
                        o.styleFlood = i.style) : (o.elmBlur = a.appendChild(e.createElementNS(b, "feGaussianBlur")), 
                        o.elmOffset = i = a.appendChild(e.createElementNS(b, "feOffset")), i.result.baseVal = "offsetblur", 
                        i = a.appendChild(e.createElementNS(b, "feFlood")), o.styleFlood = i.style, (i = a.appendChild(e.createElementNS(b, "feComposite"))).in2.baseVal = "offsetblur", 
                        i.operator.baseVal = SVGFECompositeElement.SVG_FECOMPOSITE_OPERATOR_IN, (i = a.appendChild(e.createElementNS(b, "feMerge"))).appendChild(e.createElementNS(b, "feMergeNode")), 
                        i.appendChild(e.createElementNS(b, "feMergeNode")).in1.baseVal = "SourceGraphic"), 
                        o);
                        [ "elmFilter", "elmOffset", "elmBlur", "styleFlood", "elmsAppend" ].forEach(function(e) {
                            t["efc_dropShadow_" + e] = u[e];
                        }), u.elmsAppend.forEach(function(e) {
                            r.appendChild(e);
                        }), t.face.setAttribute("filter", "url(#" + s + ")"), Ie(t, "new_edge4viewBox", te.dropShadow.adjustEdge), 
                        te.dropShadow.update(t);
                    },
                    remove: function(e) {
                        var t = e.defs;
                        e.efc_dropShadow_elmsAppend && (e.efc_dropShadow_elmsAppend.forEach(function(e) {
                            t.removeChild(e);
                        }), e.efc_dropShadow_elmFilter = e.efc_dropShadow_elmOffset = e.efc_dropShadow_elmBlur = e.efc_dropShadow_styleFlood = e.efc_dropShadow_elmsAppend = null), 
                        Ce(e, "new_edge4viewBox", te.dropShadow.adjustEdge), De(e, {}), e.face.removeAttribute("filter"), 
                        Te(e.aplStats, te.dropShadow.stats);
                    },
                    update: function(e) {
                        var t, n, a = e.curStats, i = e.aplStats, o = i.dropShadow_options;
                        a.dropShadow_dx = t = o.dx, We(e, i, "dropShadow_dx", t) && (e.efc_dropShadow_elmOffset.dx.baseVal = t, 
                        n = !0), a.dropShadow_dy = t = o.dy, We(e, i, "dropShadow_dy", t) && (e.efc_dropShadow_elmOffset.dy.baseVal = t, 
                        n = !0), a.dropShadow_blur = t = o.blur, We(e, i, "dropShadow_blur", t) && (e.efc_dropShadow_elmBlur.setStdDeviation(t, t), 
                        n = !0), n && De(e, {}), a.dropShadow_color = t = o.color, We(e, i, "dropShadow_color", t) && (e.efc_dropShadow_styleFlood.floodColor = t), 
                        a.dropShadow_opacity = t = o.opacity, We(e, i, "dropShadow_opacity", t) && (e.efc_dropShadow_styleFlood.floodOpacity = t);
                    },
                    adjustEdge: function(a, i) {
                        var e, t, o = a.curStats, l = a.aplStats;
                        null != o.dropShadow_dx && (e = 3 * o.dropShadow_blur, (t = {
                            x1: i.x1 - e + o.dropShadow_dx,
                            y1: i.y1 - e + o.dropShadow_dy,
                            x2: i.x2 + e + o.dropShadow_dx,
                            y2: i.y2 + e + o.dropShadow_dy
                        }).x1 < i.x1 && (i.x1 = t.x1), t.y1 < i.y1 && (i.y1 = t.y1), t.x2 > i.x2 && (i.x2 = t.x2), 
                        t.y2 > i.y2 && (i.y2 = t.y2), [ "x", "y" ].forEach(function(e) {
                            var t, n = "dropShadow_" + e;
                            o[n] = t = i[e + "1"], We(a, l, n, t) && (a.efc_dropShadow_elmFilter[e].baseVal.value = t);
                        }));
                    }
                }
            }, Object.keys(te).forEach(function(e) {
                var t = te[e], n = t.stats;
                n[e + "_enabled"] = {
                    iniValue: !1
                }, n[e + "_options"] = {
                    hasProps: !0
                }, t.anim && (n[e + "_animOptions"] = {}, n[e + "_animId"] = {});
            }), g = {
                none: {
                    defaultAnimOptions: {},
                    init: function(e, t) {
                        var n = e.curStats;
                        n.show_animId && (c.remove(n.show_animId), n.show_animId = null), g.none.start(e, t);
                    },
                    start: function(e, t) {
                        g.none.stop(e, !0);
                    },
                    stop: function(e, t, n) {
                        var a = e.curStats;
                        return n = null != n ? n : e.aplStats.show_on, a.show_inAnim = !1, t && Ge(e, n), 
                        n ? 1 : 0;
                    }
                },
                fade: {
                    defaultAnimOptions: {
                        duration: 300,
                        timing: "linear"
                    },
                    init: function(n, e) {
                        var t = n.curStats, a = n.aplStats;
                        t.show_animId && c.remove(t.show_animId), t.show_animId = c.add(function(e) {
                            return e;
                        }, function(e, t) {
                            t ? g.fade.stop(n, !0) : (n.svg.style.opacity = e + "", le && (Ae(n, n.svg), Ve(n)));
                        }, a.show_animOptions.duration, 1, a.show_animOptions.timing, null, !1), g.fade.start(n, e);
                    },
                    start: function(e, t) {
                        var n, a = e.curStats;
                        a.show_inAnim && (n = c.stop(a.show_animId)), Ge(e, 1), a.show_inAnim = !0, c.start(a.show_animId, !e.aplStats.show_on, null != t ? t : n);
                    },
                    stop: function(e, t, n) {
                        var a, i = e.curStats;
                        return n = null != n ? n : e.aplStats.show_on, a = i.show_inAnim ? c.stop(i.show_animId) : n ? 1 : 0, 
                        i.show_inAnim = !1, t && (e.svg.style.opacity = n ? "" : "0", Ge(e, n)), a;
                    }
                },
                draw: {
                    defaultAnimOptions: {
                        duration: 500,
                        timing: [ .58, 0, .42, 1 ]
                    },
                    init: function(n, e) {
                        var t = n.curStats, a = n.aplStats, l = n.pathList.baseVal, i = Oe(l), r = i.segsLen, s = i.lenAll;
                        t.show_animId && c.remove(t.show_animId), t.show_animId = c.add(function(e) {
                            var t, n, a, i, o = -1;
                            if (0 === e) n = [ [ l[0][0], l[0][0] ] ]; else if (1 === e) n = l; else {
                                for (t = s * e, n = []; t >= r[++o]; ) n.push(l[o]), t -= r[o];
                                t && (2 === (a = l[o]).length ? n.push([ a[0], ve(a[0], a[1], t / r[o]) ]) : (i = xe(a[0], a[1], a[2], a[3], ke(a[0], a[1], a[2], a[3], t)), 
                                n.push([ a[0], i.fromP1, i.fromP2, i ])));
                            }
                            return n;
                        }, function(e, t) {
                            t ? g.draw.stop(n, !0) : (n.pathList.animVal = e, De(n, {
                                path: !0
                            }));
                        }, a.show_animOptions.duration, 1, a.show_animOptions.timing, null, !1), g.draw.start(n, e);
                    },
                    start: function(e, t) {
                        var n, a = e.curStats;
                        a.show_inAnim && (n = c.stop(a.show_animId)), Ge(e, 1), a.show_inAnim = !0, Ie(e, "apl_position", g.draw.update), 
                        c.start(a.show_animId, !e.aplStats.show_on, null != t ? t : n);
                    },
                    stop: function(e, t, n) {
                        var a, i = e.curStats;
                        return n = null != n ? n : e.aplStats.show_on, a = i.show_inAnim ? c.stop(i.show_animId) : n ? 1 : 0, 
                        i.show_inAnim = !1, t && (e.pathList.animVal = n ? null : [ [ e.pathList.baseVal[0][0], e.pathList.baseVal[0][0] ] ], 
                        De(e, {
                            path: !0
                        }), Ge(e, n)), a;
                    },
                    update: function(e) {
                        Ce(e, "apl_position", g.draw.update), e.curStats.show_inAnim ? g.draw.init(e, g.draw.stop(e)) : e.aplStats.show_animOptions = {};
                    }
                }
            }, function() {
                function r(n) {
                    return function(e) {
                        var t = {};
                        t[n] = e, this.setOptions(t);
                    };
                }
                [ [ "start", "anchorSE", 0 ], [ "end", "anchorSE", 1 ], [ "color", "lineColor" ], [ "size", "lineSize" ], [ "startSocketGravity", "socketGravitySE", 0 ], [ "endSocketGravity", "socketGravitySE", 1 ], [ "startPlugColor", "plugColorSE", 0 ], [ "endPlugColor", "plugColorSE", 1 ], [ "startPlugSize", "plugSizeSE", 0 ], [ "endPlugSize", "plugSizeSE", 1 ], [ "outline", "lineOutlineEnabled" ], [ "outlineColor", "lineOutlineColor" ], [ "outlineSize", "lineOutlineSize" ], [ "startPlugOutline", "plugOutlineEnabledSE", 0 ], [ "endPlugOutline", "plugOutlineEnabledSE", 1 ], [ "startPlugOutlineColor", "plugOutlineColorSE", 0 ], [ "endPlugOutlineColor", "plugOutlineColorSE", 1 ], [ "startPlugOutlineSize", "plugOutlineSizeSE", 0 ], [ "endPlugOutlineSize", "plugOutlineSizeSE", 1 ] ].forEach(function(e) {
                    var t = e[0], n = e[1], a = e[2];
                    Object.defineProperty(Ye.prototype, t, {
                        get: function() {
                            var e = null != a ? K[this._id].options[n][a] : n ? K[this._id].options[n] : K[this._id].options[t];
                            return null == e ? x : de(e);
                        },
                        set: r(t),
                        enumerable: !0
                    });
                }), [ [ "path", m ], [ "startSocket", n, "socketSE", 0 ], [ "endSocket", n, "socketSE", 1 ], [ "startPlug", E, "plugSE", 0 ], [ "endPlug", E, "plugSE", 1 ] ].forEach(function(e) {
                    var a = e[0], i = e[1], o = e[2], l = e[3];
                    Object.defineProperty(Ye.prototype, a, {
                        get: function() {
                            var t, n = null != l ? K[this._id].options[o][l] : o ? K[this._id].options[o] : K[this._id].options[a];
                            return n ? Object.keys(i).some(function(e) {
                                return i[e] === n && (t = e, !0);
                            }) ? t : new Error("It's broken") : x;
                        },
                        set: r(a),
                        enumerable: !0
                    });
                }), Object.keys(te).forEach(function(n) {
                    var a = te[n];
                    Object.defineProperty(Ye.prototype, n, {
                        get: function() {
                            var u, e, t = K[this._id].options[n];
                            return k(t) ? (u = t, e = a.optionsConf.reduce(function(e, t) {
                                var n, a = t[0], i = t[1], o = t[2], l = t[3], r = t[4], s = null != r ? u[l][r] : l ? u[l] : u[i];
                                return e[i] = "id" === a ? s ? Object.keys(o).some(function(e) {
                                    return o[e] === s && (n = e, !0);
                                }) ? n : new Error("It's broken") : x : null == s ? x : de(s), e;
                            }, {}), a.anim && (e.animation = de(u.animation)), e) : t;
                        },
                        set: r(n),
                        enumerable: !0
                    });
                }), [ "startLabel", "endLabel", "middleLabel" ].forEach(function(e, n) {
                    Object.defineProperty(Ye.prototype, e, {
                        get: function() {
                            var e = K[this._id], t = e.options;
                            return t.labelSEM[n] && !e.optionIsAttach.labelSEM[n] ? $[t.labelSEM[n]._id].text : t.labelSEM[n] || "";
                        },
                        set: r(e),
                        enumerable: !0
                    });
                });
            }(), Ye.prototype.setOptions = function(e) {
                return Ze(K[this._id], e), this;
            }, Ye.prototype.position = function() {
                return De(K[this._id], {
                    position: !0
                }), this;
            }, Ye.prototype.remove = function() {
                var t = K[this._id], n = t.curStats;
                Object.keys(te).forEach(function(e) {
                    var t = e + "_animId";
                    n[t] && c.remove(n[t]);
                }), n.show_animId && c.remove(n.show_animId), t.attachments.slice().forEach(function(e) {
                    Ue(t, e);
                }), t.baseWindow && t.svg && t.baseWindow.document.body.removeChild(t.svg), delete K[this._id];
            }, Ye.prototype.show = function(e, t) {
                return je(K[this._id], !0, e, t), this;
            }, Ye.prototype.hide = function(e, t) {
                return je(K[this._id], !1, e, t), this;
            }, o = function(t) {
                t && $[t._id] && (t.boundTargets.slice().forEach(function(e) {
                    Ue(e.props, t, !0);
                }), t.conf.remove && t.conf.remove(t), delete $[t._id]);
            }, S = function() {
                function e(e, t) {
                    var n, a = {
                        conf: e,
                        curStats: {},
                        aplStats: {},
                        boundTargets: []
                    }, i = {};
                    e.argOptions.every(function(e) {
                        return !(!t.length || ("string" == typeof e.type ? typeof t[0] !== e.type : "function" != typeof e.type || !e.type(t[0]))) && (i[e.optionName] = t.shift(), 
                        !0);
                    }), n = t.length && k(t[0]) ? de(t[0]) : {}, Object.keys(i).forEach(function(e) {
                        n[e] = i[e];
                    }), e.stats && (Te(a.curStats, e.stats), Te(a.aplStats, e.stats)), Object.defineProperty(this, "_id", {
                        value: ++ee
                    }), Object.defineProperty(this, "isRemoved", {
                        get: function() {
                            return !$[this._id];
                        }
                    }), a._id = this._id, e.init && !e.init(a, n) || ($[this._id] = a);
                }
                return e.prototype.remove = function() {
                    var t = this, n = $[t._id];
                    n && (n.boundTargets.slice().forEach(function(e) {
                        n.conf.removeOption(n, e);
                    }), Le(function() {
                        var e = $[t._id];
                        e && (console.error("LeaderLineAttachment was not removed by removeOption"), o(e));
                    }));
                }, e;
            }(), window.LeaderLineAttachment = S, _ = function(e, t) {
                return e instanceof S && (!(e.isRemoved || t && $[e._id].conf.type !== t) || null);
            }, y = {
                pointAnchor: {
                    type: "anchor",
                    argOptions: [ {
                        optionName: "element",
                        type: ye
                    } ],
                    init: function(e, t) {
                        return e.element = y.pointAnchor.checkElement(t.element), e.x = y.pointAnchor.parsePercent(t.x, !0) || [ .5, !0 ], 
                        e.y = y.pointAnchor.parsePercent(t.y, !0) || [ .5, !0 ], !0;
                    },
                    removeOption: function(e, t) {
                        var n = t.props, a = {}, i = e.element, o = n.options.anchorSE["start" === t.optionName ? 1 : 0];
                        i === o && (i = o === document.body ? new S(y.pointAnchor, [ i ]) : document.body), 
                        a[t.optionName] = i, Ze(n, a);
                    },
                    getBBoxNest: function(e, t) {
                        var n = ge(e.element, t.baseWindow), a = n.width, i = n.height;
                        return n.width = n.height = 0, n.left = n.right = n.left + e.x[0] * (e.x[1] ? a : 1), 
                        n.top = n.bottom = n.top + e.y[0] * (e.y[1] ? i : 1), n;
                    },
                    parsePercent: function(e, t) {
                        var n, a, i = !1;
                        return w(e) ? a = e : "string" == typeof e && (n = u.exec(e)) && n[2] && (i = 0 !== (a = parseFloat(n[1]) / 100)), 
                        null != a && (t || 0 <= a) ? [ a, i ] : null;
                    },
                    checkElement: function(e) {
                        if (null == e) e = document.body; else if (!ye(e)) throw new Error("`element` must be Element");
                        return e;
                    }
                },
                areaAnchor: {
                    type: "anchor",
                    argOptions: [ {
                        optionName: "element",
                        type: ye
                    }, {
                        optionName: "shape",
                        type: "string"
                    } ],
                    stats: {
                        color: {},
                        strokeWidth: {},
                        elementWidth: {},
                        elementHeight: {},
                        elementLeft: {},
                        elementTop: {},
                        pathListRel: {},
                        bBoxRel: {},
                        pathData: {},
                        viewBoxBBox: {
                            hasProps: !0
                        },
                        dashLen: {},
                        dashGap: {}
                    },
                    init: function(i, e) {
                        var t, n, a, o = [];
                        return i.element = y.pointAnchor.checkElement(e.element), "string" == typeof e.color && (i.color = e.color.trim()), 
                        "string" == typeof e.fillColor && (i.fill = e.fillColor.trim()), w(e.size) && 0 <= e.size && (i.size = e.size), 
                        e.dash && (i.dash = !0, w(e.dash.len) && 0 < e.dash.len && (i.dashLen = e.dash.len), 
                        w(e.dash.gap) && 0 < e.dash.gap && (i.dashGap = e.dash.gap)), "circle" === e.shape ? i.shape = e.shape : "polygon" === e.shape && Array.isArray(e.points) && 3 <= e.points.length && e.points.every(function(e) {
                            var t = {};
                            return !(!(t.x = y.pointAnchor.parsePercent(e[0], !0)) || !(t.y = y.pointAnchor.parsePercent(e[1], !0))) && (o.push(t), 
                            (t.x[1] || t.y[1]) && (i.hasRatio = !0), !0);
                        }) ? (i.shape = e.shape, i.points = o) : (i.shape = "rect", i.radius = w(e.radius) && 0 <= e.radius ? e.radius : 0), 
                        "rect" !== i.shape && "circle" !== i.shape || (i.x = y.pointAnchor.parsePercent(e.x, !0) || [ -.05, !0 ], 
                        i.y = y.pointAnchor.parsePercent(e.y, !0) || [ -.05, !0 ], i.width = y.pointAnchor.parsePercent(e.width) || [ 1.1, !0 ], 
                        i.height = y.pointAnchor.parsePercent(e.height) || [ 1.1, !0 ], (i.x[1] || i.y[1] || i.width[1] || i.height[1]) && (i.hasRatio = !0)), 
                        t = i.element.ownerDocument, i.svg = n = t.createElementNS(b, "svg"), n.className.baseVal = v + "-areaAnchor", 
                        n.viewBox.baseVal || n.setAttribute("viewBox", "0 0 0 0"), i.path = n.appendChild(t.createElementNS(b, "path")), 
                        i.path.style.fill = i.fill || "none", i.isShown = !1, n.style.visibility = "hidden", 
                        t.body.appendChild(n), Re(a = t.defaultView), i.bodyOffset = Be(a), i.updateColor = function() {
                            var e, t = i.curStats, n = i.aplStats, a = i.boundTargets.length ? i.boundTargets[0].props.curStats : null;
                            t.color = e = i.color || (a ? a.line_color : pe.lineColor), We(i, n, "color", e) && (i.path.style.stroke = e);
                        }, i.updateShow = function() {
                            Ge(i, i.boundTargets.some(function(e) {
                                return !0 === e.props.isShown;
                            }));
                        }, !0;
                    },
                    bind: function(e, t) {
                        var n = t.props;
                        return e.color || Ie(n, "cur_line_color", e.updateColor), Ie(n, "svgShow", e.updateShow), 
                        Le(function() {
                            e.updateColor(), e.updateShow();
                        }), !0;
                    },
                    unbind: function(e, t) {
                        var n = t.props;
                        e.color || Ce(n, "cur_line_color", e.updateColor), Ce(n, "svgShow", e.updateShow), 
                        1 < e.boundTargets.length && Le(function() {
                            e.updateColor(), e.updateShow(), y.areaAnchor.update(e) && e.boundTargets.forEach(function(e) {
                                De(e.props, {
                                    position: !0
                                });
                            });
                        });
                    },
                    removeOption: function(e, t) {
                        y.pointAnchor.removeOption(e, t);
                    },
                    remove: function(t) {
                        t.boundTargets.length && (console.error("LeaderLineAttachment was not unbound by remove"), 
                        t.boundTargets.forEach(function(e) {
                            y.areaAnchor.unbind(t, e);
                        })), t.svg.parentNode.removeChild(t.svg);
                    },
                    getStrokeWidth: function(e, t) {
                        return y.areaAnchor.update(e) && 1 < e.boundTargets.length && Le(function() {
                            e.boundTargets.forEach(function(e) {
                                e.props !== t && De(e.props, {
                                    position: !0
                                });
                            });
                        }), e.curStats.strokeWidth;
                    },
                    getPathData: function(e, t) {
                        var n = ge(e.element, t.baseWindow);
                        return we(e.curStats.pathListRel, function(e) {
                            e.x += n.left, e.y += n.top;
                        });
                    },
                    getBBoxNest: function(e, t) {
                        var n = ge(e.element, t.baseWindow), a = e.curStats.bBoxRel;
                        return {
                            left: a.left + n.left,
                            top: a.top + n.top,
                            right: a.right + n.left,
                            bottom: a.bottom + n.top,
                            width: a.width,
                            height: a.height
                        };
                    },
                    update: function(t) {
                        var a, n, i, o, e, l, r, s, u, h, p, c, d, f, y, S, m, g, _, v, E, x, b, k, w, O, M, I, C, L, A, V, P = t.curStats, N = t.aplStats, T = t.boundTargets.length ? t.boundTargets[0].props.curStats : null, W = {};
                        if (W.strokeWidth = We(t, P, "strokeWidth", null != t.size ? t.size : T ? T.line_strokeWidth : pe.lineSize), 
                        a = Se(t.element), W.elementWidth = We(t, P, "elementWidth", a.width), W.elementHeight = We(t, P, "elementHeight", a.height), 
                        W.elementLeft = We(t, P, "elementLeft", a.left), W.elementTop = We(t, P, "elementTop", a.top), 
                        W.strokeWidth || t.hasRatio && (W.elementWidth || W.elementHeight)) {
                            switch (t.shape) {
                              case "rect":
                                (v = {
                                    left: t.x[0] * (t.x[1] ? a.width : 1),
                                    top: t.y[0] * (t.y[1] ? a.height : 1),
                                    width: t.width[0] * (t.width[1] ? a.width : 1),
                                    height: t.height[0] * (t.height[1] ? a.height : 1)
                                }).right = v.left + v.width, v.bottom = v.top + v.height, k = P.strokeWidth / 2, 
                                x = (b = Math.min(v.width, v.height)) ? b / 2 * Math.SQRT2 + k : 0, (E = t.radius ? t.radius <= x ? t.radius : x : 0) ? (O = E - (w = (E - k) / Math.SQRT2), 
                                I = E * U, M = [ {
                                    x: v.left - O,
                                    y: v.top + w
                                }, {
                                    x: v.left + w,
                                    y: v.top - O
                                }, {
                                    x: v.right - w,
                                    y: v.top - O
                                }, {
                                    x: v.right + O,
                                    y: v.top + w
                                }, {
                                    x: v.right + O,
                                    y: v.bottom - w
                                }, {
                                    x: v.right - w,
                                    y: v.bottom + O
                                }, {
                                    x: v.left + w,
                                    y: v.bottom + O
                                }, {
                                    x: v.left - O,
                                    y: v.bottom - w
                                } ], P.pathListRel = [ [ M[0], {
                                    x: M[0].x,
                                    y: M[0].y - I
                                }, {
                                    x: M[1].x - I,
                                    y: M[1].y
                                }, M[1] ] ], M[1].x !== M[2].x && P.pathListRel.push([ M[1], M[2] ]), P.pathListRel.push([ M[2], {
                                    x: M[2].x + I,
                                    y: M[2].y
                                }, {
                                    x: M[3].x,
                                    y: M[3].y - I
                                }, M[3] ]), M[3].y !== M[4].y && P.pathListRel.push([ M[3], M[4] ]), P.pathListRel.push([ M[4], {
                                    x: M[4].x,
                                    y: M[4].y + I
                                }, {
                                    x: M[5].x + I,
                                    y: M[5].y
                                }, M[5] ]), M[5].x !== M[6].x && P.pathListRel.push([ M[5], M[6] ]), P.pathListRel.push([ M[6], {
                                    x: M[6].x - I,
                                    y: M[6].y
                                }, {
                                    x: M[7].x,
                                    y: M[7].y + I
                                }, M[7] ]), M[7].y !== M[0].y && P.pathListRel.push([ M[7], M[0] ]), P.pathListRel.push([]), 
                                O = E - w + P.strokeWidth / 2, M = [ {
                                    x: v.left - O,
                                    y: v.top - O
                                }, {
                                    x: v.right + O,
                                    y: v.bottom + O
                                } ]) : (O = P.strokeWidth / 2, M = [ {
                                    x: v.left - O,
                                    y: v.top - O
                                }, {
                                    x: v.right + O,
                                    y: v.bottom + O
                                } ], P.pathListRel = [ [ M[0], {
                                    x: M[1].x,
                                    y: M[0].y
                                } ], [ {
                                    x: M[1].x,
                                    y: M[0].y
                                }, M[1] ], [ M[1], {
                                    x: M[0].x,
                                    y: M[1].y
                                } ], [] ], M = [ {
                                    x: v.left - P.strokeWidth,
                                    y: v.top - P.strokeWidth
                                }, {
                                    x: v.right + P.strokeWidth,
                                    y: v.bottom + P.strokeWidth
                                } ]), P.bBoxRel = {
                                    left: M[0].x,
                                    top: M[0].y,
                                    right: M[1].x,
                                    bottom: M[1].y,
                                    width: M[1].x - M[0].x,
                                    height: M[1].y - M[0].y
                                };
                                break;

                              case "circle":
                                (r = {
                                    left: t.x[0] * (t.x[1] ? a.width : 1),
                                    top: t.y[0] * (t.y[1] ? a.height : 1),
                                    width: t.width[0] * (t.width[1] ? a.width : 1),
                                    height: t.height[0] * (t.height[1] ? a.height : 1)
                                }).width || r.height || (r.width = r.height = 10), r.width || (r.width = r.height), 
                                r.height || (r.height = r.width), r.right = r.left + r.width, r.bottom = r.top + r.height, 
                                s = r.left + r.width / 2, u = r.top + r.height / 2, f = P.strokeWidth / 2, y = r.width / 2, 
                                S = r.height / 2, h = y * Math.SQRT2 + f, p = S * Math.SQRT2 + f, c = h * U, d = p * U, 
                                _ = [ {
                                    x: s - h,
                                    y: u
                                }, {
                                    x: s,
                                    y: u - p
                                }, {
                                    x: s + h,
                                    y: u
                                }, {
                                    x: s,
                                    y: u + p
                                } ], P.pathListRel = [ [ _[0], {
                                    x: _[0].x,
                                    y: _[0].y - d
                                }, {
                                    x: _[1].x - c,
                                    y: _[1].y
                                }, _[1] ], [ _[1], {
                                    x: _[1].x + c,
                                    y: _[1].y
                                }, {
                                    x: _[2].x,
                                    y: _[2].y - d
                                }, _[2] ], [ _[2], {
                                    x: _[2].x,
                                    y: _[2].y + d
                                }, {
                                    x: _[3].x + c,
                                    y: _[3].y
                                }, _[3] ], [ _[3], {
                                    x: _[3].x - c,
                                    y: _[3].y
                                }, {
                                    x: _[0].x,
                                    y: _[0].y + d
                                }, _[0] ], [] ], m = h - y + P.strokeWidth / 2, g = p - S + P.strokeWidth / 2, _ = [ {
                                    x: r.left - m,
                                    y: r.top - g
                                }, {
                                    x: r.right + m,
                                    y: r.bottom + g
                                } ], P.bBoxRel = {
                                    left: _[0].x,
                                    top: _[0].y,
                                    right: _[1].x,
                                    bottom: _[1].y,
                                    width: _[1].x - _[0].x,
                                    height: _[1].y - _[0].y
                                };
                                break;

                              case "polygon":
                                t.points.forEach(function(e) {
                                    var t = e.x[0] * (e.x[1] ? a.width : 1), n = e.y[0] * (e.y[1] ? a.height : 1);
                                    i ? (t < i.left && (i.left = t), t > i.right && (i.right = t), n < i.top && (i.top = n), 
                                    n > i.bottom && (i.bottom = n)) : i = {
                                        left: t,
                                        right: t,
                                        top: n,
                                        bottom: n
                                    }, o ? P.pathListRel.push([ o, {
                                        x: t,
                                        y: n
                                    } ]) : P.pathListRel = [], o = {
                                        x: t,
                                        y: n
                                    };
                                }), P.pathListRel.push([]), e = P.strokeWidth / 2, l = [ {
                                    x: i.left - e,
                                    y: i.top - e
                                }, {
                                    x: i.right + e,
                                    y: i.bottom + e
                                } ], P.bBoxRel = {
                                    left: l[0].x,
                                    top: l[0].y,
                                    right: l[1].x,
                                    bottom: l[1].y,
                                    width: l[1].x - l[0].x,
                                    height: l[1].y - l[0].y
                                };
                            }
                            W.pathListRel = W.bBoxRel = !0;
                        }
                        return (W.pathListRel || W.elementLeft || W.elementTop) && (P.pathData = we(P.pathListRel, function(e) {
                            e.x += a.left, e.y += a.top;
                        })), We(t, N, "strokeWidth", n = P.strokeWidth) && (t.path.style.strokeWidth = n + "px"), 
                        Me(n = P.pathData, N.pathData) && (t.path.setPathData(n), N.pathData = n, W.pathData = !0), 
                        t.dash && (!W.pathData && (!W.strokeWidth || t.dashLen && t.dashGap) || (P.dashLen = t.dashLen || 2 * P.strokeWidth, 
                        P.dashGap = t.dashGap || P.strokeWidth), W.dash = We(t, N, "dashLen", P.dashLen) || W.dash, 
                        W.dash = We(t, N, "dashGap", P.dashGap) || W.dash, W.dash && (t.path.style.strokeDasharray = N.dashLen + "," + N.dashGap)), 
                        C = P.viewBoxBBox, L = N.viewBoxBBox, A = t.svg.viewBox.baseVal, V = t.svg.style, 
                        C.x = P.bBoxRel.left + a.left, C.y = P.bBoxRel.top + a.top, C.width = P.bBoxRel.width, 
                        C.height = P.bBoxRel.height, [ "x", "y", "width", "height" ].forEach(function(e) {
                            (n = C[e]) !== L[e] && (A[e] = L[e] = n, V[oe[e]] = n + ("x" === e || "y" === e ? t.bodyOffset[e] : 0) + "px");
                        }), W.strokeWidth || W.pathListRel || W.bBoxRel;
                    }
                },
                mouseHoverAnchor: {
                    type: "anchor",
                    argOptions: [ {
                        optionName: "element",
                        type: ye
                    }, {
                        optionName: "showEffectName",
                        type: "string"
                    } ],
                    style: {
                        backgroundImage: "url('data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cG9seWdvbiBwb2ludHM9IjI0LDAgMCw4IDgsMTEgMCwxOSA1LDI0IDEzLDE2IDE2LDI0IiBmaWxsPSJjb3JhbCIvPjwvc3ZnPg==')",
                        backgroundSize: "",
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "#f8f881",
                        cursor: "default"
                    },
                    hoverStyle: {
                        backgroundImage: "none",
                        backgroundColor: "#fadf8f"
                    },
                    padding: {
                        top: 1,
                        right: 15,
                        bottom: 1,
                        left: 2
                    },
                    minHeight: 15,
                    backgroundPosition: {
                        right: 2,
                        top: 2
                    },
                    backgroundSize: {
                        width: 12,
                        height: 12
                    },
                    dirKeys: [ [ "top", "Top" ], [ "right", "Right" ], [ "bottom", "Bottom" ], [ "left", "Left" ] ],
                    init: function(a, i) {
                        var o, t, e, n, l, r, s, u, h, p, c, d = y.mouseHoverAnchor, f = {};
                        if (a.element = y.pointAnchor.checkElement(i.element), u = a.element, !((p = u.ownerDocument) && (h = p.defaultView) && h.HTMLElement && u instanceof h.HTMLElement)) throw new Error("`element` must be HTML element");
                        return d.style.backgroundSize = d.backgroundSize.width + "px " + d.backgroundSize.height + "px", 
                        [ "style", "hoverStyle" ].forEach(function(e) {
                            var n = d[e];
                            a[e] = Object.keys(n).reduce(function(e, t) {
                                return e[t] = n[t], e;
                            }, {});
                        }), "inline" === (o = a.element.ownerDocument.defaultView.getComputedStyle(a.element, "")).display ? a.style.display = "inline-block" : "none" === o.display && (a.style.display = "block"), 
                        y.mouseHoverAnchor.dirKeys.forEach(function(e) {
                            var t = e[0], n = "padding" + e[1];
                            parseFloat(o[n]) < d.padding[t] && (a.style[n] = d.padding[t] + "px");
                        }), a.style.display && (n = a.element.style.display, a.element.style.display = a.style.display), 
                        y.mouseHoverAnchor.dirKeys.forEach(function(e) {
                            var t = "padding" + e[1];
                            a.style[t] && (f[t] = a.element.style[t], a.element.style[t] = a.style[t]);
                        }), (e = a.element.getBoundingClientRect()).height < d.minHeight && (le ? (c = d.minHeight, 
                        "content-box" === o.boxSizing ? c -= parseFloat(o.borderTopWidth) + parseFloat(o.borderBottomWidth) + parseFloat(o.paddingTop) + parseFloat(o.paddingBottom) : "padding-box" === o.boxSizing && (c -= parseFloat(o.borderTopWidth) + parseFloat(o.borderBottomWidth)), 
                        a.style.height = c + "px") : a.style.height = parseFloat(o.height) + (d.minHeight - e.height) + "px"), 
                        a.style.backgroundPosition = ue ? e.width - d.backgroundSize.width - d.backgroundPosition.right + "px " + d.backgroundPosition.top + "px" : "right " + d.backgroundPosition.right + "px top " + d.backgroundPosition.top + "px", 
                        a.style.display && (a.element.style.display = n), y.mouseHoverAnchor.dirKeys.forEach(function(e) {
                            var t = "padding" + e[1];
                            a.style[t] && (a.element.style[t] = f[t]);
                        }), [ "style", "hoverStyle" ].forEach(function(e) {
                            var t = a[e], n = i[e];
                            k(n) && Object.keys(n).forEach(function(e) {
                                "string" == typeof n[e] || w(n[e]) ? t[e] = n[e] : null == n[e] && delete t[e];
                            });
                        }), "function" == typeof i.onSwitch && (s = i.onSwitch), i.showEffectName && g[i.showEffectName] && (a.showEffectName = l = i.showEffectName), 
                        r = i.animOptions, a.elmStyle = t = a.element.style, a.mouseenter = function(e) {
                            a.hoverStyleSave = d.getStyles(t, Object.keys(a.hoverStyle)), d.setStyles(t, a.hoverStyle), 
                            a.boundTargets.forEach(function(e) {
                                je(e.props, !0, l, r);
                            }), s && s(e);
                        }, a.mouseleave = function(e) {
                            d.setStyles(t, a.hoverStyleSave), a.boundTargets.forEach(function(e) {
                                je(e.props, !1, l, r);
                            }), s && s(e);
                        }, !0;
                    },
                    bind: function(e, t) {
                        var n, a, i, o, l;
                        return t.props.svg ? y.mouseHoverAnchor.llShow(t.props, !1, e.showEffectName) : Le(function() {
                            y.mouseHoverAnchor.llShow(t.props, !1, e.showEffectName);
                        }), e.enabled || (e.styleSave = y.mouseHoverAnchor.getStyles(e.elmStyle, Object.keys(e.style)), 
                        y.mouseHoverAnchor.setStyles(e.elmStyle, e.style), e.removeEventListener = (n = e.element, 
                        a = e.mouseenter, i = e.mouseleave, "onmouseenter" in n && "onmouseleave" in n ? (n.addEventListener("mouseenter", a, !1), 
                        n.addEventListener("mouseleave", i, !1), function() {
                            n.removeEventListener("mouseenter", a, !1), n.removeEventListener("mouseleave", i, !1);
                        }) : (console.warn("mouseenter and mouseleave events polyfill is enabled."), o = function(e) {
                            e.relatedTarget && (e.relatedTarget === this || this.compareDocumentPosition(e.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY) || a.apply(this, arguments);
                        }, n.addEventListener("mouseover", o), l = function(e) {
                            e.relatedTarget && (e.relatedTarget === this || this.compareDocumentPosition(e.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY) || i.apply(this, arguments);
                        }, n.addEventListener("mouseout", l), function() {
                            n.removeEventListener("mouseover", o, !1), n.removeEventListener("mouseout", l, !1);
                        })), e.enabled = !0), !0;
                    },
                    unbind: function(e, t) {
                        e.enabled && e.boundTargets.length <= 1 && (e.removeEventListener(), y.mouseHoverAnchor.setStyles(e.elmStyle, e.styleSave), 
                        e.enabled = !1), y.mouseHoverAnchor.llShow(t.props, !0, e.showEffectName);
                    },
                    removeOption: function(e, t) {
                        y.pointAnchor.removeOption(e, t);
                    },
                    remove: function(t) {
                        t.boundTargets.length && (console.error("LeaderLineAttachment was not unbound by remove"), 
                        t.boundTargets.forEach(function(e) {
                            y.mouseHoverAnchor.unbind(t, e);
                        }));
                    },
                    getBBoxNest: function(e, t) {
                        return ge(e.element, t.baseWindow);
                    },
                    llShow: function(e, t, n) {
                        g[n || e.curStats.show_effect].stop(e, !0, t), e.aplStats.show_on = t;
                    },
                    getStyles: function(n, e) {
                        return e.reduce(function(e, t) {
                            return e[t] = n[t], e;
                        }, {});
                    },
                    setStyles: function(t, n) {
                        Object.keys(n).forEach(function(e) {
                            t[e] = n[e];
                        });
                    }
                },
                captionLabel: {
                    type: "label",
                    argOptions: [ {
                        optionName: "text",
                        type: "string"
                    } ],
                    stats: {
                        color: {},
                        x: {},
                        y: {}
                    },
                    textStyleProps: [ "fontFamily", "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "fontSizeAdjust", "kerning", "letterSpacing", "wordSpacing", "textDecoration" ],
                    init: function(u, t) {
                        return "string" == typeof t.text && (u.text = t.text.trim()), !!u.text && ("string" == typeof t.color && (u.color = t.color.trim()), 
                        u.outlineColor = "string" == typeof t.outlineColor ? t.outlineColor.trim() : "#fff", 
                        Array.isArray(t.offset) && w(t.offset[0]) && w(t.offset[1]) && (u.offset = {
                            x: t.offset[0],
                            y: t.offset[1]
                        }), w(t.lineOffset) && (u.lineOffset = t.lineOffset), y.captionLabel.textStyleProps.forEach(function(e) {
                            null != t[e] && (u[e] = t[e]);
                        }), u.updateColor = function(e) {
                            y.captionLabel.updateColor(u, e);
                        }, u.updateSocketXY = function(e) {
                            var t, n, a, i, o = u.curStats, l = u.aplStats, r = e.curStats, s = r.position_socketXYSE[u.socketIndex];
                            null != s.x && (u.offset ? (o.x = s.x + u.offset.x, o.y = s.y + u.offset.y) : (t = u.height / 2, 
                            n = Math.max(r.attach_plugSideLenSE[u.socketIndex] || 0, r.line_strokeWidth / 2), 
                            a = r.position_socketXYSE[u.socketIndex ? 0 : 1], s.socketId === L || s.socketId === I ? (o.x = s.socketId === L ? s.x - t - u.width : s.x + t, 
                            o.y = a.y < s.y ? s.y + n + t : s.y - n - t - u.height) : (o.x = a.x < s.x ? s.x + n + t : s.x - n - t - u.width, 
                            o.y = s.socketId === M ? s.y - t - u.height : s.y + t)), We(u, l, "x", i = o.x) && (u.elmPosition.x.baseVal.getItem(0).value = i), 
                            We(u, l, "y", i = o.y) && (u.elmPosition.y.baseVal.getItem(0).value = i + u.height));
                        }, u.updatePath = function(e) {
                            var t, n, a = u.curStats, i = u.aplStats, o = e.pathList.animVal || e.pathList.baseVal;
                            o && (t = y.captionLabel.getMidPoint(o, u.lineOffset), a.x = t.x - u.width / 2, 
                            a.y = t.y - u.height / 2, We(u, i, "x", n = a.x) && (u.elmPosition.x.baseVal.getItem(0).value = n), 
                            We(u, i, "y", n = a.y) && (u.elmPosition.y.baseVal.getItem(0).value = n + u.height));
                        }, u.updateShow = function(e) {
                            y.captionLabel.updateShow(u, e);
                        }, ue && (u.adjustEdge = function(e, t) {
                            var n = u.curStats;
                            null != n.x && y.captionLabel.adjustEdge(t, {
                                x: n.x,
                                y: n.y,
                                width: u.width,
                                height: u.height
                            }, u.strokeWidth / 2);
                        }), !0);
                    },
                    updateColor: function(e, t) {
                        var n, a = e.curStats, i = e.aplStats, o = t.curStats;
                        a.color = n = e.color || o.line_color, We(e, i, "color", n) && (e.styleFill.fill = n);
                    },
                    updateShow: function(e, t) {
                        var n = !0 === t.isShown;
                        n !== e.isShown && (e.styleShow.visibility = n ? "" : "hidden", e.isShown = n);
                    },
                    adjustEdge: function(e, t, n) {
                        var a = {
                            x1: t.x - n,
                            y1: t.y - n,
                            x2: t.x + t.width + n,
                            y2: t.y + t.height + n
                        };
                        a.x1 < e.x1 && (e.x1 = a.x1), a.y1 < e.y1 && (e.y1 = a.y1), a.x2 > e.x2 && (e.x2 = a.x2), 
                        a.y2 > e.y2 && (e.y2 = a.y2);
                    },
                    newText: function(e, t, n, a, i) {
                        var o, l, r, s, u, h;
                        return (o = t.createElementNS(b, "text")).textContent = e, [ o.x, o.y ].forEach(function(e) {
                            var t = n.createSVGLength();
                            t.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0), e.baseVal.initialize(t);
                        }), "boolean" != typeof f && (f = "paintOrder" in o.style), i && !f ? (r = t.createElementNS(b, "defs"), 
                        o.id = a, r.appendChild(o), (u = (l = t.createElementNS(b, "g")).appendChild(t.createElementNS(b, "use"))).href.baseVal = "#" + a, 
                        (s = l.appendChild(t.createElementNS(b, "use"))).href.baseVal = "#" + a, (h = u.style).strokeLinejoin = "round", 
                        {
                            elmPosition: o,
                            styleText: o.style,
                            styleFill: s.style,
                            styleStroke: h,
                            styleShow: l.style,
                            elmsAppend: [ r, l ]
                        }) : (h = o.style, i && (h.strokeLinejoin = "round", h.paintOrder = "stroke"), {
                            elmPosition: o,
                            styleText: h,
                            styleFill: h,
                            styleStroke: i ? h : null,
                            styleShow: h,
                            elmsAppend: [ o ]
                        });
                    },
                    getMidPoint: function(e, t) {
                        var n, a, i, o = Oe(e), l = o.segsLen, r = o.lenAll, s = -1;
                        if ((n = r / 2 + (t || 0)) <= 0) return 2 === (a = e[0]).length ? ve(a[0], a[1], 0) : xe(a[0], a[1], a[2], a[3], 0);
                        if (r <= n) return 2 === (a = e[e.length - 1]).length ? ve(a[0], a[1], 1) : xe(a[0], a[1], a[2], a[3], 1);
                        for (i = []; n > l[++s]; ) i.push(e[s]), n -= l[s];
                        return 2 === (a = e[s]).length ? ve(a[0], a[1], n / l[s]) : xe(a[0], a[1], a[2], a[3], ke(a[0], a[1], a[2], a[3], n));
                    },
                    initSvg: function(t, n) {
                        var e, a, i = y.captionLabel.newText(t.text, n.baseWindow.document, n.svg, v + "-captionLabel-" + t._id, t.outlineColor);
                        [ "elmPosition", "styleFill", "styleShow", "elmsAppend" ].forEach(function(e) {
                            t[e] = i[e];
                        }), t.isShown = !1, t.styleShow.visibility = "hidden", y.captionLabel.textStyleProps.forEach(function(e) {
                            null != t[e] && (i.styleText[e] = t[e]);
                        }), i.elmsAppend.forEach(function(e) {
                            n.svg.appendChild(e);
                        }), e = i.elmPosition.getBBox(), t.width = e.width, t.height = e.height, t.outlineColor && (a = 10 < (a = e.height / 9) ? 10 : a < 2 ? 2 : a, 
                        i.styleStroke.strokeWidth = a + "px", i.styleStroke.stroke = t.outlineColor), t.strokeWidth = a || 0, 
                        Te(t.aplStats, y.captionLabel.stats), t.updateColor(n), t.refSocketXY ? t.updateSocketXY(n) : t.updatePath(n), 
                        ue && De(n, {}), t.updateShow(n);
                    },
                    bind: function(e, t) {
                        var n = t.props;
                        return e.color || Ie(n, "cur_line_color", e.updateColor), (e.refSocketXY = "startLabel" === t.optionName || "endLabel" === t.optionName) ? (e.socketIndex = "startLabel" === t.optionName ? 0 : 1, 
                        Ie(n, "apl_position", e.updateSocketXY), e.offset || (Ie(n, "cur_attach_plugSideLenSE", e.updateSocketXY), 
                        Ie(n, "cur_line_strokeWidth", e.updateSocketXY))) : Ie(n, "apl_path", e.updatePath), 
                        Ie(n, "svgShow", e.updateShow), ue && Ie(n, "new_edge4viewBox", e.adjustEdge), y.captionLabel.initSvg(e, n), 
                        !0;
                    },
                    unbind: function(e, t) {
                        var n = t.props;
                        e.elmsAppend && (e.elmsAppend.forEach(function(e) {
                            n.svg.removeChild(e);
                        }), e.elmPosition = e.styleFill = e.styleShow = e.elmsAppend = null), Te(e.curStats, y.captionLabel.stats), 
                        Te(e.aplStats, y.captionLabel.stats), e.color || Ce(n, "cur_line_color", e.updateColor), 
                        e.refSocketXY ? (Ce(n, "apl_position", e.updateSocketXY), e.offset || (Ce(n, "cur_attach_plugSideLenSE", e.updateSocketXY), 
                        Ce(n, "cur_line_strokeWidth", e.updateSocketXY))) : Ce(n, "apl_path", e.updatePath), 
                        Ce(n, "svgShow", e.updateShow), ue && (Ce(n, "new_edge4viewBox", e.adjustEdge), 
                        De(n, {}));
                    },
                    removeOption: function(e, t) {
                        var n = t.props, a = {};
                        a[t.optionName] = "", Ze(n, a);
                    },
                    remove: function(t) {
                        t.boundTargets.length && (console.error("LeaderLineAttachment was not unbound by remove"), 
                        t.boundTargets.forEach(function(e) {
                            y.captionLabel.unbind(t, e);
                        }));
                    }
                },
                pathLabel: {
                    type: "label",
                    argOptions: [ {
                        optionName: "text",
                        type: "string"
                    } ],
                    stats: {
                        color: {},
                        startOffset: {},
                        pathData: {}
                    },
                    init: function(s, t) {
                        return "string" == typeof t.text && (s.text = t.text.trim()), !!s.text && ("string" == typeof t.color && (s.color = t.color.trim()), 
                        s.outlineColor = "string" == typeof t.outlineColor ? t.outlineColor.trim() : "#fff", 
                        w(t.lineOffset) && (s.lineOffset = t.lineOffset), y.captionLabel.textStyleProps.forEach(function(e) {
                            null != t[e] && (s[e] = t[e]);
                        }), s.updateColor = function(e) {
                            y.captionLabel.updateColor(s, e);
                        }, s.updatePath = function(e) {
                            var t, n = s.curStats, a = s.aplStats, i = e.curStats, o = e.pathList.animVal || e.pathList.baseVal;
                            o && (n.pathData = t = y.pathLabel.getOffsetPathData(o, i.line_strokeWidth / 2 + s.strokeWidth / 2 + s.height / 4, 1.25 * s.height), 
                            Me(t, a.pathData) && (s.elmPath.setPathData(t), a.pathData = t, s.bBox = s.elmPosition.getBBox(), 
                            s.updateStartOffset(e)));
                        }, s.updateStartOffset = function(e) {
                            var t, n, a, i, o = s.curStats, l = s.aplStats, r = e.curStats;
                            o.pathData && ((2 !== s.semIndex || s.lineOffset) && (t = o.pathData.reduce(function(e, t) {
                                var n, a = t.values;
                                switch (t.type) {
                                  case "M":
                                    i = {
                                        x: a[0],
                                        y: a[1]
                                    };
                                    break;

                                  case "L":
                                    n = {
                                        x: a[0],
                                        y: a[1]
                                    }, i && (e += _e(i, n)), i = n;
                                    break;

                                  case "C":
                                    n = {
                                        x: a[4],
                                        y: a[5]
                                    }, i && (e += be(i, {
                                        x: a[0],
                                        y: a[1]
                                    }, {
                                        x: a[2],
                                        y: a[3]
                                    }, n)), i = n;
                                }
                                return e;
                            }, 0), a = 0 === s.semIndex ? 0 : 1 === s.semIndex ? t : t / 2, 2 !== s.semIndex && (n = Math.max(r.attach_plugBackLenSE[s.semIndex] || 0, r.line_strokeWidth / 2) + s.strokeWidth / 2 + s.height / 4, 
                            a = (a += 0 === s.semIndex ? n : -n) < 0 ? 0 : t < a ? t : a), s.lineOffset && (a = (a += s.lineOffset) < 0 ? 0 : t < a ? t : a), 
                            o.startOffset = a, We(s, l, "startOffset", a) && (s.elmOffset.startOffset.baseVal.value = a)));
                        }, s.updateShow = function(e) {
                            y.captionLabel.updateShow(s, e);
                        }, ue && (s.adjustEdge = function(e, t) {
                            s.bBox && y.captionLabel.adjustEdge(t, s.bBox, s.strokeWidth / 2);
                        }), !0);
                    },
                    getOffsetPathData: function(e, x, n) {
                        var b, a, i = 3, k = [];
                        function w(e, t) {
                            return Math.abs(e.x - t.x) < i && Math.abs(e.y - t.y) < i;
                        }
                        return e.forEach(function(e) {
                            var t, n, a, i, o, l, r, s, u, h, p, c, d, f, y, S, m, g, _, v, E;
                            2 === e.length ? (g = e[0], _ = e[1], v = x, E = Math.atan2(g.y - _.y, _.x - g.x) + .5 * Math.PI, 
                            t = [ {
                                x: g.x + Math.cos(E) * v,
                                y: g.y + Math.sin(E) * v * -1
                            }, {
                                x: _.x + Math.cos(E) * v,
                                y: _.y + Math.sin(E) * v * -1
                            } ], b ? (a = b.points, 0 <= (i = Math.atan2(a[1].y - a[0].y, a[0].x - a[1].x) - Math.atan2(e[0].y - e[1].y, e[1].x - e[0].x)) && i <= Math.PI ? n = {
                                type: "line",
                                points: t,
                                inside: !0
                            } : (l = Ee(a[0], a[1], x), o = Ee(t[1], t[0], x), s = a[0], h = o, p = t[1], c = (u = l).x - s.x, 
                            d = u.y - s.y, f = p.x - h.x, y = p.y - h.y, S = (-d * (s.x - h.x) + c * (s.y - h.y)) / (-f * d + c * y), 
                            m = (f * (s.y - h.y) - y * (s.x - h.x)) / (-f * d + c * y), (r = 0 <= S && S <= 1 && 0 <= m && m <= 1 ? {
                                x: s.x + m * c,
                                y: s.y + m * d
                            } : null) ? n = {
                                type: "line",
                                points: [ a[1] = r, t[1] ]
                            } : (a[1] = w(o, l) ? o : l, n = {
                                type: "line",
                                points: [ o, t[1] ]
                            }), b.len = _e(a[0], a[1]))) : n = {
                                type: "line",
                                points: t
                            }, n.len = _e(n.points[0], n.points[1]), k.push(b = n)) : (k.push({
                                type: "cubic",
                                points: function(e, t, n, a, i, o) {
                                    for (var l, r, s = be(e, t, n, a) / o, u = 1 / (o < i ? s * (i / o) : s), h = [], p = 0; r = (90 - (l = xe(e, t, n, a, p)).angle) * (Math.PI / 180), 
                                    h.push({
                                        x: l.x + Math.cos(r) * i,
                                        y: l.y + Math.sin(r) * i * -1
                                    }), !(1 <= p); ) 1 < (p += u) && (p = 1);
                                    return h;
                                }(e[0], e[1], e[2], e[3], x, 16)
                            }), b = null);
                        }), b = null, k.forEach(function(e) {
                            var t;
                            "line" === e.type ? (e.inside && (b.len > x ? ((t = b.points)[1] = Ee(t[0], t[1], -x), 
                            b.len = _e(t[0], t[1])) : (b.points = null, b.len = 0), e.len > x + n ? ((t = e.points)[0] = Ee(t[1], t[0], -(x + n)), 
                            e.len = _e(t[0], t[1])) : (e.points = null, e.len = 0)), b = e) : b = null;
                        }), k.reduce(function(t, e) {
                            var n = e.points;
                            return n && (a && w(n[0], a) || t.push({
                                type: "M",
                                values: [ n[0].x, n[0].y ]
                            }), "line" === e.type ? t.push({
                                type: "L",
                                values: [ n[1].x, n[1].y ]
                            }) : (n.shift(), n.forEach(function(e) {
                                t.push({
                                    type: "L",
                                    values: [ e.x, e.y ]
                                });
                            })), a = n[n.length - 1]), t;
                        }, []);
                    },
                    newText: function(e, t, n, a) {
                        var i, o, l, r, s, u, h, p, c, d;
                        return (r = (l = t.createElementNS(b, "defs")).appendChild(t.createElementNS(b, "path"))).id = i = n + "-path", 
                        (u = (s = t.createElementNS(b, "text")).appendChild(t.createElementNS(b, "textPath"))).href.baseVal = "#" + i, 
                        u.startOffset.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0), u.textContent = e, 
                        "boolean" != typeof f && (f = "paintOrder" in s.style), a && !f ? (s.id = o = n + "-text", 
                        l.appendChild(s), (c = (h = t.createElementNS(b, "g")).appendChild(t.createElementNS(b, "use"))).href.baseVal = "#" + o, 
                        (p = h.appendChild(t.createElementNS(b, "use"))).href.baseVal = "#" + o, (d = c.style).strokeLinejoin = "round", 
                        {
                            elmPosition: s,
                            elmPath: r,
                            elmOffset: u,
                            styleText: s.style,
                            styleFill: p.style,
                            styleStroke: d,
                            styleShow: h.style,
                            elmsAppend: [ l, h ]
                        }) : (d = s.style, a && (d.strokeLinejoin = "round", d.paintOrder = "stroke"), {
                            elmPosition: s,
                            elmPath: r,
                            elmOffset: u,
                            styleText: d,
                            styleFill: d,
                            styleStroke: a ? d : null,
                            styleShow: d,
                            elmsAppend: [ l, s ]
                        });
                    },
                    initSvg: function(t, n) {
                        var e, a, i = y.pathLabel.newText(t.text, n.baseWindow.document, v + "-pathLabel-" + t._id, t.outlineColor);
                        [ "elmPosition", "elmPath", "elmOffset", "styleFill", "styleShow", "elmsAppend" ].forEach(function(e) {
                            t[e] = i[e];
                        }), t.isShown = !1, t.styleShow.visibility = "hidden", y.captionLabel.textStyleProps.forEach(function(e) {
                            null != t[e] && (i.styleText[e] = t[e]);
                        }), i.elmsAppend.forEach(function(e) {
                            n.svg.appendChild(e);
                        }), i.elmPath.setPathData([ {
                            type: "M",
                            values: [ 0, 100 ]
                        }, {
                            type: "h",
                            values: [ 100 ]
                        } ]), e = i.elmPosition.getBBox(), i.styleText.textAnchor = [ "start", "end", "middle" ][t.semIndex], 
                        2 !== t.semIndex || t.lineOffset || i.elmOffset.startOffset.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 50), 
                        t.height = e.height, t.outlineColor && (a = 10 < (a = e.height / 9) ? 10 : a < 2 ? 2 : a, 
                        i.styleStroke.strokeWidth = a + "px", i.styleStroke.stroke = t.outlineColor), t.strokeWidth = a || 0, 
                        Te(t.aplStats, y.pathLabel.stats), t.updateColor(n), t.updatePath(n), t.updateStartOffset(n), 
                        ue && De(n, {}), t.updateShow(n);
                    },
                    bind: function(e, t) {
                        var n = t.props;
                        return e.color || Ie(n, "cur_line_color", e.updateColor), Ie(n, "cur_line_strokeWidth", e.updatePath), 
                        Ie(n, "apl_path", e.updatePath), e.semIndex = "startLabel" === t.optionName ? 0 : "endLabel" === t.optionName ? 1 : 2, 
                        (2 !== e.semIndex || e.lineOffset) && Ie(n, "cur_attach_plugBackLenSE", e.updateStartOffset), 
                        Ie(n, "svgShow", e.updateShow), ue && Ie(n, "new_edge4viewBox", e.adjustEdge), y.pathLabel.initSvg(e, n), 
                        !0;
                    },
                    unbind: function(e, t) {
                        var n = t.props;
                        e.elmsAppend && (e.elmsAppend.forEach(function(e) {
                            n.svg.removeChild(e);
                        }), e.elmPosition = e.elmPath = e.elmOffset = e.styleFill = e.styleShow = e.elmsAppend = null), 
                        Te(e.curStats, y.pathLabel.stats), Te(e.aplStats, y.pathLabel.stats), e.color || Ce(n, "cur_line_color", e.updateColor), 
                        Ce(n, "cur_line_strokeWidth", e.updatePath), Ce(n, "apl_path", e.updatePath), (2 !== e.semIndex || e.lineOffset) && Ce(n, "cur_attach_plugBackLenSE", e.updateStartOffset), 
                        Ce(n, "svgShow", e.updateShow), ue && (Ce(n, "new_edge4viewBox", e.adjustEdge), 
                        De(n, {}));
                    },
                    removeOption: function(e, t) {
                        var n = t.props, a = {};
                        a[t.optionName] = "", Ze(n, a);
                    },
                    remove: function(t) {
                        t.boundTargets.length && (console.error("LeaderLineAttachment was not unbound by remove"), 
                        t.boundTargets.forEach(function(e) {
                            y.pathLabel.unbind(t, e);
                        }));
                    }
                }
            }, Object.keys(y).forEach(function(e) {
                Ye[e] = function() {
                    return new S(y[e], Array.prototype.slice.call(arguments));
                };
            }), Ye.positionByWindowResize = !0, window.addEventListener("resize", O.add(function() {
                Ye.positionByWindowResize && Object.keys(K).forEach(function(e) {
                    De(K[e], {
                        position: !0
                    });
                });
            }), !1), Ye;
        }();
        exports.LeaderLine = LeaderLine;
    }
};

//src/connect/plain-draggable.js
/*! PlainDraggable v2.5.12 (c) anseki https://anseki.github.io/plain-draggable/ */
/*
by zhh 2020-3-17 10:42:31
修改1._p[6]={
value: function(require, exports) {{原内容;exports.PlainDraggable = PlainDraggable;}}
*/
_p[6] = {
    value: function(require, exports) {
        var PlainDraggable = function(t) {
            var e = {};
            function n(r) {
                if (e[r]) return e[r].exports;
                var o = e[r] = {
                    i: r,
                    l: !1,
                    exports: {}
                };
                return t[r].call(o.exports, o, o.exports, n), o.l = !0, o.exports;
            }
            return n.m = t, n.c = e, n.d = function(t, e, r) {
                n.o(t, e) || Object.defineProperty(t, e, {
                    enumerable: !0,
                    get: r
                });
            }, n.r = function(t) {
                "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
                    value: "Module"
                }), Object.defineProperty(t, "__esModule", {
                    value: !0
                });
            }, n.t = function(t, e) {
                if (1 & e && (t = n(t)), 8 & e) return t;
                if (4 & e && "object" == typeof t && t && t.__esModule) return t;
                var r = Object.create(null);
                if (n.r(r), Object.defineProperty(r, "default", {
                    enumerable: !0,
                    value: t
                }), 2 & e && "string" != typeof t) for (var o in t) n.d(r, o, function(e) {
                    return t[e];
                }.bind(null, o));
                return r;
            }, n.n = function(t) {
                var e = t && t.__esModule ? function() {
                    return t.default;
                } : function() {
                    return t;
                };
                return n.d(e, "a", e), e;
            }, n.o = function(t, e) {
                return Object.prototype.hasOwnProperty.call(t, e);
            }, n.p = "", n(n.s = 0);
        }([ function(t, e, n) {
            "use strict";
            n.r(e);
            var r = 500, o = [], i = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(t) {
                return setTimeout(t, 1e3 / 60);
            }, a = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(t) {
                return clearTimeout(t);
            }, l = Date.now(), u = void 0;
            function s() {
                var t = void 0, e = void 0;
                u && (a.call(window, u), u = null), o.forEach(function(e) {
                    var n;
                    (n = e.event) && (e.event = null, e.listener(n), t = !0);
                }), t ? (l = Date.now(), e = !0) : Date.now() - l < r && (e = !0), e && (u = i.call(window, s));
            }
            function d(t) {
                var e = -1;
                return o.some(function(n, r) {
                    return n.listener === t && (e = r, !0);
                }), e;
            }
            var c = {
                add: function(t) {
                    var e = void 0;
                    return -1 === d(t) ? (o.push(e = {
                        listener: t
                    }), function(t) {
                        e.event = t, u || s();
                    }) : null;
                },
                remove: function(t) {
                    var e;
                    (e = d(t)) > -1 && (o.splice(e, 1), !o.length && u && (a.call(window, u), u = null));
                }
            }, f = function() {
                function t(t, e) {
                    for (var n = 0; n < e.length; n++) {
                        var r = e[n];
                        r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                        Object.defineProperty(t, r.key, r);
                    }
                }
                return function(e, n, r) {
                    return n && t(e.prototype, n), r && t(e, r), e;
                };
            }();
            var p = !1;
            try {
                window.addEventListener("test", null, Object.defineProperty({}, "passive", {
                    get: function() {
                        p = !0;
                    }
                }));
            } catch (t) {}
            function v(t, e, n, r) {
                t.addEventListener(e, n, p ? r : r.capture);
            }
            function h(t, e) {
                if (null != t && null != e) for (var n = 0; n < t.length; n++) if (t[n].identifier === e) return t[n];
                return null;
            }
            function m(t) {
                return t && "number" == typeof t.clientX && "number" == typeof t.clientY;
            }
            function g(t) {
                t.preventDefault();
            }
            var y = function() {
                function t(e) {
                    var n = this;
                    !function(t, e) {
                        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                    }(this, t), this.startHandlers = {}, this.lastHandlerId = 0, this.curPointerClass = null, 
                    this.curTouchId = null, this.lastPointerXY = {
                        clientX: 0,
                        clientY: 0
                    }, this.lastTouchTime = 0, this.options = {
                        preventDefault: !0,
                        stopPropagation: !0
                    }, e && [ "preventDefault", "stopPropagation" ].forEach(function(t) {
                        "boolean" == typeof e[t] && (n.options[t] = e[t]);
                    });
                }
                return f(t, [ {
                    key: "regStartHandler",
                    value: function(t) {
                        var e = this;
                        return e.startHandlers[++e.lastHandlerId] = function(n) {
                            var r = "mousedown" === n.type ? "mouse" : "touch", o = Date.now(), i = void 0, a = void 0;
                            if ("touch" === r) e.lastTouchTime = o, i = n.changedTouches[0], a = n.changedTouches[0].identifier; else {
                                if (o - e.lastTouchTime < 400) return;
                                i = n;
                            }
                            if (!m(i)) throw new Error("No clientX/clientY");
                            e.curPointerClass && e.cancel(), t.call(e, i) && (e.curPointerClass = r, e.curTouchId = "touch" === r ? a : null, 
                            e.lastPointerXY.clientX = i.clientX, e.lastPointerXY.clientY = i.clientY, e.options.preventDefault && n.preventDefault(), 
                            e.options.stopPropagation && n.stopPropagation());
                        }, e.lastHandlerId;
                    }
                }, {
                    key: "unregStartHandler",
                    value: function(t) {
                        delete this.startHandlers[t];
                    }
                }, {
                    key: "addStartHandler",
                    value: function(t, e) {
                        if (!this.startHandlers[e]) throw new Error("Invalid handlerId: " + e);
                        return v(t, "mousedown", this.startHandlers[e], {
                            capture: !1,
                            passive: !1
                        }), v(t, "touchstart", this.startHandlers[e], {
                            capture: !1,
                            passive: !1
                        }), v(t, "dragstart", g, {
                            capture: !1,
                            passive: !1
                        }), e;
                    }
                }, {
                    key: "removeStartHandler",
                    value: function(t, e) {
                        if (!this.startHandlers[e]) throw new Error("Invalid handlerId: " + e);
                        return t.removeEventListener("mousedown", this.startHandlers[e], !1), t.removeEventListener("touchstart", this.startHandlers[e], !1), 
                        t.removeEventListener("dragstart", g, !1), e;
                    }
                }, {
                    key: "addMoveHandler",
                    value: function(t, e) {
                        var n = this, r = c.add(function(t) {
                            var e = "mousemove" === t.type ? "mouse" : "touch";
                            if ("touch" === e && (n.lastTouchTime = Date.now()), e === n.curPointerClass) {
                                var r = "touch" === e ? h(t.changedTouches, n.curTouchId) : t;
                                m(r) && (r.clientX === n.lastPointerXY.clientX && r.clientY === n.lastPointerXY.clientY || n.move(r), 
                                n.options.preventDefault && t.preventDefault(), n.options.stopPropagation && t.stopPropagation());
                            }
                        });
                        v(t, "mousemove", r, {
                            capture: !1,
                            passive: !1
                        }), v(t, "touchmove", r, {
                            capture: !1,
                            passive: !1
                        }), n.curMoveHandler = e;
                    }
                }, {
                    key: "move",
                    value: function(t) {
                        m(t) && (this.lastPointerXY.clientX = t.clientX, this.lastPointerXY.clientY = t.clientY), 
                        this.curMoveHandler && this.curMoveHandler(this.lastPointerXY);
                    }
                }, {
                    key: "addEndHandler",
                    value: function(t, e) {
                        var n = this;
                        function r(t) {
                            var e = "mouseup" === t.type ? "mouse" : "touch";
                            if ("touch" === e && (n.lastTouchTime = Date.now()), e === n.curPointerClass) {
                                var r = "touch" === e ? h(t.changedTouches, n.curTouchId) || (h(t.touches, n.curTouchId) ? null : {}) : t;
                                r && (n.end(r), n.options.preventDefault && t.preventDefault(), n.options.stopPropagation && t.stopPropagation());
                            }
                        }
                        v(t, "mouseup", r, {
                            capture: !1,
                            passive: !1
                        }), v(t, "touchend", r, {
                            capture: !1,
                            passive: !1
                        }), n.curEndHandler = e;
                    }
                }, {
                    key: "end",
                    value: function(t) {
                        m(t) && (this.lastPointerXY.clientX = t.clientX, this.lastPointerXY.clientY = t.clientY), 
                        this.curEndHandler && this.curEndHandler(this.lastPointerXY), this.curPointerClass = this.curTouchId = null;
                    }
                }, {
                    key: "addCancelHandler",
                    value: function(t, e) {
                        var n = this;
                        v(t, "touchcancel", function(t) {
                            n.lastTouchTime = Date.now(), null != n.curPointerClass && (h(t.changedTouches, n.curTouchId) || !h(t.touches, n.curTouchId)) && n.cancel();
                        }, {
                            capture: !1,
                            passive: !1
                        }), n.curCancelHandler = e;
                    }
                }, {
                    key: "cancel",
                    value: function() {
                        this.curCancelHandler && this.curCancelHandler(), this.curPointerClass = this.curTouchId = null;
                    }
                } ], [ {
                    key: "addEventListenerWithOptions",
                    get: function() {
                        return v;
                    }
                } ]), t;
            }();
            function x(t) {
                return t.substr(0, 1).toUpperCase() + t.substr(1);
            }
            var w = [ "webkit", "moz", "ms", "o" ], b = w.reduce(function(t, e) {
                return t.push(e), t.push(x(e)), t;
            }, []), S = w.map(function(t) {
                return "-" + t + "-";
            }), E = function() {
                var t = void 0;
                return function() {
                    return t = t || document.createElement("div").style;
                };
            }(), T = function() {
                var t = new RegExp("^(?:" + w.join("|") + ")(.)", "i"), e = /[A-Z]/;
                return function(n) {
                    return "float" === (n = (n + "").replace(/\s/g, "").replace(/-([\da-z])/gi, function(t, e) {
                        return e.toUpperCase();
                    }).replace(t, function(t, n) {
                        return e.test(n) ? n.toLowerCase() : t;
                    })).toLowerCase() ? "cssFloat" : n;
                };
            }(), B = function() {
                var t = new RegExp("^(?:" + S.join("|") + ")", "i");
                return function(e) {
                    return (null != e ? e + "" : "").replace(/\s/g, "").replace(t, "");
                };
            }(), C = function(t, e) {
                var n = E();
                return t = t.replace(/[A-Z]/g, function(t) {
                    return "-" + t.toLowerCase();
                }), n.setProperty(t, e), null != n[t] && n.getPropertyValue(t) === e;
            }, O = {}, H = {};
            function k(t) {
                if ((t = T(t)) && null == O[t]) {
                    var e = E();
                    if (null != e[t]) O[t] = t; else {
                        var n = x(t);
                        b.some(function(r) {
                            var o = r + n;
                            return null != e[o] && (O[t] = o, !0);
                        }) || (O[t] = !1);
                    }
                }
                return O[t] || void 0;
            }
            var P = {
                getName: k,
                getValue: function(t, e) {
                    var n = void 0;
                    return (t = k(t)) ? (H[t] = H[t] || {}, (Array.isArray(e) ? e : [ e ]).some(function(e) {
                        return e = B(e), null != H[t][e] ? !1 !== H[t][e] && (n = H[t][e], !0) : C(t, e) ? (n = H[t][e] = e, 
                        !0) : !!S.some(function(r) {
                            var o = r + e;
                            return !!C(t, o) && (n = H[t][e] = o, !0);
                        }) || (H[t][e] = !1, !1);
                    }), "string" == typeof n ? n : void 0) : n;
                }
            };
            function I(t) {
                return (t + "").trim();
            }
            function _(t, e) {
                e.setAttribute("class", t.join(" "));
            }
            function D(t) {
                return !D.ignoreNative && t.classList || function() {
                    var e = (t.getAttribute("class") || "").trim().split(/\s+/).filter(function(t) {
                        return !!t;
                    }), n = {
                        length: e.length,
                        item: function(t) {
                            return e[t];
                        },
                        contains: function(t) {
                            return -1 !== e.indexOf(I(t));
                        },
                        add: function() {
                            return function(t, e, n) {
                                n.filter(function(e) {
                                    return !(!(e = I(e)) || -1 !== t.indexOf(e) || (t.push(e), 0));
                                }).length && _(t, e);
                            }(e, t, Array.prototype.slice.call(arguments)), D.methodChain ? n : void 0;
                        },
                        remove: function() {
                            return function(t, e, n) {
                                n.filter(function(e) {
                                    var n = void 0;
                                    return !(!(e = I(e)) || -1 === (n = t.indexOf(e)) || (t.splice(n, 1), 0));
                                }).length && _(t, e);
                            }(e, t, Array.prototype.slice.call(arguments)), D.methodChain ? n : void 0;
                        },
                        toggle: function(n, r) {
                            return function(t, e, n, r) {
                                var o = t.indexOf(n = I(n));
                                return -1 !== o ? !!r || (t.splice(o, 1), _(t, e), !1) : !1 !== r && (t.push(n), 
                                _(t, e), !0);
                            }(e, t, n, r);
                        },
                        replace: function(r, o) {
                            return function(t, e, n, r) {
                                var o = void 0;
                                (n = I(n)) && (r = I(r)) && n !== r && -1 !== (o = t.indexOf(n)) && (t.splice(o, 1), 
                                -1 === t.indexOf(r) && t.push(r), _(t, e));
                            }(e, t, r, o), D.methodChain ? n : void 0;
                        }
                    };
                    return n;
                }();
            }
            D.methodChain = !0;
            var X = D, Y = function() {
                function t(t, e) {
                    for (var n = 0; n < e.length; n++) {
                        var r = e[n];
                        r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                        Object.defineProperty(t, r.key, r);
                    }
                }
                return function(e, n, r) {
                    return n && t(e.prototype, n), r && t(e, r), e;
                };
            }(), L = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                return typeof t;
            } : function(t) {
                return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
            };
            X.ignoreNative = !0;
            var A = 9e3, F = 20, W = "tl", j = "both", R = "both", M = "containment", z = [ "tl", "tr", "bl", "br" ], N = [ "start", "end" ], V = [ "inside", "outside" ], G = [ 40, 200, 1e3 ], q = [ 100, 40, 0 ], U = "-ms-scroll-limit" in document.documentElement.style && "-ms-ime-align" in document.documentElement.style && !window.navigator.msPointerEnabled, Z = !U && !!document.uniqueID, $ = "MozAppearance" in document.documentElement.style, J = !(U || $ || !window.chrome || !window.CSS), K = !U && !Z && !$ && !J && !window.chrome && "WebkitAppearance" in document.documentElement.style, Q = function() {
                var t = {}.toString, e = {}.hasOwnProperty.toString, n = e.call(Object);
                return function(r) {
                    var o = void 0, i = void 0;
                    return r && "[object Object]" === t.call(r) && (!(o = Object.getPrototypeOf(r)) || (i = o.hasOwnProperty("constructor") && o.constructor) && "function" == typeof i && e.call(i) === n);
                };
            }(), tt = Number.isFinite || function(t) {
                return "number" == typeof t && window.isFinite(t);
            }, et = {}, nt = {}, rt = new y(), ot = 0, it = void 0, at = void 0, lt = void 0, ut = void 0, st = void 0, dt = void 0, ct = void 0, ft = void 0, pt = void 0, vt = void 0, ht = K ? [ "all-scroll", "move" ] : [ "grab", "all-scroll", "move" ], mt = K ? "move" : [ "grabbing", "move" ], gt = "plain-draggable", yt = "plain-draggable-dragging", xt = "plain-draggable-moving", wt = {}, bt = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(t) {
                return setTimeout(t, 1e3 / 60);
            }, St = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(t) {
                return clearTimeout(t);
            }, Et = function() {
                var t = Date.now();
                [ "x", "y" ].forEach(function(e) {
                    var n = Bt[e];
                    if (n) {
                        var r = t - n.lastFrameTime, o = Ot(Ct, e), i = null != n.lastValue && Math.abs(n.lastValue - o) < 10 ? n.lastValue : o;
                        if (-1 === n.dir ? i > n.min : i < n.max) {
                            var a = i + n.speed * r * n.dir;
                            a < n.min ? a = n.min : a > n.max && (a = n.max), Ot(Ct, e, a), n.lastValue = a;
                        }
                        n.lastFrameTime = t;
                    }
                });
            }, Tt = function t() {
                St.call(window, Ht), Et(), Ht = bt.call(window, t);
            }, Bt = {}, Ct = void 0, Ot = void 0, Ht = void 0;
            function kt(t, e, n) {
                return null != n && ("x" === e ? t.scrollTo(n, t.pageYOffset) : t.scrollTo(t.pageXOffset, n)), 
                "x" === e ? t.pageXOffset : t.pageYOffset;
            }
            function Pt(t, e, n) {
                var r = "x" === e ? "scrollLeft" : "scrollTop";
                return null != n && (t[r] = n), t[r];
            }
            function It(t) {
                return t ? Q(t) ? Object.keys(t).reduce(function(e, n) {
                    return e[n] = It(t[n]), e;
                }, {}) : Array.isArray(t) ? t.map(It) : t : t;
            }
            function _t(t, e) {
                var n = void 0, r = void 0;
                return (void 0 === t ? "undefined" : L(t)) !== (void 0 === e ? "undefined" : L(e)) || (n = Q(t) ? "obj" : Array.isArray(t) ? "array" : "") != (Q(e) ? "obj" : Array.isArray(e) ? "array" : "") || ("obj" === n ? _t(r = Object.keys(t).sort(), Object.keys(e).sort()) || r.some(function(n) {
                    return _t(t[n], e[n]);
                }) : "array" === n ? t.length !== e.length || t.some(function(t, n) {
                    return _t(t, e[n]);
                }) : t !== e);
            }
            function Dt(t) {
                return !(!t || t.nodeType !== Node.ELEMENT_NODE || "function" != typeof t.getBoundingClientRect || t.compareDocumentPosition(document) & Node.DOCUMENT_POSITION_DISCONNECTED);
            }
            function Xt(t) {
                if (!Q(t)) return null;
                var e = void 0;
                if (!tt(e = t.left) && !tt(e = t.x)) return null;
                if (t.left = t.x = e, !tt(e = t.top) && !tt(e = t.y)) return null;
                if (t.top = t.y = e, tt(t.width) && t.width >= 0) t.right = t.left + t.width; else {
                    if (!(tt(t.right) && t.right >= t.left)) return null;
                    t.width = t.right - t.left;
                }
                if (tt(t.height) && t.height >= 0) t.bottom = t.top + t.height; else {
                    if (!(tt(t.bottom) && t.bottom >= t.top)) return null;
                    t.height = t.bottom - t.top;
                }
                return t;
            }
            function Yt(t) {
                return tt(t) ? {
                    value: t,
                    isRatio: !1
                } : "string" == typeof t ? function(t) {
                    var e = /^(.+?)(%)?$/.exec(t), n = void 0, r = void 0;
                    return e && tt(n = parseFloat(e[1])) ? {
                        value: (r = !(!e[2] || !n)) ? n / 100 : n,
                        isRatio: r
                    } : null;
                }(t.replace(/\s/g, "")) : null;
            }
            function Lt(t) {
                return t.isRatio ? 100 * t.value + "%" : t.value;
            }
            function At(t, e, n) {
                return "number" == typeof t ? t : e + t.value * (t.isRatio ? n : 1);
            }
            function Ft(t) {
                if (!Q(t)) return null;
                var e = void 0;
                if (!(e = Yt(t.left)) && !(e = Yt(t.x))) return null;
                if (t.left = t.x = e, !(e = Yt(t.top)) && !(e = Yt(t.y))) return null;
                if (t.top = t.y = e, (e = Yt(t.width)) && e.value >= 0) t.width = e, delete t.right; else {
                    if (!(e = Yt(t.right))) return null;
                    t.right = e, delete t.width;
                }
                if ((e = Yt(t.height)) && e.value >= 0) t.height = e, delete t.bottom; else {
                    if (!(e = Yt(t.bottom))) return null;
                    t.bottom = e, delete t.height;
                }
                return t;
            }
            function Wt(t) {
                return Object.keys(t).reduce(function(e, n) {
                    return e[n] = Lt(t[n]), e;
                }, {});
            }
            function jt(t, e) {
                var n = {
                    left: "x",
                    right: "x",
                    x: "x",
                    width: "x",
                    top: "y",
                    bottom: "y",
                    y: "y",
                    height: "y"
                }, r = {
                    x: e.left,
                    y: e.top
                }, o = {
                    x: e.width,
                    y: e.height
                };
                return Xt(Object.keys(t).reduce(function(e, i) {
                    return e[i] = At(t[i], "width" === i || "height" === i ? 0 : r[n[i]], o[n[i]]), 
                    e;
                }, {}));
            }
            function Rt(t, e) {
                var n = t.getBoundingClientRect(), r = {
                    left: n.left,
                    top: n.top,
                    width: n.width,
                    height: n.height
                };
                if (r.left += window.pageXOffset, r.top += window.pageYOffset, e) {
                    var o = window.getComputedStyle(t, ""), i = parseFloat(o.borderTopWidth) || 0, a = parseFloat(o.borderRightWidth) || 0, l = parseFloat(o.borderBottomWidth) || 0, u = parseFloat(o.borderLeftWidth) || 0;
                    r.left += u, r.top += i, r.width -= u + a, r.height -= i + l;
                }
                return Xt(r);
            }
            function Mt(t, e) {
                null == ut && (!1 !== ht && (ut = P.getValue("cursor", ht)), null == ut && (ut = !1)), 
                t.style.cursor = !1 === ut ? e : ut;
            }
            function zt(t) {
                null == st && (!1 !== mt && (st = P.getValue("cursor", mt)), null == st && (st = !1)), 
                !1 !== st && (t.style.cursor = st);
            }
            function Nt(t, e, n) {
                var r = t.svgPoint;
                return r.x = e, r.y = n, r.matrixTransform(t.svgCtmElement.getScreenCTM().inverse());
            }
            function Vt(t, e) {
                var n = t.elementBBox;
                if (e.left !== n.left || e.top !== n.top) {
                    var r = t.htmlOffset;
                    return t.elementStyle[ft] = "translate(" + (e.left + r.left) + "px, " + (e.top + r.top) + "px)", 
                    !0;
                }
                return !1;
            }
            function Gt(t, e) {
                var n = t.elementBBox, r = t.elementStyle, o = t.htmlOffset, i = !1;
                return e.left !== n.left && (r.left = e.left + o.left + "px", i = !0), e.top !== n.top && (r.top = e.top + o.top + "px", 
                i = !0), i;
            }
            function qt(t, e) {
                var n = t.elementBBox;
                if (e.left !== n.left || e.top !== n.top) {
                    var r = t.svgOffset, o = t.svgOriginBBox, i = Nt(t, e.left - window.pageXOffset, e.top - window.pageYOffset);
                    return t.svgTransform.setTranslate(i.x + r.x - o.x, i.y + r.y - o.y), !0;
                }
                return !1;
            }
            function Ut(t, e, n) {
                var r = t.elementBBox;
                function o() {
                    t.minLeft >= t.maxLeft ? e.left = r.left : e.left < t.minLeft ? e.left = t.minLeft : e.left > t.maxLeft && (e.left = t.maxLeft), 
                    t.minTop >= t.maxTop ? e.top = r.top : e.top < t.minTop ? e.top = t.minTop : e.top > t.maxTop && (e.top = t.maxTop);
                }
                if (o(), n) {
                    if (!1 === n(e)) return !1;
                    o();
                }
                var i = t.moveElm(t, e);
                return i && (t.elementBBox = Xt({
                    left: e.left,
                    top: e.top,
                    width: r.width,
                    height: r.height
                })), i;
            }
            function Zt(t) {
                var e = t.element, n = t.elementStyle, r = Rt(e), o = [ "display", "marginTop", "marginBottom", "width", "height" ];
                o.unshift(ft);
                var i = n[ct];
                n[ct] = "none";
                var a = Rt(e);
                t.orgStyle ? o.forEach(function(e) {
                    null != t.lastStyle[e] && n[e] !== t.lastStyle[e] || (n[e] = t.orgStyle[e]);
                }) : (t.orgStyle = o.reduce(function(t, e) {
                    return t[e] = n[e] || "", t;
                }, {}), t.lastStyle = {});
                var l = Rt(e), u = window.getComputedStyle(e, "");
                "inline" === u.display && (n.display = "inline-block", [ "Top", "Bottom" ].forEach(function(t) {
                    var e = parseFloat(u["padding" + t]);
                    n["margin" + t] = e ? "-" + e + "px" : "0";
                })), n[ft] = "translate(0, 0)";
                var s = Rt(e), d = t.htmlOffset = {
                    left: s.left ? -s.left : 0,
                    top: s.top ? -s.top : 0
                };
                return n[ft] = "translate(" + (r.left + d.left) + "px, " + (r.top + d.top) + "px)", 
                [ "width", "height" ].forEach(function(r) {
                    s[r] !== l[r] && (n[r] = l[r] + "px", (s = Rt(e))[r] !== l[r] && (n[r] = l[r] - (s[r] - l[r]) + "px")), 
                    t.lastStyle[r] = n[r];
                }), e.offsetWidth, n[ct] = i, a.left === r.left && a.top === r.top || (n[ft] = "translate(" + (a.left + d.left) + "px, " + (a.top + d.top) + "px)"), 
                a;
            }
            function $t(t) {
                var e = t.element, n = t.elementStyle, r = Rt(e), o = [ "position", "marginTop", "marginRight", "marginBottom", "marginLeft", "width", "height" ], i = n[ct];
                n[ct] = "none";
                var a = Rt(e);
                t.orgStyle ? o.forEach(function(e) {
                    null != t.lastStyle[e] && n[e] !== t.lastStyle[e] || (n[e] = t.orgStyle[e]);
                }) : (t.orgStyle = o.reduce(function(t, e) {
                    return t[e] = n[e] || "", t;
                }, {}), t.lastStyle = {});
                var l = Rt(e);
                n.position = "absolute", n.left = n.top = n.margin = "0";
                var u = Rt(e), s = t.htmlOffset = {
                    left: u.left ? -u.left : 0,
                    top: u.top ? -u.top : 0
                };
                return n.left = r.left + s.left + "px", n.top = r.top + s.top + "px", [ "width", "height" ].forEach(function(r) {
                    u[r] !== l[r] && (n[r] = l[r] + "px", (u = Rt(e))[r] !== l[r] && (n[r] = l[r] - (u[r] - l[r]) + "px")), 
                    t.lastStyle[r] = n[r];
                }), e.offsetWidth, n[ct] = i, a.left === r.left && a.top === r.top || (n.left = a.left + s.left + "px", 
                n.top = a.top + s.top + "px"), a;
            }
            function Jt(t) {
                var e = t.element, n = t.svgTransform, r = e.getBoundingClientRect(), o = Rt(e);
                n.setTranslate(0, 0);
                var i = t.svgOriginBBox = e.getBBox(), a = e.getBoundingClientRect(), l = Nt(t, a.left, a.top), u = t.svgOffset = {
                    x: i.x - l.x,
                    y: i.y - l.y
                }, s = Nt(t, r.left, r.top);
                return n.setTranslate(s.x + u.x - i.x, s.y + u.y - i.y), o;
            }
            function Kt(t, e) {
                var n = Rt(document.documentElement), r = t.elementBBox = t.initElm(t), o = t.containmentBBox = t.containmentIsBBox ? jt(t.options.containment, n) || n : Rt(t.options.containment, !0);
                if (t.minLeft = o.left, t.maxLeft = o.right - r.width, t.minTop = o.top, t.maxTop = o.bottom - r.height, 
                Ut(t, {
                    left: r.left,
                    top: r.top
                }), t.parsedSnapTargets) {
                    var i = {
                        x: r.width,
                        y: r.height
                    }, a = {
                        x: t.minLeft,
                        y: t.minTop
                    }, l = {
                        x: t.maxLeft,
                        y: t.maxTop
                    }, u = {
                        left: "x",
                        right: "x",
                        x: "x",
                        width: "x",
                        xStart: "x",
                        xEnd: "x",
                        xStep: "x",
                        top: "y",
                        bottom: "y",
                        y: "y",
                        height: "y",
                        yStart: "y",
                        yEnd: "y",
                        yStep: "y"
                    }, s = t.parsedSnapTargets.reduce(function(t, e) {
                        var s = "containment" === e.base ? o : n, d = {
                            x: s.left,
                            y: s.top
                        }, c = {
                            x: s.width,
                            y: s.height
                        };
                        function f(n) {
                            if (null == n.center && (n.center = e.center), null == n.xGravity && (n.xGravity = e.gravity), 
                            null == n.yGravity && (n.yGravity = e.gravity), null != n.x && null != n.y) n.x = At(n.x, d.x, c.x), 
                            n.y = At(n.y, d.y, c.y), n.center && (n.x -= i.x / 2, n.y -= i.y / 2, n.corners = [ "tl" ]), 
                            (n.corners || e.corners).forEach(function(e) {
                                var r = n.x - ("tr" === e || "br" === e ? i.x : 0), o = n.y - ("bl" === e || "br" === e ? i.y : 0);
                                if (r >= a.x && r <= l.x && o >= a.y && o <= l.y) {
                                    var u = {
                                        x: r,
                                        y: o
                                    }, s = r - n.xGravity, d = r + n.xGravity, c = o - n.yGravity, f = o + n.yGravity;
                                    s > a.x && (u.gravityXStart = s), d < l.x && (u.gravityXEnd = d), c > a.y && (u.gravityYStart = c), 
                                    f < l.y && (u.gravityYEnd = f), t.push(u);
                                }
                            }); else {
                                var r = null != n.x ? "x" : "y", o = "x" === r ? "y" : "x", u = o + "Start", s = o + "End", f = r + "Gravity", p = r.toUpperCase(), v = o.toUpperCase(), h = "gravity" + p + "Start", m = "gravity" + p + "End", g = "gravity" + v + "Start", y = "gravity" + v + "End";
                                if (n[r] = At(n[r], d[r], c[r]), n[u] = At(n[u], d[o], c[o]), n[s] = At(n[s], d[o], c[o]) - i[o], 
                                n[u] > n[s] || n[u] > l[o] || n[s] < a[o]) return;
                                n.center && (n[r] -= i[r] / 2, n.sides = [ "start" ]), (n.sides || e.sides).forEach(function(e) {
                                    var d = n[r] - ("end" === e ? i[r] : 0);
                                    if (d >= a[r] && d <= l[r]) {
                                        var c = {}, p = d - n[f], v = d + n[f];
                                        c[r] = d, p > a[r] && (c[h] = p), v < l[r] && (c[m] = v), n[u] > a[o] && (c[g] = n[u]), 
                                        n[s] < l[o] && (c[y] = n[s]), t.push(c);
                                    }
                                });
                            }
                        }
                        var p = void 0;
                        if ((p = e.element ? Rt(e.element) : null) || e.ppBBox) e.ppBBox && (p = jt(e.ppBBox, s)), 
                        p && e.edges.forEach(function(t) {
                            var n = e.gravity, o = e.gravity;
                            "outside" === t && (n += r.width, o += r.height);
                            var i = p.left - n, a = p.right + n, l = p.top - o, u = p.bottom + o, s = "inside" === t ? "start" : "end";
                            f({
                                xStart: i,
                                xEnd: a,
                                y: p.top,
                                sides: [ s ],
                                center: !1
                            }), f({
                                x: p.left,
                                yStart: l,
                                yEnd: u,
                                sides: [ s ],
                                center: !1
                            }), s = "inside" === t ? "end" : "start", f({
                                xStart: i,
                                xEnd: a,
                                y: p.bottom,
                                sides: [ s ],
                                center: !1
                            }), f({
                                x: p.right,
                                yStart: l,
                                yEnd: u,
                                sides: [ s ],
                                center: !1
                            });
                        }); else {
                            var v = [ [ "x", "y", "xStart", "xEnd", "xStep", "yStart", "yEnd", "yStep" ].reduce(function(t, n) {
                                return e[n] && (t[n] = At(e[n], "xStep" === n || "yStep" === n ? 0 : d[u[n]], c[u[n]])), 
                                t;
                            }, {}) ];
                            [ "x", "y" ].forEach(function(t) {
                                var n = t + "Start", r = t + "End", o = t + "Step", i = t + "Gravity";
                                v = v.reduce(function(a, l) {
                                    var u = l[n], s = l[r], d = l[o];
                                    if (null != u && null != s && u >= s) return a;
                                    if (null != d) {
                                        if (d < 2) return a;
                                        var c = d / 2;
                                        c = e.gravity > c ? c : null;
                                        for (var f = u; f <= s; f += d) {
                                            var p = Object.keys(l).reduce(function(t, e) {
                                                return e !== n && e !== r && e !== o && (t[e] = l[e]), t;
                                            }, {});
                                            p[t] = f, p[i] = c, a.push(p);
                                        }
                                    } else a.push(l);
                                    return a;
                                }, []);
                            }), v.forEach(function(t) {
                                f(t);
                            });
                        }
                        return t;
                    }, []);
                    t.snapTargets = s.length ? s : null;
                }
                var d = {}, c = t.options.autoScroll;
                if (c) {
                    d.isWindow = c.target === window, d.target = c.target;
                    var f = "scroll" === e, p = function(t, e, n) {
                        var r = {}, o = void 0, i = void 0, a = void 0;
                        !function(t) {
                            r.clientWidth = t.clientWidth, r.clientHeight = t.clientHeight;
                        }(e ? document.documentElement : t);
                        var l = 0, u = 0;
                        if (!n) {
                            var s = void 0, d = void 0;
                            e ? (s = kt(t, "x"), d = kt(t, "y"), o = getComputedStyle(document.documentElement, ""), 
                            i = getComputedStyle(document.body, ""), l = kt(t, "x", document.documentElement.scrollWidth + r.clientWidth + [ "marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight" ].reduce(function(t, e) {
                                return t + (parseFloat(o[e]) || 0) + (parseFloat(i[e]) || 0);
                            }, 0)), u = kt(t, "y", document.documentElement.scrollHeight + r.clientHeight + [ "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom" ].reduce(function(t, e) {
                                return t + (parseFloat(o[e]) || 0) + (parseFloat(i[e]) || 0);
                            }, 0)), kt(t, "x", s), kt(t, "y", d)) : (s = Pt(t, "x"), d = Pt(t, "y"), a = getComputedStyle(t, ""), 
                            l = Pt(t, "x", t.scrollWidth + r.clientWidth + [ "marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight" ].reduce(function(t, e) {
                                return t + (parseFloat(a[e]) || 0);
                            }, 0)), u = Pt(t, "y", t.scrollHeight + r.clientHeight + [ "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom" ].reduce(function(t, e) {
                                return t + (parseFloat(a[e]) || 0);
                            }, 0)), Pt(t, "x", s), Pt(t, "y", d));
                        }
                        r.scrollWidth = r.clientWidth + l, r.scrollHeight = r.clientHeight + u;
                        var c = void 0;
                        return e ? r.clientX = r.clientY = 0 : (c = t.getBoundingClientRect(), a || (a = getComputedStyle(t, "")), 
                        r.clientX = c.left + (parseFloat(a.borderLeftWidth) || 0), r.clientY = c.top + (parseFloat(a.borderTopWidth) || 0)), 
                        r;
                    }(c.target, d.isWindow, f), v = Xt({
                        left: p.clientX,
                        top: p.clientY,
                        width: p.clientWidth,
                        height: p.clientHeight
                    });
                    f ? t.autoScroll && (d.scrollWidth = t.autoScroll.scrollWidth, d.scrollHeight = t.autoScroll.scrollHeight) : (d.scrollWidth = p.scrollWidth, 
                    d.scrollHeight = p.scrollHeight), [ [ "X", "Width", "left", "right" ], [ "Y", "Height", "top", "bottom" ] ].forEach(function(t) {
                        var e = t[0], n = t[1], o = t[2], i = t[3], a = (d["scroll" + n] || 0) - p["client" + n], l = c["min" + e] || 0, u = tt(c["max" + e]) ? c["max" + e] : a;
                        if (l < u && l < a) {
                            u > a && (u = a);
                            for (var s = [], f = r[n.toLowerCase()], h = c.sensitivity.length - 1; h >= 0; h--) {
                                var m = c.sensitivity[h], g = c.speed[h];
                                s.push({
                                    dir: -1,
                                    speed: g,
                                    position: v[o] + m
                                }), s.push({
                                    dir: 1,
                                    speed: g,
                                    position: v[i] - m - f
                                });
                            }
                            d[e.toLowerCase()] = {
                                min: l,
                                max: u,
                                lines: s
                            };
                        }
                    });
                }
                t.autoScroll = d.x || d.y ? d : null;
            }
            function Qt(t) {
                wt.stop(), Mt(t.options.handle, t.orgCursor), lt.style.cursor = dt, !1 !== t.options.zIndex && (t.elementStyle.zIndex = t.orgZIndex), 
                pt && (lt.style[pt] = vt);
                var e = X(t.element);
                xt && e.remove(xt), yt && e.remove(yt), it = null, rt.cancel(), t.onDragEnd && t.onDragEnd({
                    left: t.elementBBox.left,
                    top: t.elementBBox.top
                });
            }
            function te(t, e) {
                var n = t.options, r = void 0;
                if (e.containment) {
                    var o = void 0;
                    Dt(e.containment) ? e.containment !== n.containment && (n.containment = e.containment, 
                    t.containmentIsBBox = !1, r = !0) : (o = Ft(It(e.containment))) && _t(o, n.containment) && (n.containment = o, 
                    t.containmentIsBBox = !0, r = !0);
                }
                function i(t, e) {
                    function n(t) {
                        return "string" == typeof t ? t.replace(/[, ]+/g, " ").trim().toLowerCase() : null;
                    }
                    tt(e.gravity) && e.gravity > 0 && (t.gravity = e.gravity);
                    var r = n(e.corner);
                    if (r) {
                        if ("all" !== r) {
                            var o = {}, i = r.split(/\s/).reduce(function(t, e) {
                                return (e = "tl" === (e = e.trim().replace(/^(.).*?-(.).*$/, "$1$2")) || "lt" === e ? "tl" : "tr" === e || "rt" === e ? "tr" : "bl" === e || "lb" === e ? "bl" : "br" === e || "rb" === e ? "br" : null) && !o[e] && (t.push(e), 
                                o[e] = !0), t;
                            }, []), a = i.length;
                            r = a ? 4 === a ? "all" : i.join(" ") : null;
                        }
                        r && (t.corner = r);
                    }
                    var l = n(e.side);
                    l && ("start" === l || "end" === l || "both" === l ? t.side = l : "start end" !== l && "end start" !== l || (t.side = "both")), 
                    "boolean" == typeof e.center && (t.center = e.center);
                    var u = n(e.edge);
                    u && ("inside" === u || "outside" === u || "both" === u ? t.edge = u : "inside outside" !== u && "outside inside" !== u || (t.edge = "both"));
                    var s = "string" == typeof e.base ? e.base.trim().toLowerCase() : null;
                    return !s || "containment" !== s && "document" !== s || (t.base = s), t;
                }
                if (null != e.snap) {
                    var a = Q(e.snap) && null != e.snap.targets ? e.snap : {
                        targets: e.snap
                    }, l = [], u = i({
                        targets: l
                    }, a);
                    u.gravity || (u.gravity = F), u.corner || (u.corner = W), u.side || (u.side = j), 
                    "boolean" != typeof u.center && (u.center = !1), u.edge || (u.edge = R), u.base || (u.base = M);
                    var s = (Array.isArray(a.targets) ? a.targets : [ a.targets ]).reduce(function(t, e) {
                        if (null == e) return t;
                        var n = Dt(e), r = Ft(It(e)), o = n || r ? {
                            boundingBox: e
                        } : Q(e) && null == e.start && null == e.end && null == e.step ? e : {
                            x: e,
                            y: e
                        }, a = [], s = {}, d = o.boundingBox, c = void 0;
                        if (n || Dt(d)) a.push({
                            element: d
                        }), s.boundingBox = d; else if (c = r || Ft(It(d))) a.push({
                            ppBBox: c
                        }), s.boundingBox = Wt(c); else {
                            var f = void 0, p = [ "x", "y" ].reduce(function(t, e) {
                                var n, r = o[e];
                                if (n = Yt(r)) t[e] = n, s[e] = Lt(n); else {
                                    var i = void 0, a = void 0, l = void 0;
                                    Q(r) && (i = Yt(r.start), a = Yt(r.end), l = Yt(r.step), i && a && i.isRatio === a.isRatio && i.value >= a.value && (f = !0)), 
                                    i = t[e + "Start"] = i || {
                                        value: 0,
                                        isRatio: !1
                                    }, a = t[e + "End"] = a || {
                                        value: 1,
                                        isRatio: !0
                                    }, s[e] = {
                                        start: Lt(i),
                                        end: Lt(a)
                                    }, l && ((l.isRatio ? l.value > 0 : l.value >= 2) ? (t[e + "Step"] = l, s[e].step = Lt(l)) : f = !0);
                                }
                                return t;
                            }, {});
                            if (f) return t;
                            p.xStart && !p.xStep && p.yStart && !p.yStep ? a.push({
                                xStart: p.xStart,
                                xEnd: p.xEnd,
                                y: p.yStart
                            }, {
                                xStart: p.xStart,
                                xEnd: p.xEnd,
                                y: p.yEnd
                            }, {
                                x: p.xStart,
                                yStart: p.yStart,
                                yEnd: p.yEnd
                            }, {
                                x: p.xEnd,
                                yStart: p.yStart,
                                yEnd: p.yEnd
                            }) : a.push(p);
                        }
                        if (a.length) {
                            l.push(i(s, o));
                            var v = s.corner || u.corner, h = s.side || u.side, m = s.edge || u.edge, g = {
                                gravity: s.gravity || u.gravity,
                                base: s.base || u.base,
                                center: "boolean" == typeof s.center ? s.center : u.center,
                                corners: "all" === v ? z : v.split(" "),
                                sides: "both" === h ? N : [ h ],
                                edges: "both" === m ? V : [ m ]
                            };
                            a.forEach(function(e) {
                                [ "gravity", "corners", "sides", "center", "edges", "base" ].forEach(function(t) {
                                    e[t] = g[t];
                                }), t.push(e);
                            });
                        }
                        return t;
                    }, []);
                    s.length && (n.snap = u, _t(s, t.parsedSnapTargets) && (t.parsedSnapTargets = s, 
                    r = !0));
                } else e.hasOwnProperty("snap") && t.parsedSnapTargets && (n.snap = t.parsedSnapTargets = t.snapTargets = void 0);
                if (e.autoScroll) {
                    var d = Q(e.autoScroll) ? e.autoScroll : {
                        target: !0 === e.autoScroll ? window : e.autoScroll
                    }, c = {};
                    c.target = Dt(d.target) ? d.target : window, c.speed = [], (Array.isArray(d.speed) ? d.speed : [ d.speed ]).every(function(t, e) {
                        return !!(e <= 2 && tt(t)) && (c.speed[e] = t, !0);
                    }), c.speed.length || (c.speed = G);
                    var f = Array.isArray(d.sensitivity) ? d.sensitivity : [ d.sensitivity ];
                    c.sensitivity = c.speed.map(function(t, e) {
                        return tt(f[e]) ? f[e] : q[e];
                    }), [ "X", "Y" ].forEach(function(t) {
                        var e = "min" + t, n = "max" + t;
                        tt(d[e]) && d[e] >= 0 && (c[e] = d[e]), tt(d[n]) && d[n] >= 0 && (!c[e] || d[n] >= c[e]) && (c[n] = d[n]);
                    }), _t(c, n.autoScroll) && (n.autoScroll = c, r = !0);
                } else e.hasOwnProperty("autoScroll") && (n.autoScroll && (r = !0), n.autoScroll = void 0);
                if (r && Kt(t), Dt(e.handle) && e.handle !== n.handle) {
                    n.handle && (n.handle.style.cursor = t.orgCursor, pt && (n.handle.style[pt] = t.orgUserSelect), 
                    rt.removeStartHandler(n.handle, t.pointerEventHandlerId));
                    var p = n.handle = e.handle;
                    t.orgCursor = p.style.cursor, Mt(p, t.orgCursor), pt && (t.orgUserSelect = p.style[pt], 
                    p.style[pt] = "none"), rt.addStartHandler(p, t.pointerEventHandlerId);
                }
                (tt(e.zIndex) || !1 === e.zIndex) && (n.zIndex = e.zIndex, t === it && (t.elementStyle.zIndex = !1 === n.zIndex ? t.orgZIndex : n.zIndex));
                var v = {
                    left: t.elementBBox.left,
                    top: t.elementBBox.top
                }, h = void 0;
                tt(e.left) && e.left !== v.left && (v.left = e.left, h = !0), tt(e.top) && e.top !== v.top && (v.top = e.top, 
                h = !0), h && Ut(t, v), [ "onDrag", "onMove", "onDragStart", "onMoveStart", "onDragEnd" ].forEach(function(r) {
                    "function" == typeof e[r] ? (n[r] = e[r], t[r] = n[r].bind(t.ins)) : e.hasOwnProperty(r) && null == e[r] && (n[r] = t[r] = void 0);
                });
            }
            wt.move = function(t, e, n) {
                St.call(window, Ht), Et(), Ct === t && (e.x && Bt.x && (e.x.lastValue = Bt.x.lastValue), 
                e.y && Bt.y && (e.y.lastValue = Bt.y.lastValue)), Ct = t, Bt = e, Ot = n;
                var r = Date.now();
                [ "x", "y" ].forEach(function(t) {
                    var e = Bt[t];
                    e && (e.lastFrameTime = r);
                }), Ht = bt.call(window, Tt);
            }, wt.stop = function() {
                St.call(window, Ht), Et(), Bt = {}, Ct = null;
            };
            var ee = function() {
                function t(e, n) {
                    !function(t, e) {
                        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                    }(this, t);
                    var r = {
                        ins: this,
                        options: {
                            zIndex: A
                        },
                        disabled: !1
                    };
                    if (Object.defineProperty(this, "_id", {
                        value: ++ot
                    }), r._id = this._id, et[this._id] = r, !Dt(e) || e === lt) throw new Error("This element is not accepted.");
                    if (n) {
                        if (!Q(n)) throw new Error("Invalid options.");
                    } else n = {};
                    var o = !0, i = void 0;
                    if (e instanceof SVGElement && (i = e.ownerSVGElement)) {
                        if (!e.getBBox) throw new Error("This element is not accepted. (SVGLocatable)");
                        if (!e.transform) throw new Error("This element is not accepted. (SVGAnimatedTransformList)");
                        r.svgTransform = e.transform.baseVal.appendItem(i.createSVGTransform()), r.svgPoint = i.createSVGPoint();
                        var a = e.nearestViewportElement;
                        r.svgCtmElement = $ ? a.appendChild(document.createElementNS(i.namespaceURI, "rect")) : a, 
                        o = !1, r.initElm = Jt, r.moveElm = qt;
                    } else {
                        var l = P.getName("willChange");
                        l && (o = !1), !n.leftTop && ft ? (l && (e.style[l] = "transform"), r.initElm = Zt, 
                        r.moveElm = Vt) : (l && (e.style[l] = "left, top"), r.initElm = $t, r.moveElm = Gt);
                    }
                    if (r.element = function(t, e) {
                        var n = t.style;
                        n.webkitTapHighlightColor = "transparent";
                        var r = P.getName("boxShadow"), o = window.getComputedStyle(t, "")[r];
                        return o && "none" !== o || (n[r] = "0 0 1px transparent"), e && ft && (n[ft] = "translateZ(0)"), 
                        t;
                    }(e, o), r.elementStyle = e.style, r.orgZIndex = r.elementStyle.zIndex, gt && X(e).add(gt), 
                    r.pointerEventHandlerId = rt.regStartHandler(function(t) {
                        return function(t, e) {
                            return !(t.disabled || t.onDragStart && !1 === t.onDragStart(e) || (it && Qt(it), 
                            zt(t.options.handle), lt.style.cursor = st || window.getComputedStyle(t.options.handle, "").cursor, 
                            !1 !== t.options.zIndex && (t.elementStyle.zIndex = t.options.zIndex), pt && (lt.style[pt] = "none"), 
                            yt && X(t.element).add(yt), it = t, at = !1, nt.left = t.elementBBox.left - (e.clientX + window.pageXOffset), 
                            nt.top = t.elementBBox.top - (e.clientY + window.pageYOffset), 0));
                        }(r, t);
                    }), !n.containment) {
                        var u;
                        n.containment = (u = e.parentNode) && Dt(u) ? u : lt;
                    }
                    n.handle || (n.handle = e), te(r, n);
                }
                return Y(t, [ {
                    key: "remove",
                    value: function() {
                        var t = et[this._id];
                        this.disabled = !0, rt.unregStartHandler(rt.removeStartHandler(t.options.handle, t.pointerEventHandlerId)), 
                        delete et[this._id];
                    }
                }, {
                    key: "setOptions",
                    value: function(t) {
                        return Q(t) && te(et[this._id], t), this;
                    }
                }, {
                    key: "position",
                    value: function() {
                        return Kt(et[this._id]), this;
                    }
                }, {
                    key: "disabled",
                    get: function() {
                        return et[this._id].disabled;
                    },
                    set: function(t) {
                        var e = et[this._id];
                        (t = !!t) !== e.disabled && (e.disabled = t, e.disabled ? (e === it && Qt(e), e.options.handle.style.cursor = e.orgCursor, 
                        pt && (e.options.handle.style[pt] = e.orgUserSelect), gt && X(e.element).remove(gt)) : (Mt(e.options.handle, e.orgCursor), 
                        pt && (e.options.handle.style[pt] = "none"), gt && X(e.element).add(gt)));
                    }
                }, {
                    key: "element",
                    get: function() {
                        return et[this._id].element;
                    }
                }, {
                    key: "rect",
                    get: function() {
                        return It(et[this._id].elementBBox);
                    }
                }, {
                    key: "left",
                    get: function() {
                        return et[this._id].elementBBox.left;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            left: t
                        });
                    }
                }, {
                    key: "top",
                    get: function() {
                        return et[this._id].elementBBox.top;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            top: t
                        });
                    }
                }, {
                    key: "containment",
                    get: function() {
                        var t = et[this._id];
                        return t.containmentIsBBox ? Wt(t.options.containment) : t.options.containment;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            containment: t
                        });
                    }
                }, {
                    key: "snap",
                    get: function() {
                        return It(et[this._id].options.snap);
                    },
                    set: function(t) {
                        te(et[this._id], {
                            snap: t
                        });
                    }
                }, {
                    key: "autoScroll",
                    get: function() {
                        return It(et[this._id].options.autoScroll);
                    },
                    set: function(t) {
                        te(et[this._id], {
                            autoScroll: t
                        });
                    }
                }, {
                    key: "handle",
                    get: function() {
                        return et[this._id].options.handle;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            handle: t
                        });
                    }
                }, {
                    key: "zIndex",
                    get: function() {
                        return et[this._id].options.zIndex;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            zIndex: t
                        });
                    }
                }, {
                    key: "onDrag",
                    get: function() {
                        return et[this._id].options.onDrag;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            onDrag: t
                        });
                    }
                }, {
                    key: "onMove",
                    get: function() {
                        return et[this._id].options.onMove;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            onMove: t
                        });
                    }
                }, {
                    key: "onDragStart",
                    get: function() {
                        return et[this._id].options.onDragStart;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            onDragStart: t
                        });
                    }
                }, {
                    key: "onMoveStart",
                    get: function() {
                        return et[this._id].options.onMoveStart;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            onMoveStart: t
                        });
                    }
                }, {
                    key: "onDragEnd",
                    get: function() {
                        return et[this._id].options.onDragEnd;
                    },
                    set: function(t) {
                        te(et[this._id], {
                            onDragEnd: t
                        });
                    }
                } ], [ {
                    key: "draggableCursor",
                    get: function() {
                        return ht;
                    },
                    set: function(t) {
                        ht !== t && (ht = t, ut = null, Object.keys(et).forEach(function(t) {
                            var e = et[t];
                            e.disabled || e === it && !1 !== st || (Mt(e.options.handle, e.orgCursor), e === it && (lt.style.cursor = dt, 
                            lt.style.cursor = window.getComputedStyle(e.options.handle, "").cursor));
                        }));
                    }
                }, {
                    key: "draggingCursor",
                    get: function() {
                        return mt;
                    },
                    set: function(t) {
                        mt !== t && (mt = t, st = null, it && (zt(it.options.handle), !1 === st && (Mt(it.options.handle, it.orgCursor), 
                        lt.style.cursor = dt), lt.style.cursor = st || window.getComputedStyle(it.options.handle, "").cursor));
                    }
                }, {
                    key: "draggableClass",
                    get: function() {
                        return gt;
                    },
                    set: function(t) {
                        (t = t ? t + "" : void 0) !== gt && (Object.keys(et).forEach(function(e) {
                            var n = et[e];
                            if (!n.disabled) {
                                var r = X(n.element);
                                gt && r.remove(gt), t && r.add(t);
                            }
                        }), gt = t);
                    }
                }, {
                    key: "draggingClass",
                    get: function() {
                        return yt;
                    },
                    set: function(t) {
                        if ((t = t ? t + "" : void 0) !== yt) {
                            if (it) {
                                var e = X(it.element);
                                yt && e.remove(yt), t && e.add(t);
                            }
                            yt = t;
                        }
                    }
                }, {
                    key: "movingClass",
                    get: function() {
                        return xt;
                    },
                    set: function(t) {
                        if ((t = t ? t + "" : void 0) !== xt) {
                            if (it && at) {
                                var e = X(it.element);
                                xt && e.remove(xt), t && e.add(t);
                            }
                            xt = t;
                        }
                    }
                } ]), t;
            }();
            rt.addMoveHandler(document, function(t) {
                if (it) {
                    var e = {
                        left: t.clientX + window.pageXOffset + nt.left,
                        top: t.clientY + window.pageYOffset + nt.top
                    };
                    if (Ut(it, e, it.snapTargets ? function(t) {
                        var e = it.snapTargets.length, n = !1, r = !1, o = void 0;
                        for (o = 0; o < e && (!n || !r); o++) {
                            var i = it.snapTargets[o];
                            (null == i.gravityXStart || t.left >= i.gravityXStart) && (null == i.gravityXEnd || t.left <= i.gravityXEnd) && (null == i.gravityYStart || t.top >= i.gravityYStart) && (null == i.gravityYEnd || t.top <= i.gravityYEnd) && (n || null == i.x || (t.left = i.x, 
                            n = !0, o = -1), r || null == i.y || (t.top = i.y, r = !0, o = -1));
                        }
                        return t.snapped = n || r, !it.onDrag || it.onDrag(t);
                    } : it.onDrag)) {
                        var n = {}, r = it.autoScroll;
                        if (r) {
                            var o = {
                                x: it.elementBBox.left - window.pageXOffset,
                                y: it.elementBBox.top - window.pageYOffset
                            };
                            [ "x", "y" ].forEach(function(t) {
                                if (r[t]) {
                                    var e = r[t].min, i = r[t].max;
                                    r[t].lines.some(function(r) {
                                        return (-1 === r.dir ? o[t] <= r.position : o[t] >= r.position) && (n[t] = {
                                            dir: r.dir,
                                            speed: r.speed / 1e3,
                                            min: e,
                                            max: i
                                        }, !0);
                                    });
                                }
                            });
                        }
                        n.x || n.y ? (wt.move(r.target, n, r.isWindow ? kt : Pt), e.autoScroll = !0) : wt.stop(), 
                        at || (at = !0, xt && X(it.element).add(xt), it.onMoveStart && it.onMoveStart(e)), 
                        it.onMove && it.onMove(e);
                    }
                }
            });
            var ne = function() {
                it && Qt(it);
            };
            rt.addEndHandler(document, ne), rt.addCancelHandler(document, ne);
            var re = function() {
                ct = P.getName("transitionProperty"), ft = P.getName("transform"), dt = lt.style.cursor, 
                (pt = P.getName("userSelect")) && (vt = lt.style[pt]);
                var t = {}, e = void 0;
                function n(t, e) {
                    t.initElm && Kt(t, e);
                }
                var r = !1, o = c.add(function(o) {
                    r || (r = !0, it && (n(it, o.type), rt.move(), t[it._id] = !0), clearTimeout(e), 
                    e = setTimeout(function() {
                        !function(r) {
                            clearTimeout(e), Object.keys(et).forEach(function(e) {
                                t[e] || n(et[e], r);
                            }), t = {};
                        }(o.type);
                    }, 200), r = !1);
                });
                window.addEventListener("resize", o, !0), window.addEventListener("scroll", o, !0);
            };
            (lt = document.body) ? re() : document.addEventListener("DOMContentLoaded", function() {
                lt = document.body, re();
            }, !0);
            e.default = ee;
        } ]).default;
        exports.PlainDraggable = PlainDraggable;
    }
};

//src/connect/poly.js
/**
 * @fileOverview
 *
 * 提供折线相连的方法
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[7] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        connect.register("poly", function(node, parent, connection, width) {
            // 连线起点和终点
            var po = parent.getLayoutVertexOut(), pi = node.getLayoutVertexIn();
            // 连线矢量和方向
            var v = parent.getLayoutVectorOut().normalize();
            var r = Math.round;
            var abs = Math.abs;
            var pathData = [];
            pathData.push("M", r(po.x), r(po.y));
            switch (true) {
              case abs(v.x) > abs(v.y) && v.x < 0:
                // left
                pathData.push("h", -parent.getStyle("margin-left"));
                pathData.push("v", pi.y - po.y);
                pathData.push("H", pi.x);
                break;

              case abs(v.x) > abs(v.y) && v.x >= 0:
                // right
                pathData.push("h", parent.getStyle("margin-right"));
                pathData.push("v", pi.y - po.y);
                pathData.push("H", pi.x);
                break;

              case abs(v.x) <= abs(v.y) && v.y < 0:
                // top
                pathData.push("v", -parent.getStyle("margin-top"));
                pathData.push("h", pi.x - po.x);
                pathData.push("V", pi.y);
                break;

              case abs(v.x) <= abs(v.y) && v.y >= 0:
                // bottom
                pathData.push("v", parent.getStyle("margin-bottom"));
                pathData.push("h", pi.x - po.x);
                pathData.push("V", pi.y);
                break;
            }
            connection.setMarker(null);
            connection.setPathData(pathData);
        });
    }
};

//src/connect/under.js
/**
 * @fileOverview
 *
 * 下划线连线
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[8] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var connect = _p.r(13);
        connect.register("under", function(node, parent, connection, width, color) {
            var box = node.getLayoutBox(), pBox = parent.getLayoutBox();
            var start, end, vector;
            var abs = Math.abs;
            var pathData = [];
            var side = box.x > pBox.x ? "right" : "left";
            var radius = node.getStyle("connect-radius");
            var underY = box.bottom + 3;
            var startY = parent.getType() == "sub" ? pBox.bottom + 3 : pBox.cy;
            var p1, p2, p3, mx;
            if (side == "right") {
                p1 = new kity.Point(pBox.right, startY);
                p2 = new kity.Point(box.left - 10, underY);
                p3 = new kity.Point(box.right, underY);
            } else {
                p1 = new kity.Point(pBox.left, startY);
                p2 = new kity.Point(box.right + 10, underY);
                p3 = new kity.Point(box.left, underY);
            }
            mx = (p1.x + p2.x) / 2;
            pathData.push("M", p1);
            pathData.push("C", mx, p1.y, mx, p2.y, p2);
            pathData.push("L", p3);
            connection.setMarker(null);
            connection.setPathData(pathData);
        });
    }
};

//src/core/_boxv.js
/**
 * @fileOverview
 *
 * 调试工具：为 kity.Box 提供一个可视化的渲染
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[9] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Minder = _p.r(21);
        if (location.href.indexOf("boxv") != -1) {
            var vrect;
            Object.defineProperty(kity.Box.prototype, "visualization", {
                get: function() {
                    if (!vrect) return null;
                    return vrect.setBox(this);
                }
            });
            Minder.registerInitHook(function() {
                this.on("paperrender", function() {
                    vrect = new kity.Rect();
                    vrect.fill("rgba(200, 200, 200, .5)");
                    vrect.stroke("orange");
                    this.getRenderContainer().addShape(vrect);
                });
            });
        }
    }
};

//src/core/animate.js
/**
 * @fileOverview
 *
 * 动画控制
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[10] = {
    value: function(require, exports, module) {
        var Minder = _p.r(21);
        var animateDefaultOptions = {
            enableAnimation: true,
            layoutAnimationDuration: 300,
            viewAnimationDuration: 100,
            zoomAnimationDuration: 300
        };
        var resoredAnimationOptions = {};
        Minder.registerInitHook(function() {
            this.setDefaultOptions(animateDefaultOptions);
            if (!this.getOption("enableAnimation")) {
                this.disableAnimation();
            }
        });
        Minder.prototype.enableAnimation = function() {
            for (var name in animateDefaultOptions) {
                if (animateDefaultOptions.hasOwnProperty(name)) {
                    this.setOption(resoredAnimationOptions[name]);
                }
            }
        };
        Minder.prototype.disableAnimation = function() {
            for (var name in animateDefaultOptions) {
                if (animateDefaultOptions.hasOwnProperty(name)) {
                    resoredAnimationOptions[name] = this.getOption(name);
                    this.setOption(name, 0);
                }
            }
        };
    }
};

//src/core/command.js
_p[11] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var MinderEvent = _p.r(15);
        var COMMAND_STATE_NORMAL = 0;
        var COMMAND_STATE_DISABLED = -1;
        var COMMAND_STATE_ACTIVED = 1;
        /**
     * 表示一个命令，包含命令的查询及执行
     */
        var Command = kity.createClass("Command", {
            constructor: function() {
                this._isContentChange = true;
                this._isSelectionChange = false;
            },
            execute: function(minder, args) {
                throw new Error("Not Implement: Command.execute()");
            },
            setContentChanged: function(val) {
                this._isContentChange = !!val;
            },
            isContentChanged: function() {
                return this._isContentChange;
            },
            setSelectionChanged: function(val) {
                this._isSelectionChange = !!val;
            },
            isSelectionChanged: function() {
                return this._isContentChange;
            },
            queryState: function(km) {
                return COMMAND_STATE_NORMAL;
            },
            queryValue: function(km) {
                return 0;
            },
            isNeedUndo: function() {
                return true;
            }
        });
        Command.STATE_NORMAL = COMMAND_STATE_NORMAL;
        Command.STATE_ACTIVE = COMMAND_STATE_ACTIVED;
        Command.STATE_DISABLED = COMMAND_STATE_DISABLED;
        kity.extendClass(Minder, {
            _getCommand: function(name) {
                return this._commands[name.toLowerCase()];
            },
            _queryCommand: function(name, type, args) {
                var cmd = this._getCommand(name);
                if (cmd) {
                    var queryCmd = cmd["query" + type];
                    if (queryCmd) return queryCmd.apply(cmd, [ this ].concat(args));
                }
                return 0;
            },
            /**
         * @method queryCommandState()
         * @for Minder
         * @description 查询指定命令的状态
         *
         * @grammar queryCommandName(name) => {number}
         *
         * @param {string} name 要查询的命令名称
         *
         * @return {number}
         *   -1: 命令不存在或命令当前不可用
         *    0: 命令可用
         *    1: 命令当前可用并且已经执行过
         */
            queryCommandState: function(name) {
                return this._queryCommand(name, "State", [].slice.call(arguments, 1));
            },
            /**
         * @method queryCommandValue()
         * @for Minder
         * @description 查询指定命令当前的执行值
         *
         * @grammar queryCommandValue(name) => {any}
         *
         * @param {string} name 要查询的命令名称
         *
         * @return {any}
         *    如果命令不存在，返回 undefined
         *    不同命令具有不同返回值，具体请查看 [Command](command) 章节
         */
            queryCommandValue: function(name) {
                return this._queryCommand(name, "Value", [].slice.call(arguments, 1));
            },
            /**
         * @method execCommand()
         * @for Minder
         * @description 执行指定的命令。
         *
         * @grammar execCommand(name, args...)
         *
         * @param {string} name 要执行的命令名称
         * @param {argument} args 要传递给命令的其它参数
         */
            execCommand: function(name) {
                if (!name) return null;
                name = name.toLowerCase();
                var cmdArgs = [].slice.call(arguments, 1), cmd, stoped, result, eventParams;
                var me = this;
                cmd = this._getCommand(name);
                eventParams = {
                    command: cmd,
                    commandName: name.toLowerCase(),
                    commandArgs: cmdArgs
                };
                if (!cmd || !~this.queryCommandState(name)) {
                    return false;
                }
                if (!this._hasEnterExecCommand) {
                    this._hasEnterExecCommand = true;
                    stoped = this._fire(new MinderEvent("beforeExecCommand", eventParams, true));
                    if (!stoped) {
                        this._fire(new MinderEvent("preExecCommand", eventParams, false));
                        result = cmd.execute.apply(cmd, [ me ].concat(cmdArgs));
                        this._fire(new MinderEvent("execCommand", eventParams, false));
                        if (cmd.isContentChanged()) {
                            this._firePharse(new MinderEvent("contentchange"));
                        }
                        this._interactChange();
                    }
                    this._hasEnterExecCommand = false;
                } else {
                    result = cmd.execute.apply(cmd, [ me ].concat(cmdArgs));
                    if (!this._hasEnterExecCommand) {
                        this._interactChange();
                    }
                }
                return result === undefined ? null : result;
            }
        });
        module.exports = Command;
    }
};

//src/core/compatibility.js
_p[12] = {
    value: function(require, exports, module) {
        var utils = _p.r(35);
        function compatibility(json) {
            var version = json.version || (json.root ? "1.4.0" : "1.1.3");
            switch (version) {
              case "1.1.3":
                c_113_120(json);

              /* falls through */
                case "1.2.0":
              case "1.2.1":
                c_120_130(json);

              /* falls through */
                case "1.3.0":
              case "1.3.1":
              case "1.3.2":
              case "1.3.3":
              case "1.3.4":
              case "1.3.5":
                /* falls through */
                c_130_140(json);
            }
            return json;
        }
        function traverse(node, fn) {
            fn(node);
            if (node.children) node.children.forEach(function(child) {
                traverse(child, fn);
            });
        }
        /* 脑图数据升级 */
        function c_120_130(json) {
            traverse(json, function(node) {
                var data = node.data;
                delete data.layout_bottom_offset;
                delete data.layout_default_offset;
                delete data.layout_filetree_offset;
            });
        }
        /**
     * 脑图数据升级
     * v1.1.3 => v1.2.0
     * */
        function c_113_120(json) {
            // 原本的布局风格
            var ocs = json.data.currentstyle;
            delete json.data.currentstyle;
            // 为 1.2 选择模板，同时保留老版本文件的皮肤
            if (ocs == "bottom") {
                json.template = "structure";
                json.theme = "snow";
            } else if (ocs == "default") {
                json.template = "default";
                json.theme = "classic";
            }
            traverse(json, function(node) {
                var data = node.data;
                // 升级优先级、进度图标
                if ("PriorityIcon" in data) {
                    data.priority = data.PriorityIcon;
                    delete data.PriorityIcon;
                }
                if ("ProgressIcon" in data) {
                    data.progress = 1 + (data.ProgressIcon - 1 << 1);
                    delete data.ProgressIcon;
                }
                // 删除过时属性
                delete data.point;
                delete data.layout;
            });
        }
        function c_130_140(json) {
            json.root = {
                data: json.data,
                children: json.children
            };
            delete json.data;
            delete json.children;
        }
        return compatibility;
    }
};

//src/core/connect.js
_p[13] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Module = _p.r(22);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        // 连线提供方
        var _connectProviders = {};
        function register(name, provider) {
            _connectProviders[name] = provider;
        }
        register("default", function(node, parent, connection) {
            connection.setPathData([ "M", parent.getLayoutVertexOut(), "L", node.getLayoutVertexIn() ]);
        });
        kity.extendClass(MinderNode, {
            /**
         * @private
         * @method getConnect()
         * @for MinderNode
         * @description 获取当前节点的连线类型
         *
         * @grammar getConnect() => {string}
         */
            getConnect: function() {
                return this.data.connect || "default";
            },
            getConnectProvider: function() {
                return _connectProviders[this.getConnect()] || _connectProviders["default"];
            },
            /**
         * @private
         * @method getConnection()
         * @for MinderNode
         * @description 获取当前节点的连线对象
         *
         * @grammar getConnection() => {kity.Path}
         */
            getConnection: function() {
                return this._connection || null;
            }
        });
        kity.extendClass(Minder, {
            getConnectContainer: function() {
                return this._connectContainer;
            },
            createConnect: function(node) {
                if (node.isRoot()) return;
                var connection = new kity.Path();
                node._connection = connection;
                this._connectContainer.addShape(connection);
                this.updateConnect(node);
            },
            removeConnect: function(node) {
                var me = this;
                node.traverse(function(node) {
                    me._connectContainer.removeShape(node._connection);
                    node._connection = null;
                });
            },
            updateConnect: function(node) {
                var connection = node._connection;
                var parent = node.parent;
                if (!parent || !connection) return;
                if (parent.isCollapsed()) {
                    connection.setVisible(false);
                    return;
                }
                connection.setVisible(true);
                var provider = node.getConnectProvider();
                var strokeColor = node.getStyle("connect-color") || "white", strokeWidth = node.getStyle("connect-width") || 2;
                connection.stroke(strokeColor, strokeWidth);
                provider(node, parent, connection, strokeWidth, strokeColor);
                if (strokeWidth % 2 === 0) {
                    connection.setTranslate(.5, .5);
                } else {
                    connection.setTranslate(0, 0);
                }
            }
        });
        Module.register("Connect", {
            init: function() {
                this._connectContainer = new kity.Group().setId(utils.uuid("minder_connect_group"));
                this.getRenderContainer().prependShape(this._connectContainer);
            },
            events: {
                nodeattach: function(e) {
                    this.createConnect(e.node);
                },
                nodedetach: function(e) {
                    this.removeConnect(e.node);
                },
                "layoutapply layoutfinish noderender": function(e) {
                    this.updateConnect(e.node);
                }
            }
        });
        exports.register = register;
    }
};

//src/core/data.js
_p[14] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var MinderEvent = _p.r(15);
        var compatibility = _p.r(12);
        var Promise = _p.r(27);
        var protocols = {};
        function registerProtocol(name, protocol) {
            protocols[name] = protocol;
            for (var pname in protocols) {
                if (protocols.hasOwnProperty(pname)) {
                    protocols[pname] = protocols[pname];
                    protocols[pname].name = pname;
                }
            }
        }
        function getRegisterProtocol(name) {
            return name === undefined ? protocols : protocols[name] || null;
        }
        exports.registerProtocol = registerProtocol;
        exports.getRegisterProtocol = getRegisterProtocol;
        // 导入导出
        kity.extendClass(Minder, {
            // 自动导入
            setup: function(target) {
                if (typeof target == "string") {
                    target = document.querySelector(target);
                }
                if (!target) return;
                var protocol = target.getAttribute("minder-data-type");
                if (protocol in protocols) {
                    var data = target.textContent;
                    target.textContent = null;
                    this.renderTo(target);
                    this.importData(protocol, data);
                }
                return this;
            },
            /**
         * @method exportJson()
         * @for Minder
         * @description
         *     导出当前脑图数据为 JSON 对象，导出的数据格式请参考 [Data](data) 章节。
         * @grammar exportJson() => {plain}
         */
            exportJson: function() {
                /* 导出 node 上整棵树的数据为 JSON */
                function exportNode(node) {
                    var exported = {};
                    exported.data = node.getData();
                    var childNodes = node.getChildren();
                    exported.children = [];
                    for (var i = 0; i < childNodes.length; i++) {
                        exported.children.push(exportNode(childNodes[i]));
                    }
                    return exported;
                }
                var json = {
                    root: exportNode(this.getRoot())
                };
                json.template = this.getTemplate();
                json.theme = this.getTheme();
                json.version = Minder.version;
                json.relLine = this._relLine;
                return JSON.parse(JSON.stringify(json));
            },
            /**
         * function Text2Children(MinderNode, String) 
         * @param {MinderNode} node 要导入数据的节点
         * @param {String} text 导入的text数据
         * @Desc: 用于批量插入子节点，并不会修改被插入的父节点
         * @Editor: Naixor
         * @Date: 2015.9.21
         * @example: 用于批量导入如下类型的节点
         *      234
         *      3456346 asadf
         *          12312414
         *              wereww
         *          12314
         *      1231412
         *      13123    
         */
            Text2Children: function(node, text) {
                if (!(node instanceof kityminder.Node)) {
                    return;
                }
                var children = [], jsonMap = {}, level = 0;
                var LINE_SPLITTER = /\r|\n|\r\n/, TAB_REGEXP = /^(\t|\x20{4})/;
                var lines = text.split(LINE_SPLITTER), line = "", jsonNode, i = 0;
                var minder = this;
                function isEmpty(line) {
                    return line === "" && !/\S/.test(line);
                }
                function getNode(line) {
                    return {
                        data: {
                            text: line.replace(/^(\t|\x20{4})+/, "").replace(/(\t|\x20{4})+$/, "")
                        },
                        children: []
                    };
                }
                function getLevel(text) {
                    var level = 0;
                    while (TAB_REGEXP.test(text)) {
                        text = text.replace(TAB_REGEXP, "");
                        level++;
                    }
                    return level;
                }
                function addChild(parent, node) {
                    parent.children.push(node);
                }
                function importChildren(node, children) {
                    for (var i = 0, l = children.length; i < l; i++) {
                        var childNode = minder.createNode(null, node);
                        childNode.setData("text", children[i].data.text || "");
                        importChildren(childNode, children[i].children);
                    }
                }
                while ((line = lines[i++]) !== undefined) {
                    line = line.replace(/&nbsp;/g, "");
                    if (isEmpty(line)) continue;
                    level = getLevel(line);
                    jsonNode = getNode(line);
                    if (level === 0) {
                        jsonMap = {};
                        children.push(jsonNode);
                        jsonMap[0] = children[children.length - 1];
                    } else {
                        if (!jsonMap[level - 1]) {
                            throw new Error("Invalid local format");
                        }
                        addChild(jsonMap[level - 1], jsonNode);
                        jsonMap[level] = jsonNode;
                    }
                }
                importChildren(node, children);
                minder.refresh();
            },
            /**
         * @method exportNode(MinderNode)
         * @param  {MinderNode} node 当前要被导出的节点
         * @return {Object}      返回只含有data和children的Object
         * @Editor: Naixor
         * @Date: 2015.9.22
         */
            exportNode: function(node) {
                var exported = {};
                exported.data = node.getData();
                var childNodes = node.getChildren();
                exported.children = [];
                for (var i = 0; i < childNodes.length; i++) {
                    exported.children.push(this.exportNode(childNodes[i]));
                }
                return exported;
            },
            /**
         * @method importNode()
         * @description 根据纯json {data, children}数据转换成为脑图节点
         * @Editor: Naixor
         * @Date: 2015.9.20
         */
            importNode: function(node, json) {
                var data = json.data;
                node.data = {};
                for (var field in data) {
                    node.setData(field, data[field]);
                }
                var childrenTreeData = json.children || [];
                for (var i = 0; i < childrenTreeData.length; i++) {
                    var childNode = this.createNode(null, node);
                    this.importNode(childNode, childrenTreeData[i]);
                }
                return node;
            },
            /**
         * @method importJson()
         * @for Minder
         * @description 导入脑图数据，数据为 JSON 对象，具体的数据字段形式请参考 [Data](data) 章节。
         *
         * @grammar importJson(json) => {this}
         *
         * @param {plain} json 要导入的数据
         */
            importJson: function(json) {
                if (!json) return;
                /**
             * @event preimport
             * @for Minder
             * @when 导入数据之前
             */
                this._fire(new MinderEvent("preimport", null, false));
                // 删除当前所有节点
                while (this._root.getChildren().length) {
                    this.removeNode(this._root.getChildren()[0]);
                }
                json = compatibility(json);
                this.importNode(this._root, json.root);
                this.setTemplate(json.template || "default");
                this.setTheme(json.theme || null);
                //TODO:zhhlog 实现relLine
                if (json.relLine) {
                    this._relLine = json.relLine;
                }
                this.refresh();
                /**
             * @event import,contentchange,interactchange
             * @for Minder
             * @when 导入数据之后
             */
                this.fire("import");
                this._firePharse({
                    type: "contentchange"
                });
                this._interactChange();
                return this;
            },
            /**
         * @method exportData()
         * @for Minder
         * @description 使用指定使用的数据协议，导入脑图数据
         *
         * @grammar exportData(protocol) => Promise<data>
         *
         * @param {string} protocol 指定的数据协议（默认内置五种数据协议 `json`、`text`、`markdown`、`svg` 和 `png`）
         */
            exportData: function(protocolName, option) {
                var json, protocol;
                json = this.exportJson();
                // 指定了协议进行导出，需要检测协议是否支持
                if (protocolName) {
                    protocol = protocols[protocolName];
                    if (!protocol || !protocol.encode) {
                        return Promise.reject(new Error("Not supported protocol:" + protocolName));
                    }
                }
                // 导出前抛个事件
                this._fire(new MinderEvent("beforeexport", {
                    json: json,
                    protocolName: protocolName,
                    protocol: protocol
                }));
                return Promise.resolve(protocol.encode(json, this, option));
            },
            /**
         * @method importData()
         * @for Minder
         * @description 使用指定的数据协议，导入脑图数据，覆盖当前实例的脑图
         *
         * @grammar importData(protocol, callback) => Promise<json>
         *
         * @param {string} protocol 指定的用于解析数据的数据协议（默认内置三种数据协议 `json`、`text` 和 `markdown` 的支持）
         * @param {any} data 要导入的数据
         */
            importData: function(protocolName, data, option) {
                var json, protocol;
                var minder = this;
                // 指定了协议进行导入，需要检测协议是否支持
                if (protocolName) {
                    protocol = protocols[protocolName];
                    if (!protocol || !protocol.decode) {
                        return Promise.reject(new Error("Not supported protocol:" + protocolName));
                    }
                }
                var params = {
                    local: data,
                    protocolName: protocolName,
                    protocol: protocol
                };
                // 导入前抛事件
                this._fire(new MinderEvent("beforeimport", params));
                return Promise.resolve(protocol.decode(data, this, option)).then(function(json) {
                    minder.importJson(json);
                    return json;
                });
            },
            /**
         * @method decodeData()
         * @for Minder
         * @description 使用指定的数据协议，解析为脑图数据，与 importData 的区别在于：不覆盖当前实例的脑图
         *
         * @grammar decodeData(protocol, callback) => Promise<json>
         *
         * @param {string} protocol 指定的用于解析数据的数据协议（默认内置三种数据协议 `json`、`text` 和 `markdown` 的支持）
         * @param {any} data 要导入的数据
         */
            decodeData: function(protocolName, data, option) {
                var json, protocol;
                var minder = this;
                // 指定了协议进行导入，需要检测协议是否支持
                if (protocolName) {
                    protocol = protocols[protocolName];
                    if (!protocol || !protocol.decode) {
                        return Promise.reject(new Error("Not supported protocol:" + protocolName));
                    }
                }
                var params = {
                    local: data,
                    protocolName: protocolName,
                    protocol: protocol
                };
                // 导入前抛事件
                this._fire(new MinderEvent("beforeimport", params));
                return Promise.resolve(protocol.decode(data, this, option));
            }
        });
    }
};

//src/core/event.js
_p[15] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        /**
     * @class MinderEvent
     * @description 表示一个脑图中发生的事件
     */
        var MinderEvent = kity.createClass("MindEvent", {
            constructor: function(type, params, canstop) {
                params = params || {};
                if (params.getType && params.getType() == "ShapeEvent") {
                    /**
                 * @property kityEvent
                 * @for MinderEvent
                 * @description 如果事件是从一个 kity 的事件派生的，会有 kityEvent 属性指向原来的 kity 事件
                 * @type {KityEvent}
                 */
                    this.kityEvent = params;
                    /**
                 * @property originEvent
                 * @for MinderEvent
                 * @description 如果事件是从原声 Dom 事件派生的（如 click、mousemove 等），会有 originEvent 指向原来的 Dom 事件
                 * @type {DomEvent}
                 */
                    this.originEvent = params.originEvent;
                } else if (params.target && params.preventDefault) {
                    this.originEvent = params;
                } else {
                    kity.Utils.extend(this, params);
                }
                /**
             * @property type
             * @for MinderEvent
             * @description 事件的类型，如 `click`、`contentchange` 等
             * @type {string}
             */
                this.type = type;
                this._canstop = canstop || false;
            },
            /**
         * @method getPosition()
         * @for MinderEvent
         * @description 如果事件是从一个 kity 事件派生的，会有 `getPosition()` 获取事件发生的坐标
         *
         * @grammar getPosition(refer) => {kity.Point}
         *
         * @param {string|kity.Shape} refer
         *     参照的坐标系，
         *     `"screen"` - 以浏览器屏幕为参照坐标系
         *     `"minder"` - （默认）以脑图画布为参照坐标系
         *     `{kity.Shape}` - 指定以某个 kity 图形为参照坐标系
         */
            getPosition: function(refer) {
                if (!this.kityEvent) return;
                if (!refer || refer == "minder") {
                    return this.kityEvent.getPosition(this.minder.getRenderContainer());
                }
                return this.kityEvent.getPosition.call(this.kityEvent, refer);
            },
            /**
         * @method getTargetNode()
         * @for MinderEvent
         * @description 当发生的事件是鼠标事件时，获取事件位置命中的脑图节点
         *
         * @grammar getTargetNode() => {MinderNode}
         */
            getTargetNode: function() {
                var findShape = this.kityEvent && this.kityEvent.targetShape;
                if (!findShape) return null;
                while (!findShape.minderNode && findShape.container) {
                    findShape = findShape.container;
                }
                var node = findShape.minderNode;
                if (node && findShape.getOpacity() < 1) return null;
                return node || null;
            },
            /**
         * @method stopPropagation()
         * @for MinderEvent
         * @description 当发生的事件是鼠标事件时，获取事件位置命中的脑图节点
         *
         * @grammar getTargetNode() => {MinderNode}
         */
            stopPropagation: function() {
                this._stoped = true;
            },
            stopPropagationImmediately: function() {
                this._immediatelyStoped = true;
                this._stoped = true;
            },
            shouldStopPropagation: function() {
                return this._canstop && this._stoped;
            },
            shouldStopPropagationImmediately: function() {
                return this._canstop && this._immediatelyStoped;
            },
            preventDefault: function() {
                this.originEvent.preventDefault();
            },
            isRightMB: function() {
                var isRightMB = false;
                if (!this.originEvent) {
                    return false;
                }
                if ("which" in this.originEvent) isRightMB = this.originEvent.which == 3; else if ("button" in this.originEvent) isRightMB = this.originEvent.button == 2;
                return isRightMB;
            },
            getKeyCode: function() {
                var evt = this.originEvent;
                return evt.keyCode || evt.which;
            }
        });
        Minder.registerInitHook(function(option) {
            this._initEvents();
        });
        kity.extendClass(Minder, {
            _initEvents: function() {
                this._eventCallbacks = {};
            },
            _resetEvents: function() {
                this._initEvents();
                this._bindEvents();
            },
            _bindEvents: function() {
                /* jscs:disable maximumLineLength */
                this._paper.on("click dblclick mousedown contextmenu mouseup mousemove mouseover mousewheel DOMMouseScroll touchstart touchmove touchend dragenter dragleave drop", this._firePharse.bind(this));
                if (window) {
                    window.addEventListener("resize", this._firePharse.bind(this));
                }
            },
            /**
         * @method dispatchKeyEvent
         * @description 派发键盘（相关）事件到脑图实例上，让实例的模块处理
         * @grammar dispatchKeyEvent(e) => {this}
         * @param  {Event} e 原生的 Dom 事件对象
         */
            dispatchKeyEvent: function(e) {
                this._firePharse(e);
            },
            _firePharse: function(e) {
                var beforeEvent, preEvent, executeEvent;
                if (e.type == "DOMMouseScroll") {
                    e.type = "mousewheel";
                    e.wheelDelta = e.originEvent.wheelDelta = e.originEvent.detail * -10;
                    e.wheelDeltaX = e.originEvent.mozMovementX;
                    e.wheelDeltaY = e.originEvent.mozMovementY;
                }
                beforeEvent = new MinderEvent("before" + e.type, e, true);
                if (this._fire(beforeEvent)) {
                    return;
                }
                preEvent = new MinderEvent("pre" + e.type, e, true);
                executeEvent = new MinderEvent(e.type, e, true);
                if (this._fire(preEvent) || this._fire(executeEvent)) this._fire(new MinderEvent("after" + e.type, e, false));
            },
            _interactChange: function(e) {
                var me = this;
                if (me._interactScheduled) return;
                setTimeout(function() {
                    me._fire(new MinderEvent("interactchange"));
                    me._interactScheduled = false;
                }, 100);
                me._interactScheduled = true;
            },
            _listen: function(type, callback) {
                var callbacks = this._eventCallbacks[type] || (this._eventCallbacks[type] = []);
                callbacks.push(callback);
            },
            _fire: function(e) {
                /**
             * @property minder
             * @description 产生事件的 Minder 对象
             * @for MinderShape
             * @type {Minder}
             */
                e.minder = this;
                var status = this.getStatus();
                var callbacks = this._eventCallbacks[e.type.toLowerCase()] || [];
                if (status) {
                    callbacks = callbacks.concat(this._eventCallbacks[status + "." + e.type.toLowerCase()] || []);
                }
                if (callbacks.length === 0) {
                    return;
                }
                var lastStatus = this.getStatus();
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i].call(this, e);
                    /* this.getStatus() != lastStatus ||*/
                    if (e.shouldStopPropagationImmediately()) {
                        break;
                    }
                }
                return e.shouldStopPropagation();
            },
            on: function(name, callback) {
                var km = this;
                name.split(/\s+/).forEach(function(n) {
                    km._listen(n.toLowerCase(), callback);
                });
                return this;
            },
            off: function(name, callback) {
                var types = name.split(/\s+/);
                var i, j, callbacks, removeIndex;
                for (i = 0; i < types.length; i++) {
                    callbacks = this._eventCallbacks[types[i].toLowerCase()];
                    if (callbacks) {
                        removeIndex = null;
                        for (j = 0; j < callbacks.length; j++) {
                            if (callbacks[j] == callback) {
                                removeIndex = j;
                            }
                        }
                        if (removeIndex !== null) {
                            callbacks.splice(removeIndex, 1);
                        }
                    }
                }
            },
            fire: function(type, params) {
                var e = new MinderEvent(type, params);
                this._fire(e);
                return this;
            }
        });
        module.exports = MinderEvent;
    }
};

//src/core/focus.js
_p[16] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Minder = _p.r(21);
        Minder.registerInitHook(function() {
            this.on("beforemousedown", function(e) {
                this.focus();
                e.preventDefault();
            });
            this.on("paperrender", function() {
                this.focus();
            });
        });
        kity.extendClass(Minder, {
            focus: function() {
                if (!this.isFocused()) {
                    var renderTarget = this._renderTarget;
                    renderTarget.classList.add("focus");
                    this.renderNodeBatch(this.getSelectedNodes());
                }
                this.fire("focus");
                return this;
            },
            blur: function() {
                if (this.isFocused()) {
                    var renderTarget = this._renderTarget;
                    renderTarget.classList.remove("focus");
                    this.renderNodeBatch(this.getSelectedNodes());
                }
                this.fire("blur");
                return this;
            },
            isFocused: function() {
                var renderTarget = this._renderTarget;
                return renderTarget && renderTarget.classList.contains("focus");
            }
        });
    }
};

//src/core/keymap.js
_p[17] = {
    value: function(require, exports, module) {
        var keymap = {
            Backspace: 8,
            Tab: 9,
            Enter: 13,
            Shift: 16,
            Control: 17,
            Alt: 18,
            CapsLock: 20,
            Esc: 27,
            Spacebar: 32,
            PageUp: 33,
            PageDown: 34,
            End: 35,
            Home: 36,
            Insert: 45,
            Left: 37,
            Up: 38,
            Right: 39,
            Down: 40,
            direction: {
                37: 1,
                38: 1,
                39: 1,
                40: 1
            },
            Del: 46,
            NumLock: 144,
            Cmd: 91,
            CmdFF: 224,
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123,
            "`": 192,
            "=": 187,
            "-": 189,
            "/": 191,
            ".": 190,
            controlKeys: {
                16: 1,
                17: 1,
                18: 1,
                20: 1,
                91: 1,
                224: 1
            },
            notContentChange: {
                13: 1,
                9: 1,
                33: 1,
                34: 1,
                35: 1,
                36: 1,
                16: 1,
                17: 1,
                18: 1,
                20: 1,
                91: 1,
                //上下左右
                37: 1,
                38: 1,
                39: 1,
                40: 1,
                113: 1,
                114: 1,
                115: 1,
                144: 1,
                27: 1
            },
            isSelectedNodeKey: {
                //上下左右
                37: 1,
                38: 1,
                39: 1,
                40: 1,
                13: 1,
                9: 1
            }
        };
        // 小写适配
        for (var key in keymap) {
            if (keymap.hasOwnProperty(key)) {
                keymap[key.toLowerCase()] = keymap[key];
            }
        }
        var aKeyCode = 65;
        var aCharCode = "a".charCodeAt(0);
        // letters
        "abcdefghijklmnopqrstuvwxyz".split("").forEach(function(letter) {
            keymap[letter] = aKeyCode + (letter.charCodeAt(0) - aCharCode);
        });
        // numbers
        var n = 9;
        do {
            keymap[n.toString()] = n + 48;
        } while (--n);
        module.exports = keymap;
    }
};

//src/core/keyreceiver.js
_p[18] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        function listen(element, type, handler) {
            type.split(" ").forEach(function(name) {
                element.addEventListener(name, handler, false);
            });
        }
        Minder.registerInitHook(function(option) {
            this.setDefaultOptions({
                enableKeyReceiver: true
            });
            if (this.getOption("enableKeyReceiver")) {
                this.on("paperrender", function() {
                    this._initKeyReceiver();
                });
            }
        });
        kity.extendClass(Minder, {
            _initKeyReceiver: function() {
                if (this._keyReceiver) return;
                var receiver = this._keyReceiver = document.createElement("input");
                receiver.classList.add("km-receiver");
                var renderTarget = this._renderTarget;
                renderTarget.appendChild(receiver);
                var minder = this;
                listen(receiver, "keydown keyup keypress copy paste blur focus input", function(e) {
                    switch (e.type) {
                      case "blur":
                        minder.blur();
                        break;

                      case "focus":
                        minder.focus();
                        break;

                      case "input":
                        receiver.value = null;
                        break;
                    }
                    minder._firePharse(e);
                    e.preventDefault();
                });
                this.on("focus", function() {
                    receiver.select();
                    receiver.focus();
                });
                this.on("blur", function() {
                    receiver.blur();
                });
                if (this.isFocused()) {
                    receiver.select();
                    receiver.focus();
                }
            }
        });
    }
};

//src/core/kity.js
/**
 * @fileOverview
 *
 * Kity 引入
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[19] = {
    value: function(require, exports, module) {
        module.exports = window.kity;
    }
};

//src/core/layout.js
_p[20] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var MinderEvent = _p.r(15);
        var Command = _p.r(11);
        var _layouts = {};
        var _defaultLayout;
        function register(name, layout) {
            _layouts[name] = layout;
            _defaultLayout = _defaultLayout || name;
        }
        /**
     * @class Layout 布局基类，具体布局需要从该类派生
     */
        var Layout = kity.createClass("Layout", {
            /**
         * @abstract
         *
         * 子类需要实现的布局算法，该算法输入一个节点，排布该节点的子节点（相对父节点的变换）
         *
         * @param  {MinderNode} node 需要布局的节点
         *
         * @example
         *
         * doLayout: function(node) {
         *     var children = node.getChildren();
         *     // layout calculation
         *     children[i].setLayoutTransform(new kity.Matrix().translate(x, y));
         * }
         */
            doLayout: function(parent, children) {
                throw new Error("Not Implement: Layout.doLayout()");
            },
            /**
         * 对齐指定的节点
         *
         * @param {Array<MinderNode>} nodes 要对齐的节点
         * @param {string} border 对齐边界，允许取值 left, right, top, bottom
         *
         */
            align: function(nodes, border, offset) {
                var me = this;
                offset = offset || 0;
                nodes.forEach(function(node) {
                    var tbox = me.getTreeBox([ node ]);
                    var matrix = node.getLayoutTransform();
                    switch (border) {
                      case "left":
                        return matrix.translate(offset - tbox.left, 0);

                      case "right":
                        return matrix.translate(offset - tbox.right, 0);

                      case "top":
                        return matrix.translate(0, offset - tbox.top);

                      case "bottom":
                        return matrix.translate(0, offset - tbox.bottom);
                    }
                });
            },
            stack: function(nodes, axis, distance) {
                var me = this;
                var position = 0;
                distance = distance || function(node, next, axis) {
                    return node.getStyle({
                        x: "margin-right",
                        y: "margin-bottom"
                    }[axis]) + next.getStyle({
                        x: "margin-left",
                        y: "margin-top"
                    }[axis]);
                };
                nodes.forEach(function(node, index, nodes) {
                    var tbox = me.getTreeBox([ node ]);
                    var size = {
                        x: tbox.width,
                        y: tbox.height
                    }[axis];
                    var offset = {
                        x: tbox.left,
                        y: tbox.top
                    }[axis];
                    var matrix = node.getLayoutTransform();
                    if (axis == "x") {
                        matrix.translate(position - offset, 0);
                    } else {
                        matrix.translate(0, position - offset);
                    }
                    position += size;
                    if (nodes[index + 1]) position += distance(node, nodes[index + 1], axis);
                });
                return position;
            },
            move: function(nodes, dx, dy) {
                nodes.forEach(function(node) {
                    node.getLayoutTransform().translate(dx, dy);
                });
                // console.log("zhhlog:layout:move");
                //移动以后布局可能变化，执行所有等待帧需要延迟300才能完成渲染节点
                if (typeof km !== "undefined" && typeof km._relLine_render === "function") {
                    km._relLine_render(300);
                }
            },
            /**
         * 工具方法：获取给点的节点所占的布局区域
         *
         * @param  {MinderNode[]} nodes 需要计算的节点
         *
         * @return {Box} 计算结果
         */
            getBranchBox: function(nodes) {
                var box = new kity.Box();
                var i, node, matrix, contentBox;
                for (i = 0; i < nodes.length; i++) {
                    node = nodes[i];
                    matrix = node.getLayoutTransform();
                    contentBox = node.getContentBox();
                    box = box.merge(matrix.transformBox(contentBox));
                }
                return box;
            },
            /**
         * 工具方法：计算给定的节点的子树所占的布局区域
         *
         * @param  {MinderNode} nodes 需要计算的节点
         *
         * @return {Box} 计算的结果
         */
            getTreeBox: function(nodes) {
                var i, node, matrix, treeBox;
                var box = new kity.Box();
                if (!(nodes instanceof Array)) nodes = [ nodes ];
                for (i = 0; i < nodes.length; i++) {
                    node = nodes[i];
                    matrix = node.getLayoutTransform();
                    treeBox = node.getContentBox();
                    if (node.isExpanded() && node.children.length) {
                        treeBox = treeBox.merge(this.getTreeBox(node.children));
                    }
                    box = box.merge(matrix.transformBox(treeBox));
                }
                return box;
            },
            getOrderHint: function(node) {
                return [];
            }
        });
        Layout.register = register;
        Minder.registerInitHook(function(options) {
            this.refresh();
        });
        /**
     * 布局支持池子管理
     */
        utils.extend(Minder, {
            getLayoutList: function() {
                return _layouts;
            },
            getLayoutInstance: function(name) {
                var LayoutClass = _layouts[name];
                if (!LayoutClass) throw new Error("Missing Layout: " + name);
                var layout = new LayoutClass();
                return layout;
            }
        });
        /**
     * MinderNode 上的布局支持
     */
        kity.extendClass(MinderNode, {
            /**
         * 获得当前节点的布局名称
         *
         * @return {String}
         */
            getLayout: function() {
                var layout = this.getData("layout");
                layout = layout || (this.isRoot() ? _defaultLayout : this.parent.getLayout());
                return layout;
            },
            setLayout: function(name) {
                if (name) {
                    if (name == "inherit") {
                        this.setData("layout");
                    } else {
                        this.setData("layout", name);
                    }
                }
                return this;
            },
            layout: function(name) {
                this.setLayout(name).getMinder().layout();
                return this;
            },
            getLayoutInstance: function() {
                return Minder.getLayoutInstance(this.getLayout());
            },
            getOrderHint: function(refer) {
                return this.parent.getLayoutInstance().getOrderHint(this);
            },
            /**
         * 获取当前节点相对于父节点的布局变换
         */
            getLayoutTransform: function() {
                return this._layoutTransform || new kity.Matrix();
            },
            /**
         * 第一轮布局计算后，获得的全局布局位置
         *
         * @return {[type]} [description]
         */
            getGlobalLayoutTransformPreview: function() {
                var pMatrix = this.parent ? this.parent.getLayoutTransform() : new kity.Matrix();
                var matrix = this.getLayoutTransform();
                var offset = this.getLayoutOffset();
                if (offset) {
                    matrix = matrix.clone().translate(offset.x, offset.y);
                }
                return pMatrix.merge(matrix);
            },
            getLayoutPointPreview: function() {
                return this.getGlobalLayoutTransformPreview().transformPoint(new kity.Point());
            },
            /**
         * 获取节点相对于全局的布局变换
         */
            getGlobalLayoutTransform: function() {
                if (this._globalLayoutTransform) {
                    return this._globalLayoutTransform;
                } else if (this.parent) {
                    return this.parent.getGlobalLayoutTransform();
                } else {
                    return new kity.Matrix();
                }
            },
            /**
         * 设置当前节点相对于父节点的布局变换
         */
            setLayoutTransform: function(matrix) {
                this._layoutTransform = matrix;
                return this;
            },
            /**
         * 设置当前节点相对于全局的布局变换（冗余优化）
         */
            setGlobalLayoutTransform: function(matrix) {
                this.getRenderContainer().setMatrix(this._globalLayoutTransform = matrix);
                return this;
            },
            setVertexIn: function(p) {
                this._vertexIn = p;
            },
            setVertexOut: function(p) {
                this._vertexOut = p;
            },
            getVertexIn: function() {
                return this._vertexIn || new kity.Point();
            },
            getVertexOut: function() {
                return this._vertexOut || new kity.Point();
            },
            getLayoutVertexIn: function() {
                return this.getGlobalLayoutTransform().transformPoint(this.getVertexIn());
            },
            getLayoutVertexOut: function() {
                return this.getGlobalLayoutTransform().transformPoint(this.getVertexOut());
            },
            setLayoutVectorIn: function(v) {
                this._layoutVectorIn = v;
                return this;
            },
            setLayoutVectorOut: function(v) {
                this._layoutVectorOut = v;
                return this;
            },
            getLayoutVectorIn: function() {
                return this._layoutVectorIn || new kity.Vector();
            },
            getLayoutVectorOut: function() {
                return this._layoutVectorOut || new kity.Vector();
            },
            getLayoutBox: function() {
                var matrix = this.getGlobalLayoutTransform();
                return matrix.transformBox(this.getContentBox());
            },
            getLayoutPoint: function() {
                var matrix = this.getGlobalLayoutTransform();
                return matrix.transformPoint(new kity.Point());
            },
            getLayoutOffset: function() {
                if (!this.parent) return new kity.Point();
                // 影响当前节点位置的是父节点的布局
                var data = this.getData("layout_" + this.parent.getLayout() + "_offset");
                if (data) return new kity.Point(data.x, data.y);
                return new kity.Point();
            },
            setLayoutOffset: function(p) {
                if (!this.parent) return this;
                this.setData("layout_" + this.parent.getLayout() + "_offset", p ? {
                    x: p.x,
                    y: p.y
                } : undefined);
                return this;
            },
            hasLayoutOffset: function() {
                return !!this.getData("layout_" + this.parent.getLayout() + "_offset");
            },
            resetLayoutOffset: function() {
                return this.setLayoutOffset(null);
            },
            getLayoutRoot: function() {
                if (this.isLayoutRoot()) {
                    return this;
                }
                return this.parent.getLayoutRoot();
            },
            isLayoutRoot: function() {
                return this.getData("layout") || this.isRoot();
            }
        });
        /**
     * Minder 上的布局支持
     */
        kity.extendClass(Minder, {
            layout: function() {
                var duration = this.getOption("layoutAnimationDuration");
                this.getRoot().traverse(function(node) {
                    // clear last results
                    node.setLayoutTransform(null);
                });
                function layoutNode(node, round) {
                    // layout all children first
                    // 剪枝：收起的节点无需计算
                    if (node.isExpanded() || true) {
                        node.children.forEach(function(child) {
                            layoutNode(child, round);
                        });
                    }
                    var layout = node.getLayoutInstance();
                    // var childrenInFlow = node.getChildren().filter(function(child) {
                    //     return !child.hasLayoutOffset();
                    // });
                    layout.doLayout(node, node.getChildren(), round);
                }
                // 第一轮布局
                layoutNode(this.getRoot(), 1);
                // 第二轮布局
                layoutNode(this.getRoot(), 2);
                var minder = this;
                this.applyLayoutResult(this.getRoot(), duration, function() {
                    /**
                 * 当节点>200, 不使用动画时, 此处逻辑变为同步逻辑, 外部minder.on事件无法
                 * 被提前录入, 因此增加setTimeout
                 * @author Naixor
                 */
                    setTimeout(function() {
                        minder.fire("layoutallfinish");
                    }, 0);
                });
                return this.fire("layout");
            },
            refresh: function() {
                this.getRoot().renderTree();
                this.layout().fire("contentchange")._interactChange();
                return this;
            },
            applyLayoutResult: function(root, duration, callback) {
                root = root || this.getRoot();
                var me = this;
                var complex = root.getComplex();
                function consume() {
                    if (!--complex) {
                        if (callback) {
                            callback();
                        }
                    }
                }
                // 节点复杂度大于 100，关闭动画
                if (complex > 200) duration = 0;
                function applyMatrix(node, matrix) {
                    node.setGlobalLayoutTransform(matrix);
                    me.fire("layoutapply", {
                        node: node,
                        matrix: matrix
                    });
                }
                function apply(node, pMatrix) {
                    var matrix = node.getLayoutTransform().merge(pMatrix.clone());
                    var lastMatrix = node.getGlobalLayoutTransform() || new kity.Matrix();
                    var offset = node.getLayoutOffset();
                    matrix.translate(offset.x, offset.y);
                    matrix.m.e = Math.round(matrix.m.e);
                    matrix.m.f = Math.round(matrix.m.f);
                    // 如果当前有动画，停止动画
                    if (node._layoutTimeline) {
                        node._layoutTimeline.stop();
                        node._layoutTimeline = null;
                    }
                    // 如果要求以动画形式来更新，创建动画
                    if (duration) {
                        node._layoutTimeline = new kity.Animator(lastMatrix, matrix, applyMatrix).start(node, duration, "ease").on("finish", function() {
                            //可能性能低的时候会丢帧，手动添加一帧
                            setTimeout(function() {
                                applyMatrix(node, matrix);
                                me.fire("layoutfinish", {
                                    node: node,
                                    matrix: matrix
                                });
                                consume();
                            }, 150);
                        });
                    } else {
                        applyMatrix(node, matrix);
                        me.fire("layoutfinish", {
                            node: node,
                            matrix: matrix
                        });
                        consume();
                    }
                    for (var i = 0; i < node.children.length; i++) {
                        apply(node.children[i], matrix);
                    }
                }
                apply(root, root.parent ? root.parent.getGlobalLayoutTransform() : new kity.Matrix());
                //节点变换/移动更新点
                // console.log("zhhlog:layout:applyLayoutResult");
                if (typeof this._relLine_render === "function") {
                    this._relLine_render();
                }
                return this;
            }
        });
        module.exports = Layout;
    }
};

//src/core/minder.js
/**
 * @fileOverview
 *
 * KityMinder 类，暴露在 window 上的唯一变量
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[21] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var _initHooks = [];
        var Minder = kity.createClass("Minder", {
            constructor: function(options) {
                this._options = utils.extend({}, options);
                var initHooks = _initHooks.slice();
                var initHook;
                while (initHooks.length) {
                    initHook = initHooks.shift();
                    if (typeof initHook == "function") {
                        initHook.call(this, this._options);
                    }
                }
                this.fire("finishInitHook");
            }
        });
        Minder.version = "1.4.43";
        Minder.registerInitHook = function(hook) {
            _initHooks.push(hook);
        };
        module.exports = Minder;
    }
};

//src/core/module.js
_p[22] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        /* 已注册的模块 */
        var _modules = {};
        exports.register = function(name, module) {
            _modules[name] = module;
        };
        /* 模块初始化 */
        Minder.registerInitHook(function() {
            this._initModules();
        });
        // 模块声明周期维护
        kity.extendClass(Minder, {
            _initModules: function() {
                var modulesPool = _modules;
                var modulesToLoad = this._options.modules || utils.keys(modulesPool);
                this._commands = {};
                this._query = {};
                this._modules = {};
                this._rendererClasses = {};
                var i, name, type, module, moduleDeals, dealCommands, dealEvents, dealRenderers;
                var me = this;
                for (i = 0; i < modulesToLoad.length; i++) {
                    name = modulesToLoad[i];
                    if (!modulesPool[name]) continue;
                    // 执行模块初始化，抛出后续处理对象
                    if (typeof modulesPool[name] == "function") {
                        moduleDeals = modulesPool[name].call(me);
                    } else {
                        moduleDeals = modulesPool[name];
                    }
                    this._modules[name] = moduleDeals;
                    if (!moduleDeals) continue;
                    if (moduleDeals.defaultOptions) {
                        me.setDefaultOptions(moduleDeals.defaultOptions);
                    }
                    if (moduleDeals.init) {
                        moduleDeals.init.call(me, this._options);
                    }
                    /**
                 * @Desc: 判断是否支持原生clipboard事件，如果支持，则对pager添加其监听
                 * @Editor: Naixor
                 * @Date: 2015.9.20
                 */
                    /**
                 * 由于当前脑图解构问题，clipboard暂时全权交由玩不托管
                 * @Editor: Naixor
                 * @Date: 2015.9.24
                 */
                    // if (name === 'ClipboardModule' && this.supportClipboardEvent  && !kity.Browser.gecko) {
                    //     var on = function () {
                    //         var clipBoardReceiver = this.clipBoardReceiver || document;
                    //         if (document.addEventListener) {
                    //             clipBoardReceiver.addEventListener.apply(this, arguments);
                    //         } else {
                    //             arguments[0] = 'on' + arguments[0];
                    //             clipBoardReceiver.attachEvent.apply(this, arguments);
                    //         }
                    //     }
                    //     for (var command in moduleDeals.clipBoardEvents) {
                    //         on(command, moduleDeals.clipBoardEvents[command]);
                    //     }
                    // };
                    // command加入命令池子
                    dealCommands = moduleDeals.commands;
                    for (name in dealCommands) {
                        this._commands[name.toLowerCase()] = new dealCommands[name]();
                    }
                    // 绑定事件
                    dealEvents = moduleDeals.events;
                    if (dealEvents) {
                        for (type in dealEvents) {
                            me.on(type, dealEvents[type]);
                        }
                    }
                    // 渲染器
                    dealRenderers = moduleDeals.renderers;
                    if (dealRenderers) {
                        for (type in dealRenderers) {
                            this._rendererClasses[type] = this._rendererClasses[type] || [];
                            if (utils.isArray(dealRenderers[type])) {
                                this._rendererClasses[type] = this._rendererClasses[type].concat(dealRenderers[type]);
                            } else {
                                this._rendererClasses[type].push(dealRenderers[type]);
                            }
                        }
                    }
                    //添加模块的快捷键
                    if (moduleDeals.commandShortcutKeys) {
                        this.addCommandShortcutKeys(moduleDeals.commandShortcutKeys);
                    }
                }
            },
            _garbage: function() {
                this.clearSelect();
                while (this._root.getChildren().length) {
                    this._root.removeChild(0);
                }
            },
            destroy: function() {
                var modules = this._modules;
                this._resetEvents();
                this._garbage();
                for (var key in modules) {
                    if (!modules[key].destroy) continue;
                    modules[key].destroy.call(this);
                }
            },
            reset: function() {
                var modules = this._modules;
                this._garbage();
                for (var key in modules) {
                    if (!modules[key].reset) continue;
                    modules[key].reset.call(this);
                }
            }
        });
    }
};

//src/core/node.js
_p[23] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        /**
     * @class MinderNode
     *
     * 表示一个脑图节点
     */
        var MinderNode = kity.createClass("MinderNode", {
            /**
         * 创建一个游离的脑图节点
         *
         * @param {String|Object} textOrData
         *     节点的初始数据或文本
         */
            constructor: function(textOrData) {
                // 指针
                this.parent = null;
                this.root = this;
                this.children = [];
                // 数据
                this.data = {
                    id: utils.guid(),
                    created: +new Date()
                };
                // 绘图容器
                this.initContainers();
                if (utils.isString(textOrData)) {
                    this.setText(textOrData);
                } else if (utils.isObject(textOrData)) {
                    utils.extend(this.data, textOrData);
                }
            },
            initContainers: function() {
                this.rc = new kity.Group().setId(utils.uuid("minder_node"));
                this.rc.minderNode = this;
            },
            /**
         * 判断节点是否根节点
         */
            isRoot: function() {
                return this.root === this;
            },
            /**
         * 判断节点是否叶子
         */
            isLeaf: function() {
                return this.children.length === 0;
            },
            /**
         * 获取节点的根节点
         */
            getRoot: function() {
                return this.root || this;
            },
            /**
         * 获得节点的父节点
         */
            getParent: function() {
                return this.parent;
            },
            getSiblings: function() {
                var children = this.parent.children;
                var siblings = [];
                var self = this;
                children.forEach(function(child) {
                    if (child != self) siblings.push(child);
                });
                return siblings;
            },
            /**
         * 获得节点的深度
         */
            getLevel: function() {
                var level = 0, ancestor = this.parent;
                while (ancestor) {
                    level++;
                    ancestor = ancestor.parent;
                }
                return level;
            },
            /**
         * 获得节点的复杂度（即子树中节点的数量）
         */
            getComplex: function() {
                var complex = 0;
                this.traverse(function() {
                    complex++;
                });
                return complex;
            },
            /**
         * 获得节点的类型（root|main|sub）
         */
            getType: function(type) {
                this.type = [ "root", "main", "sub" ][Math.min(this.getLevel(), 2)];
                return this.type;
            },
            /**
         * 判断当前节点是否被测试节点的祖先
         * @param  {MinderNode}  test 被测试的节点
         */
            isAncestorOf: function(test) {
                var ancestor = test.parent;
                while (ancestor) {
                    if (ancestor == this) return true;
                    ancestor = ancestor.parent;
                }
                return false;
            },
            getData: function(key) {
                return key ? this.data[key] : this.data;
            },
            setData: function(key, value) {
                if (typeof key == "object") {
                    var data = key;
                    for (key in data) if (data.hasOwnProperty(key)) {
                        this.data[key] = data[key];
                    }
                } else {
                    this.data[key] = value;
                }
                return this;
            },
            /**
         * 设置节点的文本数据
         * @param {String} text 文本数据
         */
            setText: function(text) {
                return this.data.text = text;
            },
            /**
         * 获取节点的文本数据
         * @return {String}
         */
            getText: function() {
                return this.data.text || null;
            },
            /**
         * 先序遍历当前节点树
         * @param  {Function} fn 遍历函数
         */
            preTraverse: function(fn, excludeThis) {
                var children = this.getChildren();
                if (!excludeThis) fn(this);
                for (var i = 0; i < children.length; i++) {
                    children[i].preTraverse(fn);
                }
            },
            /**
         * 后序遍历当前节点树
         * @param  {Function} fn 遍历函数
         */
            postTraverse: function(fn, excludeThis) {
                var children = this.getChildren();
                for (var i = 0; i < children.length; i++) {
                    children[i].postTraverse(fn);
                }
                if (!excludeThis) fn(this);
            },
            traverse: function(fn, excludeThis) {
                return this.postTraverse(fn, excludeThis);
            },
            getChildren: function() {
                return this.children;
            },
            getIndex: function() {
                return this.parent ? this.parent.children.indexOf(this) : -1;
            },
            insertChild: function(node, index) {
                if (index === undefined) {
                    index = this.children.length;
                }
                if (node.parent) {
                    node.parent.removeChild(node);
                }
                node.parent = this;
                node.root = this.root;
                this.children.splice(index, 0, node);
            },
            appendChild: function(node) {
                return this.insertChild(node);
            },
            prependChild: function(node) {
                return this.insertChild(node, 0);
            },
            removeChild: function(elem) {
                var index = elem, removed;
                if (elem instanceof MinderNode) {
                    index = this.children.indexOf(elem);
                }
                if (index >= 0) {
                    removed = this.children.splice(index, 1)[0];
                    removed.parent = null;
                    removed.root = removed;
                }
            },
            clearChildren: function() {
                this.children = [];
            },
            getChild: function(index) {
                return this.children[index];
            },
            getRenderContainer: function() {
                return this.rc;
            },
            getCommonAncestor: function(node) {
                return MinderNode.getCommonAncestor(this, node);
            },
            contains: function(node) {
                return this == node || this.isAncestorOf(node);
            },
            clone: function() {
                var cloned = new MinderNode();
                cloned.data = utils.clone(this.data);
                this.children.forEach(function(child) {
                    cloned.appendChild(child.clone());
                });
                return cloned;
            },
            compareTo: function(node) {
                if (!utils.comparePlainObject(this.data, node.data)) return false;
                if (!utils.comparePlainObject(this.temp, node.temp)) return false;
                if (this.children.length != node.children.length) return false;
                var i = 0;
                while (this.children[i]) {
                    if (!this.children[i].compareTo(node.children[i])) return false;
                    i++;
                }
                return true;
            },
            getMinder: function() {
                return this.getRoot().minder;
            }
        });
        MinderNode.getCommonAncestor = function(nodeA, nodeB) {
            if (nodeA instanceof Array) {
                return MinderNode.getCommonAncestor.apply(this, nodeA);
            }
            switch (arguments.length) {
              case 1:
                return nodeA.parent || nodeA;

              case 2:
                if (nodeA.isAncestorOf(nodeB)) {
                    return nodeA;
                }
                if (nodeB.isAncestorOf(nodeA)) {
                    return nodeB;
                }
                var ancestor = nodeA.parent;
                while (ancestor && !ancestor.isAncestorOf(nodeB)) {
                    ancestor = ancestor.parent;
                }
                return ancestor;

              default:
                return Array.prototype.reduce.call(arguments, function(prev, current) {
                    return MinderNode.getCommonAncestor(prev, current);
                }, nodeA);
            }
        };
        kity.extendClass(Minder, {
            getRoot: function() {
                return this._root;
            },
            setRoot: function(root) {
                this._root = root;
                root.minder = this;
            },
            getAllNode: function() {
                var nodes = [];
                this.getRoot().traverse(function(node) {
                    nodes.push(node);
                });
                return nodes;
            },
            getNodeById: function(id) {
                return this.getNodesById([ id ])[0];
            },
            getNodesById: function(ids) {
                var nodes = this.getAllNode();
                var result = [];
                nodes.forEach(function(node) {
                    if (ids.indexOf(node.getData("id")) != -1) {
                        result.push(node);
                    }
                });
                return result;
            },
            createNode: function(textOrData, parent, index) {
                var node = new MinderNode(textOrData);
                this.fire("nodecreate", {
                    node: node,
                    parent: parent,
                    index: index
                });
                this.appendNode(node, parent, index);
                return node;
            },
            appendNode: function(node, parent, index) {
                if (parent) parent.insertChild(node, index);
                this.attachNode(node);
                return this;
            },
            removeNode: function(node) {
                if (node.parent) {
                    node.parent.removeChild(node);
                    this.detachNode(node);
                    this.fire("noderemove", {
                        node: node
                    });
                }
            },
            attachNode: function(node) {
                var rc = this.getRenderContainer();
                node.traverse(function(current) {
                    current.attached = true;
                    rc.addShape(current.getRenderContainer());
                });
                rc.addShape(node.getRenderContainer());
                this.fire("nodeattach", {
                    node: node
                });
            },
            detachNode: function(node) {
                var rc = this.getRenderContainer();
                node.traverse(function(current) {
                    current.attached = false;
                    rc.removeShape(current.getRenderContainer());
                });
                this.fire("nodedetach", {
                    node: node
                });
            },
            getMinderTitle: function() {
                return this.getRoot().getText();
            }
        });
        module.exports = MinderNode;
    }
};

//src/core/option.js
/**
 * @fileOverview
 *
 * 提供脑图选项支持
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[24] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        Minder.registerInitHook(function(options) {
            this._defaultOptions = {};
        });
        kity.extendClass(Minder, {
            setDefaultOptions: function(options) {
                utils.extend(this._defaultOptions, options);
                return this;
            },
            getOption: function(key) {
                if (key) {
                    return key in this._options ? this._options[key] : this._defaultOptions[key];
                } else {
                    return utils.extend({}, this._defaultOptions, this._options);
                }
            },
            setOption: function(key, value) {
                this._options[key] = value;
            }
        });
    }
};

//src/core/paper.js
/**
 * @fileOverview
 *
 * 初始化渲染容器
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[25] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        Minder.registerInitHook(function() {
            this._initPaper();
        });
        kity.extendClass(Minder, {
            _initPaper: function() {
                this._paper = new kity.Paper();
                this._paper._minder = this;
                this._paper.getNode().ondragstart = function(e) {
                    e.preventDefault();
                };
                this._paper.shapeNode.setAttribute("transform", "translate(0.5, 0.5)");
                this._addRenderContainer();
                this.setRoot(this.createNode());
                if (this._options.renderTo) {
                    this.renderTo(this._options.renderTo);
                }
            },
            _addRenderContainer: function() {
                this._rc = new kity.Group().setId(utils.uuid("minder"));
                this._paper.addShape(this._rc);
            },
            renderTo: function(target) {
                if (typeof target == "string") {
                    target = document.querySelector(target);
                }
                if (target) {
                    if (target.tagName.toLowerCase() == "script") {
                        var newTarget = document.createElement("div");
                        newTarget.id = target.id;
                        newTarget.class = target.class;
                        target.parentNode.insertBefore(newTarget, target);
                        target.parentNode.removeChild(target);
                        target = newTarget;
                    }
                    target.classList.add("km-view");
                    this._paper.renderTo(this._renderTarget = target);
                    this._bindEvents();
                    this.fire("paperrender");
                }
                return this;
            },
            getRenderContainer: function() {
                return this._rc;
            },
            getPaper: function() {
                return this._paper;
            },
            getRenderTarget: function() {
                return this._renderTarget;
            }
        });
    }
};

//src/core/patch.js
/**
 * @fileOverview
 *
 * 打补丁
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[26] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Minder = _p.r(21);
        function insertNode(minder, info, parent, index) {
            parent = minder.createNode(info.data, parent, index);
            info.children.forEach(function(childInfo, index) {
                insertNode(minder, childInfo, parent, index);
            });
            return parent;
        }
        function applyPatch(minder, patch) {
            // patch.op - 操作，包括 remove, add, replace
            // patch.path - 路径，如 '/root/children/1/data'
            // patch.value - 数据，如 { text: "思路" }
            var path = patch.path.split("/");
            path.shift();
            var changed = path.shift();
            var node;
            if (changed == "root") {
                var dataIndex = path.indexOf("data");
                if (dataIndex > -1) {
                    changed = "data";
                    var dataPath = path.splice(dataIndex + 1);
                    patch.dataPath = dataPath;
                } else {
                    changed = "node";
                }
                node = minder.getRoot();
                var segment, index;
                while (segment = path.shift()) {
                    if (segment == "children") continue;
                    if (typeof index != "undefined") node = node.getChild(index);
                    index = +segment;
                }
                patch.index = index;
                patch.node = node;
            }
            var express = patch.express = [ changed, patch.op ].join(".");
            switch (express) {
              case "theme.replace":
                minder.useTheme(patch.value);
                break;

              case "template.replace":
                minder.useTemplate(patch.value);
                break;

              case "node.add":
                insertNode(minder, patch.value, patch.node, patch.index).renderTree();
                minder.layout();
                break;

              case "node.remove":
                minder.removeNode(patch.node.getChild(patch.index));
                minder.layout();
                break;

              case "data.add":
              case "data.replace":
              case "data.remove":
                var data = patch.node.data;
                var field;
                path = patch.dataPath.slice();
                while (data && path.length > 1) {
                    field = path.shift();
                    if (field in data) {
                        data = data[field];
                    } else if (patch.op != "remove") {
                        data = data[field] = {};
                    }
                }
                if (data) {
                    field = path.shift();
                    data[field] = patch.value;
                }
                if (field == "expandState") {
                    node.renderTree();
                } else {
                    node.render();
                }
                minder.layout();
            }
            minder.fire("patch", {
                patch: patch
            });
        }
        kity.extendClass(Minder, {
            applyPatches: function(patches) {
                for (var i = 0; i < patches.length; i++) {
                    applyPatch(this, patches[i]);
                }
                this.fire("contentchange");
                return this;
            }
        });
    }
};

//src/core/promise.js
_p[27] = {
    value: function(require, exports, module) {
        /*!
    **  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
    **  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
    **  Licensed under The MIT License <http://opensource.org/licenses/MIT>
    **  Source-Code distributed on <http://github.com/rse/thenable>
    */
        /*  promise states [Promises/A+ 2.1]  */
        var STATE_PENDING = 0;
        /*  [Promises/A+ 2.1.1]  */
        var STATE_FULFILLED = 1;
        /*  [Promises/A+ 2.1.2]  */
        var STATE_REJECTED = 2;
        /*  [Promises/A+ 2.1.3]  */
        /*  promise object constructor  */
        var Promise = function(executor) {
            /*  optionally support non-constructor/plain-function call  */
            if (!(this instanceof Promise)) return new Promise(executor);
            /*  initialize object  */
            this.id = "Thenable/1.0.7";
            this.state = STATE_PENDING;
            /*  initial state  */
            this.fulfillValue = undefined;
            /*  initial value  */
            /*  [Promises/A+ 1.3, 2.1.2.2]  */
            this.rejectReason = undefined;
            /*  initial reason */
            /*  [Promises/A+ 1.5, 2.1.3.2]  */
            this.onFulfilled = [];
            /*  initial handlers  */
            this.onRejected = [];
            /*  initial handlers  */
            /*  support optional executor function  */
            if (typeof executor === "function") executor.call(this, this.fulfill.bind(this), this.reject.bind(this));
        };
        /*  Promise API methods  */
        Promise.prototype = {
            /*  promise resolving methods  */
            fulfill: function(value) {
                return deliver(this, STATE_FULFILLED, "fulfillValue", value);
            },
            reject: function(value) {
                return deliver(this, STATE_REJECTED, "rejectReason", value);
            },
            /*  'The then Method' [Promises/A+ 1.1, 1.2, 2.2]  */
            then: function(onFulfilled, onRejected) {
                var curr = this;
                var next = new Promise();
                /*  [Promises/A+ 2.2.7]  */
                curr.onFulfilled.push(resolver(onFulfilled, next, "fulfill"));
                /*  [Promises/A+ 2.2.2/2.2.6]  */
                curr.onRejected.push(resolver(onRejected, next, "reject"));
                /*  [Promises/A+ 2.2.3/2.2.6]  */
                execute(curr);
                return next;
            }
        };
        Promise.all = function(arr) {
            return new Promise(function(resolve, reject) {
                var len = arr.length, i = 0, res = 0, results = [];
                if (len === 0) {
                    resolve(results);
                }
                while (i < len) {
                    arr[i].then(function(result) {
                        results.push(result);
                        if (++res === len) {
                            resolve(results);
                        }
                    }, function(val) {
                        reject(val);
                    });
                    i++;
                }
            });
        };
        /*  deliver an action  */
        var deliver = function(curr, state, name, value) {
            if (curr.state === STATE_PENDING) {
                curr.state = state;
                /*  [Promises/A+ 2.1.2.1, 2.1.3.1]  */
                curr[name] = value;
                /*  [Promises/A+ 2.1.2.2, 2.1.3.2]  */
                execute(curr);
            }
            return curr;
        };
        /*  execute all handlers  */
        var execute = function(curr) {
            if (curr.state === STATE_FULFILLED) execute_handlers(curr, "onFulfilled", curr.fulfillValue); else if (curr.state === STATE_REJECTED) execute_handlers(curr, "onRejected", curr.rejectReason);
        };
        /*  execute particular set of handlers  */
        var execute_handlers = function(curr, name, value) {
            /* global process: true */
            /* global setImmediate: true */
            /* global setTimeout: true */
            /*  short-circuit processing  */
            if (curr[name].length === 0) return;
            /*  iterate over all handlers, exactly once  */
            var handlers = curr[name];
            curr[name] = [];
            /*  [Promises/A+ 2.2.2.3, 2.2.3.3]  */
            var func = function() {
                for (var i = 0; i < handlers.length; i++) handlers[i](value);
            };
            /*  execute procedure asynchronously  */
            /*  [Promises/A+ 2.2.4, 3.1]  */
            if (typeof process === "object" && typeof process.nextTick === "function") process.nextTick(func); else if (typeof setImmediate === "function") setImmediate(func); else setTimeout(func, 0);
        };
        /*  generate a resolver function */
        var resolver = function(cb, next, method) {
            return function(value) {
                if (typeof cb !== "function") /*  [Promises/A+ 2.2.1, 2.2.7.3, 2.2.7.4]  */
                next[method].call(next, value); else {
                    var result;
                    try {
                        if (value instanceof Promise) {
                            result = value.then(cb);
                        } else result = cb(value);
                    } /*  [Promises/A+ 2.2.2.1, 2.2.3.1, 2.2.5, 3.2]  */
                    catch (e) {
                        next.reject(e);
                        /*  [Promises/A+ 2.2.7.2]  */
                        return;
                    }
                    resolve(next, result);
                }
            };
        };
        /*  'Promise Resolution Procedure'  */
        /*  [Promises/A+ 2.3]  */
        var resolve = function(promise, x) {
            /*  sanity check arguments  */
            /*  [Promises/A+ 2.3.1]  */
            if (promise === x) {
                promise.reject(new TypeError("cannot resolve promise with itself"));
                return;
            }
            /*  surgically check for a 'then' method
            (mainly to just call the 'getter' of 'then' only once)  */
            var then;
            if (typeof x === "object" && x !== null || typeof x === "function") {
                try {
                    then = x.then;
                } /*  [Promises/A+ 2.3.3.1, 3.5]  */
                catch (e) {
                    promise.reject(e);
                    /*  [Promises/A+ 2.3.3.2]  */
                    return;
                }
            }
            /*  handle own Thenables    [Promises/A+ 2.3.2]
            and similar 'thenables' [Promises/A+ 2.3.3]  */
            if (typeof then === "function") {
                var resolved = false;
                try {
                    /*  call retrieved 'then' method */
                    /*  [Promises/A+ 2.3.3.3]  */
                    then.call(x, /*  resolvePromise  */
                    /*  [Promises/A+ 2.3.3.3.1]  */
                    function(y) {
                        if (resolved) return;
                        resolved = true;
                        /*  [Promises/A+ 2.3.3.3.3]  */
                        if (y === x) /*  [Promises/A+ 3.6]  */
                        promise.reject(new TypeError("circular thenable chain")); else resolve(promise, y);
                    }, /*  rejectPromise  */
                    /*  [Promises/A+ 2.3.3.3.2]  */
                    function(r) {
                        if (resolved) return;
                        resolved = true;
                        /*  [Promises/A+ 2.3.3.3.3]  */
                        promise.reject(r);
                    });
                } catch (e) {
                    if (!resolved) /*  [Promises/A+ 2.3.3.3.3]  */
                    promise.reject(e);
                }
                return;
            }
            /*  handle other values  */
            promise.fulfill(x);
        };
        Promise.resolve = function(value) {
            return new Promise(function(resolve) {
                resolve(value);
            });
        };
        Promise.reject = function(reason) {
            return new Promise(function(resolve, reject) {
                reject(reason);
            });
        };
        /*  export API  */
        module.exports = Promise;
    }
};

//src/core/readonly.js
/**
 * @fileOverview
 *
 * 只读模式支持
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[28] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Minder = _p.r(21);
        var MinderEvent = _p.r(15);
        Minder.registerInitHook(function(options) {
            if (options.readOnly) {
                this.setDisabled();
            }
        });
        kity.extendClass(Minder, {
            disable: function() {
                var me = this;
                //禁用命令
                me.bkqueryCommandState = me.queryCommandState;
                me.bkqueryCommandValue = me.queryCommandValue;
                me.queryCommandState = function(type) {
                    var cmd = this._getCommand(type);
                    if (cmd && cmd.enableReadOnly) {
                        return me.bkqueryCommandState.apply(me, arguments);
                    }
                    return -1;
                };
                me.queryCommandValue = function(type) {
                    var cmd = this._getCommand(type);
                    if (cmd && cmd.enableReadOnly) {
                        return me.bkqueryCommandValue.apply(me, arguments);
                    }
                    return null;
                };
                this.setStatus("readonly");
                me._interactChange();
            },
            enable: function() {
                var me = this;
                if (me.bkqueryCommandState) {
                    me.queryCommandState = me.bkqueryCommandState;
                    delete me.bkqueryCommandState;
                }
                if (me.bkqueryCommandValue) {
                    me.queryCommandValue = me.bkqueryCommandValue;
                    delete me.bkqueryCommandValue;
                }
                this.setStatus("normal");
                me._interactChange();
            }
        });
    }
};

//src/core/render.js
_p[29] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Renderer = kity.createClass("Renderer", {
            constructor: function(node) {
                this.node = node;
            },
            create: function(node) {
                throw new Error("Not implement: Renderer.create()");
            },
            shouldRender: function(node) {
                return true;
            },
            watchChange: function(data) {
                var changed;
                if (this.watchingData === undefined) {
                    changed = true;
                } else if (this.watchingData != data) {
                    changed = true;
                } else {
                    changed = false;
                }
                this.watchingData = data;
            },
            shouldDraw: function(node) {
                return true;
            },
            update: function(shape, node, box) {
                if (this.shouldDraw()) this.draw(shape, node);
                return this.place(shape, node, box);
            },
            draw: function(shape, node) {
                throw new Error("Not implement: Renderer.draw()");
            },
            place: function(shape, node, box) {
                throw new Error("Not implement: Renderer.place()");
            },
            getRenderShape: function() {
                return this._renderShape || null;
            },
            setRenderShape: function(shape) {
                this._renderShape = shape;
            }
        });
        function createMinderExtension() {
            function createRendererForNode(node, registered) {
                var renderers = [];
                [ "center", "left", "right", "top", "bottom", "outline", "outside" ].forEach(function(section) {
                    var before = "before" + section;
                    var after = "after" + section;
                    if (registered[before]) {
                        renderers = renderers.concat(registered[before]);
                    }
                    if (registered[section]) {
                        renderers = renderers.concat(registered[section]);
                    }
                    if (registered[after]) {
                        renderers = renderers.concat(registered[after]);
                    }
                });
                node._renderers = renderers.map(function(Renderer) {
                    return new Renderer(node);
                });
            }
            return {
                renderNodeBatch: function(nodes) {
                    var rendererClasses = this._rendererClasses;
                    var lastBoxes = [];
                    var rendererCount = 0;
                    var i, j, renderer, node;
                    if (!nodes.length) return;
                    for (j = 0; j < nodes.length; j++) {
                        node = nodes[j];
                        if (!node._renderers) {
                            createRendererForNode(node, rendererClasses);
                        }
                        node._contentBox = new kity.Box();
                        this.fire("beforerender", {
                            node: node
                        });
                    }
                    // 所有节点渲染器数量是一致的
                    rendererCount = nodes[0]._renderers.length;
                    for (i = 0; i < rendererCount; i++) {
                        // 获取延迟盒子数据
                        for (j = 0; j < nodes.length; j++) {
                            if (typeof lastBoxes[j] == "function") {
                                lastBoxes[j] = lastBoxes[j]();
                            }
                            if (!(lastBoxes[j] instanceof kity.Box)) {
                                lastBoxes[j] = new kity.Box(lastBoxes[j]);
                            }
                        }
                        for (j = 0; j < nodes.length; j++) {
                            node = nodes[j];
                            renderer = node._renderers[i];
                            // 合并盒子
                            if (lastBoxes[j]) {
                                node._contentBox = node._contentBox.merge(lastBoxes[j]);
                                renderer.contentBox = lastBoxes[j];
                            }
                            // 判断当前上下文是否应该渲染
                            if (renderer.shouldRender(node)) {
                                // 应该渲染，但是渲染图形没创建过，需要创建
                                if (!renderer.getRenderShape()) {
                                    renderer.setRenderShape(renderer.create(node));
                                    if (renderer.bringToBack) {
                                        node.getRenderContainer().prependShape(renderer.getRenderShape());
                                    } else {
                                        node.getRenderContainer().appendShape(renderer.getRenderShape());
                                    }
                                }
                                // 强制让渲染图形显示
                                renderer.getRenderShape().setVisible(true);
                                // 更新渲染图形
                                lastBoxes[j] = renderer.update(renderer.getRenderShape(), node, node._contentBox);
                            } else if (renderer.getRenderShape()) {
                                renderer.getRenderShape().setVisible(false);
                                lastBoxes[j] = null;
                            }
                        }
                    }
                    for (j = 0; j < nodes.length; j++) {
                        this.fire("noderender", {
                            node: nodes[j]
                        });
                    }
                },
                renderNode: function(node) {
                    var rendererClasses = this._rendererClasses;
                    var i, latestBox, renderer;
                    if (!node._renderers) {
                        createRendererForNode(node, rendererClasses);
                    }
                    this.fire("beforerender", {
                        node: node
                    });
                    node._contentBox = new kity.Box();
                    node._renderers.forEach(function(renderer) {
                        // 判断当前上下文是否应该渲染
                        if (renderer.shouldRender(node)) {
                            // 应该渲染，但是渲染图形没创建过，需要创建
                            if (!renderer.getRenderShape()) {
                                renderer.setRenderShape(renderer.create(node));
                                if (renderer.bringToBack) {
                                    node.getRenderContainer().prependShape(renderer.getRenderShape());
                                } else {
                                    node.getRenderContainer().appendShape(renderer.getRenderShape());
                                }
                            }
                            // 强制让渲染图形显示
                            renderer.getRenderShape().setVisible(true);
                            // 更新渲染图形
                            latestBox = renderer.update(renderer.getRenderShape(), node, node._contentBox);
                            if (typeof latestBox == "function") latestBox = latestBox();
                            // 合并渲染区域
                            if (latestBox) {
                                node._contentBox = node._contentBox.merge(latestBox);
                                renderer.contentBox = latestBox;
                            }
                        } else if (renderer.getRenderShape()) {
                            renderer.getRenderShape().setVisible(false);
                        }
                    });
                    this.fire("noderender", {
                        node: node
                    });
                }
            };
        }
        kity.extendClass(Minder, createMinderExtension());
        kity.extendClass(MinderNode, {
            render: function() {
                if (!this.attached) return;
                this.getMinder().renderNode(this);
                if (window.km && typeof window.km._relLine_render === "function") {
                    // console.log("zhhlog:render:render");
                    window.km._relLine_render();
                }
                return this;
            },
            renderTree: function() {
                if (!this.attached) return;
                var list = [];
                this.traverse(function(node) {
                    list.push(node);
                });
                this.getMinder().renderNodeBatch(list);
                if (window.km && typeof window.km._relLine_render === "function") {
                    // console.log("zhhlog:render:renderTree");
                    window.km._relLine_render(0, true);
                }
                return this;
            },
            getRenderer: function(type) {
                var rs = this._renderers;
                if (!rs) return null;
                for (var i = 0; i < rs.length; i++) {
                    if (rs[i].getType() == type) return rs[i];
                }
                return null;
            },
            getContentBox: function() {
                //if (!this._contentBox) this.render();
                return this.parent && this.parent.isCollapsed() ? new kity.Box() : this._contentBox || new kity.Box();
            },
            getRenderBox: function(rendererType, refer) {
                var renderer = rendererType && this.getRenderer(rendererType);
                var contentBox = renderer ? renderer.contentBox : this.getContentBox();
                var ctm = kity.Matrix.getCTM(this.getRenderContainer(), refer || "paper");
                return ctm.transformBox(contentBox);
            }
        });
        module.exports = Renderer;
    }
};

//src/core/select.js
_p[30] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        Minder.registerInitHook(function() {
            this._initSelection();
        });
        // 选区管理
        kity.extendClass(Minder, {
            _initSelection: function() {
                this._selectedNodes = [];
            },
            renderChangedSelection: function(last) {
                var current = this.getSelectedNodes();
                var changed = [];
                current.forEach(function(node) {
                    if (last.indexOf(node) == -1) {
                        changed.push(node);
                    }
                });
                last.forEach(function(node) {
                    if (current.indexOf(node) == -1) {
                        changed.push(node);
                    }
                });
                if (changed.length) {
                    this._interactChange();
                    this.fire("selectionchange");
                }
                while (changed.length) {
                    changed.shift().render();
                }
            },
            getSelectedNodes: function() {
                //不能克隆返回，会对当前选区操作，从而影响querycommand
                return this._selectedNodes;
            },
            getSelectedNode: function() {
                return this.getSelectedNodes()[0] || null;
            },
            removeAllSelectedNodes: function() {
                var me = this;
                var last = this._selectedNodes.splice(0);
                this._selectedNodes = [];
                this.renderChangedSelection(last);
                return this.fire("selectionclear");
            },
            removeSelectedNodes: function(nodes) {
                var me = this;
                var last = this._selectedNodes.slice(0);
                nodes = utils.isArray(nodes) ? nodes : [ nodes ];
                nodes.forEach(function(node) {
                    var index;
                    if ((index = me._selectedNodes.indexOf(node)) === -1) return;
                    me._selectedNodes.splice(index, 1);
                });
                this.renderChangedSelection(last);
                return this;
            },
            select: function(nodes, isSingleSelect) {
                var lastSelect = this.getSelectedNodes().slice(0);
                if (isSingleSelect) {
                    this._selectedNodes = [];
                }
                var me = this;
                nodes = utils.isArray(nodes) ? nodes : [ nodes ];
                nodes.forEach(function(node) {
                    if (me._selectedNodes.indexOf(node) !== -1) return;
                    me._selectedNodes.unshift(node);
                });
                this.renderChangedSelection(lastSelect);
                return this;
            },
            selectById: function(ids, isSingleSelect) {
                ids = utils.isArray(ids) ? ids : [ ids ];
                var nodes = this.getNodesById(ids);
                return this.select(nodes, isSingleSelect);
            },
            //当前选区中的节点在给定的节点范围内的保留选中状态，
            //没在给定范围的取消选中，给定范围中的但没在当前选中范围的也做选中效果
            toggleSelect: function(node) {
                if (utils.isArray(node)) {
                    node.forEach(this.toggleSelect.bind(this));
                } else {
                    if (node.isSelected()) this.removeSelectedNodes(node); else this.select(node);
                }
                return this;
            },
            isSingleSelect: function() {
                return this._selectedNodes.length == 1;
            },
            getSelectedAncestors: function(includeRoot) {
                var nodes = this.getSelectedNodes().slice(0), ancestors = [], judge;
                // 根节点不参与计算
                var rootIndex = nodes.indexOf(this.getRoot());
                if (~rootIndex && !includeRoot) {
                    nodes.splice(rootIndex, 1);
                }
                // 判断 nodes 列表中是否存在 judge 的祖先
                function hasAncestor(nodes, judge) {
                    for (var i = nodes.length - 1; i >= 0; --i) {
                        if (nodes[i].isAncestorOf(judge)) return true;
                    }
                    return false;
                }
                // 按照拓扑排序
                nodes.sort(function(node1, node2) {
                    return node1.getLevel() - node2.getLevel();
                });
                // 因为是拓扑有序的，所以只需往上查找
                while (judge = nodes.pop()) {
                    if (!hasAncestor(nodes, judge)) {
                        ancestors.push(judge);
                    }
                }
                return ancestors;
            }
        });
        kity.extendClass(MinderNode, {
            isSelected: function() {
                var minder = this.getMinder();
                return minder && minder.getSelectedNodes().indexOf(this) != -1;
            }
        });
    }
};

//src/core/shortcut.js
/**
 * @fileOverview
 *
 * 添加快捷键支持
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[31] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var keymap = _p.r(17);
        var Minder = _p.r(21);
        var MinderEvent = _p.r(15);
        /**
     * 计算包含 meta 键的 keycode
     *
     * @param  {String|KeyEvent} unknown
     */
        function getMetaKeyCode(unknown) {
            var CTRL_MASK = 4096;
            var ALT_MASK = 8192;
            var SHIFT_MASK = 16384;
            var metaKeyCode = 0;
            if (typeof unknown == "string") {
                // unknown as string
                unknown.toLowerCase().split(/\+\s*/).forEach(function(name) {
                    switch (name) {
                      case "ctrl":
                      case "cmd":
                        metaKeyCode |= CTRL_MASK;
                        break;

                      case "alt":
                        metaKeyCode |= ALT_MASK;
                        break;

                      case "shift":
                        metaKeyCode |= SHIFT_MASK;
                        break;

                      default:
                        metaKeyCode |= keymap[name];
                    }
                });
            } else {
                // unknown as key event
                if (unknown.ctrlKey || unknown.metaKey) {
                    metaKeyCode |= CTRL_MASK;
                }
                if (unknown.altKey) {
                    metaKeyCode |= ALT_MASK;
                }
                if (unknown.shiftKey) {
                    metaKeyCode |= SHIFT_MASK;
                }
                metaKeyCode |= unknown.keyCode;
            }
            return metaKeyCode;
        }
        kity.extendClass(MinderEvent, {
            isShortcutKey: function(keyCombine) {
                var keyEvent = this.originEvent;
                if (!keyEvent) return false;
                return getMetaKeyCode(keyCombine) == getMetaKeyCode(keyEvent);
            }
        });
        Minder.registerInitHook(function() {
            this._initShortcutKey();
        });
        kity.extendClass(Minder, {
            _initShortcutKey: function() {
                this._bindShortcutKeys();
            },
            _bindShortcutKeys: function() {
                var map = this._shortcutKeys = {};
                var has = "hasOwnProperty";
                this.on("keydown", function(e) {
                    for (var keys in map) {
                        if (!map[has](keys)) continue;
                        if (e.isShortcutKey(keys)) {
                            var fn = map[keys];
                            if (fn.__statusCondition && fn.__statusCondition != this.getStatus()) return;
                            fn();
                            e.preventDefault();
                        }
                    }
                });
            },
            addShortcut: function(keys, fn) {
                var binds = this._shortcutKeys;
                keys.split(/\|\s*/).forEach(function(combine) {
                    var parts = combine.split("::");
                    var status;
                    if (parts.length > 1) {
                        combine = parts[1];
                        status = parts[0];
                        fn.__statusCondition = status;
                    }
                    binds[combine] = fn;
                });
            },
            addCommandShortcutKeys: function(cmd, keys) {
                var binds = this._commandShortcutKeys || (this._commandShortcutKeys = {});
                var obj = {}, km = this;
                if (keys) {
                    obj[cmd] = keys;
                } else {
                    obj = cmd;
                }
                var minder = this;
                utils.each(obj, function(keys, command) {
                    binds[command] = keys;
                    minder.addShortcut(keys, function execCommandByShortcut() {
                        /**
                     * 之前判断有问题，由 === 0 改为 !== -1
                     * @editor Naixor
                     * @Date 2015-12-2
                     */
                        if (minder.queryCommandState(command) !== -1) {
                            minder.execCommand(command);
                        }
                    });
                });
            },
            getCommandShortcutKey: function(cmd) {
                var binds = this._commandShortcutKeys;
                return binds && binds[cmd] || null;
            },
            /**
         * @Desc: 添加一个判断是否支持原生Clipboard的变量，用于对ctrl + v和ctrl + c的处理
         * @Editor: Naixor
         * @Date: 2015.9.20
         */
            supportClipboardEvent: function(window) {
                return !!window.ClipboardEvent;
            }(window)
        });
    }
};

//src/core/status.js
/**
 * @fileOverview
 *
 * 状态切换控制
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[32] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Minder = _p.r(21);
        var sf = ~window.location.href.indexOf("status");
        var tf = ~window.location.href.indexOf("trace");
        Minder.registerInitHook(function() {
            this._initStatus();
        });
        kity.extendClass(Minder, {
            _initStatus: function() {
                this._status = "normal";
                this._rollbackStatus = "normal";
            },
            setStatus: function(status, force) {
                // 在 readonly 模式下，只有 force 为 true 才能切换回来
                if (this._status == "readonly" && !force) return this;
                if (status != this._status) {
                    this._rollbackStatus = this._status;
                    this._status = status;
                    this.fire("statuschange", {
                        lastStatus: this._rollbackStatus,
                        currentStatus: this._status
                    });
                    if (sf) {
                        /* global console: true */
                        console.log(window.event.type, this._rollbackStatus, "->", this._status);
                        if (tf) {
                            console.trace();
                        }
                    }
                }
                return this;
            },
            rollbackStatus: function() {
                this.setStatus(this._rollbackStatus);
            },
            getRollbackStatus: function() {
                return this._rollbackStatus;
            },
            getStatus: function() {
                return this._status;
            }
        });
    }
};

//src/core/template.js
_p[33] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var Command = _p.r(11);
        var MinderNode = _p.r(23);
        var Module = _p.r(22);
        var _templates = {};
        function register(name, supports) {
            _templates[name] = supports;
        }
        exports.register = register;
        utils.extend(Minder, {
            getTemplateList: function() {
                return _templates;
            }
        });
        kity.extendClass(Minder, function() {
            var originGetTheme = Minder.prototype.getTheme;
            return {
                useTemplate: function(name, duration) {
                    this.setTemplate(name);
                    this.refresh(duration || 800);
                },
                getTemplate: function() {
                    return this._template || "default";
                },
                setTemplate: function(name) {
                    this._template = name || null;
                },
                getTemplateSupport: function(method) {
                    var supports = _templates[this.getTemplate()];
                    return supports && supports[method];
                },
                getTheme: function(node) {
                    var support = this.getTemplateSupport("getTheme") || originGetTheme;
                    return support.call(this, node);
                }
            };
        }());
        kity.extendClass(MinderNode, function() {
            var originGetLayout = MinderNode.prototype.getLayout;
            var originGetConnect = MinderNode.prototype.getConnect;
            return {
                getLayout: function() {
                    var support = this.getMinder().getTemplateSupport("getLayout") || originGetLayout;
                    return support.call(this, this);
                },
                getConnect: function() {
                    var support = this.getMinder().getTemplateSupport("getConnect") || originGetConnect;
                    return support.call(this, this);
                }
            };
        }());
        Module.register("TemplateModule", {
            /**
         * @command Template
         * @description 设置当前脑图的模板
         * @param {string} name 模板名称
         *    允许使用的模板可以使用 `kityminder.Minder.getTemplateList()` 查询
         * @state
         *   0: 始终可用
         * @return 返回当前的模板名称
         */
            commands: {
                template: kity.createClass("TemplateCommand", {
                    base: Command,
                    execute: function(minder, name) {
                        minder.useTemplate(name);
                        minder.execCommand("camera");
                    },
                    queryValue: function(minder) {
                        return minder.getTemplate() || "default";
                    }
                })
            }
        });
    }
};

//src/core/theme.js
_p[34] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Module = _p.r(22);
        var Command = _p.r(11);
        var cssLikeValueMatcher = {
            left: function(value) {
                return 3 in value && value[3] || 1 in value && value[1] || value[0];
            },
            right: function(value) {
                return 1 in value && value[1] || value[0];
            },
            top: function(value) {
                return value[0];
            },
            bottom: function(value) {
                return 2 in value && value[2] || value[0];
            }
        };
        var _themes = {};
        /**
     * 注册一个主题
     *
     * @param  {String} name  主题的名称
     * @param  {Plain} theme 主题的样式描述
     *
     * @example
     *     Minder.registerTheme('default', {
     *         'root-color': 'red',
     *         'root-stroke': 'none',
     *         'root-padding': [10, 20]
     *     });
     */
        function register(name, theme) {
            _themes[name] = theme;
        }
        exports.register = register;
        utils.extend(Minder, {
            getThemeList: function() {
                return _themes;
            }
        });
        kity.extendClass(Minder, {
            /**
         * 切换脑图实例上的主题
         * @param  {String} name 要使用的主题的名称
         */
            useTheme: function(name) {
                this.setTheme(name);
                this.refresh(800);
                return true;
            },
            setTheme: function(name) {
                if (name && !_themes[name]) throw new Error("Theme " + name + " not exists!");
                var lastTheme = this._theme;
                this._theme = name || null;
                var container = this.getRenderTarget();
                if (container) {
                    container.classList.remove("km-theme-" + lastTheme);
                    if (name) {
                        container.classList.add("km-theme-" + name);
                    }
                    container.style.background = this.getStyle("background");
                }
                this.fire("themechange", {
                    theme: name
                });
                return this;
            },
            /**
         * 获取脑图实例上的当前主题
         * @return {[type]} [description]
         */
            getTheme: function(node) {
                return this._theme || this.getOption("defaultTheme") || "fresh-blue";
            },
            getThemeItems: function(node) {
                var theme = this.getTheme(node);
                return _themes[this.getTheme(node)];
            },
            /**
         * 获得脑图实例上的样式
         * @param  {String} item 样式名称
         */
            getStyle: function(item, node) {
                var items = this.getThemeItems(node);
                var segment, dir, selector, value, matcher;
                if (item in items) return items[item];
                // 尝试匹配 CSS 数组形式的值
                // 比如 item 为 'pading-left'
                // theme 里有 {'padding': [10, 20]} 的定义，则可以返回 20
                segment = item.split("-");
                if (segment.length < 2) return null;
                dir = segment.pop();
                item = segment.join("-");
                if (item in items) {
                    value = items[item];
                    if (utils.isArray(value) && (matcher = cssLikeValueMatcher[dir])) {
                        return matcher(value);
                    }
                    if (!isNaN(value)) return value;
                }
                return null;
            },
            /**
         * 获取指定节点的样式
         * @param  {String} name 样式名称，可以不加节点类型的前缀
         */
            getNodeStyle: function(node, name) {
                var value = this.getStyle(node.getType() + "-" + name, node);
                return value !== null ? value : this.getStyle(name, node);
            }
        });
        kity.extendClass(MinderNode, {
            getStyle: function(name) {
                return this.getMinder().getNodeStyle(this, name);
            }
        });
        Module.register("Theme", {
            defaultOptions: {
                defaultTheme: "fresh-blue"
            },
            commands: {
                /**
             * @command Theme
             * @description 设置当前脑图的主题
             * @param {string} name 主题名称
             *    允许使用的主题可以使用 `kityminder.Minder.getThemeList()` 查询
             * @state
             *   0: 始终可用
             * @return 返回当前的主题名称
             */
                theme: kity.createClass("ThemeCommand", {
                    base: Command,
                    execute: function(km, name) {
                        return km.useTheme(name);
                    },
                    queryValue: function(km) {
                        return km.getTheme() || "default";
                    }
                })
            }
        });
        Minder.registerInitHook(function() {
            this.setTheme();
        });
    }
};

//src/core/utils.js
_p[35] = {
    value: function(require, exports) {
        var kity = _p.r(19);
        var uuidMap = {};
        exports.extend = kity.Utils.extend.bind(kity.Utils);
        exports.each = kity.Utils.each.bind(kity.Utils);
        exports.uuid = function(group) {
            uuidMap[group] = uuidMap[group] ? uuidMap[group] + 1 : 1;
            return group + uuidMap[group];
        };
        exports.guid = function() {
            return (+new Date() * 1e6 + Math.floor(Math.random() * 1e6)).toString(36);
        };
        exports.trim = function(str) {
            return str.replace(/(^[ \t\n\r]+)|([ \t\n\r]+$)/g, "");
        };
        exports.keys = function(plain) {
            var keys = [];
            for (var key in plain) {
                if (plain.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
        exports.clone = function(source) {
            return JSON.parse(JSON.stringify(source));
        };
        exports.comparePlainObject = function(a, b) {
            return JSON.stringify(a) == JSON.stringify(b);
        };
        exports.encodeHtml = function(str, reg) {
            return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp);)?/g, function(a, b) {
                if (b) {
                    return a;
                } else {
                    return {
                        "<": "&lt;",
                        "&": "&amp;",
                        '"': "&quot;",
                        ">": "&gt;",
                        "'": "&#39;"
                    }[a];
                }
            }) : "";
        };
        exports.clearWhiteSpace = function(str) {
            return str.replace(/[\u200b\t\r\n]/g, "");
        };
        exports.each([ "String", "Function", "Array", "Number", "RegExp", "Object" ], function(v) {
            var toString = Object.prototype.toString;
            exports["is" + v] = function(obj) {
                return toString.apply(obj) == "[object " + v + "]";
            };
        });
    }
};

//src/expose-kityminder.js
_p[36] = {
    value: function(require, exports, module) {
        module.exports = window.kityminder = _p.r(37);
    }
};

//src/kityminder.js
/**
 * @fileOverview
 *
 * 默认导出（全部模块）
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[37] = {
    value: function(require, exports, module) {
        var kityminder = {
            version: _p.r(21).version
        };
        // 核心导出，大写的部分导出类，小写的部分简单 require 一下
        // 这里顺序是有讲究的，调整前先弄清楚依赖关系。
        _p.r(35);
        kityminder.Minder = _p.r(21);
        kityminder.Command = _p.r(11);
        kityminder.Node = _p.r(23);
        _p.r(24);
        _p.r(10);
        kityminder.Event = _p.r(15);
        kityminder.data = _p.r(14);
        _p.r(12);
        kityminder.KeyMap = _p.r(17);
        _p.r(31);
        _p.r(32);
        _p.r(25);
        _p.r(30);
        _p.r(16);
        _p.r(18);
        kityminder.Module = _p.r(22);
        _p.r(28);
        kityminder.Render = _p.r(29);
        kityminder.Connect = _p.r(13);
        kityminder.Layout = _p.r(20);
        kityminder.Theme = _p.r(34);
        kityminder.Template = _p.r(33);
        kityminder.Promise = _p.r(27);
        _p.r(9);
        _p.r(26);
        // 模块依赖
        _p.r(44);
        _p.r(45);
        _p.r(46);
        _p.r(47);
        _p.r(48);
        _p.r(50);
        _p.r(51);
        _p.r(53);
        _p.r(52);
        _p.r(54);
        _p.r(55);
        _p.r(56);
        _p.r(57);
        _p.r(58);
        _p.r(59);
        _p.r(60);
        _p.r(62);
        _p.r(63);
        _p.r(64);
        _p.r(65);
        _p.r(66);
        _p.r(67);
        _p.r(68);
        _p.r(72);
        _p.r(69);
        _p.r(71);
        _p.r(70);
        _p.r(42);
        _p.r(38);
        _p.r(39);
        _p.r(40);
        _p.r(41);
        _p.r(43);
        _p.r(79);
        _p.r(82);
        _p.r(81);
        _p.r(80);
        _p.r(82);
        _p.r(84);
        _p.r(83);
        _p.r(0);
        _p.r(1);
        _p.r(2);
        _p.r(3);
        _p.r(4);
        _p.r(7);
        _p.r(8);
        _p.r(73);
        _p.r(77);
        _p.r(74);
        _p.r(76);
        _p.r(75);
        _p.r(78);
        _p.r(49);
        _p.r(61);
        _p.r(5);
        _p.r(6);
        module.exports = kityminder;
    }
};

//src/layout/btree.js
_p[38] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Layout = _p.r(20);
        [ "left", "right", "top", "bottom" ].forEach(registerLayoutForDirection);
        function registerLayoutForDirection(name) {
            var axis = name == "left" || name == "right" ? "x" : "y";
            var dir = name == "left" || name == "top" ? -1 : 1;
            var oppsite = {
                left: "right",
                right: "left",
                top: "bottom",
                bottom: "top",
                x: "y",
                y: "x"
            };
            function getOrderHint(node) {
                var hint = [];
                var box = node.getLayoutBox();
                var offset = 5;
                if (axis == "x") {
                    hint.push({
                        type: "up",
                        node: node,
                        area: new kity.Box({
                            x: box.x,
                            y: box.top - node.getStyle("margin-top") - offset,
                            width: box.width,
                            height: node.getStyle("margin-top")
                        }),
                        path: [ "M", box.x, box.top - offset, "L", box.right, box.top - offset ]
                    });
                    hint.push({
                        type: "down",
                        node: node,
                        area: new kity.Box({
                            x: box.x,
                            y: box.bottom + offset,
                            width: box.width,
                            height: node.getStyle("margin-bottom")
                        }),
                        path: [ "M", box.x, box.bottom + offset, "L", box.right, box.bottom + offset ]
                    });
                } else {
                    hint.push({
                        type: "up",
                        node: node,
                        area: new kity.Box({
                            x: box.left - node.getStyle("margin-left") - offset,
                            y: box.top,
                            width: node.getStyle("margin-left"),
                            height: box.height
                        }),
                        path: [ "M", box.left - offset, box.top, "L", box.left - offset, box.bottom ]
                    });
                    hint.push({
                        type: "down",
                        node: node,
                        area: new kity.Box({
                            x: box.right + offset,
                            y: box.top,
                            width: node.getStyle("margin-right"),
                            height: box.height
                        }),
                        path: [ "M", box.right + offset, box.top, "L", box.right + offset, box.bottom ]
                    });
                }
                return hint;
            }
            Layout.register(name, kity.createClass({
                base: Layout,
                doLayout: function(parent, children) {
                    var pbox = parent.getContentBox();
                    if (axis == "x") {
                        parent.setVertexOut(new kity.Point(pbox[name], pbox.cy));
                        parent.setLayoutVectorOut(new kity.Vector(dir, 0));
                    } else {
                        parent.setVertexOut(new kity.Point(pbox.cx, pbox[name]));
                        parent.setLayoutVectorOut(new kity.Vector(0, dir));
                    }
                    if (!children.length) {
                        return false;
                    }
                    children.forEach(function(child) {
                        var cbox = child.getContentBox();
                        child.setLayoutTransform(new kity.Matrix());
                        if (axis == "x") {
                            child.setVertexIn(new kity.Point(cbox[oppsite[name]], cbox.cy));
                            child.setLayoutVectorIn(new kity.Vector(dir, 0));
                        } else {
                            child.setVertexIn(new kity.Point(cbox.cx, cbox[oppsite[name]]));
                            child.setLayoutVectorIn(new kity.Vector(0, dir));
                        }
                    });
                    this.align(children, oppsite[name]);
                    this.stack(children, oppsite[axis]);
                    var bbox = this.getBranchBox(children);
                    var xAdjust = 0, yAdjust = 0;
                    if (axis == "x") {
                        xAdjust = pbox[name];
                        xAdjust += dir * parent.getStyle("margin-" + name);
                        xAdjust += dir * children[0].getStyle("margin-" + oppsite[name]);
                        yAdjust = pbox.bottom;
                        yAdjust -= pbox.height / 2;
                        yAdjust -= bbox.height / 2;
                        yAdjust -= bbox.y;
                    } else {
                        xAdjust = pbox.right;
                        xAdjust -= pbox.width / 2;
                        xAdjust -= bbox.width / 2;
                        xAdjust -= bbox.x;
                        yAdjust = pbox[name];
                        yAdjust += dir * parent.getStyle("margin-" + name);
                        yAdjust += dir * children[0].getStyle("margin-" + oppsite[name]);
                    }
                    this.move(children, xAdjust, yAdjust);
                },
                getOrderHint: getOrderHint
            }));
        }
    }
};

//src/layout/filetree.js
_p[39] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Layout = _p.r(20);
        [ -1, 1 ].forEach(registerLayoutForDir);
        function registerLayoutForDir(dir) {
            var name = "filetree-" + (dir > 0 ? "down" : "up");
            Layout.register(name, kity.createClass({
                base: Layout,
                doLayout: function(parent, children, round) {
                    var pBox = parent.getContentBox();
                    var indent = 20;
                    parent.setVertexOut(new kity.Point(pBox.left + indent, dir > 0 ? pBox.bottom : pBox.top));
                    parent.setLayoutVectorOut(new kity.Vector(0, dir));
                    if (!children.length) return;
                    children.forEach(function(child) {
                        var cbox = child.getContentBox();
                        child.setLayoutTransform(new kity.Matrix());
                        child.setVertexIn(new kity.Point(cbox.left, cbox.cy));
                        child.setLayoutVectorIn(new kity.Vector(1, 0));
                    });
                    this.align(children, "left");
                    this.stack(children, "y");
                    var xAdjust = 0;
                    xAdjust += pBox.left;
                    xAdjust += indent;
                    xAdjust += children[0].getStyle("margin-left");
                    var yAdjust = 0;
                    if (dir > 0) {
                        yAdjust += pBox.bottom;
                        yAdjust += parent.getStyle("margin-bottom");
                        yAdjust += children[0].getStyle("margin-top");
                    } else {
                        yAdjust -= this.getTreeBox(children).bottom;
                        yAdjust += pBox.top;
                        yAdjust -= parent.getStyle("margin-top");
                        yAdjust -= children[0].getStyle("margin-bottom");
                    }
                    this.move(children, xAdjust, yAdjust);
                },
                getOrderHint: function(node) {
                    var hint = [];
                    var box = node.getLayoutBox();
                    var offset = node.getLevel() > 1 ? 3 : 5;
                    hint.push({
                        type: "up",
                        node: node,
                        area: new kity.Box({
                            x: box.x,
                            y: box.top - node.getStyle("margin-top") - offset,
                            width: box.width,
                            height: node.getStyle("margin-top")
                        }),
                        path: [ "M", box.x, box.top - offset, "L", box.right, box.top - offset ]
                    });
                    hint.push({
                        type: "down",
                        node: node,
                        area: new kity.Box({
                            x: box.x,
                            y: box.bottom + offset,
                            width: box.width,
                            height: node.getStyle("margin-bottom")
                        }),
                        path: [ "M", box.x, box.bottom + offset, "L", box.right, box.bottom + offset ]
                    });
                    return hint;
                }
            }));
        }
    }
};

//src/layout/fish-bone-master.js
/**
 * @fileOverview
 *
 * 鱼骨图主骨架布局
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[40] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Layout = _p.r(20);
        Layout.register("fish-bone-master", kity.createClass("FishBoneMasterLayout", {
            base: Layout,
            doLayout: function(parent, children, round) {
                var upPart = [], downPart = [];
                var child = children[0];
                var pBox = parent.getContentBox();
                parent.setVertexOut(new kity.Point(pBox.right, pBox.cy));
                parent.setLayoutVectorOut(new kity.Vector(1, 0));
                if (!child) return;
                var cBox = child.getContentBox();
                var pMarginRight = parent.getStyle("margin-right");
                var cMarginLeft = child.getStyle("margin-left");
                var cMarginTop = child.getStyle("margin-top");
                var cMarginBottom = child.getStyle("margin-bottom");
                children.forEach(function(child, index) {
                    child.setLayoutTransform(new kity.Matrix());
                    var cBox = child.getContentBox();
                    if (index % 2) {
                        downPart.push(child);
                        child.setVertexIn(new kity.Point(cBox.left, cBox.top));
                        child.setLayoutVectorIn(new kity.Vector(1, 1));
                    } else {
                        upPart.push(child);
                        child.setVertexIn(new kity.Point(cBox.left, cBox.bottom));
                        child.setLayoutVectorIn(new kity.Vector(1, -1));
                    }
                });
                this.stack(upPart, "x");
                this.stack(downPart, "x");
                this.align(upPart, "bottom");
                this.align(downPart, "top");
                var xAdjust = pBox.right + pMarginRight + cMarginLeft;
                var yAdjustUp = pBox.cy - cMarginBottom - parent.getStyle("margin-top");
                var yAdjustDown = pBox.cy + cMarginTop + parent.getStyle("margin-bottom");
                this.move(upPart, xAdjust, yAdjustUp);
                this.move(downPart, xAdjust + cMarginLeft, yAdjustDown);
            }
        }));
    }
};

//src/layout/fish-bone-slave.js
/**
 * @fileOverview
 *
 *
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[41] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Layout = _p.r(20);
        Layout.register("fish-bone-slave", kity.createClass("FishBoneSlaveLayout", {
            base: Layout,
            doLayout: function(parent, children, round) {
                var layout = this;
                var abs = Math.abs;
                var GOLD_CUT = 1 - .618;
                var pBox = parent.getContentBox();
                var vi = parent.getLayoutVectorIn();
                parent.setLayoutVectorOut(vi);
                var goldX = pBox.left + pBox.width * GOLD_CUT;
                var pout = new kity.Point(goldX, vi.y > 0 ? pBox.bottom : pBox.top);
                parent.setVertexOut(pout);
                var child = children[0];
                if (!child) return;
                var cBox = child.getContentBox();
                children.forEach(function(child, index) {
                    child.setLayoutTransform(new kity.Matrix());
                    child.setLayoutVectorIn(new kity.Vector(1, 0));
                    child.setVertexIn(new kity.Point(cBox.left, cBox.cy));
                });
                this.stack(children, "y");
                this.align(children, "left");
                var xAdjust = 0, yAdjust = 0;
                xAdjust += pout.x;
                if (parent.getLayoutVectorOut().y < 0) {
                    yAdjust -= this.getTreeBox(children).bottom;
                    yAdjust += parent.getContentBox().top;
                    yAdjust -= parent.getStyle("margin-top");
                    yAdjust -= child.getStyle("margin-bottom");
                } else {
                    yAdjust += parent.getContentBox().bottom;
                    yAdjust += parent.getStyle("margin-bottom");
                    yAdjust += child.getStyle("margin-top");
                }
                this.move(children, xAdjust, yAdjust);
                if (round == 2) {
                    children.forEach(function(child) {
                        var m = child.getLayoutTransform();
                        var cbox = child.getContentBox();
                        var pin = m.transformPoint(new kity.Point(cbox.left, 0));
                        layout.move([ child ], abs(pin.y - pout.y), 0);
                    });
                }
            }
        }));
    }
};

//src/layout/mind.js
_p[42] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Layout = _p.r(20);
        var Minder = _p.r(21);
        Layout.register("mind", kity.createClass({
            base: Layout,
            doLayout: function(node, children) {
                var layout = this;
                var half = Math.ceil(node.children.length / 2);
                var right = [];
                var left = [];
                children.forEach(function(child) {
                    if (child.getIndex() < half) right.push(child); else left.push(child);
                });
                var leftLayout = Minder.getLayoutInstance("left");
                var rightLayout = Minder.getLayoutInstance("right");
                leftLayout.doLayout(node, left);
                rightLayout.doLayout(node, right);
                var box = node.getContentBox();
                node.setVertexOut(new kity.Point(box.cx, box.cy));
                node.setLayoutVectorOut(new kity.Vector(0, 0));
            },
            getOrderHint: function(node) {
                var hint = [];
                var box = node.getLayoutBox();
                var offset = 5;
                hint.push({
                    type: "up",
                    node: node,
                    area: new kity.Box({
                        x: box.x,
                        y: box.top - node.getStyle("margin-top") - offset,
                        width: box.width,
                        height: node.getStyle("margin-top")
                    }),
                    path: [ "M", box.x, box.top - offset, "L", box.right, box.top - offset ]
                });
                hint.push({
                    type: "down",
                    node: node,
                    area: new kity.Box({
                        x: box.x,
                        y: box.bottom + offset,
                        width: box.width,
                        height: node.getStyle("margin-bottom")
                    }),
                    path: [ "M", box.x, box.bottom + offset, "L", box.right, box.bottom + offset ]
                });
                return hint;
            }
        }));
    }
};

//src/layout/tianpan.js
/**
 * @fileOverview
 *
 * 天盘模板
 *
 * @author: along
 * @copyright: bpd729@163.com, 2015
 */
_p[43] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Layout = _p.r(20);
        var Minder = _p.r(21);
        Layout.register("tianpan", kity.createClass({
            base: Layout,
            doLayout: function(parent, children) {
                if (children.length == 0) return;
                var layout = this;
                var pbox = parent.getContentBox();
                var x, y, box;
                var _theta = 5;
                var _r = Math.max(pbox.width, 50);
                children.forEach(function(child, index) {
                    child.setLayoutTransform(new kity.Matrix());
                    box = layout.getTreeBox(child);
                    _r = Math.max(Math.max(box.width, box.height), _r);
                });
                _r = _r / 1.5 / Math.PI;
                children.forEach(function(child, index) {
                    x = _r * (Math.cos(_theta) + Math.sin(_theta) * _theta);
                    y = _r * (Math.sin(_theta) - Math.cos(_theta) * _theta);
                    _theta += .9 - index * .02;
                    child.setLayoutVectorIn(new kity.Vector(1, 0));
                    child.setVertexIn(new kity.Point(pbox.cx, pbox.cy));
                    child.setLayoutTransform(new kity.Matrix());
                    layout.move([ child ], x, y);
                });
            },
            getOrderHint: function(node) {
                var hint = [];
                var box = node.getLayoutBox();
                var offset = 5;
                hint.push({
                    type: "up",
                    node: node,
                    area: {
                        x: box.x,
                        y: box.top - node.getStyle("margin-top") - offset,
                        width: box.width,
                        height: node.getStyle("margin-top")
                    },
                    path: [ "M", box.x, box.top - offset, "L", box.right, box.top - offset ]
                });
                hint.push({
                    type: "down",
                    node: node,
                    area: {
                        x: box.x,
                        y: box.bottom + offset,
                        width: box.width,
                        height: node.getStyle("margin-bottom")
                    },
                    path: [ "M", box.x, box.bottom + offset, "L", box.right, box.bottom + offset ]
                });
                return hint;
            }
        }));
    }
};

//src/module/arrange.js
_p[44] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        kity.extendClass(MinderNode, {
            arrange: function(index) {
                var parent = this.parent;
                if (!parent) return;
                var sibling = parent.children;
                if (index < 0 || index >= sibling.length) return;
                sibling.splice(this.getIndex(), 1);
                sibling.splice(index, 0, this);
                return this;
            }
        });
        function asc(nodeA, nodeB) {
            return nodeA.getIndex() - nodeB.getIndex();
        }
        function desc(nodeA, nodeB) {
            return -asc(nodeA, nodeB);
        }
        function canArrange(km) {
            var selected = km.getSelectedNode();
            return selected && selected.parent && selected.parent.children.length > 1;
        }
        /**
     * @command ArrangeUp
     * @description 向上调整选中节点的位置
     * @shortcut Alt + Up
     * @state
     *    0: 当前选中了具有相同父亲的节点
     *   -1: 其它情况
     */
        var ArrangeUpCommand = kity.createClass("ArrangeUpCommand", {
            base: Command,
            execute: function(km) {
                var nodes = km.getSelectedNodes();
                nodes.sort(asc);
                var lastIndexes = nodes.map(function(node) {
                    return node.getIndex();
                });
                nodes.forEach(function(node, index) {
                    node.arrange(lastIndexes[index] - 1);
                });
                km.layout(300);
            },
            queryState: function(km) {
                var selected = km.getSelectedNode();
                return selected ? 0 : -1;
            }
        });
        /**
     * @command ArrangeDown
     * @description 向下调整选中节点的位置
     * @shortcut Alt + Down
     * @state
     *    0: 当前选中了具有相同父亲的节点
     *   -1: 其它情况
     */
        var ArrangeDownCommand = kity.createClass("ArrangeUpCommand", {
            base: Command,
            execute: function(km) {
                var nodes = km.getSelectedNodes();
                nodes.sort(desc);
                var lastIndexes = nodes.map(function(node) {
                    return node.getIndex();
                });
                nodes.forEach(function(node, index) {
                    node.arrange(lastIndexes[index] + 1);
                });
                km.layout(300);
            },
            queryState: function(km) {
                var selected = km.getSelectedNode();
                return selected ? 0 : -1;
            }
        });
        /**
     * @command Arrange
     * @description 调整选中节点的位置
     * @param {number} index 调整后节点的新位置
     * @state
     *    0: 当前选中了具有相同父亲的节点
     *   -1: 其它情况
     */
        var ArrangeCommand = kity.createClass("ArrangeCommand", {
            base: Command,
            execute: function(km, index) {
                var nodes = km.getSelectedNodes().slice();
                if (!nodes.length) return;
                var ancestor = MinderNode.getCommonAncestor(nodes);
                if (ancestor != nodes[0].parent) return;
                var indexed = nodes.map(function(node) {
                    return {
                        index: node.getIndex(),
                        node: node
                    };
                });
                var asc = Math.min.apply(Math, indexed.map(function(one) {
                    return one.index;
                })) >= index;
                indexed.sort(function(a, b) {
                    return asc ? b.index - a.index : a.index - b.index;
                });
                indexed.forEach(function(one) {
                    one.node.arrange(index);
                });
                km.layout(300);
            },
            queryState: function(km) {
                var selected = km.getSelectedNode();
                return selected ? 0 : -1;
            }
        });
        Module.register("ArrangeModule", {
            commands: {
                arrangeup: ArrangeUpCommand,
                arrangedown: ArrangeDownCommand,
                arrange: ArrangeCommand
            },
            contextmenu: [ {
                command: "arrangeup"
            }, {
                command: "arrangedown"
            }, {
                divider: true
            } ],
            commandShortcutKeys: {
                arrangeup: "normal::alt+Up",
                arrangedown: "normal::alt+Down"
            }
        });
    }
};

//src/module/basestyle.js
_p[45] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var TextRenderer = _p.r(65);
        Module.register("basestylemodule", function() {
            var km = this;
            function getNodeDataOrStyle(node, name) {
                return node.getData(name) || node.getStyle(name);
            }
            TextRenderer.registerStyleHook(function(node, textGroup) {
                var fontWeight = getNodeDataOrStyle(node, "font-weight");
                var fontStyle = getNodeDataOrStyle(node, "font-style");
                var styleHash = [ fontWeight, fontStyle ].join("/");
                textGroup.eachItem(function(index, item) {
                    item.setFont({
                        weight: fontWeight,
                        style: fontStyle
                    });
                });
            });
            return {
                commands: {
                    /**
                 * @command Bold
                 * @description 加粗选中的节点
                 * @shortcut Ctrl + B
                 * @state
                 *   0: 当前有选中的节点
                 *  -1: 当前没有选中的节点
                 *   1: 当前已选中的节点已加粗
                 */
                    bold: kity.createClass("boldCommand", {
                        base: Command,
                        execute: function(km) {
                            var nodes = km.getSelectedNodes();
                            if (this.queryState("bold") == 1) {
                                nodes.forEach(function(n) {
                                    n.setData("font-weight").render();
                                });
                            } else {
                                nodes.forEach(function(n) {
                                    n.setData("font-weight", "bold").render();
                                });
                            }
                            km.layout();
                        },
                        queryState: function() {
                            var nodes = km.getSelectedNodes(), result = 0;
                            if (nodes.length === 0) {
                                return -1;
                            }
                            nodes.forEach(function(n) {
                                if (n && n.getData("font-weight")) {
                                    result = 1;
                                    return false;
                                }
                            });
                            return result;
                        }
                    }),
                    /**
                 * @command Italic
                 * @description 加斜选中的节点
                 * @shortcut Ctrl + I
                 * @state
                 *   0: 当前有选中的节点
                 *  -1: 当前没有选中的节点
                 *   1: 当前已选中的节点已加斜
                 */
                    italic: kity.createClass("italicCommand", {
                        base: Command,
                        execute: function(km) {
                            var nodes = km.getSelectedNodes();
                            if (this.queryState("italic") == 1) {
                                nodes.forEach(function(n) {
                                    n.setData("font-style").render();
                                });
                            } else {
                                nodes.forEach(function(n) {
                                    n.setData("font-style", "italic").render();
                                });
                            }
                            km.layout();
                        },
                        queryState: function() {
                            var nodes = km.getSelectedNodes(), result = 0;
                            if (nodes.length === 0) {
                                return -1;
                            }
                            nodes.forEach(function(n) {
                                if (n && n.getData("font-style")) {
                                    result = 1;
                                    return false;
                                }
                            });
                            return result;
                        }
                    })
                },
                commandShortcutKeys: {
                    bold: "ctrl+b",
                    //bold
                    italic: "ctrl+i"
                }
            };
        });
    }
};

//src/module/clipboard.js
_p[46] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        Module.register("ClipboardModule", function() {
            var km = this, _clipboardNodes = [], _selectedNodes = [];
            function appendChildNode(parent, child) {
                _selectedNodes.push(child);
                km.appendNode(child, parent);
                child.render();
                child.setLayoutOffset(null);
                var children = child.children.map(function(node) {
                    return node.clone();
                });
                /*
            * fixed bug: Modified on 2015.08.05
            * 原因：粘贴递归 append 时没有清空原来父节点的子节点，而父节点被复制的时候，是连同子节点一起复制过来的
            * 解决办法：增加了下面这一行代码
            * by: @zhangbobell zhangbobell@163.com
            */
                child.clearChildren();
                for (var i = 0, ci; ci = children[i]; i++) {
                    appendChildNode(child, ci);
                }
            }
            function sendToClipboard(nodes) {
                if (!nodes.length) return;
                nodes.sort(function(a, b) {
                    return a.getIndex() - b.getIndex();
                });
                _clipboardNodes = nodes.map(function(node) {
                    return node.clone();
                });
            }
            /**
         * @command Copy
         * @description 复制当前选中的节点
         * @shortcut Ctrl + C
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
            var CopyCommand = kity.createClass("CopyCommand", {
                base: Command,
                execute: function(km) {
                    sendToClipboard(km.getSelectedAncestors(true));
                    this.setContentChanged(false);
                }
            });
            /**
         * @command Cut
         * @description 剪切当前选中的节点
         * @shortcut Ctrl + X
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
            var CutCommand = kity.createClass("CutCommand", {
                base: Command,
                execute: function(km) {
                    var ancestors = km.getSelectedAncestors();
                    if (ancestors.length === 0) return;
                    sendToClipboard(ancestors);
                    km.select(MinderNode.getCommonAncestor(ancestors), true);
                    ancestors.slice().forEach(function(node) {
                        km.removeNode(node);
                    });
                    km.layout(300);
                }
            });
            /**
         * @command Paste
         * @description 粘贴已复制的节点到每一个当前选中的节点上
         * @shortcut Ctrl + V
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
            var PasteCommand = kity.createClass("PasteCommand", {
                base: Command,
                execute: function(km) {
                    if (_clipboardNodes.length) {
                        var nodes = km.getSelectedNodes();
                        if (!nodes.length) return;
                        for (var i = 0, ni; ni = _clipboardNodes[i]; i++) {
                            for (var j = 0, node; node = nodes[j]; j++) {
                                appendChildNode(node, ni.clone());
                            }
                        }
                        km.select(_selectedNodes, true);
                        _selectedNodes = [];
                        km.layout(300);
                    }
                },
                queryState: function(km) {
                    return km.getSelectedNode() ? 0 : -1;
                }
            });
            /**
         * @Desc: 若支持原生clipboadr事件则基于原生扩展，否则使用km的基础事件只处理节点的粘贴复制
         * @Editor: Naixor
         * @Date: 2015.9.20
         */
            if (km.supportClipboardEvent && !kity.Browser.gecko) {
                var Copy = function(e) {
                    this.fire("beforeCopy", e);
                };
                var Cut = function(e) {
                    this.fire("beforeCut", e);
                };
                var Paste = function(e) {
                    this.fire("beforePaste", e);
                };
                return {
                    commands: {
                        copy: CopyCommand,
                        cut: CutCommand,
                        paste: PasteCommand
                    },
                    clipBoardEvents: {
                        copy: Copy.bind(km),
                        cut: Cut.bind(km),
                        paste: Paste.bind(km)
                    },
                    sendToClipboard: sendToClipboard
                };
            } else {
                return {
                    commands: {
                        copy: CopyCommand,
                        cut: CutCommand,
                        paste: PasteCommand
                    },
                    commandShortcutKeys: {
                        copy: "normal::ctrl+c|",
                        cut: "normal::ctrl+x",
                        paste: "normal::ctrl+v"
                    },
                    sendToClipboard: sendToClipboard
                };
            }
        });
    }
};

//src/module/dragtree.js
_p[47] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        // 矩形的变形动画定义
        var MoveToParentCommand = kity.createClass("MoveToParentCommand", {
            base: Command,
            execute: function(minder, nodes, parent) {
                var node;
                for (var i = 0; i < nodes.length; i++) {
                    node = nodes[i];
                    if (node.parent) {
                        node.parent.removeChild(node);
                        parent.appendChild(node);
                        node.render();
                    }
                }
                parent.expand();
                minder.select(nodes, true);
            }
        });
        var DropHinter = kity.createClass("DropHinter", {
            base: kity.Group,
            constructor: function() {
                this.callBase();
                this.rect = new kity.Rect();
                this.addShape(this.rect);
            },
            render: function(target) {
                this.setVisible(!!target);
                if (target) {
                    this.rect.setBox(target.getLayoutBox()).setRadius(target.getStyle("radius") || 0).stroke(target.getStyle("drop-hint-color") || "yellow", target.getStyle("drop-hint-width") || 2);
                    this.bringTop();
                }
            }
        });
        var OrderHinter = kity.createClass("OrderHinter", {
            base: kity.Group,
            constructor: function() {
                this.callBase();
                this.area = new kity.Rect();
                this.path = new kity.Path();
                this.addShapes([ this.area, this.path ]);
            },
            render: function(hint) {
                this.setVisible(!!hint);
                if (hint) {
                    this.area.setBox(hint.area);
                    this.area.fill(hint.node.getStyle("order-hint-area-color") || "rgba(0, 255, 0, .5)");
                    this.path.setPathData(hint.path);
                    this.path.stroke(hint.node.getStyle("order-hint-path-color") || "#0f0", hint.node.getStyle("order-hint-path-width") || 1);
                }
            }
        });
        // 对拖动对象的一个替代盒子，控制整个拖放的逻辑，包括：
        //    1. 从节点列表计算出拖动部分
        //    2. 计算可以 drop 的节点，产生 drop 交互提示
        var TreeDragger = kity.createClass("TreeDragger", {
            constructor: function(minder) {
                this._minder = minder;
                this._dropHinter = new DropHinter();
                this._orderHinter = new OrderHinter();
                minder.getRenderContainer().addShapes([ this._dropHinter, this._orderHinter ]);
            },
            dragStart: function(position) {
                // 只记录开始位置，不马上开启拖放模式
                // 这个位置同时是拖放范围收缩时的焦点位置（中心）
                this._startPosition = position;
            },
            dragMove: function(position) {
                // 启动拖放模式需要最小的移动距离
                var DRAG_MOVE_THRESHOLD = 10;
                if (!this._startPosition) return;
                var movement = kity.Vector.fromPoints(this._dragPosition || this._startPosition, position);
                var minder = this._minder;
                this._dragPosition = position;
                if (!this._dragMode) {
                    // 判断拖放模式是否该启动
                    if (kity.Vector.fromPoints(this._dragPosition, this._startPosition).length() < DRAG_MOVE_THRESHOLD) {
                        return;
                    }
                    if (!this._enterDragMode()) {
                        return;
                    }
                }
                for (var i = 0; i < this._dragSources.length; i++) {
                    this._dragSources[i].setLayoutOffset(this._dragSources[i].getLayoutOffset().offset(movement));
                    minder.applyLayoutResult(this._dragSources[i]);
                }
                if (!this._dropTest()) {
                    this._orderTest();
                } else {
                    this._renderOrderHint(this._orderSucceedHint = null);
                }
            },
            dragEnd: function() {
                this._startPosition = null;
                this._dragPosition = null;
                if (!this._dragMode) {
                    return;
                }
                this._fadeDragSources(1);
                if (this._dropSucceedTarget) {
                    this._dragSources.forEach(function(source) {
                        source.setLayoutOffset(null);
                    });
                    this._minder.layout(-1);
                    this._minder.execCommand("movetoparent", this._dragSources, this._dropSucceedTarget);
                } else if (this._orderSucceedHint) {
                    var hint = this._orderSucceedHint;
                    var index = hint.node.getIndex();
                    var sourceIndexes = this._dragSources.map(function(source) {
                        // 顺便干掉布局偏移
                        source.setLayoutOffset(null);
                        return source.getIndex();
                    });
                    var maxIndex = Math.max.apply(Math, sourceIndexes);
                    var minIndex = Math.min.apply(Math, sourceIndexes);
                    if (index < minIndex && hint.type == "down") index++;
                    if (index > maxIndex && hint.type == "up") index--;
                    hint.node.setLayoutOffset(null);
                    this._minder.execCommand("arrange", index);
                    this._renderOrderHint(null);
                } else {
                    this._minder.fire("savescene");
                }
                this._minder.layout(300);
                this._leaveDragMode();
                this._minder.fire("contentchange");
            },
            // 进入拖放模式：
            //    1. 计算拖放源和允许的拖放目标
            //    2. 标记已启动
            _enterDragMode: function() {
                this._calcDragSources();
                if (!this._dragSources.length) {
                    this._startPosition = null;
                    return false;
                }
                this._fadeDragSources(.5);
                this._calcDropTargets();
                this._calcOrderHints();
                this._dragMode = true;
                this._minder.setStatus("dragtree");
                return true;
            },
            // 从选中的节点计算拖放源
            //    并不是所有选中的节点都作为拖放源，如果选中节点中存在 A 和 B，
            //    并且 A 是 B 的祖先，则 B 不作为拖放源
            //
            //    计算过程：
            //       1. 将节点按照树高排序，排序后只可能是前面节点是后面节点的祖先
            //       2. 从后往前枚举排序的结果，如果发现枚举目标之前存在其祖先，
            //          则排除枚举目标作为拖放源，否则加入拖放源
            _calcDragSources: function() {
                this._dragSources = this._minder.getSelectedAncestors();
            },
            _fadeDragSources: function(opacity) {
                var minder = this._minder;
                this._dragSources.forEach(function(source) {
                    source.getRenderContainer().setOpacity(opacity, 200);
                    source.traverse(function(node) {
                        if (opacity < 1) {
                            minder.detachNode(node);
                        } else {
                            minder.attachNode(node);
                        }
                    }, true);
                });
            },
            // 计算拖放目标可以释放的节点列表（释放意味着成为其子树），存在这条限制规则：
            //    - 不能拖放到拖放目标的子树上（允许拖放到自身，因为多选的情况下可以把其它节点加入）
            //
            //    1. 加入当前节点（初始为根节点）到允许列表
            //    2. 对于当前节点的每一个子节点：
            //       (1) 如果是拖放目标的其中一个节点，忽略（整棵子树被剪枝）
            //       (2) 如果不是拖放目标之一，以当前子节点为当前节点，回到 1 计算
            //    3. 返回允许列表
            //
            _calcDropTargets: function() {
                function findAvailableParents(nodes, root) {
                    var availables = [], i;
                    availables.push(root);
                    root.getChildren().forEach(function(test) {
                        for (i = 0; i < nodes.length; i++) {
                            if (nodes[i] == test) return;
                        }
                        availables = availables.concat(findAvailableParents(nodes, test));
                    });
                    return availables;
                }
                this._dropTargets = findAvailableParents(this._dragSources, this._minder.getRoot());
                this._dropTargetBoxes = this._dropTargets.map(function(source) {
                    return source.getLayoutBox();
                });
            },
            _calcOrderHints: function() {
                var sources = this._dragSources;
                var ancestor = MinderNode.getCommonAncestor(sources);
                // 只有一个元素选中，公共祖先是其父
                if (ancestor == sources[0]) ancestor = sources[0].parent;
                if (sources.length === 0 || ancestor != sources[0].parent) {
                    this._orderHints = [];
                    return;
                }
                var siblings = ancestor.children;
                this._orderHints = siblings.reduce(function(hint, sibling) {
                    if (sources.indexOf(sibling) == -1) {
                        hint = hint.concat(sibling.getOrderHint());
                    }
                    return hint;
                }, []);
            },
            _leaveDragMode: function() {
                this._dragMode = false;
                this._dropSucceedTarget = null;
                this._orderSucceedHint = null;
                this._renderDropHint(null);
                this._renderOrderHint(null);
                this._minder.rollbackStatus();
            },
            _drawForDragMode: function() {
                this._text.setContent(this._dragSources.length + " items");
                this._text.setPosition(this._startPosition.x, this._startPosition.y + 5);
                this._minder.getRenderContainer().addShape(this);
            },
            /**
         * 通过 judge 函数判断 targetBox 和 sourceBox 的位置交叉关系
         * @param targets -- 目标节点
         * @param targetBoxMapper -- 目标节点与对应 Box 的映射关系
         * @param judge -- 判断函数
         * @returns {*}
         * @private
         */
            _boxTest: function(targets, targetBoxMapper, judge) {
                var sourceBoxes = this._dragSources.map(function(source) {
                    return source.getLayoutBox();
                });
                var i, j, target, sourceBox, targetBox;
                judge = judge || function(intersectBox, sourceBox, targetBox) {
                    return intersectBox && !intersectBox.isEmpty();
                };
                for (i = 0; i < targets.length; i++) {
                    target = targets[i];
                    targetBox = targetBoxMapper.call(this, target, i);
                    for (j = 0; j < sourceBoxes.length; j++) {
                        sourceBox = sourceBoxes[j];
                        var intersectBox = sourceBox.intersect(targetBox);
                        if (judge(intersectBox, sourceBox, targetBox)) {
                            return target;
                        }
                    }
                }
                return null;
            },
            _dropTest: function() {
                this._dropSucceedTarget = this._boxTest(this._dropTargets, function(target, i) {
                    return this._dropTargetBoxes[i];
                }, function(intersectBox, sourceBox, targetBox) {
                    function area(box) {
                        return box.width * box.height;
                    }
                    if (!intersectBox) return false;
                    /*
                * Added by zhangbobell, 2015.9.8
                *
                * 增加了下面一行判断，修复了循环比较中 targetBox 为折叠节点时，intersetBox 面积为 0，
                * 而 targetBox 的 width 和 height 均为 0
                * 此时造成了满足以下的第二个条件而返回 true
                * */
                    if (!area(intersectBox)) return false;
                    // 面积判断，交叉面积大于其中的一半
                    if (area(intersectBox) > .5 * Math.min(area(sourceBox), area(targetBox))) return true;
                    // 有一个边完全重合的情况，也认为两个是交叉的
                    if (intersectBox.width + 1 >= Math.min(sourceBox.width, targetBox.width)) return true;
                    if (intersectBox.height + 1 >= Math.min(sourceBox.height, targetBox.height)) return true;
                    return false;
                });
                this._renderDropHint(this._dropSucceedTarget);
                return !!this._dropSucceedTarget;
            },
            _orderTest: function() {
                this._orderSucceedHint = this._boxTest(this._orderHints, function(hint) {
                    return hint.area;
                });
                this._renderOrderHint(this._orderSucceedHint);
                return !!this._orderSucceedHint;
            },
            _renderDropHint: function(target) {
                this._dropHinter.render(target);
            },
            _renderOrderHint: function(hint) {
                this._orderHinter.render(hint);
            },
            preventDragMove: function() {
                this._startPosition = null;
            }
        });
        Module.register("DragTree", function() {
            var dragger;
            return {
                init: function() {
                    dragger = new TreeDragger(this);
                    window.addEventListener("mouseup", function() {
                        dragger.dragEnd();
                    });
                },
                events: {
                    "normal.mousedown inputready.mousedown": function(e) {
                        // 单选中根节点也不触发拖拽
                        if (e.originEvent.button) return;
                        if (e.getTargetNode() && e.getTargetNode() != this.getRoot()) {
                            dragger.dragStart(e.getPosition());
                        }
                    },
                    "normal.mousemove dragtree.mousemove": function(e) {
                        dragger.dragMove(e.getPosition());
                    },
                    "normal.mouseup dragtree.beforemouseup": function(e) {
                        dragger.dragEnd();
                        //e.stopPropagation();
                        e.preventDefault();
                    },
                    statuschange: function(e) {
                        if (e.lastStatus == "textedit" && e.currentStatus == "normal") {
                            dragger.preventDragMove();
                        }
                    }
                },
                commands: {
                    movetoparent: MoveToParentCommand
                }
            };
        });
    }
};

//src/module/expand.js
_p[48] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var keymap = _p.r(17);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("Expand", function() {
            var minder = this;
            var EXPAND_STATE_DATA = "expandState", STATE_EXPAND = "expand", STATE_COLLAPSE = "collapse";
            // 将展开的操作和状态读取接口拓展到 MinderNode 上
            kity.extendClass(MinderNode, {
                /**
             * 展开节点
             * @param  {Policy} policy 展开的策略，默认为 KEEP_STATE
             */
                expand: function() {
                    this.setData(EXPAND_STATE_DATA, STATE_EXPAND);
                    return this;
                },
                /**
             * 收起节点
             */
                collapse: function() {
                    this.setData(EXPAND_STATE_DATA, STATE_COLLAPSE);
                    return this;
                },
                /**
             * 判断节点当前的状态是否为展开
             */
                isExpanded: function() {
                    var expanded = this.getData(EXPAND_STATE_DATA) !== STATE_COLLAPSE;
                    return expanded && (this.isRoot() || this.parent.isExpanded());
                },
                /**
             * 判断节点当前的状态是否为收起
             */
                isCollapsed: function() {
                    return !this.isExpanded();
                }
            });
            /**
         * @command Expand
         * @description 展开当前选中的节点，保证其可见
         * @param {bool} justParents 是否只展开到父亲
         *     * `false` - （默认）保证选中的节点以及其子树可见
         *     * `true` - 只保证选中的节点可见，不展开其子树
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
            var ExpandCommand = kity.createClass("ExpandCommand", {
                base: Command,
                execute: function(km, justParents) {
                    var node = km.getSelectedNode();
                    if (!node) return;
                    if (justParents) {
                        node = node.parent;
                    }
                    while (node.parent) {
                        node.expand();
                        node = node.parent;
                    }
                    node.renderTree();
                    km.layout(100);
                },
                queryState: function(km) {
                    var node = km.getSelectedNode();
                    return node && !node.isRoot() && !node.isExpanded() ? 0 : -1;
                }
            });
            /**
         * @command ExpandToLevel
         * @description 展开脑图到指定的层级
         * @param {number} level 指定展开到的层级，最少值为 1。
         * @state
         *   0: 一直可用
         */
            var ExpandToLevelCommand = kity.createClass("ExpandToLevelCommand", {
                base: Command,
                execute: function(km, level) {
                    km.getRoot().traverse(function(node) {
                        if (node.getLevel() < level) node.expand();
                        if (node.getLevel() == level && !node.isLeaf()) node.collapse();
                    });
                    km.refresh(100);
                },
                enableReadOnly: true
            });
            /**
         * @command Collapse
         * @description 收起当前节点的子树
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         */
            var CollapseCommand = kity.createClass("CollapseCommand", {
                base: Command,
                execute: function(km) {
                    var node = km.getSelectedNode();
                    if (!node) return;
                    node.collapse();
                    node.renderTree();
                    km.layout();
                },
                queryState: function(km) {
                    var node = km.getSelectedNode();
                    return node && !node.isRoot() && node.isExpanded() ? 0 : -1;
                }
            });
            var Expander = kity.createClass("Expander", {
                base: kity.Group,
                constructor: function(node) {
                    this.callBase();
                    this.radius = 6;
                    this.outline = new kity.Circle(this.radius).stroke("gray").fill("white");
                    this.sign = new kity.Path().stroke("gray");
                    this.addShapes([ this.outline, this.sign ]);
                    this.initEvent(node);
                    this.setId(utils.uuid("node_expander"));
                    this.setStyle("cursor", "pointer");
                },
                initEvent: function(node) {
                    this.on("mousedown", function(e) {
                        minder.select([ node ], true);
                        if (node.isExpanded()) {
                            node.collapse();
                        } else {
                            node.expand();
                        }
                        node.renderTree().getMinder().layout(100);
                        node.getMinder().fire("contentchange");
                        e.stopPropagation();
                        e.preventDefault();
                    });
                    this.on("dblclick click mouseup", function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                    });
                },
                setState: function(state) {
                    if (state == "hide") {
                        this.setVisible(false);
                        return;
                    }
                    this.setVisible(true);
                    var pathData = [ "M", 1.5 - this.radius, 0, "L", this.radius - 1.5, 0 ];
                    if (state == STATE_COLLAPSE) {
                        pathData.push([ "M", 0, 1.5 - this.radius, "L", 0, this.radius - 1.5 ]);
                    }
                    this.sign.setPathData(pathData);
                }
            });
            var ExpanderRenderer = kity.createClass("ExpanderRenderer", {
                base: Renderer,
                create: function(node) {
                    if (node.isRoot()) return;
                    this.expander = new Expander(node);
                    node.getRenderContainer().prependShape(this.expander);
                    node.expanderRenderer = this;
                    this.node = node;
                    return this.expander;
                },
                shouldRender: function(node) {
                    return !node.isRoot();
                },
                update: function(expander, node, box) {
                    if (!node.parent) return;
                    var visible = node.parent.isExpanded();
                    expander.setState(visible && node.children.length ? node.getData(EXPAND_STATE_DATA) : "hide");
                    var vector = node.getLayoutVectorIn().normalize(expander.radius + node.getStyle("stroke-width"));
                    var position = node.getVertexIn().offset(vector.reverse());
                    this.expander.setTranslate(position);
                }
            });
            return {
                commands: {
                    expand: ExpandCommand,
                    expandtolevel: ExpandToLevelCommand,
                    collapse: CollapseCommand
                },
                events: {
                    layoutapply: function(e) {
                        var r = e.node.getRenderer("ExpanderRenderer");
                        if (r.getRenderShape()) {
                            r.update(r.getRenderShape(), e.node);
                        }
                    },
                    beforerender: function(e) {
                        var node = e.node;
                        var visible = !node.parent || node.parent.isExpanded();
                        var minder = this;
                        node.getRenderContainer().setVisible(visible);
                        if (!visible) e.stopPropagation();
                    },
                    "normal.keydown": function(e) {
                        if (this.getStatus() == "textedit") return;
                        if (e.originEvent.keyCode == keymap["/"]) {
                            var node = this.getSelectedNode();
                            if (!node || node == this.getRoot()) return;
                            var expanded = node.isExpanded();
                            this.getSelectedNodes().forEach(function(node) {
                                if (expanded) node.collapse(); else node.expand();
                                node.renderTree();
                            });
                            this.layout(100);
                            this.fire("contentchange");
                            e.preventDefault();
                            e.stopPropagationImmediately();
                        }
                        if (e.isShortcutKey("Alt+`")) {
                            this.execCommand("expandtolevel", 9999);
                        }
                        for (var i = 1; i < 6; i++) {
                            if (e.isShortcutKey("Alt+" + i)) {
                                this.execCommand("expandtolevel", i);
                            }
                        }
                    }
                },
                renderers: {
                    outside: ExpanderRenderer
                },
                contextmenu: [ {
                    command: "expandtoleaf",
                    query: function() {
                        return !minder.getSelectedNode();
                    },
                    fn: function(minder) {
                        minder.execCommand("expandtolevel", 9999);
                    }
                }, {
                    command: "expandtolevel1",
                    query: function() {
                        return !minder.getSelectedNode();
                    },
                    fn: function(minder) {
                        minder.execCommand("expandtolevel", 1);
                    }
                }, {
                    command: "expandtolevel2",
                    query: function() {
                        return !minder.getSelectedNode();
                    },
                    fn: function(minder) {
                        minder.execCommand("expandtolevel", 2);
                    }
                }, {
                    command: "expandtolevel3",
                    query: function() {
                        return !minder.getSelectedNode();
                    },
                    fn: function(minder) {
                        minder.execCommand("expandtolevel", 3);
                    }
                }, {
                    divider: true
                } ]
            };
        });
    }
};

//src/module/flag.js
_p[49] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        var ImageSZ = {
            width: 30,
            height: 30
        };
        // var LeaderLine = _p.r(5).LeaderLine;
        // var TestLineFun = function() {
        //     // startElement = document.getElementById('minder_node3'),
        //     //获取指定节点的Element
        //     var startElement = document.getElementById(km.getSelectedNode().rc.getId()),
        //         //startPlug: 'disc', endPlug: 'disc'
        //         line = new LeaderLine(startElement, document.getElementById('minder_node4'), { color: '#009143', size: 1.5, dash: true, endPlugSize: 2 });
        //     // var p1 = document.getElementById('ex-020-p1'),
        //     //     p2 = document.getElementById('ex-020-p2'),
        //     //     line1 = document.getElementById('ex-020-line-1'),
        //     //     line2 = document.getElementById('ex-020-line-2');
        //     // var p_svg = document.getElementById('kity_svg_6'),
        // }
        /*
    
    //linLine Demo
    var a = document.getElementById("minder_node3")
    var b = document.getElementById("minder_node4")
    new LeaderLine(a, b)

    */
        Module.register("flag", function() {
            function loadImageSize(url, callback) {
                var img = document.createElement("img");
                img.onload = function() {
                    callback(ImageSZ.width, ImageSZ.height);
                };
                img.onerror = function() {
                    callback(null);
                };
                img.src = url;
            }
            function fitImageSize(width, height, maxWidth, maxHeight) {
                var ratio = width / height, fitRatio = maxWidth / maxHeight;
                // 宽高比大于最大尺寸的宽高比，以宽度为标准适应
                if (width > maxWidth && ratio > fitRatio) {
                    width = maxWidth;
                    height = width / ratio;
                } else if (height > maxHeight) {
                    height = maxHeight;
                    width = height * ratio;
                }
                return {
                    width: width | 0,
                    height: height | 0
                };
            }
            /**
         * @command Image
         * @description 为选中的节点添加图片
         * @param {string} url 图片的 URL，设置为 null 移除
         * @param {string} title 图片的说明
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         * @return 返回首个选中节点的图片信息，JSON 对象： `{url: url, title: title}`
         */
            var ImageCommand = kity.createClass("ImageCommand", {
                base: Command,
                execute: function(km, url, title) {
                    var nodes = km.getSelectedNodes();
                    loadImageSize(url, function(width, height) {
                        nodes.forEach(function(n) {
                            var size = fitImageSize(width, height, km.getOption("maxImageWidth"), km.getOption("maxImageHeight"));
                            n.setData("flag", url);
                            n.setData("flagTitle", url && title);
                            // n.setData('imageSize', url && size);
                            n.render();
                        });
                        km.fire("saveScene");
                        km.layout(300);
                    });
                },
                queryState: function(km) {
                    var nodes = km.getSelectedNodes(), result = 0;
                    if (nodes.length === 0) {
                        return -1;
                    }
                    nodes.forEach(function(n) {
                        if (n && n.getData("flag")) {
                            result = 0;
                            return false;
                        }
                    });
                    return result;
                },
                queryValue: function(km) {
                    var node = km.getSelectedNode();
                    return node ? {
                        url: node.getData("flag"),
                        title: node.getData("flagTitle")
                    } : undefined;
                }
            });
            var ImageRenderer = kity.createClass("ImageRenderer", {
                base: Renderer,
                create: function(node) {
                    return new kity.Image(node.getData("flag"));
                },
                shouldRender: function(node) {
                    return node.getData("flag");
                },
                update: function(image, node, box) {
                    var url = node.getData("flag");
                    var title = node.getData("flagTitle");
                    var size = ImageSZ;
                    var spaceTop = node.getStyle("space-top");
                    if (!size) return;
                    if (title) {
                        image.node.setAttributeNS("http://www.w3.org/1999/xlink", "title", title);
                    }
                    var x = box.cx - size.width / 2;
                    var y = box.y - size.height - spaceTop;
                    image.setUrl(url).setX(x | 0).setY(y | 0).setWidth(size.width | 0).setHeight(size.height | 0);
                    return new kity.Box(x | 0, y | 0, size.width | 0, size.height | 0);
                }
            });
            // 图标的图形
            var FlagIcon = kity.createClass("FlagIcon", {
                base: kity.Group,
                constructor: function(node) {
                    this.callBase();
                    this.setSize(30);
                    this.create(node);
                    this.setId(utils.uuid("node_flag"));
                },
                setSize: function(size) {
                    this.width = this.height = size;
                },
                create: function(node) {
                    var flag = new kity.Image(node.getData("flag"));
                    flag.setWidth(this.width | 0);
                    flag.setHeight(this.height | 0);
                    this.addShapes([ flag ]);
                    this.flag = flag;
                }
            });
            return {
                commands: {
                    flag: ImageCommand
                },
                renderers: {
                    left: kity.createClass("ImageRenderer", {
                        base: Renderer,
                        create: function(node) {
                            // try {
                            //     setTimeout(() => {
                            //         /*test line*/
                            //         var startElement = document.getElementById('minder_node3');
                            //         //获取指定节点的Element
                            //         // var startElement = document.getElementById(km.getSelectedNode().rc.getId());
                            //         //startPlug: 'disc', endPlug: 'disc'
                            //         var line = new LeaderLine(startElement, document.getElementById('minder_node4'), { color: '#009143', size: 1.5, dash: true, endPlugSize: 2 });
                            //         //拖拽Node并移动
                            //         var lineEventType = ['mousedown', 'mousemove'];
                            //         lineEventType.forEach(function(item, index) {
                            //             document.getElementById("minder_node3").addEventListener(item, (event) => {
                            //                 if (event.type == lineEventType[0]) {
                            //                     line._drag_ = true;
                            //                 }
                            //                 if (line._drag_) {
                            //                     line.position();
                            //                 }
                            //             });
                            //         });
                            //         //停止拖拽
                            //         document.getElementById("minder_node3").addEventListener("mouseup", (event) => {
                            //             if (line._drag_) {
                            //                 line._drag_ = false;
                            //             }
                            //         });
                            //     }, 800);
                            // } catch (error) {
                            //     console.log("zhhlog:ImageRenderer:error:" + error);
                            // }
                            return new FlagIcon(node);
                        },
                        shouldRender: function(node) {
                            return node.getData("flag");
                        },
                        update: function(icon, node, box) {
                            var data = node.getData("flag");
                            var spaceLeft = node.getStyle("space-left"), x, y;
                            // icon.setValue(data);
                            x = box.left - icon.width - spaceLeft;
                            y = -icon.height / 2;
                            icon.setTranslate(x, y);
                            return new kity.Box({
                                x: x,
                                y: y,
                                width: icon.width,
                                height: icon.height
                            });
                        }
                    })
                }
            };
        });
    }
};

//src/module/font.js
_p[50] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var TextRenderer = _p.r(65);
        function getNodeDataOrStyle(node, name) {
            return node.getData(name) || node.getStyle(name);
        }
        TextRenderer.registerStyleHook(function(node, textGroup) {
            var dataColor = node.getData("color");
            var selectedColor = node.getStyle("selected-color");
            var styleColor = node.getStyle("color");
            var foreColor = dataColor || (node.isSelected() && selectedColor ? selectedColor : styleColor);
            var fontFamily = getNodeDataOrStyle(node, "font-family");
            var fontSize = getNodeDataOrStyle(node, "font-size");
            textGroup.fill(foreColor);
            textGroup.eachItem(function(index, item) {
                item.setFont({
                    family: fontFamily,
                    size: fontSize
                });
            });
        });
        Module.register("fontmodule", {
            commands: {
                /**
             * @command ForeColor
             * @description 设置选中节点的字体颜色
             * @param {string} color 表示颜色的字符串
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             * @return 如果只有一个节点选中，返回已选中节点的字体颜色；否则返回 'mixed'。
             */
                forecolor: kity.createClass("fontcolorCommand", {
                    base: Command,
                    execute: function(km, color) {
                        var nodes = km.getSelectedNodes();
                        nodes.forEach(function(n) {
                            n.setData("color", color);
                            n.render();
                        });
                    },
                    queryState: function(km) {
                        return km.getSelectedNodes().length === 0 ? -1 : 0;
                    },
                    queryValue: function(km) {
                        if (km.getSelectedNodes().length == 1) {
                            return km.getSelectedNodes()[0].getData("color");
                        }
                        return "mixed";
                    }
                }),
                /**
             * @command Background
             * @description 设置选中节点的背景颜色
             * @param {string} color 表示颜色的字符串
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             * @return 如果只有一个节点选中，返回已选中节点的背景颜色；否则返回 'mixed'。
             */
                background: kity.createClass("backgroudCommand", {
                    base: Command,
                    execute: function(km, color) {
                        var nodes = km.getSelectedNodes();
                        nodes.forEach(function(n) {
                            n.setData("background", color);
                            n.render();
                        });
                    },
                    queryState: function(km) {
                        return km.getSelectedNodes().length === 0 ? -1 : 0;
                    },
                    queryValue: function(km) {
                        if (km.getSelectedNodes().length == 1) {
                            return km.getSelectedNodes()[0].getData("background");
                        }
                        return "mixed";
                    }
                }),
                /**
             * @command FontFamily
             * @description 设置选中节点的字体
             * @param {string} family 表示字体的字符串
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             * @return 返回首个选中节点的字体
             */
                fontfamily: kity.createClass("fontfamilyCommand", {
                    base: Command,
                    execute: function(km, family) {
                        var nodes = km.getSelectedNodes();
                        nodes.forEach(function(n) {
                            n.setData("font-family", family);
                            n.render();
                            km.layout();
                        });
                    },
                    queryState: function(km) {
                        return km.getSelectedNodes().length === 0 ? -1 : 0;
                    },
                    queryValue: function(km) {
                        var node = km.getSelectedNode();
                        if (node) return node.getData("font-family");
                        return null;
                    }
                }),
                /**
             * @command FontSize
             * @description 设置选中节点的字体大小
             * @param {number} size 字体大小（px）
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             * @return 返回首个选中节点的字体大小
             */
                fontsize: kity.createClass("fontsizeCommand", {
                    base: Command,
                    execute: function(km, size) {
                        var nodes = km.getSelectedNodes();
                        nodes.forEach(function(n) {
                            n.setData("font-size", size);
                            n.render();
                            km.layout(300);
                        });
                    },
                    queryState: function(km) {
                        return km.getSelectedNodes().length === 0 ? -1 : 0;
                    },
                    queryValue: function(km) {
                        var node = km.getSelectedNode();
                        if (node) return node.getData("font-size");
                        return null;
                    }
                })
            }
        });
    }
};

//src/module/hyperlink.js
_p[51] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        // jscs:disable maximumLineLength
        var linkShapePath = "M16.614,10.224h-1.278c-1.668,0-3.07-1.07-3.599-2.556h4.877c0.707,0,1.278-0.571,1.278-1.278V3.834 c0-0.707-0.571-1.278-1.278-1.278h-4.877C12.266,1.071,13.668,0,15.336,0h1.278c2.116,0,3.834,1.716,3.834,3.834V6.39 C20.448,8.508,18.73,10.224,16.614,10.224z M5.112,5.112c0-0.707,0.573-1.278,1.278-1.278h7.668c0.707,0,1.278,0.571,1.278,1.278 S14.765,6.39,14.058,6.39H6.39C5.685,6.39,5.112,5.819,5.112,5.112z M2.556,3.834V6.39c0,0.707,0.573,1.278,1.278,1.278h4.877 c-0.528,1.486-1.932,2.556-3.599,2.556H3.834C1.716,10.224,0,8.508,0,6.39V3.834C0,1.716,1.716,0,3.834,0h1.278 c1.667,0,3.071,1.071,3.599,2.556H3.834C3.129,2.556,2.556,3.127,2.556,3.834z";
        Module.register("hyperlink", {
            commands: {
                /**
             * @command HyperLink
             * @description 为选中的节点添加超链接
             * @param {string} url 超链接的 URL，设置为 null 移除
             * @param {string} title 超链接的说明
             * @state
             *   0: 当前有选中的节点
             *  -1: 当前没有选中的节点
             * @return 返回首个选中节点的超链接信息，JSON 对象： `{url: url, title: title}`
             */
                hyperlink: kity.createClass("hyperlink", {
                    base: Command,
                    execute: function(km, url, title) {
                        var nodes = km.getSelectedNodes();
                        nodes.forEach(function(n) {
                            n.setData("hyperlink", url);
                            n.setData("hyperlinkTitle", url && title);
                            n.render();
                        });
                        km.layout();
                    },
                    queryState: function(km) {
                        var nodes = km.getSelectedNodes(), result = 0;
                        if (nodes.length === 0) {
                            return -1;
                        }
                        nodes.forEach(function(n) {
                            if (n && n.getData("hyperlink")) {
                                result = 0;
                                return false;
                            }
                        });
                        return result;
                    },
                    queryValue: function(km) {
                        var node = km.getSelectedNode();
                        return {
                            url: node.getData("hyperlink"),
                            title: node.getData("hyperlinkTitle")
                        };
                    }
                })
            },
            renderers: {
                right: kity.createClass("hyperlinkrender", {
                    base: Renderer,
                    create: function() {
                        var link = new kity.HyperLink();
                        var linkshape = new kity.Path();
                        var outline = new kity.Rect(24, 22, -2, -6, 4).fill("rgba(255, 255, 255, 0)");
                        linkshape.setPathData(linkShapePath).fill("#666");
                        link.addShape(outline);
                        link.addShape(linkshape);
                        link.setTarget("_blank");
                        link.setStyle("cursor", "pointer");
                        link.on("mouseover", function() {
                            outline.fill("rgba(255, 255, 200, .8)");
                        }).on("mouseout", function() {
                            outline.fill("rgba(255, 255, 255, 0)");
                        });
                        return link;
                    },
                    shouldRender: function(node) {
                        return node.getData("hyperlink");
                    },
                    update: function(link, node, box) {
                        var href = node.getData("hyperlink");
                        link.setHref("#");
                        var allowed = [ "^http:", "^https:", "^ftp:", "^mailto:" ];
                        for (var i = 0; i < allowed.length; i++) {
                            var regex = new RegExp(allowed[i]);
                            if (regex.test(href)) {
                                link.setHref(href);
                                break;
                            }
                        }
                        var title = node.getData("hyperlinkTitle");
                        if (title) {
                            title = [ title, "(", href, ")" ].join("");
                        } else {
                            title = href;
                        }
                        link.node.setAttributeNS("http://www.w3.org/1999/xlink", "title", title);
                        var spaceRight = node.getStyle("space-right");
                        link.setTranslate(box.right + spaceRight + 2, -5);
                        return new kity.Box({
                            x: box.right + spaceRight,
                            y: -11,
                            width: 24,
                            height: 22
                        });
                    }
                })
            }
        });
    }
};

//src/module/image-viewer.js
_p[52] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var keymap = _p.r(17);
        var Module = _p.r(22);
        var Command = _p.r(11);
        Module.register("ImageViewer", function() {
            function createEl(name, classNames, children) {
                var el = document.createElement(name);
                addClass(el, classNames);
                children && children.length && children.forEach(function(child) {
                    el.appendChild(child);
                });
                return el;
            }
            function on(el, event, handler) {
                el.addEventListener(event, handler);
            }
            function addClass(el, classNames) {
                classNames && classNames.split(" ").forEach(function(className) {
                    el.classList.add(className);
                });
            }
            function removeClass(el, classNames) {
                classNames && classNames.split(" ").forEach(function(className) {
                    el.classList.remove(className);
                });
            }
            var ImageViewer = kity.createClass("ImageViewer", {
                constructor: function() {
                    var btnClose = createEl("button", "km-image-viewer-btn km-image-viewer-close");
                    var btnSource = createEl("button", "km-image-viewer-btn km-image-viewer-source");
                    var image = this.image = createEl("img");
                    var toolbar = this.toolbar = createEl("div", "km-image-viewer-toolbar", [ btnSource, btnClose ]);
                    var container = createEl("div", "km-image-viewer-container", [ image ]);
                    var viewer = this.viewer = createEl("div", "km-image-viewer", [ toolbar, container ]);
                    this.hotkeyHandler = this.hotkeyHandler.bind(this);
                    on(btnClose, "click", this.close.bind(this));
                    on(btnSource, "click", this.viewSource.bind(this));
                    on(image, "click", this.zoomImage.bind(this));
                    on(viewer, "contextmenu", this.toggleToolbar.bind(this));
                    on(document, "keydown", this.hotkeyHandler);
                },
                dispose: function() {
                    this.close();
                    document.removeEventListener("remove", this.hotkeyHandler);
                },
                hotkeyHandler: function(e) {
                    if (!this.actived) {
                        return;
                    }
                    if (e.keyCode === keymap["esc"]) {
                        this.close();
                    }
                },
                toggleToolbar: function(e) {
                    e && e.preventDefault();
                    this.toolbar.classList.toggle("hidden");
                },
                zoomImage: function(restore) {
                    var image = this.image;
                    if (typeof restore === "boolean") {
                        restore && addClass(image, "limited");
                    } else {
                        image.classList.toggle("limited");
                    }
                },
                viewSource: function(src) {
                    window.open(this.image.src);
                },
                open: function(src) {
                    var input = document.querySelector("input");
                    if (input) {
                        input.focus();
                        input.blur();
                    }
                    this.image.src = src;
                    this.zoomImage(true);
                    document.body.appendChild(this.viewer);
                    this.actived = true;
                },
                close: function() {
                    this.image.src = "";
                    document.body.removeChild(this.viewer);
                    this.actived = false;
                }
            });
            return {
                init: function() {
                    this.viewer = new ImageViewer();
                },
                events: {
                    "normal.dblclick": function(e) {
                        var shape = e.kityEvent.targetShape;
                        if (shape.__KityClassName === "Image" && shape.url) {
                            this.viewer.open(shape.url);
                        }
                    }
                }
            };
        });
    }
};

//src/module/image.js
_p[53] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("image", function() {
            function loadImageSize(url, callback) {
                var img = document.createElement("img");
                img.onload = function() {
                    callback(img.width, img.height);
                };
                img.onerror = function() {
                    callback(null);
                };
                img.src = url;
                img.classList.add("km-image");
            }
            function fitImageSize(width, height, maxWidth, maxHeight) {
                var ratio = width / height, fitRatio = maxWidth / maxHeight;
                // 宽高比大于最大尺寸的宽高比，以宽度为标准适应
                if (width > maxWidth && ratio > fitRatio) {
                    width = maxWidth;
                    height = width / ratio;
                } else if (height > maxHeight) {
                    height = maxHeight;
                    width = height * ratio;
                }
                return {
                    width: width | 0,
                    height: height | 0
                };
            }
            /**
         * @command Image
         * @description 为选中的节点添加图片
         * @param {string} url 图片的 URL，设置为 null 移除
         * @param {string} title 图片的说明
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         * @return 返回首个选中节点的图片信息，JSON 对象： `{url: url, title: title}`
         */
            var ImageCommand = kity.createClass("ImageCommand", {
                base: Command,
                execute: function(km, url, title) {
                    var nodes = km.getSelectedNodes();
                    loadImageSize(url, function(width, height) {
                        nodes.forEach(function(n) {
                            var size = fitImageSize(width, height, km.getOption("maxImageWidth"), km.getOption("maxImageHeight"));
                            n.setData("image", url);
                            n.setData("imageTitle", url && title);
                            n.setData("imageSize", url && size);
                            n.render();
                        });
                        km.fire("saveScene");
                        km.layout(300);
                    });
                },
                queryState: function(km) {
                    var nodes = km.getSelectedNodes(), result = 0;
                    if (nodes.length === 0) {
                        return -1;
                    }
                    nodes.forEach(function(n) {
                        if (n && n.getData("image")) {
                            result = 0;
                            return false;
                        }
                    });
                    return result;
                },
                queryValue: function(km) {
                    var node = km.getSelectedNode();
                    return {
                        url: node.getData("image"),
                        title: node.getData("imageTitle")
                    };
                }
            });
            var ImageRenderer = kity.createClass("ImageRenderer", {
                base: Renderer,
                create: function(node) {
                    return new kity.Image(node.getData("image"));
                },
                shouldRender: function(node) {
                    return node.getData("image");
                },
                update: function(image, node, box) {
                    var url = node.getData("image");
                    var title = node.getData("imageTitle");
                    var size = node.getData("imageSize");
                    var spaceTop = node.getStyle("space-top");
                    if (!size) return;
                    if (title) {
                        image.node.setAttributeNS("http://www.w3.org/1999/xlink", "title", title);
                    }
                    var x = box.cx - size.width / 2;
                    var y = box.y - size.height - spaceTop;
                    image.setUrl(url).setX(x | 0).setY(y | 0).setWidth(size.width | 0).setHeight(size.height | 0);
                    return new kity.Box(x | 0, y | 0, size.width | 0, size.height | 0);
                }
            });
            return {
                defaultOptions: {
                    maxImageWidth: 200,
                    maxImageHeight: 200
                },
                commands: {
                    image: ImageCommand
                },
                renderers: {
                    top: ImageRenderer
                }
            };
        });
    }
};

//src/module/keynav.js
_p[54] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var keymap = _p.r(17);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("KeyboardModule", function() {
            var min = Math.min, max = Math.max, abs = Math.abs, sqrt = Math.sqrt, exp = Math.exp;
            function buildPositionNetwork(root) {
                var pointIndexes = [], p;
                root.traverse(function(node) {
                    p = node.getLayoutBox();
                    // bugfix: 不应导航到收起的节点（判断其尺寸是否存在）
                    if (p.width && p.height) {
                        pointIndexes.push({
                            left: p.x,
                            top: p.y,
                            right: p.x + p.width,
                            bottom: p.y + p.height,
                            width: p.width,
                            height: p.height,
                            node: node
                        });
                    }
                });
                for (var i = 0; i < pointIndexes.length; i++) {
                    findClosestPointsFor(pointIndexes, i);
                }
            }
            // 这是金泉的点子，赞！
            // 求两个不相交矩形的最近距离
            function getCoefedDistance(box1, box2) {
                var xMin, xMax, yMin, yMax, xDist, yDist, dist, cx, cy;
                xMin = min(box1.left, box2.left);
                xMax = max(box1.right, box2.right);
                yMin = min(box1.top, box2.top);
                yMax = max(box1.bottom, box2.bottom);
                xDist = xMax - xMin - box1.width - box2.width;
                yDist = yMax - yMin - box1.height - box2.height;
                if (xDist < 0) dist = yDist; else if (yDist < 0) dist = xDist; else dist = sqrt(xDist * xDist + yDist * yDist);
                var node1 = box1.node;
                var node2 = box2.node;
                // sibling
                if (node1.parent == node2.parent) {
                    dist /= 10;
                }
                // parent
                if (node2.parent == node1) {
                    dist /= 5;
                }
                return dist;
            }
            function findClosestPointsFor(pointIndexes, iFind) {
                var find = pointIndexes[iFind];
                var most = {}, quad;
                var current, dist;
                for (var i = 0; i < pointIndexes.length; i++) {
                    if (i == iFind) continue;
                    current = pointIndexes[i];
                    dist = getCoefedDistance(current, find);
                    // left check
                    if (current.right < find.left) {
                        if (!most.left || dist < most.left.dist) {
                            most.left = {
                                dist: dist,
                                node: current.node
                            };
                        }
                    }
                    // right check
                    if (current.left > find.right) {
                        if (!most.right || dist < most.right.dist) {
                            most.right = {
                                dist: dist,
                                node: current.node
                            };
                        }
                    }
                    // top check
                    if (current.bottom < find.top) {
                        if (!most.top || dist < most.top.dist) {
                            most.top = {
                                dist: dist,
                                node: current.node
                            };
                        }
                    }
                    // bottom check
                    if (current.top > find.bottom) {
                        if (!most.down || dist < most.down.dist) {
                            most.down = {
                                dist: dist,
                                node: current.node
                            };
                        }
                    }
                }
                find.node._nearestNodes = {
                    right: most.right && most.right.node || null,
                    top: most.top && most.top.node || null,
                    left: most.left && most.left.node || null,
                    down: most.down && most.down.node || null
                };
            }
            function navigateTo(km, direction) {
                var referNode = km.getSelectedNode();
                if (!referNode) {
                    km.select(km.getRoot());
                    buildPositionNetwork(km.getRoot());
                    return;
                }
                if (!referNode._nearestNodes) {
                    buildPositionNetwork(km.getRoot());
                }
                var nextNode = referNode._nearestNodes[direction];
                if (nextNode) {
                    km.select(nextNode, true);
                }
            }
            // 稀释用
            var lastFrame;
            return {
                events: {
                    layoutallfinish: function() {
                        var root = this.getRoot();
                        buildPositionNetwork(root);
                    },
                    "normal.keydown readonly.keydown": function(e) {
                        var minder = this;
                        [ "left", "right", "up", "down" ].forEach(function(key) {
                            if (e.isShortcutKey(key)) {
                                navigateTo(minder, key == "up" ? "top" : key);
                                e.preventDefault();
                            }
                        });
                    }
                }
            };
        });
    }
};

//src/module/layout.js
/**
 * @fileOverview
 *
 * 布局模块
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[55] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var Command = _p.r(11);
        var Module = _p.r(22);
        /**
     * @command Layout
     * @description 设置选中节点的布局
     *     允许使用的布局可以使用 `kityminder.Minder.getLayoutList()` 查询
     * @param {string} name 布局的名称，设置为 null 则使用继承或默认的布局
     * @state
     *   0: 当前有选中的节点
     *  -1: 当前没有选中的节点
     * @return 返回首个选中节点的布局名称
     */
        var LayoutCommand = kity.createClass("LayoutCommand", {
            base: Command,
            execute: function(minder, name) {
                var nodes = minder.getSelectedNodes();
                nodes.forEach(function(node) {
                    node.layout(name);
                });
            },
            queryValue: function(minder) {
                var node = minder.getSelectedNode();
                if (node) {
                    return node.getData("layout");
                }
            },
            queryState: function(minder) {
                return minder.getSelectedNode() ? 0 : -1;
            }
        });
        /**
     * @command ResetLayout
     * @description 重设选中节点的布局，如果当前没有选中的节点，重设整个脑图的布局
     * @state
     *   0: 始终可用
     * @return 返回首个选中节点的布局名称
     */
        var ResetLayoutCommand = kity.createClass("ResetLayoutCommand", {
            base: Command,
            execute: function(minder) {
                var nodes = minder.getSelectedNodes();
                if (!nodes.length) nodes = [ minder.getRoot() ];
                nodes.forEach(function(node) {
                    node.traverse(function(child) {
                        child.resetLayoutOffset();
                        if (!child.isRoot()) {
                            child.setData("layout", null);
                        }
                    });
                });
                minder.layout(300);
            },
            enableReadOnly: true
        });
        Module.register("LayoutModule", {
            commands: {
                layout: LayoutCommand,
                resetlayout: ResetLayoutCommand
            },
            contextmenu: [ {
                command: "resetlayout"
            }, {
                divider: true
            } ],
            commandShortcutKeys: {
                resetlayout: "Ctrl+Shift+L"
            }
        });
    }
};

//src/module/node.js
_p[56] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        /**
     * @command AppendChildNode
     * @description 添加子节点到选中的节点中
     * @param {string|object} textOrData 要插入的节点的文本或数据
     * @state
     *    0: 当前有选中的节点
     *   -1: 当前没有选中的节点
     */
        var AppendChildCommand = kity.createClass("AppendChildCommand", {
            base: Command,
            execute: function(km, text) {
                var parent = km.getSelectedNode();
                if (!parent) {
                    return null;
                }
                var node = km.createNode(text, parent);
                km.select(node, true);
                if (parent.isExpanded()) {
                    node.render();
                } else {
                    parent.expand();
                    parent.renderTree();
                }
                km.layout(600);
            },
            queryState: function(km) {
                var selectedNode = km.getSelectedNode();
                return selectedNode ? 0 : -1;
            }
        });
        /**
     * @command AppendSiblingNode
     * @description 添加选中的节点的兄弟节点
     * @param {string|object} textOrData 要添加的节点的文本或数据
     * @state
     *    0: 当前有选中的节点
     *   -1: 当前没有选中的节点
     */
        var AppendSiblingCommand = kity.createClass("AppendSiblingCommand", {
            base: Command,
            execute: function(km, text) {
                var sibling = km.getSelectedNode();
                var parent = sibling.parent;
                if (!parent) {
                    return km.execCommand("AppendChildNode", text);
                }
                var node = km.createNode(text, parent, sibling.getIndex() + 1);
                node.setGlobalLayoutTransform(sibling.getGlobalLayoutTransform());
                km.select(node, true);
                node.render();
                km.layout(600);
            },
            queryState: function(km) {
                var selectedNode = km.getSelectedNode();
                return selectedNode ? 0 : -1;
            }
        });
        /**
     * @command RemoveNode
     * @description 移除选中的节点
     * @state
     *    0: 当前有选中的节点
     *   -1: 当前没有选中的节点
     */
        var RemoveNodeCommand = kity.createClass("RemoverNodeCommand", {
            base: Command,
            execute: function(km) {
                var nodes = km.getSelectedNodes();
                var ancestor = MinderNode.getCommonAncestor.apply(null, nodes);
                var index = nodes[0].getIndex();
                nodes.forEach(function(node) {
                    if (!node.isRoot()) km.removeNode(node);
                });
                if (nodes.length == 1) {
                    var selectBack = ancestor.children[index - 1] || ancestor.children[index];
                    km.select(selectBack || ancestor || km.getRoot(), true);
                } else {
                    km.select(ancestor || km.getRoot(), true);
                }
                km.layout(600);
            },
            queryState: function(km) {
                var selectedNode = km.getSelectedNode();
                return selectedNode && !selectedNode.isRoot() ? 0 : -1;
            }
        });
        var AppendParentCommand = kity.createClass("AppendParentCommand", {
            base: Command,
            execute: function(km, text) {
                var nodes = km.getSelectedNodes();
                nodes.sort(function(a, b) {
                    return a.getIndex() - b.getIndex();
                });
                var parent = nodes[0].parent;
                var newParent = km.createNode(text, parent, nodes[0].getIndex());
                nodes.forEach(function(node) {
                    newParent.appendChild(node);
                });
                newParent.setGlobalLayoutTransform(nodes[nodes.length >> 1].getGlobalLayoutTransform());
                km.select(newParent, true);
                km.layout(600);
            },
            queryState: function(km) {
                var nodes = km.getSelectedNodes();
                if (!nodes.length) return -1;
                var parent = nodes[0].parent;
                if (!parent) return -1;
                for (var i = 1; i < nodes.length; i++) {
                    if (nodes[i].parent != parent) return -1;
                }
                return 0;
            }
        });
        Module.register("NodeModule", function() {
            return {
                commands: {
                    AppendChildNode: AppendChildCommand,
                    AppendSiblingNode: AppendSiblingCommand,
                    RemoveNode: RemoveNodeCommand,
                    AppendParentNode: AppendParentCommand
                },
                commandShortcutKeys: {
                    appendsiblingnode: "normal::Enter",
                    appendchildnode: "normal::Insert|Tab",
                    appendparentnode: "normal::Shift+Tab|normal::Shift+Insert",
                    removenode: "normal::Del|Backspace"
                }
            };
        });
    }
};

//src/module/note.js
/**
 * @fileOverview
 *
 * 支持节点详细信息（HTML）格式
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[57] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("NoteModule", function() {
            var NOTE_PATH = "M9,9H3V8h6L9,9L9,9z M9,7H3V6h6V7z M9,5H3V4h6V5z M8.5,11H2V2h8v7.5 M9,12l2-2V1H1v11";
            /**
         * @command Note
         * @description 设置节点的备注信息
         * @param {string} note 要设置的备注信息，设置为 null 则移除备注信息
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
            var NoteCommand = kity.createClass("NoteCommand", {
                base: Command,
                execute: function(minder, note) {
                    var node = minder.getSelectedNode();
                    node.setData("note", note);
                    node.render();
                    node.getMinder().layout(300);
                },
                queryState: function(minder) {
                    return minder.getSelectedNodes().length === 1 ? 0 : -1;
                },
                queryValue: function(minder) {
                    var node = minder.getSelectedNode();
                    return node && node.getData("note");
                }
            });
            var NoteIcon = kity.createClass("NoteIcon", {
                base: kity.Group,
                constructor: function() {
                    this.callBase();
                    this.width = 16;
                    this.height = 17;
                    this.rect = new kity.Rect(16, 17, .5, -8.5, 2).fill("transparent");
                    this.path = new kity.Path().setPathData(NOTE_PATH).setTranslate(2.5, -6.5);
                    this.addShapes([ this.rect, this.path ]);
                    this.on("mouseover", function() {
                        this.rect.fill("rgba(255, 255, 200, .8)");
                    }).on("mouseout", function() {
                        this.rect.fill("transparent");
                    });
                    this.setStyle("cursor", "pointer");
                }
            });
            var NoteIconRenderer = kity.createClass("NoteIconRenderer", {
                base: Renderer,
                create: function(node) {
                    var icon = new NoteIcon();
                    icon.on("mousedown", function(e) {
                        e.preventDefault();
                        node.getMinder().fire("editnoterequest");
                    });
                    icon.on("mouseover", function() {
                        node.getMinder().fire("shownoterequest", {
                            node: node,
                            icon: icon
                        });
                    });
                    icon.on("mouseout", function() {
                        node.getMinder().fire("hidenoterequest", {
                            node: node,
                            icon: icon
                        });
                    });
                    return icon;
                },
                shouldRender: function(node) {
                    return node.getData("note");
                },
                update: function(icon, node, box) {
                    var x = box.right + node.getStyle("space-left");
                    var y = box.cy;
                    icon.path.fill(node.getStyle("color"));
                    icon.setTranslate(x, y);
                    return new kity.Box(x, Math.round(y - icon.height / 2), icon.width, icon.height);
                }
            });
            return {
                renderers: {
                    right: NoteIconRenderer
                },
                commands: {
                    note: NoteCommand
                }
            };
        });
    }
};

//src/module/outline.js
_p[58] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        var OutlineRenderer = kity.createClass("OutlineRenderer", {
            base: Renderer,
            create: function(node) {
                var outline = new kity.Rect().setId(utils.uuid("node_outline"));
                this.bringToBack = true;
                return outline;
            },
            update: function(outline, node, box) {
                var shape = node.getStyle("shape");
                var paddingLeft = node.getStyle("padding-left"), paddingRight = node.getStyle("padding-right"), paddingTop = node.getStyle("padding-top"), paddingBottom = node.getStyle("padding-bottom");
                var outlineBox = {
                    x: box.x - paddingLeft,
                    y: box.y - paddingTop,
                    width: box.width + paddingLeft + paddingRight,
                    height: box.height + paddingTop + paddingBottom
                };
                var radius = node.getStyle("radius");
                // 天盘图圆形的情况
                if (shape && shape == "circle") {
                    var p = Math.pow;
                    var r = Math.round;
                    radius = r(Math.sqrt(p(outlineBox.width, 2) + p(outlineBox.height, 2)) / 2);
                    outlineBox.x = box.cx - radius;
                    outlineBox.y = box.cy - radius;
                    outlineBox.width = 2 * radius;
                    outlineBox.height = 2 * radius;
                }
                var prefix = node.isSelected() ? node.getMinder().isFocused() ? "selected-" : "blur-selected-" : "";
                outline.setPosition(outlineBox.x, outlineBox.y).setSize(outlineBox.width, outlineBox.height).setRadius(radius).fill(node.getData("background") || node.getStyle(prefix + "background") || node.getStyle("background")).stroke(node.getStyle(prefix + "stroke" || node.getStyle("stroke")), node.getStyle(prefix + "stroke-width"));
                return new kity.Box(outlineBox);
            }
        });
        var ShadowRenderer = kity.createClass("ShadowRenderer", {
            base: Renderer,
            create: function(node) {
                this.bringToBack = true;
                return new kity.Rect();
            },
            shouldRender: function(node) {
                return node.getStyle("shadow");
            },
            update: function(shadow, node, box) {
                shadow.setPosition(box.x + 4, box.y + 5).fill(node.getStyle("shadow"));
                var shape = node.getStyle("shape");
                if (!shape) {
                    shadow.setSize(box.width, box.height);
                    shadow.setRadius(node.getStyle("radius"));
                } else if (shape == "circle") {
                    var width = Math.max(box.width, box.height);
                    shadow.setSize(width, width);
                    shadow.setRadius(width / 2);
                }
            }
        });
        var marker = new kity.Marker();
        marker.setWidth(10);
        marker.setHeight(12);
        marker.setRef(0, 0);
        marker.setViewBox(-6, -4, 8, 10);
        marker.addShape(new kity.Path().setPathData("M-5-3l5,3,-5,3").stroke("#33ffff"));
        var wireframeOption = /wire/.test(window.location.href);
        var WireframeRenderer = kity.createClass("WireframeRenderer", {
            base: Renderer,
            create: function() {
                var wireframe = new kity.Group();
                var oxy = this.oxy = new kity.Path().stroke("#f6f").setPathData("M0,-50L0,50M-50,0L50,0");
                var box = this.wireframe = new kity.Rect().stroke("lightgreen");
                var vectorIn = this.vectorIn = new kity.Path().stroke("#66ffff");
                var vectorOut = this.vectorOut = new kity.Path().stroke("#66ffff");
                vectorIn.setMarker(marker, "end");
                vectorOut.setMarker(marker, "end");
                return wireframe.addShapes([ oxy, box, vectorIn, vectorOut ]);
            },
            shouldRender: function() {
                return wireframeOption;
            },
            update: function(created, node, box) {
                this.wireframe.setPosition(box.x, box.y).setSize(box.width, box.height);
                var pin = node.getVertexIn();
                var pout = node.getVertexOut();
                var vin = node.getLayoutVectorIn().normalize(30);
                var vout = node.getLayoutVectorOut().normalize(30);
                this.vectorIn.setPathData([ "M", pin.offset(vin.reverse()), "L", pin ]);
                this.vectorOut.setPathData([ "M", pout, "l", vout ]);
            }
        });
        Module.register("OutlineModule", function() {
            return {
                events: !wireframeOption ? null : {
                    ready: function() {
                        this.getPaper().addResource(marker);
                    },
                    layoutallfinish: function() {
                        this.getRoot().traverse(function(node) {
                            node.getRenderer("WireframeRenderer").update(null, node, node.getContentBox());
                        });
                    }
                },
                renderers: {
                    outline: OutlineRenderer,
                    outside: [ ShadowRenderer, WireframeRenderer ]
                }
            };
        });
    }
};

//src/module/priority.js
_p[59] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("PriorityModule", function() {
            var minder = this;
            // Designed by Akikonata
            // [MASK, BACK]
            var PRIORITY_COLORS = [ null, [ "#FF1200", "#840023" ], // 1 - red
            [ "#0074FF", "#01467F" ], // 2 - blue
            [ "#00AF00", "#006300" ], // 3 - green
            [ "#FF962E", "#B25000" ], // 4 - orange
            [ "#A464FF", "#4720C4" ], // 5 - purple
            [ "#A3A3A3", "#515151" ], // 6,7,8,9 - gray
            [ "#A3A3A3", "#515151" ], [ "#A3A3A3", "#515151" ], [ "#A3A3A3", "#515151" ] ];
            // hue from 1 to 5
            // jscs:disable maximumLineLength
            var BACK_PATH = "M0,13c0,3.866,3.134,7,7,7h6c3.866,0,7-3.134,7-7V7H0V13z";
            var MASK_PATH = "M20,10c0,3.866-3.134,7-7,7H7c-3.866,0-7-3.134-7-7V7c0-3.866,3.134-7,7-7h6c3.866,0,7,3.134,7,7V10z";
            var PRIORITY_DATA = "priority";
            // 优先级图标的图形
            var PriorityIcon = kity.createClass("PriorityIcon", {
                base: kity.Group,
                constructor: function() {
                    this.callBase();
                    this.setSize(20);
                    this.create();
                    this.setId(utils.uuid("node_priority"));
                },
                setSize: function(size) {
                    this.width = this.height = size;
                },
                create: function() {
                    var white, back, mask, number;
                    // 4 layer
                    white = new kity.Path().setPathData(MASK_PATH).fill("white");
                    back = new kity.Path().setPathData(BACK_PATH).setTranslate(.5, .5);
                    mask = new kity.Path().setPathData(MASK_PATH).setOpacity(.8).setTranslate(.5, .5);
                    number = new kity.Text().setX(this.width / 2 - .5).setY(this.height / 2).setTextAnchor("middle").setVerticalAlign("middle").setFontItalic(true).setFontSize(12).fill("white");
                    this.addShapes([ back, mask, number ]);
                    this.mask = mask;
                    this.back = back;
                    this.number = number;
                },
                setValue: function(value) {
                    var back = this.back, mask = this.mask, number = this.number;
                    var color = PRIORITY_COLORS[value];
                    if (color) {
                        back.fill(color[1]);
                        mask.fill(color[0]);
                    }
                    number.setContent(value);
                }
            });
            /**
         * @command Priority
         * @description 设置节点的优先级信息
         * @param {number} value 要设置的优先级（添加一个优先级小图标）
         *     取值为 0 移除优先级信息；
         *     取值为 1 - 9 设置优先级，超过 9 的优先级不渲染
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
            var PriorityCommand = kity.createClass("SetPriorityCommand", {
                base: Command,
                execute: function(km, value) {
                    var nodes = km.getSelectedNodes();
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].setData(PRIORITY_DATA, value || null).render();
                    }
                    km.layout();
                },
                queryValue: function(km) {
                    var nodes = km.getSelectedNodes();
                    var val;
                    for (var i = 0; i < nodes.length; i++) {
                        val = nodes[i].getData(PRIORITY_DATA);
                        if (val) break;
                    }
                    return val || null;
                },
                queryState: function(km) {
                    return km.getSelectedNodes().length ? 0 : -1;
                }
            });
            return {
                commands: {
                    priority: PriorityCommand
                },
                renderers: {
                    left: kity.createClass("PriorityRenderer", {
                        base: Renderer,
                        create: function(node) {
                            return new PriorityIcon();
                        },
                        shouldRender: function(node) {
                            return node.getData(PRIORITY_DATA);
                        },
                        update: function(icon, node, box) {
                            var data = node.getData(PRIORITY_DATA);
                            var spaceLeft = node.getStyle("space-left"), x, y;
                            icon.setValue(data);
                            x = box.left - icon.width - spaceLeft;
                            y = -icon.height / 2;
                            icon.setTranslate(x, y);
                            return new kity.Box({
                                x: x,
                                y: y,
                                width: icon.width,
                                height: icon.height
                            });
                        }
                    })
                }
            };
        });
    }
};

//src/module/progress.js
_p[60] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("ProgressModule", function() {
            var minder = this;
            var PROGRESS_DATA = "progress";
            // Designed by Akikonata
            var BG_COLOR = "#FFED83";
            var PIE_COLOR = "#43BC00";
            var SHADOW_PATH = "M10,3c4.418,0,8,3.582,8,8h1c0-5.523-3.477-10-9-10S1,5.477,1,11h1C2,6.582,5.582,3,10,3z";
            var SHADOW_COLOR = "#8E8E8E";
            // jscs:disable maximumLineLength
            var FRAME_PATH = "M10,0C4.477,0,0,4.477,0,10c0,5.523,4.477,10,10,10s10-4.477,10-10C20,4.477,15.523,0,10,0zM10,18c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S14.418,18,10,18z";
            var FRAME_GRAD = new kity.LinearGradient().pipe(function(g) {
                g.setStartPosition(0, 0);
                g.setEndPosition(0, 1);
                g.addStop(0, "#fff");
                g.addStop(1, "#ccc");
            });
            var CHECK_PATH = "M15.812,7.896l-6.75,6.75l-4.5-4.5L6.25,8.459l2.812,2.803l5.062-5.053L15.812,7.896z";
            var CHECK_COLOR = "#EEE";
            minder.getPaper().addResource(FRAME_GRAD);
            // 进度图标的图形
            var ProgressIcon = kity.createClass("ProgressIcon", {
                base: kity.Group,
                constructor: function(value) {
                    this.callBase();
                    this.setSize(20);
                    this.create();
                    this.setValue(value);
                    this.setId(utils.uuid("node_progress"));
                    this.translate(.5, .5);
                },
                setSize: function(size) {
                    this.width = this.height = size;
                },
                create: function() {
                    var bg, pie, shadow, frame, check;
                    bg = new kity.Circle(9).fill(BG_COLOR);
                    pie = new kity.Pie(9, 0).fill(PIE_COLOR);
                    shadow = new kity.Path().setPathData(SHADOW_PATH).setTranslate(-10, -10).fill(SHADOW_COLOR);
                    frame = new kity.Path().setTranslate(-10, -10).setPathData(FRAME_PATH).fill(FRAME_GRAD);
                    check = new kity.Path().setTranslate(-10, -10).setPathData(CHECK_PATH).fill(CHECK_COLOR);
                    this.addShapes([ bg, pie, shadow, check, frame ]);
                    this.pie = pie;
                    this.check = check;
                },
                setValue: function(value) {
                    this.pie.setAngle(-360 * (value - 1) / 8);
                    this.check.setVisible(value == 9);
                }
            });
            /**
         * @command Progress
         * @description 设置节点的进度信息（添加一个进度小图标）
         * @param {number} value 要设置的进度
         *     取值为 0 移除进度信息；
         *     取值为 1 表示未开始；
         *     取值为 2 表示完成 1/8；
         *     取值为 3 表示完成 2/8；
         *     取值为 4 表示完成 3/8；
         *     其余类推，取值为 9 表示全部完成
         * @state
         *    0: 当前有选中的节点
         *   -1: 当前没有选中的节点
         */
            var ProgressCommand = kity.createClass("ProgressCommand", {
                base: Command,
                execute: function(km, value) {
                    var nodes = km.getSelectedNodes();
                    for (var i = 0; i < nodes.length; i++) {
                        nodes[i].setData(PROGRESS_DATA, value || null).render();
                    }
                    km.layout();
                },
                queryValue: function(km) {
                    var nodes = km.getSelectedNodes();
                    var val;
                    for (var i = 0; i < nodes.length; i++) {
                        val = nodes[i].getData(PROGRESS_DATA);
                        if (val) break;
                    }
                    return val || null;
                },
                queryState: function(km) {
                    return km.getSelectedNodes().length ? 0 : -1;
                }
            });
            return {
                commands: {
                    progress: ProgressCommand
                },
                renderers: {
                    left: kity.createClass("ProgressRenderer", {
                        base: Renderer,
                        create: function(node) {
                            return new ProgressIcon();
                        },
                        shouldRender: function(node) {
                            return node.getData(PROGRESS_DATA);
                        },
                        update: function(icon, node, box) {
                            var data = node.getData(PROGRESS_DATA);
                            var spaceLeft = node.getStyle("space-left");
                            var x, y;
                            icon.setValue(data);
                            x = box.left - icon.width - spaceLeft;
                            y = -icon.height / 2;
                            icon.setTranslate(x + icon.width / 2, y + icon.height / 2);
                            return new kity.Box(x, y, icon.width, icon.height);
                        }
                    })
                }
            };
        });
    }
};

//src/module/relLine.js
_p[61] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        var LeaderLine = _p.r(5).LeaderLine;
        var PlainDraggable = _p.r(6).PlainDraggable;
        Module.register("relLine", function() {
            //创建关系线
            //关系线参数设置
            // var relLineOption = { color: '#009143', size: 1.5, dash: true, endPlugSize: 2, startSocket: "right", Socket: "left" };
            var relLineOption = {
                color: "#009143",
                size: 1.5,
                dash: false,
                endPlugSize: 2,
                startSocket: "right",
                Socket: "left"
            };
            var startDraggable, endDraggable, p_r = 10;
            function createRelLine(startNode, endNode) {
                var startElementId = startNode.rc.getId();
                var endElementId = endNode.rc.getId();
                var startElement = document.getElementById(startElementId);
                var endElement = document.getElementById(endElementId);
                //获取指定节点的Element
                // var startElement = document.getElementById(km.getSelectedNode().rc.getId());
                //startPlug: 'disc', endPlug: 'disc'
                var line = new LeaderLine(startElement, endElement, relLineOption);
                line.start = LeaderLine.pointAnchor(startElement, {
                    x: startElement.getBBox().width / 2,
                    y: 0
                });
                line.end = LeaderLine.pointAnchor(endElement, {
                    x: endElement.getBBox() / 2,
                    y: 0
                });
                km._relLine_obj.push(line);
                return line;
            }
            function createCircleFun(line) {
                removeCircleFun();
                var lineData = km._relLine[km._relLine_obj.indexOf(line)];
                // var svg = km.getRenderContainer().container.node;
                var svg = km.getPaper().getNode();
                var p0 = km.getNodeById(lineData.startId).rc.node, p1, p2, p3 = km.getNodeById(lineData.endId).rc.node;
                var line_box_length_x = svg.getBoundingClientRect().x;
                var line_box_length_y = svg.getBoundingClientRect().y;
                p1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                if (p1) {
                    p1.setAttribute("cx", p0.getBoundingClientRect().x + (p0.getBBox().width / 2 - line_box_length_x));
                    p1.setAttribute("cy", p0.getBoundingClientRect().y - line_box_length_y);
                    p1.setAttribute("r", p_r);
                    p1.setAttribute("class", "rel-line-point-start");
                    p1.setAttribute("style", "-webkit-tap-highlight-color: transparent; box-shadow: transparent 0px 0px 1px; cursor: grab; user-select: none;fill: #009143;");
                    //indianred
                    svg.appendChild(p1);
                }
                p2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                if (p2) {
                    p2.setAttribute("cx", p3.getBoundingClientRect().x + (p3.getBBox().width / 2 - line_box_length_x));
                    p2.setAttribute("cy", p3.getBoundingClientRect().y - line_box_length_y);
                    p2.setAttribute("r", p_r);
                    p2.setAttribute("class", "rel-line-point-end");
                    p2.setAttribute("style", "-webkit-tap-highlight-color: transparent; box-shadow: transparent 0px 0px 1px; cursor: grab; user-select: none;fill: #009143;");
                    svg.appendChild(p2);
                }
                var line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                if (line1) {
                    line1.setAttribute("x1", p0.getBoundingClientRect().x + (p0.getBBox().width / 2 - line_box_length_x));
                    line1.setAttribute("y1", p0.getBoundingClientRect().y - line_box_length_y);
                    line1.setAttribute("x2", p1.getBoundingClientRect().x - line_box_length_x + p_r);
                    line1.setAttribute("y2", p1.getBoundingClientRect().y - line_box_length_y + p_r);
                    line1.setAttribute("class", "rel-line-line-start");
                    line1.setAttribute("style", "stroke: #009143;stroke-width: 2px;");
                    svg.appendChild(line1);
                }
                var line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                if (line2) {
                    line2.setAttribute("x1", p2.getBoundingClientRect().x - line_box_length_x + p_r);
                    line2.setAttribute("y1", p2.getBoundingClientRect().y - line_box_length_y + p_r);
                    line2.setAttribute("x2", p3.getBoundingClientRect().x + (p3.getBBox().width / 2 - line_box_length_x));
                    line2.setAttribute("y2", p3.getBoundingClientRect().y - line_box_length_y);
                    line2.setAttribute("class", "rel-line-line-end");
                    line2.setAttribute("style", "stroke: #009143;stroke-width: 2px;");
                    svg.appendChild(line2);
                }
                var field = svg;
                var xy = {
                    p0: {
                        x: p0.getBoundingClientRect().x,
                        y: p0.getBoundingClientRect().y
                    },
                    p1: {
                        x: p1.cx.baseVal.value,
                        y: p1.cy.baseVal.value
                    },
                    p2: {
                        x: p2.cx.baseVal.value,
                        y: p2.cy.baseVal.value
                    },
                    p3: {
                        x: p3.getBoundingClientRect().x,
                        y: p3.getBoundingClientRect().y
                    }
                };
                function update() {
                    var _p1 = document.getElementsByClassName("rel-line-point-start")[0].getBoundingClientRect();
                    var _p2 = document.getElementsByClassName("rel-line-point-end")[0].getBoundingClientRect();
                    var _line1 = document.getElementsByClassName("rel-line-line-start")[0];
                    var _line2 = document.getElementsByClassName("rel-line-line-end")[0];
                    _line1.x2.baseVal.value = _p1.x - line_box_length_x + p_r;
                    _line1.y2.baseVal.value = _p1.y - line_box_length_y + p_r;
                    _line2.x1.baseVal.value = _p2.x - line_box_length_x + p_r;
                    _line2.y1.baseVal.value = _p2.y - line_box_length_y + p_r;
                    var point_start = {
                        x: _p1.x - line_box_length_x + p_r - xy.p1.x,
                        y: _p1.y - line_box_length_y + p_r - xy.p1.y
                    };
                    var point_end = {
                        x: _p2.x - line_box_length_x + p_r - xy.p2.x,
                        y: _p2.y - line_box_length_y + p_r - xy.p2.y
                    };
                    //存入数据
                    lineData.ctrl = [ {
                        x: point_start.x,
                        y: point_start.y
                    }, {
                        x: point_end.x,
                        y: point_end.y
                    } ];
                    line.setOptions({
                        startSocketGravity: [ point_start.x, point_start.y ],
                        endSocketGravity: [ point_end.x, point_end.y ]
                    });
                    startDraggable.position();
                    endDraggable.position();
                }
                startDraggable = new PlainDraggable(p1, {
                    containment: field,
                    onMove: function() {
                        update();
                    }
                });
                endDraggable = new PlainDraggable(p2, {
                    containment: field,
                    onMove: function() {
                        update();
                    }
                });
                // update();
                svg.addEventListener("mousedown", function() {
                    km.circle.remove();
                });
            }
            function removeCircleFun() {
                Array.prototype.forEach.call(document.getElementsByClassName("rel-line-point-start"), function(item) {
                    item.remove();
                });
                Array.prototype.forEach.call(document.getElementsByClassName("rel-line-point-end"), function(item) {
                    item.remove();
                });
                Array.prototype.forEach.call(document.getElementsByClassName("rel-line-line-start"), function(item) {
                    item.remove();
                });
                Array.prototype.forEach.call(document.getElementsByClassName("rel-line-line-end"), function(item) {
                    item.remove();
                });
                startDraggable = null;
                endDraggable = null;
            }
            function updateCircleFun(line) {
                km.circle.curline = line;
                createCircleFun(line);
                updateCirclePosition(line);
            }
            function updateCirclePosition(line) {
                var svg = km.getPaper().getNode();
                var line_box_length_x = svg.getBoundingClientRect().x;
                var line_box_length_y = svg.getBoundingClientRect().y;
                var lineData = km._relLine[km._relLine_obj.indexOf(line)];
                var _p1 = document.getElementsByClassName("rel-line-point-start")[0];
                var _p2 = document.getElementsByClassName("rel-line-point-end")[0];
                if (_p1 && lineData.ctrl) {
                    _p1.cx.baseVal.value = _p1.cx.baseVal.value + lineData.ctrl[0].x;
                    _p1.cy.baseVal.value = _p1.cy.baseVal.value + lineData.ctrl[0].y;
                    _p2.cx.baseVal.value = _p2.cx.baseVal.value + lineData.ctrl[1].x;
                    _p2.cy.baseVal.value = _p2.cy.baseVal.value + lineData.ctrl[1].y;
                    var _line1 = document.getElementsByClassName("rel-line-line-start")[0];
                    var _line2 = document.getElementsByClassName("rel-line-line-end")[0];
                    _line1.x2.baseVal.value = _p1.getBoundingClientRect().x - line_box_length_x + p_r;
                    _line1.y2.baseVal.value = _p1.getBoundingClientRect().y - line_box_length_y + p_r;
                    _line2.x1.baseVal.value = _p2.getBoundingClientRect().x - line_box_length_x + p_r;
                    _line2.y1.baseVal.value = _p2.getBoundingClientRect().y - line_box_length_y + p_r;
                    // line.setOptions({
                    //     startSocketGravity: [lineData.ctrl[0].x, lineData.ctrl[0].y],
                    //     endSocketGravity: [lineData.ctrl[1].x, lineData.ctrl[1].y]
                    // });
                    startDraggable.position();
                    endDraggable.position();
                }
            }
            /**
         * @command Image
         * @description 为选中的节点添加关系线
         * @param {string} startElement 开始ID
         * @param {string} endElement 结束ID
         * @state
         *   0: 当前有选中的节点
         *  -1: 当前没有选中的节点
         * @return 返回首个选中节点的图片信息，JSON 对象： `{url: url, title: title}`
         */
            var RelLineCommand = kity.createClass("RelLineCommand", {
                base: Command,
                execute: function(km) {
                    var curNode = km.getSelectedNode();
                    var endNodeAreaAnchor = LeaderLine.areaAnchor(km.getRenderContainer().container.node, {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0
                    });
                    if (curNode) {
                        //创建关系线
                        var startElementId = curNode.rc.getId();
                        var startElement = document.getElementById(startElementId);
                        var newLine = new LeaderLine(startElement, endNodeAreaAnchor, relLineOption);
                        //起点定点到中间点                   
                        // newLine.start = LeaderLine.pointAnchor(startElement, { x: 0, y: 0 });
                        newLine.start = LeaderLine.pointAnchor(startElement, {
                            x: startElement.getBBox().width / 2,
                            y: 0
                        });
                        km._relLine = km._relLine || [];
                        km._relLine_obj = km._relLine_obj || [];
                        var _relLine = {
                            id: utils.guid(),
                            startId: curNode.data.id || "",
                            endId: ""
                        };
                        km._relLine_obj.push(newLine);
                        //挂载拖拽事件
                        km.circle = {
                            create: updateCircleFun,
                            remove: removeCircleFun
                        };
                        //关系线指向终点函数
                        function relLineMouseFun() {
                            var _curNode = km.getSelectedNode();
                            if (_curNode) {
                                try {
                                    var __endNode = document.getElementById(_curNode.rc.getId());
                                    if (newLine.start != __endNode) {
                                        newLine.end = __endNode;
                                        //终点定点到中间点
                                        newLine.end = LeaderLine.pointAnchor(__endNode, {
                                            x: __endNode.getBBox() / 2,
                                            y: 0
                                        });
                                        km.getRenderContainer().container.removeEventListener("mousedown", relLineMouseFun);
                                        km.getRenderContainer().container.removeEventListener("mousemove", relLineMouseMVFun);
                                        //记录关系线数据
                                        _relLine.endId = _curNode.data.id || "";
                                        km._relLine.push(_relLine);
                                    }
                                } catch (error) {
                                    console.log("zhhlog:relLine:RelLineCommand:error=" + error);
                                }
                            }
                        }
                        km.getRenderContainer().container.addEventListener("mousedown", relLineMouseFun);
                        //鼠标在画布上移动，关系线跟随效果
                        var startTime = parseInt(Date.now());
                        function relLineMouseMVFun() {
                            if (Date.now() - startTime > 50) {
                                startTime = parseInt(Date.now());
                                newLine.end = LeaderLine.areaAnchor(km.getRenderContainer().container.node, {
                                    x: window.event.offsetX,
                                    y: window.event.offsetY,
                                    width: 0,
                                    height: 0
                                });
                                newLine.position();
                            }
                        }
                        km.getRenderContainer().container.addEventListener("mousemove", relLineMouseMVFun);
                    }
                },
                queryState: function(km) {
                    var nodes = km.getSelectedNodes(), result = 0;
                    if (nodes.length === 0) {
                        return -1;
                    }
                    nodes.forEach(function(n) {
                        if (n && n.getData("relLine")) {
                            result = 0;
                            return false;
                        }
                    });
                    return result;
                },
                queryValue: function(km) {
                    var node = km.getSelectedNode();
                    return {
                        relLine: node.getData("relLine")
                    };
                }
            });
            var InitRelLine = function() {
                //挂载拖拽事件
                km.circle = {
                    create: updateCircleFun,
                    remove: removeCircleFun
                };
                //挂载渲染关系线事件
                km._relLine_render = function(time, expand) {
                    console.error = function() {};
                    time = time || 0;
                    setTimeout(function() {
                        //更新关系线
                        if (km._relLine_obj) {
                            var curNode = km.getSelectedNode();
                            var curNodeChild = curNode != undefined ? curNode.children : null;
                            // 折叠/展开，需要隐藏/显示关系线
                            var expand_relLine_fun = function(nodeChilds, itemLine, lineData) {
                                //折叠/展开，需要隐藏/显示关系先
                                if (nodeChilds) {
                                    nodeChilds.forEach(function(childItem) {
                                        var childEleId = childItem.data.id;
                                        var childEle = childItem.rc.node;
                                        if (lineData.startId == childEleId || lineData.endId == childEleId) {
                                            //子节点的显示状态
                                            // if (childEle.getAttribute("display") == "none") 
                                            //两个父级都有可以被折叠
                                            if (km.getNodeById(lineData.startId).rc.node.getAttribute("display") == "none" || km.getNodeById(lineData.endId).rc.node.getAttribute("display") == "none") {
                                                itemLine.hide();
                                                //更新拖拽渲染点
                                                if (document.getElementsByClassName("rel-line-point-start").length > 0) {
                                                    removeCircleFun(itemLine);
                                                }
                                            } else {
                                                itemLine.show();
                                            }
                                        }
                                        //递归
                                        expand_relLine_fun(childItem.children, itemLine, lineData);
                                    });
                                }
                            };
                            //遍历关系线对象
                            km._relLine_obj.forEach(function(itemLine, lineIndex) {
                                try {
                                    itemLine.position();
                                } catch (error) {}
                                if (expand) {
                                    //折叠/展开触发
                                    expand_relLine_fun(curNodeChild, itemLine, km._relLine[lineIndex]);
                                }
                                //更新拖拽渲染点
                                if (document.getElementsByClassName("rel-line-point-start").length > 0) {
                                    if (km.circle.curline === itemLine) {
                                        updateCircleFun(itemLine);
                                    }
                                }
                            });
                        }
                    }, time);
                };
                km._relLine_refresh = function(time) {
                    time = time || 0;
                    setTimeout(function() {
                        var relLineArray = km._relLine || [];
                        var relLineObjArray = km._relLine_obj || [];
                        relLineObjArray.forEach(function(_lineItem, _lineIndex) {
                            _lineItem.remove();
                        });
                        km._relLine_obj = [];
                        relLineArray.forEach(function(_lineItem, _lineIndex) {
                            var new_line = createRelLine(km.getNodeById(_lineItem.startId), km.getNodeById(_lineItem.endId));
                            if (_lineItem.ctrl) {
                                new_line.setOptions({
                                    startSocketGravity: [ _lineItem.ctrl[0].x, _lineItem.ctrl[0].y ],
                                    endSocketGravity: [ _lineItem.ctrl[1].x, _lineItem.ctrl[1].y ]
                                });
                            }
                        });
                    }, time);
                };
            };
            // 关系线的加载
            var LeaderLineRenderer = kity.createClass("LeaderLineRenderer", {
                base: kity.Group,
                constructor: function(node) {
                    this.callBase();
                    this.create();
                },
                create: function() {
                    try {
                        setTimeout(function() {
                            /*rel line*/
                            var relLineArray = km._relLine || [];
                            km._relLine_obj = km._relLine_obj || [];
                            //主动触发初始化
                            InitRelLine();
                            relLineArray.forEach(function(_lineItem, _lineIndex) {
                                var new_line = createRelLine(km.getNodeById(_lineItem.startId), km.getNodeById(_lineItem.endId));
                                if (_lineItem.ctrl) {
                                    new_line.setOptions({
                                        startSocketGravity: [ _lineItem.ctrl[0].x, _lineItem.ctrl[0].y ],
                                        endSocketGravity: [ _lineItem.ctrl[1].x, _lineItem.ctrl[1].y ]
                                    });
                                }
                            });
                        }, 800);
                    } catch (error) {
                        console.log("zhhlog:LeaderLineRenderer:error:" + error);
                    }
                }
            });
            setTimeout(function() {
                InitRelLine();
            }, 1e3);
            return {
                commands: {
                    relLine: RelLineCommand
                },
                renderers: {
                    left: kity.createClass("LeaderLineRenderer", {
                        base: Renderer,
                        create: function(node) {
                            return new LeaderLineRenderer(node);
                        },
                        shouldRender: function(node) {
                            return node.getData("relLine");
                        },
                        update: function(icon, node, box) {}
                    })
                }
            };
        });
    }
};

//src/module/resource.js
_p[62] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("Resource", function() {
            // String Hash
            // https://github.com/drostie/sha3-js/edit/master/blake32.min.js
            var blake32 = function() {
                var k, g, r, l, m, o, p, q, t, w, x;
                x = 4 * (1 << 30);
                k = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
                m = [ 608135816, 2242054355, 320440878, 57701188, 2752067618, 698298832, 137296536, 3964562569, 1160258022, 953160567, 3193202383, 887688300, 3232508343, 3380367581, 1065670069, 3041331479 ];
                w = function(i) {
                    if (i < 0) {
                        i += x;
                    }
                    return ("00000000" + i.toString(16)).slice(-8);
                };
                o = [ [ 16, 50, 84, 118, 152, 186, 220, 254 ], [ 174, 132, 249, 109, 193, 32, 123, 53 ], [ 139, 12, 37, 223, 234, 99, 23, 73 ], [ 151, 19, 205, 235, 98, 165, 4, 143 ], [ 9, 117, 66, 250, 30, 203, 134, 211 ], [ 194, 166, 176, 56, 212, 87, 239, 145 ], [ 92, 241, 222, 164, 112, 54, 41, 184 ], [ 189, 231, 28, 147, 5, 79, 104, 162 ], [ 246, 158, 59, 128, 44, 125, 65, 90 ], [ 42, 72, 103, 81, 191, 233, 195, 13 ] ];
                p = function(a, b, n) {
                    var s = q[a] ^ q[b];
                    q[a] = s >>> n | s << 32 - n;
                };
                g = function(i, a, b, c, d) {
                    var u = l + o[r][i] % 16, v = l + (o[r][i] >> 4);
                    a %= 4;
                    b = 4 + b % 4;
                    c = 8 + c % 4;
                    d = 12 + d % 4;
                    q[a] += q[b] + (t[u] ^ m[v % 16]);
                    p(d, a, 16);
                    q[c] += q[d];
                    p(b, c, 12);
                    q[a] += q[b] + (t[v] ^ m[u % 16]);
                    p(d, a, 8);
                    q[c] += q[d];
                    p(b, c, 7);
                };
                return function(a, b) {
                    if (!(b instanceof Array && b.length === 4)) {
                        b = [ 0, 0, 0, 0 ];
                    }
                    var c, d, e, L, f, h, j, i;
                    d = k.slice(0);
                    c = m.slice(0, 8);
                    for (r = 0; r < 4; r += 1) {
                        c[r] ^= b[r];
                    }
                    e = a.length * 16;
                    f = e % 512 > 446 || e % 512 === 0 ? 0 : e;
                    if (e % 512 === 432) {
                        a += "老";
                    } else {
                        a += "耀";
                        while (a.length % 32 !== 27) {
                            a += "\0";
                        }
                        a += "";
                    }
                    t = [];
                    for (i = 0; i < a.length; i += 2) {
                        t.push(a.charCodeAt(i) * 65536 + a.charCodeAt(i + 1));
                    }
                    t.push(0);
                    t.push(e);
                    h = t.length - 16;
                    j = 0;
                    for (l = 0; l < t.length; l += 16) {
                        j += 512;
                        L = l === h ? f : Math.min(e, j);
                        q = d.concat(c);
                        q[12] ^= L;
                        q[13] ^= L;
                        for (r = 0; r < 10; r += 1) {
                            for (i = 0; i < 8; i += 1) {
                                if (i < 4) {
                                    g(i, i, i, i, i);
                                } else {
                                    g(i, i, i + 1, i + 2, i + 3);
                                }
                            }
                        }
                        for (i = 0; i < 8; i += 1) {
                            d[i] ^= b[i % 4] ^ q[i] ^ q[i + 8];
                        }
                    }
                    return d.map(w).join("");
                };
            }();
            /**
         * 自动使用的颜色序列
         */
            var RESOURCE_COLOR_SERIES = [ 51, 303, 75, 200, 157, 0, 26, 254 ].map(function(h) {
                return kity.Color.createHSL(h, 100, 85);
            });
            /**
         * 在 Minder 上拓展一些关于资源的支持接口
         */
            kity.extendClass(Minder, {
                /**
             * 获取字符串的哈希值
             *
             * @param {String} str
             * @return {Number} hashCode
             */
                getHashCode: function(str) {
                    str = blake32(str);
                    var hash = 1315423911, i, ch;
                    for (i = str.length - 1; i >= 0; i--) {
                        ch = str.charCodeAt(i);
                        hash ^= (hash << 5) + ch + (hash >> 2);
                    }
                    return hash & 2147483647;
                },
                /**
             * 获取脑图中某个资源对应的颜色
             *
             * 如果存在同名资源，则返回已经分配给该资源的颜色，否则分配给该资源一个颜色，并且返回
             *
             * 如果资源数超过颜色序列数量，返回哈希颜色
             *
             * @param {String} resource 资源名称
             * @return {Color}
             */
                getResourceColor: function(resource) {
                    var colorMapping = this._getResourceColorIndexMapping();
                    var nextIndex;
                    if (!Object.prototype.hasOwnProperty.call(colorMapping, resource)) {
                        // 找不到找下个可用索引
                        nextIndex = this._getNextResourceColorIndex();
                        colorMapping[resource] = nextIndex;
                    }
                    // 资源过多，找不到可用索引颜色，统一返回哈希函数得到的颜色
                    return RESOURCE_COLOR_SERIES[colorMapping[resource]] || kity.Color.createHSL(Math.floor(this.getHashCode(resource) / 2147483647 * 359), 100, 85);
                },
                /**
             * 获得已使用的资源的列表
             *
             * @return {Array}
             */
                getUsedResource: function() {
                    var mapping = this._getResourceColorIndexMapping();
                    var used = [], resource;
                    for (resource in mapping) {
                        if (Object.prototype.hasOwnProperty.call(mapping, resource)) {
                            used.push(resource);
                        }
                    }
                    return used;
                },
                /**
             * 获取脑图下一个可用的资源颜色索引
             *
             * @return {int}
             */
                _getNextResourceColorIndex: function() {
                    // 获取现有颜色映射
                    //     resource => color_index
                    var colorMapping = this._getResourceColorIndexMapping();
                    var resource, used, i;
                    used = [];
                    // 抽取已经使用的值到 used 数组
                    for (resource in colorMapping) {
                        if (Object.prototype.hasOwnProperty.call(colorMapping, resource)) {
                            used.push(colorMapping[resource]);
                        }
                    }
                    // 枚举所有的可用值，如果还没被使用，返回
                    for (i = 0; i < RESOURCE_COLOR_SERIES.length; i++) {
                        if (!~used.indexOf(i)) return i;
                    }
                    // 没有可用的颜色了
                    return -1;
                },
                // 获取现有颜色映射
                //     resource => color_index
                _getResourceColorIndexMapping: function() {
                    return this._resourceColorMapping || (this._resourceColorMapping = {});
                }
            });
            /**
         * @class 设置资源的命令
         *
         * @example
         *
         * // 设置选中节点资源为 "张三"
         * minder.execCommand('resource', ['张三']);
         *
         * // 添加资源 "李四" 到选中节点
         * var resource = minder.queryCommandValue();
         * resource.push('李四');
         * minder.execCommand('resource', resource);
         *
         * // 清除选中节点的资源
         * minder.execCommand('resource', null);
         */
            var ResourceCommand = kity.createClass("ResourceCommand", {
                base: Command,
                execute: function(minder, resource) {
                    var nodes = minder.getSelectedNodes();
                    if (typeof resource == "string") {
                        resource = [ resource ];
                    }
                    nodes.forEach(function(node) {
                        node.setData("resource", resource).render();
                    });
                    minder.layout(200);
                },
                queryValue: function(minder) {
                    var nodes = minder.getSelectedNodes();
                    var resource = [];
                    nodes.forEach(function(node) {
                        var nodeResource = node.getData("resource");
                        if (!nodeResource) return;
                        nodeResource.forEach(function(name) {
                            if (!~resource.indexOf(name)) {
                                resource.push(name);
                            }
                        });
                    });
                    return resource;
                },
                queryState: function(km) {
                    return km.getSelectedNode() ? 0 : -1;
                }
            });
            /**
         * @class 资源的覆盖图形
         *
         * 该类为一个资源以指定的颜色渲染一个动态的覆盖图形
         */
            var ResourceOverlay = kity.createClass("ResourceOverlay", {
                base: kity.Group,
                constructor: function() {
                    this.callBase();
                    var text, rect;
                    rect = this.rect = new kity.Rect().setRadius(4);
                    text = this.text = new kity.Text().setFontSize(12).setVerticalAlign("middle");
                    this.addShapes([ rect, text ]);
                },
                setValue: function(resourceName, color) {
                    var paddingX = 8, paddingY = 4, borderRadius = 4;
                    var text, box, rect;
                    text = this.text;
                    if (resourceName == this.lastResourceName) {
                        box = this.lastBox;
                    } else {
                        text.setContent(resourceName);
                        box = text.getBoundaryBox();
                        this.lastResourceName = resourceName;
                        this.lastBox = box;
                    }
                    text.setX(paddingX).fill(color.dec("l", 70));
                    rect = this.rect;
                    rect.setPosition(0, box.y - paddingY);
                    this.width = Math.round(box.width + paddingX * 2);
                    this.height = Math.round(box.height + paddingY * 2);
                    rect.setSize(this.width, this.height);
                    rect.fill(color);
                }
            });
            /**
         * @class 资源渲染器
         */
            var ResourceRenderer = kity.createClass("ResourceRenderer", {
                base: Renderer,
                create: function(node) {
                    this.overlays = [];
                    return new kity.Group();
                },
                shouldRender: function(node) {
                    return node.getData("resource") && node.getData("resource").length;
                },
                update: function(container, node, box) {
                    var spaceRight = node.getStyle("space-right");
                    var overlays = this.overlays;
                    /*  修复 resource 数组中出现 null 的 bug
                 *  @Author zhangbobell
                 *  @date 2016-01-15
                 */
                    var resource = node.getData("resource").filter(function(ele) {
                        return ele !== null;
                    });
                    if (resource.length === 0) {
                        return;
                    }
                    var minder = node.getMinder();
                    var i, overlay, x;
                    x = 0;
                    for (i = 0; i < resource.length; i++) {
                        x += spaceRight;
                        overlay = overlays[i];
                        if (!overlay) {
                            overlay = new ResourceOverlay();
                            overlays.push(overlay);
                            container.addShape(overlay);
                        }
                        overlay.setVisible(true);
                        overlay.setValue(resource[i], minder.getResourceColor(resource[i]));
                        overlay.setTranslate(x, -1);
                        x += overlay.width;
                    }
                    while (overlay = overlays[i++]) overlay.setVisible(false);
                    container.setTranslate(box.right, 0);
                    return new kity.Box({
                        x: box.right,
                        y: Math.round(-overlays[0].height / 2),
                        width: x,
                        height: overlays[0].height
                    });
                }
            });
            return {
                commands: {
                    resource: ResourceCommand
                },
                renderers: {
                    right: ResourceRenderer
                }
            };
        });
    }
};

//src/module/select.js
_p[63] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("Select", function() {
            var minder = this;
            var rc = minder.getRenderContainer();
            // 在实例上渲染框选矩形、计算框选范围的对象
            var marqueeActivator = function() {
                // 记录选区的开始位置（mousedown的位置）
                var startPosition = null;
                // 选区的图形
                var marqueeShape = new kity.Path();
                // 标记是否已经启动框选状态
                //    并不是 mousedown 发生之后就启动框选状态，而是检测到移动了一定的距离（MARQUEE_MODE_THRESHOLD）之后
                var marqueeMode = false;
                var MARQUEE_MODE_THRESHOLD = 10;
                return {
                    selectStart: function(e) {
                        // 只接受左键
                        if (e.originEvent.button || e.originEvent.altKey) return;
                        // 清理不正确状态
                        if (startPosition) {
                            return this.selectEnd();
                        }
                        startPosition = e.getPosition(rc).round();
                    },
                    selectMove: function(e) {
                        if (minder.getStatus() == "textedit") {
                            return;
                        }
                        if (!startPosition) return;
                        var p1 = startPosition, p2 = e.getPosition(rc);
                        // 检测是否要进入选区模式
                        if (!marqueeMode) {
                            // 距离没达到阈值，退出
                            if (kity.Vector.fromPoints(p1, p2).length() < MARQUEE_MODE_THRESHOLD) {
                                return;
                            }
                            // 已经达到阈值，记录下来并且重置选区形状
                            marqueeMode = true;
                            rc.addShape(marqueeShape);
                            marqueeShape.fill(minder.getStyle("marquee-background")).stroke(minder.getStyle("marquee-stroke")).setOpacity(.8).getDrawer().clear();
                        }
                        var marquee = new kity.Box(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y), selectedNodes = [];
                        // 使其犀利
                        marquee.left = Math.round(marquee.left);
                        marquee.top = Math.round(marquee.top);
                        marquee.right = Math.round(marquee.right);
                        marquee.bottom = Math.round(marquee.bottom);
                        // 选区形状更新
                        marqueeShape.getDrawer().pipe(function() {
                            this.clear();
                            this.moveTo(marquee.left, marquee.top);
                            this.lineTo(marquee.right, marquee.top);
                            this.lineTo(marquee.right, marquee.bottom);
                            this.lineTo(marquee.left, marquee.bottom);
                            this.close();
                        });
                        // 计算选中范围
                        minder.getRoot().traverse(function(node) {
                            var renderBox = node.getLayoutBox();
                            if (!renderBox.intersect(marquee).isEmpty()) {
                                selectedNodes.push(node);
                            }
                        });
                        // 应用选中范围
                        minder.select(selectedNodes, true);
                        // 清除多余的东西
                        window.getSelection().removeAllRanges();
                    },
                    selectEnd: function(e) {
                        if (startPosition) {
                            startPosition = null;
                        }
                        if (marqueeMode) {
                            marqueeShape.fadeOut(200, "ease", 0, function() {
                                if (marqueeShape.remove) marqueeShape.remove();
                            });
                            marqueeMode = false;
                        }
                    }
                };
            }();
            var lastDownNode = null, lastDownPosition = null;
            return {
                init: function() {
                    window.addEventListener("mouseup", function() {
                        marqueeActivator.selectEnd();
                    });
                },
                events: {
                    mousedown: function(e) {
                        var downNode = e.getTargetNode();
                        // 没有点中节点：
                        //     清除选中状态，并且标记选区开始位置
                        if (!downNode) {
                            this.removeAllSelectedNodes();
                            marqueeActivator.selectStart(e);
                            this.setStatus("normal");
                        } else if (e.isShortcutKey("Ctrl")) {
                            this.toggleSelect(downNode);
                        } else if (!downNode.isSelected()) {
                            this.select(downNode, true);
                        } else if (!this.isSingleSelect()) {
                            lastDownNode = downNode;
                            lastDownPosition = e.getPosition();
                        }
                    },
                    mousemove: marqueeActivator.selectMove,
                    mouseup: function(e) {
                        var upNode = e.getTargetNode();
                        // 如果 mouseup 发生在 lastDownNode 外，是无需理会的
                        if (upNode && upNode == lastDownNode) {
                            var upPosition = e.getPosition();
                            var movement = kity.Vector.fromPoints(lastDownPosition, upPosition);
                            if (movement.length() < 1) this.select(lastDownNode, true);
                            lastDownNode = null;
                        }
                        // 清理一下选择状态
                        marqueeActivator.selectEnd(e);
                    },
                    //全选操作
                    "normal.keydown": function(e) {
                        if (e.isShortcutKey("ctrl+a")) {
                            var selectedNodes = [];
                            this.getRoot().traverse(function(node) {
                                selectedNodes.push(node);
                            });
                            this.select(selectedNodes, true);
                            e.preventDefault();
                        }
                    }
                }
            };
        });
    }
};

//src/module/style.js
_p[64] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("StyleModule", function() {
            var styleNames = [ "font-size", "font-family", "font-weight", "font-style", "background", "color" ];
            var styleClipBoard = null;
            function hasStyle(node) {
                var data = node.getData();
                for (var i = 0; i < styleNames.length; i++) {
                    if (styleNames[i] in data) return true;
                }
            }
            return {
                commands: {
                    /**
                 * @command CopyStyle
                 * @description 拷贝选中节点的当前样式，包括字体、字号、粗体、斜体、背景色、字体色
                 * @state
                 *   0: 当前有选中的节点
                 *  -1: 当前没有选中的节点
                 */
                    copystyle: kity.createClass("CopyStyleCommand", {
                        base: Command,
                        execute: function(minder) {
                            var node = minder.getSelectedNode();
                            var nodeData = node.getData();
                            styleClipBoard = {};
                            styleNames.forEach(function(name) {
                                if (name in nodeData) styleClipBoard[name] = nodeData[name]; else {
                                    styleClipBoard[name] = null;
                                    delete styleClipBoard[name];
                                }
                            });
                            return styleClipBoard;
                        },
                        queryState: function(minder) {
                            var nodes = minder.getSelectedNodes();
                            if (nodes.length !== 1) return -1;
                            return hasStyle(nodes[0]) ? 0 : -1;
                        }
                    }),
                    /**
                 * @command PasteStyle
                 * @description 粘贴已拷贝的样式到选中的节点上，包括字体、字号、粗体、斜体、背景色、字体色
                 * @state
                 *   0: 当前有选中的节点，并且已经有复制的样式
                 *  -1: 当前没有选中的节点，或者没有复制的样式
                 */
                    pastestyle: kity.createClass("PastStyleCommand", {
                        base: Command,
                        execute: function(minder) {
                            minder.getSelectedNodes().forEach(function(node) {
                                for (var name in styleClipBoard) {
                                    if (styleClipBoard.hasOwnProperty(name)) node.setData(name, styleClipBoard[name]);
                                }
                            });
                            minder.renderNodeBatch(minder.getSelectedNodes());
                            minder.layout(300);
                            return styleClipBoard;
                        },
                        queryState: function(minder) {
                            return styleClipBoard && minder.getSelectedNodes().length ? 0 : -1;
                        }
                    }),
                    /**
                 * @command ClearStyle
                 * @description 移除选中节点的样式，包括字体、字号、粗体、斜体、背景色、字体色
                 * @state
                 *   0: 当前有选中的节点，并且至少有一个设置了至少一种样式
                 *  -1: 其它情况
                 */
                    clearstyle: kity.createClass("ClearStyleCommand", {
                        base: Command,
                        execute: function(minder) {
                            minder.getSelectedNodes().forEach(function(node) {
                                styleNames.forEach(function(name) {
                                    node.setData(name);
                                });
                            });
                            minder.renderNodeBatch(minder.getSelectedNodes());
                            minder.layout(300);
                            return styleClipBoard;
                        },
                        queryState: function(minder) {
                            var nodes = minder.getSelectedNodes();
                            if (!nodes.length) return -1;
                            for (var i = 0; i < nodes.length; i++) {
                                if (hasStyle(nodes[i])) return 0;
                            }
                            return -1;
                        }
                    })
                }
            };
        });
    }
};

//src/module/text.js
_p[65] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        /**
     * 针对不同系统、不同浏览器、不同字体做居中兼容性处理
     * 暂时未增加Linux的处理
     */
        var FONT_ADJUST = {
            safari: {
                "微软雅黑,Microsoft YaHei": -.17,
                "楷体,楷体_GB2312,SimKai": -.1,
                "隶书, SimLi": -.1,
                "comic sans ms": -.23,
                "impact,chicago": -.15,
                "times new roman": -.1,
                "arial black,avant garde": -.17,
                default: 0
            },
            ie: {
                10: {
                    "微软雅黑,Microsoft YaHei": -.17,
                    "comic sans ms": -.17,
                    "impact,chicago": -.08,
                    "times new roman": .04,
                    "arial black,avant garde": -.17,
                    default: -.15
                },
                11: {
                    "微软雅黑,Microsoft YaHei": -.17,
                    "arial,helvetica,sans-serif": -.17,
                    "comic sans ms": -.17,
                    "impact,chicago": -.08,
                    "times new roman": .04,
                    "sans-serif": -.16,
                    "arial black,avant garde": -.17,
                    default: -.15
                }
            },
            edge: {
                "微软雅黑,Microsoft YaHei": -.15,
                "arial,helvetica,sans-serif": -.17,
                "comic sans ms": -.17,
                "impact,chicago": -.08,
                "sans-serif": -.16,
                "arial black,avant garde": -.17,
                default: -.15
            },
            sg: {
                "微软雅黑,Microsoft YaHei": -.15,
                "arial,helvetica,sans-serif": -.05,
                "comic sans ms": -.22,
                "impact,chicago": -.16,
                "times new roman": -.03,
                "arial black,avant garde": -.22,
                default: -.15
            },
            chrome: {
                Mac: {
                    "andale mono": -.05,
                    "comic sans ms": -.3,
                    "impact,chicago": -.13,
                    "times new roman": -.1,
                    "arial black,avant garde": -.17,
                    default: 0
                },
                Win: {
                    "微软雅黑,Microsoft YaHei": -.15,
                    "arial,helvetica,sans-serif": -.02,
                    "arial black,avant garde": -.2,
                    "comic sans ms": -.2,
                    "impact,chicago": -.12,
                    "times new roman": -.02,
                    default: -.15
                },
                Lux: {
                    "andale mono": -.05,
                    "comic sans ms": -.3,
                    "impact,chicago": -.13,
                    "times new roman": -.1,
                    "arial black,avant garde": -.17,
                    default: 0
                }
            },
            firefox: {
                Mac: {
                    "微软雅黑,Microsoft YaHei": -.2,
                    "宋体,SimSun": .05,
                    "comic sans ms": -.2,
                    "impact,chicago": -.15,
                    "arial black,avant garde": -.17,
                    "times new roman": -.1,
                    default: .05
                },
                Win: {
                    "微软雅黑,Microsoft YaHei": -.16,
                    "andale mono": -.17,
                    "arial,helvetica,sans-serif": -.17,
                    "comic sans ms": -.22,
                    "impact,chicago": -.23,
                    "times new roman": -.22,
                    "sans-serif": -.22,
                    "arial black,avant garde": -.17,
                    default: -.16
                },
                Lux: {
                    "宋体,SimSun": -.2,
                    "微软雅黑,Microsoft YaHei": -.2,
                    "黑体, SimHei": -.2,
                    "隶书, SimLi": -.2,
                    "楷体,楷体_GB2312,SimKai": -.2,
                    "andale mono": -.2,
                    "arial,helvetica,sans-serif": -.2,
                    "comic sans ms": -.2,
                    "impact,chicago": -.2,
                    "times new roman": -.2,
                    "sans-serif": -.2,
                    "arial black,avant garde": -.2,
                    default: -.16
                }
            }
        };
        var TextRenderer = kity.createClass("TextRenderer", {
            base: Renderer,
            create: function() {
                return new kity.Group().setId(utils.uuid("node_text"));
            },
            update: function(textGroup, node) {
                function getDataOrStyle(name) {
                    return node.getData(name) || node.getStyle(name);
                }
                var nodeText = node.getText();
                var textArr = nodeText ? nodeText.split("\n") : [ " " ];
                var lineHeight = node.getStyle("line-height");
                var fontSize = getDataOrStyle("font-size");
                var fontFamily = getDataOrStyle("font-family") || "default";
                var height = lineHeight * fontSize * textArr.length - (lineHeight - 1) * fontSize;
                var yStart = -height / 2;
                var Browser = kity.Browser;
                var adjust;
                if (Browser.chrome || Browser.opera || Browser.bd || Browser.lb === "chrome") {
                    adjust = FONT_ADJUST["chrome"][Browser.platform][fontFamily];
                } else if (Browser.gecko) {
                    adjust = FONT_ADJUST["firefox"][Browser.platform][fontFamily];
                } else if (Browser.sg) {
                    adjust = FONT_ADJUST["sg"][fontFamily];
                } else if (Browser.safari) {
                    adjust = FONT_ADJUST["safari"][fontFamily];
                } else if (Browser.ie) {
                    adjust = FONT_ADJUST["ie"][Browser.version][fontFamily];
                } else if (Browser.edge) {
                    adjust = FONT_ADJUST["edge"][fontFamily];
                } else if (Browser.lb) {
                    // 猎豹浏览器的ie内核兼容性模式下
                    adjust = .9;
                }
                textGroup.setTranslate(0, (adjust || 0) * fontSize);
                var rBox = new kity.Box(), r = Math.round;
                this.setTextStyle(node, textGroup);
                var textLength = textArr.length;
                var textGroupLength = textGroup.getItems().length;
                var i, ci, textShape, text;
                if (textLength < textGroupLength) {
                    for (i = textLength, ci; ci = textGroup.getItem(i); ) {
                        textGroup.removeItem(i);
                    }
                } else if (textLength > textGroupLength) {
                    var growth = textLength - textGroupLength;
                    while (growth--) {
                        textShape = new kity.Text().setAttr("text-rendering", "inherit");
                        if (kity.Browser.ie || kity.Browser.edge) {
                            textShape.setVerticalAlign("top");
                        } else {
                            textShape.setAttr("dominant-baseline", "text-before-edge");
                        }
                        textGroup.addItem(textShape);
                    }
                }
                for (i = 0, text, textShape; text = textArr[i], textShape = textGroup.getItem(i); i++) {
                    textShape.setContent(text);
                    if (kity.Browser.ie || kity.Browser.edge) {
                        textShape.fixPosition();
                    }
                }
                this.setTextStyle(node, textGroup);
                var textHash = node.getText() + [ "font-size", "font-name", "font-weight", "font-style" ].map(getDataOrStyle).join("/");
                if (node._currentTextHash == textHash && node._currentTextGroupBox) return node._currentTextGroupBox;
                node._currentTextHash = textHash;
                return function() {
                    textGroup.eachItem(function(i, textShape) {
                        var y = yStart + i * fontSize * lineHeight;
                        textShape.setY(y);
                        var bbox = textShape.getBoundaryBox();
                        rBox = rBox.merge(new kity.Box(0, y, bbox.height && bbox.width || 1, fontSize));
                    });
                    var nBox = new kity.Box(r(rBox.x), r(rBox.y), r(rBox.width), r(rBox.height));
                    node._currentTextGroupBox = nBox;
                    return nBox;
                };
            },
            setTextStyle: function(node, text) {
                var hooks = TextRenderer._styleHooks;
                hooks.forEach(function(hook) {
                    hook(node, text);
                });
            }
        });
        var TextCommand = kity.createClass({
            base: Command,
            execute: function(minder, text) {
                var node = minder.getSelectedNode();
                if (node) {
                    node.setText(text);
                    node.render();
                    minder.layout();
                }
            },
            queryState: function(minder) {
                return minder.getSelectedNodes().length == 1 ? 0 : -1;
            },
            queryValue: function(minder) {
                var node = minder.getSelectedNode();
                return node ? node.getText() : null;
            }
        });
        utils.extend(TextRenderer, {
            _styleHooks: [],
            registerStyleHook: function(fn) {
                TextRenderer._styleHooks.push(fn);
            }
        });
        kity.extendClass(MinderNode, {
            getTextGroup: function() {
                return this.getRenderer("TextRenderer").getRenderShape();
            }
        });
        Module.register("text", {
            commands: {
                text: TextCommand
            },
            renderers: {
                center: TextRenderer
            }
        });
        module.exports = TextRenderer;
    }
};

//src/module/view.js
_p[66] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        var ViewDragger = kity.createClass("ViewDragger", {
            constructor: function(minder) {
                this._minder = minder;
                this._enabled = false;
                this._bind();
                var me = this;
                this._minder.getViewDragger = function() {
                    return me;
                };
                this.setEnabled(false);
            },
            isEnabled: function() {
                return this._enabled;
            },
            setEnabled: function(value) {
                var paper = this._minder.getPaper();
                paper.setStyle("cursor", value ? "pointer" : "default");
                paper.setStyle("cursor", value ? "-webkit-grab" : "default");
                this._enabled = value;
            },
            timeline: function() {
                return this._moveTimeline;
            },
            move: function(offset, duration) {
                var minder = this._minder;
                var targetPosition = this.getMovement().offset(offset);
                this.moveTo(targetPosition, duration);
            },
            moveTo: function(position, duration) {
                if (duration) {
                    var dragger = this;
                    if (this._moveTimeline) this._moveTimeline.stop();
                    this._moveTimeline = this._minder.getRenderContainer().animate(new kity.Animator(this.getMovement(), position, function(target, value) {
                        dragger.moveTo(value);
                    }), duration, "easeOutCubic").timeline();
                    this._moveTimeline.on("finish", function() {
                        dragger._moveTimeline = null;
                    });
                    return this;
                }
                this._minder.getRenderContainer().setTranslate(position.round());
                this._minder.fire("viewchange");
                // console.log("zhhlog:view:moveTo");
                if (typeof this._minder._relLine_render === "function") {
                    this._minder._relLine_render();
                }
            },
            getMovement: function() {
                var translate = this._minder.getRenderContainer().transform.translate;
                return translate ? translate[0] : new kity.Point();
            },
            getView: function() {
                var minder = this._minder;
                var c = minder._lastClientSize || {
                    width: minder.getRenderTarget().clientWidth,
                    height: minder.getRenderTarget().clientHeight
                };
                var m = this.getMovement();
                var box = new kity.Box(0, 0, c.width, c.height);
                var viewMatrix = minder.getPaper().getViewPortMatrix();
                return viewMatrix.inverse().translate(-m.x, -m.y).transformBox(box);
            },
            _bind: function() {
                var dragger = this, isTempDrag = false, lastPosition = null, currentPosition = null;
                function dragEnd(e) {
                    if (!lastPosition) return;
                    lastPosition = null;
                    e.stopPropagation();
                    // 临时拖动需要还原状态
                    if (isTempDrag) {
                        dragger.setEnabled(false);
                        isTempDrag = false;
                        if (dragger._minder.getStatus() == "hand") dragger._minder.rollbackStatus();
                    }
                    var paper = dragger._minder.getPaper();
                    paper.setStyle("cursor", dragger._minder.getStatus() == "hand" ? "-webkit-grab" : "default");
                    dragger._minder.fire("viewchanged");
                }
                this._minder.on("normal.mousedown normal.touchstart " + "inputready.mousedown inputready.touchstart " + "readonly.mousedown readonly.touchstart", function(e) {
                    if (e.originEvent.button == 2) {
                        e.originEvent.preventDefault();
                    }
                    // 点击未选中的根节点临时开启
                    if (e.getTargetNode() == this.getRoot() || e.originEvent.button == 2 || e.originEvent.altKey) {
                        lastPosition = e.getPosition("view");
                        isTempDrag = true;
                    }
                }).on("normal.mousemove normal.touchmove " + "readonly.mousemove readonly.touchmove " + "inputready.mousemove inputready.touchmove", function(e) {
                    if (e.type == "touchmove") {
                        e.preventDefault();
                    }
                    if (!isTempDrag) return;
                    var offset = kity.Vector.fromPoints(lastPosition, e.getPosition("view"));
                    if (offset.length() > 10) {
                        this.setStatus("hand", true);
                        var paper = dragger._minder.getPaper();
                        paper.setStyle("cursor", "-webkit-grabbing");
                    }
                }).on("hand.beforemousedown hand.beforetouchstart", function(e) {
                    // 已经被用户打开拖放模式
                    if (dragger.isEnabled()) {
                        lastPosition = e.getPosition("view");
                        e.stopPropagation();
                        var paper = dragger._minder.getPaper();
                        paper.setStyle("cursor", "-webkit-grabbing");
                    }
                }).on("hand.beforemousemove hand.beforetouchmove", function(e) {
                    if (lastPosition) {
                        currentPosition = e.getPosition("view");
                        // 当前偏移加上历史偏移
                        var offset = kity.Vector.fromPoints(lastPosition, currentPosition);
                        dragger.move(offset);
                        e.stopPropagation();
                        e.preventDefault();
                        e.originEvent.preventDefault();
                        lastPosition = currentPosition;
                    }
                }).on("mouseup touchend", dragEnd);
                window.addEventListener("mouseup", dragEnd);
                this._minder.on("contextmenu", function(e) {
                    e.preventDefault();
                });
            }
        });
        Module.register("View", function() {
            var km = this;
            /**
         * @command Hand
         * @description 切换抓手状态，抓手状态下，鼠标拖动将拖动视野，而不是创建选区
         * @state
         *   0: 当前不是抓手状态
         *   1: 当前是抓手状态
         */
            var ToggleHandCommand = kity.createClass("ToggleHandCommand", {
                base: Command,
                execute: function(minder) {
                    if (minder.getStatus() != "hand") {
                        minder.setStatus("hand", true);
                    } else {
                        minder.rollbackStatus();
                    }
                    this.setContentChanged(false);
                },
                queryState: function(minder) {
                    return minder.getStatus() == "hand" ? 1 : 0;
                },
                enableReadOnly: true
            });
            /**
         * @command Camera
         * @description 设置当前视野的中心位置到某个节点上
         * @param {kityminder.MinderNode} focusNode 要定位的节点
         * @param {number} duration 设置视野移动的动画时长（单位 ms），设置为 0 不使用动画
         * @state
         *   0: 始终可用
         */
            var CameraCommand = kity.createClass("CameraCommand", {
                base: Command,
                execute: function(km, focusNode) {
                    focusNode = focusNode || km.getRoot();
                    var viewport = km.getPaper().getViewPort();
                    var offset = focusNode.getRenderContainer().getRenderBox("view");
                    var dx = viewport.center.x - offset.x - offset.width / 2, dy = viewport.center.y - offset.y;
                    var dragger = km._viewDragger;
                    var duration = km.getOption("viewAnimationDuration");
                    dragger.move(new kity.Point(dx, dy), duration);
                    this.setContentChanged(false);
                },
                enableReadOnly: true
            });
            /**
         * @command Move
         * @description 指定方向移动当前视野
         * @param {string} dir 移动方向
         *    取值为 'left'，视野向左移动一半
         *    取值为 'right'，视野向右移动一半
         *    取值为 'up'，视野向上移动一半
         *    取值为 'down'，视野向下移动一半
         * @param {number} duration 视野移动的动画时长（单位 ms），设置为 0 不使用动画
         * @state
         *   0: 始终可用
         */
            var MoveCommand = kity.createClass("MoveCommand", {
                base: Command,
                execute: function(km, dir) {
                    var dragger = km._viewDragger;
                    var size = km._lastClientSize;
                    var duration = km.getOption("viewAnimationDuration");
                    switch (dir) {
                      case "up":
                        dragger.move(new kity.Point(0, size.height / 2), duration);
                        break;

                      case "down":
                        dragger.move(new kity.Point(0, -size.height / 2), duration);
                        break;

                      case "left":
                        dragger.move(new kity.Point(size.width / 2, 0), duration);
                        break;

                      case "right":
                        dragger.move(new kity.Point(-size.width / 2, 0), duration);
                        break;
                    }
                },
                enableReadOnly: true
            });
            return {
                init: function() {
                    this._viewDragger = new ViewDragger(this);
                },
                commands: {
                    hand: ToggleHandCommand,
                    camera: CameraCommand,
                    move: MoveCommand
                },
                events: {
                    statuschange: function(e) {
                        this._viewDragger.setEnabled(e.currentStatus == "hand");
                    },
                    mousewheel: function(e) {
                        var dx, dy;
                        e = e.originEvent;
                        if (e.ctrlKey || e.shiftKey) return;
                        if ("wheelDeltaX" in e) {
                            dx = e.wheelDeltaX || 0;
                            dy = e.wheelDeltaY || 0;
                        } else {
                            dx = 0;
                            dy = e.wheelDelta;
                        }
                        this._viewDragger.move({
                            x: dx / 2.5,
                            y: dy / 2.5
                        });
                        var me = this;
                        clearTimeout(this._mousewheeltimer);
                        this._mousewheeltimer = setTimeout(function() {
                            me.fire("viewchanged");
                        }, 100);
                        e.preventDefault();
                    },
                    "normal.dblclick readonly.dblclick": function(e) {
                        if (e.kityEvent.targetShape instanceof kity.Paper) {
                            this.execCommand("camera", this.getRoot(), 800);
                        }
                    },
                    "paperrender finishInitHook": function() {
                        if (!this.getRenderTarget()) {
                            return;
                        }
                        this.execCommand("camera", null, 0);
                        this._lastClientSize = {
                            width: this.getRenderTarget().clientWidth,
                            height: this.getRenderTarget().clientHeight
                        };
                    },
                    resize: function(e) {
                        var a = {
                            width: this.getRenderTarget().clientWidth,
                            height: this.getRenderTarget().clientHeight
                        }, b = this._lastClientSize;
                        this._viewDragger.move(new kity.Point((a.width - b.width) / 2 | 0, (a.height - b.height) / 2 | 0));
                        this._lastClientSize = a;
                    },
                    "selectionchange layoutallfinish": function(e) {
                        var selected = this.getSelectedNode();
                        var minder = this;
                        /*
                     * Added by zhangbobell 2015.9.9
                     * windows 10 的 edge 浏览器在全部动画停止后，优先级图标不显示 text，
                     * 因此再次触发一次 render 事件，让浏览器重绘
                     * */
                        if (kity.Browser.edge) {
                            this.fire("paperrender");
                        }
                        if (!selected) return;
                        var dragger = this._viewDragger;
                        var timeline = dragger.timeline();
                        /*
                     * Added by zhangbobell 2015.09.25
                     * 如果之前有动画，那么就先暂时返回，等之前动画结束之后再次执行本函数
                     * 以防止 view 动画变动了位置，导致本函数执行的时候位置计算不对
                     *
                     * fixed bug : 初始化的时候中心节点位置不固定（有的时候在左上角，有的时候在中心）
                     * */
                        if (timeline) {
                            timeline.on("finish", function() {
                                minder.fire("selectionchange");
                            });
                            return;
                        }
                        var view = dragger.getView();
                        var focus = selected.getLayoutBox();
                        var space = 50;
                        var dx = 0, dy = 0;
                        if (focus.right > view.right) {
                            dx += view.right - focus.right - space;
                        } else if (focus.left < view.left) {
                            dx += view.left - focus.left + space;
                        }
                        if (focus.bottom > view.bottom) {
                            dy += view.bottom - focus.bottom - space;
                        }
                        if (focus.top < view.top) {
                            dy += view.top - focus.top + space;
                        }
                        if (dx || dy) dragger.move(new kity.Point(dx, dy), 100);
                    }
                }
            };
        });
    }
};

//src/module/zoom.js
_p[67] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var utils = _p.r(35);
        var Minder = _p.r(21);
        var MinderNode = _p.r(23);
        var Command = _p.r(11);
        var Module = _p.r(22);
        var Renderer = _p.r(29);
        Module.register("Zoom", function() {
            var me = this;
            var timeline;
            function setTextRendering() {
                var value = me._zoomValue >= 100 ? "optimize-speed" : "geometricPrecision";
                me.getRenderContainer().setAttr("text-rendering", value);
            }
            function fixPaperCTM(paper) {
                var node = paper.shapeNode;
                var ctm = node.getCTM();
                var matrix = new kity.Matrix(ctm.a, ctm.b, ctm.c, ctm.d, (ctm.e | 0) + .5, (ctm.f | 0) + .5);
                node.setAttribute("transform", "matrix(" + matrix.toString() + ")");
            }
            kity.extendClass(Minder, {
                zoom: function(value) {
                    var paper = this.getPaper();
                    var viewport = paper.getViewPort();
                    viewport.zoom = value / 100;
                    viewport.center = {
                        x: viewport.center.x,
                        y: viewport.center.y
                    };
                    paper.setViewPort(viewport);
                    if (value == 100) fixPaperCTM(paper);
                    //放缩触发点
                    // console.log("zhhlog:zoom:zoom");
                    if (typeof this._relLine_render === "function") {
                        this._relLine_render();
                    }
                },
                getZoomValue: function() {
                    return this._zoomValue;
                }
            });
            function zoomMinder(minder, value) {
                var paper = minder.getPaper();
                var viewport = paper.getViewPort();
                if (!value) return;
                setTextRendering();
                var duration = minder.getOption("zoomAnimationDuration");
                if (minder.getRoot().getComplex() > 200 || !duration) {
                    minder._zoomValue = value;
                    minder.zoom(value);
                    minder.fire("viewchange");
                } else {
                    var animator = new kity.Animator({
                        beginValue: minder._zoomValue,
                        finishValue: value,
                        setter: function(target, value) {
                            target.zoom(value);
                        }
                    });
                    minder._zoomValue = value;
                    if (timeline) {
                        timeline.pause();
                    }
                    timeline = animator.start(minder, duration, "easeInOutSine");
                    timeline.on("finish", function() {
                        minder.fire("viewchange");
                    });
                }
                minder.fire("zoom", {
                    zoom: value
                });
            }
            /**
         * @command Zoom
         * @description 缩放当前的视野到一定的比例（百分比）
         * @param {number} value 设置的比例，取值 100 则为原尺寸
         * @state
         *   0: 始终可用
         */
            var ZoomCommand = kity.createClass("Zoom", {
                base: Command,
                execute: zoomMinder,
                queryValue: function(minder) {
                    return minder._zoomValue;
                }
            });
            /**
         * @command ZoomIn
         * @description 放大当前的视野到下一个比例等级（百分比）
         * @shortcut =
         * @state
         *   0: 如果当前脑图的配置中还有下一个比例等级
         *  -1: 其它情况
         */
            var ZoomInCommand = kity.createClass("ZoomInCommand", {
                base: Command,
                execute: function(minder) {
                    zoomMinder(minder, this.nextValue(minder));
                },
                queryState: function(minder) {
                    return +!this.nextValue(minder);
                },
                nextValue: function(minder) {
                    var stack = minder.getOption("zoom"), i;
                    for (i = 0; i < stack.length; i++) {
                        if (stack[i] > minder._zoomValue) return stack[i];
                    }
                    return 0;
                },
                enableReadOnly: true
            });
            /**
         * @command ZoomOut
         * @description 缩小当前的视野到上一个比例等级（百分比）
         * @shortcut -
         * @state
         *   0: 如果当前脑图的配置中还有上一个比例等级
         *  -1: 其它情况
         */
            var ZoomOutCommand = kity.createClass("ZoomOutCommand", {
                base: Command,
                execute: function(minder) {
                    zoomMinder(minder, this.nextValue(minder));
                },
                queryState: function(minder) {
                    return +!this.nextValue(minder);
                },
                nextValue: function(minder) {
                    var stack = minder.getOption("zoom"), i;
                    for (i = stack.length - 1; i >= 0; i--) {
                        if (stack[i] < minder._zoomValue) return stack[i];
                    }
                    return 0;
                },
                enableReadOnly: true
            });
            return {
                init: function() {
                    this._zoomValue = 100;
                    this.setDefaultOptions({
                        zoom: [ 10, 20, 50, 100, 200 ]
                    });
                    setTextRendering();
                },
                commands: {
                    zoomin: ZoomInCommand,
                    zoomout: ZoomOutCommand,
                    zoom: ZoomCommand
                },
                events: {
                    "normal.mousewheel readonly.mousewheel": function(e) {
                        if (!e.originEvent.ctrlKey && !e.originEvent.metaKey) return;
                        var delta = e.originEvent.wheelDelta;
                        var me = this;
                        // 稀释
                        if (Math.abs(delta) > 100) {
                            clearTimeout(this._wheelZoomTimeout);
                        } else {
                            return;
                        }
                        this._wheelZoomTimeout = setTimeout(function() {
                            var value;
                            var lastValue = me.getPaper()._zoom || 1;
                            if (delta > 0) {
                                me.execCommand("zoomin");
                            } else if (delta < 0) {
                                me.execCommand("zoomout");
                            }
                        }, 100);
                        e.originEvent.preventDefault();
                    }
                },
                commandShortcutKeys: {
                    zoomin: "ctrl+=",
                    zoomout: "ctrl+-"
                }
            };
        });
    }
};

//src/protocol/json.js
_p[68] = {
    value: function(require, exports, module) {
        var data = _p.r(14);
        data.registerProtocol("json", module.exports = {
            fileDescription: "KityMinder 格式",
            fileExtension: ".km",
            dataType: "text",
            mineType: "application/json",
            encode: function(json) {
                return JSON.stringify(json);
            },
            decode: function(local) {
                return JSON.parse(local);
            }
        });
    }
};

//src/protocol/markdown.js
_p[69] = {
    value: function(require, exports, module) {
        var data = _p.r(14);
        var LINE_ENDING_SPLITER = /\r\n|\r|\n/;
        var EMPTY_LINE = "";
        var NOTE_MARK_START = "\x3c!--Note--\x3e";
        var NOTE_MARK_CLOSE = "\x3c!--/Note--\x3e";
        function encode(json) {
            return _build(json, 1).join("\n");
        }
        function _build(node, level) {
            var lines = [];
            level = level || 1;
            var sharps = _generateHeaderSharp(level);
            lines.push(sharps + " " + node.data.text);
            lines.push(EMPTY_LINE);
            var note = node.data.note;
            if (note) {
                var hasSharp = /^#/.test(note);
                if (hasSharp) {
                    lines.push(NOTE_MARK_START);
                    note = note.replace(/^#+/gm, function($0) {
                        return sharps + $0;
                    });
                }
                lines.push(note);
                if (hasSharp) {
                    lines.push(NOTE_MARK_CLOSE);
                }
                lines.push(EMPTY_LINE);
            }
            if (node.children) node.children.forEach(function(child) {
                lines = lines.concat(_build(child, level + 1));
            });
            return lines;
        }
        function _generateHeaderSharp(level) {
            var sharps = "";
            while (level--) sharps += "#";
            return sharps;
        }
        function decode(markdown) {
            var json, parentMap = {}, lines, line, lineInfo, level, node, parent, noteProgress, codeBlock;
            // 一级标题转换 `{title}\n===` => `# {title}`
            markdown = markdown.replace(/^(.+)\n={3,}/, function($0, $1) {
                return "# " + $1;
            });
            lines = markdown.split(LINE_ENDING_SPLITER);
            // 按行分析
            for (var i = 0; i < lines.length; i++) {
                line = lines[i];
                lineInfo = _resolveLine(line);
                // 备注标记处理
                if (lineInfo.noteClose) {
                    noteProgress = false;
                    continue;
                } else if (lineInfo.noteStart) {
                    noteProgress = true;
                    continue;
                }
                // 代码块处理
                codeBlock = lineInfo.codeBlock ? !codeBlock : codeBlock;
                // 备注条件：备注标签中，非标题定义，或标题越位
                if (noteProgress || codeBlock || !lineInfo.level || lineInfo.level > level + 1) {
                    if (node) _pushNote(node, line);
                    continue;
                }
                // 标题处理
                level = lineInfo.level;
                node = _initNode(lineInfo.content, parentMap[level - 1]);
                parentMap[level] = node;
            }
            _cleanUp(parentMap[1]);
            return parentMap[1];
        }
        function _initNode(text, parent) {
            var node = {
                data: {
                    text: text,
                    note: ""
                }
            };
            if (parent) {
                if (parent.children) parent.children.push(node); else parent.children = [ node ];
            }
            return node;
        }
        function _pushNote(node, line) {
            node.data.note += line + "\n";
        }
        function _isEmpty(line) {
            return !/\S/.test(line);
        }
        function _resolveLine(line) {
            var match = /^(#+)?\s*(.*)$/.exec(line);
            return {
                level: match[1] && match[1].length || null,
                content: match[2],
                noteStart: line == NOTE_MARK_START,
                noteClose: line == NOTE_MARK_CLOSE,
                codeBlock: /^\s*```/.test(line)
            };
        }
        function _cleanUp(node) {
            if (!/\S/.test(node.data.note)) {
                node.data.note = null;
                delete node.data.note;
            } else {
                var notes = node.data.note.split("\n");
                while (notes.length && !/\S/.test(notes[0])) notes.shift();
                while (notes.length && !/\S/.test(notes[notes.length - 1])) notes.pop();
                node.data.note = notes.join("\n");
            }
            if (node.children) node.children.forEach(_cleanUp);
        }
        data.registerProtocol("markdown", module.exports = {
            fileDescription: "Markdown/GFM 格式",
            fileExtension: ".md",
            mineType: "text/markdown",
            dataType: "text",
            encode: function(json) {
                return encode(json.root);
            },
            decode: function(markdown) {
                return decode(markdown);
            }
        });
    }
};

//src/protocol/png.js
_p[70] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var data = _p.r(14);
        var Promise = _p.r(27);
        var DomURL = window.URL || window.webkitURL || window;
        function loadImage(info, callback) {
            return new Promise(function(resolve, reject) {
                var image = document.createElement("img");
                image.onload = function() {
                    resolve({
                        element: this,
                        x: info.x,
                        y: info.y,
                        width: info.width,
                        height: info.height
                    });
                };
                image.onerror = function(err) {
                    reject(err);
                };
                image.crossOrigin = "anonymous";
                image.src = info.url;
            });
        }
        /**
     * xhrLoadImage: 通过 xhr 加载保存在 BOS 上的图片
     * @note: BOS 上的 CORS 策略是取 headers 里面的 Origin 字段进行判断
     *        而通过 image 的 src 的方式是无法传递 origin 的，因此需要通过 xhr 进行
     */
        function xhrLoadImage(info, callback) {
            return Promise(function(resolve, reject) {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open("GET", info.url + "?_=" + Date.now(), true);
                xmlHttp.responseType = "blob";
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        var blob = xmlHttp.response;
                        var image = document.createElement("img");
                        image.src = DomURL.createObjectURL(blob);
                        image.onload = function() {
                            DomURL.revokeObjectURL(image.src);
                            resolve({
                                element: image,
                                x: info.x,
                                y: info.y,
                                width: info.width,
                                height: info.height
                            });
                        };
                    }
                };
                xmlHttp.send();
            });
        }
        function getSVGInfo(minder) {
            var paper = minder.getPaper(), paperTransform, domContainer = paper.container, svgXml, svgContainer, svgDom, renderContainer = minder.getRenderContainer(), renderBox = renderContainer.getRenderBox(), width = renderBox.width + 1, height = renderBox.height + 1, blob, svgUrl, img;
            // 保存原始变换，并且移动到合适的位置
            paperTransform = paper.shapeNode.getAttribute("transform");
            paper.shapeNode.setAttribute("transform", "translate(0.5, 0.5)");
            renderContainer.translate(-renderBox.x, -renderBox.y);
            // 获取当前的 XML 代码
            svgXml = paper.container.innerHTML;
            // 回复原始变换及位置
            renderContainer.translate(renderBox.x, renderBox.y);
            paper.shapeNode.setAttribute("transform", paperTransform);
            // 过滤内容
            svgContainer = document.createElement("div");
            svgContainer.innerHTML = svgXml;
            svgDom = svgContainer.querySelector("svg");
            svgDom.setAttribute("width", renderBox.width + 1);
            svgDom.setAttribute("height", renderBox.height + 1);
            svgDom.setAttribute("style", 'font-family: Arial, "Microsoft Yahei","Heiti SC";');
            svgContainer = document.createElement("div");
            svgContainer.appendChild(svgDom);
            svgXml = svgContainer.innerHTML;
            // Dummy IE
            svgXml = svgXml.replace(' xmlns="http://www.w3.org/2000/svg" ' + 'xmlns:NS1="" NS1:ns1:xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:NS2="" NS2:xmlns:ns1=""', "");
            // svg 含有 &nbsp; 符号导出报错 Entity 'nbsp' not defined ,含有控制字符触发Load Image 会触发报错
            svgXml = svgXml.replace(/&nbsp;|[\x00-\x1F\x7F-\x9F]/g, "");
            // fix title issue in safari
            // @ http://stackoverflow.com/questions/30273775/namespace-prefix-ns1-for-href-on-tagelement-is-not-defined-setattributens
            svgXml = svgXml.replace(/NS\d+:title/gi, "xlink:title");
            blob = new Blob([ svgXml ], {
                type: "image/svg+xml"
            });
            svgUrl = DomURL.createObjectURL(blob);
            //svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
            var imagesInfo = [];
            // 遍历取出图片信息
            traverse(minder.getRoot());
            function traverse(node) {
                var nodeData = node.data;
                if (nodeData.image) {
                    minder.renderNode(node);
                    var nodeData = node.data;
                    var imageUrl = nodeData.image;
                    var imageSize = nodeData.imageSize;
                    var imageRenderBox = node.getRenderBox("ImageRenderer", minder.getRenderContainer());
                    var imageInfo = {
                        url: imageUrl,
                        width: imageSize.width,
                        height: imageSize.height,
                        x: -renderContainer.getBoundaryBox().x + imageRenderBox.x,
                        y: -renderContainer.getBoundaryBox().y + imageRenderBox.y
                    };
                    imagesInfo.push(imageInfo);
                }
                // 若节点折叠，则直接返回
                if (nodeData.expandState === "collapse") {
                    return;
                }
                var children = node.getChildren();
                for (var i = 0; i < children.length; i++) {
                    traverse(children[i]);
                }
            }
            return {
                width: width,
                height: height,
                dataUrl: svgUrl,
                xml: svgXml,
                imagesInfo: imagesInfo
            };
        }
        function encode(json, minder, option) {
            var resultCallback;
            /* 绘制 PNG 的画布及上下文 */
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            /* 尝试获取背景图片 URL 或背景颜色 */
            var bgDeclare = minder.getStyle("background").toString();
            var bgUrl = /url\(\"(.+)\"\)/.exec(bgDeclare);
            var bgColor = kity.Color.parse(bgDeclare);
            /* 获取 SVG 文件内容 */
            var svgInfo = getSVGInfo(minder);
            var width = option && option.width && option.width > svgInfo.width ? option.width : svgInfo.width;
            var height = option && option.height && option.height > svgInfo.height ? option.height : svgInfo.height;
            var offsetX = option && option.width && option.width > svgInfo.width ? (option.width - svgInfo.width) / 2 : 0;
            var offsetY = option && option.height && option.height > svgInfo.height ? (option.height - svgInfo.height) / 2 : 0;
            var svgDataUrl = svgInfo.dataUrl;
            var imagesInfo = svgInfo.imagesInfo;
            /* 画布的填充大小 */
            var padding = 20;
            canvas.width = width + padding * 2;
            canvas.height = height + padding * 2;
            function fillBackground(ctx, style) {
                ctx.save();
                ctx.fillStyle = style;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
            function drawImage(ctx, image, x, y, width, height) {
                if (width && height) {
                    ctx.drawImage(image, x + padding, y + padding, width, height);
                } else {
                    ctx.drawImage(image, x + padding, y + padding);
                }
            }
            function generateDataUrl(canvas) {
                return canvas.toDataURL("image/png");
            }
            // 加载节点上的图片
            function loadImages(imagesInfo) {
                var imagePromises = imagesInfo.map(function(imageInfo) {
                    return xhrLoadImage(imageInfo);
                });
                return Promise.all(imagePromises);
            }
            function drawSVG() {
                var svgData = {
                    url: svgDataUrl
                };
                return loadImage(svgData).then(function($image) {
                    drawImage(ctx, $image.element, offsetX, offsetY, $image.width, $image.height);
                    return loadImages(imagesInfo);
                }).then(function($images) {
                    for (var i = 0; i < $images.length; i++) {
                        drawImage(ctx, $images[i].element, $images[i].x + offsetX, $images[i].y + offsetY, $images[i].width, $images[i].height);
                    }
                    DomURL.revokeObjectURL(svgDataUrl);
                    document.body.appendChild(canvas);
                    var pngBase64 = generateDataUrl(canvas);
                    document.body.removeChild(canvas);
                    return pngBase64;
                }, function(err) {
                    // 这里处理 reject，出错基本上是因为跨域，
                    // 出错后依然导出，只不过没有图片。
                    alert("脑图的节点中包含跨域图片，导出的 png 中节点图片不显示，你可以替换掉这些跨域的图片并重试。");
                    DomURL.revokeObjectURL(svgDataUrl);
                    document.body.appendChild(canvas);
                    var pngBase64 = generateDataUrl(canvas);
                    document.body.removeChild(canvas);
                    return pngBase64;
                });
            }
            if (bgUrl) {
                var bgInfo = {
                    url: bgUrl[1]
                };
                return loadImage(bgInfo).then(function($image) {
                    fillBackground(ctx, ctx.createPattern($image.element, "repeat"));
                    return drawSVG();
                });
            } else {
                fillBackground(ctx, bgColor.toString());
                return drawSVG();
            }
        }
        data.registerProtocol("png", module.exports = {
            fileDescription: "PNG 图片",
            fileExtension: ".png",
            mineType: "image/png",
            dataType: "base64",
            encode: encode
        });
    }
};

//src/protocol/svg.js
_p[71] = {
    value: function(require, exports, module) {
        var data = _p.r(14);
        /**
     * 导出svg时删除全部svg元素中的transform
     * @auth Naixor
     * @method removeTransform
     * @param  {[type]}        svgDom [description]
     * @return {[type]}               [description]
     */
        function cleanSVG(svgDom, x, y) {
            function getTransformToElement(target, source) {
                var matrix;
                try {
                    matrix = source.getScreenCTM().inverse();
                } catch (e) {
                    throw new Error("Can not inverse source element' ctm.");
                }
                return matrix.multiply(target.getScreenCTM());
            }
            function dealWithPath(d, dealWithPattern) {
                if (!(dealWithPattern instanceof Function)) {
                    dealWithPattern = function() {};
                }
                var strArr = [], pattern = [], cache = [];
                for (var i = 0, l = d.length; i < l; i++) {
                    switch (d[i]) {
                      case "M":
                      case "L":
                      case "T":
                      case "S":
                      case "A":
                      case "C":
                      case "H":
                      case "V":
                      case "Q":
                        {
                            if (cache.length) {
                                pattern.push(cache.join(""));
                                cache = [];
                            }
                            // 脑图的path格式真奇怪...偶尔就给我蹦出来一个"..V123 C..", 那空格几个意思 - -
                            if (pattern[pattern.length - 1] === ",") {
                                pattern.pop();
                            }
                            if (pattern.length) {
                                dealWithPattern(pattern);
                                strArr.push(pattern.join(""));
                                pattern = [];
                            }
                            pattern.push(d[i]);
                            break;
                        }

                      case "Z":
                      case "z":
                        {
                            pattern.push(cache.join(""), d[i]);
                            dealWithPattern(pattern);
                            strArr.push(pattern.join(""));
                            cache = [];
                            pattern = [];
                            break;
                        }

                      case ".":
                      case "e":
                        {
                            cache.push(d[i]);
                            break;
                        }

                      case "-":
                        {
                            if (d[i - 1] !== "e") {
                                if (cache.length) {
                                    pattern.push(cache.join(""), ",");
                                }
                                cache = [];
                            }
                            cache.push("-");
                            break;
                        }

                      case " ":
                      case ",":
                        {
                            if (cache.length) {
                                pattern.push(cache.join(""), ",");
                                cache = [];
                            }
                            break;
                        }

                      default:
                        {
                            if (/\d/.test(d[i])) {
                                cache.push(d[i]);
                            } else {
                                // m a c s q h v l t z情况
                                if (cache.length) {
                                    pattern.push(cache.join(""), d[i]);
                                    cache = [];
                                } else {
                                    // 脑图的path格式真奇怪...偶尔就给我蹦出来一个"..V123 c..", 那空格几个意思 - -
                                    if (pattern[pattern.length - 1] === ",") {
                                        pattern.pop();
                                    }
                                    pattern.push(d[i]);
                                }
                            }
                            if (i + 1 === l) {
                                if (cache.length) {
                                    pattern.push(cache.join(""));
                                }
                                dealWithPattern(pattern);
                                strArr.push(pattern.join(""));
                                cache = null;
                                pattern = null;
                            }
                        }
                    }
                }
                return strArr.join("");
            }
            function replaceWithNode(svgNode, parentX, parentY) {
                if (!svgNode) {
                    return;
                }
                if (svgNode.tagName === "defs") {
                    return;
                }
                if (svgNode.getAttribute("fill") === "transparent") {
                    svgNode.setAttribute("fill", "none");
                }
                if (svgNode.getAttribute("marker-end")) {
                    svgNode.removeAttribute("marker-end");
                }
                parentX = parentX || 0;
                parentY = parentY || 0;
                if (svgNode.getAttribute("transform")) {
                    var ctm = getTransformToElement(svgNode, svgNode.parentElement);
                    parentX -= ctm.e;
                    parentY -= ctm.f;
                    svgNode.removeAttribute("transform");
                }
                switch (svgNode.tagName.toLowerCase()) {
                  case "g":
                    break;

                  case "path":
                    {
                        var d = svgNode.getAttribute("d");
                        if (d) {
                            d = dealWithPath(d, function(pattern) {
                                switch (pattern[0]) {
                                  case "V":
                                    {
                                        pattern[1] = +pattern[1] - parentY;
                                        break;
                                    }

                                  case "H":
                                    {
                                        pattern[1] = +pattern[1] - parentX;
                                        break;
                                    }

                                  case "M":
                                  case "L":
                                  case "T":
                                    {
                                        pattern[1] = +pattern[1] - parentX;
                                        pattern[3] = +pattern[3] - parentY;
                                        break;
                                    }

                                  case "Q":
                                  case "S":
                                    {
                                        pattern[1] = +pattern[1] - parentX;
                                        pattern[3] = +pattern[3] - parentY;
                                        pattern[5] = +pattern[5] - parentX;
                                        pattern[7] = +pattern[7] - parentY;
                                        break;
                                    }

                                  case "A":
                                    {
                                        pattern[11] = +pattern[11] - parentX;
                                        pattern[13] = +pattern[13] - parentY;
                                        break;
                                    }

                                  case "C":
                                    {
                                        pattern[1] = +pattern[1] - parentX;
                                        pattern[3] = +pattern[3] - parentY;
                                        pattern[5] = +pattern[5] - parentX;
                                        pattern[7] = +pattern[7] - parentY;
                                        pattern[9] = +pattern[9] - parentX;
                                        pattern[11] = +pattern[11] - parentY;
                                    }
                                }
                            });
                            svgNode.setAttribute("d", d);
                            svgNode.removeAttribute("transform");
                        }
                        return;
                    }

                  case "image":
                  case "text":
                    {
                        if (parentX && parentY) {
                            var x = +svgNode.getAttribute("x") || 0, y = +svgNode.getAttribute("y") || 0;
                            svgNode.setAttribute("x", x - parentX);
                            svgNode.setAttribute("y", y - parentY);
                        }
                        if (svgNode.getAttribute("dominant-baseline")) {
                            svgNode.removeAttribute("dominant-baseline");
                            svgNode.setAttribute("dy", ".8em");
                        }
                        svgNode.removeAttribute("transform");
                        return;
                    }
                }
                if (svgNode.children) {
                    for (var i = 0, l = svgNode.children.length; i < l; i++) {
                        replaceWithNode(svgNode.children[i], parentX, parentY);
                    }
                }
            }
            svgDom.style.visibility = "hidden";
            replaceWithNode(svgDom, x || 0, y || 0);
            svgDom.style.visibility = "visible";
        }
        data.registerProtocol("svg", module.exports = {
            fileDescription: "SVG 矢量图",
            fileExtension: ".svg",
            mineType: "image/svg+xml",
            dataType: "text",
            encode: function(json, minder) {
                var paper = minder.getPaper(), paperTransform = paper.shapeNode.getAttribute("transform"), svgXml, svgContainer, svgDom, renderContainer = minder.getRenderContainer(), renderBox = renderContainer.getRenderBox(), transform = renderContainer.getTransform(), width = renderBox.width, height = renderBox.height, padding = 20;
                paper.shapeNode.setAttribute("transform", "translate(0.5, 0.5)");
                svgXml = paper.container.innerHTML;
                paper.shapeNode.setAttribute("transform", paperTransform);
                svgContainer = document.createElement("div");
                document.body.appendChild(svgContainer);
                svgContainer.innerHTML = svgXml;
                svgDom = svgContainer.querySelector("svg");
                svgDom.setAttribute("width", width + padding * 2 | 0);
                svgDom.setAttribute("height", height + padding * 2 | 0);
                svgDom.setAttribute("style", "background: " + minder.getStyle("background"));
                //"font-family: Arial, Microsoft Yahei, Heiti SC; " +
                svgDom.setAttribute("viewBox", [ 0, 0, width + padding * 2 | 0, height + padding * 2 | 0 ].join(" "));
                tempSvgContainer = document.createElement("div");
                cleanSVG(svgDom, renderBox.x - padding | 0, renderBox.y - padding | 0);
                document.body.removeChild(svgContainer);
                tempSvgContainer.appendChild(svgDom);
                // need a xml with width and height
                svgXml = tempSvgContainer.innerHTML;
                // svg 含有 &nbsp; 符号导出报错 Entity 'nbsp' not defined
                svgXml = svgXml.replace(/&nbsp;/g, "&#xa0;");
                // svg 含有 &nbsp; 符号导出报错 Entity 'nbsp' not defined
                return svgXml;
            }
        });
    }
};

//src/protocol/text.js
_p[72] = {
    value: function(require, exports, module) {
        var data = _p.r(14);
        var Browser = _p.r(19).Browser;
        /**
     * @Desc: 增加对不容浏览器下节点中文本\t匹配的处理，不同浏览器下\t无法正确匹配，导致无法使用TAB来批量导入节点
     * @Editor: Naixor
     * @Date: 2015.9.17
     */
        var LINE_ENDING = "\r", LINE_ENDING_SPLITER = /\r\n|\r|\n/, TAB_CHAR = function(Browser) {
            if (Browser.gecko) {
                return {
                    REGEXP: new RegExp("^(\t|" + String.fromCharCode(160, 160, 32, 160) + ")"),
                    DELETE: new RegExp("^(\t|" + String.fromCharCode(160, 160, 32, 160) + ")+")
                };
            } else if (Browser.ie || Browser.edge) {
                // ie系列和edge比较特别，\t在div中会被直接转义成SPACE故只好使用SPACE来做处理
                return {
                    REGEXP: new RegExp("^(" + String.fromCharCode(32) + "|" + String.fromCharCode(160) + ")"),
                    DELETE: new RegExp("^(" + String.fromCharCode(32) + "|" + String.fromCharCode(160) + ")+")
                };
            } else {
                return {
                    REGEXP: /^(\t|\x20{4})/,
                    DELETE: /^(\t|\x20{4})+/
                };
            }
        }(Browser);
        function repeat(s, n) {
            var result = "";
            while (n--) result += s;
            return result;
        }
        /**
     * 对节点text中的换行符进行处理
     * @method encodeWrap
     * @param  {String}   nodeText MinderNode.data.text
     * @return {String}            \n -> '\n'; \\n -> '\\n'
     */
        function encodeWrap(nodeText) {
            if (!nodeText) {
                return "";
            }
            var textArr = [], WRAP_TEXT = [ "\\", "n" ];
            for (var i = 0, j = 0, l = nodeText.length; i < l; i++) {
                if (nodeText[i] === "\n" || nodeText[i] === "\r") {
                    textArr.push("\\n");
                    j = 0;
                    continue;
                }
                if (nodeText[i] === WRAP_TEXT[j]) {
                    j++;
                    if (j === 2) {
                        j = 0;
                        textArr.push("\\\\n");
                    }
                    continue;
                }
                switch (j) {
                  case 0:
                    {
                        textArr.push(nodeText[i]);
                        break;
                    }

                  case 1:
                    {
                        textArr.push(nodeText[i - 1], nodeText[i]);
                    }
                }
                j = 0;
            }
            return textArr.join("");
        }
        /**
     * 将文本内容中的'\n'和'\\n'分别转换成\n和\\n
     * @method decodeWrap
     * @param  {[type]}   text [description]
     * @return {[type]}        [description]
     */
        function decodeWrap(text) {
            if (!text) {
                return "";
            }
            var textArr = [], WRAP_TEXT = [ "\\", "\\", "n" ];
            for (var i = 0, j = 0, l = text.length; i < l; i++) {
                if (text[i] === WRAP_TEXT[j]) {
                    j++;
                    if (j === 3) {
                        j = 0;
                        textArr.push("\\n");
                    }
                    continue;
                }
                switch (j) {
                  case 0:
                    {
                        textArr.push(text[i]);
                        j = 0;
                        break;
                    }

                  case 1:
                    {
                        if (text[i] === "n") {
                            textArr.push("\n");
                        } else {
                            textArr.push(text[i - 1], text[i]);
                        }
                        j = 0;
                        break;
                    }

                  case 2:
                    {
                        textArr.push(text[i - 2]);
                        if (text[i] !== "\\") {
                            j = 0;
                            textArr.push(text[i - 1], text[i]);
                        }
                        break;
                    }
                }
            }
            return textArr.join("");
        }
        function encode(json, level) {
            var local = "";
            level = level || 0;
            local += repeat("\t", level);
            local += encodeWrap(json.data.text) + LINE_ENDING;
            if (json.children) {
                json.children.forEach(function(child) {
                    local += encode(child, level + 1);
                });
            }
            return local;
        }
        function isEmpty(line) {
            return !/\S/.test(line);
        }
        function getLevel(line) {
            var level = 0;
            while (TAB_CHAR.REGEXP.test(line)) {
                line = line.replace(TAB_CHAR.REGEXP, "");
                level++;
            }
            return level;
        }
        function getNode(line) {
            return {
                data: {
                    text: decodeWrap(line.replace(TAB_CHAR.DELETE, ""))
                }
            };
        }
        function decode(local) {
            var json, parentMap = {}, lines = local.split(LINE_ENDING_SPLITER), line, level, node;
            function addChild(parent, child) {
                var children = parent.children || (parent.children = []);
                children.push(child);
            }
            for (var i = 0; i < lines.length; i++) {
                line = lines[i];
                if (isEmpty(line)) continue;
                level = getLevel(line);
                node = getNode(line);
                if (level === 0) {
                    if (json) {
                        throw new Error("Invalid local format");
                    }
                    json = node;
                } else {
                    if (!parentMap[level - 1]) {
                        throw new Error("Invalid local format");
                    }
                    addChild(parentMap[level - 1], node);
                }
                parentMap[level] = node;
            }
            return json;
        }
        /**
     * @Desc: 增加一个将当前选中节点转换成text的方法
     * @Editor: Naixor
     * @Date: 2015.9.21
     */
        function Node2Text(node) {
            function exportNode(node) {
                var exported = {};
                exported.data = node.getData();
                var childNodes = node.getChildren();
                exported.children = [];
                for (var i = 0; i < childNodes.length; i++) {
                    exported.children.push(exportNode(childNodes[i]));
                }
                return exported;
            }
            if (!node) return;
            if (/^\s*$/.test(node.data.text)) {
                node.data.text = "分支主题";
            }
            return encode(exportNode(node));
        }
        data.registerProtocol("text", module.exports = {
            fileDescription: "大纲文本",
            fileExtension: ".txt",
            dataType: "text",
            mineType: "text/plain",
            encode: function(json) {
                return encode(json.root, 0);
            },
            decode: function(local) {
                return decode(local);
            },
            Node2Text: function(node) {
                return Node2Text(node);
            }
        });
    }
};

//src/template/default.js
/**
 * @fileOverview
 *
 * 默认模板 - 脑图模板
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[73] = {
    value: function(require, exports, module) {
        var template = _p.r(33);
        template.register("default", {
            getLayout: function(node) {
                if (node.getData("layout")) return node.getData("layout");
                var level = node.getLevel();
                // 根节点
                if (level === 0) {
                    return "mind";
                }
                // 一级节点
                if (level === 1) {
                    return node.getLayoutPointPreview().x > 0 ? "right" : "left";
                }
                return node.parent.getLayout();
            },
            getConnect: function(node) {
                if (node.getLevel() == 1) return "arc";
                return "under";
            }
        });
    }
};

//src/template/filetree.js
/**
 * @fileOverview
 *
 * 文件夹模板
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[74] = {
    value: function(require, exports, module) {
        var template = _p.r(33);
        template.register("filetree", {
            getLayout: function(node) {
                if (node.getData("layout")) return node.getData("layout");
                if (node.isRoot()) return "bottom";
                return "filetree-down";
            },
            getConnect: function(node) {
                if (node.getLevel() == 1) {
                    return "poly";
                }
                return "l";
            }
        });
    }
};

//src/template/fish-bone.js
/**
 * @fileOverview
 *
 * 默认模板 - 鱼骨头模板
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[75] = {
    value: function(require, exports, module) {
        var template = _p.r(33);
        template.register("fish-bone", {
            getLayout: function(node) {
                if (node.getData("layout")) return node.getData("layout");
                var level = node.getLevel();
                // 根节点
                if (level === 0) {
                    return "fish-bone-master";
                }
                // 一级节点
                if (level === 1) {
                    return "fish-bone-slave";
                }
                return node.getLayoutPointPreview().y > 0 ? "filetree-up" : "filetree-down";
            },
            getConnect: function(node) {
                switch (node.getLevel()) {
                  case 1:
                    return "fish-bone-master";

                  case 2:
                    return "line";

                  default:
                    return "l";
                }
            }
        });
    }
};

//src/template/right.js
/**
 * @fileOverview
 *
 * 往右布局结构模板
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[76] = {
    value: function(require, exports, module) {
        var template = _p.r(33);
        template.register("right", {
            getLayout: function(node) {
                return node.getData("layout") || "right";
            },
            getConnect: function(node) {
                if (node.getLevel() == 1) return "arc";
                return "bezier";
            }
        });
    }
};

//src/template/structure.js
/**
 * @fileOverview
 *
 * 组织结构图模板
 *
 * @author: techird
 * @copyright: Baidu FEX, 2014
 */
_p[77] = {
    value: function(require, exports, module) {
        var template = _p.r(33);
        template.register("structure", {
            getLayout: function(node) {
                return node.getData("layout") || "bottom";
            },
            getConnect: function(node) {
                return "poly";
            }
        });
    }
};

//src/template/tianpan.js
/**
 * @fileOverview
 *
 * 天盘模板
 *
 * @author: along
 * @copyright: bpd729@163.com, 2015
 */
_p[78] = {
    value: function(require, exports, module) {
        var template = _p.r(33);
        template.register("tianpan", {
            getLayout: function(node) {
                if (node.getData("layout")) return node.getData("layout");
                var level = node.getLevel();
                // 根节点
                if (level === 0) {
                    return "tianpan";
                }
                return node.parent.getLayout();
            },
            getConnect: function(node) {
                return "arc_tp";
            }
        });
    }
};

//src/theme/default.js
_p[79] = {
    value: function(require, exports, module) {
        var theme = _p.r(34);
        [ "classic", "classic-compact" ].forEach(function(name) {
            var compact = name == "classic-compact";
            /* jscs:disable maximumLineLength */
            theme.register(name, {
                background: '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
                "root-color": "#430",
                "root-background": "#e9df98",
                "root-stroke": "#e9df98",
                "root-font-size": 24,
                "root-padding": compact ? [ 10, 25 ] : [ 15, 25 ],
                "root-margin": compact ? [ 15, 25 ] : [ 30, 100 ],
                "root-radius": 30,
                "root-space": 10,
                "root-shadow": "rgba(0, 0, 0, .25)",
                "main-color": "#333",
                "main-background": "#a4c5c0",
                "main-stroke": "#a4c5c0",
                "main-font-size": 16,
                "main-padding": compact ? [ 5, 15 ] : [ 6, 20 ],
                "main-margin": compact ? [ 5, 10 ] : 20,
                "main-radius": 10,
                "main-space": 5,
                "main-shadow": "rgba(0, 0, 0, .25)",
                "sub-color": "white",
                "sub-background": "transparent",
                "sub-stroke": "none",
                "sub-font-size": 12,
                "sub-padding": [ 5, 10 ],
                "sub-margin": compact ? [ 5, 10 ] : [ 15, 20 ],
                "sub-tree-margin": 30,
                "sub-radius": 5,
                "sub-space": 5,
                "connect-color": "white",
                "connect-width": 2,
                "main-connect-width": 3,
                "connect-radius": 5,
                "selected-background": "rgb(254, 219, 0)",
                "selected-stroke": "rgb(254, 219, 0)",
                "selected-color": "black",
                "marquee-background": "rgba(255,255,255,.3)",
                "marquee-stroke": "white",
                "drop-hint-color": "yellow",
                "sub-drop-hint-width": 2,
                "main-drop-hint-width": 4,
                "root-drop-hint-width": 4,
                "order-hint-area-color": "rgba(0, 255, 0, .5)",
                "order-hint-path-color": "#0f0",
                "order-hint-path-width": 1,
                "text-selection-color": "rgb(27,171,255)",
                "line-height": 1.5
            });
        });
    }
};

//src/theme/fish.js
_p[80] = {
    value: function(require, exports, module) {
        var theme = _p.r(34);
        theme.register("fish", {
            background: '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
            "root-color": "#430",
            "root-background": "#e9df98",
            "root-stroke": "#e9df98",
            "root-font-size": 24,
            "root-padding": [ 35, 35 ],
            "root-margin": 30,
            "root-radius": 100,
            "root-space": 10,
            "root-shadow": "rgba(0, 0, 0, .25)",
            "main-color": "#333",
            "main-background": "#a4c5c0",
            "main-stroke": "#a4c5c0",
            "main-font-size": 16,
            "main-padding": [ 6, 20 ],
            "main-margin": [ 20, 20 ],
            "main-radius": 5,
            "main-space": 5,
            "main-shadow": "rgba(0, 0, 0, .25)",
            "sub-color": "black",
            "sub-background": "white",
            "sub-stroke": "white",
            "sub-font-size": 12,
            "sub-padding": [ 5, 10 ],
            "sub-margin": [ 10 ],
            "sub-radius": 5,
            "sub-space": 5,
            "connect-color": "white",
            "connect-width": 3,
            "main-connect-width": 3,
            "connect-radius": 5,
            "selected-background": "rgb(254, 219, 0)",
            "selected-stroke": "rgb(254, 219, 0)",
            "marquee-background": "rgba(255,255,255,.3)",
            "marquee-stroke": "white",
            "drop-hint-color": "yellow",
            "drop-hint-width": 4,
            "order-hint-area-color": "rgba(0, 255, 0, .5)",
            "order-hint-path-color": "#0f0",
            "order-hint-path-width": 1,
            "text-selection-color": "rgb(27,171,255)",
            "line-height": 1.5
        });
    }
};

//src/theme/fresh.js
_p[81] = {
    value: function(require, exports, module) {
        var kity = _p.r(19);
        var theme = _p.r(34);
        function hsl(h, s, l) {
            return kity.Color.createHSL(h, s, l);
        }
        function generate(h, compat) {
            return {
                background: "#fbfbfb",
                "root-color": "white",
                "root-background": hsl(h, 37, 60),
                "root-stroke": hsl(h, 37, 60),
                "root-font-size": 16,
                "root-padding": compat ? [ 6, 12 ] : [ 12, 24 ],
                "root-margin": compat ? 10 : [ 30, 100 ],
                "root-radius": 5,
                "root-space": 10,
                "main-color": "black",
                "main-background": hsl(h, 33, 95),
                "main-stroke": hsl(h, 37, 60),
                "main-stroke-width": 1,
                "main-font-size": 14,
                "main-padding": [ 6, 20 ],
                "main-margin": compat ? 8 : 20,
                "main-radius": 3,
                "main-space": 5,
                "sub-color": "black",
                "sub-background": "transparent",
                "sub-stroke": "none",
                "sub-font-size": 12,
                "sub-padding": compat ? [ 3, 5 ] : [ 5, 10 ],
                "sub-margin": compat ? [ 4, 8 ] : [ 15, 20 ],
                "sub-radius": 5,
                "sub-space": 5,
                "connect-color": hsl(h, 37, 60),
                "connect-width": 1,
                "connect-radius": 5,
                "selected-stroke": hsl(h, 26, 30),
                "selected-stroke-width": "3",
                "blur-selected-stroke": hsl(h, 10, 60),
                "marquee-background": hsl(h, 100, 80).set("a", .1),
                "marquee-stroke": hsl(h, 37, 60),
                "drop-hint-color": hsl(h, 26, 35),
                "drop-hint-width": 5,
                "order-hint-area-color": hsl(h, 100, 30).set("a", .5),
                "order-hint-path-color": hsl(h, 100, 25),
                "order-hint-path-width": 1,
                "text-selection-color": hsl(h, 100, 20),
                "line-height": 1.5
            };
        }
        var plans = {
            red: 0,
            soil: 25,
            green: 122,
            blue: 204,
            purple: 246,
            pink: 334
        };
        var name;
        for (name in plans) {
            theme.register("fresh-" + name, generate(plans[name]));
            theme.register("fresh-" + name + "-compat", generate(plans[name], true));
        }
    }
};

//src/theme/snow.js
_p[82] = {
    value: function(require, exports, module) {
        var theme = _p.r(34);
        [ "snow", "snow-compact" ].forEach(function(name) {
            var compact = name == "snow-compact";
            /* jscs:disable maximumLineLength */
            theme.register(name, {
                background: '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
                "root-color": "#430",
                "root-background": "#e9df98",
                "root-stroke": "#e9df98",
                "root-font-size": 24,
                "root-padding": compact ? [ 5, 10 ] : [ 15, 25 ],
                "root-margin": compact ? 15 : 30,
                "root-radius": 5,
                "root-space": 10,
                "root-shadow": "rgba(0, 0, 0, .25)",
                "main-color": "#333",
                "main-background": "#a4c5c0",
                "main-stroke": "#a4c5c0",
                "main-font-size": 16,
                "main-padding": compact ? [ 4, 10 ] : [ 6, 20 ],
                "main-margin": compact ? [ 5, 10 ] : [ 20, 40 ],
                "main-radius": 5,
                "main-space": 5,
                "main-shadow": "rgba(0, 0, 0, .25)",
                "sub-color": "black",
                "sub-background": "white",
                "sub-stroke": "white",
                "sub-font-size": 12,
                "sub-padding": [ 5, 10 ],
                "sub-margin": compact ? [ 5, 10 ] : [ 10, 20 ],
                "sub-radius": 5,
                "sub-space": 5,
                "connect-color": "white",
                "connect-width": 2,
                "main-connect-width": 3,
                "connect-radius": 5,
                "selected-background": "rgb(254, 219, 0)",
                "selected-stroke": "rgb(254, 219, 0)",
                "marquee-background": "rgba(255,255,255,.3)",
                "marquee-stroke": "white",
                "drop-hint-color": "yellow",
                "drop-hint-width": 4,
                "order-hint-area-color": "rgba(0, 255, 0, .5)",
                "order-hint-path-color": "#0f0",
                "order-hint-path-width": 1,
                "text-selection-color": "rgb(27,171,255)",
                "line-height": 1.5
            });
        });
    }
};

//src/theme/tianpan.js
_p[83] = {
    value: function(require, exports, module) {
        var theme = _p.r(34);
        [ "tianpan", "tianpan-compact" ].forEach(function(name) {
            var compact = name == "tianpan-compact";
            theme.register(name, {
                background: '#3A4144 url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowQzg5QTQ0NDhENzgxMUUzOENGREE4QTg0RDgzRTZDNyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowQzg5QTQ0NThENzgxMUUzOENGREE4QTg0RDgzRTZDNyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkMwOEQ1NDRGOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMwOEQ1NDUwOEQ3NzExRTM4Q0ZEQThBODREODNFNkM3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+e9P33AAAACVJREFUeNpisXJ0YUACTAyoAMr/+eM7EGGRZ4FQ7BycEAZAgAEAHbEGtkoQm/wAAAAASUVORK5CYII=") repeat',
                "root-color": "#430",
                "root-background": "#e9df98",
                "root-stroke": "#e9df98",
                "root-font-size": 25,
                "root-padding": compact ? 15 : 20,
                "root-margin": compact ? [ 15, 25 ] : 100,
                "root-radius": 30,
                "root-space": 10,
                "root-shadow": "rgba(0, 0, 0, .25)",
                "root-shape": "circle",
                "main-color": "#333",
                "main-background": "#a4c5c0",
                "main-stroke": "#a4c5c0",
                "main-font-size": 15,
                "main-padding": compact ? 10 : 12,
                "main-margin": compact ? 10 : 12,
                "main-radius": 10,
                "main-space": 5,
                "main-shadow": "rgba(0, 0, 0, .25)",
                "main-shape": "circle",
                "sub-color": "#333",
                "sub-background": "#99ca6a",
                "sub-stroke": "#a4c5c0",
                "sub-font-size": 13,
                "sub-padding": 5,
                "sub-margin": compact ? 6 : 10,
                "sub-tree-margin": 30,
                "sub-radius": 5,
                "sub-space": 5,
                "sub-shadow": "rgba(0, 0, 0, .25)",
                "sub-shape": "circle",
                "connect-color": "white",
                "connect-width": 2,
                "main-connect-width": 3,
                "connect-radius": 5,
                "selected-background": "rgb(254, 219, 0)",
                "selected-stroke": "rgb(254, 219, 0)",
                "selected-color": "black",
                "marquee-background": "rgba(255,255,255,.3)",
                "marquee-stroke": "white",
                "drop-hint-color": "yellow",
                "sub-drop-hint-width": 2,
                "main-drop-hint-width": 4,
                "root-drop-hint-width": 4,
                "order-hint-area-color": "rgba(0, 255, 0, .5)",
                "order-hint-path-color": "#0f0",
                "order-hint-path-width": 1,
                "text-selection-color": "rgb(27,171,255)",
                "line-height": 1.4
            });
        });
    }
};

//src/theme/wire.js
_p[84] = {
    value: function(require, exports, module) {
        var theme = _p.r(34);
        theme.register("wire", {
            background: "black",
            color: "#999",
            stroke: "none",
            padding: 10,
            margin: 20,
            "font-size": 14,
            "connect-color": "#999",
            "connect-width": 1,
            "selected-background": "#999",
            "selected-color": "black",
            "marquee-background": "rgba(255,255,255,.3)",
            "marquee-stroke": "white",
            "drop-hint-color": "yellow",
            "sub-drop-hint-width": 2,
            "main-drop-hint-width": 4,
            "root-drop-hint-width": 4,
            "order-hint-area-color": "rgba(0, 255, 0, .5)",
            "order-hint-path-color": "#0f0",
            "order-hint-path-width": 1,
            "text-selection-color": "rgb(27,171,255)",
            "line-height": 1.5
        });
    }
};

var moduleMapping = {
    "expose-kityminder": 36
};

function use(name) {
    _p.r([ moduleMapping[name] ]);
}
use('expose-kityminder');
})();