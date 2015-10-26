!function($, Foundation){
  'use strict';
  function Sticky(element, options){
    this.$element = element;
    this.options = $.extend({}, Sticky.defaults, this.$element.data(), options || {});

    this._init();

    Foundation.registerPlugin(this);
  }
  Sticky.defaults = {
    stickToWindow: false,
    container: '<div data-sticky-container></div>',
    stickTo: 'top',
    stickAt: '',
    marginTop: 1,
    marginBottom: 1,
    stickyOn: 'medium',
    stickyClass: 'sticky',
    containerClass: 'sticky-container',
    checkEvery: 25
  };

  Sticky.prototype._init = function(){
    console.log('called');
    var $parent = this.$element.parent('[data-sticky-container]'),
        id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
        _this = this;
        // _this = this;
    this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
    this.$container.addClass(this.options.containerClass);

    this.$anchor = this.options.stickAt ? $(this.options.stickAt) : $(document.body);

    this.$element.addClass(this.options.stickyClass)
                 .attr({'data-resize': id});

    this.scrollCount = this.options.checkEvery;
    this.isStuck = false;

    this._setSizes(function(){
      _this._calc(false);
    });

    this._events(id);

  };
  Sticky.prototype._events = function(id){
    var _this = this;
    id = id.split('-').reverse().join('-');
    var scrollListener = 'scroll.zf.' + id;

    this.$element.off('resizeme.zf.trigger')
                 .on('resizeme.zf.trigger', function(e, el){
                     _this._setSizes(function(){
                       _this._calc(false);
                     });
    });
    this.$anchor.off('change.zf.sticky')
                .on('change.zf.sticky', function(){
                  _this._setSizes(function(){
                    _this._calc(false);
                  });
                });

    $(window).off(scrollListener)
             .on(scrollListener, function(e){
              if(_this.scrollCount){
                _this.scrollCount--;
                _this._calc(false, e.currentTarget.scrollY);
              }else{
                _this.scrollCount = _this.options.checkEvery;
                _this._setSizes(function(){
                  _this._calc(false, e.currentTarget.scrollY);
                })
              }
             });
  }

  Sticky.prototype._calc = function(checkSizes, scroll){
    if(checkSizes){ this._setSizes(); }

    if(!this.canStick){
      if(this.isStuck){
        this._removeSticky(true);
      }
      return false;
    }

    if(!scroll){ scroll = window.scrollY; }

    if(scroll >= this.topPoint){
      if(scroll <= this.bottomPoint){
        if(!this.isStuck){
          this._setSticky();
        }
      }else{
        if(this.isStuck){
          this._removeSticky(false);
        }
      }
    }else{
      if(this.isStuck){
        this._removeSticky(true);
      }
    }
  };
  Sticky.prototype._setSticky = function(){
    var stickTo = this.options.stickTo,
        mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
        notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
        css = {};

    css[mrgn] = this.options[mrgn] + 'em';
    css[stickTo] = 0;
    css[notStuckTo] = 'auto';
    this.isStuck = true;
    this.$element.removeClass('is-anchored is-at-' + notStuckTo)
                 .addClass('is-stuck is-at-' + stickTo)
                 .css(css);
  };
  Sticky.prototype._removeSticky = function(isTop){
    var stickTo = this.options.stickTo,
        stickToTop = stickTo === 'top',
        css = {}, mrgn, notStuckTo;
        mrgn = stickToTop ? 'marginTop' : 'marginBottom';
        notStuckTo = stickToTop ? 'bottom' : 'top';
      css[mrgn] = 0;

    if((isTop && !stickToTop) || (stickToTop && !isTop)){
      css[stickTo] = this.anchorHeight - this.elemHeight;
      css[notStuckTo] = 0;
    }else{
      css[stickTo] = 0;
      css[notStuckTo] = this.anchorHeight - this.elemHeight;
    }
    this.isStuck = false;
    this.$element.removeClass('is-stuck is-at-' + stickTo)
                 .addClass('is-anchored is-at-' + (isTop ? 'top' : 'bottom'))
                 .css(css);
  };

  Sticky.prototype._setSizes = function(cb){
    var _this = this,
        newElemWidth = this.$container[0].getBoundingClientRect().width,
        // newElemWidth = this.$container.width(),
        // pdng = parseInt(this.$container.css('padding-right'));
        pdng = parseInt(window.getComputedStyle(this.$container[0])['padding-right'], 10);

    // this.anchorHeight = this.$anchor.height();
    this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
    this.$element.css({
      'max-width': newElemWidth - pdng + 'px'
    });
    // console.log('anchor', this.anchorHeight);

    // var newContainerHeight = this.$element.height() || this.containerHeight;
    var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
    this.containerHeight = newContainerHeight;
    this.$container.css({
      height: newContainerHeight
    });
    this.elemHeight = newContainerHeight;
    this.canStick = Foundation.MediaQuery.atLeast(this.options.stickyOn);

    this._setBreakPoints(newContainerHeight, function(){
      if(cb){ cb(); }
    });

  };
  Sticky.prototype._setBreakPoints = function(elemHeight, cb){
    console.log('called _setBreakPoints');
    if(!this.canStick){
      if(cb){ cb(); }
      else{ return false; }
    }
    var mTop = emCalc(this.options.marginTop),
        mBtm = emCalc(this.options.marginBottom),
        topPoint = this.$anchor.offset().top,
        bottomPoint = topPoint + this.anchorHeight,
        // bottomPoint = topPoint + this.$anchor[0].getBoundingClientRect().height,
        winHeight = window.innerHeight;
    if(this.options.stickTo === 'top'){
      topPoint -= mTop;

      bottomPoint -= (elemHeight + mTop);
      // bottomPoint -= this.$element[0].getBoundingClientRect().height + mTop;
    }else if(this.options.stickTo === 'bottom'){
      topPoint -= (winHeight - (elemHeight + mBtm));
      bottomPoint -= (winHeight - mBtm);
    }else{
      //this would be the stickTo: both option... tricky
    }

    this.topPoint = topPoint;
    this.bottomPoint = bottomPoint;
    // console.log('top',this.topPoint,'bottom', this.bottomPoint, 'anchor', this.anchorHeight);

    if(cb){ cb(); }
  };

  function emCalc(em){
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }
  Foundation.plugin(Sticky);
}(jQuery, window.Foundation);
