/**
 * CodeNest Studio — useOnlineStatus Hook
 *
 * Reactive hook that tracks browser/Electron connectivity state.
 * Returns `true` when online, `false` when offline.
 */

import { useState, useEffect } from 'react';
import { isOnline, onConnectivityChange } from '@/utils/offlineUtils';

export function useOnlineStatus(): boolean {
    const [online, setOnline] = useState(isOnline);

    useEffect(() => {
        return onConnectivityChange(setOnline);
    }, []);

    return online;
}
