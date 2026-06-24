import { useRef, useCallback } from 'react';

export function useGrabScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        isDragging.current = true;
        startX.current = e.pageX - el.offsetLeft;
        scrollLeft.current = el.scrollLeft;
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current;
        if (!isDragging.current || !el) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        el.scrollLeft = scrollLeft.current - (x - startX.current);
    }, []);

    const stopDrag = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        isDragging.current = false;
        el.style.cursor = 'grab';
        el.style.userSelect = '';
    }, []);

    return { ref, onMouseDown, onMouseMove, onMouseUp: stopDrag, onMouseLeave: stopDrag };
}
