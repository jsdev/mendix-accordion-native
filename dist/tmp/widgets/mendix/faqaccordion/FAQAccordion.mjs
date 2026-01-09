import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef, createContext, memo, useReducer, useContext } from 'react';
import Big from 'big.js';
import { unstable_batchedUpdates, createPortal } from 'react-dom';

/**
 * Utility functions for editing mode and role-based access control
 */
/**
 * Checks if the current user has the required role for editing
 * @param requiredRole - The role name required (empty string = all authenticated users)
 * @returns Promise<boolean> - True if user has access
 */
async function checkUserRole(requiredRole) {
    // If no role specified, allow all authenticated users
    if (!requiredRole || requiredRole.trim() === "") {
        return true;
    }
    try {
        // Use Mendix Client API to check user roles
        // Note: In actual Mendix runtime, you'd use mx.session or similar
        // This is a placeholder - Mendix widgets typically use server-side validation
        // For now, we'll return true and rely on microflow validation
        console.log(`Checking role: ${requiredRole}`);
        return true;
    }
    catch (error) {
        console.error("Error checking user role:", error);
        return false;
    }
}
/**
 * Validates if editing is allowed based on configuration
 * @param allowEditing - Whether editing is enabled
 * @param dataSourceType - Type of data source
 * @param hasRole - Whether user has required role
 * @returns boolean - True if editing should be allowed
 */
function canEdit(allowEditing, dataSourceType, hasRole) {
    // Editing only works with database mode
    if (dataSourceType !== "database") {
        return false;
    }
    // Editing must be enabled
    if (!allowEditing) {
        return false;
    }
    // User must have required role
    return hasRole;
}

/**
 * Custom hook for managing edit mode state in FAQ Accordion
 * Centralizes all edit-related state and actions
 */
/**
 * Hook for managing FAQ edit mode state
 * @returns Object containing edit state and actions
 */
function useEditMode() {
    const [editMode, setEditMode] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
    // Toggle between edit and view mode
    const toggleEditMode = () => {
        setEditMode(!editMode);
        setEditingItemIndex(null);
        setShowCreateForm(false);
    };
    // Start editing a specific item
    const startEditingItem = (index) => {
        setEditingItemIndex(index);
        setShowCreateForm(false);
    };
    // Cancel editing current item
    const cancelEditing = () => {
        setEditingItemIndex(null);
    };
    // Finish editing current item (after successful save)
    const finishEditing = () => {
        setEditingItemIndex(null);
    };
    // Start creating a new item
    const startCreating = () => {
        setShowCreateForm(true);
        setEditingItemIndex(null);
    };
    // Cancel creating new item
    const cancelCreating = () => {
        setShowCreateForm(false);
    };
    // Finish creating new item (after successful save)
    const finishCreating = () => {
        setShowCreateForm(false);
    };
    // Start delete confirmation for an item
    const startDeleting = (index) => {
        setDeleteConfirmIndex(index);
    };
    // Confirm and proceed with deletion
    const confirmDelete = () => {
        // Return the index for caller to handle, then clear
        // Caller should call finishDeleting() after deletion succeeds
    };
    // Cancel deletion
    const cancelDelete = () => {
        setDeleteConfirmIndex(null);
    };
    // Finish deletion (after successful delete)
    const finishDeleting = () => {
        setDeleteConfirmIndex(null);
    };
    return {
        // State
        editMode,
        editingItemIndex,
        showCreateForm,
        deleteConfirmIndex,
        // Actions
        toggleEditMode,
        startEditingItem,
        cancelEditing,
        startCreating,
        cancelCreating,
        startDeleting,
        confirmDelete,
        cancelDelete,
        finishEditing,
        finishCreating,
        finishDeleting
    };
}

/**
 * FAQ Accordion Attribute Configuration
 *
 * This file defines the convention-based attribute names that the widget expects
 * on the Mendix entity. These defaults can be overridden via widget properties.
 *
 * IMPORTANT: These attribute names must match exactly with your Mendix domain model.
 * The names are case-sensitive and should not include the entity name prefix.
 */
/**
 * Default attribute names used when no overrides are configured
 */
const FAQ_DEFAULT_ATTRIBUTES = {
    /**
     * The question/title text (String/Text attribute)
     */
    SUMMARY: "Summary",
    /**
     * The answer/detailed content (String/Text attribute)
     */
    CONTENT: "Content",
    /**
     * The format of the content - 'html', 'text', or 'markdown' (String/Enum attribute)
     */
    CONTENT_FORMAT: "ContentFormat",
    /**
     * The sort order for positioning items (Integer/Long/Decimal attribute)
     */
    SORT_ORDER: "SortOrder"
};
/**
 * Legacy export for backward compatibility
 * @deprecated Use getFAQAttributes() with overrides instead
 */
const FAQ_ATTRIBUTES = FAQ_DEFAULT_ATTRIBUTES;

/**
 * Gets the Mendix mx global object safely
 */
function getMx() {
    if (typeof window !== "undefined" && window.mx) {
        return window.mx;
    }
    if (typeof global !== "undefined" && global.window?.mx) {
        return global.window.mx;
    }
    return null;
}
/**
 * Gets the full MxObject from an ObjectItem
 * ObjectItem from datasource only has 'id', we need to fetch the full object
 * @param obj - ObjectItem from datasource
 * @returns Promise that resolves with the full MxObject
 */
function getMxObject(obj) {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }
        const guid = getObjectGuid(obj);
        mx.data.get({
            guid: guid,
            callback: (mxObj) => {
                resolve(mxObj);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}
/**
 * Gets the entity name from a Mendix object
 * @param mxObj - Mendix object
 * @returns Entity name (e.g., "MyFirstModule.FAQ")
 */
function getEntityNameFromObject(mxObj) {
    if (mxObj.getEntity && typeof mxObj.getEntity === "function") {
        return mxObj.getEntity();
    }
    if (mxObj.entity) {
        return mxObj.entity;
    }
    throw new Error("Could not determine entity name from object");
}
/**
 * Gets the GUID from a Mendix object, handling both methods
 * @param obj - Mendix object item
 * @returns GUID string
 */
function getObjectGuid(obj) {
    // Try the getGuid() method first
    if (obj.getGuid && typeof obj.getGuid === "function") {
        const guid = obj.getGuid();
        if (guid)
            return guid;
    }
    // Fallback to guid property
    if (obj.guid) {
        return obj.guid;
    }
    // Fallback to id property (from ObjectItem interface)
    if (obj.id) {
        return obj.id;
    }
    throw new Error("Could not extract GUID from object");
}
/**
 * Reloads a data source if the reload method is available
 * @param dataSource - Mendix data source to reload
 */
function reloadDataSource(dataSource) {
    if (dataSource && typeof dataSource.reload === "function") {
        dataSource.reload();
    }
}
/**
 * Gets the entity name from a data source
 * For ListValue datasources, we get the entity from the first item's MxObject
 * @param dataSource - Mendix data source
 * @returns Promise that resolves with entity name or null if not found
 */
async function getEntityName(dataSource) {
    console.log("getEntityName - dataSource:", dataSource);
    console.log("getEntityName - dataSource keys:", Object.keys(dataSource || {}));
    // Try to get entity from datasource metadata (legacy approach)
    if (dataSource?._entity) {
        console.log("getEntityName - found _entity:", dataSource._entity);
        return dataSource._entity;
    }
    if (dataSource?.entity) {
        console.log("getEntityName - found entity:", dataSource.entity);
        return dataSource.entity;
    }
    // For ListValue datasources, get entity from the first item's MxObject
    if (dataSource?.items && dataSource.items.length > 0) {
        try {
            const firstItem = dataSource.items[0];
            console.log("getEntityName - fetching first item MxObject...");
            // Fetch the full MxObject to get entity name
            const mxObj = await getMxObject(firstItem);
            const entityName = getEntityNameFromObject(mxObj);
            console.log("getEntityName - from MxObject:", entityName);
            return entityName;
        }
        catch (error) {
            console.error("getEntityName - failed to get MxObject:", error);
        }
    }
    console.log("getEntityName - not found, returning null");
    return null;
}
/**
 * Calculates the next sort order value for a new item
 * @param items - Array of existing items
 * @param sortOrderAttribute - Sort order attribute accessor
 * @returns Next sort order value (max + 10)
 */
function getNextSortOrder(items, sortOrderAttribute) {
    const maxSortOrder = items?.reduce((max, item) => {
        const sortOrder = sortOrderAttribute.get(item).value;
        return sortOrder && sortOrder.toNumber() > max ? sortOrder.toNumber() : max;
    }, 0) || 0;
    return new Big(maxSortOrder + 10);
}
/**
 * Commits a Mendix object to the database
 * @param obj - MxObject to commit (full object, not just ObjectItem)
 * @param dataSource - Optional data source to reload after commit
 * @param successMessage - Optional success log message
 * @returns Promise that resolves when commit succeeds
 */
function commitObject(obj, dataSource, successMessage) {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }
        console.log("commitObject - committing object:", obj.getEntity?.());
        mx.data.commit({
            mxobj: obj,
            callback: () => {
                if (successMessage) {
                    console.log(successMessage);
                }
                if (dataSource) {
                    reloadDataSource(dataSource);
                }
                resolve();
            },
            error: (error) => {
                console.error("FAQ Accordion: Failed to commit object:", error);
                reject(error);
            }
        });
    });
}
/**
 * Deletes a Mendix object from the database
 * @param obj - Object to delete
 * @param dataSource - Optional data source to reload after deletion
 * @param successMessage - Optional success log message
 * @returns Promise that resolves when deletion succeeds
 */
function deleteObject(obj, dataSource, successMessage) {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }
        let guid;
        try {
            guid = getObjectGuid(obj);
            if (!guid || typeof guid !== "string") {
                throw new Error(`Invalid GUID: ${guid}`);
            }
        }
        catch (error) {
            console.error("FAQ Accordion: Failed to get object GUID:", error);
            reject(error);
            return;
        }
        mx.data.remove({
            guids: [guid],
            callback: () => {
                if (successMessage) {
                    console.log(successMessage);
                }
                if (dataSource) {
                    reloadDataSource(dataSource);
                }
                resolve();
            },
            error: (error) => {
                console.error("FAQ Accordion: Failed to delete object:", error);
                reject(error);
            }
        });
    });
}
/**
 * Creates a new Mendix object
 * @param entityName - Entity name to create
 * @param successMessage - Optional success log message
 * @returns Promise that resolves with the created MxObject
 */
function createObject(entityName, successMessage) {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }
        mx.data.create({
            entity: entityName,
            callback: (obj) => {
                if (successMessage) {
                    console.log(successMessage);
                }
                resolve(obj);
            },
            error: (error) => {
                console.error("FAQ Accordion: Failed to create object:", error);
                reject(error);
            }
        });
    });
}
/**
 * Swaps the sort order values between two items and commits both
 * Uses convention-based attribute name "SortOrder"
 * @param item1 - First item
 * @param item2 - Second item
 * @param order1 - Current sort order of item1
 * @param order2 - Current sort order of item2
 * @param dataSource - Optional data source to reload after swap
 * @param successMessage - Optional success log message
 * @returns Promise that resolves when both commits succeed
 */
async function swapSortOrders(item1, item2, orderOrAttribute, order2OrDataSource, dataSource, successMessage) {
    const mx = getMx();
    if (!mx || !mx.data) {
        throw new Error("Mendix Client API (mx.data) not available");
    }
    let order1;
    let order2;
    let resolvedDataSource = dataSource;
    let resolvedSuccessMessage = successMessage;
    // Backward compatibility: allow passing sortOrderAttribute as third argument
    if (orderOrAttribute && typeof orderOrAttribute.get === "function") {
        const sortOrderAttribute = orderOrAttribute;
        const value1 = sortOrderAttribute.get(item1).value;
        const value2 = sortOrderAttribute.get(item2).value;
        if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
            throw new Error("Sort order values are missing");
        }
        order1 = new Big(value1.toString());
        order2 = new Big(value2.toString());
        resolvedDataSource = order2OrDataSource;
        resolvedSuccessMessage = dataSource;
    }
    else if (order2OrDataSource) {
        // Preferred signature: explicit order1 and order2 values
        order1 = orderOrAttribute;
        order2 = order2OrDataSource;
    }
    else {
        throw new Error("swapSortOrders requires sort order values or attribute accessor");
    }
    console.log("swapSortOrders - START");
    console.log("swapSortOrders - order1:", order1.toString(), "order2:", order2.toString());
    // Get the full MxObjects
    const mxObj1 = await getMxObject(item1);
    const mxObj2 = await getMxObject(item2);
    console.log("swapSortOrders - Got MxObjects");
    console.log("swapSortOrders - item1 entity:", mxObj1.getEntity?.());
    console.log("swapSortOrders - item2 entity:", mxObj2.getEntity?.());
    console.log("swapSortOrders - item1 current value:", mxObj1.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString());
    console.log("swapSortOrders - item2 current value:", mxObj2.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString());
    // Swap the values
    console.log("swapSortOrders - Setting new values...");
    mxObj1.set(FAQ_ATTRIBUTES.SORT_ORDER, order2);
    mxObj2.set(FAQ_ATTRIBUTES.SORT_ORDER, order1);
    console.log("swapSortOrders - item1 new value:", mxObj1.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString());
    console.log("swapSortOrders - item2 new value:", mxObj2.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString());
    // Commit both objects
    return new Promise((resolve, reject) => {
        console.log("swapSortOrders - Starting commit of first object...");
        mx.data.commit({
            mxobj: mxObj1,
            callback: () => {
                console.log("swapSortOrders - committed mxObj1 ✓");
                console.log("swapSortOrders - Starting commit of second object...");
                mx.data.commit({
                    mxobj: mxObj2,
                    callback: () => {
                        console.log("swapSortOrders - committed mxObj2 ✓");
                        if (resolvedSuccessMessage) {
                            console.log(resolvedSuccessMessage);
                        }
                        if (resolvedDataSource) {
                            console.log("swapSortOrders - Reloading datasource...");
                            reloadDataSource(resolvedDataSource);
                        }
                        console.log("swapSortOrders - COMPLETE ✓");
                        resolve();
                    },
                    error: (error) => {
                        console.error("FAQ Accordion: Failed to commit second item:", error);
                        console.error("swapSortOrders - Error details:", error.message, error.stack);
                        reject(error);
                    }
                });
            },
            error: (error) => {
                console.error("FAQ Accordion: Failed to commit first item:", error);
                console.error("swapSortOrders - Error details:", error.message, error.stack);
                reject(error);
            }
        });
    });
}

/**
 * Normalizes content format value to valid format or defaults to HTML
 */
function normalizeContentFormat(format) {
    if (!format) {
        return "html";
    }
    const normalized = format.toLowerCase().trim();
    if (normalized === "html" || normalized === "markdown" || normalized === "text") {
        return normalized;
    }
    console.warn(`FAQ Accordion: Unrecognized content format "${format}", defaulting to HTML`);
    return "html";
}
/**
 * Custom hook to manage FAQ data fetching and state
 */
function useFAQData({ dataSourceType, dataSource, faqItems, sortOrderAttribute, attributeOverrides }) {
    const [databaseItems, setDatabaseItems] = useState([]);
    // Check if ALL attribute overrides are configured (all-or-nothing approach)
    const hasAllOverrides = !!(attributeOverrides?.summaryAttribute &&
        attributeOverrides?.contentAttribute &&
        attributeOverrides?.contentFormatAttribute &&
        attributeOverrides?.sortOrderAttributeOverride);
    // Check if ANY overrides are configured (for warning detection)
    const hasAnyOverrides = !!(attributeOverrides?.summaryAttribute ||
        attributeOverrides?.contentAttribute ||
        attributeOverrides?.contentFormatAttribute ||
        attributeOverrides?.sortOrderAttributeOverride);
    // Fetch FAQ items from database
    useEffect(() => {
        if (dataSourceType === "database" && dataSource && dataSource.status === "available") {
            console.log("FAQ Accordion: ✨ REFETCHING items from datasource");
            console.log("FAQ Accordion: Item count:", dataSource.items?.length);
            console.log("FAQ Accordion: All overrides configured:", hasAllOverrides);
            if (!dataSource.items || dataSource.items.length === 0) {
                console.log("FAQ Accordion: No items to fetch");
                setDatabaseItems([]);
                return;
            }
            // If ALL overrides are configured, use ListAttributeValue.get() directly
            if (hasAllOverrides) {
                console.log("FAQ Accordion: Using attribute overrides via ListAttributeValue.get()");
                const items = dataSource.items.map((item) => {
                    const summary = attributeOverrides.summaryAttribute.get(item)?.value || "Question";
                    const content = attributeOverrides.contentAttribute.get(item)?.value || "";
                    const formatValue = attributeOverrides.contentFormatAttribute.get(item)?.value;
                    const format = normalizeContentFormat(formatValue);
                    const rawSortOrder = attributeOverrides.sortOrderAttributeOverride.get(item)?.value;
                    let sortOrder;
                    if (rawSortOrder) {
                        sortOrder = Number(rawSortOrder.toString());
                        if (isNaN(sortOrder))
                            sortOrder = undefined;
                    }
                    return { summary, content, contentFormat: format, sortOrder };
                });
                console.log("FAQ Accordion: Items loaded via overrides:", items.length);
                setDatabaseItems(items);
                return;
            }
            // Warn if partial overrides configured
            if (hasAnyOverrides && !hasAllOverrides) {
                console.warn("FAQ Accordion: Partial overrides detected! You must configure ALL four attribute overrides or NONE. Falling back to defaults.");
            }
            // Use mx.data.get with convention-based attribute names (defaults)
            const fetchItems = async () => {
                const mx = window.mx;
                if (!mx) {
                    console.log("FAQ Accordion: mx not available");
                    setDatabaseItems([]);
                    return;
                }
                try {
                    console.log("FAQ Accordion: Using default attribute names via mx.data.get()");
                    const items = await Promise.all(dataSource.items.map(async (item) => {
                        return new Promise((resolve) => {
                            mx.data.get({
                                guid: item.id,
                                callback: (mxObj) => {
                                    const summary = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.SUMMARY) || "Question";
                                    const content = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.CONTENT) || "";
                                    const formatValue = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.CONTENT_FORMAT);
                                    const format = normalizeContentFormat(formatValue);
                                    const rawSortOrder = mxObj.get(FAQ_DEFAULT_ATTRIBUTES.SORT_ORDER);
                                    let sortOrder;
                                    if (rawSortOrder !== undefined && rawSortOrder !== null) {
                                        try {
                                            sortOrder = Number(rawSortOrder.toString());
                                            if (isNaN(sortOrder))
                                                sortOrder = undefined;
                                        }
                                        catch {
                                            sortOrder = undefined;
                                        }
                                    }
                                    resolve({ summary, content, contentFormat: format, sortOrder });
                                },
                                error: (error) => {
                                    console.error("FAQ Accordion: Failed to fetch item:", error);
                                    resolve({
                                        summary: "Error loading question",
                                        content: "",
                                        contentFormat: "text",
                                        sortOrder: undefined
                                    });
                                }
                            });
                        });
                    }));
                    console.log("FAQ Accordion: Items loaded via mx.data.get:", items.length);
                    setDatabaseItems(items);
                }
                catch (error) {
                    console.error("FAQ Accordion: Failed to fetch FAQ items:", error);
                    setDatabaseItems([]);
                }
            };
            fetchItems();
        }
    }, [dataSourceType, dataSource, dataSource?.status, dataSource?.items, hasAllOverrides, hasAnyOverrides, attributeOverrides, sortOrderAttribute]);
    // Get FAQ items from either static configuration or database
    const items = useMemo(() => {
        if (dataSourceType === "database") {
            return databaseItems;
        }
        else {
            return (faqItems?.map((item, index) => ({
                summary: item.summary?.value || "Question",
                content: item.content?.value || "",
                contentFormat: normalizeContentFormat(item.contentFormat),
                sortOrder: (index + 1) * 10
            })) || []);
        }
    }, [dataSourceType, databaseItems, faqItems]);
    // Calculate default sort order for new items
    const defaultSortOrder = useMemo(() => {
        if (dataSourceType === "database") {
            if (sortOrderAttribute && dataSource?.items && dataSource.items.length > 0) {
                const next = getNextSortOrder(dataSource.items, sortOrderAttribute);
                return Number(next.toString());
            }
            const currentCount = dataSource?.items?.length || 0;
            return (currentCount + 1) * 10;
        }
        return (items.length + 1) * 10;
    }, [dataSourceType, dataSource?.items, sortOrderAttribute, items.length]);
    // Set sort order on datasource when using database mode with sort order attribute
    useEffect(() => {
        if (dataSourceType === "database" && dataSource && sortOrderAttribute) {
            if (dataSource.setSortOrder && sortOrderAttribute.id) {
                dataSource.setSortOrder([[sortOrderAttribute.id, "asc"]]);
            }
        }
    }, [dataSourceType, dataSource, sortOrderAttribute]);
    // Generate unique IDs for sortable items
    const sortableIds = useMemo(() => {
        if (dataSourceType === "database" && dataSource?.items) {
            return dataSource.items.map((item) => item.id);
        }
        return items.map((_, index) => `static-${index}`);
    }, [dataSourceType, dataSource?.items, items]);
    const isLoading = dataSourceType === "database" && dataSource && dataSource.status === "loading";
    return {
        items,
        isLoading: !!isLoading,
        defaultSortOrder,
        sortableIds
    };
}

/**
 * Custom hook to manage FAQ CRUD operations
 */
function useFAQActions({ dataSourceType, dataSource, sortOrderAttribute, editState, onSaveAction, onDeleteAction, onCreateAction, attributeOverrides }) {
    // Check if ALL attribute overrides are configured (all-or-nothing approach)
    const hasAllOverrides = !!(attributeOverrides?.summaryAttribute &&
        attributeOverrides?.contentAttribute &&
        attributeOverrides?.contentFormatAttribute &&
        attributeOverrides?.sortOrderAttributeOverride);
    /**
     * Set attribute values on an item using overrides (ListAttributeValue.get().setValue())
     * This is the proper Mendix Pluggable Widget API way to set values for EXISTING items
     */
    const setValuesViaOverrides = (item, summary, content, format, sortOrder) => {
        const summaryEditable = attributeOverrides.summaryAttribute.get(item);
        const contentEditable = attributeOverrides.contentAttribute.get(item);
        const formatEditable = attributeOverrides.contentFormatAttribute.get(item);
        const sortOrderEditable = attributeOverrides.sortOrderAttributeOverride.get(item);
        console.log("FAQ Accordion: Setting values via ListAttributeValue overrides");
        summaryEditable.setValue(summary);
        contentEditable.setValue(content);
        formatEditable.setValue(format);
        sortOrderEditable.setValue(sortOrder);
    };
    /**
     * Set attribute values on an MxObject using default attribute names
     */
    const setValuesViaDefaults = (mxObj, summary, content, format, sortOrder) => {
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
    const getOverrideAttributeNames = (referenceItem) => {
        const extractName = (editable) => {
            // The editable.id is typically in format "Module.Entity/AttributeName"
            const id = editable?.id || "";
            const parts = id.split("/");
            return parts.length > 1 ? parts[parts.length - 1] : id;
        };
        const summaryEditable = attributeOverrides.summaryAttribute.get(referenceItem);
        const contentEditable = attributeOverrides.contentAttribute.get(referenceItem);
        const formatEditable = attributeOverrides.contentFormatAttribute.get(referenceItem);
        const sortOrderEditable = attributeOverrides.sortOrderAttributeOverride.get(referenceItem);
        const names = {
            summary: extractName(summaryEditable),
            content: extractName(contentEditable),
            contentFormat: extractName(formatEditable),
            sortOrder: extractName(sortOrderEditable)
        };
        console.log("FAQ Accordion: Extracted override attribute names:", names);
        return names;
    };
    const handleSaveEdit = useCallback(async (summary, content, format, sortOrder) => {
        if (editState.editingItemIndex === null ||
            !dataSource ||
            dataSourceType !== "database") {
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
                const mx = window.mx;
                mx.data.get({
                    guid: item.id,
                    callback: (mxObj) => {
                        commitObject(mxObj, dataSource, "FAQ Accordion: Successfully saved FAQ item")
                            .then(() => {
                            editState.finishEditing();
                        })
                            .catch((error) => {
                            console.error("FAQ Accordion: Failed to save:", error);
                            editState.cancelEditing();
                        });
                    },
                    error: (error) => {
                        console.error("FAQ Accordion: Failed to get object:", error);
                        editState.cancelEditing();
                    }
                });
            }
            catch (error) {
                console.error("FAQ Accordion: Failed to save with overrides:", error);
                editState.cancelEditing();
            }
            return;
        }
        // Option 3: Fallback to built-in commit with default attribute names
        try {
            const mx = window.mx;
            const guid = item.id;
            mx.data.get({
                guid: guid,
                callback: (mxObj) => {
                    const sortValue = new Big(sortOrder);
                    setValuesViaDefaults(mxObj, summary, content, format, sortValue);
                    commitObject(mxObj, dataSource, "FAQ Accordion: Successfully saved FAQ item")
                        .then(() => {
                        editState.finishEditing();
                    })
                        .catch((error) => {
                        console.error("FAQ Accordion: Failed to save:", error);
                        editState.cancelEditing();
                    });
                },
                error: (error) => {
                    console.error("FAQ Accordion: Failed to get object:", error);
                    editState.cancelEditing();
                }
            });
        }
        catch (error) {
            console.error("FAQ Accordion: Failed to commit:", error);
            editState.cancelEditing();
        }
    }, [dataSource, dataSourceType, editState, onSaveAction, attributeOverrides]);
    const handleSaveNew = useCallback(async (summary, content, format, sortOrder) => {
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
            let attrNames;
            if (hasAllOverrides && dataSource.items && dataSource.items.length > 0) {
                // Use overrides - get names from existing item
                attrNames = getOverrideAttributeNames(dataSource.items[0]);
                console.log("FAQ Accordion: Using override attribute names for create:", attrNames);
            }
            else {
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
                    const nextSortOrder = getNextSortOrder(dataSource.items, sortOrderAttribute);
                    sortOrderToUse = Number(nextSortOrder.toString());
                }
                else {
                    const currentCount = dataSource.items?.length || 0;
                    sortOrderToUse = (currentCount + 1) * 10;
                }
            }
            const sortOrderValue = new Big(sortOrderToUse);
            newItem.set(attrNames.sortOrder, sortOrderValue);
            await commitObject(newItem, dataSource, "FAQ Accordion: Successfully created new FAQ item");
            editState.finishCreating();
        }
        catch (error) {
            console.error("FAQ Accordion: Failed to create new item:", error);
            editState.cancelCreating();
        }
    }, [dataSource, dataSourceType, editState, onCreateAction, sortOrderAttribute, hasAllOverrides]);
    const handleConfirmDelete = useCallback(() => {
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
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        if (!dataSource || dataSourceType !== "database" || !sortOrderAttribute) {
            console.warn("FAQ Accordion: Drag-drop requires database mode with sortOrderAttribute");
            return;
        }
        const dsItems = dataSource.items || [];
        const oldIndex = dsItems.findIndex((item) => item.id === active.id);
        const newIndex = dsItems.findIndex((item) => item.id === over.id);
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
        swapSortOrders(draggedItem, targetItem, draggedOrder, targetOrder, dataSource, `FAQ Accordion: Successfully reordered item from position ${oldIndex + 1} to ${newIndex + 1}`).catch((error) => {
            console.error("FAQ Accordion: Failed to reorder item:", error);
        });
    }, [dataSource, dataSourceType, sortOrderAttribute]);
    return {
        handleSaveEdit,
        handleSaveNew,
        handleConfirmDelete,
        handleDragEnd
    };
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var classnames = {exports: {}};

/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/

var hasRequiredClassnames;

function requireClassnames () {
	if (hasRequiredClassnames) return classnames.exports;
	hasRequiredClassnames = 1;
	(function (module) {
		/* global define */

		(function () {

		  var hasOwn = {}.hasOwnProperty;
		  function classNames() {
		    var classes = '';
		    for (var i = 0; i < arguments.length; i++) {
		      var arg = arguments[i];
		      if (arg) {
		        classes = appendClass(classes, parseValue(arg));
		      }
		    }
		    return classes;
		  }
		  function parseValue(arg) {
		    if (typeof arg === 'string' || typeof arg === 'number') {
		      return arg;
		    }
		    if (typeof arg !== 'object') {
		      return '';
		    }
		    if (Array.isArray(arg)) {
		      return classNames.apply(null, arg);
		    }
		    if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
		      return arg.toString();
		    }
		    var classes = '';
		    for (var key in arg) {
		      if (hasOwn.call(arg, key) && arg[key]) {
		        classes = appendClass(classes, key);
		      }
		    }
		    return classes;
		  }
		  function appendClass(value, newClass) {
		    if (!newClass) {
		      return value;
		    }
		    if (value) {
		      return value + ' ' + newClass;
		    }
		    return value + newClass;
		  }
		  if (module.exports) {
		    classNames.default = classNames;
		    module.exports = classNames;
		  } else {
		    window.classNames = classNames;
		  }
		})(); 
	} (classnames));
	return classnames.exports;
}

var classnamesExports = requireClassnames();
var classNames = /*@__PURE__*/getDefaultExportFromCjs(classnamesExports);

/**
 * Toggle button for switching between view and edit modes
 */
function EditModeToggle(props) {
    const { editMode, onToggle, disabled = false } = props;
    return (jsx("button", { type: "button", className: classNames("faq-edit-mode-toggle", {
            "faq-edit-mode-active": editMode
        }), onClick: onToggle, disabled: disabled, "aria-label": editMode ? "Switch to view mode" : "Switch to edit mode", title: editMode ? "View Mode" : "Edit Mode", children: editMode ? (jsxs(Fragment, { children: [jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [jsx("path", { d: "M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" }), jsx("path", { d: "M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" })] }), jsx("span", { children: "View" })] })) : (jsxs(Fragment, { children: [jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsx("path", { d: "M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" }) }), jsx("span", { children: "Edit" })] })) }));
}

/**
 * Header component with toggle all button and edit mode controls
 */
function FAQHeader({ showToggleButton, allExpanded, toggleButtonText, onToggleAll, isEditingEnabled, editMode, onToggleEditMode, onCreateNew }) {
    if (!showToggleButton && !isEditingEnabled) {
        return null;
    }
    const getToggleButtonText = () => {
        if (toggleButtonText) {
            return toggleButtonText;
        }
        return allExpanded ? "Hide All" : "Show All";
    };
    return (jsxs("div", { className: "faq-accordion-header", children: [showToggleButton && (jsx("button", { className: classNames("faq-toggle-all-btn", {
                    "faq-toggle-all-btn--expanded": allExpanded
                }), onClick: onToggleAll, type: "button", children: getToggleButtonText() })), isEditingEnabled && (jsxs("div", { className: "faq-editing-controls", children: [editMode && (jsxs("button", { type: "button", className: "faq-create-new-btn", onClick: onCreateNew, "aria-label": "Create new FAQ item", children: [jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsx("path", { d: "M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" }) }), "Create New"] })), jsx(EditModeToggle, { editMode: editMode, onToggle: onToggleEditMode })] }))] }));
}

/*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE */

const {
  entries,
  setPrototypeOf,
  isFrozen,
  getPrototypeOf,
  getOwnPropertyDescriptor
} = Object;
let {
  freeze,
  seal,
  create
} = Object; // eslint-disable-line import/no-mutable-exports
let {
  apply,
  construct
} = typeof Reflect !== 'undefined' && Reflect;
if (!freeze) {
  freeze = function freeze(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
/**
 * Creates a new function that calls the given function with a specified thisArg and arguments.
 *
 * @param func - The function to be wrapped and called.
 * @returns A new function that calls the given function with a specified thisArg and arguments.
 */
function unapply(func) {
  return function (thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
/**
 * Creates a new function that constructs an instance of the given constructor function with the provided arguments.
 *
 * @param func - The constructor function to be wrapped and called.
 * @returns A new function that constructs an instance of the given constructor function with the provided arguments.
 */
function unconstruct(Func) {
  return function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
/**
 * Add properties to a lookup table
 *
 * @param set - The set to which elements will be added.
 * @param array - The array containing elements to be added to the set.
 * @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
 * @returns The modified set with added elements.
 */
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    // Make 'in' and truthy checks like Boolean(set.constructor)
    // independent of any properties defined on Object.prototype.
    // Prevent prototype setters from intercepting set as a this value.
    setPrototypeOf(set, null);
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === 'string') {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        // Config presets (e.g. tags.js, attrs.js) are immutable.
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
/**
 * Clean up an array to harden against CSPP
 *
 * @param array - The array to be cleaned.
 * @returns The cleaned version of the array
 */
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
/**
 * Shallow clone an object
 *
 * @param object - The object to be cloned.
 * @returns A new object that copies the original.
 */
function clone(object) {
  const newObject = create(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
/**
 * This method automatically checks if the prop is function or getter and behaves accordingly.
 *
 * @param object - The object to look up the getter function in its prototype chain.
 * @param prop - The property name for which to find the getter function.
 * @returns The getter function found in the prototype chain or a fallback function.
 */
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === 'function') {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
const html$1 = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);
const svg$1 = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'enterkeyhint', 'exportparts', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'inputmode', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'part', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);
const svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);
// List of SVG elements that are disallowed by default.
// We still need to know them so that we can do namespace
// checks properly in case one wants to add them to
// allow-list.
const svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);
const mathMl$1 = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'mprescripts']);
// Similarly to SVG, we want to know all MathML elements,
// even those that we disallow by default.
const mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);
const text = freeze(['#text']);
const html = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'exportparts', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inert', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'nonce', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'part', 'pattern', 'placeholder', 'playsinline', 'popover', 'popovertarget', 'popovertargetaction', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'slot', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'wrap', 'xmlns', 'slot']);
const svg = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'amplitude', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'exponent', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'intercept', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'mask-type', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'slope', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'tablevalues', 'targetx', 'targety', 'transform', 'transform-origin', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);
const mathMl = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);
const xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

// eslint-disable-next-line unicorn/better-regex
const MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
const ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
const TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm); // eslint-disable-line unicorn/better-regex
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/); // eslint-disable-line no-useless-escape
const ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ARIA_ATTR: ARIA_ATTR,
  ATTR_WHITESPACE: ATTR_WHITESPACE,
  CUSTOM_ELEMENT: CUSTOM_ELEMENT,
  DATA_ATTR: DATA_ATTR,
  DOCTYPE_NAME: DOCTYPE_NAME,
  ERB_EXPR: ERB_EXPR,
  IS_ALLOWED_URI: IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR: MUSTACHE_EXPR,
  TMPLIT_EXPR: TMPLIT_EXPR
});

/* eslint-disable @typescript-eslint/indent */
// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
const NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12 // Deprecated
};
const getGlobal = function getGlobal() {
  return typeof window === 'undefined' ? null : window;
};
/**
 * Creates a no-op policy for internal use only.
 * Don't export this function outside this module!
 * @param trustedTypes The policy factory.
 * @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
 * @return The policy created (or null, if Trusted Types
 * are not supported or creating the policy failed).
 */
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
    return null;
  }
  // Allow the callers to control the unique policy name
  // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
  // Policy creation with duplicate names throws in Trusted Types.
  let suffix = null;
  const ATTR_NAME = 'data-tt-policy-suffix';
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = 'dompurify' + (suffix ? '#' + suffix : '');
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html) {
        return html;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    // Policy creation failed (most likely another DOMPurify script has
    // already run). Skip creating the policy, as this will only cause errors
    // if TT are enforced.
    console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
    return null;
  }
};
const _createHooksMap = function _createHooksMap() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();
  const DOMPurify = root => createDOMPurify(root);
  DOMPurify.version = '3.3.1';
  DOMPurify.removed = [];
  if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
    // Not running in a browser, provide a factory function
    // so that you can pass your own Window
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let {
    document
  } = window;
  const originalDocument = document;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node,
    Element,
    NodeFilter,
    NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser,
    trustedTypes
  } = window;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
  const remove = lookupGetter(ElementPrototype, 'remove');
  const getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
  const getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
  const getParentNode = lookupGetter(ElementPrototype, 'parentNode');
  // As per issue #47, the web-components registry is inherited by a
  // new document created via createHTMLDocument. As per the spec
  // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
  // a new empty registry is used when creating a template contents owner
  // document, so we use that as our parent document to ensure nothing
  // is inherited.
  if (typeof HTMLTemplateElement === 'function') {
    const template = document.createElement('template');
    if (template.content && template.content.ownerDocument) {
      document = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = '';
  const {
    implementation,
    createNodeIterator,
    createDocumentFragment,
    getElementsByTagName
  } = document;
  const {
    importNode
  } = originalDocument;
  let hooks = _createHooksMap();
  /**
   * Expose whether this browser supports running the full DOMPurify.
   */
  DOMPurify.isSupported = typeof entries === 'function' && typeof getParentNode === 'function' && implementation && implementation.createHTMLDocument !== undefined;
  const {
    MUSTACHE_EXPR,
    ERB_EXPR,
    TMPLIT_EXPR,
    DATA_ATTR,
    ARIA_ATTR,
    IS_SCRIPT_OR_DATA,
    ATTR_WHITESPACE,
    CUSTOM_ELEMENT
  } = EXPRESSIONS;
  let {
    IS_ALLOWED_URI: IS_ALLOWED_URI$1
  } = EXPRESSIONS;
  /**
   * We consider the elements and attributes below to be safe. Ideally
   * don't add any new ones but feel free to remove unwanted ones.
   */
  /* allowed element names */
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  /* Allowed attribute names */
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  /*
   * Configure how DOMPurify should handle custom elements and their attributes as well as customized built-in elements.
   * @property {RegExp|Function|null} tagNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any custom elements)
   * @property {RegExp|Function|null} attributeNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any attributes not on the allow list)
   * @property {boolean} allowCustomizedBuiltInElements allow custom elements derived from built-ins if they pass CUSTOM_ELEMENT_HANDLING.tagNameCheck. Default: `false`.
   */
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
  let FORBID_TAGS = null;
  /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
  let FORBID_ATTR = null;
  /* Config object to store ADD_TAGS/ADD_ATTR functions (when used as functions) */
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  /* Decide if ARIA attributes are okay */
  let ALLOW_ARIA_ATTR = true;
  /* Decide if custom data attributes are okay */
  let ALLOW_DATA_ATTR = true;
  /* Decide if unknown protocols are okay */
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  /* Decide if self-closing tags in attributes are allowed.
   * Usually removed due to a mXSS issue in jQuery 3.0 */
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  /* Output should be safe for common template engines.
   * This means, DOMPurify removes data attributes, mustaches and ERB
   */
  let SAFE_FOR_TEMPLATES = false;
  /* Output should be safe even for XML used within HTML and alike.
   * This means, DOMPurify removes comments when containing risky content.
   */
  let SAFE_FOR_XML = true;
  /* Decide if document with <html>... should be returned */
  let WHOLE_DOCUMENT = false;
  /* Track whether config is already set on this instance of DOMPurify. */
  let SET_CONFIG = false;
  /* Decide if all elements (e.g. style, script) must be children of
   * document.body. By default, browsers might move them to document.head */
  let FORCE_BODY = false;
  /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
   * string (or a TrustedHTML object if Trusted Types are supported).
   * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
   */
  let RETURN_DOM = false;
  /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
   * string  (or a TrustedHTML object if Trusted Types are supported) */
  let RETURN_DOM_FRAGMENT = false;
  /* Try to return a Trusted Type object instead of a string, return a string in
   * case Trusted Types are not supported  */
  let RETURN_TRUSTED_TYPE = false;
  /* Output should be free from DOM clobbering attacks?
   * This sanitizes markups named with colliding, clobberable built-in DOM APIs.
   */
  let SANITIZE_DOM = true;
  /* Achieve full DOM Clobbering protection by isolating the namespace of named
   * properties and JS variables, mitigating attacks that abuse the HTML/DOM spec rules.
   *
   * HTML/DOM spec rules that enable DOM Clobbering:
   *   - Named Access on Window (§7.3.3)
   *   - DOM Tree Accessors (§3.1.5)
   *   - Form Element Parent-Child Relations (§4.10.3)
   *   - Iframe srcdoc / Nested WindowProxies (§4.8.5)
   *   - HTMLCollection (§4.2.10.2)
   *
   * Namespace isolation is implemented by prefixing `id` and `name` attributes
   * with a constant string, i.e., `user-content-`
   */
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = 'user-content-';
  /* Keep element content when removing element? */
  let KEEP_CONTENT = true;
  /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
   * of importing it into a new Document and returning a sanitized copy */
  let IN_PLACE = false;
  /* Allow usage of profiles like html, svg and mathMl */
  let USE_PROFILES = {};
  /* Tags to ignore content of when KEEP_CONTENT is true */
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);
  /* Tags that are safe for data: URIs */
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
  /* Attributes safe for values like "javascript:" */
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);
  const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
  /* Document namespace */
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  /* Allowed XHTML+XML namespaces */
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ['mi', 'mo', 'mn', 'ms', 'mtext']);
  let HTML_INTEGRATION_POINTS = addToSet({}, ['annotation-xml']);
  // Certain elements are allowed in both SVG and HTML
  // namespace. We need to specify them explicitly
  // so that they don't get erroneously deleted from
  // HTML namespace.
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ['title', 'style', 'font', 'a', 'script']);
  /* Parsing of strict XHTML documents */
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ['application/xhtml+xml', 'text/html'];
  const DEFAULT_PARSER_MEDIA_TYPE = 'text/html';
  let transformCaseFunc = null;
  /* Keep a reference to config to pass to hooks */
  let CONFIG = null;
  /* Ideally, do not touch anything below this line */
  /* ______________________________________________ */
  const formElement = document.createElement('form');
  const isRegexOrFunction = function isRegexOrFunction(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  /**
   * _parseConfig
   *
   * @param cfg optional config literal
   */
  // eslint-disable-next-line complexity
  const _parseConfig = function _parseConfig() {
    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    /* Shield configuration object from tampering */
    if (!cfg || typeof cfg !== 'object') {
      cfg = {};
    }
    /* Shield configuration object from prototype pollution */
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE =
    // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    // HTML tags and attributes are not case-sensitive, converting to lowercase. Keeping XHTML as is.
    transformCaseFunc = PARSER_MEDIA_TYPE === 'application/xhtml+xml' ? stringToString : stringToLowerCase;
    /* Set configuration parameters */
    ALLOWED_TAGS = objectHasOwnProperty(cfg, 'ALLOWED_TAGS') ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, 'ALLOWED_ATTR') ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, 'ALLOWED_NAMESPACES') ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, 'ADD_URI_SAFE_ATTR') ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, 'ADD_DATA_URI_TAGS') ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, 'FORBID_CONTENTS') ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, 'FORBID_TAGS') ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, 'FORBID_ATTR') ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, 'USE_PROFILES') ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false; // Default true
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false; // Default true
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
    RETURN_DOM = cfg.RETURN_DOM || false; // Default false
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
    FORCE_BODY = cfg.FORCE_BODY || false; // Default false
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false; // Default false
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
    IN_PLACE = cfg.IN_PLACE || false; // Default false
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === 'boolean') {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    /* Parse profile info */
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = [];
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    /* Merge configuration parameters */
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === 'function') {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === 'function') {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (cfg.ADD_FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    /* Add #text in case KEEP_CONTENT is set to true */
    if (KEEP_CONTENT) {
      ALLOWED_TAGS['#text'] = true;
    }
    /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
    }
    /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ['tbody']);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== 'function') {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== 'function') {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      // Overwrite existing TrustedTypes policy.
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      // Sign local variables required by `sanitize`.
      emptyHTML = trustedTypesPolicy.createHTML('');
    } else {
      // Uninitialized policy, attempt to initialize the internal dompurify policy.
      if (trustedTypesPolicy === undefined) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      // If creating the internal policy succeeded sign internal variables.
      if (trustedTypesPolicy !== null && typeof emptyHTML === 'string') {
        emptyHTML = trustedTypesPolicy.createHTML('');
      }
    }
    // Prevent further manipulation of configuration.
    // Not available in IE8, Safari 5, etc.
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  /* Keep track of all possible SVG and MathML tags
   * so that we can perform the namespace checks
   * correctly. */
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  /**
   * @param element a DOM element whose namespace is being checked
   * @returns Return false if the element has a
   *  namespace that a spec-compliant parser would never
   *  return. Return true otherwise.
   */
  const _checkValidNamespace = function _checkValidNamespace(element) {
    let parent = getParentNode(element);
    // In JSDOM, if we're inside shadow DOM, then parentNode
    // can be null. We just simulate parent in this case.
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: 'template'
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      // The only way to switch from HTML namespace to SVG
      // is via <svg>. If it happens via any other tag, then
      // it should be killed.
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === 'svg';
      }
      // The only way to switch from MathML to SVG is via`
      // svg if parent is either <annotation-xml> or MathML
      // text integration points.
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      // We only allow elements that are defined in SVG
      // spec. All others are disallowed in SVG namespace.
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      // The only way to switch from HTML namespace to MathML
      // is via <math>. If it happens via any other tag, then
      // it should be killed.
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === 'math';
      }
      // The only way to switch from SVG to MathML is via
      // <math> and HTML integration points
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
      }
      // We only allow elements that are defined in MathML
      // spec. All others are disallowed in MathML namespace.
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      // The only way to switch from SVG to HTML is via
      // HTML integration points, and from MathML to HTML
      // is via MathML text integration points
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      // We disallow tags that are specific for MathML
      // or SVG and should never appear in HTML namespace
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    // For XHTML and XML documents that support custom namespaces
    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    // The code should never reach this place (this means
    // that the element somehow got namespace that is not
    // HTML, SVG, MathML or allowed via ALLOWED_NAMESPACES).
    // Return false just in case.
    return false;
  };
  /**
   * _forceRemove
   *
   * @param node a DOM node
   */
  const _forceRemove = function _forceRemove(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
    }
  };
  /**
   * _removeAttribute
   *
   * @param name an Attribute name
   * @param element a DOM node
   */
  const _removeAttribute = function _removeAttribute(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    // We void attribute values for unremovable "is" attributes
    if (name === 'is') {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {}
      } else {
        try {
          element.setAttribute(name, '');
        } catch (_) {}
      }
    }
  };
  /**
   * _initDocument
   *
   * @param dirty - a string of dirty markup
   * @return a DOM, filled with the dirty markup
   */
  const _initDocument = function _initDocument(dirty) {
    /* Create a HTML document */
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = '<remove></remove>' + dirty;
    } else {
      /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && NAMESPACE === HTML_NAMESPACE) {
      // Root of XHTML doc must contain xmlns declaration (see https://www.w3.org/TR/xhtml1/normative.html#strict)
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + '</body></html>';
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    /*
     * Use the DOMParser API by default, fallback later if needs be
     * DOMParser not work for svg when has multiple root element.
     */
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {}
    }
    /* Use createHTMLDocument in case DOMParser is not available */
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, 'template', null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
        // Syntax error if dirtyPayload is invalid xml
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    /* Work on whole document or just its body */
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  /**
   * Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
   *
   * @param root The root element or node to start traversing on.
   * @return The created NodeIterator
   */
  const _createNodeIterator = function _createNodeIterator(root) {
    return createNodeIterator.call(root.ownerDocument || root, root,
    // eslint-disable-next-line no-bitwise
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
  };
  /**
   * _isClobbered
   *
   * @param element element to check for clobbering attacks
   * @return true if clobbered, false if safe
   */
  const _isClobbered = function _isClobbered(element) {
    return element instanceof HTMLFormElement && (typeof element.nodeName !== 'string' || typeof element.textContent !== 'string' || typeof element.removeChild !== 'function' || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== 'function' || typeof element.setAttribute !== 'function' || typeof element.namespaceURI !== 'string' || typeof element.insertBefore !== 'function' || typeof element.hasChildNodes !== 'function');
  };
  /**
   * Checks whether the given object is a DOM node.
   *
   * @param value object to check whether it's a DOM node
   * @return true is object is a DOM node
   */
  const _isNode = function _isNode(value) {
    return typeof Node === 'function' && value instanceof Node;
  };
  function _executeHooks(hooks, currentNode, data) {
    arrayForEach(hooks, hook => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  /**
   * _sanitizeElements
   *
   * @protect nodeName
   * @protect textContent
   * @protect removeChild
   * @param currentNode to check for permission to exist
   * @return true if node was killed, false if left alive
   */
  const _sanitizeElements = function _sanitizeElements(currentNode) {
    let content = null;
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    /* Check if element is clobbered or can clobber */
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Now let's check the element's type and name */
    const tagName = transformCaseFunc(currentNode.nodeName);
    /* Execute a hook if present */
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    /* Detect mXSS attempts abusing namespace confusion */
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove any occurrence of processing instructions */
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove any kind of possibly harmful comments */
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Remove element if anything forbids its presence */
    if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
      /* Check if we have a custom element to handle */
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      /* Keep content except for bad-listed elements */
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    /* Check whether element has a valid namespace */
    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Make sure that older browsers don't get fallback-tag mXSS */
    if ((tagName === 'noscript' || tagName === 'noembed' || tagName === 'noframes') && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    /* Sanitize element content to be template-safe */
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      /* Get the element's text content */
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
        content = stringReplace(content, expr, ' ');
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  /**
   * _isValidAttribute
   *
   * @param lcTag Lowercase tag name of containing element.
   * @param lcName Lowercase attribute name.
   * @param value Attribute value.
   * @return Returns true if `value` is valid, otherwise false.
   */
  // eslint-disable-next-line complexity
  const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
    /* Make sure attribute cannot clobber */
    if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
      return false;
    }
    /* Allow valid data-* attributes: At least one character after "-"
        (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
        XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
        We don't need to check the value; it's always URI safe. */
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR, lcName)) ;else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR, lcName)) ;else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ;else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
      // First condition does a very basic check if a) it's basically a valid custom element tagname AND
      // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
      // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
      _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) ||
      // Alternative, second condition checks if it's an `is`-attribute, AND
      // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
      lcName === 'is' && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))) ;else {
        return false;
      }
      /* Check value is safe. First, is attr inert? If so, is safe */
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE, ''))) ;else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ;else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA, stringReplace(value, ATTR_WHITESPACE, ''))) ;else if (value) {
      return false;
    } else ;
    return true;
  };
  /**
   * _isBasicCustomElement
   * checks if at least one dash is included in tagName, and it's not the first char
   * for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
   *
   * @param tagName name of the tag of the node to sanitize
   * @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
   */
  const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
    return tagName !== 'annotation-xml' && stringMatch(tagName, CUSTOM_ELEMENT);
  };
  /**
   * _sanitizeAttributes
   *
   * @protect attributes
   * @protect nodeName
   * @protect removeAttribute
   * @protect setAttribute
   *
   * @param currentNode to sanitize
   */
  const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const {
      attributes
    } = currentNode;
    /* Check if we have attributes; if not we might have a text node */
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: '',
      attrValue: '',
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: undefined
    };
    let l = attributes.length;
    /* Go backwards over all attributes; safely remove bad ones */
    while (l--) {
      const attr = attributes[l];
      const {
        name,
        namespaceURI,
        value: attrValue
      } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === 'value' ? initValue : stringTrim(initValue);
      /* Execute a hook if present */
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      /* Full DOM Clobbering protection via namespace isolation,
       * Prefix id and name attributes with `user-content-`
       */
      if (SANITIZE_NAMED_PROPS && (lcName === 'id' || lcName === 'name')) {
        // Remove the attribute with this value
        _removeAttribute(name, currentNode);
        // Prefix the value and later re-create the attribute with the sanitized value
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      /* Work around a security issue with comments inside attributes */
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Make sure we cannot easily use animated hrefs, even if animations are allowed */
      if (lcName === 'attributename' && stringMatch(value, 'href')) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Did the hooks approve of the attribute? */
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      /* Did the hooks approve of the attribute? */
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Work around a security issue in jQuery 3.0 */
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Sanitize attribute content to be template-safe */
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
          value = stringReplace(value, expr, ' ');
        });
      }
      /* Is `value` valid for this attribute? */
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      /* Handle attributes that require Trusted Types */
      if (trustedTypesPolicy && typeof trustedTypes === 'object' && typeof trustedTypes.getAttributeType === 'function') {
        if (namespaceURI) ;else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case 'TrustedHTML':
              {
                value = trustedTypesPolicy.createHTML(value);
                break;
              }
            case 'TrustedScriptURL':
              {
                value = trustedTypesPolicy.createScriptURL(value);
                break;
              }
          }
        }
      }
      /* Handle invalid data-* attribute set by try-catching it */
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  /**
   * _sanitizeShadowDOM
   *
   * @param fragment to iterate over recursively
   */
  const _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    /* Execute a hook if present */
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      /* Execute a hook if present */
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      /* Sanitize tags and elements */
      _sanitizeElements(shadowNode);
      /* Check attributes next */
      _sanitizeAttributes(shadowNode);
      /* Deep shadow DOM detected */
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(shadowNode.content);
      }
    }
    /* Execute a hook if present */
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  // eslint-disable-next-line complexity
  DOMPurify.sanitize = function (dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    /* Make sure we have a string to sanitize.
      DO NOT return early, as this will return the wrong type if
      the user has requested a DOM object rather than a string */
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = '<!-->';
    }
    /* Stringify, in case dirty is an object */
    if (typeof dirty !== 'string' && !_isNode(dirty)) {
      if (typeof dirty.toString === 'function') {
        dirty = dirty.toString();
        if (typeof dirty !== 'string') {
          throw typeErrorCreate('dirty is not a string, aborting');
        }
      } else {
        throw typeErrorCreate('toString is not a function');
      }
    }
    /* Return dirty HTML if DOMPurify cannot run */
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    /* Assign config vars */
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    /* Clean up removed elements */
    DOMPurify.removed = [];
    /* Check if dirty is correctly typed for IN_PLACE */
    if (typeof dirty === 'string') {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      /* Do some early pre-sanitization to avoid unsafe root nodes */
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate('root node is forbidden and cannot be sanitized in-place');
        }
      }
    } else if (dirty instanceof Node) {
      /* If dirty is a DOM element, append to an empty document to avoid
         elements being stripped by the parser */
      body = _initDocument('<!---->');
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === 'BODY') {
        /* Node is already a body, use as is */
        body = importedNode;
      } else if (importedNode.nodeName === 'HTML') {
        body = importedNode;
      } else {
        // eslint-disable-next-line unicorn/prefer-dom-node-append
        body.appendChild(importedNode);
      }
    } else {
      /* Exit directly if we have nothing to do */
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
      // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf('<') === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      /* Initialize the document to work on */
      body = _initDocument(dirty);
      /* Check we have a DOM node from the data */
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : '';
      }
    }
    /* Remove first element node (ours) if FORCE_BODY is set */
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    /* Get node iterator */
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    /* Now start iterating over the created document */
    while (currentNode = nodeIterator.nextNode()) {
      /* Sanitize tags and elements */
      _sanitizeElements(currentNode);
      /* Check attributes next */
      _sanitizeAttributes(currentNode);
      /* Shadow DOM detected, sanitize it */
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }
    }
    /* If we sanitized `dirty` in-place, return it. */
    if (IN_PLACE) {
      return dirty;
    }
    /* Return sanitized string or DOM */
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          // eslint-disable-next-line unicorn/prefer-dom-node-append
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        /*
          AdoptNode() is not used because internal state is not reset
          (e.g. the past names map of a HTMLFormElement), this is safe
          in theory but we would rather not risk another attack vector.
          The state that is cloned by importNode() is explicitly defined
          by the specs.
        */
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    /* Serialize doctype if allowed */
    if (WHOLE_DOCUMENT && ALLOWED_TAGS['!doctype'] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = '<!DOCTYPE ' + body.ownerDocument.doctype.name + '>\n' + serializedHTML;
    }
    /* Sanitize final string template-safe */
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
        serializedHTML = stringReplace(serializedHTML, expr, ' ');
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function () {
    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function () {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function (tag, attr, value) {
    /* Initialize shared config vars if necessary. */
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function (entryPoint, hookFunction) {
    if (typeof hookFunction !== 'function') {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function (entryPoint, hookFunction) {
    if (hookFunction !== undefined) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? undefined : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function (entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function () {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

/**
 * marked v17.0.1 - a markdown parser
 * Copyright (c) 2018-2025, MarkedJS. (MIT License)
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */

function L() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
var T = L();
function Z(u) {
  T = u;
}
var C = {
  exec: () => null
};
function k(u, e = "") {
  let t = typeof u == "string" ? u : u.source,
    n = {
      replace: (r, i) => {
        let s = typeof i == "string" ? i : i.source;
        return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
      },
      getRegex: () => new RegExp(t, e)
    };
  return n;
}
var me = (() => {
    try {
      return !!new RegExp("(?<=1)(?<!1)");
    } catch {
      return !1;
    }
  })(),
  m = {
    codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
    outputLinkReplace: /\\([\[\]])/g,
    indentCodeCompensation: /^(\s+)(?:```)/,
    beginningSpace: /^\s+/,
    endingHash: /#$/,
    startingSpaceChar: /^ /,
    endingSpaceChar: / $/,
    nonSpaceChar: /[^ ]/,
    newLineCharGlobal: /\n/g,
    tabCharGlobal: /\t/g,
    multipleSpaceGlobal: /\s+/g,
    blankLine: /^[ \t]*$/,
    doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
    blockquoteStart: /^ {0,3}>/,
    blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
    blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
    listReplaceTabs: /^\t+/,
    listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
    listIsTask: /^\[[ xX]\] +\S/,
    listReplaceTask: /^\[[ xX]\] +/,
    listTaskCheckbox: /\[[ xX]\]/,
    anyLine: /\n.*\n/,
    hrefBrackets: /^<(.*)>$/,
    tableDelimiter: /[:|]/,
    tableAlignChars: /^\||\| *$/g,
    tableRowBlankLine: /\n[ \t]*$/,
    tableAlignRight: /^ *-+: *$/,
    tableAlignCenter: /^ *:-+: *$/,
    tableAlignLeft: /^ *:-+ *$/,
    startATag: /^<a /i,
    endATag: /^<\/a>/i,
    startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
    endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
    startAngleBracket: /^</,
    endAngleBracket: />$/,
    pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
    unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
    caret: /(^|[^\[])\^/g,
    percentDecode: /%25/g,
    findPipe: /\|/g,
    splitPipe: / \|/,
    slashPipe: /\\\|/g,
    carriageReturn: /\r\n|\r/g,
    spaceLine: /^ +$/gm,
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    listItemRegex: u => new RegExp(`^( {0,3}${u})((?:[	 ][^\\n]*)?(?:\\n|$))`),
    nextBulletRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
    hrRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
    fencesBeginRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}(?:\`\`\`|~~~)`),
    headingBeginRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}#`),
    htmlBeginRegex: u => new RegExp(`^ {0,${Math.min(3, u - 1)}}<(?:[a-z].*>|!--)`, "i")
  },
  xe = /^(?:[ \t]*(?:\n|$))+/,
  be = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,
  Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  I = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
  Te = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  N = /(?:[*+-]|\d{1,9}[.)])/,
  re = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  se = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(),
  Oe = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),
  Q = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  we = /^[^\n]+/,
  F = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,
  ye = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", F).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),
  Pe = k(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, N).getRegex(),
  v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",
  j = /<!--(?:-?>|[\s\S]*?(?:-->|$))/,
  Se = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", j).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),
  ie = k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex(),
  $e = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ie).getRegex(),
  U = {
    blockquote: $e,
    code: be,
    def: ye,
    fences: Re,
    heading: Te,
    hr: I,
    html: Se,
    lheading: se,
    list: Pe,
    newline: xe,
    paragraph: ie,
    table: C,
    text: we
  },
  te = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex(),
  _e = {
    ...U,
    lheading: Oe,
    table: te,
    paragraph: k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", te).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex()
  },
  Le = {
    ...U,
    html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", j).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: C,
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: k(Q).replace("hr", I).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", se).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
  },
  Me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  ze = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  oe = /^( {2,}|\\)\n(?!\s*$)/,
  Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  D = /[\p{P}\p{S}]/u,
  K = /[\s\p{P}\p{S}]/u,
  ae = /[^\s\p{P}\p{S}]/u,
  Ce = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, K).getRegex(),
  le = /(?!~)[\p{P}\p{S}]/u,
  Ie = /(?!~)[\s\p{P}\p{S}]/u,
  Ee = /(?:[^\s\p{P}\p{S}]|~)/u,
  Be = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", me ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(),
  ue = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,
  qe = k(ue, "u").replace(/punct/g, D).getRegex(),
  ve = k(ue, "u").replace(/punct/g, le).getRegex(),
  pe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",
  De = k(pe, "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex(),
  He = k(pe, "gu").replace(/notPunctSpace/g, Ee).replace(/punctSpace/g, Ie).replace(/punct/g, le).getRegex(),
  Ze = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex(),
  Ge = k(/\\(punct)/, "gu").replace(/punct/g, D).getRegex(),
  Ne = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),
  Qe = k(j).replace("(?:-->|$)", "-->").getRegex(),
  Fe = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Qe).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),
  q = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,
  je = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),
  ce = k(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", F).getRegex(),
  he = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", F).getRegex(),
  Ue = k("reflink|nolink(?!\\()", "g").replace("reflink", ce).replace("nolink", he).getRegex(),
  ne = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,
  W = {
    _backpedal: C,
    anyPunctuation: Ge,
    autolink: Ne,
    blockSkip: Be,
    br: oe,
    code: ze,
    del: C,
    emStrongLDelim: qe,
    emStrongRDelimAst: De,
    emStrongRDelimUnd: Ze,
    escape: Me,
    link: je,
    nolink: he,
    punctuation: Ce,
    reflink: ce,
    reflinkSearch: Ue,
    tag: Fe,
    text: Ae,
    url: C
  },
  Ke = {
    ...W,
    link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(),
    reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex()
  },
  G = {
    ...W,
    emStrongRDelimAst: He,
    emStrongLDelim: ve,
    url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ne).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
    text: k(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ne).getRegex()
  },
  We = {
    ...G,
    br: k(oe).replace("{2,}", "*").getRegex(),
    text: k(G.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
  },
  E = {
    normal: U,
    gfm: _e,
    pedantic: Le
  },
  M = {
    normal: W,
    gfm: G,
    breaks: We,
    pedantic: Ke
  };
var Xe = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  },
  ke = u => Xe[u];
function w(u, e) {
  if (e) {
    if (m.escapeTest.test(u)) return u.replace(m.escapeReplace, ke);
  } else if (m.escapeTestNoEncode.test(u)) return u.replace(m.escapeReplaceNoEncode, ke);
  return u;
}
function X(u) {
  try {
    u = encodeURI(u).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return u;
}
function J(u, e) {
  let t = u.replace(m.findPipe, (i, s, a) => {
      let o = !1,
        l = s;
      for (; --l >= 0 && a[l] === "\\";) o = !o;
      return o ? "|" : " |";
    }),
    n = t.split(m.splitPipe),
    r = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);else for (; n.length < e;) n.push("");
  for (; r < n.length; r++) n[r] = n[r].trim().replace(m.slashPipe, "|");
  return n;
}
function z(u, e, t) {
  let n = u.length;
  if (n === 0) return "";
  let r = 0;
  for (; r < n;) {
    let i = u.charAt(n - r - 1);
    if (i === e && !t) r++;else if (i !== e && t) r++;else break;
  }
  return u.slice(0, n - r);
}
function de(u, e) {
  if (u.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < u.length; n++) if (u[n] === "\\") n++;else if (u[n] === e[0]) t++;else if (u[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function ge(u, e, t, n, r) {
  let i = e.href,
    s = e.title || null,
    a = u[1].replace(r.other.outputLinkReplace, "$1");
  n.state.inLink = !0;
  let o = {
    type: u[0].charAt(0) === "!" ? "image" : "link",
    raw: t,
    href: i,
    title: s,
    text: a,
    tokens: n.inlineTokens(a)
  };
  return n.state.inLink = !1, o;
}
function Je(u, e, t) {
  let n = u.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let r = n[1];
  return e.split(`
`).map(i => {
    let s = i.match(t.other.beginningSpace);
    if (s === null) return i;
    let [a] = s;
    return a.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var y = class {
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return {
      type: "space",
      raw: t[0]
    };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : z(n, `
`)
      };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0],
        r = Je(n, t[3] || "", this.rules);
      return {
        type: "code",
        raw: n,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: r
      };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let r = z(n, "#");
        (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return {
      type: "hr",
      raw: z(t[0], `
`)
    };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = z(t[0], `
`).split(`
`),
        r = "",
        i = "",
        s = [];
      for (; n.length > 0;) {
        let a = !1,
          o = [],
          l;
        for (l = 0; l < n.length; l++) if (this.rules.other.blockquoteStart.test(n[l])) o.push(n[l]), a = !0;else if (!a) o.push(n[l]);else break;
        n = n.slice(l);
        let p = o.join(`
`),
          c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        r = r ? `${r}
${p}` : p, i = i ? `${i}
${c}` : c;
        let g = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, s, !0), this.lexer.state.top = g, n.length === 0) break;
        let h = s.at(-1);
        if (h?.type === "code") break;
        if (h?.type === "blockquote") {
          let R = h,
            f = R.raw + `
` + n.join(`
`),
            O = this.blockquote(f);
          s[s.length - 1] = O, r = r.substring(0, r.length - R.raw.length) + O.raw, i = i.substring(0, i.length - R.text.length) + O.text;
          break;
        } else if (h?.type === "list") {
          let R = h,
            f = R.raw + `
` + n.join(`
`),
            O = this.list(f);
          s[s.length - 1] = O, r = r.substring(0, r.length - h.raw.length) + O.raw, i = i.substring(0, i.length - R.raw.length) + O.raw, n = f.substring(s.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: r,
        tokens: s,
        text: i
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(),
        r = n.length > 1,
        i = {
          type: "list",
          raw: "",
          ordered: r,
          start: r ? +n.slice(0, -1) : "",
          loose: !1,
          items: []
        };
      n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
      let s = this.rules.other.listItemRegex(n),
        a = !1;
      for (; e;) {
        let l = !1,
          p = "",
          c = "";
        if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
        p = t[0], e = e.substring(p.length);
        let g = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, O => " ".repeat(3 * O.length)),
          h = e.split(`
`, 1)[0],
          R = !g.trim(),
          f = 0;
        if (this.options.pedantic ? (f = 2, c = g.trimStart()) : R ? f = t[1].length + 1 : (f = t[2].search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = g.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (p += h + `
`, e = e.substring(h.length + 1), l = !0), !l) {
          let O = this.rules.other.nextBulletRegex(f),
            V = this.rules.other.hrRegex(f),
            Y = this.rules.other.fencesBeginRegex(f),
            ee = this.rules.other.headingBeginRegex(f),
            fe = this.rules.other.htmlBeginRegex(f);
          for (; e;) {
            let H = e.split(`
`, 1)[0],
              A;
            if (h = H, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), A = h) : A = h.replace(this.rules.other.tabCharGlobal, "    "), Y.test(h) || ee.test(h) || fe.test(h) || O.test(h) || V.test(h)) break;
            if (A.search(this.rules.other.nonSpaceChar) >= f || !h.trim()) c += `
` + A.slice(f);else {
              if (R || g.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(g) || ee.test(g) || V.test(g)) break;
              c += `
` + h;
            }
            !R && !h.trim() && (R = !0), p += H + `
`, e = e.substring(H.length + 1), g = A.slice(f);
          }
        }
        i.loose || (a ? i.loose = !0 : this.rules.other.doubleBlankLine.test(p) && (a = !0)), i.items.push({
          type: "list_item",
          raw: p,
          task: !!this.options.gfm && this.rules.other.listIsTask.test(c),
          loose: !1,
          text: c,
          tokens: []
        }), i.raw += p;
      }
      let o = i.items.at(-1);
      if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();else return;
      i.raw = i.raw.trimEnd();
      for (let l of i.items) {
        if (this.lexer.state.top = !1, l.tokens = this.lexer.blockTokens(l.text, []), l.task) {
          if (l.text = l.text.replace(this.rules.other.listReplaceTask, ""), l.tokens[0]?.type === "text" || l.tokens[0]?.type === "paragraph") {
            l.tokens[0].raw = l.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l.tokens[0].text = l.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let c = this.lexer.inlineQueue.length - 1; c >= 0; c--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)) {
              this.lexer.inlineQueue[c].src = this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let p = this.rules.other.listTaskCheckbox.exec(l.raw);
          if (p) {
            let c = {
              type: "checkbox",
              raw: p[0] + " ",
              checked: p[0] !== "[ ]"
            };
            l.checked = c.checked, i.loose ? l.tokens[0] && ["paragraph", "text"].includes(l.tokens[0].type) && "tokens" in l.tokens[0] && l.tokens[0].tokens ? (l.tokens[0].raw = c.raw + l.tokens[0].raw, l.tokens[0].text = c.raw + l.tokens[0].text, l.tokens[0].tokens.unshift(c)) : l.tokens.unshift({
              type: "paragraph",
              raw: c.raw,
              text: c.raw,
              tokens: [c]
            }) : l.tokens.unshift(c);
          }
        }
        if (!i.loose) {
          let p = l.tokens.filter(g => g.type === "space"),
            c = p.length > 0 && p.some(g => this.rules.other.anyLine.test(g.raw));
          i.loose = c;
        }
      }
      if (i.loose) for (let l of i.items) {
        l.loose = !0;
        for (let p of l.tokens) p.type === "text" && (p.type = "paragraph");
      }
      return i;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) return {
      type: "html",
      block: !0,
      raw: t[0],
      pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
      text: t[0]
    };
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "),
        r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "",
        i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: n,
        raw: t[0],
        href: r,
        title: i
      };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = J(t[1]),
      r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"),
      i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [],
      s = {
        type: "table",
        raw: t[0],
        header: [],
        align: [],
        rows: []
      };
    if (n.length === r.length) {
      for (let a of r) this.rules.other.tableAlignRight.test(a) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s.align.push("left") : s.align.push(null);
      for (let a = 0; a < n.length; a++) s.header.push({
        text: n[a],
        tokens: this.lexer.inline(n[a]),
        header: !0,
        align: s.align[a]
      });
      for (let a of i) s.rows.push(J(a, s.header.length).map((o, l) => ({
        text: o,
        tokens: this.lexer.inline(o),
        header: !1,
        align: s.align[l]
      })));
      return s;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) return {
      type: "heading",
      raw: t[0],
      depth: t[2].charAt(0) === "=" ? 1 : 2,
      text: t[1],
      tokens: this.lexer.inline(t[1])
    };
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return {
      type: "text",
      raw: t[0],
      text: t[0],
      tokens: this.lexer.inline(t[0])
    };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return {
      type: "escape",
      raw: t[0],
      text: t[1]
    };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
      type: "html",
      raw: t[0],
      inLink: this.lexer.state.inLink,
      inRawBlock: this.lexer.state.inRawBlock,
      block: !1,
      text: t[0]
    };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n)) return;
        let s = z(n.slice(0, -1), "\\");
        if ((n.length - s.length) % 2 === 0) return;
      } else {
        let s = de(t[2], "()");
        if (s === -2) return;
        if (s > -1) {
          let o = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
          t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, o).trim(), t[3] = "";
        }
      }
      let r = t[2],
        i = "";
      if (this.options.pedantic) {
        let s = this.rules.other.pedanticHrefTitle.exec(r);
        s && (r = s[1], i = s[3]);
      } else i = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), ge(t, {
        href: r && r.replace(this.rules.inline.anyPunctuation, "$1"),
        title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "),
        i = t[r.toLowerCase()];
      if (!i) {
        let s = n[0].charAt(0);
        return {
          type: "text",
          raw: s,
          text: s
        };
      }
      return ge(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let r = this.rules.inline.emStrongLDelim.exec(e);
    if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let s = [...r[0]].length - 1,
        a,
        o,
        l = s,
        p = 0,
        c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = c.exec(t)) != null;) {
        if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
        if (o = [...a].length, r[3] || r[4]) {
          l += o;
          continue;
        } else if ((r[5] || r[6]) && s % 3 && !((s + o) % 3)) {
          p += o;
          continue;
        }
        if (l -= o, l > 0) continue;
        o = Math.min(o, o + l + p);
        let g = [...r[0]][0].length,
          h = e.slice(0, s + r.index + g + o);
        if (Math.min(s, o) % 2) {
          let f = h.slice(1, -1);
          return {
            type: "em",
            raw: h,
            text: f,
            tokens: this.lexer.inlineTokens(f)
          };
        }
        let R = h.slice(2, -2);
        return {
          type: "strong",
          raw: h,
          text: R,
          tokens: this.lexer.inlineTokens(R)
        };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "),
        r = this.rules.other.nonSpaceChar.test(n),
        i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return r && i && (n = n.substring(1, n.length - 1)), {
        type: "codespan",
        raw: t[0],
        text: n
      };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return {
      type: "br",
      raw: t[0]
    };
  }
  del(e) {
    let t = this.rules.inline.del.exec(e);
    if (t) return {
      type: "del",
      raw: t[0],
      text: t[2],
      tokens: this.lexer.inlineTokens(t[2])
    };
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, r;
      return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), {
        type: "link",
        raw: t[0],
        text: n,
        href: r,
        tokens: [{
          type: "text",
          raw: n,
          text: n
        }]
      };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, r;
      if (t[2] === "@") n = t[0], r = "mailto:" + n;else {
        let i;
        do i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? ""; while (i !== t[0]);
        n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: n,
        href: r,
        tokens: [{
          type: "text",
          raw: n,
          text: n
        }]
      };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        escaped: n
      };
    }
  }
};
var x = class u {
  constructor(e) {
    this.tokens = [], this.tokens.links = Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new y(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    let t = {
      other: m,
      block: E.normal,
      inline: M.normal
    };
    this.options.pedantic ? (t.block = E.pedantic, t.inline = M.pedantic) : this.options.gfm && (t.block = E.gfm, this.options.breaks ? t.inline = M.breaks : t.inline = M.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return {
      block: E,
      inline: M
    };
  }
  static lex(e, t) {
    return new u(t).lex(e);
  }
  static lexInline(e, t) {
    return new u(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = !1) {
    for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, "")); e;) {
      let r;
      if (this.options.extensions?.block?.some(s => (r = s.call({
        lexer: this
      }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        r.raw.length === 1 && s !== void 0 ? s.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
          href: r.href,
          title: r.title
        }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let s = 1 / 0,
          a = e.slice(1),
          o;
        this.options.extensions.startBlock.forEach(l => {
          o = l.call({
            lexer: this
          }, a), typeof o == "number" && o >= 0 && (s = Math.min(s, o));
        }), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let s = t.at(-1);
        n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (e) {
        let s = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(s);
          break;
        } else throw new Error(s);
      }
    }
    return this.state.top = !0, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({
      src: e,
      tokens: t
    }), t;
  }
  inlineTokens(e, t = []) {
    let n = e,
      r = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null;) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null;) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let i;
    for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null;) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n = this.options.hooks?.emStrongMask?.call({
      lexer: this
    }, n) ?? n;
    let s = !1,
      a = "";
    for (; e;) {
      s || (a = ""), s = !1;
      let o;
      if (this.options.extensions?.inline?.some(p => (o = p.call({
        lexer: this
      }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), !0) : !1)) continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let p = t.at(-1);
        o.type === "text" && p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, a)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let l = e;
      if (this.options.extensions?.startInline) {
        let p = 1 / 0,
          c = e.slice(1),
          g;
        this.options.extensions.startInline.forEach(h => {
          g = h.call({
            lexer: this
          }, c), typeof g == "number" && g >= 0 && (p = Math.min(p, g));
        }), p < 1 / 0 && p >= 0 && (l = e.substring(0, p + 1));
      }
      if (o = this.tokenizer.inlineText(l)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (a = o.raw.slice(-1)), s = !0;
        let p = t.at(-1);
        p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let p = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(p);
          break;
        } else throw new Error(p);
      }
    }
    return t;
  }
};
var P = class {
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    return "";
  }
  code({
    text: e,
    lang: t,
    escaped: n
  }) {
    let r = (t || "").match(m.notSpaceStart)?.[0],
      i = e.replace(m.endingNewline, "") + `
`;
    return r ? '<pre><code class="language-' + w(r) + '">' + (n ? i : w(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : w(i, !0)) + `</code></pre>
`;
  }
  blockquote({
    tokens: e
  }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({
    text: e
  }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({
    tokens: e,
    depth: t
  }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered,
      n = e.start,
      r = "";
    for (let a = 0; a < e.items.length; a++) {
      let o = e.items[a];
      r += this.listitem(o);
    }
    let i = t ? "ol" : "ul",
      s = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + s + `>
` + r + "</" + i + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({
    checked: e
  }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({
    tokens: e
  }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "",
      n = "";
    for (let i = 0; i < e.header.length; i++) n += this.tablecell(e.header[i]);
    t += this.tablerow({
      text: n
    });
    let r = "";
    for (let i = 0; i < e.rows.length; i++) {
      let s = e.rows[i];
      n = "";
      for (let a = 0; a < s.length; a++) n += this.tablecell(s[a]);
      r += this.tablerow({
        text: n
      });
    }
    return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
  }
  tablerow({
    text: e
  }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens),
      n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({
    tokens: e
  }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({
    tokens: e
  }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({
    text: e
  }) {
    return `<code>${w(e, !0)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({
    tokens: e
  }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({
    href: e,
    title: t,
    tokens: n
  }) {
    let r = this.parser.parseInline(n),
      i = X(e);
    if (i === null) return r;
    e = i;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + w(t) + '"'), s += ">" + r + "</a>", s;
  }
  image({
    href: e,
    title: t,
    text: n,
    tokens: r
  }) {
    r && (n = this.parser.parseInline(r, this.parser.textRenderer));
    let i = X(e);
    if (i === null) return w(n);
    e = i;
    let s = `<img src="${e}" alt="${n}"`;
    return t && (s += ` title="${w(t)}"`), s += ">", s;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : w(e.text);
  }
};
var $ = class {
  strong({
    text: e
  }) {
    return e;
  }
  em({
    text: e
  }) {
    return e;
  }
  codespan({
    text: e
  }) {
    return e;
  }
  del({
    text: e
  }) {
    return e;
  }
  html({
    text: e
  }) {
    return e;
  }
  text({
    text: e
  }) {
    return e;
  }
  link({
    text: e
  }) {
    return "" + e;
  }
  image({
    text: e
  }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({
    raw: e
  }) {
    return e;
  }
};
var b = class u {
  constructor(e) {
    this.options = e || T, this.options.renderer = this.options.renderer || new P(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $();
  }
  static parse(e, t) {
    return new u(t).parse(e);
  }
  static parseInline(e, t) {
    return new u(t).parseInline(e);
  }
  parse(e) {
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let r = e[n];
      if (this.options.extensions?.renderers?.[r.type]) {
        let s = r,
          a = this.options.extensions.renderers[s.type].call({
            parser: this
          }, s);
        if (a !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(s.type)) {
          t += a || "";
          continue;
        }
      }
      let i = r;
      switch (i.type) {
        case "space":
          {
            t += this.renderer.space(i);
            break;
          }
        case "hr":
          {
            t += this.renderer.hr(i);
            break;
          }
        case "heading":
          {
            t += this.renderer.heading(i);
            break;
          }
        case "code":
          {
            t += this.renderer.code(i);
            break;
          }
        case "table":
          {
            t += this.renderer.table(i);
            break;
          }
        case "blockquote":
          {
            t += this.renderer.blockquote(i);
            break;
          }
        case "list":
          {
            t += this.renderer.list(i);
            break;
          }
        case "checkbox":
          {
            t += this.renderer.checkbox(i);
            break;
          }
        case "html":
          {
            t += this.renderer.html(i);
            break;
          }
        case "def":
          {
            t += this.renderer.def(i);
            break;
          }
        case "paragraph":
          {
            t += this.renderer.paragraph(i);
            break;
          }
        case "text":
          {
            t += this.renderer.text(i);
            break;
          }
        default:
          {
            let s = 'Token with "' + i.type + '" type was not found.';
            if (this.options.silent) return console.error(s), "";
            throw new Error(s);
          }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    let n = "";
    for (let r = 0; r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let a = this.options.extensions.renderers[i.type].call({
          parser: this
        }, i);
        if (a !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += a || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "escape":
          {
            n += t.text(s);
            break;
          }
        case "html":
          {
            n += t.html(s);
            break;
          }
        case "link":
          {
            n += t.link(s);
            break;
          }
        case "image":
          {
            n += t.image(s);
            break;
          }
        case "checkbox":
          {
            n += t.checkbox(s);
            break;
          }
        case "strong":
          {
            n += t.strong(s);
            break;
          }
        case "em":
          {
            n += t.em(s);
            break;
          }
        case "codespan":
          {
            n += t.codespan(s);
            break;
          }
        case "br":
          {
            n += t.br(s);
            break;
          }
        case "del":
          {
            n += t.del(s);
            break;
          }
        case "text":
          {
            n += t.text(s);
            break;
          }
        default:
          {
            let a = 'Token with "' + s.type + '" type was not found.';
            if (this.options.silent) return console.error(a), "";
            throw new Error(a);
          }
      }
    }
    return n;
  }
};
var S = class {
  constructor(e) {
    this.options = e || T;
  }
  static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer() {
    return this.block ? x.lex : x.lexInline;
  }
  provideParser() {
    return this.block ? b.parse : b.parseInline;
  }
};
var B = class {
  defaults = L();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = b;
  Renderer = P;
  TextRenderer = $;
  Lexer = x;
  Tokenizer = y;
  Hooks = S;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
      case "table":
        {
          let i = r;
          for (let s of i.header) n = n.concat(this.walkTokens(s.tokens, t));
          for (let s of i.rows) for (let a of s) n = n.concat(this.walkTokens(a.tokens, t));
          break;
        }
      case "list":
        {
          let i = r;
          n = n.concat(this.walkTokens(i.items, t));
          break;
        }
      default:
        {
          let i = r;
          this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach(s => {
            let a = i[s].flat(1 / 0);
            n = n.concat(this.walkTokens(a, t));
          }) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
        }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || {
      renderers: {},
      childTokens: {}
    };
    return e.forEach(n => {
      let r = {
        ...n
      };
      if (r.async = this.defaults.async || r.async || !1, n.extensions && (n.extensions.forEach(i => {
        if (!i.name) throw new Error("extension name required");
        if ("renderer" in i) {
          let s = t.renderers[i.name];
          s ? t.renderers[i.name] = function (...a) {
            let o = i.renderer.apply(this, a);
            return o === !1 && (o = s.apply(this, a)), o;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let s = t[i.level];
          s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), r.extensions = t), n.renderer) {
        let i = this.defaults.renderer || new P(this.defaults);
        for (let s in n.renderer) {
          if (!(s in i)) throw new Error(`renderer '${s}' does not exist`);
          if (["options", "parser"].includes(s)) continue;
          let a = s,
            o = n.renderer[a],
            l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === !1 && (c = l.apply(i, p)), c || "";
          };
        }
        r.renderer = i;
      }
      if (n.tokenizer) {
        let i = this.defaults.tokenizer || new y(this.defaults);
        for (let s in n.tokenizer) {
          if (!(s in i)) throw new Error(`tokenizer '${s}' does not exist`);
          if (["options", "rules", "lexer"].includes(s)) continue;
          let a = s,
            o = n.tokenizer[a],
            l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === !1 && (c = l.apply(i, p)), c;
          };
        }
        r.tokenizer = i;
      }
      if (n.hooks) {
        let i = this.defaults.hooks || new S();
        for (let s in n.hooks) {
          if (!(s in i)) throw new Error(`hook '${s}' does not exist`);
          if (["options", "block"].includes(s)) continue;
          let a = s,
            o = n.hooks[a],
            l = i[a];
          S.passThroughHooks.has(s) ? i[a] = p => {
            if (this.defaults.async && S.passThroughHooksRespectAsync.has(s)) return (async () => {
              let g = await o.call(i, p);
              return l.call(i, g);
            })();
            let c = o.call(i, p);
            return l.call(i, c);
          } : i[a] = (...p) => {
            if (this.defaults.async) return (async () => {
              let g = await o.apply(i, p);
              return g === !1 && (g = await l.apply(i, p)), g;
            })();
            let c = o.apply(i, p);
            return c === !1 && (c = l.apply(i, p)), c;
          };
        }
        r.hooks = i;
      }
      if (n.walkTokens) {
        let i = this.defaults.walkTokens,
          s = n.walkTokens;
        r.walkTokens = function (a) {
          let o = [];
          return o.push(s.call(this, a)), i && (o = o.concat(i.call(this, a))), o;
        };
      }
      this.defaults = {
        ...this.defaults,
        ...r
      };
    }), this;
  }
  setOptions(e) {
    return this.defaults = {
      ...this.defaults,
      ...e
    }, this;
  }
  lexer(e, t) {
    return x.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return b.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, r) => {
      let i = {
          ...r
        },
        s = {
          ...this.defaults,
          ...i
        },
        a = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === !0 && i.async === !1) return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return a(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (s.hooks && (s.hooks.options = s, s.hooks.block = e), s.async) return (async () => {
        let o = s.hooks ? await s.hooks.preprocess(n) : n,
          p = await (s.hooks ? await s.hooks.provideLexer() : e ? x.lex : x.lexInline)(o, s),
          c = s.hooks ? await s.hooks.processAllTokens(p) : p;
        s.walkTokens && (await Promise.all(this.walkTokens(c, s.walkTokens)));
        let h = await (s.hooks ? await s.hooks.provideParser() : e ? b.parse : b.parseInline)(c, s);
        return s.hooks ? await s.hooks.postprocess(h) : h;
      })().catch(a);
      try {
        s.hooks && (n = s.hooks.preprocess(n));
        let l = (s.hooks ? s.hooks.provideLexer() : e ? x.lex : x.lexInline)(n, s);
        s.hooks && (l = s.hooks.processAllTokens(l)), s.walkTokens && this.walkTokens(l, s.walkTokens);
        let c = (s.hooks ? s.hooks.provideParser() : e ? b.parse : b.parseInline)(l, s);
        return s.hooks && (c = s.hooks.postprocess(c)), c;
      } catch (o) {
        return a(o);
      }
    };
  }
  onError(e, t) {
    return n => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let r = "<p>An error occurred:</p><pre>" + w(n.message + "", !0) + "</pre>";
        return t ? Promise.resolve(r) : r;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var _ = new B();
function d(u, e) {
  return _.parse(u, e);
}
d.options = d.setOptions = function (u) {
  return _.setOptions(u), d.defaults = _.defaults, Z(d.defaults), d;
};
d.getDefaults = L;
d.defaults = T;
d.use = function (...u) {
  return _.use(...u), d.defaults = _.defaults, Z(d.defaults), d;
};
d.walkTokens = function (u, e) {
  return _.walkTokens(u, e);
};
d.parseInline = _.parseInline;
d.Parser = b;
d.parser = b.parse;
d.Renderer = P;
d.TextRenderer = $;
d.Lexer = x;
d.lexer = x.lex;
d.Tokenizer = y;
d.Hooks = S;
d.parse = d;
d.options;
  d.setOptions;
  d.use;
  d.walkTokens;
  d.parseInline;
  b.parse;
  x.lex;

/**
 * Configuration for HTML sanitization
 * Updated for FAQ content: Prioritizes safe, readable rich text with full link support.
 * Enhances table support (including captions and structural attributes for better accessibility/complexity).
 * Adds optional video support (commented out by default—uncomment if embedding videos is desired for FAQs;
 * note: this increases security review needs due to potential executable content).
 * Removes headings (h1-h6) as they're likely unnecessary for FAQ responses.
 * Retains core formatting, lists, images, and tables for structured answers.
 */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "b",
        "i",
        "a",
        "ul",
        "ol",
        "li",
        "code",
        "pre",
        "hr",
        "table",
        "caption", // Added for table titles/descriptions
        "thead",
        "tbody",
        "tfoot", // Added for table footers (e.g., summaries/totals)
        "tr",
        "th",
        "td",
        "col", // Added for column properties
        "colgroup", // Added for grouping columns
        "img",
        "div",
        "span",
        "video", // Uncomment to enable <video> for embedded videos
        "source", // Uncomment if enabling video (for <video> sources)
        "figure", // Optional: For wrapping images/tables with captions
        "figcaption" // Optional: For figure descriptions
    ],
    ALLOWED_ATTR: [
        "href",
        "title",
        "target",
        "rel",
        "src",
        "alt",
        "width",
        "height",
        "class",
        "id",
        "style",
        // Table-specific attributes for structure and accessibility
        "rowspan",
        "colspan",
        "scope", // For <th> (e.g., row, col, rowgroup)
        "headers", // For associating <td> with <th>
        // Video-specific (uncomment if enabling video)
        "controls",
        "autoplay",
        "loop",
        "muted",
        "poster"
    ],
    ALLOW_DATA_ATTR: false, // Keep false for security; enable only if custom data attrs are vetted
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
};
/**
 * Validates and sanitizes HTML content
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
function sanitizeHTML(html) {
    if (!html) {
        return "";
    }
    try {
        // Configure DOMPurify
        const cleanHTML = purify.sanitize(html, SANITIZE_CONFIG);
        return cleanHTML;
    }
    catch (error) {
        console.error("Error sanitizing HTML:", error);
        // Return escaped text as fallback
        return escapeHTML(html);
    }
}
/**
 * Validates HTML content and returns validation errors
 * @param html - The HTML string to validate
 * @returns Array of validation error messages
 */
function validateHTML(html) {
    const errors = [];
    if (!html) {
        return errors;
    }
    // Check for script tags (should be blocked)
    if (/<script[^>]*>[\s\S]*?<\/script>/gi.test(html)) {
        errors.push("Script tags are not allowed for security reasons");
    }
    // Check for event handlers (should be blocked)
    if (/on\w+\s*=/gi.test(html)) {
        errors.push("Event handlers (onclick, onload, etc.) are not allowed for security reasons");
    }
    // Check for javascript: protocol
    if (/javascript:/gi.test(html)) {
        errors.push("JavaScript protocol in URLs is not allowed for security reasons");
    }
    // Check for data: protocol (except for images)
    if (/data:(?!image)/gi.test(html)) {
        errors.push("Data URLs are only allowed for images");
    }
    // Check for iframe (not in allowed tags)
    if (/<iframe[^>]*>/gi.test(html)) {
        errors.push("Iframe tags are not allowed");
    }
    // Check for object and embed tags
    if (/<(object|embed)[^>]*>/gi.test(html)) {
        errors.push("Object and embed tags are not allowed");
    }
    return errors;
}
/**
 * Validates HTML syntax for malformed markup
 * @param html - The HTML string to validate
 * @returns Array of syntax error messages
 */
function validateHTMLSyntax(html) {
    const errors = [];
    if (!html) {
        return errors;
    }
    const allTags = html.match(/<[^>]+>/g) || [];
    allTags.forEach((tag) => {
        // Check for attributes with unclosed quotes
        // Look for attr=" or attr=' that doesn't have a matching closing quote
        const singleQuoteMatches = tag.match(/\w+\s*=\s*'[^']*$/);
        const doubleQuoteMatches = tag.match(/\w+\s*=\s*"[^"]*$/);
        if (singleQuoteMatches || doubleQuoteMatches) {
            errors.push(`Unclosed attribute quote in tag: ${tag.substring(0, 50)}${tag.length > 50 ? "..." : ""}`);
        }
        // Check for unclosed opening tag (missing >)
        if (tag.startsWith("<") && !tag.endsWith(">")) {
            errors.push(`Unclosed tag bracket: ${tag.substring(0, 50)}${tag.length > 50 ? "..." : ""}`);
        }
    });
    // Check for balanced tags (opening and closing)
    // Self-closing tags that don't need closing tags
    const selfClosingTags = [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    ];
    // Extract all tags (opening and closing)
    const tagStack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        const isClosing = fullTag.startsWith("</");
        const isSelfClosing = fullTag.endsWith("/>") || selfClosingTags.includes(tagName);
        if (isClosing) {
            // Closing tag - pop from stack
            if (tagStack.length === 0) {
                errors.push(`Orphaned closing tag: </${tagName}>`);
            }
            else {
                const lastOpened = tagStack[tagStack.length - 1];
                if (lastOpened.tag === tagName) {
                    tagStack.pop();
                }
                else {
                    // Mismatched tag
                    errors.push(`Mismatched tags: Expected closing tag for <${lastOpened.tag}>, found </${tagName}>`);
                    // Try to find matching opening tag in stack
                    const matchIndex = tagStack.findIndex((t) => t.tag === tagName);
                    if (matchIndex >= 0) {
                        tagStack.splice(matchIndex, 1);
                    }
                }
            }
        }
        else if (!isSelfClosing) {
            // Opening tag - push to stack
            tagStack.push({ tag: tagName, position: match.index });
        }
    }
    // Check for unclosed tags remaining in stack
    if (tagStack.length > 0) {
        tagStack.forEach(({ tag }) => {
            errors.push(`Unclosed tag: <${tag}> is missing closing tag </${tag}>`);
        });
    }
    // Check for malformed attributes (no value, malformed syntax)
    const malformedAttrPattern = /<[^>]+\s+(\w+)\s*=\s*(?!["\w])[^>]*>/g;
    let attrMatch;
    while ((attrMatch = malformedAttrPattern.exec(html)) !== null) {
        errors.push(`Malformed attribute syntax: ${attrMatch[0].substring(0, 50)}${attrMatch[0].length > 50 ? "..." : ""}`);
    }
    return errors;
}
/**
 * Converts markdown to HTML
 * @param markdown - The markdown string to convert
 * @returns HTML string
 */
function markdownToHTML(markdown) {
    if (!markdown) {
        return "";
    }
    try {
        // Configure marked for security
        d.setOptions({
            breaks: true,
            gfm: true
        });
        const html = d.parse(markdown);
        // Sanitize the generated HTML
        return sanitizeHTML(html);
    }
    catch (error) {
        console.error("Error parsing markdown:", error);
        return escapeHTML(markdown);
    }
}
/**
 * Escapes HTML special characters
 * @param text - The text to escape
 * @returns Escaped text
 */
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Converts plain text to HTML with line breaks
 * @param text - The plain text to convert
 * @returns HTML string with line breaks
 */
function textToHTML(text) {
    if (!text) {
        return "";
    }
    // Escape HTML characters and convert line breaks to <br>
    const escaped = escapeHTML(text);
    return escaped.replace(/\n/g, "<br>");
}
/**
 * Processes content based on format and returns sanitized HTML
 * @param content - The content string
 * @param format - The content format (html, markdown, or text)
 * @returns Sanitized HTML string or escaped markdown
 */
function processContent(content, format) {
    if (!content) {
        return "";
    }
    switch (format) {
        case "html":
            return sanitizeHTML(content);
        case "markdown":
            // Convert markdown to HTML and sanitize it
            return markdownToHTML(content);
        case "text":
            return textToHTML(content);
        default:
            // Unrecognized format - treat as HTML and sanitize for safety
            console.warn(`Unrecognized content format "${format}", treating as HTML`);
            return sanitizeHTML(content);
    }
}
/**
 * Gets validation warnings for content based on format
 * @param content - The content string
 * @param format - The content format
 * @returns Array of warning messages
 */
function getContentWarnings(content, format) {
    if (!content) {
        return [];
    }
    switch (format) {
        case "html":
            // Validate both security issues and syntax
            const securityWarnings = validateHTML(content);
            const syntaxWarnings = validateHTMLSyntax(content);
            return [...securityWarnings, ...syntaxWarnings];
        case "markdown":
            // Check for dangerous HTML embedded in markdown
            // Users might try to include <script> tags in their markdown
            const htmlPattern = /<[^>]+>/g;
            const htmlMatches = content.match(htmlPattern);
            if (htmlMatches) {
                // Extract just the HTML parts and validate them
                const htmlContent = htmlMatches.join("");
                const htmlSecurityWarnings = validateHTML(htmlContent);
                const htmlSyntaxWarnings = validateHTMLSyntax(htmlContent);
                const allWarnings = [...htmlSecurityWarnings, ...htmlSyntaxWarnings];
                if (allWarnings.length > 0) {
                    return allWarnings.map((warning) => `Embedded HTML in markdown: ${warning}`);
                }
            }
            return [];
        case "text":
            // Text format doesn't need validation (everything is escaped)
            return [];
        default:
            return [];
    }
}

/**
 * Renders the FAQ items list in normal (non-edit) mode
 * Uses semantic HTML details/summary elements
 */
function FAQItemsList({ items, expandedItems, animationDuration, onToggleItem }) {
    return (jsx("div", { className: "faq-accordion-items", children: items.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const summaryValue = item.summary;
            const contentValue = item.content;
            const contentFormat = item.contentFormat;
            // Process content based on format and sanitize
            const processedContent = processContent(contentValue, contentFormat);
            // Get validation warnings (only for HTML format)
            const warnings = getContentWarnings(contentValue, contentFormat);
            return (jsxs("details", { className: classNames("faq-item", {
                    "faq-item--expanded": isExpanded
                }), open: isExpanded, style: {
                    "--animation-duration": `${animationDuration}ms`
                }, children: [jsxs("summary", { className: "faq-item-summary", onClick: (e) => {
                            e.preventDefault();
                            onToggleItem(index);
                        }, onKeyDown: (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onToggleItem(index);
                            }
                        }, tabIndex: 0, role: "button", "aria-expanded": isExpanded, children: [jsx("span", { className: "faq-item-summary-text", children: summaryValue }), jsx("span", { className: classNames("faq-item-icon", {
                                    "faq-item-icon--expanded": isExpanded
                                }), children: jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: jsx("path", { d: "M4 6L8 10L12 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }), jsxs("div", { className: "faq-item-content", children: [warnings.length > 0 && (jsx("div", { className: "faq-item-warnings", children: warnings.map((warning, wIndex) => (jsxs("div", { className: "faq-item-warning", children: ["\u26A0\uFE0F ", warning] }, wIndex))) })), jsx("div", { className: "faq-item-content-inner", dangerouslySetInnerHTML: { __html: processedContent } })] })] }, index));
        }) }));
}

function useCombinedRefs() {
  for (var _len = arguments.length, refs = new Array(_len), _key = 0; _key < _len; _key++) {
    refs[_key] = arguments[_key];
  }
  return useMemo(() => node => {
    refs.forEach(ref => ref(node));
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  refs);
}

// https://github.com/facebook/react/blob/master/packages/shared/ExecutionEnvironment.js
const canUseDOM = typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined';
function isWindow(element) {
  const elementString = Object.prototype.toString.call(element);
  return elementString === '[object Window]' ||
  // In Electron context the Window object serializes to [object global]
  elementString === '[object global]';
}
function isNode(node) {
  return 'nodeType' in node;
}
function getWindow(target) {
  var _target$ownerDocument, _target$ownerDocument2;
  if (!target) {
    return window;
  }
  if (isWindow(target)) {
    return target;
  }
  if (!isNode(target)) {
    return window;
  }
  return (_target$ownerDocument = (_target$ownerDocument2 = target.ownerDocument) == null ? void 0 : _target$ownerDocument2.defaultView) != null ? _target$ownerDocument : window;
}
function isDocument(node) {
  const {
    Document
  } = getWindow(node);
  return node instanceof Document;
}
function isHTMLElement(node) {
  if (isWindow(node)) {
    return false;
  }
  return node instanceof getWindow(node).HTMLElement;
}
function isSVGElement(node) {
  return node instanceof getWindow(node).SVGElement;
}
function getOwnerDocument(target) {
  if (!target) {
    return document;
  }
  if (isWindow(target)) {
    return target.document;
  }
  if (!isNode(target)) {
    return document;
  }
  if (isDocument(target)) {
    return target;
  }
  if (isHTMLElement(target) || isSVGElement(target)) {
    return target.ownerDocument;
  }
  return document;
}

/**
 * A hook that resolves to useEffect on the server and useLayoutEffect on the client
 * @param callback {function} Callback function that is invoked when the dependencies of the hook change
 */

const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;
function useEvent(handler) {
  const handlerRef = useRef(handler);
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  });
  return useCallback(function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return handlerRef.current == null ? void 0 : handlerRef.current(...args);
  }, []);
}
function useInterval() {
  const intervalRef = useRef(null);
  const set = useCallback((listener, duration) => {
    intervalRef.current = setInterval(listener, duration);
  }, []);
  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  return [set, clear];
}
function useLatestValue(value, dependencies) {
  if (dependencies === void 0) {
    dependencies = [value];
  }
  const valueRef = useRef(value);
  useIsomorphicLayoutEffect(() => {
    if (valueRef.current !== value) {
      valueRef.current = value;
    }
  }, dependencies);
  return valueRef;
}
function useLazyMemo(callback, dependencies) {
  const valueRef = useRef();
  return useMemo(() => {
    const newValue = callback(valueRef.current);
    valueRef.current = newValue;
    return newValue;
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [...dependencies]);
}
function useNodeRef(onChange) {
  const onChangeHandler = useEvent(onChange);
  const node = useRef(null);
  const setNodeRef = useCallback(element => {
    if (element !== node.current) {
      onChangeHandler == null ? void 0 : onChangeHandler(element, node.current);
    }
    node.current = element;
  },
  //eslint-disable-next-line
  []);
  return [node, setNodeRef];
}
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
let ids = {};
function useUniqueId(prefix, value) {
  return useMemo(() => {
    if (value) {
      return value;
    }
    const id = ids[prefix] == null ? 0 : ids[prefix] + 1;
    ids[prefix] = id;
    return prefix + "-" + id;
  }, [prefix, value]);
}
function createAdjustmentFn(modifier) {
  return function (object) {
    for (var _len = arguments.length, adjustments = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      adjustments[_key - 1] = arguments[_key];
    }
    return adjustments.reduce((accumulator, adjustment) => {
      const entries = Object.entries(adjustment);
      for (const [key, valueAdjustment] of entries) {
        const value = accumulator[key];
        if (value != null) {
          accumulator[key] = value + modifier * valueAdjustment;
        }
      }
      return accumulator;
    }, {
      ...object
    });
  };
}
const add = /*#__PURE__*/createAdjustmentFn(1);
const subtract = /*#__PURE__*/createAdjustmentFn(-1);
function hasViewportRelativeCoordinates(event) {
  return 'clientX' in event && 'clientY' in event;
}
function isKeyboardEvent(event) {
  if (!event) {
    return false;
  }
  const {
    KeyboardEvent
  } = getWindow(event.target);
  return KeyboardEvent && event instanceof KeyboardEvent;
}
function isTouchEvent(event) {
  if (!event) {
    return false;
  }
  const {
    TouchEvent
  } = getWindow(event.target);
  return TouchEvent && event instanceof TouchEvent;
}

/**
 * Returns the normalized x and y coordinates for mouse and touch events.
 */

function getEventCoordinates(event) {
  if (isTouchEvent(event)) {
    if (event.touches && event.touches.length) {
      const {
        clientX: x,
        clientY: y
      } = event.touches[0];
      return {
        x,
        y
      };
    } else if (event.changedTouches && event.changedTouches.length) {
      const {
        clientX: x,
        clientY: y
      } = event.changedTouches[0];
      return {
        x,
        y
      };
    }
  }
  if (hasViewportRelativeCoordinates(event)) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }
  return null;
}
const CSS = /*#__PURE__*/Object.freeze({
  Translate: {
    toString(transform) {
      if (!transform) {
        return;
      }
      const {
        x,
        y
      } = transform;
      return "translate3d(" + (x ? Math.round(x) : 0) + "px, " + (y ? Math.round(y) : 0) + "px, 0)";
    }
  },
  Scale: {
    toString(transform) {
      if (!transform) {
        return;
      }
      const {
        scaleX,
        scaleY
      } = transform;
      return "scaleX(" + scaleX + ") scaleY(" + scaleY + ")";
    }
  },
  Transform: {
    toString(transform) {
      if (!transform) {
        return;
      }
      return [CSS.Translate.toString(transform), CSS.Scale.toString(transform)].join(' ');
    }
  },
  Transition: {
    toString(_ref) {
      let {
        property,
        duration,
        easing
      } = _ref;
      return property + " " + duration + "ms " + easing;
    }
  }
});
const SELECTOR = 'a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]';
function findFirstFocusableNode(element) {
  if (element.matches(SELECTOR)) {
    return element;
  }
  return element.querySelector(SELECTOR);
}

const hiddenStyles = {
  display: 'none'
};
function HiddenText(_ref) {
  let {
    id,
    value
  } = _ref;
  return React.createElement("div", {
    id: id,
    style: hiddenStyles
  }, value);
}
function LiveRegion(_ref) {
  let {
    id,
    announcement,
    ariaLiveType = "assertive"
  } = _ref;
  // Hide element visually but keep it readable by screen readers
  const visuallyHidden = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    margin: -1,
    border: 0,
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(100%)',
    whiteSpace: 'nowrap'
  };
  return React.createElement("div", {
    id: id,
    style: visuallyHidden,
    role: "status",
    "aria-live": ariaLiveType,
    "aria-atomic": true
  }, announcement);
}
function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback(value => {
    if (value != null) {
      setAnnouncement(value);
    }
  }, []);
  return {
    announce,
    announcement
  };
}

const DndMonitorContext = /*#__PURE__*/createContext(null);
function useDndMonitor(listener) {
  const registerListener = useContext(DndMonitorContext);
  useEffect(() => {
    if (!registerListener) {
      throw new Error('useDndMonitor must be used within a children of <DndContext>');
    }
    const unsubscribe = registerListener(listener);
    return unsubscribe;
  }, [listener, registerListener]);
}
function useDndMonitorProvider() {
  const [listeners] = useState(() => new Set());
  const registerListener = useCallback(listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [listeners]);
  const dispatch = useCallback(_ref => {
    let {
      type,
      event
    } = _ref;
    listeners.forEach(listener => {
      var _listener$type;
      return (_listener$type = listener[type]) == null ? void 0 : _listener$type.call(listener, event);
    });
  }, [listeners]);
  return [dispatch, registerListener];
}
const defaultScreenReaderInstructions = {
  draggable: "\n    To pick up a draggable item, press the space bar.\n    While dragging, use the arrow keys to move the item.\n    Press space again to drop the item in its new position, or press escape to cancel.\n  "
};
const defaultAnnouncements = {
  onDragStart(_ref) {
    let {
      active
    } = _ref;
    return "Picked up draggable item " + active.id + ".";
  },
  onDragOver(_ref2) {
    let {
      active,
      over
    } = _ref2;
    if (over) {
      return "Draggable item " + active.id + " was moved over droppable area " + over.id + ".";
    }
    return "Draggable item " + active.id + " is no longer over a droppable area.";
  },
  onDragEnd(_ref3) {
    let {
      active,
      over
    } = _ref3;
    if (over) {
      return "Draggable item " + active.id + " was dropped over droppable area " + over.id;
    }
    return "Draggable item " + active.id + " was dropped.";
  },
  onDragCancel(_ref4) {
    let {
      active
    } = _ref4;
    return "Dragging was cancelled. Draggable item " + active.id + " was dropped.";
  }
};
function Accessibility(_ref) {
  let {
    announcements = defaultAnnouncements,
    container,
    hiddenTextDescribedById,
    screenReaderInstructions = defaultScreenReaderInstructions
  } = _ref;
  const {
    announce,
    announcement
  } = useAnnouncement();
  const liveRegionId = useUniqueId("DndLiveRegion");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useDndMonitor(useMemo(() => ({
    onDragStart(_ref2) {
      let {
        active
      } = _ref2;
      announce(announcements.onDragStart({
        active
      }));
    },
    onDragMove(_ref3) {
      let {
        active,
        over
      } = _ref3;
      if (announcements.onDragMove) {
        announce(announcements.onDragMove({
          active,
          over
        }));
      }
    },
    onDragOver(_ref4) {
      let {
        active,
        over
      } = _ref4;
      announce(announcements.onDragOver({
        active,
        over
      }));
    },
    onDragEnd(_ref5) {
      let {
        active,
        over
      } = _ref5;
      announce(announcements.onDragEnd({
        active,
        over
      }));
    },
    onDragCancel(_ref6) {
      let {
        active,
        over
      } = _ref6;
      announce(announcements.onDragCancel({
        active,
        over
      }));
    }
  }), [announce, announcements]));
  if (!mounted) {
    return null;
  }
  const markup = React.createElement(React.Fragment, null, React.createElement(HiddenText, {
    id: hiddenTextDescribedById,
    value: screenReaderInstructions.draggable
  }), React.createElement(LiveRegion, {
    id: liveRegionId,
    announcement: announcement
  }));
  return container ? createPortal(markup, container) : markup;
}
var Action;
(function (Action) {
  Action["DragStart"] = "dragStart";
  Action["DragMove"] = "dragMove";
  Action["DragEnd"] = "dragEnd";
  Action["DragCancel"] = "dragCancel";
  Action["DragOver"] = "dragOver";
  Action["RegisterDroppable"] = "registerDroppable";
  Action["SetDroppableDisabled"] = "setDroppableDisabled";
  Action["UnregisterDroppable"] = "unregisterDroppable";
})(Action || (Action = {}));
function noop() {}
function useSensor(sensor, options) {
  return useMemo(() => ({
    sensor,
    options: options != null ? options : {}
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [sensor, options]);
}
function useSensors() {
  for (var _len = arguments.length, sensors = new Array(_len), _key = 0; _key < _len; _key++) {
    sensors[_key] = arguments[_key];
  }
  return useMemo(() => [...sensors].filter(sensor => sensor != null),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [...sensors]);
}
const defaultCoordinates = /*#__PURE__*/Object.freeze({
  x: 0,
  y: 0
});

/**
 * Returns the distance between two points
 */
function distanceBetween(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Sort collisions from smallest to greatest value
 */
function sortCollisionsAsc(_ref, _ref2) {
  let {
    data: {
      value: a
    }
  } = _ref;
  let {
    data: {
      value: b
    }
  } = _ref2;
  return a - b;
}
/**
 * Sort collisions from greatest to smallest value
 */

function sortCollisionsDesc(_ref3, _ref4) {
  let {
    data: {
      value: a
    }
  } = _ref3;
  let {
    data: {
      value: b
    }
  } = _ref4;
  return b - a;
}
/**
 * Returns the coordinates of the corners of a given rectangle:
 * [TopLeft {x, y}, TopRight {x, y}, BottomLeft {x, y}, BottomRight {x, y}]
 */

function cornersOfRectangle(_ref5) {
  let {
    left,
    top,
    height,
    width
  } = _ref5;
  return [{
    x: left,
    y: top
  }, {
    x: left + width,
    y: top
  }, {
    x: left,
    y: top + height
  }, {
    x: left + width,
    y: top + height
  }];
}
function getFirstCollision(collisions, property) {
  if (!collisions || collisions.length === 0) {
    return null;
  }
  const [firstCollision] = collisions;
  return property ? firstCollision[property] : firstCollision;
}

/**
 * Returns the coordinates of the center of a given ClientRect
 */

function centerOfRectangle(rect, left, top) {
  if (left === void 0) {
    left = rect.left;
  }
  if (top === void 0) {
    top = rect.top;
  }
  return {
    x: left + rect.width * 0.5,
    y: top + rect.height * 0.5
  };
}
/**
 * Returns the closest rectangles from an array of rectangles to the center of a given
 * rectangle.
 */

const closestCenter = _ref => {
  let {
    collisionRect,
    droppableRects,
    droppableContainers
  } = _ref;
  const centerRect = centerOfRectangle(collisionRect, collisionRect.left, collisionRect.top);
  const collisions = [];
  for (const droppableContainer of droppableContainers) {
    const {
      id
    } = droppableContainer;
    const rect = droppableRects.get(id);
    if (rect) {
      const distBetween = distanceBetween(centerOfRectangle(rect), centerRect);
      collisions.push({
        id,
        data: {
          droppableContainer,
          value: distBetween
        }
      });
    }
  }
  return collisions.sort(sortCollisionsAsc);
};

/**
 * Returns the closest rectangles from an array of rectangles to the corners of
 * another rectangle.
 */

const closestCorners = _ref => {
  let {
    collisionRect,
    droppableRects,
    droppableContainers
  } = _ref;
  const corners = cornersOfRectangle(collisionRect);
  const collisions = [];
  for (const droppableContainer of droppableContainers) {
    const {
      id
    } = droppableContainer;
    const rect = droppableRects.get(id);
    if (rect) {
      const rectCorners = cornersOfRectangle(rect);
      const distances = corners.reduce((accumulator, corner, index) => {
        return accumulator + distanceBetween(rectCorners[index], corner);
      }, 0);
      const effectiveDistance = Number((distances / 4).toFixed(4));
      collisions.push({
        id,
        data: {
          droppableContainer,
          value: effectiveDistance
        }
      });
    }
  }
  return collisions.sort(sortCollisionsAsc);
};

/**
 * Returns the intersecting rectangle area between two rectangles
 */

function getIntersectionRatio(entry, target) {
  const top = Math.max(target.top, entry.top);
  const left = Math.max(target.left, entry.left);
  const right = Math.min(target.left + target.width, entry.left + entry.width);
  const bottom = Math.min(target.top + target.height, entry.top + entry.height);
  const width = right - left;
  const height = bottom - top;
  if (left < right && top < bottom) {
    const targetArea = target.width * target.height;
    const entryArea = entry.width * entry.height;
    const intersectionArea = width * height;
    const intersectionRatio = intersectionArea / (targetArea + entryArea - intersectionArea);
    return Number(intersectionRatio.toFixed(4));
  } // Rectangles do not overlap, or overlap has an area of zero (edge/corner overlap)

  return 0;
}
/**
 * Returns the rectangles that has the greatest intersection area with a given
 * rectangle in an array of rectangles.
 */

const rectIntersection = _ref => {
  let {
    collisionRect,
    droppableRects,
    droppableContainers
  } = _ref;
  const collisions = [];
  for (const droppableContainer of droppableContainers) {
    const {
      id
    } = droppableContainer;
    const rect = droppableRects.get(id);
    if (rect) {
      const intersectionRatio = getIntersectionRatio(rect, collisionRect);
      if (intersectionRatio > 0) {
        collisions.push({
          id,
          data: {
            droppableContainer,
            value: intersectionRatio
          }
        });
      }
    }
  }
  return collisions.sort(sortCollisionsDesc);
};
function adjustScale(transform, rect1, rect2) {
  return {
    ...transform,
    scaleX: rect1 && rect2 ? rect1.width / rect2.width : 1,
    scaleY: rect1 && rect2 ? rect1.height / rect2.height : 1
  };
}
function getRectDelta(rect1, rect2) {
  return rect1 && rect2 ? {
    x: rect1.left - rect2.left,
    y: rect1.top - rect2.top
  } : defaultCoordinates;
}
function createRectAdjustmentFn(modifier) {
  return function adjustClientRect(rect) {
    for (var _len = arguments.length, adjustments = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      adjustments[_key - 1] = arguments[_key];
    }
    return adjustments.reduce((acc, adjustment) => ({
      ...acc,
      top: acc.top + modifier * adjustment.y,
      bottom: acc.bottom + modifier * adjustment.y,
      left: acc.left + modifier * adjustment.x,
      right: acc.right + modifier * adjustment.x
    }), {
      ...rect
    });
  };
}
const getAdjustedRect = /*#__PURE__*/createRectAdjustmentFn(1);
function parseTransform(transform) {
  if (transform.startsWith('matrix3d(')) {
    const transformArray = transform.slice(9, -1).split(/, /);
    return {
      x: +transformArray[12],
      y: +transformArray[13],
      scaleX: +transformArray[0],
      scaleY: +transformArray[5]
    };
  } else if (transform.startsWith('matrix(')) {
    const transformArray = transform.slice(7, -1).split(/, /);
    return {
      x: +transformArray[4],
      y: +transformArray[5],
      scaleX: +transformArray[0],
      scaleY: +transformArray[3]
    };
  }
  return null;
}
function inverseTransform(rect, transform, transformOrigin) {
  const parsedTransform = parseTransform(transform);
  if (!parsedTransform) {
    return rect;
  }
  const {
    scaleX,
    scaleY,
    x: translateX,
    y: translateY
  } = parsedTransform;
  const x = rect.left - translateX - (1 - scaleX) * parseFloat(transformOrigin);
  const y = rect.top - translateY - (1 - scaleY) * parseFloat(transformOrigin.slice(transformOrigin.indexOf(' ') + 1));
  const w = scaleX ? rect.width / scaleX : rect.width;
  const h = scaleY ? rect.height / scaleY : rect.height;
  return {
    width: w,
    height: h,
    top: y,
    right: x + w,
    bottom: y + h,
    left: x
  };
}
const defaultOptions = {
  ignoreTransform: false
};
/**
 * Returns the bounding client rect of an element relative to the viewport.
 */

function getClientRect(element, options) {
  if (options === void 0) {
    options = defaultOptions;
  }
  let rect = element.getBoundingClientRect();
  if (options.ignoreTransform) {
    const {
      transform,
      transformOrigin
    } = getWindow(element).getComputedStyle(element);
    if (transform) {
      rect = inverseTransform(rect, transform, transformOrigin);
    }
  }
  const {
    top,
    left,
    width,
    height,
    bottom,
    right
  } = rect;
  return {
    top,
    left,
    width,
    height,
    bottom,
    right
  };
}
/**
 * Returns the bounding client rect of an element relative to the viewport.
 *
 * @remarks
 * The ClientRect returned by this method does not take into account transforms
 * applied to the element it measures.
 *
 */

function getTransformAgnosticClientRect(element) {
  return getClientRect(element, {
    ignoreTransform: true
  });
}
function getWindowClientRect(element) {
  const width = element.innerWidth;
  const height = element.innerHeight;
  return {
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height
  };
}
function isFixed(node, computedStyle) {
  if (computedStyle === void 0) {
    computedStyle = getWindow(node).getComputedStyle(node);
  }
  return computedStyle.position === 'fixed';
}
function isScrollable(element, computedStyle) {
  if (computedStyle === void 0) {
    computedStyle = getWindow(element).getComputedStyle(element);
  }
  const overflowRegex = /(auto|scroll|overlay)/;
  const properties = ['overflow', 'overflowX', 'overflowY'];
  return properties.some(property => {
    const value = computedStyle[property];
    return typeof value === 'string' ? overflowRegex.test(value) : false;
  });
}
function getScrollableAncestors(element, limit) {
  const scrollParents = [];
  function findScrollableAncestors(node) {
    if (limit != null && scrollParents.length >= limit) {
      return scrollParents;
    }
    if (!node) {
      return scrollParents;
    }
    if (isDocument(node) && node.scrollingElement != null && !scrollParents.includes(node.scrollingElement)) {
      scrollParents.push(node.scrollingElement);
      return scrollParents;
    }
    if (!isHTMLElement(node) || isSVGElement(node)) {
      return scrollParents;
    }
    if (scrollParents.includes(node)) {
      return scrollParents;
    }
    const computedStyle = getWindow(element).getComputedStyle(node);
    if (node !== element) {
      if (isScrollable(node, computedStyle)) {
        scrollParents.push(node);
      }
    }
    if (isFixed(node, computedStyle)) {
      return scrollParents;
    }
    return findScrollableAncestors(node.parentNode);
  }
  if (!element) {
    return scrollParents;
  }
  return findScrollableAncestors(element);
}
function getFirstScrollableAncestor(node) {
  const [firstScrollableAncestor] = getScrollableAncestors(node, 1);
  return firstScrollableAncestor != null ? firstScrollableAncestor : null;
}
function getScrollableElement(element) {
  if (!canUseDOM || !element) {
    return null;
  }
  if (isWindow(element)) {
    return element;
  }
  if (!isNode(element)) {
    return null;
  }
  if (isDocument(element) || element === getOwnerDocument(element).scrollingElement) {
    return window;
  }
  if (isHTMLElement(element)) {
    return element;
  }
  return null;
}
function getScrollXCoordinate(element) {
  if (isWindow(element)) {
    return element.scrollX;
  }
  return element.scrollLeft;
}
function getScrollYCoordinate(element) {
  if (isWindow(element)) {
    return element.scrollY;
  }
  return element.scrollTop;
}
function getScrollCoordinates(element) {
  return {
    x: getScrollXCoordinate(element),
    y: getScrollYCoordinate(element)
  };
}
var Direction;
(function (Direction) {
  Direction[Direction["Forward"] = 1] = "Forward";
  Direction[Direction["Backward"] = -1] = "Backward";
})(Direction || (Direction = {}));
function isDocumentScrollingElement(element) {
  if (!canUseDOM || !element) {
    return false;
  }
  return element === document.scrollingElement;
}
function getScrollPosition(scrollingContainer) {
  const minScroll = {
    x: 0,
    y: 0
  };
  const dimensions = isDocumentScrollingElement(scrollingContainer) ? {
    height: window.innerHeight,
    width: window.innerWidth
  } : {
    height: scrollingContainer.clientHeight,
    width: scrollingContainer.clientWidth
  };
  const maxScroll = {
    x: scrollingContainer.scrollWidth - dimensions.width,
    y: scrollingContainer.scrollHeight - dimensions.height
  };
  const isTop = scrollingContainer.scrollTop <= minScroll.y;
  const isLeft = scrollingContainer.scrollLeft <= minScroll.x;
  const isBottom = scrollingContainer.scrollTop >= maxScroll.y;
  const isRight = scrollingContainer.scrollLeft >= maxScroll.x;
  return {
    isTop,
    isLeft,
    isBottom,
    isRight,
    maxScroll,
    minScroll
  };
}
const defaultThreshold = {
  x: 0.2,
  y: 0.2
};
function getScrollDirectionAndSpeed(scrollContainer, scrollContainerRect, _ref, acceleration, thresholdPercentage) {
  let {
    top,
    left,
    right,
    bottom
  } = _ref;
  if (acceleration === void 0) {
    acceleration = 10;
  }
  if (thresholdPercentage === void 0) {
    thresholdPercentage = defaultThreshold;
  }
  const {
    isTop,
    isBottom,
    isLeft,
    isRight
  } = getScrollPosition(scrollContainer);
  const direction = {
    x: 0,
    y: 0
  };
  const speed = {
    x: 0,
    y: 0
  };
  const threshold = {
    height: scrollContainerRect.height * thresholdPercentage.y,
    width: scrollContainerRect.width * thresholdPercentage.x
  };
  if (!isTop && top <= scrollContainerRect.top + threshold.height) {
    // Scroll Up
    direction.y = Direction.Backward;
    speed.y = acceleration * Math.abs((scrollContainerRect.top + threshold.height - top) / threshold.height);
  } else if (!isBottom && bottom >= scrollContainerRect.bottom - threshold.height) {
    // Scroll Down
    direction.y = Direction.Forward;
    speed.y = acceleration * Math.abs((scrollContainerRect.bottom - threshold.height - bottom) / threshold.height);
  }
  if (!isRight && right >= scrollContainerRect.right - threshold.width) {
    // Scroll Right
    direction.x = Direction.Forward;
    speed.x = acceleration * Math.abs((scrollContainerRect.right - threshold.width - right) / threshold.width);
  } else if (!isLeft && left <= scrollContainerRect.left + threshold.width) {
    // Scroll Left
    direction.x = Direction.Backward;
    speed.x = acceleration * Math.abs((scrollContainerRect.left + threshold.width - left) / threshold.width);
  }
  return {
    direction,
    speed
  };
}
function getScrollElementRect(element) {
  if (element === document.scrollingElement) {
    const {
      innerWidth,
      innerHeight
    } = window;
    return {
      top: 0,
      left: 0,
      right: innerWidth,
      bottom: innerHeight,
      width: innerWidth,
      height: innerHeight
    };
  }
  const {
    top,
    left,
    right,
    bottom
  } = element.getBoundingClientRect();
  return {
    top,
    left,
    right,
    bottom,
    width: element.clientWidth,
    height: element.clientHeight
  };
}
function getScrollOffsets(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return add(acc, getScrollCoordinates(node));
  }, defaultCoordinates);
}
function getScrollXOffset(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return acc + getScrollXCoordinate(node);
  }, 0);
}
function getScrollYOffset(scrollableAncestors) {
  return scrollableAncestors.reduce((acc, node) => {
    return acc + getScrollYCoordinate(node);
  }, 0);
}
function scrollIntoViewIfNeeded(element, measure) {
  if (measure === void 0) {
    measure = getClientRect;
  }
  if (!element) {
    return;
  }
  const {
    top,
    left,
    bottom,
    right
  } = measure(element);
  const firstScrollableAncestor = getFirstScrollableAncestor(element);
  if (!firstScrollableAncestor) {
    return;
  }
  if (bottom <= 0 || right <= 0 || top >= window.innerHeight || left >= window.innerWidth) {
    element.scrollIntoView({
      block: 'center',
      inline: 'center'
    });
  }
}
const properties = [['x', ['left', 'right'], getScrollXOffset], ['y', ['top', 'bottom'], getScrollYOffset]];
class Rect {
  constructor(rect, element) {
    this.rect = void 0;
    this.width = void 0;
    this.height = void 0;
    this.top = void 0;
    this.bottom = void 0;
    this.right = void 0;
    this.left = void 0;
    const scrollableAncestors = getScrollableAncestors(element);
    const scrollOffsets = getScrollOffsets(scrollableAncestors);
    this.rect = {
      ...rect
    };
    this.width = rect.width;
    this.height = rect.height;
    for (const [axis, keys, getScrollOffset] of properties) {
      for (const key of keys) {
        Object.defineProperty(this, key, {
          get: () => {
            const currentOffsets = getScrollOffset(scrollableAncestors);
            const scrollOffsetsDeltla = scrollOffsets[axis] - currentOffsets;
            return this.rect[key] + scrollOffsetsDeltla;
          },
          enumerable: true
        });
      }
    }
    Object.defineProperty(this, 'rect', {
      enumerable: false
    });
  }
}
class Listeners {
  constructor(target) {
    this.target = void 0;
    this.listeners = [];
    this.removeAll = () => {
      this.listeners.forEach(listener => {
        var _this$target;
        return (_this$target = this.target) == null ? void 0 : _this$target.removeEventListener(...listener);
      });
    };
    this.target = target;
  }
  add(eventName, handler, options) {
    var _this$target2;
    (_this$target2 = this.target) == null ? void 0 : _this$target2.addEventListener(eventName, handler, options);
    this.listeners.push([eventName, handler, options]);
  }
}
function getEventListenerTarget(target) {
  // If the `event.target` element is removed from the document events will still be targeted
  // at it, and hence won't always bubble up to the window or document anymore.
  // If there is any risk of an element being removed while it is being dragged,
  // the best practice is to attach the event listeners directly to the target.
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  const {
    EventTarget
  } = getWindow(target);
  return target instanceof EventTarget ? target : getOwnerDocument(target);
}
function hasExceededDistance(delta, measurement) {
  const dx = Math.abs(delta.x);
  const dy = Math.abs(delta.y);
  if (typeof measurement === 'number') {
    return Math.sqrt(dx ** 2 + dy ** 2) > measurement;
  }
  if ('x' in measurement && 'y' in measurement) {
    return dx > measurement.x && dy > measurement.y;
  }
  if ('x' in measurement) {
    return dx > measurement.x;
  }
  if ('y' in measurement) {
    return dy > measurement.y;
  }
  return false;
}
var EventName;
(function (EventName) {
  EventName["Click"] = "click";
  EventName["DragStart"] = "dragstart";
  EventName["Keydown"] = "keydown";
  EventName["ContextMenu"] = "contextmenu";
  EventName["Resize"] = "resize";
  EventName["SelectionChange"] = "selectionchange";
  EventName["VisibilityChange"] = "visibilitychange";
})(EventName || (EventName = {}));
function preventDefault(event) {
  event.preventDefault();
}
function stopPropagation(event) {
  event.stopPropagation();
}
var KeyboardCode;
(function (KeyboardCode) {
  KeyboardCode["Space"] = "Space";
  KeyboardCode["Down"] = "ArrowDown";
  KeyboardCode["Right"] = "ArrowRight";
  KeyboardCode["Left"] = "ArrowLeft";
  KeyboardCode["Up"] = "ArrowUp";
  KeyboardCode["Esc"] = "Escape";
  KeyboardCode["Enter"] = "Enter";
  KeyboardCode["Tab"] = "Tab";
})(KeyboardCode || (KeyboardCode = {}));
const defaultKeyboardCodes = {
  start: [KeyboardCode.Space, KeyboardCode.Enter],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab]
};
const defaultKeyboardCoordinateGetter = (event, _ref) => {
  let {
    currentCoordinates
  } = _ref;
  switch (event.code) {
    case KeyboardCode.Right:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x + 25
      };
    case KeyboardCode.Left:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x - 25
      };
    case KeyboardCode.Down:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + 25
      };
    case KeyboardCode.Up:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - 25
      };
  }
  return undefined;
};
class KeyboardSensor {
  constructor(props) {
    this.props = void 0;
    this.autoScrollEnabled = false;
    this.referenceCoordinates = void 0;
    this.listeners = void 0;
    this.windowListeners = void 0;
    this.props = props;
    const {
      event: {
        target
      }
    } = props;
    this.props = props;
    this.listeners = new Listeners(getOwnerDocument(target));
    this.windowListeners = new Listeners(getWindow(target));
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.attach();
  }
  attach() {
    this.handleStart();
    this.windowListeners.add(EventName.Resize, this.handleCancel);
    this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
    setTimeout(() => this.listeners.add(EventName.Keydown, this.handleKeyDown));
  }
  handleStart() {
    const {
      activeNode,
      onStart
    } = this.props;
    const node = activeNode.node.current;
    if (node) {
      scrollIntoViewIfNeeded(node);
    }
    onStart(defaultCoordinates);
  }
  handleKeyDown(event) {
    if (isKeyboardEvent(event)) {
      const {
        active,
        context,
        options
      } = this.props;
      const {
        keyboardCodes = defaultKeyboardCodes,
        coordinateGetter = defaultKeyboardCoordinateGetter,
        scrollBehavior = 'smooth'
      } = options;
      const {
        code
      } = event;
      if (keyboardCodes.end.includes(code)) {
        this.handleEnd(event);
        return;
      }
      if (keyboardCodes.cancel.includes(code)) {
        this.handleCancel(event);
        return;
      }
      const {
        collisionRect
      } = context.current;
      const currentCoordinates = collisionRect ? {
        x: collisionRect.left,
        y: collisionRect.top
      } : defaultCoordinates;
      if (!this.referenceCoordinates) {
        this.referenceCoordinates = currentCoordinates;
      }
      const newCoordinates = coordinateGetter(event, {
        active,
        context: context.current,
        currentCoordinates
      });
      if (newCoordinates) {
        const coordinatesDelta = subtract(newCoordinates, currentCoordinates);
        const scrollDelta = {
          x: 0,
          y: 0
        };
        const {
          scrollableAncestors
        } = context.current;
        for (const scrollContainer of scrollableAncestors) {
          const direction = event.code;
          const {
            isTop,
            isRight,
            isLeft,
            isBottom,
            maxScroll,
            minScroll
          } = getScrollPosition(scrollContainer);
          const scrollElementRect = getScrollElementRect(scrollContainer);
          const clampedCoordinates = {
            x: Math.min(direction === KeyboardCode.Right ? scrollElementRect.right - scrollElementRect.width / 2 : scrollElementRect.right, Math.max(direction === KeyboardCode.Right ? scrollElementRect.left : scrollElementRect.left + scrollElementRect.width / 2, newCoordinates.x)),
            y: Math.min(direction === KeyboardCode.Down ? scrollElementRect.bottom - scrollElementRect.height / 2 : scrollElementRect.bottom, Math.max(direction === KeyboardCode.Down ? scrollElementRect.top : scrollElementRect.top + scrollElementRect.height / 2, newCoordinates.y))
          };
          const canScrollX = direction === KeyboardCode.Right && !isRight || direction === KeyboardCode.Left && !isLeft;
          const canScrollY = direction === KeyboardCode.Down && !isBottom || direction === KeyboardCode.Up && !isTop;
          if (canScrollX && clampedCoordinates.x !== newCoordinates.x) {
            const newScrollCoordinates = scrollContainer.scrollLeft + coordinatesDelta.x;
            const canScrollToNewCoordinates = direction === KeyboardCode.Right && newScrollCoordinates <= maxScroll.x || direction === KeyboardCode.Left && newScrollCoordinates >= minScroll.x;
            if (canScrollToNewCoordinates && !coordinatesDelta.y) {
              // We don't need to update coordinates, the scroll adjustment alone will trigger
              // logic to auto-detect the new container we are over
              scrollContainer.scrollTo({
                left: newScrollCoordinates,
                behavior: scrollBehavior
              });
              return;
            }
            if (canScrollToNewCoordinates) {
              scrollDelta.x = scrollContainer.scrollLeft - newScrollCoordinates;
            } else {
              scrollDelta.x = direction === KeyboardCode.Right ? scrollContainer.scrollLeft - maxScroll.x : scrollContainer.scrollLeft - minScroll.x;
            }
            if (scrollDelta.x) {
              scrollContainer.scrollBy({
                left: -scrollDelta.x,
                behavior: scrollBehavior
              });
            }
            break;
          } else if (canScrollY && clampedCoordinates.y !== newCoordinates.y) {
            const newScrollCoordinates = scrollContainer.scrollTop + coordinatesDelta.y;
            const canScrollToNewCoordinates = direction === KeyboardCode.Down && newScrollCoordinates <= maxScroll.y || direction === KeyboardCode.Up && newScrollCoordinates >= minScroll.y;
            if (canScrollToNewCoordinates && !coordinatesDelta.x) {
              // We don't need to update coordinates, the scroll adjustment alone will trigger
              // logic to auto-detect the new container we are over
              scrollContainer.scrollTo({
                top: newScrollCoordinates,
                behavior: scrollBehavior
              });
              return;
            }
            if (canScrollToNewCoordinates) {
              scrollDelta.y = scrollContainer.scrollTop - newScrollCoordinates;
            } else {
              scrollDelta.y = direction === KeyboardCode.Down ? scrollContainer.scrollTop - maxScroll.y : scrollContainer.scrollTop - minScroll.y;
            }
            if (scrollDelta.y) {
              scrollContainer.scrollBy({
                top: -scrollDelta.y,
                behavior: scrollBehavior
              });
            }
            break;
          }
        }
        this.handleMove(event, add(subtract(newCoordinates, this.referenceCoordinates), scrollDelta));
      }
    }
  }
  handleMove(event, coordinates) {
    const {
      onMove
    } = this.props;
    event.preventDefault();
    onMove(coordinates);
  }
  handleEnd(event) {
    const {
      onEnd
    } = this.props;
    event.preventDefault();
    this.detach();
    onEnd();
  }
  handleCancel(event) {
    const {
      onCancel
    } = this.props;
    event.preventDefault();
    this.detach();
    onCancel();
  }
  detach() {
    this.listeners.removeAll();
    this.windowListeners.removeAll();
  }
}
KeyboardSensor.activators = [{
  eventName: 'onKeyDown',
  handler: (event, _ref, _ref2) => {
    let {
      keyboardCodes = defaultKeyboardCodes,
      onActivation
    } = _ref;
    let {
      active
    } = _ref2;
    const {
      code
    } = event.nativeEvent;
    if (keyboardCodes.start.includes(code)) {
      const activator = active.activatorNode.current;
      if (activator && event.target !== activator) {
        return false;
      }
      event.preventDefault();
      onActivation == null ? void 0 : onActivation({
        event: event.nativeEvent
      });
      return true;
    }
    return false;
  }
}];
function isDistanceConstraint(constraint) {
  return Boolean(constraint && 'distance' in constraint);
}
function isDelayConstraint(constraint) {
  return Boolean(constraint && 'delay' in constraint);
}
class AbstractPointerSensor {
  constructor(props, events, listenerTarget) {
    var _getEventCoordinates;
    if (listenerTarget === void 0) {
      listenerTarget = getEventListenerTarget(props.event.target);
    }
    this.props = void 0;
    this.events = void 0;
    this.autoScrollEnabled = true;
    this.document = void 0;
    this.activated = false;
    this.initialCoordinates = void 0;
    this.timeoutId = null;
    this.listeners = void 0;
    this.documentListeners = void 0;
    this.windowListeners = void 0;
    this.props = props;
    this.events = events;
    const {
      event
    } = props;
    const {
      target
    } = event;
    this.props = props;
    this.events = events;
    this.document = getOwnerDocument(target);
    this.documentListeners = new Listeners(this.document);
    this.listeners = new Listeners(listenerTarget);
    this.windowListeners = new Listeners(getWindow(target));
    this.initialCoordinates = (_getEventCoordinates = getEventCoordinates(event)) != null ? _getEventCoordinates : defaultCoordinates;
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.removeTextSelection = this.removeTextSelection.bind(this);
    this.attach();
  }
  attach() {
    const {
      events,
      props: {
        options: {
          activationConstraint,
          bypassActivationConstraint
        }
      }
    } = this;
    this.listeners.add(events.move.name, this.handleMove, {
      passive: false
    });
    this.listeners.add(events.end.name, this.handleEnd);
    if (events.cancel) {
      this.listeners.add(events.cancel.name, this.handleCancel);
    }
    this.windowListeners.add(EventName.Resize, this.handleCancel);
    this.windowListeners.add(EventName.DragStart, preventDefault);
    this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
    this.windowListeners.add(EventName.ContextMenu, preventDefault);
    this.documentListeners.add(EventName.Keydown, this.handleKeydown);
    if (activationConstraint) {
      if (bypassActivationConstraint != null && bypassActivationConstraint({
        event: this.props.event,
        activeNode: this.props.activeNode,
        options: this.props.options
      })) {
        return this.handleStart();
      }
      if (isDelayConstraint(activationConstraint)) {
        this.timeoutId = setTimeout(this.handleStart, activationConstraint.delay);
        this.handlePending(activationConstraint);
        return;
      }
      if (isDistanceConstraint(activationConstraint)) {
        this.handlePending(activationConstraint);
        return;
      }
    }
    this.handleStart();
  }
  detach() {
    this.listeners.removeAll();
    this.windowListeners.removeAll(); // Wait until the next event loop before removing document listeners
    // This is necessary because we listen for `click` and `selection` events on the document

    setTimeout(this.documentListeners.removeAll, 50);
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  handlePending(constraint, offset) {
    const {
      active,
      onPending
    } = this.props;
    onPending(active, constraint, this.initialCoordinates, offset);
  }
  handleStart() {
    const {
      initialCoordinates
    } = this;
    const {
      onStart
    } = this.props;
    if (initialCoordinates) {
      this.activated = true; // Stop propagation of click events once activation constraints are met

      this.documentListeners.add(EventName.Click, stopPropagation, {
        capture: true
      }); // Remove any text selection from the document

      this.removeTextSelection(); // Prevent further text selection while dragging

      this.documentListeners.add(EventName.SelectionChange, this.removeTextSelection);
      onStart(initialCoordinates);
    }
  }
  handleMove(event) {
    var _getEventCoordinates2;
    const {
      activated,
      initialCoordinates,
      props
    } = this;
    const {
      onMove,
      options: {
        activationConstraint
      }
    } = props;
    if (!initialCoordinates) {
      return;
    }
    const coordinates = (_getEventCoordinates2 = getEventCoordinates(event)) != null ? _getEventCoordinates2 : defaultCoordinates;
    const delta = subtract(initialCoordinates, coordinates); // Constraint validation

    if (!activated && activationConstraint) {
      if (isDistanceConstraint(activationConstraint)) {
        if (activationConstraint.tolerance != null && hasExceededDistance(delta, activationConstraint.tolerance)) {
          return this.handleCancel();
        }
        if (hasExceededDistance(delta, activationConstraint.distance)) {
          return this.handleStart();
        }
      }
      if (isDelayConstraint(activationConstraint)) {
        if (hasExceededDistance(delta, activationConstraint.tolerance)) {
          return this.handleCancel();
        }
      }
      this.handlePending(activationConstraint, delta);
      return;
    }
    if (event.cancelable) {
      event.preventDefault();
    }
    onMove(coordinates);
  }
  handleEnd() {
    const {
      onAbort,
      onEnd
    } = this.props;
    this.detach();
    if (!this.activated) {
      onAbort(this.props.active);
    }
    onEnd();
  }
  handleCancel() {
    const {
      onAbort,
      onCancel
    } = this.props;
    this.detach();
    if (!this.activated) {
      onAbort(this.props.active);
    }
    onCancel();
  }
  handleKeydown(event) {
    if (event.code === KeyboardCode.Esc) {
      this.handleCancel();
    }
  }
  removeTextSelection() {
    var _this$document$getSel;
    (_this$document$getSel = this.document.getSelection()) == null ? void 0 : _this$document$getSel.removeAllRanges();
  }
}
const events = {
  cancel: {
    name: 'pointercancel'
  },
  move: {
    name: 'pointermove'
  },
  end: {
    name: 'pointerup'
  }
};
class PointerSensor extends AbstractPointerSensor {
  constructor(props) {
    const {
      event
    } = props; // Pointer events stop firing if the target is unmounted while dragging
    // Therefore we attach listeners to the owner document instead

    const listenerTarget = getOwnerDocument(event.target);
    super(props, events, listenerTarget);
  }
}
PointerSensor.activators = [{
  eventName: 'onPointerDown',
  handler: (_ref, _ref2) => {
    let {
      nativeEvent: event
    } = _ref;
    let {
      onActivation
    } = _ref2;
    if (!event.isPrimary || event.button !== 0) {
      return false;
    }
    onActivation == null ? void 0 : onActivation({
      event
    });
    return true;
  }
}];
const events$1 = {
  move: {
    name: 'mousemove'
  },
  end: {
    name: 'mouseup'
  }
};
var MouseButton;
(function (MouseButton) {
  MouseButton[MouseButton["RightClick"] = 2] = "RightClick";
})(MouseButton || (MouseButton = {}));
class MouseSensor extends AbstractPointerSensor {
  constructor(props) {
    super(props, events$1, getOwnerDocument(props.event.target));
  }
}
MouseSensor.activators = [{
  eventName: 'onMouseDown',
  handler: (_ref, _ref2) => {
    let {
      nativeEvent: event
    } = _ref;
    let {
      onActivation
    } = _ref2;
    if (event.button === MouseButton.RightClick) {
      return false;
    }
    onActivation == null ? void 0 : onActivation({
      event
    });
    return true;
  }
}];
const events$2 = {
  cancel: {
    name: 'touchcancel'
  },
  move: {
    name: 'touchmove'
  },
  end: {
    name: 'touchend'
  }
};
class TouchSensor extends AbstractPointerSensor {
  constructor(props) {
    super(props, events$2);
  }
  static setup() {
    // Adding a non-capture and non-passive `touchmove` listener in order
    // to force `event.preventDefault()` calls to work in dynamically added
    // touchmove event handlers. This is required for iOS Safari.
    window.addEventListener(events$2.move.name, noop, {
      capture: false,
      passive: false
    });
    return function teardown() {
      window.removeEventListener(events$2.move.name, noop);
    }; // We create a new handler because the teardown function of another sensor
    // could remove our event listener if we use a referentially equal listener.

    function noop() {}
  }
}
TouchSensor.activators = [{
  eventName: 'onTouchStart',
  handler: (_ref, _ref2) => {
    let {
      nativeEvent: event
    } = _ref;
    let {
      onActivation
    } = _ref2;
    const {
      touches
    } = event;
    if (touches.length > 1) {
      return false;
    }
    onActivation == null ? void 0 : onActivation({
      event
    });
    return true;
  }
}];
var AutoScrollActivator;
(function (AutoScrollActivator) {
  AutoScrollActivator[AutoScrollActivator["Pointer"] = 0] = "Pointer";
  AutoScrollActivator[AutoScrollActivator["DraggableRect"] = 1] = "DraggableRect";
})(AutoScrollActivator || (AutoScrollActivator = {}));
var TraversalOrder;
(function (TraversalOrder) {
  TraversalOrder[TraversalOrder["TreeOrder"] = 0] = "TreeOrder";
  TraversalOrder[TraversalOrder["ReversedTreeOrder"] = 1] = "ReversedTreeOrder";
})(TraversalOrder || (TraversalOrder = {}));
function useAutoScroller(_ref) {
  let {
    acceleration,
    activator = AutoScrollActivator.Pointer,
    canScroll,
    draggingRect,
    enabled,
    interval = 5,
    order = TraversalOrder.TreeOrder,
    pointerCoordinates,
    scrollableAncestors,
    scrollableAncestorRects,
    delta,
    threshold
  } = _ref;
  const scrollIntent = useScrollIntent({
    delta,
    disabled: !enabled
  });
  const [setAutoScrollInterval, clearAutoScrollInterval] = useInterval();
  const scrollSpeed = useRef({
    x: 0,
    y: 0
  });
  const scrollDirection = useRef({
    x: 0,
    y: 0
  });
  const rect = useMemo(() => {
    switch (activator) {
      case AutoScrollActivator.Pointer:
        return pointerCoordinates ? {
          top: pointerCoordinates.y,
          bottom: pointerCoordinates.y,
          left: pointerCoordinates.x,
          right: pointerCoordinates.x
        } : null;
      case AutoScrollActivator.DraggableRect:
        return draggingRect;
    }
  }, [activator, draggingRect, pointerCoordinates]);
  const scrollContainerRef = useRef(null);
  const autoScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }
    const scrollLeft = scrollSpeed.current.x * scrollDirection.current.x;
    const scrollTop = scrollSpeed.current.y * scrollDirection.current.y;
    scrollContainer.scrollBy(scrollLeft, scrollTop);
  }, []);
  const sortedScrollableAncestors = useMemo(() => order === TraversalOrder.TreeOrder ? [...scrollableAncestors].reverse() : scrollableAncestors, [order, scrollableAncestors]);
  useEffect(() => {
    if (!enabled || !scrollableAncestors.length || !rect) {
      clearAutoScrollInterval();
      return;
    }
    for (const scrollContainer of sortedScrollableAncestors) {
      if ((canScroll == null ? void 0 : canScroll(scrollContainer)) === false) {
        continue;
      }
      const index = scrollableAncestors.indexOf(scrollContainer);
      const scrollContainerRect = scrollableAncestorRects[index];
      if (!scrollContainerRect) {
        continue;
      }
      const {
        direction,
        speed
      } = getScrollDirectionAndSpeed(scrollContainer, scrollContainerRect, rect, acceleration, threshold);
      for (const axis of ['x', 'y']) {
        if (!scrollIntent[axis][direction[axis]]) {
          speed[axis] = 0;
          direction[axis] = 0;
        }
      }
      if (speed.x > 0 || speed.y > 0) {
        clearAutoScrollInterval();
        scrollContainerRef.current = scrollContainer;
        setAutoScrollInterval(autoScroll, interval);
        scrollSpeed.current = speed;
        scrollDirection.current = direction;
        return;
      }
    }
    scrollSpeed.current = {
      x: 0,
      y: 0
    };
    scrollDirection.current = {
      x: 0,
      y: 0
    };
    clearAutoScrollInterval();
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [acceleration, autoScroll, canScroll, clearAutoScrollInterval, enabled, interval,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  JSON.stringify(rect),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  JSON.stringify(scrollIntent), setAutoScrollInterval, scrollableAncestors, sortedScrollableAncestors, scrollableAncestorRects,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  JSON.stringify(threshold)]);
}
const defaultScrollIntent = {
  x: {
    [Direction.Backward]: false,
    [Direction.Forward]: false
  },
  y: {
    [Direction.Backward]: false,
    [Direction.Forward]: false
  }
};
function useScrollIntent(_ref2) {
  let {
    delta,
    disabled
  } = _ref2;
  const previousDelta = usePrevious(delta);
  return useLazyMemo(previousIntent => {
    if (disabled || !previousDelta || !previousIntent) {
      // Reset scroll intent tracking when auto-scrolling is disabled
      return defaultScrollIntent;
    }
    const direction = {
      x: Math.sign(delta.x - previousDelta.x),
      y: Math.sign(delta.y - previousDelta.y)
    }; // Keep track of the user intent to scroll in each direction for both axis

    return {
      x: {
        [Direction.Backward]: previousIntent.x[Direction.Backward] || direction.x === -1,
        [Direction.Forward]: previousIntent.x[Direction.Forward] || direction.x === 1
      },
      y: {
        [Direction.Backward]: previousIntent.y[Direction.Backward] || direction.y === -1,
        [Direction.Forward]: previousIntent.y[Direction.Forward] || direction.y === 1
      }
    };
  }, [disabled, delta, previousDelta]);
}
function useCachedNode(draggableNodes, id) {
  const draggableNode = id != null ? draggableNodes.get(id) : undefined;
  const node = draggableNode ? draggableNode.node.current : null;
  return useLazyMemo(cachedNode => {
    var _ref;
    if (id == null) {
      return null;
    } // In some cases, the draggable node can unmount while dragging
    // This is the case for virtualized lists. In those situations,
    // we fall back to the last known value for that node.

    return (_ref = node != null ? node : cachedNode) != null ? _ref : null;
  }, [node, id]);
}
function useCombineActivators(sensors, getSyntheticHandler) {
  return useMemo(() => sensors.reduce((accumulator, sensor) => {
    const {
      sensor: Sensor
    } = sensor;
    const sensorActivators = Sensor.activators.map(activator => ({
      eventName: activator.eventName,
      handler: getSyntheticHandler(activator.handler, sensor)
    }));
    return [...accumulator, ...sensorActivators];
  }, []), [sensors, getSyntheticHandler]);
}
var MeasuringStrategy;
(function (MeasuringStrategy) {
  MeasuringStrategy[MeasuringStrategy["Always"] = 0] = "Always";
  MeasuringStrategy[MeasuringStrategy["BeforeDragging"] = 1] = "BeforeDragging";
  MeasuringStrategy[MeasuringStrategy["WhileDragging"] = 2] = "WhileDragging";
})(MeasuringStrategy || (MeasuringStrategy = {}));
var MeasuringFrequency;
(function (MeasuringFrequency) {
  MeasuringFrequency["Optimized"] = "optimized";
})(MeasuringFrequency || (MeasuringFrequency = {}));
const defaultValue = /*#__PURE__*/new Map();
function useDroppableMeasuring(containers, _ref) {
  let {
    dragging,
    dependencies,
    config
  } = _ref;
  const [queue, setQueue] = useState(null);
  const {
    frequency,
    measure,
    strategy
  } = config;
  const containersRef = useRef(containers);
  const disabled = isDisabled();
  const disabledRef = useLatestValue(disabled);
  const measureDroppableContainers = useCallback(function (ids) {
    if (ids === void 0) {
      ids = [];
    }
    if (disabledRef.current) {
      return;
    }
    setQueue(value => {
      if (value === null) {
        return ids;
      }
      return value.concat(ids.filter(id => !value.includes(id)));
    });
  }, [disabledRef]);
  const timeoutId = useRef(null);
  const droppableRects = useLazyMemo(previousValue => {
    if (disabled && !dragging) {
      return defaultValue;
    }
    if (!previousValue || previousValue === defaultValue || containersRef.current !== containers || queue != null) {
      const map = new Map();
      for (let container of containers) {
        if (!container) {
          continue;
        }
        if (queue && queue.length > 0 && !queue.includes(container.id) && container.rect.current) {
          // This container does not need to be re-measured
          map.set(container.id, container.rect.current);
          continue;
        }
        const node = container.node.current;
        const rect = node ? new Rect(measure(node), node) : null;
        container.rect.current = rect;
        if (rect) {
          map.set(container.id, rect);
        }
      }
      return map;
    }
    return previousValue;
  }, [containers, queue, dragging, disabled, measure]);
  useEffect(() => {
    containersRef.current = containers;
  }, [containers]);
  useEffect(() => {
    if (disabled) {
      return;
    }
    measureDroppableContainers();
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [dragging, disabled]);
  useEffect(() => {
    if (queue && queue.length > 0) {
      setQueue(null);
    }
  },
  //eslint-disable-next-line react-hooks/exhaustive-deps
  [JSON.stringify(queue)]);
  useEffect(() => {
    if (disabled || typeof frequency !== 'number' || timeoutId.current !== null) {
      return;
    }
    timeoutId.current = setTimeout(() => {
      measureDroppableContainers();
      timeoutId.current = null;
    }, frequency);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [frequency, disabled, measureDroppableContainers, ...dependencies]);
  return {
    droppableRects,
    measureDroppableContainers,
    measuringScheduled: queue != null
  };
  function isDisabled() {
    switch (strategy) {
      case MeasuringStrategy.Always:
        return false;
      case MeasuringStrategy.BeforeDragging:
        return dragging;
      default:
        return !dragging;
    }
  }
}
function useInitialValue(value, computeFn) {
  return useLazyMemo(previousValue => {
    if (!value) {
      return null;
    }
    if (previousValue) {
      return previousValue;
    }
    return typeof computeFn === 'function' ? computeFn(value) : value;
  }, [computeFn, value]);
}
function useInitialRect(node, measure) {
  return useInitialValue(node, measure);
}

/**
 * Returns a new MutationObserver instance.
 * If `MutationObserver` is undefined in the execution environment, returns `undefined`.
 */

function useMutationObserver(_ref) {
  let {
    callback,
    disabled
  } = _ref;
  const handleMutations = useEvent(callback);
  const mutationObserver = useMemo(() => {
    if (disabled || typeof window === 'undefined' || typeof window.MutationObserver === 'undefined') {
      return undefined;
    }
    const {
      MutationObserver
    } = window;
    return new MutationObserver(handleMutations);
  }, [handleMutations, disabled]);
  useEffect(() => {
    return () => mutationObserver == null ? void 0 : mutationObserver.disconnect();
  }, [mutationObserver]);
  return mutationObserver;
}

/**
 * Returns a new ResizeObserver instance bound to the `onResize` callback.
 * If `ResizeObserver` is undefined in the execution environment, returns `undefined`.
 */

function useResizeObserver(_ref) {
  let {
    callback,
    disabled
  } = _ref;
  const handleResize = useEvent(callback);
  const resizeObserver = useMemo(() => {
    if (disabled || typeof window === 'undefined' || typeof window.ResizeObserver === 'undefined') {
      return undefined;
    }
    const {
      ResizeObserver
    } = window;
    return new ResizeObserver(handleResize);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [disabled]);
  useEffect(() => {
    return () => resizeObserver == null ? void 0 : resizeObserver.disconnect();
  }, [resizeObserver]);
  return resizeObserver;
}
function defaultMeasure(element) {
  return new Rect(getClientRect(element), element);
}
function useRect(element, measure, fallbackRect) {
  if (measure === void 0) {
    measure = defaultMeasure;
  }
  const [rect, setRect] = useState(null);
  function measureRect() {
    setRect(currentRect => {
      if (!element) {
        return null;
      }
      if (element.isConnected === false) {
        var _ref;

        // Fall back to last rect we measured if the element is
        // no longer connected to the DOM.
        return (_ref = currentRect != null ? currentRect : fallbackRect) != null ? _ref : null;
      }
      const newRect = measure(element);
      if (JSON.stringify(currentRect) === JSON.stringify(newRect)) {
        return currentRect;
      }
      return newRect;
    });
  }
  const mutationObserver = useMutationObserver({
    callback(records) {
      if (!element) {
        return;
      }
      for (const record of records) {
        const {
          type,
          target
        } = record;
        if (type === 'childList' && target instanceof HTMLElement && target.contains(element)) {
          measureRect();
          break;
        }
      }
    }
  });
  const resizeObserver = useResizeObserver({
    callback: measureRect
  });
  useIsomorphicLayoutEffect(() => {
    measureRect();
    if (element) {
      resizeObserver == null ? void 0 : resizeObserver.observe(element);
      mutationObserver == null ? void 0 : mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      resizeObserver == null ? void 0 : resizeObserver.disconnect();
      mutationObserver == null ? void 0 : mutationObserver.disconnect();
    }
  }, [element]);
  return rect;
}
function useRectDelta(rect) {
  const initialRect = useInitialValue(rect);
  return getRectDelta(rect, initialRect);
}
const defaultValue$1 = [];
function useScrollableAncestors(node) {
  const previousNode = useRef(node);
  const ancestors = useLazyMemo(previousValue => {
    if (!node) {
      return defaultValue$1;
    }
    if (previousValue && previousValue !== defaultValue$1 && node && previousNode.current && node.parentNode === previousNode.current.parentNode) {
      return previousValue;
    }
    return getScrollableAncestors(node);
  }, [node]);
  useEffect(() => {
    previousNode.current = node;
  }, [node]);
  return ancestors;
}
function useScrollOffsets(elements) {
  const [scrollCoordinates, setScrollCoordinates] = useState(null);
  const prevElements = useRef(elements); // To-do: Throttle the handleScroll callback

  const handleScroll = useCallback(event => {
    const scrollingElement = getScrollableElement(event.target);
    if (!scrollingElement) {
      return;
    }
    setScrollCoordinates(scrollCoordinates => {
      if (!scrollCoordinates) {
        return null;
      }
      scrollCoordinates.set(scrollingElement, getScrollCoordinates(scrollingElement));
      return new Map(scrollCoordinates);
    });
  }, []);
  useEffect(() => {
    const previousElements = prevElements.current;
    if (elements !== previousElements) {
      cleanup(previousElements);
      const entries = elements.map(element => {
        const scrollableElement = getScrollableElement(element);
        if (scrollableElement) {
          scrollableElement.addEventListener('scroll', handleScroll, {
            passive: true
          });
          return [scrollableElement, getScrollCoordinates(scrollableElement)];
        }
        return null;
      }).filter(entry => entry != null);
      setScrollCoordinates(entries.length ? new Map(entries) : null);
      prevElements.current = elements;
    }
    return () => {
      cleanup(elements);
      cleanup(previousElements);
    };
    function cleanup(elements) {
      elements.forEach(element => {
        const scrollableElement = getScrollableElement(element);
        scrollableElement == null ? void 0 : scrollableElement.removeEventListener('scroll', handleScroll);
      });
    }
  }, [handleScroll, elements]);
  return useMemo(() => {
    if (elements.length) {
      return scrollCoordinates ? Array.from(scrollCoordinates.values()).reduce((acc, coordinates) => add(acc, coordinates), defaultCoordinates) : getScrollOffsets(elements);
    }
    return defaultCoordinates;
  }, [elements, scrollCoordinates]);
}
function useScrollOffsetsDelta(scrollOffsets, dependencies) {
  if (dependencies === void 0) {
    dependencies = [];
  }
  const initialScrollOffsets = useRef(null);
  useEffect(() => {
    initialScrollOffsets.current = null;
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  dependencies);
  useEffect(() => {
    const hasScrollOffsets = scrollOffsets !== defaultCoordinates;
    if (hasScrollOffsets && !initialScrollOffsets.current) {
      initialScrollOffsets.current = scrollOffsets;
    }
    if (!hasScrollOffsets && initialScrollOffsets.current) {
      initialScrollOffsets.current = null;
    }
  }, [scrollOffsets]);
  return initialScrollOffsets.current ? subtract(scrollOffsets, initialScrollOffsets.current) : defaultCoordinates;
}
function useSensorSetup(sensors) {
  useEffect(() => {
    if (!canUseDOM) {
      return;
    }
    const teardownFns = sensors.map(_ref => {
      let {
        sensor
      } = _ref;
      return sensor.setup == null ? void 0 : sensor.setup();
    });
    return () => {
      for (const teardown of teardownFns) {
        teardown == null ? void 0 : teardown();
      }
    };
  },
  // TO-DO: Sensors length could theoretically change which would not be a valid dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  sensors.map(_ref2 => {
    let {
      sensor
    } = _ref2;
    return sensor;
  }));
}
function useSyntheticListeners(listeners, id) {
  return useMemo(() => {
    return listeners.reduce((acc, _ref) => {
      let {
        eventName,
        handler
      } = _ref;
      acc[eventName] = event => {
        handler(event, id);
      };
      return acc;
    }, {});
  }, [listeners, id]);
}
function useWindowRect(element) {
  return useMemo(() => element ? getWindowClientRect(element) : null, [element]);
}
const defaultValue$2 = [];
function useRects(elements, measure) {
  if (measure === void 0) {
    measure = getClientRect;
  }
  const [firstElement] = elements;
  const windowRect = useWindowRect(firstElement ? getWindow(firstElement) : null);
  const [rects, setRects] = useState(defaultValue$2);
  function measureRects() {
    setRects(() => {
      if (!elements.length) {
        return defaultValue$2;
      }
      return elements.map(element => isDocumentScrollingElement(element) ? windowRect : new Rect(measure(element), element));
    });
  }
  const resizeObserver = useResizeObserver({
    callback: measureRects
  });
  useIsomorphicLayoutEffect(() => {
    resizeObserver == null ? void 0 : resizeObserver.disconnect();
    measureRects();
    elements.forEach(element => resizeObserver == null ? void 0 : resizeObserver.observe(element));
  }, [elements]);
  return rects;
}
function getMeasurableNode(node) {
  if (!node) {
    return null;
  }
  if (node.children.length > 1) {
    return node;
  }
  const firstChild = node.children[0];
  return isHTMLElement(firstChild) ? firstChild : node;
}
function useDragOverlayMeasuring(_ref) {
  let {
    measure
  } = _ref;
  const [rect, setRect] = useState(null);
  const handleResize = useCallback(entries => {
    for (const {
      target
    } of entries) {
      if (isHTMLElement(target)) {
        setRect(rect => {
          const newRect = measure(target);
          return rect ? {
            ...rect,
            width: newRect.width,
            height: newRect.height
          } : newRect;
        });
        break;
      }
    }
  }, [measure]);
  const resizeObserver = useResizeObserver({
    callback: handleResize
  });
  const handleNodeChange = useCallback(element => {
    const node = getMeasurableNode(element);
    resizeObserver == null ? void 0 : resizeObserver.disconnect();
    if (node) {
      resizeObserver == null ? void 0 : resizeObserver.observe(node);
    }
    setRect(node ? measure(node) : null);
  }, [measure, resizeObserver]);
  const [nodeRef, setRef] = useNodeRef(handleNodeChange);
  return useMemo(() => ({
    nodeRef,
    rect,
    setRef
  }), [rect, nodeRef, setRef]);
}
const defaultSensors = [{
  sensor: PointerSensor,
  options: {}
}, {
  sensor: KeyboardSensor,
  options: {}
}];
const defaultData = {
  current: {}
};
const defaultMeasuringConfiguration = {
  draggable: {
    measure: getTransformAgnosticClientRect
  },
  droppable: {
    measure: getTransformAgnosticClientRect,
    strategy: MeasuringStrategy.WhileDragging,
    frequency: MeasuringFrequency.Optimized
  },
  dragOverlay: {
    measure: getClientRect
  }
};
class DroppableContainersMap extends Map {
  get(id) {
    var _super$get;
    return id != null ? (_super$get = super.get(id)) != null ? _super$get : undefined : undefined;
  }
  toArray() {
    return Array.from(this.values());
  }
  getEnabled() {
    return this.toArray().filter(_ref => {
      let {
        disabled
      } = _ref;
      return !disabled;
    });
  }
  getNodeFor(id) {
    var _this$get$node$curren, _this$get;
    return (_this$get$node$curren = (_this$get = this.get(id)) == null ? void 0 : _this$get.node.current) != null ? _this$get$node$curren : undefined;
  }
}
const defaultPublicContext = {
  activatorEvent: null,
  active: null,
  activeNode: null,
  activeNodeRect: null,
  collisions: null,
  containerNodeRect: null,
  draggableNodes: /*#__PURE__*/new Map(),
  droppableRects: /*#__PURE__*/new Map(),
  droppableContainers: /*#__PURE__*/new DroppableContainersMap(),
  over: null,
  dragOverlay: {
    nodeRef: {
      current: null
    },
    rect: null,
    setRef: noop
  },
  scrollableAncestors: [],
  scrollableAncestorRects: [],
  measuringConfiguration: defaultMeasuringConfiguration,
  measureDroppableContainers: noop,
  windowRect: null,
  measuringScheduled: false
};
const defaultInternalContext = {
  activatorEvent: null,
  activators: [],
  active: null,
  activeNodeRect: null,
  ariaDescribedById: {
    draggable: ''
  },
  dispatch: noop,
  draggableNodes: /*#__PURE__*/new Map(),
  over: null,
  measureDroppableContainers: noop
};
const InternalContext = /*#__PURE__*/createContext(defaultInternalContext);
const PublicContext = /*#__PURE__*/createContext(defaultPublicContext);
function getInitialState() {
  return {
    draggable: {
      active: null,
      initialCoordinates: {
        x: 0,
        y: 0
      },
      nodes: new Map(),
      translate: {
        x: 0,
        y: 0
      }
    },
    droppable: {
      containers: new DroppableContainersMap()
    }
  };
}
function reducer(state, action) {
  switch (action.type) {
    case Action.DragStart:
      return {
        ...state,
        draggable: {
          ...state.draggable,
          initialCoordinates: action.initialCoordinates,
          active: action.active
        }
      };
    case Action.DragMove:
      if (state.draggable.active == null) {
        return state;
      }
      return {
        ...state,
        draggable: {
          ...state.draggable,
          translate: {
            x: action.coordinates.x - state.draggable.initialCoordinates.x,
            y: action.coordinates.y - state.draggable.initialCoordinates.y
          }
        }
      };
    case Action.DragEnd:
    case Action.DragCancel:
      return {
        ...state,
        draggable: {
          ...state.draggable,
          active: null,
          initialCoordinates: {
            x: 0,
            y: 0
          },
          translate: {
            x: 0,
            y: 0
          }
        }
      };
    case Action.RegisterDroppable:
      {
        const {
          element
        } = action;
        const {
          id
        } = element;
        const containers = new DroppableContainersMap(state.droppable.containers);
        containers.set(id, element);
        return {
          ...state,
          droppable: {
            ...state.droppable,
            containers
          }
        };
      }
    case Action.SetDroppableDisabled:
      {
        const {
          id,
          key,
          disabled
        } = action;
        const element = state.droppable.containers.get(id);
        if (!element || key !== element.key) {
          return state;
        }
        const containers = new DroppableContainersMap(state.droppable.containers);
        containers.set(id, {
          ...element,
          disabled
        });
        return {
          ...state,
          droppable: {
            ...state.droppable,
            containers
          }
        };
      }
    case Action.UnregisterDroppable:
      {
        const {
          id,
          key
        } = action;
        const element = state.droppable.containers.get(id);
        if (!element || key !== element.key) {
          return state;
        }
        const containers = new DroppableContainersMap(state.droppable.containers);
        containers.delete(id);
        return {
          ...state,
          droppable: {
            ...state.droppable,
            containers
          }
        };
      }
    default:
      {
        return state;
      }
  }
}
function RestoreFocus(_ref) {
  let {
    disabled
  } = _ref;
  const {
    active,
    activatorEvent,
    draggableNodes
  } = useContext(InternalContext);
  const previousActivatorEvent = usePrevious(activatorEvent);
  const previousActiveId = usePrevious(active == null ? void 0 : active.id); // Restore keyboard focus on the activator node

  useEffect(() => {
    if (disabled) {
      return;
    }
    if (!activatorEvent && previousActivatorEvent && previousActiveId != null) {
      if (!isKeyboardEvent(previousActivatorEvent)) {
        return;
      }
      if (document.activeElement === previousActivatorEvent.target) {
        // No need to restore focus
        return;
      }
      const draggableNode = draggableNodes.get(previousActiveId);
      if (!draggableNode) {
        return;
      }
      const {
        activatorNode,
        node
      } = draggableNode;
      if (!activatorNode.current && !node.current) {
        return;
      }
      requestAnimationFrame(() => {
        for (const element of [activatorNode.current, node.current]) {
          if (!element) {
            continue;
          }
          const focusableNode = findFirstFocusableNode(element);
          if (focusableNode) {
            focusableNode.focus();
            break;
          }
        }
      });
    }
  }, [activatorEvent, disabled, draggableNodes, previousActiveId, previousActivatorEvent]);
  return null;
}
function applyModifiers(modifiers, _ref) {
  let {
    transform,
    ...args
  } = _ref;
  return modifiers != null && modifiers.length ? modifiers.reduce((accumulator, modifier) => {
    return modifier({
      transform: accumulator,
      ...args
    });
  }, transform) : transform;
}
function useMeasuringConfiguration(config) {
  return useMemo(() => ({
    draggable: {
      ...defaultMeasuringConfiguration.draggable,
      ...(config == null ? void 0 : config.draggable)
    },
    droppable: {
      ...defaultMeasuringConfiguration.droppable,
      ...(config == null ? void 0 : config.droppable)
    },
    dragOverlay: {
      ...defaultMeasuringConfiguration.dragOverlay,
      ...(config == null ? void 0 : config.dragOverlay)
    }
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [config == null ? void 0 : config.draggable, config == null ? void 0 : config.droppable, config == null ? void 0 : config.dragOverlay]);
}
function useLayoutShiftScrollCompensation(_ref) {
  let {
    activeNode,
    measure,
    initialRect,
    config = true
  } = _ref;
  const initialized = useRef(false);
  const {
    x,
    y
  } = typeof config === 'boolean' ? {
    x: config,
    y: config
  } : config;
  useIsomorphicLayoutEffect(() => {
    const disabled = !x && !y;
    if (disabled || !activeNode) {
      initialized.current = false;
      return;
    }
    if (initialized.current || !initialRect) {
      // Return early if layout shift scroll compensation was already attempted
      // or if there is no initialRect to compare to.
      return;
    } // Get the most up to date node ref for the active draggable

    const node = activeNode == null ? void 0 : activeNode.node.current;
    if (!node || node.isConnected === false) {
      // Return early if there is no attached node ref or if the node is
      // disconnected from the document.
      return;
    }
    const rect = measure(node);
    const rectDelta = getRectDelta(rect, initialRect);
    if (!x) {
      rectDelta.x = 0;
    }
    if (!y) {
      rectDelta.y = 0;
    } // Only perform layout shift scroll compensation once

    initialized.current = true;
    if (Math.abs(rectDelta.x) > 0 || Math.abs(rectDelta.y) > 0) {
      const firstScrollableAncestor = getFirstScrollableAncestor(node);
      if (firstScrollableAncestor) {
        firstScrollableAncestor.scrollBy({
          top: rectDelta.y,
          left: rectDelta.x
        });
      }
    }
  }, [activeNode, x, y, initialRect, measure]);
}
const ActiveDraggableContext = /*#__PURE__*/createContext({
  ...defaultCoordinates,
  scaleX: 1,
  scaleY: 1
});
var Status;
(function (Status) {
  Status[Status["Uninitialized"] = 0] = "Uninitialized";
  Status[Status["Initializing"] = 1] = "Initializing";
  Status[Status["Initialized"] = 2] = "Initialized";
})(Status || (Status = {}));
const DndContext = /*#__PURE__*/memo(function DndContext(_ref) {
  var _sensorContext$curren, _dragOverlay$nodeRef$, _dragOverlay$rect, _over$rect;
  let {
    id,
    accessibility,
    autoScroll = true,
    children,
    sensors = defaultSensors,
    collisionDetection = rectIntersection,
    measuring,
    modifiers,
    ...props
  } = _ref;
  const store = useReducer(reducer, undefined, getInitialState);
  const [state, dispatch] = store;
  const [dispatchMonitorEvent, registerMonitorListener] = useDndMonitorProvider();
  const [status, setStatus] = useState(Status.Uninitialized);
  const isInitialized = status === Status.Initialized;
  const {
    draggable: {
      active: activeId,
      nodes: draggableNodes,
      translate
    },
    droppable: {
      containers: droppableContainers
    }
  } = state;
  const node = activeId != null ? draggableNodes.get(activeId) : null;
  const activeRects = useRef({
    initial: null,
    translated: null
  });
  const active = useMemo(() => {
    var _node$data;
    return activeId != null ? {
      id: activeId,
      // It's possible for the active node to unmount while dragging
      data: (_node$data = node == null ? void 0 : node.data) != null ? _node$data : defaultData,
      rect: activeRects
    } : null;
  }, [activeId, node]);
  const activeRef = useRef(null);
  const [activeSensor, setActiveSensor] = useState(null);
  const [activatorEvent, setActivatorEvent] = useState(null);
  const latestProps = useLatestValue(props, Object.values(props));
  const draggableDescribedById = useUniqueId("DndDescribedBy", id);
  const enabledDroppableContainers = useMemo(() => droppableContainers.getEnabled(), [droppableContainers]);
  const measuringConfiguration = useMeasuringConfiguration(measuring);
  const {
    droppableRects,
    measureDroppableContainers,
    measuringScheduled
  } = useDroppableMeasuring(enabledDroppableContainers, {
    dragging: isInitialized,
    dependencies: [translate.x, translate.y],
    config: measuringConfiguration.droppable
  });
  const activeNode = useCachedNode(draggableNodes, activeId);
  const activationCoordinates = useMemo(() => activatorEvent ? getEventCoordinates(activatorEvent) : null, [activatorEvent]);
  const autoScrollOptions = getAutoScrollerOptions();
  const initialActiveNodeRect = useInitialRect(activeNode, measuringConfiguration.draggable.measure);
  useLayoutShiftScrollCompensation({
    activeNode: activeId != null ? draggableNodes.get(activeId) : null,
    config: autoScrollOptions.layoutShiftCompensation,
    initialRect: initialActiveNodeRect,
    measure: measuringConfiguration.draggable.measure
  });
  const activeNodeRect = useRect(activeNode, measuringConfiguration.draggable.measure, initialActiveNodeRect);
  const containerNodeRect = useRect(activeNode ? activeNode.parentElement : null);
  const sensorContext = useRef({
    activatorEvent: null,
    active: null,
    activeNode,
    collisionRect: null,
    collisions: null,
    droppableRects,
    draggableNodes,
    draggingNode: null,
    draggingNodeRect: null,
    droppableContainers,
    over: null,
    scrollableAncestors: [],
    scrollAdjustedTranslate: null
  });
  const overNode = droppableContainers.getNodeFor((_sensorContext$curren = sensorContext.current.over) == null ? void 0 : _sensorContext$curren.id);
  const dragOverlay = useDragOverlayMeasuring({
    measure: measuringConfiguration.dragOverlay.measure
  }); // Use the rect of the drag overlay if it is mounted

  const draggingNode = (_dragOverlay$nodeRef$ = dragOverlay.nodeRef.current) != null ? _dragOverlay$nodeRef$ : activeNode;
  const draggingNodeRect = isInitialized ? (_dragOverlay$rect = dragOverlay.rect) != null ? _dragOverlay$rect : activeNodeRect : null;
  const usesDragOverlay = Boolean(dragOverlay.nodeRef.current && dragOverlay.rect); // The delta between the previous and new position of the draggable node
  // is only relevant when there is no drag overlay

  const nodeRectDelta = useRectDelta(usesDragOverlay ? null : activeNodeRect); // Get the window rect of the dragging node

  const windowRect = useWindowRect(draggingNode ? getWindow(draggingNode) : null); // Get scrollable ancestors of the dragging node

  const scrollableAncestors = useScrollableAncestors(isInitialized ? overNode != null ? overNode : activeNode : null);
  const scrollableAncestorRects = useRects(scrollableAncestors); // Apply modifiers

  const modifiedTranslate = applyModifiers(modifiers, {
    transform: {
      x: translate.x - nodeRectDelta.x,
      y: translate.y - nodeRectDelta.y,
      scaleX: 1,
      scaleY: 1
    },
    activatorEvent,
    active,
    activeNodeRect,
    containerNodeRect,
    draggingNodeRect,
    over: sensorContext.current.over,
    overlayNodeRect: dragOverlay.rect,
    scrollableAncestors,
    scrollableAncestorRects,
    windowRect
  });
  const pointerCoordinates = activationCoordinates ? add(activationCoordinates, translate) : null;
  const scrollOffsets = useScrollOffsets(scrollableAncestors); // Represents the scroll delta since dragging was initiated

  const scrollAdjustment = useScrollOffsetsDelta(scrollOffsets); // Represents the scroll delta since the last time the active node rect was measured

  const activeNodeScrollDelta = useScrollOffsetsDelta(scrollOffsets, [activeNodeRect]);
  const scrollAdjustedTranslate = add(modifiedTranslate, scrollAdjustment);
  const collisionRect = draggingNodeRect ? getAdjustedRect(draggingNodeRect, modifiedTranslate) : null;
  const collisions = active && collisionRect ? collisionDetection({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: enabledDroppableContainers,
    pointerCoordinates
  }) : null;
  const overId = getFirstCollision(collisions, 'id');
  const [over, setOver] = useState(null); // When there is no drag overlay used, we need to account for the
  // window scroll delta

  const appliedTranslate = usesDragOverlay ? modifiedTranslate : add(modifiedTranslate, activeNodeScrollDelta);
  const transform = adjustScale(appliedTranslate, (_over$rect = over == null ? void 0 : over.rect) != null ? _over$rect : null, activeNodeRect);
  const activeSensorRef = useRef(null);
  const instantiateSensor = useCallback((event, _ref2) => {
    let {
      sensor: Sensor,
      options
    } = _ref2;
    if (activeRef.current == null) {
      return;
    }
    const activeNode = draggableNodes.get(activeRef.current);
    if (!activeNode) {
      return;
    }
    const activatorEvent = event.nativeEvent;
    const sensorInstance = new Sensor({
      active: activeRef.current,
      activeNode,
      event: activatorEvent,
      options,
      // Sensors need to be instantiated with refs for arguments that change over time
      // otherwise they are frozen in time with the stale arguments
      context: sensorContext,
      onAbort(id) {
        const draggableNode = draggableNodes.get(id);
        if (!draggableNode) {
          return;
        }
        const {
          onDragAbort
        } = latestProps.current;
        const event = {
          id
        };
        onDragAbort == null ? void 0 : onDragAbort(event);
        dispatchMonitorEvent({
          type: 'onDragAbort',
          event
        });
      },
      onPending(id, constraint, initialCoordinates, offset) {
        const draggableNode = draggableNodes.get(id);
        if (!draggableNode) {
          return;
        }
        const {
          onDragPending
        } = latestProps.current;
        const event = {
          id,
          constraint,
          initialCoordinates,
          offset
        };
        onDragPending == null ? void 0 : onDragPending(event);
        dispatchMonitorEvent({
          type: 'onDragPending',
          event
        });
      },
      onStart(initialCoordinates) {
        const id = activeRef.current;
        if (id == null) {
          return;
        }
        const draggableNode = draggableNodes.get(id);
        if (!draggableNode) {
          return;
        }
        const {
          onDragStart
        } = latestProps.current;
        const event = {
          activatorEvent,
          active: {
            id,
            data: draggableNode.data,
            rect: activeRects
          }
        };
        unstable_batchedUpdates(() => {
          onDragStart == null ? void 0 : onDragStart(event);
          setStatus(Status.Initializing);
          dispatch({
            type: Action.DragStart,
            initialCoordinates,
            active: id
          });
          dispatchMonitorEvent({
            type: 'onDragStart',
            event
          });
          setActiveSensor(activeSensorRef.current);
          setActivatorEvent(activatorEvent);
        });
      },
      onMove(coordinates) {
        dispatch({
          type: Action.DragMove,
          coordinates
        });
      },
      onEnd: createHandler(Action.DragEnd),
      onCancel: createHandler(Action.DragCancel)
    });
    activeSensorRef.current = sensorInstance;
    function createHandler(type) {
      return async function handler() {
        const {
          active,
          collisions,
          over,
          scrollAdjustedTranslate
        } = sensorContext.current;
        let event = null;
        if (active && scrollAdjustedTranslate) {
          const {
            cancelDrop
          } = latestProps.current;
          event = {
            activatorEvent,
            active: active,
            collisions,
            delta: scrollAdjustedTranslate,
            over
          };
          if (type === Action.DragEnd && typeof cancelDrop === 'function') {
            const shouldCancel = await Promise.resolve(cancelDrop(event));
            if (shouldCancel) {
              type = Action.DragCancel;
            }
          }
        }
        activeRef.current = null;
        unstable_batchedUpdates(() => {
          dispatch({
            type
          });
          setStatus(Status.Uninitialized);
          setOver(null);
          setActiveSensor(null);
          setActivatorEvent(null);
          activeSensorRef.current = null;
          const eventName = type === Action.DragEnd ? 'onDragEnd' : 'onDragCancel';
          if (event) {
            const handler = latestProps.current[eventName];
            handler == null ? void 0 : handler(event);
            dispatchMonitorEvent({
              type: eventName,
              event
            });
          }
        });
      };
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [draggableNodes]);
  const bindActivatorToSensorInstantiator = useCallback((handler, sensor) => {
    return (event, active) => {
      const nativeEvent = event.nativeEvent;
      const activeDraggableNode = draggableNodes.get(active);
      if (
      // Another sensor is already instantiating
      activeRef.current !== null ||
      // No active draggable
      !activeDraggableNode ||
      // Event has already been captured
      nativeEvent.dndKit || nativeEvent.defaultPrevented) {
        return;
      }
      const activationContext = {
        active: activeDraggableNode
      };
      const shouldActivate = handler(event, sensor.options, activationContext);
      if (shouldActivate === true) {
        nativeEvent.dndKit = {
          capturedBy: sensor.sensor
        };
        activeRef.current = active;
        instantiateSensor(event, sensor);
      }
    };
  }, [draggableNodes, instantiateSensor]);
  const activators = useCombineActivators(sensors, bindActivatorToSensorInstantiator);
  useSensorSetup(sensors);
  useIsomorphicLayoutEffect(() => {
    if (activeNodeRect && status === Status.Initializing) {
      setStatus(Status.Initialized);
    }
  }, [activeNodeRect, status]);
  useEffect(() => {
    const {
      onDragMove
    } = latestProps.current;
    const {
      active,
      activatorEvent,
      collisions,
      over
    } = sensorContext.current;
    if (!active || !activatorEvent) {
      return;
    }
    const event = {
      active,
      activatorEvent,
      collisions,
      delta: {
        x: scrollAdjustedTranslate.x,
        y: scrollAdjustedTranslate.y
      },
      over
    };
    unstable_batchedUpdates(() => {
      onDragMove == null ? void 0 : onDragMove(event);
      dispatchMonitorEvent({
        type: 'onDragMove',
        event
      });
    });
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [scrollAdjustedTranslate.x, scrollAdjustedTranslate.y]);
  useEffect(() => {
    const {
      active,
      activatorEvent,
      collisions,
      droppableContainers,
      scrollAdjustedTranslate
    } = sensorContext.current;
    if (!active || activeRef.current == null || !activatorEvent || !scrollAdjustedTranslate) {
      return;
    }
    const {
      onDragOver
    } = latestProps.current;
    const overContainer = droppableContainers.get(overId);
    const over = overContainer && overContainer.rect.current ? {
      id: overContainer.id,
      rect: overContainer.rect.current,
      data: overContainer.data,
      disabled: overContainer.disabled
    } : null;
    const event = {
      active,
      activatorEvent,
      collisions,
      delta: {
        x: scrollAdjustedTranslate.x,
        y: scrollAdjustedTranslate.y
      },
      over
    };
    unstable_batchedUpdates(() => {
      setOver(over);
      onDragOver == null ? void 0 : onDragOver(event);
      dispatchMonitorEvent({
        type: 'onDragOver',
        event
      });
    });
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [overId]);
  useIsomorphicLayoutEffect(() => {
    sensorContext.current = {
      activatorEvent,
      active,
      activeNode,
      collisionRect,
      collisions,
      droppableRects,
      draggableNodes,
      draggingNode,
      draggingNodeRect,
      droppableContainers,
      over,
      scrollableAncestors,
      scrollAdjustedTranslate
    };
    activeRects.current = {
      initial: draggingNodeRect,
      translated: collisionRect
    };
  }, [active, activeNode, collisions, collisionRect, draggableNodes, draggingNode, draggingNodeRect, droppableRects, droppableContainers, over, scrollableAncestors, scrollAdjustedTranslate]);
  useAutoScroller({
    ...autoScrollOptions,
    delta: translate,
    draggingRect: collisionRect,
    pointerCoordinates,
    scrollableAncestors,
    scrollableAncestorRects
  });
  const publicContext = useMemo(() => {
    const context = {
      active,
      activeNode,
      activeNodeRect,
      activatorEvent,
      collisions,
      containerNodeRect,
      dragOverlay,
      draggableNodes,
      droppableContainers,
      droppableRects,
      over,
      measureDroppableContainers,
      scrollableAncestors,
      scrollableAncestorRects,
      measuringConfiguration,
      measuringScheduled,
      windowRect
    };
    return context;
  }, [active, activeNode, activeNodeRect, activatorEvent, collisions, containerNodeRect, dragOverlay, draggableNodes, droppableContainers, droppableRects, over, measureDroppableContainers, scrollableAncestors, scrollableAncestorRects, measuringConfiguration, measuringScheduled, windowRect]);
  const internalContext = useMemo(() => {
    const context = {
      activatorEvent,
      activators,
      active,
      activeNodeRect,
      ariaDescribedById: {
        draggable: draggableDescribedById
      },
      dispatch,
      draggableNodes,
      over,
      measureDroppableContainers
    };
    return context;
  }, [activatorEvent, activators, active, activeNodeRect, dispatch, draggableDescribedById, draggableNodes, over, measureDroppableContainers]);
  return React.createElement(DndMonitorContext.Provider, {
    value: registerMonitorListener
  }, React.createElement(InternalContext.Provider, {
    value: internalContext
  }, React.createElement(PublicContext.Provider, {
    value: publicContext
  }, React.createElement(ActiveDraggableContext.Provider, {
    value: transform
  }, children)), React.createElement(RestoreFocus, {
    disabled: (accessibility == null ? void 0 : accessibility.restoreFocus) === false
  })), React.createElement(Accessibility, {
    ...accessibility,
    hiddenTextDescribedById: draggableDescribedById
  }));
  function getAutoScrollerOptions() {
    const activeSensorDisablesAutoscroll = (activeSensor == null ? void 0 : activeSensor.autoScrollEnabled) === false;
    const autoScrollGloballyDisabled = typeof autoScroll === 'object' ? autoScroll.enabled === false : autoScroll === false;
    const enabled = isInitialized && !activeSensorDisablesAutoscroll && !autoScrollGloballyDisabled;
    if (typeof autoScroll === 'object') {
      return {
        ...autoScroll,
        enabled
      };
    }
    return {
      enabled
    };
  }
});
const NullContext = /*#__PURE__*/createContext(null);
const defaultRole = 'button';
const ID_PREFIX$1 = 'Draggable';
function useDraggable(_ref) {
  let {
    id,
    data,
    disabled = false,
    attributes
  } = _ref;
  const key = useUniqueId(ID_PREFIX$1);
  const {
    activators,
    activatorEvent,
    active,
    activeNodeRect,
    ariaDescribedById,
    draggableNodes,
    over
  } = useContext(InternalContext);
  const {
    role = defaultRole,
    roleDescription = 'draggable',
    tabIndex = 0
  } = attributes != null ? attributes : {};
  const isDragging = (active == null ? void 0 : active.id) === id;
  const transform = useContext(isDragging ? ActiveDraggableContext : NullContext);
  const [node, setNodeRef] = useNodeRef();
  const [activatorNode, setActivatorNodeRef] = useNodeRef();
  const listeners = useSyntheticListeners(activators, id);
  const dataRef = useLatestValue(data);
  useIsomorphicLayoutEffect(() => {
    draggableNodes.set(id, {
      id,
      key,
      node,
      activatorNode,
      data: dataRef
    });
    return () => {
      const node = draggableNodes.get(id);
      if (node && node.key === key) {
        draggableNodes.delete(id);
      }
    };
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [draggableNodes, id]);
  const memoizedAttributes = useMemo(() => ({
    role,
    tabIndex,
    'aria-disabled': disabled,
    'aria-pressed': isDragging && role === defaultRole ? true : undefined,
    'aria-roledescription': roleDescription,
    'aria-describedby': ariaDescribedById.draggable
  }), [disabled, role, tabIndex, isDragging, roleDescription, ariaDescribedById.draggable]);
  return {
    active,
    activatorEvent,
    activeNodeRect,
    attributes: memoizedAttributes,
    isDragging,
    listeners: disabled ? undefined : listeners,
    node,
    over,
    setNodeRef,
    setActivatorNodeRef,
    transform
  };
}
function useDndContext() {
  return useContext(PublicContext);
}
const ID_PREFIX$1$1 = 'Droppable';
const defaultResizeObserverConfig = {
  timeout: 25
};
function useDroppable(_ref) {
  let {
    data,
    disabled = false,
    id,
    resizeObserverConfig
  } = _ref;
  const key = useUniqueId(ID_PREFIX$1$1);
  const {
    active,
    dispatch,
    over,
    measureDroppableContainers
  } = useContext(InternalContext);
  const previous = useRef({
    disabled
  });
  const resizeObserverConnected = useRef(false);
  const rect = useRef(null);
  const callbackId = useRef(null);
  const {
    disabled: resizeObserverDisabled,
    updateMeasurementsFor,
    timeout: resizeObserverTimeout
  } = {
    ...defaultResizeObserverConfig,
    ...resizeObserverConfig
  };
  const ids = useLatestValue(updateMeasurementsFor != null ? updateMeasurementsFor : id);
  const handleResize = useCallback(() => {
    if (!resizeObserverConnected.current) {
      // ResizeObserver invokes the `handleResize` callback as soon as `observe` is called,
      // assuming the element is rendered and displayed.
      resizeObserverConnected.current = true;
      return;
    }
    if (callbackId.current != null) {
      clearTimeout(callbackId.current);
    }
    callbackId.current = setTimeout(() => {
      measureDroppableContainers(Array.isArray(ids.current) ? ids.current : [ids.current]);
      callbackId.current = null;
    }, resizeObserverTimeout);
  },
  //eslint-disable-next-line react-hooks/exhaustive-deps
  [resizeObserverTimeout]);
  const resizeObserver = useResizeObserver({
    callback: handleResize,
    disabled: resizeObserverDisabled || !active
  });
  const handleNodeChange = useCallback((newElement, previousElement) => {
    if (!resizeObserver) {
      return;
    }
    if (previousElement) {
      resizeObserver.unobserve(previousElement);
      resizeObserverConnected.current = false;
    }
    if (newElement) {
      resizeObserver.observe(newElement);
    }
  }, [resizeObserver]);
  const [nodeRef, setNodeRef] = useNodeRef(handleNodeChange);
  const dataRef = useLatestValue(data);
  useEffect(() => {
    if (!resizeObserver || !nodeRef.current) {
      return;
    }
    resizeObserver.disconnect();
    resizeObserverConnected.current = false;
    resizeObserver.observe(nodeRef.current);
  }, [nodeRef, resizeObserver]);
  useEffect(() => {
    dispatch({
      type: Action.RegisterDroppable,
      element: {
        id,
        key,
        disabled,
        node: nodeRef,
        rect,
        data: dataRef
      }
    });
    return () => dispatch({
      type: Action.UnregisterDroppable,
      key,
      id
    });
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [id]);
  useEffect(() => {
    if (disabled !== previous.current.disabled) {
      dispatch({
        type: Action.SetDroppableDisabled,
        id,
        key,
        disabled
      });
      previous.current.disabled = disabled;
    }
  }, [id, key, disabled, dispatch]);
  return {
    active,
    rect,
    isOver: (over == null ? void 0 : over.id) === id,
    node: nodeRef,
    over,
    setNodeRef
  };
}

/**
 * Move an array item to a different position. Returns a new array with the item moved to the new position.
 */
function arrayMove(array, from, to) {
  const newArray = array.slice();
  newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
  return newArray;
}
function getSortedRects(items, rects) {
  return items.reduce((accumulator, id, index) => {
    const rect = rects.get(id);
    if (rect) {
      accumulator[index] = rect;
    }
    return accumulator;
  }, Array(items.length));
}
function isValidIndex(index) {
  return index !== null && index >= 0;
}
function itemsEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function normalizeDisabled(disabled) {
  if (typeof disabled === 'boolean') {
    return {
      draggable: disabled,
      droppable: disabled
    };
  }
  return disabled;
}
const rectSortingStrategy = _ref => {
  let {
    rects,
    activeIndex,
    overIndex,
    index
  } = _ref;
  const newRects = arrayMove(rects, overIndex, activeIndex);
  const oldRect = rects[index];
  const newRect = newRects[index];
  if (!newRect || !oldRect) {
    return null;
  }
  return {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: newRect.width / oldRect.width,
    scaleY: newRect.height / oldRect.height
  };
};

// To-do: We should be calculating scale transformation
const defaultScale$1 = {
  scaleX: 1,
  scaleY: 1
};
const verticalListSortingStrategy = _ref => {
  var _rects$activeIndex;
  let {
    activeIndex,
    activeNodeRect: fallbackActiveRect,
    index,
    rects,
    overIndex
  } = _ref;
  const activeNodeRect = (_rects$activeIndex = rects[activeIndex]) != null ? _rects$activeIndex : fallbackActiveRect;
  if (!activeNodeRect) {
    return null;
  }
  if (index === activeIndex) {
    const overIndexRect = rects[overIndex];
    if (!overIndexRect) {
      return null;
    }
    return {
      x: 0,
      y: activeIndex < overIndex ? overIndexRect.top + overIndexRect.height - (activeNodeRect.top + activeNodeRect.height) : overIndexRect.top - activeNodeRect.top,
      ...defaultScale$1
    };
  }
  const itemGap = getItemGap$1(rects, index, activeIndex);
  if (index > activeIndex && index <= overIndex) {
    return {
      x: 0,
      y: -activeNodeRect.height - itemGap,
      ...defaultScale$1
    };
  }
  if (index < activeIndex && index >= overIndex) {
    return {
      x: 0,
      y: activeNodeRect.height + itemGap,
      ...defaultScale$1
    };
  }
  return {
    x: 0,
    y: 0,
    ...defaultScale$1
  };
};
function getItemGap$1(clientRects, index, activeIndex) {
  const currentRect = clientRects[index];
  const previousRect = clientRects[index - 1];
  const nextRect = clientRects[index + 1];
  if (!currentRect) {
    return 0;
  }
  if (activeIndex < index) {
    return previousRect ? currentRect.top - (previousRect.top + previousRect.height) : nextRect ? nextRect.top - (currentRect.top + currentRect.height) : 0;
  }
  return nextRect ? nextRect.top - (currentRect.top + currentRect.height) : previousRect ? currentRect.top - (previousRect.top + previousRect.height) : 0;
}
const ID_PREFIX = 'Sortable';
const Context = /*#__PURE__*/React.createContext({
  activeIndex: -1,
  containerId: ID_PREFIX,
  disableTransforms: false,
  items: [],
  overIndex: -1,
  useDragOverlay: false,
  sortedRects: [],
  strategy: rectSortingStrategy,
  disabled: {
    draggable: false,
    droppable: false
  }
});
function SortableContext(_ref) {
  let {
    children,
    id,
    items: userDefinedItems,
    strategy = rectSortingStrategy,
    disabled: disabledProp = false
  } = _ref;
  const {
    active,
    dragOverlay,
    droppableRects,
    over,
    measureDroppableContainers
  } = useDndContext();
  const containerId = useUniqueId(ID_PREFIX, id);
  const useDragOverlay = Boolean(dragOverlay.rect !== null);
  const items = useMemo(() => userDefinedItems.map(item => typeof item === 'object' && 'id' in item ? item.id : item), [userDefinedItems]);
  const isDragging = active != null;
  const activeIndex = active ? items.indexOf(active.id) : -1;
  const overIndex = over ? items.indexOf(over.id) : -1;
  const previousItemsRef = useRef(items);
  const itemsHaveChanged = !itemsEqual(items, previousItemsRef.current);
  const disableTransforms = overIndex !== -1 && activeIndex === -1 || itemsHaveChanged;
  const disabled = normalizeDisabled(disabledProp);
  useIsomorphicLayoutEffect(() => {
    if (itemsHaveChanged && isDragging) {
      measureDroppableContainers(items);
    }
  }, [itemsHaveChanged, items, isDragging, measureDroppableContainers]);
  useEffect(() => {
    previousItemsRef.current = items;
  }, [items]);
  const contextValue = useMemo(() => ({
    activeIndex,
    containerId,
    disabled,
    disableTransforms,
    items,
    overIndex,
    useDragOverlay,
    sortedRects: getSortedRects(items, droppableRects),
    strategy
  }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [activeIndex, containerId, disabled.draggable, disabled.droppable, disableTransforms, items, overIndex, droppableRects, useDragOverlay, strategy]);
  return React.createElement(Context.Provider, {
    value: contextValue
  }, children);
}
const defaultNewIndexGetter = _ref => {
  let {
    id,
    items,
    activeIndex,
    overIndex
  } = _ref;
  return arrayMove(items, activeIndex, overIndex).indexOf(id);
};
const defaultAnimateLayoutChanges = _ref2 => {
  let {
    containerId,
    isSorting,
    wasDragging,
    index,
    items,
    newIndex,
    previousItems,
    previousContainerId,
    transition
  } = _ref2;
  if (!transition || !wasDragging) {
    return false;
  }
  if (previousItems !== items && index === newIndex) {
    return false;
  }
  if (isSorting) {
    return true;
  }
  return newIndex !== index && containerId === previousContainerId;
};
const defaultTransition = {
  duration: 200,
  easing: 'ease'
};
const transitionProperty = 'transform';
const disabledTransition = /*#__PURE__*/CSS.Transition.toString({
  property: transitionProperty,
  duration: 0,
  easing: 'linear'
});
const defaultAttributes = {
  roleDescription: 'sortable'
};

/*
 * When the index of an item changes while sorting,
 * we need to temporarily disable the transforms
 */

function useDerivedTransform(_ref) {
  let {
    disabled,
    index,
    node,
    rect
  } = _ref;
  const [derivedTransform, setDerivedtransform] = useState(null);
  const previousIndex = useRef(index);
  useIsomorphicLayoutEffect(() => {
    if (!disabled && index !== previousIndex.current && node.current) {
      const initial = rect.current;
      if (initial) {
        const current = getClientRect(node.current, {
          ignoreTransform: true
        });
        const delta = {
          x: initial.left - current.left,
          y: initial.top - current.top,
          scaleX: initial.width / current.width,
          scaleY: initial.height / current.height
        };
        if (delta.x || delta.y) {
          setDerivedtransform(delta);
        }
      }
    }
    if (index !== previousIndex.current) {
      previousIndex.current = index;
    }
  }, [disabled, index, node, rect]);
  useEffect(() => {
    if (derivedTransform) {
      setDerivedtransform(null);
    }
  }, [derivedTransform]);
  return derivedTransform;
}
function useSortable(_ref) {
  let {
    animateLayoutChanges = defaultAnimateLayoutChanges,
    attributes: userDefinedAttributes,
    disabled: localDisabled,
    data: customData,
    getNewIndex = defaultNewIndexGetter,
    id,
    strategy: localStrategy,
    resizeObserverConfig,
    transition = defaultTransition
  } = _ref;
  const {
    items,
    containerId,
    activeIndex,
    disabled: globalDisabled,
    disableTransforms,
    sortedRects,
    overIndex,
    useDragOverlay,
    strategy: globalStrategy
  } = useContext(Context);
  const disabled = normalizeLocalDisabled(localDisabled, globalDisabled);
  const index = items.indexOf(id);
  const data = useMemo(() => ({
    sortable: {
      containerId,
      index,
      items
    },
    ...customData
  }), [containerId, customData, index, items]);
  const itemsAfterCurrentSortable = useMemo(() => items.slice(items.indexOf(id)), [items, id]);
  const {
    rect,
    node,
    isOver,
    setNodeRef: setDroppableNodeRef
  } = useDroppable({
    id,
    data,
    disabled: disabled.droppable,
    resizeObserverConfig: {
      updateMeasurementsFor: itemsAfterCurrentSortable,
      ...resizeObserverConfig
    }
  });
  const {
    active,
    activatorEvent,
    activeNodeRect,
    attributes,
    setNodeRef: setDraggableNodeRef,
    listeners,
    isDragging,
    over,
    setActivatorNodeRef,
    transform
  } = useDraggable({
    id,
    data,
    attributes: {
      ...defaultAttributes,
      ...userDefinedAttributes
    },
    disabled: disabled.draggable
  });
  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeRef);
  const isSorting = Boolean(active);
  const displaceItem = isSorting && !disableTransforms && isValidIndex(activeIndex) && isValidIndex(overIndex);
  const shouldDisplaceDragSource = !useDragOverlay && isDragging;
  const dragSourceDisplacement = shouldDisplaceDragSource && displaceItem ? transform : null;
  const strategy = localStrategy != null ? localStrategy : globalStrategy;
  const finalTransform = displaceItem ? dragSourceDisplacement != null ? dragSourceDisplacement : strategy({
    rects: sortedRects,
    activeNodeRect,
    activeIndex,
    overIndex,
    index
  }) : null;
  const newIndex = isValidIndex(activeIndex) && isValidIndex(overIndex) ? getNewIndex({
    id,
    items,
    activeIndex,
    overIndex
  }) : index;
  const activeId = active == null ? void 0 : active.id;
  const previous = useRef({
    activeId,
    items,
    newIndex,
    containerId
  });
  const itemsHaveChanged = items !== previous.current.items;
  const shouldAnimateLayoutChanges = animateLayoutChanges({
    active,
    containerId,
    isDragging,
    isSorting,
    id,
    index,
    items,
    newIndex: previous.current.newIndex,
    previousItems: previous.current.items,
    previousContainerId: previous.current.containerId,
    transition,
    wasDragging: previous.current.activeId != null
  });
  const derivedTransform = useDerivedTransform({
    disabled: !shouldAnimateLayoutChanges,
    index,
    node,
    rect
  });
  useEffect(() => {
    if (isSorting && previous.current.newIndex !== newIndex) {
      previous.current.newIndex = newIndex;
    }
    if (containerId !== previous.current.containerId) {
      previous.current.containerId = containerId;
    }
    if (items !== previous.current.items) {
      previous.current.items = items;
    }
  }, [isSorting, newIndex, containerId, items]);
  useEffect(() => {
    if (activeId === previous.current.activeId) {
      return;
    }
    if (activeId != null && previous.current.activeId == null) {
      previous.current.activeId = activeId;
      return;
    }
    const timeoutId = setTimeout(() => {
      previous.current.activeId = activeId;
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [activeId]);
  return {
    active,
    activeIndex,
    attributes,
    data,
    rect,
    index,
    newIndex,
    items,
    isOver,
    isSorting,
    isDragging,
    listeners,
    node,
    overIndex,
    over,
    setNodeRef,
    setActivatorNodeRef,
    setDroppableNodeRef,
    setDraggableNodeRef,
    transform: derivedTransform != null ? derivedTransform : finalTransform,
    transition: getTransition()
  };
  function getTransition() {
    if (
    // Temporarily disable transitions for a single frame to set up derived transforms
    derivedTransform ||
    // Or to prevent items jumping to back to their "new" position when items change
    itemsHaveChanged && previous.current.newIndex === index) {
      return disabledTransition;
    }
    if (shouldDisplaceDragSource && !isKeyboardEvent(activatorEvent) || !transition) {
      return undefined;
    }
    if (isSorting || shouldAnimateLayoutChanges) {
      return CSS.Transition.toString({
        ...transition,
        property: transitionProperty
      });
    }
    return undefined;
  }
}
function normalizeLocalDisabled(localDisabled, globalDisabled) {
  var _localDisabled$dragga, _localDisabled$droppa;
  if (typeof localDisabled === 'boolean') {
    return {
      draggable: localDisabled,
      // Backwards compatibility
      droppable: false
    };
  }
  return {
    draggable: (_localDisabled$dragga = localDisabled == null ? void 0 : localDisabled.draggable) != null ? _localDisabled$dragga : globalDisabled.draggable,
    droppable: (_localDisabled$droppa = localDisabled == null ? void 0 : localDisabled.droppable) != null ? _localDisabled$droppa : globalDisabled.droppable
  };
}
function hasSortableData(entry) {
  if (!entry) {
    return false;
  }
  const data = entry.data.current;
  if (data && 'sortable' in data && typeof data.sortable === 'object' && 'containerId' in data.sortable && 'items' in data.sortable && 'index' in data.sortable) {
    return true;
  }
  return false;
}
const directions = [KeyboardCode.Down, KeyboardCode.Right, KeyboardCode.Up, KeyboardCode.Left];
const sortableKeyboardCoordinates = (event, _ref) => {
  let {
    context: {
      active,
      collisionRect,
      droppableRects,
      droppableContainers,
      over,
      scrollableAncestors
    }
  } = _ref;
  if (directions.includes(event.code)) {
    event.preventDefault();
    if (!active || !collisionRect) {
      return;
    }
    const filteredContainers = [];
    droppableContainers.getEnabled().forEach(entry => {
      if (!entry || entry != null && entry.disabled) {
        return;
      }
      const rect = droppableRects.get(entry.id);
      if (!rect) {
        return;
      }
      switch (event.code) {
        case KeyboardCode.Down:
          if (collisionRect.top < rect.top) {
            filteredContainers.push(entry);
          }
          break;
        case KeyboardCode.Up:
          if (collisionRect.top > rect.top) {
            filteredContainers.push(entry);
          }
          break;
        case KeyboardCode.Left:
          if (collisionRect.left > rect.left) {
            filteredContainers.push(entry);
          }
          break;
        case KeyboardCode.Right:
          if (collisionRect.left < rect.left) {
            filteredContainers.push(entry);
          }
          break;
      }
    });
    const collisions = closestCorners({
      active,
      collisionRect: collisionRect,
      droppableRects,
      droppableContainers: filteredContainers,
      pointerCoordinates: null
    });
    let closestId = getFirstCollision(collisions, 'id');
    if (closestId === (over == null ? void 0 : over.id) && collisions.length > 1) {
      closestId = collisions[1].id;
    }
    if (closestId != null) {
      const activeDroppable = droppableContainers.get(active.id);
      const newDroppable = droppableContainers.get(closestId);
      const newRect = newDroppable ? droppableRects.get(newDroppable.id) : null;
      const newNode = newDroppable == null ? void 0 : newDroppable.node.current;
      if (newNode && newRect && activeDroppable && newDroppable) {
        const newScrollAncestors = getScrollableAncestors(newNode);
        const hasDifferentScrollAncestors = newScrollAncestors.some((element, index) => scrollableAncestors[index] !== element);
        const hasSameContainer = isSameContainer(activeDroppable, newDroppable);
        const isAfterActive = isAfter(activeDroppable, newDroppable);
        const offset = hasDifferentScrollAncestors || !hasSameContainer ? {
          x: 0,
          y: 0
        } : {
          x: isAfterActive ? collisionRect.width - newRect.width : 0,
          y: isAfterActive ? collisionRect.height - newRect.height : 0
        };
        const rectCoordinates = {
          x: newRect.left,
          y: newRect.top
        };
        const newCoordinates = offset.x && offset.y ? rectCoordinates : subtract(rectCoordinates, offset);
        return newCoordinates;
      }
    }
  }
  return undefined;
};
function isSameContainer(a, b) {
  if (!hasSortableData(a) || !hasSortableData(b)) {
    return false;
  }
  return a.data.current.sortable.containerId === b.data.current.sortable.containerId;
}
function isAfter(a, b) {
  if (!hasSortableData(a) || !hasSortableData(b)) {
    return false;
  }
  if (!isSameContainer(a, b)) {
    return false;
  }
  return a.data.current.sortable.index < b.data.current.sortable.index;
}

/**
 * Action buttons for editing mode - Edit and Delete
 * Note: Move up/down has been replaced with drag-and-drop reordering
 */
function FAQItemActions(props) {
    const { onEdit, onDelete } = props;
    return (jsxs("div", { className: "faq-item-actions", children: [jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-edit"), onClick: (e) => {
                    e.stopPropagation();
                    onEdit();
                }, title: "Edit FAQ", "aria-label": "Edit FAQ item", children: jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsx("path", { d: "M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" }) }) }), jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-delete"), onClick: (e) => {
                    e.stopPropagation();
                    onDelete();
                }, title: "Delete FAQ", "aria-label": "Delete FAQ item", children: jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [jsx("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), jsx("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" })] }) })] }));
}

function DraggableFAQItem({ id, index, summary, processedContent, warnings, animationDuration, onEdit, onDelete, collapseAll = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        "--animation-duration": `${animationDuration}ms`
    };
    return (jsxs("div", { ref: setNodeRef, style: style, className: classNames("faq-item", "faq-item--edit-mode", {
            open: !collapseAll,
            "faq-item--dragging": isDragging
        }), children: [jsxs("div", { className: "faq-item-header-edit", children: [jsx("button", { className: "faq-drag-handle", ...attributes, ...listeners, "aria-label": `Drag to reorder FAQ item ${index + 1}: ${summary}`, type: "button", children: jsx("svg", { focusable: "false", "aria-hidden": "true", viewBox: "0 0 24 24", children: jsx("path", { d: "M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2m-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2" }) }) }), jsx("span", { className: "faq-item-summary-text", children: summary }), jsx("div", { children: jsx(FAQItemActions, { onEdit: onEdit, onDelete: onDelete }) })] }), jsxs("div", { className: "faq-item-content", children: [warnings.length > 0 && (jsx("div", { className: "faq-item-warnings", children: warnings.map((warning, wIndex) => (jsxs("div", { className: "faq-item-warning", children: ["\u26A0\uFE0F ", warning] }, wIndex))) })), jsx("div", { className: "faq-item-content-inner", dangerouslySetInnerHTML: { __html: processedContent } })] })] }));
}

function EditFAQForm(props) {
    const { summary: initialSummary, content: initialContent, format: initialFormat, sortOrder: initialSortOrder = 10, onSave, onCancel, isNew = false, isInline = false } = props;
    const [summary, setSummary] = useState(initialSummary);
    const [content, setContent] = useState(initialContent);
    const [format, setFormat] = useState(initialFormat);
    const [sortOrder, setSortOrder] = useState(initialSortOrder);
    const [showPreview, setShowPreview] = useState(false);
    // Validation warnings
    const warnings = getContentWarnings(content, format);
    const hasWarnings = warnings.length > 0;
    const handleSave = () => {
        if (!summary.trim()) {
            alert("Summary/Question is required");
            return;
        }
        if (!content.trim()) {
            alert("Content/Answer is required");
            return;
        }
        onSave(summary.trim(), content.trim(), format, sortOrder);
    };
    return (jsxs("div", { className: classNames("faq-edit-form", { "faq-edit-form--inline": isInline }), children: [jsxs("div", { className: "faq-edit-form-header", children: [jsx("h3", { children: isNew ? "Add New FAQ" : "Edit FAQ" }), jsx("button", { className: "faq-edit-form-close", onClick: onCancel, type: "button", "aria-label": "Close", children: "\u2715" })] }), jsxs("div", { className: "faq-edit-form-body", children: [jsxs("div", { className: "faq-form-field", children: [jsxs("label", { htmlFor: "faq-summary", children: ["Question/Summary ", jsx("span", { className: "faq-required", children: "*" })] }), jsx("input", { id: "faq-summary", type: "text", className: "faq-form-input", value: summary, onChange: (e) => setSummary(e.target.value), placeholder: "Enter the question or summary...", required: true })] }), jsxs("div", { className: "faq-form-field", children: [jsxs("label", { htmlFor: "faq-sortorder", children: ["Sort Order ", jsx("span", { className: "faq-required", children: "*" })] }), jsx("input", { id: "faq-sortorder", type: "number", className: "faq-form-input", value: sortOrder, onChange: (e) => setSortOrder(Number(e.target.value)), required: true, min: "0", step: "10" }), jsx("small", { className: "faq-form-help", children: "Items are displayed in ascending sort order (10, 20, 30...). Lower numbers appear first." })] }), jsxs("div", { className: "faq-form-field", children: [jsxs("label", { htmlFor: "faq-format", children: ["Content Format ", jsx("span", { className: "faq-required", children: "*" })] }), jsxs("select", { id: "faq-format", className: "faq-form-select", value: format, onChange: (e) => setFormat(e.target.value), children: [jsx("option", { value: "html", children: "HTML" }), jsx("option", { value: "markdown", children: "Markdown" }), jsx("option", { value: "text", children: "Plain Text" })] }), jsxs("small", { className: "faq-form-help", children: [format === "html" && "Allows rich formatting with HTML tags", format === "markdown" &&
                                        "Uses Markdown syntax (e.g., **bold**, # heading)", format === "text" && "Plain text only, HTML will be escaped"] })] }), jsxs("div", { className: "faq-form-field", children: [jsxs("label", { htmlFor: "faq-content", children: ["Answer/Content ", jsx("span", { className: "faq-required", children: "*" })] }), jsx("textarea", { id: "faq-content", className: classNames("faq-form-textarea", {
                                    "faq-form-textarea--warning": hasWarnings
                                }), value: content, onChange: (e) => setContent(e.target.value), placeholder: "Enter the answer or content...", rows: 10, required: true }), hasWarnings && (jsxs("div", { className: "faq-form-warnings", children: [jsx("strong", { children: "\u26A0\uFE0F Content Warnings:" }), jsx("ul", { children: warnings.map((warning, i) => (jsx("li", { children: warning }, i))) })] }))] }), jsx("div", { className: "faq-form-field", children: jsxs("button", { type: "button", className: "faq-preview-toggle", onClick: () => setShowPreview(!showPreview), children: [showPreview ? "Hide" : "Show", " Preview"] }) }), showPreview && (jsxs("div", { className: "faq-form-preview", children: [jsx("h4", { children: "Preview:" }), jsx("div", { className: "faq-form-preview-content", dangerouslySetInnerHTML: { __html: processContent(content, format) } })] }))] }), jsxs("div", { className: "faq-edit-form-footer", children: [jsx("button", { type: "button", className: "faq-btn faq-btn-secondary", onClick: onCancel, children: "Cancel" }), jsx("button", { type: "button", className: "faq-btn faq-btn-primary", onClick: handleSave, disabled: !summary.trim() || !content.trim(), children: isNew ? "Create FAQ" : "Save Changes" })] })] }));
}

/**
 * Renders the FAQ items list in edit mode with drag-and-drop reordering
 */
function FAQEditableList({ items, sortableIds, expandedItems, animationDuration, onEditItem, onDeleteItem, onDragEnd, editingItemIndex, editingSortOrder, defaultSortOrder, onSaveEdit, onCancelEdit, showCreateForm, onSaveNew, onCancelCreate }) {
    const [isDraggingAny, setIsDraggingAny] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8
        }
    }), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
    }));
    const handleDragStart = (_event) => {
        setIsDraggingAny(true);
    };
    const handleDragEnd = (event) => {
        setIsDraggingAny(false);
        onDragEnd(event);
    };
    return (jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragStart: handleDragStart, onDragEnd: handleDragEnd, children: jsx(SortableContext, { items: sortableIds, strategy: verticalListSortingStrategy, children: jsxs("div", { className: "faq-accordion-items faq-accordion-items--edit-mode", children: [showCreateForm && (jsx("div", { className: "faq-item faq-item--inline-create", children: jsx(EditFAQForm, { summary: "", content: "", format: "html", sortOrder: defaultSortOrder, onSave: onSaveNew, onCancel: onCancelCreate, isNew: true, isInline: true }) })), items.map((item, index) => {
                        // If this item is being edited, show the inline form
                        if (editingItemIndex === index) {
                            return (jsx("div", { className: "faq-item faq-item--inline-edit", children: jsx(EditFAQForm, { summary: item.summary, content: item.content, format: item.contentFormat, sortOrder: editingSortOrder ?? defaultSortOrder, onSave: onSaveEdit, onCancel: onCancelEdit, isNew: false, isInline: true }) }, sortableIds[index]));
                        }
                        const processedContent = processContent(item.content, item.contentFormat);
                        const warnings = getContentWarnings(item.content, item.contentFormat);
                        return (jsx(DraggableFAQItem, { id: sortableIds[index], index: index, summary: item.summary, processedContent: processedContent, warnings: warnings, animationDuration: animationDuration, onEdit: () => onEditItem(index), onDelete: () => onDeleteItem(index), collapseAll: isDraggingAny }, sortableIds[index]));
                    })] }) }) }));
}

/**
 * Confirmation dialog modal for destructive actions (e.g., delete)
 */
function ConfirmDialog(props) {
    const { isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false } = props;
    if (!isOpen) {
        return null;
    }
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };
    return (jsx("div", { className: "faq-confirm-dialog-overlay", onClick: handleOverlayClick, role: "presentation", children: jsxs("div", { className: "faq-confirm-dialog", role: "alertdialog", "aria-labelledby": "dialog-title", "aria-describedby": "dialog-message", children: [jsxs("div", { className: "faq-confirm-dialog-header", children: [isDestructive && (jsx("svg", { className: "faq-confirm-dialog-icon-warning", width: "24", height: "24", viewBox: "0 0 16 16", fill: "currentColor", children: jsx("path", { d: "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" }) })), jsx("h3", { id: "dialog-title", className: "faq-confirm-dialog-title", children: title })] }), jsx("div", { id: "dialog-message", className: "faq-confirm-dialog-message", children: message }), jsxs("div", { className: "faq-confirm-dialog-actions", children: [jsx("button", { type: "button", className: classNames("faq-confirm-dialog-btn", "faq-btn-cancel"), onClick: onCancel, children: cancelText }), jsx("button", { type: "button", className: classNames("faq-confirm-dialog-btn", "faq-btn-confirm", {
                                "faq-btn-destructive": isDestructive
                            }), onClick: onConfirm, children: confirmText })] })] }) }));
}

/**
 * Component that renders FAQ modals (delete confirmation)
 * Note: Create and Edit forms are now rendered inline in FAQEditableList
 */
function FAQModals({ deleteConfirmIndex, onConfirmDelete, onCancelDelete }) {
    return (jsx(Fragment, { children: jsx(ConfirmDialog, { isOpen: deleteConfirmIndex !== null, title: "Delete FAQ Item", message: "Are you sure you want to delete this FAQ item? This action cannot be undone.", onConfirm: onConfirmDelete, onCancel: onCancelDelete, confirmText: "Delete", cancelText: "Cancel", isDestructive: true }) }));
}

function FAQAccordion(props) {
    const { dataSourceType, faqItems, dataSource, defaultExpandAll, showToggleButton, toggleButtonText, animationDuration, allowEditing, editorRole, onSaveAction, onDeleteAction, onCreateAction, sortOrderAttribute, 
    // Attribute overrides (optional)
    summaryAttribute, contentAttribute, contentFormatAttribute, sortOrderAttributeOverride } = props;
    // Attribute overrides for useFAQData and useFAQActions (pass the ListAttributeValue objects directly)
    const attributeOverrides = useMemo(() => ({
        summaryAttribute,
        contentAttribute,
        contentFormatAttribute,
        sortOrderAttributeOverride
    }), [summaryAttribute, contentAttribute, contentFormatAttribute, sortOrderAttributeOverride]);
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
    const [expandedItems, setExpandedItems] = useState(new Set());
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
        if (dataSourceType === "database" &&
            dataSource &&
            sortOrderAttribute &&
            dataSource.items?.[editState.editingItemIndex]) {
            try {
                const raw = sortOrderAttribute.get(dataSource.items[editState.editingItemIndex]).value;
                return raw ? Number(raw.toString()) : undefined;
            }
            catch (err) {
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
            }
            else if (allowEditing && !editorRole) {
                setUserHasRole(true);
            }
            else {
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
    const toggleItem = (index) => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            }
            else {
                newSet.add(index);
            }
            return newSet;
        });
    };
    // Toggle all items
    const toggleAll = () => {
        if (allExpanded) {
            setExpandedItems(new Set());
            setAllExpanded(false);
        }
        else {
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
    const handleCancelEdit = () => {
        if (editState.editingItemIndex !== null) {
            editState.cancelEditing();
        }
        if (editState.showCreateForm) {
            editState.cancelCreating();
        }
    };
    // Show loading state for database mode
    if (isLoading) {
        return (jsx("div", { className: "faq-accordion-loading", children: jsx("p", { children: "Loading FAQ items..." }) }));
    }
    if (!items || items.length === 0) {
        return (jsx("div", { className: "faq-accordion-empty", children: jsx("p", { children: "No FAQ items configured" }) }));
    }
    return (jsxs("div", { className: "faq-accordion-container", children: [jsx(FAQHeader, { showToggleButton: showToggleButton, allExpanded: allExpanded, toggleButtonText: toggleButtonText?.value, onToggleAll: toggleAll, isEditingEnabled: isEditingEnabled, editMode: editState.editMode, onToggleEditMode: editState.toggleEditMode, onCreateNew: editState.startCreating }), editState.editMode && isEditingEnabled ? (jsx(FAQEditableList, { items: items, sortableIds: sortableIds, expandedItems: expandedItems, animationDuration: animationDuration || 300, onEditItem: editState.startEditingItem, onDeleteItem: editState.startDeleting, onDragEnd: handleDragEnd, editingItemIndex: editState.editingItemIndex, editingSortOrder: editingSortOrder, defaultSortOrder: defaultSortOrder, onSaveEdit: handleSaveEdit, onCancelEdit: handleCancelEdit, showCreateForm: editState.showCreateForm, onSaveNew: handleSaveNew, onCancelCreate: handleCancelEdit })) : (jsx(FAQItemsList, { items: items, expandedItems: expandedItems, animationDuration: animationDuration || 300, onToggleItem: toggleItem })), jsx(FAQModals, { deleteConfirmIndex: editState.deleteConfirmIndex, onConfirmDelete: handleConfirmDelete, onCancelDelete: editState.cancelDelete })] }));
}

export { FAQAccordion };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRkFRQWNjb3JkaW9uLm1qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3V0aWxzL2VkaXRpbmdVdGlscy50cyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9ob29rcy91c2VFZGl0TW9kZS50cyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb25maWcvYXR0cmlidXRlQ29uZmlnLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL3V0aWxzL21lbmRpeERhdGFTZXJ2aWNlLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2hvb2tzL3VzZUZBUURhdGEudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvaG9va3MvdXNlRkFRQWN0aW9ucy50cyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jbGFzc25hbWVzL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRWRpdE1vZGVUb2dnbGUudHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRkFRSGVhZGVyLnRzeCIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9kb21wdXJpZnkvZGlzdC9wdXJpZnkuZXMubWpzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL21hcmtlZC9saWIvbWFya2VkLmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL3NyYy91dGlscy9jb250ZW50UHJvY2Vzc29yLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRkFRSXRlbXNMaXN0LnRzeCIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AZG5kLWtpdC91dGlsaXRpZXMvZGlzdC91dGlsaXRpZXMuZXNtLmpzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BkbmQta2l0L2FjY2Vzc2liaWxpdHkvZGlzdC9hY2Nlc3NpYmlsaXR5LmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AZG5kLWtpdC9jb3JlL2Rpc3QvY29yZS5lc20uanMiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGRuZC1raXQvc29ydGFibGUvZGlzdC9zb3J0YWJsZS5lc20uanMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9GQVFJdGVtQWN0aW9ucy50c3giLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9EcmFnZ2FibGVGQVFJdGVtLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0VkaXRGQVFGb3JtLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ZBUUVkaXRhYmxlTGlzdC50c3giLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Db25maXJtRGlhbG9nLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ZBUU1vZGFscy50c3giLCIuLi8uLi8uLi8uLi8uLi9zcmMvRkFRQWNjb3JkaW9uLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25zIGZvciBlZGl0aW5nIG1vZGUgYW5kIHJvbGUtYmFzZWQgYWNjZXNzIGNvbnRyb2xcbiAqL1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgY3VycmVudCB1c2VyIGhhcyB0aGUgcmVxdWlyZWQgcm9sZSBmb3IgZWRpdGluZ1xuICogQHBhcmFtIHJlcXVpcmVkUm9sZSAtIFRoZSByb2xlIG5hbWUgcmVxdWlyZWQgKGVtcHR5IHN0cmluZyA9IGFsbCBhdXRoZW50aWNhdGVkIHVzZXJzKVxuICogQHJldHVybnMgUHJvbWlzZTxib29sZWFuPiAtIFRydWUgaWYgdXNlciBoYXMgYWNjZXNzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja1VzZXJSb2xlKHJlcXVpcmVkUm9sZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgLy8gSWYgbm8gcm9sZSBzcGVjaWZpZWQsIGFsbG93IGFsbCBhdXRoZW50aWNhdGVkIHVzZXJzXG4gICAgaWYgKCFyZXF1aXJlZFJvbGUgfHwgcmVxdWlyZWRSb2xlLnRyaW0oKSA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBVc2UgTWVuZGl4IENsaWVudCBBUEkgdG8gY2hlY2sgdXNlciByb2xlc1xuICAgICAgICAvLyBOb3RlOiBJbiBhY3R1YWwgTWVuZGl4IHJ1bnRpbWUsIHlvdSdkIHVzZSBteC5zZXNzaW9uIG9yIHNpbWlsYXJcbiAgICAgICAgLy8gVGhpcyBpcyBhIHBsYWNlaG9sZGVyIC0gTWVuZGl4IHdpZGdldHMgdHlwaWNhbGx5IHVzZSBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uXG4gICAgICAgIC8vIEZvciBub3csIHdlJ2xsIHJldHVybiB0cnVlIGFuZCByZWx5IG9uIG1pY3JvZmxvdyB2YWxpZGF0aW9uXG4gICAgICAgIGNvbnNvbGUubG9nKGBDaGVja2luZyByb2xlOiAke3JlcXVpcmVkUm9sZX1gKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNoZWNraW5nIHVzZXIgcm9sZTpcIiwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBpZiBlZGl0aW5nIGlzIGFsbG93ZWQgYmFzZWQgb24gY29uZmlndXJhdGlvblxuICogQHBhcmFtIGFsbG93RWRpdGluZyAtIFdoZXRoZXIgZWRpdGluZyBpcyBlbmFibGVkXG4gKiBAcGFyYW0gZGF0YVNvdXJjZVR5cGUgLSBUeXBlIG9mIGRhdGEgc291cmNlXG4gKiBAcGFyYW0gaGFzUm9sZSAtIFdoZXRoZXIgdXNlciBoYXMgcmVxdWlyZWQgcm9sZVxuICogQHJldHVybnMgYm9vbGVhbiAtIFRydWUgaWYgZWRpdGluZyBzaG91bGQgYmUgYWxsb3dlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuRWRpdChhbGxvd0VkaXRpbmc6IGJvb2xlYW4sIGRhdGFTb3VyY2VUeXBlOiBzdHJpbmcsIGhhc1JvbGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICAvLyBFZGl0aW5nIG9ubHkgd29ya3Mgd2l0aCBkYXRhYmFzZSBtb2RlXG4gICAgaWYgKGRhdGFTb3VyY2VUeXBlICE9PSBcImRhdGFiYXNlXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEVkaXRpbmcgbXVzdCBiZSBlbmFibGVkXG4gICAgaWYgKCFhbGxvd0VkaXRpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFVzZXIgbXVzdCBoYXZlIHJlcXVpcmVkIHJvbGVcbiAgICByZXR1cm4gaGFzUm9sZTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSB0ZW1wb3JhcnkgSUQgZm9yIG5ldyBGQVEgaXRlbXMgYmVmb3JlIHRoZXkncmUgc2F2ZWRcbiAqIEByZXR1cm5zIHN0cmluZyAtIFRlbXBvcmFyeSBJRFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVUZW1wSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYHRlbXBfJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA5KX1gO1xufVxuIiwiLyoqXG4gKiBDdXN0b20gaG9vayBmb3IgbWFuYWdpbmcgZWRpdCBtb2RlIHN0YXRlIGluIEZBUSBBY2NvcmRpb25cbiAqIENlbnRyYWxpemVzIGFsbCBlZGl0LXJlbGF0ZWQgc3RhdGUgYW5kIGFjdGlvbnNcbiAqL1xuXG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFVzZUVkaXRNb2RlUmV0dXJuIHtcbiAgICAvLyBTdGF0ZVxuICAgIGVkaXRNb2RlOiBib29sZWFuO1xuICAgIGVkaXRpbmdJdGVtSW5kZXg6IG51bWJlciB8IG51bGw7XG4gICAgc2hvd0NyZWF0ZUZvcm06IGJvb2xlYW47XG4gICAgZGVsZXRlQ29uZmlybUluZGV4OiBudW1iZXIgfCBudWxsO1xuXG4gICAgLy8gQWN0aW9uc1xuICAgIHRvZ2dsZUVkaXRNb2RlOiAoKSA9PiB2b2lkO1xuICAgIHN0YXJ0RWRpdGluZ0l0ZW06IChpbmRleDogbnVtYmVyKSA9PiB2b2lkO1xuICAgIGNhbmNlbEVkaXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgc3RhcnRDcmVhdGluZzogKCkgPT4gdm9pZDtcbiAgICBjYW5jZWxDcmVhdGluZzogKCkgPT4gdm9pZDtcbiAgICBzdGFydERlbGV0aW5nOiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZDtcbiAgICBjb25maXJtRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbERlbGV0ZTogKCkgPT4gdm9pZDtcbiAgICBmaW5pc2hFZGl0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaERlbGV0aW5nOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEhvb2sgZm9yIG1hbmFnaW5nIEZBUSBlZGl0IG1vZGUgc3RhdGVcbiAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIGVkaXQgc3RhdGUgYW5kIGFjdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUVkaXRNb2RlKCk6IFVzZUVkaXRNb2RlUmV0dXJuIHtcbiAgICBjb25zdCBbZWRpdE1vZGUsIHNldEVkaXRNb2RlXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbZWRpdGluZ0l0ZW1JbmRleCwgc2V0RWRpdGluZ0l0ZW1JbmRleF0gPSB1c2VTdGF0ZTxudW1iZXIgfCBudWxsPihudWxsKTtcbiAgICBjb25zdCBbc2hvd0NyZWF0ZUZvcm0sIHNldFNob3dDcmVhdGVGb3JtXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbZGVsZXRlQ29uZmlybUluZGV4LCBzZXREZWxldGVDb25maXJtSW5kZXhdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG5cbiAgICAvLyBUb2dnbGUgYmV0d2VlbiBlZGl0IGFuZCB2aWV3IG1vZGVcbiAgICBjb25zdCB0b2dnbGVFZGl0TW9kZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RWRpdE1vZGUoIWVkaXRNb2RlKTtcbiAgICAgICAgc2V0RWRpdGluZ0l0ZW1JbmRleChudWxsKTtcbiAgICAgICAgc2V0U2hvd0NyZWF0ZUZvcm0oZmFsc2UpO1xuICAgIH07XG5cbiAgICAvLyBTdGFydCBlZGl0aW5nIGEgc3BlY2lmaWMgaXRlbVxuICAgIGNvbnN0IHN0YXJ0RWRpdGluZ0l0ZW0gPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFZGl0aW5nSXRlbUluZGV4KGluZGV4KTtcbiAgICAgICAgc2V0U2hvd0NyZWF0ZUZvcm0oZmFsc2UpO1xuICAgIH07XG5cbiAgICAvLyBDYW5jZWwgZWRpdGluZyBjdXJyZW50IGl0ZW1cbiAgICBjb25zdCBjYW5jZWxFZGl0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFZGl0aW5nSXRlbUluZGV4KG51bGwpO1xuICAgIH07XG5cbiAgICAvLyBGaW5pc2ggZWRpdGluZyBjdXJyZW50IGl0ZW0gKGFmdGVyIHN1Y2Nlc3NmdWwgc2F2ZSlcbiAgICBjb25zdCBmaW5pc2hFZGl0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFZGl0aW5nSXRlbUluZGV4KG51bGwpO1xuICAgIH07XG5cbiAgICAvLyBTdGFydCBjcmVhdGluZyBhIG5ldyBpdGVtXG4gICAgY29uc3Qgc3RhcnRDcmVhdGluZyA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0U2hvd0NyZWF0ZUZvcm0odHJ1ZSk7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIC8vIENhbmNlbCBjcmVhdGluZyBuZXcgaXRlbVxuICAgIGNvbnN0IGNhbmNlbENyZWF0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybShmYWxzZSk7XG4gICAgfTtcblxuICAgIC8vIEZpbmlzaCBjcmVhdGluZyBuZXcgaXRlbSAoYWZ0ZXIgc3VjY2Vzc2Z1bCBzYXZlKVxuICAgIGNvbnN0IGZpbmlzaENyZWF0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybShmYWxzZSk7XG4gICAgfTtcblxuICAgIC8vIFN0YXJ0IGRlbGV0ZSBjb25maXJtYXRpb24gZm9yIGFuIGl0ZW1cbiAgICBjb25zdCBzdGFydERlbGV0aW5nID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KGluZGV4KTtcbiAgICB9O1xuXG4gICAgLy8gQ29uZmlybSBhbmQgcHJvY2VlZCB3aXRoIGRlbGV0aW9uXG4gICAgY29uc3QgY29uZmlybURlbGV0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBpbmRleCBmb3IgY2FsbGVyIHRvIGhhbmRsZSwgdGhlbiBjbGVhclxuICAgICAgICAvLyBDYWxsZXIgc2hvdWxkIGNhbGwgZmluaXNoRGVsZXRpbmcoKSBhZnRlciBkZWxldGlvbiBzdWNjZWVkc1xuICAgIH07XG5cbiAgICAvLyBDYW5jZWwgZGVsZXRpb25cbiAgICBjb25zdCBjYW5jZWxEZWxldGUgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldERlbGV0ZUNvbmZpcm1JbmRleChudWxsKTtcbiAgICB9O1xuXG4gICAgLy8gRmluaXNoIGRlbGV0aW9uIChhZnRlciBzdWNjZXNzZnVsIGRlbGV0ZSlcbiAgICBjb25zdCBmaW5pc2hEZWxldGluZyA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KG51bGwpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBTdGF0ZVxuICAgICAgICBlZGl0TW9kZSxcbiAgICAgICAgZWRpdGluZ0l0ZW1JbmRleCxcbiAgICAgICAgc2hvd0NyZWF0ZUZvcm0sXG4gICAgICAgIGRlbGV0ZUNvbmZpcm1JbmRleCxcblxuICAgICAgICAvLyBBY3Rpb25zXG4gICAgICAgIHRvZ2dsZUVkaXRNb2RlLFxuICAgICAgICBzdGFydEVkaXRpbmdJdGVtLFxuICAgICAgICBjYW5jZWxFZGl0aW5nLFxuICAgICAgICBzdGFydENyZWF0aW5nLFxuICAgICAgICBjYW5jZWxDcmVhdGluZyxcbiAgICAgICAgc3RhcnREZWxldGluZyxcbiAgICAgICAgY29uZmlybURlbGV0ZSxcbiAgICAgICAgY2FuY2VsRGVsZXRlLFxuICAgICAgICBmaW5pc2hFZGl0aW5nLFxuICAgICAgICBmaW5pc2hDcmVhdGluZyxcbiAgICAgICAgZmluaXNoRGVsZXRpbmdcbiAgICB9O1xufVxuIiwiLyoqXG4gKiBGQVEgQWNjb3JkaW9uIEF0dHJpYnV0ZSBDb25maWd1cmF0aW9uXG4gKlxuICogVGhpcyBmaWxlIGRlZmluZXMgdGhlIGNvbnZlbnRpb24tYmFzZWQgYXR0cmlidXRlIG5hbWVzIHRoYXQgdGhlIHdpZGdldCBleHBlY3RzXG4gKiBvbiB0aGUgTWVuZGl4IGVudGl0eS4gVGhlc2UgZGVmYXVsdHMgY2FuIGJlIG92ZXJyaWRkZW4gdmlhIHdpZGdldCBwcm9wZXJ0aWVzLlxuICpcbiAqIElNUE9SVEFOVDogVGhlc2UgYXR0cmlidXRlIG5hbWVzIG11c3QgbWF0Y2ggZXhhY3RseSB3aXRoIHlvdXIgTWVuZGl4IGRvbWFpbiBtb2RlbC5cbiAqIFRoZSBuYW1lcyBhcmUgY2FzZS1zZW5zaXRpdmUgYW5kIHNob3VsZCBub3QgaW5jbHVkZSB0aGUgZW50aXR5IG5hbWUgcHJlZml4LlxuICovXG5cbi8qKlxuICogRGVmYXVsdCBhdHRyaWJ1dGUgbmFtZXMgdXNlZCB3aGVuIG5vIG92ZXJyaWRlcyBhcmUgY29uZmlndXJlZFxuICovXG5leHBvcnQgY29uc3QgRkFRX0RFRkFVTFRfQVRUUklCVVRFUyA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgcXVlc3Rpb24vdGl0bGUgdGV4dCAoU3RyaW5nL1RleHQgYXR0cmlidXRlKVxuICAgICAqL1xuICAgIFNVTU1BUlk6IFwiU3VtbWFyeVwiLFxuXG4gICAgLyoqXG4gICAgICogVGhlIGFuc3dlci9kZXRhaWxlZCBjb250ZW50IChTdHJpbmcvVGV4dCBhdHRyaWJ1dGUpXG4gICAgICovXG4gICAgQ09OVEVOVDogXCJDb250ZW50XCIsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgZm9ybWF0IG9mIHRoZSBjb250ZW50IC0gJ2h0bWwnLCAndGV4dCcsIG9yICdtYXJrZG93bicgKFN0cmluZy9FbnVtIGF0dHJpYnV0ZSlcbiAgICAgKi9cbiAgICBDT05URU5UX0ZPUk1BVDogXCJDb250ZW50Rm9ybWF0XCIsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgc29ydCBvcmRlciBmb3IgcG9zaXRpb25pbmcgaXRlbXMgKEludGVnZXIvTG9uZy9EZWNpbWFsIGF0dHJpYnV0ZSlcbiAgICAgKi9cbiAgICBTT1JUX09SREVSOiBcIlNvcnRPcmRlclwiXG59IGFzIGNvbnN0O1xuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgYXR0cmlidXRlIG92ZXJyaWRlcyBmcm9tIHdpZGdldCBjb25maWd1cmF0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRkFRQXR0cmlidXRlT3ZlcnJpZGVzIHtcbiAgICBzdW1tYXJ5QXR0cmlidXRlPzogc3RyaW5nO1xuICAgIGNvbnRlbnRBdHRyaWJ1dGU/OiBzdHJpbmc7XG4gICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZT86IHN0cmluZztcbiAgICBzb3J0T3JkZXJBdHRyaWJ1dGU/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciB0aGUgcmVzb2x2ZWQgRkFRIGF0dHJpYnV0ZXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGQVFBdHRyaWJ1dGVOYW1lcyB7XG4gICAgU1VNTUFSWTogc3RyaW5nO1xuICAgIENPTlRFTlQ6IHN0cmluZztcbiAgICBDT05URU5UX0ZPUk1BVDogc3RyaW5nO1xuICAgIFNPUlRfT1JERVI6IHN0cmluZztcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgYXR0cmlidXRlIG5hbWUgZnJvbSBhIExpc3RBdHRyaWJ1dGVWYWx1ZSdzIGlkXG4gKiBUaGUgaWQgaXMgdHlwaWNhbGx5IGluIGZvcm1hdCBcIk1vZHVsZU5hbWUuRW50aXR5TmFtZS9hdHRyaWJ1dGVOYW1lXCJcbiAqIEBwYXJhbSBhdHRyaWJ1dGVJZCAtIFRoZSBmdWxsIGF0dHJpYnV0ZSBpZCBmcm9tIExpc3RBdHRyaWJ1dGVWYWx1ZVxuICogQHJldHVybnMgVGhlIGF0dHJpYnV0ZSBuYW1lIG9ubHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RBdHRyaWJ1dGVOYW1lKGF0dHJpYnV0ZUlkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICghYXR0cmlidXRlSWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLy8gRXh0cmFjdCB0aGUgYXR0cmlidXRlIG5hbWUgYWZ0ZXIgdGhlIGxhc3QgXCIvXCJcbiAgICBjb25zdCBwYXJ0cyA9IGF0dHJpYnV0ZUlkLnNwbGl0KFwiL1wiKTtcbiAgICByZXR1cm4gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIDogYXR0cmlidXRlSWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcmVzb2x2ZWQgRkFRIGF0dHJpYnV0ZXMgYnkgbWVyZ2luZyBvdmVycmlkZXMgd2l0aCBkZWZhdWx0c1xuICogQHBhcmFtIG92ZXJyaWRlcyAtIE9wdGlvbmFsIGF0dHJpYnV0ZSBvdmVycmlkZXMgZnJvbSB3aWRnZXQgY29uZmlndXJhdGlvblxuICogQHJldHVybnMgUmVzb2x2ZWQgYXR0cmlidXRlIG5hbWVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGQVFBdHRyaWJ1dGVzKG92ZXJyaWRlcz86IEZBUUF0dHJpYnV0ZU92ZXJyaWRlcyk6IEZBUUF0dHJpYnV0ZU5hbWVzIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBTVU1NQVJZOiBvdmVycmlkZXM/LnN1bW1hcnlBdHRyaWJ1dGVcbiAgICAgICAgICAgID8gZXh0cmFjdEF0dHJpYnV0ZU5hbWUob3ZlcnJpZGVzLnN1bW1hcnlBdHRyaWJ1dGUpIHx8IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWVxuICAgICAgICAgICAgOiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNVTU1BUlksXG4gICAgICAgIENPTlRFTlQ6IG92ZXJyaWRlcz8uY29udGVudEF0dHJpYnV0ZVxuICAgICAgICAgICAgPyBleHRyYWN0QXR0cmlidXRlTmFtZShvdmVycmlkZXMuY29udGVudEF0dHJpYnV0ZSkgfHwgRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5UXG4gICAgICAgICAgICA6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVCxcbiAgICAgICAgQ09OVEVOVF9GT1JNQVQ6IG92ZXJyaWRlcz8uY29udGVudEZvcm1hdEF0dHJpYnV0ZVxuICAgICAgICAgICAgPyBleHRyYWN0QXR0cmlidXRlTmFtZShvdmVycmlkZXMuY29udGVudEZvcm1hdEF0dHJpYnV0ZSkgfHxcbiAgICAgICAgICAgICAgRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5UX0ZPUk1BVFxuICAgICAgICAgICAgOiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRfRk9STUFULFxuICAgICAgICBTT1JUX09SREVSOiBvdmVycmlkZXM/LnNvcnRPcmRlckF0dHJpYnV0ZVxuICAgICAgICAgICAgPyBleHRyYWN0QXR0cmlidXRlTmFtZShvdmVycmlkZXMuc29ydE9yZGVyQXR0cmlidXRlKSB8fFxuICAgICAgICAgICAgICBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVJcbiAgICAgICAgICAgIDogRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5TT1JUX09SREVSXG4gICAgfTtcbn1cblxuLyoqXG4gKiBMZWdhY3kgZXhwb3J0IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gKiBAZGVwcmVjYXRlZCBVc2UgZ2V0RkFRQXR0cmlidXRlcygpIHdpdGggb3ZlcnJpZGVzIGluc3RlYWRcbiAqL1xuZXhwb3J0IGNvbnN0IEZBUV9BVFRSSUJVVEVTID0gRkFRX0RFRkFVTFRfQVRUUklCVVRFUztcblxuLyoqXG4gKiBUeXBlLXNhZmUgYWNjZXNzb3IgZm9yIGF0dHJpYnV0ZSBuYW1lc1xuICovXG5leHBvcnQgdHlwZSBGQVFBdHRyaWJ1dGVOYW1lID0gKHR5cGVvZiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTKVtrZXlvZiB0eXBlb2YgRkFRX0RFRkFVTFRfQVRUUklCVVRFU107XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgYWxsIHJlcXVpcmVkIGF0dHJpYnV0ZXMgZXhpc3Qgb24gYW4gTXhPYmplY3RcbiAqIEBwYXJhbSBteE9iaiAtIFRoZSBNZW5kaXggb2JqZWN0IHRvIHZhbGlkYXRlXG4gKiBAcGFyYW0gYXR0cmlidXRlcyAtIFRoZSByZXNvbHZlZCBhdHRyaWJ1dGUgbmFtZXMgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm5zIE9iamVjdCB3aXRoIHZhbGlkYXRpb24gcmVzdWx0IGFuZCBtaXNzaW5nIGF0dHJpYnV0ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlUmVxdWlyZWRBdHRyaWJ1dGVzKFxuICAgIG14T2JqOiBhbnksXG4gICAgYXR0cmlidXRlczogRkFRQXR0cmlidXRlTmFtZXMgPSBGQVFfREVGQVVMVF9BVFRSSUJVVEVTXG4pOiB7XG4gICAgaXNWYWxpZDogYm9vbGVhbjtcbiAgICBtaXNzaW5nQXR0cmlidXRlczogc3RyaW5nW107XG59IHtcbiAgICBjb25zdCBhdmFpbGFibGVBdHRyaWJ1dGVzID0gbXhPYmouZ2V0QXR0cmlidXRlcygpO1xuICAgIGNvbnN0IHJlcXVpcmVkQXR0cmlidXRlcyA9IE9iamVjdC52YWx1ZXMoYXR0cmlidXRlcyk7XG5cbiAgICBjb25zdCBtaXNzaW5nQXR0cmlidXRlcyA9IHJlcXVpcmVkQXR0cmlidXRlcy5maWx0ZXIoXG4gICAgICAgIChhdHRyKSA9PiAhYXZhaWxhYmxlQXR0cmlidXRlcy5pbmNsdWRlcyhhdHRyKVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpc1ZhbGlkOiBtaXNzaW5nQXR0cmlidXRlcy5sZW5ndGggPT09IDAsXG4gICAgICAgIG1pc3NpbmdBdHRyaWJ1dGVzXG4gICAgfTtcbn1cbiIsIi8qKlxuICogTWVuZGl4IERhdGEgU2VydmljZSAtIENlbnRyYWxpemVkIHNlcnZpY2UgZm9yIE1lbmRpeCBDbGllbnQgQVBJIG9wZXJhdGlvbnNcbiAqIEhhbmRsZXMgQ1JVRCBvcGVyYXRpb25zIHdpdGggY29uc2lzdGVudCBlcnJvciBoYW5kbGluZyBhbmQgZGF0YSBzb3VyY2UgcmVsb2FkaW5nXG4gKlxuICogQ09OVkVOVElPTjogVGhpcyBzZXJ2aWNlIGV4cGVjdHMgZW50aXRpZXMgdG8gaGF2ZSBhdHRyaWJ1dGVzIGRlZmluZWQgaW4gYXR0cmlidXRlQ29uZmlnLnRzXG4gKiBTZWUgc3JjL2NvbmZpZy9hdHRyaWJ1dGVDb25maWcudHMgZm9yIHRoZSBhdHRyaWJ1dGUgbmFtZSBjb25maWd1cmF0aW9uXG4gKi9cbmltcG9ydCB7IE9iamVjdEl0ZW0gfSBmcm9tIFwibWVuZGl4XCI7XG5pbXBvcnQgQmlnIGZyb20gXCJiaWcuanNcIjtcbmltcG9ydCB7IEZBUV9BVFRSSUJVVEVTIH0gZnJvbSBcIi4uL2NvbmZpZy9hdHRyaWJ1dGVDb25maWdcIjtcblxuLy8gTWVuZGl4IENsaWVudCBBUEkgdHlwZSBkZWNsYXJhdGlvbnNcbmRlY2xhcmUgZ2xvYmFsIHtcbiAgICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICAgICAgbXg/OiB7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgZ2V0KG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKG9iajogYW55KSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcj86IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgfSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgY29tbWl0KG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgbXhvYmo6IGFueTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIH0pOiB2b2lkO1xuICAgICAgICAgICAgICAgIGNyZWF0ZShvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIGVudGl0eTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKG9iajogYW55KSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICB9KTogdm9pZDtcbiAgICAgICAgICAgICAgICByZW1vdmUob3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBndWlkczogc3RyaW5nW107XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICB9KTogdm9pZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIE1lbmRpeCBteCBnbG9iYWwgb2JqZWN0IHNhZmVseVxuICovXG5mdW5jdGlvbiBnZXRNeCgpOiBhbnkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5teCkge1xuICAgICAgICByZXR1cm4gd2luZG93Lm14O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiAoZ2xvYmFsIGFzIGFueSkud2luZG93Py5teCkge1xuICAgICAgICByZXR1cm4gKGdsb2JhbCBhcyBhbnkpLndpbmRvdy5teDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZnVsbCBNeE9iamVjdCBmcm9tIGFuIE9iamVjdEl0ZW1cbiAqIE9iamVjdEl0ZW0gZnJvbSBkYXRhc291cmNlIG9ubHkgaGFzICdpZCcsIHdlIG5lZWQgdG8gZmV0Y2ggdGhlIGZ1bGwgb2JqZWN0XG4gKiBAcGFyYW0gb2JqIC0gT2JqZWN0SXRlbSBmcm9tIGRhdGFzb3VyY2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBmdWxsIE14T2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGdldE14T2JqZWN0KG9iajogT2JqZWN0SXRlbSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbXggPSBnZXRNeCgpO1xuICAgICAgICBpZiAoIW14IHx8ICFteC5kYXRhKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiTWVuZGl4IENsaWVudCBBUEkgKG14LmRhdGEpIG5vdCBhdmFpbGFibGVcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZ3VpZCA9IGdldE9iamVjdEd1aWQob2JqKTtcblxuICAgICAgICBteC5kYXRhLmdldCh7XG4gICAgICAgICAgICBndWlkOiBndWlkLFxuICAgICAgICAgICAgY2FsbGJhY2s6IChteE9iajogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShteE9iaik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBlbnRpdHkgbmFtZSBmcm9tIGEgTWVuZGl4IG9iamVjdFxuICogQHBhcmFtIG14T2JqIC0gTWVuZGl4IG9iamVjdFxuICogQHJldHVybnMgRW50aXR5IG5hbWUgKGUuZy4sIFwiTXlGaXJzdE1vZHVsZS5GQVFcIilcbiAqL1xuZnVuY3Rpb24gZ2V0RW50aXR5TmFtZUZyb21PYmplY3QobXhPYmo6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKG14T2JqLmdldEVudGl0eSAmJiB0eXBlb2YgbXhPYmouZ2V0RW50aXR5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIG14T2JqLmdldEVudGl0eSgpO1xuICAgIH1cbiAgICBpZiAobXhPYmouZW50aXR5KSB7XG4gICAgICAgIHJldHVybiBteE9iai5lbnRpdHk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBkZXRlcm1pbmUgZW50aXR5IG5hbWUgZnJvbSBvYmplY3RcIik7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgR1VJRCBmcm9tIGEgTWVuZGl4IG9iamVjdCwgaGFuZGxpbmcgYm90aCBtZXRob2RzXG4gKiBAcGFyYW0gb2JqIC0gTWVuZGl4IG9iamVjdCBpdGVtXG4gKiBAcmV0dXJucyBHVUlEIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T2JqZWN0R3VpZChvYmo6IE9iamVjdEl0ZW0pOiBzdHJpbmcge1xuICAgIC8vIFRyeSB0aGUgZ2V0R3VpZCgpIG1ldGhvZCBmaXJzdFxuICAgIGlmICgob2JqIGFzIGFueSkuZ2V0R3VpZCAmJiB0eXBlb2YgKG9iaiBhcyBhbnkpLmdldEd1aWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjb25zdCBndWlkID0gKG9iaiBhcyBhbnkpLmdldEd1aWQoKTtcbiAgICAgICAgaWYgKGd1aWQpIHJldHVybiBndWlkO1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIHRvIGd1aWQgcHJvcGVydHlcbiAgICBpZiAoKG9iaiBhcyBhbnkpLmd1aWQpIHtcbiAgICAgICAgcmV0dXJuIChvYmogYXMgYW55KS5ndWlkO1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIHRvIGlkIHByb3BlcnR5IChmcm9tIE9iamVjdEl0ZW0gaW50ZXJmYWNlKVxuICAgIGlmIChvYmouaWQpIHtcbiAgICAgICAgcmV0dXJuIG9iai5pZDtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZXh0cmFjdCBHVUlEIGZyb20gb2JqZWN0XCIpO1xufVxuXG4vKipcbiAqIFJlbG9hZHMgYSBkYXRhIHNvdXJjZSBpZiB0aGUgcmVsb2FkIG1ldGhvZCBpcyBhdmFpbGFibGVcbiAqIEBwYXJhbSBkYXRhU291cmNlIC0gTWVuZGl4IGRhdGEgc291cmNlIHRvIHJlbG9hZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVsb2FkRGF0YVNvdXJjZShkYXRhU291cmNlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoZGF0YVNvdXJjZSAmJiB0eXBlb2YgZGF0YVNvdXJjZS5yZWxvYWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBkYXRhU291cmNlLnJlbG9hZCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBlbnRpdHkgbmFtZSBmcm9tIGEgZGF0YSBzb3VyY2VcbiAqIEZvciBMaXN0VmFsdWUgZGF0YXNvdXJjZXMsIHdlIGdldCB0aGUgZW50aXR5IGZyb20gdGhlIGZpcnN0IGl0ZW0ncyBNeE9iamVjdFxuICogQHBhcmFtIGRhdGFTb3VyY2UgLSBNZW5kaXggZGF0YSBzb3VyY2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIGVudGl0eSBuYW1lIG9yIG51bGwgaWYgbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFbnRpdHlOYW1lKGRhdGFTb3VyY2U6IGFueSk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIGRhdGFTb3VyY2U6XCIsIGRhdGFTb3VyY2UpO1xuICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIGRhdGFTb3VyY2Uga2V5czpcIiwgT2JqZWN0LmtleXMoZGF0YVNvdXJjZSB8fCB7fSkpO1xuXG4gICAgLy8gVHJ5IHRvIGdldCBlbnRpdHkgZnJvbSBkYXRhc291cmNlIG1ldGFkYXRhIChsZWdhY3kgYXBwcm9hY2gpXG4gICAgaWYgKGRhdGFTb3VyY2U/Ll9lbnRpdHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZm91bmQgX2VudGl0eTpcIiwgZGF0YVNvdXJjZS5fZW50aXR5KTtcbiAgICAgICAgcmV0dXJuIGRhdGFTb3VyY2UuX2VudGl0eTtcbiAgICB9XG4gICAgaWYgKGRhdGFTb3VyY2U/LmVudGl0eSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImdldEVudGl0eU5hbWUgLSBmb3VuZCBlbnRpdHk6XCIsIGRhdGFTb3VyY2UuZW50aXR5KTtcbiAgICAgICAgcmV0dXJuIGRhdGFTb3VyY2UuZW50aXR5O1xuICAgIH1cblxuICAgIC8vIEZvciBMaXN0VmFsdWUgZGF0YXNvdXJjZXMsIGdldCBlbnRpdHkgZnJvbSB0aGUgZmlyc3QgaXRlbSdzIE14T2JqZWN0XG4gICAgaWYgKGRhdGFTb3VyY2U/Lml0ZW1zICYmIGRhdGFTb3VyY2UuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RJdGVtID0gZGF0YVNvdXJjZS5pdGVtc1swXTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIGZldGNoaW5nIGZpcnN0IGl0ZW0gTXhPYmplY3QuLi5cIik7XG5cbiAgICAgICAgICAgIC8vIEZldGNoIHRoZSBmdWxsIE14T2JqZWN0IHRvIGdldCBlbnRpdHkgbmFtZVxuICAgICAgICAgICAgY29uc3QgbXhPYmogPSBhd2FpdCBnZXRNeE9iamVjdChmaXJzdEl0ZW0pO1xuICAgICAgICAgICAgY29uc3QgZW50aXR5TmFtZSA9IGdldEVudGl0eU5hbWVGcm9tT2JqZWN0KG14T2JqKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIGZyb20gTXhPYmplY3Q6XCIsIGVudGl0eU5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIGVudGl0eU5hbWU7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZ2V0RW50aXR5TmFtZSAtIGZhaWxlZCB0byBnZXQgTXhPYmplY3Q6XCIsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIG5vdCBmb3VuZCwgcmV0dXJuaW5nIG51bGxcIik7XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbmV4dCBzb3J0IG9yZGVyIHZhbHVlIGZvciBhIG5ldyBpdGVtXG4gKiBAcGFyYW0gaXRlbXMgLSBBcnJheSBvZiBleGlzdGluZyBpdGVtc1xuICogQHBhcmFtIHNvcnRPcmRlckF0dHJpYnV0ZSAtIFNvcnQgb3JkZXIgYXR0cmlidXRlIGFjY2Vzc29yXG4gKiBAcmV0dXJucyBOZXh0IHNvcnQgb3JkZXIgdmFsdWUgKG1heCArIDEwKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dFNvcnRPcmRlcihpdGVtczogT2JqZWN0SXRlbVtdIHwgdW5kZWZpbmVkLCBzb3J0T3JkZXJBdHRyaWJ1dGU6IGFueSk6IEJpZyB7XG4gICAgY29uc3QgbWF4U29ydE9yZGVyID1cbiAgICAgICAgaXRlbXM/LnJlZHVjZSgobWF4LCBpdGVtKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzb3J0T3JkZXIgPSBzb3J0T3JkZXJBdHRyaWJ1dGUuZ2V0KGl0ZW0pLnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHNvcnRPcmRlciAmJiBzb3J0T3JkZXIudG9OdW1iZXIoKSA+IG1heCA/IHNvcnRPcmRlci50b051bWJlcigpIDogbWF4O1xuICAgICAgICB9LCAwKSB8fCAwO1xuXG4gICAgcmV0dXJuIG5ldyBCaWcobWF4U29ydE9yZGVyICsgMTApO1xufVxuXG4vKipcbiAqIENvbW1pdHMgYSBNZW5kaXggb2JqZWN0IHRvIHRoZSBkYXRhYmFzZVxuICogQHBhcmFtIG9iaiAtIE14T2JqZWN0IHRvIGNvbW1pdCAoZnVsbCBvYmplY3QsIG5vdCBqdXN0IE9iamVjdEl0ZW0pXG4gKiBAcGFyYW0gZGF0YVNvdXJjZSAtIE9wdGlvbmFsIGRhdGEgc291cmNlIHRvIHJlbG9hZCBhZnRlciBjb21taXRcbiAqIEBwYXJhbSBzdWNjZXNzTWVzc2FnZSAtIE9wdGlvbmFsIHN1Y2Nlc3MgbG9nIG1lc3NhZ2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGNvbW1pdCBzdWNjZWVkc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY29tbWl0T2JqZWN0KG9iajogYW55LCBkYXRhU291cmNlPzogYW55LCBzdWNjZXNzTWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG14ID0gZ2V0TXgoKTtcbiAgICAgICAgaWYgKCFteCB8fCAhbXguZGF0YSkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIk1lbmRpeCBDbGllbnQgQVBJIChteC5kYXRhKSBub3QgYXZhaWxhYmxlXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiY29tbWl0T2JqZWN0IC0gY29tbWl0dGluZyBvYmplY3Q6XCIsIG9iai5nZXRFbnRpdHk/LigpKTtcblxuICAgICAgICBteC5kYXRhLmNvbW1pdCh7XG4gICAgICAgICAgICBteG9iajogb2JqLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICByZWxvYWREYXRhU291cmNlKGRhdGFTb3VyY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGNvbW1pdCBvYmplY3Q6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBEZWxldGVzIGEgTWVuZGl4IG9iamVjdCBmcm9tIHRoZSBkYXRhYmFzZVxuICogQHBhcmFtIG9iaiAtIE9iamVjdCB0byBkZWxldGVcbiAqIEBwYXJhbSBkYXRhU291cmNlIC0gT3B0aW9uYWwgZGF0YSBzb3VyY2UgdG8gcmVsb2FkIGFmdGVyIGRlbGV0aW9uXG4gKiBAcGFyYW0gc3VjY2Vzc01lc3NhZ2UgLSBPcHRpb25hbCBzdWNjZXNzIGxvZyBtZXNzYWdlXG4gKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBkZWxldGlvbiBzdWNjZWVkc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlT2JqZWN0KFxuICAgIG9iajogT2JqZWN0SXRlbSxcbiAgICBkYXRhU291cmNlPzogYW55LFxuICAgIHN1Y2Nlc3NNZXNzYWdlPzogc3RyaW5nXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBteCA9IGdldE14KCk7XG4gICAgICAgIGlmICghbXggfHwgIW14LmRhdGEpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNZW5kaXggQ2xpZW50IEFQSSAobXguZGF0YSkgbm90IGF2YWlsYWJsZVwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZ3VpZDogc3RyaW5nO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZ3VpZCA9IGdldE9iamVjdEd1aWQob2JqKTtcbiAgICAgICAgICAgIGlmICghZ3VpZCB8fCB0eXBlb2YgZ3VpZCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBHVUlEOiAke2d1aWR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGdldCBvYmplY3QgR1VJRDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG14LmRhdGEucmVtb3ZlKHtcbiAgICAgICAgICAgIGd1aWRzOiBbZ3VpZF0sXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbG9hZERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZGVsZXRlIG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgTWVuZGl4IG9iamVjdFxuICogQHBhcmFtIGVudGl0eU5hbWUgLSBFbnRpdHkgbmFtZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBzdWNjZXNzTWVzc2FnZSAtIE9wdGlvbmFsIHN1Y2Nlc3MgbG9nIG1lc3NhZ2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aXRoIHRoZSBjcmVhdGVkIE14T2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVPYmplY3QoZW50aXR5TmFtZTogc3RyaW5nLCBzdWNjZXNzTWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbXggPSBnZXRNeCgpO1xuICAgICAgICBpZiAoIW14IHx8ICFteC5kYXRhKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiTWVuZGl4IENsaWVudCBBUEkgKG14LmRhdGEpIG5vdCBhdmFpbGFibGVcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbXguZGF0YS5jcmVhdGUoe1xuICAgICAgICAgICAgZW50aXR5OiBlbnRpdHlOYW1lLFxuICAgICAgICAgICAgY2FsbGJhY2s6IChvYmo6IE9iamVjdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3VjY2Vzc01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKG9iaik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGNyZWF0ZSBvYmplY3Q6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTd2FwcyB0aGUgc29ydCBvcmRlciB2YWx1ZXMgYmV0d2VlbiB0d28gaXRlbXMgYW5kIGNvbW1pdHMgYm90aFxuICogVXNlcyBjb252ZW50aW9uLWJhc2VkIGF0dHJpYnV0ZSBuYW1lIFwiU29ydE9yZGVyXCJcbiAqIEBwYXJhbSBpdGVtMSAtIEZpcnN0IGl0ZW1cbiAqIEBwYXJhbSBpdGVtMiAtIFNlY29uZCBpdGVtXG4gKiBAcGFyYW0gb3JkZXIxIC0gQ3VycmVudCBzb3J0IG9yZGVyIG9mIGl0ZW0xXG4gKiBAcGFyYW0gb3JkZXIyIC0gQ3VycmVudCBzb3J0IG9yZGVyIG9mIGl0ZW0yXG4gKiBAcGFyYW0gZGF0YVNvdXJjZSAtIE9wdGlvbmFsIGRhdGEgc291cmNlIHRvIHJlbG9hZCBhZnRlciBzd2FwXG4gKiBAcGFyYW0gc3VjY2Vzc01lc3NhZ2UgLSBPcHRpb25hbCBzdWNjZXNzIGxvZyBtZXNzYWdlXG4gKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBib3RoIGNvbW1pdHMgc3VjY2VlZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3dhcFNvcnRPcmRlcnMoXG4gICAgaXRlbTE6IE9iamVjdEl0ZW0sXG4gICAgaXRlbTI6IE9iamVjdEl0ZW0sXG4gICAgb3JkZXJPckF0dHJpYnV0ZTogQmlnIHwgYW55LFxuICAgIG9yZGVyMk9yRGF0YVNvdXJjZT86IEJpZyB8IGFueSxcbiAgICBkYXRhU291cmNlPzogYW55LFxuICAgIHN1Y2Nlc3NNZXNzYWdlPzogc3RyaW5nXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBteCA9IGdldE14KCk7XG4gICAgaWYgKCFteCB8fCAhbXguZGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZW5kaXggQ2xpZW50IEFQSSAobXguZGF0YSkgbm90IGF2YWlsYWJsZVwiKTtcbiAgICB9XG5cbiAgICBsZXQgb3JkZXIxOiBCaWc7XG4gICAgbGV0IG9yZGVyMjogQmlnO1xuICAgIGxldCByZXNvbHZlZERhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgIGxldCByZXNvbHZlZFN1Y2Nlc3NNZXNzYWdlID0gc3VjY2Vzc01lc3NhZ2U7XG5cbiAgICAvLyBCYWNrd2FyZCBjb21wYXRpYmlsaXR5OiBhbGxvdyBwYXNzaW5nIHNvcnRPcmRlckF0dHJpYnV0ZSBhcyB0aGlyZCBhcmd1bWVudFxuICAgIGlmIChvcmRlck9yQXR0cmlidXRlICYmIHR5cGVvZiAob3JkZXJPckF0dHJpYnV0ZSBhcyBhbnkpLmdldCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IHNvcnRPcmRlckF0dHJpYnV0ZSA9IG9yZGVyT3JBdHRyaWJ1dGU7XG4gICAgICAgIGNvbnN0IHZhbHVlMSA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoaXRlbTEpLnZhbHVlO1xuICAgICAgICBjb25zdCB2YWx1ZTIgPSBzb3J0T3JkZXJBdHRyaWJ1dGUuZ2V0KGl0ZW0yKS52YWx1ZTtcblxuICAgICAgICBpZiAodmFsdWUxID09PSBudWxsIHx8IHZhbHVlMSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlMiA9PT0gbnVsbCB8fCB2YWx1ZTIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU29ydCBvcmRlciB2YWx1ZXMgYXJlIG1pc3NpbmdcIik7XG4gICAgICAgIH1cblxuICAgICAgICBvcmRlcjEgPSBuZXcgQmlnKHZhbHVlMS50b1N0cmluZygpKTtcbiAgICAgICAgb3JkZXIyID0gbmV3IEJpZyh2YWx1ZTIudG9TdHJpbmcoKSk7XG4gICAgICAgIHJlc29sdmVkRGF0YVNvdXJjZSA9IG9yZGVyMk9yRGF0YVNvdXJjZTtcbiAgICAgICAgcmVzb2x2ZWRTdWNjZXNzTWVzc2FnZSA9IGRhdGFTb3VyY2U7XG4gICAgfSBlbHNlIGlmIChvcmRlcjJPckRhdGFTb3VyY2UpIHtcbiAgICAgICAgLy8gUHJlZmVycmVkIHNpZ25hdHVyZTogZXhwbGljaXQgb3JkZXIxIGFuZCBvcmRlcjIgdmFsdWVzXG4gICAgICAgIG9yZGVyMSA9IG9yZGVyT3JBdHRyaWJ1dGUgYXMgQmlnO1xuICAgICAgICBvcmRlcjIgPSBvcmRlcjJPckRhdGFTb3VyY2UgYXMgQmlnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInN3YXBTb3J0T3JkZXJzIHJlcXVpcmVzIHNvcnQgb3JkZXIgdmFsdWVzIG9yIGF0dHJpYnV0ZSBhY2Nlc3NvclwiKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gU1RBUlRcIik7XG4gICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIG9yZGVyMTpcIiwgb3JkZXIxLnRvU3RyaW5nKCksIFwib3JkZXIyOlwiLCBvcmRlcjIudG9TdHJpbmcoKSk7XG5cbiAgICAvLyBHZXQgdGhlIGZ1bGwgTXhPYmplY3RzXG4gICAgY29uc3QgbXhPYmoxID0gYXdhaXQgZ2V0TXhPYmplY3QoaXRlbTEpO1xuICAgIGNvbnN0IG14T2JqMiA9IGF3YWl0IGdldE14T2JqZWN0KGl0ZW0yKTtcblxuICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBHb3QgTXhPYmplY3RzXCIpO1xuICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMSBlbnRpdHk6XCIsIG14T2JqMS5nZXRFbnRpdHk/LigpKTtcbiAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gaXRlbTIgZW50aXR5OlwiLCBteE9iajIuZ2V0RW50aXR5Py4oKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAgIFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMSBjdXJyZW50IHZhbHVlOlwiLFxuICAgICAgICBteE9iajEuZ2V0KEZBUV9BVFRSSUJVVEVTLlNPUlRfT1JERVIpPy50b1N0cmluZygpXG4gICAgKTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0yIGN1cnJlbnQgdmFsdWU6XCIsXG4gICAgICAgIG14T2JqMi5nZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUik/LnRvU3RyaW5nKClcbiAgICApO1xuXG4gICAgLy8gU3dhcCB0aGUgdmFsdWVzXG4gICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIFNldHRpbmcgbmV3IHZhbHVlcy4uLlwiKTtcbiAgICBteE9iajEuc2V0KEZBUV9BVFRSSUJVVEVTLlNPUlRfT1JERVIsIG9yZGVyMik7XG4gICAgbXhPYmoyLnNldChGQVFfQVRUUklCVVRFUy5TT1JUX09SREVSLCBvcmRlcjEpO1xuXG4gICAgY29uc29sZS5sb2coXG4gICAgICAgIFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMSBuZXcgdmFsdWU6XCIsXG4gICAgICAgIG14T2JqMS5nZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUik/LnRvU3RyaW5nKClcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBcInN3YXBTb3J0T3JkZXJzIC0gaXRlbTIgbmV3IHZhbHVlOlwiLFxuICAgICAgICBteE9iajIuZ2V0KEZBUV9BVFRSSUJVVEVTLlNPUlRfT1JERVIpPy50b1N0cmluZygpXG4gICAgKTtcblxuICAgIC8vIENvbW1pdCBib3RoIG9iamVjdHNcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gU3RhcnRpbmcgY29tbWl0IG9mIGZpcnN0IG9iamVjdC4uLlwiKTtcbiAgICAgICAgbXguZGF0YS5jb21taXQoe1xuICAgICAgICAgICAgbXhvYmo6IG14T2JqMSxcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIGNvbW1pdHRlZCBteE9iajEg4pyTXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBTdGFydGluZyBjb21taXQgb2Ygc2Vjb25kIG9iamVjdC4uLlwiKTtcbiAgICAgICAgICAgICAgICBteC5kYXRhLmNvbW1pdCh7XG4gICAgICAgICAgICAgICAgICAgIG14b2JqOiBteE9iajIsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gY29tbWl0dGVkIG14T2JqMiDinJNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWRTdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc29sdmVkU3VjY2Vzc01lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmVkRGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBSZWxvYWRpbmcgZGF0YXNvdXJjZS4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxvYWREYXRhU291cmNlKHJlc29sdmVkRGF0YVNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gQ09NUExFVEUg4pyTXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBjb21taXQgc2Vjb25kIGl0ZW06XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzd2FwU29ydE9yZGVycyAtIEVycm9yIGRldGFpbHM6XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5zdGFja1xuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY29tbWl0IGZpcnN0IGl0ZW06XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwic3dhcFNvcnRPcmRlcnMgLSBFcnJvciBkZXRhaWxzOlwiLCBlcnJvci5tZXNzYWdlLCBlcnJvci5zdGFjayk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBPYmplY3RJdGVtLCBMaXN0VmFsdWUsIExpc3RBdHRyaWJ1dGVWYWx1ZSB9IGZyb20gXCJtZW5kaXhcIjtcbmltcG9ydCBCaWcgZnJvbSBcImJpZy5qc1wiO1xuaW1wb3J0IHsgQ29udGVudEZvcm1hdEVudW0gfSBmcm9tIFwiLi4vLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuaW1wb3J0IHsgRkFRX0RFRkFVTFRfQVRUUklCVVRFUyB9IGZyb20gXCIuLi9jb25maWcvYXR0cmlidXRlQ29uZmlnXCI7XG5pbXBvcnQgeyBnZXROZXh0U29ydE9yZGVyIH0gZnJvbSBcIi4uL3V0aWxzL21lbmRpeERhdGFTZXJ2aWNlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRkFRSXRlbSB7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICBjb250ZW50Rm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bTtcbiAgICBzb3J0T3JkZXI/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBTdGF0aWNGQVFJdGVtIHtcbiAgICBzdW1tYXJ5PzogeyB2YWx1ZT86IHN0cmluZyB9O1xuICAgIGNvbnRlbnQ/OiB7IHZhbHVlPzogc3RyaW5nIH07XG4gICAgY29udGVudEZvcm1hdD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBBdHRyaWJ1dGUgb3ZlcnJpZGVzIHVzaW5nIExpc3RBdHRyaWJ1dGVWYWx1ZSBmb3IgZGlyZWN0IGFjY2Vzc1xuICovXG5pbnRlcmZhY2UgQXR0cmlidXRlT3ZlcnJpZGVzIHtcbiAgICBzdW1tYXJ5QXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPHN0cmluZz47XG4gICAgY29udGVudEF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxzdHJpbmc+O1xuICAgIGNvbnRlbnRGb3JtYXRBdHRyaWJ1dGU/OiBMaXN0QXR0cmlidXRlVmFsdWU8c3RyaW5nPjtcbiAgICBzb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxCaWc+O1xufVxuXG5pbnRlcmZhY2UgVXNlRkFRRGF0YVByb3BzIHtcbiAgICBkYXRhU291cmNlVHlwZTogXCJzdGF0aWNcIiB8IFwiZGF0YWJhc2VcIjtcbiAgICBkYXRhU291cmNlPzogTGlzdFZhbHVlO1xuICAgIGZhcUl0ZW1zPzogU3RhdGljRkFRSXRlbVtdO1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxCaWc+O1xuICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz86IEF0dHJpYnV0ZU92ZXJyaWRlcztcbn1cblxuaW50ZXJmYWNlIFVzZUZBUURhdGFSZXN1bHQge1xuICAgIGl0ZW1zOiBGQVFJdGVtW107XG4gICAgaXNMb2FkaW5nOiBib29sZWFuO1xuICAgIGRlZmF1bHRTb3J0T3JkZXI6IG51bWJlcjtcbiAgICBzb3J0YWJsZUlkczogc3RyaW5nW107XG59XG5cbi8qKlxuICogTm9ybWFsaXplcyBjb250ZW50IGZvcm1hdCB2YWx1ZSB0byB2YWxpZCBmb3JtYXQgb3IgZGVmYXVsdHMgdG8gSFRNTFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVDb250ZW50Rm9ybWF0KGZvcm1hdDogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IENvbnRlbnRGb3JtYXRFbnVtIHtcbiAgICBpZiAoIWZvcm1hdCkge1xuICAgICAgICByZXR1cm4gXCJodG1sXCI7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGZvcm1hdC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgIGlmIChub3JtYWxpemVkID09PSBcImh0bWxcIiB8fCBub3JtYWxpemVkID09PSBcIm1hcmtkb3duXCIgfHwgbm9ybWFsaXplZCA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQgYXMgQ29udGVudEZvcm1hdEVudW07XG4gICAgfVxuXG4gICAgY29uc29sZS53YXJuKGBGQVEgQWNjb3JkaW9uOiBVbnJlY29nbml6ZWQgY29udGVudCBmb3JtYXQgXCIke2Zvcm1hdH1cIiwgZGVmYXVsdGluZyB0byBIVE1MYCk7XG4gICAgcmV0dXJuIFwiaHRtbFwiO1xufVxuXG4vKipcbiAqIEN1c3RvbSBob29rIHRvIG1hbmFnZSBGQVEgZGF0YSBmZXRjaGluZyBhbmQgc3RhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUZBUURhdGEoe1xuICAgIGRhdGFTb3VyY2VUeXBlLFxuICAgIGRhdGFTb3VyY2UsXG4gICAgZmFxSXRlbXMsXG4gICAgc29ydE9yZGVyQXR0cmlidXRlLFxuICAgIGF0dHJpYnV0ZU92ZXJyaWRlc1xufTogVXNlRkFRRGF0YVByb3BzKTogVXNlRkFRRGF0YVJlc3VsdCB7XG4gICAgY29uc3QgW2RhdGFiYXNlSXRlbXMsIHNldERhdGFiYXNlSXRlbXNdID0gdXNlU3RhdGU8RkFRSXRlbVtdPihbXSk7XG5cbiAgICAvLyBDaGVjayBpZiBBTEwgYXR0cmlidXRlIG92ZXJyaWRlcyBhcmUgY29uZmlndXJlZCAoYWxsLW9yLW5vdGhpbmcgYXBwcm9hY2gpXG4gICAgY29uc3QgaGFzQWxsT3ZlcnJpZGVzID0gISEoXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uc3VtbWFyeUF0dHJpYnV0ZSAmJlxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LmNvbnRlbnRBdHRyaWJ1dGUgJiZcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5jb250ZW50Rm9ybWF0QXR0cmlidXRlICYmXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGVcbiAgICApO1xuXG4gICAgLy8gQ2hlY2sgaWYgQU5ZIG92ZXJyaWRlcyBhcmUgY29uZmlndXJlZCAoZm9yIHdhcm5pbmcgZGV0ZWN0aW9uKVxuICAgIGNvbnN0IGhhc0FueU92ZXJyaWRlcyA9ICEhKFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LnN1bW1hcnlBdHRyaWJ1dGUgfHxcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5jb250ZW50QXR0cmlidXRlIHx8XG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uY29udGVudEZvcm1hdEF0dHJpYnV0ZSB8fFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlXG4gICAgKTtcblxuICAgIC8vIEZldGNoIEZBUSBpdGVtcyBmcm9tIGRhdGFiYXNlXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZSAmJiBkYXRhU291cmNlLnN0YXR1cyA9PT0gXCJhdmFpbGFibGVcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiDinKggUkVGRVRDSElORyBpdGVtcyBmcm9tIGRhdGFzb3VyY2VcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IEl0ZW0gY291bnQ6XCIsIGRhdGFTb3VyY2UuaXRlbXM/Lmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IEFsbCBvdmVycmlkZXMgY29uZmlndXJlZDpcIiwgaGFzQWxsT3ZlcnJpZGVzKTtcblxuICAgICAgICAgICAgaWYgKCFkYXRhU291cmNlLml0ZW1zIHx8IGRhdGFTb3VyY2UuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBObyBpdGVtcyB0byBmZXRjaFwiKTtcbiAgICAgICAgICAgICAgICBzZXREYXRhYmFzZUl0ZW1zKFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIEFMTCBvdmVycmlkZXMgYXJlIGNvbmZpZ3VyZWQsIHVzZSBMaXN0QXR0cmlidXRlVmFsdWUuZ2V0KCkgZGlyZWN0bHlcbiAgICAgICAgICAgIGlmIChoYXNBbGxPdmVycmlkZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFVzaW5nIGF0dHJpYnV0ZSBvdmVycmlkZXMgdmlhIExpc3RBdHRyaWJ1dGVWYWx1ZS5nZXQoKVwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IGRhdGFTb3VyY2UuaXRlbXMubWFwKChpdGVtOiBPYmplY3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSBhdHRyaWJ1dGVPdmVycmlkZXMuc3VtbWFyeUF0dHJpYnV0ZSEuZ2V0KGl0ZW0pPy52YWx1ZSB8fCBcIlF1ZXN0aW9uXCI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhdHRyaWJ1dGVPdmVycmlkZXMuY29udGVudEF0dHJpYnV0ZSEuZ2V0KGl0ZW0pPy52YWx1ZSB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXRWYWx1ZSA9IGF0dHJpYnV0ZU92ZXJyaWRlcy5jb250ZW50Rm9ybWF0QXR0cmlidXRlIS5nZXQoaXRlbSk/LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBub3JtYWxpemVDb250ZW50Rm9ybWF0KGZvcm1hdFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhd1NvcnRPcmRlciA9IGF0dHJpYnV0ZU92ZXJyaWRlcy5zb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZSEuZ2V0KGl0ZW0pPy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNvcnRPcmRlcjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmF3U29ydE9yZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXIgPSBOdW1iZXIocmF3U29ydE9yZGVyLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmFOKHNvcnRPcmRlcikpIHNvcnRPcmRlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1bW1hcnksIGNvbnRlbnQsIGNvbnRlbnRGb3JtYXQ6IGZvcm1hdCwgc29ydE9yZGVyIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBJdGVtcyBsb2FkZWQgdmlhIG92ZXJyaWRlczpcIiwgaXRlbXMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBzZXREYXRhYmFzZUl0ZW1zKGl0ZW1zKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdhcm4gaWYgcGFydGlhbCBvdmVycmlkZXMgY29uZmlndXJlZFxuICAgICAgICAgICAgaWYgKGhhc0FueU92ZXJyaWRlcyAmJiAhaGFzQWxsT3ZlcnJpZGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRkFRIEFjY29yZGlvbjogUGFydGlhbCBvdmVycmlkZXMgZGV0ZWN0ZWQhIFlvdSBtdXN0IGNvbmZpZ3VyZSBBTEwgZm91ciBhdHRyaWJ1dGUgb3ZlcnJpZGVzIG9yIE5PTkUuIEZhbGxpbmcgYmFjayB0byBkZWZhdWx0cy5cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBteC5kYXRhLmdldCB3aXRoIGNvbnZlbnRpb24tYmFzZWQgYXR0cmlidXRlIG5hbWVzIChkZWZhdWx0cylcbiAgICAgICAgICAgIGNvbnN0IGZldGNoSXRlbXMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbXggPSAod2luZG93IGFzIGFueSkubXg7XG4gICAgICAgICAgICAgICAgaWYgKCFteCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IG14IG5vdCBhdmFpbGFibGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHNldERhdGFiYXNlSXRlbXMoW10pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBVc2luZyBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lcyB2aWEgbXguZGF0YS5nZXQoKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UuaXRlbXMhLm1hcChhc3luYyAoaXRlbTogT2JqZWN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxGQVFJdGVtPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteC5kYXRhLmdldCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBndWlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IChteE9iajogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IG14T2JqLmdldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNVTU1BUlkpIHx8IFwiUXVlc3Rpb25cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVCkgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXRWYWx1ZSA9IG14T2JqLmdldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRfRk9STUFUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXQgPSBub3JtYWxpemVDb250ZW50Rm9ybWF0KGZvcm1hdFZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhd1NvcnRPcmRlciA9IG14T2JqLmdldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzb3J0T3JkZXI6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmF3U29ydE9yZGVyICE9PSB1bmRlZmluZWQgJiYgcmF3U29ydE9yZGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXIgPSBOdW1iZXIocmF3U29ydE9yZGVyLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmFOKHNvcnRPcmRlcikpIHNvcnRPcmRlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VtbWFyeSwgY29udGVudCwgY29udGVudEZvcm1hdDogZm9ybWF0LCBzb3J0T3JkZXIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGZldGNoIGl0ZW06XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogXCJFcnJvciBsb2FkaW5nIHF1ZXN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRGb3JtYXQ6IFwidGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogSXRlbXMgbG9hZGVkIHZpYSBteC5kYXRhLmdldDpcIiwgaXRlbXMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGF0YWJhc2VJdGVtcyhpdGVtcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBmZXRjaCBGQVEgaXRlbXM6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGF0YWJhc2VJdGVtcyhbXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZmV0Y2hJdGVtcygpO1xuICAgICAgICB9XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhU291cmNlLCBkYXRhU291cmNlPy5zdGF0dXMsIGRhdGFTb3VyY2U/Lml0ZW1zLCBoYXNBbGxPdmVycmlkZXMsIGhhc0FueU92ZXJyaWRlcywgYXR0cmlidXRlT3ZlcnJpZGVzLCBzb3J0T3JkZXJBdHRyaWJ1dGVdKTtcblxuICAgIC8vIEdldCBGQVEgaXRlbXMgZnJvbSBlaXRoZXIgc3RhdGljIGNvbmZpZ3VyYXRpb24gb3IgZGF0YWJhc2VcbiAgICBjb25zdCBpdGVtcyA9IHVzZU1lbW88RkFRSXRlbVtdPigoKSA9PiB7XG4gICAgICAgIGlmIChkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YWJhc2VJdGVtcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgZmFxSXRlbXM/Lm1hcCgoaXRlbSwgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IGl0ZW0uc3VtbWFyeT8udmFsdWUgfHwgXCJRdWVzdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBpdGVtLmNvbnRlbnQ/LnZhbHVlIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRGb3JtYXQ6IG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoaXRlbS5jb250ZW50Rm9ybWF0KSxcbiAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyOiAoaW5kZXggKyAxKSAqIDEwXG4gICAgICAgICAgICAgICAgfSkpIHx8IFtdXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhYmFzZUl0ZW1zLCBmYXFJdGVtc10pO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGRlZmF1bHQgc29ydCBvcmRlciBmb3IgbmV3IGl0ZW1zXG4gICAgY29uc3QgZGVmYXVsdFNvcnRPcmRlciA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICAgICAgaWYgKHNvcnRPcmRlckF0dHJpYnV0ZSAmJiBkYXRhU291cmNlPy5pdGVtcyAmJiBkYXRhU291cmNlLml0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0ID0gZ2V0TmV4dFNvcnRPcmRlcihkYXRhU291cmNlLml0ZW1zLCBzb3J0T3JkZXJBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIobmV4dC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3VycmVudENvdW50ID0gZGF0YVNvdXJjZT8uaXRlbXM/Lmxlbmd0aCB8fCAwO1xuICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50Q291bnQgKyAxKSAqIDEwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChpdGVtcy5sZW5ndGggKyAxKSAqIDEwO1xuICAgIH0sIFtkYXRhU291cmNlVHlwZSwgZGF0YVNvdXJjZT8uaXRlbXMsIHNvcnRPcmRlckF0dHJpYnV0ZSwgaXRlbXMubGVuZ3RoXSk7XG5cbiAgICAvLyBTZXQgc29ydCBvcmRlciBvbiBkYXRhc291cmNlIHdoZW4gdXNpbmcgZGF0YWJhc2UgbW9kZSB3aXRoIHNvcnQgb3JkZXIgYXR0cmlidXRlXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZSAmJiBzb3J0T3JkZXJBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgIGlmIChkYXRhU291cmNlLnNldFNvcnRPcmRlciAmJiBzb3J0T3JkZXJBdHRyaWJ1dGUuaWQpIHtcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlLnNldFNvcnRPcmRlcihbW3NvcnRPcmRlckF0dHJpYnV0ZS5pZCwgXCJhc2NcIl1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIFtkYXRhU291cmNlVHlwZSwgZGF0YVNvdXJjZSwgc29ydE9yZGVyQXR0cmlidXRlXSk7XG5cbiAgICAvLyBHZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBzb3J0YWJsZSBpdGVtc1xuICAgIGNvbnN0IHNvcnRhYmxlSWRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICAgIGlmIChkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiICYmIGRhdGFTb3VyY2U/Lml0ZW1zKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVNvdXJjZS5pdGVtcy5tYXAoKGl0ZW06IE9iamVjdEl0ZW0pID0+IGl0ZW0uaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVtcy5tYXAoKF8sIGluZGV4KSA9PiBgc3RhdGljLSR7aW5kZXh9YCk7XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhU291cmNlPy5pdGVtcywgaXRlbXNdKTtcblxuICAgIGNvbnN0IGlzTG9hZGluZyA9XG4gICAgICAgIGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZSAmJiBkYXRhU291cmNlLnN0YXR1cyA9PT0gXCJsb2FkaW5nXCI7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpdGVtcyxcbiAgICAgICAgaXNMb2FkaW5nOiAhIWlzTG9hZGluZyxcbiAgICAgICAgZGVmYXVsdFNvcnRPcmRlcixcbiAgICAgICAgc29ydGFibGVJZHNcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IExpc3RWYWx1ZSwgTGlzdEF0dHJpYnV0ZVZhbHVlLCBBY3Rpb25WYWx1ZSwgT2JqZWN0SXRlbSB9IGZyb20gXCJtZW5kaXhcIjtcbmltcG9ydCBCaWcgZnJvbSBcImJpZy5qc1wiO1xuaW1wb3J0IHsgRHJhZ0VuZEV2ZW50IH0gZnJvbSBcIkBkbmQta2l0L2NvcmVcIjtcblxuaW1wb3J0IHsgQ29udGVudEZvcm1hdEVudW0gfSBmcm9tIFwiLi4vLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuaW1wb3J0IHsgRkFRX0RFRkFVTFRfQVRUUklCVVRFUyB9IGZyb20gXCIuLi9jb25maWcvYXR0cmlidXRlQ29uZmlnXCI7XG5pbXBvcnQge1xuICAgIGNvbW1pdE9iamVjdCxcbiAgICBkZWxldGVPYmplY3QsXG4gICAgY3JlYXRlT2JqZWN0LFxuICAgIHN3YXBTb3J0T3JkZXJzLFxuICAgIGdldEVudGl0eU5hbWUsXG4gICAgZ2V0TmV4dFNvcnRPcmRlclxufSBmcm9tIFwiLi4vdXRpbHMvbWVuZGl4RGF0YVNlcnZpY2VcIjtcblxuaW50ZXJmYWNlIFVzZUVkaXRTdGF0ZSB7XG4gICAgZWRpdGluZ0l0ZW1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBkZWxldGVDb25maXJtSW5kZXg6IG51bWJlciB8IG51bGw7XG4gICAgc2hvd0NyZWF0ZUZvcm06IGJvb2xlYW47XG4gICAgZmluaXNoRWRpdGluZzogKCkgPT4gdm9pZDtcbiAgICBjYW5jZWxFZGl0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaERlbGV0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbERlbGV0ZTogKCkgPT4gdm9pZDtcbiAgICBmaW5pc2hDcmVhdGluZzogKCkgPT4gdm9pZDtcbiAgICBjYW5jZWxDcmVhdGluZzogKCkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBBdHRyaWJ1dGUgb3ZlcnJpZGVzIHVzaW5nIExpc3RBdHRyaWJ1dGVWYWx1ZSBmb3IgZGlyZWN0IGFjY2Vzc1xuICovXG5pbnRlcmZhY2UgQXR0cmlidXRlT3ZlcnJpZGVzIHtcbiAgICBzdW1tYXJ5QXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPHN0cmluZz47XG4gICAgY29udGVudEF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxzdHJpbmc+O1xuICAgIGNvbnRlbnRGb3JtYXRBdHRyaWJ1dGU/OiBMaXN0QXR0cmlidXRlVmFsdWU8c3RyaW5nPjtcbiAgICBzb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxCaWc+O1xufVxuXG5pbnRlcmZhY2UgVXNlRkFRQWN0aW9uc1Byb3BzIHtcbiAgICBkYXRhU291cmNlVHlwZTogXCJzdGF0aWNcIiB8IFwiZGF0YWJhc2VcIjtcbiAgICBkYXRhU291cmNlPzogTGlzdFZhbHVlO1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxCaWc+O1xuICAgIGVkaXRTdGF0ZTogVXNlRWRpdFN0YXRlO1xuICAgIG9uU2F2ZUFjdGlvbj86IEFjdGlvblZhbHVlO1xuICAgIG9uRGVsZXRlQWN0aW9uPzogQWN0aW9uVmFsdWU7XG4gICAgb25DcmVhdGVBY3Rpb24/OiBBY3Rpb25WYWx1ZTtcbiAgICBhdHRyaWJ1dGVPdmVycmlkZXM/OiBBdHRyaWJ1dGVPdmVycmlkZXM7XG59XG5cbmludGVyZmFjZSBVc2VGQVFBY3Rpb25zUmVzdWx0IHtcbiAgICBoYW5kbGVTYXZlRWRpdDogKFxuICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICApID0+IFByb21pc2U8dm9pZD47XG4gICAgaGFuZGxlU2F2ZU5ldzogKFxuICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICApID0+IFByb21pc2U8dm9pZD47XG4gICAgaGFuZGxlQ29uZmlybURlbGV0ZTogKCkgPT4gdm9pZDtcbiAgICBoYW5kbGVEcmFnRW5kOiAoZXZlbnQ6IERyYWdFbmRFdmVudCkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBDdXN0b20gaG9vayB0byBtYW5hZ2UgRkFRIENSVUQgb3BlcmF0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRkFRQWN0aW9ucyh7XG4gICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgZGF0YVNvdXJjZSxcbiAgICBzb3J0T3JkZXJBdHRyaWJ1dGUsXG4gICAgZWRpdFN0YXRlLFxuICAgIG9uU2F2ZUFjdGlvbixcbiAgICBvbkRlbGV0ZUFjdGlvbixcbiAgICBvbkNyZWF0ZUFjdGlvbixcbiAgICBhdHRyaWJ1dGVPdmVycmlkZXNcbn06IFVzZUZBUUFjdGlvbnNQcm9wcyk6IFVzZUZBUUFjdGlvbnNSZXN1bHQge1xuICAgIC8vIENoZWNrIGlmIEFMTCBhdHRyaWJ1dGUgb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkIChhbGwtb3Itbm90aGluZyBhcHByb2FjaClcbiAgICBjb25zdCBoYXNBbGxPdmVycmlkZXMgPSAhIShcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5zdW1tYXJ5QXR0cmlidXRlICYmXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uY29udGVudEF0dHJpYnV0ZSAmJlxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUgJiZcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5zb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZVxuICAgICk7XG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXR0cmlidXRlIHZhbHVlcyBvbiBhbiBpdGVtIHVzaW5nIG92ZXJyaWRlcyAoTGlzdEF0dHJpYnV0ZVZhbHVlLmdldCgpLnNldFZhbHVlKCkpXG4gICAgICogVGhpcyBpcyB0aGUgcHJvcGVyIE1lbmRpeCBQbHVnZ2FibGUgV2lkZ2V0IEFQSSB3YXkgdG8gc2V0IHZhbHVlcyBmb3IgRVhJU1RJTkcgaXRlbXNcbiAgICAgKi9cbiAgICBjb25zdCBzZXRWYWx1ZXNWaWFPdmVycmlkZXMgPSAoXG4gICAgICAgIGl0ZW06IE9iamVjdEl0ZW0sXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IEJpZ1xuICAgICkgPT4ge1xuICAgICAgICBjb25zdCBzdW1tYXJ5RWRpdGFibGUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLnN1bW1hcnlBdHRyaWJ1dGUhLmdldChpdGVtKTtcbiAgICAgICAgY29uc3QgY29udGVudEVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5jb250ZW50QXR0cmlidXRlIS5nZXQoaXRlbSk7XG4gICAgICAgIGNvbnN0IGZvcm1hdEVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5jb250ZW50Rm9ybWF0QXR0cmlidXRlIS5nZXQoaXRlbSk7XG4gICAgICAgIGNvbnN0IHNvcnRPcmRlckVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5zb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZSEuZ2V0KGl0ZW0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogU2V0dGluZyB2YWx1ZXMgdmlhIExpc3RBdHRyaWJ1dGVWYWx1ZSBvdmVycmlkZXNcIik7XG4gICAgICAgIHN1bW1hcnlFZGl0YWJsZS5zZXRWYWx1ZShzdW1tYXJ5KTtcbiAgICAgICAgY29udGVudEVkaXRhYmxlLnNldFZhbHVlKGNvbnRlbnQpO1xuICAgICAgICBmb3JtYXRFZGl0YWJsZS5zZXRWYWx1ZShmb3JtYXQpO1xuICAgICAgICBzb3J0T3JkZXJFZGl0YWJsZS5zZXRWYWx1ZShzb3J0T3JkZXIpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXQgYXR0cmlidXRlIHZhbHVlcyBvbiBhbiBNeE9iamVjdCB1c2luZyBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lc1xuICAgICAqL1xuICAgIGNvbnN0IHNldFZhbHVlc1ZpYURlZmF1bHRzID0gKFxuICAgICAgICBteE9iajogYW55LFxuICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgc29ydE9yZGVyOiBCaWdcbiAgICApID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBTZXR0aW5nIHZhbHVlcyB2aWEgZGVmYXVsdCBhdHRyaWJ1dGUgbmFtZXNcIik7XG4gICAgICAgIG14T2JqLnNldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNVTU1BUlksIHN1bW1hcnkpO1xuICAgICAgICBteE9iai5zZXQoRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5ULCBjb250ZW50KTtcbiAgICAgICAgbXhPYmouc2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVF9GT1JNQVQsIGZvcm1hdCk7XG4gICAgICAgIG14T2JqLnNldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVIsIHNvcnRPcmRlcik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEdldCBhdHRyaWJ1dGUgbmFtZXMgZnJvbSBvdmVycmlkZSBMaXN0QXR0cmlidXRlVmFsdWVzIGJ5IGluc3BlY3RpbmcgYW4gZXhpc3RpbmcgaXRlbS5cbiAgICAgKiBUaGUgRWRpdGFibGVWYWx1ZS5pZCBjb250YWlucyB0aGUgZnVsbCBhdHRyaWJ1dGUgcGF0aCBsaWtlIFwiTXlNb2R1bGUuTXlFbnRpdHkvTXlBdHRyaWJ1dGVcIlxuICAgICAqIFdlIGV4dHJhY3QganVzdCB0aGUgYXR0cmlidXRlIG5hbWUgZnJvbSBpdC5cbiAgICAgKi9cbiAgICBjb25zdCBnZXRPdmVycmlkZUF0dHJpYnV0ZU5hbWVzID0gKHJlZmVyZW5jZUl0ZW06IE9iamVjdEl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgZXh0cmFjdE5hbWUgPSAoZWRpdGFibGU6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAvLyBUaGUgZWRpdGFibGUuaWQgaXMgdHlwaWNhbGx5IGluIGZvcm1hdCBcIk1vZHVsZS5FbnRpdHkvQXR0cmlidXRlTmFtZVwiXG4gICAgICAgICAgICBjb25zdCBpZCA9IGVkaXRhYmxlPy5pZCB8fCBcIlwiO1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBpZC5zcGxpdChcIi9cIik7XG4gICAgICAgICAgICByZXR1cm4gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIDogaWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgc3VtbWFyeUVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5zdW1tYXJ5QXR0cmlidXRlIS5nZXQocmVmZXJlbmNlSXRlbSk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRFZGl0YWJsZSA9IGF0dHJpYnV0ZU92ZXJyaWRlcyEuY29udGVudEF0dHJpYnV0ZSEuZ2V0KHJlZmVyZW5jZUl0ZW0pO1xuICAgICAgICBjb25zdCBmb3JtYXRFZGl0YWJsZSA9IGF0dHJpYnV0ZU92ZXJyaWRlcyEuY29udGVudEZvcm1hdEF0dHJpYnV0ZSEuZ2V0KHJlZmVyZW5jZUl0ZW0pO1xuICAgICAgICBjb25zdCBzb3J0T3JkZXJFZGl0YWJsZSA9IGF0dHJpYnV0ZU92ZXJyaWRlcyEuc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGUhLmdldChyZWZlcmVuY2VJdGVtKTtcblxuICAgICAgICBjb25zdCBuYW1lcyA9IHtcbiAgICAgICAgICAgIHN1bW1hcnk6IGV4dHJhY3ROYW1lKHN1bW1hcnlFZGl0YWJsZSksXG4gICAgICAgICAgICBjb250ZW50OiBleHRyYWN0TmFtZShjb250ZW50RWRpdGFibGUpLFxuICAgICAgICAgICAgY29udGVudEZvcm1hdDogZXh0cmFjdE5hbWUoZm9ybWF0RWRpdGFibGUpLFxuICAgICAgICAgICAgc29ydE9yZGVyOiBleHRyYWN0TmFtZShzb3J0T3JkZXJFZGl0YWJsZSlcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IEV4dHJhY3RlZCBvdmVycmlkZSBhdHRyaWJ1dGUgbmFtZXM6XCIsIG5hbWVzKTtcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlRWRpdCA9IHVzZUNhbGxiYWNrKFxuICAgICAgICBhc3luYyAoXG4gICAgICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgICAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICAgICAgKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXggPT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAhZGF0YVNvdXJjZSB8fFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VUeXBlICE9PSBcImRhdGFiYXNlXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpdGVtID0gZGF0YVNvdXJjZS5pdGVtcz8uW2VkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4XTtcbiAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcHRpb24gMTogVXNlIGN1c3RvbSBhY3Rpb24gaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgaWYgKG9uU2F2ZUFjdGlvbiAmJiBvblNhdmVBY3Rpb24uY2FuRXhlY3V0ZSkge1xuICAgICAgICAgICAgICAgIG9uU2F2ZUFjdGlvbi5leGVjdXRlKCk7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmZpbmlzaEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbiAyOiBVc2Ugb3ZlcnJpZGVzIGlmIGNvbmZpZ3VyZWQgKHNldFZhbHVlIHZpYSBMaXN0QXR0cmlidXRlVmFsdWUpXG4gICAgICAgICAgICBpZiAoaGFzQWxsT3ZlcnJpZGVzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29ydFZhbHVlID0gbmV3IEJpZyhzb3J0T3JkZXIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRWYWx1ZXNWaWFPdmVycmlkZXMoaXRlbSwgc3VtbWFyeSwgY29udGVudCwgZm9ybWF0LCBzb3J0VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZldGNoIE14T2JqZWN0IGZvciBjb21taXRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbXggPSAod2luZG93IGFzIGFueSkubXg7XG4gICAgICAgICAgICAgICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1aWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKG14T2JqOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21taXRPYmplY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14T2JqLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkZBUSBBY2NvcmRpb246IFN1Y2Nlc3NmdWxseSBzYXZlZCBGQVEgaXRlbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBzYXZlOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZ2V0IG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gc2F2ZSB3aXRoIG92ZXJyaWRlczpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbiAzOiBGYWxsYmFjayB0byBidWlsdC1pbiBjb21taXQgd2l0aCBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBteCA9ICh3aW5kb3cgYXMgYW55KS5teDtcbiAgICAgICAgICAgICAgICBjb25zdCBndWlkID0gaXRlbS5pZDtcblxuICAgICAgICAgICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgICAgICAgICAgZ3VpZDogZ3VpZCxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IChteE9iajogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3J0VmFsdWUgPSBuZXcgQmlnKHNvcnRPcmRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRWYWx1ZXNWaWFEZWZhdWx0cyhteE9iaiwgc3VtbWFyeSwgY29udGVudCwgZm9ybWF0LCBzb3J0VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21taXRPYmplY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhPYmosXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkZBUSBBY2NvcmRpb246IFN1Y2Nlc3NmdWxseSBzYXZlZCBGQVEgaXRlbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBzYXZlOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGdldCBvYmplY3Q6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBjb21taXQ6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBbZGF0YVNvdXJjZSwgZGF0YVNvdXJjZVR5cGUsIGVkaXRTdGF0ZSwgb25TYXZlQWN0aW9uLCBhdHRyaWJ1dGVPdmVycmlkZXNdXG4gICAgKTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmVOZXcgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgYXN5bmMgKFxuICAgICAgICAgICAgc3VtbWFyeTogc3RyaW5nLFxuICAgICAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgICAgIHNvcnRPcmRlcjogbnVtYmVyXG4gICAgICAgICk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgICAgICAgICAgaWYgKCFkYXRhU291cmNlIHx8IGRhdGFTb3VyY2VUeXBlICE9PSBcImRhdGFiYXNlXCIpIHtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsQ3JlYXRpbmcoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbiAxOiBVc2UgY3VzdG9tIGNyZWF0ZSBhY3Rpb24gaWYgY29uZmlndXJlZFxuICAgICAgICAgICAgaWYgKG9uQ3JlYXRlQWN0aW9uICYmIG9uQ3JlYXRlQWN0aW9uLmNhbkV4ZWN1dGUpIHtcbiAgICAgICAgICAgICAgICBvbkNyZWF0ZUFjdGlvbi5leGVjdXRlKCk7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmZpbmlzaENyZWF0aW5nKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcHRpb24gMjogRmFsbGJhY2sgdG8gYnVpbHQtaW4gY3JlYXRlXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudGl0eU5hbWUgPSBhd2FpdCBnZXRFbnRpdHlOYW1lKGRhdGFTb3VyY2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFlbnRpdHlOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBDYW5ub3QgY3JlYXRlIG5ldyBpdGVtIC0gZW50aXR5IG5hbWUgbm90IGZvdW5kXCIpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsQ3JlYXRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0l0ZW0gPSBhd2FpdCBjcmVhdGVPYmplY3QoZW50aXR5TmFtZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgYXR0cmlidXRlIG5hbWVzIGJhc2VkIG9uIHdoZXRoZXIgd2UncmUgdXNpbmcgb3ZlcnJpZGVzXG4gICAgICAgICAgICAgICAgbGV0IGF0dHJOYW1lczoge1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IHN0cmluZztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0FsbE92ZXJyaWRlcyAmJiBkYXRhU291cmNlLml0ZW1zICYmIGRhdGFTb3VyY2UuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVc2Ugb3ZlcnJpZGVzIC0gZ2V0IG5hbWVzIGZyb20gZXhpc3RpbmcgaXRlbVxuICAgICAgICAgICAgICAgICAgICBhdHRyTmFtZXMgPSBnZXRPdmVycmlkZUF0dHJpYnV0ZU5hbWVzKGRhdGFTb3VyY2UuaXRlbXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFVzaW5nIG92ZXJyaWRlIGF0dHJpYnV0ZSBuYW1lcyBmb3IgY3JlYXRlOlwiLCBhdHRyTmFtZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZSBkZWZhdWx0c1xuICAgICAgICAgICAgICAgICAgICBhdHRyTmFtZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNVTU1BUlksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50Rm9ybWF0OiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRfRk9STUFULFxuICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyOiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVJcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBVc2luZyBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lcyBmb3IgY3JlYXRlOlwiLCBhdHRyTmFtZXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG5ld0l0ZW0uc2V0KGF0dHJOYW1lcy5zdW1tYXJ5LCBzdW1tYXJ5KTtcbiAgICAgICAgICAgICAgICBuZXdJdGVtLnNldChhdHRyTmFtZXMuY29udGVudCwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgbmV3SXRlbS5zZXQoYXR0ck5hbWVzLmNvbnRlbnRGb3JtYXQsIGZvcm1hdCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgc29ydE9yZGVyVG9Vc2UgPSBzb3J0T3JkZXI7XG5cbiAgICAgICAgICAgICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShzb3J0T3JkZXJUb1VzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvcnRPcmRlckF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV4dFNvcnRPcmRlciA9IGdldE5leHRTb3J0T3JkZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZS5pdGVtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXJUb1VzZSA9IE51bWJlcihuZXh0U29ydE9yZGVyLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudENvdW50ID0gZGF0YVNvdXJjZS5pdGVtcz8ubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXJUb1VzZSA9IChjdXJyZW50Q291bnQgKyAxKSAqIDEwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgc29ydE9yZGVyVmFsdWUgPSBuZXcgQmlnKHNvcnRPcmRlclRvVXNlKTtcbiAgICAgICAgICAgICAgICBuZXdJdGVtLnNldChhdHRyTmFtZXMuc29ydE9yZGVyLCBzb3J0T3JkZXJWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCBjb21taXRPYmplY3QoXG4gICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgIFwiRkFRIEFjY29yZGlvbjogU3VjY2Vzc2Z1bGx5IGNyZWF0ZWQgbmV3IEZBUSBpdGVtXCJcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hDcmVhdGluZygpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGNyZWF0ZSBuZXcgaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxDcmVhdGluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBbZGF0YVNvdXJjZSwgZGF0YVNvdXJjZVR5cGUsIGVkaXRTdGF0ZSwgb25DcmVhdGVBY3Rpb24sIHNvcnRPcmRlckF0dHJpYnV0ZSwgaGFzQWxsT3ZlcnJpZGVzXVxuICAgICk7XG5cbiAgICBjb25zdCBoYW5kbGVDb25maXJtRGVsZXRlID0gdXNlQ2FsbGJhY2soKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoZWRpdFN0YXRlLmRlbGV0ZUNvbmZpcm1JbmRleCA9PT0gbnVsbCB8fCAhZGF0YVNvdXJjZSB8fCBkYXRhU291cmNlVHlwZSAhPT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRGVsZXRlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtID0gZGF0YVNvdXJjZS5pdGVtcz8uW2VkaXRTdGF0ZS5kZWxldGVDb25maXJtSW5kZXhdO1xuICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxEZWxldGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9wdGlvbiAxOiBVc2UgY3VzdG9tIGRlbGV0ZSBhY3Rpb24gaWYgY29uZmlndXJlZFxuICAgICAgICBpZiAob25EZWxldGVBY3Rpb24gJiYgb25EZWxldGVBY3Rpb24uY2FuRXhlY3V0ZSkge1xuICAgICAgICAgICAgb25EZWxldGVBY3Rpb24uZXhlY3V0ZSgpO1xuICAgICAgICAgICAgZWRpdFN0YXRlLmZpbmlzaERlbGV0aW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3B0aW9uIDI6IEZhbGxiYWNrIHRvIGJ1aWx0LWluIGRlbGV0ZVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZU9iamVjdChpdGVtLCBkYXRhU291cmNlLCBcIkZBUSBBY2NvcmRpb246IFN1Y2Nlc3NmdWxseSBkZWxldGVkIEZBUSBpdGVtXCIpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoRGVsZXRpbmcoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBkZWxldGU6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbERlbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgW2RhdGFTb3VyY2UsIGRhdGFTb3VyY2VUeXBlLCBlZGl0U3RhdGUsIG9uRGVsZXRlQWN0aW9uXSk7XG5cbiAgICBjb25zdCBoYW5kbGVEcmFnRW5kID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIChldmVudDogRHJhZ0VuZEV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGFjdGl2ZSwgb3ZlciB9ID0gZXZlbnQ7XG5cbiAgICAgICAgICAgIGlmICghb3ZlciB8fCBhY3RpdmUuaWQgPT09IG92ZXIuaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZGF0YVNvdXJjZSB8fCBkYXRhU291cmNlVHlwZSAhPT0gXCJkYXRhYmFzZVwiIHx8ICFzb3J0T3JkZXJBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgIFwiRkFRIEFjY29yZGlvbjogRHJhZy1kcm9wIHJlcXVpcmVzIGRhdGFiYXNlIG1vZGUgd2l0aCBzb3J0T3JkZXJBdHRyaWJ1dGVcIlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkc0l0ZW1zID0gZGF0YVNvdXJjZS5pdGVtcyB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IG9sZEluZGV4ID0gZHNJdGVtcy5maW5kSW5kZXgoKGl0ZW06IE9iamVjdEl0ZW0pID0+IGl0ZW0uaWQgPT09IGFjdGl2ZS5pZCk7XG4gICAgICAgICAgICBjb25zdCBuZXdJbmRleCA9IGRzSXRlbXMuZmluZEluZGV4KChpdGVtOiBPYmplY3RJdGVtKSA9PiBpdGVtLmlkID09PSBvdmVyLmlkKTtcblxuICAgICAgICAgICAgaWYgKG9sZEluZGV4ID09PSAtMSB8fCBuZXdJbmRleCA9PT0gLTEgfHwgb2xkSW5kZXggPT09IG5ld0luZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkSXRlbSA9IGRzSXRlbXNbb2xkSW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0SXRlbSA9IGRzSXRlbXNbbmV3SW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAoIWRyYWdnZWRJdGVtIHx8ICF0YXJnZXRJdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkcmFnZ2VkT3JkZXIgPSBzb3J0T3JkZXJBdHRyaWJ1dGUuZ2V0KGRyYWdnZWRJdGVtKS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE9yZGVyID0gc29ydE9yZGVyQXR0cmlidXRlLmdldCh0YXJnZXRJdGVtKS52YWx1ZTtcblxuICAgICAgICAgICAgc3dhcFNvcnRPcmRlcnMoXG4gICAgICAgICAgICAgICAgZHJhZ2dlZEl0ZW0sXG4gICAgICAgICAgICAgICAgdGFyZ2V0SXRlbSxcbiAgICAgICAgICAgICAgICBkcmFnZ2VkT3JkZXIsXG4gICAgICAgICAgICAgICAgdGFyZ2V0T3JkZXIsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZSxcbiAgICAgICAgICAgICAgICBgRkFRIEFjY29yZGlvbjogU3VjY2Vzc2Z1bGx5IHJlb3JkZXJlZCBpdGVtIGZyb20gcG9zaXRpb24gJHtvbGRJbmRleCArIDF9IHRvICR7XG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4ICsgMVxuICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICApLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gcmVvcmRlciBpdGVtOlwiLCBlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgW2RhdGFTb3VyY2UsIGRhdGFTb3VyY2VUeXBlLCBzb3J0T3JkZXJBdHRyaWJ1dGVdXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGhhbmRsZVNhdmVFZGl0LFxuICAgICAgICBoYW5kbGVTYXZlTmV3LFxuICAgICAgICBoYW5kbGVDb25maXJtRGVsZXRlLFxuICAgICAgICBoYW5kbGVEcmFnRW5kXG4gICAgfTtcbn1cbiIsIi8qIVxuXHRDb3B5cmlnaHQgKGMpIDIwMTggSmVkIFdhdHNvbi5cblx0TGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcblx0aHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoYXJnKSB7XG5cdFx0XHRcdGNsYXNzZXMgPSBhcHBlbmRDbGFzcyhjbGFzc2VzLCBwYXJzZVZhbHVlKGFyZykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzO1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VWYWx1ZSAoYXJnKSB7XG5cdFx0aWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG5cdFx0XHRyZXR1cm4gYXJnO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYXJnICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblxuXHRcdGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdHJldHVybiBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cdFx0fVxuXG5cdFx0aWYgKGFyZy50b1N0cmluZyAhPT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAmJiAhYXJnLnRvU3RyaW5nLnRvU3RyaW5nKCkuaW5jbHVkZXMoJ1tuYXRpdmUgY29kZV0nKSkge1xuXHRcdFx0cmV0dXJuIGFyZy50b1N0cmluZygpO1xuXHRcdH1cblxuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdGNsYXNzZXMgPSBhcHBlbmRDbGFzcyhjbGFzc2VzLCBrZXkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kQ2xhc3MgKHZhbHVlLCBuZXdDbGFzcykge1xuXHRcdGlmICghbmV3Q2xhc3MpIHtcblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9XG5cdFxuXHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0cmV0dXJuIHZhbHVlICsgJyAnICsgbmV3Q2xhc3M7XG5cdFx0fVxuXHRcblx0XHRyZXR1cm4gdmFsdWUgKyBuZXdDbGFzcztcblx0fVxuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdGNsYXNzTmFtZXMuZGVmYXVsdCA9IGNsYXNzTmFtZXM7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBjbGFzc05hbWVzO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyByZWdpc3RlciBhcyAnY2xhc3NuYW1lcycsIGNvbnNpc3RlbnQgd2l0aCBucG0gcGFja2FnZSBuYW1lXG5cdFx0ZGVmaW5lKCdjbGFzc25hbWVzJywgW10sIGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBjbGFzc05hbWVzO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5jbGFzc05hbWVzID0gY2xhc3NOYW1lcztcblx0fVxufSgpKTtcbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5pbnRlcmZhY2UgRWRpdE1vZGVUb2dnbGVQcm9wcyB7XG4gICAgZWRpdE1vZGU6IGJvb2xlYW47XG4gICAgb25Ub2dnbGU6ICgpID0+IHZvaWQ7XG4gICAgZGlzYWJsZWQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRvZ2dsZSBidXR0b24gZm9yIHN3aXRjaGluZyBiZXR3ZWVuIHZpZXcgYW5kIGVkaXQgbW9kZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEVkaXRNb2RlVG9nZ2xlKHByb3BzOiBFZGl0TW9kZVRvZ2dsZVByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7IGVkaXRNb2RlLCBvblRvZ2dsZSwgZGlzYWJsZWQgPSBmYWxzZSB9ID0gcHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1lZGl0LW1vZGUtdG9nZ2xlXCIsIHtcbiAgICAgICAgICAgICAgICBcImZhcS1lZGl0LW1vZGUtYWN0aXZlXCI6IGVkaXRNb2RlXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uVG9nZ2xlfVxuICAgICAgICAgICAgZGlzYWJsZWQ9e2Rpc2FibGVkfVxuICAgICAgICAgICAgYXJpYS1sYWJlbD17ZWRpdE1vZGUgPyBcIlN3aXRjaCB0byB2aWV3IG1vZGVcIiA6IFwiU3dpdGNoIHRvIGVkaXQgbW9kZVwifVxuICAgICAgICAgICAgdGl0bGU9e2VkaXRNb2RlID8gXCJWaWV3IE1vZGVcIiA6IFwiRWRpdCBNb2RlXCJ9XG4gICAgICAgID5cbiAgICAgICAgICAgIHtlZGl0TW9kZSA/IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEwLjUgOGEyLjUgMi41IDAgMSAxLTUgMCAyLjUgMi41IDAgMCAxIDUgMHpcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0wIDhzMy01LjUgOC01LjVTMTYgOCAxNiA4cy0zIDUuNS04IDUuNVMwIDggMCA4em04IDMuNWEzLjUgMy41IDAgMSAwIDAtNyAzLjUgMy41IDAgMCAwIDAgN3pcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+Vmlldzwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMi44NTQgMS4xNDZhLjUuNSAwIDAgMC0uNzA4IDBMMTAgMy4yOTMgMTIuNzA3IDZsMi4xNDctMi4xNDZhLjUuNSAwIDAgMCAwLS43MDhsLTItMnpNMTEuMjkzIDRMMiAxMy4yOTNWMTZoMi43MDdMMTQgNi43MDcgMTEuMjkzIDR6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkVkaXQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuaW1wb3J0IHsgRWRpdE1vZGVUb2dnbGUgfSBmcm9tIFwiLi9FZGl0TW9kZVRvZ2dsZVwiO1xuXG5pbnRlcmZhY2UgRkFRSGVhZGVyUHJvcHMge1xuICAgIHNob3dUb2dnbGVCdXR0b246IGJvb2xlYW47XG4gICAgYWxsRXhwYW5kZWQ6IGJvb2xlYW47XG4gICAgdG9nZ2xlQnV0dG9uVGV4dD86IHN0cmluZztcbiAgICBvblRvZ2dsZUFsbDogKCkgPT4gdm9pZDtcbiAgICBpc0VkaXRpbmdFbmFibGVkOiBib29sZWFuO1xuICAgIGVkaXRNb2RlOiBib29sZWFuO1xuICAgIG9uVG9nZ2xlRWRpdE1vZGU6ICgpID0+IHZvaWQ7XG4gICAgb25DcmVhdGVOZXc6ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogSGVhZGVyIGNvbXBvbmVudCB3aXRoIHRvZ2dsZSBhbGwgYnV0dG9uIGFuZCBlZGl0IG1vZGUgY29udHJvbHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZBUUhlYWRlcih7XG4gICAgc2hvd1RvZ2dsZUJ1dHRvbixcbiAgICBhbGxFeHBhbmRlZCxcbiAgICB0b2dnbGVCdXR0b25UZXh0LFxuICAgIG9uVG9nZ2xlQWxsLFxuICAgIGlzRWRpdGluZ0VuYWJsZWQsXG4gICAgZWRpdE1vZGUsXG4gICAgb25Ub2dnbGVFZGl0TW9kZSxcbiAgICBvbkNyZWF0ZU5ld1xufTogRkFRSGVhZGVyUHJvcHMpOiBSZWFjdEVsZW1lbnQgfCBudWxsIHtcbiAgICBpZiAoIXNob3dUb2dnbGVCdXR0b24gJiYgIWlzRWRpdGluZ0VuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZ2V0VG9nZ2xlQnV0dG9uVGV4dCA9ICgpOiBzdHJpbmcgPT4ge1xuICAgICAgICBpZiAodG9nZ2xlQnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRvZ2dsZUJ1dHRvblRleHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbEV4cGFuZGVkID8gXCJIaWRlIEFsbFwiIDogXCJTaG93IEFsbFwiO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24taGVhZGVyXCI+XG4gICAgICAgICAgICB7c2hvd1RvZ2dsZUJ1dHRvbiAmJiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtdG9nZ2xlLWFsbC1idG5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtdG9nZ2xlLWFsbC1idG4tLWV4cGFuZGVkXCI6IGFsbEV4cGFuZGVkXG4gICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvblRvZ2dsZUFsbH1cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7Z2V0VG9nZ2xlQnV0dG9uVGV4dCgpfVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIHtpc0VkaXRpbmdFbmFibGVkICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0aW5nLWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgIHtlZGl0TW9kZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWNyZWF0ZS1uZXctYnRuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNyZWF0ZU5ld31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiQ3JlYXRlIG5ldyBGQVEgaXRlbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTggMmEuNS41IDAgMCAxIC41LjV2NWg1YS41LjUgMCAwIDEgMCAxaC01djVhLjUuNSAwIDAgMS0xIDB2LTVoLTVhLjUuNSAwIDAgMSAwLTFoNXYtNUEuNS41IDAgMCAxIDggMnpcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENyZWF0ZSBOZXdcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8RWRpdE1vZGVUb2dnbGUgZWRpdE1vZGU9e2VkaXRNb2RlfSBvblRvZ2dsZT17b25Ub2dnbGVFZGl0TW9kZX0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCIvKiEgQGxpY2Vuc2UgRE9NUHVyaWZ5IDMuMy4xIHwgKGMpIEN1cmU1MyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIHwgUmVsZWFzZWQgdW5kZXIgdGhlIEFwYWNoZSBsaWNlbnNlIDIuMCBhbmQgTW96aWxsYSBQdWJsaWMgTGljZW5zZSAyLjAgfCBnaXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvYmxvYi8zLjMuMS9MSUNFTlNFICovXG5cbmNvbnN0IHtcbiAgZW50cmllcyxcbiAgc2V0UHJvdG90eXBlT2YsXG4gIGlzRnJvemVuLFxuICBnZXRQcm90b3R5cGVPZixcbiAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yXG59ID0gT2JqZWN0O1xubGV0IHtcbiAgZnJlZXplLFxuICBzZWFsLFxuICBjcmVhdGVcbn0gPSBPYmplY3Q7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaW1wb3J0L25vLW11dGFibGUtZXhwb3J0c1xubGV0IHtcbiAgYXBwbHksXG4gIGNvbnN0cnVjdFxufSA9IHR5cGVvZiBSZWZsZWN0ICE9PSAndW5kZWZpbmVkJyAmJiBSZWZsZWN0O1xuaWYgKCFmcmVlemUpIHtcbiAgZnJlZXplID0gZnVuY3Rpb24gZnJlZXplKHgpIHtcbiAgICByZXR1cm4geDtcbiAgfTtcbn1cbmlmICghc2VhbCkge1xuICBzZWFsID0gZnVuY3Rpb24gc2VhbCh4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG59XG5pZiAoIWFwcGx5KSB7XG4gIGFwcGx5ID0gZnVuY3Rpb24gYXBwbHkoZnVuYywgdGhpc0FyZykge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4gPiAyID8gX2xlbiAtIDIgOiAwKSwgX2tleSA9IDI7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDJdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cbiAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgfTtcbn1cbmlmICghY29uc3RydWN0KSB7XG4gIGNvbnN0cnVjdCA9IGZ1bmN0aW9uIGNvbnN0cnVjdChGdW5jKSB7XG4gICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yID4gMSA/IF9sZW4yIC0gMSA6IDApLCBfa2V5MiA9IDE7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgIGFyZ3NbX2tleTIgLSAxXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgfVxuICAgIHJldHVybiBuZXcgRnVuYyguLi5hcmdzKTtcbiAgfTtcbn1cbmNvbnN0IGFycmF5Rm9yRWFjaCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLmZvckVhY2gpO1xuY29uc3QgYXJyYXlMYXN0SW5kZXhPZiA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mKTtcbmNvbnN0IGFycmF5UG9wID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUucG9wKTtcbmNvbnN0IGFycmF5UHVzaCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuY29uc3QgYXJyYXlTcGxpY2UgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5zcGxpY2UpO1xuY29uc3Qgc3RyaW5nVG9Mb3dlckNhc2UgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudG9Mb3dlckNhc2UpO1xuY29uc3Qgc3RyaW5nVG9TdHJpbmcgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcpO1xuY29uc3Qgc3RyaW5nTWF0Y2ggPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUubWF0Y2gpO1xuY29uc3Qgc3RyaW5nUmVwbGFjZSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlKTtcbmNvbnN0IHN0cmluZ0luZGV4T2YgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZik7XG5jb25zdCBzdHJpbmdUcmltID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRyaW0pO1xuY29uc3Qgb2JqZWN0SGFzT3duUHJvcGVydHkgPSB1bmFwcGx5KE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuY29uc3QgcmVnRXhwVGVzdCA9IHVuYXBwbHkoUmVnRXhwLnByb3RvdHlwZS50ZXN0KTtcbmNvbnN0IHR5cGVFcnJvckNyZWF0ZSA9IHVuY29uc3RydWN0KFR5cGVFcnJvcik7XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb24gd2l0aCBhIHNwZWNpZmllZCB0aGlzQXJnIGFuZCBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIGZ1bmMgLSBUaGUgZnVuY3Rpb24gdG8gYmUgd3JhcHBlZCBhbmQgY2FsbGVkLlxuICogQHJldHVybnMgQSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb24gd2l0aCBhIHNwZWNpZmllZCB0aGlzQXJnIGFuZCBhcmd1bWVudHMuXG4gKi9cbmZ1bmN0aW9uIHVuYXBwbHkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24gKHRoaXNBcmcpIHtcbiAgICBpZiAodGhpc0FyZyBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgdGhpc0FyZy5sYXN0SW5kZXggPSAwO1xuICAgIH1cbiAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjMgPiAxID8gX2xlbjMgLSAxIDogMCksIF9rZXkzID0gMTsgX2tleTMgPCBfbGVuMzsgX2tleTMrKykge1xuICAgICAgYXJnc1tfa2V5MyAtIDFdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICB9XG4gICAgcmV0dXJuIGFwcGx5KGZ1bmMsIHRoaXNBcmcsIGFyZ3MpO1xuICB9O1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY29uc3RydWN0cyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IgZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSBmdW5jIC0gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGJlIHdyYXBwZWQgYW5kIGNhbGxlZC5cbiAqIEByZXR1cm5zIEEgbmV3IGZ1bmN0aW9uIHRoYXQgY29uc3RydWN0cyBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gY29uc3RydWN0b3IgZnVuY3Rpb24gd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzLlxuICovXG5mdW5jdGlvbiB1bmNvbnN0cnVjdChGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgX2xlbjQgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW40KSwgX2tleTQgPSAwOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICBhcmdzW19rZXk0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgfVxuICAgIHJldHVybiBjb25zdHJ1Y3QoRnVuYywgYXJncyk7XG4gIH07XG59XG4vKipcbiAqIEFkZCBwcm9wZXJ0aWVzIHRvIGEgbG9va3VwIHRhYmxlXG4gKlxuICogQHBhcmFtIHNldCAtIFRoZSBzZXQgdG8gd2hpY2ggZWxlbWVudHMgd2lsbCBiZSBhZGRlZC5cbiAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIGVsZW1lbnRzIHRvIGJlIGFkZGVkIHRvIHRoZSBzZXQuXG4gKiBAcGFyYW0gdHJhbnNmb3JtQ2FzZUZ1bmMgLSBBbiBvcHRpb25hbCBmdW5jdGlvbiB0byB0cmFuc2Zvcm0gdGhlIGNhc2Ugb2YgZWFjaCBlbGVtZW50IGJlZm9yZSBhZGRpbmcgdG8gdGhlIHNldC5cbiAqIEByZXR1cm5zIFRoZSBtb2RpZmllZCBzZXQgd2l0aCBhZGRlZCBlbGVtZW50cy5cbiAqL1xuZnVuY3Rpb24gYWRkVG9TZXQoc2V0LCBhcnJheSkge1xuICBsZXQgdHJhbnNmb3JtQ2FzZUZ1bmMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHN0cmluZ1RvTG93ZXJDYXNlO1xuICBpZiAoc2V0UHJvdG90eXBlT2YpIHtcbiAgICAvLyBNYWtlICdpbicgYW5kIHRydXRoeSBjaGVja3MgbGlrZSBCb29sZWFuKHNldC5jb25zdHJ1Y3RvcilcbiAgICAvLyBpbmRlcGVuZGVudCBvZiBhbnkgcHJvcGVydGllcyBkZWZpbmVkIG9uIE9iamVjdC5wcm90b3R5cGUuXG4gICAgLy8gUHJldmVudCBwcm90b3R5cGUgc2V0dGVycyBmcm9tIGludGVyY2VwdGluZyBzZXQgYXMgYSB0aGlzIHZhbHVlLlxuICAgIHNldFByb3RvdHlwZU9mKHNldCwgbnVsbCk7XG4gIH1cbiAgbGV0IGwgPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChsLS0pIHtcbiAgICBsZXQgZWxlbWVudCA9IGFycmF5W2xdO1xuICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGxjRWxlbWVudCA9IHRyYW5zZm9ybUNhc2VGdW5jKGVsZW1lbnQpO1xuICAgICAgaWYgKGxjRWxlbWVudCAhPT0gZWxlbWVudCkge1xuICAgICAgICAvLyBDb25maWcgcHJlc2V0cyAoZS5nLiB0YWdzLmpzLCBhdHRycy5qcykgYXJlIGltbXV0YWJsZS5cbiAgICAgICAgaWYgKCFpc0Zyb3plbihhcnJheSkpIHtcbiAgICAgICAgICBhcnJheVtsXSA9IGxjRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50ID0gbGNFbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBzZXRbZWxlbWVudF0gPSB0cnVlO1xuICB9XG4gIHJldHVybiBzZXQ7XG59XG4vKipcbiAqIENsZWFuIHVwIGFuIGFycmF5IHRvIGhhcmRlbiBhZ2FpbnN0IENTUFBcbiAqXG4gKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgdG8gYmUgY2xlYW5lZC5cbiAqIEByZXR1cm5zIFRoZSBjbGVhbmVkIHZlcnNpb24gb2YgdGhlIGFycmF5XG4gKi9cbmZ1bmN0aW9uIGNsZWFuQXJyYXkoYXJyYXkpIHtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGFycmF5Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgIGNvbnN0IGlzUHJvcGVydHlFeGlzdCA9IG9iamVjdEhhc093blByb3BlcnR5KGFycmF5LCBpbmRleCk7XG4gICAgaWYgKCFpc1Byb3BlcnR5RXhpc3QpIHtcbiAgICAgIGFycmF5W2luZGV4XSA9IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cbi8qKlxuICogU2hhbGxvdyBjbG9uZSBhbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0gb2JqZWN0IC0gVGhlIG9iamVjdCB0byBiZSBjbG9uZWQuXG4gKiBAcmV0dXJucyBBIG5ldyBvYmplY3QgdGhhdCBjb3BpZXMgdGhlIG9yaWdpbmFsLlxuICovXG5mdW5jdGlvbiBjbG9uZShvYmplY3QpIHtcbiAgY29uc3QgbmV3T2JqZWN0ID0gY3JlYXRlKG51bGwpO1xuICBmb3IgKGNvbnN0IFtwcm9wZXJ0eSwgdmFsdWVdIG9mIGVudHJpZXMob2JqZWN0KSkge1xuICAgIGNvbnN0IGlzUHJvcGVydHlFeGlzdCA9IG9iamVjdEhhc093blByb3BlcnR5KG9iamVjdCwgcHJvcGVydHkpO1xuICAgIGlmIChpc1Byb3BlcnR5RXhpc3QpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gY2xlYW5BcnJheSh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gY2xvbmUodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmV3T2JqZWN0O1xufVxuLyoqXG4gKiBUaGlzIG1ldGhvZCBhdXRvbWF0aWNhbGx5IGNoZWNrcyBpZiB0aGUgcHJvcCBpcyBmdW5jdGlvbiBvciBnZXR0ZXIgYW5kIGJlaGF2ZXMgYWNjb3JkaW5nbHkuXG4gKlxuICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gbG9vayB1cCB0aGUgZ2V0dGVyIGZ1bmN0aW9uIGluIGl0cyBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0gcHJvcCAtIFRoZSBwcm9wZXJ0eSBuYW1lIGZvciB3aGljaCB0byBmaW5kIHRoZSBnZXR0ZXIgZnVuY3Rpb24uXG4gKiBAcmV0dXJucyBUaGUgZ2V0dGVyIGZ1bmN0aW9uIGZvdW5kIGluIHRoZSBwcm90b3R5cGUgY2hhaW4gb3IgYSBmYWxsYmFjayBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbG9va3VwR2V0dGVyKG9iamVjdCwgcHJvcCkge1xuICB3aGlsZSAob2JqZWN0ICE9PSBudWxsKSB7XG4gICAgY29uc3QgZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3ApO1xuICAgIGlmIChkZXNjKSB7XG4gICAgICBpZiAoZGVzYy5nZXQpIHtcbiAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy5nZXQpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBkZXNjLnZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB1bmFwcGx5KGRlc2MudmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBvYmplY3QgPSBnZXRQcm90b3R5cGVPZihvYmplY3QpO1xuICB9XG4gIGZ1bmN0aW9uIGZhbGxiYWNrVmFsdWUoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGZhbGxiYWNrVmFsdWU7XG59XG5cbmNvbnN0IGh0bWwkMSA9IGZyZWV6ZShbJ2EnLCAnYWJicicsICdhY3JvbnltJywgJ2FkZHJlc3MnLCAnYXJlYScsICdhcnRpY2xlJywgJ2FzaWRlJywgJ2F1ZGlvJywgJ2InLCAnYmRpJywgJ2JkbycsICdiaWcnLCAnYmxpbmsnLCAnYmxvY2txdW90ZScsICdib2R5JywgJ2JyJywgJ2J1dHRvbicsICdjYW52YXMnLCAnY2FwdGlvbicsICdjZW50ZXInLCAnY2l0ZScsICdjb2RlJywgJ2NvbCcsICdjb2xncm91cCcsICdjb250ZW50JywgJ2RhdGEnLCAnZGF0YWxpc3QnLCAnZGQnLCAnZGVjb3JhdG9yJywgJ2RlbCcsICdkZXRhaWxzJywgJ2RmbicsICdkaWFsb2cnLCAnZGlyJywgJ2RpdicsICdkbCcsICdkdCcsICdlbGVtZW50JywgJ2VtJywgJ2ZpZWxkc2V0JywgJ2ZpZ2NhcHRpb24nLCAnZmlndXJlJywgJ2ZvbnQnLCAnZm9vdGVyJywgJ2Zvcm0nLCAnaDEnLCAnaDInLCAnaDMnLCAnaDQnLCAnaDUnLCAnaDYnLCAnaGVhZCcsICdoZWFkZXInLCAnaGdyb3VwJywgJ2hyJywgJ2h0bWwnLCAnaScsICdpbWcnLCAnaW5wdXQnLCAnaW5zJywgJ2tiZCcsICdsYWJlbCcsICdsZWdlbmQnLCAnbGknLCAnbWFpbicsICdtYXAnLCAnbWFyaycsICdtYXJxdWVlJywgJ21lbnUnLCAnbWVudWl0ZW0nLCAnbWV0ZXInLCAnbmF2JywgJ25vYnInLCAnb2wnLCAnb3B0Z3JvdXAnLCAnb3B0aW9uJywgJ291dHB1dCcsICdwJywgJ3BpY3R1cmUnLCAncHJlJywgJ3Byb2dyZXNzJywgJ3EnLCAncnAnLCAncnQnLCAncnVieScsICdzJywgJ3NhbXAnLCAnc2VhcmNoJywgJ3NlY3Rpb24nLCAnc2VsZWN0JywgJ3NoYWRvdycsICdzbG90JywgJ3NtYWxsJywgJ3NvdXJjZScsICdzcGFjZXInLCAnc3BhbicsICdzdHJpa2UnLCAnc3Ryb25nJywgJ3N0eWxlJywgJ3N1YicsICdzdW1tYXJ5JywgJ3N1cCcsICd0YWJsZScsICd0Ym9keScsICd0ZCcsICd0ZW1wbGF0ZScsICd0ZXh0YXJlYScsICd0Zm9vdCcsICd0aCcsICd0aGVhZCcsICd0aW1lJywgJ3RyJywgJ3RyYWNrJywgJ3R0JywgJ3UnLCAndWwnLCAndmFyJywgJ3ZpZGVvJywgJ3diciddKTtcbmNvbnN0IHN2ZyQxID0gZnJlZXplKFsnc3ZnJywgJ2EnLCAnYWx0Z2x5cGgnLCAnYWx0Z2x5cGhkZWYnLCAnYWx0Z2x5cGhpdGVtJywgJ2FuaW1hdGVjb2xvcicsICdhbmltYXRlbW90aW9uJywgJ2FuaW1hdGV0cmFuc2Zvcm0nLCAnY2lyY2xlJywgJ2NsaXBwYXRoJywgJ2RlZnMnLCAnZGVzYycsICdlbGxpcHNlJywgJ2VudGVya2V5aGludCcsICdleHBvcnRwYXJ0cycsICdmaWx0ZXInLCAnZm9udCcsICdnJywgJ2dseXBoJywgJ2dseXBocmVmJywgJ2hrZXJuJywgJ2ltYWdlJywgJ2lucHV0bW9kZScsICdsaW5lJywgJ2xpbmVhcmdyYWRpZW50JywgJ21hcmtlcicsICdtYXNrJywgJ21ldGFkYXRhJywgJ21wYXRoJywgJ3BhcnQnLCAncGF0aCcsICdwYXR0ZXJuJywgJ3BvbHlnb24nLCAncG9seWxpbmUnLCAncmFkaWFsZ3JhZGllbnQnLCAncmVjdCcsICdzdG9wJywgJ3N0eWxlJywgJ3N3aXRjaCcsICdzeW1ib2wnLCAndGV4dCcsICd0ZXh0cGF0aCcsICd0aXRsZScsICd0cmVmJywgJ3RzcGFuJywgJ3ZpZXcnLCAndmtlcm4nXSk7XG5jb25zdCBzdmdGaWx0ZXJzID0gZnJlZXplKFsnZmVCbGVuZCcsICdmZUNvbG9yTWF0cml4JywgJ2ZlQ29tcG9uZW50VHJhbnNmZXInLCAnZmVDb21wb3NpdGUnLCAnZmVDb252b2x2ZU1hdHJpeCcsICdmZURpZmZ1c2VMaWdodGluZycsICdmZURpc3BsYWNlbWVudE1hcCcsICdmZURpc3RhbnRMaWdodCcsICdmZURyb3BTaGFkb3cnLCAnZmVGbG9vZCcsICdmZUZ1bmNBJywgJ2ZlRnVuY0InLCAnZmVGdW5jRycsICdmZUZ1bmNSJywgJ2ZlR2F1c3NpYW5CbHVyJywgJ2ZlSW1hZ2UnLCAnZmVNZXJnZScsICdmZU1lcmdlTm9kZScsICdmZU1vcnBob2xvZ3knLCAnZmVPZmZzZXQnLCAnZmVQb2ludExpZ2h0JywgJ2ZlU3BlY3VsYXJMaWdodGluZycsICdmZVNwb3RMaWdodCcsICdmZVRpbGUnLCAnZmVUdXJidWxlbmNlJ10pO1xuLy8gTGlzdCBvZiBTVkcgZWxlbWVudHMgdGhhdCBhcmUgZGlzYWxsb3dlZCBieSBkZWZhdWx0LlxuLy8gV2Ugc3RpbGwgbmVlZCB0byBrbm93IHRoZW0gc28gdGhhdCB3ZSBjYW4gZG8gbmFtZXNwYWNlXG4vLyBjaGVja3MgcHJvcGVybHkgaW4gY2FzZSBvbmUgd2FudHMgdG8gYWRkIHRoZW0gdG9cbi8vIGFsbG93LWxpc3QuXG5jb25zdCBzdmdEaXNhbGxvd2VkID0gZnJlZXplKFsnYW5pbWF0ZScsICdjb2xvci1wcm9maWxlJywgJ2N1cnNvcicsICdkaXNjYXJkJywgJ2ZvbnQtZmFjZScsICdmb250LWZhY2UtZm9ybWF0JywgJ2ZvbnQtZmFjZS1uYW1lJywgJ2ZvbnQtZmFjZS1zcmMnLCAnZm9udC1mYWNlLXVyaScsICdmb3JlaWdub2JqZWN0JywgJ2hhdGNoJywgJ2hhdGNocGF0aCcsICdtZXNoJywgJ21lc2hncmFkaWVudCcsICdtZXNocGF0Y2gnLCAnbWVzaHJvdycsICdtaXNzaW5nLWdseXBoJywgJ3NjcmlwdCcsICdzZXQnLCAnc29saWRjb2xvcicsICd1bmtub3duJywgJ3VzZSddKTtcbmNvbnN0IG1hdGhNbCQxID0gZnJlZXplKFsnbWF0aCcsICdtZW5jbG9zZScsICdtZXJyb3InLCAnbWZlbmNlZCcsICdtZnJhYycsICdtZ2x5cGgnLCAnbWknLCAnbWxhYmVsZWR0cicsICdtbXVsdGlzY3JpcHRzJywgJ21uJywgJ21vJywgJ21vdmVyJywgJ21wYWRkZWQnLCAnbXBoYW50b20nLCAnbXJvb3QnLCAnbXJvdycsICdtcycsICdtc3BhY2UnLCAnbXNxcnQnLCAnbXN0eWxlJywgJ21zdWInLCAnbXN1cCcsICdtc3Vic3VwJywgJ210YWJsZScsICdtdGQnLCAnbXRleHQnLCAnbXRyJywgJ211bmRlcicsICdtdW5kZXJvdmVyJywgJ21wcmVzY3JpcHRzJ10pO1xuLy8gU2ltaWxhcmx5IHRvIFNWRywgd2Ugd2FudCB0byBrbm93IGFsbCBNYXRoTUwgZWxlbWVudHMsXG4vLyBldmVuIHRob3NlIHRoYXQgd2UgZGlzYWxsb3cgYnkgZGVmYXVsdC5cbmNvbnN0IG1hdGhNbERpc2FsbG93ZWQgPSBmcmVlemUoWydtYWN0aW9uJywgJ21hbGlnbmdyb3VwJywgJ21hbGlnbm1hcmsnLCAnbWxvbmdkaXYnLCAnbXNjYXJyaWVzJywgJ21zY2FycnknLCAnbXNncm91cCcsICdtc3RhY2snLCAnbXNsaW5lJywgJ21zcm93JywgJ3NlbWFudGljcycsICdhbm5vdGF0aW9uJywgJ2Fubm90YXRpb24teG1sJywgJ21wcmVzY3JpcHRzJywgJ25vbmUnXSk7XG5jb25zdCB0ZXh0ID0gZnJlZXplKFsnI3RleHQnXSk7XG5cbmNvbnN0IGh0bWwgPSBmcmVlemUoWydhY2NlcHQnLCAnYWN0aW9uJywgJ2FsaWduJywgJ2FsdCcsICdhdXRvY2FwaXRhbGl6ZScsICdhdXRvY29tcGxldGUnLCAnYXV0b3BpY3R1cmVpbnBpY3R1cmUnLCAnYXV0b3BsYXknLCAnYmFja2dyb3VuZCcsICdiZ2NvbG9yJywgJ2JvcmRlcicsICdjYXB0dXJlJywgJ2NlbGxwYWRkaW5nJywgJ2NlbGxzcGFjaW5nJywgJ2NoZWNrZWQnLCAnY2l0ZScsICdjbGFzcycsICdjbGVhcicsICdjb2xvcicsICdjb2xzJywgJ2NvbHNwYW4nLCAnY29udHJvbHMnLCAnY29udHJvbHNsaXN0JywgJ2Nvb3JkcycsICdjcm9zc29yaWdpbicsICdkYXRldGltZScsICdkZWNvZGluZycsICdkZWZhdWx0JywgJ2RpcicsICdkaXNhYmxlZCcsICdkaXNhYmxlcGljdHVyZWlucGljdHVyZScsICdkaXNhYmxlcmVtb3RlcGxheWJhY2snLCAnZG93bmxvYWQnLCAnZHJhZ2dhYmxlJywgJ2VuY3R5cGUnLCAnZW50ZXJrZXloaW50JywgJ2V4cG9ydHBhcnRzJywgJ2ZhY2UnLCAnZm9yJywgJ2hlYWRlcnMnLCAnaGVpZ2h0JywgJ2hpZGRlbicsICdoaWdoJywgJ2hyZWYnLCAnaHJlZmxhbmcnLCAnaWQnLCAnaW5lcnQnLCAnaW5wdXRtb2RlJywgJ2ludGVncml0eScsICdpc21hcCcsICdraW5kJywgJ2xhYmVsJywgJ2xhbmcnLCAnbGlzdCcsICdsb2FkaW5nJywgJ2xvb3AnLCAnbG93JywgJ21heCcsICdtYXhsZW5ndGgnLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21pbicsICdtaW5sZW5ndGgnLCAnbXVsdGlwbGUnLCAnbXV0ZWQnLCAnbmFtZScsICdub25jZScsICdub3NoYWRlJywgJ25vdmFsaWRhdGUnLCAnbm93cmFwJywgJ29wZW4nLCAnb3B0aW11bScsICdwYXJ0JywgJ3BhdHRlcm4nLCAncGxhY2Vob2xkZXInLCAncGxheXNpbmxpbmUnLCAncG9wb3ZlcicsICdwb3BvdmVydGFyZ2V0JywgJ3BvcG92ZXJ0YXJnZXRhY3Rpb24nLCAncG9zdGVyJywgJ3ByZWxvYWQnLCAncHViZGF0ZScsICdyYWRpb2dyb3VwJywgJ3JlYWRvbmx5JywgJ3JlbCcsICdyZXF1aXJlZCcsICdyZXYnLCAncmV2ZXJzZWQnLCAncm9sZScsICdyb3dzJywgJ3Jvd3NwYW4nLCAnc3BlbGxjaGVjaycsICdzY29wZScsICdzZWxlY3RlZCcsICdzaGFwZScsICdzaXplJywgJ3NpemVzJywgJ3Nsb3QnLCAnc3BhbicsICdzcmNsYW5nJywgJ3N0YXJ0JywgJ3NyYycsICdzcmNzZXQnLCAnc3RlcCcsICdzdHlsZScsICdzdW1tYXJ5JywgJ3RhYmluZGV4JywgJ3RpdGxlJywgJ3RyYW5zbGF0ZScsICd0eXBlJywgJ3VzZW1hcCcsICd2YWxpZ24nLCAndmFsdWUnLCAnd2lkdGgnLCAnd3JhcCcsICd4bWxucycsICdzbG90J10pO1xuY29uc3Qgc3ZnID0gZnJlZXplKFsnYWNjZW50LWhlaWdodCcsICdhY2N1bXVsYXRlJywgJ2FkZGl0aXZlJywgJ2FsaWdubWVudC1iYXNlbGluZScsICdhbXBsaXR1ZGUnLCAnYXNjZW50JywgJ2F0dHJpYnV0ZW5hbWUnLCAnYXR0cmlidXRldHlwZScsICdhemltdXRoJywgJ2Jhc2VmcmVxdWVuY3knLCAnYmFzZWxpbmUtc2hpZnQnLCAnYmVnaW4nLCAnYmlhcycsICdieScsICdjbGFzcycsICdjbGlwJywgJ2NsaXBwYXRodW5pdHMnLCAnY2xpcC1wYXRoJywgJ2NsaXAtcnVsZScsICdjb2xvcicsICdjb2xvci1pbnRlcnBvbGF0aW9uJywgJ2NvbG9yLWludGVycG9sYXRpb24tZmlsdGVycycsICdjb2xvci1wcm9maWxlJywgJ2NvbG9yLXJlbmRlcmluZycsICdjeCcsICdjeScsICdkJywgJ2R4JywgJ2R5JywgJ2RpZmZ1c2Vjb25zdGFudCcsICdkaXJlY3Rpb24nLCAnZGlzcGxheScsICdkaXZpc29yJywgJ2R1cicsICdlZGdlbW9kZScsICdlbGV2YXRpb24nLCAnZW5kJywgJ2V4cG9uZW50JywgJ2ZpbGwnLCAnZmlsbC1vcGFjaXR5JywgJ2ZpbGwtcnVsZScsICdmaWx0ZXInLCAnZmlsdGVydW5pdHMnLCAnZmxvb2QtY29sb3InLCAnZmxvb2Qtb3BhY2l0eScsICdmb250LWZhbWlseScsICdmb250LXNpemUnLCAnZm9udC1zaXplLWFkanVzdCcsICdmb250LXN0cmV0Y2gnLCAnZm9udC1zdHlsZScsICdmb250LXZhcmlhbnQnLCAnZm9udC13ZWlnaHQnLCAnZngnLCAnZnknLCAnZzEnLCAnZzInLCAnZ2x5cGgtbmFtZScsICdnbHlwaHJlZicsICdncmFkaWVudHVuaXRzJywgJ2dyYWRpZW50dHJhbnNmb3JtJywgJ2hlaWdodCcsICdocmVmJywgJ2lkJywgJ2ltYWdlLXJlbmRlcmluZycsICdpbicsICdpbjInLCAnaW50ZXJjZXB0JywgJ2snLCAnazEnLCAnazInLCAnazMnLCAnazQnLCAna2VybmluZycsICdrZXlwb2ludHMnLCAna2V5c3BsaW5lcycsICdrZXl0aW1lcycsICdsYW5nJywgJ2xlbmd0aGFkanVzdCcsICdsZXR0ZXItc3BhY2luZycsICdrZXJuZWxtYXRyaXgnLCAna2VybmVsdW5pdGxlbmd0aCcsICdsaWdodGluZy1jb2xvcicsICdsb2NhbCcsICdtYXJrZXItZW5kJywgJ21hcmtlci1taWQnLCAnbWFya2VyLXN0YXJ0JywgJ21hcmtlcmhlaWdodCcsICdtYXJrZXJ1bml0cycsICdtYXJrZXJ3aWR0aCcsICdtYXNrY29udGVudHVuaXRzJywgJ21hc2t1bml0cycsICdtYXgnLCAnbWFzaycsICdtYXNrLXR5cGUnLCAnbWVkaWEnLCAnbWV0aG9kJywgJ21vZGUnLCAnbWluJywgJ25hbWUnLCAnbnVtb2N0YXZlcycsICdvZmZzZXQnLCAnb3BlcmF0b3InLCAnb3BhY2l0eScsICdvcmRlcicsICdvcmllbnQnLCAnb3JpZW50YXRpb24nLCAnb3JpZ2luJywgJ292ZXJmbG93JywgJ3BhaW50LW9yZGVyJywgJ3BhdGgnLCAncGF0aGxlbmd0aCcsICdwYXR0ZXJuY29udGVudHVuaXRzJywgJ3BhdHRlcm50cmFuc2Zvcm0nLCAncGF0dGVybnVuaXRzJywgJ3BvaW50cycsICdwcmVzZXJ2ZWFscGhhJywgJ3ByZXNlcnZlYXNwZWN0cmF0aW8nLCAncHJpbWl0aXZldW5pdHMnLCAncicsICdyeCcsICdyeScsICdyYWRpdXMnLCAncmVmeCcsICdyZWZ5JywgJ3JlcGVhdGNvdW50JywgJ3JlcGVhdGR1cicsICdyZXN0YXJ0JywgJ3Jlc3VsdCcsICdyb3RhdGUnLCAnc2NhbGUnLCAnc2VlZCcsICdzaGFwZS1yZW5kZXJpbmcnLCAnc2xvcGUnLCAnc3BlY3VsYXJjb25zdGFudCcsICdzcGVjdWxhcmV4cG9uZW50JywgJ3NwcmVhZG1ldGhvZCcsICdzdGFydG9mZnNldCcsICdzdGRkZXZpYXRpb24nLCAnc3RpdGNodGlsZXMnLCAnc3RvcC1jb2xvcicsICdzdG9wLW9wYWNpdHknLCAnc3Ryb2tlLWRhc2hhcnJheScsICdzdHJva2UtZGFzaG9mZnNldCcsICdzdHJva2UtbGluZWNhcCcsICdzdHJva2UtbGluZWpvaW4nLCAnc3Ryb2tlLW1pdGVybGltaXQnLCAnc3Ryb2tlLW9wYWNpdHknLCAnc3Ryb2tlJywgJ3N0cm9rZS13aWR0aCcsICdzdHlsZScsICdzdXJmYWNlc2NhbGUnLCAnc3lzdGVtbGFuZ3VhZ2UnLCAndGFiaW5kZXgnLCAndGFibGV2YWx1ZXMnLCAndGFyZ2V0eCcsICd0YXJnZXR5JywgJ3RyYW5zZm9ybScsICd0cmFuc2Zvcm0tb3JpZ2luJywgJ3RleHQtYW5jaG9yJywgJ3RleHQtZGVjb3JhdGlvbicsICd0ZXh0LXJlbmRlcmluZycsICd0ZXh0bGVuZ3RoJywgJ3R5cGUnLCAndTEnLCAndTInLCAndW5pY29kZScsICd2YWx1ZXMnLCAndmlld2JveCcsICd2aXNpYmlsaXR5JywgJ3ZlcnNpb24nLCAndmVydC1hZHYteScsICd2ZXJ0LW9yaWdpbi14JywgJ3ZlcnQtb3JpZ2luLXknLCAnd2lkdGgnLCAnd29yZC1zcGFjaW5nJywgJ3dyYXAnLCAnd3JpdGluZy1tb2RlJywgJ3hjaGFubmVsc2VsZWN0b3InLCAneWNoYW5uZWxzZWxlY3RvcicsICd4JywgJ3gxJywgJ3gyJywgJ3htbG5zJywgJ3knLCAneTEnLCAneTInLCAneicsICd6b29tYW5kcGFuJ10pO1xuY29uc3QgbWF0aE1sID0gZnJlZXplKFsnYWNjZW50JywgJ2FjY2VudHVuZGVyJywgJ2FsaWduJywgJ2JldmVsbGVkJywgJ2Nsb3NlJywgJ2NvbHVtbnNhbGlnbicsICdjb2x1bW5saW5lcycsICdjb2x1bW5zcGFuJywgJ2Rlbm9tYWxpZ24nLCAnZGVwdGgnLCAnZGlyJywgJ2Rpc3BsYXknLCAnZGlzcGxheXN0eWxlJywgJ2VuY29kaW5nJywgJ2ZlbmNlJywgJ2ZyYW1lJywgJ2hlaWdodCcsICdocmVmJywgJ2lkJywgJ2xhcmdlb3AnLCAnbGVuZ3RoJywgJ2xpbmV0aGlja25lc3MnLCAnbHNwYWNlJywgJ2xxdW90ZScsICdtYXRoYmFja2dyb3VuZCcsICdtYXRoY29sb3InLCAnbWF0aHNpemUnLCAnbWF0aHZhcmlhbnQnLCAnbWF4c2l6ZScsICdtaW5zaXplJywgJ21vdmFibGVsaW1pdHMnLCAnbm90YXRpb24nLCAnbnVtYWxpZ24nLCAnb3BlbicsICdyb3dhbGlnbicsICdyb3dsaW5lcycsICdyb3dzcGFjaW5nJywgJ3Jvd3NwYW4nLCAncnNwYWNlJywgJ3JxdW90ZScsICdzY3JpcHRsZXZlbCcsICdzY3JpcHRtaW5zaXplJywgJ3NjcmlwdHNpemVtdWx0aXBsaWVyJywgJ3NlbGVjdGlvbicsICdzZXBhcmF0b3InLCAnc2VwYXJhdG9ycycsICdzdHJldGNoeScsICdzdWJzY3JpcHRzaGlmdCcsICdzdXBzY3JpcHRzaGlmdCcsICdzeW1tZXRyaWMnLCAndm9mZnNldCcsICd3aWR0aCcsICd4bWxucyddKTtcbmNvbnN0IHhtbCA9IGZyZWV6ZShbJ3hsaW5rOmhyZWYnLCAneG1sOmlkJywgJ3hsaW5rOnRpdGxlJywgJ3htbDpzcGFjZScsICd4bWxuczp4bGluayddKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vYmV0dGVyLXJlZ2V4XG5jb25zdCBNVVNUQUNIRV9FWFBSID0gc2VhbCgvXFx7XFx7W1xcd1xcV10qfFtcXHdcXFddKlxcfVxcfS9nbSk7IC8vIFNwZWNpZnkgdGVtcGxhdGUgZGV0ZWN0aW9uIHJlZ2V4IGZvciBTQUZFX0ZPUl9URU1QTEFURVMgbW9kZVxuY29uc3QgRVJCX0VYUFIgPSBzZWFsKC88JVtcXHdcXFddKnxbXFx3XFxXXSolPi9nbSk7XG5jb25zdCBUTVBMSVRfRVhQUiA9IHNlYWwoL1xcJFxce1tcXHdcXFddKi9nbSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgdW5pY29ybi9iZXR0ZXItcmVnZXhcbmNvbnN0IERBVEFfQVRUUiA9IHNlYWwoL15kYXRhLVtcXC1cXHcuXFx1MDBCNy1cXHVGRkZGXSskLyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbmNvbnN0IEFSSUFfQVRUUiA9IHNlYWwoL15hcmlhLVtcXC1cXHddKyQvKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuY29uc3QgSVNfQUxMT1dFRF9VUkkgPSBzZWFsKC9eKD86KD86KD86ZnxodCl0cHM/fG1haWx0b3x0ZWx8Y2FsbHRvfHNtc3xjaWR8eG1wcHxtYXRyaXgpOnxbXmEtel18W2EteisuXFwtXSsoPzpbXmEteisuXFwtOl18JCkpL2kgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuKTtcbmNvbnN0IElTX1NDUklQVF9PUl9EQVRBID0gc2VhbCgvXig/OlxcdytzY3JpcHR8ZGF0YSk6L2kpO1xuY29uc3QgQVRUUl9XSElURVNQQUNFID0gc2VhbCgvW1xcdTAwMDAtXFx1MDAyMFxcdTAwQTBcXHUxNjgwXFx1MTgwRVxcdTIwMDAtXFx1MjAyOVxcdTIwNUZcXHUzMDAwXS9nIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29udHJvbC1yZWdleFxuKTtcbmNvbnN0IERPQ1RZUEVfTkFNRSA9IHNlYWwoL15odG1sJC9pKTtcbmNvbnN0IENVU1RPTV9FTEVNRU5UID0gc2VhbCgvXlthLXpdWy5cXHddKigtWy5cXHddKykrJC9pKTtcblxudmFyIEVYUFJFU1NJT05TID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIEFSSUFfQVRUUjogQVJJQV9BVFRSLFxuICBBVFRSX1dISVRFU1BBQ0U6IEFUVFJfV0hJVEVTUEFDRSxcbiAgQ1VTVE9NX0VMRU1FTlQ6IENVU1RPTV9FTEVNRU5ULFxuICBEQVRBX0FUVFI6IERBVEFfQVRUUixcbiAgRE9DVFlQRV9OQU1FOiBET0NUWVBFX05BTUUsXG4gIEVSQl9FWFBSOiBFUkJfRVhQUixcbiAgSVNfQUxMT1dFRF9VUkk6IElTX0FMTE9XRURfVVJJLFxuICBJU19TQ1JJUFRfT1JfREFUQTogSVNfU0NSSVBUX09SX0RBVEEsXG4gIE1VU1RBQ0hFX0VYUFI6IE1VU1RBQ0hFX0VYUFIsXG4gIFRNUExJVF9FWFBSOiBUTVBMSVRfRVhQUlxufSk7XG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9pbmRlbnQgKi9cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL25vZGVUeXBlXG5jb25zdCBOT0RFX1RZUEUgPSB7XG4gIGVsZW1lbnQ6IDEsXG4gIGF0dHJpYnV0ZTogMixcbiAgdGV4dDogMyxcbiAgY2RhdGFTZWN0aW9uOiA0LFxuICBlbnRpdHlSZWZlcmVuY2U6IDUsXG4gIC8vIERlcHJlY2F0ZWRcbiAgZW50aXR5Tm9kZTogNixcbiAgLy8gRGVwcmVjYXRlZFxuICBwcm9ncmVzc2luZ0luc3RydWN0aW9uOiA3LFxuICBjb21tZW50OiA4LFxuICBkb2N1bWVudDogOSxcbiAgZG9jdW1lbnRUeXBlOiAxMCxcbiAgZG9jdW1lbnRGcmFnbWVudDogMTEsXG4gIG5vdGF0aW9uOiAxMiAvLyBEZXByZWNhdGVkXG59O1xuY29uc3QgZ2V0R2xvYmFsID0gZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogd2luZG93O1xufTtcbi8qKlxuICogQ3JlYXRlcyBhIG5vLW9wIHBvbGljeSBmb3IgaW50ZXJuYWwgdXNlIG9ubHkuXG4gKiBEb24ndCBleHBvcnQgdGhpcyBmdW5jdGlvbiBvdXRzaWRlIHRoaXMgbW9kdWxlIVxuICogQHBhcmFtIHRydXN0ZWRUeXBlcyBUaGUgcG9saWN5IGZhY3RvcnkuXG4gKiBAcGFyYW0gcHVyaWZ5SG9zdEVsZW1lbnQgVGhlIFNjcmlwdCBlbGVtZW50IHVzZWQgdG8gbG9hZCBET01QdXJpZnkgKHRvIGRldGVybWluZSBwb2xpY3kgbmFtZSBzdWZmaXgpLlxuICogQHJldHVybiBUaGUgcG9saWN5IGNyZWF0ZWQgKG9yIG51bGwsIGlmIFRydXN0ZWQgVHlwZXNcbiAqIGFyZSBub3Qgc3VwcG9ydGVkIG9yIGNyZWF0aW5nIHRoZSBwb2xpY3kgZmFpbGVkKS5cbiAqL1xuY29uc3QgX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSA9IGZ1bmN0aW9uIF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBwdXJpZnlIb3N0RWxlbWVudCkge1xuICBpZiAodHlwZW9mIHRydXN0ZWRUeXBlcyAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBBbGxvdyB0aGUgY2FsbGVycyB0byBjb250cm9sIHRoZSB1bmlxdWUgcG9saWN5IG5hbWVcbiAgLy8gYnkgYWRkaW5nIGEgZGF0YS10dC1wb2xpY3ktc3VmZml4IHRvIHRoZSBzY3JpcHQgZWxlbWVudCB3aXRoIHRoZSBET01QdXJpZnkuXG4gIC8vIFBvbGljeSBjcmVhdGlvbiB3aXRoIGR1cGxpY2F0ZSBuYW1lcyB0aHJvd3MgaW4gVHJ1c3RlZCBUeXBlcy5cbiAgbGV0IHN1ZmZpeCA9IG51bGw7XG4gIGNvbnN0IEFUVFJfTkFNRSA9ICdkYXRhLXR0LXBvbGljeS1zdWZmaXgnO1xuICBpZiAocHVyaWZ5SG9zdEVsZW1lbnQgJiYgcHVyaWZ5SG9zdEVsZW1lbnQuaGFzQXR0cmlidXRlKEFUVFJfTkFNRSkpIHtcbiAgICBzdWZmaXggPSBwdXJpZnlIb3N0RWxlbWVudC5nZXRBdHRyaWJ1dGUoQVRUUl9OQU1FKTtcbiAgfVxuICBjb25zdCBwb2xpY3lOYW1lID0gJ2RvbXB1cmlmeScgKyAoc3VmZml4ID8gJyMnICsgc3VmZml4IDogJycpO1xuICB0cnkge1xuICAgIHJldHVybiB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5KHBvbGljeU5hbWUsIHtcbiAgICAgIGNyZWF0ZUhUTUwoaHRtbCkge1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVTY3JpcHRVUkwoc2NyaXB0VXJsKSB7XG4gICAgICAgIHJldHVybiBzY3JpcHRVcmw7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKF8pIHtcbiAgICAvLyBQb2xpY3kgY3JlYXRpb24gZmFpbGVkIChtb3N0IGxpa2VseSBhbm90aGVyIERPTVB1cmlmeSBzY3JpcHQgaGFzXG4gICAgLy8gYWxyZWFkeSBydW4pLiBTa2lwIGNyZWF0aW5nIHRoZSBwb2xpY3ksIGFzIHRoaXMgd2lsbCBvbmx5IGNhdXNlIGVycm9yc1xuICAgIC8vIGlmIFRUIGFyZSBlbmZvcmNlZC5cbiAgICBjb25zb2xlLndhcm4oJ1RydXN0ZWRUeXBlcyBwb2xpY3kgJyArIHBvbGljeU5hbWUgKyAnIGNvdWxkIG5vdCBiZSBjcmVhdGVkLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuY29uc3QgX2NyZWF0ZUhvb2tzTWFwID0gZnVuY3Rpb24gX2NyZWF0ZUhvb2tzTWFwKCkge1xuICByZXR1cm4ge1xuICAgIGFmdGVyU2FuaXRpemVBdHRyaWJ1dGVzOiBbXSxcbiAgICBhZnRlclNhbml0aXplRWxlbWVudHM6IFtdLFxuICAgIGFmdGVyU2FuaXRpemVTaGFkb3dET006IFtdLFxuICAgIGJlZm9yZVNhbml0aXplQXR0cmlidXRlczogW10sXG4gICAgYmVmb3JlU2FuaXRpemVFbGVtZW50czogW10sXG4gICAgYmVmb3JlU2FuaXRpemVTaGFkb3dET006IFtdLFxuICAgIHVwb25TYW5pdGl6ZUF0dHJpYnV0ZTogW10sXG4gICAgdXBvblNhbml0aXplRWxlbWVudDogW10sXG4gICAgdXBvblNhbml0aXplU2hhZG93Tm9kZTogW11cbiAgfTtcbn07XG5mdW5jdGlvbiBjcmVhdGVET01QdXJpZnkoKSB7XG4gIGxldCB3aW5kb3cgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGdldEdsb2JhbCgpO1xuICBjb25zdCBET01QdXJpZnkgPSByb290ID0+IGNyZWF0ZURPTVB1cmlmeShyb290KTtcbiAgRE9NUHVyaWZ5LnZlcnNpb24gPSAnMy4zLjEnO1xuICBET01QdXJpZnkucmVtb3ZlZCA9IFtdO1xuICBpZiAoIXdpbmRvdyB8fCAhd2luZG93LmRvY3VtZW50IHx8IHdpbmRvdy5kb2N1bWVudC5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLmRvY3VtZW50IHx8ICF3aW5kb3cuRWxlbWVudCkge1xuICAgIC8vIE5vdCBydW5uaW5nIGluIGEgYnJvd3NlciwgcHJvdmlkZSBhIGZhY3RvcnkgZnVuY3Rpb25cbiAgICAvLyBzbyB0aGF0IHlvdSBjYW4gcGFzcyB5b3VyIG93biBXaW5kb3dcbiAgICBET01QdXJpZnkuaXNTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gRE9NUHVyaWZ5O1xuICB9XG4gIGxldCB7XG4gICAgZG9jdW1lbnRcbiAgfSA9IHdpbmRvdztcbiAgY29uc3Qgb3JpZ2luYWxEb2N1bWVudCA9IGRvY3VtZW50O1xuICBjb25zdCBjdXJyZW50U2NyaXB0ID0gb3JpZ2luYWxEb2N1bWVudC5jdXJyZW50U2NyaXB0O1xuICBjb25zdCB7XG4gICAgRG9jdW1lbnRGcmFnbWVudCxcbiAgICBIVE1MVGVtcGxhdGVFbGVtZW50LFxuICAgIE5vZGUsXG4gICAgRWxlbWVudCxcbiAgICBOb2RlRmlsdGVyLFxuICAgIE5hbWVkTm9kZU1hcCA9IHdpbmRvdy5OYW1lZE5vZGVNYXAgfHwgd2luZG93Lk1vek5hbWVkQXR0ck1hcCxcbiAgICBIVE1MRm9ybUVsZW1lbnQsXG4gICAgRE9NUGFyc2VyLFxuICAgIHRydXN0ZWRUeXBlc1xuICB9ID0gd2luZG93O1xuICBjb25zdCBFbGVtZW50UHJvdG90eXBlID0gRWxlbWVudC5wcm90b3R5cGU7XG4gIGNvbnN0IGNsb25lTm9kZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnY2xvbmVOb2RlJyk7XG4gIGNvbnN0IHJlbW92ZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAncmVtb3ZlJyk7XG4gIGNvbnN0IGdldE5leHRTaWJsaW5nID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICduZXh0U2libGluZycpO1xuICBjb25zdCBnZXRDaGlsZE5vZGVzID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjaGlsZE5vZGVzJyk7XG4gIGNvbnN0IGdldFBhcmVudE5vZGUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ3BhcmVudE5vZGUnKTtcbiAgLy8gQXMgcGVyIGlzc3VlICM0NywgdGhlIHdlYi1jb21wb25lbnRzIHJlZ2lzdHJ5IGlzIGluaGVyaXRlZCBieSBhXG4gIC8vIG5ldyBkb2N1bWVudCBjcmVhdGVkIHZpYSBjcmVhdGVIVE1MRG9jdW1lbnQuIEFzIHBlciB0aGUgc3BlY1xuICAvLyAoaHR0cDovL3czYy5naXRodWIuaW8vd2ViY29tcG9uZW50cy9zcGVjL2N1c3RvbS8jY3JlYXRpbmctYW5kLXBhc3NpbmctcmVnaXN0cmllcylcbiAgLy8gYSBuZXcgZW1wdHkgcmVnaXN0cnkgaXMgdXNlZCB3aGVuIGNyZWF0aW5nIGEgdGVtcGxhdGUgY29udGVudHMgb3duZXJcbiAgLy8gZG9jdW1lbnQsIHNvIHdlIHVzZSB0aGF0IGFzIG91ciBwYXJlbnQgZG9jdW1lbnQgdG8gZW5zdXJlIG5vdGhpbmdcbiAgLy8gaXMgaW5oZXJpdGVkLlxuICBpZiAodHlwZW9mIEhUTUxUZW1wbGF0ZUVsZW1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgaWYgKHRlbXBsYXRlLmNvbnRlbnQgJiYgdGVtcGxhdGUuY29udGVudC5vd25lckRvY3VtZW50KSB7XG4gICAgICBkb2N1bWVudCA9IHRlbXBsYXRlLmNvbnRlbnQub3duZXJEb2N1bWVudDtcbiAgICB9XG4gIH1cbiAgbGV0IHRydXN0ZWRUeXBlc1BvbGljeTtcbiAgbGV0IGVtcHR5SFRNTCA9ICcnO1xuICBjb25zdCB7XG4gICAgaW1wbGVtZW50YXRpb24sXG4gICAgY3JlYXRlTm9kZUl0ZXJhdG9yLFxuICAgIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQsXG4gICAgZ2V0RWxlbWVudHNCeVRhZ05hbWVcbiAgfSA9IGRvY3VtZW50O1xuICBjb25zdCB7XG4gICAgaW1wb3J0Tm9kZVxuICB9ID0gb3JpZ2luYWxEb2N1bWVudDtcbiAgbGV0IGhvb2tzID0gX2NyZWF0ZUhvb2tzTWFwKCk7XG4gIC8qKlxuICAgKiBFeHBvc2Ugd2hldGhlciB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgcnVubmluZyB0aGUgZnVsbCBET01QdXJpZnkuXG4gICAqL1xuICBET01QdXJpZnkuaXNTdXBwb3J0ZWQgPSB0eXBlb2YgZW50cmllcyA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZ2V0UGFyZW50Tm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpbXBsZW1lbnRhdGlvbiAmJiBpbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQgIT09IHVuZGVmaW5lZDtcbiAgY29uc3Qge1xuICAgIE1VU1RBQ0hFX0VYUFIsXG4gICAgRVJCX0VYUFIsXG4gICAgVE1QTElUX0VYUFIsXG4gICAgREFUQV9BVFRSLFxuICAgIEFSSUFfQVRUUixcbiAgICBJU19TQ1JJUFRfT1JfREFUQSxcbiAgICBBVFRSX1dISVRFU1BBQ0UsXG4gICAgQ1VTVE9NX0VMRU1FTlRcbiAgfSA9IEVYUFJFU1NJT05TO1xuICBsZXQge1xuICAgIElTX0FMTE9XRURfVVJJOiBJU19BTExPV0VEX1VSSSQxXG4gIH0gPSBFWFBSRVNTSU9OUztcbiAgLyoqXG4gICAqIFdlIGNvbnNpZGVyIHRoZSBlbGVtZW50cyBhbmQgYXR0cmlidXRlcyBiZWxvdyB0byBiZSBzYWZlLiBJZGVhbGx5XG4gICAqIGRvbid0IGFkZCBhbnkgbmV3IG9uZXMgYnV0IGZlZWwgZnJlZSB0byByZW1vdmUgdW53YW50ZWQgb25lcy5cbiAgICovXG4gIC8qIGFsbG93ZWQgZWxlbWVudCBuYW1lcyAqL1xuICBsZXQgQUxMT1dFRF9UQUdTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9BTExPV0VEX1RBR1MgPSBhZGRUb1NldCh7fSwgWy4uLmh0bWwkMSwgLi4uc3ZnJDEsIC4uLnN2Z0ZpbHRlcnMsIC4uLm1hdGhNbCQxLCAuLi50ZXh0XSk7XG4gIC8qIEFsbG93ZWQgYXR0cmlidXRlIG5hbWVzICovXG4gIGxldCBBTExPV0VEX0FUVFIgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0FMTE9XRURfQVRUUiA9IGFkZFRvU2V0KHt9LCBbLi4uaHRtbCwgLi4uc3ZnLCAuLi5tYXRoTWwsIC4uLnhtbF0pO1xuICAvKlxuICAgKiBDb25maWd1cmUgaG93IERPTVB1cmlmeSBzaG91bGQgaGFuZGxlIGN1c3RvbSBlbGVtZW50cyBhbmQgdGhlaXIgYXR0cmlidXRlcyBhcyB3ZWxsIGFzIGN1c3RvbWl6ZWQgYnVpbHQtaW4gZWxlbWVudHMuXG4gICAqIEBwcm9wZXJ0eSB7UmVnRXhwfEZ1bmN0aW9ufG51bGx9IHRhZ05hbWVDaGVjayBvbmUgb2YgW251bGwsIHJlZ2V4UGF0dGVybiwgcHJlZGljYXRlXS4gRGVmYXVsdDogYG51bGxgIChkaXNhbGxvdyBhbnkgY3VzdG9tIGVsZW1lbnRzKVxuICAgKiBAcHJvcGVydHkge1JlZ0V4cHxGdW5jdGlvbnxudWxsfSBhdHRyaWJ1dGVOYW1lQ2hlY2sgb25lIG9mIFtudWxsLCByZWdleFBhdHRlcm4sIHByZWRpY2F0ZV0uIERlZmF1bHQ6IGBudWxsYCAoZGlzYWxsb3cgYW55IGF0dHJpYnV0ZXMgbm90IG9uIHRoZSBhbGxvdyBsaXN0KVxuICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IGFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyBhbGxvdyBjdXN0b20gZWxlbWVudHMgZGVyaXZlZCBmcm9tIGJ1aWx0LWlucyBpZiB0aGV5IHBhc3MgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLiBEZWZhdWx0OiBgZmFsc2VgLlxuICAgKi9cbiAgbGV0IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HID0gT2JqZWN0LnNlYWwoY3JlYXRlKG51bGwsIHtcbiAgICB0YWdOYW1lQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sXG4gICAgYXR0cmlidXRlTmFtZUNoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9LFxuICAgIGFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50czoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBmYWxzZVxuICAgIH1cbiAgfSkpO1xuICAvKiBFeHBsaWNpdGx5IGZvcmJpZGRlbiB0YWdzIChvdmVycmlkZXMgQUxMT1dFRF9UQUdTL0FERF9UQUdTKSAqL1xuICBsZXQgRk9SQklEX1RBR1MgPSBudWxsO1xuICAvKiBFeHBsaWNpdGx5IGZvcmJpZGRlbiBhdHRyaWJ1dGVzIChvdmVycmlkZXMgQUxMT1dFRF9BVFRSL0FERF9BVFRSKSAqL1xuICBsZXQgRk9SQklEX0FUVFIgPSBudWxsO1xuICAvKiBDb25maWcgb2JqZWN0IHRvIHN0b3JlIEFERF9UQUdTL0FERF9BVFRSIGZ1bmN0aW9ucyAod2hlbiB1c2VkIGFzIGZ1bmN0aW9ucykgKi9cbiAgY29uc3QgRVhUUkFfRUxFTUVOVF9IQU5ETElORyA9IE9iamVjdC5zZWFsKGNyZWF0ZShudWxsLCB7XG4gICAgdGFnQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sXG4gICAgYXR0cmlidXRlQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH1cbiAgfSkpO1xuICAvKiBEZWNpZGUgaWYgQVJJQSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gIGxldCBBTExPV19BUklBX0FUVFIgPSB0cnVlO1xuICAvKiBEZWNpZGUgaWYgY3VzdG9tIGRhdGEgYXR0cmlidXRlcyBhcmUgb2theSAqL1xuICBsZXQgQUxMT1dfREFUQV9BVFRSID0gdHJ1ZTtcbiAgLyogRGVjaWRlIGlmIHVua25vd24gcHJvdG9jb2xzIGFyZSBva2F5ICovXG4gIGxldCBBTExPV19VTktOT1dOX1BST1RPQ09MUyA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgc2VsZi1jbG9zaW5nIHRhZ3MgaW4gYXR0cmlidXRlcyBhcmUgYWxsb3dlZC5cbiAgICogVXN1YWxseSByZW1vdmVkIGR1ZSB0byBhIG1YU1MgaXNzdWUgaW4galF1ZXJ5IDMuMCAqL1xuICBsZXQgQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSID0gdHJ1ZTtcbiAgLyogT3V0cHV0IHNob3VsZCBiZSBzYWZlIGZvciBjb21tb24gdGVtcGxhdGUgZW5naW5lcy5cbiAgICogVGhpcyBtZWFucywgRE9NUHVyaWZ5IHJlbW92ZXMgZGF0YSBhdHRyaWJ1dGVzLCBtdXN0YWNoZXMgYW5kIEVSQlxuICAgKi9cbiAgbGV0IFNBRkVfRk9SX1RFTVBMQVRFUyA9IGZhbHNlO1xuICAvKiBPdXRwdXQgc2hvdWxkIGJlIHNhZmUgZXZlbiBmb3IgWE1MIHVzZWQgd2l0aGluIEhUTUwgYW5kIGFsaWtlLlxuICAgKiBUaGlzIG1lYW5zLCBET01QdXJpZnkgcmVtb3ZlcyBjb21tZW50cyB3aGVuIGNvbnRhaW5pbmcgcmlza3kgY29udGVudC5cbiAgICovXG4gIGxldCBTQUZFX0ZPUl9YTUwgPSB0cnVlO1xuICAvKiBEZWNpZGUgaWYgZG9jdW1lbnQgd2l0aCA8aHRtbD4uLi4gc2hvdWxkIGJlIHJldHVybmVkICovXG4gIGxldCBXSE9MRV9ET0NVTUVOVCA9IGZhbHNlO1xuICAvKiBUcmFjayB3aGV0aGVyIGNvbmZpZyBpcyBhbHJlYWR5IHNldCBvbiB0aGlzIGluc3RhbmNlIG9mIERPTVB1cmlmeS4gKi9cbiAgbGV0IFNFVF9DT05GSUcgPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIGFsbCBlbGVtZW50cyAoZS5nLiBzdHlsZSwgc2NyaXB0KSBtdXN0IGJlIGNoaWxkcmVuIG9mXG4gICAqIGRvY3VtZW50LmJvZHkuIEJ5IGRlZmF1bHQsIGJyb3dzZXJzIG1pZ2h0IG1vdmUgdGhlbSB0byBkb2N1bWVudC5oZWFkICovXG4gIGxldCBGT1JDRV9CT0RZID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBhIERPTSBgSFRNTEJvZHlFbGVtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAqIHN0cmluZyAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKS5cbiAgICogSWYgYFdIT0xFX0RPQ1VNRU5UYCBpcyBlbmFibGVkIGEgYEhUTUxIdG1sRWxlbWVudGAgd2lsbCBiZSByZXR1cm5lZCBpbnN0ZWFkXG4gICAqL1xuICBsZXQgUkVUVVJOX0RPTSA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgYSBET00gYERvY3VtZW50RnJhZ21lbnRgIHNob3VsZCBiZSByZXR1cm5lZCwgaW5zdGVhZCBvZiBhIGh0bWxcbiAgICogc3RyaW5nICAob3IgYSBUcnVzdGVkSFRNTCBvYmplY3QgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgc3VwcG9ydGVkKSAqL1xuICBsZXQgUkVUVVJOX0RPTV9GUkFHTUVOVCA9IGZhbHNlO1xuICAvKiBUcnkgdG8gcmV0dXJuIGEgVHJ1c3RlZCBUeXBlIG9iamVjdCBpbnN0ZWFkIG9mIGEgc3RyaW5nLCByZXR1cm4gYSBzdHJpbmcgaW5cbiAgICogY2FzZSBUcnVzdGVkIFR5cGVzIGFyZSBub3Qgc3VwcG9ydGVkICAqL1xuICBsZXQgUkVUVVJOX1RSVVNURURfVFlQRSA9IGZhbHNlO1xuICAvKiBPdXRwdXQgc2hvdWxkIGJlIGZyZWUgZnJvbSBET00gY2xvYmJlcmluZyBhdHRhY2tzP1xuICAgKiBUaGlzIHNhbml0aXplcyBtYXJrdXBzIG5hbWVkIHdpdGggY29sbGlkaW5nLCBjbG9iYmVyYWJsZSBidWlsdC1pbiBET00gQVBJcy5cbiAgICovXG4gIGxldCBTQU5JVElaRV9ET00gPSB0cnVlO1xuICAvKiBBY2hpZXZlIGZ1bGwgRE9NIENsb2JiZXJpbmcgcHJvdGVjdGlvbiBieSBpc29sYXRpbmcgdGhlIG5hbWVzcGFjZSBvZiBuYW1lZFxuICAgKiBwcm9wZXJ0aWVzIGFuZCBKUyB2YXJpYWJsZXMsIG1pdGlnYXRpbmcgYXR0YWNrcyB0aGF0IGFidXNlIHRoZSBIVE1ML0RPTSBzcGVjIHJ1bGVzLlxuICAgKlxuICAgKiBIVE1ML0RPTSBzcGVjIHJ1bGVzIHRoYXQgZW5hYmxlIERPTSBDbG9iYmVyaW5nOlxuICAgKiAgIC0gTmFtZWQgQWNjZXNzIG9uIFdpbmRvdyAowqc3LjMuMylcbiAgICogICAtIERPTSBUcmVlIEFjY2Vzc29ycyAowqczLjEuNSlcbiAgICogICAtIEZvcm0gRWxlbWVudCBQYXJlbnQtQ2hpbGQgUmVsYXRpb25zICjCpzQuMTAuMylcbiAgICogICAtIElmcmFtZSBzcmNkb2MgLyBOZXN0ZWQgV2luZG93UHJveGllcyAowqc0LjguNSlcbiAgICogICAtIEhUTUxDb2xsZWN0aW9uICjCpzQuMi4xMC4yKVxuICAgKlxuICAgKiBOYW1lc3BhY2UgaXNvbGF0aW9uIGlzIGltcGxlbWVudGVkIGJ5IHByZWZpeGluZyBgaWRgIGFuZCBgbmFtZWAgYXR0cmlidXRlc1xuICAgKiB3aXRoIGEgY29uc3RhbnQgc3RyaW5nLCBpLmUuLCBgdXNlci1jb250ZW50LWBcbiAgICovXG4gIGxldCBTQU5JVElaRV9OQU1FRF9QUk9QUyA9IGZhbHNlO1xuICBjb25zdCBTQU5JVElaRV9OQU1FRF9QUk9QU19QUkVGSVggPSAndXNlci1jb250ZW50LSc7XG4gIC8qIEtlZXAgZWxlbWVudCBjb250ZW50IHdoZW4gcmVtb3ZpbmcgZWxlbWVudD8gKi9cbiAgbGV0IEtFRVBfQ09OVEVOVCA9IHRydWU7XG4gIC8qIElmIGEgYE5vZGVgIGlzIHBhc3NlZCB0byBzYW5pdGl6ZSgpLCB0aGVuIHBlcmZvcm1zIHNhbml0aXphdGlvbiBpbi1wbGFjZSBpbnN0ZWFkXG4gICAqIG9mIGltcG9ydGluZyBpdCBpbnRvIGEgbmV3IERvY3VtZW50IGFuZCByZXR1cm5pbmcgYSBzYW5pdGl6ZWQgY29weSAqL1xuICBsZXQgSU5fUExBQ0UgPSBmYWxzZTtcbiAgLyogQWxsb3cgdXNhZ2Ugb2YgcHJvZmlsZXMgbGlrZSBodG1sLCBzdmcgYW5kIG1hdGhNbCAqL1xuICBsZXQgVVNFX1BST0ZJTEVTID0ge307XG4gIC8qIFRhZ3MgdG8gaWdub3JlIGNvbnRlbnQgb2Ygd2hlbiBLRUVQX0NPTlRFTlQgaXMgdHJ1ZSAqL1xuICBsZXQgRk9SQklEX0NPTlRFTlRTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9GT1JCSURfQ09OVEVOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCcsICdhdWRpbycsICdjb2xncm91cCcsICdkZXNjJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGVhZCcsICdpZnJhbWUnLCAnbWF0aCcsICdtaScsICdtbicsICdtbycsICdtcycsICdtdGV4dCcsICdub2VtYmVkJywgJ25vZnJhbWVzJywgJ25vc2NyaXB0JywgJ3BsYWludGV4dCcsICdzY3JpcHQnLCAnc3R5bGUnLCAnc3ZnJywgJ3RlbXBsYXRlJywgJ3RoZWFkJywgJ3RpdGxlJywgJ3ZpZGVvJywgJ3htcCddKTtcbiAgLyogVGFncyB0aGF0IGFyZSBzYWZlIGZvciBkYXRhOiBVUklzICovXG4gIGxldCBEQVRBX1VSSV9UQUdTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9EQVRBX1VSSV9UQUdTID0gYWRkVG9TZXQoe30sIFsnYXVkaW8nLCAndmlkZW8nLCAnaW1nJywgJ3NvdXJjZScsICdpbWFnZScsICd0cmFjayddKTtcbiAgLyogQXR0cmlidXRlcyBzYWZlIGZvciB2YWx1ZXMgbGlrZSBcImphdmFzY3JpcHQ6XCIgKi9cbiAgbGV0IFVSSV9TQUZFX0FUVFJJQlVURVMgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMgPSBhZGRUb1NldCh7fSwgWydhbHQnLCAnY2xhc3MnLCAnZm9yJywgJ2lkJywgJ2xhYmVsJywgJ25hbWUnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdyb2xlJywgJ3N1bW1hcnknLCAndGl0bGUnLCAndmFsdWUnLCAnc3R5bGUnLCAneG1sbnMnXSk7XG4gIGNvbnN0IE1BVEhNTF9OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTCc7XG4gIGNvbnN0IFNWR19OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICBjb25zdCBIVE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcbiAgLyogRG9jdW1lbnQgbmFtZXNwYWNlICovXG4gIGxldCBOQU1FU1BBQ0UgPSBIVE1MX05BTUVTUEFDRTtcbiAgbGV0IElTX0VNUFRZX0lOUFVUID0gZmFsc2U7XG4gIC8qIEFsbG93ZWQgWEhUTUwrWE1MIG5hbWVzcGFjZXMgKi9cbiAgbGV0IEFMTE9XRURfTkFNRVNQQUNFUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9OQU1FU1BBQ0VTID0gYWRkVG9TZXQoe30sIFtNQVRITUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFLCBIVE1MX05BTUVTUEFDRV0sIHN0cmluZ1RvU3RyaW5nKTtcbiAgbGV0IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGFkZFRvU2V0KHt9LCBbJ21pJywgJ21vJywgJ21uJywgJ21zJywgJ210ZXh0J10pO1xuICBsZXQgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFMgPSBhZGRUb1NldCh7fSwgWydhbm5vdGF0aW9uLXhtbCddKTtcbiAgLy8gQ2VydGFpbiBlbGVtZW50cyBhcmUgYWxsb3dlZCBpbiBib3RoIFNWRyBhbmQgSFRNTFxuICAvLyBuYW1lc3BhY2UuIFdlIG5lZWQgdG8gc3BlY2lmeSB0aGVtIGV4cGxpY2l0bHlcbiAgLy8gc28gdGhhdCB0aGV5IGRvbid0IGdldCBlcnJvbmVvdXNseSBkZWxldGVkIGZyb21cbiAgLy8gSFRNTCBuYW1lc3BhY2UuXG4gIGNvbnN0IENPTU1PTl9TVkdfQU5EX0hUTUxfRUxFTUVOVFMgPSBhZGRUb1NldCh7fSwgWyd0aXRsZScsICdzdHlsZScsICdmb250JywgJ2EnLCAnc2NyaXB0J10pO1xuICAvKiBQYXJzaW5nIG9mIHN0cmljdCBYSFRNTCBkb2N1bWVudHMgKi9cbiAgbGV0IFBBUlNFUl9NRURJQV9UWVBFID0gbnVsbDtcbiAgY29uc3QgU1VQUE9SVEVEX1BBUlNFUl9NRURJQV9UWVBFUyA9IFsnYXBwbGljYXRpb24veGh0bWwreG1sJywgJ3RleHQvaHRtbCddO1xuICBjb25zdCBERUZBVUxUX1BBUlNFUl9NRURJQV9UWVBFID0gJ3RleHQvaHRtbCc7XG4gIGxldCB0cmFuc2Zvcm1DYXNlRnVuYyA9IG51bGw7XG4gIC8qIEtlZXAgYSByZWZlcmVuY2UgdG8gY29uZmlnIHRvIHBhc3MgdG8gaG9va3MgKi9cbiAgbGV0IENPTkZJRyA9IG51bGw7XG4gIC8qIElkZWFsbHksIGRvIG5vdCB0b3VjaCBhbnl0aGluZyBiZWxvdyB0aGlzIGxpbmUgKi9cbiAgLyogX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyAqL1xuICBjb25zdCBmb3JtRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgY29uc3QgaXNSZWdleE9yRnVuY3Rpb24gPSBmdW5jdGlvbiBpc1JlZ2V4T3JGdW5jdGlvbih0ZXN0VmFsdWUpIHtcbiAgICByZXR1cm4gdGVzdFZhbHVlIGluc3RhbmNlb2YgUmVnRXhwIHx8IHRlc3RWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xuICB9O1xuICAvKipcbiAgICogX3BhcnNlQ29uZmlnXG4gICAqXG4gICAqIEBwYXJhbSBjZmcgb3B0aW9uYWwgY29uZmlnIGxpdGVyYWxcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIGNvbnN0IF9wYXJzZUNvbmZpZyA9IGZ1bmN0aW9uIF9wYXJzZUNvbmZpZygpIHtcbiAgICBsZXQgY2ZnID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBpZiAoQ09ORklHICYmIENPTkZJRyA9PT0gY2ZnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8qIFNoaWVsZCBjb25maWd1cmF0aW9uIG9iamVjdCBmcm9tIHRhbXBlcmluZyAqL1xuICAgIGlmICghY2ZnIHx8IHR5cGVvZiBjZmcgIT09ICdvYmplY3QnKSB7XG4gICAgICBjZmcgPSB7fTtcbiAgICB9XG4gICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gcHJvdG90eXBlIHBvbGx1dGlvbiAqL1xuICAgIGNmZyA9IGNsb25lKGNmZyk7XG4gICAgUEFSU0VSX01FRElBX1RZUEUgPVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1pbmNsdWRlc1xuICAgIFNVUFBPUlRFRF9QQVJTRVJfTUVESUFfVFlQRVMuaW5kZXhPZihjZmcuUEFSU0VSX01FRElBX1RZUEUpID09PSAtMSA/IERFRkFVTFRfUEFSU0VSX01FRElBX1RZUEUgOiBjZmcuUEFSU0VSX01FRElBX1RZUEU7XG4gICAgLy8gSFRNTCB0YWdzIGFuZCBhdHRyaWJ1dGVzIGFyZSBub3QgY2FzZS1zZW5zaXRpdmUsIGNvbnZlcnRpbmcgdG8gbG93ZXJjYXNlLiBLZWVwaW5nIFhIVE1MIGFzIGlzLlxuICAgIHRyYW5zZm9ybUNhc2VGdW5jID0gUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnID8gc3RyaW5nVG9TdHJpbmcgOiBzdHJpbmdUb0xvd2VyQ2FzZTtcbiAgICAvKiBTZXQgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzICovXG4gICAgQUxMT1dFRF9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9UQUdTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9BTExPV0VEX1RBR1M7XG4gICAgQUxMT1dFRF9BVFRSID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9BVFRSJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9BTExPV0VEX0FUVFI7XG4gICAgQUxMT1dFRF9OQU1FU1BBQ0VTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUxMT1dFRF9OQU1FU1BBQ0VTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkFMTE9XRURfTkFNRVNQQUNFUywgc3RyaW5nVG9TdHJpbmcpIDogREVGQVVMVF9BTExPV0VEX05BTUVTUEFDRVM7XG4gICAgVVJJX1NBRkVfQVRUUklCVVRFUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FERF9VUklfU0FGRV9BVFRSJykgPyBhZGRUb1NldChjbG9uZShERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVMpLCBjZmcuQUREX1VSSV9TQUZFX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUztcbiAgICBEQVRBX1VSSV9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUREX0RBVEFfVVJJX1RBR1MnKSA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfREFUQV9VUklfVEFHUyksIGNmZy5BRERfREFUQV9VUklfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9EQVRBX1VSSV9UQUdTO1xuICAgIEZPUkJJRF9DT05URU5UUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9DT05URU5UUycpID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfQ09OVEVOVFMsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTO1xuICAgIEZPUkJJRF9UQUdTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX1RBR1MnKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IGNsb25lKHt9KTtcbiAgICBGT1JCSURfQVRUUiA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9BVFRSJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBjbG9uZSh7fSk7XG4gICAgVVNFX1BST0ZJTEVTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnVVNFX1BST0ZJTEVTJykgPyBjZmcuVVNFX1BST0ZJTEVTIDogZmFsc2U7XG4gICAgQUxMT1dfQVJJQV9BVFRSID0gY2ZnLkFMTE9XX0FSSUFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIEFMTE9XX0RBVEFfQVRUUiA9IGNmZy5BTExPV19EQVRBX0FUVFIgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBBTExPV19VTktOT1dOX1BST1RPQ09MUyA9IGNmZy5BTExPV19VTktOT1dOX1BST1RPQ09MUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIEFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiA9IGNmZy5BTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBTQUZFX0ZPUl9URU1QTEFURVMgPSBjZmcuU0FGRV9GT1JfVEVNUExBVEVTIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgU0FGRV9GT1JfWE1MID0gY2ZnLlNBRkVfRk9SX1hNTCAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIFdIT0xFX0RPQ1VNRU5UID0gY2ZnLldIT0xFX0RPQ1VNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgUkVUVVJOX0RPTSA9IGNmZy5SRVRVUk5fRE9NIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgUkVUVVJOX0RPTV9GUkFHTUVOVCA9IGNmZy5SRVRVUk5fRE9NX0ZSQUdNRU5UIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgUkVUVVJOX1RSVVNURURfVFlQRSA9IGNmZy5SRVRVUk5fVFJVU1RFRF9UWVBFIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgRk9SQ0VfQk9EWSA9IGNmZy5GT1JDRV9CT0RZIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgU0FOSVRJWkVfRE9NID0gY2ZnLlNBTklUSVpFX0RPTSAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIFNBTklUSVpFX05BTUVEX1BST1BTID0gY2ZnLlNBTklUSVpFX05BTUVEX1BST1BTIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgS0VFUF9DT05URU5UID0gY2ZnLktFRVBfQ09OVEVOVCAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIElOX1BMQUNFID0gY2ZnLklOX1BMQUNFIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgSVNfQUxMT1dFRF9VUkkkMSA9IGNmZy5BTExPV0VEX1VSSV9SRUdFWFAgfHwgSVNfQUxMT1dFRF9VUkk7XG4gICAgTkFNRVNQQUNFID0gY2ZnLk5BTUVTUEFDRSB8fCBIVE1MX05BTUVTUEFDRTtcbiAgICBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgPSBjZmcuTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTIHx8IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUztcbiAgICBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGNmZy5IVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyB8fCBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUztcbiAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORyA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyB8fCB7fTtcbiAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIGlzUmVnZXhPckZ1bmN0aW9uKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2spKSB7XG4gICAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrO1xuICAgIH1cbiAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIGlzUmVnZXhPckZ1bmN0aW9uKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2spKSB7XG4gICAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrO1xuICAgIH1cbiAgICBpZiAoY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HICYmIHR5cGVvZiBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzID09PSAnYm9vbGVhbicpIHtcbiAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHM7XG4gICAgfVxuICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgIEFMTE9XX0RBVEFfQVRUUiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgUkVUVVJOX0RPTSA9IHRydWU7XG4gICAgfVxuICAgIC8qIFBhcnNlIHByb2ZpbGUgaW5mbyAqL1xuICAgIGlmIChVU0VfUFJPRklMRVMpIHtcbiAgICAgIEFMTE9XRURfVEFHUyA9IGFkZFRvU2V0KHt9LCB0ZXh0KTtcbiAgICAgIEFMTE9XRURfQVRUUiA9IFtdO1xuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5odG1sID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgaHRtbCQxKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBodG1sKTtcbiAgICAgIH1cbiAgICAgIGlmIChVU0VfUFJPRklMRVMuc3ZnID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnJDEpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHN2Zyk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgIH1cbiAgICAgIGlmIChVU0VfUFJPRklMRVMuc3ZnRmlsdGVycyA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIHN2Z0ZpbHRlcnMpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHN2Zyk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgIH1cbiAgICAgIGlmIChVU0VfUFJPRklMRVMubWF0aE1sID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgbWF0aE1sJDEpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIG1hdGhNbCk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgeG1sKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogTWVyZ2UgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzICovXG4gICAgaWYgKGNmZy5BRERfVEFHUykge1xuICAgICAgaWYgKHR5cGVvZiBjZmcuQUREX1RBR1MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgRVhUUkFfRUxFTUVOVF9IQU5ETElORy50YWdDaGVjayA9IGNmZy5BRERfVEFHUztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChBTExPV0VEX1RBR1MgPT09IERFRkFVTFRfQUxMT1dFRF9UQUdTKSB7XG4gICAgICAgICAgQUxMT1dFRF9UQUdTID0gY2xvbmUoQUxMT1dFRF9UQUdTKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGNmZy5BRERfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2ZnLkFERF9BVFRSKSB7XG4gICAgICBpZiAodHlwZW9mIGNmZy5BRERfQVRUUiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZUNoZWNrID0gY2ZnLkFERF9BVFRSO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKEFMTE9XRURfQVRUUiA9PT0gREVGQVVMVF9BTExPV0VEX0FUVFIpIHtcbiAgICAgICAgICBBTExPV0VEX0FUVFIgPSBjbG9uZShBTExPV0VEX0FUVFIpO1xuICAgICAgICB9XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgY2ZnLkFERF9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjZmcuQUREX1VSSV9TQUZFX0FUVFIpIHtcbiAgICAgIGFkZFRvU2V0KFVSSV9TQUZFX0FUVFJJQlVURVMsIGNmZy5BRERfVVJJX1NBRkVfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY2ZnLkZPUkJJRF9DT05URU5UUykge1xuICAgICAgaWYgKEZPUkJJRF9DT05URU5UUyA9PT0gREVGQVVMVF9GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgICAgRk9SQklEX0NPTlRFTlRTID0gY2xvbmUoRk9SQklEX0NPTlRFTlRTKTtcbiAgICAgIH1cbiAgICAgIGFkZFRvU2V0KEZPUkJJRF9DT05URU5UUywgY2ZnLkZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY2ZnLkFERF9GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgIGlmIChGT1JCSURfQ09OVEVOVFMgPT09IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICAgIEZPUkJJRF9DT05URU5UUyA9IGNsb25lKEZPUkJJRF9DT05URU5UUyk7XG4gICAgICB9XG4gICAgICBhZGRUb1NldChGT1JCSURfQ09OVEVOVFMsIGNmZy5BRERfRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgfVxuICAgIC8qIEFkZCAjdGV4dCBpbiBjYXNlIEtFRVBfQ09OVEVOVCBpcyBzZXQgdG8gdHJ1ZSAqL1xuICAgIGlmIChLRUVQX0NPTlRFTlQpIHtcbiAgICAgIEFMTE9XRURfVEFHU1snI3RleHQnXSA9IHRydWU7XG4gICAgfVxuICAgIC8qIEFkZCBodG1sLCBoZWFkIGFuZCBib2R5IHRvIEFMTE9XRURfVEFHUyBpbiBjYXNlIFdIT0xFX0RPQ1VNRU5UIGlzIHRydWUgKi9cbiAgICBpZiAoV0hPTEVfRE9DVU1FTlQpIHtcbiAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWydodG1sJywgJ2hlYWQnLCAnYm9keSddKTtcbiAgICB9XG4gICAgLyogQWRkIHRib2R5IHRvIEFMTE9XRURfVEFHUyBpbiBjYXNlIHRhYmxlcyBhcmUgcGVybWl0dGVkLCBzZWUgIzI4NiwgIzM2NSAqL1xuICAgIGlmIChBTExPV0VEX1RBR1MudGFibGUpIHtcbiAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgWyd0Ym9keSddKTtcbiAgICAgIGRlbGV0ZSBGT1JCSURfVEFHUy50Ym9keTtcbiAgICB9XG4gICAgaWYgKGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWSkge1xuICAgICAgaWYgKHR5cGVvZiBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1kuY3JlYXRlSFRNTCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ1RSVVNURURfVFlQRVNfUE9MSUNZIGNvbmZpZ3VyYXRpb24gb3B0aW9uIG11c3QgcHJvdmlkZSBhIFwiY3JlYXRlSFRNTFwiIGhvb2suJyk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWS5jcmVhdGVTY3JpcHRVUkwgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdUUlVTVEVEX1RZUEVTX1BPTElDWSBjb25maWd1cmF0aW9uIG9wdGlvbiBtdXN0IHByb3ZpZGUgYSBcImNyZWF0ZVNjcmlwdFVSTFwiIGhvb2suJyk7XG4gICAgICB9XG4gICAgICAvLyBPdmVyd3JpdGUgZXhpc3RpbmcgVHJ1c3RlZFR5cGVzIHBvbGljeS5cbiAgICAgIHRydXN0ZWRUeXBlc1BvbGljeSA9IGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWTtcbiAgICAgIC8vIFNpZ24gbG9jYWwgdmFyaWFibGVzIHJlcXVpcmVkIGJ5IGBzYW5pdGl6ZWAuXG4gICAgICBlbXB0eUhUTUwgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCgnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVuaW5pdGlhbGl6ZWQgcG9saWN5LCBhdHRlbXB0IHRvIGluaXRpYWxpemUgdGhlIGludGVybmFsIGRvbXB1cmlmeSBwb2xpY3kuXG4gICAgICBpZiAodHJ1c3RlZFR5cGVzUG9saWN5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHJ1c3RlZFR5cGVzUG9saWN5ID0gX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSh0cnVzdGVkVHlwZXMsIGN1cnJlbnRTY3JpcHQpO1xuICAgICAgfVxuICAgICAgLy8gSWYgY3JlYXRpbmcgdGhlIGludGVybmFsIHBvbGljeSBzdWNjZWVkZWQgc2lnbiBpbnRlcm5hbCB2YXJpYWJsZXMuXG4gICAgICBpZiAodHJ1c3RlZFR5cGVzUG9saWN5ICE9PSBudWxsICYmIHR5cGVvZiBlbXB0eUhUTUwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKCcnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUHJldmVudCBmdXJ0aGVyIG1hbmlwdWxhdGlvbiBvZiBjb25maWd1cmF0aW9uLlxuICAgIC8vIE5vdCBhdmFpbGFibGUgaW4gSUU4LCBTYWZhcmkgNSwgZXRjLlxuICAgIGlmIChmcmVlemUpIHtcbiAgICAgIGZyZWV6ZShjZmcpO1xuICAgIH1cbiAgICBDT05GSUcgPSBjZmc7XG4gIH07XG4gIC8qIEtlZXAgdHJhY2sgb2YgYWxsIHBvc3NpYmxlIFNWRyBhbmQgTWF0aE1MIHRhZ3NcbiAgICogc28gdGhhdCB3ZSBjYW4gcGVyZm9ybSB0aGUgbmFtZXNwYWNlIGNoZWNrc1xuICAgKiBjb3JyZWN0bHkuICovXG4gIGNvbnN0IEFMTF9TVkdfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4uc3ZnJDEsIC4uLnN2Z0ZpbHRlcnMsIC4uLnN2Z0Rpc2FsbG93ZWRdKTtcbiAgY29uc3QgQUxMX01BVEhNTF9UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5tYXRoTWwkMSwgLi4ubWF0aE1sRGlzYWxsb3dlZF0pO1xuICAvKipcbiAgICogQHBhcmFtIGVsZW1lbnQgYSBET00gZWxlbWVudCB3aG9zZSBuYW1lc3BhY2UgaXMgYmVpbmcgY2hlY2tlZFxuICAgKiBAcmV0dXJucyBSZXR1cm4gZmFsc2UgaWYgdGhlIGVsZW1lbnQgaGFzIGFcbiAgICogIG5hbWVzcGFjZSB0aGF0IGEgc3BlYy1jb21wbGlhbnQgcGFyc2VyIHdvdWxkIG5ldmVyXG4gICAqICByZXR1cm4uIFJldHVybiB0cnVlIG90aGVyd2lzZS5cbiAgICovXG4gIGNvbnN0IF9jaGVja1ZhbGlkTmFtZXNwYWNlID0gZnVuY3Rpb24gX2NoZWNrVmFsaWROYW1lc3BhY2UoZWxlbWVudCkge1xuICAgIGxldCBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKGVsZW1lbnQpO1xuICAgIC8vIEluIEpTRE9NLCBpZiB3ZSdyZSBpbnNpZGUgc2hhZG93IERPTSwgdGhlbiBwYXJlbnROb2RlXG4gICAgLy8gY2FuIGJlIG51bGwuIFdlIGp1c3Qgc2ltdWxhdGUgcGFyZW50IGluIHRoaXMgY2FzZS5cbiAgICBpZiAoIXBhcmVudCB8fCAhcGFyZW50LnRhZ05hbWUpIHtcbiAgICAgIHBhcmVudCA9IHtcbiAgICAgICAgbmFtZXNwYWNlVVJJOiBOQU1FU1BBQ0UsXG4gICAgICAgIHRhZ05hbWU6ICd0ZW1wbGF0ZSdcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHRhZ05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShlbGVtZW50LnRhZ05hbWUpO1xuICAgIGNvbnN0IHBhcmVudFRhZ05hbWUgPSBzdHJpbmdUb0xvd2VyQ2FzZShwYXJlbnQudGFnTmFtZSk7XG4gICAgaWYgKCFBTExPV0VEX05BTUVTUEFDRVNbZWxlbWVudC5uYW1lc3BhY2VVUkldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSkge1xuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIEhUTUwgbmFtZXNwYWNlIHRvIFNWR1xuICAgICAgLy8gaXMgdmlhIDxzdmc+LiBJZiBpdCBoYXBwZW5zIHZpYSBhbnkgb3RoZXIgdGFnLCB0aGVuXG4gICAgICAvLyBpdCBzaG91bGQgYmUga2lsbGVkLlxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnc3ZnJztcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBNYXRoTUwgdG8gU1ZHIGlzIHZpYWBcbiAgICAgIC8vIHN2ZyBpZiBwYXJlbnQgaXMgZWl0aGVyIDxhbm5vdGF0aW9uLXhtbD4gb3IgTWF0aE1MXG4gICAgICAvLyB0ZXh0IGludGVncmF0aW9uIHBvaW50cy5cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnc3ZnJyAmJiAocGFyZW50VGFnTmFtZSA9PT0gJ2Fubm90YXRpb24teG1sJyB8fCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pO1xuICAgICAgfVxuICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIFNWR1xuICAgICAgLy8gc3BlYy4gQWxsIG90aGVycyBhcmUgZGlzYWxsb3dlZCBpbiBTVkcgbmFtZXNwYWNlLlxuICAgICAgcmV0dXJuIEJvb2xlYW4oQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gTWF0aE1MXG4gICAgICAvLyBpcyB2aWEgPG1hdGg+LiBJZiBpdCBoYXBwZW5zIHZpYSBhbnkgb3RoZXIgdGFnLCB0aGVuXG4gICAgICAvLyBpdCBzaG91bGQgYmUga2lsbGVkLlxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnbWF0aCc7XG4gICAgICB9XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gU1ZHIHRvIE1hdGhNTCBpcyB2aWFcbiAgICAgIC8vIDxtYXRoPiBhbmQgSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lID09PSAnbWF0aCcgJiYgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV07XG4gICAgICB9XG4gICAgICAvLyBXZSBvbmx5IGFsbG93IGVsZW1lbnRzIHRoYXQgYXJlIGRlZmluZWQgaW4gTWF0aE1MXG4gICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIE1hdGhNTCBuYW1lc3BhY2UuXG4gICAgICByZXR1cm4gQm9vbGVhbihBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0pO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gU1ZHIHRvIEhUTUwgaXMgdmlhXG4gICAgICAvLyBIVE1MIGludGVncmF0aW9uIHBvaW50cywgYW5kIGZyb20gTWF0aE1MIHRvIEhUTUxcbiAgICAgIC8vIGlzIHZpYSBNYXRoTUwgdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHNcbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFICYmICFIVE1MX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSAmJiAhTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGRpc2FsbG93IHRhZ3MgdGhhdCBhcmUgc3BlY2lmaWMgZm9yIE1hdGhNTFxuICAgICAgLy8gb3IgU1ZHIGFuZCBzaG91bGQgbmV2ZXIgYXBwZWFyIGluIEhUTUwgbmFtZXNwYWNlXG4gICAgICByZXR1cm4gIUFMTF9NQVRITUxfVEFHU1t0YWdOYW1lXSAmJiAoQ09NTU9OX1NWR19BTkRfSFRNTF9FTEVNRU5UU1t0YWdOYW1lXSB8fCAhQUxMX1NWR19UQUdTW3RhZ05hbWVdKTtcbiAgICB9XG4gICAgLy8gRm9yIFhIVE1MIGFuZCBYTUwgZG9jdW1lbnRzIHRoYXQgc3VwcG9ydCBjdXN0b20gbmFtZXNwYWNlc1xuICAgIGlmIChQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgJiYgQUxMT1dFRF9OQU1FU1BBQ0VTW2VsZW1lbnQubmFtZXNwYWNlVVJJXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIFRoZSBjb2RlIHNob3VsZCBuZXZlciByZWFjaCB0aGlzIHBsYWNlICh0aGlzIG1lYW5zXG4gICAgLy8gdGhhdCB0aGUgZWxlbWVudCBzb21laG93IGdvdCBuYW1lc3BhY2UgdGhhdCBpcyBub3RcbiAgICAvLyBIVE1MLCBTVkcsIE1hdGhNTCBvciBhbGxvd2VkIHZpYSBBTExPV0VEX05BTUVTUEFDRVMpLlxuICAgIC8vIFJldHVybiBmYWxzZSBqdXN0IGluIGNhc2UuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICAvKipcbiAgICogX2ZvcmNlUmVtb3ZlXG4gICAqXG4gICAqIEBwYXJhbSBub2RlIGEgRE9NIG5vZGVcbiAgICovXG4gIGNvbnN0IF9mb3JjZVJlbW92ZSA9IGZ1bmN0aW9uIF9mb3JjZVJlbW92ZShub2RlKSB7XG4gICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICBlbGVtZW50OiBub2RlXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1yZW1vdmVcbiAgICAgIGdldFBhcmVudE5vZGUobm9kZSkucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgcmVtb3ZlKG5vZGUpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIF9yZW1vdmVBdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIG5hbWUgYW4gQXR0cmlidXRlIG5hbWVcbiAgICogQHBhcmFtIGVsZW1lbnQgYSBET00gbm9kZVxuICAgKi9cbiAgY29uc3QgX3JlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgZWxlbWVudCkge1xuICAgIHRyeSB7XG4gICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgYXR0cmlidXRlOiBlbGVtZW50LmdldEF0dHJpYnV0ZU5vZGUobmFtZSksXG4gICAgICAgIGZyb206IGVsZW1lbnRcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgICBhdHRyaWJ1dGU6IG51bGwsXG4gICAgICAgIGZyb206IGVsZW1lbnRcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAvLyBXZSB2b2lkIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIHVucmVtb3ZhYmxlIFwiaXNcIiBhdHRyaWJ1dGVzXG4gICAgaWYgKG5hbWUgPT09ICdpcycpIHtcbiAgICAgIGlmIChSRVRVUk5fRE9NIHx8IFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBfZm9yY2VSZW1vdmUoZWxlbWVudCk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsICcnKTtcbiAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBfaW5pdERvY3VtZW50XG4gICAqXG4gICAqIEBwYXJhbSBkaXJ0eSAtIGEgc3RyaW5nIG9mIGRpcnR5IG1hcmt1cFxuICAgKiBAcmV0dXJuIGEgRE9NLCBmaWxsZWQgd2l0aCB0aGUgZGlydHkgbWFya3VwXG4gICAqL1xuICBjb25zdCBfaW5pdERvY3VtZW50ID0gZnVuY3Rpb24gX2luaXREb2N1bWVudChkaXJ0eSkge1xuICAgIC8qIENyZWF0ZSBhIEhUTUwgZG9jdW1lbnQgKi9cbiAgICBsZXQgZG9jID0gbnVsbDtcbiAgICBsZXQgbGVhZGluZ1doaXRlc3BhY2UgPSBudWxsO1xuICAgIGlmIChGT1JDRV9CT0RZKSB7XG4gICAgICBkaXJ0eSA9ICc8cmVtb3ZlPjwvcmVtb3ZlPicgKyBkaXJ0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgLyogSWYgRk9SQ0VfQk9EWSBpc24ndCB1c2VkLCBsZWFkaW5nIHdoaXRlc3BhY2UgbmVlZHMgdG8gYmUgcHJlc2VydmVkIG1hbnVhbGx5ICovXG4gICAgICBjb25zdCBtYXRjaGVzID0gc3RyaW5nTWF0Y2goZGlydHksIC9eW1xcclxcblxcdCBdKy8pO1xuICAgICAgbGVhZGluZ1doaXRlc3BhY2UgPSBtYXRjaGVzICYmIG1hdGNoZXNbMF07XG4gICAgfVxuICAgIGlmIChQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgJiYgTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgLy8gUm9vdCBvZiBYSFRNTCBkb2MgbXVzdCBjb250YWluIHhtbG5zIGRlY2xhcmF0aW9uIChzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL3hodG1sMS9ub3JtYXRpdmUuaHRtbCNzdHJpY3QpXG4gICAgICBkaXJ0eSA9ICc8aHRtbCB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIj48aGVhZD48L2hlYWQ+PGJvZHk+JyArIGRpcnR5ICsgJzwvYm9keT48L2h0bWw+JztcbiAgICB9XG4gICAgY29uc3QgZGlydHlQYXlsb2FkID0gdHJ1c3RlZFR5cGVzUG9saWN5ID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoZGlydHkpIDogZGlydHk7XG4gICAgLypcbiAgICAgKiBVc2UgdGhlIERPTVBhcnNlciBBUEkgYnkgZGVmYXVsdCwgZmFsbGJhY2sgbGF0ZXIgaWYgbmVlZHMgYmVcbiAgICAgKiBET01QYXJzZXIgbm90IHdvcmsgZm9yIHN2ZyB3aGVuIGhhcyBtdWx0aXBsZSByb290IGVsZW1lbnQuXG4gICAgICovXG4gICAgaWYgKE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoZGlydHlQYXlsb2FkLCBQQVJTRVJfTUVESUFfVFlQRSk7XG4gICAgICB9IGNhdGNoIChfKSB7fVxuICAgIH1cbiAgICAvKiBVc2UgY3JlYXRlSFRNTERvY3VtZW50IGluIGNhc2UgRE9NUGFyc2VyIGlzIG5vdCBhdmFpbGFibGUgKi9cbiAgICBpZiAoIWRvYyB8fCAhZG9jLmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgZG9jID0gaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoTkFNRVNQQUNFLCAndGVtcGxhdGUnLCBudWxsKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuaW5uZXJIVE1MID0gSVNfRU1QVFlfSU5QVVQgPyBlbXB0eUhUTUwgOiBkaXJ0eVBheWxvYWQ7XG4gICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIFN5bnRheCBlcnJvciBpZiBkaXJ0eVBheWxvYWQgaXMgaW52YWxpZCB4bWxcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYm9keSA9IGRvYy5ib2R5IHx8IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG4gICAgaWYgKGRpcnR5ICYmIGxlYWRpbmdXaGl0ZXNwYWNlKSB7XG4gICAgICBib2R5Lmluc2VydEJlZm9yZShkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsZWFkaW5nV2hpdGVzcGFjZSksIGJvZHkuY2hpbGROb2Rlc1swXSB8fCBudWxsKTtcbiAgICB9XG4gICAgLyogV29yayBvbiB3aG9sZSBkb2N1bWVudCBvciBqdXN0IGl0cyBib2R5ICovXG4gICAgaWYgKE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIHJldHVybiBnZXRFbGVtZW50c0J5VGFnTmFtZS5jYWxsKGRvYywgV0hPTEVfRE9DVU1FTlQgPyAnaHRtbCcgOiAnYm9keScpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gV0hPTEVfRE9DVU1FTlQgPyBkb2MuZG9jdW1lbnRFbGVtZW50IDogYm9keTtcbiAgfTtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBOb2RlSXRlcmF0b3Igb2JqZWN0IHRoYXQgeW91IGNhbiB1c2UgdG8gdHJhdmVyc2UgZmlsdGVyZWQgbGlzdHMgb2Ygbm9kZXMgb3IgZWxlbWVudHMgaW4gYSBkb2N1bWVudC5cbiAgICpcbiAgICogQHBhcmFtIHJvb3QgVGhlIHJvb3QgZWxlbWVudCBvciBub2RlIHRvIHN0YXJ0IHRyYXZlcnNpbmcgb24uXG4gICAqIEByZXR1cm4gVGhlIGNyZWF0ZWQgTm9kZUl0ZXJhdG9yXG4gICAqL1xuICBjb25zdCBfY3JlYXRlTm9kZUl0ZXJhdG9yID0gZnVuY3Rpb24gX2NyZWF0ZU5vZGVJdGVyYXRvcihyb290KSB7XG4gICAgcmV0dXJuIGNyZWF0ZU5vZGVJdGVyYXRvci5jYWxsKHJvb3Qub3duZXJEb2N1bWVudCB8fCByb290LCByb290LFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG4gICAgTm9kZUZpbHRlci5TSE9XX0VMRU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfQ09NTUVOVCB8IE5vZGVGaWx0ZXIuU0hPV19URVhUIHwgTm9kZUZpbHRlci5TSE9XX1BST0NFU1NJTkdfSU5TVFJVQ1RJT04gfCBOb2RlRmlsdGVyLlNIT1dfQ0RBVEFfU0VDVElPTiwgbnVsbCk7XG4gIH07XG4gIC8qKlxuICAgKiBfaXNDbG9iYmVyZWRcbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBjaGVjayBmb3IgY2xvYmJlcmluZyBhdHRhY2tzXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiBjbG9iYmVyZWQsIGZhbHNlIGlmIHNhZmVcbiAgICovXG4gIGNvbnN0IF9pc0Nsb2JiZXJlZCA9IGZ1bmN0aW9uIF9pc0Nsb2JiZXJlZChlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQgJiYgKHR5cGVvZiBlbGVtZW50Lm5vZGVOYW1lICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudC50ZXh0Q29udGVudCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQucmVtb3ZlQ2hpbGQgIT09ICdmdW5jdGlvbicgfHwgIShlbGVtZW50LmF0dHJpYnV0ZXMgaW5zdGFuY2VvZiBOYW1lZE5vZGVNYXApIHx8IHR5cGVvZiBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgZWxlbWVudC5zZXRBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQubmFtZXNwYWNlVVJJICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudC5pbnNlcnRCZWZvcmUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQuaGFzQ2hpbGROb2RlcyAhPT0gJ2Z1bmN0aW9uJyk7XG4gIH07XG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBvYmplY3QgdG8gY2hlY2sgd2hldGhlciBpdCdzIGEgRE9NIG5vZGVcbiAgICogQHJldHVybiB0cnVlIGlzIG9iamVjdCBpcyBhIERPTSBub2RlXG4gICAqL1xuICBjb25zdCBfaXNOb2RlID0gZnVuY3Rpb24gX2lzTm9kZSh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgTm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIE5vZGU7XG4gIH07XG4gIGZ1bmN0aW9uIF9leGVjdXRlSG9va3MoaG9va3MsIGN1cnJlbnROb2RlLCBkYXRhKSB7XG4gICAgYXJyYXlGb3JFYWNoKGhvb2tzLCBob29rID0+IHtcbiAgICAgIGhvb2suY2FsbChET01QdXJpZnksIGN1cnJlbnROb2RlLCBkYXRhLCBDT05GSUcpO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBfc2FuaXRpemVFbGVtZW50c1xuICAgKlxuICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgKiBAcHJvdGVjdCB0ZXh0Q29udGVudFxuICAgKiBAcHJvdGVjdCByZW1vdmVDaGlsZFxuICAgKiBAcGFyYW0gY3VycmVudE5vZGUgdG8gY2hlY2sgZm9yIHBlcm1pc3Npb24gdG8gZXhpc3RcbiAgICogQHJldHVybiB0cnVlIGlmIG5vZGUgd2FzIGtpbGxlZCwgZmFsc2UgaWYgbGVmdCBhbGl2ZVxuICAgKi9cbiAgY29uc3QgX3Nhbml0aXplRWxlbWVudHMgPSBmdW5jdGlvbiBfc2FuaXRpemVFbGVtZW50cyhjdXJyZW50Tm9kZSkge1xuICAgIGxldCBjb250ZW50ID0gbnVsbDtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZUVsZW1lbnRzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgLyogQ2hlY2sgaWYgZWxlbWVudCBpcyBjbG9iYmVyZWQgb3IgY2FuIGNsb2JiZXIgKi9cbiAgICBpZiAoX2lzQ2xvYmJlcmVkKGN1cnJlbnROb2RlKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBOb3cgbGV0J3MgY2hlY2sgdGhlIGVsZW1lbnQncyB0eXBlIGFuZCBuYW1lICovXG4gICAgY29uc3QgdGFnTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKGN1cnJlbnROb2RlLm5vZGVOYW1lKTtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVFbGVtZW50LCBjdXJyZW50Tm9kZSwge1xuICAgICAgdGFnTmFtZSxcbiAgICAgIGFsbG93ZWRUYWdzOiBBTExPV0VEX1RBR1NcbiAgICB9KTtcbiAgICAvKiBEZXRlY3QgbVhTUyBhdHRlbXB0cyBhYnVzaW5nIG5hbWVzcGFjZSBjb25mdXNpb24gKi9cbiAgICBpZiAoU0FGRV9GT1JfWE1MICYmIGN1cnJlbnROb2RlLmhhc0NoaWxkTm9kZXMoKSAmJiAhX2lzTm9kZShjdXJyZW50Tm9kZS5maXJzdEVsZW1lbnRDaGlsZCkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3IV0vZywgY3VycmVudE5vZGUuaW5uZXJIVE1MKSAmJiByZWdFeHBUZXN0KC88Wy9cXHchXS9nLCBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogUmVtb3ZlIGFueSBvY2N1cnJlbmNlIG9mIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb25zICovXG4gICAgaWYgKGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUucHJvZ3Jlc3NpbmdJbnN0cnVjdGlvbikge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBSZW1vdmUgYW55IGtpbmQgb2YgcG9zc2libHkgaGFybWZ1bCBjb21tZW50cyAqL1xuICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5jb21tZW50ICYmIHJlZ0V4cFRlc3QoLzxbL1xcd10vZywgY3VycmVudE5vZGUuZGF0YSkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogUmVtb3ZlIGVsZW1lbnQgaWYgYW55dGhpbmcgZm9yYmlkcyBpdHMgcHJlc2VuY2UgKi9cbiAgICBpZiAoIShFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLnRhZ0NoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgRVhUUkFfRUxFTUVOVF9IQU5ETElORy50YWdDaGVjayh0YWdOYW1lKSkgJiYgKCFBTExPV0VEX1RBR1NbdGFnTmFtZV0gfHwgRk9SQklEX1RBR1NbdGFnTmFtZV0pKSB7XG4gICAgICAvKiBDaGVjayBpZiB3ZSBoYXZlIGEgY3VzdG9tIGVsZW1lbnQgdG8gaGFuZGxlICovXG4gICAgICBpZiAoIUZPUkJJRF9UQUdTW3RhZ05hbWVdICYmIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCh0YWdOYW1lKSkge1xuICAgICAgICBpZiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLCB0YWdOYW1lKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKHRhZ05hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvKiBLZWVwIGNvbnRlbnQgZXhjZXB0IGZvciBiYWQtbGlzdGVkIGVsZW1lbnRzICovXG4gICAgICBpZiAoS0VFUF9DT05URU5UICYmICFGT1JCSURfQ09OVEVOVFNbdGFnTmFtZV0pIHtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGdldFBhcmVudE5vZGUoY3VycmVudE5vZGUpIHx8IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBnZXRDaGlsZE5vZGVzKGN1cnJlbnROb2RlKSB8fCBjdXJyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICBpZiAoY2hpbGROb2RlcyAmJiBwYXJlbnROb2RlKSB7XG4gICAgICAgICAgY29uc3QgY2hpbGRDb3VudCA9IGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgICAgICAgIGZvciAobGV0IGkgPSBjaGlsZENvdW50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkQ2xvbmUgPSBjbG9uZU5vZGUoY2hpbGROb2Rlc1tpXSwgdHJ1ZSk7XG4gICAgICAgICAgICBjaGlsZENsb25lLl9fcmVtb3ZhbENvdW50ID0gKGN1cnJlbnROb2RlLl9fcmVtb3ZhbENvdW50IHx8IDApICsgMTtcbiAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNoaWxkQ2xvbmUsIGdldE5leHRTaWJsaW5nKGN1cnJlbnROb2RlKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIENoZWNrIHdoZXRoZXIgZWxlbWVudCBoYXMgYSB2YWxpZCBuYW1lc3BhY2UgKi9cbiAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50ICYmICFfY2hlY2tWYWxpZE5hbWVzcGFjZShjdXJyZW50Tm9kZSkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogTWFrZSBzdXJlIHRoYXQgb2xkZXIgYnJvd3NlcnMgZG9uJ3QgZ2V0IGZhbGxiYWNrLXRhZyBtWFNTICovXG4gICAgaWYgKCh0YWdOYW1lID09PSAnbm9zY3JpcHQnIHx8IHRhZ05hbWUgPT09ICdub2VtYmVkJyB8fCB0YWdOYW1lID09PSAnbm9mcmFtZXMnKSAmJiByZWdFeHBUZXN0KC88XFwvbm8oc2NyaXB0fGVtYmVkfGZyYW1lcykvaSwgY3VycmVudE5vZGUuaW5uZXJIVE1MKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBTYW5pdGl6ZSBlbGVtZW50IGNvbnRlbnQgdG8gYmUgdGVtcGxhdGUtc2FmZSAqL1xuICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS50ZXh0KSB7XG4gICAgICAvKiBHZXQgdGhlIGVsZW1lbnQncyB0ZXh0IGNvbnRlbnQgKi9cbiAgICAgIGNvbnRlbnQgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudDtcbiAgICAgIGFycmF5Rm9yRWFjaChbTVVTVEFDSEVfRVhQUiwgRVJCX0VYUFIsIFRNUExJVF9FWFBSXSwgZXhwciA9PiB7XG4gICAgICAgIGNvbnRlbnQgPSBzdHJpbmdSZXBsYWNlKGNvbnRlbnQsIGV4cHIsICcgJyk7XG4gICAgICB9KTtcbiAgICAgIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudCAhPT0gY29udGVudCkge1xuICAgICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgICBlbGVtZW50OiBjdXJyZW50Tm9kZS5jbG9uZU5vZGUoKVxuICAgICAgICB9KTtcbiAgICAgICAgY3VycmVudE5vZGUudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplRWxlbWVudHMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIC8qKlxuICAgKiBfaXNWYWxpZEF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcGFyYW0gbGNUYWcgTG93ZXJjYXNlIHRhZyBuYW1lIG9mIGNvbnRhaW5pbmcgZWxlbWVudC5cbiAgICogQHBhcmFtIGxjTmFtZSBMb3dlcmNhc2UgYXR0cmlidXRlIG5hbWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBBdHRyaWJ1dGUgdmFsdWUuXG4gICAqIEByZXR1cm4gUmV0dXJucyB0cnVlIGlmIGB2YWx1ZWAgaXMgdmFsaWQsIG90aGVyd2lzZSBmYWxzZS5cbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIGNvbnN0IF9pc1ZhbGlkQXR0cmlidXRlID0gZnVuY3Rpb24gX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpIHtcbiAgICAvKiBNYWtlIHN1cmUgYXR0cmlidXRlIGNhbm5vdCBjbG9iYmVyICovXG4gICAgaWYgKFNBTklUSVpFX0RPTSAmJiAobGNOYW1lID09PSAnaWQnIHx8IGxjTmFtZSA9PT0gJ25hbWUnKSAmJiAodmFsdWUgaW4gZG9jdW1lbnQgfHwgdmFsdWUgaW4gZm9ybUVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qIEFsbG93IHZhbGlkIGRhdGEtKiBhdHRyaWJ1dGVzOiBBdCBsZWFzdCBvbmUgY2hhcmFjdGVyIGFmdGVyIFwiLVwiXG4gICAgICAgIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9kb20uaHRtbCNlbWJlZGRpbmctY3VzdG9tLW5vbi12aXNpYmxlLWRhdGEtd2l0aC10aGUtZGF0YS0qLWF0dHJpYnV0ZXMpXG4gICAgICAgIFhNTC1jb21wYXRpYmxlIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmZyYXN0cnVjdHVyZS5odG1sI3htbC1jb21wYXRpYmxlIGFuZCBodHRwOi8vd3d3LnczLm9yZy9UUi94bWwvI2QwZTgwNClcbiAgICAgICAgV2UgZG9uJ3QgbmVlZCB0byBjaGVjayB0aGUgdmFsdWU7IGl0J3MgYWx3YXlzIFVSSSBzYWZlLiAqL1xuICAgIGlmIChBTExPV19EQVRBX0FUVFIgJiYgIUZPUkJJRF9BVFRSW2xjTmFtZV0gJiYgcmVnRXhwVGVzdChEQVRBX0FUVFIsIGxjTmFtZSkpIDsgZWxzZSBpZiAoQUxMT1dfQVJJQV9BVFRSICYmIHJlZ0V4cFRlc3QoQVJJQV9BVFRSLCBsY05hbWUpKSA7IGVsc2UgaWYgKEVYVFJBX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZUNoZWNrKGxjTmFtZSwgbGNUYWcpKSA7IGVsc2UgaWYgKCFBTExPV0VEX0FUVFJbbGNOYW1lXSB8fCBGT1JCSURfQVRUUltsY05hbWVdKSB7XG4gICAgICBpZiAoXG4gICAgICAvLyBGaXJzdCBjb25kaXRpb24gZG9lcyBhIHZlcnkgYmFzaWMgY2hlY2sgaWYgYSkgaXQncyBiYXNpY2FsbHkgYSB2YWxpZCBjdXN0b20gZWxlbWVudCB0YWduYW1lIEFORFxuICAgICAgLy8gYikgaWYgdGhlIHRhZ05hbWUgcGFzc2VzIHdoYXRldmVyIHRoZSB1c2VyIGhhcyBjb25maWd1cmVkIGZvciBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2tcbiAgICAgIC8vIGFuZCBjKSBpZiB0aGUgYXR0cmlidXRlIG5hbWUgcGFzc2VzIHdoYXRldmVyIHRoZSB1c2VyIGhhcyBjb25maWd1cmVkIGZvciBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2tcbiAgICAgIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudChsY1RhZykgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgbGNUYWcpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayhsY1RhZykpICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2ssIGxjTmFtZSkgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrKGxjTmFtZSwgbGNUYWcpKSB8fFxuICAgICAgLy8gQWx0ZXJuYXRpdmUsIHNlY29uZCBjb25kaXRpb24gY2hlY2tzIGlmIGl0J3MgYW4gYGlzYC1hdHRyaWJ1dGUsIEFORFxuICAgICAgLy8gdGhlIHZhbHVlIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrXG4gICAgICBsY05hbWUgPT09ICdpcycgJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIHZhbHVlKSB8fCBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sodmFsdWUpKSkgOyBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLyogQ2hlY2sgdmFsdWUgaXMgc2FmZS4gRmlyc3QsIGlzIGF0dHIgaW5lcnQ/IElmIHNvLCBpcyBzYWZlICovXG4gICAgfSBlbHNlIGlmIChVUklfU0FGRV9BVFRSSUJVVEVTW2xjTmFtZV0pIDsgZWxzZSBpZiAocmVnRXhwVGVzdChJU19BTExPV0VEX1VSSSQxLCBzdHJpbmdSZXBsYWNlKHZhbHVlLCBBVFRSX1dISVRFU1BBQ0UsICcnKSkpIDsgZWxzZSBpZiAoKGxjTmFtZSA9PT0gJ3NyYycgfHwgbGNOYW1lID09PSAneGxpbms6aHJlZicgfHwgbGNOYW1lID09PSAnaHJlZicpICYmIGxjVGFnICE9PSAnc2NyaXB0JyAmJiBzdHJpbmdJbmRleE9mKHZhbHVlLCAnZGF0YTonKSA9PT0gMCAmJiBEQVRBX1VSSV9UQUdTW2xjVGFnXSkgOyBlbHNlIGlmIChBTExPV19VTktOT1dOX1BST1RPQ09MUyAmJiAhcmVnRXhwVGVzdChJU19TQ1JJUFRfT1JfREFUQSwgc3RyaW5nUmVwbGFjZSh2YWx1ZSwgQVRUUl9XSElURVNQQUNFLCAnJykpKSA7IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgLyoqXG4gICAqIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudFxuICAgKiBjaGVja3MgaWYgYXQgbGVhc3Qgb25lIGRhc2ggaXMgaW5jbHVkZWQgaW4gdGFnTmFtZSwgYW5kIGl0J3Mgbm90IHRoZSBmaXJzdCBjaGFyXG4gICAqIGZvciBtb3JlIHNvcGhpc3RpY2F0ZWQgY2hlY2tpbmcgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvdmFsaWRhdGUtZWxlbWVudC1uYW1lXG4gICAqXG4gICAqIEBwYXJhbSB0YWdOYW1lIG5hbWUgb2YgdGhlIHRhZyBvZiB0aGUgbm9kZSB0byBzYW5pdGl6ZVxuICAgKiBAcmV0dXJucyBSZXR1cm5zIHRydWUgaWYgdGhlIHRhZyBuYW1lIG1lZXRzIHRoZSBiYXNpYyBjcml0ZXJpYSBmb3IgYSBjdXN0b20gZWxlbWVudCwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgKi9cbiAgY29uc3QgX2lzQmFzaWNDdXN0b21FbGVtZW50ID0gZnVuY3Rpb24gX2lzQmFzaWNDdXN0b21FbGVtZW50KHRhZ05hbWUpIHtcbiAgICByZXR1cm4gdGFnTmFtZSAhPT0gJ2Fubm90YXRpb24teG1sJyAmJiBzdHJpbmdNYXRjaCh0YWdOYW1lLCBDVVNUT01fRUxFTUVOVCk7XG4gIH07XG4gIC8qKlxuICAgKiBfc2FuaXRpemVBdHRyaWJ1dGVzXG4gICAqXG4gICAqIEBwcm90ZWN0IGF0dHJpYnV0ZXNcbiAgICogQHByb3RlY3Qgbm9kZU5hbWVcbiAgICogQHByb3RlY3QgcmVtb3ZlQXR0cmlidXRlXG4gICAqIEBwcm90ZWN0IHNldEF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcGFyYW0gY3VycmVudE5vZGUgdG8gc2FuaXRpemVcbiAgICovXG4gIGNvbnN0IF9zYW5pdGl6ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbiBfc2FuaXRpemVBdHRyaWJ1dGVzKGN1cnJlbnROb2RlKSB7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgY29uc3Qge1xuICAgICAgYXR0cmlidXRlc1xuICAgIH0gPSBjdXJyZW50Tm9kZTtcbiAgICAvKiBDaGVjayBpZiB3ZSBoYXZlIGF0dHJpYnV0ZXM7IGlmIG5vdCB3ZSBtaWdodCBoYXZlIGEgdGV4dCBub2RlICovXG4gICAgaWYgKCFhdHRyaWJ1dGVzIHx8IF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaG9va0V2ZW50ID0ge1xuICAgICAgYXR0ck5hbWU6ICcnLFxuICAgICAgYXR0clZhbHVlOiAnJyxcbiAgICAgIGtlZXBBdHRyOiB0cnVlLFxuICAgICAgYWxsb3dlZEF0dHJpYnV0ZXM6IEFMTE9XRURfQVRUUixcbiAgICAgIGZvcmNlS2VlcEF0dHI6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgbGV0IGwgPSBhdHRyaWJ1dGVzLmxlbmd0aDtcbiAgICAvKiBHbyBiYWNrd2FyZHMgb3ZlciBhbGwgYXR0cmlidXRlczsgc2FmZWx5IHJlbW92ZSBiYWQgb25lcyAqL1xuICAgIHdoaWxlIChsLS0pIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBhdHRyaWJ1dGVzW2xdO1xuICAgICAgY29uc3Qge1xuICAgICAgICBuYW1lLFxuICAgICAgICBuYW1lc3BhY2VVUkksXG4gICAgICAgIHZhbHVlOiBhdHRyVmFsdWVcbiAgICAgIH0gPSBhdHRyO1xuICAgICAgY29uc3QgbGNOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMobmFtZSk7XG4gICAgICBjb25zdCBpbml0VmFsdWUgPSBhdHRyVmFsdWU7XG4gICAgICBsZXQgdmFsdWUgPSBuYW1lID09PSAndmFsdWUnID8gaW5pdFZhbHVlIDogc3RyaW5nVHJpbShpbml0VmFsdWUpO1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgaG9va0V2ZW50LmF0dHJOYW1lID0gbGNOYW1lO1xuICAgICAgaG9va0V2ZW50LmF0dHJWYWx1ZSA9IHZhbHVlO1xuICAgICAgaG9va0V2ZW50LmtlZXBBdHRyID0gdHJ1ZTtcbiAgICAgIGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyID0gdW5kZWZpbmVkOyAvLyBBbGxvd3MgZGV2ZWxvcGVycyB0byBzZWUgdGhpcyBpcyBhIHByb3BlcnR5IHRoZXkgY2FuIHNldFxuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVBdHRyaWJ1dGUsIGN1cnJlbnROb2RlLCBob29rRXZlbnQpO1xuICAgICAgdmFsdWUgPSBob29rRXZlbnQuYXR0clZhbHVlO1xuICAgICAgLyogRnVsbCBET00gQ2xvYmJlcmluZyBwcm90ZWN0aW9uIHZpYSBuYW1lc3BhY2UgaXNvbGF0aW9uLFxuICAgICAgICogUHJlZml4IGlkIGFuZCBuYW1lIGF0dHJpYnV0ZXMgd2l0aCBgdXNlci1jb250ZW50LWBcbiAgICAgICAqL1xuICAgICAgaWYgKFNBTklUSVpFX05BTUVEX1BST1BTICYmIChsY05hbWUgPT09ICdpZCcgfHwgbGNOYW1lID09PSAnbmFtZScpKSB7XG4gICAgICAgIC8vIFJlbW92ZSB0aGUgYXR0cmlidXRlIHdpdGggdGhpcyB2YWx1ZVxuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgLy8gUHJlZml4IHRoZSB2YWx1ZSBhbmQgbGF0ZXIgcmUtY3JlYXRlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGUgc2FuaXRpemVkIHZhbHVlXG4gICAgICAgIHZhbHVlID0gU0FOSVRJWkVfTkFNRURfUFJPUFNfUFJFRklYICsgdmFsdWU7XG4gICAgICB9XG4gICAgICAvKiBXb3JrIGFyb3VuZCBhIHNlY3VyaXR5IGlzc3VlIHdpdGggY29tbWVudHMgaW5zaWRlIGF0dHJpYnV0ZXMgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgcmVnRXhwVGVzdCgvKCgtLSE/fF0pPil8PFxcLyhzdHlsZXx0aXRsZXx0ZXh0YXJlYSkvaSwgdmFsdWUpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIE1ha2Ugc3VyZSB3ZSBjYW5ub3QgZWFzaWx5IHVzZSBhbmltYXRlZCBocmVmcywgZXZlbiBpZiBhbmltYXRpb25zIGFyZSBhbGxvd2VkICovXG4gICAgICBpZiAobGNOYW1lID09PSAnYXR0cmlidXRlbmFtZScgJiYgc3RyaW5nTWF0Y2godmFsdWUsICdocmVmJykpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogRGlkIHRoZSBob29rcyBhcHByb3ZlIG9mIHRoZSBhdHRyaWJ1dGU/ICovXG4gICAgICBpZiAoaG9va0V2ZW50LmZvcmNlS2VlcEF0dHIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBEaWQgdGhlIGhvb2tzIGFwcHJvdmUgb2YgdGhlIGF0dHJpYnV0ZT8gKi9cbiAgICAgIGlmICghaG9va0V2ZW50LmtlZXBBdHRyKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIFdvcmsgYXJvdW5kIGEgc2VjdXJpdHkgaXNzdWUgaW4galF1ZXJ5IDMuMCAqL1xuICAgICAgaWYgKCFBTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgJiYgcmVnRXhwVGVzdCgvXFwvPi9pLCB2YWx1ZSkpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogU2FuaXRpemUgYXR0cmlidXRlIGNvbnRlbnQgdG8gYmUgdGVtcGxhdGUtc2FmZSAqL1xuICAgICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICAgIHZhbHVlID0gc3RyaW5nUmVwbGFjZSh2YWx1ZSwgZXhwciwgJyAnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvKiBJcyBgdmFsdWVgIHZhbGlkIGZvciB0aGlzIGF0dHJpYnV0ZT8gKi9cbiAgICAgIGNvbnN0IGxjVGFnID0gdHJhbnNmb3JtQ2FzZUZ1bmMoY3VycmVudE5vZGUubm9kZU5hbWUpO1xuICAgICAgaWYgKCFfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogSGFuZGxlIGF0dHJpYnV0ZXMgdGhhdCByZXF1aXJlIFRydXN0ZWQgVHlwZXMgKi9cbiAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgJiYgdHlwZW9mIHRydXN0ZWRUeXBlcyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHRydXN0ZWRUeXBlcy5nZXRBdHRyaWJ1dGVUeXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2VVUkkpIDsgZWxzZSB7XG4gICAgICAgICAgc3dpdGNoICh0cnVzdGVkVHlwZXMuZ2V0QXR0cmlidXRlVHlwZShsY1RhZywgbGNOYW1lKSkge1xuICAgICAgICAgICAgY2FzZSAnVHJ1c3RlZEhUTUwnOlxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ1RydXN0ZWRTY3JpcHRVUkwnOlxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlU2NyaXB0VVJMKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogSGFuZGxlIGludmFsaWQgZGF0YS0qIGF0dHJpYnV0ZSBzZXQgYnkgdHJ5LWNhdGNoaW5nIGl0ICovXG4gICAgICBpZiAodmFsdWUgIT09IGluaXRWYWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChuYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiBGYWxsYmFjayB0byBzZXRBdHRyaWJ1dGUoKSBmb3IgYnJvd3Nlci11bnJlY29nbml6ZWQgbmFtZXNwYWNlcyBlLmcuIFwieC1zY2hlbWFcIi4gKi9cbiAgICAgICAgICAgIGN1cnJlbnROb2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICAgICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheVBvcChET01QdXJpZnkucmVtb3ZlZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgfTtcbiAgLyoqXG4gICAqIF9zYW5pdGl6ZVNoYWRvd0RPTVxuICAgKlxuICAgKiBAcGFyYW0gZnJhZ21lbnQgdG8gaXRlcmF0ZSBvdmVyIHJlY3Vyc2l2ZWx5XG4gICAqL1xuICBjb25zdCBfc2FuaXRpemVTaGFkb3dET00gPSBmdW5jdGlvbiBfc2FuaXRpemVTaGFkb3dET00oZnJhZ21lbnQpIHtcbiAgICBsZXQgc2hhZG93Tm9kZSA9IG51bGw7XG4gICAgY29uc3Qgc2hhZG93SXRlcmF0b3IgPSBfY3JlYXRlTm9kZUl0ZXJhdG9yKGZyYWdtZW50KTtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZVNoYWRvd0RPTSwgZnJhZ21lbnQsIG51bGwpO1xuICAgIHdoaWxlIChzaGFkb3dOb2RlID0gc2hhZG93SXRlcmF0b3IubmV4dE5vZGUoKSkge1xuICAgICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgICAgX2V4ZWN1dGVIb29rcyhob29rcy51cG9uU2FuaXRpemVTaGFkb3dOb2RlLCBzaGFkb3dOb2RlLCBudWxsKTtcbiAgICAgIC8qIFNhbml0aXplIHRhZ3MgYW5kIGVsZW1lbnRzICovXG4gICAgICBfc2FuaXRpemVFbGVtZW50cyhzaGFkb3dOb2RlKTtcbiAgICAgIC8qIENoZWNrIGF0dHJpYnV0ZXMgbmV4dCAqL1xuICAgICAgX3Nhbml0aXplQXR0cmlidXRlcyhzaGFkb3dOb2RlKTtcbiAgICAgIC8qIERlZXAgc2hhZG93IERPTSBkZXRlY3RlZCAqL1xuICAgICAgaWYgKHNoYWRvd05vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgX3Nhbml0aXplU2hhZG93RE9NKHNoYWRvd05vZGUuY29udGVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVTaGFkb3dET00sIGZyYWdtZW50LCBudWxsKTtcbiAgfTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgRE9NUHVyaWZ5LnNhbml0aXplID0gZnVuY3Rpb24gKGRpcnR5KSB7XG4gICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgbGV0IGJvZHkgPSBudWxsO1xuICAgIGxldCBpbXBvcnRlZE5vZGUgPSBudWxsO1xuICAgIGxldCBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgbGV0IHJldHVybk5vZGUgPSBudWxsO1xuICAgIC8qIE1ha2Ugc3VyZSB3ZSBoYXZlIGEgc3RyaW5nIHRvIHNhbml0aXplLlxuICAgICAgRE8gTk9UIHJldHVybiBlYXJseSwgYXMgdGhpcyB3aWxsIHJldHVybiB0aGUgd3JvbmcgdHlwZSBpZlxuICAgICAgdGhlIHVzZXIgaGFzIHJlcXVlc3RlZCBhIERPTSBvYmplY3QgcmF0aGVyIHRoYW4gYSBzdHJpbmcgKi9cbiAgICBJU19FTVBUWV9JTlBVVCA9ICFkaXJ0eTtcbiAgICBpZiAoSVNfRU1QVFlfSU5QVVQpIHtcbiAgICAgIGRpcnR5ID0gJzwhLS0+JztcbiAgICB9XG4gICAgLyogU3RyaW5naWZ5LCBpbiBjYXNlIGRpcnR5IGlzIGFuIG9iamVjdCAqL1xuICAgIGlmICh0eXBlb2YgZGlydHkgIT09ICdzdHJpbmcnICYmICFfaXNOb2RlKGRpcnR5KSkge1xuICAgICAgaWYgKHR5cGVvZiBkaXJ0eS50b1N0cmluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBkaXJ0eSA9IGRpcnR5LnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICh0eXBlb2YgZGlydHkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdkaXJ0eSBpcyBub3QgYSBzdHJpbmcsIGFib3J0aW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgndG9TdHJpbmcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogUmV0dXJuIGRpcnR5IEhUTUwgaWYgRE9NUHVyaWZ5IGNhbm5vdCBydW4gKi9cbiAgICBpZiAoIURPTVB1cmlmeS5pc1N1cHBvcnRlZCkge1xuICAgICAgcmV0dXJuIGRpcnR5O1xuICAgIH1cbiAgICAvKiBBc3NpZ24gY29uZmlnIHZhcnMgKi9cbiAgICBpZiAoIVNFVF9DT05GSUcpIHtcbiAgICAgIF9wYXJzZUNvbmZpZyhjZmcpO1xuICAgIH1cbiAgICAvKiBDbGVhbiB1cCByZW1vdmVkIGVsZW1lbnRzICovXG4gICAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcbiAgICAvKiBDaGVjayBpZiBkaXJ0eSBpcyBjb3JyZWN0bHkgdHlwZWQgZm9yIElOX1BMQUNFICovXG4gICAgaWYgKHR5cGVvZiBkaXJ0eSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIElOX1BMQUNFID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChJTl9QTEFDRSkge1xuICAgICAgLyogRG8gc29tZSBlYXJseSBwcmUtc2FuaXRpemF0aW9uIHRvIGF2b2lkIHVuc2FmZSByb290IG5vZGVzICovXG4gICAgICBpZiAoZGlydHkubm9kZU5hbWUpIHtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKGRpcnR5Lm5vZGVOYW1lKTtcbiAgICAgICAgaWYgKCFBTExPV0VEX1RBR1NbdGFnTmFtZV0gfHwgRk9SQklEX1RBR1NbdGFnTmFtZV0pIHtcbiAgICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ3Jvb3Qgbm9kZSBpcyBmb3JiaWRkZW4gYW5kIGNhbm5vdCBiZSBzYW5pdGl6ZWQgaW4tcGxhY2UnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGlydHkgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAvKiBJZiBkaXJ0eSBpcyBhIERPTSBlbGVtZW50LCBhcHBlbmQgdG8gYW4gZW1wdHkgZG9jdW1lbnQgdG8gYXZvaWRcbiAgICAgICAgIGVsZW1lbnRzIGJlaW5nIHN0cmlwcGVkIGJ5IHRoZSBwYXJzZXIgKi9cbiAgICAgIGJvZHkgPSBfaW5pdERvY3VtZW50KCc8IS0tLS0+Jyk7XG4gICAgICBpbXBvcnRlZE5vZGUgPSBib2R5Lm93bmVyRG9jdW1lbnQuaW1wb3J0Tm9kZShkaXJ0eSwgdHJ1ZSk7XG4gICAgICBpZiAoaW1wb3J0ZWROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUuZWxlbWVudCAmJiBpbXBvcnRlZE5vZGUubm9kZU5hbWUgPT09ICdCT0RZJykge1xuICAgICAgICAvKiBOb2RlIGlzIGFscmVhZHkgYSBib2R5LCB1c2UgYXMgaXMgKi9cbiAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgIH0gZWxzZSBpZiAoaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnSFRNTCcpIHtcbiAgICAgICAgYm9keSA9IGltcG9ydGVkTm9kZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1hcHBlbmRcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChpbXBvcnRlZE5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBFeGl0IGRpcmVjdGx5IGlmIHdlIGhhdmUgbm90aGluZyB0byBkbyAqL1xuICAgICAgaWYgKCFSRVRVUk5fRE9NICYmICFTQUZFX0ZPUl9URU1QTEFURVMgJiYgIVdIT0xFX0RPQ1VNRU5UICYmXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItaW5jbHVkZXNcbiAgICAgIGRpcnR5LmluZGV4T2YoJzwnKSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoZGlydHkpIDogZGlydHk7XG4gICAgICB9XG4gICAgICAvKiBJbml0aWFsaXplIHRoZSBkb2N1bWVudCB0byB3b3JrIG9uICovXG4gICAgICBib2R5ID0gX2luaXREb2N1bWVudChkaXJ0eSk7XG4gICAgICAvKiBDaGVjayB3ZSBoYXZlIGEgRE9NIG5vZGUgZnJvbSB0aGUgZGF0YSAqL1xuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIHJldHVybiBSRVRVUk5fRE9NID8gbnVsbCA6IFJFVFVSTl9UUlVTVEVEX1RZUEUgPyBlbXB0eUhUTUwgOiAnJztcbiAgICAgIH1cbiAgICB9XG4gICAgLyogUmVtb3ZlIGZpcnN0IGVsZW1lbnQgbm9kZSAob3VycykgaWYgRk9SQ0VfQk9EWSBpcyBzZXQgKi9cbiAgICBpZiAoYm9keSAmJiBGT1JDRV9CT0RZKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoYm9keS5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgLyogR2V0IG5vZGUgaXRlcmF0b3IgKi9cbiAgICBjb25zdCBub2RlSXRlcmF0b3IgPSBfY3JlYXRlTm9kZUl0ZXJhdG9yKElOX1BMQUNFID8gZGlydHkgOiBib2R5KTtcbiAgICAvKiBOb3cgc3RhcnQgaXRlcmF0aW5nIG92ZXIgdGhlIGNyZWF0ZWQgZG9jdW1lbnQgKi9cbiAgICB3aGlsZSAoY3VycmVudE5vZGUgPSBub2RlSXRlcmF0b3IubmV4dE5vZGUoKSkge1xuICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgIF9zYW5pdGl6ZUVsZW1lbnRzKGN1cnJlbnROb2RlKTtcbiAgICAgIC8qIENoZWNrIGF0dHJpYnV0ZXMgbmV4dCAqL1xuICAgICAgX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSk7XG4gICAgICAvKiBTaGFkb3cgRE9NIGRldGVjdGVkLCBzYW5pdGl6ZSBpdCAqL1xuICAgICAgaWYgKGN1cnJlbnROb2RlLmNvbnRlbnQgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgICAgIF9zYW5pdGl6ZVNoYWRvd0RPTShjdXJyZW50Tm9kZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogSWYgd2Ugc2FuaXRpemVkIGBkaXJ0eWAgaW4tcGxhY2UsIHJldHVybiBpdC4gKi9cbiAgICBpZiAoSU5fUExBQ0UpIHtcbiAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgLyogUmV0dXJuIHNhbml0aXplZCBzdHJpbmcgb3IgRE9NICovXG4gICAgaWYgKFJFVFVSTl9ET00pIHtcbiAgICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgIHJldHVybk5vZGUgPSBjcmVhdGVEb2N1bWVudEZyYWdtZW50LmNhbGwoYm9keS5vd25lckRvY3VtZW50KTtcbiAgICAgICAgd2hpbGUgKGJvZHkuZmlyc3RDaGlsZCkge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1kb20tbm9kZS1hcHBlbmRcbiAgICAgICAgICByZXR1cm5Ob2RlLmFwcGVuZENoaWxkKGJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybk5vZGUgPSBib2R5O1xuICAgICAgfVxuICAgICAgaWYgKEFMTE9XRURfQVRUUi5zaGFkb3dyb290IHx8IEFMTE9XRURfQVRUUi5zaGFkb3dyb290bW9kZSkge1xuICAgICAgICAvKlxuICAgICAgICAgIEFkb3B0Tm9kZSgpIGlzIG5vdCB1c2VkIGJlY2F1c2UgaW50ZXJuYWwgc3RhdGUgaXMgbm90IHJlc2V0XG4gICAgICAgICAgKGUuZy4gdGhlIHBhc3QgbmFtZXMgbWFwIG9mIGEgSFRNTEZvcm1FbGVtZW50KSwgdGhpcyBpcyBzYWZlXG4gICAgICAgICAgaW4gdGhlb3J5IGJ1dCB3ZSB3b3VsZCByYXRoZXIgbm90IHJpc2sgYW5vdGhlciBhdHRhY2sgdmVjdG9yLlxuICAgICAgICAgIFRoZSBzdGF0ZSB0aGF0IGlzIGNsb25lZCBieSBpbXBvcnROb2RlKCkgaXMgZXhwbGljaXRseSBkZWZpbmVkXG4gICAgICAgICAgYnkgdGhlIHNwZWNzLlxuICAgICAgICAqL1xuICAgICAgICByZXR1cm5Ob2RlID0gaW1wb3J0Tm9kZS5jYWxsKG9yaWdpbmFsRG9jdW1lbnQsIHJldHVybk5vZGUsIHRydWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldHVybk5vZGU7XG4gICAgfVxuICAgIGxldCBzZXJpYWxpemVkSFRNTCA9IFdIT0xFX0RPQ1VNRU5UID8gYm9keS5vdXRlckhUTUwgOiBib2R5LmlubmVySFRNTDtcbiAgICAvKiBTZXJpYWxpemUgZG9jdHlwZSBpZiBhbGxvd2VkICovXG4gICAgaWYgKFdIT0xFX0RPQ1VNRU5UICYmIEFMTE9XRURfVEFHU1snIWRvY3R5cGUnXSAmJiBib2R5Lm93bmVyRG9jdW1lbnQgJiYgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUgJiYgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSAmJiByZWdFeHBUZXN0KERPQ1RZUEVfTkFNRSwgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSkpIHtcbiAgICAgIHNlcmlhbGl6ZWRIVE1MID0gJzwhRE9DVFlQRSAnICsgYm9keS5vd25lckRvY3VtZW50LmRvY3R5cGUubmFtZSArICc+XFxuJyArIHNlcmlhbGl6ZWRIVE1MO1xuICAgIH1cbiAgICAvKiBTYW5pdGl6ZSBmaW5hbCBzdHJpbmcgdGVtcGxhdGUtc2FmZSAqL1xuICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgIGFycmF5Rm9yRWFjaChbTVVTVEFDSEVfRVhQUiwgRVJCX0VYUFIsIFRNUExJVF9FWFBSXSwgZXhwciA9PiB7XG4gICAgICAgIHNlcmlhbGl6ZWRIVE1MID0gc3RyaW5nUmVwbGFjZShzZXJpYWxpemVkSFRNTCwgZXhwciwgJyAnKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChzZXJpYWxpemVkSFRNTCkgOiBzZXJpYWxpemVkSFRNTDtcbiAgfTtcbiAgRE9NUHVyaWZ5LnNldENvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgY2ZnID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICBTRVRfQ09ORklHID0gdHJ1ZTtcbiAgfTtcbiAgRE9NUHVyaWZ5LmNsZWFyQ29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgIENPTkZJRyA9IG51bGw7XG4gICAgU0VUX0NPTkZJRyA9IGZhbHNlO1xuICB9O1xuICBET01QdXJpZnkuaXNWYWxpZEF0dHJpYnV0ZSA9IGZ1bmN0aW9uICh0YWcsIGF0dHIsIHZhbHVlKSB7XG4gICAgLyogSW5pdGlhbGl6ZSBzaGFyZWQgY29uZmlnIHZhcnMgaWYgbmVjZXNzYXJ5LiAqL1xuICAgIGlmICghQ09ORklHKSB7XG4gICAgICBfcGFyc2VDb25maWcoe30pO1xuICAgIH1cbiAgICBjb25zdCBsY1RhZyA9IHRyYW5zZm9ybUNhc2VGdW5jKHRhZyk7XG4gICAgY29uc3QgbGNOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoYXR0cik7XG4gICAgcmV0dXJuIF9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKTtcbiAgfTtcbiAgRE9NUHVyaWZ5LmFkZEhvb2sgPSBmdW5jdGlvbiAoZW50cnlQb2ludCwgaG9va0Z1bmN0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBob29rRnVuY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXJyYXlQdXNoKGhvb2tzW2VudHJ5UG9pbnRdLCBob29rRnVuY3Rpb24pO1xuICB9O1xuICBET01QdXJpZnkucmVtb3ZlSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50LCBob29rRnVuY3Rpb24pIHtcbiAgICBpZiAoaG9va0Z1bmN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gYXJyYXlMYXN0SW5kZXhPZihob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgICAgIHJldHVybiBpbmRleCA9PT0gLTEgPyB1bmRlZmluZWQgOiBhcnJheVNwbGljZShob29rc1tlbnRyeVBvaW50XSwgaW5kZXgsIDEpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlQb3AoaG9va3NbZW50cnlQb2ludF0pO1xuICB9O1xuICBET01QdXJpZnkucmVtb3ZlSG9va3MgPSBmdW5jdGlvbiAoZW50cnlQb2ludCkge1xuICAgIGhvb2tzW2VudHJ5UG9pbnRdID0gW107XG4gIH07XG4gIERPTVB1cmlmeS5yZW1vdmVBbGxIb29rcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBob29rcyA9IF9jcmVhdGVIb29rc01hcCgpO1xuICB9O1xuICByZXR1cm4gRE9NUHVyaWZ5O1xufVxudmFyIHB1cmlmeSA9IGNyZWF0ZURPTVB1cmlmeSgpO1xuXG5leHBvcnQgeyBwdXJpZnkgYXMgZGVmYXVsdCB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHVyaWZ5LmVzLm1qcy5tYXBcbiIsIi8qKlxuICogbWFya2VkIHYxNy4wLjEgLSBhIG1hcmtkb3duIHBhcnNlclxuICogQ29weXJpZ2h0IChjKSAyMDE4LTIwMjUsIE1hcmtlZEpTLiAoTUlUIExpY2Vuc2UpXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxOCwgQ2hyaXN0b3BoZXIgSmVmZnJleS4gKE1JVCBMaWNlbnNlKVxuICogaHR0cHM6Ly9naXRodWIuY29tL21hcmtlZGpzL21hcmtlZFxuICovXG5cbi8qKlxuICogRE8gTk9UIEVESVQgVEhJUyBGSUxFXG4gKiBUaGUgY29kZSBpbiB0aGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGZyb20gZmlsZXMgaW4gLi9zcmMvXG4gKi9cblxuZnVuY3Rpb24gTCgpe3JldHVybnthc3luYzohMSxicmVha3M6ITEsZXh0ZW5zaW9uczpudWxsLGdmbTohMCxob29rczpudWxsLHBlZGFudGljOiExLHJlbmRlcmVyOm51bGwsc2lsZW50OiExLHRva2VuaXplcjpudWxsLHdhbGtUb2tlbnM6bnVsbH19dmFyIFQ9TCgpO2Z1bmN0aW9uIFoodSl7VD11fXZhciBDPXtleGVjOigpPT5udWxsfTtmdW5jdGlvbiBrKHUsZT1cIlwiKXtsZXQgdD10eXBlb2YgdT09XCJzdHJpbmdcIj91OnUuc291cmNlLG49e3JlcGxhY2U6KHIsaSk9PntsZXQgcz10eXBlb2YgaT09XCJzdHJpbmdcIj9pOmkuc291cmNlO3JldHVybiBzPXMucmVwbGFjZShtLmNhcmV0LFwiJDFcIiksdD10LnJlcGxhY2UocixzKSxufSxnZXRSZWdleDooKT0+bmV3IFJlZ0V4cCh0LGUpfTtyZXR1cm4gbn12YXIgbWU9KCgpPT57dHJ5e3JldHVybiEhbmV3IFJlZ0V4cChcIig/PD0xKSg/PCExKVwiKX1jYXRjaHtyZXR1cm4hMX19KSgpLG09e2NvZGVSZW1vdmVJbmRlbnQ6L14oPzogezEsNH18IHswLDN9XFx0KS9nbSxvdXRwdXRMaW5rUmVwbGFjZTovXFxcXChbXFxbXFxdXSkvZyxpbmRlbnRDb2RlQ29tcGVuc2F0aW9uOi9eKFxccyspKD86YGBgKS8sYmVnaW5uaW5nU3BhY2U6L15cXHMrLyxlbmRpbmdIYXNoOi8jJC8sc3RhcnRpbmdTcGFjZUNoYXI6L14gLyxlbmRpbmdTcGFjZUNoYXI6LyAkLyxub25TcGFjZUNoYXI6L1teIF0vLG5ld0xpbmVDaGFyR2xvYmFsOi9cXG4vZyx0YWJDaGFyR2xvYmFsOi9cXHQvZyxtdWx0aXBsZVNwYWNlR2xvYmFsOi9cXHMrL2csYmxhbmtMaW5lOi9eWyBcXHRdKiQvLGRvdWJsZUJsYW5rTGluZTovXFxuWyBcXHRdKlxcblsgXFx0XSokLyxibG9ja3F1b3RlU3RhcnQ6L14gezAsM30+LyxibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZTovXFxuIHswLDN9KCg/Oj0rfC0rKSAqKSg/PVxcbnwkKS9nLGJsb2NrcXVvdGVTZXRleHRSZXBsYWNlMjovXiB7MCwzfT5bIFxcdF0/L2dtLGxpc3RSZXBsYWNlVGFiczovXlxcdCsvLGxpc3RSZXBsYWNlTmVzdGluZzovXiB7MSw0fSg/PSggezR9KSpbXiBdKS9nLGxpc3RJc1Rhc2s6L15cXFtbIHhYXVxcXSArXFxTLyxsaXN0UmVwbGFjZVRhc2s6L15cXFtbIHhYXVxcXSArLyxsaXN0VGFza0NoZWNrYm94Oi9cXFtbIHhYXVxcXS8sYW55TGluZTovXFxuLipcXG4vLGhyZWZCcmFja2V0czovXjwoLiopPiQvLHRhYmxlRGVsaW1pdGVyOi9bOnxdLyx0YWJsZUFsaWduQ2hhcnM6L15cXHx8XFx8ICokL2csdGFibGVSb3dCbGFua0xpbmU6L1xcblsgXFx0XSokLyx0YWJsZUFsaWduUmlnaHQ6L14gKi0rOiAqJC8sdGFibGVBbGlnbkNlbnRlcjovXiAqOi0rOiAqJC8sdGFibGVBbGlnbkxlZnQ6L14gKjotKyAqJC8sc3RhcnRBVGFnOi9ePGEgL2ksZW5kQVRhZzovXjxcXC9hPi9pLHN0YXJ0UHJlU2NyaXB0VGFnOi9ePChwcmV8Y29kZXxrYmR8c2NyaXB0KShcXHN8PikvaSxlbmRQcmVTY3JpcHRUYWc6L148XFwvKHByZXxjb2RlfGtiZHxzY3JpcHQpKFxcc3w+KS9pLHN0YXJ0QW5nbGVCcmFja2V0Oi9ePC8sZW5kQW5nbGVCcmFja2V0Oi8+JC8scGVkYW50aWNIcmVmVGl0bGU6L14oW14nXCJdKlteXFxzXSlcXHMrKFsnXCJdKSguKilcXDIvLHVuaWNvZGVBbHBoYU51bWVyaWM6L1tcXHB7TH1cXHB7Tn1dL3UsZXNjYXBlVGVzdDovWyY8PlwiJ10vLGVzY2FwZVJlcGxhY2U6L1smPD5cIiddL2csZXNjYXBlVGVzdE5vRW5jb2RlOi9bPD5cIiddfCYoPyEoI1xcZHsxLDd9fCNbWHhdW2EtZkEtRjAtOV17MSw2fXxcXHcrKTspLyxlc2NhcGVSZXBsYWNlTm9FbmNvZGU6L1s8PlwiJ118Jig/ISgjXFxkezEsN318I1tYeF1bYS1mQS1GMC05XXsxLDZ9fFxcdyspOykvZyx1bmVzY2FwZVRlc3Q6LyYoIyg/OlxcZCspfCg/OiN4WzAtOUEtRmEtZl0rKXwoPzpcXHcrKSk7Py9pZyxjYXJldDovKF58W15cXFtdKVxcXi9nLHBlcmNlbnREZWNvZGU6LyUyNS9nLGZpbmRQaXBlOi9cXHwvZyxzcGxpdFBpcGU6LyBcXHwvLHNsYXNoUGlwZTovXFxcXFxcfC9nLGNhcnJpYWdlUmV0dXJuOi9cXHJcXG58XFxyL2csc3BhY2VMaW5lOi9eICskL2dtLG5vdFNwYWNlU3RhcnQ6L15cXFMqLyxlbmRpbmdOZXdsaW5lOi9cXG4kLyxsaXN0SXRlbVJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4oIHswLDN9JHt1fSkoKD86W1x0IF1bXlxcXFxuXSopPyg/OlxcXFxufCQpKWApLG5leHRCdWxsZXRSZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0oPzpbKistXXxcXFxcZHsxLDl9Wy4pXSkoKD86WyBcdF1bXlxcXFxuXSopPyg/OlxcXFxufCQpKWApLGhyUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19KCg/Oi0gKil7Myx9fCg/Ol8gKil7Myx9fCg/OlxcXFwqICopezMsfSkoPzpcXFxcbit8JClgKSxmZW5jZXNCZWdpblJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSg/OlxcYFxcYFxcYHx+fn4pYCksaGVhZGluZ0JlZ2luUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19I2ApLGh0bWxCZWdpblJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fTwoPzpbYS16XS4qPnwhLS0pYCxcImlcIil9LHhlPS9eKD86WyBcXHRdKig/OlxcbnwkKSkrLyxiZT0vXigoPzogezR9fCB7MCwzfVxcdClbXlxcbl0rKD86XFxuKD86WyBcXHRdKig/OlxcbnwkKSkqKT8pKy8sUmU9L14gezAsM30oYHszLH0oPz1bXmBcXG5dKig/OlxcbnwkKSl8fnszLH0pKFteXFxuXSopKD86XFxufCQpKD86fChbXFxzXFxTXSo/KSg/OlxcbnwkKSkoPzogezAsM31cXDFbfmBdKiAqKD89XFxufCQpfCQpLyxJPS9eIHswLDN9KCg/Oi1bXFx0IF0qKXszLH18KD86X1sgXFx0XSopezMsfXwoPzpcXCpbIFxcdF0qKXszLH0pKD86XFxuK3wkKS8sVGU9L14gezAsM30oI3sxLDZ9KSg/PVxcc3wkKSguKikoPzpcXG4rfCQpLyxOPS8oPzpbKistXXxcXGR7MSw5fVsuKV0pLyxyZT0vXig/IWJ1bGwgfGJsb2NrQ29kZXxmZW5jZXN8YmxvY2txdW90ZXxoZWFkaW5nfGh0bWx8dGFibGUpKCg/Oi58XFxuKD8hXFxzKj9cXG58YnVsbCB8YmxvY2tDb2RlfGZlbmNlc3xibG9ja3F1b3RlfGhlYWRpbmd8aHRtbHx0YWJsZSkpKz8pXFxuIHswLDN9KD0rfC0rKSAqKD86XFxuK3wkKS8sc2U9ayhyZSkucmVwbGFjZSgvYnVsbC9nLE4pLnJlcGxhY2UoL2Jsb2NrQ29kZS9nLC8oPzogezR9fCB7MCwzfVxcdCkvKS5yZXBsYWNlKC9mZW5jZXMvZywvIHswLDN9KD86YHszLH18fnszLH0pLykucmVwbGFjZSgvYmxvY2txdW90ZS9nLC8gezAsM30+LykucmVwbGFjZSgvaGVhZGluZy9nLC8gezAsM30jezEsNn0vKS5yZXBsYWNlKC9odG1sL2csLyB7MCwzfTxbXlxcbj5dKz5cXG4vKS5yZXBsYWNlKC9cXHx0YWJsZS9nLFwiXCIpLmdldFJlZ2V4KCksT2U9ayhyZSkucmVwbGFjZSgvYnVsbC9nLE4pLnJlcGxhY2UoL2Jsb2NrQ29kZS9nLC8oPzogezR9fCB7MCwzfVxcdCkvKS5yZXBsYWNlKC9mZW5jZXMvZywvIHswLDN9KD86YHszLH18fnszLH0pLykucmVwbGFjZSgvYmxvY2txdW90ZS9nLC8gezAsM30+LykucmVwbGFjZSgvaGVhZGluZy9nLC8gezAsM30jezEsNn0vKS5yZXBsYWNlKC9odG1sL2csLyB7MCwzfTxbXlxcbj5dKz5cXG4vKS5yZXBsYWNlKC90YWJsZS9nLC8gezAsM31cXHw/KD86WzpcXC0gXSpcXHwpK1tcXDpcXC0gXSpcXG4vKS5nZXRSZWdleCgpLFE9L14oW15cXG5dKyg/Olxcbig/IWhyfGhlYWRpbmd8bGhlYWRpbmd8YmxvY2txdW90ZXxmZW5jZXN8bGlzdHxodG1sfHRhYmxlfCArXFxuKVteXFxuXSspKikvLHdlPS9eW15cXG5dKy8sRj0vKD8hXFxzKlxcXSkoPzpcXFxcW1xcc1xcU118W15cXFtcXF1cXFxcXSkrLyx5ZT1rKC9eIHswLDN9XFxbKGxhYmVsKVxcXTogKig/OlxcblsgXFx0XSopPyhbXjxcXHNdW15cXHNdKnw8Lio/PikoPzooPzogKyg/OlxcblsgXFx0XSopP3wgKlxcblsgXFx0XSopKHRpdGxlKSk/ICooPzpcXG4rfCQpLykucmVwbGFjZShcImxhYmVsXCIsRikucmVwbGFjZShcInRpdGxlXCIsLyg/OlwiKD86XFxcXFwiP3xbXlwiXFxcXF0pKlwifCdbXidcXG5dKig/OlxcblteJ1xcbl0rKSpcXG4/J3xcXChbXigpXSpcXCkpLykuZ2V0UmVnZXgoKSxQZT1rKC9eKCB7MCwzfWJ1bGwpKFsgXFx0XVteXFxuXSs/KT8oPzpcXG58JCkvKS5yZXBsYWNlKC9idWxsL2csTikuZ2V0UmVnZXgoKSx2PVwiYWRkcmVzc3xhcnRpY2xlfGFzaWRlfGJhc2V8YmFzZWZvbnR8YmxvY2txdW90ZXxib2R5fGNhcHRpb258Y2VudGVyfGNvbHxjb2xncm91cHxkZHxkZXRhaWxzfGRpYWxvZ3xkaXJ8ZGl2fGRsfGR0fGZpZWxkc2V0fGZpZ2NhcHRpb258ZmlndXJlfGZvb3Rlcnxmb3JtfGZyYW1lfGZyYW1lc2V0fGhbMS02XXxoZWFkfGhlYWRlcnxocnxodG1sfGlmcmFtZXxsZWdlbmR8bGl8bGlua3xtYWlufG1lbnV8bWVudWl0ZW18bWV0YXxuYXZ8bm9mcmFtZXN8b2x8b3B0Z3JvdXB8b3B0aW9ufHB8cGFyYW18c2VhcmNofHNlY3Rpb258c3VtbWFyeXx0YWJsZXx0Ym9keXx0ZHx0Zm9vdHx0aHx0aGVhZHx0aXRsZXx0cnx0cmFja3x1bFwiLGo9LzwhLS0oPzotPz58W1xcc1xcU10qPyg/Oi0tPnwkKSkvLFNlPWsoXCJeIHswLDN9KD86PChzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKVtcXFxccz5dW1xcXFxzXFxcXFNdKj8oPzo8L1xcXFwxPlteXFxcXG5dKlxcXFxuK3wkKXxjb21tZW50W15cXFxcbl0qKFxcXFxuK3wkKXw8XFxcXD9bXFxcXHNcXFxcU10qPyg/OlxcXFw/PlxcXFxuKnwkKXw8IVtBLVpdW1xcXFxzXFxcXFNdKj8oPzo+XFxcXG4qfCQpfDwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj8oPzpcXFxcXVxcXFxdPlxcXFxuKnwkKXw8Lz8odGFnKSg/OiArfFxcXFxufC8/PilbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuWyBcdF0qKStcXFxcbnwkKXw8KD8hc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSkoW2Etel1bXFxcXHctXSopKD86YXR0cmlidXRlKSo/ICovPz4oPz1bIFxcXFx0XSooPzpcXFxcbnwkKSlbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuWyBcdF0qKStcXFxcbnwkKXw8Lyg/IXNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpW2Etel1bXFxcXHctXSpcXFxccyo+KD89WyBcXFxcdF0qKD86XFxcXG58JCkpW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcblsgXHRdKikrXFxcXG58JCkpXCIsXCJpXCIpLnJlcGxhY2UoXCJjb21tZW50XCIsaikucmVwbGFjZShcInRhZ1wiLHYpLnJlcGxhY2UoXCJhdHRyaWJ1dGVcIiwvICtbYS16QS1aOl9dW1xcdy46LV0qKD86ICo9ICpcIlteXCJcXG5dKlwifCAqPSAqJ1teJ1xcbl0qJ3wgKj0gKlteXFxzXCInPTw+YF0rKT8vKS5nZXRSZWdleCgpLGllPWsoUSkucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixcIiB7MCwzfSN7MSw2fSg/OlxcXFxzfCQpXCIpLnJlcGxhY2UoXCJ8bGhlYWRpbmdcIixcIlwiKS5yZXBsYWNlKFwifHRhYmxlXCIsXCJcIikucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcImZlbmNlc1wiLFwiIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuXCIpLnJlcGxhY2UoXCJsaXN0XCIsXCIgezAsM30oPzpbKistXXwxWy4pXSkgXCIpLnJlcGxhY2UoXCJodG1sXCIsXCI8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pXCIpLnJlcGxhY2UoXCJ0YWdcIix2KS5nZXRSZWdleCgpLCRlPWsoL14oIHswLDN9PiA/KHBhcmFncmFwaHxbXlxcbl0qKSg/OlxcbnwkKSkrLykucmVwbGFjZShcInBhcmFncmFwaFwiLGllKS5nZXRSZWdleCgpLFU9e2Jsb2NrcXVvdGU6JGUsY29kZTpiZSxkZWY6eWUsZmVuY2VzOlJlLGhlYWRpbmc6VGUsaHI6SSxodG1sOlNlLGxoZWFkaW5nOnNlLGxpc3Q6UGUsbmV3bGluZTp4ZSxwYXJhZ3JhcGg6aWUsdGFibGU6Qyx0ZXh0OndlfSx0ZT1rKFwiXiAqKFteXFxcXG4gXS4qKVxcXFxuIHswLDN9KCg/OlxcXFx8ICopPzo/LSs6PyAqKD86XFxcXHwgKjo/LSs6PyAqKSooPzpcXFxcfCAqKT8pKD86XFxcXG4oKD86KD8hICpcXFxcbnxocnxoZWFkaW5nfGJsb2NrcXVvdGV8Y29kZXxmZW5jZXN8bGlzdHxodG1sKS4qKD86XFxcXG58JCkpKilcXFxcbip8JClcIikucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixcIiB7MCwzfSN7MSw2fSg/OlxcXFxzfCQpXCIpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJjb2RlXCIsXCIoPzogezR9fCB7MCwzfVx0KVteXFxcXG5dXCIpLnJlcGxhY2UoXCJmZW5jZXNcIixcIiB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcblwiKS5yZXBsYWNlKFwibGlzdFwiLFwiIHswLDN9KD86WyorLV18MVsuKV0pIFwiKS5yZXBsYWNlKFwiaHRtbFwiLFwiPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKVwiKS5yZXBsYWNlKFwidGFnXCIsdikuZ2V0UmVnZXgoKSxfZT17Li4uVSxsaGVhZGluZzpPZSx0YWJsZTp0ZSxwYXJhZ3JhcGg6ayhRKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLFwiIHswLDN9I3sxLDZ9KD86XFxcXHN8JClcIikucmVwbGFjZShcInxsaGVhZGluZ1wiLFwiXCIpLnJlcGxhY2UoXCJ0YWJsZVwiLHRlKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwiZmVuY2VzXCIsXCIgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG5cIikucmVwbGFjZShcImxpc3RcIixcIiB7MCwzfSg/OlsqKy1dfDFbLildKSBcIikucmVwbGFjZShcImh0bWxcIixcIjwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSlcIikucmVwbGFjZShcInRhZ1wiLHYpLmdldFJlZ2V4KCl9LExlPXsuLi5VLGh0bWw6ayhgXiAqKD86Y29tbWVudCAqKD86XFxcXG58XFxcXHMqJCl8PCh0YWcpW1xcXFxzXFxcXFNdKz88L1xcXFwxPiAqKD86XFxcXG57Mix9fFxcXFxzKiQpfDx0YWcoPzpcIlteXCJdKlwifCdbXiddKid8XFxcXHNbXidcIi8+XFxcXHNdKikqPy8/PiAqKD86XFxcXG57Mix9fFxcXFxzKiQpKWApLnJlcGxhY2UoXCJjb21tZW50XCIsaikucmVwbGFjZSgvdGFnL2csXCIoPyEoPzphfGVtfHN0cm9uZ3xzbWFsbHxzfGNpdGV8cXxkZm58YWJicnxkYXRhfHRpbWV8Y29kZXx2YXJ8c2FtcHxrYmR8c3VifHN1cHxpfGJ8dXxtYXJrfHJ1Ynl8cnR8cnB8YmRpfGJkb3xzcGFufGJyfHdicnxpbnN8ZGVsfGltZylcXFxcYilcXFxcdysoPyE6fFteXFxcXHdcXFxcc0BdKkApXFxcXGJcIikuZ2V0UmVnZXgoKSxkZWY6L14gKlxcWyhbXlxcXV0rKVxcXTogKjw/KFteXFxzPl0rKT4/KD86ICsoW1wiKF1bXlxcbl0rW1wiKV0pKT8gKig/Olxcbit8JCkvLGhlYWRpbmc6L14oI3sxLDZ9KSguKikoPzpcXG4rfCQpLyxmZW5jZXM6QyxsaGVhZGluZzovXiguKz8pXFxuIHswLDN9KD0rfC0rKSAqKD86XFxuK3wkKS8scGFyYWdyYXBoOmsoUSkucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixgICojezEsNn0gKlteXG5dYCkucmVwbGFjZShcImxoZWFkaW5nXCIsc2UpLnJlcGxhY2UoXCJ8dGFibGVcIixcIlwiKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwifGZlbmNlc1wiLFwiXCIpLnJlcGxhY2UoXCJ8bGlzdFwiLFwiXCIpLnJlcGxhY2UoXCJ8aHRtbFwiLFwiXCIpLnJlcGxhY2UoXCJ8dGFnXCIsXCJcIikuZ2V0UmVnZXgoKX0sTWU9L15cXFxcKFshXCIjJCUmJygpKissXFwtLi86Ozw9Pj9AXFxbXFxdXFxcXF5fYHt8fX5dKS8semU9L14oYCspKFteYF18W15gXVtcXHNcXFNdKj9bXmBdKVxcMSg/IWApLyxvZT0vXiggezIsfXxcXFxcKVxcbig/IVxccyokKS8sQWU9L14oYCt8W15gXSkoPzooPz0gezIsfVxcbil8W1xcc1xcU10qPyg/Oig/PVtcXFxcPCFcXFtgKl9dfFxcYl98JCl8W14gXSg/PSB7Mix9XFxuKSkpLyxEPS9bXFxwe1B9XFxwe1N9XS91LEs9L1tcXHNcXHB7UH1cXHB7U31dL3UsYWU9L1teXFxzXFxwe1B9XFxwe1N9XS91LENlPWsoL14oKD8hWypfXSlwdW5jdFNwYWNlKS8sXCJ1XCIpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxLKS5nZXRSZWdleCgpLGxlPS8oPyF+KVtcXHB7UH1cXHB7U31dL3UsSWU9Lyg/IX4pW1xcc1xccHtQfVxccHtTfV0vdSxFZT0vKD86W15cXHNcXHB7UH1cXHB7U31dfH4pL3UsQmU9aygvbGlua3xwcmVjb2RlLWNvZGV8aHRtbC8sXCJnXCIpLnJlcGxhY2UoXCJsaW5rXCIsL1xcWyg/OlteXFxbXFxdYF18KD88YT5gKylbXmBdK1xcazxhPig/IWApKSo/XFxdXFwoKD86XFxcXFtcXHNcXFNdfFteXFxcXFxcKFxcKV18XFwoKD86XFxcXFtcXHNcXFNdfFteXFxcXFxcKFxcKV0pKlxcKSkqXFwpLykucmVwbGFjZShcInByZWNvZGUtXCIsbWU/XCIoPzwhYCkoKVwiOlwiKF5efFteYF0pXCIpLnJlcGxhY2UoXCJjb2RlXCIsLyg/PGI+YCspW15gXStcXGs8Yj4oPyFgKS8pLnJlcGxhY2UoXCJodG1sXCIsLzwoPyEgKVtePD5dKj8+LykuZ2V0UmVnZXgoKSx1ZT0vXig/OlxcKisoPzooKD8hXFwqKXB1bmN0KXxbXlxccypdKSl8Xl8rKD86KCg/IV8pcHVuY3QpfChbXlxcc19dKSkvLHFlPWsodWUsXCJ1XCIpLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSx2ZT1rKHVlLFwidVwiKS5yZXBsYWNlKC9wdW5jdC9nLGxlKS5nZXRSZWdleCgpLHBlPVwiXlteXypdKj9fX1teXypdKj9cXFxcKlteXypdKj8oPz1fXyl8W14qXSsoPz1bXipdKXwoPyFcXFxcKilwdW5jdChcXFxcKispKD89W1xcXFxzXXwkKXxub3RQdW5jdFNwYWNlKFxcXFwqKykoPyFcXFxcKikoPz1wdW5jdFNwYWNlfCQpfCg/IVxcXFwqKXB1bmN0U3BhY2UoXFxcXCorKSg/PW5vdFB1bmN0U3BhY2UpfFtcXFxcc10oXFxcXCorKSg/IVxcXFwqKSg/PXB1bmN0KXwoPyFcXFxcKilwdW5jdChcXFxcKispKD8hXFxcXCopKD89cHVuY3QpfG5vdFB1bmN0U3BhY2UoXFxcXCorKSg/PW5vdFB1bmN0U3BhY2UpXCIsRGU9ayhwZSxcImd1XCIpLnJlcGxhY2UoL25vdFB1bmN0U3BhY2UvZyxhZSkucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEspLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSxIZT1rKHBlLFwiZ3VcIikucmVwbGFjZSgvbm90UHVuY3RTcGFjZS9nLEVlKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSWUpLnJlcGxhY2UoL3B1bmN0L2csbGUpLmdldFJlZ2V4KCksWmU9ayhcIl5bXl8qXSo/XFxcXCpcXFxcKlteXypdKj9fW15fKl0qPyg/PVxcXFwqXFxcXCopfFteX10rKD89W15fXSl8KD8hXylwdW5jdChfKykoPz1bXFxcXHNdfCQpfG5vdFB1bmN0U3BhY2UoXyspKD8hXykoPz1wdW5jdFNwYWNlfCQpfCg/IV8pcHVuY3RTcGFjZShfKykoPz1ub3RQdW5jdFNwYWNlKXxbXFxcXHNdKF8rKSg/IV8pKD89cHVuY3QpfCg/IV8pcHVuY3QoXyspKD8hXykoPz1wdW5jdClcIixcImd1XCIpLnJlcGxhY2UoL25vdFB1bmN0U3BhY2UvZyxhZSkucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEspLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSxHZT1rKC9cXFxcKHB1bmN0KS8sXCJndVwiKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksTmU9aygvXjwoc2NoZW1lOlteXFxzXFx4MDAtXFx4MWY8Pl0qfGVtYWlsKT4vKS5yZXBsYWNlKFwic2NoZW1lXCIsL1thLXpBLVpdW2EtekEtWjAtOSsuLV17MSwzMX0vKS5yZXBsYWNlKFwiZW1haWxcIiwvW2EtekEtWjAtOS4hIyQlJicqKy89P15fYHt8fX4tXSsoQClbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKyg/IVstX10pLykuZ2V0UmVnZXgoKSxRZT1rKGopLnJlcGxhY2UoXCIoPzotLT58JClcIixcIi0tPlwiKS5nZXRSZWdleCgpLEZlPWsoXCJeY29tbWVudHxePC9bYS16QS1aXVtcXFxcdzotXSpcXFxccyo+fF48W2EtekEtWl1bXFxcXHctXSooPzphdHRyaWJ1dGUpKj9cXFxccyovPz58XjxcXFxcP1tcXFxcc1xcXFxTXSo/XFxcXD8+fF48IVthLXpBLVpdK1xcXFxzW1xcXFxzXFxcXFNdKj8+fF48IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/XFxcXF1cXFxcXT5cIikucmVwbGFjZShcImNvbW1lbnRcIixRZSkucmVwbGFjZShcImF0dHJpYnV0ZVwiLC9cXHMrW2EtekEtWjpfXVtcXHcuOi1dKig/Olxccyo9XFxzKlwiW15cIl0qXCJ8XFxzKj1cXHMqJ1teJ10qJ3xcXHMqPVxccypbXlxcc1wiJz08PmBdKyk/LykuZ2V0UmVnZXgoKSxxPS8oPzpcXFsoPzpcXFxcW1xcc1xcU118W15cXFtcXF1cXFxcXSkqXFxdfFxcXFxbXFxzXFxTXXxgK1teYF0qP2ArKD8hYCl8W15cXFtcXF1cXFxcYF0pKj8vLGplPWsoL14hP1xcWyhsYWJlbClcXF1cXChcXHMqKGhyZWYpKD86KD86WyBcXHRdKig/OlxcblsgXFx0XSopPykodGl0bGUpKT9cXHMqXFwpLykucmVwbGFjZShcImxhYmVsXCIscSkucmVwbGFjZShcImhyZWZcIiwvPCg/OlxcXFwufFteXFxuPD5cXFxcXSkrPnxbXiBcXHRcXG5cXHgwMC1cXHgxZl0qLykucmVwbGFjZShcInRpdGxlXCIsL1wiKD86XFxcXFwiP3xbXlwiXFxcXF0pKlwifCcoPzpcXFxcJz98W14nXFxcXF0pKid8XFwoKD86XFxcXFxcKT98W14pXFxcXF0pKlxcKS8pLmdldFJlZ2V4KCksY2U9aygvXiE/XFxbKGxhYmVsKVxcXVxcWyhyZWYpXFxdLykucmVwbGFjZShcImxhYmVsXCIscSkucmVwbGFjZShcInJlZlwiLEYpLmdldFJlZ2V4KCksaGU9aygvXiE/XFxbKHJlZilcXF0oPzpcXFtcXF0pPy8pLnJlcGxhY2UoXCJyZWZcIixGKS5nZXRSZWdleCgpLFVlPWsoXCJyZWZsaW5rfG5vbGluayg/IVxcXFwoKVwiLFwiZ1wiKS5yZXBsYWNlKFwicmVmbGlua1wiLGNlKS5yZXBsYWNlKFwibm9saW5rXCIsaGUpLmdldFJlZ2V4KCksbmU9L1toSF1bdFRdW3RUXVtwUF1bc1NdP3xbZkZdW3RUXVtwUF0vLFc9e19iYWNrcGVkYWw6QyxhbnlQdW5jdHVhdGlvbjpHZSxhdXRvbGluazpOZSxibG9ja1NraXA6QmUsYnI6b2UsY29kZTp6ZSxkZWw6QyxlbVN0cm9uZ0xEZWxpbTpxZSxlbVN0cm9uZ1JEZWxpbUFzdDpEZSxlbVN0cm9uZ1JEZWxpbVVuZDpaZSxlc2NhcGU6TWUsbGluazpqZSxub2xpbms6aGUscHVuY3R1YXRpb246Q2UscmVmbGluazpjZSxyZWZsaW5rU2VhcmNoOlVlLHRhZzpGZSx0ZXh0OkFlLHVybDpDfSxLZT17Li4uVyxsaW5rOmsoL14hP1xcWyhsYWJlbClcXF1cXCgoLio/KVxcKS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLmdldFJlZ2V4KCkscmVmbGluazprKC9eIT9cXFsobGFiZWwpXFxdXFxzKlxcWyhbXlxcXV0qKVxcXS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLmdldFJlZ2V4KCl9LEc9ey4uLlcsZW1TdHJvbmdSRGVsaW1Bc3Q6SGUsZW1TdHJvbmdMRGVsaW06dmUsdXJsOmsoL14oKD86cHJvdG9jb2wpOlxcL1xcL3x3d3dcXC4pKD86W2EtekEtWjAtOVxcLV0rXFwuPykrW15cXHM8XSp8XmVtYWlsLykucmVwbGFjZShcInByb3RvY29sXCIsbmUpLnJlcGxhY2UoXCJlbWFpbFwiLC9bQS1aYS16MC05Ll8rLV0rKEApW2EtekEtWjAtOS1fXSsoPzpcXC5bYS16QS1aMC05LV9dKlthLXpBLVowLTldKSsoPyFbLV9dKS8pLmdldFJlZ2V4KCksX2JhY2twZWRhbDovKD86W14/IS4sOjsqXydcIn4oKSZdK3xcXChbXildKlxcKXwmKD8hW2EtekEtWjAtOV0rOyQpfFs/IS4sOjsqXydcIn4pXSsoPyEkKSkrLyxkZWw6L14ofn4/KSg/PVteXFxzfl0pKCg/OlxcXFxbXFxzXFxTXXxbXlxcXFxdKSo/KD86XFxcXFtcXHNcXFNdfFteXFxzflxcXFxdKSlcXDEoPz1bXn5dfCQpLyx0ZXh0OmsoL14oW2B+XSt8W15gfl0pKD86KD89IHsyLH1cXG4pfCg/PVthLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0rQCl8W1xcc1xcU10qPyg/Oig/PVtcXFxcPCFcXFtgKn5fXXxcXGJffHByb3RvY29sOlxcL1xcL3x3d3dcXC58JCl8W14gXSg/PSB7Mix9XFxuKXxbXmEtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXSg/PVthLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0rQCkpKS8pLnJlcGxhY2UoXCJwcm90b2NvbFwiLG5lKS5nZXRSZWdleCgpfSxXZT17Li4uRyxicjprKG9lKS5yZXBsYWNlKFwiezIsfVwiLFwiKlwiKS5nZXRSZWdleCgpLHRleHQ6ayhHLnRleHQpLnJlcGxhY2UoXCJcXFxcYl9cIixcIlxcXFxiX3wgezIsfVxcXFxuXCIpLnJlcGxhY2UoL1xcezIsXFx9L2csXCIqXCIpLmdldFJlZ2V4KCl9LEU9e25vcm1hbDpVLGdmbTpfZSxwZWRhbnRpYzpMZX0sTT17bm9ybWFsOlcsZ2ZtOkcsYnJlYWtzOldlLHBlZGFudGljOktlfTt2YXIgWGU9e1wiJlwiOlwiJmFtcDtcIixcIjxcIjpcIiZsdDtcIixcIj5cIjpcIiZndDtcIiwnXCInOlwiJnF1b3Q7XCIsXCInXCI6XCImIzM5O1wifSxrZT11PT5YZVt1XTtmdW5jdGlvbiB3KHUsZSl7aWYoZSl7aWYobS5lc2NhcGVUZXN0LnRlc3QodSkpcmV0dXJuIHUucmVwbGFjZShtLmVzY2FwZVJlcGxhY2Usa2UpfWVsc2UgaWYobS5lc2NhcGVUZXN0Tm9FbmNvZGUudGVzdCh1KSlyZXR1cm4gdS5yZXBsYWNlKG0uZXNjYXBlUmVwbGFjZU5vRW5jb2RlLGtlKTtyZXR1cm4gdX1mdW5jdGlvbiBYKHUpe3RyeXt1PWVuY29kZVVSSSh1KS5yZXBsYWNlKG0ucGVyY2VudERlY29kZSxcIiVcIil9Y2F0Y2h7cmV0dXJuIG51bGx9cmV0dXJuIHV9ZnVuY3Rpb24gSih1LGUpe2xldCB0PXUucmVwbGFjZShtLmZpbmRQaXBlLChpLHMsYSk9PntsZXQgbz0hMSxsPXM7Zm9yKDstLWw+PTAmJmFbbF09PT1cIlxcXFxcIjspbz0hbztyZXR1cm4gbz9cInxcIjpcIiB8XCJ9KSxuPXQuc3BsaXQobS5zcGxpdFBpcGUpLHI9MDtpZihuWzBdLnRyaW0oKXx8bi5zaGlmdCgpLG4ubGVuZ3RoPjAmJiFuLmF0KC0xKT8udHJpbSgpJiZuLnBvcCgpLGUpaWYobi5sZW5ndGg+ZSluLnNwbGljZShlKTtlbHNlIGZvcig7bi5sZW5ndGg8ZTspbi5wdXNoKFwiXCIpO2Zvcig7cjxuLmxlbmd0aDtyKyspbltyXT1uW3JdLnRyaW0oKS5yZXBsYWNlKG0uc2xhc2hQaXBlLFwifFwiKTtyZXR1cm4gbn1mdW5jdGlvbiB6KHUsZSx0KXtsZXQgbj11Lmxlbmd0aDtpZihuPT09MClyZXR1cm5cIlwiO2xldCByPTA7Zm9yKDtyPG47KXtsZXQgaT11LmNoYXJBdChuLXItMSk7aWYoaT09PWUmJiF0KXIrKztlbHNlIGlmKGkhPT1lJiZ0KXIrKztlbHNlIGJyZWFrfXJldHVybiB1LnNsaWNlKDAsbi1yKX1mdW5jdGlvbiBkZSh1LGUpe2lmKHUuaW5kZXhPZihlWzFdKT09PS0xKXJldHVybi0xO2xldCB0PTA7Zm9yKGxldCBuPTA7bjx1Lmxlbmd0aDtuKyspaWYodVtuXT09PVwiXFxcXFwiKW4rKztlbHNlIGlmKHVbbl09PT1lWzBdKXQrKztlbHNlIGlmKHVbbl09PT1lWzFdJiYodC0tLHQ8MCkpcmV0dXJuIG47cmV0dXJuIHQ+MD8tMjotMX1mdW5jdGlvbiBnZSh1LGUsdCxuLHIpe2xldCBpPWUuaHJlZixzPWUudGl0bGV8fG51bGwsYT11WzFdLnJlcGxhY2Uoci5vdGhlci5vdXRwdXRMaW5rUmVwbGFjZSxcIiQxXCIpO24uc3RhdGUuaW5MaW5rPSEwO2xldCBvPXt0eXBlOnVbMF0uY2hhckF0KDApPT09XCIhXCI/XCJpbWFnZVwiOlwibGlua1wiLHJhdzp0LGhyZWY6aSx0aXRsZTpzLHRleHQ6YSx0b2tlbnM6bi5pbmxpbmVUb2tlbnMoYSl9O3JldHVybiBuLnN0YXRlLmluTGluaz0hMSxvfWZ1bmN0aW9uIEplKHUsZSx0KXtsZXQgbj11Lm1hdGNoKHQub3RoZXIuaW5kZW50Q29kZUNvbXBlbnNhdGlvbik7aWYobj09PW51bGwpcmV0dXJuIGU7bGV0IHI9blsxXTtyZXR1cm4gZS5zcGxpdChgXG5gKS5tYXAoaT0+e2xldCBzPWkubWF0Y2godC5vdGhlci5iZWdpbm5pbmdTcGFjZSk7aWYocz09PW51bGwpcmV0dXJuIGk7bGV0W2FdPXM7cmV0dXJuIGEubGVuZ3RoPj1yLmxlbmd0aD9pLnNsaWNlKHIubGVuZ3RoKTppfSkuam9pbihgXG5gKX12YXIgeT1jbGFzc3tvcHRpb25zO3J1bGVzO2xleGVyO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxUfXNwYWNlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2submV3bGluZS5leGVjKGUpO2lmKHQmJnRbMF0ubGVuZ3RoPjApcmV0dXJue3R5cGU6XCJzcGFjZVwiLHJhdzp0WzBdfX1jb2RlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suY29kZS5leGVjKGUpO2lmKHQpe2xldCBuPXRbMF0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmNvZGVSZW1vdmVJbmRlbnQsXCJcIik7cmV0dXJue3R5cGU6XCJjb2RlXCIscmF3OnRbMF0sY29kZUJsb2NrU3R5bGU6XCJpbmRlbnRlZFwiLHRleHQ6dGhpcy5vcHRpb25zLnBlZGFudGljP246eihuLGBcbmApfX19ZmVuY2VzKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suZmVuY2VzLmV4ZWMoZSk7aWYodCl7bGV0IG49dFswXSxyPUplKG4sdFszXXx8XCJcIix0aGlzLnJ1bGVzKTtyZXR1cm57dHlwZTpcImNvZGVcIixyYXc6bixsYW5nOnRbMl0/dFsyXS50cmltKCkucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpOnRbMl0sdGV4dDpyfX19aGVhZGluZyhlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmhlYWRpbmcuZXhlYyhlKTtpZih0KXtsZXQgbj10WzJdLnRyaW0oKTtpZih0aGlzLnJ1bGVzLm90aGVyLmVuZGluZ0hhc2gudGVzdChuKSl7bGV0IHI9eihuLFwiI1wiKTsodGhpcy5vcHRpb25zLnBlZGFudGljfHwhcnx8dGhpcy5ydWxlcy5vdGhlci5lbmRpbmdTcGFjZUNoYXIudGVzdChyKSkmJihuPXIudHJpbSgpKX1yZXR1cm57dHlwZTpcImhlYWRpbmdcIixyYXc6dFswXSxkZXB0aDp0WzFdLmxlbmd0aCx0ZXh0Om4sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG4pfX19aHIoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5oci5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJoclwiLHJhdzp6KHRbMF0sYFxuYCl9fWJsb2NrcXVvdGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5ibG9ja3F1b3RlLmV4ZWMoZSk7aWYodCl7bGV0IG49eih0WzBdLGBcbmApLnNwbGl0KGBcbmApLHI9XCJcIixpPVwiXCIscz1bXTtmb3IoO24ubGVuZ3RoPjA7KXtsZXQgYT0hMSxvPVtdLGw7Zm9yKGw9MDtsPG4ubGVuZ3RoO2wrKylpZih0aGlzLnJ1bGVzLm90aGVyLmJsb2NrcXVvdGVTdGFydC50ZXN0KG5bbF0pKW8ucHVzaChuW2xdKSxhPSEwO2Vsc2UgaWYoIWEpby5wdXNoKG5bbF0pO2Vsc2UgYnJlYWs7bj1uLnNsaWNlKGwpO2xldCBwPW8uam9pbihgXG5gKSxjPXAucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmJsb2NrcXVvdGVTZXRleHRSZXBsYWNlLGBcbiAgICAkMWApLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5ibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZTIsXCJcIik7cj1yP2Ake3J9XG4ke3B9YDpwLGk9aT9gJHtpfVxuJHtjfWA6YztsZXQgZz10aGlzLmxleGVyLnN0YXRlLnRvcDtpZih0aGlzLmxleGVyLnN0YXRlLnRvcD0hMCx0aGlzLmxleGVyLmJsb2NrVG9rZW5zKGMscywhMCksdGhpcy5sZXhlci5zdGF0ZS50b3A9ZyxuLmxlbmd0aD09PTApYnJlYWs7bGV0IGg9cy5hdCgtMSk7aWYoaD8udHlwZT09PVwiY29kZVwiKWJyZWFrO2lmKGg/LnR5cGU9PT1cImJsb2NrcXVvdGVcIil7bGV0IFI9aCxmPVIucmF3K2BcbmArbi5qb2luKGBcbmApLE89dGhpcy5ibG9ja3F1b3RlKGYpO3Nbcy5sZW5ndGgtMV09TyxyPXIuc3Vic3RyaW5nKDAsci5sZW5ndGgtUi5yYXcubGVuZ3RoKStPLnJhdyxpPWkuc3Vic3RyaW5nKDAsaS5sZW5ndGgtUi50ZXh0Lmxlbmd0aCkrTy50ZXh0O2JyZWFrfWVsc2UgaWYoaD8udHlwZT09PVwibGlzdFwiKXtsZXQgUj1oLGY9Ui5yYXcrYFxuYCtuLmpvaW4oYFxuYCksTz10aGlzLmxpc3QoZik7c1tzLmxlbmd0aC0xXT1PLHI9ci5zdWJzdHJpbmcoMCxyLmxlbmd0aC1oLnJhdy5sZW5ndGgpK08ucmF3LGk9aS5zdWJzdHJpbmcoMCxpLmxlbmd0aC1SLnJhdy5sZW5ndGgpK08ucmF3LG49Zi5zdWJzdHJpbmcocy5hdCgtMSkucmF3Lmxlbmd0aCkuc3BsaXQoYFxuYCk7Y29udGludWV9fXJldHVybnt0eXBlOlwiYmxvY2txdW90ZVwiLHJhdzpyLHRva2VuczpzLHRleHQ6aX19fWxpc3QoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5saXN0LmV4ZWMoZSk7aWYodCl7bGV0IG49dFsxXS50cmltKCkscj1uLmxlbmd0aD4xLGk9e3R5cGU6XCJsaXN0XCIscmF3OlwiXCIsb3JkZXJlZDpyLHN0YXJ0OnI/K24uc2xpY2UoMCwtMSk6XCJcIixsb29zZTohMSxpdGVtczpbXX07bj1yP2BcXFxcZHsxLDl9XFxcXCR7bi5zbGljZSgtMSl9YDpgXFxcXCR7bn1gLHRoaXMub3B0aW9ucy5wZWRhbnRpYyYmKG49cj9uOlwiWyorLV1cIik7bGV0IHM9dGhpcy5ydWxlcy5vdGhlci5saXN0SXRlbVJlZ2V4KG4pLGE9ITE7Zm9yKDtlOyl7bGV0IGw9ITEscD1cIlwiLGM9XCJcIjtpZighKHQ9cy5leGVjKGUpKXx8dGhpcy5ydWxlcy5ibG9jay5oci50ZXN0KGUpKWJyZWFrO3A9dFswXSxlPWUuc3Vic3RyaW5nKHAubGVuZ3RoKTtsZXQgZz10WzJdLnNwbGl0KGBcbmAsMSlbMF0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFicyxPPT5cIiBcIi5yZXBlYXQoMypPLmxlbmd0aCkpLGg9ZS5zcGxpdChgXG5gLDEpWzBdLFI9IWcudHJpbSgpLGY9MDtpZih0aGlzLm9wdGlvbnMucGVkYW50aWM/KGY9MixjPWcudHJpbVN0YXJ0KCkpOlI/Zj10WzFdLmxlbmd0aCsxOihmPXRbMl0uc2VhcmNoKHRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyKSxmPWY+ND8xOmYsYz1nLnNsaWNlKGYpLGYrPXRbMV0ubGVuZ3RoKSxSJiZ0aGlzLnJ1bGVzLm90aGVyLmJsYW5rTGluZS50ZXN0KGgpJiYocCs9aCtgXG5gLGU9ZS5zdWJzdHJpbmcoaC5sZW5ndGgrMSksbD0hMCksIWwpe2xldCBPPXRoaXMucnVsZXMub3RoZXIubmV4dEJ1bGxldFJlZ2V4KGYpLFY9dGhpcy5ydWxlcy5vdGhlci5oclJlZ2V4KGYpLFk9dGhpcy5ydWxlcy5vdGhlci5mZW5jZXNCZWdpblJlZ2V4KGYpLGVlPXRoaXMucnVsZXMub3RoZXIuaGVhZGluZ0JlZ2luUmVnZXgoZiksZmU9dGhpcy5ydWxlcy5vdGhlci5odG1sQmVnaW5SZWdleChmKTtmb3IoO2U7KXtsZXQgSD1lLnNwbGl0KGBcbmAsMSlbMF0sQTtpZihoPUgsdGhpcy5vcHRpb25zLnBlZGFudGljPyhoPWgucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlTmVzdGluZyxcIiAgXCIpLEE9aCk6QT1oLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJDaGFyR2xvYmFsLFwiICAgIFwiKSxZLnRlc3QoaCl8fGVlLnRlc3QoaCl8fGZlLnRlc3QoaCl8fE8udGVzdChoKXx8Vi50ZXN0KGgpKWJyZWFrO2lmKEEuc2VhcmNoKHRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyKT49Znx8IWgudHJpbSgpKWMrPWBcbmArQS5zbGljZShmKTtlbHNle2lmKFJ8fGcucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYkNoYXJHbG9iYWwsXCIgICAgXCIpLnNlYXJjaCh0aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhcik+PTR8fFkudGVzdChnKXx8ZWUudGVzdChnKXx8Vi50ZXN0KGcpKWJyZWFrO2MrPWBcbmAraH0hUiYmIWgudHJpbSgpJiYoUj0hMCkscCs9SCtgXG5gLGU9ZS5zdWJzdHJpbmcoSC5sZW5ndGgrMSksZz1BLnNsaWNlKGYpfX1pLmxvb3NlfHwoYT9pLmxvb3NlPSEwOnRoaXMucnVsZXMub3RoZXIuZG91YmxlQmxhbmtMaW5lLnRlc3QocCkmJihhPSEwKSksaS5pdGVtcy5wdXNoKHt0eXBlOlwibGlzdF9pdGVtXCIscmF3OnAsdGFzazohIXRoaXMub3B0aW9ucy5nZm0mJnRoaXMucnVsZXMub3RoZXIubGlzdElzVGFzay50ZXN0KGMpLGxvb3NlOiExLHRleHQ6Yyx0b2tlbnM6W119KSxpLnJhdys9cH1sZXQgbz1pLml0ZW1zLmF0KC0xKTtpZihvKW8ucmF3PW8ucmF3LnRyaW1FbmQoKSxvLnRleHQ9by50ZXh0LnRyaW1FbmQoKTtlbHNlIHJldHVybjtpLnJhdz1pLnJhdy50cmltRW5kKCk7Zm9yKGxldCBsIG9mIGkuaXRlbXMpe2lmKHRoaXMubGV4ZXIuc3RhdGUudG9wPSExLGwudG9rZW5zPXRoaXMubGV4ZXIuYmxvY2tUb2tlbnMobC50ZXh0LFtdKSxsLnRhc2spe2lmKGwudGV4dD1sLnRleHQucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKSxsLnRva2Vuc1swXT8udHlwZT09PVwidGV4dFwifHxsLnRva2Vuc1swXT8udHlwZT09PVwicGFyYWdyYXBoXCIpe2wudG9rZW5zWzBdLnJhdz1sLnRva2Vuc1swXS5yYXcucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKSxsLnRva2Vuc1swXS50ZXh0PWwudG9rZW5zWzBdLnRleHQucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKTtmb3IobGV0IGM9dGhpcy5sZXhlci5pbmxpbmVRdWV1ZS5sZW5ndGgtMTtjPj0wO2MtLSlpZih0aGlzLnJ1bGVzLm90aGVyLmxpc3RJc1Rhc2sudGVzdCh0aGlzLmxleGVyLmlubGluZVF1ZXVlW2NdLnNyYykpe3RoaXMubGV4ZXIuaW5saW5lUXVldWVbY10uc3JjPXRoaXMubGV4ZXIuaW5saW5lUXVldWVbY10uc3JjLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIik7YnJlYWt9fWxldCBwPXRoaXMucnVsZXMub3RoZXIubGlzdFRhc2tDaGVja2JveC5leGVjKGwucmF3KTtpZihwKXtsZXQgYz17dHlwZTpcImNoZWNrYm94XCIscmF3OnBbMF0rXCIgXCIsY2hlY2tlZDpwWzBdIT09XCJbIF1cIn07bC5jaGVja2VkPWMuY2hlY2tlZCxpLmxvb3NlP2wudG9rZW5zWzBdJiZbXCJwYXJhZ3JhcGhcIixcInRleHRcIl0uaW5jbHVkZXMobC50b2tlbnNbMF0udHlwZSkmJlwidG9rZW5zXCJpbiBsLnRva2Vuc1swXSYmbC50b2tlbnNbMF0udG9rZW5zPyhsLnRva2Vuc1swXS5yYXc9Yy5yYXcrbC50b2tlbnNbMF0ucmF3LGwudG9rZW5zWzBdLnRleHQ9Yy5yYXcrbC50b2tlbnNbMF0udGV4dCxsLnRva2Vuc1swXS50b2tlbnMudW5zaGlmdChjKSk6bC50b2tlbnMudW5zaGlmdCh7dHlwZTpcInBhcmFncmFwaFwiLHJhdzpjLnJhdyx0ZXh0OmMucmF3LHRva2VuczpbY119KTpsLnRva2Vucy51bnNoaWZ0KGMpfX1pZighaS5sb29zZSl7bGV0IHA9bC50b2tlbnMuZmlsdGVyKGc9PmcudHlwZT09PVwic3BhY2VcIiksYz1wLmxlbmd0aD4wJiZwLnNvbWUoZz0+dGhpcy5ydWxlcy5vdGhlci5hbnlMaW5lLnRlc3QoZy5yYXcpKTtpLmxvb3NlPWN9fWlmKGkubG9vc2UpZm9yKGxldCBsIG9mIGkuaXRlbXMpe2wubG9vc2U9ITA7Zm9yKGxldCBwIG9mIGwudG9rZW5zKXAudHlwZT09PVwidGV4dFwiJiYocC50eXBlPVwicGFyYWdyYXBoXCIpfXJldHVybiBpfX1odG1sKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suaHRtbC5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJodG1sXCIsYmxvY2s6ITAscmF3OnRbMF0scHJlOnRbMV09PT1cInByZVwifHx0WzFdPT09XCJzY3JpcHRcInx8dFsxXT09PVwic3R5bGVcIix0ZXh0OnRbMF19fWRlZihlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmRlZi5leGVjKGUpO2lmKHQpe2xldCBuPXRbMV0udG9Mb3dlckNhc2UoKS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubXVsdGlwbGVTcGFjZUdsb2JhbCxcIiBcIikscj10WzJdP3RbMl0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmhyZWZCcmFja2V0cyxcIiQxXCIpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKTpcIlwiLGk9dFszXT90WzNdLnN1YnN0cmluZygxLHRbM10ubGVuZ3RoLTEpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKTp0WzNdO3JldHVybnt0eXBlOlwiZGVmXCIsdGFnOm4scmF3OnRbMF0saHJlZjpyLHRpdGxlOml9fX10YWJsZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLnRhYmxlLmV4ZWMoZSk7aWYoIXR8fCF0aGlzLnJ1bGVzLm90aGVyLnRhYmxlRGVsaW1pdGVyLnRlc3QodFsyXSkpcmV0dXJuO2xldCBuPUoodFsxXSkscj10WzJdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduQ2hhcnMsXCJcIikuc3BsaXQoXCJ8XCIpLGk9dFszXT8udHJpbSgpP3RbM10ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYmxlUm93QmxhbmtMaW5lLFwiXCIpLnNwbGl0KGBcbmApOltdLHM9e3R5cGU6XCJ0YWJsZVwiLHJhdzp0WzBdLGhlYWRlcjpbXSxhbGlnbjpbXSxyb3dzOltdfTtpZihuLmxlbmd0aD09PXIubGVuZ3RoKXtmb3IobGV0IGEgb2Ygcil0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25SaWdodC50ZXN0KGEpP3MuYWxpZ24ucHVzaChcInJpZ2h0XCIpOnRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnbkNlbnRlci50ZXN0KGEpP3MuYWxpZ24ucHVzaChcImNlbnRlclwiKTp0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25MZWZ0LnRlc3QoYSk/cy5hbGlnbi5wdXNoKFwibGVmdFwiKTpzLmFsaWduLnB1c2gobnVsbCk7Zm9yKGxldCBhPTA7YTxuLmxlbmd0aDthKyspcy5oZWFkZXIucHVzaCh7dGV4dDpuW2FdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShuW2FdKSxoZWFkZXI6ITAsYWxpZ246cy5hbGlnblthXX0pO2ZvcihsZXQgYSBvZiBpKXMucm93cy5wdXNoKEooYSxzLmhlYWRlci5sZW5ndGgpLm1hcCgobyxsKT0+KHt0ZXh0Om8sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG8pLGhlYWRlcjohMSxhbGlnbjpzLmFsaWduW2xdfSkpKTtyZXR1cm4gc319bGhlYWRpbmcoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5saGVhZGluZy5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJoZWFkaW5nXCIscmF3OnRbMF0sZGVwdGg6dFsyXS5jaGFyQXQoMCk9PT1cIj1cIj8xOjIsdGV4dDp0WzFdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZSh0WzFdKX19cGFyYWdyYXBoKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2sucGFyYWdyYXBoLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsxXS5jaGFyQXQodFsxXS5sZW5ndGgtMSk9PT1gXG5gP3RbMV0uc2xpY2UoMCwtMSk6dFsxXTtyZXR1cm57dHlwZTpcInBhcmFncmFwaFwiLHJhdzp0WzBdLHRleHQ6bix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUobil9fX10ZXh0KGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2sudGV4dC5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJ0ZXh0XCIscmF3OnRbMF0sdGV4dDp0WzBdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZSh0WzBdKX19ZXNjYXBlKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmVzY2FwZS5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJlc2NhcGVcIixyYXc6dFswXSx0ZXh0OnRbMV19fXRhZyhlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS50YWcuZXhlYyhlKTtpZih0KXJldHVybiF0aGlzLmxleGVyLnN0YXRlLmluTGluayYmdGhpcy5ydWxlcy5vdGhlci5zdGFydEFUYWcudGVzdCh0WzBdKT90aGlzLmxleGVyLnN0YXRlLmluTGluaz0hMDp0aGlzLmxleGVyLnN0YXRlLmluTGluayYmdGhpcy5ydWxlcy5vdGhlci5lbmRBVGFnLnRlc3QodFswXSkmJih0aGlzLmxleGVyLnN0YXRlLmluTGluaz0hMSksIXRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayYmdGhpcy5ydWxlcy5vdGhlci5zdGFydFByZVNjcmlwdFRhZy50ZXN0KHRbMF0pP3RoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jaz0hMDp0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2smJnRoaXMucnVsZXMub3RoZXIuZW5kUHJlU2NyaXB0VGFnLnRlc3QodFswXSkmJih0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2s9ITEpLHt0eXBlOlwiaHRtbFwiLHJhdzp0WzBdLGluTGluazp0aGlzLmxleGVyLnN0YXRlLmluTGluayxpblJhd0Jsb2NrOnRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayxibG9jazohMSx0ZXh0OnRbMF19fWxpbmsoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUubGluay5leGVjKGUpO2lmKHQpe2xldCBuPXRbMl0udHJpbSgpO2lmKCF0aGlzLm9wdGlvbnMucGVkYW50aWMmJnRoaXMucnVsZXMub3RoZXIuc3RhcnRBbmdsZUJyYWNrZXQudGVzdChuKSl7aWYoIXRoaXMucnVsZXMub3RoZXIuZW5kQW5nbGVCcmFja2V0LnRlc3QobikpcmV0dXJuO2xldCBzPXoobi5zbGljZSgwLC0xKSxcIlxcXFxcIik7aWYoKG4ubGVuZ3RoLXMubGVuZ3RoKSUyPT09MClyZXR1cm59ZWxzZXtsZXQgcz1kZSh0WzJdLFwiKClcIik7aWYocz09PS0yKXJldHVybjtpZihzPi0xKXtsZXQgbz0odFswXS5pbmRleE9mKFwiIVwiKT09PTA/NTo0KSt0WzFdLmxlbmd0aCtzO3RbMl09dFsyXS5zdWJzdHJpbmcoMCxzKSx0WzBdPXRbMF0uc3Vic3RyaW5nKDAsbykudHJpbSgpLHRbM109XCJcIn19bGV0IHI9dFsyXSxpPVwiXCI7aWYodGhpcy5vcHRpb25zLnBlZGFudGljKXtsZXQgcz10aGlzLnJ1bGVzLm90aGVyLnBlZGFudGljSHJlZlRpdGxlLmV4ZWMocik7cyYmKHI9c1sxXSxpPXNbM10pfWVsc2UgaT10WzNdP3RbM10uc2xpY2UoMSwtMSk6XCJcIjtyZXR1cm4gcj1yLnRyaW0oKSx0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0QW5nbGVCcmFja2V0LnRlc3QocikmJih0aGlzLm9wdGlvbnMucGVkYW50aWMmJiF0aGlzLnJ1bGVzLm90aGVyLmVuZEFuZ2xlQnJhY2tldC50ZXN0KG4pP3I9ci5zbGljZSgxKTpyPXIuc2xpY2UoMSwtMSkpLGdlKHQse2hyZWY6ciYmci5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIiksdGl0bGU6aSYmaS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIil9LHRbMF0sdGhpcy5sZXhlcix0aGlzLnJ1bGVzKX19cmVmbGluayhlLHQpe2xldCBuO2lmKChuPXRoaXMucnVsZXMuaW5saW5lLnJlZmxpbmsuZXhlYyhlKSl8fChuPXRoaXMucnVsZXMuaW5saW5lLm5vbGluay5leGVjKGUpKSl7bGV0IHI9KG5bMl18fG5bMV0pLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5tdWx0aXBsZVNwYWNlR2xvYmFsLFwiIFwiKSxpPXRbci50b0xvd2VyQ2FzZSgpXTtpZighaSl7bGV0IHM9blswXS5jaGFyQXQoMCk7cmV0dXJue3R5cGU6XCJ0ZXh0XCIscmF3OnMsdGV4dDpzfX1yZXR1cm4gZ2UobixpLG5bMF0sdGhpcy5sZXhlcix0aGlzLnJ1bGVzKX19ZW1TdHJvbmcoZSx0LG49XCJcIil7bGV0IHI9dGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmdMRGVsaW0uZXhlYyhlKTtpZighcnx8clszXSYmbi5tYXRjaCh0aGlzLnJ1bGVzLm90aGVyLnVuaWNvZGVBbHBoYU51bWVyaWMpKXJldHVybjtpZighKHJbMV18fHJbMl18fFwiXCIpfHwhbnx8dGhpcy5ydWxlcy5pbmxpbmUucHVuY3R1YXRpb24uZXhlYyhuKSl7bGV0IHM9Wy4uLnJbMF1dLmxlbmd0aC0xLGEsbyxsPXMscD0wLGM9clswXVswXT09PVwiKlwiP3RoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nUkRlbGltQXN0OnRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nUkRlbGltVW5kO2ZvcihjLmxhc3RJbmRleD0wLHQ9dC5zbGljZSgtMSplLmxlbmd0aCtzKTsocj1jLmV4ZWModCkpIT1udWxsOyl7aWYoYT1yWzFdfHxyWzJdfHxyWzNdfHxyWzRdfHxyWzVdfHxyWzZdLCFhKWNvbnRpbnVlO2lmKG89Wy4uLmFdLmxlbmd0aCxyWzNdfHxyWzRdKXtsKz1vO2NvbnRpbnVlfWVsc2UgaWYoKHJbNV18fHJbNl0pJiZzJTMmJiEoKHMrbyklMykpe3ArPW87Y29udGludWV9aWYobC09byxsPjApY29udGludWU7bz1NYXRoLm1pbihvLG8rbCtwKTtsZXQgZz1bLi4uclswXV1bMF0ubGVuZ3RoLGg9ZS5zbGljZSgwLHMrci5pbmRleCtnK28pO2lmKE1hdGgubWluKHMsbyklMil7bGV0IGY9aC5zbGljZSgxLC0xKTtyZXR1cm57dHlwZTpcImVtXCIscmF3OmgsdGV4dDpmLHRva2Vuczp0aGlzLmxleGVyLmlubGluZVRva2VucyhmKX19bGV0IFI9aC5zbGljZSgyLC0yKTtyZXR1cm57dHlwZTpcInN0cm9uZ1wiLHJhdzpoLHRleHQ6Uix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmVUb2tlbnMoUil9fX19Y29kZXNwYW4oZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuY29kZS5leGVjKGUpO2lmKHQpe2xldCBuPXRbMl0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLm5ld0xpbmVDaGFyR2xvYmFsLFwiIFwiKSxyPXRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyLnRlc3QobiksaT10aGlzLnJ1bGVzLm90aGVyLnN0YXJ0aW5nU3BhY2VDaGFyLnRlc3QobikmJnRoaXMucnVsZXMub3RoZXIuZW5kaW5nU3BhY2VDaGFyLnRlc3Qobik7cmV0dXJuIHImJmkmJihuPW4uc3Vic3RyaW5nKDEsbi5sZW5ndGgtMSkpLHt0eXBlOlwiY29kZXNwYW5cIixyYXc6dFswXSx0ZXh0Om59fX1icihlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5ici5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJiclwiLHJhdzp0WzBdfX1kZWwoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuZGVsLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImRlbFwiLHJhdzp0WzBdLHRleHQ6dFsyXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmVUb2tlbnModFsyXSl9fWF1dG9saW5rKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmF1dG9saW5rLmV4ZWMoZSk7aWYodCl7bGV0IG4scjtyZXR1cm4gdFsyXT09PVwiQFwiPyhuPXRbMV0scj1cIm1haWx0bzpcIituKToobj10WzFdLHI9bikse3R5cGU6XCJsaW5rXCIscmF3OnRbMF0sdGV4dDpuLGhyZWY6cix0b2tlbnM6W3t0eXBlOlwidGV4dFwiLHJhdzpuLHRleHQ6bn1dfX19dXJsKGUpe2xldCB0O2lmKHQ9dGhpcy5ydWxlcy5pbmxpbmUudXJsLmV4ZWMoZSkpe2xldCBuLHI7aWYodFsyXT09PVwiQFwiKW49dFswXSxyPVwibWFpbHRvOlwiK247ZWxzZXtsZXQgaTtkbyBpPXRbMF0sdFswXT10aGlzLnJ1bGVzLmlubGluZS5fYmFja3BlZGFsLmV4ZWModFswXSk/LlswXT8/XCJcIjt3aGlsZShpIT09dFswXSk7bj10WzBdLHRbMV09PT1cInd3dy5cIj9yPVwiaHR0cDovL1wiK3RbMF06cj10WzBdfXJldHVybnt0eXBlOlwibGlua1wiLHJhdzp0WzBdLHRleHQ6bixocmVmOnIsdG9rZW5zOlt7dHlwZTpcInRleHRcIixyYXc6bix0ZXh0Om59XX19fWlubGluZVRleHQoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUudGV4dC5leGVjKGUpO2lmKHQpe2xldCBuPXRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jaztyZXR1cm57dHlwZTpcInRleHRcIixyYXc6dFswXSx0ZXh0OnRbMF0sZXNjYXBlZDpufX19fTt2YXIgeD1jbGFzcyB1e3Rva2VucztvcHRpb25zO3N0YXRlO2lubGluZVF1ZXVlO3Rva2VuaXplcjtjb25zdHJ1Y3RvcihlKXt0aGlzLnRva2Vucz1bXSx0aGlzLnRva2Vucy5saW5rcz1PYmplY3QuY3JlYXRlKG51bGwpLHRoaXMub3B0aW9ucz1lfHxULHRoaXMub3B0aW9ucy50b2tlbml6ZXI9dGhpcy5vcHRpb25zLnRva2VuaXplcnx8bmV3IHksdGhpcy50b2tlbml6ZXI9dGhpcy5vcHRpb25zLnRva2VuaXplcix0aGlzLnRva2VuaXplci5vcHRpb25zPXRoaXMub3B0aW9ucyx0aGlzLnRva2VuaXplci5sZXhlcj10aGlzLHRoaXMuaW5saW5lUXVldWU9W10sdGhpcy5zdGF0ZT17aW5MaW5rOiExLGluUmF3QmxvY2s6ITEsdG9wOiEwfTtsZXQgdD17b3RoZXI6bSxibG9jazpFLm5vcm1hbCxpbmxpbmU6TS5ub3JtYWx9O3RoaXMub3B0aW9ucy5wZWRhbnRpYz8odC5ibG9jaz1FLnBlZGFudGljLHQuaW5saW5lPU0ucGVkYW50aWMpOnRoaXMub3B0aW9ucy5nZm0mJih0LmJsb2NrPUUuZ2ZtLHRoaXMub3B0aW9ucy5icmVha3M/dC5pbmxpbmU9TS5icmVha3M6dC5pbmxpbmU9TS5nZm0pLHRoaXMudG9rZW5pemVyLnJ1bGVzPXR9c3RhdGljIGdldCBydWxlcygpe3JldHVybntibG9jazpFLGlubGluZTpNfX1zdGF0aWMgbGV4KGUsdCl7cmV0dXJuIG5ldyB1KHQpLmxleChlKX1zdGF0aWMgbGV4SW5saW5lKGUsdCl7cmV0dXJuIG5ldyB1KHQpLmlubGluZVRva2VucyhlKX1sZXgoZSl7ZT1lLnJlcGxhY2UobS5jYXJyaWFnZVJldHVybixgXG5gKSx0aGlzLmJsb2NrVG9rZW5zKGUsdGhpcy50b2tlbnMpO2ZvcihsZXQgdD0wO3Q8dGhpcy5pbmxpbmVRdWV1ZS5sZW5ndGg7dCsrKXtsZXQgbj10aGlzLmlubGluZVF1ZXVlW3RdO3RoaXMuaW5saW5lVG9rZW5zKG4uc3JjLG4udG9rZW5zKX1yZXR1cm4gdGhpcy5pbmxpbmVRdWV1ZT1bXSx0aGlzLnRva2Vuc31ibG9ja1Rva2VucyhlLHQ9W10sbj0hMSl7Zm9yKHRoaXMub3B0aW9ucy5wZWRhbnRpYyYmKGU9ZS5yZXBsYWNlKG0udGFiQ2hhckdsb2JhbCxcIiAgICBcIikucmVwbGFjZShtLnNwYWNlTGluZSxcIlwiKSk7ZTspe2xldCByO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5ibG9jaz8uc29tZShzPT4ocj1zLmNhbGwoe2xleGVyOnRoaXN9LGUsdCkpPyhlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpLCEwKTohMSkpY29udGludWU7aWYocj10aGlzLnRva2VuaXplci5zcGFjZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3IucmF3Lmxlbmd0aD09PTEmJnMhPT12b2lkIDA/cy5yYXcrPWBcbmA6dC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuY29kZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3M/LnR5cGU9PT1cInBhcmFncmFwaFwifHxzPy50eXBlPT09XCJ0ZXh0XCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci50ZXh0LHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmZlbmNlcyhlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmhlYWRpbmcoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5ocihlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmJsb2NrcXVvdGUoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5saXN0KGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuaHRtbChlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmRlZihlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3M/LnR5cGU9PT1cInBhcmFncmFwaFwifHxzPy50eXBlPT09XCJ0ZXh0XCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci5yYXcsdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dGhpcy50b2tlbnMubGlua3Nbci50YWddfHwodGhpcy50b2tlbnMubGlua3Nbci50YWddPXtocmVmOnIuaHJlZix0aXRsZTpyLnRpdGxlfSx0LnB1c2gocikpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIudGFibGUoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5saGVhZGluZyhlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1sZXQgaT1lO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5zdGFydEJsb2NrKXtsZXQgcz0xLzAsYT1lLnNsaWNlKDEpLG87dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRCbG9jay5mb3JFYWNoKGw9PntvPWwuY2FsbCh7bGV4ZXI6dGhpc30sYSksdHlwZW9mIG89PVwibnVtYmVyXCImJm8+PTAmJihzPU1hdGgubWluKHMsbykpfSksczwxLzAmJnM+PTAmJihpPWUuc3Vic3RyaW5nKDAscysxKSl9aWYodGhpcy5zdGF0ZS50b3AmJihyPXRoaXMudG9rZW5pemVyLnBhcmFncmFwaChpKSkpe2xldCBzPXQuYXQoLTEpO24mJnM/LnR5cGU9PT1cInBhcmFncmFwaFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IudGV4dCx0aGlzLmlubGluZVF1ZXVlLnBvcCgpLHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnQucHVzaChyKSxuPWkubGVuZ3RoIT09ZS5sZW5ndGgsZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIudGV4dChlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpO2xldCBzPXQuYXQoLTEpO3M/LnR5cGU9PT1cInRleHRcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnRleHQsdGhpcy5pbmxpbmVRdWV1ZS5wb3AoKSx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0LnB1c2gocik7Y29udGludWV9aWYoZSl7bGV0IHM9XCJJbmZpbml0ZSBsb29wIG9uIGJ5dGU6IFwiK2UuY2hhckNvZGVBdCgwKTtpZih0aGlzLm9wdGlvbnMuc2lsZW50KXtjb25zb2xlLmVycm9yKHMpO2JyZWFrfWVsc2UgdGhyb3cgbmV3IEVycm9yKHMpfX1yZXR1cm4gdGhpcy5zdGF0ZS50b3A9ITAsdH1pbmxpbmUoZSx0PVtdKXtyZXR1cm4gdGhpcy5pbmxpbmVRdWV1ZS5wdXNoKHtzcmM6ZSx0b2tlbnM6dH0pLHR9aW5saW5lVG9rZW5zKGUsdD1bXSl7bGV0IG49ZSxyPW51bGw7aWYodGhpcy50b2tlbnMubGlua3Mpe2xldCBvPU9iamVjdC5rZXlzKHRoaXMudG9rZW5zLmxpbmtzKTtpZihvLmxlbmd0aD4wKWZvcig7KHI9dGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLnJlZmxpbmtTZWFyY2guZXhlYyhuKSkhPW51bGw7KW8uaW5jbHVkZXMoclswXS5zbGljZShyWzBdLmxhc3RJbmRleE9mKFwiW1wiKSsxLC0xKSkmJihuPW4uc2xpY2UoMCxyLmluZGV4KStcIltcIitcImFcIi5yZXBlYXQoclswXS5sZW5ndGgtMikrXCJdXCIrbi5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUucmVmbGlua1NlYXJjaC5sYXN0SW5kZXgpKX1mb3IoOyhyPXRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbi5leGVjKG4pKSE9bnVsbDspbj1uLnNsaWNlKDAsci5pbmRleCkrXCIrK1wiK24uc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLmxhc3RJbmRleCk7bGV0IGk7Zm9yKDsocj10aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYmxvY2tTa2lwLmV4ZWMobikpIT1udWxsOylpPXJbMl0/clsyXS5sZW5ndGg6MCxuPW4uc2xpY2UoMCxyLmluZGV4K2kpK1wiW1wiK1wiYVwiLnJlcGVhdChyWzBdLmxlbmd0aC1pLTIpK1wiXVwiK24uc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmJsb2NrU2tpcC5sYXN0SW5kZXgpO249dGhpcy5vcHRpb25zLmhvb2tzPy5lbVN0cm9uZ01hc2s/LmNhbGwoe2xleGVyOnRoaXN9LG4pPz9uO2xldCBzPSExLGE9XCJcIjtmb3IoO2U7KXtzfHwoYT1cIlwiKSxzPSExO2xldCBvO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5pbmxpbmU/LnNvbWUocD0+KG89cC5jYWxsKHtsZXhlcjp0aGlzfSxlLHQpKT8oZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKSwhMCk6ITEpKWNvbnRpbnVlO2lmKG89dGhpcy50b2tlbml6ZXIuZXNjYXBlKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIudGFnKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIubGluayhlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLnJlZmxpbmsoZSx0aGlzLnRva2Vucy5saW5rcykpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKTtsZXQgcD10LmF0KC0xKTtvLnR5cGU9PT1cInRleHRcIiYmcD8udHlwZT09PVwidGV4dFwiPyhwLnJhdys9by5yYXcscC50ZXh0Kz1vLnRleHQpOnQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmVtU3Ryb25nKGUsbixhKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmNvZGVzcGFuKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuYnIoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5kZWwoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5hdXRvbGluayhlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZighdGhpcy5zdGF0ZS5pbkxpbmsmJihvPXRoaXMudG9rZW5pemVyLnVybChlKSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9bGV0IGw9ZTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uc3RhcnRJbmxpbmUpe2xldCBwPTEvMCxjPWUuc2xpY2UoMSksZzt0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5zdGFydElubGluZS5mb3JFYWNoKGg9PntnPWguY2FsbCh7bGV4ZXI6dGhpc30sYyksdHlwZW9mIGc9PVwibnVtYmVyXCImJmc+PTAmJihwPU1hdGgubWluKHAsZykpfSkscDwxLzAmJnA+PTAmJihsPWUuc3Vic3RyaW5nKDAscCsxKSl9aWYobz10aGlzLnRva2VuaXplci5pbmxpbmVUZXh0KGwpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksby5yYXcuc2xpY2UoLTEpIT09XCJfXCImJihhPW8ucmF3LnNsaWNlKC0xKSkscz0hMDtsZXQgcD10LmF0KC0xKTtwPy50eXBlPT09XCJ0ZXh0XCI/KHAucmF3Kz1vLnJhdyxwLnRleHQrPW8udGV4dCk6dC5wdXNoKG8pO2NvbnRpbnVlfWlmKGUpe2xldCBwPVwiSW5maW5pdGUgbG9vcCBvbiBieXRlOiBcIitlLmNoYXJDb2RlQXQoMCk7aWYodGhpcy5vcHRpb25zLnNpbGVudCl7Y29uc29sZS5lcnJvcihwKTticmVha31lbHNlIHRocm93IG5ldyBFcnJvcihwKX19cmV0dXJuIHR9fTt2YXIgUD1jbGFzc3tvcHRpb25zO3BhcnNlcjtjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VH1zcGFjZShlKXtyZXR1cm5cIlwifWNvZGUoe3RleHQ6ZSxsYW5nOnQsZXNjYXBlZDpufSl7bGV0IHI9KHR8fFwiXCIpLm1hdGNoKG0ubm90U3BhY2VTdGFydCk/LlswXSxpPWUucmVwbGFjZShtLmVuZGluZ05ld2xpbmUsXCJcIikrYFxuYDtyZXR1cm4gcj8nPHByZT48Y29kZSBjbGFzcz1cImxhbmd1YWdlLScrdyhyKSsnXCI+Jysobj9pOncoaSwhMCkpK2A8L2NvZGU+PC9wcmU+XG5gOlwiPHByZT48Y29kZT5cIisobj9pOncoaSwhMCkpK2A8L2NvZGU+PC9wcmU+XG5gfWJsb2NrcXVvdGUoe3Rva2VuczplfSl7cmV0dXJuYDxibG9ja3F1b3RlPlxuJHt0aGlzLnBhcnNlci5wYXJzZShlKX08L2Jsb2NrcXVvdGU+XG5gfWh0bWwoe3RleHQ6ZX0pe3JldHVybiBlfWRlZihlKXtyZXR1cm5cIlwifWhlYWRpbmcoe3Rva2VuczplLGRlcHRoOnR9KXtyZXR1cm5gPGgke3R9PiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9oJHt0fT5cbmB9aHIoZSl7cmV0dXJuYDxocj5cbmB9bGlzdChlKXtsZXQgdD1lLm9yZGVyZWQsbj1lLnN0YXJ0LHI9XCJcIjtmb3IobGV0IGE9MDthPGUuaXRlbXMubGVuZ3RoO2ErKyl7bGV0IG89ZS5pdGVtc1thXTtyKz10aGlzLmxpc3RpdGVtKG8pfWxldCBpPXQ/XCJvbFwiOlwidWxcIixzPXQmJm4hPT0xPycgc3RhcnQ9XCInK24rJ1wiJzpcIlwiO3JldHVyblwiPFwiK2krcytgPlxuYCtyK1wiPC9cIitpK2A+XG5gfWxpc3RpdGVtKGUpe3JldHVybmA8bGk+JHt0aGlzLnBhcnNlci5wYXJzZShlLnRva2Vucyl9PC9saT5cbmB9Y2hlY2tib3goe2NoZWNrZWQ6ZX0pe3JldHVyblwiPGlucHV0IFwiKyhlPydjaGVja2VkPVwiXCIgJzpcIlwiKSsnZGlzYWJsZWQ9XCJcIiB0eXBlPVwiY2hlY2tib3hcIj4gJ31wYXJhZ3JhcGgoe3Rva2VuczplfSl7cmV0dXJuYDxwPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9wPlxuYH10YWJsZShlKXtsZXQgdD1cIlwiLG49XCJcIjtmb3IobGV0IGk9MDtpPGUuaGVhZGVyLmxlbmd0aDtpKyspbis9dGhpcy50YWJsZWNlbGwoZS5oZWFkZXJbaV0pO3QrPXRoaXMudGFibGVyb3coe3RleHQ6bn0pO2xldCByPVwiXCI7Zm9yKGxldCBpPTA7aTxlLnJvd3MubGVuZ3RoO2krKyl7bGV0IHM9ZS5yb3dzW2ldO249XCJcIjtmb3IobGV0IGE9MDthPHMubGVuZ3RoO2ErKyluKz10aGlzLnRhYmxlY2VsbChzW2FdKTtyKz10aGlzLnRhYmxlcm93KHt0ZXh0Om59KX1yZXR1cm4gciYmKHI9YDx0Ym9keT4ke3J9PC90Ym9keT5gKSxgPHRhYmxlPlxuPHRoZWFkPlxuYCt0K2A8L3RoZWFkPlxuYCtyK2A8L3RhYmxlPlxuYH10YWJsZXJvdyh7dGV4dDplfSl7cmV0dXJuYDx0cj5cbiR7ZX08L3RyPlxuYH10YWJsZWNlbGwoZSl7bGV0IHQ9dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZS50b2tlbnMpLG49ZS5oZWFkZXI/XCJ0aFwiOlwidGRcIjtyZXR1cm4oZS5hbGlnbj9gPCR7bn0gYWxpZ249XCIke2UuYWxpZ259XCI+YDpgPCR7bn0+YCkrdCtgPC8ke259PlxuYH1zdHJvbmcoe3Rva2VuczplfSl7cmV0dXJuYDxzdHJvbmc+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L3N0cm9uZz5gfWVtKHt0b2tlbnM6ZX0pe3JldHVybmA8ZW0+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L2VtPmB9Y29kZXNwYW4oe3RleHQ6ZX0pe3JldHVybmA8Y29kZT4ke3coZSwhMCl9PC9jb2RlPmB9YnIoZSl7cmV0dXJuXCI8YnI+XCJ9ZGVsKHt0b2tlbnM6ZX0pe3JldHVybmA8ZGVsPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9kZWw+YH1saW5rKHtocmVmOmUsdGl0bGU6dCx0b2tlbnM6bn0pe2xldCByPXRoaXMucGFyc2VyLnBhcnNlSW5saW5lKG4pLGk9WChlKTtpZihpPT09bnVsbClyZXR1cm4gcjtlPWk7bGV0IHM9JzxhIGhyZWY9XCInK2UrJ1wiJztyZXR1cm4gdCYmKHMrPScgdGl0bGU9XCInK3codCkrJ1wiJykscys9XCI+XCIrcitcIjwvYT5cIixzfWltYWdlKHtocmVmOmUsdGl0bGU6dCx0ZXh0Om4sdG9rZW5zOnJ9KXtyJiYobj10aGlzLnBhcnNlci5wYXJzZUlubGluZShyLHRoaXMucGFyc2VyLnRleHRSZW5kZXJlcikpO2xldCBpPVgoZSk7aWYoaT09PW51bGwpcmV0dXJuIHcobik7ZT1pO2xldCBzPWA8aW1nIHNyYz1cIiR7ZX1cIiBhbHQ9XCIke259XCJgO3JldHVybiB0JiYocys9YCB0aXRsZT1cIiR7dyh0KX1cImApLHMrPVwiPlwiLHN9dGV4dChlKXtyZXR1cm5cInRva2Vuc1wiaW4gZSYmZS50b2tlbnM/dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZS50b2tlbnMpOlwiZXNjYXBlZFwiaW4gZSYmZS5lc2NhcGVkP2UudGV4dDp3KGUudGV4dCl9fTt2YXIgJD1jbGFzc3tzdHJvbmcoe3RleHQ6ZX0pe3JldHVybiBlfWVtKHt0ZXh0OmV9KXtyZXR1cm4gZX1jb2Rlc3Bhbih7dGV4dDplfSl7cmV0dXJuIGV9ZGVsKHt0ZXh0OmV9KXtyZXR1cm4gZX1odG1sKHt0ZXh0OmV9KXtyZXR1cm4gZX10ZXh0KHt0ZXh0OmV9KXtyZXR1cm4gZX1saW5rKHt0ZXh0OmV9KXtyZXR1cm5cIlwiK2V9aW1hZ2Uoe3RleHQ6ZX0pe3JldHVyblwiXCIrZX1icigpe3JldHVyblwiXCJ9Y2hlY2tib3goe3JhdzplfSl7cmV0dXJuIGV9fTt2YXIgYj1jbGFzcyB1e29wdGlvbnM7cmVuZGVyZXI7dGV4dFJlbmRlcmVyO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxULHRoaXMub3B0aW9ucy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXJ8fG5ldyBQLHRoaXMucmVuZGVyZXI9dGhpcy5vcHRpb25zLnJlbmRlcmVyLHRoaXMucmVuZGVyZXIub3B0aW9ucz10aGlzLm9wdGlvbnMsdGhpcy5yZW5kZXJlci5wYXJzZXI9dGhpcyx0aGlzLnRleHRSZW5kZXJlcj1uZXcgJH1zdGF0aWMgcGFyc2UoZSx0KXtyZXR1cm4gbmV3IHUodCkucGFyc2UoZSl9c3RhdGljIHBhcnNlSW5saW5lKGUsdCl7cmV0dXJuIG5ldyB1KHQpLnBhcnNlSW5saW5lKGUpfXBhcnNlKGUpe2xldCB0PVwiXCI7Zm9yKGxldCBuPTA7bjxlLmxlbmd0aDtuKyspe2xldCByPWVbbl07aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnJlbmRlcmVycz8uW3IudHlwZV0pe2xldCBzPXIsYT10aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5yZW5kZXJlcnNbcy50eXBlXS5jYWxsKHtwYXJzZXI6dGhpc30scyk7aWYoYSE9PSExfHwhW1wic3BhY2VcIixcImhyXCIsXCJoZWFkaW5nXCIsXCJjb2RlXCIsXCJ0YWJsZVwiLFwiYmxvY2txdW90ZVwiLFwibGlzdFwiLFwiaHRtbFwiLFwiZGVmXCIsXCJwYXJhZ3JhcGhcIixcInRleHRcIl0uaW5jbHVkZXMocy50eXBlKSl7dCs9YXx8XCJcIjtjb250aW51ZX19bGV0IGk9cjtzd2l0Y2goaS50eXBlKXtjYXNlXCJzcGFjZVwiOnt0Kz10aGlzLnJlbmRlcmVyLnNwYWNlKGkpO2JyZWFrfWNhc2VcImhyXCI6e3QrPXRoaXMucmVuZGVyZXIuaHIoaSk7YnJlYWt9Y2FzZVwiaGVhZGluZ1wiOnt0Kz10aGlzLnJlbmRlcmVyLmhlYWRpbmcoaSk7YnJlYWt9Y2FzZVwiY29kZVwiOnt0Kz10aGlzLnJlbmRlcmVyLmNvZGUoaSk7YnJlYWt9Y2FzZVwidGFibGVcIjp7dCs9dGhpcy5yZW5kZXJlci50YWJsZShpKTticmVha31jYXNlXCJibG9ja3F1b3RlXCI6e3QrPXRoaXMucmVuZGVyZXIuYmxvY2txdW90ZShpKTticmVha31jYXNlXCJsaXN0XCI6e3QrPXRoaXMucmVuZGVyZXIubGlzdChpKTticmVha31jYXNlXCJjaGVja2JveFwiOnt0Kz10aGlzLnJlbmRlcmVyLmNoZWNrYm94KGkpO2JyZWFrfWNhc2VcImh0bWxcIjp7dCs9dGhpcy5yZW5kZXJlci5odG1sKGkpO2JyZWFrfWNhc2VcImRlZlwiOnt0Kz10aGlzLnJlbmRlcmVyLmRlZihpKTticmVha31jYXNlXCJwYXJhZ3JhcGhcIjp7dCs9dGhpcy5yZW5kZXJlci5wYXJhZ3JhcGgoaSk7YnJlYWt9Y2FzZVwidGV4dFwiOnt0Kz10aGlzLnJlbmRlcmVyLnRleHQoaSk7YnJlYWt9ZGVmYXVsdDp7bGV0IHM9J1Rva2VuIHdpdGggXCInK2kudHlwZSsnXCIgdHlwZSB3YXMgbm90IGZvdW5kLic7aWYodGhpcy5vcHRpb25zLnNpbGVudClyZXR1cm4gY29uc29sZS5lcnJvcihzKSxcIlwiO3Rocm93IG5ldyBFcnJvcihzKX19fXJldHVybiB0fXBhcnNlSW5saW5lKGUsdD10aGlzLnJlbmRlcmVyKXtsZXQgbj1cIlwiO2ZvcihsZXQgcj0wO3I8ZS5sZW5ndGg7cisrKXtsZXQgaT1lW3JdO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5yZW5kZXJlcnM/LltpLnR5cGVdKXtsZXQgYT10aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5yZW5kZXJlcnNbaS50eXBlXS5jYWxsKHtwYXJzZXI6dGhpc30saSk7aWYoYSE9PSExfHwhW1wiZXNjYXBlXCIsXCJodG1sXCIsXCJsaW5rXCIsXCJpbWFnZVwiLFwic3Ryb25nXCIsXCJlbVwiLFwiY29kZXNwYW5cIixcImJyXCIsXCJkZWxcIixcInRleHRcIl0uaW5jbHVkZXMoaS50eXBlKSl7bis9YXx8XCJcIjtjb250aW51ZX19bGV0IHM9aTtzd2l0Y2gocy50eXBlKXtjYXNlXCJlc2NhcGVcIjp7bis9dC50ZXh0KHMpO2JyZWFrfWNhc2VcImh0bWxcIjp7bis9dC5odG1sKHMpO2JyZWFrfWNhc2VcImxpbmtcIjp7bis9dC5saW5rKHMpO2JyZWFrfWNhc2VcImltYWdlXCI6e24rPXQuaW1hZ2Uocyk7YnJlYWt9Y2FzZVwiY2hlY2tib3hcIjp7bis9dC5jaGVja2JveChzKTticmVha31jYXNlXCJzdHJvbmdcIjp7bis9dC5zdHJvbmcocyk7YnJlYWt9Y2FzZVwiZW1cIjp7bis9dC5lbShzKTticmVha31jYXNlXCJjb2Rlc3BhblwiOntuKz10LmNvZGVzcGFuKHMpO2JyZWFrfWNhc2VcImJyXCI6e24rPXQuYnIocyk7YnJlYWt9Y2FzZVwiZGVsXCI6e24rPXQuZGVsKHMpO2JyZWFrfWNhc2VcInRleHRcIjp7bis9dC50ZXh0KHMpO2JyZWFrfWRlZmF1bHQ6e2xldCBhPSdUb2tlbiB3aXRoIFwiJytzLnR5cGUrJ1wiIHR5cGUgd2FzIG5vdCBmb3VuZC4nO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpcmV0dXJuIGNvbnNvbGUuZXJyb3IoYSksXCJcIjt0aHJvdyBuZXcgRXJyb3IoYSl9fX1yZXR1cm4gbn19O3ZhciBTPWNsYXNze29wdGlvbnM7YmxvY2s7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFR9c3RhdGljIHBhc3NUaHJvdWdoSG9va3M9bmV3IFNldChbXCJwcmVwcm9jZXNzXCIsXCJwb3N0cHJvY2Vzc1wiLFwicHJvY2Vzc0FsbFRva2Vuc1wiLFwiZW1TdHJvbmdNYXNrXCJdKTtzdGF0aWMgcGFzc1Rocm91Z2hIb29rc1Jlc3BlY3RBc3luYz1uZXcgU2V0KFtcInByZXByb2Nlc3NcIixcInBvc3Rwcm9jZXNzXCIsXCJwcm9jZXNzQWxsVG9rZW5zXCJdKTtwcmVwcm9jZXNzKGUpe3JldHVybiBlfXBvc3Rwcm9jZXNzKGUpe3JldHVybiBlfXByb2Nlc3NBbGxUb2tlbnMoZSl7cmV0dXJuIGV9ZW1TdHJvbmdNYXNrKGUpe3JldHVybiBlfXByb3ZpZGVMZXhlcigpe3JldHVybiB0aGlzLmJsb2NrP3gubGV4OngubGV4SW5saW5lfXByb3ZpZGVQYXJzZXIoKXtyZXR1cm4gdGhpcy5ibG9jaz9iLnBhcnNlOmIucGFyc2VJbmxpbmV9fTt2YXIgQj1jbGFzc3tkZWZhdWx0cz1MKCk7b3B0aW9ucz10aGlzLnNldE9wdGlvbnM7cGFyc2U9dGhpcy5wYXJzZU1hcmtkb3duKCEwKTtwYXJzZUlubGluZT10aGlzLnBhcnNlTWFya2Rvd24oITEpO1BhcnNlcj1iO1JlbmRlcmVyPVA7VGV4dFJlbmRlcmVyPSQ7TGV4ZXI9eDtUb2tlbml6ZXI9eTtIb29rcz1TO2NvbnN0cnVjdG9yKC4uLmUpe3RoaXMudXNlKC4uLmUpfXdhbGtUb2tlbnMoZSx0KXtsZXQgbj1bXTtmb3IobGV0IHIgb2YgZSlzd2l0Y2gobj1uLmNvbmNhdCh0LmNhbGwodGhpcyxyKSksci50eXBlKXtjYXNlXCJ0YWJsZVwiOntsZXQgaT1yO2ZvcihsZXQgcyBvZiBpLmhlYWRlciluPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhzLnRva2Vucyx0KSk7Zm9yKGxldCBzIG9mIGkucm93cylmb3IobGV0IGEgb2YgcyluPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhhLnRva2Vucyx0KSk7YnJlYWt9Y2FzZVwibGlzdFwiOntsZXQgaT1yO249bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGkuaXRlbXMsdCkpO2JyZWFrfWRlZmF1bHQ6e2xldCBpPXI7dGhpcy5kZWZhdWx0cy5leHRlbnNpb25zPy5jaGlsZFRva2Vucz8uW2kudHlwZV0/dGhpcy5kZWZhdWx0cy5leHRlbnNpb25zLmNoaWxkVG9rZW5zW2kudHlwZV0uZm9yRWFjaChzPT57bGV0IGE9aVtzXS5mbGF0KDEvMCk7bj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoYSx0KSl9KTppLnRva2VucyYmKG49bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGkudG9rZW5zLHQpKSl9fXJldHVybiBufXVzZSguLi5lKXtsZXQgdD10aGlzLmRlZmF1bHRzLmV4dGVuc2lvbnN8fHtyZW5kZXJlcnM6e30sY2hpbGRUb2tlbnM6e319O3JldHVybiBlLmZvckVhY2gobj0+e2xldCByPXsuLi5ufTtpZihyLmFzeW5jPXRoaXMuZGVmYXVsdHMuYXN5bmN8fHIuYXN5bmN8fCExLG4uZXh0ZW5zaW9ucyYmKG4uZXh0ZW5zaW9ucy5mb3JFYWNoKGk9PntpZighaS5uYW1lKXRocm93IG5ldyBFcnJvcihcImV4dGVuc2lvbiBuYW1lIHJlcXVpcmVkXCIpO2lmKFwicmVuZGVyZXJcImluIGkpe2xldCBzPXQucmVuZGVyZXJzW2kubmFtZV07cz90LnJlbmRlcmVyc1tpLm5hbWVdPWZ1bmN0aW9uKC4uLmEpe2xldCBvPWkucmVuZGVyZXIuYXBwbHkodGhpcyxhKTtyZXR1cm4gbz09PSExJiYobz1zLmFwcGx5KHRoaXMsYSkpLG99OnQucmVuZGVyZXJzW2kubmFtZV09aS5yZW5kZXJlcn1pZihcInRva2VuaXplclwiaW4gaSl7aWYoIWkubGV2ZWx8fGkubGV2ZWwhPT1cImJsb2NrXCImJmkubGV2ZWwhPT1cImlubGluZVwiKXRocm93IG5ldyBFcnJvcihcImV4dGVuc2lvbiBsZXZlbCBtdXN0IGJlICdibG9jaycgb3IgJ2lubGluZSdcIik7bGV0IHM9dFtpLmxldmVsXTtzP3MudW5zaGlmdChpLnRva2VuaXplcik6dFtpLmxldmVsXT1baS50b2tlbml6ZXJdLGkuc3RhcnQmJihpLmxldmVsPT09XCJibG9ja1wiP3Quc3RhcnRCbG9jaz90LnN0YXJ0QmxvY2sucHVzaChpLnN0YXJ0KTp0LnN0YXJ0QmxvY2s9W2kuc3RhcnRdOmkubGV2ZWw9PT1cImlubGluZVwiJiYodC5zdGFydElubGluZT90LnN0YXJ0SW5saW5lLnB1c2goaS5zdGFydCk6dC5zdGFydElubGluZT1baS5zdGFydF0pKX1cImNoaWxkVG9rZW5zXCJpbiBpJiZpLmNoaWxkVG9rZW5zJiYodC5jaGlsZFRva2Vuc1tpLm5hbWVdPWkuY2hpbGRUb2tlbnMpfSksci5leHRlbnNpb25zPXQpLG4ucmVuZGVyZXIpe2xldCBpPXRoaXMuZGVmYXVsdHMucmVuZGVyZXJ8fG5ldyBQKHRoaXMuZGVmYXVsdHMpO2ZvcihsZXQgcyBpbiBuLnJlbmRlcmVyKXtpZighKHMgaW4gaSkpdGhyb3cgbmV3IEVycm9yKGByZW5kZXJlciAnJHtzfScgZG9lcyBub3QgZXhpc3RgKTtpZihbXCJvcHRpb25zXCIsXCJwYXJzZXJcIl0uaW5jbHVkZXMocykpY29udGludWU7bGV0IGE9cyxvPW4ucmVuZGVyZXJbYV0sbD1pW2FdO2lbYV09KC4uLnApPT57bGV0IGM9by5hcHBseShpLHApO3JldHVybiBjPT09ITEmJihjPWwuYXBwbHkoaSxwKSksY3x8XCJcIn19ci5yZW5kZXJlcj1pfWlmKG4udG9rZW5pemVyKXtsZXQgaT10aGlzLmRlZmF1bHRzLnRva2VuaXplcnx8bmV3IHkodGhpcy5kZWZhdWx0cyk7Zm9yKGxldCBzIGluIG4udG9rZW5pemVyKXtpZighKHMgaW4gaSkpdGhyb3cgbmV3IEVycm9yKGB0b2tlbml6ZXIgJyR7c30nIGRvZXMgbm90IGV4aXN0YCk7aWYoW1wib3B0aW9uc1wiLFwicnVsZXNcIixcImxleGVyXCJdLmluY2x1ZGVzKHMpKWNvbnRpbnVlO2xldCBhPXMsbz1uLnRva2VuaXplclthXSxsPWlbYV07aVthXT0oLi4ucCk9PntsZXQgYz1vLmFwcGx5KGkscCk7cmV0dXJuIGM9PT0hMSYmKGM9bC5hcHBseShpLHApKSxjfX1yLnRva2VuaXplcj1pfWlmKG4uaG9va3Mpe2xldCBpPXRoaXMuZGVmYXVsdHMuaG9va3N8fG5ldyBTO2ZvcihsZXQgcyBpbiBuLmhvb2tzKXtpZighKHMgaW4gaSkpdGhyb3cgbmV3IEVycm9yKGBob29rICcke3N9JyBkb2VzIG5vdCBleGlzdGApO2lmKFtcIm9wdGlvbnNcIixcImJsb2NrXCJdLmluY2x1ZGVzKHMpKWNvbnRpbnVlO2xldCBhPXMsbz1uLmhvb2tzW2FdLGw9aVthXTtTLnBhc3NUaHJvdWdoSG9va3MuaGFzKHMpP2lbYV09cD0+e2lmKHRoaXMuZGVmYXVsdHMuYXN5bmMmJlMucGFzc1Rocm91Z2hIb29rc1Jlc3BlY3RBc3luYy5oYXMocykpcmV0dXJuKGFzeW5jKCk9PntsZXQgZz1hd2FpdCBvLmNhbGwoaSxwKTtyZXR1cm4gbC5jYWxsKGksZyl9KSgpO2xldCBjPW8uY2FsbChpLHApO3JldHVybiBsLmNhbGwoaSxjKX06aVthXT0oLi4ucCk9PntpZih0aGlzLmRlZmF1bHRzLmFzeW5jKXJldHVybihhc3luYygpPT57bGV0IGc9YXdhaXQgby5hcHBseShpLHApO3JldHVybiBnPT09ITEmJihnPWF3YWl0IGwuYXBwbHkoaSxwKSksZ30pKCk7bGV0IGM9by5hcHBseShpLHApO3JldHVybiBjPT09ITEmJihjPWwuYXBwbHkoaSxwKSksY319ci5ob29rcz1pfWlmKG4ud2Fsa1Rva2Vucyl7bGV0IGk9dGhpcy5kZWZhdWx0cy53YWxrVG9rZW5zLHM9bi53YWxrVG9rZW5zO3Iud2Fsa1Rva2Vucz1mdW5jdGlvbihhKXtsZXQgbz1bXTtyZXR1cm4gby5wdXNoKHMuY2FsbCh0aGlzLGEpKSxpJiYobz1vLmNvbmNhdChpLmNhbGwodGhpcyxhKSkpLG99fXRoaXMuZGVmYXVsdHM9ey4uLnRoaXMuZGVmYXVsdHMsLi4ucn19KSx0aGlzfXNldE9wdGlvbnMoZSl7cmV0dXJuIHRoaXMuZGVmYXVsdHM9ey4uLnRoaXMuZGVmYXVsdHMsLi4uZX0sdGhpc31sZXhlcihlLHQpe3JldHVybiB4LmxleChlLHQ/P3RoaXMuZGVmYXVsdHMpfXBhcnNlcihlLHQpe3JldHVybiBiLnBhcnNlKGUsdD8/dGhpcy5kZWZhdWx0cyl9cGFyc2VNYXJrZG93bihlKXtyZXR1cm4obixyKT0+e2xldCBpPXsuLi5yfSxzPXsuLi50aGlzLmRlZmF1bHRzLC4uLml9LGE9dGhpcy5vbkVycm9yKCEhcy5zaWxlbnQsISFzLmFzeW5jKTtpZih0aGlzLmRlZmF1bHRzLmFzeW5jPT09ITAmJmkuYXN5bmM9PT0hMSlyZXR1cm4gYShuZXcgRXJyb3IoXCJtYXJrZWQoKTogVGhlIGFzeW5jIG9wdGlvbiB3YXMgc2V0IHRvIHRydWUgYnkgYW4gZXh0ZW5zaW9uLiBSZW1vdmUgYXN5bmM6IGZhbHNlIGZyb20gdGhlIHBhcnNlIG9wdGlvbnMgb2JqZWN0IHRvIHJldHVybiBhIFByb21pc2UuXCIpKTtpZih0eXBlb2Ygbj5cInVcInx8bj09PW51bGwpcmV0dXJuIGEobmV3IEVycm9yKFwibWFya2VkKCk6IGlucHV0IHBhcmFtZXRlciBpcyB1bmRlZmluZWQgb3IgbnVsbFwiKSk7aWYodHlwZW9mIG4hPVwic3RyaW5nXCIpcmV0dXJuIGEobmV3IEVycm9yKFwibWFya2VkKCk6IGlucHV0IHBhcmFtZXRlciBpcyBvZiB0eXBlIFwiK09iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuKStcIiwgc3RyaW5nIGV4cGVjdGVkXCIpKTtpZihzLmhvb2tzJiYocy5ob29rcy5vcHRpb25zPXMscy5ob29rcy5ibG9jaz1lKSxzLmFzeW5jKXJldHVybihhc3luYygpPT57bGV0IG89cy5ob29rcz9hd2FpdCBzLmhvb2tzLnByZXByb2Nlc3Mobik6bixwPWF3YWl0KHMuaG9va3M/YXdhaXQgcy5ob29rcy5wcm92aWRlTGV4ZXIoKTplP3gubGV4OngubGV4SW5saW5lKShvLHMpLGM9cy5ob29rcz9hd2FpdCBzLmhvb2tzLnByb2Nlc3NBbGxUb2tlbnMocCk6cDtzLndhbGtUb2tlbnMmJmF3YWl0IFByb21pc2UuYWxsKHRoaXMud2Fsa1Rva2VucyhjLHMud2Fsa1Rva2VucykpO2xldCBoPWF3YWl0KHMuaG9va3M/YXdhaXQgcy5ob29rcy5wcm92aWRlUGFyc2VyKCk6ZT9iLnBhcnNlOmIucGFyc2VJbmxpbmUpKGMscyk7cmV0dXJuIHMuaG9va3M/YXdhaXQgcy5ob29rcy5wb3N0cHJvY2VzcyhoKTpofSkoKS5jYXRjaChhKTt0cnl7cy5ob29rcyYmKG49cy5ob29rcy5wcmVwcm9jZXNzKG4pKTtsZXQgbD0ocy5ob29rcz9zLmhvb2tzLnByb3ZpZGVMZXhlcigpOmU/eC5sZXg6eC5sZXhJbmxpbmUpKG4scyk7cy5ob29rcyYmKGw9cy5ob29rcy5wcm9jZXNzQWxsVG9rZW5zKGwpKSxzLndhbGtUb2tlbnMmJnRoaXMud2Fsa1Rva2VucyhsLHMud2Fsa1Rva2Vucyk7bGV0IGM9KHMuaG9va3M/cy5ob29rcy5wcm92aWRlUGFyc2VyKCk6ZT9iLnBhcnNlOmIucGFyc2VJbmxpbmUpKGwscyk7cmV0dXJuIHMuaG9va3MmJihjPXMuaG9va3MucG9zdHByb2Nlc3MoYykpLGN9Y2F0Y2gobyl7cmV0dXJuIGEobyl9fX1vbkVycm9yKGUsdCl7cmV0dXJuIG49PntpZihuLm1lc3NhZ2UrPWBcblBsZWFzZSByZXBvcnQgdGhpcyB0byBodHRwczovL2dpdGh1Yi5jb20vbWFya2VkanMvbWFya2VkLmAsZSl7bGV0IHI9XCI8cD5BbiBlcnJvciBvY2N1cnJlZDo8L3A+PHByZT5cIit3KG4ubWVzc2FnZStcIlwiLCEwKStcIjwvcHJlPlwiO3JldHVybiB0P1Byb21pc2UucmVzb2x2ZShyKTpyfWlmKHQpcmV0dXJuIFByb21pc2UucmVqZWN0KG4pO3Rocm93IG59fX07dmFyIF89bmV3IEI7ZnVuY3Rpb24gZCh1LGUpe3JldHVybiBfLnBhcnNlKHUsZSl9ZC5vcHRpb25zPWQuc2V0T3B0aW9ucz1mdW5jdGlvbih1KXtyZXR1cm4gXy5zZXRPcHRpb25zKHUpLGQuZGVmYXVsdHM9Xy5kZWZhdWx0cyxaKGQuZGVmYXVsdHMpLGR9O2QuZ2V0RGVmYXVsdHM9TDtkLmRlZmF1bHRzPVQ7ZC51c2U9ZnVuY3Rpb24oLi4udSl7cmV0dXJuIF8udXNlKC4uLnUpLGQuZGVmYXVsdHM9Xy5kZWZhdWx0cyxaKGQuZGVmYXVsdHMpLGR9O2Qud2Fsa1Rva2Vucz1mdW5jdGlvbih1LGUpe3JldHVybiBfLndhbGtUb2tlbnModSxlKX07ZC5wYXJzZUlubGluZT1fLnBhcnNlSW5saW5lO2QuUGFyc2VyPWI7ZC5wYXJzZXI9Yi5wYXJzZTtkLlJlbmRlcmVyPVA7ZC5UZXh0UmVuZGVyZXI9JDtkLkxleGVyPXg7ZC5sZXhlcj14LmxleDtkLlRva2VuaXplcj15O2QuSG9va3M9UztkLnBhcnNlPWQ7dmFyIER0PWQub3B0aW9ucyxIdD1kLnNldE9wdGlvbnMsWnQ9ZC51c2UsR3Q9ZC53YWxrVG9rZW5zLE50PWQucGFyc2VJbmxpbmUsUXQ9ZCxGdD1iLnBhcnNlLGp0PXgubGV4O2V4cG9ydHtTIGFzIEhvb2tzLHggYXMgTGV4ZXIsQiBhcyBNYXJrZWQsYiBhcyBQYXJzZXIsUCBhcyBSZW5kZXJlciwkIGFzIFRleHRSZW5kZXJlcix5IGFzIFRva2VuaXplcixUIGFzIGRlZmF1bHRzLEwgYXMgZ2V0RGVmYXVsdHMsanQgYXMgbGV4ZXIsZCBhcyBtYXJrZWQsRHQgYXMgb3B0aW9ucyxRdCBhcyBwYXJzZSxOdCBhcyBwYXJzZUlubGluZSxGdCBhcyBwYXJzZXIsSHQgYXMgc2V0T3B0aW9ucyxadCBhcyB1c2UsR3QgYXMgd2Fsa1Rva2Vuc307XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYXJrZWQuZXNtLmpzLm1hcFxuIiwiaW1wb3J0IERPTVB1cmlmeSBmcm9tIFwiZG9tcHVyaWZ5XCI7XG5pbXBvcnQgeyBtYXJrZWQgfSBmcm9tIFwibWFya2VkXCI7XG5cbi8qKlxuICogQ29udGVudCBmb3JtYXQgdHlwZXNcbiAqL1xuZXhwb3J0IHR5cGUgQ29udGVudEZvcm1hdCA9IFwiaHRtbFwiIHwgXCJtYXJrZG93blwiIHwgXCJ0ZXh0XCI7XG4vKipcbiAqIENvbmZpZ3VyYXRpb24gZm9yIEhUTUwgc2FuaXRpemF0aW9uXG4gKiBVcGRhdGVkIGZvciBGQVEgY29udGVudDogUHJpb3JpdGl6ZXMgc2FmZSwgcmVhZGFibGUgcmljaCB0ZXh0IHdpdGggZnVsbCBsaW5rIHN1cHBvcnQuXG4gKiBFbmhhbmNlcyB0YWJsZSBzdXBwb3J0IChpbmNsdWRpbmcgY2FwdGlvbnMgYW5kIHN0cnVjdHVyYWwgYXR0cmlidXRlcyBmb3IgYmV0dGVyIGFjY2Vzc2liaWxpdHkvY29tcGxleGl0eSkuXG4gKiBBZGRzIG9wdGlvbmFsIHZpZGVvIHN1cHBvcnQgKGNvbW1lbnRlZCBvdXQgYnkgZGVmYXVsdOKAlHVuY29tbWVudCBpZiBlbWJlZGRpbmcgdmlkZW9zIGlzIGRlc2lyZWQgZm9yIEZBUXM7XG4gKiBub3RlOiB0aGlzIGluY3JlYXNlcyBzZWN1cml0eSByZXZpZXcgbmVlZHMgZHVlIHRvIHBvdGVudGlhbCBleGVjdXRhYmxlIGNvbnRlbnQpLlxuICogUmVtb3ZlcyBoZWFkaW5ncyAoaDEtaDYpIGFzIHRoZXkncmUgbGlrZWx5IHVubmVjZXNzYXJ5IGZvciBGQVEgcmVzcG9uc2VzLlxuICogUmV0YWlucyBjb3JlIGZvcm1hdHRpbmcsIGxpc3RzLCBpbWFnZXMsIGFuZCB0YWJsZXMgZm9yIHN0cnVjdHVyZWQgYW5zd2Vycy5cbiAqL1xuY29uc3QgU0FOSVRJWkVfQ09ORklHID0ge1xuICAgIEFMTE9XRURfVEFHUzogW1xuICAgICAgICBcInBcIixcbiAgICAgICAgXCJiclwiLFxuICAgICAgICBcInN0cm9uZ1wiLFxuICAgICAgICBcImVtXCIsXG4gICAgICAgIFwidVwiLFxuICAgICAgICBcInNcIixcbiAgICAgICAgXCJiXCIsXG4gICAgICAgIFwiaVwiLFxuICAgICAgICBcImFcIixcbiAgICAgICAgXCJ1bFwiLFxuICAgICAgICBcIm9sXCIsXG4gICAgICAgIFwibGlcIixcbiAgICAgICAgXCJjb2RlXCIsXG4gICAgICAgIFwicHJlXCIsXG4gICAgICAgIFwiaHJcIixcbiAgICAgICAgXCJ0YWJsZVwiLFxuICAgICAgICBcImNhcHRpb25cIiwgLy8gQWRkZWQgZm9yIHRhYmxlIHRpdGxlcy9kZXNjcmlwdGlvbnNcbiAgICAgICAgXCJ0aGVhZFwiLFxuICAgICAgICBcInRib2R5XCIsXG4gICAgICAgIFwidGZvb3RcIiwgLy8gQWRkZWQgZm9yIHRhYmxlIGZvb3RlcnMgKGUuZy4sIHN1bW1hcmllcy90b3RhbHMpXG4gICAgICAgIFwidHJcIixcbiAgICAgICAgXCJ0aFwiLFxuICAgICAgICBcInRkXCIsXG4gICAgICAgIFwiY29sXCIsIC8vIEFkZGVkIGZvciBjb2x1bW4gcHJvcGVydGllc1xuICAgICAgICBcImNvbGdyb3VwXCIsIC8vIEFkZGVkIGZvciBncm91cGluZyBjb2x1bW5zXG4gICAgICAgIFwiaW1nXCIsXG4gICAgICAgIFwiZGl2XCIsXG4gICAgICAgIFwic3BhblwiLFxuICAgICAgICBcInZpZGVvXCIsIC8vIFVuY29tbWVudCB0byBlbmFibGUgPHZpZGVvPiBmb3IgZW1iZWRkZWQgdmlkZW9zXG4gICAgICAgIFwic291cmNlXCIsIC8vIFVuY29tbWVudCBpZiBlbmFibGluZyB2aWRlbyAoZm9yIDx2aWRlbz4gc291cmNlcylcbiAgICAgICAgXCJmaWd1cmVcIiwgLy8gT3B0aW9uYWw6IEZvciB3cmFwcGluZyBpbWFnZXMvdGFibGVzIHdpdGggY2FwdGlvbnNcbiAgICAgICAgXCJmaWdjYXB0aW9uXCIgLy8gT3B0aW9uYWw6IEZvciBmaWd1cmUgZGVzY3JpcHRpb25zXG4gICAgXSxcbiAgICBBTExPV0VEX0FUVFI6IFtcbiAgICAgICAgXCJocmVmXCIsXG4gICAgICAgIFwidGl0bGVcIixcbiAgICAgICAgXCJ0YXJnZXRcIixcbiAgICAgICAgXCJyZWxcIixcbiAgICAgICAgXCJzcmNcIixcbiAgICAgICAgXCJhbHRcIixcbiAgICAgICAgXCJ3aWR0aFwiLFxuICAgICAgICBcImhlaWdodFwiLFxuICAgICAgICBcImNsYXNzXCIsXG4gICAgICAgIFwiaWRcIixcbiAgICAgICAgXCJzdHlsZVwiLFxuICAgICAgICAvLyBUYWJsZS1zcGVjaWZpYyBhdHRyaWJ1dGVzIGZvciBzdHJ1Y3R1cmUgYW5kIGFjY2Vzc2liaWxpdHlcbiAgICAgICAgXCJyb3dzcGFuXCIsXG4gICAgICAgIFwiY29sc3BhblwiLFxuICAgICAgICBcInNjb3BlXCIsIC8vIEZvciA8dGg+IChlLmcuLCByb3csIGNvbCwgcm93Z3JvdXApXG4gICAgICAgIFwiaGVhZGVyc1wiLCAvLyBGb3IgYXNzb2NpYXRpbmcgPHRkPiB3aXRoIDx0aD5cbiAgICAgICAgLy8gVmlkZW8tc3BlY2lmaWMgKHVuY29tbWVudCBpZiBlbmFibGluZyB2aWRlbylcbiAgICAgICAgXCJjb250cm9sc1wiLFxuICAgICAgICBcImF1dG9wbGF5XCIsXG4gICAgICAgIFwibG9vcFwiLFxuICAgICAgICBcIm11dGVkXCIsXG4gICAgICAgIFwicG9zdGVyXCJcbiAgICBdLFxuICAgIEFMTE9XX0RBVEFfQVRUUjogZmFsc2UsIC8vIEtlZXAgZmFsc2UgZm9yIHNlY3VyaXR5OyBlbmFibGUgb25seSBpZiBjdXN0b20gZGF0YSBhdHRycyBhcmUgdmV0dGVkXG4gICAgQUxMT1dFRF9VUklfUkVHRVhQOlxuICAgICAgICAvXig/Oig/Oig/OmZ8aHQpdHBzP3xtYWlsdG98dGVsfGNhbGx0b3xzbXN8Y2lkfHhtcHApOnxbXmEtel18W2EteisuLV0rKD86W15hLXorLi06XXwkKSkvaVxufTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIHNhbml0aXplcyBIVE1MIGNvbnRlbnRcbiAqIEBwYXJhbSBodG1sIC0gVGhlIEhUTUwgc3RyaW5nIHRvIHNhbml0aXplXG4gKiBAcmV0dXJucyBTYW5pdGl6ZWQgSFRNTCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplSFRNTChodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghaHRtbCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBDb25maWd1cmUgRE9NUHVyaWZ5XG4gICAgICAgIGNvbnN0IGNsZWFuSFRNTCA9IERPTVB1cmlmeS5zYW5pdGl6ZShodG1sLCBTQU5JVElaRV9DT05GSUcpO1xuICAgICAgICByZXR1cm4gY2xlYW5IVE1MO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzYW5pdGl6aW5nIEhUTUw6XCIsIGVycm9yKTtcbiAgICAgICAgLy8gUmV0dXJuIGVzY2FwZWQgdGV4dCBhcyBmYWxsYmFja1xuICAgICAgICByZXR1cm4gZXNjYXBlSFRNTChodG1sKTtcbiAgICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIEhUTUwgY29udGVudCBhbmQgcmV0dXJucyB2YWxpZGF0aW9uIGVycm9yc1xuICogQHBhcmFtIGh0bWwgLSBUaGUgSFRNTCBzdHJpbmcgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm5zIEFycmF5IG9mIHZhbGlkYXRpb24gZXJyb3IgbWVzc2FnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSFRNTChodG1sOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKCFodG1sKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHNjcmlwdCB0YWdzIChzaG91bGQgYmUgYmxvY2tlZClcbiAgICBpZiAoLzxzY3JpcHRbXj5dKj5bXFxzXFxTXSo/PFxcL3NjcmlwdD4vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIlNjcmlwdCB0YWdzIGFyZSBub3QgYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29uc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgZXZlbnQgaGFuZGxlcnMgKHNob3VsZCBiZSBibG9ja2VkKVxuICAgIGlmICgvb25cXHcrXFxzKj0vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIkV2ZW50IGhhbmRsZXJzIChvbmNsaWNrLCBvbmxvYWQsIGV0Yy4pIGFyZSBub3QgYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29uc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgamF2YXNjcmlwdDogcHJvdG9jb2xcbiAgICBpZiAoL2phdmFzY3JpcHQ6L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJKYXZhU2NyaXB0IHByb3RvY29sIGluIFVSTHMgaXMgbm90IGFsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGRhdGE6IHByb3RvY29sIChleGNlcHQgZm9yIGltYWdlcylcbiAgICBpZiAoL2RhdGE6KD8haW1hZ2UpL2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJEYXRhIFVSTHMgYXJlIG9ubHkgYWxsb3dlZCBmb3IgaW1hZ2VzXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBpZnJhbWUgKG5vdCBpbiBhbGxvd2VkIHRhZ3MpXG4gICAgaWYgKC88aWZyYW1lW14+XSo+L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJJZnJhbWUgdGFncyBhcmUgbm90IGFsbG93ZWRcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG9iamVjdCBhbmQgZW1iZWQgdGFnc1xuICAgIGlmICgvPChvYmplY3R8ZW1iZWQpW14+XSo+L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJPYmplY3QgYW5kIGVtYmVkIHRhZ3MgYXJlIG5vdCBhbGxvd2VkXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJvcnM7XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIEhUTUwgc3ludGF4IGZvciBtYWxmb3JtZWQgbWFya3VwXG4gKiBAcGFyYW0gaHRtbCAtIFRoZSBIVE1MIHN0cmluZyB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgQXJyYXkgb2Ygc3ludGF4IGVycm9yIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUhUTUxTeW50YXgoaHRtbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmICghaHRtbCkge1xuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH1cblxuICAgIGNvbnN0IGFsbFRhZ3MgPSBodG1sLm1hdGNoKC88W14+XSs+L2cpIHx8IFtdO1xuXG4gICAgYWxsVGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgLy8gQ2hlY2sgZm9yIGF0dHJpYnV0ZXMgd2l0aCB1bmNsb3NlZCBxdW90ZXNcbiAgICAgICAgLy8gTG9vayBmb3IgYXR0cj1cIiBvciBhdHRyPScgdGhhdCBkb2Vzbid0IGhhdmUgYSBtYXRjaGluZyBjbG9zaW5nIHF1b3RlXG4gICAgICAgIGNvbnN0IHNpbmdsZVF1b3RlTWF0Y2hlcyA9IHRhZy5tYXRjaCgvXFx3K1xccyo9XFxzKidbXiddKiQvKTtcbiAgICAgICAgY29uc3QgZG91YmxlUXVvdGVNYXRjaGVzID0gdGFnLm1hdGNoKC9cXHcrXFxzKj1cXHMqXCJbXlwiXSokLyk7XG5cbiAgICAgICAgaWYgKHNpbmdsZVF1b3RlTWF0Y2hlcyB8fCBkb3VibGVRdW90ZU1hdGNoZXMpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgIGBVbmNsb3NlZCBhdHRyaWJ1dGUgcXVvdGUgaW4gdGFnOiAke3RhZy5zdWJzdHJpbmcoMCwgNTApfSR7XG4gICAgICAgICAgICAgICAgICAgIHRhZy5sZW5ndGggPiA1MCA/IFwiLi4uXCIgOiBcIlwiXG4gICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgdW5jbG9zZWQgb3BlbmluZyB0YWcgKG1pc3NpbmcgPilcbiAgICAgICAgaWYgKHRhZy5zdGFydHNXaXRoKFwiPFwiKSAmJiAhdGFnLmVuZHNXaXRoKFwiPlwiKSkge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgYFVuY2xvc2VkIHRhZyBicmFja2V0OiAke3RhZy5zdWJzdHJpbmcoMCwgNTApfSR7dGFnLmxlbmd0aCA+IDUwID8gXCIuLi5cIiA6IFwiXCJ9YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGJhbGFuY2VkIHRhZ3MgKG9wZW5pbmcgYW5kIGNsb3NpbmcpXG4gICAgLy8gU2VsZi1jbG9zaW5nIHRhZ3MgdGhhdCBkb24ndCBuZWVkIGNsb3NpbmcgdGFnc1xuICAgIGNvbnN0IHNlbGZDbG9zaW5nVGFncyA9IFtcbiAgICAgICAgXCJhcmVhXCIsXG4gICAgICAgIFwiYmFzZVwiLFxuICAgICAgICBcImJyXCIsXG4gICAgICAgIFwiY29sXCIsXG4gICAgICAgIFwiZW1iZWRcIixcbiAgICAgICAgXCJoclwiLFxuICAgICAgICBcImltZ1wiLFxuICAgICAgICBcImlucHV0XCIsXG4gICAgICAgIFwibGlua1wiLFxuICAgICAgICBcIm1ldGFcIixcbiAgICAgICAgXCJwYXJhbVwiLFxuICAgICAgICBcInNvdXJjZVwiLFxuICAgICAgICBcInRyYWNrXCIsXG4gICAgICAgIFwid2JyXCJcbiAgICBdO1xuXG4gICAgLy8gRXh0cmFjdCBhbGwgdGFncyAob3BlbmluZyBhbmQgY2xvc2luZylcbiAgICBjb25zdCB0YWdTdGFjazogQXJyYXk8eyB0YWc6IHN0cmluZzsgcG9zaXRpb246IG51bWJlciB9PiA9IFtdO1xuICAgIGNvbnN0IHRhZ1JlZ2V4ID0gLzxcXC8/KFthLXpBLVpdW2EtekEtWjAtOV0qKVtePl0qPi9nO1xuICAgIGxldCBtYXRjaDtcblxuICAgIHdoaWxlICgobWF0Y2ggPSB0YWdSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBmdWxsVGFnID0gbWF0Y2hbMF07XG4gICAgICAgIGNvbnN0IHRhZ05hbWUgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBjb25zdCBpc0Nsb3NpbmcgPSBmdWxsVGFnLnN0YXJ0c1dpdGgoXCI8L1wiKTtcbiAgICAgICAgY29uc3QgaXNTZWxmQ2xvc2luZyA9IGZ1bGxUYWcuZW5kc1dpdGgoXCIvPlwiKSB8fCBzZWxmQ2xvc2luZ1RhZ3MuaW5jbHVkZXModGFnTmFtZSk7XG5cbiAgICAgICAgaWYgKGlzQ2xvc2luZykge1xuICAgICAgICAgICAgLy8gQ2xvc2luZyB0YWcgLSBwb3AgZnJvbSBzdGFja1xuICAgICAgICAgICAgaWYgKHRhZ1N0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGBPcnBoYW5lZCBjbG9zaW5nIHRhZzogPC8ke3RhZ05hbWV9PmApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsYXN0T3BlbmVkID0gdGFnU3RhY2tbdGFnU3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RPcGVuZWQudGFnID09PSB0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZ1N0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1pc21hdGNoZWQgdGFnXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgYE1pc21hdGNoZWQgdGFnczogRXhwZWN0ZWQgY2xvc2luZyB0YWcgZm9yIDwke2xhc3RPcGVuZWQudGFnfT4sIGZvdW5kIDwvJHt0YWdOYW1lfT5gXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBmaW5kIG1hdGNoaW5nIG9wZW5pbmcgdGFnIGluIHN0YWNrXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoSW5kZXggPSB0YWdTdGFjay5maW5kSW5kZXgoKHQpID0+IHQudGFnID09PSB0YWdOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoSW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFnU3RhY2suc3BsaWNlKG1hdGNoSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFpc1NlbGZDbG9zaW5nKSB7XG4gICAgICAgICAgICAvLyBPcGVuaW5nIHRhZyAtIHB1c2ggdG8gc3RhY2tcbiAgICAgICAgICAgIHRhZ1N0YWNrLnB1c2goeyB0YWc6IHRhZ05hbWUsIHBvc2l0aW9uOiBtYXRjaC5pbmRleCB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCB0YWdzIHJlbWFpbmluZyBpbiBzdGFja1xuICAgIGlmICh0YWdTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRhZ1N0YWNrLmZvckVhY2goKHsgdGFnIH0pID0+IHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBVbmNsb3NlZCB0YWc6IDwke3RhZ30+IGlzIG1pc3NpbmcgY2xvc2luZyB0YWcgPC8ke3RhZ30+YCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBtYWxmb3JtZWQgYXR0cmlidXRlcyAobm8gdmFsdWUsIG1hbGZvcm1lZCBzeW50YXgpXG4gICAgY29uc3QgbWFsZm9ybWVkQXR0clBhdHRlcm4gPSAvPFtePl0rXFxzKyhcXHcrKVxccyo9XFxzKig/IVtcIlxcd10pW14+XSo+L2c7XG4gICAgbGV0IGF0dHJNYXRjaDtcbiAgICB3aGlsZSAoKGF0dHJNYXRjaCA9IG1hbGZvcm1lZEF0dHJQYXR0ZXJuLmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgYE1hbGZvcm1lZCBhdHRyaWJ1dGUgc3ludGF4OiAke2F0dHJNYXRjaFswXS5zdWJzdHJpbmcoMCwgNTApfSR7XG4gICAgICAgICAgICAgICAgYXR0ck1hdGNoWzBdLmxlbmd0aCA+IDUwID8gXCIuLi5cIiA6IFwiXCJcbiAgICAgICAgICAgIH1gXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVycm9ycztcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBtYXJrZG93biB0byBIVE1MXG4gKiBAcGFyYW0gbWFya2Rvd24gLSBUaGUgbWFya2Rvd24gc3RyaW5nIHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIEhUTUwgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrZG93blRvSFRNTChtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIW1hcmtkb3duKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIENvbmZpZ3VyZSBtYXJrZWQgZm9yIHNlY3VyaXR5XG4gICAgICAgIG1hcmtlZC5zZXRPcHRpb25zKHtcbiAgICAgICAgICAgIGJyZWFrczogdHJ1ZSxcbiAgICAgICAgICAgIGdmbTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBodG1sID0gbWFya2VkLnBhcnNlKG1hcmtkb3duKSBhcyBzdHJpbmc7XG4gICAgICAgIC8vIFNhbml0aXplIHRoZSBnZW5lcmF0ZWQgSFRNTFxuICAgICAgICByZXR1cm4gc2FuaXRpemVIVE1MKGh0bWwpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBwYXJzaW5nIG1hcmtkb3duOlwiLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBlc2NhcGVIVE1MKG1hcmtkb3duKTtcbiAgICB9XG59XG5cbi8qKlxuICogRXNjYXBlcyBIVE1MIHNwZWNpYWwgY2hhcmFjdGVyc1xuICogQHBhcmFtIHRleHQgLSBUaGUgdGV4dCB0byBlc2NhcGVcbiAqIEByZXR1cm5zIEVzY2FwZWQgdGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlSFRNTCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZGl2LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICByZXR1cm4gZGl2LmlubmVySFRNTDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBwbGFpbiB0ZXh0IHRvIEhUTUwgd2l0aCBsaW5lIGJyZWFrc1xuICogQHBhcmFtIHRleHQgLSBUaGUgcGxhaW4gdGV4dCB0byBjb252ZXJ0XG4gKiBAcmV0dXJucyBIVE1MIHN0cmluZyB3aXRoIGxpbmUgYnJlYWtzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0VG9IVE1MKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIC8vIEVzY2FwZSBIVE1MIGNoYXJhY3RlcnMgYW5kIGNvbnZlcnQgbGluZSBicmVha3MgdG8gPGJyPlxuICAgIGNvbnN0IGVzY2FwZWQgPSBlc2NhcGVIVE1MKHRleHQpO1xuICAgIHJldHVybiBlc2NhcGVkLnJlcGxhY2UoL1xcbi9nLCBcIjxicj5cIik7XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0IGFuZCByZXR1cm5zIHNhbml0aXplZCBIVE1MXG4gKiBAcGFyYW0gY29udGVudCAtIFRoZSBjb250ZW50IHN0cmluZ1xuICogQHBhcmFtIGZvcm1hdCAtIFRoZSBjb250ZW50IGZvcm1hdCAoaHRtbCwgbWFya2Rvd24sIG9yIHRleHQpXG4gKiBAcmV0dXJucyBTYW5pdGl6ZWQgSFRNTCBzdHJpbmcgb3IgZXNjYXBlZCBtYXJrZG93blxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0NvbnRlbnQoY29udGVudDogc3RyaW5nLCBmb3JtYXQ6IENvbnRlbnRGb3JtYXQpOiBzdHJpbmcge1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgcmV0dXJuIHNhbml0aXplSFRNTChjb250ZW50KTtcbiAgICAgICAgY2FzZSBcIm1hcmtkb3duXCI6XG4gICAgICAgICAgICAvLyBDb252ZXJ0IG1hcmtkb3duIHRvIEhUTUwgYW5kIHNhbml0aXplIGl0XG4gICAgICAgICAgICByZXR1cm4gbWFya2Rvd25Ub0hUTUwoY29udGVudCk7XG4gICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICByZXR1cm4gdGV4dFRvSFRNTChjb250ZW50KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFVucmVjb2duaXplZCBmb3JtYXQgLSB0cmVhdCBhcyBIVE1MIGFuZCBzYW5pdGl6ZSBmb3Igc2FmZXR5XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVucmVjb2duaXplZCBjb250ZW50IGZvcm1hdCBcIiR7Zm9ybWF0fVwiLCB0cmVhdGluZyBhcyBIVE1MYCk7XG4gICAgICAgICAgICByZXR1cm4gc2FuaXRpemVIVE1MKGNvbnRlbnQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXRzIHZhbGlkYXRpb24gd2FybmluZ3MgZm9yIGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0XG4gKiBAcGFyYW0gY29udGVudCAtIFRoZSBjb250ZW50IHN0cmluZ1xuICogQHBhcmFtIGZvcm1hdCAtIFRoZSBjb250ZW50IGZvcm1hdFxuICogQHJldHVybnMgQXJyYXkgb2Ygd2FybmluZyBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGVudFdhcm5pbmdzKGNvbnRlbnQ6IHN0cmluZywgZm9ybWF0OiBDb250ZW50Rm9ybWF0KTogc3RyaW5nW10ge1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSBcImh0bWxcIjpcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIGJvdGggc2VjdXJpdHkgaXNzdWVzIGFuZCBzeW50YXhcbiAgICAgICAgICAgIGNvbnN0IHNlY3VyaXR5V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUwoY29udGVudCk7XG4gICAgICAgICAgICBjb25zdCBzeW50YXhXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTFN5bnRheChjb250ZW50KTtcbiAgICAgICAgICAgIHJldHVybiBbLi4uc2VjdXJpdHlXYXJuaW5ncywgLi4uc3ludGF4V2FybmluZ3NdO1xuICAgICAgICBjYXNlIFwibWFya2Rvd25cIjpcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBkYW5nZXJvdXMgSFRNTCBlbWJlZGRlZCBpbiBtYXJrZG93blxuICAgICAgICAgICAgLy8gVXNlcnMgbWlnaHQgdHJ5IHRvIGluY2x1ZGUgPHNjcmlwdD4gdGFncyBpbiB0aGVpciBtYXJrZG93blxuICAgICAgICAgICAgY29uc3QgaHRtbFBhdHRlcm4gPSAvPFtePl0rPi9nO1xuICAgICAgICAgICAgY29uc3QgaHRtbE1hdGNoZXMgPSBjb250ZW50Lm1hdGNoKGh0bWxQYXR0ZXJuKTtcblxuICAgICAgICAgICAgaWYgKGh0bWxNYXRjaGVzKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBqdXN0IHRoZSBIVE1MIHBhcnRzIGFuZCB2YWxpZGF0ZSB0aGVtXG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbENvbnRlbnQgPSBodG1sTWF0Y2hlcy5qb2luKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGh0bWxTZWN1cml0eVdhcm5pbmdzID0gdmFsaWRhdGVIVE1MKGh0bWxDb250ZW50KTtcbiAgICAgICAgICAgICAgICBjb25zdCBodG1sU3ludGF4V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUxTeW50YXgoaHRtbENvbnRlbnQpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsV2FybmluZ3MgPSBbLi4uaHRtbFNlY3VyaXR5V2FybmluZ3MsIC4uLmh0bWxTeW50YXhXYXJuaW5nc107XG4gICAgICAgICAgICAgICAgaWYgKGFsbFdhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsbFdhcm5pbmdzLm1hcCgod2FybmluZykgPT4gYEVtYmVkZGVkIEhUTUwgaW4gbWFya2Rvd246ICR7d2FybmluZ31gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICAvLyBUZXh0IGZvcm1hdCBkb2Vzbid0IG5lZWQgdmFsaWRhdGlvbiAoZXZlcnl0aGluZyBpcyBlc2NhcGVkKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCB7IHByb2Nlc3NDb250ZW50LCBnZXRDb250ZW50V2FybmluZ3MgfSBmcm9tIFwiLi4vdXRpbHMvY29udGVudFByb2Nlc3NvclwiO1xuaW1wb3J0IHsgQ29udGVudEZvcm1hdEVudW0gfSBmcm9tIFwiLi4vLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuXG5pbnRlcmZhY2UgRkFRSXRlbURhdGEge1xuICAgIHN1bW1hcnk6IHN0cmluZztcbiAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgY29udGVudEZvcm1hdDogQ29udGVudEZvcm1hdEVudW07XG4gICAgc29ydE9yZGVyPzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgRkFRSXRlbXNMaXN0UHJvcHMge1xuICAgIGl0ZW1zOiBGQVFJdGVtRGF0YVtdO1xuICAgIGV4cGFuZGVkSXRlbXM6IFNldDxudW1iZXI+O1xuICAgIGFuaW1hdGlvbkR1cmF0aW9uOiBudW1iZXI7XG4gICAgb25Ub2dnbGVJdGVtOiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBGQVEgaXRlbXMgbGlzdCBpbiBub3JtYWwgKG5vbi1lZGl0KSBtb2RlXG4gKiBVc2VzIHNlbWFudGljIEhUTUwgZGV0YWlscy9zdW1tYXJ5IGVsZW1lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGQVFJdGVtc0xpc3Qoe1xuICAgIGl0ZW1zLFxuICAgIGV4cGFuZGVkSXRlbXMsXG4gICAgYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgb25Ub2dnbGVJdGVtXG59OiBGQVFJdGVtc0xpc3RQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWl0ZW1zXCI+XG4gICAgICAgICAgICB7aXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBleHBhbmRlZEl0ZW1zLmhhcyhpbmRleCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeVZhbHVlID0gaXRlbS5zdW1tYXJ5O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRWYWx1ZSA9IGl0ZW0uY29udGVudDtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50Rm9ybWF0ID0gaXRlbS5jb250ZW50Rm9ybWF0O1xuXG4gICAgICAgICAgICAgICAgLy8gUHJvY2VzcyBjb250ZW50IGJhc2VkIG9uIGZvcm1hdCBhbmQgc2FuaXRpemVcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9jZXNzZWRDb250ZW50ID0gcHJvY2Vzc0NvbnRlbnQoY29udGVudFZhbHVlLCBjb250ZW50Rm9ybWF0KTtcblxuICAgICAgICAgICAgICAgIC8vIEdldCB2YWxpZGF0aW9uIHdhcm5pbmdzIChvbmx5IGZvciBIVE1MIGZvcm1hdClcbiAgICAgICAgICAgICAgICBjb25zdCB3YXJuaW5ncyA9IGdldENvbnRlbnRXYXJuaW5ncyhjb250ZW50VmFsdWUsIGNvbnRlbnRGb3JtYXQpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPGRldGFpbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aW5kZXh9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtaXRlbS0tZXhwYW5kZWRcIjogaXNFeHBhbmRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuPXtpc0V4cGFuZGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCItLWFuaW1hdGlvbi1kdXJhdGlvblwiOiBgJHthbmltYXRpb25EdXJhdGlvbn1tc2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIFJlYWN0LkNTU1Byb3BlcnRpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHN1bW1hcnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtaXRlbS1zdW1tYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uVG9nZ2xlSXRlbShpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiIHx8IGUua2V5ID09PSBcIiBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Ub2dnbGVJdGVtKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9sZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1leHBhbmRlZD17aXNFeHBhbmRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYXEtaXRlbS1zdW1tYXJ5LXRleHRcIj57c3VtbWFyeVZhbHVlfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbS1pY29uXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZmFxLWl0ZW0taWNvbi0tZXhwYW5kZWRcIjogaXNFeHBhbmRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPVwiMTZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PVwiMTZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsPVwibm9uZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkPVwiTTQgNkw4IDEwTDEyIDZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg9XCIyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lY2FwPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVqb2luPVwicm91bmRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zdW1tYXJ5PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3dhcm5pbmdzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLXdhcm5pbmdzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubWFwKCh3YXJuaW5nLCB3SW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17d0luZGV4fSBjbGFzc05hbWU9XCJmYXEtaXRlbS13YXJuaW5nXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKaoO+4jyB7d2FybmluZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tY29udGVudC1pbm5lclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogcHJvY2Vzc2VkQ29udGVudCB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IHVzZU1lbW8sIHVzZUxheW91dEVmZmVjdCwgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZUNhbGxiYWNrIH0gZnJvbSAncmVhY3QnO1xuXG5mdW5jdGlvbiB1c2VDb21iaW5lZFJlZnMoKSB7XG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCByZWZzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgIHJlZnNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gIH1cblxuICByZXR1cm4gdXNlTWVtbygoKSA9PiBub2RlID0+IHtcbiAgICByZWZzLmZvckVhY2gocmVmID0+IHJlZihub2RlKSk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgcmVmcyk7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iL21hc3Rlci9wYWNrYWdlcy9zaGFyZWQvRXhlY3V0aW9uRW52aXJvbm1lbnQuanNcbmNvbnN0IGNhblVzZURPTSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCc7XG5cbmZ1bmN0aW9uIGlzV2luZG93KGVsZW1lbnQpIHtcbiAgY29uc3QgZWxlbWVudFN0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnRTdHJpbmcgPT09ICdbb2JqZWN0IFdpbmRvd10nIHx8IC8vIEluIEVsZWN0cm9uIGNvbnRleHQgdGhlIFdpbmRvdyBvYmplY3Qgc2VyaWFsaXplcyB0byBbb2JqZWN0IGdsb2JhbF1cbiAgZWxlbWVudFN0cmluZyA9PT0gJ1tvYmplY3QgZ2xvYmFsXSc7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZShub2RlKSB7XG4gIHJldHVybiAnbm9kZVR5cGUnIGluIG5vZGU7XG59XG5cbmZ1bmN0aW9uIGdldFdpbmRvdyh0YXJnZXQpIHtcbiAgdmFyIF90YXJnZXQkb3duZXJEb2N1bWVudCwgX3RhcmdldCRvd25lckRvY3VtZW50MjtcblxuICBpZiAoIXRhcmdldCkge1xuICAgIHJldHVybiB3aW5kb3c7XG4gIH1cblxuICBpZiAoaXNXaW5kb3codGFyZ2V0KSkge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICBpZiAoIWlzTm9kZSh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIHdpbmRvdztcbiAgfVxuXG4gIHJldHVybiAoX3RhcmdldCRvd25lckRvY3VtZW50ID0gKF90YXJnZXQkb3duZXJEb2N1bWVudDIgPSB0YXJnZXQub3duZXJEb2N1bWVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF90YXJnZXQkb3duZXJEb2N1bWVudDIuZGVmYXVsdFZpZXcpICE9IG51bGwgPyBfdGFyZ2V0JG93bmVyRG9jdW1lbnQgOiB3aW5kb3c7XG59XG5cbmZ1bmN0aW9uIGlzRG9jdW1lbnQobm9kZSkge1xuICBjb25zdCB7XG4gICAgRG9jdW1lbnRcbiAgfSA9IGdldFdpbmRvdyhub2RlKTtcbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBEb2N1bWVudDtcbn1cblxuZnVuY3Rpb24gaXNIVE1MRWxlbWVudChub2RlKSB7XG4gIGlmIChpc1dpbmRvdyhub2RlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBub2RlIGluc3RhbmNlb2YgZ2V0V2luZG93KG5vZGUpLkhUTUxFbGVtZW50O1xufVxuXG5mdW5jdGlvbiBpc1NWR0VsZW1lbnQobm9kZSkge1xuICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIGdldFdpbmRvdyhub2RlKS5TVkdFbGVtZW50O1xufVxuXG5mdW5jdGlvbiBnZXRPd25lckRvY3VtZW50KHRhcmdldCkge1xuICBpZiAoIXRhcmdldCkge1xuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGlmIChpc1dpbmRvdyh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIHRhcmdldC5kb2N1bWVudDtcbiAgfVxuXG4gIGlmICghaXNOb2RlKHRhcmdldCkpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBpZiAoaXNEb2N1bWVudCh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuXG4gIGlmIChpc0hUTUxFbGVtZW50KHRhcmdldCkgfHwgaXNTVkdFbGVtZW50KHRhcmdldCkpIHtcbiAgICByZXR1cm4gdGFyZ2V0Lm93bmVyRG9jdW1lbnQ7XG4gIH1cblxuICByZXR1cm4gZG9jdW1lbnQ7XG59XG5cbi8qKlxyXG4gKiBBIGhvb2sgdGhhdCByZXNvbHZlcyB0byB1c2VFZmZlY3Qgb24gdGhlIHNlcnZlciBhbmQgdXNlTGF5b3V0RWZmZWN0IG9uIHRoZSBjbGllbnRcclxuICogQHBhcmFtIGNhbGxiYWNrIHtmdW5jdGlvbn0gQ2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBpcyBpbnZva2VkIHdoZW4gdGhlIGRlcGVuZGVuY2llcyBvZiB0aGUgaG9vayBjaGFuZ2VcclxuICovXG5cbmNvbnN0IHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QgPSBjYW5Vc2VET00gPyB1c2VMYXlvdXRFZmZlY3QgOiB1c2VFZmZlY3Q7XG5cbmZ1bmN0aW9uIHVzZUV2ZW50KGhhbmRsZXIpIHtcbiAgY29uc3QgaGFuZGxlclJlZiA9IHVzZVJlZihoYW5kbGVyKTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaGFuZGxlclJlZi5jdXJyZW50ID0gaGFuZGxlcjtcbiAgfSk7XG4gIHJldHVybiB1c2VDYWxsYmFjayhmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVyUmVmLmN1cnJlbnQgPT0gbnVsbCA/IHZvaWQgMCA6IGhhbmRsZXJSZWYuY3VycmVudCguLi5hcmdzKTtcbiAgfSwgW10pO1xufVxuXG5mdW5jdGlvbiB1c2VJbnRlcnZhbCgpIHtcbiAgY29uc3QgaW50ZXJ2YWxSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNldCA9IHVzZUNhbGxiYWNrKChsaXN0ZW5lciwgZHVyYXRpb24pID0+IHtcbiAgICBpbnRlcnZhbFJlZi5jdXJyZW50ID0gc2V0SW50ZXJ2YWwobGlzdGVuZXIsIGR1cmF0aW9uKTtcbiAgfSwgW10pO1xuICBjb25zdCBjbGVhciA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoaW50ZXJ2YWxSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZi5jdXJyZW50KTtcbiAgICAgIGludGVydmFsUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgfSwgW10pO1xuICByZXR1cm4gW3NldCwgY2xlYXJdO1xufVxuXG5mdW5jdGlvbiB1c2VMYXRlc3RWYWx1ZSh2YWx1ZSwgZGVwZW5kZW5jaWVzKSB7XG4gIGlmIChkZXBlbmRlbmNpZXMgPT09IHZvaWQgMCkge1xuICAgIGRlcGVuZGVuY2llcyA9IFt2YWx1ZV07XG4gIH1cblxuICBjb25zdCB2YWx1ZVJlZiA9IHVzZVJlZih2YWx1ZSk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICh2YWx1ZVJlZi5jdXJyZW50ICE9PSB2YWx1ZSkge1xuICAgICAgdmFsdWVSZWYuY3VycmVudCA9IHZhbHVlO1xuICAgIH1cbiAgfSwgZGVwZW5kZW5jaWVzKTtcbiAgcmV0dXJuIHZhbHVlUmVmO1xufVxuXG5mdW5jdGlvbiB1c2VMYXp5TWVtbyhjYWxsYmFjaywgZGVwZW5kZW5jaWVzKSB7XG4gIGNvbnN0IHZhbHVlUmVmID0gdXNlUmVmKCk7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlUmVmLmN1cnJlbnQpO1xuICAgIHZhbHVlUmVmLmN1cnJlbnQgPSBuZXdWYWx1ZTtcbiAgICByZXR1cm4gbmV3VmFsdWU7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgWy4uLmRlcGVuZGVuY2llc10pO1xufVxuXG5mdW5jdGlvbiB1c2VOb2RlUmVmKG9uQ2hhbmdlKSB7XG4gIGNvbnN0IG9uQ2hhbmdlSGFuZGxlciA9IHVzZUV2ZW50KG9uQ2hhbmdlKTtcbiAgY29uc3Qgbm9kZSA9IHVzZVJlZihudWxsKTtcbiAgY29uc3Qgc2V0Tm9kZVJlZiA9IHVzZUNhbGxiYWNrKGVsZW1lbnQgPT4ge1xuICAgIGlmIChlbGVtZW50ICE9PSBub2RlLmN1cnJlbnQpIHtcbiAgICAgIG9uQ2hhbmdlSGFuZGxlciA9PSBudWxsID8gdm9pZCAwIDogb25DaGFuZ2VIYW5kbGVyKGVsZW1lbnQsIG5vZGUuY3VycmVudCk7XG4gICAgfVxuXG4gICAgbm9kZS5jdXJyZW50ID0gZWxlbWVudDtcbiAgfSwgLy9lc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgW10pO1xuICByZXR1cm4gW25vZGUsIHNldE5vZGVSZWZdO1xufVxuXG5mdW5jdGlvbiB1c2VQcmV2aW91cyh2YWx1ZSkge1xuICBjb25zdCByZWYgPSB1c2VSZWYoKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICByZWYuY3VycmVudCA9IHZhbHVlO1xuICB9LCBbdmFsdWVdKTtcbiAgcmV0dXJuIHJlZi5jdXJyZW50O1xufVxuXG5sZXQgaWRzID0ge307XG5mdW5jdGlvbiB1c2VVbmlxdWVJZChwcmVmaXgsIHZhbHVlKSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IGlkc1twcmVmaXhdID09IG51bGwgPyAwIDogaWRzW3ByZWZpeF0gKyAxO1xuICAgIGlkc1twcmVmaXhdID0gaWQ7XG4gICAgcmV0dXJuIHByZWZpeCArIFwiLVwiICsgaWQ7XG4gIH0sIFtwcmVmaXgsIHZhbHVlXSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkanVzdG1lbnRGbihtb2RpZmllcikge1xuICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhZGp1c3RtZW50cyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhZGp1c3RtZW50c1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFkanVzdG1lbnRzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGFkanVzdG1lbnQpID0+IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhhZGp1c3RtZW50KTtcblxuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZUFkanVzdG1lbnRdIG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhY2N1bXVsYXRvcltrZXldO1xuXG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgYWNjdW11bGF0b3Jba2V5XSA9IHZhbHVlICsgbW9kaWZpZXIgKiB2YWx1ZUFkanVzdG1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICAgIH0sIHsgLi4ub2JqZWN0XG4gICAgfSk7XG4gIH07XG59XG5cbmNvbnN0IGFkZCA9IC8qI19fUFVSRV9fKi9jcmVhdGVBZGp1c3RtZW50Rm4oMSk7XG5jb25zdCBzdWJ0cmFjdCA9IC8qI19fUFVSRV9fKi9jcmVhdGVBZGp1c3RtZW50Rm4oLTEpO1xuXG5mdW5jdGlvbiBoYXNWaWV3cG9ydFJlbGF0aXZlQ29vcmRpbmF0ZXMoZXZlbnQpIHtcbiAgcmV0dXJuICdjbGllbnRYJyBpbiBldmVudCAmJiAnY2xpZW50WScgaW4gZXZlbnQ7XG59XG5cbmZ1bmN0aW9uIGlzS2V5Ym9hcmRFdmVudChldmVudCkge1xuICBpZiAoIWV2ZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIEtleWJvYXJkRXZlbnRcbiAgfSA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICByZXR1cm4gS2V5Ym9hcmRFdmVudCAmJiBldmVudCBpbnN0YW5jZW9mIEtleWJvYXJkRXZlbnQ7XG59XG5cbmZ1bmN0aW9uIGlzVG91Y2hFdmVudChldmVudCkge1xuICBpZiAoIWV2ZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIFRvdWNoRXZlbnRcbiAgfSA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpO1xuICByZXR1cm4gVG91Y2hFdmVudCAmJiBldmVudCBpbnN0YW5jZW9mIFRvdWNoRXZlbnQ7XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBub3JtYWxpemVkIHggYW5kIHkgY29vcmRpbmF0ZXMgZm9yIG1vdXNlIGFuZCB0b3VjaCBldmVudHMuXHJcbiAqL1xuXG5mdW5jdGlvbiBnZXRFdmVudENvb3JkaW5hdGVzKGV2ZW50KSB7XG4gIGlmIChpc1RvdWNoRXZlbnQoZXZlbnQpKSB7XG4gICAgaWYgKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY2xpZW50WDogeCxcbiAgICAgICAgY2xpZW50WTogeVxuICAgICAgfSA9IGV2ZW50LnRvdWNoZXNbMF07XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4LFxuICAgICAgICB5XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoZXZlbnQuY2hhbmdlZFRvdWNoZXMgJiYgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNsaWVudFg6IHgsXG4gICAgICAgIGNsaWVudFk6IHlcbiAgICAgIH0gPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHgsXG4gICAgICAgIHlcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc1ZpZXdwb3J0UmVsYXRpdmVDb29yZGluYXRlcyhldmVudCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogZXZlbnQuY2xpZW50WCxcbiAgICAgIHk6IGV2ZW50LmNsaWVudFlcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNvbnN0IENTUyA9IC8qI19fUFVSRV9fKi9PYmplY3QuZnJlZXplKHtcbiAgVHJhbnNsYXRlOiB7XG4gICAgdG9TdHJpbmcodHJhbnNmb3JtKSB7XG4gICAgICBpZiAoIXRyYW5zZm9ybSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgeCxcbiAgICAgICAgeVxuICAgICAgfSA9IHRyYW5zZm9ybTtcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZTNkKFwiICsgKHggPyBNYXRoLnJvdW5kKHgpIDogMCkgKyBcInB4LCBcIiArICh5ID8gTWF0aC5yb3VuZCh5KSA6IDApICsgXCJweCwgMClcIjtcbiAgICB9XG5cbiAgfSxcbiAgU2NhbGU6IHtcbiAgICB0b1N0cmluZyh0cmFuc2Zvcm0pIHtcbiAgICAgIGlmICghdHJhbnNmb3JtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBzY2FsZVgsXG4gICAgICAgIHNjYWxlWVxuICAgICAgfSA9IHRyYW5zZm9ybTtcbiAgICAgIHJldHVybiBcInNjYWxlWChcIiArIHNjYWxlWCArIFwiKSBzY2FsZVkoXCIgKyBzY2FsZVkgKyBcIilcIjtcbiAgICB9XG5cbiAgfSxcbiAgVHJhbnNmb3JtOiB7XG4gICAgdG9TdHJpbmcodHJhbnNmb3JtKSB7XG4gICAgICBpZiAoIXRyYW5zZm9ybSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBbQ1NTLlRyYW5zbGF0ZS50b1N0cmluZyh0cmFuc2Zvcm0pLCBDU1MuU2NhbGUudG9TdHJpbmcodHJhbnNmb3JtKV0uam9pbignICcpO1xuICAgIH1cblxuICB9LFxuICBUcmFuc2l0aW9uOiB7XG4gICAgdG9TdHJpbmcoX3JlZikge1xuICAgICAgbGV0IHtcbiAgICAgICAgcHJvcGVydHksXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBlYXNpbmdcbiAgICAgIH0gPSBfcmVmO1xuICAgICAgcmV0dXJuIHByb3BlcnR5ICsgXCIgXCIgKyBkdXJhdGlvbiArIFwibXMgXCIgKyBlYXNpbmc7XG4gICAgfVxuXG4gIH1cbn0pO1xuXG5jb25zdCBTRUxFQ1RPUiA9ICdhLGZyYW1lLGlmcmFtZSxpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSk6bm90KDpkaXNhYmxlZCksc2VsZWN0Om5vdCg6ZGlzYWJsZWQpLHRleHRhcmVhOm5vdCg6ZGlzYWJsZWQpLGJ1dHRvbjpub3QoOmRpc2FibGVkKSwqW3RhYmluZGV4XSc7XG5mdW5jdGlvbiBmaW5kRmlyc3RGb2N1c2FibGVOb2RlKGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQubWF0Y2hlcyhTRUxFQ1RPUikpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoU0VMRUNUT1IpO1xufVxuXG5leHBvcnQgeyBDU1MsIGFkZCwgY2FuVXNlRE9NLCBmaW5kRmlyc3RGb2N1c2FibGVOb2RlLCBnZXRFdmVudENvb3JkaW5hdGVzLCBnZXRPd25lckRvY3VtZW50LCBnZXRXaW5kb3csIGhhc1ZpZXdwb3J0UmVsYXRpdmVDb29yZGluYXRlcywgaXNEb2N1bWVudCwgaXNIVE1MRWxlbWVudCwgaXNLZXlib2FyZEV2ZW50LCBpc05vZGUsIGlzU1ZHRWxlbWVudCwgaXNUb3VjaEV2ZW50LCBpc1dpbmRvdywgc3VidHJhY3QsIHVzZUNvbWJpbmVkUmVmcywgdXNlRXZlbnQsIHVzZUludGVydmFsLCB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0LCB1c2VMYXRlc3RWYWx1ZSwgdXNlTGF6eU1lbW8sIHVzZU5vZGVSZWYsIHVzZVByZXZpb3VzLCB1c2VVbmlxdWVJZCB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbGl0aWVzLmVzbS5qcy5tYXBcbiIsImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCc7XG5cbmNvbnN0IGhpZGRlblN0eWxlcyA9IHtcbiAgZGlzcGxheTogJ25vbmUnXG59O1xuZnVuY3Rpb24gSGlkZGVuVGV4dChfcmVmKSB7XG4gIGxldCB7XG4gICAgaWQsXG4gICAgdmFsdWVcbiAgfSA9IF9yZWY7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtcbiAgICBpZDogaWQsXG4gICAgc3R5bGU6IGhpZGRlblN0eWxlc1xuICB9LCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIExpdmVSZWdpb24oX3JlZikge1xuICBsZXQge1xuICAgIGlkLFxuICAgIGFubm91bmNlbWVudCxcbiAgICBhcmlhTGl2ZVR5cGUgPSBcImFzc2VydGl2ZVwiXG4gIH0gPSBfcmVmO1xuICAvLyBIaWRlIGVsZW1lbnQgdmlzdWFsbHkgYnV0IGtlZXAgaXQgcmVhZGFibGUgYnkgc2NyZWVuIHJlYWRlcnNcbiAgY29uc3QgdmlzdWFsbHlIaWRkZW4gPSB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgd2lkdGg6IDEsXG4gICAgaGVpZ2h0OiAxLFxuICAgIG1hcmdpbjogLTEsXG4gICAgYm9yZGVyOiAwLFxuICAgIHBhZGRpbmc6IDAsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgIGNsaXA6ICdyZWN0KDAgMCAwIDApJyxcbiAgICBjbGlwUGF0aDogJ2luc2V0KDEwMCUpJyxcbiAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xuICB9O1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7XG4gICAgaWQ6IGlkLFxuICAgIHN0eWxlOiB2aXN1YWxseUhpZGRlbixcbiAgICByb2xlOiBcInN0YXR1c1wiLFxuICAgIFwiYXJpYS1saXZlXCI6IGFyaWFMaXZlVHlwZSxcbiAgICBcImFyaWEtYXRvbWljXCI6IHRydWVcbiAgfSwgYW5ub3VuY2VtZW50KTtcbn1cblxuZnVuY3Rpb24gdXNlQW5ub3VuY2VtZW50KCkge1xuICBjb25zdCBbYW5ub3VuY2VtZW50LCBzZXRBbm5vdW5jZW1lbnRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBhbm5vdW5jZSA9IHVzZUNhbGxiYWNrKHZhbHVlID0+IHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgc2V0QW5ub3VuY2VtZW50KHZhbHVlKTtcbiAgICB9XG4gIH0sIFtdKTtcbiAgcmV0dXJuIHtcbiAgICBhbm5vdW5jZSxcbiAgICBhbm5vdW5jZW1lbnRcbiAgfTtcbn1cblxuZXhwb3J0IHsgSGlkZGVuVGV4dCwgTGl2ZVJlZ2lvbiwgdXNlQW5ub3VuY2VtZW50IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hY2Nlc3NpYmlsaXR5LmVzbS5qcy5tYXBcbiIsImltcG9ydCBSZWFjdCwgeyBjcmVhdGVDb250ZXh0LCB1c2VDb250ZXh0LCB1c2VFZmZlY3QsIHVzZVN0YXRlLCB1c2VDYWxsYmFjaywgdXNlTWVtbywgdXNlUmVmLCBtZW1vLCB1c2VSZWR1Y2VyLCBjbG9uZUVsZW1lbnQsIGZvcndhcmRSZWYgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBjcmVhdGVQb3J0YWwsIHVuc3RhYmxlX2JhdGNoZWRVcGRhdGVzIH0gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7IHVzZVVuaXF1ZUlkLCBnZXRFdmVudENvb3JkaW5hdGVzLCBnZXRXaW5kb3csIGlzRG9jdW1lbnQsIGlzSFRNTEVsZW1lbnQsIGlzU1ZHRWxlbWVudCwgY2FuVXNlRE9NLCBpc1dpbmRvdywgaXNOb2RlLCBnZXRPd25lckRvY3VtZW50LCBhZGQsIGlzS2V5Ym9hcmRFdmVudCwgc3VidHJhY3QsIHVzZUxhenlNZW1vLCB1c2VJbnRlcnZhbCwgdXNlUHJldmlvdXMsIHVzZUxhdGVzdFZhbHVlLCB1c2VFdmVudCwgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCwgdXNlTm9kZVJlZiwgZmluZEZpcnN0Rm9jdXNhYmxlTm9kZSwgQ1NTIH0gZnJvbSAnQGRuZC1raXQvdXRpbGl0aWVzJztcbmltcG9ydCB7IHVzZUFubm91bmNlbWVudCwgSGlkZGVuVGV4dCwgTGl2ZVJlZ2lvbiB9IGZyb20gJ0BkbmQta2l0L2FjY2Vzc2liaWxpdHknO1xuXG5jb25zdCBEbmRNb25pdG9yQ29udGV4dCA9IC8qI19fUFVSRV9fKi9jcmVhdGVDb250ZXh0KG51bGwpO1xuXG5mdW5jdGlvbiB1c2VEbmRNb25pdG9yKGxpc3RlbmVyKSB7XG4gIGNvbnN0IHJlZ2lzdGVyTGlzdGVuZXIgPSB1c2VDb250ZXh0KERuZE1vbml0b3JDb250ZXh0KTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXJlZ2lzdGVyTGlzdGVuZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndXNlRG5kTW9uaXRvciBtdXN0IGJlIHVzZWQgd2l0aGluIGEgY2hpbGRyZW4gb2YgPERuZENvbnRleHQ+Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSByZWdpc3Rlckxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gdW5zdWJzY3JpYmU7XG4gIH0sIFtsaXN0ZW5lciwgcmVnaXN0ZXJMaXN0ZW5lcl0pO1xufVxuXG5mdW5jdGlvbiB1c2VEbmRNb25pdG9yUHJvdmlkZXIoKSB7XG4gIGNvbnN0IFtsaXN0ZW5lcnNdID0gdXNlU3RhdGUoKCkgPT4gbmV3IFNldCgpKTtcbiAgY29uc3QgcmVnaXN0ZXJMaXN0ZW5lciA9IHVzZUNhbGxiYWNrKGxpc3RlbmVyID0+IHtcbiAgICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4gbGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH0sIFtsaXN0ZW5lcnNdKTtcbiAgY29uc3QgZGlzcGF0Y2ggPSB1c2VDYWxsYmFjayhfcmVmID0+IHtcbiAgICBsZXQge1xuICAgICAgdHlwZSxcbiAgICAgIGV2ZW50XG4gICAgfSA9IF9yZWY7XG4gICAgbGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgdmFyIF9saXN0ZW5lciR0eXBlO1xuXG4gICAgICByZXR1cm4gKF9saXN0ZW5lciR0eXBlID0gbGlzdGVuZXJbdHlwZV0pID09IG51bGwgPyB2b2lkIDAgOiBfbGlzdGVuZXIkdHlwZS5jYWxsKGxpc3RlbmVyLCBldmVudCk7XG4gICAgfSk7XG4gIH0sIFtsaXN0ZW5lcnNdKTtcbiAgcmV0dXJuIFtkaXNwYXRjaCwgcmVnaXN0ZXJMaXN0ZW5lcl07XG59XG5cbmNvbnN0IGRlZmF1bHRTY3JlZW5SZWFkZXJJbnN0cnVjdGlvbnMgPSB7XG4gIGRyYWdnYWJsZTogXCJcXG4gICAgVG8gcGljayB1cCBhIGRyYWdnYWJsZSBpdGVtLCBwcmVzcyB0aGUgc3BhY2UgYmFyLlxcbiAgICBXaGlsZSBkcmFnZ2luZywgdXNlIHRoZSBhcnJvdyBrZXlzIHRvIG1vdmUgdGhlIGl0ZW0uXFxuICAgIFByZXNzIHNwYWNlIGFnYWluIHRvIGRyb3AgdGhlIGl0ZW0gaW4gaXRzIG5ldyBwb3NpdGlvbiwgb3IgcHJlc3MgZXNjYXBlIHRvIGNhbmNlbC5cXG4gIFwiXG59O1xuY29uc3QgZGVmYXVsdEFubm91bmNlbWVudHMgPSB7XG4gIG9uRHJhZ1N0YXJ0KF9yZWYpIHtcbiAgICBsZXQge1xuICAgICAgYWN0aXZlXG4gICAgfSA9IF9yZWY7XG4gICAgcmV0dXJuIFwiUGlja2VkIHVwIGRyYWdnYWJsZSBpdGVtIFwiICsgYWN0aXZlLmlkICsgXCIuXCI7XG4gIH0sXG5cbiAgb25EcmFnT3ZlcihfcmVmMikge1xuICAgIGxldCB7XG4gICAgICBhY3RpdmUsXG4gICAgICBvdmVyXG4gICAgfSA9IF9yZWYyO1xuXG4gICAgaWYgKG92ZXIpIHtcbiAgICAgIHJldHVybiBcIkRyYWdnYWJsZSBpdGVtIFwiICsgYWN0aXZlLmlkICsgXCIgd2FzIG1vdmVkIG92ZXIgZHJvcHBhYmxlIGFyZWEgXCIgKyBvdmVyLmlkICsgXCIuXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiRHJhZ2dhYmxlIGl0ZW0gXCIgKyBhY3RpdmUuaWQgKyBcIiBpcyBubyBsb25nZXIgb3ZlciBhIGRyb3BwYWJsZSBhcmVhLlwiO1xuICB9LFxuXG4gIG9uRHJhZ0VuZChfcmVmMykge1xuICAgIGxldCB7XG4gICAgICBhY3RpdmUsXG4gICAgICBvdmVyXG4gICAgfSA9IF9yZWYzO1xuXG4gICAgaWYgKG92ZXIpIHtcbiAgICAgIHJldHVybiBcIkRyYWdnYWJsZSBpdGVtIFwiICsgYWN0aXZlLmlkICsgXCIgd2FzIGRyb3BwZWQgb3ZlciBkcm9wcGFibGUgYXJlYSBcIiArIG92ZXIuaWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiRHJhZ2dhYmxlIGl0ZW0gXCIgKyBhY3RpdmUuaWQgKyBcIiB3YXMgZHJvcHBlZC5cIjtcbiAgfSxcblxuICBvbkRyYWdDYW5jZWwoX3JlZjQpIHtcbiAgICBsZXQge1xuICAgICAgYWN0aXZlXG4gICAgfSA9IF9yZWY0O1xuICAgIHJldHVybiBcIkRyYWdnaW5nIHdhcyBjYW5jZWxsZWQuIERyYWdnYWJsZSBpdGVtIFwiICsgYWN0aXZlLmlkICsgXCIgd2FzIGRyb3BwZWQuXCI7XG4gIH1cblxufTtcblxuZnVuY3Rpb24gQWNjZXNzaWJpbGl0eShfcmVmKSB7XG4gIGxldCB7XG4gICAgYW5ub3VuY2VtZW50cyA9IGRlZmF1bHRBbm5vdW5jZW1lbnRzLFxuICAgIGNvbnRhaW5lcixcbiAgICBoaWRkZW5UZXh0RGVzY3JpYmVkQnlJZCxcbiAgICBzY3JlZW5SZWFkZXJJbnN0cnVjdGlvbnMgPSBkZWZhdWx0U2NyZWVuUmVhZGVySW5zdHJ1Y3Rpb25zXG4gIH0gPSBfcmVmO1xuICBjb25zdCB7XG4gICAgYW5ub3VuY2UsXG4gICAgYW5ub3VuY2VtZW50XG4gIH0gPSB1c2VBbm5vdW5jZW1lbnQoKTtcbiAgY29uc3QgbGl2ZVJlZ2lvbklkID0gdXNlVW5pcXVlSWQoXCJEbmRMaXZlUmVnaW9uXCIpO1xuICBjb25zdCBbbW91bnRlZCwgc2V0TW91bnRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgc2V0TW91bnRlZCh0cnVlKTtcbiAgfSwgW10pO1xuICB1c2VEbmRNb25pdG9yKHVzZU1lbW8oKCkgPT4gKHtcbiAgICBvbkRyYWdTdGFydChfcmVmMikge1xuICAgICAgbGV0IHtcbiAgICAgICAgYWN0aXZlXG4gICAgICB9ID0gX3JlZjI7XG4gICAgICBhbm5vdW5jZShhbm5vdW5jZW1lbnRzLm9uRHJhZ1N0YXJ0KHtcbiAgICAgICAgYWN0aXZlXG4gICAgICB9KSk7XG4gICAgfSxcblxuICAgIG9uRHJhZ01vdmUoX3JlZjMpIHtcbiAgICAgIGxldCB7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSA9IF9yZWYzO1xuXG4gICAgICBpZiAoYW5ub3VuY2VtZW50cy5vbkRyYWdNb3ZlKSB7XG4gICAgICAgIGFubm91bmNlKGFubm91bmNlbWVudHMub25EcmFnTW92ZSh7XG4gICAgICAgICAgYWN0aXZlLFxuICAgICAgICAgIG92ZXJcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkRyYWdPdmVyKF9yZWY0KSB7XG4gICAgICBsZXQge1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0gPSBfcmVmNDtcbiAgICAgIGFubm91bmNlKGFubm91bmNlbWVudHMub25EcmFnT3Zlcih7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICBvbkRyYWdFbmQoX3JlZjUpIHtcbiAgICAgIGxldCB7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSA9IF9yZWY1O1xuICAgICAgYW5ub3VuY2UoYW5ub3VuY2VtZW50cy5vbkRyYWdFbmQoe1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgb25EcmFnQ2FuY2VsKF9yZWY2KSB7XG4gICAgICBsZXQge1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0gPSBfcmVmNjtcbiAgICAgIGFubm91bmNlKGFubm91bmNlbWVudHMub25EcmFnQ2FuY2VsKHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9KSk7XG4gICAgfVxuXG4gIH0pLCBbYW5ub3VuY2UsIGFubm91bmNlbWVudHNdKSk7XG5cbiAgaWYgKCFtb3VudGVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBtYXJrdXAgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFJlYWN0LkZyYWdtZW50LCBudWxsLCBSZWFjdC5jcmVhdGVFbGVtZW50KEhpZGRlblRleHQsIHtcbiAgICBpZDogaGlkZGVuVGV4dERlc2NyaWJlZEJ5SWQsXG4gICAgdmFsdWU6IHNjcmVlblJlYWRlckluc3RydWN0aW9ucy5kcmFnZ2FibGVcbiAgfSksIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTGl2ZVJlZ2lvbiwge1xuICAgIGlkOiBsaXZlUmVnaW9uSWQsXG4gICAgYW5ub3VuY2VtZW50OiBhbm5vdW5jZW1lbnRcbiAgfSkpO1xuICByZXR1cm4gY29udGFpbmVyID8gY3JlYXRlUG9ydGFsKG1hcmt1cCwgY29udGFpbmVyKSA6IG1hcmt1cDtcbn1cblxudmFyIEFjdGlvbjtcblxuKGZ1bmN0aW9uIChBY3Rpb24pIHtcbiAgQWN0aW9uW1wiRHJhZ1N0YXJ0XCJdID0gXCJkcmFnU3RhcnRcIjtcbiAgQWN0aW9uW1wiRHJhZ01vdmVcIl0gPSBcImRyYWdNb3ZlXCI7XG4gIEFjdGlvbltcIkRyYWdFbmRcIl0gPSBcImRyYWdFbmRcIjtcbiAgQWN0aW9uW1wiRHJhZ0NhbmNlbFwiXSA9IFwiZHJhZ0NhbmNlbFwiO1xuICBBY3Rpb25bXCJEcmFnT3ZlclwiXSA9IFwiZHJhZ092ZXJcIjtcbiAgQWN0aW9uW1wiUmVnaXN0ZXJEcm9wcGFibGVcIl0gPSBcInJlZ2lzdGVyRHJvcHBhYmxlXCI7XG4gIEFjdGlvbltcIlNldERyb3BwYWJsZURpc2FibGVkXCJdID0gXCJzZXREcm9wcGFibGVEaXNhYmxlZFwiO1xuICBBY3Rpb25bXCJVbnJlZ2lzdGVyRHJvcHBhYmxlXCJdID0gXCJ1bnJlZ2lzdGVyRHJvcHBhYmxlXCI7XG59KShBY3Rpb24gfHwgKEFjdGlvbiA9IHt9KSk7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiB1c2VTZW5zb3Ioc2Vuc29yLCBvcHRpb25zKSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+ICh7XG4gICAgc2Vuc29yLFxuICAgIG9wdGlvbnM6IG9wdGlvbnMgIT0gbnVsbCA/IG9wdGlvbnMgOiB7fVxuICB9KSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbc2Vuc29yLCBvcHRpb25zXSk7XG59XG5cbmZ1bmN0aW9uIHVzZVNlbnNvcnMoKSB7XG4gIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBzZW5zb3JzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgIHNlbnNvcnNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gIH1cblxuICByZXR1cm4gdXNlTWVtbygoKSA9PiBbLi4uc2Vuc29yc10uZmlsdGVyKHNlbnNvciA9PiBzZW5zb3IgIT0gbnVsbCksIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgWy4uLnNlbnNvcnNdKTtcbn1cblxuY29uc3QgZGVmYXVsdENvb3JkaW5hdGVzID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICB4OiAwLFxuICB5OiAwXG59KTtcblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHBvaW50c1xyXG4gKi9cbmZ1bmN0aW9uIGRpc3RhbmNlQmV0d2VlbihwMSwgcDIpIHtcbiAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwMS54IC0gcDIueCwgMikgKyBNYXRoLnBvdyhwMS55IC0gcDIueSwgMikpO1xufVxuXG5mdW5jdGlvbiBnZXRSZWxhdGl2ZVRyYW5zZm9ybU9yaWdpbihldmVudCwgcmVjdCkge1xuICBjb25zdCBldmVudENvb3JkaW5hdGVzID0gZ2V0RXZlbnRDb29yZGluYXRlcyhldmVudCk7XG5cbiAgaWYgKCFldmVudENvb3JkaW5hdGVzKSB7XG4gICAgcmV0dXJuICcwIDAnO1xuICB9XG5cbiAgY29uc3QgdHJhbnNmb3JtT3JpZ2luID0ge1xuICAgIHg6IChldmVudENvb3JkaW5hdGVzLnggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aCAqIDEwMCxcbiAgICB5OiAoZXZlbnRDb29yZGluYXRlcy55IC0gcmVjdC50b3ApIC8gcmVjdC5oZWlnaHQgKiAxMDBcbiAgfTtcbiAgcmV0dXJuIHRyYW5zZm9ybU9yaWdpbi54ICsgXCIlIFwiICsgdHJhbnNmb3JtT3JpZ2luLnkgKyBcIiVcIjtcbn1cblxuLyoqXHJcbiAqIFNvcnQgY29sbGlzaW9ucyBmcm9tIHNtYWxsZXN0IHRvIGdyZWF0ZXN0IHZhbHVlXHJcbiAqL1xuZnVuY3Rpb24gc29ydENvbGxpc2lvbnNBc2MoX3JlZiwgX3JlZjIpIHtcbiAgbGV0IHtcbiAgICBkYXRhOiB7XG4gICAgICB2YWx1ZTogYVxuICAgIH1cbiAgfSA9IF9yZWY7XG4gIGxldCB7XG4gICAgZGF0YToge1xuICAgICAgdmFsdWU6IGJcbiAgICB9XG4gIH0gPSBfcmVmMjtcbiAgcmV0dXJuIGEgLSBiO1xufVxuLyoqXHJcbiAqIFNvcnQgY29sbGlzaW9ucyBmcm9tIGdyZWF0ZXN0IHRvIHNtYWxsZXN0IHZhbHVlXHJcbiAqL1xuXG5mdW5jdGlvbiBzb3J0Q29sbGlzaW9uc0Rlc2MoX3JlZjMsIF9yZWY0KSB7XG4gIGxldCB7XG4gICAgZGF0YToge1xuICAgICAgdmFsdWU6IGFcbiAgICB9XG4gIH0gPSBfcmVmMztcbiAgbGV0IHtcbiAgICBkYXRhOiB7XG4gICAgICB2YWx1ZTogYlxuICAgIH1cbiAgfSA9IF9yZWY0O1xuICByZXR1cm4gYiAtIGE7XG59XG4vKipcclxuICogUmV0dXJucyB0aGUgY29vcmRpbmF0ZXMgb2YgdGhlIGNvcm5lcnMgb2YgYSBnaXZlbiByZWN0YW5nbGU6XHJcbiAqIFtUb3BMZWZ0IHt4LCB5fSwgVG9wUmlnaHQge3gsIHl9LCBCb3R0b21MZWZ0IHt4LCB5fSwgQm90dG9tUmlnaHQge3gsIHl9XVxyXG4gKi9cblxuZnVuY3Rpb24gY29ybmVyc09mUmVjdGFuZ2xlKF9yZWY1KSB7XG4gIGxldCB7XG4gICAgbGVmdCxcbiAgICB0b3AsXG4gICAgaGVpZ2h0LFxuICAgIHdpZHRoXG4gIH0gPSBfcmVmNTtcbiAgcmV0dXJuIFt7XG4gICAgeDogbGVmdCxcbiAgICB5OiB0b3BcbiAgfSwge1xuICAgIHg6IGxlZnQgKyB3aWR0aCxcbiAgICB5OiB0b3BcbiAgfSwge1xuICAgIHg6IGxlZnQsXG4gICAgeTogdG9wICsgaGVpZ2h0XG4gIH0sIHtcbiAgICB4OiBsZWZ0ICsgd2lkdGgsXG4gICAgeTogdG9wICsgaGVpZ2h0XG4gIH1dO1xufVxuZnVuY3Rpb24gZ2V0Rmlyc3RDb2xsaXNpb24oY29sbGlzaW9ucywgcHJvcGVydHkpIHtcbiAgaWYgKCFjb2xsaXNpb25zIHx8IGNvbGxpc2lvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBbZmlyc3RDb2xsaXNpb25dID0gY29sbGlzaW9ucztcbiAgcmV0dXJuIHByb3BlcnR5ID8gZmlyc3RDb2xsaXNpb25bcHJvcGVydHldIDogZmlyc3RDb2xsaXNpb247XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBjb29yZGluYXRlcyBvZiB0aGUgY2VudGVyIG9mIGEgZ2l2ZW4gQ2xpZW50UmVjdFxyXG4gKi9cblxuZnVuY3Rpb24gY2VudGVyT2ZSZWN0YW5nbGUocmVjdCwgbGVmdCwgdG9wKSB7XG4gIGlmIChsZWZ0ID09PSB2b2lkIDApIHtcbiAgICBsZWZ0ID0gcmVjdC5sZWZ0O1xuICB9XG5cbiAgaWYgKHRvcCA9PT0gdm9pZCAwKSB7XG4gICAgdG9wID0gcmVjdC50b3A7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHg6IGxlZnQgKyByZWN0LndpZHRoICogMC41LFxuICAgIHk6IHRvcCArIHJlY3QuaGVpZ2h0ICogMC41XG4gIH07XG59XG4vKipcclxuICogUmV0dXJucyB0aGUgY2xvc2VzdCByZWN0YW5nbGVzIGZyb20gYW4gYXJyYXkgb2YgcmVjdGFuZ2xlcyB0byB0aGUgY2VudGVyIG9mIGEgZ2l2ZW5cclxuICogcmVjdGFuZ2xlLlxyXG4gKi9cblxuXG5jb25zdCBjbG9zZXN0Q2VudGVyID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgY29sbGlzaW9uUmVjdCxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzXG4gIH0gPSBfcmVmO1xuICBjb25zdCBjZW50ZXJSZWN0ID0gY2VudGVyT2ZSZWN0YW5nbGUoY29sbGlzaW9uUmVjdCwgY29sbGlzaW9uUmVjdC5sZWZ0LCBjb2xsaXNpb25SZWN0LnRvcCk7XG4gIGNvbnN0IGNvbGxpc2lvbnMgPSBbXTtcblxuICBmb3IgKGNvbnN0IGRyb3BwYWJsZUNvbnRhaW5lciBvZiBkcm9wcGFibGVDb250YWluZXJzKSB7XG4gICAgY29uc3Qge1xuICAgICAgaWRcbiAgICB9ID0gZHJvcHBhYmxlQ29udGFpbmVyO1xuICAgIGNvbnN0IHJlY3QgPSBkcm9wcGFibGVSZWN0cy5nZXQoaWQpO1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIGNvbnN0IGRpc3RCZXR3ZWVuID0gZGlzdGFuY2VCZXR3ZWVuKGNlbnRlck9mUmVjdGFuZ2xlKHJlY3QpLCBjZW50ZXJSZWN0KTtcbiAgICAgIGNvbGxpc2lvbnMucHVzaCh7XG4gICAgICAgIGlkLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZHJvcHBhYmxlQ29udGFpbmVyLFxuICAgICAgICAgIHZhbHVlOiBkaXN0QmV0d2VlblxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29sbGlzaW9ucy5zb3J0KHNvcnRDb2xsaXNpb25zQXNjKTtcbn07XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBjbG9zZXN0IHJlY3RhbmdsZXMgZnJvbSBhbiBhcnJheSBvZiByZWN0YW5nbGVzIHRvIHRoZSBjb3JuZXJzIG9mXHJcbiAqIGFub3RoZXIgcmVjdGFuZ2xlLlxyXG4gKi9cblxuY29uc3QgY2xvc2VzdENvcm5lcnMgPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBjb2xsaXNpb25SZWN0LFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnNcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGNvcm5lcnMgPSBjb3JuZXJzT2ZSZWN0YW5nbGUoY29sbGlzaW9uUmVjdCk7XG4gIGNvbnN0IGNvbGxpc2lvbnMgPSBbXTtcblxuICBmb3IgKGNvbnN0IGRyb3BwYWJsZUNvbnRhaW5lciBvZiBkcm9wcGFibGVDb250YWluZXJzKSB7XG4gICAgY29uc3Qge1xuICAgICAgaWRcbiAgICB9ID0gZHJvcHBhYmxlQ29udGFpbmVyO1xuICAgIGNvbnN0IHJlY3QgPSBkcm9wcGFibGVSZWN0cy5nZXQoaWQpO1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIGNvbnN0IHJlY3RDb3JuZXJzID0gY29ybmVyc09mUmVjdGFuZ2xlKHJlY3QpO1xuICAgICAgY29uc3QgZGlzdGFuY2VzID0gY29ybmVycy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBjb3JuZXIsIGluZGV4KSA9PiB7XG4gICAgICAgIHJldHVybiBhY2N1bXVsYXRvciArIGRpc3RhbmNlQmV0d2VlbihyZWN0Q29ybmVyc1tpbmRleF0sIGNvcm5lcik7XG4gICAgICB9LCAwKTtcbiAgICAgIGNvbnN0IGVmZmVjdGl2ZURpc3RhbmNlID0gTnVtYmVyKChkaXN0YW5jZXMgLyA0KS50b0ZpeGVkKDQpKTtcbiAgICAgIGNvbGxpc2lvbnMucHVzaCh7XG4gICAgICAgIGlkLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZHJvcHBhYmxlQ29udGFpbmVyLFxuICAgICAgICAgIHZhbHVlOiBlZmZlY3RpdmVEaXN0YW5jZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29sbGlzaW9ucy5zb3J0KHNvcnRDb2xsaXNpb25zQXNjKTtcbn07XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBpbnRlcnNlY3RpbmcgcmVjdGFuZ2xlIGFyZWEgYmV0d2VlbiB0d28gcmVjdGFuZ2xlc1xyXG4gKi9cblxuZnVuY3Rpb24gZ2V0SW50ZXJzZWN0aW9uUmF0aW8oZW50cnksIHRhcmdldCkge1xuICBjb25zdCB0b3AgPSBNYXRoLm1heCh0YXJnZXQudG9wLCBlbnRyeS50b3ApO1xuICBjb25zdCBsZWZ0ID0gTWF0aC5tYXgodGFyZ2V0LmxlZnQsIGVudHJ5LmxlZnQpO1xuICBjb25zdCByaWdodCA9IE1hdGgubWluKHRhcmdldC5sZWZ0ICsgdGFyZ2V0LndpZHRoLCBlbnRyeS5sZWZ0ICsgZW50cnkud2lkdGgpO1xuICBjb25zdCBib3R0b20gPSBNYXRoLm1pbih0YXJnZXQudG9wICsgdGFyZ2V0LmhlaWdodCwgZW50cnkudG9wICsgZW50cnkuaGVpZ2h0KTtcbiAgY29uc3Qgd2lkdGggPSByaWdodCAtIGxlZnQ7XG4gIGNvbnN0IGhlaWdodCA9IGJvdHRvbSAtIHRvcDtcblxuICBpZiAobGVmdCA8IHJpZ2h0ICYmIHRvcCA8IGJvdHRvbSkge1xuICAgIGNvbnN0IHRhcmdldEFyZWEgPSB0YXJnZXQud2lkdGggKiB0YXJnZXQuaGVpZ2h0O1xuICAgIGNvbnN0IGVudHJ5QXJlYSA9IGVudHJ5LndpZHRoICogZW50cnkuaGVpZ2h0O1xuICAgIGNvbnN0IGludGVyc2VjdGlvbkFyZWEgPSB3aWR0aCAqIGhlaWdodDtcbiAgICBjb25zdCBpbnRlcnNlY3Rpb25SYXRpbyA9IGludGVyc2VjdGlvbkFyZWEgLyAodGFyZ2V0QXJlYSArIGVudHJ5QXJlYSAtIGludGVyc2VjdGlvbkFyZWEpO1xuICAgIHJldHVybiBOdW1iZXIoaW50ZXJzZWN0aW9uUmF0aW8udG9GaXhlZCg0KSk7XG4gIH0gLy8gUmVjdGFuZ2xlcyBkbyBub3Qgb3ZlcmxhcCwgb3Igb3ZlcmxhcCBoYXMgYW4gYXJlYSBvZiB6ZXJvIChlZGdlL2Nvcm5lciBvdmVybGFwKVxuXG5cbiAgcmV0dXJuIDA7XG59XG4vKipcclxuICogUmV0dXJucyB0aGUgcmVjdGFuZ2xlcyB0aGF0IGhhcyB0aGUgZ3JlYXRlc3QgaW50ZXJzZWN0aW9uIGFyZWEgd2l0aCBhIGdpdmVuXHJcbiAqIHJlY3RhbmdsZSBpbiBhbiBhcnJheSBvZiByZWN0YW5nbGVzLlxyXG4gKi9cblxuY29uc3QgcmVjdEludGVyc2VjdGlvbiA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGNvbGxpc2lvblJlY3QsXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVyc1xuICB9ID0gX3JlZjtcbiAgY29uc3QgY29sbGlzaW9ucyA9IFtdO1xuXG4gIGZvciAoY29uc3QgZHJvcHBhYmxlQ29udGFpbmVyIG9mIGRyb3BwYWJsZUNvbnRhaW5lcnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBpZFxuICAgIH0gPSBkcm9wcGFibGVDb250YWluZXI7XG4gICAgY29uc3QgcmVjdCA9IGRyb3BwYWJsZVJlY3RzLmdldChpZCk7XG5cbiAgICBpZiAocmVjdCkge1xuICAgICAgY29uc3QgaW50ZXJzZWN0aW9uUmF0aW8gPSBnZXRJbnRlcnNlY3Rpb25SYXRpbyhyZWN0LCBjb2xsaXNpb25SZWN0KTtcblxuICAgICAgaWYgKGludGVyc2VjdGlvblJhdGlvID4gMCkge1xuICAgICAgICBjb2xsaXNpb25zLnB1c2goe1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcixcbiAgICAgICAgICAgIHZhbHVlOiBpbnRlcnNlY3Rpb25SYXRpb1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbGxpc2lvbnMuc29ydChzb3J0Q29sbGlzaW9uc0Rlc2MpO1xufTtcblxuLyoqXHJcbiAqIENoZWNrIGlmIGEgZ2l2ZW4gcG9pbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIGJvdW5kaW5nIHJlY3RhbmdsZVxyXG4gKi9cblxuZnVuY3Rpb24gaXNQb2ludFdpdGhpblJlY3QocG9pbnQsIHJlY3QpIHtcbiAgY29uc3Qge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIGJvdHRvbSxcbiAgICByaWdodFxuICB9ID0gcmVjdDtcbiAgcmV0dXJuIHRvcCA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gYm90dG9tICYmIGxlZnQgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHJpZ2h0O1xufVxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHJlY3RhbmdsZXMgdGhhdCB0aGUgcG9pbnRlciBpcyBob3ZlcmluZyBvdmVyXHJcbiAqL1xuXG5cbmNvbnN0IHBvaW50ZXJXaXRoaW4gPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIHBvaW50ZXJDb29yZGluYXRlc1xuICB9ID0gX3JlZjtcblxuICBpZiAoIXBvaW50ZXJDb29yZGluYXRlcykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IGNvbGxpc2lvbnMgPSBbXTtcblxuICBmb3IgKGNvbnN0IGRyb3BwYWJsZUNvbnRhaW5lciBvZiBkcm9wcGFibGVDb250YWluZXJzKSB7XG4gICAgY29uc3Qge1xuICAgICAgaWRcbiAgICB9ID0gZHJvcHBhYmxlQ29udGFpbmVyO1xuICAgIGNvbnN0IHJlY3QgPSBkcm9wcGFibGVSZWN0cy5nZXQoaWQpO1xuXG4gICAgaWYgKHJlY3QgJiYgaXNQb2ludFdpdGhpblJlY3QocG9pbnRlckNvb3JkaW5hdGVzLCByZWN0KSkge1xuICAgICAgLyogVGhlcmUgbWF5IGJlIG1vcmUgdGhhbiBhIHNpbmdsZSByZWN0YW5nbGUgaW50ZXJzZWN0aW5nXHJcbiAgICAgICAqIHdpdGggdGhlIHBvaW50ZXIgY29vcmRpbmF0ZXMuIEluIG9yZGVyIHRvIHNvcnQgdGhlXHJcbiAgICAgICAqIGNvbGxpZGluZyByZWN0YW5nbGVzLCB3ZSBtZWFzdXJlIHRoZSBkaXN0YW5jZSBiZXR3ZWVuXHJcbiAgICAgICAqIHRoZSBwb2ludGVyIGFuZCB0aGUgY29ybmVycyBvZiB0aGUgaW50ZXJzZWN0aW5nIHJlY3RhbmdsZVxyXG4gICAgICAgKi9cbiAgICAgIGNvbnN0IGNvcm5lcnMgPSBjb3JuZXJzT2ZSZWN0YW5nbGUocmVjdCk7XG4gICAgICBjb25zdCBkaXN0YW5jZXMgPSBjb3JuZXJzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGNvcm5lcikgPT4ge1xuICAgICAgICByZXR1cm4gYWNjdW11bGF0b3IgKyBkaXN0YW5jZUJldHdlZW4ocG9pbnRlckNvb3JkaW5hdGVzLCBjb3JuZXIpO1xuICAgICAgfSwgMCk7XG4gICAgICBjb25zdCBlZmZlY3RpdmVEaXN0YW5jZSA9IE51bWJlcigoZGlzdGFuY2VzIC8gNCkudG9GaXhlZCg0KSk7XG4gICAgICBjb2xsaXNpb25zLnB1c2goe1xuICAgICAgICBpZCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcixcbiAgICAgICAgICB2YWx1ZTogZWZmZWN0aXZlRGlzdGFuY2VcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbGxpc2lvbnMuc29ydChzb3J0Q29sbGlzaW9uc0FzYyk7XG59O1xuXG5mdW5jdGlvbiBhZGp1c3RTY2FsZSh0cmFuc2Zvcm0sIHJlY3QxLCByZWN0Mikge1xuICByZXR1cm4geyAuLi50cmFuc2Zvcm0sXG4gICAgc2NhbGVYOiByZWN0MSAmJiByZWN0MiA/IHJlY3QxLndpZHRoIC8gcmVjdDIud2lkdGggOiAxLFxuICAgIHNjYWxlWTogcmVjdDEgJiYgcmVjdDIgPyByZWN0MS5oZWlnaHQgLyByZWN0Mi5oZWlnaHQgOiAxXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFJlY3REZWx0YShyZWN0MSwgcmVjdDIpIHtcbiAgcmV0dXJuIHJlY3QxICYmIHJlY3QyID8ge1xuICAgIHg6IHJlY3QxLmxlZnQgLSByZWN0Mi5sZWZ0LFxuICAgIHk6IHJlY3QxLnRvcCAtIHJlY3QyLnRvcFxuICB9IDogZGVmYXVsdENvb3JkaW5hdGVzO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWN0QWRqdXN0bWVudEZuKG1vZGlmaWVyKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhZGp1c3RDbGllbnRSZWN0KHJlY3QpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYWRqdXN0bWVudHMgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYWRqdXN0bWVudHNbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHJldHVybiBhZGp1c3RtZW50cy5yZWR1Y2UoKGFjYywgYWRqdXN0bWVudCkgPT4gKHsgLi4uYWNjLFxuICAgICAgdG9wOiBhY2MudG9wICsgbW9kaWZpZXIgKiBhZGp1c3RtZW50LnksXG4gICAgICBib3R0b206IGFjYy5ib3R0b20gKyBtb2RpZmllciAqIGFkanVzdG1lbnQueSxcbiAgICAgIGxlZnQ6IGFjYy5sZWZ0ICsgbW9kaWZpZXIgKiBhZGp1c3RtZW50LngsXG4gICAgICByaWdodDogYWNjLnJpZ2h0ICsgbW9kaWZpZXIgKiBhZGp1c3RtZW50LnhcbiAgICB9KSwgeyAuLi5yZWN0XG4gICAgfSk7XG4gIH07XG59XG5jb25zdCBnZXRBZGp1c3RlZFJlY3QgPSAvKiNfX1BVUkVfXyovY3JlYXRlUmVjdEFkanVzdG1lbnRGbigxKTtcblxuZnVuY3Rpb24gcGFyc2VUcmFuc2Zvcm0odHJhbnNmb3JtKSB7XG4gIGlmICh0cmFuc2Zvcm0uc3RhcnRzV2l0aCgnbWF0cml4M2QoJykpIHtcbiAgICBjb25zdCB0cmFuc2Zvcm1BcnJheSA9IHRyYW5zZm9ybS5zbGljZSg5LCAtMSkuc3BsaXQoLywgLyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6ICt0cmFuc2Zvcm1BcnJheVsxMl0sXG4gICAgICB5OiArdHJhbnNmb3JtQXJyYXlbMTNdLFxuICAgICAgc2NhbGVYOiArdHJhbnNmb3JtQXJyYXlbMF0sXG4gICAgICBzY2FsZVk6ICt0cmFuc2Zvcm1BcnJheVs1XVxuICAgIH07XG4gIH0gZWxzZSBpZiAodHJhbnNmb3JtLnN0YXJ0c1dpdGgoJ21hdHJpeCgnKSkge1xuICAgIGNvbnN0IHRyYW5zZm9ybUFycmF5ID0gdHJhbnNmb3JtLnNsaWNlKDcsIC0xKS5zcGxpdCgvLCAvKTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogK3RyYW5zZm9ybUFycmF5WzRdLFxuICAgICAgeTogK3RyYW5zZm9ybUFycmF5WzVdLFxuICAgICAgc2NhbGVYOiArdHJhbnNmb3JtQXJyYXlbMF0sXG4gICAgICBzY2FsZVk6ICt0cmFuc2Zvcm1BcnJheVszXVxuICAgIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaW52ZXJzZVRyYW5zZm9ybShyZWN0LCB0cmFuc2Zvcm0sIHRyYW5zZm9ybU9yaWdpbikge1xuICBjb25zdCBwYXJzZWRUcmFuc2Zvcm0gPSBwYXJzZVRyYW5zZm9ybSh0cmFuc2Zvcm0pO1xuXG4gIGlmICghcGFyc2VkVHJhbnNmb3JtKSB7XG4gICAgcmV0dXJuIHJlY3Q7XG4gIH1cblxuICBjb25zdCB7XG4gICAgc2NhbGVYLFxuICAgIHNjYWxlWSxcbiAgICB4OiB0cmFuc2xhdGVYLFxuICAgIHk6IHRyYW5zbGF0ZVlcbiAgfSA9IHBhcnNlZFRyYW5zZm9ybTtcbiAgY29uc3QgeCA9IHJlY3QubGVmdCAtIHRyYW5zbGF0ZVggLSAoMSAtIHNjYWxlWCkgKiBwYXJzZUZsb2F0KHRyYW5zZm9ybU9yaWdpbik7XG4gIGNvbnN0IHkgPSByZWN0LnRvcCAtIHRyYW5zbGF0ZVkgLSAoMSAtIHNjYWxlWSkgKiBwYXJzZUZsb2F0KHRyYW5zZm9ybU9yaWdpbi5zbGljZSh0cmFuc2Zvcm1PcmlnaW4uaW5kZXhPZignICcpICsgMSkpO1xuICBjb25zdCB3ID0gc2NhbGVYID8gcmVjdC53aWR0aCAvIHNjYWxlWCA6IHJlY3Qud2lkdGg7XG4gIGNvbnN0IGggPSBzY2FsZVkgPyByZWN0LmhlaWdodCAvIHNjYWxlWSA6IHJlY3QuaGVpZ2h0O1xuICByZXR1cm4ge1xuICAgIHdpZHRoOiB3LFxuICAgIGhlaWdodDogaCxcbiAgICB0b3A6IHksXG4gICAgcmlnaHQ6IHggKyB3LFxuICAgIGJvdHRvbTogeSArIGgsXG4gICAgbGVmdDogeFxuICB9O1xufVxuXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgaWdub3JlVHJhbnNmb3JtOiBmYWxzZVxufTtcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBib3VuZGluZyBjbGllbnQgcmVjdCBvZiBhbiBlbGVtZW50IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydC5cclxuICovXG5cbmZ1bmN0aW9uIGdldENsaWVudFJlY3QoZWxlbWVudCwgb3B0aW9ucykge1xuICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgb3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zO1xuICB9XG5cbiAgbGV0IHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIGlmIChvcHRpb25zLmlnbm9yZVRyYW5zZm9ybSkge1xuICAgIGNvbnN0IHtcbiAgICAgIHRyYW5zZm9ybSxcbiAgICAgIHRyYW5zZm9ybU9yaWdpblxuICAgIH0gPSBnZXRXaW5kb3coZWxlbWVudCkuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcblxuICAgIGlmICh0cmFuc2Zvcm0pIHtcbiAgICAgIHJlY3QgPSBpbnZlcnNlVHJhbnNmb3JtKHJlY3QsIHRyYW5zZm9ybSwgdHJhbnNmb3JtT3JpZ2luKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGJvdHRvbSxcbiAgICByaWdodFxuICB9ID0gcmVjdDtcbiAgcmV0dXJuIHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgYm90dG9tLFxuICAgIHJpZ2h0XG4gIH07XG59XG4vKipcclxuICogUmV0dXJucyB0aGUgYm91bmRpbmcgY2xpZW50IHJlY3Qgb2YgYW4gZWxlbWVudCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIFRoZSBDbGllbnRSZWN0IHJldHVybmVkIGJ5IHRoaXMgbWV0aG9kIGRvZXMgbm90IHRha2UgaW50byBhY2NvdW50IHRyYW5zZm9ybXNcclxuICogYXBwbGllZCB0byB0aGUgZWxlbWVudCBpdCBtZWFzdXJlcy5cclxuICpcclxuICovXG5cbmZ1bmN0aW9uIGdldFRyYW5zZm9ybUFnbm9zdGljQ2xpZW50UmVjdChlbGVtZW50KSB7XG4gIHJldHVybiBnZXRDbGllbnRSZWN0KGVsZW1lbnQsIHtcbiAgICBpZ25vcmVUcmFuc2Zvcm06IHRydWVcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFdpbmRvd0NsaWVudFJlY3QoZWxlbWVudCkge1xuICBjb25zdCB3aWR0aCA9IGVsZW1lbnQuaW5uZXJXaWR0aDtcbiAgY29uc3QgaGVpZ2h0ID0gZWxlbWVudC5pbm5lckhlaWdodDtcbiAgcmV0dXJuIHtcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogd2lkdGgsXG4gICAgYm90dG9tOiBoZWlnaHQsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzRml4ZWQobm9kZSwgY29tcHV0ZWRTdHlsZSkge1xuICBpZiAoY29tcHV0ZWRTdHlsZSA9PT0gdm9pZCAwKSB7XG4gICAgY29tcHV0ZWRTdHlsZSA9IGdldFdpbmRvdyhub2RlKS5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIGNvbXB1dGVkU3R5bGUucG9zaXRpb24gPT09ICdmaXhlZCc7XG59XG5cbmZ1bmN0aW9uIGlzU2Nyb2xsYWJsZShlbGVtZW50LCBjb21wdXRlZFN0eWxlKSB7XG4gIGlmIChjb21wdXRlZFN0eWxlID09PSB2b2lkIDApIHtcbiAgICBjb21wdXRlZFN0eWxlID0gZ2V0V2luZG93KGVsZW1lbnQpLmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gIH1cblxuICBjb25zdCBvdmVyZmxvd1JlZ2V4ID0gLyhhdXRvfHNjcm9sbHxvdmVybGF5KS87XG4gIGNvbnN0IHByb3BlcnRpZXMgPSBbJ292ZXJmbG93JywgJ292ZXJmbG93WCcsICdvdmVyZmxvd1knXTtcbiAgcmV0dXJuIHByb3BlcnRpZXMuc29tZShwcm9wZXJ0eSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBjb21wdXRlZFN0eWxlW3Byb3BlcnR5XTtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IG92ZXJmbG93UmVnZXgudGVzdCh2YWx1ZSkgOiBmYWxzZTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbGFibGVBbmNlc3RvcnMoZWxlbWVudCwgbGltaXQpIHtcbiAgY29uc3Qgc2Nyb2xsUGFyZW50cyA9IFtdO1xuXG4gIGZ1bmN0aW9uIGZpbmRTY3JvbGxhYmxlQW5jZXN0b3JzKG5vZGUpIHtcbiAgICBpZiAobGltaXQgIT0gbnVsbCAmJiBzY3JvbGxQYXJlbnRzLmxlbmd0aCA+PSBsaW1pdCkge1xuICAgICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gICAgfVxuXG4gICAgaWYgKCFub2RlKSB7XG4gICAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgICB9XG5cbiAgICBpZiAoaXNEb2N1bWVudChub2RlKSAmJiBub2RlLnNjcm9sbGluZ0VsZW1lbnQgIT0gbnVsbCAmJiAhc2Nyb2xsUGFyZW50cy5pbmNsdWRlcyhub2RlLnNjcm9sbGluZ0VsZW1lbnQpKSB7XG4gICAgICBzY3JvbGxQYXJlbnRzLnB1c2gobm9kZS5zY3JvbGxpbmdFbGVtZW50KTtcbiAgICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICAgIH1cblxuICAgIGlmICghaXNIVE1MRWxlbWVudChub2RlKSB8fCBpc1NWR0VsZW1lbnQobm9kZSkpIHtcbiAgICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICAgIH1cblxuICAgIGlmIChzY3JvbGxQYXJlbnRzLmluY2x1ZGVzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgICB9XG5cbiAgICBjb25zdCBjb21wdXRlZFN0eWxlID0gZ2V0V2luZG93KGVsZW1lbnQpLmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG5cbiAgICBpZiAobm9kZSAhPT0gZWxlbWVudCkge1xuICAgICAgaWYgKGlzU2Nyb2xsYWJsZShub2RlLCBjb21wdXRlZFN0eWxlKSkge1xuICAgICAgICBzY3JvbGxQYXJlbnRzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzRml4ZWQobm9kZSwgY29tcHV0ZWRTdHlsZSkpIHtcbiAgICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICAgIH1cblxuICAgIHJldHVybiBmaW5kU2Nyb2xsYWJsZUFuY2VzdG9ycyhub2RlLnBhcmVudE5vZGUpO1xuICB9XG5cbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gIH1cblxuICByZXR1cm4gZmluZFNjcm9sbGFibGVBbmNlc3RvcnMoZWxlbWVudCk7XG59XG5mdW5jdGlvbiBnZXRGaXJzdFNjcm9sbGFibGVBbmNlc3Rvcihub2RlKSB7XG4gIGNvbnN0IFtmaXJzdFNjcm9sbGFibGVBbmNlc3Rvcl0gPSBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzKG5vZGUsIDEpO1xuICByZXR1cm4gZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IgIT0gbnVsbCA/IGZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsYWJsZUVsZW1lbnQoZWxlbWVudCkge1xuICBpZiAoIWNhblVzZURPTSB8fCAhZWxlbWVudCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGlzV2luZG93KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICBpZiAoIWlzTm9kZShlbGVtZW50KSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGlzRG9jdW1lbnQoZWxlbWVudCkgfHwgZWxlbWVudCA9PT0gZ2V0T3duZXJEb2N1bWVudChlbGVtZW50KS5zY3JvbGxpbmdFbGVtZW50KSB7XG4gICAgcmV0dXJuIHdpbmRvdztcbiAgfVxuXG4gIGlmIChpc0hUTUxFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsWENvb3JkaW5hdGUoZWxlbWVudCkge1xuICBpZiAoaXNXaW5kb3coZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZWxlbWVudC5zY3JvbGxYO1xuICB9XG5cbiAgcmV0dXJuIGVsZW1lbnQuc2Nyb2xsTGVmdDtcbn1cbmZ1bmN0aW9uIGdldFNjcm9sbFlDb29yZGluYXRlKGVsZW1lbnQpIHtcbiAgaWYgKGlzV2luZG93KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuc2Nyb2xsWTtcbiAgfVxuXG4gIHJldHVybiBlbGVtZW50LnNjcm9sbFRvcDtcbn1cbmZ1bmN0aW9uIGdldFNjcm9sbENvb3JkaW5hdGVzKGVsZW1lbnQpIHtcbiAgcmV0dXJuIHtcbiAgICB4OiBnZXRTY3JvbGxYQ29vcmRpbmF0ZShlbGVtZW50KSxcbiAgICB5OiBnZXRTY3JvbGxZQ29vcmRpbmF0ZShlbGVtZW50KVxuICB9O1xufVxuXG52YXIgRGlyZWN0aW9uO1xuXG4oZnVuY3Rpb24gKERpcmVjdGlvbikge1xuICBEaXJlY3Rpb25bRGlyZWN0aW9uW1wiRm9yd2FyZFwiXSA9IDFdID0gXCJGb3J3YXJkXCI7XG4gIERpcmVjdGlvbltEaXJlY3Rpb25bXCJCYWNrd2FyZFwiXSA9IC0xXSA9IFwiQmFja3dhcmRcIjtcbn0pKERpcmVjdGlvbiB8fCAoRGlyZWN0aW9uID0ge30pKTtcblxuZnVuY3Rpb24gaXNEb2N1bWVudFNjcm9sbGluZ0VsZW1lbnQoZWxlbWVudCkge1xuICBpZiAoIWNhblVzZURPTSB8fCAhZWxlbWVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBlbGVtZW50ID09PSBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50O1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxQb3NpdGlvbihzY3JvbGxpbmdDb250YWluZXIpIHtcbiAgY29uc3QgbWluU2Nyb2xsID0ge1xuICAgIHg6IDAsXG4gICAgeTogMFxuICB9O1xuICBjb25zdCBkaW1lbnNpb25zID0gaXNEb2N1bWVudFNjcm9sbGluZ0VsZW1lbnQoc2Nyb2xsaW5nQ29udGFpbmVyKSA/IHtcbiAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICB3aWR0aDogd2luZG93LmlubmVyV2lkdGhcbiAgfSA6IHtcbiAgICBoZWlnaHQ6IHNjcm9sbGluZ0NvbnRhaW5lci5jbGllbnRIZWlnaHQsXG4gICAgd2lkdGg6IHNjcm9sbGluZ0NvbnRhaW5lci5jbGllbnRXaWR0aFxuICB9O1xuICBjb25zdCBtYXhTY3JvbGwgPSB7XG4gICAgeDogc2Nyb2xsaW5nQ29udGFpbmVyLnNjcm9sbFdpZHRoIC0gZGltZW5zaW9ucy53aWR0aCxcbiAgICB5OiBzY3JvbGxpbmdDb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gZGltZW5zaW9ucy5oZWlnaHRcbiAgfTtcbiAgY29uc3QgaXNUb3AgPSBzY3JvbGxpbmdDb250YWluZXIuc2Nyb2xsVG9wIDw9IG1pblNjcm9sbC55O1xuICBjb25zdCBpc0xlZnQgPSBzY3JvbGxpbmdDb250YWluZXIuc2Nyb2xsTGVmdCA8PSBtaW5TY3JvbGwueDtcbiAgY29uc3QgaXNCb3R0b20gPSBzY3JvbGxpbmdDb250YWluZXIuc2Nyb2xsVG9wID49IG1heFNjcm9sbC55O1xuICBjb25zdCBpc1JpZ2h0ID0gc2Nyb2xsaW5nQ29udGFpbmVyLnNjcm9sbExlZnQgPj0gbWF4U2Nyb2xsLng7XG4gIHJldHVybiB7XG4gICAgaXNUb3AsXG4gICAgaXNMZWZ0LFxuICAgIGlzQm90dG9tLFxuICAgIGlzUmlnaHQsXG4gICAgbWF4U2Nyb2xsLFxuICAgIG1pblNjcm9sbFxuICB9O1xufVxuXG5jb25zdCBkZWZhdWx0VGhyZXNob2xkID0ge1xuICB4OiAwLjIsXG4gIHk6IDAuMlxufTtcbmZ1bmN0aW9uIGdldFNjcm9sbERpcmVjdGlvbkFuZFNwZWVkKHNjcm9sbENvbnRhaW5lciwgc2Nyb2xsQ29udGFpbmVyUmVjdCwgX3JlZiwgYWNjZWxlcmF0aW9uLCB0aHJlc2hvbGRQZXJjZW50YWdlKSB7XG4gIGxldCB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgcmlnaHQsXG4gICAgYm90dG9tXG4gIH0gPSBfcmVmO1xuXG4gIGlmIChhY2NlbGVyYXRpb24gPT09IHZvaWQgMCkge1xuICAgIGFjY2VsZXJhdGlvbiA9IDEwO1xuICB9XG5cbiAgaWYgKHRocmVzaG9sZFBlcmNlbnRhZ2UgPT09IHZvaWQgMCkge1xuICAgIHRocmVzaG9sZFBlcmNlbnRhZ2UgPSBkZWZhdWx0VGhyZXNob2xkO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIGlzVG9wLFxuICAgIGlzQm90dG9tLFxuICAgIGlzTGVmdCxcbiAgICBpc1JpZ2h0XG4gIH0gPSBnZXRTY3JvbGxQb3NpdGlvbihzY3JvbGxDb250YWluZXIpO1xuICBjb25zdCBkaXJlY3Rpb24gPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG4gIGNvbnN0IHNwZWVkID0ge1xuICAgIHg6IDAsXG4gICAgeTogMFxuICB9O1xuICBjb25zdCB0aHJlc2hvbGQgPSB7XG4gICAgaGVpZ2h0OiBzY3JvbGxDb250YWluZXJSZWN0LmhlaWdodCAqIHRocmVzaG9sZFBlcmNlbnRhZ2UueSxcbiAgICB3aWR0aDogc2Nyb2xsQ29udGFpbmVyUmVjdC53aWR0aCAqIHRocmVzaG9sZFBlcmNlbnRhZ2UueFxuICB9O1xuXG4gIGlmICghaXNUb3AgJiYgdG9wIDw9IHNjcm9sbENvbnRhaW5lclJlY3QudG9wICsgdGhyZXNob2xkLmhlaWdodCkge1xuICAgIC8vIFNjcm9sbCBVcFxuICAgIGRpcmVjdGlvbi55ID0gRGlyZWN0aW9uLkJhY2t3YXJkO1xuICAgIHNwZWVkLnkgPSBhY2NlbGVyYXRpb24gKiBNYXRoLmFicygoc2Nyb2xsQ29udGFpbmVyUmVjdC50b3AgKyB0aHJlc2hvbGQuaGVpZ2h0IC0gdG9wKSAvIHRocmVzaG9sZC5oZWlnaHQpO1xuICB9IGVsc2UgaWYgKCFpc0JvdHRvbSAmJiBib3R0b20gPj0gc2Nyb2xsQ29udGFpbmVyUmVjdC5ib3R0b20gLSB0aHJlc2hvbGQuaGVpZ2h0KSB7XG4gICAgLy8gU2Nyb2xsIERvd25cbiAgICBkaXJlY3Rpb24ueSA9IERpcmVjdGlvbi5Gb3J3YXJkO1xuICAgIHNwZWVkLnkgPSBhY2NlbGVyYXRpb24gKiBNYXRoLmFicygoc2Nyb2xsQ29udGFpbmVyUmVjdC5ib3R0b20gLSB0aHJlc2hvbGQuaGVpZ2h0IC0gYm90dG9tKSAvIHRocmVzaG9sZC5oZWlnaHQpO1xuICB9XG5cbiAgaWYgKCFpc1JpZ2h0ICYmIHJpZ2h0ID49IHNjcm9sbENvbnRhaW5lclJlY3QucmlnaHQgLSB0aHJlc2hvbGQud2lkdGgpIHtcbiAgICAvLyBTY3JvbGwgUmlnaHRcbiAgICBkaXJlY3Rpb24ueCA9IERpcmVjdGlvbi5Gb3J3YXJkO1xuICAgIHNwZWVkLnggPSBhY2NlbGVyYXRpb24gKiBNYXRoLmFicygoc2Nyb2xsQ29udGFpbmVyUmVjdC5yaWdodCAtIHRocmVzaG9sZC53aWR0aCAtIHJpZ2h0KSAvIHRocmVzaG9sZC53aWR0aCk7XG4gIH0gZWxzZSBpZiAoIWlzTGVmdCAmJiBsZWZ0IDw9IHNjcm9sbENvbnRhaW5lclJlY3QubGVmdCArIHRocmVzaG9sZC53aWR0aCkge1xuICAgIC8vIFNjcm9sbCBMZWZ0XG4gICAgZGlyZWN0aW9uLnggPSBEaXJlY3Rpb24uQmFja3dhcmQ7XG4gICAgc3BlZWQueCA9IGFjY2VsZXJhdGlvbiAqIE1hdGguYWJzKChzY3JvbGxDb250YWluZXJSZWN0LmxlZnQgKyB0aHJlc2hvbGQud2lkdGggLSBsZWZ0KSAvIHRocmVzaG9sZC53aWR0aCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRpcmVjdGlvbixcbiAgICBzcGVlZFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxFbGVtZW50UmVjdChlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50ID09PSBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50KSB7XG4gICAgY29uc3Qge1xuICAgICAgaW5uZXJXaWR0aCxcbiAgICAgIGlubmVySGVpZ2h0XG4gICAgfSA9IHdpbmRvdztcbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHJpZ2h0OiBpbm5lcldpZHRoLFxuICAgICAgYm90dG9tOiBpbm5lckhlaWdodCxcbiAgICAgIHdpZHRoOiBpbm5lcldpZHRoLFxuICAgICAgaGVpZ2h0OiBpbm5lckhlaWdodFxuICAgIH07XG4gIH1cblxuICBjb25zdCB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgcmlnaHQsXG4gICAgYm90dG9tXG4gIH0gPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4ge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIHJpZ2h0LFxuICAgIGJvdHRvbSxcbiAgICB3aWR0aDogZWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICBoZWlnaHQ6IGVsZW1lbnQuY2xpZW50SGVpZ2h0XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbE9mZnNldHMoc2Nyb2xsYWJsZUFuY2VzdG9ycykge1xuICByZXR1cm4gc2Nyb2xsYWJsZUFuY2VzdG9ycy5yZWR1Y2UoKGFjYywgbm9kZSkgPT4ge1xuICAgIHJldHVybiBhZGQoYWNjLCBnZXRTY3JvbGxDb29yZGluYXRlcyhub2RlKSk7XG4gIH0sIGRlZmF1bHRDb29yZGluYXRlcyk7XG59XG5mdW5jdGlvbiBnZXRTY3JvbGxYT2Zmc2V0KHNjcm9sbGFibGVBbmNlc3RvcnMpIHtcbiAgcmV0dXJuIHNjcm9sbGFibGVBbmNlc3RvcnMucmVkdWNlKChhY2MsIG5vZGUpID0+IHtcbiAgICByZXR1cm4gYWNjICsgZ2V0U2Nyb2xsWENvb3JkaW5hdGUobm9kZSk7XG4gIH0sIDApO1xufVxuZnVuY3Rpb24gZ2V0U2Nyb2xsWU9mZnNldChzY3JvbGxhYmxlQW5jZXN0b3JzKSB7XG4gIHJldHVybiBzY3JvbGxhYmxlQW5jZXN0b3JzLnJlZHVjZSgoYWNjLCBub2RlKSA9PiB7XG4gICAgcmV0dXJuIGFjYyArIGdldFNjcm9sbFlDb29yZGluYXRlKG5vZGUpO1xuICB9LCAwKTtcbn1cblxuZnVuY3Rpb24gc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChlbGVtZW50LCBtZWFzdXJlKSB7XG4gIGlmIChtZWFzdXJlID09PSB2b2lkIDApIHtcbiAgICBtZWFzdXJlID0gZ2V0Q2xpZW50UmVjdDtcbiAgfVxuXG4gIGlmICghZWxlbWVudCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICBib3R0b20sXG4gICAgcmlnaHRcbiAgfSA9IG1lYXN1cmUoZWxlbWVudCk7XG4gIGNvbnN0IGZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yID0gZ2V0Rmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IoZWxlbWVudCk7XG5cbiAgaWYgKCFmaXJzdFNjcm9sbGFibGVBbmNlc3Rvcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChib3R0b20gPD0gMCB8fCByaWdodCA8PSAwIHx8IHRvcCA+PSB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgbGVmdCA+PSB3aW5kb3cuaW5uZXJXaWR0aCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoe1xuICAgICAgYmxvY2s6ICdjZW50ZXInLFxuICAgICAgaW5saW5lOiAnY2VudGVyJ1xuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IHByb3BlcnRpZXMgPSBbWyd4JywgWydsZWZ0JywgJ3JpZ2h0J10sIGdldFNjcm9sbFhPZmZzZXRdLCBbJ3knLCBbJ3RvcCcsICdib3R0b20nXSwgZ2V0U2Nyb2xsWU9mZnNldF1dO1xuY2xhc3MgUmVjdCB7XG4gIGNvbnN0cnVjdG9yKHJlY3QsIGVsZW1lbnQpIHtcbiAgICB0aGlzLnJlY3QgPSB2b2lkIDA7XG4gICAgdGhpcy53aWR0aCA9IHZvaWQgMDtcbiAgICB0aGlzLmhlaWdodCA9IHZvaWQgMDtcbiAgICB0aGlzLnRvcCA9IHZvaWQgMDtcbiAgICB0aGlzLmJvdHRvbSA9IHZvaWQgMDtcbiAgICB0aGlzLnJpZ2h0ID0gdm9pZCAwO1xuICAgIHRoaXMubGVmdCA9IHZvaWQgMDtcbiAgICBjb25zdCBzY3JvbGxhYmxlQW5jZXN0b3JzID0gZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycyhlbGVtZW50KTtcbiAgICBjb25zdCBzY3JvbGxPZmZzZXRzID0gZ2V0U2Nyb2xsT2Zmc2V0cyhzY3JvbGxhYmxlQW5jZXN0b3JzKTtcbiAgICB0aGlzLnJlY3QgPSB7IC4uLnJlY3RcbiAgICB9O1xuICAgIHRoaXMud2lkdGggPSByZWN0LndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG5cbiAgICBmb3IgKGNvbnN0IFtheGlzLCBrZXlzLCBnZXRTY3JvbGxPZmZzZXRdIG9mIHByb3BlcnRpZXMpIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGtleSwge1xuICAgICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudE9mZnNldHMgPSBnZXRTY3JvbGxPZmZzZXQoc2Nyb2xsYWJsZUFuY2VzdG9ycyk7XG4gICAgICAgICAgICBjb25zdCBzY3JvbGxPZmZzZXRzRGVsdGxhID0gc2Nyb2xsT2Zmc2V0c1theGlzXSAtIGN1cnJlbnRPZmZzZXRzO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVjdFtrZXldICsgc2Nyb2xsT2Zmc2V0c0RlbHRsYTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdyZWN0Jywge1xuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxuXG59XG5cbmNsYXNzIExpc3RlbmVycyB7XG4gIGNvbnN0cnVjdG9yKHRhcmdldCkge1xuICAgIHRoaXMudGFyZ2V0ID0gdm9pZCAwO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG5cbiAgICB0aGlzLnJlbW92ZUFsbCA9ICgpID0+IHtcbiAgICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgICB2YXIgX3RoaXMkdGFyZ2V0O1xuXG4gICAgICAgIHJldHVybiAoX3RoaXMkdGFyZ2V0ID0gdGhpcy50YXJnZXQpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyR0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lciguLi5saXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gIH1cblxuICBhZGQoZXZlbnROYW1lLCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzJHRhcmdldDI7XG5cbiAgICAoX3RoaXMkdGFyZ2V0MiA9IHRoaXMudGFyZ2V0KSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkdGFyZ2V0Mi5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgb3B0aW9ucyk7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChbZXZlbnROYW1lLCBoYW5kbGVyLCBvcHRpb25zXSk7XG4gIH1cblxufVxuXG5mdW5jdGlvbiBnZXRFdmVudExpc3RlbmVyVGFyZ2V0KHRhcmdldCkge1xuICAvLyBJZiB0aGUgYGV2ZW50LnRhcmdldGAgZWxlbWVudCBpcyByZW1vdmVkIGZyb20gdGhlIGRvY3VtZW50IGV2ZW50cyB3aWxsIHN0aWxsIGJlIHRhcmdldGVkXG4gIC8vIGF0IGl0LCBhbmQgaGVuY2Ugd29uJ3QgYWx3YXlzIGJ1YmJsZSB1cCB0byB0aGUgd2luZG93IG9yIGRvY3VtZW50IGFueW1vcmUuXG4gIC8vIElmIHRoZXJlIGlzIGFueSByaXNrIG9mIGFuIGVsZW1lbnQgYmVpbmcgcmVtb3ZlZCB3aGlsZSBpdCBpcyBiZWluZyBkcmFnZ2VkLFxuICAvLyB0aGUgYmVzdCBwcmFjdGljZSBpcyB0byBhdHRhY2ggdGhlIGV2ZW50IGxpc3RlbmVycyBkaXJlY3RseSB0byB0aGUgdGFyZ2V0LlxuICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnRUYXJnZXRcbiAgY29uc3Qge1xuICAgIEV2ZW50VGFyZ2V0XG4gIH0gPSBnZXRXaW5kb3codGFyZ2V0KTtcbiAgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0ID8gdGFyZ2V0IDogZ2V0T3duZXJEb2N1bWVudCh0YXJnZXQpO1xufVxuXG5mdW5jdGlvbiBoYXNFeGNlZWRlZERpc3RhbmNlKGRlbHRhLCBtZWFzdXJlbWVudCkge1xuICBjb25zdCBkeCA9IE1hdGguYWJzKGRlbHRhLngpO1xuICBjb25zdCBkeSA9IE1hdGguYWJzKGRlbHRhLnkpO1xuXG4gIGlmICh0eXBlb2YgbWVhc3VyZW1lbnQgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqKiAyICsgZHkgKiogMikgPiBtZWFzdXJlbWVudDtcbiAgfVxuXG4gIGlmICgneCcgaW4gbWVhc3VyZW1lbnQgJiYgJ3knIGluIG1lYXN1cmVtZW50KSB7XG4gICAgcmV0dXJuIGR4ID4gbWVhc3VyZW1lbnQueCAmJiBkeSA+IG1lYXN1cmVtZW50Lnk7XG4gIH1cblxuICBpZiAoJ3gnIGluIG1lYXN1cmVtZW50KSB7XG4gICAgcmV0dXJuIGR4ID4gbWVhc3VyZW1lbnQueDtcbiAgfVxuXG4gIGlmICgneScgaW4gbWVhc3VyZW1lbnQpIHtcbiAgICByZXR1cm4gZHkgPiBtZWFzdXJlbWVudC55O1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgRXZlbnROYW1lO1xuXG4oZnVuY3Rpb24gKEV2ZW50TmFtZSkge1xuICBFdmVudE5hbWVbXCJDbGlja1wiXSA9IFwiY2xpY2tcIjtcbiAgRXZlbnROYW1lW1wiRHJhZ1N0YXJ0XCJdID0gXCJkcmFnc3RhcnRcIjtcbiAgRXZlbnROYW1lW1wiS2V5ZG93blwiXSA9IFwia2V5ZG93blwiO1xuICBFdmVudE5hbWVbXCJDb250ZXh0TWVudVwiXSA9IFwiY29udGV4dG1lbnVcIjtcbiAgRXZlbnROYW1lW1wiUmVzaXplXCJdID0gXCJyZXNpemVcIjtcbiAgRXZlbnROYW1lW1wiU2VsZWN0aW9uQ2hhbmdlXCJdID0gXCJzZWxlY3Rpb25jaGFuZ2VcIjtcbiAgRXZlbnROYW1lW1wiVmlzaWJpbGl0eUNoYW5nZVwiXSA9IFwidmlzaWJpbGl0eWNoYW5nZVwiO1xufSkoRXZlbnROYW1lIHx8IChFdmVudE5hbWUgPSB7fSkpO1xuXG5mdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChldmVudCkge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufVxuZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKGV2ZW50KSB7XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuXG52YXIgS2V5Ym9hcmRDb2RlO1xuXG4oZnVuY3Rpb24gKEtleWJvYXJkQ29kZSkge1xuICBLZXlib2FyZENvZGVbXCJTcGFjZVwiXSA9IFwiU3BhY2VcIjtcbiAgS2V5Ym9hcmRDb2RlW1wiRG93blwiXSA9IFwiQXJyb3dEb3duXCI7XG4gIEtleWJvYXJkQ29kZVtcIlJpZ2h0XCJdID0gXCJBcnJvd1JpZ2h0XCI7XG4gIEtleWJvYXJkQ29kZVtcIkxlZnRcIl0gPSBcIkFycm93TGVmdFwiO1xuICBLZXlib2FyZENvZGVbXCJVcFwiXSA9IFwiQXJyb3dVcFwiO1xuICBLZXlib2FyZENvZGVbXCJFc2NcIl0gPSBcIkVzY2FwZVwiO1xuICBLZXlib2FyZENvZGVbXCJFbnRlclwiXSA9IFwiRW50ZXJcIjtcbiAgS2V5Ym9hcmRDb2RlW1wiVGFiXCJdID0gXCJUYWJcIjtcbn0pKEtleWJvYXJkQ29kZSB8fCAoS2V5Ym9hcmRDb2RlID0ge30pKTtcblxuY29uc3QgZGVmYXVsdEtleWJvYXJkQ29kZXMgPSB7XG4gIHN0YXJ0OiBbS2V5Ym9hcmRDb2RlLlNwYWNlLCBLZXlib2FyZENvZGUuRW50ZXJdLFxuICBjYW5jZWw6IFtLZXlib2FyZENvZGUuRXNjXSxcbiAgZW5kOiBbS2V5Ym9hcmRDb2RlLlNwYWNlLCBLZXlib2FyZENvZGUuRW50ZXIsIEtleWJvYXJkQ29kZS5UYWJdXG59O1xuY29uc3QgZGVmYXVsdEtleWJvYXJkQ29vcmRpbmF0ZUdldHRlciA9IChldmVudCwgX3JlZikgPT4ge1xuICBsZXQge1xuICAgIGN1cnJlbnRDb29yZGluYXRlc1xuICB9ID0gX3JlZjtcblxuICBzd2l0Y2ggKGV2ZW50LmNvZGUpIHtcbiAgICBjYXNlIEtleWJvYXJkQ29kZS5SaWdodDpcbiAgICAgIHJldHVybiB7IC4uLmN1cnJlbnRDb29yZGluYXRlcyxcbiAgICAgICAgeDogY3VycmVudENvb3JkaW5hdGVzLnggKyAyNVxuICAgICAgfTtcblxuICAgIGNhc2UgS2V5Ym9hcmRDb2RlLkxlZnQ6XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50Q29vcmRpbmF0ZXMsXG4gICAgICAgIHg6IGN1cnJlbnRDb29yZGluYXRlcy54IC0gMjVcbiAgICAgIH07XG5cbiAgICBjYXNlIEtleWJvYXJkQ29kZS5Eb3duOlxuICAgICAgcmV0dXJuIHsgLi4uY3VycmVudENvb3JkaW5hdGVzLFxuICAgICAgICB5OiBjdXJyZW50Q29vcmRpbmF0ZXMueSArIDI1XG4gICAgICB9O1xuXG4gICAgY2FzZSBLZXlib2FyZENvZGUuVXA6XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50Q29vcmRpbmF0ZXMsXG4gICAgICAgIHk6IGN1cnJlbnRDb29yZGluYXRlcy55IC0gMjVcbiAgICAgIH07XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuY2xhc3MgS2V5Ym9hcmRTZW5zb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHRoaXMucHJvcHMgPSB2b2lkIDA7XG4gICAgdGhpcy5hdXRvU2Nyb2xsRW5hYmxlZCA9IGZhbHNlO1xuICAgIHRoaXMucmVmZXJlbmNlQ29vcmRpbmF0ZXMgPSB2b2lkIDA7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgIGNvbnN0IHtcbiAgICAgIGV2ZW50OiB7XG4gICAgICAgIHRhcmdldFxuICAgICAgfVxuICAgIH0gPSBwcm9wcztcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgTGlzdGVuZXJzKGdldE93bmVyRG9jdW1lbnQodGFyZ2V0KSk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMgPSBuZXcgTGlzdGVuZXJzKGdldFdpbmRvdyh0YXJnZXQpKTtcbiAgICB0aGlzLmhhbmRsZUtleURvd24gPSB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZUNhbmNlbCA9IHRoaXMuaGFuZGxlQ2FuY2VsLmJpbmQodGhpcyk7XG4gICAgdGhpcy5hdHRhY2goKTtcbiAgfVxuXG4gIGF0dGFjaCgpIHtcbiAgICB0aGlzLmhhbmRsZVN0YXJ0KCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5SZXNpemUsIHRoaXMuaGFuZGxlQ2FuY2VsKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5hZGQoRXZlbnROYW1lLlZpc2liaWxpdHlDaGFuZ2UsIHRoaXMuaGFuZGxlQ2FuY2VsKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXJzLmFkZChFdmVudE5hbWUuS2V5ZG93biwgdGhpcy5oYW5kbGVLZXlEb3duKSk7XG4gIH1cblxuICBoYW5kbGVTdGFydCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBhY3RpdmVOb2RlLFxuICAgICAgb25TdGFydFxuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IG5vZGUgPSBhY3RpdmVOb2RlLm5vZGUuY3VycmVudDtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBzY3JvbGxJbnRvVmlld0lmTmVlZGVkKG5vZGUpO1xuICAgIH1cblxuICAgIG9uU3RhcnQoZGVmYXVsdENvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIGhhbmRsZUtleURvd24oZXZlbnQpIHtcbiAgICBpZiAoaXNLZXlib2FyZEV2ZW50KGV2ZW50KSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIGNvbnRleHQsXG4gICAgICAgIG9wdGlvbnNcbiAgICAgIH0gPSB0aGlzLnByb3BzO1xuICAgICAgY29uc3Qge1xuICAgICAgICBrZXlib2FyZENvZGVzID0gZGVmYXVsdEtleWJvYXJkQ29kZXMsXG4gICAgICAgIGNvb3JkaW5hdGVHZXR0ZXIgPSBkZWZhdWx0S2V5Ym9hcmRDb29yZGluYXRlR2V0dGVyLFxuICAgICAgICBzY3JvbGxCZWhhdmlvciA9ICdzbW9vdGgnXG4gICAgICB9ID0gb3B0aW9ucztcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY29kZVxuICAgICAgfSA9IGV2ZW50O1xuXG4gICAgICBpZiAoa2V5Ym9hcmRDb2Rlcy5lbmQuaW5jbHVkZXMoY29kZSkpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVFbmQoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXlib2FyZENvZGVzLmNhbmNlbC5pbmNsdWRlcyhjb2RlKSkge1xuICAgICAgICB0aGlzLmhhbmRsZUNhbmNlbChldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBjb2xsaXNpb25SZWN0XG4gICAgICB9ID0gY29udGV4dC5jdXJyZW50O1xuICAgICAgY29uc3QgY3VycmVudENvb3JkaW5hdGVzID0gY29sbGlzaW9uUmVjdCA/IHtcbiAgICAgICAgeDogY29sbGlzaW9uUmVjdC5sZWZ0LFxuICAgICAgICB5OiBjb2xsaXNpb25SZWN0LnRvcFxuICAgICAgfSA6IGRlZmF1bHRDb29yZGluYXRlcztcblxuICAgICAgaWYgKCF0aGlzLnJlZmVyZW5jZUNvb3JkaW5hdGVzKSB7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlQ29vcmRpbmF0ZXMgPSBjdXJyZW50Q29vcmRpbmF0ZXM7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0Nvb3JkaW5hdGVzID0gY29vcmRpbmF0ZUdldHRlcihldmVudCwge1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHQuY3VycmVudCxcbiAgICAgICAgY3VycmVudENvb3JkaW5hdGVzXG4gICAgICB9KTtcblxuICAgICAgaWYgKG5ld0Nvb3JkaW5hdGVzKSB7XG4gICAgICAgIGNvbnN0IGNvb3JkaW5hdGVzRGVsdGEgPSBzdWJ0cmFjdChuZXdDb29yZGluYXRlcywgY3VycmVudENvb3JkaW5hdGVzKTtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRGVsdGEgPSB7XG4gICAgICAgICAgeDogMCxcbiAgICAgICAgICB5OiAwXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBzY3JvbGxhYmxlQW5jZXN0b3JzXG4gICAgICAgIH0gPSBjb250ZXh0LmN1cnJlbnQ7XG5cbiAgICAgICAgZm9yIChjb25zdCBzY3JvbGxDb250YWluZXIgb2Ygc2Nyb2xsYWJsZUFuY2VzdG9ycykge1xuICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGV2ZW50LmNvZGU7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgaXNUb3AsXG4gICAgICAgICAgICBpc1JpZ2h0LFxuICAgICAgICAgICAgaXNMZWZ0LFxuICAgICAgICAgICAgaXNCb3R0b20sXG4gICAgICAgICAgICBtYXhTY3JvbGwsXG4gICAgICAgICAgICBtaW5TY3JvbGxcbiAgICAgICAgICB9ID0gZ2V0U2Nyb2xsUG9zaXRpb24oc2Nyb2xsQ29udGFpbmVyKTtcbiAgICAgICAgICBjb25zdCBzY3JvbGxFbGVtZW50UmVjdCA9IGdldFNjcm9sbEVsZW1lbnRSZWN0KHNjcm9sbENvbnRhaW5lcik7XG4gICAgICAgICAgY29uc3QgY2xhbXBlZENvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgeDogTWF0aC5taW4oZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuUmlnaHQgPyBzY3JvbGxFbGVtZW50UmVjdC5yaWdodCAtIHNjcm9sbEVsZW1lbnRSZWN0LndpZHRoIC8gMiA6IHNjcm9sbEVsZW1lbnRSZWN0LnJpZ2h0LCBNYXRoLm1heChkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5SaWdodCA/IHNjcm9sbEVsZW1lbnRSZWN0LmxlZnQgOiBzY3JvbGxFbGVtZW50UmVjdC5sZWZ0ICsgc2Nyb2xsRWxlbWVudFJlY3Qud2lkdGggLyAyLCBuZXdDb29yZGluYXRlcy54KSksXG4gICAgICAgICAgICB5OiBNYXRoLm1pbihkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5Eb3duID8gc2Nyb2xsRWxlbWVudFJlY3QuYm90dG9tIC0gc2Nyb2xsRWxlbWVudFJlY3QuaGVpZ2h0IC8gMiA6IHNjcm9sbEVsZW1lbnRSZWN0LmJvdHRvbSwgTWF0aC5tYXgoZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuRG93biA/IHNjcm9sbEVsZW1lbnRSZWN0LnRvcCA6IHNjcm9sbEVsZW1lbnRSZWN0LnRvcCArIHNjcm9sbEVsZW1lbnRSZWN0LmhlaWdodCAvIDIsIG5ld0Nvb3JkaW5hdGVzLnkpKVxuICAgICAgICAgIH07XG4gICAgICAgICAgY29uc3QgY2FuU2Nyb2xsWCA9IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlJpZ2h0ICYmICFpc1JpZ2h0IHx8IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkxlZnQgJiYgIWlzTGVmdDtcbiAgICAgICAgICBjb25zdCBjYW5TY3JvbGxZID0gZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuRG93biAmJiAhaXNCb3R0b20gfHwgZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuVXAgJiYgIWlzVG9wO1xuXG4gICAgICAgICAgaWYgKGNhblNjcm9sbFggJiYgY2xhbXBlZENvb3JkaW5hdGVzLnggIT09IG5ld0Nvb3JkaW5hdGVzLngpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1Njcm9sbENvb3JkaW5hdGVzID0gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgKyBjb29yZGluYXRlc0RlbHRhLng7XG4gICAgICAgICAgICBjb25zdCBjYW5TY3JvbGxUb05ld0Nvb3JkaW5hdGVzID0gZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuUmlnaHQgJiYgbmV3U2Nyb2xsQ29vcmRpbmF0ZXMgPD0gbWF4U2Nyb2xsLnggfHwgZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuTGVmdCAmJiBuZXdTY3JvbGxDb29yZGluYXRlcyA+PSBtaW5TY3JvbGwueDtcblxuICAgICAgICAgICAgaWYgKGNhblNjcm9sbFRvTmV3Q29vcmRpbmF0ZXMgJiYgIWNvb3JkaW5hdGVzRGVsdGEueSkge1xuICAgICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSBjb29yZGluYXRlcywgdGhlIHNjcm9sbCBhZGp1c3RtZW50IGFsb25lIHdpbGwgdHJpZ2dlclxuICAgICAgICAgICAgICAvLyBsb2dpYyB0byBhdXRvLWRldGVjdCB0aGUgbmV3IGNvbnRhaW5lciB3ZSBhcmUgb3ZlclxuICAgICAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG8oe1xuICAgICAgICAgICAgICAgIGxlZnQ6IG5ld1Njcm9sbENvb3JkaW5hdGVzLFxuICAgICAgICAgICAgICAgIGJlaGF2aW9yOiBzY3JvbGxCZWhhdmlvclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2FuU2Nyb2xsVG9OZXdDb29yZGluYXRlcykge1xuICAgICAgICAgICAgICBzY3JvbGxEZWx0YS54ID0gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgLSBuZXdTY3JvbGxDb29yZGluYXRlcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNjcm9sbERlbHRhLnggPSBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5SaWdodCA/IHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0IC0gbWF4U2Nyb2xsLnggOiBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCAtIG1pblNjcm9sbC54O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2Nyb2xsRGVsdGEueCkge1xuICAgICAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsQnkoe1xuICAgICAgICAgICAgICAgIGxlZnQ6IC1zY3JvbGxEZWx0YS54LFxuICAgICAgICAgICAgICAgIGJlaGF2aW9yOiBzY3JvbGxCZWhhdmlvclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIGlmIChjYW5TY3JvbGxZICYmIGNsYW1wZWRDb29yZGluYXRlcy55ICE9PSBuZXdDb29yZGluYXRlcy55KSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTY3JvbGxDb29yZGluYXRlcyA9IHNjcm9sbENvbnRhaW5lci5zY3JvbGxUb3AgKyBjb29yZGluYXRlc0RlbHRhLnk7XG4gICAgICAgICAgICBjb25zdCBjYW5TY3JvbGxUb05ld0Nvb3JkaW5hdGVzID0gZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuRG93biAmJiBuZXdTY3JvbGxDb29yZGluYXRlcyA8PSBtYXhTY3JvbGwueSB8fCBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5VcCAmJiBuZXdTY3JvbGxDb29yZGluYXRlcyA+PSBtaW5TY3JvbGwueTtcblxuICAgICAgICAgICAgaWYgKGNhblNjcm9sbFRvTmV3Q29vcmRpbmF0ZXMgJiYgIWNvb3JkaW5hdGVzRGVsdGEueCkge1xuICAgICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSBjb29yZGluYXRlcywgdGhlIHNjcm9sbCBhZGp1c3RtZW50IGFsb25lIHdpbGwgdHJpZ2dlclxuICAgICAgICAgICAgICAvLyBsb2dpYyB0byBhdXRvLWRldGVjdCB0aGUgbmV3IGNvbnRhaW5lciB3ZSBhcmUgb3ZlclxuICAgICAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG8oe1xuICAgICAgICAgICAgICAgIHRvcDogbmV3U2Nyb2xsQ29vcmRpbmF0ZXMsXG4gICAgICAgICAgICAgICAgYmVoYXZpb3I6IHNjcm9sbEJlaGF2aW9yXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYW5TY3JvbGxUb05ld0Nvb3JkaW5hdGVzKSB7XG4gICAgICAgICAgICAgIHNjcm9sbERlbHRhLnkgPSBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wIC0gbmV3U2Nyb2xsQ29vcmRpbmF0ZXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzY3JvbGxEZWx0YS55ID0gZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuRG93biA/IHNjcm9sbENvbnRhaW5lci5zY3JvbGxUb3AgLSBtYXhTY3JvbGwueSA6IHNjcm9sbENvbnRhaW5lci5zY3JvbGxUb3AgLSBtaW5TY3JvbGwueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjcm9sbERlbHRhLnkpIHtcbiAgICAgICAgICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbEJ5KHtcbiAgICAgICAgICAgICAgICB0b3A6IC1zY3JvbGxEZWx0YS55LFxuICAgICAgICAgICAgICAgIGJlaGF2aW9yOiBzY3JvbGxCZWhhdmlvclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oYW5kbGVNb3ZlKGV2ZW50LCBhZGQoc3VidHJhY3QobmV3Q29vcmRpbmF0ZXMsIHRoaXMucmVmZXJlbmNlQ29vcmRpbmF0ZXMpLCBzY3JvbGxEZWx0YSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZU1vdmUoZXZlbnQsIGNvb3JkaW5hdGVzKSB7XG4gICAgY29uc3Qge1xuICAgICAgb25Nb3ZlXG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBvbk1vdmUoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgaGFuZGxlRW5kKGV2ZW50KSB7XG4gICAgY29uc3Qge1xuICAgICAgb25FbmRcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgb25FbmQoKTtcbiAgfVxuXG4gIGhhbmRsZUNhbmNlbChldmVudCkge1xuICAgIGNvbnN0IHtcbiAgICAgIG9uQ2FuY2VsXG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIG9uQ2FuY2VsKCk7XG4gIH1cblxuICBkZXRhY2goKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMucmVtb3ZlQWxsKCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMucmVtb3ZlQWxsKCk7XG4gIH1cblxufVxuS2V5Ym9hcmRTZW5zb3IuYWN0aXZhdG9ycyA9IFt7XG4gIGV2ZW50TmFtZTogJ29uS2V5RG93bicsXG4gIGhhbmRsZXI6IChldmVudCwgX3JlZiwgX3JlZjIpID0+IHtcbiAgICBsZXQge1xuICAgICAga2V5Ym9hcmRDb2RlcyA9IGRlZmF1bHRLZXlib2FyZENvZGVzLFxuICAgICAgb25BY3RpdmF0aW9uXG4gICAgfSA9IF9yZWY7XG4gICAgbGV0IHtcbiAgICAgIGFjdGl2ZVxuICAgIH0gPSBfcmVmMjtcbiAgICBjb25zdCB7XG4gICAgICBjb2RlXG4gICAgfSA9IGV2ZW50Lm5hdGl2ZUV2ZW50O1xuXG4gICAgaWYgKGtleWJvYXJkQ29kZXMuc3RhcnQuaW5jbHVkZXMoY29kZSkpIHtcbiAgICAgIGNvbnN0IGFjdGl2YXRvciA9IGFjdGl2ZS5hY3RpdmF0b3JOb2RlLmN1cnJlbnQ7XG5cbiAgICAgIGlmIChhY3RpdmF0b3IgJiYgZXZlbnQudGFyZ2V0ICE9PSBhY3RpdmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgb25BY3RpdmF0aW9uID09IG51bGwgPyB2b2lkIDAgOiBvbkFjdGl2YXRpb24oe1xuICAgICAgICBldmVudDogZXZlbnQubmF0aXZlRXZlbnRcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XTtcblxuZnVuY3Rpb24gaXNEaXN0YW5jZUNvbnN0cmFpbnQoY29uc3RyYWludCkge1xuICByZXR1cm4gQm9vbGVhbihjb25zdHJhaW50ICYmICdkaXN0YW5jZScgaW4gY29uc3RyYWludCk7XG59XG5cbmZ1bmN0aW9uIGlzRGVsYXlDb25zdHJhaW50KGNvbnN0cmFpbnQpIHtcbiAgcmV0dXJuIEJvb2xlYW4oY29uc3RyYWludCAmJiAnZGVsYXknIGluIGNvbnN0cmFpbnQpO1xufVxuXG5jbGFzcyBBYnN0cmFjdFBvaW50ZXJTZW5zb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm9wcywgZXZlbnRzLCBsaXN0ZW5lclRhcmdldCkge1xuICAgIHZhciBfZ2V0RXZlbnRDb29yZGluYXRlcztcblxuICAgIGlmIChsaXN0ZW5lclRhcmdldCA9PT0gdm9pZCAwKSB7XG4gICAgICBsaXN0ZW5lclRhcmdldCA9IGdldEV2ZW50TGlzdGVuZXJUYXJnZXQocHJvcHMuZXZlbnQudGFyZ2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLnByb3BzID0gdm9pZCAwO1xuICAgIHRoaXMuZXZlbnRzID0gdm9pZCAwO1xuICAgIHRoaXMuYXV0b1Njcm9sbEVuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuZG9jdW1lbnQgPSB2b2lkIDA7XG4gICAgdGhpcy5hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmluaXRpYWxDb29yZGluYXRlcyA9IHZvaWQgMDtcbiAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGw7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgdGhpcy5kb2N1bWVudExpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgdGhpcy5ldmVudHMgPSBldmVudHM7XG4gICAgY29uc3Qge1xuICAgICAgZXZlbnRcbiAgICB9ID0gcHJvcHM7XG4gICAgY29uc3Qge1xuICAgICAgdGFyZ2V0XG4gICAgfSA9IGV2ZW50O1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50cztcbiAgICB0aGlzLmRvY3VtZW50ID0gZ2V0T3duZXJEb2N1bWVudCh0YXJnZXQpO1xuICAgIHRoaXMuZG9jdW1lbnRMaXN0ZW5lcnMgPSBuZXcgTGlzdGVuZXJzKHRoaXMuZG9jdW1lbnQpO1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IExpc3RlbmVycyhsaXN0ZW5lclRhcmdldCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMgPSBuZXcgTGlzdGVuZXJzKGdldFdpbmRvdyh0YXJnZXQpKTtcbiAgICB0aGlzLmluaXRpYWxDb29yZGluYXRlcyA9IChfZ2V0RXZlbnRDb29yZGluYXRlcyA9IGdldEV2ZW50Q29vcmRpbmF0ZXMoZXZlbnQpKSAhPSBudWxsID8gX2dldEV2ZW50Q29vcmRpbmF0ZXMgOiBkZWZhdWx0Q29vcmRpbmF0ZXM7XG4gICAgdGhpcy5oYW5kbGVTdGFydCA9IHRoaXMuaGFuZGxlU3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZU1vdmUgPSB0aGlzLmhhbmRsZU1vdmUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZUVuZCA9IHRoaXMuaGFuZGxlRW5kLmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVDYW5jZWwgPSB0aGlzLmhhbmRsZUNhbmNlbC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGFuZGxlS2V5ZG93biA9IHRoaXMuaGFuZGxlS2V5ZG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlVGV4dFNlbGVjdGlvbiA9IHRoaXMucmVtb3ZlVGV4dFNlbGVjdGlvbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYXR0YWNoKCk7XG4gIH1cblxuICBhdHRhY2goKSB7XG4gICAgY29uc3Qge1xuICAgICAgZXZlbnRzLFxuICAgICAgcHJvcHM6IHtcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIGFjdGl2YXRpb25Db25zdHJhaW50LFxuICAgICAgICAgIGJ5cGFzc0FjdGl2YXRpb25Db25zdHJhaW50XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9ID0gdGhpcztcbiAgICB0aGlzLmxpc3RlbmVycy5hZGQoZXZlbnRzLm1vdmUubmFtZSwgdGhpcy5oYW5kbGVNb3ZlLCB7XG4gICAgICBwYXNzaXZlOiBmYWxzZVxuICAgIH0pO1xuICAgIHRoaXMubGlzdGVuZXJzLmFkZChldmVudHMuZW5kLm5hbWUsIHRoaXMuaGFuZGxlRW5kKTtcblxuICAgIGlmIChldmVudHMuY2FuY2VsKSB7XG4gICAgICB0aGlzLmxpc3RlbmVycy5hZGQoZXZlbnRzLmNhbmNlbC5uYW1lLCB0aGlzLmhhbmRsZUNhbmNlbCk7XG4gICAgfVxuXG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5SZXNpemUsIHRoaXMuaGFuZGxlQ2FuY2VsKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5hZGQoRXZlbnROYW1lLkRyYWdTdGFydCwgcHJldmVudERlZmF1bHQpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuVmlzaWJpbGl0eUNoYW5nZSwgdGhpcy5oYW5kbGVDYW5jZWwpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuQ29udGV4dE1lbnUsIHByZXZlbnREZWZhdWx0KTtcbiAgICB0aGlzLmRvY3VtZW50TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuS2V5ZG93biwgdGhpcy5oYW5kbGVLZXlkb3duKTtcblxuICAgIGlmIChhY3RpdmF0aW9uQ29uc3RyYWludCkge1xuICAgICAgaWYgKGJ5cGFzc0FjdGl2YXRpb25Db25zdHJhaW50ICE9IG51bGwgJiYgYnlwYXNzQWN0aXZhdGlvbkNvbnN0cmFpbnQoe1xuICAgICAgICBldmVudDogdGhpcy5wcm9wcy5ldmVudCxcbiAgICAgICAgYWN0aXZlTm9kZTogdGhpcy5wcm9wcy5hY3RpdmVOb2RlLFxuICAgICAgICBvcHRpb25zOiB0aGlzLnByb3BzLm9wdGlvbnNcbiAgICAgIH0pKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVN0YXJ0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0RlbGF5Q29uc3RyYWludChhY3RpdmF0aW9uQ29uc3RyYWludCkpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KHRoaXMuaGFuZGxlU3RhcnQsIGFjdGl2YXRpb25Db25zdHJhaW50LmRlbGF5KTtcbiAgICAgICAgdGhpcy5oYW5kbGVQZW5kaW5nKGFjdGl2YXRpb25Db25zdHJhaW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNEaXN0YW5jZUNvbnN0cmFpbnQoYWN0aXZhdGlvbkNvbnN0cmFpbnQpKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlUGVuZGluZyhhY3RpdmF0aW9uQ29uc3RyYWludCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVN0YXJ0KCk7XG4gIH1cblxuICBkZXRhY2goKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMucmVtb3ZlQWxsKCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMucmVtb3ZlQWxsKCk7IC8vIFdhaXQgdW50aWwgdGhlIG5leHQgZXZlbnQgbG9vcCBiZWZvcmUgcmVtb3ZpbmcgZG9jdW1lbnQgbGlzdGVuZXJzXG4gICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBsaXN0ZW4gZm9yIGBjbGlja2AgYW5kIGBzZWxlY3Rpb25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnRcblxuICAgIHNldFRpbWVvdXQodGhpcy5kb2N1bWVudExpc3RlbmVycy5yZW1vdmVBbGwsIDUwKTtcblxuICAgIGlmICh0aGlzLnRpbWVvdXRJZCAhPT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkKTtcbiAgICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVQZW5kaW5nKGNvbnN0cmFpbnQsIG9mZnNldCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIG9uUGVuZGluZ1xuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIG9uUGVuZGluZyhhY3RpdmUsIGNvbnN0cmFpbnQsIHRoaXMuaW5pdGlhbENvb3JkaW5hdGVzLCBvZmZzZXQpO1xuICB9XG5cbiAgaGFuZGxlU3RhcnQoKSB7XG4gICAgY29uc3Qge1xuICAgICAgaW5pdGlhbENvb3JkaW5hdGVzXG4gICAgfSA9IHRoaXM7XG4gICAgY29uc3Qge1xuICAgICAgb25TdGFydFxuICAgIH0gPSB0aGlzLnByb3BzO1xuXG4gICAgaWYgKGluaXRpYWxDb29yZGluYXRlcykge1xuICAgICAgdGhpcy5hY3RpdmF0ZWQgPSB0cnVlOyAvLyBTdG9wIHByb3BhZ2F0aW9uIG9mIGNsaWNrIGV2ZW50cyBvbmNlIGFjdGl2YXRpb24gY29uc3RyYWludHMgYXJlIG1ldFxuXG4gICAgICB0aGlzLmRvY3VtZW50TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuQ2xpY2ssIHN0b3BQcm9wYWdhdGlvbiwge1xuICAgICAgICBjYXB0dXJlOiB0cnVlXG4gICAgICB9KTsgLy8gUmVtb3ZlIGFueSB0ZXh0IHNlbGVjdGlvbiBmcm9tIHRoZSBkb2N1bWVudFxuXG4gICAgICB0aGlzLnJlbW92ZVRleHRTZWxlY3Rpb24oKTsgLy8gUHJldmVudCBmdXJ0aGVyIHRleHQgc2VsZWN0aW9uIHdoaWxlIGRyYWdnaW5nXG5cbiAgICAgIHRoaXMuZG9jdW1lbnRMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5TZWxlY3Rpb25DaGFuZ2UsIHRoaXMucmVtb3ZlVGV4dFNlbGVjdGlvbik7XG4gICAgICBvblN0YXJ0KGluaXRpYWxDb29yZGluYXRlcyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlTW92ZShldmVudCkge1xuICAgIHZhciBfZ2V0RXZlbnRDb29yZGluYXRlczI7XG5cbiAgICBjb25zdCB7XG4gICAgICBhY3RpdmF0ZWQsXG4gICAgICBpbml0aWFsQ29vcmRpbmF0ZXMsXG4gICAgICBwcm9wc1xuICAgIH0gPSB0aGlzO1xuICAgIGNvbnN0IHtcbiAgICAgIG9uTW92ZSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgYWN0aXZhdGlvbkNvbnN0cmFpbnRcbiAgICAgIH1cbiAgICB9ID0gcHJvcHM7XG5cbiAgICBpZiAoIWluaXRpYWxDb29yZGluYXRlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvb3JkaW5hdGVzID0gKF9nZXRFdmVudENvb3JkaW5hdGVzMiA9IGdldEV2ZW50Q29vcmRpbmF0ZXMoZXZlbnQpKSAhPSBudWxsID8gX2dldEV2ZW50Q29vcmRpbmF0ZXMyIDogZGVmYXVsdENvb3JkaW5hdGVzO1xuICAgIGNvbnN0IGRlbHRhID0gc3VidHJhY3QoaW5pdGlhbENvb3JkaW5hdGVzLCBjb29yZGluYXRlcyk7IC8vIENvbnN0cmFpbnQgdmFsaWRhdGlvblxuXG4gICAgaWYgKCFhY3RpdmF0ZWQgJiYgYWN0aXZhdGlvbkNvbnN0cmFpbnQpIHtcbiAgICAgIGlmIChpc0Rpc3RhbmNlQ29uc3RyYWludChhY3RpdmF0aW9uQ29uc3RyYWludCkpIHtcbiAgICAgICAgaWYgKGFjdGl2YXRpb25Db25zdHJhaW50LnRvbGVyYW5jZSAhPSBudWxsICYmIGhhc0V4Y2VlZGVkRGlzdGFuY2UoZGVsdGEsIGFjdGl2YXRpb25Db25zdHJhaW50LnRvbGVyYW5jZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVDYW5jZWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNFeGNlZWRlZERpc3RhbmNlKGRlbHRhLCBhY3RpdmF0aW9uQ29uc3RyYWludC5kaXN0YW5jZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTdGFydCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0RlbGF5Q29uc3RyYWludChhY3RpdmF0aW9uQ29uc3RyYWludCkpIHtcbiAgICAgICAgaWYgKGhhc0V4Y2VlZGVkRGlzdGFuY2UoZGVsdGEsIGFjdGl2YXRpb25Db25zdHJhaW50LnRvbGVyYW5jZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVDYW5jZWwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmhhbmRsZVBlbmRpbmcoYWN0aXZhdGlvbkNvbnN0cmFpbnQsIGRlbHRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXZlbnQuY2FuY2VsYWJsZSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBvbk1vdmUoY29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgaGFuZGxlRW5kKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIG9uQWJvcnQsXG4gICAgICBvbkVuZFxuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIHRoaXMuZGV0YWNoKCk7XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZhdGVkKSB7XG4gICAgICBvbkFib3J0KHRoaXMucHJvcHMuYWN0aXZlKTtcbiAgICB9XG5cbiAgICBvbkVuZCgpO1xuICB9XG5cbiAgaGFuZGxlQ2FuY2VsKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIG9uQWJvcnQsXG4gICAgICBvbkNhbmNlbFxuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIHRoaXMuZGV0YWNoKCk7XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZhdGVkKSB7XG4gICAgICBvbkFib3J0KHRoaXMucHJvcHMuYWN0aXZlKTtcbiAgICB9XG5cbiAgICBvbkNhbmNlbCgpO1xuICB9XG5cbiAgaGFuZGxlS2V5ZG93bihldmVudCkge1xuICAgIGlmIChldmVudC5jb2RlID09PSBLZXlib2FyZENvZGUuRXNjKSB7XG4gICAgICB0aGlzLmhhbmRsZUNhbmNlbCgpO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZVRleHRTZWxlY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzJGRvY3VtZW50JGdldFNlbDtcblxuICAgIChfdGhpcyRkb2N1bWVudCRnZXRTZWwgPSB0aGlzLmRvY3VtZW50LmdldFNlbGVjdGlvbigpKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkZG9jdW1lbnQkZ2V0U2VsLnJlbW92ZUFsbFJhbmdlcygpO1xuICB9XG5cbn1cblxuY29uc3QgZXZlbnRzID0ge1xuICBjYW5jZWw6IHtcbiAgICBuYW1lOiAncG9pbnRlcmNhbmNlbCdcbiAgfSxcbiAgbW92ZToge1xuICAgIG5hbWU6ICdwb2ludGVybW92ZSdcbiAgfSxcbiAgZW5kOiB7XG4gICAgbmFtZTogJ3BvaW50ZXJ1cCdcbiAgfVxufTtcbmNsYXNzIFBvaW50ZXJTZW5zb3IgZXh0ZW5kcyBBYnN0cmFjdFBvaW50ZXJTZW5zb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIGNvbnN0IHtcbiAgICAgIGV2ZW50XG4gICAgfSA9IHByb3BzOyAvLyBQb2ludGVyIGV2ZW50cyBzdG9wIGZpcmluZyBpZiB0aGUgdGFyZ2V0IGlzIHVubW91bnRlZCB3aGlsZSBkcmFnZ2luZ1xuICAgIC8vIFRoZXJlZm9yZSB3ZSBhdHRhY2ggbGlzdGVuZXJzIHRvIHRoZSBvd25lciBkb2N1bWVudCBpbnN0ZWFkXG5cbiAgICBjb25zdCBsaXN0ZW5lclRhcmdldCA9IGdldE93bmVyRG9jdW1lbnQoZXZlbnQudGFyZ2V0KTtcbiAgICBzdXBlcihwcm9wcywgZXZlbnRzLCBsaXN0ZW5lclRhcmdldCk7XG4gIH1cblxufVxuUG9pbnRlclNlbnNvci5hY3RpdmF0b3JzID0gW3tcbiAgZXZlbnROYW1lOiAnb25Qb2ludGVyRG93bicsXG4gIGhhbmRsZXI6IChfcmVmLCBfcmVmMikgPT4ge1xuICAgIGxldCB7XG4gICAgICBuYXRpdmVFdmVudDogZXZlbnRcbiAgICB9ID0gX3JlZjtcbiAgICBsZXQge1xuICAgICAgb25BY3RpdmF0aW9uXG4gICAgfSA9IF9yZWYyO1xuXG4gICAgaWYgKCFldmVudC5pc1ByaW1hcnkgfHwgZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgb25BY3RpdmF0aW9uID09IG51bGwgPyB2b2lkIDAgOiBvbkFjdGl2YXRpb24oe1xuICAgICAgZXZlbnRcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufV07XG5cbmNvbnN0IGV2ZW50cyQxID0ge1xuICBtb3ZlOiB7XG4gICAgbmFtZTogJ21vdXNlbW92ZSdcbiAgfSxcbiAgZW5kOiB7XG4gICAgbmFtZTogJ21vdXNldXAnXG4gIH1cbn07XG52YXIgTW91c2VCdXR0b247XG5cbihmdW5jdGlvbiAoTW91c2VCdXR0b24pIHtcbiAgTW91c2VCdXR0b25bTW91c2VCdXR0b25bXCJSaWdodENsaWNrXCJdID0gMl0gPSBcIlJpZ2h0Q2xpY2tcIjtcbn0pKE1vdXNlQnV0dG9uIHx8IChNb3VzZUJ1dHRvbiA9IHt9KSk7XG5cbmNsYXNzIE1vdXNlU2Vuc29yIGV4dGVuZHMgQWJzdHJhY3RQb2ludGVyU2Vuc29yIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcywgZXZlbnRzJDEsIGdldE93bmVyRG9jdW1lbnQocHJvcHMuZXZlbnQudGFyZ2V0KSk7XG4gIH1cblxufVxuTW91c2VTZW5zb3IuYWN0aXZhdG9ycyA9IFt7XG4gIGV2ZW50TmFtZTogJ29uTW91c2VEb3duJyxcbiAgaGFuZGxlcjogKF9yZWYsIF9yZWYyKSA9PiB7XG4gICAgbGV0IHtcbiAgICAgIG5hdGl2ZUV2ZW50OiBldmVudFxuICAgIH0gPSBfcmVmO1xuICAgIGxldCB7XG4gICAgICBvbkFjdGl2YXRpb25cbiAgICB9ID0gX3JlZjI7XG5cbiAgICBpZiAoZXZlbnQuYnV0dG9uID09PSBNb3VzZUJ1dHRvbi5SaWdodENsaWNrKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgb25BY3RpdmF0aW9uID09IG51bGwgPyB2b2lkIDAgOiBvbkFjdGl2YXRpb24oe1xuICAgICAgZXZlbnRcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufV07XG5cbmNvbnN0IGV2ZW50cyQyID0ge1xuICBjYW5jZWw6IHtcbiAgICBuYW1lOiAndG91Y2hjYW5jZWwnXG4gIH0sXG4gIG1vdmU6IHtcbiAgICBuYW1lOiAndG91Y2htb3ZlJ1xuICB9LFxuICBlbmQ6IHtcbiAgICBuYW1lOiAndG91Y2hlbmQnXG4gIH1cbn07XG5jbGFzcyBUb3VjaFNlbnNvciBleHRlbmRzIEFic3RyYWN0UG9pbnRlclNlbnNvciB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMsIGV2ZW50cyQyKTtcbiAgfVxuXG4gIHN0YXRpYyBzZXR1cCgpIHtcbiAgICAvLyBBZGRpbmcgYSBub24tY2FwdHVyZSBhbmQgbm9uLXBhc3NpdmUgYHRvdWNobW92ZWAgbGlzdGVuZXIgaW4gb3JkZXJcbiAgICAvLyB0byBmb3JjZSBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgY2FsbHMgdG8gd29yayBpbiBkeW5hbWljYWxseSBhZGRlZFxuICAgIC8vIHRvdWNobW92ZSBldmVudCBoYW5kbGVycy4gVGhpcyBpcyByZXF1aXJlZCBmb3IgaU9TIFNhZmFyaS5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihldmVudHMkMi5tb3ZlLm5hbWUsIG5vb3AsIHtcbiAgICAgIGNhcHR1cmU6IGZhbHNlLFxuICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICB9KTtcbiAgICByZXR1cm4gZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudHMkMi5tb3ZlLm5hbWUsIG5vb3ApO1xuICAgIH07IC8vIFdlIGNyZWF0ZSBhIG5ldyBoYW5kbGVyIGJlY2F1c2UgdGhlIHRlYXJkb3duIGZ1bmN0aW9uIG9mIGFub3RoZXIgc2Vuc29yXG4gICAgLy8gY291bGQgcmVtb3ZlIG91ciBldmVudCBsaXN0ZW5lciBpZiB3ZSB1c2UgYSByZWZlcmVudGlhbGx5IGVxdWFsIGxpc3RlbmVyLlxuXG4gICAgZnVuY3Rpb24gbm9vcCgpIHt9XG4gIH1cblxufVxuVG91Y2hTZW5zb3IuYWN0aXZhdG9ycyA9IFt7XG4gIGV2ZW50TmFtZTogJ29uVG91Y2hTdGFydCcsXG4gIGhhbmRsZXI6IChfcmVmLCBfcmVmMikgPT4ge1xuICAgIGxldCB7XG4gICAgICBuYXRpdmVFdmVudDogZXZlbnRcbiAgICB9ID0gX3JlZjtcbiAgICBsZXQge1xuICAgICAgb25BY3RpdmF0aW9uXG4gICAgfSA9IF9yZWYyO1xuICAgIGNvbnN0IHtcbiAgICAgIHRvdWNoZXNcbiAgICB9ID0gZXZlbnQ7XG5cbiAgICBpZiAodG91Y2hlcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgb25BY3RpdmF0aW9uID09IG51bGwgPyB2b2lkIDAgOiBvbkFjdGl2YXRpb24oe1xuICAgICAgZXZlbnRcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufV07XG5cbnZhciBBdXRvU2Nyb2xsQWN0aXZhdG9yO1xuXG4oZnVuY3Rpb24gKEF1dG9TY3JvbGxBY3RpdmF0b3IpIHtcbiAgQXV0b1Njcm9sbEFjdGl2YXRvcltBdXRvU2Nyb2xsQWN0aXZhdG9yW1wiUG9pbnRlclwiXSA9IDBdID0gXCJQb2ludGVyXCI7XG4gIEF1dG9TY3JvbGxBY3RpdmF0b3JbQXV0b1Njcm9sbEFjdGl2YXRvcltcIkRyYWdnYWJsZVJlY3RcIl0gPSAxXSA9IFwiRHJhZ2dhYmxlUmVjdFwiO1xufSkoQXV0b1Njcm9sbEFjdGl2YXRvciB8fCAoQXV0b1Njcm9sbEFjdGl2YXRvciA9IHt9KSk7XG5cbnZhciBUcmF2ZXJzYWxPcmRlcjtcblxuKGZ1bmN0aW9uIChUcmF2ZXJzYWxPcmRlcikge1xuICBUcmF2ZXJzYWxPcmRlcltUcmF2ZXJzYWxPcmRlcltcIlRyZWVPcmRlclwiXSA9IDBdID0gXCJUcmVlT3JkZXJcIjtcbiAgVHJhdmVyc2FsT3JkZXJbVHJhdmVyc2FsT3JkZXJbXCJSZXZlcnNlZFRyZWVPcmRlclwiXSA9IDFdID0gXCJSZXZlcnNlZFRyZWVPcmRlclwiO1xufSkoVHJhdmVyc2FsT3JkZXIgfHwgKFRyYXZlcnNhbE9yZGVyID0ge30pKTtcblxuZnVuY3Rpb24gdXNlQXV0b1Njcm9sbGVyKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBhY2NlbGVyYXRpb24sXG4gICAgYWN0aXZhdG9yID0gQXV0b1Njcm9sbEFjdGl2YXRvci5Qb2ludGVyLFxuICAgIGNhblNjcm9sbCxcbiAgICBkcmFnZ2luZ1JlY3QsXG4gICAgZW5hYmxlZCxcbiAgICBpbnRlcnZhbCA9IDUsXG4gICAgb3JkZXIgPSBUcmF2ZXJzYWxPcmRlci5UcmVlT3JkZXIsXG4gICAgcG9pbnRlckNvb3JkaW5hdGVzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsXG4gICAgZGVsdGEsXG4gICAgdGhyZXNob2xkXG4gIH0gPSBfcmVmO1xuICBjb25zdCBzY3JvbGxJbnRlbnQgPSB1c2VTY3JvbGxJbnRlbnQoe1xuICAgIGRlbHRhLFxuICAgIGRpc2FibGVkOiAhZW5hYmxlZFxuICB9KTtcbiAgY29uc3QgW3NldEF1dG9TY3JvbGxJbnRlcnZhbCwgY2xlYXJBdXRvU2Nyb2xsSW50ZXJ2YWxdID0gdXNlSW50ZXJ2YWwoKTtcbiAgY29uc3Qgc2Nyb2xsU3BlZWQgPSB1c2VSZWYoe1xuICAgIHg6IDAsXG4gICAgeTogMFxuICB9KTtcbiAgY29uc3Qgc2Nyb2xsRGlyZWN0aW9uID0gdXNlUmVmKHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfSk7XG4gIGNvbnN0IHJlY3QgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBzd2l0Y2ggKGFjdGl2YXRvcikge1xuICAgICAgY2FzZSBBdXRvU2Nyb2xsQWN0aXZhdG9yLlBvaW50ZXI6XG4gICAgICAgIHJldHVybiBwb2ludGVyQ29vcmRpbmF0ZXMgPyB7XG4gICAgICAgICAgdG9wOiBwb2ludGVyQ29vcmRpbmF0ZXMueSxcbiAgICAgICAgICBib3R0b206IHBvaW50ZXJDb29yZGluYXRlcy55LFxuICAgICAgICAgIGxlZnQ6IHBvaW50ZXJDb29yZGluYXRlcy54LFxuICAgICAgICAgIHJpZ2h0OiBwb2ludGVyQ29vcmRpbmF0ZXMueFxuICAgICAgICB9IDogbnVsbDtcblxuICAgICAgY2FzZSBBdXRvU2Nyb2xsQWN0aXZhdG9yLkRyYWdnYWJsZVJlY3Q6XG4gICAgICAgIHJldHVybiBkcmFnZ2luZ1JlY3Q7XG4gICAgfVxuICB9LCBbYWN0aXZhdG9yLCBkcmFnZ2luZ1JlY3QsIHBvaW50ZXJDb29yZGluYXRlc10pO1xuICBjb25zdCBzY3JvbGxDb250YWluZXJSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGF1dG9TY3JvbGwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyID0gc2Nyb2xsQ29udGFpbmVyUmVmLmN1cnJlbnQ7XG5cbiAgICBpZiAoIXNjcm9sbENvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNjcm9sbExlZnQgPSBzY3JvbGxTcGVlZC5jdXJyZW50LnggKiBzY3JvbGxEaXJlY3Rpb24uY3VycmVudC54O1xuICAgIGNvbnN0IHNjcm9sbFRvcCA9IHNjcm9sbFNwZWVkLmN1cnJlbnQueSAqIHNjcm9sbERpcmVjdGlvbi5jdXJyZW50Lnk7XG4gICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbEJ5KHNjcm9sbExlZnQsIHNjcm9sbFRvcCk7XG4gIH0sIFtdKTtcbiAgY29uc3Qgc29ydGVkU2Nyb2xsYWJsZUFuY2VzdG9ycyA9IHVzZU1lbW8oKCkgPT4gb3JkZXIgPT09IFRyYXZlcnNhbE9yZGVyLlRyZWVPcmRlciA/IFsuLi5zY3JvbGxhYmxlQW5jZXN0b3JzXS5yZXZlcnNlKCkgOiBzY3JvbGxhYmxlQW5jZXN0b3JzLCBbb3JkZXIsIHNjcm9sbGFibGVBbmNlc3RvcnNdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWVuYWJsZWQgfHwgIXNjcm9sbGFibGVBbmNlc3RvcnMubGVuZ3RoIHx8ICFyZWN0KSB7XG4gICAgICBjbGVhckF1dG9TY3JvbGxJbnRlcnZhbCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2Nyb2xsQ29udGFpbmVyIG9mIHNvcnRlZFNjcm9sbGFibGVBbmNlc3RvcnMpIHtcbiAgICAgIGlmICgoY2FuU2Nyb2xsID09IG51bGwgPyB2b2lkIDAgOiBjYW5TY3JvbGwoc2Nyb2xsQ29udGFpbmVyKSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbmRleCA9IHNjcm9sbGFibGVBbmNlc3RvcnMuaW5kZXhPZihzY3JvbGxDb250YWluZXIpO1xuICAgICAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyUmVjdCA9IHNjcm9sbGFibGVBbmNlc3RvclJlY3RzW2luZGV4XTtcblxuICAgICAgaWYgKCFzY3JvbGxDb250YWluZXJSZWN0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgc3BlZWRcbiAgICAgIH0gPSBnZXRTY3JvbGxEaXJlY3Rpb25BbmRTcGVlZChzY3JvbGxDb250YWluZXIsIHNjcm9sbENvbnRhaW5lclJlY3QsIHJlY3QsIGFjY2VsZXJhdGlvbiwgdGhyZXNob2xkKTtcblxuICAgICAgZm9yIChjb25zdCBheGlzIG9mIFsneCcsICd5J10pIHtcbiAgICAgICAgaWYgKCFzY3JvbGxJbnRlbnRbYXhpc11bZGlyZWN0aW9uW2F4aXNdXSkge1xuICAgICAgICAgIHNwZWVkW2F4aXNdID0gMDtcbiAgICAgICAgICBkaXJlY3Rpb25bYXhpc10gPSAwO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzcGVlZC54ID4gMCB8fCBzcGVlZC55ID4gMCkge1xuICAgICAgICBjbGVhckF1dG9TY3JvbGxJbnRlcnZhbCgpO1xuICAgICAgICBzY3JvbGxDb250YWluZXJSZWYuY3VycmVudCA9IHNjcm9sbENvbnRhaW5lcjtcbiAgICAgICAgc2V0QXV0b1Njcm9sbEludGVydmFsKGF1dG9TY3JvbGwsIGludGVydmFsKTtcbiAgICAgICAgc2Nyb2xsU3BlZWQuY3VycmVudCA9IHNwZWVkO1xuICAgICAgICBzY3JvbGxEaXJlY3Rpb24uY3VycmVudCA9IGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNjcm9sbFNwZWVkLmN1cnJlbnQgPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH07XG4gICAgc2Nyb2xsRGlyZWN0aW9uLmN1cnJlbnQgPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH07XG4gICAgY2xlYXJBdXRvU2Nyb2xsSW50ZXJ2YWwoKTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbYWNjZWxlcmF0aW9uLCBhdXRvU2Nyb2xsLCBjYW5TY3JvbGwsIGNsZWFyQXV0b1Njcm9sbEludGVydmFsLCBlbmFibGVkLCBpbnRlcnZhbCwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBKU09OLnN0cmluZ2lmeShyZWN0KSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBKU09OLnN0cmluZ2lmeShzY3JvbGxJbnRlbnQpLCBzZXRBdXRvU2Nyb2xsSW50ZXJ2YWwsIHNjcm9sbGFibGVBbmNlc3RvcnMsIHNvcnRlZFNjcm9sbGFibGVBbmNlc3RvcnMsIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIEpTT04uc3RyaW5naWZ5KHRocmVzaG9sZCldKTtcbn1cbmNvbnN0IGRlZmF1bHRTY3JvbGxJbnRlbnQgPSB7XG4gIHg6IHtcbiAgICBbRGlyZWN0aW9uLkJhY2t3YXJkXTogZmFsc2UsXG4gICAgW0RpcmVjdGlvbi5Gb3J3YXJkXTogZmFsc2VcbiAgfSxcbiAgeToge1xuICAgIFtEaXJlY3Rpb24uQmFja3dhcmRdOiBmYWxzZSxcbiAgICBbRGlyZWN0aW9uLkZvcndhcmRdOiBmYWxzZVxuICB9XG59O1xuXG5mdW5jdGlvbiB1c2VTY3JvbGxJbnRlbnQoX3JlZjIpIHtcbiAgbGV0IHtcbiAgICBkZWx0YSxcbiAgICBkaXNhYmxlZFxuICB9ID0gX3JlZjI7XG4gIGNvbnN0IHByZXZpb3VzRGVsdGEgPSB1c2VQcmV2aW91cyhkZWx0YSk7XG4gIHJldHVybiB1c2VMYXp5TWVtbyhwcmV2aW91c0ludGVudCA9PiB7XG4gICAgaWYgKGRpc2FibGVkIHx8ICFwcmV2aW91c0RlbHRhIHx8ICFwcmV2aW91c0ludGVudCkge1xuICAgICAgLy8gUmVzZXQgc2Nyb2xsIGludGVudCB0cmFja2luZyB3aGVuIGF1dG8tc2Nyb2xsaW5nIGlzIGRpc2FibGVkXG4gICAgICByZXR1cm4gZGVmYXVsdFNjcm9sbEludGVudDtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3Rpb24gPSB7XG4gICAgICB4OiBNYXRoLnNpZ24oZGVsdGEueCAtIHByZXZpb3VzRGVsdGEueCksXG4gICAgICB5OiBNYXRoLnNpZ24oZGVsdGEueSAtIHByZXZpb3VzRGVsdGEueSlcbiAgICB9OyAvLyBLZWVwIHRyYWNrIG9mIHRoZSB1c2VyIGludGVudCB0byBzY3JvbGwgaW4gZWFjaCBkaXJlY3Rpb24gZm9yIGJvdGggYXhpc1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHtcbiAgICAgICAgW0RpcmVjdGlvbi5CYWNrd2FyZF06IHByZXZpb3VzSW50ZW50LnhbRGlyZWN0aW9uLkJhY2t3YXJkXSB8fCBkaXJlY3Rpb24ueCA9PT0gLTEsXG4gICAgICAgIFtEaXJlY3Rpb24uRm9yd2FyZF06IHByZXZpb3VzSW50ZW50LnhbRGlyZWN0aW9uLkZvcndhcmRdIHx8IGRpcmVjdGlvbi54ID09PSAxXG4gICAgICB9LFxuICAgICAgeToge1xuICAgICAgICBbRGlyZWN0aW9uLkJhY2t3YXJkXTogcHJldmlvdXNJbnRlbnQueVtEaXJlY3Rpb24uQmFja3dhcmRdIHx8IGRpcmVjdGlvbi55ID09PSAtMSxcbiAgICAgICAgW0RpcmVjdGlvbi5Gb3J3YXJkXTogcHJldmlvdXNJbnRlbnQueVtEaXJlY3Rpb24uRm9yd2FyZF0gfHwgZGlyZWN0aW9uLnkgPT09IDFcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbZGlzYWJsZWQsIGRlbHRhLCBwcmV2aW91c0RlbHRhXSk7XG59XG5cbmZ1bmN0aW9uIHVzZUNhY2hlZE5vZGUoZHJhZ2dhYmxlTm9kZXMsIGlkKSB7XG4gIGNvbnN0IGRyYWdnYWJsZU5vZGUgPSBpZCAhPSBudWxsID8gZHJhZ2dhYmxlTm9kZXMuZ2V0KGlkKSA6IHVuZGVmaW5lZDtcbiAgY29uc3Qgbm9kZSA9IGRyYWdnYWJsZU5vZGUgPyBkcmFnZ2FibGVOb2RlLm5vZGUuY3VycmVudCA6IG51bGw7XG4gIHJldHVybiB1c2VMYXp5TWVtbyhjYWNoZWROb2RlID0+IHtcbiAgICB2YXIgX3JlZjtcblxuICAgIGlmIChpZCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IC8vIEluIHNvbWUgY2FzZXMsIHRoZSBkcmFnZ2FibGUgbm9kZSBjYW4gdW5tb3VudCB3aGlsZSBkcmFnZ2luZ1xuICAgIC8vIFRoaXMgaXMgdGhlIGNhc2UgZm9yIHZpcnR1YWxpemVkIGxpc3RzLiBJbiB0aG9zZSBzaXR1YXRpb25zLFxuICAgIC8vIHdlIGZhbGwgYmFjayB0byB0aGUgbGFzdCBrbm93biB2YWx1ZSBmb3IgdGhhdCBub2RlLlxuXG5cbiAgICByZXR1cm4gKF9yZWYgPSBub2RlICE9IG51bGwgPyBub2RlIDogY2FjaGVkTm9kZSkgIT0gbnVsbCA/IF9yZWYgOiBudWxsO1xuICB9LCBbbm9kZSwgaWRdKTtcbn1cblxuZnVuY3Rpb24gdXNlQ29tYmluZUFjdGl2YXRvcnMoc2Vuc29ycywgZ2V0U3ludGhldGljSGFuZGxlcikge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiBzZW5zb3JzLnJlZHVjZSgoYWNjdW11bGF0b3IsIHNlbnNvcikgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIHNlbnNvcjogU2Vuc29yXG4gICAgfSA9IHNlbnNvcjtcbiAgICBjb25zdCBzZW5zb3JBY3RpdmF0b3JzID0gU2Vuc29yLmFjdGl2YXRvcnMubWFwKGFjdGl2YXRvciA9PiAoe1xuICAgICAgZXZlbnROYW1lOiBhY3RpdmF0b3IuZXZlbnROYW1lLFxuICAgICAgaGFuZGxlcjogZ2V0U3ludGhldGljSGFuZGxlcihhY3RpdmF0b3IuaGFuZGxlciwgc2Vuc29yKVxuICAgIH0pKTtcbiAgICByZXR1cm4gWy4uLmFjY3VtdWxhdG9yLCAuLi5zZW5zb3JBY3RpdmF0b3JzXTtcbiAgfSwgW10pLCBbc2Vuc29ycywgZ2V0U3ludGhldGljSGFuZGxlcl0pO1xufVxuXG52YXIgTWVhc3VyaW5nU3RyYXRlZ3k7XG5cbihmdW5jdGlvbiAoTWVhc3VyaW5nU3RyYXRlZ3kpIHtcbiAgTWVhc3VyaW5nU3RyYXRlZ3lbTWVhc3VyaW5nU3RyYXRlZ3lbXCJBbHdheXNcIl0gPSAwXSA9IFwiQWx3YXlzXCI7XG4gIE1lYXN1cmluZ1N0cmF0ZWd5W01lYXN1cmluZ1N0cmF0ZWd5W1wiQmVmb3JlRHJhZ2dpbmdcIl0gPSAxXSA9IFwiQmVmb3JlRHJhZ2dpbmdcIjtcbiAgTWVhc3VyaW5nU3RyYXRlZ3lbTWVhc3VyaW5nU3RyYXRlZ3lbXCJXaGlsZURyYWdnaW5nXCJdID0gMl0gPSBcIldoaWxlRHJhZ2dpbmdcIjtcbn0pKE1lYXN1cmluZ1N0cmF0ZWd5IHx8IChNZWFzdXJpbmdTdHJhdGVneSA9IHt9KSk7XG5cbnZhciBNZWFzdXJpbmdGcmVxdWVuY3k7XG5cbihmdW5jdGlvbiAoTWVhc3VyaW5nRnJlcXVlbmN5KSB7XG4gIE1lYXN1cmluZ0ZyZXF1ZW5jeVtcIk9wdGltaXplZFwiXSA9IFwib3B0aW1pemVkXCI7XG59KShNZWFzdXJpbmdGcmVxdWVuY3kgfHwgKE1lYXN1cmluZ0ZyZXF1ZW5jeSA9IHt9KSk7XG5cbmNvbnN0IGRlZmF1bHRWYWx1ZSA9IC8qI19fUFVSRV9fKi9uZXcgTWFwKCk7XG5mdW5jdGlvbiB1c2VEcm9wcGFibGVNZWFzdXJpbmcoY29udGFpbmVycywgX3JlZikge1xuICBsZXQge1xuICAgIGRyYWdnaW5nLFxuICAgIGRlcGVuZGVuY2llcyxcbiAgICBjb25maWdcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IFtxdWV1ZSwgc2V0UXVldWVdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IHtcbiAgICBmcmVxdWVuY3ksXG4gICAgbWVhc3VyZSxcbiAgICBzdHJhdGVneVxuICB9ID0gY29uZmlnO1xuICBjb25zdCBjb250YWluZXJzUmVmID0gdXNlUmVmKGNvbnRhaW5lcnMpO1xuICBjb25zdCBkaXNhYmxlZCA9IGlzRGlzYWJsZWQoKTtcbiAgY29uc3QgZGlzYWJsZWRSZWYgPSB1c2VMYXRlc3RWYWx1ZShkaXNhYmxlZCk7XG4gIGNvbnN0IG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzID0gdXNlQ2FsbGJhY2soZnVuY3Rpb24gKGlkcykge1xuICAgIGlmIChpZHMgPT09IHZvaWQgMCkge1xuICAgICAgaWRzID0gW107XG4gICAgfVxuXG4gICAgaWYgKGRpc2FibGVkUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRRdWV1ZSh2YWx1ZSA9PiB7XG4gICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlLmNvbmNhdChpZHMuZmlsdGVyKGlkID0+ICF2YWx1ZS5pbmNsdWRlcyhpZCkpKTtcbiAgICB9KTtcbiAgfSwgW2Rpc2FibGVkUmVmXSk7XG4gIGNvbnN0IHRpbWVvdXRJZCA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgZHJvcHBhYmxlUmVjdHMgPSB1c2VMYXp5TWVtbyhwcmV2aW91c1ZhbHVlID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgJiYgIWRyYWdnaW5nKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIGlmICghcHJldmlvdXNWYWx1ZSB8fCBwcmV2aW91c1ZhbHVlID09PSBkZWZhdWx0VmFsdWUgfHwgY29udGFpbmVyc1JlZi5jdXJyZW50ICE9PSBjb250YWluZXJzIHx8IHF1ZXVlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgZm9yIChsZXQgY29udGFpbmVyIG9mIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWV1ZSAmJiBxdWV1ZS5sZW5ndGggPiAwICYmICFxdWV1ZS5pbmNsdWRlcyhjb250YWluZXIuaWQpICYmIGNvbnRhaW5lci5yZWN0LmN1cnJlbnQpIHtcbiAgICAgICAgICAvLyBUaGlzIGNvbnRhaW5lciBkb2VzIG5vdCBuZWVkIHRvIGJlIHJlLW1lYXN1cmVkXG4gICAgICAgICAgbWFwLnNldChjb250YWluZXIuaWQsIGNvbnRhaW5lci5yZWN0LmN1cnJlbnQpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IGNvbnRhaW5lci5ub2RlLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IHJlY3QgPSBub2RlID8gbmV3IFJlY3QobWVhc3VyZShub2RlKSwgbm9kZSkgOiBudWxsO1xuICAgICAgICBjb250YWluZXIucmVjdC5jdXJyZW50ID0gcmVjdDtcblxuICAgICAgICBpZiAocmVjdCkge1xuICAgICAgICAgIG1hcC5zZXQoY29udGFpbmVyLmlkLCByZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWFwO1xuICAgIH1cblxuICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xuICB9LCBbY29udGFpbmVycywgcXVldWUsIGRyYWdnaW5nLCBkaXNhYmxlZCwgbWVhc3VyZV0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnRhaW5lcnNSZWYuY3VycmVudCA9IGNvbnRhaW5lcnM7XG4gIH0sIFtjb250YWluZXJzXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMoKTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbZHJhZ2dpbmcsIGRpc2FibGVkXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHF1ZXVlICYmIHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgIHNldFF1ZXVlKG51bGwpO1xuICAgIH1cbiAgfSwgLy9lc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtKU09OLnN0cmluZ2lmeShxdWV1ZSldKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgfHwgdHlwZW9mIGZyZXF1ZW5jeSAhPT0gJ251bWJlcicgfHwgdGltZW91dElkLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aW1lb3V0SWQuY3VycmVudCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMoKTtcbiAgICAgIHRpbWVvdXRJZC5jdXJyZW50ID0gbnVsbDtcbiAgICB9LCBmcmVxdWVuY3kpO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtmcmVxdWVuY3ksIGRpc2FibGVkLCBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycywgLi4uZGVwZW5kZW5jaWVzXSk7XG4gIHJldHVybiB7XG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgbWVhc3VyaW5nU2NoZWR1bGVkOiBxdWV1ZSAhPSBudWxsXG4gIH07XG5cbiAgZnVuY3Rpb24gaXNEaXNhYmxlZCgpIHtcbiAgICBzd2l0Y2ggKHN0cmF0ZWd5KSB7XG4gICAgICBjYXNlIE1lYXN1cmluZ1N0cmF0ZWd5LkFsd2F5czpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBjYXNlIE1lYXN1cmluZ1N0cmF0ZWd5LkJlZm9yZURyYWdnaW5nOlxuICAgICAgICByZXR1cm4gZHJhZ2dpbmc7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAhZHJhZ2dpbmc7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVzZUluaXRpYWxWYWx1ZSh2YWx1ZSwgY29tcHV0ZUZuKSB7XG4gIHJldHVybiB1c2VMYXp5TWVtbyhwcmV2aW91c1ZhbHVlID0+IHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocHJldmlvdXNWYWx1ZSkge1xuICAgICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBjb21wdXRlRm4gPT09ICdmdW5jdGlvbicgPyBjb21wdXRlRm4odmFsdWUpIDogdmFsdWU7XG4gIH0sIFtjb21wdXRlRm4sIHZhbHVlXSk7XG59XG5cbmZ1bmN0aW9uIHVzZUluaXRpYWxSZWN0KG5vZGUsIG1lYXN1cmUpIHtcbiAgcmV0dXJuIHVzZUluaXRpYWxWYWx1ZShub2RlLCBtZWFzdXJlKTtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgYSBuZXcgTXV0YXRpb25PYnNlcnZlciBpbnN0YW5jZS5cclxuICogSWYgYE11dGF0aW9uT2JzZXJ2ZXJgIGlzIHVuZGVmaW5lZCBpbiB0aGUgZXhlY3V0aW9uIGVudmlyb25tZW50LCByZXR1cm5zIGB1bmRlZmluZWRgLlxyXG4gKi9cblxuZnVuY3Rpb24gdXNlTXV0YXRpb25PYnNlcnZlcihfcmVmKSB7XG4gIGxldCB7XG4gICAgY2FsbGJhY2ssXG4gICAgZGlzYWJsZWRcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGhhbmRsZU11dGF0aW9ucyA9IHVzZUV2ZW50KGNhbGxiYWNrKTtcbiAgY29uc3QgbXV0YXRpb25PYnNlcnZlciA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIE11dGF0aW9uT2JzZXJ2ZXJcbiAgICB9ID0gd2luZG93O1xuICAgIHJldHVybiBuZXcgTXV0YXRpb25PYnNlcnZlcihoYW5kbGVNdXRhdGlvbnMpO1xuICB9LCBbaGFuZGxlTXV0YXRpb25zLCBkaXNhYmxlZF0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJldHVybiAoKSA9PiBtdXRhdGlvbk9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiBtdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgfSwgW211dGF0aW9uT2JzZXJ2ZXJdKTtcbiAgcmV0dXJuIG11dGF0aW9uT2JzZXJ2ZXI7XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIGEgbmV3IFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlIGJvdW5kIHRvIHRoZSBgb25SZXNpemVgIGNhbGxiYWNrLlxyXG4gKiBJZiBgUmVzaXplT2JzZXJ2ZXJgIGlzIHVuZGVmaW5lZCBpbiB0aGUgZXhlY3V0aW9uIGVudmlyb25tZW50LCByZXR1cm5zIGB1bmRlZmluZWRgLlxyXG4gKi9cblxuZnVuY3Rpb24gdXNlUmVzaXplT2JzZXJ2ZXIoX3JlZikge1xuICBsZXQge1xuICAgIGNhbGxiYWNrLFxuICAgIGRpc2FibGVkXG4gIH0gPSBfcmVmO1xuICBjb25zdCBoYW5kbGVSZXNpemUgPSB1c2VFdmVudChjYWxsYmFjayk7XG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkIHx8IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB3aW5kb3cuUmVzaXplT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIFJlc2l6ZU9ic2VydmVyXG4gICAgfSA9IHdpbmRvdztcbiAgICByZXR1cm4gbmV3IFJlc2l6ZU9ic2VydmVyKGhhbmRsZVJlc2l6ZSk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2Rpc2FibGVkXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcmV0dXJuICgpID0+IHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gIH0sIFtyZXNpemVPYnNlcnZlcl0pO1xuICByZXR1cm4gcmVzaXplT2JzZXJ2ZXI7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRNZWFzdXJlKGVsZW1lbnQpIHtcbiAgcmV0dXJuIG5ldyBSZWN0KGdldENsaWVudFJlY3QoZWxlbWVudCksIGVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiB1c2VSZWN0KGVsZW1lbnQsIG1lYXN1cmUsIGZhbGxiYWNrUmVjdCkge1xuICBpZiAobWVhc3VyZSA9PT0gdm9pZCAwKSB7XG4gICAgbWVhc3VyZSA9IGRlZmF1bHRNZWFzdXJlO1xuICB9XG5cbiAgY29uc3QgW3JlY3QsIHNldFJlY3RdID0gdXNlU3RhdGUobnVsbCk7XG5cbiAgZnVuY3Rpb24gbWVhc3VyZVJlY3QoKSB7XG4gICAgc2V0UmVjdChjdXJyZW50UmVjdCA9PiB7XG4gICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChlbGVtZW50LmlzQ29ubmVjdGVkID09PSBmYWxzZSkge1xuICAgICAgICB2YXIgX3JlZjtcblxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gbGFzdCByZWN0IHdlIG1lYXN1cmVkIGlmIHRoZSBlbGVtZW50IGlzXG4gICAgICAgIC8vIG5vIGxvbmdlciBjb25uZWN0ZWQgdG8gdGhlIERPTS5cbiAgICAgICAgcmV0dXJuIChfcmVmID0gY3VycmVudFJlY3QgIT0gbnVsbCA/IGN1cnJlbnRSZWN0IDogZmFsbGJhY2tSZWN0KSAhPSBudWxsID8gX3JlZiA6IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld1JlY3QgPSBtZWFzdXJlKGVsZW1lbnQpO1xuXG4gICAgICBpZiAoSlNPTi5zdHJpbmdpZnkoY3VycmVudFJlY3QpID09PSBKU09OLnN0cmluZ2lmeShuZXdSZWN0KSkge1xuICAgICAgICByZXR1cm4gY3VycmVudFJlY3Q7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXdSZWN0O1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgbXV0YXRpb25PYnNlcnZlciA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoe1xuICAgIGNhbGxiYWNrKHJlY29yZHMpIHtcbiAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIHJlY29yZHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgdGFyZ2V0XG4gICAgICAgIH0gPSByZWNvcmQ7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdjaGlsZExpc3QnICYmIHRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIHRhcmdldC5jb250YWlucyhlbGVtZW50KSkge1xuICAgICAgICAgIG1lYXN1cmVSZWN0KCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgfSk7XG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyID0gdXNlUmVzaXplT2JzZXJ2ZXIoe1xuICAgIGNhbGxiYWNrOiBtZWFzdXJlUmVjdFxuICB9KTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgbWVhc3VyZVJlY3QoKTtcblxuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50KTtcbiAgICAgIG11dGF0aW9uT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICBtdXRhdGlvbk9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiBtdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gIH0sIFtlbGVtZW50XSk7XG4gIHJldHVybiByZWN0O1xufVxuXG5mdW5jdGlvbiB1c2VSZWN0RGVsdGEocmVjdCkge1xuICBjb25zdCBpbml0aWFsUmVjdCA9IHVzZUluaXRpYWxWYWx1ZShyZWN0KTtcbiAgcmV0dXJuIGdldFJlY3REZWx0YShyZWN0LCBpbml0aWFsUmVjdCk7XG59XG5cbmNvbnN0IGRlZmF1bHRWYWx1ZSQxID0gW107XG5mdW5jdGlvbiB1c2VTY3JvbGxhYmxlQW5jZXN0b3JzKG5vZGUpIHtcbiAgY29uc3QgcHJldmlvdXNOb2RlID0gdXNlUmVmKG5vZGUpO1xuICBjb25zdCBhbmNlc3RvcnMgPSB1c2VMYXp5TWVtbyhwcmV2aW91c1ZhbHVlID0+IHtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0VmFsdWUkMTtcbiAgICB9XG5cbiAgICBpZiAocHJldmlvdXNWYWx1ZSAmJiBwcmV2aW91c1ZhbHVlICE9PSBkZWZhdWx0VmFsdWUkMSAmJiBub2RlICYmIHByZXZpb3VzTm9kZS5jdXJyZW50ICYmIG5vZGUucGFyZW50Tm9kZSA9PT0gcHJldmlvdXNOb2RlLmN1cnJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldFNjcm9sbGFibGVBbmNlc3RvcnMobm9kZSk7XG4gIH0sIFtub2RlXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcHJldmlvdXNOb2RlLmN1cnJlbnQgPSBub2RlO1xuICB9LCBbbm9kZV0pO1xuICByZXR1cm4gYW5jZXN0b3JzO1xufVxuXG5mdW5jdGlvbiB1c2VTY3JvbGxPZmZzZXRzKGVsZW1lbnRzKSB7XG4gIGNvbnN0IFtzY3JvbGxDb29yZGluYXRlcywgc2V0U2Nyb2xsQ29vcmRpbmF0ZXNdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IHByZXZFbGVtZW50cyA9IHVzZVJlZihlbGVtZW50cyk7IC8vIFRvLWRvOiBUaHJvdHRsZSB0aGUgaGFuZGxlU2Nyb2xsIGNhbGxiYWNrXG5cbiAgY29uc3QgaGFuZGxlU2Nyb2xsID0gdXNlQ2FsbGJhY2soZXZlbnQgPT4ge1xuICAgIGNvbnN0IHNjcm9sbGluZ0VsZW1lbnQgPSBnZXRTY3JvbGxhYmxlRWxlbWVudChldmVudC50YXJnZXQpO1xuXG4gICAgaWYgKCFzY3JvbGxpbmdFbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0U2Nyb2xsQ29vcmRpbmF0ZXMoc2Nyb2xsQ29vcmRpbmF0ZXMgPT4ge1xuICAgICAgaWYgKCFzY3JvbGxDb29yZGluYXRlcykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgc2Nyb2xsQ29vcmRpbmF0ZXMuc2V0KHNjcm9sbGluZ0VsZW1lbnQsIGdldFNjcm9sbENvb3JkaW5hdGVzKHNjcm9sbGluZ0VsZW1lbnQpKTtcbiAgICAgIHJldHVybiBuZXcgTWFwKHNjcm9sbENvb3JkaW5hdGVzKTtcbiAgICB9KTtcbiAgfSwgW10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHByZXZpb3VzRWxlbWVudHMgPSBwcmV2RWxlbWVudHMuY3VycmVudDtcblxuICAgIGlmIChlbGVtZW50cyAhPT0gcHJldmlvdXNFbGVtZW50cykge1xuICAgICAgY2xlYW51cChwcmV2aW91c0VsZW1lbnRzKTtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBlbGVtZW50cy5tYXAoZWxlbWVudCA9PiB7XG4gICAgICAgIGNvbnN0IHNjcm9sbGFibGVFbGVtZW50ID0gZ2V0U2Nyb2xsYWJsZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKHNjcm9sbGFibGVFbGVtZW50KSB7XG4gICAgICAgICAgc2Nyb2xsYWJsZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsLCB7XG4gICAgICAgICAgICBwYXNzaXZlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIFtzY3JvbGxhYmxlRWxlbWVudCwgZ2V0U2Nyb2xsQ29vcmRpbmF0ZXMoc2Nyb2xsYWJsZUVsZW1lbnQpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSkuZmlsdGVyKGVudHJ5ID0+IGVudHJ5ICE9IG51bGwpO1xuICAgICAgc2V0U2Nyb2xsQ29vcmRpbmF0ZXMoZW50cmllcy5sZW5ndGggPyBuZXcgTWFwKGVudHJpZXMpIDogbnVsbCk7XG4gICAgICBwcmV2RWxlbWVudHMuY3VycmVudCA9IGVsZW1lbnRzO1xuICAgIH1cblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjbGVhbnVwKGVsZW1lbnRzKTtcbiAgICAgIGNsZWFudXAocHJldmlvdXNFbGVtZW50cyk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNsZWFudXAoZWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGNvbnN0IHNjcm9sbGFibGVFbGVtZW50ID0gZ2V0U2Nyb2xsYWJsZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIHNjcm9sbGFibGVFbGVtZW50ID09IG51bGwgPyB2b2lkIDAgOiBzY3JvbGxhYmxlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGwpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCBbaGFuZGxlU2Nyb2xsLCBlbGVtZW50c10pO1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHNjcm9sbENvb3JkaW5hdGVzID8gQXJyYXkuZnJvbShzY3JvbGxDb29yZGluYXRlcy52YWx1ZXMoKSkucmVkdWNlKChhY2MsIGNvb3JkaW5hdGVzKSA9PiBhZGQoYWNjLCBjb29yZGluYXRlcyksIGRlZmF1bHRDb29yZGluYXRlcykgOiBnZXRTY3JvbGxPZmZzZXRzKGVsZW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmYXVsdENvb3JkaW5hdGVzO1xuICB9LCBbZWxlbWVudHMsIHNjcm9sbENvb3JkaW5hdGVzXSk7XG59XG5cbmZ1bmN0aW9uIHVzZVNjcm9sbE9mZnNldHNEZWx0YShzY3JvbGxPZmZzZXRzLCBkZXBlbmRlbmNpZXMpIHtcbiAgaWYgKGRlcGVuZGVuY2llcyA9PT0gdm9pZCAwKSB7XG4gICAgZGVwZW5kZW5jaWVzID0gW107XG4gIH1cblxuICBjb25zdCBpbml0aWFsU2Nyb2xsT2Zmc2V0cyA9IHVzZVJlZihudWxsKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50ID0gbnVsbDtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBkZXBlbmRlbmNpZXMpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGhhc1Njcm9sbE9mZnNldHMgPSBzY3JvbGxPZmZzZXRzICE9PSBkZWZhdWx0Q29vcmRpbmF0ZXM7XG5cbiAgICBpZiAoaGFzU2Nyb2xsT2Zmc2V0cyAmJiAhaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCkge1xuICAgICAgaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCA9IHNjcm9sbE9mZnNldHM7XG4gICAgfVxuXG4gICAgaWYgKCFoYXNTY3JvbGxPZmZzZXRzICYmIGluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQpIHtcbiAgICAgIGluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQgPSBudWxsO1xuICAgIH1cbiAgfSwgW3Njcm9sbE9mZnNldHNdKTtcbiAgcmV0dXJuIGluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQgPyBzdWJ0cmFjdChzY3JvbGxPZmZzZXRzLCBpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50KSA6IGRlZmF1bHRDb29yZGluYXRlcztcbn1cblxuZnVuY3Rpb24gdXNlU2Vuc29yU2V0dXAoc2Vuc29ycykge1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghY2FuVXNlRE9NKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGVhcmRvd25GbnMgPSBzZW5zb3JzLm1hcChfcmVmID0+IHtcbiAgICAgIGxldCB7XG4gICAgICAgIHNlbnNvclxuICAgICAgfSA9IF9yZWY7XG4gICAgICByZXR1cm4gc2Vuc29yLnNldHVwID09IG51bGwgPyB2b2lkIDAgOiBzZW5zb3Iuc2V0dXAoKTtcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCB0ZWFyZG93biBvZiB0ZWFyZG93bkZucykge1xuICAgICAgICB0ZWFyZG93biA9PSBudWxsID8gdm9pZCAwIDogdGVhcmRvd24oKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LCAvLyBUTy1ETzogU2Vuc29ycyBsZW5ndGggY291bGQgdGhlb3JldGljYWxseSBjaGFuZ2Ugd2hpY2ggd291bGQgbm90IGJlIGEgdmFsaWQgZGVwZW5kZW5jeVxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIHNlbnNvcnMubWFwKF9yZWYyID0+IHtcbiAgICBsZXQge1xuICAgICAgc2Vuc29yXG4gICAgfSA9IF9yZWYyO1xuICAgIHJldHVybiBzZW5zb3I7XG4gIH0pKTtcbn1cblxuZnVuY3Rpb24gdXNlU3ludGhldGljTGlzdGVuZXJzKGxpc3RlbmVycywgaWQpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0ZW5lcnMucmVkdWNlKChhY2MsIF9yZWYpID0+IHtcbiAgICAgIGxldCB7XG4gICAgICAgIGV2ZW50TmFtZSxcbiAgICAgICAgaGFuZGxlclxuICAgICAgfSA9IF9yZWY7XG5cbiAgICAgIGFjY1tldmVudE5hbWVdID0gZXZlbnQgPT4ge1xuICAgICAgICBoYW5kbGVyKGV2ZW50LCBpZCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcbiAgfSwgW2xpc3RlbmVycywgaWRdKTtcbn1cblxuZnVuY3Rpb24gdXNlV2luZG93UmVjdChlbGVtZW50KSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IGVsZW1lbnQgPyBnZXRXaW5kb3dDbGllbnRSZWN0KGVsZW1lbnQpIDogbnVsbCwgW2VsZW1lbnRdKTtcbn1cblxuY29uc3QgZGVmYXVsdFZhbHVlJDIgPSBbXTtcbmZ1bmN0aW9uIHVzZVJlY3RzKGVsZW1lbnRzLCBtZWFzdXJlKSB7XG4gIGlmIChtZWFzdXJlID09PSB2b2lkIDApIHtcbiAgICBtZWFzdXJlID0gZ2V0Q2xpZW50UmVjdDtcbiAgfVxuXG4gIGNvbnN0IFtmaXJzdEVsZW1lbnRdID0gZWxlbWVudHM7XG4gIGNvbnN0IHdpbmRvd1JlY3QgPSB1c2VXaW5kb3dSZWN0KGZpcnN0RWxlbWVudCA/IGdldFdpbmRvdyhmaXJzdEVsZW1lbnQpIDogbnVsbCk7XG4gIGNvbnN0IFtyZWN0cywgc2V0UmVjdHNdID0gdXNlU3RhdGUoZGVmYXVsdFZhbHVlJDIpO1xuXG4gIGZ1bmN0aW9uIG1lYXN1cmVSZWN0cygpIHtcbiAgICBzZXRSZWN0cygoKSA9PiB7XG4gICAgICBpZiAoIWVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlJDI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlbGVtZW50cy5tYXAoZWxlbWVudCA9PiBpc0RvY3VtZW50U2Nyb2xsaW5nRWxlbWVudChlbGVtZW50KSA/IHdpbmRvd1JlY3QgOiBuZXcgUmVjdChtZWFzdXJlKGVsZW1lbnQpLCBlbGVtZW50KSk7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCByZXNpemVPYnNlcnZlciA9IHVzZVJlc2l6ZU9ic2VydmVyKHtcbiAgICBjYWxsYmFjazogbWVhc3VyZVJlY3RzXG4gIH0pO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIG1lYXN1cmVSZWN0cygpO1xuICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50KSk7XG4gIH0sIFtlbGVtZW50c10pO1xuICByZXR1cm4gcmVjdHM7XG59XG5cbmZ1bmN0aW9uIGdldE1lYXN1cmFibGVOb2RlKG5vZGUpIHtcbiAgaWYgKCFub2RlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBjb25zdCBmaXJzdENoaWxkID0gbm9kZS5jaGlsZHJlblswXTtcbiAgcmV0dXJuIGlzSFRNTEVsZW1lbnQoZmlyc3RDaGlsZCkgPyBmaXJzdENoaWxkIDogbm9kZTtcbn1cblxuZnVuY3Rpb24gdXNlRHJhZ092ZXJsYXlNZWFzdXJpbmcoX3JlZikge1xuICBsZXQge1xuICAgIG1lYXN1cmVcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IFtyZWN0LCBzZXRSZWN0XSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBoYW5kbGVSZXNpemUgPSB1c2VDYWxsYmFjayhlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IHtcbiAgICAgIHRhcmdldFxuICAgIH0gb2YgZW50cmllcykge1xuICAgICAgaWYgKGlzSFRNTEVsZW1lbnQodGFyZ2V0KSkge1xuICAgICAgICBzZXRSZWN0KHJlY3QgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld1JlY3QgPSBtZWFzdXJlKHRhcmdldCk7XG4gICAgICAgICAgcmV0dXJuIHJlY3QgPyB7IC4uLnJlY3QsXG4gICAgICAgICAgICB3aWR0aDogbmV3UmVjdC53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogbmV3UmVjdC5oZWlnaHRcbiAgICAgICAgICB9IDogbmV3UmVjdDtcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW21lYXN1cmVdKTtcbiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSB1c2VSZXNpemVPYnNlcnZlcih7XG4gICAgY2FsbGJhY2s6IGhhbmRsZVJlc2l6ZVxuICB9KTtcbiAgY29uc3QgaGFuZGxlTm9kZUNoYW5nZSA9IHVzZUNhbGxiYWNrKGVsZW1lbnQgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBnZXRNZWFzdXJhYmxlTm9kZShlbGVtZW50KTtcbiAgICByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5vYnNlcnZlKG5vZGUpO1xuICAgIH1cblxuICAgIHNldFJlY3Qobm9kZSA/IG1lYXN1cmUobm9kZSkgOiBudWxsKTtcbiAgfSwgW21lYXN1cmUsIHJlc2l6ZU9ic2VydmVyXSk7XG4gIGNvbnN0IFtub2RlUmVmLCBzZXRSZWZdID0gdXNlTm9kZVJlZihoYW5kbGVOb2RlQ2hhbmdlKTtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gKHtcbiAgICBub2RlUmVmLFxuICAgIHJlY3QsXG4gICAgc2V0UmVmXG4gIH0pLCBbcmVjdCwgbm9kZVJlZiwgc2V0UmVmXSk7XG59XG5cbmNvbnN0IGRlZmF1bHRTZW5zb3JzID0gW3tcbiAgc2Vuc29yOiBQb2ludGVyU2Vuc29yLFxuICBvcHRpb25zOiB7fVxufSwge1xuICBzZW5zb3I6IEtleWJvYXJkU2Vuc29yLFxuICBvcHRpb25zOiB7fVxufV07XG5jb25zdCBkZWZhdWx0RGF0YSA9IHtcbiAgY3VycmVudDoge31cbn07XG5jb25zdCBkZWZhdWx0TWVhc3VyaW5nQ29uZmlndXJhdGlvbiA9IHtcbiAgZHJhZ2dhYmxlOiB7XG4gICAgbWVhc3VyZTogZ2V0VHJhbnNmb3JtQWdub3N0aWNDbGllbnRSZWN0XG4gIH0sXG4gIGRyb3BwYWJsZToge1xuICAgIG1lYXN1cmU6IGdldFRyYW5zZm9ybUFnbm9zdGljQ2xpZW50UmVjdCxcbiAgICBzdHJhdGVneTogTWVhc3VyaW5nU3RyYXRlZ3kuV2hpbGVEcmFnZ2luZyxcbiAgICBmcmVxdWVuY3k6IE1lYXN1cmluZ0ZyZXF1ZW5jeS5PcHRpbWl6ZWRcbiAgfSxcbiAgZHJhZ092ZXJsYXk6IHtcbiAgICBtZWFzdXJlOiBnZXRDbGllbnRSZWN0XG4gIH1cbn07XG5cbmNsYXNzIERyb3BwYWJsZUNvbnRhaW5lcnNNYXAgZXh0ZW5kcyBNYXAge1xuICBnZXQoaWQpIHtcbiAgICB2YXIgX3N1cGVyJGdldDtcblxuICAgIHJldHVybiBpZCAhPSBudWxsID8gKF9zdXBlciRnZXQgPSBzdXBlci5nZXQoaWQpKSAhPSBudWxsID8gX3N1cGVyJGdldCA6IHVuZGVmaW5lZCA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHRvQXJyYXkoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy52YWx1ZXMoKSk7XG4gIH1cblxuICBnZXRFbmFibGVkKCkge1xuICAgIHJldHVybiB0aGlzLnRvQXJyYXkoKS5maWx0ZXIoX3JlZiA9PiB7XG4gICAgICBsZXQge1xuICAgICAgICBkaXNhYmxlZFxuICAgICAgfSA9IF9yZWY7XG4gICAgICByZXR1cm4gIWRpc2FibGVkO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Tm9kZUZvcihpZCkge1xuICAgIHZhciBfdGhpcyRnZXQkbm9kZSRjdXJyZW4sIF90aGlzJGdldDtcblxuICAgIHJldHVybiAoX3RoaXMkZ2V0JG5vZGUkY3VycmVuID0gKF90aGlzJGdldCA9IHRoaXMuZ2V0KGlkKSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGdldC5ub2RlLmN1cnJlbnQpICE9IG51bGwgPyBfdGhpcyRnZXQkbm9kZSRjdXJyZW4gOiB1bmRlZmluZWQ7XG4gIH1cblxufVxuXG5jb25zdCBkZWZhdWx0UHVibGljQ29udGV4dCA9IHtcbiAgYWN0aXZhdG9yRXZlbnQ6IG51bGwsXG4gIGFjdGl2ZTogbnVsbCxcbiAgYWN0aXZlTm9kZTogbnVsbCxcbiAgYWN0aXZlTm9kZVJlY3Q6IG51bGwsXG4gIGNvbGxpc2lvbnM6IG51bGwsXG4gIGNvbnRhaW5lck5vZGVSZWN0OiBudWxsLFxuICBkcmFnZ2FibGVOb2RlczogLyojX19QVVJFX18qL25ldyBNYXAoKSxcbiAgZHJvcHBhYmxlUmVjdHM6IC8qI19fUFVSRV9fKi9uZXcgTWFwKCksXG4gIGRyb3BwYWJsZUNvbnRhaW5lcnM6IC8qI19fUFVSRV9fKi9uZXcgRHJvcHBhYmxlQ29udGFpbmVyc01hcCgpLFxuICBvdmVyOiBudWxsLFxuICBkcmFnT3ZlcmxheToge1xuICAgIG5vZGVSZWY6IHtcbiAgICAgIGN1cnJlbnQ6IG51bGxcbiAgICB9LFxuICAgIHJlY3Q6IG51bGwsXG4gICAgc2V0UmVmOiBub29wXG4gIH0sXG4gIHNjcm9sbGFibGVBbmNlc3RvcnM6IFtdLFxuICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0czogW10sXG4gIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb246IGRlZmF1bHRNZWFzdXJpbmdDb25maWd1cmF0aW9uLFxuICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyczogbm9vcCxcbiAgd2luZG93UmVjdDogbnVsbCxcbiAgbWVhc3VyaW5nU2NoZWR1bGVkOiBmYWxzZVxufTtcbmNvbnN0IGRlZmF1bHRJbnRlcm5hbENvbnRleHQgPSB7XG4gIGFjdGl2YXRvckV2ZW50OiBudWxsLFxuICBhY3RpdmF0b3JzOiBbXSxcbiAgYWN0aXZlOiBudWxsLFxuICBhY3RpdmVOb2RlUmVjdDogbnVsbCxcbiAgYXJpYURlc2NyaWJlZEJ5SWQ6IHtcbiAgICBkcmFnZ2FibGU6ICcnXG4gIH0sXG4gIGRpc3BhdGNoOiBub29wLFxuICBkcmFnZ2FibGVOb2RlczogLyojX19QVVJFX18qL25ldyBNYXAoKSxcbiAgb3ZlcjogbnVsbCxcbiAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnM6IG5vb3Bcbn07XG5jb25zdCBJbnRlcm5hbENvbnRleHQgPSAvKiNfX1BVUkVfXyovY3JlYXRlQ29udGV4dChkZWZhdWx0SW50ZXJuYWxDb250ZXh0KTtcbmNvbnN0IFB1YmxpY0NvbnRleHQgPSAvKiNfX1BVUkVfXyovY3JlYXRlQ29udGV4dChkZWZhdWx0UHVibGljQ29udGV4dCk7XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgcmV0dXJuIHtcbiAgICBkcmFnZ2FibGU6IHtcbiAgICAgIGFjdGl2ZTogbnVsbCxcbiAgICAgIGluaXRpYWxDb29yZGluYXRlczoge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgICB9LFxuICAgICAgbm9kZXM6IG5ldyBNYXAoKSxcbiAgICAgIHRyYW5zbGF0ZToge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgICB9XG4gICAgfSxcbiAgICBkcm9wcGFibGU6IHtcbiAgICAgIGNvbnRhaW5lcnM6IG5ldyBEcm9wcGFibGVDb250YWluZXJzTWFwKClcbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiByZWR1Y2VyKHN0YXRlLCBhY3Rpb24pIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgQWN0aW9uLkRyYWdTdGFydDpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLFxuICAgICAgICBkcmFnZ2FibGU6IHsgLi4uc3RhdGUuZHJhZ2dhYmxlLFxuICAgICAgICAgIGluaXRpYWxDb29yZGluYXRlczogYWN0aW9uLmluaXRpYWxDb29yZGluYXRlcyxcbiAgICAgICAgICBhY3RpdmU6IGFjdGlvbi5hY3RpdmVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgIGNhc2UgQWN0aW9uLkRyYWdNb3ZlOlxuICAgICAgaWYgKHN0YXRlLmRyYWdnYWJsZS5hY3RpdmUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLFxuICAgICAgICBkcmFnZ2FibGU6IHsgLi4uc3RhdGUuZHJhZ2dhYmxlLFxuICAgICAgICAgIHRyYW5zbGF0ZToge1xuICAgICAgICAgICAgeDogYWN0aW9uLmNvb3JkaW5hdGVzLnggLSBzdGF0ZS5kcmFnZ2FibGUuaW5pdGlhbENvb3JkaW5hdGVzLngsXG4gICAgICAgICAgICB5OiBhY3Rpb24uY29vcmRpbmF0ZXMueSAtIHN0YXRlLmRyYWdnYWJsZS5pbml0aWFsQ29vcmRpbmF0ZXMueVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgIGNhc2UgQWN0aW9uLkRyYWdFbmQ6XG4gICAgY2FzZSBBY3Rpb24uRHJhZ0NhbmNlbDpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLFxuICAgICAgICBkcmFnZ2FibGU6IHsgLi4uc3RhdGUuZHJhZ2dhYmxlLFxuICAgICAgICAgIGFjdGl2ZTogbnVsbCxcbiAgICAgICAgICBpbml0aWFsQ29vcmRpbmF0ZXM6IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0cmFuc2xhdGU6IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgY2FzZSBBY3Rpb24uUmVnaXN0ZXJEcm9wcGFibGU6XG4gICAgICB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBlbGVtZW50XG4gICAgICAgIH0gPSBhY3Rpb247XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBpZFxuICAgICAgICB9ID0gZWxlbWVudDtcbiAgICAgICAgY29uc3QgY29udGFpbmVycyA9IG5ldyBEcm9wcGFibGVDb250YWluZXJzTWFwKHN0YXRlLmRyb3BwYWJsZS5jb250YWluZXJzKTtcbiAgICAgICAgY29udGFpbmVycy5zZXQoaWQsIGVsZW1lbnQpO1xuICAgICAgICByZXR1cm4geyAuLi5zdGF0ZSxcbiAgICAgICAgICBkcm9wcGFibGU6IHsgLi4uc3RhdGUuZHJvcHBhYmxlLFxuICAgICAgICAgICAgY29udGFpbmVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgIGNhc2UgQWN0aW9uLlNldERyb3BwYWJsZURpc2FibGVkOlxuICAgICAge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAga2V5LFxuICAgICAgICAgIGRpc2FibGVkXG4gICAgICAgIH0gPSBhY3Rpb247XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdGF0ZS5kcm9wcGFibGUuY29udGFpbmVycy5nZXQoaWQpO1xuXG4gICAgICAgIGlmICghZWxlbWVudCB8fCBrZXkgIT09IGVsZW1lbnQua2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGFpbmVycyA9IG5ldyBEcm9wcGFibGVDb250YWluZXJzTWFwKHN0YXRlLmRyb3BwYWJsZS5jb250YWluZXJzKTtcbiAgICAgICAgY29udGFpbmVycy5zZXQoaWQsIHsgLi4uZWxlbWVudCxcbiAgICAgICAgICBkaXNhYmxlZFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsXG4gICAgICAgICAgZHJvcHBhYmxlOiB7IC4uLnN0YXRlLmRyb3BwYWJsZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnNcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICBjYXNlIEFjdGlvbi5VbnJlZ2lzdGVyRHJvcHBhYmxlOlxuICAgICAge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAga2V5XG4gICAgICAgIH0gPSBhY3Rpb247XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdGF0ZS5kcm9wcGFibGUuY29udGFpbmVycy5nZXQoaWQpO1xuXG4gICAgICAgIGlmICghZWxlbWVudCB8fCBrZXkgIT09IGVsZW1lbnQua2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGFpbmVycyA9IG5ldyBEcm9wcGFibGVDb250YWluZXJzTWFwKHN0YXRlLmRyb3BwYWJsZS5jb250YWluZXJzKTtcbiAgICAgICAgY29udGFpbmVycy5kZWxldGUoaWQpO1xuICAgICAgICByZXR1cm4geyAuLi5zdGF0ZSxcbiAgICAgICAgICBkcm9wcGFibGU6IHsgLi4uc3RhdGUuZHJvcHBhYmxlLFxuICAgICAgICAgICAgY29udGFpbmVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgIGRlZmF1bHQ6XG4gICAgICB7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBSZXN0b3JlRm9jdXMoX3JlZikge1xuICBsZXQge1xuICAgIGRpc2FibGVkXG4gIH0gPSBfcmVmO1xuICBjb25zdCB7XG4gICAgYWN0aXZlLFxuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGRyYWdnYWJsZU5vZGVzXG4gIH0gPSB1c2VDb250ZXh0KEludGVybmFsQ29udGV4dCk7XG4gIGNvbnN0IHByZXZpb3VzQWN0aXZhdG9yRXZlbnQgPSB1c2VQcmV2aW91cyhhY3RpdmF0b3JFdmVudCk7XG4gIGNvbnN0IHByZXZpb3VzQWN0aXZlSWQgPSB1c2VQcmV2aW91cyhhY3RpdmUgPT0gbnVsbCA/IHZvaWQgMCA6IGFjdGl2ZS5pZCk7IC8vIFJlc3RvcmUga2V5Ym9hcmQgZm9jdXMgb24gdGhlIGFjdGl2YXRvciBub2RlXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWFjdGl2YXRvckV2ZW50ICYmIHByZXZpb3VzQWN0aXZhdG9yRXZlbnQgJiYgcHJldmlvdXNBY3RpdmVJZCAhPSBudWxsKSB7XG4gICAgICBpZiAoIWlzS2V5Ym9hcmRFdmVudChwcmV2aW91c0FjdGl2YXRvckV2ZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBwcmV2aW91c0FjdGl2YXRvckV2ZW50LnRhcmdldCkge1xuICAgICAgICAvLyBObyBuZWVkIHRvIHJlc3RvcmUgZm9jdXNcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkcmFnZ2FibGVOb2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KHByZXZpb3VzQWN0aXZlSWQpO1xuXG4gICAgICBpZiAoIWRyYWdnYWJsZU5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIGFjdGl2YXRvck5vZGUsXG4gICAgICAgIG5vZGVcbiAgICAgIH0gPSBkcmFnZ2FibGVOb2RlO1xuXG4gICAgICBpZiAoIWFjdGl2YXRvck5vZGUuY3VycmVudCAmJiAhbm9kZS5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIFthY3RpdmF0b3JOb2RlLmN1cnJlbnQsIG5vZGUuY3VycmVudF0pIHtcbiAgICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGZvY3VzYWJsZU5vZGUgPSBmaW5kRmlyc3RGb2N1c2FibGVOb2RlKGVsZW1lbnQpO1xuXG4gICAgICAgICAgaWYgKGZvY3VzYWJsZU5vZGUpIHtcbiAgICAgICAgICAgIGZvY3VzYWJsZU5vZGUuZm9jdXMoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LCBbYWN0aXZhdG9yRXZlbnQsIGRpc2FibGVkLCBkcmFnZ2FibGVOb2RlcywgcHJldmlvdXNBY3RpdmVJZCwgcHJldmlvdXNBY3RpdmF0b3JFdmVudF0pO1xuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gYXBwbHlNb2RpZmllcnMobW9kaWZpZXJzLCBfcmVmKSB7XG4gIGxldCB7XG4gICAgdHJhbnNmb3JtLFxuICAgIC4uLmFyZ3NcbiAgfSA9IF9yZWY7XG4gIHJldHVybiBtb2RpZmllcnMgIT0gbnVsbCAmJiBtb2RpZmllcnMubGVuZ3RoID8gbW9kaWZpZXJzLnJlZHVjZSgoYWNjdW11bGF0b3IsIG1vZGlmaWVyKSA9PiB7XG4gICAgcmV0dXJuIG1vZGlmaWVyKHtcbiAgICAgIHRyYW5zZm9ybTogYWNjdW11bGF0b3IsXG4gICAgICAuLi5hcmdzXG4gICAgfSk7XG4gIH0sIHRyYW5zZm9ybSkgOiB0cmFuc2Zvcm07XG59XG5cbmZ1bmN0aW9uIHVzZU1lYXN1cmluZ0NvbmZpZ3VyYXRpb24oY29uZmlnKSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+ICh7XG4gICAgZHJhZ2dhYmxlOiB7IC4uLmRlZmF1bHRNZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdnYWJsZSxcbiAgICAgIC4uLihjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5kcmFnZ2FibGUpXG4gICAgfSxcbiAgICBkcm9wcGFibGU6IHsgLi4uZGVmYXVsdE1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJvcHBhYmxlLFxuICAgICAgLi4uKGNvbmZpZyA9PSBudWxsID8gdm9pZCAwIDogY29uZmlnLmRyb3BwYWJsZSlcbiAgICB9LFxuICAgIGRyYWdPdmVybGF5OiB7IC4uLmRlZmF1bHRNZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdPdmVybGF5LFxuICAgICAgLi4uKGNvbmZpZyA9PSBudWxsID8gdm9pZCAwIDogY29uZmlnLmRyYWdPdmVybGF5KVxuICAgIH1cbiAgfSksIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2NvbmZpZyA9PSBudWxsID8gdm9pZCAwIDogY29uZmlnLmRyYWdnYWJsZSwgY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcuZHJvcHBhYmxlLCBjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5kcmFnT3ZlcmxheV0pO1xufVxuXG5mdW5jdGlvbiB1c2VMYXlvdXRTaGlmdFNjcm9sbENvbXBlbnNhdGlvbihfcmVmKSB7XG4gIGxldCB7XG4gICAgYWN0aXZlTm9kZSxcbiAgICBtZWFzdXJlLFxuICAgIGluaXRpYWxSZWN0LFxuICAgIGNvbmZpZyA9IHRydWVcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGluaXRpYWxpemVkID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3Qge1xuICAgIHgsXG4gICAgeVxuICB9ID0gdHlwZW9mIGNvbmZpZyA9PT0gJ2Jvb2xlYW4nID8ge1xuICAgIHg6IGNvbmZpZyxcbiAgICB5OiBjb25maWdcbiAgfSA6IGNvbmZpZztcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZGlzYWJsZWQgPSAheCAmJiAheTtcblxuICAgIGlmIChkaXNhYmxlZCB8fCAhYWN0aXZlTm9kZSkge1xuICAgICAgaW5pdGlhbGl6ZWQuY3VycmVudCA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChpbml0aWFsaXplZC5jdXJyZW50IHx8ICFpbml0aWFsUmVjdCkge1xuICAgICAgLy8gUmV0dXJuIGVhcmx5IGlmIGxheW91dCBzaGlmdCBzY3JvbGwgY29tcGVuc2F0aW9uIHdhcyBhbHJlYWR5IGF0dGVtcHRlZFxuICAgICAgLy8gb3IgaWYgdGhlcmUgaXMgbm8gaW5pdGlhbFJlY3QgdG8gY29tcGFyZSB0by5cbiAgICAgIHJldHVybjtcbiAgICB9IC8vIEdldCB0aGUgbW9zdCB1cCB0byBkYXRlIG5vZGUgcmVmIGZvciB0aGUgYWN0aXZlIGRyYWdnYWJsZVxuXG5cbiAgICBjb25zdCBub2RlID0gYWN0aXZlTm9kZSA9PSBudWxsID8gdm9pZCAwIDogYWN0aXZlTm9kZS5ub2RlLmN1cnJlbnQ7XG5cbiAgICBpZiAoIW5vZGUgfHwgbm9kZS5pc0Nvbm5lY3RlZCA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIFJldHVybiBlYXJseSBpZiB0aGVyZSBpcyBubyBhdHRhY2hlZCBub2RlIHJlZiBvciBpZiB0aGUgbm9kZSBpc1xuICAgICAgLy8gZGlzY29ubmVjdGVkIGZyb20gdGhlIGRvY3VtZW50LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY3QgPSBtZWFzdXJlKG5vZGUpO1xuICAgIGNvbnN0IHJlY3REZWx0YSA9IGdldFJlY3REZWx0YShyZWN0LCBpbml0aWFsUmVjdCk7XG5cbiAgICBpZiAoIXgpIHtcbiAgICAgIHJlY3REZWx0YS54ID0gMDtcbiAgICB9XG5cbiAgICBpZiAoIXkpIHtcbiAgICAgIHJlY3REZWx0YS55ID0gMDtcbiAgICB9IC8vIE9ubHkgcGVyZm9ybSBsYXlvdXQgc2hpZnQgc2Nyb2xsIGNvbXBlbnNhdGlvbiBvbmNlXG5cblxuICAgIGluaXRpYWxpemVkLmN1cnJlbnQgPSB0cnVlO1xuXG4gICAgaWYgKE1hdGguYWJzKHJlY3REZWx0YS54KSA+IDAgfHwgTWF0aC5hYnMocmVjdERlbHRhLnkpID4gMCkge1xuICAgICAgY29uc3QgZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IgPSBnZXRGaXJzdFNjcm9sbGFibGVBbmNlc3Rvcihub2RlKTtcblxuICAgICAgaWYgKGZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yKSB7XG4gICAgICAgIGZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yLnNjcm9sbEJ5KHtcbiAgICAgICAgICB0b3A6IHJlY3REZWx0YS55LFxuICAgICAgICAgIGxlZnQ6IHJlY3REZWx0YS54XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwgW2FjdGl2ZU5vZGUsIHgsIHksIGluaXRpYWxSZWN0LCBtZWFzdXJlXSk7XG59XG5cbmNvbnN0IEFjdGl2ZURyYWdnYWJsZUNvbnRleHQgPSAvKiNfX1BVUkVfXyovY3JlYXRlQ29udGV4dCh7IC4uLmRlZmF1bHRDb29yZGluYXRlcyxcbiAgc2NhbGVYOiAxLFxuICBzY2FsZVk6IDFcbn0pO1xudmFyIFN0YXR1cztcblxuKGZ1bmN0aW9uIChTdGF0dXMpIHtcbiAgU3RhdHVzW1N0YXR1c1tcIlVuaW5pdGlhbGl6ZWRcIl0gPSAwXSA9IFwiVW5pbml0aWFsaXplZFwiO1xuICBTdGF0dXNbU3RhdHVzW1wiSW5pdGlhbGl6aW5nXCJdID0gMV0gPSBcIkluaXRpYWxpemluZ1wiO1xuICBTdGF0dXNbU3RhdHVzW1wiSW5pdGlhbGl6ZWRcIl0gPSAyXSA9IFwiSW5pdGlhbGl6ZWRcIjtcbn0pKFN0YXR1cyB8fCAoU3RhdHVzID0ge30pKTtcblxuY29uc3QgRG5kQ29udGV4dCA9IC8qI19fUFVSRV9fKi9tZW1vKGZ1bmN0aW9uIERuZENvbnRleHQoX3JlZikge1xuICB2YXIgX3NlbnNvckNvbnRleHQkY3VycmVuLCBfZHJhZ092ZXJsYXkkbm9kZVJlZiQsIF9kcmFnT3ZlcmxheSRyZWN0LCBfb3ZlciRyZWN0O1xuXG4gIGxldCB7XG4gICAgaWQsXG4gICAgYWNjZXNzaWJpbGl0eSxcbiAgICBhdXRvU2Nyb2xsID0gdHJ1ZSxcbiAgICBjaGlsZHJlbixcbiAgICBzZW5zb3JzID0gZGVmYXVsdFNlbnNvcnMsXG4gICAgY29sbGlzaW9uRGV0ZWN0aW9uID0gcmVjdEludGVyc2VjdGlvbixcbiAgICBtZWFzdXJpbmcsXG4gICAgbW9kaWZpZXJzLFxuICAgIC4uLnByb3BzXG4gIH0gPSBfcmVmO1xuICBjb25zdCBzdG9yZSA9IHVzZVJlZHVjZXIocmVkdWNlciwgdW5kZWZpbmVkLCBnZXRJbml0aWFsU3RhdGUpO1xuICBjb25zdCBbc3RhdGUsIGRpc3BhdGNoXSA9IHN0b3JlO1xuICBjb25zdCBbZGlzcGF0Y2hNb25pdG9yRXZlbnQsIHJlZ2lzdGVyTW9uaXRvckxpc3RlbmVyXSA9IHVzZURuZE1vbml0b3JQcm92aWRlcigpO1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGUoU3RhdHVzLlVuaW5pdGlhbGl6ZWQpO1xuICBjb25zdCBpc0luaXRpYWxpemVkID0gc3RhdHVzID09PSBTdGF0dXMuSW5pdGlhbGl6ZWQ7XG4gIGNvbnN0IHtcbiAgICBkcmFnZ2FibGU6IHtcbiAgICAgIGFjdGl2ZTogYWN0aXZlSWQsXG4gICAgICBub2RlczogZHJhZ2dhYmxlTm9kZXMsXG4gICAgICB0cmFuc2xhdGVcbiAgICB9LFxuICAgIGRyb3BwYWJsZToge1xuICAgICAgY29udGFpbmVyczogZHJvcHBhYmxlQ29udGFpbmVyc1xuICAgIH1cbiAgfSA9IHN0YXRlO1xuICBjb25zdCBub2RlID0gYWN0aXZlSWQgIT0gbnVsbCA/IGRyYWdnYWJsZU5vZGVzLmdldChhY3RpdmVJZCkgOiBudWxsO1xuICBjb25zdCBhY3RpdmVSZWN0cyA9IHVzZVJlZih7XG4gICAgaW5pdGlhbDogbnVsbCxcbiAgICB0cmFuc2xhdGVkOiBudWxsXG4gIH0pO1xuICBjb25zdCBhY3RpdmUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICB2YXIgX25vZGUkZGF0YTtcblxuICAgIHJldHVybiBhY3RpdmVJZCAhPSBudWxsID8ge1xuICAgICAgaWQ6IGFjdGl2ZUlkLFxuICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIGFjdGl2ZSBub2RlIHRvIHVubW91bnQgd2hpbGUgZHJhZ2dpbmdcbiAgICAgIGRhdGE6IChfbm9kZSRkYXRhID0gbm9kZSA9PSBudWxsID8gdm9pZCAwIDogbm9kZS5kYXRhKSAhPSBudWxsID8gX25vZGUkZGF0YSA6IGRlZmF1bHREYXRhLFxuICAgICAgcmVjdDogYWN0aXZlUmVjdHNcbiAgICB9IDogbnVsbDtcbiAgfSwgW2FjdGl2ZUlkLCBub2RlXSk7XG4gIGNvbnN0IGFjdGl2ZVJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgW2FjdGl2ZVNlbnNvciwgc2V0QWN0aXZlU2Vuc29yXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbYWN0aXZhdG9yRXZlbnQsIHNldEFjdGl2YXRvckV2ZW50XSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBsYXRlc3RQcm9wcyA9IHVzZUxhdGVzdFZhbHVlKHByb3BzLCBPYmplY3QudmFsdWVzKHByb3BzKSk7XG4gIGNvbnN0IGRyYWdnYWJsZURlc2NyaWJlZEJ5SWQgPSB1c2VVbmlxdWVJZChcIkRuZERlc2NyaWJlZEJ5XCIsIGlkKTtcbiAgY29uc3QgZW5hYmxlZERyb3BwYWJsZUNvbnRhaW5lcnMgPSB1c2VNZW1vKCgpID0+IGRyb3BwYWJsZUNvbnRhaW5lcnMuZ2V0RW5hYmxlZCgpLCBbZHJvcHBhYmxlQ29udGFpbmVyc10pO1xuICBjb25zdCBtZWFzdXJpbmdDb25maWd1cmF0aW9uID0gdXNlTWVhc3VyaW5nQ29uZmlndXJhdGlvbihtZWFzdXJpbmcpO1xuICBjb25zdCB7XG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgbWVhc3VyaW5nU2NoZWR1bGVkXG4gIH0gPSB1c2VEcm9wcGFibGVNZWFzdXJpbmcoZW5hYmxlZERyb3BwYWJsZUNvbnRhaW5lcnMsIHtcbiAgICBkcmFnZ2luZzogaXNJbml0aWFsaXplZCxcbiAgICBkZXBlbmRlbmNpZXM6IFt0cmFuc2xhdGUueCwgdHJhbnNsYXRlLnldLFxuICAgIGNvbmZpZzogbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcm9wcGFibGVcbiAgfSk7XG4gIGNvbnN0IGFjdGl2ZU5vZGUgPSB1c2VDYWNoZWROb2RlKGRyYWdnYWJsZU5vZGVzLCBhY3RpdmVJZCk7XG4gIGNvbnN0IGFjdGl2YXRpb25Db29yZGluYXRlcyA9IHVzZU1lbW8oKCkgPT4gYWN0aXZhdG9yRXZlbnQgPyBnZXRFdmVudENvb3JkaW5hdGVzKGFjdGl2YXRvckV2ZW50KSA6IG51bGwsIFthY3RpdmF0b3JFdmVudF0pO1xuICBjb25zdCBhdXRvU2Nyb2xsT3B0aW9ucyA9IGdldEF1dG9TY3JvbGxlck9wdGlvbnMoKTtcbiAgY29uc3QgaW5pdGlhbEFjdGl2ZU5vZGVSZWN0ID0gdXNlSW5pdGlhbFJlY3QoYWN0aXZlTm9kZSwgbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnZ2FibGUubWVhc3VyZSk7XG4gIHVzZUxheW91dFNoaWZ0U2Nyb2xsQ29tcGVuc2F0aW9uKHtcbiAgICBhY3RpdmVOb2RlOiBhY3RpdmVJZCAhPSBudWxsID8gZHJhZ2dhYmxlTm9kZXMuZ2V0KGFjdGl2ZUlkKSA6IG51bGwsXG4gICAgY29uZmlnOiBhdXRvU2Nyb2xsT3B0aW9ucy5sYXlvdXRTaGlmdENvbXBlbnNhdGlvbixcbiAgICBpbml0aWFsUmVjdDogaW5pdGlhbEFjdGl2ZU5vZGVSZWN0LFxuICAgIG1lYXN1cmU6IG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ2dhYmxlLm1lYXN1cmVcbiAgfSk7XG4gIGNvbnN0IGFjdGl2ZU5vZGVSZWN0ID0gdXNlUmVjdChhY3RpdmVOb2RlLCBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdnYWJsZS5tZWFzdXJlLCBpbml0aWFsQWN0aXZlTm9kZVJlY3QpO1xuICBjb25zdCBjb250YWluZXJOb2RlUmVjdCA9IHVzZVJlY3QoYWN0aXZlTm9kZSA/IGFjdGl2ZU5vZGUucGFyZW50RWxlbWVudCA6IG51bGwpO1xuICBjb25zdCBzZW5zb3JDb250ZXh0ID0gdXNlUmVmKHtcbiAgICBhY3RpdmF0b3JFdmVudDogbnVsbCxcbiAgICBhY3RpdmU6IG51bGwsXG4gICAgYWN0aXZlTm9kZSxcbiAgICBjb2xsaXNpb25SZWN0OiBudWxsLFxuICAgIGNvbGxpc2lvbnM6IG51bGwsXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgZHJhZ2dpbmdOb2RlOiBudWxsLFxuICAgIGRyYWdnaW5nTm9kZVJlY3Q6IG51bGwsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBvdmVyOiBudWxsLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvcnM6IFtdLFxuICAgIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlOiBudWxsXG4gIH0pO1xuICBjb25zdCBvdmVyTm9kZSA9IGRyb3BwYWJsZUNvbnRhaW5lcnMuZ2V0Tm9kZUZvcigoX3NlbnNvckNvbnRleHQkY3VycmVuID0gc2Vuc29yQ29udGV4dC5jdXJyZW50Lm92ZXIpID09IG51bGwgPyB2b2lkIDAgOiBfc2Vuc29yQ29udGV4dCRjdXJyZW4uaWQpO1xuICBjb25zdCBkcmFnT3ZlcmxheSA9IHVzZURyYWdPdmVybGF5TWVhc3VyaW5nKHtcbiAgICBtZWFzdXJlOiBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdPdmVybGF5Lm1lYXN1cmVcbiAgfSk7IC8vIFVzZSB0aGUgcmVjdCBvZiB0aGUgZHJhZyBvdmVybGF5IGlmIGl0IGlzIG1vdW50ZWRcblxuICBjb25zdCBkcmFnZ2luZ05vZGUgPSAoX2RyYWdPdmVybGF5JG5vZGVSZWYkID0gZHJhZ092ZXJsYXkubm9kZVJlZi5jdXJyZW50KSAhPSBudWxsID8gX2RyYWdPdmVybGF5JG5vZGVSZWYkIDogYWN0aXZlTm9kZTtcbiAgY29uc3QgZHJhZ2dpbmdOb2RlUmVjdCA9IGlzSW5pdGlhbGl6ZWQgPyAoX2RyYWdPdmVybGF5JHJlY3QgPSBkcmFnT3ZlcmxheS5yZWN0KSAhPSBudWxsID8gX2RyYWdPdmVybGF5JHJlY3QgOiBhY3RpdmVOb2RlUmVjdCA6IG51bGw7XG4gIGNvbnN0IHVzZXNEcmFnT3ZlcmxheSA9IEJvb2xlYW4oZHJhZ092ZXJsYXkubm9kZVJlZi5jdXJyZW50ICYmIGRyYWdPdmVybGF5LnJlY3QpOyAvLyBUaGUgZGVsdGEgYmV0d2VlbiB0aGUgcHJldmlvdXMgYW5kIG5ldyBwb3NpdGlvbiBvZiB0aGUgZHJhZ2dhYmxlIG5vZGVcbiAgLy8gaXMgb25seSByZWxldmFudCB3aGVuIHRoZXJlIGlzIG5vIGRyYWcgb3ZlcmxheVxuXG4gIGNvbnN0IG5vZGVSZWN0RGVsdGEgPSB1c2VSZWN0RGVsdGEodXNlc0RyYWdPdmVybGF5ID8gbnVsbCA6IGFjdGl2ZU5vZGVSZWN0KTsgLy8gR2V0IHRoZSB3aW5kb3cgcmVjdCBvZiB0aGUgZHJhZ2dpbmcgbm9kZVxuXG4gIGNvbnN0IHdpbmRvd1JlY3QgPSB1c2VXaW5kb3dSZWN0KGRyYWdnaW5nTm9kZSA/IGdldFdpbmRvdyhkcmFnZ2luZ05vZGUpIDogbnVsbCk7IC8vIEdldCBzY3JvbGxhYmxlIGFuY2VzdG9ycyBvZiB0aGUgZHJhZ2dpbmcgbm9kZVxuXG4gIGNvbnN0IHNjcm9sbGFibGVBbmNlc3RvcnMgPSB1c2VTY3JvbGxhYmxlQW5jZXN0b3JzKGlzSW5pdGlhbGl6ZWQgPyBvdmVyTm9kZSAhPSBudWxsID8gb3Zlck5vZGUgOiBhY3RpdmVOb2RlIDogbnVsbCk7XG4gIGNvbnN0IHNjcm9sbGFibGVBbmNlc3RvclJlY3RzID0gdXNlUmVjdHMoc2Nyb2xsYWJsZUFuY2VzdG9ycyk7IC8vIEFwcGx5IG1vZGlmaWVyc1xuXG4gIGNvbnN0IG1vZGlmaWVkVHJhbnNsYXRlID0gYXBwbHlNb2RpZmllcnMobW9kaWZpZXJzLCB7XG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICB4OiB0cmFuc2xhdGUueCAtIG5vZGVSZWN0RGVsdGEueCxcbiAgICAgIHk6IHRyYW5zbGF0ZS55IC0gbm9kZVJlY3REZWx0YS55LFxuICAgICAgc2NhbGVYOiAxLFxuICAgICAgc2NhbGVZOiAxXG4gICAgfSxcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgY29udGFpbmVyTm9kZVJlY3QsXG4gICAgZHJhZ2dpbmdOb2RlUmVjdCxcbiAgICBvdmVyOiBzZW5zb3JDb250ZXh0LmN1cnJlbnQub3ZlcixcbiAgICBvdmVybGF5Tm9kZVJlY3Q6IGRyYWdPdmVybGF5LnJlY3QsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cyxcbiAgICB3aW5kb3dSZWN0XG4gIH0pO1xuICBjb25zdCBwb2ludGVyQ29vcmRpbmF0ZXMgPSBhY3RpdmF0aW9uQ29vcmRpbmF0ZXMgPyBhZGQoYWN0aXZhdGlvbkNvb3JkaW5hdGVzLCB0cmFuc2xhdGUpIDogbnVsbDtcbiAgY29uc3Qgc2Nyb2xsT2Zmc2V0cyA9IHVzZVNjcm9sbE9mZnNldHMoc2Nyb2xsYWJsZUFuY2VzdG9ycyk7IC8vIFJlcHJlc2VudHMgdGhlIHNjcm9sbCBkZWx0YSBzaW5jZSBkcmFnZ2luZyB3YXMgaW5pdGlhdGVkXG5cbiAgY29uc3Qgc2Nyb2xsQWRqdXN0bWVudCA9IHVzZVNjcm9sbE9mZnNldHNEZWx0YShzY3JvbGxPZmZzZXRzKTsgLy8gUmVwcmVzZW50cyB0aGUgc2Nyb2xsIGRlbHRhIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGFjdGl2ZSBub2RlIHJlY3Qgd2FzIG1lYXN1cmVkXG5cbiAgY29uc3QgYWN0aXZlTm9kZVNjcm9sbERlbHRhID0gdXNlU2Nyb2xsT2Zmc2V0c0RlbHRhKHNjcm9sbE9mZnNldHMsIFthY3RpdmVOb2RlUmVjdF0pO1xuICBjb25zdCBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZSA9IGFkZChtb2RpZmllZFRyYW5zbGF0ZSwgc2Nyb2xsQWRqdXN0bWVudCk7XG4gIGNvbnN0IGNvbGxpc2lvblJlY3QgPSBkcmFnZ2luZ05vZGVSZWN0ID8gZ2V0QWRqdXN0ZWRSZWN0KGRyYWdnaW5nTm9kZVJlY3QsIG1vZGlmaWVkVHJhbnNsYXRlKSA6IG51bGw7XG4gIGNvbnN0IGNvbGxpc2lvbnMgPSBhY3RpdmUgJiYgY29sbGlzaW9uUmVjdCA/IGNvbGxpc2lvbkRldGVjdGlvbih7XG4gICAgYWN0aXZlLFxuICAgIGNvbGxpc2lvblJlY3QsXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVyczogZW5hYmxlZERyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgcG9pbnRlckNvb3JkaW5hdGVzXG4gIH0pIDogbnVsbDtcbiAgY29uc3Qgb3ZlcklkID0gZ2V0Rmlyc3RDb2xsaXNpb24oY29sbGlzaW9ucywgJ2lkJyk7XG4gIGNvbnN0IFtvdmVyLCBzZXRPdmVyXSA9IHVzZVN0YXRlKG51bGwpOyAvLyBXaGVuIHRoZXJlIGlzIG5vIGRyYWcgb3ZlcmxheSB1c2VkLCB3ZSBuZWVkIHRvIGFjY291bnQgZm9yIHRoZVxuICAvLyB3aW5kb3cgc2Nyb2xsIGRlbHRhXG5cbiAgY29uc3QgYXBwbGllZFRyYW5zbGF0ZSA9IHVzZXNEcmFnT3ZlcmxheSA/IG1vZGlmaWVkVHJhbnNsYXRlIDogYWRkKG1vZGlmaWVkVHJhbnNsYXRlLCBhY3RpdmVOb2RlU2Nyb2xsRGVsdGEpO1xuICBjb25zdCB0cmFuc2Zvcm0gPSBhZGp1c3RTY2FsZShhcHBsaWVkVHJhbnNsYXRlLCAoX292ZXIkcmVjdCA9IG92ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG92ZXIucmVjdCkgIT0gbnVsbCA/IF9vdmVyJHJlY3QgOiBudWxsLCBhY3RpdmVOb2RlUmVjdCk7XG4gIGNvbnN0IGFjdGl2ZVNlbnNvclJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgaW5zdGFudGlhdGVTZW5zb3IgPSB1c2VDYWxsYmFjaygoZXZlbnQsIF9yZWYyKSA9PiB7XG4gICAgbGV0IHtcbiAgICAgIHNlbnNvcjogU2Vuc29yLFxuICAgICAgb3B0aW9uc1xuICAgIH0gPSBfcmVmMjtcblxuICAgIGlmIChhY3RpdmVSZWYuY3VycmVudCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlTm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChhY3RpdmVSZWYuY3VycmVudCk7XG5cbiAgICBpZiAoIWFjdGl2ZU5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmF0b3JFdmVudCA9IGV2ZW50Lm5hdGl2ZUV2ZW50O1xuICAgIGNvbnN0IHNlbnNvckluc3RhbmNlID0gbmV3IFNlbnNvcih7XG4gICAgICBhY3RpdmU6IGFjdGl2ZVJlZi5jdXJyZW50LFxuICAgICAgYWN0aXZlTm9kZSxcbiAgICAgIGV2ZW50OiBhY3RpdmF0b3JFdmVudCxcbiAgICAgIG9wdGlvbnMsXG4gICAgICAvLyBTZW5zb3JzIG5lZWQgdG8gYmUgaW5zdGFudGlhdGVkIHdpdGggcmVmcyBmb3IgYXJndW1lbnRzIHRoYXQgY2hhbmdlIG92ZXIgdGltZVxuICAgICAgLy8gb3RoZXJ3aXNlIHRoZXkgYXJlIGZyb3plbiBpbiB0aW1lIHdpdGggdGhlIHN0YWxlIGFyZ3VtZW50c1xuICAgICAgY29udGV4dDogc2Vuc29yQ29udGV4dCxcblxuICAgICAgb25BYm9ydChpZCkge1xuICAgICAgICBjb25zdCBkcmFnZ2FibGVOb2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWRyYWdnYWJsZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgb25EcmFnQWJvcnRcbiAgICAgICAgfSA9IGxhdGVzdFByb3BzLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICAgIGlkXG4gICAgICAgIH07XG4gICAgICAgIG9uRHJhZ0Fib3J0ID09IG51bGwgPyB2b2lkIDAgOiBvbkRyYWdBYm9ydChldmVudCk7XG4gICAgICAgIGRpc3BhdGNoTW9uaXRvckV2ZW50KHtcbiAgICAgICAgICB0eXBlOiAnb25EcmFnQWJvcnQnLFxuICAgICAgICAgIGV2ZW50XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgb25QZW5kaW5nKGlkLCBjb25zdHJhaW50LCBpbml0aWFsQ29vcmRpbmF0ZXMsIG9mZnNldCkge1xuICAgICAgICBjb25zdCBkcmFnZ2FibGVOb2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWRyYWdnYWJsZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgb25EcmFnUGVuZGluZ1xuICAgICAgICB9ID0gbGF0ZXN0UHJvcHMuY3VycmVudDtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29uc3RyYWludCxcbiAgICAgICAgICBpbml0aWFsQ29vcmRpbmF0ZXMsXG4gICAgICAgICAgb2Zmc2V0XG4gICAgICAgIH07XG4gICAgICAgIG9uRHJhZ1BlbmRpbmcgPT0gbnVsbCA/IHZvaWQgMCA6IG9uRHJhZ1BlbmRpbmcoZXZlbnQpO1xuICAgICAgICBkaXNwYXRjaE1vbml0b3JFdmVudCh7XG4gICAgICAgICAgdHlwZTogJ29uRHJhZ1BlbmRpbmcnLFxuICAgICAgICAgIGV2ZW50XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgb25TdGFydChpbml0aWFsQ29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3QgaWQgPSBhY3RpdmVSZWYuY3VycmVudDtcblxuICAgICAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZU5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoaWQpO1xuXG4gICAgICAgIGlmICghZHJhZ2dhYmxlTm9kZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBvbkRyYWdTdGFydFxuICAgICAgICB9ID0gbGF0ZXN0UHJvcHMuY3VycmVudDtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGRhdGE6IGRyYWdnYWJsZU5vZGUuZGF0YSxcbiAgICAgICAgICAgIHJlY3Q6IGFjdGl2ZVJlY3RzXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB1bnN0YWJsZV9iYXRjaGVkVXBkYXRlcygoKSA9PiB7XG4gICAgICAgICAgb25EcmFnU3RhcnQgPT0gbnVsbCA/IHZvaWQgMCA6IG9uRHJhZ1N0YXJ0KGV2ZW50KTtcbiAgICAgICAgICBzZXRTdGF0dXMoU3RhdHVzLkluaXRpYWxpemluZyk7XG4gICAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogQWN0aW9uLkRyYWdTdGFydCxcbiAgICAgICAgICAgIGluaXRpYWxDb29yZGluYXRlcyxcbiAgICAgICAgICAgIGFjdGl2ZTogaWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBkaXNwYXRjaE1vbml0b3JFdmVudCh7XG4gICAgICAgICAgICB0eXBlOiAnb25EcmFnU3RhcnQnLFxuICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzZXRBY3RpdmVTZW5zb3IoYWN0aXZlU2Vuc29yUmVmLmN1cnJlbnQpO1xuICAgICAgICAgIHNldEFjdGl2YXRvckV2ZW50KGFjdGl2YXRvckV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICBvbk1vdmUoY29vcmRpbmF0ZXMpIHtcbiAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgIHR5cGU6IEFjdGlvbi5EcmFnTW92ZSxcbiAgICAgICAgICBjb29yZGluYXRlc1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIG9uRW5kOiBjcmVhdGVIYW5kbGVyKEFjdGlvbi5EcmFnRW5kKSxcbiAgICAgIG9uQ2FuY2VsOiBjcmVhdGVIYW5kbGVyKEFjdGlvbi5EcmFnQ2FuY2VsKVxuICAgIH0pO1xuICAgIGFjdGl2ZVNlbnNvclJlZi5jdXJyZW50ID0gc2Vuc29ySW5zdGFuY2U7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVIYW5kbGVyKHR5cGUpIHtcbiAgICAgIHJldHVybiBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgYWN0aXZlLFxuICAgICAgICAgIGNvbGxpc2lvbnMsXG4gICAgICAgICAgb3ZlcixcbiAgICAgICAgICBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZVxuICAgICAgICB9ID0gc2Vuc29yQ29udGV4dC5jdXJyZW50O1xuICAgICAgICBsZXQgZXZlbnQgPSBudWxsO1xuXG4gICAgICAgIGlmIChhY3RpdmUgJiYgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUpIHtcbiAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBjYW5jZWxEcm9wXG4gICAgICAgICAgfSA9IGxhdGVzdFByb3BzLmN1cnJlbnQ7XG4gICAgICAgICAgZXZlbnQgPSB7XG4gICAgICAgICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgICAgICAgIGFjdGl2ZTogYWN0aXZlLFxuICAgICAgICAgICAgY29sbGlzaW9ucyxcbiAgICAgICAgICAgIGRlbHRhOiBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZSxcbiAgICAgICAgICAgIG92ZXJcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHR5cGUgPT09IEFjdGlvbi5EcmFnRW5kICYmIHR5cGVvZiBjYW5jZWxEcm9wID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zdCBzaG91bGRDYW5jZWwgPSBhd2FpdCBQcm9taXNlLnJlc29sdmUoY2FuY2VsRHJvcChldmVudCkpO1xuXG4gICAgICAgICAgICBpZiAoc2hvdWxkQ2FuY2VsKSB7XG4gICAgICAgICAgICAgIHR5cGUgPSBBY3Rpb24uRHJhZ0NhbmNlbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhY3RpdmVSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgIHVuc3RhYmxlX2JhdGNoZWRVcGRhdGVzKCgpID0+IHtcbiAgICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgICB0eXBlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2V0U3RhdHVzKFN0YXR1cy5VbmluaXRpYWxpemVkKTtcbiAgICAgICAgICBzZXRPdmVyKG51bGwpO1xuICAgICAgICAgIHNldEFjdGl2ZVNlbnNvcihudWxsKTtcbiAgICAgICAgICBzZXRBY3RpdmF0b3JFdmVudChudWxsKTtcbiAgICAgICAgICBhY3RpdmVTZW5zb3JSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICAgICAgY29uc3QgZXZlbnROYW1lID0gdHlwZSA9PT0gQWN0aW9uLkRyYWdFbmQgPyAnb25EcmFnRW5kJyA6ICdvbkRyYWdDYW5jZWwnO1xuXG4gICAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gbGF0ZXN0UHJvcHMuY3VycmVudFtldmVudE5hbWVdO1xuICAgICAgICAgICAgaGFuZGxlciA9PSBudWxsID8gdm9pZCAwIDogaGFuZGxlcihldmVudCk7XG4gICAgICAgICAgICBkaXNwYXRjaE1vbml0b3JFdmVudCh7XG4gICAgICAgICAgICAgIHR5cGU6IGV2ZW50TmFtZSxcbiAgICAgICAgICAgICAgZXZlbnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbZHJhZ2dhYmxlTm9kZXNdKTtcbiAgY29uc3QgYmluZEFjdGl2YXRvclRvU2Vuc29ySW5zdGFudGlhdG9yID0gdXNlQ2FsbGJhY2soKGhhbmRsZXIsIHNlbnNvcikgPT4ge1xuICAgIHJldHVybiAoZXZlbnQsIGFjdGl2ZSkgPT4ge1xuICAgICAgY29uc3QgbmF0aXZlRXZlbnQgPSBldmVudC5uYXRpdmVFdmVudDtcbiAgICAgIGNvbnN0IGFjdGl2ZURyYWdnYWJsZU5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoYWN0aXZlKTtcblxuICAgICAgaWYgKCAvLyBBbm90aGVyIHNlbnNvciBpcyBhbHJlYWR5IGluc3RhbnRpYXRpbmdcbiAgICAgIGFjdGl2ZVJlZi5jdXJyZW50ICE9PSBudWxsIHx8IC8vIE5vIGFjdGl2ZSBkcmFnZ2FibGVcbiAgICAgICFhY3RpdmVEcmFnZ2FibGVOb2RlIHx8IC8vIEV2ZW50IGhhcyBhbHJlYWR5IGJlZW4gY2FwdHVyZWRcbiAgICAgIG5hdGl2ZUV2ZW50LmRuZEtpdCB8fCBuYXRpdmVFdmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYWN0aXZhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgIGFjdGl2ZTogYWN0aXZlRHJhZ2dhYmxlTm9kZVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHNob3VsZEFjdGl2YXRlID0gaGFuZGxlcihldmVudCwgc2Vuc29yLm9wdGlvbnMsIGFjdGl2YXRpb25Db250ZXh0KTtcblxuICAgICAgaWYgKHNob3VsZEFjdGl2YXRlID09PSB0cnVlKSB7XG4gICAgICAgIG5hdGl2ZUV2ZW50LmRuZEtpdCA9IHtcbiAgICAgICAgICBjYXB0dXJlZEJ5OiBzZW5zb3Iuc2Vuc29yXG4gICAgICAgIH07XG4gICAgICAgIGFjdGl2ZVJlZi5jdXJyZW50ID0gYWN0aXZlO1xuICAgICAgICBpbnN0YW50aWF0ZVNlbnNvcihldmVudCwgc2Vuc29yKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbZHJhZ2dhYmxlTm9kZXMsIGluc3RhbnRpYXRlU2Vuc29yXSk7XG4gIGNvbnN0IGFjdGl2YXRvcnMgPSB1c2VDb21iaW5lQWN0aXZhdG9ycyhzZW5zb3JzLCBiaW5kQWN0aXZhdG9yVG9TZW5zb3JJbnN0YW50aWF0b3IpO1xuICB1c2VTZW5zb3JTZXR1cChzZW5zb3JzKTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGFjdGl2ZU5vZGVSZWN0ICYmIHN0YXR1cyA9PT0gU3RhdHVzLkluaXRpYWxpemluZykge1xuICAgICAgc2V0U3RhdHVzKFN0YXR1cy5Jbml0aWFsaXplZCk7XG4gICAgfVxuICB9LCBbYWN0aXZlTm9kZVJlY3QsIHN0YXR1c10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIG9uRHJhZ01vdmVcbiAgICB9ID0gbGF0ZXN0UHJvcHMuY3VycmVudDtcbiAgICBjb25zdCB7XG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGNvbGxpc2lvbnMsXG4gICAgICBvdmVyXG4gICAgfSA9IHNlbnNvckNvbnRleHQuY3VycmVudDtcblxuICAgIGlmICghYWN0aXZlIHx8ICFhY3RpdmF0b3JFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBjb2xsaXNpb25zLFxuICAgICAgZGVsdGE6IHtcbiAgICAgICAgeDogc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUueCxcbiAgICAgICAgeTogc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUueVxuICAgICAgfSxcbiAgICAgIG92ZXJcbiAgICB9O1xuICAgIHVuc3RhYmxlX2JhdGNoZWRVcGRhdGVzKCgpID0+IHtcbiAgICAgIG9uRHJhZ01vdmUgPT0gbnVsbCA/IHZvaWQgMCA6IG9uRHJhZ01vdmUoZXZlbnQpO1xuICAgICAgZGlzcGF0Y2hNb25pdG9yRXZlbnQoe1xuICAgICAgICB0eXBlOiAnb25EcmFnTW92ZScsXG4gICAgICAgIGV2ZW50XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUueCwgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUueV0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgY29sbGlzaW9ucyxcbiAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgICBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZVxuICAgIH0gPSBzZW5zb3JDb250ZXh0LmN1cnJlbnQ7XG5cbiAgICBpZiAoIWFjdGl2ZSB8fCBhY3RpdmVSZWYuY3VycmVudCA9PSBudWxsIHx8ICFhY3RpdmF0b3JFdmVudCB8fCAhc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICBvbkRyYWdPdmVyXG4gICAgfSA9IGxhdGVzdFByb3BzLmN1cnJlbnQ7XG4gICAgY29uc3Qgb3ZlckNvbnRhaW5lciA9IGRyb3BwYWJsZUNvbnRhaW5lcnMuZ2V0KG92ZXJJZCk7XG4gICAgY29uc3Qgb3ZlciA9IG92ZXJDb250YWluZXIgJiYgb3ZlckNvbnRhaW5lci5yZWN0LmN1cnJlbnQgPyB7XG4gICAgICBpZDogb3ZlckNvbnRhaW5lci5pZCxcbiAgICAgIHJlY3Q6IG92ZXJDb250YWluZXIucmVjdC5jdXJyZW50LFxuICAgICAgZGF0YTogb3ZlckNvbnRhaW5lci5kYXRhLFxuICAgICAgZGlzYWJsZWQ6IG92ZXJDb250YWluZXIuZGlzYWJsZWRcbiAgICB9IDogbnVsbDtcbiAgICBjb25zdCBldmVudCA9IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgY29sbGlzaW9ucyxcbiAgICAgIGRlbHRhOiB7XG4gICAgICAgIHg6IHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlLngsXG4gICAgICAgIHk6IHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlLnlcbiAgICAgIH0sXG4gICAgICBvdmVyXG4gICAgfTtcbiAgICB1bnN0YWJsZV9iYXRjaGVkVXBkYXRlcygoKSA9PiB7XG4gICAgICBzZXRPdmVyKG92ZXIpO1xuICAgICAgb25EcmFnT3ZlciA9PSBudWxsID8gdm9pZCAwIDogb25EcmFnT3ZlcihldmVudCk7XG4gICAgICBkaXNwYXRjaE1vbml0b3JFdmVudCh7XG4gICAgICAgIHR5cGU6ICdvbkRyYWdPdmVyJyxcbiAgICAgICAgZXZlbnRcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtvdmVySWRdKTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgc2Vuc29yQ29udGV4dC5jdXJyZW50ID0ge1xuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmVOb2RlLFxuICAgICAgY29sbGlzaW9uUmVjdCxcbiAgICAgIGNvbGxpc2lvbnMsXG4gICAgICBkcm9wcGFibGVSZWN0cyxcbiAgICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgICAgZHJhZ2dpbmdOb2RlLFxuICAgICAgZHJhZ2dpbmdOb2RlUmVjdCxcbiAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgICBvdmVyLFxuICAgICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICAgIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlXG4gICAgfTtcbiAgICBhY3RpdmVSZWN0cy5jdXJyZW50ID0ge1xuICAgICAgaW5pdGlhbDogZHJhZ2dpbmdOb2RlUmVjdCxcbiAgICAgIHRyYW5zbGF0ZWQ6IGNvbGxpc2lvblJlY3RcbiAgICB9O1xuICB9LCBbYWN0aXZlLCBhY3RpdmVOb2RlLCBjb2xsaXNpb25zLCBjb2xsaXNpb25SZWN0LCBkcmFnZ2FibGVOb2RlcywgZHJhZ2dpbmdOb2RlLCBkcmFnZ2luZ05vZGVSZWN0LCBkcm9wcGFibGVSZWN0cywgZHJvcHBhYmxlQ29udGFpbmVycywgb3Zlciwgc2Nyb2xsYWJsZUFuY2VzdG9ycywgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGVdKTtcbiAgdXNlQXV0b1Njcm9sbGVyKHsgLi4uYXV0b1Njcm9sbE9wdGlvbnMsXG4gICAgZGVsdGE6IHRyYW5zbGF0ZSxcbiAgICBkcmFnZ2luZ1JlY3Q6IGNvbGxpc2lvblJlY3QsXG4gICAgcG9pbnRlckNvb3JkaW5hdGVzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHNcbiAgfSk7XG4gIGNvbnN0IHB1YmxpY0NvbnRleHQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZlTm9kZSxcbiAgICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBjb2xsaXNpb25zLFxuICAgICAgY29udGFpbmVyTm9kZVJlY3QsXG4gICAgICBkcmFnT3ZlcmxheSxcbiAgICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgICAgb3ZlcixcbiAgICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzLFxuICAgICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICAgIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLFxuICAgICAgbWVhc3VyaW5nQ29uZmlndXJhdGlvbixcbiAgICAgIG1lYXN1cmluZ1NjaGVkdWxlZCxcbiAgICAgIHdpbmRvd1JlY3RcbiAgICB9O1xuICAgIHJldHVybiBjb250ZXh0O1xuICB9LCBbYWN0aXZlLCBhY3RpdmVOb2RlLCBhY3RpdmVOb2RlUmVjdCwgYWN0aXZhdG9yRXZlbnQsIGNvbGxpc2lvbnMsIGNvbnRhaW5lck5vZGVSZWN0LCBkcmFnT3ZlcmxheSwgZHJhZ2dhYmxlTm9kZXMsIGRyb3BwYWJsZUNvbnRhaW5lcnMsIGRyb3BwYWJsZVJlY3RzLCBvdmVyLCBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycywgc2Nyb2xsYWJsZUFuY2VzdG9ycywgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24sIG1lYXN1cmluZ1NjaGVkdWxlZCwgd2luZG93UmVjdF0pO1xuICBjb25zdCBpbnRlcm5hbENvbnRleHQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBhY3RpdmF0b3JzLFxuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgICBhcmlhRGVzY3JpYmVkQnlJZDoge1xuICAgICAgICBkcmFnZ2FibGU6IGRyYWdnYWJsZURlc2NyaWJlZEJ5SWRcbiAgICAgIH0sXG4gICAgICBkaXNwYXRjaCxcbiAgICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgICAgb3ZlcixcbiAgICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzXG4gICAgfTtcbiAgICByZXR1cm4gY29udGV4dDtcbiAgfSwgW2FjdGl2YXRvckV2ZW50LCBhY3RpdmF0b3JzLCBhY3RpdmUsIGFjdGl2ZU5vZGVSZWN0LCBkaXNwYXRjaCwgZHJhZ2dhYmxlRGVzY3JpYmVkQnlJZCwgZHJhZ2dhYmxlTm9kZXMsIG92ZXIsIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzXSk7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KERuZE1vbml0b3JDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHJlZ2lzdGVyTW9uaXRvckxpc3RlbmVyXG4gIH0sIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSW50ZXJuYWxDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGludGVybmFsQ29udGV4dFxuICB9LCBSZWFjdC5jcmVhdGVFbGVtZW50KFB1YmxpY0NvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogcHVibGljQ29udGV4dFxuICB9LCBSZWFjdC5jcmVhdGVFbGVtZW50KEFjdGl2ZURyYWdnYWJsZUNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogdHJhbnNmb3JtXG4gIH0sIGNoaWxkcmVuKSksIFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVzdG9yZUZvY3VzLCB7XG4gICAgZGlzYWJsZWQ6IChhY2Nlc3NpYmlsaXR5ID09IG51bGwgPyB2b2lkIDAgOiBhY2Nlc3NpYmlsaXR5LnJlc3RvcmVGb2N1cykgPT09IGZhbHNlXG4gIH0pKSwgUmVhY3QuY3JlYXRlRWxlbWVudChBY2Nlc3NpYmlsaXR5LCB7IC4uLmFjY2Vzc2liaWxpdHksXG4gICAgaGlkZGVuVGV4dERlc2NyaWJlZEJ5SWQ6IGRyYWdnYWJsZURlc2NyaWJlZEJ5SWRcbiAgfSkpO1xuXG4gIGZ1bmN0aW9uIGdldEF1dG9TY3JvbGxlck9wdGlvbnMoKSB7XG4gICAgY29uc3QgYWN0aXZlU2Vuc29yRGlzYWJsZXNBdXRvc2Nyb2xsID0gKGFjdGl2ZVNlbnNvciA9PSBudWxsID8gdm9pZCAwIDogYWN0aXZlU2Vuc29yLmF1dG9TY3JvbGxFbmFibGVkKSA9PT0gZmFsc2U7XG4gICAgY29uc3QgYXV0b1Njcm9sbEdsb2JhbGx5RGlzYWJsZWQgPSB0eXBlb2YgYXV0b1Njcm9sbCA9PT0gJ29iamVjdCcgPyBhdXRvU2Nyb2xsLmVuYWJsZWQgPT09IGZhbHNlIDogYXV0b1Njcm9sbCA9PT0gZmFsc2U7XG4gICAgY29uc3QgZW5hYmxlZCA9IGlzSW5pdGlhbGl6ZWQgJiYgIWFjdGl2ZVNlbnNvckRpc2FibGVzQXV0b3Njcm9sbCAmJiAhYXV0b1Njcm9sbEdsb2JhbGx5RGlzYWJsZWQ7XG5cbiAgICBpZiAodHlwZW9mIGF1dG9TY3JvbGwgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4geyAuLi5hdXRvU2Nyb2xsLFxuICAgICAgICBlbmFibGVkXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBlbmFibGVkXG4gICAgfTtcbiAgfVxufSk7XG5cbmNvbnN0IE51bGxDb250ZXh0ID0gLyojX19QVVJFX18qL2NyZWF0ZUNvbnRleHQobnVsbCk7XG5jb25zdCBkZWZhdWx0Um9sZSA9ICdidXR0b24nO1xuY29uc3QgSURfUFJFRklYID0gJ0RyYWdnYWJsZSc7XG5mdW5jdGlvbiB1c2VEcmFnZ2FibGUoX3JlZikge1xuICBsZXQge1xuICAgIGlkLFxuICAgIGRhdGEsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgICBhdHRyaWJ1dGVzXG4gIH0gPSBfcmVmO1xuICBjb25zdCBrZXkgPSB1c2VVbmlxdWVJZChJRF9QUkVGSVgpO1xuICBjb25zdCB7XG4gICAgYWN0aXZhdG9ycyxcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgYXJpYURlc2NyaWJlZEJ5SWQsXG4gICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgb3ZlclxuICB9ID0gdXNlQ29udGV4dChJbnRlcm5hbENvbnRleHQpO1xuICBjb25zdCB7XG4gICAgcm9sZSA9IGRlZmF1bHRSb2xlLFxuICAgIHJvbGVEZXNjcmlwdGlvbiA9ICdkcmFnZ2FibGUnLFxuICAgIHRhYkluZGV4ID0gMFxuICB9ID0gYXR0cmlidXRlcyAhPSBudWxsID8gYXR0cmlidXRlcyA6IHt9O1xuICBjb25zdCBpc0RyYWdnaW5nID0gKGFjdGl2ZSA9PSBudWxsID8gdm9pZCAwIDogYWN0aXZlLmlkKSA9PT0gaWQ7XG4gIGNvbnN0IHRyYW5zZm9ybSA9IHVzZUNvbnRleHQoaXNEcmFnZ2luZyA/IEFjdGl2ZURyYWdnYWJsZUNvbnRleHQgOiBOdWxsQ29udGV4dCk7XG4gIGNvbnN0IFtub2RlLCBzZXROb2RlUmVmXSA9IHVzZU5vZGVSZWYoKTtcbiAgY29uc3QgW2FjdGl2YXRvck5vZGUsIHNldEFjdGl2YXRvck5vZGVSZWZdID0gdXNlTm9kZVJlZigpO1xuICBjb25zdCBsaXN0ZW5lcnMgPSB1c2VTeW50aGV0aWNMaXN0ZW5lcnMoYWN0aXZhdG9ycywgaWQpO1xuICBjb25zdCBkYXRhUmVmID0gdXNlTGF0ZXN0VmFsdWUoZGF0YSk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGRyYWdnYWJsZU5vZGVzLnNldChpZCwge1xuICAgICAgaWQsXG4gICAgICBrZXksXG4gICAgICBub2RlLFxuICAgICAgYWN0aXZhdG9yTm9kZSxcbiAgICAgIGRhdGE6IGRhdGFSZWZcbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY29uc3Qgbm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChpZCk7XG5cbiAgICAgIGlmIChub2RlICYmIG5vZGUua2V5ID09PSBrZXkpIHtcbiAgICAgICAgZHJhZ2dhYmxlTm9kZXMuZGVsZXRlKGlkKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtkcmFnZ2FibGVOb2RlcywgaWRdKTtcbiAgY29uc3QgbWVtb2l6ZWRBdHRyaWJ1dGVzID0gdXNlTWVtbygoKSA9PiAoe1xuICAgIHJvbGUsXG4gICAgdGFiSW5kZXgsXG4gICAgJ2FyaWEtZGlzYWJsZWQnOiBkaXNhYmxlZCxcbiAgICAnYXJpYS1wcmVzc2VkJzogaXNEcmFnZ2luZyAmJiByb2xlID09PSBkZWZhdWx0Um9sZSA/IHRydWUgOiB1bmRlZmluZWQsXG4gICAgJ2FyaWEtcm9sZWRlc2NyaXB0aW9uJzogcm9sZURlc2NyaXB0aW9uLFxuICAgICdhcmlhLWRlc2NyaWJlZGJ5JzogYXJpYURlc2NyaWJlZEJ5SWQuZHJhZ2dhYmxlXG4gIH0pLCBbZGlzYWJsZWQsIHJvbGUsIHRhYkluZGV4LCBpc0RyYWdnaW5nLCByb2xlRGVzY3JpcHRpb24sIGFyaWFEZXNjcmliZWRCeUlkLmRyYWdnYWJsZV0pO1xuICByZXR1cm4ge1xuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBhdHRyaWJ1dGVzOiBtZW1vaXplZEF0dHJpYnV0ZXMsXG4gICAgaXNEcmFnZ2luZyxcbiAgICBsaXN0ZW5lcnM6IGRpc2FibGVkID8gdW5kZWZpbmVkIDogbGlzdGVuZXJzLFxuICAgIG5vZGUsXG4gICAgb3ZlcixcbiAgICBzZXROb2RlUmVmLFxuICAgIHNldEFjdGl2YXRvck5vZGVSZWYsXG4gICAgdHJhbnNmb3JtXG4gIH07XG59XG5cbmZ1bmN0aW9uIHVzZURuZENvbnRleHQoKSB7XG4gIHJldHVybiB1c2VDb250ZXh0KFB1YmxpY0NvbnRleHQpO1xufVxuXG5jb25zdCBJRF9QUkVGSVgkMSA9ICdEcm9wcGFibGUnO1xuY29uc3QgZGVmYXVsdFJlc2l6ZU9ic2VydmVyQ29uZmlnID0ge1xuICB0aW1lb3V0OiAyNVxufTtcbmZ1bmN0aW9uIHVzZURyb3BwYWJsZShfcmVmKSB7XG4gIGxldCB7XG4gICAgZGF0YSxcbiAgICBkaXNhYmxlZCA9IGZhbHNlLFxuICAgIGlkLFxuICAgIHJlc2l6ZU9ic2VydmVyQ29uZmlnXG4gIH0gPSBfcmVmO1xuICBjb25zdCBrZXkgPSB1c2VVbmlxdWVJZChJRF9QUkVGSVgkMSk7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmUsXG4gICAgZGlzcGF0Y2gsXG4gICAgb3ZlcixcbiAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyc1xuICB9ID0gdXNlQ29udGV4dChJbnRlcm5hbENvbnRleHQpO1xuICBjb25zdCBwcmV2aW91cyA9IHVzZVJlZih7XG4gICAgZGlzYWJsZWRcbiAgfSk7XG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyQ29ubmVjdGVkID0gdXNlUmVmKGZhbHNlKTtcbiAgY29uc3QgcmVjdCA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgY2FsbGJhY2tJZCA9IHVzZVJlZihudWxsKTtcbiAgY29uc3Qge1xuICAgIGRpc2FibGVkOiByZXNpemVPYnNlcnZlckRpc2FibGVkLFxuICAgIHVwZGF0ZU1lYXN1cmVtZW50c0ZvcixcbiAgICB0aW1lb3V0OiByZXNpemVPYnNlcnZlclRpbWVvdXRcbiAgfSA9IHsgLi4uZGVmYXVsdFJlc2l6ZU9ic2VydmVyQ29uZmlnLFxuICAgIC4uLnJlc2l6ZU9ic2VydmVyQ29uZmlnXG4gIH07XG4gIGNvbnN0IGlkcyA9IHVzZUxhdGVzdFZhbHVlKHVwZGF0ZU1lYXN1cmVtZW50c0ZvciAhPSBudWxsID8gdXBkYXRlTWVhc3VyZW1lbnRzRm9yIDogaWQpO1xuICBjb25zdCBoYW5kbGVSZXNpemUgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKCFyZXNpemVPYnNlcnZlckNvbm5lY3RlZC5jdXJyZW50KSB7XG4gICAgICAvLyBSZXNpemVPYnNlcnZlciBpbnZva2VzIHRoZSBgaGFuZGxlUmVzaXplYCBjYWxsYmFjayBhcyBzb29uIGFzIGBvYnNlcnZlYCBpcyBjYWxsZWQsXG4gICAgICAvLyBhc3N1bWluZyB0aGUgZWxlbWVudCBpcyByZW5kZXJlZCBhbmQgZGlzcGxheWVkLlxuICAgICAgcmVzaXplT2JzZXJ2ZXJDb25uZWN0ZWQuY3VycmVudCA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrSWQuY3VycmVudCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQoY2FsbGJhY2tJZC5jdXJyZW50KTtcbiAgICB9XG5cbiAgICBjYWxsYmFja0lkLmN1cnJlbnQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzKEFycmF5LmlzQXJyYXkoaWRzLmN1cnJlbnQpID8gaWRzLmN1cnJlbnQgOiBbaWRzLmN1cnJlbnRdKTtcbiAgICAgIGNhbGxiYWNrSWQuY3VycmVudCA9IG51bGw7XG4gICAgfSwgcmVzaXplT2JzZXJ2ZXJUaW1lb3V0KTtcbiAgfSwgLy9lc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtyZXNpemVPYnNlcnZlclRpbWVvdXRdKTtcbiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSB1c2VSZXNpemVPYnNlcnZlcih7XG4gICAgY2FsbGJhY2s6IGhhbmRsZVJlc2l6ZSxcbiAgICBkaXNhYmxlZDogcmVzaXplT2JzZXJ2ZXJEaXNhYmxlZCB8fCAhYWN0aXZlXG4gIH0pO1xuICBjb25zdCBoYW5kbGVOb2RlQ2hhbmdlID0gdXNlQ2FsbGJhY2soKG5ld0VsZW1lbnQsIHByZXZpb3VzRWxlbWVudCkgPT4ge1xuICAgIGlmICghcmVzaXplT2JzZXJ2ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocHJldmlvdXNFbGVtZW50KSB7XG4gICAgICByZXNpemVPYnNlcnZlci51bm9ic2VydmUocHJldmlvdXNFbGVtZW50KTtcbiAgICAgIHJlc2l6ZU9ic2VydmVyQ29ubmVjdGVkLmN1cnJlbnQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAobmV3RWxlbWVudCkge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShuZXdFbGVtZW50KTtcbiAgICB9XG4gIH0sIFtyZXNpemVPYnNlcnZlcl0pO1xuICBjb25zdCBbbm9kZVJlZiwgc2V0Tm9kZVJlZl0gPSB1c2VOb2RlUmVmKGhhbmRsZU5vZGVDaGFuZ2UpO1xuICBjb25zdCBkYXRhUmVmID0gdXNlTGF0ZXN0VmFsdWUoZGF0YSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFyZXNpemVPYnNlcnZlciB8fCAhbm9kZVJlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIHJlc2l6ZU9ic2VydmVyQ29ubmVjdGVkLmN1cnJlbnQgPSBmYWxzZTtcbiAgICByZXNpemVPYnNlcnZlci5vYnNlcnZlKG5vZGVSZWYuY3VycmVudCk7XG4gIH0sIFtub2RlUmVmLCByZXNpemVPYnNlcnZlcl0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGRpc3BhdGNoKHtcbiAgICAgIHR5cGU6IEFjdGlvbi5SZWdpc3RlckRyb3BwYWJsZSxcbiAgICAgIGVsZW1lbnQ6IHtcbiAgICAgICAgaWQsXG4gICAgICAgIGtleSxcbiAgICAgICAgZGlzYWJsZWQsXG4gICAgICAgIG5vZGU6IG5vZGVSZWYsXG4gICAgICAgIHJlY3QsXG4gICAgICAgIGRhdGE6IGRhdGFSZWZcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gKCkgPT4gZGlzcGF0Y2goe1xuICAgICAgdHlwZTogQWN0aW9uLlVucmVnaXN0ZXJEcm9wcGFibGUsXG4gICAgICBrZXksXG4gICAgICBpZFxuICAgIH0pO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtpZF0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCAhPT0gcHJldmlvdXMuY3VycmVudC5kaXNhYmxlZCkge1xuICAgICAgZGlzcGF0Y2goe1xuICAgICAgICB0eXBlOiBBY3Rpb24uU2V0RHJvcHBhYmxlRGlzYWJsZWQsXG4gICAgICAgIGlkLFxuICAgICAgICBrZXksXG4gICAgICAgIGRpc2FibGVkXG4gICAgICB9KTtcbiAgICAgIHByZXZpb3VzLmN1cnJlbnQuZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICB9XG4gIH0sIFtpZCwga2V5LCBkaXNhYmxlZCwgZGlzcGF0Y2hdKTtcbiAgcmV0dXJuIHtcbiAgICBhY3RpdmUsXG4gICAgcmVjdCxcbiAgICBpc092ZXI6IChvdmVyID09IG51bGwgPyB2b2lkIDAgOiBvdmVyLmlkKSA9PT0gaWQsXG4gICAgbm9kZTogbm9kZVJlZixcbiAgICBvdmVyLFxuICAgIHNldE5vZGVSZWZcbiAgfTtcbn1cblxuZnVuY3Rpb24gQW5pbWF0aW9uTWFuYWdlcihfcmVmKSB7XG4gIGxldCB7XG4gICAgYW5pbWF0aW9uLFxuICAgIGNoaWxkcmVuXG4gIH0gPSBfcmVmO1xuICBjb25zdCBbY2xvbmVkQ2hpbGRyZW4sIHNldENsb25lZENoaWxkcmVuXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbZWxlbWVudCwgc2V0RWxlbWVudF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgcHJldmlvdXNDaGlsZHJlbiA9IHVzZVByZXZpb3VzKGNoaWxkcmVuKTtcblxuICBpZiAoIWNoaWxkcmVuICYmICFjbG9uZWRDaGlsZHJlbiAmJiBwcmV2aW91c0NoaWxkcmVuKSB7XG4gICAgc2V0Q2xvbmVkQ2hpbGRyZW4ocHJldmlvdXNDaGlsZHJlbik7XG4gIH1cblxuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBjbG9uZWRDaGlsZHJlbiA9PSBudWxsID8gdm9pZCAwIDogY2xvbmVkQ2hpbGRyZW4ua2V5O1xuICAgIGNvbnN0IGlkID0gY2xvbmVkQ2hpbGRyZW4gPT0gbnVsbCA/IHZvaWQgMCA6IGNsb25lZENoaWxkcmVuLnByb3BzLmlkO1xuXG4gICAgaWYgKGtleSA9PSBudWxsIHx8IGlkID09IG51bGwpIHtcbiAgICAgIHNldENsb25lZENoaWxkcmVuKG51bGwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIFByb21pc2UucmVzb2x2ZShhbmltYXRpb24oaWQsIGVsZW1lbnQpKS50aGVuKCgpID0+IHtcbiAgICAgIHNldENsb25lZENoaWxkcmVuKG51bGwpO1xuICAgIH0pO1xuICB9LCBbYW5pbWF0aW9uLCBjbG9uZWRDaGlsZHJlbiwgZWxlbWVudF0pO1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwgY2hpbGRyZW4sIGNsb25lZENoaWxkcmVuID8gY2xvbmVFbGVtZW50KGNsb25lZENoaWxkcmVuLCB7XG4gICAgcmVmOiBzZXRFbGVtZW50XG4gIH0pIDogbnVsbCk7XG59XG5cbmNvbnN0IGRlZmF1bHRUcmFuc2Zvcm0gPSB7XG4gIHg6IDAsXG4gIHk6IDAsXG4gIHNjYWxlWDogMSxcbiAgc2NhbGVZOiAxXG59O1xuZnVuY3Rpb24gTnVsbGlmaWVkQ29udGV4dFByb3ZpZGVyKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBjaGlsZHJlblxuICB9ID0gX3JlZjtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSW50ZXJuYWxDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGRlZmF1bHRJbnRlcm5hbENvbnRleHRcbiAgfSwgUmVhY3QuY3JlYXRlRWxlbWVudChBY3RpdmVEcmFnZ2FibGVDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGRlZmF1bHRUcmFuc2Zvcm1cbiAgfSwgY2hpbGRyZW4pKTtcbn1cblxuY29uc3QgYmFzZVN0eWxlcyA9IHtcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHRvdWNoQWN0aW9uOiAnbm9uZSdcbn07XG5cbmNvbnN0IGRlZmF1bHRUcmFuc2l0aW9uID0gYWN0aXZhdG9yRXZlbnQgPT4ge1xuICBjb25zdCBpc0tleWJvYXJkQWN0aXZhdG9yID0gaXNLZXlib2FyZEV2ZW50KGFjdGl2YXRvckV2ZW50KTtcbiAgcmV0dXJuIGlzS2V5Ym9hcmRBY3RpdmF0b3IgPyAndHJhbnNmb3JtIDI1MG1zIGVhc2UnIDogdW5kZWZpbmVkO1xufTtcblxuY29uc3QgUG9zaXRpb25lZE92ZXJsYXkgPSAvKiNfX1BVUkVfXyovZm9yd2FyZFJlZigoX3JlZiwgcmVmKSA9PiB7XG4gIGxldCB7XG4gICAgYXMsXG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWRqdXN0U2NhbGUsXG4gICAgY2hpbGRyZW4sXG4gICAgY2xhc3NOYW1lLFxuICAgIHJlY3QsXG4gICAgc3R5bGUsXG4gICAgdHJhbnNmb3JtLFxuICAgIHRyYW5zaXRpb24gPSBkZWZhdWx0VHJhbnNpdGlvblxuICB9ID0gX3JlZjtcblxuICBpZiAoIXJlY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHNjYWxlQWRqdXN0ZWRUcmFuc2Zvcm0gPSBhZGp1c3RTY2FsZSA/IHRyYW5zZm9ybSA6IHsgLi4udHJhbnNmb3JtLFxuICAgIHNjYWxlWDogMSxcbiAgICBzY2FsZVk6IDFcbiAgfTtcbiAgY29uc3Qgc3R5bGVzID0geyAuLi5iYXNlU3R5bGVzLFxuICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXG4gICAgdG9wOiByZWN0LnRvcCxcbiAgICBsZWZ0OiByZWN0LmxlZnQsXG4gICAgdHJhbnNmb3JtOiBDU1MuVHJhbnNmb3JtLnRvU3RyaW5nKHNjYWxlQWRqdXN0ZWRUcmFuc2Zvcm0pLFxuICAgIHRyYW5zZm9ybU9yaWdpbjogYWRqdXN0U2NhbGUgJiYgYWN0aXZhdG9yRXZlbnQgPyBnZXRSZWxhdGl2ZVRyYW5zZm9ybU9yaWdpbihhY3RpdmF0b3JFdmVudCwgcmVjdCkgOiB1bmRlZmluZWQsXG4gICAgdHJhbnNpdGlvbjogdHlwZW9mIHRyYW5zaXRpb24gPT09ICdmdW5jdGlvbicgPyB0cmFuc2l0aW9uKGFjdGl2YXRvckV2ZW50KSA6IHRyYW5zaXRpb24sXG4gICAgLi4uc3R5bGVcbiAgfTtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoYXMsIHtcbiAgICBjbGFzc05hbWUsXG4gICAgc3R5bGU6IHN0eWxlcyxcbiAgICByZWZcbiAgfSwgY2hpbGRyZW4pO1xufSk7XG5cbmNvbnN0IGRlZmF1bHREcm9wQW5pbWF0aW9uU2lkZUVmZmVjdHMgPSBvcHRpb25zID0+IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGFjdGl2ZSxcbiAgICBkcmFnT3ZlcmxheVxuICB9ID0gX3JlZjtcbiAgY29uc3Qgb3JpZ2luYWxTdHlsZXMgPSB7fTtcbiAgY29uc3Qge1xuICAgIHN0eWxlcyxcbiAgICBjbGFzc05hbWVcbiAgfSA9IG9wdGlvbnM7XG5cbiAgaWYgKHN0eWxlcyAhPSBudWxsICYmIHN0eWxlcy5hY3RpdmUpIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzdHlsZXMuYWN0aXZlKSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIG9yaWdpbmFsU3R5bGVzW2tleV0gPSBhY3RpdmUubm9kZS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKGtleSk7XG4gICAgICBhY3RpdmUubm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc3R5bGVzICE9IG51bGwgJiYgc3R5bGVzLmRyYWdPdmVybGF5KSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc3R5bGVzLmRyYWdPdmVybGF5KSkge1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGRyYWdPdmVybGF5Lm5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzTmFtZSAhPSBudWxsICYmIGNsYXNzTmFtZS5hY3RpdmUpIHtcbiAgICBhY3RpdmUubm9kZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZS5hY3RpdmUpO1xuICB9XG5cbiAgaWYgKGNsYXNzTmFtZSAhPSBudWxsICYmIGNsYXNzTmFtZS5kcmFnT3ZlcmxheSkge1xuICAgIGRyYWdPdmVybGF5Lm5vZGUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUuZHJhZ092ZXJsYXkpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMob3JpZ2luYWxTdHlsZXMpKSB7XG4gICAgICBhY3RpdmUubm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAoY2xhc3NOYW1lICE9IG51bGwgJiYgY2xhc3NOYW1lLmFjdGl2ZSkge1xuICAgICAgYWN0aXZlLm5vZGUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUuYWN0aXZlKTtcbiAgICB9XG4gIH07XG59O1xuXG5jb25zdCBkZWZhdWx0S2V5ZnJhbWVSZXNvbHZlciA9IF9yZWYyID0+IHtcbiAgbGV0IHtcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIGluaXRpYWwsXG4gICAgICBmaW5hbFxuICAgIH1cbiAgfSA9IF9yZWYyO1xuICByZXR1cm4gW3tcbiAgICB0cmFuc2Zvcm06IENTUy5UcmFuc2Zvcm0udG9TdHJpbmcoaW5pdGlhbClcbiAgfSwge1xuICAgIHRyYW5zZm9ybTogQ1NTLlRyYW5zZm9ybS50b1N0cmluZyhmaW5hbClcbiAgfV07XG59O1xuXG5jb25zdCBkZWZhdWx0RHJvcEFuaW1hdGlvbkNvbmZpZ3VyYXRpb24gPSB7XG4gIGR1cmF0aW9uOiAyNTAsXG4gIGVhc2luZzogJ2Vhc2UnLFxuICBrZXlmcmFtZXM6IGRlZmF1bHRLZXlmcmFtZVJlc29sdmVyLFxuICBzaWRlRWZmZWN0czogLyojX19QVVJFX18qL2RlZmF1bHREcm9wQW5pbWF0aW9uU2lkZUVmZmVjdHMoe1xuICAgIHN0eWxlczoge1xuICAgICAgYWN0aXZlOiB7XG4gICAgICAgIG9wYWNpdHk6ICcwJ1xuICAgICAgfVxuICAgIH1cbiAgfSlcbn07XG5mdW5jdGlvbiB1c2VEcm9wQW5pbWF0aW9uKF9yZWYzKSB7XG4gIGxldCB7XG4gICAgY29uZmlnLFxuICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgbWVhc3VyaW5nQ29uZmlndXJhdGlvblxuICB9ID0gX3JlZjM7XG4gIHJldHVybiB1c2VFdmVudCgoaWQsIG5vZGUpID0+IHtcbiAgICBpZiAoY29uZmlnID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGlkKTtcblxuICAgIGlmICghYWN0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZlTm9kZSA9IGFjdGl2ZURyYWdnYWJsZS5ub2RlLmN1cnJlbnQ7XG5cbiAgICBpZiAoIWFjdGl2ZU5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtZWFzdXJhYmxlTm9kZSA9IGdldE1lYXN1cmFibGVOb2RlKG5vZGUpO1xuXG4gICAgaWYgKCFtZWFzdXJhYmxlTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIHRyYW5zZm9ybVxuICAgIH0gPSBnZXRXaW5kb3cobm9kZSkuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBjb25zdCBwYXJzZWRUcmFuc2Zvcm0gPSBwYXJzZVRyYW5zZm9ybSh0cmFuc2Zvcm0pO1xuXG4gICAgaWYgKCFwYXJzZWRUcmFuc2Zvcm0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhbmltYXRpb24gPSB0eXBlb2YgY29uZmlnID09PSAnZnVuY3Rpb24nID8gY29uZmlnIDogY3JlYXRlRGVmYXVsdERyb3BBbmltYXRpb24oY29uZmlnKTtcbiAgICBzY3JvbGxJbnRvVmlld0lmTmVlZGVkKGFjdGl2ZU5vZGUsIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ2dhYmxlLm1lYXN1cmUpO1xuICAgIHJldHVybiBhbmltYXRpb24oe1xuICAgICAgYWN0aXZlOiB7XG4gICAgICAgIGlkLFxuICAgICAgICBkYXRhOiBhY3RpdmVEcmFnZ2FibGUuZGF0YSxcbiAgICAgICAgbm9kZTogYWN0aXZlTm9kZSxcbiAgICAgICAgcmVjdDogbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnZ2FibGUubWVhc3VyZShhY3RpdmVOb2RlKVxuICAgICAgfSxcbiAgICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgICAgZHJhZ092ZXJsYXk6IHtcbiAgICAgICAgbm9kZSxcbiAgICAgICAgcmVjdDogbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnT3ZlcmxheS5tZWFzdXJlKG1lYXN1cmFibGVOb2RlKVxuICAgICAgfSxcbiAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgICBtZWFzdXJpbmdDb25maWd1cmF0aW9uLFxuICAgICAgdHJhbnNmb3JtOiBwYXJzZWRUcmFuc2Zvcm1cbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlZmF1bHREcm9wQW5pbWF0aW9uKG9wdGlvbnMpIHtcbiAgY29uc3Qge1xuICAgIGR1cmF0aW9uLFxuICAgIGVhc2luZyxcbiAgICBzaWRlRWZmZWN0cyxcbiAgICBrZXlmcmFtZXNcbiAgfSA9IHsgLi4uZGVmYXVsdERyb3BBbmltYXRpb25Db25maWd1cmF0aW9uLFxuICAgIC4uLm9wdGlvbnNcbiAgfTtcbiAgcmV0dXJuIF9yZWY0ID0+IHtcbiAgICBsZXQge1xuICAgICAgYWN0aXZlLFxuICAgICAgZHJhZ092ZXJsYXksXG4gICAgICB0cmFuc2Zvcm0sXG4gICAgICAuLi5yZXN0XG4gICAgfSA9IF9yZWY0O1xuXG4gICAgaWYgKCFkdXJhdGlvbikge1xuICAgICAgLy8gRG8gbm90IGFuaW1hdGUgaWYgYW5pbWF0aW9uIGR1cmF0aW9uIGlzIHplcm8uXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGVsdGEgPSB7XG4gICAgICB4OiBkcmFnT3ZlcmxheS5yZWN0LmxlZnQgLSBhY3RpdmUucmVjdC5sZWZ0LFxuICAgICAgeTogZHJhZ092ZXJsYXkucmVjdC50b3AgLSBhY3RpdmUucmVjdC50b3BcbiAgICB9O1xuICAgIGNvbnN0IHNjYWxlID0ge1xuICAgICAgc2NhbGVYOiB0cmFuc2Zvcm0uc2NhbGVYICE9PSAxID8gYWN0aXZlLnJlY3Qud2lkdGggKiB0cmFuc2Zvcm0uc2NhbGVYIC8gZHJhZ092ZXJsYXkucmVjdC53aWR0aCA6IDEsXG4gICAgICBzY2FsZVk6IHRyYW5zZm9ybS5zY2FsZVkgIT09IDEgPyBhY3RpdmUucmVjdC5oZWlnaHQgKiB0cmFuc2Zvcm0uc2NhbGVZIC8gZHJhZ092ZXJsYXkucmVjdC5oZWlnaHQgOiAxXG4gICAgfTtcbiAgICBjb25zdCBmaW5hbFRyYW5zZm9ybSA9IHtcbiAgICAgIHg6IHRyYW5zZm9ybS54IC0gZGVsdGEueCxcbiAgICAgIHk6IHRyYW5zZm9ybS55IC0gZGVsdGEueSxcbiAgICAgIC4uLnNjYWxlXG4gICAgfTtcbiAgICBjb25zdCBhbmltYXRpb25LZXlmcmFtZXMgPSBrZXlmcmFtZXMoeyAuLi5yZXN0LFxuICAgICAgYWN0aXZlLFxuICAgICAgZHJhZ092ZXJsYXksXG4gICAgICB0cmFuc2Zvcm06IHtcbiAgICAgICAgaW5pdGlhbDogdHJhbnNmb3JtLFxuICAgICAgICBmaW5hbDogZmluYWxUcmFuc2Zvcm1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBbZmlyc3RLZXlmcmFtZV0gPSBhbmltYXRpb25LZXlmcmFtZXM7XG4gICAgY29uc3QgbGFzdEtleWZyYW1lID0gYW5pbWF0aW9uS2V5ZnJhbWVzW2FuaW1hdGlvbktleWZyYW1lcy5sZW5ndGggLSAxXTtcblxuICAgIGlmIChKU09OLnN0cmluZ2lmeShmaXJzdEtleWZyYW1lKSA9PT0gSlNPTi5zdHJpbmdpZnkobGFzdEtleWZyYW1lKSkge1xuICAgICAgLy8gVGhlIHN0YXJ0IGFuZCBlbmQga2V5ZnJhbWVzIGFyZSB0aGUgc2FtZSwgaW5mZXIgdGhhdCB0aGVyZSBpcyBubyBhbmltYXRpb24gbmVlZGVkLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNsZWFudXAgPSBzaWRlRWZmZWN0cyA9PSBudWxsID8gdm9pZCAwIDogc2lkZUVmZmVjdHMoe1xuICAgICAgYWN0aXZlLFxuICAgICAgZHJhZ092ZXJsYXksXG4gICAgICAuLi5yZXN0XG4gICAgfSk7XG4gICAgY29uc3QgYW5pbWF0aW9uID0gZHJhZ092ZXJsYXkubm9kZS5hbmltYXRlKGFuaW1hdGlvbktleWZyYW1lcywge1xuICAgICAgZHVyYXRpb24sXG4gICAgICBlYXNpbmcsXG4gICAgICBmaWxsOiAnZm9yd2FyZHMnXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgYW5pbWF0aW9uLm9uZmluaXNoID0gKCkgPT4ge1xuICAgICAgICBjbGVhbnVwID09IG51bGwgPyB2b2lkIDAgOiBjbGVhbnVwKCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG59XG5cbmxldCBrZXkgPSAwO1xuZnVuY3Rpb24gdXNlS2V5KGlkKSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGtleSsrO1xuICAgIHJldHVybiBrZXk7XG4gIH0sIFtpZF0pO1xufVxuXG5jb25zdCBEcmFnT3ZlcmxheSA9IC8qI19fUFVSRV9fKi9SZWFjdC5tZW1vKF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGFkanVzdFNjYWxlID0gZmFsc2UsXG4gICAgY2hpbGRyZW4sXG4gICAgZHJvcEFuaW1hdGlvbjogZHJvcEFuaW1hdGlvbkNvbmZpZyxcbiAgICBzdHlsZSxcbiAgICB0cmFuc2l0aW9uLFxuICAgIG1vZGlmaWVycyxcbiAgICB3cmFwcGVyRWxlbWVudCA9ICdkaXYnLFxuICAgIGNsYXNzTmFtZSxcbiAgICB6SW5kZXggPSA5OTlcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgY29udGFpbmVyTm9kZVJlY3QsXG4gICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBkcmFnT3ZlcmxheSxcbiAgICBvdmVyLFxuICAgIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24sXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cyxcbiAgICB3aW5kb3dSZWN0XG4gIH0gPSB1c2VEbmRDb250ZXh0KCk7XG4gIGNvbnN0IHRyYW5zZm9ybSA9IHVzZUNvbnRleHQoQWN0aXZlRHJhZ2dhYmxlQ29udGV4dCk7XG4gIGNvbnN0IGtleSA9IHVzZUtleShhY3RpdmUgPT0gbnVsbCA/IHZvaWQgMCA6IGFjdGl2ZS5pZCk7XG4gIGNvbnN0IG1vZGlmaWVkVHJhbnNmb3JtID0gYXBwbHlNb2RpZmllcnMobW9kaWZpZXJzLCB7XG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWN0aXZlLFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGNvbnRhaW5lck5vZGVSZWN0LFxuICAgIGRyYWdnaW5nTm9kZVJlY3Q6IGRyYWdPdmVybGF5LnJlY3QsXG4gICAgb3ZlcixcbiAgICBvdmVybGF5Tm9kZVJlY3Q6IGRyYWdPdmVybGF5LnJlY3QsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cyxcbiAgICB0cmFuc2Zvcm0sXG4gICAgd2luZG93UmVjdFxuICB9KTtcbiAgY29uc3QgaW5pdGlhbFJlY3QgPSB1c2VJbml0aWFsVmFsdWUoYWN0aXZlTm9kZVJlY3QpO1xuICBjb25zdCBkcm9wQW5pbWF0aW9uID0gdXNlRHJvcEFuaW1hdGlvbih7XG4gICAgY29uZmlnOiBkcm9wQW5pbWF0aW9uQ29uZmlnLFxuICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgbWVhc3VyaW5nQ29uZmlndXJhdGlvblxuICB9KTsgLy8gV2UgbmVlZCB0byB3YWl0IGZvciB0aGUgYWN0aXZlIG5vZGUgdG8gYmUgbWVhc3VyZWQgYmVmb3JlIGNvbm5lY3RpbmcgdGhlIGRyYWcgb3ZlcmxheSByZWZcbiAgLy8gb3RoZXJ3aXNlIGNvbGxpc2lvbnMgY2FuIGJlIGNvbXB1dGVkIGFnYWluc3QgYSBtaXNwb3NpdGlvbmVkIGRyYWcgb3ZlcmxheVxuXG4gIGNvbnN0IHJlZiA9IGluaXRpYWxSZWN0ID8gZHJhZ092ZXJsYXkuc2V0UmVmIDogdW5kZWZpbmVkO1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChOdWxsaWZpZWRDb250ZXh0UHJvdmlkZXIsIG51bGwsIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQW5pbWF0aW9uTWFuYWdlciwge1xuICAgIGFuaW1hdGlvbjogZHJvcEFuaW1hdGlvblxuICB9LCBhY3RpdmUgJiYga2V5ID8gUmVhY3QuY3JlYXRlRWxlbWVudChQb3NpdGlvbmVkT3ZlcmxheSwge1xuICAgIGtleToga2V5LFxuICAgIGlkOiBhY3RpdmUuaWQsXG4gICAgcmVmOiByZWYsXG4gICAgYXM6IHdyYXBwZXJFbGVtZW50LFxuICAgIGFjdGl2YXRvckV2ZW50OiBhY3RpdmF0b3JFdmVudCxcbiAgICBhZGp1c3RTY2FsZTogYWRqdXN0U2NhbGUsXG4gICAgY2xhc3NOYW1lOiBjbGFzc05hbWUsXG4gICAgdHJhbnNpdGlvbjogdHJhbnNpdGlvbixcbiAgICByZWN0OiBpbml0aWFsUmVjdCxcbiAgICBzdHlsZToge1xuICAgICAgekluZGV4LFxuICAgICAgLi4uc3R5bGVcbiAgICB9LFxuICAgIHRyYW5zZm9ybTogbW9kaWZpZWRUcmFuc2Zvcm1cbiAgfSwgY2hpbGRyZW4pIDogbnVsbCkpO1xufSk7XG5cbmV4cG9ydCB7IEF1dG9TY3JvbGxBY3RpdmF0b3IsIERuZENvbnRleHQsIERyYWdPdmVybGF5LCBLZXlib2FyZENvZGUsIEtleWJvYXJkU2Vuc29yLCBNZWFzdXJpbmdGcmVxdWVuY3ksIE1lYXN1cmluZ1N0cmF0ZWd5LCBNb3VzZVNlbnNvciwgUG9pbnRlclNlbnNvciwgVG91Y2hTZW5zb3IsIFRyYXZlcnNhbE9yZGVyLCBhcHBseU1vZGlmaWVycywgY2xvc2VzdENlbnRlciwgY2xvc2VzdENvcm5lcnMsIGRlZmF1bHRBbm5vdW5jZW1lbnRzLCBkZWZhdWx0Q29vcmRpbmF0ZXMsIGRlZmF1bHREcm9wQW5pbWF0aW9uQ29uZmlndXJhdGlvbiBhcyBkZWZhdWx0RHJvcEFuaW1hdGlvbiwgZGVmYXVsdERyb3BBbmltYXRpb25TaWRlRWZmZWN0cywgZGVmYXVsdEtleWJvYXJkQ29vcmRpbmF0ZUdldHRlciwgZGVmYXVsdFNjcmVlblJlYWRlckluc3RydWN0aW9ucywgZ2V0Q2xpZW50UmVjdCwgZ2V0Rmlyc3RDb2xsaXNpb24sIGdldFNjcm9sbGFibGVBbmNlc3RvcnMsIHBvaW50ZXJXaXRoaW4sIHJlY3RJbnRlcnNlY3Rpb24sIHVzZURuZENvbnRleHQsIHVzZURuZE1vbml0b3IsIHVzZURyYWdnYWJsZSwgdXNlRHJvcHBhYmxlLCB1c2VTZW5zb3IsIHVzZVNlbnNvcnMgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvcmUuZXNtLmpzLm1hcFxuIiwiaW1wb3J0IFJlYWN0LCB7IHVzZU1lbW8sIHVzZVJlZiwgdXNlRWZmZWN0LCB1c2VTdGF0ZSwgdXNlQ29udGV4dCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZURuZENvbnRleHQsIGdldENsaWVudFJlY3QsIHVzZURyb3BwYWJsZSwgdXNlRHJhZ2dhYmxlLCBjbG9zZXN0Q29ybmVycywgZ2V0Rmlyc3RDb2xsaXNpb24sIGdldFNjcm9sbGFibGVBbmNlc3RvcnMsIEtleWJvYXJkQ29kZSB9IGZyb20gJ0BkbmQta2l0L2NvcmUnO1xuaW1wb3J0IHsgdXNlVW5pcXVlSWQsIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QsIENTUywgdXNlQ29tYmluZWRSZWZzLCBpc0tleWJvYXJkRXZlbnQsIHN1YnRyYWN0IH0gZnJvbSAnQGRuZC1raXQvdXRpbGl0aWVzJztcblxuLyoqXHJcbiAqIE1vdmUgYW4gYXJyYXkgaXRlbSB0byBhIGRpZmZlcmVudCBwb3NpdGlvbi4gUmV0dXJucyBhIG5ldyBhcnJheSB3aXRoIHRoZSBpdGVtIG1vdmVkIHRvIHRoZSBuZXcgcG9zaXRpb24uXHJcbiAqL1xuZnVuY3Rpb24gYXJyYXlNb3ZlKGFycmF5LCBmcm9tLCB0bykge1xuICBjb25zdCBuZXdBcnJheSA9IGFycmF5LnNsaWNlKCk7XG4gIG5ld0FycmF5LnNwbGljZSh0byA8IDAgPyBuZXdBcnJheS5sZW5ndGggKyB0byA6IHRvLCAwLCBuZXdBcnJheS5zcGxpY2UoZnJvbSwgMSlbMF0pO1xuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbi8qKlxyXG4gKiBTd2FwIGFuIGFycmF5IGl0ZW0gdG8gYSBkaWZmZXJlbnQgcG9zaXRpb24uIFJldHVybnMgYSBuZXcgYXJyYXkgd2l0aCB0aGUgaXRlbSBzd2FwcGVkIHRvIHRoZSBuZXcgcG9zaXRpb24uXHJcbiAqL1xuZnVuY3Rpb24gYXJyYXlTd2FwKGFycmF5LCBmcm9tLCB0bykge1xuICBjb25zdCBuZXdBcnJheSA9IGFycmF5LnNsaWNlKCk7XG4gIG5ld0FycmF5W2Zyb21dID0gYXJyYXlbdG9dO1xuICBuZXdBcnJheVt0b10gPSBhcnJheVtmcm9tXTtcbiAgcmV0dXJuIG5ld0FycmF5O1xufVxuXG5mdW5jdGlvbiBnZXRTb3J0ZWRSZWN0cyhpdGVtcywgcmVjdHMpIHtcbiAgcmV0dXJuIGl0ZW1zLnJlZHVjZSgoYWNjdW11bGF0b3IsIGlkLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IHJlY3QgPSByZWN0cy5nZXQoaWQpO1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIGFjY3VtdWxhdG9yW2luZGV4XSA9IHJlY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICB9LCBBcnJheShpdGVtcy5sZW5ndGgpKTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEluZGV4KGluZGV4KSB7XG4gIHJldHVybiBpbmRleCAhPT0gbnVsbCAmJiBpbmRleCA+PSAwO1xufVxuXG5mdW5jdGlvbiBpdGVtc0VxdWFsKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVEaXNhYmxlZChkaXNhYmxlZCkge1xuICBpZiAodHlwZW9mIGRpc2FibGVkID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZHJhZ2dhYmxlOiBkaXNhYmxlZCxcbiAgICAgIGRyb3BwYWJsZTogZGlzYWJsZWRcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGRpc2FibGVkO1xufVxuXG4vLyBUby1kbzogV2Ugc2hvdWxkIGJlIGNhbGN1bGF0aW5nIHNjYWxlIHRyYW5zZm9ybWF0aW9uXG5jb25zdCBkZWZhdWx0U2NhbGUgPSB7XG4gIHNjYWxlWDogMSxcbiAgc2NhbGVZOiAxXG59O1xuY29uc3QgaG9yaXpvbnRhbExpc3RTb3J0aW5nU3RyYXRlZ3kgPSBfcmVmID0+IHtcbiAgdmFyIF9yZWN0cyRhY3RpdmVJbmRleDtcblxuICBsZXQge1xuICAgIHJlY3RzLFxuICAgIGFjdGl2ZU5vZGVSZWN0OiBmYWxsYmFja0FjdGl2ZVJlY3QsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgb3ZlckluZGV4LFxuICAgIGluZGV4XG4gIH0gPSBfcmVmO1xuICBjb25zdCBhY3RpdmVOb2RlUmVjdCA9IChfcmVjdHMkYWN0aXZlSW5kZXggPSByZWN0c1thY3RpdmVJbmRleF0pICE9IG51bGwgPyBfcmVjdHMkYWN0aXZlSW5kZXggOiBmYWxsYmFja0FjdGl2ZVJlY3Q7XG5cbiAgaWYgKCFhY3RpdmVOb2RlUmVjdCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgaXRlbUdhcCA9IGdldEl0ZW1HYXAocmVjdHMsIGluZGV4LCBhY3RpdmVJbmRleCk7XG5cbiAgaWYgKGluZGV4ID09PSBhY3RpdmVJbmRleCkge1xuICAgIGNvbnN0IG5ld0luZGV4UmVjdCA9IHJlY3RzW292ZXJJbmRleF07XG5cbiAgICBpZiAoIW5ld0luZGV4UmVjdCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGFjdGl2ZUluZGV4IDwgb3ZlckluZGV4ID8gbmV3SW5kZXhSZWN0LmxlZnQgKyBuZXdJbmRleFJlY3Qud2lkdGggLSAoYWN0aXZlTm9kZVJlY3QubGVmdCArIGFjdGl2ZU5vZGVSZWN0LndpZHRoKSA6IG5ld0luZGV4UmVjdC5sZWZ0IC0gYWN0aXZlTm9kZVJlY3QubGVmdCxcbiAgICAgIHk6IDAsXG4gICAgICAuLi5kZWZhdWx0U2NhbGVcbiAgICB9O1xuICB9XG5cbiAgaWYgKGluZGV4ID4gYWN0aXZlSW5kZXggJiYgaW5kZXggPD0gb3ZlckluZGV4KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IC1hY3RpdmVOb2RlUmVjdC53aWR0aCAtIGl0ZW1HYXAsXG4gICAgICB5OiAwLFxuICAgICAgLi4uZGVmYXVsdFNjYWxlXG4gICAgfTtcbiAgfVxuXG4gIGlmIChpbmRleCA8IGFjdGl2ZUluZGV4ICYmIGluZGV4ID49IG92ZXJJbmRleCkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBhY3RpdmVOb2RlUmVjdC53aWR0aCArIGl0ZW1HYXAsXG4gICAgICB5OiAwLFxuICAgICAgLi4uZGVmYXVsdFNjYWxlXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgeDogMCxcbiAgICB5OiAwLFxuICAgIC4uLmRlZmF1bHRTY2FsZVxuICB9O1xufTtcblxuZnVuY3Rpb24gZ2V0SXRlbUdhcChyZWN0cywgaW5kZXgsIGFjdGl2ZUluZGV4KSB7XG4gIGNvbnN0IGN1cnJlbnRSZWN0ID0gcmVjdHNbaW5kZXhdO1xuICBjb25zdCBwcmV2aW91c1JlY3QgPSByZWN0c1tpbmRleCAtIDFdO1xuICBjb25zdCBuZXh0UmVjdCA9IHJlY3RzW2luZGV4ICsgMV07XG5cbiAgaWYgKCFjdXJyZW50UmVjdCB8fCAhcHJldmlvdXNSZWN0ICYmICFuZXh0UmVjdCkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgaWYgKGFjdGl2ZUluZGV4IDwgaW5kZXgpIHtcbiAgICByZXR1cm4gcHJldmlvdXNSZWN0ID8gY3VycmVudFJlY3QubGVmdCAtIChwcmV2aW91c1JlY3QubGVmdCArIHByZXZpb3VzUmVjdC53aWR0aCkgOiBuZXh0UmVjdC5sZWZ0IC0gKGN1cnJlbnRSZWN0LmxlZnQgKyBjdXJyZW50UmVjdC53aWR0aCk7XG4gIH1cblxuICByZXR1cm4gbmV4dFJlY3QgPyBuZXh0UmVjdC5sZWZ0IC0gKGN1cnJlbnRSZWN0LmxlZnQgKyBjdXJyZW50UmVjdC53aWR0aCkgOiBjdXJyZW50UmVjdC5sZWZ0IC0gKHByZXZpb3VzUmVjdC5sZWZ0ICsgcHJldmlvdXNSZWN0LndpZHRoKTtcbn1cblxuY29uc3QgcmVjdFNvcnRpbmdTdHJhdGVneSA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIHJlY3RzLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIG92ZXJJbmRleCxcbiAgICBpbmRleFxuICB9ID0gX3JlZjtcbiAgY29uc3QgbmV3UmVjdHMgPSBhcnJheU1vdmUocmVjdHMsIG92ZXJJbmRleCwgYWN0aXZlSW5kZXgpO1xuICBjb25zdCBvbGRSZWN0ID0gcmVjdHNbaW5kZXhdO1xuICBjb25zdCBuZXdSZWN0ID0gbmV3UmVjdHNbaW5kZXhdO1xuXG4gIGlmICghbmV3UmVjdCB8fCAhb2xkUmVjdCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB4OiBuZXdSZWN0LmxlZnQgLSBvbGRSZWN0LmxlZnQsXG4gICAgeTogbmV3UmVjdC50b3AgLSBvbGRSZWN0LnRvcCxcbiAgICBzY2FsZVg6IG5ld1JlY3Qud2lkdGggLyBvbGRSZWN0LndpZHRoLFxuICAgIHNjYWxlWTogbmV3UmVjdC5oZWlnaHQgLyBvbGRSZWN0LmhlaWdodFxuICB9O1xufTtcblxuY29uc3QgcmVjdFN3YXBwaW5nU3RyYXRlZ3kgPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBhY3RpdmVJbmRleCxcbiAgICBpbmRleCxcbiAgICByZWN0cyxcbiAgICBvdmVySW5kZXhcbiAgfSA9IF9yZWY7XG4gIGxldCBvbGRSZWN0O1xuICBsZXQgbmV3UmVjdDtcblxuICBpZiAoaW5kZXggPT09IGFjdGl2ZUluZGV4KSB7XG4gICAgb2xkUmVjdCA9IHJlY3RzW2luZGV4XTtcbiAgICBuZXdSZWN0ID0gcmVjdHNbb3ZlckluZGV4XTtcbiAgfVxuXG4gIGlmIChpbmRleCA9PT0gb3ZlckluZGV4KSB7XG4gICAgb2xkUmVjdCA9IHJlY3RzW2luZGV4XTtcbiAgICBuZXdSZWN0ID0gcmVjdHNbYWN0aXZlSW5kZXhdO1xuICB9XG5cbiAgaWYgKCFuZXdSZWN0IHx8ICFvbGRSZWN0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHg6IG5ld1JlY3QubGVmdCAtIG9sZFJlY3QubGVmdCxcbiAgICB5OiBuZXdSZWN0LnRvcCAtIG9sZFJlY3QudG9wLFxuICAgIHNjYWxlWDogbmV3UmVjdC53aWR0aCAvIG9sZFJlY3Qud2lkdGgsXG4gICAgc2NhbGVZOiBuZXdSZWN0LmhlaWdodCAvIG9sZFJlY3QuaGVpZ2h0XG4gIH07XG59O1xuXG4vLyBUby1kbzogV2Ugc2hvdWxkIGJlIGNhbGN1bGF0aW5nIHNjYWxlIHRyYW5zZm9ybWF0aW9uXG5jb25zdCBkZWZhdWx0U2NhbGUkMSA9IHtcbiAgc2NhbGVYOiAxLFxuICBzY2FsZVk6IDFcbn07XG5jb25zdCB2ZXJ0aWNhbExpc3RTb3J0aW5nU3RyYXRlZ3kgPSBfcmVmID0+IHtcbiAgdmFyIF9yZWN0cyRhY3RpdmVJbmRleDtcblxuICBsZXQge1xuICAgIGFjdGl2ZUluZGV4LFxuICAgIGFjdGl2ZU5vZGVSZWN0OiBmYWxsYmFja0FjdGl2ZVJlY3QsXG4gICAgaW5kZXgsXG4gICAgcmVjdHMsXG4gICAgb3ZlckluZGV4XG4gIH0gPSBfcmVmO1xuICBjb25zdCBhY3RpdmVOb2RlUmVjdCA9IChfcmVjdHMkYWN0aXZlSW5kZXggPSByZWN0c1thY3RpdmVJbmRleF0pICE9IG51bGwgPyBfcmVjdHMkYWN0aXZlSW5kZXggOiBmYWxsYmFja0FjdGl2ZVJlY3Q7XG5cbiAgaWYgKCFhY3RpdmVOb2RlUmVjdCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGluZGV4ID09PSBhY3RpdmVJbmRleCkge1xuICAgIGNvbnN0IG92ZXJJbmRleFJlY3QgPSByZWN0c1tvdmVySW5kZXhdO1xuXG4gICAgaWYgKCFvdmVySW5kZXhSZWN0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IGFjdGl2ZUluZGV4IDwgb3ZlckluZGV4ID8gb3ZlckluZGV4UmVjdC50b3AgKyBvdmVySW5kZXhSZWN0LmhlaWdodCAtIChhY3RpdmVOb2RlUmVjdC50b3AgKyBhY3RpdmVOb2RlUmVjdC5oZWlnaHQpIDogb3ZlckluZGV4UmVjdC50b3AgLSBhY3RpdmVOb2RlUmVjdC50b3AsXG4gICAgICAuLi5kZWZhdWx0U2NhbGUkMVxuICAgIH07XG4gIH1cblxuICBjb25zdCBpdGVtR2FwID0gZ2V0SXRlbUdhcCQxKHJlY3RzLCBpbmRleCwgYWN0aXZlSW5kZXgpO1xuXG4gIGlmIChpbmRleCA+IGFjdGl2ZUluZGV4ICYmIGluZGV4IDw9IG92ZXJJbmRleCkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiAwLFxuICAgICAgeTogLWFjdGl2ZU5vZGVSZWN0LmhlaWdodCAtIGl0ZW1HYXAsXG4gICAgICAuLi5kZWZhdWx0U2NhbGUkMVxuICAgIH07XG4gIH1cblxuICBpZiAoaW5kZXggPCBhY3RpdmVJbmRleCAmJiBpbmRleCA+PSBvdmVySW5kZXgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IGFjdGl2ZU5vZGVSZWN0LmhlaWdodCArIGl0ZW1HYXAsXG4gICAgICAuLi5kZWZhdWx0U2NhbGUkMVxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHg6IDAsXG4gICAgeTogMCxcbiAgICAuLi5kZWZhdWx0U2NhbGUkMVxuICB9O1xufTtcblxuZnVuY3Rpb24gZ2V0SXRlbUdhcCQxKGNsaWVudFJlY3RzLCBpbmRleCwgYWN0aXZlSW5kZXgpIHtcbiAgY29uc3QgY3VycmVudFJlY3QgPSBjbGllbnRSZWN0c1tpbmRleF07XG4gIGNvbnN0IHByZXZpb3VzUmVjdCA9IGNsaWVudFJlY3RzW2luZGV4IC0gMV07XG4gIGNvbnN0IG5leHRSZWN0ID0gY2xpZW50UmVjdHNbaW5kZXggKyAxXTtcblxuICBpZiAoIWN1cnJlbnRSZWN0KSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBpZiAoYWN0aXZlSW5kZXggPCBpbmRleCkge1xuICAgIHJldHVybiBwcmV2aW91c1JlY3QgPyBjdXJyZW50UmVjdC50b3AgLSAocHJldmlvdXNSZWN0LnRvcCArIHByZXZpb3VzUmVjdC5oZWlnaHQpIDogbmV4dFJlY3QgPyBuZXh0UmVjdC50b3AgLSAoY3VycmVudFJlY3QudG9wICsgY3VycmVudFJlY3QuaGVpZ2h0KSA6IDA7XG4gIH1cblxuICByZXR1cm4gbmV4dFJlY3QgPyBuZXh0UmVjdC50b3AgLSAoY3VycmVudFJlY3QudG9wICsgY3VycmVudFJlY3QuaGVpZ2h0KSA6IHByZXZpb3VzUmVjdCA/IGN1cnJlbnRSZWN0LnRvcCAtIChwcmV2aW91c1JlY3QudG9wICsgcHJldmlvdXNSZWN0LmhlaWdodCkgOiAwO1xufVxuXG5jb25zdCBJRF9QUkVGSVggPSAnU29ydGFibGUnO1xuY29uc3QgQ29udGV4dCA9IC8qI19fUFVSRV9fKi9SZWFjdC5jcmVhdGVDb250ZXh0KHtcbiAgYWN0aXZlSW5kZXg6IC0xLFxuICBjb250YWluZXJJZDogSURfUFJFRklYLFxuICBkaXNhYmxlVHJhbnNmb3JtczogZmFsc2UsXG4gIGl0ZW1zOiBbXSxcbiAgb3ZlckluZGV4OiAtMSxcbiAgdXNlRHJhZ092ZXJsYXk6IGZhbHNlLFxuICBzb3J0ZWRSZWN0czogW10sXG4gIHN0cmF0ZWd5OiByZWN0U29ydGluZ1N0cmF0ZWd5LFxuICBkaXNhYmxlZDoge1xuICAgIGRyYWdnYWJsZTogZmFsc2UsXG4gICAgZHJvcHBhYmxlOiBmYWxzZVxuICB9XG59KTtcbmZ1bmN0aW9uIFNvcnRhYmxlQ29udGV4dChfcmVmKSB7XG4gIGxldCB7XG4gICAgY2hpbGRyZW4sXG4gICAgaWQsXG4gICAgaXRlbXM6IHVzZXJEZWZpbmVkSXRlbXMsXG4gICAgc3RyYXRlZ3kgPSByZWN0U29ydGluZ1N0cmF0ZWd5LFxuICAgIGRpc2FibGVkOiBkaXNhYmxlZFByb3AgPSBmYWxzZVxuICB9ID0gX3JlZjtcbiAgY29uc3Qge1xuICAgIGFjdGl2ZSxcbiAgICBkcmFnT3ZlcmxheSxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBvdmVyLFxuICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzXG4gIH0gPSB1c2VEbmRDb250ZXh0KCk7XG4gIGNvbnN0IGNvbnRhaW5lcklkID0gdXNlVW5pcXVlSWQoSURfUFJFRklYLCBpZCk7XG4gIGNvbnN0IHVzZURyYWdPdmVybGF5ID0gQm9vbGVhbihkcmFnT3ZlcmxheS5yZWN0ICE9PSBudWxsKTtcbiAgY29uc3QgaXRlbXMgPSB1c2VNZW1vKCgpID0+IHVzZXJEZWZpbmVkSXRlbXMubWFwKGl0ZW0gPT4gdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnICYmICdpZCcgaW4gaXRlbSA/IGl0ZW0uaWQgOiBpdGVtKSwgW3VzZXJEZWZpbmVkSXRlbXNdKTtcbiAgY29uc3QgaXNEcmFnZ2luZyA9IGFjdGl2ZSAhPSBudWxsO1xuICBjb25zdCBhY3RpdmVJbmRleCA9IGFjdGl2ZSA/IGl0ZW1zLmluZGV4T2YoYWN0aXZlLmlkKSA6IC0xO1xuICBjb25zdCBvdmVySW5kZXggPSBvdmVyID8gaXRlbXMuaW5kZXhPZihvdmVyLmlkKSA6IC0xO1xuICBjb25zdCBwcmV2aW91c0l0ZW1zUmVmID0gdXNlUmVmKGl0ZW1zKTtcbiAgY29uc3QgaXRlbXNIYXZlQ2hhbmdlZCA9ICFpdGVtc0VxdWFsKGl0ZW1zLCBwcmV2aW91c0l0ZW1zUmVmLmN1cnJlbnQpO1xuICBjb25zdCBkaXNhYmxlVHJhbnNmb3JtcyA9IG92ZXJJbmRleCAhPT0gLTEgJiYgYWN0aXZlSW5kZXggPT09IC0xIHx8IGl0ZW1zSGF2ZUNoYW5nZWQ7XG4gIGNvbnN0IGRpc2FibGVkID0gbm9ybWFsaXplRGlzYWJsZWQoZGlzYWJsZWRQcm9wKTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGl0ZW1zSGF2ZUNoYW5nZWQgJiYgaXNEcmFnZ2luZykge1xuICAgICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMoaXRlbXMpO1xuICAgIH1cbiAgfSwgW2l0ZW1zSGF2ZUNoYW5nZWQsIGl0ZW1zLCBpc0RyYWdnaW5nLCBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyc10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHByZXZpb3VzSXRlbXNSZWYuY3VycmVudCA9IGl0ZW1zO1xuICB9LCBbaXRlbXNdKTtcbiAgY29uc3QgY29udGV4dFZhbHVlID0gdXNlTWVtbygoKSA9PiAoe1xuICAgIGFjdGl2ZUluZGV4LFxuICAgIGNvbnRhaW5lcklkLFxuICAgIGRpc2FibGVkLFxuICAgIGRpc2FibGVUcmFuc2Zvcm1zLFxuICAgIGl0ZW1zLFxuICAgIG92ZXJJbmRleCxcbiAgICB1c2VEcmFnT3ZlcmxheSxcbiAgICBzb3J0ZWRSZWN0czogZ2V0U29ydGVkUmVjdHMoaXRlbXMsIGRyb3BwYWJsZVJlY3RzKSxcbiAgICBzdHJhdGVneVxuICB9KSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbYWN0aXZlSW5kZXgsIGNvbnRhaW5lcklkLCBkaXNhYmxlZC5kcmFnZ2FibGUsIGRpc2FibGVkLmRyb3BwYWJsZSwgZGlzYWJsZVRyYW5zZm9ybXMsIGl0ZW1zLCBvdmVySW5kZXgsIGRyb3BwYWJsZVJlY3RzLCB1c2VEcmFnT3ZlcmxheSwgc3RyYXRlZ3ldKTtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBjb250ZXh0VmFsdWVcbiAgfSwgY2hpbGRyZW4pO1xufVxuXG5jb25zdCBkZWZhdWx0TmV3SW5kZXhHZXR0ZXIgPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBpZCxcbiAgICBpdGVtcyxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBvdmVySW5kZXhcbiAgfSA9IF9yZWY7XG4gIHJldHVybiBhcnJheU1vdmUoaXRlbXMsIGFjdGl2ZUluZGV4LCBvdmVySW5kZXgpLmluZGV4T2YoaWQpO1xufTtcbmNvbnN0IGRlZmF1bHRBbmltYXRlTGF5b3V0Q2hhbmdlcyA9IF9yZWYyID0+IHtcbiAgbGV0IHtcbiAgICBjb250YWluZXJJZCxcbiAgICBpc1NvcnRpbmcsXG4gICAgd2FzRHJhZ2dpbmcsXG4gICAgaW5kZXgsXG4gICAgaXRlbXMsXG4gICAgbmV3SW5kZXgsXG4gICAgcHJldmlvdXNJdGVtcyxcbiAgICBwcmV2aW91c0NvbnRhaW5lcklkLFxuICAgIHRyYW5zaXRpb25cbiAgfSA9IF9yZWYyO1xuXG4gIGlmICghdHJhbnNpdGlvbiB8fCAhd2FzRHJhZ2dpbmcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAocHJldmlvdXNJdGVtcyAhPT0gaXRlbXMgJiYgaW5kZXggPT09IG5ld0luZGV4KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGlzU29ydGluZykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIG5ld0luZGV4ICE9PSBpbmRleCAmJiBjb250YWluZXJJZCA9PT0gcHJldmlvdXNDb250YWluZXJJZDtcbn07XG5jb25zdCBkZWZhdWx0VHJhbnNpdGlvbiA9IHtcbiAgZHVyYXRpb246IDIwMCxcbiAgZWFzaW5nOiAnZWFzZSdcbn07XG5jb25zdCB0cmFuc2l0aW9uUHJvcGVydHkgPSAndHJhbnNmb3JtJztcbmNvbnN0IGRpc2FibGVkVHJhbnNpdGlvbiA9IC8qI19fUFVSRV9fKi9DU1MuVHJhbnNpdGlvbi50b1N0cmluZyh7XG4gIHByb3BlcnR5OiB0cmFuc2l0aW9uUHJvcGVydHksXG4gIGR1cmF0aW9uOiAwLFxuICBlYXNpbmc6ICdsaW5lYXInXG59KTtcbmNvbnN0IGRlZmF1bHRBdHRyaWJ1dGVzID0ge1xuICByb2xlRGVzY3JpcHRpb246ICdzb3J0YWJsZSdcbn07XG5cbi8qXHJcbiAqIFdoZW4gdGhlIGluZGV4IG9mIGFuIGl0ZW0gY2hhbmdlcyB3aGlsZSBzb3J0aW5nLFxyXG4gKiB3ZSBuZWVkIHRvIHRlbXBvcmFyaWx5IGRpc2FibGUgdGhlIHRyYW5zZm9ybXNcclxuICovXG5cbmZ1bmN0aW9uIHVzZURlcml2ZWRUcmFuc2Zvcm0oX3JlZikge1xuICBsZXQge1xuICAgIGRpc2FibGVkLFxuICAgIGluZGV4LFxuICAgIG5vZGUsXG4gICAgcmVjdFxuICB9ID0gX3JlZjtcbiAgY29uc3QgW2Rlcml2ZWRUcmFuc2Zvcm0sIHNldERlcml2ZWR0cmFuc2Zvcm1dID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IHByZXZpb3VzSW5kZXggPSB1c2VSZWYoaW5kZXgpO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWRpc2FibGVkICYmIGluZGV4ICE9PSBwcmV2aW91c0luZGV4LmN1cnJlbnQgJiYgbm9kZS5jdXJyZW50KSB7XG4gICAgICBjb25zdCBpbml0aWFsID0gcmVjdC5jdXJyZW50O1xuXG4gICAgICBpZiAoaW5pdGlhbCkge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gZ2V0Q2xpZW50UmVjdChub2RlLmN1cnJlbnQsIHtcbiAgICAgICAgICBpZ25vcmVUcmFuc2Zvcm06IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGRlbHRhID0ge1xuICAgICAgICAgIHg6IGluaXRpYWwubGVmdCAtIGN1cnJlbnQubGVmdCxcbiAgICAgICAgICB5OiBpbml0aWFsLnRvcCAtIGN1cnJlbnQudG9wLFxuICAgICAgICAgIHNjYWxlWDogaW5pdGlhbC53aWR0aCAvIGN1cnJlbnQud2lkdGgsXG4gICAgICAgICAgc2NhbGVZOiBpbml0aWFsLmhlaWdodCAvIGN1cnJlbnQuaGVpZ2h0XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGRlbHRhLnggfHwgZGVsdGEueSkge1xuICAgICAgICAgIHNldERlcml2ZWR0cmFuc2Zvcm0oZGVsdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGluZGV4ICE9PSBwcmV2aW91c0luZGV4LmN1cnJlbnQpIHtcbiAgICAgIHByZXZpb3VzSW5kZXguY3VycmVudCA9IGluZGV4O1xuICAgIH1cbiAgfSwgW2Rpc2FibGVkLCBpbmRleCwgbm9kZSwgcmVjdF0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkZXJpdmVkVHJhbnNmb3JtKSB7XG4gICAgICBzZXREZXJpdmVkdHJhbnNmb3JtKG51bGwpO1xuICAgIH1cbiAgfSwgW2Rlcml2ZWRUcmFuc2Zvcm1dKTtcbiAgcmV0dXJuIGRlcml2ZWRUcmFuc2Zvcm07XG59XG5cbmZ1bmN0aW9uIHVzZVNvcnRhYmxlKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBhbmltYXRlTGF5b3V0Q2hhbmdlcyA9IGRlZmF1bHRBbmltYXRlTGF5b3V0Q2hhbmdlcyxcbiAgICBhdHRyaWJ1dGVzOiB1c2VyRGVmaW5lZEF0dHJpYnV0ZXMsXG4gICAgZGlzYWJsZWQ6IGxvY2FsRGlzYWJsZWQsXG4gICAgZGF0YTogY3VzdG9tRGF0YSxcbiAgICBnZXROZXdJbmRleCA9IGRlZmF1bHROZXdJbmRleEdldHRlcixcbiAgICBpZCxcbiAgICBzdHJhdGVneTogbG9jYWxTdHJhdGVneSxcbiAgICByZXNpemVPYnNlcnZlckNvbmZpZyxcbiAgICB0cmFuc2l0aW9uID0gZGVmYXVsdFRyYW5zaXRpb25cbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHtcbiAgICBpdGVtcyxcbiAgICBjb250YWluZXJJZCxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBkaXNhYmxlZDogZ2xvYmFsRGlzYWJsZWQsXG4gICAgZGlzYWJsZVRyYW5zZm9ybXMsXG4gICAgc29ydGVkUmVjdHMsXG4gICAgb3ZlckluZGV4LFxuICAgIHVzZURyYWdPdmVybGF5LFxuICAgIHN0cmF0ZWd5OiBnbG9iYWxTdHJhdGVneVxuICB9ID0gdXNlQ29udGV4dChDb250ZXh0KTtcbiAgY29uc3QgZGlzYWJsZWQgPSBub3JtYWxpemVMb2NhbERpc2FibGVkKGxvY2FsRGlzYWJsZWQsIGdsb2JhbERpc2FibGVkKTtcbiAgY29uc3QgaW5kZXggPSBpdGVtcy5pbmRleE9mKGlkKTtcbiAgY29uc3QgZGF0YSA9IHVzZU1lbW8oKCkgPT4gKHtcbiAgICBzb3J0YWJsZToge1xuICAgICAgY29udGFpbmVySWQsXG4gICAgICBpbmRleCxcbiAgICAgIGl0ZW1zXG4gICAgfSxcbiAgICAuLi5jdXN0b21EYXRhXG4gIH0pLCBbY29udGFpbmVySWQsIGN1c3RvbURhdGEsIGluZGV4LCBpdGVtc10pO1xuICBjb25zdCBpdGVtc0FmdGVyQ3VycmVudFNvcnRhYmxlID0gdXNlTWVtbygoKSA9PiBpdGVtcy5zbGljZShpdGVtcy5pbmRleE9mKGlkKSksIFtpdGVtcywgaWRdKTtcbiAgY29uc3Qge1xuICAgIHJlY3QsXG4gICAgbm9kZSxcbiAgICBpc092ZXIsXG4gICAgc2V0Tm9kZVJlZjogc2V0RHJvcHBhYmxlTm9kZVJlZlxuICB9ID0gdXNlRHJvcHBhYmxlKHtcbiAgICBpZCxcbiAgICBkYXRhLFxuICAgIGRpc2FibGVkOiBkaXNhYmxlZC5kcm9wcGFibGUsXG4gICAgcmVzaXplT2JzZXJ2ZXJDb25maWc6IHtcbiAgICAgIHVwZGF0ZU1lYXN1cmVtZW50c0ZvcjogaXRlbXNBZnRlckN1cnJlbnRTb3J0YWJsZSxcbiAgICAgIC4uLnJlc2l6ZU9ic2VydmVyQ29uZmlnXG4gICAgfVxuICB9KTtcbiAgY29uc3Qge1xuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBhdHRyaWJ1dGVzLFxuICAgIHNldE5vZGVSZWY6IHNldERyYWdnYWJsZU5vZGVSZWYsXG4gICAgbGlzdGVuZXJzLFxuICAgIGlzRHJhZ2dpbmcsXG4gICAgb3ZlcixcbiAgICBzZXRBY3RpdmF0b3JOb2RlUmVmLFxuICAgIHRyYW5zZm9ybVxuICB9ID0gdXNlRHJhZ2dhYmxlKHtcbiAgICBpZCxcbiAgICBkYXRhLFxuICAgIGF0dHJpYnV0ZXM6IHsgLi4uZGVmYXVsdEF0dHJpYnV0ZXMsXG4gICAgICAuLi51c2VyRGVmaW5lZEF0dHJpYnV0ZXNcbiAgICB9LFxuICAgIGRpc2FibGVkOiBkaXNhYmxlZC5kcmFnZ2FibGVcbiAgfSk7XG4gIGNvbnN0IHNldE5vZGVSZWYgPSB1c2VDb21iaW5lZFJlZnMoc2V0RHJvcHBhYmxlTm9kZVJlZiwgc2V0RHJhZ2dhYmxlTm9kZVJlZik7XG4gIGNvbnN0IGlzU29ydGluZyA9IEJvb2xlYW4oYWN0aXZlKTtcbiAgY29uc3QgZGlzcGxhY2VJdGVtID0gaXNTb3J0aW5nICYmICFkaXNhYmxlVHJhbnNmb3JtcyAmJiBpc1ZhbGlkSW5kZXgoYWN0aXZlSW5kZXgpICYmIGlzVmFsaWRJbmRleChvdmVySW5kZXgpO1xuICBjb25zdCBzaG91bGREaXNwbGFjZURyYWdTb3VyY2UgPSAhdXNlRHJhZ092ZXJsYXkgJiYgaXNEcmFnZ2luZztcbiAgY29uc3QgZHJhZ1NvdXJjZURpc3BsYWNlbWVudCA9IHNob3VsZERpc3BsYWNlRHJhZ1NvdXJjZSAmJiBkaXNwbGFjZUl0ZW0gPyB0cmFuc2Zvcm0gOiBudWxsO1xuICBjb25zdCBzdHJhdGVneSA9IGxvY2FsU3RyYXRlZ3kgIT0gbnVsbCA/IGxvY2FsU3RyYXRlZ3kgOiBnbG9iYWxTdHJhdGVneTtcbiAgY29uc3QgZmluYWxUcmFuc2Zvcm0gPSBkaXNwbGFjZUl0ZW0gPyBkcmFnU291cmNlRGlzcGxhY2VtZW50ICE9IG51bGwgPyBkcmFnU291cmNlRGlzcGxhY2VtZW50IDogc3RyYXRlZ3koe1xuICAgIHJlY3RzOiBzb3J0ZWRSZWN0cyxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBvdmVySW5kZXgsXG4gICAgaW5kZXhcbiAgfSkgOiBudWxsO1xuICBjb25zdCBuZXdJbmRleCA9IGlzVmFsaWRJbmRleChhY3RpdmVJbmRleCkgJiYgaXNWYWxpZEluZGV4KG92ZXJJbmRleCkgPyBnZXROZXdJbmRleCh7XG4gICAgaWQsXG4gICAgaXRlbXMsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgb3ZlckluZGV4XG4gIH0pIDogaW5kZXg7XG4gIGNvbnN0IGFjdGl2ZUlkID0gYWN0aXZlID09IG51bGwgPyB2b2lkIDAgOiBhY3RpdmUuaWQ7XG4gIGNvbnN0IHByZXZpb3VzID0gdXNlUmVmKHtcbiAgICBhY3RpdmVJZCxcbiAgICBpdGVtcyxcbiAgICBuZXdJbmRleCxcbiAgICBjb250YWluZXJJZFxuICB9KTtcbiAgY29uc3QgaXRlbXNIYXZlQ2hhbmdlZCA9IGl0ZW1zICE9PSBwcmV2aW91cy5jdXJyZW50Lml0ZW1zO1xuICBjb25zdCBzaG91bGRBbmltYXRlTGF5b3V0Q2hhbmdlcyA9IGFuaW1hdGVMYXlvdXRDaGFuZ2VzKHtcbiAgICBhY3RpdmUsXG4gICAgY29udGFpbmVySWQsXG4gICAgaXNEcmFnZ2luZyxcbiAgICBpc1NvcnRpbmcsXG4gICAgaWQsXG4gICAgaW5kZXgsXG4gICAgaXRlbXMsXG4gICAgbmV3SW5kZXg6IHByZXZpb3VzLmN1cnJlbnQubmV3SW5kZXgsXG4gICAgcHJldmlvdXNJdGVtczogcHJldmlvdXMuY3VycmVudC5pdGVtcyxcbiAgICBwcmV2aW91c0NvbnRhaW5lcklkOiBwcmV2aW91cy5jdXJyZW50LmNvbnRhaW5lcklkLFxuICAgIHRyYW5zaXRpb24sXG4gICAgd2FzRHJhZ2dpbmc6IHByZXZpb3VzLmN1cnJlbnQuYWN0aXZlSWQgIT0gbnVsbFxuICB9KTtcbiAgY29uc3QgZGVyaXZlZFRyYW5zZm9ybSA9IHVzZURlcml2ZWRUcmFuc2Zvcm0oe1xuICAgIGRpc2FibGVkOiAhc2hvdWxkQW5pbWF0ZUxheW91dENoYW5nZXMsXG4gICAgaW5kZXgsXG4gICAgbm9kZSxcbiAgICByZWN0XG4gIH0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc1NvcnRpbmcgJiYgcHJldmlvdXMuY3VycmVudC5uZXdJbmRleCAhPT0gbmV3SW5kZXgpIHtcbiAgICAgIHByZXZpb3VzLmN1cnJlbnQubmV3SW5kZXggPSBuZXdJbmRleDtcbiAgICB9XG5cbiAgICBpZiAoY29udGFpbmVySWQgIT09IHByZXZpb3VzLmN1cnJlbnQuY29udGFpbmVySWQpIHtcbiAgICAgIHByZXZpb3VzLmN1cnJlbnQuY29udGFpbmVySWQgPSBjb250YWluZXJJZDtcbiAgICB9XG5cbiAgICBpZiAoaXRlbXMgIT09IHByZXZpb3VzLmN1cnJlbnQuaXRlbXMpIHtcbiAgICAgIHByZXZpb3VzLmN1cnJlbnQuaXRlbXMgPSBpdGVtcztcbiAgICB9XG4gIH0sIFtpc1NvcnRpbmcsIG5ld0luZGV4LCBjb250YWluZXJJZCwgaXRlbXNdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoYWN0aXZlSWQgPT09IHByZXZpb3VzLmN1cnJlbnQuYWN0aXZlSWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYWN0aXZlSWQgIT0gbnVsbCAmJiBwcmV2aW91cy5jdXJyZW50LmFjdGl2ZUlkID09IG51bGwpIHtcbiAgICAgIHByZXZpb3VzLmN1cnJlbnQuYWN0aXZlSWQgPSBhY3RpdmVJZDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHByZXZpb3VzLmN1cnJlbnQuYWN0aXZlSWQgPSBhY3RpdmVJZDtcbiAgICB9LCA1MCk7XG4gICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICB9LCBbYWN0aXZlSWRdKTtcbiAgcmV0dXJuIHtcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgYXR0cmlidXRlcyxcbiAgICBkYXRhLFxuICAgIHJlY3QsXG4gICAgaW5kZXgsXG4gICAgbmV3SW5kZXgsXG4gICAgaXRlbXMsXG4gICAgaXNPdmVyLFxuICAgIGlzU29ydGluZyxcbiAgICBpc0RyYWdnaW5nLFxuICAgIGxpc3RlbmVycyxcbiAgICBub2RlLFxuICAgIG92ZXJJbmRleCxcbiAgICBvdmVyLFxuICAgIHNldE5vZGVSZWYsXG4gICAgc2V0QWN0aXZhdG9yTm9kZVJlZixcbiAgICBzZXREcm9wcGFibGVOb2RlUmVmLFxuICAgIHNldERyYWdnYWJsZU5vZGVSZWYsXG4gICAgdHJhbnNmb3JtOiBkZXJpdmVkVHJhbnNmb3JtICE9IG51bGwgPyBkZXJpdmVkVHJhbnNmb3JtIDogZmluYWxUcmFuc2Zvcm0sXG4gICAgdHJhbnNpdGlvbjogZ2V0VHJhbnNpdGlvbigpXG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0VHJhbnNpdGlvbigpIHtcbiAgICBpZiAoIC8vIFRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNpdGlvbnMgZm9yIGEgc2luZ2xlIGZyYW1lIHRvIHNldCB1cCBkZXJpdmVkIHRyYW5zZm9ybXNcbiAgICBkZXJpdmVkVHJhbnNmb3JtIHx8IC8vIE9yIHRvIHByZXZlbnQgaXRlbXMganVtcGluZyB0byBiYWNrIHRvIHRoZWlyIFwibmV3XCIgcG9zaXRpb24gd2hlbiBpdGVtcyBjaGFuZ2VcbiAgICBpdGVtc0hhdmVDaGFuZ2VkICYmIHByZXZpb3VzLmN1cnJlbnQubmV3SW5kZXggPT09IGluZGV4KSB7XG4gICAgICByZXR1cm4gZGlzYWJsZWRUcmFuc2l0aW9uO1xuICAgIH1cblxuICAgIGlmIChzaG91bGREaXNwbGFjZURyYWdTb3VyY2UgJiYgIWlzS2V5Ym9hcmRFdmVudChhY3RpdmF0b3JFdmVudCkgfHwgIXRyYW5zaXRpb24pIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKGlzU29ydGluZyB8fCBzaG91bGRBbmltYXRlTGF5b3V0Q2hhbmdlcykge1xuICAgICAgcmV0dXJuIENTUy5UcmFuc2l0aW9uLnRvU3RyaW5nKHsgLi4udHJhbnNpdGlvbixcbiAgICAgICAgcHJvcGVydHk6IHRyYW5zaXRpb25Qcm9wZXJ0eVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMb2NhbERpc2FibGVkKGxvY2FsRGlzYWJsZWQsIGdsb2JhbERpc2FibGVkKSB7XG4gIHZhciBfbG9jYWxEaXNhYmxlZCRkcmFnZ2EsIF9sb2NhbERpc2FibGVkJGRyb3BwYTtcblxuICBpZiAodHlwZW9mIGxvY2FsRGlzYWJsZWQgPT09ICdib29sZWFuJykge1xuICAgIHJldHVybiB7XG4gICAgICBkcmFnZ2FibGU6IGxvY2FsRGlzYWJsZWQsXG4gICAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgICAgZHJvcHBhYmxlOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRyYWdnYWJsZTogKF9sb2NhbERpc2FibGVkJGRyYWdnYSA9IGxvY2FsRGlzYWJsZWQgPT0gbnVsbCA/IHZvaWQgMCA6IGxvY2FsRGlzYWJsZWQuZHJhZ2dhYmxlKSAhPSBudWxsID8gX2xvY2FsRGlzYWJsZWQkZHJhZ2dhIDogZ2xvYmFsRGlzYWJsZWQuZHJhZ2dhYmxlLFxuICAgIGRyb3BwYWJsZTogKF9sb2NhbERpc2FibGVkJGRyb3BwYSA9IGxvY2FsRGlzYWJsZWQgPT0gbnVsbCA/IHZvaWQgMCA6IGxvY2FsRGlzYWJsZWQuZHJvcHBhYmxlKSAhPSBudWxsID8gX2xvY2FsRGlzYWJsZWQkZHJvcHBhIDogZ2xvYmFsRGlzYWJsZWQuZHJvcHBhYmxlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhhc1NvcnRhYmxlRGF0YShlbnRyeSkge1xuICBpZiAoIWVudHJ5KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgZGF0YSA9IGVudHJ5LmRhdGEuY3VycmVudDtcblxuICBpZiAoZGF0YSAmJiAnc29ydGFibGUnIGluIGRhdGEgJiYgdHlwZW9mIGRhdGEuc29ydGFibGUgPT09ICdvYmplY3QnICYmICdjb250YWluZXJJZCcgaW4gZGF0YS5zb3J0YWJsZSAmJiAnaXRlbXMnIGluIGRhdGEuc29ydGFibGUgJiYgJ2luZGV4JyBpbiBkYXRhLnNvcnRhYmxlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmNvbnN0IGRpcmVjdGlvbnMgPSBbS2V5Ym9hcmRDb2RlLkRvd24sIEtleWJvYXJkQ29kZS5SaWdodCwgS2V5Ym9hcmRDb2RlLlVwLCBLZXlib2FyZENvZGUuTGVmdF07XG5jb25zdCBzb3J0YWJsZUtleWJvYXJkQ29vcmRpbmF0ZXMgPSAoZXZlbnQsIF9yZWYpID0+IHtcbiAgbGV0IHtcbiAgICBjb250ZXh0OiB7XG4gICAgICBhY3RpdmUsXG4gICAgICBjb2xsaXNpb25SZWN0LFxuICAgICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgICAgb3ZlcixcbiAgICAgIHNjcm9sbGFibGVBbmNlc3RvcnNcbiAgICB9XG4gIH0gPSBfcmVmO1xuXG4gIGlmIChkaXJlY3Rpb25zLmluY2x1ZGVzKGV2ZW50LmNvZGUpKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmICghYWN0aXZlIHx8ICFjb2xsaXNpb25SZWN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsdGVyZWRDb250YWluZXJzID0gW107XG4gICAgZHJvcHBhYmxlQ29udGFpbmVycy5nZXRFbmFibGVkKCkuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBpZiAoIWVudHJ5IHx8IGVudHJ5ICE9IG51bGwgJiYgZW50cnkuZGlzYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZWN0ID0gZHJvcHBhYmxlUmVjdHMuZ2V0KGVudHJ5LmlkKTtcblxuICAgICAgaWYgKCFyZWN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChldmVudC5jb2RlKSB7XG4gICAgICAgIGNhc2UgS2V5Ym9hcmRDb2RlLkRvd246XG4gICAgICAgICAgaWYgKGNvbGxpc2lvblJlY3QudG9wIDwgcmVjdC50b3ApIHtcbiAgICAgICAgICAgIGZpbHRlcmVkQ29udGFpbmVycy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIEtleWJvYXJkQ29kZS5VcDpcbiAgICAgICAgICBpZiAoY29sbGlzaW9uUmVjdC50b3AgPiByZWN0LnRvcCkge1xuICAgICAgICAgICAgZmlsdGVyZWRDb250YWluZXJzLnB1c2goZW50cnkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgS2V5Ym9hcmRDb2RlLkxlZnQ6XG4gICAgICAgICAgaWYgKGNvbGxpc2lvblJlY3QubGVmdCA+IHJlY3QubGVmdCkge1xuICAgICAgICAgICAgZmlsdGVyZWRDb250YWluZXJzLnB1c2goZW50cnkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgS2V5Ym9hcmRDb2RlLlJpZ2h0OlxuICAgICAgICAgIGlmIChjb2xsaXNpb25SZWN0LmxlZnQgPCByZWN0LmxlZnQpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkQ29udGFpbmVycy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBjb2xsaXNpb25zID0gY2xvc2VzdENvcm5lcnMoe1xuICAgICAgYWN0aXZlLFxuICAgICAgY29sbGlzaW9uUmVjdDogY29sbGlzaW9uUmVjdCxcbiAgICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgICAgZHJvcHBhYmxlQ29udGFpbmVyczogZmlsdGVyZWRDb250YWluZXJzLFxuICAgICAgcG9pbnRlckNvb3JkaW5hdGVzOiBudWxsXG4gICAgfSk7XG4gICAgbGV0IGNsb3Nlc3RJZCA9IGdldEZpcnN0Q29sbGlzaW9uKGNvbGxpc2lvbnMsICdpZCcpO1xuXG4gICAgaWYgKGNsb3Nlc3RJZCA9PT0gKG92ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG92ZXIuaWQpICYmIGNvbGxpc2lvbnMubGVuZ3RoID4gMSkge1xuICAgICAgY2xvc2VzdElkID0gY29sbGlzaW9uc1sxXS5pZDtcbiAgICB9XG5cbiAgICBpZiAoY2xvc2VzdElkICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZURyb3BwYWJsZSA9IGRyb3BwYWJsZUNvbnRhaW5lcnMuZ2V0KGFjdGl2ZS5pZCk7XG4gICAgICBjb25zdCBuZXdEcm9wcGFibGUgPSBkcm9wcGFibGVDb250YWluZXJzLmdldChjbG9zZXN0SWQpO1xuICAgICAgY29uc3QgbmV3UmVjdCA9IG5ld0Ryb3BwYWJsZSA/IGRyb3BwYWJsZVJlY3RzLmdldChuZXdEcm9wcGFibGUuaWQpIDogbnVsbDtcbiAgICAgIGNvbnN0IG5ld05vZGUgPSBuZXdEcm9wcGFibGUgPT0gbnVsbCA/IHZvaWQgMCA6IG5ld0Ryb3BwYWJsZS5ub2RlLmN1cnJlbnQ7XG5cbiAgICAgIGlmIChuZXdOb2RlICYmIG5ld1JlY3QgJiYgYWN0aXZlRHJvcHBhYmxlICYmIG5ld0Ryb3BwYWJsZSkge1xuICAgICAgICBjb25zdCBuZXdTY3JvbGxBbmNlc3RvcnMgPSBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzKG5ld05vZGUpO1xuICAgICAgICBjb25zdCBoYXNEaWZmZXJlbnRTY3JvbGxBbmNlc3RvcnMgPSBuZXdTY3JvbGxBbmNlc3RvcnMuc29tZSgoZWxlbWVudCwgaW5kZXgpID0+IHNjcm9sbGFibGVBbmNlc3RvcnNbaW5kZXhdICE9PSBlbGVtZW50KTtcbiAgICAgICAgY29uc3QgaGFzU2FtZUNvbnRhaW5lciA9IGlzU2FtZUNvbnRhaW5lcihhY3RpdmVEcm9wcGFibGUsIG5ld0Ryb3BwYWJsZSk7XG4gICAgICAgIGNvbnN0IGlzQWZ0ZXJBY3RpdmUgPSBpc0FmdGVyKGFjdGl2ZURyb3BwYWJsZSwgbmV3RHJvcHBhYmxlKTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gaGFzRGlmZmVyZW50U2Nyb2xsQW5jZXN0b3JzIHx8ICFoYXNTYW1lQ29udGFpbmVyID8ge1xuICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgeTogMFxuICAgICAgICB9IDoge1xuICAgICAgICAgIHg6IGlzQWZ0ZXJBY3RpdmUgPyBjb2xsaXNpb25SZWN0LndpZHRoIC0gbmV3UmVjdC53aWR0aCA6IDAsXG4gICAgICAgICAgeTogaXNBZnRlckFjdGl2ZSA/IGNvbGxpc2lvblJlY3QuaGVpZ2h0IC0gbmV3UmVjdC5oZWlnaHQgOiAwXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlY3RDb29yZGluYXRlcyA9IHtcbiAgICAgICAgICB4OiBuZXdSZWN0LmxlZnQsXG4gICAgICAgICAgeTogbmV3UmVjdC50b3BcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgbmV3Q29vcmRpbmF0ZXMgPSBvZmZzZXQueCAmJiBvZmZzZXQueSA/IHJlY3RDb29yZGluYXRlcyA6IHN1YnRyYWN0KHJlY3RDb29yZGluYXRlcywgb2Zmc2V0KTtcbiAgICAgICAgcmV0dXJuIG5ld0Nvb3JkaW5hdGVzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5mdW5jdGlvbiBpc1NhbWVDb250YWluZXIoYSwgYikge1xuICBpZiAoIWhhc1NvcnRhYmxlRGF0YShhKSB8fCAhaGFzU29ydGFibGVEYXRhKGIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGEuZGF0YS5jdXJyZW50LnNvcnRhYmxlLmNvbnRhaW5lcklkID09PSBiLmRhdGEuY3VycmVudC5zb3J0YWJsZS5jb250YWluZXJJZDtcbn1cblxuZnVuY3Rpb24gaXNBZnRlcihhLCBiKSB7XG4gIGlmICghaGFzU29ydGFibGVEYXRhKGEpIHx8ICFoYXNTb3J0YWJsZURhdGEoYikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIWlzU2FtZUNvbnRhaW5lcihhLCBiKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBhLmRhdGEuY3VycmVudC5zb3J0YWJsZS5pbmRleCA8IGIuZGF0YS5jdXJyZW50LnNvcnRhYmxlLmluZGV4O1xufVxuXG5leHBvcnQgeyBTb3J0YWJsZUNvbnRleHQsIGFycmF5TW92ZSwgYXJyYXlTd2FwLCBkZWZhdWx0QW5pbWF0ZUxheW91dENoYW5nZXMsIGRlZmF1bHROZXdJbmRleEdldHRlciwgaGFzU29ydGFibGVEYXRhLCBob3Jpem9udGFsTGlzdFNvcnRpbmdTdHJhdGVneSwgcmVjdFNvcnRpbmdTdHJhdGVneSwgcmVjdFN3YXBwaW5nU3RyYXRlZ3ksIHNvcnRhYmxlS2V5Ym9hcmRDb29yZGluYXRlcywgdXNlU29ydGFibGUsIHZlcnRpY2FsTGlzdFNvcnRpbmdTdHJhdGVneSB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c29ydGFibGUuZXNtLmpzLm1hcFxuIiwiaW1wb3J0IFJlYWN0LCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBGQVFJdGVtQWN0aW9uc1Byb3BzIHtcbiAgICBvbkVkaXQ6ICgpID0+IHZvaWQ7XG4gICAgb25EZWxldGU6ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogQWN0aW9uIGJ1dHRvbnMgZm9yIGVkaXRpbmcgbW9kZSAtIEVkaXQgYW5kIERlbGV0ZVxuICogTm90ZTogTW92ZSB1cC9kb3duIGhhcyBiZWVuIHJlcGxhY2VkIHdpdGggZHJhZy1hbmQtZHJvcCByZW9yZGVyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGQVFJdGVtQWN0aW9ucyhwcm9wczogRkFRSXRlbUFjdGlvbnNQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3QgeyBvbkVkaXQsIG9uRGVsZXRlIH0gPSBwcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tYWN0aW9uc1wiPlxuICAgICAgICAgICAgey8qIEVkaXQgQnV0dG9uICovfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtLWFjdGlvbi1idG5cIiwgXCJmYXEtYWN0aW9uLWVkaXRcIil9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgb25FZGl0KCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT1cIkVkaXQgRkFRXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiRWRpdCBGQVEgaXRlbVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEyLjg1NCAxLjE0NmEuNS41IDAgMCAwLS43MDggMEwxMCAzLjI5MyAxMi43MDcgNmwyLjE0Ny0yLjE0NmEuNS41IDAgMCAwIDAtLjcwOGwtMi0yek0xMS4yOTMgNEwyIDEzLjI5M1YxNmgyLjcwN0wxNCA2LjcwNyAxMS4yOTMgNHpcIiAvPlxuICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgIHsvKiBEZWxldGUgQnV0dG9uICovfVxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtLWFjdGlvbi1idG5cIiwgXCJmYXEtYWN0aW9uLWRlbGV0ZVwiKX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgRkFRXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiRGVsZXRlIEZBUSBpdGVtXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNNS41IDUuNUEuNS41IDAgMCAxIDYgNnY2YS41LjUgMCAwIDEtMSAwVjZhLjUuNSAwIDAgMSAuNS0uNXptMi41IDBhLjUuNSAwIDAgMSAuNS41djZhLjUuNSAwIDAgMS0xIDBWNmEuNS41IDAgMCAxIC41LS41em0zIC41YS41LjUgMCAwIDAtMSAwdjZhLjUuNSAwIDAgMCAxIDBWNnpcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbFJ1bGU9XCJldmVub2RkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQ9XCJNMTQuNSAzYTEgMSAwIDAgMS0xIDFIMTN2OWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMlY0aC0uNWExIDEgMCAwIDEtMS0xVjJhMSAxIDAgMCAxIDEtMUg2YTEgMSAwIDAgMSAxLTFoMmExIDEgMCAwIDEgMSAxaDMuNWExIDEgMCAwIDEgMSAxdjF6TTQuMTE4IDRMNCA0LjA1OVYxM2ExIDEgMCAwIDAgMSAxaDZhMSAxIDAgMCAwIDEtMVY0LjA1OUwxMS44ODIgNEg0LjExOHpNMi41IDNWMmgxMXYxaC0xMXpcIlxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHVzZVNvcnRhYmxlIH0gZnJvbSBcIkBkbmQta2l0L3NvcnRhYmxlXCI7XG5pbXBvcnQgeyBDU1MgfSBmcm9tIFwiQGRuZC1raXQvdXRpbGl0aWVzXCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuaW1wb3J0IHsgRkFRSXRlbUFjdGlvbnMgfSBmcm9tIFwiLi9GQVFJdGVtQWN0aW9uc1wiO1xuXG5pbnRlcmZhY2UgRHJhZ2dhYmxlRkFRSXRlbVByb3BzIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIGluZGV4OiBudW1iZXI7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIHByb2Nlc3NlZENvbnRlbnQ6IHN0cmluZztcbiAgICB3YXJuaW5nczogc3RyaW5nW107XG4gICAgYW5pbWF0aW9uRHVyYXRpb246IG51bWJlcjtcbiAgICBvbkVkaXQ6ICgpID0+IHZvaWQ7XG4gICAgb25EZWxldGU6ICgpID0+IHZvaWQ7XG4gICAgY29sbGFwc2VBbGw/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRHJhZ2dhYmxlRkFRSXRlbSh7XG4gICAgaWQsXG4gICAgaW5kZXgsXG4gICAgc3VtbWFyeSxcbiAgICBwcm9jZXNzZWRDb250ZW50LFxuICAgIHdhcm5pbmdzLFxuICAgIGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgIG9uRWRpdCxcbiAgICBvbkRlbGV0ZSxcbiAgICBjb2xsYXBzZUFsbCA9IGZhbHNlXG59OiBEcmFnZ2FibGVGQVFJdGVtUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHsgYXR0cmlidXRlcywgbGlzdGVuZXJzLCBzZXROb2RlUmVmLCB0cmFuc2Zvcm0sIHRyYW5zaXRpb24sIGlzRHJhZ2dpbmcgfSA9IHVzZVNvcnRhYmxlKHtcbiAgICAgICAgaWRcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICB0cmFuc2Zvcm06IENTUy5UcmFuc2Zvcm0udG9TdHJpbmcodHJhbnNmb3JtKSxcbiAgICAgICAgdHJhbnNpdGlvbixcbiAgICAgICAgXCItLWFuaW1hdGlvbi1kdXJhdGlvblwiOiBgJHthbmltYXRpb25EdXJhdGlvbn1tc2BcbiAgICB9IGFzIFJlYWN0LkNTU1Byb3BlcnRpZXM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgICByZWY9e3NldE5vZGVSZWZ9XG4gICAgICAgICAgICBzdHlsZT17c3R5bGV9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbVwiLCBcImZhcS1pdGVtLS1lZGl0LW1vZGVcIiwge1xuICAgICAgICAgICAgICAgIG9wZW46ICFjb2xsYXBzZUFsbCxcbiAgICAgICAgICAgICAgICBcImZhcS1pdGVtLS1kcmFnZ2luZ1wiOiBpc0RyYWdnaW5nXG4gICAgICAgICAgICB9KX1cbiAgICAgICAgPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS1oZWFkZXItZWRpdFwiPlxuICAgICAgICAgICAgICAgIHsvKiBEcmFnIEhhbmRsZSAqL31cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1kcmFnLWhhbmRsZVwiXG4gICAgICAgICAgICAgICAgICAgIHsuLi5hdHRyaWJ1dGVzfVxuICAgICAgICAgICAgICAgICAgICB7Li4ubGlzdGVuZXJzfVxuICAgICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPXtgRHJhZyB0byByZW9yZGVyIEZBUSBpdGVtICR7aW5kZXggKyAxfTogJHtzdW1tYXJ5fWB9XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPHN2ZyBmb2N1c2FibGU9XCJmYWxzZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTEgMThjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAybS0yLThjLTEuMSAwLTIgLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0ybTAtNmMtMS4xIDAtMiAuOS0yIDJzLjkgMiAyIDIgMi0uOSAyLTItLjktMi0yLTJtNiA0YzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMm0wIDJjLTEuMSAwLTIgLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0ybTAgNmMtMS4xIDAtMiAuOS0yIDJzLjkgMiAyIDIgMi0uOSAyLTItLjktMi0yLTJcIj48L3BhdGg+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLWl0ZW0tc3VtbWFyeS10ZXh0XCI+e3N1bW1hcnl9PC9zcGFuPlxuXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPEZBUUl0ZW1BY3Rpb25zIG9uRWRpdD17b25FZGl0fSBvbkRlbGV0ZT17b25EZWxldGV9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHt3YXJuaW5ncy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS13YXJuaW5nc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3dhcm5pbmdzLm1hcCgod2FybmluZywgd0luZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3dJbmRleH0gY2xhc3NOYW1lPVwiZmFxLWl0ZW0td2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDimqDvuI8ge3dhcm5pbmd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1pdGVtLWNvbnRlbnQtaW5uZXJcIlxuICAgICAgICAgICAgICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHByb2Nlc3NlZENvbnRlbnQgfX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQsIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgeyBwcm9jZXNzQ29udGVudCwgZ2V0Q29udGVudFdhcm5pbmdzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3JcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5cbmludGVyZmFjZSBFZGl0RkFRRm9ybVByb3BzIHtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgY29udGVudDogc3RyaW5nO1xuICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW07XG4gICAgc29ydE9yZGVyPzogbnVtYmVyO1xuICAgIG9uU2F2ZTogKFxuICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICApID0+IHZvaWQ7XG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQ7XG4gICAgaXNOZXc/OiBib29sZWFuO1xuICAgIGlzSW5saW5lPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEVkaXRGQVFGb3JtKHByb3BzOiBFZGl0RkFRRm9ybVByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7XG4gICAgICAgIHN1bW1hcnk6IGluaXRpYWxTdW1tYXJ5LFxuICAgICAgICBjb250ZW50OiBpbml0aWFsQ29udGVudCxcbiAgICAgICAgZm9ybWF0OiBpbml0aWFsRm9ybWF0LFxuICAgICAgICBzb3J0T3JkZXI6IGluaXRpYWxTb3J0T3JkZXIgPSAxMCxcbiAgICAgICAgb25TYXZlLFxuICAgICAgICBvbkNhbmNlbCxcbiAgICAgICAgaXNOZXcgPSBmYWxzZSxcbiAgICAgICAgaXNJbmxpbmUgPSBmYWxzZVxuICAgIH0gPSBwcm9wcztcblxuICAgIGNvbnN0IFtzdW1tYXJ5LCBzZXRTdW1tYXJ5XSA9IHVzZVN0YXRlKGluaXRpYWxTdW1tYXJ5KTtcbiAgICBjb25zdCBbY29udGVudCwgc2V0Q29udGVudF0gPSB1c2VTdGF0ZShpbml0aWFsQ29udGVudCk7XG4gICAgY29uc3QgW2Zvcm1hdCwgc2V0Rm9ybWF0XSA9IHVzZVN0YXRlPENvbnRlbnRGb3JtYXRFbnVtPihpbml0aWFsRm9ybWF0KTtcbiAgICBjb25zdCBbc29ydE9yZGVyLCBzZXRTb3J0T3JkZXJdID0gdXNlU3RhdGUoaW5pdGlhbFNvcnRPcmRlcik7XG4gICAgY29uc3QgW3Nob3dQcmV2aWV3LCBzZXRTaG93UHJldmlld10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgICAvLyBWYWxpZGF0aW9uIHdhcm5pbmdzXG4gICAgY29uc3Qgd2FybmluZ3MgPSBnZXRDb250ZW50V2FybmluZ3MoY29udGVudCwgZm9ybWF0KTtcbiAgICBjb25zdCBoYXNXYXJuaW5ncyA9IHdhcm5pbmdzLmxlbmd0aCA+IDA7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlID0gKCkgPT4ge1xuICAgICAgICBpZiAoIXN1bW1hcnkudHJpbSgpKSB7XG4gICAgICAgICAgICBhbGVydChcIlN1bW1hcnkvUXVlc3Rpb24gaXMgcmVxdWlyZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb250ZW50LnRyaW0oKSkge1xuICAgICAgICAgICAgYWxlcnQoXCJDb250ZW50L0Fuc3dlciBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvblNhdmUoc3VtbWFyeS50cmltKCksIGNvbnRlbnQudHJpbSgpLCBmb3JtYXQsIHNvcnRPcmRlcik7XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWVkaXQtZm9ybVwiLCB7IFwiZmFxLWVkaXQtZm9ybS0taW5saW5lXCI6IGlzSW5saW5lIH0pfT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWVkaXQtZm9ybS1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICA8aDM+e2lzTmV3ID8gXCJBZGQgTmV3IEZBUVwiIDogXCJFZGl0IEZBUVwifTwvaDM+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZWRpdC1mb3JtLWNsb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17b25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBhcmlhLWxhYmVsPVwiQ2xvc2VcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAg4pyVXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZWRpdC1mb3JtLWJvZHlcIj5cbiAgICAgICAgICAgICAgICB7LyogU3VtbWFyeSBGaWVsZCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZmFxLXN1bW1hcnlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFF1ZXN0aW9uL1N1bW1hcnkgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLXJlcXVpcmVkXCI+Kjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZhcS1zdW1tYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1mb3JtLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzdW1tYXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTdW1tYXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgdGhlIHF1ZXN0aW9uIG9yIHN1bW1hcnkuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBTb3J0IE9yZGVyIEZpZWxkICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmYXEtc29ydG9yZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBTb3J0IE9yZGVyIDxzcGFuIGNsYXNzTmFtZT1cImZhcS1yZXF1aXJlZFwiPio8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJmYXEtc29ydG9yZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWZvcm0taW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3NvcnRPcmRlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U29ydE9yZGVyKE51bWJlcihlLnRhcmdldC52YWx1ZSkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcD1cIjEwXCJcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzTmFtZT1cImZhcS1mb3JtLWhlbHBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEl0ZW1zIGFyZSBkaXNwbGF5ZWQgaW4gYXNjZW5kaW5nIHNvcnQgb3JkZXIgKDEwLCAyMCwgMzAuLi4pLiBMb3dlciBudW1iZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBlYXIgZmlyc3QuXG4gICAgICAgICAgICAgICAgICAgIDwvc21hbGw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogRm9ybWF0IEZpZWxkICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmYXEtZm9ybWF0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBDb250ZW50IEZvcm1hdCA8c3BhbiBjbGFzc05hbWU9XCJmYXEtcmVxdWlyZWRcIj4qPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZhcS1mb3JtYXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWZvcm0tc2VsZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtYXR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZvcm1hdChlLnRhcmdldC52YWx1ZSBhcyBDb250ZW50Rm9ybWF0RW51bSl9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJodG1sXCI+SFRNTDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIm1hcmtkb3duXCI+TWFya2Rvd248L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ0ZXh0XCI+UGxhaW4gVGV4dDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgICAgPHNtYWxsIGNsYXNzTmFtZT1cImZhcS1mb3JtLWhlbHBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXQgPT09IFwiaHRtbFwiICYmIFwiQWxsb3dzIHJpY2ggZm9ybWF0dGluZyB3aXRoIEhUTUwgdGFnc1wifVxuICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdCA9PT0gXCJtYXJrZG93blwiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJVc2VzIE1hcmtkb3duIHN5bnRheCAoZS5nLiwgKipib2xkKiosICMgaGVhZGluZylcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXQgPT09IFwidGV4dFwiICYmIFwiUGxhaW4gdGV4dCBvbmx5LCBIVE1MIHdpbGwgYmUgZXNjYXBlZFwifVxuICAgICAgICAgICAgICAgICAgICA8L3NtYWxsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIENvbnRlbnQgRmllbGQgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZhcS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBBbnN3ZXIvQ29udGVudCA8c3BhbiBjbGFzc05hbWU9XCJmYXEtcmVxdWlyZWRcIj4qPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiZmFxLWNvbnRlbnRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWZvcm0tdGV4dGFyZWFcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZmFxLWZvcm0tdGV4dGFyZWEtLXdhcm5pbmdcIjogaGFzV2FybmluZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldENvbnRlbnQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFbnRlciB0aGUgYW5zd2VyIG9yIGNvbnRlbnQuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcm93cz17MTB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBWYWxpZGF0aW9uIFdhcm5pbmdzICovfVxuICAgICAgICAgICAgICAgICAgICB7aGFzV2FybmluZ3MgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS13YXJuaW5nc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdHJvbmc+4pqg77iPIENvbnRlbnQgV2FybmluZ3M6PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubWFwKCh3YXJuaW5nLCBpKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkga2V5PXtpfT57d2FybmluZ308L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogUHJldmlldyBUb2dnbGUgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1wcmV2aWV3LXRvZ2dsZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93UHJldmlldyghc2hvd1ByZXZpZXcpfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2hvd1ByZXZpZXcgPyBcIkhpZGVcIiA6IFwiU2hvd1wifSBQcmV2aWV3XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIFByZXZpZXcgKi99XG4gICAgICAgICAgICAgICAge3Nob3dQcmV2aWV3ICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1wcmV2aWV3XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDQ+UHJldmlldzo8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1mb3JtLXByZXZpZXctY29udGVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBwcm9jZXNzQ29udGVudChjb250ZW50LCBmb3JtYXQpIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBGb3JtIEFjdGlvbnMgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0LWZvcm0tZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZmFxLWJ0biBmYXEtYnRuLXNlY29uZGFyeVwiIG9uQ2xpY2s9e29uQ2FuY2VsfT5cbiAgICAgICAgICAgICAgICAgICAgQ2FuY2VsXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWJ0biBmYXEtYnRuLXByaW1hcnlcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTYXZlfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IXN1bW1hcnkudHJpbSgpIHx8ICFjb250ZW50LnRyaW0oKX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtpc05ldyA/IFwiQ3JlYXRlIEZBUVwiIDogXCJTYXZlIENoYW5nZXNcIn1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgcHJvY2Vzc0NvbnRlbnQsIGdldENvbnRlbnRXYXJuaW5ncyB9IGZyb20gXCIuLi91dGlscy9jb250ZW50UHJvY2Vzc29yXCI7XG5pbXBvcnQgeyBEcmFnZ2FibGVGQVFJdGVtIH0gZnJvbSBcIi4vRHJhZ2dhYmxlRkFRSXRlbVwiO1xuaW1wb3J0IHsgRWRpdEZBUUZvcm0gfSBmcm9tIFwiLi9FZGl0RkFRRm9ybVwiO1xuaW1wb3J0IHsgRkFRSXRlbSB9IGZyb20gXCIuLi9ob29rcy91c2VGQVFEYXRhXCI7XG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQge1xuICAgIERuZENvbnRleHQsXG4gICAgY2xvc2VzdENlbnRlcixcbiAgICBLZXlib2FyZFNlbnNvcixcbiAgICBQb2ludGVyU2Vuc29yLFxuICAgIHVzZVNlbnNvcixcbiAgICB1c2VTZW5zb3JzLFxuICAgIERyYWdFbmRFdmVudCxcbiAgICBEcmFnU3RhcnRFdmVudFxufSBmcm9tIFwiQGRuZC1raXQvY29yZVwiO1xuaW1wb3J0IHtcbiAgICBTb3J0YWJsZUNvbnRleHQsXG4gICAgc29ydGFibGVLZXlib2FyZENvb3JkaW5hdGVzLFxuICAgIHZlcnRpY2FsTGlzdFNvcnRpbmdTdHJhdGVneVxufSBmcm9tIFwiQGRuZC1raXQvc29ydGFibGVcIjtcblxuaW50ZXJmYWNlIEZBUUVkaXRhYmxlTGlzdFByb3BzIHtcbiAgICBpdGVtczogRkFRSXRlbVtdO1xuICAgIHNvcnRhYmxlSWRzOiBzdHJpbmdbXTtcbiAgICBleHBhbmRlZEl0ZW1zOiBTZXQ8bnVtYmVyPjtcbiAgICBhbmltYXRpb25EdXJhdGlvbjogbnVtYmVyO1xuICAgIG9uRWRpdEl0ZW06IChpbmRleDogbnVtYmVyKSA9PiB2b2lkO1xuICAgIG9uRGVsZXRlSXRlbTogKGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG4gICAgb25EcmFnRW5kOiAoZXZlbnQ6IERyYWdFbmRFdmVudCkgPT4gdm9pZDtcbiAgICAvLyBJbmxpbmUgZWRpdGluZyBwcm9wc1xuICAgIGVkaXRpbmdJdGVtSW5kZXg6IG51bWJlciB8IG51bGw7XG4gICAgZWRpdGluZ1NvcnRPcmRlcjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGRlZmF1bHRTb3J0T3JkZXI6IG51bWJlcjtcbiAgICBvblNhdmVFZGl0OiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBvbkNhbmNlbEVkaXQ6ICgpID0+IHZvaWQ7XG4gICAgLy8gSW5saW5lIGNyZWF0ZSBwcm9wc1xuICAgIHNob3dDcmVhdGVGb3JtOiBib29sZWFuO1xuICAgIG9uU2F2ZU5ldzogKFxuICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICApID0+IFByb21pc2U8dm9pZD47XG4gICAgb25DYW5jZWxDcmVhdGU6ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgRkFRIGl0ZW1zIGxpc3QgaW4gZWRpdCBtb2RlIHdpdGggZHJhZy1hbmQtZHJvcCByZW9yZGVyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGQVFFZGl0YWJsZUxpc3Qoe1xuICAgIGl0ZW1zLFxuICAgIHNvcnRhYmxlSWRzLFxuICAgIGV4cGFuZGVkSXRlbXMsXG4gICAgYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgb25FZGl0SXRlbSxcbiAgICBvbkRlbGV0ZUl0ZW0sXG4gICAgb25EcmFnRW5kLFxuICAgIGVkaXRpbmdJdGVtSW5kZXgsXG4gICAgZWRpdGluZ1NvcnRPcmRlcixcbiAgICBkZWZhdWx0U29ydE9yZGVyLFxuICAgIG9uU2F2ZUVkaXQsXG4gICAgb25DYW5jZWxFZGl0LFxuICAgIHNob3dDcmVhdGVGb3JtLFxuICAgIG9uU2F2ZU5ldyxcbiAgICBvbkNhbmNlbENyZWF0ZVxufTogRkFRRWRpdGFibGVMaXN0UHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IFtpc0RyYWdnaW5nQW55LCBzZXRJc0RyYWdnaW5nQW55XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAgIGNvbnN0IHNlbnNvcnMgPSB1c2VTZW5zb3JzKFxuICAgICAgICB1c2VTZW5zb3IoUG9pbnRlclNlbnNvciwge1xuICAgICAgICAgICAgYWN0aXZhdGlvbkNvbnN0cmFpbnQ6IHtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZTogOFxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgdXNlU2Vuc29yKEtleWJvYXJkU2Vuc29yLCB7XG4gICAgICAgICAgICBjb29yZGluYXRlR2V0dGVyOiBzb3J0YWJsZUtleWJvYXJkQ29vcmRpbmF0ZXNcbiAgICAgICAgfSlcbiAgICApO1xuXG4gICAgY29uc3QgaGFuZGxlRHJhZ1N0YXJ0ID0gKF9ldmVudDogRHJhZ1N0YXJ0RXZlbnQpID0+IHtcbiAgICAgICAgc2V0SXNEcmFnZ2luZ0FueSh0cnVlKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlRHJhZ0VuZCA9IChldmVudDogRHJhZ0VuZEV2ZW50KSA9PiB7XG4gICAgICAgIHNldElzRHJhZ2dpbmdBbnkoZmFsc2UpO1xuICAgICAgICBvbkRyYWdFbmQoZXZlbnQpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8RG5kQ29udGV4dFxuICAgICAgICAgICAgc2Vuc29ycz17c2Vuc29yc31cbiAgICAgICAgICAgIGNvbGxpc2lvbkRldGVjdGlvbj17Y2xvc2VzdENlbnRlcn1cbiAgICAgICAgICAgIG9uRHJhZ1N0YXJ0PXtoYW5kbGVEcmFnU3RhcnR9XG4gICAgICAgICAgICBvbkRyYWdFbmQ9e2hhbmRsZURyYWdFbmR9XG4gICAgICAgID5cbiAgICAgICAgICAgIDxTb3J0YWJsZUNvbnRleHQgaXRlbXM9e3NvcnRhYmxlSWRzfSBzdHJhdGVneT17dmVydGljYWxMaXN0U29ydGluZ1N0cmF0ZWd5fT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24taXRlbXMgZmFxLWFjY29yZGlvbi1pdGVtcy0tZWRpdC1tb2RlXCI+XG4gICAgICAgICAgICAgICAgICAgIHsvKiBJbmxpbmUgQ3JlYXRlIEZvcm0gLSBhcHBlYXJzIGF0IHRvcCBvZiBsaXN0ICovfVxuICAgICAgICAgICAgICAgICAgICB7c2hvd0NyZWF0ZUZvcm0gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbSBmYXEtaXRlbS0taW5saW5lLWNyZWF0ZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0RkFRRm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5PVwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudD1cIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdD1cImh0bWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI9e2RlZmF1bHRTb3J0T3JkZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2F2ZT17b25TYXZlTmV3fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17b25DYW5jZWxDcmVhdGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTmV3PXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0lubGluZT17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXRlbSBpcyBiZWluZyBlZGl0ZWQsIHNob3cgdGhlIGlubGluZSBmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdGluZ0l0ZW1JbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3NvcnRhYmxlSWRzW2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1pdGVtIGZhcS1pdGVtLS1pbmxpbmUtZWRpdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0RkFRRm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnk9e2l0ZW0uc3VtbWFyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50PXtpdGVtLmNvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0PXtpdGVtLmNvbnRlbnRGb3JtYXR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyPXtlZGl0aW5nU29ydE9yZGVyID8/IGRlZmF1bHRTb3J0T3JkZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TYXZlPXtvblNhdmVFZGl0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbEVkaXR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNOZXc9e2ZhbHNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzSW5saW5lPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29udGVudCA9IHByb2Nlc3NDb250ZW50KGl0ZW0uY29udGVudCwgaXRlbS5jb250ZW50Rm9ybWF0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdhcm5pbmdzID0gZ2V0Q29udGVudFdhcm5pbmdzKGl0ZW0uY29udGVudCwgaXRlbS5jb250ZW50Rm9ybWF0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RHJhZ2dhYmxlRkFRSXRlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3NvcnRhYmxlSWRzW2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9e3NvcnRhYmxlSWRzW2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg9e2luZGV4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5PXtpdGVtLnN1bW1hcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZENvbnRlbnQ9e3Byb2Nlc3NlZENvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmdzPXt3YXJuaW5nc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb249e2FuaW1hdGlvbkR1cmF0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkVkaXQ9eygpID0+IG9uRWRpdEl0ZW0oaW5kZXgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZT17KCkgPT4gb25EZWxldGVJdGVtKGluZGV4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGFwc2VBbGw9e2lzRHJhZ2dpbmdBbnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9Tb3J0YWJsZUNvbnRleHQ+XG4gICAgICAgIDwvRG5kQ29udGV4dD5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5cbmludGVyZmFjZSBDb25maXJtRGlhbG9nUHJvcHMge1xuICAgIGlzT3BlbjogYm9vbGVhbjtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICBvbkNvbmZpcm06ICgpID0+IHZvaWQ7XG4gICAgb25DYW5jZWw6ICgpID0+IHZvaWQ7XG4gICAgY29uZmlybVRleHQ/OiBzdHJpbmc7XG4gICAgY2FuY2VsVGV4dD86IHN0cmluZztcbiAgICBpc0Rlc3RydWN0aXZlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb25maXJtYXRpb24gZGlhbG9nIG1vZGFsIGZvciBkZXN0cnVjdGl2ZSBhY3Rpb25zIChlLmcuLCBkZWxldGUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBDb25maXJtRGlhbG9nKHByb3BzOiBDb25maXJtRGlhbG9nUHJvcHMpOiBSZWFjdEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7XG4gICAgICAgIGlzT3BlbixcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIG9uQ29uZmlybSxcbiAgICAgICAgb25DYW5jZWwsXG4gICAgICAgIGNvbmZpcm1UZXh0ID0gXCJDb25maXJtXCIsXG4gICAgICAgIGNhbmNlbFRleHQgPSBcIkNhbmNlbFwiLFxuICAgICAgICBpc0Rlc3RydWN0aXZlID0gZmFsc2VcbiAgICB9ID0gcHJvcHM7XG5cbiAgICBpZiAoIWlzT3Blbikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVPdmVybGF5Q2xpY2sgPSAoZTogUmVhY3QuTW91c2VFdmVudDxIVE1MRGl2RWxlbWVudD4pID0+IHtcbiAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBlLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgICAgIG9uQ2FuY2VsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLW92ZXJsYXlcIlxuICAgICAgICAgICAgb25DbGljaz17aGFuZGxlT3ZlcmxheUNsaWNrfVxuICAgICAgICAgICAgcm9sZT1cInByZXNlbnRhdGlvblwiXG4gICAgICAgID5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2dcIlxuICAgICAgICAgICAgICAgIHJvbGU9XCJhbGVydGRpYWxvZ1wiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbGxlZGJ5PVwiZGlhbG9nLXRpdGxlXCJcbiAgICAgICAgICAgICAgICBhcmlhLWRlc2NyaWJlZGJ5PVwiZGlhbG9nLW1lc3NhZ2VcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICB7aXNEZXN0cnVjdGl2ZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLWljb24td2FybmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9XCIyNFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PVwiMjRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNOC45ODIgMS41NjZhMS4xMyAxLjEzIDAgMCAwLTEuOTYgMEwuMTY1IDEzLjIzM2MtLjQ1Ny43NzguMDkxIDEuNzY3Ljk4IDEuNzY3aDEzLjcxM2MuODg5IDAgMS40MzgtLjk5Ljk4LTEuNzY3TDguOTgyIDEuNTY2ek04IDVjLjUzNSAwIC45NTQuNDYyLjkuOTk1bC0uMzUgMy41MDdhLjU1Mi41NTIgMCAwIDEtMS4xIDBMNy4xIDUuOTk1QS45MDUuOTA1IDAgMCAxIDggNXptLjAwMiA2YTEgMSAwIDEgMSAwIDIgMSAxIDAgMCAxIDAtMnpcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDxoMyBpZD1cImRpYWxvZy10aXRsZVwiIGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge3RpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBpZD1cImRpYWxvZy1tZXNzYWdlXCIgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLW1lc3NhZ2VcIj5cbiAgICAgICAgICAgICAgICAgICAge21lc3NhZ2V9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy1hY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWNvbmZpcm0tZGlhbG9nLWJ0blwiLCBcImZhcS1idG4tY2FuY2VsXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17b25DYW5jZWx9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjYW5jZWxUZXh0fVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtY29uZmlybS1kaWFsb2ctYnRuXCIsIFwiZmFxLWJ0bi1jb25maXJtXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1idG4tZGVzdHJ1Y3RpdmVcIjogaXNEZXN0cnVjdGl2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNvbmZpcm19XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtjb25maXJtVGV4dH1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQ29uZmlybURpYWxvZyB9IGZyb20gXCIuL0NvbmZpcm1EaWFsb2dcIjtcblxuaW50ZXJmYWNlIEZBUU1vZGFsc1Byb3BzIHtcbiAgICAvLyBEZWxldGUgY29uZmlybWF0aW9uIHByb3BzXG4gICAgZGVsZXRlQ29uZmlybUluZGV4OiBudW1iZXIgfCBudWxsO1xuICAgIG9uQ29uZmlybURlbGV0ZTogKCkgPT4gdm9pZDtcbiAgICBvbkNhbmNlbERlbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBDb21wb25lbnQgdGhhdCByZW5kZXJzIEZBUSBtb2RhbHMgKGRlbGV0ZSBjb25maXJtYXRpb24pXG4gKiBOb3RlOiBDcmVhdGUgYW5kIEVkaXQgZm9ybXMgYXJlIG5vdyByZW5kZXJlZCBpbmxpbmUgaW4gRkFRRWRpdGFibGVMaXN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGQVFNb2RhbHMoe1xuICAgIGRlbGV0ZUNvbmZpcm1JbmRleCxcbiAgICBvbkNvbmZpcm1EZWxldGUsXG4gICAgb25DYW5jZWxEZWxldGVcbn06IEZBUU1vZGFsc1Byb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgICAgey8qIERlbGV0ZSBDb25maXJtYXRpb24gRGlhbG9nICovfVxuICAgICAgICAgICAgPENvbmZpcm1EaWFsb2dcbiAgICAgICAgICAgICAgICBpc09wZW49e2RlbGV0ZUNvbmZpcm1JbmRleCAhPT0gbnVsbH1cbiAgICAgICAgICAgICAgICB0aXRsZT1cIkRlbGV0ZSBGQVEgSXRlbVwiXG4gICAgICAgICAgICAgICAgbWVzc2FnZT1cIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhpcyBGQVEgaXRlbT8gVGhpcyBhY3Rpb24gY2Fubm90IGJlIHVuZG9uZS5cIlxuICAgICAgICAgICAgICAgIG9uQ29uZmlybT17b25Db25maXJtRGVsZXRlfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbERlbGV0ZX1cbiAgICAgICAgICAgICAgICBjb25maXJtVGV4dD1cIkRlbGV0ZVwiXG4gICAgICAgICAgICAgICAgY2FuY2VsVGV4dD1cIkNhbmNlbFwiXG4gICAgICAgICAgICAgICAgaXNEZXN0cnVjdGl2ZT17dHJ1ZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIDwvPlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQsIHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZU1lbW8gfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IEZBUUFjY29yZGlvbkNvbnRhaW5lclByb3BzIH0gZnJvbSBcIi4uL3R5cGluZ3MvRkFRQWNjb3JkaW9uUHJvcHNcIjtcbmltcG9ydCBcIi4vdWkvRkFRQWNjb3JkaW9uLnNjc3NcIjtcbmltcG9ydCB7IGNoZWNrVXNlclJvbGUsIGNhbkVkaXQgfSBmcm9tIFwiLi91dGlscy9lZGl0aW5nVXRpbHNcIjtcbmltcG9ydCB7IHVzZUVkaXRNb2RlIH0gZnJvbSBcIi4vaG9va3MvdXNlRWRpdE1vZGVcIjtcbmltcG9ydCB7IHVzZUZBUURhdGEgfSBmcm9tIFwiLi9ob29rcy91c2VGQVFEYXRhXCI7XG5pbXBvcnQgeyB1c2VGQVFBY3Rpb25zIH0gZnJvbSBcIi4vaG9va3MvdXNlRkFRQWN0aW9uc1wiO1xuaW1wb3J0IHsgRkFRSGVhZGVyIH0gZnJvbSBcIi4vY29tcG9uZW50cy9GQVFIZWFkZXJcIjtcbmltcG9ydCB7IEZBUUl0ZW1zTGlzdCB9IGZyb20gXCIuL2NvbXBvbmVudHMvRkFRSXRlbXNMaXN0XCI7XG5pbXBvcnQgeyBGQVFFZGl0YWJsZUxpc3QgfSBmcm9tIFwiLi9jb21wb25lbnRzL0ZBUUVkaXRhYmxlTGlzdFwiO1xuaW1wb3J0IHsgRkFRTW9kYWxzIH0gZnJvbSBcIi4vY29tcG9uZW50cy9GQVFNb2RhbHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIEZBUUFjY29yZGlvbihwcm9wczogRkFRQWNjb3JkaW9uQ29udGFpbmVyUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHtcbiAgICAgICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgICAgIGZhcUl0ZW1zLFxuICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICBkZWZhdWx0RXhwYW5kQWxsLFxuICAgICAgICBzaG93VG9nZ2xlQnV0dG9uLFxuICAgICAgICB0b2dnbGVCdXR0b25UZXh0LFxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgYWxsb3dFZGl0aW5nLFxuICAgICAgICBlZGl0b3JSb2xlLFxuICAgICAgICBvblNhdmVBY3Rpb24sXG4gICAgICAgIG9uRGVsZXRlQWN0aW9uLFxuICAgICAgICBvbkNyZWF0ZUFjdGlvbixcbiAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlLFxuICAgICAgICAvLyBBdHRyaWJ1dGUgb3ZlcnJpZGVzIChvcHRpb25hbClcbiAgICAgICAgc3VtbWFyeUF0dHJpYnV0ZSxcbiAgICAgICAgY29udGVudEF0dHJpYnV0ZSxcbiAgICAgICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZSxcbiAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGVcbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBBdHRyaWJ1dGUgb3ZlcnJpZGVzIGZvciB1c2VGQVFEYXRhIGFuZCB1c2VGQVFBY3Rpb25zIChwYXNzIHRoZSBMaXN0QXR0cmlidXRlVmFsdWUgb2JqZWN0cyBkaXJlY3RseSlcbiAgICBjb25zdCBhdHRyaWJ1dGVPdmVycmlkZXMgPSB1c2VNZW1vKFxuICAgICAgICAoKSA9PiAoe1xuICAgICAgICAgICAgc3VtbWFyeUF0dHJpYnV0ZSxcbiAgICAgICAgICAgIGNvbnRlbnRBdHRyaWJ1dGUsXG4gICAgICAgICAgICBjb250ZW50Rm9ybWF0QXR0cmlidXRlLFxuICAgICAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGVcbiAgICAgICAgfSksXG4gICAgICAgIFtzdW1tYXJ5QXR0cmlidXRlLCBjb250ZW50QXR0cmlidXRlLCBjb250ZW50Rm9ybWF0QXR0cmlidXRlLCBzb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZV1cbiAgICApO1xuXG4gICAgLy8gRGF0YSBmZXRjaGluZyBhbmQgc3RhdGVcbiAgICBjb25zdCB7IGl0ZW1zLCBpc0xvYWRpbmcsIGRlZmF1bHRTb3J0T3JkZXIsIHNvcnRhYmxlSWRzIH0gPSB1c2VGQVFEYXRhKHtcbiAgICAgICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgIGZhcUl0ZW1zLFxuICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGUsXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlc1xuICAgIH0pO1xuXG4gICAgLy8gRWRpdGluZyBzdGF0ZVxuICAgIGNvbnN0IGVkaXRTdGF0ZSA9IHVzZUVkaXRNb2RlKCk7XG4gICAgY29uc3QgW3VzZXJIYXNSb2xlLCBzZXRVc2VySGFzUm9sZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgICAvLyBDUlVEIGFjdGlvbnNcbiAgICBjb25zdCB7IGhhbmRsZVNhdmVFZGl0LCBoYW5kbGVTYXZlTmV3LCBoYW5kbGVDb25maXJtRGVsZXRlLCBoYW5kbGVEcmFnRW5kIH0gPSB1c2VGQVFBY3Rpb25zKHtcbiAgICAgICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZSxcbiAgICAgICAgZWRpdFN0YXRlLFxuICAgICAgICBvblNhdmVBY3Rpb24sXG4gICAgICAgIG9uRGVsZXRlQWN0aW9uLFxuICAgICAgICBvbkNyZWF0ZUFjdGlvbixcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzXG4gICAgfSk7XG5cbiAgICAvLyBTdGF0ZSB0byB0cmFjayB3aGljaCBpdGVtcyBhcmUgZXhwYW5kZWRcbiAgICBjb25zdCBbZXhwYW5kZWRJdGVtcywgc2V0RXhwYW5kZWRJdGVtc10gPSB1c2VTdGF0ZTxTZXQ8bnVtYmVyPj4obmV3IFNldCgpKTtcbiAgICBjb25zdCBbYWxsRXhwYW5kZWQsIHNldEFsbEV4cGFuZGVkXSA9IHVzZVN0YXRlKGRlZmF1bHRFeHBhbmRBbGwpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGVkaXRpbmcgc29ydCBvcmRlciBmb3IgdGhlIGVkaXQgZm9ybVxuICAgIGNvbnN0IGVkaXRpbmdTb3J0T3JkZXIgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgaWYgKGVkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc29ydE9yZGVyRnJvbUl0ZW1zID0gaXRlbXNbZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXhdPy5zb3J0T3JkZXI7XG4gICAgICAgIGlmIChzb3J0T3JkZXJGcm9tSXRlbXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHNvcnRPcmRlckZyb21JdGVtcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiZcbiAgICAgICAgICAgIGRhdGFTb3VyY2UgJiZcbiAgICAgICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZSAmJlxuICAgICAgICAgICAgZGF0YVNvdXJjZS5pdGVtcz8uW2VkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4XVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF3ID0gc29ydE9yZGVyQXR0cmlidXRlLmdldChcbiAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZS5pdGVtc1tlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleF1cbiAgICAgICAgICAgICAgICApLnZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiByYXcgPyBOdW1iZXIocmF3LnRvU3RyaW5nKCkpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIHJlYWQgc29ydCBvcmRlciBmb3IgZWRpdCBmb3JtXCIsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0sIFtkYXRhU291cmNlLCBkYXRhU291cmNlVHlwZSwgZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXgsIGl0ZW1zLCBzb3J0T3JkZXJBdHRyaWJ1dGVdKTtcblxuICAgIC8vIENoZWNrIGlmIHVzZXIgaGFzIHJlcXVpcmVkIHJvbGVcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBjb25zdCBjaGVja1JvbGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoYWxsb3dFZGl0aW5nICYmIGVkaXRvclJvbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNSb2xlID0gYXdhaXQgY2hlY2tVc2VyUm9sZShlZGl0b3JSb2xlKTtcbiAgICAgICAgICAgICAgICBzZXRVc2VySGFzUm9sZShoYXNSb2xlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWxsb3dFZGl0aW5nICYmICFlZGl0b3JSb2xlKSB7XG4gICAgICAgICAgICAgICAgc2V0VXNlckhhc1JvbGUodHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldFVzZXJIYXNSb2xlKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjaGVja1JvbGUoKTtcbiAgICB9LCBbYWxsb3dFZGl0aW5nLCBlZGl0b3JSb2xlXSk7XG5cbiAgICAvLyBJbml0aWFsaXplIGV4cGFuZGVkIHN0YXRlIGJhc2VkIG9uIGRlZmF1bHRFeHBhbmRBbGxcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoZGVmYXVsdEV4cGFuZEFsbCkge1xuICAgICAgICAgICAgY29uc3QgYWxsSW5kaWNlcyA9IG5ldyBTZXQoaXRlbXM/Lm1hcCgoXywgaW5kZXgpID0+IGluZGV4KSB8fCBbXSk7XG4gICAgICAgICAgICBzZXRFeHBhbmRlZEl0ZW1zKGFsbEluZGljZXMpO1xuICAgICAgICB9XG4gICAgfSwgW2RlZmF1bHRFeHBhbmRBbGwsIGl0ZW1zXSk7XG5cbiAgICAvLyBUb2dnbGUgaW5kaXZpZHVhbCBpdGVtXG4gICAgY29uc3QgdG9nZ2xlSXRlbSA9IChpbmRleDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEV4cGFuZGVkSXRlbXMoKHByZXYpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NldCA9IG5ldyBTZXQocHJldik7XG4gICAgICAgICAgICBpZiAobmV3U2V0LmhhcyhpbmRleCkpIHtcbiAgICAgICAgICAgICAgICBuZXdTZXQuZGVsZXRlKGluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3U2V0LmFkZChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3U2V0O1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gVG9nZ2xlIGFsbCBpdGVtc1xuICAgIGNvbnN0IHRvZ2dsZUFsbCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGFsbEV4cGFuZGVkKSB7XG4gICAgICAgICAgICBzZXRFeHBhbmRlZEl0ZW1zKG5ldyBTZXQoKSk7XG4gICAgICAgICAgICBzZXRBbGxFeHBhbmRlZChmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBhbGxJbmRpY2VzID0gbmV3IFNldChpdGVtcz8ubWFwKChfLCBpbmRleCkgPT4gaW5kZXgpIHx8IFtdKTtcbiAgICAgICAgICAgIHNldEV4cGFuZGVkSXRlbXMoYWxsSW5kaWNlcyk7XG4gICAgICAgICAgICBzZXRBbGxFeHBhbmRlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBVcGRhdGUgYWxsRXhwYW5kZWQgc3RhdGUgYmFzZWQgb24gaW5kaXZpZHVhbCB0b2dnbGVzXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgICAgICBjb25zdCBhbGxBcmVFeHBhbmRlZCA9IGl0ZW1zLmxlbmd0aCA+IDAgJiYgZXhwYW5kZWRJdGVtcy5zaXplID09PSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICBzZXRBbGxFeHBhbmRlZChhbGxBcmVFeHBhbmRlZCk7XG4gICAgICAgIH1cbiAgICB9LCBbZXhwYW5kZWRJdGVtcywgaXRlbXNdKTtcblxuICAgIC8vIERldGVybWluZSBpZiBlZGl0aW5nIGlzIGVuYWJsZWRcbiAgICBjb25zdCBpc0VkaXRpbmdFbmFibGVkID0gY2FuRWRpdChhbGxvd0VkaXRpbmcsIGRhdGFTb3VyY2VUeXBlLCB1c2VySGFzUm9sZSk7XG5cbiAgICAvLyBFdmVudCBoYW5kbGVyc1xuICAgIGNvbnN0IGhhbmRsZUNhbmNlbEVkaXQgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWRpdFN0YXRlLnNob3dDcmVhdGVGb3JtKSB7XG4gICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsQ3JlYXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBTaG93IGxvYWRpbmcgc3RhdGUgZm9yIGRhdGFiYXNlIG1vZGVcbiAgICBpZiAoaXNMb2FkaW5nKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24tbG9hZGluZ1wiPlxuICAgICAgICAgICAgICAgIDxwPkxvYWRpbmcgRkFRIGl0ZW1zLi4uPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtcyB8fCBpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1lbXB0eVwiPlxuICAgICAgICAgICAgICAgIDxwPk5vIEZBUSBpdGVtcyBjb25maWd1cmVkPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgPEZBUUhlYWRlclxuICAgICAgICAgICAgICAgIHNob3dUb2dnbGVCdXR0b249e3Nob3dUb2dnbGVCdXR0b259XG4gICAgICAgICAgICAgICAgYWxsRXhwYW5kZWQ9e2FsbEV4cGFuZGVkfVxuICAgICAgICAgICAgICAgIHRvZ2dsZUJ1dHRvblRleHQ9e3RvZ2dsZUJ1dHRvblRleHQ/LnZhbHVlfVxuICAgICAgICAgICAgICAgIG9uVG9nZ2xlQWxsPXt0b2dnbGVBbGx9XG4gICAgICAgICAgICAgICAgaXNFZGl0aW5nRW5hYmxlZD17aXNFZGl0aW5nRW5hYmxlZH1cbiAgICAgICAgICAgICAgICBlZGl0TW9kZT17ZWRpdFN0YXRlLmVkaXRNb2RlfVxuICAgICAgICAgICAgICAgIG9uVG9nZ2xlRWRpdE1vZGU9e2VkaXRTdGF0ZS50b2dnbGVFZGl0TW9kZX1cbiAgICAgICAgICAgICAgICBvbkNyZWF0ZU5ldz17ZWRpdFN0YXRlLnN0YXJ0Q3JlYXRpbmd9XG4gICAgICAgICAgICAvPlxuXG4gICAgICAgICAgICB7ZWRpdFN0YXRlLmVkaXRNb2RlICYmIGlzRWRpdGluZ0VuYWJsZWQgPyAoXG4gICAgICAgICAgICAgICAgPEZBUUVkaXRhYmxlTGlzdFxuICAgICAgICAgICAgICAgICAgICBpdGVtcz17aXRlbXN9XG4gICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlSWRzPXtzb3J0YWJsZUlkc31cbiAgICAgICAgICAgICAgICAgICAgZXhwYW5kZWRJdGVtcz17ZXhwYW5kZWRJdGVtc31cbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb249e2FuaW1hdGlvbkR1cmF0aW9uIHx8IDMwMH1cbiAgICAgICAgICAgICAgICAgICAgb25FZGl0SXRlbT17ZWRpdFN0YXRlLnN0YXJ0RWRpdGluZ0l0ZW19XG4gICAgICAgICAgICAgICAgICAgIG9uRGVsZXRlSXRlbT17ZWRpdFN0YXRlLnN0YXJ0RGVsZXRpbmd9XG4gICAgICAgICAgICAgICAgICAgIG9uRHJhZ0VuZD17aGFuZGxlRHJhZ0VuZH1cbiAgICAgICAgICAgICAgICAgICAgZWRpdGluZ0l0ZW1JbmRleD17ZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXh9XG4gICAgICAgICAgICAgICAgICAgIGVkaXRpbmdTb3J0T3JkZXI9e2VkaXRpbmdTb3J0T3JkZXJ9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRTb3J0T3JkZXI9e2RlZmF1bHRTb3J0T3JkZXJ9XG4gICAgICAgICAgICAgICAgICAgIG9uU2F2ZUVkaXQ9e2hhbmRsZVNhdmVFZGl0fVxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbEVkaXQ9e2hhbmRsZUNhbmNlbEVkaXR9XG4gICAgICAgICAgICAgICAgICAgIHNob3dDcmVhdGVGb3JtPXtlZGl0U3RhdGUuc2hvd0NyZWF0ZUZvcm19XG4gICAgICAgICAgICAgICAgICAgIG9uU2F2ZU5ldz17aGFuZGxlU2F2ZU5ld31cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWxDcmVhdGU9e2hhbmRsZUNhbmNlbEVkaXR9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPEZBUUl0ZW1zTGlzdFxuICAgICAgICAgICAgICAgICAgICBpdGVtcz17aXRlbXN9XG4gICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkSXRlbXM9e2V4cGFuZGVkSXRlbXN9XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uPXthbmltYXRpb25EdXJhdGlvbiB8fCAzMDB9XG4gICAgICAgICAgICAgICAgICAgIG9uVG9nZ2xlSXRlbT17dG9nZ2xlSXRlbX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgPEZBUU1vZGFsc1xuICAgICAgICAgICAgICAgIGRlbGV0ZUNvbmZpcm1JbmRleD17ZWRpdFN0YXRlLmRlbGV0ZUNvbmZpcm1JbmRleH1cbiAgICAgICAgICAgICAgICBvbkNvbmZpcm1EZWxldGU9e2hhbmRsZUNvbmZpcm1EZWxldGV9XG4gICAgICAgICAgICAgICAgb25DYW5jZWxEZWxldGU9e2VkaXRTdGF0ZS5jYW5jZWxEZWxldGV9XG4gICAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIl0sIm5hbWVzIjpbImhhc093biIsImhhc093blByb3BlcnR5IiwiY2xhc3NOYW1lcyIsImNsYXNzZXMiLCJpIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiYXJnIiwiYXBwZW5kQ2xhc3MiLCJwYXJzZVZhbHVlIiwiQXJyYXkiLCJpc0FycmF5IiwiYXBwbHkiLCJ0b1N0cmluZyIsIk9iamVjdCIsInByb3RvdHlwZSIsImluY2x1ZGVzIiwia2V5IiwiY2FsbCIsInZhbHVlIiwibmV3Q2xhc3MiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCIsIndpbmRvdyIsIl9qc3giLCJfanN4cyIsIl9GcmFnbWVudCIsImVudHJpZXMiLCJzZXRQcm90b3R5cGVPZiIsImlzRnJvemVuIiwiZ2V0UHJvdG90eXBlT2YiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJmcmVlemUiLCJzZWFsIiwiY3JlYXRlIiwiY29uc3RydWN0IiwiUmVmbGVjdCIsIngiLCJmdW5jIiwidGhpc0FyZyIsIl9sZW4iLCJhcmdzIiwiX2tleSIsIkZ1bmMiLCJfbGVuMiIsIl9rZXkyIiwiYXJyYXlGb3JFYWNoIiwidW5hcHBseSIsImZvckVhY2giLCJhcnJheUxhc3RJbmRleE9mIiwibGFzdEluZGV4T2YiLCJhcnJheVBvcCIsInBvcCIsImFycmF5UHVzaCIsInB1c2giLCJhcnJheVNwbGljZSIsInNwbGljZSIsInN0cmluZ1RvTG93ZXJDYXNlIiwiU3RyaW5nIiwidG9Mb3dlckNhc2UiLCJzdHJpbmdUb1N0cmluZyIsInN0cmluZ01hdGNoIiwibWF0Y2giLCJzdHJpbmdSZXBsYWNlIiwicmVwbGFjZSIsInN0cmluZ0luZGV4T2YiLCJpbmRleE9mIiwic3RyaW5nVHJpbSIsInRyaW0iLCJvYmplY3RIYXNPd25Qcm9wZXJ0eSIsInJlZ0V4cFRlc3QiLCJSZWdFeHAiLCJ0ZXN0IiwidHlwZUVycm9yQ3JlYXRlIiwidW5jb25zdHJ1Y3QiLCJUeXBlRXJyb3IiLCJsYXN0SW5kZXgiLCJfbGVuMyIsIl9rZXkzIiwiX2xlbjQiLCJfa2V5NCIsImFkZFRvU2V0Iiwic2V0IiwiYXJyYXkiLCJ0cmFuc2Zvcm1DYXNlRnVuYyIsInVuZGVmaW5lZCIsImwiLCJlbGVtZW50IiwibGNFbGVtZW50IiwiY2xlYW5BcnJheSIsImluZGV4IiwiaXNQcm9wZXJ0eUV4aXN0IiwiY2xvbmUiLCJvYmplY3QiLCJuZXdPYmplY3QiLCJwcm9wZXJ0eSIsImNvbnN0cnVjdG9yIiwibG9va3VwR2V0dGVyIiwicHJvcCIsImRlc2MiLCJnZXQiLCJmYWxsYmFja1ZhbHVlIiwiTCIsImFzeW5jIiwiYnJlYWtzIiwiZXh0ZW5zaW9ucyIsImdmbSIsImhvb2tzIiwicGVkYW50aWMiLCJyZW5kZXJlciIsInNpbGVudCIsInRva2VuaXplciIsIndhbGtUb2tlbnMiLCJUIiwiWiIsInUiLCJET01QdXJpZnkiLCJtYXJrZWQiLCJ1c2VDb21iaW5lZFJlZnMiLCJyZWZzIiwidXNlTWVtbyIsIm5vZGUiLCJyZWYiLCJoaWRkZW5TdHlsZXMiLCJkaXNwbGF5IiwiSGlkZGVuVGV4dCIsIl9yZWYiLCJpZCIsIlJlYWN0IiwiY3JlYXRlRWxlbWVudCIsInN0eWxlIiwiRG5kTW9uaXRvckNvbnRleHQiLCJjcmVhdGVDb250ZXh0IiwiYXJyYXlNb3ZlIiwiZnJvbSIsInRvIiwibmV3QXJyYXkiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTs7QUFFRztBQUVIOzs7O0FBSUc7QUFDSSxlQUFlLGFBQWEsQ0FBQyxZQUFvQixFQUFBOztJQUVwRCxJQUFJLENBQUMsWUFBWSxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7QUFDN0MsUUFBQSxPQUFPLElBQUksQ0FBQztLQUNmO0FBRUQsSUFBQSxJQUFJOzs7OztBQUtBLFFBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsWUFBWSxDQUFBLENBQUUsQ0FBQyxDQUFDO0FBQzlDLFFBQUEsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUFDLE9BQU8sS0FBSyxFQUFFO0FBQ1osUUFBQSxPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2xELFFBQUEsT0FBTyxLQUFLLENBQUM7S0FDaEI7QUFDTCxDQUFDO0FBRUQ7Ozs7OztBQU1HO1NBQ2EsT0FBTyxDQUFDLFlBQXFCLEVBQUUsY0FBc0IsRUFBRSxPQUFnQixFQUFBOztBQUVuRixJQUFBLElBQUksY0FBYyxLQUFLLFVBQVUsRUFBRTtBQUMvQixRQUFBLE9BQU8s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QUEsTUFBTSxHQUFHL0QsY0FBYyxDQUFDK0QsTUFBTSxDQUFDLENBQUE7QUFDakMsR0FBQTtBQUVBLEVBQUEsU0FBU1EsYUFBYUEsR0FBQTtBQUNwQixJQUFBLE9BQU8sSUFBSSxDQUFBO0FBQ2IsR0FBQTtBQUVBLEVBQUEsT0FBT0EsYUFBYSxDQUFBO0FBQ3RCLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM5TU8sU0FBU0MsSUFBNEc7RUFDMUgsT0FBTztBQUNMQyxJQUFBQSxLQUFBLEVBQU8sQ0FBQSxDQUFBO0FBQ1BDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7QUFDUkMsSUFBQUEsVUFBQSxFQUFZLElBQUE7QUFDWkMsSUFBQUEsR0FBQSxFQUFLLENBQUEsQ0FBQTtBQUNMQyxJQUFBQSxLQUFBLEVBQU8sSUFBQTtBQUNQQyxJQUFBQSxRQUFBLEVBQVUsQ0FBQSxDQUFBO0FBQ1ZDLElBQUFBLFFBQUEsRUFBVSxJQUFBO0FBQ1ZDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7QUFDUkMsSUFBQUEsU0FBQSxFQUFXLElBQUE7QUFDWEMsSUFBQUEsVUFBQSxFQUFZLElBQUE7R0FFaEIsQ0FBQTtBQUFBLENBQUE7QUFFTyxJQUFJQyxDQUFBLEdBQXFDWCxDQUFBLEVBQWEsQ0FBQTtBQUV0RCxTQUFTWSxDQUFBQSxDQUErREMsQ0FBQSxFQUEwRDtBQUN2SUYsRUFBQUEsQ0FBQSxHQUFZRSxDQUNkLENBQUE7QUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2pCQTs7Ozs7Ozs7QUFRRztBQUNILE1BQU0sZUFBZSxHQUFHO0FBQ3BCLElBQUEsWUFBWSxFQUFFO1FBQ1YsR0FBRztRQUNILElBQUk7UUFDSixRQUFRO1FBQ1IsSUFBSTtRQUNKLEdBQUc7UUFDSCxHQUFHO1FBQ0gs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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNiTSxNQUFNaUgsaUJBQWlCLGdCQUFHQyxhQUFhLENBQTBCLElBQTFCLENBQXZDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSlA7OztBQUdnQkMsU0FBQUEsU0FBQUEsQ0FBYWxELEtBQUEsRUFBWW1ELElBQUEsRUFBY0MsRUFBQSxFQUFBO0FBQ3JELEVBQUEsTUFBTUMsUUFBUSxHQUFHckQsS0FBSyxDQUFDc0QsS0FBTixFQUFqQixDQUFBO0VBQ0FELFFBQVEsQ0FBQ2hGLE1BQVQsQ0FDRStFLEVBQUUsR0FBRyxDQUFMLEdBQVNDLFFBQVEsQ0FBQ25JLE1BQVQsR0FBa0JrSSxFQUEzQixHQUFnQ0EsRUFEbEMsRUFFRSxDQUZGLEVBR0VDLFFBQVEsQ0FBQ2hGLE1BQVQsQ0FBZ0I4RSxJQUFoQixFQUFzQixDQUF0QixDQUF5QixDQUFBLENBQXpCLENBSEYsQ0FBQSxDQUFBO0FBTUEsRUFBQSxPQUFPRSxRQUFQLENBQUE7QUFDRCxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSkQ7OztBQUdHO0FBQ0csU0FBVSxjQUFjLENBQUMsS0FBMEIsRUFBQTtBQUNyRCxJQUFBLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBRW5DLFFBQ0kvRyxJQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLGtCQUFrQixhQUU3QkQsR0FDSSxDQUFBLFFBQUEsRUFBQSxFQUFBLElBQUksRUFBQyxRQUFRLEVBQ2IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxpQkFBaUIsQ0FBQyxFQUMvRCxPQUFPLEVBQUUsQ0FBQyxDQUFDLEtBQUk7b0JBQ1gsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3BCLG9CQUFBLE1BQU0sRUFBRSxDQUFDO2lCQUNaLEVBQ0QsS0FBSyxFQUFDLFVBQVUsZ0JBQ0wsZUFBZSxFQUFBLFFBQUEsRUFFMUJBLEdBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxLQUFLLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxJQUFJLEVBQUMsY0FBYyxFQUMvRCxRQUFBLEVBQUFBLEdBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBTSxDQUFDLEVBQUMscUlBQXFJLEVBQUcsQ0FBQSxFQUFBLENBQzlJLEVBQ0QsQ0FBQSxFQUdUQSxnQkFDSSxJQUFJLEVBQUMsUUFBUSxFQUNiLFNBQVMsRUFBRSxVQUFVLENBQUMscUJBQXFCLEVBQUUsbUJBQW1CLENBQUMsRUFDakUsT0FBTyxFQUFFLENBQUMsQ0FBQyxLQUFJO29CQUNYLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNwQixvQkFBQSxRQUFRLEVBQUUsQ0FBQztBQUNmLGlCQUFDLEVBQ0QsS0FBSyxFQUFDLFlBQVksRUFDUCxZQUFBLEVBQUEsaUJBQWlCLFlBRTVCQyxJQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBSyxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsSUFBSSxFQUFDLE9BQU8sRUFBQyxXQUFXLEVBQUMsSUFBSSxFQUFDLGNBQWMsRUFBQSxRQUFBLEVBQUEsQ0FDL0RELGNBQU0sQ0FBQyxFQUFDLGlLQUFpSyxFQUFHLENBQUEsRUFDNUtBLGNBQ0ksUUFBUSxFQUFDLFNBQVMsRUFDbEIsQ0FBQyxFQUFDLDRPQUE0TyxFQUFBLENBQ2hQLElBQ0EsRUFDRCxDQUFBLENBQUEsRUFBQSxDQUNQLEVBQ1I7QUFDTjs7QUNwQ00sU0FBVSxnQkFBZ0IsQ0FBQyxFQUM3QixFQUFFLEVBQ0YsS0FBSyxFQUNMLE9BQU8sRUFDUCxnQkFBZ0IsRUFDaEIsUUFBUSxFQUNSLGlCQUFpQixFQUNqQixNQUFNLEVBQ04sUUFBUSxFQUNSLFdBQVcsR0FBRyxLQUFLLEVBQ0MsRUFBQTtBQUNwQixJQUFBLE1BQU0sRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxHQUFHLFdBQVcsQ0FBQztRQUN6RixFQUFFO0FBQ0wsS0FBQSxDQUFDLENBQUM7QUFFSCxJQUFBLE1BQU0sS0FBSyxHQUFHO1FBQ1YsU0FBUyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUM1QyxVQUFVO1FBQ1Ysc0JBQXNCLEVBQUUsQ0FBRyxFQUFBLGlCQUFpQixDQUFJLEVBQUEsQ0FBQTtLQUM1QixDQUFDO0FBRXpCLElBQUEsUUFDSUMsSUFDSSxDQUFBLEtBQUEsRUFBQSxFQUFBLEdBQUcsRUFBRSxVQUFVLEVBQ2YsS0FBSyxFQUFFLEtBQUssRUFDWixTQUFTLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxxQkFBcUIsRUFBRTtZQUNyRCxJQUFJLEVBQUUsQ0FBQyxXQUFXO0FBQ2xCLFlBQUEsb0JBQW9CLEVBQUUsVUFBVTtBQUNuQyxTQUFBLENBQUMsRUFFRixRQUFBLEVBQUEsQ0FBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxzQkFBc0IsRUFBQSxRQUFBLEVBQUEsQ0FFakNELEdBQ0ksQ0FBQSxRQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsaUJBQWlCLEVBQ3ZCLEdBQUEsVUFBVSxFQUNWLEdBQUEsU0FBUyxFQUNELFlBQUEsRUFBQSxDQUFBLHlCQUFBLEVBQTRCLEtBQUssR0FBRyxDQUFDLENBQUEsRUFBQSxFQUFLLE9BQU8sQ0FBQSxDQUFFLEVBQy9ELElBQUksRUFBQyxRQUFRLEVBRWIsUUFBQSxFQUFBQSxHQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFDLE9BQU8sRUFBYSxhQUFBLEVBQUEsTUFBTSxFQUFDLE9BQU8sRUFBQyxXQUFXLEVBQ3pELFFBQUEsRUFBQUEsR0FBQSxDQUFBLE1BQUEsRUFBQSxFQUFNLENBQUMsRUFBQywrUkFBK1IsRUFBQSxDQUFRLEVBQzdTLENBQUEsRUFBQSxDQUNELEVBRVRBLEdBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBTSxTQUFTLEVBQUMsdUJBQXVCLEVBQUEsUUFBQSxFQUFFLE9BQU8sRUFBQSxDQUFRLEVBRXhEQSxHQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsUUFBQSxFQUNJQSxHQUFDLENBQUEsY0FBYyxFQUFDLEVBQUEsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFBLENBQUksRUFDcEQsQ0FBQSxDQUFBLEVBQUEsQ0FDSixFQUNOQyxJQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFDLGtCQUFrQixFQUFBLFFBQUEsRUFBQSxDQUM1QixRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsS0FDaEJELEdBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMsbUJBQW1CLEVBQUEsUUFBQSxFQUM3QixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sTUFDMUJDLElBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBa0IsU0FBUyxFQUFDLGtCQUFrQixFQUFBLFFBQUEsRUFBQSxDQUFBLGVBQUEsRUFDdEMsT0FBTyxDQUFBLEVBQUEsRUFETCxNQUFNLENBRVYsQ0FDVCxDQUFDLEVBQ0EsQ0FBQSxDQUNULEVBQ0RELEdBQUEsQ0FBQSxLQUFBLEVBQUEsRUFDSSxTQUFTLEVBQUMsd0JBQXdCLEVBQ2xDLHVCQUF1QixFQUFFLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEVBQUEsQ0FDdkQsQ0FDQSxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQ0osRUFDUjtBQUNOOztBQ2hFTSxTQUFVLFdBQVcsQ0FBQyxLQUF1QixFQUFBO0FBQy9DLElBQUEsTUFBTSxFQUNGLE9BQU8sRUFBRSxjQUFjLEVBQ3ZCLE9BQU8sRUFBRSxjQUFjLEVBQ3ZCLE1BQU0sRUFBRSxhQUFhLEVBQ3JCLFNBQVMsRUFBRSxnQkFBZ0IsR0FBRyxFQUFFLEVBQ2hDLE1BQU0sRUFDTixRQUFRLEVBQ1IsS0FBSyxHQUFHLEtBQUssRUFDYixRQUFRLEdBQUcsS0FBSyxFQUNuQixHQUFHLEtBQUssQ0FBQztJQUVWLE1BQU0sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEdBQUcsUUFBUSxDQUFvQixhQUFhLENBQUMsQ0FBQztJQUN2RSxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzdELE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDOztJQUd0RCxNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDckQsSUFBQSxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUV4QyxNQUFNLFVBQVUsR0FBRyxNQUFLO0FBQ3BCLFFBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNqQixLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUN0QyxPQUFPO1NBQ1Y7QUFDRCxRQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDakIsS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDcEMsT0FBTztTQUNWO0FBQ0QsUUFBQSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDOUQsS0FBQyxDQUFDO0FBRUYsSUFBQSxRQUNJQyxJQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFFLFVBQVUsQ0FBQyxlQUFlLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUM5RSxRQUFBLEVBQUEsQ0FBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxzQkFBc0IsRUFBQSxRQUFBLEVBQUEsQ0FDakNELEdBQUssQ0FBQSxJQUFBLEVBQUEsRUFBQSxRQUFBLEVBQUEsS0FBSyxHQUFHLGFBQWEsR0FBRyxVQUFVLEVBQUEsQ0FBTSxFQUM3Q0EsR0FBQSxDQUFBLFFBQUEsRUFBQSxFQUNJLFNBQVMsRUFBQyxxQkFBcUIsRUFDL0IsT0FBTyxFQUFFLFFBQVEsRUFDakIsSUFBSSxFQUFDLFFBQVEsRUFBQSxZQUFBLEVBQ0YsT0FBTyxFQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsQ0FHYixDQUNQLEVBQUEsQ0FBQSxFQUVOQyxJQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLG9CQUFvQixFQUUvQixRQUFBLEVBQUEsQ0FBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxnQkFBZ0IsRUFBQSxRQUFBLEVBQUEsQ0FDM0JBLElBQU8sQ0FBQSxPQUFBLEVBQUEsRUFBQSxPQUFPLEVBQUMsYUFBYSxFQUFBLFFBQUEsRUFBQSxDQUFBLG1CQUFBLEVBQ1BELEdBQU0sQ0FBQSxNQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsY0FBYyxFQUFTLFFBQUEsRUFBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FDcEQsRUFDUkEsR0FBQSxDQUFBLE9BQUEsRUFBQSxFQUNJLEVBQUUsRUFBQyxhQUFhLEVBQ2hCLElBQUksRUFBQyxNQUFNLEVBQ1gsU0FBUyxFQUFDLGdCQUFnQixFQUMxQixLQUFLLEVBQUUsT0FBTyxFQUNkLFFBQVEsRUFBRSxDQUFDLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDM0MsV0FBVyxFQUFDLGtDQUFrQyxFQUM5QyxRQUFRLEVBQ1YsSUFBQSxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQ0EsRUFHTkMsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxnQkFBZ0IsRUFBQSxRQUFBLEVBQUEsQ0FDM0JBLElBQU8sQ0FBQSxPQUFBLEVBQUEsRUFBQSxPQUFPLEVBQUMsZUFBZSxFQUNmLFFBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQUQsR0FBQSxDQUFBLE1BQUEsRUFBQSxFQUFNLFNBQVMsRUFBQyxjQUFjLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQSxDQUFTLElBQzlDLEVBQ1JBLEdBQUEsQ0FBQSxPQUFBLEVBQUEsRUFDSSxFQUFFLEVBQUMsZUFBZSxFQUNsQixJQUFJLEVBQUMsUUFBUSxFQUNiLFNBQVMsRUFBQyxnQkFBZ0IsRUFDMUIsS0FBSyxFQUFFLFNBQVMsRUFDaEIsUUFBUSxFQUFFLENBQUMsQ0FBQyxLQUFLLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUNyRCxRQUFRLEVBQUEsSUFBQSxFQUNSLEdBQUcsRUFBQyxHQUFHLEVBQ1AsSUFBSSxFQUFDLElBQUksRUFBQSxDQUNYLEVBQ0ZBLEdBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBTyxTQUFTLEVBQUMsZUFBZSxFQUFBLFFBQUEsRUFBQSwwRkFBQSxFQUFBLENBR3hCLENBQ04sRUFBQSxDQUFBLEVBR05DLElBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsZ0JBQWdCLEVBQzNCLFFBQUEsRUFBQSxDQUFBQSxJQUFBLENBQUEsT0FBQSxFQUFBLEVBQU8sT0FBTyxFQUFDLFlBQVksRUFBQSxRQUFBLEVBQUEsQ0FBQSxpQkFBQSxFQUNSRCxjQUFNLFNBQVMsRUFBQyxjQUFjLEVBQUEsUUFBQSxFQUFBLEdBQUEsRUFBQSxDQUFTLENBQ2xELEVBQUEsQ0FBQSxFQUNSQyxJQUNJLENBQUEsUUFBQSxFQUFBLEVBQUEsRUFBRSxFQUFDLFlBQVksRUFDZixTQUFTLEVBQUMsaUJBQWlCLEVBQzNCLEtBQUssRUFBRSxNQUFNLEVBQ2IsUUFBUSxFQUFFLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQTBCLENBQUMsRUFBQSxRQUFBLEVBQUEsQ0FFL0RELEdBQVEsQ0FBQSxRQUFBLEVBQUEsRUFBQSxLQUFLLEVBQUMsTUFBTSxFQUFjLFFBQUEsRUFBQSxNQUFBLEVBQUEsQ0FBQSxFQUNsQ0EsR0FBUSxDQUFBLFFBQUEsRUFBQSxFQUFBLEtBQUssRUFBQyxVQUFVLEVBQWtCLFFBQUEsRUFBQSxVQUFBLEVBQUEsQ0FBQSxFQUMxQ0EsR0FBUSxDQUFBLFFBQUEsRUFBQSxFQUFBLEtBQUssRUFBQyxNQUFNLEVBQUEsUUFBQSxFQUFBLFlBQUEsRUFBQSxDQUFvQixDQUNuQyxFQUFBLENBQUEsRUFDVEMsSUFBTyxDQUFBLE9BQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxlQUFlLEVBQzNCLFFBQUEsRUFBQSxDQUFBLE1BQU0sS0FBSyxNQUFNLElBQUksdUNBQXVDLEVBQzVELE1BQU0sS0FBSyxVQUFVO0FBQ2xCLHdDQUFBLGtEQUFrRCxFQUNyRCxNQUFNLEtBQUssTUFBTSxJQUFJLHVDQUF1QyxDQUN6RCxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQ04sRUFHTkEsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxnQkFBZ0IsRUFDM0IsUUFBQSxFQUFBLENBQUFBLElBQUEsQ0FBQSxPQUFBLEVBQUEsRUFBTyxPQUFPLEVBQUMsYUFBYSxFQUNULFFBQUEsRUFBQSxDQUFBLGlCQUFBLEVBQUFELEdBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBTSxTQUFTLEVBQUMsY0FBYyxFQUFTLFFBQUEsRUFBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FDbEQsRUFDUkEsR0FDSSxDQUFBLFVBQUEsRUFBQSxFQUFBLEVBQUUsRUFBQyxhQUFhLEVBQ2hCLFNBQVMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLEVBQUU7QUFDdkMsb0NBQUEsNEJBQTRCLEVBQUUsV0FBVztpQ0FDNUMsQ0FBQyxFQUNGLEtBQUssRUFBRSxPQUFPLEVBQ2QsUUFBUSxFQUFFLENBQUMsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUMzQyxXQUFXLEVBQUMsZ0NBQWdDLEVBQzVDLElBQUksRUFBRSxFQUFFLEVBQ1IsUUFBUSxFQUFBLElBQUEsRUFBQSxDQUNWLEVBR0QsV0FBVyxLQUNSQyxJQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLG1CQUFtQixFQUFBLFFBQUEsRUFBQSxDQUM5QkQsNkRBQXFDLEVBQ3JDQSxHQUFBLENBQUEsSUFBQSxFQUFBLEVBQUEsUUFBQSxFQUNLLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUNyQkEsR0FBQSxDQUFBLElBQUEsRUFBQSxFQUFBLFFBQUEsRUFBYSxPQUFPLEVBQVgsRUFBQSxDQUFDLENBQWdCLENBQzdCLENBQUMsR0FDRCxDQUNILEVBQUEsQ0FBQSxDQUNULElBQ0MsRUFHTkEsR0FBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxnQkFBZ0IsRUFBQSxRQUFBLEVBQzNCQyxpQkFDSSxJQUFJLEVBQUMsUUFBUSxFQUNiLFNBQVMsRUFBQyxvQkFBb0IsRUFDOUIsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBRTFDLFFBQUEsRUFBQSxDQUFBLFdBQVcsR0FBRyxNQUFNLEdBQUcsTUFBTSxFQUN6QixVQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FDUCxFQUdMLFdBQVcsS0FDUkEsSUFBSyxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxrQkFBa0IsRUFBQSxRQUFBLEVBQUEsQ0FDN0JELG1DQUFpQixFQUNqQkEsR0FBQSxDQUFBLEtBQUEsRUFBQSxFQUNJLFNBQVMsRUFBQywwQkFBMEIsRUFDcEMsdUJBQXVCLEVBQUUsRUFBRSxNQUFNLEVBQUUsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxHQUN0RSxDQUNBLEVBQUEsQ0FBQSxDQUNULElBQ0MsRUFHTkMsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxzQkFBc0IsYUFDakNELEdBQVEsQ0FBQSxRQUFBLEVBQUEsRUFBQSxJQUFJLEVBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQywyQkFBMkIsRUFBQyxPQUFPLEVBQUUsUUFBUSx1QkFFcEUsRUFDVEEsR0FBQSxDQUFBLFFBQUEsRUFBQSxFQUNJLElBQUksRUFBQyxRQUFRLEVBQ2IsU0FBUyxFQUFDLHlCQUF5QixFQUNuQyxPQUFPLEVBQUUsVUFBVSxFQUNuQixRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFlBRTNDLEtBQUssR0FBRyxZQUFZLEdBQUcsY0FBYyxFQUNqQyxDQUFBLENBQUEsRUFBQSxDQUNQLENBQ0osRUFBQSxDQUFBLEVBQ1I7QUFDTjs7QUNuSkE7O0FBRUc7QUFDYSxTQUFBLGVBQWUsQ0FBQyxFQUM1QixLQUFLLEVBQ0wsV0FBVyxFQUNYLGFBQWEsRUFDYixpQkFBaUIsRUFDakIsVUFBVSxFQUNWLFlBQVksRUFDWixTQUFTLEVBQ1QsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsVUFBVSxFQUNWLFlBQVksRUFDWixjQUFjLEVBQ2QsU0FBUyxFQUNULGNBQWMsRUFDSyxFQUFBO0lBQ25CLE1BQU0sQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFMUQsSUFBQSxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQ3RCLFNBQVMsQ0FBQyxhQUFhLEVBQUU7QUFDckIsUUFBQSxvQkFBb0IsRUFBRTtBQUNsQixZQUFBLFFBQVEsRUFBRSxDQUFDO0FBQ2QsU0FBQTtBQUNKLEtBQUEsQ0FBQyxFQUNGLFNBQVMsQ0FBQyxjQUFjLEVBQUU7QUFDdEIsUUFBQSxnQkFBZ0IsRUFBRSwyQkFBMkI7QUFDaEQsS0FBQSxDQUFDLENBQ0wsQ0FBQztBQUVGLElBQUEsTUFBTSxlQUFlLEdBQUcsQ0FBQyxNQUFzQixLQUFJO1FBQy9DLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNCLEtBQUMsQ0FBQztBQUVGLElBQUEsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFtQixLQUFJO1FBQzFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQixLQUFDLENBQUM7QUFFRixJQUFBLFFBQ0lBLEdBQUMsQ0FBQSxVQUFVLElBQ1AsT0FBTyxFQUFFLE9BQU8sRUFDaEIsa0JBQWtCLEVBQUUsYUFBYSxFQUNqQyxXQUFXLEVBQUUsZUFBZSxFQUM1QixTQUFTLEVBQUUsYUFBYSxFQUV4QixRQUFBLEVBQUFBLEdBQUEsQ0FBQyxlQUFlLEVBQUMsRUFBQSxLQUFLLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSwyQkFBMkIsWUFDdEVDLElBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsb0RBQW9ELEVBQUEsUUFBQSxFQUFBLENBRTlELGNBQWMsS0FDWEQsYUFBSyxTQUFTLEVBQUMsa0NBQWtDLEVBQzdDLFFBQUEsRUFBQUEsR0FBQSxDQUFDLFdBQVcsRUFDUixFQUFBLE9BQU8sRUFBQyxFQUFFLEVBQ1YsT0FBTyxFQUFDLEVBQUUsRUFDVixNQUFNLEVBQUMsTUFBTSxFQUNiLFNBQVMsRUFBRSxnQkFBZ0IsRUFDM0IsTUFBTSxFQUFFLFNBQVMsRUFDakIsUUFBUSxFQUFFLGNBQWMsRUFDeEIsS0FBSyxFQUFFLElBQUksRUFDWCxRQUFRLEVBQUUsSUFBSSxHQUNoQixFQUNBLENBQUEsQ0FDVCxFQUVBLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxLQUFJOztBQUV2Qix3QkFBQSxJQUFJLGdCQUFnQixLQUFLLEtBQUssRUFBRTs0QkFDNUIsUUFDSUEsR0FFSSxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxnQ0FBZ0MsRUFFMUMsUUFBQSxFQUFBQSxHQUFBLENBQUMsV0FBVyxFQUFBLEVBQ1IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUNyQixNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFDMUIsU0FBUyxFQUFFLGdCQUFnQixJQUFJLGdCQUFnQixFQUMvQyxNQUFNLEVBQUUsVUFBVSxFQUNsQixRQUFRLEVBQUUsWUFBWSxFQUN0QixLQUFLLEVBQUUsS0FBSyxFQUNaLFFBQVEsRUFBRSxJQUFJLEVBQ2hCLENBQUEsRUFBQSxFQVpHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FhckIsRUFDUjt5QkFDTDtBQUVELHdCQUFBLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzFFLHdCQUFBLE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRXRFLHdCQUFBLFFBQ0lBLEdBQUEsQ0FBQyxnQkFBZ0IsRUFBQSxFQUViLEVBQUUsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQ3RCLEtBQUssRUFBRSxLQUFLLEVBQ1osT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ3JCLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxRQUFRLEVBQUUsUUFBUSxFQUNsQixpQkFBaUIsRUFBRSxpQkFBaUIsRUFDcEMsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUMvQixRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQ25DLFdBQVcsRUFBRSxhQUFhLEVBVHJCLEVBQUEsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQVV6QixFQUNKO0FBQ04scUJBQUMsQ0FBQyxDQUFBLEVBQUEsQ0FDQSxFQUNRLENBQUEsRUFBQSxDQUNULEVBQ2Y7QUFDTjs7QUNwSkE7O0FBRUc7QUFDRyxTQUFVLGFBQWEsQ0FBQyxLQUF5QixFQUFBO0lBQ25ELE1BQU0sRUFDRixNQUFNLEVBQ04sS0FBSyxFQUNMLE9BQU8sRUFDUCxTQUFTLEVBQ1QsUUFBUSxFQUNSLFdBQVcsR0FBRyxTQUFTLEVBQ3ZCLFVBQVUsR0FBRyxRQUFRLEVBQ3JCLGFBQWEsR0FBRyxLQUFLLEVBQ3hCLEdBQUcsS0FBSyxDQUFDO0lBRVYsSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNULFFBQUEsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUVELElBQUEsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQW1DLEtBQUk7UUFDL0QsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxhQUFhLEVBQUU7QUFDOUIsWUFBQSxRQUFRLEVBQUUsQ0FBQztTQUNkO0FBQ0wsS0FBQyxDQUFDO0FBRUYsSUFBQSxRQUNJQSxHQUFBLENBQUEsS0FBQSxFQUFBLEVBQ0ksU0FBUyxFQUFDLDRCQUE0QixFQUN0QyxPQUFPLEVBQUUsa0JBQWtCLEVBQzNCLElBQUksRUFBQyxjQUFjLEVBQUEsUUFBQSxFQUVuQkMsSUFDSSxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxvQkFBb0IsRUFDOUIsSUFBSSxFQUFDLGFBQWEsRUFDRixpQkFBQSxFQUFBLGNBQWMsRUFDYixrQkFBQSxFQUFBLGdCQUFnQixFQUVqQyxRQUFBLEVBQUEsQ0FBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQywyQkFBMkIsRUFBQSxRQUFBLEVBQUEsQ0FDckMsYUFBYSxLQUNWRCxHQUFBLENBQUEsS0FBQSxFQUFBLEVBQ0ksU0FBUyxFQUFDLGlDQUFpQyxFQUMzQyxLQUFLLEVBQUMsSUFBSSxFQUNWLE1BQU0sRUFBQyxJQUFJLEVBQ1gsT0FBTyxFQUFDLFdBQVcsRUFDbkIsSUFBSSxFQUFDLGNBQWMsRUFBQSxRQUFBLEVBRW5CQSxHQUFNLENBQUEsTUFBQSxFQUFBLEVBQUEsQ0FBQyxFQUFDLHdQQUF3UCxHQUFHLEVBQ2pRLENBQUEsQ0FDVCxFQUNEQSxHQUFBLENBQUEsSUFBQSxFQUFBLEVBQUksRUFBRSxFQUFDLGNBQWMsRUFBQyxTQUFTLEVBQUMsMEJBQTBCLEVBQUEsUUFBQSxFQUNyRCxLQUFLLEVBQUEsQ0FDTCxDQUNILEVBQUEsQ0FBQSxFQUVOQSxHQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsRUFBRSxFQUFDLGdCQUFnQixFQUFDLFNBQVMsRUFBQyw0QkFBNEIsRUFDMUQsUUFBQSxFQUFBLE9BQU8sRUFDTixDQUFBLEVBRU5DLElBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsNEJBQTRCLGFBQ3ZDRCxHQUNJLENBQUEsUUFBQSxFQUFBLEVBQUEsSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixFQUFFLGdCQUFnQixDQUFDLEVBQ2pFLE9BQU8sRUFBRSxRQUFRLEVBQUEsUUFBQSxFQUVoQixVQUFVLEVBQUEsQ0FDTixFQUNUQSxHQUFBLENBQUEsUUFBQSxFQUFBLEVBQ0ksSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixFQUFFLGlCQUFpQixFQUFFO0FBQy9ELGdDQUFBLHFCQUFxQixFQUFFLGFBQWE7NkJBQ3ZDLENBQUMsRUFDRixPQUFPLEVBQUUsU0FBUyxFQUFBLFFBQUEsRUFFakIsV0FBVyxFQUFBLENBQ1AsQ0FDUCxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQ0osRUFDSixDQUFBLEVBQ1I7QUFDTjs7QUNwRkE7OztBQUdHO0FBQ0csU0FBVSxTQUFTLENBQUMsRUFDdEIsa0JBQWtCLEVBQ2xCLGVBQWUsRUFDZixjQUFjLEVBQ0QsRUFBQTtBQUNiLElBQUEsUUFDSUEsR0FFSSxDQUFBRSxRQUFBLEVBQUEsRUFBQSxRQUFBLEVBQUFGLEdBQUEsQ0FBQyxhQUFhLEVBQ1YsRUFBQSxNQUFNLEVBQUUsa0JBQWtCLEtBQUssSUFBSSxFQUNuQyxLQUFLLEVBQUMsaUJBQWlCLEVBQ3ZCLE9BQU8sRUFBQyw4RUFBOEUsRUFDdEYsU0FBUyxFQUFFLGVBQWUsRUFDMUIsUUFBUSxFQUFFLGNBQWMsRUFDeEIsV0FBVyxFQUFDLFFBQVEsRUFDcEIsVUFBVSxFQUFDLFFBQVEsRUFDbkIsYUFBYSxFQUFFLElBQUksRUFDckIsQ0FBQSxFQUFBLENBQ0gsRUFDTDtBQUNOOztBQ3RCTSxTQUFVLFlBQVksQ0FBQyxLQUFpQyxFQUFBO0lBQzFELE1BQU0sRUFDRixjQUFjLEVBQ2QsUUFBUSxFQUNSLFVBQVUsRUFDVixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixpQkFBaUIsRUFDakIsWUFBWSxFQUNaLFVBQVUsRUFDVixZQUFZLEVBQ1osY0FBYyxFQUNkLGNBQWMsRUFDZCxrQkFBa0I7O0lBRWxCLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsc0JBQXNCLEVBQ3RCLDBCQUEwQixFQUM3QixHQUFHLEtBQUssQ0FBQzs7QUFHVixJQUFBLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUM5QixPQUFPO1FBQ0gsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtRQUNoQixzQkFBc0I7UUFDdEIsMEJBQTBCO0tBQzdCLENBQUMsRUFDRixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFFLDBCQUEwQixDQUFDLENBQzNGLENBQUM7O0lBR0YsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEdBQUcsVUFBVSxDQUFDO1FBQ25FLGNBQWM7UUFDZCxVQUFVO1FBQ1YsUUFBUTtRQUNSLGtCQUFrQjtRQUNsQixrQkFBa0I7QUFDckIsS0FBQSxDQUFDLENBQUM7O0FBR0gsSUFBQSxNQUFNLFNBQVMsR0FBRyxXQUFXLEVBQUUsQ0FBQztJQUNoQyxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7SUFHdEQsTUFBTSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsYUFBYSxFQUFFLEdBQUcsYUFBYSxDQUFDO1FBQ3hGLGNBQWM7UUFDZCxVQUFVO1FBQ1Ysa0JBQWtCO1FBQ2xCLFNBQVM7UUFDVCxZQUFZO1FBQ1osY0FBYztRQUNkLGNBQWM7UUFDZCxrQkFBa0I7QUFDckIsS0FBQSxDQUFDLENBQUM7O0FBR0gsSUFBQSxNQUFNLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsUUFBUSxDQUFjLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztJQUMzRSxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztBQUdqRSxJQUFBLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLE1BQUs7QUFDbEMsUUFBQSxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLEVBQUU7QUFDckMsWUFBQSxPQUFPLFNBQVMsQ0FBQztTQUNwQjtRQUVELE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQztBQUN4RSxRQUFBLElBQUksa0JBQWtCLEtBQUssU0FBUyxFQUFFO0FBQ2xDLFlBQUEsT0FBTyxrQkFBa0IsQ0FBQztTQUM3QjtRQUVELElBQ0ksY0FBYyxLQUFLLFVBQVU7WUFDN0IsVUFBVTtZQUNWLGtCQUFrQjtZQUNsQixVQUFVLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUNoRDtBQUNFLFlBQUEsSUFBSTtBQUNBLGdCQUFBLE1BQU0sR0FBRyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FDOUIsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FDL0MsQ0FBQyxLQUFLLENBQUM7QUFDUixnQkFBQSxPQUFPLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO2FBQ25EO1lBQUMsT0FBTyxHQUFHLEVBQUU7QUFDVixnQkFBQSxPQUFPLENBQUMsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQy9FO1NBQ0o7QUFFRCxRQUFBLE9BQU8sU0FBUyxDQUFDO0FBQ3JCLEtBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7O0lBR3hGLFNBQVMsQ0FBQyxNQUFLO0FBQ1gsUUFBQSxNQUFNLFNBQVMsR0FBRyxZQUFXO0FBQ3pCLFlBQUEsSUFBSSxZQUFZLElBQUksVUFBVSxFQUFFO0FBQzVCLGdCQUFBLE1BQU0sT0FBTyxHQUFHLE1BQU0sYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRCxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDM0I7QUFBTSxpQkFBQSxJQUFJLFlBQVksSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDcEMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3hCO2lCQUFNO2dCQUNILGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN6QjtBQUNMLFNBQUMsQ0FBQztBQUVGLFFBQUEsU0FBUyxFQUFFLENBQUM7QUFDaEIsS0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7O0lBRy9CLFNBQVMsQ0FBQyxNQUFLO1FBQ1gsSUFBSSxnQkFBZ0IsRUFBRTtZQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNoQztBQUNMLEtBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7O0FBRzlCLElBQUEsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFhLEtBQVU7QUFDdkMsUUFBQSxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksS0FBSTtBQUN0QixZQUFBLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdCLFlBQUEsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ25CLGdCQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDeEI7aUJBQU07QUFDSCxnQkFBQSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3JCO0FBQ0QsWUFBQSxPQUFPLE1BQU0sQ0FBQztBQUNsQixTQUFDLENBQUMsQ0FBQztBQUNQLEtBQUMsQ0FBQzs7SUFHRixNQUFNLFNBQVMsR0FBRyxNQUFXO1FBQ3pCLElBQUksV0FBVyxFQUFFO0FBQ2IsWUFBQSxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDNUIsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pCO2FBQU07WUFDSCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEI7QUFDTCxLQUFDLENBQUM7O0lBR0YsU0FBUyxDQUFDLE1BQUs7UUFDWCxJQUFJLEtBQUssRUFBRTtBQUNQLFlBQUEsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQy9FLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUNsQztBQUNMLEtBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDOztJQUczQixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDOztJQUc1RSxNQUFNLGdCQUFnQixHQUFHLE1BQVc7QUFDaEMsUUFBQSxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLEVBQUU7WUFDckMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzdCO0FBQ0QsUUFBQSxJQUFJLFNBQVMsQ0FBQyxjQUFjLEVBQUU7WUFDMUIsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQzlCO0FBQ0wsS0FBQyxDQUFDOztJQUdGLElBQUksU0FBUyxFQUFFO1FBQ1gsUUFDSUEsYUFBSyxTQUFTLEVBQUMsdUJBQXVCLEVBQ2xDLFFBQUEsRUFBQUEsR0FBQSxDQUFBLEdBQUEsRUFBQSxFQUFBLFFBQUEsRUFBQSxzQkFBQSxFQUFBLENBQTJCLEVBQ3pCLENBQUEsRUFDUjtLQUNMO0lBRUQsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUM5QixRQUNJQSxhQUFLLFNBQVMsRUFBQyxxQkFBcUIsRUFDaEMsUUFBQSxFQUFBQSxHQUFBLENBQUEsR0FBQSxFQUFBLEVBQUEsUUFBQSxFQUFBLHlCQUFBLEVBQUEsQ0FBOEIsRUFDNUIsQ0FBQSxFQUNSO0tBQ0w7QUFFRCxJQUFBLFFBQ0lDLElBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMseUJBQXlCLEVBQUEsUUFBQSxFQUFBLENBQ3BDRCxJQUFDLFNBQVMsRUFBQSxFQUNOLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxXQUFXLEVBQUUsV0FBVyxFQUN4QixnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQ3pDLFdBQVcsRUFBRSxTQUFTLEVBQ3RCLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFDNUIsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGNBQWMsRUFDMUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQUEsQ0FDdEMsRUFFRCxTQUFTLENBQUMsUUFBUSxJQUFJLGdCQUFnQixJQUNuQ0EsR0FBQyxDQUFBLGVBQWUsSUFDWixLQUFLLEVBQUUsS0FBSyxFQUNaLFdBQVcsRUFBRSxXQUFXLEVBQ3hCLGFBQWEsRUFBRSxhQUFhLEVBQzVCLGlCQUFpQixFQUFFLGlCQUFpQixJQUFJLEdBQUcsRUFDM0MsVUFBVSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsRUFDdEMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQ3JDLFNBQVMsRUFBRSxhQUFhLEVBQ3hCLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsRUFDNUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQ2xDLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxVQUFVLEVBQUUsY0FBYyxFQUMxQixZQUFZLEVBQUUsZ0JBQWdCLEVBQzlCLGNBQWMsRUFBRSxTQUFTLENBQUMsY0FBYyxFQUN4QyxTQUFTLEVBQUUsYUFBYSxFQUN4QixjQUFjLEVBQUUsZ0JBQWdCLEVBQ2xDLENBQUEsS0FFRkEsR0FBQSxDQUFDLFlBQVksRUFDVCxFQUFBLEtBQUssRUFBRSxLQUFLLEVBQ1osYUFBYSxFQUFFLGFBQWEsRUFDNUIsaUJBQWlCLEVBQUUsaUJBQWlCLElBQUksR0FBRyxFQUMzQyxZQUFZLEVBQUUsVUFBVSxFQUMxQixDQUFBLENBQ0wsRUFFREEsR0FBQyxDQUFBLFNBQVMsSUFDTixrQkFBa0IsRUFBRSxTQUFTLENBQUMsa0JBQWtCLEVBQ2hELGVBQWUsRUFBRSxtQkFBbUIsRUFDcEMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQ3hDLENBQUEsQ0FBQSxFQUFBLENBQ0EsRUFDUjtBQUNOOzs7OyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOls2LDksMTAsMTMsMTQsMTUsMTZdfQ==
