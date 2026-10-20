'use client';
import { useEffect, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function BackToTopButton() {
    const [show, setShow] = useState(false);
    const scrollTargetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const onScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target && target.scrollTop > 0) {
                scrollTargetRef.current = target;
                setShow(true);
            } else if (scrollTargetRef.current && scrollTargetRef.current.scrollTop === 0) {
                setShow(false);
            }
        };
        document.addEventListener('scroll', onScroll, { capture: true });
        return () => document.removeEventListener('scroll', onScroll, { capture: true });
    }, []);

    if (!show) return null;

    return (
        <IconButton
            onClick={() => {
                if (scrollTargetRef.current) {
                    scrollTargetRef.current.scrollTop = 0;
                    setShow(false);
                }
            }}
            size='small'
            sx={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
                backgroundColor: 'rgba(0,171,190,0.12)',
                color: '#00ABBE',
                border: '1px solid rgba(0,171,190,0.25)',
                backdropFilter: 'blur(8px)',
                '&:hover': { backgroundColor: 'rgba(0,171,190,0.22)' },
            }}
        >
            <KeyboardArrowUpIcon />
        </IconButton>
    );
}
