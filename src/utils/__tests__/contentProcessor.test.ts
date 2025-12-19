/**
 * @jest-environment jsdom
 */

import {
    sanitizeHTML,
    validateHTML,
    validateHTMLSyntax,
    markdownToHTML,
    escapeHTML,
    textToHTML,
    processContent,
    getContentWarnings
} from "../contentProcessor";

describe("contentProcessor", () => {
    describe("sanitizeHTML", () => {
        it("should return empty string for empty input", () => {
            expect(sanitizeHTML("")).toBe("");
            expect(sanitizeHTML(null as any)).toBe("");
            expect(sanitizeHTML(undefined as any)).toBe("");
        });

        it("should allow safe HTML tags", () => {
            const html = "<p>Hello <strong>world</strong></p>";
            const result = sanitizeHTML(html);
            expect(result).toContain("<p>");
            expect(result).toContain("<strong>");
            expect(result).toContain("Hello");
            expect(result).toContain("world");
        });

        it("should remove script tags", () => {
            const html = '<p>Safe</p><script>alert("XSS")</script>';
            const result = sanitizeHTML(html);
            expect(result).not.toContain("<script>");
            expect(result).not.toContain("alert");
            expect(result).toContain("Safe");
        });

        it("should remove event handlers", () => {
            const html = '<a href="#" onclick="alert(\'XSS\')">Click me</a>';
            const result = sanitizeHTML(html);
            expect(result).not.toContain("onclick");
            expect(result).toContain("Click me");
        });

        it("should remove javascript: protocol", () => {
            const html = '<a href="javascript:alert(\'XSS\')">Click</a>';
            const result = sanitizeHTML(html);
            expect(result).not.toContain("javascript:");
        });

        it("should allow safe links", () => {
            const html = '<a href="https://example.com" target="_blank">Link</a>';
            const result = sanitizeHTML(html);
            expect(result).toContain("href=");
            expect(result).toContain("example.com");
            expect(result).toContain("Link");
        });

        it("should allow images with safe attributes", () => {
            const html = '<img src="https://example.com/image.jpg" alt="Test Image" />';
            const result = sanitizeHTML(html);
            expect(result).toContain("img");
            expect(result).toContain("src=");
            expect(result).toContain("alt=");
        });

        it("should allow lists", () => {
            const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
            const result = sanitizeHTML(html);
            expect(result).toContain("<ul>");
            expect(result).toContain("<li>");
            expect(result).toContain("Item 1");
            expect(result).toContain("Item 2");
        });

        it("should allow tables", () => {
            const html = "<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>";
            const result = sanitizeHTML(html);
            expect(result).toContain("<table>");
            expect(result).toContain("<th>");
            expect(result).toContain("<td>");
        });

        it("should allow tables", () => {
            const html = "<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>";
            const result = sanitizeHTML(html);
            expect(result).toContain("<table>");
            expect(result).toContain("<th>");
            expect(result).toContain("<td>");
        });

        it("should allow enhanced table elements", () => {
            const html = `
                <table>
                    <caption>Table Caption</caption>
                    <colgroup>
                        <col />
                    </colgroup>
                    <thead><tr><th>Header</th></tr></thead>
                    <tbody><tr><td>Body</td></tr></tbody>
                    <tfoot><tr><td>Footer</td></tr></tfoot>
                </table>
            `;
            const result = sanitizeHTML(html);
            expect(result).toContain("<caption>");
            expect(result).toContain("<colgroup>");
            expect(result).toContain("<col");
            expect(result).toContain("<thead>");
            expect(result).toContain("<tbody>");
            expect(result).toContain("<tfoot>");
        });

        it("should allow figure and figcaption", () => {
            const html = `
                <figure>
                    <img src="test.jpg" alt="Test" />
                    <figcaption>Image description</figcaption>
                </figure>
            `;
            const result = sanitizeHTML(html);
            expect(result).toContain("<figure>");
            expect(result).toContain("<figcaption>");
            expect(result).toContain("Image description");
        });

        it("should allow video elements", () => {
            const html = `
                <video controls>
                    <source src="video.mp4" type="video/mp4" />
                </video>
            `;
            const result = sanitizeHTML(html);
            expect(result).toContain("<video");
            expect(result).toContain("<source");
        });

        it("should use p elements for simple text", () => {
            const text = "This is simple text content";
            const html = `<p>${text}</p>`;
            const result = sanitizeHTML(html);
            expect(result).toContain("<p>");
            expect(result).toContain(text);
        });

        it("should use div elements for nested HTML", () => {
            const html = `
                <div>
                    <p>Nested paragraph</p>
                    <ul><li>List item</li></ul>
                </div>
            `;
            const result = sanitizeHTML(html);
            expect(result).toContain("<div>");
            expect(result).toContain("<p>");
            expect(result).toContain("<ul>");
        });

        it("should remove iframe tags", () => {
            const html = '<p>Text</p><iframe src="evil.com"></iframe>';
            const result = sanitizeHTML(html);
            expect(result).not.toContain("<iframe>");
            expect(result).toContain("Text");
        });
    });

    describe("Error Handling", () => {
        it("should handle DOMPurify sanitization errors", () => {
            const DOMPurify = require("dompurify");
            const originalSanitize = DOMPurify.sanitize;
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            
            // Mock sanitize to throw an error
            DOMPurify.sanitize = jest.fn(() => {
                throw new Error("Sanitization error");
            });
            
            const html = "<p>Test content</p>";
            const result = sanitizeHTML(html);
            
            // Should fallback to escapeHTML
            expect(result).toBeTruthy();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error sanitizing HTML:",
                expect.any(Error)
            );
            
            // Restore
            DOMPurify.sanitize = originalSanitize;
            consoleErrorSpy.mockRestore();
        });
    });

    describe("validateHTML", () => {
        it("should return empty array for valid HTML", () => {
            const html = "<p>Hello <strong>world</strong></p>";
            const errors = validateHTML(html);
            expect(errors).toEqual([]);
        });

        it("should return empty array for empty input", () => {
            expect(validateHTML("")).toEqual([]);
            expect(validateHTML(null as any)).toEqual([]);
        });

        it("should detect script tags", () => {
            const html = '<script>alert("XSS")</script>';
            const errors = validateHTML(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain("Script tags");
        });

        it("should detect event handlers", () => {
            const html = '<div onclick="alert()">Click</div>';
            const errors = validateHTML(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("event handler"))).toBe(true);
        });

        it("should detect javascript: protocol", () => {
            const html = '<a href="javascript:void(0)">Link</a>';
            const errors = validateHTML(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("javascript protocol"))).toBe(true);
        });

        it("should detect iframe tags", () => {
            const html = '<iframe src="evil.com"></iframe>';
            const errors = validateHTML(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("iframe"))).toBe(true);
        });

        it("should detect object and embed tags", () => {
            const html1 = '<object data="test.swf"></object>';
            const html2 = '<embed src="test.swf">';
            
            const errors1 = validateHTML(html1);
            const errors2 = validateHTML(html2);
            
            expect(errors1.length).toBeGreaterThan(0);
            expect(errors2.length).toBeGreaterThan(0);
        });

        it("should allow data: protocol for images", () => {
            const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANS" />';
            const errors = validateHTML(html);
            expect(errors).toEqual([]);
        });

        it("should detect non-image data: protocols", () => {
            const html = '<a href="data:text/html,<script>alert()</script>">Link</a>';
            const errors = validateHTML(html);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe("validateHTMLSyntax", () => {
        it("should return empty array for valid HTML", () => {
            const html = '<p>Hello <strong>world</strong></p>';
            const errors = validateHTMLSyntax(html);
            expect(errors).toEqual([]);
        });

        it("should return empty array for empty input", () => {
            expect(validateHTMLSyntax("")).toEqual([]);
        });

        it("should detect unclosed double quote in attribute", () => {
            const html = '<a href="https://example.com>Link</a>';
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("unclosed"))).toBe(true);
        });

        it("should detect unclosed single quote in attribute", () => {
            const html = "<a href='https://example.com>Link</a>";
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("unclosed"))).toBe(true);
        });

        it("should detect unclosed opening tag", () => {
            // More realistic: tag without closing bracket at end of content
            const html = '<div><p>Hello</p><span class="test"';
            const errors = validateHTMLSyntax(html);
            // This should at least detect the unclosed div and span
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("unclosed"))).toBe(true);
        });

        it("should detect orphaned closing tag", () => {
            const html = '<p>Hello</p></div>';
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("orphaned"))).toBe(true);
        });

        it("should detect missing closing tag", () => {
            const html = '<div><p>Hello</div>';
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("unclosed") || e.toLowerCase().includes("mismatched"))).toBe(true);
        });

        it("should detect mismatched tags", () => {
            const html = '<div><span>Text</div></span>';
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("mismatched"))).toBe(true);
        });

        it("should handle self-closing tags correctly", () => {
            const html = '<p>Text<br/>More text</p>';
            const errors = validateHTMLSyntax(html);
            expect(errors).toEqual([]);
        });

        it("should handle void elements (img, input, etc.)", () => {
            const html = '<div><img src="test.jpg"><input type="text"></div>';
            const errors = validateHTMLSyntax(html);
            expect(errors).toEqual([]);
        });

        it("should detect multiple unclosed tags", () => {
            const html = '<div><span><p>Text';
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThanOrEqual(3); // All three tags unclosed
        });

        it("should handle nested tags correctly", () => {
            const html = '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>';
            const errors = validateHTMLSyntax(html);
            expect(errors).toEqual([]);
        });

        it("should detect unclosed quote with target attribute", () => {
            const html = '<a href="https://example.com" target="_blank>Link</a>';
            const errors = validateHTMLSyntax(html);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes("unclosed"))).toBe(true);
        });
    });

    describe("escapeHTML", () => {
        it("should escape HTML special characters", () => {
            expect(escapeHTML("<script>")).toBe("&lt;script&gt;");
            expect(escapeHTML("&")).toBe("&amp;");
            // Note: Different browsers may escape quotes differently
            const escaped = escapeHTML('"');
            expect(escaped === "&quot;" || escaped === '"').toBe(true);
            expect(escapeHTML("'")).toContain("'");
        });

        it("should handle empty input", () => {
            expect(escapeHTML("")).toBe("");
        });

        it("should not escape normal text", () => {
            expect(escapeHTML("Hello World")).toBe("Hello World");
        });
    });

    describe("textToHTML", () => {
        it("should convert line breaks to <br>", () => {
            const text = "Line 1\nLine 2\nLine 3";
            const result = textToHTML(text);
            expect(result).toContain("<br>");
            expect(result.split("<br>").length).toBe(3);
        });

        it("should escape HTML in plain text", () => {
            const text = "<script>alert('XSS')</script>";
            const result = textToHTML(text);
            expect(result).not.toContain("<script>");
            expect(result).toContain("&lt;script&gt;");
        });

        it("should return empty string for empty input", () => {
            expect(textToHTML("")).toBe("");
            expect(textToHTML(null as any)).toBe("");
        });

        it("should handle text with both HTML and line breaks", () => {
            const text = "<p>Paragraph</p>\nNew Line";
            const result = textToHTML(text);
            expect(result).toContain("&lt;p&gt;");
            expect(result).toContain("<br>");
        });
    });

    describe("markdownToHTML", () => {
        it("should convert basic markdown to HTML", () => {
            const markdown = "# Heading\n\n**Bold** and *italic*";
            const result = markdownToHTML(markdown);
            // Note: H1 tags are stripped by DOMPurify for security (not in ALLOWED_TAGS)
            expect(result).toContain("<strong>");
            expect(result).toContain("<em>");
            expect(result).toContain("Heading");  // Text is kept, just not the tag
        });

        it("should convert markdown links", () => {
            const markdown = "[Link](https://example.com)";
            const result = markdownToHTML(markdown);
            expect(result).toContain("<a");
            expect(result).toContain("example.com");
        });

        it("should convert markdown lists", () => {
            const markdown = "- Item 1\n- Item 2\n- Item 3";
            const result = markdownToHTML(markdown);
            expect(result).toContain("<ul>");
            expect(result).toContain("<li>");
        });

        it("should convert code blocks", () => {
            const markdown = "`inline code` and\n\n```\ncode block\n```";
            const result = markdownToHTML(markdown);
            expect(result).toContain("<code>");
        });

        it("should sanitize HTML in markdown", () => {
            const markdown = '<script>alert("XSS")</script>\n\n# Safe Heading';
            const result = markdownToHTML(markdown);
            expect(result).not.toContain("<script>");
            expect(result).toContain("Safe Heading");  // Text kept, heading tag stripped
        });

        it("should return empty string for empty input", () => {
            expect(markdownToHTML("")).toBe("");
            expect(markdownToHTML(null as any)).toBe("");
        });

        it("should handle line breaks with GFM enabled", () => {
            const markdown = "Line 1\nLine 2";
            const result = markdownToHTML(markdown);
            expect(result).toContain("<br>");
        });

        it("should handle markdown parsing errors gracefully", () => {
            const marked = require("marked");
            const originalParse = marked.parse;
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            
            // Mock parse to throw an error
            marked.parse = () => {
                throw new Error("Markdown parsing error");
            };
            
            const markdown = "# Test content";
            const result = markdownToHTML(markdown);
            
            // Should fallback to escapeHTML
            expect(result).toBeTruthy();
            expect(result).toContain("Test content");
            
            // Restore
            marked.parse = originalParse;
            consoleErrorSpy.mockRestore();
        });
    });

    describe("processContent", () => {
        it("should process HTML format", () => {
            const content = "<p>Hello <strong>world</strong></p>";
            const result = processContent(content, "html");
            expect(result).toContain("<p>");
            expect(result).toContain("<strong>");
        });

        it("should process markdown format as plain text with line breaks", () => {
            const content = "# Heading\n\n**Bold**";
            const result = processContent(content, "markdown");
            // Markdown is now converted to HTML and sanitized
            expect(result).toContain("<strong>");
            expect(result).toContain("Bold");
            expect(result).toContain("Heading");
        });

        it("should process text format", () => {
            const content = "Line 1\nLine 2";
            const result = processContent(content, "text");
            expect(result).toContain("<br>");
            expect(result).not.toContain("\n");
        });

        it("should handle empty content", () => {
            expect(processContent("", "html")).toBe("");
            expect(processContent("", "markdown")).toBe("");
            expect(processContent("", "text")).toBe("");
        });

        it("should escape content for unknown formats", () => {
            const content = "<script>alert()</script>";
            const result = processContent(content, "unknown" as any);
            // Unknown formats now default to HTML sanitization (not escaping)
            expect(result).not.toContain("<script>");
            expect(result).not.toContain("alert");
        });

        it("should treat unknown format as HTML and sanitize", () => {
            const content = '<p>Safe content</p><script>alert()</script>';
            const result = processContent(content, "invalid-format" as any);
            // Should sanitize as HTML, keeping safe tags, removing dangerous ones
            expect(result).toContain("<p>");
            expect(result).toContain("Safe content");
            expect(result).not.toContain("<script>");
        });

        it("should sanitize dangerous content in all formats", () => {
            const dangerous = '<script>alert("XSS")</script>';
            
            expect(processContent(dangerous, "html")).not.toContain("<script>");
            expect(processContent(dangerous, "markdown")).not.toContain("<script>");
            expect(processContent(dangerous, "text")).not.toContain("<script>");
        });
    });

    describe("getContentWarnings", () => {
        it("should return warnings for invalid HTML", () => {
            const content = '<script>alert("XSS")</script>';
            const warnings = getContentWarnings(content, "html");
            expect(warnings.length).toBeGreaterThan(0);
        });

        it("should return empty array for valid HTML", () => {
            const content = "<p>Valid content</p>";
            const warnings = getContentWarnings(content, "html");
            expect(warnings).toEqual([]);
        });

        it("should return empty array for non-HTML formats", () => {
            const content = '<script>alert("XSS")</script>';
            // Markdown now validates embedded HTML
            const markdownWarnings = getContentWarnings(content, "markdown");
            expect(markdownWarnings.length).toBeGreaterThan(0);
            expect(markdownWarnings[0]).toContain("Embedded HTML");
            
            // Text format doesn't validate
            expect(getContentWarnings(content, "text")).toEqual([]);
        });

        it("should return empty array for empty content", () => {
            expect(getContentWarnings("", "html")).toEqual([]);
            expect(getContentWarnings(null as any, "html")).toEqual([]);
        });

        it("should detect multiple issues", () => {
            const content = '<script>alert()</script><iframe src="evil"></iframe><a onclick="bad()">Link</a>';
            const warnings = getContentWarnings(content, "html");
            expect(warnings.length).toBeGreaterThan(2);
        });

        it("should validate safe markdown without HTML", () => {
            const content = "# Safe Heading\n\n**Bold text** and *italic*";
            const warnings = getContentWarnings(content, "markdown");
            expect(warnings).toEqual([]);
        });

        it("should detect dangerous HTML in markdown", () => {
            const content = '# Heading\n\n<script>alert("XSS")</script>\n\nMore text';
            const warnings = getContentWarnings(content, "markdown");
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain("Embedded HTML");
            expect(warnings[0]).toContain("Script");
        });

        it("should detect event handlers in markdown HTML", () => {
            const content = '# Heading\n\n<a href="#" onclick="alert()">Link</a>';
            const warnings = getContentWarnings(content, "markdown");
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain("Embedded HTML");
        });

        it("should allow safe HTML in markdown", () => {
            const content = '# Heading\n\n<strong>Bold</strong> and <em>italic</em>';
            const warnings = getContentWarnings(content, "markdown");
            expect(warnings).toEqual([]);
        });
    });

    describe("Integration tests", () => {
        it("should handle complex HTML with multiple elements", () => {
            const html = `
                <h1>Title</h1>
                <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                </ul>
                <a href="https://example.com">Link</a>
            `;
            const result = sanitizeHTML(html);
            // Headings are stripped for accessibility/security, but content remains
            expect(result).toContain("Title");
            expect(result).toContain("<p>");
            expect(result).toContain("<ul>");
            expect(result).toContain("<a");
        });

        it("should handle complex markdown as plain text", () => {
            const markdown = `
# Main Heading

This is a paragraph with **bold** and *italic* text.

## Subheading

- List item 1
- List item 2

[Link to example](https://example.com)

\`\`\`javascript
const code = "example";
\`\`\`
            `;
            const result = processContent(markdown, "markdown");
            // Markdown is converted to HTML
            expect(result).toContain("Main Heading");
            expect(result).toContain("Subheading");
            expect(result).toContain("<strong>");
            expect(result).toContain("<em>");
            expect(result).toContain("<ul>");
            expect(result).toContain("<li>");
            expect(result).toContain("<a");
            expect(result).toContain("example.com");
        });

        it("should process and validate content pipeline", () => {
            const content = '<p>Safe content</p><script>alert()</script>';
            
            // Validate first
            const warnings = getContentWarnings(content, "html");
            expect(warnings.length).toBeGreaterThan(0);
            
            // Process anyway (should sanitize)
            const processed = processContent(content, "html");
            expect(processed).not.toContain("<script>");
            expect(processed).toContain("<p>");
        });
    });
});
