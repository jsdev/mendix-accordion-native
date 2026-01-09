define(['exports', 'react/jsx-runtime', 'react', 'big.js', 'react-dom'], (function (exports, jsxRuntime, React, Big, reactDom) { 'use strict';

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
        const [editMode, setEditMode] = React.useState(false);
        const [editingItemIndex, setEditingItemIndex] = React.useState(null);
        const [showCreateForm, setShowCreateForm] = React.useState(false);
        const [deleteConfirmIndex, setDeleteConfirmIndex] = React.useState(null);
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
        const [databaseItems, setDatabaseItems] = React.useState([]);
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
        React.useEffect(() => {
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
        const items = React.useMemo(() => {
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
        const defaultSortOrder = React.useMemo(() => {
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
        React.useEffect(() => {
            if (dataSourceType === "database" && dataSource && sortOrderAttribute) {
                if (dataSource.setSortOrder && sortOrderAttribute.id) {
                    dataSource.setSortOrder([[sortOrderAttribute.id, "asc"]]);
                }
            }
        }, [dataSourceType, dataSource, sortOrderAttribute]);
        // Generate unique IDs for sortable items
        const sortableIds = React.useMemo(() => {
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
        const handleSaveEdit = React.useCallback(async (summary, content, format, sortOrder) => {
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
        const handleSaveNew = React.useCallback(async (summary, content, format, sortOrder) => {
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
        const handleConfirmDelete = React.useCallback(() => {
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
        const handleDragEnd = React.useCallback((event) => {
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
        return (jsxRuntime.jsx("button", { type: "button", className: classNames("faq-edit-mode-toggle", {
                "faq-edit-mode-active": editMode
            }), onClick: onToggle, disabled: disabled, "aria-label": editMode ? "Switch to view mode" : "Switch to edit mode", title: editMode ? "View Mode" : "Edit Mode", children: editMode ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [jsxRuntime.jsx("path", { d: "M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" }), jsxRuntime.jsx("path", { d: "M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" })] }), jsxRuntime.jsx("span", { children: "View" })] })) : (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" }) }), jsxRuntime.jsx("span", { children: "Edit" })] })) }));
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
        return (jsxRuntime.jsxs("div", { className: "faq-accordion-header", children: [showToggleButton && (jsxRuntime.jsx("button", { className: classNames("faq-toggle-all-btn", {
                        "faq-toggle-all-btn--expanded": allExpanded
                    }), onClick: onToggleAll, type: "button", children: getToggleButtonText() })), isEditingEnabled && (jsxRuntime.jsxs("div", { className: "faq-editing-controls", children: [editMode && (jsxRuntime.jsxs("button", { type: "button", className: "faq-create-new-btn", onClick: onCreateNew, "aria-label": "Create new FAQ item", children: [jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" }) }), "Create New"] })), jsxRuntime.jsx(EditModeToggle, { editMode: editMode, onToggle: onToggleEditMode })] }))] }));
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
        return (jsxRuntime.jsx("div", { className: "faq-accordion-items", children: items.map((item, index) => {
                const isExpanded = expandedItems.has(index);
                const summaryValue = item.summary;
                const contentValue = item.content;
                const contentFormat = item.contentFormat;
                // Process content based on format and sanitize
                const processedContent = processContent(contentValue, contentFormat);
                // Get validation warnings (only for HTML format)
                const warnings = getContentWarnings(contentValue, contentFormat);
                return (jsxRuntime.jsxs("details", { className: classNames("faq-item", {
                        "faq-item--expanded": isExpanded
                    }), open: isExpanded, style: {
                        "--animation-duration": `${animationDuration}ms`
                    }, children: [jsxRuntime.jsxs("summary", { className: "faq-item-summary", onClick: (e) => {
                                e.preventDefault();
                                onToggleItem(index);
                            }, onKeyDown: (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onToggleItem(index);
                                }
                            }, tabIndex: 0, role: "button", "aria-expanded": isExpanded, children: [jsxRuntime.jsx("span", { className: "faq-item-summary-text", children: summaryValue }), jsxRuntime.jsx("span", { className: classNames("faq-item-icon", {
                                        "faq-item-icon--expanded": isExpanded
                                    }), children: jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: jsxRuntime.jsx("path", { d: "M4 6L8 10L12 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }), jsxRuntime.jsxs("div", { className: "faq-item-content", children: [warnings.length > 0 && (jsxRuntime.jsx("div", { className: "faq-item-warnings", children: warnings.map((warning, wIndex) => (jsxRuntime.jsxs("div", { className: "faq-item-warning", children: ["\u26A0\uFE0F ", warning] }, wIndex))) })), jsxRuntime.jsx("div", { className: "faq-item-content-inner", dangerouslySetInnerHTML: { __html: processedContent } })] })] }, index));
            }) }));
    }

    function useCombinedRefs() {
      for (var _len = arguments.length, refs = new Array(_len), _key = 0; _key < _len; _key++) {
        refs[_key] = arguments[_key];
      }
      return React.useMemo(() => node => {
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

    const useIsomorphicLayoutEffect = canUseDOM ? React.useLayoutEffect : React.useEffect;
    function useEvent(handler) {
      const handlerRef = React.useRef(handler);
      useIsomorphicLayoutEffect(() => {
        handlerRef.current = handler;
      });
      return React.useCallback(function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        return handlerRef.current == null ? void 0 : handlerRef.current(...args);
      }, []);
    }
    function useInterval() {
      const intervalRef = React.useRef(null);
      const set = React.useCallback((listener, duration) => {
        intervalRef.current = setInterval(listener, duration);
      }, []);
      const clear = React.useCallback(() => {
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
      const valueRef = React.useRef(value);
      useIsomorphicLayoutEffect(() => {
        if (valueRef.current !== value) {
          valueRef.current = value;
        }
      }, dependencies);
      return valueRef;
    }
    function useLazyMemo(callback, dependencies) {
      const valueRef = React.useRef();
      return React.useMemo(() => {
        const newValue = callback(valueRef.current);
        valueRef.current = newValue;
        return newValue;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [...dependencies]);
    }
    function useNodeRef(onChange) {
      const onChangeHandler = useEvent(onChange);
      const node = React.useRef(null);
      const setNodeRef = React.useCallback(element => {
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
      const ref = React.useRef();
      React.useEffect(() => {
        ref.current = value;
      }, [value]);
      return ref.current;
    }
    let ids = {};
    function useUniqueId(prefix, value) {
      return React.useMemo(() => {
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
      const [announcement, setAnnouncement] = React.useState('');
      const announce = React.useCallback(value => {
        if (value != null) {
          setAnnouncement(value);
        }
      }, []);
      return {
        announce,
        announcement
      };
    }

    const DndMonitorContext = /*#__PURE__*/React.createContext(null);
    function useDndMonitor(listener) {
      const registerListener = React.useContext(DndMonitorContext);
      React.useEffect(() => {
        if (!registerListener) {
          throw new Error('useDndMonitor must be used within a children of <DndContext>');
        }
        const unsubscribe = registerListener(listener);
        return unsubscribe;
      }, [listener, registerListener]);
    }
    function useDndMonitorProvider() {
      const [listeners] = React.useState(() => new Set());
      const registerListener = React.useCallback(listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }, [listeners]);
      const dispatch = React.useCallback(_ref => {
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
      const [mounted, setMounted] = React.useState(false);
      React.useEffect(() => {
        setMounted(true);
      }, []);
      useDndMonitor(React.useMemo(() => ({
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
      return container ? reactDom.createPortal(markup, container) : markup;
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
      return React.useMemo(() => ({
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
      return React.useMemo(() => [...sensors].filter(sensor => sensor != null),
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
      const scrollSpeed = React.useRef({
        x: 0,
        y: 0
      });
      const scrollDirection = React.useRef({
        x: 0,
        y: 0
      });
      const rect = React.useMemo(() => {
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
      const scrollContainerRef = React.useRef(null);
      const autoScroll = React.useCallback(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) {
          return;
        }
        const scrollLeft = scrollSpeed.current.x * scrollDirection.current.x;
        const scrollTop = scrollSpeed.current.y * scrollDirection.current.y;
        scrollContainer.scrollBy(scrollLeft, scrollTop);
      }, []);
      const sortedScrollableAncestors = React.useMemo(() => order === TraversalOrder.TreeOrder ? [...scrollableAncestors].reverse() : scrollableAncestors, [order, scrollableAncestors]);
      React.useEffect(() => {
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
      return React.useMemo(() => sensors.reduce((accumulator, sensor) => {
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
      const [queue, setQueue] = React.useState(null);
      const {
        frequency,
        measure,
        strategy
      } = config;
      const containersRef = React.useRef(containers);
      const disabled = isDisabled();
      const disabledRef = useLatestValue(disabled);
      const measureDroppableContainers = React.useCallback(function (ids) {
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
      const timeoutId = React.useRef(null);
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
      React.useEffect(() => {
        containersRef.current = containers;
      }, [containers]);
      React.useEffect(() => {
        if (disabled) {
          return;
        }
        measureDroppableContainers();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [dragging, disabled]);
      React.useEffect(() => {
        if (queue && queue.length > 0) {
          setQueue(null);
        }
      },
      //eslint-disable-next-line react-hooks/exhaustive-deps
      [JSON.stringify(queue)]);
      React.useEffect(() => {
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
      const mutationObserver = React.useMemo(() => {
        if (disabled || typeof window === 'undefined' || typeof window.MutationObserver === 'undefined') {
          return undefined;
        }
        const {
          MutationObserver
        } = window;
        return new MutationObserver(handleMutations);
      }, [handleMutations, disabled]);
      React.useEffect(() => {
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
      const resizeObserver = React.useMemo(() => {
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
      React.useEffect(() => {
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
      const [rect, setRect] = React.useState(null);
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
      const previousNode = React.useRef(node);
      const ancestors = useLazyMemo(previousValue => {
        if (!node) {
          return defaultValue$1;
        }
        if (previousValue && previousValue !== defaultValue$1 && node && previousNode.current && node.parentNode === previousNode.current.parentNode) {
          return previousValue;
        }
        return getScrollableAncestors(node);
      }, [node]);
      React.useEffect(() => {
        previousNode.current = node;
      }, [node]);
      return ancestors;
    }
    function useScrollOffsets(elements) {
      const [scrollCoordinates, setScrollCoordinates] = React.useState(null);
      const prevElements = React.useRef(elements); // To-do: Throttle the handleScroll callback

      const handleScroll = React.useCallback(event => {
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
      React.useEffect(() => {
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
      return React.useMemo(() => {
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
      const initialScrollOffsets = React.useRef(null);
      React.useEffect(() => {
        initialScrollOffsets.current = null;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      dependencies);
      React.useEffect(() => {
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
      React.useEffect(() => {
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
      return React.useMemo(() => {
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
      return React.useMemo(() => element ? getWindowClientRect(element) : null, [element]);
    }
    const defaultValue$2 = [];
    function useRects(elements, measure) {
      if (measure === void 0) {
        measure = getClientRect;
      }
      const [firstElement] = elements;
      const windowRect = useWindowRect(firstElement ? getWindow(firstElement) : null);
      const [rects, setRects] = React.useState(defaultValue$2);
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
      const [rect, setRect] = React.useState(null);
      const handleResize = React.useCallback(entries => {
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
      const handleNodeChange = React.useCallback(element => {
        const node = getMeasurableNode(element);
        resizeObserver == null ? void 0 : resizeObserver.disconnect();
        if (node) {
          resizeObserver == null ? void 0 : resizeObserver.observe(node);
        }
        setRect(node ? measure(node) : null);
      }, [measure, resizeObserver]);
      const [nodeRef, setRef] = useNodeRef(handleNodeChange);
      return React.useMemo(() => ({
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
    const InternalContext = /*#__PURE__*/React.createContext(defaultInternalContext);
    const PublicContext = /*#__PURE__*/React.createContext(defaultPublicContext);
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
      } = React.useContext(InternalContext);
      const previousActivatorEvent = usePrevious(activatorEvent);
      const previousActiveId = usePrevious(active == null ? void 0 : active.id); // Restore keyboard focus on the activator node

      React.useEffect(() => {
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
      return React.useMemo(() => ({
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
      const initialized = React.useRef(false);
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
    const ActiveDraggableContext = /*#__PURE__*/React.createContext({
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
    const DndContext = /*#__PURE__*/React.memo(function DndContext(_ref) {
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
      const store = React.useReducer(reducer, undefined, getInitialState);
      const [state, dispatch] = store;
      const [dispatchMonitorEvent, registerMonitorListener] = useDndMonitorProvider();
      const [status, setStatus] = React.useState(Status.Uninitialized);
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
      const activeRects = React.useRef({
        initial: null,
        translated: null
      });
      const active = React.useMemo(() => {
        var _node$data;
        return activeId != null ? {
          id: activeId,
          // It's possible for the active node to unmount while dragging
          data: (_node$data = node == null ? void 0 : node.data) != null ? _node$data : defaultData,
          rect: activeRects
        } : null;
      }, [activeId, node]);
      const activeRef = React.useRef(null);
      const [activeSensor, setActiveSensor] = React.useState(null);
      const [activatorEvent, setActivatorEvent] = React.useState(null);
      const latestProps = useLatestValue(props, Object.values(props));
      const draggableDescribedById = useUniqueId("DndDescribedBy", id);
      const enabledDroppableContainers = React.useMemo(() => droppableContainers.getEnabled(), [droppableContainers]);
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
      const activationCoordinates = React.useMemo(() => activatorEvent ? getEventCoordinates(activatorEvent) : null, [activatorEvent]);
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
      const sensorContext = React.useRef({
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
      const [over, setOver] = React.useState(null); // When there is no drag overlay used, we need to account for the
      // window scroll delta

      const appliedTranslate = usesDragOverlay ? modifiedTranslate : add(modifiedTranslate, activeNodeScrollDelta);
      const transform = adjustScale(appliedTranslate, (_over$rect = over == null ? void 0 : over.rect) != null ? _over$rect : null, activeNodeRect);
      const activeSensorRef = React.useRef(null);
      const instantiateSensor = React.useCallback((event, _ref2) => {
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
            reactDom.unstable_batchedUpdates(() => {
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
            reactDom.unstable_batchedUpdates(() => {
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
      const bindActivatorToSensorInstantiator = React.useCallback((handler, sensor) => {
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
      React.useEffect(() => {
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
        reactDom.unstable_batchedUpdates(() => {
          onDragMove == null ? void 0 : onDragMove(event);
          dispatchMonitorEvent({
            type: 'onDragMove',
            event
          });
        });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [scrollAdjustedTranslate.x, scrollAdjustedTranslate.y]);
      React.useEffect(() => {
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
        reactDom.unstable_batchedUpdates(() => {
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
      const publicContext = React.useMemo(() => {
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
      const internalContext = React.useMemo(() => {
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
    const NullContext = /*#__PURE__*/React.createContext(null);
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
      } = React.useContext(InternalContext);
      const {
        role = defaultRole,
        roleDescription = 'draggable',
        tabIndex = 0
      } = attributes != null ? attributes : {};
      const isDragging = (active == null ? void 0 : active.id) === id;
      const transform = React.useContext(isDragging ? ActiveDraggableContext : NullContext);
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
      const memoizedAttributes = React.useMemo(() => ({
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
      return React.useContext(PublicContext);
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
      } = React.useContext(InternalContext);
      const previous = React.useRef({
        disabled
      });
      const resizeObserverConnected = React.useRef(false);
      const rect = React.useRef(null);
      const callbackId = React.useRef(null);
      const {
        disabled: resizeObserverDisabled,
        updateMeasurementsFor,
        timeout: resizeObserverTimeout
      } = {
        ...defaultResizeObserverConfig,
        ...resizeObserverConfig
      };
      const ids = useLatestValue(updateMeasurementsFor != null ? updateMeasurementsFor : id);
      const handleResize = React.useCallback(() => {
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
      const handleNodeChange = React.useCallback((newElement, previousElement) => {
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
      React.useEffect(() => {
        if (!resizeObserver || !nodeRef.current) {
          return;
        }
        resizeObserver.disconnect();
        resizeObserverConnected.current = false;
        resizeObserver.observe(nodeRef.current);
      }, [nodeRef, resizeObserver]);
      React.useEffect(() => {
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
      React.useEffect(() => {
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
      const items = React.useMemo(() => userDefinedItems.map(item => typeof item === 'object' && 'id' in item ? item.id : item), [userDefinedItems]);
      const isDragging = active != null;
      const activeIndex = active ? items.indexOf(active.id) : -1;
      const overIndex = over ? items.indexOf(over.id) : -1;
      const previousItemsRef = React.useRef(items);
      const itemsHaveChanged = !itemsEqual(items, previousItemsRef.current);
      const disableTransforms = overIndex !== -1 && activeIndex === -1 || itemsHaveChanged;
      const disabled = normalizeDisabled(disabledProp);
      useIsomorphicLayoutEffect(() => {
        if (itemsHaveChanged && isDragging) {
          measureDroppableContainers(items);
        }
      }, [itemsHaveChanged, items, isDragging, measureDroppableContainers]);
      React.useEffect(() => {
        previousItemsRef.current = items;
      }, [items]);
      const contextValue = React.useMemo(() => ({
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
      const [derivedTransform, setDerivedtransform] = React.useState(null);
      const previousIndex = React.useRef(index);
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
      React.useEffect(() => {
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
      } = React.useContext(Context);
      const disabled = normalizeLocalDisabled(localDisabled, globalDisabled);
      const index = items.indexOf(id);
      const data = React.useMemo(() => ({
        sortable: {
          containerId,
          index,
          items
        },
        ...customData
      }), [containerId, customData, index, items]);
      const itemsAfterCurrentSortable = React.useMemo(() => items.slice(items.indexOf(id)), [items, id]);
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
      const previous = React.useRef({
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
      React.useEffect(() => {
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
      React.useEffect(() => {
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
        return (jsxRuntime.jsxs("div", { className: "faq-item-actions", children: [jsxRuntime.jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-edit"), onClick: (e) => {
                        e.stopPropagation();
                        onEdit();
                    }, title: "Edit FAQ", "aria-label": "Edit FAQ item", children: jsxRuntime.jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" }) }) }), jsxRuntime.jsx("button", { type: "button", className: classNames("faq-item-action-btn", "faq-action-delete"), onClick: (e) => {
                        e.stopPropagation();
                        onDelete();
                    }, title: "Delete FAQ", "aria-label": "Delete FAQ item", children: jsxRuntime.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: [jsxRuntime.jsx("path", { d: "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" }), jsxRuntime.jsx("path", { fillRule: "evenodd", d: "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" })] }) })] }));
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
        return (jsxRuntime.jsxs("div", { ref: setNodeRef, style: style, className: classNames("faq-item", "faq-item--edit-mode", {
                open: !collapseAll,
                "faq-item--dragging": isDragging
            }), children: [jsxRuntime.jsxs("div", { className: "faq-item-header-edit", children: [jsxRuntime.jsx("button", { className: "faq-drag-handle", ...attributes, ...listeners, "aria-label": `Drag to reorder FAQ item ${index + 1}: ${summary}`, type: "button", children: jsxRuntime.jsx("svg", { focusable: "false", "aria-hidden": "true", viewBox: "0 0 24 24", children: jsxRuntime.jsx("path", { d: "M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2m-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2" }) }) }), jsxRuntime.jsx("span", { className: "faq-item-summary-text", children: summary }), jsxRuntime.jsx("div", { children: jsxRuntime.jsx(FAQItemActions, { onEdit: onEdit, onDelete: onDelete }) })] }), jsxRuntime.jsxs("div", { className: "faq-item-content", children: [warnings.length > 0 && (jsxRuntime.jsx("div", { className: "faq-item-warnings", children: warnings.map((warning, wIndex) => (jsxRuntime.jsxs("div", { className: "faq-item-warning", children: ["\u26A0\uFE0F ", warning] }, wIndex))) })), jsxRuntime.jsx("div", { className: "faq-item-content-inner", dangerouslySetInnerHTML: { __html: processedContent } })] })] }));
    }

    function EditFAQForm(props) {
        const { summary: initialSummary, content: initialContent, format: initialFormat, sortOrder: initialSortOrder = 10, onSave, onCancel, isNew = false, isInline = false } = props;
        const [summary, setSummary] = React.useState(initialSummary);
        const [content, setContent] = React.useState(initialContent);
        const [format, setFormat] = React.useState(initialFormat);
        const [sortOrder, setSortOrder] = React.useState(initialSortOrder);
        const [showPreview, setShowPreview] = React.useState(false);
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
        return (jsxRuntime.jsxs("div", { className: classNames("faq-edit-form", { "faq-edit-form--inline": isInline }), children: [jsxRuntime.jsxs("div", { className: "faq-edit-form-header", children: [jsxRuntime.jsx("h3", { children: isNew ? "Add New FAQ" : "Edit FAQ" }), jsxRuntime.jsx("button", { className: "faq-edit-form-close", onClick: onCancel, type: "button", "aria-label": "Close", children: "\u2715" })] }), jsxRuntime.jsxs("div", { className: "faq-edit-form-body", children: [jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-summary", children: ["Question/Summary ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsx("input", { id: "faq-summary", type: "text", className: "faq-form-input", value: summary, onChange: (e) => setSummary(e.target.value), placeholder: "Enter the question or summary...", required: true })] }), jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-sortorder", children: ["Sort Order ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsx("input", { id: "faq-sortorder", type: "number", className: "faq-form-input", value: sortOrder, onChange: (e) => setSortOrder(Number(e.target.value)), required: true, min: "0", step: "10" }), jsxRuntime.jsx("small", { className: "faq-form-help", children: "Items are displayed in ascending sort order (10, 20, 30...). Lower numbers appear first." })] }), jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-format", children: ["Content Format ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsxs("select", { id: "faq-format", className: "faq-form-select", value: format, onChange: (e) => setFormat(e.target.value), children: [jsxRuntime.jsx("option", { value: "html", children: "HTML" }), jsxRuntime.jsx("option", { value: "markdown", children: "Markdown" }), jsxRuntime.jsx("option", { value: "text", children: "Plain Text" })] }), jsxRuntime.jsxs("small", { className: "faq-form-help", children: [format === "html" && "Allows rich formatting with HTML tags", format === "markdown" &&
                                            "Uses Markdown syntax (e.g., **bold**, # heading)", format === "text" && "Plain text only, HTML will be escaped"] })] }), jsxRuntime.jsxs("div", { className: "faq-form-field", children: [jsxRuntime.jsxs("label", { htmlFor: "faq-content", children: ["Answer/Content ", jsxRuntime.jsx("span", { className: "faq-required", children: "*" })] }), jsxRuntime.jsx("textarea", { id: "faq-content", className: classNames("faq-form-textarea", {
                                        "faq-form-textarea--warning": hasWarnings
                                    }), value: content, onChange: (e) => setContent(e.target.value), placeholder: "Enter the answer or content...", rows: 10, required: true }), hasWarnings && (jsxRuntime.jsxs("div", { className: "faq-form-warnings", children: [jsxRuntime.jsx("strong", { children: "\u26A0\uFE0F Content Warnings:" }), jsxRuntime.jsx("ul", { children: warnings.map((warning, i) => (jsxRuntime.jsx("li", { children: warning }, i))) })] }))] }), jsxRuntime.jsx("div", { className: "faq-form-field", children: jsxRuntime.jsxs("button", { type: "button", className: "faq-preview-toggle", onClick: () => setShowPreview(!showPreview), children: [showPreview ? "Hide" : "Show", " Preview"] }) }), showPreview && (jsxRuntime.jsxs("div", { className: "faq-form-preview", children: [jsxRuntime.jsx("h4", { children: "Preview:" }), jsxRuntime.jsx("div", { className: "faq-form-preview-content", dangerouslySetInnerHTML: { __html: processContent(content, format) } })] }))] }), jsxRuntime.jsxs("div", { className: "faq-edit-form-footer", children: [jsxRuntime.jsx("button", { type: "button", className: "faq-btn faq-btn-secondary", onClick: onCancel, children: "Cancel" }), jsxRuntime.jsx("button", { type: "button", className: "faq-btn faq-btn-primary", onClick: handleSave, disabled: !summary.trim() || !content.trim(), children: isNew ? "Create FAQ" : "Save Changes" })] })] }));
    }

    /**
     * Renders the FAQ items list in edit mode with drag-and-drop reordering
     */
    function FAQEditableList({ items, sortableIds, expandedItems, animationDuration, onEditItem, onDeleteItem, onDragEnd, editingItemIndex, editingSortOrder, defaultSortOrder, onSaveEdit, onCancelEdit, showCreateForm, onSaveNew, onCancelCreate }) {
        const [isDraggingAny, setIsDraggingAny] = React.useState(false);
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
        return (jsxRuntime.jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragStart: handleDragStart, onDragEnd: handleDragEnd, children: jsxRuntime.jsx(SortableContext, { items: sortableIds, strategy: verticalListSortingStrategy, children: jsxRuntime.jsxs("div", { className: "faq-accordion-items faq-accordion-items--edit-mode", children: [showCreateForm && (jsxRuntime.jsx("div", { className: "faq-item faq-item--inline-create", children: jsxRuntime.jsx(EditFAQForm, { summary: "", content: "", format: "html", sortOrder: defaultSortOrder, onSave: onSaveNew, onCancel: onCancelCreate, isNew: true, isInline: true }) })), items.map((item, index) => {
                            // If this item is being edited, show the inline form
                            if (editingItemIndex === index) {
                                return (jsxRuntime.jsx("div", { className: "faq-item faq-item--inline-edit", children: jsxRuntime.jsx(EditFAQForm, { summary: item.summary, content: item.content, format: item.contentFormat, sortOrder: editingSortOrder ?? defaultSortOrder, onSave: onSaveEdit, onCancel: onCancelEdit, isNew: false, isInline: true }) }, sortableIds[index]));
                            }
                            const processedContent = processContent(item.content, item.contentFormat);
                            const warnings = getContentWarnings(item.content, item.contentFormat);
                            return (jsxRuntime.jsx(DraggableFAQItem, { id: sortableIds[index], index: index, summary: item.summary, processedContent: processedContent, warnings: warnings, animationDuration: animationDuration, onEdit: () => onEditItem(index), onDelete: () => onDeleteItem(index), collapseAll: isDraggingAny }, sortableIds[index]));
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
        return (jsxRuntime.jsx("div", { className: "faq-confirm-dialog-overlay", onClick: handleOverlayClick, role: "presentation", children: jsxRuntime.jsxs("div", { className: "faq-confirm-dialog", role: "alertdialog", "aria-labelledby": "dialog-title", "aria-describedby": "dialog-message", children: [jsxRuntime.jsxs("div", { className: "faq-confirm-dialog-header", children: [isDestructive && (jsxRuntime.jsx("svg", { className: "faq-confirm-dialog-icon-warning", width: "24", height: "24", viewBox: "0 0 16 16", fill: "currentColor", children: jsxRuntime.jsx("path", { d: "M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" }) })), jsxRuntime.jsx("h3", { id: "dialog-title", className: "faq-confirm-dialog-title", children: title })] }), jsxRuntime.jsx("div", { id: "dialog-message", className: "faq-confirm-dialog-message", children: message }), jsxRuntime.jsxs("div", { className: "faq-confirm-dialog-actions", children: [jsxRuntime.jsx("button", { type: "button", className: classNames("faq-confirm-dialog-btn", "faq-btn-cancel"), onClick: onCancel, children: cancelText }), jsxRuntime.jsx("button", { type: "button", className: classNames("faq-confirm-dialog-btn", "faq-btn-confirm", {
                                    "faq-btn-destructive": isDestructive
                                }), onClick: onConfirm, children: confirmText })] })] }) }));
    }

    /**
     * Component that renders FAQ modals (delete confirmation)
     * Note: Create and Edit forms are now rendered inline in FAQEditableList
     */
    function FAQModals({ deleteConfirmIndex, onConfirmDelete, onCancelDelete }) {
        return (jsxRuntime.jsx(jsxRuntime.Fragment, { children: jsxRuntime.jsx(ConfirmDialog, { isOpen: deleteConfirmIndex !== null, title: "Delete FAQ Item", message: "Are you sure you want to delete this FAQ item? This action cannot be undone.", onConfirm: onConfirmDelete, onCancel: onCancelDelete, confirmText: "Delete", cancelText: "Cancel", isDestructive: true }) }));
    }

    function FAQAccordion(props) {
        const { dataSourceType, faqItems, dataSource, defaultExpandAll, showToggleButton, toggleButtonText, animationDuration, allowEditing, editorRole, onSaveAction, onDeleteAction, onCreateAction, sortOrderAttribute, 
        // Attribute overrides (optional)
        summaryAttribute, contentAttribute, contentFormatAttribute, sortOrderAttributeOverride } = props;
        // Attribute overrides for useFAQData and useFAQActions (pass the ListAttributeValue objects directly)
        const attributeOverrides = React.useMemo(() => ({
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
        const [userHasRole, setUserHasRole] = React.useState(false);
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
        const [expandedItems, setExpandedItems] = React.useState(new Set());
        const [allExpanded, setAllExpanded] = React.useState(defaultExpandAll);
        // Calculate editing sort order for the edit form
        const editingSortOrder = React.useMemo(() => {
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
        React.useEffect(() => {
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
        React.useEffect(() => {
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
        React.useEffect(() => {
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
            return (jsxRuntime.jsx("div", { className: "faq-accordion-loading", children: jsxRuntime.jsx("p", { children: "Loading FAQ items..." }) }));
        }
        if (!items || items.length === 0) {
            return (jsxRuntime.jsx("div", { className: "faq-accordion-empty", children: jsxRuntime.jsx("p", { children: "No FAQ items configured" }) }));
        }
        return (jsxRuntime.jsxs("div", { className: "faq-accordion-container", children: [jsxRuntime.jsx(FAQHeader, { showToggleButton: showToggleButton, allExpanded: allExpanded, toggleButtonText: toggleButtonText?.value, onToggleAll: toggleAll, isEditingEnabled: isEditingEnabled, editMode: editState.editMode, onToggleEditMode: editState.toggleEditMode, onCreateNew: editState.startCreating }), editState.editMode && isEditingEnabled ? (jsxRuntime.jsx(FAQEditableList, { items: items, sortableIds: sortableIds, expandedItems: expandedItems, animationDuration: animationDuration || 300, onEditItem: editState.startEditingItem, onDeleteItem: editState.startDeleting, onDragEnd: handleDragEnd, editingItemIndex: editState.editingItemIndex, editingSortOrder: editingSortOrder, defaultSortOrder: defaultSortOrder, onSaveEdit: handleSaveEdit, onCancelEdit: handleCancelEdit, showCreateForm: editState.showCreateForm, onSaveNew: handleSaveNew, onCancelCreate: handleCancelEdit })) : (jsxRuntime.jsx(FAQItemsList, { items: items, expandedItems: expandedItems, animationDuration: animationDuration || 300, onToggleItem: toggleItem })), jsxRuntime.jsx(FAQModals, { deleteConfirmIndex: editState.deleteConfirmIndex, onConfirmDelete: handleConfirmDelete, onCancelDelete: editState.cancelDelete })] }));
    }

    exports.FAQAccordion = FAQAccordion;

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRkFRQWNjb3JkaW9uLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdXRpbHMvZWRpdGluZ1V0aWxzLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2hvb2tzL3VzZUVkaXRNb2RlLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbmZpZy9hdHRyaWJ1dGVDb25maWcudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvdXRpbHMvbWVuZGl4RGF0YVNlcnZpY2UudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvaG9va3MvdXNlRkFRRGF0YS50cyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9ob29rcy91c2VGQVFBY3Rpb25zLnRzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsYXNzbmFtZXMvaW5kZXguanMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9FZGl0TW9kZVRvZ2dsZS50c3giLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9GQVFIZWFkZXIudHN4IiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2RvbXB1cmlmeS9kaXN0L3B1cmlmeS5lcy5tanMiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvbWFya2VkL2xpYi9tYXJrZWQuZXNtLmpzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3IudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9GQVFJdGVtc0xpc3QudHN4IiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BkbmQta2l0L3V0aWxpdGllcy9kaXN0L3V0aWxpdGllcy5lc20uanMiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGRuZC1raXQvYWNjZXNzaWJpbGl0eS9kaXN0L2FjY2Vzc2liaWxpdHkuZXNtLmpzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BkbmQta2l0L2NvcmUvZGlzdC9jb3JlLmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AZG5kLWtpdC9zb3J0YWJsZS9kaXN0L3NvcnRhYmxlLmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ZBUUl0ZW1BY3Rpb25zLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0RyYWdnYWJsZUZBUUl0ZW0udHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRWRpdEZBUUZvcm0udHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRkFRRWRpdGFibGVMaXN0LnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbmZpcm1EaWFsb2cudHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRkFRTW9kYWxzLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9GQVFBY2NvcmRpb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIGVkaXRpbmcgbW9kZSBhbmQgcm9sZS1iYXNlZCBhY2Nlc3MgY29udHJvbFxuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IHVzZXIgaGFzIHRoZSByZXF1aXJlZCByb2xlIGZvciBlZGl0aW5nXG4gKiBAcGFyYW0gcmVxdWlyZWRSb2xlIC0gVGhlIHJvbGUgbmFtZSByZXF1aXJlZCAoZW1wdHkgc3RyaW5nID0gYWxsIGF1dGhlbnRpY2F0ZWQgdXNlcnMpXG4gKiBAcmV0dXJucyBQcm9taXNlPGJvb2xlYW4+IC0gVHJ1ZSBpZiB1c2VyIGhhcyBhY2Nlc3NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrVXNlclJvbGUocmVxdWlyZWRSb2xlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAvLyBJZiBubyByb2xlIHNwZWNpZmllZCwgYWxsb3cgYWxsIGF1dGhlbnRpY2F0ZWQgdXNlcnNcbiAgICBpZiAoIXJlcXVpcmVkUm9sZSB8fCByZXF1aXJlZFJvbGUudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIFVzZSBNZW5kaXggQ2xpZW50IEFQSSB0byBjaGVjayB1c2VyIHJvbGVzXG4gICAgICAgIC8vIE5vdGU6IEluIGFjdHVhbCBNZW5kaXggcnVudGltZSwgeW91J2QgdXNlIG14LnNlc3Npb24gb3Igc2ltaWxhclxuICAgICAgICAvLyBUaGlzIGlzIGEgcGxhY2Vob2xkZXIgLSBNZW5kaXggd2lkZ2V0cyB0eXBpY2FsbHkgdXNlIHNlcnZlci1zaWRlIHZhbGlkYXRpb25cbiAgICAgICAgLy8gRm9yIG5vdywgd2UnbGwgcmV0dXJuIHRydWUgYW5kIHJlbHkgb24gbWljcm9mbG93IHZhbGlkYXRpb25cbiAgICAgICAgY29uc29sZS5sb2coYENoZWNraW5nIHJvbGU6ICR7cmVxdWlyZWRSb2xlfWApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2hlY2tpbmcgdXNlciByb2xlOlwiLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGlmIGVkaXRpbmcgaXMgYWxsb3dlZCBiYXNlZCBvbiBjb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gYWxsb3dFZGl0aW5nIC0gV2hldGhlciBlZGl0aW5nIGlzIGVuYWJsZWRcbiAqIEBwYXJhbSBkYXRhU291cmNlVHlwZSAtIFR5cGUgb2YgZGF0YSBzb3VyY2VcbiAqIEBwYXJhbSBoYXNSb2xlIC0gV2hldGhlciB1c2VyIGhhcyByZXF1aXJlZCByb2xlXG4gKiBAcmV0dXJucyBib29sZWFuIC0gVHJ1ZSBpZiBlZGl0aW5nIHNob3VsZCBiZSBhbGxvd2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5FZGl0KGFsbG93RWRpdGluZzogYm9vbGVhbiwgZGF0YVNvdXJjZVR5cGU6IHN0cmluZywgaGFzUm9sZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIC8vIEVkaXRpbmcgb25seSB3b3JrcyB3aXRoIGRhdGFiYXNlIG1vZGVcbiAgICBpZiAoZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRWRpdGluZyBtdXN0IGJlIGVuYWJsZWRcbiAgICBpZiAoIWFsbG93RWRpdGluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVXNlciBtdXN0IGhhdmUgcmVxdWlyZWQgcm9sZVxuICAgIHJldHVybiBoYXNSb2xlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHRlbXBvcmFyeSBJRCBmb3IgbmV3IEZBUSBpdGVtcyBiZWZvcmUgdGhleSdyZSBzYXZlZFxuICogQHJldHVybnMgc3RyaW5nIC0gVGVtcG9yYXJ5IElEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVRlbXBJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgdGVtcF8ke0RhdGUubm93KCl9XyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpfWA7XG59XG4iLCIvKipcbiAqIEN1c3RvbSBob29rIGZvciBtYW5hZ2luZyBlZGl0IG1vZGUgc3RhdGUgaW4gRkFRIEFjY29yZGlvblxuICogQ2VudHJhbGl6ZXMgYWxsIGVkaXQtcmVsYXRlZCBzdGF0ZSBhbmQgYWN0aW9uc1xuICovXG5cbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlRWRpdE1vZGVSZXR1cm4ge1xuICAgIC8vIFN0YXRlXG4gICAgZWRpdE1vZGU6IGJvb2xlYW47XG4gICAgZWRpdGluZ0l0ZW1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBzaG93Q3JlYXRlRm9ybTogYm9vbGVhbjtcbiAgICBkZWxldGVDb25maXJtSW5kZXg6IG51bWJlciB8IG51bGw7XG5cbiAgICAvLyBBY3Rpb25zXG4gICAgdG9nZ2xlRWRpdE1vZGU6ICgpID0+IHZvaWQ7XG4gICAgc3RhcnRFZGl0aW5nSXRlbTogKGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG4gICAgY2FuY2VsRWRpdGluZzogKCkgPT4gdm9pZDtcbiAgICBzdGFydENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIHN0YXJ0RGVsZXRpbmc6IChpbmRleDogbnVtYmVyKSA9PiB2b2lkO1xuICAgIGNvbmZpcm1EZWxldGU6ICgpID0+IHZvaWQ7XG4gICAgY2FuY2VsRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaEVkaXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgZmluaXNoQ3JlYXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgZmluaXNoRGVsZXRpbmc6ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogSG9vayBmb3IgbWFuYWdpbmcgRkFRIGVkaXQgbW9kZSBzdGF0ZVxuICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgZWRpdCBzdGF0ZSBhbmQgYWN0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRWRpdE1vZGUoKTogVXNlRWRpdE1vZGVSZXR1cm4ge1xuICAgIGNvbnN0IFtlZGl0TW9kZSwgc2V0RWRpdE1vZGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtlZGl0aW5nSXRlbUluZGV4LCBzZXRFZGl0aW5nSXRlbUluZGV4XSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtzaG93Q3JlYXRlRm9ybSwgc2V0U2hvd0NyZWF0ZUZvcm1dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtkZWxldGVDb25maXJtSW5kZXgsIHNldERlbGV0ZUNvbmZpcm1JbmRleF0gPSB1c2VTdGF0ZTxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICAgIC8vIFRvZ2dsZSBiZXR3ZWVuIGVkaXQgYW5kIHZpZXcgbW9kZVxuICAgIGNvbnN0IHRvZ2dsZUVkaXRNb2RlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFZGl0TW9kZSghZWRpdE1vZGUpO1xuICAgICAgICBzZXRFZGl0aW5nSXRlbUluZGV4KG51bGwpO1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybShmYWxzZSk7XG4gICAgfTtcblxuICAgIC8vIFN0YXJ0IGVkaXRpbmcgYSBzcGVjaWZpYyBpdGVtXG4gICAgY29uc3Qgc3RhcnRFZGl0aW5nSXRlbSA9IChpbmRleDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgoaW5kZXgpO1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybShmYWxzZSk7XG4gICAgfTtcblxuICAgIC8vIENhbmNlbCBlZGl0aW5nIGN1cnJlbnQgaXRlbVxuICAgIGNvbnN0IGNhbmNlbEVkaXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIC8vIEZpbmlzaCBlZGl0aW5nIGN1cnJlbnQgaXRlbSAoYWZ0ZXIgc3VjY2Vzc2Z1bCBzYXZlKVxuICAgIGNvbnN0IGZpbmlzaEVkaXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIC8vIFN0YXJ0IGNyZWF0aW5nIGEgbmV3IGl0ZW1cbiAgICBjb25zdCBzdGFydENyZWF0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybSh0cnVlKTtcbiAgICAgICAgc2V0RWRpdGluZ0l0ZW1JbmRleChudWxsKTtcbiAgICB9O1xuXG4gICAgLy8gQ2FuY2VsIGNyZWF0aW5nIG5ldyBpdGVtXG4gICAgY29uc3QgY2FuY2VsQ3JlYXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgLy8gRmluaXNoIGNyZWF0aW5nIG5ldyBpdGVtIChhZnRlciBzdWNjZXNzZnVsIHNhdmUpXG4gICAgY29uc3QgZmluaXNoQ3JlYXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgLy8gU3RhcnQgZGVsZXRlIGNvbmZpcm1hdGlvbiBmb3IgYW4gaXRlbVxuICAgIGNvbnN0IHN0YXJ0RGVsZXRpbmcgPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBzZXREZWxldGVDb25maXJtSW5kZXgoaW5kZXgpO1xuICAgIH07XG5cbiAgICAvLyBDb25maXJtIGFuZCBwcm9jZWVkIHdpdGggZGVsZXRpb25cbiAgICBjb25zdCBjb25maXJtRGVsZXRlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIGluZGV4IGZvciBjYWxsZXIgdG8gaGFuZGxlLCB0aGVuIGNsZWFyXG4gICAgICAgIC8vIENhbGxlciBzaG91bGQgY2FsbCBmaW5pc2hEZWxldGluZygpIGFmdGVyIGRlbGV0aW9uIHN1Y2NlZWRzXG4gICAgfTtcblxuICAgIC8vIENhbmNlbCBkZWxldGlvblxuICAgIGNvbnN0IGNhbmNlbERlbGV0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KG51bGwpO1xuICAgIH07XG5cbiAgICAvLyBGaW5pc2ggZGVsZXRpb24gKGFmdGVyIHN1Y2Nlc3NmdWwgZGVsZXRlKVxuICAgIGNvbnN0IGZpbmlzaERlbGV0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXREZWxldGVDb25maXJtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFN0YXRlXG4gICAgICAgIGVkaXRNb2RlLFxuICAgICAgICBlZGl0aW5nSXRlbUluZGV4LFxuICAgICAgICBzaG93Q3JlYXRlRm9ybSxcbiAgICAgICAgZGVsZXRlQ29uZmlybUluZGV4LFxuXG4gICAgICAgIC8vIEFjdGlvbnNcbiAgICAgICAgdG9nZ2xlRWRpdE1vZGUsXG4gICAgICAgIHN0YXJ0RWRpdGluZ0l0ZW0sXG4gICAgICAgIGNhbmNlbEVkaXRpbmcsXG4gICAgICAgIHN0YXJ0Q3JlYXRpbmcsXG4gICAgICAgIGNhbmNlbENyZWF0aW5nLFxuICAgICAgICBzdGFydERlbGV0aW5nLFxuICAgICAgICBjb25maXJtRGVsZXRlLFxuICAgICAgICBjYW5jZWxEZWxldGUsXG4gICAgICAgIGZpbmlzaEVkaXRpbmcsXG4gICAgICAgIGZpbmlzaENyZWF0aW5nLFxuICAgICAgICBmaW5pc2hEZWxldGluZ1xuICAgIH07XG59XG4iLCIvKipcbiAqIEZBUSBBY2NvcmRpb24gQXR0cmlidXRlIENvbmZpZ3VyYXRpb25cbiAqXG4gKiBUaGlzIGZpbGUgZGVmaW5lcyB0aGUgY29udmVudGlvbi1iYXNlZCBhdHRyaWJ1dGUgbmFtZXMgdGhhdCB0aGUgd2lkZ2V0IGV4cGVjdHNcbiAqIG9uIHRoZSBNZW5kaXggZW50aXR5LiBUaGVzZSBkZWZhdWx0cyBjYW4gYmUgb3ZlcnJpZGRlbiB2aWEgd2lkZ2V0IHByb3BlcnRpZXMuXG4gKlxuICogSU1QT1JUQU5UOiBUaGVzZSBhdHRyaWJ1dGUgbmFtZXMgbXVzdCBtYXRjaCBleGFjdGx5IHdpdGggeW91ciBNZW5kaXggZG9tYWluIG1vZGVsLlxuICogVGhlIG5hbWVzIGFyZSBjYXNlLXNlbnNpdGl2ZSBhbmQgc2hvdWxkIG5vdCBpbmNsdWRlIHRoZSBlbnRpdHkgbmFtZSBwcmVmaXguXG4gKi9cblxuLyoqXG4gKiBEZWZhdWx0IGF0dHJpYnV0ZSBuYW1lcyB1c2VkIHdoZW4gbm8gb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkXG4gKi9cbmV4cG9ydCBjb25zdCBGQVFfREVGQVVMVF9BVFRSSUJVVEVTID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBxdWVzdGlvbi90aXRsZSB0ZXh0IChTdHJpbmcvVGV4dCBhdHRyaWJ1dGUpXG4gICAgICovXG4gICAgU1VNTUFSWTogXCJTdW1tYXJ5XCIsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgYW5zd2VyL2RldGFpbGVkIGNvbnRlbnQgKFN0cmluZy9UZXh0IGF0dHJpYnV0ZSlcbiAgICAgKi9cbiAgICBDT05URU5UOiBcIkNvbnRlbnRcIixcblxuICAgIC8qKlxuICAgICAqIFRoZSBmb3JtYXQgb2YgdGhlIGNvbnRlbnQgLSAnaHRtbCcsICd0ZXh0Jywgb3IgJ21hcmtkb3duJyAoU3RyaW5nL0VudW0gYXR0cmlidXRlKVxuICAgICAqL1xuICAgIENPTlRFTlRfRk9STUFUOiBcIkNvbnRlbnRGb3JtYXRcIixcblxuICAgIC8qKlxuICAgICAqIFRoZSBzb3J0IG9yZGVyIGZvciBwb3NpdGlvbmluZyBpdGVtcyAoSW50ZWdlci9Mb25nL0RlY2ltYWwgYXR0cmlidXRlKVxuICAgICAqL1xuICAgIFNPUlRfT1JERVI6IFwiU29ydE9yZGVyXCJcbn0gYXMgY29uc3Q7XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciBhdHRyaWJ1dGUgb3ZlcnJpZGVzIGZyb20gd2lkZ2V0IGNvbmZpZ3VyYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGQVFBdHRyaWJ1dGVPdmVycmlkZXMge1xuICAgIHN1bW1hcnlBdHRyaWJ1dGU/OiBzdHJpbmc7XG4gICAgY29udGVudEF0dHJpYnV0ZT86IHN0cmluZztcbiAgICBjb250ZW50Rm9ybWF0QXR0cmlidXRlPzogc3RyaW5nO1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZT86IHN0cmluZztcbn1cblxuLyoqXG4gKiBJbnRlcmZhY2UgZm9yIHRoZSByZXNvbHZlZCBGQVEgYXR0cmlidXRlc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZBUUF0dHJpYnV0ZU5hbWVzIHtcbiAgICBTVU1NQVJZOiBzdHJpbmc7XG4gICAgQ09OVEVOVDogc3RyaW5nO1xuICAgIENPTlRFTlRfRk9STUFUOiBzdHJpbmc7XG4gICAgU09SVF9PUkRFUjogc3RyaW5nO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHRoZSBhdHRyaWJ1dGUgbmFtZSBmcm9tIGEgTGlzdEF0dHJpYnV0ZVZhbHVlJ3MgaWRcbiAqIFRoZSBpZCBpcyB0eXBpY2FsbHkgaW4gZm9ybWF0IFwiTW9kdWxlTmFtZS5FbnRpdHlOYW1lL2F0dHJpYnV0ZU5hbWVcIlxuICogQHBhcmFtIGF0dHJpYnV0ZUlkIC0gVGhlIGZ1bGwgYXR0cmlidXRlIGlkIGZyb20gTGlzdEF0dHJpYnV0ZVZhbHVlXG4gKiBAcmV0dXJucyBUaGUgYXR0cmlidXRlIG5hbWUgb25seVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEF0dHJpYnV0ZU5hbWUoYXR0cmlidXRlSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCFhdHRyaWJ1dGVJZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBFeHRyYWN0IHRoZSBhdHRyaWJ1dGUgbmFtZSBhZnRlciB0aGUgbGFzdCBcIi9cIlxuICAgIGNvbnN0IHBhcnRzID0gYXR0cmlidXRlSWQuc3BsaXQoXCIvXCIpO1xuICAgIHJldHVybiBwYXJ0cy5sZW5ndGggPiAxID8gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gOiBhdHRyaWJ1dGVJZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSByZXNvbHZlZCBGQVEgYXR0cmlidXRlcyBieSBtZXJnaW5nIG92ZXJyaWRlcyB3aXRoIGRlZmF1bHRzXG4gKiBAcGFyYW0gb3ZlcnJpZGVzIC0gT3B0aW9uYWwgYXR0cmlidXRlIG92ZXJyaWRlcyBmcm9tIHdpZGdldCBjb25maWd1cmF0aW9uXG4gKiBAcmV0dXJucyBSZXNvbHZlZCBhdHRyaWJ1dGUgbmFtZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZBUUF0dHJpYnV0ZXMob3ZlcnJpZGVzPzogRkFRQXR0cmlidXRlT3ZlcnJpZGVzKTogRkFRQXR0cmlidXRlTmFtZXMge1xuICAgIHJldHVybiB7XG4gICAgICAgIFNVTU1BUlk6IG92ZXJyaWRlcz8uc3VtbWFyeUF0dHJpYnV0ZVxuICAgICAgICAgICAgPyBleHRyYWN0QXR0cmlidXRlTmFtZShvdmVycmlkZXMuc3VtbWFyeUF0dHJpYnV0ZSkgfHwgRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5TVU1NQVJZXG4gICAgICAgICAgICA6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSxcbiAgICAgICAgQ09OVEVOVDogb3ZlcnJpZGVzPy5jb250ZW50QXR0cmlidXRlXG4gICAgICAgICAgICA/IGV4dHJhY3RBdHRyaWJ1dGVOYW1lKG92ZXJyaWRlcy5jb250ZW50QXR0cmlidXRlKSB8fCBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRcbiAgICAgICAgICAgIDogRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5ULFxuICAgICAgICBDT05URU5UX0ZPUk1BVDogb3ZlcnJpZGVzPy5jb250ZW50Rm9ybWF0QXR0cmlidXRlXG4gICAgICAgICAgICA/IGV4dHJhY3RBdHRyaWJ1dGVOYW1lKG92ZXJyaWRlcy5jb250ZW50Rm9ybWF0QXR0cmlidXRlKSB8fFxuICAgICAgICAgICAgICBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRfRk9STUFUXG4gICAgICAgICAgICA6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVF9GT1JNQVQsXG4gICAgICAgIFNPUlRfT1JERVI6IG92ZXJyaWRlcz8uc29ydE9yZGVyQXR0cmlidXRlXG4gICAgICAgICAgICA/IGV4dHJhY3RBdHRyaWJ1dGVOYW1lKG92ZXJyaWRlcy5zb3J0T3JkZXJBdHRyaWJ1dGUpIHx8XG4gICAgICAgICAgICAgIEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUlxuICAgICAgICAgICAgOiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVJcbiAgICB9O1xufVxuXG4vKipcbiAqIExlZ2FjeSBleHBvcnQgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAqIEBkZXByZWNhdGVkIFVzZSBnZXRGQVFBdHRyaWJ1dGVzKCkgd2l0aCBvdmVycmlkZXMgaW5zdGVhZFxuICovXG5leHBvcnQgY29uc3QgRkFRX0FUVFJJQlVURVMgPSBGQVFfREVGQVVMVF9BVFRSSUJVVEVTO1xuXG4vKipcbiAqIFR5cGUtc2FmZSBhY2Nlc3NvciBmb3IgYXR0cmlidXRlIG5hbWVzXG4gKi9cbmV4cG9ydCB0eXBlIEZBUUF0dHJpYnV0ZU5hbWUgPSAodHlwZW9mIEZBUV9ERUZBVUxUX0FUVFJJQlVURVMpW2tleW9mIHR5cGVvZiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTXTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBhbGwgcmVxdWlyZWQgYXR0cmlidXRlcyBleGlzdCBvbiBhbiBNeE9iamVjdFxuICogQHBhcmFtIG14T2JqIC0gVGhlIE1lbmRpeCBvYmplY3QgdG8gdmFsaWRhdGVcbiAqIEBwYXJhbSBhdHRyaWJ1dGVzIC0gVGhlIHJlc29sdmVkIGF0dHJpYnV0ZSBuYW1lcyB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgT2JqZWN0IHdpdGggdmFsaWRhdGlvbiByZXN1bHQgYW5kIG1pc3NpbmcgYXR0cmlidXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVSZXF1aXJlZEF0dHJpYnV0ZXMoXG4gICAgbXhPYmo6IGFueSxcbiAgICBhdHRyaWJ1dGVzOiBGQVFBdHRyaWJ1dGVOYW1lcyA9IEZBUV9ERUZBVUxUX0FUVFJJQlVURVNcbik6IHtcbiAgICBpc1ZhbGlkOiBib29sZWFuO1xuICAgIG1pc3NpbmdBdHRyaWJ1dGVzOiBzdHJpbmdbXTtcbn0ge1xuICAgIGNvbnN0IGF2YWlsYWJsZUF0dHJpYnV0ZXMgPSBteE9iai5nZXRBdHRyaWJ1dGVzKCk7XG4gICAgY29uc3QgcmVxdWlyZWRBdHRyaWJ1dGVzID0gT2JqZWN0LnZhbHVlcyhhdHRyaWJ1dGVzKTtcblxuICAgIGNvbnN0IG1pc3NpbmdBdHRyaWJ1dGVzID0gcmVxdWlyZWRBdHRyaWJ1dGVzLmZpbHRlcihcbiAgICAgICAgKGF0dHIpID0+ICFhdmFpbGFibGVBdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHIpXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlzVmFsaWQ6IG1pc3NpbmdBdHRyaWJ1dGVzLmxlbmd0aCA9PT0gMCxcbiAgICAgICAgbWlzc2luZ0F0dHJpYnV0ZXNcbiAgICB9O1xufVxuIiwiLyoqXG4gKiBNZW5kaXggRGF0YSBTZXJ2aWNlIC0gQ2VudHJhbGl6ZWQgc2VydmljZSBmb3IgTWVuZGl4IENsaWVudCBBUEkgb3BlcmF0aW9uc1xuICogSGFuZGxlcyBDUlVEIG9wZXJhdGlvbnMgd2l0aCBjb25zaXN0ZW50IGVycm9yIGhhbmRsaW5nIGFuZCBkYXRhIHNvdXJjZSByZWxvYWRpbmdcbiAqXG4gKiBDT05WRU5USU9OOiBUaGlzIHNlcnZpY2UgZXhwZWN0cyBlbnRpdGllcyB0byBoYXZlIGF0dHJpYnV0ZXMgZGVmaW5lZCBpbiBhdHRyaWJ1dGVDb25maWcudHNcbiAqIFNlZSBzcmMvY29uZmlnL2F0dHJpYnV0ZUNvbmZpZy50cyBmb3IgdGhlIGF0dHJpYnV0ZSBuYW1lIGNvbmZpZ3VyYXRpb25cbiAqL1xuaW1wb3J0IHsgT2JqZWN0SXRlbSB9IGZyb20gXCJtZW5kaXhcIjtcbmltcG9ydCBCaWcgZnJvbSBcImJpZy5qc1wiO1xuaW1wb3J0IHsgRkFRX0FUVFJJQlVURVMgfSBmcm9tIFwiLi4vY29uZmlnL2F0dHJpYnV0ZUNvbmZpZ1wiO1xuXG4vLyBNZW5kaXggQ2xpZW50IEFQSSB0eXBlIGRlY2xhcmF0aW9uc1xuZGVjbGFyZSBnbG9iYWwge1xuICAgIGludGVyZmFjZSBXaW5kb3cge1xuICAgICAgICBteD86IHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBnZXQob3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBndWlkOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAob2JqOiBhbnkpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yPzogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICB9KTogdm9pZDtcbiAgICAgICAgICAgICAgICBjb21taXQob3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBteG9iajogYW55O1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgfSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgY3JlYXRlKG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXR5OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAob2JqOiBhbnkpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIH0pOiB2b2lkO1xuICAgICAgICAgICAgICAgIHJlbW92ZShvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRzOiBzdHJpbmdbXTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIH0pOiB2b2lkO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgTWVuZGl4IG14IGdsb2JhbCBvYmplY3Qgc2FmZWx5XG4gKi9cbmZ1bmN0aW9uIGdldE14KCk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93Lm14KSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cubXg7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIChnbG9iYWwgYXMgYW55KS53aW5kb3c/Lm14KSB7XG4gICAgICAgIHJldHVybiAoZ2xvYmFsIGFzIGFueSkud2luZG93Lm14O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBmdWxsIE14T2JqZWN0IGZyb20gYW4gT2JqZWN0SXRlbVxuICogT2JqZWN0SXRlbSBmcm9tIGRhdGFzb3VyY2Ugb25seSBoYXMgJ2lkJywgd2UgbmVlZCB0byBmZXRjaCB0aGUgZnVsbCBvYmplY3RcbiAqIEBwYXJhbSBvYmogLSBPYmplY3RJdGVtIGZyb20gZGF0YXNvdXJjZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGZ1bGwgTXhPYmplY3RcbiAqL1xuZnVuY3Rpb24gZ2V0TXhPYmplY3Qob2JqOiBPYmplY3RJdGVtKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBteCA9IGdldE14KCk7XG4gICAgICAgIGlmICghbXggfHwgIW14LmRhdGEpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNZW5kaXggQ2xpZW50IEFQSSAobXguZGF0YSkgbm90IGF2YWlsYWJsZVwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBndWlkID0gZ2V0T2JqZWN0R3VpZChvYmopO1xuXG4gICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgIGd1aWQ6IGd1aWQsXG4gICAgICAgICAgICBjYWxsYmFjazogKG14T2JqOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG14T2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGVudGl0eSBuYW1lIGZyb20gYSBNZW5kaXggb2JqZWN0XG4gKiBAcGFyYW0gbXhPYmogLSBNZW5kaXggb2JqZWN0XG4gKiBAcmV0dXJucyBFbnRpdHkgbmFtZSAoZS5nLiwgXCJNeUZpcnN0TW9kdWxlLkZBUVwiKVxuICovXG5mdW5jdGlvbiBnZXRFbnRpdHlOYW1lRnJvbU9iamVjdChteE9iajogYW55KTogc3RyaW5nIHtcbiAgICBpZiAobXhPYmouZ2V0RW50aXR5ICYmIHR5cGVvZiBteE9iai5nZXRFbnRpdHkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gbXhPYmouZ2V0RW50aXR5KCk7XG4gICAgfVxuICAgIGlmIChteE9iai5lbnRpdHkpIHtcbiAgICAgICAgcmV0dXJuIG14T2JqLmVudGl0eTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGRldGVybWluZSBlbnRpdHkgbmFtZSBmcm9tIG9iamVjdFwiKTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBHVUlEIGZyb20gYSBNZW5kaXggb2JqZWN0LCBoYW5kbGluZyBib3RoIG1ldGhvZHNcbiAqIEBwYXJhbSBvYmogLSBNZW5kaXggb2JqZWN0IGl0ZW1cbiAqIEByZXR1cm5zIEdVSUQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPYmplY3RHdWlkKG9iajogT2JqZWN0SXRlbSk6IHN0cmluZyB7XG4gICAgLy8gVHJ5IHRoZSBnZXRHdWlkKCkgbWV0aG9kIGZpcnN0XG4gICAgaWYgKChvYmogYXMgYW55KS5nZXRHdWlkICYmIHR5cGVvZiAob2JqIGFzIGFueSkuZ2V0R3VpZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IGd1aWQgPSAob2JqIGFzIGFueSkuZ2V0R3VpZCgpO1xuICAgICAgICBpZiAoZ3VpZCkgcmV0dXJuIGd1aWQ7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgdG8gZ3VpZCBwcm9wZXJ0eVxuICAgIGlmICgob2JqIGFzIGFueSkuZ3VpZCkge1xuICAgICAgICByZXR1cm4gKG9iaiBhcyBhbnkpLmd1aWQ7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgdG8gaWQgcHJvcGVydHkgKGZyb20gT2JqZWN0SXRlbSBpbnRlcmZhY2UpXG4gICAgaWYgKG9iai5pZCkge1xuICAgICAgICByZXR1cm4gb2JqLmlkO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBleHRyYWN0IEdVSUQgZnJvbSBvYmplY3RcIik7XG59XG5cbi8qKlxuICogUmVsb2FkcyBhIGRhdGEgc291cmNlIGlmIHRoZSByZWxvYWQgbWV0aG9kIGlzIGF2YWlsYWJsZVxuICogQHBhcmFtIGRhdGFTb3VyY2UgLSBNZW5kaXggZGF0YSBzb3VyY2UgdG8gcmVsb2FkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxvYWREYXRhU291cmNlKGRhdGFTb3VyY2U6IGFueSk6IHZvaWQge1xuICAgIGlmIChkYXRhU291cmNlICYmIHR5cGVvZiBkYXRhU291cmNlLnJlbG9hZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGRhdGFTb3VyY2UucmVsb2FkKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIGVudGl0eSBuYW1lIGZyb20gYSBkYXRhIHNvdXJjZVxuICogRm9yIExpc3RWYWx1ZSBkYXRhc291cmNlcywgd2UgZ2V0IHRoZSBlbnRpdHkgZnJvbSB0aGUgZmlyc3QgaXRlbSdzIE14T2JqZWN0XG4gKiBAcGFyYW0gZGF0YVNvdXJjZSAtIE1lbmRpeCBkYXRhIHNvdXJjZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggZW50aXR5IG5hbWUgb3IgbnVsbCBpZiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEVudGl0eU5hbWUoZGF0YVNvdXJjZTogYW55KTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZGF0YVNvdXJjZTpcIiwgZGF0YVNvdXJjZSk7XG4gICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZGF0YVNvdXJjZSBrZXlzOlwiLCBPYmplY3Qua2V5cyhkYXRhU291cmNlIHx8IHt9KSk7XG5cbiAgICAvLyBUcnkgdG8gZ2V0IGVudGl0eSBmcm9tIGRhdGFzb3VyY2UgbWV0YWRhdGEgKGxlZ2FjeSBhcHByb2FjaClcbiAgICBpZiAoZGF0YVNvdXJjZT8uX2VudGl0eSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImdldEVudGl0eU5hbWUgLSBmb3VuZCBfZW50aXR5OlwiLCBkYXRhU291cmNlLl9lbnRpdHkpO1xuICAgICAgICByZXR1cm4gZGF0YVNvdXJjZS5fZW50aXR5O1xuICAgIH1cbiAgICBpZiAoZGF0YVNvdXJjZT8uZW50aXR5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIGZvdW5kIGVudGl0eTpcIiwgZGF0YVNvdXJjZS5lbnRpdHkpO1xuICAgICAgICByZXR1cm4gZGF0YVNvdXJjZS5lbnRpdHk7XG4gICAgfVxuXG4gICAgLy8gRm9yIExpc3RWYWx1ZSBkYXRhc291cmNlcywgZ2V0IGVudGl0eSBmcm9tIHRoZSBmaXJzdCBpdGVtJ3MgTXhPYmplY3RcbiAgICBpZiAoZGF0YVNvdXJjZT8uaXRlbXMgJiYgZGF0YVNvdXJjZS5pdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBmaXJzdEl0ZW0gPSBkYXRhU291cmNlLml0ZW1zWzBdO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZmV0Y2hpbmcgZmlyc3QgaXRlbSBNeE9iamVjdC4uLlwiKTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggdGhlIGZ1bGwgTXhPYmplY3QgdG8gZ2V0IGVudGl0eSBuYW1lXG4gICAgICAgICAgICBjb25zdCBteE9iaiA9IGF3YWl0IGdldE14T2JqZWN0KGZpcnN0SXRlbSk7XG4gICAgICAgICAgICBjb25zdCBlbnRpdHlOYW1lID0gZ2V0RW50aXR5TmFtZUZyb21PYmplY3QobXhPYmopO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZnJvbSBNeE9iamVjdDpcIiwgZW50aXR5TmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gZW50aXR5TmFtZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJnZXRFbnRpdHlOYW1lIC0gZmFpbGVkIHRvIGdldCBNeE9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gbm90IGZvdW5kLCByZXR1cm5pbmcgbnVsbFwiKTtcbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBuZXh0IHNvcnQgb3JkZXIgdmFsdWUgZm9yIGEgbmV3IGl0ZW1cbiAqIEBwYXJhbSBpdGVtcyAtIEFycmF5IG9mIGV4aXN0aW5nIGl0ZW1zXG4gKiBAcGFyYW0gc29ydE9yZGVyQXR0cmlidXRlIC0gU29ydCBvcmRlciBhdHRyaWJ1dGUgYWNjZXNzb3JcbiAqIEByZXR1cm5zIE5leHQgc29ydCBvcmRlciB2YWx1ZSAobWF4ICsgMTApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZXh0U29ydE9yZGVyKGl0ZW1zOiBPYmplY3RJdGVtW10gfCB1bmRlZmluZWQsIHNvcnRPcmRlckF0dHJpYnV0ZTogYW55KTogQmlnIHtcbiAgICBjb25zdCBtYXhTb3J0T3JkZXIgPVxuICAgICAgICBpdGVtcz8ucmVkdWNlKChtYXgsIGl0ZW0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvcnRPcmRlciA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoaXRlbSkudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gc29ydE9yZGVyICYmIHNvcnRPcmRlci50b051bWJlcigpID4gbWF4ID8gc29ydE9yZGVyLnRvTnVtYmVyKCkgOiBtYXg7XG4gICAgICAgIH0sIDApIHx8IDA7XG5cbiAgICByZXR1cm4gbmV3IEJpZyhtYXhTb3J0T3JkZXIgKyAxMCk7XG59XG5cbi8qKlxuICogQ29tbWl0cyBhIE1lbmRpeCBvYmplY3QgdG8gdGhlIGRhdGFiYXNlXG4gKiBAcGFyYW0gb2JqIC0gTXhPYmplY3QgdG8gY29tbWl0IChmdWxsIG9iamVjdCwgbm90IGp1c3QgT2JqZWN0SXRlbSlcbiAqIEBwYXJhbSBkYXRhU291cmNlIC0gT3B0aW9uYWwgZGF0YSBzb3VyY2UgdG8gcmVsb2FkIGFmdGVyIGNvbW1pdFxuICogQHBhcmFtIHN1Y2Nlc3NNZXNzYWdlIC0gT3B0aW9uYWwgc3VjY2VzcyBsb2cgbWVzc2FnZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gY29tbWl0IHN1Y2NlZWRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21taXRPYmplY3Qob2JqOiBhbnksIGRhdGFTb3VyY2U/OiBhbnksIHN1Y2Nlc3NNZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbXggPSBnZXRNeCgpO1xuICAgICAgICBpZiAoIW14IHx8ICFteC5kYXRhKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiTWVuZGl4IENsaWVudCBBUEkgKG14LmRhdGEpIG5vdCBhdmFpbGFibGVcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJjb21taXRPYmplY3QgLSBjb21taXR0aW5nIG9iamVjdDpcIiwgb2JqLmdldEVudGl0eT8uKCkpO1xuXG4gICAgICAgIG14LmRhdGEuY29tbWl0KHtcbiAgICAgICAgICAgIG14b2JqOiBvYmosXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbG9hZERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY29tbWl0IG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIERlbGV0ZXMgYSBNZW5kaXggb2JqZWN0IGZyb20gdGhlIGRhdGFiYXNlXG4gKiBAcGFyYW0gb2JqIC0gT2JqZWN0IHRvIGRlbGV0ZVxuICogQHBhcmFtIGRhdGFTb3VyY2UgLSBPcHRpb25hbCBkYXRhIHNvdXJjZSB0byByZWxvYWQgYWZ0ZXIgZGVsZXRpb25cbiAqIEBwYXJhbSBzdWNjZXNzTWVzc2FnZSAtIE9wdGlvbmFsIHN1Y2Nlc3MgbG9nIG1lc3NhZ2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGRlbGV0aW9uIHN1Y2NlZWRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVPYmplY3QoXG4gICAgb2JqOiBPYmplY3RJdGVtLFxuICAgIGRhdGFTb3VyY2U/OiBhbnksXG4gICAgc3VjY2Vzc01lc3NhZ2U/OiBzdHJpbmdcbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG14ID0gZ2V0TXgoKTtcbiAgICAgICAgaWYgKCFteCB8fCAhbXguZGF0YSkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIk1lbmRpeCBDbGllbnQgQVBJIChteC5kYXRhKSBub3QgYXZhaWxhYmxlXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBndWlkOiBzdHJpbmc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBndWlkID0gZ2V0T2JqZWN0R3VpZChvYmopO1xuICAgICAgICAgICAgaWYgKCFndWlkIHx8IHR5cGVvZiBndWlkICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIEdVSUQ6ICR7Z3VpZH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZ2V0IG9iamVjdCBHVUlEOlwiLCBlcnJvcik7XG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbXguZGF0YS5yZW1vdmUoe1xuICAgICAgICAgICAgZ3VpZHM6IFtndWlkXSxcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVsb2FkRGF0YVNvdXJjZShkYXRhU291cmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBkZWxldGUgb2JqZWN0OlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBNZW5kaXggb2JqZWN0XG4gKiBAcGFyYW0gZW50aXR5TmFtZSAtIEVudGl0eSBuYW1lIHRvIGNyZWF0ZVxuICogQHBhcmFtIHN1Y2Nlc3NNZXNzYWdlIC0gT3B0aW9uYWwgc3VjY2VzcyBsb2cgbWVzc2FnZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGNyZWF0ZWQgTXhPYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU9iamVjdChlbnRpdHlOYW1lOiBzdHJpbmcsIHN1Y2Nlc3NNZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBteCA9IGdldE14KCk7XG4gICAgICAgIGlmICghbXggfHwgIW14LmRhdGEpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNZW5kaXggQ2xpZW50IEFQSSAobXguZGF0YSkgbm90IGF2YWlsYWJsZVwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBteC5kYXRhLmNyZWF0ZSh7XG4gICAgICAgICAgICBlbnRpdHk6IGVudGl0eU5hbWUsXG4gICAgICAgICAgICBjYWxsYmFjazogKG9iajogT2JqZWN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUob2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY3JlYXRlIG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFN3YXBzIHRoZSBzb3J0IG9yZGVyIHZhbHVlcyBiZXR3ZWVuIHR3byBpdGVtcyBhbmQgY29tbWl0cyBib3RoXG4gKiBVc2VzIGNvbnZlbnRpb24tYmFzZWQgYXR0cmlidXRlIG5hbWUgXCJTb3J0T3JkZXJcIlxuICogQHBhcmFtIGl0ZW0xIC0gRmlyc3QgaXRlbVxuICogQHBhcmFtIGl0ZW0yIC0gU2Vjb25kIGl0ZW1cbiAqIEBwYXJhbSBvcmRlcjEgLSBDdXJyZW50IHNvcnQgb3JkZXIgb2YgaXRlbTFcbiAqIEBwYXJhbSBvcmRlcjIgLSBDdXJyZW50IHNvcnQgb3JkZXIgb2YgaXRlbTJcbiAqIEBwYXJhbSBkYXRhU291cmNlIC0gT3B0aW9uYWwgZGF0YSBzb3VyY2UgdG8gcmVsb2FkIGFmdGVyIHN3YXBcbiAqIEBwYXJhbSBzdWNjZXNzTWVzc2FnZSAtIE9wdGlvbmFsIHN1Y2Nlc3MgbG9nIG1lc3NhZ2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGJvdGggY29tbWl0cyBzdWNjZWVkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzd2FwU29ydE9yZGVycyhcbiAgICBpdGVtMTogT2JqZWN0SXRlbSxcbiAgICBpdGVtMjogT2JqZWN0SXRlbSxcbiAgICBvcmRlck9yQXR0cmlidXRlOiBCaWcgfCBhbnksXG4gICAgb3JkZXIyT3JEYXRhU291cmNlPzogQmlnIHwgYW55LFxuICAgIGRhdGFTb3VyY2U/OiBhbnksXG4gICAgc3VjY2Vzc01lc3NhZ2U/OiBzdHJpbmdcbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG14ID0gZ2V0TXgoKTtcbiAgICBpZiAoIW14IHx8ICFteC5kYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1lbmRpeCBDbGllbnQgQVBJIChteC5kYXRhKSBub3QgYXZhaWxhYmxlXCIpO1xuICAgIH1cblxuICAgIGxldCBvcmRlcjE6IEJpZztcbiAgICBsZXQgb3JkZXIyOiBCaWc7XG4gICAgbGV0IHJlc29sdmVkRGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgbGV0IHJlc29sdmVkU3VjY2Vzc01lc3NhZ2UgPSBzdWNjZXNzTWVzc2FnZTtcblxuICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHk6IGFsbG93IHBhc3Npbmcgc29ydE9yZGVyQXR0cmlidXRlIGFzIHRoaXJkIGFyZ3VtZW50XG4gICAgaWYgKG9yZGVyT3JBdHRyaWJ1dGUgJiYgdHlwZW9mIChvcmRlck9yQXR0cmlidXRlIGFzIGFueSkuZ2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc3Qgc29ydE9yZGVyQXR0cmlidXRlID0gb3JkZXJPckF0dHJpYnV0ZTtcbiAgICAgICAgY29uc3QgdmFsdWUxID0gc29ydE9yZGVyQXR0cmlidXRlLmdldChpdGVtMSkudmFsdWU7XG4gICAgICAgIGNvbnN0IHZhbHVlMiA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoaXRlbTIpLnZhbHVlO1xuXG4gICAgICAgIGlmICh2YWx1ZTEgPT09IG51bGwgfHwgdmFsdWUxID09PSB1bmRlZmluZWQgfHwgdmFsdWUyID09PSBudWxsIHx8IHZhbHVlMiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTb3J0IG9yZGVyIHZhbHVlcyBhcmUgbWlzc2luZ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9yZGVyMSA9IG5ldyBCaWcodmFsdWUxLnRvU3RyaW5nKCkpO1xuICAgICAgICBvcmRlcjIgPSBuZXcgQmlnKHZhbHVlMi50b1N0cmluZygpKTtcbiAgICAgICAgcmVzb2x2ZWREYXRhU291cmNlID0gb3JkZXIyT3JEYXRhU291cmNlO1xuICAgICAgICByZXNvbHZlZFN1Y2Nlc3NNZXNzYWdlID0gZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKG9yZGVyMk9yRGF0YVNvdXJjZSkge1xuICAgICAgICAvLyBQcmVmZXJyZWQgc2lnbmF0dXJlOiBleHBsaWNpdCBvcmRlcjEgYW5kIG9yZGVyMiB2YWx1ZXNcbiAgICAgICAgb3JkZXIxID0gb3JkZXJPckF0dHJpYnV0ZSBhcyBCaWc7XG4gICAgICAgIG9yZGVyMiA9IG9yZGVyMk9yRGF0YVNvdXJjZSBhcyBCaWc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwic3dhcFNvcnRPcmRlcnMgcmVxdWlyZXMgc29ydCBvcmRlciB2YWx1ZXMgb3IgYXR0cmlidXRlIGFjY2Vzc29yXCIpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBTVEFSVFwiKTtcbiAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gb3JkZXIxOlwiLCBvcmRlcjEudG9TdHJpbmcoKSwgXCJvcmRlcjI6XCIsIG9yZGVyMi50b1N0cmluZygpKTtcblxuICAgIC8vIEdldCB0aGUgZnVsbCBNeE9iamVjdHNcbiAgICBjb25zdCBteE9iajEgPSBhd2FpdCBnZXRNeE9iamVjdChpdGVtMSk7XG4gICAgY29uc3QgbXhPYmoyID0gYXdhaXQgZ2V0TXhPYmplY3QoaXRlbTIpO1xuXG4gICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIEdvdCBNeE9iamVjdHNcIik7XG4gICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0xIGVudGl0eTpcIiwgbXhPYmoxLmdldEVudGl0eT8uKCkpO1xuICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMiBlbnRpdHk6XCIsIG14T2JqMi5nZXRFbnRpdHk/LigpKTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0xIGN1cnJlbnQgdmFsdWU6XCIsXG4gICAgICAgIG14T2JqMS5nZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUik/LnRvU3RyaW5nKClcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBcInN3YXBTb3J0T3JkZXJzIC0gaXRlbTIgY3VycmVudCB2YWx1ZTpcIixcbiAgICAgICAgbXhPYmoyLmdldChGQVFfQVRUUklCVVRFUy5TT1JUX09SREVSKT8udG9TdHJpbmcoKVxuICAgICk7XG5cbiAgICAvLyBTd2FwIHRoZSB2YWx1ZXNcbiAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gU2V0dGluZyBuZXcgdmFsdWVzLi4uXCIpO1xuICAgIG14T2JqMS5zZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUiwgb3JkZXIyKTtcbiAgICBteE9iajIuc2V0KEZBUV9BVFRSSUJVVEVTLlNPUlRfT1JERVIsIG9yZGVyMSk7XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0xIG5ldyB2YWx1ZTpcIixcbiAgICAgICAgbXhPYmoxLmdldChGQVFfQVRUUklCVVRFUy5TT1JUX09SREVSKT8udG9TdHJpbmcoKVxuICAgICk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAgIFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMiBuZXcgdmFsdWU6XCIsXG4gICAgICAgIG14T2JqMi5nZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUik/LnRvU3RyaW5nKClcbiAgICApO1xuXG4gICAgLy8gQ29tbWl0IGJvdGggb2JqZWN0c1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBTdGFydGluZyBjb21taXQgb2YgZmlyc3Qgb2JqZWN0Li4uXCIpO1xuICAgICAgICBteC5kYXRhLmNvbW1pdCh7XG4gICAgICAgICAgICBteG9iajogbXhPYmoxLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gY29tbWl0dGVkIG14T2JqMSDinJNcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIFN0YXJ0aW5nIGNvbW1pdCBvZiBzZWNvbmQgb2JqZWN0Li4uXCIpO1xuICAgICAgICAgICAgICAgIG14LmRhdGEuY29tbWl0KHtcbiAgICAgICAgICAgICAgICAgICAgbXhvYmo6IG14T2JqMixcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBjb21taXR0ZWQgbXhPYmoyIOKck1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZFN1Y2Nlc3NNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzb2x2ZWRTdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWREYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIFJlbG9hZGluZyBkYXRhc291cmNlLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbG9hZERhdGFTb3VyY2UocmVzb2x2ZWREYXRhU291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBDT01QTEVURSDinJNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGNvbW1pdCBzZWNvbmQgaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN3YXBTb3J0T3JkZXJzIC0gRXJyb3IgZGV0YWlsczpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnN0YWNrXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBjb21taXQgZmlyc3QgaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzd2FwU29ydE9yZGVycyAtIEVycm9yIGRldGFpbHM6XCIsIGVycm9yLm1lc3NhZ2UsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbiIsImltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZU1lbW8gfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IE9iamVjdEl0ZW0sIExpc3RWYWx1ZSwgTGlzdEF0dHJpYnV0ZVZhbHVlIH0gZnJvbSBcIm1lbmRpeFwiO1xuaW1wb3J0IEJpZyBmcm9tIFwiYmlnLmpzXCI7XG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgeyBGQVFfREVGQVVMVF9BVFRSSUJVVEVTIH0gZnJvbSBcIi4uL2NvbmZpZy9hdHRyaWJ1dGVDb25maWdcIjtcbmltcG9ydCB7IGdldE5leHRTb3J0T3JkZXIgfSBmcm9tIFwiLi4vdXRpbHMvbWVuZGl4RGF0YVNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBGQVFJdGVtIHtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgY29udGVudDogc3RyaW5nO1xuICAgIGNvbnRlbnRGb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtO1xuICAgIHNvcnRPcmRlcj86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFN0YXRpY0ZBUUl0ZW0ge1xuICAgIHN1bW1hcnk/OiB7IHZhbHVlPzogc3RyaW5nIH07XG4gICAgY29udGVudD86IHsgdmFsdWU/OiBzdHJpbmcgfTtcbiAgICBjb250ZW50Rm9ybWF0Pzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEF0dHJpYnV0ZSBvdmVycmlkZXMgdXNpbmcgTGlzdEF0dHJpYnV0ZVZhbHVlIGZvciBkaXJlY3QgYWNjZXNzXG4gKi9cbmludGVyZmFjZSBBdHRyaWJ1dGVPdmVycmlkZXMge1xuICAgIHN1bW1hcnlBdHRyaWJ1dGU/OiBMaXN0QXR0cmlidXRlVmFsdWU8c3RyaW5nPjtcbiAgICBjb250ZW50QXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPHN0cmluZz47XG4gICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxzdHJpbmc+O1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG59XG5cbmludGVyZmFjZSBVc2VGQVFEYXRhUHJvcHMge1xuICAgIGRhdGFTb3VyY2VUeXBlOiBcInN0YXRpY1wiIHwgXCJkYXRhYmFzZVwiO1xuICAgIGRhdGFTb3VyY2U/OiBMaXN0VmFsdWU7XG4gICAgZmFxSXRlbXM/OiBTdGF0aWNGQVFJdGVtW107XG4gICAgc29ydE9yZGVyQXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG4gICAgYXR0cmlidXRlT3ZlcnJpZGVzPzogQXR0cmlidXRlT3ZlcnJpZGVzO1xufVxuXG5pbnRlcmZhY2UgVXNlRkFRRGF0YVJlc3VsdCB7XG4gICAgaXRlbXM6IEZBUUl0ZW1bXTtcbiAgICBpc0xvYWRpbmc6IGJvb2xlYW47XG4gICAgZGVmYXVsdFNvcnRPcmRlcjogbnVtYmVyO1xuICAgIHNvcnRhYmxlSWRzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGNvbnRlbnQgZm9ybWF0IHZhbHVlIHRvIHZhbGlkIGZvcm1hdCBvciBkZWZhdWx0cyB0byBIVE1MXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0OiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogQ29udGVudEZvcm1hdEVudW0ge1xuICAgIGlmICghZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiBcImh0bWxcIjtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxpemVkID0gZm9ybWF0LnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiaHRtbFwiIHx8IG5vcm1hbGl6ZWQgPT09IFwibWFya2Rvd25cIiB8fCBub3JtYWxpemVkID09PSBcInRleHRcIikge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplZCBhcyBDb250ZW50Rm9ybWF0RW51bTtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oYEZBUSBBY2NvcmRpb246IFVucmVjb2duaXplZCBjb250ZW50IGZvcm1hdCBcIiR7Zm9ybWF0fVwiLCBkZWZhdWx0aW5nIHRvIEhUTUxgKTtcbiAgICByZXR1cm4gXCJodG1sXCI7XG59XG5cbi8qKlxuICogQ3VzdG9tIGhvb2sgdG8gbWFuYWdlIEZBUSBkYXRhIGZldGNoaW5nIGFuZCBzdGF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRkFRRGF0YSh7XG4gICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgZGF0YVNvdXJjZSxcbiAgICBmYXFJdGVtcyxcbiAgICBzb3J0T3JkZXJBdHRyaWJ1dGUsXG4gICAgYXR0cmlidXRlT3ZlcnJpZGVzXG59OiBVc2VGQVFEYXRhUHJvcHMpOiBVc2VGQVFEYXRhUmVzdWx0IHtcbiAgICBjb25zdCBbZGF0YWJhc2VJdGVtcywgc2V0RGF0YWJhc2VJdGVtc10gPSB1c2VTdGF0ZTxGQVFJdGVtW10+KFtdKTtcblxuICAgIC8vIENoZWNrIGlmIEFMTCBhdHRyaWJ1dGUgb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkIChhbGwtb3Itbm90aGluZyBhcHByb2FjaClcbiAgICBjb25zdCBoYXNBbGxPdmVycmlkZXMgPSAhIShcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5zdW1tYXJ5QXR0cmlidXRlICYmXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uY29udGVudEF0dHJpYnV0ZSAmJlxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUgJiZcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5zb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZVxuICAgICk7XG5cbiAgICAvLyBDaGVjayBpZiBBTlkgb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkIChmb3Igd2FybmluZyBkZXRlY3Rpb24pXG4gICAgY29uc3QgaGFzQW55T3ZlcnJpZGVzID0gISEoXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uc3VtbWFyeUF0dHJpYnV0ZSB8fFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LmNvbnRlbnRBdHRyaWJ1dGUgfHxcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5jb250ZW50Rm9ybWF0QXR0cmlidXRlIHx8XG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGVcbiAgICApO1xuXG4gICAgLy8gRmV0Y2ggRkFRIGl0ZW1zIGZyb20gZGF0YWJhc2VcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIGRhdGFTb3VyY2Uuc3RhdHVzID09PSBcImF2YWlsYWJsZVwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IOKcqCBSRUZFVENISU5HIGl0ZW1zIGZyb20gZGF0YXNvdXJjZVwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogSXRlbSBjb3VudDpcIiwgZGF0YVNvdXJjZS5pdGVtcz8ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogQWxsIG92ZXJyaWRlcyBjb25maWd1cmVkOlwiLCBoYXNBbGxPdmVycmlkZXMpO1xuXG4gICAgICAgICAgICBpZiAoIWRhdGFTb3VyY2UuaXRlbXMgfHwgZGF0YVNvdXJjZS5pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IE5vIGl0ZW1zIHRvIGZldGNoXCIpO1xuICAgICAgICAgICAgICAgIHNldERhdGFiYXNlSXRlbXMoW10pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgQUxMIG92ZXJyaWRlcyBhcmUgY29uZmlndXJlZCwgdXNlIExpc3RBdHRyaWJ1dGVWYWx1ZS5nZXQoKSBkaXJlY3RseVxuICAgICAgICAgICAgaWYgKGhhc0FsbE92ZXJyaWRlcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogVXNpbmcgYXR0cmlidXRlIG92ZXJyaWRlcyB2aWEgTGlzdEF0dHJpYnV0ZVZhbHVlLmdldCgpXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gZGF0YVNvdXJjZS5pdGVtcy5tYXAoKGl0ZW06IE9iamVjdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IGF0dHJpYnV0ZU92ZXJyaWRlcy5zdW1tYXJ5QXR0cmlidXRlIS5nZXQoaXRlbSk/LnZhbHVlIHx8IFwiUXVlc3Rpb25cIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF0dHJpYnV0ZU92ZXJyaWRlcy5jb250ZW50QXR0cmlidXRlIS5nZXQoaXRlbSk/LnZhbHVlIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdFZhbHVlID0gYXR0cmlidXRlT3ZlcnJpZGVzLmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUhLmdldChpdGVtKT8udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdCA9IG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3U29ydE9yZGVyID0gYXR0cmlidXRlT3ZlcnJpZGVzLnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlIS5nZXQoaXRlbSk/LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc29ydE9yZGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyYXdTb3J0T3JkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlciA9IE51bWJlcihyYXdTb3J0T3JkZXIudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4oc29ydE9yZGVyKSkgc29ydE9yZGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VtbWFyeSwgY29udGVudCwgY29udGVudEZvcm1hdDogZm9ybWF0LCBzb3J0T3JkZXIgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IEl0ZW1zIGxvYWRlZCB2aWEgb3ZlcnJpZGVzOlwiLCBpdGVtcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHNldERhdGFiYXNlSXRlbXMoaXRlbXMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2FybiBpZiBwYXJ0aWFsIG92ZXJyaWRlcyBjb25maWd1cmVkXG4gICAgICAgICAgICBpZiAoaGFzQW55T3ZlcnJpZGVzICYmICFoYXNBbGxPdmVycmlkZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGQVEgQWNjb3JkaW9uOiBQYXJ0aWFsIG92ZXJyaWRlcyBkZXRlY3RlZCEgWW91IG11c3QgY29uZmlndXJlIEFMTCBmb3VyIGF0dHJpYnV0ZSBvdmVycmlkZXMgb3IgTk9ORS4gRmFsbGluZyBiYWNrIHRvIGRlZmF1bHRzLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNlIG14LmRhdGEuZ2V0IHdpdGggY29udmVudGlvbi1iYXNlZCBhdHRyaWJ1dGUgbmFtZXMgKGRlZmF1bHRzKVxuICAgICAgICAgICAgY29uc3QgZmV0Y2hJdGVtcyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBteCA9ICh3aW5kb3cgYXMgYW55KS5teDtcbiAgICAgICAgICAgICAgICBpZiAoIW14KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogbXggbm90IGF2YWlsYWJsZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGF0YWJhc2VJdGVtcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFVzaW5nIGRlZmF1bHQgYXR0cmlidXRlIG5hbWVzIHZpYSBteC5kYXRhLmdldCgpXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZS5pdGVtcyEubWFwKGFzeW5jIChpdGVtOiBPYmplY3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEZBUUl0ZW0+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1aWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKG14T2JqOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSkgfHwgXCJRdWVzdGlvblwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBteE9iai5nZXQoRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5UKSB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdFZhbHVlID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVF9GT1JNQVQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdCA9IG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3U29ydE9yZGVyID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvcnRPcmRlcjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXdTb3J0T3JkZXIgIT09IHVuZGVmaW5lZCAmJiByYXdTb3J0T3JkZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlciA9IE51bWJlcihyYXdTb3J0T3JkZXIudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4oc29ydE9yZGVyKSkgc29ydE9yZGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdW1tYXJ5LCBjb250ZW50LCBjb250ZW50Rm9ybWF0OiBmb3JtYXQsIHNvcnRPcmRlciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZmV0Y2ggaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBcIkVycm9yIGxvYWRpbmcgcXVlc3Rpb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlcjogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBJdGVtcyBsb2FkZWQgdmlhIG14LmRhdGEuZ2V0OlwiLCBpdGVtcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBzZXREYXRhYmFzZUl0ZW1zKGl0ZW1zKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGZldGNoIEZBUSBpdGVtczpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBzZXREYXRhYmFzZUl0ZW1zKFtdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmZXRjaEl0ZW1zKCk7XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFTb3VyY2UsIGRhdGFTb3VyY2U/LnN0YXR1cywgZGF0YVNvdXJjZT8uaXRlbXMsIGhhc0FsbE92ZXJyaWRlcywgaGFzQW55T3ZlcnJpZGVzLCBhdHRyaWJ1dGVPdmVycmlkZXMsIHNvcnRPcmRlckF0dHJpYnV0ZV0pO1xuXG4gICAgLy8gR2V0IEZBUSBpdGVtcyBmcm9tIGVpdGhlciBzdGF0aWMgY29uZmlndXJhdGlvbiBvciBkYXRhYmFzZVxuICAgIGNvbnN0IGl0ZW1zID0gdXNlTWVtbzxGQVFJdGVtW10+KCgpID0+IHtcbiAgICAgICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhYmFzZUl0ZW1zO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICBmYXFJdGVtcz8ubWFwKChpdGVtLCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogaXRlbS5zdW1tYXJ5Py52YWx1ZSB8fCBcIlF1ZXN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGl0ZW0uY29udGVudD8udmFsdWUgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogbm9ybWFsaXplQ29udGVudEZvcm1hdChpdGVtLmNvbnRlbnRGb3JtYXQpLFxuICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IChpbmRleCArIDEpICogMTBcbiAgICAgICAgICAgICAgICB9KSkgfHwgW11cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFiYXNlSXRlbXMsIGZhcUl0ZW1zXSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZGVmYXVsdCBzb3J0IG9yZGVyIGZvciBuZXcgaXRlbXNcbiAgICBjb25zdCBkZWZhdWx0U29ydE9yZGVyID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICAgIGlmIChkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgICAgICBpZiAoc29ydE9yZGVyQXR0cmlidXRlICYmIGRhdGFTb3VyY2U/Lml0ZW1zICYmIGRhdGFTb3VyY2UuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBnZXROZXh0U29ydE9yZGVyKGRhdGFTb3VyY2UuaXRlbXMsIHNvcnRPcmRlckF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihuZXh0LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q291bnQgPSBkYXRhU291cmNlPy5pdGVtcz8ubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4gKGN1cnJlbnRDb3VudCArIDEpICogMTA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKGl0ZW1zLmxlbmd0aCArIDEpICogMTA7XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhU291cmNlPy5pdGVtcywgc29ydE9yZGVyQXR0cmlidXRlLCBpdGVtcy5sZW5ndGhdKTtcblxuICAgIC8vIFNldCBzb3J0IG9yZGVyIG9uIGRhdGFzb3VyY2Ugd2hlbiB1c2luZyBkYXRhYmFzZSBtb2RlIHdpdGggc29ydCBvcmRlciBhdHRyaWJ1dGVcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIHNvcnRPcmRlckF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgaWYgKGRhdGFTb3VyY2Uuc2V0U29ydE9yZGVyICYmIHNvcnRPcmRlckF0dHJpYnV0ZS5pZCkge1xuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2Uuc2V0U29ydE9yZGVyKFtbc29ydE9yZGVyQXR0cmlidXRlLmlkLCBcImFzY1wiXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhU291cmNlLCBzb3J0T3JkZXJBdHRyaWJ1dGVdKTtcblxuICAgIC8vIEdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIHNvcnRhYmxlIGl0ZW1zXG4gICAgY29uc3Qgc29ydGFibGVJZHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZT8uaXRlbXMpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhU291cmNlLml0ZW1zLm1hcCgoaXRlbTogT2JqZWN0SXRlbSkgPT4gaXRlbS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZW1zLm1hcCgoXywgaW5kZXgpID0+IGBzdGF0aWMtJHtpbmRleH1gKTtcbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFTb3VyY2U/Lml0ZW1zLCBpdGVtc10pO1xuXG4gICAgY29uc3QgaXNMb2FkaW5nID1cbiAgICAgICAgZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIGRhdGFTb3VyY2Uuc3RhdHVzID09PSBcImxvYWRpbmdcIjtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGl0ZW1zLFxuICAgICAgICBpc0xvYWRpbmc6ICEhaXNMb2FkaW5nLFxuICAgICAgICBkZWZhdWx0U29ydE9yZGVyLFxuICAgICAgICBzb3J0YWJsZUlkc1xuICAgIH07XG59XG4iLCJpbXBvcnQgeyB1c2VDYWxsYmFjayB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgTGlzdFZhbHVlLCBMaXN0QXR0cmlidXRlVmFsdWUsIEFjdGlvblZhbHVlLCBPYmplY3RJdGVtIH0gZnJvbSBcIm1lbmRpeFwiO1xuaW1wb3J0IEJpZyBmcm9tIFwiYmlnLmpzXCI7XG5pbXBvcnQgeyBEcmFnRW5kRXZlbnQgfSBmcm9tIFwiQGRuZC1raXQvY29yZVwiO1xuXG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgeyBGQVFfREVGQVVMVF9BVFRSSUJVVEVTIH0gZnJvbSBcIi4uL2NvbmZpZy9hdHRyaWJ1dGVDb25maWdcIjtcbmltcG9ydCB7XG4gICAgY29tbWl0T2JqZWN0LFxuICAgIGRlbGV0ZU9iamVjdCxcbiAgICBjcmVhdGVPYmplY3QsXG4gICAgc3dhcFNvcnRPcmRlcnMsXG4gICAgZ2V0RW50aXR5TmFtZSxcbiAgICBnZXROZXh0U29ydE9yZGVyXG59IGZyb20gXCIuLi91dGlscy9tZW5kaXhEYXRhU2VydmljZVwiO1xuXG5pbnRlcmZhY2UgVXNlRWRpdFN0YXRlIHtcbiAgICBlZGl0aW5nSXRlbUluZGV4OiBudW1iZXIgfCBudWxsO1xuICAgIGRlbGV0ZUNvbmZpcm1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBzaG93Q3JlYXRlRm9ybTogYm9vbGVhbjtcbiAgICBmaW5pc2hFZGl0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbEVkaXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgZmluaXNoRGVsZXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgY2FuY2VsRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbENyZWF0aW5nOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEF0dHJpYnV0ZSBvdmVycmlkZXMgdXNpbmcgTGlzdEF0dHJpYnV0ZVZhbHVlIGZvciBkaXJlY3QgYWNjZXNzXG4gKi9cbmludGVyZmFjZSBBdHRyaWJ1dGVPdmVycmlkZXMge1xuICAgIHN1bW1hcnlBdHRyaWJ1dGU/OiBMaXN0QXR0cmlidXRlVmFsdWU8c3RyaW5nPjtcbiAgICBjb250ZW50QXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPHN0cmluZz47XG4gICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxzdHJpbmc+O1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG59XG5cbmludGVyZmFjZSBVc2VGQVFBY3Rpb25zUHJvcHMge1xuICAgIGRhdGFTb3VyY2VUeXBlOiBcInN0YXRpY1wiIHwgXCJkYXRhYmFzZVwiO1xuICAgIGRhdGFTb3VyY2U/OiBMaXN0VmFsdWU7XG4gICAgc29ydE9yZGVyQXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG4gICAgZWRpdFN0YXRlOiBVc2VFZGl0U3RhdGU7XG4gICAgb25TYXZlQWN0aW9uPzogQWN0aW9uVmFsdWU7XG4gICAgb25EZWxldGVBY3Rpb24/OiBBY3Rpb25WYWx1ZTtcbiAgICBvbkNyZWF0ZUFjdGlvbj86IEFjdGlvblZhbHVlO1xuICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz86IEF0dHJpYnV0ZU92ZXJyaWRlcztcbn1cblxuaW50ZXJmYWNlIFVzZUZBUUFjdGlvbnNSZXN1bHQge1xuICAgIGhhbmRsZVNhdmVFZGl0OiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBoYW5kbGVTYXZlTmV3OiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBoYW5kbGVDb25maXJtRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGhhbmRsZURyYWdFbmQ6IChldmVudDogRHJhZ0VuZEV2ZW50KSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEN1c3RvbSBob29rIHRvIG1hbmFnZSBGQVEgQ1JVRCBvcGVyYXRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VGQVFBY3Rpb25zKHtcbiAgICBkYXRhU291cmNlVHlwZSxcbiAgICBkYXRhU291cmNlLFxuICAgIHNvcnRPcmRlckF0dHJpYnV0ZSxcbiAgICBlZGl0U3RhdGUsXG4gICAgb25TYXZlQWN0aW9uLFxuICAgIG9uRGVsZXRlQWN0aW9uLFxuICAgIG9uQ3JlYXRlQWN0aW9uLFxuICAgIGF0dHJpYnV0ZU92ZXJyaWRlc1xufTogVXNlRkFRQWN0aW9uc1Byb3BzKTogVXNlRkFRQWN0aW9uc1Jlc3VsdCB7XG4gICAgLy8gQ2hlY2sgaWYgQUxMIGF0dHJpYnV0ZSBvdmVycmlkZXMgYXJlIGNvbmZpZ3VyZWQgKGFsbC1vci1ub3RoaW5nIGFwcHJvYWNoKVxuICAgIGNvbnN0IGhhc0FsbE92ZXJyaWRlcyA9ICEhKFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LnN1bW1hcnlBdHRyaWJ1dGUgJiZcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5jb250ZW50QXR0cmlidXRlICYmXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uY29udGVudEZvcm1hdEF0dHJpYnV0ZSAmJlxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlXG4gICAgKTtcblxuICAgIC8qKlxuICAgICAqIFNldCBhdHRyaWJ1dGUgdmFsdWVzIG9uIGFuIGl0ZW0gdXNpbmcgb3ZlcnJpZGVzIChMaXN0QXR0cmlidXRlVmFsdWUuZ2V0KCkuc2V0VmFsdWUoKSlcbiAgICAgKiBUaGlzIGlzIHRoZSBwcm9wZXIgTWVuZGl4IFBsdWdnYWJsZSBXaWRnZXQgQVBJIHdheSB0byBzZXQgdmFsdWVzIGZvciBFWElTVElORyBpdGVtc1xuICAgICAqL1xuICAgIGNvbnN0IHNldFZhbHVlc1ZpYU92ZXJyaWRlcyA9IChcbiAgICAgICAgaXRlbTogT2JqZWN0SXRlbSxcbiAgICAgICAgc3VtbWFyeTogc3RyaW5nLFxuICAgICAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0sXG4gICAgICAgIHNvcnRPcmRlcjogQmlnXG4gICAgKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1bW1hcnlFZGl0YWJsZSA9IGF0dHJpYnV0ZU92ZXJyaWRlcyEuc3VtbWFyeUF0dHJpYnV0ZSEuZ2V0KGl0ZW0pO1xuICAgICAgICBjb25zdCBjb250ZW50RWRpdGFibGUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLmNvbnRlbnRBdHRyaWJ1dGUhLmdldChpdGVtKTtcbiAgICAgICAgY29uc3QgZm9ybWF0RWRpdGFibGUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUhLmdldChpdGVtKTtcbiAgICAgICAgY29uc3Qgc29ydE9yZGVyRWRpdGFibGUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlIS5nZXQoaXRlbSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBTZXR0aW5nIHZhbHVlcyB2aWEgTGlzdEF0dHJpYnV0ZVZhbHVlIG92ZXJyaWRlc1wiKTtcbiAgICAgICAgc3VtbWFyeUVkaXRhYmxlLnNldFZhbHVlKHN1bW1hcnkpO1xuICAgICAgICBjb250ZW50RWRpdGFibGUuc2V0VmFsdWUoY29udGVudCk7XG4gICAgICAgIGZvcm1hdEVkaXRhYmxlLnNldFZhbHVlKGZvcm1hdCk7XG4gICAgICAgIHNvcnRPcmRlckVkaXRhYmxlLnNldFZhbHVlKHNvcnRPcmRlcik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldCBhdHRyaWJ1dGUgdmFsdWVzIG9uIGFuIE14T2JqZWN0IHVzaW5nIGRlZmF1bHQgYXR0cmlidXRlIG5hbWVzXG4gICAgICovXG4gICAgY29uc3Qgc2V0VmFsdWVzVmlhRGVmYXVsdHMgPSAoXG4gICAgICAgIG14T2JqOiBhbnksXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IEJpZ1xuICAgICkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFNldHRpbmcgdmFsdWVzIHZpYSBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lc1wiKTtcbiAgICAgICAgbXhPYmouc2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSwgc3VtbWFyeSk7XG4gICAgICAgIG14T2JqLnNldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlQsIGNvbnRlbnQpO1xuICAgICAgICBteE9iai5zZXQoRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5UX0ZPUk1BVCwgZm9ybWF0KTtcbiAgICAgICAgbXhPYmouc2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUiwgc29ydE9yZGVyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogR2V0IGF0dHJpYnV0ZSBuYW1lcyBmcm9tIG92ZXJyaWRlIExpc3RBdHRyaWJ1dGVWYWx1ZXMgYnkgaW5zcGVjdGluZyBhbiBleGlzdGluZyBpdGVtLlxuICAgICAqIFRoZSBFZGl0YWJsZVZhbHVlLmlkIGNvbnRhaW5zIHRoZSBmdWxsIGF0dHJpYnV0ZSBwYXRoIGxpa2UgXCJNeU1vZHVsZS5NeUVudGl0eS9NeUF0dHJpYnV0ZVwiXG4gICAgICogV2UgZXh0cmFjdCBqdXN0IHRoZSBhdHRyaWJ1dGUgbmFtZSBmcm9tIGl0LlxuICAgICAqL1xuICAgIGNvbnN0IGdldE92ZXJyaWRlQXR0cmlidXRlTmFtZXMgPSAocmVmZXJlbmNlSXRlbTogT2JqZWN0SXRlbSkgPT4ge1xuICAgICAgICBjb25zdCBleHRyYWN0TmFtZSA9IChlZGl0YWJsZTogYW55KTogc3RyaW5nID0+IHtcbiAgICAgICAgICAgIC8vIFRoZSBlZGl0YWJsZS5pZCBpcyB0eXBpY2FsbHkgaW4gZm9ybWF0IFwiTW9kdWxlLkVudGl0eS9BdHRyaWJ1dGVOYW1lXCJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gZWRpdGFibGU/LmlkIHx8IFwiXCI7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IGlkLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICAgIHJldHVybiBwYXJ0cy5sZW5ndGggPiAxID8gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gOiBpZDtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBzdW1tYXJ5RWRpdGFibGUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLnN1bW1hcnlBdHRyaWJ1dGUhLmdldChyZWZlcmVuY2VJdGVtKTtcbiAgICAgICAgY29uc3QgY29udGVudEVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5jb250ZW50QXR0cmlidXRlIS5nZXQocmVmZXJlbmNlSXRlbSk7XG4gICAgICAgIGNvbnN0IGZvcm1hdEVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5jb250ZW50Rm9ybWF0QXR0cmlidXRlIS5nZXQocmVmZXJlbmNlSXRlbSk7XG4gICAgICAgIGNvbnN0IHNvcnRPcmRlckVkaXRhYmxlID0gYXR0cmlidXRlT3ZlcnJpZGVzIS5zb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZSEuZ2V0KHJlZmVyZW5jZUl0ZW0pO1xuXG4gICAgICAgIGNvbnN0IG5hbWVzID0ge1xuICAgICAgICAgICAgc3VtbWFyeTogZXh0cmFjdE5hbWUoc3VtbWFyeUVkaXRhYmxlKSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGV4dHJhY3ROYW1lKGNvbnRlbnRFZGl0YWJsZSksXG4gICAgICAgICAgICBjb250ZW50Rm9ybWF0OiBleHRyYWN0TmFtZShmb3JtYXRFZGl0YWJsZSksXG4gICAgICAgICAgICBzb3J0T3JkZXI6IGV4dHJhY3ROYW1lKHNvcnRPcmRlckVkaXRhYmxlKVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogRXh0cmFjdGVkIG92ZXJyaWRlIGF0dHJpYnV0ZSBuYW1lczpcIiwgbmFtZXMpO1xuICAgICAgICByZXR1cm4gbmFtZXM7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmVFZGl0ID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIGFzeW5jIChcbiAgICAgICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0sXG4gICAgICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICAgICApOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICFkYXRhU291cmNlIHx8XG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBkYXRhU291cmNlLml0ZW1zPy5bZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXhdO1xuICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbiAxOiBVc2UgY3VzdG9tIGFjdGlvbiBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICBpZiAob25TYXZlQWN0aW9uICYmIG9uU2F2ZUFjdGlvbi5jYW5FeGVjdXRlKSB7XG4gICAgICAgICAgICAgICAgb25TYXZlQWN0aW9uLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoRWRpdGluZygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3B0aW9uIDI6IFVzZSBvdmVycmlkZXMgaWYgY29uZmlndXJlZCAoc2V0VmFsdWUgdmlhIExpc3RBdHRyaWJ1dGVWYWx1ZSlcbiAgICAgICAgICAgIGlmIChoYXNBbGxPdmVycmlkZXMpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3J0VmFsdWUgPSBuZXcgQmlnKHNvcnRPcmRlcik7XG4gICAgICAgICAgICAgICAgICAgIHNldFZhbHVlc1ZpYU92ZXJyaWRlcyhpdGVtLCBzdW1tYXJ5LCBjb250ZW50LCBmb3JtYXQsIHNvcnRWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRmV0Y2ggTXhPYmplY3QgZm9yIGNvbW1pdFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBteCA9ICh3aW5kb3cgYXMgYW55KS5teDtcbiAgICAgICAgICAgICAgICAgICAgbXguZGF0YS5nZXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3VpZDogaXRlbS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAobXhPYmo6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1pdE9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhPYmosXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRkFRIEFjY29yZGlvbjogU3VjY2Vzc2Z1bGx5IHNhdmVkIEZBUSBpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIHNhdmU6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBnZXQgb2JqZWN0OlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBzYXZlIHdpdGggb3ZlcnJpZGVzOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3B0aW9uIDM6IEZhbGxiYWNrIHRvIGJ1aWx0LWluIGNvbW1pdCB3aXRoIGRlZmF1bHQgYXR0cmlidXRlIG5hbWVzXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG14ID0gKHdpbmRvdyBhcyBhbnkpLm14O1xuICAgICAgICAgICAgICAgIGNvbnN0IGd1aWQgPSBpdGVtLmlkO1xuXG4gICAgICAgICAgICAgICAgbXguZGF0YS5nZXQoe1xuICAgICAgICAgICAgICAgICAgICBndWlkOiBndWlkLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKG14T2JqOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvcnRWYWx1ZSA9IG5ldyBCaWcoc29ydE9yZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFZhbHVlc1ZpYURlZmF1bHRzKG14T2JqLCBzdW1tYXJ5LCBjb250ZW50LCBmb3JtYXQsIHNvcnRWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1pdE9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteE9iaixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRkFRIEFjY29yZGlvbjogU3VjY2Vzc2Z1bGx5IHNhdmVkIEZBUSBpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIHNhdmU6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZ2V0IG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGNvbW1pdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFtkYXRhU291cmNlLCBkYXRhU291cmNlVHlwZSwgZWRpdFN0YXRlLCBvblNhdmVBY3Rpb24sIGF0dHJpYnV0ZU92ZXJyaWRlc11cbiAgICApO1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZU5ldyA9IHVzZUNhbGxiYWNrKFxuICAgICAgICBhc3luYyAoXG4gICAgICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgICAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICAgICAgKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICAgICAgICBpZiAoIWRhdGFTb3VyY2UgfHwgZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxDcmVhdGluZygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3B0aW9uIDE6IFVzZSBjdXN0b20gY3JlYXRlIGFjdGlvbiBpZiBjb25maWd1cmVkXG4gICAgICAgICAgICBpZiAob25DcmVhdGVBY3Rpb24gJiYgb25DcmVhdGVBY3Rpb24uY2FuRXhlY3V0ZSkge1xuICAgICAgICAgICAgICAgIG9uQ3JlYXRlQWN0aW9uLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoQ3JlYXRpbmcoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbiAyOiBGYWxsYmFjayB0byBidWlsdC1pbiBjcmVhdGVcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW50aXR5TmFtZSA9IGF3YWl0IGdldEVudGl0eU5hbWUoZGF0YVNvdXJjZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWVudGl0eU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IENhbm5vdCBjcmVhdGUgbmV3IGl0ZW0gLSBlbnRpdHkgbmFtZSBub3QgZm91bmRcIik7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxDcmVhdGluZygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3SXRlbSA9IGF3YWl0IGNyZWF0ZU9iamVjdChlbnRpdHlOYW1lKTtcblxuICAgICAgICAgICAgICAgIC8vIERldGVybWluZSBhdHRyaWJ1dGUgbmFtZXMgYmFzZWQgb24gd2hldGhlciB3ZSdyZSB1c2luZyBvdmVycmlkZXNcbiAgICAgICAgICAgICAgICBsZXQgYXR0ck5hbWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50Rm9ybWF0OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlcjogc3RyaW5nO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFzQWxsT3ZlcnJpZGVzICYmIGRhdGFTb3VyY2UuaXRlbXMgJiYgZGF0YVNvdXJjZS5pdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZSBvdmVycmlkZXMgLSBnZXQgbmFtZXMgZnJvbSBleGlzdGluZyBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGF0dHJOYW1lcyA9IGdldE92ZXJyaWRlQXR0cmlidXRlTmFtZXMoZGF0YVNvdXJjZS5pdGVtc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogVXNpbmcgb3ZlcnJpZGUgYXR0cmlidXRlIG5hbWVzIGZvciBjcmVhdGU6XCIsIGF0dHJOYW1lcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGRlZmF1bHRzXG4gICAgICAgICAgICAgICAgICAgIGF0dHJOYW1lcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRGb3JtYXQ6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVF9GT1JNQVQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFVzaW5nIGRlZmF1bHQgYXR0cmlidXRlIG5hbWVzIGZvciBjcmVhdGU6XCIsIGF0dHJOYW1lcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV3SXRlbS5zZXQoYXR0ck5hbWVzLnN1bW1hcnksIHN1bW1hcnkpO1xuICAgICAgICAgICAgICAgIG5ld0l0ZW0uc2V0KGF0dHJOYW1lcy5jb250ZW50LCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICBuZXdJdGVtLnNldChhdHRyTmFtZXMuY29udGVudEZvcm1hdCwgZm9ybWF0KTtcblxuICAgICAgICAgICAgICAgIGxldCBzb3J0T3JkZXJUb1VzZSA9IHNvcnRPcmRlcjtcblxuICAgICAgICAgICAgICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHNvcnRPcmRlclRvVXNlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc29ydE9yZGVyQXR0cmlidXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXh0U29ydE9yZGVyID0gZ2V0TmV4dFNvcnRPcmRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhU291cmNlLml0ZW1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlclRvVXNlID0gTnVtYmVyKG5leHRTb3J0T3JkZXIudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Q291bnQgPSBkYXRhU291cmNlLml0ZW1zPy5sZW5ndGggfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlclRvVXNlID0gKGN1cnJlbnRDb3VudCArIDEpICogMTA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzb3J0T3JkZXJWYWx1ZSA9IG5ldyBCaWcoc29ydE9yZGVyVG9Vc2UpO1xuICAgICAgICAgICAgICAgIG5ld0l0ZW0uc2V0KGF0dHJOYW1lcy5zb3J0T3JkZXIsIHNvcnRPcmRlclZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IGNvbW1pdE9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgXCJGQVEgQWNjb3JkaW9uOiBTdWNjZXNzZnVsbHkgY3JlYXRlZCBuZXcgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmZpbmlzaENyZWF0aW5nKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY3JlYXRlIG5ldyBpdGVtOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbENyZWF0aW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFtkYXRhU291cmNlLCBkYXRhU291cmNlVHlwZSwgZWRpdFN0YXRlLCBvbkNyZWF0ZUFjdGlvbiwgc29ydE9yZGVyQXR0cmlidXRlLCBoYXNBbGxPdmVycmlkZXNdXG4gICAgKTtcblxuICAgIGNvbnN0IGhhbmRsZUNvbmZpcm1EZWxldGUgPSB1c2VDYWxsYmFjaygoKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChlZGl0U3RhdGUuZGVsZXRlQ29uZmlybUluZGV4ID09PSBudWxsIHx8ICFkYXRhU291cmNlIHx8IGRhdGFTb3VyY2VUeXBlICE9PSBcImRhdGFiYXNlXCIpIHtcbiAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxEZWxldGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGl0ZW0gPSBkYXRhU291cmNlLml0ZW1zPy5bZWRpdFN0YXRlLmRlbGV0ZUNvbmZpcm1JbmRleF07XG4gICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbERlbGV0ZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3B0aW9uIDE6IFVzZSBjdXN0b20gZGVsZXRlIGFjdGlvbiBpZiBjb25maWd1cmVkXG4gICAgICAgIGlmIChvbkRlbGV0ZUFjdGlvbiAmJiBvbkRlbGV0ZUFjdGlvbi5jYW5FeGVjdXRlKSB7XG4gICAgICAgICAgICBvbkRlbGV0ZUFjdGlvbi5leGVjdXRlKCk7XG4gICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoRGVsZXRpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBPcHRpb24gMjogRmFsbGJhY2sgdG8gYnVpbHQtaW4gZGVsZXRlXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlT2JqZWN0KGl0ZW0sIGRhdGFTb3VyY2UsIFwiRkFRIEFjY29yZGlvbjogU3VjY2Vzc2Z1bGx5IGRlbGV0ZWQgRkFRIGl0ZW1cIilcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hEZWxldGluZygpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGRlbGV0ZTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZSwgZGF0YVNvdXJjZVR5cGUsIGVkaXRTdGF0ZSwgb25EZWxldGVBY3Rpb25dKTtcblxuICAgIGNvbnN0IGhhbmRsZURyYWdFbmQgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgKGV2ZW50OiBEcmFnRW5kRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgYWN0aXZlLCBvdmVyIH0gPSBldmVudDtcblxuICAgICAgICAgICAgaWYgKCFvdmVyIHx8IGFjdGl2ZS5pZCA9PT0gb3Zlci5pZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFkYXRhU291cmNlIHx8IGRhdGFTb3VyY2VUeXBlICE9PSBcImRhdGFiYXNlXCIgfHwgIXNvcnRPcmRlckF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgXCJGQVEgQWNjb3JkaW9uOiBEcmFnLWRyb3AgcmVxdWlyZXMgZGF0YWJhc2UgbW9kZSB3aXRoIHNvcnRPcmRlckF0dHJpYnV0ZVwiXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRzSXRlbXMgPSBkYXRhU291cmNlLml0ZW1zIHx8IFtdO1xuICAgICAgICAgICAgY29uc3Qgb2xkSW5kZXggPSBkc0l0ZW1zLmZpbmRJbmRleCgoaXRlbTogT2JqZWN0SXRlbSkgPT4gaXRlbS5pZCA9PT0gYWN0aXZlLmlkKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0luZGV4ID0gZHNJdGVtcy5maW5kSW5kZXgoKGl0ZW06IE9iamVjdEl0ZW0pID0+IGl0ZW0uaWQgPT09IG92ZXIuaWQpO1xuXG4gICAgICAgICAgICBpZiAob2xkSW5kZXggPT09IC0xIHx8IG5ld0luZGV4ID09PSAtMSB8fCBvbGRJbmRleCA9PT0gbmV3SW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRJdGVtID0gZHNJdGVtc1tvbGRJbmRleF07XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRJdGVtID0gZHNJdGVtc1tuZXdJbmRleF07XG5cbiAgICAgICAgICAgIGlmICghZHJhZ2dlZEl0ZW0gfHwgIXRhcmdldEl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRyYWdnZWRPcmRlciA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoZHJhZ2dlZEl0ZW0pLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0T3JkZXIgPSBzb3J0T3JkZXJBdHRyaWJ1dGUuZ2V0KHRhcmdldEl0ZW0pLnZhbHVlO1xuXG4gICAgICAgICAgICBzd2FwU29ydE9yZGVycyhcbiAgICAgICAgICAgICAgICBkcmFnZ2VkSXRlbSxcbiAgICAgICAgICAgICAgICB0YXJnZXRJdGVtLFxuICAgICAgICAgICAgICAgIGRyYWdnZWRPcmRlcixcbiAgICAgICAgICAgICAgICB0YXJnZXRPcmRlcixcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICAgICAgICAgIGBGQVEgQWNjb3JkaW9uOiBTdWNjZXNzZnVsbHkgcmVvcmRlcmVkIGl0ZW0gZnJvbSBwb3NpdGlvbiAke29sZEluZGV4ICsgMX0gdG8gJHtcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggKyAxXG4gICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byByZW9yZGVyIGl0ZW06XCIsIGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBbZGF0YVNvdXJjZSwgZGF0YVNvdXJjZVR5cGUsIHNvcnRPcmRlckF0dHJpYnV0ZV1cbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaGFuZGxlU2F2ZUVkaXQsXG4gICAgICAgIGhhbmRsZVNhdmVOZXcsXG4gICAgICAgIGhhbmRsZUNvbmZpcm1EZWxldGUsXG4gICAgICAgIGhhbmRsZURyYWdFbmRcbiAgICB9O1xufVxuIiwiLyohXG5cdENvcHlyaWdodCAoYykgMjAxOCBKZWQgV2F0c29uLlxuXHRMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UgKE1JVCksIHNlZVxuXHRodHRwOi8vamVkd2F0c29uLmdpdGh1Yi5pby9jbGFzc25hbWVzXG4qL1xuLyogZ2xvYmFsIGRlZmluZSAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGhhc093biA9IHt9Lmhhc093blByb3BlcnR5O1xuXG5cdGZ1bmN0aW9uIGNsYXNzTmFtZXMgKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdGlmIChhcmcpIHtcblx0XHRcdFx0Y2xhc3NlcyA9IGFwcGVuZENsYXNzKGNsYXNzZXMsIHBhcnNlVmFsdWUoYXJnKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVZhbHVlIChhcmcpIHtcblx0XHRpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcblx0XHRcdHJldHVybiBhcmc7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBhcmcgIT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKTtcblx0XHR9XG5cblx0XHRpZiAoYXJnLnRvU3RyaW5nICE9PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nICYmICFhcmcudG9TdHJpbmcudG9TdHJpbmcoKS5pbmNsdWRlcygnW25hdGl2ZSBjb2RlXScpKSB7XG5cdFx0XHRyZXR1cm4gYXJnLnRvU3RyaW5nKCk7XG5cdFx0fVxuXG5cdFx0dmFyIGNsYXNzZXMgPSAnJztcblxuXHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdGlmIChoYXNPd24uY2FsbChhcmcsIGtleSkgJiYgYXJnW2tleV0pIHtcblx0XHRcdFx0Y2xhc3NlcyA9IGFwcGVuZENsYXNzKGNsYXNzZXMsIGtleSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRDbGFzcyAodmFsdWUsIG5ld0NsYXNzKSB7XG5cdFx0aWYgKCFuZXdDbGFzcykge1xuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0XG5cdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRyZXR1cm4gdmFsdWUgKyAnICcgKyBuZXdDbGFzcztcblx0XHR9XG5cdFxuXHRcdHJldHVybiB2YWx1ZSArIG5ld0NsYXNzO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0Y2xhc3NOYW1lcy5kZWZhdWx0ID0gY2xhc3NOYW1lcztcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5cbmludGVyZmFjZSBFZGl0TW9kZVRvZ2dsZVByb3BzIHtcbiAgICBlZGl0TW9kZTogYm9vbGVhbjtcbiAgICBvblRvZ2dsZTogKCkgPT4gdm9pZDtcbiAgICBkaXNhYmxlZD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogVG9nZ2xlIGJ1dHRvbiBmb3Igc3dpdGNoaW5nIGJldHdlZW4gdmlldyBhbmQgZWRpdCBtb2Rlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gRWRpdE1vZGVUb2dnbGUocHJvcHM6IEVkaXRNb2RlVG9nZ2xlUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHsgZWRpdE1vZGUsIG9uVG9nZ2xlLCBkaXNhYmxlZCA9IGZhbHNlIH0gPSBwcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWVkaXQtbW9kZS10b2dnbGVcIiwge1xuICAgICAgICAgICAgICAgIFwiZmFxLWVkaXQtbW9kZS1hY3RpdmVcIjogZWRpdE1vZGVcbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgb25DbGljaz17b25Ub2dnbGV9XG4gICAgICAgICAgICBkaXNhYmxlZD17ZGlzYWJsZWR9XG4gICAgICAgICAgICBhcmlhLWxhYmVsPXtlZGl0TW9kZSA/IFwiU3dpdGNoIHRvIHZpZXcgbW9kZVwiIDogXCJTd2l0Y2ggdG8gZWRpdCBtb2RlXCJ9XG4gICAgICAgICAgICB0aXRsZT17ZWRpdE1vZGUgPyBcIlZpZXcgTW9kZVwiIDogXCJFZGl0IE1vZGVcIn1cbiAgICAgICAgPlxuICAgICAgICAgICAge2VkaXRNb2RlID8gKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTAuNSA4YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAwIDEgNSAwelwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTAgOHMzLTUuNSA4LTUuNVMxNiA4IDE2IDhzLTMgNS41LTggNS41UzAgOCAwIDh6bTggMy41YTMuNSAzLjUgMCAxIDAgMC03IDMuNSAzLjUgMCAwIDAgMCA3elwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5WaWV3PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTEyLjg1NCAxLjE0NmEuNS41IDAgMCAwLS43MDggMEwxMCAzLjI5MyAxMi43MDcgNmwyLjE0Ny0yLjE0NmEuNS41IDAgMCAwIDAtLjcwOGwtMi0yek0xMS4yOTMgNEwyIDEzLjI5M1YxNmgyLjcwN0wxNCA2LjcwNyAxMS4yOTMgNHpcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+RWRpdDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICl9XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5pbXBvcnQgeyBFZGl0TW9kZVRvZ2dsZSB9IGZyb20gXCIuL0VkaXRNb2RlVG9nZ2xlXCI7XG5cbmludGVyZmFjZSBGQVFIZWFkZXJQcm9wcyB7XG4gICAgc2hvd1RvZ2dsZUJ1dHRvbjogYm9vbGVhbjtcbiAgICBhbGxFeHBhbmRlZDogYm9vbGVhbjtcbiAgICB0b2dnbGVCdXR0b25UZXh0Pzogc3RyaW5nO1xuICAgIG9uVG9nZ2xlQWxsOiAoKSA9PiB2b2lkO1xuICAgIGlzRWRpdGluZ0VuYWJsZWQ6IGJvb2xlYW47XG4gICAgZWRpdE1vZGU6IGJvb2xlYW47XG4gICAgb25Ub2dnbGVFZGl0TW9kZTogKCkgPT4gdm9pZDtcbiAgICBvbkNyZWF0ZU5ldzogKCkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBIZWFkZXIgY29tcG9uZW50IHdpdGggdG9nZ2xlIGFsbCBidXR0b24gYW5kIGVkaXQgbW9kZSBjb250cm9sc1xuICovXG5leHBvcnQgZnVuY3Rpb24gRkFRSGVhZGVyKHtcbiAgICBzaG93VG9nZ2xlQnV0dG9uLFxuICAgIGFsbEV4cGFuZGVkLFxuICAgIHRvZ2dsZUJ1dHRvblRleHQsXG4gICAgb25Ub2dnbGVBbGwsXG4gICAgaXNFZGl0aW5nRW5hYmxlZCxcbiAgICBlZGl0TW9kZSxcbiAgICBvblRvZ2dsZUVkaXRNb2RlLFxuICAgIG9uQ3JlYXRlTmV3XG59OiBGQVFIZWFkZXJQcm9wcyk6IFJlYWN0RWxlbWVudCB8IG51bGwge1xuICAgIGlmICghc2hvd1RvZ2dsZUJ1dHRvbiAmJiAhaXNFZGl0aW5nRW5hYmxlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBnZXRUb2dnbGVCdXR0b25UZXh0ID0gKCk6IHN0cmluZyA9PiB7XG4gICAgICAgIGlmICh0b2dnbGVCdXR0b25UZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdG9nZ2xlQnV0dG9uVGV4dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsRXhwYW5kZWQgPyBcIkhpZGUgQWxsXCIgOiBcIlNob3cgQWxsXCI7XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1oZWFkZXJcIj5cbiAgICAgICAgICAgIHtzaG93VG9nZ2xlQnV0dG9uICYmIChcbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS10b2dnbGUtYWxsLWJ0blwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImZhcS10b2dnbGUtYWxsLWJ0bi0tZXhwYW5kZWRcIjogYWxsRXhwYW5kZWRcbiAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uVG9nZ2xlQWxsfVxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtnZXRUb2dnbGVCdXR0b25UZXh0KCl9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAge2lzRWRpdGluZ0VuYWJsZWQgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWVkaXRpbmctY29udHJvbHNcIj5cbiAgICAgICAgICAgICAgICAgICAge2VkaXRNb2RlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtY3JlYXRlLW5ldy1idG5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ3JlYXRlTmV3fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJDcmVhdGUgbmV3IEZBUSBpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNOCAyYS41LjUgMCAwIDEgLjUuNXY1aDVhLjUuNSAwIDAgMSAwIDFoLTV2NWEuNS41IDAgMCAxLTEgMHYtNWgtNWEuNS41IDAgMCAxIDAtMWg1di01QS41LjUgMCAwIDEgOCAyelwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ3JlYXRlIE5ld1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgIDxFZGl0TW9kZVRvZ2dsZSBlZGl0TW9kZT17ZWRpdE1vZGV9IG9uVG9nZ2xlPXtvblRvZ2dsZUVkaXRNb2RlfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsIi8qISBAbGljZW5zZSBET01QdXJpZnkgMy4zLjEgfCAoYykgQ3VyZTUzIGFuZCBvdGhlciBjb250cmlidXRvcnMgfCBSZWxlYXNlZCB1bmRlciB0aGUgQXBhY2hlIGxpY2Vuc2UgMi4wIGFuZCBNb3ppbGxhIFB1YmxpYyBMaWNlbnNlIDIuMCB8IGdpdGh1Yi5jb20vY3VyZTUzL0RPTVB1cmlmeS9ibG9iLzMuMy4xL0xJQ0VOU0UgKi9cblxuY29uc3Qge1xuICBlbnRyaWVzLFxuICBzZXRQcm90b3R5cGVPZixcbiAgaXNGcm96ZW4sXG4gIGdldFByb3RvdHlwZU9mLFxuICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Jcbn0gPSBPYmplY3Q7XG5sZXQge1xuICBmcmVlemUsXG4gIHNlYWwsXG4gIGNyZWF0ZVxufSA9IE9iamVjdDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvbm8tbXV0YWJsZS1leHBvcnRzXG5sZXQge1xuICBhcHBseSxcbiAgY29uc3RydWN0XG59ID0gdHlwZW9mIFJlZmxlY3QgIT09ICd1bmRlZmluZWQnICYmIFJlZmxlY3Q7XG5pZiAoIWZyZWV6ZSkge1xuICBmcmVlemUgPSBmdW5jdGlvbiBmcmVlemUoeCkge1xuICAgIHJldHVybiB4O1xuICB9O1xufVxuaWYgKCFzZWFsKSB7XG4gIHNlYWwgPSBmdW5jdGlvbiBzZWFsKHgpIHtcbiAgICByZXR1cm4geDtcbiAgfTtcbn1cbmlmICghYXBwbHkpIHtcbiAgYXBwbHkgPSBmdW5jdGlvbiBhcHBseShmdW5jLCB0aGlzQXJnKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDIgPyBfbGVuIC0gMiA6IDApLCBfa2V5ID0gMjsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMl0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICB9O1xufVxuaWYgKCFjb25zdHJ1Y3QpIHtcbiAgY29uc3RydWN0ID0gZnVuY3Rpb24gY29uc3RydWN0KEZ1bmMpIHtcbiAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIgPiAxID8gX2xlbjIgLSAxIDogMCksIF9rZXkyID0gMTsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuICAgICAgYXJnc1tfa2V5MiAtIDFdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGdW5jKC4uLmFyZ3MpO1xuICB9O1xufVxuY29uc3QgYXJyYXlGb3JFYWNoID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUuZm9yRWFjaCk7XG5jb25zdCBhcnJheUxhc3RJbmRleE9mID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YpO1xuY29uc3QgYXJyYXlQb3AgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wb3ApO1xuY29uc3QgYXJyYXlQdXNoID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUucHVzaCk7XG5jb25zdCBhcnJheVNwbGljZSA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnNwbGljZSk7XG5jb25zdCBzdHJpbmdUb0xvd2VyQ2FzZSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50b0xvd2VyQ2FzZSk7XG5jb25zdCBzdHJpbmdUb1N0cmluZyA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyk7XG5jb25zdCBzdHJpbmdNYXRjaCA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5tYXRjaCk7XG5jb25zdCBzdHJpbmdSZXBsYWNlID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnJlcGxhY2UpO1xuY29uc3Qgc3RyaW5nSW5kZXhPZiA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mKTtcbmNvbnN0IHN0cmluZ1RyaW0gPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUudHJpbSk7XG5jb25zdCBvYmplY3RIYXNPd25Qcm9wZXJ0eSA9IHVuYXBwbHkoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5jb25zdCByZWdFeHBUZXN0ID0gdW5hcHBseShSZWdFeHAucHJvdG90eXBlLnRlc3QpO1xuY29uc3QgdHlwZUVycm9yQ3JlYXRlID0gdW5jb25zdHJ1Y3QoVHlwZUVycm9yKTtcbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbiB3aXRoIGEgc3BlY2lmaWVkIHRoaXNBcmcgYW5kIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gZnVuYyAtIFRoZSBmdW5jdGlvbiB0byBiZSB3cmFwcGVkIGFuZCBjYWxsZWQuXG4gKiBAcmV0dXJucyBBIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBnaXZlbiBmdW5jdGlvbiB3aXRoIGEgc3BlY2lmaWVkIHRoaXNBcmcgYW5kIGFyZ3VtZW50cy5cbiAqL1xuZnVuY3Rpb24gdW5hcHBseShmdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodGhpc0FyZykge1xuICAgIGlmICh0aGlzQXJnIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICB0aGlzQXJnLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMyA+IDEgPyBfbGVuMyAtIDEgOiAwKSwgX2tleTMgPSAxOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICBhcmdzW19rZXkzIC0gMV0gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgIH1cbiAgICByZXR1cm4gYXBwbHkoZnVuYywgdGhpc0FyZywgYXJncyk7XG4gIH07XG59XG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIGZ1bmMgLSBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gdG8gYmUgd3JhcHBlZCBhbmQgY2FsbGVkLlxuICogQHJldHVybnMgQSBuZXcgZnVuY3Rpb24gdGhhdCBjb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHMuXG4gKi9cbmZ1bmN0aW9uIHVuY29uc3RydWN0KEZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjQpLCBfa2V5NCA9IDA7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgIGFyZ3NbX2tleTRdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnN0cnVjdChGdW5jLCBhcmdzKTtcbiAgfTtcbn1cbi8qKlxuICogQWRkIHByb3BlcnRpZXMgdG8gYSBsb29rdXAgdGFibGVcbiAqXG4gKiBAcGFyYW0gc2V0IC0gVGhlIHNldCB0byB3aGljaCBlbGVtZW50cyB3aWxsIGJlIGFkZGVkLlxuICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgZWxlbWVudHMgdG8gYmUgYWRkZWQgdG8gdGhlIHNldC5cbiAqIEBwYXJhbSB0cmFuc2Zvcm1DYXNlRnVuYyAtIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybSB0aGUgY2FzZSBvZiBlYWNoIGVsZW1lbnQgYmVmb3JlIGFkZGluZyB0byB0aGUgc2V0LlxuICogQHJldHVybnMgVGhlIG1vZGlmaWVkIHNldCB3aXRoIGFkZGVkIGVsZW1lbnRzLlxuICovXG5mdW5jdGlvbiBhZGRUb1NldChzZXQsIGFycmF5KSB7XG4gIGxldCB0cmFuc2Zvcm1DYXNlRnVuYyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDogc3RyaW5nVG9Mb3dlckNhc2U7XG4gIGlmIChzZXRQcm90b3R5cGVPZikge1xuICAgIC8vIE1ha2UgJ2luJyBhbmQgdHJ1dGh5IGNoZWNrcyBsaWtlIEJvb2xlYW4oc2V0LmNvbnN0cnVjdG9yKVxuICAgIC8vIGluZGVwZW5kZW50IG9mIGFueSBwcm9wZXJ0aWVzIGRlZmluZWQgb24gT2JqZWN0LnByb3RvdHlwZS5cbiAgICAvLyBQcmV2ZW50IHByb3RvdHlwZSBzZXR0ZXJzIGZyb20gaW50ZXJjZXB0aW5nIHNldCBhcyBhIHRoaXMgdmFsdWUuXG4gICAgc2V0UHJvdG90eXBlT2Yoc2V0LCBudWxsKTtcbiAgfVxuICBsZXQgbCA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKGwtLSkge1xuICAgIGxldCBlbGVtZW50ID0gYXJyYXlbbF07XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgbGNFbGVtZW50ID0gdHJhbnNmb3JtQ2FzZUZ1bmMoZWxlbWVudCk7XG4gICAgICBpZiAobGNFbGVtZW50ICE9PSBlbGVtZW50KSB7XG4gICAgICAgIC8vIENvbmZpZyBwcmVzZXRzIChlLmcuIHRhZ3MuanMsIGF0dHJzLmpzKSBhcmUgaW1tdXRhYmxlLlxuICAgICAgICBpZiAoIWlzRnJvemVuKGFycmF5KSkge1xuICAgICAgICAgIGFycmF5W2xdID0gbGNFbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQgPSBsY0VsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHNldFtlbGVtZW50XSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIHNldDtcbn1cbi8qKlxuICogQ2xlYW4gdXAgYW4gYXJyYXkgdG8gaGFyZGVuIGFnYWluc3QgQ1NQUFxuICpcbiAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSB0byBiZSBjbGVhbmVkLlxuICogQHJldHVybnMgVGhlIGNsZWFuZWQgdmVyc2lvbiBvZiB0aGUgYXJyYXlcbiAqL1xuZnVuY3Rpb24gY2xlYW5BcnJheShhcnJheSkge1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgYXJyYXkubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgY29uc3QgaXNQcm9wZXJ0eUV4aXN0ID0gb2JqZWN0SGFzT3duUHJvcGVydHkoYXJyYXksIGluZGV4KTtcbiAgICBpZiAoIWlzUHJvcGVydHlFeGlzdCkge1xuICAgICAgYXJyYXlbaW5kZXhdID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuLyoqXG4gKiBTaGFsbG93IGNsb25lIGFuIG9iamVjdFxuICpcbiAqIEBwYXJhbSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIGJlIGNsb25lZC5cbiAqIEByZXR1cm5zIEEgbmV3IG9iamVjdCB0aGF0IGNvcGllcyB0aGUgb3JpZ2luYWwuXG4gKi9cbmZ1bmN0aW9uIGNsb25lKG9iamVjdCkge1xuICBjb25zdCBuZXdPYmplY3QgPSBjcmVhdGUobnVsbCk7XG4gIGZvciAoY29uc3QgW3Byb3BlcnR5LCB2YWx1ZV0gb2YgZW50cmllcyhvYmplY3QpKSB7XG4gICAgY29uc3QgaXNQcm9wZXJ0eUV4aXN0ID0gb2JqZWN0SGFzT3duUHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgaWYgKGlzUHJvcGVydHlFeGlzdCkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSBjbGVhbkFycmF5KHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSBjbG9uZSh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdPYmplY3RbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdPYmplY3Q7XG59XG4vKipcbiAqIFRoaXMgbWV0aG9kIGF1dG9tYXRpY2FsbHkgY2hlY2tzIGlmIHRoZSBwcm9wIGlzIGZ1bmN0aW9uIG9yIGdldHRlciBhbmQgYmVoYXZlcyBhY2NvcmRpbmdseS5cbiAqXG4gKiBAcGFyYW0gb2JqZWN0IC0gVGhlIG9iamVjdCB0byBsb29rIHVwIHRoZSBnZXR0ZXIgZnVuY3Rpb24gaW4gaXRzIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSBwcm9wIC0gVGhlIHByb3BlcnR5IG5hbWUgZm9yIHdoaWNoIHRvIGZpbmQgdGhlIGdldHRlciBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIFRoZSBnZXR0ZXIgZnVuY3Rpb24gZm91bmQgaW4gdGhlIHByb3RvdHlwZSBjaGFpbiBvciBhIGZhbGxiYWNrIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBsb29rdXBHZXR0ZXIob2JqZWN0LCBwcm9wKSB7XG4gIHdoaWxlIChvYmplY3QgIT09IG51bGwpIHtcbiAgICBjb25zdCBkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcCk7XG4gICAgaWYgKGRlc2MpIHtcbiAgICAgIGlmIChkZXNjLmdldCkge1xuICAgICAgICByZXR1cm4gdW5hcHBseShkZXNjLmdldCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGRlc2MudmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHVuYXBwbHkoZGVzYy52YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIG9iamVjdCA9IGdldFByb3RvdHlwZU9mKG9iamVjdCk7XG4gIH1cbiAgZnVuY3Rpb24gZmFsbGJhY2tWYWx1ZSgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZmFsbGJhY2tWYWx1ZTtcbn1cblxuY29uc3QgaHRtbCQxID0gZnJlZXplKFsnYScsICdhYmJyJywgJ2Fjcm9ueW0nLCAnYWRkcmVzcycsICdhcmVhJywgJ2FydGljbGUnLCAnYXNpZGUnLCAnYXVkaW8nLCAnYicsICdiZGknLCAnYmRvJywgJ2JpZycsICdibGluaycsICdibG9ja3F1b3RlJywgJ2JvZHknLCAnYnInLCAnYnV0dG9uJywgJ2NhbnZhcycsICdjYXB0aW9uJywgJ2NlbnRlcicsICdjaXRlJywgJ2NvZGUnLCAnY29sJywgJ2NvbGdyb3VwJywgJ2NvbnRlbnQnLCAnZGF0YScsICdkYXRhbGlzdCcsICdkZCcsICdkZWNvcmF0b3InLCAnZGVsJywgJ2RldGFpbHMnLCAnZGZuJywgJ2RpYWxvZycsICdkaXInLCAnZGl2JywgJ2RsJywgJ2R0JywgJ2VsZW1lbnQnLCAnZW0nLCAnZmllbGRzZXQnLCAnZmlnY2FwdGlvbicsICdmaWd1cmUnLCAnZm9udCcsICdmb290ZXInLCAnZm9ybScsICdoMScsICdoMicsICdoMycsICdoNCcsICdoNScsICdoNicsICdoZWFkJywgJ2hlYWRlcicsICdoZ3JvdXAnLCAnaHInLCAnaHRtbCcsICdpJywgJ2ltZycsICdpbnB1dCcsICdpbnMnLCAna2JkJywgJ2xhYmVsJywgJ2xlZ2VuZCcsICdsaScsICdtYWluJywgJ21hcCcsICdtYXJrJywgJ21hcnF1ZWUnLCAnbWVudScsICdtZW51aXRlbScsICdtZXRlcicsICduYXYnLCAnbm9icicsICdvbCcsICdvcHRncm91cCcsICdvcHRpb24nLCAnb3V0cHV0JywgJ3AnLCAncGljdHVyZScsICdwcmUnLCAncHJvZ3Jlc3MnLCAncScsICdycCcsICdydCcsICdydWJ5JywgJ3MnLCAnc2FtcCcsICdzZWFyY2gnLCAnc2VjdGlvbicsICdzZWxlY3QnLCAnc2hhZG93JywgJ3Nsb3QnLCAnc21hbGwnLCAnc291cmNlJywgJ3NwYWNlcicsICdzcGFuJywgJ3N0cmlrZScsICdzdHJvbmcnLCAnc3R5bGUnLCAnc3ViJywgJ3N1bW1hcnknLCAnc3VwJywgJ3RhYmxlJywgJ3Rib2R5JywgJ3RkJywgJ3RlbXBsYXRlJywgJ3RleHRhcmVhJywgJ3Rmb290JywgJ3RoJywgJ3RoZWFkJywgJ3RpbWUnLCAndHInLCAndHJhY2snLCAndHQnLCAndScsICd1bCcsICd2YXInLCAndmlkZW8nLCAnd2JyJ10pO1xuY29uc3Qgc3ZnJDEgPSBmcmVlemUoWydzdmcnLCAnYScsICdhbHRnbHlwaCcsICdhbHRnbHlwaGRlZicsICdhbHRnbHlwaGl0ZW0nLCAnYW5pbWF0ZWNvbG9yJywgJ2FuaW1hdGVtb3Rpb24nLCAnYW5pbWF0ZXRyYW5zZm9ybScsICdjaXJjbGUnLCAnY2xpcHBhdGgnLCAnZGVmcycsICdkZXNjJywgJ2VsbGlwc2UnLCAnZW50ZXJrZXloaW50JywgJ2V4cG9ydHBhcnRzJywgJ2ZpbHRlcicsICdmb250JywgJ2cnLCAnZ2x5cGgnLCAnZ2x5cGhyZWYnLCAnaGtlcm4nLCAnaW1hZ2UnLCAnaW5wdXRtb2RlJywgJ2xpbmUnLCAnbGluZWFyZ3JhZGllbnQnLCAnbWFya2VyJywgJ21hc2snLCAnbWV0YWRhdGEnLCAnbXBhdGgnLCAncGFydCcsICdwYXRoJywgJ3BhdHRlcm4nLCAncG9seWdvbicsICdwb2x5bGluZScsICdyYWRpYWxncmFkaWVudCcsICdyZWN0JywgJ3N0b3AnLCAnc3R5bGUnLCAnc3dpdGNoJywgJ3N5bWJvbCcsICd0ZXh0JywgJ3RleHRwYXRoJywgJ3RpdGxlJywgJ3RyZWYnLCAndHNwYW4nLCAndmlldycsICd2a2VybiddKTtcbmNvbnN0IHN2Z0ZpbHRlcnMgPSBmcmVlemUoWydmZUJsZW5kJywgJ2ZlQ29sb3JNYXRyaXgnLCAnZmVDb21wb25lbnRUcmFuc2ZlcicsICdmZUNvbXBvc2l0ZScsICdmZUNvbnZvbHZlTWF0cml4JywgJ2ZlRGlmZnVzZUxpZ2h0aW5nJywgJ2ZlRGlzcGxhY2VtZW50TWFwJywgJ2ZlRGlzdGFudExpZ2h0JywgJ2ZlRHJvcFNoYWRvdycsICdmZUZsb29kJywgJ2ZlRnVuY0EnLCAnZmVGdW5jQicsICdmZUZ1bmNHJywgJ2ZlRnVuY1InLCAnZmVHYXVzc2lhbkJsdXInLCAnZmVJbWFnZScsICdmZU1lcmdlJywgJ2ZlTWVyZ2VOb2RlJywgJ2ZlTW9ycGhvbG9neScsICdmZU9mZnNldCcsICdmZVBvaW50TGlnaHQnLCAnZmVTcGVjdWxhckxpZ2h0aW5nJywgJ2ZlU3BvdExpZ2h0JywgJ2ZlVGlsZScsICdmZVR1cmJ1bGVuY2UnXSk7XG4vLyBMaXN0IG9mIFNWRyBlbGVtZW50cyB0aGF0IGFyZSBkaXNhbGxvd2VkIGJ5IGRlZmF1bHQuXG4vLyBXZSBzdGlsbCBuZWVkIHRvIGtub3cgdGhlbSBzbyB0aGF0IHdlIGNhbiBkbyBuYW1lc3BhY2Vcbi8vIGNoZWNrcyBwcm9wZXJseSBpbiBjYXNlIG9uZSB3YW50cyB0byBhZGQgdGhlbSB0b1xuLy8gYWxsb3ctbGlzdC5cbmNvbnN0IHN2Z0Rpc2FsbG93ZWQgPSBmcmVlemUoWydhbmltYXRlJywgJ2NvbG9yLXByb2ZpbGUnLCAnY3Vyc29yJywgJ2Rpc2NhcmQnLCAnZm9udC1mYWNlJywgJ2ZvbnQtZmFjZS1mb3JtYXQnLCAnZm9udC1mYWNlLW5hbWUnLCAnZm9udC1mYWNlLXNyYycsICdmb250LWZhY2UtdXJpJywgJ2ZvcmVpZ25vYmplY3QnLCAnaGF0Y2gnLCAnaGF0Y2hwYXRoJywgJ21lc2gnLCAnbWVzaGdyYWRpZW50JywgJ21lc2hwYXRjaCcsICdtZXNocm93JywgJ21pc3NpbmctZ2x5cGgnLCAnc2NyaXB0JywgJ3NldCcsICdzb2xpZGNvbG9yJywgJ3Vua25vd24nLCAndXNlJ10pO1xuY29uc3QgbWF0aE1sJDEgPSBmcmVlemUoWydtYXRoJywgJ21lbmNsb3NlJywgJ21lcnJvcicsICdtZmVuY2VkJywgJ21mcmFjJywgJ21nbHlwaCcsICdtaScsICdtbGFiZWxlZHRyJywgJ21tdWx0aXNjcmlwdHMnLCAnbW4nLCAnbW8nLCAnbW92ZXInLCAnbXBhZGRlZCcsICdtcGhhbnRvbScsICdtcm9vdCcsICdtcm93JywgJ21zJywgJ21zcGFjZScsICdtc3FydCcsICdtc3R5bGUnLCAnbXN1YicsICdtc3VwJywgJ21zdWJzdXAnLCAnbXRhYmxlJywgJ210ZCcsICdtdGV4dCcsICdtdHInLCAnbXVuZGVyJywgJ211bmRlcm92ZXInLCAnbXByZXNjcmlwdHMnXSk7XG4vLyBTaW1pbGFybHkgdG8gU1ZHLCB3ZSB3YW50IHRvIGtub3cgYWxsIE1hdGhNTCBlbGVtZW50cyxcbi8vIGV2ZW4gdGhvc2UgdGhhdCB3ZSBkaXNhbGxvdyBieSBkZWZhdWx0LlxuY29uc3QgbWF0aE1sRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ21hY3Rpb24nLCAnbWFsaWduZ3JvdXAnLCAnbWFsaWdubWFyaycsICdtbG9uZ2RpdicsICdtc2NhcnJpZXMnLCAnbXNjYXJyeScsICdtc2dyb3VwJywgJ21zdGFjaycsICdtc2xpbmUnLCAnbXNyb3cnLCAnc2VtYW50aWNzJywgJ2Fubm90YXRpb24nLCAnYW5ub3RhdGlvbi14bWwnLCAnbXByZXNjcmlwdHMnLCAnbm9uZSddKTtcbmNvbnN0IHRleHQgPSBmcmVlemUoWycjdGV4dCddKTtcblxuY29uc3QgaHRtbCA9IGZyZWV6ZShbJ2FjY2VwdCcsICdhY3Rpb24nLCAnYWxpZ24nLCAnYWx0JywgJ2F1dG9jYXBpdGFsaXplJywgJ2F1dG9jb21wbGV0ZScsICdhdXRvcGljdHVyZWlucGljdHVyZScsICdhdXRvcGxheScsICdiYWNrZ3JvdW5kJywgJ2JnY29sb3InLCAnYm9yZGVyJywgJ2NhcHR1cmUnLCAnY2VsbHBhZGRpbmcnLCAnY2VsbHNwYWNpbmcnLCAnY2hlY2tlZCcsICdjaXRlJywgJ2NsYXNzJywgJ2NsZWFyJywgJ2NvbG9yJywgJ2NvbHMnLCAnY29sc3BhbicsICdjb250cm9scycsICdjb250cm9sc2xpc3QnLCAnY29vcmRzJywgJ2Nyb3Nzb3JpZ2luJywgJ2RhdGV0aW1lJywgJ2RlY29kaW5nJywgJ2RlZmF1bHQnLCAnZGlyJywgJ2Rpc2FibGVkJywgJ2Rpc2FibGVwaWN0dXJlaW5waWN0dXJlJywgJ2Rpc2FibGVyZW1vdGVwbGF5YmFjaycsICdkb3dubG9hZCcsICdkcmFnZ2FibGUnLCAnZW5jdHlwZScsICdlbnRlcmtleWhpbnQnLCAnZXhwb3J0cGFydHMnLCAnZmFjZScsICdmb3InLCAnaGVhZGVycycsICdoZWlnaHQnLCAnaGlkZGVuJywgJ2hpZ2gnLCAnaHJlZicsICdocmVmbGFuZycsICdpZCcsICdpbmVydCcsICdpbnB1dG1vZGUnLCAnaW50ZWdyaXR5JywgJ2lzbWFwJywgJ2tpbmQnLCAnbGFiZWwnLCAnbGFuZycsICdsaXN0JywgJ2xvYWRpbmcnLCAnbG9vcCcsICdsb3cnLCAnbWF4JywgJ21heGxlbmd0aCcsICdtZWRpYScsICdtZXRob2QnLCAnbWluJywgJ21pbmxlbmd0aCcsICdtdWx0aXBsZScsICdtdXRlZCcsICduYW1lJywgJ25vbmNlJywgJ25vc2hhZGUnLCAnbm92YWxpZGF0ZScsICdub3dyYXAnLCAnb3BlbicsICdvcHRpbXVtJywgJ3BhcnQnLCAncGF0dGVybicsICdwbGFjZWhvbGRlcicsICdwbGF5c2lubGluZScsICdwb3BvdmVyJywgJ3BvcG92ZXJ0YXJnZXQnLCAncG9wb3ZlcnRhcmdldGFjdGlvbicsICdwb3N0ZXInLCAncHJlbG9hZCcsICdwdWJkYXRlJywgJ3JhZGlvZ3JvdXAnLCAncmVhZG9ubHknLCAncmVsJywgJ3JlcXVpcmVkJywgJ3JldicsICdyZXZlcnNlZCcsICdyb2xlJywgJ3Jvd3MnLCAncm93c3BhbicsICdzcGVsbGNoZWNrJywgJ3Njb3BlJywgJ3NlbGVjdGVkJywgJ3NoYXBlJywgJ3NpemUnLCAnc2l6ZXMnLCAnc2xvdCcsICdzcGFuJywgJ3NyY2xhbmcnLCAnc3RhcnQnLCAnc3JjJywgJ3NyY3NldCcsICdzdGVwJywgJ3N0eWxlJywgJ3N1bW1hcnknLCAndGFiaW5kZXgnLCAndGl0bGUnLCAndHJhbnNsYXRlJywgJ3R5cGUnLCAndXNlbWFwJywgJ3ZhbGlnbicsICd2YWx1ZScsICd3aWR0aCcsICd3cmFwJywgJ3htbG5zJywgJ3Nsb3QnXSk7XG5jb25zdCBzdmcgPSBmcmVlemUoWydhY2NlbnQtaGVpZ2h0JywgJ2FjY3VtdWxhdGUnLCAnYWRkaXRpdmUnLCAnYWxpZ25tZW50LWJhc2VsaW5lJywgJ2FtcGxpdHVkZScsICdhc2NlbnQnLCAnYXR0cmlidXRlbmFtZScsICdhdHRyaWJ1dGV0eXBlJywgJ2F6aW11dGgnLCAnYmFzZWZyZXF1ZW5jeScsICdiYXNlbGluZS1zaGlmdCcsICdiZWdpbicsICdiaWFzJywgJ2J5JywgJ2NsYXNzJywgJ2NsaXAnLCAnY2xpcHBhdGh1bml0cycsICdjbGlwLXBhdGgnLCAnY2xpcC1ydWxlJywgJ2NvbG9yJywgJ2NvbG9yLWludGVycG9sYXRpb24nLCAnY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzJywgJ2NvbG9yLXByb2ZpbGUnLCAnY29sb3ItcmVuZGVyaW5nJywgJ2N4JywgJ2N5JywgJ2QnLCAnZHgnLCAnZHknLCAnZGlmZnVzZWNvbnN0YW50JywgJ2RpcmVjdGlvbicsICdkaXNwbGF5JywgJ2Rpdmlzb3InLCAnZHVyJywgJ2VkZ2Vtb2RlJywgJ2VsZXZhdGlvbicsICdlbmQnLCAnZXhwb25lbnQnLCAnZmlsbCcsICdmaWxsLW9wYWNpdHknLCAnZmlsbC1ydWxlJywgJ2ZpbHRlcicsICdmaWx0ZXJ1bml0cycsICdmbG9vZC1jb2xvcicsICdmbG9vZC1vcGFjaXR5JywgJ2ZvbnQtZmFtaWx5JywgJ2ZvbnQtc2l6ZScsICdmb250LXNpemUtYWRqdXN0JywgJ2ZvbnQtc3RyZXRjaCcsICdmb250LXN0eWxlJywgJ2ZvbnQtdmFyaWFudCcsICdmb250LXdlaWdodCcsICdmeCcsICdmeScsICdnMScsICdnMicsICdnbHlwaC1uYW1lJywgJ2dseXBocmVmJywgJ2dyYWRpZW50dW5pdHMnLCAnZ3JhZGllbnR0cmFuc2Zvcm0nLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnaW1hZ2UtcmVuZGVyaW5nJywgJ2luJywgJ2luMicsICdpbnRlcmNlcHQnLCAnaycsICdrMScsICdrMicsICdrMycsICdrNCcsICdrZXJuaW5nJywgJ2tleXBvaW50cycsICdrZXlzcGxpbmVzJywgJ2tleXRpbWVzJywgJ2xhbmcnLCAnbGVuZ3RoYWRqdXN0JywgJ2xldHRlci1zcGFjaW5nJywgJ2tlcm5lbG1hdHJpeCcsICdrZXJuZWx1bml0bGVuZ3RoJywgJ2xpZ2h0aW5nLWNvbG9yJywgJ2xvY2FsJywgJ21hcmtlci1lbmQnLCAnbWFya2VyLW1pZCcsICdtYXJrZXItc3RhcnQnLCAnbWFya2VyaGVpZ2h0JywgJ21hcmtlcnVuaXRzJywgJ21hcmtlcndpZHRoJywgJ21hc2tjb250ZW50dW5pdHMnLCAnbWFza3VuaXRzJywgJ21heCcsICdtYXNrJywgJ21hc2stdHlwZScsICdtZWRpYScsICdtZXRob2QnLCAnbW9kZScsICdtaW4nLCAnbmFtZScsICdudW1vY3RhdmVzJywgJ29mZnNldCcsICdvcGVyYXRvcicsICdvcGFjaXR5JywgJ29yZGVyJywgJ29yaWVudCcsICdvcmllbnRhdGlvbicsICdvcmlnaW4nLCAnb3ZlcmZsb3cnLCAncGFpbnQtb3JkZXInLCAncGF0aCcsICdwYXRobGVuZ3RoJywgJ3BhdHRlcm5jb250ZW50dW5pdHMnLCAncGF0dGVybnRyYW5zZm9ybScsICdwYXR0ZXJudW5pdHMnLCAncG9pbnRzJywgJ3ByZXNlcnZlYWxwaGEnLCAncHJlc2VydmVhc3BlY3RyYXRpbycsICdwcmltaXRpdmV1bml0cycsICdyJywgJ3J4JywgJ3J5JywgJ3JhZGl1cycsICdyZWZ4JywgJ3JlZnknLCAncmVwZWF0Y291bnQnLCAncmVwZWF0ZHVyJywgJ3Jlc3RhcnQnLCAncmVzdWx0JywgJ3JvdGF0ZScsICdzY2FsZScsICdzZWVkJywgJ3NoYXBlLXJlbmRlcmluZycsICdzbG9wZScsICdzcGVjdWxhcmNvbnN0YW50JywgJ3NwZWN1bGFyZXhwb25lbnQnLCAnc3ByZWFkbWV0aG9kJywgJ3N0YXJ0b2Zmc2V0JywgJ3N0ZGRldmlhdGlvbicsICdzdGl0Y2h0aWxlcycsICdzdG9wLWNvbG9yJywgJ3N0b3Atb3BhY2l0eScsICdzdHJva2UtZGFzaGFycmF5JywgJ3N0cm9rZS1kYXNob2Zmc2V0JywgJ3N0cm9rZS1saW5lY2FwJywgJ3N0cm9rZS1saW5lam9pbicsICdzdHJva2UtbWl0ZXJsaW1pdCcsICdzdHJva2Utb3BhY2l0eScsICdzdHJva2UnLCAnc3Ryb2tlLXdpZHRoJywgJ3N0eWxlJywgJ3N1cmZhY2VzY2FsZScsICdzeXN0ZW1sYW5ndWFnZScsICd0YWJpbmRleCcsICd0YWJsZXZhbHVlcycsICd0YXJnZXR4JywgJ3RhcmdldHknLCAndHJhbnNmb3JtJywgJ3RyYW5zZm9ybS1vcmlnaW4nLCAndGV4dC1hbmNob3InLCAndGV4dC1kZWNvcmF0aW9uJywgJ3RleHQtcmVuZGVyaW5nJywgJ3RleHRsZW5ndGgnLCAndHlwZScsICd1MScsICd1MicsICd1bmljb2RlJywgJ3ZhbHVlcycsICd2aWV3Ym94JywgJ3Zpc2liaWxpdHknLCAndmVyc2lvbicsICd2ZXJ0LWFkdi15JywgJ3ZlcnQtb3JpZ2luLXgnLCAndmVydC1vcmlnaW4teScsICd3aWR0aCcsICd3b3JkLXNwYWNpbmcnLCAnd3JhcCcsICd3cml0aW5nLW1vZGUnLCAneGNoYW5uZWxzZWxlY3RvcicsICd5Y2hhbm5lbHNlbGVjdG9yJywgJ3gnLCAneDEnLCAneDInLCAneG1sbnMnLCAneScsICd5MScsICd5MicsICd6JywgJ3pvb21hbmRwYW4nXSk7XG5jb25zdCBtYXRoTWwgPSBmcmVlemUoWydhY2NlbnQnLCAnYWNjZW50dW5kZXInLCAnYWxpZ24nLCAnYmV2ZWxsZWQnLCAnY2xvc2UnLCAnY29sdW1uc2FsaWduJywgJ2NvbHVtbmxpbmVzJywgJ2NvbHVtbnNwYW4nLCAnZGVub21hbGlnbicsICdkZXB0aCcsICdkaXInLCAnZGlzcGxheScsICdkaXNwbGF5c3R5bGUnLCAnZW5jb2RpbmcnLCAnZmVuY2UnLCAnZnJhbWUnLCAnaGVpZ2h0JywgJ2hyZWYnLCAnaWQnLCAnbGFyZ2VvcCcsICdsZW5ndGgnLCAnbGluZXRoaWNrbmVzcycsICdsc3BhY2UnLCAnbHF1b3RlJywgJ21hdGhiYWNrZ3JvdW5kJywgJ21hdGhjb2xvcicsICdtYXRoc2l6ZScsICdtYXRodmFyaWFudCcsICdtYXhzaXplJywgJ21pbnNpemUnLCAnbW92YWJsZWxpbWl0cycsICdub3RhdGlvbicsICdudW1hbGlnbicsICdvcGVuJywgJ3Jvd2FsaWduJywgJ3Jvd2xpbmVzJywgJ3Jvd3NwYWNpbmcnLCAncm93c3BhbicsICdyc3BhY2UnLCAncnF1b3RlJywgJ3NjcmlwdGxldmVsJywgJ3NjcmlwdG1pbnNpemUnLCAnc2NyaXB0c2l6ZW11bHRpcGxpZXInLCAnc2VsZWN0aW9uJywgJ3NlcGFyYXRvcicsICdzZXBhcmF0b3JzJywgJ3N0cmV0Y2h5JywgJ3N1YnNjcmlwdHNoaWZ0JywgJ3N1cHNjcmlwdHNoaWZ0JywgJ3N5bW1ldHJpYycsICd2b2Zmc2V0JywgJ3dpZHRoJywgJ3htbG5zJ10pO1xuY29uc3QgeG1sID0gZnJlZXplKFsneGxpbms6aHJlZicsICd4bWw6aWQnLCAneGxpbms6dGl0bGUnLCAneG1sOnNwYWNlJywgJ3htbG5zOnhsaW5rJ10pO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9iZXR0ZXItcmVnZXhcbmNvbnN0IE1VU1RBQ0hFX0VYUFIgPSBzZWFsKC9cXHtcXHtbXFx3XFxXXSp8W1xcd1xcV10qXFx9XFx9L2dtKTsgLy8gU3BlY2lmeSB0ZW1wbGF0ZSBkZXRlY3Rpb24gcmVnZXggZm9yIFNBRkVfRk9SX1RFTVBMQVRFUyBtb2RlXG5jb25zdCBFUkJfRVhQUiA9IHNlYWwoLzwlW1xcd1xcV10qfFtcXHdcXFddKiU+L2dtKTtcbmNvbnN0IFRNUExJVF9FWFBSID0gc2VhbCgvXFwkXFx7W1xcd1xcV10qL2dtKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSB1bmljb3JuL2JldHRlci1yZWdleFxuY29uc3QgREFUQV9BVFRSID0gc2VhbCgvXmRhdGEtW1xcLVxcdy5cXHUwMEI3LVxcdUZGRkZdKyQvKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2VsZXNzLWVzY2FwZVxuY29uc3QgQVJJQV9BVFRSID0gc2VhbCgvXmFyaWEtW1xcLVxcd10rJC8pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG5jb25zdCBJU19BTExPV0VEX1VSSSA9IHNlYWwoL14oPzooPzooPzpmfGh0KXRwcz98bWFpbHRvfHRlbHxjYWxsdG98c21zfGNpZHx4bXBwfG1hdHJpeCk6fFteYS16XXxbYS16Ky5cXC1dKyg/OlteYS16Ky5cXC06XXwkKSkvaSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG4pO1xuY29uc3QgSVNfU0NSSVBUX09SX0RBVEEgPSBzZWFsKC9eKD86XFx3K3NjcmlwdHxkYXRhKTovaSk7XG5jb25zdCBBVFRSX1dISVRFU1BBQ0UgPSBzZWFsKC9bXFx1MDAwMC1cXHUwMDIwXFx1MDBBMFxcdTE2ODBcXHUxODBFXFx1MjAwMC1cXHUyMDI5XFx1MjA1RlxcdTMwMDBdL2cgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb250cm9sLXJlZ2V4XG4pO1xuY29uc3QgRE9DVFlQRV9OQU1FID0gc2VhbCgvXmh0bWwkL2kpO1xuY29uc3QgQ1VTVE9NX0VMRU1FTlQgPSBzZWFsKC9eW2Etel1bLlxcd10qKC1bLlxcd10rKSskL2kpO1xuXG52YXIgRVhQUkVTU0lPTlMgPSAvKiNfX1BVUkVfXyovT2JqZWN0LmZyZWV6ZSh7XG4gIF9fcHJvdG9fXzogbnVsbCxcbiAgQVJJQV9BVFRSOiBBUklBX0FUVFIsXG4gIEFUVFJfV0hJVEVTUEFDRTogQVRUUl9XSElURVNQQUNFLFxuICBDVVNUT01fRUxFTUVOVDogQ1VTVE9NX0VMRU1FTlQsXG4gIERBVEFfQVRUUjogREFUQV9BVFRSLFxuICBET0NUWVBFX05BTUU6IERPQ1RZUEVfTkFNRSxcbiAgRVJCX0VYUFI6IEVSQl9FWFBSLFxuICBJU19BTExPV0VEX1VSSTogSVNfQUxMT1dFRF9VUkksXG4gIElTX1NDUklQVF9PUl9EQVRBOiBJU19TQ1JJUFRfT1JfREFUQSxcbiAgTVVTVEFDSEVfRVhQUjogTVVTVEFDSEVfRVhQUixcbiAgVE1QTElUX0VYUFI6IFRNUExJVF9FWFBSXG59KTtcblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2luZGVudCAqL1xuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGVcbmNvbnN0IE5PREVfVFlQRSA9IHtcbiAgZWxlbWVudDogMSxcbiAgYXR0cmlidXRlOiAyLFxuICB0ZXh0OiAzLFxuICBjZGF0YVNlY3Rpb246IDQsXG4gIGVudGl0eVJlZmVyZW5jZTogNSxcbiAgLy8gRGVwcmVjYXRlZFxuICBlbnRpdHlOb2RlOiA2LFxuICAvLyBEZXByZWNhdGVkXG4gIHByb2dyZXNzaW5nSW5zdHJ1Y3Rpb246IDcsXG4gIGNvbW1lbnQ6IDgsXG4gIGRvY3VtZW50OiA5LFxuICBkb2N1bWVudFR5cGU6IDEwLFxuICBkb2N1bWVudEZyYWdtZW50OiAxMSxcbiAgbm90YXRpb246IDEyIC8vIERlcHJlY2F0ZWRcbn07XG5jb25zdCBnZXRHbG9iYWwgPSBmdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiB3aW5kb3c7XG59O1xuLyoqXG4gKiBDcmVhdGVzIGEgbm8tb3AgcG9saWN5IGZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAqIERvbid0IGV4cG9ydCB0aGlzIGZ1bmN0aW9uIG91dHNpZGUgdGhpcyBtb2R1bGUhXG4gKiBAcGFyYW0gdHJ1c3RlZFR5cGVzIFRoZSBwb2xpY3kgZmFjdG9yeS5cbiAqIEBwYXJhbSBwdXJpZnlIb3N0RWxlbWVudCBUaGUgU2NyaXB0IGVsZW1lbnQgdXNlZCB0byBsb2FkIERPTVB1cmlmeSAodG8gZGV0ZXJtaW5lIHBvbGljeSBuYW1lIHN1ZmZpeCkuXG4gKiBAcmV0dXJuIFRoZSBwb2xpY3kgY3JlYXRlZCAob3IgbnVsbCwgaWYgVHJ1c3RlZCBUeXBlc1xuICogYXJlIG5vdCBzdXBwb3J0ZWQgb3IgY3JlYXRpbmcgdGhlIHBvbGljeSBmYWlsZWQpLlxuICovXG5jb25zdCBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5ID0gZnVuY3Rpb24gX2NyZWF0ZVRydXN0ZWRUeXBlc1BvbGljeSh0cnVzdGVkVHlwZXMsIHB1cmlmeUhvc3RFbGVtZW50KSB7XG4gIGlmICh0eXBlb2YgdHJ1c3RlZFR5cGVzICE9PSAnb2JqZWN0JyB8fCB0eXBlb2YgdHJ1c3RlZFR5cGVzLmNyZWF0ZVBvbGljeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8vIEFsbG93IHRoZSBjYWxsZXJzIHRvIGNvbnRyb2wgdGhlIHVuaXF1ZSBwb2xpY3kgbmFtZVxuICAvLyBieSBhZGRpbmcgYSBkYXRhLXR0LXBvbGljeS1zdWZmaXggdG8gdGhlIHNjcmlwdCBlbGVtZW50IHdpdGggdGhlIERPTVB1cmlmeS5cbiAgLy8gUG9saWN5IGNyZWF0aW9uIHdpdGggZHVwbGljYXRlIG5hbWVzIHRocm93cyBpbiBUcnVzdGVkIFR5cGVzLlxuICBsZXQgc3VmZml4ID0gbnVsbDtcbiAgY29uc3QgQVRUUl9OQU1FID0gJ2RhdGEtdHQtcG9saWN5LXN1ZmZpeCc7XG4gIGlmIChwdXJpZnlIb3N0RWxlbWVudCAmJiBwdXJpZnlIb3N0RWxlbWVudC5oYXNBdHRyaWJ1dGUoQVRUUl9OQU1FKSkge1xuICAgIHN1ZmZpeCA9IHB1cmlmeUhvc3RFbGVtZW50LmdldEF0dHJpYnV0ZShBVFRSX05BTUUpO1xuICB9XG4gIGNvbnN0IHBvbGljeU5hbWUgPSAnZG9tcHVyaWZ5JyArIChzdWZmaXggPyAnIycgKyBzdWZmaXggOiAnJyk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHRydXN0ZWRUeXBlcy5jcmVhdGVQb2xpY3kocG9saWN5TmFtZSwge1xuICAgICAgY3JlYXRlSFRNTChodG1sKSB7XG4gICAgICAgIHJldHVybiBodG1sO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVNjcmlwdFVSTChzY3JpcHRVcmwpIHtcbiAgICAgICAgcmV0dXJuIHNjcmlwdFVybDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoXykge1xuICAgIC8vIFBvbGljeSBjcmVhdGlvbiBmYWlsZWQgKG1vc3QgbGlrZWx5IGFub3RoZXIgRE9NUHVyaWZ5IHNjcmlwdCBoYXNcbiAgICAvLyBhbHJlYWR5IHJ1bikuIFNraXAgY3JlYXRpbmcgdGhlIHBvbGljeSwgYXMgdGhpcyB3aWxsIG9ubHkgY2F1c2UgZXJyb3JzXG4gICAgLy8gaWYgVFQgYXJlIGVuZm9yY2VkLlxuICAgIGNvbnNvbGUud2FybignVHJ1c3RlZFR5cGVzIHBvbGljeSAnICsgcG9saWN5TmFtZSArICcgY291bGQgbm90IGJlIGNyZWF0ZWQuJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5jb25zdCBfY3JlYXRlSG9va3NNYXAgPSBmdW5jdGlvbiBfY3JlYXRlSG9va3NNYXAoKSB7XG4gIHJldHVybiB7XG4gICAgYWZ0ZXJTYW5pdGl6ZUF0dHJpYnV0ZXM6IFtdLFxuICAgIGFmdGVyU2FuaXRpemVFbGVtZW50czogW10sXG4gICAgYWZ0ZXJTYW5pdGl6ZVNoYWRvd0RPTTogW10sXG4gICAgYmVmb3JlU2FuaXRpemVBdHRyaWJ1dGVzOiBbXSxcbiAgICBiZWZvcmVTYW5pdGl6ZUVsZW1lbnRzOiBbXSxcbiAgICBiZWZvcmVTYW5pdGl6ZVNoYWRvd0RPTTogW10sXG4gICAgdXBvblNhbml0aXplQXR0cmlidXRlOiBbXSxcbiAgICB1cG9uU2FuaXRpemVFbGVtZW50OiBbXSxcbiAgICB1cG9uU2FuaXRpemVTaGFkb3dOb2RlOiBbXVxuICB9O1xufTtcbmZ1bmN0aW9uIGNyZWF0ZURPTVB1cmlmeSgpIHtcbiAgbGV0IHdpbmRvdyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZ2V0R2xvYmFsKCk7XG4gIGNvbnN0IERPTVB1cmlmeSA9IHJvb3QgPT4gY3JlYXRlRE9NUHVyaWZ5KHJvb3QpO1xuICBET01QdXJpZnkudmVyc2lvbiA9ICczLjMuMSc7XG4gIERPTVB1cmlmeS5yZW1vdmVkID0gW107XG4gIGlmICghd2luZG93IHx8ICF3aW5kb3cuZG9jdW1lbnQgfHwgd2luZG93LmRvY3VtZW50Lm5vZGVUeXBlICE9PSBOT0RFX1RZUEUuZG9jdW1lbnQgfHwgIXdpbmRvdy5FbGVtZW50KSB7XG4gICAgLy8gTm90IHJ1bm5pbmcgaW4gYSBicm93c2VyLCBwcm92aWRlIGEgZmFjdG9yeSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgeW91IGNhbiBwYXNzIHlvdXIgb3duIFdpbmRvd1xuICAgIERPTVB1cmlmeS5pc1N1cHBvcnRlZCA9IGZhbHNlO1xuICAgIHJldHVybiBET01QdXJpZnk7XG4gIH1cbiAgbGV0IHtcbiAgICBkb2N1bWVudFxuICB9ID0gd2luZG93O1xuICBjb25zdCBvcmlnaW5hbERvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IGN1cnJlbnRTY3JpcHQgPSBvcmlnaW5hbERvY3VtZW50LmN1cnJlbnRTY3JpcHQ7XG4gIGNvbnN0IHtcbiAgICBEb2N1bWVudEZyYWdtZW50LFxuICAgIEhUTUxUZW1wbGF0ZUVsZW1lbnQsXG4gICAgTm9kZSxcbiAgICBFbGVtZW50LFxuICAgIE5vZGVGaWx0ZXIsXG4gICAgTmFtZWROb2RlTWFwID0gd2luZG93Lk5hbWVkTm9kZU1hcCB8fCB3aW5kb3cuTW96TmFtZWRBdHRyTWFwLFxuICAgIEhUTUxGb3JtRWxlbWVudCxcbiAgICBET01QYXJzZXIsXG4gICAgdHJ1c3RlZFR5cGVzXG4gIH0gPSB3aW5kb3c7XG4gIGNvbnN0IEVsZW1lbnRQcm90b3R5cGUgPSBFbGVtZW50LnByb3RvdHlwZTtcbiAgY29uc3QgY2xvbmVOb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdjbG9uZU5vZGUnKTtcbiAgY29uc3QgcmVtb3ZlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdyZW1vdmUnKTtcbiAgY29uc3QgZ2V0TmV4dFNpYmxpbmcgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ25leHRTaWJsaW5nJyk7XG4gIGNvbnN0IGdldENoaWxkTm9kZXMgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ2NoaWxkTm9kZXMnKTtcbiAgY29uc3QgZ2V0UGFyZW50Tm9kZSA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAncGFyZW50Tm9kZScpO1xuICAvLyBBcyBwZXIgaXNzdWUgIzQ3LCB0aGUgd2ViLWNvbXBvbmVudHMgcmVnaXN0cnkgaXMgaW5oZXJpdGVkIGJ5IGFcbiAgLy8gbmV3IGRvY3VtZW50IGNyZWF0ZWQgdmlhIGNyZWF0ZUhUTUxEb2N1bWVudC4gQXMgcGVyIHRoZSBzcGVjXG4gIC8vIChodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJjb21wb25lbnRzL3NwZWMvY3VzdG9tLyNjcmVhdGluZy1hbmQtcGFzc2luZy1yZWdpc3RyaWVzKVxuICAvLyBhIG5ldyBlbXB0eSByZWdpc3RyeSBpcyB1c2VkIHdoZW4gY3JlYXRpbmcgYSB0ZW1wbGF0ZSBjb250ZW50cyBvd25lclxuICAvLyBkb2N1bWVudCwgc28gd2UgdXNlIHRoYXQgYXMgb3VyIHBhcmVudCBkb2N1bWVudCB0byBlbnN1cmUgbm90aGluZ1xuICAvLyBpcyBpbmhlcml0ZWQuXG4gIGlmICh0eXBlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICBpZiAodGVtcGxhdGUuY29udGVudCAmJiB0ZW1wbGF0ZS5jb250ZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgIGRvY3VtZW50ID0gdGVtcGxhdGUuY29udGVudC5vd25lckRvY3VtZW50O1xuICAgIH1cbiAgfVxuICBsZXQgdHJ1c3RlZFR5cGVzUG9saWN5O1xuICBsZXQgZW1wdHlIVE1MID0gJyc7XG4gIGNvbnN0IHtcbiAgICBpbXBsZW1lbnRhdGlvbixcbiAgICBjcmVhdGVOb2RlSXRlcmF0b3IsXG4gICAgY3JlYXRlRG9jdW1lbnRGcmFnbWVudCxcbiAgICBnZXRFbGVtZW50c0J5VGFnTmFtZVxuICB9ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IHtcbiAgICBpbXBvcnROb2RlXG4gIH0gPSBvcmlnaW5hbERvY3VtZW50O1xuICBsZXQgaG9va3MgPSBfY3JlYXRlSG9va3NNYXAoKTtcbiAgLyoqXG4gICAqIEV4cG9zZSB3aGV0aGVyIHRoaXMgYnJvd3NlciBzdXBwb3J0cyBydW5uaW5nIHRoZSBmdWxsIERPTVB1cmlmeS5cbiAgICovXG4gIERPTVB1cmlmeS5pc1N1cHBvcnRlZCA9IHR5cGVvZiBlbnRyaWVzID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBnZXRQYXJlbnROb2RlID09PSAnZnVuY3Rpb24nICYmIGltcGxlbWVudGF0aW9uICYmIGltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCAhPT0gdW5kZWZpbmVkO1xuICBjb25zdCB7XG4gICAgTVVTVEFDSEVfRVhQUixcbiAgICBFUkJfRVhQUixcbiAgICBUTVBMSVRfRVhQUixcbiAgICBEQVRBX0FUVFIsXG4gICAgQVJJQV9BVFRSLFxuICAgIElTX1NDUklQVF9PUl9EQVRBLFxuICAgIEFUVFJfV0hJVEVTUEFDRSxcbiAgICBDVVNUT01fRUxFTUVOVFxuICB9ID0gRVhQUkVTU0lPTlM7XG4gIGxldCB7XG4gICAgSVNfQUxMT1dFRF9VUkk6IElTX0FMTE9XRURfVVJJJDFcbiAgfSA9IEVYUFJFU1NJT05TO1xuICAvKipcbiAgICogV2UgY29uc2lkZXIgdGhlIGVsZW1lbnRzIGFuZCBhdHRyaWJ1dGVzIGJlbG93IHRvIGJlIHNhZmUuIElkZWFsbHlcbiAgICogZG9uJ3QgYWRkIGFueSBuZXcgb25lcyBidXQgZmVlbCBmcmVlIHRvIHJlbW92ZSB1bndhbnRlZCBvbmVzLlxuICAgKi9cbiAgLyogYWxsb3dlZCBlbGVtZW50IG5hbWVzICovXG4gIGxldCBBTExPV0VEX1RBR1MgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0FMTE9XRURfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4uaHRtbCQxLCAuLi5zdmckMSwgLi4uc3ZnRmlsdGVycywgLi4ubWF0aE1sJDEsIC4uLnRleHRdKTtcbiAgLyogQWxsb3dlZCBhdHRyaWJ1dGUgbmFtZXMgKi9cbiAgbGV0IEFMTE9XRURfQVRUUiA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9BVFRSID0gYWRkVG9TZXQoe30sIFsuLi5odG1sLCAuLi5zdmcsIC4uLm1hdGhNbCwgLi4ueG1sXSk7XG4gIC8qXG4gICAqIENvbmZpZ3VyZSBob3cgRE9NUHVyaWZ5IHNob3VsZCBoYW5kbGUgY3VzdG9tIGVsZW1lbnRzIGFuZCB0aGVpciBhdHRyaWJ1dGVzIGFzIHdlbGwgYXMgY3VzdG9taXplZCBidWlsdC1pbiBlbGVtZW50cy5cbiAgICogQHByb3BlcnR5IHtSZWdFeHB8RnVuY3Rpb258bnVsbH0gdGFnTmFtZUNoZWNrIG9uZSBvZiBbbnVsbCwgcmVnZXhQYXR0ZXJuLCBwcmVkaWNhdGVdLiBEZWZhdWx0OiBgbnVsbGAgKGRpc2FsbG93IGFueSBjdXN0b20gZWxlbWVudHMpXG4gICAqIEBwcm9wZXJ0eSB7UmVnRXhwfEZ1bmN0aW9ufG51bGx9IGF0dHJpYnV0ZU5hbWVDaGVjayBvbmUgb2YgW251bGwsIHJlZ2V4UGF0dGVybiwgcHJlZGljYXRlXS4gRGVmYXVsdDogYG51bGxgIChkaXNhbGxvdyBhbnkgYXR0cmlidXRlcyBub3Qgb24gdGhlIGFsbG93IGxpc3QpXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzIGFsbG93IGN1c3RvbSBlbGVtZW50cyBkZXJpdmVkIGZyb20gYnVpbHQtaW5zIGlmIHRoZXkgcGFzcyBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2suIERlZmF1bHQ6IGBmYWxzZWAuXG4gICAqL1xuICBsZXQgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgPSBPYmplY3Quc2VhbChjcmVhdGUobnVsbCwge1xuICAgIHRhZ05hbWVDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfSxcbiAgICBhdHRyaWJ1dGVOYW1lQ2hlY2s6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbnVsbFxuICAgIH0sXG4gICAgYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGZhbHNlXG4gICAgfVxuICB9KSk7XG4gIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIHRhZ3MgKG92ZXJyaWRlcyBBTExPV0VEX1RBR1MvQUREX1RBR1MpICovXG4gIGxldCBGT1JCSURfVEFHUyA9IG51bGw7XG4gIC8qIEV4cGxpY2l0bHkgZm9yYmlkZGVuIGF0dHJpYnV0ZXMgKG92ZXJyaWRlcyBBTExPV0VEX0FUVFIvQUREX0FUVFIpICovXG4gIGxldCBGT1JCSURfQVRUUiA9IG51bGw7XG4gIC8qIENvbmZpZyBvYmplY3QgdG8gc3RvcmUgQUREX1RBR1MvQUREX0FUVFIgZnVuY3Rpb25zICh3aGVuIHVzZWQgYXMgZnVuY3Rpb25zKSAqL1xuICBjb25zdCBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HID0gT2JqZWN0LnNlYWwoY3JlYXRlKG51bGwsIHtcbiAgICB0YWdDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfSxcbiAgICBhdHRyaWJ1dGVDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfVxuICB9KSk7XG4gIC8qIERlY2lkZSBpZiBBUklBIGF0dHJpYnV0ZXMgYXJlIG9rYXkgKi9cbiAgbGV0IEFMTE9XX0FSSUFfQVRUUiA9IHRydWU7XG4gIC8qIERlY2lkZSBpZiBjdXN0b20gZGF0YSBhdHRyaWJ1dGVzIGFyZSBva2F5ICovXG4gIGxldCBBTExPV19EQVRBX0FUVFIgPSB0cnVlO1xuICAvKiBEZWNpZGUgaWYgdW5rbm93biBwcm90b2NvbHMgYXJlIG9rYXkgKi9cbiAgbGV0IEFMTE9XX1VOS05PV05fUFJPVE9DT0xTID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBzZWxmLWNsb3NpbmcgdGFncyBpbiBhdHRyaWJ1dGVzIGFyZSBhbGxvd2VkLlxuICAgKiBVc3VhbGx5IHJlbW92ZWQgZHVlIHRvIGEgbVhTUyBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gIGxldCBBTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgPSB0cnVlO1xuICAvKiBPdXRwdXQgc2hvdWxkIGJlIHNhZmUgZm9yIGNvbW1vbiB0ZW1wbGF0ZSBlbmdpbmVzLlxuICAgKiBUaGlzIG1lYW5zLCBET01QdXJpZnkgcmVtb3ZlcyBkYXRhIGF0dHJpYnV0ZXMsIG11c3RhY2hlcyBhbmQgRVJCXG4gICAqL1xuICBsZXQgU0FGRV9GT1JfVEVNUExBVEVTID0gZmFsc2U7XG4gIC8qIE91dHB1dCBzaG91bGQgYmUgc2FmZSBldmVuIGZvciBYTUwgdXNlZCB3aXRoaW4gSFRNTCBhbmQgYWxpa2UuXG4gICAqIFRoaXMgbWVhbnMsIERPTVB1cmlmeSByZW1vdmVzIGNvbW1lbnRzIHdoZW4gY29udGFpbmluZyByaXNreSBjb250ZW50LlxuICAgKi9cbiAgbGV0IFNBRkVfRk9SX1hNTCA9IHRydWU7XG4gIC8qIERlY2lkZSBpZiBkb2N1bWVudCB3aXRoIDxodG1sPi4uLiBzaG91bGQgYmUgcmV0dXJuZWQgKi9cbiAgbGV0IFdIT0xFX0RPQ1VNRU5UID0gZmFsc2U7XG4gIC8qIFRyYWNrIHdoZXRoZXIgY29uZmlnIGlzIGFscmVhZHkgc2V0IG9uIHRoaXMgaW5zdGFuY2Ugb2YgRE9NUHVyaWZ5LiAqL1xuICBsZXQgU0VUX0NPTkZJRyA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgYWxsIGVsZW1lbnRzIChlLmcuIHN0eWxlLCBzY3JpcHQpIG11c3QgYmUgY2hpbGRyZW4gb2ZcbiAgICogZG9jdW1lbnQuYm9keS4gQnkgZGVmYXVsdCwgYnJvd3NlcnMgbWlnaHQgbW92ZSB0aGVtIHRvIGRvY3VtZW50LmhlYWQgKi9cbiAgbGV0IEZPUkNFX0JPRFkgPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIGEgRE9NIGBIVE1MQm9keUVsZW1lbnRgIHNob3VsZCBiZSByZXR1cm5lZCwgaW5zdGVhZCBvZiBhIGh0bWxcbiAgICogc3RyaW5nIChvciBhIFRydXN0ZWRIVE1MIG9iamVjdCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBzdXBwb3J0ZWQpLlxuICAgKiBJZiBgV0hPTEVfRE9DVU1FTlRgIGlzIGVuYWJsZWQgYSBgSFRNTEh0bWxFbGVtZW50YCB3aWxsIGJlIHJldHVybmVkIGluc3RlYWRcbiAgICovXG4gIGxldCBSRVRVUk5fRE9NID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBhIERPTSBgRG9jdW1lbnRGcmFnbWVudGAgc2hvdWxkIGJlIHJldHVybmVkLCBpbnN0ZWFkIG9mIGEgaHRtbFxuICAgKiBzdHJpbmcgIChvciBhIFRydXN0ZWRIVE1MIG9iamVjdCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBzdXBwb3J0ZWQpICovXG4gIGxldCBSRVRVUk5fRE9NX0ZSQUdNRU5UID0gZmFsc2U7XG4gIC8qIFRyeSB0byByZXR1cm4gYSBUcnVzdGVkIFR5cGUgb2JqZWN0IGluc3RlYWQgb2YgYSBzdHJpbmcsIHJldHVybiBhIHN0cmluZyBpblxuICAgKiBjYXNlIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBzdXBwb3J0ZWQgICovXG4gIGxldCBSRVRVUk5fVFJVU1RFRF9UWVBFID0gZmFsc2U7XG4gIC8qIE91dHB1dCBzaG91bGQgYmUgZnJlZSBmcm9tIERPTSBjbG9iYmVyaW5nIGF0dGFja3M/XG4gICAqIFRoaXMgc2FuaXRpemVzIG1hcmt1cHMgbmFtZWQgd2l0aCBjb2xsaWRpbmcsIGNsb2JiZXJhYmxlIGJ1aWx0LWluIERPTSBBUElzLlxuICAgKi9cbiAgbGV0IFNBTklUSVpFX0RPTSA9IHRydWU7XG4gIC8qIEFjaGlldmUgZnVsbCBET00gQ2xvYmJlcmluZyBwcm90ZWN0aW9uIGJ5IGlzb2xhdGluZyB0aGUgbmFtZXNwYWNlIG9mIG5hbWVkXG4gICAqIHByb3BlcnRpZXMgYW5kIEpTIHZhcmlhYmxlcywgbWl0aWdhdGluZyBhdHRhY2tzIHRoYXQgYWJ1c2UgdGhlIEhUTUwvRE9NIHNwZWMgcnVsZXMuXG4gICAqXG4gICAqIEhUTUwvRE9NIHNwZWMgcnVsZXMgdGhhdCBlbmFibGUgRE9NIENsb2JiZXJpbmc6XG4gICAqICAgLSBOYW1lZCBBY2Nlc3Mgb24gV2luZG93ICjCpzcuMy4zKVxuICAgKiAgIC0gRE9NIFRyZWUgQWNjZXNzb3JzICjCpzMuMS41KVxuICAgKiAgIC0gRm9ybSBFbGVtZW50IFBhcmVudC1DaGlsZCBSZWxhdGlvbnMgKMKnNC4xMC4zKVxuICAgKiAgIC0gSWZyYW1lIHNyY2RvYyAvIE5lc3RlZCBXaW5kb3dQcm94aWVzICjCpzQuOC41KVxuICAgKiAgIC0gSFRNTENvbGxlY3Rpb24gKMKnNC4yLjEwLjIpXG4gICAqXG4gICAqIE5hbWVzcGFjZSBpc29sYXRpb24gaXMgaW1wbGVtZW50ZWQgYnkgcHJlZml4aW5nIGBpZGAgYW5kIGBuYW1lYCBhdHRyaWJ1dGVzXG4gICAqIHdpdGggYSBjb25zdGFudCBzdHJpbmcsIGkuZS4sIGB1c2VyLWNvbnRlbnQtYFxuICAgKi9cbiAgbGV0IFNBTklUSVpFX05BTUVEX1BST1BTID0gZmFsc2U7XG4gIGNvbnN0IFNBTklUSVpFX05BTUVEX1BST1BTX1BSRUZJWCA9ICd1c2VyLWNvbnRlbnQtJztcbiAgLyogS2VlcCBlbGVtZW50IGNvbnRlbnQgd2hlbiByZW1vdmluZyBlbGVtZW50PyAqL1xuICBsZXQgS0VFUF9DT05URU5UID0gdHJ1ZTtcbiAgLyogSWYgYSBgTm9kZWAgaXMgcGFzc2VkIHRvIHNhbml0aXplKCksIHRoZW4gcGVyZm9ybXMgc2FuaXRpemF0aW9uIGluLXBsYWNlIGluc3RlYWRcbiAgICogb2YgaW1wb3J0aW5nIGl0IGludG8gYSBuZXcgRG9jdW1lbnQgYW5kIHJldHVybmluZyBhIHNhbml0aXplZCBjb3B5ICovXG4gIGxldCBJTl9QTEFDRSA9IGZhbHNlO1xuICAvKiBBbGxvdyB1c2FnZSBvZiBwcm9maWxlcyBsaWtlIGh0bWwsIHN2ZyBhbmQgbWF0aE1sICovXG4gIGxldCBVU0VfUFJPRklMRVMgPSB7fTtcbiAgLyogVGFncyB0byBpZ25vcmUgY29udGVudCBvZiB3aGVuIEtFRVBfQ09OVEVOVCBpcyB0cnVlICovXG4gIGxldCBGT1JCSURfQ09OVEVOVFMgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0ZPUkJJRF9DT05URU5UUyA9IGFkZFRvU2V0KHt9LCBbJ2Fubm90YXRpb24teG1sJywgJ2F1ZGlvJywgJ2NvbGdyb3VwJywgJ2Rlc2MnLCAnZm9yZWlnbm9iamVjdCcsICdoZWFkJywgJ2lmcmFtZScsICdtYXRoJywgJ21pJywgJ21uJywgJ21vJywgJ21zJywgJ210ZXh0JywgJ25vZW1iZWQnLCAnbm9mcmFtZXMnLCAnbm9zY3JpcHQnLCAncGxhaW50ZXh0JywgJ3NjcmlwdCcsICdzdHlsZScsICdzdmcnLCAndGVtcGxhdGUnLCAndGhlYWQnLCAndGl0bGUnLCAndmlkZW8nLCAneG1wJ10pO1xuICAvKiBUYWdzIHRoYXQgYXJlIHNhZmUgZm9yIGRhdGE6IFVSSXMgKi9cbiAgbGV0IERBVEFfVVJJX1RBR1MgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0RBVEFfVVJJX1RBR1MgPSBhZGRUb1NldCh7fSwgWydhdWRpbycsICd2aWRlbycsICdpbWcnLCAnc291cmNlJywgJ2ltYWdlJywgJ3RyYWNrJ10pO1xuICAvKiBBdHRyaWJ1dGVzIHNhZmUgZm9yIHZhbHVlcyBsaWtlIFwiamF2YXNjcmlwdDpcIiAqL1xuICBsZXQgVVJJX1NBRkVfQVRUUklCVVRFUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUyA9IGFkZFRvU2V0KHt9LCBbJ2FsdCcsICdjbGFzcycsICdmb3InLCAnaWQnLCAnbGFiZWwnLCAnbmFtZScsICdwYXR0ZXJuJywgJ3BsYWNlaG9sZGVyJywgJ3JvbGUnLCAnc3VtbWFyeScsICd0aXRsZScsICd2YWx1ZScsICdzdHlsZScsICd4bWxucyddKTtcbiAgY29uc3QgTUFUSE1MX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MJztcbiAgY29uc3QgU1ZHX05BTUVTUEFDRSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gIGNvbnN0IEhUTUxfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwnO1xuICAvKiBEb2N1bWVudCBuYW1lc3BhY2UgKi9cbiAgbGV0IE5BTUVTUEFDRSA9IEhUTUxfTkFNRVNQQUNFO1xuICBsZXQgSVNfRU1QVFlfSU5QVVQgPSBmYWxzZTtcbiAgLyogQWxsb3dlZCBYSFRNTCtYTUwgbmFtZXNwYWNlcyAqL1xuICBsZXQgQUxMT1dFRF9OQU1FU1BBQ0VTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9BTExPV0VEX05BTUVTUEFDRVMgPSBhZGRUb1NldCh7fSwgW01BVEhNTF9OQU1FU1BBQ0UsIFNWR19OQU1FU1BBQ0UsIEhUTUxfTkFNRVNQQUNFXSwgc3RyaW5nVG9TdHJpbmcpO1xuICBsZXQgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnbWknLCAnbW8nLCAnbW4nLCAnbXMnLCAnbXRleHQnXSk7XG4gIGxldCBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGFkZFRvU2V0KHt9LCBbJ2Fubm90YXRpb24teG1sJ10pO1xuICAvLyBDZXJ0YWluIGVsZW1lbnRzIGFyZSBhbGxvd2VkIGluIGJvdGggU1ZHIGFuZCBIVE1MXG4gIC8vIG5hbWVzcGFjZS4gV2UgbmVlZCB0byBzcGVjaWZ5IHRoZW0gZXhwbGljaXRseVxuICAvLyBzbyB0aGF0IHRoZXkgZG9uJ3QgZ2V0IGVycm9uZW91c2x5IGRlbGV0ZWQgZnJvbVxuICAvLyBIVE1MIG5hbWVzcGFjZS5cbiAgY29uc3QgQ09NTU9OX1NWR19BTkRfSFRNTF9FTEVNRU5UUyA9IGFkZFRvU2V0KHt9LCBbJ3RpdGxlJywgJ3N0eWxlJywgJ2ZvbnQnLCAnYScsICdzY3JpcHQnXSk7XG4gIC8qIFBhcnNpbmcgb2Ygc3RyaWN0IFhIVE1MIGRvY3VtZW50cyAqL1xuICBsZXQgUEFSU0VSX01FRElBX1RZUEUgPSBudWxsO1xuICBjb25zdCBTVVBQT1JURURfUEFSU0VSX01FRElBX1RZUEVTID0gWydhcHBsaWNhdGlvbi94aHRtbCt4bWwnLCAndGV4dC9odG1sJ107XG4gIGNvbnN0IERFRkFVTFRfUEFSU0VSX01FRElBX1RZUEUgPSAndGV4dC9odG1sJztcbiAgbGV0IHRyYW5zZm9ybUNhc2VGdW5jID0gbnVsbDtcbiAgLyogS2VlcCBhIHJlZmVyZW5jZSB0byBjb25maWcgdG8gcGFzcyB0byBob29rcyAqL1xuICBsZXQgQ09ORklHID0gbnVsbDtcbiAgLyogSWRlYWxseSwgZG8gbm90IHRvdWNoIGFueXRoaW5nIGJlbG93IHRoaXMgbGluZSAqL1xuICAvKiBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fICovXG4gIGNvbnN0IGZvcm1FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICBjb25zdCBpc1JlZ2V4T3JGdW5jdGlvbiA9IGZ1bmN0aW9uIGlzUmVnZXhPckZ1bmN0aW9uKHRlc3RWYWx1ZSkge1xuICAgIHJldHVybiB0ZXN0VmFsdWUgaW5zdGFuY2VvZiBSZWdFeHAgfHwgdGVzdFZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb247XG4gIH07XG4gIC8qKlxuICAgKiBfcGFyc2VDb25maWdcbiAgICpcbiAgICogQHBhcmFtIGNmZyBvcHRpb25hbCBjb25maWcgbGl0ZXJhbFxuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgY29uc3QgX3BhcnNlQ29uZmlnID0gZnVuY3Rpb24gX3BhcnNlQ29uZmlnKCkge1xuICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIGlmIChDT05GSUcgJiYgQ09ORklHID09PSBjZmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLyogU2hpZWxkIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZyb20gdGFtcGVyaW5nICovXG4gICAgaWYgKCFjZmcgfHwgdHlwZW9mIGNmZyAhPT0gJ29iamVjdCcpIHtcbiAgICAgIGNmZyA9IHt9O1xuICAgIH1cbiAgICAvKiBTaGllbGQgY29uZmlndXJhdGlvbiBvYmplY3QgZnJvbSBwcm90b3R5cGUgcG9sbHV0aW9uICovXG4gICAgY2ZnID0gY2xvbmUoY2ZnKTtcbiAgICBQQVJTRVJfTUVESUFfVFlQRSA9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWluY2x1ZGVzXG4gICAgU1VQUE9SVEVEX1BBUlNFUl9NRURJQV9UWVBFUy5pbmRleE9mKGNmZy5QQVJTRVJfTUVESUFfVFlQRSkgPT09IC0xID8gREVGQVVMVF9QQVJTRVJfTUVESUFfVFlQRSA6IGNmZy5QQVJTRVJfTUVESUFfVFlQRTtcbiAgICAvLyBIVE1MIHRhZ3MgYW5kIGF0dHJpYnV0ZXMgYXJlIG5vdCBjYXNlLXNlbnNpdGl2ZSwgY29udmVydGluZyB0byBsb3dlcmNhc2UuIEtlZXBpbmcgWEhUTUwgYXMgaXMuXG4gICAgdHJhbnNmb3JtQ2FzZUZ1bmMgPSBQQVJTRVJfTUVESUFfVFlQRSA9PT0gJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcgPyBzdHJpbmdUb1N0cmluZyA6IHN0cmluZ1RvTG93ZXJDYXNlO1xuICAgIC8qIFNldCBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKi9cbiAgICBBTExPV0VEX1RBR1MgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX1RBR1MnKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0FMTE9XRURfVEFHUztcbiAgICBBTExPV0VEX0FUVFIgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX0FUVFInKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0FMTE9XRURfQVRUUjtcbiAgICBBTExPV0VEX05BTUVTUEFDRVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBTExPV0VEX05BTUVTUEFDRVMnKSA/IGFkZFRvU2V0KHt9LCBjZmcuQUxMT1dFRF9OQU1FU1BBQ0VTLCBzdHJpbmdUb1N0cmluZykgOiBERUZBVUxUX0FMTE9XRURfTkFNRVNQQUNFUztcbiAgICBVUklfU0FGRV9BVFRSSUJVVEVTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnQUREX1VSSV9TQUZFX0FUVFInKSA/IGFkZFRvU2V0KGNsb25lKERFRkFVTFRfVVJJX1NBRkVfQVRUUklCVVRFUyksIGNmZy5BRERfVVJJX1NBRkVfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTO1xuICAgIERBVEFfVVJJX1RBR1MgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBRERfREFUQV9VUklfVEFHUycpID8gYWRkVG9TZXQoY2xvbmUoREVGQVVMVF9EQVRBX1VSSV9UQUdTKSwgY2ZnLkFERF9EQVRBX1VSSV9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0RBVEFfVVJJX1RBR1M7XG4gICAgRk9SQklEX0NPTlRFTlRTID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX0NPTlRFTlRTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogREVGQVVMVF9GT1JCSURfQ09OVEVOVFM7XG4gICAgRk9SQklEX1RBR1MgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdGT1JCSURfVEFHUycpID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfVEFHUywgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogY2xvbmUoe30pO1xuICAgIEZPUkJJRF9BVFRSID0gb2JqZWN0SGFzT3duUHJvcGVydHkoY2ZnLCAnRk9SQklEX0FUVFInKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IGNsb25lKHt9KTtcbiAgICBVU0VfUFJPRklMRVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdVU0VfUFJPRklMRVMnKSA/IGNmZy5VU0VfUFJPRklMRVMgOiBmYWxzZTtcbiAgICBBTExPV19BUklBX0FUVFIgPSBjZmcuQUxMT1dfQVJJQV9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgQUxMT1dfREFUQV9BVFRSID0gY2ZnLkFMTE9XX0RBVEFfQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIEFMTE9XX1VOS05PV05fUFJPVE9DT0xTID0gY2ZnLkFMTE9XX1VOS05PV05fUFJPVE9DT0xTIHx8IGZhbHNlOyAvLyBEZWZhdWx0IGZhbHNlXG4gICAgQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSID0gY2ZnLkFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdHJ1ZVxuICAgIFNBRkVfRk9SX1RFTVBMQVRFUyA9IGNmZy5TQUZFX0ZPUl9URU1QTEFURVMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBTQUZFX0ZPUl9YTUwgPSBjZmcuU0FGRV9GT1JfWE1MICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgV0hPTEVfRE9DVU1FTlQgPSBjZmcuV0hPTEVfRE9DVU1FTlQgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBSRVRVUk5fRE9NID0gY2ZnLlJFVFVSTl9ET00gfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBSRVRVUk5fRE9NX0ZSQUdNRU5UID0gY2ZnLlJFVFVSTl9ET01fRlJBR01FTlQgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBSRVRVUk5fVFJVU1RFRF9UWVBFID0gY2ZnLlJFVFVSTl9UUlVTVEVEX1RZUEUgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBGT1JDRV9CT0RZID0gY2ZnLkZPUkNFX0JPRFkgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBTQU5JVElaRV9ET00gPSBjZmcuU0FOSVRJWkVfRE9NICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgU0FOSVRJWkVfTkFNRURfUFJPUFMgPSBjZmcuU0FOSVRJWkVfTkFNRURfUFJPUFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBLRUVQX0NPTlRFTlQgPSBjZmcuS0VFUF9DT05URU5UICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgSU5fUExBQ0UgPSBjZmcuSU5fUExBQ0UgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBJU19BTExPV0VEX1VSSSQxID0gY2ZnLkFMTE9XRURfVVJJX1JFR0VYUCB8fCBJU19BTExPV0VEX1VSSTtcbiAgICBOQU1FU1BBQ0UgPSBjZmcuTkFNRVNQQUNFIHx8IEhUTUxfTkFNRVNQQUNFO1xuICAgIE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyA9IGNmZy5NQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgfHwgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTO1xuICAgIEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gY2ZnLkhUTUxfSU5URUdSQVRJT05fUE9JTlRTIHx8IEhUTUxfSU5URUdSQVRJT05fUE9JTlRTO1xuICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HIHx8IHt9O1xuICAgIGlmIChjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgJiYgaXNSZWdleE9yRnVuY3Rpb24oY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaykpIHtcbiAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2s7XG4gICAgfVxuICAgIGlmIChjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgJiYgaXNSZWdleE9yRnVuY3Rpb24oY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjaykpIHtcbiAgICAgIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayA9IGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2s7XG4gICAgfVxuICAgIGlmIChjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgJiYgdHlwZW9mIGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgPT09ICdib29sZWFuJykge1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cztcbiAgICB9XG4gICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgQUxMT1dfREFUQV9BVFRSID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICBSRVRVUk5fRE9NID0gdHJ1ZTtcbiAgICB9XG4gICAgLyogUGFyc2UgcHJvZmlsZSBpbmZvICovXG4gICAgaWYgKFVTRV9QUk9GSUxFUykge1xuICAgICAgQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIHRleHQpO1xuICAgICAgQUxMT1dFRF9BVFRSID0gW107XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLmh0bWwgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBodG1sJDEpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIGh0bWwpO1xuICAgICAgfVxuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5zdmcgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBzdmckMSk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgfVxuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5zdmdGaWx0ZXJzID09PSB0cnVlKSB7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgc3ZnRmlsdGVycyk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgc3ZnKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgfVxuICAgICAgaWYgKFVTRV9QUk9GSUxFUy5tYXRoTWwgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBtYXRoTWwkMSk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgbWF0aE1sKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCB4bWwpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBNZXJnZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgKi9cbiAgICBpZiAoY2ZnLkFERF9UQUdTKSB7XG4gICAgICBpZiAodHlwZW9mIGNmZy5BRERfVEFHUyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLnRhZ0NoZWNrID0gY2ZnLkFERF9UQUdTO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKEFMTE9XRURfVEFHUyA9PT0gREVGQVVMVF9BTExPV0VEX1RBR1MpIHtcbiAgICAgICAgICBBTExPV0VEX1RBR1MgPSBjbG9uZShBTExPV0VEX1RBR1MpO1xuICAgICAgICB9XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfVEFHUywgY2ZnLkFERF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjZmcuQUREX0FUVFIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2ZnLkFERF9BVFRSID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIEVYVFJBX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlQ2hlY2sgPSBjZmcuQUREX0FUVFI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoQUxMT1dFRF9BVFRSID09PSBERUZBVUxUX0FMTE9XRURfQVRUUikge1xuICAgICAgICAgIEFMTE9XRURfQVRUUiA9IGNsb25lKEFMTE9XRURfQVRUUik7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBjZmcuQUREX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNmZy5BRERfVVJJX1NBRkVfQVRUUikge1xuICAgICAgYWRkVG9TZXQoVVJJX1NBRkVfQVRUUklCVVRFUywgY2ZnLkFERF9VUklfU0FGRV9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgfVxuICAgIGlmIChjZmcuRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICBpZiAoRk9SQklEX0NPTlRFTlRTID09PSBERUZBVUxUX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgICBGT1JCSURfQ09OVEVOVFMgPSBjbG9uZShGT1JCSURfQ09OVEVOVFMpO1xuICAgICAgfVxuICAgICAgYWRkVG9TZXQoRk9SQklEX0NPTlRFTlRTLCBjZmcuRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYyk7XG4gICAgfVxuICAgIGlmIChjZmcuQUREX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgaWYgKEZPUkJJRF9DT05URU5UUyA9PT0gREVGQVVMVF9GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgICAgRk9SQklEX0NPTlRFTlRTID0gY2xvbmUoRk9SQklEX0NPTlRFTlRTKTtcbiAgICAgIH1cbiAgICAgIGFkZFRvU2V0KEZPUkJJRF9DT05URU5UUywgY2ZnLkFERF9GT1JCSURfQ09OVEVOVFMsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICB9XG4gICAgLyogQWRkICN0ZXh0IGluIGNhc2UgS0VFUF9DT05URU5UIGlzIHNldCB0byB0cnVlICovXG4gICAgaWYgKEtFRVBfQ09OVEVOVCkge1xuICAgICAgQUxMT1dFRF9UQUdTWycjdGV4dCddID0gdHJ1ZTtcbiAgICB9XG4gICAgLyogQWRkIGh0bWwsIGhlYWQgYW5kIGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgV0hPTEVfRE9DVU1FTlQgaXMgdHJ1ZSAqL1xuICAgIGlmIChXSE9MRV9ET0NVTUVOVCkge1xuICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBbJ2h0bWwnLCAnaGVhZCcsICdib2R5J10pO1xuICAgIH1cbiAgICAvKiBBZGQgdGJvZHkgdG8gQUxMT1dFRF9UQUdTIGluIGNhc2UgdGFibGVzIGFyZSBwZXJtaXR0ZWQsIHNlZSAjMjg2LCAjMzY1ICovXG4gICAgaWYgKEFMTE9XRURfVEFHUy50YWJsZSkge1xuICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBbJ3Rib2R5J10pO1xuICAgICAgZGVsZXRlIEZPUkJJRF9UQUdTLnRib2R5O1xuICAgIH1cbiAgICBpZiAoY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZKSB7XG4gICAgICBpZiAodHlwZW9mIGNmZy5UUlVTVEVEX1RZUEVTX1BPTElDWS5jcmVhdGVIVE1MICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnVFJVU1RFRF9UWVBFU19QT0xJQ1kgY29uZmlndXJhdGlvbiBvcHRpb24gbXVzdCBwcm92aWRlIGEgXCJjcmVhdGVIVE1MXCIgaG9vay4nKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZLmNyZWF0ZVNjcmlwdFVSTCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ1RSVVNURURfVFlQRVNfUE9MSUNZIGNvbmZpZ3VyYXRpb24gb3B0aW9uIG11c3QgcHJvdmlkZSBhIFwiY3JlYXRlU2NyaXB0VVJMXCIgaG9vay4nKTtcbiAgICAgIH1cbiAgICAgIC8vIE92ZXJ3cml0ZSBleGlzdGluZyBUcnVzdGVkVHlwZXMgcG9saWN5LlxuICAgICAgdHJ1c3RlZFR5cGVzUG9saWN5ID0gY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZO1xuICAgICAgLy8gU2lnbiBsb2NhbCB2YXJpYWJsZXMgcmVxdWlyZWQgYnkgYHNhbml0aXplYC5cbiAgICAgIGVtcHR5SFRNTCA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKCcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVW5pbml0aWFsaXplZCBwb2xpY3ksIGF0dGVtcHQgdG8gaW5pdGlhbGl6ZSB0aGUgaW50ZXJuYWwgZG9tcHVyaWZ5IHBvbGljeS5cbiAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0cnVzdGVkVHlwZXNQb2xpY3kgPSBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5KHRydXN0ZWRUeXBlcywgY3VycmVudFNjcmlwdCk7XG4gICAgICB9XG4gICAgICAvLyBJZiBjcmVhdGluZyB0aGUgaW50ZXJuYWwgcG9saWN5IHN1Y2NlZWRlZCBzaWduIGludGVybmFsIHZhcmlhYmxlcy5cbiAgICAgIGlmICh0cnVzdGVkVHlwZXNQb2xpY3kgIT09IG51bGwgJiYgdHlwZW9mIGVtcHR5SFRNTCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZW1wdHlIVE1MID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoJycpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBQcmV2ZW50IGZ1cnRoZXIgbWFuaXB1bGF0aW9uIG9mIGNvbmZpZ3VyYXRpb24uXG4gICAgLy8gTm90IGF2YWlsYWJsZSBpbiBJRTgsIFNhZmFyaSA1LCBldGMuXG4gICAgaWYgKGZyZWV6ZSkge1xuICAgICAgZnJlZXplKGNmZyk7XG4gICAgfVxuICAgIENPTkZJRyA9IGNmZztcbiAgfTtcbiAgLyogS2VlcCB0cmFjayBvZiBhbGwgcG9zc2libGUgU1ZHIGFuZCBNYXRoTUwgdGFnc1xuICAgKiBzbyB0aGF0IHdlIGNhbiBwZXJmb3JtIHRoZSBuYW1lc3BhY2UgY2hlY2tzXG4gICAqIGNvcnJlY3RseS4gKi9cbiAgY29uc3QgQUxMX1NWR19UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5zdmckMSwgLi4uc3ZnRmlsdGVycywgLi4uc3ZnRGlzYWxsb3dlZF0pO1xuICBjb25zdCBBTExfTUFUSE1MX1RBR1MgPSBhZGRUb1NldCh7fSwgWy4uLm1hdGhNbCQxLCAuLi5tYXRoTWxEaXNhbGxvd2VkXSk7XG4gIC8qKlxuICAgKiBAcGFyYW0gZWxlbWVudCBhIERPTSBlbGVtZW50IHdob3NlIG5hbWVzcGFjZSBpcyBiZWluZyBjaGVja2VkXG4gICAqIEByZXR1cm5zIFJldHVybiBmYWxzZSBpZiB0aGUgZWxlbWVudCBoYXMgYVxuICAgKiAgbmFtZXNwYWNlIHRoYXQgYSBzcGVjLWNvbXBsaWFudCBwYXJzZXIgd291bGQgbmV2ZXJcbiAgICogIHJldHVybi4gUmV0dXJuIHRydWUgb3RoZXJ3aXNlLlxuICAgKi9cbiAgY29uc3QgX2NoZWNrVmFsaWROYW1lc3BhY2UgPSBmdW5jdGlvbiBfY2hlY2tWYWxpZE5hbWVzcGFjZShlbGVtZW50KSB7XG4gICAgbGV0IHBhcmVudCA9IGdldFBhcmVudE5vZGUoZWxlbWVudCk7XG4gICAgLy8gSW4gSlNET00sIGlmIHdlJ3JlIGluc2lkZSBzaGFkb3cgRE9NLCB0aGVuIHBhcmVudE5vZGVcbiAgICAvLyBjYW4gYmUgbnVsbC4gV2UganVzdCBzaW11bGF0ZSBwYXJlbnQgaW4gdGhpcyBjYXNlLlxuICAgIGlmICghcGFyZW50IHx8ICFwYXJlbnQudGFnTmFtZSkge1xuICAgICAgcGFyZW50ID0ge1xuICAgICAgICBuYW1lc3BhY2VVUkk6IE5BTUVTUEFDRSxcbiAgICAgICAgdGFnTmFtZTogJ3RlbXBsYXRlJ1xuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdGFnTmFtZSA9IHN0cmluZ1RvTG93ZXJDYXNlKGVsZW1lbnQudGFnTmFtZSk7XG4gICAgY29uc3QgcGFyZW50VGFnTmFtZSA9IHN0cmluZ1RvTG93ZXJDYXNlKHBhcmVudC50YWdOYW1lKTtcbiAgICBpZiAoIUFMTE9XRURfTkFNRVNQQUNFU1tlbGVtZW50Lm5hbWVzcGFjZVVSSV0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQubmFtZXNwYWNlVVJJID09PSBTVkdfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gSFRNTCBuYW1lc3BhY2UgdG8gU1ZHXG4gICAgICAvLyBpcyB2aWEgPHN2Zz4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgIC8vIGl0IHNob3VsZCBiZSBraWxsZWQuXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdzdmcnO1xuICAgICAgfVxuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIE1hdGhNTCB0byBTVkcgaXMgdmlhYFxuICAgICAgLy8gc3ZnIGlmIHBhcmVudCBpcyBlaXRoZXIgPGFubm90YXRpb24teG1sPiBvciBNYXRoTUxcbiAgICAgIC8vIHRleHQgaW50ZWdyYXRpb24gcG9pbnRzLlxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdzdmcnICYmIChwYXJlbnRUYWdOYW1lID09PSAnYW5ub3RhdGlvbi14bWwnIHx8IE1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSk7XG4gICAgICB9XG4gICAgICAvLyBXZSBvbmx5IGFsbG93IGVsZW1lbnRzIHRoYXQgYXJlIGRlZmluZWQgaW4gU1ZHXG4gICAgICAvLyBzcGVjLiBBbGwgb3RoZXJzIGFyZSBkaXNhbGxvd2VkIGluIFNWRyBuYW1lc3BhY2UuXG4gICAgICByZXR1cm4gQm9vbGVhbihBTExfU1ZHX1RBR1NbdGFnTmFtZV0pO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBIVE1MIG5hbWVzcGFjZSB0byBNYXRoTUxcbiAgICAgIC8vIGlzIHZpYSA8bWF0aD4uIElmIGl0IGhhcHBlbnMgdmlhIGFueSBvdGhlciB0YWcsIHRoZW5cbiAgICAgIC8vIGl0IHNob3VsZCBiZSBraWxsZWQuXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJztcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gTWF0aE1MIGlzIHZpYVxuICAgICAgLy8gPG1hdGg+IGFuZCBIVE1MIGludGVncmF0aW9uIHBvaW50c1xuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UpIHtcbiAgICAgICAgcmV0dXJuIHRhZ05hbWUgPT09ICdtYXRoJyAmJiBIVE1MX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIG9ubHkgYWxsb3cgZWxlbWVudHMgdGhhdCBhcmUgZGVmaW5lZCBpbiBNYXRoTUxcbiAgICAgIC8vIHNwZWMuIEFsbCBvdGhlcnMgYXJlIGRpc2FsbG93ZWQgaW4gTWF0aE1MIG5hbWVzcGFjZS5cbiAgICAgIHJldHVybiBCb29sZWFuKEFMTF9NQVRITUxfVEFHU1t0YWdOYW1lXSk7XG4gICAgfVxuICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBTVkcgdG8gSFRNTCBpcyB2aWFcbiAgICAgIC8vIEhUTUwgaW50ZWdyYXRpb24gcG9pbnRzLCBhbmQgZnJvbSBNYXRoTUwgdG8gSFRNTFxuICAgICAgLy8gaXMgdmlhIE1hdGhNTCB0ZXh0IGludGVncmF0aW9uIHBvaW50c1xuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UgJiYgIUhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBNQVRITUxfTkFNRVNQQUNFICYmICFNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gV2UgZGlzYWxsb3cgdGFncyB0aGF0IGFyZSBzcGVjaWZpYyBmb3IgTWF0aE1MXG4gICAgICAvLyBvciBTVkcgYW5kIHNob3VsZCBuZXZlciBhcHBlYXIgaW4gSFRNTCBuYW1lc3BhY2VcbiAgICAgIHJldHVybiAhQUxMX01BVEhNTF9UQUdTW3RhZ05hbWVdICYmIChDT01NT05fU1ZHX0FORF9IVE1MX0VMRU1FTlRTW3RhZ05hbWVdIHx8ICFBTExfU1ZHX1RBR1NbdGFnTmFtZV0pO1xuICAgIH1cbiAgICAvLyBGb3IgWEhUTUwgYW5kIFhNTCBkb2N1bWVudHMgdGhhdCBzdXBwb3J0IGN1c3RvbSBuYW1lc3BhY2VzXG4gICAgaWYgKFBBUlNFUl9NRURJQV9UWVBFID09PSAnYXBwbGljYXRpb24veGh0bWwreG1sJyAmJiBBTExPV0VEX05BTUVTUEFDRVNbZWxlbWVudC5uYW1lc3BhY2VVUkldKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gVGhlIGNvZGUgc2hvdWxkIG5ldmVyIHJlYWNoIHRoaXMgcGxhY2UgKHRoaXMgbWVhbnNcbiAgICAvLyB0aGF0IHRoZSBlbGVtZW50IHNvbWVob3cgZ290IG5hbWVzcGFjZSB0aGF0IGlzIG5vdFxuICAgIC8vIEhUTUwsIFNWRywgTWF0aE1MIG9yIGFsbG93ZWQgdmlhIEFMTE9XRURfTkFNRVNQQUNFUykuXG4gICAgLy8gUmV0dXJuIGZhbHNlIGp1c3QgaW4gY2FzZS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIC8qKlxuICAgKiBfZm9yY2VSZW1vdmVcbiAgICpcbiAgICogQHBhcmFtIG5vZGUgYSBET00gbm9kZVxuICAgKi9cbiAgY29uc3QgX2ZvcmNlUmVtb3ZlID0gZnVuY3Rpb24gX2ZvcmNlUmVtb3ZlKG5vZGUpIHtcbiAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgIGVsZW1lbnQ6IG5vZGVcbiAgICB9KTtcbiAgICB0cnkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLXJlbW92ZVxuICAgICAgZ2V0UGFyZW50Tm9kZShub2RlKS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICByZW1vdmUobm9kZSk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogX3JlbW92ZUF0dHJpYnV0ZVxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBhbiBBdHRyaWJ1dGUgbmFtZVxuICAgKiBAcGFyYW0gZWxlbWVudCBhIERPTSBub2RlXG4gICAqL1xuICBjb25zdCBfcmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24gX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBlbGVtZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgICBhdHRyaWJ1dGU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlTm9kZShuYW1lKSxcbiAgICAgICAgZnJvbTogZWxlbWVudFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogbnVsbCxcbiAgICAgICAgZnJvbTogZWxlbWVudFxuICAgICAgfSk7XG4gICAgfVxuICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIC8vIFdlIHZvaWQgYXR0cmlidXRlIHZhbHVlcyBmb3IgdW5yZW1vdmFibGUgXCJpc1wiIGF0dHJpYnV0ZXNcbiAgICBpZiAobmFtZSA9PT0gJ2lzJykge1xuICAgICAgaWYgKFJFVFVSTl9ET00gfHwgUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIF9mb3JjZVJlbW92ZShlbGVtZW50KTtcbiAgICAgICAgfSBjYXRjaCAoXykge31cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgJycpO1xuICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIF9pbml0RG9jdW1lbnRcbiAgICpcbiAgICogQHBhcmFtIGRpcnR5IC0gYSBzdHJpbmcgb2YgZGlydHkgbWFya3VwXG4gICAqIEByZXR1cm4gYSBET00sIGZpbGxlZCB3aXRoIHRoZSBkaXJ0eSBtYXJrdXBcbiAgICovXG4gIGNvbnN0IF9pbml0RG9jdW1lbnQgPSBmdW5jdGlvbiBfaW5pdERvY3VtZW50KGRpcnR5KSB7XG4gICAgLyogQ3JlYXRlIGEgSFRNTCBkb2N1bWVudCAqL1xuICAgIGxldCBkb2MgPSBudWxsO1xuICAgIGxldCBsZWFkaW5nV2hpdGVzcGFjZSA9IG51bGw7XG4gICAgaWYgKEZPUkNFX0JPRFkpIHtcbiAgICAgIGRpcnR5ID0gJzxyZW1vdmU+PC9yZW1vdmU+JyArIGRpcnR5O1xuICAgIH0gZWxzZSB7XG4gICAgICAvKiBJZiBGT1JDRV9CT0RZIGlzbid0IHVzZWQsIGxlYWRpbmcgd2hpdGVzcGFjZSBuZWVkcyB0byBiZSBwcmVzZXJ2ZWQgbWFudWFsbHkgKi9cbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBzdHJpbmdNYXRjaChkaXJ0eSwgL15bXFxyXFxuXFx0IF0rLyk7XG4gICAgICBsZWFkaW5nV2hpdGVzcGFjZSA9IG1hdGNoZXMgJiYgbWF0Y2hlc1swXTtcbiAgICB9XG4gICAgaWYgKFBBUlNFUl9NRURJQV9UWVBFID09PSAnYXBwbGljYXRpb24veGh0bWwreG1sJyAmJiBOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICAvLyBSb290IG9mIFhIVE1MIGRvYyBtdXN0IGNvbnRhaW4geG1sbnMgZGVjbGFyYXRpb24gKHNlZSBodHRwczovL3d3dy53My5vcmcvVFIveGh0bWwxL25vcm1hdGl2ZS5odG1sI3N0cmljdClcbiAgICAgIGRpcnR5ID0gJzxodG1sIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiPjxoZWFkPjwvaGVhZD48Ym9keT4nICsgZGlydHkgKyAnPC9ib2R5PjwvaHRtbD4nO1xuICAgIH1cbiAgICBjb25zdCBkaXJ0eVBheWxvYWQgPSB0cnVzdGVkVHlwZXNQb2xpY3kgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChkaXJ0eSkgOiBkaXJ0eTtcbiAgICAvKlxuICAgICAqIFVzZSB0aGUgRE9NUGFyc2VyIEFQSSBieSBkZWZhdWx0LCBmYWxsYmFjayBsYXRlciBpZiBuZWVkcyBiZVxuICAgICAqIERPTVBhcnNlciBub3Qgd29yayBmb3Igc3ZnIHdoZW4gaGFzIG11bHRpcGxlIHJvb3QgZWxlbWVudC5cbiAgICAgKi9cbiAgICBpZiAoTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhkaXJ0eVBheWxvYWQsIFBBUlNFUl9NRURJQV9UWVBFKTtcbiAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgfVxuICAgIC8qIFVzZSBjcmVhdGVIVE1MRG9jdW1lbnQgaW4gY2FzZSBET01QYXJzZXIgaXMgbm90IGF2YWlsYWJsZSAqL1xuICAgIGlmICghZG9jIHx8ICFkb2MuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICBkb2MgPSBpbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudChOQU1FU1BBQ0UsICd0ZW1wbGF0ZScsIG51bGwpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZG9jLmRvY3VtZW50RWxlbWVudC5pbm5lckhUTUwgPSBJU19FTVBUWV9JTlBVVCA/IGVtcHR5SFRNTCA6IGRpcnR5UGF5bG9hZDtcbiAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgLy8gU3ludGF4IGVycm9yIGlmIGRpcnR5UGF5bG9hZCBpcyBpbnZhbGlkIHhtbFxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBib2R5ID0gZG9jLmJvZHkgfHwgZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICBpZiAoZGlydHkgJiYgbGVhZGluZ1doaXRlc3BhY2UpIHtcbiAgICAgIGJvZHkuaW5zZXJ0QmVmb3JlKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGxlYWRpbmdXaGl0ZXNwYWNlKSwgYm9keS5jaGlsZE5vZGVzWzBdIHx8IG51bGwpO1xuICAgIH1cbiAgICAvKiBXb3JrIG9uIHdob2xlIGRvY3VtZW50IG9yIGp1c3QgaXRzIGJvZHkgKi9cbiAgICBpZiAoTkFNRVNQQUNFID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgcmV0dXJuIGdldEVsZW1lbnRzQnlUYWdOYW1lLmNhbGwoZG9jLCBXSE9MRV9ET0NVTUVOVCA/ICdodG1sJyA6ICdib2R5JylbMF07XG4gICAgfVxuICAgIHJldHVybiBXSE9MRV9ET0NVTUVOVCA/IGRvYy5kb2N1bWVudEVsZW1lbnQgOiBib2R5O1xuICB9O1xuICAvKipcbiAgICogQ3JlYXRlcyBhIE5vZGVJdGVyYXRvciBvYmplY3QgdGhhdCB5b3UgY2FuIHVzZSB0byB0cmF2ZXJzZSBmaWx0ZXJlZCBsaXN0cyBvZiBub2RlcyBvciBlbGVtZW50cyBpbiBhIGRvY3VtZW50LlxuICAgKlxuICAgKiBAcGFyYW0gcm9vdCBUaGUgcm9vdCBlbGVtZW50IG9yIG5vZGUgdG8gc3RhcnQgdHJhdmVyc2luZyBvbi5cbiAgICogQHJldHVybiBUaGUgY3JlYXRlZCBOb2RlSXRlcmF0b3JcbiAgICovXG4gIGNvbnN0IF9jcmVhdGVOb2RlSXRlcmF0b3IgPSBmdW5jdGlvbiBfY3JlYXRlTm9kZUl0ZXJhdG9yKHJvb3QpIHtcbiAgICByZXR1cm4gY3JlYXRlTm9kZUl0ZXJhdG9yLmNhbGwocm9vdC5vd25lckRvY3VtZW50IHx8IHJvb3QsIHJvb3QsXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2VcbiAgICBOb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCB8IE5vZGVGaWx0ZXIuU0hPV19DT01NRU5UIHwgTm9kZUZpbHRlci5TSE9XX1RFWFQgfCBOb2RlRmlsdGVyLlNIT1dfUFJPQ0VTU0lOR19JTlNUUlVDVElPTiB8IE5vZGVGaWx0ZXIuU0hPV19DREFUQV9TRUNUSU9OLCBudWxsKTtcbiAgfTtcbiAgLyoqXG4gICAqIF9pc0Nsb2JiZXJlZFxuICAgKlxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIGNoZWNrIGZvciBjbG9iYmVyaW5nIGF0dGFja3NcbiAgICogQHJldHVybiB0cnVlIGlmIGNsb2JiZXJlZCwgZmFsc2UgaWYgc2FmZVxuICAgKi9cbiAgY29uc3QgX2lzQ2xvYmJlcmVkID0gZnVuY3Rpb24gX2lzQ2xvYmJlcmVkKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCAmJiAodHlwZW9mIGVsZW1lbnQubm9kZU5hbWUgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50LnRleHRDb250ZW50ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWxlbWVudC5yZW1vdmVDaGlsZCAhPT0gJ2Z1bmN0aW9uJyB8fCAhKGVsZW1lbnQuYXR0cmlidXRlcyBpbnN0YW5jZW9mIE5hbWVkTm9kZU1hcCkgfHwgdHlwZW9mIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50LnNldEF0dHJpYnV0ZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgZWxlbWVudC5uYW1lc3BhY2VVUkkgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50Lmluc2VydEJlZm9yZSAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgZWxlbWVudC5oYXNDaGlsZE5vZGVzICE9PSAnZnVuY3Rpb24nKTtcbiAgfTtcbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBET00gbm9kZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIG9iamVjdCB0byBjaGVjayB3aGV0aGVyIGl0J3MgYSBET00gbm9kZVxuICAgKiBAcmV0dXJuIHRydWUgaXMgb2JqZWN0IGlzIGEgRE9NIG5vZGVcbiAgICovXG4gIGNvbnN0IF9pc05vZGUgPSBmdW5jdGlvbiBfaXNOb2RlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBOb2RlID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgTm9kZTtcbiAgfTtcbiAgZnVuY3Rpb24gX2V4ZWN1dGVIb29rcyhob29rcywgY3VycmVudE5vZGUsIGRhdGEpIHtcbiAgICBhcnJheUZvckVhY2goaG9va3MsIGhvb2sgPT4ge1xuICAgICAgaG9vay5jYWxsKERPTVB1cmlmeSwgY3VycmVudE5vZGUsIGRhdGEsIENPTkZJRyk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIF9zYW5pdGl6ZUVsZW1lbnRzXG4gICAqXG4gICAqIEBwcm90ZWN0IG5vZGVOYW1lXG4gICAqIEBwcm90ZWN0IHRleHRDb250ZW50XG4gICAqIEBwcm90ZWN0IHJlbW92ZUNoaWxkXG4gICAqIEBwYXJhbSBjdXJyZW50Tm9kZSB0byBjaGVjayBmb3IgcGVybWlzc2lvbiB0byBleGlzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgbm9kZSB3YXMga2lsbGVkLCBmYWxzZSBpZiBsZWZ0IGFsaXZlXG4gICAqL1xuICBjb25zdCBfc2FuaXRpemVFbGVtZW50cyA9IGZ1bmN0aW9uIF9zYW5pdGl6ZUVsZW1lbnRzKGN1cnJlbnROb2RlKSB7XG4gICAgbGV0IGNvbnRlbnQgPSBudWxsO1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmJlZm9yZVNhbml0aXplRWxlbWVudHMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgICAvKiBDaGVjayBpZiBlbGVtZW50IGlzIGNsb2JiZXJlZCBvciBjYW4gY2xvYmJlciAqL1xuICAgIGlmIChfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIE5vdyBsZXQncyBjaGVjayB0aGUgZWxlbWVudCdzIHR5cGUgYW5kIG5hbWUgKi9cbiAgICBjb25zdCB0YWdOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoY3VycmVudE5vZGUubm9kZU5hbWUpO1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZUVsZW1lbnQsIGN1cnJlbnROb2RlLCB7XG4gICAgICB0YWdOYW1lLFxuICAgICAgYWxsb3dlZFRhZ3M6IEFMTE9XRURfVEFHU1xuICAgIH0pO1xuICAgIC8qIERldGVjdCBtWFNTIGF0dGVtcHRzIGFidXNpbmcgbmFtZXNwYWNlIGNvbmZ1c2lvbiAqL1xuICAgIGlmIChTQUZFX0ZPUl9YTUwgJiYgY3VycmVudE5vZGUuaGFzQ2hpbGROb2RlcygpICYmICFfaXNOb2RlKGN1cnJlbnROb2RlLmZpcnN0RWxlbWVudENoaWxkKSAmJiByZWdFeHBUZXN0KC88Wy9cXHchXS9nLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpICYmIHJlZ0V4cFRlc3QoLzxbL1xcdyFdL2csIGN1cnJlbnROb2RlLnRleHRDb250ZW50KSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBSZW1vdmUgYW55IG9jY3VycmVuY2Ugb2YgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbnMgKi9cbiAgICBpZiAoY3VycmVudE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5wcm9ncmVzc2luZ0luc3RydWN0aW9uKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFJlbW92ZSBhbnkga2luZCBvZiBwb3NzaWJseSBoYXJtZnVsIGNvbW1lbnRzICovXG4gICAgaWYgKFNBRkVfRk9SX1hNTCAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLmNvbW1lbnQgJiYgcmVnRXhwVGVzdCgvPFsvXFx3XS9nLCBjdXJyZW50Tm9kZS5kYXRhKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBSZW1vdmUgZWxlbWVudCBpZiBhbnl0aGluZyBmb3JiaWRzIGl0cyBwcmVzZW5jZSAqL1xuICAgIGlmICghKEVYVFJBX0VMRU1FTlRfSEFORExJTkcudGFnQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLnRhZ0NoZWNrKHRhZ05hbWUpKSAmJiAoIUFMTE9XRURfVEFHU1t0YWdOYW1lXSB8fCBGT1JCSURfVEFHU1t0YWdOYW1lXSkpIHtcbiAgICAgIC8qIENoZWNrIGlmIHdlIGhhdmUgYSBjdXN0b20gZWxlbWVudCB0byBoYW5kbGUgKi9cbiAgICAgIGlmICghRk9SQklEX1RBR1NbdGFnTmFtZV0gJiYgX2lzQmFzaWNDdXN0b21FbGVtZW50KHRhZ05hbWUpKSB7XG4gICAgICAgIGlmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIHRhZ05hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sodGFnTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8qIEtlZXAgY29udGVudCBleGNlcHQgZm9yIGJhZC1saXN0ZWQgZWxlbWVudHMgKi9cbiAgICAgIGlmIChLRUVQX0NPTlRFTlQgJiYgIUZPUkJJRF9DT05URU5UU1t0YWdOYW1lXSkge1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50Tm9kZShjdXJyZW50Tm9kZSkgfHwgY3VycmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgY29uc3QgY2hpbGROb2RlcyA9IGdldENoaWxkTm9kZXMoY3VycmVudE5vZGUpIHx8IGN1cnJlbnROb2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGlmIChjaGlsZE5vZGVzICYmIHBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjb25zdCBjaGlsZENvdW50ID0gY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IGNoaWxkQ291bnQgLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRDbG9uZSA9IGNsb25lTm9kZShjaGlsZE5vZGVzW2ldLCB0cnVlKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuX19yZW1vdmFsQ291bnQgPSAoY3VycmVudE5vZGUuX19yZW1vdmFsQ291bnQgfHwgMCkgKyAxO1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2hpbGRDbG9uZSwgZ2V0TmV4dFNpYmxpbmcoY3VycmVudE5vZGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogQ2hlY2sgd2hldGhlciBlbGVtZW50IGhhcyBhIHZhbGlkIG5hbWVzcGFjZSAqL1xuICAgIGlmIChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgIV9jaGVja1ZhbGlkTmFtZXNwYWNlKGN1cnJlbnROb2RlKSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBNYWtlIHN1cmUgdGhhdCBvbGRlciBicm93c2VycyBkb24ndCBnZXQgZmFsbGJhY2stdGFnIG1YU1MgKi9cbiAgICBpZiAoKHRhZ05hbWUgPT09ICdub3NjcmlwdCcgfHwgdGFnTmFtZSA9PT0gJ25vZW1iZWQnIHx8IHRhZ05hbWUgPT09ICdub2ZyYW1lcycpICYmIHJlZ0V4cFRlc3QoLzxcXC9ubyhzY3JpcHR8ZW1iZWR8ZnJhbWVzKS9pLCBjdXJyZW50Tm9kZS5pbm5lckhUTUwpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFNhbml0aXplIGVsZW1lbnQgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUyAmJiBjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLnRleHQpIHtcbiAgICAgIC8qIEdldCB0aGUgZWxlbWVudCdzIHRleHQgY29udGVudCAqL1xuICAgICAgY29udGVudCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xuICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgY29udGVudCA9IHN0cmluZ1JlcGxhY2UoY29udGVudCwgZXhwciwgJyAnKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50ICE9PSBjb250ZW50KSB7XG4gICAgICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgICAgIGVsZW1lbnQ6IGN1cnJlbnROb2RlLmNsb25lTm9kZSgpXG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVFbGVtZW50cywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIF9pc1ZhbGlkQXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSBsY1RhZyBMb3dlcmNhc2UgdGFnIG5hbWUgb2YgY29udGFpbmluZyBlbGVtZW50LlxuICAgKiBAcGFyYW0gbGNOYW1lIExvd2VyY2FzZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICogQHBhcmFtIHZhbHVlIEF0dHJpYnV0ZSB2YWx1ZS5cbiAgICogQHJldHVybiBSZXR1cm5zIHRydWUgaWYgYHZhbHVlYCBpcyB2YWxpZCwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgY29uc3QgX2lzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSkge1xuICAgIC8qIE1ha2Ugc3VyZSBhdHRyaWJ1dGUgY2Fubm90IGNsb2JiZXIgKi9cbiAgICBpZiAoU0FOSVRJWkVfRE9NICYmIChsY05hbWUgPT09ICdpZCcgfHwgbGNOYW1lID09PSAnbmFtZScpICYmICh2YWx1ZSBpbiBkb2N1bWVudCB8fCB2YWx1ZSBpbiBmb3JtRWxlbWVudCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyogQWxsb3cgdmFsaWQgZGF0YS0qIGF0dHJpYnV0ZXM6IEF0IGxlYXN0IG9uZSBjaGFyYWN0ZXIgYWZ0ZXIgXCItXCJcbiAgICAgICAgKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2VtYmVkZGluZy1jdXN0b20tbm9uLXZpc2libGUtZGF0YS13aXRoLXRoZS1kYXRhLSotYXR0cmlidXRlcylcbiAgICAgICAgWE1MLWNvbXBhdGlibGUgKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2luZnJhc3RydWN0dXJlLmh0bWwjeG1sLWNvbXBhdGlibGUgYW5kIGh0dHA6Ly93d3cudzMub3JnL1RSL3htbC8jZDBlODA0KVxuICAgICAgICBXZSBkb24ndCBuZWVkIHRvIGNoZWNrIHRoZSB2YWx1ZTsgaXQncyBhbHdheXMgVVJJIHNhZmUuICovXG4gICAgaWYgKEFMTE9XX0RBVEFfQVRUUiAmJiAhRk9SQklEX0FUVFJbbGNOYW1lXSAmJiByZWdFeHBUZXN0KERBVEFfQVRUUiwgbGNOYW1lKSkgOyBlbHNlIGlmIChBTExPV19BUklBX0FUVFIgJiYgcmVnRXhwVGVzdChBUklBX0FUVFIsIGxjTmFtZSkpIDsgZWxzZSBpZiAoRVhUUkFfRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIEVYVFJBX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlQ2hlY2sobGNOYW1lLCBsY1RhZykpIDsgZWxzZSBpZiAoIUFMTE9XRURfQVRUUltsY05hbWVdIHx8IEZPUkJJRF9BVFRSW2xjTmFtZV0pIHtcbiAgICAgIGlmIChcbiAgICAgIC8vIEZpcnN0IGNvbmRpdGlvbiBkb2VzIGEgdmVyeSBiYXNpYyBjaGVjayBpZiBhKSBpdCdzIGJhc2ljYWxseSBhIHZhbGlkIGN1c3RvbSBlbGVtZW50IHRhZ25hbWUgQU5EXG4gICAgICAvLyBiKSBpZiB0aGUgdGFnTmFtZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVja1xuICAgICAgLy8gYW5kIGMpIGlmIHRoZSBhdHRyaWJ1dGUgbmFtZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVja1xuICAgICAgX2lzQmFzaWNDdXN0b21FbGVtZW50KGxjVGFnKSAmJiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLCBsY1RhZykgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKGxjVGFnKSkgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjaywgbGNOYW1lKSB8fCBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVOYW1lQ2hlY2sobGNOYW1lLCBsY1RhZykpIHx8XG4gICAgICAvLyBBbHRlcm5hdGl2ZSwgc2Vjb25kIGNvbmRpdGlvbiBjaGVja3MgaWYgaXQncyBhbiBgaXNgLWF0dHJpYnV0ZSwgQU5EXG4gICAgICAvLyB0aGUgdmFsdWUgcGFzc2VzIHdoYXRldmVyIHRoZSB1c2VyIGhhcyBjb25maWd1cmVkIGZvciBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2tcbiAgICAgIGxjTmFtZSA9PT0gJ2lzJyAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgJiYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgdmFsdWUpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayh2YWx1ZSkpKSA7IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvKiBDaGVjayB2YWx1ZSBpcyBzYWZlLiBGaXJzdCwgaXMgYXR0ciBpbmVydD8gSWYgc28sIGlzIHNhZmUgKi9cbiAgICB9IGVsc2UgaWYgKFVSSV9TQUZFX0FUVFJJQlVURVNbbGNOYW1lXSkgOyBlbHNlIGlmIChyZWdFeHBUZXN0KElTX0FMTE9XRURfVVJJJDEsIHN0cmluZ1JlcGxhY2UodmFsdWUsIEFUVFJfV0hJVEVTUEFDRSwgJycpKSkgOyBlbHNlIGlmICgobGNOYW1lID09PSAnc3JjJyB8fCBsY05hbWUgPT09ICd4bGluazpocmVmJyB8fCBsY05hbWUgPT09ICdocmVmJykgJiYgbGNUYWcgIT09ICdzY3JpcHQnICYmIHN0cmluZ0luZGV4T2YodmFsdWUsICdkYXRhOicpID09PSAwICYmIERBVEFfVVJJX1RBR1NbbGNUYWddKSA7IGVsc2UgaWYgKEFMTE9XX1VOS05PV05fUFJPVE9DT0xTICYmICFyZWdFeHBUZXN0KElTX1NDUklQVF9PUl9EQVRBLCBzdHJpbmdSZXBsYWNlKHZhbHVlLCBBVFRSX1dISVRFU1BBQ0UsICcnKSkpIDsgZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICAvKipcbiAgICogX2lzQmFzaWNDdXN0b21FbGVtZW50XG4gICAqIGNoZWNrcyBpZiBhdCBsZWFzdCBvbmUgZGFzaCBpcyBpbmNsdWRlZCBpbiB0YWdOYW1lLCBhbmQgaXQncyBub3QgdGhlIGZpcnN0IGNoYXJcbiAgICogZm9yIG1vcmUgc29waGlzdGljYXRlZCBjaGVja2luZyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy92YWxpZGF0ZS1lbGVtZW50LW5hbWVcbiAgICpcbiAgICogQHBhcmFtIHRhZ05hbWUgbmFtZSBvZiB0aGUgdGFnIG9mIHRoZSBub2RlIHRvIHNhbml0aXplXG4gICAqIEByZXR1cm5zIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGFnIG5hbWUgbWVldHMgdGhlIGJhc2ljIGNyaXRlcmlhIGZvciBhIGN1c3RvbSBlbGVtZW50LCBvdGhlcndpc2UgZmFsc2UuXG4gICAqL1xuICBjb25zdCBfaXNCYXNpY0N1c3RvbUVsZW1lbnQgPSBmdW5jdGlvbiBfaXNCYXNpY0N1c3RvbUVsZW1lbnQodGFnTmFtZSkge1xuICAgIHJldHVybiB0YWdOYW1lICE9PSAnYW5ub3RhdGlvbi14bWwnICYmIHN0cmluZ01hdGNoKHRhZ05hbWUsIENVU1RPTV9FTEVNRU5UKTtcbiAgfTtcbiAgLyoqXG4gICAqIF9zYW5pdGl6ZUF0dHJpYnV0ZXNcbiAgICpcbiAgICogQHByb3RlY3QgYXR0cmlidXRlc1xuICAgKiBAcHJvdGVjdCBub2RlTmFtZVxuICAgKiBAcHJvdGVjdCByZW1vdmVBdHRyaWJ1dGVcbiAgICogQHByb3RlY3Qgc2V0QXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSBjdXJyZW50Tm9kZSB0byBzYW5pdGl6ZVxuICAgKi9cbiAgY29uc3QgX3Nhbml0aXplQXR0cmlidXRlcyA9IGZ1bmN0aW9uIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoY3VycmVudE5vZGUpIHtcbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5iZWZvcmVTYW5pdGl6ZUF0dHJpYnV0ZXMsIGN1cnJlbnROb2RlLCBudWxsKTtcbiAgICBjb25zdCB7XG4gICAgICBhdHRyaWJ1dGVzXG4gICAgfSA9IGN1cnJlbnROb2RlO1xuICAgIC8qIENoZWNrIGlmIHdlIGhhdmUgYXR0cmlidXRlczsgaWYgbm90IHdlIG1pZ2h0IGhhdmUgYSB0ZXh0IG5vZGUgKi9cbiAgICBpZiAoIWF0dHJpYnV0ZXMgfHwgX2lzQ2xvYmJlcmVkKGN1cnJlbnROb2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBob29rRXZlbnQgPSB7XG4gICAgICBhdHRyTmFtZTogJycsXG4gICAgICBhdHRyVmFsdWU6ICcnLFxuICAgICAga2VlcEF0dHI6IHRydWUsXG4gICAgICBhbGxvd2VkQXR0cmlidXRlczogQUxMT1dFRF9BVFRSLFxuICAgICAgZm9yY2VLZWVwQXR0cjogdW5kZWZpbmVkXG4gICAgfTtcbiAgICBsZXQgbCA9IGF0dHJpYnV0ZXMubGVuZ3RoO1xuICAgIC8qIEdvIGJhY2t3YXJkcyBvdmVyIGFsbCBhdHRyaWJ1dGVzOyBzYWZlbHkgcmVtb3ZlIGJhZCBvbmVzICovXG4gICAgd2hpbGUgKGwtLSkge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJpYnV0ZXNbbF07XG4gICAgICBjb25zdCB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIG5hbWVzcGFjZVVSSSxcbiAgICAgICAgdmFsdWU6IGF0dHJWYWx1ZVxuICAgICAgfSA9IGF0dHI7XG4gICAgICBjb25zdCBsY05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhuYW1lKTtcbiAgICAgIGNvbnN0IGluaXRWYWx1ZSA9IGF0dHJWYWx1ZTtcbiAgICAgIGxldCB2YWx1ZSA9IG5hbWUgPT09ICd2YWx1ZScgPyBpbml0VmFsdWUgOiBzdHJpbmdUcmltKGluaXRWYWx1ZSk7XG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBob29rRXZlbnQuYXR0ck5hbWUgPSBsY05hbWU7XG4gICAgICBob29rRXZlbnQuYXR0clZhbHVlID0gdmFsdWU7XG4gICAgICBob29rRXZlbnQua2VlcEF0dHIgPSB0cnVlO1xuICAgICAgaG9va0V2ZW50LmZvcmNlS2VlcEF0dHIgPSB1bmRlZmluZWQ7IC8vIEFsbG93cyBkZXZlbG9wZXJzIHRvIHNlZSB0aGlzIGlzIGEgcHJvcGVydHkgdGhleSBjYW4gc2V0XG4gICAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZUF0dHJpYnV0ZSwgY3VycmVudE5vZGUsIGhvb2tFdmVudCk7XG4gICAgICB2YWx1ZSA9IGhvb2tFdmVudC5hdHRyVmFsdWU7XG4gICAgICAvKiBGdWxsIERPTSBDbG9iYmVyaW5nIHByb3RlY3Rpb24gdmlhIG5hbWVzcGFjZSBpc29sYXRpb24sXG4gICAgICAgKiBQcmVmaXggaWQgYW5kIG5hbWUgYXR0cmlidXRlcyB3aXRoIGB1c2VyLWNvbnRlbnQtYFxuICAgICAgICovXG4gICAgICBpZiAoU0FOSVRJWkVfTkFNRURfUFJPUFMgJiYgKGxjTmFtZSA9PT0gJ2lkJyB8fCBsY05hbWUgPT09ICduYW1lJykpIHtcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBhdHRyaWJ1dGUgd2l0aCB0aGlzIHZhbHVlXG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICAvLyBQcmVmaXggdGhlIHZhbHVlIGFuZCBsYXRlciByZS1jcmVhdGUgdGhlIGF0dHJpYnV0ZSB3aXRoIHRoZSBzYW5pdGl6ZWQgdmFsdWVcbiAgICAgICAgdmFsdWUgPSBTQU5JVElaRV9OQU1FRF9QUk9QU19QUkVGSVggKyB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIC8qIFdvcmsgYXJvdW5kIGEgc2VjdXJpdHkgaXNzdWUgd2l0aCBjb21tZW50cyBpbnNpZGUgYXR0cmlidXRlcyAqL1xuICAgICAgaWYgKFNBRkVfRk9SX1hNTCAmJiByZWdFeHBUZXN0KC8oKC0tIT98XSk+KXw8XFwvKHN0eWxlfHRpdGxlfHRleHRhcmVhKS9pLCB2YWx1ZSkpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogTWFrZSBzdXJlIHdlIGNhbm5vdCBlYXNpbHkgdXNlIGFuaW1hdGVkIGhyZWZzLCBldmVuIGlmIGFuaW1hdGlvbnMgYXJlIGFsbG93ZWQgKi9cbiAgICAgIGlmIChsY05hbWUgPT09ICdhdHRyaWJ1dGVuYW1lJyAmJiBzdHJpbmdNYXRjaCh2YWx1ZSwgJ2hyZWYnKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBEaWQgdGhlIGhvb2tzIGFwcHJvdmUgb2YgdGhlIGF0dHJpYnV0ZT8gKi9cbiAgICAgIGlmIChob29rRXZlbnQuZm9yY2VLZWVwQXR0cikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIERpZCB0aGUgaG9va3MgYXBwcm92ZSBvZiB0aGUgYXR0cmlidXRlPyAqL1xuICAgICAgaWYgKCFob29rRXZlbnQua2VlcEF0dHIpIHtcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogV29yayBhcm91bmQgYSBzZWN1cml0eSBpc3N1ZSBpbiBqUXVlcnkgMy4wICovXG4gICAgICBpZiAoIUFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiAmJiByZWdFeHBUZXN0KC9cXC8+L2ksIHZhbHVlKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBTYW5pdGl6ZSBhdHRyaWJ1dGUgY29udGVudCB0byBiZSB0ZW1wbGF0ZS1zYWZlICovXG4gICAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICAgIGFycmF5Rm9yRWFjaChbTVVTVEFDSEVfRVhQUiwgRVJCX0VYUFIsIFRNUExJVF9FWFBSXSwgZXhwciA9PiB7XG4gICAgICAgICAgdmFsdWUgPSBzdHJpbmdSZXBsYWNlKHZhbHVlLCBleHByLCAnICcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8qIElzIGB2YWx1ZWAgdmFsaWQgZm9yIHRoaXMgYXR0cmlidXRlPyAqL1xuICAgICAgY29uc3QgbGNUYWcgPSB0cmFuc2Zvcm1DYXNlRnVuYyhjdXJyZW50Tm9kZS5ub2RlTmFtZSk7XG4gICAgICBpZiAoIV9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBIYW5kbGUgYXR0cmlidXRlcyB0aGF0IHJlcXVpcmUgVHJ1c3RlZCBUeXBlcyAqL1xuICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSAmJiB0eXBlb2YgdHJ1c3RlZFR5cGVzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdHJ1c3RlZFR5cGVzLmdldEF0dHJpYnV0ZVR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZVVSSSkgOyBlbHNlIHtcbiAgICAgICAgICBzd2l0Y2ggKHRydXN0ZWRUeXBlcy5nZXRBdHRyaWJ1dGVUeXBlKGxjVGFnLCBsY05hbWUpKSB7XG4gICAgICAgICAgICBjYXNlICdUcnVzdGVkSFRNTCc6XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnVHJ1c3RlZFNjcmlwdFVSTCc6XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVTY3JpcHRVUkwodmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvKiBIYW5kbGUgaW52YWxpZCBkYXRhLSogYXR0cmlidXRlIHNldCBieSB0cnktY2F0Y2hpbmcgaXQgKi9cbiAgICAgIGlmICh2YWx1ZSAhPT0gaW5pdFZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG5hbWVzcGFjZVVSSSkge1xuICAgICAgICAgICAgY3VycmVudE5vZGUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8qIEZhbGxiYWNrIHRvIHNldEF0dHJpYnV0ZSgpIGZvciBicm93c2VyLXVucmVjb2duaXplZCBuYW1lc3BhY2VzIGUuZy4gXCJ4LXNjaGVtYVwiLiAqL1xuICAgICAgICAgICAgY3VycmVudE5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFycmF5UG9wKERPTVB1cmlmeS5yZW1vdmVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplQXR0cmlidXRlcywgY3VycmVudE5vZGUsIG51bGwpO1xuICB9O1xuICAvKipcbiAgICogX3Nhbml0aXplU2hhZG93RE9NXG4gICAqXG4gICAqIEBwYXJhbSBmcmFnbWVudCB0byBpdGVyYXRlIG92ZXIgcmVjdXJzaXZlbHlcbiAgICovXG4gIGNvbnN0IF9zYW5pdGl6ZVNoYWRvd0RPTSA9IGZ1bmN0aW9uIF9zYW5pdGl6ZVNoYWRvd0RPTShmcmFnbWVudCkge1xuICAgIGxldCBzaGFkb3dOb2RlID0gbnVsbDtcbiAgICBjb25zdCBzaGFkb3dJdGVyYXRvciA9IF9jcmVhdGVOb2RlSXRlcmF0b3IoZnJhZ21lbnQpO1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmJlZm9yZVNhbml0aXplU2hhZG93RE9NLCBmcmFnbWVudCwgbnVsbCk7XG4gICAgd2hpbGUgKHNoYWRvd05vZGUgPSBzaGFkb3dJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLnVwb25TYW5pdGl6ZVNoYWRvd05vZGUsIHNoYWRvd05vZGUsIG51bGwpO1xuICAgICAgLyogU2FuaXRpemUgdGFncyBhbmQgZWxlbWVudHMgKi9cbiAgICAgIF9zYW5pdGl6ZUVsZW1lbnRzKHNoYWRvd05vZGUpO1xuICAgICAgLyogQ2hlY2sgYXR0cmlidXRlcyBuZXh0ICovXG4gICAgICBfc2FuaXRpemVBdHRyaWJ1dGVzKHNoYWRvd05vZGUpO1xuICAgICAgLyogRGVlcCBzaGFkb3cgRE9NIGRldGVjdGVkICovXG4gICAgICBpZiAoc2hhZG93Tm9kZS5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oc2hhZG93Tm9kZS5jb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYWZ0ZXJTYW5pdGl6ZVNoYWRvd0RPTSwgZnJhZ21lbnQsIG51bGwpO1xuICB9O1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICBET01QdXJpZnkuc2FuaXRpemUgPSBmdW5jdGlvbiAoZGlydHkpIHtcbiAgICBsZXQgY2ZnID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICBsZXQgYm9keSA9IG51bGw7XG4gICAgbGV0IGltcG9ydGVkTm9kZSA9IG51bGw7XG4gICAgbGV0IGN1cnJlbnROb2RlID0gbnVsbDtcbiAgICBsZXQgcmV0dXJuTm9kZSA9IG51bGw7XG4gICAgLyogTWFrZSBzdXJlIHdlIGhhdmUgYSBzdHJpbmcgdG8gc2FuaXRpemUuXG4gICAgICBETyBOT1QgcmV0dXJuIGVhcmx5LCBhcyB0aGlzIHdpbGwgcmV0dXJuIHRoZSB3cm9uZyB0eXBlIGlmXG4gICAgICB0aGUgdXNlciBoYXMgcmVxdWVzdGVkIGEgRE9NIG9iamVjdCByYXRoZXIgdGhhbiBhIHN0cmluZyAqL1xuICAgIElTX0VNUFRZX0lOUFVUID0gIWRpcnR5O1xuICAgIGlmIChJU19FTVBUWV9JTlBVVCkge1xuICAgICAgZGlydHkgPSAnPCEtLT4nO1xuICAgIH1cbiAgICAvKiBTdHJpbmdpZnksIGluIGNhc2UgZGlydHkgaXMgYW4gb2JqZWN0ICovXG4gICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycgJiYgIV9pc05vZGUoZGlydHkpKSB7XG4gICAgICBpZiAodHlwZW9mIGRpcnR5LnRvU3RyaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGRpcnR5ID0gZGlydHkudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXJ0eSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ2RpcnR5IGlzIG5vdCBhIHN0cmluZywgYWJvcnRpbmcnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCd0b1N0cmluZyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBSZXR1cm4gZGlydHkgSFRNTCBpZiBET01QdXJpZnkgY2Fubm90IHJ1biAqL1xuICAgIGlmICghRE9NUHVyaWZ5LmlzU3VwcG9ydGVkKSB7XG4gICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIC8qIEFzc2lnbiBjb25maWcgdmFycyAqL1xuICAgIGlmICghU0VUX0NPTkZJRykge1xuICAgICAgX3BhcnNlQ29uZmlnKGNmZyk7XG4gICAgfVxuICAgIC8qIENsZWFuIHVwIHJlbW92ZWQgZWxlbWVudHMgKi9cbiAgICBET01QdXJpZnkucmVtb3ZlZCA9IFtdO1xuICAgIC8qIENoZWNrIGlmIGRpcnR5IGlzIGNvcnJlY3RseSB0eXBlZCBmb3IgSU5fUExBQ0UgKi9cbiAgICBpZiAodHlwZW9mIGRpcnR5ID09PSAnc3RyaW5nJykge1xuICAgICAgSU5fUExBQ0UgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKElOX1BMQUNFKSB7XG4gICAgICAvKiBEbyBzb21lIGVhcmx5IHByZS1zYW5pdGl6YXRpb24gdG8gYXZvaWQgdW5zYWZlIHJvb3Qgbm9kZXMgKi9cbiAgICAgIGlmIChkaXJ0eS5ub2RlTmFtZSkge1xuICAgICAgICBjb25zdCB0YWdOYW1lID0gdHJhbnNmb3JtQ2FzZUZ1bmMoZGlydHkubm9kZU5hbWUpO1xuICAgICAgICBpZiAoIUFMTE9XRURfVEFHU1t0YWdOYW1lXSB8fCBGT1JCSURfVEFHU1t0YWdOYW1lXSkge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgncm9vdCBub2RlIGlzIGZvcmJpZGRlbiBhbmQgY2Fubm90IGJlIHNhbml0aXplZCBpbi1wbGFjZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChkaXJ0eSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgIC8qIElmIGRpcnR5IGlzIGEgRE9NIGVsZW1lbnQsIGFwcGVuZCB0byBhbiBlbXB0eSBkb2N1bWVudCB0byBhdm9pZFxuICAgICAgICAgZWxlbWVudHMgYmVpbmcgc3RyaXBwZWQgYnkgdGhlIHBhcnNlciAqL1xuICAgICAgYm9keSA9IF9pbml0RG9jdW1lbnQoJzwhLS0tLT4nKTtcbiAgICAgIGltcG9ydGVkTm9kZSA9IGJvZHkub3duZXJEb2N1bWVudC5pbXBvcnROb2RlKGRpcnR5LCB0cnVlKTtcbiAgICAgIGlmIChpbXBvcnRlZE5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5lbGVtZW50ICYmIGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0JPRFknKSB7XG4gICAgICAgIC8qIE5vZGUgaXMgYWxyZWFkeSBhIGJvZHksIHVzZSBhcyBpcyAqL1xuICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgfSBlbHNlIGlmIChpbXBvcnRlZE5vZGUubm9kZU5hbWUgPT09ICdIVE1MJykge1xuICAgICAgICBib2R5ID0gaW1wb3J0ZWROb2RlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLWFwcGVuZFxuICAgICAgICBib2R5LmFwcGVuZENoaWxkKGltcG9ydGVkTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIEV4aXQgZGlyZWN0bHkgaWYgd2UgaGF2ZSBub3RoaW5nIHRvIGRvICovXG4gICAgICBpZiAoIVJFVFVSTl9ET00gJiYgIVNBRkVfRk9SX1RFTVBMQVRFUyAmJiAhV0hPTEVfRE9DVU1FTlQgJiZcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL3ByZWZlci1pbmNsdWRlc1xuICAgICAgZGlydHkuaW5kZXhPZignPCcpID09PSAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1c3RlZFR5cGVzUG9saWN5ICYmIFJFVFVSTl9UUlVTVEVEX1RZUEUgPyB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTChkaXJ0eSkgOiBkaXJ0eTtcbiAgICAgIH1cbiAgICAgIC8qIEluaXRpYWxpemUgdGhlIGRvY3VtZW50IHRvIHdvcmsgb24gKi9cbiAgICAgIGJvZHkgPSBfaW5pdERvY3VtZW50KGRpcnR5KTtcbiAgICAgIC8qIENoZWNrIHdlIGhhdmUgYSBET00gbm9kZSBmcm9tIHRoZSBkYXRhICovXG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgcmV0dXJuIFJFVFVSTl9ET00gPyBudWxsIDogUkVUVVJOX1RSVVNURURfVFlQRSA/IGVtcHR5SFRNTCA6ICcnO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBSZW1vdmUgZmlyc3QgZWxlbWVudCBub2RlIChvdXJzKSBpZiBGT1JDRV9CT0RZIGlzIHNldCAqL1xuICAgIGlmIChib2R5ICYmIEZPUkNFX0JPRFkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShib2R5LmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICAvKiBHZXQgbm9kZSBpdGVyYXRvciAqL1xuICAgIGNvbnN0IG5vZGVJdGVyYXRvciA9IF9jcmVhdGVOb2RlSXRlcmF0b3IoSU5fUExBQ0UgPyBkaXJ0eSA6IGJvZHkpO1xuICAgIC8qIE5vdyBzdGFydCBpdGVyYXRpbmcgb3ZlciB0aGUgY3JlYXRlZCBkb2N1bWVudCAqL1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSA9IG5vZGVJdGVyYXRvci5uZXh0Tm9kZSgpKSB7XG4gICAgICAvKiBTYW5pdGl6ZSB0YWdzIGFuZCBlbGVtZW50cyAqL1xuICAgICAgX3Nhbml0aXplRWxlbWVudHMoY3VycmVudE5vZGUpO1xuICAgICAgLyogQ2hlY2sgYXR0cmlidXRlcyBuZXh0ICovXG4gICAgICBfc2FuaXRpemVBdHRyaWJ1dGVzKGN1cnJlbnROb2RlKTtcbiAgICAgIC8qIFNoYWRvdyBET00gZGV0ZWN0ZWQsIHNhbml0aXplIGl0ICovXG4gICAgICBpZiAoY3VycmVudE5vZGUuY29udGVudCBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnQpIHtcbiAgICAgICAgX3Nhbml0aXplU2hhZG93RE9NKGN1cnJlbnROb2RlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBJZiB3ZSBzYW5pdGl6ZWQgYGRpcnR5YCBpbi1wbGFjZSwgcmV0dXJuIGl0LiAqL1xuICAgIGlmIChJTl9QTEFDRSkge1xuICAgICAgcmV0dXJuIGRpcnR5O1xuICAgIH1cbiAgICAvKiBSZXR1cm4gc2FuaXRpemVkIHN0cmluZyBvciBET00gKi9cbiAgICBpZiAoUkVUVVJOX0RPTSkge1xuICAgICAgaWYgKFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgICAgcmV0dXJuTm9kZSA9IGNyZWF0ZURvY3VtZW50RnJhZ21lbnQuY2FsbChib2R5Lm93bmVyRG9jdW1lbnQpO1xuICAgICAgICB3aGlsZSAoYm9keS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWRvbS1ub2RlLWFwcGVuZFxuICAgICAgICAgIHJldHVybk5vZGUuYXBwZW5kQ2hpbGQoYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuTm9kZSA9IGJvZHk7XG4gICAgICB9XG4gICAgICBpZiAoQUxMT1dFRF9BVFRSLnNoYWRvd3Jvb3QgfHwgQUxMT1dFRF9BVFRSLnNoYWRvd3Jvb3Rtb2RlKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAgQWRvcHROb2RlKCkgaXMgbm90IHVzZWQgYmVjYXVzZSBpbnRlcm5hbCBzdGF0ZSBpcyBub3QgcmVzZXRcbiAgICAgICAgICAoZS5nLiB0aGUgcGFzdCBuYW1lcyBtYXAgb2YgYSBIVE1MRm9ybUVsZW1lbnQpLCB0aGlzIGlzIHNhZmVcbiAgICAgICAgICBpbiB0aGVvcnkgYnV0IHdlIHdvdWxkIHJhdGhlciBub3QgcmlzayBhbm90aGVyIGF0dGFjayB2ZWN0b3IuXG4gICAgICAgICAgVGhlIHN0YXRlIHRoYXQgaXMgY2xvbmVkIGJ5IGltcG9ydE5vZGUoKSBpcyBleHBsaWNpdGx5IGRlZmluZWRcbiAgICAgICAgICBieSB0aGUgc3BlY3MuXG4gICAgICAgICovXG4gICAgICAgIHJldHVybk5vZGUgPSBpbXBvcnROb2RlLmNhbGwob3JpZ2luYWxEb2N1bWVudCwgcmV0dXJuTm9kZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0dXJuTm9kZTtcbiAgICB9XG4gICAgbGV0IHNlcmlhbGl6ZWRIVE1MID0gV0hPTEVfRE9DVU1FTlQgPyBib2R5Lm91dGVySFRNTCA6IGJvZHkuaW5uZXJIVE1MO1xuICAgIC8qIFNlcmlhbGl6ZSBkb2N0eXBlIGlmIGFsbG93ZWQgKi9cbiAgICBpZiAoV0hPTEVfRE9DVU1FTlQgJiYgQUxMT1dFRF9UQUdTWychZG9jdHlwZSddICYmIGJvZHkub3duZXJEb2N1bWVudCAmJiBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZSAmJiBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZS5uYW1lICYmIHJlZ0V4cFRlc3QoRE9DVFlQRV9OQU1FLCBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZS5uYW1lKSkge1xuICAgICAgc2VyaWFsaXplZEhUTUwgPSAnPCFET0NUWVBFICcgKyBib2R5Lm93bmVyRG9jdW1lbnQuZG9jdHlwZS5uYW1lICsgJz5cXG4nICsgc2VyaWFsaXplZEhUTUw7XG4gICAgfVxuICAgIC8qIFNhbml0aXplIGZpbmFsIHN0cmluZyB0ZW1wbGF0ZS1zYWZlICovXG4gICAgaWYgKFNBRkVfRk9SX1RFTVBMQVRFUykge1xuICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgc2VyaWFsaXplZEhUTUwgPSBzdHJpbmdSZXBsYWNlKHNlcmlhbGl6ZWRIVE1MLCBleHByLCAnICcpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVzdGVkVHlwZXNQb2xpY3kgJiYgUkVUVVJOX1RSVVNURURfVFlQRSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKHNlcmlhbGl6ZWRIVE1MKSA6IHNlcmlhbGl6ZWRIVE1MO1xuICB9O1xuICBET01QdXJpZnkuc2V0Q29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHt9O1xuICAgIF9wYXJzZUNvbmZpZyhjZmcpO1xuICAgIFNFVF9DT05GSUcgPSB0cnVlO1xuICB9O1xuICBET01QdXJpZnkuY2xlYXJDb25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgQ09ORklHID0gbnVsbDtcbiAgICBTRVRfQ09ORklHID0gZmFsc2U7XG4gIH07XG4gIERPTVB1cmlmeS5pc1ZhbGlkQXR0cmlidXRlID0gZnVuY3Rpb24gKHRhZywgYXR0ciwgdmFsdWUpIHtcbiAgICAvKiBJbml0aWFsaXplIHNoYXJlZCBjb25maWcgdmFycyBpZiBuZWNlc3NhcnkuICovXG4gICAgaWYgKCFDT05GSUcpIHtcbiAgICAgIF9wYXJzZUNvbmZpZyh7fSk7XG4gICAgfVxuICAgIGNvbnN0IGxjVGFnID0gdHJhbnNmb3JtQ2FzZUZ1bmModGFnKTtcbiAgICBjb25zdCBsY05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhhdHRyKTtcbiAgICByZXR1cm4gX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpO1xuICB9O1xuICBET01QdXJpZnkuYWRkSG9vayA9IGZ1bmN0aW9uIChlbnRyeVBvaW50LCBob29rRnVuY3Rpb24pIHtcbiAgICBpZiAodHlwZW9mIGhvb2tGdW5jdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhcnJheVB1c2goaG9va3NbZW50cnlQb2ludF0sIGhvb2tGdW5jdGlvbik7XG4gIH07XG4gIERPTVB1cmlmeS5yZW1vdmVIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQsIGhvb2tGdW5jdGlvbikge1xuICAgIGlmIChob29rRnVuY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5kZXggPSBhcnJheUxhc3RJbmRleE9mKGhvb2tzW2VudHJ5UG9pbnRdLCBob29rRnVuY3Rpb24pO1xuICAgICAgcmV0dXJuIGluZGV4ID09PSAtMSA/IHVuZGVmaW5lZCA6IGFycmF5U3BsaWNlKGhvb2tzW2VudHJ5UG9pbnRdLCBpbmRleCwgMSlbMF07XG4gICAgfVxuICAgIHJldHVybiBhcnJheVBvcChob29rc1tlbnRyeVBvaW50XSk7XG4gIH07XG4gIERPTVB1cmlmeS5yZW1vdmVIb29rcyA9IGZ1bmN0aW9uIChlbnRyeVBvaW50KSB7XG4gICAgaG9va3NbZW50cnlQb2ludF0gPSBbXTtcbiAgfTtcbiAgRE9NUHVyaWZ5LnJlbW92ZUFsbEhvb2tzID0gZnVuY3Rpb24gKCkge1xuICAgIGhvb2tzID0gX2NyZWF0ZUhvb2tzTWFwKCk7XG4gIH07XG4gIHJldHVybiBET01QdXJpZnk7XG59XG52YXIgcHVyaWZ5ID0gY3JlYXRlRE9NUHVyaWZ5KCk7XG5cbmV4cG9ydCB7IHB1cmlmeSBhcyBkZWZhdWx0IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wdXJpZnkuZXMubWpzLm1hcFxuIiwiLyoqXG4gKiBtYXJrZWQgdjE3LjAuMSAtIGEgbWFya2Rvd24gcGFyc2VyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTgtMjAyNSwgTWFya2VkSlMuIChNSVQgTGljZW5zZSlcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDE4LCBDaHJpc3RvcGhlciBKZWZmcmV5LiAoTUlUIExpY2Vuc2UpXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbWFya2VkanMvbWFya2VkXG4gKi9cblxuLyoqXG4gKiBETyBOT1QgRURJVCBUSElTIEZJTEVcbiAqIFRoZSBjb2RlIGluIHRoaXMgZmlsZSBpcyBnZW5lcmF0ZWQgZnJvbSBmaWxlcyBpbiAuL3NyYy9cbiAqL1xuXG5mdW5jdGlvbiBMKCl7cmV0dXJue2FzeW5jOiExLGJyZWFrczohMSxleHRlbnNpb25zOm51bGwsZ2ZtOiEwLGhvb2tzOm51bGwscGVkYW50aWM6ITEscmVuZGVyZXI6bnVsbCxzaWxlbnQ6ITEsdG9rZW5pemVyOm51bGwsd2Fsa1Rva2VuczpudWxsfX12YXIgVD1MKCk7ZnVuY3Rpb24gWih1KXtUPXV9dmFyIEM9e2V4ZWM6KCk9Pm51bGx9O2Z1bmN0aW9uIGsodSxlPVwiXCIpe2xldCB0PXR5cGVvZiB1PT1cInN0cmluZ1wiP3U6dS5zb3VyY2Usbj17cmVwbGFjZToocixpKT0+e2xldCBzPXR5cGVvZiBpPT1cInN0cmluZ1wiP2k6aS5zb3VyY2U7cmV0dXJuIHM9cy5yZXBsYWNlKG0uY2FyZXQsXCIkMVwiKSx0PXQucmVwbGFjZShyLHMpLG59LGdldFJlZ2V4OigpPT5uZXcgUmVnRXhwKHQsZSl9O3JldHVybiBufXZhciBtZT0oKCk9Pnt0cnl7cmV0dXJuISFuZXcgUmVnRXhwKFwiKD88PTEpKD88ITEpXCIpfWNhdGNoe3JldHVybiExfX0pKCksbT17Y29kZVJlbW92ZUluZGVudDovXig/OiB7MSw0fXwgezAsM31cXHQpL2dtLG91dHB1dExpbmtSZXBsYWNlOi9cXFxcKFtcXFtcXF1dKS9nLGluZGVudENvZGVDb21wZW5zYXRpb246L14oXFxzKykoPzpgYGApLyxiZWdpbm5pbmdTcGFjZTovXlxccysvLGVuZGluZ0hhc2g6LyMkLyxzdGFydGluZ1NwYWNlQ2hhcjovXiAvLGVuZGluZ1NwYWNlQ2hhcjovICQvLG5vblNwYWNlQ2hhcjovW14gXS8sbmV3TGluZUNoYXJHbG9iYWw6L1xcbi9nLHRhYkNoYXJHbG9iYWw6L1xcdC9nLG11bHRpcGxlU3BhY2VHbG9iYWw6L1xccysvZyxibGFua0xpbmU6L15bIFxcdF0qJC8sZG91YmxlQmxhbmtMaW5lOi9cXG5bIFxcdF0qXFxuWyBcXHRdKiQvLGJsb2NrcXVvdGVTdGFydDovXiB7MCwzfT4vLGJsb2NrcXVvdGVTZXRleHRSZXBsYWNlOi9cXG4gezAsM30oKD86PSt8LSspICopKD89XFxufCQpL2csYmxvY2txdW90ZVNldGV4dFJlcGxhY2UyOi9eIHswLDN9PlsgXFx0XT8vZ20sbGlzdFJlcGxhY2VUYWJzOi9eXFx0Ky8sbGlzdFJlcGxhY2VOZXN0aW5nOi9eIHsxLDR9KD89KCB7NH0pKlteIF0pL2csbGlzdElzVGFzazovXlxcW1sgeFhdXFxdICtcXFMvLGxpc3RSZXBsYWNlVGFzazovXlxcW1sgeFhdXFxdICsvLGxpc3RUYXNrQ2hlY2tib3g6L1xcW1sgeFhdXFxdLyxhbnlMaW5lOi9cXG4uKlxcbi8saHJlZkJyYWNrZXRzOi9ePCguKik+JC8sdGFibGVEZWxpbWl0ZXI6L1s6fF0vLHRhYmxlQWxpZ25DaGFyczovXlxcfHxcXHwgKiQvZyx0YWJsZVJvd0JsYW5rTGluZTovXFxuWyBcXHRdKiQvLHRhYmxlQWxpZ25SaWdodDovXiAqLSs6ICokLyx0YWJsZUFsaWduQ2VudGVyOi9eICo6LSs6ICokLyx0YWJsZUFsaWduTGVmdDovXiAqOi0rICokLyxzdGFydEFUYWc6L148YSAvaSxlbmRBVGFnOi9ePFxcL2E+L2ksc3RhcnRQcmVTY3JpcHRUYWc6L148KHByZXxjb2RlfGtiZHxzY3JpcHQpKFxcc3w+KS9pLGVuZFByZVNjcmlwdFRhZzovXjxcXC8ocHJlfGNvZGV8a2JkfHNjcmlwdCkoXFxzfD4pL2ksc3RhcnRBbmdsZUJyYWNrZXQ6L148LyxlbmRBbmdsZUJyYWNrZXQ6Lz4kLyxwZWRhbnRpY0hyZWZUaXRsZTovXihbXidcIl0qW15cXHNdKVxccysoWydcIl0pKC4qKVxcMi8sdW5pY29kZUFscGhhTnVtZXJpYzovW1xccHtMfVxccHtOfV0vdSxlc2NhcGVUZXN0Oi9bJjw+XCInXS8sZXNjYXBlUmVwbGFjZTovWyY8PlwiJ10vZyxlc2NhcGVUZXN0Tm9FbmNvZGU6L1s8PlwiJ118Jig/ISgjXFxkezEsN318I1tYeF1bYS1mQS1GMC05XXsxLDZ9fFxcdyspOykvLGVzY2FwZVJlcGxhY2VOb0VuY29kZTovWzw+XCInXXwmKD8hKCNcXGR7MSw3fXwjW1h4XVthLWZBLUYwLTldezEsNn18XFx3Kyk7KS9nLHVuZXNjYXBlVGVzdDovJigjKD86XFxkKyl8KD86I3hbMC05QS1GYS1mXSspfCg/OlxcdyspKTs/L2lnLGNhcmV0Oi8oXnxbXlxcW10pXFxeL2cscGVyY2VudERlY29kZTovJTI1L2csZmluZFBpcGU6L1xcfC9nLHNwbGl0UGlwZTovIFxcfC8sc2xhc2hQaXBlOi9cXFxcXFx8L2csY2FycmlhZ2VSZXR1cm46L1xcclxcbnxcXHIvZyxzcGFjZUxpbmU6L14gKyQvZ20sbm90U3BhY2VTdGFydDovXlxcUyovLGVuZGluZ05ld2xpbmU6L1xcbiQvLGxpc3RJdGVtUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiggezAsM30ke3V9KSgoPzpbXHQgXVteXFxcXG5dKik/KD86XFxcXG58JCkpYCksbmV4dEJ1bGxldFJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSg/OlsqKy1dfFxcXFxkezEsOX1bLildKSgoPzpbIFx0XVteXFxcXG5dKik/KD86XFxcXG58JCkpYCksaHJSZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0oKD86LSAqKXszLH18KD86XyAqKXszLH18KD86XFxcXCogKil7Myx9KSg/OlxcXFxuK3wkKWApLGZlbmNlc0JlZ2luUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19KD86XFxgXFxgXFxgfH5+filgKSxoZWFkaW5nQmVnaW5SZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0jYCksaHRtbEJlZ2luUmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19PCg/OlthLXpdLio+fCEtLSlgLFwiaVwiKX0seGU9L14oPzpbIFxcdF0qKD86XFxufCQpKSsvLGJlPS9eKCg/OiB7NH18IHswLDN9XFx0KVteXFxuXSsoPzpcXG4oPzpbIFxcdF0qKD86XFxufCQpKSopPykrLyxSZT0vXiB7MCwzfShgezMsfSg/PVteYFxcbl0qKD86XFxufCQpKXx+ezMsfSkoW15cXG5dKikoPzpcXG58JCkoPzp8KFtcXHNcXFNdKj8pKD86XFxufCQpKSg/OiB7MCwzfVxcMVt+YF0qICooPz1cXG58JCl8JCkvLEk9L14gezAsM30oKD86LVtcXHQgXSopezMsfXwoPzpfWyBcXHRdKil7Myx9fCg/OlxcKlsgXFx0XSopezMsfSkoPzpcXG4rfCQpLyxUZT0vXiB7MCwzfSgjezEsNn0pKD89XFxzfCQpKC4qKSg/Olxcbit8JCkvLE49Lyg/OlsqKy1dfFxcZHsxLDl9Wy4pXSkvLHJlPS9eKD8hYnVsbCB8YmxvY2tDb2RlfGZlbmNlc3xibG9ja3F1b3RlfGhlYWRpbmd8aHRtbHx0YWJsZSkoKD86LnxcXG4oPyFcXHMqP1xcbnxidWxsIHxibG9ja0NvZGV8ZmVuY2VzfGJsb2NrcXVvdGV8aGVhZGluZ3xodG1sfHRhYmxlKSkrPylcXG4gezAsM30oPSt8LSspICooPzpcXG4rfCQpLyxzZT1rKHJlKS5yZXBsYWNlKC9idWxsL2csTikucmVwbGFjZSgvYmxvY2tDb2RlL2csLyg/OiB7NH18IHswLDN9XFx0KS8pLnJlcGxhY2UoL2ZlbmNlcy9nLC8gezAsM30oPzpgezMsfXx+ezMsfSkvKS5yZXBsYWNlKC9ibG9ja3F1b3RlL2csLyB7MCwzfT4vKS5yZXBsYWNlKC9oZWFkaW5nL2csLyB7MCwzfSN7MSw2fS8pLnJlcGxhY2UoL2h0bWwvZywvIHswLDN9PFteXFxuPl0rPlxcbi8pLnJlcGxhY2UoL1xcfHRhYmxlL2csXCJcIikuZ2V0UmVnZXgoKSxPZT1rKHJlKS5yZXBsYWNlKC9idWxsL2csTikucmVwbGFjZSgvYmxvY2tDb2RlL2csLyg/OiB7NH18IHswLDN9XFx0KS8pLnJlcGxhY2UoL2ZlbmNlcy9nLC8gezAsM30oPzpgezMsfXx+ezMsfSkvKS5yZXBsYWNlKC9ibG9ja3F1b3RlL2csLyB7MCwzfT4vKS5yZXBsYWNlKC9oZWFkaW5nL2csLyB7MCwzfSN7MSw2fS8pLnJlcGxhY2UoL2h0bWwvZywvIHswLDN9PFteXFxuPl0rPlxcbi8pLnJlcGxhY2UoL3RhYmxlL2csLyB7MCwzfVxcfD8oPzpbOlxcLSBdKlxcfCkrW1xcOlxcLSBdKlxcbi8pLmdldFJlZ2V4KCksUT0vXihbXlxcbl0rKD86XFxuKD8haHJ8aGVhZGluZ3xsaGVhZGluZ3xibG9ja3F1b3RlfGZlbmNlc3xsaXN0fGh0bWx8dGFibGV8ICtcXG4pW15cXG5dKykqKS8sd2U9L15bXlxcbl0rLyxGPS8oPyFcXHMqXFxdKSg/OlxcXFxbXFxzXFxTXXxbXlxcW1xcXVxcXFxdKSsvLHllPWsoL14gezAsM31cXFsobGFiZWwpXFxdOiAqKD86XFxuWyBcXHRdKik/KFtePFxcc11bXlxcc10qfDwuKj8+KSg/Oig/OiArKD86XFxuWyBcXHRdKik/fCAqXFxuWyBcXHRdKikodGl0bGUpKT8gKig/Olxcbit8JCkvKS5yZXBsYWNlKFwibGFiZWxcIixGKS5yZXBsYWNlKFwidGl0bGVcIiwvKD86XCIoPzpcXFxcXCI/fFteXCJcXFxcXSkqXCJ8J1teJ1xcbl0qKD86XFxuW14nXFxuXSspKlxcbj8nfFxcKFteKCldKlxcKSkvKS5nZXRSZWdleCgpLFBlPWsoL14oIHswLDN9YnVsbCkoWyBcXHRdW15cXG5dKz8pPyg/OlxcbnwkKS8pLnJlcGxhY2UoL2J1bGwvZyxOKS5nZXRSZWdleCgpLHY9XCJhZGRyZXNzfGFydGljbGV8YXNpZGV8YmFzZXxiYXNlZm9udHxibG9ja3F1b3RlfGJvZHl8Y2FwdGlvbnxjZW50ZXJ8Y29sfGNvbGdyb3VwfGRkfGRldGFpbHN8ZGlhbG9nfGRpcnxkaXZ8ZGx8ZHR8ZmllbGRzZXR8ZmlnY2FwdGlvbnxmaWd1cmV8Zm9vdGVyfGZvcm18ZnJhbWV8ZnJhbWVzZXR8aFsxLTZdfGhlYWR8aGVhZGVyfGhyfGh0bWx8aWZyYW1lfGxlZ2VuZHxsaXxsaW5rfG1haW58bWVudXxtZW51aXRlbXxtZXRhfG5hdnxub2ZyYW1lc3xvbHxvcHRncm91cHxvcHRpb258cHxwYXJhbXxzZWFyY2h8c2VjdGlvbnxzdW1tYXJ5fHRhYmxlfHRib2R5fHRkfHRmb290fHRofHRoZWFkfHRpdGxlfHRyfHRyYWNrfHVsXCIsaj0vPCEtLSg/Oi0/PnxbXFxzXFxTXSo/KD86LS0+fCQpKS8sU2U9ayhcIl4gezAsM30oPzo8KHNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpW1xcXFxzPl1bXFxcXHNcXFxcU10qPyg/OjwvXFxcXDE+W15cXFxcbl0qXFxcXG4rfCQpfGNvbW1lbnRbXlxcXFxuXSooXFxcXG4rfCQpfDxcXFxcP1tcXFxcc1xcXFxTXSo/KD86XFxcXD8+XFxcXG4qfCQpfDwhW0EtWl1bXFxcXHNcXFxcU10qPyg/Oj5cXFxcbip8JCl8PCFcXFxcW0NEQVRBXFxcXFtbXFxcXHNcXFxcU10qPyg/OlxcXFxdXFxcXF0+XFxcXG4qfCQpfDwvPyh0YWcpKD86ICt8XFxcXG58Lz8+KVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG5bIFx0XSopK1xcXFxufCQpfDwoPyFzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKShbYS16XVtcXFxcdy1dKikoPzphdHRyaWJ1dGUpKj8gKi8/Pig/PVsgXFxcXHRdKig/OlxcXFxufCQpKVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG5bIFx0XSopK1xcXFxufCQpfDwvKD8hc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSlbYS16XVtcXFxcdy1dKlxcXFxzKj4oPz1bIFxcXFx0XSooPzpcXFxcbnwkKSlbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuWyBcdF0qKStcXFxcbnwkKSlcIixcImlcIikucmVwbGFjZShcImNvbW1lbnRcIixqKS5yZXBsYWNlKFwidGFnXCIsdikucmVwbGFjZShcImF0dHJpYnV0ZVwiLC8gK1thLXpBLVo6X11bXFx3LjotXSooPzogKj0gKlwiW15cIlxcbl0qXCJ8ICo9IConW14nXFxuXSonfCAqPSAqW15cXHNcIic9PD5gXSspPy8pLmdldFJlZ2V4KCksaWU9ayhRKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLFwiIHswLDN9I3sxLDZ9KD86XFxcXHN8JClcIikucmVwbGFjZShcInxsaGVhZGluZ1wiLFwiXCIpLnJlcGxhY2UoXCJ8dGFibGVcIixcIlwiKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwiZmVuY2VzXCIsXCIgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG5cIikucmVwbGFjZShcImxpc3RcIixcIiB7MCwzfSg/OlsqKy1dfDFbLildKSBcIikucmVwbGFjZShcImh0bWxcIixcIjwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSlcIikucmVwbGFjZShcInRhZ1wiLHYpLmdldFJlZ2V4KCksJGU9aygvXiggezAsM30+ID8ocGFyYWdyYXBofFteXFxuXSopKD86XFxufCQpKSsvKS5yZXBsYWNlKFwicGFyYWdyYXBoXCIsaWUpLmdldFJlZ2V4KCksVT17YmxvY2txdW90ZTokZSxjb2RlOmJlLGRlZjp5ZSxmZW5jZXM6UmUsaGVhZGluZzpUZSxocjpJLGh0bWw6U2UsbGhlYWRpbmc6c2UsbGlzdDpQZSxuZXdsaW5lOnhlLHBhcmFncmFwaDppZSx0YWJsZTpDLHRleHQ6d2V9LHRlPWsoXCJeICooW15cXFxcbiBdLiopXFxcXG4gezAsM30oKD86XFxcXHwgKik/Oj8tKzo/ICooPzpcXFxcfCAqOj8tKzo/ICopKig/OlxcXFx8ICopPykoPzpcXFxcbigoPzooPyEgKlxcXFxufGhyfGhlYWRpbmd8YmxvY2txdW90ZXxjb2RlfGZlbmNlc3xsaXN0fGh0bWwpLiooPzpcXFxcbnwkKSkqKVxcXFxuKnwkKVwiKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLFwiIHswLDN9I3sxLDZ9KD86XFxcXHN8JClcIikucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcImNvZGVcIixcIig/OiB7NH18IHswLDN9XHQpW15cXFxcbl1cIikucmVwbGFjZShcImZlbmNlc1wiLFwiIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuXCIpLnJlcGxhY2UoXCJsaXN0XCIsXCIgezAsM30oPzpbKistXXwxWy4pXSkgXCIpLnJlcGxhY2UoXCJodG1sXCIsXCI8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pXCIpLnJlcGxhY2UoXCJ0YWdcIix2KS5nZXRSZWdleCgpLF9lPXsuLi5VLGxoZWFkaW5nOk9lLHRhYmxlOnRlLHBhcmFncmFwaDprKFEpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsXCIgezAsM30jezEsNn0oPzpcXFxcc3wkKVwiKS5yZXBsYWNlKFwifGxoZWFkaW5nXCIsXCJcIikucmVwbGFjZShcInRhYmxlXCIsdGUpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJmZW5jZXNcIixcIiB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcblwiKS5yZXBsYWNlKFwibGlzdFwiLFwiIHswLDN9KD86WyorLV18MVsuKV0pIFwiKS5yZXBsYWNlKFwiaHRtbFwiLFwiPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKVwiKS5yZXBsYWNlKFwidGFnXCIsdikuZ2V0UmVnZXgoKX0sTGU9ey4uLlUsaHRtbDprKGBeICooPzpjb21tZW50ICooPzpcXFxcbnxcXFxccyokKXw8KHRhZylbXFxcXHNcXFxcU10rPzwvXFxcXDE+ICooPzpcXFxcbnsyLH18XFxcXHMqJCl8PHRhZyg/OlwiW15cIl0qXCJ8J1teJ10qJ3xcXFxcc1teJ1wiLz5cXFxcc10qKSo/Lz8+ICooPzpcXFxcbnsyLH18XFxcXHMqJCkpYCkucmVwbGFjZShcImNvbW1lbnRcIixqKS5yZXBsYWNlKC90YWcvZyxcIig/ISg/OmF8ZW18c3Ryb25nfHNtYWxsfHN8Y2l0ZXxxfGRmbnxhYmJyfGRhdGF8dGltZXxjb2RlfHZhcnxzYW1wfGtiZHxzdWJ8c3VwfGl8Ynx1fG1hcmt8cnVieXxydHxycHxiZGl8YmRvfHNwYW58YnJ8d2JyfGluc3xkZWx8aW1nKVxcXFxiKVxcXFx3Kyg/ITp8W15cXFxcd1xcXFxzQF0qQClcXFxcYlwiKS5nZXRSZWdleCgpLGRlZjovXiAqXFxbKFteXFxdXSspXFxdOiAqPD8oW15cXHM+XSspPj8oPzogKyhbXCIoXVteXFxuXStbXCIpXSkpPyAqKD86XFxuK3wkKS8saGVhZGluZzovXigjezEsNn0pKC4qKSg/Olxcbit8JCkvLGZlbmNlczpDLGxoZWFkaW5nOi9eKC4rPylcXG4gezAsM30oPSt8LSspICooPzpcXG4rfCQpLyxwYXJhZ3JhcGg6ayhRKS5yZXBsYWNlKFwiaHJcIixJKS5yZXBsYWNlKFwiaGVhZGluZ1wiLGAgKiN7MSw2fSAqW15cbl1gKS5yZXBsYWNlKFwibGhlYWRpbmdcIixzZSkucmVwbGFjZShcInx0YWJsZVwiLFwiXCIpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJ8ZmVuY2VzXCIsXCJcIikucmVwbGFjZShcInxsaXN0XCIsXCJcIikucmVwbGFjZShcInxodG1sXCIsXCJcIikucmVwbGFjZShcInx0YWdcIixcIlwiKS5nZXRSZWdleCgpfSxNZT0vXlxcXFwoWyFcIiMkJSYnKCkqKyxcXC0uLzo7PD0+P0BcXFtcXF1cXFxcXl9ge3x9fl0pLyx6ZT0vXihgKykoW15gXXxbXmBdW1xcc1xcU10qP1teYF0pXFwxKD8hYCkvLG9lPS9eKCB7Mix9fFxcXFwpXFxuKD8hXFxzKiQpLyxBZT0vXihgK3xbXmBdKSg/Oig/PSB7Mix9XFxuKXxbXFxzXFxTXSo/KD86KD89W1xcXFw8IVxcW2AqX118XFxiX3wkKXxbXiBdKD89IHsyLH1cXG4pKSkvLEQ9L1tcXHB7UH1cXHB7U31dL3UsSz0vW1xcc1xccHtQfVxccHtTfV0vdSxhZT0vW15cXHNcXHB7UH1cXHB7U31dL3UsQ2U9aygvXigoPyFbKl9dKXB1bmN0U3BhY2UpLyxcInVcIikucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEspLmdldFJlZ2V4KCksbGU9Lyg/IX4pW1xccHtQfVxccHtTfV0vdSxJZT0vKD8hfilbXFxzXFxwe1B9XFxwe1N9XS91LEVlPS8oPzpbXlxcc1xccHtQfVxccHtTfV18fikvdSxCZT1rKC9saW5rfHByZWNvZGUtY29kZXxodG1sLyxcImdcIikucmVwbGFjZShcImxpbmtcIiwvXFxbKD86W15cXFtcXF1gXXwoPzxhPmArKVteYF0rXFxrPGE+KD8hYCkpKj9cXF1cXCgoPzpcXFxcW1xcc1xcU118W15cXFxcXFwoXFwpXXxcXCgoPzpcXFxcW1xcc1xcU118W15cXFxcXFwoXFwpXSkqXFwpKSpcXCkvKS5yZXBsYWNlKFwicHJlY29kZS1cIixtZT9cIig/PCFgKSgpXCI6XCIoXl58W15gXSlcIikucmVwbGFjZShcImNvZGVcIiwvKD88Yj5gKylbXmBdK1xcazxiPig/IWApLykucmVwbGFjZShcImh0bWxcIiwvPCg/ISApW148Pl0qPz4vKS5nZXRSZWdleCgpLHVlPS9eKD86XFwqKyg/OigoPyFcXCopcHVuY3QpfFteXFxzKl0pKXxeXysoPzooKD8hXylwdW5jdCl8KFteXFxzX10pKS8scWU9ayh1ZSxcInVcIikucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLHZlPWsodWUsXCJ1XCIpLnJlcGxhY2UoL3B1bmN0L2csbGUpLmdldFJlZ2V4KCkscGU9XCJeW15fKl0qP19fW15fKl0qP1xcXFwqW15fKl0qPyg/PV9fKXxbXipdKyg/PVteKl0pfCg/IVxcXFwqKXB1bmN0KFxcXFwqKykoPz1bXFxcXHNdfCQpfG5vdFB1bmN0U3BhY2UoXFxcXCorKSg/IVxcXFwqKSg/PXB1bmN0U3BhY2V8JCl8KD8hXFxcXCopcHVuY3RTcGFjZShcXFxcKispKD89bm90UHVuY3RTcGFjZSl8W1xcXFxzXShcXFxcKispKD8hXFxcXCopKD89cHVuY3QpfCg/IVxcXFwqKXB1bmN0KFxcXFwqKykoPyFcXFxcKikoPz1wdW5jdCl8bm90UHVuY3RTcGFjZShcXFxcKispKD89bm90UHVuY3RTcGFjZSlcIixEZT1rKHBlLFwiZ3VcIikucmVwbGFjZSgvbm90UHVuY3RTcGFjZS9nLGFlKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSykucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLEhlPWsocGUsXCJndVwiKS5yZXBsYWNlKC9ub3RQdW5jdFNwYWNlL2csRWUpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxJZSkucmVwbGFjZSgvcHVuY3QvZyxsZSkuZ2V0UmVnZXgoKSxaZT1rKFwiXlteXypdKj9cXFxcKlxcXFwqW15fKl0qP19bXl8qXSo/KD89XFxcXCpcXFxcKil8W15fXSsoPz1bXl9dKXwoPyFfKXB1bmN0KF8rKSg/PVtcXFxcc118JCl8bm90UHVuY3RTcGFjZShfKykoPyFfKSg/PXB1bmN0U3BhY2V8JCl8KD8hXylwdW5jdFNwYWNlKF8rKSg/PW5vdFB1bmN0U3BhY2UpfFtcXFxcc10oXyspKD8hXykoPz1wdW5jdCl8KD8hXylwdW5jdChfKykoPyFfKSg/PXB1bmN0KVwiLFwiZ3VcIikucmVwbGFjZSgvbm90UHVuY3RTcGFjZS9nLGFlKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSykucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLEdlPWsoL1xcXFwocHVuY3QpLyxcImd1XCIpLnJlcGxhY2UoL3B1bmN0L2csRCkuZ2V0UmVnZXgoKSxOZT1rKC9ePChzY2hlbWU6W15cXHNcXHgwMC1cXHgxZjw+XSp8ZW1haWwpPi8pLnJlcGxhY2UoXCJzY2hlbWVcIiwvW2EtekEtWl1bYS16QS1aMC05Ky4tXXsxLDMxfS8pLnJlcGxhY2UoXCJlbWFpbFwiLC9bYS16QS1aMC05LiEjJCUmJyorLz0/Xl9ge3x9fi1dKyhAKVthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykrKD8hWy1fXSkvKS5nZXRSZWdleCgpLFFlPWsoaikucmVwbGFjZShcIig/Oi0tPnwkKVwiLFwiLS0+XCIpLmdldFJlZ2V4KCksRmU9ayhcIl5jb21tZW50fF48L1thLXpBLVpdW1xcXFx3Oi1dKlxcXFxzKj58XjxbYS16QS1aXVtcXFxcdy1dKig/OmF0dHJpYnV0ZSkqP1xcXFxzKi8/PnxePFxcXFw/W1xcXFxzXFxcXFNdKj9cXFxcPz58XjwhW2EtekEtWl0rXFxcXHNbXFxcXHNcXFxcU10qPz58XjwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj9cXFxcXVxcXFxdPlwiKS5yZXBsYWNlKFwiY29tbWVudFwiLFFlKS5yZXBsYWNlKFwiYXR0cmlidXRlXCIsL1xccytbYS16QS1aOl9dW1xcdy46LV0qKD86XFxzKj1cXHMqXCJbXlwiXSpcInxcXHMqPVxccyonW14nXSonfFxccyo9XFxzKlteXFxzXCInPTw+YF0rKT8vKS5nZXRSZWdleCgpLHE9Lyg/OlxcWyg/OlxcXFxbXFxzXFxTXXxbXlxcW1xcXVxcXFxdKSpcXF18XFxcXFtcXHNcXFNdfGArW15gXSo/YCsoPyFgKXxbXlxcW1xcXVxcXFxgXSkqPy8samU9aygvXiE/XFxbKGxhYmVsKVxcXVxcKFxccyooaHJlZikoPzooPzpbIFxcdF0qKD86XFxuWyBcXHRdKik/KSh0aXRsZSkpP1xccypcXCkvKS5yZXBsYWNlKFwibGFiZWxcIixxKS5yZXBsYWNlKFwiaHJlZlwiLC88KD86XFxcXC58W15cXG48PlxcXFxdKSs+fFteIFxcdFxcblxceDAwLVxceDFmXSovKS5yZXBsYWNlKFwidGl0bGVcIiwvXCIoPzpcXFxcXCI/fFteXCJcXFxcXSkqXCJ8Jyg/OlxcXFwnP3xbXidcXFxcXSkqJ3xcXCgoPzpcXFxcXFwpP3xbXilcXFxcXSkqXFwpLykuZ2V0UmVnZXgoKSxjZT1rKC9eIT9cXFsobGFiZWwpXFxdXFxbKHJlZilcXF0vKS5yZXBsYWNlKFwibGFiZWxcIixxKS5yZXBsYWNlKFwicmVmXCIsRikuZ2V0UmVnZXgoKSxoZT1rKC9eIT9cXFsocmVmKVxcXSg/OlxcW1xcXSk/LykucmVwbGFjZShcInJlZlwiLEYpLmdldFJlZ2V4KCksVWU9ayhcInJlZmxpbmt8bm9saW5rKD8hXFxcXCgpXCIsXCJnXCIpLnJlcGxhY2UoXCJyZWZsaW5rXCIsY2UpLnJlcGxhY2UoXCJub2xpbmtcIixoZSkuZ2V0UmVnZXgoKSxuZT0vW2hIXVt0VF1bdFRdW3BQXVtzU10/fFtmRl1bdFRdW3BQXS8sVz17X2JhY2twZWRhbDpDLGFueVB1bmN0dWF0aW9uOkdlLGF1dG9saW5rOk5lLGJsb2NrU2tpcDpCZSxicjpvZSxjb2RlOnplLGRlbDpDLGVtU3Ryb25nTERlbGltOnFlLGVtU3Ryb25nUkRlbGltQXN0OkRlLGVtU3Ryb25nUkRlbGltVW5kOlplLGVzY2FwZTpNZSxsaW5rOmplLG5vbGluazpoZSxwdW5jdHVhdGlvbjpDZSxyZWZsaW5rOmNlLHJlZmxpbmtTZWFyY2g6VWUsdGFnOkZlLHRleHQ6QWUsdXJsOkN9LEtlPXsuLi5XLGxpbms6aygvXiE/XFxbKGxhYmVsKVxcXVxcKCguKj8pXFwpLykucmVwbGFjZShcImxhYmVsXCIscSkuZ2V0UmVnZXgoKSxyZWZsaW5rOmsoL14hP1xcWyhsYWJlbClcXF1cXHMqXFxbKFteXFxdXSopXFxdLykucmVwbGFjZShcImxhYmVsXCIscSkuZ2V0UmVnZXgoKX0sRz17Li4uVyxlbVN0cm9uZ1JEZWxpbUFzdDpIZSxlbVN0cm9uZ0xEZWxpbTp2ZSx1cmw6aygvXigoPzpwcm90b2NvbCk6XFwvXFwvfHd3d1xcLikoPzpbYS16QS1aMC05XFwtXStcXC4/KStbXlxcczxdKnxeZW1haWwvKS5yZXBsYWNlKFwicHJvdG9jb2xcIixuZSkucmVwbGFjZShcImVtYWlsXCIsL1tBLVphLXowLTkuXystXSsoQClbYS16QS1aMC05LV9dKyg/OlxcLlthLXpBLVowLTktX10qW2EtekEtWjAtOV0pKyg/IVstX10pLykuZ2V0UmVnZXgoKSxfYmFja3BlZGFsOi8oPzpbXj8hLiw6OypfJ1wifigpJl0rfFxcKFteKV0qXFwpfCYoPyFbYS16QS1aMC05XSs7JCl8Wz8hLiw6OypfJ1wifildKyg/ISQpKSsvLGRlbDovXih+fj8pKD89W15cXHN+XSkoKD86XFxcXFtcXHNcXFNdfFteXFxcXF0pKj8oPzpcXFxcW1xcc1xcU118W15cXHN+XFxcXF0pKVxcMSg/PVtefl18JCkvLHRleHQ6aygvXihbYH5dK3xbXmB+XSkoPzooPz0gezIsfVxcbil8KD89W2EtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXStAKXxbXFxzXFxTXSo/KD86KD89W1xcXFw8IVxcW2Aqfl9dfFxcYl98cHJvdG9jb2w6XFwvXFwvfHd3d1xcLnwkKXxbXiBdKD89IHsyLH1cXG4pfFteYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dKD89W2EtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXStAKSkpLykucmVwbGFjZShcInByb3RvY29sXCIsbmUpLmdldFJlZ2V4KCl9LFdlPXsuLi5HLGJyOmsob2UpLnJlcGxhY2UoXCJ7Mix9XCIsXCIqXCIpLmdldFJlZ2V4KCksdGV4dDprKEcudGV4dCkucmVwbGFjZShcIlxcXFxiX1wiLFwiXFxcXGJffCB7Mix9XFxcXG5cIikucmVwbGFjZSgvXFx7MixcXH0vZyxcIipcIikuZ2V0UmVnZXgoKX0sRT17bm9ybWFsOlUsZ2ZtOl9lLHBlZGFudGljOkxlfSxNPXtub3JtYWw6VyxnZm06RyxicmVha3M6V2UscGVkYW50aWM6S2V9O3ZhciBYZT17XCImXCI6XCImYW1wO1wiLFwiPFwiOlwiJmx0O1wiLFwiPlwiOlwiJmd0O1wiLCdcIic6XCImcXVvdDtcIixcIidcIjpcIiYjMzk7XCJ9LGtlPXU9PlhlW3VdO2Z1bmN0aW9uIHcodSxlKXtpZihlKXtpZihtLmVzY2FwZVRlc3QudGVzdCh1KSlyZXR1cm4gdS5yZXBsYWNlKG0uZXNjYXBlUmVwbGFjZSxrZSl9ZWxzZSBpZihtLmVzY2FwZVRlc3ROb0VuY29kZS50ZXN0KHUpKXJldHVybiB1LnJlcGxhY2UobS5lc2NhcGVSZXBsYWNlTm9FbmNvZGUsa2UpO3JldHVybiB1fWZ1bmN0aW9uIFgodSl7dHJ5e3U9ZW5jb2RlVVJJKHUpLnJlcGxhY2UobS5wZXJjZW50RGVjb2RlLFwiJVwiKX1jYXRjaHtyZXR1cm4gbnVsbH1yZXR1cm4gdX1mdW5jdGlvbiBKKHUsZSl7bGV0IHQ9dS5yZXBsYWNlKG0uZmluZFBpcGUsKGkscyxhKT0+e2xldCBvPSExLGw9cztmb3IoOy0tbD49MCYmYVtsXT09PVwiXFxcXFwiOylvPSFvO3JldHVybiBvP1wifFwiOlwiIHxcIn0pLG49dC5zcGxpdChtLnNwbGl0UGlwZSkscj0wO2lmKG5bMF0udHJpbSgpfHxuLnNoaWZ0KCksbi5sZW5ndGg+MCYmIW4uYXQoLTEpPy50cmltKCkmJm4ucG9wKCksZSlpZihuLmxlbmd0aD5lKW4uc3BsaWNlKGUpO2Vsc2UgZm9yKDtuLmxlbmd0aDxlOyluLnB1c2goXCJcIik7Zm9yKDtyPG4ubGVuZ3RoO3IrKyluW3JdPW5bcl0udHJpbSgpLnJlcGxhY2UobS5zbGFzaFBpcGUsXCJ8XCIpO3JldHVybiBufWZ1bmN0aW9uIHoodSxlLHQpe2xldCBuPXUubGVuZ3RoO2lmKG49PT0wKXJldHVyblwiXCI7bGV0IHI9MDtmb3IoO3I8bjspe2xldCBpPXUuY2hhckF0KG4tci0xKTtpZihpPT09ZSYmIXQpcisrO2Vsc2UgaWYoaSE9PWUmJnQpcisrO2Vsc2UgYnJlYWt9cmV0dXJuIHUuc2xpY2UoMCxuLXIpfWZ1bmN0aW9uIGRlKHUsZSl7aWYodS5pbmRleE9mKGVbMV0pPT09LTEpcmV0dXJuLTE7bGV0IHQ9MDtmb3IobGV0IG49MDtuPHUubGVuZ3RoO24rKylpZih1W25dPT09XCJcXFxcXCIpbisrO2Vsc2UgaWYodVtuXT09PWVbMF0pdCsrO2Vsc2UgaWYodVtuXT09PWVbMV0mJih0LS0sdDwwKSlyZXR1cm4gbjtyZXR1cm4gdD4wPy0yOi0xfWZ1bmN0aW9uIGdlKHUsZSx0LG4scil7bGV0IGk9ZS5ocmVmLHM9ZS50aXRsZXx8bnVsbCxhPXVbMV0ucmVwbGFjZShyLm90aGVyLm91dHB1dExpbmtSZXBsYWNlLFwiJDFcIik7bi5zdGF0ZS5pbkxpbms9ITA7bGV0IG89e3R5cGU6dVswXS5jaGFyQXQoMCk9PT1cIiFcIj9cImltYWdlXCI6XCJsaW5rXCIscmF3OnQsaHJlZjppLHRpdGxlOnMsdGV4dDphLHRva2VuczpuLmlubGluZVRva2VucyhhKX07cmV0dXJuIG4uc3RhdGUuaW5MaW5rPSExLG99ZnVuY3Rpb24gSmUodSxlLHQpe2xldCBuPXUubWF0Y2godC5vdGhlci5pbmRlbnRDb2RlQ29tcGVuc2F0aW9uKTtpZihuPT09bnVsbClyZXR1cm4gZTtsZXQgcj1uWzFdO3JldHVybiBlLnNwbGl0KGBcbmApLm1hcChpPT57bGV0IHM9aS5tYXRjaCh0Lm90aGVyLmJlZ2lubmluZ1NwYWNlKTtpZihzPT09bnVsbClyZXR1cm4gaTtsZXRbYV09cztyZXR1cm4gYS5sZW5ndGg+PXIubGVuZ3RoP2kuc2xpY2Uoci5sZW5ndGgpOml9KS5qb2luKGBcbmApfXZhciB5PWNsYXNze29wdGlvbnM7cnVsZXM7bGV4ZXI7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFR9c3BhY2UoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5uZXdsaW5lLmV4ZWMoZSk7aWYodCYmdFswXS5sZW5ndGg+MClyZXR1cm57dHlwZTpcInNwYWNlXCIscmF3OnRbMF19fWNvZGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5jb2RlLmV4ZWMoZSk7aWYodCl7bGV0IG49dFswXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuY29kZVJlbW92ZUluZGVudCxcIlwiKTtyZXR1cm57dHlwZTpcImNvZGVcIixyYXc6dFswXSxjb2RlQmxvY2tTdHlsZTpcImluZGVudGVkXCIsdGV4dDp0aGlzLm9wdGlvbnMucGVkYW50aWM/bjp6KG4sYFxuYCl9fX1mZW5jZXMoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5mZW5jZXMuZXhlYyhlKTtpZih0KXtsZXQgbj10WzBdLHI9SmUobix0WzNdfHxcIlwiLHRoaXMucnVsZXMpO3JldHVybnt0eXBlOlwiY29kZVwiLHJhdzpuLGxhbmc6dFsyXT90WzJdLnRyaW0oKS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIik6dFsyXSx0ZXh0OnJ9fX1oZWFkaW5nKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suaGVhZGluZy5leGVjKGUpO2lmKHQpe2xldCBuPXRbMl0udHJpbSgpO2lmKHRoaXMucnVsZXMub3RoZXIuZW5kaW5nSGFzaC50ZXN0KG4pKXtsZXQgcj16KG4sXCIjXCIpOyh0aGlzLm9wdGlvbnMucGVkYW50aWN8fCFyfHx0aGlzLnJ1bGVzLm90aGVyLmVuZGluZ1NwYWNlQ2hhci50ZXN0KHIpKSYmKG49ci50cmltKCkpfXJldHVybnt0eXBlOlwiaGVhZGluZ1wiLHJhdzp0WzBdLGRlcHRoOnRbMV0ubGVuZ3RoLHRleHQ6bix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUobil9fX1ocihlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmhyLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImhyXCIscmF3OnoodFswXSxgXG5gKX19YmxvY2txdW90ZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmJsb2NrcXVvdGUuZXhlYyhlKTtpZih0KXtsZXQgbj16KHRbMF0sYFxuYCkuc3BsaXQoYFxuYCkscj1cIlwiLGk9XCJcIixzPVtdO2Zvcig7bi5sZW5ndGg+MDspe2xldCBhPSExLG89W10sbDtmb3IobD0wO2w8bi5sZW5ndGg7bCsrKWlmKHRoaXMucnVsZXMub3RoZXIuYmxvY2txdW90ZVN0YXJ0LnRlc3QobltsXSkpby5wdXNoKG5bbF0pLGE9ITA7ZWxzZSBpZighYSlvLnB1c2gobltsXSk7ZWxzZSBicmVhaztuPW4uc2xpY2UobCk7bGV0IHA9by5qb2luKGBcbmApLGM9cC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuYmxvY2txdW90ZVNldGV4dFJlcGxhY2UsYFxuICAgICQxYCkucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmJsb2NrcXVvdGVTZXRleHRSZXBsYWNlMixcIlwiKTtyPXI/YCR7cn1cbiR7cH1gOnAsaT1pP2Ake2l9XG4ke2N9YDpjO2xldCBnPXRoaXMubGV4ZXIuc3RhdGUudG9wO2lmKHRoaXMubGV4ZXIuc3RhdGUudG9wPSEwLHRoaXMubGV4ZXIuYmxvY2tUb2tlbnMoYyxzLCEwKSx0aGlzLmxleGVyLnN0YXRlLnRvcD1nLG4ubGVuZ3RoPT09MClicmVhaztsZXQgaD1zLmF0KC0xKTtpZihoPy50eXBlPT09XCJjb2RlXCIpYnJlYWs7aWYoaD8udHlwZT09PVwiYmxvY2txdW90ZVwiKXtsZXQgUj1oLGY9Ui5yYXcrYFxuYCtuLmpvaW4oYFxuYCksTz10aGlzLmJsb2NrcXVvdGUoZik7c1tzLmxlbmd0aC0xXT1PLHI9ci5zdWJzdHJpbmcoMCxyLmxlbmd0aC1SLnJhdy5sZW5ndGgpK08ucmF3LGk9aS5zdWJzdHJpbmcoMCxpLmxlbmd0aC1SLnRleHQubGVuZ3RoKStPLnRleHQ7YnJlYWt9ZWxzZSBpZihoPy50eXBlPT09XCJsaXN0XCIpe2xldCBSPWgsZj1SLnJhdytgXG5gK24uam9pbihgXG5gKSxPPXRoaXMubGlzdChmKTtzW3MubGVuZ3RoLTFdPU8scj1yLnN1YnN0cmluZygwLHIubGVuZ3RoLWgucmF3Lmxlbmd0aCkrTy5yYXcsaT1pLnN1YnN0cmluZygwLGkubGVuZ3RoLVIucmF3Lmxlbmd0aCkrTy5yYXcsbj1mLnN1YnN0cmluZyhzLmF0KC0xKS5yYXcubGVuZ3RoKS5zcGxpdChgXG5gKTtjb250aW51ZX19cmV0dXJue3R5cGU6XCJibG9ja3F1b3RlXCIscmF3OnIsdG9rZW5zOnMsdGV4dDppfX19bGlzdChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmxpc3QuZXhlYyhlKTtpZih0KXtsZXQgbj10WzFdLnRyaW0oKSxyPW4ubGVuZ3RoPjEsaT17dHlwZTpcImxpc3RcIixyYXc6XCJcIixvcmRlcmVkOnIsc3RhcnQ6cj8rbi5zbGljZSgwLC0xKTpcIlwiLGxvb3NlOiExLGl0ZW1zOltdfTtuPXI/YFxcXFxkezEsOX1cXFxcJHtuLnNsaWNlKC0xKX1gOmBcXFxcJHtufWAsdGhpcy5vcHRpb25zLnBlZGFudGljJiYobj1yP246XCJbKistXVwiKTtsZXQgcz10aGlzLnJ1bGVzLm90aGVyLmxpc3RJdGVtUmVnZXgobiksYT0hMTtmb3IoO2U7KXtsZXQgbD0hMSxwPVwiXCIsYz1cIlwiO2lmKCEodD1zLmV4ZWMoZSkpfHx0aGlzLnJ1bGVzLmJsb2NrLmhyLnRlc3QoZSkpYnJlYWs7cD10WzBdLGU9ZS5zdWJzdHJpbmcocC5sZW5ndGgpO2xldCBnPXRbMl0uc3BsaXQoYFxuYCwxKVswXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYWJzLE89PlwiIFwiLnJlcGVhdCgzKk8ubGVuZ3RoKSksaD1lLnNwbGl0KGBcbmAsMSlbMF0sUj0hZy50cmltKCksZj0wO2lmKHRoaXMub3B0aW9ucy5wZWRhbnRpYz8oZj0yLGM9Zy50cmltU3RhcnQoKSk6Uj9mPXRbMV0ubGVuZ3RoKzE6KGY9dFsyXS5zZWFyY2godGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIpLGY9Zj40PzE6ZixjPWcuc2xpY2UoZiksZis9dFsxXS5sZW5ndGgpLFImJnRoaXMucnVsZXMub3RoZXIuYmxhbmtMaW5lLnRlc3QoaCkmJihwKz1oK2BcbmAsZT1lLnN1YnN0cmluZyhoLmxlbmd0aCsxKSxsPSEwKSwhbCl7bGV0IE89dGhpcy5ydWxlcy5vdGhlci5uZXh0QnVsbGV0UmVnZXgoZiksVj10aGlzLnJ1bGVzLm90aGVyLmhyUmVnZXgoZiksWT10aGlzLnJ1bGVzLm90aGVyLmZlbmNlc0JlZ2luUmVnZXgoZiksZWU9dGhpcy5ydWxlcy5vdGhlci5oZWFkaW5nQmVnaW5SZWdleChmKSxmZT10aGlzLnJ1bGVzLm90aGVyLmh0bWxCZWdpblJlZ2V4KGYpO2Zvcig7ZTspe2xldCBIPWUuc3BsaXQoYFxuYCwxKVswXSxBO2lmKGg9SCx0aGlzLm9wdGlvbnMucGVkYW50aWM/KGg9aC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VOZXN0aW5nLFwiICBcIiksQT1oKTpBPWgucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYkNoYXJHbG9iYWwsXCIgICAgXCIpLFkudGVzdChoKXx8ZWUudGVzdChoKXx8ZmUudGVzdChoKXx8Ty50ZXN0KGgpfHxWLnRlc3QoaCkpYnJlYWs7aWYoQS5zZWFyY2godGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIpPj1mfHwhaC50cmltKCkpYys9YFxuYCtBLnNsaWNlKGYpO2Vsc2V7aWYoUnx8Zy5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFiQ2hhckdsb2JhbCxcIiAgICBcIikuc2VhcmNoKHRoaXMucnVsZXMub3RoZXIubm9uU3BhY2VDaGFyKT49NHx8WS50ZXN0KGcpfHxlZS50ZXN0KGcpfHxWLnRlc3QoZykpYnJlYWs7Yys9YFxuYCtofSFSJiYhaC50cmltKCkmJihSPSEwKSxwKz1IK2BcbmAsZT1lLnN1YnN0cmluZyhILmxlbmd0aCsxKSxnPUEuc2xpY2UoZil9fWkubG9vc2V8fChhP2kubG9vc2U9ITA6dGhpcy5ydWxlcy5vdGhlci5kb3VibGVCbGFua0xpbmUudGVzdChwKSYmKGE9ITApKSxpLml0ZW1zLnB1c2goe3R5cGU6XCJsaXN0X2l0ZW1cIixyYXc6cCx0YXNrOiEhdGhpcy5vcHRpb25zLmdmbSYmdGhpcy5ydWxlcy5vdGhlci5saXN0SXNUYXNrLnRlc3QoYyksbG9vc2U6ITEsdGV4dDpjLHRva2VuczpbXX0pLGkucmF3Kz1wfWxldCBvPWkuaXRlbXMuYXQoLTEpO2lmKG8pby5yYXc9by5yYXcudHJpbUVuZCgpLG8udGV4dD1vLnRleHQudHJpbUVuZCgpO2Vsc2UgcmV0dXJuO2kucmF3PWkucmF3LnRyaW1FbmQoKTtmb3IobGV0IGwgb2YgaS5pdGVtcyl7aWYodGhpcy5sZXhlci5zdGF0ZS50b3A9ITEsbC50b2tlbnM9dGhpcy5sZXhlci5ibG9ja1Rva2VucyhsLnRleHQsW10pLGwudGFzayl7aWYobC50ZXh0PWwudGV4dC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpLGwudG9rZW5zWzBdPy50eXBlPT09XCJ0ZXh0XCJ8fGwudG9rZW5zWzBdPy50eXBlPT09XCJwYXJhZ3JhcGhcIil7bC50b2tlbnNbMF0ucmF3PWwudG9rZW5zWzBdLnJhdy5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpLGwudG9rZW5zWzBdLnRleHQ9bC50b2tlbnNbMF0udGV4dC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpO2ZvcihsZXQgYz10aGlzLmxleGVyLmlubGluZVF1ZXVlLmxlbmd0aC0xO2M+PTA7Yy0tKWlmKHRoaXMucnVsZXMub3RoZXIubGlzdElzVGFzay50ZXN0KHRoaXMubGV4ZXIuaW5saW5lUXVldWVbY10uc3JjKSl7dGhpcy5sZXhlci5pbmxpbmVRdWV1ZVtjXS5zcmM9dGhpcy5sZXhlci5pbmxpbmVRdWV1ZVtjXS5zcmMucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLmxpc3RSZXBsYWNlVGFzayxcIlwiKTticmVha319bGV0IHA9dGhpcy5ydWxlcy5vdGhlci5saXN0VGFza0NoZWNrYm94LmV4ZWMobC5yYXcpO2lmKHApe2xldCBjPXt0eXBlOlwiY2hlY2tib3hcIixyYXc6cFswXStcIiBcIixjaGVja2VkOnBbMF0hPT1cIlsgXVwifTtsLmNoZWNrZWQ9Yy5jaGVja2VkLGkubG9vc2U/bC50b2tlbnNbMF0mJltcInBhcmFncmFwaFwiLFwidGV4dFwiXS5pbmNsdWRlcyhsLnRva2Vuc1swXS50eXBlKSYmXCJ0b2tlbnNcImluIGwudG9rZW5zWzBdJiZsLnRva2Vuc1swXS50b2tlbnM/KGwudG9rZW5zWzBdLnJhdz1jLnJhdytsLnRva2Vuc1swXS5yYXcsbC50b2tlbnNbMF0udGV4dD1jLnJhdytsLnRva2Vuc1swXS50ZXh0LGwudG9rZW5zWzBdLnRva2Vucy51bnNoaWZ0KGMpKTpsLnRva2Vucy51bnNoaWZ0KHt0eXBlOlwicGFyYWdyYXBoXCIscmF3OmMucmF3LHRleHQ6Yy5yYXcsdG9rZW5zOltjXX0pOmwudG9rZW5zLnVuc2hpZnQoYyl9fWlmKCFpLmxvb3NlKXtsZXQgcD1sLnRva2Vucy5maWx0ZXIoZz0+Zy50eXBlPT09XCJzcGFjZVwiKSxjPXAubGVuZ3RoPjAmJnAuc29tZShnPT50aGlzLnJ1bGVzLm90aGVyLmFueUxpbmUudGVzdChnLnJhdykpO2kubG9vc2U9Y319aWYoaS5sb29zZSlmb3IobGV0IGwgb2YgaS5pdGVtcyl7bC5sb29zZT0hMDtmb3IobGV0IHAgb2YgbC50b2tlbnMpcC50eXBlPT09XCJ0ZXh0XCImJihwLnR5cGU9XCJwYXJhZ3JhcGhcIil9cmV0dXJuIGl9fWh0bWwoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5odG1sLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImh0bWxcIixibG9jazohMCxyYXc6dFswXSxwcmU6dFsxXT09PVwicHJlXCJ8fHRbMV09PT1cInNjcmlwdFwifHx0WzFdPT09XCJzdHlsZVwiLHRleHQ6dFswXX19ZGVmKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suZGVmLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsxXS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5tdWx0aXBsZVNwYWNlR2xvYmFsLFwiIFwiKSxyPXRbMl0/dFsyXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuaHJlZkJyYWNrZXRzLFwiJDFcIikucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpOlwiXCIsaT10WzNdP3RbM10uc3Vic3RyaW5nKDEsdFszXS5sZW5ndGgtMSkucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpOnRbM107cmV0dXJue3R5cGU6XCJkZWZcIix0YWc6bixyYXc6dFswXSxocmVmOnIsdGl0bGU6aX19fXRhYmxlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2sudGFibGUuZXhlYyhlKTtpZighdHx8IXRoaXMucnVsZXMub3RoZXIudGFibGVEZWxpbWl0ZXIudGVzdCh0WzJdKSlyZXR1cm47bGV0IG49Sih0WzFdKSxyPXRbMl0ucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25DaGFycyxcIlwiKS5zcGxpdChcInxcIiksaT10WzNdPy50cmltKCk/dFszXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFibGVSb3dCbGFua0xpbmUsXCJcIikuc3BsaXQoYFxuYCk6W10scz17dHlwZTpcInRhYmxlXCIscmF3OnRbMF0saGVhZGVyOltdLGFsaWduOltdLHJvd3M6W119O2lmKG4ubGVuZ3RoPT09ci5sZW5ndGgpe2ZvcihsZXQgYSBvZiByKXRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnblJpZ2h0LnRlc3QoYSk/cy5hbGlnbi5wdXNoKFwicmlnaHRcIik6dGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduQ2VudGVyLnRlc3QoYSk/cy5hbGlnbi5wdXNoKFwiY2VudGVyXCIpOnRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnbkxlZnQudGVzdChhKT9zLmFsaWduLnB1c2goXCJsZWZ0XCIpOnMuYWxpZ24ucHVzaChudWxsKTtmb3IobGV0IGE9MDthPG4ubGVuZ3RoO2ErKylzLmhlYWRlci5wdXNoKHt0ZXh0Om5bYV0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG5bYV0pLGhlYWRlcjohMCxhbGlnbjpzLmFsaWduW2FdfSk7Zm9yKGxldCBhIG9mIGkpcy5yb3dzLnB1c2goSihhLHMuaGVhZGVyLmxlbmd0aCkubWFwKChvLGwpPT4oe3RleHQ6byx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUobyksaGVhZGVyOiExLGFsaWduOnMuYWxpZ25bbF19KSkpO3JldHVybiBzfX1saGVhZGluZyhlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmxoZWFkaW5nLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImhlYWRpbmdcIixyYXc6dFswXSxkZXB0aDp0WzJdLmNoYXJBdCgwKT09PVwiPVwiPzE6Mix0ZXh0OnRbMV0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKHRbMV0pfX1wYXJhZ3JhcGgoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5wYXJhZ3JhcGguZXhlYyhlKTtpZih0KXtsZXQgbj10WzFdLmNoYXJBdCh0WzFdLmxlbmd0aC0xKT09PWBcbmA/dFsxXS5zbGljZSgwLC0xKTp0WzFdO3JldHVybnt0eXBlOlwicGFyYWdyYXBoXCIscmF3OnRbMF0sdGV4dDpuLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShuKX19fXRleHQoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay50ZXh0LmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcInRleHRcIixyYXc6dFswXSx0ZXh0OnRbMF0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKHRbMF0pfX1lc2NhcGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuZXNjYXBlLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImVzY2FwZVwiLHJhdzp0WzBdLHRleHQ6dFsxXX19dGFnKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLnRhZy5leGVjKGUpO2lmKHQpcmV0dXJuIXRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rJiZ0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0QVRhZy50ZXN0KHRbMF0pP3RoaXMubGV4ZXIuc3RhdGUuaW5MaW5rPSEwOnRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rJiZ0aGlzLnJ1bGVzLm90aGVyLmVuZEFUYWcudGVzdCh0WzBdKSYmKHRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rPSExKSwhdGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrJiZ0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0UHJlU2NyaXB0VGFnLnRlc3QodFswXSk/dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrPSEwOnRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayYmdGhpcy5ydWxlcy5vdGhlci5lbmRQcmVTY3JpcHRUYWcudGVzdCh0WzBdKSYmKHRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jaz0hMSkse3R5cGU6XCJodG1sXCIscmF3OnRbMF0saW5MaW5rOnRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rLGluUmF3QmxvY2s6dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrLGJsb2NrOiExLHRleHQ6dFswXX19bGluayhlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5saW5rLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsyXS50cmltKCk7aWYoIXRoaXMub3B0aW9ucy5wZWRhbnRpYyYmdGhpcy5ydWxlcy5vdGhlci5zdGFydEFuZ2xlQnJhY2tldC50ZXN0KG4pKXtpZighdGhpcy5ydWxlcy5vdGhlci5lbmRBbmdsZUJyYWNrZXQudGVzdChuKSlyZXR1cm47bGV0IHM9eihuLnNsaWNlKDAsLTEpLFwiXFxcXFwiKTtpZigobi5sZW5ndGgtcy5sZW5ndGgpJTI9PT0wKXJldHVybn1lbHNle2xldCBzPWRlKHRbMl0sXCIoKVwiKTtpZihzPT09LTIpcmV0dXJuO2lmKHM+LTEpe2xldCBvPSh0WzBdLmluZGV4T2YoXCIhXCIpPT09MD81OjQpK3RbMV0ubGVuZ3RoK3M7dFsyXT10WzJdLnN1YnN0cmluZygwLHMpLHRbMF09dFswXS5zdWJzdHJpbmcoMCxvKS50cmltKCksdFszXT1cIlwifX1sZXQgcj10WzJdLGk9XCJcIjtpZih0aGlzLm9wdGlvbnMucGVkYW50aWMpe2xldCBzPXRoaXMucnVsZXMub3RoZXIucGVkYW50aWNIcmVmVGl0bGUuZXhlYyhyKTtzJiYocj1zWzFdLGk9c1szXSl9ZWxzZSBpPXRbM10/dFszXS5zbGljZSgxLC0xKTpcIlwiO3JldHVybiByPXIudHJpbSgpLHRoaXMucnVsZXMub3RoZXIuc3RhcnRBbmdsZUJyYWNrZXQudGVzdChyKSYmKHRoaXMub3B0aW9ucy5wZWRhbnRpYyYmIXRoaXMucnVsZXMub3RoZXIuZW5kQW5nbGVCcmFja2V0LnRlc3Qobik/cj1yLnNsaWNlKDEpOnI9ci5zbGljZSgxLC0xKSksZ2UodCx7aHJlZjpyJiZyLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKSx0aXRsZTppJiZpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKX0sdFswXSx0aGlzLmxleGVyLHRoaXMucnVsZXMpfX1yZWZsaW5rKGUsdCl7bGV0IG47aWYoKG49dGhpcy5ydWxlcy5pbmxpbmUucmVmbGluay5leGVjKGUpKXx8KG49dGhpcy5ydWxlcy5pbmxpbmUubm9saW5rLmV4ZWMoZSkpKXtsZXQgcj0oblsyXXx8blsxXSkucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLm11bHRpcGxlU3BhY2VHbG9iYWwsXCIgXCIpLGk9dFtyLnRvTG93ZXJDYXNlKCldO2lmKCFpKXtsZXQgcz1uWzBdLmNoYXJBdCgwKTtyZXR1cm57dHlwZTpcInRleHRcIixyYXc6cyx0ZXh0OnN9fXJldHVybiBnZShuLGksblswXSx0aGlzLmxleGVyLHRoaXMucnVsZXMpfX1lbVN0cm9uZyhlLHQsbj1cIlwiKXtsZXQgcj10aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZ0xEZWxpbS5leGVjKGUpO2lmKCFyfHxyWzNdJiZuLm1hdGNoKHRoaXMucnVsZXMub3RoZXIudW5pY29kZUFscGhhTnVtZXJpYykpcmV0dXJuO2lmKCEoclsxXXx8clsyXXx8XCJcIil8fCFufHx0aGlzLnJ1bGVzLmlubGluZS5wdW5jdHVhdGlvbi5leGVjKG4pKXtsZXQgcz1bLi4uclswXV0ubGVuZ3RoLTEsYSxvLGw9cyxwPTAsYz1yWzBdWzBdPT09XCIqXCI/dGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmdSRGVsaW1Bc3Q6dGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmdSRGVsaW1VbmQ7Zm9yKGMubGFzdEluZGV4PTAsdD10LnNsaWNlKC0xKmUubGVuZ3RoK3MpOyhyPWMuZXhlYyh0KSkhPW51bGw7KXtpZihhPXJbMV18fHJbMl18fHJbM118fHJbNF18fHJbNV18fHJbNl0sIWEpY29udGludWU7aWYobz1bLi4uYV0ubGVuZ3RoLHJbM118fHJbNF0pe2wrPW87Y29udGludWV9ZWxzZSBpZigocls1XXx8cls2XSkmJnMlMyYmISgocytvKSUzKSl7cCs9bztjb250aW51ZX1pZihsLT1vLGw+MCljb250aW51ZTtvPU1hdGgubWluKG8sbytsK3ApO2xldCBnPVsuLi5yWzBdXVswXS5sZW5ndGgsaD1lLnNsaWNlKDAscytyLmluZGV4K2crbyk7aWYoTWF0aC5taW4ocyxvKSUyKXtsZXQgZj1oLnNsaWNlKDEsLTEpO3JldHVybnt0eXBlOlwiZW1cIixyYXc6aCx0ZXh0OmYsdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKGYpfX1sZXQgUj1oLnNsaWNlKDIsLTIpO3JldHVybnt0eXBlOlwic3Ryb25nXCIscmF3OmgsdGV4dDpSLHRva2Vuczp0aGlzLmxleGVyLmlubGluZVRva2VucyhSKX19fX1jb2Rlc3BhbihlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5jb2RlLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsyXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubmV3TGluZUNoYXJHbG9iYWwsXCIgXCIpLHI9dGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIudGVzdChuKSxpPXRoaXMucnVsZXMub3RoZXIuc3RhcnRpbmdTcGFjZUNoYXIudGVzdChuKSYmdGhpcy5ydWxlcy5vdGhlci5lbmRpbmdTcGFjZUNoYXIudGVzdChuKTtyZXR1cm4gciYmaSYmKG49bi5zdWJzdHJpbmcoMSxuLmxlbmd0aC0xKSkse3R5cGU6XCJjb2Rlc3BhblwiLHJhdzp0WzBdLHRleHQ6bn19fWJyKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmJyLmV4ZWMoZSk7aWYodClyZXR1cm57dHlwZTpcImJyXCIscmF3OnRbMF19fWRlbChlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5kZWwuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiZGVsXCIscmF3OnRbMF0sdGV4dDp0WzJdLHRva2Vuczp0aGlzLmxleGVyLmlubGluZVRva2Vucyh0WzJdKX19YXV0b2xpbmsoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuYXV0b2xpbmsuZXhlYyhlKTtpZih0KXtsZXQgbixyO3JldHVybiB0WzJdPT09XCJAXCI/KG49dFsxXSxyPVwibWFpbHRvOlwiK24pOihuPXRbMV0scj1uKSx7dHlwZTpcImxpbmtcIixyYXc6dFswXSx0ZXh0Om4saHJlZjpyLHRva2Vuczpbe3R5cGU6XCJ0ZXh0XCIscmF3Om4sdGV4dDpufV19fX11cmwoZSl7bGV0IHQ7aWYodD10aGlzLnJ1bGVzLmlubGluZS51cmwuZXhlYyhlKSl7bGV0IG4scjtpZih0WzJdPT09XCJAXCIpbj10WzBdLHI9XCJtYWlsdG86XCIrbjtlbHNle2xldCBpO2RvIGk9dFswXSx0WzBdPXRoaXMucnVsZXMuaW5saW5lLl9iYWNrcGVkYWwuZXhlYyh0WzBdKT8uWzBdPz9cIlwiO3doaWxlKGkhPT10WzBdKTtuPXRbMF0sdFsxXT09PVwid3d3LlwiP3I9XCJodHRwOi8vXCIrdFswXTpyPXRbMF19cmV0dXJue3R5cGU6XCJsaW5rXCIscmF3OnRbMF0sdGV4dDpuLGhyZWY6cix0b2tlbnM6W3t0eXBlOlwidGV4dFwiLHJhdzpuLHRleHQ6bn1dfX19aW5saW5lVGV4dChlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS50ZXh0LmV4ZWMoZSk7aWYodCl7bGV0IG49dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrO3JldHVybnt0eXBlOlwidGV4dFwiLHJhdzp0WzBdLHRleHQ6dFswXSxlc2NhcGVkOm59fX19O3ZhciB4PWNsYXNzIHV7dG9rZW5zO29wdGlvbnM7c3RhdGU7aW5saW5lUXVldWU7dG9rZW5pemVyO2NvbnN0cnVjdG9yKGUpe3RoaXMudG9rZW5zPVtdLHRoaXMudG9rZW5zLmxpbmtzPU9iamVjdC5jcmVhdGUobnVsbCksdGhpcy5vcHRpb25zPWV8fFQsdGhpcy5vcHRpb25zLnRva2VuaXplcj10aGlzLm9wdGlvbnMudG9rZW5pemVyfHxuZXcgeSx0aGlzLnRva2VuaXplcj10aGlzLm9wdGlvbnMudG9rZW5pemVyLHRoaXMudG9rZW5pemVyLm9wdGlvbnM9dGhpcy5vcHRpb25zLHRoaXMudG9rZW5pemVyLmxleGVyPXRoaXMsdGhpcy5pbmxpbmVRdWV1ZT1bXSx0aGlzLnN0YXRlPXtpbkxpbms6ITEsaW5SYXdCbG9jazohMSx0b3A6ITB9O2xldCB0PXtvdGhlcjptLGJsb2NrOkUubm9ybWFsLGlubGluZTpNLm5vcm1hbH07dGhpcy5vcHRpb25zLnBlZGFudGljPyh0LmJsb2NrPUUucGVkYW50aWMsdC5pbmxpbmU9TS5wZWRhbnRpYyk6dGhpcy5vcHRpb25zLmdmbSYmKHQuYmxvY2s9RS5nZm0sdGhpcy5vcHRpb25zLmJyZWFrcz90LmlubGluZT1NLmJyZWFrczp0LmlubGluZT1NLmdmbSksdGhpcy50b2tlbml6ZXIucnVsZXM9dH1zdGF0aWMgZ2V0IHJ1bGVzKCl7cmV0dXJue2Jsb2NrOkUsaW5saW5lOk19fXN0YXRpYyBsZXgoZSx0KXtyZXR1cm4gbmV3IHUodCkubGV4KGUpfXN0YXRpYyBsZXhJbmxpbmUoZSx0KXtyZXR1cm4gbmV3IHUodCkuaW5saW5lVG9rZW5zKGUpfWxleChlKXtlPWUucmVwbGFjZShtLmNhcnJpYWdlUmV0dXJuLGBcbmApLHRoaXMuYmxvY2tUb2tlbnMoZSx0aGlzLnRva2Vucyk7Zm9yKGxldCB0PTA7dDx0aGlzLmlubGluZVF1ZXVlLmxlbmd0aDt0Kyspe2xldCBuPXRoaXMuaW5saW5lUXVldWVbdF07dGhpcy5pbmxpbmVUb2tlbnMobi5zcmMsbi50b2tlbnMpfXJldHVybiB0aGlzLmlubGluZVF1ZXVlPVtdLHRoaXMudG9rZW5zfWJsb2NrVG9rZW5zKGUsdD1bXSxuPSExKXtmb3IodGhpcy5vcHRpb25zLnBlZGFudGljJiYoZT1lLnJlcGxhY2UobS50YWJDaGFyR2xvYmFsLFwiICAgIFwiKS5yZXBsYWNlKG0uc3BhY2VMaW5lLFwiXCIpKTtlOyl7bGV0IHI7aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LmJsb2NrPy5zb21lKHM9PihyPXMuY2FsbCh7bGV4ZXI6dGhpc30sZSx0KSk/KGU9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gociksITApOiExKSljb250aW51ZTtpZihyPXRoaXMudG9rZW5pemVyLnNwYWNlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7ci5yYXcubGVuZ3RoPT09MSYmcyE9PXZvaWQgMD9zLnJhdys9YFxuYDp0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5jb2RlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7cz8udHlwZT09PVwicGFyYWdyYXBoXCJ8fHM/LnR5cGU9PT1cInRleHRcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnRleHQsdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuZmVuY2VzKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuaGVhZGluZyhlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmhyKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuYmxvY2txdW90ZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmxpc3QoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5odG1sKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuZGVmKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7cz8udHlwZT09PVwicGFyYWdyYXBoXCJ8fHM/LnR5cGU9PT1cInRleHRcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnJhdyx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0aGlzLnRva2Vucy5saW5rc1tyLnRhZ118fCh0aGlzLnRva2Vucy5saW5rc1tyLnRhZ109e2hyZWY6ci5ocmVmLHRpdGxlOnIudGl0bGV9LHQucHVzaChyKSk7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci50YWJsZShlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmxoZWFkaW5nKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWxldCBpPWU7aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnN0YXJ0QmxvY2spe2xldCBzPTEvMCxhPWUuc2xpY2UoMSksbzt0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5zdGFydEJsb2NrLmZvckVhY2gobD0+e289bC5jYWxsKHtsZXhlcjp0aGlzfSxhKSx0eXBlb2Ygbz09XCJudW1iZXJcIiYmbz49MCYmKHM9TWF0aC5taW4ocyxvKSl9KSxzPDEvMCYmcz49MCYmKGk9ZS5zdWJzdHJpbmcoMCxzKzEpKX1pZih0aGlzLnN0YXRlLnRvcCYmKHI9dGhpcy50b2tlbml6ZXIucGFyYWdyYXBoKGkpKSl7bGV0IHM9dC5hdCgtMSk7biYmcz8udHlwZT09PVwicGFyYWdyYXBoXCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci50ZXh0LHRoaXMuaW5saW5lUXVldWUucG9wKCksdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dC5wdXNoKHIpLG49aS5sZW5ndGghPT1lLmxlbmd0aCxlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci50ZXh0KGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCk7bGV0IHM9dC5hdCgtMSk7cz8udHlwZT09PVwidGV4dFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IudGV4dCx0aGlzLmlubGluZVF1ZXVlLnBvcCgpLHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnQucHVzaChyKTtjb250aW51ZX1pZihlKXtsZXQgcz1cIkluZmluaXRlIGxvb3Agb24gYnl0ZTogXCIrZS5jaGFyQ29kZUF0KDApO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpe2NvbnNvbGUuZXJyb3Iocyk7YnJlYWt9ZWxzZSB0aHJvdyBuZXcgRXJyb3Iocyl9fXJldHVybiB0aGlzLnN0YXRlLnRvcD0hMCx0fWlubGluZShlLHQ9W10pe3JldHVybiB0aGlzLmlubGluZVF1ZXVlLnB1c2goe3NyYzplLHRva2Vuczp0fSksdH1pbmxpbmVUb2tlbnMoZSx0PVtdKXtsZXQgbj1lLHI9bnVsbDtpZih0aGlzLnRva2Vucy5saW5rcyl7bGV0IG89T2JqZWN0LmtleXModGhpcy50b2tlbnMubGlua3MpO2lmKG8ubGVuZ3RoPjApZm9yKDsocj10aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUucmVmbGlua1NlYXJjaC5leGVjKG4pKSE9bnVsbDspby5pbmNsdWRlcyhyWzBdLnNsaWNlKHJbMF0ubGFzdEluZGV4T2YoXCJbXCIpKzEsLTEpKSYmKG49bi5zbGljZSgwLHIuaW5kZXgpK1wiW1wiK1wiYVwiLnJlcGVhdChyWzBdLmxlbmd0aC0yKStcIl1cIituLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5yZWZsaW5rU2VhcmNoLmxhc3RJbmRleCkpfWZvcig7KHI9dGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLmV4ZWMobikpIT1udWxsOyluPW4uc2xpY2UoMCxyLmluZGV4KStcIisrXCIrbi5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24ubGFzdEluZGV4KTtsZXQgaTtmb3IoOyhyPXRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5ibG9ja1NraXAuZXhlYyhuKSkhPW51bGw7KWk9clsyXT9yWzJdLmxlbmd0aDowLG49bi5zbGljZSgwLHIuaW5kZXgraSkrXCJbXCIrXCJhXCIucmVwZWF0KHJbMF0ubGVuZ3RoLWktMikrXCJdXCIrbi5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYmxvY2tTa2lwLmxhc3RJbmRleCk7bj10aGlzLm9wdGlvbnMuaG9va3M/LmVtU3Ryb25nTWFzaz8uY2FsbCh7bGV4ZXI6dGhpc30sbik/P247bGV0IHM9ITEsYT1cIlwiO2Zvcig7ZTspe3N8fChhPVwiXCIpLHM9ITE7bGV0IG87aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LmlubGluZT8uc29tZShwPT4obz1wLmNhbGwoe2xleGVyOnRoaXN9LGUsdCkpPyhlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pLCEwKTohMSkpY29udGludWU7aWYobz10aGlzLnRva2VuaXplci5lc2NhcGUoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci50YWcoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5saW5rKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIucmVmbGluayhlLHRoaXMudG9rZW5zLmxpbmtzKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpO2xldCBwPXQuYXQoLTEpO28udHlwZT09PVwidGV4dFwiJiZwPy50eXBlPT09XCJ0ZXh0XCI/KHAucmF3Kz1vLnJhdyxwLnRleHQrPW8udGV4dCk6dC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuZW1TdHJvbmcoZSxuLGEpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuY29kZXNwYW4oZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5icihlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmRlbChlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmF1dG9saW5rKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKCF0aGlzLnN0YXRlLmluTGluayYmKG89dGhpcy50b2tlbml6ZXIudXJsKGUpKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1sZXQgbD1lO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5zdGFydElubGluZSl7bGV0IHA9MS8wLGM9ZS5zbGljZSgxKSxnO3RoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0SW5saW5lLmZvckVhY2goaD0+e2c9aC5jYWxsKHtsZXhlcjp0aGlzfSxjKSx0eXBlb2YgZz09XCJudW1iZXJcIiYmZz49MCYmKHA9TWF0aC5taW4ocCxnKSl9KSxwPDEvMCYmcD49MCYmKGw9ZS5zdWJzdHJpbmcoMCxwKzEpKX1pZihvPXRoaXMudG9rZW5pemVyLmlubGluZVRleHQobCkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSxvLnJhdy5zbGljZSgtMSkhPT1cIl9cIiYmKGE9by5yYXcuc2xpY2UoLTEpKSxzPSEwO2xldCBwPXQuYXQoLTEpO3A/LnR5cGU9PT1cInRleHRcIj8ocC5yYXcrPW8ucmF3LHAudGV4dCs9by50ZXh0KTp0LnB1c2gobyk7Y29udGludWV9aWYoZSl7bGV0IHA9XCJJbmZpbml0ZSBsb29wIG9uIGJ5dGU6IFwiK2UuY2hhckNvZGVBdCgwKTtpZih0aGlzLm9wdGlvbnMuc2lsZW50KXtjb25zb2xlLmVycm9yKHApO2JyZWFrfWVsc2UgdGhyb3cgbmV3IEVycm9yKHApfX1yZXR1cm4gdH19O3ZhciBQPWNsYXNze29wdGlvbnM7cGFyc2VyO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxUfXNwYWNlKGUpe3JldHVyblwiXCJ9Y29kZSh7dGV4dDplLGxhbmc6dCxlc2NhcGVkOm59KXtsZXQgcj0odHx8XCJcIikubWF0Y2gobS5ub3RTcGFjZVN0YXJ0KT8uWzBdLGk9ZS5yZXBsYWNlKG0uZW5kaW5nTmV3bGluZSxcIlwiKStgXG5gO3JldHVybiByPyc8cHJlPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtJyt3KHIpKydcIj4nKyhuP2k6dyhpLCEwKSkrYDwvY29kZT48L3ByZT5cbmA6XCI8cHJlPjxjb2RlPlwiKyhuP2k6dyhpLCEwKSkrYDwvY29kZT48L3ByZT5cbmB9YmxvY2txdW90ZSh7dG9rZW5zOmV9KXtyZXR1cm5gPGJsb2NrcXVvdGU+XG4ke3RoaXMucGFyc2VyLnBhcnNlKGUpfTwvYmxvY2txdW90ZT5cbmB9aHRtbCh7dGV4dDplfSl7cmV0dXJuIGV9ZGVmKGUpe3JldHVyblwiXCJ9aGVhZGluZyh7dG9rZW5zOmUsZGVwdGg6dH0pe3JldHVybmA8aCR7dH0+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L2gke3R9PlxuYH1ocihlKXtyZXR1cm5gPGhyPlxuYH1saXN0KGUpe2xldCB0PWUub3JkZXJlZCxuPWUuc3RhcnQscj1cIlwiO2ZvcihsZXQgYT0wO2E8ZS5pdGVtcy5sZW5ndGg7YSsrKXtsZXQgbz1lLml0ZW1zW2FdO3IrPXRoaXMubGlzdGl0ZW0obyl9bGV0IGk9dD9cIm9sXCI6XCJ1bFwiLHM9dCYmbiE9PTE/JyBzdGFydD1cIicrbisnXCInOlwiXCI7cmV0dXJuXCI8XCIraStzK2A+XG5gK3IrXCI8L1wiK2krYD5cbmB9bGlzdGl0ZW0oZSl7cmV0dXJuYDxsaT4ke3RoaXMucGFyc2VyLnBhcnNlKGUudG9rZW5zKX08L2xpPlxuYH1jaGVja2JveCh7Y2hlY2tlZDplfSl7cmV0dXJuXCI8aW5wdXQgXCIrKGU/J2NoZWNrZWQ9XCJcIiAnOlwiXCIpKydkaXNhYmxlZD1cIlwiIHR5cGU9XCJjaGVja2JveFwiPiAnfXBhcmFncmFwaCh7dG9rZW5zOmV9KXtyZXR1cm5gPHA+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L3A+XG5gfXRhYmxlKGUpe2xldCB0PVwiXCIsbj1cIlwiO2ZvcihsZXQgaT0wO2k8ZS5oZWFkZXIubGVuZ3RoO2krKyluKz10aGlzLnRhYmxlY2VsbChlLmhlYWRlcltpXSk7dCs9dGhpcy50YWJsZXJvdyh7dGV4dDpufSk7bGV0IHI9XCJcIjtmb3IobGV0IGk9MDtpPGUucm93cy5sZW5ndGg7aSsrKXtsZXQgcz1lLnJvd3NbaV07bj1cIlwiO2ZvcihsZXQgYT0wO2E8cy5sZW5ndGg7YSsrKW4rPXRoaXMudGFibGVjZWxsKHNbYV0pO3IrPXRoaXMudGFibGVyb3coe3RleHQ6bn0pfXJldHVybiByJiYocj1gPHRib2R5PiR7cn08L3Rib2R5PmApLGA8dGFibGU+XG48dGhlYWQ+XG5gK3QrYDwvdGhlYWQ+XG5gK3IrYDwvdGFibGU+XG5gfXRhYmxlcm93KHt0ZXh0OmV9KXtyZXR1cm5gPHRyPlxuJHtlfTwvdHI+XG5gfXRhYmxlY2VsbChlKXtsZXQgdD10aGlzLnBhcnNlci5wYXJzZUlubGluZShlLnRva2Vucyksbj1lLmhlYWRlcj9cInRoXCI6XCJ0ZFwiO3JldHVybihlLmFsaWduP2A8JHtufSBhbGlnbj1cIiR7ZS5hbGlnbn1cIj5gOmA8JHtufT5gKSt0K2A8LyR7bn0+XG5gfXN0cm9uZyh7dG9rZW5zOmV9KXtyZXR1cm5gPHN0cm9uZz4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvc3Ryb25nPmB9ZW0oe3Rva2VuczplfSl7cmV0dXJuYDxlbT4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvZW0+YH1jb2Rlc3Bhbih7dGV4dDplfSl7cmV0dXJuYDxjb2RlPiR7dyhlLCEwKX08L2NvZGU+YH1icihlKXtyZXR1cm5cIjxicj5cIn1kZWwoe3Rva2VuczplfSl7cmV0dXJuYDxkZWw+JHt0aGlzLnBhcnNlci5wYXJzZUlubGluZShlKX08L2RlbD5gfWxpbmsoe2hyZWY6ZSx0aXRsZTp0LHRva2VuczpufSl7bGV0IHI9dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUobiksaT1YKGUpO2lmKGk9PT1udWxsKXJldHVybiByO2U9aTtsZXQgcz0nPGEgaHJlZj1cIicrZSsnXCInO3JldHVybiB0JiYocys9JyB0aXRsZT1cIicrdyh0KSsnXCInKSxzKz1cIj5cIityK1wiPC9hPlwiLHN9aW1hZ2Uoe2hyZWY6ZSx0aXRsZTp0LHRleHQ6bix0b2tlbnM6cn0pe3ImJihuPXRoaXMucGFyc2VyLnBhcnNlSW5saW5lKHIsdGhpcy5wYXJzZXIudGV4dFJlbmRlcmVyKSk7bGV0IGk9WChlKTtpZihpPT09bnVsbClyZXR1cm4gdyhuKTtlPWk7bGV0IHM9YDxpbWcgc3JjPVwiJHtlfVwiIGFsdD1cIiR7bn1cImA7cmV0dXJuIHQmJihzKz1gIHRpdGxlPVwiJHt3KHQpfVwiYCkscys9XCI+XCIsc310ZXh0KGUpe3JldHVyblwidG9rZW5zXCJpbiBlJiZlLnRva2Vucz90aGlzLnBhcnNlci5wYXJzZUlubGluZShlLnRva2Vucyk6XCJlc2NhcGVkXCJpbiBlJiZlLmVzY2FwZWQ/ZS50ZXh0OncoZS50ZXh0KX19O3ZhciAkPWNsYXNze3N0cm9uZyh7dGV4dDplfSl7cmV0dXJuIGV9ZW0oe3RleHQ6ZX0pe3JldHVybiBlfWNvZGVzcGFuKHt0ZXh0OmV9KXtyZXR1cm4gZX1kZWwoe3RleHQ6ZX0pe3JldHVybiBlfWh0bWwoe3RleHQ6ZX0pe3JldHVybiBlfXRleHQoe3RleHQ6ZX0pe3JldHVybiBlfWxpbmsoe3RleHQ6ZX0pe3JldHVyblwiXCIrZX1pbWFnZSh7dGV4dDplfSl7cmV0dXJuXCJcIitlfWJyKCl7cmV0dXJuXCJcIn1jaGVja2JveCh7cmF3OmV9KXtyZXR1cm4gZX19O3ZhciBiPWNsYXNzIHV7b3B0aW9ucztyZW5kZXJlcjt0ZXh0UmVuZGVyZXI7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFQsdGhpcy5vcHRpb25zLnJlbmRlcmVyPXRoaXMub3B0aW9ucy5yZW5kZXJlcnx8bmV3IFAsdGhpcy5yZW5kZXJlcj10aGlzLm9wdGlvbnMucmVuZGVyZXIsdGhpcy5yZW5kZXJlci5vcHRpb25zPXRoaXMub3B0aW9ucyx0aGlzLnJlbmRlcmVyLnBhcnNlcj10aGlzLHRoaXMudGV4dFJlbmRlcmVyPW5ldyAkfXN0YXRpYyBwYXJzZShlLHQpe3JldHVybiBuZXcgdSh0KS5wYXJzZShlKX1zdGF0aWMgcGFyc2VJbmxpbmUoZSx0KXtyZXR1cm4gbmV3IHUodCkucGFyc2VJbmxpbmUoZSl9cGFyc2UoZSl7bGV0IHQ9XCJcIjtmb3IobGV0IG49MDtuPGUubGVuZ3RoO24rKyl7bGV0IHI9ZVtuXTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8ucmVuZGVyZXJzPy5bci50eXBlXSl7bGV0IHM9cixhPXRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1tzLnR5cGVdLmNhbGwoe3BhcnNlcjp0aGlzfSxzKTtpZihhIT09ITF8fCFbXCJzcGFjZVwiLFwiaHJcIixcImhlYWRpbmdcIixcImNvZGVcIixcInRhYmxlXCIsXCJibG9ja3F1b3RlXCIsXCJsaXN0XCIsXCJodG1sXCIsXCJkZWZcIixcInBhcmFncmFwaFwiLFwidGV4dFwiXS5pbmNsdWRlcyhzLnR5cGUpKXt0Kz1hfHxcIlwiO2NvbnRpbnVlfX1sZXQgaT1yO3N3aXRjaChpLnR5cGUpe2Nhc2VcInNwYWNlXCI6e3QrPXRoaXMucmVuZGVyZXIuc3BhY2UoaSk7YnJlYWt9Y2FzZVwiaHJcIjp7dCs9dGhpcy5yZW5kZXJlci5ocihpKTticmVha31jYXNlXCJoZWFkaW5nXCI6e3QrPXRoaXMucmVuZGVyZXIuaGVhZGluZyhpKTticmVha31jYXNlXCJjb2RlXCI6e3QrPXRoaXMucmVuZGVyZXIuY29kZShpKTticmVha31jYXNlXCJ0YWJsZVwiOnt0Kz10aGlzLnJlbmRlcmVyLnRhYmxlKGkpO2JyZWFrfWNhc2VcImJsb2NrcXVvdGVcIjp7dCs9dGhpcy5yZW5kZXJlci5ibG9ja3F1b3RlKGkpO2JyZWFrfWNhc2VcImxpc3RcIjp7dCs9dGhpcy5yZW5kZXJlci5saXN0KGkpO2JyZWFrfWNhc2VcImNoZWNrYm94XCI6e3QrPXRoaXMucmVuZGVyZXIuY2hlY2tib3goaSk7YnJlYWt9Y2FzZVwiaHRtbFwiOnt0Kz10aGlzLnJlbmRlcmVyLmh0bWwoaSk7YnJlYWt9Y2FzZVwiZGVmXCI6e3QrPXRoaXMucmVuZGVyZXIuZGVmKGkpO2JyZWFrfWNhc2VcInBhcmFncmFwaFwiOnt0Kz10aGlzLnJlbmRlcmVyLnBhcmFncmFwaChpKTticmVha31jYXNlXCJ0ZXh0XCI6e3QrPXRoaXMucmVuZGVyZXIudGV4dChpKTticmVha31kZWZhdWx0OntsZXQgcz0nVG9rZW4gd2l0aCBcIicraS50eXBlKydcIiB0eXBlIHdhcyBub3QgZm91bmQuJztpZih0aGlzLm9wdGlvbnMuc2lsZW50KXJldHVybiBjb25zb2xlLmVycm9yKHMpLFwiXCI7dGhyb3cgbmV3IEVycm9yKHMpfX19cmV0dXJuIHR9cGFyc2VJbmxpbmUoZSx0PXRoaXMucmVuZGVyZXIpe2xldCBuPVwiXCI7Zm9yKGxldCByPTA7cjxlLmxlbmd0aDtyKyspe2xldCBpPWVbcl07aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnJlbmRlcmVycz8uW2kudHlwZV0pe2xldCBhPXRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1tpLnR5cGVdLmNhbGwoe3BhcnNlcjp0aGlzfSxpKTtpZihhIT09ITF8fCFbXCJlc2NhcGVcIixcImh0bWxcIixcImxpbmtcIixcImltYWdlXCIsXCJzdHJvbmdcIixcImVtXCIsXCJjb2Rlc3BhblwiLFwiYnJcIixcImRlbFwiLFwidGV4dFwiXS5pbmNsdWRlcyhpLnR5cGUpKXtuKz1hfHxcIlwiO2NvbnRpbnVlfX1sZXQgcz1pO3N3aXRjaChzLnR5cGUpe2Nhc2VcImVzY2FwZVwiOntuKz10LnRleHQocyk7YnJlYWt9Y2FzZVwiaHRtbFwiOntuKz10Lmh0bWwocyk7YnJlYWt9Y2FzZVwibGlua1wiOntuKz10Lmxpbmsocyk7YnJlYWt9Y2FzZVwiaW1hZ2VcIjp7bis9dC5pbWFnZShzKTticmVha31jYXNlXCJjaGVja2JveFwiOntuKz10LmNoZWNrYm94KHMpO2JyZWFrfWNhc2VcInN0cm9uZ1wiOntuKz10LnN0cm9uZyhzKTticmVha31jYXNlXCJlbVwiOntuKz10LmVtKHMpO2JyZWFrfWNhc2VcImNvZGVzcGFuXCI6e24rPXQuY29kZXNwYW4ocyk7YnJlYWt9Y2FzZVwiYnJcIjp7bis9dC5icihzKTticmVha31jYXNlXCJkZWxcIjp7bis9dC5kZWwocyk7YnJlYWt9Y2FzZVwidGV4dFwiOntuKz10LnRleHQocyk7YnJlYWt9ZGVmYXVsdDp7bGV0IGE9J1Rva2VuIHdpdGggXCInK3MudHlwZSsnXCIgdHlwZSB3YXMgbm90IGZvdW5kLic7aWYodGhpcy5vcHRpb25zLnNpbGVudClyZXR1cm4gY29uc29sZS5lcnJvcihhKSxcIlwiO3Rocm93IG5ldyBFcnJvcihhKX19fXJldHVybiBufX07dmFyIFM9Y2xhc3N7b3B0aW9ucztibG9jaztjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VH1zdGF0aWMgcGFzc1Rocm91Z2hIb29rcz1uZXcgU2V0KFtcInByZXByb2Nlc3NcIixcInBvc3Rwcm9jZXNzXCIsXCJwcm9jZXNzQWxsVG9rZW5zXCIsXCJlbVN0cm9uZ01hc2tcIl0pO3N0YXRpYyBwYXNzVGhyb3VnaEhvb2tzUmVzcGVjdEFzeW5jPW5ldyBTZXQoW1wicHJlcHJvY2Vzc1wiLFwicG9zdHByb2Nlc3NcIixcInByb2Nlc3NBbGxUb2tlbnNcIl0pO3ByZXByb2Nlc3MoZSl7cmV0dXJuIGV9cG9zdHByb2Nlc3MoZSl7cmV0dXJuIGV9cHJvY2Vzc0FsbFRva2VucyhlKXtyZXR1cm4gZX1lbVN0cm9uZ01hc2soZSl7cmV0dXJuIGV9cHJvdmlkZUxleGVyKCl7cmV0dXJuIHRoaXMuYmxvY2s/eC5sZXg6eC5sZXhJbmxpbmV9cHJvdmlkZVBhcnNlcigpe3JldHVybiB0aGlzLmJsb2NrP2IucGFyc2U6Yi5wYXJzZUlubGluZX19O3ZhciBCPWNsYXNze2RlZmF1bHRzPUwoKTtvcHRpb25zPXRoaXMuc2V0T3B0aW9ucztwYXJzZT10aGlzLnBhcnNlTWFya2Rvd24oITApO3BhcnNlSW5saW5lPXRoaXMucGFyc2VNYXJrZG93bighMSk7UGFyc2VyPWI7UmVuZGVyZXI9UDtUZXh0UmVuZGVyZXI9JDtMZXhlcj14O1Rva2VuaXplcj15O0hvb2tzPVM7Y29uc3RydWN0b3IoLi4uZSl7dGhpcy51c2UoLi4uZSl9d2Fsa1Rva2VucyhlLHQpe2xldCBuPVtdO2ZvcihsZXQgciBvZiBlKXN3aXRjaChuPW4uY29uY2F0KHQuY2FsbCh0aGlzLHIpKSxyLnR5cGUpe2Nhc2VcInRhYmxlXCI6e2xldCBpPXI7Zm9yKGxldCBzIG9mIGkuaGVhZGVyKW49bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKHMudG9rZW5zLHQpKTtmb3IobGV0IHMgb2YgaS5yb3dzKWZvcihsZXQgYSBvZiBzKW49bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGEudG9rZW5zLHQpKTticmVha31jYXNlXCJsaXN0XCI6e2xldCBpPXI7bj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoaS5pdGVtcyx0KSk7YnJlYWt9ZGVmYXVsdDp7bGV0IGk9cjt0aGlzLmRlZmF1bHRzLmV4dGVuc2lvbnM/LmNoaWxkVG9rZW5zPy5baS50eXBlXT90aGlzLmRlZmF1bHRzLmV4dGVuc2lvbnMuY2hpbGRUb2tlbnNbaS50eXBlXS5mb3JFYWNoKHM9PntsZXQgYT1pW3NdLmZsYXQoMS8wKTtuPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhhLHQpKX0pOmkudG9rZW5zJiYobj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoaS50b2tlbnMsdCkpKX19cmV0dXJuIG59dXNlKC4uLmUpe2xldCB0PXRoaXMuZGVmYXVsdHMuZXh0ZW5zaW9uc3x8e3JlbmRlcmVyczp7fSxjaGlsZFRva2Vuczp7fX07cmV0dXJuIGUuZm9yRWFjaChuPT57bGV0IHI9ey4uLm59O2lmKHIuYXN5bmM9dGhpcy5kZWZhdWx0cy5hc3luY3x8ci5hc3luY3x8ITEsbi5leHRlbnNpb25zJiYobi5leHRlbnNpb25zLmZvckVhY2goaT0+e2lmKCFpLm5hbWUpdGhyb3cgbmV3IEVycm9yKFwiZXh0ZW5zaW9uIG5hbWUgcmVxdWlyZWRcIik7aWYoXCJyZW5kZXJlclwiaW4gaSl7bGV0IHM9dC5yZW5kZXJlcnNbaS5uYW1lXTtzP3QucmVuZGVyZXJzW2kubmFtZV09ZnVuY3Rpb24oLi4uYSl7bGV0IG89aS5yZW5kZXJlci5hcHBseSh0aGlzLGEpO3JldHVybiBvPT09ITEmJihvPXMuYXBwbHkodGhpcyxhKSksb306dC5yZW5kZXJlcnNbaS5uYW1lXT1pLnJlbmRlcmVyfWlmKFwidG9rZW5pemVyXCJpbiBpKXtpZighaS5sZXZlbHx8aS5sZXZlbCE9PVwiYmxvY2tcIiYmaS5sZXZlbCE9PVwiaW5saW5lXCIpdGhyb3cgbmV3IEVycm9yKFwiZXh0ZW5zaW9uIGxldmVsIG11c3QgYmUgJ2Jsb2NrJyBvciAnaW5saW5lJ1wiKTtsZXQgcz10W2kubGV2ZWxdO3M/cy51bnNoaWZ0KGkudG9rZW5pemVyKTp0W2kubGV2ZWxdPVtpLnRva2VuaXplcl0saS5zdGFydCYmKGkubGV2ZWw9PT1cImJsb2NrXCI/dC5zdGFydEJsb2NrP3Quc3RhcnRCbG9jay5wdXNoKGkuc3RhcnQpOnQuc3RhcnRCbG9jaz1baS5zdGFydF06aS5sZXZlbD09PVwiaW5saW5lXCImJih0LnN0YXJ0SW5saW5lP3Quc3RhcnRJbmxpbmUucHVzaChpLnN0YXJ0KTp0LnN0YXJ0SW5saW5lPVtpLnN0YXJ0XSkpfVwiY2hpbGRUb2tlbnNcImluIGkmJmkuY2hpbGRUb2tlbnMmJih0LmNoaWxkVG9rZW5zW2kubmFtZV09aS5jaGlsZFRva2Vucyl9KSxyLmV4dGVuc2lvbnM9dCksbi5yZW5kZXJlcil7bGV0IGk9dGhpcy5kZWZhdWx0cy5yZW5kZXJlcnx8bmV3IFAodGhpcy5kZWZhdWx0cyk7Zm9yKGxldCBzIGluIG4ucmVuZGVyZXIpe2lmKCEocyBpbiBpKSl0aHJvdyBuZXcgRXJyb3IoYHJlbmRlcmVyICcke3N9JyBkb2VzIG5vdCBleGlzdGApO2lmKFtcIm9wdGlvbnNcIixcInBhcnNlclwiXS5pbmNsdWRlcyhzKSljb250aW51ZTtsZXQgYT1zLG89bi5yZW5kZXJlclthXSxsPWlbYV07aVthXT0oLi4ucCk9PntsZXQgYz1vLmFwcGx5KGkscCk7cmV0dXJuIGM9PT0hMSYmKGM9bC5hcHBseShpLHApKSxjfHxcIlwifX1yLnJlbmRlcmVyPWl9aWYobi50b2tlbml6ZXIpe2xldCBpPXRoaXMuZGVmYXVsdHMudG9rZW5pemVyfHxuZXcgeSh0aGlzLmRlZmF1bHRzKTtmb3IobGV0IHMgaW4gbi50b2tlbml6ZXIpe2lmKCEocyBpbiBpKSl0aHJvdyBuZXcgRXJyb3IoYHRva2VuaXplciAnJHtzfScgZG9lcyBub3QgZXhpc3RgKTtpZihbXCJvcHRpb25zXCIsXCJydWxlc1wiLFwibGV4ZXJcIl0uaW5jbHVkZXMocykpY29udGludWU7bGV0IGE9cyxvPW4udG9rZW5pemVyW2FdLGw9aVthXTtpW2FdPSguLi5wKT0+e2xldCBjPW8uYXBwbHkoaSxwKTtyZXR1cm4gYz09PSExJiYoYz1sLmFwcGx5KGkscCkpLGN9fXIudG9rZW5pemVyPWl9aWYobi5ob29rcyl7bGV0IGk9dGhpcy5kZWZhdWx0cy5ob29rc3x8bmV3IFM7Zm9yKGxldCBzIGluIG4uaG9va3Mpe2lmKCEocyBpbiBpKSl0aHJvdyBuZXcgRXJyb3IoYGhvb2sgJyR7c30nIGRvZXMgbm90IGV4aXN0YCk7aWYoW1wib3B0aW9uc1wiLFwiYmxvY2tcIl0uaW5jbHVkZXMocykpY29udGludWU7bGV0IGE9cyxvPW4uaG9va3NbYV0sbD1pW2FdO1MucGFzc1Rocm91Z2hIb29rcy5oYXMocyk/aVthXT1wPT57aWYodGhpcy5kZWZhdWx0cy5hc3luYyYmUy5wYXNzVGhyb3VnaEhvb2tzUmVzcGVjdEFzeW5jLmhhcyhzKSlyZXR1cm4oYXN5bmMoKT0+e2xldCBnPWF3YWl0IG8uY2FsbChpLHApO3JldHVybiBsLmNhbGwoaSxnKX0pKCk7bGV0IGM9by5jYWxsKGkscCk7cmV0dXJuIGwuY2FsbChpLGMpfTppW2FdPSguLi5wKT0+e2lmKHRoaXMuZGVmYXVsdHMuYXN5bmMpcmV0dXJuKGFzeW5jKCk9PntsZXQgZz1hd2FpdCBvLmFwcGx5KGkscCk7cmV0dXJuIGc9PT0hMSYmKGc9YXdhaXQgbC5hcHBseShpLHApKSxnfSkoKTtsZXQgYz1vLmFwcGx5KGkscCk7cmV0dXJuIGM9PT0hMSYmKGM9bC5hcHBseShpLHApKSxjfX1yLmhvb2tzPWl9aWYobi53YWxrVG9rZW5zKXtsZXQgaT10aGlzLmRlZmF1bHRzLndhbGtUb2tlbnMscz1uLndhbGtUb2tlbnM7ci53YWxrVG9rZW5zPWZ1bmN0aW9uKGEpe2xldCBvPVtdO3JldHVybiBvLnB1c2gocy5jYWxsKHRoaXMsYSkpLGkmJihvPW8uY29uY2F0KGkuY2FsbCh0aGlzLGEpKSksb319dGhpcy5kZWZhdWx0cz17Li4udGhpcy5kZWZhdWx0cywuLi5yfX0pLHRoaXN9c2V0T3B0aW9ucyhlKXtyZXR1cm4gdGhpcy5kZWZhdWx0cz17Li4udGhpcy5kZWZhdWx0cywuLi5lfSx0aGlzfWxleGVyKGUsdCl7cmV0dXJuIHgubGV4KGUsdD8/dGhpcy5kZWZhdWx0cyl9cGFyc2VyKGUsdCl7cmV0dXJuIGIucGFyc2UoZSx0Pz90aGlzLmRlZmF1bHRzKX1wYXJzZU1hcmtkb3duKGUpe3JldHVybihuLHIpPT57bGV0IGk9ey4uLnJ9LHM9ey4uLnRoaXMuZGVmYXVsdHMsLi4uaX0sYT10aGlzLm9uRXJyb3IoISFzLnNpbGVudCwhIXMuYXN5bmMpO2lmKHRoaXMuZGVmYXVsdHMuYXN5bmM9PT0hMCYmaS5hc3luYz09PSExKXJldHVybiBhKG5ldyBFcnJvcihcIm1hcmtlZCgpOiBUaGUgYXN5bmMgb3B0aW9uIHdhcyBzZXQgdG8gdHJ1ZSBieSBhbiBleHRlbnNpb24uIFJlbW92ZSBhc3luYzogZmFsc2UgZnJvbSB0aGUgcGFyc2Ugb3B0aW9ucyBvYmplY3QgdG8gcmV0dXJuIGEgUHJvbWlzZS5cIikpO2lmKHR5cGVvZiBuPlwidVwifHxuPT09bnVsbClyZXR1cm4gYShuZXcgRXJyb3IoXCJtYXJrZWQoKTogaW5wdXQgcGFyYW1ldGVyIGlzIHVuZGVmaW5lZCBvciBudWxsXCIpKTtpZih0eXBlb2YgbiE9XCJzdHJpbmdcIilyZXR1cm4gYShuZXcgRXJyb3IoXCJtYXJrZWQoKTogaW5wdXQgcGFyYW1ldGVyIGlzIG9mIHR5cGUgXCIrT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG4pK1wiLCBzdHJpbmcgZXhwZWN0ZWRcIikpO2lmKHMuaG9va3MmJihzLmhvb2tzLm9wdGlvbnM9cyxzLmhvb2tzLmJsb2NrPWUpLHMuYXN5bmMpcmV0dXJuKGFzeW5jKCk9PntsZXQgbz1zLmhvb2tzP2F3YWl0IHMuaG9va3MucHJlcHJvY2VzcyhuKTpuLHA9YXdhaXQocy5ob29rcz9hd2FpdCBzLmhvb2tzLnByb3ZpZGVMZXhlcigpOmU/eC5sZXg6eC5sZXhJbmxpbmUpKG8scyksYz1zLmhvb2tzP2F3YWl0IHMuaG9va3MucHJvY2Vzc0FsbFRva2VucyhwKTpwO3Mud2Fsa1Rva2VucyYmYXdhaXQgUHJvbWlzZS5hbGwodGhpcy53YWxrVG9rZW5zKGMscy53YWxrVG9rZW5zKSk7bGV0IGg9YXdhaXQocy5ob29rcz9hd2FpdCBzLmhvb2tzLnByb3ZpZGVQYXJzZXIoKTplP2IucGFyc2U6Yi5wYXJzZUlubGluZSkoYyxzKTtyZXR1cm4gcy5ob29rcz9hd2FpdCBzLmhvb2tzLnBvc3Rwcm9jZXNzKGgpOmh9KSgpLmNhdGNoKGEpO3RyeXtzLmhvb2tzJiYobj1zLmhvb2tzLnByZXByb2Nlc3MobikpO2xldCBsPShzLmhvb2tzP3MuaG9va3MucHJvdmlkZUxleGVyKCk6ZT94LmxleDp4LmxleElubGluZSkobixzKTtzLmhvb2tzJiYobD1zLmhvb2tzLnByb2Nlc3NBbGxUb2tlbnMobCkpLHMud2Fsa1Rva2VucyYmdGhpcy53YWxrVG9rZW5zKGwscy53YWxrVG9rZW5zKTtsZXQgYz0ocy5ob29rcz9zLmhvb2tzLnByb3ZpZGVQYXJzZXIoKTplP2IucGFyc2U6Yi5wYXJzZUlubGluZSkobCxzKTtyZXR1cm4gcy5ob29rcyYmKGM9cy5ob29rcy5wb3N0cHJvY2VzcyhjKSksY31jYXRjaChvKXtyZXR1cm4gYShvKX19fW9uRXJyb3IoZSx0KXtyZXR1cm4gbj0+e2lmKG4ubWVzc2FnZSs9YFxuUGxlYXNlIHJlcG9ydCB0aGlzIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWQuYCxlKXtsZXQgcj1cIjxwPkFuIGVycm9yIG9jY3VycmVkOjwvcD48cHJlPlwiK3cobi5tZXNzYWdlK1wiXCIsITApK1wiPC9wcmU+XCI7cmV0dXJuIHQ/UHJvbWlzZS5yZXNvbHZlKHIpOnJ9aWYodClyZXR1cm4gUHJvbWlzZS5yZWplY3Qobik7dGhyb3cgbn19fTt2YXIgXz1uZXcgQjtmdW5jdGlvbiBkKHUsZSl7cmV0dXJuIF8ucGFyc2UodSxlKX1kLm9wdGlvbnM9ZC5zZXRPcHRpb25zPWZ1bmN0aW9uKHUpe3JldHVybiBfLnNldE9wdGlvbnModSksZC5kZWZhdWx0cz1fLmRlZmF1bHRzLFooZC5kZWZhdWx0cyksZH07ZC5nZXREZWZhdWx0cz1MO2QuZGVmYXVsdHM9VDtkLnVzZT1mdW5jdGlvbiguLi51KXtyZXR1cm4gXy51c2UoLi4udSksZC5kZWZhdWx0cz1fLmRlZmF1bHRzLFooZC5kZWZhdWx0cyksZH07ZC53YWxrVG9rZW5zPWZ1bmN0aW9uKHUsZSl7cmV0dXJuIF8ud2Fsa1Rva2Vucyh1LGUpfTtkLnBhcnNlSW5saW5lPV8ucGFyc2VJbmxpbmU7ZC5QYXJzZXI9YjtkLnBhcnNlcj1iLnBhcnNlO2QuUmVuZGVyZXI9UDtkLlRleHRSZW5kZXJlcj0kO2QuTGV4ZXI9eDtkLmxleGVyPXgubGV4O2QuVG9rZW5pemVyPXk7ZC5Ib29rcz1TO2QucGFyc2U9ZDt2YXIgRHQ9ZC5vcHRpb25zLEh0PWQuc2V0T3B0aW9ucyxadD1kLnVzZSxHdD1kLndhbGtUb2tlbnMsTnQ9ZC5wYXJzZUlubGluZSxRdD1kLEZ0PWIucGFyc2UsanQ9eC5sZXg7ZXhwb3J0e1MgYXMgSG9va3MseCBhcyBMZXhlcixCIGFzIE1hcmtlZCxiIGFzIFBhcnNlcixQIGFzIFJlbmRlcmVyLCQgYXMgVGV4dFJlbmRlcmVyLHkgYXMgVG9rZW5pemVyLFQgYXMgZGVmYXVsdHMsTCBhcyBnZXREZWZhdWx0cyxqdCBhcyBsZXhlcixkIGFzIG1hcmtlZCxEdCBhcyBvcHRpb25zLFF0IGFzIHBhcnNlLE50IGFzIHBhcnNlSW5saW5lLEZ0IGFzIHBhcnNlcixIdCBhcyBzZXRPcHRpb25zLFp0IGFzIHVzZSxHdCBhcyB3YWxrVG9rZW5zfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hcmtlZC5lc20uanMubWFwXG4iLCJpbXBvcnQgRE9NUHVyaWZ5IGZyb20gXCJkb21wdXJpZnlcIjtcbmltcG9ydCB7IG1hcmtlZCB9IGZyb20gXCJtYXJrZWRcIjtcblxuLyoqXG4gKiBDb250ZW50IGZvcm1hdCB0eXBlc1xuICovXG5leHBvcnQgdHlwZSBDb250ZW50Rm9ybWF0ID0gXCJodG1sXCIgfCBcIm1hcmtkb3duXCIgfCBcInRleHRcIjtcbi8qKlxuICogQ29uZmlndXJhdGlvbiBmb3IgSFRNTCBzYW5pdGl6YXRpb25cbiAqIFVwZGF0ZWQgZm9yIEZBUSBjb250ZW50OiBQcmlvcml0aXplcyBzYWZlLCByZWFkYWJsZSByaWNoIHRleHQgd2l0aCBmdWxsIGxpbmsgc3VwcG9ydC5cbiAqIEVuaGFuY2VzIHRhYmxlIHN1cHBvcnQgKGluY2x1ZGluZyBjYXB0aW9ucyBhbmQgc3RydWN0dXJhbCBhdHRyaWJ1dGVzIGZvciBiZXR0ZXIgYWNjZXNzaWJpbGl0eS9jb21wbGV4aXR5KS5cbiAqIEFkZHMgb3B0aW9uYWwgdmlkZW8gc3VwcG9ydCAoY29tbWVudGVkIG91dCBieSBkZWZhdWx04oCUdW5jb21tZW50IGlmIGVtYmVkZGluZyB2aWRlb3MgaXMgZGVzaXJlZCBmb3IgRkFRcztcbiAqIG5vdGU6IHRoaXMgaW5jcmVhc2VzIHNlY3VyaXR5IHJldmlldyBuZWVkcyBkdWUgdG8gcG90ZW50aWFsIGV4ZWN1dGFibGUgY29udGVudCkuXG4gKiBSZW1vdmVzIGhlYWRpbmdzIChoMS1oNikgYXMgdGhleSdyZSBsaWtlbHkgdW5uZWNlc3NhcnkgZm9yIEZBUSByZXNwb25zZXMuXG4gKiBSZXRhaW5zIGNvcmUgZm9ybWF0dGluZywgbGlzdHMsIGltYWdlcywgYW5kIHRhYmxlcyBmb3Igc3RydWN0dXJlZCBhbnN3ZXJzLlxuICovXG5jb25zdCBTQU5JVElaRV9DT05GSUcgPSB7XG4gICAgQUxMT1dFRF9UQUdTOiBbXG4gICAgICAgIFwicFwiLFxuICAgICAgICBcImJyXCIsXG4gICAgICAgIFwic3Ryb25nXCIsXG4gICAgICAgIFwiZW1cIixcbiAgICAgICAgXCJ1XCIsXG4gICAgICAgIFwic1wiLFxuICAgICAgICBcImJcIixcbiAgICAgICAgXCJpXCIsXG4gICAgICAgIFwiYVwiLFxuICAgICAgICBcInVsXCIsXG4gICAgICAgIFwib2xcIixcbiAgICAgICAgXCJsaVwiLFxuICAgICAgICBcImNvZGVcIixcbiAgICAgICAgXCJwcmVcIixcbiAgICAgICAgXCJoclwiLFxuICAgICAgICBcInRhYmxlXCIsXG4gICAgICAgIFwiY2FwdGlvblwiLCAvLyBBZGRlZCBmb3IgdGFibGUgdGl0bGVzL2Rlc2NyaXB0aW9uc1xuICAgICAgICBcInRoZWFkXCIsXG4gICAgICAgIFwidGJvZHlcIixcbiAgICAgICAgXCJ0Zm9vdFwiLCAvLyBBZGRlZCBmb3IgdGFibGUgZm9vdGVycyAoZS5nLiwgc3VtbWFyaWVzL3RvdGFscylcbiAgICAgICAgXCJ0clwiLFxuICAgICAgICBcInRoXCIsXG4gICAgICAgIFwidGRcIixcbiAgICAgICAgXCJjb2xcIiwgLy8gQWRkZWQgZm9yIGNvbHVtbiBwcm9wZXJ0aWVzXG4gICAgICAgIFwiY29sZ3JvdXBcIiwgLy8gQWRkZWQgZm9yIGdyb3VwaW5nIGNvbHVtbnNcbiAgICAgICAgXCJpbWdcIixcbiAgICAgICAgXCJkaXZcIixcbiAgICAgICAgXCJzcGFuXCIsXG4gICAgICAgIFwidmlkZW9cIiwgLy8gVW5jb21tZW50IHRvIGVuYWJsZSA8dmlkZW8+IGZvciBlbWJlZGRlZCB2aWRlb3NcbiAgICAgICAgXCJzb3VyY2VcIiwgLy8gVW5jb21tZW50IGlmIGVuYWJsaW5nIHZpZGVvIChmb3IgPHZpZGVvPiBzb3VyY2VzKVxuICAgICAgICBcImZpZ3VyZVwiLCAvLyBPcHRpb25hbDogRm9yIHdyYXBwaW5nIGltYWdlcy90YWJsZXMgd2l0aCBjYXB0aW9uc1xuICAgICAgICBcImZpZ2NhcHRpb25cIiAvLyBPcHRpb25hbDogRm9yIGZpZ3VyZSBkZXNjcmlwdGlvbnNcbiAgICBdLFxuICAgIEFMTE9XRURfQVRUUjogW1xuICAgICAgICBcImhyZWZcIixcbiAgICAgICAgXCJ0aXRsZVwiLFxuICAgICAgICBcInRhcmdldFwiLFxuICAgICAgICBcInJlbFwiLFxuICAgICAgICBcInNyY1wiLFxuICAgICAgICBcImFsdFwiLFxuICAgICAgICBcIndpZHRoXCIsXG4gICAgICAgIFwiaGVpZ2h0XCIsXG4gICAgICAgIFwiY2xhc3NcIixcbiAgICAgICAgXCJpZFwiLFxuICAgICAgICBcInN0eWxlXCIsXG4gICAgICAgIC8vIFRhYmxlLXNwZWNpZmljIGF0dHJpYnV0ZXMgZm9yIHN0cnVjdHVyZSBhbmQgYWNjZXNzaWJpbGl0eVxuICAgICAgICBcInJvd3NwYW5cIixcbiAgICAgICAgXCJjb2xzcGFuXCIsXG4gICAgICAgIFwic2NvcGVcIiwgLy8gRm9yIDx0aD4gKGUuZy4sIHJvdywgY29sLCByb3dncm91cClcbiAgICAgICAgXCJoZWFkZXJzXCIsIC8vIEZvciBhc3NvY2lhdGluZyA8dGQ+IHdpdGggPHRoPlxuICAgICAgICAvLyBWaWRlby1zcGVjaWZpYyAodW5jb21tZW50IGlmIGVuYWJsaW5nIHZpZGVvKVxuICAgICAgICBcImNvbnRyb2xzXCIsXG4gICAgICAgIFwiYXV0b3BsYXlcIixcbiAgICAgICAgXCJsb29wXCIsXG4gICAgICAgIFwibXV0ZWRcIixcbiAgICAgICAgXCJwb3N0ZXJcIlxuICAgIF0sXG4gICAgQUxMT1dfREFUQV9BVFRSOiBmYWxzZSwgLy8gS2VlcCBmYWxzZSBmb3Igc2VjdXJpdHk7IGVuYWJsZSBvbmx5IGlmIGN1c3RvbSBkYXRhIGF0dHJzIGFyZSB2ZXR0ZWRcbiAgICBBTExPV0VEX1VSSV9SRUdFWFA6XG4gICAgICAgIC9eKD86KD86KD86ZnxodCl0cHM/fG1haWx0b3x0ZWx8Y2FsbHRvfHNtc3xjaWR8eG1wcCk6fFteYS16XXxbYS16Ky4tXSsoPzpbXmEteisuLTpdfCQpKS9pXG59O1xuXG4vKipcbiAqIFZhbGlkYXRlcyBhbmQgc2FuaXRpemVzIEhUTUwgY29udGVudFxuICogQHBhcmFtIGh0bWwgLSBUaGUgSFRNTCBzdHJpbmcgdG8gc2FuaXRpemVcbiAqIEByZXR1cm5zIFNhbml0aXplZCBIVE1MIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVIVE1MKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFodG1sKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIENvbmZpZ3VyZSBET01QdXJpZnlcbiAgICAgICAgY29uc3QgY2xlYW5IVE1MID0gRE9NUHVyaWZ5LnNhbml0aXplKGh0bWwsIFNBTklUSVpFX0NPTkZJRyk7XG4gICAgICAgIHJldHVybiBjbGVhbkhUTUw7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNhbml0aXppbmcgSFRNTDpcIiwgZXJyb3IpO1xuICAgICAgICAvLyBSZXR1cm4gZXNjYXBlZCB0ZXh0IGFzIGZhbGxiYWNrXG4gICAgICAgIHJldHVybiBlc2NhcGVIVE1MKGh0bWwpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgSFRNTCBjb250ZW50IGFuZCByZXR1cm5zIHZhbGlkYXRpb24gZXJyb3JzXG4gKiBAcGFyYW0gaHRtbCAtIFRoZSBIVE1MIHN0cmluZyB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgQXJyYXkgb2YgdmFsaWRhdGlvbiBlcnJvciBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVIVE1MKGh0bWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoIWh0bWwpIHtcbiAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igc2NyaXB0IHRhZ3MgKHNob3VsZCBiZSBibG9ja2VkKVxuICAgIGlmICgvPHNjcmlwdFtePl0qPltcXHNcXFNdKj88XFwvc2NyaXB0Pi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiU2NyaXB0IHRhZ3MgYXJlIG5vdCBhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBldmVudCBoYW5kbGVycyAoc2hvdWxkIGJlIGJsb2NrZWQpXG4gICAgaWYgKC9vblxcdytcXHMqPS9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiRXZlbnQgaGFuZGxlcnMgKG9uY2xpY2ssIG9ubG9hZCwgZXRjLikgYXJlIG5vdCBhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBqYXZhc2NyaXB0OiBwcm90b2NvbFxuICAgIGlmICgvamF2YXNjcmlwdDovZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIkphdmFTY3JpcHQgcHJvdG9jb2wgaW4gVVJMcyBpcyBub3QgYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29uc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgZGF0YTogcHJvdG9jb2wgKGV4Y2VwdCBmb3IgaW1hZ2VzKVxuICAgIGlmICgvZGF0YTooPyFpbWFnZSkvZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIkRhdGEgVVJMcyBhcmUgb25seSBhbGxvd2VkIGZvciBpbWFnZXNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGlmcmFtZSAobm90IGluIGFsbG93ZWQgdGFncylcbiAgICBpZiAoLzxpZnJhbWVbXj5dKj4vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIklmcmFtZSB0YWdzIGFyZSBub3QgYWxsb3dlZFwiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igb2JqZWN0IGFuZCBlbWJlZCB0YWdzXG4gICAgaWYgKC88KG9iamVjdHxlbWJlZClbXj5dKj4vZ2kudGVzdChodG1sKSkge1xuICAgICAgICBlcnJvcnMucHVzaChcIk9iamVjdCBhbmQgZW1iZWQgdGFncyBhcmUgbm90IGFsbG93ZWRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVycm9ycztcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgSFRNTCBzeW50YXggZm9yIG1hbGZvcm1lZCBtYXJrdXBcbiAqIEBwYXJhbSBodG1sIC0gVGhlIEhUTUwgc3RyaW5nIHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBBcnJheSBvZiBzeW50YXggZXJyb3IgbWVzc2FnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSFRNTFN5bnRheChodG1sOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKCFodG1sKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfVxuXG4gICAgY29uc3QgYWxsVGFncyA9IGh0bWwubWF0Y2goLzxbXj5dKz4vZykgfHwgW107XG5cbiAgICBhbGxUYWdzLmZvckVhY2goKHRhZykgPT4ge1xuICAgICAgICAvLyBDaGVjayBmb3IgYXR0cmlidXRlcyB3aXRoIHVuY2xvc2VkIHF1b3Rlc1xuICAgICAgICAvLyBMb29rIGZvciBhdHRyPVwiIG9yIGF0dHI9JyB0aGF0IGRvZXNuJ3QgaGF2ZSBhIG1hdGNoaW5nIGNsb3NpbmcgcXVvdGVcbiAgICAgICAgY29uc3Qgc2luZ2xlUXVvdGVNYXRjaGVzID0gdGFnLm1hdGNoKC9cXHcrXFxzKj1cXHMqJ1teJ10qJC8pO1xuICAgICAgICBjb25zdCBkb3VibGVRdW90ZU1hdGNoZXMgPSB0YWcubWF0Y2goL1xcdytcXHMqPVxccypcIlteXCJdKiQvKTtcblxuICAgICAgICBpZiAoc2luZ2xlUXVvdGVNYXRjaGVzIHx8IGRvdWJsZVF1b3RlTWF0Y2hlcykge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgYFVuY2xvc2VkIGF0dHJpYnV0ZSBxdW90ZSBpbiB0YWc6ICR7dGFnLnN1YnN0cmluZygwLCA1MCl9JHtcbiAgICAgICAgICAgICAgICAgICAgdGFnLmxlbmd0aCA+IDUwID8gXCIuLi5cIiA6IFwiXCJcbiAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBvcGVuaW5nIHRhZyAobWlzc2luZyA+KVxuICAgICAgICBpZiAodGFnLnN0YXJ0c1dpdGgoXCI8XCIpICYmICF0YWcuZW5kc1dpdGgoXCI+XCIpKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICBgVW5jbG9zZWQgdGFnIGJyYWNrZXQ6ICR7dGFnLnN1YnN0cmluZygwLCA1MCl9JHt0YWcubGVuZ3RoID4gNTAgPyBcIi4uLlwiIDogXCJcIn1gXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBmb3IgYmFsYW5jZWQgdGFncyAob3BlbmluZyBhbmQgY2xvc2luZylcbiAgICAvLyBTZWxmLWNsb3NpbmcgdGFncyB0aGF0IGRvbid0IG5lZWQgY2xvc2luZyB0YWdzXG4gICAgY29uc3Qgc2VsZkNsb3NpbmdUYWdzID0gW1xuICAgICAgICBcImFyZWFcIixcbiAgICAgICAgXCJiYXNlXCIsXG4gICAgICAgIFwiYnJcIixcbiAgICAgICAgXCJjb2xcIixcbiAgICAgICAgXCJlbWJlZFwiLFxuICAgICAgICBcImhyXCIsXG4gICAgICAgIFwiaW1nXCIsXG4gICAgICAgIFwiaW5wdXRcIixcbiAgICAgICAgXCJsaW5rXCIsXG4gICAgICAgIFwibWV0YVwiLFxuICAgICAgICBcInBhcmFtXCIsXG4gICAgICAgIFwic291cmNlXCIsXG4gICAgICAgIFwidHJhY2tcIixcbiAgICAgICAgXCJ3YnJcIlxuICAgIF07XG5cbiAgICAvLyBFeHRyYWN0IGFsbCB0YWdzIChvcGVuaW5nIGFuZCBjbG9zaW5nKVxuICAgIGNvbnN0IHRhZ1N0YWNrOiBBcnJheTx7IHRhZzogc3RyaW5nOyBwb3NpdGlvbjogbnVtYmVyIH0+ID0gW107XG4gICAgY29uc3QgdGFnUmVnZXggPSAvPFxcLz8oW2EtekEtWl1bYS16QS1aMC05XSopW14+XSo+L2c7XG4gICAgbGV0IG1hdGNoO1xuXG4gICAgd2hpbGUgKChtYXRjaCA9IHRhZ1JlZ2V4LmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGZ1bGxUYWcgPSBtYXRjaFswXTtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IGlzQ2xvc2luZyA9IGZ1bGxUYWcuc3RhcnRzV2l0aChcIjwvXCIpO1xuICAgICAgICBjb25zdCBpc1NlbGZDbG9zaW5nID0gZnVsbFRhZy5lbmRzV2l0aChcIi8+XCIpIHx8IHNlbGZDbG9zaW5nVGFncy5pbmNsdWRlcyh0YWdOYW1lKTtcblxuICAgICAgICBpZiAoaXNDbG9zaW5nKSB7XG4gICAgICAgICAgICAvLyBDbG9zaW5nIHRhZyAtIHBvcCBmcm9tIHN0YWNrXG4gICAgICAgICAgICBpZiAodGFnU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goYE9ycGhhbmVkIGNsb3NpbmcgdGFnOiA8LyR7dGFnTmFtZX0+YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RPcGVuZWQgPSB0YWdTdGFja1t0YWdTdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAobGFzdE9wZW5lZC50YWcgPT09IHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnU3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWlzbWF0Y2hlZCB0YWdcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICBgTWlzbWF0Y2hlZCB0YWdzOiBFeHBlY3RlZCBjbG9zaW5nIHRhZyBmb3IgPCR7bGFzdE9wZW5lZC50YWd9PiwgZm91bmQgPC8ke3RhZ05hbWV9PmBcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgbWF0Y2hpbmcgb3BlbmluZyB0YWcgaW4gc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hJbmRleCA9IHRhZ1N0YWNrLmZpbmRJbmRleCgodCkgPT4gdC50YWcgPT09IHRhZ05hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdTdGFjay5zcGxpY2UobWF0Y2hJbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzU2VsZkNsb3NpbmcpIHtcbiAgICAgICAgICAgIC8vIE9wZW5pbmcgdGFnIC0gcHVzaCB0byBzdGFja1xuICAgICAgICAgICAgdGFnU3RhY2sucHVzaCh7IHRhZzogdGFnTmFtZSwgcG9zaXRpb246IG1hdGNoLmluZGV4IH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIHRhZ3MgcmVtYWluaW5nIGluIHN0YWNrXG4gICAgaWYgKHRhZ1N0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGFnU3RhY2suZm9yRWFjaCgoeyB0YWcgfSkgPT4ge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goYFVuY2xvc2VkIHRhZzogPCR7dGFnfT4gaXMgbWlzc2luZyBjbG9zaW5nIHRhZyA8LyR7dGFnfT5gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG1hbGZvcm1lZCBhdHRyaWJ1dGVzIChubyB2YWx1ZSwgbWFsZm9ybWVkIHN5bnRheClcbiAgICBjb25zdCBtYWxmb3JtZWRBdHRyUGF0dGVybiA9IC88W14+XStcXHMrKFxcdyspXFxzKj1cXHMqKD8hW1wiXFx3XSlbXj5dKj4vZztcbiAgICBsZXQgYXR0ck1hdGNoO1xuICAgIHdoaWxlICgoYXR0ck1hdGNoID0gbWFsZm9ybWVkQXR0clBhdHRlcm4uZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgICAgICBgTWFsZm9ybWVkIGF0dHJpYnV0ZSBzeW50YXg6ICR7YXR0ck1hdGNoWzBdLnN1YnN0cmluZygwLCA1MCl9JHtcbiAgICAgICAgICAgICAgICBhdHRyTWF0Y2hbMF0ubGVuZ3RoID4gNTAgPyBcIi4uLlwiIDogXCJcIlxuICAgICAgICAgICAgfWBcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3JzO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIG1hcmtkb3duIHRvIEhUTUxcbiAqIEBwYXJhbSBtYXJrZG93biAtIFRoZSBtYXJrZG93biBzdHJpbmcgdG8gY29udmVydFxuICogQHJldHVybnMgSFRNTCBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtkb3duVG9IVE1MKG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghbWFya2Rvd24pIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gQ29uZmlndXJlIG1hcmtlZCBmb3Igc2VjdXJpdHlcbiAgICAgICAgbWFya2VkLnNldE9wdGlvbnMoe1xuICAgICAgICAgICAgYnJlYWtzOiB0cnVlLFxuICAgICAgICAgICAgZ2ZtOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGh0bWwgPSBtYXJrZWQucGFyc2UobWFya2Rvd24pIGFzIHN0cmluZztcbiAgICAgICAgLy8gU2FuaXRpemUgdGhlIGdlbmVyYXRlZCBIVE1MXG4gICAgICAgIHJldHVybiBzYW5pdGl6ZUhUTUwoaHRtbCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHBhcnNpbmcgbWFya2Rvd246XCIsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGVzY2FwZUhUTUwobWFya2Rvd24pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBFc2NhcGVzIEhUTUwgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gKiBAcGFyYW0gdGV4dCAtIFRoZSB0ZXh0IHRvIGVzY2FwZVxuICogQHJldHVybnMgRXNjYXBlZCB0ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVIVE1MKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBkaXYudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgIHJldHVybiBkaXYuaW5uZXJIVE1MO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHBsYWluIHRleHQgdG8gSFRNTCB3aXRoIGxpbmUgYnJlYWtzXG4gKiBAcGFyYW0gdGV4dCAtIFRoZSBwbGFpbiB0ZXh0IHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIEhUTUwgc3RyaW5nIHdpdGggbGluZSBicmVha3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRUb0hUTUwodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgLy8gRXNjYXBlIEhUTUwgY2hhcmFjdGVycyBhbmQgY29udmVydCBsaW5lIGJyZWFrcyB0byA8YnI+XG4gICAgY29uc3QgZXNjYXBlZCA9IGVzY2FwZUhUTUwodGV4dCk7XG4gICAgcmV0dXJuIGVzY2FwZWQucmVwbGFjZSgvXFxuL2csIFwiPGJyPlwiKTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgY29udGVudCBiYXNlZCBvbiBmb3JtYXQgYW5kIHJldHVybnMgc2FuaXRpemVkIEhUTUxcbiAqIEBwYXJhbSBjb250ZW50IC0gVGhlIGNvbnRlbnQgc3RyaW5nXG4gKiBAcGFyYW0gZm9ybWF0IC0gVGhlIGNvbnRlbnQgZm9ybWF0IChodG1sLCBtYXJrZG93biwgb3IgdGV4dClcbiAqIEByZXR1cm5zIFNhbml0aXplZCBIVE1MIHN0cmluZyBvciBlc2NhcGVkIG1hcmtkb3duXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzQ29udGVudChjb250ZW50OiBzdHJpbmcsIGZvcm1hdDogQ29udGVudEZvcm1hdCk6IHN0cmluZyB7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgIGNhc2UgXCJodG1sXCI6XG4gICAgICAgICAgICByZXR1cm4gc2FuaXRpemVIVE1MKGNvbnRlbnQpO1xuICAgICAgICBjYXNlIFwibWFya2Rvd25cIjpcbiAgICAgICAgICAgIC8vIENvbnZlcnQgbWFya2Rvd24gdG8gSFRNTCBhbmQgc2FuaXRpemUgaXRcbiAgICAgICAgICAgIHJldHVybiBtYXJrZG93blRvSFRNTChjb250ZW50KTtcbiAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgIHJldHVybiB0ZXh0VG9IVE1MKGNvbnRlbnQpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVW5yZWNvZ25pemVkIGZvcm1hdCAtIHRyZWF0IGFzIEhUTUwgYW5kIHNhbml0aXplIGZvciBzYWZldHlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5yZWNvZ25pemVkIGNvbnRlbnQgZm9ybWF0IFwiJHtmb3JtYXR9XCIsIHRyZWF0aW5nIGFzIEhUTUxgKTtcbiAgICAgICAgICAgIHJldHVybiBzYW5pdGl6ZUhUTUwoY29udGVudCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldHMgdmFsaWRhdGlvbiB3YXJuaW5ncyBmb3IgY29udGVudCBiYXNlZCBvbiBmb3JtYXRcbiAqIEBwYXJhbSBjb250ZW50IC0gVGhlIGNvbnRlbnQgc3RyaW5nXG4gKiBAcGFyYW0gZm9ybWF0IC0gVGhlIGNvbnRlbnQgZm9ybWF0XG4gKiBAcmV0dXJucyBBcnJheSBvZiB3YXJuaW5nIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZW50V2FybmluZ3MoY29udGVudDogc3RyaW5nLCBmb3JtYXQ6IENvbnRlbnRGb3JtYXQpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgYm90aCBzZWN1cml0eSBpc3N1ZXMgYW5kIHN5bnRheFxuICAgICAgICAgICAgY29uc3Qgc2VjdXJpdHlXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTChjb250ZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHN5bnRheFdhcm5pbmdzID0gdmFsaWRhdGVIVE1MU3ludGF4KGNvbnRlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIFsuLi5zZWN1cml0eVdhcm5pbmdzLCAuLi5zeW50YXhXYXJuaW5nc107XG4gICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGRhbmdlcm91cyBIVE1MIGVtYmVkZGVkIGluIG1hcmtkb3duXG4gICAgICAgICAgICAvLyBVc2VycyBtaWdodCB0cnkgdG8gaW5jbHVkZSA8c2NyaXB0PiB0YWdzIGluIHRoZWlyIG1hcmtkb3duXG4gICAgICAgICAgICBjb25zdCBodG1sUGF0dGVybiA9IC88W14+XSs+L2c7XG4gICAgICAgICAgICBjb25zdCBodG1sTWF0Y2hlcyA9IGNvbnRlbnQubWF0Y2goaHRtbFBhdHRlcm4pO1xuXG4gICAgICAgICAgICBpZiAoaHRtbE1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGp1c3QgdGhlIEhUTUwgcGFydHMgYW5kIHZhbGlkYXRlIHRoZW1cbiAgICAgICAgICAgICAgICBjb25zdCBodG1sQ29udGVudCA9IGh0bWxNYXRjaGVzLmpvaW4oXCJcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbFNlY3VyaXR5V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUwoaHRtbENvbnRlbnQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGh0bWxTeW50YXhXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTFN5bnRheChodG1sQ29udGVudCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhbGxXYXJuaW5ncyA9IFsuLi5odG1sU2VjdXJpdHlXYXJuaW5ncywgLi4uaHRtbFN5bnRheFdhcm5pbmdzXTtcbiAgICAgICAgICAgICAgICBpZiAoYWxsV2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxsV2FybmluZ3MubWFwKCh3YXJuaW5nKSA9PiBgRW1iZWRkZWQgSFRNTCBpbiBtYXJrZG93bjogJHt3YXJuaW5nfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgIC8vIFRleHQgZm9ybWF0IGRvZXNuJ3QgbmVlZCB2YWxpZGF0aW9uIChldmVyeXRoaW5nIGlzIGVzY2FwZWQpXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuaW1wb3J0IHsgcHJvY2Vzc0NvbnRlbnQsIGdldENvbnRlbnRXYXJuaW5ncyB9IGZyb20gXCIuLi91dGlscy9jb250ZW50UHJvY2Vzc29yXCI7XG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5cbmludGVyZmFjZSBGQVFJdGVtRGF0YSB7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICBjb250ZW50Rm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bTtcbiAgICBzb3J0T3JkZXI/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBGQVFJdGVtc0xpc3RQcm9wcyB7XG4gICAgaXRlbXM6IEZBUUl0ZW1EYXRhW107XG4gICAgZXhwYW5kZWRJdGVtczogU2V0PG51bWJlcj47XG4gICAgYW5pbWF0aW9uRHVyYXRpb246IG51bWJlcjtcbiAgICBvblRvZ2dsZUl0ZW06IChpbmRleDogbnVtYmVyKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIEZBUSBpdGVtcyBsaXN0IGluIG5vcm1hbCAobm9uLWVkaXQpIG1vZGVcbiAqIFVzZXMgc2VtYW50aWMgSFRNTCBkZXRhaWxzL3N1bW1hcnkgZWxlbWVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZBUUl0ZW1zTGlzdCh7XG4gICAgaXRlbXMsXG4gICAgZXhwYW5kZWRJdGVtcyxcbiAgICBhbmltYXRpb25EdXJhdGlvbixcbiAgICBvblRvZ2dsZUl0ZW1cbn06IEZBUUl0ZW1zTGlzdFByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24taXRlbXNcIj5cbiAgICAgICAgICAgIHtpdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNFeHBhbmRlZCA9IGV4cGFuZGVkSXRlbXMuaGFzKGluZGV4KTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5VmFsdWUgPSBpdGVtLnN1bW1hcnk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudFZhbHVlID0gaXRlbS5jb250ZW50O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRGb3JtYXQgPSBpdGVtLmNvbnRlbnRGb3JtYXQ7XG5cbiAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIGNvbnRlbnQgYmFzZWQgb24gZm9ybWF0IGFuZCBzYW5pdGl6ZVxuICAgICAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvbnRlbnQgPSBwcm9jZXNzQ29udGVudChjb250ZW50VmFsdWUsIGNvbnRlbnRGb3JtYXQpO1xuXG4gICAgICAgICAgICAgICAgLy8gR2V0IHZhbGlkYXRpb24gd2FybmluZ3MgKG9ubHkgZm9yIEhUTUwgZm9ybWF0KVxuICAgICAgICAgICAgICAgIGNvbnN0IHdhcm5pbmdzID0gZ2V0Q29udGVudFdhcm5pbmdzKGNvbnRlbnRWYWx1ZSwgY29udGVudEZvcm1hdCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8ZGV0YWlsc1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpbmRleH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1pdGVtLS1leHBhbmRlZFwiOiBpc0V4cGFuZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW49e2lzRXhwYW5kZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIi0tYW5pbWF0aW9uLWR1cmF0aW9uXCI6IGAke2FuaW1hdGlvbkR1cmF0aW9ufW1zYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgUmVhY3QuQ1NTUHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3VtbWFyeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1pdGVtLXN1bW1hcnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25Ub2dnbGVJdGVtKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIgfHwgZS5rZXkgPT09IFwiIFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblRvZ2dsZUl0ZW0oaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJJbmRleD17MH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb2xlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmlhLWV4cGFuZGVkPXtpc0V4cGFuZGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhcS1pdGVtLXN1bW1hcnktdGV4dFwiPntzdW1tYXJ5VmFsdWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtLWljb25cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtaXRlbS1pY29uLS1leHBhbmRlZFwiOiBpc0V4cGFuZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg9XCIxNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9XCIxNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw9XCJub25lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQ9XCJNNCA2TDggMTBMMTIgNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlPVwiY3VycmVudENvbG9yXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXaWR0aD1cIjJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3N1bW1hcnk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0td2FybmluZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3YXJuaW5ncy5tYXAoKHdhcm5pbmcsIHdJbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt3SW5kZXh9IGNsYXNzTmFtZT1cImZhcS1pdGVtLXdhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pqg77iPIHt3YXJuaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtaXRlbS1jb250ZW50LWlubmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBwcm9jZXNzZWRDb250ZW50IH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2RldGFpbHM+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgdXNlTWVtbywgdXNlTGF5b3V0RWZmZWN0LCB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCc7XG5cbmZ1bmN0aW9uIHVzZUNvbWJpbmVkUmVmcygpIHtcbiAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIHJlZnMgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgcmVmc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuXG4gIHJldHVybiB1c2VNZW1vKCgpID0+IG5vZGUgPT4ge1xuICAgIHJlZnMuZm9yRWFjaChyZWYgPT4gcmVmKG5vZGUpKTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICByZWZzKTtcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvbWFzdGVyL3BhY2thZ2VzL3NoYXJlZC9FeGVjdXRpb25FbnZpcm9ubWVudC5qc1xuY29uc3QgY2FuVXNlRE9NID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5kb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50ICE9PSAndW5kZWZpbmVkJztcblxuZnVuY3Rpb24gaXNXaW5kb3coZWxlbWVudCkge1xuICBjb25zdCBlbGVtZW50U3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGVsZW1lbnQpO1xuICByZXR1cm4gZWxlbWVudFN0cmluZyA9PT0gJ1tvYmplY3QgV2luZG93XScgfHwgLy8gSW4gRWxlY3Ryb24gY29udGV4dCB0aGUgV2luZG93IG9iamVjdCBzZXJpYWxpemVzIHRvIFtvYmplY3QgZ2xvYmFsXVxuICBlbGVtZW50U3RyaW5nID09PSAnW29iamVjdCBnbG9iYWxdJztcbn1cblxuZnVuY3Rpb24gaXNOb2RlKG5vZGUpIHtcbiAgcmV0dXJuICdub2RlVHlwZScgaW4gbm9kZTtcbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93KHRhcmdldCkge1xuICB2YXIgX3RhcmdldCRvd25lckRvY3VtZW50LCBfdGFyZ2V0JG93bmVyRG9jdW1lbnQyO1xuXG4gIGlmICghdGFyZ2V0KSB7XG4gICAgcmV0dXJuIHdpbmRvdztcbiAgfVxuXG4gIGlmIChpc1dpbmRvdyh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuXG4gIGlmICghaXNOb2RlKHRhcmdldCkpIHtcbiAgICByZXR1cm4gd2luZG93O1xuICB9XG5cbiAgcmV0dXJuIChfdGFyZ2V0JG93bmVyRG9jdW1lbnQgPSAoX3RhcmdldCRvd25lckRvY3VtZW50MiA9IHRhcmdldC5vd25lckRvY3VtZW50KSA9PSBudWxsID8gdm9pZCAwIDogX3RhcmdldCRvd25lckRvY3VtZW50Mi5kZWZhdWx0VmlldykgIT0gbnVsbCA/IF90YXJnZXQkb3duZXJEb2N1bWVudCA6IHdpbmRvdztcbn1cblxuZnVuY3Rpb24gaXNEb2N1bWVudChub2RlKSB7XG4gIGNvbnN0IHtcbiAgICBEb2N1bWVudFxuICB9ID0gZ2V0V2luZG93KG5vZGUpO1xuICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIERvY3VtZW50O1xufVxuXG5mdW5jdGlvbiBpc0hUTUxFbGVtZW50KG5vZGUpIHtcbiAgaWYgKGlzV2luZG93KG5vZGUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBnZXRXaW5kb3cobm9kZSkuSFRNTEVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGlzU1ZHRWxlbWVudChub2RlKSB7XG4gIHJldHVybiBub2RlIGluc3RhbmNlb2YgZ2V0V2luZG93KG5vZGUpLlNWR0VsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGdldE93bmVyRG9jdW1lbnQodGFyZ2V0KSB7XG4gIGlmICghdGFyZ2V0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgaWYgKGlzV2luZG93KHRhcmdldCkpIHtcbiAgICByZXR1cm4gdGFyZ2V0LmRvY3VtZW50O1xuICB9XG5cbiAgaWYgKCFpc05vZGUodGFyZ2V0KSkge1xuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuXG4gIGlmIChpc0RvY3VtZW50KHRhcmdldCkpIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgaWYgKGlzSFRNTEVsZW1lbnQodGFyZ2V0KSB8fCBpc1NWR0VsZW1lbnQodGFyZ2V0KSkge1xuICAgIHJldHVybiB0YXJnZXQub3duZXJEb2N1bWVudDtcbiAgfVxuXG4gIHJldHVybiBkb2N1bWVudDtcbn1cblxuLyoqXHJcbiAqIEEgaG9vayB0aGF0IHJlc29sdmVzIHRvIHVzZUVmZmVjdCBvbiB0aGUgc2VydmVyIGFuZCB1c2VMYXlvdXRFZmZlY3Qgb24gdGhlIGNsaWVudFxyXG4gKiBAcGFyYW0gY2FsbGJhY2sge2Z1bmN0aW9ufSBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIGludm9rZWQgd2hlbiB0aGUgZGVwZW5kZW5jaWVzIG9mIHRoZSBob29rIGNoYW5nZVxyXG4gKi9cblxuY29uc3QgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCA9IGNhblVzZURPTSA/IHVzZUxheW91dEVmZmVjdCA6IHVzZUVmZmVjdDtcblxuZnVuY3Rpb24gdXNlRXZlbnQoaGFuZGxlcikge1xuICBjb25zdCBoYW5kbGVyUmVmID0gdXNlUmVmKGhhbmRsZXIpO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBoYW5kbGVyUmVmLmN1cnJlbnQgPSBoYW5kbGVyO1xuICB9KTtcbiAgcmV0dXJuIHVzZUNhbGxiYWNrKGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhbmRsZXJSZWYuY3VycmVudCA9PSBudWxsID8gdm9pZCAwIDogaGFuZGxlclJlZi5jdXJyZW50KC4uLmFyZ3MpO1xuICB9LCBbXSk7XG59XG5cbmZ1bmN0aW9uIHVzZUludGVydmFsKCkge1xuICBjb25zdCBpbnRlcnZhbFJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3Qgc2V0ID0gdXNlQ2FsbGJhY2soKGxpc3RlbmVyLCBkdXJhdGlvbikgPT4ge1xuICAgIGludGVydmFsUmVmLmN1cnJlbnQgPSBzZXRJbnRlcnZhbChsaXN0ZW5lciwgZHVyYXRpb24pO1xuICB9LCBbXSk7XG4gIGNvbnN0IGNsZWFyID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChpbnRlcnZhbFJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsUmVmLmN1cnJlbnQpO1xuICAgICAgaW50ZXJ2YWxSZWYuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICB9LCBbXSk7XG4gIHJldHVybiBbc2V0LCBjbGVhcl07XG59XG5cbmZ1bmN0aW9uIHVzZUxhdGVzdFZhbHVlKHZhbHVlLCBkZXBlbmRlbmNpZXMpIHtcbiAgaWYgKGRlcGVuZGVuY2llcyA9PT0gdm9pZCAwKSB7XG4gICAgZGVwZW5kZW5jaWVzID0gW3ZhbHVlXTtcbiAgfVxuXG4gIGNvbnN0IHZhbHVlUmVmID0gdXNlUmVmKHZhbHVlKTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHZhbHVlUmVmLmN1cnJlbnQgIT09IHZhbHVlKSB7XG4gICAgICB2YWx1ZVJlZi5jdXJyZW50ID0gdmFsdWU7XG4gICAgfVxuICB9LCBkZXBlbmRlbmNpZXMpO1xuICByZXR1cm4gdmFsdWVSZWY7XG59XG5cbmZ1bmN0aW9uIHVzZUxhenlNZW1vKGNhbGxiYWNrLCBkZXBlbmRlbmNpZXMpIHtcbiAgY29uc3QgdmFsdWVSZWYgPSB1c2VSZWYoKTtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gY2FsbGJhY2sodmFsdWVSZWYuY3VycmVudCk7XG4gICAgdmFsdWVSZWYuY3VycmVudCA9IG5ld1ZhbHVlO1xuICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbLi4uZGVwZW5kZW5jaWVzXSk7XG59XG5cbmZ1bmN0aW9uIHVzZU5vZGVSZWYob25DaGFuZ2UpIHtcbiAgY29uc3Qgb25DaGFuZ2VIYW5kbGVyID0gdXNlRXZlbnQob25DaGFuZ2UpO1xuICBjb25zdCBub2RlID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBzZXROb2RlUmVmID0gdXNlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgaWYgKGVsZW1lbnQgIT09IG5vZGUuY3VycmVudCkge1xuICAgICAgb25DaGFuZ2VIYW5kbGVyID09IG51bGwgPyB2b2lkIDAgOiBvbkNoYW5nZUhhbmRsZXIoZWxlbWVudCwgbm9kZS5jdXJyZW50KTtcbiAgICB9XG5cbiAgICBub2RlLmN1cnJlbnQgPSBlbGVtZW50O1xuICB9LCAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICBbXSk7XG4gIHJldHVybiBbbm9kZSwgc2V0Tm9kZVJlZl07XG59XG5cbmZ1bmN0aW9uIHVzZVByZXZpb3VzKHZhbHVlKSB7XG4gIGNvbnN0IHJlZiA9IHVzZVJlZigpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJlZi5jdXJyZW50ID0gdmFsdWU7XG4gIH0sIFt2YWx1ZV0pO1xuICByZXR1cm4gcmVmLmN1cnJlbnQ7XG59XG5cbmxldCBpZHMgPSB7fTtcbmZ1bmN0aW9uIHVzZVVuaXF1ZUlkKHByZWZpeCwgdmFsdWUpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNvbnN0IGlkID0gaWRzW3ByZWZpeF0gPT0gbnVsbCA/IDAgOiBpZHNbcHJlZml4XSArIDE7XG4gICAgaWRzW3ByZWZpeF0gPSBpZDtcbiAgICByZXR1cm4gcHJlZml4ICsgXCItXCIgKyBpZDtcbiAgfSwgW3ByZWZpeCwgdmFsdWVdKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQWRqdXN0bWVudEZuKG1vZGlmaWVyKSB7XG4gIHJldHVybiBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFkanVzdG1lbnRzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFkanVzdG1lbnRzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWRqdXN0bWVudHMucmVkdWNlKChhY2N1bXVsYXRvciwgYWRqdXN0bWVudCkgPT4ge1xuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGFkanVzdG1lbnQpO1xuXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlQWRqdXN0bWVudF0gb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGFjY3VtdWxhdG9yW2tleV07XG5cbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICBhY2N1bXVsYXRvcltrZXldID0gdmFsdWUgKyBtb2RpZmllciAqIHZhbHVlQWRqdXN0bWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWNjdW11bGF0b3I7XG4gICAgfSwgeyAuLi5vYmplY3RcbiAgICB9KTtcbiAgfTtcbn1cblxuY29uc3QgYWRkID0gLyojX19QVVJFX18qL2NyZWF0ZUFkanVzdG1lbnRGbigxKTtcbmNvbnN0IHN1YnRyYWN0ID0gLyojX19QVVJFX18qL2NyZWF0ZUFkanVzdG1lbnRGbigtMSk7XG5cbmZ1bmN0aW9uIGhhc1ZpZXdwb3J0UmVsYXRpdmVDb29yZGluYXRlcyhldmVudCkge1xuICByZXR1cm4gJ2NsaWVudFgnIGluIGV2ZW50ICYmICdjbGllbnRZJyBpbiBldmVudDtcbn1cblxuZnVuY3Rpb24gaXNLZXlib2FyZEV2ZW50KGV2ZW50KSB7XG4gIGlmICghZXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCB7XG4gICAgS2V5Ym9hcmRFdmVudFxuICB9ID0gZ2V0V2luZG93KGV2ZW50LnRhcmdldCk7XG4gIHJldHVybiBLZXlib2FyZEV2ZW50ICYmIGV2ZW50IGluc3RhbmNlb2YgS2V5Ym9hcmRFdmVudDtcbn1cblxuZnVuY3Rpb24gaXNUb3VjaEV2ZW50KGV2ZW50KSB7XG4gIGlmICghZXZlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCB7XG4gICAgVG91Y2hFdmVudFxuICB9ID0gZ2V0V2luZG93KGV2ZW50LnRhcmdldCk7XG4gIHJldHVybiBUb3VjaEV2ZW50ICYmIGV2ZW50IGluc3RhbmNlb2YgVG91Y2hFdmVudDtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIG5vcm1hbGl6ZWQgeCBhbmQgeSBjb29yZGluYXRlcyBmb3IgbW91c2UgYW5kIHRvdWNoIGV2ZW50cy5cclxuICovXG5cbmZ1bmN0aW9uIGdldEV2ZW50Q29vcmRpbmF0ZXMoZXZlbnQpIHtcbiAgaWYgKGlzVG91Y2hFdmVudChldmVudCkpIHtcbiAgICBpZiAoZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzLmxlbmd0aCkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBjbGllbnRYOiB4LFxuICAgICAgICBjbGllbnRZOiB5XG4gICAgICB9ID0gZXZlbnQudG91Y2hlc1swXTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHgsXG4gICAgICAgIHlcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChldmVudC5jaGFuZ2VkVG91Y2hlcyAmJiBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY2xpZW50WDogeCxcbiAgICAgICAgY2xpZW50WTogeVxuICAgICAgfSA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeCxcbiAgICAgICAgeVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBpZiAoaGFzVmlld3BvcnRSZWxhdGl2ZUNvb3JkaW5hdGVzKGV2ZW50KSkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBldmVudC5jbGllbnRYLFxuICAgICAgeTogZXZlbnQuY2xpZW50WVxuICAgIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuY29uc3QgQ1NTID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBUcmFuc2xhdGU6IHtcbiAgICB0b1N0cmluZyh0cmFuc2Zvcm0pIHtcbiAgICAgIGlmICghdHJhbnNmb3JtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICB4LFxuICAgICAgICB5XG4gICAgICB9ID0gdHJhbnNmb3JtO1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlM2QoXCIgKyAoeCA/IE1hdGgucm91bmQoeCkgOiAwKSArIFwicHgsIFwiICsgKHkgPyBNYXRoLnJvdW5kKHkpIDogMCkgKyBcInB4LCAwKVwiO1xuICAgIH1cblxuICB9LFxuICBTY2FsZToge1xuICAgIHRvU3RyaW5nKHRyYW5zZm9ybSkge1xuICAgICAgaWYgKCF0cmFuc2Zvcm0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIHNjYWxlWCxcbiAgICAgICAgc2NhbGVZXG4gICAgICB9ID0gdHJhbnNmb3JtO1xuICAgICAgcmV0dXJuIFwic2NhbGVYKFwiICsgc2NhbGVYICsgXCIpIHNjYWxlWShcIiArIHNjYWxlWSArIFwiKVwiO1xuICAgIH1cblxuICB9LFxuICBUcmFuc2Zvcm06IHtcbiAgICB0b1N0cmluZyh0cmFuc2Zvcm0pIHtcbiAgICAgIGlmICghdHJhbnNmb3JtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtDU1MuVHJhbnNsYXRlLnRvU3RyaW5nKHRyYW5zZm9ybSksIENTUy5TY2FsZS50b1N0cmluZyh0cmFuc2Zvcm0pXS5qb2luKCcgJyk7XG4gICAgfVxuXG4gIH0sXG4gIFRyYW5zaXRpb246IHtcbiAgICB0b1N0cmluZyhfcmVmKSB7XG4gICAgICBsZXQge1xuICAgICAgICBwcm9wZXJ0eSxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIGVhc2luZ1xuICAgICAgfSA9IF9yZWY7XG4gICAgICByZXR1cm4gcHJvcGVydHkgKyBcIiBcIiArIGR1cmF0aW9uICsgXCJtcyBcIiArIGVhc2luZztcbiAgICB9XG5cbiAgfVxufSk7XG5cbmNvbnN0IFNFTEVDVE9SID0gJ2EsZnJhbWUsaWZyYW1lLGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKTpub3QoOmRpc2FibGVkKSxzZWxlY3Q6bm90KDpkaXNhYmxlZCksdGV4dGFyZWE6bm90KDpkaXNhYmxlZCksYnV0dG9uOm5vdCg6ZGlzYWJsZWQpLCpbdGFiaW5kZXhdJztcbmZ1bmN0aW9uIGZpbmRGaXJzdEZvY3VzYWJsZU5vZGUoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudC5tYXRjaGVzKFNFTEVDVE9SKSkge1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGVsZW1lbnQucXVlcnlTZWxlY3RvcihTRUxFQ1RPUik7XG59XG5cbmV4cG9ydCB7IENTUywgYWRkLCBjYW5Vc2VET00sIGZpbmRGaXJzdEZvY3VzYWJsZU5vZGUsIGdldEV2ZW50Q29vcmRpbmF0ZXMsIGdldE93bmVyRG9jdW1lbnQsIGdldFdpbmRvdywgaGFzVmlld3BvcnRSZWxhdGl2ZUNvb3JkaW5hdGVzLCBpc0RvY3VtZW50LCBpc0hUTUxFbGVtZW50LCBpc0tleWJvYXJkRXZlbnQsIGlzTm9kZSwgaXNTVkdFbGVtZW50LCBpc1RvdWNoRXZlbnQsIGlzV2luZG93LCBzdWJ0cmFjdCwgdXNlQ29tYmluZWRSZWZzLCB1c2VFdmVudCwgdXNlSW50ZXJ2YWwsIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QsIHVzZUxhdGVzdFZhbHVlLCB1c2VMYXp5TWVtbywgdXNlTm9kZVJlZiwgdXNlUHJldmlvdXMsIHVzZVVuaXF1ZUlkIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11dGlsaXRpZXMuZXNtLmpzLm1hcFxuIiwiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0JztcblxuY29uc3QgaGlkZGVuU3R5bGVzID0ge1xuICBkaXNwbGF5OiAnbm9uZSdcbn07XG5mdW5jdGlvbiBIaWRkZW5UZXh0KF9yZWYpIHtcbiAgbGV0IHtcbiAgICBpZCxcbiAgICB2YWx1ZVxuICB9ID0gX3JlZjtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1xuICAgIGlkOiBpZCxcbiAgICBzdHlsZTogaGlkZGVuU3R5bGVzXG4gIH0sIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gTGl2ZVJlZ2lvbihfcmVmKSB7XG4gIGxldCB7XG4gICAgaWQsXG4gICAgYW5ub3VuY2VtZW50LFxuICAgIGFyaWFMaXZlVHlwZSA9IFwiYXNzZXJ0aXZlXCJcbiAgfSA9IF9yZWY7XG4gIC8vIEhpZGUgZWxlbWVudCB2aXN1YWxseSBidXQga2VlcCBpdCByZWFkYWJsZSBieSBzY3JlZW4gcmVhZGVyc1xuICBjb25zdCB2aXN1YWxseUhpZGRlbiA9IHtcbiAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICB3aWR0aDogMSxcbiAgICBoZWlnaHQ6IDEsXG4gICAgbWFyZ2luOiAtMSxcbiAgICBib3JkZXI6IDAsXG4gICAgcGFkZGluZzogMCxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgY2xpcDogJ3JlY3QoMCAwIDAgMCknLFxuICAgIGNsaXBQYXRoOiAnaW5zZXQoMTAwJSknLFxuICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnXG4gIH07XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtcbiAgICBpZDogaWQsXG4gICAgc3R5bGU6IHZpc3VhbGx5SGlkZGVuLFxuICAgIHJvbGU6IFwic3RhdHVzXCIsXG4gICAgXCJhcmlhLWxpdmVcIjogYXJpYUxpdmVUeXBlLFxuICAgIFwiYXJpYS1hdG9taWNcIjogdHJ1ZVxuICB9LCBhbm5vdW5jZW1lbnQpO1xufVxuXG5mdW5jdGlvbiB1c2VBbm5vdW5jZW1lbnQoKSB7XG4gIGNvbnN0IFthbm5vdW5jZW1lbnQsIHNldEFubm91bmNlbWVudF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IGFubm91bmNlID0gdXNlQ2FsbGJhY2sodmFsdWUgPT4ge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICBzZXRBbm5vdW5jZW1lbnQodmFsdWUpO1xuICAgIH1cbiAgfSwgW10pO1xuICByZXR1cm4ge1xuICAgIGFubm91bmNlLFxuICAgIGFubm91bmNlbWVudFxuICB9O1xufVxuXG5leHBvcnQgeyBIaWRkZW5UZXh0LCBMaXZlUmVnaW9uLCB1c2VBbm5vdW5jZW1lbnQgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFjY2Vzc2liaWxpdHkuZXNtLmpzLm1hcFxuIiwiaW1wb3J0IFJlYWN0LCB7IGNyZWF0ZUNvbnRleHQsIHVzZUNvbnRleHQsIHVzZUVmZmVjdCwgdXNlU3RhdGUsIHVzZUNhbGxiYWNrLCB1c2VNZW1vLCB1c2VSZWYsIG1lbW8sIHVzZVJlZHVjZXIsIGNsb25lRWxlbWVudCwgZm9yd2FyZFJlZiB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGNyZWF0ZVBvcnRhbCwgdW5zdGFibGVfYmF0Y2hlZFVwZGF0ZXMgfSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IHsgdXNlVW5pcXVlSWQsIGdldEV2ZW50Q29vcmRpbmF0ZXMsIGdldFdpbmRvdywgaXNEb2N1bWVudCwgaXNIVE1MRWxlbWVudCwgaXNTVkdFbGVtZW50LCBjYW5Vc2VET00sIGlzV2luZG93LCBpc05vZGUsIGdldE93bmVyRG9jdW1lbnQsIGFkZCwgaXNLZXlib2FyZEV2ZW50LCBzdWJ0cmFjdCwgdXNlTGF6eU1lbW8sIHVzZUludGVydmFsLCB1c2VQcmV2aW91cywgdXNlTGF0ZXN0VmFsdWUsIHVzZUV2ZW50LCB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0LCB1c2VOb2RlUmVmLCBmaW5kRmlyc3RGb2N1c2FibGVOb2RlLCBDU1MgfSBmcm9tICdAZG5kLWtpdC91dGlsaXRpZXMnO1xuaW1wb3J0IHsgdXNlQW5ub3VuY2VtZW50LCBIaWRkZW5UZXh0LCBMaXZlUmVnaW9uIH0gZnJvbSAnQGRuZC1raXQvYWNjZXNzaWJpbGl0eSc7XG5cbmNvbnN0IERuZE1vbml0b3JDb250ZXh0ID0gLyojX19QVVJFX18qL2NyZWF0ZUNvbnRleHQobnVsbCk7XG5cbmZ1bmN0aW9uIHVzZURuZE1vbml0b3IobGlzdGVuZXIpIHtcbiAgY29uc3QgcmVnaXN0ZXJMaXN0ZW5lciA9IHVzZUNvbnRleHQoRG5kTW9uaXRvckNvbnRleHQpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcmVnaXN0ZXJMaXN0ZW5lcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1c2VEbmRNb25pdG9yIG11c3QgYmUgdXNlZCB3aXRoaW4gYSBjaGlsZHJlbiBvZiA8RG5kQ29udGV4dD4nKTtcbiAgICB9XG5cbiAgICBjb25zdCB1bnN1YnNjcmliZSA9IHJlZ2lzdGVyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiB1bnN1YnNjcmliZTtcbiAgfSwgW2xpc3RlbmVyLCByZWdpc3Rlckxpc3RlbmVyXSk7XG59XG5cbmZ1bmN0aW9uIHVzZURuZE1vbml0b3JQcm92aWRlcigpIHtcbiAgY29uc3QgW2xpc3RlbmVyc10gPSB1c2VTdGF0ZSgoKSA9PiBuZXcgU2V0KCkpO1xuICBjb25zdCByZWdpc3Rlckxpc3RlbmVyID0gdXNlQ2FsbGJhY2sobGlzdGVuZXIgPT4ge1xuICAgIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgIHJldHVybiAoKSA9PiBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfSwgW2xpc3RlbmVyc10pO1xuICBjb25zdCBkaXNwYXRjaCA9IHVzZUNhbGxiYWNrKF9yZWYgPT4ge1xuICAgIGxldCB7XG4gICAgICB0eXBlLFxuICAgICAgZXZlbnRcbiAgICB9ID0gX3JlZjtcbiAgICBsaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiB7XG4gICAgICB2YXIgX2xpc3RlbmVyJHR5cGU7XG5cbiAgICAgIHJldHVybiAoX2xpc3RlbmVyJHR5cGUgPSBsaXN0ZW5lclt0eXBlXSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9saXN0ZW5lciR0eXBlLmNhbGwobGlzdGVuZXIsIGV2ZW50KTtcbiAgICB9KTtcbiAgfSwgW2xpc3RlbmVyc10pO1xuICByZXR1cm4gW2Rpc3BhdGNoLCByZWdpc3Rlckxpc3RlbmVyXTtcbn1cblxuY29uc3QgZGVmYXVsdFNjcmVlblJlYWRlckluc3RydWN0aW9ucyA9IHtcbiAgZHJhZ2dhYmxlOiBcIlxcbiAgICBUbyBwaWNrIHVwIGEgZHJhZ2dhYmxlIGl0ZW0sIHByZXNzIHRoZSBzcGFjZSBiYXIuXFxuICAgIFdoaWxlIGRyYWdnaW5nLCB1c2UgdGhlIGFycm93IGtleXMgdG8gbW92ZSB0aGUgaXRlbS5cXG4gICAgUHJlc3Mgc3BhY2UgYWdhaW4gdG8gZHJvcCB0aGUgaXRlbSBpbiBpdHMgbmV3IHBvc2l0aW9uLCBvciBwcmVzcyBlc2NhcGUgdG8gY2FuY2VsLlxcbiAgXCJcbn07XG5jb25zdCBkZWZhdWx0QW5ub3VuY2VtZW50cyA9IHtcbiAgb25EcmFnU3RhcnQoX3JlZikge1xuICAgIGxldCB7XG4gICAgICBhY3RpdmVcbiAgICB9ID0gX3JlZjtcbiAgICByZXR1cm4gXCJQaWNrZWQgdXAgZHJhZ2dhYmxlIGl0ZW0gXCIgKyBhY3RpdmUuaWQgKyBcIi5cIjtcbiAgfSxcblxuICBvbkRyYWdPdmVyKF9yZWYyKSB7XG4gICAgbGV0IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIG92ZXJcbiAgICB9ID0gX3JlZjI7XG5cbiAgICBpZiAob3Zlcikge1xuICAgICAgcmV0dXJuIFwiRHJhZ2dhYmxlIGl0ZW0gXCIgKyBhY3RpdmUuaWQgKyBcIiB3YXMgbW92ZWQgb3ZlciBkcm9wcGFibGUgYXJlYSBcIiArIG92ZXIuaWQgKyBcIi5cIjtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJEcmFnZ2FibGUgaXRlbSBcIiArIGFjdGl2ZS5pZCArIFwiIGlzIG5vIGxvbmdlciBvdmVyIGEgZHJvcHBhYmxlIGFyZWEuXCI7XG4gIH0sXG5cbiAgb25EcmFnRW5kKF9yZWYzKSB7XG4gICAgbGV0IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIG92ZXJcbiAgICB9ID0gX3JlZjM7XG5cbiAgICBpZiAob3Zlcikge1xuICAgICAgcmV0dXJuIFwiRHJhZ2dhYmxlIGl0ZW0gXCIgKyBhY3RpdmUuaWQgKyBcIiB3YXMgZHJvcHBlZCBvdmVyIGRyb3BwYWJsZSBhcmVhIFwiICsgb3Zlci5pZDtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJEcmFnZ2FibGUgaXRlbSBcIiArIGFjdGl2ZS5pZCArIFwiIHdhcyBkcm9wcGVkLlwiO1xuICB9LFxuXG4gIG9uRHJhZ0NhbmNlbChfcmVmNCkge1xuICAgIGxldCB7XG4gICAgICBhY3RpdmVcbiAgICB9ID0gX3JlZjQ7XG4gICAgcmV0dXJuIFwiRHJhZ2dpbmcgd2FzIGNhbmNlbGxlZC4gRHJhZ2dhYmxlIGl0ZW0gXCIgKyBhY3RpdmUuaWQgKyBcIiB3YXMgZHJvcHBlZC5cIjtcbiAgfVxuXG59O1xuXG5mdW5jdGlvbiBBY2Nlc3NpYmlsaXR5KF9yZWYpIHtcbiAgbGV0IHtcbiAgICBhbm5vdW5jZW1lbnRzID0gZGVmYXVsdEFubm91bmNlbWVudHMsXG4gICAgY29udGFpbmVyLFxuICAgIGhpZGRlblRleHREZXNjcmliZWRCeUlkLFxuICAgIHNjcmVlblJlYWRlckluc3RydWN0aW9ucyA9IGRlZmF1bHRTY3JlZW5SZWFkZXJJbnN0cnVjdGlvbnNcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHtcbiAgICBhbm5vdW5jZSxcbiAgICBhbm5vdW5jZW1lbnRcbiAgfSA9IHVzZUFubm91bmNlbWVudCgpO1xuICBjb25zdCBsaXZlUmVnaW9uSWQgPSB1c2VVbmlxdWVJZChcIkRuZExpdmVSZWdpb25cIik7XG4gIGNvbnN0IFttb3VudGVkLCBzZXRNb3VudGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBzZXRNb3VudGVkKHRydWUpO1xuICB9LCBbXSk7XG4gIHVzZURuZE1vbml0b3IodXNlTWVtbygoKSA9PiAoe1xuICAgIG9uRHJhZ1N0YXJ0KF9yZWYyKSB7XG4gICAgICBsZXQge1xuICAgICAgICBhY3RpdmVcbiAgICAgIH0gPSBfcmVmMjtcbiAgICAgIGFubm91bmNlKGFubm91bmNlbWVudHMub25EcmFnU3RhcnQoe1xuICAgICAgICBhY3RpdmVcbiAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgb25EcmFnTW92ZShfcmVmMykge1xuICAgICAgbGV0IHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9ID0gX3JlZjM7XG5cbiAgICAgIGlmIChhbm5vdW5jZW1lbnRzLm9uRHJhZ01vdmUpIHtcbiAgICAgICAgYW5ub3VuY2UoYW5ub3VuY2VtZW50cy5vbkRyYWdNb3ZlKHtcbiAgICAgICAgICBhY3RpdmUsXG4gICAgICAgICAgb3ZlclxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIG9uRHJhZ092ZXIoX3JlZjQpIHtcbiAgICAgIGxldCB7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSA9IF9yZWY0O1xuICAgICAgYW5ub3VuY2UoYW5ub3VuY2VtZW50cy5vbkRyYWdPdmVyKHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9KSk7XG4gICAgfSxcblxuICAgIG9uRHJhZ0VuZChfcmVmNSkge1xuICAgICAgbGV0IHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9ID0gX3JlZjU7XG4gICAgICBhbm5vdW5jZShhbm5vdW5jZW1lbnRzLm9uRHJhZ0VuZCh7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICBvbkRyYWdDYW5jZWwoX3JlZjYpIHtcbiAgICAgIGxldCB7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSA9IF9yZWY2O1xuICAgICAgYW5ub3VuY2UoYW5ub3VuY2VtZW50cy5vbkRyYWdDYW5jZWwoe1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0pKTtcbiAgICB9XG5cbiAgfSksIFthbm5vdW5jZSwgYW5ub3VuY2VtZW50c10pKTtcblxuICBpZiAoIW1vdW50ZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG1hcmt1cCA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIG51bGwsIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSGlkZGVuVGV4dCwge1xuICAgIGlkOiBoaWRkZW5UZXh0RGVzY3JpYmVkQnlJZCxcbiAgICB2YWx1ZTogc2NyZWVuUmVhZGVySW5zdHJ1Y3Rpb25zLmRyYWdnYWJsZVxuICB9KSwgUmVhY3QuY3JlYXRlRWxlbWVudChMaXZlUmVnaW9uLCB7XG4gICAgaWQ6IGxpdmVSZWdpb25JZCxcbiAgICBhbm5vdW5jZW1lbnQ6IGFubm91bmNlbWVudFxuICB9KSk7XG4gIHJldHVybiBjb250YWluZXIgPyBjcmVhdGVQb3J0YWwobWFya3VwLCBjb250YWluZXIpIDogbWFya3VwO1xufVxuXG52YXIgQWN0aW9uO1xuXG4oZnVuY3Rpb24gKEFjdGlvbikge1xuICBBY3Rpb25bXCJEcmFnU3RhcnRcIl0gPSBcImRyYWdTdGFydFwiO1xuICBBY3Rpb25bXCJEcmFnTW92ZVwiXSA9IFwiZHJhZ01vdmVcIjtcbiAgQWN0aW9uW1wiRHJhZ0VuZFwiXSA9IFwiZHJhZ0VuZFwiO1xuICBBY3Rpb25bXCJEcmFnQ2FuY2VsXCJdID0gXCJkcmFnQ2FuY2VsXCI7XG4gIEFjdGlvbltcIkRyYWdPdmVyXCJdID0gXCJkcmFnT3ZlclwiO1xuICBBY3Rpb25bXCJSZWdpc3RlckRyb3BwYWJsZVwiXSA9IFwicmVnaXN0ZXJEcm9wcGFibGVcIjtcbiAgQWN0aW9uW1wiU2V0RHJvcHBhYmxlRGlzYWJsZWRcIl0gPSBcInNldERyb3BwYWJsZURpc2FibGVkXCI7XG4gIEFjdGlvbltcIlVucmVnaXN0ZXJEcm9wcGFibGVcIl0gPSBcInVucmVnaXN0ZXJEcm9wcGFibGVcIjtcbn0pKEFjdGlvbiB8fCAoQWN0aW9uID0ge30pKTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIHVzZVNlbnNvcihzZW5zb3IsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gKHtcbiAgICBzZW5zb3IsXG4gICAgb3B0aW9uczogb3B0aW9ucyAhPSBudWxsID8gb3B0aW9ucyA6IHt9XG4gIH0pLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtzZW5zb3IsIG9wdGlvbnNdKTtcbn1cblxuZnVuY3Rpb24gdXNlU2Vuc29ycygpIHtcbiAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIHNlbnNvcnMgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgc2Vuc29yc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuXG4gIHJldHVybiB1c2VNZW1vKCgpID0+IFsuLi5zZW5zb3JzXS5maWx0ZXIoc2Vuc29yID0+IHNlbnNvciAhPSBudWxsKSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbLi4uc2Vuc29yc10pO1xufVxuXG5jb25zdCBkZWZhdWx0Q29vcmRpbmF0ZXMgPSAvKiNfX1BVUkVfXyovT2JqZWN0LmZyZWV6ZSh7XG4gIHg6IDAsXG4gIHk6IDBcbn0pO1xuXG4vKipcclxuICogUmV0dXJucyB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXHJcbiAqL1xuZnVuY3Rpb24gZGlzdGFuY2VCZXR3ZWVuKHAxLCBwMikge1xuICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHAxLnggLSBwMi54LCAyKSArIE1hdGgucG93KHAxLnkgLSBwMi55LCAyKSk7XG59XG5cbmZ1bmN0aW9uIGdldFJlbGF0aXZlVHJhbnNmb3JtT3JpZ2luKGV2ZW50LCByZWN0KSB7XG4gIGNvbnN0IGV2ZW50Q29vcmRpbmF0ZXMgPSBnZXRFdmVudENvb3JkaW5hdGVzKGV2ZW50KTtcblxuICBpZiAoIWV2ZW50Q29vcmRpbmF0ZXMpIHtcbiAgICByZXR1cm4gJzAgMCc7XG4gIH1cblxuICBjb25zdCB0cmFuc2Zvcm1PcmlnaW4gPSB7XG4gICAgeDogKGV2ZW50Q29vcmRpbmF0ZXMueCAtIHJlY3QubGVmdCkgLyByZWN0LndpZHRoICogMTAwLFxuICAgIHk6IChldmVudENvb3JkaW5hdGVzLnkgLSByZWN0LnRvcCkgLyByZWN0LmhlaWdodCAqIDEwMFxuICB9O1xuICByZXR1cm4gdHJhbnNmb3JtT3JpZ2luLnggKyBcIiUgXCIgKyB0cmFuc2Zvcm1PcmlnaW4ueSArIFwiJVwiO1xufVxuXG4vKipcclxuICogU29ydCBjb2xsaXNpb25zIGZyb20gc21hbGxlc3QgdG8gZ3JlYXRlc3QgdmFsdWVcclxuICovXG5mdW5jdGlvbiBzb3J0Q29sbGlzaW9uc0FzYyhfcmVmLCBfcmVmMikge1xuICBsZXQge1xuICAgIGRhdGE6IHtcbiAgICAgIHZhbHVlOiBhXG4gICAgfVxuICB9ID0gX3JlZjtcbiAgbGV0IHtcbiAgICBkYXRhOiB7XG4gICAgICB2YWx1ZTogYlxuICAgIH1cbiAgfSA9IF9yZWYyO1xuICByZXR1cm4gYSAtIGI7XG59XG4vKipcclxuICogU29ydCBjb2xsaXNpb25zIGZyb20gZ3JlYXRlc3QgdG8gc21hbGxlc3QgdmFsdWVcclxuICovXG5cbmZ1bmN0aW9uIHNvcnRDb2xsaXNpb25zRGVzYyhfcmVmMywgX3JlZjQpIHtcbiAgbGV0IHtcbiAgICBkYXRhOiB7XG4gICAgICB2YWx1ZTogYVxuICAgIH1cbiAgfSA9IF9yZWYzO1xuICBsZXQge1xuICAgIGRhdGE6IHtcbiAgICAgIHZhbHVlOiBiXG4gICAgfVxuICB9ID0gX3JlZjQ7XG4gIHJldHVybiBiIC0gYTtcbn1cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBjb29yZGluYXRlcyBvZiB0aGUgY29ybmVycyBvZiBhIGdpdmVuIHJlY3RhbmdsZTpcclxuICogW1RvcExlZnQge3gsIHl9LCBUb3BSaWdodCB7eCwgeX0sIEJvdHRvbUxlZnQge3gsIHl9LCBCb3R0b21SaWdodCB7eCwgeX1dXHJcbiAqL1xuXG5mdW5jdGlvbiBjb3JuZXJzT2ZSZWN0YW5nbGUoX3JlZjUpIHtcbiAgbGV0IHtcbiAgICBsZWZ0LFxuICAgIHRvcCxcbiAgICBoZWlnaHQsXG4gICAgd2lkdGhcbiAgfSA9IF9yZWY1O1xuICByZXR1cm4gW3tcbiAgICB4OiBsZWZ0LFxuICAgIHk6IHRvcFxuICB9LCB7XG4gICAgeDogbGVmdCArIHdpZHRoLFxuICAgIHk6IHRvcFxuICB9LCB7XG4gICAgeDogbGVmdCxcbiAgICB5OiB0b3AgKyBoZWlnaHRcbiAgfSwge1xuICAgIHg6IGxlZnQgKyB3aWR0aCxcbiAgICB5OiB0b3AgKyBoZWlnaHRcbiAgfV07XG59XG5mdW5jdGlvbiBnZXRGaXJzdENvbGxpc2lvbihjb2xsaXNpb25zLCBwcm9wZXJ0eSkge1xuICBpZiAoIWNvbGxpc2lvbnMgfHwgY29sbGlzaW9ucy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IFtmaXJzdENvbGxpc2lvbl0gPSBjb2xsaXNpb25zO1xuICByZXR1cm4gcHJvcGVydHkgPyBmaXJzdENvbGxpc2lvbltwcm9wZXJ0eV0gOiBmaXJzdENvbGxpc2lvbjtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBjZW50ZXIgb2YgYSBnaXZlbiBDbGllbnRSZWN0XHJcbiAqL1xuXG5mdW5jdGlvbiBjZW50ZXJPZlJlY3RhbmdsZShyZWN0LCBsZWZ0LCB0b3ApIHtcbiAgaWYgKGxlZnQgPT09IHZvaWQgMCkge1xuICAgIGxlZnQgPSByZWN0LmxlZnQ7XG4gIH1cblxuICBpZiAodG9wID09PSB2b2lkIDApIHtcbiAgICB0b3AgPSByZWN0LnRvcDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgeDogbGVmdCArIHJlY3Qud2lkdGggKiAwLjUsXG4gICAgeTogdG9wICsgcmVjdC5oZWlnaHQgKiAwLjVcbiAgfTtcbn1cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBjbG9zZXN0IHJlY3RhbmdsZXMgZnJvbSBhbiBhcnJheSBvZiByZWN0YW5nbGVzIHRvIHRoZSBjZW50ZXIgb2YgYSBnaXZlblxyXG4gKiByZWN0YW5nbGUuXHJcbiAqL1xuXG5cbmNvbnN0IGNsb3Nlc3RDZW50ZXIgPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBjb2xsaXNpb25SZWN0LFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnNcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGNlbnRlclJlY3QgPSBjZW50ZXJPZlJlY3RhbmdsZShjb2xsaXNpb25SZWN0LCBjb2xsaXNpb25SZWN0LmxlZnQsIGNvbGxpc2lvblJlY3QudG9wKTtcbiAgY29uc3QgY29sbGlzaW9ucyA9IFtdO1xuXG4gIGZvciAoY29uc3QgZHJvcHBhYmxlQ29udGFpbmVyIG9mIGRyb3BwYWJsZUNvbnRhaW5lcnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBpZFxuICAgIH0gPSBkcm9wcGFibGVDb250YWluZXI7XG4gICAgY29uc3QgcmVjdCA9IGRyb3BwYWJsZVJlY3RzLmdldChpZCk7XG5cbiAgICBpZiAocmVjdCkge1xuICAgICAgY29uc3QgZGlzdEJldHdlZW4gPSBkaXN0YW5jZUJldHdlZW4oY2VudGVyT2ZSZWN0YW5nbGUocmVjdCksIGNlbnRlclJlY3QpO1xuICAgICAgY29sbGlzaW9ucy5wdXNoKHtcbiAgICAgICAgaWQsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBkcm9wcGFibGVDb250YWluZXIsXG4gICAgICAgICAgdmFsdWU6IGRpc3RCZXR3ZWVuXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb2xsaXNpb25zLnNvcnQoc29ydENvbGxpc2lvbnNBc2MpO1xufTtcblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGNsb3Nlc3QgcmVjdGFuZ2xlcyBmcm9tIGFuIGFycmF5IG9mIHJlY3RhbmdsZXMgdG8gdGhlIGNvcm5lcnMgb2ZcclxuICogYW5vdGhlciByZWN0YW5nbGUuXHJcbiAqL1xuXG5jb25zdCBjbG9zZXN0Q29ybmVycyA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGNvbGxpc2lvblJlY3QsXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVyc1xuICB9ID0gX3JlZjtcbiAgY29uc3QgY29ybmVycyA9IGNvcm5lcnNPZlJlY3RhbmdsZShjb2xsaXNpb25SZWN0KTtcbiAgY29uc3QgY29sbGlzaW9ucyA9IFtdO1xuXG4gIGZvciAoY29uc3QgZHJvcHBhYmxlQ29udGFpbmVyIG9mIGRyb3BwYWJsZUNvbnRhaW5lcnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBpZFxuICAgIH0gPSBkcm9wcGFibGVDb250YWluZXI7XG4gICAgY29uc3QgcmVjdCA9IGRyb3BwYWJsZVJlY3RzLmdldChpZCk7XG5cbiAgICBpZiAocmVjdCkge1xuICAgICAgY29uc3QgcmVjdENvcm5lcnMgPSBjb3JuZXJzT2ZSZWN0YW5nbGUocmVjdCk7XG4gICAgICBjb25zdCBkaXN0YW5jZXMgPSBjb3JuZXJzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGNvcm5lciwgaW5kZXgpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yICsgZGlzdGFuY2VCZXR3ZWVuKHJlY3RDb3JuZXJzW2luZGV4XSwgY29ybmVyKTtcbiAgICAgIH0sIDApO1xuICAgICAgY29uc3QgZWZmZWN0aXZlRGlzdGFuY2UgPSBOdW1iZXIoKGRpc3RhbmNlcyAvIDQpLnRvRml4ZWQoNCkpO1xuICAgICAgY29sbGlzaW9ucy5wdXNoKHtcbiAgICAgICAgaWQsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBkcm9wcGFibGVDb250YWluZXIsXG4gICAgICAgICAgdmFsdWU6IGVmZmVjdGl2ZURpc3RhbmNlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb2xsaXNpb25zLnNvcnQoc29ydENvbGxpc2lvbnNBc2MpO1xufTtcblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGludGVyc2VjdGluZyByZWN0YW5nbGUgYXJlYSBiZXR3ZWVuIHR3byByZWN0YW5nbGVzXHJcbiAqL1xuXG5mdW5jdGlvbiBnZXRJbnRlcnNlY3Rpb25SYXRpbyhlbnRyeSwgdGFyZ2V0KSB7XG4gIGNvbnN0IHRvcCA9IE1hdGgubWF4KHRhcmdldC50b3AsIGVudHJ5LnRvcCk7XG4gIGNvbnN0IGxlZnQgPSBNYXRoLm1heCh0YXJnZXQubGVmdCwgZW50cnkubGVmdCk7XG4gIGNvbnN0IHJpZ2h0ID0gTWF0aC5taW4odGFyZ2V0LmxlZnQgKyB0YXJnZXQud2lkdGgsIGVudHJ5LmxlZnQgKyBlbnRyeS53aWR0aCk7XG4gIGNvbnN0IGJvdHRvbSA9IE1hdGgubWluKHRhcmdldC50b3AgKyB0YXJnZXQuaGVpZ2h0LCBlbnRyeS50b3AgKyBlbnRyeS5oZWlnaHQpO1xuICBjb25zdCB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcbiAgY29uc3QgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuXG4gIGlmIChsZWZ0IDwgcmlnaHQgJiYgdG9wIDwgYm90dG9tKSB7XG4gICAgY29uc3QgdGFyZ2V0QXJlYSA9IHRhcmdldC53aWR0aCAqIHRhcmdldC5oZWlnaHQ7XG4gICAgY29uc3QgZW50cnlBcmVhID0gZW50cnkud2lkdGggKiBlbnRyeS5oZWlnaHQ7XG4gICAgY29uc3QgaW50ZXJzZWN0aW9uQXJlYSA9IHdpZHRoICogaGVpZ2h0O1xuICAgIGNvbnN0IGludGVyc2VjdGlvblJhdGlvID0gaW50ZXJzZWN0aW9uQXJlYSAvICh0YXJnZXRBcmVhICsgZW50cnlBcmVhIC0gaW50ZXJzZWN0aW9uQXJlYSk7XG4gICAgcmV0dXJuIE51bWJlcihpbnRlcnNlY3Rpb25SYXRpby50b0ZpeGVkKDQpKTtcbiAgfSAvLyBSZWN0YW5nbGVzIGRvIG5vdCBvdmVybGFwLCBvciBvdmVybGFwIGhhcyBhbiBhcmVhIG9mIHplcm8gKGVkZ2UvY29ybmVyIG92ZXJsYXApXG5cblxuICByZXR1cm4gMDtcbn1cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSByZWN0YW5nbGVzIHRoYXQgaGFzIHRoZSBncmVhdGVzdCBpbnRlcnNlY3Rpb24gYXJlYSB3aXRoIGEgZ2l2ZW5cclxuICogcmVjdGFuZ2xlIGluIGFuIGFycmF5IG9mIHJlY3RhbmdsZXMuXHJcbiAqL1xuXG5jb25zdCByZWN0SW50ZXJzZWN0aW9uID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgY29sbGlzaW9uUmVjdCxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzXG4gIH0gPSBfcmVmO1xuICBjb25zdCBjb2xsaXNpb25zID0gW107XG5cbiAgZm9yIChjb25zdCBkcm9wcGFibGVDb250YWluZXIgb2YgZHJvcHBhYmxlQ29udGFpbmVycykge1xuICAgIGNvbnN0IHtcbiAgICAgIGlkXG4gICAgfSA9IGRyb3BwYWJsZUNvbnRhaW5lcjtcbiAgICBjb25zdCByZWN0ID0gZHJvcHBhYmxlUmVjdHMuZ2V0KGlkKTtcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICBjb25zdCBpbnRlcnNlY3Rpb25SYXRpbyA9IGdldEludGVyc2VjdGlvblJhdGlvKHJlY3QsIGNvbGxpc2lvblJlY3QpO1xuXG4gICAgICBpZiAoaW50ZXJzZWN0aW9uUmF0aW8gPiAwKSB7XG4gICAgICAgIGNvbGxpc2lvbnMucHVzaCh7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZHJvcHBhYmxlQ29udGFpbmVyLFxuICAgICAgICAgICAgdmFsdWU6IGludGVyc2VjdGlvblJhdGlvXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29sbGlzaW9ucy5zb3J0KHNvcnRDb2xsaXNpb25zRGVzYyk7XG59O1xuXG4vKipcclxuICogQ2hlY2sgaWYgYSBnaXZlbiBwb2ludCBpcyBjb250YWluZWQgd2l0aGluIGEgYm91bmRpbmcgcmVjdGFuZ2xlXHJcbiAqL1xuXG5mdW5jdGlvbiBpc1BvaW50V2l0aGluUmVjdChwb2ludCwgcmVjdCkge1xuICBjb25zdCB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgYm90dG9tLFxuICAgIHJpZ2h0XG4gIH0gPSByZWN0O1xuICByZXR1cm4gdG9wIDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSBib3R0b20gJiYgbGVmdCA8PSBwb2ludC54ICYmIHBvaW50LnggPD0gcmlnaHQ7XG59XG4vKipcclxuICogUmV0dXJucyB0aGUgcmVjdGFuZ2xlcyB0aGF0IHRoZSBwb2ludGVyIGlzIGhvdmVyaW5nIG92ZXJcclxuICovXG5cblxuY29uc3QgcG9pbnRlcldpdGhpbiA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgcG9pbnRlckNvb3JkaW5hdGVzXG4gIH0gPSBfcmVmO1xuXG4gIGlmICghcG9pbnRlckNvb3JkaW5hdGVzKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgY29sbGlzaW9ucyA9IFtdO1xuXG4gIGZvciAoY29uc3QgZHJvcHBhYmxlQ29udGFpbmVyIG9mIGRyb3BwYWJsZUNvbnRhaW5lcnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBpZFxuICAgIH0gPSBkcm9wcGFibGVDb250YWluZXI7XG4gICAgY29uc3QgcmVjdCA9IGRyb3BwYWJsZVJlY3RzLmdldChpZCk7XG5cbiAgICBpZiAocmVjdCAmJiBpc1BvaW50V2l0aGluUmVjdChwb2ludGVyQ29vcmRpbmF0ZXMsIHJlY3QpKSB7XG4gICAgICAvKiBUaGVyZSBtYXkgYmUgbW9yZSB0aGFuIGEgc2luZ2xlIHJlY3RhbmdsZSBpbnRlcnNlY3RpbmdcclxuICAgICAgICogd2l0aCB0aGUgcG9pbnRlciBjb29yZGluYXRlcy4gSW4gb3JkZXIgdG8gc29ydCB0aGVcclxuICAgICAgICogY29sbGlkaW5nIHJlY3RhbmdsZXMsIHdlIG1lYXN1cmUgdGhlIGRpc3RhbmNlIGJldHdlZW5cclxuICAgICAgICogdGhlIHBvaW50ZXIgYW5kIHRoZSBjb3JuZXJzIG9mIHRoZSBpbnRlcnNlY3RpbmcgcmVjdGFuZ2xlXHJcbiAgICAgICAqL1xuICAgICAgY29uc3QgY29ybmVycyA9IGNvcm5lcnNPZlJlY3RhbmdsZShyZWN0KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlcyA9IGNvcm5lcnMucmVkdWNlKChhY2N1bXVsYXRvciwgY29ybmVyKSA9PiB7XG4gICAgICAgIHJldHVybiBhY2N1bXVsYXRvciArIGRpc3RhbmNlQmV0d2Vlbihwb2ludGVyQ29vcmRpbmF0ZXMsIGNvcm5lcik7XG4gICAgICB9LCAwKTtcbiAgICAgIGNvbnN0IGVmZmVjdGl2ZURpc3RhbmNlID0gTnVtYmVyKChkaXN0YW5jZXMgLyA0KS50b0ZpeGVkKDQpKTtcbiAgICAgIGNvbGxpc2lvbnMucHVzaCh7XG4gICAgICAgIGlkLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZHJvcHBhYmxlQ29udGFpbmVyLFxuICAgICAgICAgIHZhbHVlOiBlZmZlY3RpdmVEaXN0YW5jZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29sbGlzaW9ucy5zb3J0KHNvcnRDb2xsaXNpb25zQXNjKTtcbn07XG5cbmZ1bmN0aW9uIGFkanVzdFNjYWxlKHRyYW5zZm9ybSwgcmVjdDEsIHJlY3QyKSB7XG4gIHJldHVybiB7IC4uLnRyYW5zZm9ybSxcbiAgICBzY2FsZVg6IHJlY3QxICYmIHJlY3QyID8gcmVjdDEud2lkdGggLyByZWN0Mi53aWR0aCA6IDEsXG4gICAgc2NhbGVZOiByZWN0MSAmJiByZWN0MiA/IHJlY3QxLmhlaWdodCAvIHJlY3QyLmhlaWdodCA6IDFcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVjdERlbHRhKHJlY3QxLCByZWN0Mikge1xuICByZXR1cm4gcmVjdDEgJiYgcmVjdDIgPyB7XG4gICAgeDogcmVjdDEubGVmdCAtIHJlY3QyLmxlZnQsXG4gICAgeTogcmVjdDEudG9wIC0gcmVjdDIudG9wXG4gIH0gOiBkZWZhdWx0Q29vcmRpbmF0ZXM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlY3RBZGp1c3RtZW50Rm4obW9kaWZpZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFkanVzdENsaWVudFJlY3QocmVjdCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhZGp1c3RtZW50cyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhZGp1c3RtZW50c1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFkanVzdG1lbnRzLnJlZHVjZSgoYWNjLCBhZGp1c3RtZW50KSA9PiAoeyAuLi5hY2MsXG4gICAgICB0b3A6IGFjYy50b3AgKyBtb2RpZmllciAqIGFkanVzdG1lbnQueSxcbiAgICAgIGJvdHRvbTogYWNjLmJvdHRvbSArIG1vZGlmaWVyICogYWRqdXN0bWVudC55LFxuICAgICAgbGVmdDogYWNjLmxlZnQgKyBtb2RpZmllciAqIGFkanVzdG1lbnQueCxcbiAgICAgIHJpZ2h0OiBhY2MucmlnaHQgKyBtb2RpZmllciAqIGFkanVzdG1lbnQueFxuICAgIH0pLCB7IC4uLnJlY3RcbiAgICB9KTtcbiAgfTtcbn1cbmNvbnN0IGdldEFkanVzdGVkUmVjdCA9IC8qI19fUFVSRV9fKi9jcmVhdGVSZWN0QWRqdXN0bWVudEZuKDEpO1xuXG5mdW5jdGlvbiBwYXJzZVRyYW5zZm9ybSh0cmFuc2Zvcm0pIHtcbiAgaWYgKHRyYW5zZm9ybS5zdGFydHNXaXRoKCdtYXRyaXgzZCgnKSkge1xuICAgIGNvbnN0IHRyYW5zZm9ybUFycmF5ID0gdHJhbnNmb3JtLnNsaWNlKDksIC0xKS5zcGxpdCgvLCAvKTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogK3RyYW5zZm9ybUFycmF5WzEyXSxcbiAgICAgIHk6ICt0cmFuc2Zvcm1BcnJheVsxM10sXG4gICAgICBzY2FsZVg6ICt0cmFuc2Zvcm1BcnJheVswXSxcbiAgICAgIHNjYWxlWTogK3RyYW5zZm9ybUFycmF5WzVdXG4gICAgfTtcbiAgfSBlbHNlIGlmICh0cmFuc2Zvcm0uc3RhcnRzV2l0aCgnbWF0cml4KCcpKSB7XG4gICAgY29uc3QgdHJhbnNmb3JtQXJyYXkgPSB0cmFuc2Zvcm0uc2xpY2UoNywgLTEpLnNwbGl0KC8sIC8pO1xuICAgIHJldHVybiB7XG4gICAgICB4OiArdHJhbnNmb3JtQXJyYXlbNF0sXG4gICAgICB5OiArdHJhbnNmb3JtQXJyYXlbNV0sXG4gICAgICBzY2FsZVg6ICt0cmFuc2Zvcm1BcnJheVswXSxcbiAgICAgIHNjYWxlWTogK3RyYW5zZm9ybUFycmF5WzNdXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBpbnZlcnNlVHJhbnNmb3JtKHJlY3QsIHRyYW5zZm9ybSwgdHJhbnNmb3JtT3JpZ2luKSB7XG4gIGNvbnN0IHBhcnNlZFRyYW5zZm9ybSA9IHBhcnNlVHJhbnNmb3JtKHRyYW5zZm9ybSk7XG5cbiAgaWYgKCFwYXJzZWRUcmFuc2Zvcm0pIHtcbiAgICByZXR1cm4gcmVjdDtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICBzY2FsZVgsXG4gICAgc2NhbGVZLFxuICAgIHg6IHRyYW5zbGF0ZVgsXG4gICAgeTogdHJhbnNsYXRlWVxuICB9ID0gcGFyc2VkVHJhbnNmb3JtO1xuICBjb25zdCB4ID0gcmVjdC5sZWZ0IC0gdHJhbnNsYXRlWCAtICgxIC0gc2NhbGVYKSAqIHBhcnNlRmxvYXQodHJhbnNmb3JtT3JpZ2luKTtcbiAgY29uc3QgeSA9IHJlY3QudG9wIC0gdHJhbnNsYXRlWSAtICgxIC0gc2NhbGVZKSAqIHBhcnNlRmxvYXQodHJhbnNmb3JtT3JpZ2luLnNsaWNlKHRyYW5zZm9ybU9yaWdpbi5pbmRleE9mKCcgJykgKyAxKSk7XG4gIGNvbnN0IHcgPSBzY2FsZVggPyByZWN0LndpZHRoIC8gc2NhbGVYIDogcmVjdC53aWR0aDtcbiAgY29uc3QgaCA9IHNjYWxlWSA/IHJlY3QuaGVpZ2h0IC8gc2NhbGVZIDogcmVjdC5oZWlnaHQ7XG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHcsXG4gICAgaGVpZ2h0OiBoLFxuICAgIHRvcDogeSxcbiAgICByaWdodDogeCArIHcsXG4gICAgYm90dG9tOiB5ICsgaCxcbiAgICBsZWZ0OiB4XG4gIH07XG59XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICBpZ25vcmVUcmFuc2Zvcm06IGZhbHNlXG59O1xuLyoqXHJcbiAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGNsaWVudCByZWN0IG9mIGFuIGVsZW1lbnQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LlxyXG4gKi9cblxuZnVuY3Rpb24gZ2V0Q2xpZW50UmVjdChlbGVtZW50LCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG4gIH1cblxuICBsZXQgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgaWYgKG9wdGlvbnMuaWdub3JlVHJhbnNmb3JtKSB7XG4gICAgY29uc3Qge1xuICAgICAgdHJhbnNmb3JtLFxuICAgICAgdHJhbnNmb3JtT3JpZ2luXG4gICAgfSA9IGdldFdpbmRvdyhlbGVtZW50KS5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuXG4gICAgaWYgKHRyYW5zZm9ybSkge1xuICAgICAgcmVjdCA9IGludmVyc2VUcmFuc2Zvcm0ocmVjdCwgdHJhbnNmb3JtLCB0cmFuc2Zvcm1PcmlnaW4pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgYm90dG9tLFxuICAgIHJpZ2h0XG4gIH0gPSByZWN0O1xuICByZXR1cm4ge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBib3R0b20sXG4gICAgcmlnaHRcbiAgfTtcbn1cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBib3VuZGluZyBjbGllbnQgcmVjdCBvZiBhbiBlbGVtZW50IHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydC5cclxuICpcclxuICogQHJlbWFya3NcclxuICogVGhlIENsaWVudFJlY3QgcmV0dXJuZWQgYnkgdGhpcyBtZXRob2QgZG9lcyBub3QgdGFrZSBpbnRvIGFjY291bnQgdHJhbnNmb3Jtc1xyXG4gKiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGl0IG1lYXN1cmVzLlxyXG4gKlxyXG4gKi9cblxuZnVuY3Rpb24gZ2V0VHJhbnNmb3JtQWdub3N0aWNDbGllbnRSZWN0KGVsZW1lbnQpIHtcbiAgcmV0dXJuIGdldENsaWVudFJlY3QoZWxlbWVudCwge1xuICAgIGlnbm9yZVRyYW5zZm9ybTogdHJ1ZVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0V2luZG93Q2xpZW50UmVjdChlbGVtZW50KSB7XG4gIGNvbnN0IHdpZHRoID0gZWxlbWVudC5pbm5lcldpZHRoO1xuICBjb25zdCBoZWlnaHQgPSBlbGVtZW50LmlubmVySGVpZ2h0O1xuICByZXR1cm4ge1xuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiB3aWR0aCxcbiAgICBib3R0b206IGhlaWdodCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHRcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNGaXhlZChub2RlLCBjb21wdXRlZFN0eWxlKSB7XG4gIGlmIChjb21wdXRlZFN0eWxlID09PSB2b2lkIDApIHtcbiAgICBjb21wdXRlZFN0eWxlID0gZ2V0V2luZG93KG5vZGUpLmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gIH1cblxuICByZXR1cm4gY29tcHV0ZWRTdHlsZS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJztcbn1cblxuZnVuY3Rpb24gaXNTY3JvbGxhYmxlKGVsZW1lbnQsIGNvbXB1dGVkU3R5bGUpIHtcbiAgaWYgKGNvbXB1dGVkU3R5bGUgPT09IHZvaWQgMCkge1xuICAgIGNvbXB1dGVkU3R5bGUgPSBnZXRXaW5kb3coZWxlbWVudCkuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgfVxuXG4gIGNvbnN0IG92ZXJmbG93UmVnZXggPSAvKGF1dG98c2Nyb2xsfG92ZXJsYXkpLztcbiAgY29uc3QgcHJvcGVydGllcyA9IFsnb3ZlcmZsb3cnLCAnb3ZlcmZsb3dYJywgJ292ZXJmbG93WSddO1xuICByZXR1cm4gcHJvcGVydGllcy5zb21lKHByb3BlcnR5ID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGNvbXB1dGVkU3R5bGVbcHJvcGVydHldO1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gb3ZlcmZsb3dSZWdleC50ZXN0KHZhbHVlKSA6IGZhbHNlO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycyhlbGVtZW50LCBsaW1pdCkge1xuICBjb25zdCBzY3JvbGxQYXJlbnRzID0gW107XG5cbiAgZnVuY3Rpb24gZmluZFNjcm9sbGFibGVBbmNlc3RvcnMobm9kZSkge1xuICAgIGlmIChsaW1pdCAhPSBudWxsICYmIHNjcm9sbFBhcmVudHMubGVuZ3RoID49IGxpbWl0KSB7XG4gICAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgICB9XG5cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICAgIH1cblxuICAgIGlmIChpc0RvY3VtZW50KG5vZGUpICYmIG5vZGUuc2Nyb2xsaW5nRWxlbWVudCAhPSBudWxsICYmICFzY3JvbGxQYXJlbnRzLmluY2x1ZGVzKG5vZGUuc2Nyb2xsaW5nRWxlbWVudCkpIHtcbiAgICAgIHNjcm9sbFBhcmVudHMucHVzaChub2RlLnNjcm9sbGluZ0VsZW1lbnQpO1xuICAgICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gICAgfVxuXG4gICAgaWYgKCFpc0hUTUxFbGVtZW50KG5vZGUpIHx8IGlzU1ZHRWxlbWVudChub2RlKSkge1xuICAgICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gICAgfVxuXG4gICAgaWYgKHNjcm9sbFBhcmVudHMuaW5jbHVkZXMobm9kZSkpIHtcbiAgICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSBnZXRXaW5kb3coZWxlbWVudCkuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcblxuICAgIGlmIChub2RlICE9PSBlbGVtZW50KSB7XG4gICAgICBpZiAoaXNTY3JvbGxhYmxlKG5vZGUsIGNvbXB1dGVkU3R5bGUpKSB7XG4gICAgICAgIHNjcm9sbFBhcmVudHMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNGaXhlZChub2RlLCBjb21wdXRlZFN0eWxlKSkge1xuICAgICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbmRTY3JvbGxhYmxlQW5jZXN0b3JzKG5vZGUucGFyZW50Tm9kZSk7XG4gIH1cblxuICBpZiAoIWVsZW1lbnQpIHtcbiAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgfVxuXG4gIHJldHVybiBmaW5kU2Nyb2xsYWJsZUFuY2VzdG9ycyhlbGVtZW50KTtcbn1cbmZ1bmN0aW9uIGdldEZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yKG5vZGUpIHtcbiAgY29uc3QgW2ZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yXSA9IGdldFNjcm9sbGFibGVBbmNlc3RvcnMobm9kZSwgMSk7XG4gIHJldHVybiBmaXJzdFNjcm9sbGFibGVBbmNlc3RvciAhPSBudWxsID8gZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxhYmxlRWxlbWVudChlbGVtZW50KSB7XG4gIGlmICghY2FuVXNlRE9NIHx8ICFlbGVtZW50KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoaXNXaW5kb3coZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGlmICghaXNOb2RlKGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoaXNEb2N1bWVudChlbGVtZW50KSB8fCBlbGVtZW50ID09PSBnZXRPd25lckRvY3VtZW50KGVsZW1lbnQpLnNjcm9sbGluZ0VsZW1lbnQpIHtcbiAgICByZXR1cm4gd2luZG93O1xuICB9XG5cbiAgaWYgKGlzSFRNTEVsZW1lbnQoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxYQ29vcmRpbmF0ZShlbGVtZW50KSB7XG4gIGlmIChpc1dpbmRvdyhlbGVtZW50KSkge1xuICAgIHJldHVybiBlbGVtZW50LnNjcm9sbFg7XG4gIH1cblxuICByZXR1cm4gZWxlbWVudC5zY3JvbGxMZWZ0O1xufVxuZnVuY3Rpb24gZ2V0U2Nyb2xsWUNvb3JkaW5hdGUoZWxlbWVudCkge1xuICBpZiAoaXNXaW5kb3coZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZWxlbWVudC5zY3JvbGxZO1xuICB9XG5cbiAgcmV0dXJuIGVsZW1lbnQuc2Nyb2xsVG9wO1xufVxuZnVuY3Rpb24gZ2V0U2Nyb2xsQ29vcmRpbmF0ZXMoZWxlbWVudCkge1xuICByZXR1cm4ge1xuICAgIHg6IGdldFNjcm9sbFhDb29yZGluYXRlKGVsZW1lbnQpLFxuICAgIHk6IGdldFNjcm9sbFlDb29yZGluYXRlKGVsZW1lbnQpXG4gIH07XG59XG5cbnZhciBEaXJlY3Rpb247XG5cbihmdW5jdGlvbiAoRGlyZWN0aW9uKSB7XG4gIERpcmVjdGlvbltEaXJlY3Rpb25bXCJGb3J3YXJkXCJdID0gMV0gPSBcIkZvcndhcmRcIjtcbiAgRGlyZWN0aW9uW0RpcmVjdGlvbltcIkJhY2t3YXJkXCJdID0gLTFdID0gXCJCYWNrd2FyZFwiO1xufSkoRGlyZWN0aW9uIHx8IChEaXJlY3Rpb24gPSB7fSkpO1xuXG5mdW5jdGlvbiBpc0RvY3VtZW50U2Nyb2xsaW5nRWxlbWVudChlbGVtZW50KSB7XG4gIGlmICghY2FuVXNlRE9NIHx8ICFlbGVtZW50KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGVsZW1lbnQgPT09IGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFBvc2l0aW9uKHNjcm9sbGluZ0NvbnRhaW5lcikge1xuICBjb25zdCBtaW5TY3JvbGwgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG4gIGNvbnN0IGRpbWVuc2lvbnMgPSBpc0RvY3VtZW50U2Nyb2xsaW5nRWxlbWVudChzY3JvbGxpbmdDb250YWluZXIpID8ge1xuICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0LFxuICAgIHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aFxuICB9IDoge1xuICAgIGhlaWdodDogc2Nyb2xsaW5nQ29udGFpbmVyLmNsaWVudEhlaWdodCxcbiAgICB3aWR0aDogc2Nyb2xsaW5nQ29udGFpbmVyLmNsaWVudFdpZHRoXG4gIH07XG4gIGNvbnN0IG1heFNjcm9sbCA9IHtcbiAgICB4OiBzY3JvbGxpbmdDb250YWluZXIuc2Nyb2xsV2lkdGggLSBkaW1lbnNpb25zLndpZHRoLFxuICAgIHk6IHNjcm9sbGluZ0NvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBkaW1lbnNpb25zLmhlaWdodFxuICB9O1xuICBjb25zdCBpc1RvcCA9IHNjcm9sbGluZ0NvbnRhaW5lci5zY3JvbGxUb3AgPD0gbWluU2Nyb2xsLnk7XG4gIGNvbnN0IGlzTGVmdCA9IHNjcm9sbGluZ0NvbnRhaW5lci5zY3JvbGxMZWZ0IDw9IG1pblNjcm9sbC54O1xuICBjb25zdCBpc0JvdHRvbSA9IHNjcm9sbGluZ0NvbnRhaW5lci5zY3JvbGxUb3AgPj0gbWF4U2Nyb2xsLnk7XG4gIGNvbnN0IGlzUmlnaHQgPSBzY3JvbGxpbmdDb250YWluZXIuc2Nyb2xsTGVmdCA+PSBtYXhTY3JvbGwueDtcbiAgcmV0dXJuIHtcbiAgICBpc1RvcCxcbiAgICBpc0xlZnQsXG4gICAgaXNCb3R0b20sXG4gICAgaXNSaWdodCxcbiAgICBtYXhTY3JvbGwsXG4gICAgbWluU2Nyb2xsXG4gIH07XG59XG5cbmNvbnN0IGRlZmF1bHRUaHJlc2hvbGQgPSB7XG4gIHg6IDAuMixcbiAgeTogMC4yXG59O1xuZnVuY3Rpb24gZ2V0U2Nyb2xsRGlyZWN0aW9uQW5kU3BlZWQoc2Nyb2xsQ29udGFpbmVyLCBzY3JvbGxDb250YWluZXJSZWN0LCBfcmVmLCBhY2NlbGVyYXRpb24sIHRocmVzaG9sZFBlcmNlbnRhZ2UpIHtcbiAgbGV0IHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICByaWdodCxcbiAgICBib3R0b21cbiAgfSA9IF9yZWY7XG5cbiAgaWYgKGFjY2VsZXJhdGlvbiA9PT0gdm9pZCAwKSB7XG4gICAgYWNjZWxlcmF0aW9uID0gMTA7XG4gIH1cblxuICBpZiAodGhyZXNob2xkUGVyY2VudGFnZSA9PT0gdm9pZCAwKSB7XG4gICAgdGhyZXNob2xkUGVyY2VudGFnZSA9IGRlZmF1bHRUaHJlc2hvbGQ7XG4gIH1cblxuICBjb25zdCB7XG4gICAgaXNUb3AsXG4gICAgaXNCb3R0b20sXG4gICAgaXNMZWZ0LFxuICAgIGlzUmlnaHRcbiAgfSA9IGdldFNjcm9sbFBvc2l0aW9uKHNjcm9sbENvbnRhaW5lcik7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbiAgY29uc3Qgc3BlZWQgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG4gIGNvbnN0IHRocmVzaG9sZCA9IHtcbiAgICBoZWlnaHQ6IHNjcm9sbENvbnRhaW5lclJlY3QuaGVpZ2h0ICogdGhyZXNob2xkUGVyY2VudGFnZS55LFxuICAgIHdpZHRoOiBzY3JvbGxDb250YWluZXJSZWN0LndpZHRoICogdGhyZXNob2xkUGVyY2VudGFnZS54XG4gIH07XG5cbiAgaWYgKCFpc1RvcCAmJiB0b3AgPD0gc2Nyb2xsQ29udGFpbmVyUmVjdC50b3AgKyB0aHJlc2hvbGQuaGVpZ2h0KSB7XG4gICAgLy8gU2Nyb2xsIFVwXG4gICAgZGlyZWN0aW9uLnkgPSBEaXJlY3Rpb24uQmFja3dhcmQ7XG4gICAgc3BlZWQueSA9IGFjY2VsZXJhdGlvbiAqIE1hdGguYWJzKChzY3JvbGxDb250YWluZXJSZWN0LnRvcCArIHRocmVzaG9sZC5oZWlnaHQgLSB0b3ApIC8gdGhyZXNob2xkLmhlaWdodCk7XG4gIH0gZWxzZSBpZiAoIWlzQm90dG9tICYmIGJvdHRvbSA+PSBzY3JvbGxDb250YWluZXJSZWN0LmJvdHRvbSAtIHRocmVzaG9sZC5oZWlnaHQpIHtcbiAgICAvLyBTY3JvbGwgRG93blxuICAgIGRpcmVjdGlvbi55ID0gRGlyZWN0aW9uLkZvcndhcmQ7XG4gICAgc3BlZWQueSA9IGFjY2VsZXJhdGlvbiAqIE1hdGguYWJzKChzY3JvbGxDb250YWluZXJSZWN0LmJvdHRvbSAtIHRocmVzaG9sZC5oZWlnaHQgLSBib3R0b20pIC8gdGhyZXNob2xkLmhlaWdodCk7XG4gIH1cblxuICBpZiAoIWlzUmlnaHQgJiYgcmlnaHQgPj0gc2Nyb2xsQ29udGFpbmVyUmVjdC5yaWdodCAtIHRocmVzaG9sZC53aWR0aCkge1xuICAgIC8vIFNjcm9sbCBSaWdodFxuICAgIGRpcmVjdGlvbi54ID0gRGlyZWN0aW9uLkZvcndhcmQ7XG4gICAgc3BlZWQueCA9IGFjY2VsZXJhdGlvbiAqIE1hdGguYWJzKChzY3JvbGxDb250YWluZXJSZWN0LnJpZ2h0IC0gdGhyZXNob2xkLndpZHRoIC0gcmlnaHQpIC8gdGhyZXNob2xkLndpZHRoKTtcbiAgfSBlbHNlIGlmICghaXNMZWZ0ICYmIGxlZnQgPD0gc2Nyb2xsQ29udGFpbmVyUmVjdC5sZWZ0ICsgdGhyZXNob2xkLndpZHRoKSB7XG4gICAgLy8gU2Nyb2xsIExlZnRcbiAgICBkaXJlY3Rpb24ueCA9IERpcmVjdGlvbi5CYWNrd2FyZDtcbiAgICBzcGVlZC54ID0gYWNjZWxlcmF0aW9uICogTWF0aC5hYnMoKHNjcm9sbENvbnRhaW5lclJlY3QubGVmdCArIHRocmVzaG9sZC53aWR0aCAtIGxlZnQpIC8gdGhyZXNob2xkLndpZHRoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZGlyZWN0aW9uLFxuICAgIHNwZWVkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbEVsZW1lbnRSZWN0KGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQgPT09IGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQpIHtcbiAgICBjb25zdCB7XG4gICAgICBpbm5lcldpZHRoLFxuICAgICAgaW5uZXJIZWlnaHRcbiAgICB9ID0gd2luZG93O1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgcmlnaHQ6IGlubmVyV2lkdGgsXG4gICAgICBib3R0b206IGlubmVySGVpZ2h0LFxuICAgICAgd2lkdGg6IGlubmVyV2lkdGgsXG4gICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0XG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICByaWdodCxcbiAgICBib3R0b21cbiAgfSA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHJldHVybiB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgcmlnaHQsXG4gICAgYm90dG9tLFxuICAgIHdpZHRoOiBlbGVtZW50LmNsaWVudFdpZHRoLFxuICAgIGhlaWdodDogZWxlbWVudC5jbGllbnRIZWlnaHRcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsT2Zmc2V0cyhzY3JvbGxhYmxlQW5jZXN0b3JzKSB7XG4gIHJldHVybiBzY3JvbGxhYmxlQW5jZXN0b3JzLnJlZHVjZSgoYWNjLCBub2RlKSA9PiB7XG4gICAgcmV0dXJuIGFkZChhY2MsIGdldFNjcm9sbENvb3JkaW5hdGVzKG5vZGUpKTtcbiAgfSwgZGVmYXVsdENvb3JkaW5hdGVzKTtcbn1cbmZ1bmN0aW9uIGdldFNjcm9sbFhPZmZzZXQoc2Nyb2xsYWJsZUFuY2VzdG9ycykge1xuICByZXR1cm4gc2Nyb2xsYWJsZUFuY2VzdG9ycy5yZWR1Y2UoKGFjYywgbm9kZSkgPT4ge1xuICAgIHJldHVybiBhY2MgKyBnZXRTY3JvbGxYQ29vcmRpbmF0ZShub2RlKTtcbiAgfSwgMCk7XG59XG5mdW5jdGlvbiBnZXRTY3JvbGxZT2Zmc2V0KHNjcm9sbGFibGVBbmNlc3RvcnMpIHtcbiAgcmV0dXJuIHNjcm9sbGFibGVBbmNlc3RvcnMucmVkdWNlKChhY2MsIG5vZGUpID0+IHtcbiAgICByZXR1cm4gYWNjICsgZ2V0U2Nyb2xsWUNvb3JkaW5hdGUobm9kZSk7XG4gIH0sIDApO1xufVxuXG5mdW5jdGlvbiBzY3JvbGxJbnRvVmlld0lmTmVlZGVkKGVsZW1lbnQsIG1lYXN1cmUpIHtcbiAgaWYgKG1lYXN1cmUgPT09IHZvaWQgMCkge1xuICAgIG1lYXN1cmUgPSBnZXRDbGllbnRSZWN0O1xuICB9XG5cbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIGJvdHRvbSxcbiAgICByaWdodFxuICB9ID0gbWVhc3VyZShlbGVtZW50KTtcbiAgY29uc3QgZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IgPSBnZXRGaXJzdFNjcm9sbGFibGVBbmNlc3RvcihlbGVtZW50KTtcblxuICBpZiAoIWZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGJvdHRvbSA8PSAwIHx8IHJpZ2h0IDw9IDAgfHwgdG9wID49IHdpbmRvdy5pbm5lckhlaWdodCB8fCBsZWZ0ID49IHdpbmRvdy5pbm5lcldpZHRoKSB7XG4gICAgZWxlbWVudC5zY3JvbGxJbnRvVmlldyh7XG4gICAgICBibG9jazogJ2NlbnRlcicsXG4gICAgICBpbmxpbmU6ICdjZW50ZXInXG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgcHJvcGVydGllcyA9IFtbJ3gnLCBbJ2xlZnQnLCAncmlnaHQnXSwgZ2V0U2Nyb2xsWE9mZnNldF0sIFsneScsIFsndG9wJywgJ2JvdHRvbSddLCBnZXRTY3JvbGxZT2Zmc2V0XV07XG5jbGFzcyBSZWN0IHtcbiAgY29uc3RydWN0b3IocmVjdCwgZWxlbWVudCkge1xuICAgIHRoaXMucmVjdCA9IHZvaWQgMDtcbiAgICB0aGlzLndpZHRoID0gdm9pZCAwO1xuICAgIHRoaXMuaGVpZ2h0ID0gdm9pZCAwO1xuICAgIHRoaXMudG9wID0gdm9pZCAwO1xuICAgIHRoaXMuYm90dG9tID0gdm9pZCAwO1xuICAgIHRoaXMucmlnaHQgPSB2b2lkIDA7XG4gICAgdGhpcy5sZWZ0ID0gdm9pZCAwO1xuICAgIGNvbnN0IHNjcm9sbGFibGVBbmNlc3RvcnMgPSBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzKGVsZW1lbnQpO1xuICAgIGNvbnN0IHNjcm9sbE9mZnNldHMgPSBnZXRTY3JvbGxPZmZzZXRzKHNjcm9sbGFibGVBbmNlc3RvcnMpO1xuICAgIHRoaXMucmVjdCA9IHsgLi4ucmVjdFxuICAgIH07XG4gICAgdGhpcy53aWR0aCA9IHJlY3Qud2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSByZWN0LmhlaWdodDtcblxuICAgIGZvciAoY29uc3QgW2F4aXMsIGtleXMsIGdldFNjcm9sbE9mZnNldF0gb2YgcHJvcGVydGllcykge1xuICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywga2V5LCB7XG4gICAgICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50T2Zmc2V0cyA9IGdldFNjcm9sbE9mZnNldChzY3JvbGxhYmxlQW5jZXN0b3JzKTtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbE9mZnNldHNEZWx0bGEgPSBzY3JvbGxPZmZzZXRzW2F4aXNdIC0gY3VycmVudE9mZnNldHM7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWN0W2tleV0gKyBzY3JvbGxPZmZzZXRzRGVsdGxhO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3JlY3QnLCB7XG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9XG5cbn1cblxuY2xhc3MgTGlzdGVuZXJzIHtcbiAgY29uc3RydWN0b3IodGFyZ2V0KSB7XG4gICAgdGhpcy50YXJnZXQgPSB2b2lkIDA7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcblxuICAgIHRoaXMucmVtb3ZlQWxsID0gKCkgPT4ge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiB7XG4gICAgICAgIHZhciBfdGhpcyR0YXJnZXQ7XG5cbiAgICAgICAgcmV0dXJuIChfdGhpcyR0YXJnZXQgPSB0aGlzLnRhcmdldCkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKC4uLmxpc3RlbmVyKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgfVxuXG4gIGFkZChldmVudE5hbWUsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICB2YXIgX3RoaXMkdGFyZ2V0MjtcblxuICAgIChfdGhpcyR0YXJnZXQyID0gdGhpcy50YXJnZXQpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyR0YXJnZXQyLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKFtldmVudE5hbWUsIGhhbmRsZXIsIG9wdGlvbnNdKTtcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50TGlzdGVuZXJUYXJnZXQodGFyZ2V0KSB7XG4gIC8vIElmIHRoZSBgZXZlbnQudGFyZ2V0YCBlbGVtZW50IGlzIHJlbW92ZWQgZnJvbSB0aGUgZG9jdW1lbnQgZXZlbnRzIHdpbGwgc3RpbGwgYmUgdGFyZ2V0ZWRcbiAgLy8gYXQgaXQsIGFuZCBoZW5jZSB3b24ndCBhbHdheXMgYnViYmxlIHVwIHRvIHRoZSB3aW5kb3cgb3IgZG9jdW1lbnQgYW55bW9yZS5cbiAgLy8gSWYgdGhlcmUgaXMgYW55IHJpc2sgb2YgYW4gZWxlbWVudCBiZWluZyByZW1vdmVkIHdoaWxlIGl0IGlzIGJlaW5nIGRyYWdnZWQsXG4gIC8vIHRoZSBiZXN0IHByYWN0aWNlIGlzIHRvIGF0dGFjaCB0aGUgZXZlbnQgbGlzdGVuZXJzIGRpcmVjdGx5IHRvIHRoZSB0YXJnZXQuXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FdmVudFRhcmdldFxuICBjb25zdCB7XG4gICAgRXZlbnRUYXJnZXRcbiAgfSA9IGdldFdpbmRvdyh0YXJnZXQpO1xuICByZXR1cm4gdGFyZ2V0IGluc3RhbmNlb2YgRXZlbnRUYXJnZXQgPyB0YXJnZXQgOiBnZXRPd25lckRvY3VtZW50KHRhcmdldCk7XG59XG5cbmZ1bmN0aW9uIGhhc0V4Y2VlZGVkRGlzdGFuY2UoZGVsdGEsIG1lYXN1cmVtZW50KSB7XG4gIGNvbnN0IGR4ID0gTWF0aC5hYnMoZGVsdGEueCk7XG4gIGNvbnN0IGR5ID0gTWF0aC5hYnMoZGVsdGEueSk7XG5cbiAgaWYgKHR5cGVvZiBtZWFzdXJlbWVudCA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICoqIDIgKyBkeSAqKiAyKSA+IG1lYXN1cmVtZW50O1xuICB9XG5cbiAgaWYgKCd4JyBpbiBtZWFzdXJlbWVudCAmJiAneScgaW4gbWVhc3VyZW1lbnQpIHtcbiAgICByZXR1cm4gZHggPiBtZWFzdXJlbWVudC54ICYmIGR5ID4gbWVhc3VyZW1lbnQueTtcbiAgfVxuXG4gIGlmICgneCcgaW4gbWVhc3VyZW1lbnQpIHtcbiAgICByZXR1cm4gZHggPiBtZWFzdXJlbWVudC54O1xuICB9XG5cbiAgaWYgKCd5JyBpbiBtZWFzdXJlbWVudCkge1xuICAgIHJldHVybiBkeSA+IG1lYXN1cmVtZW50Lnk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbnZhciBFdmVudE5hbWU7XG5cbihmdW5jdGlvbiAoRXZlbnROYW1lKSB7XG4gIEV2ZW50TmFtZVtcIkNsaWNrXCJdID0gXCJjbGlja1wiO1xuICBFdmVudE5hbWVbXCJEcmFnU3RhcnRcIl0gPSBcImRyYWdzdGFydFwiO1xuICBFdmVudE5hbWVbXCJLZXlkb3duXCJdID0gXCJrZXlkb3duXCI7XG4gIEV2ZW50TmFtZVtcIkNvbnRleHRNZW51XCJdID0gXCJjb250ZXh0bWVudVwiO1xuICBFdmVudE5hbWVbXCJSZXNpemVcIl0gPSBcInJlc2l6ZVwiO1xuICBFdmVudE5hbWVbXCJTZWxlY3Rpb25DaGFuZ2VcIl0gPSBcInNlbGVjdGlvbmNoYW5nZVwiO1xuICBFdmVudE5hbWVbXCJWaXNpYmlsaXR5Q2hhbmdlXCJdID0gXCJ2aXNpYmlsaXR5Y2hhbmdlXCI7XG59KShFdmVudE5hbWUgfHwgKEV2ZW50TmFtZSA9IHt9KSk7XG5cbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0KGV2ZW50KSB7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59XG5mdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24oZXZlbnQpIHtcbiAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbnZhciBLZXlib2FyZENvZGU7XG5cbihmdW5jdGlvbiAoS2V5Ym9hcmRDb2RlKSB7XG4gIEtleWJvYXJkQ29kZVtcIlNwYWNlXCJdID0gXCJTcGFjZVwiO1xuICBLZXlib2FyZENvZGVbXCJEb3duXCJdID0gXCJBcnJvd0Rvd25cIjtcbiAgS2V5Ym9hcmRDb2RlW1wiUmlnaHRcIl0gPSBcIkFycm93UmlnaHRcIjtcbiAgS2V5Ym9hcmRDb2RlW1wiTGVmdFwiXSA9IFwiQXJyb3dMZWZ0XCI7XG4gIEtleWJvYXJkQ29kZVtcIlVwXCJdID0gXCJBcnJvd1VwXCI7XG4gIEtleWJvYXJkQ29kZVtcIkVzY1wiXSA9IFwiRXNjYXBlXCI7XG4gIEtleWJvYXJkQ29kZVtcIkVudGVyXCJdID0gXCJFbnRlclwiO1xuICBLZXlib2FyZENvZGVbXCJUYWJcIl0gPSBcIlRhYlwiO1xufSkoS2V5Ym9hcmRDb2RlIHx8IChLZXlib2FyZENvZGUgPSB7fSkpO1xuXG5jb25zdCBkZWZhdWx0S2V5Ym9hcmRDb2RlcyA9IHtcbiAgc3RhcnQ6IFtLZXlib2FyZENvZGUuU3BhY2UsIEtleWJvYXJkQ29kZS5FbnRlcl0sXG4gIGNhbmNlbDogW0tleWJvYXJkQ29kZS5Fc2NdLFxuICBlbmQ6IFtLZXlib2FyZENvZGUuU3BhY2UsIEtleWJvYXJkQ29kZS5FbnRlciwgS2V5Ym9hcmRDb2RlLlRhYl1cbn07XG5jb25zdCBkZWZhdWx0S2V5Ym9hcmRDb29yZGluYXRlR2V0dGVyID0gKGV2ZW50LCBfcmVmKSA9PiB7XG4gIGxldCB7XG4gICAgY3VycmVudENvb3JkaW5hdGVzXG4gIH0gPSBfcmVmO1xuXG4gIHN3aXRjaCAoZXZlbnQuY29kZSkge1xuICAgIGNhc2UgS2V5Ym9hcmRDb2RlLlJpZ2h0OlxuICAgICAgcmV0dXJuIHsgLi4uY3VycmVudENvb3JkaW5hdGVzLFxuICAgICAgICB4OiBjdXJyZW50Q29vcmRpbmF0ZXMueCArIDI1XG4gICAgICB9O1xuXG4gICAgY2FzZSBLZXlib2FyZENvZGUuTGVmdDpcbiAgICAgIHJldHVybiB7IC4uLmN1cnJlbnRDb29yZGluYXRlcyxcbiAgICAgICAgeDogY3VycmVudENvb3JkaW5hdGVzLnggLSAyNVxuICAgICAgfTtcblxuICAgIGNhc2UgS2V5Ym9hcmRDb2RlLkRvd246XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50Q29vcmRpbmF0ZXMsXG4gICAgICAgIHk6IGN1cnJlbnRDb29yZGluYXRlcy55ICsgMjVcbiAgICAgIH07XG5cbiAgICBjYXNlIEtleWJvYXJkQ29kZS5VcDpcbiAgICAgIHJldHVybiB7IC4uLmN1cnJlbnRDb29yZGluYXRlcyxcbiAgICAgICAgeTogY3VycmVudENvb3JkaW5hdGVzLnkgLSAyNVxuICAgICAgfTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5jbGFzcyBLZXlib2FyZFNlbnNvciB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgdGhpcy5wcm9wcyA9IHZvaWQgMDtcbiAgICB0aGlzLmF1dG9TY3JvbGxFbmFibGVkID0gZmFsc2U7XG4gICAgdGhpcy5yZWZlcmVuY2VDb29yZGluYXRlcyA9IHZvaWQgMDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgY29uc3Qge1xuICAgICAgZXZlbnQ6IHtcbiAgICAgICAgdGFyZ2V0XG4gICAgICB9XG4gICAgfSA9IHByb3BzO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBMaXN0ZW5lcnMoZ2V0T3duZXJEb2N1bWVudCh0YXJnZXQpKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycyA9IG5ldyBMaXN0ZW5lcnMoZ2V0V2luZG93KHRhcmdldCkpO1xuICAgIHRoaXMuaGFuZGxlS2V5RG93biA9IHRoaXMuaGFuZGxlS2V5RG93bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGFuZGxlQ2FuY2VsID0gdGhpcy5oYW5kbGVDYW5jZWwuYmluZCh0aGlzKTtcbiAgICB0aGlzLmF0dGFjaCgpO1xuICB9XG5cbiAgYXR0YWNoKCkge1xuICAgIHRoaXMuaGFuZGxlU3RhcnQoKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5hZGQoRXZlbnROYW1lLlJlc2l6ZSwgdGhpcy5oYW5kbGVDYW5jZWwpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuVmlzaWJpbGl0eUNoYW5nZSwgdGhpcy5oYW5kbGVDYW5jZWwpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5saXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5LZXlkb3duLCB0aGlzLmhhbmRsZUtleURvd24pKTtcbiAgfVxuXG4gIGhhbmRsZVN0YXJ0KCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGFjdGl2ZU5vZGUsXG4gICAgICBvblN0YXJ0XG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qgbm9kZSA9IGFjdGl2ZU5vZGUubm9kZS5jdXJyZW50O1xuXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIHNjcm9sbEludG9WaWV3SWZOZWVkZWQobm9kZSk7XG4gICAgfVxuXG4gICAgb25TdGFydChkZWZhdWx0Q29vcmRpbmF0ZXMpO1xuICB9XG5cbiAgaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgIGlmIChpc0tleWJvYXJkRXZlbnQoZXZlbnQpKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgb3B0aW9uc1xuICAgICAgfSA9IHRoaXMucHJvcHM7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGtleWJvYXJkQ29kZXMgPSBkZWZhdWx0S2V5Ym9hcmRDb2RlcyxcbiAgICAgICAgY29vcmRpbmF0ZUdldHRlciA9IGRlZmF1bHRLZXlib2FyZENvb3JkaW5hdGVHZXR0ZXIsXG4gICAgICAgIHNjcm9sbEJlaGF2aW9yID0gJ3Ntb290aCdcbiAgICAgIH0gPSBvcHRpb25zO1xuICAgICAgY29uc3Qge1xuICAgICAgICBjb2RlXG4gICAgICB9ID0gZXZlbnQ7XG5cbiAgICAgIGlmIChrZXlib2FyZENvZGVzLmVuZC5pbmNsdWRlcyhjb2RlKSkge1xuICAgICAgICB0aGlzLmhhbmRsZUVuZChldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGtleWJvYXJkQ29kZXMuY2FuY2VsLmluY2x1ZGVzKGNvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlQ2FuY2VsKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIGNvbGxpc2lvblJlY3RcbiAgICAgIH0gPSBjb250ZXh0LmN1cnJlbnQ7XG4gICAgICBjb25zdCBjdXJyZW50Q29vcmRpbmF0ZXMgPSBjb2xsaXNpb25SZWN0ID8ge1xuICAgICAgICB4OiBjb2xsaXNpb25SZWN0LmxlZnQsXG4gICAgICAgIHk6IGNvbGxpc2lvblJlY3QudG9wXG4gICAgICB9IDogZGVmYXVsdENvb3JkaW5hdGVzO1xuXG4gICAgICBpZiAoIXRoaXMucmVmZXJlbmNlQ29vcmRpbmF0ZXMpIHtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VDb29yZGluYXRlcyA9IGN1cnJlbnRDb29yZGluYXRlcztcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3Q29vcmRpbmF0ZXMgPSBjb29yZGluYXRlR2V0dGVyKGV2ZW50LCB7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgY29udGV4dDogY29udGV4dC5jdXJyZW50LFxuICAgICAgICBjdXJyZW50Q29vcmRpbmF0ZXNcbiAgICAgIH0pO1xuXG4gICAgICBpZiAobmV3Q29vcmRpbmF0ZXMpIHtcbiAgICAgICAgY29uc3QgY29vcmRpbmF0ZXNEZWx0YSA9IHN1YnRyYWN0KG5ld0Nvb3JkaW5hdGVzLCBjdXJyZW50Q29vcmRpbmF0ZXMpO1xuICAgICAgICBjb25zdCBzY3JvbGxEZWx0YSA9IHtcbiAgICAgICAgICB4OiAwLFxuICAgICAgICAgIHk6IDBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIHNjcm9sbGFibGVBbmNlc3RvcnNcbiAgICAgICAgfSA9IGNvbnRleHQuY3VycmVudDtcblxuICAgICAgICBmb3IgKGNvbnN0IHNjcm9sbENvbnRhaW5lciBvZiBzY3JvbGxhYmxlQW5jZXN0b3JzKSB7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gZXZlbnQuY29kZTtcbiAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBpc1RvcCxcbiAgICAgICAgICAgIGlzUmlnaHQsXG4gICAgICAgICAgICBpc0xlZnQsXG4gICAgICAgICAgICBpc0JvdHRvbSxcbiAgICAgICAgICAgIG1heFNjcm9sbCxcbiAgICAgICAgICAgIG1pblNjcm9sbFxuICAgICAgICAgIH0gPSBnZXRTY3JvbGxQb3NpdGlvbihzY3JvbGxDb250YWluZXIpO1xuICAgICAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnRSZWN0ID0gZ2V0U2Nyb2xsRWxlbWVudFJlY3Qoc2Nyb2xsQ29udGFpbmVyKTtcbiAgICAgICAgICBjb25zdCBjbGFtcGVkQ29vcmRpbmF0ZXMgPSB7XG4gICAgICAgICAgICB4OiBNYXRoLm1pbihkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5SaWdodCA/IHNjcm9sbEVsZW1lbnRSZWN0LnJpZ2h0IC0gc2Nyb2xsRWxlbWVudFJlY3Qud2lkdGggLyAyIDogc2Nyb2xsRWxlbWVudFJlY3QucmlnaHQsIE1hdGgubWF4KGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlJpZ2h0ID8gc2Nyb2xsRWxlbWVudFJlY3QubGVmdCA6IHNjcm9sbEVsZW1lbnRSZWN0LmxlZnQgKyBzY3JvbGxFbGVtZW50UmVjdC53aWR0aCAvIDIsIG5ld0Nvb3JkaW5hdGVzLngpKSxcbiAgICAgICAgICAgIHk6IE1hdGgubWluKGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkRvd24gPyBzY3JvbGxFbGVtZW50UmVjdC5ib3R0b20gLSBzY3JvbGxFbGVtZW50UmVjdC5oZWlnaHQgLyAyIDogc2Nyb2xsRWxlbWVudFJlY3QuYm90dG9tLCBNYXRoLm1heChkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5Eb3duID8gc2Nyb2xsRWxlbWVudFJlY3QudG9wIDogc2Nyb2xsRWxlbWVudFJlY3QudG9wICsgc2Nyb2xsRWxlbWVudFJlY3QuaGVpZ2h0IC8gMiwgbmV3Q29vcmRpbmF0ZXMueSkpXG4gICAgICAgICAgfTtcbiAgICAgICAgICBjb25zdCBjYW5TY3JvbGxYID0gZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuUmlnaHQgJiYgIWlzUmlnaHQgfHwgZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuTGVmdCAmJiAhaXNMZWZ0O1xuICAgICAgICAgIGNvbnN0IGNhblNjcm9sbFkgPSBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5Eb3duICYmICFpc0JvdHRvbSB8fCBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5VcCAmJiAhaXNUb3A7XG5cbiAgICAgICAgICBpZiAoY2FuU2Nyb2xsWCAmJiBjbGFtcGVkQ29vcmRpbmF0ZXMueCAhPT0gbmV3Q29vcmRpbmF0ZXMueCkge1xuICAgICAgICAgICAgY29uc3QgbmV3U2Nyb2xsQ29vcmRpbmF0ZXMgPSBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCArIGNvb3JkaW5hdGVzRGVsdGEueDtcbiAgICAgICAgICAgIGNvbnN0IGNhblNjcm9sbFRvTmV3Q29vcmRpbmF0ZXMgPSBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5SaWdodCAmJiBuZXdTY3JvbGxDb29yZGluYXRlcyA8PSBtYXhTY3JvbGwueCB8fCBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5MZWZ0ICYmIG5ld1Njcm9sbENvb3JkaW5hdGVzID49IG1pblNjcm9sbC54O1xuXG4gICAgICAgICAgICBpZiAoY2FuU2Nyb2xsVG9OZXdDb29yZGluYXRlcyAmJiAhY29vcmRpbmF0ZXNEZWx0YS55KSB7XG4gICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIGNvb3JkaW5hdGVzLCB0aGUgc2Nyb2xsIGFkanVzdG1lbnQgYWxvbmUgd2lsbCB0cmlnZ2VyXG4gICAgICAgICAgICAgIC8vIGxvZ2ljIHRvIGF1dG8tZGV0ZWN0IHRoZSBuZXcgY29udGFpbmVyIHdlIGFyZSBvdmVyXG4gICAgICAgICAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxUbyh7XG4gICAgICAgICAgICAgICAgbGVmdDogbmV3U2Nyb2xsQ29vcmRpbmF0ZXMsXG4gICAgICAgICAgICAgICAgYmVoYXZpb3I6IHNjcm9sbEJlaGF2aW9yXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYW5TY3JvbGxUb05ld0Nvb3JkaW5hdGVzKSB7XG4gICAgICAgICAgICAgIHNjcm9sbERlbHRhLnggPSBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCAtIG5ld1Njcm9sbENvb3JkaW5hdGVzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2Nyb2xsRGVsdGEueCA9IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlJpZ2h0ID8gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgLSBtYXhTY3JvbGwueCA6IHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0IC0gbWluU2Nyb2xsLng7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzY3JvbGxEZWx0YS54KSB7XG4gICAgICAgICAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxCeSh7XG4gICAgICAgICAgICAgICAgbGVmdDogLXNjcm9sbERlbHRhLngsXG4gICAgICAgICAgICAgICAgYmVoYXZpb3I6IHNjcm9sbEJlaGF2aW9yXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNhblNjcm9sbFkgJiYgY2xhbXBlZENvb3JkaW5hdGVzLnkgIT09IG5ld0Nvb3JkaW5hdGVzLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1Njcm9sbENvb3JkaW5hdGVzID0gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCArIGNvb3JkaW5hdGVzRGVsdGEueTtcbiAgICAgICAgICAgIGNvbnN0IGNhblNjcm9sbFRvTmV3Q29vcmRpbmF0ZXMgPSBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5Eb3duICYmIG5ld1Njcm9sbENvb3JkaW5hdGVzIDw9IG1heFNjcm9sbC55IHx8IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlVwICYmIG5ld1Njcm9sbENvb3JkaW5hdGVzID49IG1pblNjcm9sbC55O1xuXG4gICAgICAgICAgICBpZiAoY2FuU2Nyb2xsVG9OZXdDb29yZGluYXRlcyAmJiAhY29vcmRpbmF0ZXNEZWx0YS54KSB7XG4gICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIGNvb3JkaW5hdGVzLCB0aGUgc2Nyb2xsIGFkanVzdG1lbnQgYWxvbmUgd2lsbCB0cmlnZ2VyXG4gICAgICAgICAgICAgIC8vIGxvZ2ljIHRvIGF1dG8tZGV0ZWN0IHRoZSBuZXcgY29udGFpbmVyIHdlIGFyZSBvdmVyXG4gICAgICAgICAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxUbyh7XG4gICAgICAgICAgICAgICAgdG9wOiBuZXdTY3JvbGxDb29yZGluYXRlcyxcbiAgICAgICAgICAgICAgICBiZWhhdmlvcjogc2Nyb2xsQmVoYXZpb3JcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhblNjcm9sbFRvTmV3Q29vcmRpbmF0ZXMpIHtcbiAgICAgICAgICAgICAgc2Nyb2xsRGVsdGEueSA9IHNjcm9sbENvbnRhaW5lci5zY3JvbGxUb3AgLSBuZXdTY3JvbGxDb29yZGluYXRlcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNjcm9sbERlbHRhLnkgPSBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5Eb3duID8gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCAtIG1heFNjcm9sbC55IDogc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCAtIG1pblNjcm9sbC55O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2Nyb2xsRGVsdGEueSkge1xuICAgICAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsQnkoe1xuICAgICAgICAgICAgICAgIHRvcDogLXNjcm9sbERlbHRhLnksXG4gICAgICAgICAgICAgICAgYmVoYXZpb3I6IHNjcm9sbEJlaGF2aW9yXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhhbmRsZU1vdmUoZXZlbnQsIGFkZChzdWJ0cmFjdChuZXdDb29yZGluYXRlcywgdGhpcy5yZWZlcmVuY2VDb29yZGluYXRlcyksIHNjcm9sbERlbHRhKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlTW92ZShldmVudCwgY29vcmRpbmF0ZXMpIHtcbiAgICBjb25zdCB7XG4gICAgICBvbk1vdmVcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIG9uTW92ZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBoYW5kbGVFbmQoZXZlbnQpIHtcbiAgICBjb25zdCB7XG4gICAgICBvbkVuZFxuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5kZXRhY2goKTtcbiAgICBvbkVuZCgpO1xuICB9XG5cbiAgaGFuZGxlQ2FuY2VsKGV2ZW50KSB7XG4gICAgY29uc3Qge1xuICAgICAgb25DYW5jZWxcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgb25DYW5jZWwoKTtcbiAgfVxuXG4gIGRldGFjaCgpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5yZW1vdmVBbGwoKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5yZW1vdmVBbGwoKTtcbiAgfVxuXG59XG5LZXlib2FyZFNlbnNvci5hY3RpdmF0b3JzID0gW3tcbiAgZXZlbnROYW1lOiAnb25LZXlEb3duJyxcbiAgaGFuZGxlcjogKGV2ZW50LCBfcmVmLCBfcmVmMikgPT4ge1xuICAgIGxldCB7XG4gICAgICBrZXlib2FyZENvZGVzID0gZGVmYXVsdEtleWJvYXJkQ29kZXMsXG4gICAgICBvbkFjdGl2YXRpb25cbiAgICB9ID0gX3JlZjtcbiAgICBsZXQge1xuICAgICAgYWN0aXZlXG4gICAgfSA9IF9yZWYyO1xuICAgIGNvbnN0IHtcbiAgICAgIGNvZGVcbiAgICB9ID0gZXZlbnQubmF0aXZlRXZlbnQ7XG5cbiAgICBpZiAoa2V5Ym9hcmRDb2Rlcy5zdGFydC5pbmNsdWRlcyhjb2RlKSkge1xuICAgICAgY29uc3QgYWN0aXZhdG9yID0gYWN0aXZlLmFjdGl2YXRvck5vZGUuY3VycmVudDtcblxuICAgICAgaWYgKGFjdGl2YXRvciAmJiBldmVudC50YXJnZXQgIT09IGFjdGl2YXRvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBvbkFjdGl2YXRpb24gPT0gbnVsbCA/IHZvaWQgMCA6IG9uQWN0aXZhdGlvbih7XG4gICAgICAgIGV2ZW50OiBldmVudC5uYXRpdmVFdmVudFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1dO1xuXG5mdW5jdGlvbiBpc0Rpc3RhbmNlQ29uc3RyYWludChjb25zdHJhaW50KSB7XG4gIHJldHVybiBCb29sZWFuKGNvbnN0cmFpbnQgJiYgJ2Rpc3RhbmNlJyBpbiBjb25zdHJhaW50KTtcbn1cblxuZnVuY3Rpb24gaXNEZWxheUNvbnN0cmFpbnQoY29uc3RyYWludCkge1xuICByZXR1cm4gQm9vbGVhbihjb25zdHJhaW50ICYmICdkZWxheScgaW4gY29uc3RyYWludCk7XG59XG5cbmNsYXNzIEFic3RyYWN0UG9pbnRlclNlbnNvciB7XG4gIGNvbnN0cnVjdG9yKHByb3BzLCBldmVudHMsIGxpc3RlbmVyVGFyZ2V0KSB7XG4gICAgdmFyIF9nZXRFdmVudENvb3JkaW5hdGVzO1xuXG4gICAgaWYgKGxpc3RlbmVyVGFyZ2V0ID09PSB2b2lkIDApIHtcbiAgICAgIGxpc3RlbmVyVGFyZ2V0ID0gZ2V0RXZlbnRMaXN0ZW5lclRhcmdldChwcm9wcy5ldmVudC50YXJnZXQpO1xuICAgIH1cblxuICAgIHRoaXMucHJvcHMgPSB2b2lkIDA7XG4gICAgdGhpcy5ldmVudHMgPSB2b2lkIDA7XG4gICAgdGhpcy5hdXRvU2Nyb2xsRW5hYmxlZCA9IHRydWU7XG4gICAgdGhpcy5kb2N1bWVudCA9IHZvaWQgMDtcbiAgICB0aGlzLmFjdGl2YXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuaW5pdGlhbENvb3JkaW5hdGVzID0gdm9pZCAwO1xuICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB0aGlzLmRvY3VtZW50TGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50cztcbiAgICBjb25zdCB7XG4gICAgICBldmVudFxuICAgIH0gPSBwcm9wcztcbiAgICBjb25zdCB7XG4gICAgICB0YXJnZXRcbiAgICB9ID0gZXZlbnQ7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgIHRoaXMuZXZlbnRzID0gZXZlbnRzO1xuICAgIHRoaXMuZG9jdW1lbnQgPSBnZXRPd25lckRvY3VtZW50KHRhcmdldCk7XG4gICAgdGhpcy5kb2N1bWVudExpc3RlbmVycyA9IG5ldyBMaXN0ZW5lcnModGhpcy5kb2N1bWVudCk7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgTGlzdGVuZXJzKGxpc3RlbmVyVGFyZ2V0KTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycyA9IG5ldyBMaXN0ZW5lcnMoZ2V0V2luZG93KHRhcmdldCkpO1xuICAgIHRoaXMuaW5pdGlhbENvb3JkaW5hdGVzID0gKF9nZXRFdmVudENvb3JkaW5hdGVzID0gZ2V0RXZlbnRDb29yZGluYXRlcyhldmVudCkpICE9IG51bGwgPyBfZ2V0RXZlbnRDb29yZGluYXRlcyA6IGRlZmF1bHRDb29yZGluYXRlcztcbiAgICB0aGlzLmhhbmRsZVN0YXJ0ID0gdGhpcy5oYW5kbGVTdGFydC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGFuZGxlTW92ZSA9IHRoaXMuaGFuZGxlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGFuZGxlRW5kID0gdGhpcy5oYW5kbGVFbmQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZUNhbmNlbCA9IHRoaXMuaGFuZGxlQ2FuY2VsLmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVLZXlkb3duID0gdGhpcy5oYW5kbGVLZXlkb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVUZXh0U2VsZWN0aW9uID0gdGhpcy5yZW1vdmVUZXh0U2VsZWN0aW9uLmJpbmQodGhpcyk7XG4gICAgdGhpcy5hdHRhY2goKTtcbiAgfVxuXG4gIGF0dGFjaCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBldmVudHMsXG4gICAgICBwcm9wczoge1xuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgYWN0aXZhdGlvbkNvbnN0cmFpbnQsXG4gICAgICAgICAgYnlwYXNzQWN0aXZhdGlvbkNvbnN0cmFpbnRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gPSB0aGlzO1xuICAgIHRoaXMubGlzdGVuZXJzLmFkZChldmVudHMubW92ZS5uYW1lLCB0aGlzLmhhbmRsZU1vdmUsIHtcbiAgICAgIHBhc3NpdmU6IGZhbHNlXG4gICAgfSk7XG4gICAgdGhpcy5saXN0ZW5lcnMuYWRkKGV2ZW50cy5lbmQubmFtZSwgdGhpcy5oYW5kbGVFbmQpO1xuXG4gICAgaWYgKGV2ZW50cy5jYW5jZWwpIHtcbiAgICAgIHRoaXMubGlzdGVuZXJzLmFkZChldmVudHMuY2FuY2VsLm5hbWUsIHRoaXMuaGFuZGxlQ2FuY2VsKTtcbiAgICB9XG5cbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5hZGQoRXZlbnROYW1lLlJlc2l6ZSwgdGhpcy5oYW5kbGVDYW5jZWwpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuRHJhZ1N0YXJ0LCBwcmV2ZW50RGVmYXVsdCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5WaXNpYmlsaXR5Q2hhbmdlLCB0aGlzLmhhbmRsZUNhbmNlbCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5Db250ZXh0TWVudSwgcHJldmVudERlZmF1bHQpO1xuICAgIHRoaXMuZG9jdW1lbnRMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5LZXlkb3duLCB0aGlzLmhhbmRsZUtleWRvd24pO1xuXG4gICAgaWYgKGFjdGl2YXRpb25Db25zdHJhaW50KSB7XG4gICAgICBpZiAoYnlwYXNzQWN0aXZhdGlvbkNvbnN0cmFpbnQgIT0gbnVsbCAmJiBieXBhc3NBY3RpdmF0aW9uQ29uc3RyYWludCh7XG4gICAgICAgIGV2ZW50OiB0aGlzLnByb3BzLmV2ZW50LFxuICAgICAgICBhY3RpdmVOb2RlOiB0aGlzLnByb3BzLmFjdGl2ZU5vZGUsXG4gICAgICAgIG9wdGlvbnM6IHRoaXMucHJvcHMub3B0aW9uc1xuICAgICAgfSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU3RhcnQoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRGVsYXlDb25zdHJhaW50KGFjdGl2YXRpb25Db25zdHJhaW50KSkge1xuICAgICAgICB0aGlzLnRpbWVvdXRJZCA9IHNldFRpbWVvdXQodGhpcy5oYW5kbGVTdGFydCwgYWN0aXZhdGlvbkNvbnN0cmFpbnQuZGVsYXkpO1xuICAgICAgICB0aGlzLmhhbmRsZVBlbmRpbmcoYWN0aXZhdGlvbkNvbnN0cmFpbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0Rpc3RhbmNlQ29uc3RyYWludChhY3RpdmF0aW9uQ29uc3RyYWludCkpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVQZW5kaW5nKGFjdGl2YXRpb25Db25zdHJhaW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaGFuZGxlU3RhcnQoKTtcbiAgfVxuXG4gIGRldGFjaCgpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5yZW1vdmVBbGwoKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5yZW1vdmVBbGwoKTsgLy8gV2FpdCB1bnRpbCB0aGUgbmV4dCBldmVudCBsb29wIGJlZm9yZSByZW1vdmluZyBkb2N1bWVudCBsaXN0ZW5lcnNcbiAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHdlIGxpc3RlbiBmb3IgYGNsaWNrYCBhbmQgYHNlbGVjdGlvbmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudFxuXG4gICAgc2V0VGltZW91dCh0aGlzLmRvY3VtZW50TGlzdGVuZXJzLnJlbW92ZUFsbCwgNTApO1xuXG4gICAgaWYgKHRoaXMudGltZW91dElkICE9PSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZVBlbmRpbmcoY29uc3RyYWludCwgb2Zmc2V0KSB7XG4gICAgY29uc3Qge1xuICAgICAgYWN0aXZlLFxuICAgICAgb25QZW5kaW5nXG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgb25QZW5kaW5nKGFjdGl2ZSwgY29uc3RyYWludCwgdGhpcy5pbml0aWFsQ29vcmRpbmF0ZXMsIG9mZnNldCk7XG4gIH1cblxuICBoYW5kbGVTdGFydCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBpbml0aWFsQ29vcmRpbmF0ZXNcbiAgICB9ID0gdGhpcztcbiAgICBjb25zdCB7XG4gICAgICBvblN0YXJ0XG4gICAgfSA9IHRoaXMucHJvcHM7XG5cbiAgICBpZiAoaW5pdGlhbENvb3JkaW5hdGVzKSB7XG4gICAgICB0aGlzLmFjdGl2YXRlZCA9IHRydWU7IC8vIFN0b3AgcHJvcGFnYXRpb24gb2YgY2xpY2sgZXZlbnRzIG9uY2UgYWN0aXZhdGlvbiBjb25zdHJhaW50cyBhcmUgbWV0XG5cbiAgICAgIHRoaXMuZG9jdW1lbnRMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5DbGljaywgc3RvcFByb3BhZ2F0aW9uLCB7XG4gICAgICAgIGNhcHR1cmU6IHRydWVcbiAgICAgIH0pOyAvLyBSZW1vdmUgYW55IHRleHQgc2VsZWN0aW9uIGZyb20gdGhlIGRvY3VtZW50XG5cbiAgICAgIHRoaXMucmVtb3ZlVGV4dFNlbGVjdGlvbigpOyAvLyBQcmV2ZW50IGZ1cnRoZXIgdGV4dCBzZWxlY3Rpb24gd2hpbGUgZHJhZ2dpbmdcblxuICAgICAgdGhpcy5kb2N1bWVudExpc3RlbmVycy5hZGQoRXZlbnROYW1lLlNlbGVjdGlvbkNoYW5nZSwgdGhpcy5yZW1vdmVUZXh0U2VsZWN0aW9uKTtcbiAgICAgIG9uU3RhcnQoaW5pdGlhbENvb3JkaW5hdGVzKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVNb3ZlKGV2ZW50KSB7XG4gICAgdmFyIF9nZXRFdmVudENvb3JkaW5hdGVzMjtcblxuICAgIGNvbnN0IHtcbiAgICAgIGFjdGl2YXRlZCxcbiAgICAgIGluaXRpYWxDb29yZGluYXRlcyxcbiAgICAgIHByb3BzXG4gICAgfSA9IHRoaXM7XG4gICAgY29uc3Qge1xuICAgICAgb25Nb3ZlLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBhY3RpdmF0aW9uQ29uc3RyYWludFxuICAgICAgfVxuICAgIH0gPSBwcm9wcztcblxuICAgIGlmICghaW5pdGlhbENvb3JkaW5hdGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29vcmRpbmF0ZXMgPSAoX2dldEV2ZW50Q29vcmRpbmF0ZXMyID0gZ2V0RXZlbnRDb29yZGluYXRlcyhldmVudCkpICE9IG51bGwgPyBfZ2V0RXZlbnRDb29yZGluYXRlczIgOiBkZWZhdWx0Q29vcmRpbmF0ZXM7XG4gICAgY29uc3QgZGVsdGEgPSBzdWJ0cmFjdChpbml0aWFsQ29vcmRpbmF0ZXMsIGNvb3JkaW5hdGVzKTsgLy8gQ29uc3RyYWludCB2YWxpZGF0aW9uXG5cbiAgICBpZiAoIWFjdGl2YXRlZCAmJiBhY3RpdmF0aW9uQ29uc3RyYWludCkge1xuICAgICAgaWYgKGlzRGlzdGFuY2VDb25zdHJhaW50KGFjdGl2YXRpb25Db25zdHJhaW50KSkge1xuICAgICAgICBpZiAoYWN0aXZhdGlvbkNvbnN0cmFpbnQudG9sZXJhbmNlICE9IG51bGwgJiYgaGFzRXhjZWVkZWREaXN0YW5jZShkZWx0YSwgYWN0aXZhdGlvbkNvbnN0cmFpbnQudG9sZXJhbmNlKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUNhbmNlbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0V4Y2VlZGVkRGlzdGFuY2UoZGVsdGEsIGFjdGl2YXRpb25Db25zdHJhaW50LmRpc3RhbmNlKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZVN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzRGVsYXlDb25zdHJhaW50KGFjdGl2YXRpb25Db25zdHJhaW50KSkge1xuICAgICAgICBpZiAoaGFzRXhjZWVkZWREaXN0YW5jZShkZWx0YSwgYWN0aXZhdGlvbkNvbnN0cmFpbnQudG9sZXJhbmNlKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZUNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuaGFuZGxlUGVuZGluZyhhY3RpdmF0aW9uQ29uc3RyYWludCwgZGVsdGEpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5jYW5jZWxhYmxlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIG9uTW92ZShjb29yZGluYXRlcyk7XG4gIH1cblxuICBoYW5kbGVFbmQoKSB7XG4gICAgY29uc3Qge1xuICAgICAgb25BYm9ydCxcbiAgICAgIG9uRW5kXG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgdGhpcy5kZXRhY2goKTtcblxuICAgIGlmICghdGhpcy5hY3RpdmF0ZWQpIHtcbiAgICAgIG9uQWJvcnQodGhpcy5wcm9wcy5hY3RpdmUpO1xuICAgIH1cblxuICAgIG9uRW5kKCk7XG4gIH1cblxuICBoYW5kbGVDYW5jZWwoKSB7XG4gICAgY29uc3Qge1xuICAgICAgb25BYm9ydCxcbiAgICAgIG9uQ2FuY2VsXG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgdGhpcy5kZXRhY2goKTtcblxuICAgIGlmICghdGhpcy5hY3RpdmF0ZWQpIHtcbiAgICAgIG9uQWJvcnQodGhpcy5wcm9wcy5hY3RpdmUpO1xuICAgIH1cblxuICAgIG9uQ2FuY2VsKCk7XG4gIH1cblxuICBoYW5kbGVLZXlkb3duKGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmNvZGUgPT09IEtleWJvYXJkQ29kZS5Fc2MpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ2FuY2VsKCk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlVGV4dFNlbGVjdGlvbigpIHtcbiAgICB2YXIgX3RoaXMkZG9jdW1lbnQkZ2V0U2VsO1xuXG4gICAgKF90aGlzJGRvY3VtZW50JGdldFNlbCA9IHRoaXMuZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCkpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRkb2N1bWVudCRnZXRTZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIH1cblxufVxuXG5jb25zdCBldmVudHMgPSB7XG4gIGNhbmNlbDoge1xuICAgIG5hbWU6ICdwb2ludGVyY2FuY2VsJ1xuICB9LFxuICBtb3ZlOiB7XG4gICAgbmFtZTogJ3BvaW50ZXJtb3ZlJ1xuICB9LFxuICBlbmQ6IHtcbiAgICBuYW1lOiAncG9pbnRlcnVwJ1xuICB9XG59O1xuY2xhc3MgUG9pbnRlclNlbnNvciBleHRlbmRzIEFic3RyYWN0UG9pbnRlclNlbnNvciB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgY29uc3Qge1xuICAgICAgZXZlbnRcbiAgICB9ID0gcHJvcHM7IC8vIFBvaW50ZXIgZXZlbnRzIHN0b3AgZmlyaW5nIGlmIHRoZSB0YXJnZXQgaXMgdW5tb3VudGVkIHdoaWxlIGRyYWdnaW5nXG4gICAgLy8gVGhlcmVmb3JlIHdlIGF0dGFjaCBsaXN0ZW5lcnMgdG8gdGhlIG93bmVyIGRvY3VtZW50IGluc3RlYWRcblxuICAgIGNvbnN0IGxpc3RlbmVyVGFyZ2V0ID0gZ2V0T3duZXJEb2N1bWVudChldmVudC50YXJnZXQpO1xuICAgIHN1cGVyKHByb3BzLCBldmVudHMsIGxpc3RlbmVyVGFyZ2V0KTtcbiAgfVxuXG59XG5Qb2ludGVyU2Vuc29yLmFjdGl2YXRvcnMgPSBbe1xuICBldmVudE5hbWU6ICdvblBvaW50ZXJEb3duJyxcbiAgaGFuZGxlcjogKF9yZWYsIF9yZWYyKSA9PiB7XG4gICAgbGV0IHtcbiAgICAgIG5hdGl2ZUV2ZW50OiBldmVudFxuICAgIH0gPSBfcmVmO1xuICAgIGxldCB7XG4gICAgICBvbkFjdGl2YXRpb25cbiAgICB9ID0gX3JlZjI7XG5cbiAgICBpZiAoIWV2ZW50LmlzUHJpbWFyeSB8fCBldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBvbkFjdGl2YXRpb24gPT0gbnVsbCA/IHZvaWQgMCA6IG9uQWN0aXZhdGlvbih7XG4gICAgICBldmVudFxuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XTtcblxuY29uc3QgZXZlbnRzJDEgPSB7XG4gIG1vdmU6IHtcbiAgICBuYW1lOiAnbW91c2Vtb3ZlJ1xuICB9LFxuICBlbmQ6IHtcbiAgICBuYW1lOiAnbW91c2V1cCdcbiAgfVxufTtcbnZhciBNb3VzZUJ1dHRvbjtcblxuKGZ1bmN0aW9uIChNb3VzZUJ1dHRvbikge1xuICBNb3VzZUJ1dHRvbltNb3VzZUJ1dHRvbltcIlJpZ2h0Q2xpY2tcIl0gPSAyXSA9IFwiUmlnaHRDbGlja1wiO1xufSkoTW91c2VCdXR0b24gfHwgKE1vdXNlQnV0dG9uID0ge30pKTtcblxuY2xhc3MgTW91c2VTZW5zb3IgZXh0ZW5kcyBBYnN0cmFjdFBvaW50ZXJTZW5zb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzLCBldmVudHMkMSwgZ2V0T3duZXJEb2N1bWVudChwcm9wcy5ldmVudC50YXJnZXQpKTtcbiAgfVxuXG59XG5Nb3VzZVNlbnNvci5hY3RpdmF0b3JzID0gW3tcbiAgZXZlbnROYW1lOiAnb25Nb3VzZURvd24nLFxuICBoYW5kbGVyOiAoX3JlZiwgX3JlZjIpID0+IHtcbiAgICBsZXQge1xuICAgICAgbmF0aXZlRXZlbnQ6IGV2ZW50XG4gICAgfSA9IF9yZWY7XG4gICAgbGV0IHtcbiAgICAgIG9uQWN0aXZhdGlvblxuICAgIH0gPSBfcmVmMjtcblxuICAgIGlmIChldmVudC5idXR0b24gPT09IE1vdXNlQnV0dG9uLlJpZ2h0Q2xpY2spIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBvbkFjdGl2YXRpb24gPT0gbnVsbCA/IHZvaWQgMCA6IG9uQWN0aXZhdGlvbih7XG4gICAgICBldmVudFxuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XTtcblxuY29uc3QgZXZlbnRzJDIgPSB7XG4gIGNhbmNlbDoge1xuICAgIG5hbWU6ICd0b3VjaGNhbmNlbCdcbiAgfSxcbiAgbW92ZToge1xuICAgIG5hbWU6ICd0b3VjaG1vdmUnXG4gIH0sXG4gIGVuZDoge1xuICAgIG5hbWU6ICd0b3VjaGVuZCdcbiAgfVxufTtcbmNsYXNzIFRvdWNoU2Vuc29yIGV4dGVuZHMgQWJzdHJhY3RQb2ludGVyU2Vuc29yIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcywgZXZlbnRzJDIpO1xuICB9XG5cbiAgc3RhdGljIHNldHVwKCkge1xuICAgIC8vIEFkZGluZyBhIG5vbi1jYXB0dXJlIGFuZCBub24tcGFzc2l2ZSBgdG91Y2htb3ZlYCBsaXN0ZW5lciBpbiBvcmRlclxuICAgIC8vIHRvIGZvcmNlIGBldmVudC5wcmV2ZW50RGVmYXVsdCgpYCBjYWxscyB0byB3b3JrIGluIGR5bmFtaWNhbGx5IGFkZGVkXG4gICAgLy8gdG91Y2htb3ZlIGV2ZW50IGhhbmRsZXJzLiBUaGlzIGlzIHJlcXVpcmVkIGZvciBpT1MgU2FmYXJpLlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50cyQyLm1vdmUubmFtZSwgbm9vcCwge1xuICAgICAgY2FwdHVyZTogZmFsc2UsXG4gICAgICBwYXNzaXZlOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50cyQyLm1vdmUubmFtZSwgbm9vcCk7XG4gICAgfTsgLy8gV2UgY3JlYXRlIGEgbmV3IGhhbmRsZXIgYmVjYXVzZSB0aGUgdGVhcmRvd24gZnVuY3Rpb24gb2YgYW5vdGhlciBzZW5zb3JcbiAgICAvLyBjb3VsZCByZW1vdmUgb3VyIGV2ZW50IGxpc3RlbmVyIGlmIHdlIHVzZSBhIHJlZmVyZW50aWFsbHkgZXF1YWwgbGlzdGVuZXIuXG5cbiAgICBmdW5jdGlvbiBub29wKCkge31cbiAgfVxuXG59XG5Ub3VjaFNlbnNvci5hY3RpdmF0b3JzID0gW3tcbiAgZXZlbnROYW1lOiAnb25Ub3VjaFN0YXJ0JyxcbiAgaGFuZGxlcjogKF9yZWYsIF9yZWYyKSA9PiB7XG4gICAgbGV0IHtcbiAgICAgIG5hdGl2ZUV2ZW50OiBldmVudFxuICAgIH0gPSBfcmVmO1xuICAgIGxldCB7XG4gICAgICBvbkFjdGl2YXRpb25cbiAgICB9ID0gX3JlZjI7XG4gICAgY29uc3Qge1xuICAgICAgdG91Y2hlc1xuICAgIH0gPSBldmVudDtcblxuICAgIGlmICh0b3VjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBvbkFjdGl2YXRpb24gPT0gbnVsbCA/IHZvaWQgMCA6IG9uQWN0aXZhdGlvbih7XG4gICAgICBldmVudFxuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XTtcblxudmFyIEF1dG9TY3JvbGxBY3RpdmF0b3I7XG5cbihmdW5jdGlvbiAoQXV0b1Njcm9sbEFjdGl2YXRvcikge1xuICBBdXRvU2Nyb2xsQWN0aXZhdG9yW0F1dG9TY3JvbGxBY3RpdmF0b3JbXCJQb2ludGVyXCJdID0gMF0gPSBcIlBvaW50ZXJcIjtcbiAgQXV0b1Njcm9sbEFjdGl2YXRvcltBdXRvU2Nyb2xsQWN0aXZhdG9yW1wiRHJhZ2dhYmxlUmVjdFwiXSA9IDFdID0gXCJEcmFnZ2FibGVSZWN0XCI7XG59KShBdXRvU2Nyb2xsQWN0aXZhdG9yIHx8IChBdXRvU2Nyb2xsQWN0aXZhdG9yID0ge30pKTtcblxudmFyIFRyYXZlcnNhbE9yZGVyO1xuXG4oZnVuY3Rpb24gKFRyYXZlcnNhbE9yZGVyKSB7XG4gIFRyYXZlcnNhbE9yZGVyW1RyYXZlcnNhbE9yZGVyW1wiVHJlZU9yZGVyXCJdID0gMF0gPSBcIlRyZWVPcmRlclwiO1xuICBUcmF2ZXJzYWxPcmRlcltUcmF2ZXJzYWxPcmRlcltcIlJldmVyc2VkVHJlZU9yZGVyXCJdID0gMV0gPSBcIlJldmVyc2VkVHJlZU9yZGVyXCI7XG59KShUcmF2ZXJzYWxPcmRlciB8fCAoVHJhdmVyc2FsT3JkZXIgPSB7fSkpO1xuXG5mdW5jdGlvbiB1c2VBdXRvU2Nyb2xsZXIoX3JlZikge1xuICBsZXQge1xuICAgIGFjY2VsZXJhdGlvbixcbiAgICBhY3RpdmF0b3IgPSBBdXRvU2Nyb2xsQWN0aXZhdG9yLlBvaW50ZXIsXG4gICAgY2FuU2Nyb2xsLFxuICAgIGRyYWdnaW5nUmVjdCxcbiAgICBlbmFibGVkLFxuICAgIGludGVydmFsID0gNSxcbiAgICBvcmRlciA9IFRyYXZlcnNhbE9yZGVyLlRyZWVPcmRlcixcbiAgICBwb2ludGVyQ29vcmRpbmF0ZXMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cyxcbiAgICBkZWx0YSxcbiAgICB0aHJlc2hvbGRcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHNjcm9sbEludGVudCA9IHVzZVNjcm9sbEludGVudCh7XG4gICAgZGVsdGEsXG4gICAgZGlzYWJsZWQ6ICFlbmFibGVkXG4gIH0pO1xuICBjb25zdCBbc2V0QXV0b1Njcm9sbEludGVydmFsLCBjbGVhckF1dG9TY3JvbGxJbnRlcnZhbF0gPSB1c2VJbnRlcnZhbCgpO1xuICBjb25zdCBzY3JvbGxTcGVlZCA9IHVzZVJlZih7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH0pO1xuICBjb25zdCBzY3JvbGxEaXJlY3Rpb24gPSB1c2VSZWYoe1xuICAgIHg6IDAsXG4gICAgeTogMFxuICB9KTtcbiAgY29uc3QgcmVjdCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHN3aXRjaCAoYWN0aXZhdG9yKSB7XG4gICAgICBjYXNlIEF1dG9TY3JvbGxBY3RpdmF0b3IuUG9pbnRlcjpcbiAgICAgICAgcmV0dXJuIHBvaW50ZXJDb29yZGluYXRlcyA/IHtcbiAgICAgICAgICB0b3A6IHBvaW50ZXJDb29yZGluYXRlcy55LFxuICAgICAgICAgIGJvdHRvbTogcG9pbnRlckNvb3JkaW5hdGVzLnksXG4gICAgICAgICAgbGVmdDogcG9pbnRlckNvb3JkaW5hdGVzLngsXG4gICAgICAgICAgcmlnaHQ6IHBvaW50ZXJDb29yZGluYXRlcy54XG4gICAgICAgIH0gOiBudWxsO1xuXG4gICAgICBjYXNlIEF1dG9TY3JvbGxBY3RpdmF0b3IuRHJhZ2dhYmxlUmVjdDpcbiAgICAgICAgcmV0dXJuIGRyYWdnaW5nUmVjdDtcbiAgICB9XG4gIH0sIFthY3RpdmF0b3IsIGRyYWdnaW5nUmVjdCwgcG9pbnRlckNvb3JkaW5hdGVzXSk7XG4gIGNvbnN0IHNjcm9sbENvbnRhaW5lclJlZiA9IHVzZVJlZihudWxsKTtcbiAgY29uc3QgYXV0b1Njcm9sbCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjb25zdCBzY3JvbGxDb250YWluZXIgPSBzY3JvbGxDb250YWluZXJSZWYuY3VycmVudDtcblxuICAgIGlmICghc2Nyb2xsQ29udGFpbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2Nyb2xsTGVmdCA9IHNjcm9sbFNwZWVkLmN1cnJlbnQueCAqIHNjcm9sbERpcmVjdGlvbi5jdXJyZW50Lng7XG4gICAgY29uc3Qgc2Nyb2xsVG9wID0gc2Nyb2xsU3BlZWQuY3VycmVudC55ICogc2Nyb2xsRGlyZWN0aW9uLmN1cnJlbnQueTtcbiAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsQnkoc2Nyb2xsTGVmdCwgc2Nyb2xsVG9wKTtcbiAgfSwgW10pO1xuICBjb25zdCBzb3J0ZWRTY3JvbGxhYmxlQW5jZXN0b3JzID0gdXNlTWVtbygoKSA9PiBvcmRlciA9PT0gVHJhdmVyc2FsT3JkZXIuVHJlZU9yZGVyID8gWy4uLnNjcm9sbGFibGVBbmNlc3RvcnNdLnJldmVyc2UoKSA6IHNjcm9sbGFibGVBbmNlc3RvcnMsIFtvcmRlciwgc2Nyb2xsYWJsZUFuY2VzdG9yc10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCB8fCAhc2Nyb2xsYWJsZUFuY2VzdG9ycy5sZW5ndGggfHwgIXJlY3QpIHtcbiAgICAgIGNsZWFyQXV0b1Njcm9sbEludGVydmFsKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzY3JvbGxDb250YWluZXIgb2Ygc29ydGVkU2Nyb2xsYWJsZUFuY2VzdG9ycykge1xuICAgICAgaWYgKChjYW5TY3JvbGwgPT0gbnVsbCA/IHZvaWQgMCA6IGNhblNjcm9sbChzY3JvbGxDb250YWluZXIpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluZGV4ID0gc2Nyb2xsYWJsZUFuY2VzdG9ycy5pbmRleE9mKHNjcm9sbENvbnRhaW5lcik7XG4gICAgICBjb25zdCBzY3JvbGxDb250YWluZXJSZWN0ID0gc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAoIXNjcm9sbENvbnRhaW5lclJlY3QpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZGlyZWN0aW9uLFxuICAgICAgICBzcGVlZFxuICAgICAgfSA9IGdldFNjcm9sbERpcmVjdGlvbkFuZFNwZWVkKHNjcm9sbENvbnRhaW5lciwgc2Nyb2xsQ29udGFpbmVyUmVjdCwgcmVjdCwgYWNjZWxlcmF0aW9uLCB0aHJlc2hvbGQpO1xuXG4gICAgICBmb3IgKGNvbnN0IGF4aXMgb2YgWyd4JywgJ3knXSkge1xuICAgICAgICBpZiAoIXNjcm9sbEludGVudFtheGlzXVtkaXJlY3Rpb25bYXhpc11dKSB7XG4gICAgICAgICAgc3BlZWRbYXhpc10gPSAwO1xuICAgICAgICAgIGRpcmVjdGlvbltheGlzXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNwZWVkLnggPiAwIHx8IHNwZWVkLnkgPiAwKSB7XG4gICAgICAgIGNsZWFyQXV0b1Njcm9sbEludGVydmFsKCk7XG4gICAgICAgIHNjcm9sbENvbnRhaW5lclJlZi5jdXJyZW50ID0gc2Nyb2xsQ29udGFpbmVyO1xuICAgICAgICBzZXRBdXRvU2Nyb2xsSW50ZXJ2YWwoYXV0b1Njcm9sbCwgaW50ZXJ2YWwpO1xuICAgICAgICBzY3JvbGxTcGVlZC5jdXJyZW50ID0gc3BlZWQ7XG4gICAgICAgIHNjcm9sbERpcmVjdGlvbi5jdXJyZW50ID0gZGlyZWN0aW9uO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2Nyb2xsU3BlZWQuY3VycmVudCA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfTtcbiAgICBzY3JvbGxEaXJlY3Rpb24uY3VycmVudCA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfTtcbiAgICBjbGVhckF1dG9TY3JvbGxJbnRlcnZhbCgpO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFthY2NlbGVyYXRpb24sIGF1dG9TY3JvbGwsIGNhblNjcm9sbCwgY2xlYXJBdXRvU2Nyb2xsSW50ZXJ2YWwsIGVuYWJsZWQsIGludGVydmFsLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIEpTT04uc3RyaW5naWZ5KHJlY3QpLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIEpTT04uc3RyaW5naWZ5KHNjcm9sbEludGVudCksIHNldEF1dG9TY3JvbGxJbnRlcnZhbCwgc2Nyb2xsYWJsZUFuY2VzdG9ycywgc29ydGVkU2Nyb2xsYWJsZUFuY2VzdG9ycywgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgSlNPTi5zdHJpbmdpZnkodGhyZXNob2xkKV0pO1xufVxuY29uc3QgZGVmYXVsdFNjcm9sbEludGVudCA9IHtcbiAgeDoge1xuICAgIFtEaXJlY3Rpb24uQmFja3dhcmRdOiBmYWxzZSxcbiAgICBbRGlyZWN0aW9uLkZvcndhcmRdOiBmYWxzZVxuICB9LFxuICB5OiB7XG4gICAgW0RpcmVjdGlvbi5CYWNrd2FyZF06IGZhbHNlLFxuICAgIFtEaXJlY3Rpb24uRm9yd2FyZF06IGZhbHNlXG4gIH1cbn07XG5cbmZ1bmN0aW9uIHVzZVNjcm9sbEludGVudChfcmVmMikge1xuICBsZXQge1xuICAgIGRlbHRhLFxuICAgIGRpc2FibGVkXG4gIH0gPSBfcmVmMjtcbiAgY29uc3QgcHJldmlvdXNEZWx0YSA9IHVzZVByZXZpb3VzKGRlbHRhKTtcbiAgcmV0dXJuIHVzZUxhenlNZW1vKHByZXZpb3VzSW50ZW50ID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgfHwgIXByZXZpb3VzRGVsdGEgfHwgIXByZXZpb3VzSW50ZW50KSB7XG4gICAgICAvLyBSZXNldCBzY3JvbGwgaW50ZW50IHRyYWNraW5nIHdoZW4gYXV0by1zY3JvbGxpbmcgaXMgZGlzYWJsZWRcbiAgICAgIHJldHVybiBkZWZhdWx0U2Nyb2xsSW50ZW50O1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGlvbiA9IHtcbiAgICAgIHg6IE1hdGguc2lnbihkZWx0YS54IC0gcHJldmlvdXNEZWx0YS54KSxcbiAgICAgIHk6IE1hdGguc2lnbihkZWx0YS55IC0gcHJldmlvdXNEZWx0YS55KVxuICAgIH07IC8vIEtlZXAgdHJhY2sgb2YgdGhlIHVzZXIgaW50ZW50IHRvIHNjcm9sbCBpbiBlYWNoIGRpcmVjdGlvbiBmb3IgYm90aCBheGlzXG5cbiAgICByZXR1cm4ge1xuICAgICAgeDoge1xuICAgICAgICBbRGlyZWN0aW9uLkJhY2t3YXJkXTogcHJldmlvdXNJbnRlbnQueFtEaXJlY3Rpb24uQmFja3dhcmRdIHx8IGRpcmVjdGlvbi54ID09PSAtMSxcbiAgICAgICAgW0RpcmVjdGlvbi5Gb3J3YXJkXTogcHJldmlvdXNJbnRlbnQueFtEaXJlY3Rpb24uRm9yd2FyZF0gfHwgZGlyZWN0aW9uLnggPT09IDFcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIFtEaXJlY3Rpb24uQmFja3dhcmRdOiBwcmV2aW91c0ludGVudC55W0RpcmVjdGlvbi5CYWNrd2FyZF0gfHwgZGlyZWN0aW9uLnkgPT09IC0xLFxuICAgICAgICBbRGlyZWN0aW9uLkZvcndhcmRdOiBwcmV2aW91c0ludGVudC55W0RpcmVjdGlvbi5Gb3J3YXJkXSB8fCBkaXJlY3Rpb24ueSA9PT0gMVxuICAgICAgfVxuICAgIH07XG4gIH0sIFtkaXNhYmxlZCwgZGVsdGEsIHByZXZpb3VzRGVsdGFdKTtcbn1cblxuZnVuY3Rpb24gdXNlQ2FjaGVkTm9kZShkcmFnZ2FibGVOb2RlcywgaWQpIHtcbiAgY29uc3QgZHJhZ2dhYmxlTm9kZSA9IGlkICE9IG51bGwgPyBkcmFnZ2FibGVOb2Rlcy5nZXQoaWQpIDogdW5kZWZpbmVkO1xuICBjb25zdCBub2RlID0gZHJhZ2dhYmxlTm9kZSA/IGRyYWdnYWJsZU5vZGUubm9kZS5jdXJyZW50IDogbnVsbDtcbiAgcmV0dXJuIHVzZUxhenlNZW1vKGNhY2hlZE5vZGUgPT4ge1xuICAgIHZhciBfcmVmO1xuXG4gICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gLy8gSW4gc29tZSBjYXNlcywgdGhlIGRyYWdnYWJsZSBub2RlIGNhbiB1bm1vdW50IHdoaWxlIGRyYWdnaW5nXG4gICAgLy8gVGhpcyBpcyB0aGUgY2FzZSBmb3IgdmlydHVhbGl6ZWQgbGlzdHMuIEluIHRob3NlIHNpdHVhdGlvbnMsXG4gICAgLy8gd2UgZmFsbCBiYWNrIHRvIHRoZSBsYXN0IGtub3duIHZhbHVlIGZvciB0aGF0IG5vZGUuXG5cblxuICAgIHJldHVybiAoX3JlZiA9IG5vZGUgIT0gbnVsbCA/IG5vZGUgOiBjYWNoZWROb2RlKSAhPSBudWxsID8gX3JlZiA6IG51bGw7XG4gIH0sIFtub2RlLCBpZF0pO1xufVxuXG5mdW5jdGlvbiB1c2VDb21iaW5lQWN0aXZhdG9ycyhzZW5zb3JzLCBnZXRTeW50aGV0aWNIYW5kbGVyKSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHNlbnNvcnMucmVkdWNlKChhY2N1bXVsYXRvciwgc2Vuc29yKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgc2Vuc29yOiBTZW5zb3JcbiAgICB9ID0gc2Vuc29yO1xuICAgIGNvbnN0IHNlbnNvckFjdGl2YXRvcnMgPSBTZW5zb3IuYWN0aXZhdG9ycy5tYXAoYWN0aXZhdG9yID0+ICh7XG4gICAgICBldmVudE5hbWU6IGFjdGl2YXRvci5ldmVudE5hbWUsXG4gICAgICBoYW5kbGVyOiBnZXRTeW50aGV0aWNIYW5kbGVyKGFjdGl2YXRvci5oYW5kbGVyLCBzZW5zb3IpXG4gICAgfSkpO1xuICAgIHJldHVybiBbLi4uYWNjdW11bGF0b3IsIC4uLnNlbnNvckFjdGl2YXRvcnNdO1xuICB9LCBbXSksIFtzZW5zb3JzLCBnZXRTeW50aGV0aWNIYW5kbGVyXSk7XG59XG5cbnZhciBNZWFzdXJpbmdTdHJhdGVneTtcblxuKGZ1bmN0aW9uIChNZWFzdXJpbmdTdHJhdGVneSkge1xuICBNZWFzdXJpbmdTdHJhdGVneVtNZWFzdXJpbmdTdHJhdGVneVtcIkFsd2F5c1wiXSA9IDBdID0gXCJBbHdheXNcIjtcbiAgTWVhc3VyaW5nU3RyYXRlZ3lbTWVhc3VyaW5nU3RyYXRlZ3lbXCJCZWZvcmVEcmFnZ2luZ1wiXSA9IDFdID0gXCJCZWZvcmVEcmFnZ2luZ1wiO1xuICBNZWFzdXJpbmdTdHJhdGVneVtNZWFzdXJpbmdTdHJhdGVneVtcIldoaWxlRHJhZ2dpbmdcIl0gPSAyXSA9IFwiV2hpbGVEcmFnZ2luZ1wiO1xufSkoTWVhc3VyaW5nU3RyYXRlZ3kgfHwgKE1lYXN1cmluZ1N0cmF0ZWd5ID0ge30pKTtcblxudmFyIE1lYXN1cmluZ0ZyZXF1ZW5jeTtcblxuKGZ1bmN0aW9uIChNZWFzdXJpbmdGcmVxdWVuY3kpIHtcbiAgTWVhc3VyaW5nRnJlcXVlbmN5W1wiT3B0aW1pemVkXCJdID0gXCJvcHRpbWl6ZWRcIjtcbn0pKE1lYXN1cmluZ0ZyZXF1ZW5jeSB8fCAoTWVhc3VyaW5nRnJlcXVlbmN5ID0ge30pKTtcblxuY29uc3QgZGVmYXVsdFZhbHVlID0gLyojX19QVVJFX18qL25ldyBNYXAoKTtcbmZ1bmN0aW9uIHVzZURyb3BwYWJsZU1lYXN1cmluZyhjb250YWluZXJzLCBfcmVmKSB7XG4gIGxldCB7XG4gICAgZHJhZ2dpbmcsXG4gICAgZGVwZW5kZW5jaWVzLFxuICAgIGNvbmZpZ1xuICB9ID0gX3JlZjtcbiAgY29uc3QgW3F1ZXVlLCBzZXRRdWV1ZV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3Qge1xuICAgIGZyZXF1ZW5jeSxcbiAgICBtZWFzdXJlLFxuICAgIHN0cmF0ZWd5XG4gIH0gPSBjb25maWc7XG4gIGNvbnN0IGNvbnRhaW5lcnNSZWYgPSB1c2VSZWYoY29udGFpbmVycyk7XG4gIGNvbnN0IGRpc2FibGVkID0gaXNEaXNhYmxlZCgpO1xuICBjb25zdCBkaXNhYmxlZFJlZiA9IHVzZUxhdGVzdFZhbHVlKGRpc2FibGVkKTtcbiAgY29uc3QgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMgPSB1c2VDYWxsYmFjayhmdW5jdGlvbiAoaWRzKSB7XG4gICAgaWYgKGlkcyA9PT0gdm9pZCAwKSB7XG4gICAgICBpZHMgPSBbXTtcbiAgICB9XG5cbiAgICBpZiAoZGlzYWJsZWRSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFF1ZXVlKHZhbHVlID0+IHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gaWRzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWUuY29uY2F0KGlkcy5maWx0ZXIoaWQgPT4gIXZhbHVlLmluY2x1ZGVzKGlkKSkpO1xuICAgIH0pO1xuICB9LCBbZGlzYWJsZWRSZWZdKTtcbiAgY29uc3QgdGltZW91dElkID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBkcm9wcGFibGVSZWN0cyA9IHVzZUxhenlNZW1vKHByZXZpb3VzVmFsdWUgPT4ge1xuICAgIGlmIChkaXNhYmxlZCAmJiAhZHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKCFwcmV2aW91c1ZhbHVlIHx8IHByZXZpb3VzVmFsdWUgPT09IGRlZmF1bHRWYWx1ZSB8fCBjb250YWluZXJzUmVmLmN1cnJlbnQgIT09IGNvbnRhaW5lcnMgfHwgcXVldWUgIT0gbnVsbCkge1xuICAgICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICBmb3IgKGxldCBjb250YWluZXIgb2YgY29udGFpbmVycykge1xuICAgICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHF1ZXVlICYmIHF1ZXVlLmxlbmd0aCA+IDAgJiYgIXF1ZXVlLmluY2x1ZGVzKGNvbnRhaW5lci5pZCkgJiYgY29udGFpbmVyLnJlY3QuY3VycmVudCkge1xuICAgICAgICAgIC8vIFRoaXMgY29udGFpbmVyIGRvZXMgbm90IG5lZWQgdG8gYmUgcmUtbWVhc3VyZWRcbiAgICAgICAgICBtYXAuc2V0KGNvbnRhaW5lci5pZCwgY29udGFpbmVyLnJlY3QuY3VycmVudCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlID0gY29udGFpbmVyLm5vZGUuY3VycmVudDtcbiAgICAgICAgY29uc3QgcmVjdCA9IG5vZGUgPyBuZXcgUmVjdChtZWFzdXJlKG5vZGUpLCBub2RlKSA6IG51bGw7XG4gICAgICAgIGNvbnRhaW5lci5yZWN0LmN1cnJlbnQgPSByZWN0O1xuXG4gICAgICAgIGlmIChyZWN0KSB7XG4gICAgICAgICAgbWFwLnNldChjb250YWluZXIuaWQsIHJlY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpb3VzVmFsdWU7XG4gIH0sIFtjb250YWluZXJzLCBxdWV1ZSwgZHJhZ2dpbmcsIGRpc2FibGVkLCBtZWFzdXJlXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29udGFpbmVyc1JlZi5jdXJyZW50ID0gY29udGFpbmVycztcbiAgfSwgW2NvbnRhaW5lcnNdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycygpO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtkcmFnZ2luZywgZGlzYWJsZWRdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAocXVldWUgJiYgcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgc2V0UXVldWUobnVsbCk7XG4gICAgfVxuICB9LCAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW0pTT04uc3RyaW5naWZ5KHF1ZXVlKV0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCB0eXBlb2YgZnJlcXVlbmN5ICE9PSAnbnVtYmVyJyB8fCB0aW1lb3V0SWQuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRpbWVvdXRJZC5jdXJyZW50ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycygpO1xuICAgICAgdGltZW91dElkLmN1cnJlbnQgPSBudWxsO1xuICAgIH0sIGZyZXF1ZW5jeSk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2ZyZXF1ZW5jeSwgZGlzYWJsZWQsIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzLCAuLi5kZXBlbmRlbmNpZXNdKTtcbiAgcmV0dXJuIHtcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBtZWFzdXJpbmdTY2hlZHVsZWQ6IHF1ZXVlICE9IG51bGxcbiAgfTtcblxuICBmdW5jdGlvbiBpc0Rpc2FibGVkKCkge1xuICAgIHN3aXRjaCAoc3RyYXRlZ3kpIHtcbiAgICAgIGNhc2UgTWVhc3VyaW5nU3RyYXRlZ3kuQWx3YXlzOlxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGNhc2UgTWVhc3VyaW5nU3RyYXRlZ3kuQmVmb3JlRHJhZ2dpbmc6XG4gICAgICAgIHJldHVybiBkcmFnZ2luZztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICFkcmFnZ2luZztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdXNlSW5pdGlhbFZhbHVlKHZhbHVlLCBjb21wdXRlRm4pIHtcbiAgcmV0dXJuIHVzZUxhenlNZW1vKHByZXZpb3VzVmFsdWUgPT4ge1xuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChwcmV2aW91c1ZhbHVlKSB7XG4gICAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGNvbXB1dGVGbiA9PT0gJ2Z1bmN0aW9uJyA/IGNvbXB1dGVGbih2YWx1ZSkgOiB2YWx1ZTtcbiAgfSwgW2NvbXB1dGVGbiwgdmFsdWVdKTtcbn1cblxuZnVuY3Rpb24gdXNlSW5pdGlhbFJlY3Qobm9kZSwgbWVhc3VyZSkge1xuICByZXR1cm4gdXNlSW5pdGlhbFZhbHVlKG5vZGUsIG1lYXN1cmUpO1xufVxuXG4vKipcclxuICogUmV0dXJucyBhIG5ldyBNdXRhdGlvbk9ic2VydmVyIGluc3RhbmNlLlxyXG4gKiBJZiBgTXV0YXRpb25PYnNlcnZlcmAgaXMgdW5kZWZpbmVkIGluIHRoZSBleGVjdXRpb24gZW52aXJvbm1lbnQsIHJldHVybnMgYHVuZGVmaW5lZGAuXHJcbiAqL1xuXG5mdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBjYWxsYmFjayxcbiAgICBkaXNhYmxlZFxuICB9ID0gX3JlZjtcbiAgY29uc3QgaGFuZGxlTXV0YXRpb25zID0gdXNlRXZlbnQoY2FsbGJhY2spO1xuICBjb25zdCBtdXRhdGlvbk9ic2VydmVyID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkIHx8IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgTXV0YXRpb25PYnNlcnZlclxuICAgIH0gPSB3aW5kb3c7XG4gICAgcmV0dXJuIG5ldyBNdXRhdGlvbk9ic2VydmVyKGhhbmRsZU11dGF0aW9ucyk7XG4gIH0sIFtoYW5kbGVNdXRhdGlvbnMsIGRpc2FibGVkXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcmV0dXJuICgpID0+IG11dGF0aW9uT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICB9LCBbbXV0YXRpb25PYnNlcnZlcl0pO1xuICByZXR1cm4gbXV0YXRpb25PYnNlcnZlcjtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgYSBuZXcgUmVzaXplT2JzZXJ2ZXIgaW5zdGFuY2UgYm91bmQgdG8gdGhlIGBvblJlc2l6ZWAgY2FsbGJhY2suXHJcbiAqIElmIGBSZXNpemVPYnNlcnZlcmAgaXMgdW5kZWZpbmVkIGluIHRoZSBleGVjdXRpb24gZW52aXJvbm1lbnQsIHJldHVybnMgYHVuZGVmaW5lZGAuXHJcbiAqL1xuXG5mdW5jdGlvbiB1c2VSZXNpemVPYnNlcnZlcihfcmVmKSB7XG4gIGxldCB7XG4gICAgY2FsbGJhY2ssXG4gICAgZGlzYWJsZWRcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGhhbmRsZVJlc2l6ZSA9IHVzZUV2ZW50KGNhbGxiYWNrKTtcbiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgfHwgdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHdpbmRvdy5SZXNpemVPYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgUmVzaXplT2JzZXJ2ZXJcbiAgICB9ID0gd2luZG93O1xuICAgIHJldHVybiBuZXcgUmVzaXplT2JzZXJ2ZXIoaGFuZGxlUmVzaXplKTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbZGlzYWJsZWRdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICByZXR1cm4gKCkgPT4gcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgfSwgW3Jlc2l6ZU9ic2VydmVyXSk7XG4gIHJldHVybiByZXNpemVPYnNlcnZlcjtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdE1lYXN1cmUoZWxlbWVudCkge1xuICByZXR1cm4gbmV3IFJlY3QoZ2V0Q2xpZW50UmVjdChlbGVtZW50KSwgZWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIHVzZVJlY3QoZWxlbWVudCwgbWVhc3VyZSwgZmFsbGJhY2tSZWN0KSB7XG4gIGlmIChtZWFzdXJlID09PSB2b2lkIDApIHtcbiAgICBtZWFzdXJlID0gZGVmYXVsdE1lYXN1cmU7XG4gIH1cblxuICBjb25zdCBbcmVjdCwgc2V0UmVjdF0gPSB1c2VTdGF0ZShudWxsKTtcblxuICBmdW5jdGlvbiBtZWFzdXJlUmVjdCgpIHtcbiAgICBzZXRSZWN0KGN1cnJlbnRSZWN0ID0+IHtcbiAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGVsZW1lbnQuaXNDb25uZWN0ZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIHZhciBfcmVmO1xuXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBsYXN0IHJlY3Qgd2UgbWVhc3VyZWQgaWYgdGhlIGVsZW1lbnQgaXNcbiAgICAgICAgLy8gbm8gbG9uZ2VyIGNvbm5lY3RlZCB0byB0aGUgRE9NLlxuICAgICAgICByZXR1cm4gKF9yZWYgPSBjdXJyZW50UmVjdCAhPSBudWxsID8gY3VycmVudFJlY3QgOiBmYWxsYmFja1JlY3QpICE9IG51bGwgPyBfcmVmIDogbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3UmVjdCA9IG1lYXN1cmUoZWxlbWVudCk7XG5cbiAgICAgIGlmIChKU09OLnN0cmluZ2lmeShjdXJyZW50UmVjdCkgPT09IEpTT04uc3RyaW5naWZ5KG5ld1JlY3QpKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50UmVjdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ld1JlY3Q7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBtdXRhdGlvbk9ic2VydmVyID0gdXNlTXV0YXRpb25PYnNlcnZlcih7XG4gICAgY2FsbGJhY2socmVjb3Jkcykge1xuICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCByZWNvcmQgb2YgcmVjb3Jkcykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICB0YXJnZXRcbiAgICAgICAgfSA9IHJlY29yZDtcblxuICAgICAgICBpZiAodHlwZSA9PT0gJ2NoaWxkTGlzdCcgJiYgdGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgdGFyZ2V0LmNvbnRhaW5zKGVsZW1lbnQpKSB7XG4gICAgICAgICAgbWVhc3VyZVJlY3QoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICB9KTtcbiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSB1c2VSZXNpemVPYnNlcnZlcih7XG4gICAgY2FsbGJhY2s6IG1lYXN1cmVSZWN0XG4gIH0pO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBtZWFzdXJlUmVjdCgpO1xuXG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQpO1xuICAgICAgbXV0YXRpb25PYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIG11dGF0aW9uT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgfSwgW2VsZW1lbnRdKTtcbiAgcmV0dXJuIHJlY3Q7XG59XG5cbmZ1bmN0aW9uIHVzZVJlY3REZWx0YShyZWN0KSB7XG4gIGNvbnN0IGluaXRpYWxSZWN0ID0gdXNlSW5pdGlhbFZhbHVlKHJlY3QpO1xuICByZXR1cm4gZ2V0UmVjdERlbHRhKHJlY3QsIGluaXRpYWxSZWN0KTtcbn1cblxuY29uc3QgZGVmYXVsdFZhbHVlJDEgPSBbXTtcbmZ1bmN0aW9uIHVzZVNjcm9sbGFibGVBbmNlc3RvcnMobm9kZSkge1xuICBjb25zdCBwcmV2aW91c05vZGUgPSB1c2VSZWYobm9kZSk7XG4gIGNvbnN0IGFuY2VzdG9ycyA9IHVzZUxhenlNZW1vKHByZXZpb3VzVmFsdWUgPT4ge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZSQxO1xuICAgIH1cblxuICAgIGlmIChwcmV2aW91c1ZhbHVlICYmIHByZXZpb3VzVmFsdWUgIT09IGRlZmF1bHRWYWx1ZSQxICYmIG5vZGUgJiYgcHJldmlvdXNOb2RlLmN1cnJlbnQgJiYgbm9kZS5wYXJlbnROb2RlID09PSBwcmV2aW91c05vZGUuY3VycmVudC5wYXJlbnROb2RlKSB7XG4gICAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycyhub2RlKTtcbiAgfSwgW25vZGVdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBwcmV2aW91c05vZGUuY3VycmVudCA9IG5vZGU7XG4gIH0sIFtub2RlXSk7XG4gIHJldHVybiBhbmNlc3RvcnM7XG59XG5cbmZ1bmN0aW9uIHVzZVNjcm9sbE9mZnNldHMoZWxlbWVudHMpIHtcbiAgY29uc3QgW3Njcm9sbENvb3JkaW5hdGVzLCBzZXRTY3JvbGxDb29yZGluYXRlc10gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgcHJldkVsZW1lbnRzID0gdXNlUmVmKGVsZW1lbnRzKTsgLy8gVG8tZG86IFRocm90dGxlIHRoZSBoYW5kbGVTY3JvbGwgY2FsbGJhY2tcblxuICBjb25zdCBoYW5kbGVTY3JvbGwgPSB1c2VDYWxsYmFjayhldmVudCA9PiB7XG4gICAgY29uc3Qgc2Nyb2xsaW5nRWxlbWVudCA9IGdldFNjcm9sbGFibGVFbGVtZW50KGV2ZW50LnRhcmdldCk7XG5cbiAgICBpZiAoIXNjcm9sbGluZ0VsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRTY3JvbGxDb29yZGluYXRlcyhzY3JvbGxDb29yZGluYXRlcyA9PiB7XG4gICAgICBpZiAoIXNjcm9sbENvb3JkaW5hdGVzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBzY3JvbGxDb29yZGluYXRlcy5zZXQoc2Nyb2xsaW5nRWxlbWVudCwgZ2V0U2Nyb2xsQ29vcmRpbmF0ZXMoc2Nyb2xsaW5nRWxlbWVudCkpO1xuICAgICAgcmV0dXJuIG5ldyBNYXAoc2Nyb2xsQ29vcmRpbmF0ZXMpO1xuICAgIH0pO1xuICB9LCBbXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgcHJldmlvdXNFbGVtZW50cyA9IHByZXZFbGVtZW50cy5jdXJyZW50O1xuXG4gICAgaWYgKGVsZW1lbnRzICE9PSBwcmV2aW91c0VsZW1lbnRzKSB7XG4gICAgICBjbGVhbnVwKHByZXZpb3VzRWxlbWVudHMpO1xuICAgICAgY29uc3QgZW50cmllcyA9IGVsZW1lbnRzLm1hcChlbGVtZW50ID0+IHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsYWJsZUVsZW1lbnQgPSBnZXRTY3JvbGxhYmxlRWxlbWVudChlbGVtZW50KTtcblxuICAgICAgICBpZiAoc2Nyb2xsYWJsZUVsZW1lbnQpIHtcbiAgICAgICAgICBzY3JvbGxhYmxlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGwsIHtcbiAgICAgICAgICAgIHBhc3NpdmU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gW3Njcm9sbGFibGVFbGVtZW50LCBnZXRTY3JvbGxDb29yZGluYXRlcyhzY3JvbGxhYmxlRWxlbWVudCldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9KS5maWx0ZXIoZW50cnkgPT4gZW50cnkgIT0gbnVsbCk7XG4gICAgICBzZXRTY3JvbGxDb29yZGluYXRlcyhlbnRyaWVzLmxlbmd0aCA/IG5ldyBNYXAoZW50cmllcykgOiBudWxsKTtcbiAgICAgIHByZXZFbGVtZW50cy5jdXJyZW50ID0gZWxlbWVudHM7XG4gICAgfVxuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNsZWFudXAoZWxlbWVudHMpO1xuICAgICAgY2xlYW51cChwcmV2aW91c0VsZW1lbnRzKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY2xlYW51cChlbGVtZW50cykge1xuICAgICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsYWJsZUVsZW1lbnQgPSBnZXRTY3JvbGxhYmxlRWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgc2Nyb2xsYWJsZUVsZW1lbnQgPT0gbnVsbCA/IHZvaWQgMCA6IHNjcm9sbGFibGVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGhhbmRsZVNjcm9sbCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIFtoYW5kbGVTY3JvbGwsIGVsZW1lbnRzXSk7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gc2Nyb2xsQ29vcmRpbmF0ZXMgPyBBcnJheS5mcm9tKHNjcm9sbENvb3JkaW5hdGVzLnZhbHVlcygpKS5yZWR1Y2UoKGFjYywgY29vcmRpbmF0ZXMpID0+IGFkZChhY2MsIGNvb3JkaW5hdGVzKSwgZGVmYXVsdENvb3JkaW5hdGVzKSA6IGdldFNjcm9sbE9mZnNldHMoZWxlbWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0Q29vcmRpbmF0ZXM7XG4gIH0sIFtlbGVtZW50cywgc2Nyb2xsQ29vcmRpbmF0ZXNdKTtcbn1cblxuZnVuY3Rpb24gdXNlU2Nyb2xsT2Zmc2V0c0RlbHRhKHNjcm9sbE9mZnNldHMsIGRlcGVuZGVuY2llcykge1xuICBpZiAoZGVwZW5kZW5jaWVzID09PSB2b2lkIDApIHtcbiAgICBkZXBlbmRlbmNpZXMgPSBbXTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxTY3JvbGxPZmZzZXRzID0gdXNlUmVmKG51bGwpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQgPSBudWxsO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIGRlcGVuZGVuY2llcyk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgaGFzU2Nyb2xsT2Zmc2V0cyA9IHNjcm9sbE9mZnNldHMgIT09IGRlZmF1bHRDb29yZGluYXRlcztcblxuICAgIGlmIChoYXNTY3JvbGxPZmZzZXRzICYmICFpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50KSB7XG4gICAgICBpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50ID0gc2Nyb2xsT2Zmc2V0cztcbiAgICB9XG5cbiAgICBpZiAoIWhhc1Njcm9sbE9mZnNldHMgJiYgaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCkge1xuICAgICAgaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCA9IG51bGw7XG4gICAgfVxuICB9LCBbc2Nyb2xsT2Zmc2V0c10pO1xuICByZXR1cm4gaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCA/IHN1YnRyYWN0KHNjcm9sbE9mZnNldHMsIGluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQpIDogZGVmYXVsdENvb3JkaW5hdGVzO1xufVxuXG5mdW5jdGlvbiB1c2VTZW5zb3JTZXR1cChzZW5zb3JzKSB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFjYW5Vc2VET00pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0ZWFyZG93bkZucyA9IHNlbnNvcnMubWFwKF9yZWYgPT4ge1xuICAgICAgbGV0IHtcbiAgICAgICAgc2Vuc29yXG4gICAgICB9ID0gX3JlZjtcbiAgICAgIHJldHVybiBzZW5zb3Iuc2V0dXAgPT0gbnVsbCA/IHZvaWQgMCA6IHNlbnNvci5zZXR1cCgpO1xuICAgIH0pO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IHRlYXJkb3duIG9mIHRlYXJkb3duRm5zKSB7XG4gICAgICAgIHRlYXJkb3duID09IG51bGwgPyB2b2lkIDAgOiB0ZWFyZG93bigpO1xuICAgICAgfVxuICAgIH07XG4gIH0sIC8vIFRPLURPOiBTZW5zb3JzIGxlbmd0aCBjb3VsZCB0aGVvcmV0aWNhbGx5IGNoYW5nZSB3aGljaCB3b3VsZCBub3QgYmUgYSB2YWxpZCBkZXBlbmRlbmN5XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgc2Vuc29ycy5tYXAoX3JlZjIgPT4ge1xuICAgIGxldCB7XG4gICAgICBzZW5zb3JcbiAgICB9ID0gX3JlZjI7XG4gICAgcmV0dXJuIHNlbnNvcjtcbiAgfSkpO1xufVxuXG5mdW5jdGlvbiB1c2VTeW50aGV0aWNMaXN0ZW5lcnMobGlzdGVuZXJzLCBpZCkge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3RlbmVycy5yZWR1Y2UoKGFjYywgX3JlZikgPT4ge1xuICAgICAgbGV0IHtcbiAgICAgICAgZXZlbnROYW1lLFxuICAgICAgICBoYW5kbGVyXG4gICAgICB9ID0gX3JlZjtcblxuICAgICAgYWNjW2V2ZW50TmFtZV0gPSBldmVudCA9PiB7XG4gICAgICAgIGhhbmRsZXIoZXZlbnQsIGlkKTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuICB9LCBbbGlzdGVuZXJzLCBpZF0pO1xufVxuXG5mdW5jdGlvbiB1c2VXaW5kb3dSZWN0KGVsZW1lbnQpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gZWxlbWVudCA/IGdldFdpbmRvd0NsaWVudFJlY3QoZWxlbWVudCkgOiBudWxsLCBbZWxlbWVudF0pO1xufVxuXG5jb25zdCBkZWZhdWx0VmFsdWUkMiA9IFtdO1xuZnVuY3Rpb24gdXNlUmVjdHMoZWxlbWVudHMsIG1lYXN1cmUpIHtcbiAgaWYgKG1lYXN1cmUgPT09IHZvaWQgMCkge1xuICAgIG1lYXN1cmUgPSBnZXRDbGllbnRSZWN0O1xuICB9XG5cbiAgY29uc3QgW2ZpcnN0RWxlbWVudF0gPSBlbGVtZW50cztcbiAgY29uc3Qgd2luZG93UmVjdCA9IHVzZVdpbmRvd1JlY3QoZmlyc3RFbGVtZW50ID8gZ2V0V2luZG93KGZpcnN0RWxlbWVudCkgOiBudWxsKTtcbiAgY29uc3QgW3JlY3RzLCBzZXRSZWN0c10gPSB1c2VTdGF0ZShkZWZhdWx0VmFsdWUkMik7XG5cbiAgZnVuY3Rpb24gbWVhc3VyZVJlY3RzKCkge1xuICAgIHNldFJlY3RzKCgpID0+IHtcbiAgICAgIGlmICghZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWUkMjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGVsZW1lbnRzLm1hcChlbGVtZW50ID0+IGlzRG9jdW1lbnRTY3JvbGxpbmdFbGVtZW50KGVsZW1lbnQpID8gd2luZG93UmVjdCA6IG5ldyBSZWN0KG1lYXN1cmUoZWxlbWVudCksIGVsZW1lbnQpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyID0gdXNlUmVzaXplT2JzZXJ2ZXIoe1xuICAgIGNhbGxiYWNrOiBtZWFzdXJlUmVjdHNcbiAgfSk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgbWVhc3VyZVJlY3RzKCk7XG4gICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQpKTtcbiAgfSwgW2VsZW1lbnRzXSk7XG4gIHJldHVybiByZWN0cztcbn1cblxuZnVuY3Rpb24gZ2V0TWVhc3VyYWJsZU5vZGUobm9kZSkge1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIGNvbnN0IGZpcnN0Q2hpbGQgPSBub2RlLmNoaWxkcmVuWzBdO1xuICByZXR1cm4gaXNIVE1MRWxlbWVudChmaXJzdENoaWxkKSA/IGZpcnN0Q2hpbGQgOiBub2RlO1xufVxuXG5mdW5jdGlvbiB1c2VEcmFnT3ZlcmxheU1lYXN1cmluZyhfcmVmKSB7XG4gIGxldCB7XG4gICAgbWVhc3VyZVxuICB9ID0gX3JlZjtcbiAgY29uc3QgW3JlY3QsIHNldFJlY3RdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IGhhbmRsZVJlc2l6ZSA9IHVzZUNhbGxiYWNrKGVudHJpZXMgPT4ge1xuICAgIGZvciAoY29uc3Qge1xuICAgICAgdGFyZ2V0XG4gICAgfSBvZiBlbnRyaWVzKSB7XG4gICAgICBpZiAoaXNIVE1MRWxlbWVudCh0YXJnZXQpKSB7XG4gICAgICAgIHNldFJlY3QocmVjdCA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3UmVjdCA9IG1lYXN1cmUodGFyZ2V0KTtcbiAgICAgICAgICByZXR1cm4gcmVjdCA/IHsgLi4ucmVjdCxcbiAgICAgICAgICAgIHdpZHRoOiBuZXdSZWN0LndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBuZXdSZWN0LmhlaWdodFxuICAgICAgICAgIH0gOiBuZXdSZWN0O1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9LCBbbWVhc3VyZV0pO1xuICBjb25zdCByZXNpemVPYnNlcnZlciA9IHVzZVJlc2l6ZU9ic2VydmVyKHtcbiAgICBjYWxsYmFjazogaGFuZGxlUmVzaXplXG4gIH0pO1xuICBjb25zdCBoYW5kbGVOb2RlQ2hhbmdlID0gdXNlQ2FsbGJhY2soZWxlbWVudCA9PiB7XG4gICAgY29uc3Qgbm9kZSA9IGdldE1lYXN1cmFibGVOb2RlKGVsZW1lbnQpO1xuICAgIHJlc2l6ZU9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiByZXNpemVPYnNlcnZlci5kaXNjb25uZWN0KCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLm9ic2VydmUobm9kZSk7XG4gICAgfVxuXG4gICAgc2V0UmVjdChub2RlID8gbWVhc3VyZShub2RlKSA6IG51bGwpO1xuICB9LCBbbWVhc3VyZSwgcmVzaXplT2JzZXJ2ZXJdKTtcbiAgY29uc3QgW25vZGVSZWYsIHNldFJlZl0gPSB1c2VOb2RlUmVmKGhhbmRsZU5vZGVDaGFuZ2UpO1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiAoe1xuICAgIG5vZGVSZWYsXG4gICAgcmVjdCxcbiAgICBzZXRSZWZcbiAgfSksIFtyZWN0LCBub2RlUmVmLCBzZXRSZWZdKTtcbn1cblxuY29uc3QgZGVmYXVsdFNlbnNvcnMgPSBbe1xuICBzZW5zb3I6IFBvaW50ZXJTZW5zb3IsXG4gIG9wdGlvbnM6IHt9XG59LCB7XG4gIHNlbnNvcjogS2V5Ym9hcmRTZW5zb3IsXG4gIG9wdGlvbnM6IHt9XG59XTtcbmNvbnN0IGRlZmF1bHREYXRhID0ge1xuICBjdXJyZW50OiB7fVxufTtcbmNvbnN0IGRlZmF1bHRNZWFzdXJpbmdDb25maWd1cmF0aW9uID0ge1xuICBkcmFnZ2FibGU6IHtcbiAgICBtZWFzdXJlOiBnZXRUcmFuc2Zvcm1BZ25vc3RpY0NsaWVudFJlY3RcbiAgfSxcbiAgZHJvcHBhYmxlOiB7XG4gICAgbWVhc3VyZTogZ2V0VHJhbnNmb3JtQWdub3N0aWNDbGllbnRSZWN0LFxuICAgIHN0cmF0ZWd5OiBNZWFzdXJpbmdTdHJhdGVneS5XaGlsZURyYWdnaW5nLFxuICAgIGZyZXF1ZW5jeTogTWVhc3VyaW5nRnJlcXVlbmN5Lk9wdGltaXplZFxuICB9LFxuICBkcmFnT3ZlcmxheToge1xuICAgIG1lYXN1cmU6IGdldENsaWVudFJlY3RcbiAgfVxufTtcblxuY2xhc3MgRHJvcHBhYmxlQ29udGFpbmVyc01hcCBleHRlbmRzIE1hcCB7XG4gIGdldChpZCkge1xuICAgIHZhciBfc3VwZXIkZ2V0O1xuXG4gICAgcmV0dXJuIGlkICE9IG51bGwgPyAoX3N1cGVyJGdldCA9IHN1cGVyLmdldChpZCkpICE9IG51bGwgPyBfc3VwZXIkZ2V0IDogdW5kZWZpbmVkIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgdG9BcnJheSgpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLnZhbHVlcygpKTtcbiAgfVxuXG4gIGdldEVuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMudG9BcnJheSgpLmZpbHRlcihfcmVmID0+IHtcbiAgICAgIGxldCB7XG4gICAgICAgIGRpc2FibGVkXG4gICAgICB9ID0gX3JlZjtcbiAgICAgIHJldHVybiAhZGlzYWJsZWQ7XG4gICAgfSk7XG4gIH1cblxuICBnZXROb2RlRm9yKGlkKSB7XG4gICAgdmFyIF90aGlzJGdldCRub2RlJGN1cnJlbiwgX3RoaXMkZ2V0O1xuXG4gICAgcmV0dXJuIChfdGhpcyRnZXQkbm9kZSRjdXJyZW4gPSAoX3RoaXMkZ2V0ID0gdGhpcy5nZXQoaWQpKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkZ2V0Lm5vZGUuY3VycmVudCkgIT0gbnVsbCA/IF90aGlzJGdldCRub2RlJGN1cnJlbiA6IHVuZGVmaW5lZDtcbiAgfVxuXG59XG5cbmNvbnN0IGRlZmF1bHRQdWJsaWNDb250ZXh0ID0ge1xuICBhY3RpdmF0b3JFdmVudDogbnVsbCxcbiAgYWN0aXZlOiBudWxsLFxuICBhY3RpdmVOb2RlOiBudWxsLFxuICBhY3RpdmVOb2RlUmVjdDogbnVsbCxcbiAgY29sbGlzaW9uczogbnVsbCxcbiAgY29udGFpbmVyTm9kZVJlY3Q6IG51bGwsXG4gIGRyYWdnYWJsZU5vZGVzOiAvKiNfX1BVUkVfXyovbmV3IE1hcCgpLFxuICBkcm9wcGFibGVSZWN0czogLyojX19QVVJFX18qL25ldyBNYXAoKSxcbiAgZHJvcHBhYmxlQ29udGFpbmVyczogLyojX19QVVJFX18qL25ldyBEcm9wcGFibGVDb250YWluZXJzTWFwKCksXG4gIG92ZXI6IG51bGwsXG4gIGRyYWdPdmVybGF5OiB7XG4gICAgbm9kZVJlZjoge1xuICAgICAgY3VycmVudDogbnVsbFxuICAgIH0sXG4gICAgcmVjdDogbnVsbCxcbiAgICBzZXRSZWY6IG5vb3BcbiAgfSxcbiAgc2Nyb2xsYWJsZUFuY2VzdG9yczogW10sXG4gIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzOiBbXSxcbiAgbWVhc3VyaW5nQ29uZmlndXJhdGlvbjogZGVmYXVsdE1lYXN1cmluZ0NvbmZpZ3VyYXRpb24sXG4gIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzOiBub29wLFxuICB3aW5kb3dSZWN0OiBudWxsLFxuICBtZWFzdXJpbmdTY2hlZHVsZWQ6IGZhbHNlXG59O1xuY29uc3QgZGVmYXVsdEludGVybmFsQ29udGV4dCA9IHtcbiAgYWN0aXZhdG9yRXZlbnQ6IG51bGwsXG4gIGFjdGl2YXRvcnM6IFtdLFxuICBhY3RpdmU6IG51bGwsXG4gIGFjdGl2ZU5vZGVSZWN0OiBudWxsLFxuICBhcmlhRGVzY3JpYmVkQnlJZDoge1xuICAgIGRyYWdnYWJsZTogJydcbiAgfSxcbiAgZGlzcGF0Y2g6IG5vb3AsXG4gIGRyYWdnYWJsZU5vZGVzOiAvKiNfX1BVUkVfXyovbmV3IE1hcCgpLFxuICBvdmVyOiBudWxsLFxuICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyczogbm9vcFxufTtcbmNvbnN0IEludGVybmFsQ29udGV4dCA9IC8qI19fUFVSRV9fKi9jcmVhdGVDb250ZXh0KGRlZmF1bHRJbnRlcm5hbENvbnRleHQpO1xuY29uc3QgUHVibGljQ29udGV4dCA9IC8qI19fUFVSRV9fKi9jcmVhdGVDb250ZXh0KGRlZmF1bHRQdWJsaWNDb250ZXh0KTtcblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFN0YXRlKCkge1xuICByZXR1cm4ge1xuICAgIGRyYWdnYWJsZToge1xuICAgICAgYWN0aXZlOiBudWxsLFxuICAgICAgaW5pdGlhbENvb3JkaW5hdGVzOiB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICAgIH0sXG4gICAgICBub2RlczogbmV3IE1hcCgpLFxuICAgICAgdHJhbnNsYXRlOiB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICAgIH1cbiAgICB9LFxuICAgIGRyb3BwYWJsZToge1xuICAgICAgY29udGFpbmVyczogbmV3IERyb3BwYWJsZUNvbnRhaW5lcnNNYXAoKVxuICAgIH1cbiAgfTtcbn1cbmZ1bmN0aW9uIHJlZHVjZXIoc3RhdGUsIGFjdGlvbikge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSBBY3Rpb24uRHJhZ1N0YXJ0OlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsXG4gICAgICAgIGRyYWdnYWJsZTogeyAuLi5zdGF0ZS5kcmFnZ2FibGUsXG4gICAgICAgICAgaW5pdGlhbENvb3JkaW5hdGVzOiBhY3Rpb24uaW5pdGlhbENvb3JkaW5hdGVzLFxuICAgICAgICAgIGFjdGl2ZTogYWN0aW9uLmFjdGl2ZVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgY2FzZSBBY3Rpb24uRHJhZ01vdmU6XG4gICAgICBpZiAoc3RhdGUuZHJhZ2dhYmxlLmFjdGl2ZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsXG4gICAgICAgIGRyYWdnYWJsZTogeyAuLi5zdGF0ZS5kcmFnZ2FibGUsXG4gICAgICAgICAgdHJhbnNsYXRlOiB7XG4gICAgICAgICAgICB4OiBhY3Rpb24uY29vcmRpbmF0ZXMueCAtIHN0YXRlLmRyYWdnYWJsZS5pbml0aWFsQ29vcmRpbmF0ZXMueCxcbiAgICAgICAgICAgIHk6IGFjdGlvbi5jb29yZGluYXRlcy55IC0gc3RhdGUuZHJhZ2dhYmxlLmluaXRpYWxDb29yZGluYXRlcy55XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgY2FzZSBBY3Rpb24uRHJhZ0VuZDpcbiAgICBjYXNlIEFjdGlvbi5EcmFnQ2FuY2VsOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsXG4gICAgICAgIGRyYWdnYWJsZTogeyAuLi5zdGF0ZS5kcmFnZ2FibGUsXG4gICAgICAgICAgYWN0aXZlOiBudWxsLFxuICAgICAgICAgIGluaXRpYWxDb29yZGluYXRlczoge1xuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRyYW5zbGF0ZToge1xuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICBjYXNlIEFjdGlvbi5SZWdpc3RlckRyb3BwYWJsZTpcbiAgICAgIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGVsZW1lbnRcbiAgICAgICAgfSA9IGFjdGlvbjtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGlkXG4gICAgICAgIH0gPSBlbGVtZW50O1xuICAgICAgICBjb25zdCBjb250YWluZXJzID0gbmV3IERyb3BwYWJsZUNvbnRhaW5lcnNNYXAoc3RhdGUuZHJvcHBhYmxlLmNvbnRhaW5lcnMpO1xuICAgICAgICBjb250YWluZXJzLnNldChpZCwgZWxlbWVudCk7XG4gICAgICAgIHJldHVybiB7IC4uLnN0YXRlLFxuICAgICAgICAgIGRyb3BwYWJsZTogeyAuLi5zdGF0ZS5kcm9wcGFibGUsXG4gICAgICAgICAgICBjb250YWluZXJzXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgY2FzZSBBY3Rpb24uU2V0RHJvcHBhYmxlRGlzYWJsZWQ6XG4gICAgICB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgZGlzYWJsZWRcbiAgICAgICAgfSA9IGFjdGlvbjtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHN0YXRlLmRyb3BwYWJsZS5jb250YWluZXJzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFlbGVtZW50IHx8IGtleSAhPT0gZWxlbWVudC5rZXkpIHtcbiAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250YWluZXJzID0gbmV3IERyb3BwYWJsZUNvbnRhaW5lcnNNYXAoc3RhdGUuZHJvcHBhYmxlLmNvbnRhaW5lcnMpO1xuICAgICAgICBjb250YWluZXJzLnNldChpZCwgeyAuLi5lbGVtZW50LFxuICAgICAgICAgIGRpc2FibGVkXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4geyAuLi5zdGF0ZSxcbiAgICAgICAgICBkcm9wcGFibGU6IHsgLi4uc3RhdGUuZHJvcHBhYmxlLFxuICAgICAgICAgICAgY29udGFpbmVyc1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgIGNhc2UgQWN0aW9uLlVucmVnaXN0ZXJEcm9wcGFibGU6XG4gICAgICB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBrZXlcbiAgICAgICAgfSA9IGFjdGlvbjtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHN0YXRlLmRyb3BwYWJsZS5jb250YWluZXJzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFlbGVtZW50IHx8IGtleSAhPT0gZWxlbWVudC5rZXkpIHtcbiAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250YWluZXJzID0gbmV3IERyb3BwYWJsZUNvbnRhaW5lcnNNYXAoc3RhdGUuZHJvcHBhYmxlLmNvbnRhaW5lcnMpO1xuICAgICAgICBjb250YWluZXJzLmRlbGV0ZShpZCk7XG4gICAgICAgIHJldHVybiB7IC4uLnN0YXRlLFxuICAgICAgICAgIGRyb3BwYWJsZTogeyAuLi5zdGF0ZS5kcm9wcGFibGUsXG4gICAgICAgICAgICBjb250YWluZXJzXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgZGVmYXVsdDpcbiAgICAgIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIFJlc3RvcmVGb2N1cyhfcmVmKSB7XG4gIGxldCB7XG4gICAgZGlzYWJsZWRcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgZHJhZ2dhYmxlTm9kZXNcbiAgfSA9IHVzZUNvbnRleHQoSW50ZXJuYWxDb250ZXh0KTtcbiAgY29uc3QgcHJldmlvdXNBY3RpdmF0b3JFdmVudCA9IHVzZVByZXZpb3VzKGFjdGl2YXRvckV2ZW50KTtcbiAgY29uc3QgcHJldmlvdXNBY3RpdmVJZCA9IHVzZVByZXZpb3VzKGFjdGl2ZSA9PSBudWxsID8gdm9pZCAwIDogYWN0aXZlLmlkKTsgLy8gUmVzdG9yZSBrZXlib2FyZCBmb2N1cyBvbiB0aGUgYWN0aXZhdG9yIG5vZGVcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghYWN0aXZhdG9yRXZlbnQgJiYgcHJldmlvdXNBY3RpdmF0b3JFdmVudCAmJiBwcmV2aW91c0FjdGl2ZUlkICE9IG51bGwpIHtcbiAgICAgIGlmICghaXNLZXlib2FyZEV2ZW50KHByZXZpb3VzQWN0aXZhdG9yRXZlbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IHByZXZpb3VzQWN0aXZhdG9yRXZlbnQudGFyZ2V0KSB7XG4gICAgICAgIC8vIE5vIG5lZWQgdG8gcmVzdG9yZSBmb2N1c1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRyYWdnYWJsZU5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQocHJldmlvdXNBY3RpdmVJZCk7XG5cbiAgICAgIGlmICghZHJhZ2dhYmxlTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgYWN0aXZhdG9yTm9kZSxcbiAgICAgICAgbm9kZVxuICAgICAgfSA9IGRyYWdnYWJsZU5vZGU7XG5cbiAgICAgIGlmICghYWN0aXZhdG9yTm9kZS5jdXJyZW50ICYmICFub2RlLmN1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgW2FjdGl2YXRvck5vZGUuY3VycmVudCwgbm9kZS5jdXJyZW50XSkge1xuICAgICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZm9jdXNhYmxlTm9kZSA9IGZpbmRGaXJzdEZvY3VzYWJsZU5vZGUoZWxlbWVudCk7XG5cbiAgICAgICAgICBpZiAoZm9jdXNhYmxlTm9kZSkge1xuICAgICAgICAgICAgZm9jdXNhYmxlTm9kZS5mb2N1cygpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIFthY3RpdmF0b3JFdmVudCwgZGlzYWJsZWQsIGRyYWdnYWJsZU5vZGVzLCBwcmV2aW91c0FjdGl2ZUlkLCBwcmV2aW91c0FjdGl2YXRvckV2ZW50XSk7XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBhcHBseU1vZGlmaWVycyhtb2RpZmllcnMsIF9yZWYpIHtcbiAgbGV0IHtcbiAgICB0cmFuc2Zvcm0sXG4gICAgLi4uYXJnc1xuICB9ID0gX3JlZjtcbiAgcmV0dXJuIG1vZGlmaWVycyAhPSBudWxsICYmIG1vZGlmaWVycy5sZW5ndGggPyBtb2RpZmllcnMucmVkdWNlKChhY2N1bXVsYXRvciwgbW9kaWZpZXIpID0+IHtcbiAgICByZXR1cm4gbW9kaWZpZXIoe1xuICAgICAgdHJhbnNmb3JtOiBhY2N1bXVsYXRvcixcbiAgICAgIC4uLmFyZ3NcbiAgICB9KTtcbiAgfSwgdHJhbnNmb3JtKSA6IHRyYW5zZm9ybTtcbn1cblxuZnVuY3Rpb24gdXNlTWVhc3VyaW5nQ29uZmlndXJhdGlvbihjb25maWcpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gKHtcbiAgICBkcmFnZ2FibGU6IHsgLi4uZGVmYXVsdE1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ2dhYmxlLFxuICAgICAgLi4uKGNvbmZpZyA9PSBudWxsID8gdm9pZCAwIDogY29uZmlnLmRyYWdnYWJsZSlcbiAgICB9LFxuICAgIGRyb3BwYWJsZTogeyAuLi5kZWZhdWx0TWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcm9wcGFibGUsXG4gICAgICAuLi4oY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcuZHJvcHBhYmxlKVxuICAgIH0sXG4gICAgZHJhZ092ZXJsYXk6IHsgLi4uZGVmYXVsdE1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ092ZXJsYXksXG4gICAgICAuLi4oY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcuZHJhZ092ZXJsYXkpXG4gICAgfVxuICB9KSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcuZHJhZ2dhYmxlLCBjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5kcm9wcGFibGUsIGNvbmZpZyA9PSBudWxsID8gdm9pZCAwIDogY29uZmlnLmRyYWdPdmVybGF5XSk7XG59XG5cbmZ1bmN0aW9uIHVzZUxheW91dFNoaWZ0U2Nyb2xsQ29tcGVuc2F0aW9uKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBhY3RpdmVOb2RlLFxuICAgIG1lYXN1cmUsXG4gICAgaW5pdGlhbFJlY3QsXG4gICAgY29uZmlnID0gdHJ1ZVxuICB9ID0gX3JlZjtcbiAgY29uc3QgaW5pdGlhbGl6ZWQgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCB7XG4gICAgeCxcbiAgICB5XG4gIH0gPSB0eXBlb2YgY29uZmlnID09PSAnYm9vbGVhbicgPyB7XG4gICAgeDogY29uZmlnLFxuICAgIHk6IGNvbmZpZ1xuICB9IDogY29uZmlnO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBkaXNhYmxlZCA9ICF4ICYmICF5O1xuXG4gICAgaWYgKGRpc2FibGVkIHx8ICFhY3RpdmVOb2RlKSB7XG4gICAgICBpbml0aWFsaXplZC5jdXJyZW50ID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGluaXRpYWxpemVkLmN1cnJlbnQgfHwgIWluaXRpYWxSZWN0KSB7XG4gICAgICAvLyBSZXR1cm4gZWFybHkgaWYgbGF5b3V0IHNoaWZ0IHNjcm9sbCBjb21wZW5zYXRpb24gd2FzIGFscmVhZHkgYXR0ZW1wdGVkXG4gICAgICAvLyBvciBpZiB0aGVyZSBpcyBubyBpbml0aWFsUmVjdCB0byBjb21wYXJlIHRvLlxuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gR2V0IHRoZSBtb3N0IHVwIHRvIGRhdGUgbm9kZSByZWYgZm9yIHRoZSBhY3RpdmUgZHJhZ2dhYmxlXG5cblxuICAgIGNvbnN0IG5vZGUgPSBhY3RpdmVOb2RlID09IG51bGwgPyB2b2lkIDAgOiBhY3RpdmVOb2RlLm5vZGUuY3VycmVudDtcblxuICAgIGlmICghbm9kZSB8fCBub2RlLmlzQ29ubmVjdGVkID09PSBmYWxzZSkge1xuICAgICAgLy8gUmV0dXJuIGVhcmx5IGlmIHRoZXJlIGlzIG5vIGF0dGFjaGVkIG5vZGUgcmVmIG9yIGlmIHRoZSBub2RlIGlzXG4gICAgICAvLyBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgZG9jdW1lbnQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVjdCA9IG1lYXN1cmUobm9kZSk7XG4gICAgY29uc3QgcmVjdERlbHRhID0gZ2V0UmVjdERlbHRhKHJlY3QsIGluaXRpYWxSZWN0KTtcblxuICAgIGlmICgheCkge1xuICAgICAgcmVjdERlbHRhLnggPSAwO1xuICAgIH1cblxuICAgIGlmICgheSkge1xuICAgICAgcmVjdERlbHRhLnkgPSAwO1xuICAgIH0gLy8gT25seSBwZXJmb3JtIGxheW91dCBzaGlmdCBzY3JvbGwgY29tcGVuc2F0aW9uIG9uY2VcblxuXG4gICAgaW5pdGlhbGl6ZWQuY3VycmVudCA9IHRydWU7XG5cbiAgICBpZiAoTWF0aC5hYnMocmVjdERlbHRhLngpID4gMCB8fCBNYXRoLmFicyhyZWN0RGVsdGEueSkgPiAwKSB7XG4gICAgICBjb25zdCBmaXJzdFNjcm9sbGFibGVBbmNlc3RvciA9IGdldEZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yKG5vZGUpO1xuXG4gICAgICBpZiAoZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IpIHtcbiAgICAgICAgZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3Iuc2Nyb2xsQnkoe1xuICAgICAgICAgIHRvcDogcmVjdERlbHRhLnksXG4gICAgICAgICAgbGVmdDogcmVjdERlbHRhLnhcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LCBbYWN0aXZlTm9kZSwgeCwgeSwgaW5pdGlhbFJlY3QsIG1lYXN1cmVdKTtcbn1cblxuY29uc3QgQWN0aXZlRHJhZ2dhYmxlQ29udGV4dCA9IC8qI19fUFVSRV9fKi9jcmVhdGVDb250ZXh0KHsgLi4uZGVmYXVsdENvb3JkaW5hdGVzLFxuICBzY2FsZVg6IDEsXG4gIHNjYWxlWTogMVxufSk7XG52YXIgU3RhdHVzO1xuXG4oZnVuY3Rpb24gKFN0YXR1cykge1xuICBTdGF0dXNbU3RhdHVzW1wiVW5pbml0aWFsaXplZFwiXSA9IDBdID0gXCJVbmluaXRpYWxpemVkXCI7XG4gIFN0YXR1c1tTdGF0dXNbXCJJbml0aWFsaXppbmdcIl0gPSAxXSA9IFwiSW5pdGlhbGl6aW5nXCI7XG4gIFN0YXR1c1tTdGF0dXNbXCJJbml0aWFsaXplZFwiXSA9IDJdID0gXCJJbml0aWFsaXplZFwiO1xufSkoU3RhdHVzIHx8IChTdGF0dXMgPSB7fSkpO1xuXG5jb25zdCBEbmRDb250ZXh0ID0gLyojX19QVVJFX18qL21lbW8oZnVuY3Rpb24gRG5kQ29udGV4dChfcmVmKSB7XG4gIHZhciBfc2Vuc29yQ29udGV4dCRjdXJyZW4sIF9kcmFnT3ZlcmxheSRub2RlUmVmJCwgX2RyYWdPdmVybGF5JHJlY3QsIF9vdmVyJHJlY3Q7XG5cbiAgbGV0IHtcbiAgICBpZCxcbiAgICBhY2Nlc3NpYmlsaXR5LFxuICAgIGF1dG9TY3JvbGwgPSB0cnVlLFxuICAgIGNoaWxkcmVuLFxuICAgIHNlbnNvcnMgPSBkZWZhdWx0U2Vuc29ycyxcbiAgICBjb2xsaXNpb25EZXRlY3Rpb24gPSByZWN0SW50ZXJzZWN0aW9uLFxuICAgIG1lYXN1cmluZyxcbiAgICBtb2RpZmllcnMsXG4gICAgLi4ucHJvcHNcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHN0b3JlID0gdXNlUmVkdWNlcihyZWR1Y2VyLCB1bmRlZmluZWQsIGdldEluaXRpYWxTdGF0ZSk7XG4gIGNvbnN0IFtzdGF0ZSwgZGlzcGF0Y2hdID0gc3RvcmU7XG4gIGNvbnN0IFtkaXNwYXRjaE1vbml0b3JFdmVudCwgcmVnaXN0ZXJNb25pdG9yTGlzdGVuZXJdID0gdXNlRG5kTW9uaXRvclByb3ZpZGVyKCk7XG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZShTdGF0dXMuVW5pbml0aWFsaXplZCk7XG4gIGNvbnN0IGlzSW5pdGlhbGl6ZWQgPSBzdGF0dXMgPT09IFN0YXR1cy5Jbml0aWFsaXplZDtcbiAgY29uc3Qge1xuICAgIGRyYWdnYWJsZToge1xuICAgICAgYWN0aXZlOiBhY3RpdmVJZCxcbiAgICAgIG5vZGVzOiBkcmFnZ2FibGVOb2RlcyxcbiAgICAgIHRyYW5zbGF0ZVxuICAgIH0sXG4gICAgZHJvcHBhYmxlOiB7XG4gICAgICBjb250YWluZXJzOiBkcm9wcGFibGVDb250YWluZXJzXG4gICAgfVxuICB9ID0gc3RhdGU7XG4gIGNvbnN0IG5vZGUgPSBhY3RpdmVJZCAhPSBudWxsID8gZHJhZ2dhYmxlTm9kZXMuZ2V0KGFjdGl2ZUlkKSA6IG51bGw7XG4gIGNvbnN0IGFjdGl2ZVJlY3RzID0gdXNlUmVmKHtcbiAgICBpbml0aWFsOiBudWxsLFxuICAgIHRyYW5zbGF0ZWQ6IG51bGxcbiAgfSk7XG4gIGNvbnN0IGFjdGl2ZSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHZhciBfbm9kZSRkYXRhO1xuXG4gICAgcmV0dXJuIGFjdGl2ZUlkICE9IG51bGwgPyB7XG4gICAgICBpZDogYWN0aXZlSWQsXG4gICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgYWN0aXZlIG5vZGUgdG8gdW5tb3VudCB3aGlsZSBkcmFnZ2luZ1xuICAgICAgZGF0YTogKF9ub2RlJGRhdGEgPSBub2RlID09IG51bGwgPyB2b2lkIDAgOiBub2RlLmRhdGEpICE9IG51bGwgPyBfbm9kZSRkYXRhIDogZGVmYXVsdERhdGEsXG4gICAgICByZWN0OiBhY3RpdmVSZWN0c1xuICAgIH0gOiBudWxsO1xuICB9LCBbYWN0aXZlSWQsIG5vZGVdKTtcbiAgY29uc3QgYWN0aXZlUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBbYWN0aXZlU2Vuc29yLCBzZXRBY3RpdmVTZW5zb3JdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFthY3RpdmF0b3JFdmVudCwgc2V0QWN0aXZhdG9yRXZlbnRdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IGxhdGVzdFByb3BzID0gdXNlTGF0ZXN0VmFsdWUocHJvcHMsIE9iamVjdC52YWx1ZXMocHJvcHMpKTtcbiAgY29uc3QgZHJhZ2dhYmxlRGVzY3JpYmVkQnlJZCA9IHVzZVVuaXF1ZUlkKFwiRG5kRGVzY3JpYmVkQnlcIiwgaWQpO1xuICBjb25zdCBlbmFibGVkRHJvcHBhYmxlQ29udGFpbmVycyA9IHVzZU1lbW8oKCkgPT4gZHJvcHBhYmxlQ29udGFpbmVycy5nZXRFbmFibGVkKCksIFtkcm9wcGFibGVDb250YWluZXJzXSk7XG4gIGNvbnN0IG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24gPSB1c2VNZWFzdXJpbmdDb25maWd1cmF0aW9uKG1lYXN1cmluZyk7XG4gIGNvbnN0IHtcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBtZWFzdXJpbmdTY2hlZHVsZWRcbiAgfSA9IHVzZURyb3BwYWJsZU1lYXN1cmluZyhlbmFibGVkRHJvcHBhYmxlQ29udGFpbmVycywge1xuICAgIGRyYWdnaW5nOiBpc0luaXRpYWxpemVkLFxuICAgIGRlcGVuZGVuY2llczogW3RyYW5zbGF0ZS54LCB0cmFuc2xhdGUueV0sXG4gICAgY29uZmlnOiBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyb3BwYWJsZVxuICB9KTtcbiAgY29uc3QgYWN0aXZlTm9kZSA9IHVzZUNhY2hlZE5vZGUoZHJhZ2dhYmxlTm9kZXMsIGFjdGl2ZUlkKTtcbiAgY29uc3QgYWN0aXZhdGlvbkNvb3JkaW5hdGVzID0gdXNlTWVtbygoKSA9PiBhY3RpdmF0b3JFdmVudCA/IGdldEV2ZW50Q29vcmRpbmF0ZXMoYWN0aXZhdG9yRXZlbnQpIDogbnVsbCwgW2FjdGl2YXRvckV2ZW50XSk7XG4gIGNvbnN0IGF1dG9TY3JvbGxPcHRpb25zID0gZ2V0QXV0b1Njcm9sbGVyT3B0aW9ucygpO1xuICBjb25zdCBpbml0aWFsQWN0aXZlTm9kZVJlY3QgPSB1c2VJbml0aWFsUmVjdChhY3RpdmVOb2RlLCBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdnYWJsZS5tZWFzdXJlKTtcbiAgdXNlTGF5b3V0U2hpZnRTY3JvbGxDb21wZW5zYXRpb24oe1xuICAgIGFjdGl2ZU5vZGU6IGFjdGl2ZUlkICE9IG51bGwgPyBkcmFnZ2FibGVOb2Rlcy5nZXQoYWN0aXZlSWQpIDogbnVsbCxcbiAgICBjb25maWc6IGF1dG9TY3JvbGxPcHRpb25zLmxheW91dFNoaWZ0Q29tcGVuc2F0aW9uLFxuICAgIGluaXRpYWxSZWN0OiBpbml0aWFsQWN0aXZlTm9kZVJlY3QsXG4gICAgbWVhc3VyZTogbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnZ2FibGUubWVhc3VyZVxuICB9KTtcbiAgY29uc3QgYWN0aXZlTm9kZVJlY3QgPSB1c2VSZWN0KGFjdGl2ZU5vZGUsIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ2dhYmxlLm1lYXN1cmUsIGluaXRpYWxBY3RpdmVOb2RlUmVjdCk7XG4gIGNvbnN0IGNvbnRhaW5lck5vZGVSZWN0ID0gdXNlUmVjdChhY3RpdmVOb2RlID8gYWN0aXZlTm9kZS5wYXJlbnRFbGVtZW50IDogbnVsbCk7XG4gIGNvbnN0IHNlbnNvckNvbnRleHQgPSB1c2VSZWYoe1xuICAgIGFjdGl2YXRvckV2ZW50OiBudWxsLFxuICAgIGFjdGl2ZTogbnVsbCxcbiAgICBhY3RpdmVOb2RlLFxuICAgIGNvbGxpc2lvblJlY3Q6IG51bGwsXG4gICAgY29sbGlzaW9uczogbnVsbCxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICBkcmFnZ2luZ05vZGU6IG51bGwsXG4gICAgZHJhZ2dpbmdOb2RlUmVjdDogbnVsbCxcbiAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgIG92ZXI6IG51bGwsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9yczogW10sXG4gICAgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGU6IG51bGxcbiAgfSk7XG4gIGNvbnN0IG92ZXJOb2RlID0gZHJvcHBhYmxlQ29udGFpbmVycy5nZXROb2RlRm9yKChfc2Vuc29yQ29udGV4dCRjdXJyZW4gPSBzZW5zb3JDb250ZXh0LmN1cnJlbnQub3ZlcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9zZW5zb3JDb250ZXh0JGN1cnJlbi5pZCk7XG4gIGNvbnN0IGRyYWdPdmVybGF5ID0gdXNlRHJhZ092ZXJsYXlNZWFzdXJpbmcoe1xuICAgIG1lYXN1cmU6IG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ092ZXJsYXkubWVhc3VyZVxuICB9KTsgLy8gVXNlIHRoZSByZWN0IG9mIHRoZSBkcmFnIG92ZXJsYXkgaWYgaXQgaXMgbW91bnRlZFxuXG4gIGNvbnN0IGRyYWdnaW5nTm9kZSA9IChfZHJhZ092ZXJsYXkkbm9kZVJlZiQgPSBkcmFnT3ZlcmxheS5ub2RlUmVmLmN1cnJlbnQpICE9IG51bGwgPyBfZHJhZ092ZXJsYXkkbm9kZVJlZiQgOiBhY3RpdmVOb2RlO1xuICBjb25zdCBkcmFnZ2luZ05vZGVSZWN0ID0gaXNJbml0aWFsaXplZCA/IChfZHJhZ092ZXJsYXkkcmVjdCA9IGRyYWdPdmVybGF5LnJlY3QpICE9IG51bGwgPyBfZHJhZ092ZXJsYXkkcmVjdCA6IGFjdGl2ZU5vZGVSZWN0IDogbnVsbDtcbiAgY29uc3QgdXNlc0RyYWdPdmVybGF5ID0gQm9vbGVhbihkcmFnT3ZlcmxheS5ub2RlUmVmLmN1cnJlbnQgJiYgZHJhZ092ZXJsYXkucmVjdCk7IC8vIFRoZSBkZWx0YSBiZXR3ZWVuIHRoZSBwcmV2aW91cyBhbmQgbmV3IHBvc2l0aW9uIG9mIHRoZSBkcmFnZ2FibGUgbm9kZVxuICAvLyBpcyBvbmx5IHJlbGV2YW50IHdoZW4gdGhlcmUgaXMgbm8gZHJhZyBvdmVybGF5XG5cbiAgY29uc3Qgbm9kZVJlY3REZWx0YSA9IHVzZVJlY3REZWx0YSh1c2VzRHJhZ092ZXJsYXkgPyBudWxsIDogYWN0aXZlTm9kZVJlY3QpOyAvLyBHZXQgdGhlIHdpbmRvdyByZWN0IG9mIHRoZSBkcmFnZ2luZyBub2RlXG5cbiAgY29uc3Qgd2luZG93UmVjdCA9IHVzZVdpbmRvd1JlY3QoZHJhZ2dpbmdOb2RlID8gZ2V0V2luZG93KGRyYWdnaW5nTm9kZSkgOiBudWxsKTsgLy8gR2V0IHNjcm9sbGFibGUgYW5jZXN0b3JzIG9mIHRoZSBkcmFnZ2luZyBub2RlXG5cbiAgY29uc3Qgc2Nyb2xsYWJsZUFuY2VzdG9ycyA9IHVzZVNjcm9sbGFibGVBbmNlc3RvcnMoaXNJbml0aWFsaXplZCA/IG92ZXJOb2RlICE9IG51bGwgPyBvdmVyTm9kZSA6IGFjdGl2ZU5vZGUgOiBudWxsKTtcbiAgY29uc3Qgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMgPSB1c2VSZWN0cyhzY3JvbGxhYmxlQW5jZXN0b3JzKTsgLy8gQXBwbHkgbW9kaWZpZXJzXG5cbiAgY29uc3QgbW9kaWZpZWRUcmFuc2xhdGUgPSBhcHBseU1vZGlmaWVycyhtb2RpZmllcnMsIHtcbiAgICB0cmFuc2Zvcm06IHtcbiAgICAgIHg6IHRyYW5zbGF0ZS54IC0gbm9kZVJlY3REZWx0YS54LFxuICAgICAgeTogdHJhbnNsYXRlLnkgLSBub2RlUmVjdERlbHRhLnksXG4gICAgICBzY2FsZVg6IDEsXG4gICAgICBzY2FsZVk6IDFcbiAgICB9LFxuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBjb250YWluZXJOb2RlUmVjdCxcbiAgICBkcmFnZ2luZ05vZGVSZWN0LFxuICAgIG92ZXI6IHNlbnNvckNvbnRleHQuY3VycmVudC5vdmVyLFxuICAgIG92ZXJsYXlOb2RlUmVjdDogZHJhZ092ZXJsYXkucmVjdCxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLFxuICAgIHdpbmRvd1JlY3RcbiAgfSk7XG4gIGNvbnN0IHBvaW50ZXJDb29yZGluYXRlcyA9IGFjdGl2YXRpb25Db29yZGluYXRlcyA/IGFkZChhY3RpdmF0aW9uQ29vcmRpbmF0ZXMsIHRyYW5zbGF0ZSkgOiBudWxsO1xuICBjb25zdCBzY3JvbGxPZmZzZXRzID0gdXNlU2Nyb2xsT2Zmc2V0cyhzY3JvbGxhYmxlQW5jZXN0b3JzKTsgLy8gUmVwcmVzZW50cyB0aGUgc2Nyb2xsIGRlbHRhIHNpbmNlIGRyYWdnaW5nIHdhcyBpbml0aWF0ZWRcblxuICBjb25zdCBzY3JvbGxBZGp1c3RtZW50ID0gdXNlU2Nyb2xsT2Zmc2V0c0RlbHRhKHNjcm9sbE9mZnNldHMpOyAvLyBSZXByZXNlbnRzIHRoZSBzY3JvbGwgZGVsdGEgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgYWN0aXZlIG5vZGUgcmVjdCB3YXMgbWVhc3VyZWRcblxuICBjb25zdCBhY3RpdmVOb2RlU2Nyb2xsRGVsdGEgPSB1c2VTY3JvbGxPZmZzZXRzRGVsdGEoc2Nyb2xsT2Zmc2V0cywgW2FjdGl2ZU5vZGVSZWN0XSk7XG4gIGNvbnN0IHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlID0gYWRkKG1vZGlmaWVkVHJhbnNsYXRlLCBzY3JvbGxBZGp1c3RtZW50KTtcbiAgY29uc3QgY29sbGlzaW9uUmVjdCA9IGRyYWdnaW5nTm9kZVJlY3QgPyBnZXRBZGp1c3RlZFJlY3QoZHJhZ2dpbmdOb2RlUmVjdCwgbW9kaWZpZWRUcmFuc2xhdGUpIDogbnVsbDtcbiAgY29uc3QgY29sbGlzaW9ucyA9IGFjdGl2ZSAmJiBjb2xsaXNpb25SZWN0ID8gY29sbGlzaW9uRGV0ZWN0aW9uKHtcbiAgICBhY3RpdmUsXG4gICAgY29sbGlzaW9uUmVjdCxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzOiBlbmFibGVkRHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBwb2ludGVyQ29vcmRpbmF0ZXNcbiAgfSkgOiBudWxsO1xuICBjb25zdCBvdmVySWQgPSBnZXRGaXJzdENvbGxpc2lvbihjb2xsaXNpb25zLCAnaWQnKTtcbiAgY29uc3QgW292ZXIsIHNldE92ZXJdID0gdXNlU3RhdGUobnVsbCk7IC8vIFdoZW4gdGhlcmUgaXMgbm8gZHJhZyBvdmVybGF5IHVzZWQsIHdlIG5lZWQgdG8gYWNjb3VudCBmb3IgdGhlXG4gIC8vIHdpbmRvdyBzY3JvbGwgZGVsdGFcblxuICBjb25zdCBhcHBsaWVkVHJhbnNsYXRlID0gdXNlc0RyYWdPdmVybGF5ID8gbW9kaWZpZWRUcmFuc2xhdGUgOiBhZGQobW9kaWZpZWRUcmFuc2xhdGUsIGFjdGl2ZU5vZGVTY3JvbGxEZWx0YSk7XG4gIGNvbnN0IHRyYW5zZm9ybSA9IGFkanVzdFNjYWxlKGFwcGxpZWRUcmFuc2xhdGUsIChfb3ZlciRyZWN0ID0gb3ZlciA9PSBudWxsID8gdm9pZCAwIDogb3Zlci5yZWN0KSAhPSBudWxsID8gX292ZXIkcmVjdCA6IG51bGwsIGFjdGl2ZU5vZGVSZWN0KTtcbiAgY29uc3QgYWN0aXZlU2Vuc29yUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBpbnN0YW50aWF0ZVNlbnNvciA9IHVzZUNhbGxiYWNrKChldmVudCwgX3JlZjIpID0+IHtcbiAgICBsZXQge1xuICAgICAgc2Vuc29yOiBTZW5zb3IsXG4gICAgICBvcHRpb25zXG4gICAgfSA9IF9yZWYyO1xuXG4gICAgaWYgKGFjdGl2ZVJlZi5jdXJyZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVOb2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGFjdGl2ZVJlZi5jdXJyZW50KTtcblxuICAgIGlmICghYWN0aXZlTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2YXRvckV2ZW50ID0gZXZlbnQubmF0aXZlRXZlbnQ7XG4gICAgY29uc3Qgc2Vuc29ySW5zdGFuY2UgPSBuZXcgU2Vuc29yKHtcbiAgICAgIGFjdGl2ZTogYWN0aXZlUmVmLmN1cnJlbnQsXG4gICAgICBhY3RpdmVOb2RlLFxuICAgICAgZXZlbnQ6IGFjdGl2YXRvckV2ZW50LFxuICAgICAgb3B0aW9ucyxcbiAgICAgIC8vIFNlbnNvcnMgbmVlZCB0byBiZSBpbnN0YW50aWF0ZWQgd2l0aCByZWZzIGZvciBhcmd1bWVudHMgdGhhdCBjaGFuZ2Ugb3ZlciB0aW1lXG4gICAgICAvLyBvdGhlcndpc2UgdGhleSBhcmUgZnJvemVuIGluIHRpbWUgd2l0aCB0aGUgc3RhbGUgYXJndW1lbnRzXG4gICAgICBjb250ZXh0OiBzZW5zb3JDb250ZXh0LFxuXG4gICAgICBvbkFib3J0KGlkKSB7XG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZU5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoaWQpO1xuXG4gICAgICAgIGlmICghZHJhZ2dhYmxlTm9kZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBvbkRyYWdBYm9ydFxuICAgICAgICB9ID0gbGF0ZXN0UHJvcHMuY3VycmVudDtcbiAgICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgICAgaWRcbiAgICAgICAgfTtcbiAgICAgICAgb25EcmFnQWJvcnQgPT0gbnVsbCA/IHZvaWQgMCA6IG9uRHJhZ0Fib3J0KGV2ZW50KTtcbiAgICAgICAgZGlzcGF0Y2hNb25pdG9yRXZlbnQoe1xuICAgICAgICAgIHR5cGU6ICdvbkRyYWdBYm9ydCcsXG4gICAgICAgICAgZXZlbnRcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICBvblBlbmRpbmcoaWQsIGNvbnN0cmFpbnQsIGluaXRpYWxDb29yZGluYXRlcywgb2Zmc2V0KSB7XG4gICAgICAgIGNvbnN0IGRyYWdnYWJsZU5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoaWQpO1xuXG4gICAgICAgIGlmICghZHJhZ2dhYmxlTm9kZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBvbkRyYWdQZW5kaW5nXG4gICAgICAgIH0gPSBsYXRlc3RQcm9wcy5jdXJyZW50O1xuICAgICAgICBjb25zdCBldmVudCA9IHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBjb25zdHJhaW50LFxuICAgICAgICAgIGluaXRpYWxDb29yZGluYXRlcyxcbiAgICAgICAgICBvZmZzZXRcbiAgICAgICAgfTtcbiAgICAgICAgb25EcmFnUGVuZGluZyA9PSBudWxsID8gdm9pZCAwIDogb25EcmFnUGVuZGluZyhldmVudCk7XG4gICAgICAgIGRpc3BhdGNoTW9uaXRvckV2ZW50KHtcbiAgICAgICAgICB0eXBlOiAnb25EcmFnUGVuZGluZycsXG4gICAgICAgICAgZXZlbnRcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICBvblN0YXJ0KGluaXRpYWxDb29yZGluYXRlcykge1xuICAgICAgICBjb25zdCBpZCA9IGFjdGl2ZVJlZi5jdXJyZW50O1xuXG4gICAgICAgIGlmIChpZCA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZHJhZ2dhYmxlTm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFkcmFnZ2FibGVOb2RlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIG9uRHJhZ1N0YXJ0XG4gICAgICAgIH0gPSBsYXRlc3RQcm9wcy5jdXJyZW50O1xuICAgICAgICBjb25zdCBldmVudCA9IHtcbiAgICAgICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgICAgICBhY3RpdmU6IHtcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgZGF0YTogZHJhZ2dhYmxlTm9kZS5kYXRhLFxuICAgICAgICAgICAgcmVjdDogYWN0aXZlUmVjdHNcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHVuc3RhYmxlX2JhdGNoZWRVcGRhdGVzKCgpID0+IHtcbiAgICAgICAgICBvbkRyYWdTdGFydCA9PSBudWxsID8gdm9pZCAwIDogb25EcmFnU3RhcnQoZXZlbnQpO1xuICAgICAgICAgIHNldFN0YXR1cyhTdGF0dXMuSW5pdGlhbGl6aW5nKTtcbiAgICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgICB0eXBlOiBBY3Rpb24uRHJhZ1N0YXJ0LFxuICAgICAgICAgICAgaW5pdGlhbENvb3JkaW5hdGVzLFxuICAgICAgICAgICAgYWN0aXZlOiBpZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGRpc3BhdGNoTW9uaXRvckV2ZW50KHtcbiAgICAgICAgICAgIHR5cGU6ICdvbkRyYWdTdGFydCcsXG4gICAgICAgICAgICBldmVudFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldEFjdGl2ZVNlbnNvcihhY3RpdmVTZW5zb3JSZWYuY3VycmVudCk7XG4gICAgICAgICAgc2V0QWN0aXZhdG9yRXZlbnQoYWN0aXZhdG9yRXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIG9uTW92ZShjb29yZGluYXRlcykge1xuICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgdHlwZTogQWN0aW9uLkRyYWdNb3ZlLFxuICAgICAgICAgIGNvb3JkaW5hdGVzXG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgb25FbmQ6IGNyZWF0ZUhhbmRsZXIoQWN0aW9uLkRyYWdFbmQpLFxuICAgICAgb25DYW5jZWw6IGNyZWF0ZUhhbmRsZXIoQWN0aW9uLkRyYWdDYW5jZWwpXG4gICAgfSk7XG4gICAgYWN0aXZlU2Vuc29yUmVmLmN1cnJlbnQgPSBzZW5zb3JJbnN0YW5jZTtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUhhbmRsZXIodHlwZSkge1xuICAgICAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBhY3RpdmUsXG4gICAgICAgICAgY29sbGlzaW9ucyxcbiAgICAgICAgICBvdmVyLFxuICAgICAgICAgIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlXG4gICAgICAgIH0gPSBzZW5zb3JDb250ZXh0LmN1cnJlbnQ7XG4gICAgICAgIGxldCBldmVudCA9IG51bGw7XG5cbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZSkge1xuICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGNhbmNlbERyb3BcbiAgICAgICAgICB9ID0gbGF0ZXN0UHJvcHMuY3VycmVudDtcbiAgICAgICAgICBldmVudCA9IHtcbiAgICAgICAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgICAgICAgYWN0aXZlOiBhY3RpdmUsXG4gICAgICAgICAgICBjb2xsaXNpb25zLFxuICAgICAgICAgICAgZGVsdGE6IHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlLFxuICAgICAgICAgICAgb3ZlclxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAodHlwZSA9PT0gQWN0aW9uLkRyYWdFbmQgJiYgdHlwZW9mIGNhbmNlbERyb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZENhbmNlbCA9IGF3YWl0IFByb21pc2UucmVzb2x2ZShjYW5jZWxEcm9wKGV2ZW50KSk7XG5cbiAgICAgICAgICAgIGlmIChzaG91bGRDYW5jZWwpIHtcbiAgICAgICAgICAgICAgdHlwZSA9IEFjdGlvbi5EcmFnQ2FuY2VsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFjdGl2ZVJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgdW5zdGFibGVfYmF0Y2hlZFVwZGF0ZXMoKCkgPT4ge1xuICAgICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICAgIHR5cGVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzZXRTdGF0dXMoU3RhdHVzLlVuaW5pdGlhbGl6ZWQpO1xuICAgICAgICAgIHNldE92ZXIobnVsbCk7XG4gICAgICAgICAgc2V0QWN0aXZlU2Vuc29yKG51bGwpO1xuICAgICAgICAgIHNldEFjdGl2YXRvckV2ZW50KG51bGwpO1xuICAgICAgICAgIGFjdGl2ZVNlbnNvclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgICBjb25zdCBldmVudE5hbWUgPSB0eXBlID09PSBBY3Rpb24uRHJhZ0VuZCA/ICdvbkRyYWdFbmQnIDogJ29uRHJhZ0NhbmNlbCc7XG5cbiAgICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBsYXRlc3RQcm9wcy5jdXJyZW50W2V2ZW50TmFtZV07XG4gICAgICAgICAgICBoYW5kbGVyID09IG51bGwgPyB2b2lkIDAgOiBoYW5kbGVyKGV2ZW50KTtcbiAgICAgICAgICAgIGRpc3BhdGNoTW9uaXRvckV2ZW50KHtcbiAgICAgICAgICAgICAgdHlwZTogZXZlbnROYW1lLFxuICAgICAgICAgICAgICBldmVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtkcmFnZ2FibGVOb2Rlc10pO1xuICBjb25zdCBiaW5kQWN0aXZhdG9yVG9TZW5zb3JJbnN0YW50aWF0b3IgPSB1c2VDYWxsYmFjaygoaGFuZGxlciwgc2Vuc29yKSA9PiB7XG4gICAgcmV0dXJuIChldmVudCwgYWN0aXZlKSA9PiB7XG4gICAgICBjb25zdCBuYXRpdmVFdmVudCA9IGV2ZW50Lm5hdGl2ZUV2ZW50O1xuICAgICAgY29uc3QgYWN0aXZlRHJhZ2dhYmxlTm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChhY3RpdmUpO1xuXG4gICAgICBpZiAoIC8vIEFub3RoZXIgc2Vuc29yIGlzIGFscmVhZHkgaW5zdGFudGlhdGluZ1xuICAgICAgYWN0aXZlUmVmLmN1cnJlbnQgIT09IG51bGwgfHwgLy8gTm8gYWN0aXZlIGRyYWdnYWJsZVxuICAgICAgIWFjdGl2ZURyYWdnYWJsZU5vZGUgfHwgLy8gRXZlbnQgaGFzIGFscmVhZHkgYmVlbiBjYXB0dXJlZFxuICAgICAgbmF0aXZlRXZlbnQuZG5kS2l0IHx8IG5hdGl2ZUV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhY3RpdmF0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgYWN0aXZlOiBhY3RpdmVEcmFnZ2FibGVOb2RlXG4gICAgICB9O1xuICAgICAgY29uc3Qgc2hvdWxkQWN0aXZhdGUgPSBoYW5kbGVyKGV2ZW50LCBzZW5zb3Iub3B0aW9ucywgYWN0aXZhdGlvbkNvbnRleHQpO1xuXG4gICAgICBpZiAoc2hvdWxkQWN0aXZhdGUgPT09IHRydWUpIHtcbiAgICAgICAgbmF0aXZlRXZlbnQuZG5kS2l0ID0ge1xuICAgICAgICAgIGNhcHR1cmVkQnk6IHNlbnNvci5zZW5zb3JcbiAgICAgICAgfTtcbiAgICAgICAgYWN0aXZlUmVmLmN1cnJlbnQgPSBhY3RpdmU7XG4gICAgICAgIGluc3RhbnRpYXRlU2Vuc29yKGV2ZW50LCBzZW5zb3IpO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFtkcmFnZ2FibGVOb2RlcywgaW5zdGFudGlhdGVTZW5zb3JdKTtcbiAgY29uc3QgYWN0aXZhdG9ycyA9IHVzZUNvbWJpbmVBY3RpdmF0b3JzKHNlbnNvcnMsIGJpbmRBY3RpdmF0b3JUb1NlbnNvckluc3RhbnRpYXRvcik7XG4gIHVzZVNlbnNvclNldHVwKHNlbnNvcnMpO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoYWN0aXZlTm9kZVJlY3QgJiYgc3RhdHVzID09PSBTdGF0dXMuSW5pdGlhbGl6aW5nKSB7XG4gICAgICBzZXRTdGF0dXMoU3RhdHVzLkluaXRpYWxpemVkKTtcbiAgICB9XG4gIH0sIFthY3RpdmVOb2RlUmVjdCwgc3RhdHVzXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgb25EcmFnTW92ZVxuICAgIH0gPSBsYXRlc3RQcm9wcy5jdXJyZW50O1xuICAgIGNvbnN0IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgY29sbGlzaW9ucyxcbiAgICAgIG92ZXJcbiAgICB9ID0gc2Vuc29yQ29udGV4dC5jdXJyZW50O1xuXG4gICAgaWYgKCFhY3RpdmUgfHwgIWFjdGl2YXRvckV2ZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGNvbGxpc2lvbnMsXG4gICAgICBkZWx0YToge1xuICAgICAgICB4OiBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZS54LFxuICAgICAgICB5OiBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZS55XG4gICAgICB9LFxuICAgICAgb3ZlclxuICAgIH07XG4gICAgdW5zdGFibGVfYmF0Y2hlZFVwZGF0ZXMoKCkgPT4ge1xuICAgICAgb25EcmFnTW92ZSA9PSBudWxsID8gdm9pZCAwIDogb25EcmFnTW92ZShldmVudCk7XG4gICAgICBkaXNwYXRjaE1vbml0b3JFdmVudCh7XG4gICAgICAgIHR5cGU6ICdvbkRyYWdNb3ZlJyxcbiAgICAgICAgZXZlbnRcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZS54LCBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZS55XSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBjb2xsaXNpb25zLFxuICAgICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICAgIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlXG4gICAgfSA9IHNlbnNvckNvbnRleHQuY3VycmVudDtcblxuICAgIGlmICghYWN0aXZlIHx8IGFjdGl2ZVJlZi5jdXJyZW50ID09IG51bGwgfHwgIWFjdGl2YXRvckV2ZW50IHx8ICFzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtcbiAgICAgIG9uRHJhZ092ZXJcbiAgICB9ID0gbGF0ZXN0UHJvcHMuY3VycmVudDtcbiAgICBjb25zdCBvdmVyQ29udGFpbmVyID0gZHJvcHBhYmxlQ29udGFpbmVycy5nZXQob3ZlcklkKTtcbiAgICBjb25zdCBvdmVyID0gb3ZlckNvbnRhaW5lciAmJiBvdmVyQ29udGFpbmVyLnJlY3QuY3VycmVudCA/IHtcbiAgICAgIGlkOiBvdmVyQ29udGFpbmVyLmlkLFxuICAgICAgcmVjdDogb3ZlckNvbnRhaW5lci5yZWN0LmN1cnJlbnQsXG4gICAgICBkYXRhOiBvdmVyQ29udGFpbmVyLmRhdGEsXG4gICAgICBkaXNhYmxlZDogb3ZlckNvbnRhaW5lci5kaXNhYmxlZFxuICAgIH0gOiBudWxsO1xuICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBjb2xsaXNpb25zLFxuICAgICAgZGVsdGE6IHtcbiAgICAgICAgeDogc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUueCxcbiAgICAgICAgeTogc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUueVxuICAgICAgfSxcbiAgICAgIG92ZXJcbiAgICB9O1xuICAgIHVuc3RhYmxlX2JhdGNoZWRVcGRhdGVzKCgpID0+IHtcbiAgICAgIHNldE92ZXIob3Zlcik7XG4gICAgICBvbkRyYWdPdmVyID09IG51bGwgPyB2b2lkIDAgOiBvbkRyYWdPdmVyKGV2ZW50KTtcbiAgICAgIGRpc3BhdGNoTW9uaXRvckV2ZW50KHtcbiAgICAgICAgdHlwZTogJ29uRHJhZ092ZXInLFxuICAgICAgICBldmVudFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW292ZXJJZF0pO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBzZW5zb3JDb250ZXh0LmN1cnJlbnQgPSB7XG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2ZU5vZGUsXG4gICAgICBjb2xsaXNpb25SZWN0LFxuICAgICAgY29sbGlzaW9ucyxcbiAgICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgICBkcmFnZ2luZ05vZGUsXG4gICAgICBkcmFnZ2luZ05vZGVSZWN0LFxuICAgICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICAgIG92ZXIsXG4gICAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgICAgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGVcbiAgICB9O1xuICAgIGFjdGl2ZVJlY3RzLmN1cnJlbnQgPSB7XG4gICAgICBpbml0aWFsOiBkcmFnZ2luZ05vZGVSZWN0LFxuICAgICAgdHJhbnNsYXRlZDogY29sbGlzaW9uUmVjdFxuICAgIH07XG4gIH0sIFthY3RpdmUsIGFjdGl2ZU5vZGUsIGNvbGxpc2lvbnMsIGNvbGxpc2lvblJlY3QsIGRyYWdnYWJsZU5vZGVzLCBkcmFnZ2luZ05vZGUsIGRyYWdnaW5nTm9kZVJlY3QsIGRyb3BwYWJsZVJlY3RzLCBkcm9wcGFibGVDb250YWluZXJzLCBvdmVyLCBzY3JvbGxhYmxlQW5jZXN0b3JzLCBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZV0pO1xuICB1c2VBdXRvU2Nyb2xsZXIoeyAuLi5hdXRvU2Nyb2xsT3B0aW9ucyxcbiAgICBkZWx0YTogdHJhbnNsYXRlLFxuICAgIGRyYWdnaW5nUmVjdDogY29sbGlzaW9uUmVjdCxcbiAgICBwb2ludGVyQ29vcmRpbmF0ZXMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9ycyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0c1xuICB9KTtcbiAgY29uc3QgcHVibGljQ29udGV4dCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmVOb2RlLFxuICAgICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGNvbGxpc2lvbnMsXG4gICAgICBjb250YWluZXJOb2RlUmVjdCxcbiAgICAgIGRyYWdPdmVybGF5LFxuICAgICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgICBvdmVyLFxuICAgICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgICAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsXG4gICAgICBtZWFzdXJpbmdDb25maWd1cmF0aW9uLFxuICAgICAgbWVhc3VyaW5nU2NoZWR1bGVkLFxuICAgICAgd2luZG93UmVjdFxuICAgIH07XG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH0sIFthY3RpdmUsIGFjdGl2ZU5vZGUsIGFjdGl2ZU5vZGVSZWN0LCBhY3RpdmF0b3JFdmVudCwgY29sbGlzaW9ucywgY29udGFpbmVyTm9kZVJlY3QsIGRyYWdPdmVybGF5LCBkcmFnZ2FibGVOb2RlcywgZHJvcHBhYmxlQ29udGFpbmVycywgZHJvcHBhYmxlUmVjdHMsIG92ZXIsIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzLCBzY3JvbGxhYmxlQW5jZXN0b3JzLCBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cywgbWVhc3VyaW5nQ29uZmlndXJhdGlvbiwgbWVhc3VyaW5nU2NoZWR1bGVkLCB3aW5kb3dSZWN0XSk7XG4gIGNvbnN0IGludGVybmFsQ29udGV4dCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGFjdGl2YXRvcnMsXG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICAgIGFyaWFEZXNjcmliZWRCeUlkOiB7XG4gICAgICAgIGRyYWdnYWJsZTogZHJhZ2dhYmxlRGVzY3JpYmVkQnlJZFxuICAgICAgfSxcbiAgICAgIGRpc3BhdGNoLFxuICAgICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgICBvdmVyLFxuICAgICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnNcbiAgICB9O1xuICAgIHJldHVybiBjb250ZXh0O1xuICB9LCBbYWN0aXZhdG9yRXZlbnQsIGFjdGl2YXRvcnMsIGFjdGl2ZSwgYWN0aXZlTm9kZVJlY3QsIGRpc3BhdGNoLCBkcmFnZ2FibGVEZXNjcmliZWRCeUlkLCBkcmFnZ2FibGVOb2Rlcywgb3ZlciwgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnNdKTtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRG5kTW9uaXRvckNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogcmVnaXN0ZXJNb25pdG9yTGlzdGVuZXJcbiAgfSwgUmVhY3QuY3JlYXRlRWxlbWVudChJbnRlcm5hbENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogaW50ZXJuYWxDb250ZXh0XG4gIH0sIFJlYWN0LmNyZWF0ZUVsZW1lbnQoUHVibGljQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBwdWJsaWNDb250ZXh0XG4gIH0sIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQWN0aXZlRHJhZ2dhYmxlQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiB0cmFuc2Zvcm1cbiAgfSwgY2hpbGRyZW4pKSwgUmVhY3QuY3JlYXRlRWxlbWVudChSZXN0b3JlRm9jdXMsIHtcbiAgICBkaXNhYmxlZDogKGFjY2Vzc2liaWxpdHkgPT0gbnVsbCA/IHZvaWQgMCA6IGFjY2Vzc2liaWxpdHkucmVzdG9yZUZvY3VzKSA9PT0gZmFsc2VcbiAgfSkpLCBSZWFjdC5jcmVhdGVFbGVtZW50KEFjY2Vzc2liaWxpdHksIHsgLi4uYWNjZXNzaWJpbGl0eSxcbiAgICBoaWRkZW5UZXh0RGVzY3JpYmVkQnlJZDogZHJhZ2dhYmxlRGVzY3JpYmVkQnlJZFxuICB9KSk7XG5cbiAgZnVuY3Rpb24gZ2V0QXV0b1Njcm9sbGVyT3B0aW9ucygpIHtcbiAgICBjb25zdCBhY3RpdmVTZW5zb3JEaXNhYmxlc0F1dG9zY3JvbGwgPSAoYWN0aXZlU2Vuc29yID09IG51bGwgPyB2b2lkIDAgOiBhY3RpdmVTZW5zb3IuYXV0b1Njcm9sbEVuYWJsZWQpID09PSBmYWxzZTtcbiAgICBjb25zdCBhdXRvU2Nyb2xsR2xvYmFsbHlEaXNhYmxlZCA9IHR5cGVvZiBhdXRvU2Nyb2xsID09PSAnb2JqZWN0JyA/IGF1dG9TY3JvbGwuZW5hYmxlZCA9PT0gZmFsc2UgOiBhdXRvU2Nyb2xsID09PSBmYWxzZTtcbiAgICBjb25zdCBlbmFibGVkID0gaXNJbml0aWFsaXplZCAmJiAhYWN0aXZlU2Vuc29yRGlzYWJsZXNBdXRvc2Nyb2xsICYmICFhdXRvU2Nyb2xsR2xvYmFsbHlEaXNhYmxlZDtcblxuICAgIGlmICh0eXBlb2YgYXV0b1Njcm9sbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiB7IC4uLmF1dG9TY3JvbGwsXG4gICAgICAgIGVuYWJsZWRcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYWJsZWRcbiAgICB9O1xuICB9XG59KTtcblxuY29uc3QgTnVsbENvbnRleHQgPSAvKiNfX1BVUkVfXyovY3JlYXRlQ29udGV4dChudWxsKTtcbmNvbnN0IGRlZmF1bHRSb2xlID0gJ2J1dHRvbic7XG5jb25zdCBJRF9QUkVGSVggPSAnRHJhZ2dhYmxlJztcbmZ1bmN0aW9uIHVzZURyYWdnYWJsZShfcmVmKSB7XG4gIGxldCB7XG4gICAgaWQsXG4gICAgZGF0YSxcbiAgICBkaXNhYmxlZCA9IGZhbHNlLFxuICAgIGF0dHJpYnV0ZXNcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGtleSA9IHVzZVVuaXF1ZUlkKElEX1BSRUZJWCk7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmF0b3JzLFxuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBhcmlhRGVzY3JpYmVkQnlJZCxcbiAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICBvdmVyXG4gIH0gPSB1c2VDb250ZXh0KEludGVybmFsQ29udGV4dCk7XG4gIGNvbnN0IHtcbiAgICByb2xlID0gZGVmYXVsdFJvbGUsXG4gICAgcm9sZURlc2NyaXB0aW9uID0gJ2RyYWdnYWJsZScsXG4gICAgdGFiSW5kZXggPSAwXG4gIH0gPSBhdHRyaWJ1dGVzICE9IG51bGwgPyBhdHRyaWJ1dGVzIDoge307XG4gIGNvbnN0IGlzRHJhZ2dpbmcgPSAoYWN0aXZlID09IG51bGwgPyB2b2lkIDAgOiBhY3RpdmUuaWQpID09PSBpZDtcbiAgY29uc3QgdHJhbnNmb3JtID0gdXNlQ29udGV4dChpc0RyYWdnaW5nID8gQWN0aXZlRHJhZ2dhYmxlQ29udGV4dCA6IE51bGxDb250ZXh0KTtcbiAgY29uc3QgW25vZGUsIHNldE5vZGVSZWZdID0gdXNlTm9kZVJlZigpO1xuICBjb25zdCBbYWN0aXZhdG9yTm9kZSwgc2V0QWN0aXZhdG9yTm9kZVJlZl0gPSB1c2VOb2RlUmVmKCk7XG4gIGNvbnN0IGxpc3RlbmVycyA9IHVzZVN5bnRoZXRpY0xpc3RlbmVycyhhY3RpdmF0b3JzLCBpZCk7XG4gIGNvbnN0IGRhdGFSZWYgPSB1c2VMYXRlc3RWYWx1ZShkYXRhKTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgZHJhZ2dhYmxlTm9kZXMuc2V0KGlkLCB7XG4gICAgICBpZCxcbiAgICAgIGtleSxcbiAgICAgIG5vZGUsXG4gICAgICBhY3RpdmF0b3JOb2RlLFxuICAgICAgZGF0YTogZGF0YVJlZlxuICAgIH0pO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjb25zdCBub2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGlkKTtcblxuICAgICAgaWYgKG5vZGUgJiYgbm9kZS5rZXkgPT09IGtleSkge1xuICAgICAgICBkcmFnZ2FibGVOb2Rlcy5kZWxldGUoaWQpO1xuICAgICAgfVxuICAgIH07XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2RyYWdnYWJsZU5vZGVzLCBpZF0pO1xuICBjb25zdCBtZW1vaXplZEF0dHJpYnV0ZXMgPSB1c2VNZW1vKCgpID0+ICh7XG4gICAgcm9sZSxcbiAgICB0YWJJbmRleCxcbiAgICAnYXJpYS1kaXNhYmxlZCc6IGRpc2FibGVkLFxuICAgICdhcmlhLXByZXNzZWQnOiBpc0RyYWdnaW5nICYmIHJvbGUgPT09IGRlZmF1bHRSb2xlID8gdHJ1ZSA6IHVuZGVmaW5lZCxcbiAgICAnYXJpYS1yb2xlZGVzY3JpcHRpb24nOiByb2xlRGVzY3JpcHRpb24sXG4gICAgJ2FyaWEtZGVzY3JpYmVkYnknOiBhcmlhRGVzY3JpYmVkQnlJZC5kcmFnZ2FibGVcbiAgfSksIFtkaXNhYmxlZCwgcm9sZSwgdGFiSW5kZXgsIGlzRHJhZ2dpbmcsIHJvbGVEZXNjcmlwdGlvbiwgYXJpYURlc2NyaWJlZEJ5SWQuZHJhZ2dhYmxlXSk7XG4gIHJldHVybiB7XG4gICAgYWN0aXZlLFxuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGF0dHJpYnV0ZXM6IG1lbW9pemVkQXR0cmlidXRlcyxcbiAgICBpc0RyYWdnaW5nLFxuICAgIGxpc3RlbmVyczogZGlzYWJsZWQgPyB1bmRlZmluZWQgOiBsaXN0ZW5lcnMsXG4gICAgbm9kZSxcbiAgICBvdmVyLFxuICAgIHNldE5vZGVSZWYsXG4gICAgc2V0QWN0aXZhdG9yTm9kZVJlZixcbiAgICB0cmFuc2Zvcm1cbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlRG5kQ29udGV4dCgpIHtcbiAgcmV0dXJuIHVzZUNvbnRleHQoUHVibGljQ29udGV4dCk7XG59XG5cbmNvbnN0IElEX1BSRUZJWCQxID0gJ0Ryb3BwYWJsZSc7XG5jb25zdCBkZWZhdWx0UmVzaXplT2JzZXJ2ZXJDb25maWcgPSB7XG4gIHRpbWVvdXQ6IDI1XG59O1xuZnVuY3Rpb24gdXNlRHJvcHBhYmxlKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBkYXRhLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICAgaWQsXG4gICAgcmVzaXplT2JzZXJ2ZXJDb25maWdcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGtleSA9IHVzZVVuaXF1ZUlkKElEX1BSRUZJWCQxKTtcbiAgY29uc3Qge1xuICAgIGFjdGl2ZSxcbiAgICBkaXNwYXRjaCxcbiAgICBvdmVyLFxuICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzXG4gIH0gPSB1c2VDb250ZXh0KEludGVybmFsQ29udGV4dCk7XG4gIGNvbnN0IHByZXZpb3VzID0gdXNlUmVmKHtcbiAgICBkaXNhYmxlZFxuICB9KTtcbiAgY29uc3QgcmVzaXplT2JzZXJ2ZXJDb25uZWN0ZWQgPSB1c2VSZWYoZmFsc2UpO1xuICBjb25zdCByZWN0ID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBjYWxsYmFja0lkID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCB7XG4gICAgZGlzYWJsZWQ6IHJlc2l6ZU9ic2VydmVyRGlzYWJsZWQsXG4gICAgdXBkYXRlTWVhc3VyZW1lbnRzRm9yLFxuICAgIHRpbWVvdXQ6IHJlc2l6ZU9ic2VydmVyVGltZW91dFxuICB9ID0geyAuLi5kZWZhdWx0UmVzaXplT2JzZXJ2ZXJDb25maWcsXG4gICAgLi4ucmVzaXplT2JzZXJ2ZXJDb25maWdcbiAgfTtcbiAgY29uc3QgaWRzID0gdXNlTGF0ZXN0VmFsdWUodXBkYXRlTWVhc3VyZW1lbnRzRm9yICE9IG51bGwgPyB1cGRhdGVNZWFzdXJlbWVudHNGb3IgOiBpZCk7XG4gIGNvbnN0IGhhbmRsZVJlc2l6ZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoIXJlc2l6ZU9ic2VydmVyQ29ubmVjdGVkLmN1cnJlbnQpIHtcbiAgICAgIC8vIFJlc2l6ZU9ic2VydmVyIGludm9rZXMgdGhlIGBoYW5kbGVSZXNpemVgIGNhbGxiYWNrIGFzIHNvb24gYXMgYG9ic2VydmVgIGlzIGNhbGxlZCxcbiAgICAgIC8vIGFzc3VtaW5nIHRoZSBlbGVtZW50IGlzIHJlbmRlcmVkIGFuZCBkaXNwbGF5ZWQuXG4gICAgICByZXNpemVPYnNlcnZlckNvbm5lY3RlZC5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoY2FsbGJhY2tJZC5jdXJyZW50ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dChjYWxsYmFja0lkLmN1cnJlbnQpO1xuICAgIH1cblxuICAgIGNhbGxiYWNrSWQuY3VycmVudCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMoQXJyYXkuaXNBcnJheShpZHMuY3VycmVudCkgPyBpZHMuY3VycmVudCA6IFtpZHMuY3VycmVudF0pO1xuICAgICAgY2FsbGJhY2tJZC5jdXJyZW50ID0gbnVsbDtcbiAgICB9LCByZXNpemVPYnNlcnZlclRpbWVvdXQpO1xuICB9LCAvL2VzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW3Jlc2l6ZU9ic2VydmVyVGltZW91dF0pO1xuICBjb25zdCByZXNpemVPYnNlcnZlciA9IHVzZVJlc2l6ZU9ic2VydmVyKHtcbiAgICBjYWxsYmFjazogaGFuZGxlUmVzaXplLFxuICAgIGRpc2FibGVkOiByZXNpemVPYnNlcnZlckRpc2FibGVkIHx8ICFhY3RpdmVcbiAgfSk7XG4gIGNvbnN0IGhhbmRsZU5vZGVDaGFuZ2UgPSB1c2VDYWxsYmFjaygobmV3RWxlbWVudCwgcHJldmlvdXNFbGVtZW50KSA9PiB7XG4gICAgaWYgKCFyZXNpemVPYnNlcnZlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwcmV2aW91c0VsZW1lbnQpIHtcbiAgICAgIHJlc2l6ZU9ic2VydmVyLnVub2JzZXJ2ZShwcmV2aW91c0VsZW1lbnQpO1xuICAgICAgcmVzaXplT2JzZXJ2ZXJDb25uZWN0ZWQuY3VycmVudCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChuZXdFbGVtZW50KSB7XG4gICAgICByZXNpemVPYnNlcnZlci5vYnNlcnZlKG5ld0VsZW1lbnQpO1xuICAgIH1cbiAgfSwgW3Jlc2l6ZU9ic2VydmVyXSk7XG4gIGNvbnN0IFtub2RlUmVmLCBzZXROb2RlUmVmXSA9IHVzZU5vZGVSZWYoaGFuZGxlTm9kZUNoYW5nZSk7XG4gIGNvbnN0IGRhdGFSZWYgPSB1c2VMYXRlc3RWYWx1ZShkYXRhKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXJlc2l6ZU9ic2VydmVyIHx8ICFub2RlUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXNpemVPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgcmVzaXplT2JzZXJ2ZXJDb25uZWN0ZWQuY3VycmVudCA9IGZhbHNlO1xuICAgIHJlc2l6ZU9ic2VydmVyLm9ic2VydmUobm9kZVJlZi5jdXJyZW50KTtcbiAgfSwgW25vZGVSZWYsIHJlc2l6ZU9ic2VydmVyXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZGlzcGF0Y2goe1xuICAgICAgdHlwZTogQWN0aW9uLlJlZ2lzdGVyRHJvcHBhYmxlLFxuICAgICAgZWxlbWVudDoge1xuICAgICAgICBpZCxcbiAgICAgICAga2V5LFxuICAgICAgICBkaXNhYmxlZCxcbiAgICAgICAgbm9kZTogbm9kZVJlZixcbiAgICAgICAgcmVjdCxcbiAgICAgICAgZGF0YTogZGF0YVJlZlxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiAoKSA9PiBkaXNwYXRjaCh7XG4gICAgICB0eXBlOiBBY3Rpb24uVW5yZWdpc3RlckRyb3BwYWJsZSxcbiAgICAgIGtleSxcbiAgICAgIGlkXG4gICAgfSk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2lkXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkICE9PSBwcmV2aW91cy5jdXJyZW50LmRpc2FibGVkKSB7XG4gICAgICBkaXNwYXRjaCh7XG4gICAgICAgIHR5cGU6IEFjdGlvbi5TZXREcm9wcGFibGVEaXNhYmxlZCxcbiAgICAgICAgaWQsXG4gICAgICAgIGtleSxcbiAgICAgICAgZGlzYWJsZWRcbiAgICAgIH0pO1xuICAgICAgcHJldmlvdXMuY3VycmVudC5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgIH1cbiAgfSwgW2lkLCBrZXksIGRpc2FibGVkLCBkaXNwYXRjaF0pO1xuICByZXR1cm4ge1xuICAgIGFjdGl2ZSxcbiAgICByZWN0LFxuICAgIGlzT3ZlcjogKG92ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG92ZXIuaWQpID09PSBpZCxcbiAgICBub2RlOiBub2RlUmVmLFxuICAgIG92ZXIsXG4gICAgc2V0Tm9kZVJlZlxuICB9O1xufVxuXG5mdW5jdGlvbiBBbmltYXRpb25NYW5hZ2VyKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBhbmltYXRpb24sXG4gICAgY2hpbGRyZW5cbiAgfSA9IF9yZWY7XG4gIGNvbnN0IFtjbG9uZWRDaGlsZHJlbiwgc2V0Q2xvbmVkQ2hpbGRyZW5dID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtlbGVtZW50LCBzZXRFbGVtZW50XSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBwcmV2aW91c0NoaWxkcmVuID0gdXNlUHJldmlvdXMoY2hpbGRyZW4pO1xuXG4gIGlmICghY2hpbGRyZW4gJiYgIWNsb25lZENoaWxkcmVuICYmIHByZXZpb3VzQ2hpbGRyZW4pIHtcbiAgICBzZXRDbG9uZWRDaGlsZHJlbihwcmV2aW91c0NoaWxkcmVuKTtcbiAgfVxuXG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGNsb25lZENoaWxkcmVuID09IG51bGwgPyB2b2lkIDAgOiBjbG9uZWRDaGlsZHJlbi5rZXk7XG4gICAgY29uc3QgaWQgPSBjbG9uZWRDaGlsZHJlbiA9PSBudWxsID8gdm9pZCAwIDogY2xvbmVkQ2hpbGRyZW4ucHJvcHMuaWQ7XG5cbiAgICBpZiAoa2V5ID09IG51bGwgfHwgaWQgPT0gbnVsbCkge1xuICAgICAgc2V0Q2xvbmVkQ2hpbGRyZW4obnVsbCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgUHJvbWlzZS5yZXNvbHZlKGFuaW1hdGlvbihpZCwgZWxlbWVudCkpLnRoZW4oKCkgPT4ge1xuICAgICAgc2V0Q2xvbmVkQ2hpbGRyZW4obnVsbCk7XG4gICAgfSk7XG4gIH0sIFthbmltYXRpb24sIGNsb25lZENoaWxkcmVuLCBlbGVtZW50XSk7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFJlYWN0LkZyYWdtZW50LCBudWxsLCBjaGlsZHJlbiwgY2xvbmVkQ2hpbGRyZW4gPyBjbG9uZUVsZW1lbnQoY2xvbmVkQ2hpbGRyZW4sIHtcbiAgICByZWY6IHNldEVsZW1lbnRcbiAgfSkgOiBudWxsKTtcbn1cblxuY29uc3QgZGVmYXVsdFRyYW5zZm9ybSA9IHtcbiAgeDogMCxcbiAgeTogMCxcbiAgc2NhbGVYOiAxLFxuICBzY2FsZVk6IDFcbn07XG5mdW5jdGlvbiBOdWxsaWZpZWRDb250ZXh0UHJvdmlkZXIoX3JlZikge1xuICBsZXQge1xuICAgIGNoaWxkcmVuXG4gIH0gPSBfcmVmO1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChJbnRlcm5hbENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogZGVmYXVsdEludGVybmFsQ29udGV4dFxuICB9LCBSZWFjdC5jcmVhdGVFbGVtZW50KEFjdGl2ZURyYWdnYWJsZUNvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogZGVmYXVsdFRyYW5zZm9ybVxuICB9LCBjaGlsZHJlbikpO1xufVxuXG5jb25zdCBiYXNlU3R5bGVzID0ge1xuICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgdG91Y2hBY3Rpb246ICdub25lJ1xufTtcblxuY29uc3QgZGVmYXVsdFRyYW5zaXRpb24gPSBhY3RpdmF0b3JFdmVudCA9PiB7XG4gIGNvbnN0IGlzS2V5Ym9hcmRBY3RpdmF0b3IgPSBpc0tleWJvYXJkRXZlbnQoYWN0aXZhdG9yRXZlbnQpO1xuICByZXR1cm4gaXNLZXlib2FyZEFjdGl2YXRvciA/ICd0cmFuc2Zvcm0gMjUwbXMgZWFzZScgOiB1bmRlZmluZWQ7XG59O1xuXG5jb25zdCBQb3NpdGlvbmVkT3ZlcmxheSA9IC8qI19fUFVSRV9fKi9mb3J3YXJkUmVmKChfcmVmLCByZWYpID0+IHtcbiAgbGV0IHtcbiAgICBhcyxcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhZGp1c3RTY2FsZSxcbiAgICBjaGlsZHJlbixcbiAgICBjbGFzc05hbWUsXG4gICAgcmVjdCxcbiAgICBzdHlsZSxcbiAgICB0cmFuc2Zvcm0sXG4gICAgdHJhbnNpdGlvbiA9IGRlZmF1bHRUcmFuc2l0aW9uXG4gIH0gPSBfcmVmO1xuXG4gIGlmICghcmVjdCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qgc2NhbGVBZGp1c3RlZFRyYW5zZm9ybSA9IGFkanVzdFNjYWxlID8gdHJhbnNmb3JtIDogeyAuLi50cmFuc2Zvcm0sXG4gICAgc2NhbGVYOiAxLFxuICAgIHNjYWxlWTogMVxuICB9O1xuICBjb25zdCBzdHlsZXMgPSB7IC4uLmJhc2VTdHlsZXMsXG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICB0b3A6IHJlY3QudG9wLFxuICAgIGxlZnQ6IHJlY3QubGVmdCxcbiAgICB0cmFuc2Zvcm06IENTUy5UcmFuc2Zvcm0udG9TdHJpbmcoc2NhbGVBZGp1c3RlZFRyYW5zZm9ybSksXG4gICAgdHJhbnNmb3JtT3JpZ2luOiBhZGp1c3RTY2FsZSAmJiBhY3RpdmF0b3JFdmVudCA/IGdldFJlbGF0aXZlVHJhbnNmb3JtT3JpZ2luKGFjdGl2YXRvckV2ZW50LCByZWN0KSA6IHVuZGVmaW5lZCxcbiAgICB0cmFuc2l0aW9uOiB0eXBlb2YgdHJhbnNpdGlvbiA9PT0gJ2Z1bmN0aW9uJyA/IHRyYW5zaXRpb24oYWN0aXZhdG9yRXZlbnQpIDogdHJhbnNpdGlvbixcbiAgICAuLi5zdHlsZVxuICB9O1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChhcywge1xuICAgIGNsYXNzTmFtZSxcbiAgICBzdHlsZTogc3R5bGVzLFxuICAgIHJlZlxuICB9LCBjaGlsZHJlbik7XG59KTtcblxuY29uc3QgZGVmYXVsdERyb3BBbmltYXRpb25TaWRlRWZmZWN0cyA9IG9wdGlvbnMgPT4gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgYWN0aXZlLFxuICAgIGRyYWdPdmVybGF5XG4gIH0gPSBfcmVmO1xuICBjb25zdCBvcmlnaW5hbFN0eWxlcyA9IHt9O1xuICBjb25zdCB7XG4gICAgc3R5bGVzLFxuICAgIGNsYXNzTmFtZVxuICB9ID0gb3B0aW9ucztcblxuICBpZiAoc3R5bGVzICE9IG51bGwgJiYgc3R5bGVzLmFjdGl2ZSkge1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHN0eWxlcy5hY3RpdmUpKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgb3JpZ2luYWxTdHlsZXNba2V5XSA9IGFjdGl2ZS5ub2RlLnN0eWxlLmdldFByb3BlcnR5VmFsdWUoa2V5KTtcbiAgICAgIGFjdGl2ZS5ub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzdHlsZXMgIT0gbnVsbCAmJiBzdHlsZXMuZHJhZ092ZXJsYXkpIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzdHlsZXMuZHJhZ092ZXJsYXkpKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZHJhZ092ZXJsYXkubm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3NOYW1lICE9IG51bGwgJiYgY2xhc3NOYW1lLmFjdGl2ZSkge1xuICAgIGFjdGl2ZS5ub2RlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lLmFjdGl2ZSk7XG4gIH1cblxuICBpZiAoY2xhc3NOYW1lICE9IG51bGwgJiYgY2xhc3NOYW1lLmRyYWdPdmVybGF5KSB7XG4gICAgZHJhZ092ZXJsYXkubm9kZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZS5kcmFnT3ZlcmxheSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvcmlnaW5hbFN0eWxlcykpIHtcbiAgICAgIGFjdGl2ZS5ub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUpO1xuICAgIH1cblxuICAgIGlmIChjbGFzc05hbWUgIT0gbnVsbCAmJiBjbGFzc05hbWUuYWN0aXZlKSB7XG4gICAgICBhY3RpdmUubm9kZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZS5hY3RpdmUpO1xuICAgIH1cbiAgfTtcbn07XG5cbmNvbnN0IGRlZmF1bHRLZXlmcmFtZVJlc29sdmVyID0gX3JlZjIgPT4ge1xuICBsZXQge1xuICAgIHRyYW5zZm9ybToge1xuICAgICAgaW5pdGlhbCxcbiAgICAgIGZpbmFsXG4gICAgfVxuICB9ID0gX3JlZjI7XG4gIHJldHVybiBbe1xuICAgIHRyYW5zZm9ybTogQ1NTLlRyYW5zZm9ybS50b1N0cmluZyhpbml0aWFsKVxuICB9LCB7XG4gICAgdHJhbnNmb3JtOiBDU1MuVHJhbnNmb3JtLnRvU3RyaW5nKGZpbmFsKVxuICB9XTtcbn07XG5cbmNvbnN0IGRlZmF1bHREcm9wQW5pbWF0aW9uQ29uZmlndXJhdGlvbiA9IHtcbiAgZHVyYXRpb246IDI1MCxcbiAgZWFzaW5nOiAnZWFzZScsXG4gIGtleWZyYW1lczogZGVmYXVsdEtleWZyYW1lUmVzb2x2ZXIsXG4gIHNpZGVFZmZlY3RzOiAvKiNfX1BVUkVfXyovZGVmYXVsdERyb3BBbmltYXRpb25TaWRlRWZmZWN0cyh7XG4gICAgc3R5bGVzOiB7XG4gICAgICBhY3RpdmU6IHtcbiAgICAgICAgb3BhY2l0eTogJzAnXG4gICAgICB9XG4gICAgfVxuICB9KVxufTtcbmZ1bmN0aW9uIHVzZURyb3BBbmltYXRpb24oX3JlZjMpIHtcbiAgbGV0IHtcbiAgICBjb25maWcsXG4gICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBtZWFzdXJpbmdDb25maWd1cmF0aW9uXG4gIH0gPSBfcmVmMztcbiAgcmV0dXJuIHVzZUV2ZW50KChpZCwgbm9kZSkgPT4ge1xuICAgIGlmIChjb25maWcgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVEcmFnZ2FibGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoaWQpO1xuXG4gICAgaWYgKCFhY3RpdmVEcmFnZ2FibGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVOb2RlID0gYWN0aXZlRHJhZ2dhYmxlLm5vZGUuY3VycmVudDtcblxuICAgIGlmICghYWN0aXZlTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1lYXN1cmFibGVOb2RlID0gZ2V0TWVhc3VyYWJsZU5vZGUobm9kZSk7XG5cbiAgICBpZiAoIW1lYXN1cmFibGVOb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgdHJhbnNmb3JtXG4gICAgfSA9IGdldFdpbmRvdyhub2RlKS5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIGNvbnN0IHBhcnNlZFRyYW5zZm9ybSA9IHBhcnNlVHJhbnNmb3JtKHRyYW5zZm9ybSk7XG5cbiAgICBpZiAoIXBhcnNlZFRyYW5zZm9ybSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFuaW1hdGlvbiA9IHR5cGVvZiBjb25maWcgPT09ICdmdW5jdGlvbicgPyBjb25maWcgOiBjcmVhdGVEZWZhdWx0RHJvcEFuaW1hdGlvbihjb25maWcpO1xuICAgIHNjcm9sbEludG9WaWV3SWZOZWVkZWQoYWN0aXZlTm9kZSwgbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnZ2FibGUubWVhc3VyZSk7XG4gICAgcmV0dXJuIGFuaW1hdGlvbih7XG4gICAgICBhY3RpdmU6IHtcbiAgICAgICAgaWQsXG4gICAgICAgIGRhdGE6IGFjdGl2ZURyYWdnYWJsZS5kYXRhLFxuICAgICAgICBub2RlOiBhY3RpdmVOb2RlLFxuICAgICAgICByZWN0OiBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdnYWJsZS5tZWFzdXJlKGFjdGl2ZU5vZGUpXG4gICAgICB9LFxuICAgICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgICBkcmFnT3ZlcmxheToge1xuICAgICAgICBub2RlLFxuICAgICAgICByZWN0OiBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdPdmVybGF5Lm1lYXN1cmUobWVhc3VyYWJsZU5vZGUpXG4gICAgICB9LFxuICAgICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICAgIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24sXG4gICAgICB0cmFuc2Zvcm06IHBhcnNlZFRyYW5zZm9ybVxuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGVmYXVsdERyb3BBbmltYXRpb24ob3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgZHVyYXRpb24sXG4gICAgZWFzaW5nLFxuICAgIHNpZGVFZmZlY3RzLFxuICAgIGtleWZyYW1lc1xuICB9ID0geyAuLi5kZWZhdWx0RHJvcEFuaW1hdGlvbkNvbmZpZ3VyYXRpb24sXG4gICAgLi4ub3B0aW9uc1xuICB9O1xuICByZXR1cm4gX3JlZjQgPT4ge1xuICAgIGxldCB7XG4gICAgICBhY3RpdmUsXG4gICAgICBkcmFnT3ZlcmxheSxcbiAgICAgIHRyYW5zZm9ybSxcbiAgICAgIC4uLnJlc3RcbiAgICB9ID0gX3JlZjQ7XG5cbiAgICBpZiAoIWR1cmF0aW9uKSB7XG4gICAgICAvLyBEbyBub3QgYW5pbWF0ZSBpZiBhbmltYXRpb24gZHVyYXRpb24gaXMgemVyby5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkZWx0YSA9IHtcbiAgICAgIHg6IGRyYWdPdmVybGF5LnJlY3QubGVmdCAtIGFjdGl2ZS5yZWN0LmxlZnQsXG4gICAgICB5OiBkcmFnT3ZlcmxheS5yZWN0LnRvcCAtIGFjdGl2ZS5yZWN0LnRvcFxuICAgIH07XG4gICAgY29uc3Qgc2NhbGUgPSB7XG4gICAgICBzY2FsZVg6IHRyYW5zZm9ybS5zY2FsZVggIT09IDEgPyBhY3RpdmUucmVjdC53aWR0aCAqIHRyYW5zZm9ybS5zY2FsZVggLyBkcmFnT3ZlcmxheS5yZWN0LndpZHRoIDogMSxcbiAgICAgIHNjYWxlWTogdHJhbnNmb3JtLnNjYWxlWSAhPT0gMSA/IGFjdGl2ZS5yZWN0LmhlaWdodCAqIHRyYW5zZm9ybS5zY2FsZVkgLyBkcmFnT3ZlcmxheS5yZWN0LmhlaWdodCA6IDFcbiAgICB9O1xuICAgIGNvbnN0IGZpbmFsVHJhbnNmb3JtID0ge1xuICAgICAgeDogdHJhbnNmb3JtLnggLSBkZWx0YS54LFxuICAgICAgeTogdHJhbnNmb3JtLnkgLSBkZWx0YS55LFxuICAgICAgLi4uc2NhbGVcbiAgICB9O1xuICAgIGNvbnN0IGFuaW1hdGlvbktleWZyYW1lcyA9IGtleWZyYW1lcyh7IC4uLnJlc3QsXG4gICAgICBhY3RpdmUsXG4gICAgICBkcmFnT3ZlcmxheSxcbiAgICAgIHRyYW5zZm9ybToge1xuICAgICAgICBpbml0aWFsOiB0cmFuc2Zvcm0sXG4gICAgICAgIGZpbmFsOiBmaW5hbFRyYW5zZm9ybVxuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IFtmaXJzdEtleWZyYW1lXSA9IGFuaW1hdGlvbktleWZyYW1lcztcbiAgICBjb25zdCBsYXN0S2V5ZnJhbWUgPSBhbmltYXRpb25LZXlmcmFtZXNbYW5pbWF0aW9uS2V5ZnJhbWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKEpTT04uc3RyaW5naWZ5KGZpcnN0S2V5ZnJhbWUpID09PSBKU09OLnN0cmluZ2lmeShsYXN0S2V5ZnJhbWUpKSB7XG4gICAgICAvLyBUaGUgc3RhcnQgYW5kIGVuZCBrZXlmcmFtZXMgYXJlIHRoZSBzYW1lLCBpbmZlciB0aGF0IHRoZXJlIGlzIG5vIGFuaW1hdGlvbiBuZWVkZWQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2xlYW51cCA9IHNpZGVFZmZlY3RzID09IG51bGwgPyB2b2lkIDAgOiBzaWRlRWZmZWN0cyh7XG4gICAgICBhY3RpdmUsXG4gICAgICBkcmFnT3ZlcmxheSxcbiAgICAgIC4uLnJlc3RcbiAgICB9KTtcbiAgICBjb25zdCBhbmltYXRpb24gPSBkcmFnT3ZlcmxheS5ub2RlLmFuaW1hdGUoYW5pbWF0aW9uS2V5ZnJhbWVzLCB7XG4gICAgICBkdXJhdGlvbixcbiAgICAgIGVhc2luZyxcbiAgICAgIGZpbGw6ICdmb3J3YXJkcydcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBhbmltYXRpb24ub25maW5pc2ggPSAoKSA9PiB7XG4gICAgICAgIGNsZWFudXAgPT0gbnVsbCA/IHZvaWQgMCA6IGNsZWFudXAoKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcbn1cblxubGV0IGtleSA9IDA7XG5mdW5jdGlvbiB1c2VLZXkoaWQpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChpZCA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAga2V5Kys7XG4gICAgcmV0dXJuIGtleTtcbiAgfSwgW2lkXSk7XG59XG5cbmNvbnN0IERyYWdPdmVybGF5ID0gLyojX19QVVJFX18qL1JlYWN0Lm1lbW8oX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgYWRqdXN0U2NhbGUgPSBmYWxzZSxcbiAgICBjaGlsZHJlbixcbiAgICBkcm9wQW5pbWF0aW9uOiBkcm9wQW5pbWF0aW9uQ29uZmlnLFxuICAgIHN0eWxlLFxuICAgIHRyYW5zaXRpb24sXG4gICAgbW9kaWZpZXJzLFxuICAgIHdyYXBwZXJFbGVtZW50ID0gJ2RpdicsXG4gICAgY2xhc3NOYW1lLFxuICAgIHpJbmRleCA9IDk5OVxuICB9ID0gX3JlZjtcbiAgY29uc3Qge1xuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBjb250YWluZXJOb2RlUmVjdCxcbiAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgIGRyYWdPdmVybGF5LFxuICAgIG92ZXIsXG4gICAgbWVhc3VyaW5nQ29uZmlndXJhdGlvbixcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLFxuICAgIHdpbmRvd1JlY3RcbiAgfSA9IHVzZURuZENvbnRleHQoKTtcbiAgY29uc3QgdHJhbnNmb3JtID0gdXNlQ29udGV4dChBY3RpdmVEcmFnZ2FibGVDb250ZXh0KTtcbiAgY29uc3Qga2V5ID0gdXNlS2V5KGFjdGl2ZSA9PSBudWxsID8gdm9pZCAwIDogYWN0aXZlLmlkKTtcbiAgY29uc3QgbW9kaWZpZWRUcmFuc2Zvcm0gPSBhcHBseU1vZGlmaWVycyhtb2RpZmllcnMsIHtcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgY29udGFpbmVyTm9kZVJlY3QsXG4gICAgZHJhZ2dpbmdOb2RlUmVjdDogZHJhZ092ZXJsYXkucmVjdCxcbiAgICBvdmVyLFxuICAgIG92ZXJsYXlOb2RlUmVjdDogZHJhZ092ZXJsYXkucmVjdCxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLFxuICAgIHRyYW5zZm9ybSxcbiAgICB3aW5kb3dSZWN0XG4gIH0pO1xuICBjb25zdCBpbml0aWFsUmVjdCA9IHVzZUluaXRpYWxWYWx1ZShhY3RpdmVOb2RlUmVjdCk7XG4gIGNvbnN0IGRyb3BBbmltYXRpb24gPSB1c2VEcm9wQW5pbWF0aW9uKHtcbiAgICBjb25maWc6IGRyb3BBbmltYXRpb25Db25maWcsXG4gICAgZHJhZ2dhYmxlTm9kZXMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBtZWFzdXJpbmdDb25maWd1cmF0aW9uXG4gIH0pOyAvLyBXZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSBhY3RpdmUgbm9kZSB0byBiZSBtZWFzdXJlZCBiZWZvcmUgY29ubmVjdGluZyB0aGUgZHJhZyBvdmVybGF5IHJlZlxuICAvLyBvdGhlcndpc2UgY29sbGlzaW9ucyBjYW4gYmUgY29tcHV0ZWQgYWdhaW5zdCBhIG1pc3Bvc2l0aW9uZWQgZHJhZyBvdmVybGF5XG5cbiAgY29uc3QgcmVmID0gaW5pdGlhbFJlY3QgPyBkcmFnT3ZlcmxheS5zZXRSZWYgOiB1bmRlZmluZWQ7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE51bGxpZmllZENvbnRleHRQcm92aWRlciwgbnVsbCwgUmVhY3QuY3JlYXRlRWxlbWVudChBbmltYXRpb25NYW5hZ2VyLCB7XG4gICAgYW5pbWF0aW9uOiBkcm9wQW5pbWF0aW9uXG4gIH0sIGFjdGl2ZSAmJiBrZXkgPyBSZWFjdC5jcmVhdGVFbGVtZW50KFBvc2l0aW9uZWRPdmVybGF5LCB7XG4gICAga2V5OiBrZXksXG4gICAgaWQ6IGFjdGl2ZS5pZCxcbiAgICByZWY6IHJlZixcbiAgICBhczogd3JhcHBlckVsZW1lbnQsXG4gICAgYWN0aXZhdG9yRXZlbnQ6IGFjdGl2YXRvckV2ZW50LFxuICAgIGFkanVzdFNjYWxlOiBhZGp1c3RTY2FsZSxcbiAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcbiAgICB0cmFuc2l0aW9uOiB0cmFuc2l0aW9uLFxuICAgIHJlY3Q6IGluaXRpYWxSZWN0LFxuICAgIHN0eWxlOiB7XG4gICAgICB6SW5kZXgsXG4gICAgICAuLi5zdHlsZVxuICAgIH0sXG4gICAgdHJhbnNmb3JtOiBtb2RpZmllZFRyYW5zZm9ybVxuICB9LCBjaGlsZHJlbikgOiBudWxsKSk7XG59KTtcblxuZXhwb3J0IHsgQXV0b1Njcm9sbEFjdGl2YXRvciwgRG5kQ29udGV4dCwgRHJhZ092ZXJsYXksIEtleWJvYXJkQ29kZSwgS2V5Ym9hcmRTZW5zb3IsIE1lYXN1cmluZ0ZyZXF1ZW5jeSwgTWVhc3VyaW5nU3RyYXRlZ3ksIE1vdXNlU2Vuc29yLCBQb2ludGVyU2Vuc29yLCBUb3VjaFNlbnNvciwgVHJhdmVyc2FsT3JkZXIsIGFwcGx5TW9kaWZpZXJzLCBjbG9zZXN0Q2VudGVyLCBjbG9zZXN0Q29ybmVycywgZGVmYXVsdEFubm91bmNlbWVudHMsIGRlZmF1bHRDb29yZGluYXRlcywgZGVmYXVsdERyb3BBbmltYXRpb25Db25maWd1cmF0aW9uIGFzIGRlZmF1bHREcm9wQW5pbWF0aW9uLCBkZWZhdWx0RHJvcEFuaW1hdGlvblNpZGVFZmZlY3RzLCBkZWZhdWx0S2V5Ym9hcmRDb29yZGluYXRlR2V0dGVyLCBkZWZhdWx0U2NyZWVuUmVhZGVySW5zdHJ1Y3Rpb25zLCBnZXRDbGllbnRSZWN0LCBnZXRGaXJzdENvbGxpc2lvbiwgZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycywgcG9pbnRlcldpdGhpbiwgcmVjdEludGVyc2VjdGlvbiwgdXNlRG5kQ29udGV4dCwgdXNlRG5kTW9uaXRvciwgdXNlRHJhZ2dhYmxlLCB1c2VEcm9wcGFibGUsIHVzZVNlbnNvciwgdXNlU2Vuc29ycyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29yZS5lc20uanMubWFwXG4iLCJpbXBvcnQgUmVhY3QsIHsgdXNlTWVtbywgdXNlUmVmLCB1c2VFZmZlY3QsIHVzZVN0YXRlLCB1c2VDb250ZXh0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlRG5kQ29udGV4dCwgZ2V0Q2xpZW50UmVjdCwgdXNlRHJvcHBhYmxlLCB1c2VEcmFnZ2FibGUsIGNsb3Nlc3RDb3JuZXJzLCBnZXRGaXJzdENvbGxpc2lvbiwgZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycywgS2V5Ym9hcmRDb2RlIH0gZnJvbSAnQGRuZC1raXQvY29yZSc7XG5pbXBvcnQgeyB1c2VVbmlxdWVJZCwgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCwgQ1NTLCB1c2VDb21iaW5lZFJlZnMsIGlzS2V5Ym9hcmRFdmVudCwgc3VidHJhY3QgfSBmcm9tICdAZG5kLWtpdC91dGlsaXRpZXMnO1xuXG4vKipcclxuICogTW92ZSBhbiBhcnJheSBpdGVtIHRvIGEgZGlmZmVyZW50IHBvc2l0aW9uLiBSZXR1cm5zIGEgbmV3IGFycmF5IHdpdGggdGhlIGl0ZW0gbW92ZWQgdG8gdGhlIG5ldyBwb3NpdGlvbi5cclxuICovXG5mdW5jdGlvbiBhcnJheU1vdmUoYXJyYXksIGZyb20sIHRvKSB7XG4gIGNvbnN0IG5ld0FycmF5ID0gYXJyYXkuc2xpY2UoKTtcbiAgbmV3QXJyYXkuc3BsaWNlKHRvIDwgMCA/IG5ld0FycmF5Lmxlbmd0aCArIHRvIDogdG8sIDAsIG5ld0FycmF5LnNwbGljZShmcm9tLCAxKVswXSk7XG4gIHJldHVybiBuZXdBcnJheTtcbn1cblxuLyoqXHJcbiAqIFN3YXAgYW4gYXJyYXkgaXRlbSB0byBhIGRpZmZlcmVudCBwb3NpdGlvbi4gUmV0dXJucyBhIG5ldyBhcnJheSB3aXRoIHRoZSBpdGVtIHN3YXBwZWQgdG8gdGhlIG5ldyBwb3NpdGlvbi5cclxuICovXG5mdW5jdGlvbiBhcnJheVN3YXAoYXJyYXksIGZyb20sIHRvKSB7XG4gIGNvbnN0IG5ld0FycmF5ID0gYXJyYXkuc2xpY2UoKTtcbiAgbmV3QXJyYXlbZnJvbV0gPSBhcnJheVt0b107XG4gIG5ld0FycmF5W3RvXSA9IGFycmF5W2Zyb21dO1xuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbmZ1bmN0aW9uIGdldFNvcnRlZFJlY3RzKGl0ZW1zLCByZWN0cykge1xuICByZXR1cm4gaXRlbXMucmVkdWNlKChhY2N1bXVsYXRvciwgaWQsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcmVjdCA9IHJlY3RzLmdldChpZCk7XG5cbiAgICBpZiAocmVjdCkge1xuICAgICAgYWNjdW11bGF0b3JbaW5kZXhdID0gcmVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gYWNjdW11bGF0b3I7XG4gIH0sIEFycmF5KGl0ZW1zLmxlbmd0aCkpO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkSW5kZXgoaW5kZXgpIHtcbiAgcmV0dXJuIGluZGV4ICE9PSBudWxsICYmIGluZGV4ID49IDA7XG59XG5cbmZ1bmN0aW9uIGl0ZW1zRXF1YWwoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURpc2FibGVkKGRpc2FibGVkKSB7XG4gIGlmICh0eXBlb2YgZGlzYWJsZWQgPT09ICdib29sZWFuJykge1xuICAgIHJldHVybiB7XG4gICAgICBkcmFnZ2FibGU6IGRpc2FibGVkLFxuICAgICAgZHJvcHBhYmxlOiBkaXNhYmxlZFxuICAgIH07XG4gIH1cblxuICByZXR1cm4gZGlzYWJsZWQ7XG59XG5cbi8vIFRvLWRvOiBXZSBzaG91bGQgYmUgY2FsY3VsYXRpbmcgc2NhbGUgdHJhbnNmb3JtYXRpb25cbmNvbnN0IGRlZmF1bHRTY2FsZSA9IHtcbiAgc2NhbGVYOiAxLFxuICBzY2FsZVk6IDFcbn07XG5jb25zdCBob3Jpem9udGFsTGlzdFNvcnRpbmdTdHJhdGVneSA9IF9yZWYgPT4ge1xuICB2YXIgX3JlY3RzJGFjdGl2ZUluZGV4O1xuXG4gIGxldCB7XG4gICAgcmVjdHMsXG4gICAgYWN0aXZlTm9kZVJlY3Q6IGZhbGxiYWNrQWN0aXZlUmVjdCxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBvdmVySW5kZXgsXG4gICAgaW5kZXhcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGFjdGl2ZU5vZGVSZWN0ID0gKF9yZWN0cyRhY3RpdmVJbmRleCA9IHJlY3RzW2FjdGl2ZUluZGV4XSkgIT0gbnVsbCA/IF9yZWN0cyRhY3RpdmVJbmRleCA6IGZhbGxiYWNrQWN0aXZlUmVjdDtcblxuICBpZiAoIWFjdGl2ZU5vZGVSZWN0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBpdGVtR2FwID0gZ2V0SXRlbUdhcChyZWN0cywgaW5kZXgsIGFjdGl2ZUluZGV4KTtcblxuICBpZiAoaW5kZXggPT09IGFjdGl2ZUluZGV4KSB7XG4gICAgY29uc3QgbmV3SW5kZXhSZWN0ID0gcmVjdHNbb3ZlckluZGV4XTtcblxuICAgIGlmICghbmV3SW5kZXhSZWN0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogYWN0aXZlSW5kZXggPCBvdmVySW5kZXggPyBuZXdJbmRleFJlY3QubGVmdCArIG5ld0luZGV4UmVjdC53aWR0aCAtIChhY3RpdmVOb2RlUmVjdC5sZWZ0ICsgYWN0aXZlTm9kZVJlY3Qud2lkdGgpIDogbmV3SW5kZXhSZWN0LmxlZnQgLSBhY3RpdmVOb2RlUmVjdC5sZWZ0LFxuICAgICAgeTogMCxcbiAgICAgIC4uLmRlZmF1bHRTY2FsZVxuICAgIH07XG4gIH1cblxuICBpZiAoaW5kZXggPiBhY3RpdmVJbmRleCAmJiBpbmRleCA8PSBvdmVySW5kZXgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogLWFjdGl2ZU5vZGVSZWN0LndpZHRoIC0gaXRlbUdhcCxcbiAgICAgIHk6IDAsXG4gICAgICAuLi5kZWZhdWx0U2NhbGVcbiAgICB9O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgYWN0aXZlSW5kZXggJiYgaW5kZXggPj0gb3ZlckluZGV4KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGFjdGl2ZU5vZGVSZWN0LndpZHRoICsgaXRlbUdhcCxcbiAgICAgIHk6IDAsXG4gICAgICAuLi5kZWZhdWx0U2NhbGVcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB4OiAwLFxuICAgIHk6IDAsXG4gICAgLi4uZGVmYXVsdFNjYWxlXG4gIH07XG59O1xuXG5mdW5jdGlvbiBnZXRJdGVtR2FwKHJlY3RzLCBpbmRleCwgYWN0aXZlSW5kZXgpIHtcbiAgY29uc3QgY3VycmVudFJlY3QgPSByZWN0c1tpbmRleF07XG4gIGNvbnN0IHByZXZpb3VzUmVjdCA9IHJlY3RzW2luZGV4IC0gMV07XG4gIGNvbnN0IG5leHRSZWN0ID0gcmVjdHNbaW5kZXggKyAxXTtcblxuICBpZiAoIWN1cnJlbnRSZWN0IHx8ICFwcmV2aW91c1JlY3QgJiYgIW5leHRSZWN0KSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBpZiAoYWN0aXZlSW5kZXggPCBpbmRleCkge1xuICAgIHJldHVybiBwcmV2aW91c1JlY3QgPyBjdXJyZW50UmVjdC5sZWZ0IC0gKHByZXZpb3VzUmVjdC5sZWZ0ICsgcHJldmlvdXNSZWN0LndpZHRoKSA6IG5leHRSZWN0LmxlZnQgLSAoY3VycmVudFJlY3QubGVmdCArIGN1cnJlbnRSZWN0LndpZHRoKTtcbiAgfVxuXG4gIHJldHVybiBuZXh0UmVjdCA/IG5leHRSZWN0LmxlZnQgLSAoY3VycmVudFJlY3QubGVmdCArIGN1cnJlbnRSZWN0LndpZHRoKSA6IGN1cnJlbnRSZWN0LmxlZnQgLSAocHJldmlvdXNSZWN0LmxlZnQgKyBwcmV2aW91c1JlY3Qud2lkdGgpO1xufVxuXG5jb25zdCByZWN0U29ydGluZ1N0cmF0ZWd5ID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgcmVjdHMsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgb3ZlckluZGV4LFxuICAgIGluZGV4XG4gIH0gPSBfcmVmO1xuICBjb25zdCBuZXdSZWN0cyA9IGFycmF5TW92ZShyZWN0cywgb3ZlckluZGV4LCBhY3RpdmVJbmRleCk7XG4gIGNvbnN0IG9sZFJlY3QgPSByZWN0c1tpbmRleF07XG4gIGNvbnN0IG5ld1JlY3QgPSBuZXdSZWN0c1tpbmRleF07XG5cbiAgaWYgKCFuZXdSZWN0IHx8ICFvbGRSZWN0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHg6IG5ld1JlY3QubGVmdCAtIG9sZFJlY3QubGVmdCxcbiAgICB5OiBuZXdSZWN0LnRvcCAtIG9sZFJlY3QudG9wLFxuICAgIHNjYWxlWDogbmV3UmVjdC53aWR0aCAvIG9sZFJlY3Qud2lkdGgsXG4gICAgc2NhbGVZOiBuZXdSZWN0LmhlaWdodCAvIG9sZFJlY3QuaGVpZ2h0XG4gIH07XG59O1xuXG5jb25zdCByZWN0U3dhcHBpbmdTdHJhdGVneSA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGFjdGl2ZUluZGV4LFxuICAgIGluZGV4LFxuICAgIHJlY3RzLFxuICAgIG92ZXJJbmRleFxuICB9ID0gX3JlZjtcbiAgbGV0IG9sZFJlY3Q7XG4gIGxldCBuZXdSZWN0O1xuXG4gIGlmIChpbmRleCA9PT0gYWN0aXZlSW5kZXgpIHtcbiAgICBvbGRSZWN0ID0gcmVjdHNbaW5kZXhdO1xuICAgIG5ld1JlY3QgPSByZWN0c1tvdmVySW5kZXhdO1xuICB9XG5cbiAgaWYgKGluZGV4ID09PSBvdmVySW5kZXgpIHtcbiAgICBvbGRSZWN0ID0gcmVjdHNbaW5kZXhdO1xuICAgIG5ld1JlY3QgPSByZWN0c1thY3RpdmVJbmRleF07XG4gIH1cblxuICBpZiAoIW5ld1JlY3QgfHwgIW9sZFJlY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgeDogbmV3UmVjdC5sZWZ0IC0gb2xkUmVjdC5sZWZ0LFxuICAgIHk6IG5ld1JlY3QudG9wIC0gb2xkUmVjdC50b3AsXG4gICAgc2NhbGVYOiBuZXdSZWN0LndpZHRoIC8gb2xkUmVjdC53aWR0aCxcbiAgICBzY2FsZVk6IG5ld1JlY3QuaGVpZ2h0IC8gb2xkUmVjdC5oZWlnaHRcbiAgfTtcbn07XG5cbi8vIFRvLWRvOiBXZSBzaG91bGQgYmUgY2FsY3VsYXRpbmcgc2NhbGUgdHJhbnNmb3JtYXRpb25cbmNvbnN0IGRlZmF1bHRTY2FsZSQxID0ge1xuICBzY2FsZVg6IDEsXG4gIHNjYWxlWTogMVxufTtcbmNvbnN0IHZlcnRpY2FsTGlzdFNvcnRpbmdTdHJhdGVneSA9IF9yZWYgPT4ge1xuICB2YXIgX3JlY3RzJGFjdGl2ZUluZGV4O1xuXG4gIGxldCB7XG4gICAgYWN0aXZlSW5kZXgsXG4gICAgYWN0aXZlTm9kZVJlY3Q6IGZhbGxiYWNrQWN0aXZlUmVjdCxcbiAgICBpbmRleCxcbiAgICByZWN0cyxcbiAgICBvdmVySW5kZXhcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGFjdGl2ZU5vZGVSZWN0ID0gKF9yZWN0cyRhY3RpdmVJbmRleCA9IHJlY3RzW2FjdGl2ZUluZGV4XSkgIT0gbnVsbCA/IF9yZWN0cyRhY3RpdmVJbmRleCA6IGZhbGxiYWNrQWN0aXZlUmVjdDtcblxuICBpZiAoIWFjdGl2ZU5vZGVSZWN0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoaW5kZXggPT09IGFjdGl2ZUluZGV4KSB7XG4gICAgY29uc3Qgb3ZlckluZGV4UmVjdCA9IHJlY3RzW292ZXJJbmRleF07XG5cbiAgICBpZiAoIW92ZXJJbmRleFJlY3QpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB4OiAwLFxuICAgICAgeTogYWN0aXZlSW5kZXggPCBvdmVySW5kZXggPyBvdmVySW5kZXhSZWN0LnRvcCArIG92ZXJJbmRleFJlY3QuaGVpZ2h0IC0gKGFjdGl2ZU5vZGVSZWN0LnRvcCArIGFjdGl2ZU5vZGVSZWN0LmhlaWdodCkgOiBvdmVySW5kZXhSZWN0LnRvcCAtIGFjdGl2ZU5vZGVSZWN0LnRvcCxcbiAgICAgIC4uLmRlZmF1bHRTY2FsZSQxXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGl0ZW1HYXAgPSBnZXRJdGVtR2FwJDEocmVjdHMsIGluZGV4LCBhY3RpdmVJbmRleCk7XG5cbiAgaWYgKGluZGV4ID4gYWN0aXZlSW5kZXggJiYgaW5kZXggPD0gb3ZlckluZGV4KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAtYWN0aXZlTm9kZVJlY3QuaGVpZ2h0IC0gaXRlbUdhcCxcbiAgICAgIC4uLmRlZmF1bHRTY2FsZSQxXG4gICAgfTtcbiAgfVxuXG4gIGlmIChpbmRleCA8IGFjdGl2ZUluZGV4ICYmIGluZGV4ID49IG92ZXJJbmRleCkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiAwLFxuICAgICAgeTogYWN0aXZlTm9kZVJlY3QuaGVpZ2h0ICsgaXRlbUdhcCxcbiAgICAgIC4uLmRlZmF1bHRTY2FsZSQxXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgeDogMCxcbiAgICB5OiAwLFxuICAgIC4uLmRlZmF1bHRTY2FsZSQxXG4gIH07XG59O1xuXG5mdW5jdGlvbiBnZXRJdGVtR2FwJDEoY2xpZW50UmVjdHMsIGluZGV4LCBhY3RpdmVJbmRleCkge1xuICBjb25zdCBjdXJyZW50UmVjdCA9IGNsaWVudFJlY3RzW2luZGV4XTtcbiAgY29uc3QgcHJldmlvdXNSZWN0ID0gY2xpZW50UmVjdHNbaW5kZXggLSAxXTtcbiAgY29uc3QgbmV4dFJlY3QgPSBjbGllbnRSZWN0c1tpbmRleCArIDFdO1xuXG4gIGlmICghY3VycmVudFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGlmIChhY3RpdmVJbmRleCA8IGluZGV4KSB7XG4gICAgcmV0dXJuIHByZXZpb3VzUmVjdCA/IGN1cnJlbnRSZWN0LnRvcCAtIChwcmV2aW91c1JlY3QudG9wICsgcHJldmlvdXNSZWN0LmhlaWdodCkgOiBuZXh0UmVjdCA/IG5leHRSZWN0LnRvcCAtIChjdXJyZW50UmVjdC50b3AgKyBjdXJyZW50UmVjdC5oZWlnaHQpIDogMDtcbiAgfVxuXG4gIHJldHVybiBuZXh0UmVjdCA/IG5leHRSZWN0LnRvcCAtIChjdXJyZW50UmVjdC50b3AgKyBjdXJyZW50UmVjdC5oZWlnaHQpIDogcHJldmlvdXNSZWN0ID8gY3VycmVudFJlY3QudG9wIC0gKHByZXZpb3VzUmVjdC50b3AgKyBwcmV2aW91c1JlY3QuaGVpZ2h0KSA6IDA7XG59XG5cbmNvbnN0IElEX1BSRUZJWCA9ICdTb3J0YWJsZSc7XG5jb25zdCBDb250ZXh0ID0gLyojX19QVVJFX18qL1JlYWN0LmNyZWF0ZUNvbnRleHQoe1xuICBhY3RpdmVJbmRleDogLTEsXG4gIGNvbnRhaW5lcklkOiBJRF9QUkVGSVgsXG4gIGRpc2FibGVUcmFuc2Zvcm1zOiBmYWxzZSxcbiAgaXRlbXM6IFtdLFxuICBvdmVySW5kZXg6IC0xLFxuICB1c2VEcmFnT3ZlcmxheTogZmFsc2UsXG4gIHNvcnRlZFJlY3RzOiBbXSxcbiAgc3RyYXRlZ3k6IHJlY3RTb3J0aW5nU3RyYXRlZ3ksXG4gIGRpc2FibGVkOiB7XG4gICAgZHJhZ2dhYmxlOiBmYWxzZSxcbiAgICBkcm9wcGFibGU6IGZhbHNlXG4gIH1cbn0pO1xuZnVuY3Rpb24gU29ydGFibGVDb250ZXh0KF9yZWYpIHtcbiAgbGV0IHtcbiAgICBjaGlsZHJlbixcbiAgICBpZCxcbiAgICBpdGVtczogdXNlckRlZmluZWRJdGVtcyxcbiAgICBzdHJhdGVneSA9IHJlY3RTb3J0aW5nU3RyYXRlZ3ksXG4gICAgZGlzYWJsZWQ6IGRpc2FibGVkUHJvcCA9IGZhbHNlXG4gIH0gPSBfcmVmO1xuICBjb25zdCB7XG4gICAgYWN0aXZlLFxuICAgIGRyYWdPdmVybGF5LFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIG92ZXIsXG4gICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnNcbiAgfSA9IHVzZURuZENvbnRleHQoKTtcbiAgY29uc3QgY29udGFpbmVySWQgPSB1c2VVbmlxdWVJZChJRF9QUkVGSVgsIGlkKTtcbiAgY29uc3QgdXNlRHJhZ092ZXJsYXkgPSBCb29sZWFuKGRyYWdPdmVybGF5LnJlY3QgIT09IG51bGwpO1xuICBjb25zdCBpdGVtcyA9IHVzZU1lbW8oKCkgPT4gdXNlckRlZmluZWRJdGVtcy5tYXAoaXRlbSA9PiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgJ2lkJyBpbiBpdGVtID8gaXRlbS5pZCA6IGl0ZW0pLCBbdXNlckRlZmluZWRJdGVtc10pO1xuICBjb25zdCBpc0RyYWdnaW5nID0gYWN0aXZlICE9IG51bGw7XG4gIGNvbnN0IGFjdGl2ZUluZGV4ID0gYWN0aXZlID8gaXRlbXMuaW5kZXhPZihhY3RpdmUuaWQpIDogLTE7XG4gIGNvbnN0IG92ZXJJbmRleCA9IG92ZXIgPyBpdGVtcy5pbmRleE9mKG92ZXIuaWQpIDogLTE7XG4gIGNvbnN0IHByZXZpb3VzSXRlbXNSZWYgPSB1c2VSZWYoaXRlbXMpO1xuICBjb25zdCBpdGVtc0hhdmVDaGFuZ2VkID0gIWl0ZW1zRXF1YWwoaXRlbXMsIHByZXZpb3VzSXRlbXNSZWYuY3VycmVudCk7XG4gIGNvbnN0IGRpc2FibGVUcmFuc2Zvcm1zID0gb3ZlckluZGV4ICE9PSAtMSAmJiBhY3RpdmVJbmRleCA9PT0gLTEgfHwgaXRlbXNIYXZlQ2hhbmdlZDtcbiAgY29uc3QgZGlzYWJsZWQgPSBub3JtYWxpemVEaXNhYmxlZChkaXNhYmxlZFByb3ApO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXRlbXNIYXZlQ2hhbmdlZCAmJiBpc0RyYWdnaW5nKSB7XG4gICAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycyhpdGVtcyk7XG4gICAgfVxuICB9LCBbaXRlbXNIYXZlQ2hhbmdlZCwgaXRlbXMsIGlzRHJhZ2dpbmcsIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcHJldmlvdXNJdGVtc1JlZi5jdXJyZW50ID0gaXRlbXM7XG4gIH0sIFtpdGVtc10pO1xuICBjb25zdCBjb250ZXh0VmFsdWUgPSB1c2VNZW1vKCgpID0+ICh7XG4gICAgYWN0aXZlSW5kZXgsXG4gICAgY29udGFpbmVySWQsXG4gICAgZGlzYWJsZWQsXG4gICAgZGlzYWJsZVRyYW5zZm9ybXMsXG4gICAgaXRlbXMsXG4gICAgb3ZlckluZGV4LFxuICAgIHVzZURyYWdPdmVybGF5LFxuICAgIHNvcnRlZFJlY3RzOiBnZXRTb3J0ZWRSZWN0cyhpdGVtcywgZHJvcHBhYmxlUmVjdHMpLFxuICAgIHN0cmF0ZWd5XG4gIH0pLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFthY3RpdmVJbmRleCwgY29udGFpbmVySWQsIGRpc2FibGVkLmRyYWdnYWJsZSwgZGlzYWJsZWQuZHJvcHBhYmxlLCBkaXNhYmxlVHJhbnNmb3JtcywgaXRlbXMsIG92ZXJJbmRleCwgZHJvcHBhYmxlUmVjdHMsIHVzZURyYWdPdmVybGF5LCBzdHJhdGVneV0pO1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IGNvbnRleHRWYWx1ZVxuICB9LCBjaGlsZHJlbik7XG59XG5cbmNvbnN0IGRlZmF1bHROZXdJbmRleEdldHRlciA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGlkLFxuICAgIGl0ZW1zLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIG92ZXJJbmRleFxuICB9ID0gX3JlZjtcbiAgcmV0dXJuIGFycmF5TW92ZShpdGVtcywgYWN0aXZlSW5kZXgsIG92ZXJJbmRleCkuaW5kZXhPZihpZCk7XG59O1xuY29uc3QgZGVmYXVsdEFuaW1hdGVMYXlvdXRDaGFuZ2VzID0gX3JlZjIgPT4ge1xuICBsZXQge1xuICAgIGNvbnRhaW5lcklkLFxuICAgIGlzU29ydGluZyxcbiAgICB3YXNEcmFnZ2luZyxcbiAgICBpbmRleCxcbiAgICBpdGVtcyxcbiAgICBuZXdJbmRleCxcbiAgICBwcmV2aW91c0l0ZW1zLFxuICAgIHByZXZpb3VzQ29udGFpbmVySWQsXG4gICAgdHJhbnNpdGlvblxuICB9ID0gX3JlZjI7XG5cbiAgaWYgKCF0cmFuc2l0aW9uIHx8ICF3YXNEcmFnZ2luZykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwcmV2aW91c0l0ZW1zICE9PSBpdGVtcyAmJiBpbmRleCA9PT0gbmV3SW5kZXgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoaXNTb3J0aW5nKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gbmV3SW5kZXggIT09IGluZGV4ICYmIGNvbnRhaW5lcklkID09PSBwcmV2aW91c0NvbnRhaW5lcklkO1xufTtcbmNvbnN0IGRlZmF1bHRUcmFuc2l0aW9uID0ge1xuICBkdXJhdGlvbjogMjAwLFxuICBlYXNpbmc6ICdlYXNlJ1xufTtcbmNvbnN0IHRyYW5zaXRpb25Qcm9wZXJ0eSA9ICd0cmFuc2Zvcm0nO1xuY29uc3QgZGlzYWJsZWRUcmFuc2l0aW9uID0gLyojX19QVVJFX18qL0NTUy5UcmFuc2l0aW9uLnRvU3RyaW5nKHtcbiAgcHJvcGVydHk6IHRyYW5zaXRpb25Qcm9wZXJ0eSxcbiAgZHVyYXRpb246IDAsXG4gIGVhc2luZzogJ2xpbmVhcidcbn0pO1xuY29uc3QgZGVmYXVsdEF0dHJpYnV0ZXMgPSB7XG4gIHJvbGVEZXNjcmlwdGlvbjogJ3NvcnRhYmxlJ1xufTtcblxuLypcclxuICogV2hlbiB0aGUgaW5kZXggb2YgYW4gaXRlbSBjaGFuZ2VzIHdoaWxlIHNvcnRpbmcsXHJcbiAqIHdlIG5lZWQgdG8gdGVtcG9yYXJpbHkgZGlzYWJsZSB0aGUgdHJhbnNmb3Jtc1xyXG4gKi9cblxuZnVuY3Rpb24gdXNlRGVyaXZlZFRyYW5zZm9ybShfcmVmKSB7XG4gIGxldCB7XG4gICAgZGlzYWJsZWQsXG4gICAgaW5kZXgsXG4gICAgbm9kZSxcbiAgICByZWN0XG4gIH0gPSBfcmVmO1xuICBjb25zdCBbZGVyaXZlZFRyYW5zZm9ybSwgc2V0RGVyaXZlZHRyYW5zZm9ybV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgcHJldmlvdXNJbmRleCA9IHVzZVJlZihpbmRleCk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZGlzYWJsZWQgJiYgaW5kZXggIT09IHByZXZpb3VzSW5kZXguY3VycmVudCAmJiBub2RlLmN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IGluaXRpYWwgPSByZWN0LmN1cnJlbnQ7XG5cbiAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBnZXRDbGllbnRSZWN0KG5vZGUuY3VycmVudCwge1xuICAgICAgICAgIGlnbm9yZVRyYW5zZm9ybTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZGVsdGEgPSB7XG4gICAgICAgICAgeDogaW5pdGlhbC5sZWZ0IC0gY3VycmVudC5sZWZ0LFxuICAgICAgICAgIHk6IGluaXRpYWwudG9wIC0gY3VycmVudC50b3AsXG4gICAgICAgICAgc2NhbGVYOiBpbml0aWFsLndpZHRoIC8gY3VycmVudC53aWR0aCxcbiAgICAgICAgICBzY2FsZVk6IGluaXRpYWwuaGVpZ2h0IC8gY3VycmVudC5oZWlnaHRcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZGVsdGEueCB8fCBkZWx0YS55KSB7XG4gICAgICAgICAgc2V0RGVyaXZlZHRyYW5zZm9ybShkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5kZXggIT09IHByZXZpb3VzSW5kZXguY3VycmVudCkge1xuICAgICAgcHJldmlvdXNJbmRleC5jdXJyZW50ID0gaW5kZXg7XG4gICAgfVxuICB9LCBbZGlzYWJsZWQsIGluZGV4LCBub2RlLCByZWN0XSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRlcml2ZWRUcmFuc2Zvcm0pIHtcbiAgICAgIHNldERlcml2ZWR0cmFuc2Zvcm0obnVsbCk7XG4gICAgfVxuICB9LCBbZGVyaXZlZFRyYW5zZm9ybV0pO1xuICByZXR1cm4gZGVyaXZlZFRyYW5zZm9ybTtcbn1cblxuZnVuY3Rpb24gdXNlU29ydGFibGUoX3JlZikge1xuICBsZXQge1xuICAgIGFuaW1hdGVMYXlvdXRDaGFuZ2VzID0gZGVmYXVsdEFuaW1hdGVMYXlvdXRDaGFuZ2VzLFxuICAgIGF0dHJpYnV0ZXM6IHVzZXJEZWZpbmVkQXR0cmlidXRlcyxcbiAgICBkaXNhYmxlZDogbG9jYWxEaXNhYmxlZCxcbiAgICBkYXRhOiBjdXN0b21EYXRhLFxuICAgIGdldE5ld0luZGV4ID0gZGVmYXVsdE5ld0luZGV4R2V0dGVyLFxuICAgIGlkLFxuICAgIHN0cmF0ZWd5OiBsb2NhbFN0cmF0ZWd5LFxuICAgIHJlc2l6ZU9ic2VydmVyQ29uZmlnLFxuICAgIHRyYW5zaXRpb24gPSBkZWZhdWx0VHJhbnNpdGlvblxuICB9ID0gX3JlZjtcbiAgY29uc3Qge1xuICAgIGl0ZW1zLFxuICAgIGNvbnRhaW5lcklkLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIGRpc2FibGVkOiBnbG9iYWxEaXNhYmxlZCxcbiAgICBkaXNhYmxlVHJhbnNmb3JtcyxcbiAgICBzb3J0ZWRSZWN0cyxcbiAgICBvdmVySW5kZXgsXG4gICAgdXNlRHJhZ092ZXJsYXksXG4gICAgc3RyYXRlZ3k6IGdsb2JhbFN0cmF0ZWd5XG4gIH0gPSB1c2VDb250ZXh0KENvbnRleHQpO1xuICBjb25zdCBkaXNhYmxlZCA9IG5vcm1hbGl6ZUxvY2FsRGlzYWJsZWQobG9jYWxEaXNhYmxlZCwgZ2xvYmFsRGlzYWJsZWQpO1xuICBjb25zdCBpbmRleCA9IGl0ZW1zLmluZGV4T2YoaWQpO1xuICBjb25zdCBkYXRhID0gdXNlTWVtbygoKSA9PiAoe1xuICAgIHNvcnRhYmxlOiB7XG4gICAgICBjb250YWluZXJJZCxcbiAgICAgIGluZGV4LFxuICAgICAgaXRlbXNcbiAgICB9LFxuICAgIC4uLmN1c3RvbURhdGFcbiAgfSksIFtjb250YWluZXJJZCwgY3VzdG9tRGF0YSwgaW5kZXgsIGl0ZW1zXSk7XG4gIGNvbnN0IGl0ZW1zQWZ0ZXJDdXJyZW50U29ydGFibGUgPSB1c2VNZW1vKCgpID0+IGl0ZW1zLnNsaWNlKGl0ZW1zLmluZGV4T2YoaWQpKSwgW2l0ZW1zLCBpZF0pO1xuICBjb25zdCB7XG4gICAgcmVjdCxcbiAgICBub2RlLFxuICAgIGlzT3ZlcixcbiAgICBzZXROb2RlUmVmOiBzZXREcm9wcGFibGVOb2RlUmVmXG4gIH0gPSB1c2VEcm9wcGFibGUoe1xuICAgIGlkLFxuICAgIGRhdGEsXG4gICAgZGlzYWJsZWQ6IGRpc2FibGVkLmRyb3BwYWJsZSxcbiAgICByZXNpemVPYnNlcnZlckNvbmZpZzoge1xuICAgICAgdXBkYXRlTWVhc3VyZW1lbnRzRm9yOiBpdGVtc0FmdGVyQ3VycmVudFNvcnRhYmxlLFxuICAgICAgLi4ucmVzaXplT2JzZXJ2ZXJDb25maWdcbiAgICB9XG4gIH0pO1xuICBjb25zdCB7XG4gICAgYWN0aXZlLFxuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGF0dHJpYnV0ZXMsXG4gICAgc2V0Tm9kZVJlZjogc2V0RHJhZ2dhYmxlTm9kZVJlZixcbiAgICBsaXN0ZW5lcnMsXG4gICAgaXNEcmFnZ2luZyxcbiAgICBvdmVyLFxuICAgIHNldEFjdGl2YXRvck5vZGVSZWYsXG4gICAgdHJhbnNmb3JtXG4gIH0gPSB1c2VEcmFnZ2FibGUoe1xuICAgIGlkLFxuICAgIGRhdGEsXG4gICAgYXR0cmlidXRlczogeyAuLi5kZWZhdWx0QXR0cmlidXRlcyxcbiAgICAgIC4uLnVzZXJEZWZpbmVkQXR0cmlidXRlc1xuICAgIH0sXG4gICAgZGlzYWJsZWQ6IGRpc2FibGVkLmRyYWdnYWJsZVxuICB9KTtcbiAgY29uc3Qgc2V0Tm9kZVJlZiA9IHVzZUNvbWJpbmVkUmVmcyhzZXREcm9wcGFibGVOb2RlUmVmLCBzZXREcmFnZ2FibGVOb2RlUmVmKTtcbiAgY29uc3QgaXNTb3J0aW5nID0gQm9vbGVhbihhY3RpdmUpO1xuICBjb25zdCBkaXNwbGFjZUl0ZW0gPSBpc1NvcnRpbmcgJiYgIWRpc2FibGVUcmFuc2Zvcm1zICYmIGlzVmFsaWRJbmRleChhY3RpdmVJbmRleCkgJiYgaXNWYWxpZEluZGV4KG92ZXJJbmRleCk7XG4gIGNvbnN0IHNob3VsZERpc3BsYWNlRHJhZ1NvdXJjZSA9ICF1c2VEcmFnT3ZlcmxheSAmJiBpc0RyYWdnaW5nO1xuICBjb25zdCBkcmFnU291cmNlRGlzcGxhY2VtZW50ID0gc2hvdWxkRGlzcGxhY2VEcmFnU291cmNlICYmIGRpc3BsYWNlSXRlbSA/IHRyYW5zZm9ybSA6IG51bGw7XG4gIGNvbnN0IHN0cmF0ZWd5ID0gbG9jYWxTdHJhdGVneSAhPSBudWxsID8gbG9jYWxTdHJhdGVneSA6IGdsb2JhbFN0cmF0ZWd5O1xuICBjb25zdCBmaW5hbFRyYW5zZm9ybSA9IGRpc3BsYWNlSXRlbSA/IGRyYWdTb3VyY2VEaXNwbGFjZW1lbnQgIT0gbnVsbCA/IGRyYWdTb3VyY2VEaXNwbGFjZW1lbnQgOiBzdHJhdGVneSh7XG4gICAgcmVjdHM6IHNvcnRlZFJlY3RzLFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIG92ZXJJbmRleCxcbiAgICBpbmRleFxuICB9KSA6IG51bGw7XG4gIGNvbnN0IG5ld0luZGV4ID0gaXNWYWxpZEluZGV4KGFjdGl2ZUluZGV4KSAmJiBpc1ZhbGlkSW5kZXgob3ZlckluZGV4KSA/IGdldE5ld0luZGV4KHtcbiAgICBpZCxcbiAgICBpdGVtcyxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBvdmVySW5kZXhcbiAgfSkgOiBpbmRleDtcbiAgY29uc3QgYWN0aXZlSWQgPSBhY3RpdmUgPT0gbnVsbCA/IHZvaWQgMCA6IGFjdGl2ZS5pZDtcbiAgY29uc3QgcHJldmlvdXMgPSB1c2VSZWYoe1xuICAgIGFjdGl2ZUlkLFxuICAgIGl0ZW1zLFxuICAgIG5ld0luZGV4LFxuICAgIGNvbnRhaW5lcklkXG4gIH0pO1xuICBjb25zdCBpdGVtc0hhdmVDaGFuZ2VkID0gaXRlbXMgIT09IHByZXZpb3VzLmN1cnJlbnQuaXRlbXM7XG4gIGNvbnN0IHNob3VsZEFuaW1hdGVMYXlvdXRDaGFuZ2VzID0gYW5pbWF0ZUxheW91dENoYW5nZXMoe1xuICAgIGFjdGl2ZSxcbiAgICBjb250YWluZXJJZCxcbiAgICBpc0RyYWdnaW5nLFxuICAgIGlzU29ydGluZyxcbiAgICBpZCxcbiAgICBpbmRleCxcbiAgICBpdGVtcyxcbiAgICBuZXdJbmRleDogcHJldmlvdXMuY3VycmVudC5uZXdJbmRleCxcbiAgICBwcmV2aW91c0l0ZW1zOiBwcmV2aW91cy5jdXJyZW50Lml0ZW1zLFxuICAgIHByZXZpb3VzQ29udGFpbmVySWQ6IHByZXZpb3VzLmN1cnJlbnQuY29udGFpbmVySWQsXG4gICAgdHJhbnNpdGlvbixcbiAgICB3YXNEcmFnZ2luZzogcHJldmlvdXMuY3VycmVudC5hY3RpdmVJZCAhPSBudWxsXG4gIH0pO1xuICBjb25zdCBkZXJpdmVkVHJhbnNmb3JtID0gdXNlRGVyaXZlZFRyYW5zZm9ybSh7XG4gICAgZGlzYWJsZWQ6ICFzaG91bGRBbmltYXRlTGF5b3V0Q2hhbmdlcyxcbiAgICBpbmRleCxcbiAgICBub2RlLFxuICAgIHJlY3RcbiAgfSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGlzU29ydGluZyAmJiBwcmV2aW91cy5jdXJyZW50Lm5ld0luZGV4ICE9PSBuZXdJbmRleCkge1xuICAgICAgcHJldmlvdXMuY3VycmVudC5uZXdJbmRleCA9IG5ld0luZGV4O1xuICAgIH1cblxuICAgIGlmIChjb250YWluZXJJZCAhPT0gcHJldmlvdXMuY3VycmVudC5jb250YWluZXJJZCkge1xuICAgICAgcHJldmlvdXMuY3VycmVudC5jb250YWluZXJJZCA9IGNvbnRhaW5lcklkO1xuICAgIH1cblxuICAgIGlmIChpdGVtcyAhPT0gcHJldmlvdXMuY3VycmVudC5pdGVtcykge1xuICAgICAgcHJldmlvdXMuY3VycmVudC5pdGVtcyA9IGl0ZW1zO1xuICAgIH1cbiAgfSwgW2lzU29ydGluZywgbmV3SW5kZXgsIGNvbnRhaW5lcklkLCBpdGVtc10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChhY3RpdmVJZCA9PT0gcHJldmlvdXMuY3VycmVudC5hY3RpdmVJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChhY3RpdmVJZCAhPSBudWxsICYmIHByZXZpb3VzLmN1cnJlbnQuYWN0aXZlSWQgPT0gbnVsbCkge1xuICAgICAgcHJldmlvdXMuY3VycmVudC5hY3RpdmVJZCA9IGFjdGl2ZUlkO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcHJldmlvdXMuY3VycmVudC5hY3RpdmVJZCA9IGFjdGl2ZUlkO1xuICAgIH0sIDUwKTtcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gIH0sIFthY3RpdmVJZF0pO1xuICByZXR1cm4ge1xuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBhdHRyaWJ1dGVzLFxuICAgIGRhdGEsXG4gICAgcmVjdCxcbiAgICBpbmRleCxcbiAgICBuZXdJbmRleCxcbiAgICBpdGVtcyxcbiAgICBpc092ZXIsXG4gICAgaXNTb3J0aW5nLFxuICAgIGlzRHJhZ2dpbmcsXG4gICAgbGlzdGVuZXJzLFxuICAgIG5vZGUsXG4gICAgb3ZlckluZGV4LFxuICAgIG92ZXIsXG4gICAgc2V0Tm9kZVJlZixcbiAgICBzZXRBY3RpdmF0b3JOb2RlUmVmLFxuICAgIHNldERyb3BwYWJsZU5vZGVSZWYsXG4gICAgc2V0RHJhZ2dhYmxlTm9kZVJlZixcbiAgICB0cmFuc2Zvcm06IGRlcml2ZWRUcmFuc2Zvcm0gIT0gbnVsbCA/IGRlcml2ZWRUcmFuc2Zvcm0gOiBmaW5hbFRyYW5zZm9ybSxcbiAgICB0cmFuc2l0aW9uOiBnZXRUcmFuc2l0aW9uKClcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRUcmFuc2l0aW9uKCkge1xuICAgIGlmICggLy8gVGVtcG9yYXJpbHkgZGlzYWJsZSB0cmFuc2l0aW9ucyBmb3IgYSBzaW5nbGUgZnJhbWUgdG8gc2V0IHVwIGRlcml2ZWQgdHJhbnNmb3Jtc1xuICAgIGRlcml2ZWRUcmFuc2Zvcm0gfHwgLy8gT3IgdG8gcHJldmVudCBpdGVtcyBqdW1waW5nIHRvIGJhY2sgdG8gdGhlaXIgXCJuZXdcIiBwb3NpdGlvbiB3aGVuIGl0ZW1zIGNoYW5nZVxuICAgIGl0ZW1zSGF2ZUNoYW5nZWQgJiYgcHJldmlvdXMuY3VycmVudC5uZXdJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgIHJldHVybiBkaXNhYmxlZFRyYW5zaXRpb247XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZERpc3BsYWNlRHJhZ1NvdXJjZSAmJiAhaXNLZXlib2FyZEV2ZW50KGFjdGl2YXRvckV2ZW50KSB8fCAhdHJhbnNpdGlvbikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoaXNTb3J0aW5nIHx8IHNob3VsZEFuaW1hdGVMYXlvdXRDaGFuZ2VzKSB7XG4gICAgICByZXR1cm4gQ1NTLlRyYW5zaXRpb24udG9TdHJpbmcoeyAuLi50cmFuc2l0aW9uLFxuICAgICAgICBwcm9wZXJ0eTogdHJhbnNpdGlvblByb3BlcnR5XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxvY2FsRGlzYWJsZWQobG9jYWxEaXNhYmxlZCwgZ2xvYmFsRGlzYWJsZWQpIHtcbiAgdmFyIF9sb2NhbERpc2FibGVkJGRyYWdnYSwgX2xvY2FsRGlzYWJsZWQkZHJvcHBhO1xuXG4gIGlmICh0eXBlb2YgbG9jYWxEaXNhYmxlZCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRyYWdnYWJsZTogbG9jYWxEaXNhYmxlZCxcbiAgICAgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICBkcm9wcGFibGU6IGZhbHNlXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZHJhZ2dhYmxlOiAoX2xvY2FsRGlzYWJsZWQkZHJhZ2dhID0gbG9jYWxEaXNhYmxlZCA9PSBudWxsID8gdm9pZCAwIDogbG9jYWxEaXNhYmxlZC5kcmFnZ2FibGUpICE9IG51bGwgPyBfbG9jYWxEaXNhYmxlZCRkcmFnZ2EgOiBnbG9iYWxEaXNhYmxlZC5kcmFnZ2FibGUsXG4gICAgZHJvcHBhYmxlOiAoX2xvY2FsRGlzYWJsZWQkZHJvcHBhID0gbG9jYWxEaXNhYmxlZCA9PSBudWxsID8gdm9pZCAwIDogbG9jYWxEaXNhYmxlZC5kcm9wcGFibGUpICE9IG51bGwgPyBfbG9jYWxEaXNhYmxlZCRkcm9wcGEgOiBnbG9iYWxEaXNhYmxlZC5kcm9wcGFibGVcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzU29ydGFibGVEYXRhKGVudHJ5KSB7XG4gIGlmICghZW50cnkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBkYXRhID0gZW50cnkuZGF0YS5jdXJyZW50O1xuXG4gIGlmIChkYXRhICYmICdzb3J0YWJsZScgaW4gZGF0YSAmJiB0eXBlb2YgZGF0YS5zb3J0YWJsZSA9PT0gJ29iamVjdCcgJiYgJ2NvbnRhaW5lcklkJyBpbiBkYXRhLnNvcnRhYmxlICYmICdpdGVtcycgaW4gZGF0YS5zb3J0YWJsZSAmJiAnaW5kZXgnIGluIGRhdGEuc29ydGFibGUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuY29uc3QgZGlyZWN0aW9ucyA9IFtLZXlib2FyZENvZGUuRG93biwgS2V5Ym9hcmRDb2RlLlJpZ2h0LCBLZXlib2FyZENvZGUuVXAsIEtleWJvYXJkQ29kZS5MZWZ0XTtcbmNvbnN0IHNvcnRhYmxlS2V5Ym9hcmRDb29yZGluYXRlcyA9IChldmVudCwgX3JlZikgPT4ge1xuICBsZXQge1xuICAgIGNvbnRleHQ6IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGNvbGxpc2lvblJlY3QsXG4gICAgICBkcm9wcGFibGVSZWN0cyxcbiAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgICBvdmVyLFxuICAgICAgc2Nyb2xsYWJsZUFuY2VzdG9yc1xuICAgIH1cbiAgfSA9IF9yZWY7XG5cbiAgaWYgKGRpcmVjdGlvbnMuaW5jbHVkZXMoZXZlbnQuY29kZSkpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgaWYgKCFhY3RpdmUgfHwgIWNvbGxpc2lvblJlY3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaWx0ZXJlZENvbnRhaW5lcnMgPSBbXTtcbiAgICBkcm9wcGFibGVDb250YWluZXJzLmdldEVuYWJsZWQoKS5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgIGlmICghZW50cnkgfHwgZW50cnkgIT0gbnVsbCAmJiBlbnRyeS5kaXNhYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlY3QgPSBkcm9wcGFibGVSZWN0cy5nZXQoZW50cnkuaWQpO1xuXG4gICAgICBpZiAoIXJlY3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGV2ZW50LmNvZGUpIHtcbiAgICAgICAgY2FzZSBLZXlib2FyZENvZGUuRG93bjpcbiAgICAgICAgICBpZiAoY29sbGlzaW9uUmVjdC50b3AgPCByZWN0LnRvcCkge1xuICAgICAgICAgICAgZmlsdGVyZWRDb250YWluZXJzLnB1c2goZW50cnkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgS2V5Ym9hcmRDb2RlLlVwOlxuICAgICAgICAgIGlmIChjb2xsaXNpb25SZWN0LnRvcCA+IHJlY3QudG9wKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZENvbnRhaW5lcnMucHVzaChlbnRyeSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBLZXlib2FyZENvZGUuTGVmdDpcbiAgICAgICAgICBpZiAoY29sbGlzaW9uUmVjdC5sZWZ0ID4gcmVjdC5sZWZ0KSB7XG4gICAgICAgICAgICBmaWx0ZXJlZENvbnRhaW5lcnMucHVzaChlbnRyeSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBLZXlib2FyZENvZGUuUmlnaHQ6XG4gICAgICAgICAgaWYgKGNvbGxpc2lvblJlY3QubGVmdCA8IHJlY3QubGVmdCkge1xuICAgICAgICAgICAgZmlsdGVyZWRDb250YWluZXJzLnB1c2goZW50cnkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGNvbGxpc2lvbnMgPSBjbG9zZXN0Q29ybmVycyh7XG4gICAgICBhY3RpdmUsXG4gICAgICBjb2xsaXNpb25SZWN0OiBjb2xsaXNpb25SZWN0LFxuICAgICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgICBkcm9wcGFibGVDb250YWluZXJzOiBmaWx0ZXJlZENvbnRhaW5lcnMsXG4gICAgICBwb2ludGVyQ29vcmRpbmF0ZXM6IG51bGxcbiAgICB9KTtcbiAgICBsZXQgY2xvc2VzdElkID0gZ2V0Rmlyc3RDb2xsaXNpb24oY29sbGlzaW9ucywgJ2lkJyk7XG5cbiAgICBpZiAoY2xvc2VzdElkID09PSAob3ZlciA9PSBudWxsID8gdm9pZCAwIDogb3Zlci5pZCkgJiYgY29sbGlzaW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICBjbG9zZXN0SWQgPSBjb2xsaXNpb25zWzFdLmlkO1xuICAgIH1cblxuICAgIGlmIChjbG9zZXN0SWQgIT0gbnVsbCkge1xuICAgICAgY29uc3QgYWN0aXZlRHJvcHBhYmxlID0gZHJvcHBhYmxlQ29udGFpbmVycy5nZXQoYWN0aXZlLmlkKTtcbiAgICAgIGNvbnN0IG5ld0Ryb3BwYWJsZSA9IGRyb3BwYWJsZUNvbnRhaW5lcnMuZ2V0KGNsb3Nlc3RJZCk7XG4gICAgICBjb25zdCBuZXdSZWN0ID0gbmV3RHJvcHBhYmxlID8gZHJvcHBhYmxlUmVjdHMuZ2V0KG5ld0Ryb3BwYWJsZS5pZCkgOiBudWxsO1xuICAgICAgY29uc3QgbmV3Tm9kZSA9IG5ld0Ryb3BwYWJsZSA9PSBudWxsID8gdm9pZCAwIDogbmV3RHJvcHBhYmxlLm5vZGUuY3VycmVudDtcblxuICAgICAgaWYgKG5ld05vZGUgJiYgbmV3UmVjdCAmJiBhY3RpdmVEcm9wcGFibGUgJiYgbmV3RHJvcHBhYmxlKSB7XG4gICAgICAgIGNvbnN0IG5ld1Njcm9sbEFuY2VzdG9ycyA9IGdldFNjcm9sbGFibGVBbmNlc3RvcnMobmV3Tm9kZSk7XG4gICAgICAgIGNvbnN0IGhhc0RpZmZlcmVudFNjcm9sbEFuY2VzdG9ycyA9IG5ld1Njcm9sbEFuY2VzdG9ycy5zb21lKChlbGVtZW50LCBpbmRleCkgPT4gc2Nyb2xsYWJsZUFuY2VzdG9yc1tpbmRleF0gIT09IGVsZW1lbnQpO1xuICAgICAgICBjb25zdCBoYXNTYW1lQ29udGFpbmVyID0gaXNTYW1lQ29udGFpbmVyKGFjdGl2ZURyb3BwYWJsZSwgbmV3RHJvcHBhYmxlKTtcbiAgICAgICAgY29uc3QgaXNBZnRlckFjdGl2ZSA9IGlzQWZ0ZXIoYWN0aXZlRHJvcHBhYmxlLCBuZXdEcm9wcGFibGUpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSBoYXNEaWZmZXJlbnRTY3JvbGxBbmNlc3RvcnMgfHwgIWhhc1NhbWVDb250YWluZXIgPyB7XG4gICAgICAgICAgeDogMCxcbiAgICAgICAgICB5OiAwXG4gICAgICAgIH0gOiB7XG4gICAgICAgICAgeDogaXNBZnRlckFjdGl2ZSA/IGNvbGxpc2lvblJlY3Qud2lkdGggLSBuZXdSZWN0LndpZHRoIDogMCxcbiAgICAgICAgICB5OiBpc0FmdGVyQWN0aXZlID8gY29sbGlzaW9uUmVjdC5oZWlnaHQgLSBuZXdSZWN0LmhlaWdodCA6IDBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVjdENvb3JkaW5hdGVzID0ge1xuICAgICAgICAgIHg6IG5ld1JlY3QubGVmdCxcbiAgICAgICAgICB5OiBuZXdSZWN0LnRvcFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBuZXdDb29yZGluYXRlcyA9IG9mZnNldC54ICYmIG9mZnNldC55ID8gcmVjdENvb3JkaW5hdGVzIDogc3VidHJhY3QocmVjdENvb3JkaW5hdGVzLCBvZmZzZXQpO1xuICAgICAgICByZXR1cm4gbmV3Q29vcmRpbmF0ZXM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbmZ1bmN0aW9uIGlzU2FtZUNvbnRhaW5lcihhLCBiKSB7XG4gIGlmICghaGFzU29ydGFibGVEYXRhKGEpIHx8ICFoYXNTb3J0YWJsZURhdGEoYikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gYS5kYXRhLmN1cnJlbnQuc29ydGFibGUuY29udGFpbmVySWQgPT09IGIuZGF0YS5jdXJyZW50LnNvcnRhYmxlLmNvbnRhaW5lcklkO1xufVxuXG5mdW5jdGlvbiBpc0FmdGVyKGEsIGIpIHtcbiAgaWYgKCFoYXNTb3J0YWJsZURhdGEoYSkgfHwgIWhhc1NvcnRhYmxlRGF0YShiKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICghaXNTYW1lQ29udGFpbmVyKGEsIGIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGEuZGF0YS5jdXJyZW50LnNvcnRhYmxlLmluZGV4IDwgYi5kYXRhLmN1cnJlbnQuc29ydGFibGUuaW5kZXg7XG59XG5cbmV4cG9ydCB7IFNvcnRhYmxlQ29udGV4dCwgYXJyYXlNb3ZlLCBhcnJheVN3YXAsIGRlZmF1bHRBbmltYXRlTGF5b3V0Q2hhbmdlcywgZGVmYXVsdE5ld0luZGV4R2V0dGVyLCBoYXNTb3J0YWJsZURhdGEsIGhvcml6b250YWxMaXN0U29ydGluZ1N0cmF0ZWd5LCByZWN0U29ydGluZ1N0cmF0ZWd5LCByZWN0U3dhcHBpbmdTdHJhdGVneSwgc29ydGFibGVLZXlib2FyZENvb3JkaW5hdGVzLCB1c2VTb3J0YWJsZSwgdmVydGljYWxMaXN0U29ydGluZ1N0cmF0ZWd5IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zb3J0YWJsZS5lc20uanMubWFwXG4iLCJpbXBvcnQgUmVhY3QsIHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZBUUl0ZW1BY3Rpb25zUHJvcHMge1xuICAgIG9uRWRpdDogKCkgPT4gdm9pZDtcbiAgICBvbkRlbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBBY3Rpb24gYnV0dG9ucyBmb3IgZWRpdGluZyBtb2RlIC0gRWRpdCBhbmQgRGVsZXRlXG4gKiBOb3RlOiBNb3ZlIHVwL2Rvd24gaGFzIGJlZW4gcmVwbGFjZWQgd2l0aCBkcmFnLWFuZC1kcm9wIHJlb3JkZXJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZBUUl0ZW1BY3Rpb25zKHByb3BzOiBGQVFJdGVtQWN0aW9uc1Byb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7IG9uRWRpdCwgb25EZWxldGUgfSA9IHByb3BzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS1hY3Rpb25zXCI+XG4gICAgICAgICAgICB7LyogRWRpdCBCdXR0b24gKi99XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW0tYWN0aW9uLWJ0blwiLCBcImZhcS1hY3Rpb24tZWRpdFwiKX1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBvbkVkaXQoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiRWRpdCBGQVFcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJFZGl0IEZBUSBpdGVtXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTIuODU0IDEuMTQ2YS41LjUgMCAwIDAtLjcwOCAwTDEwIDMuMjkzIDEyLjcwNyA2bDIuMTQ3LTIuMTQ2YS41LjUgMCAwIDAgMC0uNzA4bC0yLTJ6TTExLjI5MyA0TDIgMTMuMjkzVjE2aDIuNzA3TDE0IDYuNzA3IDExLjI5MyA0elwiIC8+XG4gICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgey8qIERlbGV0ZSBCdXR0b24gKi99XG4gICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW0tYWN0aW9uLWJ0blwiLCBcImZhcS1hY3Rpb24tZGVsZXRlXCIpfVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIG9uRGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICB0aXRsZT1cIkRlbGV0ZSBGQVFcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJEZWxldGUgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk01LjUgNS41QS41LjUgMCAwIDEgNiA2djZhLjUuNSAwIDAgMS0xIDBWNmEuNS41IDAgMCAxIC41LS41em0yLjUgMGEuNS41IDAgMCAxIC41LjV2NmEuNS41IDAgMCAxLTEgMFY2YS41LjUgMCAwIDEgLjUtLjV6bTMgLjVhLjUuNSAwIDAgMC0xIDB2NmEuNS41IDAgMCAwIDEgMFY2elwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsUnVsZT1cImV2ZW5vZGRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZD1cIk0xNC41IDNhMSAxIDAgMCAxLTEgMUgxM3Y5YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjRoLS41YTEgMSAwIDAgMS0xLTFWMmExIDEgMCAwIDEgMS0xSDZhMSAxIDAgMCAxIDEtMWgyYTEgMSAwIDAgMSAxIDFoMy41YTEgMSAwIDAgMSAxIDF2MXpNNC4xMTggNEw0IDQuMDU5VjEzYTEgMSAwIDAgMCAxIDFoNmExIDEgMCAwIDAgMS0xVjQuMDU5TDExLjg4MiA0SDQuMTE4ek0yLjUgM1YyaDExdjFoLTExelwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgdXNlU29ydGFibGUgfSBmcm9tIFwiQGRuZC1raXQvc29ydGFibGVcIjtcbmltcG9ydCB7IENTUyB9IGZyb20gXCJAZG5kLWtpdC91dGlsaXRpZXNcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5pbXBvcnQgeyBGQVFJdGVtQWN0aW9ucyB9IGZyb20gXCIuL0ZBUUl0ZW1BY3Rpb25zXCI7XG5cbmludGVyZmFjZSBEcmFnZ2FibGVGQVFJdGVtUHJvcHMge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgaW5kZXg6IG51bWJlcjtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgcHJvY2Vzc2VkQ29udGVudDogc3RyaW5nO1xuICAgIHdhcm5pbmdzOiBzdHJpbmdbXTtcbiAgICBhbmltYXRpb25EdXJhdGlvbjogbnVtYmVyO1xuICAgIG9uRWRpdDogKCkgPT4gdm9pZDtcbiAgICBvbkRlbGV0ZTogKCkgPT4gdm9pZDtcbiAgICBjb2xsYXBzZUFsbD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBEcmFnZ2FibGVGQVFJdGVtKHtcbiAgICBpZCxcbiAgICBpbmRleCxcbiAgICBzdW1tYXJ5LFxuICAgIHByb2Nlc3NlZENvbnRlbnQsXG4gICAgd2FybmluZ3MsXG4gICAgYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgb25FZGl0LFxuICAgIG9uRGVsZXRlLFxuICAgIGNvbGxhcHNlQWxsID0gZmFsc2Vcbn06IERyYWdnYWJsZUZBUUl0ZW1Qcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3QgeyBhdHRyaWJ1dGVzLCBsaXN0ZW5lcnMsIHNldE5vZGVSZWYsIHRyYW5zZm9ybSwgdHJhbnNpdGlvbiwgaXNEcmFnZ2luZyB9ID0gdXNlU29ydGFibGUoe1xuICAgICAgICBpZFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICAgIHRyYW5zZm9ybTogQ1NTLlRyYW5zZm9ybS50b1N0cmluZyh0cmFuc2Zvcm0pLFxuICAgICAgICB0cmFuc2l0aW9uLFxuICAgICAgICBcIi0tYW5pbWF0aW9uLWR1cmF0aW9uXCI6IGAke2FuaW1hdGlvbkR1cmF0aW9ufW1zYFxuICAgIH0gYXMgUmVhY3QuQ1NTUHJvcGVydGllcztcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXZcbiAgICAgICAgICAgIHJlZj17c2V0Tm9kZVJlZn1cbiAgICAgICAgICAgIHN0eWxlPXtzdHlsZX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1pdGVtXCIsIFwiZmFxLWl0ZW0tLWVkaXQtbW9kZVwiLCB7XG4gICAgICAgICAgICAgICAgb3BlbjogIWNvbGxhcHNlQWxsLFxuICAgICAgICAgICAgICAgIFwiZmFxLWl0ZW0tLWRyYWdnaW5nXCI6IGlzRHJhZ2dpbmdcbiAgICAgICAgICAgIH0pfVxuICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLWhlYWRlci1lZGl0XCI+XG4gICAgICAgICAgICAgICAgey8qIERyYWcgSGFuZGxlICovfVxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWRyYWctaGFuZGxlXCJcbiAgICAgICAgICAgICAgICAgICAgey4uLmF0dHJpYnV0ZXN9XG4gICAgICAgICAgICAgICAgICAgIHsuLi5saXN0ZW5lcnN9XG4gICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9e2BEcmFnIHRvIHJlb3JkZXIgRkFRIGl0ZW0gJHtpbmRleCArIDF9OiAke3N1bW1hcnl9YH1cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8c3ZnIGZvY3VzYWJsZT1cImZhbHNlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMSAxOGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJtLTItOGMtMS4xIDAtMiAuOS0yIDJzLjkgMiAyIDIgMi0uOSAyLTItLjktMi0yLTJtMC02Yy0xLjEgMC0yIC45LTIgMnMuOSAyIDIgMiAyLS45IDItMi0uOS0yLTItMm02IDRjMS4xIDAgMi0uOSAyLTJzLS45LTItMi0yLTIgLjktMiAyIC45IDIgMiAybTAgMmMtMS4xIDAtMiAuOS0yIDJzLjkgMiAyIDIgMi0uOSAyLTItLjktMi0yLTJtMCA2Yy0xLjEgMC0yIC45LTIgMnMuOSAyIDIgMiAyLS45IDItMi0uOS0yLTItMlwiPjwvcGF0aD5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYXEtaXRlbS1zdW1tYXJ5LXRleHRcIj57c3VtbWFyeX08L3NwYW4+XG5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8RkFRSXRlbUFjdGlvbnMgb25FZGl0PXtvbkVkaXR9IG9uRGVsZXRlPXtvbkRlbGV0ZX0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAge3dhcm5pbmdzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLXdhcm5pbmdzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7d2FybmluZ3MubWFwKCh3YXJuaW5nLCB3SW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17d0luZGV4fSBjbGFzc05hbWU9XCJmYXEtaXRlbS13YXJuaW5nXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOKaoO+4jyB7d2FybmluZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tY29udGVudC1pbm5lclwiXG4gICAgICAgICAgICAgICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogcHJvY2Vzc2VkQ29udGVudCB9fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IENvbnRlbnRGb3JtYXRFbnVtIH0gZnJvbSBcIi4uLy4uL3R5cGluZ3MvRkFRQWNjb3JkaW9uUHJvcHNcIjtcbmltcG9ydCB7IHByb2Nlc3NDb250ZW50LCBnZXRDb250ZW50V2FybmluZ3MgfSBmcm9tIFwiLi4vdXRpbHMvY29udGVudFByb2Nlc3NvclwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcblxuaW50ZXJmYWNlIEVkaXRGQVFGb3JtUHJvcHMge1xuICAgIHN1bW1hcnk6IHN0cmluZztcbiAgICBjb250ZW50OiBzdHJpbmc7XG4gICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bTtcbiAgICBzb3J0T3JkZXI/OiBudW1iZXI7XG4gICAgb25TYXZlOiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gdm9pZDtcbiAgICBvbkNhbmNlbDogKCkgPT4gdm9pZDtcbiAgICBpc05ldz86IGJvb2xlYW47XG4gICAgaXNJbmxpbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRWRpdEZBUUZvcm0ocHJvcHM6IEVkaXRGQVFGb3JtUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHtcbiAgICAgICAgc3VtbWFyeTogaW5pdGlhbFN1bW1hcnksXG4gICAgICAgIGNvbnRlbnQ6IGluaXRpYWxDb250ZW50LFxuICAgICAgICBmb3JtYXQ6IGluaXRpYWxGb3JtYXQsXG4gICAgICAgIHNvcnRPcmRlcjogaW5pdGlhbFNvcnRPcmRlciA9IDEwLFxuICAgICAgICBvblNhdmUsXG4gICAgICAgIG9uQ2FuY2VsLFxuICAgICAgICBpc05ldyA9IGZhbHNlLFxuICAgICAgICBpc0lubGluZSA9IGZhbHNlXG4gICAgfSA9IHByb3BzO1xuXG4gICAgY29uc3QgW3N1bW1hcnksIHNldFN1bW1hcnldID0gdXNlU3RhdGUoaW5pdGlhbFN1bW1hcnkpO1xuICAgIGNvbnN0IFtjb250ZW50LCBzZXRDb250ZW50XSA9IHVzZVN0YXRlKGluaXRpYWxDb250ZW50KTtcbiAgICBjb25zdCBbZm9ybWF0LCBzZXRGb3JtYXRdID0gdXNlU3RhdGU8Q29udGVudEZvcm1hdEVudW0+KGluaXRpYWxGb3JtYXQpO1xuICAgIGNvbnN0IFtzb3J0T3JkZXIsIHNldFNvcnRPcmRlcl0gPSB1c2VTdGF0ZShpbml0aWFsU29ydE9yZGVyKTtcbiAgICBjb25zdCBbc2hvd1ByZXZpZXcsIHNldFNob3dQcmV2aWV3XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAgIC8vIFZhbGlkYXRpb24gd2FybmluZ3NcbiAgICBjb25zdCB3YXJuaW5ncyA9IGdldENvbnRlbnRXYXJuaW5ncyhjb250ZW50LCBmb3JtYXQpO1xuICAgIGNvbnN0IGhhc1dhcm5pbmdzID0gd2FybmluZ3MubGVuZ3RoID4gMDtcblxuICAgIGNvbnN0IGhhbmRsZVNhdmUgPSAoKSA9PiB7XG4gICAgICAgIGlmICghc3VtbWFyeS50cmltKCkpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiU3VtbWFyeS9RdWVzdGlvbiBpcyByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbnRlbnQudHJpbSgpKSB7XG4gICAgICAgICAgICBhbGVydChcIkNvbnRlbnQvQW5zd2VyIGlzIHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9uU2F2ZShzdW1tYXJ5LnRyaW0oKSwgY29udGVudC50cmltKCksIGZvcm1hdCwgc29ydE9yZGVyKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtZWRpdC1mb3JtXCIsIHsgXCJmYXEtZWRpdC1mb3JtLS1pbmxpbmVcIjogaXNJbmxpbmUgfSl9PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZWRpdC1mb3JtLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxoMz57aXNOZXcgPyBcIkFkZCBOZXcgRkFRXCIgOiBcIkVkaXQgRkFRXCJ9PC9oMz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1lZGl0LWZvcm0tY2xvc2VcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNhbmNlbH1cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJDbG9zZVwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICDinJVcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0LWZvcm0tYm9keVwiPlxuICAgICAgICAgICAgICAgIHsvKiBTdW1tYXJ5IEZpZWxkICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmYXEtc3VtbWFyeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgUXVlc3Rpb24vU3VtbWFyeSA8c3BhbiBjbGFzc05hbWU9XCJmYXEtcmVxdWlyZWRcIj4qPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiZmFxLXN1bW1hcnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWZvcm0taW5wdXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3N1bW1hcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFN1bW1hcnkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFbnRlciB0aGUgcXVlc3Rpb24gb3Igc3VtbWFyeS4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIFNvcnQgT3JkZXIgRmllbGQgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZhcS1zb3J0b3JkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFNvcnQgT3JkZXIgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLXJlcXVpcmVkXCI+Kjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZhcS1zb3J0b3JkZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZm9ybS1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c29ydE9yZGVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRTb3J0T3JkZXIoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluPVwiMFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwPVwiMTBcIlxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8c21hbGwgY2xhc3NOYW1lPVwiZmFxLWZvcm0taGVscFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgSXRlbXMgYXJlIGRpc3BsYXllZCBpbiBhc2NlbmRpbmcgc29ydCBvcmRlciAoMTAsIDIwLCAzMC4uLikuIExvd2VyIG51bWJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVhciBmaXJzdC5cbiAgICAgICAgICAgICAgICAgICAgPC9zbWFsbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBGb3JtYXQgRmllbGQgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZhcS1mb3JtYXRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIENvbnRlbnQgRm9ybWF0IDxzcGFuIGNsYXNzTmFtZT1cImZhcS1yZXF1aXJlZFwiPio8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiZmFxLWZvcm1hdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZm9ybS1zZWxlY3RcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1hdH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Rm9ybWF0KGUudGFyZ2V0LnZhbHVlIGFzIENvbnRlbnRGb3JtYXRFbnVtKX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImh0bWxcIj5IVE1MPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibWFya2Rvd25cIj5NYXJrZG93bjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInRleHRcIj5QbGFpbiBUZXh0PC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgICAgICA8c21hbGwgY2xhc3NOYW1lPVwiZmFxLWZvcm0taGVscFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdCA9PT0gXCJodG1sXCIgJiYgXCJBbGxvd3MgcmljaCBmb3JtYXR0aW5nIHdpdGggSFRNTCB0YWdzXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0ID09PSBcIm1hcmtkb3duXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlVzZXMgTWFya2Rvd24gc3ludGF4IChlLmcuLCAqKmJvbGQqKiwgIyBoZWFkaW5nKVwifVxuICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdCA9PT0gXCJ0ZXh0XCIgJiYgXCJQbGFpbiB0ZXh0IG9ubHksIEhUTUwgd2lsbCBiZSBlc2NhcGVkXCJ9XG4gICAgICAgICAgICAgICAgICAgIDwvc21hbGw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogQ29udGVudCBGaWVsZCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZmFxLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIEFuc3dlci9Db250ZW50IDxzcGFuIGNsYXNzTmFtZT1cImZhcS1yZXF1aXJlZFwiPio8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJmYXEtY29udGVudFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtZm9ybS10ZXh0YXJlYVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtZm9ybS10ZXh0YXJlYS0td2FybmluZ1wiOiBoYXNXYXJuaW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Q29udGVudChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkVudGVyIHRoZSBhbnN3ZXIgb3IgY29udGVudC4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICByb3dzPXsxMH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIFZhbGlkYXRpb24gV2FybmluZ3MgKi99XG4gICAgICAgICAgICAgICAgICAgIHtoYXNXYXJuaW5ncyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLXdhcm5pbmdzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHN0cm9uZz7imqDvuI8gQ29udGVudCBXYXJuaW5nczo8L3N0cm9uZz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3YXJuaW5ncy5tYXAoKHdhcm5pbmcsIGkpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2l9Pnt3YXJuaW5nfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBQcmV2aWV3IFRvZ2dsZSAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLXByZXZpZXctdG9nZ2xlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dQcmV2aWV3KCFzaG93UHJldmlldyl9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzaG93UHJldmlldyA/IFwiSGlkZVwiIDogXCJTaG93XCJ9IFByZXZpZXdcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogUHJldmlldyAqL31cbiAgICAgICAgICAgICAgICB7c2hvd1ByZXZpZXcgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLXByZXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoND5QcmV2aWV3OjwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWZvcm0tcHJldmlldy1jb250ZW50XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHByb2Nlc3NDb250ZW50KGNvbnRlbnQsIGZvcm1hdCkgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIEZvcm0gQWN0aW9ucyAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWVkaXQtZm9ybS1mb290ZXJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJmYXEtYnRuIGZhcS1idG4tc2Vjb25kYXJ5XCIgb25DbGljaz17b25DYW5jZWx9PlxuICAgICAgICAgICAgICAgICAgICBDYW5jZWxcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtYnRuIGZhcS1idG4tcHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVNhdmV9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshc3VtbWFyeS50cmltKCkgfHwgIWNvbnRlbnQudHJpbSgpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge2lzTmV3ID8gXCJDcmVhdGUgRkFRXCIgOiBcIlNhdmUgQ2hhbmdlc1wifVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQsIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBwcm9jZXNzQ29udGVudCwgZ2V0Q29udGVudFdhcm5pbmdzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3JcIjtcbmltcG9ydCB7IERyYWdnYWJsZUZBUUl0ZW0gfSBmcm9tIFwiLi9EcmFnZ2FibGVGQVFJdGVtXCI7XG5pbXBvcnQgeyBFZGl0RkFRRm9ybSB9IGZyb20gXCIuL0VkaXRGQVFGb3JtXCI7XG5pbXBvcnQgeyBGQVFJdGVtIH0gZnJvbSBcIi4uL2hvb2tzL3VzZUZBUURhdGFcIjtcbmltcG9ydCB7IENvbnRlbnRGb3JtYXRFbnVtIH0gZnJvbSBcIi4uLy4uL3R5cGluZ3MvRkFRQWNjb3JkaW9uUHJvcHNcIjtcbmltcG9ydCB7XG4gICAgRG5kQ29udGV4dCxcbiAgICBjbG9zZXN0Q2VudGVyLFxuICAgIEtleWJvYXJkU2Vuc29yLFxuICAgIFBvaW50ZXJTZW5zb3IsXG4gICAgdXNlU2Vuc29yLFxuICAgIHVzZVNlbnNvcnMsXG4gICAgRHJhZ0VuZEV2ZW50LFxuICAgIERyYWdTdGFydEV2ZW50XG59IGZyb20gXCJAZG5kLWtpdC9jb3JlXCI7XG5pbXBvcnQge1xuICAgIFNvcnRhYmxlQ29udGV4dCxcbiAgICBzb3J0YWJsZUtleWJvYXJkQ29vcmRpbmF0ZXMsXG4gICAgdmVydGljYWxMaXN0U29ydGluZ1N0cmF0ZWd5XG59IGZyb20gXCJAZG5kLWtpdC9zb3J0YWJsZVwiO1xuXG5pbnRlcmZhY2UgRkFRRWRpdGFibGVMaXN0UHJvcHMge1xuICAgIGl0ZW1zOiBGQVFJdGVtW107XG4gICAgc29ydGFibGVJZHM6IHN0cmluZ1tdO1xuICAgIGV4cGFuZGVkSXRlbXM6IFNldDxudW1iZXI+O1xuICAgIGFuaW1hdGlvbkR1cmF0aW9uOiBudW1iZXI7XG4gICAgb25FZGl0SXRlbTogKGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG4gICAgb25EZWxldGVJdGVtOiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZDtcbiAgICBvbkRyYWdFbmQ6IChldmVudDogRHJhZ0VuZEV2ZW50KSA9PiB2b2lkO1xuICAgIC8vIElubGluZSBlZGl0aW5nIHByb3BzXG4gICAgZWRpdGluZ0l0ZW1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBlZGl0aW5nU29ydE9yZGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgZGVmYXVsdFNvcnRPcmRlcjogbnVtYmVyO1xuICAgIG9uU2F2ZUVkaXQ6IChcbiAgICAgICAgc3VtbWFyeTogc3RyaW5nLFxuICAgICAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0sXG4gICAgICAgIHNvcnRPcmRlcjogbnVtYmVyXG4gICAgKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgIG9uQ2FuY2VsRWRpdDogKCkgPT4gdm9pZDtcbiAgICAvLyBJbmxpbmUgY3JlYXRlIHByb3BzXG4gICAgc2hvd0NyZWF0ZUZvcm06IGJvb2xlYW47XG4gICAgb25TYXZlTmV3OiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBvbkNhbmNlbENyZWF0ZTogKCkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBGQVEgaXRlbXMgbGlzdCBpbiBlZGl0IG1vZGUgd2l0aCBkcmFnLWFuZC1kcm9wIHJlb3JkZXJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZBUUVkaXRhYmxlTGlzdCh7XG4gICAgaXRlbXMsXG4gICAgc29ydGFibGVJZHMsXG4gICAgZXhwYW5kZWRJdGVtcyxcbiAgICBhbmltYXRpb25EdXJhdGlvbixcbiAgICBvbkVkaXRJdGVtLFxuICAgIG9uRGVsZXRlSXRlbSxcbiAgICBvbkRyYWdFbmQsXG4gICAgZWRpdGluZ0l0ZW1JbmRleCxcbiAgICBlZGl0aW5nU29ydE9yZGVyLFxuICAgIGRlZmF1bHRTb3J0T3JkZXIsXG4gICAgb25TYXZlRWRpdCxcbiAgICBvbkNhbmNlbEVkaXQsXG4gICAgc2hvd0NyZWF0ZUZvcm0sXG4gICAgb25TYXZlTmV3LFxuICAgIG9uQ2FuY2VsQ3JlYXRlXG59OiBGQVFFZGl0YWJsZUxpc3RQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3QgW2lzRHJhZ2dpbmdBbnksIHNldElzRHJhZ2dpbmdBbnldID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gICAgY29uc3Qgc2Vuc29ycyA9IHVzZVNlbnNvcnMoXG4gICAgICAgIHVzZVNlbnNvcihQb2ludGVyU2Vuc29yLCB7XG4gICAgICAgICAgICBhY3RpdmF0aW9uQ29uc3RyYWludDoge1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlOiA4XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICB1c2VTZW5zb3IoS2V5Ym9hcmRTZW5zb3IsIHtcbiAgICAgICAgICAgIGNvb3JkaW5hdGVHZXR0ZXI6IHNvcnRhYmxlS2V5Ym9hcmRDb29yZGluYXRlc1xuICAgICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBoYW5kbGVEcmFnU3RhcnQgPSAoX2V2ZW50OiBEcmFnU3RhcnRFdmVudCkgPT4ge1xuICAgICAgICBzZXRJc0RyYWdnaW5nQW55KHRydWUpO1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVEcmFnRW5kID0gKGV2ZW50OiBEcmFnRW5kRXZlbnQpID0+IHtcbiAgICAgICAgc2V0SXNEcmFnZ2luZ0FueShmYWxzZSk7XG4gICAgICAgIG9uRHJhZ0VuZChldmVudCk7XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxEbmRDb250ZXh0XG4gICAgICAgICAgICBzZW5zb3JzPXtzZW5zb3JzfVxuICAgICAgICAgICAgY29sbGlzaW9uRGV0ZWN0aW9uPXtjbG9zZXN0Q2VudGVyfVxuICAgICAgICAgICAgb25EcmFnU3RhcnQ9e2hhbmRsZURyYWdTdGFydH1cbiAgICAgICAgICAgIG9uRHJhZ0VuZD17aGFuZGxlRHJhZ0VuZH1cbiAgICAgICAgPlxuICAgICAgICAgICAgPFNvcnRhYmxlQ29udGV4dCBpdGVtcz17c29ydGFibGVJZHN9IHN0cmF0ZWd5PXt2ZXJ0aWNhbExpc3RTb3J0aW5nU3RyYXRlZ3l9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1pdGVtcyBmYXEtYWNjb3JkaW9uLWl0ZW1zLS1lZGl0LW1vZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgey8qIElubGluZSBDcmVhdGUgRm9ybSAtIGFwcGVhcnMgYXQgdG9wIG9mIGxpc3QgKi99XG4gICAgICAgICAgICAgICAgICAgIHtzaG93Q3JlYXRlRm9ybSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtIGZhcS1pdGVtLS1pbmxpbmUtY3JlYXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVkaXRGQVFGb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnk9XCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50PVwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0PVwiaHRtbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlcj17ZGVmYXVsdFNvcnRPcmRlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25TYXZlPXtvblNhdmVOZXd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbENyZWF0ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNOZXc9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzSW5saW5lPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICB7aXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpdGVtIGlzIGJlaW5nIGVkaXRlZCwgc2hvdyB0aGUgaW5saW5lIGZvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0aW5nSXRlbUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17c29ydGFibGVJZHNbaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWl0ZW0gZmFxLWl0ZW0tLWlubGluZS1lZGl0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEVkaXRGQVFGb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeT17aXRlbS5zdW1tYXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9e2l0ZW0uY29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ9e2l0ZW0uY29udGVudEZvcm1hdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI9e2VkaXRpbmdTb3J0T3JkZXIgPz8gZGVmYXVsdFNvcnRPcmRlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNhdmU9e29uU2F2ZUVkaXR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsRWRpdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc05ldz17ZmFsc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNJbmxpbmU9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9jZXNzZWRDb250ZW50ID0gcHJvY2Vzc0NvbnRlbnQoaXRlbS5jb250ZW50LCBpdGVtLmNvbnRlbnRGb3JtYXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2FybmluZ3MgPSBnZXRDb250ZW50V2FybmluZ3MoaXRlbS5jb250ZW50LCBpdGVtLmNvbnRlbnRGb3JtYXQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxEcmFnZ2FibGVGQVFJdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17c29ydGFibGVJZHNbaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD17c29ydGFibGVJZHNbaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleD17aW5kZXh9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1hcnk9e2l0ZW0uc3VtbWFyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkQ29udGVudD17cHJvY2Vzc2VkQ29udGVudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3M9e3dhcm5pbmdzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbj17YW5pbWF0aW9uRHVyYXRpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRWRpdD17KCkgPT4gb25FZGl0SXRlbShpbmRleCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGVsZXRlPXsoKSA9PiBvbkRlbGV0ZUl0ZW0oaW5kZXgpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsYXBzZUFsbD17aXNEcmFnZ2luZ0FueX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L1NvcnRhYmxlQ29udGV4dD5cbiAgICAgICAgPC9EbmRDb250ZXh0PlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcblxuaW50ZXJmYWNlIENvbmZpcm1EaWFsb2dQcm9wcyB7XG4gICAgaXNPcGVuOiBib29sZWFuO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIG9uQ29uZmlybTogKCkgPT4gdm9pZDtcbiAgICBvbkNhbmNlbDogKCkgPT4gdm9pZDtcbiAgICBjb25maXJtVGV4dD86IHN0cmluZztcbiAgICBjYW5jZWxUZXh0Pzogc3RyaW5nO1xuICAgIGlzRGVzdHJ1Y3RpdmU/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENvbmZpcm1hdGlvbiBkaWFsb2cgbW9kYWwgZm9yIGRlc3RydWN0aXZlIGFjdGlvbnMgKGUuZy4sIGRlbGV0ZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIENvbmZpcm1EaWFsb2cocHJvcHM6IENvbmZpcm1EaWFsb2dQcm9wcyk6IFJlYWN0RWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IHtcbiAgICAgICAgaXNPcGVuLFxuICAgICAgICB0aXRsZSxcbiAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgb25Db25maXJtLFxuICAgICAgICBvbkNhbmNlbCxcbiAgICAgICAgY29uZmlybVRleHQgPSBcIkNvbmZpcm1cIixcbiAgICAgICAgY2FuY2VsVGV4dCA9IFwiQ2FuY2VsXCIsXG4gICAgICAgIGlzRGVzdHJ1Y3RpdmUgPSBmYWxzZVxuICAgIH0gPSBwcm9wcztcblxuICAgIGlmICghaXNPcGVuKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZU92ZXJsYXlDbGljayA9IChlOiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxEaXZFbGVtZW50PikgPT4ge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IGUuY3VycmVudFRhcmdldCkge1xuICAgICAgICAgICAgb25DYW5jZWwoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2ctb3ZlcmxheVwiXG4gICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVPdmVybGF5Q2xpY2t9XG4gICAgICAgICAgICByb2xlPVwicHJlc2VudGF0aW9uXCJcbiAgICAgICAgPlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZ1wiXG4gICAgICAgICAgICAgICAgcm9sZT1cImFsZXJ0ZGlhbG9nXCJcbiAgICAgICAgICAgICAgICBhcmlhLWxhYmVsbGVkYnk9XCJkaWFsb2ctdGl0bGVcIlxuICAgICAgICAgICAgICAgIGFyaWEtZGVzY3JpYmVkYnk9XCJkaWFsb2ctbWVzc2FnZVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2ctaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIHtpc0Rlc3RydWN0aXZlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzdmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2ctaWNvbi13YXJuaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD1cIjI0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9XCIyNFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld0JveD1cIjAgMCAxNiAxNlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbD1cImN1cnJlbnRDb2xvclwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk04Ljk4MiAxLjU2NmExLjEzIDEuMTMgMCAwIDAtMS45NiAwTC4xNjUgMTMuMjMzYy0uNDU3Ljc3OC4wOTEgMS43NjcuOTggMS43NjdoMTMuNzEzYy44ODkgMCAxLjQzOC0uOTkuOTgtMS43NjdMOC45ODIgMS41NjZ6TTggNWMuNTM1IDAgLjk1NC40NjIuOS45OTVsLS4zNSAzLjUwN2EuNTUyLjU1MiAwIDAgMS0xLjEgMEw3LjEgNS45OTVBLjkwNS45MDUgMCAwIDEgOCA1em0uMDAyIDZhMSAxIDAgMSAxIDAgMiAxIDEgMCAwIDEgMC0yelwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPGgzIGlkPVwiZGlhbG9nLXRpdGxlXCIgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGlkPVwiZGlhbG9nLW1lc3NhZ2VcIiBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2ctbWVzc2FnZVwiPlxuICAgICAgICAgICAgICAgICAgICB7bWVzc2FnZX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nLWFjdGlvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtY29uZmlybS1kaWFsb2ctYnRuXCIsIFwiZmFxLWJ0bi1jYW5jZWxcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvbkNhbmNlbH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge2NhbmNlbFRleHR9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1jb25maXJtLWRpYWxvZy1idG5cIiwgXCJmYXEtYnRuLWNvbmZpcm1cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZmFxLWJ0bi1kZXN0cnVjdGl2ZVwiOiBpc0Rlc3RydWN0aXZlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ29uZmlybX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge2NvbmZpcm1UZXh0fVxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBDb25maXJtRGlhbG9nIH0gZnJvbSBcIi4vQ29uZmlybURpYWxvZ1wiO1xuXG5pbnRlcmZhY2UgRkFRTW9kYWxzUHJvcHMge1xuICAgIC8vIERlbGV0ZSBjb25maXJtYXRpb24gcHJvcHNcbiAgICBkZWxldGVDb25maXJtSW5kZXg6IG51bWJlciB8IG51bGw7XG4gICAgb25Db25maXJtRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIG9uQ2FuY2VsRGVsZXRlOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIENvbXBvbmVudCB0aGF0IHJlbmRlcnMgRkFRIG1vZGFscyAoZGVsZXRlIGNvbmZpcm1hdGlvbilcbiAqIE5vdGU6IENyZWF0ZSBhbmQgRWRpdCBmb3JtcyBhcmUgbm93IHJlbmRlcmVkIGlubGluZSBpbiBGQVFFZGl0YWJsZUxpc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEZBUU1vZGFscyh7XG4gICAgZGVsZXRlQ29uZmlybUluZGV4LFxuICAgIG9uQ29uZmlybURlbGV0ZSxcbiAgICBvbkNhbmNlbERlbGV0ZVxufTogRkFRTW9kYWxzUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgICB7LyogRGVsZXRlIENvbmZpcm1hdGlvbiBEaWFsb2cgKi99XG4gICAgICAgICAgICA8Q29uZmlybURpYWxvZ1xuICAgICAgICAgICAgICAgIGlzT3Blbj17ZGVsZXRlQ29uZmlybUluZGV4ICE9PSBudWxsfVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiRGVsZXRlIEZBUSBJdGVtXCJcbiAgICAgICAgICAgICAgICBtZXNzYWdlPVwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIEZBUSBpdGVtPyBUaGlzIGFjdGlvbiBjYW5ub3QgYmUgdW5kb25lLlwiXG4gICAgICAgICAgICAgICAgb25Db25maXJtPXtvbkNvbmZpcm1EZWxldGV9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsRGVsZXRlfVxuICAgICAgICAgICAgICAgIGNvbmZpcm1UZXh0PVwiRGVsZXRlXCJcbiAgICAgICAgICAgICAgICBjYW5jZWxUZXh0PVwiQ2FuY2VsXCJcbiAgICAgICAgICAgICAgICBpc0Rlc3RydWN0aXZlPXt0cnVlfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgPC8+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCwgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlTWVtbyB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgRkFRQWNjb3JkaW9uQ29udGFpbmVyUHJvcHMgfSBmcm9tIFwiLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuaW1wb3J0IFwiLi91aS9GQVFBY2NvcmRpb24uc2Nzc1wiO1xuaW1wb3J0IHsgY2hlY2tVc2VyUm9sZSwgY2FuRWRpdCB9IGZyb20gXCIuL3V0aWxzL2VkaXRpbmdVdGlsc1wiO1xuaW1wb3J0IHsgdXNlRWRpdE1vZGUgfSBmcm9tIFwiLi9ob29rcy91c2VFZGl0TW9kZVwiO1xuaW1wb3J0IHsgdXNlRkFRRGF0YSB9IGZyb20gXCIuL2hvb2tzL3VzZUZBUURhdGFcIjtcbmltcG9ydCB7IHVzZUZBUUFjdGlvbnMgfSBmcm9tIFwiLi9ob29rcy91c2VGQVFBY3Rpb25zXCI7XG5pbXBvcnQgeyBGQVFIZWFkZXIgfSBmcm9tIFwiLi9jb21wb25lbnRzL0ZBUUhlYWRlclwiO1xuaW1wb3J0IHsgRkFRSXRlbXNMaXN0IH0gZnJvbSBcIi4vY29tcG9uZW50cy9GQVFJdGVtc0xpc3RcIjtcbmltcG9ydCB7IEZBUUVkaXRhYmxlTGlzdCB9IGZyb20gXCIuL2NvbXBvbmVudHMvRkFRRWRpdGFibGVMaXN0XCI7XG5pbXBvcnQgeyBGQVFNb2RhbHMgfSBmcm9tIFwiLi9jb21wb25lbnRzL0ZBUU1vZGFsc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gRkFRQWNjb3JkaW9uKHByb3BzOiBGQVFBY2NvcmRpb25Db250YWluZXJQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3Qge1xuICAgICAgICBkYXRhU291cmNlVHlwZSxcbiAgICAgICAgZmFxSXRlbXMsXG4gICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgIGRlZmF1bHRFeHBhbmRBbGwsXG4gICAgICAgIHNob3dUb2dnbGVCdXR0b24sXG4gICAgICAgIHRvZ2dsZUJ1dHRvblRleHQsXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICBhbGxvd0VkaXRpbmcsXG4gICAgICAgIGVkaXRvclJvbGUsXG4gICAgICAgIG9uU2F2ZUFjdGlvbixcbiAgICAgICAgb25EZWxldGVBY3Rpb24sXG4gICAgICAgIG9uQ3JlYXRlQWN0aW9uLFxuICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGUsXG4gICAgICAgIC8vIEF0dHJpYnV0ZSBvdmVycmlkZXMgKG9wdGlvbmFsKVxuICAgICAgICBzdW1tYXJ5QXR0cmlidXRlLFxuICAgICAgICBjb250ZW50QXR0cmlidXRlLFxuICAgICAgICBjb250ZW50Rm9ybWF0QXR0cmlidXRlLFxuICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZVxuICAgIH0gPSBwcm9wcztcblxuICAgIC8vIEF0dHJpYnV0ZSBvdmVycmlkZXMgZm9yIHVzZUZBUURhdGEgYW5kIHVzZUZBUUFjdGlvbnMgKHBhc3MgdGhlIExpc3RBdHRyaWJ1dGVWYWx1ZSBvYmplY3RzIGRpcmVjdGx5KVxuICAgIGNvbnN0IGF0dHJpYnV0ZU92ZXJyaWRlcyA9IHVzZU1lbW8oXG4gICAgICAgICgpID0+ICh7XG4gICAgICAgICAgICBzdW1tYXJ5QXR0cmlidXRlLFxuICAgICAgICAgICAgY29udGVudEF0dHJpYnV0ZSxcbiAgICAgICAgICAgIGNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUsXG4gICAgICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZVxuICAgICAgICB9KSxcbiAgICAgICAgW3N1bW1hcnlBdHRyaWJ1dGUsIGNvbnRlbnRBdHRyaWJ1dGUsIGNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUsIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlXVxuICAgICk7XG5cbiAgICAvLyBEYXRhIGZldGNoaW5nIGFuZCBzdGF0ZVxuICAgIGNvbnN0IHsgaXRlbXMsIGlzTG9hZGluZywgZGVmYXVsdFNvcnRPcmRlciwgc29ydGFibGVJZHMgfSA9IHVzZUZBUURhdGEoe1xuICAgICAgICBkYXRhU291cmNlVHlwZSxcbiAgICAgICAgZGF0YVNvdXJjZSxcbiAgICAgICAgZmFxSXRlbXMsXG4gICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZSxcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzXG4gICAgfSk7XG5cbiAgICAvLyBFZGl0aW5nIHN0YXRlXG4gICAgY29uc3QgZWRpdFN0YXRlID0gdXNlRWRpdE1vZGUoKTtcbiAgICBjb25zdCBbdXNlckhhc1JvbGUsIHNldFVzZXJIYXNSb2xlXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAgIC8vIENSVUQgYWN0aW9uc1xuICAgIGNvbnN0IHsgaGFuZGxlU2F2ZUVkaXQsIGhhbmRsZVNhdmVOZXcsIGhhbmRsZUNvbmZpcm1EZWxldGUsIGhhbmRsZURyYWdFbmQgfSA9IHVzZUZBUUFjdGlvbnMoe1xuICAgICAgICBkYXRhU291cmNlVHlwZSxcbiAgICAgICAgZGF0YVNvdXJjZSxcbiAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlLFxuICAgICAgICBlZGl0U3RhdGUsXG4gICAgICAgIG9uU2F2ZUFjdGlvbixcbiAgICAgICAgb25EZWxldGVBY3Rpb24sXG4gICAgICAgIG9uQ3JlYXRlQWN0aW9uLFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXNcbiAgICB9KTtcblxuICAgIC8vIFN0YXRlIHRvIHRyYWNrIHdoaWNoIGl0ZW1zIGFyZSBleHBhbmRlZFxuICAgIGNvbnN0IFtleHBhbmRlZEl0ZW1zLCBzZXRFeHBhbmRlZEl0ZW1zXSA9IHVzZVN0YXRlPFNldDxudW1iZXI+PihuZXcgU2V0KCkpO1xuICAgIGNvbnN0IFthbGxFeHBhbmRlZCwgc2V0QWxsRXhwYW5kZWRdID0gdXNlU3RhdGUoZGVmYXVsdEV4cGFuZEFsbCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZWRpdGluZyBzb3J0IG9yZGVyIGZvciB0aGUgZWRpdCBmb3JtXG4gICAgY29uc3QgZWRpdGluZ1NvcnRPcmRlciA9IHVzZU1lbW8oKCkgPT4ge1xuICAgICAgICBpZiAoZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3J0T3JkZXJGcm9tSXRlbXMgPSBpdGVtc1tlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleF0/LnNvcnRPcmRlcjtcbiAgICAgICAgaWYgKHNvcnRPcmRlckZyb21JdGVtcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc29ydE9yZGVyRnJvbUl0ZW1zO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJlxuICAgICAgICAgICAgZGF0YVNvdXJjZSAmJlxuICAgICAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlICYmXG4gICAgICAgICAgICBkYXRhU291cmNlLml0ZW1zPy5bZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXhdXG4gICAgICAgICkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByYXcgPSBzb3J0T3JkZXJBdHRyaWJ1dGUuZ2V0KFxuICAgICAgICAgICAgICAgICAgICBkYXRhU291cmNlLml0ZW1zW2VkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4XVxuICAgICAgICAgICAgICAgICkudmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdyA/IE51bWJlcihyYXcudG9TdHJpbmcoKSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gcmVhZCBzb3J0IG9yZGVyIGZvciBlZGl0IGZvcm1cIiwgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSwgW2RhdGFTb3VyY2UsIGRhdGFTb3VyY2VUeXBlLCBlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleCwgaXRlbXMsIHNvcnRPcmRlckF0dHJpYnV0ZV0pO1xuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgcmVxdWlyZWQgcm9sZVxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoZWNrUm9sZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmIChhbGxvd0VkaXRpbmcgJiYgZWRpdG9yUm9sZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhc1JvbGUgPSBhd2FpdCBjaGVja1VzZXJSb2xlKGVkaXRvclJvbGUpO1xuICAgICAgICAgICAgICAgIHNldFVzZXJIYXNSb2xlKGhhc1JvbGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhbGxvd0VkaXRpbmcgJiYgIWVkaXRvclJvbGUpIHtcbiAgICAgICAgICAgICAgICBzZXRVc2VySGFzUm9sZSh0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VXNlckhhc1JvbGUoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNoZWNrUm9sZSgpO1xuICAgIH0sIFthbGxvd0VkaXRpbmcsIGVkaXRvclJvbGVdKTtcblxuICAgIC8vIEluaXRpYWxpemUgZXhwYW5kZWQgc3RhdGUgYmFzZWQgb24gZGVmYXVsdEV4cGFuZEFsbFxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChkZWZhdWx0RXhwYW5kQWxsKSB7XG4gICAgICAgICAgICBjb25zdCBhbGxJbmRpY2VzID0gbmV3IFNldChpdGVtcz8ubWFwKChfLCBpbmRleCkgPT4gaW5kZXgpIHx8IFtdKTtcbiAgICAgICAgICAgIHNldEV4cGFuZGVkSXRlbXMoYWxsSW5kaWNlcyk7XG4gICAgICAgIH1cbiAgICB9LCBbZGVmYXVsdEV4cGFuZEFsbCwgaXRlbXNdKTtcblxuICAgIC8vIFRvZ2dsZSBpbmRpdmlkdWFsIGl0ZW1cbiAgICBjb25zdCB0b2dnbGVJdGVtID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RXhwYW5kZWRJdGVtcygocHJldikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3U2V0ID0gbmV3IFNldChwcmV2KTtcbiAgICAgICAgICAgIGlmIChuZXdTZXQuaGFzKGluZGV4KSkge1xuICAgICAgICAgICAgICAgIG5ld1NldC5kZWxldGUoaW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdTZXQuYWRkKGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdTZXQ7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBUb2dnbGUgYWxsIGl0ZW1zXG4gICAgY29uc3QgdG9nZ2xlQWxsID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoYWxsRXhwYW5kZWQpIHtcbiAgICAgICAgICAgIHNldEV4cGFuZGVkSXRlbXMobmV3IFNldCgpKTtcbiAgICAgICAgICAgIHNldEFsbEV4cGFuZGVkKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGFsbEluZGljZXMgPSBuZXcgU2V0KGl0ZW1zPy5tYXAoKF8sIGluZGV4KSA9PiBpbmRleCkgfHwgW10pO1xuICAgICAgICAgICAgc2V0RXhwYW5kZWRJdGVtcyhhbGxJbmRpY2VzKTtcbiAgICAgICAgICAgIHNldEFsbEV4cGFuZGVkKHRydWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFVwZGF0ZSBhbGxFeHBhbmRlZCBzdGF0ZSBiYXNlZCBvbiBpbmRpdmlkdWFsIHRvZ2dsZXNcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoaXRlbXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGFsbEFyZUV4cGFuZGVkID0gaXRlbXMubGVuZ3RoID4gMCAmJiBleHBhbmRlZEl0ZW1zLnNpemUgPT09IGl0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgIHNldEFsbEV4cGFuZGVkKGFsbEFyZUV4cGFuZGVkKTtcbiAgICAgICAgfVxuICAgIH0sIFtleHBhbmRlZEl0ZW1zLCBpdGVtc10pO1xuXG4gICAgLy8gRGV0ZXJtaW5lIGlmIGVkaXRpbmcgaXMgZW5hYmxlZFxuICAgIGNvbnN0IGlzRWRpdGluZ0VuYWJsZWQgPSBjYW5FZGl0KGFsbG93RWRpdGluZywgZGF0YVNvdXJjZVR5cGUsIHVzZXJIYXNSb2xlKTtcblxuICAgIC8vIEV2ZW50IGhhbmRsZXJzXG4gICAgY29uc3QgaGFuZGxlQ2FuY2VsRWRpdCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGVkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlZGl0U3RhdGUuc2hvd0NyZWF0ZUZvcm0pIHtcbiAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxDcmVhdGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNob3cgbG9hZGluZyBzdGF0ZSBmb3IgZGF0YWJhc2UgbW9kZVxuICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1sb2FkaW5nXCI+XG4gICAgICAgICAgICAgICAgPHA+TG9hZGluZyBGQVEgaXRlbXMuLi48L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWl0ZW1zIHx8IGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWVtcHR5XCI+XG4gICAgICAgICAgICAgICAgPHA+Tm8gRkFRIGl0ZW1zIGNvbmZpZ3VyZWQ8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24tY29udGFpbmVyXCI+XG4gICAgICAgICAgICA8RkFRSGVhZGVyXG4gICAgICAgICAgICAgICAgc2hvd1RvZ2dsZUJ1dHRvbj17c2hvd1RvZ2dsZUJ1dHRvbn1cbiAgICAgICAgICAgICAgICBhbGxFeHBhbmRlZD17YWxsRXhwYW5kZWR9XG4gICAgICAgICAgICAgICAgdG9nZ2xlQnV0dG9uVGV4dD17dG9nZ2xlQnV0dG9uVGV4dD8udmFsdWV9XG4gICAgICAgICAgICAgICAgb25Ub2dnbGVBbGw9e3RvZ2dsZUFsbH1cbiAgICAgICAgICAgICAgICBpc0VkaXRpbmdFbmFibGVkPXtpc0VkaXRpbmdFbmFibGVkfVxuICAgICAgICAgICAgICAgIGVkaXRNb2RlPXtlZGl0U3RhdGUuZWRpdE1vZGV9XG4gICAgICAgICAgICAgICAgb25Ub2dnbGVFZGl0TW9kZT17ZWRpdFN0YXRlLnRvZ2dsZUVkaXRNb2RlfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlTmV3PXtlZGl0U3RhdGUuc3RhcnRDcmVhdGluZ31cbiAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgIHtlZGl0U3RhdGUuZWRpdE1vZGUgJiYgaXNFZGl0aW5nRW5hYmxlZCA/IChcbiAgICAgICAgICAgICAgICA8RkFRRWRpdGFibGVMaXN0XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zPXtpdGVtc31cbiAgICAgICAgICAgICAgICAgICAgc29ydGFibGVJZHM9e3NvcnRhYmxlSWRzfVxuICAgICAgICAgICAgICAgICAgICBleHBhbmRlZEl0ZW1zPXtleHBhbmRlZEl0ZW1zfVxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbj17YW5pbWF0aW9uRHVyYXRpb24gfHwgMzAwfVxuICAgICAgICAgICAgICAgICAgICBvbkVkaXRJdGVtPXtlZGl0U3RhdGUuc3RhcnRFZGl0aW5nSXRlbX1cbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGVJdGVtPXtlZGl0U3RhdGUuc3RhcnREZWxldGluZ31cbiAgICAgICAgICAgICAgICAgICAgb25EcmFnRW5kPXtoYW5kbGVEcmFnRW5kfVxuICAgICAgICAgICAgICAgICAgICBlZGl0aW5nSXRlbUluZGV4PXtlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleH1cbiAgICAgICAgICAgICAgICAgICAgZWRpdGluZ1NvcnRPcmRlcj17ZWRpdGluZ1NvcnRPcmRlcn1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFNvcnRPcmRlcj17ZGVmYXVsdFNvcnRPcmRlcn1cbiAgICAgICAgICAgICAgICAgICAgb25TYXZlRWRpdD17aGFuZGxlU2F2ZUVkaXR9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsRWRpdD17aGFuZGxlQ2FuY2VsRWRpdH1cbiAgICAgICAgICAgICAgICAgICAgc2hvd0NyZWF0ZUZvcm09e2VkaXRTdGF0ZS5zaG93Q3JlYXRlRm9ybX1cbiAgICAgICAgICAgICAgICAgICAgb25TYXZlTmV3PXtoYW5kbGVTYXZlTmV3fVxuICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbENyZWF0ZT17aGFuZGxlQ2FuY2VsRWRpdH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8RkFRSXRlbXNMaXN0XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zPXtpdGVtc31cbiAgICAgICAgICAgICAgICAgICAgZXhwYW5kZWRJdGVtcz17ZXhwYW5kZWRJdGVtc31cbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb249e2FuaW1hdGlvbkR1cmF0aW9uIHx8IDMwMH1cbiAgICAgICAgICAgICAgICAgICAgb25Ub2dnbGVJdGVtPXt0b2dnbGVJdGVtfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8RkFRTW9kYWxzXG4gICAgICAgICAgICAgICAgZGVsZXRlQ29uZmlybUluZGV4PXtlZGl0U3RhdGUuZGVsZXRlQ29uZmlybUluZGV4fVxuICAgICAgICAgICAgICAgIG9uQ29uZmlybURlbGV0ZT17aGFuZGxlQ29uZmlybURlbGV0ZX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbERlbGV0ZT17ZWRpdFN0YXRlLmNhbmNlbERlbGV0ZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iXSwibmFtZXMiOlsidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwidXNlQ2FsbGJhY2siLCJoYXNPd24iLCJoYXNPd25Qcm9wZXJ0eSIsImNsYXNzTmFtZXMiLCJjbGFzc2VzIiwiaSIsImFyZ3VtZW50cyIsImxlbmd0aCIsImFyZyIsImFwcGVuZENsYXNzIiwicGFyc2VWYWx1ZSIsIkFycmF5IiwiaXNBcnJheSIsImFwcGx5IiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpbmNsdWRlcyIsImtleSIsImNhbGwiLCJ2YWx1ZSIsIm5ld0NsYXNzIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlZmF1bHQiLCJ3aW5kb3ciLCJfanN4IiwiX2pzeHMiLCJfRnJhZ21lbnQiLCJlbnRyaWVzIiwic2V0UHJvdG90eXBlT2YiLCJpc0Zyb3plbiIsImdldFByb3RvdHlwZU9mIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZnJlZXplIiwic2VhbCIsImNyZWF0ZSIsImNvbnN0cnVjdCIsIlJlZmxlY3QiLCJ4IiwiZnVuYyIsInRoaXNBcmciLCJfbGVuIiwiYXJncyIsIl9rZXkiLCJGdW5jIiwiX2xlbjIiLCJfa2V5MiIsImFycmF5Rm9yRWFjaCIsInVuYXBwbHkiLCJmb3JFYWNoIiwiYXJyYXlMYXN0SW5kZXhPZiIsImxhc3RJbmRleE9mIiwiYXJyYXlQb3AiLCJwb3AiLCJhcnJheVB1c2giLCJwdXNoIiwiYXJyYXlTcGxpY2UiLCJzcGxpY2UiLCJzdHJpbmdUb0xvd2VyQ2FzZSIsIlN0cmluZyIsInRvTG93ZXJDYXNlIiwic3RyaW5nVG9TdHJpbmciLCJzdHJpbmdNYXRjaCIsIm1hdGNoIiwic3RyaW5nUmVwbGFjZSIsInJlcGxhY2UiLCJzdHJpbmdJbmRleE9mIiwiaW5kZXhPZiIsInN0cmluZ1RyaW0iLCJ0cmltIiwib2JqZWN0SGFzT3duUHJvcGVydHkiLCJyZWdFeHBUZXN0IiwiUmVnRXhwIiwidGVzdCIsInR5cGVFcnJvckNyZWF0ZSIsInVuY29uc3RydWN0IiwiVHlwZUVycm9yIiwibGFzdEluZGV4IiwiX2xlbjMiLCJfa2V5MyIsIl9sZW40IiwiX2tleTQiLCJhZGRUb1NldCIsInNldCIsImFycmF5IiwidHJhbnNmb3JtQ2FzZUZ1bmMiLCJ1bmRlZmluZWQiLCJsIiwiZWxlbWVudCIsImxjRWxlbWVudCIsImNsZWFuQXJyYXkiLCJpbmRleCIsImlzUHJvcGVydHlFeGlzdCIsImNsb25lIiwib2JqZWN0IiwibmV3T2JqZWN0IiwicHJvcGVydHkiLCJjb25zdHJ1Y3RvciIsImxvb2t1cEdldHRlciIsInByb3AiLCJkZXNjIiwiZ2V0IiwiZmFsbGJhY2tWYWx1ZSIsIkwiLCJhc3luYyIsImJyZWFrcyIsImV4dGVuc2lvbnMiLCJnZm0iLCJob29rcyIsInBlZGFudGljIiwicmVuZGVyZXIiLCJzaWxlbnQiLCJ0b2tlbml6ZXIiLCJ3YWxrVG9rZW5zIiwiVCIsIloiLCJ1IiwiRE9NUHVyaWZ5IiwibWFya2VkIiwidXNlQ29tYmluZWRSZWZzIiwicmVmcyIsIm5vZGUiLCJyZWYiLCJoaWRkZW5TdHlsZXMiLCJkaXNwbGF5IiwiSGlkZGVuVGV4dCIsIl9yZWYiLCJpZCIsIlJlYWN0IiwiY3JlYXRlRWxlbWVudCIsInN0eWxlIiwiRG5kTW9uaXRvckNvbnRleHQiLCJjcmVhdGVDb250ZXh0IiwiYXJyYXlNb3ZlIiwiZnJvbSIsInRvIiwibmV3QXJyYXkiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7SUFBQTs7SUFFRztJQUVIOzs7O0lBSUc7SUFDSSxlQUFlLGFBQWEsQ0FBQyxZQUFvQixFQUFBOztRQUVwRCxJQUFJLENBQUMsWUFBWSxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDN0MsUUFBQSxPQUFPLElBQUksQ0FBQztTQUNmO0lBRUQsSUFBQSxJQUFJOzs7OztJQUtBLFFBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsWUFBWSxDQUFBLENBQUUsQ0FBQyxDQUFDO0lBQzlDLFFBQUEsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUFDLE9BQU8sS0FBSyxFQUFFO0lBQ1osUUFBQSxPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xELFFBQUEsT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDTCxDQUFDO0lBRUQ7Ozs7OztJQU1HO2FBQ2EsT0FBTyxDQUFDLFlBQXFCLEVBQUUsY0FBc0IsRUFBRSxPQUFnQixFQUFBOztJQUVuRixJQUFBLElBQUksY0FB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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUM5TU8sU0FBU0MsSUFBNEc7TUFDMUgsT0FBTztJQUNMQyxJQUFBQSxLQUFBLEVBQU8sQ0FBQSxDQUFBO0lBQ1BDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7SUFDUkMsSUFBQUEsVUFBQSxFQUFZLElBQUE7SUFDWkMsSUFBQUEsR0FBQSxFQUFLLENBQUEsQ0FBQTtJQUNMQyxJQUFBQSxLQUFBLEVBQU8sSUFBQTtJQUNQQyxJQUFBQSxRQUFBLEVBQVUsQ0FBQSxDQUFBO0lBQ1ZDLElBQUFBLFFBQUEsRUFBVSxJQUFBO0lBQ1ZDLElBQUFBLE1BQUEsRUFBUSxDQUFBLENBQUE7SUFDUkMsSUFBQUEsU0FBQSxFQUFXLElBQUE7SUFDWEMsSUFBQUEsVUFBQSxFQUFZLElBQUE7T0FFaEIsQ0FBQTtJQUFBLENBQUE7SUFFTyxJQUFJQyxDQUFBLEdBQXFDWCxDQUFBLEVBQWEsQ0FBQTtJQUV0RCxTQUFTWSxDQUFBQSxDQUErREMsQ0FBQSxFQUEwRDtJQUN2SUYsRUFBQUEsQ0FBQSxHQUFZRSxDQUNkLENBQUE7SUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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RyxLQUFBLENBQUFDLGFBQUEsQ0FBQSxLQUFBLEVBQUE7SUFBS0YsSUFBQUEsRUFBRSxFQUFFQSxFQUFBO0lBQUlHLElBQUFBLEtBQUssRUFBRVAsWUFBQUE7SUFBcEIsR0FBQSxFQUNHeEcsS0FESCxDQURGLENBQUE7SUFLRCxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDYk0sTUFBTWdILGlCQUFpQixnQkFBR0MsbUJBQWEsQ0FBMEIsSUFBMUIsQ0FBdkMsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNKUDs7O0lBR2dCQyxTQUFBQSxTQUFBQSxDQUFhakQsS0FBQSxFQUFZa0QsSUFBQSxFQUFjQyxFQUFBLEVBQUE7SUFDckQsRUFBQSxNQUFNQyxRQUFRLEdBQUdwRCxLQUFLLENBQUNxRCxLQUFOLEVBQWpCLENBQUE7TUFDQUQsUUFBUSxDQUFDL0UsTUFBVCxDQUNFOEUsRUFBRSxHQUFHLENBQUwsR0FBU0MsUUFBUSxDQUFDbEksTUFBVCxHQUFrQmlJLEVBQTNCLEdBQWdDQSxFQURsQyxFQUVFLENBRkYsRUFHRUMsUUFBUSxDQUFDL0UsTUFBVCxDQUFnQjZFLElBQWhCLEVBQXNCLENBQXRCLENBQXlCLENBQUEsQ0FBekIsQ0FIRixDQUFBLENBQUE7SUFNQSxFQUFBLE9BQU9FLFFBQVAsQ0FBQTtJQUNELENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNKRDs7O0lBR0c7SUFDRyxTQUFVLGNBQWMsQ0FBQyxLQUEwQixFQUFBO0lBQ3JELElBQUEsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFbkMsUUFDSTlHLGVBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsa0JBQWtCLGFBRTdCRCxjQUNJLENBQUEsUUFBQSxFQUFBLEVBQUEsSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUUsVUFBVSxDQUFDLHFCQUFxQixFQUFFLGlCQUFpQixDQUFDLEVBQy9ELE9BQU8sRUFBRSxDQUFDLENBQUMsS0FBSTt3QkFDWCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDcEIsb0JBQUEsTUFBTSxFQUFFLENBQUM7cUJBQ1osRUFDRCxLQUFLLEVBQUMsVUFBVSxnQkFDTCxlQUFlLEVBQUEsUUFBQSxFQUUxQkEsY0FBSyxDQUFBLEtBQUEsRUFBQSxFQUFBLEtBQUssRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFDLElBQUksRUFBQyxPQUFPLEVBQUMsV0FBVyxFQUFDLElBQUksRUFBQyxjQUFjLEVBQy9ELFFBQUEsRUFBQUEsY0FBQSxDQUFBLE1BQUEsRUFBQSxFQUFNLENBQUMsRUFBQyxxSUFBcUksRUFBRyxDQUFBLEVBQUEsQ0FDOUksRUFDRCxDQUFBLEVBR1RBLDJCQUNJLElBQUksRUFBQyxRQUFRLEVBQ2IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxtQkFBbUIsQ0FBQyxFQUNqRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEtBQUk7d0JBQ1gsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3BCLG9CQUFBLFFBQVEsRUFBRSxDQUFDO0lBQ2YsaUJBQUMsRUFDRCxLQUFLLEVBQUMsWUFBWSxFQUNQLFlBQUEsRUFBQSxpQkFBaUIsWUFFNUJDLGVBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxLQUFLLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBQyxJQUFJLEVBQUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxJQUFJLEVBQUMsY0FBYyxFQUFBLFFBQUEsRUFBQSxDQUMvREQseUJBQU0sQ0FBQyxFQUFDLGlLQUFpSyxFQUFHLENBQUEsRUFDNUtBLHlCQUNJLFFBQVEsRUFBQyxTQUFTLEVBQ2xCLENBQUMsRUFBQyw0T0FBNE8sRUFBQSxDQUNoUCxJQUNBLEVBQ0QsQ0FBQSxDQUFBLEVBQUEsQ0FDUCxFQUNSO0lBQ047O0lDcENNLFNBQVUsZ0JBQWdCLENBQUMsRUFDN0IsRUFBRSxFQUNGLEtBQUssRUFDTCxPQUFPLEVBQ1AsZ0JBQWdCLEVBQ2hCLFFBQVEsRUFDUixpQkFBaUIsRUFDakIsTUFBTSxFQUNOLFFBQVEsRUFDUixXQUFXLEdBQUcsS0FBSyxFQUNDLEVBQUE7SUFDcEIsSUFBQSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsR0FBRyxXQUFXLENBQUM7WUFDekYsRUFBRTtJQUNMLEtBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBQSxNQUFNLEtBQUssR0FBRztZQUNWLFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDNUMsVUFBVTtZQUNWLHNCQUFzQixFQUFFLENBQUcsRUFBQSxpQkFBaUIsQ0FBSSxFQUFBLENBQUE7U0FDNUIsQ0FBQztJQUV6QixJQUFBLFFBQ0lDLGVBQ0ksQ0FBQSxLQUFBLEVBQUEsRUFBQSxHQUFHLEVBQUUsVUFBVSxFQUNmLEtBQUssRUFBRSxLQUFLLEVBQ1osU0FBUyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUscUJBQXFCLEVBQUU7Z0JBQ3JELElBQUksRUFBRSxDQUFDLFdBQVc7SUFDbEIsWUFBQSxvQkFBb0IsRUFBRSxVQUFVO0lBQ25DLFNBQUEsQ0FBQyxFQUVGLFFBQUEsRUFBQSxDQUFBQSxlQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFDLHNCQUFzQixFQUFBLFFBQUEsRUFBQSxDQUVqQ0QsY0FDSSxDQUFBLFFBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxpQkFBaUIsRUFDdkIsR0FBQSxVQUFVLEVBQ1YsR0FBQSxTQUFTLEVBQ0QsWUFBQSxFQUFBLENBQUEseUJBQUEsRUFBNEIsS0FBSyxHQUFHLENBQUMsQ0FBQSxFQUFBLEVBQUssT0FBTyxDQUFBLENBQUUsRUFDL0QsSUFBSSxFQUFDLFFBQVEsRUFFYixRQUFBLEVBQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMsT0FBTyxFQUFhLGFBQUEsRUFBQSxNQUFNLEVBQUMsT0FBTyxFQUFDLFdBQVcsRUFDekQsUUFBQSxFQUFBQSxjQUFBLENBQUEsTUFBQSxFQUFBLEVBQU0sQ0FBQyxFQUFDLCtSQUErUixFQUFBLENBQVEsRUFDN1MsQ0FBQSxFQUFBLENBQ0QsRUFFVEEsY0FBQSxDQUFBLE1BQUEsRUFBQSxFQUFNLFNBQVMsRUFBQyx1QkFBdUIsRUFBQSxRQUFBLEVBQUUsT0FBTyxFQUFBLENBQVEsRUFFeERBLGNBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBQSxRQUFBLEVBQ0lBLGNBQUMsQ0FBQSxjQUFjLEVBQUMsRUFBQSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUEsQ0FBSSxFQUNwRCxDQUFBLENBQUEsRUFBQSxDQUNKLEVBQ05DLGVBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMsa0JBQWtCLEVBQUEsUUFBQSxFQUFBLENBQzVCLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUNoQkQsY0FBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQyxtQkFBbUIsRUFBQSxRQUFBLEVBQzdCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxNQUMxQkMsZUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFrQixTQUFTLEVBQUMsa0JBQWtCLEVBQUEsUUFBQSxFQUFBLENBQUEsZUFBQSxFQUN0QyxPQUFPLENBQUEsRUFBQSxFQURMLE1BQU0sQ0FFVixDQUNULENBQUMsRUFDQSxDQUFBLENBQ1QsRUFDREQsY0FBQSxDQUFBLEtBQUEsRUFBQSxFQUNJLFNBQVMsRUFBQyx3QkFBd0IsRUFDbEMsdUJBQXVCLEVBQUUsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsRUFBQSxDQUN2RCxDQUNBLEVBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FDSixFQUNSO0lBQ047O0lDaEVNLFNBQVUsV0FBVyxDQUFDLEtBQXVCLEVBQUE7SUFDL0MsSUFBQSxNQUFNLEVBQ0YsT0FBTyxFQUFFLGNBQWMsRUFDdkIsT0FBTyxFQUFFLGNBQWMsRUFDdkIsTUFBTSxFQUFFLGFBQWEsRUFDckIsU0FBUyxFQUFFLGdCQUFnQixHQUFHLEVBQUUsRUFDaEMsTUFBTSxFQUNOLFFBQVEsRUFDUixLQUFLLEdBQUcsS0FBSyxFQUNiLFFBQVEsR0FBRyxLQUFLLEVBQ25CLEdBQUcsS0FBSyxDQUFDO1FBRVYsTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsR0FBRzdCLGNBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN2RCxNQUFNLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxHQUFHQSxjQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdkQsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsR0FBR0EsY0FBUSxDQUFvQixhQUFhLENBQUMsQ0FBQztRQUN2RSxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxHQUFHQSxjQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM3RCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHQSxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBR3RELE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNyRCxJQUFBLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBRXhDLE1BQU0sVUFBVSxHQUFHLE1BQUs7SUFDcEIsUUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNqQixLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztnQkFDdEMsT0FBTzthQUNWO0lBQ0QsUUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNqQixLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztnQkFDcEMsT0FBTzthQUNWO0lBQ0QsUUFBQSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDOUQsS0FBQyxDQUFDO0lBRUYsSUFBQSxRQUNJOEIsZUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBRSxVQUFVLENBQUMsZUFBZSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFDOUUsUUFBQSxFQUFBLENBQUFBLGVBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMsc0JBQXNCLEVBQUEsUUFBQSxFQUFBLENBQ2pDRCxjQUFLLENBQUEsSUFBQSxFQUFBLEVBQUEsUUFBQSxFQUFBLEtBQUssR0FBRyxhQUFhLEdBQUcsVUFBVSxFQUFBLENBQU0sRUFDN0NBLGNBQUEsQ0FBQSxRQUFBLEVBQUEsRUFDSSxTQUFTLEVBQUMscUJBQXFCLEVBQy9CLE9BQU8sRUFBRSxRQUFRLEVBQ2pCLElBQUksRUFBQyxRQUFRLEVBQUEsWUFBQSxFQUNGLE9BQU8sRUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLENBR2IsQ0FDUCxFQUFBLENBQUEsRUFFTkMsZUFBSyxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxvQkFBb0IsRUFFL0IsUUFBQSxFQUFBLENBQUFBLGVBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMsZ0JBQWdCLEVBQUEsUUFBQSxFQUFBLENBQzNCQSxlQUFPLENBQUEsT0FBQSxFQUFBLEVBQUEsT0FBTyxFQUFDLGFBQWEsRUFBQSxRQUFBLEVBQUEsQ0FBQSxtQkFBQSxFQUNQRCxjQUFNLENBQUEsTUFBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLGNBQWMsRUFBUyxRQUFBLEVBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQ3BELEVBQ1JBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsRUFDSSxFQUFFLEVBQUMsYUFBYSxFQUNoQixJQUFJLEVBQUMsTUFBTSxFQUNYLFNBQVMsRUFBQyxnQkFBZ0IsRUFDMUIsS0FBSyxFQUFFLE9BQU8sRUFDZCxRQUFRLEVBQUUsQ0FBQyxDQUFDLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQzNDLFdBQVcsRUFBQyxrQ0FBa0MsRUFDOUMsUUFBUSxFQUNWLElBQUEsRUFBQSxDQUFBLENBQUEsRUFBQSxDQUNBLEVBR05DLGVBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMsZ0JBQWdCLEVBQUEsUUFBQSxFQUFBLENBQzNCQSxlQUFPLENBQUEsT0FBQSxFQUFBLEVBQUEsT0FBTyxFQUFDLGVBQWUsRUFDZixRQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUFELGNBQUEsQ0FBQSxNQUFBLEVBQUEsRUFBTSxTQUFTLEVBQUMsY0FBYyxFQUFBLFFBQUEsRUFBQSxHQUFBLEVBQUEsQ0FBUyxJQUM5QyxFQUNSQSxjQUFBLENBQUEsT0FBQSxFQUFBLEVBQ0ksRUFBRSxFQUFDLGVBQWUsRUFDbEIsSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUMsZ0JBQWdCLEVBQzFCLEtBQUssRUFBRSxTQUFTLEVBQ2hCLFFBQVEsRUFBRSxDQUFDLENBQUMsS0FBSyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDckQsUUFBUSxFQUFBLElBQUEsRUFDUixHQUFHLEVBQUMsR0FBRyxFQUNQLElBQUksRUFBQyxJQUFJLEVBQUEsQ0FDWCxFQUNGQSxjQUFBLENBQUEsT0FBQSxFQUFBLEVBQU8sU0FBUyxFQUFDLGVBQWUsRUFBQSxRQUFBLEVBQUEsMEZBQUEsRUFBQSxDQUd4QixDQUNOLEVBQUEsQ0FBQSxFQUdOQyxlQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLGdCQUFnQixFQUMzQixRQUFBLEVBQUEsQ0FBQUEsZUFBQSxDQUFBLE9BQUEsRUFBQSxFQUFPLE9BQU8sRUFBQyxZQUFZLEVBQUEsUUFBQSxFQUFBLENBQUEsaUJBQUEsRUFDUkQseUJBQU0sU0FBUyxFQUFDLGNBQWMsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBLENBQVMsQ0FDbEQsRUFBQSxDQUFBLEVBQ1JDLGVBQ0ksQ0FBQSxRQUFBLEVBQUEsRUFBQSxFQUFFLEVBQUMsWUFBWSxFQUNmLFNBQVMsRUFBQyxpQkFBaUIsRUFDM0IsS0FBSyxFQUFFLE1BQU0sRUFDYixRQUFRLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBMEIsQ0FBQyxFQUFBLFFBQUEsRUFBQSxDQUUvREQsY0FBUSxDQUFBLFFBQUEsRUFBQSxFQUFBLEtBQUssRUFBQyxNQUFNLEVBQWMsUUFBQSxFQUFBLE1BQUEsRUFBQSxDQUFBLEVBQ2xDQSxjQUFRLENBQUEsUUFBQSxFQUFBLEVBQUEsS0FBSyxFQUFDLFVBQVUsRUFBa0IsUUFBQSxFQUFBLFVBQUEsRUFBQSxDQUFBLEVBQzFDQSxjQUFRLENBQUEsUUFBQSxFQUFBLEVBQUEsS0FBSyxFQUFDLE1BQU0sRUFBQSxRQUFBLEVBQUEsWUFBQSxFQUFBLENBQW9CLENBQ25DLEVBQUEsQ0FBQSxFQUNUQyxlQUFPLENBQUEsT0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLGVBQWUsRUFDM0IsUUFBQSxFQUFBLENBQUEsTUFBTSxLQUFLLE1BQU0sSUFBSSx1Q0FBdUMsRUFDNUQsTUFBTSxLQUFLLFVBQVU7SUFDbEIsd0NBQUEsa0RBQWtELEVBQ3JELE1BQU0sS0FBSyxNQUFNLElBQUksdUNBQXVDLENBQ3pELEVBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FDTixFQUdOQSxlQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFDLGdCQUFnQixFQUMzQixRQUFBLEVBQUEsQ0FBQUEsZUFBQSxDQUFBLE9BQUEsRUFBQSxFQUFPLE9BQU8sRUFBQyxhQUFhLEVBQ1QsUUFBQSxFQUFBLENBQUEsaUJBQUEsRUFBQUQsY0FBQSxDQUFBLE1BQUEsRUFBQSxFQUFNLFNBQVMsRUFBQyxjQUFjLEVBQVMsUUFBQSxFQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsRUFBQSxDQUNsRCxFQUNSQSxjQUNJLENBQUEsVUFBQSxFQUFBLEVBQUEsRUFBRSxFQUFDLGFBQWEsRUFDaEIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRTtJQUN2QyxvQ0FBQSw0QkFBNEIsRUFBRSxXQUFXO3FDQUM1QyxDQUFDLEVBQ0YsS0FBSyxFQUFFLE9BQU8sRUFDZCxRQUFRLEVBQUUsQ0FBQyxDQUFDLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQzNDLFdBQVcsRUFBQyxnQ0FBZ0MsRUFDNUMsSUFBSSxFQUFFLEVBQUUsRUFDUixRQUFRLEVBQUEsSUFBQSxFQUFBLENBQ1YsRUFHRCxXQUFXLEtBQ1JDLGVBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsbUJBQW1CLEVBQUEsUUFBQSxFQUFBLENBQzlCRCx3RUFBcUMsRUFDckNBLGNBQUEsQ0FBQSxJQUFBLEVBQUEsRUFBQSxRQUFBLEVBQ0ssUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQ3JCQSxjQUFBLENBQUEsSUFBQSxFQUFBLEVBQUEsUUFBQSxFQUFhLE9BQU8sRUFBWCxFQUFBLENBQUMsQ0FBZ0IsQ0FDN0IsQ0FBQyxHQUNELENBQ0gsRUFBQSxDQUFBLENBQ1QsSUFDQyxFQUdOQSxjQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFDLGdCQUFnQixFQUFBLFFBQUEsRUFDM0JDLDRCQUNJLElBQUksRUFBQyxRQUFRLEVBQ2IsU0FBUyxFQUFDLG9CQUFvQixFQUM5QixPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFFMUMsUUFBQSxFQUFBLENBQUEsV0FBVyxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQ3pCLFVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUNQLEVBR0wsV0FBVyxLQUNSQSxlQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLGtCQUFrQixFQUFBLFFBQUEsRUFBQSxDQUM3QkQsOENBQWlCLEVBQ2pCQSxjQUFBLENBQUEsS0FBQSxFQUFBLEVBQ0ksU0FBUyxFQUFDLDBCQUEwQixFQUNwQyx1QkFBdUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEdBQ3RFLENBQ0EsRUFBQSxDQUFBLENBQ1QsSUFDQyxFQUdOQyxlQUFBLENBQUEsS0FBQSxFQUFBLEVBQUssU0FBUyxFQUFDLHNCQUFzQixhQUNqQ0QsY0FBUSxDQUFBLFFBQUEsRUFBQSxFQUFBLElBQUksRUFBQyxRQUFRLEVBQUMsU0FBUyxFQUFDLDJCQUEyQixFQUFDLE9BQU8sRUFBRSxRQUFRLHVCQUVwRSxFQUNUQSxjQUFBLENBQUEsUUFBQSxFQUFBLEVBQ0ksSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUMseUJBQXlCLEVBQ25DLE9BQU8sRUFBRSxVQUFVLEVBQ25CLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFFM0MsS0FBSyxHQUFHLFlBQVksR0FBRyxjQUFjLEVBQ2pDLENBQUEsQ0FBQSxFQUFBLENBQ1AsQ0FDSixFQUFBLENBQUEsRUFDUjtJQUNOOztJQ25KQTs7SUFFRztJQUNhLFNBQUEsZUFBZSxDQUFDLEVBQzVCLEtBQUssRUFDTCxXQUFXLEVBQ1gsYUFBYSxFQUNiLGlCQUFpQixFQUNqQixVQUFVLEVBQ1YsWUFBWSxFQUNaLFNBQVMsRUFDVCxnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixVQUFVLEVBQ1YsWUFBWSxFQUNaLGNBQWMsRUFDZCxTQUFTLEVBQ1QsY0FBYyxFQUNLLEVBQUE7UUFDbkIsTUFBTSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHN0IsY0FBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFELElBQUEsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUN0QixTQUFTLENBQUMsYUFBYSxFQUFFO0lBQ3JCLFFBQUEsb0JBQW9CLEVBQUU7SUFDbEIsWUFBQSxRQUFRLEVBQUUsQ0FBQztJQUNkLFNBQUE7SUFDSixLQUFBLENBQUMsRUFDRixTQUFTLENBQUMsY0FBYyxFQUFFO0lBQ3RCLFFBQUEsZ0JBQWdCLEVBQUUsMkJBQTJCO0lBQ2hELEtBQUEsQ0FBQyxDQUNMLENBQUM7SUFFRixJQUFBLE1BQU0sZUFBZSxHQUFHLENBQUMsTUFBc0IsS0FBSTtZQUMvQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixLQUFDLENBQUM7SUFFRixJQUFBLE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBbUIsS0FBSTtZQUMxQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckIsS0FBQyxDQUFDO0lBRUYsSUFBQSxRQUNJNkIsY0FBQyxDQUFBLFVBQVUsSUFDUCxPQUFPLEVBQUUsT0FBTyxFQUNoQixrQkFBa0IsRUFBRSxhQUFhLEVBQ2pDLFdBQVcsRUFBRSxlQUFlLEVBQzVCLFNBQVMsRUFBRSxhQUFhLEVBRXhCLFFBQUEsRUFBQUEsY0FBQSxDQUFDLGVBQWUsRUFBQyxFQUFBLEtBQUssRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLDJCQUEyQixZQUN0RUMsZUFBSyxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxvREFBb0QsRUFBQSxRQUFBLEVBQUEsQ0FFOUQsY0FBYyxLQUNYRCx3QkFBSyxTQUFTLEVBQUMsa0NBQWtDLEVBQzdDLFFBQUEsRUFBQUEsY0FBQSxDQUFDLFdBQVcsRUFDUixFQUFBLE9BQU8sRUFBQyxFQUFFLEVBQ1YsT0FBTyxFQUFDLEVBQUUsRUFDVixNQUFNLEVBQUMsTUFBTSxFQUNiLFNBQVMsRUFBRSxnQkFBZ0IsRUFDM0IsTUFBTSxFQUFFLFNBQVMsRUFDakIsUUFBUSxFQUFFLGNBQWMsRUFDeEIsS0FBSyxFQUFFLElBQUksRUFDWCxRQUFRLEVBQUUsSUFBSSxHQUNoQixFQUNBLENBQUEsQ0FDVCxFQUVBLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxLQUFJOztJQUV2Qix3QkFBQSxJQUFJLGdCQUFnQixLQUFLLEtBQUssRUFBRTtnQ0FDNUIsUUFDSUEsY0FFSSxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxnQ0FBZ0MsRUFFMUMsUUFBQSxFQUFBQSxjQUFBLENBQUMsV0FBVyxFQUFBLEVBQ1IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ3JCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUNyQixNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFDMUIsU0FBUyxFQUFFLGdCQUFnQixJQUFJLGdCQUFnQixFQUMvQyxNQUFNLEVBQUUsVUFBVSxFQUNsQixRQUFRLEVBQUUsWUFBWSxFQUN0QixLQUFLLEVBQUUsS0FBSyxFQUNaLFFBQVEsRUFBRSxJQUFJLEVBQ2hCLENBQUEsRUFBQSxFQVpHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FhckIsRUFDUjs2QkFDTDtJQUVELHdCQUFBLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzFFLHdCQUFBLE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXRFLHdCQUFBLFFBQ0lBLGNBQUEsQ0FBQyxnQkFBZ0IsRUFBQSxFQUViLEVBQUUsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQ3RCLEtBQUssRUFBRSxLQUFLLEVBQ1osT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQ3JCLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxRQUFRLEVBQUUsUUFBUSxFQUNsQixpQkFBaUIsRUFBRSxpQkFBaUIsRUFDcEMsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUMvQixRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQ25DLFdBQVcsRUFBRSxhQUFhLEVBVHJCLEVBQUEsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQVV6QixFQUNKO0lBQ04scUJBQUMsQ0FBQyxDQUFBLEVBQUEsQ0FDQSxFQUNRLENBQUEsRUFBQSxDQUNULEVBQ2Y7SUFDTjs7SUNwSkE7O0lBRUc7SUFDRyxTQUFVLGFBQWEsQ0FBQyxLQUF5QixFQUFBO1FBQ25ELE1BQU0sRUFDRixNQUFNLEVBQ04sS0FBSyxFQUNMLE9BQU8sRUFDUCxTQUFTLEVBQ1QsUUFBUSxFQUNSLFdBQVcsR0FBRyxTQUFTLEVBQ3ZCLFVBQVUsR0FBRyxRQUFRLEVBQ3JCLGFBQWEsR0FBRyxLQUFLLEVBQ3hCLEdBQUcsS0FBSyxDQUFDO1FBRVYsSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNULFFBQUEsT0FBTyxJQUFJLENBQUM7U0FDZjtJQUVELElBQUEsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQW1DLEtBQUk7WUFDL0QsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxhQUFhLEVBQUU7SUFDOUIsWUFBQSxRQUFRLEVBQUUsQ0FBQzthQUNkO0lBQ0wsS0FBQyxDQUFDO0lBRUYsSUFBQSxRQUNJQSxjQUFBLENBQUEsS0FBQSxFQUFBLEVBQ0ksU0FBUyxFQUFDLDRCQUE0QixFQUN0QyxPQUFPLEVBQUUsa0JBQWtCLEVBQzNCLElBQUksRUFBQyxjQUFjLEVBQUEsUUFBQSxFQUVuQkMsZUFDSSxDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxvQkFBb0IsRUFDOUIsSUFBSSxFQUFDLGFBQWEsRUFDRixpQkFBQSxFQUFBLGNBQWMsRUFDYixrQkFBQSxFQUFBLGdCQUFnQixFQUVqQyxRQUFBLEVBQUEsQ0FBQUEsZUFBQSxDQUFBLEtBQUEsRUFBQSxFQUFLLFNBQVMsRUFBQywyQkFBMkIsRUFBQSxRQUFBLEVBQUEsQ0FDckMsYUFBYSxLQUNWRCxjQUFBLENBQUEsS0FBQSxFQUFBLEVBQ0ksU0FBUyxFQUFDLGlDQUFpQyxFQUMzQyxLQUFLLEVBQUMsSUFBSSxFQUNWLE1BQU0sRUFBQyxJQUFJLEVBQ1gsT0FBTyxFQUFDLFdBQVcsRUFDbkIsSUFBSSxFQUFDLGNBQWMsRUFBQSxRQUFBLEVBRW5CQSxjQUFNLENBQUEsTUFBQSxFQUFBLEVBQUEsQ0FBQyxFQUFDLHdQQUF3UCxHQUFHLEVBQ2pRLENBQUEsQ0FDVCxFQUNEQSxjQUFBLENBQUEsSUFBQSxFQUFBLEVBQUksRUFBRSxFQUFDLGNBQWMsRUFBQyxTQUFTLEVBQUMsMEJBQTBCLEVBQUEsUUFBQSxFQUNyRCxLQUFLLEVBQUEsQ0FDTCxDQUNILEVBQUEsQ0FBQSxFQUVOQSxjQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsRUFBRSxFQUFDLGdCQUFnQixFQUFDLFNBQVMsRUFBQyw0QkFBNEIsRUFDMUQsUUFBQSxFQUFBLE9BQU8sRUFDTixDQUFBLEVBRU5DLGVBQUssQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsNEJBQTRCLGFBQ3ZDRCxjQUNJLENBQUEsUUFBQSxFQUFBLEVBQUEsSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixFQUFFLGdCQUFnQixDQUFDLEVBQ2pFLE9BQU8sRUFBRSxRQUFRLEVBQUEsUUFBQSxFQUVoQixVQUFVLEVBQUEsQ0FDTixFQUNUQSxjQUFBLENBQUEsUUFBQSxFQUFBLEVBQ0ksSUFBSSxFQUFDLFFBQVEsRUFDYixTQUFTLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixFQUFFLGlCQUFpQixFQUFFO0lBQy9ELGdDQUFBLHFCQUFxQixFQUFFLGFBQWE7aUNBQ3ZDLENBQUMsRUFDRixPQUFPLEVBQUUsU0FBUyxFQUFBLFFBQUEsRUFFakIsV0FBVyxFQUFBLENBQ1AsQ0FDUCxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQ0osRUFDSixDQUFBLEVBQ1I7SUFDTjs7SUNwRkE7OztJQUdHO0lBQ0csU0FBVSxTQUFTLENBQUMsRUFDdEIsa0JBQWtCLEVBQ2xCLGVBQWUsRUFDZixjQUFjLEVBQ0QsRUFBQTtJQUNiLElBQUEsUUFDSUEsY0FFSSxDQUFBRSxtQkFBQSxFQUFBLEVBQUEsUUFBQSxFQUFBRixjQUFBLENBQUMsYUFBYSxFQUNWLEVBQUEsTUFBTSxFQUFFLGtCQUFrQixLQUFLLElBQUksRUFDbkMsS0FBSyxFQUFDLGlCQUFpQixFQUN2QixPQUFPLEVBQUMsOEVBQThFLEVBQ3RGLFNBQVMsRUFBRSxlQUFlLEVBQzFCLFFBQVEsRUFBRSxjQUFjLEVBQ3hCLFdBQVcsRUFBQyxRQUFRLEVBQ3BCLFVBQVUsRUFBQyxRQUFRLEVBQ25CLGFBQWEsRUFBRSxJQUFJLEVBQ3JCLENBQUEsRUFBQSxDQUNILEVBQ0w7SUFDTjs7SUN0Qk0sU0FBVSxZQUFZLENBQUMsS0FBaUMsRUFBQTtRQUMxRCxNQUFNLEVBQ0YsY0FBYyxFQUNkLFFBQVEsRUFDUixVQUFVLEVBQ1YsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2pCLFlBQVksRUFDWixVQUFVLEVBQ1YsWUFBWSxFQUNaLGNBQWMsRUFDZCxjQUFjLEVBQ2Qsa0JBQWtCOztRQUVsQixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLHNCQUFzQixFQUN0QiwwQkFBMEIsRUFDN0IsR0FBRyxLQUFLLENBQUM7O0lBR1YsSUFBQSxNQUFNLGtCQUFrQixHQUFHM0IsYUFBTyxDQUM5QixPQUFPO1lBQ0gsZ0JBQWdCO1lBQ2hCLGdCQUFnQjtZQUNoQixzQkFBc0I7WUFDdEIsMEJBQTBCO1NBQzdCLENBQUMsRUFDRixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFFLDBCQUEwQixDQUFDLENBQzNGLENBQUM7O1FBR0YsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEdBQUcsVUFBVSxDQUFDO1lBQ25FLGNBQWM7WUFDZCxVQUFVO1lBQ1YsUUFBUTtZQUNSLGtCQUFrQjtZQUNsQixrQkFBa0I7SUFDckIsS0FBQSxDQUFDLENBQUM7O0lBR0gsSUFBQSxNQUFNLFNBQVMsR0FBRyxXQUFXLEVBQUUsQ0FBQztRQUNoQyxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHRixjQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBR3RELE1BQU0sRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxHQUFHLGFBQWEsQ0FBQztZQUN4RixjQUFjO1lBQ2QsVUFBVTtZQUNWLGtCQUFrQjtZQUNsQixTQUFTO1lBQ1QsWUFBWTtZQUNaLGNBQWM7WUFDZCxjQUFjO1lBQ2Qsa0JBQWtCO0lBQ3JCLEtBQUEsQ0FBQyxDQUFDOztJQUdILElBQUEsTUFBTSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHQSxjQUFRLENBQWMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEdBQUdBLGNBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztJQUdqRSxJQUFBLE1BQU0sZ0JBQWdCLEdBQUdFLGFBQU8sQ0FBQyxNQUFLO0lBQ2xDLFFBQUEsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxFQUFFO0lBQ3JDLFlBQUEsT0FBTyxTQUFTLENBQUM7YUFDcEI7WUFFRCxNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxTQUFTLENBQUM7SUFDeEUsUUFBQSxJQUFJLGtCQUFrQixLQUFLLFNBQVMsRUFBRTtJQUNsQyxZQUFBLE9BQU8sa0JBQWtCLENBQUM7YUFDN0I7WUFFRCxJQUNJLGNBQWMsS0FBSyxVQUFVO2dCQUM3QixVQUFVO2dCQUNWLGtCQUFrQjtnQkFDbEIsVUFBVSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsRUFDaEQ7SUFDRSxZQUFBLElBQUk7SUFDQSxnQkFBQSxNQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQzlCLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQy9DLENBQUMsS0FBSyxDQUFDO0lBQ1IsZ0JBQUEsT0FBTyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztpQkFDbkQ7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7SUFDVixnQkFBQSxPQUFPLENBQUMsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUMvRTthQUNKO0lBRUQsUUFBQSxPQUFPLFNBQVMsQ0FBQztJQUNyQixLQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDOztRQUd4RkQsZUFBUyxDQUFDLE1BQUs7SUFDWCxRQUFBLE1BQU0sU0FBUyxHQUFHLFlBQVc7SUFDekIsWUFBQSxJQUFJLFlBQVksSUFBSSxVQUFVLEVBQUU7SUFDNUIsZ0JBQUEsTUFBTSxPQUFPLEdBQUcsTUFBTSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ2hELGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDM0I7SUFBTSxpQkFBQSxJQUFJLFlBQVksSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDcEMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN4QjtxQkFBTTtvQkFDSCxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3pCO0lBQ0wsU0FBQyxDQUFDO0lBRUYsUUFBQSxTQUFTLEVBQUUsQ0FBQztJQUNoQixLQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQzs7UUFHL0JBLGVBQVMsQ0FBQyxNQUFLO1lBQ1gsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDbEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ2hDO0lBQ0wsS0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzs7SUFHOUIsSUFBQSxNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQWEsS0FBVTtJQUN2QyxRQUFBLGdCQUFnQixDQUFDLENBQUMsSUFBSSxLQUFJO0lBQ3RCLFlBQUEsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsWUFBQSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDbkIsZ0JBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDeEI7cUJBQU07SUFDSCxnQkFBQSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNyQjtJQUNELFlBQUEsT0FBTyxNQUFNLENBQUM7SUFDbEIsU0FBQyxDQUFDLENBQUM7SUFDUCxLQUFDLENBQUM7O1FBR0YsTUFBTSxTQUFTLEdBQUcsTUFBVztZQUN6QixJQUFJLFdBQVcsRUFBRTtJQUNiLFlBQUEsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QixjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDekI7aUJBQU07Z0JBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3QixjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDeEI7SUFDTCxLQUFDLENBQUM7O1FBR0ZBLGVBQVMsQ0FBQyxNQUFLO1lBQ1gsSUFBSSxLQUFLLEVBQUU7SUFDUCxZQUFBLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDL0UsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ2xDO0lBQ0wsS0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7O1FBRzNCLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7O1FBRzVFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBVztJQUNoQyxRQUFBLElBQUksU0FBUyxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtnQkFDckMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzdCO0lBQ0QsUUFBQSxJQUFJLFNBQVMsQ0FBQyxjQUFjLEVBQUU7Z0JBQzFCLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzthQUM5QjtJQUNMLEtBQUMsQ0FBQzs7UUFHRixJQUFJLFNBQVMsRUFBRTtZQUNYLFFBQ0k0Qix3QkFBSyxTQUFTLEVBQUMsdUJBQXVCLEVBQ2xDLFFBQUEsRUFBQUEsY0FBQSxDQUFBLEdBQUEsRUFBQSxFQUFBLFFBQUEsRUFBQSxzQkFBQSxFQUFBLENBQTJCLEVBQ3pCLENBQUEsRUFDUjtTQUNMO1FBRUQsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM5QixRQUNJQSx3QkFBSyxTQUFTLEVBQUMscUJBQXFCLEVBQ2hDLFFBQUEsRUFBQUEsY0FBQSxDQUFBLEdBQUEsRUFBQSxFQUFBLFFBQUEsRUFBQSx5QkFBQSxFQUFBLENBQThCLEVBQzVCLENBQUEsRUFDUjtTQUNMO0lBRUQsSUFBQSxRQUNJQyxlQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLHlCQUF5QixFQUFBLFFBQUEsRUFBQSxDQUNwQ0QsZUFBQyxTQUFTLEVBQUEsRUFDTixnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFDbEMsV0FBVyxFQUFFLFdBQVcsRUFDeEIsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUN6QyxXQUFXLEVBQUUsU0FBUyxFQUN0QixnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFDbEMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQzVCLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxjQUFjLEVBQzFDLFdBQVcsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFBLENBQ3RDLEVBRUQsU0FBUyxDQUFDLFFBQVEsSUFBSSxnQkFBZ0IsSUFDbkNBLGNBQUMsQ0FBQSxlQUFlLElBQ1osS0FBSyxFQUFFLEtBQUssRUFDWixXQUFXLEVBQUUsV0FBVyxFQUN4QixhQUFhLEVBQUUsYUFBYSxFQUM1QixpQkFBaUIsRUFBRSxpQkFBaUIsSUFBSSxHQUFHLEVBQzNDLFVBQVUsRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEVBQ3RDLFlBQVksRUFBRSxTQUFTLENBQUMsYUFBYSxFQUNyQyxTQUFTLEVBQUUsYUFBYSxFQUN4QixnQkFBZ0IsRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEVBQzVDLGdCQUFnQixFQUFFLGdCQUFnQixFQUNsQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFDbEMsVUFBVSxFQUFFLGNBQWMsRUFDMUIsWUFBWSxFQUFFLGdCQUFnQixFQUM5QixjQUFjLEVBQUUsU0FBUyxDQUFDLGNBQWMsRUFDeEMsU0FBUyxFQUFFLGFBQWEsRUFDeEIsY0FBYyxFQUFFLGdCQUFnQixFQUNsQyxDQUFBLEtBRUZBLGNBQUEsQ0FBQyxZQUFZLEVBQ1QsRUFBQSxLQUFLLEVBQUUsS0FBSyxFQUNaLGFBQWEsRUFBRSxhQUFhLEVBQzVCLGlCQUFpQixFQUFFLGlCQUFpQixJQUFJLEdBQUcsRUFDM0MsWUFBWSxFQUFFLFVBQVUsRUFDMUIsQ0FBQSxDQUNMLEVBRURBLGNBQUMsQ0FBQSxTQUFTLElBQ04sa0JBQWtCLEVBQUUsU0FBUyxDQUFDLGtCQUFrQixFQUNoRCxlQUFlLEVBQUUsbUJBQW1CLEVBQ3BDLGNBQWMsRUFBRSxTQUFTLENBQUMsWUFBWSxFQUN4QyxDQUFBLENBQUEsRUFBQSxDQUNBLEVBQ1I7SUFDTjs7Ozs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzYsOSwxMCwxMywxNCwxNSwxNl19
