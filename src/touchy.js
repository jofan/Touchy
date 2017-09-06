/**
 * touchy.js
 *
 * A JavaScript microlibrary for UI interaction on mobile and desktop.
 * Dispatches custom events to be used when normal events does not suffice.
 *
 * BROWSER SUPPORT: Safari, Chrome, Firefox, IE9, iOS4+, Android 4+
 *
 * @author     Stefan Liden
 * @version    1.3.1
 * @copyright  Copyright 2011-2016 Stefan Liden
 * @license    MIT
 */

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
      // http://jessefreeman.com/articles/from-webkit-to-windows-8-touch-events/
      msPointerEvents = {
        start: 'MSPointerDown',
        move: 'MSPointerMove',
        end: 'MSPointerUp'
      },
      // https://coderwall.com/p/mfreca/ie-11-in-windows-8-1-pointer-events-changes
      msIEElevenPointerEvents = {
        start: 'pointerdown',
        move: 'pointermove',
        end: 'pointerup'
      },
      evts = isTouch ? touchEvents : setEventType();

  // If this is not touch, is it a MS Pointer or a regular mouse device?
  function setEventType () {
    if(window.navigator.pointerEnabled) return msIEElevenPointerEvents;
    return window.navigator.msPointerEnabled ? msPointerEvents : mouseEvents;
  }

  // Dispatch new event
    function dispatchEvent (target, eventName, event) {
        var evt;
        // Modern browsers
        if (window.CustomEvent) {
            evt = new CustomEvent(eventName, {
                'detail': {
                    'clientX': event.clientX,
                    'clientY': event.clientY
                },
                cancelable: true,
                bubbles: true
            });
        }
        // Old browsers
        else {
            evt = d.createEvent('MouseEvent');
            evt.initEvent(eventName, true, true);
        }

        target.dispatchEvent(evt);
  }

  function onStart (event) {
    var startTime = new Date().getTime(),
        touch = isTouch ? event.touches[0] : event,
        nrOfFingers = isTouch ? event.touches.length : 1,
        startX, startY;
    var hasMoved = false;

    // Prevent panning and zooming (IE)
    if (event.preventManipulation) event.preventManipulation();

    // See blog.msdn.com/b/ie/20111/10/19/handling-multi-touch-and-mouse-input-in-all-browsers.aspx
    if (typeof event.target.style.msTouchAction !== 'undefined') event.target.style.msTouchAction = 'none';

    startX = touch.clientX;
    startY = touch.clientY;

    d.addEventListener(evts.move, onMove, false);
    d.addEventListener(evts.end, onEnd, false);

    function onMove (e) {
      if (!hasMoved) {
        hasMoved = true;
        nrOfFingers = isTouch ? e.touches.length : 1;
      }
      dispatchEvent(e.target, 'drag', e);
    }

    function onEnd (e) {
      var endX, endY, diffX, diffY, dirX, dirY, absDiffX, absDiffY,
          ele = e.target,
          changed = isTouch ? e.changedTouches[0] : e,
          swipeEvent = 'swipe',
          endTime = new Date().getTime(),
          timeDiff = endTime - startTime;

      // Fix for IE always triggering onMove and not to count very small moves
      if (hasMoved) {
        endX = changed.clientX;
        endY = changed.clientY;
        diffX = endX-startX;
        diffY = endY-startY;
        // If the move is less than 10px, then we don't consider it a move
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
          hasMoved = false;
        }
      }

      if (nrOfFingers === 1) {
        if (!hasMoved) {
          if (timeDiff <= 500) {
            if (doubleTap) {
                dispatchEvent(ele, 'doubleTap', e);
            }
            else {
                dispatchEvent(ele, 'tap', e);
              doubleTap = true;
            }
            resetDoubleTap();
          }
          else {
              dispatchEvent(ele, 'longTouch', e);
          }
        }
        else {
          if (timeDiff < 300) {
            endX = endX || changed.clientX;
            endY = endY || changed.clientY;
            diffX = diffX || endX-startX;
            diffY = diffY || endY-startY;
            dirX = diffX > 0 ? 'right' : 'left';
            dirY = diffY > 0 ? 'down' : 'up';
            absDiffX = Math.abs(diffX);
            absDiffY = Math.abs(diffY);

            // If moving finger far, it's not a swipe
            if (absDiffX < 40 || absDiffY < 40) {
              if (absDiffX >= absDiffY) {
                swipeEvent += dirX;
              }
              else {
                swipeEvent += dirY;
              }

                dispatchEvent(ele, swipeEvent, e);
            }
          }
          else {
              dispatchEvent(ele, 'drop', e);
          }
        }
      }
      else if (!hasMoved) {
        if (nrOfFingers === 2) {
            dispatchEvent(ele, 'twoFingerTap', e);
        }
        else if (nrOfFingers === 3) {
            dispatchEvent(ele, 'threeFingerTap', e);
        }
        else if (nrOfFingers === 4) {
            dispatchEvent(ele, 'fourFingerTap', e);
        }
      }
      // Event indicating gesture. Use hammer.js for gesture events
      else {
          dispatchEvent(ele, 'gesture', e);
      }

      d.removeEventListener(evts.move, onMove, false);
      d.removeEventListener(evts.end, onEnd, false);
    }
  }

  function resetDoubleTap() {
    setTimeout(function() {doubleTap = false;}, 400);
  }

  d.addEventListener(evts.start, onStart, false);

  // Deprecated.
  function stop(e) {
    if (e && e.bubbles) {
      e.stopPropagation();
    }
  }

  // Return an object to access useful properties and methods
  window.touchy = {
    isTouch: isTouch,
    stop: stop,
    events: evts
  };
}());
