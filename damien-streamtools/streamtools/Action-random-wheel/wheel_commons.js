// wheel_commons.js
// Shared logic between overlay and popup control window.
// Step 1: simple window.postMessage channel.

window.WHEEL_COMMONS = (function () {
  let overlayWindow = null;   // For popup side
  let controlWindow = null;   // For overlay side

  const ORIGIN = '*'; // For local dev; can be tightened later

  function initOverlay() {
    // Overlay listens for messages from popup
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || !data.__wheelMessage) return;

      if (data.role === 'control') {
        // First time we see control, remember its window reference
        controlWindow = event.source;

        // Notify control that overlay is alive
        controlWindow.postMessage(
          { __wheelMessage: true, role: 'overlay', type: 'ack' },
          ORIGIN
        );

        // Pass message to overlay handler if it’s a real command
        if (data.type && window.WHEEL_OVERLAY_API && window.WHEEL_OVERLAY_API.onControlMessage) {
          window.WHEEL_OVERLAY_API.onControlMessage(data);
        }
      }
    });
  }

  function initControl() {
    // Popup tries to talk to its opener (overlay)
    overlayWindow = window.opener || null;

    if (!overlayWindow && window.WHEEL_CONTROL_API && window.WHEEL_CONTROL_API.setStatus) {
      window.WHEEL_CONTROL_API.setStatus('No opener window found. Open this from the overlay.');
    }

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || !data.__wheelMessage) return;

      if (data.role === 'overlay' && data.type === 'ack') {
        if (window.WHEEL_CONTROL_API && window.WHEEL_CONTROL_API.onOverlayAck) {
          window.WHEEL_CONTROL_API.onOverlayAck();
        }
      }
    });

    // Send an initial hello if we have an opener
    if (overlayWindow) {
      overlayWindow.postMessage(
        { __wheelMessage: true, role: 'control', type: 'hello' },
        ORIGIN
      );
    }
  }

  function sendToOverlay(payload) {
    if (!overlayWindow) {
      overlayWindow = window.opener || null;
    }
    if (!overlayWindow) {
      if (window.WHEEL_CONTROL_API && window.WHEEL_CONTROL_API.setStatus) {
        window.WHEEL_CONTROL_API.setStatus('Cannot find overlay window.');
      }
      return;
    }

    overlayWindow.postMessage(
      Object.assign({}, payload, { __wheelMessage: true, role: 'control' }),
      ORIGIN
    );
  }

  return {
    initOverlay,
    initControl,
    sendToOverlay
  };
})();
