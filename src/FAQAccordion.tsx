import { ReactElement, createElement, useState, useEffect, useMemo } from "react";
import { FAQAccordionContainerProps, ContentFormatEnum } from "../typings/FAQAccordionProps";
import "./ui/FAQAccordion.scss";
import classNames from "classnames";
import { processContent, getContentWarnings } from "./utils/contentProcessor";
import { ObjectItem } from "mendix";

interface FAQItem {
    summary: string;
    content: string;
    contentFormat: ContentFormatEnum;
}

/**
 * Normalizes content format value to valid format or defaults to HTML
 * @param format - Raw format value from database or configuration
 * @returns Valid ContentFormatEnum value
 */
function normalizeContentFormat(format: string | undefined | null): ContentFormatEnum {
    if (!format) {
        return "html";
    }
    
    const normalized = format.toLowerCase().trim();
    
    // Check if it's a valid format
    if (normalized === "html" || normalized === "markdown" || normalized === "text") {
        return normalized as ContentFormatEnum;
    }
    
    // Unrecognized format - default to HTML
    console.warn(`FAQ Accordion: Unrecognized content format "${format}", defaulting to HTML`);
    return "html";
}

export function FAQAccordion(props: FAQAccordionContainerProps): ReactElement {
    const {
        dataSourceType,
        faqItems,
        dataSource,
        summaryAttribute,
        contentAttribute,
        formatAttribute,
        defaultExpandAll,
        showToggleButton,
        toggleButtonText,
        animationDuration
    } = props;

    // Get FAQ items from either static configuration or database
    const items = useMemo<FAQItem[]>(() => {
        if (dataSourceType === "database" && dataSource && dataSource.status === "available") {
            // Database mode: read from data source
            return dataSource.items?.map((item: ObjectItem) => {
                const summary = summaryAttribute?.get(item).value || "Question";
                const content = contentAttribute?.get(item).value || "";
                const formatValue = formatAttribute?.get(item).value;
                const format = normalizeContentFormat(formatValue);
                
                return {
                    summary,
                    content,
                    contentFormat: format
                };
            }) || [];
        } else {
            // Static mode: use configured items
            return faqItems?.map(item => ({
                summary: item.summary?.value || "Question",
                content: item.content?.value || "",
                contentFormat: normalizeContentFormat(item.contentFormat)
            })) || [];
        }
    }, [dataSourceType, dataSource, faqItems, summaryAttribute, contentAttribute, formatAttribute]);

    // State to track which items are expanded
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [allExpanded, setAllExpanded] = useState(defaultExpandAll);

    // Initialize expanded state based on defaultExpandAll
    useEffect(() => {
        if (defaultExpandAll) {
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
        }
    }, [defaultExpandAll, items]);

    // Toggle individual item
    const toggleItem = (index: number): void => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Toggle all items
    const toggleAll = (): void => {
        if (allExpanded) {
            // Collapse all
            setExpandedItems(new Set());
            setAllExpanded(false);
        } else {
            // Expand all
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
            setAllExpanded(true);
        }
    };

    // Update allExpanded state based on individual toggles
    useEffect(() => {
        if (items) {
            const allAreExpanded = items.length > 0 && expandedItems.size === items.length;
            setAllExpanded(allAreExpanded);
        }
    }, [expandedItems, items]);

    // Show loading state for database mode
    if (dataSourceType === "database" && dataSource && dataSource.status === "loading") {
        return (
            <div className="faq-accordion-loading">
                <p>Loading FAQ items...</p>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="faq-accordion-empty">
                <p>No FAQ items configured</p>
            </div>
        );
    }

    const getToggleButtonText = (): string => {
        if (toggleButtonText && toggleButtonText.value) {
            return toggleButtonText.value;
        }
        return allExpanded ? "Hide All" : "Show All";
    };

    return (
        <div className="faq-accordion-container">
            {showToggleButton && (
                <div className="faq-accordion-header">
                    <button
                        className={classNames("faq-toggle-all-btn", {
                            "faq-toggle-all-btn--expanded": allExpanded
                        })}
                        onClick={toggleAll}
                        type="button"
                    >
                        {getToggleButtonText()}
                    </button>
                </div>
            )}

            <div className="faq-accordion-items">
                {items.map((item, index) => {
                    const isExpanded = expandedItems.has(index);
                    const summaryValue = item.summary;
                    const contentValue = item.content;
                    const contentFormat = item.contentFormat;
                    
                    // Process content based on format and sanitize
                    const processedContent = processContent(contentValue, contentFormat);
                    
                    // Get validation warnings (only for HTML format)
                    const warnings = getContentWarnings(contentValue, contentFormat);

                    return (
                        <details
                            key={index}
                            className={classNames("faq-item", {
                                "faq-item--expanded": isExpanded
                            })}
                            open={isExpanded}
                            style={
                                {
                                    "--animation-duration": `${animationDuration || 300}ms`
                                } as React.CSSProperties
                            }
                        >
                            <summary
                                className="faq-item-summary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleItem(index);
                                }}
                                onKeyDown={(e) => {
                                    // Handle keyboard navigation
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleItem(index);
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-expanded={isExpanded}
                            >
                                <span className="faq-item-summary-text">{summaryValue}</span>
                                <span
                                    className={classNames("faq-item-icon", {
                                        "faq-item-icon--expanded": isExpanded
                                    })}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M4 6L8 10L12 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </summary>
                            <div className="faq-item-content">
                                {warnings.length > 0 && (
                                    <div className="faq-item-warnings">
                                        {warnings.map((warning, wIndex) => (
                                            <div key={wIndex} className="faq-item-warning">
                                                ⚠️ {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    className="faq-item-content-inner"
                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                />
                            </div>
                        </details>
                    );
                })}
            </div>
        </div>
    );
}
