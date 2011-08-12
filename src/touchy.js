/* TOUCHY microlibrary */

(function() {
  var d = document,
      isTouch = 'ontouchstart' in window,
      doubleTap = false,
      touchEvents = {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
      },
      mouseEvents = {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup'
      },
      evts = isTouch ? touchEvents : mouseEvents,
      customEvents = {
        tap: '',
        doubleTap: '',
        longTouch: '',
        swipeleft: '',
        swiperight: '',
        swipeup: '',
        swipedown: '',
        drag: ''
      },
      swipeEvents = ['tap', 'doubleTap', 'longTouch', 'swipeleft', 'swiperight', 'swipeup', 'swipedown', 'drag'];

  function createSwipeEvents () {
    swipeEvents.forEach(function(evt) {
      customEvents[evt] = document.createEvent('UIEvents');
      customEvents[evt].initEvent(evt, true, true);
    });
  }
  function onStart (event) {
    var startTime = new Date().getTime(),
        touch = isTouch ? event.touches[0] : event,
        startX, startY, hasMoved;

    startX = touch.clientX;
    startY = touch.clientY;
    hasMoved = false;

    d.addEventListener(evts.move, onMove, false);
    d.addEventListener(evts.end, onEnd, false);
    
    function onMove (event) {
      hasMoved = true;
    }
    function onEnd (event) {
      var endX, endY, diffX, diffY,
          ele = event.target,
          customEvent = '',
          endTime = new Date().getTime(),
          timeDiff = endTime - startTime;

      touch = isTouch ? touch : event;

      if (!hasMoved) {
        if (timeDiff <= 500) {
          if (doubleTap) {
            ele.dispatchEvent(customEvents.doubleTap);
          }
          else {
            ele.dispatchEvent(customEvents.tap);
            doubleTap = true;
          }
          resetDoubleTap();
        }
        else {
          ele.dispatchEvent(customEvents.longTouch);
        }
      }
      else {
        endX = touch.clientX;
        endY = touch.clientY;
        diffX = endX-startX;
        diffY = endY-startY;
        if (timeDiff < 500) {
          dirX = diffX > 0 ? 'right' : 'left';
          dirY = diffY > 0 ? 'down' : 'up';
          absDiffX = Math.abs(diffX);
          absDiffY = Math.abs(diffY);
          
          if (absDiffX >= absDiffY) {
            customEvent = 'swipe' + dirX;
          }
          else {
            customEvent = 'swipe' + dirY;
          }
          
          ele.dispatchEvent(customEvents[customEvent]);
        }
        else {
          ele.dispatchEvent(customEvents['drag']);
        }
      }

      d.removeEventListener(evts.move, onMove, false);
      d.removeEventListener(evts.end, onEnd, false);
    }
  }
  function resetDoubleTap() {
    setTimeout(function() {doubleTap = false;}, 400);
  }

  createSwipeEvents();
  d.addEventListener(evts.start, onStart, false);

  return window.touchy = {
    isTouch: isTouch,
    events: evts
  }
})();
