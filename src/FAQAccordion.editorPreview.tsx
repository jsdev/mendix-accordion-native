import { createElement } from "react";
import { FAQAccordionPreviewProps } from "../typings/FAQAccordionProps";
import { processContent, sanitizeHTML, getContentWarnings, ContentFormat } from "./utils/contentProcessor";

// Helper to get format label
function getFormatLabel(format?: string): string {
    switch (format) {
        case "markdown":
            return "MD";
        case "text":
            return "TXT";
        case "html":
        default:
            return "HTML";
    }
}

// Check if sanitization modified the content
function checkSanitization(content: string, format: string): { modified: boolean; originalHtml: string; sanitizedHtml: string } {
    if (!content || format === "text") {
        return { modified: false, originalHtml: "", sanitizedHtml: "" };
    }

    let originalHtml = content;
    
    // For markdown, convert to HTML first
    if (format === "markdown") {
        try {
            // Simple markdown to HTML conversion for comparison
            // In production, this uses marked.js, but for preview we'll do basic detection
            const hasMarkdownSyntax = /[*_#\[\]`]/.test(content);
            if (hasMarkdownSyntax) {
                // If it has markdown syntax, we know it will be converted
                originalHtml = content; // Keep as is for now
            }
        } catch (e) {
            // Ignore errors
        }
    }
    
    // Sanitize the HTML
    const sanitizedHtml = sanitizeHTML(originalHtml);
    
    // Check if sanitization changed the content
    // Normalize whitespace for comparison
    const normalizedOriginal = originalHtml.replace(/\s+/g, " ").trim();
    const normalizedSanitized = sanitizedHtml.replace(/\s+/g, " ").trim();
    
    return {
        modified: normalizedOriginal !== normalizedSanitized,
        originalHtml,
        sanitizedHtml
    };
}

// Preview content based on format - returns JSX for rendering with SANITIZED content
function previewContent(content: string, format: string): JSX.Element {
    if (!content) {
        return <span style={{ fontStyle: "italic", color: "#999" }}>[No content]</span>;
    }
    
    const maxLength = 300;
    
    // Process content through the same pipeline as runtime
    const processedHtml = processContent(content, format as ContentFormat);
    const truncated = processedHtml.length > maxLength ? processedHtml.substring(0, maxLength) + "..." : processedHtml;
    
    switch (format) {
        case "markdown":
            // Show rendered HTML from markdown (same as runtime)
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: truncated }}
                    style={{ 
                        wordWrap: "break-word",
                        overflowWrap: "break-word"
                    }}
                />
            );
        case "text":
            // Show processed text (with <br> tags, same as runtime)
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: truncated }}
                    style={{ 
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap"
                    }}
                />
            );
        case "html":
        default:
            // Show SANITIZED HTML (same as runtime)
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: truncated }}
                    style={{ 
                        wordWrap: "break-word",
                        overflowWrap: "break-word"
                    }}
                />
            );
    }
}

export function preview(props: FAQAccordionPreviewProps) {
    const { dataSourceType, faqItems, dataSource, showToggleButton } = props;
    
    // Determine item count and source
    let itemCount = 0;
    let sourceLabel = "";
    
    if (dataSourceType === "database") {
        // Database mode
        sourceLabel = "Database Entity";
        if (dataSource && typeof dataSource === "object" && "caption" in dataSource) {
            sourceLabel = `Database: ${dataSource.caption}`;
        }
        // In preview mode, we can't get actual count, show placeholder
        itemCount = 0;
    } else {
        // Static mode
        sourceLabel = "Static Items";
        itemCount = faqItems ? faqItems.length : 0;
    }

    return (
        <div
            className="faq-accordion-preview"
            style={{
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#fafafa"
            }}
        >
            {showToggleButton && (
                <div style={{ marginBottom: "12px", textAlign: "right" }}>
                    <button
                        style={{
                            padding: "8px 24px",
                            backgroundColor: "#f5f5f5",
                            color: "#333333",
                            border: "2px solid #d1d1d1",
                            borderRadius: "6px",
                            cursor: "default",
                            fontWeight: 500
                        }}
                    >
                        Hide All
                    </button>
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {dataSourceType === "database" ? (
                    // Database mode preview
                    <div
                        style={{
                            padding: "32px",
                            textAlign: "center",
                            color: "#0070f3",
                            border: "2px dashed #0070f3",
                            borderRadius: "8px",
                            backgroundColor: "#f0f7ff"
                        }}
                    >
                        <p style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "16px" }}>
                            📊 {sourceLabel}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                            FAQ items will be loaded from the configured data source at runtime.
                            <br />
                            <br />
                            <strong>Configuration:</strong>
                            <br />
                            Summary: {props.summaryAttribute || "[Not configured]"}
                            <br />
                            Content: {props.contentAttribute || "[Not configured]"}
                            <br />
                            Format: {props.formatAttribute || "[Optional - defaults to HTML]"}
                        </p>
                    </div>
                ) : itemCount > 0 ? (
                    // Static mode preview
                    faqItems?.map((item, index) => {
                        const contentValue = item.content || "";
                        const format = item.contentFormat || "html";
                        
                        // Get validation warnings
                        const warnings = getContentWarnings(contentValue, format as ContentFormat);
                        
                        // Check if sanitization will modify the content
                        const sanitizationCheck = checkSanitization(contentValue, format);
                        
                        // Combine all issues
                        const allWarnings = [...warnings];
                        if (sanitizationCheck.modified) {
                            allWarnings.push("Content will be sanitized at runtime (dangerous elements removed)");
                        }
                        
                        const hasIssues = allWarnings.length > 0;
                        
                        return (
                            <div
                                key={index}
                                style={{
                                    border: hasIssues ? "2px solid #ff8c00" : "1px solid #0070f3",
                                    borderRadius: "8px",
                                    backgroundColor: "#ffffff",
                                    overflow: "hidden"
                                }}
                            >
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        backgroundColor: "#f0f7ff",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontWeight: 500,
                                        color: "#0070f3"
                                    }}
                                >
                                    <span style={{ flex: 1 }}>{item.summary || "[Question/Summary]"}</span>
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            padding: "2px 6px",
                                            backgroundColor: hasIssues ? "#fff3e0" : "#e8f4ff",
                                            borderRadius: "3px",
                                            marginRight: "8px",
                                            color: hasIssues ? "#ff8c00" : "#0070f3",
                                            fontWeight: "bold",
                                            border: `1px solid ${hasIssues ? "#ffd699" : "#c3e0ff"}`
                                        }}
                                    >
                                        {getFormatLabel(format)}
                                    </span>
                                    <span style={{ color: "#0070f3", transform: "rotate(180deg)", display: "inline-block" }}>▼</span>
                                </div>
                                {/* Expanded content preview */}
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        backgroundColor: "#ffffff",
                                        borderTop: "1px solid #e5e5e5"
                                    }}
                                >
                                    {hasIssues && (
                                        <div
                                            style={{
                                                backgroundColor: "#fff8f0",
                                                border: "1px solid #ffd699",
                                                borderRadius: "4px",
                                                padding: "8px 12px",
                                                marginBottom: "8px"
                                            }}
                                        >
                                            <div style={{ fontWeight: "bold", color: "#ff8c00", fontSize: "12px", marginBottom: "4px" }}>
                                                ⚠️ Content Warnings:
                                            </div>
                                            <ul style={{ margin: "0", paddingLeft: "20px", color: "#d97700", fontSize: "11px" }}>
                                                {allWarnings.map((warning, i) => (
                                                    <li key={i}>{warning}</li>
                                                ))}
                                            </ul>
                                            {sanitizationCheck.modified && (
                                                <div style={{ 
                                                    marginTop: "8px", 
                                                    fontSize: "11px", 
                                                    color: "#666",
                                                    fontStyle: "italic"
                                                }}>
                                                    💡 Preview shows sanitized output (matching runtime behavior)
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            color: "#555555",
                                            fontSize: "14px",
                                            lineHeight: "1.6"
                                        }}
                                    >
                                        {previewContent(contentValue, format)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // Empty state
                    <div
                        style={{
                            padding: "32px",
                            textAlign: "center",
                            color: "#999999",
                            border: "1px dashed #d1d1d1",
                            borderRadius: "8px"
                        }}
                    >
                        <p style={{ margin: 0 }}>
                            No FAQ items configured
                            <br />
                            <small>
                                {dataSourceType === "database" as any
                                    ? "Configure the data source in the properties panel"
                                    : "Add FAQ items in the properties panel"}
                            </small>
                        </p>
                    </div>
                )}
            </div>
            <div
                style={{
                    marginTop: "12px",
                    padding: "8px",
                    backgroundColor: "#f0f7ff",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#0070f3",
                    textAlign: "center"
                }}
            >
                FAQ Accordion Widget - {sourceLabel}
                {dataSourceType === "static" && ` (${itemCount} item${itemCount !== 1 ? "s" : ""})`}
                {dataSourceType === "static" && itemCount > 0 && " - Preview shows expanded state"}
            </div>
        </div>
    );
}

export function getPreviewCss() {
    return `
.faq-accordion-preview {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.faq-accordion-preview a {
    color: #0070f3;
    text-decoration: underline;
}

.faq-accordion-preview strong,
.faq-accordion-preview b {
    font-weight: 600;
    color: #333;
}

.faq-accordion-preview em,
.faq-accordion-preview i {
    font-style: italic;
}

.faq-accordion-preview code {
    padding: 2px 4px;
    background-color: #f5f5f5;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    font-family: "Courier New", Courier, monospace;
    font-size: 0.9em;
}

.faq-accordion-preview ul,
.faq-accordion-preview ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.faq-accordion-preview li {
    margin: 0.25rem 0;
}

.faq-accordion-preview p {
    margin: 0.5rem 0;
}

.faq-accordion-preview h1,
.faq-accordion-preview h2,
.faq-accordion-preview h3,
.faq-accordion-preview h4,
.faq-accordion-preview h5,
.faq-accordion-preview h6 {
    margin: 0.5rem 0;
    font-weight: 600;
    color: #333;
}

.faq-accordion-preview blockquote {
    margin: 0.5rem 0;
    padding-left: 1rem;
    border-left: 4px solid #0070f3;
    color: #666;
    font-style: italic;
}
`;
}
