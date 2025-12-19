# FAQ Accordion Widget for Mendix

A secure, accessible accordion widget for creating FAQ pages in Mendix applications. Features rich text support with HTML sanitization, Markdown conversion, keyboard navigation, and comprehensive validation.

## Features

### � Data Source Flexibility

| Mode | Description | Use Case |
|------|-------------|----------|
| **Static Items** | Configure FAQ items directly in the widget | Small, fixed FAQ lists |
| **Database Entity** | Bind to a Mendix entity for dynamic content | Large, manageable FAQ content from database |

### �📝 Content Format Support

| Format | Description | Use Case |
|--------|-------------|----------|
| **HTML** | Raw HTML with sanitization | Full control over formatting, embedded media |
| **Markdown** | Markdown converted to HTML | Easy-to-write content with standard syntax |
| **Text** | Plain text with auto-escaping | Simple content without formatting |

### 🔒 Security Features

| Feature | Description |
|---------|-------------|
| **XSS Prevention** | DOMPurify sanitization removes malicious scripts |
| **Event Handler Blocking** | Removes `onclick`, `onload`, `onerror`, etc. |
| **Protocol Validation** | Blocks `javascript:` and `data:` URIs |
| **Script Tag Removal** | Strips `<script>` tags completely |
| **Safe Iframe** | Removes `<iframe>` elements |
| **Validation Warnings** | Preview shows warnings for dangerous content |

### 🔍 HTML Syntax Validation

| Validation | Description |
|------------|-------------|
| **Unclosed Quotes** | Detects missing closing quotes in attributes (e.g., `href="url`) |
| **Unclosed Tags** | Identifies tags missing closing counterparts (e.g., `<div>` without `</div>`) |
| **Mismatched Tags** | Catches incorrectly nested tags (e.g., `<div><span></div></span>`) |
| **Orphaned Closing Tags** | Detects closing tags without opening tags |
| **Malformed Attributes** | Identifies invalid attribute syntax |

#### Security Behavior Example

When you use `onclick="evil()"` in content:

| Stage | Behavior | Result |
|-------|----------|--------|
| **Preview** | ⚠️ Warning displayed | "Content contains event handlers (onclick, onload, etc.)" |
| **Compile** | ✅ No error | Widget builds successfully |
| **Runtime** | 🔒 Attribute removed | DOMPurify strips the attribute |

**This non-blocking approach** allows developers to catch security issues early without breaking builds.

### ♿ Accessibility

- ✅ **Keyboard Navigation**: Tab, Enter, Space keys for full keyboard control
- ✅ **ARIA Attributes**: `aria-expanded`, `role="button"` for screen readers
- ✅ **Focus Indicators**: Visual blue outline on focused items
- ✅ **Semantic HTML**: Native `<details>` and `<summary>` elements

### 🎨 User Experience

- ✅ **Show All / Hide All**: Toggle button to expand/collapse all items
- ✅ **Smooth Animations**: Configurable expand/collapse transitions
- ✅ **Responsive Design**: Mobile-friendly with touch support
- ✅ **Dark Mode**: Automatically adapts to system preferences

### 🔍 Validation & Testing

- ✅ **Real-time Validation**: Warnings in Studio Pro preview
- ✅ **Security Validation**: Detects scripts, event handlers, dangerous protocols
- ✅ **Syntax Validation**: Catches malformed HTML (unclosed quotes, tags, etc.)
- ✅ **Comprehensive Tests**: 73 unit tests with 96.55% code coverage
- ✅ **Safe Defaults**: Text format doesn't require validation
- ✅ **Robust Fallback**: Unrecognized formats default to HTML

## Test Coverage

**Test Suite Statistics:**
- **Total Tests**: 73 passing
- **Code Coverage**: 96.55%
- **Branches**: 85.41%
- **Functions**: 100%
- **Lines**: 96.52%

**Test Categories:**
- HTML Sanitization: 16 tests (tables, figures, videos, dangerous content)
- HTML Security Validation: 9 tests (scripts, event handlers, protocols, iframes)
- HTML Syntax Validation: 12 tests (unclosed quotes, tags, mismatched tags, orphaned tags)
- Markdown Processing: 8 tests (conversion, embedded HTML validation)
- Text Processing: 4 tests (escaping, line breaks)
- Content Processing: 7 tests (format routing, unrecognized format fallback)
- Content Warnings: 9 tests (validation across formats)
- Error Handling: 1 test (graceful degradation)
- Integration: 3 tests (end-to-end workflows)

## Installation

1. **Build the widget:**
   ```bash
   npm install
   npm run build
   ```

2. **Locate the MPK file:**
   - Find `FAQAccordion.mpk` in the `dist` folder

3. **Import into Mendix:**
   - Copy MPK to your Mendix project's `widgets` folder
   - Or use Mendix Studio Pro: Widgets → Import Widget

## Quick Start Guide

### Option 1: Static Items (Simple)

1. Add the **FAQ Accordion** widget to your page
2. Set **Data Source Type** to "Static Items"
3. Add FAQ items in the properties panel:
   - Summary: "What is Mendix?"
   - Content: "Mendix is a low-code platform..."
   - Content Format: HTML (or Markdown/Text)

### Option 2: Database Entity (Advanced)

1. **Create the Domain Model:**
   - Create entity: `FAQ`
   - Add attributes:
     - `Question` (String, 200)
     - `Answer` (String, unlimited)
     - `AnswerFormat` (String, 20) - **or** - (Enumeration: html, markdown, text)
     - `SortOrder` (Integer) - for custom ordering

2. **Create Sample Data:**
   - Use a microflow or page to create FAQ objects
   - Or import from CSV/Excel

3. **Configure the Widget:**
   - Add **FAQ Accordion** widget to page
   - Set **Data Source Type** to "Database Entity"
   - Set **FAQ Data Source**: 
     - Type: Database
     - Entity: FAQ
     - XPath: `[SortOrder != empty]` (with sorting)
     - Sorting: `SortOrder` ascending
   - Map attributes:
     - **Summary Attribute** → Question
     - **Content Attribute** → Answer
     - **Format Attribute** → AnswerFormat (optional)

4. **Done!** FAQ items now load from database

## Configuration

### Properties

#### Data Source

- **Data Source Type** (Required): Choose between Static Items or Database Entity
  - **Static Items**: Configure FAQ items directly in the widget
  - **Database Entity**: Bind to a Mendix entity for dynamic content

**Static Mode Properties:**

- **FAQ Items (Static)**: List of FAQ items (only used when Data Source Type is "Static Items")
  - **Summary** (Required): Question/title in accordion header
  - **Content** (Required): Answer/details content
  - **Content Format** (Required): Choose HTML, Markdown, or Text

**Database Mode Properties:**

- **FAQ Data Source (Database)**: Mendix entity containing FAQ items (only used when Data Source Type is "Database Entity")

  **Expected Entity Structure:**
  - Summary attribute: String or Text (required) - The question/title
  - Content attribute: String or Text (required) - The answer/details
  - Format attribute: **String or Enumeration** (optional) - Content format: "html", "markdown", or "text" (case-insensitive)

  **Example Entity "FAQ":**
  - Question (String) - mapped to Summary Attribute
  - Answer (Text) - mapped to Content Attribute
  - AnswerFormat (**String** or **Enumeration**: html/markdown/text) - mapped to Format Attribute
  
  💡 **Tip:** Format attribute is flexible:
  - Use **Enumeration** with keys: `html`, `markdown`, `text`
  - Or use **String** field with values: `"html"`, `"markdown"`, `"text"`
  - Values are case-insensitive
  - **Unrecognized values automatically default to HTML** for safety
  - If not mapped, all content defaults to HTML

- **Summary Attribute**: Attribute containing the FAQ question/summary
- **Content Attribute**: Attribute containing the FAQ answer/content  
- **Format Attribute** (Optional): String or Enumeration attribute for content format. If not specified, defaults to HTML.

#### General

- **Default Expand All**: Start with all items expanded (default: false)

- **Show Toggle Button**: Display expand all/collapse all button (default: true)

- **Toggle Button Text**: Custom toggle button label (optional)

#### Appearance

- **Animation Duration (ms)**: Expand/collapse animation speed (default: 300)

## Usage Examples

### Static Mode - Configured in Widget

Perfect for small, fixed FAQ lists:

1. **In Mendix Studio Pro:**
   - Set **Data Source Type** to "Static Items"
   - Add FAQ items directly in the widget properties
   - Configure Summary, Content, and Content Format for each item

### Database Mode - Dynamic Content

Perfect for large, manageable FAQ content:

1. **Create an Entity:**
   ```
   Entity: FAQ
   Attributes:
     - Question (String)
     - Answer (Text, unlimited)
     - AnswerFormat (Enumeration: html, markdown, text)
     - SortOrder (Integer) - optional for ordering
   ```

2. **Configure the Widget:**
   - Set **Data Source Type** to "Database Entity"
   - Set **FAQ Data Source** to retrieve your FAQ list (e.g., from database)
   - Map **Summary Attribute** to "Question"
   - Map **Content Attribute** to "Answer"
   - Map **Format Attribute** to "AnswerFormat" (optional)

3. **Benefits:**
   - Content can be edited by users through Mendix pages
   - Easy to add/remove/reorder FAQ items
   - Support for large FAQ collections
   - Content stored in database

### HTML Format

Perfect for rich content with full control:

```html
<p>This is a <strong>bold</strong> statement with <a href="https://example.com">a link</a>.</p>
<ul>
  <li>Feature 1</li>
  <li>Feature 2</li>
</ul>
<table>
  <tr>
    <th>Column 1</th>
    <th>Column 2</th>
  </tr>
  <tr>
    <td>Data 1</td>
    <td>Data 2</td>
  </tr>
</table>
```

**Allowed HTML Tags:**
`p`, `br`, `strong`, `b`, `em`, `i`, `u`, `a`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `h1`-`h6`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `figure`, `figcaption`, `img`, `video`, `source`, `span`, `div`

**Blocked Elements:**
`<script>`, `<iframe>`, event handlers (`onclick`, etc.), `javascript:` URIs

**Syntax Validation Examples:**

The widget will warn you about malformed HTML:

```html
<!-- ❌ Unclosed quote -->
<a href="https://example.com target="_blank">Link</a>
<!-- Warning: Unclosed attribute quote -->

<!-- ❌ Unclosed tag -->
<div><p>Content</div>
<!-- Warning: <p> is missing closing tag -->

<!-- ❌ Mismatched tags -->
<div><span>Text</div></span>
<!-- Warning: Mismatched tags -->

<!-- ✅ Correct -->
<a href="https://example.com" target="_blank">Link</a>
<div><p>Content</p></div>
```

### Markdown Format

Easy-to-write syntax automatically converted to HTML:

```markdown
## How do I get started?

Getting started is **easy**:

1. Install the widget
2. Add it to your page
3. Configure FAQ items

Visit our [documentation](https://example.com/docs) for more details.

### Features

- Markdown support
- Automatic HTML conversion
- Security validation
```

**Markdown Features:**
- Headings (`#`, `##`, etc.)
- Bold (`**text**`) and italic (`*text*`)
- Lists (ordered and unordered)
- Links (`[text](url)`)
- Code blocks (`` `code` ``)
- Tables (GFM syntax)

### Text Format

Plain text with automatic escaping:

```
What is Mendix?

Mendix is a low-code platform. HTML like <script> is automatically escaped.

Features:
- Simple
- Safe
- No formatting
```

**Text Format Behavior:**
- HTML characters escaped (`<` → `&lt;`)
- Line breaks converted to `<br>` tags
- No validation warnings
- Best for simple content

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Move focus to next/previous FAQ item |
| **Enter** | Expand/collapse focused item |
| **Space** | Expand/collapse focused item |
| **Shift+Tab** | Move focus backward |

## Development

### Scripts

```bash
npm start          # Development server
npm run dev        # Web development mode
npm run build      # Build for production
npm run release    # Release build (strips console logs)
npm run lint       # Lint code
npm run format     # Format code
npm test           # Run tests
npm test -- --coverage  # Run tests with coverage report
```

### Project Structure

```
accordion-mendix-widget/
├── src/
│   ├── FAQAccordion.tsx                   # Main React component
│   ├── FAQAccordion.xml                   # Widget configuration
│   ├── FAQAccordion.editorConfig.ts       # Studio Pro config
│   ├── FAQAccordion.editorPreview.tsx     # Preview component
│   ├── FAQAccordion.icon.svg              # Toolbox icon
│   ├── package.xml                        # Widget manifest
│   ├── ui/
│   │   └── FAQAccordion.scss              # Styles
│   └── utils/
│       ├── contentProcessor.ts            # Core processing logic
│       └── __tests__/
│           ├── contentProcessor.test.ts   # Unit tests
│           ├── setup.ts                   # Test setup
│           └── README.md                  # Test docs
├── package.json                           # Dependencies
├── jest.config.js                         # Jest config
├── babel.config.js                        # Babel config
└── README.md                              # This file
```

### Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test contentProcessor.test.ts

# Watch mode
npm test -- --watch
```

## Customization

### Styling

Override widget styles in your Mendix theme:

```scss
// Custom FAQ accordion styles
.faq-accordion-container {
  // Container styles
}

.faq-toggle-all-btn {
  background-color: #0070f3;
  color: white;
  
  &:hover {
    background-color: #0051cc;
  }
}

.faq-item {
  border-color: #e0e0e0;
}

.faq-item-summary {
  font-weight: 600;
  
  &:focus-visible {
    box-shadow: inset 0 0 0 2px #ff6b00; // Custom focus color
  }
}

.faq-item-content {
  padding: 1.5rem;
}
```

### Animation

Customize expand/collapse transitions:

```scss
.faq-item-content {
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.5s ease;
}
```

Or use the **Animation Duration** property in Studio Pro (milliseconds).

## Troubleshooting

### Widget not appearing in toolbox

**Solution**: Ensure these files exist:
- `src/FAQAccordion.editorConfig.ts`
- `src/FAQAccordion.editorPreview.tsx`
- `src/FAQAccordion.icon.svg`

### Sass deprecation warnings

**Issue**: `Deprecation Warning: Using / for division outside of calc()`

**Solution**: This is a known issue with Mendix tools. It's harmless and will be fixed in future Mendix releases. Your widget works correctly.

### Content validation warnings

**Issue**: Preview shows validation warnings like "Content contains dangerous elements" or "Unclosed attribute quote"

**Explanation**: The validation system has two types of warnings:

1. **Security Warnings**: Dangerous content (scripts, event handlers) that will be sanitized at runtime
2. **Syntax Warnings**: Malformed HTML (unclosed quotes, missing closing tags) that may not render correctly

**Action**: 
- **Security warnings**: Review the content, remove if unintentional, or proceed knowing it will be sanitized
- **Syntax warnings**: Fix the HTML syntax to ensure proper rendering (e.g., close quotes, balance tags)

**Common Syntax Issues:**
```html
<!-- Missing closing quote -->
<a href="url target="_blank">  ❌
<a href="url" target="_blank"> ✅

<!-- Unclosed tag -->
<div><p>Text</div>  ❌
<div><p>Text</p></div> ✅

<!-- Mismatched tags -->
<div><span>Text</div></span>  ❌
<div><span>Text</span></div> ✅
```

### Keyboard navigation not working

**Ensure**:
- Each FAQ item has `tabIndex={0}`
- Focus indicators are visible (`:focus-visible` styles)
- Browser allows keyboard navigation (not disabled globally)

### Markdown not rendering

**Check**:
- Content Format is set to "markdown"
- Markdown syntax is valid
- The `marked` package is installed: `npm install marked`

### Database mode not showing items

**Check**:
- Data Source Type is set to "Database Entity"
- FAQ Data Source is configured with a valid data source (e.g., microflow, database retrieve)
- Summary Attribute and Content Attribute are mapped correctly
- The entity has data (check in Studio Pro or at runtime)
- Format Attribute enum values match: "html", "markdown", or "text" (case-sensitive)

**Common Issues**:
- Format attribute can be String or Enumeration type
- If using String, values should be: "html", "markdown", or "text" (case-insensitive)
- If using Enumeration, keys should be: `html`, `markdown`, `text` (case-insensitive)
- **Unrecognized format values** (e.g., "pdf", "xml") will automatically default to HTML with a console warning
- If format attribute is not configured, it defaults to HTML
- Ensure data source is not filtered to return 0 results
- Check entity access rules if no data appears at runtime

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest |
| Firefox | Latest |
| Safari | Latest |
| Edge | Latest |
| iOS Safari | Latest |
| Chrome Mobile | Latest |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.2.0 | UI framework |
| `@mendix/pluggable-widgets-tools` | ^10.24.0 | Mendix widget tools |
| `dompurify` | ^3.3.1 | HTML sanitization |
| `marked` | ^17.0.1 | Markdown parser |
| `classnames` | ^2.5.1 | CSS class utilities |
| `jest` | 29.7.0 | Testing framework |

## License

Apache-2.0

## Author

Anthony Delorie

## Version History

### 1.0.0 - Initial Release

**Features:**
- FAQ accordion with expand/collapse
- **Dual data source modes**: Static items or Database entity
- HTML sanitization with DOMPurify
- Markdown to HTML conversion
- Plain text support with auto-escaping
- Show all / Hide all toggle
- Keyboard navigation (Tab, Enter, Space)
- ARIA attributes for accessibility
- Focus indicators
- Real-time validation in preview with sanitized preview
- Dark mode support
- Responsive design
- Smooth animations
- Comprehensive test suite (72 tests, 96.52% coverage)

**Data Source Options:**
- Static mode: Configure items directly in widget
- Database mode: Bind to Mendix entity for dynamic content
- Loading states for database mode
- Flexible attribute mapping

**Security:**
- XSS prevention with DOMPurify
- Script tag removal
- Event handler blocking
- Protocol validation
- Safe iframe handling

**HTML Validation:**
- Security validation: Detects dangerous content (scripts, event handlers)
- Syntax validation: Catches malformed HTML
  - Unclosed attribute quotes
  - Missing closing tags
  - Mismatched tags
  - Orphaned closing tags
  - Malformed attributes
- Preview shows sanitized output matching runtime behavior
