document.addEventListener("DOMContentLoaded", async () => {
    const target = document.querySelector("#sidebar");
    if (!target) return;

    const inProjectPage = location.pathname.includes("/pages/projects/");

    // ✅ sidebar.html 경로를 현재 위치 기준 상대경로로
    const sidebarPath = inProjectPage
        ? "../partials/sidebar.html"     // pages/projects/* → pages/partials/sidebar.html
        : "pages/partials/sidebar.html"; // index → pages/partials/sidebar.html

    try {
        const res = await fetch(sidebarPath);
        const html = await res.text();
        target.innerHTML = html;
        target.classList.add("sidebar");

        // ✅ 링크도 "상대경로"로 통일 (GitHub Pages/로컬 모두 안전)
        const root = inProjectPage ? "../../" : "";
        const homeHref = root + "index.html";
        const projectBase = root + "pages/projects/";

        // 홈 링크
        const titleLink = target.querySelector(".sidebar-title");
        if (titleLink) {
            titleLink.href = homeHref;
            titleLink.removeAttribute("data-page");
        }

        // 프로젝트 링크들
        target.querySelectorAll("a.sidebar-project").forEach((a) => {
            // sidebar.html에 data-file 있으면 그걸 사용 (권장)
            let file = a.getAttribute("data-file");

            // 없으면 기존 href/data-page에서 파일명만 추출
            if (!file) {
                const src = a.getAttribute("data-page") || a.getAttribute("href") || "";
                file = src.split("/").pop();
            }
            if (!file) return;

            a.href = projectBase + file;

            // ⭐ SPA 가로채기 방지: data-page 제거
            a.removeAttribute("data-page");
        });
    } catch (e) {
        console.error("Sidebar load failed", e);
    }
});

/* ==============================
   Mobile Sidebar Toggle (fixed)
   - 버튼/오버레이 보장
   - include(늦게 주입) 대응
   - body.menu-open으로 버튼 위치도 제어
============================== */
(() => {
    const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
    const getHost = () => document.getElementById("sidebar");
    const getSidebar = () =>
        document.querySelector("#sidebar .sidebar") ||
        document.querySelector(".sidebar");

    const ensureOverlay = () => {
        let ov = document.querySelector(".sidebar-overlay");
        if (!ov) {
            ov = document.createElement("div");
            ov.className = "sidebar-overlay";
            document.body.appendChild(ov);
        }
        return ov;
    };

    const ensureButton = () => {
        let btn =
            document.querySelector(".mobile-sidebar-toggle") ||
            document.querySelector(".mobile-header .menu-toggle") ||
            document.querySelector("[data-role='menu-toggle']");

        if (!btn) {
            btn = document.createElement("button");
            btn.type = "button";
            document.body.appendChild(btn);
        }

        btn.classList.add("mobile-sidebar-toggle");
        btn.textContent = "☰";
        btn.title = "메뉴";
        btn.setAttribute("aria-label", "메뉴 열기");

        // 중복 버튼 제거(같은 클래스가 여러 개면 1개만 유지)
        const all = [...document.querySelectorAll(".mobile-sidebar-toggle")];
        all.forEach((b, i) => { if (i > 0) b.remove(); });

        return btn;
    };

    const setOpen = (open) => {
        const host = getHost();
        const sb = getSidebar();
        const ov = ensureOverlay();

        // ✅ “열림 상태”는 body에 저장(버튼 위치 제어 포함)
        document.body.classList.toggle("menu-open", open);
        document.body.classList.toggle("no-scroll", open);

        // ✅ 오버레이
        ov.classList.toggle("active", open);

        // ✅ 사이드바: 실제 .sidebar가 있으면 거기에, 없으면 host에만 표시(나중에 동기화)
        if (host) host.classList.toggle("active", open);
        if (sb) sb.classList.toggle("active", open);
    };

    const toggle = () => {
        const sb = getSidebar();
        const open = sb ? !sb.classList.contains("active") : !document.body.classList.contains("menu-open");
        setOpen(open);
    };

    const syncToInjectedSidebar = () => {
        // sidebar.html이 나중에 들어오면, 현재 open 상태를 .sidebar에도 반영
        const sb = getSidebar();
        if (!sb) return;
        const open = document.body.classList.contains("menu-open");
        sb.classList.toggle("active", open);
    };

    const init = () => {
        ensureButton();
        ensureOverlay();
        syncToInjectedSidebar();
    };

    // 클릭 핸들링(이벤트 위임)
    document.addEventListener("click", (e) => {
        if (!isMobile()) return;

        const toggleBtn = e.target.closest(".mobile-sidebar-toggle");
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            toggle();
            return;
        }

        // 오버레이 클릭 닫기
        if (e.target.closest(".sidebar-overlay")) {
            setOpen(false);
            return;
        }

        // 사이드바 링크 클릭 시: 닫고 "이동은 그대로 진행"
        if (e.target.closest("#sidebar a, .sidebar a")) {
            setTimeout(() => setOpen(false), 0);
        }
    }, true);

    // 사이드바가 fetch로 주입되는 타이밍 대응
    const obs = new MutationObserver(() => init());
    obs.observe(document.body, { childList: true, subtree: true });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();

// 다크모드
(() => {
    const KEY = "theme";

    const apply = (mode) => {
        const isDark = mode === "dark";
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem(KEY, isDark ? "dark" : "light");
        updateLabel();
    };

    const updateLabel = () => {
        const btn = document.querySelector(".theme-toggle");
        if (!btn) return;

        const isDark = document.documentElement.classList.contains("dark");
        btn.textContent = isDark ? "라이트 ◐" : "다크 ◑";
        btn.title = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";
        btn.setAttribute("aria-label", btn.title);
    };

    // 초기 적용
    const saved = localStorage.getItem(KEY);
    apply(saved === "dark" ? "dark" : "light");

    // ✅ 이벤트 위임(버튼이 나중에 생겨도 OK) + null 안전
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".theme-toggle");
        if (!btn) return;

        const isDark = document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", !isDark);
        localStorage.setItem("theme", !isDark ? "dark" : "light");
    });

    // ✅ 사이드바 주입 뒤 라벨 갱신
    const obs = new MutationObserver(() => updateLabel());
    obs.observe(document.body, { childList: true, subtree: true });

    updateLabel();
})();
