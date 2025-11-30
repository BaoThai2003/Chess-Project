// Early error catcher - loaded before other scripts to capture startup/runtime errors
(function () {
  try {
    console.log("[early_error_catcher] installed");
    window._lastCapturedError = null;

    window.onerror = function (msg, src, line, col, err) {
      const info = {
        type: "error",
        message: String(msg),
        source: src,
        line: line,
        column: col,
        stack: err && err.stack,
        ts: new Date().toISOString(),
      };
      try {
        localStorage.setItem("last_js_error", JSON.stringify(info));
      } catch (e) {}
      window._lastCapturedError = info;
      console.error("[early_error_catcher] captured error", info);
      // show a visible notice for quick debugging
      try {
        if (!document.getElementById("__error_catcher_notice")) {
          const n = document.createElement("div");
          n.id = "__error_catcher_notice";
          n.style.position = "fixed";
          n.style.right = "8px";
          n.style.bottom = "8px";
          n.style.zIndex = 99999;
          n.style.background = "rgba(200,30,30,0.9)";
          n.style.color = "#fff";
          n.style.padding = "8px 12px";
          n.style.borderRadius = "6px";
          n.style.fontSize = "13px";
          n.textContent = "JS error captured — open devtools or check localStorage last_js_error";
          document.body && document.body.appendChild(n);
        }
      } catch (e) {}
      return false;
    };

    window.addEventListener("unhandledrejection", function (ev) {
      const reason = ev && ev.reason ? ev.reason : String(ev);
      const info = {
        type: "unhandledrejection",
        message: String(reason && reason.message ? reason.message : reason),
        stack: (reason && reason.stack) || null,
        ts: new Date().toISOString(),
      };
      try {
        localStorage.setItem("last_js_error", JSON.stringify(info));
      } catch (e) {}
      console.error("[early_error_catcher] unhandledrejection", info);
    });

    // Small health-check so user knows the script loaded
    window.addEventListener("DOMContentLoaded", function () {
      console.log("[early_error_catcher] DOMContentLoaded event - catcher active");
    });
  } catch (e) {
    try {
      localStorage.setItem("last_js_error", JSON.stringify({ type: "early_catcher_init", message: e && e.message }));
    } catch (er) {}
  }
})();
