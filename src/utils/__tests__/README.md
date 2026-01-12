# Content Processor Tests

This directory contains unit tests for the FAQ Accordion widget's content processor utility.

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite covers:

### HTML Sanitization (`sanitizeHTML`)
- ✅ Safe HTML tags (p, strong, em, ul, ol, li, etc.)
- ✅ Enhanced table elements (caption, colgroup, col, thead, tbody, tfoot)
- ✅ Figure and figcaption elements
- ✅ Video and source elements
- ✅ Security: Removes script tags, event handlers, javascript: protocol
- ✅ Security: Removes iframe, object, and embed tags
- ✅ Proper use of `<p>` for text-only content
- ✅ Proper use of `<div>` for nested HTML structures

### HTML Validation (`validateHTML`)
- ✅ Detects dangerous content (scripts, event handlers, etc.)
- ✅ Allows safe protocols (https, mailto, etc.)
- ✅ Validates data: URLs (images allowed, others blocked)

### Content Format Processing
- ✅ HTML format processing
- ✅ Markdown to HTML conversion
- ✅ Plain text to HTML conversion with line breaks
- ✅ Unknown format handling

### Security Features
- ✅ XSS prevention
- ✅ Event handler blocking
- ✅ Protocol validation
- ✅ HTML escaping

## Test Structure

```
src/utils/__tests__/
├── contentProcessor.test.ts  # Main test suite (53 tests)
└── setup.ts                  # Jest test environment setup
```

## Coverage Report

Current coverage: **93.1%**
- Statements: 93.1%
- Branches: 100%
- Functions: 100%
- Lines: 93.1%

Uncovered lines are error fallback paths (lines 95-97, 167-168).

## Architecture Notes

### Sanitization Strategy
- **Headings removed**: No h1-h6 tags to avoid accessibility hierarchy issues in FAQ content
- **Rich media support**: Tables, images, figures, and video elements allowed
- **Nested content**: `<div>` for complex structures, `<p>` for simple text
- **Security first**: Multiple layers of validation and sanitization

### Format Support
1. **HTML**: Direct sanitization with DOMPurify
2. **Markdown**: Converted to HTML via marked.js, then sanitized
3. **Text**: Escaped and line breaks converted to `<br>`

## Adding New Tests

When adding new allowed tags or attributes to `contentProcessor.ts`, add corresponding tests:

```typescript
it("should allow new-element", () => {
    const html = '<new-element>content</new-element>';
    const result = sanitizeHTML(html);
    expect(result).toContain("<new-element>");
});
```

## Dependencies

- **Jest**: Test framework
- **ts-jest**: TypeScript support for Jest
- **jsdom**: DOM environment for Node.js
- **@babel/preset-env**: ES module transformation
