# FAQ Accordion Widget - Editing Feature Implementation Plan

## Overview
Add CRUD (Create, Read, Update, Delete) and reordering capabilities to the FAQ Accordion widget with role-based access control.

---

## Architecture Design

### Component Structure
```
FAQAccordion (main container)
├── View Mode (default)
│   ├── FAQ items (read-only display)
│   └── Toggle All button
│
└── Edit Mode (when enabled + user has role)
    ├── Edit Mode Toggle Button
    ├── Add New FAQ Button
    ├── FAQ items with action buttons:
    │   ├── Edit Button → Opens EditFAQForm modal
    │   ├── Delete Button → Confirmation dialog
    │   └── Move Up/Down Buttons → Reorder
    │
    └── EditFAQForm Modal (overlay)
        ├── Summary input
        ├── Format dropdown (HTML/Markdown/Text)
        ├── Content textarea
        ├── Preview toggle
        ├── Validation warnings
        └── Save/Cancel buttons
```

### State Management
```typescript
// Edit mode state
const [editMode, setEditMode] = useState(false);
const [editingItem, setEditingItem] = useState<ObjectItem | null>(null);
const [showCreateForm, setShowCreateForm] = useState(false);
const [userHasRole, setUserHasRole] = useState(false);
```

---

## Implementation Checklist

## Phase 1: Component Creation & Structure
- [x] Create `EditFAQForm.tsx` component (DONE)
- [x] Create `editingUtils.ts` utility file (DONE)
- [ ] Create `FAQItemActions.tsx` component for edit/delete/move buttons
- [ ] Create `ConfirmDialog.tsx` component for delete confirmation
- [ ] Create `EditModeToggle.tsx` component for mode switching

## Phase 2: Main Component Integration
- [ ] Update `FAQAccordion.tsx` - Add editing state
  - [ ] Add `editMode` state (boolean)
  - [ ] Add `editingItem` state (ObjectItem | null)
  - [ ] Add `showCreateForm` state (boolean)
  - [ ] Add `userHasRole` state (boolean)
  - [ ] Add `useEffect` to check user role on mount

- [ ] Update `FAQAccordion.tsx` - Add role checking
  - [ ] Import `canEdit` from editingUtils
  - [ ] Check role on component mount
  - [ ] Only show edit UI if `canEdit() === true`

- [ ] Update `FAQAccordion.tsx` - Integrate components
  - [ ] Import `EditFAQForm` component
  - [ ] Import `FAQItemActions` component
  - [ ] Import `ConfirmDialog` component
  - [ ] Import `EditModeToggle` component

## Phase 3: CRUD Operations
- [ ] Implement Create (Add New FAQ)
  - [ ] Add "Add New FAQ" button (visible in edit mode)
  - [ ] Handle button click → `setShowCreateForm(true)`
  - [ ] Create `handleCreate` function
    - [ ] Call `onCreateAction` (returns new FAQ object)
    - [ ] Set summary, content, format attributes
    - [ ] Set sortOrder (max + 1)
    - [ ] Call `onSaveAction` to persist
    - [ ] Refresh data source
  - [ ] Handle form cancel → `setShowCreateForm(false)`

- [ ] Implement Update (Edit Existing)
  - [ ] Add "Edit" button per FAQ item (visible in edit mode)
  - [ ] Handle button click → `setEditingItem(item)`
  - [ ] Create `handleSave` function
    - [ ] Update summary, content, format attributes
    - [ ] Call `onSaveAction` with item
    - [ ] Refresh data source
  - [ ] Handle form cancel → `setEditingItem(null)`

- [ ] Implement Delete
  - [ ] Add "Delete" button per FAQ item (visible in edit mode)
  - [ ] Show confirmation dialog
  - [ ] Create `handleDelete` function
    - [ ] Call `onDeleteAction` with item
    - [ ] Refresh data source
  - [ ] Handle dialog cancel

## Phase 4: Reordering
- [ ] Add Move Up button (per FAQ item, visible in edit mode)
  - [ ] Disable on first item
  - [ ] Create `handleMoveUp` function
    - [ ] Get current sortOrder
    - [ ] Find previous item
    - [ ] Swap sortOrder values
    - [ ] Update both items via `onSaveAction`
    - [ ] Refresh data source

- [ ] Add Move Down button (per FAQ item, visible in edit mode)
  - [ ] Disable on last item
  - [ ] Create `handleMoveDown` function
    - [ ] Get current sortOrder
    - [ ] Find next item
    - [ ] Swap sortOrder values
    - [ ] Update both items via `onSaveAction`
    - [ ] Refresh data source

## Phase 5: UI/UX Polish
- [ ] Add Edit Mode Toggle Button
  - [ ] Position: Top right (next to "Show All" button)
  - [ ] Icon: ✏️ Edit / 👁️ View
  - [ ] Toggle between view and edit modes
  - [ ] Only visible when `allowEditing && userHasRole`

- [ ] Style FAQ Item Action Buttons
  - [ ] Edit button: Blue pencil icon
  - [ ] Delete button: Red trash icon
  - [ ] Move Up: Gray up arrow
  - [ ] Move Down: Gray down arrow
  - [ ] Group buttons on right side of summary
  - [ ] Hover effects and transitions

- [ ] Style EditFAQForm Modal
  - [ ] Full-screen overlay with semi-transparent background
  - [ ] Centered modal card (max-width: 800px)
  - [ ] Form field styling
  - [ ] Validation warning styling (orange/red)
  - [ ] Preview section styling
  - [ ] Button group styling (Cancel left, Save right)

- [ ] Style ConfirmDialog
  - [ ] Centered modal (max-width: 400px)
  - [ ] Warning icon and message
  - [ ] Button group (Cancel, Delete)

## Phase 6: SCSS Styling
- [ ] Add edit mode styles to `FAQAccordion.scss`
  - [ ] `.faq-edit-mode-toggle` - Toggle button styles
  - [ ] `.faq-add-button` - Add new FAQ button
  - [ ] `.faq-item-actions` - Action button container
  - [ ] `.faq-item-action-btn` - Individual action buttons
  - [ ] `.faq-modal-overlay` - Modal background overlay
  - [ ] `.faq-edit-form` - Form modal styles
  - [ ] `.faq-form-field` - Form field wrapper
  - [ ] `.faq-form-input` - Input field styles
  - [ ] `.faq-form-select` - Dropdown styles
  - [ ] `.faq-form-textarea` - Textarea styles
  - [ ] `.faq-form-warnings` - Validation warning box
  - [ ] `.faq-form-preview` - Preview section
  - [ ] `.faq-btn` - Button base styles
  - [ ] `.faq-btn-primary` - Primary button
  - [ ] `.faq-btn-secondary` - Secondary button
  - [ ] `.faq-btn-danger` - Delete button
  - [ ] `.faq-confirm-dialog` - Confirmation dialog
  - [ ] Dark mode variants for all above

## Phase 7: Preview Component Update
- [ ] Update `FAQAccordion.editorPreview.tsx`
  - [ ] Show placeholder when `allowEditing === true`
  - [ ] Display: "Edit mode enabled for role: {editorRole}"
  - [ ] Show mock edit buttons in preview
  - [ ] Add note: "Edit functionality available at runtime"

## Phase 8: Testing
- [ ] Manual Testing Checklist
  - [ ] View mode works without errors
  - [ ] Edit mode toggle works
  - [ ] Create new FAQ works
  - [ ] Edit existing FAQ works
  - [ ] Delete FAQ with confirmation works
  - [ ] Move up works (except first item)
  - [ ] Move down works (except last item)
  - [ ] Sort order persists correctly
  - [ ] Role check works (if implemented)
  - [ ] All 3 formats work (HTML, Markdown, Text)
  - [ ] Validation warnings appear correctly
  - [ ] Preview in edit form works
  - [ ] Cancel operations work without saving
  - [ ] Dark mode styling works

- [ ] Edge Cases Testing
  - [ ] Empty FAQ list
  - [ ] Single FAQ item (move buttons disabled)
  - [ ] No sortOrderAttribute configured
  - [ ] Missing action properties (onSave, onCreate, onDelete)
  - [ ] Invalid content format values
  - [ ] Very long summary/content
  - [ ] Special characters in content

## Phase 9: Documentation
- [ ] Update main README.md
  - [ ] Add "Editing Features" section
  - [ ] Document `allowEditing` property
  - [ ] Document `editorRole` property
  - [ ] Document action properties (onSave, onCreate, onDelete)
  - [ ] Document `sortOrderAttribute` requirement
  - [ ] Add example entity structure with SortOrder
  - [ ] Add microflow examples for CRUD operations

- [ ] Create example microflows documentation
  - [ ] Create FAQ microflow example
  - [ ] Save FAQ microflow example
  - [ ] Delete FAQ microflow example
  - [ ] Include validation logic examples

- [ ] Update troubleshooting section
  - [ ] Edit mode not showing → Check allowEditing + role
  - [ ] Reordering not working → Check sortOrderAttribute
  - [ ] Save not persisting → Check onSaveAction configured

## Phase 10: Build & Deploy
- [ ] Run full build: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Verify no TypeScript errors
- [ ] Verify no console errors in browser
- [ ] Test in actual Mendix project
- [ ] Create .mpk package
- [ ] Update version number
- [ ] Update CHANGELOG

---

## Technical Requirements

### Mendix Action Properties
```typescript
onCreateAction?: ActionValue;  // Returns new FAQ object
onSaveAction?: ActionValue;    // Receives FAQ object, persists changes
onDeleteAction?: ActionValue;  // Receives FAQ object, deletes it
```

### Expected Entity Structure (Database Mode)
```
Entity: FAQ
Attributes:
  - Question (String) - mapped to summaryAttribute
  - Answer (Text) - mapped to contentAttribute
  - AnswerFormat (String/Enum) - mapped to formatAttribute
  - SortOrder (Integer) - mapped to sortOrderAttribute ⭐ REQUIRED for reordering
```

### Role-Based Access
```typescript
allowEditing: boolean           // Enable edit mode
editorRole: string              // Required role (empty = all authenticated)
```

---

## File Structure After Implementation

```
src/
├── FAQAccordion.tsx                      # Main container (UPDATED)
├── FAQAccordion.xml                      # Widget config (UPDATED)
├── components/
│   ├── EditFAQForm.tsx                  # ✅ CREATED - Edit/Create form modal
│   ├── FAQItemActions.tsx               # 🔲 TODO - Edit/Delete/Move buttons
│   ├── ConfirmDialog.tsx                # 🔲 TODO - Delete confirmation
│   └── EditModeToggle.tsx               # 🔲 TODO - Mode switcher
├── utils/
│   ├── contentProcessor.ts              # Existing - No changes needed
│   └── editingUtils.ts                  # ✅ CREATED - Role check utilities
└── ui/
    └── FAQAccordion.scss                # UPDATED - Add edit mode styles
```

---

## Implementation Order

### Sprint 1: Foundation (Small Components)
1. Create `FAQItemActions.tsx`
2. Create `ConfirmDialog.tsx`
3. Create `EditModeToggle.tsx`
4. Add basic SCSS styles for these components

### Sprint 2: Integration (Main Component)
5. Update `FAQAccordion.tsx` with state management
6. Integrate all components
7. Add edit mode toggle logic

### Sprint 3: CRUD Operations
8. Implement Create (Add New)
9. Implement Update (Edit Existing)
10. Implement Delete (with confirmation)

### Sprint 4: Reordering
11. Implement Move Up
12. Implement Move Down
13. Test sort order persistence

### Sprint 5: Polish & Documentation
14. Complete SCSS styling
15. Update preview component
16. Write documentation
17. Test thoroughly
18. Build and deploy

---

## Success Criteria

✅ Edit mode can be toggled on/off
✅ Only users with required role see edit UI
✅ Can create new FAQ items
✅ Can edit existing FAQ items
✅ Can delete FAQ items (with confirmation)
✅ Can reorder FAQ items (move up/down)
✅ All changes persist to database
✅ Sort order is maintained correctly
✅ All 3 content formats work in edit mode
✅ Validation warnings appear in edit form
✅ Preview in edit form works correctly
✅ Dark mode fully supported
✅ No console errors
✅ Comprehensive documentation

---

## Notes

- 🔐 **Security**: Role checking is client-side only. Server-side validation in microflows is essential.
- 🔄 **Data Refresh**: After CRUD operations, the data source must be refreshed for changes to appear.
- 📦 **Actions Required**: Developers must configure `onCreateAction`, `onSaveAction`, and `onDeleteAction` in Studio Pro.
- 🔢 **Sort Order**: The `sortOrderAttribute` must be configured for reordering to work.
- 🎨 **Styling**: All edit UI components have dark mode support built-in.

---

**Next Step**: Begin Sprint 1 - Create small reusable components first.
