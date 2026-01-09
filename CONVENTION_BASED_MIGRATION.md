# Convention-Based Attributes Migration

## 🎯 Overview
The FAQ Accordion widget has been refactored to use **convention-based attribute names** instead of configurable attribute mapping. This significantly simplifies the codebase and eliminates complex attribute ID resolution issues.

## ⚠️ Breaking Changes

### Required Entity Attributes
Your FAQ entity **MUST** have these exact attribute names:

| Attribute Name | Type | Required | Description |
|---------------|------|----------|-------------|
| `Summary` | String/Text | ✅ Yes | The question or title |
| `Content` | String/Text | ✅ Yes | The answer or detailed content |
| `ContentFormat` | String/Enum | ✅ Yes | Format type: "html", "markdown", or "text" |
| `SortOrder` | Integer/Long/Decimal | ✅ Yes* | Numeric sort order (*required for Move Up/Down) |

### Migration Steps

1. **In Mendix Studio Pro:**
   - Open your domain model
   - Rename your FAQ entity attributes to match the conventions above

2. **Example Migration:**
   ```
   OLD ATTRIBUTES:          NEW ATTRIBUTES:
   Question         →       Summary
   Answer           →       Content
   AnswerFormat     →       ContentFormat
   Order            →       SortOrder
   ```

3. **Update Data Source View:**
   - Configure sorting: `SortOrder` ascending
   - This ensures items display in the correct order

4. **Widget Configuration:**
   - Remove old attribute mappings (they no longer exist in the widget)
   - Keep only:
     - Data Source (your FAQ entity)
     - Sort Order Attribute (select "SortOrder" for Move Up/Down functionality)

## 📋 What Changed

### Removed from Widget XML:
- ❌ `summaryAttribute` property
- ❌ `contentAttribute` property
- ❌ `formatAttribute` property

### Still Required:
- ✅ `dataSource` - Your FAQ entity
- ✅ `sortOrderAttribute` - Select "SortOrder" for reordering

### Code Changes:
- **Reading:** Widget now fetches MxObjects and reads `${entityName}.Summary`, `${entityName}.Content`, etc.
- **Writing:** Widget sets values using `mxObj.set("EntityName.Summary", value)`
- **No more:** Complex `getAttributeId()` resolution that was causing bugs

## ✨ Benefits

1. **Simpler Code:** Removed hundreds of lines of attribute mapping logic
2. **More Reliable:** Direct attribute names work consistently with Mendix APIs
3. **Easier to Debug:** Console logs show actual attribute names like "MyModule.FAQ.Summary"
4. **Clear Contract:** Users know exactly what attributes are required
5. **Better Performance:** No more attribute ID lookups and translations

## 🧪 Testing Checklist

After migration, verify:

- [ ] FAQ items display correctly
- [ ] Edit functionality saves changes and UI updates
- [ ] Move Up/Down reorders items correctly
- [ ] Create new items works
- [ ] Delete items works
- [ ] Console shows proper attribute names in logs

## 💡 Example Entity Definition

```xml
Entity: MyFirstModule.FAQ

Attributes:
  - Summary: String(200)
  - Content: String (unlimited)
  - ContentFormat: Enumeration
    Values: html, markdown, text
  - SortOrder: Integer
```

## 🔍 Console Debug Output

With the new approach, you'll see clear debug logs like:

```
handleSaveEdit - entity: MyFirstModule.FAQ
handleSaveEdit - setting: MyFirstModule.FAQ.Summary = What are your business hours?
handleSaveEdit - setting: MyFirstModule.FAQ.Content = We are open Monday-Friday...
handleSaveEdit - setting: MyFirstModule.FAQ.ContentFormat = html
handleSaveEdit - verifying Summary: What are your business hours?
```

Much clearer than the old:
```
handleSaveEdit - setting summary, attrId: attr_hka_5 value: What are...
handleSaveEdit - summary old value: null  ← BUG!
handleSaveEdit - summary new value: null  ← BUG!
```

## 🚀 Next Steps

1. Update your Mendix entity attribute names
2. Deploy the new widget build
3. Test all CRUD operations
4. Remove any custom workarounds you had for the old attribute mapping bugs
