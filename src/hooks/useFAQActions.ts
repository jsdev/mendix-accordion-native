import { useCallback } from "react";
import { ListValue, ListAttributeValue, ActionValue, ObjectItem } from "mendix";
import Big from "big.js";
import { DragEndEvent } from "@dnd-kit/core";

import { ContentFormatEnum } from "../../typings/FAQAccordionProps";
import { FAQ_DEFAULT_ATTRIBUTES } from "../config/attributeConfig";
import {
    commitObject,
    deleteObject,
    createObject,
    swapSortOrders,
    getEntityName,
    getNextSortOrder
} from "../utils/mendixDataService";

interface UseEditState {
    editingItemIndex: number | null;
    deleteConfirmIndex: number | null;
    showCreateForm: boolean;
    finishEditing: () => void;
    cancelEditing: () => void;
    finishDeleting: () => void;
    cancelDelete: () => void;
    finishCreating: () => void;
    cancelCreating: () => void;
}

/**
 * Attribute overrides using ListAttributeValue for direct access
 */
interface AttributeOverrides {
    summaryAttribute?: ListAttributeValue<string>;
    contentAttribute?: ListAttributeValue<string>;
    contentFormatAttribute?: ListAttributeValue<string>;
    sortOrderAttributeOverride?: ListAttributeValue<Big>;
}

interface UseFAQActionsProps {
    dataSourceType: "static" | "database";
    dataSource?: ListValue;
    sortOrderAttribute?: ListAttributeValue<Big>;
    editState: UseEditState;
    onSaveAction?: ActionValue;
    onDeleteAction?: ActionValue;
    onCreateAction?: ActionValue;
    attributeOverrides?: AttributeOverrides;
}

interface UseFAQActionsResult {
    handleSaveEdit: (
        summary: string,
        content: string,
        format: ContentFormatEnum,
        sortOrder: number
    ) => Promise<void>;
    handleSaveNew: (
        summary: string,
        content: string,
        format: ContentFormatEnum,
        sortOrder: number
    ) => Promise<void>;
    handleConfirmDelete: () => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Custom hook to manage FAQ CRUD operations
 */
export function useFAQActions({
    dataSourceType,
    dataSource,
    sortOrderAttribute,
    editState,
    onSaveAction,
    onDeleteAction,
    onCreateAction,
    attributeOverrides
}: UseFAQActionsProps): UseFAQActionsResult {
    // Check if ALL attribute overrides are configured (all-or-nothing approach)
    const hasAllOverrides = !!(
        attributeOverrides?.summaryAttribute &&
        attributeOverrides?.contentAttribute &&
        attributeOverrides?.contentFormatAttribute &&
        attributeOverrides?.sortOrderAttributeOverride
    );

    /**
     * Set attribute values on an item using overrides (ListAttributeValue.get().setValue())
     * This is the proper Mendix Pluggable Widget API way to set values for EXISTING items
     */
    const setValuesViaOverrides = (
        item: ObjectItem,
        summary: string,
        content: string,
        format: ContentFormatEnum,
        sortOrder: Big
    ) => {
        const summaryEditable = attributeOverrides!.summaryAttribute!.get(item);
        const contentEditable = attributeOverrides!.contentAttribute!.get(item);
        const formatEditable = attributeOverrides!.contentFormatAttribute!.get(item);
        const sortOrderEditable = attributeOverrides!.sortOrderAttributeOverride!.get(item);

        console.log("FAQ Accordion: Setting values via ListAttributeValue overrides");
        summaryEditable.setValue(summary);
        contentEditable.setValue(content);
        formatEditable.setValue(format);
        sortOrderEditable.setValue(sortOrder);
    };

    /**
     * Set attribute values on an MxObject using default attribute names
     */
    const setValuesViaDefaults = (
        mxObj: any,
        summary: string,
        content: string,
        format: ContentFormatEnum,
        sortOrder: Big
    ) => {
        console.log("FAQ Accordion: Setting values via default attribute names");
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.SUMMARY, summary);
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.CONTENT, content);
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT, format);
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER, sortOrder);
    };

    /**
     * Get attribute names from override ListAttributeValues by inspecting an existing item.
     * The EditableValue.id contains the full attribute path like "MyModule.MyEntity/MyAttribute"
     * We extract just the attribute name from it.
     */
    const getOverrideAttributeNames = (referenceItem: ObjectItem) => {
        const extractName = (editable: any): string => {
            // The editable.id is typically in format "Module.Entity/AttributeName"
            const id = editable?.id || "";
            const parts = id.split("/");
            return parts.length > 1 ? parts[parts.length - 1] : id;
        };

        const summaryEditable = attributeOverrides!.summaryAttribute!.get(referenceItem);
        const contentEditable = attributeOverrides!.contentAttribute!.get(referenceItem);
        const formatEditable = attributeOverrides!.contentFormatAttribute!.get(referenceItem);
        const sortOrderEditable = attributeOverrides!.sortOrderAttributeOverride!.get(referenceItem);

        const names = {
            summary: extractName(summaryEditable),
            content: extractName(contentEditable),
            contentFormat: extractName(formatEditable),
            sortOrder: extractName(sortOrderEditable)
        };

        console.log("FAQ Accordion: Extracted override attribute names:", names);
        return names;
    };

    const handleSaveEdit = useCallback(
        async (
            summary: string,
            content: string,
            format: ContentFormatEnum,
            sortOrder: number
        ): Promise<void> => {
            if (
                editState.editingItemIndex === null ||
                !dataSource ||
                dataSourceType !== "database"
            ) {
                editState.cancelEditing();
                return;
            }

            const item = dataSource.items?.[editState.editingItemIndex];
            if (!item) {
                editState.cancelEditing();
                return;
            }

            // Option 1: Use custom action if configured
            if (onSaveAction && onSaveAction.canExecute) {
                onSaveAction.execute();
                editState.finishEditing();
                return;
            }

            // Option 2: Use overrides if configured (setValue via ListAttributeValue)
            if (hasAllOverrides) {
                try {
                    const sortValue = new Big(sortOrder);
                    setValuesViaOverrides(item, summary, content, format, sortValue);

                    // Fetch MxObject for commit
                    const mx = (window as any).mx;
                    mx.data.get({
                        guid: item.id,
                        callback: (mxObj: any) => {
                            commitObject(
                                mxObj,
                                dataSource,
                                "FAQ Accordion: Successfully saved FAQ item"
                            )
                                .then(() => {
                                    editState.finishEditing();
                                })
                                .catch((error: Error) => {
                                    console.error("FAQ Accordion: Failed to save:", error);
                                    editState.cancelEditing();
                                });
                        },
                        error: (error: Error) => {
                            console.error("FAQ Accordion: Failed to get object:", error);
                            editState.cancelEditing();
                        }
                    });
                } catch (error) {
                    console.error("FAQ Accordion: Failed to save with overrides:", error);
                    editState.cancelEditing();
                }
                return;
            }

            // Option 3: Fallback to built-in commit with default attribute names
            try {
                const mx = (window as any).mx;
                const guid = item.id;

                mx.data.get({
                    guid: guid,
                    callback: (mxObj: any) => {
                        const sortValue = new Big(sortOrder);
                        setValuesViaDefaults(mxObj, summary, content, format, sortValue);

                        commitObject(
                            mxObj,
                            dataSource,
                            "FAQ Accordion: Successfully saved FAQ item"
                        )
                            .then(() => {
                                editState.finishEditing();
                            })
                            .catch((error: Error) => {
                                console.error("FAQ Accordion: Failed to save:", error);
                                editState.cancelEditing();
                            });
                    },
                    error: (error: Error) => {
                        console.error("FAQ Accordion: Failed to get object:", error);
                        editState.cancelEditing();
                    }
                });
            } catch (error) {
                console.error("FAQ Accordion: Failed to commit:", error);
                editState.cancelEditing();
            }
        },
        [dataSource, dataSourceType, editState, onSaveAction, attributeOverrides]
    );

    const handleSaveNew = useCallback(
        async (
            summary: string,
            content: string,
            format: ContentFormatEnum,
            sortOrder: number
        ): Promise<void> => {
            if (!dataSource || dataSourceType !== "database") {
                editState.cancelCreating();
                return;
            }

            // Option 1: Use custom create action if configured
            if (onCreateAction && onCreateAction.canExecute) {
                onCreateAction.execute();
                editState.finishCreating();
                return;
            }

            // Option 2: Fallback to built-in create
            try {
                const entityName = await getEntityName(dataSource);

                if (!entityName) {
                    console.error("FAQ Accordion: Cannot create new item - entity name not found");
                    editState.cancelCreating();
                    return;
                }

                const newItem = await createObject(entityName);

                // Determine attribute names based on whether we're using overrides
                let attrNames: {
                    summary: string;
                    content: string;
                    contentFormat: string;
                    sortOrder: string;
                };

                if (hasAllOverrides && dataSource.items && dataSource.items.length > 0) {
                    // Use overrides - get names from existing item
                    attrNames = getOverrideAttributeNames(dataSource.items[0]);
                    console.log("FAQ Accordion: Using override attribute names for create:", attrNames);
                } else {
                    // Use defaults
                    attrNames = {
                        summary: FAQ_DEFAULT_ATTRIBUTES.SUMMARY,
                        content: FAQ_DEFAULT_ATTRIBUTES.CONTENT,
                        contentFormat: FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT,
                        sortOrder: FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER
                    };
                    console.log("FAQ Accordion: Using default attribute names for create:", attrNames);
                }

                newItem.set(attrNames.summary, summary);
                newItem.set(attrNames.content, content);
                newItem.set(attrNames.contentFormat, format);

                let sortOrderToUse = sortOrder;

                if (!Number.isFinite(sortOrderToUse)) {
                    if (sortOrderAttribute) {
                        const nextSortOrder = getNextSortOrder(
                            dataSource.items,
                            sortOrderAttribute
                        );
                        sortOrderToUse = Number(nextSortOrder.toString());
                    } else {
                        const currentCount = dataSource.items?.length || 0;
                        sortOrderToUse = (currentCount + 1) * 10;
                    }
                }

                const sortOrderValue = new Big(sortOrderToUse);
                newItem.set(attrNames.sortOrder, sortOrderValue);

                await commitObject(
                    newItem,
                    dataSource,
                    "FAQ Accordion: Successfully created new FAQ item"
                );
                editState.finishCreating();
            } catch (error) {
                console.error("FAQ Accordion: Failed to create new item:", error);
                editState.cancelCreating();
            }
        },
        [dataSource, dataSourceType, editState, onCreateAction, sortOrderAttribute, hasAllOverrides]
    );

    const handleConfirmDelete = useCallback((): void => {
        if (editState.deleteConfirmIndex === null || !dataSource || dataSourceType !== "database") {
            editState.cancelDelete();
            return;
        }

        const item = dataSource.items?.[editState.deleteConfirmIndex];
        if (!item) {
            editState.cancelDelete();
            return;
        }

        // Option 1: Use custom delete action if configured
        if (onDeleteAction && onDeleteAction.canExecute) {
            onDeleteAction.execute();
            editState.finishDeleting();
        }
        // Option 2: Fallback to built-in delete
        else {
            deleteObject(item, dataSource, "FAQ Accordion: Successfully deleted FAQ item")
                .then(() => {
                    editState.finishDeleting();
                })
                .catch((error) => {
                    console.error("FAQ Accordion: Failed to delete:", error);
                    editState.cancelDelete();
                });
        }
    }, [dataSource, dataSourceType, editState, onDeleteAction]);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (!over || active.id === over.id) {
                return;
            }

            if (!dataSource || dataSourceType !== "database" || !sortOrderAttribute) {
                console.warn(
                    "FAQ Accordion: Drag-drop requires database mode with sortOrderAttribute"
                );
                return;
            }

            const dsItems = dataSource.items || [];
            const oldIndex = dsItems.findIndex((item: ObjectItem) => item.id === active.id);
            const newIndex = dsItems.findIndex((item: ObjectItem) => item.id === over.id);

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
                return;
            }

            const draggedItem = dsItems[oldIndex];
            const targetItem = dsItems[newIndex];

            if (!draggedItem || !targetItem) {
                return;
            }

            const draggedOrder = sortOrderAttribute.get(draggedItem).value;
            const targetOrder = sortOrderAttribute.get(targetItem).value;

            swapSortOrders(
                draggedItem,
                targetItem,
                draggedOrder,
                targetOrder,
                dataSource,
                `FAQ Accordion: Successfully reordered item from position ${oldIndex + 1} to ${
                    newIndex + 1
                }`
            ).catch((error) => {
                console.error("FAQ Accordion: Failed to reorder item:", error);
            });
        },
        [dataSource, dataSourceType, sortOrderAttribute]
    );

    return {
        handleSaveEdit,
        handleSaveNew,
        handleConfirmDelete,
        handleDragEnd
    };
}
