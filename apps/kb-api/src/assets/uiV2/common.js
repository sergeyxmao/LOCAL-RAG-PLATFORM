
    (function () {
      function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem("localrag.theme", theme); } catch (err) {}
      }
      window.LocalRagTheme = {
        get current() {
          return document.documentElement.getAttribute("data-theme") || "dark";
        },
        toggle() {
          var next = this.current === "dark" ? "light" : "dark";
          applyTheme(next);
          return next;
        },
        set(theme) { applyTheme(theme); },
      };
      document.addEventListener("click", function (event) {
        var trigger = event.target.closest && event.target.closest("[data-action='toggle-theme']");
        if (!trigger) return;
        window.LocalRagTheme.toggle();
      });

      // Context sidebar: resize + collapse
      var MIN_WIDTH = 180;
      var MAX_WIDTH = 480;
      var DEFAULT_WIDTH = 240;
      var STORAGE_WIDTH = "localrag.sidebar.width";
      var STORAGE_COLLAPSED = "localrag.sidebar.collapsed";
      var shell = document.querySelector(".app-shell");
      var resizer = document.getElementById("contextSidebarResizer");
      var toggleBtn = document.getElementById("contextSidebarToggle");

      function readStoredWidth() {
        try {
          var raw = localStorage.getItem(STORAGE_WIDTH);
          if (!raw) return DEFAULT_WIDTH;
          var n = Number(raw);
          if (!Number.isFinite(n)) return DEFAULT_WIDTH;
          return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(n)));
        } catch (err) { return DEFAULT_WIDTH; }
      }
      function writeStoredWidth(width) {
        try { localStorage.setItem(STORAGE_WIDTH, String(width)); } catch (err) {}
      }
      function readStoredCollapsed() {
        try { return localStorage.getItem(STORAGE_COLLAPSED) === "true"; } catch (err) { return false; }
      }
      function writeStoredCollapsed(value) {
        try { localStorage.setItem(STORAGE_COLLAPSED, value ? "true" : "false"); } catch (err) {}
      }
      function applyWidth(width) {
        document.documentElement.style.setProperty("--context-sidebar-width", width + "px");
      }
      function applyCollapsed(collapsed) {
        if (!shell) return;
        shell.classList.toggle("is-context-collapsed", collapsed === true);
      }

      applyWidth(readStoredWidth());
      applyCollapsed(readStoredCollapsed());

      if (resizer && shell) {
        var dragStartX = 0;
        var dragStartWidth = 0;
        function onMouseMove(event) {
          var delta = event.clientX - dragStartX;
          var next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth + delta));
          applyWidth(next);
        }
        function onMouseUp() {
          if (!shell.classList.contains("is-resizing")) return;
          shell.classList.remove("is-resizing");
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          var current = getComputedStyle(document.documentElement).getPropertyValue("--context-sidebar-width");
          var px = parseInt(current, 10);
          if (Number.isFinite(px)) writeStoredWidth(px);
        }
        resizer.addEventListener("mousedown", function (event) {
          if (shell.classList.contains("is-context-collapsed")) return;
          event.preventDefault();
          dragStartX = event.clientX;
          var current = getComputedStyle(document.documentElement).getPropertyValue("--context-sidebar-width");
          var px = parseInt(current, 10);
          dragStartWidth = Number.isFinite(px) ? px : DEFAULT_WIDTH;
          shell.classList.add("is-resizing");
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });
      }

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          var nowCollapsed = !shell.classList.contains("is-context-collapsed");
          applyCollapsed(nowCollapsed);
          writeStoredCollapsed(nowCollapsed);
        });
      }
    })();
  