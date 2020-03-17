define(function(require, exports, module) {
    var kity = require('../core/kity');
    var utils = require('../core/utils');

    var Minder = require('../core/minder');
    var MinderNode = require('../core/node');
    var Command = require('../core/command');
    var Module = require('../core/module');
    var Renderer = require('../core/render');

    var ImageSZ = { "width": 30, "height": 30 }

    // var LeaderLine = require('../connect/leader-line').LeaderLine;



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

    Module.register('flag', function() {
        function loadImageSize(url, callback) {
            var img = document.createElement('img');
            img.onload = function() {
                callback(ImageSZ.width, ImageSZ.height);
            };
            img.onerror = function() {
                callback(null);
            };
            img.src = url;
        }

        function fitImageSize(width, height, maxWidth, maxHeight) {
            var ratio = width / height,
                fitRatio = maxWidth / maxHeight;

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
        var ImageCommand = kity.createClass('ImageCommand', {
            base: Command,

            execute: function(km, url, title) {
                var nodes = km.getSelectedNodes();

                loadImageSize(url, function(width, height) {
                    nodes.forEach(function(n) {
                        var size = fitImageSize(
                            width, height,
                            km.getOption('maxImageWidth'),
                            km.getOption('maxImageHeight'));
                        n.setData('flag', url);
                        n.setData('flagTitle', url && title);
                        // n.setData('imageSize', url && size);
                        n.render();
                    });
                    km.fire('saveScene');
                    km.layout(300);
                });

            },
            queryState: function(km) {
                var nodes = km.getSelectedNodes(),
                    result = 0;
                if (nodes.length === 0) {
                    return -1;
                }
                nodes.forEach(function(n) {
                    if (n && n.getData('flag')) {
                        result = 0;
                        return false;
                    }
                });
                return result;
            },
            queryValue: function(km) {
                var node = km.getSelectedNode();
                return node ? {
                    url: node.getData('flag'),
                    title: node.getData('flagTitle')
                } : undefined;
            }
        });

        var ImageRenderer = kity.createClass('ImageRenderer', {
            base: Renderer,

            create: function(node) {
                return new kity.Image(node.getData('flag'));
                // return new FlagIcon(node)
            },

            shouldRender: function(node) {
                return node.getData('flag');
            },

            update: function(image, node, box) {
                var url = node.getData('flag');
                var title = node.getData('flagTitle');
                var size = ImageSZ;
                var spaceTop = node.getStyle('space-top');

                if (!size) return;

                if (title) {
                    image.node.setAttributeNS('http://www.w3.org/1999/xlink', 'title', title);
                }

                var x = box.cx - size.width / 2;
                var y = box.y - size.height - spaceTop;

                image
                    .setUrl(url)
                    .setX(x | 0)
                    .setY(y | 0)
                    .setWidth(size.width | 0)
                    .setHeight(size.height | 0);

                return new kity.Box(x | 0, y | 0, size.width | 0, size.height | 0);
            }
        });

        // 图标的图形
        var FlagIcon = kity.createClass('FlagIcon', {
            base: kity.Group,

            constructor: function(node) {
                this.callBase();
                this.setSize(30);
                this.create(node);
                this.setId(utils.uuid('node_flag'));
            },

            setSize: function(size) {
                this.width = this.height = size;
            },

            create: function(node) {
                var flag = new kity.Image(node.getData('flag'));
                flag.setWidth(this.width | 0)
                flag.setHeight(this.height | 0);
                this.addShapes([flag]);
                this.flag = flag;
            }
        });

        return {
            'commands': {
                'flag': ImageCommand
            },
            'renderers': {
                left: kity.createClass('ImageRenderer', {
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
                        return node.getData('flag');
                    },

                    update: function(icon, node, box) {
                        var data = node.getData('flag');
                        var spaceLeft = node.getStyle('space-left'),
                            x, y;

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
});