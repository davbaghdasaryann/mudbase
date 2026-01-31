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
    
    // Use useCallback to create stable function references
    const openDrawer = React.useCallback(() => {
        setOpen(true);
    }, []);
    
    const closeDrawer = React.useCallback(() => {
        setOpen(false);
    }, []);
    
    const value: MobileDrawerContextValue = React.useMemo(
        () => ({
            open,
            openDrawer,
            closeDrawer,
        }),
        [open, openDrawer, closeDrawer]
    );
    
    return (
        <MobileDrawerContext.Provider value={value}>
            {children}
        </MobileDrawerContext.Provider>
    );
}
