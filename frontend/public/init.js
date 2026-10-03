// Initial splash dismiss logic
(function () {
  function initSplashDismiss() {
    var splash = document.getElementById('initial-splash');
    if (!splash) return;
    var hide = function () {
      splash.classList.add('hidden');
      setTimeout(function () {
        if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      }, 350);
    };
    var root = document.getElementById('root');
    if (root && root.childElementCount > 0) {
      hide();
      return;
    }
    if (root) {
      var observer = new MutationObserver(function () {
        if (root.childElementCount > 0) {
          hide();
          observer.disconnect();
        }
      });
      observer.observe(root, { childList: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplashDismiss);
  } else {
    initSplashDismiss();
  }
})();

// Meta Pixel Code (Queue immediate, script deferred to first user interaction)
(function () {
  window.fbq = window.fbq || function () {
    if (window.fbq.callMethod) {
      window.fbq.callMethod.apply(window.fbq, arguments);
    } else {
      window.fbq.queue.push(arguments);
    }
  };
  if (!window._fbq) window._fbq = window.fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = [];
  window.fbq('init', '1362539488813579');
  window.fbq('track', 'PageView');

  function loadFbPixel() {
    if (window._fbLoaded) return;
    window._fbLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    var first = document.getElementsByTagName('script')[0];
    if (first && first.parentNode) {
      first.parentNode.insertBefore(s, first);
    } else {
      document.head.appendChild(s);
    }
  }

  var userEvents = ['scroll', 'touchstart', 'pointerdown', 'keydown', 'click'];
  function onInteraction() {
    loadFbPixel();
    userEvents.forEach(function (ev) {
      window.removeEventListener(ev, onInteraction);
    });
  }
  userEvents.forEach(function (ev) {
    window.addEventListener(ev, onInteraction, { once: true, passive: true });
  });
})();
