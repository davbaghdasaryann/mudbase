'use client';

import React from 'react';

export interface MobileDrawerContextValue {
    open: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

const MobileDrawerContext = React.createContext<MobileDrawerContextValue | null>(null);

export function useMobileDrawer(): MobileDrawerContextValue {
    const ctx = React.useContext(MobileDrawerContext);
    if (!ctx) {
        return {
            open: false,
            openDrawer: () => {},
            closeDrawer: () => {},
        };
    }
    return ctx;
}

export function MobileDrawerProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    const value: MobileDrawerContextValue = React.useMemo(
        () => ({
            open,
            openDrawer: () => setOpen(true),
            closeDrawer: () => setOpen(false),
        }),
        [open]
    );
    return (
        <MobileDrawerContext.Provider value={value}>
            {children}
        </MobileDrawerContext.Provider>
    );
}
