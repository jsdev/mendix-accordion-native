import { useCallback } from "react";
import { ListValue, ListAttributeValue, ActionValue, ObjectItem } from "mendix";
import Big from "big.js";
import { DragEndEvent } from "@dnd-kit/core";

import { ContentFormatEnum } from "../../typings/FAQAccordionProps";
import { FAQ_DEFAULT_ATTRIBUTES } from "../config/attributeConfig";
import { debugLog, debugWarn, debugError } from "../utils/debugLogger";
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
     * Set attribute values on an item using overrides.
     * Since setValue() is not supported on datasource-linked attributes,
     * we need to find the actual attribute names by matching values.
     */
    const findOverrideAttributeNames = (
        mxObj: any,
        item: ObjectItem
    ): { summary: string; content: string; contentFormat: string; sortOrder: string } | null => {
        // Get current values from overrides
        const summaryValue = attributeOverrides!.summaryAttribute!.get(item).value;
        const contentValue = attributeOverrides!.contentAttribute!.get(item).value;
        const formatValue = attributeOverrides!.contentFormatAttribute!.get(item).value;
        const sortOrderValue = attributeOverrides!.sortOrderAttributeOverride!.get(item).value;

        debugLog("Finding attribute names by matching values:");
        debugLog("  Override values:", { summaryValue, contentValue, formatValue, sortOrderValue: sortOrderValue?.toString() });

        // Get all attributes from the MxObject
        const allAttrs = mxObj.getAttributes?.() || [];
        debugLog("  MxObject attributes:", allAttrs);

        let summaryAttr = "";
        let contentAttr = "";
        let formatAttr = "";
        let sortOrderAttr = "";

        // Match by comparing values
        for (const attrName of allAttrs) {
            const attrValue = mxObj.get(attrName);
            
            if (attrValue === summaryValue && !summaryAttr) {
                summaryAttr = attrName;
                debugLog(`  Matched summary: ${attrName} = ${attrValue}`);
            } else if (attrValue === contentValue && !contentAttr) {
                contentAttr = attrName;
                debugLog(`  Matched content: ${attrName} = ${attrValue}`);
            } else if (attrValue === formatValue && !formatAttr) {
                formatAttr = attrName;
                debugLog(`  Matched format: ${attrName} = ${attrValue}`);
            } else if (sortOrderValue && attrValue?.toString?.() === sortOrderValue.toString() && !sortOrderAttr) {
                sortOrderAttr = attrName;
                debugLog(`  Matched sortOrder: ${attrName} = ${attrValue}`);
            }
        }

        if (summaryAttr && contentAttr && formatAttr && sortOrderAttr) {
            return {
                summary: summaryAttr,
                content: contentAttr,
                contentFormat: formatAttr,
                sortOrder: sortOrderAttr
            };
        }

        debugWarn("Could not match all attribute names:", {
            summaryAttr, contentAttr, formatAttr, sortOrderAttr
        });
        return null;
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
        debugLog("Setting values via default attribute names");
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.SUMMARY, summary);
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.CONTENT, content);
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT, format);
        mxObj.set(FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER, sortOrder);
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

            // Option 2: Use overrides - find attribute names by matching values, then use mx.data.set
            if (hasAllOverrides) {
                const mx = (window as any).mx;
                mx.data.get({
                    guid: item.id,
                    callback: (mxObj: any) => {
                        try {
                            // Find the actual attribute names by matching values
                            const attrNames = findOverrideAttributeNames(mxObj, item);

                            if (!attrNames) {
                                debugError("Could not determine attribute names from overrides");
                                editState.cancelEditing();
                                return;
                            }

                            debugLog("Setting values with override attribute names:", attrNames);

                            // Set values using discovered attribute names
                            mxObj.set(attrNames.summary, summary);
                            mxObj.set(attrNames.content, content);
                            mxObj.set(attrNames.contentFormat, format);
                            mxObj.set(attrNames.sortOrder, new Big(sortOrder));

                            commitObject(
                                mxObj,
                                dataSource
                            )
                                .then(() => {
                                    debugLog("Successfully saved FAQ item");
                                    editState.finishEditing();
                                })
                                .catch((error: Error) => {
                                    debugError("Failed to save:", error);
                                    editState.cancelEditing();
                                });
                        } catch (error) {
                            debugError("Failed to save with overrides:", error);
                            editState.cancelEditing();
                        }
                    },
                    error: (error: Error) => {
                        debugError("Failed to get object:", error);
                        editState.cancelEditing();
                    }
                });
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
                            dataSource
                        )
                            .then(() => {
                                debugLog("Successfully saved FAQ item");
                                editState.finishEditing();
                            })
                            .catch((error: Error) => {
                                debugError("Failed to save:", error);
                                editState.cancelEditing();
                            });
                    },
                    error: (error: Error) => {
                        debugError("Failed to get object:", error);
                        editState.cancelEditing();
                    }
                });
            } catch (error) {
                debugError("Failed to commit:", error);
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
                    debugError("Cannot create new item - entity name not found");
                    editState.cancelCreating();
                    return;
                }

                // Determine attribute names based on whether we're using overrides
                let attrNames: {
                    summary: string;
                    content: string;
                    contentFormat: string;
                    sortOrder: string;
                };

                if (hasAllOverrides && dataSource.items && dataSource.items.length > 0) {
                    // Use overrides - get names from existing item's MxObject
                    const referenceItem = dataSource.items[0];
                    const mx = (window as any).mx;

                    // We need to fetch the MxObject to find attribute names
                    const mxObjPromise = new Promise<any>((resolve, reject) => {
                        mx.data.get({
                            guid: referenceItem.id,
                            callback: resolve,
                            error: reject
                        });
                    });

                    const refMxObj = await mxObjPromise;
                    const foundNames = findOverrideAttributeNames(refMxObj, referenceItem);

                    if (!foundNames) {
                        debugError("Could not determine attribute names from overrides for create");
                        editState.cancelCreating();
                        return;
                    }

                    attrNames = foundNames;
                    debugLog("Using override attribute names for create:", attrNames);
                } else {
                    // Use defaults
                    attrNames = {
                        summary: FAQ_DEFAULT_ATTRIBUTES.SUMMARY,
                        content: FAQ_DEFAULT_ATTRIBUTES.CONTENT,
                        contentFormat: FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT,
                        sortOrder: FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER
                    };
                    debugLog("Using default attribute names for create:", attrNames);
                }

                const newItem = await createObject(entityName);

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
                    dataSource
                );
                debugLog("Successfully created new FAQ item");
                editState.finishCreating();
            } catch (error) {
                debugError("Failed to create new item:", error);
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
