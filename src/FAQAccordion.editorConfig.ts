import { hidePropertiesIn, Problem, Properties } from "@mendix/pluggable-widgets-tools";
import { FAQAccordionPreviewProps } from "../typings/FAQAccordionProps";

export function getProperties(
    values: FAQAccordionPreviewProps,
    defaultProperties: Properties,
    _target: unknown
): Properties {
    // Hide toggle button text if toggle button is not shown
    if (!values.showToggleButton) {
        hidePropertiesIn(defaultProperties, values, ["toggleButtonText"]);
    }

    return defaultProperties;
}

/**
 * Validate widget configuration - returns problems shown in Studio Pro
 */
export function check(values: FAQAccordionPreviewProps): Problem[] {
    const errors: Problem[] = [];

    // Check for partial attribute overrides (all-or-nothing requirement)
    const overrides = [
        values.summaryAttribute,
        values.contentAttribute,
        values.contentFormatAttribute,
        values.sortOrderAttributeOverride
    ];

    const configuredCount = overrides.filter((o) => o && o !== "").length;

    if (configuredCount > 0 && configuredCount < 4) {
        errors.push({
            property: "summaryAttribute",
            severity: "error",
            message: `Attribute Overrides require ALL or NONE to be configured. You have configured ${configuredCount} of 4. Either configure all four attribute overrides, or leave them all empty to use defaults (Summary, Content, ContentFormat, SortOrder).`
        });
    }

    return errors;
}

export function getPreview() {
    return {
        type: "Container",
        borders: true,
        children: [
            {
                type: "Container",
                children: [
                    {
                        type: "Text",
                        content: "FAQ Accordion Widget",
                        fontColor: "#555555"
                    }
                ]
            }
        ]
    };
}

export function getCustomCaption(values: FAQAccordionPreviewProps): string {
    const itemCount = values.faqItems ? values.faqItems.length : 0;
    return `FAQ Accordion (${itemCount} item${itemCount !== 1 ? "s" : ""})`;
}
