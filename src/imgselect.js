/**
 * Created by liuhui on 15/11/18.
 */
/*
 * ImgSelect 完成图片选择区域放大功能
 * init：封装img容器，包含以下层:
 *
 * 遮罩(半透明)
 * 当前图片显示
 * 拉伸点8个
 * 走马条4条
 *
 * */
(function ($) {
    var sid = 0,
    wrapCls = 'img-select-wrap', imgCls = 'img-select-img',
    maskcls = 'img-select-mask',
    smallCls = 'img-select-small-wrap', smallImgCls = 'img-select-small',
    largeCls = 'img-select-large-wrap', largeImgCls = 'img-select-large';

    function createEle(tag, cls, src) {
        var $dom = $('<' + tag + '/>').addClass(cls);
        if (src) $dom.attr("src", src);
        return $dom;
    }

    function isElement(obj) {
        try {
            return obj instanceof HTMLElement;
        }
        catch (e) {
            return (typeof obj === "object") &&
                   (obj.nodeType === 1) && (typeof obj.style === "object") &&
                   (typeof obj.ownerDocument === "object");
        }
    }

    function limit(num, min, max) {
        return num < min ? min : (num > max ? max : num);
    }

    function getOffset(obj, parent) {
        var coord1 = $(parent).offset(), coord2;
        if (isElement(obj)) {
            coord2 = $(obj).offset();
        } else if (obj.clientX) {
            coord2 = {
                left: obj.clientX,
                top: obj.clientY
            }
        } else {
            return {};
        }
        return {
            left: coord2.left - coord1.left,
            top:  coord2.top - coord1.top
        }
    }

    function getRect(x1, y1, x2, y2) {
        var left, top, width, height;
        left = x1 < x2 ? x1 : x2;
        top = y1 < y2 ? y1 : y2;
        width = Math.abs(x2 - x1);
        height = Math.abs(y2 - y1);
        return {
            left: left,
            top: top,
            width: width,
            height: height
        };
    }

    function getImgRect($image) {
        var offset = $image.offset();
        var imgRect = {
            width: $image.width(),
            height: $image.height(),
            left: offset.left,
            top: offset.top
        };
        return imgRect;

    }

    function ImgSelect(img, options) {
        var imgId = 'img-select' + sid;
        this.$image = $(img).addClass(imgCls).attr('id', imgId);
        this.getImgId = function () {
            return imgId;
        };

        this.imgRect = getImgRect(this.$image);
        this.scale = 2;
        this.useLimit = options.useLimit || 1;
        this.initDom();
        this.bindEvents();

    }

    ImgSelect.prototype = {
        initDom: function () {
            var imgId = this.getImgId(),
            imgRect = this.imgRect,
            scale = this.scale,
            $image = this.$image,
            $parent = createEle('div', wrapCls).attr('data-pid', imgId);
            this.$parent = $parent;
            $parent.appendTo('body').css(imgRect).hide();
            if (!this.$mask) {
                this.$mask = createEle('div', maskcls).attr('data-pid', imgId).appendTo($parent);
            }
            if (!this.$small) {
                this.$smallImg = createEle('img', smallImgCls, $image[0].src).attr('data-pid', imgId);
                this.$small = createEle('div', smallCls).append(this.$smallImg).appendTo($parent).attr('data-pid', imgId);
            }
            if (!this.$large) {
                this.$largeImg = createEle('img', largeImgCls, $image[0].src).css({
                    width:  imgRect.width * scale,
                    height: imgRect.height * scale

                });
                this.$large = createEle('div', largeCls)
                .css({left: imgRect.width})
                .append(this.$largeImg).appendTo($parent);
            }

        },
        bindEvents: function () {
            var self = this,
            x1, y1, x2, y2, isDrag = false,
            clickOffset, isDragImg = false,
            $small = this.$small, $parent = this.$parent,
            imgRect = this.imgRect, useLimit = this.useLimit,
            sid = this.getImgId();
            $('body').on('mousedown', function (e) {
                e.preventDefault();
                var cls = e.target.className || '', $obj = $(e.target);
                if (cls != imgCls && cls != maskcls && cls != smallImgCls) return;
                var cid = $obj.attr('id');
                var pid = $obj.attr('data-pid');
                if (cls == smallImgCls && pid == sid) {
                    isDragImg = true;
                    clickOffset = getOffset(e, $small);
                } else if (cid == sid) {
                    isDrag = true;
                    $parent.show();
                    var offset = getOffset(e, $parent);
                    x1 = offset.left;
                    y1 = offset.top;
                }

            });

            $('body').on('mousemove', function (e) {
                e.preventDefault();
                if (!isDragImg && !isDrag) return;
                var offset = getOffset(e, $parent), left, top, rect = self.rect;
                if (isDragImg) {
                    left = offset.left - clickOffset.left;
                    top = offset.top - clickOffset.top;
                    if (useLimit) {
                        left = limit(left, 0, imgRect.width - rect.width);
                        top = limit(top, 0, imgRect.height - rect.height);
                    }

                    self.rect = {
                        left: left,
                        top: top,
                        width: rect.width,
                        height: rect.height
                    };
                    self.selectImg(self.rect);
                }
                if (isDrag) {
                    x2 = offset.left;
                    y2 = offset.top;
                    if (useLimit) {
                        x2 = limit(x2, 0, imgRect.width);
                        y2 = limit(y2, 0, imgRect.height);
                    }

                    self.rect = getRect(x1, y1, x2, y2);
                    self.selectImg(self.rect);
                }

            });
            $('body').on('mouseup', function (e) {
                e.preventDefault();
                isDrag = false;
                isDragImg = false;
            });

        },
        selectImg: function (rect) {
            this.drawSmallImg(rect);
            this.drawLargeImg(rect);
        },

        drawSmallImg: function (rect) {
            this.$small.css(rect);
            this.$smallImg.css({
                left: -rect.left,
                top: -rect.top
            });

        },

        drawLargeImg: function (rect) {
            var scale = this.scale;
            this.$large.css({
                width:  rect.width * scale,
                height: rect.height * scale
            });
            this.$largeImg.css({
                left: -rect.left * scale,
                top:  -rect.top * scale
            });
        }
    };
    $.ImgSelect = function (img, options) {
        sid++;
        return new ImgSelect(img, options);
    };

})($);