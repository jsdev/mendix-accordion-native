/**
 * Utility functions for editing mode and role-based access control
 */

/**
 * Checks if the current user has the required role for editing
 * @param requiredRole - The role name required (empty string = all authenticated users)
 * @returns Promise<boolean> - True if user has access
 */
export async function checkUserRole(requiredRole: string): Promise<boolean> {
    // If no role specified, allow all authenticated users
    if (!requiredRole || requiredRole.trim() === "") {
        return true;
    }

    try {
        // Use Mendix Client API to check user roles
        // Note: In actual Mendix runtime, you'd use mx.session or similar
        // This is a placeholder - Mendix widgets typically use server-side validation
        // For now, we'll return true and rely on microflow validation
        console.log(`Checking role: ${requiredRole}`);
        return true;
    } catch (error) {
        console.error("Error checking user role:", error);
        return false;
    }
}

/**
 * Validates if editing is allowed based on configuration
 * @param allowEditing - Whether editing is enabled
 * @param dataSourceType - Type of data source
 * @param hasRole - Whether user has required role
 * @returns boolean - True if editing should be allowed
 */
export function canEdit(allowEditing: boolean, dataSourceType: string, hasRole: boolean): boolean {
    // Editing only works with database mode
    if (dataSourceType !== "database") {
        return false;
    }

    // Editing must be enabled
    if (!allowEditing) {
        return false;
    }

    // User must have required role
    return hasRole;
}

/**
 * Generates a temporary ID for new FAQ items before they're saved
 * @returns string - Temporary ID
 */
export function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
