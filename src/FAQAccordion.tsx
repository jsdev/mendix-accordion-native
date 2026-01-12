import { ReactElement, useState, useEffect, useMemo } from "react";
import { FAQAccordionContainerProps } from "../typings/FAQAccordionProps";
import "./ui/FAQAccordion.scss";
import { checkUserRole, canEdit } from "./utils/editingUtils";
import { setDebugMode } from "./utils/debugLogger";
import { useEditMode } from "./hooks/useEditMode";
import { useFAQData } from "./hooks/useFAQData";
import { useFAQActions } from "./hooks/useFAQActions";
import { FAQHeader } from "./components/FAQHeader";
import { FAQItemsList } from "./components/FAQItemsList";
import { FAQEditableList } from "./components/FAQEditableList";
import { FAQModals } from "./components/FAQModals";

export function FAQAccordion(props: FAQAccordionContainerProps): ReactElement {
    const {
        dataSourceType,
        faqItems,
        dataSource,
        defaultExpandAll,
        showToggleButton,
        toggleButtonText,
        animationDuration,
        allowEditing,
        editorRole,
        onSaveAction,
        onDeleteAction,
        onCreateAction,
        sortOrderAttribute,
        debugMode,
        // Attribute overrides (optional)
        summaryAttribute,
        contentAttribute,
        contentFormatAttribute,
        sortOrderAttributeOverride
    } = props;

    // Initialize debug mode
    useEffect(() => {
        setDebugMode(debugMode);
    }, [debugMode]);

    // Attribute overrides for useFAQData and useFAQActions (pass the ListAttributeValue objects directly)
    const attributeOverrides = useMemo(
        () => ({
            summaryAttribute,
            contentAttribute,
            contentFormatAttribute,
            sortOrderAttributeOverride
        }),
        [summaryAttribute, contentAttribute, contentFormatAttribute, sortOrderAttributeOverride]
    );

    // Data fetching and state
    const { items, isLoading, defaultSortOrder, sortableIds } = useFAQData({
        dataSourceType,
        dataSource,
        faqItems,
        sortOrderAttribute,
        attributeOverrides
    });

    // Editing state
    const editState = useEditMode();
    const [userHasRole, setUserHasRole] = useState(false);

    // CRUD actions
    const { handleSaveEdit, handleSaveNew, handleConfirmDelete, handleDragEnd } = useFAQActions({
        dataSourceType,
        dataSource,
        sortOrderAttribute,
        editState,
        onSaveAction,
        onDeleteAction,
        onCreateAction,
        attributeOverrides
    });

    // State to track which items are expanded
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [allExpanded, setAllExpanded] = useState(defaultExpandAll);

    // Calculate editing sort order for the edit form
    const editingSortOrder = useMemo(() => {
        if (editState.editingItemIndex === null) {
            return undefined;
        }

        const sortOrderFromItems = items[editState.editingItemIndex]?.sortOrder;
        if (sortOrderFromItems !== undefined) {
            return sortOrderFromItems;
        }

        if (
            dataSourceType === "database" &&
            dataSource &&
            sortOrderAttribute &&
            dataSource.items?.[editState.editingItemIndex]
        ) {
            try {
                const raw = sortOrderAttribute.get(
                    dataSource.items[editState.editingItemIndex]
                ).value;
                return raw ? Number(raw.toString()) : undefined;
            } catch (err) {
                console.warn("FAQ Accordion: Failed to read sort order for edit form", err);
            }
        }

        return undefined;
    }, [dataSource, dataSourceType, editState.editingItemIndex, items, sortOrderAttribute]);

    // Check if user has required role
    useEffect(() => {
        const checkRole = async () => {
            if (allowEditing && editorRole) {
                const hasRole = await checkUserRole(editorRole);
                setUserHasRole(hasRole);
            } else if (allowEditing && !editorRole) {
                setUserHasRole(true);
            } else {
                setUserHasRole(false);
            }
        };

        checkRole();
    }, [allowEditing, editorRole]);

    // Initialize expanded state based on defaultExpandAll
    useEffect(() => {
        if (defaultExpandAll) {
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
        }
    }, [defaultExpandAll, items]);

    // Toggle individual item
    const toggleItem = (index: number): void => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Toggle all items
    const toggleAll = (): void => {
        if (allExpanded) {
            setExpandedItems(new Set());
            setAllExpanded(false);
        } else {
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
            setAllExpanded(true);
        }
    };

    // Update allExpanded state based on individual toggles
    useEffect(() => {
        if (items) {
            const allAreExpanded = items.length > 0 && expandedItems.size === items.length;
            setAllExpanded(allAreExpanded);
        }
    }, [expandedItems, items]);

    // Determine if editing is enabled
    const isEditingEnabled = canEdit(allowEditing, dataSourceType, userHasRole);

    // Event handlers
    const handleCancelEdit = (): void => {
        if (editState.editingItemIndex !== null) {
            editState.cancelEditing();
        }
        if (editState.showCreateForm) {
            editState.cancelCreating();
        }
    };

    // Show loading state for database mode
    if (isLoading) {
        return (
            <div className="faq-accordion-loading">
                <p>Loading FAQ items...</p>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="faq-accordion-empty">
                <p>No FAQ items configured</p>
            </div>
        );
    }

    return (
        <div className="faq-accordion-container">
            <FAQHeader
                showToggleButton={showToggleButton}
                allExpanded={allExpanded}
                toggleButtonText={toggleButtonText?.value}
                onToggleAll={toggleAll}
                isEditingEnabled={isEditingEnabled}
                editMode={editState.editMode}
                onToggleEditMode={editState.toggleEditMode}
                onCreateNew={editState.startCreating}
            />

            {editState.editMode && isEditingEnabled ? (
                <FAQEditableList
                    items={items}
                    sortableIds={sortableIds}
                    expandedItems={expandedItems}
                    animationDuration={animationDuration || 300}
                    onEditItem={editState.startEditingItem}
                    onDeleteItem={editState.startDeleting}
                    onDragEnd={handleDragEnd}
                    editingItemIndex={editState.editingItemIndex}
                    editingSortOrder={editingSortOrder}
                    defaultSortOrder={defaultSortOrder}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    showCreateForm={editState.showCreateForm}
                    onSaveNew={handleSaveNew}
                    onCancelCreate={handleCancelEdit}
                />
            ) : (
                <FAQItemsList
                    items={items}
                    expandedItems={expandedItems}
                    animationDuration={animationDuration || 300}
                    onToggleItem={toggleItem}
                />
            )}

            <FAQModals
                deleteConfirmIndex={editState.deleteConfirmIndex}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={editState.cancelDelete}
            />
        </div>
    );
}
