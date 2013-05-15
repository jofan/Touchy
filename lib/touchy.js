/**
 * touchy.js
 *
 * A JavaScript microlibrary for UI interaction on mobile and desktop.
 * Dispatches custom events to be used when normal events does not suffice.
 * NOTE: stopPropagation() will not work on these events, use touchy.stop(event) instead.
 *
 * BROWSER SUPPORT: Safari, Chrome, Firefox, IE9, iOS4+, Android 4+
 *
 * @author     Stefan Liden
 * @version    0.9
 * @copyright  Copyright 2011-2013 Stefan Liden
 * @license    MIT
 */

module.exports = touchy;

  var d = document,
      touchy,
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
      // http://jessefreeman.com/articles/from-webkit-to-windows-8-touch-events/
      msPointerEvents = {
        start: 'MSPointerDown',
        move: 'MSPointerMove',
        end: 'MSPointerUp'
      },
      evts = isTouch ? touchEvents : setEventType(),
      customEvents = {
        tap: '',
        doubleTap: '',
        twoFingerTap: '',
        longTouch: '',
        swipeleft: '',
        swiperight: '',
        swipeup: '',
        swipedown: ''
      },
      swipeEvents = ['tap', 'doubleTap', 'twoFingerTap', 'longTouch', 'swipeleft', 'swiperight', 'swipeup', 'swipedown'];

  // If this is not Webkit touch, is it a MS Pointer or a regular mouse device?
  function setEventType () {
    return window.navigator.msPointerEnabled ? msPointerEvents : mouseEvents;
  }
  
  // Create the custom events to be dispatched
  function createSwipeEvents () {
    swipeEvents.forEach(function(evt) {
      customEvents[evt] = d.createEvent('UIEvents');
      customEvents[evt].initEvent(evt, true, true);
    });
  }

  // Fix for stopPropagation. It's not working in Webkit and Opera for custom events
  function stopBubbling (event) {
    event.cancelBubble = true;
    setTimeout(function() {
      event.cancelBubble = false;
    },0);
  }

  function onStart (event) {
    var startTime = new Date().getTime(),
        touch = isTouch ? event.touches[0] : event,
        nrOfFingers = isTouch ? event.touches.length : 1,
        startX, startY, hasMoved;

    startX = touch.clientX;
    startY = touch.clientY;
    hasMoved = false;

    d.addEventListener(evts.move, onMove, false);
    d.addEventListener(evts.end, onEnd, false);
    
    function onMove (e) {
      hasMoved = true;
      nrOfFingers = isTouch ? e.touches.length : 1;
    }

    function onEnd (e) {
      var endX, endY, diffX, diffY,
          ele = e.target,
          changed = isTouch ? e.changedTouches[0] : e,
          customEvent = '',
          endTime = new Date().getTime(),
          timeDiff = endTime - startTime;

      if (nrOfFingers === 1) {
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
          if (timeDiff < 500) {
            endX = changed.clientX;
            endY = changed.clientY;
            diffX = endX-startX;
            diffY = endY-startY;
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
        }
      }
      else if (nrOfFingers === 2) {
        ele.dispatchEvent(customEvents.twoFingerTap);
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

  // Return an object to access useful properties and methods
  touchy = {
    isTouch: isTouch,
    stop: stopBubbling,
    events: evts
  }