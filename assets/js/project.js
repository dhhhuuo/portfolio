// /assets/js/project.js
(() => {
    // 프로젝트 페이지에 proj-wrapper가 여러 개여도 대응
    document.querySelectorAll(".proj-page").forEach((root) => {
        const backdrop = root.querySelector(".modal-backdrop");
        const modalContent = root.querySelector(".modal-content");
        const btnClose = root.querySelector(".modal-close");
        const modalImg = modalContent?.querySelector("img");
        const modalCaption = root.querySelector(".modal-caption");

        if (!backdrop || !modalContent || !btnClose || !modalImg || !modalCaption) return;

        // 확대/이동 상태
        let zoom = 1;
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        let dragMoved = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let startOffsetX = 0;
        let startOffsetY = 0;

        const MIN_ZOOM = 1;
        const MAX_ZOOM = 3;
        const ZOOM_STEP = 0.15;
        const DRAG_THRESHOLD = 5;

        function applyTransform() {
            modalImg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
        }

        function resetTransform() {
            zoom = 1;
            offsetX = 0;
            offsetY = 0;
            modalImg.style.cursor = "zoom-in";
            applyTransform();
        }

        function adjustModalSize() {
            const naturalWidth = modalImg.naturalWidth;
            if (!naturalWidth) return;
            const maxWidth = Math.min(naturalWidth, window.innerWidth * 0.9);
            modalContent.style.maxWidth = maxWidth + "px";
        }

        function openModal(src, caption) {
            modalImg.src = src;
            modalCaption.textContent = caption || "";
            backdrop.style.display = "flex";

            resetTransform();
            modalContent.style.maxWidth = "";
            dragMoved = false;

            if (modalImg.complete) adjustModalSize();
            else modalImg.onload = adjustModalSize;
        }

        function closeModal() {
            backdrop.style.display = "none";
            resetTransform();
            modalContent.style.maxWidth = "";
            dragMoved = false;
        }

        // 썸네일 → 모달
        root.querySelectorAll("img[data-caption]").forEach((img) => {
            img.addEventListener("click", () => {
                openModal(img.src, img.dataset.caption);
            });
        });

        // 닫기
        btnClose.addEventListener("click", closeModal);

        // 배경 클릭 닫기
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeModal();
        });

        // ESC 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && backdrop.style.display === "flex") closeModal();
        });

        // 이미지 클릭 → 드래그 아니면 리셋
        modalImg.addEventListener("click", (e) => {
            if (dragMoved) {
                dragMoved = false;
                return;
            }
            resetTransform();
            e.stopPropagation();
        });

        // 휠 줌
        backdrop.addEventListener(
            "wheel",
            (e) => {
                if (backdrop.style.display !== "flex") return;
                e.preventDefault();

                const prevZoom = zoom;

                if (e.deltaY < 0) zoom *= 1 + ZOOM_STEP;
                else zoom /= 1 + ZOOM_STEP;

                if (zoom < MIN_ZOOM) zoom = MIN_ZOOM;
                if (zoom > MAX_ZOOM) zoom = MAX_ZOOM;

                if (zoom === 1) {
                    offsetX = 0;
                    offsetY = 0;
                    modalImg.style.cursor = "zoom-in";
                } else {
                    modalImg.style.cursor = isDragging ? "grabbing" : "grab";
                }

                if (prevZoom !== zoom) applyTransform();
            },
            { passive: false }
        );

        // 드래그 시작
        modalImg.addEventListener("mousedown", (e) => {
            if (zoom === 1) return;
            isDragging = true;
            dragMoved = false;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            startOffsetX = offsetX;
            startOffsetY = offsetY;
            modalImg.style.cursor = "grabbing";
            e.preventDefault();
        });

        // 드래그 중
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            if (!dragMoved && Math.hypot(dx, dy) > DRAG_THRESHOLD) dragMoved = true;

            offsetX = startOffsetX + dx;
            offsetY = startOffsetY + dy;
            applyTransform();
        });

        // 드래그 종료
        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;
            modalImg.style.cursor = zoom > 1 ? "grab" : "zoom-in";
        });

        // 리사이즈 시 모달 폭 재계산
        window.addEventListener("resize", () => {
            if (backdrop.style.display === "flex") adjustModalSize();
        });
    });
})();
