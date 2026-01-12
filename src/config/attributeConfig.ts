/**
 * FAQ Accordion Attribute Configuration
 *
 * This file defines the convention-based attribute names that the widget expects
 * on the Mendix entity. These defaults can be overridden via widget properties.
 *
 * IMPORTANT: These attribute names must match exactly with your Mendix domain model.
 * The names are case-sensitive and should not include the entity name prefix.
 */

/**
 * Default attribute names used when no overrides are configured
 */
export const FAQ_DEFAULT_ATTRIBUTES = {
    /**
     * The question/title text (String/Text attribute)
     */
    SUMMARY: "Summary",

    /**
     * The answer/detailed content (String/Text attribute)
     */
    CONTENT: "Content",

    /**
     * The format of the content - 'html', 'text', or 'markdown' (String/Enum attribute)
     */
    CONTENT_FORMAT: "ContentFormat",

    /**
     * The sort order for positioning items (Integer/Long/Decimal attribute)
     */
    SORT_ORDER: "SortOrder"
} as const;

/**
 * Interface for attribute overrides from widget configuration
 */
export interface FAQAttributeOverrides {
    summaryAttribute?: string;
    contentAttribute?: string;
    contentFormatAttribute?: string;
    sortOrderAttribute?: string;
}

/**
 * Interface for the resolved FAQ attributes
 */
export interface FAQAttributeNames {
    SUMMARY: string;
    CONTENT: string;
    CONTENT_FORMAT: string;
    SORT_ORDER: string;
}

/**
 * Extracts the attribute name from a ListAttributeValue's id
 * The id is typically in format "ModuleName.EntityName/attributeName"
 * @param attributeId - The full attribute id from ListAttributeValue
 * @returns The attribute name only
 */
export function extractAttributeName(attributeId: string | undefined): string | undefined {
    if (!attributeId) {
        return undefined;
    }
    // Extract the attribute name after the last "/"
    const parts = attributeId.split("/");
    return parts.length > 1 ? parts[parts.length - 1] : attributeId;
}

/**
 * Creates the resolved FAQ attributes by merging overrides with defaults
 * @param overrides - Optional attribute overrides from widget configuration
 * @returns Resolved attribute names
 */
export function getFAQAttributes(overrides?: FAQAttributeOverrides): FAQAttributeNames {
    return {
        SUMMARY: overrides?.summaryAttribute
            ? extractAttributeName(overrides.summaryAttribute) || FAQ_DEFAULT_ATTRIBUTES.SUMMARY
            : FAQ_DEFAULT_ATTRIBUTES.SUMMARY,
        CONTENT: overrides?.contentAttribute
            ? extractAttributeName(overrides.contentAttribute) || FAQ_DEFAULT_ATTRIBUTES.CONTENT
            : FAQ_DEFAULT_ATTRIBUTES.CONTENT,
        CONTENT_FORMAT: overrides?.contentFormatAttribute
            ? extractAttributeName(overrides.contentFormatAttribute) ||
              FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT
            : FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT,
        SORT_ORDER: overrides?.sortOrderAttribute
            ? extractAttributeName(overrides.sortOrderAttribute) ||
              FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER
            : FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER
    };
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getFAQAttributes() with overrides instead
 */
export const FAQ_ATTRIBUTES = FAQ_DEFAULT_ATTRIBUTES;

/**
 * Type-safe accessor for attribute names
 */
export type FAQAttributeName = (typeof FAQ_DEFAULT_ATTRIBUTES)[keyof typeof FAQ_DEFAULT_ATTRIBUTES];

/**
 * Validates that all required attributes exist on an MxObject
 * @param mxObj - The Mendix object to validate
 * @param attributes - The resolved attribute names to validate
 * @returns Object with validation result and missing attributes
 */
export function validateRequiredAttributes(
    mxObj: any,
    attributes: FAQAttributeNames = FAQ_DEFAULT_ATTRIBUTES
): {
    isValid: boolean;
    missingAttributes: string[];
} {
    const availableAttributes = mxObj.getAttributes();
    const requiredAttributes = Object.values(attributes);

    const missingAttributes = requiredAttributes.filter(
        (attr) => !availableAttributes.includes(attr)
    );

    return {
        isValid: missingAttributes.length === 0,
        missingAttributes
    };
}
