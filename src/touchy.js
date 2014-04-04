/**
 * touchy.js
 *
 * A JavaScript microlibrary for UI interaction on mobile and desktop.
 * Dispatches custom events to be used when normal events does not suffice.
 *
 * BROWSER SUPPORT: Safari, Chrome, Firefox, IE9, iOS4+, Android 4+
 *
 * @author     Stefan Liden
 * @version    1.0.0
 * @copyright  Copyright 2011-2014 Stefan Liden
 * @license    MIT
 */

(function() {
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
      evts = isTouch ? touchEvents : setEventType();
  
  // If this is not touch, is it a MS Pointer or a regular mouse device?
  function setEventType () {
    return window.navigator.msPointerEnabled ? msPointerEvents : mouseEvents;
  }
  
  // Dispatch new event
  function dispatchEvent (target, event) {
    var evt = d.createEvent('UIEvents');
  
    evt.initEvent(event, true, true);
    target.dispatchEvent(evt);
  }
  
  function onStart (event) {
    var startTime = new Date().getTime(),
        touch = isTouch ? event.touches[0] : event,
        nrOfFingers = isTouch ? event.touches.length : 1,
        startX, startY, hasMoved;
        
    // Prevent panning and zooming (IE)
    if (event.preventManipulation) event.preventManipulation();
    
    // See blog.msdn.com/b/ie/20111/10/19/handling-multi-touch-and-mouse-input-in-all-browsers.aspx
    if (typeof event.target.style.msTouchAction !== 'undefined') event.target.style.msTouchAction = 'none';
  
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
              dispatchEvent(ele, 'doubleTap');
            }
            else {
              dispatchEvent(ele, 'tap');
              doubleTap = true;
            }
            resetDoubleTap();
          }
          else {
            dispatchEvent(ele, 'longTouch');
          }
        }
        else {
          if (timeDiff < 500) {
            endX = endX || changed.clientX;
            endY = endY || changed.clientY;
            diffX = diffX || endX-startX;
            diffY = diffY || endY-startY;
            dirX = diffX > 0 ? 'right' : 'left';
            dirY = diffY > 0 ? 'down' : 'up';
            absDiffX = Math.abs(diffX);
            absDiffY = Math.abs(diffY);
  
            if (absDiffX >= absDiffY) {
              swipeEvent += dirX;
            }
            else {
              swipeEvent += dirY;
            }
  
            dispatchEvent(ele, swipeEvent);
          }
        }
      }
      else if (nrOfFingers === 2) {
        dispatchEvent(ele, 'twoFingerTap');
      }
      else if (nrOfFingers === 3) {
        dispatchEvent(ele, 'threeFingerTap');
      }
  
      d.removeEventListener(evts.move, onMove, false);
      d.removeEventListener(evts.end, onEnd, false);
    }
  }
  
  function resetDoubleTap() {
    setTimeout(function() {doubleTap = false;}, 400);
  }
  
  // Previous fix for stopPropagation. 
  // DEPRECATED - Use "event.stopPropagation()" instead
  function stopBubbling (event) {
    event.cancelBubble = true;
    setTimeout(function() {
      event.cancelBubble = false;
    },0);
    if (window.console && window.console.warning) console.warning("touchy.stop is deprecated. Please use event.stopPropagation instead.");
  }
  
  d.addEventListener(evts.start, onStart, false);
  
  // Return an object to access useful properties and methods
  return window.touchy = {
    isTouch: isTouch,
    stop: stopBubbling,
    events: evts
  }
}());