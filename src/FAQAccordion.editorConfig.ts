import { hidePropertiesIn, Properties } from "@mendix/pluggable-widgets-tools";

export function getProperties(values, defaultProperties, target) {
    // Hide toggle button text if toggle button is not shown
    if (!values.showToggleButton) {
        hidePropertiesIn(defaultProperties, values, ["toggleButtonText"]);
    }

    return defaultProperties;
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

export function getCustomCaption(values) {
    const itemCount = values.faqItems ? values.faqItems.length : 0;
    return `FAQ Accordion (${itemCount} item${itemCount !== 1 ? 's' : ''})`;
}
