/**
 * touchy.js
 *
 * A JavaScript microlibrary for UI interaction on mobile and desktop.
 * Dispatches custom events to be used when normal events does not suffice.
 *
 * BROWSER SUPPORT: Safari, Chrome, Firefox, IE9, iOS4+, Android 4+
 *
 * @author     Stefan Liden
 * @version    2.0.0
 * @copyright  Copyright 2011-2018 Stefan Liden
 * @license    MIT
 */

// IE polyfill
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

(function() {

  var d = document,
      hasTouch = 'ontouchstart' in window,
      doubleTap = false,
      nonTouchActive = false,
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
      // Pointer events now supported in multiple browsers
      pointerEvents = {
        start: 'pointerdown',
        move: 'pointermove',
        end: 'pointerup'
      },
      nonTouchEvts = setEventType(),
      evts = hasTouch ? touchEvents : setEventType();

  isTouch = hasTouch; // Backward compatibility

  // If this is not touch, is it a MS Pointer or a regular mouse device?
  function setEventType () {
    if(window.onpointerdown || window.navigator.pointerEnabled) return pointerEvents;
    return window.navigator.msPointerEnabled ? msPointerEvents : mouseEvents;
  }

  // Dispatch new event
  // Chrome (61.0.3163.100) does not have an object at event.touches[0] for most events!
  function dispatchEvent (target, eventName, event) {
    var evt,
        touch = event;
    // Modern mobile browsers
    if (event.changedTouches) {
      touch = event.changedTouches[0];
    }
    // IE less than Edge
    else if (event.touches) {
      touch = event.touches[0];
    }

	  evt = new window.CustomEvent(eventName, {
		  'detail': {
			  'clientX': touch.clientX,
			  'clientY': touch.clientY
		  },
		  cancelable: true,
		  bubbles: true
	  });

	  target.dispatchEvent(evt);
  }

  function onStart (event) {
    var isTouchEvent = event.type === 'touchstart' ? true : false;
    var startTime = new Date().getTime(),
        touch = event,
        nrOfFingers = isTouchEvent ? event.touches.length : 1,
        startX, startY;
    var hasMoved = false;

    // Modern mobile browsers
    if (event.changedTouches) {
        touch = event.changedTouches[0];
    }
    // IE less than Edge
    else if (event.touches) {
        touch = event.touches[0];
    }

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
        nrOfFingers = isTouchEvent ? e.touches.length : 1;
      }
      dispatchEvent(e.target, 'drag', e);
    }

    function onEnd (e) {
      var endX, endY, diffX, diffY, dirX, dirY, absDiffX, absDiffY,
          ele = e.target,
          changed = e,
          swipeEvent = 'swipe',
          endTime = new Date().getTime(),
          timeDiff = endTime - startTime;


      // Modern mobile browsers
      if (e.changedTouches) {
          changed = e.changedTouches[0];
      }
      // IE less than Edge
      else if (e.touches) {
          changed = e.touches[0];
      }

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

      // Taps
      if (!hasMoved) {
        if (nrOfFingers === 1) {
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
      // Swipes
      else {
        if (nrOfFingers === 1) {
          if (timeDiff < 500) {
            endX = endX || changed.clientX;
            endY = endY || changed.clientY;
            diffX = diffX || endX-startX;
            diffY = diffY || endY-startY;
            dirX = diffX > 0 ? 'right' : 'left';
            dirY = diffY > 0 ? 'down' : 'up';
            absDiffX = Math.abs(diffX);
            absDiffY = Math.abs(diffY);

            // If moving finger far, it's not a swipe
            if (absDiffX < 100 || absDiffY < 100) {
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
        // Simple multifinger swipes. No direction indicated
        if (nrOfFingers === 2) {
          dispatchEvent(ele, 'twoFingerSwipe', e);
        }
        else if (nrOfFingers === 3) {
          dispatchEvent(ele, 'threeFingerSwipe', e);
        }
        else if (nrOfFingers === 4) {
          dispatchEvent(ele, 'fourFingerSwipe', e);
        }
        // Event indicating other gesture. Use hammer.js for gesture events
        else {
            dispatchEvent(ele, 'gesture', e);
        }
      }

      if (!nonTouchActive) {
        e.preventDefault(); // Make sure non-touch isn't called afterwards
        addNonTouchListeners();
      }

      d.removeEventListener(evts.move, onMove, false);
      d.removeEventListener(evts.end, onEnd, false);
    }
  }

  function resetDoubleTap() {
    setTimeout(function() {doubleTap = false;}, 400);
  }

  function startTouch(e) {
    evts = touchEvents;
    removeNonTouchListeners();
    onStart(e);
  }

  function startNonTouch(e) {
    evts = nonTouchEvts;
    onStart(e);
  }

  // Touch events should always be called first
  function addNonTouchListeners() {
    d.addEventListener(nonTouchEvts.start, startNonTouch, false);
    nonTouchActive = true;
  }

  function removeNonTouchListeners() {
    d.removeEventListener(nonTouchEvts.start, startNonTouch, false);
    nonTouchActive = false;
  }

  d.addEventListener('touchstart', startTouch, false);

  addNonTouchListeners();

  // Return an object to access useful properties and methods
  window.touchy = {
    isTouch: isTouch, // DEPRECATED
    hasTouch: hasTouch,
    events: evts,
    touchEvents: hasTouch ? touchEvents : {},
    nonTouchEvents: nonTouchEvts
  };
}());
