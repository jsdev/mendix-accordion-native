import { ReactElement } from "react";
import classNames from "classnames";
import { processContent, getContentWarnings } from "../utils/contentProcessor";
import { ContentFormatEnum } from "../../typings/FAQAccordionProps";

interface FAQItemData {
    summary: string;
    content: string;
    contentFormat: ContentFormatEnum;
    sortOrder?: number;
}

interface FAQItemsListProps {
    items: FAQItemData[];
    expandedItems: Set<number>;
    animationDuration: number;
    onToggleItem: (index: number) => void;
}

/**
 * Renders the FAQ items list in normal (non-edit) mode
 * Uses semantic HTML details/summary elements
 */
export function FAQItemsList({
    items,
    expandedItems,
    animationDuration,
    onToggleItem
}: FAQItemsListProps): ReactElement {
    return (
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
                                "--animation-duration": `${animationDuration}ms`
                            } as React.CSSProperties
                        }
                    >
                        <summary
                            className="faq-item-summary"
                            onClick={(e) => {
                                e.preventDefault();
                                onToggleItem(index);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onToggleItem(index);
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
    );
}
