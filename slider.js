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
        var enabledUp = true;
        var enabledDown = true;
        var listeners = [];

        var transitionListener = null;

        var option = $.extend({}, {
            indicator: true,
            //콜백 추가
            onLeave: null,
        }, data);

        //removeListener를 위한 addListener 추가
        function addListener(name, listener) {
            window.addEventListener(name, listener);
            listeners.push({"name": name, "listener": listener});
        }

        var init = function () {
            document.body.classList.add('slider__body');

            // control scrolling
            whatWheel = 'onwheel' in document.createElement('div') ? 'wheel' : document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
            wheelFun = function (e) {
                var direction = e.wheelDelta || e.deltaY;
                if (direction > 0) {
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
            if (detectChangeEnd()) {
                detectFun = function () {
                    if (isChanging) {
                        setTimeout(function () {
                            isChanging = false;
                        }, 400);
                    }
                };
                transitionListener = {"name": detectChangeEnd(), "listener": detectFun}
                document.querySelector(sliderElement).addEventListener(detectChangeEnd(), detectFun);
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
                    indicator.classList.add('slider__indicator')
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
            startFun = function (e) {

                //onclick 이벤트가 발생하지 않는 오류 수정
//				e.preventDefault();
                if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
                    var touch = e.touches[0] || e.changedTouches[0];
                    touchStartPos = touch.pageY;
                }
            };
            addListener('touchstart', startFun);

            //onclick 이벤트가 발생하지 않는 오류 수정
            document.addEventListener('touchmove', function (e) {
                e.preventDefault();
            });

            endFun = function (e) {

                //onclick 이벤트가 발생하지 않는 오류 수정
//				e.preventDefault();
                if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
                    var touch = e.touches[0] || e.changedTouches[0];
                    touchStopPos = touch.pageY;
                }
                if (touchStartPos + touchMinLength < touchStopPos) {
                    changeSlide(-1);
                } else if (touchStartPos > touchStopPos + touchMinLength) {
                    changeSlide(1);
                }
            };
            addListener('touchend', endFun);

        };

        // prevent double scrolling
        var detectChangeEnd = function () {
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
            if ((!enabledUp && !enabledDown) || isChanging || (direction == 1 && currentSlide == pages.length) || (direction == -1 && currentSlide == 1)) {
                return;
            }
            
            directionStr = direction > 0 ? "down" : "up";
            
            if((directionStr == "up" && !enabledUp) || (directionStr == "down" && !enabledDown)){
                return;
            }

            //콜백 추가
            if (option.onLeave) {
                option.onLeave(currentSlide, currentSlide + direction, directionStr);
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
                console.log(target + " : " + currentSlide);
                changeSlide(target - currentSlide);
            }
        };

        //페이지 이동 함수 추가
        this.goPage = function (page) {
            gotoSlide('div[data-slider-index = "' + page + '"]');
        }

        // on/off 함수 추가
        this.setEnabled = function (isEnabled, direction) {
            if(!direction){
                enabledUp = isEnabled;
                enabledDown = isEnabled;
                
            }else if(direction == "up"){
                enabledUp = isEnabled;
                
            }else if(direction == "down"){
                enabledDown = isEnabled;
            }
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

            for (listener in listeners) {
                window.removeEventListener(listener.name, listener.listener);
            }

            if (transitionListener) {
                document.querySelector(sliderElement).removeEventListener(transitionListener.name, transitionListener.listener);
                transitionListener = null;
            }

            this.listeners = [];
        }

        return this;
    };
})(jQuery);