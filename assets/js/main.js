document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const menuBtn = document.querySelector(".menu-btn");

  // 현재 페이지 active 표시
  const sidebarLinks = document.querySelectorAll(".sidebar-menu a");

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (location.pathname.endsWith(href)) {
      link.classList.add("active");
    }
  });
});

/* ------------------------------
   테마 토글 (라이트 / 다크)
------------------------------ */
(() => {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  const STORAGE_KEY = "theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "dark") {
      root.classList.add("dark");
      btn.textContent = "☼";
      btn.setAttribute("aria-label", "라이트 모드로 전환");
    } else {
      root.classList.remove("dark");
      btn.textContent = "◑";
      btn.setAttribute("aria-label", "다크 모드로 전환");
    }
  }

  // 저장된 테마 우선
  let saved = localStorage.getItem(STORAGE_KEY);

  // 없으면 시스템 설정
  if (!saved) {
    const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    saved = prefersDark ? "dark" : "light";
  }

  applyTheme(saved);

  btn.addEventListener("click", () => {
    const isDark = root.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });
})();
