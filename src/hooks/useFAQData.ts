import { useState, useEffect, useMemo } from "react";
import { ObjectItem, ListValue, ListAttributeValue } from "mendix";
import Big from "big.js";
import { ContentFormatEnum } from "../../typings/FAQAccordionProps";
import { FAQ_DEFAULT_ATTRIBUTES } from "../config/attributeConfig";
import { getNextSortOrder } from "../utils/mendixDataService";
import { debugLog } from "../utils/debugLogger";

export interface FAQItem {
    summary: string;
    content: string;
    contentFormat: ContentFormatEnum;
    sortOrder?: number;
}

interface StaticFAQItem {
    summary?: { value?: string };
    content?: { value?: string };
    contentFormat?: string;
}

/**
 * Attribute overrides using ListAttributeValue for direct access
 */
interface AttributeOverrides {
    summaryAttribute?: ListAttributeValue<string>;
    contentAttribute?: ListAttributeValue<string>;
    contentFormatAttribute?: ListAttributeValue<string>;
    sortOrderAttributeOverride?: ListAttributeValue<Big>;
}

interface UseFAQDataProps {
    dataSourceType: "static" | "database";
    dataSource?: ListValue;
    faqItems?: StaticFAQItem[];
    sortOrderAttribute?: ListAttributeValue<Big>;
    attributeOverrides?: AttributeOverrides;
}

interface UseFAQDataResult {
    items: FAQItem[];
    isLoading: boolean;
    defaultSortOrder: number;
    sortableIds: string[];
}

/**
 * Normalizes content format value to valid format or defaults to HTML
 */
function normalizeContentFormat(format: string | undefined | null): ContentFormatEnum {
    if (!format) {
        return "html";
    }

    const normalized = format.toLowerCase().trim();

    if (normalized === "html" || normalized === "markdown" || normalized === "text") {
        return normalized as ContentFormatEnum;
    }

    console.warn(`FAQ Accordion: Unrecognized content format "${format}", defaulting to HTML`);
    return "html";
}

/**
 * Custom hook to manage FAQ data fetching and state
 */
export function useFAQData({
    dataSourceType,
    dataSource,
    faqItems,
    sortOrderAttribute,
    attributeOverrides
}: UseFAQDataProps): UseFAQDataResult {
    const [databaseItems, setDatabaseItems] = useState<FAQItem[]>([]);

    // Check if ALL attribute overrides are configured (all-or-nothing approach)
    const hasAllOverrides = !!(
        attributeOverrides?.summaryAttribute &&
        attributeOverrides?.contentAttribute &&
        attributeOverrides?.contentFormatAttribute &&
        attributeOverrides?.sortOrderAttributeOverride
    );

    // Check if ANY overrides are configured (for warning detection)
    const hasAnyOverrides = !!(
        attributeOverrides?.summaryAttribute ||
        attributeOverrides?.contentAttribute ||
        attributeOverrides?.contentFormatAttribute ||
        attributeOverrides?.sortOrderAttributeOverride
    );

    // Fetch FAQ items from database
    useEffect(() => {
        if (dataSourceType === "database" && dataSource && dataSource.status === "available") {
            debugLog("✨ REFETCHING items from datasource");
            debugLog("Item count:", dataSource.items?.length);
            debugLog("All overrides configured:", hasAllOverrides);

            if (!dataSource.items || dataSource.items.length === 0) {
                debugLog("No items to fetch");
                setDatabaseItems([]);
                return;
            }

            // If ALL overrides are configured, use ListAttributeValue.get() directly
            if (hasAllOverrides) {
                debugLog("Using attribute overrides via ListAttributeValue.get()");
                const items = dataSource.items.map((item: ObjectItem) => {
                    const summary = attributeOverrides.summaryAttribute!.get(item)?.value || "Question";
                    const content = attributeOverrides.contentAttribute!.get(item)?.value || "";
                    const formatValue = attributeOverrides.contentFormatAttribute!.get(item)?.value;
                    const format = normalizeContentFormat(formatValue);
                    
                    const rawSortOrder = attributeOverrides.sortOrderAttributeOverride!.get(item)?.value;
                    let sortOrder: number | undefined;
                    if (rawSortOrder) {
                        sortOrder = Number(rawSortOrder.toString());
                        if (isNaN(sortOrder)) sortOrder = undefined;
                    }

                    return { summary, content, contentFormat: format, sortOrder };
                });
                debugLog("Items loaded via overrides:", items.length);
                setDatabaseItems(items);
                return;
            }

            // Warn if partial overrides configured
            if (hasAnyOverrides && !hasAllOverrides) {
                console.warn("[FAQ Accordion] Partial overrides detected! You must configure ALL four attribute overrides or NONE. Falling back to defaults.");
            }

            // Use mx.data.get with convention-based attribute names (defaults)
            const fetchItems = async () => {
                const mx = (window as any).mx;
                if (!mx) {
                    debugLog("mx not available");
                    setDatabaseItems([]);
                    return;
                }

                try {
                    debugLog("Using default attribute names via mx.data.get()");
                    const items = await Promise.all(
                        dataSource.items!.map(async (item: ObjectItem) => {
                            return new Promise<FAQItem>((resolve) => {
                                mx.data.get({
                                    guid: item.id,
                                    callback: (mxObj: any) => {
                                        const summary = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.SUMMARY) || "Question";
                                        const content = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.CONTENT) || "";
                                        const formatValue = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT);
                                        const format = normalizeContentFormat(formatValue);

                                        const rawSortOrder = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER);
                                        let sortOrder: number | undefined;
                                        if (rawSortOrder !== undefined && rawSortOrder !== null) {
                                            try {
                                                sortOrder = Number(rawSortOrder.toString());
                                                if (isNaN(sortOrder)) sortOrder = undefined;
                                            } catch {
                                                sortOrder = undefined;
                                            }
                                        }

                                        resolve({ summary, content, contentFormat: format, sortOrder });
                                    },
                                    error: (error: Error) => {
                                        console.error("[FAQ Accordion] Failed to fetch item:", error);
                                        resolve({
                                            summary: "Error loading question",
                                            content: "",
                                            contentFormat: "text",
                                            sortOrder: undefined
                                        });
                                    }
                                });
                            });
                        })
                    );
                    debugLog("Items loaded via mx.data.get:", items.length);
                    setDatabaseItems(items);
                } catch (error) {
                    console.error("[FAQ Accordion] Failed to fetch FAQ items:", error);
                    setDatabaseItems([]);
                }
            };

            fetchItems();
        }
    }, [dataSourceType, dataSource, dataSource?.status, dataSource?.items, hasAllOverrides, hasAnyOverrides, attributeOverrides, sortOrderAttribute]);

    // Get FAQ items from either static configuration or database
    const items = useMemo<FAQItem[]>(() => {
        if (dataSourceType === "database") {
            return databaseItems;
        } else {
            return (
                faqItems?.map((item, index) => ({
                    summary: item.summary?.value || "Question",
                    content: item.content?.value || "",
                    contentFormat: normalizeContentFormat(item.contentFormat),
                    sortOrder: (index + 1) * 10
                })) || []
            );
        }
    }, [dataSourceType, databaseItems, faqItems]);

    // Calculate default sort order for new items
    const defaultSortOrder = useMemo(() => {
        if (dataSourceType === "database") {
            if (sortOrderAttribute && dataSource?.items && dataSource.items.length > 0) {
                const next = getNextSortOrder(dataSource.items, sortOrderAttribute);
                return Number(next.toString());
            }

            const currentCount = dataSource?.items?.length || 0;
            return (currentCount + 1) * 10;
        }

        return (items.length + 1) * 10;
    }, [dataSourceType, dataSource?.items, sortOrderAttribute, items.length]);

    // Set sort order on datasource when using database mode with sort order attribute
    useEffect(() => {
        if (dataSourceType === "database" && dataSource && sortOrderAttribute) {
            if (dataSource.setSortOrder && sortOrderAttribute.id) {
                dataSource.setSortOrder([[sortOrderAttribute.id, "asc"]]);
            }
        }
    }, [dataSourceType, dataSource, sortOrderAttribute]);

    // Generate unique IDs for sortable items
    const sortableIds = useMemo(() => {
        if (dataSourceType === "database" && dataSource?.items) {
            return dataSource.items.map((item: ObjectItem) => item.id);
        }
        return items.map((_, index) => `static-${index}`);
    }, [dataSourceType, dataSource?.items, items]);

    const isLoading =
        dataSourceType === "database" && dataSource && dataSource.status === "loading";

    return {
        items,
        isLoading: !!isLoading,
        defaultSortOrder,
        sortableIds
    };
}
