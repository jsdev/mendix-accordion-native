import DOMPurify from "dompurify";
import { marked } from "marked";

/**
 * Content format types
 */
export type ContentFormat = "html" | "markdown" | "text";
/**
 * Configuration for HTML sanitization
 * Updated for FAQ content: Prioritizes safe, readable rich text with full link support.
 * Enhances table support (including captions and structural attributes for better accessibility/complexity).
 * Adds optional video support (commented out by default—uncomment if embedding videos is desired for FAQs;
 * note: this increases security review needs due to potential executable content).
 * Removes headings (h1-h6) as they're likely unnecessary for FAQ responses.
 * Retains core formatting, lists, images, and tables for structured answers.
 */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "b",
        "i",
        "a",
        "ul",
        "ol",
        "li",
        "code",
        "pre",
        "hr",
        "table",
        "caption", // Added for table titles/descriptions
        "thead",
        "tbody",
        "tfoot", // Added for table footers (e.g., summaries/totals)
        "tr",
        "th",
        "td",
        "col", // Added for column properties
        "colgroup", // Added for grouping columns
        "img",
        "div",
        "span",
        "video", // Uncomment to enable <video> for embedded videos
        "source", // Uncomment if enabling video (for <video> sources)
        "figure", // Optional: For wrapping images/tables with captions
        "figcaption" // Optional: For figure descriptions
    ],
    ALLOWED_ATTR: [
        "href",
        "title",
        "target",
        "rel",
        "src",
        "alt",
        "width",
        "height",
        "class",
        "id",
        "style",
        // Table-specific attributes for structure and accessibility
        "rowspan",
        "colspan",
        "scope", // For <th> (e.g., row, col, rowgroup)
        "headers", // For associating <td> with <th>
        // Video-specific (uncomment if enabling video)
        "controls",
        "autoplay",
        "loop",
        "muted",
        "poster"
    ],
    ALLOW_DATA_ATTR: false, // Keep false for security; enable only if custom data attrs are vetted
    ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
};

/**
 * Validates and sanitizes HTML content
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
    if (!html) {
        return "";
    }

    try {
        // Configure DOMPurify
        const cleanHTML = DOMPurify.sanitize(html, SANITIZE_CONFIG);
        return cleanHTML;
    } catch (error) {
        console.error("Error sanitizing HTML:", error);
        // Return escaped text as fallback
        return escapeHTML(html);
    }
}

/**
 * Validates HTML content and returns validation errors
 * @param html - The HTML string to validate
 * @returns Array of validation error messages
 */
export function validateHTML(html: string): string[] {
    const errors: string[] = [];

    if (!html) {
        return errors;
    }

    // Check for script tags (should be blocked)
    if (/<script[^>]*>[\s\S]*?<\/script>/gi.test(html)) {
        errors.push("Script tags are not allowed for security reasons");
    }

    // Check for event handlers (should be blocked)
    if (/on\w+\s*=/gi.test(html)) {
        errors.push("Event handlers (onclick, onload, etc.) are not allowed for security reasons");
    }

    // Check for javascript: protocol
    if (/javascript:/gi.test(html)) {
        errors.push("JavaScript protocol in URLs is not allowed for security reasons");
    }

    // Check for data: protocol (except for images)
    if (/data:(?!image)/gi.test(html)) {
        errors.push("Data URLs are only allowed for images");
    }

    // Check for iframe (not in allowed tags)
    if (/<iframe[^>]*>/gi.test(html)) {
        errors.push("Iframe tags are not allowed");
    }

    // Check for object and embed tags
    if (/<(object|embed)[^>]*>/gi.test(html)) {
        errors.push("Object and embed tags are not allowed");
    }

    return errors;
}

/**
 * Validates HTML syntax for malformed markup
 * @param html - The HTML string to validate
 * @returns Array of syntax error messages
 */
export function validateHTMLSyntax(html: string): string[] {
    const errors: string[] = [];

    if (!html) {
        return errors;
    }

    const allTags = html.match(/<[^>]+>/g) || [];

    allTags.forEach((tag) => {
        // Check for attributes with unclosed quotes
        // Look for attr=" or attr=' that doesn't have a matching closing quote
        const singleQuoteMatches = tag.match(/\w+\s*=\s*'[^']*$/);
        const doubleQuoteMatches = tag.match(/\w+\s*=\s*"[^"]*$/);

        if (singleQuoteMatches || doubleQuoteMatches) {
            errors.push(
                `Unclosed attribute quote in tag: ${tag.substring(0, 50)}${
                    tag.length > 50 ? "..." : ""
                }`
            );
        }

        // Check for unclosed opening tag (missing >)
        if (tag.startsWith("<") && !tag.endsWith(">")) {
            errors.push(
                `Unclosed tag bracket: ${tag.substring(0, 50)}${tag.length > 50 ? "..." : ""}`
            );
        }
    });

    // Check for balanced tags (opening and closing)
    // Self-closing tags that don't need closing tags
    const selfClosingTags = [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    ];

    // Extract all tags (opening and closing)
    const tagStack: Array<{ tag: string; position: number }> = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        const isClosing = fullTag.startsWith("</");
        const isSelfClosing = fullTag.endsWith("/>") || selfClosingTags.includes(tagName);

        if (isClosing) {
            // Closing tag - pop from stack
            if (tagStack.length === 0) {
                errors.push(`Orphaned closing tag: </${tagName}>`);
            } else {
                const lastOpened = tagStack[tagStack.length - 1];
                if (lastOpened.tag === tagName) {
                    tagStack.pop();
                } else {
                    // Mismatched tag
                    errors.push(
                        `Mismatched tags: Expected closing tag for <${lastOpened.tag}>, found </${tagName}>`
                    );
                    // Try to find matching opening tag in stack
                    const matchIndex = tagStack.findIndex((t) => t.tag === tagName);
                    if (matchIndex >= 0) {
                        tagStack.splice(matchIndex, 1);
                    }
                }
            }
        } else if (!isSelfClosing) {
            // Opening tag - push to stack
            tagStack.push({ tag: tagName, position: match.index });
        }
    }

    // Check for unclosed tags remaining in stack
    if (tagStack.length > 0) {
        tagStack.forEach(({ tag }) => {
            errors.push(`Unclosed tag: <${tag}> is missing closing tag </${tag}>`);
        });
    }

    // Check for malformed attributes (no value, malformed syntax)
    const malformedAttrPattern = /<[^>]+\s+(\w+)\s*=\s*(?!["\w])[^>]*>/g;
    let attrMatch;
    while ((attrMatch = malformedAttrPattern.exec(html)) !== null) {
        errors.push(
            `Malformed attribute syntax: ${attrMatch[0].substring(0, 50)}${
                attrMatch[0].length > 50 ? "..." : ""
            }`
        );
    }

    return errors;
}

/**
 * Converts markdown to HTML
 * @param markdown - The markdown string to convert
 * @returns HTML string
 */
export function markdownToHTML(markdown: string): string {
    if (!markdown) {
        return "";
    }

    try {
        // Configure marked for security
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        const html = marked.parse(markdown) as string;
        // Sanitize the generated HTML
        return sanitizeHTML(html);
    } catch (error) {
        console.error("Error parsing markdown:", error);
        return escapeHTML(markdown);
    }
}

/**
 * Escapes HTML special characters
 * @param text - The text to escape
 * @returns Escaped text
 */
export function escapeHTML(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Converts plain text to HTML with line breaks
 * @param text - The plain text to convert
 * @returns HTML string with line breaks
 */
export function textToHTML(text: string): string {
    if (!text) {
        return "";
    }

    // Escape HTML characters and convert line breaks to <br>
    const escaped = escapeHTML(text);
    return escaped.replace(/\n/g, "<br>");
}

/**
 * Processes content based on format and returns sanitized HTML
 * @param content - The content string
 * @param format - The content format (html, markdown, or text)
 * @returns Sanitized HTML string or escaped markdown
 */
export function processContent(content: string, format: ContentFormat): string {
    if (!content) {
        return "";
    }

    switch (format) {
        case "html":
            return sanitizeHTML(content);
        case "markdown":
            // Convert markdown to HTML and sanitize it
            return markdownToHTML(content);
        case "text":
            return textToHTML(content);
        default:
            // Unrecognized format - treat as HTML and sanitize for safety
            console.warn(`Unrecognized content format "${format}", treating as HTML`);
            return sanitizeHTML(content);
    }
}

/**
 * Gets validation warnings for content based on format
 * @param content - The content string
 * @param format - The content format
 * @returns Array of warning messages
 */
export function getContentWarnings(content: string, format: ContentFormat): string[] {
    if (!content) {
        return [];
    }

    switch (format) {
        case "html":
            // Validate both security issues and syntax
            const securityWarnings = validateHTML(content);
            const syntaxWarnings = validateHTMLSyntax(content);
            return [...securityWarnings, ...syntaxWarnings];
        case "markdown":
            // Check for dangerous HTML embedded in markdown
            // Users might try to include <script> tags in their markdown
            const htmlPattern = /<[^>]+>/g;
            const htmlMatches = content.match(htmlPattern);

            if (htmlMatches) {
                // Extract just the HTML parts and validate them
                const htmlContent = htmlMatches.join("");
                const htmlSecurityWarnings = validateHTML(htmlContent);
                const htmlSyntaxWarnings = validateHTMLSyntax(htmlContent);

                const allWarnings = [...htmlSecurityWarnings, ...htmlSyntaxWarnings];
                if (allWarnings.length > 0) {
                    return allWarnings.map((warning) => `Embedded HTML in markdown: ${warning}`);
                }
            }
            return [];
        case "text":
            // Text format doesn't need validation (everything is escaped)
            return [];
        default:
            return [];
    }
}
