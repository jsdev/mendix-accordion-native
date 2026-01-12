/**
 * Debug logger utility for FAQ Accordion widget
 * Only logs when debug mode is enabled
 */

let debugEnabled = false;

/**
 * Set the debug mode state
 */
export function setDebugMode(enabled: boolean): void {
    debugEnabled = enabled;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
    return debugEnabled;
}

/**
 * Log a debug message (only if debug mode is enabled)
 */
export function debugLog(...args: any[]): void {
    if (debugEnabled) {
        console.log("[FAQ Accordion]", ...args);
    }
}

/**
 * Log a debug warning (only if debug mode is enabled)
 */
export function debugWarn(...args: any[]): void {
    if (debugEnabled) {
        console.warn("[FAQ Accordion]", ...args);
    }
}

/**
 * Log an error (always logs, even when debug mode is off)
 */
export function debugError(...args: any[]): void {
    console.error("[FAQ Accordion]", ...args);
}
