/************
 https://github.com/kevinoes/page-slider-js 를 jQuery로 변경
 ************/
(function ($) {
    $.PageSlider = function (element, data) {

        var sliderElement = element;
        var pages = [];
        var currentSlide = 1;
        var isChanging = false;
        var keyUp = {38: 1, 33: 1};
        var keyDown = {40: 1, 34: 1};
        var enabled = {"up":true, "down":true};
        var listeners = [];
        var onLeaveData = {};
        var touchStartEvent = null;
        var touchSlideEnabled = null;

        var option = $.extend({}, {
            indicator: true,
            //콜백 추가
            onLeave: null,
            //종료 콜백 추가
            onLeaveEnd: null,
        }, data);

        //removeListener를 위한 addListener 추가
        function addListener(name, listener, dom) {
            if(!dom){
                dom = window;
                dom.addEventListener(name, listener);
            }
            dom.addEventListener(name, listener);
            listeners.push({"name":name, "listener":listener, "dom" : dom});
        }
        
        function isSlideEnabled(event, direction){
            var isEnabled = "all";
            event.path.forEach(function(dom){
                if(dom.className && dom.className.indexOf("slider__") != -1 || !isEnabled) return;

                if(dom.scrollHeight > dom.clientHeight+10){
                    if(dom.scrollTop == 0){
                        isEnabled = "up";
                        
                    }else if(dom.scrollTop + dom.clientHeight >= dom.scrollHeight){
                        isEnabled = "down";
                    }else{
                        isEnabled = null;
                    }
                }
            });
            if(direction){
                return (isEnabled == "all" || isEnabled == direction)?true:false;
                
            }else{
                return isEnabled;
            }
        }

        var init = function () {
            document.body.classList.add('slider__body');

            // control scrolling
            whatWheel = 'onwheel' in document.createElement('div') ? 'wheel' : document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
            wheelFun = function (e) {
                var direction = (e.wheelDelta || e.deltaY) > 0?"up":"down";
                
                if(!isSlideEnabled(e, direction)){
                    return;
                }
                
                if (direction == "up") {
                    changeSlide(-1);
                } else {
                    changeSlide(1);
                }
            };
            addListener(whatWheel, wheelFun);

            // allow keyboard input
            keyDownFun = function (e) {
                if (keyUp[e.keyCode]) {
                    changeSlide(-1);
                } else if (keyDown[e.keyCode]) {
                    changeSlide(1);
                }
            };
            addListener('keydown', keyDownFun);

            // page change animation is done
            if (getTransitionEndEventName()) {
                addListener(getTransitionEndEventName(), function () {
                    if (isChanging) {
                        setTimeout(function () {
                            if(option.onLeaveEnd){
                                option.onLeaveEnd(onLeaveData.original, onLeaveData.destination, onLeaveData.direction);
                            }
                            isChanging = false;
                        }, 400);
                    }else if(option.onLeaveEnd){
                        option.onLeaveEnd(onLeaveData.original, onLeaveData.destination, onLeaveData.direction);
                    }
                }, document.querySelector(sliderElement));
            }

            document.querySelector(sliderElement).classList.add('slider__container');

            // set up page and build visual indicators
            if (option.indicator) {
                var indicatorContainer = document.createElement('div');
                indicatorContainer.classList.add('slider__indicators');
            }

            var index = 1;
            [].forEach.call(document.querySelectorAll(sliderElement + ' > *'), function (section) {

                if (option.indicator) {
                    var indicator = document.createElement('a');
                    indicator.classList.add('slider__indicator');
                    indicator.setAttribute('data-slider-target-index', index);
                    indicatorContainer.appendChild(indicator);
                }

                section.classList.add('slider__page');
                pages.push(section);
                section.setAttribute('data-slider-index', index++);
            });


            if (option.indicator) {
                document.body.appendChild(indicatorContainer);
                document.querySelector('a[data-slider-target-index = "' + currentSlide + '"]').classList.add('slider__indicator--active');
            }

            // stuff for touch devices
            var touchStartPos = 0;
            var touchStopPos = 0;
            var touchMinLength = 90;
            addListener('touchstart', function (e) {
                touchStartEvent = e;
                //onclick 이벤트가 발생하지 않는 오류 수정
                if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
                    var touch = e.touches[0] || e.changedTouches[0];
                    touchStartPos = touch.pageY;
                }
                
                touchSlideEnabled = isSlideEnabled(e);
            });
            
            //onclick 이벤트가 발생하지 않는 오류 수정            
            addListener('touchmove', function (e) {e.preventDefault();},  document);

            addListener('touchend', function (e) {
                if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
                    var touch = e.touches[0] || e.changedTouches[0];
                    touchStopPos = touch.pageY;
                }
                
                var direction = null;
                if(touchStartPos + touchMinLength < touchStopPos){
                    direction = "up";
                }else if (touchStartPos > touchStopPos + touchMinLength) {
                    direction = "down";
                }
                
                console.log("end");
                
                if(!direction || !touchSlideEnabled || (touchSlideEnabled != "all" && touchSlideEnabled != direction) || !isSlideEnabled(touchStartEvent, direction)){
                    return;
                }
                
                if (direction == "up") {
                    changeSlide(-1);
                } else{
                    changeSlide(1);
                }
                
            });
        };

        // prevent double scrolling
        var getTransitionEndEventName = function () {
            var transition;
            var e = document.createElement('foobar');
            var transitions = {
                'transition': 'transitionend',
                'OTransition': 'oTransitionEnd',
                'MozTransition': 'transitionend',
                'WebkitTransition': 'webkitTransitionEnd'
            };

            for (transition in transitions) {
                if (e.style[transition] !== undefined) {
                    return transitions[transition];
                }
            }
            return false;
        };


        // handle css change
        var changeCss = function (obj, styles) {
            for (var _style in styles) {
                if (obj.style[_style] !== undefined) {
                    obj.style[_style] = styles[_style];
                }
            }
        };

        // handle page/section change
        var changeSlide = function (direction) {

            // already doing it or last/first page, staph plz
            if ((!enabled.up && !enabled.down) || isChanging || (direction == 1 && currentSlide == pages.length) || (direction == -1 && currentSlide == 1)) {
                return;
            }
            
            directionStr = direction > 0 ? "down" : "up";
            
            if((directionStr == "up" && !enabled.up) || (directionStr == "down" && !enabled.down)){
                return;
            }

            //콜백 추가
            onLeaveData = {"original" : currentSlide, "destination" : currentSlide + direction, "direction" : directionStr};
            if (option.onLeave) {
                option.onLeave(onLeaveData.original, onLeaveData.destination, onLeaveData.direction);
            }
            // change page
            currentSlide += direction;
            isChanging = true;
            changeCss(document.querySelector(sliderElement), {
                transform: 'translate3d(0, ' + -(currentSlide - 1) * 100 + '%, 0)'
            });

            if (option.indicator) {
                // change dots
                document.querySelector('a.slider__indicator--active').classList.remove('slider__indicator--active');
                document.querySelector('a[data-slider-target-index="' + currentSlide + '"]').classList.add('slider__indicator--active');
            }
        };

        // go to spesific slide if it exists
        var gotoSlide = function (where) {
            var target = document.querySelector(where).getAttribute('data-slider-index');
            if (target != currentSlide && document.querySelector(where)) {
                changeSlide(target - currentSlide);
            }
        };

        //페이지 이동 함수 추가
        this.goPage = function (page) {
            gotoSlide('div[data-slider-index = "' + page + '"]');
        }

        // on/off 함수 추가
        this.setEnabled = function (isEnabled, direction) {
            var enabledTemp = {};
            if(!direction){
                enabledTemp['up'] = isEnabled;
                enabledTemp['down'] = isEnabled;
                
            }else if(direction == "up"){
                enabledTemp['up'] = isEnabled;
                enabledTemp['down'] = enabled.down
                
            }else if(direction == "down"){
                enabledTemp['up'] = enabled.up
                enabledTemp['down'] = isEnabled;
            }
            
            enabled = enabledTemp;
//            console.log(enabled);
        }

        // we have lift off
        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('onload', init(), false);
        }

        //update 추가
        this.update = function () {
            this.destroy();
            init();
        }

        //destroy 추가
        this.destroy = function () {
            document.querySelector('.slider__body').classList.remove('slider__body');
            document.querySelector('.slider__container').classList.remove('slider__container');
            document.querySelector('.slider__page').classList.remove('slider__page');
            document.querySelector('.slider__page').removeAttribute('data-slider-index');

            for (var i = 0 ; i < listeners.length ; i++) {
                if(!listeners[i].dom){
                    listeners[i].dom = window;
                }
                listeners[i].dom.removeEventListener(listeners[i].name, listeners[i].listener);
            }

            this.listeners = {};
        }

        return this;
    };
})(jQuery);