export interface AnalyticsEvent {
    id: string;
    timestamp: number;
    eventName: string;
    properties: Record<string, any>;
    sessionId: string;
    url: string;
    device: 'mobile' | 'desktop';
}

const STORAGE_KEY = 'eventpix_analytics_db';

// Simple session generation
const getSessionId = () => {
    let sessionId = localStorage.getItem('ep_session_id');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('ep_session_id', sessionId);
    }
    return sessionId;
};

// Check if mobile
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        ? 'mobile' 
        : 'desktop';
};

/**
 * Registra un evento en la base de datos de analíticas local
 */
export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    try {
        const events = getAnalyticsEvents();
        
        const newEvent: AnalyticsEvent = {
            id: Math.random().toString(36).substring(2, 15),
            timestamp: Date.now(),
            eventName,
            properties,
            sessionId: getSessionId(),
            url: window.location.pathname,
            device: isMobile(),
        };

        events.push(newEvent);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

        // For debugging (can be removed later)
        console.log(`[Analytics] Tracked: ${eventName}`, properties);
    } catch (e) {
        console.error('Failed to track event', e);
    }
};

/**
 * Obtiene todos los eventos para el Dashboard Admin
 */
export const getAnalyticsEvents = (): AnalyticsEvent[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to parse analytics', e);
        return [];
    }
};

/**
 * Limpia la base de datos local
 */
export const clearAnalytics = () => {
    localStorage.removeItem(STORAGE_KEY);
};
