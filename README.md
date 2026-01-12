# FAQ Accordion Widget for Mendix

A secure, accessible accordion widget for creating FAQ pages in Mendix applications. Features rich text support with HTML sanitization, Markdown conversion, keyboard navigation, drag-and-drop reordering, inline editing, and comprehensive validation.

## 🔧 Quick Start - Required Entity Attributes

When using **Database Mode**, your Mendix entity must have these attributes (case-sensitive by default):

- **Summary** (String/Text) - The question/title
- **Content** (String/Text) - The answer/detailed content  
- **ContentFormat** (String/Enum) - Format: 'html', 'text', or 'markdown'
- **SortOrder** (Integer/Long/Decimal) - Numeric sort order

> 💡 **Customizable Attributes**: Default attribute names can be overridden via widget properties. See [Optional Attribute Overrides](#optional-attribute-overrides) for details.

## Features

### ✏️ CRUD Editing (Database Mode Only)

| Feature | Description |
|---------|-------------|
| **Create** | Add new FAQ items with integrated form |
| **Read** | View FAQ items from database entity |
| **Update** | Edit existing FAQ items inline (replaces item during edit) |
| **Delete** | Remove FAQ items with confirmation dialog |
| **Drag-and-Drop Reorder** | Drag items by handle to reorder (auto-saves to database) |
| **Role-Based Access** | Restrict editing to specific user roles |
| **Edit Mode Toggle** | Switch between view and edit modes |

#### Editing Configuration

1. **Enable Editing**: Set `allowEditing` to `true` (only works in database mode)
2. **Set Editor Role** (optional): Specify role name (e.g., "Administrator", "Editor")
   - If empty: All authenticated users can edit
   - If set: Only users with specified role can edit
3. **Configure Actions**:
   - `onCreateAction`: Microflow to create new FAQ entity
   - `onSaveAction`: Microflow to save/update FAQ entity
   - `onDeleteAction`: Microflow to delete FAQ entity
4. **Set Sort Order Attribute**: Integer/Long/Decimal attribute for item ordering

#### Edit Mode UI Components

| Component | Description |
|-----------|-------------|
| **Edit Mode Toggle** | Button to switch between view and edit modes |
| **Create New Button** | Opens inline form to add new FAQ item (visible in edit mode) |
| **Edit Button** | Replaces item with inline edit form (per item, edit mode) |
| **Delete Button** | Opens confirmation dialog (per item, edit mode) |
| **Drag Handle** | Six-dot icon to drag and reorder items (edit mode) |

#### Drag-and-Drop Reordering

- Grab the drag handle (⋮⋮) on any item to reorder
- All items automatically collapse while dragging for better visibility
- Drop on target position to swap sort order values
- Changes are automatically saved to the database

### 📊 Data Source Flexibility

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
     - `SortOrder` (Integer, Long, or Decimal) - for custom ordering and reordering support

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

#### Attribute Overrides (All or Nothing)

By default, the widget expects attributes named `Summary`, `Content`, `ContentFormat`, and `SortOrder`. If your entity uses different attribute names, you can override them in the widget properties.

> ⚠️ **Important:** Attribute overrides follow an **all-or-nothing** approach. You must configure **ALL FOUR** overrides, or **NONE**. Partial configuration will show an error in Studio Pro.

| Property | Default | Description |
|----------|---------|-------------|
| **Summary Attribute** | Summary | Custom attribute for question/title |
| **Content Attribute** | Content | Custom attribute for answer/details |
| **Content Format Attribute** | ContentFormat | Custom attribute for format type |
| **Sort Order Attribute** | SortOrder | Custom attribute for ordering |

**Example:** If your entity has attributes named `Question`, `Answer`, `AnswerFormat`, and `DisplayOrder`:
1. Configure **all four** overrides in the widget properties
2. Map each override to the corresponding attribute in your entity

**Why all-or-nothing?** This ensures consistent behavior across reading, creating, editing, and reordering FAQ items. Mixing default and custom attribute names could lead to data inconsistencies.

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
   - Configure Summary, Content, and ContentFormat, SortOrder for each item

### Database Mode - Dynamic Content

Perfect for large, manageable FAQ content:

1. **Create an Entity:**
   ```
   Entity: FAQ
   Attributes:
     - Summary (String)
     - Content (Text, unlimited)
     - ContentFormat (Enumeration: html, markdown, text)
     - SortOrder (Integer, Long, or Decimal) - optional for ordering
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

### Enable CRUD Editing (Database Mode Only)

For editable FAQs with inline create/update/delete/reorder:

1. **Create an Entity with Sort Order:**
   ```
   Entity: FAQ
   Attributes:
     - Question (String)
     - Answer (Text, unlimited)
     - AnswerFormat (String or Enumeration: html, markdown, text)
     - SortOrder (Integer or Long or Decimal) - REQUIRED for reordering
     - CreatedDate (DateTime) - optional
     - ModifiedDate (DateTime) - optional
   ```

2. **Create Microflows for CRUD Operations (Optional - widget has built-in fallbacks):**

   **Create Microflow (onCreateAction) - Optional:**
   ```
   Name: ACT_FAQ_Create
   When to use: Only if you need custom default values or business logic
   
   Steps:
     1. Create new FAQ object  
     2. Set custom default values (e.g., CreatedBy, Category)
     3. Set default SortOrder (e.g., max(SortOrder) + 10)
     4. Commit FAQ object
     5. Return the new FAQ object
   
   Built-in fallback: Widget creates object using mx.data.create with basic defaults
   ```

   **Save/Update Microflow (onSaveAction) - Optional:**
   ```
   Name: ACT_FAQ_Save
   When to use: Only if you need custom validation or business logic
   
   Parameter: FAQ object
   Steps:
     1. Add custom validation logic (check permissions, validate content, etc.)
     2. Log the change or trigger workflows
     3. Commit FAQ object (with events)
     4. Refresh the data source (if needed)
   
   Built-in fallback: Widget commits changes using mx.data.commit
   ```

   **Delete Microflow (onDeleteAction) - Optional:**
   ```
   Name: ACT_FAQ_Delete
   When to use: Only if you need custom authorization or cascade deletes
   
   Parameter: FAQ object
   Steps:
     1. Check custom authorization rules
     2. Handle cascade deletes (related attachments, etc.)
     3. Delete FAQ object
     4. Log the deletion
   
   Built-in fallback: Widget deletes object using mx.data.remove
   ```

3. **Configure Widget Properties:**
   - Set **Data Source Type** to "Database Entity"
   - Configure data source and attribute mappings (as above)
   - **Map Sort Order Attribute** to "SortOrder" (required for reordering)
   - **Enable Editing**: Set `allowEditing` to `true`
   - **Set Editor Role** (optional): e.g., "Administrator" or "Editor"
     - Leave empty to allow all authenticated users to edit
   - **Set Actions** (all completely optional):
     - `onCreateAction` → ACT_FAQ_Create *(optional - widget creates automatically)*
     - `onSaveAction` → ACT_FAQ_Save *(optional - widget commits automatically)*
     - `onDeleteAction` → ACT_FAQ_Delete *(optional - widget deletes automatically)*

4. **Runtime Behavior:**
   - Edit mode toggle button appears in top right
   - In edit mode, each item shows: Drag handle, Edit button, Delete button
   - Clicking Edit replaces the item with an inline edit form
   - Create New button appears in edit mode (adds inline form at top)
   - Delete shows confirmation dialog
   - **Reordering:** Drag items by the handle (⋮⋮) to reorder - sort order values swap and auto-save to database
   - **Editing:** Widget automatically commits changes via mx.data.commit (custom action optional)
   - **Creating:** Widget automatically creates and commits new objects (custom action optional)
   - **Deleting:** Widget automatically removes objects via mx.data.remove (custom action optional)

5. **Security Notes:**
   - Role-based access control via `editorRole` property
   - Server-side validation should be implemented in microflows
   - Widget checks role client-side (informational only)
   - Always validate permissions in microflows for security

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
│   ├── FAQAccordion.tsx                   # Main widget component
│   ├── FAQAccordion.xml                   # Widget configuration
│   ├── FAQAccordion.editorConfig.ts       # Studio Pro config
│   ├── FAQAccordion.editorPreview.tsx     # Preview component
│   ├── FAQAccordion.icon.svg              # Toolbox icon
│   ├── package.xml                        # Widget manifest
│   ├── components/
│   │   ├── ConfirmDialog.tsx              # Delete confirmation dialog
│   │   ├── DraggableFAQItem.tsx           # Drag-and-drop FAQ item
│   │   ├── EditFAQForm.tsx                # Inline edit/create form
│   │   ├── EditModeToggle.tsx             # Edit mode toggle button
│   │   ├── FAQEditableList.tsx            # Edit mode item list with DnD
│   │   ├── FAQHeader.tsx                  # Widget header with controls
│   │   ├── FAQItemActions.tsx             # Edit/Delete action buttons
│   │   ├── FAQItemsList.tsx               # Read-only item list
│   │   └── FAQModals.tsx                  # Modal dialogs container
│   ├── config/
│   │   └── attributeConfig.ts             # Attribute name configuration
│   ├── hooks/
│   │   ├── useFAQActions.ts               # CRUD operation hooks
│   │   ├── useFAQData.ts                  # Data fetching hooks
│   │   └── useEditState.ts                # Edit state management
│   ├── ui/
│   │   └── FAQAccordion.scss              # Styles
│   └── utils/
│       ├── contentProcessor.ts            # Content processing logic
│       ├── editingUtils.ts                # Editing utility functions
│       ├── mendixDataService.ts           # Mendix data operations
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
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop core |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list utilities |
| `@dnd-kit/utilities` | ^3.2.2 | DnD utility functions |
| `dompurify` | ^3.3.1 | HTML sanitization |
| `marked` | ^17.0.1 | Markdown parser |
| `classnames` | ^2.5.1 | CSS class utilities |
| `big.js` | ^6.2.2 | Decimal precision for sort order |
| `jest` | 29.7.0 | Testing framework |

## License

Apache-2.0

## Author

Anthony Delorie

## Version History

### 1.1.0 - Edit Mode Enhancements

**New Features:**
- **Drag-and-Drop Reordering**: Replace Move Up/Down buttons with intuitive drag-and-drop
  - Drag handle (⋮⋮) on each item in edit mode
  - Items automatically collapse while dragging for better visibility
  - Sort order values swap and auto-save to database
- **Inline Editing**: Edit form now replaces the item inline instead of modal
  - Better context while editing
  - Cancel/Save buttons within the form
- **Configurable Attribute Overrides**: Override default attribute names via widget properties
  - Summary, Content, ContentFormat, SortOrder can all be customized
  - No longer need to match exact attribute naming convention

**Improvements:**
- Major code refactoring: Main component split into smaller, focused components
  - Extracted FAQHeader, FAQItemsList, FAQEditableList, FAQModals components
  - Created useFAQData, useFAQActions, useEditState custom hooks
  - Improved maintainability and testability
- Better UX during drag operations (auto-collapse)
- Cleaner edit mode interface

**Dependencies Added:**
- `@dnd-kit/core` - Drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list utilities
- `@dnd-kit/utilities` - DnD helper functions

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
