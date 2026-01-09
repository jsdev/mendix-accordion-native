# FAQ Accordion Widget - Attribute Configuration

## Overview

The FAQ Accordion widget uses a **convention-based approach** for attribute names. All attribute names are centralized in a single configuration file to follow best practices and avoid magic strings throughout the codebase.

## Configuration File

All attribute names are defined in:
```
src/config/attributeConfig.ts
```

## Required Entity Attributes

Your Mendix entity must have the following attributes (attribute names are case-sensitive):

| Attribute Name | Type | Description | Config Constant |
|----------------|------|-------------|-----------------|
| `summary` | String/Text | The question or title text | `FAQ_ATTRIBUTES.SUMMARY` |
| `content` | String/Text | The answer or detailed content | `FAQ_ATTRIBUTES.CONTENT` |
| `contentformat` | String/Enum | Format type: 'html', 'text', or 'markdown' | `FAQ_ATTRIBUTES.CONTENT_FORMAT` |
| `sortorder` | Integer/Long/Decimal | Numeric value for sorting items | `FAQ_ATTRIBUTES.SORT_ORDER` |

## Changing Attribute Names

If you need to use different attribute names in your Mendix domain model:

1. Open `src/config/attributeConfig.ts`
2. Update the values in the `FAQ_ATTRIBUTES` object:

```typescript
export const FAQ_ATTRIBUTES = {
    SUMMARY: "your_summary_field",
    CONTENT: "your_content_field",
    CONTENT_FORMAT: "your_format_field",
    SORT_ORDER: "your_order_field"
} as const;
```

3. Rebuild the widget: `npm run build`
4. Deploy the updated widget to your Mendix project

## Benefits of This Approach

✅ **Single Source of Truth**: Change attribute names in one place
✅ **Type Safety**: TypeScript constants prevent typos
✅ **No Magic Strings**: All attribute references use named constants
✅ **Easy Maintenance**: Clear documentation of expected attributes
✅ **Validation Ready**: Includes helper function to validate required attributes

## Validation

The configuration file includes a `validateRequiredAttributes()` function that can check if a Mendix object has all required attributes:

```typescript
import { validateRequiredAttributes } from './config/attributeConfig';

const result = validateRequiredAttributes(mxObj);
if (!result.isValid) {
    console.error('Missing attributes:', result.missingAttributes);
}
```

## Example Entity Setup in Mendix

In your Mendix domain model, create an entity (e.g., `FAQ`) with these attributes:

- **summary** (String, Unlimited length)
- **content** (String, Unlimited length)  
- **contentformat** (Enumeration with values: html, text, markdown)
- **sortorder** (Integer or Decimal)

Then configure the widget to use this entity as its data source.
