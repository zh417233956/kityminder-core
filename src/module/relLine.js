define(function(require, exports, module) {
    var kity = require('../core/kity');
    var utils = require('../core/utils');

    var Minder = require('../core/minder');
    var MinderNode = require('../core/node');
    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');

    Module.register('relLine', function() {
        //创建关系线
        //关系线参数设置
        var relLineOption = { color: '#009143', size: 1.5, dash: true, endPlugSize: 2, startSocket: "right", Socket: "left" };

        function createRelLine(startNode, endNode) {
            var startElementId = startNode.rc.getId();
            var endElementId = endNode.rc.getId();
            var startElement = document.getElementById(startElementId);
            var endElement = document.getElementById(endElementId);
            //获取指定节点的Element
            // var startElement = document.getElementById(km.getSelectedNode().rc.getId());
            //startPlug: 'disc', endPlug: 'disc'
            var line = new LeaderLine(startElement, endElement, relLineOption);
            km._relLine_obj.push(line);
            return line;
        }

        function createCircleFun(line) {
            var svg = km.getRenderContainer().container.node,
                p0 = line.start,
                p1,
                p2,
                p3 = line.end;

            p1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            if (p1) {
                p1.setAttribute("cx", p0.getBoundingClientRect().x);
                p1.setAttribute("cy", p0.getBoundingClientRect().y);
                p1.setAttribute("r", 10);
                p1.setAttribute("class", "rel-line-point-start");
                p1.setAttribute("style", "-webkit-tap-highlight-color: transparent; box-shadow: transparent 0px 0px 1px; cursor: grab; user-select: none;fill: indianred;");
                svg.appendChild(p1);
            }

            p2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            if (p2) {
                p2.setAttribute("cx", p3.getBoundingClientRect().x);
                p2.setAttribute("cy", p3.getBoundingClientRect().y);
                p2.setAttribute("r", 10);
                p2.setAttribute("class", "rel-line-point-end");
                p2.setAttribute("style", "-webkit-tap-highlight-color: transparent; box-shadow: transparent 0px 0px 1px; cursor: grab; user-select: none;fill: indianred;");
                svg.appendChild(p2);
            }
            var line_box_length = 8;
            var line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            if (line1) {
                line1.setAttribute("x1", p0.getBoundingClientRect().x + (p0.getBoundingClientRect().width - line_box_length) / 2);
                line1.setAttribute("y1", p0.getBoundingClientRect().y - (p0.getBoundingClientRect().height - line_box_length) / 2);
                line1.setAttribute("x2", p1.getBoundingClientRect().x);
                line1.setAttribute("y2", p1.getBoundingClientRect().y);
                line1.setAttribute("class", "rel-line-line-start");
                line1.setAttribute("style", "stroke: indianred;stroke-width: 2px;");
                svg.appendChild(line1);
            }


            var line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            if (line2) {
                line2.setAttribute("x1", p2.getBoundingClientRect().x);
                line2.setAttribute("y1", p2.getBoundingClientRect().y);
                line2.setAttribute("x2", p3.getBoundingClientRect().x + (p3.getBoundingClientRect().width - line_box_length * 2) / 2);
                line2.setAttribute("y2", p3.getBoundingClientRect().y - (p3.getBoundingClientRect().height - line_box_length * 2) / 2);
                line2.setAttribute("class", "rel-line-line-end");
                line2.setAttribute("style", "stroke: indianred;stroke-width: 2px;");
                svg.appendChild(line2);
            }

            var field = svg;

            var xy = {
                p0: { x: p0.getBoundingClientRect().x, y: p0.getBoundingClientRect().y },
                p1: { x: p1.cx.baseVal.value, y: p1.cy.baseVal.value },
                p2: { x: p2.cx.baseVal.value, y: p2.cy.baseVal.value },
                p3: { x: p3.getBoundingClientRect().x, y: p3.getBoundingClientRect().y }
            };

            function update() {
                var _p1 = document.getElementsByClassName("rel-line-point-start")[0].getBoundingClientRect();
                var _p2 = document.getElementsByClassName("rel-line-point-end")[0].getBoundingClientRect();

                var _line1 = document.getElementsByClassName("rel-line-line-start")[0];
                var _line2 = document.getElementsByClassName("rel-line-line-end")[0];
                _line1.x2.baseVal.value = _p1.x;
                _line1.y2.baseVal.value = _p1.y;
                _line2.x1.baseVal.value = _p2.x;
                _line2.y1.baseVal.value = _p2.y;

                var point_start = { x: _p1.x - xy.p1.x, y: _p1.y - xy.p1.y };
                var point_end = { x: _p2.x - xy.p2.x, y: _p2.y - xy.p2.y };
                line.setOptions({
                    startSocketGravity: [point_start.x, point_start.y],
                    endSocketGravity: [point_end.x, point_end.y]
                });
            }
            new PlainDraggable(p1, {
                containment: field,
                onMove: () => { update(); }
            });
            new PlainDraggable(p2, {
                containment: field,
                onMove: () => { update(); }
            });
            update();

        }

        function removeCircleFun() {
            var _p1 = document.getElementsByClassName("rel-line-point-start")[0];
            var _p2 = document.getElementsByClassName("rel-line-point-end")[0];

            var _line1 = document.getElementsByClassName("rel-line-line-start")[0];
            var _line2 = document.getElementsByClassName("rel-line-line-end")[0];

            _p1.remove();
            _p2.remove();
            _line1.remove();
            _line2.remove();
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
        var RelLineCommand = kity.createClass('RelLineCommand', {
            base: Command,

            execute: function(km) {
                var curNode = km.getSelectedNode();
                var endNodeAreaAnchor = LeaderLine.areaAnchor(km.getRenderContainer().container.node, { x: 0, y: 0, width: 0, height: 0 });
                if (curNode) {
                    //创建关系线
                    var startElementId = curNode.rc.getId();
                    var startElement = document.getElementById(startElementId);
                    var newLine = new LeaderLine(startElement, endNodeAreaAnchor, relLineOption);
                    km._relLine_obj.push(newLine);

                    km.circle = { create: createCircleFun, remove: removeCircleFun };

                    //关系线指向终点函数
                    function relLineMouseFun() {
                        var _curNode = km.getSelectedNode();
                        if (_curNode) {
                            try {
                                var __endNode = document.getElementById(_curNode.rc.getId());
                                if (newLine.start != __endNode) {
                                    newLine.end = __endNode;
                                    km.getRenderContainer().container.removeEventListener("mousedown", relLineMouseFun);
                                    km.getRenderContainer().container.removeEventListener("mousemove", relLineMouseMVFun);
                                    //打点
                                    // createCircleFun(newLine);
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
                            newLine.end = LeaderLine.areaAnchor(km.getRenderContainer().container.node, { x: window.event.clientX, y: window.event.clientY, width: 0, height: 0 });
                            newLine.position();
                        }
                    }
                    km.getRenderContainer().container.addEventListener("mousemove", relLineMouseMVFun);
                }
            },
            queryState: function(km) {
                var nodes = km.getSelectedNodes(),
                    result = 0;
                if (nodes.length === 0) {
                    return -1;
                }
                nodes.forEach(function(n) {
                    if (n && n.getData('relLine')) {
                        result = 0;
                        return false;
                    }
                });
                return result;
            },
            queryValue: function(km) {
                var node = km.getSelectedNode();
                return {
                    relLine: node.getData('relLine')
                };
            }
        });

        // 图标的图形
        var LeaderLineRenderer = kity.createClass('LeaderLineRenderer', {
            base: kity.Group,

            constructor: function(node) {
                this.callBase();
                this.create();
                // this.setId(utils.uuid('relLine'));
            },
            create: function() {
                try {
                    setTimeout(() => {
                        /*rel line*/
                        var relLineArray = km._relLine || [];
                        km._relLine_obj = [];
                        km._relLine_render = (time, expand) => {
                            console.error = () => {};
                            time = time || 0
                            setTimeout(() => {
                                //更新关系线
                                if (km._relLine_obj) {
                                    let curNode = km.getSelectedNode();
                                    let curNodeChild = curNode != undefined ? curNode.children : null;
                                    // 折叠/展开，需要隐藏/显示关系线
                                    let expand_relLine_fun = function(nodeChilds, itemLine) {
                                        //折叠/展开，需要隐藏/显示关系先
                                        nodeChilds.forEach((childItem) => {
                                            let childEle = document.getElementById(childItem.rc.getId());
                                            //子节点中是否有关系线
                                            if (itemLine.start == childEle || itemLine.end == childEle) {
                                                //子节点的显示状态
                                                if (childEle.getAttribute("display") == "none") {
                                                    itemLine.hide();
                                                } else {
                                                    itemLine.show();
                                                }
                                            }
                                            //递归
                                            expand_relLine_fun(childItem.children, itemLine);
                                        });
                                    };
                                    //遍历关系线对象
                                    km._relLine_obj.forEach((itemLine) => {
                                        try {
                                            itemLine.position();
                                        } catch (error) {

                                        }

                                        if (expand) {
                                            //折叠/展开触发
                                            expand_relLine_fun(curNodeChild, itemLine);
                                        }
                                    });
                                };
                            }, time);
                        };
                        relLineArray.forEach((_lineItem, _lineIndex) => {
                            // var startElementId = km.getNodeById(_lineItem.startId).rc.getId();
                            // var endElementId = km.getNodeById(_lineItem.endId).rc.getId();
                            // var startElement = document.getElementById(startElementId);
                            // var endElement = document.getElementById(endElementId);
                            // //获取指定节点的Element
                            // // var startElement = document.getElementById(km.getSelectedNode().rc.getId());
                            // //startPlug: 'disc', endPlug: 'disc'
                            // var line = new LeaderLine(startElement, endElement, { color: '#009143', size: 1.5, dash: true, endPlugSize: 2 });

                            createRelLine(km.getNodeById(_lineItem.startId), km.getNodeById(_lineItem.endId))


                            // [startElementId, endElementId].forEach((elementId) => {
                            //     //拖拽Node并移动
                            //     var lineEventType = ['mousedown', 'mousemove'];
                            //     lineEventType.forEach(function(item, index) {
                            //         document.getElementById(elementId).addEventListener(item, (event) => {
                            //             if (event.type == lineEventType[0]) {
                            //                 line._drag_ = true;
                            //             }
                            //             if (line._drag_) {
                            //                 line.position();
                            //             }

                            //         });
                            //     });
                            //     //停止拖拽
                            //     document.getElementById(elementId).addEventListener("mouseup", (event) => {
                            //         if (line._drag_) {
                            //             line._drag_ = false;
                            //         }
                            //     });
                            // })

                        });
                        /*
                        //完整demo实现
                        // var startElement = document.getElementById('minder_node3');
                        // //获取指定节点的Element
                        // // var startElement = document.getElementById(km.getSelectedNode().rc.getId());
                        // //startPlug: 'disc', endPlug: 'disc'
                        // var line = new LeaderLine(startElement, document.getElementById('minder_node4'), { color: '#009143', size: 1.5, dash: true, endPlugSize: 2 });

                        // //拖拽Node并移动
                        // var lineEventType = ['mousedown', 'mousemove'];
                        // lineEventType.forEach(function(item, index) {
                        //     document.getElementById("minder_node3").addEventListener(item, (event) => {
                        //         if (event.type == lineEventType[0]) {
                        //             line._drag_ = true;
                        //         }
                        //         if (line._drag_) {
                        //             line.position();
                        //         }

                        //     });
                        // });
                        // //停止拖拽
                        // document.getElementById("minder_node3").addEventListener("mouseup", (event) => {
                        //     if (line._drag_) {
                        //         line._drag_ = false;
                        //     }
                        // });
                        */
                    }, 800);

                } catch (error) {
                    console.log("zhhlog:LeaderLineRenderer:error:" + error);
                }
            }
        });

        return {
            'commands': {
                'relLine': RelLineCommand
            },
            'renderers': {
                left: kity.createClass('LeaderLineRenderer', {
                    base: Renderer,

                    create: function(node) {
                        return new LeaderLineRenderer(node);
                    },

                    shouldRender: function(node) {
                        return node.getData('relLine');
                    },

                    update: function(icon, node, box) {
                        // var data = node.getData('relLine');
                        // var spaceLeft = node.getStyle('space-left'),
                        //     x, y;

                        // // icon.setValue(data);
                        // x = box.left - icon.width - spaceLeft;
                        // y = -icon.height / 2;

                        // icon.setTranslate(x, y);

                        // return new kity.Box({
                        //     x: x,
                        //     y: y,
                        //     width: icon.width,
                        //     height: icon.height
                        // });
                    }
                })
            }
        };
    });
});