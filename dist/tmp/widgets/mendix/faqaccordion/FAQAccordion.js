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
         * Set attribute values on an item using overrides.
         * Since setValue() is not supported on datasource-linked attributes,
         * we need to find the actual attribute names by matching values.
         */
        const findOverrideAttributeNames = (mxObj, item) => {
            // Get current values from overrides
            const summaryValue = attributeOverrides.summaryAttribute.get(item).value;
            const contentValue = attributeOverrides.contentAttribute.get(item).value;
            const formatValue = attributeOverrides.contentFormatAttribute.get(item).value;
            const sortOrderValue = attributeOverrides.sortOrderAttributeOverride.get(item).value;
            console.log("FAQ Accordion: Finding attribute names by matching values:");
            console.log("  Override values:", { summaryValue, contentValue, formatValue, sortOrderValue: sortOrderValue?.toString() });
            // Get all attributes from the MxObject
            const allAttrs = mxObj.getAttributes?.() || [];
            console.log("  MxObject attributes:", allAttrs);
            let summaryAttr = "";
            let contentAttr = "";
            let formatAttr = "";
            let sortOrderAttr = "";
            // Match by comparing values
            for (const attrName of allAttrs) {
                const attrValue = mxObj.get(attrName);
                if (attrValue === summaryValue && !summaryAttr) {
                    summaryAttr = attrName;
                    console.log(`  Matched summary: ${attrName} = ${attrValue}`);
                }
                else if (attrValue === contentValue && !contentAttr) {
                    contentAttr = attrName;
                    console.log(`  Matched content: ${attrName} = ${attrValue}`);
                }
                else if (attrValue === formatValue && !formatAttr) {
                    formatAttr = attrName;
                    console.log(`  Matched format: ${attrName} = ${attrValue}`);
                }
                else if (sortOrderValue && attrValue?.toString?.() === sortOrderValue.toString() && !sortOrderAttr) {
                    sortOrderAttr = attrName;
                    console.log(`  Matched sortOrder: ${attrName} = ${attrValue}`);
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
            console.warn("FAQ Accordion: Could not match all attribute names:", {
                summaryAttr, contentAttr, formatAttr, sortOrderAttr
            });
            return null;
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
            // Option 2: Use overrides - find attribute names by matching values, then use mx.data.set
            if (hasAllOverrides) {
                const mx = window.mx;
                mx.data.get({
                    guid: item.id,
                    callback: (mxObj) => {
                        try {
                            // Find the actual attribute names by matching values
                            const attrNames = findOverrideAttributeNames(mxObj, item);
                            if (!attrNames) {
                                console.error("FAQ Accordion: Could not determine attribute names from overrides");
                                editState.cancelEditing();
                                return;
                            }
                            console.log("FAQ Accordion: Setting values with override attribute names:", attrNames);
                            // Set values using discovered attribute names
                            mxObj.set(attrNames.summary, summary);
                            mxObj.set(attrNames.content, content);
                            mxObj.set(attrNames.contentFormat, format);
                            mxObj.set(attrNames.sortOrder, new Big(sortOrder));
                            commitObject(mxObj, dataSource, "FAQ Accordion: Successfully saved FAQ item")
                                .then(() => {
                                editState.finishEditing();
                            })
                                .catch((error) => {
                                console.error("FAQ Accordion: Failed to save:", error);
                                editState.cancelEditing();
                            });
                        }
                        catch (error) {
                            console.error("FAQ Accordion: Failed to save with overrides:", error);
                            editState.cancelEditing();
                        }
                    },
                    error: (error) => {
                        console.error("FAQ Accordion: Failed to get object:", error);
                        editState.cancelEditing();
                    }
                });
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
                // Determine attribute names based on whether we're using overrides
                let attrNames;
                if (hasAllOverrides && dataSource.items && dataSource.items.length > 0) {
                    // Use overrides - get names from existing item's MxObject
                    const referenceItem = dataSource.items[0];
                    const mx = window.mx;
                    // We need to fetch the MxObject to find attribute names
                    const mxObjPromise = new Promise((resolve, reject) => {
                        mx.data.get({
                            guid: referenceItem.id,
                            callback: resolve,
                            error: reject
                        });
                    });
                    const refMxObj = await mxObjPromise;
                    const foundNames = findOverrideAttributeNames(refMxObj, referenceItem);
                    if (!foundNames) {
                        console.error("FAQ Accordion: Could not determine attribute names from overrides for create");
                        editState.cancelCreating();
                        return;
                    }
                    attrNames = foundNames;
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
                const newItem = await createObject(entityName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRkFRQWNjb3JkaW9uLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvdXRpbHMvZWRpdGluZ1V0aWxzLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2hvb2tzL3VzZUVkaXRNb2RlLnRzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbmZpZy9hdHRyaWJ1dGVDb25maWcudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvdXRpbHMvbWVuZGl4RGF0YVNlcnZpY2UudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvaG9va3MvdXNlRkFRRGF0YS50cyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9ob29rcy91c2VGQVFBY3Rpb25zLnRzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2NsYXNzbmFtZXMvaW5kZXguanMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9FZGl0TW9kZVRvZ2dsZS50c3giLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9GQVFIZWFkZXIudHN4IiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2RvbXB1cmlmeS9kaXN0L3B1cmlmeS5lcy5tanMiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvbWFya2VkL2xpYi9tYXJrZWQuZXNtLmpzIiwiLi4vLi4vLi4vLi4vLi4vc3JjL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3IudHMiLCIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9GQVFJdGVtc0xpc3QudHN4IiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BkbmQta2l0L3V0aWxpdGllcy9kaXN0L3V0aWxpdGllcy5lc20uanMiLCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGRuZC1raXQvYWNjZXNzaWJpbGl0eS9kaXN0L2FjY2Vzc2liaWxpdHkuZXNtLmpzIiwiLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BkbmQta2l0L2NvcmUvZGlzdC9jb3JlLmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AZG5kLWtpdC9zb3J0YWJsZS9kaXN0L3NvcnRhYmxlLmVzbS5qcyIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0ZBUUl0ZW1BY3Rpb25zLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0RyYWdnYWJsZUZBUUl0ZW0udHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRWRpdEZBUUZvcm0udHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRkFRRWRpdGFibGVMaXN0LnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbmZpcm1EaWFsb2cudHN4IiwiLi4vLi4vLi4vLi4vLi4vc3JjL2NvbXBvbmVudHMvRkFRTW9kYWxzLnRzeCIsIi4uLy4uLy4uLy4uLy4uL3NyYy9GQVFBY2NvcmRpb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIGVkaXRpbmcgbW9kZSBhbmQgcm9sZS1iYXNlZCBhY2Nlc3MgY29udHJvbFxuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IHVzZXIgaGFzIHRoZSByZXF1aXJlZCByb2xlIGZvciBlZGl0aW5nXG4gKiBAcGFyYW0gcmVxdWlyZWRSb2xlIC0gVGhlIHJvbGUgbmFtZSByZXF1aXJlZCAoZW1wdHkgc3RyaW5nID0gYWxsIGF1dGhlbnRpY2F0ZWQgdXNlcnMpXG4gKiBAcmV0dXJucyBQcm9taXNlPGJvb2xlYW4+IC0gVHJ1ZSBpZiB1c2VyIGhhcyBhY2Nlc3NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrVXNlclJvbGUocmVxdWlyZWRSb2xlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAvLyBJZiBubyByb2xlIHNwZWNpZmllZCwgYWxsb3cgYWxsIGF1dGhlbnRpY2F0ZWQgdXNlcnNcbiAgICBpZiAoIXJlcXVpcmVkUm9sZSB8fCByZXF1aXJlZFJvbGUudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIC8vIFVzZSBNZW5kaXggQ2xpZW50IEFQSSB0byBjaGVjayB1c2VyIHJvbGVzXG4gICAgICAgIC8vIE5vdGU6IEluIGFjdHVhbCBNZW5kaXggcnVudGltZSwgeW91J2QgdXNlIG14LnNlc3Npb24gb3Igc2ltaWxhclxuICAgICAgICAvLyBUaGlzIGlzIGEgcGxhY2Vob2xkZXIgLSBNZW5kaXggd2lkZ2V0cyB0eXBpY2FsbHkgdXNlIHNlcnZlci1zaWRlIHZhbGlkYXRpb25cbiAgICAgICAgLy8gRm9yIG5vdywgd2UnbGwgcmV0dXJuIHRydWUgYW5kIHJlbHkgb24gbWljcm9mbG93IHZhbGlkYXRpb25cbiAgICAgICAgY29uc29sZS5sb2coYENoZWNraW5nIHJvbGU6ICR7cmVxdWlyZWRSb2xlfWApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2hlY2tpbmcgdXNlciByb2xlOlwiLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGlmIGVkaXRpbmcgaXMgYWxsb3dlZCBiYXNlZCBvbiBjb25maWd1cmF0aW9uXG4gKiBAcGFyYW0gYWxsb3dFZGl0aW5nIC0gV2hldGhlciBlZGl0aW5nIGlzIGVuYWJsZWRcbiAqIEBwYXJhbSBkYXRhU291cmNlVHlwZSAtIFR5cGUgb2YgZGF0YSBzb3VyY2VcbiAqIEBwYXJhbSBoYXNSb2xlIC0gV2hldGhlciB1c2VyIGhhcyByZXF1aXJlZCByb2xlXG4gKiBAcmV0dXJucyBib29sZWFuIC0gVHJ1ZSBpZiBlZGl0aW5nIHNob3VsZCBiZSBhbGxvd2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5FZGl0KGFsbG93RWRpdGluZzogYm9vbGVhbiwgZGF0YVNvdXJjZVR5cGU6IHN0cmluZywgaGFzUm9sZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIC8vIEVkaXRpbmcgb25seSB3b3JrcyB3aXRoIGRhdGFiYXNlIG1vZGVcbiAgICBpZiAoZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRWRpdGluZyBtdXN0IGJlIGVuYWJsZWRcbiAgICBpZiAoIWFsbG93RWRpdGluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVXNlciBtdXN0IGhhdmUgcmVxdWlyZWQgcm9sZVxuICAgIHJldHVybiBoYXNSb2xlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHRlbXBvcmFyeSBJRCBmb3IgbmV3IEZBUSBpdGVtcyBiZWZvcmUgdGhleSdyZSBzYXZlZFxuICogQHJldHVybnMgc3RyaW5nIC0gVGVtcG9yYXJ5IElEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVRlbXBJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgdGVtcF8ke0RhdGUubm93KCl9XyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpfWA7XG59XG4iLCIvKipcbiAqIEN1c3RvbSBob29rIGZvciBtYW5hZ2luZyBlZGl0IG1vZGUgc3RhdGUgaW4gRkFRIEFjY29yZGlvblxuICogQ2VudHJhbGl6ZXMgYWxsIGVkaXQtcmVsYXRlZCBzdGF0ZSBhbmQgYWN0aW9uc1xuICovXG5cbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlRWRpdE1vZGVSZXR1cm4ge1xuICAgIC8vIFN0YXRlXG4gICAgZWRpdE1vZGU6IGJvb2xlYW47XG4gICAgZWRpdGluZ0l0ZW1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBzaG93Q3JlYXRlRm9ybTogYm9vbGVhbjtcbiAgICBkZWxldGVDb25maXJtSW5kZXg6IG51bWJlciB8IG51bGw7XG5cbiAgICAvLyBBY3Rpb25zXG4gICAgdG9nZ2xlRWRpdE1vZGU6ICgpID0+IHZvaWQ7XG4gICAgc3RhcnRFZGl0aW5nSXRlbTogKGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG4gICAgY2FuY2VsRWRpdGluZzogKCkgPT4gdm9pZDtcbiAgICBzdGFydENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIHN0YXJ0RGVsZXRpbmc6IChpbmRleDogbnVtYmVyKSA9PiB2b2lkO1xuICAgIGNvbmZpcm1EZWxldGU6ICgpID0+IHZvaWQ7XG4gICAgY2FuY2VsRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaEVkaXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgZmluaXNoQ3JlYXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgZmluaXNoRGVsZXRpbmc6ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogSG9vayBmb3IgbWFuYWdpbmcgRkFRIGVkaXQgbW9kZSBzdGF0ZVxuICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgZWRpdCBzdGF0ZSBhbmQgYWN0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRWRpdE1vZGUoKTogVXNlRWRpdE1vZGVSZXR1cm4ge1xuICAgIGNvbnN0IFtlZGl0TW9kZSwgc2V0RWRpdE1vZGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtlZGl0aW5nSXRlbUluZGV4LCBzZXRFZGl0aW5nSXRlbUluZGV4XSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IFtzaG93Q3JlYXRlRm9ybSwgc2V0U2hvd0NyZWF0ZUZvcm1dID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtkZWxldGVDb25maXJtSW5kZXgsIHNldERlbGV0ZUNvbmZpcm1JbmRleF0gPSB1c2VTdGF0ZTxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICAgIC8vIFRvZ2dsZSBiZXR3ZWVuIGVkaXQgYW5kIHZpZXcgbW9kZVxuICAgIGNvbnN0IHRvZ2dsZUVkaXRNb2RlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFZGl0TW9kZSghZWRpdE1vZGUpO1xuICAgICAgICBzZXRFZGl0aW5nSXRlbUluZGV4KG51bGwpO1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybShmYWxzZSk7XG4gICAgfTtcblxuICAgIC8vIFN0YXJ0IGVkaXRpbmcgYSBzcGVjaWZpYyBpdGVtXG4gICAgY29uc3Qgc3RhcnRFZGl0aW5nSXRlbSA9IChpbmRleDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgoaW5kZXgpO1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybShmYWxzZSk7XG4gICAgfTtcblxuICAgIC8vIENhbmNlbCBlZGl0aW5nIGN1cnJlbnQgaXRlbVxuICAgIGNvbnN0IGNhbmNlbEVkaXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIC8vIEZpbmlzaCBlZGl0aW5nIGN1cnJlbnQgaXRlbSAoYWZ0ZXIgc3VjY2Vzc2Z1bCBzYXZlKVxuICAgIGNvbnN0IGZpbmlzaEVkaXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldEVkaXRpbmdJdGVtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIC8vIFN0YXJ0IGNyZWF0aW5nIGEgbmV3IGl0ZW1cbiAgICBjb25zdCBzdGFydENyZWF0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXRTaG93Q3JlYXRlRm9ybSh0cnVlKTtcbiAgICAgICAgc2V0RWRpdGluZ0l0ZW1JbmRleChudWxsKTtcbiAgICB9O1xuXG4gICAgLy8gQ2FuY2VsIGNyZWF0aW5nIG5ldyBpdGVtXG4gICAgY29uc3QgY2FuY2VsQ3JlYXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgLy8gRmluaXNoIGNyZWF0aW5nIG5ldyBpdGVtIChhZnRlciBzdWNjZXNzZnVsIHNhdmUpXG4gICAgY29uc3QgZmluaXNoQ3JlYXRpbmcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHNldFNob3dDcmVhdGVGb3JtKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgLy8gU3RhcnQgZGVsZXRlIGNvbmZpcm1hdGlvbiBmb3IgYW4gaXRlbVxuICAgIGNvbnN0IHN0YXJ0RGVsZXRpbmcgPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBzZXREZWxldGVDb25maXJtSW5kZXgoaW5kZXgpO1xuICAgIH07XG5cbiAgICAvLyBDb25maXJtIGFuZCBwcm9jZWVkIHdpdGggZGVsZXRpb25cbiAgICBjb25zdCBjb25maXJtRGVsZXRlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIGluZGV4IGZvciBjYWxsZXIgdG8gaGFuZGxlLCB0aGVuIGNsZWFyXG4gICAgICAgIC8vIENhbGxlciBzaG91bGQgY2FsbCBmaW5pc2hEZWxldGluZygpIGFmdGVyIGRlbGV0aW9uIHN1Y2NlZWRzXG4gICAgfTtcblxuICAgIC8vIENhbmNlbCBkZWxldGlvblxuICAgIGNvbnN0IGNhbmNlbERlbGV0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgc2V0RGVsZXRlQ29uZmlybUluZGV4KG51bGwpO1xuICAgIH07XG5cbiAgICAvLyBGaW5pc2ggZGVsZXRpb24gKGFmdGVyIHN1Y2Nlc3NmdWwgZGVsZXRlKVxuICAgIGNvbnN0IGZpbmlzaERlbGV0aW5nID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBzZXREZWxldGVDb25maXJtSW5kZXgobnVsbCk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFN0YXRlXG4gICAgICAgIGVkaXRNb2RlLFxuICAgICAgICBlZGl0aW5nSXRlbUluZGV4LFxuICAgICAgICBzaG93Q3JlYXRlRm9ybSxcbiAgICAgICAgZGVsZXRlQ29uZmlybUluZGV4LFxuXG4gICAgICAgIC8vIEFjdGlvbnNcbiAgICAgICAgdG9nZ2xlRWRpdE1vZGUsXG4gICAgICAgIHN0YXJ0RWRpdGluZ0l0ZW0sXG4gICAgICAgIGNhbmNlbEVkaXRpbmcsXG4gICAgICAgIHN0YXJ0Q3JlYXRpbmcsXG4gICAgICAgIGNhbmNlbENyZWF0aW5nLFxuICAgICAgICBzdGFydERlbGV0aW5nLFxuICAgICAgICBjb25maXJtRGVsZXRlLFxuICAgICAgICBjYW5jZWxEZWxldGUsXG4gICAgICAgIGZpbmlzaEVkaXRpbmcsXG4gICAgICAgIGZpbmlzaENyZWF0aW5nLFxuICAgICAgICBmaW5pc2hEZWxldGluZ1xuICAgIH07XG59XG4iLCIvKipcbiAqIEZBUSBBY2NvcmRpb24gQXR0cmlidXRlIENvbmZpZ3VyYXRpb25cbiAqXG4gKiBUaGlzIGZpbGUgZGVmaW5lcyB0aGUgY29udmVudGlvbi1iYXNlZCBhdHRyaWJ1dGUgbmFtZXMgdGhhdCB0aGUgd2lkZ2V0IGV4cGVjdHNcbiAqIG9uIHRoZSBNZW5kaXggZW50aXR5LiBUaGVzZSBkZWZhdWx0cyBjYW4gYmUgb3ZlcnJpZGRlbiB2aWEgd2lkZ2V0IHByb3BlcnRpZXMuXG4gKlxuICogSU1QT1JUQU5UOiBUaGVzZSBhdHRyaWJ1dGUgbmFtZXMgbXVzdCBtYXRjaCBleGFjdGx5IHdpdGggeW91ciBNZW5kaXggZG9tYWluIG1vZGVsLlxuICogVGhlIG5hbWVzIGFyZSBjYXNlLXNlbnNpdGl2ZSBhbmQgc2hvdWxkIG5vdCBpbmNsdWRlIHRoZSBlbnRpdHkgbmFtZSBwcmVmaXguXG4gKi9cblxuLyoqXG4gKiBEZWZhdWx0IGF0dHJpYnV0ZSBuYW1lcyB1c2VkIHdoZW4gbm8gb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkXG4gKi9cbmV4cG9ydCBjb25zdCBGQVFfREVGQVVMVF9BVFRSSUJVVEVTID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBxdWVzdGlvbi90aXRsZSB0ZXh0IChTdHJpbmcvVGV4dCBhdHRyaWJ1dGUpXG4gICAgICovXG4gICAgU1VNTUFSWTogXCJTdW1tYXJ5XCIsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgYW5zd2VyL2RldGFpbGVkIGNvbnRlbnQgKFN0cmluZy9UZXh0IGF0dHJpYnV0ZSlcbiAgICAgKi9cbiAgICBDT05URU5UOiBcIkNvbnRlbnRcIixcblxuICAgIC8qKlxuICAgICAqIFRoZSBmb3JtYXQgb2YgdGhlIGNvbnRlbnQgLSAnaHRtbCcsICd0ZXh0Jywgb3IgJ21hcmtkb3duJyAoU3RyaW5nL0VudW0gYXR0cmlidXRlKVxuICAgICAqL1xuICAgIENPTlRFTlRfRk9STUFUOiBcIkNvbnRlbnRGb3JtYXRcIixcblxuICAgIC8qKlxuICAgICAqIFRoZSBzb3J0IG9yZGVyIGZvciBwb3NpdGlvbmluZyBpdGVtcyAoSW50ZWdlci9Mb25nL0RlY2ltYWwgYXR0cmlidXRlKVxuICAgICAqL1xuICAgIFNPUlRfT1JERVI6IFwiU29ydE9yZGVyXCJcbn0gYXMgY29uc3Q7XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciBhdHRyaWJ1dGUgb3ZlcnJpZGVzIGZyb20gd2lkZ2V0IGNvbmZpZ3VyYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGQVFBdHRyaWJ1dGVPdmVycmlkZXMge1xuICAgIHN1bW1hcnlBdHRyaWJ1dGU/OiBzdHJpbmc7XG4gICAgY29udGVudEF0dHJpYnV0ZT86IHN0cmluZztcbiAgICBjb250ZW50Rm9ybWF0QXR0cmlidXRlPzogc3RyaW5nO1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZT86IHN0cmluZztcbn1cblxuLyoqXG4gKiBJbnRlcmZhY2UgZm9yIHRoZSByZXNvbHZlZCBGQVEgYXR0cmlidXRlc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZBUUF0dHJpYnV0ZU5hbWVzIHtcbiAgICBTVU1NQVJZOiBzdHJpbmc7XG4gICAgQ09OVEVOVDogc3RyaW5nO1xuICAgIENPTlRFTlRfRk9STUFUOiBzdHJpbmc7XG4gICAgU09SVF9PUkRFUjogc3RyaW5nO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHRoZSBhdHRyaWJ1dGUgbmFtZSBmcm9tIGEgTGlzdEF0dHJpYnV0ZVZhbHVlJ3MgaWRcbiAqIFRoZSBpZCBpcyB0eXBpY2FsbHkgaW4gZm9ybWF0IFwiTW9kdWxlTmFtZS5FbnRpdHlOYW1lL2F0dHJpYnV0ZU5hbWVcIlxuICogQHBhcmFtIGF0dHJpYnV0ZUlkIC0gVGhlIGZ1bGwgYXR0cmlidXRlIGlkIGZyb20gTGlzdEF0dHJpYnV0ZVZhbHVlXG4gKiBAcmV0dXJucyBUaGUgYXR0cmlidXRlIG5hbWUgb25seVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEF0dHJpYnV0ZU5hbWUoYXR0cmlidXRlSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCFhdHRyaWJ1dGVJZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBFeHRyYWN0IHRoZSBhdHRyaWJ1dGUgbmFtZSBhZnRlciB0aGUgbGFzdCBcIi9cIlxuICAgIGNvbnN0IHBhcnRzID0gYXR0cmlidXRlSWQuc3BsaXQoXCIvXCIpO1xuICAgIHJldHVybiBwYXJ0cy5sZW5ndGggPiAxID8gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gOiBhdHRyaWJ1dGVJZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSByZXNvbHZlZCBGQVEgYXR0cmlidXRlcyBieSBtZXJnaW5nIG92ZXJyaWRlcyB3aXRoIGRlZmF1bHRzXG4gKiBAcGFyYW0gb3ZlcnJpZGVzIC0gT3B0aW9uYWwgYXR0cmlidXRlIG92ZXJyaWRlcyBmcm9tIHdpZGdldCBjb25maWd1cmF0aW9uXG4gKiBAcmV0dXJucyBSZXNvbHZlZCBhdHRyaWJ1dGUgbmFtZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZBUUF0dHJpYnV0ZXMob3ZlcnJpZGVzPzogRkFRQXR0cmlidXRlT3ZlcnJpZGVzKTogRkFRQXR0cmlidXRlTmFtZXMge1xuICAgIHJldHVybiB7XG4gICAgICAgIFNVTU1BUlk6IG92ZXJyaWRlcz8uc3VtbWFyeUF0dHJpYnV0ZVxuICAgICAgICAgICAgPyBleHRyYWN0QXR0cmlidXRlTmFtZShvdmVycmlkZXMuc3VtbWFyeUF0dHJpYnV0ZSkgfHwgRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5TVU1NQVJZXG4gICAgICAgICAgICA6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSxcbiAgICAgICAgQ09OVEVOVDogb3ZlcnJpZGVzPy5jb250ZW50QXR0cmlidXRlXG4gICAgICAgICAgICA/IGV4dHJhY3RBdHRyaWJ1dGVOYW1lKG92ZXJyaWRlcy5jb250ZW50QXR0cmlidXRlKSB8fCBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRcbiAgICAgICAgICAgIDogRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5ULFxuICAgICAgICBDT05URU5UX0ZPUk1BVDogb3ZlcnJpZGVzPy5jb250ZW50Rm9ybWF0QXR0cmlidXRlXG4gICAgICAgICAgICA/IGV4dHJhY3RBdHRyaWJ1dGVOYW1lKG92ZXJyaWRlcy5jb250ZW50Rm9ybWF0QXR0cmlidXRlKSB8fFxuICAgICAgICAgICAgICBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRfRk9STUFUXG4gICAgICAgICAgICA6IEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVF9GT1JNQVQsXG4gICAgICAgIFNPUlRfT1JERVI6IG92ZXJyaWRlcz8uc29ydE9yZGVyQXR0cmlidXRlXG4gICAgICAgICAgICA/IGV4dHJhY3RBdHRyaWJ1dGVOYW1lKG92ZXJyaWRlcy5zb3J0T3JkZXJBdHRyaWJ1dGUpIHx8XG4gICAgICAgICAgICAgIEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUlxuICAgICAgICAgICAgOiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVJcbiAgICB9O1xufVxuXG4vKipcbiAqIExlZ2FjeSBleHBvcnQgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAqIEBkZXByZWNhdGVkIFVzZSBnZXRGQVFBdHRyaWJ1dGVzKCkgd2l0aCBvdmVycmlkZXMgaW5zdGVhZFxuICovXG5leHBvcnQgY29uc3QgRkFRX0FUVFJJQlVURVMgPSBGQVFfREVGQVVMVF9BVFRSSUJVVEVTO1xuXG4vKipcbiAqIFR5cGUtc2FmZSBhY2Nlc3NvciBmb3IgYXR0cmlidXRlIG5hbWVzXG4gKi9cbmV4cG9ydCB0eXBlIEZBUUF0dHJpYnV0ZU5hbWUgPSAodHlwZW9mIEZBUV9ERUZBVUxUX0FUVFJJQlVURVMpW2tleW9mIHR5cGVvZiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTXTtcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBhbGwgcmVxdWlyZWQgYXR0cmlidXRlcyBleGlzdCBvbiBhbiBNeE9iamVjdFxuICogQHBhcmFtIG14T2JqIC0gVGhlIE1lbmRpeCBvYmplY3QgdG8gdmFsaWRhdGVcbiAqIEBwYXJhbSBhdHRyaWJ1dGVzIC0gVGhlIHJlc29sdmVkIGF0dHJpYnV0ZSBuYW1lcyB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgT2JqZWN0IHdpdGggdmFsaWRhdGlvbiByZXN1bHQgYW5kIG1pc3NpbmcgYXR0cmlidXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVSZXF1aXJlZEF0dHJpYnV0ZXMoXG4gICAgbXhPYmo6IGFueSxcbiAgICBhdHRyaWJ1dGVzOiBGQVFBdHRyaWJ1dGVOYW1lcyA9IEZBUV9ERUZBVUxUX0FUVFJJQlVURVNcbik6IHtcbiAgICBpc1ZhbGlkOiBib29sZWFuO1xuICAgIG1pc3NpbmdBdHRyaWJ1dGVzOiBzdHJpbmdbXTtcbn0ge1xuICAgIGNvbnN0IGF2YWlsYWJsZUF0dHJpYnV0ZXMgPSBteE9iai5nZXRBdHRyaWJ1dGVzKCk7XG4gICAgY29uc3QgcmVxdWlyZWRBdHRyaWJ1dGVzID0gT2JqZWN0LnZhbHVlcyhhdHRyaWJ1dGVzKTtcblxuICAgIGNvbnN0IG1pc3NpbmdBdHRyaWJ1dGVzID0gcmVxdWlyZWRBdHRyaWJ1dGVzLmZpbHRlcihcbiAgICAgICAgKGF0dHIpID0+ICFhdmFpbGFibGVBdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHIpXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGlzVmFsaWQ6IG1pc3NpbmdBdHRyaWJ1dGVzLmxlbmd0aCA9PT0gMCxcbiAgICAgICAgbWlzc2luZ0F0dHJpYnV0ZXNcbiAgICB9O1xufVxuIiwiLyoqXG4gKiBNZW5kaXggRGF0YSBTZXJ2aWNlIC0gQ2VudHJhbGl6ZWQgc2VydmljZSBmb3IgTWVuZGl4IENsaWVudCBBUEkgb3BlcmF0aW9uc1xuICogSGFuZGxlcyBDUlVEIG9wZXJhdGlvbnMgd2l0aCBjb25zaXN0ZW50IGVycm9yIGhhbmRsaW5nIGFuZCBkYXRhIHNvdXJjZSByZWxvYWRpbmdcbiAqXG4gKiBDT05WRU5USU9OOiBUaGlzIHNlcnZpY2UgZXhwZWN0cyBlbnRpdGllcyB0byBoYXZlIGF0dHJpYnV0ZXMgZGVmaW5lZCBpbiBhdHRyaWJ1dGVDb25maWcudHNcbiAqIFNlZSBzcmMvY29uZmlnL2F0dHJpYnV0ZUNvbmZpZy50cyBmb3IgdGhlIGF0dHJpYnV0ZSBuYW1lIGNvbmZpZ3VyYXRpb25cbiAqL1xuaW1wb3J0IHsgT2JqZWN0SXRlbSB9IGZyb20gXCJtZW5kaXhcIjtcbmltcG9ydCBCaWcgZnJvbSBcImJpZy5qc1wiO1xuaW1wb3J0IHsgRkFRX0FUVFJJQlVURVMgfSBmcm9tIFwiLi4vY29uZmlnL2F0dHJpYnV0ZUNvbmZpZ1wiO1xuXG4vLyBNZW5kaXggQ2xpZW50IEFQSSB0eXBlIGRlY2xhcmF0aW9uc1xuZGVjbGFyZSBnbG9iYWwge1xuICAgIGludGVyZmFjZSBXaW5kb3cge1xuICAgICAgICBteD86IHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBnZXQob3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBndWlkOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAob2JqOiBhbnkpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yPzogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICB9KTogdm9pZDtcbiAgICAgICAgICAgICAgICBjb21taXQob3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBteG9iajogYW55O1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4gdm9pZDtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgfSk6IHZvaWQ7XG4gICAgICAgICAgICAgICAgY3JlYXRlKG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgZW50aXR5OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAob2JqOiBhbnkpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIH0pOiB2b2lkO1xuICAgICAgICAgICAgICAgIHJlbW92ZShvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIGd1aWRzOiBzdHJpbmdbXTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQ7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICAgICAgICAgICAgICAgIH0pOiB2b2lkO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgTWVuZGl4IG14IGdsb2JhbCBvYmplY3Qgc2FmZWx5XG4gKi9cbmZ1bmN0aW9uIGdldE14KCk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93Lm14KSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cubXg7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIChnbG9iYWwgYXMgYW55KS53aW5kb3c/Lm14KSB7XG4gICAgICAgIHJldHVybiAoZ2xvYmFsIGFzIGFueSkud2luZG93Lm14O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBmdWxsIE14T2JqZWN0IGZyb20gYW4gT2JqZWN0SXRlbVxuICogT2JqZWN0SXRlbSBmcm9tIGRhdGFzb3VyY2Ugb25seSBoYXMgJ2lkJywgd2UgbmVlZCB0byBmZXRjaCB0aGUgZnVsbCBvYmplY3RcbiAqIEBwYXJhbSBvYmogLSBPYmplY3RJdGVtIGZyb20gZGF0YXNvdXJjZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGZ1bGwgTXhPYmplY3RcbiAqL1xuZnVuY3Rpb24gZ2V0TXhPYmplY3Qob2JqOiBPYmplY3RJdGVtKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBteCA9IGdldE14KCk7XG4gICAgICAgIGlmICghbXggfHwgIW14LmRhdGEpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNZW5kaXggQ2xpZW50IEFQSSAobXguZGF0YSkgbm90IGF2YWlsYWJsZVwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBndWlkID0gZ2V0T2JqZWN0R3VpZChvYmopO1xuXG4gICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgIGd1aWQ6IGd1aWQsXG4gICAgICAgICAgICBjYWxsYmFjazogKG14T2JqOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG14T2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGVudGl0eSBuYW1lIGZyb20gYSBNZW5kaXggb2JqZWN0XG4gKiBAcGFyYW0gbXhPYmogLSBNZW5kaXggb2JqZWN0XG4gKiBAcmV0dXJucyBFbnRpdHkgbmFtZSAoZS5nLiwgXCJNeUZpcnN0TW9kdWxlLkZBUVwiKVxuICovXG5mdW5jdGlvbiBnZXRFbnRpdHlOYW1lRnJvbU9iamVjdChteE9iajogYW55KTogc3RyaW5nIHtcbiAgICBpZiAobXhPYmouZ2V0RW50aXR5ICYmIHR5cGVvZiBteE9iai5nZXRFbnRpdHkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gbXhPYmouZ2V0RW50aXR5KCk7XG4gICAgfVxuICAgIGlmIChteE9iai5lbnRpdHkpIHtcbiAgICAgICAgcmV0dXJuIG14T2JqLmVudGl0eTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGRldGVybWluZSBlbnRpdHkgbmFtZSBmcm9tIG9iamVjdFwiKTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBHVUlEIGZyb20gYSBNZW5kaXggb2JqZWN0LCBoYW5kbGluZyBib3RoIG1ldGhvZHNcbiAqIEBwYXJhbSBvYmogLSBNZW5kaXggb2JqZWN0IGl0ZW1cbiAqIEByZXR1cm5zIEdVSUQgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPYmplY3RHdWlkKG9iajogT2JqZWN0SXRlbSk6IHN0cmluZyB7XG4gICAgLy8gVHJ5IHRoZSBnZXRHdWlkKCkgbWV0aG9kIGZpcnN0XG4gICAgaWYgKChvYmogYXMgYW55KS5nZXRHdWlkICYmIHR5cGVvZiAob2JqIGFzIGFueSkuZ2V0R3VpZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IGd1aWQgPSAob2JqIGFzIGFueSkuZ2V0R3VpZCgpO1xuICAgICAgICBpZiAoZ3VpZCkgcmV0dXJuIGd1aWQ7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgdG8gZ3VpZCBwcm9wZXJ0eVxuICAgIGlmICgob2JqIGFzIGFueSkuZ3VpZCkge1xuICAgICAgICByZXR1cm4gKG9iaiBhcyBhbnkpLmd1aWQ7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgdG8gaWQgcHJvcGVydHkgKGZyb20gT2JqZWN0SXRlbSBpbnRlcmZhY2UpXG4gICAgaWYgKG9iai5pZCkge1xuICAgICAgICByZXR1cm4gb2JqLmlkO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBleHRyYWN0IEdVSUQgZnJvbSBvYmplY3RcIik7XG59XG5cbi8qKlxuICogUmVsb2FkcyBhIGRhdGEgc291cmNlIGlmIHRoZSByZWxvYWQgbWV0aG9kIGlzIGF2YWlsYWJsZVxuICogQHBhcmFtIGRhdGFTb3VyY2UgLSBNZW5kaXggZGF0YSBzb3VyY2UgdG8gcmVsb2FkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxvYWREYXRhU291cmNlKGRhdGFTb3VyY2U6IGFueSk6IHZvaWQge1xuICAgIGlmIChkYXRhU291cmNlICYmIHR5cGVvZiBkYXRhU291cmNlLnJlbG9hZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGRhdGFTb3VyY2UucmVsb2FkKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIGVudGl0eSBuYW1lIGZyb20gYSBkYXRhIHNvdXJjZVxuICogRm9yIExpc3RWYWx1ZSBkYXRhc291cmNlcywgd2UgZ2V0IHRoZSBlbnRpdHkgZnJvbSB0aGUgZmlyc3QgaXRlbSdzIE14T2JqZWN0XG4gKiBAcGFyYW0gZGF0YVNvdXJjZSAtIE1lbmRpeCBkYXRhIHNvdXJjZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggZW50aXR5IG5hbWUgb3IgbnVsbCBpZiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEVudGl0eU5hbWUoZGF0YVNvdXJjZTogYW55KTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZGF0YVNvdXJjZTpcIiwgZGF0YVNvdXJjZSk7XG4gICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZGF0YVNvdXJjZSBrZXlzOlwiLCBPYmplY3Qua2V5cyhkYXRhU291cmNlIHx8IHt9KSk7XG5cbiAgICAvLyBUcnkgdG8gZ2V0IGVudGl0eSBmcm9tIGRhdGFzb3VyY2UgbWV0YWRhdGEgKGxlZ2FjeSBhcHByb2FjaClcbiAgICBpZiAoZGF0YVNvdXJjZT8uX2VudGl0eSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImdldEVudGl0eU5hbWUgLSBmb3VuZCBfZW50aXR5OlwiLCBkYXRhU291cmNlLl9lbnRpdHkpO1xuICAgICAgICByZXR1cm4gZGF0YVNvdXJjZS5fZW50aXR5O1xuICAgIH1cbiAgICBpZiAoZGF0YVNvdXJjZT8uZW50aXR5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0RW50aXR5TmFtZSAtIGZvdW5kIGVudGl0eTpcIiwgZGF0YVNvdXJjZS5lbnRpdHkpO1xuICAgICAgICByZXR1cm4gZGF0YVNvdXJjZS5lbnRpdHk7XG4gICAgfVxuXG4gICAgLy8gRm9yIExpc3RWYWx1ZSBkYXRhc291cmNlcywgZ2V0IGVudGl0eSBmcm9tIHRoZSBmaXJzdCBpdGVtJ3MgTXhPYmplY3RcbiAgICBpZiAoZGF0YVNvdXJjZT8uaXRlbXMgJiYgZGF0YVNvdXJjZS5pdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBmaXJzdEl0ZW0gPSBkYXRhU291cmNlLml0ZW1zWzBdO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZmV0Y2hpbmcgZmlyc3QgaXRlbSBNeE9iamVjdC4uLlwiKTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggdGhlIGZ1bGwgTXhPYmplY3QgdG8gZ2V0IGVudGl0eSBuYW1lXG4gICAgICAgICAgICBjb25zdCBteE9iaiA9IGF3YWl0IGdldE14T2JqZWN0KGZpcnN0SXRlbSk7XG4gICAgICAgICAgICBjb25zdCBlbnRpdHlOYW1lID0gZ2V0RW50aXR5TmFtZUZyb21PYmplY3QobXhPYmopO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gZnJvbSBNeE9iamVjdDpcIiwgZW50aXR5TmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gZW50aXR5TmFtZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJnZXRFbnRpdHlOYW1lIC0gZmFpbGVkIHRvIGdldCBNeE9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXCJnZXRFbnRpdHlOYW1lIC0gbm90IGZvdW5kLCByZXR1cm5pbmcgbnVsbFwiKTtcbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBuZXh0IHNvcnQgb3JkZXIgdmFsdWUgZm9yIGEgbmV3IGl0ZW1cbiAqIEBwYXJhbSBpdGVtcyAtIEFycmF5IG9mIGV4aXN0aW5nIGl0ZW1zXG4gKiBAcGFyYW0gc29ydE9yZGVyQXR0cmlidXRlIC0gU29ydCBvcmRlciBhdHRyaWJ1dGUgYWNjZXNzb3JcbiAqIEByZXR1cm5zIE5leHQgc29ydCBvcmRlciB2YWx1ZSAobWF4ICsgMTApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZXh0U29ydE9yZGVyKGl0ZW1zOiBPYmplY3RJdGVtW10gfCB1bmRlZmluZWQsIHNvcnRPcmRlckF0dHJpYnV0ZTogYW55KTogQmlnIHtcbiAgICBjb25zdCBtYXhTb3J0T3JkZXIgPVxuICAgICAgICBpdGVtcz8ucmVkdWNlKChtYXgsIGl0ZW0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvcnRPcmRlciA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoaXRlbSkudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gc29ydE9yZGVyICYmIHNvcnRPcmRlci50b051bWJlcigpID4gbWF4ID8gc29ydE9yZGVyLnRvTnVtYmVyKCkgOiBtYXg7XG4gICAgICAgIH0sIDApIHx8IDA7XG5cbiAgICByZXR1cm4gbmV3IEJpZyhtYXhTb3J0T3JkZXIgKyAxMCk7XG59XG5cbi8qKlxuICogQ29tbWl0cyBhIE1lbmRpeCBvYmplY3QgdG8gdGhlIGRhdGFiYXNlXG4gKiBAcGFyYW0gb2JqIC0gTXhPYmplY3QgdG8gY29tbWl0IChmdWxsIG9iamVjdCwgbm90IGp1c3QgT2JqZWN0SXRlbSlcbiAqIEBwYXJhbSBkYXRhU291cmNlIC0gT3B0aW9uYWwgZGF0YSBzb3VyY2UgdG8gcmVsb2FkIGFmdGVyIGNvbW1pdFxuICogQHBhcmFtIHN1Y2Nlc3NNZXNzYWdlIC0gT3B0aW9uYWwgc3VjY2VzcyBsb2cgbWVzc2FnZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gY29tbWl0IHN1Y2NlZWRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21taXRPYmplY3Qob2JqOiBhbnksIGRhdGFTb3VyY2U/OiBhbnksIHN1Y2Nlc3NNZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbXggPSBnZXRNeCgpO1xuICAgICAgICBpZiAoIW14IHx8ICFteC5kYXRhKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiTWVuZGl4IENsaWVudCBBUEkgKG14LmRhdGEpIG5vdCBhdmFpbGFibGVcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJjb21taXRPYmplY3QgLSBjb21taXR0aW5nIG9iamVjdDpcIiwgb2JqLmdldEVudGl0eT8uKCkpO1xuXG4gICAgICAgIG14LmRhdGEuY29tbWl0KHtcbiAgICAgICAgICAgIG14b2JqOiBvYmosXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbG9hZERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY29tbWl0IG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIERlbGV0ZXMgYSBNZW5kaXggb2JqZWN0IGZyb20gdGhlIGRhdGFiYXNlXG4gKiBAcGFyYW0gb2JqIC0gT2JqZWN0IHRvIGRlbGV0ZVxuICogQHBhcmFtIGRhdGFTb3VyY2UgLSBPcHRpb25hbCBkYXRhIHNvdXJjZSB0byByZWxvYWQgYWZ0ZXIgZGVsZXRpb25cbiAqIEBwYXJhbSBzdWNjZXNzTWVzc2FnZSAtIE9wdGlvbmFsIHN1Y2Nlc3MgbG9nIG1lc3NhZ2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGRlbGV0aW9uIHN1Y2NlZWRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVPYmplY3QoXG4gICAgb2JqOiBPYmplY3RJdGVtLFxuICAgIGRhdGFTb3VyY2U/OiBhbnksXG4gICAgc3VjY2Vzc01lc3NhZ2U/OiBzdHJpbmdcbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IG14ID0gZ2V0TXgoKTtcbiAgICAgICAgaWYgKCFteCB8fCAhbXguZGF0YSkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIk1lbmRpeCBDbGllbnQgQVBJIChteC5kYXRhKSBub3QgYXZhaWxhYmxlXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBndWlkOiBzdHJpbmc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBndWlkID0gZ2V0T2JqZWN0R3VpZChvYmopO1xuICAgICAgICAgICAgaWYgKCFndWlkIHx8IHR5cGVvZiBndWlkICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIEdVSUQ6ICR7Z3VpZH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZ2V0IG9iamVjdCBHVUlEOlwiLCBlcnJvcik7XG4gICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbXguZGF0YS5yZW1vdmUoe1xuICAgICAgICAgICAgZ3VpZHM6IFtndWlkXSxcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN1Y2Nlc3NNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRhdGFTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVsb2FkRGF0YVNvdXJjZShkYXRhU291cmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBkZWxldGUgb2JqZWN0OlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBNZW5kaXggb2JqZWN0XG4gKiBAcGFyYW0gZW50aXR5TmFtZSAtIEVudGl0eSBuYW1lIHRvIGNyZWF0ZVxuICogQHBhcmFtIHN1Y2Nlc3NNZXNzYWdlIC0gT3B0aW9uYWwgc3VjY2VzcyBsb2cgbWVzc2FnZVxuICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGNyZWF0ZWQgTXhPYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU9iamVjdChlbnRpdHlOYW1lOiBzdHJpbmcsIHN1Y2Nlc3NNZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBteCA9IGdldE14KCk7XG4gICAgICAgIGlmICghbXggfHwgIW14LmRhdGEpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNZW5kaXggQ2xpZW50IEFQSSAobXguZGF0YSkgbm90IGF2YWlsYWJsZVwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBteC5kYXRhLmNyZWF0ZSh7XG4gICAgICAgICAgICBlbnRpdHk6IGVudGl0eU5hbWUsXG4gICAgICAgICAgICBjYWxsYmFjazogKG9iajogT2JqZWN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUob2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY3JlYXRlIG9iamVjdDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFN3YXBzIHRoZSBzb3J0IG9yZGVyIHZhbHVlcyBiZXR3ZWVuIHR3byBpdGVtcyBhbmQgY29tbWl0cyBib3RoXG4gKiBVc2VzIGNvbnZlbnRpb24tYmFzZWQgYXR0cmlidXRlIG5hbWUgXCJTb3J0T3JkZXJcIlxuICogQHBhcmFtIGl0ZW0xIC0gRmlyc3QgaXRlbVxuICogQHBhcmFtIGl0ZW0yIC0gU2Vjb25kIGl0ZW1cbiAqIEBwYXJhbSBvcmRlcjEgLSBDdXJyZW50IHNvcnQgb3JkZXIgb2YgaXRlbTFcbiAqIEBwYXJhbSBvcmRlcjIgLSBDdXJyZW50IHNvcnQgb3JkZXIgb2YgaXRlbTJcbiAqIEBwYXJhbSBkYXRhU291cmNlIC0gT3B0aW9uYWwgZGF0YSBzb3VyY2UgdG8gcmVsb2FkIGFmdGVyIHN3YXBcbiAqIEBwYXJhbSBzdWNjZXNzTWVzc2FnZSAtIE9wdGlvbmFsIHN1Y2Nlc3MgbG9nIG1lc3NhZ2VcbiAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGJvdGggY29tbWl0cyBzdWNjZWVkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzd2FwU29ydE9yZGVycyhcbiAgICBpdGVtMTogT2JqZWN0SXRlbSxcbiAgICBpdGVtMjogT2JqZWN0SXRlbSxcbiAgICBvcmRlck9yQXR0cmlidXRlOiBCaWcgfCBhbnksXG4gICAgb3JkZXIyT3JEYXRhU291cmNlPzogQmlnIHwgYW55LFxuICAgIGRhdGFTb3VyY2U/OiBhbnksXG4gICAgc3VjY2Vzc01lc3NhZ2U/OiBzdHJpbmdcbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG14ID0gZ2V0TXgoKTtcbiAgICBpZiAoIW14IHx8ICFteC5kYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1lbmRpeCBDbGllbnQgQVBJIChteC5kYXRhKSBub3QgYXZhaWxhYmxlXCIpO1xuICAgIH1cblxuICAgIGxldCBvcmRlcjE6IEJpZztcbiAgICBsZXQgb3JkZXIyOiBCaWc7XG4gICAgbGV0IHJlc29sdmVkRGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgbGV0IHJlc29sdmVkU3VjY2Vzc01lc3NhZ2UgPSBzdWNjZXNzTWVzc2FnZTtcblxuICAgIC8vIEJhY2t3YXJkIGNvbXBhdGliaWxpdHk6IGFsbG93IHBhc3Npbmcgc29ydE9yZGVyQXR0cmlidXRlIGFzIHRoaXJkIGFyZ3VtZW50XG4gICAgaWYgKG9yZGVyT3JBdHRyaWJ1dGUgJiYgdHlwZW9mIChvcmRlck9yQXR0cmlidXRlIGFzIGFueSkuZ2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc3Qgc29ydE9yZGVyQXR0cmlidXRlID0gb3JkZXJPckF0dHJpYnV0ZTtcbiAgICAgICAgY29uc3QgdmFsdWUxID0gc29ydE9yZGVyQXR0cmlidXRlLmdldChpdGVtMSkudmFsdWU7XG4gICAgICAgIGNvbnN0IHZhbHVlMiA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoaXRlbTIpLnZhbHVlO1xuXG4gICAgICAgIGlmICh2YWx1ZTEgPT09IG51bGwgfHwgdmFsdWUxID09PSB1bmRlZmluZWQgfHwgdmFsdWUyID09PSBudWxsIHx8IHZhbHVlMiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTb3J0IG9yZGVyIHZhbHVlcyBhcmUgbWlzc2luZ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9yZGVyMSA9IG5ldyBCaWcodmFsdWUxLnRvU3RyaW5nKCkpO1xuICAgICAgICBvcmRlcjIgPSBuZXcgQmlnKHZhbHVlMi50b1N0cmluZygpKTtcbiAgICAgICAgcmVzb2x2ZWREYXRhU291cmNlID0gb3JkZXIyT3JEYXRhU291cmNlO1xuICAgICAgICByZXNvbHZlZFN1Y2Nlc3NNZXNzYWdlID0gZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKG9yZGVyMk9yRGF0YVNvdXJjZSkge1xuICAgICAgICAvLyBQcmVmZXJyZWQgc2lnbmF0dXJlOiBleHBsaWNpdCBvcmRlcjEgYW5kIG9yZGVyMiB2YWx1ZXNcbiAgICAgICAgb3JkZXIxID0gb3JkZXJPckF0dHJpYnV0ZSBhcyBCaWc7XG4gICAgICAgIG9yZGVyMiA9IG9yZGVyMk9yRGF0YVNvdXJjZSBhcyBCaWc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwic3dhcFNvcnRPcmRlcnMgcmVxdWlyZXMgc29ydCBvcmRlciB2YWx1ZXMgb3IgYXR0cmlidXRlIGFjY2Vzc29yXCIpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBTVEFSVFwiKTtcbiAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gb3JkZXIxOlwiLCBvcmRlcjEudG9TdHJpbmcoKSwgXCJvcmRlcjI6XCIsIG9yZGVyMi50b1N0cmluZygpKTtcblxuICAgIC8vIEdldCB0aGUgZnVsbCBNeE9iamVjdHNcbiAgICBjb25zdCBteE9iajEgPSBhd2FpdCBnZXRNeE9iamVjdChpdGVtMSk7XG4gICAgY29uc3QgbXhPYmoyID0gYXdhaXQgZ2V0TXhPYmplY3QoaXRlbTIpO1xuXG4gICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIEdvdCBNeE9iamVjdHNcIik7XG4gICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0xIGVudGl0eTpcIiwgbXhPYmoxLmdldEVudGl0eT8uKCkpO1xuICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMiBlbnRpdHk6XCIsIG14T2JqMi5nZXRFbnRpdHk/LigpKTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0xIGN1cnJlbnQgdmFsdWU6XCIsXG4gICAgICAgIG14T2JqMS5nZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUik/LnRvU3RyaW5nKClcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBcInN3YXBTb3J0T3JkZXJzIC0gaXRlbTIgY3VycmVudCB2YWx1ZTpcIixcbiAgICAgICAgbXhPYmoyLmdldChGQVFfQVRUUklCVVRFUy5TT1JUX09SREVSKT8udG9TdHJpbmcoKVxuICAgICk7XG5cbiAgICAvLyBTd2FwIHRoZSB2YWx1ZXNcbiAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gU2V0dGluZyBuZXcgdmFsdWVzLi4uXCIpO1xuICAgIG14T2JqMS5zZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUiwgb3JkZXIyKTtcbiAgICBteE9iajIuc2V0KEZBUV9BVFRSSUJVVEVTLlNPUlRfT1JERVIsIG9yZGVyMSk7XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgXCJzd2FwU29ydE9yZGVycyAtIGl0ZW0xIG5ldyB2YWx1ZTpcIixcbiAgICAgICAgbXhPYmoxLmdldChGQVFfQVRUUklCVVRFUy5TT1JUX09SREVSKT8udG9TdHJpbmcoKVxuICAgICk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAgIFwic3dhcFNvcnRPcmRlcnMgLSBpdGVtMiBuZXcgdmFsdWU6XCIsXG4gICAgICAgIG14T2JqMi5nZXQoRkFRX0FUVFJJQlVURVMuU09SVF9PUkRFUik/LnRvU3RyaW5nKClcbiAgICApO1xuXG4gICAgLy8gQ29tbWl0IGJvdGggb2JqZWN0c1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBTdGFydGluZyBjb21taXQgb2YgZmlyc3Qgb2JqZWN0Li4uXCIpO1xuICAgICAgICBteC5kYXRhLmNvbW1pdCh7XG4gICAgICAgICAgICBteG9iajogbXhPYmoxLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN3YXBTb3J0T3JkZXJzIC0gY29tbWl0dGVkIG14T2JqMSDinJNcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIFN0YXJ0aW5nIGNvbW1pdCBvZiBzZWNvbmQgb2JqZWN0Li4uXCIpO1xuICAgICAgICAgICAgICAgIG14LmRhdGEuY29tbWl0KHtcbiAgICAgICAgICAgICAgICAgICAgbXhvYmo6IG14T2JqMixcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBjb21taXR0ZWQgbXhPYmoyIOKck1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZFN1Y2Nlc3NNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzb2x2ZWRTdWNjZXNzTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWREYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzd2FwU29ydE9yZGVycyAtIFJlbG9hZGluZyBkYXRhc291cmNlLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbG9hZERhdGFTb3VyY2UocmVzb2x2ZWREYXRhU291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3dhcFNvcnRPcmRlcnMgLSBDT01QTEVURSDinJNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGNvbW1pdCBzZWNvbmQgaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN3YXBTb3J0T3JkZXJzIC0gRXJyb3IgZGV0YWlsczpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnN0YWNrXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBjb21taXQgZmlyc3QgaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzd2FwU29ydE9yZGVycyAtIEVycm9yIGRldGFpbHM6XCIsIGVycm9yLm1lc3NhZ2UsIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbiIsImltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZU1lbW8gfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IE9iamVjdEl0ZW0sIExpc3RWYWx1ZSwgTGlzdEF0dHJpYnV0ZVZhbHVlIH0gZnJvbSBcIm1lbmRpeFwiO1xuaW1wb3J0IEJpZyBmcm9tIFwiYmlnLmpzXCI7XG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgeyBGQVFfREVGQVVMVF9BVFRSSUJVVEVTIH0gZnJvbSBcIi4uL2NvbmZpZy9hdHRyaWJ1dGVDb25maWdcIjtcbmltcG9ydCB7IGdldE5leHRTb3J0T3JkZXIgfSBmcm9tIFwiLi4vdXRpbHMvbWVuZGl4RGF0YVNlcnZpY2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBGQVFJdGVtIHtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgY29udGVudDogc3RyaW5nO1xuICAgIGNvbnRlbnRGb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtO1xuICAgIHNvcnRPcmRlcj86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIFN0YXRpY0ZBUUl0ZW0ge1xuICAgIHN1bW1hcnk/OiB7IHZhbHVlPzogc3RyaW5nIH07XG4gICAgY29udGVudD86IHsgdmFsdWU/OiBzdHJpbmcgfTtcbiAgICBjb250ZW50Rm9ybWF0Pzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEF0dHJpYnV0ZSBvdmVycmlkZXMgdXNpbmcgTGlzdEF0dHJpYnV0ZVZhbHVlIGZvciBkaXJlY3QgYWNjZXNzXG4gKi9cbmludGVyZmFjZSBBdHRyaWJ1dGVPdmVycmlkZXMge1xuICAgIHN1bW1hcnlBdHRyaWJ1dGU/OiBMaXN0QXR0cmlidXRlVmFsdWU8c3RyaW5nPjtcbiAgICBjb250ZW50QXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPHN0cmluZz47XG4gICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxzdHJpbmc+O1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG59XG5cbmludGVyZmFjZSBVc2VGQVFEYXRhUHJvcHMge1xuICAgIGRhdGFTb3VyY2VUeXBlOiBcInN0YXRpY1wiIHwgXCJkYXRhYmFzZVwiO1xuICAgIGRhdGFTb3VyY2U/OiBMaXN0VmFsdWU7XG4gICAgZmFxSXRlbXM/OiBTdGF0aWNGQVFJdGVtW107XG4gICAgc29ydE9yZGVyQXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG4gICAgYXR0cmlidXRlT3ZlcnJpZGVzPzogQXR0cmlidXRlT3ZlcnJpZGVzO1xufVxuXG5pbnRlcmZhY2UgVXNlRkFRRGF0YVJlc3VsdCB7XG4gICAgaXRlbXM6IEZBUUl0ZW1bXTtcbiAgICBpc0xvYWRpbmc6IGJvb2xlYW47XG4gICAgZGVmYXVsdFNvcnRPcmRlcjogbnVtYmVyO1xuICAgIHNvcnRhYmxlSWRzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGNvbnRlbnQgZm9ybWF0IHZhbHVlIHRvIHZhbGlkIGZvcm1hdCBvciBkZWZhdWx0cyB0byBIVE1MXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0OiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogQ29udGVudEZvcm1hdEVudW0ge1xuICAgIGlmICghZm9ybWF0KSB7XG4gICAgICAgIHJldHVybiBcImh0bWxcIjtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxpemVkID0gZm9ybWF0LnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG4gICAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiaHRtbFwiIHx8IG5vcm1hbGl6ZWQgPT09IFwibWFya2Rvd25cIiB8fCBub3JtYWxpemVkID09PSBcInRleHRcIikge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplZCBhcyBDb250ZW50Rm9ybWF0RW51bTtcbiAgICB9XG5cbiAgICBjb25zb2xlLndhcm4oYEZBUSBBY2NvcmRpb246IFVucmVjb2duaXplZCBjb250ZW50IGZvcm1hdCBcIiR7Zm9ybWF0fVwiLCBkZWZhdWx0aW5nIHRvIEhUTUxgKTtcbiAgICByZXR1cm4gXCJodG1sXCI7XG59XG5cbi8qKlxuICogQ3VzdG9tIGhvb2sgdG8gbWFuYWdlIEZBUSBkYXRhIGZldGNoaW5nIGFuZCBzdGF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRkFRRGF0YSh7XG4gICAgZGF0YVNvdXJjZVR5cGUsXG4gICAgZGF0YVNvdXJjZSxcbiAgICBmYXFJdGVtcyxcbiAgICBzb3J0T3JkZXJBdHRyaWJ1dGUsXG4gICAgYXR0cmlidXRlT3ZlcnJpZGVzXG59OiBVc2VGQVFEYXRhUHJvcHMpOiBVc2VGQVFEYXRhUmVzdWx0IHtcbiAgICBjb25zdCBbZGF0YWJhc2VJdGVtcywgc2V0RGF0YWJhc2VJdGVtc10gPSB1c2VTdGF0ZTxGQVFJdGVtW10+KFtdKTtcblxuICAgIC8vIENoZWNrIGlmIEFMTCBhdHRyaWJ1dGUgb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkIChhbGwtb3Itbm90aGluZyBhcHByb2FjaClcbiAgICBjb25zdCBoYXNBbGxPdmVycmlkZXMgPSAhIShcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5zdW1tYXJ5QXR0cmlidXRlICYmXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uY29udGVudEF0dHJpYnV0ZSAmJlxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUgJiZcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5zb3J0T3JkZXJBdHRyaWJ1dGVPdmVycmlkZVxuICAgICk7XG5cbiAgICAvLyBDaGVjayBpZiBBTlkgb3ZlcnJpZGVzIGFyZSBjb25maWd1cmVkIChmb3Igd2FybmluZyBkZXRlY3Rpb24pXG4gICAgY29uc3QgaGFzQW55T3ZlcnJpZGVzID0gISEoXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uc3VtbWFyeUF0dHJpYnV0ZSB8fFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LmNvbnRlbnRBdHRyaWJ1dGUgfHxcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5jb250ZW50Rm9ybWF0QXR0cmlidXRlIHx8XG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGVcbiAgICApO1xuXG4gICAgLy8gRmV0Y2ggRkFRIGl0ZW1zIGZyb20gZGF0YWJhc2VcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIGRhdGFTb3VyY2Uuc3RhdHVzID09PSBcImF2YWlsYWJsZVwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IOKcqCBSRUZFVENISU5HIGl0ZW1zIGZyb20gZGF0YXNvdXJjZVwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogSXRlbSBjb3VudDpcIiwgZGF0YVNvdXJjZS5pdGVtcz8ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogQWxsIG92ZXJyaWRlcyBjb25maWd1cmVkOlwiLCBoYXNBbGxPdmVycmlkZXMpO1xuXG4gICAgICAgICAgICBpZiAoIWRhdGFTb3VyY2UuaXRlbXMgfHwgZGF0YVNvdXJjZS5pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IE5vIGl0ZW1zIHRvIGZldGNoXCIpO1xuICAgICAgICAgICAgICAgIHNldERhdGFiYXNlSXRlbXMoW10pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgQUxMIG92ZXJyaWRlcyBhcmUgY29uZmlndXJlZCwgdXNlIExpc3RBdHRyaWJ1dGVWYWx1ZS5nZXQoKSBkaXJlY3RseVxuICAgICAgICAgICAgaWYgKGhhc0FsbE92ZXJyaWRlcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogVXNpbmcgYXR0cmlidXRlIG92ZXJyaWRlcyB2aWEgTGlzdEF0dHJpYnV0ZVZhbHVlLmdldCgpXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gZGF0YVNvdXJjZS5pdGVtcy5tYXAoKGl0ZW06IE9iamVjdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3VtbWFyeSA9IGF0dHJpYnV0ZU92ZXJyaWRlcy5zdW1tYXJ5QXR0cmlidXRlIS5nZXQoaXRlbSk/LnZhbHVlIHx8IFwiUXVlc3Rpb25cIjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF0dHJpYnV0ZU92ZXJyaWRlcy5jb250ZW50QXR0cmlidXRlIS5nZXQoaXRlbSk/LnZhbHVlIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdFZhbHVlID0gYXR0cmlidXRlT3ZlcnJpZGVzLmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUhLmdldChpdGVtKT8udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdCA9IG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3U29ydE9yZGVyID0gYXR0cmlidXRlT3ZlcnJpZGVzLnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlIS5nZXQoaXRlbSk/LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc29ydE9yZGVyOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyYXdTb3J0T3JkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlciA9IE51bWJlcihyYXdTb3J0T3JkZXIudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4oc29ydE9yZGVyKSkgc29ydE9yZGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VtbWFyeSwgY29udGVudCwgY29udGVudEZvcm1hdDogZm9ybWF0LCBzb3J0T3JkZXIgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IEl0ZW1zIGxvYWRlZCB2aWEgb3ZlcnJpZGVzOlwiLCBpdGVtcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHNldERhdGFiYXNlSXRlbXMoaXRlbXMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2FybiBpZiBwYXJ0aWFsIG92ZXJyaWRlcyBjb25maWd1cmVkXG4gICAgICAgICAgICBpZiAoaGFzQW55T3ZlcnJpZGVzICYmICFoYXNBbGxPdmVycmlkZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJGQVEgQWNjb3JkaW9uOiBQYXJ0aWFsIG92ZXJyaWRlcyBkZXRlY3RlZCEgWW91IG11c3QgY29uZmlndXJlIEFMTCBmb3VyIGF0dHJpYnV0ZSBvdmVycmlkZXMgb3IgTk9ORS4gRmFsbGluZyBiYWNrIHRvIGRlZmF1bHRzLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXNlIG14LmRhdGEuZ2V0IHdpdGggY29udmVudGlvbi1iYXNlZCBhdHRyaWJ1dGUgbmFtZXMgKGRlZmF1bHRzKVxuICAgICAgICAgICAgY29uc3QgZmV0Y2hJdGVtcyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBteCA9ICh3aW5kb3cgYXMgYW55KS5teDtcbiAgICAgICAgICAgICAgICBpZiAoIW14KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogbXggbm90IGF2YWlsYWJsZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RGF0YWJhc2VJdGVtcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFVzaW5nIGRlZmF1bHQgYXR0cmlidXRlIG5hbWVzIHZpYSBteC5kYXRhLmdldCgpXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZS5pdGVtcyEubWFwKGFzeW5jIChpdGVtOiBPYmplY3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEZBUUl0ZW0+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1aWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKG14T2JqOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSkgfHwgXCJRdWVzdGlvblwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBteE9iai5nZXQoRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5UKSB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdFZhbHVlID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuQ09OVEVOVF9GT1JNQVQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdCA9IG5vcm1hbGl6ZUNvbnRlbnRGb3JtYXQoZm9ybWF0VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3U29ydE9yZGVyID0gbXhPYmouZ2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvcnRPcmRlcjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXdTb3J0T3JkZXIgIT09IHVuZGVmaW5lZCAmJiByYXdTb3J0T3JkZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlciA9IE51bWJlcihyYXdTb3J0T3JkZXIudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4oc29ydE9yZGVyKSkgc29ydE9yZGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdW1tYXJ5LCBjb250ZW50LCBjb250ZW50Rm9ybWF0OiBmb3JtYXQsIHNvcnRPcmRlciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZmV0Y2ggaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBcIkVycm9yIGxvYWRpbmcgcXVlc3Rpb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlcjogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBJdGVtcyBsb2FkZWQgdmlhIG14LmRhdGEuZ2V0OlwiLCBpdGVtcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBzZXREYXRhYmFzZUl0ZW1zKGl0ZW1zKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIGZldGNoIEZBUSBpdGVtczpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBzZXREYXRhYmFzZUl0ZW1zKFtdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmZXRjaEl0ZW1zKCk7XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFTb3VyY2UsIGRhdGFTb3VyY2U/LnN0YXR1cywgZGF0YVNvdXJjZT8uaXRlbXMsIGhhc0FsbE92ZXJyaWRlcywgaGFzQW55T3ZlcnJpZGVzLCBhdHRyaWJ1dGVPdmVycmlkZXMsIHNvcnRPcmRlckF0dHJpYnV0ZV0pO1xuXG4gICAgLy8gR2V0IEZBUSBpdGVtcyBmcm9tIGVpdGhlciBzdGF0aWMgY29uZmlndXJhdGlvbiBvciBkYXRhYmFzZVxuICAgIGNvbnN0IGl0ZW1zID0gdXNlTWVtbzxGQVFJdGVtW10+KCgpID0+IHtcbiAgICAgICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhYmFzZUl0ZW1zO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICBmYXFJdGVtcz8ubWFwKChpdGVtLCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogaXRlbS5zdW1tYXJ5Py52YWx1ZSB8fCBcIlF1ZXN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGl0ZW0uY29udGVudD8udmFsdWUgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogbm9ybWFsaXplQ29udGVudEZvcm1hdChpdGVtLmNvbnRlbnRGb3JtYXQpLFxuICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IChpbmRleCArIDEpICogMTBcbiAgICAgICAgICAgICAgICB9KSkgfHwgW11cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFiYXNlSXRlbXMsIGZhcUl0ZW1zXSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZGVmYXVsdCBzb3J0IG9yZGVyIGZvciBuZXcgaXRlbXNcbiAgICBjb25zdCBkZWZhdWx0U29ydE9yZGVyID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICAgIGlmIChkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgICAgICBpZiAoc29ydE9yZGVyQXR0cmlidXRlICYmIGRhdGFTb3VyY2U/Lml0ZW1zICYmIGRhdGFTb3VyY2UuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBnZXROZXh0U29ydE9yZGVyKGRhdGFTb3VyY2UuaXRlbXMsIHNvcnRPcmRlckF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihuZXh0LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Q291bnQgPSBkYXRhU291cmNlPy5pdGVtcz8ubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4gKGN1cnJlbnRDb3VudCArIDEpICogMTA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKGl0ZW1zLmxlbmd0aCArIDEpICogMTA7XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhU291cmNlPy5pdGVtcywgc29ydE9yZGVyQXR0cmlidXRlLCBpdGVtcy5sZW5ndGhdKTtcblxuICAgIC8vIFNldCBzb3J0IG9yZGVyIG9uIGRhdGFzb3VyY2Ugd2hlbiB1c2luZyBkYXRhYmFzZSBtb2RlIHdpdGggc29ydCBvcmRlciBhdHRyaWJ1dGVcbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIHNvcnRPcmRlckF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgaWYgKGRhdGFTb3VyY2Uuc2V0U29ydE9yZGVyICYmIHNvcnRPcmRlckF0dHJpYnV0ZS5pZCkge1xuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2Uuc2V0U29ydE9yZGVyKFtbc29ydE9yZGVyQXR0cmlidXRlLmlkLCBcImFzY1wiXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwgW2RhdGFTb3VyY2VUeXBlLCBkYXRhU291cmNlLCBzb3J0T3JkZXJBdHRyaWJ1dGVdKTtcblxuICAgIC8vIEdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIHNvcnRhYmxlIGl0ZW1zXG4gICAgY29uc3Qgc29ydGFibGVJZHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICAgICAgaWYgKGRhdGFTb3VyY2VUeXBlID09PSBcImRhdGFiYXNlXCIgJiYgZGF0YVNvdXJjZT8uaXRlbXMpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhU291cmNlLml0ZW1zLm1hcCgoaXRlbTogT2JqZWN0SXRlbSkgPT4gaXRlbS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZW1zLm1hcCgoXywgaW5kZXgpID0+IGBzdGF0aWMtJHtpbmRleH1gKTtcbiAgICB9LCBbZGF0YVNvdXJjZVR5cGUsIGRhdGFTb3VyY2U/Lml0ZW1zLCBpdGVtc10pO1xuXG4gICAgY29uc3QgaXNMb2FkaW5nID1cbiAgICAgICAgZGF0YVNvdXJjZVR5cGUgPT09IFwiZGF0YWJhc2VcIiAmJiBkYXRhU291cmNlICYmIGRhdGFTb3VyY2Uuc3RhdHVzID09PSBcImxvYWRpbmdcIjtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGl0ZW1zLFxuICAgICAgICBpc0xvYWRpbmc6ICEhaXNMb2FkaW5nLFxuICAgICAgICBkZWZhdWx0U29ydE9yZGVyLFxuICAgICAgICBzb3J0YWJsZUlkc1xuICAgIH07XG59XG4iLCJpbXBvcnQgeyB1c2VDYWxsYmFjayB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgTGlzdFZhbHVlLCBMaXN0QXR0cmlidXRlVmFsdWUsIEFjdGlvblZhbHVlLCBPYmplY3RJdGVtIH0gZnJvbSBcIm1lbmRpeFwiO1xuaW1wb3J0IEJpZyBmcm9tIFwiYmlnLmpzXCI7XG5pbXBvcnQgeyBEcmFnRW5kRXZlbnQgfSBmcm9tIFwiQGRuZC1raXQvY29yZVwiO1xuXG5pbXBvcnQgeyBDb250ZW50Rm9ybWF0RW51bSB9IGZyb20gXCIuLi8uLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgeyBGQVFfREVGQVVMVF9BVFRSSUJVVEVTIH0gZnJvbSBcIi4uL2NvbmZpZy9hdHRyaWJ1dGVDb25maWdcIjtcbmltcG9ydCB7XG4gICAgY29tbWl0T2JqZWN0LFxuICAgIGRlbGV0ZU9iamVjdCxcbiAgICBjcmVhdGVPYmplY3QsXG4gICAgc3dhcFNvcnRPcmRlcnMsXG4gICAgZ2V0RW50aXR5TmFtZSxcbiAgICBnZXROZXh0U29ydE9yZGVyXG59IGZyb20gXCIuLi91dGlscy9tZW5kaXhEYXRhU2VydmljZVwiO1xuXG5pbnRlcmZhY2UgVXNlRWRpdFN0YXRlIHtcbiAgICBlZGl0aW5nSXRlbUluZGV4OiBudW1iZXIgfCBudWxsO1xuICAgIGRlbGV0ZUNvbmZpcm1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBzaG93Q3JlYXRlRm9ybTogYm9vbGVhbjtcbiAgICBmaW5pc2hFZGl0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbEVkaXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgZmluaXNoRGVsZXRpbmc6ICgpID0+IHZvaWQ7XG4gICAgY2FuY2VsRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGZpbmlzaENyZWF0aW5nOiAoKSA9PiB2b2lkO1xuICAgIGNhbmNlbENyZWF0aW5nOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEF0dHJpYnV0ZSBvdmVycmlkZXMgdXNpbmcgTGlzdEF0dHJpYnV0ZVZhbHVlIGZvciBkaXJlY3QgYWNjZXNzXG4gKi9cbmludGVyZmFjZSBBdHRyaWJ1dGVPdmVycmlkZXMge1xuICAgIHN1bW1hcnlBdHRyaWJ1dGU/OiBMaXN0QXR0cmlidXRlVmFsdWU8c3RyaW5nPjtcbiAgICBjb250ZW50QXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPHN0cmluZz47XG4gICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZT86IExpc3RBdHRyaWJ1dGVWYWx1ZTxzdHJpbmc+O1xuICAgIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG59XG5cbmludGVyZmFjZSBVc2VGQVFBY3Rpb25zUHJvcHMge1xuICAgIGRhdGFTb3VyY2VUeXBlOiBcInN0YXRpY1wiIHwgXCJkYXRhYmFzZVwiO1xuICAgIGRhdGFTb3VyY2U/OiBMaXN0VmFsdWU7XG4gICAgc29ydE9yZGVyQXR0cmlidXRlPzogTGlzdEF0dHJpYnV0ZVZhbHVlPEJpZz47XG4gICAgZWRpdFN0YXRlOiBVc2VFZGl0U3RhdGU7XG4gICAgb25TYXZlQWN0aW9uPzogQWN0aW9uVmFsdWU7XG4gICAgb25EZWxldGVBY3Rpb24/OiBBY3Rpb25WYWx1ZTtcbiAgICBvbkNyZWF0ZUFjdGlvbj86IEFjdGlvblZhbHVlO1xuICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz86IEF0dHJpYnV0ZU92ZXJyaWRlcztcbn1cblxuaW50ZXJmYWNlIFVzZUZBUUFjdGlvbnNSZXN1bHQge1xuICAgIGhhbmRsZVNhdmVFZGl0OiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBoYW5kbGVTYXZlTmV3OiAoXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBoYW5kbGVDb25maXJtRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGhhbmRsZURyYWdFbmQ6IChldmVudDogRHJhZ0VuZEV2ZW50KSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEN1c3RvbSBob29rIHRvIG1hbmFnZSBGQVEgQ1JVRCBvcGVyYXRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VGQVFBY3Rpb25zKHtcbiAgICBkYXRhU291cmNlVHlwZSxcbiAgICBkYXRhU291cmNlLFxuICAgIHNvcnRPcmRlckF0dHJpYnV0ZSxcbiAgICBlZGl0U3RhdGUsXG4gICAgb25TYXZlQWN0aW9uLFxuICAgIG9uRGVsZXRlQWN0aW9uLFxuICAgIG9uQ3JlYXRlQWN0aW9uLFxuICAgIGF0dHJpYnV0ZU92ZXJyaWRlc1xufTogVXNlRkFRQWN0aW9uc1Byb3BzKTogVXNlRkFRQWN0aW9uc1Jlc3VsdCB7XG4gICAgLy8gQ2hlY2sgaWYgQUxMIGF0dHJpYnV0ZSBvdmVycmlkZXMgYXJlIGNvbmZpZ3VyZWQgKGFsbC1vci1ub3RoaW5nIGFwcHJvYWNoKVxuICAgIGNvbnN0IGhhc0FsbE92ZXJyaWRlcyA9ICEhKFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LnN1bW1hcnlBdHRyaWJ1dGUgJiZcbiAgICAgICAgYXR0cmlidXRlT3ZlcnJpZGVzPy5jb250ZW50QXR0cmlidXRlICYmXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlcz8uY29udGVudEZvcm1hdEF0dHJpYnV0ZSAmJlxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXM/LnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlXG4gICAgKTtcblxuICAgIC8qKlxuICAgICAqIFNldCBhdHRyaWJ1dGUgdmFsdWVzIG9uIGFuIGl0ZW0gdXNpbmcgb3ZlcnJpZGVzLlxuICAgICAqIFNpbmNlIHNldFZhbHVlKCkgaXMgbm90IHN1cHBvcnRlZCBvbiBkYXRhc291cmNlLWxpbmtlZCBhdHRyaWJ1dGVzLFxuICAgICAqIHdlIG5lZWQgdG8gZmluZCB0aGUgYWN0dWFsIGF0dHJpYnV0ZSBuYW1lcyBieSBtYXRjaGluZyB2YWx1ZXMuXG4gICAgICovXG4gICAgY29uc3QgZmluZE92ZXJyaWRlQXR0cmlidXRlTmFtZXMgPSAoXG4gICAgICAgIG14T2JqOiBhbnksXG4gICAgICAgIGl0ZW06IE9iamVjdEl0ZW1cbiAgICApOiB7IHN1bW1hcnk6IHN0cmluZzsgY29udGVudDogc3RyaW5nOyBjb250ZW50Rm9ybWF0OiBzdHJpbmc7IHNvcnRPcmRlcjogc3RyaW5nIH0gfCBudWxsID0+IHtcbiAgICAgICAgLy8gR2V0IGN1cnJlbnQgdmFsdWVzIGZyb20gb3ZlcnJpZGVzXG4gICAgICAgIGNvbnN0IHN1bW1hcnlWYWx1ZSA9IGF0dHJpYnV0ZU92ZXJyaWRlcyEuc3VtbWFyeUF0dHJpYnV0ZSEuZ2V0KGl0ZW0pLnZhbHVlO1xuICAgICAgICBjb25zdCBjb250ZW50VmFsdWUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLmNvbnRlbnRBdHRyaWJ1dGUhLmdldChpdGVtKS52YWx1ZTtcbiAgICAgICAgY29uc3QgZm9ybWF0VmFsdWUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLmNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUhLmdldChpdGVtKS52YWx1ZTtcbiAgICAgICAgY29uc3Qgc29ydE9yZGVyVmFsdWUgPSBhdHRyaWJ1dGVPdmVycmlkZXMhLnNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlIS5nZXQoaXRlbSkudmFsdWU7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBGaW5kaW5nIGF0dHJpYnV0ZSBuYW1lcyBieSBtYXRjaGluZyB2YWx1ZXM6XCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIiAgT3ZlcnJpZGUgdmFsdWVzOlwiLCB7IHN1bW1hcnlWYWx1ZSwgY29udGVudFZhbHVlLCBmb3JtYXRWYWx1ZSwgc29ydE9yZGVyVmFsdWU6IHNvcnRPcmRlclZhbHVlPy50b1N0cmluZygpIH0pO1xuXG4gICAgICAgIC8vIEdldCBhbGwgYXR0cmlidXRlcyBmcm9tIHRoZSBNeE9iamVjdFxuICAgICAgICBjb25zdCBhbGxBdHRycyA9IG14T2JqLmdldEF0dHJpYnV0ZXM/LigpIHx8IFtdO1xuICAgICAgICBjb25zb2xlLmxvZyhcIiAgTXhPYmplY3QgYXR0cmlidXRlczpcIiwgYWxsQXR0cnMpO1xuXG4gICAgICAgIGxldCBzdW1tYXJ5QXR0ciA9IFwiXCI7XG4gICAgICAgIGxldCBjb250ZW50QXR0ciA9IFwiXCI7XG4gICAgICAgIGxldCBmb3JtYXRBdHRyID0gXCJcIjtcbiAgICAgICAgbGV0IHNvcnRPcmRlckF0dHIgPSBcIlwiO1xuXG4gICAgICAgIC8vIE1hdGNoIGJ5IGNvbXBhcmluZyB2YWx1ZXNcbiAgICAgICAgZm9yIChjb25zdCBhdHRyTmFtZSBvZiBhbGxBdHRycykge1xuICAgICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gbXhPYmouZ2V0KGF0dHJOYW1lKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gc3VtbWFyeVZhbHVlICYmICFzdW1tYXJ5QXR0cikge1xuICAgICAgICAgICAgICAgIHN1bW1hcnlBdHRyID0gYXR0ck5hbWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgTWF0Y2hlZCBzdW1tYXJ5OiAke2F0dHJOYW1lfSA9ICR7YXR0clZhbHVlfWApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdHRyVmFsdWUgPT09IGNvbnRlbnRWYWx1ZSAmJiAhY29udGVudEF0dHIpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50QXR0ciA9IGF0dHJOYW1lO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIE1hdGNoZWQgY29udGVudDogJHthdHRyTmFtZX0gPSAke2F0dHJWYWx1ZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0clZhbHVlID09PSBmb3JtYXRWYWx1ZSAmJiAhZm9ybWF0QXR0cikge1xuICAgICAgICAgICAgICAgIGZvcm1hdEF0dHIgPSBhdHRyTmFtZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICBNYXRjaGVkIGZvcm1hdDogJHthdHRyTmFtZX0gPSAke2F0dHJWYWx1ZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc29ydE9yZGVyVmFsdWUgJiYgYXR0clZhbHVlPy50b1N0cmluZz8uKCkgPT09IHNvcnRPcmRlclZhbHVlLnRvU3RyaW5nKCkgJiYgIXNvcnRPcmRlckF0dHIpIHtcbiAgICAgICAgICAgICAgICBzb3J0T3JkZXJBdHRyID0gYXR0ck5hbWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgTWF0Y2hlZCBzb3J0T3JkZXI6ICR7YXR0ck5hbWV9ID0gJHthdHRyVmFsdWV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3VtbWFyeUF0dHIgJiYgY29udGVudEF0dHIgJiYgZm9ybWF0QXR0ciAmJiBzb3J0T3JkZXJBdHRyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1bW1hcnk6IHN1bW1hcnlBdHRyLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnRBdHRyLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRGb3JtYXQ6IGZvcm1hdEF0dHIsXG4gICAgICAgICAgICAgICAgc29ydE9yZGVyOiBzb3J0T3JkZXJBdHRyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS53YXJuKFwiRkFRIEFjY29yZGlvbjogQ291bGQgbm90IG1hdGNoIGFsbCBhdHRyaWJ1dGUgbmFtZXM6XCIsIHtcbiAgICAgICAgICAgIHN1bW1hcnlBdHRyLCBjb250ZW50QXR0ciwgZm9ybWF0QXR0ciwgc29ydE9yZGVyQXR0clxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldCBhdHRyaWJ1dGUgdmFsdWVzIG9uIGFuIE14T2JqZWN0IHVzaW5nIGRlZmF1bHQgYXR0cmlidXRlIG5hbWVzXG4gICAgICovXG4gICAgY29uc3Qgc2V0VmFsdWVzVmlhRGVmYXVsdHMgPSAoXG4gICAgICAgIG14T2JqOiBhbnksXG4gICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtLFxuICAgICAgICBzb3J0T3JkZXI6IEJpZ1xuICAgICkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFNldHRpbmcgdmFsdWVzIHZpYSBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lc1wiKTtcbiAgICAgICAgbXhPYmouc2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU1VNTUFSWSwgc3VtbWFyeSk7XG4gICAgICAgIG14T2JqLnNldChGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlQsIGNvbnRlbnQpO1xuICAgICAgICBteE9iai5zZXQoRkFRX0RFRkFVTFRfQVRUUklCVVRFUy5DT05URU5UX0ZPUk1BVCwgZm9ybWF0KTtcbiAgICAgICAgbXhPYmouc2V0KEZBUV9ERUZBVUxUX0FUVFJJQlVURVMuU09SVF9PUkRFUiwgc29ydE9yZGVyKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZUVkaXQgPSB1c2VDYWxsYmFjayhcbiAgICAgICAgYXN5bmMgKFxuICAgICAgICAgICAgc3VtbWFyeTogc3RyaW5nLFxuICAgICAgICAgICAgY29udGVudDogc3RyaW5nLFxuICAgICAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgICAgIHNvcnRPcmRlcjogbnVtYmVyXG4gICAgICAgICk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4ID09PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgIWRhdGFTb3VyY2UgfHxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlVHlwZSAhPT0gXCJkYXRhYmFzZVwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGRhdGFTb3VyY2UuaXRlbXM/LltlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleF07XG4gICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3B0aW9uIDE6IFVzZSBjdXN0b20gYWN0aW9uIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgICAgIGlmIChvblNhdmVBY3Rpb24gJiYgb25TYXZlQWN0aW9uLmNhbkV4ZWN1dGUpIHtcbiAgICAgICAgICAgICAgICBvblNhdmVBY3Rpb24uZXhlY3V0ZSgpO1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcHRpb24gMjogVXNlIG92ZXJyaWRlcyAtIGZpbmQgYXR0cmlidXRlIG5hbWVzIGJ5IG1hdGNoaW5nIHZhbHVlcywgdGhlbiB1c2UgbXguZGF0YS5zZXRcbiAgICAgICAgICAgIGlmIChoYXNBbGxPdmVycmlkZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBteCA9ICh3aW5kb3cgYXMgYW55KS5teDtcbiAgICAgICAgICAgICAgICBteC5kYXRhLmdldCh7XG4gICAgICAgICAgICAgICAgICAgIGd1aWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAobXhPYmo6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBhY3R1YWwgYXR0cmlidXRlIG5hbWVzIGJ5IG1hdGNoaW5nIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJOYW1lcyA9IGZpbmRPdmVycmlkZUF0dHJpYnV0ZU5hbWVzKG14T2JqLCBpdGVtKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYXR0ck5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBDb3VsZCBub3QgZGV0ZXJtaW5lIGF0dHJpYnV0ZSBuYW1lcyBmcm9tIG92ZXJyaWRlc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFRIEFjY29yZGlvbjogU2V0dGluZyB2YWx1ZXMgd2l0aCBvdmVycmlkZSBhdHRyaWJ1dGUgbmFtZXM6XCIsIGF0dHJOYW1lcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdmFsdWVzIHVzaW5nIGRpc2NvdmVyZWQgYXR0cmlidXRlIG5hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhPYmouc2V0KGF0dHJOYW1lcy5zdW1tYXJ5LCBzdW1tYXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteE9iai5zZXQoYXR0ck5hbWVzLmNvbnRlbnQsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14T2JqLnNldChhdHRyTmFtZXMuY29udGVudEZvcm1hdCwgZm9ybWF0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteE9iai5zZXQoYXR0ck5hbWVzLnNvcnRPcmRlciwgbmV3IEJpZyhzb3J0T3JkZXIpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1pdE9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXhPYmosXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRkFRIEFjY29yZGlvbjogU3VjY2Vzc2Z1bGx5IHNhdmVkIEZBUSBpdGVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIHNhdmU6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIHNhdmUgd2l0aCBvdmVycmlkZXM6XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBnZXQgb2JqZWN0OlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcHRpb24gMzogRmFsbGJhY2sgdG8gYnVpbHQtaW4gY29tbWl0IHdpdGggZGVmYXVsdCBhdHRyaWJ1dGUgbmFtZXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbXggPSAod2luZG93IGFzIGFueSkubXg7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3VpZCA9IGl0ZW0uaWQ7XG5cbiAgICAgICAgICAgICAgICBteC5kYXRhLmdldCh7XG4gICAgICAgICAgICAgICAgICAgIGd1aWQ6IGd1aWQsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAobXhPYmo6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29ydFZhbHVlID0gbmV3IEJpZyhzb3J0T3JkZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VmFsdWVzVmlhRGVmYXVsdHMobXhPYmosIHN1bW1hcnksIGNvbnRlbnQsIGZvcm1hdCwgc29ydFZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWl0T2JqZWN0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG14T2JqLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJGQVEgQWNjb3JkaW9uOiBTdWNjZXNzZnVsbHkgc2F2ZWQgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmZpbmlzaEVkaXRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gc2F2ZTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBnZXQgb2JqZWN0OlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRWRpdGluZygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gY29tbWl0OlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgW2RhdGFTb3VyY2UsIGRhdGFTb3VyY2VUeXBlLCBlZGl0U3RhdGUsIG9uU2F2ZUFjdGlvbiwgYXR0cmlidXRlT3ZlcnJpZGVzXVxuICAgICk7XG5cbiAgICBjb25zdCBoYW5kbGVTYXZlTmV3ID0gdXNlQ2FsbGJhY2soXG4gICAgICAgIGFzeW5jIChcbiAgICAgICAgICAgIHN1bW1hcnk6IHN0cmluZyxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0sXG4gICAgICAgICAgICBzb3J0T3JkZXI6IG51bWJlclxuICAgICAgICApOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgICAgIGlmICghZGF0YVNvdXJjZSB8fCBkYXRhU291cmNlVHlwZSAhPT0gXCJkYXRhYmFzZVwiKSB7XG4gICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbENyZWF0aW5nKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcHRpb24gMTogVXNlIGN1c3RvbSBjcmVhdGUgYWN0aW9uIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgICAgIGlmIChvbkNyZWF0ZUFjdGlvbiAmJiBvbkNyZWF0ZUFjdGlvbi5jYW5FeGVjdXRlKSB7XG4gICAgICAgICAgICAgICAgb25DcmVhdGVBY3Rpb24uZXhlY3V0ZSgpO1xuICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hDcmVhdGluZygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3B0aW9uIDI6IEZhbGxiYWNrIHRvIGJ1aWx0LWluIGNyZWF0ZVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRpdHlOYW1lID0gYXdhaXQgZ2V0RW50aXR5TmFtZShkYXRhU291cmNlKTtcblxuICAgICAgICAgICAgICAgIGlmICghZW50aXR5TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogQ2Fubm90IGNyZWF0ZSBuZXcgaXRlbSAtIGVudGl0eSBuYW1lIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbENyZWF0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgYXR0cmlidXRlIG5hbWVzIGJhc2VkIG9uIHdoZXRoZXIgd2UncmUgdXNpbmcgb3ZlcnJpZGVzXG4gICAgICAgICAgICAgICAgbGV0IGF0dHJOYW1lczoge1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEZvcm1hdDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBzb3J0T3JkZXI6IHN0cmluZztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0FsbE92ZXJyaWRlcyAmJiBkYXRhU291cmNlLml0ZW1zICYmIGRhdGFTb3VyY2UuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBVc2Ugb3ZlcnJpZGVzIC0gZ2V0IG5hbWVzIGZyb20gZXhpc3RpbmcgaXRlbSdzIE14T2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZUl0ZW0gPSBkYXRhU291cmNlLml0ZW1zWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBteCA9ICh3aW5kb3cgYXMgYW55KS5teDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGZldGNoIHRoZSBNeE9iamVjdCB0byBmaW5kIGF0dHJpYnV0ZSBuYW1lc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBteE9ialByb21pc2UgPSBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG14LmRhdGEuZ2V0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBndWlkOiByZWZlcmVuY2VJdGVtLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiByZXNvbHZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiByZWplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWZNeE9iaiA9IGF3YWl0IG14T2JqUHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmROYW1lcyA9IGZpbmRPdmVycmlkZUF0dHJpYnV0ZU5hbWVzKHJlZk14T2JqLCByZWZlcmVuY2VJdGVtKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBDb3VsZCBub3QgZGV0ZXJtaW5lIGF0dHJpYnV0ZSBuYW1lcyBmcm9tIG92ZXJyaWRlcyBmb3IgY3JlYXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbENyZWF0aW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhdHRyTmFtZXMgPSBmb3VuZE5hbWVzO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBUSBBY2NvcmRpb246IFVzaW5nIG92ZXJyaWRlIGF0dHJpYnV0ZSBuYW1lcyBmb3IgY3JlYXRlOlwiLCBhdHRyTmFtZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZSBkZWZhdWx0c1xuICAgICAgICAgICAgICAgICAgICBhdHRyTmFtZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNVTU1BUlksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50Rm9ybWF0OiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLkNPTlRFTlRfRk9STUFULFxuICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyOiBGQVFfREVGQVVMVF9BVFRSSUJVVEVTLlNPUlRfT1JERVJcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQVEgQWNjb3JkaW9uOiBVc2luZyBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lcyBmb3IgY3JlYXRlOlwiLCBhdHRyTmFtZXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0l0ZW0gPSBhd2FpdCBjcmVhdGVPYmplY3QoZW50aXR5TmFtZSk7XG5cbiAgICAgICAgICAgICAgICBuZXdJdGVtLnNldChhdHRyTmFtZXMuc3VtbWFyeSwgc3VtbWFyeSk7XG4gICAgICAgICAgICAgICAgbmV3SXRlbS5zZXQoYXR0ck5hbWVzLmNvbnRlbnQsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIG5ld0l0ZW0uc2V0KGF0dHJOYW1lcy5jb250ZW50Rm9ybWF0LCBmb3JtYXQpO1xuXG4gICAgICAgICAgICAgICAgbGV0IHNvcnRPcmRlclRvVXNlID0gc29ydE9yZGVyO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoc29ydE9yZGVyVG9Vc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3J0T3JkZXJBdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRTb3J0T3JkZXIgPSBnZXROZXh0U29ydE9yZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UuaXRlbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyVG9Vc2UgPSBOdW1iZXIobmV4dFNvcnRPcmRlci50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDb3VudCA9IGRhdGFTb3VyY2UuaXRlbXM/Lmxlbmd0aCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyVG9Vc2UgPSAoY3VycmVudENvdW50ICsgMSkgKiAxMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHNvcnRPcmRlclZhbHVlID0gbmV3IEJpZyhzb3J0T3JkZXJUb1VzZSk7XG4gICAgICAgICAgICAgICAgbmV3SXRlbS5zZXQoYXR0ck5hbWVzLnNvcnRPcmRlciwgc29ydE9yZGVyVmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgYXdhaXQgY29tbWl0T2JqZWN0KFxuICAgICAgICAgICAgICAgICAgICBuZXdJdGVtLFxuICAgICAgICAgICAgICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICAgICAgICAgICAgICBcIkZBUSBBY2NvcmRpb246IFN1Y2Nlc3NmdWxseSBjcmVhdGVkIG5ldyBGQVEgaXRlbVwiXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuZmluaXNoQ3JlYXRpbmcoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byBjcmVhdGUgbmV3IGl0ZW06XCIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsQ3JlYXRpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgW2RhdGFTb3VyY2UsIGRhdGFTb3VyY2VUeXBlLCBlZGl0U3RhdGUsIG9uQ3JlYXRlQWN0aW9uLCBzb3J0T3JkZXJBdHRyaWJ1dGUsIGhhc0FsbE92ZXJyaWRlc11cbiAgICApO1xuXG4gICAgY29uc3QgaGFuZGxlQ29uZmlybURlbGV0ZSA9IHVzZUNhbGxiYWNrKCgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGVkaXRTdGF0ZS5kZWxldGVDb25maXJtSW5kZXggPT09IG51bGwgfHwgIWRhdGFTb3VyY2UgfHwgZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIikge1xuICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbERlbGV0ZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbSA9IGRhdGFTb3VyY2UuaXRlbXM/LltlZGl0U3RhdGUuZGVsZXRlQ29uZmlybUluZGV4XTtcbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICBlZGl0U3RhdGUuY2FuY2VsRGVsZXRlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPcHRpb24gMTogVXNlIGN1c3RvbSBkZWxldGUgYWN0aW9uIGlmIGNvbmZpZ3VyZWRcbiAgICAgICAgaWYgKG9uRGVsZXRlQWN0aW9uICYmIG9uRGVsZXRlQWN0aW9uLmNhbkV4ZWN1dGUpIHtcbiAgICAgICAgICAgIG9uRGVsZXRlQWN0aW9uLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgIGVkaXRTdGF0ZS5maW5pc2hEZWxldGluZygpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE9wdGlvbiAyOiBGYWxsYmFjayB0byBidWlsdC1pbiBkZWxldGVcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGVPYmplY3QoaXRlbSwgZGF0YVNvdXJjZSwgXCJGQVEgQWNjb3JkaW9uOiBTdWNjZXNzZnVsbHkgZGVsZXRlZCBGQVEgaXRlbVwiKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdFN0YXRlLmZpbmlzaERlbGV0aW5nKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGQVEgQWNjb3JkaW9uOiBGYWlsZWQgdG8gZGVsZXRlOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxEZWxldGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIFtkYXRhU291cmNlLCBkYXRhU291cmNlVHlwZSwgZWRpdFN0YXRlLCBvbkRlbGV0ZUFjdGlvbl0pO1xuXG4gICAgY29uc3QgaGFuZGxlRHJhZ0VuZCA9IHVzZUNhbGxiYWNrKFxuICAgICAgICAoZXZlbnQ6IERyYWdFbmRFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBhY3RpdmUsIG92ZXIgfSA9IGV2ZW50O1xuXG4gICAgICAgICAgICBpZiAoIW92ZXIgfHwgYWN0aXZlLmlkID09PSBvdmVyLmlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWRhdGFTb3VyY2UgfHwgZGF0YVNvdXJjZVR5cGUgIT09IFwiZGF0YWJhc2VcIiB8fCAhc29ydE9yZGVyQXR0cmlidXRlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICBcIkZBUSBBY2NvcmRpb246IERyYWctZHJvcCByZXF1aXJlcyBkYXRhYmFzZSBtb2RlIHdpdGggc29ydE9yZGVyQXR0cmlidXRlXCJcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZHNJdGVtcyA9IGRhdGFTb3VyY2UuaXRlbXMgfHwgW107XG4gICAgICAgICAgICBjb25zdCBvbGRJbmRleCA9IGRzSXRlbXMuZmluZEluZGV4KChpdGVtOiBPYmplY3RJdGVtKSA9PiBpdGVtLmlkID09PSBhY3RpdmUuaWQpO1xuICAgICAgICAgICAgY29uc3QgbmV3SW5kZXggPSBkc0l0ZW1zLmZpbmRJbmRleCgoaXRlbTogT2JqZWN0SXRlbSkgPT4gaXRlbS5pZCA9PT0gb3Zlci5pZCk7XG5cbiAgICAgICAgICAgIGlmIChvbGRJbmRleCA9PT0gLTEgfHwgbmV3SW5kZXggPT09IC0xIHx8IG9sZEluZGV4ID09PSBuZXdJbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZHJhZ2dlZEl0ZW0gPSBkc0l0ZW1zW29sZEluZGV4XTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEl0ZW0gPSBkc0l0ZW1zW25ld0luZGV4XTtcblxuICAgICAgICAgICAgaWYgKCFkcmFnZ2VkSXRlbSB8fCAhdGFyZ2V0SXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZHJhZ2dlZE9yZGVyID0gc29ydE9yZGVyQXR0cmlidXRlLmdldChkcmFnZ2VkSXRlbSkudmFsdWU7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRPcmRlciA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQodGFyZ2V0SXRlbSkudmFsdWU7XG5cbiAgICAgICAgICAgIHN3YXBTb3J0T3JkZXJzKFxuICAgICAgICAgICAgICAgIGRyYWdnZWRJdGVtLFxuICAgICAgICAgICAgICAgIHRhcmdldEl0ZW0sXG4gICAgICAgICAgICAgICAgZHJhZ2dlZE9yZGVyLFxuICAgICAgICAgICAgICAgIHRhcmdldE9yZGVyLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UsXG4gICAgICAgICAgICAgICAgYEZBUSBBY2NvcmRpb246IFN1Y2Nlc3NmdWxseSByZW9yZGVyZWQgaXRlbSBmcm9tIHBvc2l0aW9uICR7b2xkSW5kZXggKyAxfSB0byAke1xuICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCArIDFcbiAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFRIEFjY29yZGlvbjogRmFpbGVkIHRvIHJlb3JkZXIgaXRlbTpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIFtkYXRhU291cmNlLCBkYXRhU291cmNlVHlwZSwgc29ydE9yZGVyQXR0cmlidXRlXVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBoYW5kbGVTYXZlRWRpdCxcbiAgICAgICAgaGFuZGxlU2F2ZU5ldyxcbiAgICAgICAgaGFuZGxlQ29uZmlybURlbGV0ZSxcbiAgICAgICAgaGFuZGxlRHJhZ0VuZFxuICAgIH07XG59XG4iLCIvKiFcblx0Q29weXJpZ2h0IChjKSAyMDE4IEplZCBXYXRzb24uXG5cdExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAoTUlUKSwgc2VlXG5cdGh0dHA6Ly9qZWR3YXRzb24uZ2l0aHViLmlvL2NsYXNzbmFtZXNcbiovXG4vKiBnbG9iYWwgZGVmaW5lICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHk7XG5cblx0ZnVuY3Rpb24gY2xhc3NOYW1lcyAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSAnJztcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0aWYgKGFyZykge1xuXHRcdFx0XHRjbGFzc2VzID0gYXBwZW5kQ2xhc3MoY2xhc3NlcywgcGFyc2VWYWx1ZShhcmcpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcztcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlVmFsdWUgKGFyZykge1xuXHRcdGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuXHRcdFx0cmV0dXJuIGFyZztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGFyZyAhPT0gJ29iamVjdCcpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NOYW1lcy5hcHBseShudWxsLCBhcmcpO1xuXHRcdH1cblxuXHRcdGlmIChhcmcudG9TdHJpbmcgIT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgJiYgIWFyZy50b1N0cmluZy50b1N0cmluZygpLmluY2x1ZGVzKCdbbmF0aXZlIGNvZGVdJykpIHtcblx0XHRcdHJldHVybiBhcmcudG9TdHJpbmcoKTtcblx0XHR9XG5cblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKGFyZywga2V5KSAmJiBhcmdba2V5XSkge1xuXHRcdFx0XHRjbGFzc2VzID0gYXBwZW5kQ2xhc3MoY2xhc3Nlcywga2V5KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcztcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZENsYXNzICh2YWx1ZSwgbmV3Q2xhc3MpIHtcblx0XHRpZiAoIW5ld0NsYXNzKSB7XG5cdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0fVxuXHRcblx0XHRpZiAodmFsdWUpIHtcblx0XHRcdHJldHVybiB2YWx1ZSArICcgJyArIG5ld0NsYXNzO1xuXHRcdH1cblx0XG5cdFx0cmV0dXJuIHZhbHVlICsgbmV3Q2xhc3M7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRjbGFzc05hbWVzLmRlZmF1bHQgPSBjbGFzc05hbWVzO1xuXHRcdG1vZHVsZS5leHBvcnRzID0gY2xhc3NOYW1lcztcblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gcmVnaXN0ZXIgYXMgJ2NsYXNzbmFtZXMnLCBjb25zaXN0ZW50IHdpdGggbnBtIHBhY2thZ2UgbmFtZVxuXHRcdGRlZmluZSgnY2xhc3NuYW1lcycsIFtdLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NOYW1lcztcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuY2xhc3NOYW1lcyA9IGNsYXNzTmFtZXM7XG5cdH1cbn0oKSk7XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcblxuaW50ZXJmYWNlIEVkaXRNb2RlVG9nZ2xlUHJvcHMge1xuICAgIGVkaXRNb2RlOiBib29sZWFuO1xuICAgIG9uVG9nZ2xlOiAoKSA9PiB2b2lkO1xuICAgIGRpc2FibGVkPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUb2dnbGUgYnV0dG9uIGZvciBzd2l0Y2hpbmcgYmV0d2VlbiB2aWV3IGFuZCBlZGl0IG1vZGVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBFZGl0TW9kZVRvZ2dsZShwcm9wczogRWRpdE1vZGVUb2dnbGVQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3QgeyBlZGl0TW9kZSwgb25Ub2dnbGUsIGRpc2FibGVkID0gZmFsc2UgfSA9IHByb3BzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtZWRpdC1tb2RlLXRvZ2dsZVwiLCB7XG4gICAgICAgICAgICAgICAgXCJmYXEtZWRpdC1tb2RlLWFjdGl2ZVwiOiBlZGl0TW9kZVxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICBvbkNsaWNrPXtvblRvZ2dsZX1cbiAgICAgICAgICAgIGRpc2FibGVkPXtkaXNhYmxlZH1cbiAgICAgICAgICAgIGFyaWEtbGFiZWw9e2VkaXRNb2RlID8gXCJTd2l0Y2ggdG8gdmlldyBtb2RlXCIgOiBcIlN3aXRjaCB0byBlZGl0IG1vZGVcIn1cbiAgICAgICAgICAgIHRpdGxlPXtlZGl0TW9kZSA/IFwiVmlldyBNb2RlXCIgOiBcIkVkaXQgTW9kZVwifVxuICAgICAgICA+XG4gICAgICAgICAgICB7ZWRpdE1vZGUgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMC41IDhhMi41IDIuNSAwIDEgMS01IDAgMi41IDIuNSAwIDAgMSA1IDB6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMCA4czMtNS41IDgtNS41UzE2IDggMTYgOHMtMyA1LjUtOCA1LjVTMCA4IDAgOHptOCAzLjVhMy41IDMuNSAwIDEgMCAwLTcgMy41IDMuNSAwIDAgMCAwIDd6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPlZpZXc8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTIuODU0IDEuMTQ2YS41LjUgMCAwIDAtLjcwOCAwTDEwIDMuMjkzIDEyLjcwNyA2bDIuMTQ3LTIuMTQ2YS41LjUgMCAwIDAgMC0uNzA4bC0yLTJ6TTExLjI5MyA0TDIgMTMuMjkzVjE2aDIuNzA3TDE0IDYuNzA3IDExLjI5MyA0elwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5FZGl0PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCB7IEVkaXRNb2RlVG9nZ2xlIH0gZnJvbSBcIi4vRWRpdE1vZGVUb2dnbGVcIjtcblxuaW50ZXJmYWNlIEZBUUhlYWRlclByb3BzIHtcbiAgICBzaG93VG9nZ2xlQnV0dG9uOiBib29sZWFuO1xuICAgIGFsbEV4cGFuZGVkOiBib29sZWFuO1xuICAgIHRvZ2dsZUJ1dHRvblRleHQ/OiBzdHJpbmc7XG4gICAgb25Ub2dnbGVBbGw6ICgpID0+IHZvaWQ7XG4gICAgaXNFZGl0aW5nRW5hYmxlZDogYm9vbGVhbjtcbiAgICBlZGl0TW9kZTogYm9vbGVhbjtcbiAgICBvblRvZ2dsZUVkaXRNb2RlOiAoKSA9PiB2b2lkO1xuICAgIG9uQ3JlYXRlTmV3OiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEhlYWRlciBjb21wb25lbnQgd2l0aCB0b2dnbGUgYWxsIGJ1dHRvbiBhbmQgZWRpdCBtb2RlIGNvbnRyb2xzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBGQVFIZWFkZXIoe1xuICAgIHNob3dUb2dnbGVCdXR0b24sXG4gICAgYWxsRXhwYW5kZWQsXG4gICAgdG9nZ2xlQnV0dG9uVGV4dCxcbiAgICBvblRvZ2dsZUFsbCxcbiAgICBpc0VkaXRpbmdFbmFibGVkLFxuICAgIGVkaXRNb2RlLFxuICAgIG9uVG9nZ2xlRWRpdE1vZGUsXG4gICAgb25DcmVhdGVOZXdcbn06IEZBUUhlYWRlclByb3BzKTogUmVhY3RFbGVtZW50IHwgbnVsbCB7XG4gICAgaWYgKCFzaG93VG9nZ2xlQnV0dG9uICYmICFpc0VkaXRpbmdFbmFibGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGdldFRvZ2dsZUJ1dHRvblRleHQgPSAoKTogc3RyaW5nID0+IHtcbiAgICAgICAgaWYgKHRvZ2dsZUJ1dHRvblRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0b2dnbGVCdXR0b25UZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGxFeHBhbmRlZCA/IFwiSGlkZSBBbGxcIiA6IFwiU2hvdyBBbGxcIjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWhlYWRlclwiPlxuICAgICAgICAgICAge3Nob3dUb2dnbGVCdXR0b24gJiYgKFxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLXRvZ2dsZS1hbGwtYnRuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZmFxLXRvZ2dsZS1hbGwtYnRuLS1leHBhbmRlZFwiOiBhbGxFeHBhbmRlZFxuICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17b25Ub2dnbGVBbGx9XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge2dldFRvZ2dsZUJ1dHRvblRleHQoKX1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICB7aXNFZGl0aW5nRW5hYmxlZCAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZWRpdGluZy1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICB7ZWRpdE1vZGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1jcmVhdGUtbmV3LWJ0blwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17b25DcmVhdGVOZXd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkNyZWF0ZSBuZXcgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk04IDJhLjUuNSAwIDAgMSAuNS41djVoNWEuNS41IDAgMCAxIDAgMWgtNXY1YS41LjUgMCAwIDEtMSAwdi01aC01YS41LjUgMCAwIDEgMC0xaDV2LTVBLjUuNSAwIDAgMSA4IDJ6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDcmVhdGUgTmV3XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPEVkaXRNb2RlVG9nZ2xlIGVkaXRNb2RlPXtlZGl0TW9kZX0gb25Ub2dnbGU9e29uVG9nZ2xlRWRpdE1vZGV9IC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiLyohIEBsaWNlbnNlIERPTVB1cmlmeSAzLjMuMSB8IChjKSBDdXJlNTMgYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyB8IFJlbGVhc2VkIHVuZGVyIHRoZSBBcGFjaGUgbGljZW5zZSAyLjAgYW5kIE1vemlsbGEgUHVibGljIExpY2Vuc2UgMi4wIHwgZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L2Jsb2IvMy4zLjEvTElDRU5TRSAqL1xuXG5jb25zdCB7XG4gIGVudHJpZXMsXG4gIHNldFByb3RvdHlwZU9mLFxuICBpc0Zyb3plbixcbiAgZ2V0UHJvdG90eXBlT2YsXG4gIGdldE93blByb3BlcnR5RGVzY3JpcHRvclxufSA9IE9iamVjdDtcbmxldCB7XG4gIGZyZWV6ZSxcbiAgc2VhbCxcbiAgY3JlYXRlXG59ID0gT2JqZWN0OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGltcG9ydC9uby1tdXRhYmxlLWV4cG9ydHNcbmxldCB7XG4gIGFwcGx5LFxuICBjb25zdHJ1Y3Rcbn0gPSB0eXBlb2YgUmVmbGVjdCAhPT0gJ3VuZGVmaW5lZCcgJiYgUmVmbGVjdDtcbmlmICghZnJlZXplKSB7XG4gIGZyZWV6ZSA9IGZ1bmN0aW9uIGZyZWV6ZSh4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH07XG59XG5pZiAoIXNlYWwpIHtcbiAgc2VhbCA9IGZ1bmN0aW9uIHNlYWwoeCkge1xuICAgIHJldHVybiB4O1xuICB9O1xufVxuaWYgKCFhcHBseSkge1xuICBhcHBseSA9IGZ1bmN0aW9uIGFwcGx5KGZ1bmMsIHRoaXNBcmcpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMiA/IF9sZW4gLSAyIDogMCksIF9rZXkgPSAyOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXkgLSAyXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gIH07XG59XG5pZiAoIWNvbnN0cnVjdCkge1xuICBjb25zdHJ1Y3QgPSBmdW5jdGlvbiBjb25zdHJ1Y3QoRnVuYykge1xuICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuMiA+IDEgPyBfbGVuMiAtIDEgOiAwKSwgX2tleTIgPSAxOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICBhcmdzW19rZXkyIC0gMV0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEZ1bmMoLi4uYXJncyk7XG4gIH07XG59XG5jb25zdCBhcnJheUZvckVhY2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5mb3JFYWNoKTtcbmNvbnN0IGFycmF5TGFzdEluZGV4T2YgPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZik7XG5jb25zdCBhcnJheVBvcCA9IHVuYXBwbHkoQXJyYXkucHJvdG90eXBlLnBvcCk7XG5jb25zdCBhcnJheVB1c2ggPSB1bmFwcGx5KEFycmF5LnByb3RvdHlwZS5wdXNoKTtcbmNvbnN0IGFycmF5U3BsaWNlID0gdW5hcHBseShBcnJheS5wcm90b3R5cGUuc3BsaWNlKTtcbmNvbnN0IHN0cmluZ1RvTG93ZXJDYXNlID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlKTtcbmNvbnN0IHN0cmluZ1RvU3RyaW5nID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nKTtcbmNvbnN0IHN0cmluZ01hdGNoID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLm1hdGNoKTtcbmNvbnN0IHN0cmluZ1JlcGxhY2UgPSB1bmFwcGx5KFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSk7XG5jb25zdCBzdHJpbmdJbmRleE9mID0gdW5hcHBseShTdHJpbmcucHJvdG90eXBlLmluZGV4T2YpO1xuY29uc3Qgc3RyaW5nVHJpbSA9IHVuYXBwbHkoU3RyaW5nLnByb3RvdHlwZS50cmltKTtcbmNvbnN0IG9iamVjdEhhc093blByb3BlcnR5ID0gdW5hcHBseShPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcbmNvbnN0IHJlZ0V4cFRlc3QgPSB1bmFwcGx5KFJlZ0V4cC5wcm90b3R5cGUudGVzdCk7XG5jb25zdCB0eXBlRXJyb3JDcmVhdGUgPSB1bmNvbnN0cnVjdChUeXBlRXJyb3IpO1xuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggYSBzcGVjaWZpZWQgdGhpc0FyZyBhbmQgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSBmdW5jIC0gVGhlIGZ1bmN0aW9uIHRvIGJlIHdyYXBwZWQgYW5kIGNhbGxlZC5cbiAqIEByZXR1cm5zIEEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIGdpdmVuIGZ1bmN0aW9uIHdpdGggYSBzcGVjaWZpZWQgdGhpc0FyZyBhbmQgYXJndW1lbnRzLlxuICovXG5mdW5jdGlvbiB1bmFwcGx5KGZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0aGlzQXJnKSB7XG4gICAgaWYgKHRoaXNBcmcgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIHRoaXNBcmcubGFzdEluZGV4ID0gMDtcbiAgICB9XG4gICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4zID4gMSA/IF9sZW4zIC0gMSA6IDApLCBfa2V5MyA9IDE7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgIGFyZ3NbX2tleTMgLSAxXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgfVxuICAgIHJldHVybiBhcHBseShmdW5jLCB0aGlzQXJnLCBhcmdzKTtcbiAgfTtcbn1cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNvbnN0cnVjdHMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gZnVuYyAtIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBiZSB3cmFwcGVkIGFuZCBjYWxsZWQuXG4gKiBAcmV0dXJucyBBIG5ldyBmdW5jdGlvbiB0aGF0IGNvbnN0cnVjdHMgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50cy5cbiAqL1xuZnVuY3Rpb24gdW5jb25zdHJ1Y3QoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCksIF9rZXk0ID0gMDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgYXJnc1tfa2V5NF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgIH1cbiAgICByZXR1cm4gY29uc3RydWN0KEZ1bmMsIGFyZ3MpO1xuICB9O1xufVxuLyoqXG4gKiBBZGQgcHJvcGVydGllcyB0byBhIGxvb2t1cCB0YWJsZVxuICpcbiAqIEBwYXJhbSBzZXQgLSBUaGUgc2V0IHRvIHdoaWNoIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQuXG4gKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyBlbGVtZW50cyB0byBiZSBhZGRlZCB0byB0aGUgc2V0LlxuICogQHBhcmFtIHRyYW5zZm9ybUNhc2VGdW5jIC0gQW4gb3B0aW9uYWwgZnVuY3Rpb24gdG8gdHJhbnNmb3JtIHRoZSBjYXNlIG9mIGVhY2ggZWxlbWVudCBiZWZvcmUgYWRkaW5nIHRvIHRoZSBzZXQuXG4gKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgc2V0IHdpdGggYWRkZWQgZWxlbWVudHMuXG4gKi9cbmZ1bmN0aW9uIGFkZFRvU2V0KHNldCwgYXJyYXkpIHtcbiAgbGV0IHRyYW5zZm9ybUNhc2VGdW5jID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBzdHJpbmdUb0xvd2VyQ2FzZTtcbiAgaWYgKHNldFByb3RvdHlwZU9mKSB7XG4gICAgLy8gTWFrZSAnaW4nIGFuZCB0cnV0aHkgY2hlY2tzIGxpa2UgQm9vbGVhbihzZXQuY29uc3RydWN0b3IpXG4gICAgLy8gaW5kZXBlbmRlbnQgb2YgYW55IHByb3BlcnRpZXMgZGVmaW5lZCBvbiBPYmplY3QucHJvdG90eXBlLlxuICAgIC8vIFByZXZlbnQgcHJvdG90eXBlIHNldHRlcnMgZnJvbSBpbnRlcmNlcHRpbmcgc2V0IGFzIGEgdGhpcyB2YWx1ZS5cbiAgICBzZXRQcm90b3R5cGVPZihzZXQsIG51bGwpO1xuICB9XG4gIGxldCBsID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobC0tKSB7XG4gICAgbGV0IGVsZW1lbnQgPSBhcnJheVtsXTtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBsY0VsZW1lbnQgPSB0cmFuc2Zvcm1DYXNlRnVuYyhlbGVtZW50KTtcbiAgICAgIGlmIChsY0VsZW1lbnQgIT09IGVsZW1lbnQpIHtcbiAgICAgICAgLy8gQ29uZmlnIHByZXNldHMgKGUuZy4gdGFncy5qcywgYXR0cnMuanMpIGFyZSBpbW11dGFibGUuXG4gICAgICAgIGlmICghaXNGcm96ZW4oYXJyYXkpKSB7XG4gICAgICAgICAgYXJyYXlbbF0gPSBsY0VsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudCA9IGxjRWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgc2V0W2VsZW1lbnRdID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gc2V0O1xufVxuLyoqXG4gKiBDbGVhbiB1cCBhbiBhcnJheSB0byBoYXJkZW4gYWdhaW5zdCBDU1BQXG4gKlxuICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IHRvIGJlIGNsZWFuZWQuXG4gKiBAcmV0dXJucyBUaGUgY2xlYW5lZCB2ZXJzaW9uIG9mIHRoZSBhcnJheVxuICovXG5mdW5jdGlvbiBjbGVhbkFycmF5KGFycmF5KSB7XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBhcnJheS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBjb25zdCBpc1Byb3BlcnR5RXhpc3QgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShhcnJheSwgaW5kZXgpO1xuICAgIGlmICghaXNQcm9wZXJ0eUV4aXN0KSB7XG4gICAgICBhcnJheVtpbmRleF0gPSBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG4vKipcbiAqIFNoYWxsb3cgY2xvbmUgYW4gb2JqZWN0XG4gKlxuICogQHBhcmFtIG9iamVjdCAtIFRoZSBvYmplY3QgdG8gYmUgY2xvbmVkLlxuICogQHJldHVybnMgQSBuZXcgb2JqZWN0IHRoYXQgY29waWVzIHRoZSBvcmlnaW5hbC5cbiAqL1xuZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gIGNvbnN0IG5ld09iamVjdCA9IGNyZWF0ZShudWxsKTtcbiAgZm9yIChjb25zdCBbcHJvcGVydHksIHZhbHVlXSBvZiBlbnRyaWVzKG9iamVjdCkpIHtcbiAgICBjb25zdCBpc1Byb3BlcnR5RXhpc3QgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5KTtcbiAgICBpZiAoaXNQcm9wZXJ0eUV4aXN0KSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IGNsZWFuQXJyYXkodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBPYmplY3QpIHtcbiAgICAgICAgbmV3T2JqZWN0W3Byb3BlcnR5XSA9IGNsb25lKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld09iamVjdFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ld09iamVjdDtcbn1cbi8qKlxuICogVGhpcyBtZXRob2QgYXV0b21hdGljYWxseSBjaGVja3MgaWYgdGhlIHByb3AgaXMgZnVuY3Rpb24gb3IgZ2V0dGVyIGFuZCBiZWhhdmVzIGFjY29yZGluZ2x5LlxuICpcbiAqIEBwYXJhbSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIGxvb2sgdXAgdGhlIGdldHRlciBmdW5jdGlvbiBpbiBpdHMgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIHByb3AgLSBUaGUgcHJvcGVydHkgbmFtZSBmb3Igd2hpY2ggdG8gZmluZCB0aGUgZ2V0dGVyIGZ1bmN0aW9uLlxuICogQHJldHVybnMgVGhlIGdldHRlciBmdW5jdGlvbiBmb3VuZCBpbiB0aGUgcHJvdG90eXBlIGNoYWluIG9yIGEgZmFsbGJhY2sgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGxvb2t1cEdldHRlcihvYmplY3QsIHByb3ApIHtcbiAgd2hpbGUgKG9iamVjdCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wKTtcbiAgICBpZiAoZGVzYykge1xuICAgICAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgICAgIHJldHVybiB1bmFwcGx5KGRlc2MuZ2V0KTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgZGVzYy52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdW5hcHBseShkZXNjLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgb2JqZWN0ID0gZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgfVxuICBmdW5jdGlvbiBmYWxsYmFja1ZhbHVlKCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBmYWxsYmFja1ZhbHVlO1xufVxuXG5jb25zdCBodG1sJDEgPSBmcmVlemUoWydhJywgJ2FiYnInLCAnYWNyb255bScsICdhZGRyZXNzJywgJ2FyZWEnLCAnYXJ0aWNsZScsICdhc2lkZScsICdhdWRpbycsICdiJywgJ2JkaScsICdiZG8nLCAnYmlnJywgJ2JsaW5rJywgJ2Jsb2NrcXVvdGUnLCAnYm9keScsICdicicsICdidXR0b24nLCAnY2FudmFzJywgJ2NhcHRpb24nLCAnY2VudGVyJywgJ2NpdGUnLCAnY29kZScsICdjb2wnLCAnY29sZ3JvdXAnLCAnY29udGVudCcsICdkYXRhJywgJ2RhdGFsaXN0JywgJ2RkJywgJ2RlY29yYXRvcicsICdkZWwnLCAnZGV0YWlscycsICdkZm4nLCAnZGlhbG9nJywgJ2RpcicsICdkaXYnLCAnZGwnLCAnZHQnLCAnZWxlbWVudCcsICdlbScsICdmaWVsZHNldCcsICdmaWdjYXB0aW9uJywgJ2ZpZ3VyZScsICdmb250JywgJ2Zvb3RlcicsICdmb3JtJywgJ2gxJywgJ2gyJywgJ2gzJywgJ2g0JywgJ2g1JywgJ2g2JywgJ2hlYWQnLCAnaGVhZGVyJywgJ2hncm91cCcsICdocicsICdodG1sJywgJ2knLCAnaW1nJywgJ2lucHV0JywgJ2lucycsICdrYmQnLCAnbGFiZWwnLCAnbGVnZW5kJywgJ2xpJywgJ21haW4nLCAnbWFwJywgJ21hcmsnLCAnbWFycXVlZScsICdtZW51JywgJ21lbnVpdGVtJywgJ21ldGVyJywgJ25hdicsICdub2JyJywgJ29sJywgJ29wdGdyb3VwJywgJ29wdGlvbicsICdvdXRwdXQnLCAncCcsICdwaWN0dXJlJywgJ3ByZScsICdwcm9ncmVzcycsICdxJywgJ3JwJywgJ3J0JywgJ3J1YnknLCAncycsICdzYW1wJywgJ3NlYXJjaCcsICdzZWN0aW9uJywgJ3NlbGVjdCcsICdzaGFkb3cnLCAnc2xvdCcsICdzbWFsbCcsICdzb3VyY2UnLCAnc3BhY2VyJywgJ3NwYW4nLCAnc3RyaWtlJywgJ3N0cm9uZycsICdzdHlsZScsICdzdWInLCAnc3VtbWFyeScsICdzdXAnLCAndGFibGUnLCAndGJvZHknLCAndGQnLCAndGVtcGxhdGUnLCAndGV4dGFyZWEnLCAndGZvb3QnLCAndGgnLCAndGhlYWQnLCAndGltZScsICd0cicsICd0cmFjaycsICd0dCcsICd1JywgJ3VsJywgJ3ZhcicsICd2aWRlbycsICd3YnInXSk7XG5jb25zdCBzdmckMSA9IGZyZWV6ZShbJ3N2ZycsICdhJywgJ2FsdGdseXBoJywgJ2FsdGdseXBoZGVmJywgJ2FsdGdseXBoaXRlbScsICdhbmltYXRlY29sb3InLCAnYW5pbWF0ZW1vdGlvbicsICdhbmltYXRldHJhbnNmb3JtJywgJ2NpcmNsZScsICdjbGlwcGF0aCcsICdkZWZzJywgJ2Rlc2MnLCAnZWxsaXBzZScsICdlbnRlcmtleWhpbnQnLCAnZXhwb3J0cGFydHMnLCAnZmlsdGVyJywgJ2ZvbnQnLCAnZycsICdnbHlwaCcsICdnbHlwaHJlZicsICdoa2VybicsICdpbWFnZScsICdpbnB1dG1vZGUnLCAnbGluZScsICdsaW5lYXJncmFkaWVudCcsICdtYXJrZXInLCAnbWFzaycsICdtZXRhZGF0YScsICdtcGF0aCcsICdwYXJ0JywgJ3BhdGgnLCAncGF0dGVybicsICdwb2x5Z29uJywgJ3BvbHlsaW5lJywgJ3JhZGlhbGdyYWRpZW50JywgJ3JlY3QnLCAnc3RvcCcsICdzdHlsZScsICdzd2l0Y2gnLCAnc3ltYm9sJywgJ3RleHQnLCAndGV4dHBhdGgnLCAndGl0bGUnLCAndHJlZicsICd0c3BhbicsICd2aWV3JywgJ3ZrZXJuJ10pO1xuY29uc3Qgc3ZnRmlsdGVycyA9IGZyZWV6ZShbJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsICdmZUNvbXBvbmVudFRyYW5zZmVyJywgJ2ZlQ29tcG9zaXRlJywgJ2ZlQ29udm9sdmVNYXRyaXgnLCAnZmVEaWZmdXNlTGlnaHRpbmcnLCAnZmVEaXNwbGFjZW1lbnRNYXAnLCAnZmVEaXN0YW50TGlnaHQnLCAnZmVEcm9wU2hhZG93JywgJ2ZlRmxvb2QnLCAnZmVGdW5jQScsICdmZUZ1bmNCJywgJ2ZlRnVuY0cnLCAnZmVGdW5jUicsICdmZUdhdXNzaWFuQmx1cicsICdmZUltYWdlJywgJ2ZlTWVyZ2UnLCAnZmVNZXJnZU5vZGUnLCAnZmVNb3JwaG9sb2d5JywgJ2ZlT2Zmc2V0JywgJ2ZlUG9pbnRMaWdodCcsICdmZVNwZWN1bGFyTGlnaHRpbmcnLCAnZmVTcG90TGlnaHQnLCAnZmVUaWxlJywgJ2ZlVHVyYnVsZW5jZSddKTtcbi8vIExpc3Qgb2YgU1ZHIGVsZW1lbnRzIHRoYXQgYXJlIGRpc2FsbG93ZWQgYnkgZGVmYXVsdC5cbi8vIFdlIHN0aWxsIG5lZWQgdG8ga25vdyB0aGVtIHNvIHRoYXQgd2UgY2FuIGRvIG5hbWVzcGFjZVxuLy8gY2hlY2tzIHByb3Blcmx5IGluIGNhc2Ugb25lIHdhbnRzIHRvIGFkZCB0aGVtIHRvXG4vLyBhbGxvdy1saXN0LlxuY29uc3Qgc3ZnRGlzYWxsb3dlZCA9IGZyZWV6ZShbJ2FuaW1hdGUnLCAnY29sb3ItcHJvZmlsZScsICdjdXJzb3InLCAnZGlzY2FyZCcsICdmb250LWZhY2UnLCAnZm9udC1mYWNlLWZvcm1hdCcsICdmb250LWZhY2UtbmFtZScsICdmb250LWZhY2Utc3JjJywgJ2ZvbnQtZmFjZS11cmknLCAnZm9yZWlnbm9iamVjdCcsICdoYXRjaCcsICdoYXRjaHBhdGgnLCAnbWVzaCcsICdtZXNoZ3JhZGllbnQnLCAnbWVzaHBhdGNoJywgJ21lc2hyb3cnLCAnbWlzc2luZy1nbHlwaCcsICdzY3JpcHQnLCAnc2V0JywgJ3NvbGlkY29sb3InLCAndW5rbm93bicsICd1c2UnXSk7XG5jb25zdCBtYXRoTWwkMSA9IGZyZWV6ZShbJ21hdGgnLCAnbWVuY2xvc2UnLCAnbWVycm9yJywgJ21mZW5jZWQnLCAnbWZyYWMnLCAnbWdseXBoJywgJ21pJywgJ21sYWJlbGVkdHInLCAnbW11bHRpc2NyaXB0cycsICdtbicsICdtbycsICdtb3ZlcicsICdtcGFkZGVkJywgJ21waGFudG9tJywgJ21yb290JywgJ21yb3cnLCAnbXMnLCAnbXNwYWNlJywgJ21zcXJ0JywgJ21zdHlsZScsICdtc3ViJywgJ21zdXAnLCAnbXN1YnN1cCcsICdtdGFibGUnLCAnbXRkJywgJ210ZXh0JywgJ210cicsICdtdW5kZXInLCAnbXVuZGVyb3ZlcicsICdtcHJlc2NyaXB0cyddKTtcbi8vIFNpbWlsYXJseSB0byBTVkcsIHdlIHdhbnQgdG8ga25vdyBhbGwgTWF0aE1MIGVsZW1lbnRzLFxuLy8gZXZlbiB0aG9zZSB0aGF0IHdlIGRpc2FsbG93IGJ5IGRlZmF1bHQuXG5jb25zdCBtYXRoTWxEaXNhbGxvd2VkID0gZnJlZXplKFsnbWFjdGlvbicsICdtYWxpZ25ncm91cCcsICdtYWxpZ25tYXJrJywgJ21sb25nZGl2JywgJ21zY2FycmllcycsICdtc2NhcnJ5JywgJ21zZ3JvdXAnLCAnbXN0YWNrJywgJ21zbGluZScsICdtc3JvdycsICdzZW1hbnRpY3MnLCAnYW5ub3RhdGlvbicsICdhbm5vdGF0aW9uLXhtbCcsICdtcHJlc2NyaXB0cycsICdub25lJ10pO1xuY29uc3QgdGV4dCA9IGZyZWV6ZShbJyN0ZXh0J10pO1xuXG5jb25zdCBodG1sID0gZnJlZXplKFsnYWNjZXB0JywgJ2FjdGlvbicsICdhbGlnbicsICdhbHQnLCAnYXV0b2NhcGl0YWxpemUnLCAnYXV0b2NvbXBsZXRlJywgJ2F1dG9waWN0dXJlaW5waWN0dXJlJywgJ2F1dG9wbGF5JywgJ2JhY2tncm91bmQnLCAnYmdjb2xvcicsICdib3JkZXInLCAnY2FwdHVyZScsICdjZWxscGFkZGluZycsICdjZWxsc3BhY2luZycsICdjaGVja2VkJywgJ2NpdGUnLCAnY2xhc3MnLCAnY2xlYXInLCAnY29sb3InLCAnY29scycsICdjb2xzcGFuJywgJ2NvbnRyb2xzJywgJ2NvbnRyb2xzbGlzdCcsICdjb29yZHMnLCAnY3Jvc3NvcmlnaW4nLCAnZGF0ZXRpbWUnLCAnZGVjb2RpbmcnLCAnZGVmYXVsdCcsICdkaXInLCAnZGlzYWJsZWQnLCAnZGlzYWJsZXBpY3R1cmVpbnBpY3R1cmUnLCAnZGlzYWJsZXJlbW90ZXBsYXliYWNrJywgJ2Rvd25sb2FkJywgJ2RyYWdnYWJsZScsICdlbmN0eXBlJywgJ2VudGVya2V5aGludCcsICdleHBvcnRwYXJ0cycsICdmYWNlJywgJ2ZvcicsICdoZWFkZXJzJywgJ2hlaWdodCcsICdoaWRkZW4nLCAnaGlnaCcsICdocmVmJywgJ2hyZWZsYW5nJywgJ2lkJywgJ2luZXJ0JywgJ2lucHV0bW9kZScsICdpbnRlZ3JpdHknLCAnaXNtYXAnLCAna2luZCcsICdsYWJlbCcsICdsYW5nJywgJ2xpc3QnLCAnbG9hZGluZycsICdsb29wJywgJ2xvdycsICdtYXgnLCAnbWF4bGVuZ3RoJywgJ21lZGlhJywgJ21ldGhvZCcsICdtaW4nLCAnbWlubGVuZ3RoJywgJ211bHRpcGxlJywgJ211dGVkJywgJ25hbWUnLCAnbm9uY2UnLCAnbm9zaGFkZScsICdub3ZhbGlkYXRlJywgJ25vd3JhcCcsICdvcGVuJywgJ29wdGltdW0nLCAncGFydCcsICdwYXR0ZXJuJywgJ3BsYWNlaG9sZGVyJywgJ3BsYXlzaW5saW5lJywgJ3BvcG92ZXInLCAncG9wb3ZlcnRhcmdldCcsICdwb3BvdmVydGFyZ2V0YWN0aW9uJywgJ3Bvc3RlcicsICdwcmVsb2FkJywgJ3B1YmRhdGUnLCAncmFkaW9ncm91cCcsICdyZWFkb25seScsICdyZWwnLCAncmVxdWlyZWQnLCAncmV2JywgJ3JldmVyc2VkJywgJ3JvbGUnLCAncm93cycsICdyb3dzcGFuJywgJ3NwZWxsY2hlY2snLCAnc2NvcGUnLCAnc2VsZWN0ZWQnLCAnc2hhcGUnLCAnc2l6ZScsICdzaXplcycsICdzbG90JywgJ3NwYW4nLCAnc3JjbGFuZycsICdzdGFydCcsICdzcmMnLCAnc3Jjc2V0JywgJ3N0ZXAnLCAnc3R5bGUnLCAnc3VtbWFyeScsICd0YWJpbmRleCcsICd0aXRsZScsICd0cmFuc2xhdGUnLCAndHlwZScsICd1c2VtYXAnLCAndmFsaWduJywgJ3ZhbHVlJywgJ3dpZHRoJywgJ3dyYXAnLCAneG1sbnMnLCAnc2xvdCddKTtcbmNvbnN0IHN2ZyA9IGZyZWV6ZShbJ2FjY2VudC1oZWlnaHQnLCAnYWNjdW11bGF0ZScsICdhZGRpdGl2ZScsICdhbGlnbm1lbnQtYmFzZWxpbmUnLCAnYW1wbGl0dWRlJywgJ2FzY2VudCcsICdhdHRyaWJ1dGVuYW1lJywgJ2F0dHJpYnV0ZXR5cGUnLCAnYXppbXV0aCcsICdiYXNlZnJlcXVlbmN5JywgJ2Jhc2VsaW5lLXNoaWZ0JywgJ2JlZ2luJywgJ2JpYXMnLCAnYnknLCAnY2xhc3MnLCAnY2xpcCcsICdjbGlwcGF0aHVuaXRzJywgJ2NsaXAtcGF0aCcsICdjbGlwLXJ1bGUnLCAnY29sb3InLCAnY29sb3ItaW50ZXJwb2xhdGlvbicsICdjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnMnLCAnY29sb3ItcHJvZmlsZScsICdjb2xvci1yZW5kZXJpbmcnLCAnY3gnLCAnY3knLCAnZCcsICdkeCcsICdkeScsICdkaWZmdXNlY29uc3RhbnQnLCAnZGlyZWN0aW9uJywgJ2Rpc3BsYXknLCAnZGl2aXNvcicsICdkdXInLCAnZWRnZW1vZGUnLCAnZWxldmF0aW9uJywgJ2VuZCcsICdleHBvbmVudCcsICdmaWxsJywgJ2ZpbGwtb3BhY2l0eScsICdmaWxsLXJ1bGUnLCAnZmlsdGVyJywgJ2ZpbHRlcnVuaXRzJywgJ2Zsb29kLWNvbG9yJywgJ2Zsb29kLW9wYWNpdHknLCAnZm9udC1mYW1pbHknLCAnZm9udC1zaXplJywgJ2ZvbnQtc2l6ZS1hZGp1c3QnLCAnZm9udC1zdHJldGNoJywgJ2ZvbnQtc3R5bGUnLCAnZm9udC12YXJpYW50JywgJ2ZvbnQtd2VpZ2h0JywgJ2Z4JywgJ2Z5JywgJ2cxJywgJ2cyJywgJ2dseXBoLW5hbWUnLCAnZ2x5cGhyZWYnLCAnZ3JhZGllbnR1bml0cycsICdncmFkaWVudHRyYW5zZm9ybScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdpbWFnZS1yZW5kZXJpbmcnLCAnaW4nLCAnaW4yJywgJ2ludGVyY2VwdCcsICdrJywgJ2sxJywgJ2syJywgJ2szJywgJ2s0JywgJ2tlcm5pbmcnLCAna2V5cG9pbnRzJywgJ2tleXNwbGluZXMnLCAna2V5dGltZXMnLCAnbGFuZycsICdsZW5ndGhhZGp1c3QnLCAnbGV0dGVyLXNwYWNpbmcnLCAna2VybmVsbWF0cml4JywgJ2tlcm5lbHVuaXRsZW5ndGgnLCAnbGlnaHRpbmctY29sb3InLCAnbG9jYWwnLCAnbWFya2VyLWVuZCcsICdtYXJrZXItbWlkJywgJ21hcmtlci1zdGFydCcsICdtYXJrZXJoZWlnaHQnLCAnbWFya2VydW5pdHMnLCAnbWFya2Vyd2lkdGgnLCAnbWFza2NvbnRlbnR1bml0cycsICdtYXNrdW5pdHMnLCAnbWF4JywgJ21hc2snLCAnbWFzay10eXBlJywgJ21lZGlhJywgJ21ldGhvZCcsICdtb2RlJywgJ21pbicsICduYW1lJywgJ251bW9jdGF2ZXMnLCAnb2Zmc2V0JywgJ29wZXJhdG9yJywgJ29wYWNpdHknLCAnb3JkZXInLCAnb3JpZW50JywgJ29yaWVudGF0aW9uJywgJ29yaWdpbicsICdvdmVyZmxvdycsICdwYWludC1vcmRlcicsICdwYXRoJywgJ3BhdGhsZW5ndGgnLCAncGF0dGVybmNvbnRlbnR1bml0cycsICdwYXR0ZXJudHJhbnNmb3JtJywgJ3BhdHRlcm51bml0cycsICdwb2ludHMnLCAncHJlc2VydmVhbHBoYScsICdwcmVzZXJ2ZWFzcGVjdHJhdGlvJywgJ3ByaW1pdGl2ZXVuaXRzJywgJ3InLCAncngnLCAncnknLCAncmFkaXVzJywgJ3JlZngnLCAncmVmeScsICdyZXBlYXRjb3VudCcsICdyZXBlYXRkdXInLCAncmVzdGFydCcsICdyZXN1bHQnLCAncm90YXRlJywgJ3NjYWxlJywgJ3NlZWQnLCAnc2hhcGUtcmVuZGVyaW5nJywgJ3Nsb3BlJywgJ3NwZWN1bGFyY29uc3RhbnQnLCAnc3BlY3VsYXJleHBvbmVudCcsICdzcHJlYWRtZXRob2QnLCAnc3RhcnRvZmZzZXQnLCAnc3RkZGV2aWF0aW9uJywgJ3N0aXRjaHRpbGVzJywgJ3N0b3AtY29sb3InLCAnc3RvcC1vcGFjaXR5JywgJ3N0cm9rZS1kYXNoYXJyYXknLCAnc3Ryb2tlLWRhc2hvZmZzZXQnLCAnc3Ryb2tlLWxpbmVjYXAnLCAnc3Ryb2tlLWxpbmVqb2luJywgJ3N0cm9rZS1taXRlcmxpbWl0JywgJ3N0cm9rZS1vcGFjaXR5JywgJ3N0cm9rZScsICdzdHJva2Utd2lkdGgnLCAnc3R5bGUnLCAnc3VyZmFjZXNjYWxlJywgJ3N5c3RlbWxhbmd1YWdlJywgJ3RhYmluZGV4JywgJ3RhYmxldmFsdWVzJywgJ3RhcmdldHgnLCAndGFyZ2V0eScsICd0cmFuc2Zvcm0nLCAndHJhbnNmb3JtLW9yaWdpbicsICd0ZXh0LWFuY2hvcicsICd0ZXh0LWRlY29yYXRpb24nLCAndGV4dC1yZW5kZXJpbmcnLCAndGV4dGxlbmd0aCcsICd0eXBlJywgJ3UxJywgJ3UyJywgJ3VuaWNvZGUnLCAndmFsdWVzJywgJ3ZpZXdib3gnLCAndmlzaWJpbGl0eScsICd2ZXJzaW9uJywgJ3ZlcnQtYWR2LXknLCAndmVydC1vcmlnaW4teCcsICd2ZXJ0LW9yaWdpbi15JywgJ3dpZHRoJywgJ3dvcmQtc3BhY2luZycsICd3cmFwJywgJ3dyaXRpbmctbW9kZScsICd4Y2hhbm5lbHNlbGVjdG9yJywgJ3ljaGFubmVsc2VsZWN0b3InLCAneCcsICd4MScsICd4MicsICd4bWxucycsICd5JywgJ3kxJywgJ3kyJywgJ3onLCAnem9vbWFuZHBhbiddKTtcbmNvbnN0IG1hdGhNbCA9IGZyZWV6ZShbJ2FjY2VudCcsICdhY2NlbnR1bmRlcicsICdhbGlnbicsICdiZXZlbGxlZCcsICdjbG9zZScsICdjb2x1bW5zYWxpZ24nLCAnY29sdW1ubGluZXMnLCAnY29sdW1uc3BhbicsICdkZW5vbWFsaWduJywgJ2RlcHRoJywgJ2RpcicsICdkaXNwbGF5JywgJ2Rpc3BsYXlzdHlsZScsICdlbmNvZGluZycsICdmZW5jZScsICdmcmFtZScsICdoZWlnaHQnLCAnaHJlZicsICdpZCcsICdsYXJnZW9wJywgJ2xlbmd0aCcsICdsaW5ldGhpY2tuZXNzJywgJ2xzcGFjZScsICdscXVvdGUnLCAnbWF0aGJhY2tncm91bmQnLCAnbWF0aGNvbG9yJywgJ21hdGhzaXplJywgJ21hdGh2YXJpYW50JywgJ21heHNpemUnLCAnbWluc2l6ZScsICdtb3ZhYmxlbGltaXRzJywgJ25vdGF0aW9uJywgJ251bWFsaWduJywgJ29wZW4nLCAncm93YWxpZ24nLCAncm93bGluZXMnLCAncm93c3BhY2luZycsICdyb3dzcGFuJywgJ3JzcGFjZScsICdycXVvdGUnLCAnc2NyaXB0bGV2ZWwnLCAnc2NyaXB0bWluc2l6ZScsICdzY3JpcHRzaXplbXVsdGlwbGllcicsICdzZWxlY3Rpb24nLCAnc2VwYXJhdG9yJywgJ3NlcGFyYXRvcnMnLCAnc3RyZXRjaHknLCAnc3Vic2NyaXB0c2hpZnQnLCAnc3Vwc2NyaXB0c2hpZnQnLCAnc3ltbWV0cmljJywgJ3ZvZmZzZXQnLCAnd2lkdGgnLCAneG1sbnMnXSk7XG5jb25zdCB4bWwgPSBmcmVlemUoWyd4bGluazpocmVmJywgJ3htbDppZCcsICd4bGluazp0aXRsZScsICd4bWw6c3BhY2UnLCAneG1sbnM6eGxpbmsnXSk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL2JldHRlci1yZWdleFxuY29uc3QgTVVTVEFDSEVfRVhQUiA9IHNlYWwoL1xce1xce1tcXHdcXFddKnxbXFx3XFxXXSpcXH1cXH0vZ20pOyAvLyBTcGVjaWZ5IHRlbXBsYXRlIGRldGVjdGlvbiByZWdleCBmb3IgU0FGRV9GT1JfVEVNUExBVEVTIG1vZGVcbmNvbnN0IEVSQl9FWFBSID0gc2VhbCgvPCVbXFx3XFxXXSp8W1xcd1xcV10qJT4vZ20pO1xuY29uc3QgVE1QTElUX0VYUFIgPSBzZWFsKC9cXCRcXHtbXFx3XFxXXSovZ20pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHVuaWNvcm4vYmV0dGVyLXJlZ2V4XG5jb25zdCBEQVRBX0FUVFIgPSBzZWFsKC9eZGF0YS1bXFwtXFx3LlxcdTAwQjctXFx1RkZGRl0rJC8pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG5jb25zdCBBUklBX0FUVFIgPSBzZWFsKC9eYXJpYS1bXFwtXFx3XSskLyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbmNvbnN0IElTX0FMTE9XRURfVVJJID0gc2VhbCgvXig/Oig/Oig/OmZ8aHQpdHBzP3xtYWlsdG98dGVsfGNhbGx0b3xzbXN8Y2lkfHhtcHB8bWF0cml4KTp8W15hLXpdfFthLXorLlxcLV0rKD86W15hLXorLlxcLTpdfCQpKS9pIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbik7XG5jb25zdCBJU19TQ1JJUFRfT1JfREFUQSA9IHNlYWwoL14oPzpcXHcrc2NyaXB0fGRhdGEpOi9pKTtcbmNvbnN0IEFUVFJfV0hJVEVTUEFDRSA9IHNlYWwoL1tcXHUwMDAwLVxcdTAwMjBcXHUwMEEwXFx1MTY4MFxcdTE4MEVcXHUyMDAwLVxcdTIwMjlcXHUyMDVGXFx1MzAwMF0vZyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnRyb2wtcmVnZXhcbik7XG5jb25zdCBET0NUWVBFX05BTUUgPSBzZWFsKC9eaHRtbCQvaSk7XG5jb25zdCBDVVNUT01fRUxFTUVOVCA9IHNlYWwoL15bYS16XVsuXFx3XSooLVsuXFx3XSspKyQvaSk7XG5cbnZhciBFWFBSRVNTSU9OUyA9IC8qI19fUFVSRV9fKi9PYmplY3QuZnJlZXplKHtcbiAgX19wcm90b19fOiBudWxsLFxuICBBUklBX0FUVFI6IEFSSUFfQVRUUixcbiAgQVRUUl9XSElURVNQQUNFOiBBVFRSX1dISVRFU1BBQ0UsXG4gIENVU1RPTV9FTEVNRU5UOiBDVVNUT01fRUxFTUVOVCxcbiAgREFUQV9BVFRSOiBEQVRBX0FUVFIsXG4gIERPQ1RZUEVfTkFNRTogRE9DVFlQRV9OQU1FLFxuICBFUkJfRVhQUjogRVJCX0VYUFIsXG4gIElTX0FMTE9XRURfVVJJOiBJU19BTExPV0VEX1VSSSxcbiAgSVNfU0NSSVBUX09SX0RBVEE6IElTX1NDUklQVF9PUl9EQVRBLFxuICBNVVNUQUNIRV9FWFBSOiBNVVNUQUNIRV9FWFBSLFxuICBUTVBMSVRfRVhQUjogVE1QTElUX0VYUFJcbn0pO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvaW5kZW50ICovXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZVxuY29uc3QgTk9ERV9UWVBFID0ge1xuICBlbGVtZW50OiAxLFxuICBhdHRyaWJ1dGU6IDIsXG4gIHRleHQ6IDMsXG4gIGNkYXRhU2VjdGlvbjogNCxcbiAgZW50aXR5UmVmZXJlbmNlOiA1LFxuICAvLyBEZXByZWNhdGVkXG4gIGVudGl0eU5vZGU6IDYsXG4gIC8vIERlcHJlY2F0ZWRcbiAgcHJvZ3Jlc3NpbmdJbnN0cnVjdGlvbjogNyxcbiAgY29tbWVudDogOCxcbiAgZG9jdW1lbnQ6IDksXG4gIGRvY3VtZW50VHlwZTogMTAsXG4gIGRvY3VtZW50RnJhZ21lbnQ6IDExLFxuICBub3RhdGlvbjogMTIgLy8gRGVwcmVjYXRlZFxufTtcbmNvbnN0IGdldEdsb2JhbCA9IGZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHdpbmRvdztcbn07XG4vKipcbiAqIENyZWF0ZXMgYSBuby1vcCBwb2xpY3kgZm9yIGludGVybmFsIHVzZSBvbmx5LlxuICogRG9uJ3QgZXhwb3J0IHRoaXMgZnVuY3Rpb24gb3V0c2lkZSB0aGlzIG1vZHVsZSFcbiAqIEBwYXJhbSB0cnVzdGVkVHlwZXMgVGhlIHBvbGljeSBmYWN0b3J5LlxuICogQHBhcmFtIHB1cmlmeUhvc3RFbGVtZW50IFRoZSBTY3JpcHQgZWxlbWVudCB1c2VkIHRvIGxvYWQgRE9NUHVyaWZ5ICh0byBkZXRlcm1pbmUgcG9saWN5IG5hbWUgc3VmZml4KS5cbiAqIEByZXR1cm4gVGhlIHBvbGljeSBjcmVhdGVkIChvciBudWxsLCBpZiBUcnVzdGVkIFR5cGVzXG4gKiBhcmUgbm90IHN1cHBvcnRlZCBvciBjcmVhdGluZyB0aGUgcG9saWN5IGZhaWxlZCkuXG4gKi9cbmNvbnN0IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kgPSBmdW5jdGlvbiBfY3JlYXRlVHJ1c3RlZFR5cGVzUG9saWN5KHRydXN0ZWRUeXBlcywgcHVyaWZ5SG9zdEVsZW1lbnQpIHtcbiAgaWYgKHR5cGVvZiB0cnVzdGVkVHlwZXMgIT09ICdvYmplY3QnIHx8IHR5cGVvZiB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gQWxsb3cgdGhlIGNhbGxlcnMgdG8gY29udHJvbCB0aGUgdW5pcXVlIHBvbGljeSBuYW1lXG4gIC8vIGJ5IGFkZGluZyBhIGRhdGEtdHQtcG9saWN5LXN1ZmZpeCB0byB0aGUgc2NyaXB0IGVsZW1lbnQgd2l0aCB0aGUgRE9NUHVyaWZ5LlxuICAvLyBQb2xpY3kgY3JlYXRpb24gd2l0aCBkdXBsaWNhdGUgbmFtZXMgdGhyb3dzIGluIFRydXN0ZWQgVHlwZXMuXG4gIGxldCBzdWZmaXggPSBudWxsO1xuICBjb25zdCBBVFRSX05BTUUgPSAnZGF0YS10dC1wb2xpY3ktc3VmZml4JztcbiAgaWYgKHB1cmlmeUhvc3RFbGVtZW50ICYmIHB1cmlmeUhvc3RFbGVtZW50Lmhhc0F0dHJpYnV0ZShBVFRSX05BTUUpKSB7XG4gICAgc3VmZml4ID0gcHVyaWZ5SG9zdEVsZW1lbnQuZ2V0QXR0cmlidXRlKEFUVFJfTkFNRSk7XG4gIH1cbiAgY29uc3QgcG9saWN5TmFtZSA9ICdkb21wdXJpZnknICsgKHN1ZmZpeCA/ICcjJyArIHN1ZmZpeCA6ICcnKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gdHJ1c3RlZFR5cGVzLmNyZWF0ZVBvbGljeShwb2xpY3lOYW1lLCB7XG4gICAgICBjcmVhdGVIVE1MKGh0bWwpIHtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICB9LFxuICAgICAgY3JlYXRlU2NyaXB0VVJMKHNjcmlwdFVybCkge1xuICAgICAgICByZXR1cm4gc2NyaXB0VXJsO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChfKSB7XG4gICAgLy8gUG9saWN5IGNyZWF0aW9uIGZhaWxlZCAobW9zdCBsaWtlbHkgYW5vdGhlciBET01QdXJpZnkgc2NyaXB0IGhhc1xuICAgIC8vIGFscmVhZHkgcnVuKS4gU2tpcCBjcmVhdGluZyB0aGUgcG9saWN5LCBhcyB0aGlzIHdpbGwgb25seSBjYXVzZSBlcnJvcnNcbiAgICAvLyBpZiBUVCBhcmUgZW5mb3JjZWQuXG4gICAgY29uc29sZS53YXJuKCdUcnVzdGVkVHlwZXMgcG9saWN5ICcgKyBwb2xpY3lOYW1lICsgJyBjb3VsZCBub3QgYmUgY3JlYXRlZC4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcbmNvbnN0IF9jcmVhdGVIb29rc01hcCA9IGZ1bmN0aW9uIF9jcmVhdGVIb29rc01hcCgpIHtcbiAgcmV0dXJuIHtcbiAgICBhZnRlclNhbml0aXplQXR0cmlidXRlczogW10sXG4gICAgYWZ0ZXJTYW5pdGl6ZUVsZW1lbnRzOiBbXSxcbiAgICBhZnRlclNhbml0aXplU2hhZG93RE9NOiBbXSxcbiAgICBiZWZvcmVTYW5pdGl6ZUF0dHJpYnV0ZXM6IFtdLFxuICAgIGJlZm9yZVNhbml0aXplRWxlbWVudHM6IFtdLFxuICAgIGJlZm9yZVNhbml0aXplU2hhZG93RE9NOiBbXSxcbiAgICB1cG9uU2FuaXRpemVBdHRyaWJ1dGU6IFtdLFxuICAgIHVwb25TYW5pdGl6ZUVsZW1lbnQ6IFtdLFxuICAgIHVwb25TYW5pdGl6ZVNoYWRvd05vZGU6IFtdXG4gIH07XG59O1xuZnVuY3Rpb24gY3JlYXRlRE9NUHVyaWZ5KCkge1xuICBsZXQgd2luZG93ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBnZXRHbG9iYWwoKTtcbiAgY29uc3QgRE9NUHVyaWZ5ID0gcm9vdCA9PiBjcmVhdGVET01QdXJpZnkocm9vdCk7XG4gIERPTVB1cmlmeS52ZXJzaW9uID0gJzMuMy4xJztcbiAgRE9NUHVyaWZ5LnJlbW92ZWQgPSBbXTtcbiAgaWYgKCF3aW5kb3cgfHwgIXdpbmRvdy5kb2N1bWVudCB8fCB3aW5kb3cuZG9jdW1lbnQubm9kZVR5cGUgIT09IE5PREVfVFlQRS5kb2N1bWVudCB8fCAhd2luZG93LkVsZW1lbnQpIHtcbiAgICAvLyBOb3QgcnVubmluZyBpbiBhIGJyb3dzZXIsIHByb3ZpZGUgYSBmYWN0b3J5IGZ1bmN0aW9uXG4gICAgLy8gc28gdGhhdCB5b3UgY2FuIHBhc3MgeW91ciBvd24gV2luZG93XG4gICAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIERPTVB1cmlmeTtcbiAgfVxuICBsZXQge1xuICAgIGRvY3VtZW50XG4gIH0gPSB3aW5kb3c7XG4gIGNvbnN0IG9yaWdpbmFsRG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgY29uc3QgY3VycmVudFNjcmlwdCA9IG9yaWdpbmFsRG9jdW1lbnQuY3VycmVudFNjcmlwdDtcbiAgY29uc3Qge1xuICAgIERvY3VtZW50RnJhZ21lbnQsXG4gICAgSFRNTFRlbXBsYXRlRWxlbWVudCxcbiAgICBOb2RlLFxuICAgIEVsZW1lbnQsXG4gICAgTm9kZUZpbHRlcixcbiAgICBOYW1lZE5vZGVNYXAgPSB3aW5kb3cuTmFtZWROb2RlTWFwIHx8IHdpbmRvdy5Nb3pOYW1lZEF0dHJNYXAsXG4gICAgSFRNTEZvcm1FbGVtZW50LFxuICAgIERPTVBhcnNlcixcbiAgICB0cnVzdGVkVHlwZXNcbiAgfSA9IHdpbmRvdztcbiAgY29uc3QgRWxlbWVudFByb3RvdHlwZSA9IEVsZW1lbnQucHJvdG90eXBlO1xuICBjb25zdCBjbG9uZU5vZGUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ2Nsb25lTm9kZScpO1xuICBjb25zdCByZW1vdmUgPSBsb29rdXBHZXR0ZXIoRWxlbWVudFByb3RvdHlwZSwgJ3JlbW92ZScpO1xuICBjb25zdCBnZXROZXh0U2libGluZyA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnbmV4dFNpYmxpbmcnKTtcbiAgY29uc3QgZ2V0Q2hpbGROb2RlcyA9IGxvb2t1cEdldHRlcihFbGVtZW50UHJvdG90eXBlLCAnY2hpbGROb2RlcycpO1xuICBjb25zdCBnZXRQYXJlbnROb2RlID0gbG9va3VwR2V0dGVyKEVsZW1lbnRQcm90b3R5cGUsICdwYXJlbnROb2RlJyk7XG4gIC8vIEFzIHBlciBpc3N1ZSAjNDcsIHRoZSB3ZWItY29tcG9uZW50cyByZWdpc3RyeSBpcyBpbmhlcml0ZWQgYnkgYVxuICAvLyBuZXcgZG9jdW1lbnQgY3JlYXRlZCB2aWEgY3JlYXRlSFRNTERvY3VtZW50LiBBcyBwZXIgdGhlIHNwZWNcbiAgLy8gKGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9jdXN0b20vI2NyZWF0aW5nLWFuZC1wYXNzaW5nLXJlZ2lzdHJpZXMpXG4gIC8vIGEgbmV3IGVtcHR5IHJlZ2lzdHJ5IGlzIHVzZWQgd2hlbiBjcmVhdGluZyBhIHRlbXBsYXRlIGNvbnRlbnRzIG93bmVyXG4gIC8vIGRvY3VtZW50LCBzbyB3ZSB1c2UgdGhhdCBhcyBvdXIgcGFyZW50IGRvY3VtZW50IHRvIGVuc3VyZSBub3RoaW5nXG4gIC8vIGlzIGluaGVyaXRlZC5cbiAgaWYgKHR5cGVvZiBIVE1MVGVtcGxhdGVFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgIGlmICh0ZW1wbGF0ZS5jb250ZW50ICYmIHRlbXBsYXRlLmNvbnRlbnQub3duZXJEb2N1bWVudCkge1xuICAgICAgZG9jdW1lbnQgPSB0ZW1wbGF0ZS5jb250ZW50Lm93bmVyRG9jdW1lbnQ7XG4gICAgfVxuICB9XG4gIGxldCB0cnVzdGVkVHlwZXNQb2xpY3k7XG4gIGxldCBlbXB0eUhUTUwgPSAnJztcbiAgY29uc3Qge1xuICAgIGltcGxlbWVudGF0aW9uLFxuICAgIGNyZWF0ZU5vZGVJdGVyYXRvcixcbiAgICBjcmVhdGVEb2N1bWVudEZyYWdtZW50LFxuICAgIGdldEVsZW1lbnRzQnlUYWdOYW1lXG4gIH0gPSBkb2N1bWVudDtcbiAgY29uc3Qge1xuICAgIGltcG9ydE5vZGVcbiAgfSA9IG9yaWdpbmFsRG9jdW1lbnQ7XG4gIGxldCBob29rcyA9IF9jcmVhdGVIb29rc01hcCgpO1xuICAvKipcbiAgICogRXhwb3NlIHdoZXRoZXIgdGhpcyBicm93c2VyIHN1cHBvcnRzIHJ1bm5pbmcgdGhlIGZ1bGwgRE9NUHVyaWZ5LlxuICAgKi9cbiAgRE9NUHVyaWZ5LmlzU3VwcG9ydGVkID0gdHlwZW9mIGVudHJpZXMgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGdldFBhcmVudE5vZGUgPT09ICdmdW5jdGlvbicgJiYgaW1wbGVtZW50YXRpb24gJiYgaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50ICE9PSB1bmRlZmluZWQ7XG4gIGNvbnN0IHtcbiAgICBNVVNUQUNIRV9FWFBSLFxuICAgIEVSQl9FWFBSLFxuICAgIFRNUExJVF9FWFBSLFxuICAgIERBVEFfQVRUUixcbiAgICBBUklBX0FUVFIsXG4gICAgSVNfU0NSSVBUX09SX0RBVEEsXG4gICAgQVRUUl9XSElURVNQQUNFLFxuICAgIENVU1RPTV9FTEVNRU5UXG4gIH0gPSBFWFBSRVNTSU9OUztcbiAgbGV0IHtcbiAgICBJU19BTExPV0VEX1VSSTogSVNfQUxMT1dFRF9VUkkkMVxuICB9ID0gRVhQUkVTU0lPTlM7XG4gIC8qKlxuICAgKiBXZSBjb25zaWRlciB0aGUgZWxlbWVudHMgYW5kIGF0dHJpYnV0ZXMgYmVsb3cgdG8gYmUgc2FmZS4gSWRlYWxseVxuICAgKiBkb24ndCBhZGQgYW55IG5ldyBvbmVzIGJ1dCBmZWVsIGZyZWUgdG8gcmVtb3ZlIHVud2FudGVkIG9uZXMuXG4gICAqL1xuICAvKiBhbGxvd2VkIGVsZW1lbnQgbmFtZXMgKi9cbiAgbGV0IEFMTE9XRURfVEFHUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfQUxMT1dFRF9UQUdTID0gYWRkVG9TZXQoe30sIFsuLi5odG1sJDEsIC4uLnN2ZyQxLCAuLi5zdmdGaWx0ZXJzLCAuLi5tYXRoTWwkMSwgLi4udGV4dF0pO1xuICAvKiBBbGxvd2VkIGF0dHJpYnV0ZSBuYW1lcyAqL1xuICBsZXQgQUxMT1dFRF9BVFRSID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9BTExPV0VEX0FUVFIgPSBhZGRUb1NldCh7fSwgWy4uLmh0bWwsIC4uLnN2ZywgLi4ubWF0aE1sLCAuLi54bWxdKTtcbiAgLypcbiAgICogQ29uZmlndXJlIGhvdyBET01QdXJpZnkgc2hvdWxkIGhhbmRsZSBjdXN0b20gZWxlbWVudHMgYW5kIHRoZWlyIGF0dHJpYnV0ZXMgYXMgd2VsbCBhcyBjdXN0b21pemVkIGJ1aWx0LWluIGVsZW1lbnRzLlxuICAgKiBAcHJvcGVydHkge1JlZ0V4cHxGdW5jdGlvbnxudWxsfSB0YWdOYW1lQ2hlY2sgb25lIG9mIFtudWxsLCByZWdleFBhdHRlcm4sIHByZWRpY2F0ZV0uIERlZmF1bHQ6IGBudWxsYCAoZGlzYWxsb3cgYW55IGN1c3RvbSBlbGVtZW50cylcbiAgICogQHByb3BlcnR5IHtSZWdFeHB8RnVuY3Rpb258bnVsbH0gYXR0cmlidXRlTmFtZUNoZWNrIG9uZSBvZiBbbnVsbCwgcmVnZXhQYXR0ZXJuLCBwcmVkaWNhdGVdLiBEZWZhdWx0OiBgbnVsbGAgKGRpc2FsbG93IGFueSBhdHRyaWJ1dGVzIG5vdCBvbiB0aGUgYWxsb3cgbGlzdClcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBhbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgYWxsb3cgY3VzdG9tIGVsZW1lbnRzIGRlcml2ZWQgZnJvbSBidWlsdC1pbnMgaWYgdGhleSBwYXNzIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjay4gRGVmYXVsdDogYGZhbHNlYC5cbiAgICovXG4gIGxldCBDVVNUT01fRUxFTUVOVF9IQU5ETElORyA9IE9iamVjdC5zZWFsKGNyZWF0ZShudWxsLCB7XG4gICAgdGFnTmFtZUNoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9LFxuICAgIGF0dHJpYnV0ZU5hbWVDaGVjazoge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBudWxsXG4gICAgfSxcbiAgICBhbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHM6IHtcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogZmFsc2VcbiAgICB9XG4gIH0pKTtcbiAgLyogRXhwbGljaXRseSBmb3JiaWRkZW4gdGFncyAob3ZlcnJpZGVzIEFMTE9XRURfVEFHUy9BRERfVEFHUykgKi9cbiAgbGV0IEZPUkJJRF9UQUdTID0gbnVsbDtcbiAgLyogRXhwbGljaXRseSBmb3JiaWRkZW4gYXR0cmlidXRlcyAob3ZlcnJpZGVzIEFMTE9XRURfQVRUUi9BRERfQVRUUikgKi9cbiAgbGV0IEZPUkJJRF9BVFRSID0gbnVsbDtcbiAgLyogQ29uZmlnIG9iamVjdCB0byBzdG9yZSBBRERfVEFHUy9BRERfQVRUUiBmdW5jdGlvbnMgKHdoZW4gdXNlZCBhcyBmdW5jdGlvbnMpICovXG4gIGNvbnN0IEVYVFJBX0VMRU1FTlRfSEFORExJTkcgPSBPYmplY3Quc2VhbChjcmVhdGUobnVsbCwge1xuICAgIHRhZ0NoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9LFxuICAgIGF0dHJpYnV0ZUNoZWNrOiB7XG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG51bGxcbiAgICB9XG4gIH0pKTtcbiAgLyogRGVjaWRlIGlmIEFSSUEgYXR0cmlidXRlcyBhcmUgb2theSAqL1xuICBsZXQgQUxMT1dfQVJJQV9BVFRSID0gdHJ1ZTtcbiAgLyogRGVjaWRlIGlmIGN1c3RvbSBkYXRhIGF0dHJpYnV0ZXMgYXJlIG9rYXkgKi9cbiAgbGV0IEFMTE9XX0RBVEFfQVRUUiA9IHRydWU7XG4gIC8qIERlY2lkZSBpZiB1bmtub3duIHByb3RvY29scyBhcmUgb2theSAqL1xuICBsZXQgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIHNlbGYtY2xvc2luZyB0YWdzIGluIGF0dHJpYnV0ZXMgYXJlIGFsbG93ZWQuXG4gICAqIFVzdWFsbHkgcmVtb3ZlZCBkdWUgdG8gYSBtWFNTIGlzc3VlIGluIGpRdWVyeSAzLjAgKi9cbiAgbGV0IEFMTE9XX1NFTEZfQ0xPU0VfSU5fQVRUUiA9IHRydWU7XG4gIC8qIE91dHB1dCBzaG91bGQgYmUgc2FmZSBmb3IgY29tbW9uIHRlbXBsYXRlIGVuZ2luZXMuXG4gICAqIFRoaXMgbWVhbnMsIERPTVB1cmlmeSByZW1vdmVzIGRhdGEgYXR0cmlidXRlcywgbXVzdGFjaGVzIGFuZCBFUkJcbiAgICovXG4gIGxldCBTQUZFX0ZPUl9URU1QTEFURVMgPSBmYWxzZTtcbiAgLyogT3V0cHV0IHNob3VsZCBiZSBzYWZlIGV2ZW4gZm9yIFhNTCB1c2VkIHdpdGhpbiBIVE1MIGFuZCBhbGlrZS5cbiAgICogVGhpcyBtZWFucywgRE9NUHVyaWZ5IHJlbW92ZXMgY29tbWVudHMgd2hlbiBjb250YWluaW5nIHJpc2t5IGNvbnRlbnQuXG4gICAqL1xuICBsZXQgU0FGRV9GT1JfWE1MID0gdHJ1ZTtcbiAgLyogRGVjaWRlIGlmIGRvY3VtZW50IHdpdGggPGh0bWw+Li4uIHNob3VsZCBiZSByZXR1cm5lZCAqL1xuICBsZXQgV0hPTEVfRE9DVU1FTlQgPSBmYWxzZTtcbiAgLyogVHJhY2sgd2hldGhlciBjb25maWcgaXMgYWxyZWFkeSBzZXQgb24gdGhpcyBpbnN0YW5jZSBvZiBET01QdXJpZnkuICovXG4gIGxldCBTRVRfQ09ORklHID0gZmFsc2U7XG4gIC8qIERlY2lkZSBpZiBhbGwgZWxlbWVudHMgKGUuZy4gc3R5bGUsIHNjcmlwdCkgbXVzdCBiZSBjaGlsZHJlbiBvZlxuICAgKiBkb2N1bWVudC5ib2R5LiBCeSBkZWZhdWx0LCBicm93c2VycyBtaWdodCBtb3ZlIHRoZW0gdG8gZG9jdW1lbnQuaGVhZCAqL1xuICBsZXQgRk9SQ0VfQk9EWSA9IGZhbHNlO1xuICAvKiBEZWNpZGUgaWYgYSBET00gYEhUTUxCb2R5RWxlbWVudGAgc2hvdWxkIGJlIHJldHVybmVkLCBpbnN0ZWFkIG9mIGEgaHRtbFxuICAgKiBzdHJpbmcgKG9yIGEgVHJ1c3RlZEhUTUwgb2JqZWN0IGlmIFRydXN0ZWQgVHlwZXMgYXJlIHN1cHBvcnRlZCkuXG4gICAqIElmIGBXSE9MRV9ET0NVTUVOVGAgaXMgZW5hYmxlZCBhIGBIVE1MSHRtbEVsZW1lbnRgIHdpbGwgYmUgcmV0dXJuZWQgaW5zdGVhZFxuICAgKi9cbiAgbGV0IFJFVFVSTl9ET00gPSBmYWxzZTtcbiAgLyogRGVjaWRlIGlmIGEgRE9NIGBEb2N1bWVudEZyYWdtZW50YCBzaG91bGQgYmUgcmV0dXJuZWQsIGluc3RlYWQgb2YgYSBodG1sXG4gICAqIHN0cmluZyAgKG9yIGEgVHJ1c3RlZEhUTUwgb2JqZWN0IGlmIFRydXN0ZWQgVHlwZXMgYXJlIHN1cHBvcnRlZCkgKi9cbiAgbGV0IFJFVFVSTl9ET01fRlJBR01FTlQgPSBmYWxzZTtcbiAgLyogVHJ5IHRvIHJldHVybiBhIFRydXN0ZWQgVHlwZSBvYmplY3QgaW5zdGVhZCBvZiBhIHN0cmluZywgcmV0dXJuIGEgc3RyaW5nIGluXG4gICAqIGNhc2UgVHJ1c3RlZCBUeXBlcyBhcmUgbm90IHN1cHBvcnRlZCAgKi9cbiAgbGV0IFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBmYWxzZTtcbiAgLyogT3V0cHV0IHNob3VsZCBiZSBmcmVlIGZyb20gRE9NIGNsb2JiZXJpbmcgYXR0YWNrcz9cbiAgICogVGhpcyBzYW5pdGl6ZXMgbWFya3VwcyBuYW1lZCB3aXRoIGNvbGxpZGluZywgY2xvYmJlcmFibGUgYnVpbHQtaW4gRE9NIEFQSXMuXG4gICAqL1xuICBsZXQgU0FOSVRJWkVfRE9NID0gdHJ1ZTtcbiAgLyogQWNoaWV2ZSBmdWxsIERPTSBDbG9iYmVyaW5nIHByb3RlY3Rpb24gYnkgaXNvbGF0aW5nIHRoZSBuYW1lc3BhY2Ugb2YgbmFtZWRcbiAgICogcHJvcGVydGllcyBhbmQgSlMgdmFyaWFibGVzLCBtaXRpZ2F0aW5nIGF0dGFja3MgdGhhdCBhYnVzZSB0aGUgSFRNTC9ET00gc3BlYyBydWxlcy5cbiAgICpcbiAgICogSFRNTC9ET00gc3BlYyBydWxlcyB0aGF0IGVuYWJsZSBET00gQ2xvYmJlcmluZzpcbiAgICogICAtIE5hbWVkIEFjY2VzcyBvbiBXaW5kb3cgKMKnNy4zLjMpXG4gICAqICAgLSBET00gVHJlZSBBY2Nlc3NvcnMgKMKnMy4xLjUpXG4gICAqICAgLSBGb3JtIEVsZW1lbnQgUGFyZW50LUNoaWxkIFJlbGF0aW9ucyAowqc0LjEwLjMpXG4gICAqICAgLSBJZnJhbWUgc3JjZG9jIC8gTmVzdGVkIFdpbmRvd1Byb3hpZXMgKMKnNC44LjUpXG4gICAqICAgLSBIVE1MQ29sbGVjdGlvbiAowqc0LjIuMTAuMilcbiAgICpcbiAgICogTmFtZXNwYWNlIGlzb2xhdGlvbiBpcyBpbXBsZW1lbnRlZCBieSBwcmVmaXhpbmcgYGlkYCBhbmQgYG5hbWVgIGF0dHJpYnV0ZXNcbiAgICogd2l0aCBhIGNvbnN0YW50IHN0cmluZywgaS5lLiwgYHVzZXItY29udGVudC1gXG4gICAqL1xuICBsZXQgU0FOSVRJWkVfTkFNRURfUFJPUFMgPSBmYWxzZTtcbiAgY29uc3QgU0FOSVRJWkVfTkFNRURfUFJPUFNfUFJFRklYID0gJ3VzZXItY29udGVudC0nO1xuICAvKiBLZWVwIGVsZW1lbnQgY29udGVudCB3aGVuIHJlbW92aW5nIGVsZW1lbnQ/ICovXG4gIGxldCBLRUVQX0NPTlRFTlQgPSB0cnVlO1xuICAvKiBJZiBhIGBOb2RlYCBpcyBwYXNzZWQgdG8gc2FuaXRpemUoKSwgdGhlbiBwZXJmb3JtcyBzYW5pdGl6YXRpb24gaW4tcGxhY2UgaW5zdGVhZFxuICAgKiBvZiBpbXBvcnRpbmcgaXQgaW50byBhIG5ldyBEb2N1bWVudCBhbmQgcmV0dXJuaW5nIGEgc2FuaXRpemVkIGNvcHkgKi9cbiAgbGV0IElOX1BMQUNFID0gZmFsc2U7XG4gIC8qIEFsbG93IHVzYWdlIG9mIHByb2ZpbGVzIGxpa2UgaHRtbCwgc3ZnIGFuZCBtYXRoTWwgKi9cbiAgbGV0IFVTRV9QUk9GSUxFUyA9IHt9O1xuICAvKiBUYWdzIHRvIGlnbm9yZSBjb250ZW50IG9mIHdoZW4gS0VFUF9DT05URU5UIGlzIHRydWUgKi9cbiAgbGV0IEZPUkJJRF9DT05URU5UUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTID0gYWRkVG9TZXQoe30sIFsnYW5ub3RhdGlvbi14bWwnLCAnYXVkaW8nLCAnY29sZ3JvdXAnLCAnZGVzYycsICdmb3JlaWdub2JqZWN0JywgJ2hlYWQnLCAnaWZyYW1lJywgJ21hdGgnLCAnbWknLCAnbW4nLCAnbW8nLCAnbXMnLCAnbXRleHQnLCAnbm9lbWJlZCcsICdub2ZyYW1lcycsICdub3NjcmlwdCcsICdwbGFpbnRleHQnLCAnc2NyaXB0JywgJ3N0eWxlJywgJ3N2ZycsICd0ZW1wbGF0ZScsICd0aGVhZCcsICd0aXRsZScsICd2aWRlbycsICd4bXAnXSk7XG4gIC8qIFRhZ3MgdGhhdCBhcmUgc2FmZSBmb3IgZGF0YTogVVJJcyAqL1xuICBsZXQgREFUQV9VUklfVEFHUyA9IG51bGw7XG4gIGNvbnN0IERFRkFVTFRfREFUQV9VUklfVEFHUyA9IGFkZFRvU2V0KHt9LCBbJ2F1ZGlvJywgJ3ZpZGVvJywgJ2ltZycsICdzb3VyY2UnLCAnaW1hZ2UnLCAndHJhY2snXSk7XG4gIC8qIEF0dHJpYnV0ZXMgc2FmZSBmb3IgdmFsdWVzIGxpa2UgXCJqYXZhc2NyaXB0OlwiICovXG4gIGxldCBVUklfU0FGRV9BVFRSSUJVVEVTID0gbnVsbDtcbiAgY29uc3QgREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTID0gYWRkVG9TZXQoe30sIFsnYWx0JywgJ2NsYXNzJywgJ2ZvcicsICdpZCcsICdsYWJlbCcsICduYW1lJywgJ3BhdHRlcm4nLCAncGxhY2Vob2xkZXInLCAncm9sZScsICdzdW1tYXJ5JywgJ3RpdGxlJywgJ3ZhbHVlJywgJ3N0eWxlJywgJ3htbG5zJ10pO1xuICBjb25zdCBNQVRITUxfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUwnO1xuICBjb25zdCBTVkdfTkFNRVNQQUNFID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgY29uc3QgSFRNTF9OQU1FU1BBQ0UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCc7XG4gIC8qIERvY3VtZW50IG5hbWVzcGFjZSAqL1xuICBsZXQgTkFNRVNQQUNFID0gSFRNTF9OQU1FU1BBQ0U7XG4gIGxldCBJU19FTVBUWV9JTlBVVCA9IGZhbHNlO1xuICAvKiBBbGxvd2VkIFhIVE1MK1hNTCBuYW1lc3BhY2VzICovXG4gIGxldCBBTExPV0VEX05BTUVTUEFDRVMgPSBudWxsO1xuICBjb25zdCBERUZBVUxUX0FMTE9XRURfTkFNRVNQQUNFUyA9IGFkZFRvU2V0KHt9LCBbTUFUSE1MX05BTUVTUEFDRSwgU1ZHX05BTUVTUEFDRSwgSFRNTF9OQU1FU1BBQ0VdLCBzdHJpbmdUb1N0cmluZyk7XG4gIGxldCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFMgPSBhZGRUb1NldCh7fSwgWydtaScsICdtbycsICdtbicsICdtcycsICdtdGV4dCddKTtcbiAgbGV0IEhUTUxfSU5URUdSQVRJT05fUE9JTlRTID0gYWRkVG9TZXQoe30sIFsnYW5ub3RhdGlvbi14bWwnXSk7XG4gIC8vIENlcnRhaW4gZWxlbWVudHMgYXJlIGFsbG93ZWQgaW4gYm90aCBTVkcgYW5kIEhUTUxcbiAgLy8gbmFtZXNwYWNlLiBXZSBuZWVkIHRvIHNwZWNpZnkgdGhlbSBleHBsaWNpdGx5XG4gIC8vIHNvIHRoYXQgdGhleSBkb24ndCBnZXQgZXJyb25lb3VzbHkgZGVsZXRlZCBmcm9tXG4gIC8vIEhUTUwgbmFtZXNwYWNlLlxuICBjb25zdCBDT01NT05fU1ZHX0FORF9IVE1MX0VMRU1FTlRTID0gYWRkVG9TZXQoe30sIFsndGl0bGUnLCAnc3R5bGUnLCAnZm9udCcsICdhJywgJ3NjcmlwdCddKTtcbiAgLyogUGFyc2luZyBvZiBzdHJpY3QgWEhUTUwgZG9jdW1lbnRzICovXG4gIGxldCBQQVJTRVJfTUVESUFfVFlQRSA9IG51bGw7XG4gIGNvbnN0IFNVUFBPUlRFRF9QQVJTRVJfTUVESUFfVFlQRVMgPSBbJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcsICd0ZXh0L2h0bWwnXTtcbiAgY29uc3QgREVGQVVMVF9QQVJTRVJfTUVESUFfVFlQRSA9ICd0ZXh0L2h0bWwnO1xuICBsZXQgdHJhbnNmb3JtQ2FzZUZ1bmMgPSBudWxsO1xuICAvKiBLZWVwIGEgcmVmZXJlbmNlIHRvIGNvbmZpZyB0byBwYXNzIHRvIGhvb2tzICovXG4gIGxldCBDT05GSUcgPSBudWxsO1xuICAvKiBJZGVhbGx5LCBkbyBub3QgdG91Y2ggYW55dGhpbmcgYmVsb3cgdGhpcyBsaW5lICovXG4gIC8qIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gKi9cbiAgY29uc3QgZm9ybUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gIGNvbnN0IGlzUmVnZXhPckZ1bmN0aW9uID0gZnVuY3Rpb24gaXNSZWdleE9yRnVuY3Rpb24odGVzdFZhbHVlKSB7XG4gICAgcmV0dXJuIHRlc3RWYWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCB8fCB0ZXN0VmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbjtcbiAgfTtcbiAgLyoqXG4gICAqIF9wYXJzZUNvbmZpZ1xuICAgKlxuICAgKiBAcGFyYW0gY2ZnIG9wdGlvbmFsIGNvbmZpZyBsaXRlcmFsXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICBjb25zdCBfcGFyc2VDb25maWcgPSBmdW5jdGlvbiBfcGFyc2VDb25maWcoKSB7XG4gICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgaWYgKENPTkZJRyAmJiBDT05GSUcgPT09IGNmZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvKiBTaGllbGQgY29uZmlndXJhdGlvbiBvYmplY3QgZnJvbSB0YW1wZXJpbmcgKi9cbiAgICBpZiAoIWNmZyB8fCB0eXBlb2YgY2ZnICE9PSAnb2JqZWN0Jykge1xuICAgICAgY2ZnID0ge307XG4gICAgfVxuICAgIC8qIFNoaWVsZCBjb25maWd1cmF0aW9uIG9iamVjdCBmcm9tIHByb3RvdHlwZSBwb2xsdXRpb24gKi9cbiAgICBjZmcgPSBjbG9uZShjZmcpO1xuICAgIFBBUlNFUl9NRURJQV9UWVBFID1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItaW5jbHVkZXNcbiAgICBTVVBQT1JURURfUEFSU0VSX01FRElBX1RZUEVTLmluZGV4T2YoY2ZnLlBBUlNFUl9NRURJQV9UWVBFKSA9PT0gLTEgPyBERUZBVUxUX1BBUlNFUl9NRURJQV9UWVBFIDogY2ZnLlBBUlNFUl9NRURJQV9UWVBFO1xuICAgIC8vIEhUTUwgdGFncyBhbmQgYXR0cmlidXRlcyBhcmUgbm90IGNhc2Utc2Vuc2l0aXZlLCBjb252ZXJ0aW5nIHRvIGxvd2VyY2FzZS4gS2VlcGluZyBYSFRNTCBhcyBpcy5cbiAgICB0cmFuc2Zvcm1DYXNlRnVuYyA9IFBBUlNFUl9NRURJQV9UWVBFID09PSAnYXBwbGljYXRpb24veGh0bWwreG1sJyA/IHN0cmluZ1RvU3RyaW5nIDogc3RyaW5nVG9Mb3dlckNhc2U7XG4gICAgLyogU2V0IGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAqL1xuICAgIEFMTE9XRURfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfVEFHUycpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfQUxMT1dFRF9UQUdTO1xuICAgIEFMTE9XRURfQVRUUiA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfQVRUUicpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfQUxMT1dFRF9BVFRSO1xuICAgIEFMTE9XRURfTkFNRVNQQUNFUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FMTE9XRURfTkFNRVNQQUNFUycpID8gYWRkVG9TZXQoe30sIGNmZy5BTExPV0VEX05BTUVTUEFDRVMsIHN0cmluZ1RvU3RyaW5nKSA6IERFRkFVTFRfQUxMT1dFRF9OQU1FU1BBQ0VTO1xuICAgIFVSSV9TQUZFX0FUVFJJQlVURVMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdBRERfVVJJX1NBRkVfQVRUUicpID8gYWRkVG9TZXQoY2xvbmUoREVGQVVMVF9VUklfU0FGRV9BVFRSSUJVVEVTKSwgY2ZnLkFERF9VUklfU0FGRV9BVFRSLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX1VSSV9TQUZFX0FUVFJJQlVURVM7XG4gICAgREFUQV9VUklfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0FERF9EQVRBX1VSSV9UQUdTJykgPyBhZGRUb1NldChjbG9uZShERUZBVUxUX0RBVEFfVVJJX1RBR1MpLCBjZmcuQUREX0RBVEFfVVJJX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKSA6IERFRkFVTFRfREFUQV9VUklfVEFHUztcbiAgICBGT1JCSURfQ09OVEVOVFMgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdGT1JCSURfQ09OVEVOVFMnKSA/IGFkZFRvU2V0KHt9LCBjZmcuRk9SQklEX0NPTlRFTlRTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBERUZBVUxUX0ZPUkJJRF9DT05URU5UUztcbiAgICBGT1JCSURfVEFHUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ0ZPUkJJRF9UQUdTJykgPyBhZGRUb1NldCh7fSwgY2ZnLkZPUkJJRF9UQUdTLCB0cmFuc2Zvcm1DYXNlRnVuYykgOiBjbG9uZSh7fSk7XG4gICAgRk9SQklEX0FUVFIgPSBvYmplY3RIYXNPd25Qcm9wZXJ0eShjZmcsICdGT1JCSURfQVRUUicpID8gYWRkVG9TZXQoe30sIGNmZy5GT1JCSURfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpIDogY2xvbmUoe30pO1xuICAgIFVTRV9QUk9GSUxFUyA9IG9iamVjdEhhc093blByb3BlcnR5KGNmZywgJ1VTRV9QUk9GSUxFUycpID8gY2ZnLlVTRV9QUk9GSUxFUyA6IGZhbHNlO1xuICAgIEFMTE9XX0FSSUFfQVRUUiA9IGNmZy5BTExPV19BUklBX0FUVFIgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBBTExPV19EQVRBX0FUVFIgPSBjZmcuQUxMT1dfREFUQV9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgPSBjZmcuQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgfHwgZmFsc2U7IC8vIERlZmF1bHQgZmFsc2VcbiAgICBBTExPV19TRUxGX0NMT1NFX0lOX0FUVFIgPSBjZmcuQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSICE9PSBmYWxzZTsgLy8gRGVmYXVsdCB0cnVlXG4gICAgU0FGRV9GT1JfVEVNUExBVEVTID0gY2ZnLlNBRkVfRk9SX1RFTVBMQVRFUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFNBRkVfRk9SX1hNTCA9IGNmZy5TQUZFX0ZPUl9YTUwgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBXSE9MRV9ET0NVTUVOVCA9IGNmZy5XSE9MRV9ET0NVTUVOVCB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFJFVFVSTl9ET00gPSBjZmcuUkVUVVJOX0RPTSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFJFVFVSTl9ET01fRlJBR01FTlQgPSBjZmcuUkVUVVJOX0RPTV9GUkFHTUVOVCB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFJFVFVSTl9UUlVTVEVEX1RZUEUgPSBjZmcuUkVUVVJOX1RSVVNURURfVFlQRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIEZPUkNFX0JPRFkgPSBjZmcuRk9SQ0VfQk9EWSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIFNBTklUSVpFX0RPTSA9IGNmZy5TQU5JVElaRV9ET00gIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBTQU5JVElaRV9OQU1FRF9QUk9QUyA9IGNmZy5TQU5JVElaRV9OQU1FRF9QUk9QUyB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIEtFRVBfQ09OVEVOVCA9IGNmZy5LRUVQX0NPTlRFTlQgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICBJTl9QTEFDRSA9IGNmZy5JTl9QTEFDRSB8fCBmYWxzZTsgLy8gRGVmYXVsdCBmYWxzZVxuICAgIElTX0FMTE9XRURfVVJJJDEgPSBjZmcuQUxMT1dFRF9VUklfUkVHRVhQIHx8IElTX0FMTE9XRURfVVJJO1xuICAgIE5BTUVTUEFDRSA9IGNmZy5OQU1FU1BBQ0UgfHwgSFRNTF9OQU1FU1BBQ0U7XG4gICAgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTID0gY2ZnLk1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UUyB8fCBNQVRITUxfVEVYVF9JTlRFR1JBVElPTl9QT0lOVFM7XG4gICAgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFMgPSBjZmcuSFRNTF9JTlRFR1JBVElPTl9QT0lOVFMgfHwgSFRNTF9JTlRFR1JBVElPTl9QT0lOVFM7XG4gICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcgfHwge307XG4gICAgaWYgKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyAmJiBpc1JlZ2V4T3JGdW5jdGlvbihjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKSkge1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaztcbiAgICB9XG4gICAgaWYgKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyAmJiBpc1JlZ2V4T3JGdW5jdGlvbihjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrKSkge1xuICAgICAgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrID0gY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjaztcbiAgICB9XG4gICAgaWYgKGNmZy5DVVNUT01fRUxFTUVOVF9IQU5ETElORyAmJiB0eXBlb2YgY2ZnLkNVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBDVVNUT01fRUxFTUVOVF9IQU5ETElORy5hbGxvd0N1c3RvbWl6ZWRCdWlsdEluRWxlbWVudHMgPSBjZmcuQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYWxsb3dDdXN0b21pemVkQnVpbHRJbkVsZW1lbnRzO1xuICAgIH1cbiAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICBBTExPV19EQVRBX0FUVFIgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKFJFVFVSTl9ET01fRlJBR01FTlQpIHtcbiAgICAgIFJFVFVSTl9ET00gPSB0cnVlO1xuICAgIH1cbiAgICAvKiBQYXJzZSBwcm9maWxlIGluZm8gKi9cbiAgICBpZiAoVVNFX1BST0ZJTEVTKSB7XG4gICAgICBBTExPV0VEX1RBR1MgPSBhZGRUb1NldCh7fSwgdGV4dCk7XG4gICAgICBBTExPV0VEX0FUVFIgPSBbXTtcbiAgICAgIGlmIChVU0VfUFJPRklMRVMuaHRtbCA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIGh0bWwkMSk7XG4gICAgICAgIGFkZFRvU2V0KEFMTE9XRURfQVRUUiwgaHRtbCk7XG4gICAgICB9XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2ZyA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIHN2ZyQxKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBzdmcpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICB9XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLnN2Z0ZpbHRlcnMgPT09IHRydWUpIHtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBzdmdGaWx0ZXJzKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBzdmcpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICB9XG4gICAgICBpZiAoVVNFX1BST0ZJTEVTLm1hdGhNbCA9PT0gdHJ1ZSkge1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIG1hdGhNbCQxKTtcbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9BVFRSLCBtYXRoTWwpO1xuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIHhtbCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIE1lcmdlIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyAqL1xuICAgIGlmIChjZmcuQUREX1RBR1MpIHtcbiAgICAgIGlmICh0eXBlb2YgY2ZnLkFERF9UQUdTID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIEVYVFJBX0VMRU1FTlRfSEFORExJTkcudGFnQ2hlY2sgPSBjZmcuQUREX1RBR1M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoQUxMT1dFRF9UQUdTID09PSBERUZBVUxUX0FMTE9XRURfVEFHUykge1xuICAgICAgICAgIEFMTE9XRURfVEFHUyA9IGNsb25lKEFMTE9XRURfVEFHUyk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9TZXQoQUxMT1dFRF9UQUdTLCBjZmcuQUREX1RBR1MsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNmZy5BRERfQVRUUikge1xuICAgICAgaWYgKHR5cGVvZiBjZmcuQUREX0FUVFIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgRVhUUkFfRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVDaGVjayA9IGNmZy5BRERfQVRUUjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChBTExPV0VEX0FUVFIgPT09IERFRkFVTFRfQUxMT1dFRF9BVFRSKSB7XG4gICAgICAgICAgQUxMT1dFRF9BVFRSID0gY2xvbmUoQUxMT1dFRF9BVFRSKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRUb1NldChBTExPV0VEX0FUVFIsIGNmZy5BRERfQVRUUiwgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2ZnLkFERF9VUklfU0FGRV9BVFRSKSB7XG4gICAgICBhZGRUb1NldChVUklfU0FGRV9BVFRSSUJVVEVTLCBjZmcuQUREX1VSSV9TQUZFX0FUVFIsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNmZy5GT1JCSURfQ09OVEVOVFMpIHtcbiAgICAgIGlmIChGT1JCSURfQ09OVEVOVFMgPT09IERFRkFVTFRfRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICAgIEZPUkJJRF9DT05URU5UUyA9IGNsb25lKEZPUkJJRF9DT05URU5UUyk7XG4gICAgICB9XG4gICAgICBhZGRUb1NldChGT1JCSURfQ09OVEVOVFMsIGNmZy5GT1JCSURfQ09OVEVOVFMsIHRyYW5zZm9ybUNhc2VGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNmZy5BRERfRk9SQklEX0NPTlRFTlRTKSB7XG4gICAgICBpZiAoRk9SQklEX0NPTlRFTlRTID09PSBERUZBVUxUX0ZPUkJJRF9DT05URU5UUykge1xuICAgICAgICBGT1JCSURfQ09OVEVOVFMgPSBjbG9uZShGT1JCSURfQ09OVEVOVFMpO1xuICAgICAgfVxuICAgICAgYWRkVG9TZXQoRk9SQklEX0NPTlRFTlRTLCBjZmcuQUREX0ZPUkJJRF9DT05URU5UUywgdHJhbnNmb3JtQ2FzZUZ1bmMpO1xuICAgIH1cbiAgICAvKiBBZGQgI3RleHQgaW4gY2FzZSBLRUVQX0NPTlRFTlQgaXMgc2V0IHRvIHRydWUgKi9cbiAgICBpZiAoS0VFUF9DT05URU5UKSB7XG4gICAgICBBTExPV0VEX1RBR1NbJyN0ZXh0J10gPSB0cnVlO1xuICAgIH1cbiAgICAvKiBBZGQgaHRtbCwgaGVhZCBhbmQgYm9keSB0byBBTExPV0VEX1RBR1MgaW4gY2FzZSBXSE9MRV9ET0NVTUVOVCBpcyB0cnVlICovXG4gICAgaWYgKFdIT0xFX0RPQ1VNRU5UKSB7XG4gICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIFsnaHRtbCcsICdoZWFkJywgJ2JvZHknXSk7XG4gICAgfVxuICAgIC8qIEFkZCB0Ym9keSB0byBBTExPV0VEX1RBR1MgaW4gY2FzZSB0YWJsZXMgYXJlIHBlcm1pdHRlZCwgc2VlICMyODYsICMzNjUgKi9cbiAgICBpZiAoQUxMT1dFRF9UQUdTLnRhYmxlKSB7XG4gICAgICBhZGRUb1NldChBTExPV0VEX1RBR1MsIFsndGJvZHknXSk7XG4gICAgICBkZWxldGUgRk9SQklEX1RBR1MudGJvZHk7XG4gICAgfVxuICAgIGlmIChjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1kpIHtcbiAgICAgIGlmICh0eXBlb2YgY2ZnLlRSVVNURURfVFlQRVNfUE9MSUNZLmNyZWF0ZUhUTUwgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdUUlVTVEVEX1RZUEVTX1BPTElDWSBjb25maWd1cmF0aW9uIG9wdGlvbiBtdXN0IHByb3ZpZGUgYSBcImNyZWF0ZUhUTUxcIiBob29rLicpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1kuY3JlYXRlU2NyaXB0VVJMICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnVFJVU1RFRF9UWVBFU19QT0xJQ1kgY29uZmlndXJhdGlvbiBvcHRpb24gbXVzdCBwcm92aWRlIGEgXCJjcmVhdGVTY3JpcHRVUkxcIiBob29rLicpO1xuICAgICAgfVxuICAgICAgLy8gT3ZlcndyaXRlIGV4aXN0aW5nIFRydXN0ZWRUeXBlcyBwb2xpY3kuXG4gICAgICB0cnVzdGVkVHlwZXNQb2xpY3kgPSBjZmcuVFJVU1RFRF9UWVBFU19QT0xJQ1k7XG4gICAgICAvLyBTaWduIGxvY2FsIHZhcmlhYmxlcyByZXF1aXJlZCBieSBgc2FuaXRpemVgLlxuICAgICAgZW1wdHlIVE1MID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVbmluaXRpYWxpemVkIHBvbGljeSwgYXR0ZW1wdCB0byBpbml0aWFsaXplIHRoZSBpbnRlcm5hbCBkb21wdXJpZnkgcG9saWN5LlxuICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRydXN0ZWRUeXBlc1BvbGljeSA9IF9jcmVhdGVUcnVzdGVkVHlwZXNQb2xpY3kodHJ1c3RlZFR5cGVzLCBjdXJyZW50U2NyaXB0KTtcbiAgICAgIH1cbiAgICAgIC8vIElmIGNyZWF0aW5nIHRoZSBpbnRlcm5hbCBwb2xpY3kgc3VjY2VlZGVkIHNpZ24gaW50ZXJuYWwgdmFyaWFibGVzLlxuICAgICAgaWYgKHRydXN0ZWRUeXBlc1BvbGljeSAhPT0gbnVsbCAmJiB0eXBlb2YgZW1wdHlIVE1MID09PSAnc3RyaW5nJykge1xuICAgICAgICBlbXB0eUhUTUwgPSB0cnVzdGVkVHlwZXNQb2xpY3kuY3JlYXRlSFRNTCgnJyk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFByZXZlbnQgZnVydGhlciBtYW5pcHVsYXRpb24gb2YgY29uZmlndXJhdGlvbi5cbiAgICAvLyBOb3QgYXZhaWxhYmxlIGluIElFOCwgU2FmYXJpIDUsIGV0Yy5cbiAgICBpZiAoZnJlZXplKSB7XG4gICAgICBmcmVlemUoY2ZnKTtcbiAgICB9XG4gICAgQ09ORklHID0gY2ZnO1xuICB9O1xuICAvKiBLZWVwIHRyYWNrIG9mIGFsbCBwb3NzaWJsZSBTVkcgYW5kIE1hdGhNTCB0YWdzXG4gICAqIHNvIHRoYXQgd2UgY2FuIHBlcmZvcm0gdGhlIG5hbWVzcGFjZSBjaGVja3NcbiAgICogY29ycmVjdGx5LiAqL1xuICBjb25zdCBBTExfU1ZHX1RBR1MgPSBhZGRUb1NldCh7fSwgWy4uLnN2ZyQxLCAuLi5zdmdGaWx0ZXJzLCAuLi5zdmdEaXNhbGxvd2VkXSk7XG4gIGNvbnN0IEFMTF9NQVRITUxfVEFHUyA9IGFkZFRvU2V0KHt9LCBbLi4ubWF0aE1sJDEsIC4uLm1hdGhNbERpc2FsbG93ZWRdKTtcbiAgLyoqXG4gICAqIEBwYXJhbSBlbGVtZW50IGEgRE9NIGVsZW1lbnQgd2hvc2UgbmFtZXNwYWNlIGlzIGJlaW5nIGNoZWNrZWRcbiAgICogQHJldHVybnMgUmV0dXJuIGZhbHNlIGlmIHRoZSBlbGVtZW50IGhhcyBhXG4gICAqICBuYW1lc3BhY2UgdGhhdCBhIHNwZWMtY29tcGxpYW50IHBhcnNlciB3b3VsZCBuZXZlclxuICAgKiAgcmV0dXJuLiBSZXR1cm4gdHJ1ZSBvdGhlcndpc2UuXG4gICAqL1xuICBjb25zdCBfY2hlY2tWYWxpZE5hbWVzcGFjZSA9IGZ1bmN0aW9uIF9jaGVja1ZhbGlkTmFtZXNwYWNlKGVsZW1lbnQpIHtcbiAgICBsZXQgcGFyZW50ID0gZ2V0UGFyZW50Tm9kZShlbGVtZW50KTtcbiAgICAvLyBJbiBKU0RPTSwgaWYgd2UncmUgaW5zaWRlIHNoYWRvdyBET00sIHRoZW4gcGFyZW50Tm9kZVxuICAgIC8vIGNhbiBiZSBudWxsLiBXZSBqdXN0IHNpbXVsYXRlIHBhcmVudCBpbiB0aGlzIGNhc2UuXG4gICAgaWYgKCFwYXJlbnQgfHwgIXBhcmVudC50YWdOYW1lKSB7XG4gICAgICBwYXJlbnQgPSB7XG4gICAgICAgIG5hbWVzcGFjZVVSSTogTkFNRVNQQUNFLFxuICAgICAgICB0YWdOYW1lOiAndGVtcGxhdGUnXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCB0YWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UoZWxlbWVudC50YWdOYW1lKTtcbiAgICBjb25zdCBwYXJlbnRUYWdOYW1lID0gc3RyaW5nVG9Mb3dlckNhc2UocGFyZW50LnRhZ05hbWUpO1xuICAgIGlmICghQUxMT1dFRF9OQU1FU1BBQ0VTW2VsZW1lbnQubmFtZXNwYWNlVVJJXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudC5uYW1lc3BhY2VVUkkgPT09IFNWR19OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFRoZSBvbmx5IHdheSB0byBzd2l0Y2ggZnJvbSBIVE1MIG5hbWVzcGFjZSB0byBTVkdcbiAgICAgIC8vIGlzIHZpYSA8c3ZnPi4gSWYgaXQgaGFwcGVucyB2aWEgYW55IG90aGVyIHRhZywgdGhlblxuICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ3N2Zyc7XG4gICAgICB9XG4gICAgICAvLyBUaGUgb25seSB3YXkgdG8gc3dpdGNoIGZyb20gTWF0aE1MIHRvIFNWRyBpcyB2aWFgXG4gICAgICAvLyBzdmcgaWYgcGFyZW50IGlzIGVpdGhlciA8YW5ub3RhdGlvbi14bWw+IG9yIE1hdGhNTFxuICAgICAgLy8gdGV4dCBpbnRlZ3JhdGlvbiBwb2ludHMuXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ3N2ZycgJiYgKHBhcmVudFRhZ05hbWUgPT09ICdhbm5vdGF0aW9uLXhtbCcgfHwgTUFUSE1MX1RFWFRfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIG9ubHkgYWxsb3cgZWxlbWVudHMgdGhhdCBhcmUgZGVmaW5lZCBpbiBTVkdcbiAgICAgIC8vIHNwZWMuIEFsbCBvdGhlcnMgYXJlIGRpc2FsbG93ZWQgaW4gU1ZHIG5hbWVzcGFjZS5cbiAgICAgIHJldHVybiBCb29sZWFuKEFMTF9TVkdfVEFHU1t0YWdOYW1lXSk7XG4gICAgfVxuICAgIGlmIChlbGVtZW50Lm5hbWVzcGFjZVVSSSA9PT0gTUFUSE1MX05BTUVTUEFDRSkge1xuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIEhUTUwgbmFtZXNwYWNlIHRvIE1hdGhNTFxuICAgICAgLy8gaXMgdmlhIDxtYXRoPi4gSWYgaXQgaGFwcGVucyB2aWEgYW55IG90aGVyIHRhZywgdGhlblxuICAgICAgLy8gaXQgc2hvdWxkIGJlIGtpbGxlZC5cbiAgICAgIGlmIChwYXJlbnQubmFtZXNwYWNlVVJJID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ21hdGgnO1xuICAgICAgfVxuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIFNWRyB0byBNYXRoTUwgaXMgdmlhXG4gICAgICAvLyA8bWF0aD4gYW5kIEhUTUwgaW50ZWdyYXRpb24gcG9pbnRzXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSkge1xuICAgICAgICByZXR1cm4gdGFnTmFtZSA9PT0gJ21hdGgnICYmIEhUTUxfSU5URUdSQVRJT05fUE9JTlRTW3BhcmVudFRhZ05hbWVdO1xuICAgICAgfVxuICAgICAgLy8gV2Ugb25seSBhbGxvdyBlbGVtZW50cyB0aGF0IGFyZSBkZWZpbmVkIGluIE1hdGhNTFxuICAgICAgLy8gc3BlYy4gQWxsIG90aGVycyBhcmUgZGlzYWxsb3dlZCBpbiBNYXRoTUwgbmFtZXNwYWNlLlxuICAgICAgcmV0dXJuIEJvb2xlYW4oQUxMX01BVEhNTF9UQUdTW3RhZ05hbWVdKTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQubmFtZXNwYWNlVVJJID09PSBIVE1MX05BTUVTUEFDRSkge1xuICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIHN3aXRjaCBmcm9tIFNWRyB0byBIVE1MIGlzIHZpYVxuICAgICAgLy8gSFRNTCBpbnRlZ3JhdGlvbiBwb2ludHMsIGFuZCBmcm9tIE1hdGhNTCB0byBIVE1MXG4gICAgICAvLyBpcyB2aWEgTWF0aE1MIHRleHQgaW50ZWdyYXRpb24gcG9pbnRzXG4gICAgICBpZiAocGFyZW50Lm5hbWVzcGFjZVVSSSA9PT0gU1ZHX05BTUVTUEFDRSAmJiAhSFRNTF9JTlRFR1JBVElPTl9QT0lOVFNbcGFyZW50VGFnTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHBhcmVudC5uYW1lc3BhY2VVUkkgPT09IE1BVEhNTF9OQU1FU1BBQ0UgJiYgIU1BVEhNTF9URVhUX0lOVEVHUkFUSU9OX1BPSU5UU1twYXJlbnRUYWdOYW1lXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBXZSBkaXNhbGxvdyB0YWdzIHRoYXQgYXJlIHNwZWNpZmljIGZvciBNYXRoTUxcbiAgICAgIC8vIG9yIFNWRyBhbmQgc2hvdWxkIG5ldmVyIGFwcGVhciBpbiBIVE1MIG5hbWVzcGFjZVxuICAgICAgcmV0dXJuICFBTExfTUFUSE1MX1RBR1NbdGFnTmFtZV0gJiYgKENPTU1PTl9TVkdfQU5EX0hUTUxfRUxFTUVOVFNbdGFnTmFtZV0gfHwgIUFMTF9TVkdfVEFHU1t0YWdOYW1lXSk7XG4gICAgfVxuICAgIC8vIEZvciBYSFRNTCBhbmQgWE1MIGRvY3VtZW50cyB0aGF0IHN1cHBvcnQgY3VzdG9tIG5hbWVzcGFjZXNcbiAgICBpZiAoUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnICYmIEFMTE9XRURfTkFNRVNQQUNFU1tlbGVtZW50Lm5hbWVzcGFjZVVSSV0pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBUaGUgY29kZSBzaG91bGQgbmV2ZXIgcmVhY2ggdGhpcyBwbGFjZSAodGhpcyBtZWFuc1xuICAgIC8vIHRoYXQgdGhlIGVsZW1lbnQgc29tZWhvdyBnb3QgbmFtZXNwYWNlIHRoYXQgaXMgbm90XG4gICAgLy8gSFRNTCwgU1ZHLCBNYXRoTUwgb3IgYWxsb3dlZCB2aWEgQUxMT1dFRF9OQU1FU1BBQ0VTKS5cbiAgICAvLyBSZXR1cm4gZmFsc2UganVzdCBpbiBjYXNlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIF9mb3JjZVJlbW92ZVxuICAgKlxuICAgKiBAcGFyYW0gbm9kZSBhIERPTSBub2RlXG4gICAqL1xuICBjb25zdCBfZm9yY2VSZW1vdmUgPSBmdW5jdGlvbiBfZm9yY2VSZW1vdmUobm9kZSkge1xuICAgIGFycmF5UHVzaChET01QdXJpZnkucmVtb3ZlZCwge1xuICAgICAgZWxlbWVudDogbm9kZVxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtcmVtb3ZlXG4gICAgICBnZXRQYXJlbnROb2RlKG5vZGUpLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIHJlbW92ZShub2RlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBfcmVtb3ZlQXR0cmlidXRlXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIGFuIEF0dHJpYnV0ZSBuYW1lXG4gICAqIEBwYXJhbSBlbGVtZW50IGEgRE9NIG5vZGVcbiAgICovXG4gIGNvbnN0IF9yZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbiBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGVsZW1lbnQpIHtcbiAgICB0cnkge1xuICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogZWxlbWVudC5nZXRBdHRyaWJ1dGVOb2RlKG5hbWUpLFxuICAgICAgICBmcm9tOiBlbGVtZW50XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICBhcnJheVB1c2goRE9NUHVyaWZ5LnJlbW92ZWQsIHtcbiAgICAgICAgYXR0cmlidXRlOiBudWxsLFxuICAgICAgICBmcm9tOiBlbGVtZW50XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgLy8gV2Ugdm9pZCBhdHRyaWJ1dGUgdmFsdWVzIGZvciB1bnJlbW92YWJsZSBcImlzXCIgYXR0cmlidXRlc1xuICAgIGlmIChuYW1lID09PSAnaXMnKSB7XG4gICAgICBpZiAoUkVUVVJOX0RPTSB8fCBSRVRVUk5fRE9NX0ZSQUdNRU5UKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgX2ZvcmNlUmVtb3ZlKGVsZW1lbnQpO1xuICAgICAgICB9IGNhdGNoIChfKSB7fVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCAnJyk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogX2luaXREb2N1bWVudFxuICAgKlxuICAgKiBAcGFyYW0gZGlydHkgLSBhIHN0cmluZyBvZiBkaXJ0eSBtYXJrdXBcbiAgICogQHJldHVybiBhIERPTSwgZmlsbGVkIHdpdGggdGhlIGRpcnR5IG1hcmt1cFxuICAgKi9cbiAgY29uc3QgX2luaXREb2N1bWVudCA9IGZ1bmN0aW9uIF9pbml0RG9jdW1lbnQoZGlydHkpIHtcbiAgICAvKiBDcmVhdGUgYSBIVE1MIGRvY3VtZW50ICovXG4gICAgbGV0IGRvYyA9IG51bGw7XG4gICAgbGV0IGxlYWRpbmdXaGl0ZXNwYWNlID0gbnVsbDtcbiAgICBpZiAoRk9SQ0VfQk9EWSkge1xuICAgICAgZGlydHkgPSAnPHJlbW92ZT48L3JlbW92ZT4nICsgZGlydHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIElmIEZPUkNFX0JPRFkgaXNuJ3QgdXNlZCwgbGVhZGluZyB3aGl0ZXNwYWNlIG5lZWRzIHRvIGJlIHByZXNlcnZlZCBtYW51YWxseSAqL1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHN0cmluZ01hdGNoKGRpcnR5LCAvXltcXHJcXG5cXHQgXSsvKTtcbiAgICAgIGxlYWRpbmdXaGl0ZXNwYWNlID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzBdO1xuICAgIH1cbiAgICBpZiAoUEFSU0VSX01FRElBX1RZUEUgPT09ICdhcHBsaWNhdGlvbi94aHRtbCt4bWwnICYmIE5BTUVTUEFDRSA9PT0gSFRNTF9OQU1FU1BBQ0UpIHtcbiAgICAgIC8vIFJvb3Qgb2YgWEhUTUwgZG9jIG11c3QgY29udGFpbiB4bWxucyBkZWNsYXJhdGlvbiAoc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvbm9ybWF0aXZlLmh0bWwjc3RyaWN0KVxuICAgICAgZGlydHkgPSAnPGh0bWwgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCI+PGhlYWQ+PC9oZWFkPjxib2R5PicgKyBkaXJ0eSArICc8L2JvZHk+PC9odG1sPic7XG4gICAgfVxuICAgIGNvbnN0IGRpcnR5UGF5bG9hZCA9IHRydXN0ZWRUeXBlc1BvbGljeSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKGRpcnR5KSA6IGRpcnR5O1xuICAgIC8qXG4gICAgICogVXNlIHRoZSBET01QYXJzZXIgQVBJIGJ5IGRlZmF1bHQsIGZhbGxiYWNrIGxhdGVyIGlmIG5lZWRzIGJlXG4gICAgICogRE9NUGFyc2VyIG5vdCB3b3JrIGZvciBzdmcgd2hlbiBoYXMgbXVsdGlwbGUgcm9vdCBlbGVtZW50LlxuICAgICAqL1xuICAgIGlmIChOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICB0cnkge1xuICAgICAgICBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGRpcnR5UGF5bG9hZCwgUEFSU0VSX01FRElBX1RZUEUpO1xuICAgICAgfSBjYXRjaCAoXykge31cbiAgICB9XG4gICAgLyogVXNlIGNyZWF0ZUhUTUxEb2N1bWVudCBpbiBjYXNlIERPTVBhcnNlciBpcyBub3QgYXZhaWxhYmxlICovXG4gICAgaWYgKCFkb2MgfHwgIWRvYy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgIGRvYyA9IGltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KE5BTUVTUEFDRSwgJ3RlbXBsYXRlJywgbnVsbCk7XG4gICAgICB0cnkge1xuICAgICAgICBkb2MuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTCA9IElTX0VNUFRZX0lOUFVUID8gZW1wdHlIVE1MIDogZGlydHlQYXlsb2FkO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvLyBTeW50YXggZXJyb3IgaWYgZGlydHlQYXlsb2FkIGlzIGludmFsaWQgeG1sXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGJvZHkgPSBkb2MuYm9keSB8fCBkb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgIGlmIChkaXJ0eSAmJiBsZWFkaW5nV2hpdGVzcGFjZSkge1xuICAgICAgYm9keS5pbnNlcnRCZWZvcmUoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobGVhZGluZ1doaXRlc3BhY2UpLCBib2R5LmNoaWxkTm9kZXNbMF0gfHwgbnVsbCk7XG4gICAgfVxuICAgIC8qIFdvcmsgb24gd2hvbGUgZG9jdW1lbnQgb3IganVzdCBpdHMgYm9keSAqL1xuICAgIGlmIChOQU1FU1BBQ0UgPT09IEhUTUxfTkFNRVNQQUNFKSB7XG4gICAgICByZXR1cm4gZ2V0RWxlbWVudHNCeVRhZ05hbWUuY2FsbChkb2MsIFdIT0xFX0RPQ1VNRU5UID8gJ2h0bWwnIDogJ2JvZHknKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIFdIT0xFX0RPQ1VNRU5UID8gZG9jLmRvY3VtZW50RWxlbWVudCA6IGJvZHk7XG4gIH07XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgTm9kZUl0ZXJhdG9yIG9iamVjdCB0aGF0IHlvdSBjYW4gdXNlIHRvIHRyYXZlcnNlIGZpbHRlcmVkIGxpc3RzIG9mIG5vZGVzIG9yIGVsZW1lbnRzIGluIGEgZG9jdW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSByb290IFRoZSByb290IGVsZW1lbnQgb3Igbm9kZSB0byBzdGFydCB0cmF2ZXJzaW5nIG9uLlxuICAgKiBAcmV0dXJuIFRoZSBjcmVhdGVkIE5vZGVJdGVyYXRvclxuICAgKi9cbiAgY29uc3QgX2NyZWF0ZU5vZGVJdGVyYXRvciA9IGZ1bmN0aW9uIF9jcmVhdGVOb2RlSXRlcmF0b3Iocm9vdCkge1xuICAgIHJldHVybiBjcmVhdGVOb2RlSXRlcmF0b3IuY2FsbChyb290Lm93bmVyRG9jdW1lbnQgfHwgcm9vdCwgcm9vdCxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZVxuICAgIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5UIHwgTm9kZUZpbHRlci5TSE9XX0NPTU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfVEVYVCB8IE5vZGVGaWx0ZXIuU0hPV19QUk9DRVNTSU5HX0lOU1RSVUNUSU9OIHwgTm9kZUZpbHRlci5TSE9XX0NEQVRBX1NFQ1RJT04sIG51bGwpO1xuICB9O1xuICAvKipcbiAgICogX2lzQ2xvYmJlcmVkXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgdG8gY2hlY2sgZm9yIGNsb2JiZXJpbmcgYXR0YWNrc1xuICAgKiBAcmV0dXJuIHRydWUgaWYgY2xvYmJlcmVkLCBmYWxzZSBpZiBzYWZlXG4gICAqL1xuICBjb25zdCBfaXNDbG9iYmVyZWQgPSBmdW5jdGlvbiBfaXNDbG9iYmVyZWQoZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50ICYmICh0eXBlb2YgZWxlbWVudC5ub2RlTmFtZSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQudGV4dENvbnRlbnQgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlbGVtZW50LnJlbW92ZUNoaWxkICE9PSAnZnVuY3Rpb24nIHx8ICEoZWxlbWVudC5hdHRyaWJ1dGVzIGluc3RhbmNlb2YgTmFtZWROb2RlTWFwKSB8fCB0eXBlb2YgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIGVsZW1lbnQuc2V0QXR0cmlidXRlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50Lm5hbWVzcGFjZVVSSSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVsZW1lbnQuaW5zZXJ0QmVmb3JlICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBlbGVtZW50Lmhhc0NoaWxkTm9kZXMgIT09ICdmdW5jdGlvbicpO1xuICB9O1xuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIERPTSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgb2JqZWN0IHRvIGNoZWNrIHdoZXRoZXIgaXQncyBhIERPTSBub2RlXG4gICAqIEByZXR1cm4gdHJ1ZSBpcyBvYmplY3QgaXMgYSBET00gbm9kZVxuICAgKi9cbiAgY29uc3QgX2lzTm9kZSA9IGZ1bmN0aW9uIF9pc05vZGUodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIE5vZGUgPT09ICdmdW5jdGlvbicgJiYgdmFsdWUgaW5zdGFuY2VvZiBOb2RlO1xuICB9O1xuICBmdW5jdGlvbiBfZXhlY3V0ZUhvb2tzKGhvb2tzLCBjdXJyZW50Tm9kZSwgZGF0YSkge1xuICAgIGFycmF5Rm9yRWFjaChob29rcywgaG9vayA9PiB7XG4gICAgICBob29rLmNhbGwoRE9NUHVyaWZ5LCBjdXJyZW50Tm9kZSwgZGF0YSwgQ09ORklHKTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogX3Nhbml0aXplRWxlbWVudHNcbiAgICpcbiAgICogQHByb3RlY3Qgbm9kZU5hbWVcbiAgICogQHByb3RlY3QgdGV4dENvbnRlbnRcbiAgICogQHByb3RlY3QgcmVtb3ZlQ2hpbGRcbiAgICogQHBhcmFtIGN1cnJlbnROb2RlIHRvIGNoZWNrIGZvciBwZXJtaXNzaW9uIHRvIGV4aXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiBub2RlIHdhcyBraWxsZWQsIGZhbHNlIGlmIGxlZnQgYWxpdmVcbiAgICovXG4gIGNvbnN0IF9zYW5pdGl6ZUVsZW1lbnRzID0gZnVuY3Rpb24gX3Nhbml0aXplRWxlbWVudHMoY3VycmVudE5vZGUpIHtcbiAgICBsZXQgY29udGVudCA9IG51bGw7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVFbGVtZW50cywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIC8qIENoZWNrIGlmIGVsZW1lbnQgaXMgY2xvYmJlcmVkIG9yIGNhbiBjbG9iYmVyICovXG4gICAgaWYgKF9pc0Nsb2JiZXJlZChjdXJyZW50Tm9kZSkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogTm93IGxldCdzIGNoZWNrIHRoZSBlbGVtZW50J3MgdHlwZSBhbmQgbmFtZSAqL1xuICAgIGNvbnN0IHRhZ05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhjdXJyZW50Tm9kZS5ub2RlTmFtZSk7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MudXBvblNhbml0aXplRWxlbWVudCwgY3VycmVudE5vZGUsIHtcbiAgICAgIHRhZ05hbWUsXG4gICAgICBhbGxvd2VkVGFnczogQUxMT1dFRF9UQUdTXG4gICAgfSk7XG4gICAgLyogRGV0ZWN0IG1YU1MgYXR0ZW1wdHMgYWJ1c2luZyBuYW1lc3BhY2UgY29uZnVzaW9uICovXG4gICAgaWYgKFNBRkVfRk9SX1hNTCAmJiBjdXJyZW50Tm9kZS5oYXNDaGlsZE5vZGVzKCkgJiYgIV9pc05vZGUoY3VycmVudE5vZGUuZmlyc3RFbGVtZW50Q2hpbGQpICYmIHJlZ0V4cFRlc3QoLzxbL1xcdyFdL2csIGN1cnJlbnROb2RlLmlubmVySFRNTCkgJiYgcmVnRXhwVGVzdCgvPFsvXFx3IV0vZywgY3VycmVudE5vZGUudGV4dENvbnRlbnQpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFJlbW92ZSBhbnkgb2NjdXJyZW5jZSBvZiBwcm9jZXNzaW5nIGluc3RydWN0aW9ucyAqL1xuICAgIGlmIChjdXJyZW50Tm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLnByb2dyZXNzaW5nSW5zdHJ1Y3Rpb24pIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogUmVtb3ZlIGFueSBraW5kIG9mIHBvc3NpYmx5IGhhcm1mdWwgY29tbWVudHMgKi9cbiAgICBpZiAoU0FGRV9GT1JfWE1MICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUuY29tbWVudCAmJiByZWdFeHBUZXN0KC88Wy9cXHddL2csIGN1cnJlbnROb2RlLmRhdGEpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIFJlbW92ZSBlbGVtZW50IGlmIGFueXRoaW5nIGZvcmJpZHMgaXRzIHByZXNlbmNlICovXG4gICAgaWYgKCEoRVhUUkFfRUxFTUVOVF9IQU5ETElORy50YWdDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIEVYVFJBX0VMRU1FTlRfSEFORExJTkcudGFnQ2hlY2sodGFnTmFtZSkpICYmICghQUxMT1dFRF9UQUdTW3RhZ05hbWVdIHx8IEZPUkJJRF9UQUdTW3RhZ05hbWVdKSkge1xuICAgICAgLyogQ2hlY2sgaWYgd2UgaGF2ZSBhIGN1c3RvbSBlbGVtZW50IHRvIGhhbmRsZSAqL1xuICAgICAgaWYgKCFGT1JCSURfVEFHU1t0YWdOYW1lXSAmJiBfaXNCYXNpY0N1c3RvbUVsZW1lbnQodGFnTmFtZSkpIHtcbiAgICAgICAgaWYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIFJlZ0V4cCAmJiByZWdFeHBUZXN0KENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjaywgdGFnTmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVjayh0YWdOYW1lKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLyogS2VlcCBjb250ZW50IGV4Y2VwdCBmb3IgYmFkLWxpc3RlZCBlbGVtZW50cyAqL1xuICAgICAgaWYgKEtFRVBfQ09OVEVOVCAmJiAhRk9SQklEX0NPTlRFTlRTW3RhZ05hbWVdKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnROb2RlKGN1cnJlbnROb2RlKSB8fCBjdXJyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICBjb25zdCBjaGlsZE5vZGVzID0gZ2V0Q2hpbGROb2RlcyhjdXJyZW50Tm9kZSkgfHwgY3VycmVudE5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgaWYgKGNoaWxkTm9kZXMgJiYgcGFyZW50Tm9kZSkge1xuICAgICAgICAgIGNvbnN0IGNoaWxkQ291bnQgPSBjaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgICBmb3IgKGxldCBpID0gY2hpbGRDb3VudCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZENsb25lID0gY2xvbmVOb2RlKGNoaWxkTm9kZXNbaV0sIHRydWUpO1xuICAgICAgICAgICAgY2hpbGRDbG9uZS5fX3JlbW92YWxDb3VudCA9IChjdXJyZW50Tm9kZS5fX3JlbW92YWxDb3VudCB8fCAwKSArIDE7XG4gICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShjaGlsZENsb25lLCBnZXROZXh0U2libGluZyhjdXJyZW50Tm9kZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKiBDaGVjayB3aGV0aGVyIGVsZW1lbnQgaGFzIGEgdmFsaWQgbmFtZXNwYWNlICovXG4gICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCAmJiAhX2NoZWNrVmFsaWROYW1lc3BhY2UoY3VycmVudE5vZGUpKSB7XG4gICAgICBfZm9yY2VSZW1vdmUoY3VycmVudE5vZGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qIE1ha2Ugc3VyZSB0aGF0IG9sZGVyIGJyb3dzZXJzIGRvbid0IGdldCBmYWxsYmFjay10YWcgbVhTUyAqL1xuICAgIGlmICgodGFnTmFtZSA9PT0gJ25vc2NyaXB0JyB8fCB0YWdOYW1lID09PSAnbm9lbWJlZCcgfHwgdGFnTmFtZSA9PT0gJ25vZnJhbWVzJykgJiYgcmVnRXhwVGVzdCgvPFxcL25vKHNjcmlwdHxlbWJlZHxmcmFtZXMpL2ksIGN1cnJlbnROb2RlLmlubmVySFRNTCkpIHtcbiAgICAgIF9mb3JjZVJlbW92ZShjdXJyZW50Tm9kZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyogU2FuaXRpemUgZWxlbWVudCBjb250ZW50IHRvIGJlIHRlbXBsYXRlLXNhZmUgKi9cbiAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTICYmIGN1cnJlbnROb2RlLm5vZGVUeXBlID09PSBOT0RFX1RZUEUudGV4dCkge1xuICAgICAgLyogR2V0IHRoZSBlbGVtZW50J3MgdGV4dCBjb250ZW50ICovXG4gICAgICBjb250ZW50ID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICBjb250ZW50ID0gc3RyaW5nUmVwbGFjZShjb250ZW50LCBleHByLCAnICcpO1xuICAgICAgfSk7XG4gICAgICBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQgIT09IGNvbnRlbnQpIHtcbiAgICAgICAgYXJyYXlQdXNoKERPTVB1cmlmeS5yZW1vdmVkLCB7XG4gICAgICAgICAgZWxlbWVudDogY3VycmVudE5vZGUuY2xvbmVOb2RlKClcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnROb2RlLnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYWZ0ZXJTYW5pdGl6ZUVsZW1lbnRzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICAvKipcbiAgICogX2lzVmFsaWRBdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIGxjVGFnIExvd2VyY2FzZSB0YWcgbmFtZSBvZiBjb250YWluaW5nIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBsY05hbWUgTG93ZXJjYXNlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKiBAcGFyYW0gdmFsdWUgQXR0cmlidXRlIHZhbHVlLlxuICAgKiBAcmV0dXJuIFJldHVybnMgdHJ1ZSBpZiBgdmFsdWVgIGlzIHZhbGlkLCBvdGhlcndpc2UgZmFsc2UuXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuICBjb25zdCBfaXNWYWxpZEF0dHJpYnV0ZSA9IGZ1bmN0aW9uIF9pc1ZhbGlkQXR0cmlidXRlKGxjVGFnLCBsY05hbWUsIHZhbHVlKSB7XG4gICAgLyogTWFrZSBzdXJlIGF0dHJpYnV0ZSBjYW5ub3QgY2xvYmJlciAqL1xuICAgIGlmIChTQU5JVElaRV9ET00gJiYgKGxjTmFtZSA9PT0gJ2lkJyB8fCBsY05hbWUgPT09ICduYW1lJykgJiYgKHZhbHVlIGluIGRvY3VtZW50IHx8IHZhbHVlIGluIGZvcm1FbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKiBBbGxvdyB2YWxpZCBkYXRhLSogYXR0cmlidXRlczogQXQgbGVhc3Qgb25lIGNoYXJhY3RlciBhZnRlciBcIi1cIlxuICAgICAgICAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZG9tLmh0bWwjZW1iZWRkaW5nLWN1c3RvbS1ub24tdmlzaWJsZS1kYXRhLXdpdGgtdGhlLWRhdGEtKi1hdHRyaWJ1dGVzKVxuICAgICAgICBYTUwtY29tcGF0aWJsZSAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvaW5mcmFzdHJ1Y3R1cmUuaHRtbCN4bWwtY29tcGF0aWJsZSBhbmQgaHR0cDovL3d3dy53My5vcmcvVFIveG1sLyNkMGU4MDQpXG4gICAgICAgIFdlIGRvbid0IG5lZWQgdG8gY2hlY2sgdGhlIHZhbHVlOyBpdCdzIGFsd2F5cyBVUkkgc2FmZS4gKi9cbiAgICBpZiAoQUxMT1dfREFUQV9BVFRSICYmICFGT1JCSURfQVRUUltsY05hbWVdICYmIHJlZ0V4cFRlc3QoREFUQV9BVFRSLCBsY05hbWUpKSA7IGVsc2UgaWYgKEFMTE9XX0FSSUFfQVRUUiAmJiByZWdFeHBUZXN0KEFSSUFfQVRUUiwgbGNOYW1lKSkgOyBlbHNlIGlmIChFWFRSQV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgRVhUUkFfRUxFTUVOVF9IQU5ETElORy5hdHRyaWJ1dGVDaGVjayhsY05hbWUsIGxjVGFnKSkgOyBlbHNlIGlmICghQUxMT1dFRF9BVFRSW2xjTmFtZV0gfHwgRk9SQklEX0FUVFJbbGNOYW1lXSkge1xuICAgICAgaWYgKFxuICAgICAgLy8gRmlyc3QgY29uZGl0aW9uIGRvZXMgYSB2ZXJ5IGJhc2ljIGNoZWNrIGlmIGEpIGl0J3MgYmFzaWNhbGx5IGEgdmFsaWQgY3VzdG9tIGVsZW1lbnQgdGFnbmFtZSBBTkRcbiAgICAgIC8vIGIpIGlmIHRoZSB0YWdOYW1lIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrXG4gICAgICAvLyBhbmQgYykgaWYgdGhlIGF0dHJpYnV0ZSBuYW1lIHBhc3NlcyB3aGF0ZXZlciB0aGUgdXNlciBoYXMgY29uZmlndXJlZCBmb3IgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrXG4gICAgICBfaXNCYXNpY0N1c3RvbUVsZW1lbnQobGNUYWcpICYmIChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBSZWdFeHAgJiYgcmVnRXhwVGVzdChDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2ssIGxjVGFnKSB8fCBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sgaW5zdGFuY2VvZiBGdW5jdGlvbiAmJiBDVVNUT01fRUxFTUVOVF9IQU5ETElORy50YWdOYW1lQ2hlY2sobGNUYWcpKSAmJiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcuYXR0cmlidXRlTmFtZUNoZWNrLCBsY05hbWUpIHx8IENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayBpbnN0YW5jZW9mIEZ1bmN0aW9uICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmF0dHJpYnV0ZU5hbWVDaGVjayhsY05hbWUsIGxjVGFnKSkgfHxcbiAgICAgIC8vIEFsdGVybmF0aXZlLCBzZWNvbmQgY29uZGl0aW9uIGNoZWNrcyBpZiBpdCdzIGFuIGBpc2AtYXR0cmlidXRlLCBBTkRcbiAgICAgIC8vIHRoZSB2YWx1ZSBwYXNzZXMgd2hhdGV2ZXIgdGhlIHVzZXIgaGFzIGNvbmZpZ3VyZWQgZm9yIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLnRhZ05hbWVDaGVja1xuICAgICAgbGNOYW1lID09PSAnaXMnICYmIENVU1RPTV9FTEVNRU5UX0hBTkRMSU5HLmFsbG93Q3VzdG9taXplZEJ1aWx0SW5FbGVtZW50cyAmJiAoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgUmVnRXhwICYmIHJlZ0V4cFRlc3QoQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrLCB2YWx1ZSkgfHwgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gJiYgQ1VTVE9NX0VMRU1FTlRfSEFORExJTkcudGFnTmFtZUNoZWNrKHZhbHVlKSkpIDsgZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8qIENoZWNrIHZhbHVlIGlzIHNhZmUuIEZpcnN0LCBpcyBhdHRyIGluZXJ0PyBJZiBzbywgaXMgc2FmZSAqL1xuICAgIH0gZWxzZSBpZiAoVVJJX1NBRkVfQVRUUklCVVRFU1tsY05hbWVdKSA7IGVsc2UgaWYgKHJlZ0V4cFRlc3QoSVNfQUxMT1dFRF9VUkkkMSwgc3RyaW5nUmVwbGFjZSh2YWx1ZSwgQVRUUl9XSElURVNQQUNFLCAnJykpKSA7IGVsc2UgaWYgKChsY05hbWUgPT09ICdzcmMnIHx8IGxjTmFtZSA9PT0gJ3hsaW5rOmhyZWYnIHx8IGxjTmFtZSA9PT0gJ2hyZWYnKSAmJiBsY1RhZyAhPT0gJ3NjcmlwdCcgJiYgc3RyaW5nSW5kZXhPZih2YWx1ZSwgJ2RhdGE6JykgPT09IDAgJiYgREFUQV9VUklfVEFHU1tsY1RhZ10pIDsgZWxzZSBpZiAoQUxMT1dfVU5LTk9XTl9QUk9UT0NPTFMgJiYgIXJlZ0V4cFRlc3QoSVNfU0NSSVBUX09SX0RBVEEsIHN0cmluZ1JlcGxhY2UodmFsdWUsIEFUVFJfV0hJVEVTUEFDRSwgJycpKSkgOyBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSA7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIC8qKlxuICAgKiBfaXNCYXNpY0N1c3RvbUVsZW1lbnRcbiAgICogY2hlY2tzIGlmIGF0IGxlYXN0IG9uZSBkYXNoIGlzIGluY2x1ZGVkIGluIHRhZ05hbWUsIGFuZCBpdCdzIG5vdCB0aGUgZmlyc3QgY2hhclxuICAgKiBmb3IgbW9yZSBzb3BoaXN0aWNhdGVkIGNoZWNraW5nIHNlZSBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3ZhbGlkYXRlLWVsZW1lbnQtbmFtZVxuICAgKlxuICAgKiBAcGFyYW0gdGFnTmFtZSBuYW1lIG9mIHRoZSB0YWcgb2YgdGhlIG5vZGUgdG8gc2FuaXRpemVcbiAgICogQHJldHVybnMgUmV0dXJucyB0cnVlIGlmIHRoZSB0YWcgbmFtZSBtZWV0cyB0aGUgYmFzaWMgY3JpdGVyaWEgZm9yIGEgY3VzdG9tIGVsZW1lbnQsIG90aGVyd2lzZSBmYWxzZS5cbiAgICovXG4gIGNvbnN0IF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCA9IGZ1bmN0aW9uIF9pc0Jhc2ljQ3VzdG9tRWxlbWVudCh0YWdOYW1lKSB7XG4gICAgcmV0dXJuIHRhZ05hbWUgIT09ICdhbm5vdGF0aW9uLXhtbCcgJiYgc3RyaW5nTWF0Y2godGFnTmFtZSwgQ1VTVE9NX0VMRU1FTlQpO1xuICB9O1xuICAvKipcbiAgICogX3Nhbml0aXplQXR0cmlidXRlc1xuICAgKlxuICAgKiBAcHJvdGVjdCBhdHRyaWJ1dGVzXG4gICAqIEBwcm90ZWN0IG5vZGVOYW1lXG4gICAqIEBwcm90ZWN0IHJlbW92ZUF0dHJpYnV0ZVxuICAgKiBAcHJvdGVjdCBzZXRBdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIGN1cnJlbnROb2RlIHRvIHNhbml0aXplXG4gICAqL1xuICBjb25zdCBfc2FuaXRpemVBdHRyaWJ1dGVzID0gZnVuY3Rpb24gX3Nhbml0aXplQXR0cmlidXRlcyhjdXJyZW50Tm9kZSkge1xuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmJlZm9yZVNhbml0aXplQXR0cmlidXRlcywgY3VycmVudE5vZGUsIG51bGwpO1xuICAgIGNvbnN0IHtcbiAgICAgIGF0dHJpYnV0ZXNcbiAgICB9ID0gY3VycmVudE5vZGU7XG4gICAgLyogQ2hlY2sgaWYgd2UgaGF2ZSBhdHRyaWJ1dGVzOyBpZiBub3Qgd2UgbWlnaHQgaGF2ZSBhIHRleHQgbm9kZSAqL1xuICAgIGlmICghYXR0cmlidXRlcyB8fCBfaXNDbG9iYmVyZWQoY3VycmVudE5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGhvb2tFdmVudCA9IHtcbiAgICAgIGF0dHJOYW1lOiAnJyxcbiAgICAgIGF0dHJWYWx1ZTogJycsXG4gICAgICBrZWVwQXR0cjogdHJ1ZSxcbiAgICAgIGFsbG93ZWRBdHRyaWJ1dGVzOiBBTExPV0VEX0FUVFIsXG4gICAgICBmb3JjZUtlZXBBdHRyOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIGxldCBsID0gYXR0cmlidXRlcy5sZW5ndGg7XG4gICAgLyogR28gYmFja3dhcmRzIG92ZXIgYWxsIGF0dHJpYnV0ZXM7IHNhZmVseSByZW1vdmUgYmFkIG9uZXMgKi9cbiAgICB3aGlsZSAobC0tKSB7XG4gICAgICBjb25zdCBhdHRyID0gYXR0cmlidXRlc1tsXTtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgbmFtZXNwYWNlVVJJLFxuICAgICAgICB2YWx1ZTogYXR0clZhbHVlXG4gICAgICB9ID0gYXR0cjtcbiAgICAgIGNvbnN0IGxjTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKG5hbWUpO1xuICAgICAgY29uc3QgaW5pdFZhbHVlID0gYXR0clZhbHVlO1xuICAgICAgbGV0IHZhbHVlID0gbmFtZSA9PT0gJ3ZhbHVlJyA/IGluaXRWYWx1ZSA6IHN0cmluZ1RyaW0oaW5pdFZhbHVlKTtcbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIGhvb2tFdmVudC5hdHRyTmFtZSA9IGxjTmFtZTtcbiAgICAgIGhvb2tFdmVudC5hdHRyVmFsdWUgPSB2YWx1ZTtcbiAgICAgIGhvb2tFdmVudC5rZWVwQXR0ciA9IHRydWU7XG4gICAgICBob29rRXZlbnQuZm9yY2VLZWVwQXR0ciA9IHVuZGVmaW5lZDsgLy8gQWxsb3dzIGRldmVsb3BlcnMgdG8gc2VlIHRoaXMgaXMgYSBwcm9wZXJ0eSB0aGV5IGNhbiBzZXRcbiAgICAgIF9leGVjdXRlSG9va3MoaG9va3MudXBvblNhbml0aXplQXR0cmlidXRlLCBjdXJyZW50Tm9kZSwgaG9va0V2ZW50KTtcbiAgICAgIHZhbHVlID0gaG9va0V2ZW50LmF0dHJWYWx1ZTtcbiAgICAgIC8qIEZ1bGwgRE9NIENsb2JiZXJpbmcgcHJvdGVjdGlvbiB2aWEgbmFtZXNwYWNlIGlzb2xhdGlvbixcbiAgICAgICAqIFByZWZpeCBpZCBhbmQgbmFtZSBhdHRyaWJ1dGVzIHdpdGggYHVzZXItY29udGVudC1gXG4gICAgICAgKi9cbiAgICAgIGlmIChTQU5JVElaRV9OQU1FRF9QUk9QUyAmJiAobGNOYW1lID09PSAnaWQnIHx8IGxjTmFtZSA9PT0gJ25hbWUnKSkge1xuICAgICAgICAvLyBSZW1vdmUgdGhlIGF0dHJpYnV0ZSB3aXRoIHRoaXMgdmFsdWVcbiAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZShuYW1lLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgIC8vIFByZWZpeCB0aGUgdmFsdWUgYW5kIGxhdGVyIHJlLWNyZWF0ZSB0aGUgYXR0cmlidXRlIHdpdGggdGhlIHNhbml0aXplZCB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IFNBTklUSVpFX05BTUVEX1BST1BTX1BSRUZJWCArIHZhbHVlO1xuICAgICAgfVxuICAgICAgLyogV29yayBhcm91bmQgYSBzZWN1cml0eSBpc3N1ZSB3aXRoIGNvbW1lbnRzIGluc2lkZSBhdHRyaWJ1dGVzICovXG4gICAgICBpZiAoU0FGRV9GT1JfWE1MICYmIHJlZ0V4cFRlc3QoLygoLS0hP3xdKT4pfDxcXC8oc3R5bGV8dGl0bGV8dGV4dGFyZWEpL2ksIHZhbHVlKSkge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBNYWtlIHN1cmUgd2UgY2Fubm90IGVhc2lseSB1c2UgYW5pbWF0ZWQgaHJlZnMsIGV2ZW4gaWYgYW5pbWF0aW9ucyBhcmUgYWxsb3dlZCAqL1xuICAgICAgaWYgKGxjTmFtZSA9PT0gJ2F0dHJpYnV0ZW5hbWUnICYmIHN0cmluZ01hdGNoKHZhbHVlLCAnaHJlZicpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIERpZCB0aGUgaG9va3MgYXBwcm92ZSBvZiB0aGUgYXR0cmlidXRlPyAqL1xuICAgICAgaWYgKGhvb2tFdmVudC5mb3JjZUtlZXBBdHRyKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyogRGlkIHRoZSBob29rcyBhcHByb3ZlIG9mIHRoZSBhdHRyaWJ1dGU/ICovXG4gICAgICBpZiAoIWhvb2tFdmVudC5rZWVwQXR0cikge1xuICAgICAgICBfcmVtb3ZlQXR0cmlidXRlKG5hbWUsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKiBXb3JrIGFyb3VuZCBhIHNlY3VyaXR5IGlzc3VlIGluIGpRdWVyeSAzLjAgKi9cbiAgICAgIGlmICghQUxMT1dfU0VMRl9DTE9TRV9JTl9BVFRSICYmIHJlZ0V4cFRlc3QoL1xcLz4vaSwgdmFsdWUpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIFNhbml0aXplIGF0dHJpYnV0ZSBjb250ZW50IHRvIGJlIHRlbXBsYXRlLXNhZmUgKi9cbiAgICAgIGlmIChTQUZFX0ZPUl9URU1QTEFURVMpIHtcbiAgICAgICAgYXJyYXlGb3JFYWNoKFtNVVNUQUNIRV9FWFBSLCBFUkJfRVhQUiwgVE1QTElUX0VYUFJdLCBleHByID0+IHtcbiAgICAgICAgICB2YWx1ZSA9IHN0cmluZ1JlcGxhY2UodmFsdWUsIGV4cHIsICcgJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLyogSXMgYHZhbHVlYCB2YWxpZCBmb3IgdGhpcyBhdHRyaWJ1dGU/ICovXG4gICAgICBjb25zdCBsY1RhZyA9IHRyYW5zZm9ybUNhc2VGdW5jKGN1cnJlbnROb2RlLm5vZGVOYW1lKTtcbiAgICAgIGlmICghX2lzVmFsaWRBdHRyaWJ1dGUobGNUYWcsIGxjTmFtZSwgdmFsdWUpKSB7XG4gICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qIEhhbmRsZSBhdHRyaWJ1dGVzIHRoYXQgcmVxdWlyZSBUcnVzdGVkIFR5cGVzICovXG4gICAgICBpZiAodHJ1c3RlZFR5cGVzUG9saWN5ICYmIHR5cGVvZiB0cnVzdGVkVHlwZXMgPT09ICdvYmplY3QnICYmIHR5cGVvZiB0cnVzdGVkVHlwZXMuZ2V0QXR0cmlidXRlVHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAobmFtZXNwYWNlVVJJKSA7IGVsc2Uge1xuICAgICAgICAgIHN3aXRjaCAodHJ1c3RlZFR5cGVzLmdldEF0dHJpYnV0ZVR5cGUobGNUYWcsIGxjTmFtZSkpIHtcbiAgICAgICAgICAgIGNhc2UgJ1RydXN0ZWRIVE1MJzpcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwodmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdUcnVzdGVkU2NyaXB0VVJMJzpcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZVNjcmlwdFVSTCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8qIEhhbmRsZSBpbnZhbGlkIGRhdGEtKiBhdHRyaWJ1dGUgc2V0IGJ5IHRyeS1jYXRjaGluZyBpdCAqL1xuICAgICAgaWYgKHZhbHVlICE9PSBpbml0VmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAobmFtZXNwYWNlVVJJKSB7XG4gICAgICAgICAgICBjdXJyZW50Tm9kZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLyogRmFsbGJhY2sgdG8gc2V0QXR0cmlidXRlKCkgZm9yIGJyb3dzZXItdW5yZWNvZ25pemVkIG5hbWVzcGFjZXMgZS5nLiBcIngtc2NoZW1hXCIuICovXG4gICAgICAgICAgICBjdXJyZW50Tm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX2lzQ2xvYmJlcmVkKGN1cnJlbnROb2RlKSkge1xuICAgICAgICAgICAgX2ZvcmNlUmVtb3ZlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyYXlQb3AoRE9NUHVyaWZ5LnJlbW92ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUobmFtZSwgY3VycmVudE5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICBfZXhlY3V0ZUhvb2tzKGhvb2tzLmFmdGVyU2FuaXRpemVBdHRyaWJ1dGVzLCBjdXJyZW50Tm9kZSwgbnVsbCk7XG4gIH07XG4gIC8qKlxuICAgKiBfc2FuaXRpemVTaGFkb3dET01cbiAgICpcbiAgICogQHBhcmFtIGZyYWdtZW50IHRvIGl0ZXJhdGUgb3ZlciByZWN1cnNpdmVseVxuICAgKi9cbiAgY29uc3QgX3Nhbml0aXplU2hhZG93RE9NID0gZnVuY3Rpb24gX3Nhbml0aXplU2hhZG93RE9NKGZyYWdtZW50KSB7XG4gICAgbGV0IHNoYWRvd05vZGUgPSBudWxsO1xuICAgIGNvbnN0IHNoYWRvd0l0ZXJhdG9yID0gX2NyZWF0ZU5vZGVJdGVyYXRvcihmcmFnbWVudCk7XG4gICAgLyogRXhlY3V0ZSBhIGhvb2sgaWYgcHJlc2VudCAqL1xuICAgIF9leGVjdXRlSG9va3MoaG9va3MuYmVmb3JlU2FuaXRpemVTaGFkb3dET00sIGZyYWdtZW50LCBudWxsKTtcbiAgICB3aGlsZSAoc2hhZG93Tm9kZSA9IHNoYWRvd0l0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgIC8qIEV4ZWN1dGUgYSBob29rIGlmIHByZXNlbnQgKi9cbiAgICAgIF9leGVjdXRlSG9va3MoaG9va3MudXBvblNhbml0aXplU2hhZG93Tm9kZSwgc2hhZG93Tm9kZSwgbnVsbCk7XG4gICAgICAvKiBTYW5pdGl6ZSB0YWdzIGFuZCBlbGVtZW50cyAqL1xuICAgICAgX3Nhbml0aXplRWxlbWVudHMoc2hhZG93Tm9kZSk7XG4gICAgICAvKiBDaGVjayBhdHRyaWJ1dGVzIG5leHQgKi9cbiAgICAgIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoc2hhZG93Tm9kZSk7XG4gICAgICAvKiBEZWVwIHNoYWRvdyBET00gZGV0ZWN0ZWQgKi9cbiAgICAgIGlmIChzaGFkb3dOb2RlLmNvbnRlbnQgaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50KSB7XG4gICAgICAgIF9zYW5pdGl6ZVNoYWRvd0RPTShzaGFkb3dOb2RlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICAvKiBFeGVjdXRlIGEgaG9vayBpZiBwcmVzZW50ICovXG4gICAgX2V4ZWN1dGVIb29rcyhob29rcy5hZnRlclNhbml0aXplU2hhZG93RE9NLCBmcmFnbWVudCwgbnVsbCk7XG4gIH07XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG4gIERPTVB1cmlmeS5zYW5pdGl6ZSA9IGZ1bmN0aW9uIChkaXJ0eSkge1xuICAgIGxldCBjZmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICAgIGxldCBib2R5ID0gbnVsbDtcbiAgICBsZXQgaW1wb3J0ZWROb2RlID0gbnVsbDtcbiAgICBsZXQgY3VycmVudE5vZGUgPSBudWxsO1xuICAgIGxldCByZXR1cm5Ob2RlID0gbnVsbDtcbiAgICAvKiBNYWtlIHN1cmUgd2UgaGF2ZSBhIHN0cmluZyB0byBzYW5pdGl6ZS5cbiAgICAgIERPIE5PVCByZXR1cm4gZWFybHksIGFzIHRoaXMgd2lsbCByZXR1cm4gdGhlIHdyb25nIHR5cGUgaWZcbiAgICAgIHRoZSB1c2VyIGhhcyByZXF1ZXN0ZWQgYSBET00gb2JqZWN0IHJhdGhlciB0aGFuIGEgc3RyaW5nICovXG4gICAgSVNfRU1QVFlfSU5QVVQgPSAhZGlydHk7XG4gICAgaWYgKElTX0VNUFRZX0lOUFVUKSB7XG4gICAgICBkaXJ0eSA9ICc8IS0tPic7XG4gICAgfVxuICAgIC8qIFN0cmluZ2lmeSwgaW4gY2FzZSBkaXJ0eSBpcyBhbiBvYmplY3QgKi9cbiAgICBpZiAodHlwZW9mIGRpcnR5ICE9PSAnc3RyaW5nJyAmJiAhX2lzTm9kZShkaXJ0eSkpIHtcbiAgICAgIGlmICh0eXBlb2YgZGlydHkudG9TdHJpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZGlydHkgPSBkaXJ0eS50b1N0cmluZygpO1xuICAgICAgICBpZiAodHlwZW9mIGRpcnR5ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRocm93IHR5cGVFcnJvckNyZWF0ZSgnZGlydHkgaXMgbm90IGEgc3RyaW5nLCBhYm9ydGluZycpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0eXBlRXJyb3JDcmVhdGUoJ3RvU3RyaW5nIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIFJldHVybiBkaXJ0eSBIVE1MIGlmIERPTVB1cmlmeSBjYW5ub3QgcnVuICovXG4gICAgaWYgKCFET01QdXJpZnkuaXNTdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybiBkaXJ0eTtcbiAgICB9XG4gICAgLyogQXNzaWduIGNvbmZpZyB2YXJzICovXG4gICAgaWYgKCFTRVRfQ09ORklHKSB7XG4gICAgICBfcGFyc2VDb25maWcoY2ZnKTtcbiAgICB9XG4gICAgLyogQ2xlYW4gdXAgcmVtb3ZlZCBlbGVtZW50cyAqL1xuICAgIERPTVB1cmlmeS5yZW1vdmVkID0gW107XG4gICAgLyogQ2hlY2sgaWYgZGlydHkgaXMgY29ycmVjdGx5IHR5cGVkIGZvciBJTl9QTEFDRSAqL1xuICAgIGlmICh0eXBlb2YgZGlydHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICBJTl9QTEFDRSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoSU5fUExBQ0UpIHtcbiAgICAgIC8qIERvIHNvbWUgZWFybHkgcHJlLXNhbml0aXphdGlvbiB0byBhdm9pZCB1bnNhZmUgcm9vdCBub2RlcyAqL1xuICAgICAgaWYgKGRpcnR5Lm5vZGVOYW1lKSB7XG4gICAgICAgIGNvbnN0IHRhZ05hbWUgPSB0cmFuc2Zvcm1DYXNlRnVuYyhkaXJ0eS5ub2RlTmFtZSk7XG4gICAgICAgIGlmICghQUxMT1dFRF9UQUdTW3RhZ05hbWVdIHx8IEZPUkJJRF9UQUdTW3RhZ05hbWVdKSB7XG4gICAgICAgICAgdGhyb3cgdHlwZUVycm9yQ3JlYXRlKCdyb290IG5vZGUgaXMgZm9yYmlkZGVuIGFuZCBjYW5ub3QgYmUgc2FuaXRpemVkIGluLXBsYWNlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRpcnR5IGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgLyogSWYgZGlydHkgaXMgYSBET00gZWxlbWVudCwgYXBwZW5kIHRvIGFuIGVtcHR5IGRvY3VtZW50IHRvIGF2b2lkXG4gICAgICAgICBlbGVtZW50cyBiZWluZyBzdHJpcHBlZCBieSB0aGUgcGFyc2VyICovXG4gICAgICBib2R5ID0gX2luaXREb2N1bWVudCgnPCEtLS0tPicpO1xuICAgICAgaW1wb3J0ZWROb2RlID0gYm9keS5vd25lckRvY3VtZW50LmltcG9ydE5vZGUoZGlydHksIHRydWUpO1xuICAgICAgaWYgKGltcG9ydGVkTm9kZS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLmVsZW1lbnQgJiYgaW1wb3J0ZWROb2RlLm5vZGVOYW1lID09PSAnQk9EWScpIHtcbiAgICAgICAgLyogTm9kZSBpcyBhbHJlYWR5IGEgYm9keSwgdXNlIGFzIGlzICovXG4gICAgICAgIGJvZHkgPSBpbXBvcnRlZE5vZGU7XG4gICAgICB9IGVsc2UgaWYgKGltcG9ydGVkTm9kZS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgIGJvZHkgPSBpbXBvcnRlZE5vZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtYXBwZW5kXG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoaW1wb3J0ZWROb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLyogRXhpdCBkaXJlY3RseSBpZiB3ZSBoYXZlIG5vdGhpbmcgdG8gZG8gKi9cbiAgICAgIGlmICghUkVUVVJOX0RPTSAmJiAhU0FGRV9GT1JfVEVNUExBVEVTICYmICFXSE9MRV9ET0NVTUVOVCAmJlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHVuaWNvcm4vcHJlZmVyLWluY2x1ZGVzXG4gICAgICBkaXJ0eS5pbmRleE9mKCc8JykgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVzdGVkVHlwZXNQb2xpY3kgJiYgUkVUVVJOX1RSVVNURURfVFlQRSA/IHRydXN0ZWRUeXBlc1BvbGljeS5jcmVhdGVIVE1MKGRpcnR5KSA6IGRpcnR5O1xuICAgICAgfVxuICAgICAgLyogSW5pdGlhbGl6ZSB0aGUgZG9jdW1lbnQgdG8gd29yayBvbiAqL1xuICAgICAgYm9keSA9IF9pbml0RG9jdW1lbnQoZGlydHkpO1xuICAgICAgLyogQ2hlY2sgd2UgaGF2ZSBhIERPTSBub2RlIGZyb20gdGhlIGRhdGEgKi9cbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICByZXR1cm4gUkVUVVJOX0RPTSA/IG51bGwgOiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gZW1wdHlIVE1MIDogJyc7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIFJlbW92ZSBmaXJzdCBlbGVtZW50IG5vZGUgKG91cnMpIGlmIEZPUkNFX0JPRFkgaXMgc2V0ICovXG4gICAgaWYgKGJvZHkgJiYgRk9SQ0VfQk9EWSkge1xuICAgICAgX2ZvcmNlUmVtb3ZlKGJvZHkuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIC8qIEdldCBub2RlIGl0ZXJhdG9yICovXG4gICAgY29uc3Qgbm9kZUl0ZXJhdG9yID0gX2NyZWF0ZU5vZGVJdGVyYXRvcihJTl9QTEFDRSA/IGRpcnR5IDogYm9keSk7XG4gICAgLyogTm93IHN0YXJ0IGl0ZXJhdGluZyBvdmVyIHRoZSBjcmVhdGVkIGRvY3VtZW50ICovXG4gICAgd2hpbGUgKGN1cnJlbnROb2RlID0gbm9kZUl0ZXJhdG9yLm5leHROb2RlKCkpIHtcbiAgICAgIC8qIFNhbml0aXplIHRhZ3MgYW5kIGVsZW1lbnRzICovXG4gICAgICBfc2FuaXRpemVFbGVtZW50cyhjdXJyZW50Tm9kZSk7XG4gICAgICAvKiBDaGVjayBhdHRyaWJ1dGVzIG5leHQgKi9cbiAgICAgIF9zYW5pdGl6ZUF0dHJpYnV0ZXMoY3VycmVudE5vZGUpO1xuICAgICAgLyogU2hhZG93IERPTSBkZXRlY3RlZCwgc2FuaXRpemUgaXQgKi9cbiAgICAgIGlmIChjdXJyZW50Tm9kZS5jb250ZW50IGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICBfc2FuaXRpemVTaGFkb3dET00oY3VycmVudE5vZGUuY29udGVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIElmIHdlIHNhbml0aXplZCBgZGlydHlgIGluLXBsYWNlLCByZXR1cm4gaXQuICovXG4gICAgaWYgKElOX1BMQUNFKSB7XG4gICAgICByZXR1cm4gZGlydHk7XG4gICAgfVxuICAgIC8qIFJldHVybiBzYW5pdGl6ZWQgc3RyaW5nIG9yIERPTSAqL1xuICAgIGlmIChSRVRVUk5fRE9NKSB7XG4gICAgICBpZiAoUkVUVVJOX0RPTV9GUkFHTUVOVCkge1xuICAgICAgICByZXR1cm5Ob2RlID0gY3JlYXRlRG9jdW1lbnRGcmFnbWVudC5jYWxsKGJvZHkub3duZXJEb2N1bWVudCk7XG4gICAgICAgIHdoaWxlIChib2R5LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdW5pY29ybi9wcmVmZXItZG9tLW5vZGUtYXBwZW5kXG4gICAgICAgICAgcmV0dXJuTm9kZS5hcHBlbmRDaGlsZChib2R5LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm5Ob2RlID0gYm9keTtcbiAgICAgIH1cbiAgICAgIGlmIChBTExPV0VEX0FUVFIuc2hhZG93cm9vdCB8fCBBTExPV0VEX0FUVFIuc2hhZG93cm9vdG1vZGUpIHtcbiAgICAgICAgLypcbiAgICAgICAgICBBZG9wdE5vZGUoKSBpcyBub3QgdXNlZCBiZWNhdXNlIGludGVybmFsIHN0YXRlIGlzIG5vdCByZXNldFxuICAgICAgICAgIChlLmcuIHRoZSBwYXN0IG5hbWVzIG1hcCBvZiBhIEhUTUxGb3JtRWxlbWVudCksIHRoaXMgaXMgc2FmZVxuICAgICAgICAgIGluIHRoZW9yeSBidXQgd2Ugd291bGQgcmF0aGVyIG5vdCByaXNrIGFub3RoZXIgYXR0YWNrIHZlY3Rvci5cbiAgICAgICAgICBUaGUgc3RhdGUgdGhhdCBpcyBjbG9uZWQgYnkgaW1wb3J0Tm9kZSgpIGlzIGV4cGxpY2l0bHkgZGVmaW5lZFxuICAgICAgICAgIGJ5IHRoZSBzcGVjcy5cbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuTm9kZSA9IGltcG9ydE5vZGUuY2FsbChvcmlnaW5hbERvY3VtZW50LCByZXR1cm5Ob2RlLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXR1cm5Ob2RlO1xuICAgIH1cbiAgICBsZXQgc2VyaWFsaXplZEhUTUwgPSBXSE9MRV9ET0NVTUVOVCA/IGJvZHkub3V0ZXJIVE1MIDogYm9keS5pbm5lckhUTUw7XG4gICAgLyogU2VyaWFsaXplIGRvY3R5cGUgaWYgYWxsb3dlZCAqL1xuICAgIGlmIChXSE9MRV9ET0NVTUVOVCAmJiBBTExPV0VEX1RBR1NbJyFkb2N0eXBlJ10gJiYgYm9keS5vd25lckRvY3VtZW50ICYmIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlICYmIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUgJiYgcmVnRXhwVGVzdChET0NUWVBFX05BTUUsIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUpKSB7XG4gICAgICBzZXJpYWxpemVkSFRNTCA9ICc8IURPQ1RZUEUgJyArIGJvZHkub3duZXJEb2N1bWVudC5kb2N0eXBlLm5hbWUgKyAnPlxcbicgKyBzZXJpYWxpemVkSFRNTDtcbiAgICB9XG4gICAgLyogU2FuaXRpemUgZmluYWwgc3RyaW5nIHRlbXBsYXRlLXNhZmUgKi9cbiAgICBpZiAoU0FGRV9GT1JfVEVNUExBVEVTKSB7XG4gICAgICBhcnJheUZvckVhY2goW01VU1RBQ0hFX0VYUFIsIEVSQl9FWFBSLCBUTVBMSVRfRVhQUl0sIGV4cHIgPT4ge1xuICAgICAgICBzZXJpYWxpemVkSFRNTCA9IHN0cmluZ1JlcGxhY2Uoc2VyaWFsaXplZEhUTUwsIGV4cHIsICcgJyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRydXN0ZWRUeXBlc1BvbGljeSAmJiBSRVRVUk5fVFJVU1RFRF9UWVBFID8gdHJ1c3RlZFR5cGVzUG9saWN5LmNyZWF0ZUhUTUwoc2VyaWFsaXplZEhUTUwpIDogc2VyaWFsaXplZEhUTUw7XG4gIH07XG4gIERPTVB1cmlmeS5zZXRDb25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGNmZyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gICAgX3BhcnNlQ29uZmlnKGNmZyk7XG4gICAgU0VUX0NPTkZJRyA9IHRydWU7XG4gIH07XG4gIERPTVB1cmlmeS5jbGVhckNvbmZpZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBDT05GSUcgPSBudWxsO1xuICAgIFNFVF9DT05GSUcgPSBmYWxzZTtcbiAgfTtcbiAgRE9NUHVyaWZ5LmlzVmFsaWRBdHRyaWJ1dGUgPSBmdW5jdGlvbiAodGFnLCBhdHRyLCB2YWx1ZSkge1xuICAgIC8qIEluaXRpYWxpemUgc2hhcmVkIGNvbmZpZyB2YXJzIGlmIG5lY2Vzc2FyeS4gKi9cbiAgICBpZiAoIUNPTkZJRykge1xuICAgICAgX3BhcnNlQ29uZmlnKHt9KTtcbiAgICB9XG4gICAgY29uc3QgbGNUYWcgPSB0cmFuc2Zvcm1DYXNlRnVuYyh0YWcpO1xuICAgIGNvbnN0IGxjTmFtZSA9IHRyYW5zZm9ybUNhc2VGdW5jKGF0dHIpO1xuICAgIHJldHVybiBfaXNWYWxpZEF0dHJpYnV0ZShsY1RhZywgbGNOYW1lLCB2YWx1ZSk7XG4gIH07XG4gIERPTVB1cmlmeS5hZGRIb29rID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQsIGhvb2tGdW5jdGlvbikge1xuICAgIGlmICh0eXBlb2YgaG9va0Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGFycmF5UHVzaChob29rc1tlbnRyeVBvaW50XSwgaG9va0Z1bmN0aW9uKTtcbiAgfTtcbiAgRE9NUHVyaWZ5LnJlbW92ZUhvb2sgPSBmdW5jdGlvbiAoZW50cnlQb2ludCwgaG9va0Z1bmN0aW9uKSB7XG4gICAgaWYgKGhvb2tGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGFycmF5TGFzdEluZGV4T2YoaG9va3NbZW50cnlQb2ludF0sIGhvb2tGdW5jdGlvbik7XG4gICAgICByZXR1cm4gaW5kZXggPT09IC0xID8gdW5kZWZpbmVkIDogYXJyYXlTcGxpY2UoaG9va3NbZW50cnlQb2ludF0sIGluZGV4LCAxKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5UG9wKGhvb2tzW2VudHJ5UG9pbnRdKTtcbiAgfTtcbiAgRE9NUHVyaWZ5LnJlbW92ZUhvb2tzID0gZnVuY3Rpb24gKGVudHJ5UG9pbnQpIHtcbiAgICBob29rc1tlbnRyeVBvaW50XSA9IFtdO1xuICB9O1xuICBET01QdXJpZnkucmVtb3ZlQWxsSG9va3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgaG9va3MgPSBfY3JlYXRlSG9va3NNYXAoKTtcbiAgfTtcbiAgcmV0dXJuIERPTVB1cmlmeTtcbn1cbnZhciBwdXJpZnkgPSBjcmVhdGVET01QdXJpZnkoKTtcblxuZXhwb3J0IHsgcHVyaWZ5IGFzIGRlZmF1bHQgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXB1cmlmeS5lcy5tanMubWFwXG4iLCIvKipcbiAqIG1hcmtlZCB2MTcuMC4xIC0gYSBtYXJrZG93biBwYXJzZXJcbiAqIENvcHlyaWdodCAoYykgMjAxOC0yMDI1LCBNYXJrZWRKUy4gKE1JVCBMaWNlbnNlKVxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTgsIENocmlzdG9waGVyIEplZmZyZXkuIChNSVQgTGljZW5zZSlcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWRcbiAqL1xuXG4vKipcbiAqIERPIE5PVCBFRElUIFRISVMgRklMRVxuICogVGhlIGNvZGUgaW4gdGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBmcm9tIGZpbGVzIGluIC4vc3JjL1xuICovXG5cbmZ1bmN0aW9uIEwoKXtyZXR1cm57YXN5bmM6ITEsYnJlYWtzOiExLGV4dGVuc2lvbnM6bnVsbCxnZm06ITAsaG9va3M6bnVsbCxwZWRhbnRpYzohMSxyZW5kZXJlcjpudWxsLHNpbGVudDohMSx0b2tlbml6ZXI6bnVsbCx3YWxrVG9rZW5zOm51bGx9fXZhciBUPUwoKTtmdW5jdGlvbiBaKHUpe1Q9dX12YXIgQz17ZXhlYzooKT0+bnVsbH07ZnVuY3Rpb24gayh1LGU9XCJcIil7bGV0IHQ9dHlwZW9mIHU9PVwic3RyaW5nXCI/dTp1LnNvdXJjZSxuPXtyZXBsYWNlOihyLGkpPT57bGV0IHM9dHlwZW9mIGk9PVwic3RyaW5nXCI/aTppLnNvdXJjZTtyZXR1cm4gcz1zLnJlcGxhY2UobS5jYXJldCxcIiQxXCIpLHQ9dC5yZXBsYWNlKHIscyksbn0sZ2V0UmVnZXg6KCk9Pm5ldyBSZWdFeHAodCxlKX07cmV0dXJuIG59dmFyIG1lPSgoKT0+e3RyeXtyZXR1cm4hIW5ldyBSZWdFeHAoXCIoPzw9MSkoPzwhMSlcIil9Y2F0Y2h7cmV0dXJuITF9fSkoKSxtPXtjb2RlUmVtb3ZlSW5kZW50Oi9eKD86IHsxLDR9fCB7MCwzfVxcdCkvZ20sb3V0cHV0TGlua1JlcGxhY2U6L1xcXFwoW1xcW1xcXV0pL2csaW5kZW50Q29kZUNvbXBlbnNhdGlvbjovXihcXHMrKSg/OmBgYCkvLGJlZ2lubmluZ1NwYWNlOi9eXFxzKy8sZW5kaW5nSGFzaDovIyQvLHN0YXJ0aW5nU3BhY2VDaGFyOi9eIC8sZW5kaW5nU3BhY2VDaGFyOi8gJC8sbm9uU3BhY2VDaGFyOi9bXiBdLyxuZXdMaW5lQ2hhckdsb2JhbDovXFxuL2csdGFiQ2hhckdsb2JhbDovXFx0L2csbXVsdGlwbGVTcGFjZUdsb2JhbDovXFxzKy9nLGJsYW5rTGluZTovXlsgXFx0XSokLyxkb3VibGVCbGFua0xpbmU6L1xcblsgXFx0XSpcXG5bIFxcdF0qJC8sYmxvY2txdW90ZVN0YXJ0Oi9eIHswLDN9Pi8sYmxvY2txdW90ZVNldGV4dFJlcGxhY2U6L1xcbiB7MCwzfSgoPzo9K3wtKykgKikoPz1cXG58JCkvZyxibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZTI6L14gezAsM30+WyBcXHRdPy9nbSxsaXN0UmVwbGFjZVRhYnM6L15cXHQrLyxsaXN0UmVwbGFjZU5lc3Rpbmc6L14gezEsNH0oPz0oIHs0fSkqW14gXSkvZyxsaXN0SXNUYXNrOi9eXFxbWyB4WF1cXF0gK1xcUy8sbGlzdFJlcGxhY2VUYXNrOi9eXFxbWyB4WF1cXF0gKy8sbGlzdFRhc2tDaGVja2JveDovXFxbWyB4WF1cXF0vLGFueUxpbmU6L1xcbi4qXFxuLyxocmVmQnJhY2tldHM6L148KC4qKT4kLyx0YWJsZURlbGltaXRlcjovWzp8XS8sdGFibGVBbGlnbkNoYXJzOi9eXFx8fFxcfCAqJC9nLHRhYmxlUm93QmxhbmtMaW5lOi9cXG5bIFxcdF0qJC8sdGFibGVBbGlnblJpZ2h0Oi9eICotKzogKiQvLHRhYmxlQWxpZ25DZW50ZXI6L14gKjotKzogKiQvLHRhYmxlQWxpZ25MZWZ0Oi9eICo6LSsgKiQvLHN0YXJ0QVRhZzovXjxhIC9pLGVuZEFUYWc6L148XFwvYT4vaSxzdGFydFByZVNjcmlwdFRhZzovXjwocHJlfGNvZGV8a2JkfHNjcmlwdCkoXFxzfD4pL2ksZW5kUHJlU2NyaXB0VGFnOi9ePFxcLyhwcmV8Y29kZXxrYmR8c2NyaXB0KShcXHN8PikvaSxzdGFydEFuZ2xlQnJhY2tldDovXjwvLGVuZEFuZ2xlQnJhY2tldDovPiQvLHBlZGFudGljSHJlZlRpdGxlOi9eKFteJ1wiXSpbXlxcc10pXFxzKyhbJ1wiXSkoLiopXFwyLyx1bmljb2RlQWxwaGFOdW1lcmljOi9bXFxwe0x9XFxwe059XS91LGVzY2FwZVRlc3Q6L1smPD5cIiddLyxlc2NhcGVSZXBsYWNlOi9bJjw+XCInXS9nLGVzY2FwZVRlc3ROb0VuY29kZTovWzw+XCInXXwmKD8hKCNcXGR7MSw3fXwjW1h4XVthLWZBLUYwLTldezEsNn18XFx3Kyk7KS8sZXNjYXBlUmVwbGFjZU5vRW5jb2RlOi9bPD5cIiddfCYoPyEoI1xcZHsxLDd9fCNbWHhdW2EtZkEtRjAtOV17MSw2fXxcXHcrKTspL2csdW5lc2NhcGVUZXN0Oi8mKCMoPzpcXGQrKXwoPzojeFswLTlBLUZhLWZdKyl8KD86XFx3KykpOz8vaWcsY2FyZXQ6LyhefFteXFxbXSlcXF4vZyxwZXJjZW50RGVjb2RlOi8lMjUvZyxmaW5kUGlwZTovXFx8L2csc3BsaXRQaXBlOi8gXFx8LyxzbGFzaFBpcGU6L1xcXFxcXHwvZyxjYXJyaWFnZVJldHVybjovXFxyXFxufFxcci9nLHNwYWNlTGluZTovXiArJC9nbSxub3RTcGFjZVN0YXJ0Oi9eXFxTKi8sZW5kaW5nTmV3bGluZTovXFxuJC8sbGlzdEl0ZW1SZWdleDp1PT5uZXcgUmVnRXhwKGBeKCB7MCwzfSR7dX0pKCg/OltcdCBdW15cXFxcbl0qKT8oPzpcXFxcbnwkKSlgKSxuZXh0QnVsbGV0UmVnZXg6dT0+bmV3IFJlZ0V4cChgXiB7MCwke01hdGgubWluKDMsdS0xKX19KD86WyorLV18XFxcXGR7MSw5fVsuKV0pKCg/OlsgXHRdW15cXFxcbl0qKT8oPzpcXFxcbnwkKSlgKSxoclJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSgoPzotICopezMsfXwoPzpfICopezMsfXwoPzpcXFxcKiAqKXszLH0pKD86XFxcXG4rfCQpYCksZmVuY2VzQmVnaW5SZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX0oPzpcXGBcXGBcXGB8fn5+KWApLGhlYWRpbmdCZWdpblJlZ2V4OnU9Pm5ldyBSZWdFeHAoYF4gezAsJHtNYXRoLm1pbigzLHUtMSl9fSNgKSxodG1sQmVnaW5SZWdleDp1PT5uZXcgUmVnRXhwKGBeIHswLCR7TWF0aC5taW4oMyx1LTEpfX08KD86W2Etel0uKj58IS0tKWAsXCJpXCIpfSx4ZT0vXig/OlsgXFx0XSooPzpcXG58JCkpKy8sYmU9L14oKD86IHs0fXwgezAsM31cXHQpW15cXG5dKyg/Olxcbig/OlsgXFx0XSooPzpcXG58JCkpKik/KSsvLFJlPS9eIHswLDN9KGB7Myx9KD89W15gXFxuXSooPzpcXG58JCkpfH57Myx9KShbXlxcbl0qKSg/OlxcbnwkKSg/OnwoW1xcc1xcU10qPykoPzpcXG58JCkpKD86IHswLDN9XFwxW35gXSogKig/PVxcbnwkKXwkKS8sST0vXiB7MCwzfSgoPzotW1xcdCBdKil7Myx9fCg/Ol9bIFxcdF0qKXszLH18KD86XFwqWyBcXHRdKil7Myx9KSg/Olxcbit8JCkvLFRlPS9eIHswLDN9KCN7MSw2fSkoPz1cXHN8JCkoLiopKD86XFxuK3wkKS8sTj0vKD86WyorLV18XFxkezEsOX1bLildKS8scmU9L14oPyFidWxsIHxibG9ja0NvZGV8ZmVuY2VzfGJsb2NrcXVvdGV8aGVhZGluZ3xodG1sfHRhYmxlKSgoPzoufFxcbig/IVxccyo/XFxufGJ1bGwgfGJsb2NrQ29kZXxmZW5jZXN8YmxvY2txdW90ZXxoZWFkaW5nfGh0bWx8dGFibGUpKSs/KVxcbiB7MCwzfSg9K3wtKykgKig/Olxcbit8JCkvLHNlPWsocmUpLnJlcGxhY2UoL2J1bGwvZyxOKS5yZXBsYWNlKC9ibG9ja0NvZGUvZywvKD86IHs0fXwgezAsM31cXHQpLykucmVwbGFjZSgvZmVuY2VzL2csLyB7MCwzfSg/OmB7Myx9fH57Myx9KS8pLnJlcGxhY2UoL2Jsb2NrcXVvdGUvZywvIHswLDN9Pi8pLnJlcGxhY2UoL2hlYWRpbmcvZywvIHswLDN9I3sxLDZ9LykucmVwbGFjZSgvaHRtbC9nLC8gezAsM308W15cXG4+XSs+XFxuLykucmVwbGFjZSgvXFx8dGFibGUvZyxcIlwiKS5nZXRSZWdleCgpLE9lPWsocmUpLnJlcGxhY2UoL2J1bGwvZyxOKS5yZXBsYWNlKC9ibG9ja0NvZGUvZywvKD86IHs0fXwgezAsM31cXHQpLykucmVwbGFjZSgvZmVuY2VzL2csLyB7MCwzfSg/OmB7Myx9fH57Myx9KS8pLnJlcGxhY2UoL2Jsb2NrcXVvdGUvZywvIHswLDN9Pi8pLnJlcGxhY2UoL2hlYWRpbmcvZywvIHswLDN9I3sxLDZ9LykucmVwbGFjZSgvaHRtbC9nLC8gezAsM308W15cXG4+XSs+XFxuLykucmVwbGFjZSgvdGFibGUvZywvIHswLDN9XFx8Pyg/Ols6XFwtIF0qXFx8KStbXFw6XFwtIF0qXFxuLykuZ2V0UmVnZXgoKSxRPS9eKFteXFxuXSsoPzpcXG4oPyFocnxoZWFkaW5nfGxoZWFkaW5nfGJsb2NrcXVvdGV8ZmVuY2VzfGxpc3R8aHRtbHx0YWJsZXwgK1xcbilbXlxcbl0rKSopLyx3ZT0vXlteXFxuXSsvLEY9Lyg/IVxccypcXF0pKD86XFxcXFtcXHNcXFNdfFteXFxbXFxdXFxcXF0pKy8seWU9aygvXiB7MCwzfVxcWyhsYWJlbClcXF06ICooPzpcXG5bIFxcdF0qKT8oW148XFxzXVteXFxzXSp8PC4qPz4pKD86KD86ICsoPzpcXG5bIFxcdF0qKT98ICpcXG5bIFxcdF0qKSh0aXRsZSkpPyAqKD86XFxuK3wkKS8pLnJlcGxhY2UoXCJsYWJlbFwiLEYpLnJlcGxhY2UoXCJ0aXRsZVwiLC8oPzpcIig/OlxcXFxcIj98W15cIlxcXFxdKSpcInwnW14nXFxuXSooPzpcXG5bXidcXG5dKykqXFxuPyd8XFwoW14oKV0qXFwpKS8pLmdldFJlZ2V4KCksUGU9aygvXiggezAsM31idWxsKShbIFxcdF1bXlxcbl0rPyk/KD86XFxufCQpLykucmVwbGFjZSgvYnVsbC9nLE4pLmdldFJlZ2V4KCksdj1cImFkZHJlc3N8YXJ0aWNsZXxhc2lkZXxiYXNlfGJhc2Vmb250fGJsb2NrcXVvdGV8Ym9keXxjYXB0aW9ufGNlbnRlcnxjb2x8Y29sZ3JvdXB8ZGR8ZGV0YWlsc3xkaWFsb2d8ZGlyfGRpdnxkbHxkdHxmaWVsZHNldHxmaWdjYXB0aW9ufGZpZ3VyZXxmb290ZXJ8Zm9ybXxmcmFtZXxmcmFtZXNldHxoWzEtNl18aGVhZHxoZWFkZXJ8aHJ8aHRtbHxpZnJhbWV8bGVnZW5kfGxpfGxpbmt8bWFpbnxtZW51fG1lbnVpdGVtfG1ldGF8bmF2fG5vZnJhbWVzfG9sfG9wdGdyb3VwfG9wdGlvbnxwfHBhcmFtfHNlYXJjaHxzZWN0aW9ufHN1bW1hcnl8dGFibGV8dGJvZHl8dGR8dGZvb3R8dGh8dGhlYWR8dGl0bGV8dHJ8dHJhY2t8dWxcIixqPS88IS0tKD86LT8+fFtcXHNcXFNdKj8oPzotLT58JCkpLyxTZT1rKFwiXiB7MCwzfSg/Ojwoc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSlbXFxcXHM+XVtcXFxcc1xcXFxTXSo/KD86PC9cXFxcMT5bXlxcXFxuXSpcXFxcbit8JCl8Y29tbWVudFteXFxcXG5dKihcXFxcbit8JCl8PFxcXFw/W1xcXFxzXFxcXFNdKj8oPzpcXFxcPz5cXFxcbip8JCl8PCFbQS1aXVtcXFxcc1xcXFxTXSo/KD86PlxcXFxuKnwkKXw8IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/KD86XFxcXF1cXFxcXT5cXFxcbip8JCl8PC8/KHRhZykoPzogK3xcXFxcbnwvPz4pW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcblsgXHRdKikrXFxcXG58JCl8PCg/IXNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpKFthLXpdW1xcXFx3LV0qKSg/OmF0dHJpYnV0ZSkqPyAqLz8+KD89WyBcXFxcdF0qKD86XFxcXG58JCkpW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcblsgXHRdKikrXFxcXG58JCl8PC8oPyFzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKVthLXpdW1xcXFx3LV0qXFxcXHMqPig/PVsgXFxcXHRdKig/OlxcXFxufCQpKVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG5bIFx0XSopK1xcXFxufCQpKVwiLFwiaVwiKS5yZXBsYWNlKFwiY29tbWVudFwiLGopLnJlcGxhY2UoXCJ0YWdcIix2KS5yZXBsYWNlKFwiYXR0cmlidXRlXCIsLyArW2EtekEtWjpfXVtcXHcuOi1dKig/OiAqPSAqXCJbXlwiXFxuXSpcInwgKj0gKidbXidcXG5dKid8ICo9ICpbXlxcc1wiJz08PmBdKyk/LykuZ2V0UmVnZXgoKSxpZT1rKFEpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsXCIgezAsM30jezEsNn0oPzpcXFxcc3wkKVwiKS5yZXBsYWNlKFwifGxoZWFkaW5nXCIsXCJcIikucmVwbGFjZShcInx0YWJsZVwiLFwiXCIpLnJlcGxhY2UoXCJibG9ja3F1b3RlXCIsXCIgezAsM30+XCIpLnJlcGxhY2UoXCJmZW5jZXNcIixcIiB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcblwiKS5yZXBsYWNlKFwibGlzdFwiLFwiIHswLDN9KD86WyorLV18MVsuKV0pIFwiKS5yZXBsYWNlKFwiaHRtbFwiLFwiPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKVwiKS5yZXBsYWNlKFwidGFnXCIsdikuZ2V0UmVnZXgoKSwkZT1rKC9eKCB7MCwzfT4gPyhwYXJhZ3JhcGh8W15cXG5dKikoPzpcXG58JCkpKy8pLnJlcGxhY2UoXCJwYXJhZ3JhcGhcIixpZSkuZ2V0UmVnZXgoKSxVPXtibG9ja3F1b3RlOiRlLGNvZGU6YmUsZGVmOnllLGZlbmNlczpSZSxoZWFkaW5nOlRlLGhyOkksaHRtbDpTZSxsaGVhZGluZzpzZSxsaXN0OlBlLG5ld2xpbmU6eGUscGFyYWdyYXBoOmllLHRhYmxlOkMsdGV4dDp3ZX0sdGU9ayhcIl4gKihbXlxcXFxuIF0uKilcXFxcbiB7MCwzfSgoPzpcXFxcfCAqKT86Py0rOj8gKig/OlxcXFx8ICo6Py0rOj8gKikqKD86XFxcXHwgKik/KSg/OlxcXFxuKCg/Oig/ISAqXFxcXG58aHJ8aGVhZGluZ3xibG9ja3F1b3RlfGNvZGV8ZmVuY2VzfGxpc3R8aHRtbCkuKig/OlxcXFxufCQpKSopXFxcXG4qfCQpXCIpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsXCIgezAsM30jezEsNn0oPzpcXFxcc3wkKVwiKS5yZXBsYWNlKFwiYmxvY2txdW90ZVwiLFwiIHswLDN9PlwiKS5yZXBsYWNlKFwiY29kZVwiLFwiKD86IHs0fXwgezAsM31cdClbXlxcXFxuXVwiKS5yZXBsYWNlKFwiZmVuY2VzXCIsXCIgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG5cIikucmVwbGFjZShcImxpc3RcIixcIiB7MCwzfSg/OlsqKy1dfDFbLildKSBcIikucmVwbGFjZShcImh0bWxcIixcIjwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSlcIikucmVwbGFjZShcInRhZ1wiLHYpLmdldFJlZ2V4KCksX2U9ey4uLlUsbGhlYWRpbmc6T2UsdGFibGU6dGUscGFyYWdyYXBoOmsoUSkucmVwbGFjZShcImhyXCIsSSkucmVwbGFjZShcImhlYWRpbmdcIixcIiB7MCwzfSN7MSw2fSg/OlxcXFxzfCQpXCIpLnJlcGxhY2UoXCJ8bGhlYWRpbmdcIixcIlwiKS5yZXBsYWNlKFwidGFibGVcIix0ZSkucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcImZlbmNlc1wiLFwiIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuXCIpLnJlcGxhY2UoXCJsaXN0XCIsXCIgezAsM30oPzpbKistXXwxWy4pXSkgXCIpLnJlcGxhY2UoXCJodG1sXCIsXCI8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pXCIpLnJlcGxhY2UoXCJ0YWdcIix2KS5nZXRSZWdleCgpfSxMZT17Li4uVSxodG1sOmsoYF4gKig/OmNvbW1lbnQgKig/OlxcXFxufFxcXFxzKiQpfDwodGFnKVtcXFxcc1xcXFxTXSs/PC9cXFxcMT4gKig/OlxcXFxuezIsfXxcXFxccyokKXw8dGFnKD86XCJbXlwiXSpcInwnW14nXSonfFxcXFxzW14nXCIvPlxcXFxzXSopKj8vPz4gKig/OlxcXFxuezIsfXxcXFxccyokKSlgKS5yZXBsYWNlKFwiY29tbWVudFwiLGopLnJlcGxhY2UoL3RhZy9nLFwiKD8hKD86YXxlbXxzdHJvbmd8c21hbGx8c3xjaXRlfHF8ZGZufGFiYnJ8ZGF0YXx0aW1lfGNvZGV8dmFyfHNhbXB8a2JkfHN1YnxzdXB8aXxifHV8bWFya3xydWJ5fHJ0fHJwfGJkaXxiZG98c3Bhbnxicnx3YnJ8aW5zfGRlbHxpbWcpXFxcXGIpXFxcXHcrKD8hOnxbXlxcXFx3XFxcXHNAXSpAKVxcXFxiXCIpLmdldFJlZ2V4KCksZGVmOi9eICpcXFsoW15cXF1dKylcXF06ICo8PyhbXlxccz5dKyk+Pyg/OiArKFtcIihdW15cXG5dK1tcIildKSk/ICooPzpcXG4rfCQpLyxoZWFkaW5nOi9eKCN7MSw2fSkoLiopKD86XFxuK3wkKS8sZmVuY2VzOkMsbGhlYWRpbmc6L14oLis/KVxcbiB7MCwzfSg9K3wtKykgKig/Olxcbit8JCkvLHBhcmFncmFwaDprKFEpLnJlcGxhY2UoXCJoclwiLEkpLnJlcGxhY2UoXCJoZWFkaW5nXCIsYCAqI3sxLDZ9ICpbXlxuXWApLnJlcGxhY2UoXCJsaGVhZGluZ1wiLHNlKS5yZXBsYWNlKFwifHRhYmxlXCIsXCJcIikucmVwbGFjZShcImJsb2NrcXVvdGVcIixcIiB7MCwzfT5cIikucmVwbGFjZShcInxmZW5jZXNcIixcIlwiKS5yZXBsYWNlKFwifGxpc3RcIixcIlwiKS5yZXBsYWNlKFwifGh0bWxcIixcIlwiKS5yZXBsYWNlKFwifHRhZ1wiLFwiXCIpLmdldFJlZ2V4KCl9LE1lPS9eXFxcXChbIVwiIyQlJicoKSorLFxcLS4vOjs8PT4/QFxcW1xcXVxcXFxeX2B7fH1+XSkvLHplPS9eKGArKShbXmBdfFteYF1bXFxzXFxTXSo/W15gXSlcXDEoPyFgKS8sb2U9L14oIHsyLH18XFxcXClcXG4oPyFcXHMqJCkvLEFlPS9eKGArfFteYF0pKD86KD89IHsyLH1cXG4pfFtcXHNcXFNdKj8oPzooPz1bXFxcXDwhXFxbYCpfXXxcXGJffCQpfFteIF0oPz0gezIsfVxcbikpKS8sRD0vW1xccHtQfVxccHtTfV0vdSxLPS9bXFxzXFxwe1B9XFxwe1N9XS91LGFlPS9bXlxcc1xccHtQfVxccHtTfV0vdSxDZT1rKC9eKCg/IVsqX10pcHVuY3RTcGFjZSkvLFwidVwiKS5yZXBsYWNlKC9wdW5jdFNwYWNlL2csSykuZ2V0UmVnZXgoKSxsZT0vKD8hfilbXFxwe1B9XFxwe1N9XS91LEllPS8oPyF+KVtcXHNcXHB7UH1cXHB7U31dL3UsRWU9Lyg/OlteXFxzXFxwe1B9XFxwe1N9XXx+KS91LEJlPWsoL2xpbmt8cHJlY29kZS1jb2RlfGh0bWwvLFwiZ1wiKS5yZXBsYWNlKFwibGlua1wiLC9cXFsoPzpbXlxcW1xcXWBdfCg/PGE+YCspW15gXStcXGs8YT4oPyFgKSkqP1xcXVxcKCg/OlxcXFxbXFxzXFxTXXxbXlxcXFxcXChcXCldfFxcKCg/OlxcXFxbXFxzXFxTXXxbXlxcXFxcXChcXCldKSpcXCkpKlxcKS8pLnJlcGxhY2UoXCJwcmVjb2RlLVwiLG1lP1wiKD88IWApKClcIjpcIiheXnxbXmBdKVwiKS5yZXBsYWNlKFwiY29kZVwiLC8oPzxiPmArKVteYF0rXFxrPGI+KD8hYCkvKS5yZXBsYWNlKFwiaHRtbFwiLC88KD8hIClbXjw+XSo/Pi8pLmdldFJlZ2V4KCksdWU9L14oPzpcXCorKD86KCg/IVxcKilwdW5jdCl8W15cXHMqXSkpfF5fKyg/OigoPyFfKXB1bmN0KXwoW15cXHNfXSkpLyxxZT1rKHVlLFwidVwiKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksdmU9ayh1ZSxcInVcIikucmVwbGFjZSgvcHVuY3QvZyxsZSkuZ2V0UmVnZXgoKSxwZT1cIl5bXl8qXSo/X19bXl8qXSo/XFxcXCpbXl8qXSo/KD89X18pfFteKl0rKD89W14qXSl8KD8hXFxcXCopcHVuY3QoXFxcXCorKSg/PVtcXFxcc118JCl8bm90UHVuY3RTcGFjZShcXFxcKispKD8hXFxcXCopKD89cHVuY3RTcGFjZXwkKXwoPyFcXFxcKilwdW5jdFNwYWNlKFxcXFwqKykoPz1ub3RQdW5jdFNwYWNlKXxbXFxcXHNdKFxcXFwqKykoPyFcXFxcKikoPz1wdW5jdCl8KD8hXFxcXCopcHVuY3QoXFxcXCorKSg/IVxcXFwqKSg/PXB1bmN0KXxub3RQdW5jdFNwYWNlKFxcXFwqKykoPz1ub3RQdW5jdFNwYWNlKVwiLERlPWsocGUsXCJndVwiKS5yZXBsYWNlKC9ub3RQdW5jdFNwYWNlL2csYWUpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxLKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksSGU9ayhwZSxcImd1XCIpLnJlcGxhY2UoL25vdFB1bmN0U3BhY2UvZyxFZSkucmVwbGFjZSgvcHVuY3RTcGFjZS9nLEllKS5yZXBsYWNlKC9wdW5jdC9nLGxlKS5nZXRSZWdleCgpLFplPWsoXCJeW15fKl0qP1xcXFwqXFxcXCpbXl8qXSo/X1teXypdKj8oPz1cXFxcKlxcXFwqKXxbXl9dKyg/PVteX10pfCg/IV8pcHVuY3QoXyspKD89W1xcXFxzXXwkKXxub3RQdW5jdFNwYWNlKF8rKSg/IV8pKD89cHVuY3RTcGFjZXwkKXwoPyFfKXB1bmN0U3BhY2UoXyspKD89bm90UHVuY3RTcGFjZSl8W1xcXFxzXShfKykoPyFfKSg/PXB1bmN0KXwoPyFfKXB1bmN0KF8rKSg/IV8pKD89cHVuY3QpXCIsXCJndVwiKS5yZXBsYWNlKC9ub3RQdW5jdFNwYWNlL2csYWUpLnJlcGxhY2UoL3B1bmN0U3BhY2UvZyxLKS5yZXBsYWNlKC9wdW5jdC9nLEQpLmdldFJlZ2V4KCksR2U9aygvXFxcXChwdW5jdCkvLFwiZ3VcIikucmVwbGFjZSgvcHVuY3QvZyxEKS5nZXRSZWdleCgpLE5lPWsoL148KHNjaGVtZTpbXlxcc1xceDAwLVxceDFmPD5dKnxlbWFpbCk+LykucmVwbGFjZShcInNjaGVtZVwiLC9bYS16QS1aXVthLXpBLVowLTkrLi1dezEsMzF9LykucmVwbGFjZShcImVtYWlsXCIsL1thLXpBLVowLTkuISMkJSYnKisvPT9eX2B7fH1+LV0rKEApW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSsoPyFbLV9dKS8pLmdldFJlZ2V4KCksUWU9ayhqKS5yZXBsYWNlKFwiKD86LS0+fCQpXCIsXCItLT5cIikuZ2V0UmVnZXgoKSxGZT1rKFwiXmNvbW1lbnR8XjwvW2EtekEtWl1bXFxcXHc6LV0qXFxcXHMqPnxePFthLXpBLVpdW1xcXFx3LV0qKD86YXR0cmlidXRlKSo/XFxcXHMqLz8+fF48XFxcXD9bXFxcXHNcXFxcU10qP1xcXFw/PnxePCFbYS16QS1aXStcXFxcc1tcXFxcc1xcXFxTXSo/PnxePCFcXFxcW0NEQVRBXFxcXFtbXFxcXHNcXFxcU10qP1xcXFxdXFxcXF0+XCIpLnJlcGxhY2UoXCJjb21tZW50XCIsUWUpLnJlcGxhY2UoXCJhdHRyaWJ1dGVcIiwvXFxzK1thLXpBLVo6X11bXFx3LjotXSooPzpcXHMqPVxccypcIlteXCJdKlwifFxccyo9XFxzKidbXiddKid8XFxzKj1cXHMqW15cXHNcIic9PD5gXSspPy8pLmdldFJlZ2V4KCkscT0vKD86XFxbKD86XFxcXFtcXHNcXFNdfFteXFxbXFxdXFxcXF0pKlxcXXxcXFxcW1xcc1xcU118YCtbXmBdKj9gKyg/IWApfFteXFxbXFxdXFxcXGBdKSo/LyxqZT1rKC9eIT9cXFsobGFiZWwpXFxdXFwoXFxzKihocmVmKSg/Oig/OlsgXFx0XSooPzpcXG5bIFxcdF0qKT8pKHRpdGxlKSk/XFxzKlxcKS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLnJlcGxhY2UoXCJocmVmXCIsLzwoPzpcXFxcLnxbXlxcbjw+XFxcXF0pKz58W14gXFx0XFxuXFx4MDAtXFx4MWZdKi8pLnJlcGxhY2UoXCJ0aXRsZVwiLC9cIig/OlxcXFxcIj98W15cIlxcXFxdKSpcInwnKD86XFxcXCc/fFteJ1xcXFxdKSonfFxcKCg/OlxcXFxcXCk/fFteKVxcXFxdKSpcXCkvKS5nZXRSZWdleCgpLGNlPWsoL14hP1xcWyhsYWJlbClcXF1cXFsocmVmKVxcXS8pLnJlcGxhY2UoXCJsYWJlbFwiLHEpLnJlcGxhY2UoXCJyZWZcIixGKS5nZXRSZWdleCgpLGhlPWsoL14hP1xcWyhyZWYpXFxdKD86XFxbXFxdKT8vKS5yZXBsYWNlKFwicmVmXCIsRikuZ2V0UmVnZXgoKSxVZT1rKFwicmVmbGlua3xub2xpbmsoPyFcXFxcKClcIixcImdcIikucmVwbGFjZShcInJlZmxpbmtcIixjZSkucmVwbGFjZShcIm5vbGlua1wiLGhlKS5nZXRSZWdleCgpLG5lPS9baEhdW3RUXVt0VF1bcFBdW3NTXT98W2ZGXVt0VF1bcFBdLyxXPXtfYmFja3BlZGFsOkMsYW55UHVuY3R1YXRpb246R2UsYXV0b2xpbms6TmUsYmxvY2tTa2lwOkJlLGJyOm9lLGNvZGU6emUsZGVsOkMsZW1TdHJvbmdMRGVsaW06cWUsZW1TdHJvbmdSRGVsaW1Bc3Q6RGUsZW1TdHJvbmdSRGVsaW1VbmQ6WmUsZXNjYXBlOk1lLGxpbms6amUsbm9saW5rOmhlLHB1bmN0dWF0aW9uOkNlLHJlZmxpbms6Y2UscmVmbGlua1NlYXJjaDpVZSx0YWc6RmUsdGV4dDpBZSx1cmw6Q30sS2U9ey4uLlcsbGluazprKC9eIT9cXFsobGFiZWwpXFxdXFwoKC4qPylcXCkvKS5yZXBsYWNlKFwibGFiZWxcIixxKS5nZXRSZWdleCgpLHJlZmxpbms6aygvXiE/XFxbKGxhYmVsKVxcXVxccypcXFsoW15cXF1dKilcXF0vKS5yZXBsYWNlKFwibGFiZWxcIixxKS5nZXRSZWdleCgpfSxHPXsuLi5XLGVtU3Ryb25nUkRlbGltQXN0OkhlLGVtU3Ryb25nTERlbGltOnZlLHVybDprKC9eKCg/OnByb3RvY29sKTpcXC9cXC98d3d3XFwuKSg/OlthLXpBLVowLTlcXC1dK1xcLj8pK1teXFxzPF0qfF5lbWFpbC8pLnJlcGxhY2UoXCJwcm90b2NvbFwiLG5lKS5yZXBsYWNlKFwiZW1haWxcIiwvW0EtWmEtejAtOS5fKy1dKyhAKVthLXpBLVowLTktX10rKD86XFwuW2EtekEtWjAtOS1fXSpbYS16QS1aMC05XSkrKD8hWy1fXSkvKS5nZXRSZWdleCgpLF9iYWNrcGVkYWw6Lyg/OltePyEuLDo7Kl8nXCJ+KCkmXSt8XFwoW14pXSpcXCl8Jig/IVthLXpBLVowLTldKzskKXxbPyEuLDo7Kl8nXCJ+KV0rKD8hJCkpKy8sZGVsOi9eKH5+PykoPz1bXlxcc35dKSgoPzpcXFxcW1xcc1xcU118W15cXFxcXSkqPyg/OlxcXFxbXFxzXFxTXXxbXlxcc35cXFxcXSkpXFwxKD89W15+XXwkKS8sdGV4dDprKC9eKFtgfl0rfFteYH5dKSg/Oig/PSB7Mix9XFxuKXwoPz1bYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dK0ApfFtcXHNcXFNdKj8oPzooPz1bXFxcXDwhXFxbYCp+X118XFxiX3xwcm90b2NvbDpcXC9cXC98d3d3XFwufCQpfFteIF0oPz0gezIsfVxcbil8W15hLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0oPz1bYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dK0ApKSkvKS5yZXBsYWNlKFwicHJvdG9jb2xcIixuZSkuZ2V0UmVnZXgoKX0sV2U9ey4uLkcsYnI6ayhvZSkucmVwbGFjZShcInsyLH1cIixcIipcIikuZ2V0UmVnZXgoKSx0ZXh0OmsoRy50ZXh0KS5yZXBsYWNlKFwiXFxcXGJfXCIsXCJcXFxcYl98IHsyLH1cXFxcblwiKS5yZXBsYWNlKC9cXHsyLFxcfS9nLFwiKlwiKS5nZXRSZWdleCgpfSxFPXtub3JtYWw6VSxnZm06X2UscGVkYW50aWM6TGV9LE09e25vcm1hbDpXLGdmbTpHLGJyZWFrczpXZSxwZWRhbnRpYzpLZX07dmFyIFhlPXtcIiZcIjpcIiZhbXA7XCIsXCI8XCI6XCImbHQ7XCIsXCI+XCI6XCImZ3Q7XCIsJ1wiJzpcIiZxdW90O1wiLFwiJ1wiOlwiJiMzOTtcIn0sa2U9dT0+WGVbdV07ZnVuY3Rpb24gdyh1LGUpe2lmKGUpe2lmKG0uZXNjYXBlVGVzdC50ZXN0KHUpKXJldHVybiB1LnJlcGxhY2UobS5lc2NhcGVSZXBsYWNlLGtlKX1lbHNlIGlmKG0uZXNjYXBlVGVzdE5vRW5jb2RlLnRlc3QodSkpcmV0dXJuIHUucmVwbGFjZShtLmVzY2FwZVJlcGxhY2VOb0VuY29kZSxrZSk7cmV0dXJuIHV9ZnVuY3Rpb24gWCh1KXt0cnl7dT1lbmNvZGVVUkkodSkucmVwbGFjZShtLnBlcmNlbnREZWNvZGUsXCIlXCIpfWNhdGNoe3JldHVybiBudWxsfXJldHVybiB1fWZ1bmN0aW9uIEoodSxlKXtsZXQgdD11LnJlcGxhY2UobS5maW5kUGlwZSwoaSxzLGEpPT57bGV0IG89ITEsbD1zO2Zvcig7LS1sPj0wJiZhW2xdPT09XCJcXFxcXCI7KW89IW87cmV0dXJuIG8/XCJ8XCI6XCIgfFwifSksbj10LnNwbGl0KG0uc3BsaXRQaXBlKSxyPTA7aWYoblswXS50cmltKCl8fG4uc2hpZnQoKSxuLmxlbmd0aD4wJiYhbi5hdCgtMSk/LnRyaW0oKSYmbi5wb3AoKSxlKWlmKG4ubGVuZ3RoPmUpbi5zcGxpY2UoZSk7ZWxzZSBmb3IoO24ubGVuZ3RoPGU7KW4ucHVzaChcIlwiKTtmb3IoO3I8bi5sZW5ndGg7cisrKW5bcl09bltyXS50cmltKCkucmVwbGFjZShtLnNsYXNoUGlwZSxcInxcIik7cmV0dXJuIG59ZnVuY3Rpb24geih1LGUsdCl7bGV0IG49dS5sZW5ndGg7aWYobj09PTApcmV0dXJuXCJcIjtsZXQgcj0wO2Zvcig7cjxuOyl7bGV0IGk9dS5jaGFyQXQobi1yLTEpO2lmKGk9PT1lJiYhdClyKys7ZWxzZSBpZihpIT09ZSYmdClyKys7ZWxzZSBicmVha31yZXR1cm4gdS5zbGljZSgwLG4tcil9ZnVuY3Rpb24gZGUodSxlKXtpZih1LmluZGV4T2YoZVsxXSk9PT0tMSlyZXR1cm4tMTtsZXQgdD0wO2ZvcihsZXQgbj0wO248dS5sZW5ndGg7bisrKWlmKHVbbl09PT1cIlxcXFxcIiluKys7ZWxzZSBpZih1W25dPT09ZVswXSl0Kys7ZWxzZSBpZih1W25dPT09ZVsxXSYmKHQtLSx0PDApKXJldHVybiBuO3JldHVybiB0PjA/LTI6LTF9ZnVuY3Rpb24gZ2UodSxlLHQsbixyKXtsZXQgaT1lLmhyZWYscz1lLnRpdGxlfHxudWxsLGE9dVsxXS5yZXBsYWNlKHIub3RoZXIub3V0cHV0TGlua1JlcGxhY2UsXCIkMVwiKTtuLnN0YXRlLmluTGluaz0hMDtsZXQgbz17dHlwZTp1WzBdLmNoYXJBdCgwKT09PVwiIVwiP1wiaW1hZ2VcIjpcImxpbmtcIixyYXc6dCxocmVmOmksdGl0bGU6cyx0ZXh0OmEsdG9rZW5zOm4uaW5saW5lVG9rZW5zKGEpfTtyZXR1cm4gbi5zdGF0ZS5pbkxpbms9ITEsb31mdW5jdGlvbiBKZSh1LGUsdCl7bGV0IG49dS5tYXRjaCh0Lm90aGVyLmluZGVudENvZGVDb21wZW5zYXRpb24pO2lmKG49PT1udWxsKXJldHVybiBlO2xldCByPW5bMV07cmV0dXJuIGUuc3BsaXQoYFxuYCkubWFwKGk9PntsZXQgcz1pLm1hdGNoKHQub3RoZXIuYmVnaW5uaW5nU3BhY2UpO2lmKHM9PT1udWxsKXJldHVybiBpO2xldFthXT1zO3JldHVybiBhLmxlbmd0aD49ci5sZW5ndGg/aS5zbGljZShyLmxlbmd0aCk6aX0pLmpvaW4oYFxuYCl9dmFyIHk9Y2xhc3N7b3B0aW9ucztydWxlcztsZXhlcjtjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VH1zcGFjZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLm5ld2xpbmUuZXhlYyhlKTtpZih0JiZ0WzBdLmxlbmd0aD4wKXJldHVybnt0eXBlOlwic3BhY2VcIixyYXc6dFswXX19Y29kZShlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmNvZGUuZXhlYyhlKTtpZih0KXtsZXQgbj10WzBdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5jb2RlUmVtb3ZlSW5kZW50LFwiXCIpO3JldHVybnt0eXBlOlwiY29kZVwiLHJhdzp0WzBdLGNvZGVCbG9ja1N0eWxlOlwiaW5kZW50ZWRcIix0ZXh0OnRoaXMub3B0aW9ucy5wZWRhbnRpYz9uOnoobixgXG5gKX19fWZlbmNlcyhlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmZlbmNlcy5leGVjKGUpO2lmKHQpe2xldCBuPXRbMF0scj1KZShuLHRbM118fFwiXCIsdGhpcy5ydWxlcyk7cmV0dXJue3R5cGU6XCJjb2RlXCIscmF3Om4sbGFuZzp0WzJdP3RbMl0udHJpbSgpLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24sXCIkMVwiKTp0WzJdLHRleHQ6cn19fWhlYWRpbmcoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5oZWFkaW5nLmV4ZWMoZSk7aWYodCl7bGV0IG49dFsyXS50cmltKCk7aWYodGhpcy5ydWxlcy5vdGhlci5lbmRpbmdIYXNoLnRlc3Qobikpe2xldCByPXoobixcIiNcIik7KHRoaXMub3B0aW9ucy5wZWRhbnRpY3x8IXJ8fHRoaXMucnVsZXMub3RoZXIuZW5kaW5nU3BhY2VDaGFyLnRlc3QocikpJiYobj1yLnRyaW0oKSl9cmV0dXJue3R5cGU6XCJoZWFkaW5nXCIscmF3OnRbMF0sZGVwdGg6dFsxXS5sZW5ndGgsdGV4dDpuLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShuKX19fWhyKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suaHIuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiaHJcIixyYXc6eih0WzBdLGBcbmApfX1ibG9ja3F1b3RlKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2suYmxvY2txdW90ZS5leGVjKGUpO2lmKHQpe2xldCBuPXoodFswXSxgXG5gKS5zcGxpdChgXG5gKSxyPVwiXCIsaT1cIlwiLHM9W107Zm9yKDtuLmxlbmd0aD4wOyl7bGV0IGE9ITEsbz1bXSxsO2ZvcihsPTA7bDxuLmxlbmd0aDtsKyspaWYodGhpcy5ydWxlcy5vdGhlci5ibG9ja3F1b3RlU3RhcnQudGVzdChuW2xdKSlvLnB1c2gobltsXSksYT0hMDtlbHNlIGlmKCFhKW8ucHVzaChuW2xdKTtlbHNlIGJyZWFrO249bi5zbGljZShsKTtsZXQgcD1vLmpvaW4oYFxuYCksYz1wLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5ibG9ja3F1b3RlU2V0ZXh0UmVwbGFjZSxgXG4gICAgJDFgKS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIuYmxvY2txdW90ZVNldGV4dFJlcGxhY2UyLFwiXCIpO3I9cj9gJHtyfVxuJHtwfWA6cCxpPWk/YCR7aX1cbiR7Y31gOmM7bGV0IGc9dGhpcy5sZXhlci5zdGF0ZS50b3A7aWYodGhpcy5sZXhlci5zdGF0ZS50b3A9ITAsdGhpcy5sZXhlci5ibG9ja1Rva2VucyhjLHMsITApLHRoaXMubGV4ZXIuc3RhdGUudG9wPWcsbi5sZW5ndGg9PT0wKWJyZWFrO2xldCBoPXMuYXQoLTEpO2lmKGg/LnR5cGU9PT1cImNvZGVcIilicmVhaztpZihoPy50eXBlPT09XCJibG9ja3F1b3RlXCIpe2xldCBSPWgsZj1SLnJhdytgXG5gK24uam9pbihgXG5gKSxPPXRoaXMuYmxvY2txdW90ZShmKTtzW3MubGVuZ3RoLTFdPU8scj1yLnN1YnN0cmluZygwLHIubGVuZ3RoLVIucmF3Lmxlbmd0aCkrTy5yYXcsaT1pLnN1YnN0cmluZygwLGkubGVuZ3RoLVIudGV4dC5sZW5ndGgpK08udGV4dDticmVha31lbHNlIGlmKGg/LnR5cGU9PT1cImxpc3RcIil7bGV0IFI9aCxmPVIucmF3K2BcbmArbi5qb2luKGBcbmApLE89dGhpcy5saXN0KGYpO3Nbcy5sZW5ndGgtMV09TyxyPXIuc3Vic3RyaW5nKDAsci5sZW5ndGgtaC5yYXcubGVuZ3RoKStPLnJhdyxpPWkuc3Vic3RyaW5nKDAsaS5sZW5ndGgtUi5yYXcubGVuZ3RoKStPLnJhdyxuPWYuc3Vic3RyaW5nKHMuYXQoLTEpLnJhdy5sZW5ndGgpLnNwbGl0KGBcbmApO2NvbnRpbnVlfX1yZXR1cm57dHlwZTpcImJsb2NrcXVvdGVcIixyYXc6cix0b2tlbnM6cyx0ZXh0Oml9fX1saXN0KGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2subGlzdC5leGVjKGUpO2lmKHQpe2xldCBuPXRbMV0udHJpbSgpLHI9bi5sZW5ndGg+MSxpPXt0eXBlOlwibGlzdFwiLHJhdzpcIlwiLG9yZGVyZWQ6cixzdGFydDpyPytuLnNsaWNlKDAsLTEpOlwiXCIsbG9vc2U6ITEsaXRlbXM6W119O249cj9gXFxcXGR7MSw5fVxcXFwke24uc2xpY2UoLTEpfWA6YFxcXFwke259YCx0aGlzLm9wdGlvbnMucGVkYW50aWMmJihuPXI/bjpcIlsqKy1dXCIpO2xldCBzPXRoaXMucnVsZXMub3RoZXIubGlzdEl0ZW1SZWdleChuKSxhPSExO2Zvcig7ZTspe2xldCBsPSExLHA9XCJcIixjPVwiXCI7aWYoISh0PXMuZXhlYyhlKSl8fHRoaXMucnVsZXMuYmxvY2suaHIudGVzdChlKSlicmVhaztwPXRbMF0sZT1lLnN1YnN0cmluZyhwLmxlbmd0aCk7bGV0IGc9dFsyXS5zcGxpdChgXG5gLDEpWzBdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhYnMsTz0+XCIgXCIucmVwZWF0KDMqTy5sZW5ndGgpKSxoPWUuc3BsaXQoYFxuYCwxKVswXSxSPSFnLnRyaW0oKSxmPTA7aWYodGhpcy5vcHRpb25zLnBlZGFudGljPyhmPTIsYz1nLnRyaW1TdGFydCgpKTpSP2Y9dFsxXS5sZW5ndGgrMTooZj10WzJdLnNlYXJjaCh0aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhciksZj1mPjQ/MTpmLGM9Zy5zbGljZShmKSxmKz10WzFdLmxlbmd0aCksUiYmdGhpcy5ydWxlcy5vdGhlci5ibGFua0xpbmUudGVzdChoKSYmKHArPWgrYFxuYCxlPWUuc3Vic3RyaW5nKGgubGVuZ3RoKzEpLGw9ITApLCFsKXtsZXQgTz10aGlzLnJ1bGVzLm90aGVyLm5leHRCdWxsZXRSZWdleChmKSxWPXRoaXMucnVsZXMub3RoZXIuaHJSZWdleChmKSxZPXRoaXMucnVsZXMub3RoZXIuZmVuY2VzQmVnaW5SZWdleChmKSxlZT10aGlzLnJ1bGVzLm90aGVyLmhlYWRpbmdCZWdpblJlZ2V4KGYpLGZlPXRoaXMucnVsZXMub3RoZXIuaHRtbEJlZ2luUmVnZXgoZik7Zm9yKDtlOyl7bGV0IEg9ZS5zcGxpdChgXG5gLDEpWzBdLEE7aWYoaD1ILHRoaXMub3B0aW9ucy5wZWRhbnRpYz8oaD1oLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZU5lc3RpbmcsXCIgIFwiKSxBPWgpOkE9aC5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFiQ2hhckdsb2JhbCxcIiAgICBcIiksWS50ZXN0KGgpfHxlZS50ZXN0KGgpfHxmZS50ZXN0KGgpfHxPLnRlc3QoaCl8fFYudGVzdChoKSlicmVhaztpZihBLnNlYXJjaCh0aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhcik+PWZ8fCFoLnRyaW0oKSljKz1gXG5gK0Euc2xpY2UoZik7ZWxzZXtpZihSfHxnLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJDaGFyR2xvYmFsLFwiICAgIFwiKS5zZWFyY2godGhpcy5ydWxlcy5vdGhlci5ub25TcGFjZUNoYXIpPj00fHxZLnRlc3QoZyl8fGVlLnRlc3QoZyl8fFYudGVzdChnKSlicmVhaztjKz1gXG5gK2h9IVImJiFoLnRyaW0oKSYmKFI9ITApLHArPUgrYFxuYCxlPWUuc3Vic3RyaW5nKEgubGVuZ3RoKzEpLGc9QS5zbGljZShmKX19aS5sb29zZXx8KGE/aS5sb29zZT0hMDp0aGlzLnJ1bGVzLm90aGVyLmRvdWJsZUJsYW5rTGluZS50ZXN0KHApJiYoYT0hMCkpLGkuaXRlbXMucHVzaCh7dHlwZTpcImxpc3RfaXRlbVwiLHJhdzpwLHRhc2s6ISF0aGlzLm9wdGlvbnMuZ2ZtJiZ0aGlzLnJ1bGVzLm90aGVyLmxpc3RJc1Rhc2sudGVzdChjKSxsb29zZTohMSx0ZXh0OmMsdG9rZW5zOltdfSksaS5yYXcrPXB9bGV0IG89aS5pdGVtcy5hdCgtMSk7aWYobylvLnJhdz1vLnJhdy50cmltRW5kKCksby50ZXh0PW8udGV4dC50cmltRW5kKCk7ZWxzZSByZXR1cm47aS5yYXc9aS5yYXcudHJpbUVuZCgpO2ZvcihsZXQgbCBvZiBpLml0ZW1zKXtpZih0aGlzLmxleGVyLnN0YXRlLnRvcD0hMSxsLnRva2Vucz10aGlzLmxleGVyLmJsb2NrVG9rZW5zKGwudGV4dCxbXSksbC50YXNrKXtpZihsLnRleHQ9bC50ZXh0LnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIiksbC50b2tlbnNbMF0/LnR5cGU9PT1cInRleHRcInx8bC50b2tlbnNbMF0/LnR5cGU9PT1cInBhcmFncmFwaFwiKXtsLnRva2Vuc1swXS5yYXc9bC50b2tlbnNbMF0ucmF3LnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIiksbC50b2tlbnNbMF0udGV4dD1sLnRva2Vuc1swXS50ZXh0LnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5saXN0UmVwbGFjZVRhc2ssXCJcIik7Zm9yKGxldCBjPXRoaXMubGV4ZXIuaW5saW5lUXVldWUubGVuZ3RoLTE7Yz49MDtjLS0paWYodGhpcy5ydWxlcy5vdGhlci5saXN0SXNUYXNrLnRlc3QodGhpcy5sZXhlci5pbmxpbmVRdWV1ZVtjXS5zcmMpKXt0aGlzLmxleGVyLmlubGluZVF1ZXVlW2NdLnNyYz10aGlzLmxleGVyLmlubGluZVF1ZXVlW2NdLnNyYy5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubGlzdFJlcGxhY2VUYXNrLFwiXCIpO2JyZWFrfX1sZXQgcD10aGlzLnJ1bGVzLm90aGVyLmxpc3RUYXNrQ2hlY2tib3guZXhlYyhsLnJhdyk7aWYocCl7bGV0IGM9e3R5cGU6XCJjaGVja2JveFwiLHJhdzpwWzBdK1wiIFwiLGNoZWNrZWQ6cFswXSE9PVwiWyBdXCJ9O2wuY2hlY2tlZD1jLmNoZWNrZWQsaS5sb29zZT9sLnRva2Vuc1swXSYmW1wicGFyYWdyYXBoXCIsXCJ0ZXh0XCJdLmluY2x1ZGVzKGwudG9rZW5zWzBdLnR5cGUpJiZcInRva2Vuc1wiaW4gbC50b2tlbnNbMF0mJmwudG9rZW5zWzBdLnRva2Vucz8obC50b2tlbnNbMF0ucmF3PWMucmF3K2wudG9rZW5zWzBdLnJhdyxsLnRva2Vuc1swXS50ZXh0PWMucmF3K2wudG9rZW5zWzBdLnRleHQsbC50b2tlbnNbMF0udG9rZW5zLnVuc2hpZnQoYykpOmwudG9rZW5zLnVuc2hpZnQoe3R5cGU6XCJwYXJhZ3JhcGhcIixyYXc6Yy5yYXcsdGV4dDpjLnJhdyx0b2tlbnM6W2NdfSk6bC50b2tlbnMudW5zaGlmdChjKX19aWYoIWkubG9vc2Upe2xldCBwPWwudG9rZW5zLmZpbHRlcihnPT5nLnR5cGU9PT1cInNwYWNlXCIpLGM9cC5sZW5ndGg+MCYmcC5zb21lKGc9PnRoaXMucnVsZXMub3RoZXIuYW55TGluZS50ZXN0KGcucmF3KSk7aS5sb29zZT1jfX1pZihpLmxvb3NlKWZvcihsZXQgbCBvZiBpLml0ZW1zKXtsLmxvb3NlPSEwO2ZvcihsZXQgcCBvZiBsLnRva2VucylwLnR5cGU9PT1cInRleHRcIiYmKHAudHlwZT1cInBhcmFncmFwaFwiKX1yZXR1cm4gaX19aHRtbChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLmh0bWwuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiaHRtbFwiLGJsb2NrOiEwLHJhdzp0WzBdLHByZTp0WzFdPT09XCJwcmVcInx8dFsxXT09PVwic2NyaXB0XCJ8fHRbMV09PT1cInN0eWxlXCIsdGV4dDp0WzBdfX1kZWYoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay5kZWYuZXhlYyhlKTtpZih0KXtsZXQgbj10WzFdLnRvTG93ZXJDYXNlKCkucmVwbGFjZSh0aGlzLnJ1bGVzLm90aGVyLm11bHRpcGxlU3BhY2VHbG9iYWwsXCIgXCIpLHI9dFsyXT90WzJdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5ocmVmQnJhY2tldHMsXCIkMVwiKS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIik6XCJcIixpPXRbM10/dFszXS5zdWJzdHJpbmcoMSx0WzNdLmxlbmd0aC0xKS5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLmFueVB1bmN0dWF0aW9uLFwiJDFcIik6dFszXTtyZXR1cm57dHlwZTpcImRlZlwiLHRhZzpuLHJhdzp0WzBdLGhyZWY6cix0aXRsZTppfX19dGFibGUoZSl7bGV0IHQ9dGhpcy5ydWxlcy5ibG9jay50YWJsZS5leGVjKGUpO2lmKCF0fHwhdGhpcy5ydWxlcy5vdGhlci50YWJsZURlbGltaXRlci50ZXN0KHRbMl0pKXJldHVybjtsZXQgbj1KKHRbMV0pLHI9dFsyXS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIudGFibGVBbGlnbkNoYXJzLFwiXCIpLnNwbGl0KFwifFwiKSxpPXRbM10/LnRyaW0oKT90WzNdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci50YWJsZVJvd0JsYW5rTGluZSxcIlwiKS5zcGxpdChgXG5gKTpbXSxzPXt0eXBlOlwidGFibGVcIixyYXc6dFswXSxoZWFkZXI6W10sYWxpZ246W10scm93czpbXX07aWYobi5sZW5ndGg9PT1yLmxlbmd0aCl7Zm9yKGxldCBhIG9mIHIpdGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduUmlnaHQudGVzdChhKT9zLmFsaWduLnB1c2goXCJyaWdodFwiKTp0aGlzLnJ1bGVzLm90aGVyLnRhYmxlQWxpZ25DZW50ZXIudGVzdChhKT9zLmFsaWduLnB1c2goXCJjZW50ZXJcIik6dGhpcy5ydWxlcy5vdGhlci50YWJsZUFsaWduTGVmdC50ZXN0KGEpP3MuYWxpZ24ucHVzaChcImxlZnRcIik6cy5hbGlnbi5wdXNoKG51bGwpO2ZvcihsZXQgYT0wO2E8bi5sZW5ndGg7YSsrKXMuaGVhZGVyLnB1c2goe3RleHQ6blthXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUoblthXSksaGVhZGVyOiEwLGFsaWduOnMuYWxpZ25bYV19KTtmb3IobGV0IGEgb2YgaSlzLnJvd3MucHVzaChKKGEscy5oZWFkZXIubGVuZ3RoKS5tYXAoKG8sbCk9Pih7dGV4dDpvLHRva2Vuczp0aGlzLmxleGVyLmlubGluZShvKSxoZWFkZXI6ITEsYWxpZ246cy5hbGlnbltsXX0pKSk7cmV0dXJuIHN9fWxoZWFkaW5nKGUpe2xldCB0PXRoaXMucnVsZXMuYmxvY2subGhlYWRpbmcuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiaGVhZGluZ1wiLHJhdzp0WzBdLGRlcHRoOnRbMl0uY2hhckF0KDApPT09XCI9XCI/MToyLHRleHQ6dFsxXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUodFsxXSl9fXBhcmFncmFwaChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLnBhcmFncmFwaC5leGVjKGUpO2lmKHQpe2xldCBuPXRbMV0uY2hhckF0KHRbMV0ubGVuZ3RoLTEpPT09YFxuYD90WzFdLnNsaWNlKDAsLTEpOnRbMV07cmV0dXJue3R5cGU6XCJwYXJhZ3JhcGhcIixyYXc6dFswXSx0ZXh0Om4sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lKG4pfX19dGV4dChlKXtsZXQgdD10aGlzLnJ1bGVzLmJsb2NrLnRleHQuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwidGV4dFwiLHJhdzp0WzBdLHRleHQ6dFswXSx0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmUodFswXSl9fWVzY2FwZShlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5lc2NhcGUuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiZXNjYXBlXCIscmF3OnRbMF0sdGV4dDp0WzFdfX10YWcoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUudGFnLmV4ZWMoZSk7aWYodClyZXR1cm4hdGhpcy5sZXhlci5zdGF0ZS5pbkxpbmsmJnRoaXMucnVsZXMub3RoZXIuc3RhcnRBVGFnLnRlc3QodFswXSk/dGhpcy5sZXhlci5zdGF0ZS5pbkxpbms9ITA6dGhpcy5sZXhlci5zdGF0ZS5pbkxpbmsmJnRoaXMucnVsZXMub3RoZXIuZW5kQVRhZy50ZXN0KHRbMF0pJiYodGhpcy5sZXhlci5zdGF0ZS5pbkxpbms9ITEpLCF0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2smJnRoaXMucnVsZXMub3RoZXIuc3RhcnRQcmVTY3JpcHRUYWcudGVzdCh0WzBdKT90aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2s9ITA6dGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrJiZ0aGlzLnJ1bGVzLm90aGVyLmVuZFByZVNjcmlwdFRhZy50ZXN0KHRbMF0pJiYodGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrPSExKSx7dHlwZTpcImh0bWxcIixyYXc6dFswXSxpbkxpbms6dGhpcy5sZXhlci5zdGF0ZS5pbkxpbmssaW5SYXdCbG9jazp0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2ssYmxvY2s6ITEsdGV4dDp0WzBdfX1saW5rKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmxpbmsuZXhlYyhlKTtpZih0KXtsZXQgbj10WzJdLnRyaW0oKTtpZighdGhpcy5vcHRpb25zLnBlZGFudGljJiZ0aGlzLnJ1bGVzLm90aGVyLnN0YXJ0QW5nbGVCcmFja2V0LnRlc3Qobikpe2lmKCF0aGlzLnJ1bGVzLm90aGVyLmVuZEFuZ2xlQnJhY2tldC50ZXN0KG4pKXJldHVybjtsZXQgcz16KG4uc2xpY2UoMCwtMSksXCJcXFxcXCIpO2lmKChuLmxlbmd0aC1zLmxlbmd0aCklMj09PTApcmV0dXJufWVsc2V7bGV0IHM9ZGUodFsyXSxcIigpXCIpO2lmKHM9PT0tMilyZXR1cm47aWYocz4tMSl7bGV0IG89KHRbMF0uaW5kZXhPZihcIiFcIik9PT0wPzU6NCkrdFsxXS5sZW5ndGgrczt0WzJdPXRbMl0uc3Vic3RyaW5nKDAscyksdFswXT10WzBdLnN1YnN0cmluZygwLG8pLnRyaW0oKSx0WzNdPVwiXCJ9fWxldCByPXRbMl0saT1cIlwiO2lmKHRoaXMub3B0aW9ucy5wZWRhbnRpYyl7bGV0IHM9dGhpcy5ydWxlcy5vdGhlci5wZWRhbnRpY0hyZWZUaXRsZS5leGVjKHIpO3MmJihyPXNbMV0saT1zWzNdKX1lbHNlIGk9dFszXT90WzNdLnNsaWNlKDEsLTEpOlwiXCI7cmV0dXJuIHI9ci50cmltKCksdGhpcy5ydWxlcy5vdGhlci5zdGFydEFuZ2xlQnJhY2tldC50ZXN0KHIpJiYodGhpcy5vcHRpb25zLnBlZGFudGljJiYhdGhpcy5ydWxlcy5vdGhlci5lbmRBbmdsZUJyYWNrZXQudGVzdChuKT9yPXIuc2xpY2UoMSk6cj1yLnNsaWNlKDEsLTEpKSxnZSh0LHtocmVmOnImJnIucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpLHRpdGxlOmkmJmkucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbixcIiQxXCIpfSx0WzBdLHRoaXMubGV4ZXIsdGhpcy5ydWxlcyl9fXJlZmxpbmsoZSx0KXtsZXQgbjtpZigobj10aGlzLnJ1bGVzLmlubGluZS5yZWZsaW5rLmV4ZWMoZSkpfHwobj10aGlzLnJ1bGVzLmlubGluZS5ub2xpbmsuZXhlYyhlKSkpe2xldCByPShuWzJdfHxuWzFdKS5yZXBsYWNlKHRoaXMucnVsZXMub3RoZXIubXVsdGlwbGVTcGFjZUdsb2JhbCxcIiBcIiksaT10W3IudG9Mb3dlckNhc2UoKV07aWYoIWkpe2xldCBzPW5bMF0uY2hhckF0KDApO3JldHVybnt0eXBlOlwidGV4dFwiLHJhdzpzLHRleHQ6c319cmV0dXJuIGdlKG4saSxuWzBdLHRoaXMubGV4ZXIsdGhpcy5ydWxlcyl9fWVtU3Ryb25nKGUsdCxuPVwiXCIpe2xldCByPXRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nTERlbGltLmV4ZWMoZSk7aWYoIXJ8fHJbM10mJm4ubWF0Y2godGhpcy5ydWxlcy5vdGhlci51bmljb2RlQWxwaGFOdW1lcmljKSlyZXR1cm47aWYoIShyWzFdfHxyWzJdfHxcIlwiKXx8IW58fHRoaXMucnVsZXMuaW5saW5lLnB1bmN0dWF0aW9uLmV4ZWMobikpe2xldCBzPVsuLi5yWzBdXS5sZW5ndGgtMSxhLG8sbD1zLHA9MCxjPXJbMF1bMF09PT1cIipcIj90aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZ1JEZWxpbUFzdDp0aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZ1JEZWxpbVVuZDtmb3IoYy5sYXN0SW5kZXg9MCx0PXQuc2xpY2UoLTEqZS5sZW5ndGgrcyk7KHI9Yy5leGVjKHQpKSE9bnVsbDspe2lmKGE9clsxXXx8clsyXXx8clszXXx8cls0XXx8cls1XXx8cls2XSwhYSljb250aW51ZTtpZihvPVsuLi5hXS5sZW5ndGgsclszXXx8cls0XSl7bCs9bztjb250aW51ZX1lbHNlIGlmKChyWzVdfHxyWzZdKSYmcyUzJiYhKChzK28pJTMpKXtwKz1vO2NvbnRpbnVlfWlmKGwtPW8sbD4wKWNvbnRpbnVlO289TWF0aC5taW4obyxvK2wrcCk7bGV0IGc9Wy4uLnJbMF1dWzBdLmxlbmd0aCxoPWUuc2xpY2UoMCxzK3IuaW5kZXgrZytvKTtpZihNYXRoLm1pbihzLG8pJTIpe2xldCBmPWguc2xpY2UoMSwtMSk7cmV0dXJue3R5cGU6XCJlbVwiLHJhdzpoLHRleHQ6Zix0b2tlbnM6dGhpcy5sZXhlci5pbmxpbmVUb2tlbnMoZil9fWxldCBSPWguc2xpY2UoMiwtMik7cmV0dXJue3R5cGU6XCJzdHJvbmdcIixyYXc6aCx0ZXh0OlIsdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKFIpfX19fWNvZGVzcGFuKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmNvZGUuZXhlYyhlKTtpZih0KXtsZXQgbj10WzJdLnJlcGxhY2UodGhpcy5ydWxlcy5vdGhlci5uZXdMaW5lQ2hhckdsb2JhbCxcIiBcIikscj10aGlzLnJ1bGVzLm90aGVyLm5vblNwYWNlQ2hhci50ZXN0KG4pLGk9dGhpcy5ydWxlcy5vdGhlci5zdGFydGluZ1NwYWNlQ2hhci50ZXN0KG4pJiZ0aGlzLnJ1bGVzLm90aGVyLmVuZGluZ1NwYWNlQ2hhci50ZXN0KG4pO3JldHVybiByJiZpJiYobj1uLnN1YnN0cmluZygxLG4ubGVuZ3RoLTEpKSx7dHlwZTpcImNvZGVzcGFuXCIscmF3OnRbMF0sdGV4dDpufX19YnIoZSl7bGV0IHQ9dGhpcy5ydWxlcy5pbmxpbmUuYnIuZXhlYyhlKTtpZih0KXJldHVybnt0eXBlOlwiYnJcIixyYXc6dFswXX19ZGVsKGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLmRlbC5leGVjKGUpO2lmKHQpcmV0dXJue3R5cGU6XCJkZWxcIixyYXc6dFswXSx0ZXh0OnRbMl0sdG9rZW5zOnRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKHRbMl0pfX1hdXRvbGluayhlKXtsZXQgdD10aGlzLnJ1bGVzLmlubGluZS5hdXRvbGluay5leGVjKGUpO2lmKHQpe2xldCBuLHI7cmV0dXJuIHRbMl09PT1cIkBcIj8obj10WzFdLHI9XCJtYWlsdG86XCIrbik6KG49dFsxXSxyPW4pLHt0eXBlOlwibGlua1wiLHJhdzp0WzBdLHRleHQ6bixocmVmOnIsdG9rZW5zOlt7dHlwZTpcInRleHRcIixyYXc6bix0ZXh0Om59XX19fXVybChlKXtsZXQgdDtpZih0PXRoaXMucnVsZXMuaW5saW5lLnVybC5leGVjKGUpKXtsZXQgbixyO2lmKHRbMl09PT1cIkBcIiluPXRbMF0scj1cIm1haWx0bzpcIituO2Vsc2V7bGV0IGk7ZG8gaT10WzBdLHRbMF09dGhpcy5ydWxlcy5pbmxpbmUuX2JhY2twZWRhbC5leGVjKHRbMF0pPy5bMF0/P1wiXCI7d2hpbGUoaSE9PXRbMF0pO249dFswXSx0WzFdPT09XCJ3d3cuXCI/cj1cImh0dHA6Ly9cIit0WzBdOnI9dFswXX1yZXR1cm57dHlwZTpcImxpbmtcIixyYXc6dFswXSx0ZXh0Om4saHJlZjpyLHRva2Vuczpbe3R5cGU6XCJ0ZXh0XCIscmF3Om4sdGV4dDpufV19fX1pbmxpbmVUZXh0KGUpe2xldCB0PXRoaXMucnVsZXMuaW5saW5lLnRleHQuZXhlYyhlKTtpZih0KXtsZXQgbj10aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2s7cmV0dXJue3R5cGU6XCJ0ZXh0XCIscmF3OnRbMF0sdGV4dDp0WzBdLGVzY2FwZWQ6bn19fX07dmFyIHg9Y2xhc3MgdXt0b2tlbnM7b3B0aW9ucztzdGF0ZTtpbmxpbmVRdWV1ZTt0b2tlbml6ZXI7Y29uc3RydWN0b3IoZSl7dGhpcy50b2tlbnM9W10sdGhpcy50b2tlbnMubGlua3M9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLm9wdGlvbnM9ZXx8VCx0aGlzLm9wdGlvbnMudG9rZW5pemVyPXRoaXMub3B0aW9ucy50b2tlbml6ZXJ8fG5ldyB5LHRoaXMudG9rZW5pemVyPXRoaXMub3B0aW9ucy50b2tlbml6ZXIsdGhpcy50b2tlbml6ZXIub3B0aW9ucz10aGlzLm9wdGlvbnMsdGhpcy50b2tlbml6ZXIubGV4ZXI9dGhpcyx0aGlzLmlubGluZVF1ZXVlPVtdLHRoaXMuc3RhdGU9e2luTGluazohMSxpblJhd0Jsb2NrOiExLHRvcDohMH07bGV0IHQ9e290aGVyOm0sYmxvY2s6RS5ub3JtYWwsaW5saW5lOk0ubm9ybWFsfTt0aGlzLm9wdGlvbnMucGVkYW50aWM/KHQuYmxvY2s9RS5wZWRhbnRpYyx0LmlubGluZT1NLnBlZGFudGljKTp0aGlzLm9wdGlvbnMuZ2ZtJiYodC5ibG9jaz1FLmdmbSx0aGlzLm9wdGlvbnMuYnJlYWtzP3QuaW5saW5lPU0uYnJlYWtzOnQuaW5saW5lPU0uZ2ZtKSx0aGlzLnRva2VuaXplci5ydWxlcz10fXN0YXRpYyBnZXQgcnVsZXMoKXtyZXR1cm57YmxvY2s6RSxpbmxpbmU6TX19c3RhdGljIGxleChlLHQpe3JldHVybiBuZXcgdSh0KS5sZXgoZSl9c3RhdGljIGxleElubGluZShlLHQpe3JldHVybiBuZXcgdSh0KS5pbmxpbmVUb2tlbnMoZSl9bGV4KGUpe2U9ZS5yZXBsYWNlKG0uY2FycmlhZ2VSZXR1cm4sYFxuYCksdGhpcy5ibG9ja1Rva2VucyhlLHRoaXMudG9rZW5zKTtmb3IobGV0IHQ9MDt0PHRoaXMuaW5saW5lUXVldWUubGVuZ3RoO3QrKyl7bGV0IG49dGhpcy5pbmxpbmVRdWV1ZVt0XTt0aGlzLmlubGluZVRva2VucyhuLnNyYyxuLnRva2Vucyl9cmV0dXJuIHRoaXMuaW5saW5lUXVldWU9W10sdGhpcy50b2tlbnN9YmxvY2tUb2tlbnMoZSx0PVtdLG49ITEpe2Zvcih0aGlzLm9wdGlvbnMucGVkYW50aWMmJihlPWUucmVwbGFjZShtLnRhYkNoYXJHbG9iYWwsXCIgICAgXCIpLnJlcGxhY2UobS5zcGFjZUxpbmUsXCJcIikpO2U7KXtsZXQgcjtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uYmxvY2s/LnNvbWUocz0+KHI9cy5jYWxsKHtsZXhlcjp0aGlzfSxlLHQpKT8oZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKSwhMCk6ITEpKWNvbnRpbnVlO2lmKHI9dGhpcy50b2tlbml6ZXIuc3BhY2UoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtyLnJhdy5sZW5ndGg9PT0xJiZzIT09dm9pZCAwP3MucmF3Kz1gXG5gOnQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmNvZGUoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtzPy50eXBlPT09XCJwYXJhZ3JhcGhcInx8cz8udHlwZT09PVwidGV4dFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IudGV4dCx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5mZW5jZXMoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5oZWFkaW5nKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIuaHIoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5ibG9ja3F1b3RlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIubGlzdChlKSl7ZT1lLnN1YnN0cmluZyhyLnJhdy5sZW5ndGgpLHQucHVzaChyKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLmh0bWwoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9aWYocj10aGlzLnRva2VuaXplci5kZWYoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtzPy50eXBlPT09XCJwYXJhZ3JhcGhcInx8cz8udHlwZT09PVwidGV4dFwiPyhzLnJhdys9KHMucmF3LmVuZHNXaXRoKGBcbmApP1wiXCI6YFxuYCkrci5yYXcscy50ZXh0Kz1gXG5gK3IucmF3LHRoaXMuaW5saW5lUXVldWUuYXQoLTEpLnNyYz1zLnRleHQpOnRoaXMudG9rZW5zLmxpbmtzW3IudGFnXXx8KHRoaXMudG9rZW5zLmxpbmtzW3IudGFnXT17aHJlZjpyLmhyZWYsdGl0bGU6ci50aXRsZX0sdC5wdXNoKHIpKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLnRhYmxlKGUpKXtlPWUuc3Vic3RyaW5nKHIucmF3Lmxlbmd0aCksdC5wdXNoKHIpO2NvbnRpbnVlfWlmKHI9dGhpcy50b2tlbml6ZXIubGhlYWRpbmcoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKSx0LnB1c2gocik7Y29udGludWV9bGV0IGk9ZTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uc3RhcnRCbG9jayl7bGV0IHM9MS8wLGE9ZS5zbGljZSgxKSxvO3RoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0QmxvY2suZm9yRWFjaChsPT57bz1sLmNhbGwoe2xleGVyOnRoaXN9LGEpLHR5cGVvZiBvPT1cIm51bWJlclwiJiZvPj0wJiYocz1NYXRoLm1pbihzLG8pKX0pLHM8MS8wJiZzPj0wJiYoaT1lLnN1YnN0cmluZygwLHMrMSkpfWlmKHRoaXMuc3RhdGUudG9wJiYocj10aGlzLnRva2VuaXplci5wYXJhZ3JhcGgoaSkpKXtsZXQgcz10LmF0KC0xKTtuJiZzPy50eXBlPT09XCJwYXJhZ3JhcGhcIj8ocy5yYXcrPShzLnJhdy5lbmRzV2l0aChgXG5gKT9cIlwiOmBcbmApK3IucmF3LHMudGV4dCs9YFxuYCtyLnRleHQsdGhpcy5pbmxpbmVRdWV1ZS5wb3AoKSx0aGlzLmlubGluZVF1ZXVlLmF0KC0xKS5zcmM9cy50ZXh0KTp0LnB1c2gociksbj1pLmxlbmd0aCE9PWUubGVuZ3RoLGU9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtjb250aW51ZX1pZihyPXRoaXMudG9rZW5pemVyLnRleHQoZSkpe2U9ZS5zdWJzdHJpbmcoci5yYXcubGVuZ3RoKTtsZXQgcz10LmF0KC0xKTtzPy50eXBlPT09XCJ0ZXh0XCI/KHMucmF3Kz0ocy5yYXcuZW5kc1dpdGgoYFxuYCk/XCJcIjpgXG5gKStyLnJhdyxzLnRleHQrPWBcbmArci50ZXh0LHRoaXMuaW5saW5lUXVldWUucG9wKCksdGhpcy5pbmxpbmVRdWV1ZS5hdCgtMSkuc3JjPXMudGV4dCk6dC5wdXNoKHIpO2NvbnRpbnVlfWlmKGUpe2xldCBzPVwiSW5maW5pdGUgbG9vcCBvbiBieXRlOiBcIitlLmNoYXJDb2RlQXQoMCk7aWYodGhpcy5vcHRpb25zLnNpbGVudCl7Y29uc29sZS5lcnJvcihzKTticmVha31lbHNlIHRocm93IG5ldyBFcnJvcihzKX19cmV0dXJuIHRoaXMuc3RhdGUudG9wPSEwLHR9aW5saW5lKGUsdD1bXSl7cmV0dXJuIHRoaXMuaW5saW5lUXVldWUucHVzaCh7c3JjOmUsdG9rZW5zOnR9KSx0fWlubGluZVRva2VucyhlLHQ9W10pe2xldCBuPWUscj1udWxsO2lmKHRoaXMudG9rZW5zLmxpbmtzKXtsZXQgbz1PYmplY3Qua2V5cyh0aGlzLnRva2Vucy5saW5rcyk7aWYoby5sZW5ndGg+MClmb3IoOyhyPXRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5yZWZsaW5rU2VhcmNoLmV4ZWMobikpIT1udWxsOylvLmluY2x1ZGVzKHJbMF0uc2xpY2UoclswXS5sYXN0SW5kZXhPZihcIltcIikrMSwtMSkpJiYobj1uLnNsaWNlKDAsci5pbmRleCkrXCJbXCIrXCJhXCIucmVwZWF0KHJbMF0ubGVuZ3RoLTIpK1wiXVwiK24uc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLnJlZmxpbmtTZWFyY2gubGFzdEluZGV4KSl9Zm9yKDsocj10aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYW55UHVuY3R1YXRpb24uZXhlYyhuKSkhPW51bGw7KW49bi5zbGljZSgwLHIuaW5kZXgpK1wiKytcIituLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5hbnlQdW5jdHVhdGlvbi5sYXN0SW5kZXgpO2xldCBpO2Zvcig7KHI9dGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmJsb2NrU2tpcC5leGVjKG4pKSE9bnVsbDspaT1yWzJdP3JbMl0ubGVuZ3RoOjAsbj1uLnNsaWNlKDAsci5pbmRleCtpKStcIltcIitcImFcIi5yZXBlYXQoclswXS5sZW5ndGgtaS0yKStcIl1cIituLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5ibG9ja1NraXAubGFzdEluZGV4KTtuPXRoaXMub3B0aW9ucy5ob29rcz8uZW1TdHJvbmdNYXNrPy5jYWxsKHtsZXhlcjp0aGlzfSxuKT8/bjtsZXQgcz0hMSxhPVwiXCI7Zm9yKDtlOyl7c3x8KGE9XCJcIikscz0hMTtsZXQgbztpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8uaW5saW5lPy5zb21lKHA9PihvPXAuY2FsbCh7bGV4ZXI6dGhpc30sZSx0KSk/KGU9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyksITApOiExKSljb250aW51ZTtpZihvPXRoaXMudG9rZW5pemVyLmVzY2FwZShlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLnRhZyhlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmxpbmsoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5yZWZsaW5rKGUsdGhpcy50b2tlbnMubGlua3MpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCk7bGV0IHA9dC5hdCgtMSk7by50eXBlPT09XCJ0ZXh0XCImJnA/LnR5cGU9PT1cInRleHRcIj8ocC5yYXcrPW8ucmF3LHAudGV4dCs9by50ZXh0KTp0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5lbVN0cm9uZyhlLG4sYSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYobz10aGlzLnRva2VuaXplci5jb2Rlc3BhbihlKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLHQucHVzaChvKTtjb250aW51ZX1pZihvPXRoaXMudG9rZW5pemVyLmJyKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuZGVsKGUpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWlmKG89dGhpcy50b2tlbml6ZXIuYXV0b2xpbmsoZSkpe2U9ZS5zdWJzdHJpbmcoby5yYXcubGVuZ3RoKSx0LnB1c2gobyk7Y29udGludWV9aWYoIXRoaXMuc3RhdGUuaW5MaW5rJiYobz10aGlzLnRva2VuaXplci51cmwoZSkpKXtlPWUuc3Vic3RyaW5nKG8ucmF3Lmxlbmd0aCksdC5wdXNoKG8pO2NvbnRpbnVlfWxldCBsPWU7aWYodGhpcy5vcHRpb25zLmV4dGVuc2lvbnM/LnN0YXJ0SW5saW5lKXtsZXQgcD0xLzAsYz1lLnNsaWNlKDEpLGc7dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRJbmxpbmUuZm9yRWFjaChoPT57Zz1oLmNhbGwoe2xleGVyOnRoaXN9LGMpLHR5cGVvZiBnPT1cIm51bWJlclwiJiZnPj0wJiYocD1NYXRoLm1pbihwLGcpKX0pLHA8MS8wJiZwPj0wJiYobD1lLnN1YnN0cmluZygwLHArMSkpfWlmKG89dGhpcy50b2tlbml6ZXIuaW5saW5lVGV4dChsKSl7ZT1lLnN1YnN0cmluZyhvLnJhdy5sZW5ndGgpLG8ucmF3LnNsaWNlKC0xKSE9PVwiX1wiJiYoYT1vLnJhdy5zbGljZSgtMSkpLHM9ITA7bGV0IHA9dC5hdCgtMSk7cD8udHlwZT09PVwidGV4dFwiPyhwLnJhdys9by5yYXcscC50ZXh0Kz1vLnRleHQpOnQucHVzaChvKTtjb250aW51ZX1pZihlKXtsZXQgcD1cIkluZmluaXRlIGxvb3Agb24gYnl0ZTogXCIrZS5jaGFyQ29kZUF0KDApO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpe2NvbnNvbGUuZXJyb3IocCk7YnJlYWt9ZWxzZSB0aHJvdyBuZXcgRXJyb3IocCl9fXJldHVybiB0fX07dmFyIFA9Y2xhc3N7b3B0aW9ucztwYXJzZXI7Y29uc3RydWN0b3IoZSl7dGhpcy5vcHRpb25zPWV8fFR9c3BhY2UoZSl7cmV0dXJuXCJcIn1jb2RlKHt0ZXh0OmUsbGFuZzp0LGVzY2FwZWQ6bn0pe2xldCByPSh0fHxcIlwiKS5tYXRjaChtLm5vdFNwYWNlU3RhcnQpPy5bMF0saT1lLnJlcGxhY2UobS5lbmRpbmdOZXdsaW5lLFwiXCIpK2BcbmA7cmV0dXJuIHI/JzxwcmU+PGNvZGUgY2xhc3M9XCJsYW5ndWFnZS0nK3cocikrJ1wiPicrKG4/aTp3KGksITApKStgPC9jb2RlPjwvcHJlPlxuYDpcIjxwcmU+PGNvZGU+XCIrKG4/aTp3KGksITApKStgPC9jb2RlPjwvcHJlPlxuYH1ibG9ja3F1b3RlKHt0b2tlbnM6ZX0pe3JldHVybmA8YmxvY2txdW90ZT5cbiR7dGhpcy5wYXJzZXIucGFyc2UoZSl9PC9ibG9ja3F1b3RlPlxuYH1odG1sKHt0ZXh0OmV9KXtyZXR1cm4gZX1kZWYoZSl7cmV0dXJuXCJcIn1oZWFkaW5nKHt0b2tlbnM6ZSxkZXB0aDp0fSl7cmV0dXJuYDxoJHt0fT4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvaCR7dH0+XG5gfWhyKGUpe3JldHVybmA8aHI+XG5gfWxpc3QoZSl7bGV0IHQ9ZS5vcmRlcmVkLG49ZS5zdGFydCxyPVwiXCI7Zm9yKGxldCBhPTA7YTxlLml0ZW1zLmxlbmd0aDthKyspe2xldCBvPWUuaXRlbXNbYV07cis9dGhpcy5saXN0aXRlbShvKX1sZXQgaT10P1wib2xcIjpcInVsXCIscz10JiZuIT09MT8nIHN0YXJ0PVwiJytuKydcIic6XCJcIjtyZXR1cm5cIjxcIitpK3MrYD5cbmArcitcIjwvXCIraStgPlxuYH1saXN0aXRlbShlKXtyZXR1cm5gPGxpPiR7dGhpcy5wYXJzZXIucGFyc2UoZS50b2tlbnMpfTwvbGk+XG5gfWNoZWNrYm94KHtjaGVja2VkOmV9KXtyZXR1cm5cIjxpbnB1dCBcIisoZT8nY2hlY2tlZD1cIlwiICc6XCJcIikrJ2Rpc2FibGVkPVwiXCIgdHlwZT1cImNoZWNrYm94XCI+ICd9cGFyYWdyYXBoKHt0b2tlbnM6ZX0pe3JldHVybmA8cD4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvcD5cbmB9dGFibGUoZSl7bGV0IHQ9XCJcIixuPVwiXCI7Zm9yKGxldCBpPTA7aTxlLmhlYWRlci5sZW5ndGg7aSsrKW4rPXRoaXMudGFibGVjZWxsKGUuaGVhZGVyW2ldKTt0Kz10aGlzLnRhYmxlcm93KHt0ZXh0Om59KTtsZXQgcj1cIlwiO2ZvcihsZXQgaT0wO2k8ZS5yb3dzLmxlbmd0aDtpKyspe2xldCBzPWUucm93c1tpXTtuPVwiXCI7Zm9yKGxldCBhPTA7YTxzLmxlbmd0aDthKyspbis9dGhpcy50YWJsZWNlbGwoc1thXSk7cis9dGhpcy50YWJsZXJvdyh7dGV4dDpufSl9cmV0dXJuIHImJihyPWA8dGJvZHk+JHtyfTwvdGJvZHk+YCksYDx0YWJsZT5cbjx0aGVhZD5cbmArdCtgPC90aGVhZD5cbmArcitgPC90YWJsZT5cbmB9dGFibGVyb3coe3RleHQ6ZX0pe3JldHVybmA8dHI+XG4ke2V9PC90cj5cbmB9dGFibGVjZWxsKGUpe2xldCB0PXRoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUudG9rZW5zKSxuPWUuaGVhZGVyP1widGhcIjpcInRkXCI7cmV0dXJuKGUuYWxpZ24/YDwke259IGFsaWduPVwiJHtlLmFsaWdufVwiPmA6YDwke259PmApK3QrYDwvJHtufT5cbmB9c3Ryb25nKHt0b2tlbnM6ZX0pe3JldHVybmA8c3Ryb25nPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9zdHJvbmc+YH1lbSh7dG9rZW5zOmV9KXtyZXR1cm5gPGVtPiR7dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUoZSl9PC9lbT5gfWNvZGVzcGFuKHt0ZXh0OmV9KXtyZXR1cm5gPGNvZGU+JHt3KGUsITApfTwvY29kZT5gfWJyKGUpe3JldHVyblwiPGJyPlwifWRlbCh7dG9rZW5zOmV9KXtyZXR1cm5gPGRlbD4ke3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUpfTwvZGVsPmB9bGluayh7aHJlZjplLHRpdGxlOnQsdG9rZW5zOm59KXtsZXQgcj10aGlzLnBhcnNlci5wYXJzZUlubGluZShuKSxpPVgoZSk7aWYoaT09PW51bGwpcmV0dXJuIHI7ZT1pO2xldCBzPSc8YSBocmVmPVwiJytlKydcIic7cmV0dXJuIHQmJihzKz0nIHRpdGxlPVwiJyt3KHQpKydcIicpLHMrPVwiPlwiK3IrXCI8L2E+XCIsc31pbWFnZSh7aHJlZjplLHRpdGxlOnQsdGV4dDpuLHRva2VuczpyfSl7ciYmKG49dGhpcy5wYXJzZXIucGFyc2VJbmxpbmUocix0aGlzLnBhcnNlci50ZXh0UmVuZGVyZXIpKTtsZXQgaT1YKGUpO2lmKGk9PT1udWxsKXJldHVybiB3KG4pO2U9aTtsZXQgcz1gPGltZyBzcmM9XCIke2V9XCIgYWx0PVwiJHtufVwiYDtyZXR1cm4gdCYmKHMrPWAgdGl0bGU9XCIke3codCl9XCJgKSxzKz1cIj5cIixzfXRleHQoZSl7cmV0dXJuXCJ0b2tlbnNcImluIGUmJmUudG9rZW5zP3RoaXMucGFyc2VyLnBhcnNlSW5saW5lKGUudG9rZW5zKTpcImVzY2FwZWRcImluIGUmJmUuZXNjYXBlZD9lLnRleHQ6dyhlLnRleHQpfX07dmFyICQ9Y2xhc3N7c3Ryb25nKHt0ZXh0OmV9KXtyZXR1cm4gZX1lbSh7dGV4dDplfSl7cmV0dXJuIGV9Y29kZXNwYW4oe3RleHQ6ZX0pe3JldHVybiBlfWRlbCh7dGV4dDplfSl7cmV0dXJuIGV9aHRtbCh7dGV4dDplfSl7cmV0dXJuIGV9dGV4dCh7dGV4dDplfSl7cmV0dXJuIGV9bGluayh7dGV4dDplfSl7cmV0dXJuXCJcIitlfWltYWdlKHt0ZXh0OmV9KXtyZXR1cm5cIlwiK2V9YnIoKXtyZXR1cm5cIlwifWNoZWNrYm94KHtyYXc6ZX0pe3JldHVybiBlfX07dmFyIGI9Y2xhc3MgdXtvcHRpb25zO3JlbmRlcmVyO3RleHRSZW5kZXJlcjtjb25zdHJ1Y3RvcihlKXt0aGlzLm9wdGlvbnM9ZXx8VCx0aGlzLm9wdGlvbnMucmVuZGVyZXI9dGhpcy5vcHRpb25zLnJlbmRlcmVyfHxuZXcgUCx0aGlzLnJlbmRlcmVyPXRoaXMub3B0aW9ucy5yZW5kZXJlcix0aGlzLnJlbmRlcmVyLm9wdGlvbnM9dGhpcy5vcHRpb25zLHRoaXMucmVuZGVyZXIucGFyc2VyPXRoaXMsdGhpcy50ZXh0UmVuZGVyZXI9bmV3ICR9c3RhdGljIHBhcnNlKGUsdCl7cmV0dXJuIG5ldyB1KHQpLnBhcnNlKGUpfXN0YXRpYyBwYXJzZUlubGluZShlLHQpe3JldHVybiBuZXcgdSh0KS5wYXJzZUlubGluZShlKX1wYXJzZShlKXtsZXQgdD1cIlwiO2ZvcihsZXQgbj0wO248ZS5sZW5ndGg7bisrKXtsZXQgcj1lW25dO2lmKHRoaXMub3B0aW9ucy5leHRlbnNpb25zPy5yZW5kZXJlcnM/LltyLnR5cGVdKXtsZXQgcz1yLGE9dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW3MudHlwZV0uY2FsbCh7cGFyc2VyOnRoaXN9LHMpO2lmKGEhPT0hMXx8IVtcInNwYWNlXCIsXCJoclwiLFwiaGVhZGluZ1wiLFwiY29kZVwiLFwidGFibGVcIixcImJsb2NrcXVvdGVcIixcImxpc3RcIixcImh0bWxcIixcImRlZlwiLFwicGFyYWdyYXBoXCIsXCJ0ZXh0XCJdLmluY2x1ZGVzKHMudHlwZSkpe3QrPWF8fFwiXCI7Y29udGludWV9fWxldCBpPXI7c3dpdGNoKGkudHlwZSl7Y2FzZVwic3BhY2VcIjp7dCs9dGhpcy5yZW5kZXJlci5zcGFjZShpKTticmVha31jYXNlXCJoclwiOnt0Kz10aGlzLnJlbmRlcmVyLmhyKGkpO2JyZWFrfWNhc2VcImhlYWRpbmdcIjp7dCs9dGhpcy5yZW5kZXJlci5oZWFkaW5nKGkpO2JyZWFrfWNhc2VcImNvZGVcIjp7dCs9dGhpcy5yZW5kZXJlci5jb2RlKGkpO2JyZWFrfWNhc2VcInRhYmxlXCI6e3QrPXRoaXMucmVuZGVyZXIudGFibGUoaSk7YnJlYWt9Y2FzZVwiYmxvY2txdW90ZVwiOnt0Kz10aGlzLnJlbmRlcmVyLmJsb2NrcXVvdGUoaSk7YnJlYWt9Y2FzZVwibGlzdFwiOnt0Kz10aGlzLnJlbmRlcmVyLmxpc3QoaSk7YnJlYWt9Y2FzZVwiY2hlY2tib3hcIjp7dCs9dGhpcy5yZW5kZXJlci5jaGVja2JveChpKTticmVha31jYXNlXCJodG1sXCI6e3QrPXRoaXMucmVuZGVyZXIuaHRtbChpKTticmVha31jYXNlXCJkZWZcIjp7dCs9dGhpcy5yZW5kZXJlci5kZWYoaSk7YnJlYWt9Y2FzZVwicGFyYWdyYXBoXCI6e3QrPXRoaXMucmVuZGVyZXIucGFyYWdyYXBoKGkpO2JyZWFrfWNhc2VcInRleHRcIjp7dCs9dGhpcy5yZW5kZXJlci50ZXh0KGkpO2JyZWFrfWRlZmF1bHQ6e2xldCBzPSdUb2tlbiB3aXRoIFwiJytpLnR5cGUrJ1wiIHR5cGUgd2FzIG5vdCBmb3VuZC4nO2lmKHRoaXMub3B0aW9ucy5zaWxlbnQpcmV0dXJuIGNvbnNvbGUuZXJyb3IocyksXCJcIjt0aHJvdyBuZXcgRXJyb3Iocyl9fX1yZXR1cm4gdH1wYXJzZUlubGluZShlLHQ9dGhpcy5yZW5kZXJlcil7bGV0IG49XCJcIjtmb3IobGV0IHI9MDtyPGUubGVuZ3RoO3IrKyl7bGV0IGk9ZVtyXTtpZih0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucz8ucmVuZGVyZXJzPy5baS50eXBlXSl7bGV0IGE9dGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW2kudHlwZV0uY2FsbCh7cGFyc2VyOnRoaXN9LGkpO2lmKGEhPT0hMXx8IVtcImVzY2FwZVwiLFwiaHRtbFwiLFwibGlua1wiLFwiaW1hZ2VcIixcInN0cm9uZ1wiLFwiZW1cIixcImNvZGVzcGFuXCIsXCJiclwiLFwiZGVsXCIsXCJ0ZXh0XCJdLmluY2x1ZGVzKGkudHlwZSkpe24rPWF8fFwiXCI7Y29udGludWV9fWxldCBzPWk7c3dpdGNoKHMudHlwZSl7Y2FzZVwiZXNjYXBlXCI6e24rPXQudGV4dChzKTticmVha31jYXNlXCJodG1sXCI6e24rPXQuaHRtbChzKTticmVha31jYXNlXCJsaW5rXCI6e24rPXQubGluayhzKTticmVha31jYXNlXCJpbWFnZVwiOntuKz10LmltYWdlKHMpO2JyZWFrfWNhc2VcImNoZWNrYm94XCI6e24rPXQuY2hlY2tib3gocyk7YnJlYWt9Y2FzZVwic3Ryb25nXCI6e24rPXQuc3Ryb25nKHMpO2JyZWFrfWNhc2VcImVtXCI6e24rPXQuZW0ocyk7YnJlYWt9Y2FzZVwiY29kZXNwYW5cIjp7bis9dC5jb2Rlc3BhbihzKTticmVha31jYXNlXCJiclwiOntuKz10LmJyKHMpO2JyZWFrfWNhc2VcImRlbFwiOntuKz10LmRlbChzKTticmVha31jYXNlXCJ0ZXh0XCI6e24rPXQudGV4dChzKTticmVha31kZWZhdWx0OntsZXQgYT0nVG9rZW4gd2l0aCBcIicrcy50eXBlKydcIiB0eXBlIHdhcyBub3QgZm91bmQuJztpZih0aGlzLm9wdGlvbnMuc2lsZW50KXJldHVybiBjb25zb2xlLmVycm9yKGEpLFwiXCI7dGhyb3cgbmV3IEVycm9yKGEpfX19cmV0dXJuIG59fTt2YXIgUz1jbGFzc3tvcHRpb25zO2Jsb2NrO2NvbnN0cnVjdG9yKGUpe3RoaXMub3B0aW9ucz1lfHxUfXN0YXRpYyBwYXNzVGhyb3VnaEhvb2tzPW5ldyBTZXQoW1wicHJlcHJvY2Vzc1wiLFwicG9zdHByb2Nlc3NcIixcInByb2Nlc3NBbGxUb2tlbnNcIixcImVtU3Ryb25nTWFza1wiXSk7c3RhdGljIHBhc3NUaHJvdWdoSG9va3NSZXNwZWN0QXN5bmM9bmV3IFNldChbXCJwcmVwcm9jZXNzXCIsXCJwb3N0cHJvY2Vzc1wiLFwicHJvY2Vzc0FsbFRva2Vuc1wiXSk7cHJlcHJvY2VzcyhlKXtyZXR1cm4gZX1wb3N0cHJvY2VzcyhlKXtyZXR1cm4gZX1wcm9jZXNzQWxsVG9rZW5zKGUpe3JldHVybiBlfWVtU3Ryb25nTWFzayhlKXtyZXR1cm4gZX1wcm92aWRlTGV4ZXIoKXtyZXR1cm4gdGhpcy5ibG9jaz94LmxleDp4LmxleElubGluZX1wcm92aWRlUGFyc2VyKCl7cmV0dXJuIHRoaXMuYmxvY2s/Yi5wYXJzZTpiLnBhcnNlSW5saW5lfX07dmFyIEI9Y2xhc3N7ZGVmYXVsdHM9TCgpO29wdGlvbnM9dGhpcy5zZXRPcHRpb25zO3BhcnNlPXRoaXMucGFyc2VNYXJrZG93bighMCk7cGFyc2VJbmxpbmU9dGhpcy5wYXJzZU1hcmtkb3duKCExKTtQYXJzZXI9YjtSZW5kZXJlcj1QO1RleHRSZW5kZXJlcj0kO0xleGVyPXg7VG9rZW5pemVyPXk7SG9va3M9Uztjb25zdHJ1Y3RvciguLi5lKXt0aGlzLnVzZSguLi5lKX13YWxrVG9rZW5zKGUsdCl7bGV0IG49W107Zm9yKGxldCByIG9mIGUpc3dpdGNoKG49bi5jb25jYXQodC5jYWxsKHRoaXMscikpLHIudHlwZSl7Y2FzZVwidGFibGVcIjp7bGV0IGk9cjtmb3IobGV0IHMgb2YgaS5oZWFkZXIpbj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMocy50b2tlbnMsdCkpO2ZvcihsZXQgcyBvZiBpLnJvd3MpZm9yKGxldCBhIG9mIHMpbj1uLmNvbmNhdCh0aGlzLndhbGtUb2tlbnMoYS50b2tlbnMsdCkpO2JyZWFrfWNhc2VcImxpc3RcIjp7bGV0IGk9cjtuPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhpLml0ZW1zLHQpKTticmVha31kZWZhdWx0OntsZXQgaT1yO3RoaXMuZGVmYXVsdHMuZXh0ZW5zaW9ucz8uY2hpbGRUb2tlbnM/LltpLnR5cGVdP3RoaXMuZGVmYXVsdHMuZXh0ZW5zaW9ucy5jaGlsZFRva2Vuc1tpLnR5cGVdLmZvckVhY2gocz0+e2xldCBhPWlbc10uZmxhdCgxLzApO249bi5jb25jYXQodGhpcy53YWxrVG9rZW5zKGEsdCkpfSk6aS50b2tlbnMmJihuPW4uY29uY2F0KHRoaXMud2Fsa1Rva2VucyhpLnRva2Vucyx0KSkpfX1yZXR1cm4gbn11c2UoLi4uZSl7bGV0IHQ9dGhpcy5kZWZhdWx0cy5leHRlbnNpb25zfHx7cmVuZGVyZXJzOnt9LGNoaWxkVG9rZW5zOnt9fTtyZXR1cm4gZS5mb3JFYWNoKG49PntsZXQgcj17Li4ubn07aWYoci5hc3luYz10aGlzLmRlZmF1bHRzLmFzeW5jfHxyLmFzeW5jfHwhMSxuLmV4dGVuc2lvbnMmJihuLmV4dGVuc2lvbnMuZm9yRWFjaChpPT57aWYoIWkubmFtZSl0aHJvdyBuZXcgRXJyb3IoXCJleHRlbnNpb24gbmFtZSByZXF1aXJlZFwiKTtpZihcInJlbmRlcmVyXCJpbiBpKXtsZXQgcz10LnJlbmRlcmVyc1tpLm5hbWVdO3M/dC5yZW5kZXJlcnNbaS5uYW1lXT1mdW5jdGlvbiguLi5hKXtsZXQgbz1pLnJlbmRlcmVyLmFwcGx5KHRoaXMsYSk7cmV0dXJuIG89PT0hMSYmKG89cy5hcHBseSh0aGlzLGEpKSxvfTp0LnJlbmRlcmVyc1tpLm5hbWVdPWkucmVuZGVyZXJ9aWYoXCJ0b2tlbml6ZXJcImluIGkpe2lmKCFpLmxldmVsfHxpLmxldmVsIT09XCJibG9ja1wiJiZpLmxldmVsIT09XCJpbmxpbmVcIil0aHJvdyBuZXcgRXJyb3IoXCJleHRlbnNpb24gbGV2ZWwgbXVzdCBiZSAnYmxvY2snIG9yICdpbmxpbmUnXCIpO2xldCBzPXRbaS5sZXZlbF07cz9zLnVuc2hpZnQoaS50b2tlbml6ZXIpOnRbaS5sZXZlbF09W2kudG9rZW5pemVyXSxpLnN0YXJ0JiYoaS5sZXZlbD09PVwiYmxvY2tcIj90LnN0YXJ0QmxvY2s/dC5zdGFydEJsb2NrLnB1c2goaS5zdGFydCk6dC5zdGFydEJsb2NrPVtpLnN0YXJ0XTppLmxldmVsPT09XCJpbmxpbmVcIiYmKHQuc3RhcnRJbmxpbmU/dC5zdGFydElubGluZS5wdXNoKGkuc3RhcnQpOnQuc3RhcnRJbmxpbmU9W2kuc3RhcnRdKSl9XCJjaGlsZFRva2Vuc1wiaW4gaSYmaS5jaGlsZFRva2VucyYmKHQuY2hpbGRUb2tlbnNbaS5uYW1lXT1pLmNoaWxkVG9rZW5zKX0pLHIuZXh0ZW5zaW9ucz10KSxuLnJlbmRlcmVyKXtsZXQgaT10aGlzLmRlZmF1bHRzLnJlbmRlcmVyfHxuZXcgUCh0aGlzLmRlZmF1bHRzKTtmb3IobGV0IHMgaW4gbi5yZW5kZXJlcil7aWYoIShzIGluIGkpKXRocm93IG5ldyBFcnJvcihgcmVuZGVyZXIgJyR7c30nIGRvZXMgbm90IGV4aXN0YCk7aWYoW1wib3B0aW9uc1wiLFwicGFyc2VyXCJdLmluY2x1ZGVzKHMpKWNvbnRpbnVlO2xldCBhPXMsbz1uLnJlbmRlcmVyW2FdLGw9aVthXTtpW2FdPSguLi5wKT0+e2xldCBjPW8uYXBwbHkoaSxwKTtyZXR1cm4gYz09PSExJiYoYz1sLmFwcGx5KGkscCkpLGN8fFwiXCJ9fXIucmVuZGVyZXI9aX1pZihuLnRva2VuaXplcil7bGV0IGk9dGhpcy5kZWZhdWx0cy50b2tlbml6ZXJ8fG5ldyB5KHRoaXMuZGVmYXVsdHMpO2ZvcihsZXQgcyBpbiBuLnRva2VuaXplcil7aWYoIShzIGluIGkpKXRocm93IG5ldyBFcnJvcihgdG9rZW5pemVyICcke3N9JyBkb2VzIG5vdCBleGlzdGApO2lmKFtcIm9wdGlvbnNcIixcInJ1bGVzXCIsXCJsZXhlclwiXS5pbmNsdWRlcyhzKSljb250aW51ZTtsZXQgYT1zLG89bi50b2tlbml6ZXJbYV0sbD1pW2FdO2lbYV09KC4uLnApPT57bGV0IGM9by5hcHBseShpLHApO3JldHVybiBjPT09ITEmJihjPWwuYXBwbHkoaSxwKSksY319ci50b2tlbml6ZXI9aX1pZihuLmhvb2tzKXtsZXQgaT10aGlzLmRlZmF1bHRzLmhvb2tzfHxuZXcgUztmb3IobGV0IHMgaW4gbi5ob29rcyl7aWYoIShzIGluIGkpKXRocm93IG5ldyBFcnJvcihgaG9vayAnJHtzfScgZG9lcyBub3QgZXhpc3RgKTtpZihbXCJvcHRpb25zXCIsXCJibG9ja1wiXS5pbmNsdWRlcyhzKSljb250aW51ZTtsZXQgYT1zLG89bi5ob29rc1thXSxsPWlbYV07Uy5wYXNzVGhyb3VnaEhvb2tzLmhhcyhzKT9pW2FdPXA9PntpZih0aGlzLmRlZmF1bHRzLmFzeW5jJiZTLnBhc3NUaHJvdWdoSG9va3NSZXNwZWN0QXN5bmMuaGFzKHMpKXJldHVybihhc3luYygpPT57bGV0IGc9YXdhaXQgby5jYWxsKGkscCk7cmV0dXJuIGwuY2FsbChpLGcpfSkoKTtsZXQgYz1vLmNhbGwoaSxwKTtyZXR1cm4gbC5jYWxsKGksYyl9OmlbYV09KC4uLnApPT57aWYodGhpcy5kZWZhdWx0cy5hc3luYylyZXR1cm4oYXN5bmMoKT0+e2xldCBnPWF3YWl0IG8uYXBwbHkoaSxwKTtyZXR1cm4gZz09PSExJiYoZz1hd2FpdCBsLmFwcGx5KGkscCkpLGd9KSgpO2xldCBjPW8uYXBwbHkoaSxwKTtyZXR1cm4gYz09PSExJiYoYz1sLmFwcGx5KGkscCkpLGN9fXIuaG9va3M9aX1pZihuLndhbGtUb2tlbnMpe2xldCBpPXRoaXMuZGVmYXVsdHMud2Fsa1Rva2VucyxzPW4ud2Fsa1Rva2VucztyLndhbGtUb2tlbnM9ZnVuY3Rpb24oYSl7bGV0IG89W107cmV0dXJuIG8ucHVzaChzLmNhbGwodGhpcyxhKSksaSYmKG89by5jb25jYXQoaS5jYWxsKHRoaXMsYSkpKSxvfX10aGlzLmRlZmF1bHRzPXsuLi50aGlzLmRlZmF1bHRzLC4uLnJ9fSksdGhpc31zZXRPcHRpb25zKGUpe3JldHVybiB0aGlzLmRlZmF1bHRzPXsuLi50aGlzLmRlZmF1bHRzLC4uLmV9LHRoaXN9bGV4ZXIoZSx0KXtyZXR1cm4geC5sZXgoZSx0Pz90aGlzLmRlZmF1bHRzKX1wYXJzZXIoZSx0KXtyZXR1cm4gYi5wYXJzZShlLHQ/P3RoaXMuZGVmYXVsdHMpfXBhcnNlTWFya2Rvd24oZSl7cmV0dXJuKG4scik9PntsZXQgaT17Li4ucn0scz17Li4udGhpcy5kZWZhdWx0cywuLi5pfSxhPXRoaXMub25FcnJvcighIXMuc2lsZW50LCEhcy5hc3luYyk7aWYodGhpcy5kZWZhdWx0cy5hc3luYz09PSEwJiZpLmFzeW5jPT09ITEpcmV0dXJuIGEobmV3IEVycm9yKFwibWFya2VkKCk6IFRoZSBhc3luYyBvcHRpb24gd2FzIHNldCB0byB0cnVlIGJ5IGFuIGV4dGVuc2lvbi4gUmVtb3ZlIGFzeW5jOiBmYWxzZSBmcm9tIHRoZSBwYXJzZSBvcHRpb25zIG9iamVjdCB0byByZXR1cm4gYSBQcm9taXNlLlwiKSk7aWYodHlwZW9mIG4+XCJ1XCJ8fG49PT1udWxsKXJldHVybiBhKG5ldyBFcnJvcihcIm1hcmtlZCgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgdW5kZWZpbmVkIG9yIG51bGxcIikpO2lmKHR5cGVvZiBuIT1cInN0cmluZ1wiKXJldHVybiBhKG5ldyBFcnJvcihcIm1hcmtlZCgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgb2YgdHlwZSBcIitPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobikrXCIsIHN0cmluZyBleHBlY3RlZFwiKSk7aWYocy5ob29rcyYmKHMuaG9va3Mub3B0aW9ucz1zLHMuaG9va3MuYmxvY2s9ZSkscy5hc3luYylyZXR1cm4oYXN5bmMoKT0+e2xldCBvPXMuaG9va3M/YXdhaXQgcy5ob29rcy5wcmVwcm9jZXNzKG4pOm4scD1hd2FpdChzLmhvb2tzP2F3YWl0IHMuaG9va3MucHJvdmlkZUxleGVyKCk6ZT94LmxleDp4LmxleElubGluZSkobyxzKSxjPXMuaG9va3M/YXdhaXQgcy5ob29rcy5wcm9jZXNzQWxsVG9rZW5zKHApOnA7cy53YWxrVG9rZW5zJiZhd2FpdCBQcm9taXNlLmFsbCh0aGlzLndhbGtUb2tlbnMoYyxzLndhbGtUb2tlbnMpKTtsZXQgaD1hd2FpdChzLmhvb2tzP2F3YWl0IHMuaG9va3MucHJvdmlkZVBhcnNlcigpOmU/Yi5wYXJzZTpiLnBhcnNlSW5saW5lKShjLHMpO3JldHVybiBzLmhvb2tzP2F3YWl0IHMuaG9va3MucG9zdHByb2Nlc3MoaCk6aH0pKCkuY2F0Y2goYSk7dHJ5e3MuaG9va3MmJihuPXMuaG9va3MucHJlcHJvY2VzcyhuKSk7bGV0IGw9KHMuaG9va3M/cy5ob29rcy5wcm92aWRlTGV4ZXIoKTplP3gubGV4OngubGV4SW5saW5lKShuLHMpO3MuaG9va3MmJihsPXMuaG9va3MucHJvY2Vzc0FsbFRva2VucyhsKSkscy53YWxrVG9rZW5zJiZ0aGlzLndhbGtUb2tlbnMobCxzLndhbGtUb2tlbnMpO2xldCBjPShzLmhvb2tzP3MuaG9va3MucHJvdmlkZVBhcnNlcigpOmU/Yi5wYXJzZTpiLnBhcnNlSW5saW5lKShsLHMpO3JldHVybiBzLmhvb2tzJiYoYz1zLmhvb2tzLnBvc3Rwcm9jZXNzKGMpKSxjfWNhdGNoKG8pe3JldHVybiBhKG8pfX19b25FcnJvcihlLHQpe3JldHVybiBuPT57aWYobi5tZXNzYWdlKz1gXG5QbGVhc2UgcmVwb3J0IHRoaXMgdG8gaHR0cHM6Ly9naXRodWIuY29tL21hcmtlZGpzL21hcmtlZC5gLGUpe2xldCByPVwiPHA+QW4gZXJyb3Igb2NjdXJyZWQ6PC9wPjxwcmU+XCIrdyhuLm1lc3NhZ2UrXCJcIiwhMCkrXCI8L3ByZT5cIjtyZXR1cm4gdD9Qcm9taXNlLnJlc29sdmUocik6cn1pZih0KXJldHVybiBQcm9taXNlLnJlamVjdChuKTt0aHJvdyBufX19O3ZhciBfPW5ldyBCO2Z1bmN0aW9uIGQodSxlKXtyZXR1cm4gXy5wYXJzZSh1LGUpfWQub3B0aW9ucz1kLnNldE9wdGlvbnM9ZnVuY3Rpb24odSl7cmV0dXJuIF8uc2V0T3B0aW9ucyh1KSxkLmRlZmF1bHRzPV8uZGVmYXVsdHMsWihkLmRlZmF1bHRzKSxkfTtkLmdldERlZmF1bHRzPUw7ZC5kZWZhdWx0cz1UO2QudXNlPWZ1bmN0aW9uKC4uLnUpe3JldHVybiBfLnVzZSguLi51KSxkLmRlZmF1bHRzPV8uZGVmYXVsdHMsWihkLmRlZmF1bHRzKSxkfTtkLndhbGtUb2tlbnM9ZnVuY3Rpb24odSxlKXtyZXR1cm4gXy53YWxrVG9rZW5zKHUsZSl9O2QucGFyc2VJbmxpbmU9Xy5wYXJzZUlubGluZTtkLlBhcnNlcj1iO2QucGFyc2VyPWIucGFyc2U7ZC5SZW5kZXJlcj1QO2QuVGV4dFJlbmRlcmVyPSQ7ZC5MZXhlcj14O2QubGV4ZXI9eC5sZXg7ZC5Ub2tlbml6ZXI9eTtkLkhvb2tzPVM7ZC5wYXJzZT1kO3ZhciBEdD1kLm9wdGlvbnMsSHQ9ZC5zZXRPcHRpb25zLFp0PWQudXNlLEd0PWQud2Fsa1Rva2VucyxOdD1kLnBhcnNlSW5saW5lLFF0PWQsRnQ9Yi5wYXJzZSxqdD14LmxleDtleHBvcnR7UyBhcyBIb29rcyx4IGFzIExleGVyLEIgYXMgTWFya2VkLGIgYXMgUGFyc2VyLFAgYXMgUmVuZGVyZXIsJCBhcyBUZXh0UmVuZGVyZXIseSBhcyBUb2tlbml6ZXIsVCBhcyBkZWZhdWx0cyxMIGFzIGdldERlZmF1bHRzLGp0IGFzIGxleGVyLGQgYXMgbWFya2VkLER0IGFzIG9wdGlvbnMsUXQgYXMgcGFyc2UsTnQgYXMgcGFyc2VJbmxpbmUsRnQgYXMgcGFyc2VyLEh0IGFzIHNldE9wdGlvbnMsWnQgYXMgdXNlLEd0IGFzIHdhbGtUb2tlbnN9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFya2VkLmVzbS5qcy5tYXBcbiIsImltcG9ydCBET01QdXJpZnkgZnJvbSBcImRvbXB1cmlmeVwiO1xuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSBcIm1hcmtlZFwiO1xuXG4vKipcbiAqIENvbnRlbnQgZm9ybWF0IHR5cGVzXG4gKi9cbmV4cG9ydCB0eXBlIENvbnRlbnRGb3JtYXQgPSBcImh0bWxcIiB8IFwibWFya2Rvd25cIiB8IFwidGV4dFwiO1xuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciBIVE1MIHNhbml0aXphdGlvblxuICogVXBkYXRlZCBmb3IgRkFRIGNvbnRlbnQ6IFByaW9yaXRpemVzIHNhZmUsIHJlYWRhYmxlIHJpY2ggdGV4dCB3aXRoIGZ1bGwgbGluayBzdXBwb3J0LlxuICogRW5oYW5jZXMgdGFibGUgc3VwcG9ydCAoaW5jbHVkaW5nIGNhcHRpb25zIGFuZCBzdHJ1Y3R1cmFsIGF0dHJpYnV0ZXMgZm9yIGJldHRlciBhY2Nlc3NpYmlsaXR5L2NvbXBsZXhpdHkpLlxuICogQWRkcyBvcHRpb25hbCB2aWRlbyBzdXBwb3J0IChjb21tZW50ZWQgb3V0IGJ5IGRlZmF1bHTigJR1bmNvbW1lbnQgaWYgZW1iZWRkaW5nIHZpZGVvcyBpcyBkZXNpcmVkIGZvciBGQVFzO1xuICogbm90ZTogdGhpcyBpbmNyZWFzZXMgc2VjdXJpdHkgcmV2aWV3IG5lZWRzIGR1ZSB0byBwb3RlbnRpYWwgZXhlY3V0YWJsZSBjb250ZW50KS5cbiAqIFJlbW92ZXMgaGVhZGluZ3MgKGgxLWg2KSBhcyB0aGV5J3JlIGxpa2VseSB1bm5lY2Vzc2FyeSBmb3IgRkFRIHJlc3BvbnNlcy5cbiAqIFJldGFpbnMgY29yZSBmb3JtYXR0aW5nLCBsaXN0cywgaW1hZ2VzLCBhbmQgdGFibGVzIGZvciBzdHJ1Y3R1cmVkIGFuc3dlcnMuXG4gKi9cbmNvbnN0IFNBTklUSVpFX0NPTkZJRyA9IHtcbiAgICBBTExPV0VEX1RBR1M6IFtcbiAgICAgICAgXCJwXCIsXG4gICAgICAgIFwiYnJcIixcbiAgICAgICAgXCJzdHJvbmdcIixcbiAgICAgICAgXCJlbVwiLFxuICAgICAgICBcInVcIixcbiAgICAgICAgXCJzXCIsXG4gICAgICAgIFwiYlwiLFxuICAgICAgICBcImlcIixcbiAgICAgICAgXCJhXCIsXG4gICAgICAgIFwidWxcIixcbiAgICAgICAgXCJvbFwiLFxuICAgICAgICBcImxpXCIsXG4gICAgICAgIFwiY29kZVwiLFxuICAgICAgICBcInByZVwiLFxuICAgICAgICBcImhyXCIsXG4gICAgICAgIFwidGFibGVcIixcbiAgICAgICAgXCJjYXB0aW9uXCIsIC8vIEFkZGVkIGZvciB0YWJsZSB0aXRsZXMvZGVzY3JpcHRpb25zXG4gICAgICAgIFwidGhlYWRcIixcbiAgICAgICAgXCJ0Ym9keVwiLFxuICAgICAgICBcInRmb290XCIsIC8vIEFkZGVkIGZvciB0YWJsZSBmb290ZXJzIChlLmcuLCBzdW1tYXJpZXMvdG90YWxzKVxuICAgICAgICBcInRyXCIsXG4gICAgICAgIFwidGhcIixcbiAgICAgICAgXCJ0ZFwiLFxuICAgICAgICBcImNvbFwiLCAvLyBBZGRlZCBmb3IgY29sdW1uIHByb3BlcnRpZXNcbiAgICAgICAgXCJjb2xncm91cFwiLCAvLyBBZGRlZCBmb3IgZ3JvdXBpbmcgY29sdW1uc1xuICAgICAgICBcImltZ1wiLFxuICAgICAgICBcImRpdlwiLFxuICAgICAgICBcInNwYW5cIixcbiAgICAgICAgXCJ2aWRlb1wiLCAvLyBVbmNvbW1lbnQgdG8gZW5hYmxlIDx2aWRlbz4gZm9yIGVtYmVkZGVkIHZpZGVvc1xuICAgICAgICBcInNvdXJjZVwiLCAvLyBVbmNvbW1lbnQgaWYgZW5hYmxpbmcgdmlkZW8gKGZvciA8dmlkZW8+IHNvdXJjZXMpXG4gICAgICAgIFwiZmlndXJlXCIsIC8vIE9wdGlvbmFsOiBGb3Igd3JhcHBpbmcgaW1hZ2VzL3RhYmxlcyB3aXRoIGNhcHRpb25zXG4gICAgICAgIFwiZmlnY2FwdGlvblwiIC8vIE9wdGlvbmFsOiBGb3IgZmlndXJlIGRlc2NyaXB0aW9uc1xuICAgIF0sXG4gICAgQUxMT1dFRF9BVFRSOiBbXG4gICAgICAgIFwiaHJlZlwiLFxuICAgICAgICBcInRpdGxlXCIsXG4gICAgICAgIFwidGFyZ2V0XCIsXG4gICAgICAgIFwicmVsXCIsXG4gICAgICAgIFwic3JjXCIsXG4gICAgICAgIFwiYWx0XCIsXG4gICAgICAgIFwid2lkdGhcIixcbiAgICAgICAgXCJoZWlnaHRcIixcbiAgICAgICAgXCJjbGFzc1wiLFxuICAgICAgICBcImlkXCIsXG4gICAgICAgIFwic3R5bGVcIixcbiAgICAgICAgLy8gVGFibGUtc3BlY2lmaWMgYXR0cmlidXRlcyBmb3Igc3RydWN0dXJlIGFuZCBhY2Nlc3NpYmlsaXR5XG4gICAgICAgIFwicm93c3BhblwiLFxuICAgICAgICBcImNvbHNwYW5cIixcbiAgICAgICAgXCJzY29wZVwiLCAvLyBGb3IgPHRoPiAoZS5nLiwgcm93LCBjb2wsIHJvd2dyb3VwKVxuICAgICAgICBcImhlYWRlcnNcIiwgLy8gRm9yIGFzc29jaWF0aW5nIDx0ZD4gd2l0aCA8dGg+XG4gICAgICAgIC8vIFZpZGVvLXNwZWNpZmljICh1bmNvbW1lbnQgaWYgZW5hYmxpbmcgdmlkZW8pXG4gICAgICAgIFwiY29udHJvbHNcIixcbiAgICAgICAgXCJhdXRvcGxheVwiLFxuICAgICAgICBcImxvb3BcIixcbiAgICAgICAgXCJtdXRlZFwiLFxuICAgICAgICBcInBvc3RlclwiXG4gICAgXSxcbiAgICBBTExPV19EQVRBX0FUVFI6IGZhbHNlLCAvLyBLZWVwIGZhbHNlIGZvciBzZWN1cml0eTsgZW5hYmxlIG9ubHkgaWYgY3VzdG9tIGRhdGEgYXR0cnMgYXJlIHZldHRlZFxuICAgIEFMTE9XRURfVVJJX1JFR0VYUDpcbiAgICAgICAgL14oPzooPzooPzpmfGh0KXRwcz98bWFpbHRvfHRlbHxjYWxsdG98c21zfGNpZHx4bXBwKTp8W15hLXpdfFthLXorLi1dKyg/OlteYS16Ky4tOl18JCkpL2lcbn07XG5cbi8qKlxuICogVmFsaWRhdGVzIGFuZCBzYW5pdGl6ZXMgSFRNTCBjb250ZW50XG4gKiBAcGFyYW0gaHRtbCAtIFRoZSBIVE1MIHN0cmluZyB0byBzYW5pdGl6ZVxuICogQHJldHVybnMgU2FuaXRpemVkIEhUTUwgc3RyaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUhUTUwoaHRtbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIWh0bWwpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgLy8gQ29uZmlndXJlIERPTVB1cmlmeVxuICAgICAgICBjb25zdCBjbGVhbkhUTUwgPSBET01QdXJpZnkuc2FuaXRpemUoaHRtbCwgU0FOSVRJWkVfQ09ORklHKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuSFRNTDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2FuaXRpemluZyBIVE1MOlwiLCBlcnJvcik7XG4gICAgICAgIC8vIFJldHVybiBlc2NhcGVkIHRleHQgYXMgZmFsbGJhY2tcbiAgICAgICAgcmV0dXJuIGVzY2FwZUhUTUwoaHRtbCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBIVE1MIGNvbnRlbnQgYW5kIHJldHVybnMgdmFsaWRhdGlvbiBlcnJvcnNcbiAqIEBwYXJhbSBodG1sIC0gVGhlIEhUTUwgc3RyaW5nIHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBBcnJheSBvZiB2YWxpZGF0aW9uIGVycm9yIG1lc3NhZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUhUTUwoaHRtbDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmICghaHRtbCkge1xuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBzY3JpcHQgdGFncyAoc2hvdWxkIGJlIGJsb2NrZWQpXG4gICAgaWYgKC88c2NyaXB0W14+XSo+W1xcc1xcU10qPzxcXC9zY3JpcHQ+L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJTY3JpcHQgdGFncyBhcmUgbm90IGFsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGV2ZW50IGhhbmRsZXJzIChzaG91bGQgYmUgYmxvY2tlZClcbiAgICBpZiAoL29uXFx3K1xccyo9L2dpLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goXCJFdmVudCBoYW5kbGVycyAob25jbGljaywgb25sb2FkLCBldGMuKSBhcmUgbm90IGFsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnNcIik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGphdmFzY3JpcHQ6IHByb3RvY29sXG4gICAgaWYgKC9qYXZhc2NyaXB0Oi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiSmF2YVNjcmlwdCBwcm90b2NvbCBpbiBVUkxzIGlzIG5vdCBhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBkYXRhOiBwcm90b2NvbCAoZXhjZXB0IGZvciBpbWFnZXMpXG4gICAgaWYgKC9kYXRhOig/IWltYWdlKS9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiRGF0YSBVUkxzIGFyZSBvbmx5IGFsbG93ZWQgZm9yIGltYWdlc1wiKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgaWZyYW1lIChub3QgaW4gYWxsb3dlZCB0YWdzKVxuICAgIGlmICgvPGlmcmFtZVtePl0qPi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiSWZyYW1lIHRhZ3MgYXJlIG5vdCBhbGxvd2VkXCIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBvYmplY3QgYW5kIGVtYmVkIHRhZ3NcbiAgICBpZiAoLzwob2JqZWN0fGVtYmVkKVtePl0qPi9naS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKFwiT2JqZWN0IGFuZCBlbWJlZCB0YWdzIGFyZSBub3QgYWxsb3dlZFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3JzO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBIVE1MIHN5bnRheCBmb3IgbWFsZm9ybWVkIG1hcmt1cFxuICogQHBhcmFtIGh0bWwgLSBUaGUgSFRNTCBzdHJpbmcgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm5zIEFycmF5IG9mIHN5bnRheCBlcnJvciBtZXNzYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVIVE1MU3ludGF4KGh0bWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoIWh0bWwpIHtcbiAgICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9XG5cbiAgICBjb25zdCBhbGxUYWdzID0gaHRtbC5tYXRjaCgvPFtePl0rPi9nKSB8fCBbXTtcblxuICAgIGFsbFRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgIC8vIENoZWNrIGZvciBhdHRyaWJ1dGVzIHdpdGggdW5jbG9zZWQgcXVvdGVzXG4gICAgICAgIC8vIExvb2sgZm9yIGF0dHI9XCIgb3IgYXR0cj0nIHRoYXQgZG9lc24ndCBoYXZlIGEgbWF0Y2hpbmcgY2xvc2luZyBxdW90ZVxuICAgICAgICBjb25zdCBzaW5nbGVRdW90ZU1hdGNoZXMgPSB0YWcubWF0Y2goL1xcdytcXHMqPVxccyonW14nXSokLyk7XG4gICAgICAgIGNvbnN0IGRvdWJsZVF1b3RlTWF0Y2hlcyA9IHRhZy5tYXRjaCgvXFx3K1xccyo9XFxzKlwiW15cIl0qJC8pO1xuXG4gICAgICAgIGlmIChzaW5nbGVRdW90ZU1hdGNoZXMgfHwgZG91YmxlUXVvdGVNYXRjaGVzKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICBgVW5jbG9zZWQgYXR0cmlidXRlIHF1b3RlIGluIHRhZzogJHt0YWcuc3Vic3RyaW5nKDAsIDUwKX0ke1xuICAgICAgICAgICAgICAgICAgICB0YWcubGVuZ3RoID4gNTAgPyBcIi4uLlwiIDogXCJcIlxuICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIG9wZW5pbmcgdGFnIChtaXNzaW5nID4pXG4gICAgICAgIGlmICh0YWcuc3RhcnRzV2l0aChcIjxcIikgJiYgIXRhZy5lbmRzV2l0aChcIj5cIikpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgIGBVbmNsb3NlZCB0YWcgYnJhY2tldDogJHt0YWcuc3Vic3RyaW5nKDAsIDUwKX0ke3RhZy5sZW5ndGggPiA1MCA/IFwiLi4uXCIgOiBcIlwifWBcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENoZWNrIGZvciBiYWxhbmNlZCB0YWdzIChvcGVuaW5nIGFuZCBjbG9zaW5nKVxuICAgIC8vIFNlbGYtY2xvc2luZyB0YWdzIHRoYXQgZG9uJ3QgbmVlZCBjbG9zaW5nIHRhZ3NcbiAgICBjb25zdCBzZWxmQ2xvc2luZ1RhZ3MgPSBbXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgICBcImJhc2VcIixcbiAgICAgICAgXCJiclwiLFxuICAgICAgICBcImNvbFwiLFxuICAgICAgICBcImVtYmVkXCIsXG4gICAgICAgIFwiaHJcIixcbiAgICAgICAgXCJpbWdcIixcbiAgICAgICAgXCJpbnB1dFwiLFxuICAgICAgICBcImxpbmtcIixcbiAgICAgICAgXCJtZXRhXCIsXG4gICAgICAgIFwicGFyYW1cIixcbiAgICAgICAgXCJzb3VyY2VcIixcbiAgICAgICAgXCJ0cmFja1wiLFxuICAgICAgICBcIndiclwiXG4gICAgXTtcblxuICAgIC8vIEV4dHJhY3QgYWxsIHRhZ3MgKG9wZW5pbmcgYW5kIGNsb3NpbmcpXG4gICAgY29uc3QgdGFnU3RhY2s6IEFycmF5PHsgdGFnOiBzdHJpbmc7IHBvc2l0aW9uOiBudW1iZXIgfT4gPSBbXTtcbiAgICBjb25zdCB0YWdSZWdleCA9IC88XFwvPyhbYS16QS1aXVthLXpBLVowLTldKilbXj5dKj4vZztcbiAgICBsZXQgbWF0Y2g7XG5cbiAgICB3aGlsZSAoKG1hdGNoID0gdGFnUmVnZXguZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgZnVsbFRhZyA9IG1hdGNoWzBdO1xuICAgICAgICBjb25zdCB0YWdOYW1lID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgaXNDbG9zaW5nID0gZnVsbFRhZy5zdGFydHNXaXRoKFwiPC9cIik7XG4gICAgICAgIGNvbnN0IGlzU2VsZkNsb3NpbmcgPSBmdWxsVGFnLmVuZHNXaXRoKFwiLz5cIikgfHwgc2VsZkNsb3NpbmdUYWdzLmluY2x1ZGVzKHRhZ05hbWUpO1xuXG4gICAgICAgIGlmIChpc0Nsb3NpbmcpIHtcbiAgICAgICAgICAgIC8vIENsb3NpbmcgdGFnIC0gcG9wIGZyb20gc3RhY2tcbiAgICAgICAgICAgIGlmICh0YWdTdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgT3JwaGFuZWQgY2xvc2luZyB0YWc6IDwvJHt0YWdOYW1lfT5gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFzdE9wZW5lZCA9IHRhZ1N0YWNrW3RhZ1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmIChsYXN0T3BlbmVkLnRhZyA9PT0gdGFnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0YWdTdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBNaXNtYXRjaGVkIHRhZ1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIGBNaXNtYXRjaGVkIHRhZ3M6IEV4cGVjdGVkIGNsb3NpbmcgdGFnIGZvciA8JHtsYXN0T3BlbmVkLnRhZ30+LCBmb3VuZCA8LyR7dGFnTmFtZX0+YFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gZmluZCBtYXRjaGluZyBvcGVuaW5nIHRhZyBpbiBzdGFja1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaEluZGV4ID0gdGFnU3RhY2suZmluZEluZGV4KCh0KSA9PiB0LnRhZyA9PT0gdGFnTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaEluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1N0YWNrLnNwbGljZShtYXRjaEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghaXNTZWxmQ2xvc2luZykge1xuICAgICAgICAgICAgLy8gT3BlbmluZyB0YWcgLSBwdXNoIHRvIHN0YWNrXG4gICAgICAgICAgICB0YWdTdGFjay5wdXNoKHsgdGFnOiB0YWdOYW1lLCBwb3NpdGlvbjogbWF0Y2guaW5kZXggfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgdW5jbG9zZWQgdGFncyByZW1haW5pbmcgaW4gc3RhY2tcbiAgICBpZiAodGFnU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICB0YWdTdGFjay5mb3JFYWNoKCh7IHRhZyB9KSA9PiB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgVW5jbG9zZWQgdGFnOiA8JHt0YWd9PiBpcyBtaXNzaW5nIGNsb3NpbmcgdGFnIDwvJHt0YWd9PmApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgbWFsZm9ybWVkIGF0dHJpYnV0ZXMgKG5vIHZhbHVlLCBtYWxmb3JtZWQgc3ludGF4KVxuICAgIGNvbnN0IG1hbGZvcm1lZEF0dHJQYXR0ZXJuID0gLzxbXj5dK1xccysoXFx3KylcXHMqPVxccyooPyFbXCJcXHddKVtePl0qPi9nO1xuICAgIGxldCBhdHRyTWF0Y2g7XG4gICAgd2hpbGUgKChhdHRyTWF0Y2ggPSBtYWxmb3JtZWRBdHRyUGF0dGVybi5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xuICAgICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgICAgIGBNYWxmb3JtZWQgYXR0cmlidXRlIHN5bnRheDogJHthdHRyTWF0Y2hbMF0uc3Vic3RyaW5nKDAsIDUwKX0ke1xuICAgICAgICAgICAgICAgIGF0dHJNYXRjaFswXS5sZW5ndGggPiA1MCA/IFwiLi4uXCIgOiBcIlwiXG4gICAgICAgICAgICB9YFxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBlcnJvcnM7XG59XG5cbi8qKlxuICogQ29udmVydHMgbWFya2Rvd24gdG8gSFRNTFxuICogQHBhcmFtIG1hcmtkb3duIC0gVGhlIG1hcmtkb3duIHN0cmluZyB0byBjb252ZXJ0XG4gKiBAcmV0dXJucyBIVE1MIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya2Rvd25Ub0hUTUwobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKCFtYXJrZG93bikge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBDb25maWd1cmUgbWFya2VkIGZvciBzZWN1cml0eVxuICAgICAgICBtYXJrZWQuc2V0T3B0aW9ucyh7XG4gICAgICAgICAgICBicmVha3M6IHRydWUsXG4gICAgICAgICAgICBnZm06IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgaHRtbCA9IG1hcmtlZC5wYXJzZShtYXJrZG93bikgYXMgc3RyaW5nO1xuICAgICAgICAvLyBTYW5pdGl6ZSB0aGUgZ2VuZXJhdGVkIEhUTUxcbiAgICAgICAgcmV0dXJuIHNhbml0aXplSFRNTChodG1sKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcGFyc2luZyBtYXJrZG93bjpcIiwgZXJyb3IpO1xuICAgICAgICByZXR1cm4gZXNjYXBlSFRNTChtYXJrZG93bik7XG4gICAgfVxufVxuXG4vKipcbiAqIEVzY2FwZXMgSFRNTCBzcGVjaWFsIGNoYXJhY3RlcnNcbiAqIEBwYXJhbSB0ZXh0IC0gVGhlIHRleHQgdG8gZXNjYXBlXG4gKiBAcmV0dXJucyBFc2NhcGVkIHRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUhUTUwodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGRpdi50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgcmV0dXJuIGRpdi5pbm5lckhUTUw7XG59XG5cbi8qKlxuICogQ29udmVydHMgcGxhaW4gdGV4dCB0byBIVE1MIHdpdGggbGluZSBicmVha3NcbiAqIEBwYXJhbSB0ZXh0IC0gVGhlIHBsYWluIHRleHQgdG8gY29udmVydFxuICogQHJldHVybnMgSFRNTCBzdHJpbmcgd2l0aCBsaW5lIGJyZWFrc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dFRvSFRNTCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghdGV4dCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICAvLyBFc2NhcGUgSFRNTCBjaGFyYWN0ZXJzIGFuZCBjb252ZXJ0IGxpbmUgYnJlYWtzIHRvIDxicj5cbiAgICBjb25zdCBlc2NhcGVkID0gZXNjYXBlSFRNTCh0ZXh0KTtcbiAgICByZXR1cm4gZXNjYXBlZC5yZXBsYWNlKC9cXG4vZywgXCI8YnI+XCIpO1xufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBjb250ZW50IGJhc2VkIG9uIGZvcm1hdCBhbmQgcmV0dXJucyBzYW5pdGl6ZWQgSFRNTFxuICogQHBhcmFtIGNvbnRlbnQgLSBUaGUgY29udGVudCBzdHJpbmdcbiAqIEBwYXJhbSBmb3JtYXQgLSBUaGUgY29udGVudCBmb3JtYXQgKGh0bWwsIG1hcmtkb3duLCBvciB0ZXh0KVxuICogQHJldHVybnMgU2FuaXRpemVkIEhUTUwgc3RyaW5nIG9yIGVzY2FwZWQgbWFya2Rvd25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NDb250ZW50KGNvbnRlbnQ6IHN0cmluZywgZm9ybWF0OiBDb250ZW50Rm9ybWF0KTogc3RyaW5nIHtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuXG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgY2FzZSBcImh0bWxcIjpcbiAgICAgICAgICAgIHJldHVybiBzYW5pdGl6ZUhUTUwoY29udGVudCk7XG4gICAgICAgIGNhc2UgXCJtYXJrZG93blwiOlxuICAgICAgICAgICAgLy8gQ29udmVydCBtYXJrZG93biB0byBIVE1MIGFuZCBzYW5pdGl6ZSBpdFxuICAgICAgICAgICAgcmV0dXJuIG1hcmtkb3duVG9IVE1MKGNvbnRlbnQpO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgICAgcmV0dXJuIHRleHRUb0hUTUwoY29udGVudCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBVbnJlY29nbml6ZWQgZm9ybWF0IC0gdHJlYXQgYXMgSFRNTCBhbmQgc2FuaXRpemUgZm9yIHNhZmV0eVxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBVbnJlY29nbml6ZWQgY29udGVudCBmb3JtYXQgXCIke2Zvcm1hdH1cIiwgdHJlYXRpbmcgYXMgSFRNTGApO1xuICAgICAgICAgICAgcmV0dXJuIHNhbml0aXplSFRNTChjb250ZW50KTtcbiAgICB9XG59XG5cbi8qKlxuICogR2V0cyB2YWxpZGF0aW9uIHdhcm5pbmdzIGZvciBjb250ZW50IGJhc2VkIG9uIGZvcm1hdFxuICogQHBhcmFtIGNvbnRlbnQgLSBUaGUgY29udGVudCBzdHJpbmdcbiAqIEBwYXJhbSBmb3JtYXQgLSBUaGUgY29udGVudCBmb3JtYXRcbiAqIEByZXR1cm5zIEFycmF5IG9mIHdhcm5pbmcgbWVzc2FnZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRlbnRXYXJuaW5ncyhjb250ZW50OiBzdHJpbmcsIGZvcm1hdDogQ29udGVudEZvcm1hdCk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgIGNhc2UgXCJodG1sXCI6XG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBib3RoIHNlY3VyaXR5IGlzc3VlcyBhbmQgc3ludGF4XG4gICAgICAgICAgICBjb25zdCBzZWN1cml0eVdhcm5pbmdzID0gdmFsaWRhdGVIVE1MKGNvbnRlbnQpO1xuICAgICAgICAgICAgY29uc3Qgc3ludGF4V2FybmluZ3MgPSB2YWxpZGF0ZUhUTUxTeW50YXgoY29udGVudCk7XG4gICAgICAgICAgICByZXR1cm4gWy4uLnNlY3VyaXR5V2FybmluZ3MsIC4uLnN5bnRheFdhcm5pbmdzXTtcbiAgICAgICAgY2FzZSBcIm1hcmtkb3duXCI6XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgZGFuZ2Vyb3VzIEhUTUwgZW1iZWRkZWQgaW4gbWFya2Rvd25cbiAgICAgICAgICAgIC8vIFVzZXJzIG1pZ2h0IHRyeSB0byBpbmNsdWRlIDxzY3JpcHQ+IHRhZ3MgaW4gdGhlaXIgbWFya2Rvd25cbiAgICAgICAgICAgIGNvbnN0IGh0bWxQYXR0ZXJuID0gLzxbXj5dKz4vZztcbiAgICAgICAgICAgIGNvbnN0IGh0bWxNYXRjaGVzID0gY29udGVudC5tYXRjaChodG1sUGF0dGVybik7XG5cbiAgICAgICAgICAgIGlmIChodG1sTWF0Y2hlcykge1xuICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QganVzdCB0aGUgSFRNTCBwYXJ0cyBhbmQgdmFsaWRhdGUgdGhlbVxuICAgICAgICAgICAgICAgIGNvbnN0IGh0bWxDb250ZW50ID0gaHRtbE1hdGNoZXMuam9pbihcIlwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBodG1sU2VjdXJpdHlXYXJuaW5ncyA9IHZhbGlkYXRlSFRNTChodG1sQ29udGVudCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaHRtbFN5bnRheFdhcm5pbmdzID0gdmFsaWRhdGVIVE1MU3ludGF4KGh0bWxDb250ZW50KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGFsbFdhcm5pbmdzID0gWy4uLmh0bWxTZWN1cml0eVdhcm5pbmdzLCAuLi5odG1sU3ludGF4V2FybmluZ3NdO1xuICAgICAgICAgICAgICAgIGlmIChhbGxXYXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGxXYXJuaW5ncy5tYXAoKHdhcm5pbmcpID0+IGBFbWJlZGRlZCBIVE1MIGluIG1hcmtkb3duOiAke3dhcm5pbmd9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgICAgLy8gVGV4dCBmb3JtYXQgZG9lc24ndCBuZWVkIHZhbGlkYXRpb24gKGV2ZXJ5dGhpbmcgaXMgZXNjYXBlZClcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5pbXBvcnQgeyBwcm9jZXNzQ29udGVudCwgZ2V0Q29udGVudFdhcm5pbmdzIH0gZnJvbSBcIi4uL3V0aWxzL2NvbnRlbnRQcm9jZXNzb3JcIjtcbmltcG9ydCB7IENvbnRlbnRGb3JtYXRFbnVtIH0gZnJvbSBcIi4uLy4uL3R5cGluZ3MvRkFRQWNjb3JkaW9uUHJvcHNcIjtcblxuaW50ZXJmYWNlIEZBUUl0ZW1EYXRhIHtcbiAgICBzdW1tYXJ5OiBzdHJpbmc7XG4gICAgY29udGVudDogc3RyaW5nO1xuICAgIGNvbnRlbnRGb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtO1xuICAgIHNvcnRPcmRlcj86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIEZBUUl0ZW1zTGlzdFByb3BzIHtcbiAgICBpdGVtczogRkFRSXRlbURhdGFbXTtcbiAgICBleHBhbmRlZEl0ZW1zOiBTZXQ8bnVtYmVyPjtcbiAgICBhbmltYXRpb25EdXJhdGlvbjogbnVtYmVyO1xuICAgIG9uVG9nZ2xlSXRlbTogKGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgRkFRIGl0ZW1zIGxpc3QgaW4gbm9ybWFsIChub24tZWRpdCkgbW9kZVxuICogVXNlcyBzZW1hbnRpYyBIVE1MIGRldGFpbHMvc3VtbWFyeSBlbGVtZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gRkFRSXRlbXNMaXN0KHtcbiAgICBpdGVtcyxcbiAgICBleHBhbmRlZEl0ZW1zLFxuICAgIGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgIG9uVG9nZ2xlSXRlbVxufTogRkFRSXRlbXNMaXN0UHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1pdGVtc1wiPlxuICAgICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0V4cGFuZGVkID0gZXhwYW5kZWRJdGVtcy5oYXMoaW5kZXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1bW1hcnlWYWx1ZSA9IGl0ZW0uc3VtbWFyeTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50VmFsdWUgPSBpdGVtLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudEZvcm1hdCA9IGl0ZW0uY29udGVudEZvcm1hdDtcblxuICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgY29udGVudCBiYXNlZCBvbiBmb3JtYXQgYW5kIHNhbml0aXplXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2VkQ29udGVudCA9IHByb2Nlc3NDb250ZW50KGNvbnRlbnRWYWx1ZSwgY29udGVudEZvcm1hdCk7XG5cbiAgICAgICAgICAgICAgICAvLyBHZXQgdmFsaWRhdGlvbiB3YXJuaW5ncyAob25seSBmb3IgSFRNTCBmb3JtYXQpXG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybmluZ3MgPSBnZXRDb250ZW50V2FybmluZ3MoY29udGVudFZhbHVlLCBjb250ZW50Rm9ybWF0KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDxkZXRhaWxzXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2luZGV4fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW1cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZmFxLWl0ZW0tLWV4cGFuZGVkXCI6IGlzRXhwYW5kZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgb3Blbj17aXNFeHBhbmRlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiLS1hbmltYXRpb24tZHVyYXRpb25cIjogYCR7YW5pbWF0aW9uRHVyYXRpb259bXNgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBSZWFjdC5DU1NQcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzdW1tYXJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tc3VtbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblRvZ2dsZUl0ZW0oaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIiB8fCBlLmtleSA9PT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uVG9nZ2xlSXRlbShpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYkluZGV4PXswfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyaWEtZXhwYW5kZWQ9e2lzRXhwYW5kZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLWl0ZW0tc3VtbWFyeS10ZXh0XCI+e3N1bW1hcnlWYWx1ZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW0taWNvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1pdGVtLWljb24tLWV4cGFuZGVkXCI6IGlzRXhwYW5kZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD1cIjE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD1cIjE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdCb3g9XCIwIDAgMTYgMTZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZD1cIk00IDZMOCAxMEwxMiA2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U9XCJjdXJyZW50Q29sb3JcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoPVwiMlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlTGluZWNhcD1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VMaW5lam9pbj1cInJvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0tY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3YXJuaW5ncy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtaXRlbS13YXJuaW5nc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3dhcm5pbmdzLm1hcCgod2FybmluZywgd0luZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3dJbmRleH0gY2xhc3NOYW1lPVwiZmFxLWl0ZW0td2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDimqDvuI8ge3dhcm5pbmd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1pdGVtLWNvbnRlbnQtaW5uZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHByb2Nlc3NlZENvbnRlbnQgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyB1c2VNZW1vLCB1c2VMYXlvdXRFZmZlY3QsIHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VDYWxsYmFjayB9IGZyb20gJ3JlYWN0JztcblxuZnVuY3Rpb24gdXNlQ29tYmluZWRSZWZzKCkge1xuICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgcmVmcyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICByZWZzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICB9XG5cbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gbm9kZSA9PiB7XG4gICAgcmVmcy5mb3JFYWNoKHJlZiA9PiByZWYobm9kZSkpO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIHJlZnMpO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi9tYXN0ZXIvcGFja2FnZXMvc2hhcmVkL0V4ZWN1dGlvbkVudmlyb25tZW50LmpzXG5jb25zdCBjYW5Vc2VET00gPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LmRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgIT09ICd1bmRlZmluZWQnO1xuXG5mdW5jdGlvbiBpc1dpbmRvdyhlbGVtZW50KSB7XG4gIGNvbnN0IGVsZW1lbnRTdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50U3RyaW5nID09PSAnW29iamVjdCBXaW5kb3ddJyB8fCAvLyBJbiBFbGVjdHJvbiBjb250ZXh0IHRoZSBXaW5kb3cgb2JqZWN0IHNlcmlhbGl6ZXMgdG8gW29iamVjdCBnbG9iYWxdXG4gIGVsZW1lbnRTdHJpbmcgPT09ICdbb2JqZWN0IGdsb2JhbF0nO1xufVxuXG5mdW5jdGlvbiBpc05vZGUobm9kZSkge1xuICByZXR1cm4gJ25vZGVUeXBlJyBpbiBub2RlO1xufVxuXG5mdW5jdGlvbiBnZXRXaW5kb3codGFyZ2V0KSB7XG4gIHZhciBfdGFyZ2V0JG93bmVyRG9jdW1lbnQsIF90YXJnZXQkb3duZXJEb2N1bWVudDI7XG5cbiAgaWYgKCF0YXJnZXQpIHtcbiAgICByZXR1cm4gd2luZG93O1xuICB9XG5cbiAgaWYgKGlzV2luZG93KHRhcmdldCkpIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgaWYgKCFpc05vZGUodGFyZ2V0KSkge1xuICAgIHJldHVybiB3aW5kb3c7XG4gIH1cblxuICByZXR1cm4gKF90YXJnZXQkb3duZXJEb2N1bWVudCA9IChfdGFyZ2V0JG93bmVyRG9jdW1lbnQyID0gdGFyZ2V0Lm93bmVyRG9jdW1lbnQpID09IG51bGwgPyB2b2lkIDAgOiBfdGFyZ2V0JG93bmVyRG9jdW1lbnQyLmRlZmF1bHRWaWV3KSAhPSBudWxsID8gX3RhcmdldCRvd25lckRvY3VtZW50IDogd2luZG93O1xufVxuXG5mdW5jdGlvbiBpc0RvY3VtZW50KG5vZGUpIHtcbiAgY29uc3Qge1xuICAgIERvY3VtZW50XG4gIH0gPSBnZXRXaW5kb3cobm9kZSk7XG4gIHJldHVybiBub2RlIGluc3RhbmNlb2YgRG9jdW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGlzSFRNTEVsZW1lbnQobm9kZSkge1xuICBpZiAoaXNXaW5kb3cobm9kZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIGdldFdpbmRvdyhub2RlKS5IVE1MRWxlbWVudDtcbn1cblxuZnVuY3Rpb24gaXNTVkdFbGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBnZXRXaW5kb3cobm9kZSkuU1ZHRWxlbWVudDtcbn1cblxuZnVuY3Rpb24gZ2V0T3duZXJEb2N1bWVudCh0YXJnZXQpIHtcbiAgaWYgKCF0YXJnZXQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cblxuICBpZiAoaXNXaW5kb3codGFyZ2V0KSkge1xuICAgIHJldHVybiB0YXJnZXQuZG9jdW1lbnQ7XG4gIH1cblxuICBpZiAoIWlzTm9kZSh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG5cbiAgaWYgKGlzRG9jdW1lbnQodGFyZ2V0KSkge1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICBpZiAoaXNIVE1MRWxlbWVudCh0YXJnZXQpIHx8IGlzU1ZHRWxlbWVudCh0YXJnZXQpKSB7XG4gICAgcmV0dXJuIHRhcmdldC5vd25lckRvY3VtZW50O1xuICB9XG5cbiAgcmV0dXJuIGRvY3VtZW50O1xufVxuXG4vKipcclxuICogQSBob29rIHRoYXQgcmVzb2x2ZXMgdG8gdXNlRWZmZWN0IG9uIHRoZSBzZXJ2ZXIgYW5kIHVzZUxheW91dEVmZmVjdCBvbiB0aGUgY2xpZW50XHJcbiAqIEBwYXJhbSBjYWxsYmFjayB7ZnVuY3Rpb259IENhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgaW52b2tlZCB3aGVuIHRoZSBkZXBlbmRlbmNpZXMgb2YgdGhlIGhvb2sgY2hhbmdlXHJcbiAqL1xuXG5jb25zdCB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0ID0gY2FuVXNlRE9NID8gdXNlTGF5b3V0RWZmZWN0IDogdXNlRWZmZWN0O1xuXG5mdW5jdGlvbiB1c2VFdmVudChoYW5kbGVyKSB7XG4gIGNvbnN0IGhhbmRsZXJSZWYgPSB1c2VSZWYoaGFuZGxlcik7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGhhbmRsZXJSZWYuY3VycmVudCA9IGhhbmRsZXI7XG4gIH0pO1xuICByZXR1cm4gdXNlQ2FsbGJhY2soZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGFuZGxlclJlZi5jdXJyZW50ID09IG51bGwgPyB2b2lkIDAgOiBoYW5kbGVyUmVmLmN1cnJlbnQoLi4uYXJncyk7XG4gIH0sIFtdKTtcbn1cblxuZnVuY3Rpb24gdXNlSW50ZXJ2YWwoKSB7XG4gIGNvbnN0IGludGVydmFsUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBzZXQgPSB1c2VDYWxsYmFjaygobGlzdGVuZXIsIGR1cmF0aW9uKSA9PiB7XG4gICAgaW50ZXJ2YWxSZWYuY3VycmVudCA9IHNldEludGVydmFsKGxpc3RlbmVyLCBkdXJhdGlvbik7XG4gIH0sIFtdKTtcbiAgY29uc3QgY2xlYXIgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGludGVydmFsUmVmLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYuY3VycmVudCk7XG4gICAgICBpbnRlcnZhbFJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gIH0sIFtdKTtcbiAgcmV0dXJuIFtzZXQsIGNsZWFyXTtcbn1cblxuZnVuY3Rpb24gdXNlTGF0ZXN0VmFsdWUodmFsdWUsIGRlcGVuZGVuY2llcykge1xuICBpZiAoZGVwZW5kZW5jaWVzID09PSB2b2lkIDApIHtcbiAgICBkZXBlbmRlbmNpZXMgPSBbdmFsdWVdO1xuICB9XG5cbiAgY29uc3QgdmFsdWVSZWYgPSB1c2VSZWYodmFsdWUpO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAodmFsdWVSZWYuY3VycmVudCAhPT0gdmFsdWUpIHtcbiAgICAgIHZhbHVlUmVmLmN1cnJlbnQgPSB2YWx1ZTtcbiAgICB9XG4gIH0sIGRlcGVuZGVuY2llcyk7XG4gIHJldHVybiB2YWx1ZVJlZjtcbn1cblxuZnVuY3Rpb24gdXNlTGF6eU1lbW8oY2FsbGJhY2ssIGRlcGVuZGVuY2llcykge1xuICBjb25zdCB2YWx1ZVJlZiA9IHVzZVJlZigpO1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgbmV3VmFsdWUgPSBjYWxsYmFjayh2YWx1ZVJlZi5jdXJyZW50KTtcbiAgICB2YWx1ZVJlZi5jdXJyZW50ID0gbmV3VmFsdWU7XG4gICAgcmV0dXJuIG5ld1ZhbHVlO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFsuLi5kZXBlbmRlbmNpZXNdKTtcbn1cblxuZnVuY3Rpb24gdXNlTm9kZVJlZihvbkNoYW5nZSkge1xuICBjb25zdCBvbkNoYW5nZUhhbmRsZXIgPSB1c2VFdmVudChvbkNoYW5nZSk7XG4gIGNvbnN0IG5vZGUgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHNldE5vZGVSZWYgPSB1c2VDYWxsYmFjayhlbGVtZW50ID0+IHtcbiAgICBpZiAoZWxlbWVudCAhPT0gbm9kZS5jdXJyZW50KSB7XG4gICAgICBvbkNoYW5nZUhhbmRsZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG9uQ2hhbmdlSGFuZGxlcihlbGVtZW50LCBub2RlLmN1cnJlbnQpO1xuICAgIH1cblxuICAgIG5vZGUuY3VycmVudCA9IGVsZW1lbnQ7XG4gIH0sIC8vZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gIFtdKTtcbiAgcmV0dXJuIFtub2RlLCBzZXROb2RlUmVmXTtcbn1cblxuZnVuY3Rpb24gdXNlUHJldmlvdXModmFsdWUpIHtcbiAgY29uc3QgcmVmID0gdXNlUmVmKCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgcmVmLmN1cnJlbnQgPSB2YWx1ZTtcbiAgfSwgW3ZhbHVlXSk7XG4gIHJldHVybiByZWYuY3VycmVudDtcbn1cblxubGV0IGlkcyA9IHt9O1xuZnVuY3Rpb24gdXNlVW5pcXVlSWQocHJlZml4LCB2YWx1ZSkge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgY29uc3QgaWQgPSBpZHNbcHJlZml4XSA9PSBudWxsID8gMCA6IGlkc1twcmVmaXhdICsgMTtcbiAgICBpZHNbcHJlZml4XSA9IGlkO1xuICAgIHJldHVybiBwcmVmaXggKyBcIi1cIiArIGlkO1xuICB9LCBbcHJlZml4LCB2YWx1ZV0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBZGp1c3RtZW50Rm4obW9kaWZpZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYWRqdXN0bWVudHMgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYWRqdXN0bWVudHNbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHJldHVybiBhZGp1c3RtZW50cy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBhZGp1c3RtZW50KSA9PiB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoYWRqdXN0bWVudCk7XG5cbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVBZGp1c3RtZW50XSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYWNjdW11bGF0b3Jba2V5XTtcblxuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgIGFjY3VtdWxhdG9yW2tleV0gPSB2YWx1ZSArIG1vZGlmaWVyICogdmFsdWVBZGp1c3RtZW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2N1bXVsYXRvcjtcbiAgICB9LCB7IC4uLm9iamVjdFxuICAgIH0pO1xuICB9O1xufVxuXG5jb25zdCBhZGQgPSAvKiNfX1BVUkVfXyovY3JlYXRlQWRqdXN0bWVudEZuKDEpO1xuY29uc3Qgc3VidHJhY3QgPSAvKiNfX1BVUkVfXyovY3JlYXRlQWRqdXN0bWVudEZuKC0xKTtcblxuZnVuY3Rpb24gaGFzVmlld3BvcnRSZWxhdGl2ZUNvb3JkaW5hdGVzKGV2ZW50KSB7XG4gIHJldHVybiAnY2xpZW50WCcgaW4gZXZlbnQgJiYgJ2NsaWVudFknIGluIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBpc0tleWJvYXJkRXZlbnQoZXZlbnQpIHtcbiAgaWYgKCFldmVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICBLZXlib2FyZEV2ZW50XG4gIH0gPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgcmV0dXJuIEtleWJvYXJkRXZlbnQgJiYgZXZlbnQgaW5zdGFuY2VvZiBLZXlib2FyZEV2ZW50O1xufVxuXG5mdW5jdGlvbiBpc1RvdWNoRXZlbnQoZXZlbnQpIHtcbiAgaWYgKCFldmVudCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICBUb3VjaEV2ZW50XG4gIH0gPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KTtcbiAgcmV0dXJuIFRvdWNoRXZlbnQgJiYgZXZlbnQgaW5zdGFuY2VvZiBUb3VjaEV2ZW50O1xufVxuXG4vKipcclxuICogUmV0dXJucyB0aGUgbm9ybWFsaXplZCB4IGFuZCB5IGNvb3JkaW5hdGVzIGZvciBtb3VzZSBhbmQgdG91Y2ggZXZlbnRzLlxyXG4gKi9cblxuZnVuY3Rpb24gZ2V0RXZlbnRDb29yZGluYXRlcyhldmVudCkge1xuICBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgIGlmIChldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNsaWVudFg6IHgsXG4gICAgICAgIGNsaWVudFk6IHlcbiAgICAgIH0gPSBldmVudC50b3VjaGVzWzBdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeCxcbiAgICAgICAgeVxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBjbGllbnRYOiB4LFxuICAgICAgICBjbGllbnRZOiB5XG4gICAgICB9ID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4LFxuICAgICAgICB5XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNWaWV3cG9ydFJlbGF0aXZlQ29vcmRpbmF0ZXMoZXZlbnQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGV2ZW50LmNsaWVudFgsXG4gICAgICB5OiBldmVudC5jbGllbnRZXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5jb25zdCBDU1MgPSAvKiNfX1BVUkVfXyovT2JqZWN0LmZyZWV6ZSh7XG4gIFRyYW5zbGF0ZToge1xuICAgIHRvU3RyaW5nKHRyYW5zZm9ybSkge1xuICAgICAgaWYgKCF0cmFuc2Zvcm0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7XG4gICAgICAgIHgsXG4gICAgICAgIHlcbiAgICAgIH0gPSB0cmFuc2Zvcm07XG4gICAgICByZXR1cm4gXCJ0cmFuc2xhdGUzZChcIiArICh4ID8gTWF0aC5yb3VuZCh4KSA6IDApICsgXCJweCwgXCIgKyAoeSA/IE1hdGgucm91bmQoeSkgOiAwKSArIFwicHgsIDApXCI7XG4gICAgfVxuXG4gIH0sXG4gIFNjYWxlOiB7XG4gICAgdG9TdHJpbmcodHJhbnNmb3JtKSB7XG4gICAgICBpZiAoIXRyYW5zZm9ybSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgc2NhbGVYLFxuICAgICAgICBzY2FsZVlcbiAgICAgIH0gPSB0cmFuc2Zvcm07XG4gICAgICByZXR1cm4gXCJzY2FsZVgoXCIgKyBzY2FsZVggKyBcIikgc2NhbGVZKFwiICsgc2NhbGVZICsgXCIpXCI7XG4gICAgfVxuXG4gIH0sXG4gIFRyYW5zZm9ybToge1xuICAgIHRvU3RyaW5nKHRyYW5zZm9ybSkge1xuICAgICAgaWYgKCF0cmFuc2Zvcm0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW0NTUy5UcmFuc2xhdGUudG9TdHJpbmcodHJhbnNmb3JtKSwgQ1NTLlNjYWxlLnRvU3RyaW5nKHRyYW5zZm9ybSldLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgfSxcbiAgVHJhbnNpdGlvbjoge1xuICAgIHRvU3RyaW5nKF9yZWYpIHtcbiAgICAgIGxldCB7XG4gICAgICAgIHByb3BlcnR5LFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgZWFzaW5nXG4gICAgICB9ID0gX3JlZjtcbiAgICAgIHJldHVybiBwcm9wZXJ0eSArIFwiIFwiICsgZHVyYXRpb24gKyBcIm1zIFwiICsgZWFzaW5nO1xuICAgIH1cblxuICB9XG59KTtcblxuY29uc3QgU0VMRUNUT1IgPSAnYSxmcmFtZSxpZnJhbWUsaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pOm5vdCg6ZGlzYWJsZWQpLHNlbGVjdDpub3QoOmRpc2FibGVkKSx0ZXh0YXJlYTpub3QoOmRpc2FibGVkKSxidXR0b246bm90KDpkaXNhYmxlZCksKlt0YWJpbmRleF0nO1xuZnVuY3Rpb24gZmluZEZpcnN0Rm9jdXNhYmxlTm9kZShlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50Lm1hdGNoZXMoU0VMRUNUT1IpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gZWxlbWVudC5xdWVyeVNlbGVjdG9yKFNFTEVDVE9SKTtcbn1cblxuZXhwb3J0IHsgQ1NTLCBhZGQsIGNhblVzZURPTSwgZmluZEZpcnN0Rm9jdXNhYmxlTm9kZSwgZ2V0RXZlbnRDb29yZGluYXRlcywgZ2V0T3duZXJEb2N1bWVudCwgZ2V0V2luZG93LCBoYXNWaWV3cG9ydFJlbGF0aXZlQ29vcmRpbmF0ZXMsIGlzRG9jdW1lbnQsIGlzSFRNTEVsZW1lbnQsIGlzS2V5Ym9hcmRFdmVudCwgaXNOb2RlLCBpc1NWR0VsZW1lbnQsIGlzVG91Y2hFdmVudCwgaXNXaW5kb3csIHN1YnRyYWN0LCB1c2VDb21iaW5lZFJlZnMsIHVzZUV2ZW50LCB1c2VJbnRlcnZhbCwgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCwgdXNlTGF0ZXN0VmFsdWUsIHVzZUxhenlNZW1vLCB1c2VOb2RlUmVmLCB1c2VQcmV2aW91cywgdXNlVW5pcXVlSWQgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxpdGllcy5lc20uanMubWFwXG4iLCJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUNhbGxiYWNrIH0gZnJvbSAncmVhY3QnO1xuXG5jb25zdCBoaWRkZW5TdHlsZXMgPSB7XG4gIGRpc3BsYXk6ICdub25lJ1xufTtcbmZ1bmN0aW9uIEhpZGRlblRleHQoX3JlZikge1xuICBsZXQge1xuICAgIGlkLFxuICAgIHZhbHVlXG4gIH0gPSBfcmVmO1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7XG4gICAgaWQ6IGlkLFxuICAgIHN0eWxlOiBoaWRkZW5TdHlsZXNcbiAgfSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBMaXZlUmVnaW9uKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBpZCxcbiAgICBhbm5vdW5jZW1lbnQsXG4gICAgYXJpYUxpdmVUeXBlID0gXCJhc3NlcnRpdmVcIlxuICB9ID0gX3JlZjtcbiAgLy8gSGlkZSBlbGVtZW50IHZpc3VhbGx5IGJ1dCBrZWVwIGl0IHJlYWRhYmxlIGJ5IHNjcmVlbiByZWFkZXJzXG4gIGNvbnN0IHZpc3VhbGx5SGlkZGVuID0ge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHdpZHRoOiAxLFxuICAgIGhlaWdodDogMSxcbiAgICBtYXJnaW46IC0xLFxuICAgIGJvcmRlcjogMCxcbiAgICBwYWRkaW5nOiAwLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICBjbGlwOiAncmVjdCgwIDAgMCAwKScsXG4gICAgY2xpcFBhdGg6ICdpbnNldCgxMDAlKScsXG4gICAgd2hpdGVTcGFjZTogJ25vd3JhcCdcbiAgfTtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1xuICAgIGlkOiBpZCxcbiAgICBzdHlsZTogdmlzdWFsbHlIaWRkZW4sXG4gICAgcm9sZTogXCJzdGF0dXNcIixcbiAgICBcImFyaWEtbGl2ZVwiOiBhcmlhTGl2ZVR5cGUsXG4gICAgXCJhcmlhLWF0b21pY1wiOiB0cnVlXG4gIH0sIGFubm91bmNlbWVudCk7XG59XG5cbmZ1bmN0aW9uIHVzZUFubm91bmNlbWVudCgpIHtcbiAgY29uc3QgW2Fubm91bmNlbWVudCwgc2V0QW5ub3VuY2VtZW50XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgYW5ub3VuY2UgPSB1c2VDYWxsYmFjayh2YWx1ZSA9PiB7XG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgIHNldEFubm91bmNlbWVudCh2YWx1ZSk7XG4gICAgfVxuICB9LCBbXSk7XG4gIHJldHVybiB7XG4gICAgYW5ub3VuY2UsXG4gICAgYW5ub3VuY2VtZW50XG4gIH07XG59XG5cbmV4cG9ydCB7IEhpZGRlblRleHQsIExpdmVSZWdpb24sIHVzZUFubm91bmNlbWVudCB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWNjZXNzaWJpbGl0eS5lc20uanMubWFwXG4iLCJpbXBvcnQgUmVhY3QsIHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlRWZmZWN0LCB1c2VTdGF0ZSwgdXNlQ2FsbGJhY2ssIHVzZU1lbW8sIHVzZVJlZiwgbWVtbywgdXNlUmVkdWNlciwgY2xvbmVFbGVtZW50LCBmb3J3YXJkUmVmIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3JlYXRlUG9ydGFsLCB1bnN0YWJsZV9iYXRjaGVkVXBkYXRlcyB9IGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgeyB1c2VVbmlxdWVJZCwgZ2V0RXZlbnRDb29yZGluYXRlcywgZ2V0V2luZG93LCBpc0RvY3VtZW50LCBpc0hUTUxFbGVtZW50LCBpc1NWR0VsZW1lbnQsIGNhblVzZURPTSwgaXNXaW5kb3csIGlzTm9kZSwgZ2V0T3duZXJEb2N1bWVudCwgYWRkLCBpc0tleWJvYXJkRXZlbnQsIHN1YnRyYWN0LCB1c2VMYXp5TWVtbywgdXNlSW50ZXJ2YWwsIHVzZVByZXZpb3VzLCB1c2VMYXRlc3RWYWx1ZSwgdXNlRXZlbnQsIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QsIHVzZU5vZGVSZWYsIGZpbmRGaXJzdEZvY3VzYWJsZU5vZGUsIENTUyB9IGZyb20gJ0BkbmQta2l0L3V0aWxpdGllcyc7XG5pbXBvcnQgeyB1c2VBbm5vdW5jZW1lbnQsIEhpZGRlblRleHQsIExpdmVSZWdpb24gfSBmcm9tICdAZG5kLWtpdC9hY2Nlc3NpYmlsaXR5JztcblxuY29uc3QgRG5kTW9uaXRvckNvbnRleHQgPSAvKiNfX1BVUkVfXyovY3JlYXRlQ29udGV4dChudWxsKTtcblxuZnVuY3Rpb24gdXNlRG5kTW9uaXRvcihsaXN0ZW5lcikge1xuICBjb25zdCByZWdpc3Rlckxpc3RlbmVyID0gdXNlQ29udGV4dChEbmRNb25pdG9yQ29udGV4dCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFyZWdpc3Rlckxpc3RlbmVyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VzZURuZE1vbml0b3IgbXVzdCBiZSB1c2VkIHdpdGhpbiBhIGNoaWxkcmVuIG9mIDxEbmRDb250ZXh0PicpO1xuICAgIH1cblxuICAgIGNvbnN0IHVuc3Vic2NyaWJlID0gcmVnaXN0ZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIHVuc3Vic2NyaWJlO1xuICB9LCBbbGlzdGVuZXIsIHJlZ2lzdGVyTGlzdGVuZXJdKTtcbn1cblxuZnVuY3Rpb24gdXNlRG5kTW9uaXRvclByb3ZpZGVyKCkge1xuICBjb25zdCBbbGlzdGVuZXJzXSA9IHVzZVN0YXRlKCgpID0+IG5ldyBTZXQoKSk7XG4gIGNvbnN0IHJlZ2lzdGVyTGlzdGVuZXIgPSB1c2VDYWxsYmFjayhsaXN0ZW5lciA9PiB7XG4gICAgbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgcmV0dXJuICgpID0+IGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9LCBbbGlzdGVuZXJzXSk7XG4gIGNvbnN0IGRpc3BhdGNoID0gdXNlQ2FsbGJhY2soX3JlZiA9PiB7XG4gICAgbGV0IHtcbiAgICAgIHR5cGUsXG4gICAgICBldmVudFxuICAgIH0gPSBfcmVmO1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgIHZhciBfbGlzdGVuZXIkdHlwZTtcblxuICAgICAgcmV0dXJuIChfbGlzdGVuZXIkdHlwZSA9IGxpc3RlbmVyW3R5cGVdKSA9PSBudWxsID8gdm9pZCAwIDogX2xpc3RlbmVyJHR5cGUuY2FsbChsaXN0ZW5lciwgZXZlbnQpO1xuICAgIH0pO1xuICB9LCBbbGlzdGVuZXJzXSk7XG4gIHJldHVybiBbZGlzcGF0Y2gsIHJlZ2lzdGVyTGlzdGVuZXJdO1xufVxuXG5jb25zdCBkZWZhdWx0U2NyZWVuUmVhZGVySW5zdHJ1Y3Rpb25zID0ge1xuICBkcmFnZ2FibGU6IFwiXFxuICAgIFRvIHBpY2sgdXAgYSBkcmFnZ2FibGUgaXRlbSwgcHJlc3MgdGhlIHNwYWNlIGJhci5cXG4gICAgV2hpbGUgZHJhZ2dpbmcsIHVzZSB0aGUgYXJyb3cga2V5cyB0byBtb3ZlIHRoZSBpdGVtLlxcbiAgICBQcmVzcyBzcGFjZSBhZ2FpbiB0byBkcm9wIHRoZSBpdGVtIGluIGl0cyBuZXcgcG9zaXRpb24sIG9yIHByZXNzIGVzY2FwZSB0byBjYW5jZWwuXFxuICBcIlxufTtcbmNvbnN0IGRlZmF1bHRBbm5vdW5jZW1lbnRzID0ge1xuICBvbkRyYWdTdGFydChfcmVmKSB7XG4gICAgbGV0IHtcbiAgICAgIGFjdGl2ZVxuICAgIH0gPSBfcmVmO1xuICAgIHJldHVybiBcIlBpY2tlZCB1cCBkcmFnZ2FibGUgaXRlbSBcIiArIGFjdGl2ZS5pZCArIFwiLlwiO1xuICB9LFxuXG4gIG9uRHJhZ092ZXIoX3JlZjIpIHtcbiAgICBsZXQge1xuICAgICAgYWN0aXZlLFxuICAgICAgb3ZlclxuICAgIH0gPSBfcmVmMjtcblxuICAgIGlmIChvdmVyKSB7XG4gICAgICByZXR1cm4gXCJEcmFnZ2FibGUgaXRlbSBcIiArIGFjdGl2ZS5pZCArIFwiIHdhcyBtb3ZlZCBvdmVyIGRyb3BwYWJsZSBhcmVhIFwiICsgb3Zlci5pZCArIFwiLlwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIkRyYWdnYWJsZSBpdGVtIFwiICsgYWN0aXZlLmlkICsgXCIgaXMgbm8gbG9uZ2VyIG92ZXIgYSBkcm9wcGFibGUgYXJlYS5cIjtcbiAgfSxcblxuICBvbkRyYWdFbmQoX3JlZjMpIHtcbiAgICBsZXQge1xuICAgICAgYWN0aXZlLFxuICAgICAgb3ZlclxuICAgIH0gPSBfcmVmMztcblxuICAgIGlmIChvdmVyKSB7XG4gICAgICByZXR1cm4gXCJEcmFnZ2FibGUgaXRlbSBcIiArIGFjdGl2ZS5pZCArIFwiIHdhcyBkcm9wcGVkIG92ZXIgZHJvcHBhYmxlIGFyZWEgXCIgKyBvdmVyLmlkO1xuICAgIH1cblxuICAgIHJldHVybiBcIkRyYWdnYWJsZSBpdGVtIFwiICsgYWN0aXZlLmlkICsgXCIgd2FzIGRyb3BwZWQuXCI7XG4gIH0sXG5cbiAgb25EcmFnQ2FuY2VsKF9yZWY0KSB7XG4gICAgbGV0IHtcbiAgICAgIGFjdGl2ZVxuICAgIH0gPSBfcmVmNDtcbiAgICByZXR1cm4gXCJEcmFnZ2luZyB3YXMgY2FuY2VsbGVkLiBEcmFnZ2FibGUgaXRlbSBcIiArIGFjdGl2ZS5pZCArIFwiIHdhcyBkcm9wcGVkLlwiO1xuICB9XG5cbn07XG5cbmZ1bmN0aW9uIEFjY2Vzc2liaWxpdHkoX3JlZikge1xuICBsZXQge1xuICAgIGFubm91bmNlbWVudHMgPSBkZWZhdWx0QW5ub3VuY2VtZW50cyxcbiAgICBjb250YWluZXIsXG4gICAgaGlkZGVuVGV4dERlc2NyaWJlZEJ5SWQsXG4gICAgc2NyZWVuUmVhZGVySW5zdHJ1Y3Rpb25zID0gZGVmYXVsdFNjcmVlblJlYWRlckluc3RydWN0aW9uc1xuICB9ID0gX3JlZjtcbiAgY29uc3Qge1xuICAgIGFubm91bmNlLFxuICAgIGFubm91bmNlbWVudFxuICB9ID0gdXNlQW5ub3VuY2VtZW50KCk7XG4gIGNvbnN0IGxpdmVSZWdpb25JZCA9IHVzZVVuaXF1ZUlkKFwiRG5kTGl2ZVJlZ2lvblwiKTtcbiAgY29uc3QgW21vdW50ZWQsIHNldE1vdW50ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHNldE1vdW50ZWQodHJ1ZSk7XG4gIH0sIFtdKTtcbiAgdXNlRG5kTW9uaXRvcih1c2VNZW1vKCgpID0+ICh7XG4gICAgb25EcmFnU3RhcnQoX3JlZjIpIHtcbiAgICAgIGxldCB7XG4gICAgICAgIGFjdGl2ZVxuICAgICAgfSA9IF9yZWYyO1xuICAgICAgYW5ub3VuY2UoYW5ub3VuY2VtZW50cy5vbkRyYWdTdGFydCh7XG4gICAgICAgIGFjdGl2ZVxuICAgICAgfSkpO1xuICAgIH0sXG5cbiAgICBvbkRyYWdNb3ZlKF9yZWYzKSB7XG4gICAgICBsZXQge1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0gPSBfcmVmMztcblxuICAgICAgaWYgKGFubm91bmNlbWVudHMub25EcmFnTW92ZSkge1xuICAgICAgICBhbm5vdW5jZShhbm5vdW5jZW1lbnRzLm9uRHJhZ01vdmUoe1xuICAgICAgICAgIGFjdGl2ZSxcbiAgICAgICAgICBvdmVyXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25EcmFnT3ZlcihfcmVmNCkge1xuICAgICAgbGV0IHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9ID0gX3JlZjQ7XG4gICAgICBhbm5vdW5jZShhbm5vdW5jZW1lbnRzLm9uRHJhZ092ZXIoe1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgb25EcmFnRW5kKF9yZWY1KSB7XG4gICAgICBsZXQge1xuICAgICAgICBhY3RpdmUsXG4gICAgICAgIG92ZXJcbiAgICAgIH0gPSBfcmVmNTtcbiAgICAgIGFubm91bmNlKGFubm91bmNlbWVudHMub25EcmFnRW5kKHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9KSk7XG4gICAgfSxcblxuICAgIG9uRHJhZ0NhbmNlbChfcmVmNikge1xuICAgICAgbGV0IHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBvdmVyXG4gICAgICB9ID0gX3JlZjY7XG4gICAgICBhbm5vdW5jZShhbm5vdW5jZW1lbnRzLm9uRHJhZ0NhbmNlbCh7XG4gICAgICAgIGFjdGl2ZSxcbiAgICAgICAgb3ZlclxuICAgICAgfSkpO1xuICAgIH1cblxuICB9KSwgW2Fubm91bmNlLCBhbm5vdW5jZW1lbnRzXSkpO1xuXG4gIGlmICghbW91bnRlZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgbWFya3VwID0gUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwgUmVhY3QuY3JlYXRlRWxlbWVudChIaWRkZW5UZXh0LCB7XG4gICAgaWQ6IGhpZGRlblRleHREZXNjcmliZWRCeUlkLFxuICAgIHZhbHVlOiBzY3JlZW5SZWFkZXJJbnN0cnVjdGlvbnMuZHJhZ2dhYmxlXG4gIH0pLCBSZWFjdC5jcmVhdGVFbGVtZW50KExpdmVSZWdpb24sIHtcbiAgICBpZDogbGl2ZVJlZ2lvbklkLFxuICAgIGFubm91bmNlbWVudDogYW5ub3VuY2VtZW50XG4gIH0pKTtcbiAgcmV0dXJuIGNvbnRhaW5lciA/IGNyZWF0ZVBvcnRhbChtYXJrdXAsIGNvbnRhaW5lcikgOiBtYXJrdXA7XG59XG5cbnZhciBBY3Rpb247XG5cbihmdW5jdGlvbiAoQWN0aW9uKSB7XG4gIEFjdGlvbltcIkRyYWdTdGFydFwiXSA9IFwiZHJhZ1N0YXJ0XCI7XG4gIEFjdGlvbltcIkRyYWdNb3ZlXCJdID0gXCJkcmFnTW92ZVwiO1xuICBBY3Rpb25bXCJEcmFnRW5kXCJdID0gXCJkcmFnRW5kXCI7XG4gIEFjdGlvbltcIkRyYWdDYW5jZWxcIl0gPSBcImRyYWdDYW5jZWxcIjtcbiAgQWN0aW9uW1wiRHJhZ092ZXJcIl0gPSBcImRyYWdPdmVyXCI7XG4gIEFjdGlvbltcIlJlZ2lzdGVyRHJvcHBhYmxlXCJdID0gXCJyZWdpc3RlckRyb3BwYWJsZVwiO1xuICBBY3Rpb25bXCJTZXREcm9wcGFibGVEaXNhYmxlZFwiXSA9IFwic2V0RHJvcHBhYmxlRGlzYWJsZWRcIjtcbiAgQWN0aW9uW1wiVW5yZWdpc3RlckRyb3BwYWJsZVwiXSA9IFwidW5yZWdpc3RlckRyb3BwYWJsZVwiO1xufSkoQWN0aW9uIHx8IChBY3Rpb24gPSB7fSkpO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gdXNlU2Vuc29yKHNlbnNvciwgb3B0aW9ucykge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiAoe1xuICAgIHNlbnNvcixcbiAgICBvcHRpb25zOiBvcHRpb25zICE9IG51bGwgPyBvcHRpb25zIDoge31cbiAgfSksIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW3NlbnNvciwgb3B0aW9uc10pO1xufVxuXG5mdW5jdGlvbiB1c2VTZW5zb3JzKCkge1xuICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgc2Vuc29ycyA9IG5ldyBBcnJheShfbGVuKSwgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICBzZW5zb3JzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICB9XG5cbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gWy4uLnNlbnNvcnNdLmZpbHRlcihzZW5zb3IgPT4gc2Vuc29yICE9IG51bGwpLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFsuLi5zZW5zb3JzXSk7XG59XG5cbmNvbnN0IGRlZmF1bHRDb29yZGluYXRlcyA9IC8qI19fUFVSRV9fKi9PYmplY3QuZnJlZXplKHtcbiAgeDogMCxcbiAgeTogMFxufSk7XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHNcclxuICovXG5mdW5jdGlvbiBkaXN0YW5jZUJldHdlZW4ocDEsIHAyKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocDEueCAtIHAyLngsIDIpICsgTWF0aC5wb3cocDEueSAtIHAyLnksIDIpKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVsYXRpdmVUcmFuc2Zvcm1PcmlnaW4oZXZlbnQsIHJlY3QpIHtcbiAgY29uc3QgZXZlbnRDb29yZGluYXRlcyA9IGdldEV2ZW50Q29vcmRpbmF0ZXMoZXZlbnQpO1xuXG4gIGlmICghZXZlbnRDb29yZGluYXRlcykge1xuICAgIHJldHVybiAnMCAwJztcbiAgfVxuXG4gIGNvbnN0IHRyYW5zZm9ybU9yaWdpbiA9IHtcbiAgICB4OiAoZXZlbnRDb29yZGluYXRlcy54IC0gcmVjdC5sZWZ0KSAvIHJlY3Qud2lkdGggKiAxMDAsXG4gICAgeTogKGV2ZW50Q29vcmRpbmF0ZXMueSAtIHJlY3QudG9wKSAvIHJlY3QuaGVpZ2h0ICogMTAwXG4gIH07XG4gIHJldHVybiB0cmFuc2Zvcm1PcmlnaW4ueCArIFwiJSBcIiArIHRyYW5zZm9ybU9yaWdpbi55ICsgXCIlXCI7XG59XG5cbi8qKlxyXG4gKiBTb3J0IGNvbGxpc2lvbnMgZnJvbSBzbWFsbGVzdCB0byBncmVhdGVzdCB2YWx1ZVxyXG4gKi9cbmZ1bmN0aW9uIHNvcnRDb2xsaXNpb25zQXNjKF9yZWYsIF9yZWYyKSB7XG4gIGxldCB7XG4gICAgZGF0YToge1xuICAgICAgdmFsdWU6IGFcbiAgICB9XG4gIH0gPSBfcmVmO1xuICBsZXQge1xuICAgIGRhdGE6IHtcbiAgICAgIHZhbHVlOiBiXG4gICAgfVxuICB9ID0gX3JlZjI7XG4gIHJldHVybiBhIC0gYjtcbn1cbi8qKlxyXG4gKiBTb3J0IGNvbGxpc2lvbnMgZnJvbSBncmVhdGVzdCB0byBzbWFsbGVzdCB2YWx1ZVxyXG4gKi9cblxuZnVuY3Rpb24gc29ydENvbGxpc2lvbnNEZXNjKF9yZWYzLCBfcmVmNCkge1xuICBsZXQge1xuICAgIGRhdGE6IHtcbiAgICAgIHZhbHVlOiBhXG4gICAgfVxuICB9ID0gX3JlZjM7XG4gIGxldCB7XG4gICAgZGF0YToge1xuICAgICAgdmFsdWU6IGJcbiAgICB9XG4gIH0gPSBfcmVmNDtcbiAgcmV0dXJuIGIgLSBhO1xufVxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBjb3JuZXJzIG9mIGEgZ2l2ZW4gcmVjdGFuZ2xlOlxyXG4gKiBbVG9wTGVmdCB7eCwgeX0sIFRvcFJpZ2h0IHt4LCB5fSwgQm90dG9tTGVmdCB7eCwgeX0sIEJvdHRvbVJpZ2h0IHt4LCB5fV1cclxuICovXG5cbmZ1bmN0aW9uIGNvcm5lcnNPZlJlY3RhbmdsZShfcmVmNSkge1xuICBsZXQge1xuICAgIGxlZnQsXG4gICAgdG9wLFxuICAgIGhlaWdodCxcbiAgICB3aWR0aFxuICB9ID0gX3JlZjU7XG4gIHJldHVybiBbe1xuICAgIHg6IGxlZnQsXG4gICAgeTogdG9wXG4gIH0sIHtcbiAgICB4OiBsZWZ0ICsgd2lkdGgsXG4gICAgeTogdG9wXG4gIH0sIHtcbiAgICB4OiBsZWZ0LFxuICAgIHk6IHRvcCArIGhlaWdodFxuICB9LCB7XG4gICAgeDogbGVmdCArIHdpZHRoLFxuICAgIHk6IHRvcCArIGhlaWdodFxuICB9XTtcbn1cbmZ1bmN0aW9uIGdldEZpcnN0Q29sbGlzaW9uKGNvbGxpc2lvbnMsIHByb3BlcnR5KSB7XG4gIGlmICghY29sbGlzaW9ucyB8fCBjb2xsaXNpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgW2ZpcnN0Q29sbGlzaW9uXSA9IGNvbGxpc2lvbnM7XG4gIHJldHVybiBwcm9wZXJ0eSA/IGZpcnN0Q29sbGlzaW9uW3Byb3BlcnR5XSA6IGZpcnN0Q29sbGlzaW9uO1xufVxuXG4vKipcclxuICogUmV0dXJucyB0aGUgY29vcmRpbmF0ZXMgb2YgdGhlIGNlbnRlciBvZiBhIGdpdmVuIENsaWVudFJlY3RcclxuICovXG5cbmZ1bmN0aW9uIGNlbnRlck9mUmVjdGFuZ2xlKHJlY3QsIGxlZnQsIHRvcCkge1xuICBpZiAobGVmdCA9PT0gdm9pZCAwKSB7XG4gICAgbGVmdCA9IHJlY3QubGVmdDtcbiAgfVxuXG4gIGlmICh0b3AgPT09IHZvaWQgMCkge1xuICAgIHRvcCA9IHJlY3QudG9wO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB4OiBsZWZ0ICsgcmVjdC53aWR0aCAqIDAuNSxcbiAgICB5OiB0b3AgKyByZWN0LmhlaWdodCAqIDAuNVxuICB9O1xufVxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGNsb3Nlc3QgcmVjdGFuZ2xlcyBmcm9tIGFuIGFycmF5IG9mIHJlY3RhbmdsZXMgdG8gdGhlIGNlbnRlciBvZiBhIGdpdmVuXHJcbiAqIHJlY3RhbmdsZS5cclxuICovXG5cblxuY29uc3QgY2xvc2VzdENlbnRlciA9IF9yZWYgPT4ge1xuICBsZXQge1xuICAgIGNvbGxpc2lvblJlY3QsXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgZHJvcHBhYmxlQ29udGFpbmVyc1xuICB9ID0gX3JlZjtcbiAgY29uc3QgY2VudGVyUmVjdCA9IGNlbnRlck9mUmVjdGFuZ2xlKGNvbGxpc2lvblJlY3QsIGNvbGxpc2lvblJlY3QubGVmdCwgY29sbGlzaW9uUmVjdC50b3ApO1xuICBjb25zdCBjb2xsaXNpb25zID0gW107XG5cbiAgZm9yIChjb25zdCBkcm9wcGFibGVDb250YWluZXIgb2YgZHJvcHBhYmxlQ29udGFpbmVycykge1xuICAgIGNvbnN0IHtcbiAgICAgIGlkXG4gICAgfSA9IGRyb3BwYWJsZUNvbnRhaW5lcjtcbiAgICBjb25zdCByZWN0ID0gZHJvcHBhYmxlUmVjdHMuZ2V0KGlkKTtcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICBjb25zdCBkaXN0QmV0d2VlbiA9IGRpc3RhbmNlQmV0d2VlbihjZW50ZXJPZlJlY3RhbmdsZShyZWN0KSwgY2VudGVyUmVjdCk7XG4gICAgICBjb2xsaXNpb25zLnB1c2goe1xuICAgICAgICBpZCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcixcbiAgICAgICAgICB2YWx1ZTogZGlzdEJldHdlZW5cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbGxpc2lvbnMuc29ydChzb3J0Q29sbGlzaW9uc0FzYyk7XG59O1xuXG4vKipcclxuICogUmV0dXJucyB0aGUgY2xvc2VzdCByZWN0YW5nbGVzIGZyb20gYW4gYXJyYXkgb2YgcmVjdGFuZ2xlcyB0byB0aGUgY29ybmVycyBvZlxyXG4gKiBhbm90aGVyIHJlY3RhbmdsZS5cclxuICovXG5cbmNvbnN0IGNsb3Nlc3RDb3JuZXJzID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgY29sbGlzaW9uUmVjdCxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzXG4gIH0gPSBfcmVmO1xuICBjb25zdCBjb3JuZXJzID0gY29ybmVyc09mUmVjdGFuZ2xlKGNvbGxpc2lvblJlY3QpO1xuICBjb25zdCBjb2xsaXNpb25zID0gW107XG5cbiAgZm9yIChjb25zdCBkcm9wcGFibGVDb250YWluZXIgb2YgZHJvcHBhYmxlQ29udGFpbmVycykge1xuICAgIGNvbnN0IHtcbiAgICAgIGlkXG4gICAgfSA9IGRyb3BwYWJsZUNvbnRhaW5lcjtcbiAgICBjb25zdCByZWN0ID0gZHJvcHBhYmxlUmVjdHMuZ2V0KGlkKTtcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICBjb25zdCByZWN0Q29ybmVycyA9IGNvcm5lcnNPZlJlY3RhbmdsZShyZWN0KTtcbiAgICAgIGNvbnN0IGRpc3RhbmNlcyA9IGNvcm5lcnMucmVkdWNlKChhY2N1bXVsYXRvciwgY29ybmVyLCBpbmRleCkgPT4ge1xuICAgICAgICByZXR1cm4gYWNjdW11bGF0b3IgKyBkaXN0YW5jZUJldHdlZW4ocmVjdENvcm5lcnNbaW5kZXhdLCBjb3JuZXIpO1xuICAgICAgfSwgMCk7XG4gICAgICBjb25zdCBlZmZlY3RpdmVEaXN0YW5jZSA9IE51bWJlcigoZGlzdGFuY2VzIC8gNCkudG9GaXhlZCg0KSk7XG4gICAgICBjb2xsaXNpb25zLnB1c2goe1xuICAgICAgICBpZCxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcixcbiAgICAgICAgICB2YWx1ZTogZWZmZWN0aXZlRGlzdGFuY2VcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbGxpc2lvbnMuc29ydChzb3J0Q29sbGlzaW9uc0FzYyk7XG59O1xuXG4vKipcclxuICogUmV0dXJucyB0aGUgaW50ZXJzZWN0aW5nIHJlY3RhbmdsZSBhcmVhIGJldHdlZW4gdHdvIHJlY3RhbmdsZXNcclxuICovXG5cbmZ1bmN0aW9uIGdldEludGVyc2VjdGlvblJhdGlvKGVudHJ5LCB0YXJnZXQpIHtcbiAgY29uc3QgdG9wID0gTWF0aC5tYXgodGFyZ2V0LnRvcCwgZW50cnkudG9wKTtcbiAgY29uc3QgbGVmdCA9IE1hdGgubWF4KHRhcmdldC5sZWZ0LCBlbnRyeS5sZWZ0KTtcbiAgY29uc3QgcmlnaHQgPSBNYXRoLm1pbih0YXJnZXQubGVmdCArIHRhcmdldC53aWR0aCwgZW50cnkubGVmdCArIGVudHJ5LndpZHRoKTtcbiAgY29uc3QgYm90dG9tID0gTWF0aC5taW4odGFyZ2V0LnRvcCArIHRhcmdldC5oZWlnaHQsIGVudHJ5LnRvcCArIGVudHJ5LmhlaWdodCk7XG4gIGNvbnN0IHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xuICBjb25zdCBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cbiAgaWYgKGxlZnQgPCByaWdodCAmJiB0b3AgPCBib3R0b20pIHtcbiAgICBjb25zdCB0YXJnZXRBcmVhID0gdGFyZ2V0LndpZHRoICogdGFyZ2V0LmhlaWdodDtcbiAgICBjb25zdCBlbnRyeUFyZWEgPSBlbnRyeS53aWR0aCAqIGVudHJ5LmhlaWdodDtcbiAgICBjb25zdCBpbnRlcnNlY3Rpb25BcmVhID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgY29uc3QgaW50ZXJzZWN0aW9uUmF0aW8gPSBpbnRlcnNlY3Rpb25BcmVhIC8gKHRhcmdldEFyZWEgKyBlbnRyeUFyZWEgLSBpbnRlcnNlY3Rpb25BcmVhKTtcbiAgICByZXR1cm4gTnVtYmVyKGludGVyc2VjdGlvblJhdGlvLnRvRml4ZWQoNCkpO1xuICB9IC8vIFJlY3RhbmdsZXMgZG8gbm90IG92ZXJsYXAsIG9yIG92ZXJsYXAgaGFzIGFuIGFyZWEgb2YgemVybyAoZWRnZS9jb3JuZXIgb3ZlcmxhcClcblxuXG4gIHJldHVybiAwO1xufVxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHJlY3RhbmdsZXMgdGhhdCBoYXMgdGhlIGdyZWF0ZXN0IGludGVyc2VjdGlvbiBhcmVhIHdpdGggYSBnaXZlblxyXG4gKiByZWN0YW5nbGUgaW4gYW4gYXJyYXkgb2YgcmVjdGFuZ2xlcy5cclxuICovXG5cbmNvbnN0IHJlY3RJbnRlcnNlY3Rpb24gPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBjb2xsaXNpb25SZWN0LFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnNcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IGNvbGxpc2lvbnMgPSBbXTtcblxuICBmb3IgKGNvbnN0IGRyb3BwYWJsZUNvbnRhaW5lciBvZiBkcm9wcGFibGVDb250YWluZXJzKSB7XG4gICAgY29uc3Qge1xuICAgICAgaWRcbiAgICB9ID0gZHJvcHBhYmxlQ29udGFpbmVyO1xuICAgIGNvbnN0IHJlY3QgPSBkcm9wcGFibGVSZWN0cy5nZXQoaWQpO1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIGNvbnN0IGludGVyc2VjdGlvblJhdGlvID0gZ2V0SW50ZXJzZWN0aW9uUmF0aW8ocmVjdCwgY29sbGlzaW9uUmVjdCk7XG5cbiAgICAgIGlmIChpbnRlcnNlY3Rpb25SYXRpbyA+IDApIHtcbiAgICAgICAgY29sbGlzaW9ucy5wdXNoKHtcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkcm9wcGFibGVDb250YWluZXIsXG4gICAgICAgICAgICB2YWx1ZTogaW50ZXJzZWN0aW9uUmF0aW9cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb2xsaXNpb25zLnNvcnQoc29ydENvbGxpc2lvbnNEZXNjKTtcbn07XG5cbi8qKlxyXG4gKiBDaGVjayBpZiBhIGdpdmVuIHBvaW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBib3VuZGluZyByZWN0YW5nbGVcclxuICovXG5cbmZ1bmN0aW9uIGlzUG9pbnRXaXRoaW5SZWN0KHBvaW50LCByZWN0KSB7XG4gIGNvbnN0IHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICBib3R0b20sXG4gICAgcmlnaHRcbiAgfSA9IHJlY3Q7XG4gIHJldHVybiB0b3AgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IGJvdHRvbSAmJiBsZWZ0IDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSByaWdodDtcbn1cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSByZWN0YW5nbGVzIHRoYXQgdGhlIHBvaW50ZXIgaXMgaG92ZXJpbmcgb3ZlclxyXG4gKi9cblxuXG5jb25zdCBwb2ludGVyV2l0aGluID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICBkcm9wcGFibGVSZWN0cyxcbiAgICBwb2ludGVyQ29vcmRpbmF0ZXNcbiAgfSA9IF9yZWY7XG5cbiAgaWYgKCFwb2ludGVyQ29vcmRpbmF0ZXMpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBjb2xsaXNpb25zID0gW107XG5cbiAgZm9yIChjb25zdCBkcm9wcGFibGVDb250YWluZXIgb2YgZHJvcHBhYmxlQ29udGFpbmVycykge1xuICAgIGNvbnN0IHtcbiAgICAgIGlkXG4gICAgfSA9IGRyb3BwYWJsZUNvbnRhaW5lcjtcbiAgICBjb25zdCByZWN0ID0gZHJvcHBhYmxlUmVjdHMuZ2V0KGlkKTtcblxuICAgIGlmIChyZWN0ICYmIGlzUG9pbnRXaXRoaW5SZWN0KHBvaW50ZXJDb29yZGluYXRlcywgcmVjdCkpIHtcbiAgICAgIC8qIFRoZXJlIG1heSBiZSBtb3JlIHRoYW4gYSBzaW5nbGUgcmVjdGFuZ2xlIGludGVyc2VjdGluZ1xyXG4gICAgICAgKiB3aXRoIHRoZSBwb2ludGVyIGNvb3JkaW5hdGVzLiBJbiBvcmRlciB0byBzb3J0IHRoZVxyXG4gICAgICAgKiBjb2xsaWRpbmcgcmVjdGFuZ2xlcywgd2UgbWVhc3VyZSB0aGUgZGlzdGFuY2UgYmV0d2VlblxyXG4gICAgICAgKiB0aGUgcG9pbnRlciBhbmQgdGhlIGNvcm5lcnMgb2YgdGhlIGludGVyc2VjdGluZyByZWN0YW5nbGVcclxuICAgICAgICovXG4gICAgICBjb25zdCBjb3JuZXJzID0gY29ybmVyc09mUmVjdGFuZ2xlKHJlY3QpO1xuICAgICAgY29uc3QgZGlzdGFuY2VzID0gY29ybmVycy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBjb3JuZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjY3VtdWxhdG9yICsgZGlzdGFuY2VCZXR3ZWVuKHBvaW50ZXJDb29yZGluYXRlcywgY29ybmVyKTtcbiAgICAgIH0sIDApO1xuICAgICAgY29uc3QgZWZmZWN0aXZlRGlzdGFuY2UgPSBOdW1iZXIoKGRpc3RhbmNlcyAvIDQpLnRvRml4ZWQoNCkpO1xuICAgICAgY29sbGlzaW9ucy5wdXNoKHtcbiAgICAgICAgaWQsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBkcm9wcGFibGVDb250YWluZXIsXG4gICAgICAgICAgdmFsdWU6IGVmZmVjdGl2ZURpc3RhbmNlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb2xsaXNpb25zLnNvcnQoc29ydENvbGxpc2lvbnNBc2MpO1xufTtcblxuZnVuY3Rpb24gYWRqdXN0U2NhbGUodHJhbnNmb3JtLCByZWN0MSwgcmVjdDIpIHtcbiAgcmV0dXJuIHsgLi4udHJhbnNmb3JtLFxuICAgIHNjYWxlWDogcmVjdDEgJiYgcmVjdDIgPyByZWN0MS53aWR0aCAvIHJlY3QyLndpZHRoIDogMSxcbiAgICBzY2FsZVk6IHJlY3QxICYmIHJlY3QyID8gcmVjdDEuaGVpZ2h0IC8gcmVjdDIuaGVpZ2h0IDogMVxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRSZWN0RGVsdGEocmVjdDEsIHJlY3QyKSB7XG4gIHJldHVybiByZWN0MSAmJiByZWN0MiA/IHtcbiAgICB4OiByZWN0MS5sZWZ0IC0gcmVjdDIubGVmdCxcbiAgICB5OiByZWN0MS50b3AgLSByZWN0Mi50b3BcbiAgfSA6IGRlZmF1bHRDb29yZGluYXRlcztcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVjdEFkanVzdG1lbnRGbihtb2RpZmllcikge1xuICByZXR1cm4gZnVuY3Rpb24gYWRqdXN0Q2xpZW50UmVjdChyZWN0KSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFkanVzdG1lbnRzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFkanVzdG1lbnRzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWRqdXN0bWVudHMucmVkdWNlKChhY2MsIGFkanVzdG1lbnQpID0+ICh7IC4uLmFjYyxcbiAgICAgIHRvcDogYWNjLnRvcCArIG1vZGlmaWVyICogYWRqdXN0bWVudC55LFxuICAgICAgYm90dG9tOiBhY2MuYm90dG9tICsgbW9kaWZpZXIgKiBhZGp1c3RtZW50LnksXG4gICAgICBsZWZ0OiBhY2MubGVmdCArIG1vZGlmaWVyICogYWRqdXN0bWVudC54LFxuICAgICAgcmlnaHQ6IGFjYy5yaWdodCArIG1vZGlmaWVyICogYWRqdXN0bWVudC54XG4gICAgfSksIHsgLi4ucmVjdFxuICAgIH0pO1xuICB9O1xufVxuY29uc3QgZ2V0QWRqdXN0ZWRSZWN0ID0gLyojX19QVVJFX18qL2NyZWF0ZVJlY3RBZGp1c3RtZW50Rm4oMSk7XG5cbmZ1bmN0aW9uIHBhcnNlVHJhbnNmb3JtKHRyYW5zZm9ybSkge1xuICBpZiAodHJhbnNmb3JtLnN0YXJ0c1dpdGgoJ21hdHJpeDNkKCcpKSB7XG4gICAgY29uc3QgdHJhbnNmb3JtQXJyYXkgPSB0cmFuc2Zvcm0uc2xpY2UoOSwgLTEpLnNwbGl0KC8sIC8pO1xuICAgIHJldHVybiB7XG4gICAgICB4OiArdHJhbnNmb3JtQXJyYXlbMTJdLFxuICAgICAgeTogK3RyYW5zZm9ybUFycmF5WzEzXSxcbiAgICAgIHNjYWxlWDogK3RyYW5zZm9ybUFycmF5WzBdLFxuICAgICAgc2NhbGVZOiArdHJhbnNmb3JtQXJyYXlbNV1cbiAgICB9O1xuICB9IGVsc2UgaWYgKHRyYW5zZm9ybS5zdGFydHNXaXRoKCdtYXRyaXgoJykpIHtcbiAgICBjb25zdCB0cmFuc2Zvcm1BcnJheSA9IHRyYW5zZm9ybS5zbGljZSg3LCAtMSkuc3BsaXQoLywgLyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6ICt0cmFuc2Zvcm1BcnJheVs0XSxcbiAgICAgIHk6ICt0cmFuc2Zvcm1BcnJheVs1XSxcbiAgICAgIHNjYWxlWDogK3RyYW5zZm9ybUFycmF5WzBdLFxuICAgICAgc2NhbGVZOiArdHJhbnNmb3JtQXJyYXlbM11cbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGludmVyc2VUcmFuc2Zvcm0ocmVjdCwgdHJhbnNmb3JtLCB0cmFuc2Zvcm1PcmlnaW4pIHtcbiAgY29uc3QgcGFyc2VkVHJhbnNmb3JtID0gcGFyc2VUcmFuc2Zvcm0odHJhbnNmb3JtKTtcblxuICBpZiAoIXBhcnNlZFRyYW5zZm9ybSkge1xuICAgIHJldHVybiByZWN0O1xuICB9XG5cbiAgY29uc3Qge1xuICAgIHNjYWxlWCxcbiAgICBzY2FsZVksXG4gICAgeDogdHJhbnNsYXRlWCxcbiAgICB5OiB0cmFuc2xhdGVZXG4gIH0gPSBwYXJzZWRUcmFuc2Zvcm07XG4gIGNvbnN0IHggPSByZWN0LmxlZnQgLSB0cmFuc2xhdGVYIC0gKDEgLSBzY2FsZVgpICogcGFyc2VGbG9hdCh0cmFuc2Zvcm1PcmlnaW4pO1xuICBjb25zdCB5ID0gcmVjdC50b3AgLSB0cmFuc2xhdGVZIC0gKDEgLSBzY2FsZVkpICogcGFyc2VGbG9hdCh0cmFuc2Zvcm1PcmlnaW4uc2xpY2UodHJhbnNmb3JtT3JpZ2luLmluZGV4T2YoJyAnKSArIDEpKTtcbiAgY29uc3QgdyA9IHNjYWxlWCA/IHJlY3Qud2lkdGggLyBzY2FsZVggOiByZWN0LndpZHRoO1xuICBjb25zdCBoID0gc2NhbGVZID8gcmVjdC5oZWlnaHQgLyBzY2FsZVkgOiByZWN0LmhlaWdodDtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogdyxcbiAgICBoZWlnaHQ6IGgsXG4gICAgdG9wOiB5LFxuICAgIHJpZ2h0OiB4ICsgdyxcbiAgICBib3R0b206IHkgKyBoLFxuICAgIGxlZnQ6IHhcbiAgfTtcbn1cblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIGlnbm9yZVRyYW5zZm9ybTogZmFsc2Vcbn07XG4vKipcclxuICogUmV0dXJucyB0aGUgYm91bmRpbmcgY2xpZW50IHJlY3Qgb2YgYW4gZWxlbWVudCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQuXHJcbiAqL1xuXG5mdW5jdGlvbiBnZXRDbGllbnRSZWN0KGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSBkZWZhdWx0T3B0aW9ucztcbiAgfVxuXG4gIGxldCByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICBpZiAob3B0aW9ucy5pZ25vcmVUcmFuc2Zvcm0pIHtcbiAgICBjb25zdCB7XG4gICAgICB0cmFuc2Zvcm0sXG4gICAgICB0cmFuc2Zvcm1PcmlnaW5cbiAgICB9ID0gZ2V0V2luZG93KGVsZW1lbnQpLmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG5cbiAgICBpZiAodHJhbnNmb3JtKSB7XG4gICAgICByZWN0ID0gaW52ZXJzZVRyYW5zZm9ybShyZWN0LCB0cmFuc2Zvcm0sIHRyYW5zZm9ybU9yaWdpbik7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBib3R0b20sXG4gICAgcmlnaHRcbiAgfSA9IHJlY3Q7XG4gIHJldHVybiB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGJvdHRvbSxcbiAgICByaWdodFxuICB9O1xufVxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGNsaWVudCByZWN0IG9mIGFuIGVsZW1lbnQgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBUaGUgQ2xpZW50UmVjdCByZXR1cm5lZCBieSB0aGlzIG1ldGhvZCBkb2VzIG5vdCB0YWtlIGludG8gYWNjb3VudCB0cmFuc2Zvcm1zXHJcbiAqIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgaXQgbWVhc3VyZXMuXHJcbiAqXHJcbiAqL1xuXG5mdW5jdGlvbiBnZXRUcmFuc2Zvcm1BZ25vc3RpY0NsaWVudFJlY3QoZWxlbWVudCkge1xuICByZXR1cm4gZ2V0Q2xpZW50UmVjdChlbGVtZW50LCB7XG4gICAgaWdub3JlVHJhbnNmb3JtOiB0cnVlXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRXaW5kb3dDbGllbnRSZWN0KGVsZW1lbnQpIHtcbiAgY29uc3Qgd2lkdGggPSBlbGVtZW50LmlubmVyV2lkdGg7XG4gIGNvbnN0IGhlaWdodCA9IGVsZW1lbnQuaW5uZXJIZWlnaHQ7XG4gIHJldHVybiB7XG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcmlnaHQ6IHdpZHRoLFxuICAgIGJvdHRvbTogaGVpZ2h0LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodFxuICB9O1xufVxuXG5mdW5jdGlvbiBpc0ZpeGVkKG5vZGUsIGNvbXB1dGVkU3R5bGUpIHtcbiAgaWYgKGNvbXB1dGVkU3R5bGUgPT09IHZvaWQgMCkge1xuICAgIGNvbXB1dGVkU3R5bGUgPSBnZXRXaW5kb3cobm9kZSkuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgfVxuXG4gIHJldHVybiBjb21wdXRlZFN0eWxlLnBvc2l0aW9uID09PSAnZml4ZWQnO1xufVxuXG5mdW5jdGlvbiBpc1Njcm9sbGFibGUoZWxlbWVudCwgY29tcHV0ZWRTdHlsZSkge1xuICBpZiAoY29tcHV0ZWRTdHlsZSA9PT0gdm9pZCAwKSB7XG4gICAgY29tcHV0ZWRTdHlsZSA9IGdldFdpbmRvdyhlbGVtZW50KS5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuICB9XG5cbiAgY29uc3Qgb3ZlcmZsb3dSZWdleCA9IC8oYXV0b3xzY3JvbGx8b3ZlcmxheSkvO1xuICBjb25zdCBwcm9wZXJ0aWVzID0gWydvdmVyZmxvdycsICdvdmVyZmxvd1gnLCAnb3ZlcmZsb3dZJ107XG4gIHJldHVybiBwcm9wZXJ0aWVzLnNvbWUocHJvcGVydHkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gY29tcHV0ZWRTdHlsZVtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBvdmVyZmxvd1JlZ2V4LnRlc3QodmFsdWUpIDogZmFsc2U7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzKGVsZW1lbnQsIGxpbWl0KSB7XG4gIGNvbnN0IHNjcm9sbFBhcmVudHMgPSBbXTtcblxuICBmdW5jdGlvbiBmaW5kU2Nyb2xsYWJsZUFuY2VzdG9ycyhub2RlKSB7XG4gICAgaWYgKGxpbWl0ICE9IG51bGwgJiYgc2Nyb2xsUGFyZW50cy5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICAgIH1cblxuICAgIGlmICghbm9kZSkge1xuICAgICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gICAgfVxuXG4gICAgaWYgKGlzRG9jdW1lbnQobm9kZSkgJiYgbm9kZS5zY3JvbGxpbmdFbGVtZW50ICE9IG51bGwgJiYgIXNjcm9sbFBhcmVudHMuaW5jbHVkZXMobm9kZS5zY3JvbGxpbmdFbGVtZW50KSkge1xuICAgICAgc2Nyb2xsUGFyZW50cy5wdXNoKG5vZGUuc2Nyb2xsaW5nRWxlbWVudCk7XG4gICAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgICB9XG5cbiAgICBpZiAoIWlzSFRNTEVsZW1lbnQobm9kZSkgfHwgaXNTVkdFbGVtZW50KG5vZGUpKSB7XG4gICAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgICB9XG5cbiAgICBpZiAoc2Nyb2xsUGFyZW50cy5pbmNsdWRlcyhub2RlKSkge1xuICAgICAgcmV0dXJuIHNjcm9sbFBhcmVudHM7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcHV0ZWRTdHlsZSA9IGdldFdpbmRvdyhlbGVtZW50KS5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuXG4gICAgaWYgKG5vZGUgIT09IGVsZW1lbnQpIHtcbiAgICAgIGlmIChpc1Njcm9sbGFibGUobm9kZSwgY29tcHV0ZWRTdHlsZSkpIHtcbiAgICAgICAgc2Nyb2xsUGFyZW50cy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0ZpeGVkKG5vZGUsIGNvbXB1dGVkU3R5bGUpKSB7XG4gICAgICByZXR1cm4gc2Nyb2xsUGFyZW50cztcbiAgICB9XG5cbiAgICByZXR1cm4gZmluZFNjcm9sbGFibGVBbmNlc3RvcnMobm9kZS5wYXJlbnROb2RlKTtcbiAgfVxuXG4gIGlmICghZWxlbWVudCkge1xuICAgIHJldHVybiBzY3JvbGxQYXJlbnRzO1xuICB9XG5cbiAgcmV0dXJuIGZpbmRTY3JvbGxhYmxlQW5jZXN0b3JzKGVsZW1lbnQpO1xufVxuZnVuY3Rpb24gZ2V0Rmlyc3RTY3JvbGxhYmxlQW5jZXN0b3Iobm9kZSkge1xuICBjb25zdCBbZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3JdID0gZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycyhub2RlLCAxKTtcbiAgcmV0dXJuIGZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yICE9IG51bGwgPyBmaXJzdFNjcm9sbGFibGVBbmNlc3RvciA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbGFibGVFbGVtZW50KGVsZW1lbnQpIHtcbiAgaWYgKCFjYW5Vc2VET00gfHwgIWVsZW1lbnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChpc1dpbmRvdyhlbGVtZW50KSkge1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgaWYgKCFpc05vZGUoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChpc0RvY3VtZW50KGVsZW1lbnQpIHx8IGVsZW1lbnQgPT09IGdldE93bmVyRG9jdW1lbnQoZWxlbWVudCkuc2Nyb2xsaW5nRWxlbWVudCkge1xuICAgIHJldHVybiB3aW5kb3c7XG4gIH1cblxuICBpZiAoaXNIVE1MRWxlbWVudChlbGVtZW50KSkge1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFNjcm9sbFhDb29yZGluYXRlKGVsZW1lbnQpIHtcbiAgaWYgKGlzV2luZG93KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuc2Nyb2xsWDtcbiAgfVxuXG4gIHJldHVybiBlbGVtZW50LnNjcm9sbExlZnQ7XG59XG5mdW5jdGlvbiBnZXRTY3JvbGxZQ29vcmRpbmF0ZShlbGVtZW50KSB7XG4gIGlmIChpc1dpbmRvdyhlbGVtZW50KSkge1xuICAgIHJldHVybiBlbGVtZW50LnNjcm9sbFk7XG4gIH1cblxuICByZXR1cm4gZWxlbWVudC5zY3JvbGxUb3A7XG59XG5mdW5jdGlvbiBnZXRTY3JvbGxDb29yZGluYXRlcyhlbGVtZW50KSB7XG4gIHJldHVybiB7XG4gICAgeDogZ2V0U2Nyb2xsWENvb3JkaW5hdGUoZWxlbWVudCksXG4gICAgeTogZ2V0U2Nyb2xsWUNvb3JkaW5hdGUoZWxlbWVudClcbiAgfTtcbn1cblxudmFyIERpcmVjdGlvbjtcblxuKGZ1bmN0aW9uIChEaXJlY3Rpb24pIHtcbiAgRGlyZWN0aW9uW0RpcmVjdGlvbltcIkZvcndhcmRcIl0gPSAxXSA9IFwiRm9yd2FyZFwiO1xuICBEaXJlY3Rpb25bRGlyZWN0aW9uW1wiQmFja3dhcmRcIl0gPSAtMV0gPSBcIkJhY2t3YXJkXCI7XG59KShEaXJlY3Rpb24gfHwgKERpcmVjdGlvbiA9IHt9KSk7XG5cbmZ1bmN0aW9uIGlzRG9jdW1lbnRTY3JvbGxpbmdFbGVtZW50KGVsZW1lbnQpIHtcbiAgaWYgKCFjYW5Vc2VET00gfHwgIWVsZW1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gZWxlbWVudCA9PT0gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudDtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zaXRpb24oc2Nyb2xsaW5nQ29udGFpbmVyKSB7XG4gIGNvbnN0IG1pblNjcm9sbCA9IHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbiAgY29uc3QgZGltZW5zaW9ucyA9IGlzRG9jdW1lbnRTY3JvbGxpbmdFbGVtZW50KHNjcm9sbGluZ0NvbnRhaW5lcikgPyB7XG4gICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQsXG4gICAgd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoXG4gIH0gOiB7XG4gICAgaGVpZ2h0OiBzY3JvbGxpbmdDb250YWluZXIuY2xpZW50SGVpZ2h0LFxuICAgIHdpZHRoOiBzY3JvbGxpbmdDb250YWluZXIuY2xpZW50V2lkdGhcbiAgfTtcbiAgY29uc3QgbWF4U2Nyb2xsID0ge1xuICAgIHg6IHNjcm9sbGluZ0NvbnRhaW5lci5zY3JvbGxXaWR0aCAtIGRpbWVuc2lvbnMud2lkdGgsXG4gICAgeTogc2Nyb2xsaW5nQ29udGFpbmVyLnNjcm9sbEhlaWdodCAtIGRpbWVuc2lvbnMuaGVpZ2h0XG4gIH07XG4gIGNvbnN0IGlzVG9wID0gc2Nyb2xsaW5nQ29udGFpbmVyLnNjcm9sbFRvcCA8PSBtaW5TY3JvbGwueTtcbiAgY29uc3QgaXNMZWZ0ID0gc2Nyb2xsaW5nQ29udGFpbmVyLnNjcm9sbExlZnQgPD0gbWluU2Nyb2xsLng7XG4gIGNvbnN0IGlzQm90dG9tID0gc2Nyb2xsaW5nQ29udGFpbmVyLnNjcm9sbFRvcCA+PSBtYXhTY3JvbGwueTtcbiAgY29uc3QgaXNSaWdodCA9IHNjcm9sbGluZ0NvbnRhaW5lci5zY3JvbGxMZWZ0ID49IG1heFNjcm9sbC54O1xuICByZXR1cm4ge1xuICAgIGlzVG9wLFxuICAgIGlzTGVmdCxcbiAgICBpc0JvdHRvbSxcbiAgICBpc1JpZ2h0LFxuICAgIG1heFNjcm9sbCxcbiAgICBtaW5TY3JvbGxcbiAgfTtcbn1cblxuY29uc3QgZGVmYXVsdFRocmVzaG9sZCA9IHtcbiAgeDogMC4yLFxuICB5OiAwLjJcbn07XG5mdW5jdGlvbiBnZXRTY3JvbGxEaXJlY3Rpb25BbmRTcGVlZChzY3JvbGxDb250YWluZXIsIHNjcm9sbENvbnRhaW5lclJlY3QsIF9yZWYsIGFjY2VsZXJhdGlvbiwgdGhyZXNob2xkUGVyY2VudGFnZSkge1xuICBsZXQge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIHJpZ2h0LFxuICAgIGJvdHRvbVxuICB9ID0gX3JlZjtcblxuICBpZiAoYWNjZWxlcmF0aW9uID09PSB2b2lkIDApIHtcbiAgICBhY2NlbGVyYXRpb24gPSAxMDtcbiAgfVxuXG4gIGlmICh0aHJlc2hvbGRQZXJjZW50YWdlID09PSB2b2lkIDApIHtcbiAgICB0aHJlc2hvbGRQZXJjZW50YWdlID0gZGVmYXVsdFRocmVzaG9sZDtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICBpc1RvcCxcbiAgICBpc0JvdHRvbSxcbiAgICBpc0xlZnQsXG4gICAgaXNSaWdodFxuICB9ID0gZ2V0U2Nyb2xsUG9zaXRpb24oc2Nyb2xsQ29udGFpbmVyKTtcbiAgY29uc3QgZGlyZWN0aW9uID0ge1xuICAgIHg6IDAsXG4gICAgeTogMFxuICB9O1xuICBjb25zdCBzcGVlZCA9IHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbiAgY29uc3QgdGhyZXNob2xkID0ge1xuICAgIGhlaWdodDogc2Nyb2xsQ29udGFpbmVyUmVjdC5oZWlnaHQgKiB0aHJlc2hvbGRQZXJjZW50YWdlLnksXG4gICAgd2lkdGg6IHNjcm9sbENvbnRhaW5lclJlY3Qud2lkdGggKiB0aHJlc2hvbGRQZXJjZW50YWdlLnhcbiAgfTtcblxuICBpZiAoIWlzVG9wICYmIHRvcCA8PSBzY3JvbGxDb250YWluZXJSZWN0LnRvcCArIHRocmVzaG9sZC5oZWlnaHQpIHtcbiAgICAvLyBTY3JvbGwgVXBcbiAgICBkaXJlY3Rpb24ueSA9IERpcmVjdGlvbi5CYWNrd2FyZDtcbiAgICBzcGVlZC55ID0gYWNjZWxlcmF0aW9uICogTWF0aC5hYnMoKHNjcm9sbENvbnRhaW5lclJlY3QudG9wICsgdGhyZXNob2xkLmhlaWdodCAtIHRvcCkgLyB0aHJlc2hvbGQuaGVpZ2h0KTtcbiAgfSBlbHNlIGlmICghaXNCb3R0b20gJiYgYm90dG9tID49IHNjcm9sbENvbnRhaW5lclJlY3QuYm90dG9tIC0gdGhyZXNob2xkLmhlaWdodCkge1xuICAgIC8vIFNjcm9sbCBEb3duXG4gICAgZGlyZWN0aW9uLnkgPSBEaXJlY3Rpb24uRm9yd2FyZDtcbiAgICBzcGVlZC55ID0gYWNjZWxlcmF0aW9uICogTWF0aC5hYnMoKHNjcm9sbENvbnRhaW5lclJlY3QuYm90dG9tIC0gdGhyZXNob2xkLmhlaWdodCAtIGJvdHRvbSkgLyB0aHJlc2hvbGQuaGVpZ2h0KTtcbiAgfVxuXG4gIGlmICghaXNSaWdodCAmJiByaWdodCA+PSBzY3JvbGxDb250YWluZXJSZWN0LnJpZ2h0IC0gdGhyZXNob2xkLndpZHRoKSB7XG4gICAgLy8gU2Nyb2xsIFJpZ2h0XG4gICAgZGlyZWN0aW9uLnggPSBEaXJlY3Rpb24uRm9yd2FyZDtcbiAgICBzcGVlZC54ID0gYWNjZWxlcmF0aW9uICogTWF0aC5hYnMoKHNjcm9sbENvbnRhaW5lclJlY3QucmlnaHQgLSB0aHJlc2hvbGQud2lkdGggLSByaWdodCkgLyB0aHJlc2hvbGQud2lkdGgpO1xuICB9IGVsc2UgaWYgKCFpc0xlZnQgJiYgbGVmdCA8PSBzY3JvbGxDb250YWluZXJSZWN0LmxlZnQgKyB0aHJlc2hvbGQud2lkdGgpIHtcbiAgICAvLyBTY3JvbGwgTGVmdFxuICAgIGRpcmVjdGlvbi54ID0gRGlyZWN0aW9uLkJhY2t3YXJkO1xuICAgIHNwZWVkLnggPSBhY2NlbGVyYXRpb24gKiBNYXRoLmFicygoc2Nyb2xsQ29udGFpbmVyUmVjdC5sZWZ0ICsgdGhyZXNob2xkLndpZHRoIC0gbGVmdCkgLyB0aHJlc2hvbGQud2lkdGgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkaXJlY3Rpb24sXG4gICAgc3BlZWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsRWxlbWVudFJlY3QoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudCA9PT0gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGlubmVyV2lkdGgsXG4gICAgICBpbm5lckhlaWdodFxuICAgIH0gPSB3aW5kb3c7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICByaWdodDogaW5uZXJXaWR0aCxcbiAgICAgIGJvdHRvbTogaW5uZXJIZWlnaHQsXG4gICAgICB3aWR0aDogaW5uZXJXaWR0aCxcbiAgICAgIGhlaWdodDogaW5uZXJIZWlnaHRcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qge1xuICAgIHRvcCxcbiAgICBsZWZ0LFxuICAgIHJpZ2h0LFxuICAgIGJvdHRvbVxuICB9ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHtcbiAgICB0b3AsXG4gICAgbGVmdCxcbiAgICByaWdodCxcbiAgICBib3R0b20sXG4gICAgd2lkdGg6IGVsZW1lbnQuY2xpZW50V2lkdGgsXG4gICAgaGVpZ2h0OiBlbGVtZW50LmNsaWVudEhlaWdodFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRTY3JvbGxPZmZzZXRzKHNjcm9sbGFibGVBbmNlc3RvcnMpIHtcbiAgcmV0dXJuIHNjcm9sbGFibGVBbmNlc3RvcnMucmVkdWNlKChhY2MsIG5vZGUpID0+IHtcbiAgICByZXR1cm4gYWRkKGFjYywgZ2V0U2Nyb2xsQ29vcmRpbmF0ZXMobm9kZSkpO1xuICB9LCBkZWZhdWx0Q29vcmRpbmF0ZXMpO1xufVxuZnVuY3Rpb24gZ2V0U2Nyb2xsWE9mZnNldChzY3JvbGxhYmxlQW5jZXN0b3JzKSB7XG4gIHJldHVybiBzY3JvbGxhYmxlQW5jZXN0b3JzLnJlZHVjZSgoYWNjLCBub2RlKSA9PiB7XG4gICAgcmV0dXJuIGFjYyArIGdldFNjcm9sbFhDb29yZGluYXRlKG5vZGUpO1xuICB9LCAwKTtcbn1cbmZ1bmN0aW9uIGdldFNjcm9sbFlPZmZzZXQoc2Nyb2xsYWJsZUFuY2VzdG9ycykge1xuICByZXR1cm4gc2Nyb2xsYWJsZUFuY2VzdG9ycy5yZWR1Y2UoKGFjYywgbm9kZSkgPT4ge1xuICAgIHJldHVybiBhY2MgKyBnZXRTY3JvbGxZQ29vcmRpbmF0ZShub2RlKTtcbiAgfSwgMCk7XG59XG5cbmZ1bmN0aW9uIHNjcm9sbEludG9WaWV3SWZOZWVkZWQoZWxlbWVudCwgbWVhc3VyZSkge1xuICBpZiAobWVhc3VyZSA9PT0gdm9pZCAwKSB7XG4gICAgbWVhc3VyZSA9IGdldENsaWVudFJlY3Q7XG4gIH1cblxuICBpZiAoIWVsZW1lbnQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgYm90dG9tLFxuICAgIHJpZ2h0XG4gIH0gPSBtZWFzdXJlKGVsZW1lbnQpO1xuICBjb25zdCBmaXJzdFNjcm9sbGFibGVBbmNlc3RvciA9IGdldEZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yKGVsZW1lbnQpO1xuXG4gIGlmICghZmlyc3RTY3JvbGxhYmxlQW5jZXN0b3IpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoYm90dG9tIDw9IDAgfHwgcmlnaHQgPD0gMCB8fCB0b3AgPj0gd2luZG93LmlubmVySGVpZ2h0IHx8IGxlZnQgPj0gd2luZG93LmlubmVyV2lkdGgpIHtcbiAgICBlbGVtZW50LnNjcm9sbEludG9WaWV3KHtcbiAgICAgIGJsb2NrOiAnY2VudGVyJyxcbiAgICAgIGlubGluZTogJ2NlbnRlcidcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBwcm9wZXJ0aWVzID0gW1sneCcsIFsnbGVmdCcsICdyaWdodCddLCBnZXRTY3JvbGxYT2Zmc2V0XSwgWyd5JywgWyd0b3AnLCAnYm90dG9tJ10sIGdldFNjcm9sbFlPZmZzZXRdXTtcbmNsYXNzIFJlY3Qge1xuICBjb25zdHJ1Y3RvcihyZWN0LCBlbGVtZW50KSB7XG4gICAgdGhpcy5yZWN0ID0gdm9pZCAwO1xuICAgIHRoaXMud2lkdGggPSB2b2lkIDA7XG4gICAgdGhpcy5oZWlnaHQgPSB2b2lkIDA7XG4gICAgdGhpcy50b3AgPSB2b2lkIDA7XG4gICAgdGhpcy5ib3R0b20gPSB2b2lkIDA7XG4gICAgdGhpcy5yaWdodCA9IHZvaWQgMDtcbiAgICB0aGlzLmxlZnQgPSB2b2lkIDA7XG4gICAgY29uc3Qgc2Nyb2xsYWJsZUFuY2VzdG9ycyA9IGdldFNjcm9sbGFibGVBbmNlc3RvcnMoZWxlbWVudCk7XG4gICAgY29uc3Qgc2Nyb2xsT2Zmc2V0cyA9IGdldFNjcm9sbE9mZnNldHMoc2Nyb2xsYWJsZUFuY2VzdG9ycyk7XG4gICAgdGhpcy5yZWN0ID0geyAuLi5yZWN0XG4gICAgfTtcbiAgICB0aGlzLndpZHRoID0gcmVjdC53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IHJlY3QuaGVpZ2h0O1xuXG4gICAgZm9yIChjb25zdCBbYXhpcywga2V5cywgZ2V0U2Nyb2xsT2Zmc2V0XSBvZiBwcm9wZXJ0aWVzKSB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIHtcbiAgICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRPZmZzZXRzID0gZ2V0U2Nyb2xsT2Zmc2V0KHNjcm9sbGFibGVBbmNlc3RvcnMpO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsT2Zmc2V0c0RlbHRsYSA9IHNjcm9sbE9mZnNldHNbYXhpc10gLSBjdXJyZW50T2Zmc2V0cztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlY3Rba2V5XSArIHNjcm9sbE9mZnNldHNEZWx0bGE7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAncmVjdCcsIHtcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgfSk7XG4gIH1cblxufVxuXG5jbGFzcyBMaXN0ZW5lcnMge1xuICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcbiAgICB0aGlzLnRhcmdldCA9IHZvaWQgMDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuXG4gICAgdGhpcy5yZW1vdmVBbGwgPSAoKSA9PiB7XG4gICAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgdmFyIF90aGlzJHRhcmdldDtcblxuICAgICAgICByZXR1cm4gKF90aGlzJHRhcmdldCA9IHRoaXMudGFyZ2V0KSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoLi4ubGlzdGVuZXIpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICB9XG5cbiAgYWRkKGV2ZW50TmFtZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIHZhciBfdGhpcyR0YXJnZXQyO1xuXG4gICAgKF90aGlzJHRhcmdldDIgPSB0aGlzLnRhcmdldCkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJHRhcmdldDIuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2goW2V2ZW50TmFtZSwgaGFuZGxlciwgb3B0aW9uc10pO1xuICB9XG5cbn1cblxuZnVuY3Rpb24gZ2V0RXZlbnRMaXN0ZW5lclRhcmdldCh0YXJnZXQpIHtcbiAgLy8gSWYgdGhlIGBldmVudC50YXJnZXRgIGVsZW1lbnQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBkb2N1bWVudCBldmVudHMgd2lsbCBzdGlsbCBiZSB0YXJnZXRlZFxuICAvLyBhdCBpdCwgYW5kIGhlbmNlIHdvbid0IGFsd2F5cyBidWJibGUgdXAgdG8gdGhlIHdpbmRvdyBvciBkb2N1bWVudCBhbnltb3JlLlxuICAvLyBJZiB0aGVyZSBpcyBhbnkgcmlzayBvZiBhbiBlbGVtZW50IGJlaW5nIHJlbW92ZWQgd2hpbGUgaXQgaXMgYmVpbmcgZHJhZ2dlZCxcbiAgLy8gdGhlIGJlc3QgcHJhY3RpY2UgaXMgdG8gYXR0YWNoIHRoZSBldmVudCBsaXN0ZW5lcnMgZGlyZWN0bHkgdG8gdGhlIHRhcmdldC5cbiAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0XG4gIGNvbnN0IHtcbiAgICBFdmVudFRhcmdldFxuICB9ID0gZ2V0V2luZG93KHRhcmdldCk7XG4gIHJldHVybiB0YXJnZXQgaW5zdGFuY2VvZiBFdmVudFRhcmdldCA/IHRhcmdldCA6IGdldE93bmVyRG9jdW1lbnQodGFyZ2V0KTtcbn1cblxuZnVuY3Rpb24gaGFzRXhjZWVkZWREaXN0YW5jZShkZWx0YSwgbWVhc3VyZW1lbnQpIHtcbiAgY29uc3QgZHggPSBNYXRoLmFicyhkZWx0YS54KTtcbiAgY29uc3QgZHkgPSBNYXRoLmFicyhkZWx0YS55KTtcblxuICBpZiAodHlwZW9mIG1lYXN1cmVtZW50ID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBNYXRoLnNxcnQoZHggKiogMiArIGR5ICoqIDIpID4gbWVhc3VyZW1lbnQ7XG4gIH1cblxuICBpZiAoJ3gnIGluIG1lYXN1cmVtZW50ICYmICd5JyBpbiBtZWFzdXJlbWVudCkge1xuICAgIHJldHVybiBkeCA+IG1lYXN1cmVtZW50LnggJiYgZHkgPiBtZWFzdXJlbWVudC55O1xuICB9XG5cbiAgaWYgKCd4JyBpbiBtZWFzdXJlbWVudCkge1xuICAgIHJldHVybiBkeCA+IG1lYXN1cmVtZW50Lng7XG4gIH1cblxuICBpZiAoJ3knIGluIG1lYXN1cmVtZW50KSB7XG4gICAgcmV0dXJuIGR5ID4gbWVhc3VyZW1lbnQueTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxudmFyIEV2ZW50TmFtZTtcblxuKGZ1bmN0aW9uIChFdmVudE5hbWUpIHtcbiAgRXZlbnROYW1lW1wiQ2xpY2tcIl0gPSBcImNsaWNrXCI7XG4gIEV2ZW50TmFtZVtcIkRyYWdTdGFydFwiXSA9IFwiZHJhZ3N0YXJ0XCI7XG4gIEV2ZW50TmFtZVtcIktleWRvd25cIl0gPSBcImtleWRvd25cIjtcbiAgRXZlbnROYW1lW1wiQ29udGV4dE1lbnVcIl0gPSBcImNvbnRleHRtZW51XCI7XG4gIEV2ZW50TmFtZVtcIlJlc2l6ZVwiXSA9IFwicmVzaXplXCI7XG4gIEV2ZW50TmFtZVtcIlNlbGVjdGlvbkNoYW5nZVwiXSA9IFwic2VsZWN0aW9uY2hhbmdlXCI7XG4gIEV2ZW50TmFtZVtcIlZpc2liaWxpdHlDaGFuZ2VcIl0gPSBcInZpc2liaWxpdHljaGFuZ2VcIjtcbn0pKEV2ZW50TmFtZSB8fCAoRXZlbnROYW1lID0ge30pKTtcblxuZnVuY3Rpb24gcHJldmVudERlZmF1bHQoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn1cbmZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbihldmVudCkge1xuICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbn1cblxudmFyIEtleWJvYXJkQ29kZTtcblxuKGZ1bmN0aW9uIChLZXlib2FyZENvZGUpIHtcbiAgS2V5Ym9hcmRDb2RlW1wiU3BhY2VcIl0gPSBcIlNwYWNlXCI7XG4gIEtleWJvYXJkQ29kZVtcIkRvd25cIl0gPSBcIkFycm93RG93blwiO1xuICBLZXlib2FyZENvZGVbXCJSaWdodFwiXSA9IFwiQXJyb3dSaWdodFwiO1xuICBLZXlib2FyZENvZGVbXCJMZWZ0XCJdID0gXCJBcnJvd0xlZnRcIjtcbiAgS2V5Ym9hcmRDb2RlW1wiVXBcIl0gPSBcIkFycm93VXBcIjtcbiAgS2V5Ym9hcmRDb2RlW1wiRXNjXCJdID0gXCJFc2NhcGVcIjtcbiAgS2V5Ym9hcmRDb2RlW1wiRW50ZXJcIl0gPSBcIkVudGVyXCI7XG4gIEtleWJvYXJkQ29kZVtcIlRhYlwiXSA9IFwiVGFiXCI7XG59KShLZXlib2FyZENvZGUgfHwgKEtleWJvYXJkQ29kZSA9IHt9KSk7XG5cbmNvbnN0IGRlZmF1bHRLZXlib2FyZENvZGVzID0ge1xuICBzdGFydDogW0tleWJvYXJkQ29kZS5TcGFjZSwgS2V5Ym9hcmRDb2RlLkVudGVyXSxcbiAgY2FuY2VsOiBbS2V5Ym9hcmRDb2RlLkVzY10sXG4gIGVuZDogW0tleWJvYXJkQ29kZS5TcGFjZSwgS2V5Ym9hcmRDb2RlLkVudGVyLCBLZXlib2FyZENvZGUuVGFiXVxufTtcbmNvbnN0IGRlZmF1bHRLZXlib2FyZENvb3JkaW5hdGVHZXR0ZXIgPSAoZXZlbnQsIF9yZWYpID0+IHtcbiAgbGV0IHtcbiAgICBjdXJyZW50Q29vcmRpbmF0ZXNcbiAgfSA9IF9yZWY7XG5cbiAgc3dpdGNoIChldmVudC5jb2RlKSB7XG4gICAgY2FzZSBLZXlib2FyZENvZGUuUmlnaHQ6XG4gICAgICByZXR1cm4geyAuLi5jdXJyZW50Q29vcmRpbmF0ZXMsXG4gICAgICAgIHg6IGN1cnJlbnRDb29yZGluYXRlcy54ICsgMjVcbiAgICAgIH07XG5cbiAgICBjYXNlIEtleWJvYXJkQ29kZS5MZWZ0OlxuICAgICAgcmV0dXJuIHsgLi4uY3VycmVudENvb3JkaW5hdGVzLFxuICAgICAgICB4OiBjdXJyZW50Q29vcmRpbmF0ZXMueCAtIDI1XG4gICAgICB9O1xuXG4gICAgY2FzZSBLZXlib2FyZENvZGUuRG93bjpcbiAgICAgIHJldHVybiB7IC4uLmN1cnJlbnRDb29yZGluYXRlcyxcbiAgICAgICAgeTogY3VycmVudENvb3JkaW5hdGVzLnkgKyAyNVxuICAgICAgfTtcblxuICAgIGNhc2UgS2V5Ym9hcmRDb2RlLlVwOlxuICAgICAgcmV0dXJuIHsgLi4uY3VycmVudENvb3JkaW5hdGVzLFxuICAgICAgICB5OiBjdXJyZW50Q29vcmRpbmF0ZXMueSAtIDI1XG4gICAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbmNsYXNzIEtleWJvYXJkU2Vuc29yIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICB0aGlzLnByb3BzID0gdm9pZCAwO1xuICAgIHRoaXMuYXV0b1Njcm9sbEVuYWJsZWQgPSBmYWxzZTtcbiAgICB0aGlzLnJlZmVyZW5jZUNvb3JkaW5hdGVzID0gdm9pZCAwO1xuICAgIHRoaXMubGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcbiAgICBjb25zdCB7XG4gICAgICBldmVudDoge1xuICAgICAgICB0YXJnZXRcbiAgICAgIH1cbiAgICB9ID0gcHJvcHM7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IExpc3RlbmVycyhnZXRPd25lckRvY3VtZW50KHRhcmdldCkpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzID0gbmV3IExpc3RlbmVycyhnZXRXaW5kb3codGFyZ2V0KSk7XG4gICAgdGhpcy5oYW5kbGVLZXlEb3duID0gdGhpcy5oYW5kbGVLZXlEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVDYW5jZWwgPSB0aGlzLmhhbmRsZUNhbmNlbC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYXR0YWNoKCk7XG4gIH1cblxuICBhdHRhY2goKSB7XG4gICAgdGhpcy5oYW5kbGVTdGFydCgpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuUmVzaXplLCB0aGlzLmhhbmRsZUNhbmNlbCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5WaXNpYmlsaXR5Q2hhbmdlLCB0aGlzLmhhbmRsZUNhbmNlbCk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVycy5hZGQoRXZlbnROYW1lLktleWRvd24sIHRoaXMuaGFuZGxlS2V5RG93bikpO1xuICB9XG5cbiAgaGFuZGxlU3RhcnQoKSB7XG4gICAgY29uc3Qge1xuICAgICAgYWN0aXZlTm9kZSxcbiAgICAgIG9uU3RhcnRcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBub2RlID0gYWN0aXZlTm9kZS5ub2RlLmN1cnJlbnQ7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChub2RlKTtcbiAgICB9XG5cbiAgICBvblN0YXJ0KGRlZmF1bHRDb29yZGluYXRlcyk7XG4gIH1cblxuICBoYW5kbGVLZXlEb3duKGV2ZW50KSB7XG4gICAgaWYgKGlzS2V5Ym9hcmRFdmVudChldmVudCkpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBvcHRpb25zXG4gICAgICB9ID0gdGhpcy5wcm9wcztcbiAgICAgIGNvbnN0IHtcbiAgICAgICAga2V5Ym9hcmRDb2RlcyA9IGRlZmF1bHRLZXlib2FyZENvZGVzLFxuICAgICAgICBjb29yZGluYXRlR2V0dGVyID0gZGVmYXVsdEtleWJvYXJkQ29vcmRpbmF0ZUdldHRlcixcbiAgICAgICAgc2Nyb2xsQmVoYXZpb3IgPSAnc21vb3RoJ1xuICAgICAgfSA9IG9wdGlvbnM7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNvZGVcbiAgICAgIH0gPSBldmVudDtcblxuICAgICAgaWYgKGtleWJvYXJkQ29kZXMuZW5kLmluY2x1ZGVzKGNvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlRW5kKGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2V5Ym9hcmRDb2Rlcy5jYW5jZWwuaW5jbHVkZXMoY29kZSkpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVDYW5jZWwoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY29sbGlzaW9uUmVjdFxuICAgICAgfSA9IGNvbnRleHQuY3VycmVudDtcbiAgICAgIGNvbnN0IGN1cnJlbnRDb29yZGluYXRlcyA9IGNvbGxpc2lvblJlY3QgPyB7XG4gICAgICAgIHg6IGNvbGxpc2lvblJlY3QubGVmdCxcbiAgICAgICAgeTogY29sbGlzaW9uUmVjdC50b3BcbiAgICAgIH0gOiBkZWZhdWx0Q29vcmRpbmF0ZXM7XG5cbiAgICAgIGlmICghdGhpcy5yZWZlcmVuY2VDb29yZGluYXRlcykge1xuICAgICAgICB0aGlzLnJlZmVyZW5jZUNvb3JkaW5hdGVzID0gY3VycmVudENvb3JkaW5hdGVzO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdDb29yZGluYXRlcyA9IGNvb3JkaW5hdGVHZXR0ZXIoZXZlbnQsIHtcbiAgICAgICAgYWN0aXZlLFxuICAgICAgICBjb250ZXh0OiBjb250ZXh0LmN1cnJlbnQsXG4gICAgICAgIGN1cnJlbnRDb29yZGluYXRlc1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChuZXdDb29yZGluYXRlcykge1xuICAgICAgICBjb25zdCBjb29yZGluYXRlc0RlbHRhID0gc3VidHJhY3QobmV3Q29vcmRpbmF0ZXMsIGN1cnJlbnRDb29yZGluYXRlcyk7XG4gICAgICAgIGNvbnN0IHNjcm9sbERlbHRhID0ge1xuICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgeTogMFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgc2Nyb2xsYWJsZUFuY2VzdG9yc1xuICAgICAgICB9ID0gY29udGV4dC5jdXJyZW50O1xuXG4gICAgICAgIGZvciAoY29uc3Qgc2Nyb2xsQ29udGFpbmVyIG9mIHNjcm9sbGFibGVBbmNlc3RvcnMpIHtcbiAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBldmVudC5jb2RlO1xuICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGlzVG9wLFxuICAgICAgICAgICAgaXNSaWdodCxcbiAgICAgICAgICAgIGlzTGVmdCxcbiAgICAgICAgICAgIGlzQm90dG9tLFxuICAgICAgICAgICAgbWF4U2Nyb2xsLFxuICAgICAgICAgICAgbWluU2Nyb2xsXG4gICAgICAgICAgfSA9IGdldFNjcm9sbFBvc2l0aW9uKHNjcm9sbENvbnRhaW5lcik7XG4gICAgICAgICAgY29uc3Qgc2Nyb2xsRWxlbWVudFJlY3QgPSBnZXRTY3JvbGxFbGVtZW50UmVjdChzY3JvbGxDb250YWluZXIpO1xuICAgICAgICAgIGNvbnN0IGNsYW1wZWRDb29yZGluYXRlcyA9IHtcbiAgICAgICAgICAgIHg6IE1hdGgubWluKGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlJpZ2h0ID8gc2Nyb2xsRWxlbWVudFJlY3QucmlnaHQgLSBzY3JvbGxFbGVtZW50UmVjdC53aWR0aCAvIDIgOiBzY3JvbGxFbGVtZW50UmVjdC5yaWdodCwgTWF0aC5tYXgoZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuUmlnaHQgPyBzY3JvbGxFbGVtZW50UmVjdC5sZWZ0IDogc2Nyb2xsRWxlbWVudFJlY3QubGVmdCArIHNjcm9sbEVsZW1lbnRSZWN0LndpZHRoIC8gMiwgbmV3Q29vcmRpbmF0ZXMueCkpLFxuICAgICAgICAgICAgeTogTWF0aC5taW4oZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuRG93biA/IHNjcm9sbEVsZW1lbnRSZWN0LmJvdHRvbSAtIHNjcm9sbEVsZW1lbnRSZWN0LmhlaWdodCAvIDIgOiBzY3JvbGxFbGVtZW50UmVjdC5ib3R0b20sIE1hdGgubWF4KGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkRvd24gPyBzY3JvbGxFbGVtZW50UmVjdC50b3AgOiBzY3JvbGxFbGVtZW50UmVjdC50b3AgKyBzY3JvbGxFbGVtZW50UmVjdC5oZWlnaHQgLyAyLCBuZXdDb29yZGluYXRlcy55KSlcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IGNhblNjcm9sbFggPSBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5SaWdodCAmJiAhaXNSaWdodCB8fCBkaXJlY3Rpb24gPT09IEtleWJvYXJkQ29kZS5MZWZ0ICYmICFpc0xlZnQ7XG4gICAgICAgICAgY29uc3QgY2FuU2Nyb2xsWSA9IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkRvd24gJiYgIWlzQm90dG9tIHx8IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlVwICYmICFpc1RvcDtcblxuICAgICAgICAgIGlmIChjYW5TY3JvbGxYICYmIGNsYW1wZWRDb29yZGluYXRlcy54ICE9PSBuZXdDb29yZGluYXRlcy54KSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTY3JvbGxDb29yZGluYXRlcyA9IHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0ICsgY29vcmRpbmF0ZXNEZWx0YS54O1xuICAgICAgICAgICAgY29uc3QgY2FuU2Nyb2xsVG9OZXdDb29yZGluYXRlcyA9IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLlJpZ2h0ICYmIG5ld1Njcm9sbENvb3JkaW5hdGVzIDw9IG1heFNjcm9sbC54IHx8IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkxlZnQgJiYgbmV3U2Nyb2xsQ29vcmRpbmF0ZXMgPj0gbWluU2Nyb2xsLng7XG5cbiAgICAgICAgICAgIGlmIChjYW5TY3JvbGxUb05ld0Nvb3JkaW5hdGVzICYmICFjb29yZGluYXRlc0RlbHRhLnkpIHtcbiAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgY29vcmRpbmF0ZXMsIHRoZSBzY3JvbGwgYWRqdXN0bWVudCBhbG9uZSB3aWxsIHRyaWdnZXJcbiAgICAgICAgICAgICAgLy8gbG9naWMgdG8gYXV0by1kZXRlY3QgdGhlIG5ldyBjb250YWluZXIgd2UgYXJlIG92ZXJcbiAgICAgICAgICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvKHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBuZXdTY3JvbGxDb29yZGluYXRlcyxcbiAgICAgICAgICAgICAgICBiZWhhdmlvcjogc2Nyb2xsQmVoYXZpb3JcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhblNjcm9sbFRvTmV3Q29vcmRpbmF0ZXMpIHtcbiAgICAgICAgICAgICAgc2Nyb2xsRGVsdGEueCA9IHNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0IC0gbmV3U2Nyb2xsQ29vcmRpbmF0ZXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzY3JvbGxEZWx0YS54ID0gZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuUmlnaHQgPyBzY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCAtIG1heFNjcm9sbC54IDogc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQgLSBtaW5TY3JvbGwueDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNjcm9sbERlbHRhLngpIHtcbiAgICAgICAgICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbEJ5KHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAtc2Nyb2xsRGVsdGEueCxcbiAgICAgICAgICAgICAgICBiZWhhdmlvcjogc2Nyb2xsQmVoYXZpb3JcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2FuU2Nyb2xsWSAmJiBjbGFtcGVkQ29vcmRpbmF0ZXMueSAhPT0gbmV3Q29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgbmV3U2Nyb2xsQ29vcmRpbmF0ZXMgPSBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wICsgY29vcmRpbmF0ZXNEZWx0YS55O1xuICAgICAgICAgICAgY29uc3QgY2FuU2Nyb2xsVG9OZXdDb29yZGluYXRlcyA9IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkRvd24gJiYgbmV3U2Nyb2xsQ29vcmRpbmF0ZXMgPD0gbWF4U2Nyb2xsLnkgfHwgZGlyZWN0aW9uID09PSBLZXlib2FyZENvZGUuVXAgJiYgbmV3U2Nyb2xsQ29vcmRpbmF0ZXMgPj0gbWluU2Nyb2xsLnk7XG5cbiAgICAgICAgICAgIGlmIChjYW5TY3JvbGxUb05ld0Nvb3JkaW5hdGVzICYmICFjb29yZGluYXRlc0RlbHRhLngpIHtcbiAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgY29vcmRpbmF0ZXMsIHRoZSBzY3JvbGwgYWRqdXN0bWVudCBhbG9uZSB3aWxsIHRyaWdnZXJcbiAgICAgICAgICAgICAgLy8gbG9naWMgdG8gYXV0by1kZXRlY3QgdGhlIG5ldyBjb250YWluZXIgd2UgYXJlIG92ZXJcbiAgICAgICAgICAgICAgc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvKHtcbiAgICAgICAgICAgICAgICB0b3A6IG5ld1Njcm9sbENvb3JkaW5hdGVzLFxuICAgICAgICAgICAgICAgIGJlaGF2aW9yOiBzY3JvbGxCZWhhdmlvclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2FuU2Nyb2xsVG9OZXdDb29yZGluYXRlcykge1xuICAgICAgICAgICAgICBzY3JvbGxEZWx0YS55ID0gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCAtIG5ld1Njcm9sbENvb3JkaW5hdGVzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2Nyb2xsRGVsdGEueSA9IGRpcmVjdGlvbiA9PT0gS2V5Ym9hcmRDb2RlLkRvd24gPyBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wIC0gbWF4U2Nyb2xsLnkgOiBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wIC0gbWluU2Nyb2xsLnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzY3JvbGxEZWx0YS55KSB7XG4gICAgICAgICAgICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxCeSh7XG4gICAgICAgICAgICAgICAgdG9wOiAtc2Nyb2xsRGVsdGEueSxcbiAgICAgICAgICAgICAgICBiZWhhdmlvcjogc2Nyb2xsQmVoYXZpb3JcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGFuZGxlTW92ZShldmVudCwgYWRkKHN1YnRyYWN0KG5ld0Nvb3JkaW5hdGVzLCB0aGlzLnJlZmVyZW5jZUNvb3JkaW5hdGVzKSwgc2Nyb2xsRGVsdGEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVNb3ZlKGV2ZW50LCBjb29yZGluYXRlcykge1xuICAgIGNvbnN0IHtcbiAgICAgIG9uTW92ZVxuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgb25Nb3ZlKGNvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIGhhbmRsZUVuZChldmVudCkge1xuICAgIGNvbnN0IHtcbiAgICAgIG9uRW5kXG4gICAgfSA9IHRoaXMucHJvcHM7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIG9uRW5kKCk7XG4gIH1cblxuICBoYW5kbGVDYW5jZWwoZXZlbnQpIHtcbiAgICBjb25zdCB7XG4gICAgICBvbkNhbmNlbFxuICAgIH0gPSB0aGlzLnByb3BzO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5kZXRhY2goKTtcbiAgICBvbkNhbmNlbCgpO1xuICB9XG5cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMubGlzdGVuZXJzLnJlbW92ZUFsbCgpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLnJlbW92ZUFsbCgpO1xuICB9XG5cbn1cbktleWJvYXJkU2Vuc29yLmFjdGl2YXRvcnMgPSBbe1xuICBldmVudE5hbWU6ICdvbktleURvd24nLFxuICBoYW5kbGVyOiAoZXZlbnQsIF9yZWYsIF9yZWYyKSA9PiB7XG4gICAgbGV0IHtcbiAgICAgIGtleWJvYXJkQ29kZXMgPSBkZWZhdWx0S2V5Ym9hcmRDb2RlcyxcbiAgICAgIG9uQWN0aXZhdGlvblxuICAgIH0gPSBfcmVmO1xuICAgIGxldCB7XG4gICAgICBhY3RpdmVcbiAgICB9ID0gX3JlZjI7XG4gICAgY29uc3Qge1xuICAgICAgY29kZVxuICAgIH0gPSBldmVudC5uYXRpdmVFdmVudDtcblxuICAgIGlmIChrZXlib2FyZENvZGVzLnN0YXJ0LmluY2x1ZGVzKGNvZGUpKSB7XG4gICAgICBjb25zdCBhY3RpdmF0b3IgPSBhY3RpdmUuYWN0aXZhdG9yTm9kZS5jdXJyZW50O1xuXG4gICAgICBpZiAoYWN0aXZhdG9yICYmIGV2ZW50LnRhcmdldCAhPT0gYWN0aXZhdG9yKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG9uQWN0aXZhdGlvbiA9PSBudWxsID8gdm9pZCAwIDogb25BY3RpdmF0aW9uKHtcbiAgICAgICAgZXZlbnQ6IGV2ZW50Lm5hdGl2ZUV2ZW50XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufV07XG5cbmZ1bmN0aW9uIGlzRGlzdGFuY2VDb25zdHJhaW50KGNvbnN0cmFpbnQpIHtcbiAgcmV0dXJuIEJvb2xlYW4oY29uc3RyYWludCAmJiAnZGlzdGFuY2UnIGluIGNvbnN0cmFpbnQpO1xufVxuXG5mdW5jdGlvbiBpc0RlbGF5Q29uc3RyYWludChjb25zdHJhaW50KSB7XG4gIHJldHVybiBCb29sZWFuKGNvbnN0cmFpbnQgJiYgJ2RlbGF5JyBpbiBjb25zdHJhaW50KTtcbn1cblxuY2xhc3MgQWJzdHJhY3RQb2ludGVyU2Vuc29yIHtcbiAgY29uc3RydWN0b3IocHJvcHMsIGV2ZW50cywgbGlzdGVuZXJUYXJnZXQpIHtcbiAgICB2YXIgX2dldEV2ZW50Q29vcmRpbmF0ZXM7XG5cbiAgICBpZiAobGlzdGVuZXJUYXJnZXQgPT09IHZvaWQgMCkge1xuICAgICAgbGlzdGVuZXJUYXJnZXQgPSBnZXRFdmVudExpc3RlbmVyVGFyZ2V0KHByb3BzLmV2ZW50LnRhcmdldCk7XG4gICAgfVxuXG4gICAgdGhpcy5wcm9wcyA9IHZvaWQgMDtcbiAgICB0aGlzLmV2ZW50cyA9IHZvaWQgMDtcbiAgICB0aGlzLmF1dG9TY3JvbGxFbmFibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmRvY3VtZW50ID0gdm9pZCAwO1xuICAgIHRoaXMuYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5pbml0aWFsQ29vcmRpbmF0ZXMgPSB2b2lkIDA7XG4gICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICAgIHRoaXMubGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIHRoaXMuZG9jdW1lbnRMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgIHRoaXMuZXZlbnRzID0gZXZlbnRzO1xuICAgIGNvbnN0IHtcbiAgICAgIGV2ZW50XG4gICAgfSA9IHByb3BzO1xuICAgIGNvbnN0IHtcbiAgICAgIHRhcmdldFxuICAgIH0gPSBldmVudDtcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgdGhpcy5ldmVudHMgPSBldmVudHM7XG4gICAgdGhpcy5kb2N1bWVudCA9IGdldE93bmVyRG9jdW1lbnQodGFyZ2V0KTtcbiAgICB0aGlzLmRvY3VtZW50TGlzdGVuZXJzID0gbmV3IExpc3RlbmVycyh0aGlzLmRvY3VtZW50KTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBMaXN0ZW5lcnMobGlzdGVuZXJUYXJnZXQpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzID0gbmV3IExpc3RlbmVycyhnZXRXaW5kb3codGFyZ2V0KSk7XG4gICAgdGhpcy5pbml0aWFsQ29vcmRpbmF0ZXMgPSAoX2dldEV2ZW50Q29vcmRpbmF0ZXMgPSBnZXRFdmVudENvb3JkaW5hdGVzKGV2ZW50KSkgIT0gbnVsbCA/IF9nZXRFdmVudENvb3JkaW5hdGVzIDogZGVmYXVsdENvb3JkaW5hdGVzO1xuICAgIHRoaXMuaGFuZGxlU3RhcnQgPSB0aGlzLmhhbmRsZVN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVNb3ZlID0gdGhpcy5oYW5kbGVNb3ZlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVFbmQgPSB0aGlzLmhhbmRsZUVuZC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGFuZGxlQ2FuY2VsID0gdGhpcy5oYW5kbGVDYW5jZWwuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZUtleWRvd24gPSB0aGlzLmhhbmRsZUtleWRvd24uYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbW92ZVRleHRTZWxlY3Rpb24gPSB0aGlzLnJlbW92ZVRleHRTZWxlY3Rpb24uYmluZCh0aGlzKTtcbiAgICB0aGlzLmF0dGFjaCgpO1xuICB9XG5cbiAgYXR0YWNoKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGV2ZW50cyxcbiAgICAgIHByb3BzOiB7XG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBhY3RpdmF0aW9uQ29uc3RyYWludCxcbiAgICAgICAgICBieXBhc3NBY3RpdmF0aW9uQ29uc3RyYWludFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSA9IHRoaXM7XG4gICAgdGhpcy5saXN0ZW5lcnMuYWRkKGV2ZW50cy5tb3ZlLm5hbWUsIHRoaXMuaGFuZGxlTW92ZSwge1xuICAgICAgcGFzc2l2ZTogZmFsc2VcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RlbmVycy5hZGQoZXZlbnRzLmVuZC5uYW1lLCB0aGlzLmhhbmRsZUVuZCk7XG5cbiAgICBpZiAoZXZlbnRzLmNhbmNlbCkge1xuICAgICAgdGhpcy5saXN0ZW5lcnMuYWRkKGV2ZW50cy5jYW5jZWwubmFtZSwgdGhpcy5oYW5kbGVDYW5jZWwpO1xuICAgIH1cblxuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuUmVzaXplLCB0aGlzLmhhbmRsZUNhbmNlbCk7XG4gICAgdGhpcy53aW5kb3dMaXN0ZW5lcnMuYWRkKEV2ZW50TmFtZS5EcmFnU3RhcnQsIHByZXZlbnREZWZhdWx0KTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5hZGQoRXZlbnROYW1lLlZpc2liaWxpdHlDaGFuZ2UsIHRoaXMuaGFuZGxlQ2FuY2VsKTtcbiAgICB0aGlzLndpbmRvd0xpc3RlbmVycy5hZGQoRXZlbnROYW1lLkNvbnRleHRNZW51LCBwcmV2ZW50RGVmYXVsdCk7XG4gICAgdGhpcy5kb2N1bWVudExpc3RlbmVycy5hZGQoRXZlbnROYW1lLktleWRvd24sIHRoaXMuaGFuZGxlS2V5ZG93bik7XG5cbiAgICBpZiAoYWN0aXZhdGlvbkNvbnN0cmFpbnQpIHtcbiAgICAgIGlmIChieXBhc3NBY3RpdmF0aW9uQ29uc3RyYWludCAhPSBudWxsICYmIGJ5cGFzc0FjdGl2YXRpb25Db25zdHJhaW50KHtcbiAgICAgICAgZXZlbnQ6IHRoaXMucHJvcHMuZXZlbnQsXG4gICAgICAgIGFjdGl2ZU5vZGU6IHRoaXMucHJvcHMuYWN0aXZlTm9kZSxcbiAgICAgICAgb3B0aW9uczogdGhpcy5wcm9wcy5vcHRpb25zXG4gICAgICB9KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVTdGFydCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNEZWxheUNvbnN0cmFpbnQoYWN0aXZhdGlvbkNvbnN0cmFpbnQpKSB7XG4gICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dCh0aGlzLmhhbmRsZVN0YXJ0LCBhY3RpdmF0aW9uQ29uc3RyYWludC5kZWxheSk7XG4gICAgICAgIHRoaXMuaGFuZGxlUGVuZGluZyhhY3RpdmF0aW9uQ29uc3RyYWludCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRGlzdGFuY2VDb25zdHJhaW50KGFjdGl2YXRpb25Db25zdHJhaW50KSkge1xuICAgICAgICB0aGlzLmhhbmRsZVBlbmRpbmcoYWN0aXZhdGlvbkNvbnN0cmFpbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVTdGFydCgpO1xuICB9XG5cbiAgZGV0YWNoKCkge1xuICAgIHRoaXMubGlzdGVuZXJzLnJlbW92ZUFsbCgpO1xuICAgIHRoaXMud2luZG93TGlzdGVuZXJzLnJlbW92ZUFsbCgpOyAvLyBXYWl0IHVudGlsIHRoZSBuZXh0IGV2ZW50IGxvb3AgYmVmb3JlIHJlbW92aW5nIGRvY3VtZW50IGxpc3RlbmVyc1xuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugd2UgbGlzdGVuIGZvciBgY2xpY2tgIGFuZCBgc2VsZWN0aW9uYCBldmVudHMgb24gdGhlIGRvY3VtZW50XG5cbiAgICBzZXRUaW1lb3V0KHRoaXMuZG9jdW1lbnRMaXN0ZW5lcnMucmVtb3ZlQWxsLCA1MCk7XG5cbiAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XG4gICAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlUGVuZGluZyhjb25zdHJhaW50LCBvZmZzZXQpIHtcbiAgICBjb25zdCB7XG4gICAgICBhY3RpdmUsXG4gICAgICBvblBlbmRpbmdcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICBvblBlbmRpbmcoYWN0aXZlLCBjb25zdHJhaW50LCB0aGlzLmluaXRpYWxDb29yZGluYXRlcywgb2Zmc2V0KTtcbiAgfVxuXG4gIGhhbmRsZVN0YXJ0KCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGluaXRpYWxDb29yZGluYXRlc1xuICAgIH0gPSB0aGlzO1xuICAgIGNvbnN0IHtcbiAgICAgIG9uU3RhcnRcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIGlmIChpbml0aWFsQ29vcmRpbmF0ZXMpIHtcbiAgICAgIHRoaXMuYWN0aXZhdGVkID0gdHJ1ZTsgLy8gU3RvcCBwcm9wYWdhdGlvbiBvZiBjbGljayBldmVudHMgb25jZSBhY3RpdmF0aW9uIGNvbnN0cmFpbnRzIGFyZSBtZXRcblxuICAgICAgdGhpcy5kb2N1bWVudExpc3RlbmVycy5hZGQoRXZlbnROYW1lLkNsaWNrLCBzdG9wUHJvcGFnYXRpb24sIHtcbiAgICAgICAgY2FwdHVyZTogdHJ1ZVxuICAgICAgfSk7IC8vIFJlbW92ZSBhbnkgdGV4dCBzZWxlY3Rpb24gZnJvbSB0aGUgZG9jdW1lbnRcblxuICAgICAgdGhpcy5yZW1vdmVUZXh0U2VsZWN0aW9uKCk7IC8vIFByZXZlbnQgZnVydGhlciB0ZXh0IHNlbGVjdGlvbiB3aGlsZSBkcmFnZ2luZ1xuXG4gICAgICB0aGlzLmRvY3VtZW50TGlzdGVuZXJzLmFkZChFdmVudE5hbWUuU2VsZWN0aW9uQ2hhbmdlLCB0aGlzLnJlbW92ZVRleHRTZWxlY3Rpb24pO1xuICAgICAgb25TdGFydChpbml0aWFsQ29vcmRpbmF0ZXMpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZU1vdmUoZXZlbnQpIHtcbiAgICB2YXIgX2dldEV2ZW50Q29vcmRpbmF0ZXMyO1xuXG4gICAgY29uc3Qge1xuICAgICAgYWN0aXZhdGVkLFxuICAgICAgaW5pdGlhbENvb3JkaW5hdGVzLFxuICAgICAgcHJvcHNcbiAgICB9ID0gdGhpcztcbiAgICBjb25zdCB7XG4gICAgICBvbk1vdmUsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGFjdGl2YXRpb25Db25zdHJhaW50XG4gICAgICB9XG4gICAgfSA9IHByb3BzO1xuXG4gICAgaWYgKCFpbml0aWFsQ29vcmRpbmF0ZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb29yZGluYXRlcyA9IChfZ2V0RXZlbnRDb29yZGluYXRlczIgPSBnZXRFdmVudENvb3JkaW5hdGVzKGV2ZW50KSkgIT0gbnVsbCA/IF9nZXRFdmVudENvb3JkaW5hdGVzMiA6IGRlZmF1bHRDb29yZGluYXRlcztcbiAgICBjb25zdCBkZWx0YSA9IHN1YnRyYWN0KGluaXRpYWxDb29yZGluYXRlcywgY29vcmRpbmF0ZXMpOyAvLyBDb25zdHJhaW50IHZhbGlkYXRpb25cblxuICAgIGlmICghYWN0aXZhdGVkICYmIGFjdGl2YXRpb25Db25zdHJhaW50KSB7XG4gICAgICBpZiAoaXNEaXN0YW5jZUNvbnN0cmFpbnQoYWN0aXZhdGlvbkNvbnN0cmFpbnQpKSB7XG4gICAgICAgIGlmIChhY3RpdmF0aW9uQ29uc3RyYWludC50b2xlcmFuY2UgIT0gbnVsbCAmJiBoYXNFeGNlZWRlZERpc3RhbmNlKGRlbHRhLCBhY3RpdmF0aW9uQ29uc3RyYWludC50b2xlcmFuY2UpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQ2FuY2VsKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzRXhjZWVkZWREaXN0YW5jZShkZWx0YSwgYWN0aXZhdGlvbkNvbnN0cmFpbnQuZGlzdGFuY2UpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlU3RhcnQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNEZWxheUNvbnN0cmFpbnQoYWN0aXZhdGlvbkNvbnN0cmFpbnQpKSB7XG4gICAgICAgIGlmIChoYXNFeGNlZWRlZERpc3RhbmNlKGRlbHRhLCBhY3RpdmF0aW9uQ29uc3RyYWludC50b2xlcmFuY2UpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlQ2FuY2VsKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5oYW5kbGVQZW5kaW5nKGFjdGl2YXRpb25Db25zdHJhaW50LCBkZWx0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50LmNhbmNlbGFibGUpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgb25Nb3ZlKGNvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIGhhbmRsZUVuZCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBvbkFib3J0LFxuICAgICAgb25FbmRcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLmRldGFjaCgpO1xuXG4gICAgaWYgKCF0aGlzLmFjdGl2YXRlZCkge1xuICAgICAgb25BYm9ydCh0aGlzLnByb3BzLmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgb25FbmQoKTtcbiAgfVxuXG4gIGhhbmRsZUNhbmNlbCgpIHtcbiAgICBjb25zdCB7XG4gICAgICBvbkFib3J0LFxuICAgICAgb25DYW5jZWxcbiAgICB9ID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLmRldGFjaCgpO1xuXG4gICAgaWYgKCF0aGlzLmFjdGl2YXRlZCkge1xuICAgICAgb25BYm9ydCh0aGlzLnByb3BzLmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgb25DYW5jZWwoKTtcbiAgfVxuXG4gIGhhbmRsZUtleWRvd24oZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQuY29kZSA9PT0gS2V5Ym9hcmRDb2RlLkVzYykge1xuICAgICAgdGhpcy5oYW5kbGVDYW5jZWwoKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVUZXh0U2VsZWN0aW9uKCkge1xuICAgIHZhciBfdGhpcyRkb2N1bWVudCRnZXRTZWw7XG5cbiAgICAoX3RoaXMkZG9jdW1lbnQkZ2V0U2VsID0gdGhpcy5kb2N1bWVudC5nZXRTZWxlY3Rpb24oKSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGRvY3VtZW50JGdldFNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgfVxuXG59XG5cbmNvbnN0IGV2ZW50cyA9IHtcbiAgY2FuY2VsOiB7XG4gICAgbmFtZTogJ3BvaW50ZXJjYW5jZWwnXG4gIH0sXG4gIG1vdmU6IHtcbiAgICBuYW1lOiAncG9pbnRlcm1vdmUnXG4gIH0sXG4gIGVuZDoge1xuICAgIG5hbWU6ICdwb2ludGVydXAnXG4gIH1cbn07XG5jbGFzcyBQb2ludGVyU2Vuc29yIGV4dGVuZHMgQWJzdHJhY3RQb2ludGVyU2Vuc29yIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBjb25zdCB7XG4gICAgICBldmVudFxuICAgIH0gPSBwcm9wczsgLy8gUG9pbnRlciBldmVudHMgc3RvcCBmaXJpbmcgaWYgdGhlIHRhcmdldCBpcyB1bm1vdW50ZWQgd2hpbGUgZHJhZ2dpbmdcbiAgICAvLyBUaGVyZWZvcmUgd2UgYXR0YWNoIGxpc3RlbmVycyB0byB0aGUgb3duZXIgZG9jdW1lbnQgaW5zdGVhZFxuXG4gICAgY29uc3QgbGlzdGVuZXJUYXJnZXQgPSBnZXRPd25lckRvY3VtZW50KGV2ZW50LnRhcmdldCk7XG4gICAgc3VwZXIocHJvcHMsIGV2ZW50cywgbGlzdGVuZXJUYXJnZXQpO1xuICB9XG5cbn1cblBvaW50ZXJTZW5zb3IuYWN0aXZhdG9ycyA9IFt7XG4gIGV2ZW50TmFtZTogJ29uUG9pbnRlckRvd24nLFxuICBoYW5kbGVyOiAoX3JlZiwgX3JlZjIpID0+IHtcbiAgICBsZXQge1xuICAgICAgbmF0aXZlRXZlbnQ6IGV2ZW50XG4gICAgfSA9IF9yZWY7XG4gICAgbGV0IHtcbiAgICAgIG9uQWN0aXZhdGlvblxuICAgIH0gPSBfcmVmMjtcblxuICAgIGlmICghZXZlbnQuaXNQcmltYXJ5IHx8IGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9uQWN0aXZhdGlvbiA9PSBudWxsID8gdm9pZCAwIDogb25BY3RpdmF0aW9uKHtcbiAgICAgIGV2ZW50XG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1dO1xuXG5jb25zdCBldmVudHMkMSA9IHtcbiAgbW92ZToge1xuICAgIG5hbWU6ICdtb3VzZW1vdmUnXG4gIH0sXG4gIGVuZDoge1xuICAgIG5hbWU6ICdtb3VzZXVwJ1xuICB9XG59O1xudmFyIE1vdXNlQnV0dG9uO1xuXG4oZnVuY3Rpb24gKE1vdXNlQnV0dG9uKSB7XG4gIE1vdXNlQnV0dG9uW01vdXNlQnV0dG9uW1wiUmlnaHRDbGlja1wiXSA9IDJdID0gXCJSaWdodENsaWNrXCI7XG59KShNb3VzZUJ1dHRvbiB8fCAoTW91c2VCdXR0b24gPSB7fSkpO1xuXG5jbGFzcyBNb3VzZVNlbnNvciBleHRlbmRzIEFic3RyYWN0UG9pbnRlclNlbnNvciB7XG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMsIGV2ZW50cyQxLCBnZXRPd25lckRvY3VtZW50KHByb3BzLmV2ZW50LnRhcmdldCkpO1xuICB9XG5cbn1cbk1vdXNlU2Vuc29yLmFjdGl2YXRvcnMgPSBbe1xuICBldmVudE5hbWU6ICdvbk1vdXNlRG93bicsXG4gIGhhbmRsZXI6IChfcmVmLCBfcmVmMikgPT4ge1xuICAgIGxldCB7XG4gICAgICBuYXRpdmVFdmVudDogZXZlbnRcbiAgICB9ID0gX3JlZjtcbiAgICBsZXQge1xuICAgICAgb25BY3RpdmF0aW9uXG4gICAgfSA9IF9yZWYyO1xuXG4gICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gTW91c2VCdXR0b24uUmlnaHRDbGljaykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9uQWN0aXZhdGlvbiA9PSBudWxsID8gdm9pZCAwIDogb25BY3RpdmF0aW9uKHtcbiAgICAgIGV2ZW50XG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1dO1xuXG5jb25zdCBldmVudHMkMiA9IHtcbiAgY2FuY2VsOiB7XG4gICAgbmFtZTogJ3RvdWNoY2FuY2VsJ1xuICB9LFxuICBtb3ZlOiB7XG4gICAgbmFtZTogJ3RvdWNobW92ZSdcbiAgfSxcbiAgZW5kOiB7XG4gICAgbmFtZTogJ3RvdWNoZW5kJ1xuICB9XG59O1xuY2xhc3MgVG91Y2hTZW5zb3IgZXh0ZW5kcyBBYnN0cmFjdFBvaW50ZXJTZW5zb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzLCBldmVudHMkMik7XG4gIH1cblxuICBzdGF0aWMgc2V0dXAoKSB7XG4gICAgLy8gQWRkaW5nIGEgbm9uLWNhcHR1cmUgYW5kIG5vbi1wYXNzaXZlIGB0b3VjaG1vdmVgIGxpc3RlbmVyIGluIG9yZGVyXG4gICAgLy8gdG8gZm9yY2UgYGV2ZW50LnByZXZlbnREZWZhdWx0KClgIGNhbGxzIHRvIHdvcmsgaW4gZHluYW1pY2FsbHkgYWRkZWRcbiAgICAvLyB0b3VjaG1vdmUgZXZlbnQgaGFuZGxlcnMuIFRoaXMgaXMgcmVxdWlyZWQgZm9yIGlPUyBTYWZhcmkuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRzJDIubW92ZS5uYW1lLCBub29wLCB7XG4gICAgICBjYXB0dXJlOiBmYWxzZSxcbiAgICAgIHBhc3NpdmU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRzJDIubW92ZS5uYW1lLCBub29wKTtcbiAgICB9OyAvLyBXZSBjcmVhdGUgYSBuZXcgaGFuZGxlciBiZWNhdXNlIHRoZSB0ZWFyZG93biBmdW5jdGlvbiBvZiBhbm90aGVyIHNlbnNvclxuICAgIC8vIGNvdWxkIHJlbW92ZSBvdXIgZXZlbnQgbGlzdGVuZXIgaWYgd2UgdXNlIGEgcmVmZXJlbnRpYWxseSBlcXVhbCBsaXN0ZW5lci5cblxuICAgIGZ1bmN0aW9uIG5vb3AoKSB7fVxuICB9XG5cbn1cblRvdWNoU2Vuc29yLmFjdGl2YXRvcnMgPSBbe1xuICBldmVudE5hbWU6ICdvblRvdWNoU3RhcnQnLFxuICBoYW5kbGVyOiAoX3JlZiwgX3JlZjIpID0+IHtcbiAgICBsZXQge1xuICAgICAgbmF0aXZlRXZlbnQ6IGV2ZW50XG4gICAgfSA9IF9yZWY7XG4gICAgbGV0IHtcbiAgICAgIG9uQWN0aXZhdGlvblxuICAgIH0gPSBfcmVmMjtcbiAgICBjb25zdCB7XG4gICAgICB0b3VjaGVzXG4gICAgfSA9IGV2ZW50O1xuXG4gICAgaWYgKHRvdWNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIG9uQWN0aXZhdGlvbiA9PSBudWxsID8gdm9pZCAwIDogb25BY3RpdmF0aW9uKHtcbiAgICAgIGV2ZW50XG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1dO1xuXG52YXIgQXV0b1Njcm9sbEFjdGl2YXRvcjtcblxuKGZ1bmN0aW9uIChBdXRvU2Nyb2xsQWN0aXZhdG9yKSB7XG4gIEF1dG9TY3JvbGxBY3RpdmF0b3JbQXV0b1Njcm9sbEFjdGl2YXRvcltcIlBvaW50ZXJcIl0gPSAwXSA9IFwiUG9pbnRlclwiO1xuICBBdXRvU2Nyb2xsQWN0aXZhdG9yW0F1dG9TY3JvbGxBY3RpdmF0b3JbXCJEcmFnZ2FibGVSZWN0XCJdID0gMV0gPSBcIkRyYWdnYWJsZVJlY3RcIjtcbn0pKEF1dG9TY3JvbGxBY3RpdmF0b3IgfHwgKEF1dG9TY3JvbGxBY3RpdmF0b3IgPSB7fSkpO1xuXG52YXIgVHJhdmVyc2FsT3JkZXI7XG5cbihmdW5jdGlvbiAoVHJhdmVyc2FsT3JkZXIpIHtcbiAgVHJhdmVyc2FsT3JkZXJbVHJhdmVyc2FsT3JkZXJbXCJUcmVlT3JkZXJcIl0gPSAwXSA9IFwiVHJlZU9yZGVyXCI7XG4gIFRyYXZlcnNhbE9yZGVyW1RyYXZlcnNhbE9yZGVyW1wiUmV2ZXJzZWRUcmVlT3JkZXJcIl0gPSAxXSA9IFwiUmV2ZXJzZWRUcmVlT3JkZXJcIjtcbn0pKFRyYXZlcnNhbE9yZGVyIHx8IChUcmF2ZXJzYWxPcmRlciA9IHt9KSk7XG5cbmZ1bmN0aW9uIHVzZUF1dG9TY3JvbGxlcihfcmVmKSB7XG4gIGxldCB7XG4gICAgYWNjZWxlcmF0aW9uLFxuICAgIGFjdGl2YXRvciA9IEF1dG9TY3JvbGxBY3RpdmF0b3IuUG9pbnRlcixcbiAgICBjYW5TY3JvbGwsXG4gICAgZHJhZ2dpbmdSZWN0LFxuICAgIGVuYWJsZWQsXG4gICAgaW50ZXJ2YWwgPSA1LFxuICAgIG9yZGVyID0gVHJhdmVyc2FsT3JkZXIuVHJlZU9yZGVyLFxuICAgIHBvaW50ZXJDb29yZGluYXRlcyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLFxuICAgIGRlbHRhLFxuICAgIHRocmVzaG9sZFxuICB9ID0gX3JlZjtcbiAgY29uc3Qgc2Nyb2xsSW50ZW50ID0gdXNlU2Nyb2xsSW50ZW50KHtcbiAgICBkZWx0YSxcbiAgICBkaXNhYmxlZDogIWVuYWJsZWRcbiAgfSk7XG4gIGNvbnN0IFtzZXRBdXRvU2Nyb2xsSW50ZXJ2YWwsIGNsZWFyQXV0b1Njcm9sbEludGVydmFsXSA9IHVzZUludGVydmFsKCk7XG4gIGNvbnN0IHNjcm9sbFNwZWVkID0gdXNlUmVmKHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfSk7XG4gIGNvbnN0IHNjcm9sbERpcmVjdGlvbiA9IHVzZVJlZih7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH0pO1xuICBjb25zdCByZWN0ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgc3dpdGNoIChhY3RpdmF0b3IpIHtcbiAgICAgIGNhc2UgQXV0b1Njcm9sbEFjdGl2YXRvci5Qb2ludGVyOlxuICAgICAgICByZXR1cm4gcG9pbnRlckNvb3JkaW5hdGVzID8ge1xuICAgICAgICAgIHRvcDogcG9pbnRlckNvb3JkaW5hdGVzLnksXG4gICAgICAgICAgYm90dG9tOiBwb2ludGVyQ29vcmRpbmF0ZXMueSxcbiAgICAgICAgICBsZWZ0OiBwb2ludGVyQ29vcmRpbmF0ZXMueCxcbiAgICAgICAgICByaWdodDogcG9pbnRlckNvb3JkaW5hdGVzLnhcbiAgICAgICAgfSA6IG51bGw7XG5cbiAgICAgIGNhc2UgQXV0b1Njcm9sbEFjdGl2YXRvci5EcmFnZ2FibGVSZWN0OlxuICAgICAgICByZXR1cm4gZHJhZ2dpbmdSZWN0O1xuICAgIH1cbiAgfSwgW2FjdGl2YXRvciwgZHJhZ2dpbmdSZWN0LCBwb2ludGVyQ29vcmRpbmF0ZXNdKTtcbiAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyUmVmID0gdXNlUmVmKG51bGwpO1xuICBjb25zdCBhdXRvU2Nyb2xsID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGNvbnN0IHNjcm9sbENvbnRhaW5lciA9IHNjcm9sbENvbnRhaW5lclJlZi5jdXJyZW50O1xuXG4gICAgaWYgKCFzY3JvbGxDb250YWluZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY3JvbGxMZWZ0ID0gc2Nyb2xsU3BlZWQuY3VycmVudC54ICogc2Nyb2xsRGlyZWN0aW9uLmN1cnJlbnQueDtcbiAgICBjb25zdCBzY3JvbGxUb3AgPSBzY3JvbGxTcGVlZC5jdXJyZW50LnkgKiBzY3JvbGxEaXJlY3Rpb24uY3VycmVudC55O1xuICAgIHNjcm9sbENvbnRhaW5lci5zY3JvbGxCeShzY3JvbGxMZWZ0LCBzY3JvbGxUb3ApO1xuICB9LCBbXSk7XG4gIGNvbnN0IHNvcnRlZFNjcm9sbGFibGVBbmNlc3RvcnMgPSB1c2VNZW1vKCgpID0+IG9yZGVyID09PSBUcmF2ZXJzYWxPcmRlci5UcmVlT3JkZXIgPyBbLi4uc2Nyb2xsYWJsZUFuY2VzdG9yc10ucmV2ZXJzZSgpIDogc2Nyb2xsYWJsZUFuY2VzdG9ycywgW29yZGVyLCBzY3JvbGxhYmxlQW5jZXN0b3JzXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbmFibGVkIHx8ICFzY3JvbGxhYmxlQW5jZXN0b3JzLmxlbmd0aCB8fCAhcmVjdCkge1xuICAgICAgY2xlYXJBdXRvU2Nyb2xsSW50ZXJ2YWwoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNjcm9sbENvbnRhaW5lciBvZiBzb3J0ZWRTY3JvbGxhYmxlQW5jZXN0b3JzKSB7XG4gICAgICBpZiAoKGNhblNjcm9sbCA9PSBudWxsID8gdm9pZCAwIDogY2FuU2Nyb2xsKHNjcm9sbENvbnRhaW5lcikpID09PSBmYWxzZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW5kZXggPSBzY3JvbGxhYmxlQW5jZXN0b3JzLmluZGV4T2Yoc2Nyb2xsQ29udGFpbmVyKTtcbiAgICAgIGNvbnN0IHNjcm9sbENvbnRhaW5lclJlY3QgPSBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0c1tpbmRleF07XG5cbiAgICAgIGlmICghc2Nyb2xsQ29udGFpbmVyUmVjdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgIHNwZWVkXG4gICAgICB9ID0gZ2V0U2Nyb2xsRGlyZWN0aW9uQW5kU3BlZWQoc2Nyb2xsQ29udGFpbmVyLCBzY3JvbGxDb250YWluZXJSZWN0LCByZWN0LCBhY2NlbGVyYXRpb24sIHRocmVzaG9sZCk7XG5cbiAgICAgIGZvciAoY29uc3QgYXhpcyBvZiBbJ3gnLCAneSddKSB7XG4gICAgICAgIGlmICghc2Nyb2xsSW50ZW50W2F4aXNdW2RpcmVjdGlvbltheGlzXV0pIHtcbiAgICAgICAgICBzcGVlZFtheGlzXSA9IDA7XG4gICAgICAgICAgZGlyZWN0aW9uW2F4aXNdID0gMDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc3BlZWQueCA+IDAgfHwgc3BlZWQueSA+IDApIHtcbiAgICAgICAgY2xlYXJBdXRvU2Nyb2xsSW50ZXJ2YWwoKTtcbiAgICAgICAgc2Nyb2xsQ29udGFpbmVyUmVmLmN1cnJlbnQgPSBzY3JvbGxDb250YWluZXI7XG4gICAgICAgIHNldEF1dG9TY3JvbGxJbnRlcnZhbChhdXRvU2Nyb2xsLCBpbnRlcnZhbCk7XG4gICAgICAgIHNjcm9sbFNwZWVkLmN1cnJlbnQgPSBzcGVlZDtcbiAgICAgICAgc2Nyb2xsRGlyZWN0aW9uLmN1cnJlbnQgPSBkaXJlY3Rpb247XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzY3JvbGxTcGVlZC5jdXJyZW50ID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDBcbiAgICB9O1xuICAgIHNjcm9sbERpcmVjdGlvbi5jdXJyZW50ID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDBcbiAgICB9O1xuICAgIGNsZWFyQXV0b1Njcm9sbEludGVydmFsKCk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2FjY2VsZXJhdGlvbiwgYXV0b1Njcm9sbCwgY2FuU2Nyb2xsLCBjbGVhckF1dG9TY3JvbGxJbnRlcnZhbCwgZW5hYmxlZCwgaW50ZXJ2YWwsIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgSlNPTi5zdHJpbmdpZnkocmVjdCksIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgSlNPTi5zdHJpbmdpZnkoc2Nyb2xsSW50ZW50KSwgc2V0QXV0b1Njcm9sbEludGVydmFsLCBzY3JvbGxhYmxlQW5jZXN0b3JzLCBzb3J0ZWRTY3JvbGxhYmxlQW5jZXN0b3JzLCBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cywgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBKU09OLnN0cmluZ2lmeSh0aHJlc2hvbGQpXSk7XG59XG5jb25zdCBkZWZhdWx0U2Nyb2xsSW50ZW50ID0ge1xuICB4OiB7XG4gICAgW0RpcmVjdGlvbi5CYWNrd2FyZF06IGZhbHNlLFxuICAgIFtEaXJlY3Rpb24uRm9yd2FyZF06IGZhbHNlXG4gIH0sXG4gIHk6IHtcbiAgICBbRGlyZWN0aW9uLkJhY2t3YXJkXTogZmFsc2UsXG4gICAgW0RpcmVjdGlvbi5Gb3J3YXJkXTogZmFsc2VcbiAgfVxufTtcblxuZnVuY3Rpb24gdXNlU2Nyb2xsSW50ZW50KF9yZWYyKSB7XG4gIGxldCB7XG4gICAgZGVsdGEsXG4gICAgZGlzYWJsZWRcbiAgfSA9IF9yZWYyO1xuICBjb25zdCBwcmV2aW91c0RlbHRhID0gdXNlUHJldmlvdXMoZGVsdGEpO1xuICByZXR1cm4gdXNlTGF6eU1lbW8ocHJldmlvdXNJbnRlbnQgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCAhcHJldmlvdXNEZWx0YSB8fCAhcHJldmlvdXNJbnRlbnQpIHtcbiAgICAgIC8vIFJlc2V0IHNjcm9sbCBpbnRlbnQgdHJhY2tpbmcgd2hlbiBhdXRvLXNjcm9sbGluZyBpcyBkaXNhYmxlZFxuICAgICAgcmV0dXJuIGRlZmF1bHRTY3JvbGxJbnRlbnQ7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aW9uID0ge1xuICAgICAgeDogTWF0aC5zaWduKGRlbHRhLnggLSBwcmV2aW91c0RlbHRhLngpLFxuICAgICAgeTogTWF0aC5zaWduKGRlbHRhLnkgLSBwcmV2aW91c0RlbHRhLnkpXG4gICAgfTsgLy8gS2VlcCB0cmFjayBvZiB0aGUgdXNlciBpbnRlbnQgdG8gc2Nyb2xsIGluIGVhY2ggZGlyZWN0aW9uIGZvciBib3RoIGF4aXNcblxuICAgIHJldHVybiB7XG4gICAgICB4OiB7XG4gICAgICAgIFtEaXJlY3Rpb24uQmFja3dhcmRdOiBwcmV2aW91c0ludGVudC54W0RpcmVjdGlvbi5CYWNrd2FyZF0gfHwgZGlyZWN0aW9uLnggPT09IC0xLFxuICAgICAgICBbRGlyZWN0aW9uLkZvcndhcmRdOiBwcmV2aW91c0ludGVudC54W0RpcmVjdGlvbi5Gb3J3YXJkXSB8fCBkaXJlY3Rpb24ueCA9PT0gMVxuICAgICAgfSxcbiAgICAgIHk6IHtcbiAgICAgICAgW0RpcmVjdGlvbi5CYWNrd2FyZF06IHByZXZpb3VzSW50ZW50LnlbRGlyZWN0aW9uLkJhY2t3YXJkXSB8fCBkaXJlY3Rpb24ueSA9PT0gLTEsXG4gICAgICAgIFtEaXJlY3Rpb24uRm9yd2FyZF06IHByZXZpb3VzSW50ZW50LnlbRGlyZWN0aW9uLkZvcndhcmRdIHx8IGRpcmVjdGlvbi55ID09PSAxXG4gICAgICB9XG4gICAgfTtcbiAgfSwgW2Rpc2FibGVkLCBkZWx0YSwgcHJldmlvdXNEZWx0YV0pO1xufVxuXG5mdW5jdGlvbiB1c2VDYWNoZWROb2RlKGRyYWdnYWJsZU5vZGVzLCBpZCkge1xuICBjb25zdCBkcmFnZ2FibGVOb2RlID0gaWQgIT0gbnVsbCA/IGRyYWdnYWJsZU5vZGVzLmdldChpZCkgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IG5vZGUgPSBkcmFnZ2FibGVOb2RlID8gZHJhZ2dhYmxlTm9kZS5ub2RlLmN1cnJlbnQgOiBudWxsO1xuICByZXR1cm4gdXNlTGF6eU1lbW8oY2FjaGVkTm9kZSA9PiB7XG4gICAgdmFyIF9yZWY7XG5cbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSAvLyBJbiBzb21lIGNhc2VzLCB0aGUgZHJhZ2dhYmxlIG5vZGUgY2FuIHVubW91bnQgd2hpbGUgZHJhZ2dpbmdcbiAgICAvLyBUaGlzIGlzIHRoZSBjYXNlIGZvciB2aXJ0dWFsaXplZCBsaXN0cy4gSW4gdGhvc2Ugc2l0dWF0aW9ucyxcbiAgICAvLyB3ZSBmYWxsIGJhY2sgdG8gdGhlIGxhc3Qga25vd24gdmFsdWUgZm9yIHRoYXQgbm9kZS5cblxuXG4gICAgcmV0dXJuIChfcmVmID0gbm9kZSAhPSBudWxsID8gbm9kZSA6IGNhY2hlZE5vZGUpICE9IG51bGwgPyBfcmVmIDogbnVsbDtcbiAgfSwgW25vZGUsIGlkXSk7XG59XG5cbmZ1bmN0aW9uIHVzZUNvbWJpbmVBY3RpdmF0b3JzKHNlbnNvcnMsIGdldFN5bnRoZXRpY0hhbmRsZXIpIHtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4gc2Vuc29ycy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBzZW5zb3IpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBzZW5zb3I6IFNlbnNvclxuICAgIH0gPSBzZW5zb3I7XG4gICAgY29uc3Qgc2Vuc29yQWN0aXZhdG9ycyA9IFNlbnNvci5hY3RpdmF0b3JzLm1hcChhY3RpdmF0b3IgPT4gKHtcbiAgICAgIGV2ZW50TmFtZTogYWN0aXZhdG9yLmV2ZW50TmFtZSxcbiAgICAgIGhhbmRsZXI6IGdldFN5bnRoZXRpY0hhbmRsZXIoYWN0aXZhdG9yLmhhbmRsZXIsIHNlbnNvcilcbiAgICB9KSk7XG4gICAgcmV0dXJuIFsuLi5hY2N1bXVsYXRvciwgLi4uc2Vuc29yQWN0aXZhdG9yc107XG4gIH0sIFtdKSwgW3NlbnNvcnMsIGdldFN5bnRoZXRpY0hhbmRsZXJdKTtcbn1cblxudmFyIE1lYXN1cmluZ1N0cmF0ZWd5O1xuXG4oZnVuY3Rpb24gKE1lYXN1cmluZ1N0cmF0ZWd5KSB7XG4gIE1lYXN1cmluZ1N0cmF0ZWd5W01lYXN1cmluZ1N0cmF0ZWd5W1wiQWx3YXlzXCJdID0gMF0gPSBcIkFsd2F5c1wiO1xuICBNZWFzdXJpbmdTdHJhdGVneVtNZWFzdXJpbmdTdHJhdGVneVtcIkJlZm9yZURyYWdnaW5nXCJdID0gMV0gPSBcIkJlZm9yZURyYWdnaW5nXCI7XG4gIE1lYXN1cmluZ1N0cmF0ZWd5W01lYXN1cmluZ1N0cmF0ZWd5W1wiV2hpbGVEcmFnZ2luZ1wiXSA9IDJdID0gXCJXaGlsZURyYWdnaW5nXCI7XG59KShNZWFzdXJpbmdTdHJhdGVneSB8fCAoTWVhc3VyaW5nU3RyYXRlZ3kgPSB7fSkpO1xuXG52YXIgTWVhc3VyaW5nRnJlcXVlbmN5O1xuXG4oZnVuY3Rpb24gKE1lYXN1cmluZ0ZyZXF1ZW5jeSkge1xuICBNZWFzdXJpbmdGcmVxdWVuY3lbXCJPcHRpbWl6ZWRcIl0gPSBcIm9wdGltaXplZFwiO1xufSkoTWVhc3VyaW5nRnJlcXVlbmN5IHx8IChNZWFzdXJpbmdGcmVxdWVuY3kgPSB7fSkpO1xuXG5jb25zdCBkZWZhdWx0VmFsdWUgPSAvKiNfX1BVUkVfXyovbmV3IE1hcCgpO1xuZnVuY3Rpb24gdXNlRHJvcHBhYmxlTWVhc3VyaW5nKGNvbnRhaW5lcnMsIF9yZWYpIHtcbiAgbGV0IHtcbiAgICBkcmFnZ2luZyxcbiAgICBkZXBlbmRlbmNpZXMsXG4gICAgY29uZmlnXG4gIH0gPSBfcmVmO1xuICBjb25zdCBbcXVldWUsIHNldFF1ZXVlXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCB7XG4gICAgZnJlcXVlbmN5LFxuICAgIG1lYXN1cmUsXG4gICAgc3RyYXRlZ3lcbiAgfSA9IGNvbmZpZztcbiAgY29uc3QgY29udGFpbmVyc1JlZiA9IHVzZVJlZihjb250YWluZXJzKTtcbiAgY29uc3QgZGlzYWJsZWQgPSBpc0Rpc2FibGVkKCk7XG4gIGNvbnN0IGRpc2FibGVkUmVmID0gdXNlTGF0ZXN0VmFsdWUoZGlzYWJsZWQpO1xuICBjb25zdCBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycyA9IHVzZUNhbGxiYWNrKGZ1bmN0aW9uIChpZHMpIHtcbiAgICBpZiAoaWRzID09PSB2b2lkIDApIHtcbiAgICAgIGlkcyA9IFtdO1xuICAgIH1cblxuICAgIGlmIChkaXNhYmxlZFJlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0UXVldWUodmFsdWUgPT4ge1xuICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBpZHM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWx1ZS5jb25jYXQoaWRzLmZpbHRlcihpZCA9PiAhdmFsdWUuaW5jbHVkZXMoaWQpKSk7XG4gICAgfSk7XG4gIH0sIFtkaXNhYmxlZFJlZl0pO1xuICBjb25zdCB0aW1lb3V0SWQgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGRyb3BwYWJsZVJlY3RzID0gdXNlTGF6eU1lbW8ocHJldmlvdXNWYWx1ZSA9PiB7XG4gICAgaWYgKGRpc2FibGVkICYmICFkcmFnZ2luZykge1xuICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoIXByZXZpb3VzVmFsdWUgfHwgcHJldmlvdXNWYWx1ZSA9PT0gZGVmYXVsdFZhbHVlIHx8IGNvbnRhaW5lcnNSZWYuY3VycmVudCAhPT0gY29udGFpbmVycyB8fCBxdWV1ZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBtYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgIGZvciAobGV0IGNvbnRhaW5lciBvZiBjb250YWluZXJzKSB7XG4gICAgICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVldWUgJiYgcXVldWUubGVuZ3RoID4gMCAmJiAhcXVldWUuaW5jbHVkZXMoY29udGFpbmVyLmlkKSAmJiBjb250YWluZXIucmVjdC5jdXJyZW50KSB7XG4gICAgICAgICAgLy8gVGhpcyBjb250YWluZXIgZG9lcyBub3QgbmVlZCB0byBiZSByZS1tZWFzdXJlZFxuICAgICAgICAgIG1hcC5zZXQoY29udGFpbmVyLmlkLCBjb250YWluZXIucmVjdC5jdXJyZW50KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGUgPSBjb250YWluZXIubm9kZS5jdXJyZW50O1xuICAgICAgICBjb25zdCByZWN0ID0gbm9kZSA/IG5ldyBSZWN0KG1lYXN1cmUobm9kZSksIG5vZGUpIDogbnVsbDtcbiAgICAgICAgY29udGFpbmVyLnJlY3QuY3VycmVudCA9IHJlY3Q7XG5cbiAgICAgICAgaWYgKHJlY3QpIHtcbiAgICAgICAgICBtYXAuc2V0KGNvbnRhaW5lci5pZCwgcmVjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1hcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldmlvdXNWYWx1ZTtcbiAgfSwgW2NvbnRhaW5lcnMsIHF1ZXVlLCBkcmFnZ2luZywgZGlzYWJsZWQsIG1lYXN1cmVdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb250YWluZXJzUmVmLmN1cnJlbnQgPSBjb250YWluZXJzO1xuICB9LCBbY29udGFpbmVyc10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzKCk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2RyYWdnaW5nLCBkaXNhYmxlZF0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChxdWV1ZSAmJiBxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBzZXRRdWV1ZShudWxsKTtcbiAgICB9XG4gIH0sIC8vZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbSlNPTi5zdHJpbmdpZnkocXVldWUpXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkIHx8IHR5cGVvZiBmcmVxdWVuY3kgIT09ICdudW1iZXInIHx8IHRpbWVvdXRJZC5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGltZW91dElkLmN1cnJlbnQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzKCk7XG4gICAgICB0aW1lb3V0SWQuY3VycmVudCA9IG51bGw7XG4gICAgfSwgZnJlcXVlbmN5KTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbZnJlcXVlbmN5LCBkaXNhYmxlZCwgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMsIC4uLmRlcGVuZGVuY2llc10pO1xuICByZXR1cm4ge1xuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzLFxuICAgIG1lYXN1cmluZ1NjaGVkdWxlZDogcXVldWUgIT0gbnVsbFxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRGlzYWJsZWQoKSB7XG4gICAgc3dpdGNoIChzdHJhdGVneSkge1xuICAgICAgY2FzZSBNZWFzdXJpbmdTdHJhdGVneS5BbHdheXM6XG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgY2FzZSBNZWFzdXJpbmdTdHJhdGVneS5CZWZvcmVEcmFnZ2luZzpcbiAgICAgICAgcmV0dXJuIGRyYWdnaW5nO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gIWRyYWdnaW5nO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1c2VJbml0aWFsVmFsdWUodmFsdWUsIGNvbXB1dGVGbikge1xuICByZXR1cm4gdXNlTGF6eU1lbW8ocHJldmlvdXNWYWx1ZSA9PiB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHByZXZpb3VzVmFsdWUpIHtcbiAgICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgY29tcHV0ZUZuID09PSAnZnVuY3Rpb24nID8gY29tcHV0ZUZuKHZhbHVlKSA6IHZhbHVlO1xuICB9LCBbY29tcHV0ZUZuLCB2YWx1ZV0pO1xufVxuXG5mdW5jdGlvbiB1c2VJbml0aWFsUmVjdChub2RlLCBtZWFzdXJlKSB7XG4gIHJldHVybiB1c2VJbml0aWFsVmFsdWUobm9kZSwgbWVhc3VyZSk7XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIGEgbmV3IE11dGF0aW9uT2JzZXJ2ZXIgaW5zdGFuY2UuXHJcbiAqIElmIGBNdXRhdGlvbk9ic2VydmVyYCBpcyB1bmRlZmluZWQgaW4gdGhlIGV4ZWN1dGlvbiBlbnZpcm9ubWVudCwgcmV0dXJucyBgdW5kZWZpbmVkYC5cclxuICovXG5cbmZ1bmN0aW9uIHVzZU11dGF0aW9uT2JzZXJ2ZXIoX3JlZikge1xuICBsZXQge1xuICAgIGNhbGxiYWNrLFxuICAgIGRpc2FibGVkXG4gIH0gPSBfcmVmO1xuICBjb25zdCBoYW5kbGVNdXRhdGlvbnMgPSB1c2VFdmVudChjYWxsYmFjayk7XG4gIGNvbnN0IG11dGF0aW9uT2JzZXJ2ZXIgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgfHwgdHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICBNdXRhdGlvbk9ic2VydmVyXG4gICAgfSA9IHdpbmRvdztcbiAgICByZXR1cm4gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoaGFuZGxlTXV0YXRpb25zKTtcbiAgfSwgW2hhbmRsZU11dGF0aW9ucywgZGlzYWJsZWRdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICByZXR1cm4gKCkgPT4gbXV0YXRpb25PYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogbXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gIH0sIFttdXRhdGlvbk9ic2VydmVyXSk7XG4gIHJldHVybiBtdXRhdGlvbk9ic2VydmVyO1xufVxuXG4vKipcclxuICogUmV0dXJucyBhIG5ldyBSZXNpemVPYnNlcnZlciBpbnN0YW5jZSBib3VuZCB0byB0aGUgYG9uUmVzaXplYCBjYWxsYmFjay5cclxuICogSWYgYFJlc2l6ZU9ic2VydmVyYCBpcyB1bmRlZmluZWQgaW4gdGhlIGV4ZWN1dGlvbiBlbnZpcm9ubWVudCwgcmV0dXJucyBgdW5kZWZpbmVkYC5cclxuICovXG5cbmZ1bmN0aW9uIHVzZVJlc2l6ZU9ic2VydmVyKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBjYWxsYmFjayxcbiAgICBkaXNhYmxlZFxuICB9ID0gX3JlZjtcbiAgY29uc3QgaGFuZGxlUmVzaXplID0gdXNlRXZlbnQoY2FsbGJhY2spO1xuICBjb25zdCByZXNpemVPYnNlcnZlciA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChkaXNhYmxlZCB8fCB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygd2luZG93LlJlc2l6ZU9ic2VydmVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICBSZXNpemVPYnNlcnZlclxuICAgIH0gPSB3aW5kb3c7XG4gICAgcmV0dXJuIG5ldyBSZXNpemVPYnNlcnZlcihoYW5kbGVSZXNpemUpO1xuICB9LCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtkaXNhYmxlZF0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJldHVybiAoKSA9PiByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICB9LCBbcmVzaXplT2JzZXJ2ZXJdKTtcbiAgcmV0dXJuIHJlc2l6ZU9ic2VydmVyO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0TWVhc3VyZShlbGVtZW50KSB7XG4gIHJldHVybiBuZXcgUmVjdChnZXRDbGllbnRSZWN0KGVsZW1lbnQpLCBlbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gdXNlUmVjdChlbGVtZW50LCBtZWFzdXJlLCBmYWxsYmFja1JlY3QpIHtcbiAgaWYgKG1lYXN1cmUgPT09IHZvaWQgMCkge1xuICAgIG1lYXN1cmUgPSBkZWZhdWx0TWVhc3VyZTtcbiAgfVxuXG4gIGNvbnN0IFtyZWN0LCBzZXRSZWN0XSA9IHVzZVN0YXRlKG51bGwpO1xuXG4gIGZ1bmN0aW9uIG1lYXN1cmVSZWN0KCkge1xuICAgIHNldFJlY3QoY3VycmVudFJlY3QgPT4ge1xuICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoZWxlbWVudC5pc0Nvbm5lY3RlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgdmFyIF9yZWY7XG5cbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGxhc3QgcmVjdCB3ZSBtZWFzdXJlZCBpZiB0aGUgZWxlbWVudCBpc1xuICAgICAgICAvLyBubyBsb25nZXIgY29ubmVjdGVkIHRvIHRoZSBET00uXG4gICAgICAgIHJldHVybiAoX3JlZiA9IGN1cnJlbnRSZWN0ICE9IG51bGwgPyBjdXJyZW50UmVjdCA6IGZhbGxiYWNrUmVjdCkgIT0gbnVsbCA/IF9yZWYgOiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdSZWN0ID0gbWVhc3VyZShlbGVtZW50KTtcblxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KGN1cnJlbnRSZWN0KSA9PT0gSlNPTi5zdHJpbmdpZnkobmV3UmVjdCkpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRSZWN0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3UmVjdDtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IG11dGF0aW9uT2JzZXJ2ZXIgPSB1c2VNdXRhdGlvbk9ic2VydmVyKHtcbiAgICBjYWxsYmFjayhyZWNvcmRzKSB7XG4gICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiByZWNvcmRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIHRhcmdldFxuICAgICAgICB9ID0gcmVjb3JkO1xuXG4gICAgICAgIGlmICh0eXBlID09PSAnY2hpbGRMaXN0JyAmJiB0YXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCAmJiB0YXJnZXQuY29udGFpbnMoZWxlbWVudCkpIHtcbiAgICAgICAgICBtZWFzdXJlUmVjdCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gIH0pO1xuICBjb25zdCByZXNpemVPYnNlcnZlciA9IHVzZVJlc2l6ZU9ic2VydmVyKHtcbiAgICBjYWxsYmFjazogbWVhc3VyZVJlY3RcbiAgfSk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIG1lYXN1cmVSZWN0KCk7XG5cbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLm9ic2VydmUoZWxlbWVudCk7XG4gICAgICBtdXRhdGlvbk9ic2VydmVyID09IG51bGwgPyB2b2lkIDAgOiBtdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgbXV0YXRpb25PYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogbXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgfVxuICB9LCBbZWxlbWVudF0pO1xuICByZXR1cm4gcmVjdDtcbn1cblxuZnVuY3Rpb24gdXNlUmVjdERlbHRhKHJlY3QpIHtcbiAgY29uc3QgaW5pdGlhbFJlY3QgPSB1c2VJbml0aWFsVmFsdWUocmVjdCk7XG4gIHJldHVybiBnZXRSZWN0RGVsdGEocmVjdCwgaW5pdGlhbFJlY3QpO1xufVxuXG5jb25zdCBkZWZhdWx0VmFsdWUkMSA9IFtdO1xuZnVuY3Rpb24gdXNlU2Nyb2xsYWJsZUFuY2VzdG9ycyhub2RlKSB7XG4gIGNvbnN0IHByZXZpb3VzTm9kZSA9IHVzZVJlZihub2RlKTtcbiAgY29uc3QgYW5jZXN0b3JzID0gdXNlTGF6eU1lbW8ocHJldmlvdXNWYWx1ZSA9PiB7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdFZhbHVlJDE7XG4gICAgfVxuXG4gICAgaWYgKHByZXZpb3VzVmFsdWUgJiYgcHJldmlvdXNWYWx1ZSAhPT0gZGVmYXVsdFZhbHVlJDEgJiYgbm9kZSAmJiBwcmV2aW91c05vZGUuY3VycmVudCAmJiBub2RlLnBhcmVudE5vZGUgPT09IHByZXZpb3VzTm9kZS5jdXJyZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzKG5vZGUpO1xuICB9LCBbbm9kZV0pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHByZXZpb3VzTm9kZS5jdXJyZW50ID0gbm9kZTtcbiAgfSwgW25vZGVdKTtcbiAgcmV0dXJuIGFuY2VzdG9ycztcbn1cblxuZnVuY3Rpb24gdXNlU2Nyb2xsT2Zmc2V0cyhlbGVtZW50cykge1xuICBjb25zdCBbc2Nyb2xsQ29vcmRpbmF0ZXMsIHNldFNjcm9sbENvb3JkaW5hdGVzXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBwcmV2RWxlbWVudHMgPSB1c2VSZWYoZWxlbWVudHMpOyAvLyBUby1kbzogVGhyb3R0bGUgdGhlIGhhbmRsZVNjcm9sbCBjYWxsYmFja1xuXG4gIGNvbnN0IGhhbmRsZVNjcm9sbCA9IHVzZUNhbGxiYWNrKGV2ZW50ID0+IHtcbiAgICBjb25zdCBzY3JvbGxpbmdFbGVtZW50ID0gZ2V0U2Nyb2xsYWJsZUVsZW1lbnQoZXZlbnQudGFyZ2V0KTtcblxuICAgIGlmICghc2Nyb2xsaW5nRWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFNjcm9sbENvb3JkaW5hdGVzKHNjcm9sbENvb3JkaW5hdGVzID0+IHtcbiAgICAgIGlmICghc2Nyb2xsQ29vcmRpbmF0ZXMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHNjcm9sbENvb3JkaW5hdGVzLnNldChzY3JvbGxpbmdFbGVtZW50LCBnZXRTY3JvbGxDb29yZGluYXRlcyhzY3JvbGxpbmdFbGVtZW50KSk7XG4gICAgICByZXR1cm4gbmV3IE1hcChzY3JvbGxDb29yZGluYXRlcyk7XG4gICAgfSk7XG4gIH0sIFtdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBwcmV2aW91c0VsZW1lbnRzID0gcHJldkVsZW1lbnRzLmN1cnJlbnQ7XG5cbiAgICBpZiAoZWxlbWVudHMgIT09IHByZXZpb3VzRWxlbWVudHMpIHtcbiAgICAgIGNsZWFudXAocHJldmlvdXNFbGVtZW50cyk7XG4gICAgICBjb25zdCBlbnRyaWVzID0gZWxlbWVudHMubWFwKGVsZW1lbnQgPT4ge1xuICAgICAgICBjb25zdCBzY3JvbGxhYmxlRWxlbWVudCA9IGdldFNjcm9sbGFibGVFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChzY3JvbGxhYmxlRWxlbWVudCkge1xuICAgICAgICAgIHNjcm9sbGFibGVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGhhbmRsZVNjcm9sbCwge1xuICAgICAgICAgICAgcGFzc2l2ZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBbc2Nyb2xsYWJsZUVsZW1lbnQsIGdldFNjcm9sbENvb3JkaW5hdGVzKHNjcm9sbGFibGVFbGVtZW50KV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pLmZpbHRlcihlbnRyeSA9PiBlbnRyeSAhPSBudWxsKTtcbiAgICAgIHNldFNjcm9sbENvb3JkaW5hdGVzKGVudHJpZXMubGVuZ3RoID8gbmV3IE1hcChlbnRyaWVzKSA6IG51bGwpO1xuICAgICAgcHJldkVsZW1lbnRzLmN1cnJlbnQgPSBlbGVtZW50cztcbiAgICB9XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY2xlYW51cChlbGVtZW50cyk7XG4gICAgICBjbGVhbnVwKHByZXZpb3VzRWxlbWVudHMpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjbGVhbnVwKGVsZW1lbnRzKSB7XG4gICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBjb25zdCBzY3JvbGxhYmxlRWxlbWVudCA9IGdldFNjcm9sbGFibGVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICBzY3JvbGxhYmxlRWxlbWVudCA9PSBudWxsID8gdm9pZCAwIDogc2Nyb2xsYWJsZUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgW2hhbmRsZVNjcm9sbCwgZWxlbWVudHNdKTtcbiAgcmV0dXJuIHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBzY3JvbGxDb29yZGluYXRlcyA/IEFycmF5LmZyb20oc2Nyb2xsQ29vcmRpbmF0ZXMudmFsdWVzKCkpLnJlZHVjZSgoYWNjLCBjb29yZGluYXRlcykgPT4gYWRkKGFjYywgY29vcmRpbmF0ZXMpLCBkZWZhdWx0Q29vcmRpbmF0ZXMpIDogZ2V0U2Nyb2xsT2Zmc2V0cyhlbGVtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRDb29yZGluYXRlcztcbiAgfSwgW2VsZW1lbnRzLCBzY3JvbGxDb29yZGluYXRlc10pO1xufVxuXG5mdW5jdGlvbiB1c2VTY3JvbGxPZmZzZXRzRGVsdGEoc2Nyb2xsT2Zmc2V0cywgZGVwZW5kZW5jaWVzKSB7XG4gIGlmIChkZXBlbmRlbmNpZXMgPT09IHZvaWQgMCkge1xuICAgIGRlcGVuZGVuY2llcyA9IFtdO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbFNjcm9sbE9mZnNldHMgPSB1c2VSZWYobnVsbCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCA9IG51bGw7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgZGVwZW5kZW5jaWVzKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYXNTY3JvbGxPZmZzZXRzID0gc2Nyb2xsT2Zmc2V0cyAhPT0gZGVmYXVsdENvb3JkaW5hdGVzO1xuXG4gICAgaWYgKGhhc1Njcm9sbE9mZnNldHMgJiYgIWluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQpIHtcbiAgICAgIGluaXRpYWxTY3JvbGxPZmZzZXRzLmN1cnJlbnQgPSBzY3JvbGxPZmZzZXRzO1xuICAgIH1cblxuICAgIGlmICghaGFzU2Nyb2xsT2Zmc2V0cyAmJiBpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50KSB7XG4gICAgICBpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50ID0gbnVsbDtcbiAgICB9XG4gIH0sIFtzY3JvbGxPZmZzZXRzXSk7XG4gIHJldHVybiBpbml0aWFsU2Nyb2xsT2Zmc2V0cy5jdXJyZW50ID8gc3VidHJhY3Qoc2Nyb2xsT2Zmc2V0cywgaW5pdGlhbFNjcm9sbE9mZnNldHMuY3VycmVudCkgOiBkZWZhdWx0Q29vcmRpbmF0ZXM7XG59XG5cbmZ1bmN0aW9uIHVzZVNlbnNvclNldHVwKHNlbnNvcnMpIHtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWNhblVzZURPTSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRlYXJkb3duRm5zID0gc2Vuc29ycy5tYXAoX3JlZiA9PiB7XG4gICAgICBsZXQge1xuICAgICAgICBzZW5zb3JcbiAgICAgIH0gPSBfcmVmO1xuICAgICAgcmV0dXJuIHNlbnNvci5zZXR1cCA9PSBudWxsID8gdm9pZCAwIDogc2Vuc29yLnNldHVwKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgdGVhcmRvd24gb2YgdGVhcmRvd25GbnMpIHtcbiAgICAgICAgdGVhcmRvd24gPT0gbnVsbCA/IHZvaWQgMCA6IHRlYXJkb3duKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgLy8gVE8tRE86IFNlbnNvcnMgbGVuZ3RoIGNvdWxkIHRoZW9yZXRpY2FsbHkgY2hhbmdlIHdoaWNoIHdvdWxkIG5vdCBiZSBhIHZhbGlkIGRlcGVuZGVuY3lcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBzZW5zb3JzLm1hcChfcmVmMiA9PiB7XG4gICAgbGV0IHtcbiAgICAgIHNlbnNvclxuICAgIH0gPSBfcmVmMjtcbiAgICByZXR1cm4gc2Vuc29yO1xuICB9KSk7XG59XG5cbmZ1bmN0aW9uIHVzZVN5bnRoZXRpY0xpc3RlbmVycyhsaXN0ZW5lcnMsIGlkKSB7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdGVuZXJzLnJlZHVjZSgoYWNjLCBfcmVmKSA9PiB7XG4gICAgICBsZXQge1xuICAgICAgICBldmVudE5hbWUsXG4gICAgICAgIGhhbmRsZXJcbiAgICAgIH0gPSBfcmVmO1xuXG4gICAgICBhY2NbZXZlbnROYW1lXSA9IGV2ZW50ID0+IHtcbiAgICAgICAgaGFuZGxlcihldmVudCwgaWQpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG4gIH0sIFtsaXN0ZW5lcnMsIGlkXSk7XG59XG5cbmZ1bmN0aW9uIHVzZVdpbmRvd1JlY3QoZWxlbWVudCkge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiBlbGVtZW50ID8gZ2V0V2luZG93Q2xpZW50UmVjdChlbGVtZW50KSA6IG51bGwsIFtlbGVtZW50XSk7XG59XG5cbmNvbnN0IGRlZmF1bHRWYWx1ZSQyID0gW107XG5mdW5jdGlvbiB1c2VSZWN0cyhlbGVtZW50cywgbWVhc3VyZSkge1xuICBpZiAobWVhc3VyZSA9PT0gdm9pZCAwKSB7XG4gICAgbWVhc3VyZSA9IGdldENsaWVudFJlY3Q7XG4gIH1cblxuICBjb25zdCBbZmlyc3RFbGVtZW50XSA9IGVsZW1lbnRzO1xuICBjb25zdCB3aW5kb3dSZWN0ID0gdXNlV2luZG93UmVjdChmaXJzdEVsZW1lbnQgPyBnZXRXaW5kb3coZmlyc3RFbGVtZW50KSA6IG51bGwpO1xuICBjb25zdCBbcmVjdHMsIHNldFJlY3RzXSA9IHVzZVN0YXRlKGRlZmF1bHRWYWx1ZSQyKTtcblxuICBmdW5jdGlvbiBtZWFzdXJlUmVjdHMoKSB7XG4gICAgc2V0UmVjdHMoKCkgPT4ge1xuICAgICAgaWYgKCFlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZSQyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZWxlbWVudHMubWFwKGVsZW1lbnQgPT4gaXNEb2N1bWVudFNjcm9sbGluZ0VsZW1lbnQoZWxlbWVudCkgPyB3aW5kb3dSZWN0IDogbmV3IFJlY3QobWVhc3VyZShlbGVtZW50KSwgZWxlbWVudCkpO1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSB1c2VSZXNpemVPYnNlcnZlcih7XG4gICAgY2FsbGJhY2s6IG1lYXN1cmVSZWN0c1xuICB9KTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICBtZWFzdXJlUmVjdHMoKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4gcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLm9ic2VydmUoZWxlbWVudCkpO1xuICB9LCBbZWxlbWVudHNdKTtcbiAgcmV0dXJuIHJlY3RzO1xufVxuXG5mdW5jdGlvbiBnZXRNZWFzdXJhYmxlTm9kZShub2RlKSB7XG4gIGlmICghbm9kZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgY29uc3QgZmlyc3RDaGlsZCA9IG5vZGUuY2hpbGRyZW5bMF07XG4gIHJldHVybiBpc0hUTUxFbGVtZW50KGZpcnN0Q2hpbGQpID8gZmlyc3RDaGlsZCA6IG5vZGU7XG59XG5cbmZ1bmN0aW9uIHVzZURyYWdPdmVybGF5TWVhc3VyaW5nKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBtZWFzdXJlXG4gIH0gPSBfcmVmO1xuICBjb25zdCBbcmVjdCwgc2V0UmVjdF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgaGFuZGxlUmVzaXplID0gdXNlQ2FsbGJhY2soZW50cmllcyA9PiB7XG4gICAgZm9yIChjb25zdCB7XG4gICAgICB0YXJnZXRcbiAgICB9IG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChpc0hUTUxFbGVtZW50KHRhcmdldCkpIHtcbiAgICAgICAgc2V0UmVjdChyZWN0ID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdSZWN0ID0gbWVhc3VyZSh0YXJnZXQpO1xuICAgICAgICAgIHJldHVybiByZWN0ID8geyAuLi5yZWN0LFxuICAgICAgICAgICAgd2lkdGg6IG5ld1JlY3Qud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IG5ld1JlY3QuaGVpZ2h0XG4gICAgICAgICAgfSA6IG5ld1JlY3Q7XG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0sIFttZWFzdXJlXSk7XG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyID0gdXNlUmVzaXplT2JzZXJ2ZXIoe1xuICAgIGNhbGxiYWNrOiBoYW5kbGVSZXNpemVcbiAgfSk7XG4gIGNvbnN0IGhhbmRsZU5vZGVDaGFuZ2UgPSB1c2VDYWxsYmFjayhlbGVtZW50ID0+IHtcbiAgICBjb25zdCBub2RlID0gZ2V0TWVhc3VyYWJsZU5vZGUoZWxlbWVudCk7XG4gICAgcmVzaXplT2JzZXJ2ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IHJlc2l6ZU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICByZXNpemVPYnNlcnZlciA9PSBudWxsID8gdm9pZCAwIDogcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShub2RlKTtcbiAgICB9XG5cbiAgICBzZXRSZWN0KG5vZGUgPyBtZWFzdXJlKG5vZGUpIDogbnVsbCk7XG4gIH0sIFttZWFzdXJlLCByZXNpemVPYnNlcnZlcl0pO1xuICBjb25zdCBbbm9kZVJlZiwgc2V0UmVmXSA9IHVzZU5vZGVSZWYoaGFuZGxlTm9kZUNoYW5nZSk7XG4gIHJldHVybiB1c2VNZW1vKCgpID0+ICh7XG4gICAgbm9kZVJlZixcbiAgICByZWN0LFxuICAgIHNldFJlZlxuICB9KSwgW3JlY3QsIG5vZGVSZWYsIHNldFJlZl0pO1xufVxuXG5jb25zdCBkZWZhdWx0U2Vuc29ycyA9IFt7XG4gIHNlbnNvcjogUG9pbnRlclNlbnNvcixcbiAgb3B0aW9uczoge31cbn0sIHtcbiAgc2Vuc29yOiBLZXlib2FyZFNlbnNvcixcbiAgb3B0aW9uczoge31cbn1dO1xuY29uc3QgZGVmYXVsdERhdGEgPSB7XG4gIGN1cnJlbnQ6IHt9XG59O1xuY29uc3QgZGVmYXVsdE1lYXN1cmluZ0NvbmZpZ3VyYXRpb24gPSB7XG4gIGRyYWdnYWJsZToge1xuICAgIG1lYXN1cmU6IGdldFRyYW5zZm9ybUFnbm9zdGljQ2xpZW50UmVjdFxuICB9LFxuICBkcm9wcGFibGU6IHtcbiAgICBtZWFzdXJlOiBnZXRUcmFuc2Zvcm1BZ25vc3RpY0NsaWVudFJlY3QsXG4gICAgc3RyYXRlZ3k6IE1lYXN1cmluZ1N0cmF0ZWd5LldoaWxlRHJhZ2dpbmcsXG4gICAgZnJlcXVlbmN5OiBNZWFzdXJpbmdGcmVxdWVuY3kuT3B0aW1pemVkXG4gIH0sXG4gIGRyYWdPdmVybGF5OiB7XG4gICAgbWVhc3VyZTogZ2V0Q2xpZW50UmVjdFxuICB9XG59O1xuXG5jbGFzcyBEcm9wcGFibGVDb250YWluZXJzTWFwIGV4dGVuZHMgTWFwIHtcbiAgZ2V0KGlkKSB7XG4gICAgdmFyIF9zdXBlciRnZXQ7XG5cbiAgICByZXR1cm4gaWQgIT0gbnVsbCA/IChfc3VwZXIkZ2V0ID0gc3VwZXIuZ2V0KGlkKSkgIT0gbnVsbCA/IF9zdXBlciRnZXQgOiB1bmRlZmluZWQgOiB1bmRlZmluZWQ7XG4gIH1cblxuICB0b0FycmF5KCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMudmFsdWVzKCkpO1xuICB9XG5cbiAgZ2V0RW5hYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy50b0FycmF5KCkuZmlsdGVyKF9yZWYgPT4ge1xuICAgICAgbGV0IHtcbiAgICAgICAgZGlzYWJsZWRcbiAgICAgIH0gPSBfcmVmO1xuICAgICAgcmV0dXJuICFkaXNhYmxlZDtcbiAgICB9KTtcbiAgfVxuXG4gIGdldE5vZGVGb3IoaWQpIHtcbiAgICB2YXIgX3RoaXMkZ2V0JG5vZGUkY3VycmVuLCBfdGhpcyRnZXQ7XG5cbiAgICByZXR1cm4gKF90aGlzJGdldCRub2RlJGN1cnJlbiA9IChfdGhpcyRnZXQgPSB0aGlzLmdldChpZCkpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRnZXQubm9kZS5jdXJyZW50KSAhPSBudWxsID8gX3RoaXMkZ2V0JG5vZGUkY3VycmVuIDogdW5kZWZpbmVkO1xuICB9XG5cbn1cblxuY29uc3QgZGVmYXVsdFB1YmxpY0NvbnRleHQgPSB7XG4gIGFjdGl2YXRvckV2ZW50OiBudWxsLFxuICBhY3RpdmU6IG51bGwsXG4gIGFjdGl2ZU5vZGU6IG51bGwsXG4gIGFjdGl2ZU5vZGVSZWN0OiBudWxsLFxuICBjb2xsaXNpb25zOiBudWxsLFxuICBjb250YWluZXJOb2RlUmVjdDogbnVsbCxcbiAgZHJhZ2dhYmxlTm9kZXM6IC8qI19fUFVSRV9fKi9uZXcgTWFwKCksXG4gIGRyb3BwYWJsZVJlY3RzOiAvKiNfX1BVUkVfXyovbmV3IE1hcCgpLFxuICBkcm9wcGFibGVDb250YWluZXJzOiAvKiNfX1BVUkVfXyovbmV3IERyb3BwYWJsZUNvbnRhaW5lcnNNYXAoKSxcbiAgb3ZlcjogbnVsbCxcbiAgZHJhZ092ZXJsYXk6IHtcbiAgICBub2RlUmVmOiB7XG4gICAgICBjdXJyZW50OiBudWxsXG4gICAgfSxcbiAgICByZWN0OiBudWxsLFxuICAgIHNldFJlZjogbm9vcFxuICB9LFxuICBzY3JvbGxhYmxlQW5jZXN0b3JzOiBbXSxcbiAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHM6IFtdLFxuICBtZWFzdXJpbmdDb25maWd1cmF0aW9uOiBkZWZhdWx0TWVhc3VyaW5nQ29uZmlndXJhdGlvbixcbiAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnM6IG5vb3AsXG4gIHdpbmRvd1JlY3Q6IG51bGwsXG4gIG1lYXN1cmluZ1NjaGVkdWxlZDogZmFsc2Vcbn07XG5jb25zdCBkZWZhdWx0SW50ZXJuYWxDb250ZXh0ID0ge1xuICBhY3RpdmF0b3JFdmVudDogbnVsbCxcbiAgYWN0aXZhdG9yczogW10sXG4gIGFjdGl2ZTogbnVsbCxcbiAgYWN0aXZlTm9kZVJlY3Q6IG51bGwsXG4gIGFyaWFEZXNjcmliZWRCeUlkOiB7XG4gICAgZHJhZ2dhYmxlOiAnJ1xuICB9LFxuICBkaXNwYXRjaDogbm9vcCxcbiAgZHJhZ2dhYmxlTm9kZXM6IC8qI19fUFVSRV9fKi9uZXcgTWFwKCksXG4gIG92ZXI6IG51bGwsXG4gIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzOiBub29wXG59O1xuY29uc3QgSW50ZXJuYWxDb250ZXh0ID0gLyojX19QVVJFX18qL2NyZWF0ZUNvbnRleHQoZGVmYXVsdEludGVybmFsQ29udGV4dCk7XG5jb25zdCBQdWJsaWNDb250ZXh0ID0gLyojX19QVVJFX18qL2NyZWF0ZUNvbnRleHQoZGVmYXVsdFB1YmxpY0NvbnRleHQpO1xuXG5mdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG4gIHJldHVybiB7XG4gICAgZHJhZ2dhYmxlOiB7XG4gICAgICBhY3RpdmU6IG51bGwsXG4gICAgICBpbml0aWFsQ29vcmRpbmF0ZXM6IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgICAgfSxcbiAgICAgIG5vZGVzOiBuZXcgTWFwKCksXG4gICAgICB0cmFuc2xhdGU6IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgICAgfVxuICAgIH0sXG4gICAgZHJvcHBhYmxlOiB7XG4gICAgICBjb250YWluZXJzOiBuZXcgRHJvcHBhYmxlQ29udGFpbmVyc01hcCgpXG4gICAgfVxuICB9O1xufVxuZnVuY3Rpb24gcmVkdWNlcihzdGF0ZSwgYWN0aW9uKSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlIEFjdGlvbi5EcmFnU3RhcnQ6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSxcbiAgICAgICAgZHJhZ2dhYmxlOiB7IC4uLnN0YXRlLmRyYWdnYWJsZSxcbiAgICAgICAgICBpbml0aWFsQ29vcmRpbmF0ZXM6IGFjdGlvbi5pbml0aWFsQ29vcmRpbmF0ZXMsXG4gICAgICAgICAgYWN0aXZlOiBhY3Rpb24uYWN0aXZlXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICBjYXNlIEFjdGlvbi5EcmFnTW92ZTpcbiAgICAgIGlmIChzdGF0ZS5kcmFnZ2FibGUuYWN0aXZlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSxcbiAgICAgICAgZHJhZ2dhYmxlOiB7IC4uLnN0YXRlLmRyYWdnYWJsZSxcbiAgICAgICAgICB0cmFuc2xhdGU6IHtcbiAgICAgICAgICAgIHg6IGFjdGlvbi5jb29yZGluYXRlcy54IC0gc3RhdGUuZHJhZ2dhYmxlLmluaXRpYWxDb29yZGluYXRlcy54LFxuICAgICAgICAgICAgeTogYWN0aW9uLmNvb3JkaW5hdGVzLnkgLSBzdGF0ZS5kcmFnZ2FibGUuaW5pdGlhbENvb3JkaW5hdGVzLnlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICBjYXNlIEFjdGlvbi5EcmFnRW5kOlxuICAgIGNhc2UgQWN0aW9uLkRyYWdDYW5jZWw6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSxcbiAgICAgICAgZHJhZ2dhYmxlOiB7IC4uLnN0YXRlLmRyYWdnYWJsZSxcbiAgICAgICAgICBhY3RpdmU6IG51bGwsXG4gICAgICAgICAgaW5pdGlhbENvb3JkaW5hdGVzOiB7XG4gICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgeTogMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdHJhbnNsYXRlOiB7XG4gICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgeTogMFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgIGNhc2UgQWN0aW9uLlJlZ2lzdGVyRHJvcHBhYmxlOlxuICAgICAge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgZWxlbWVudFxuICAgICAgICB9ID0gYWN0aW9uO1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgaWRcbiAgICAgICAgfSA9IGVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lcnMgPSBuZXcgRHJvcHBhYmxlQ29udGFpbmVyc01hcChzdGF0ZS5kcm9wcGFibGUuY29udGFpbmVycyk7XG4gICAgICAgIGNvbnRhaW5lcnMuc2V0KGlkLCBlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsXG4gICAgICAgICAgZHJvcHBhYmxlOiB7IC4uLnN0YXRlLmRyb3BwYWJsZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnNcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICBjYXNlIEFjdGlvbi5TZXREcm9wcGFibGVEaXNhYmxlZDpcbiAgICAgIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGtleSxcbiAgICAgICAgICBkaXNhYmxlZFxuICAgICAgICB9ID0gYWN0aW9uO1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gc3RhdGUuZHJvcHBhYmxlLmNvbnRhaW5lcnMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQgfHwga2V5ICE9PSBlbGVtZW50LmtleSkge1xuICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRhaW5lcnMgPSBuZXcgRHJvcHBhYmxlQ29udGFpbmVyc01hcChzdGF0ZS5kcm9wcGFibGUuY29udGFpbmVycyk7XG4gICAgICAgIGNvbnRhaW5lcnMuc2V0KGlkLCB7IC4uLmVsZW1lbnQsXG4gICAgICAgICAgZGlzYWJsZWRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7IC4uLnN0YXRlLFxuICAgICAgICAgIGRyb3BwYWJsZTogeyAuLi5zdGF0ZS5kcm9wcGFibGUsXG4gICAgICAgICAgICBjb250YWluZXJzXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgY2FzZSBBY3Rpb24uVW5yZWdpc3RlckRyb3BwYWJsZTpcbiAgICAgIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGtleVxuICAgICAgICB9ID0gYWN0aW9uO1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gc3RhdGUuZHJvcHBhYmxlLmNvbnRhaW5lcnMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWVsZW1lbnQgfHwga2V5ICE9PSBlbGVtZW50LmtleSkge1xuICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRhaW5lcnMgPSBuZXcgRHJvcHBhYmxlQ29udGFpbmVyc01hcChzdGF0ZS5kcm9wcGFibGUuY29udGFpbmVycyk7XG4gICAgICAgIGNvbnRhaW5lcnMuZGVsZXRlKGlkKTtcbiAgICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsXG4gICAgICAgICAgZHJvcHBhYmxlOiB7IC4uLnN0YXRlLmRyb3BwYWJsZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnNcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICBkZWZhdWx0OlxuICAgICAge1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gUmVzdG9yZUZvY3VzKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBkaXNhYmxlZFxuICB9ID0gX3JlZjtcbiAgY29uc3Qge1xuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmF0b3JFdmVudCxcbiAgICBkcmFnZ2FibGVOb2Rlc1xuICB9ID0gdXNlQ29udGV4dChJbnRlcm5hbENvbnRleHQpO1xuICBjb25zdCBwcmV2aW91c0FjdGl2YXRvckV2ZW50ID0gdXNlUHJldmlvdXMoYWN0aXZhdG9yRXZlbnQpO1xuICBjb25zdCBwcmV2aW91c0FjdGl2ZUlkID0gdXNlUHJldmlvdXMoYWN0aXZlID09IG51bGwgPyB2b2lkIDAgOiBhY3RpdmUuaWQpOyAvLyBSZXN0b3JlIGtleWJvYXJkIGZvY3VzIG9uIHRoZSBhY3RpdmF0b3Igbm9kZVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFhY3RpdmF0b3JFdmVudCAmJiBwcmV2aW91c0FjdGl2YXRvckV2ZW50ICYmIHByZXZpb3VzQWN0aXZlSWQgIT0gbnVsbCkge1xuICAgICAgaWYgKCFpc0tleWJvYXJkRXZlbnQocHJldmlvdXNBY3RpdmF0b3JFdmVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gcHJldmlvdXNBY3RpdmF0b3JFdmVudC50YXJnZXQpIHtcbiAgICAgICAgLy8gTm8gbmVlZCB0byByZXN0b3JlIGZvY3VzXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZHJhZ2dhYmxlTm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChwcmV2aW91c0FjdGl2ZUlkKTtcblxuICAgICAgaWYgKCFkcmFnZ2FibGVOb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge1xuICAgICAgICBhY3RpdmF0b3JOb2RlLFxuICAgICAgICBub2RlXG4gICAgICB9ID0gZHJhZ2dhYmxlTm9kZTtcblxuICAgICAgaWYgKCFhY3RpdmF0b3JOb2RlLmN1cnJlbnQgJiYgIW5vZGUuY3VycmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBbYWN0aXZhdG9yTm9kZS5jdXJyZW50LCBub2RlLmN1cnJlbnRdKSB7XG4gICAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBmb2N1c2FibGVOb2RlID0gZmluZEZpcnN0Rm9jdXNhYmxlTm9kZShlbGVtZW50KTtcblxuICAgICAgICAgIGlmIChmb2N1c2FibGVOb2RlKSB7XG4gICAgICAgICAgICBmb2N1c2FibGVOb2RlLmZvY3VzKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgW2FjdGl2YXRvckV2ZW50LCBkaXNhYmxlZCwgZHJhZ2dhYmxlTm9kZXMsIHByZXZpb3VzQWN0aXZlSWQsIHByZXZpb3VzQWN0aXZhdG9yRXZlbnRdKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGFwcGx5TW9kaWZpZXJzKG1vZGlmaWVycywgX3JlZikge1xuICBsZXQge1xuICAgIHRyYW5zZm9ybSxcbiAgICAuLi5hcmdzXG4gIH0gPSBfcmVmO1xuICByZXR1cm4gbW9kaWZpZXJzICE9IG51bGwgJiYgbW9kaWZpZXJzLmxlbmd0aCA/IG1vZGlmaWVycy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBtb2RpZmllcikgPT4ge1xuICAgIHJldHVybiBtb2RpZmllcih7XG4gICAgICB0cmFuc2Zvcm06IGFjY3VtdWxhdG9yLFxuICAgICAgLi4uYXJnc1xuICAgIH0pO1xuICB9LCB0cmFuc2Zvcm0pIDogdHJhbnNmb3JtO1xufVxuXG5mdW5jdGlvbiB1c2VNZWFzdXJpbmdDb25maWd1cmF0aW9uKGNvbmZpZykge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiAoe1xuICAgIGRyYWdnYWJsZTogeyAuLi5kZWZhdWx0TWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnZ2FibGUsXG4gICAgICAuLi4oY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcuZHJhZ2dhYmxlKVxuICAgIH0sXG4gICAgZHJvcHBhYmxlOiB7IC4uLmRlZmF1bHRNZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyb3BwYWJsZSxcbiAgICAgIC4uLihjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5kcm9wcGFibGUpXG4gICAgfSxcbiAgICBkcmFnT3ZlcmxheTogeyAuLi5kZWZhdWx0TWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnT3ZlcmxheSxcbiAgICAgIC4uLihjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5kcmFnT3ZlcmxheSlcbiAgICB9XG4gIH0pLCAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIFtjb25maWcgPT0gbnVsbCA/IHZvaWQgMCA6IGNvbmZpZy5kcmFnZ2FibGUsIGNvbmZpZyA9PSBudWxsID8gdm9pZCAwIDogY29uZmlnLmRyb3BwYWJsZSwgY29uZmlnID09IG51bGwgPyB2b2lkIDAgOiBjb25maWcuZHJhZ092ZXJsYXldKTtcbn1cblxuZnVuY3Rpb24gdXNlTGF5b3V0U2hpZnRTY3JvbGxDb21wZW5zYXRpb24oX3JlZikge1xuICBsZXQge1xuICAgIGFjdGl2ZU5vZGUsXG4gICAgbWVhc3VyZSxcbiAgICBpbml0aWFsUmVjdCxcbiAgICBjb25maWcgPSB0cnVlXG4gIH0gPSBfcmVmO1xuICBjb25zdCBpbml0aWFsaXplZCA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHtcbiAgICB4LFxuICAgIHlcbiAgfSA9IHR5cGVvZiBjb25maWcgPT09ICdib29sZWFuJyA/IHtcbiAgICB4OiBjb25maWcsXG4gICAgeTogY29uZmlnXG4gIH0gOiBjb25maWc7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGRpc2FibGVkID0gIXggJiYgIXk7XG5cbiAgICBpZiAoZGlzYWJsZWQgfHwgIWFjdGl2ZU5vZGUpIHtcbiAgICAgIGluaXRpYWxpemVkLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoaW5pdGlhbGl6ZWQuY3VycmVudCB8fCAhaW5pdGlhbFJlY3QpIHtcbiAgICAgIC8vIFJldHVybiBlYXJseSBpZiBsYXlvdXQgc2hpZnQgc2Nyb2xsIGNvbXBlbnNhdGlvbiB3YXMgYWxyZWFkeSBhdHRlbXB0ZWRcbiAgICAgIC8vIG9yIGlmIHRoZXJlIGlzIG5vIGluaXRpYWxSZWN0IHRvIGNvbXBhcmUgdG8uXG4gICAgICByZXR1cm47XG4gICAgfSAvLyBHZXQgdGhlIG1vc3QgdXAgdG8gZGF0ZSBub2RlIHJlZiBmb3IgdGhlIGFjdGl2ZSBkcmFnZ2FibGVcblxuXG4gICAgY29uc3Qgbm9kZSA9IGFjdGl2ZU5vZGUgPT0gbnVsbCA/IHZvaWQgMCA6IGFjdGl2ZU5vZGUubm9kZS5jdXJyZW50O1xuXG4gICAgaWYgKCFub2RlIHx8IG5vZGUuaXNDb25uZWN0ZWQgPT09IGZhbHNlKSB7XG4gICAgICAvLyBSZXR1cm4gZWFybHkgaWYgdGhlcmUgaXMgbm8gYXR0YWNoZWQgbm9kZSByZWYgb3IgaWYgdGhlIG5vZGUgaXNcbiAgICAgIC8vIGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZWN0ID0gbWVhc3VyZShub2RlKTtcbiAgICBjb25zdCByZWN0RGVsdGEgPSBnZXRSZWN0RGVsdGEocmVjdCwgaW5pdGlhbFJlY3QpO1xuXG4gICAgaWYgKCF4KSB7XG4gICAgICByZWN0RGVsdGEueCA9IDA7XG4gICAgfVxuXG4gICAgaWYgKCF5KSB7XG4gICAgICByZWN0RGVsdGEueSA9IDA7XG4gICAgfSAvLyBPbmx5IHBlcmZvcm0gbGF5b3V0IHNoaWZ0IHNjcm9sbCBjb21wZW5zYXRpb24gb25jZVxuXG5cbiAgICBpbml0aWFsaXplZC5jdXJyZW50ID0gdHJ1ZTtcblxuICAgIGlmIChNYXRoLmFicyhyZWN0RGVsdGEueCkgPiAwIHx8IE1hdGguYWJzKHJlY3REZWx0YS55KSA+IDApIHtcbiAgICAgIGNvbnN0IGZpcnN0U2Nyb2xsYWJsZUFuY2VzdG9yID0gZ2V0Rmlyc3RTY3JvbGxhYmxlQW5jZXN0b3Iobm9kZSk7XG5cbiAgICAgIGlmIChmaXJzdFNjcm9sbGFibGVBbmNlc3Rvcikge1xuICAgICAgICBmaXJzdFNjcm9sbGFibGVBbmNlc3Rvci5zY3JvbGxCeSh7XG4gICAgICAgICAgdG9wOiByZWN0RGVsdGEueSxcbiAgICAgICAgICBsZWZ0OiByZWN0RGVsdGEueFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFthY3RpdmVOb2RlLCB4LCB5LCBpbml0aWFsUmVjdCwgbWVhc3VyZV0pO1xufVxuXG5jb25zdCBBY3RpdmVEcmFnZ2FibGVDb250ZXh0ID0gLyojX19QVVJFX18qL2NyZWF0ZUNvbnRleHQoeyAuLi5kZWZhdWx0Q29vcmRpbmF0ZXMsXG4gIHNjYWxlWDogMSxcbiAgc2NhbGVZOiAxXG59KTtcbnZhciBTdGF0dXM7XG5cbihmdW5jdGlvbiAoU3RhdHVzKSB7XG4gIFN0YXR1c1tTdGF0dXNbXCJVbmluaXRpYWxpemVkXCJdID0gMF0gPSBcIlVuaW5pdGlhbGl6ZWRcIjtcbiAgU3RhdHVzW1N0YXR1c1tcIkluaXRpYWxpemluZ1wiXSA9IDFdID0gXCJJbml0aWFsaXppbmdcIjtcbiAgU3RhdHVzW1N0YXR1c1tcIkluaXRpYWxpemVkXCJdID0gMl0gPSBcIkluaXRpYWxpemVkXCI7XG59KShTdGF0dXMgfHwgKFN0YXR1cyA9IHt9KSk7XG5cbmNvbnN0IERuZENvbnRleHQgPSAvKiNfX1BVUkVfXyovbWVtbyhmdW5jdGlvbiBEbmRDb250ZXh0KF9yZWYpIHtcbiAgdmFyIF9zZW5zb3JDb250ZXh0JGN1cnJlbiwgX2RyYWdPdmVybGF5JG5vZGVSZWYkLCBfZHJhZ092ZXJsYXkkcmVjdCwgX292ZXIkcmVjdDtcblxuICBsZXQge1xuICAgIGlkLFxuICAgIGFjY2Vzc2liaWxpdHksXG4gICAgYXV0b1Njcm9sbCA9IHRydWUsXG4gICAgY2hpbGRyZW4sXG4gICAgc2Vuc29ycyA9IGRlZmF1bHRTZW5zb3JzLFxuICAgIGNvbGxpc2lvbkRldGVjdGlvbiA9IHJlY3RJbnRlcnNlY3Rpb24sXG4gICAgbWVhc3VyaW5nLFxuICAgIG1vZGlmaWVycyxcbiAgICAuLi5wcm9wc1xuICB9ID0gX3JlZjtcbiAgY29uc3Qgc3RvcmUgPSB1c2VSZWR1Y2VyKHJlZHVjZXIsIHVuZGVmaW5lZCwgZ2V0SW5pdGlhbFN0YXRlKTtcbiAgY29uc3QgW3N0YXRlLCBkaXNwYXRjaF0gPSBzdG9yZTtcbiAgY29uc3QgW2Rpc3BhdGNoTW9uaXRvckV2ZW50LCByZWdpc3Rlck1vbml0b3JMaXN0ZW5lcl0gPSB1c2VEbmRNb25pdG9yUHJvdmlkZXIoKTtcbiAgY29uc3QgW3N0YXR1cywgc2V0U3RhdHVzXSA9IHVzZVN0YXRlKFN0YXR1cy5VbmluaXRpYWxpemVkKTtcbiAgY29uc3QgaXNJbml0aWFsaXplZCA9IHN0YXR1cyA9PT0gU3RhdHVzLkluaXRpYWxpemVkO1xuICBjb25zdCB7XG4gICAgZHJhZ2dhYmxlOiB7XG4gICAgICBhY3RpdmU6IGFjdGl2ZUlkLFxuICAgICAgbm9kZXM6IGRyYWdnYWJsZU5vZGVzLFxuICAgICAgdHJhbnNsYXRlXG4gICAgfSxcbiAgICBkcm9wcGFibGU6IHtcbiAgICAgIGNvbnRhaW5lcnM6IGRyb3BwYWJsZUNvbnRhaW5lcnNcbiAgICB9XG4gIH0gPSBzdGF0ZTtcbiAgY29uc3Qgbm9kZSA9IGFjdGl2ZUlkICE9IG51bGwgPyBkcmFnZ2FibGVOb2Rlcy5nZXQoYWN0aXZlSWQpIDogbnVsbDtcbiAgY29uc3QgYWN0aXZlUmVjdHMgPSB1c2VSZWYoe1xuICAgIGluaXRpYWw6IG51bGwsXG4gICAgdHJhbnNsYXRlZDogbnVsbFxuICB9KTtcbiAgY29uc3QgYWN0aXZlID0gdXNlTWVtbygoKSA9PiB7XG4gICAgdmFyIF9ub2RlJGRhdGE7XG5cbiAgICByZXR1cm4gYWN0aXZlSWQgIT0gbnVsbCA/IHtcbiAgICAgIGlkOiBhY3RpdmVJZCxcbiAgICAgIC8vIEl0J3MgcG9zc2libGUgZm9yIHRoZSBhY3RpdmUgbm9kZSB0byB1bm1vdW50IHdoaWxlIGRyYWdnaW5nXG4gICAgICBkYXRhOiAoX25vZGUkZGF0YSA9IG5vZGUgPT0gbnVsbCA/IHZvaWQgMCA6IG5vZGUuZGF0YSkgIT0gbnVsbCA/IF9ub2RlJGRhdGEgOiBkZWZhdWx0RGF0YSxcbiAgICAgIHJlY3Q6IGFjdGl2ZVJlY3RzXG4gICAgfSA6IG51bGw7XG4gIH0sIFthY3RpdmVJZCwgbm9kZV0pO1xuICBjb25zdCBhY3RpdmVSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IFthY3RpdmVTZW5zb3IsIHNldEFjdGl2ZVNlbnNvcl0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2FjdGl2YXRvckV2ZW50LCBzZXRBY3RpdmF0b3JFdmVudF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgbGF0ZXN0UHJvcHMgPSB1c2VMYXRlc3RWYWx1ZShwcm9wcywgT2JqZWN0LnZhbHVlcyhwcm9wcykpO1xuICBjb25zdCBkcmFnZ2FibGVEZXNjcmliZWRCeUlkID0gdXNlVW5pcXVlSWQoXCJEbmREZXNjcmliZWRCeVwiLCBpZCk7XG4gIGNvbnN0IGVuYWJsZWREcm9wcGFibGVDb250YWluZXJzID0gdXNlTWVtbygoKSA9PiBkcm9wcGFibGVDb250YWluZXJzLmdldEVuYWJsZWQoKSwgW2Ryb3BwYWJsZUNvbnRhaW5lcnNdKTtcbiAgY29uc3QgbWVhc3VyaW5nQ29uZmlndXJhdGlvbiA9IHVzZU1lYXN1cmluZ0NvbmZpZ3VyYXRpb24obWVhc3VyaW5nKTtcbiAgY29uc3Qge1xuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzLFxuICAgIG1lYXN1cmluZ1NjaGVkdWxlZFxuICB9ID0gdXNlRHJvcHBhYmxlTWVhc3VyaW5nKGVuYWJsZWREcm9wcGFibGVDb250YWluZXJzLCB7XG4gICAgZHJhZ2dpbmc6IGlzSW5pdGlhbGl6ZWQsXG4gICAgZGVwZW5kZW5jaWVzOiBbdHJhbnNsYXRlLngsIHRyYW5zbGF0ZS55XSxcbiAgICBjb25maWc6IG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJvcHBhYmxlXG4gIH0pO1xuICBjb25zdCBhY3RpdmVOb2RlID0gdXNlQ2FjaGVkTm9kZShkcmFnZ2FibGVOb2RlcywgYWN0aXZlSWQpO1xuICBjb25zdCBhY3RpdmF0aW9uQ29vcmRpbmF0ZXMgPSB1c2VNZW1vKCgpID0+IGFjdGl2YXRvckV2ZW50ID8gZ2V0RXZlbnRDb29yZGluYXRlcyhhY3RpdmF0b3JFdmVudCkgOiBudWxsLCBbYWN0aXZhdG9yRXZlbnRdKTtcbiAgY29uc3QgYXV0b1Njcm9sbE9wdGlvbnMgPSBnZXRBdXRvU2Nyb2xsZXJPcHRpb25zKCk7XG4gIGNvbnN0IGluaXRpYWxBY3RpdmVOb2RlUmVjdCA9IHVzZUluaXRpYWxSZWN0KGFjdGl2ZU5vZGUsIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ2dhYmxlLm1lYXN1cmUpO1xuICB1c2VMYXlvdXRTaGlmdFNjcm9sbENvbXBlbnNhdGlvbih7XG4gICAgYWN0aXZlTm9kZTogYWN0aXZlSWQgIT0gbnVsbCA/IGRyYWdnYWJsZU5vZGVzLmdldChhY3RpdmVJZCkgOiBudWxsLFxuICAgIGNvbmZpZzogYXV0b1Njcm9sbE9wdGlvbnMubGF5b3V0U2hpZnRDb21wZW5zYXRpb24sXG4gICAgaW5pdGlhbFJlY3Q6IGluaXRpYWxBY3RpdmVOb2RlUmVjdCxcbiAgICBtZWFzdXJlOiBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdnYWJsZS5tZWFzdXJlXG4gIH0pO1xuICBjb25zdCBhY3RpdmVOb2RlUmVjdCA9IHVzZVJlY3QoYWN0aXZlTm9kZSwgbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnZ2FibGUubWVhc3VyZSwgaW5pdGlhbEFjdGl2ZU5vZGVSZWN0KTtcbiAgY29uc3QgY29udGFpbmVyTm9kZVJlY3QgPSB1c2VSZWN0KGFjdGl2ZU5vZGUgPyBhY3RpdmVOb2RlLnBhcmVudEVsZW1lbnQgOiBudWxsKTtcbiAgY29uc3Qgc2Vuc29yQ29udGV4dCA9IHVzZVJlZih7XG4gICAgYWN0aXZhdG9yRXZlbnQ6IG51bGwsXG4gICAgYWN0aXZlOiBudWxsLFxuICAgIGFjdGl2ZU5vZGUsXG4gICAgY29sbGlzaW9uUmVjdDogbnVsbCxcbiAgICBjb2xsaXNpb25zOiBudWxsLFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgIGRyYWdnaW5nTm9kZTogbnVsbCxcbiAgICBkcmFnZ2luZ05vZGVSZWN0OiBudWxsLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgb3ZlcjogbnVsbCxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JzOiBbXSxcbiAgICBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZTogbnVsbFxuICB9KTtcbiAgY29uc3Qgb3Zlck5vZGUgPSBkcm9wcGFibGVDb250YWluZXJzLmdldE5vZGVGb3IoKF9zZW5zb3JDb250ZXh0JGN1cnJlbiA9IHNlbnNvckNvbnRleHQuY3VycmVudC5vdmVyKSA9PSBudWxsID8gdm9pZCAwIDogX3NlbnNvckNvbnRleHQkY3VycmVuLmlkKTtcbiAgY29uc3QgZHJhZ092ZXJsYXkgPSB1c2VEcmFnT3ZlcmxheU1lYXN1cmluZyh7XG4gICAgbWVhc3VyZTogbWVhc3VyaW5nQ29uZmlndXJhdGlvbi5kcmFnT3ZlcmxheS5tZWFzdXJlXG4gIH0pOyAvLyBVc2UgdGhlIHJlY3Qgb2YgdGhlIGRyYWcgb3ZlcmxheSBpZiBpdCBpcyBtb3VudGVkXG5cbiAgY29uc3QgZHJhZ2dpbmdOb2RlID0gKF9kcmFnT3ZlcmxheSRub2RlUmVmJCA9IGRyYWdPdmVybGF5Lm5vZGVSZWYuY3VycmVudCkgIT0gbnVsbCA/IF9kcmFnT3ZlcmxheSRub2RlUmVmJCA6IGFjdGl2ZU5vZGU7XG4gIGNvbnN0IGRyYWdnaW5nTm9kZVJlY3QgPSBpc0luaXRpYWxpemVkID8gKF9kcmFnT3ZlcmxheSRyZWN0ID0gZHJhZ092ZXJsYXkucmVjdCkgIT0gbnVsbCA/IF9kcmFnT3ZlcmxheSRyZWN0IDogYWN0aXZlTm9kZVJlY3QgOiBudWxsO1xuICBjb25zdCB1c2VzRHJhZ092ZXJsYXkgPSBCb29sZWFuKGRyYWdPdmVybGF5Lm5vZGVSZWYuY3VycmVudCAmJiBkcmFnT3ZlcmxheS5yZWN0KTsgLy8gVGhlIGRlbHRhIGJldHdlZW4gdGhlIHByZXZpb3VzIGFuZCBuZXcgcG9zaXRpb24gb2YgdGhlIGRyYWdnYWJsZSBub2RlXG4gIC8vIGlzIG9ubHkgcmVsZXZhbnQgd2hlbiB0aGVyZSBpcyBubyBkcmFnIG92ZXJsYXlcblxuICBjb25zdCBub2RlUmVjdERlbHRhID0gdXNlUmVjdERlbHRhKHVzZXNEcmFnT3ZlcmxheSA/IG51bGwgOiBhY3RpdmVOb2RlUmVjdCk7IC8vIEdldCB0aGUgd2luZG93IHJlY3Qgb2YgdGhlIGRyYWdnaW5nIG5vZGVcblxuICBjb25zdCB3aW5kb3dSZWN0ID0gdXNlV2luZG93UmVjdChkcmFnZ2luZ05vZGUgPyBnZXRXaW5kb3coZHJhZ2dpbmdOb2RlKSA6IG51bGwpOyAvLyBHZXQgc2Nyb2xsYWJsZSBhbmNlc3RvcnMgb2YgdGhlIGRyYWdnaW5nIG5vZGVcblxuICBjb25zdCBzY3JvbGxhYmxlQW5jZXN0b3JzID0gdXNlU2Nyb2xsYWJsZUFuY2VzdG9ycyhpc0luaXRpYWxpemVkID8gb3Zlck5vZGUgIT0gbnVsbCA/IG92ZXJOb2RlIDogYWN0aXZlTm9kZSA6IG51bGwpO1xuICBjb25zdCBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cyA9IHVzZVJlY3RzKHNjcm9sbGFibGVBbmNlc3RvcnMpOyAvLyBBcHBseSBtb2RpZmllcnNcblxuICBjb25zdCBtb2RpZmllZFRyYW5zbGF0ZSA9IGFwcGx5TW9kaWZpZXJzKG1vZGlmaWVycywge1xuICAgIHRyYW5zZm9ybToge1xuICAgICAgeDogdHJhbnNsYXRlLnggLSBub2RlUmVjdERlbHRhLngsXG4gICAgICB5OiB0cmFuc2xhdGUueSAtIG5vZGVSZWN0RGVsdGEueSxcbiAgICAgIHNjYWxlWDogMSxcbiAgICAgIHNjYWxlWTogMVxuICAgIH0sXG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWN0aXZlLFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGNvbnRhaW5lck5vZGVSZWN0LFxuICAgIGRyYWdnaW5nTm9kZVJlY3QsXG4gICAgb3Zlcjogc2Vuc29yQ29udGV4dC5jdXJyZW50Lm92ZXIsXG4gICAgb3ZlcmxheU5vZGVSZWN0OiBkcmFnT3ZlcmxheS5yZWN0LFxuICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsXG4gICAgd2luZG93UmVjdFxuICB9KTtcbiAgY29uc3QgcG9pbnRlckNvb3JkaW5hdGVzID0gYWN0aXZhdGlvbkNvb3JkaW5hdGVzID8gYWRkKGFjdGl2YXRpb25Db29yZGluYXRlcywgdHJhbnNsYXRlKSA6IG51bGw7XG4gIGNvbnN0IHNjcm9sbE9mZnNldHMgPSB1c2VTY3JvbGxPZmZzZXRzKHNjcm9sbGFibGVBbmNlc3RvcnMpOyAvLyBSZXByZXNlbnRzIHRoZSBzY3JvbGwgZGVsdGEgc2luY2UgZHJhZ2dpbmcgd2FzIGluaXRpYXRlZFxuXG4gIGNvbnN0IHNjcm9sbEFkanVzdG1lbnQgPSB1c2VTY3JvbGxPZmZzZXRzRGVsdGEoc2Nyb2xsT2Zmc2V0cyk7IC8vIFJlcHJlc2VudHMgdGhlIHNjcm9sbCBkZWx0YSBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBhY3RpdmUgbm9kZSByZWN0IHdhcyBtZWFzdXJlZFxuXG4gIGNvbnN0IGFjdGl2ZU5vZGVTY3JvbGxEZWx0YSA9IHVzZVNjcm9sbE9mZnNldHNEZWx0YShzY3JvbGxPZmZzZXRzLCBbYWN0aXZlTm9kZVJlY3RdKTtcbiAgY29uc3Qgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUgPSBhZGQobW9kaWZpZWRUcmFuc2xhdGUsIHNjcm9sbEFkanVzdG1lbnQpO1xuICBjb25zdCBjb2xsaXNpb25SZWN0ID0gZHJhZ2dpbmdOb2RlUmVjdCA/IGdldEFkanVzdGVkUmVjdChkcmFnZ2luZ05vZGVSZWN0LCBtb2RpZmllZFRyYW5zbGF0ZSkgOiBudWxsO1xuICBjb25zdCBjb2xsaXNpb25zID0gYWN0aXZlICYmIGNvbGxpc2lvblJlY3QgPyBjb2xsaXNpb25EZXRlY3Rpb24oe1xuICAgIGFjdGl2ZSxcbiAgICBjb2xsaXNpb25SZWN0LFxuICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnM6IGVuYWJsZWREcm9wcGFibGVDb250YWluZXJzLFxuICAgIHBvaW50ZXJDb29yZGluYXRlc1xuICB9KSA6IG51bGw7XG4gIGNvbnN0IG92ZXJJZCA9IGdldEZpcnN0Q29sbGlzaW9uKGNvbGxpc2lvbnMsICdpZCcpO1xuICBjb25zdCBbb3Zlciwgc2V0T3Zlcl0gPSB1c2VTdGF0ZShudWxsKTsgLy8gV2hlbiB0aGVyZSBpcyBubyBkcmFnIG92ZXJsYXkgdXNlZCwgd2UgbmVlZCB0byBhY2NvdW50IGZvciB0aGVcbiAgLy8gd2luZG93IHNjcm9sbCBkZWx0YVxuXG4gIGNvbnN0IGFwcGxpZWRUcmFuc2xhdGUgPSB1c2VzRHJhZ092ZXJsYXkgPyBtb2RpZmllZFRyYW5zbGF0ZSA6IGFkZChtb2RpZmllZFRyYW5zbGF0ZSwgYWN0aXZlTm9kZVNjcm9sbERlbHRhKTtcbiAgY29uc3QgdHJhbnNmb3JtID0gYWRqdXN0U2NhbGUoYXBwbGllZFRyYW5zbGF0ZSwgKF9vdmVyJHJlY3QgPSBvdmVyID09IG51bGwgPyB2b2lkIDAgOiBvdmVyLnJlY3QpICE9IG51bGwgPyBfb3ZlciRyZWN0IDogbnVsbCwgYWN0aXZlTm9kZVJlY3QpO1xuICBjb25zdCBhY3RpdmVTZW5zb3JSZWYgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGluc3RhbnRpYXRlU2Vuc29yID0gdXNlQ2FsbGJhY2soKGV2ZW50LCBfcmVmMikgPT4ge1xuICAgIGxldCB7XG4gICAgICBzZW5zb3I6IFNlbnNvcixcbiAgICAgIG9wdGlvbnNcbiAgICB9ID0gX3JlZjI7XG5cbiAgICBpZiAoYWN0aXZlUmVmLmN1cnJlbnQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZU5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoYWN0aXZlUmVmLmN1cnJlbnQpO1xuXG4gICAgaWYgKCFhY3RpdmVOb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aXZhdG9yRXZlbnQgPSBldmVudC5uYXRpdmVFdmVudDtcbiAgICBjb25zdCBzZW5zb3JJbnN0YW5jZSA9IG5ldyBTZW5zb3Ioe1xuICAgICAgYWN0aXZlOiBhY3RpdmVSZWYuY3VycmVudCxcbiAgICAgIGFjdGl2ZU5vZGUsXG4gICAgICBldmVudDogYWN0aXZhdG9yRXZlbnQsXG4gICAgICBvcHRpb25zLFxuICAgICAgLy8gU2Vuc29ycyBuZWVkIHRvIGJlIGluc3RhbnRpYXRlZCB3aXRoIHJlZnMgZm9yIGFyZ3VtZW50cyB0aGF0IGNoYW5nZSBvdmVyIHRpbWVcbiAgICAgIC8vIG90aGVyd2lzZSB0aGV5IGFyZSBmcm96ZW4gaW4gdGltZSB3aXRoIHRoZSBzdGFsZSBhcmd1bWVudHNcbiAgICAgIGNvbnRleHQ6IHNlbnNvckNvbnRleHQsXG5cbiAgICAgIG9uQWJvcnQoaWQpIHtcbiAgICAgICAgY29uc3QgZHJhZ2dhYmxlTm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFkcmFnZ2FibGVOb2RlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIG9uRHJhZ0Fib3J0XG4gICAgICAgIH0gPSBsYXRlc3RQcm9wcy5jdXJyZW50O1xuICAgICAgICBjb25zdCBldmVudCA9IHtcbiAgICAgICAgICBpZFxuICAgICAgICB9O1xuICAgICAgICBvbkRyYWdBYm9ydCA9PSBudWxsID8gdm9pZCAwIDogb25EcmFnQWJvcnQoZXZlbnQpO1xuICAgICAgICBkaXNwYXRjaE1vbml0b3JFdmVudCh7XG4gICAgICAgICAgdHlwZTogJ29uRHJhZ0Fib3J0JyxcbiAgICAgICAgICBldmVudFxuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIG9uUGVuZGluZyhpZCwgY29uc3RyYWludCwgaW5pdGlhbENvb3JkaW5hdGVzLCBvZmZzZXQpIHtcbiAgICAgICAgY29uc3QgZHJhZ2dhYmxlTm9kZSA9IGRyYWdnYWJsZU5vZGVzLmdldChpZCk7XG5cbiAgICAgICAgaWYgKCFkcmFnZ2FibGVOb2RlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIG9uRHJhZ1BlbmRpbmdcbiAgICAgICAgfSA9IGxhdGVzdFByb3BzLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbnN0cmFpbnQsXG4gICAgICAgICAgaW5pdGlhbENvb3JkaW5hdGVzLFxuICAgICAgICAgIG9mZnNldFxuICAgICAgICB9O1xuICAgICAgICBvbkRyYWdQZW5kaW5nID09IG51bGwgPyB2b2lkIDAgOiBvbkRyYWdQZW5kaW5nKGV2ZW50KTtcbiAgICAgICAgZGlzcGF0Y2hNb25pdG9yRXZlbnQoe1xuICAgICAgICAgIHR5cGU6ICdvbkRyYWdQZW5kaW5nJyxcbiAgICAgICAgICBldmVudFxuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIG9uU3RhcnQoaW5pdGlhbENvb3JkaW5hdGVzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gYWN0aXZlUmVmLmN1cnJlbnQ7XG5cbiAgICAgICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkcmFnZ2FibGVOb2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoIWRyYWdnYWJsZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgb25EcmFnU3RhcnRcbiAgICAgICAgfSA9IGxhdGVzdFByb3BzLmN1cnJlbnQ7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0ge1xuICAgICAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgICAgIGFjdGl2ZToge1xuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICBkYXRhOiBkcmFnZ2FibGVOb2RlLmRhdGEsXG4gICAgICAgICAgICByZWN0OiBhY3RpdmVSZWN0c1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdW5zdGFibGVfYmF0Y2hlZFVwZGF0ZXMoKCkgPT4ge1xuICAgICAgICAgIG9uRHJhZ1N0YXJ0ID09IG51bGwgPyB2b2lkIDAgOiBvbkRyYWdTdGFydChldmVudCk7XG4gICAgICAgICAgc2V0U3RhdHVzKFN0YXR1cy5Jbml0aWFsaXppbmcpO1xuICAgICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICAgIHR5cGU6IEFjdGlvbi5EcmFnU3RhcnQsXG4gICAgICAgICAgICBpbml0aWFsQ29vcmRpbmF0ZXMsXG4gICAgICAgICAgICBhY3RpdmU6IGlkXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZGlzcGF0Y2hNb25pdG9yRXZlbnQoe1xuICAgICAgICAgICAgdHlwZTogJ29uRHJhZ1N0YXJ0JyxcbiAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc2V0QWN0aXZlU2Vuc29yKGFjdGl2ZVNlbnNvclJlZi5jdXJyZW50KTtcbiAgICAgICAgICBzZXRBY3RpdmF0b3JFdmVudChhY3RpdmF0b3JFdmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgb25Nb3ZlKGNvb3JkaW5hdGVzKSB7XG4gICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICB0eXBlOiBBY3Rpb24uRHJhZ01vdmUsXG4gICAgICAgICAgY29vcmRpbmF0ZXNcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICBvbkVuZDogY3JlYXRlSGFuZGxlcihBY3Rpb24uRHJhZ0VuZCksXG4gICAgICBvbkNhbmNlbDogY3JlYXRlSGFuZGxlcihBY3Rpb24uRHJhZ0NhbmNlbClcbiAgICB9KTtcbiAgICBhY3RpdmVTZW5zb3JSZWYuY3VycmVudCA9IHNlbnNvckluc3RhbmNlO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlSGFuZGxlcih0eXBlKSB7XG4gICAgICByZXR1cm4gYXN5bmMgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGFjdGl2ZSxcbiAgICAgICAgICBjb2xsaXNpb25zLFxuICAgICAgICAgIG92ZXIsXG4gICAgICAgICAgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGVcbiAgICAgICAgfSA9IHNlbnNvckNvbnRleHQuY3VycmVudDtcbiAgICAgICAgbGV0IGV2ZW50ID0gbnVsbDtcblxuICAgICAgICBpZiAoYWN0aXZlICYmIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlKSB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgY2FuY2VsRHJvcFxuICAgICAgICAgIH0gPSBsYXRlc3RQcm9wcy5jdXJyZW50O1xuICAgICAgICAgIGV2ZW50ID0ge1xuICAgICAgICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICAgICAgICBhY3RpdmU6IGFjdGl2ZSxcbiAgICAgICAgICAgIGNvbGxpc2lvbnMsXG4gICAgICAgICAgICBkZWx0YTogc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGUsXG4gICAgICAgICAgICBvdmVyXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmICh0eXBlID09PSBBY3Rpb24uRHJhZ0VuZCAmJiB0eXBlb2YgY2FuY2VsRHJvcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3Qgc2hvdWxkQ2FuY2VsID0gYXdhaXQgUHJvbWlzZS5yZXNvbHZlKGNhbmNlbERyb3AoZXZlbnQpKTtcblxuICAgICAgICAgICAgaWYgKHNob3VsZENhbmNlbCkge1xuICAgICAgICAgICAgICB0eXBlID0gQWN0aW9uLkRyYWdDYW5jZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWN0aXZlUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICB1bnN0YWJsZV9iYXRjaGVkVXBkYXRlcygoKSA9PiB7XG4gICAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNldFN0YXR1cyhTdGF0dXMuVW5pbml0aWFsaXplZCk7XG4gICAgICAgICAgc2V0T3ZlcihudWxsKTtcbiAgICAgICAgICBzZXRBY3RpdmVTZW5zb3IobnVsbCk7XG4gICAgICAgICAgc2V0QWN0aXZhdG9yRXZlbnQobnVsbCk7XG4gICAgICAgICAgYWN0aXZlU2Vuc29yUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IHR5cGUgPT09IEFjdGlvbi5EcmFnRW5kID8gJ29uRHJhZ0VuZCcgOiAnb25EcmFnQ2FuY2VsJztcblxuICAgICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IGxhdGVzdFByb3BzLmN1cnJlbnRbZXZlbnROYW1lXTtcbiAgICAgICAgICAgIGhhbmRsZXIgPT0gbnVsbCA/IHZvaWQgMCA6IGhhbmRsZXIoZXZlbnQpO1xuICAgICAgICAgICAgZGlzcGF0Y2hNb25pdG9yRXZlbnQoe1xuICAgICAgICAgICAgICB0eXBlOiBldmVudE5hbWUsXG4gICAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2RyYWdnYWJsZU5vZGVzXSk7XG4gIGNvbnN0IGJpbmRBY3RpdmF0b3JUb1NlbnNvckluc3RhbnRpYXRvciA9IHVzZUNhbGxiYWNrKChoYW5kbGVyLCBzZW5zb3IpID0+IHtcbiAgICByZXR1cm4gKGV2ZW50LCBhY3RpdmUpID0+IHtcbiAgICAgIGNvbnN0IG5hdGl2ZUV2ZW50ID0gZXZlbnQubmF0aXZlRXZlbnQ7XG4gICAgICBjb25zdCBhY3RpdmVEcmFnZ2FibGVOb2RlID0gZHJhZ2dhYmxlTm9kZXMuZ2V0KGFjdGl2ZSk7XG5cbiAgICAgIGlmICggLy8gQW5vdGhlciBzZW5zb3IgaXMgYWxyZWFkeSBpbnN0YW50aWF0aW5nXG4gICAgICBhY3RpdmVSZWYuY3VycmVudCAhPT0gbnVsbCB8fCAvLyBObyBhY3RpdmUgZHJhZ2dhYmxlXG4gICAgICAhYWN0aXZlRHJhZ2dhYmxlTm9kZSB8fCAvLyBFdmVudCBoYXMgYWxyZWFkeSBiZWVuIGNhcHR1cmVkXG4gICAgICBuYXRpdmVFdmVudC5kbmRLaXQgfHwgbmF0aXZlRXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFjdGl2YXRpb25Db250ZXh0ID0ge1xuICAgICAgICBhY3RpdmU6IGFjdGl2ZURyYWdnYWJsZU5vZGVcbiAgICAgIH07XG4gICAgICBjb25zdCBzaG91bGRBY3RpdmF0ZSA9IGhhbmRsZXIoZXZlbnQsIHNlbnNvci5vcHRpb25zLCBhY3RpdmF0aW9uQ29udGV4dCk7XG5cbiAgICAgIGlmIChzaG91bGRBY3RpdmF0ZSA9PT0gdHJ1ZSkge1xuICAgICAgICBuYXRpdmVFdmVudC5kbmRLaXQgPSB7XG4gICAgICAgICAgY2FwdHVyZWRCeTogc2Vuc29yLnNlbnNvclxuICAgICAgICB9O1xuICAgICAgICBhY3RpdmVSZWYuY3VycmVudCA9IGFjdGl2ZTtcbiAgICAgICAgaW5zdGFudGlhdGVTZW5zb3IoZXZlbnQsIHNlbnNvcik7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW2RyYWdnYWJsZU5vZGVzLCBpbnN0YW50aWF0ZVNlbnNvcl0pO1xuICBjb25zdCBhY3RpdmF0b3JzID0gdXNlQ29tYmluZUFjdGl2YXRvcnMoc2Vuc29ycywgYmluZEFjdGl2YXRvclRvU2Vuc29ySW5zdGFudGlhdG9yKTtcbiAgdXNlU2Vuc29yU2V0dXAoc2Vuc29ycyk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChhY3RpdmVOb2RlUmVjdCAmJiBzdGF0dXMgPT09IFN0YXR1cy5Jbml0aWFsaXppbmcpIHtcbiAgICAgIHNldFN0YXR1cyhTdGF0dXMuSW5pdGlhbGl6ZWQpO1xuICAgIH1cbiAgfSwgW2FjdGl2ZU5vZGVSZWN0LCBzdGF0dXNdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBvbkRyYWdNb3ZlXG4gICAgfSA9IGxhdGVzdFByb3BzLmN1cnJlbnQ7XG4gICAgY29uc3Qge1xuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgICBjb2xsaXNpb25zLFxuICAgICAgb3ZlclxuICAgIH0gPSBzZW5zb3JDb250ZXh0LmN1cnJlbnQ7XG5cbiAgICBpZiAoIWFjdGl2ZSB8fCAhYWN0aXZhdG9yRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBldmVudCA9IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgY29sbGlzaW9ucyxcbiAgICAgIGRlbHRhOiB7XG4gICAgICAgIHg6IHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlLngsXG4gICAgICAgIHk6IHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlLnlcbiAgICAgIH0sXG4gICAgICBvdmVyXG4gICAgfTtcbiAgICB1bnN0YWJsZV9iYXRjaGVkVXBkYXRlcygoKSA9PiB7XG4gICAgICBvbkRyYWdNb3ZlID09IG51bGwgPyB2b2lkIDAgOiBvbkRyYWdNb3ZlKGV2ZW50KTtcbiAgICAgIGRpc3BhdGNoTW9uaXRvckV2ZW50KHtcbiAgICAgICAgdHlwZTogJ29uRHJhZ01vdmUnLFxuICAgICAgICBldmVudFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW3Njcm9sbEFkanVzdGVkVHJhbnNsYXRlLngsIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlLnldKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGNvbGxpc2lvbnMsXG4gICAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgICAgc2Nyb2xsQWRqdXN0ZWRUcmFuc2xhdGVcbiAgICB9ID0gc2Vuc29yQ29udGV4dC5jdXJyZW50O1xuXG4gICAgaWYgKCFhY3RpdmUgfHwgYWN0aXZlUmVmLmN1cnJlbnQgPT0gbnVsbCB8fCAhYWN0aXZhdG9yRXZlbnQgfHwgIXNjcm9sbEFkanVzdGVkVHJhbnNsYXRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgb25EcmFnT3ZlclxuICAgIH0gPSBsYXRlc3RQcm9wcy5jdXJyZW50O1xuICAgIGNvbnN0IG92ZXJDb250YWluZXIgPSBkcm9wcGFibGVDb250YWluZXJzLmdldChvdmVySWQpO1xuICAgIGNvbnN0IG92ZXIgPSBvdmVyQ29udGFpbmVyICYmIG92ZXJDb250YWluZXIucmVjdC5jdXJyZW50ID8ge1xuICAgICAgaWQ6IG92ZXJDb250YWluZXIuaWQsXG4gICAgICByZWN0OiBvdmVyQ29udGFpbmVyLnJlY3QuY3VycmVudCxcbiAgICAgIGRhdGE6IG92ZXJDb250YWluZXIuZGF0YSxcbiAgICAgIGRpc2FibGVkOiBvdmVyQ29udGFpbmVyLmRpc2FibGVkXG4gICAgfSA6IG51bGw7XG4gICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICBhY3RpdmUsXG4gICAgICBhY3RpdmF0b3JFdmVudCxcbiAgICAgIGNvbGxpc2lvbnMsXG4gICAgICBkZWx0YToge1xuICAgICAgICB4OiBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZS54LFxuICAgICAgICB5OiBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZS55XG4gICAgICB9LFxuICAgICAgb3ZlclxuICAgIH07XG4gICAgdW5zdGFibGVfYmF0Y2hlZFVwZGF0ZXMoKCkgPT4ge1xuICAgICAgc2V0T3ZlcihvdmVyKTtcbiAgICAgIG9uRHJhZ092ZXIgPT0gbnVsbCA/IHZvaWQgMCA6IG9uRHJhZ092ZXIoZXZlbnQpO1xuICAgICAgZGlzcGF0Y2hNb25pdG9yRXZlbnQoe1xuICAgICAgICB0eXBlOiAnb25EcmFnT3ZlcicsXG4gICAgICAgIGV2ZW50XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbb3ZlcklkXSk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIHNlbnNvckNvbnRleHQuY3VycmVudCA9IHtcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgYWN0aXZlLFxuICAgICAgYWN0aXZlTm9kZSxcbiAgICAgIGNvbGxpc2lvblJlY3QsXG4gICAgICBjb2xsaXNpb25zLFxuICAgICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICAgIGRyYWdnaW5nTm9kZSxcbiAgICAgIGRyYWdnaW5nTm9kZVJlY3QsXG4gICAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgICAgb3ZlcixcbiAgICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgICBzY3JvbGxBZGp1c3RlZFRyYW5zbGF0ZVxuICAgIH07XG4gICAgYWN0aXZlUmVjdHMuY3VycmVudCA9IHtcbiAgICAgIGluaXRpYWw6IGRyYWdnaW5nTm9kZVJlY3QsXG4gICAgICB0cmFuc2xhdGVkOiBjb2xsaXNpb25SZWN0XG4gICAgfTtcbiAgfSwgW2FjdGl2ZSwgYWN0aXZlTm9kZSwgY29sbGlzaW9ucywgY29sbGlzaW9uUmVjdCwgZHJhZ2dhYmxlTm9kZXMsIGRyYWdnaW5nTm9kZSwgZHJhZ2dpbmdOb2RlUmVjdCwgZHJvcHBhYmxlUmVjdHMsIGRyb3BwYWJsZUNvbnRhaW5lcnMsIG92ZXIsIHNjcm9sbGFibGVBbmNlc3RvcnMsIHNjcm9sbEFkanVzdGVkVHJhbnNsYXRlXSk7XG4gIHVzZUF1dG9TY3JvbGxlcih7IC4uLmF1dG9TY3JvbGxPcHRpb25zLFxuICAgIGRlbHRhOiB0cmFuc2xhdGUsXG4gICAgZHJhZ2dpbmdSZWN0OiBjb2xsaXNpb25SZWN0LFxuICAgIHBvaW50ZXJDb29yZGluYXRlcyxcbiAgICBzY3JvbGxhYmxlQW5jZXN0b3JzLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzXG4gIH0pO1xuICBjb25zdCBwdWJsaWNDb250ZXh0ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2ZU5vZGUsXG4gICAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgY29sbGlzaW9ucyxcbiAgICAgIGNvbnRhaW5lck5vZGVSZWN0LFxuICAgICAgZHJhZ092ZXJsYXksXG4gICAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgICBkcm9wcGFibGVSZWN0cyxcbiAgICAgIG92ZXIsXG4gICAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgICBzY3JvbGxhYmxlQW5jZXN0b3JSZWN0cyxcbiAgICAgIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24sXG4gICAgICBtZWFzdXJpbmdTY2hlZHVsZWQsXG4gICAgICB3aW5kb3dSZWN0XG4gICAgfTtcbiAgICByZXR1cm4gY29udGV4dDtcbiAgfSwgW2FjdGl2ZSwgYWN0aXZlTm9kZSwgYWN0aXZlTm9kZVJlY3QsIGFjdGl2YXRvckV2ZW50LCBjb2xsaXNpb25zLCBjb250YWluZXJOb2RlUmVjdCwgZHJhZ092ZXJsYXksIGRyYWdnYWJsZU5vZGVzLCBkcm9wcGFibGVDb250YWluZXJzLCBkcm9wcGFibGVSZWN0cywgb3ZlciwgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnMsIHNjcm9sbGFibGVBbmNlc3RvcnMsIHNjcm9sbGFibGVBbmNlc3RvclJlY3RzLCBtZWFzdXJpbmdDb25maWd1cmF0aW9uLCBtZWFzdXJpbmdTY2hlZHVsZWQsIHdpbmRvd1JlY3RdKTtcbiAgY29uc3QgaW50ZXJuYWxDb250ZXh0ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgIGFjdGl2YXRvckV2ZW50LFxuICAgICAgYWN0aXZhdG9ycyxcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgICAgYXJpYURlc2NyaWJlZEJ5SWQ6IHtcbiAgICAgICAgZHJhZ2dhYmxlOiBkcmFnZ2FibGVEZXNjcmliZWRCeUlkXG4gICAgICB9LFxuICAgICAgZGlzcGF0Y2gsXG4gICAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICAgIG92ZXIsXG4gICAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyc1xuICAgIH07XG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH0sIFthY3RpdmF0b3JFdmVudCwgYWN0aXZhdG9ycywgYWN0aXZlLCBhY3RpdmVOb2RlUmVjdCwgZGlzcGF0Y2gsIGRyYWdnYWJsZURlc2NyaWJlZEJ5SWQsIGRyYWdnYWJsZU5vZGVzLCBvdmVyLCBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyc10pO1xuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChEbmRNb25pdG9yQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiByZWdpc3Rlck1vbml0b3JMaXN0ZW5lclxuICB9LCBSZWFjdC5jcmVhdGVFbGVtZW50KEludGVybmFsQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBpbnRlcm5hbENvbnRleHRcbiAgfSwgUmVhY3QuY3JlYXRlRWxlbWVudChQdWJsaWNDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHB1YmxpY0NvbnRleHRcbiAgfSwgUmVhY3QuY3JlYXRlRWxlbWVudChBY3RpdmVEcmFnZ2FibGVDb250ZXh0LlByb3ZpZGVyLCB7XG4gICAgdmFsdWU6IHRyYW5zZm9ybVxuICB9LCBjaGlsZHJlbikpLCBSZWFjdC5jcmVhdGVFbGVtZW50KFJlc3RvcmVGb2N1cywge1xuICAgIGRpc2FibGVkOiAoYWNjZXNzaWJpbGl0eSA9PSBudWxsID8gdm9pZCAwIDogYWNjZXNzaWJpbGl0eS5yZXN0b3JlRm9jdXMpID09PSBmYWxzZVxuICB9KSksIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQWNjZXNzaWJpbGl0eSwgeyAuLi5hY2Nlc3NpYmlsaXR5LFxuICAgIGhpZGRlblRleHREZXNjcmliZWRCeUlkOiBkcmFnZ2FibGVEZXNjcmliZWRCeUlkXG4gIH0pKTtcblxuICBmdW5jdGlvbiBnZXRBdXRvU2Nyb2xsZXJPcHRpb25zKCkge1xuICAgIGNvbnN0IGFjdGl2ZVNlbnNvckRpc2FibGVzQXV0b3Njcm9sbCA9IChhY3RpdmVTZW5zb3IgPT0gbnVsbCA/IHZvaWQgMCA6IGFjdGl2ZVNlbnNvci5hdXRvU2Nyb2xsRW5hYmxlZCkgPT09IGZhbHNlO1xuICAgIGNvbnN0IGF1dG9TY3JvbGxHbG9iYWxseURpc2FibGVkID0gdHlwZW9mIGF1dG9TY3JvbGwgPT09ICdvYmplY3QnID8gYXV0b1Njcm9sbC5lbmFibGVkID09PSBmYWxzZSA6IGF1dG9TY3JvbGwgPT09IGZhbHNlO1xuICAgIGNvbnN0IGVuYWJsZWQgPSBpc0luaXRpYWxpemVkICYmICFhY3RpdmVTZW5zb3JEaXNhYmxlc0F1dG9zY3JvbGwgJiYgIWF1dG9TY3JvbGxHbG9iYWxseURpc2FibGVkO1xuXG4gICAgaWYgKHR5cGVvZiBhdXRvU2Nyb2xsID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIHsgLi4uYXV0b1Njcm9sbCxcbiAgICAgICAgZW5hYmxlZFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZW5hYmxlZFxuICAgIH07XG4gIH1cbn0pO1xuXG5jb25zdCBOdWxsQ29udGV4dCA9IC8qI19fUFVSRV9fKi9jcmVhdGVDb250ZXh0KG51bGwpO1xuY29uc3QgZGVmYXVsdFJvbGUgPSAnYnV0dG9uJztcbmNvbnN0IElEX1BSRUZJWCA9ICdEcmFnZ2FibGUnO1xuZnVuY3Rpb24gdXNlRHJhZ2dhYmxlKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBpZCxcbiAgICBkYXRhLFxuICAgIGRpc2FibGVkID0gZmFsc2UsXG4gICAgYXR0cmlidXRlc1xuICB9ID0gX3JlZjtcbiAgY29uc3Qga2V5ID0gdXNlVW5pcXVlSWQoSURfUFJFRklYKTtcbiAgY29uc3Qge1xuICAgIGFjdGl2YXRvcnMsXG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWN0aXZlLFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGFyaWFEZXNjcmliZWRCeUlkLFxuICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgIG92ZXJcbiAgfSA9IHVzZUNvbnRleHQoSW50ZXJuYWxDb250ZXh0KTtcbiAgY29uc3Qge1xuICAgIHJvbGUgPSBkZWZhdWx0Um9sZSxcbiAgICByb2xlRGVzY3JpcHRpb24gPSAnZHJhZ2dhYmxlJyxcbiAgICB0YWJJbmRleCA9IDBcbiAgfSA9IGF0dHJpYnV0ZXMgIT0gbnVsbCA/IGF0dHJpYnV0ZXMgOiB7fTtcbiAgY29uc3QgaXNEcmFnZ2luZyA9IChhY3RpdmUgPT0gbnVsbCA/IHZvaWQgMCA6IGFjdGl2ZS5pZCkgPT09IGlkO1xuICBjb25zdCB0cmFuc2Zvcm0gPSB1c2VDb250ZXh0KGlzRHJhZ2dpbmcgPyBBY3RpdmVEcmFnZ2FibGVDb250ZXh0IDogTnVsbENvbnRleHQpO1xuICBjb25zdCBbbm9kZSwgc2V0Tm9kZVJlZl0gPSB1c2VOb2RlUmVmKCk7XG4gIGNvbnN0IFthY3RpdmF0b3JOb2RlLCBzZXRBY3RpdmF0b3JOb2RlUmVmXSA9IHVzZU5vZGVSZWYoKTtcbiAgY29uc3QgbGlzdGVuZXJzID0gdXNlU3ludGhldGljTGlzdGVuZXJzKGFjdGl2YXRvcnMsIGlkKTtcbiAgY29uc3QgZGF0YVJlZiA9IHVzZUxhdGVzdFZhbHVlKGRhdGEpO1xuICB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBkcmFnZ2FibGVOb2Rlcy5zZXQoaWQsIHtcbiAgICAgIGlkLFxuICAgICAga2V5LFxuICAgICAgbm9kZSxcbiAgICAgIGFjdGl2YXRvck5vZGUsXG4gICAgICBkYXRhOiBkYXRhUmVmXG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBkcmFnZ2FibGVOb2Rlcy5nZXQoaWQpO1xuXG4gICAgICBpZiAobm9kZSAmJiBub2RlLmtleSA9PT0ga2V5KSB7XG4gICAgICAgIGRyYWdnYWJsZU5vZGVzLmRlbGV0ZShpZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbZHJhZ2dhYmxlTm9kZXMsIGlkXSk7XG4gIGNvbnN0IG1lbW9pemVkQXR0cmlidXRlcyA9IHVzZU1lbW8oKCkgPT4gKHtcbiAgICByb2xlLFxuICAgIHRhYkluZGV4LFxuICAgICdhcmlhLWRpc2FibGVkJzogZGlzYWJsZWQsXG4gICAgJ2FyaWEtcHJlc3NlZCc6IGlzRHJhZ2dpbmcgJiYgcm9sZSA9PT0gZGVmYXVsdFJvbGUgPyB0cnVlIDogdW5kZWZpbmVkLFxuICAgICdhcmlhLXJvbGVkZXNjcmlwdGlvbic6IHJvbGVEZXNjcmlwdGlvbixcbiAgICAnYXJpYS1kZXNjcmliZWRieSc6IGFyaWFEZXNjcmliZWRCeUlkLmRyYWdnYWJsZVxuICB9KSwgW2Rpc2FibGVkLCByb2xlLCB0YWJJbmRleCwgaXNEcmFnZ2luZywgcm9sZURlc2NyaXB0aW9uLCBhcmlhRGVzY3JpYmVkQnlJZC5kcmFnZ2FibGVdKTtcbiAgcmV0dXJuIHtcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgYXR0cmlidXRlczogbWVtb2l6ZWRBdHRyaWJ1dGVzLFxuICAgIGlzRHJhZ2dpbmcsXG4gICAgbGlzdGVuZXJzOiBkaXNhYmxlZCA/IHVuZGVmaW5lZCA6IGxpc3RlbmVycyxcbiAgICBub2RlLFxuICAgIG92ZXIsXG4gICAgc2V0Tm9kZVJlZixcbiAgICBzZXRBY3RpdmF0b3JOb2RlUmVmLFxuICAgIHRyYW5zZm9ybVxuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VEbmRDb250ZXh0KCkge1xuICByZXR1cm4gdXNlQ29udGV4dChQdWJsaWNDb250ZXh0KTtcbn1cblxuY29uc3QgSURfUFJFRklYJDEgPSAnRHJvcHBhYmxlJztcbmNvbnN0IGRlZmF1bHRSZXNpemVPYnNlcnZlckNvbmZpZyA9IHtcbiAgdGltZW91dDogMjVcbn07XG5mdW5jdGlvbiB1c2VEcm9wcGFibGUoX3JlZikge1xuICBsZXQge1xuICAgIGRhdGEsXG4gICAgZGlzYWJsZWQgPSBmYWxzZSxcbiAgICBpZCxcbiAgICByZXNpemVPYnNlcnZlckNvbmZpZ1xuICB9ID0gX3JlZjtcbiAgY29uc3Qga2V5ID0gdXNlVW5pcXVlSWQoSURfUFJFRklYJDEpO1xuICBjb25zdCB7XG4gICAgYWN0aXZlLFxuICAgIGRpc3BhdGNoLFxuICAgIG92ZXIsXG4gICAgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnNcbiAgfSA9IHVzZUNvbnRleHQoSW50ZXJuYWxDb250ZXh0KTtcbiAgY29uc3QgcHJldmlvdXMgPSB1c2VSZWYoe1xuICAgIGRpc2FibGVkXG4gIH0pO1xuICBjb25zdCByZXNpemVPYnNlcnZlckNvbm5lY3RlZCA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IHJlY3QgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IGNhbGxiYWNrSWQgPSB1c2VSZWYobnVsbCk7XG4gIGNvbnN0IHtcbiAgICBkaXNhYmxlZDogcmVzaXplT2JzZXJ2ZXJEaXNhYmxlZCxcbiAgICB1cGRhdGVNZWFzdXJlbWVudHNGb3IsXG4gICAgdGltZW91dDogcmVzaXplT2JzZXJ2ZXJUaW1lb3V0XG4gIH0gPSB7IC4uLmRlZmF1bHRSZXNpemVPYnNlcnZlckNvbmZpZyxcbiAgICAuLi5yZXNpemVPYnNlcnZlckNvbmZpZ1xuICB9O1xuICBjb25zdCBpZHMgPSB1c2VMYXRlc3RWYWx1ZSh1cGRhdGVNZWFzdXJlbWVudHNGb3IgIT0gbnVsbCA/IHVwZGF0ZU1lYXN1cmVtZW50c0ZvciA6IGlkKTtcbiAgY29uc3QgaGFuZGxlUmVzaXplID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmICghcmVzaXplT2JzZXJ2ZXJDb25uZWN0ZWQuY3VycmVudCkge1xuICAgICAgLy8gUmVzaXplT2JzZXJ2ZXIgaW52b2tlcyB0aGUgYGhhbmRsZVJlc2l6ZWAgY2FsbGJhY2sgYXMgc29vbiBhcyBgb2JzZXJ2ZWAgaXMgY2FsbGVkLFxuICAgICAgLy8gYXNzdW1pbmcgdGhlIGVsZW1lbnQgaXMgcmVuZGVyZWQgYW5kIGRpc3BsYXllZC5cbiAgICAgIHJlc2l6ZU9ic2VydmVyQ29ubmVjdGVkLmN1cnJlbnQgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChjYWxsYmFja0lkLmN1cnJlbnQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGNhbGxiYWNrSWQuY3VycmVudCk7XG4gICAgfVxuXG4gICAgY2FsbGJhY2tJZC5jdXJyZW50ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVycyhBcnJheS5pc0FycmF5KGlkcy5jdXJyZW50KSA/IGlkcy5jdXJyZW50IDogW2lkcy5jdXJyZW50XSk7XG4gICAgICBjYWxsYmFja0lkLmN1cnJlbnQgPSBudWxsO1xuICAgIH0sIHJlc2l6ZU9ic2VydmVyVGltZW91dCk7XG4gIH0sIC8vZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbcmVzaXplT2JzZXJ2ZXJUaW1lb3V0XSk7XG4gIGNvbnN0IHJlc2l6ZU9ic2VydmVyID0gdXNlUmVzaXplT2JzZXJ2ZXIoe1xuICAgIGNhbGxiYWNrOiBoYW5kbGVSZXNpemUsXG4gICAgZGlzYWJsZWQ6IHJlc2l6ZU9ic2VydmVyRGlzYWJsZWQgfHwgIWFjdGl2ZVxuICB9KTtcbiAgY29uc3QgaGFuZGxlTm9kZUNoYW5nZSA9IHVzZUNhbGxiYWNrKChuZXdFbGVtZW50LCBwcmV2aW91c0VsZW1lbnQpID0+IHtcbiAgICBpZiAoIXJlc2l6ZU9ic2VydmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHByZXZpb3VzRWxlbWVudCkge1xuICAgICAgcmVzaXplT2JzZXJ2ZXIudW5vYnNlcnZlKHByZXZpb3VzRWxlbWVudCk7XG4gICAgICByZXNpemVPYnNlcnZlckNvbm5lY3RlZC5jdXJyZW50ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG5ld0VsZW1lbnQpIHtcbiAgICAgIHJlc2l6ZU9ic2VydmVyLm9ic2VydmUobmV3RWxlbWVudCk7XG4gICAgfVxuICB9LCBbcmVzaXplT2JzZXJ2ZXJdKTtcbiAgY29uc3QgW25vZGVSZWYsIHNldE5vZGVSZWZdID0gdXNlTm9kZVJlZihoYW5kbGVOb2RlQ2hhbmdlKTtcbiAgY29uc3QgZGF0YVJlZiA9IHVzZUxhdGVzdFZhbHVlKGRhdGEpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcmVzaXplT2JzZXJ2ZXIgfHwgIW5vZGVSZWYuY3VycmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlc2l6ZU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICByZXNpemVPYnNlcnZlckNvbm5lY3RlZC5jdXJyZW50ID0gZmFsc2U7XG4gICAgcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZShub2RlUmVmLmN1cnJlbnQpO1xuICB9LCBbbm9kZVJlZiwgcmVzaXplT2JzZXJ2ZXJdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBkaXNwYXRjaCh7XG4gICAgICB0eXBlOiBBY3Rpb24uUmVnaXN0ZXJEcm9wcGFibGUsXG4gICAgICBlbGVtZW50OiB7XG4gICAgICAgIGlkLFxuICAgICAgICBrZXksXG4gICAgICAgIGRpc2FibGVkLFxuICAgICAgICBub2RlOiBub2RlUmVmLFxuICAgICAgICByZWN0LFxuICAgICAgICBkYXRhOiBkYXRhUmVmXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuICgpID0+IGRpc3BhdGNoKHtcbiAgICAgIHR5cGU6IEFjdGlvbi5VbnJlZ2lzdGVyRHJvcHBhYmxlLFxuICAgICAga2V5LFxuICAgICAgaWRcbiAgICB9KTtcbiAgfSwgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICBbaWRdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQgIT09IHByZXZpb3VzLmN1cnJlbnQuZGlzYWJsZWQpIHtcbiAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgdHlwZTogQWN0aW9uLlNldERyb3BwYWJsZURpc2FibGVkLFxuICAgICAgICBpZCxcbiAgICAgICAga2V5LFxuICAgICAgICBkaXNhYmxlZFxuICAgICAgfSk7XG4gICAgICBwcmV2aW91cy5jdXJyZW50LmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgfVxuICB9LCBbaWQsIGtleSwgZGlzYWJsZWQsIGRpc3BhdGNoXSk7XG4gIHJldHVybiB7XG4gICAgYWN0aXZlLFxuICAgIHJlY3QsXG4gICAgaXNPdmVyOiAob3ZlciA9PSBudWxsID8gdm9pZCAwIDogb3Zlci5pZCkgPT09IGlkLFxuICAgIG5vZGU6IG5vZGVSZWYsXG4gICAgb3ZlcixcbiAgICBzZXROb2RlUmVmXG4gIH07XG59XG5cbmZ1bmN0aW9uIEFuaW1hdGlvbk1hbmFnZXIoX3JlZikge1xuICBsZXQge1xuICAgIGFuaW1hdGlvbixcbiAgICBjaGlsZHJlblxuICB9ID0gX3JlZjtcbiAgY29uc3QgW2Nsb25lZENoaWxkcmVuLCBzZXRDbG9uZWRDaGlsZHJlbl0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2VsZW1lbnQsIHNldEVsZW1lbnRdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IHByZXZpb3VzQ2hpbGRyZW4gPSB1c2VQcmV2aW91cyhjaGlsZHJlbik7XG5cbiAgaWYgKCFjaGlsZHJlbiAmJiAhY2xvbmVkQ2hpbGRyZW4gJiYgcHJldmlvdXNDaGlsZHJlbikge1xuICAgIHNldENsb25lZENoaWxkcmVuKHByZXZpb3VzQ2hpbGRyZW4pO1xuICB9XG5cbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qga2V5ID0gY2xvbmVkQ2hpbGRyZW4gPT0gbnVsbCA/IHZvaWQgMCA6IGNsb25lZENoaWxkcmVuLmtleTtcbiAgICBjb25zdCBpZCA9IGNsb25lZENoaWxkcmVuID09IG51bGwgPyB2b2lkIDAgOiBjbG9uZWRDaGlsZHJlbi5wcm9wcy5pZDtcblxuICAgIGlmIChrZXkgPT0gbnVsbCB8fCBpZCA9PSBudWxsKSB7XG4gICAgICBzZXRDbG9uZWRDaGlsZHJlbihudWxsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBQcm9taXNlLnJlc29sdmUoYW5pbWF0aW9uKGlkLCBlbGVtZW50KSkudGhlbigoKSA9PiB7XG4gICAgICBzZXRDbG9uZWRDaGlsZHJlbihudWxsKTtcbiAgICB9KTtcbiAgfSwgW2FuaW1hdGlvbiwgY2xvbmVkQ2hpbGRyZW4sIGVsZW1lbnRdKTtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoUmVhY3QuRnJhZ21lbnQsIG51bGwsIGNoaWxkcmVuLCBjbG9uZWRDaGlsZHJlbiA/IGNsb25lRWxlbWVudChjbG9uZWRDaGlsZHJlbiwge1xuICAgIHJlZjogc2V0RWxlbWVudFxuICB9KSA6IG51bGwpO1xufVxuXG5jb25zdCBkZWZhdWx0VHJhbnNmb3JtID0ge1xuICB4OiAwLFxuICB5OiAwLFxuICBzY2FsZVg6IDEsXG4gIHNjYWxlWTogMVxufTtcbmZ1bmN0aW9uIE51bGxpZmllZENvbnRleHRQcm92aWRlcihfcmVmKSB7XG4gIGxldCB7XG4gICAgY2hpbGRyZW5cbiAgfSA9IF9yZWY7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEludGVybmFsQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBkZWZhdWx0SW50ZXJuYWxDb250ZXh0XG4gIH0sIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQWN0aXZlRHJhZ2dhYmxlQ29udGV4dC5Qcm92aWRlciwge1xuICAgIHZhbHVlOiBkZWZhdWx0VHJhbnNmb3JtXG4gIH0sIGNoaWxkcmVuKSk7XG59XG5cbmNvbnN0IGJhc2VTdHlsZXMgPSB7XG4gIHBvc2l0aW9uOiAnZml4ZWQnLFxuICB0b3VjaEFjdGlvbjogJ25vbmUnXG59O1xuXG5jb25zdCBkZWZhdWx0VHJhbnNpdGlvbiA9IGFjdGl2YXRvckV2ZW50ID0+IHtcbiAgY29uc3QgaXNLZXlib2FyZEFjdGl2YXRvciA9IGlzS2V5Ym9hcmRFdmVudChhY3RpdmF0b3JFdmVudCk7XG4gIHJldHVybiBpc0tleWJvYXJkQWN0aXZhdG9yID8gJ3RyYW5zZm9ybSAyNTBtcyBlYXNlJyA6IHVuZGVmaW5lZDtcbn07XG5cbmNvbnN0IFBvc2l0aW9uZWRPdmVybGF5ID0gLyojX19QVVJFX18qL2ZvcndhcmRSZWYoKF9yZWYsIHJlZikgPT4ge1xuICBsZXQge1xuICAgIGFzLFxuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFkanVzdFNjYWxlLFxuICAgIGNoaWxkcmVuLFxuICAgIGNsYXNzTmFtZSxcbiAgICByZWN0LFxuICAgIHN0eWxlLFxuICAgIHRyYW5zZm9ybSxcbiAgICB0cmFuc2l0aW9uID0gZGVmYXVsdFRyYW5zaXRpb25cbiAgfSA9IF9yZWY7XG5cbiAgaWYgKCFyZWN0KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBzY2FsZUFkanVzdGVkVHJhbnNmb3JtID0gYWRqdXN0U2NhbGUgPyB0cmFuc2Zvcm0gOiB7IC4uLnRyYW5zZm9ybSxcbiAgICBzY2FsZVg6IDEsXG4gICAgc2NhbGVZOiAxXG4gIH07XG4gIGNvbnN0IHN0eWxlcyA9IHsgLi4uYmFzZVN0eWxlcyxcbiAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0LFxuICAgIHRvcDogcmVjdC50b3AsXG4gICAgbGVmdDogcmVjdC5sZWZ0LFxuICAgIHRyYW5zZm9ybTogQ1NTLlRyYW5zZm9ybS50b1N0cmluZyhzY2FsZUFkanVzdGVkVHJhbnNmb3JtKSxcbiAgICB0cmFuc2Zvcm1PcmlnaW46IGFkanVzdFNjYWxlICYmIGFjdGl2YXRvckV2ZW50ID8gZ2V0UmVsYXRpdmVUcmFuc2Zvcm1PcmlnaW4oYWN0aXZhdG9yRXZlbnQsIHJlY3QpIDogdW5kZWZpbmVkLFxuICAgIHRyYW5zaXRpb246IHR5cGVvZiB0cmFuc2l0aW9uID09PSAnZnVuY3Rpb24nID8gdHJhbnNpdGlvbihhY3RpdmF0b3JFdmVudCkgOiB0cmFuc2l0aW9uLFxuICAgIC4uLnN0eWxlXG4gIH07XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KGFzLCB7XG4gICAgY2xhc3NOYW1lLFxuICAgIHN0eWxlOiBzdHlsZXMsXG4gICAgcmVmXG4gIH0sIGNoaWxkcmVuKTtcbn0pO1xuXG5jb25zdCBkZWZhdWx0RHJvcEFuaW1hdGlvblNpZGVFZmZlY3RzID0gb3B0aW9ucyA9PiBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBhY3RpdmUsXG4gICAgZHJhZ092ZXJsYXlcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IG9yaWdpbmFsU3R5bGVzID0ge307XG4gIGNvbnN0IHtcbiAgICBzdHlsZXMsXG4gICAgY2xhc3NOYW1lXG4gIH0gPSBvcHRpb25zO1xuXG4gIGlmIChzdHlsZXMgIT0gbnVsbCAmJiBzdHlsZXMuYWN0aXZlKSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc3R5bGVzLmFjdGl2ZSkpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBvcmlnaW5hbFN0eWxlc1trZXldID0gYWN0aXZlLm5vZGUuc3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShrZXkpO1xuICAgICAgYWN0aXZlLm5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0eWxlcyAhPSBudWxsICYmIHN0eWxlcy5kcmFnT3ZlcmxheSkge1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHN0eWxlcy5kcmFnT3ZlcmxheSkpIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBkcmFnT3ZlcmxheS5ub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjbGFzc05hbWUgIT0gbnVsbCAmJiBjbGFzc05hbWUuYWN0aXZlKSB7XG4gICAgYWN0aXZlLm5vZGUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUuYWN0aXZlKTtcbiAgfVxuXG4gIGlmIChjbGFzc05hbWUgIT0gbnVsbCAmJiBjbGFzc05hbWUuZHJhZ092ZXJsYXkpIHtcbiAgICBkcmFnT3ZlcmxheS5ub2RlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lLmRyYWdPdmVybGF5KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9yaWdpbmFsU3R5bGVzKSkge1xuICAgICAgYWN0aXZlLm5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKGNsYXNzTmFtZSAhPSBudWxsICYmIGNsYXNzTmFtZS5hY3RpdmUpIHtcbiAgICAgIGFjdGl2ZS5ub2RlLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lLmFjdGl2ZSk7XG4gICAgfVxuICB9O1xufTtcblxuY29uc3QgZGVmYXVsdEtleWZyYW1lUmVzb2x2ZXIgPSBfcmVmMiA9PiB7XG4gIGxldCB7XG4gICAgdHJhbnNmb3JtOiB7XG4gICAgICBpbml0aWFsLFxuICAgICAgZmluYWxcbiAgICB9XG4gIH0gPSBfcmVmMjtcbiAgcmV0dXJuIFt7XG4gICAgdHJhbnNmb3JtOiBDU1MuVHJhbnNmb3JtLnRvU3RyaW5nKGluaXRpYWwpXG4gIH0sIHtcbiAgICB0cmFuc2Zvcm06IENTUy5UcmFuc2Zvcm0udG9TdHJpbmcoZmluYWwpXG4gIH1dO1xufTtcblxuY29uc3QgZGVmYXVsdERyb3BBbmltYXRpb25Db25maWd1cmF0aW9uID0ge1xuICBkdXJhdGlvbjogMjUwLFxuICBlYXNpbmc6ICdlYXNlJyxcbiAga2V5ZnJhbWVzOiBkZWZhdWx0S2V5ZnJhbWVSZXNvbHZlcixcbiAgc2lkZUVmZmVjdHM6IC8qI19fUFVSRV9fKi9kZWZhdWx0RHJvcEFuaW1hdGlvblNpZGVFZmZlY3RzKHtcbiAgICBzdHlsZXM6IHtcbiAgICAgIGFjdGl2ZToge1xuICAgICAgICBvcGFjaXR5OiAnMCdcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59O1xuZnVuY3Rpb24gdXNlRHJvcEFuaW1hdGlvbihfcmVmMykge1xuICBsZXQge1xuICAgIGNvbmZpZyxcbiAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb25cbiAgfSA9IF9yZWYzO1xuICByZXR1cm4gdXNlRXZlbnQoKGlkLCBub2RlKSA9PiB7XG4gICAgaWYgKGNvbmZpZyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZURyYWdnYWJsZSA9IGRyYWdnYWJsZU5vZGVzLmdldChpZCk7XG5cbiAgICBpZiAoIWFjdGl2ZURyYWdnYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZU5vZGUgPSBhY3RpdmVEcmFnZ2FibGUubm9kZS5jdXJyZW50O1xuXG4gICAgaWYgKCFhY3RpdmVOb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbWVhc3VyYWJsZU5vZGUgPSBnZXRNZWFzdXJhYmxlTm9kZShub2RlKTtcblxuICAgIGlmICghbWVhc3VyYWJsZU5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICB0cmFuc2Zvcm1cbiAgICB9ID0gZ2V0V2luZG93KG5vZGUpLmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgY29uc3QgcGFyc2VkVHJhbnNmb3JtID0gcGFyc2VUcmFuc2Zvcm0odHJhbnNmb3JtKTtcblxuICAgIGlmICghcGFyc2VkVHJhbnNmb3JtKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0aW9uID0gdHlwZW9mIGNvbmZpZyA9PT0gJ2Z1bmN0aW9uJyA/IGNvbmZpZyA6IGNyZWF0ZURlZmF1bHREcm9wQW5pbWF0aW9uKGNvbmZpZyk7XG4gICAgc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChhY3RpdmVOb2RlLCBtZWFzdXJpbmdDb25maWd1cmF0aW9uLmRyYWdnYWJsZS5tZWFzdXJlKTtcbiAgICByZXR1cm4gYW5pbWF0aW9uKHtcbiAgICAgIGFjdGl2ZToge1xuICAgICAgICBpZCxcbiAgICAgICAgZGF0YTogYWN0aXZlRHJhZ2dhYmxlLmRhdGEsXG4gICAgICAgIG5vZGU6IGFjdGl2ZU5vZGUsXG4gICAgICAgIHJlY3Q6IG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ2dhYmxlLm1lYXN1cmUoYWN0aXZlTm9kZSlcbiAgICAgIH0sXG4gICAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICAgIGRyYWdPdmVybGF5OiB7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIHJlY3Q6IG1lYXN1cmluZ0NvbmZpZ3VyYXRpb24uZHJhZ092ZXJsYXkubWVhc3VyZShtZWFzdXJhYmxlTm9kZSlcbiAgICAgIH0sXG4gICAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgICAgbWVhc3VyaW5nQ29uZmlndXJhdGlvbixcbiAgICAgIHRyYW5zZm9ybTogcGFyc2VkVHJhbnNmb3JtXG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWZhdWx0RHJvcEFuaW1hdGlvbihvcHRpb25zKSB7XG4gIGNvbnN0IHtcbiAgICBkdXJhdGlvbixcbiAgICBlYXNpbmcsXG4gICAgc2lkZUVmZmVjdHMsXG4gICAga2V5ZnJhbWVzXG4gIH0gPSB7IC4uLmRlZmF1bHREcm9wQW5pbWF0aW9uQ29uZmlndXJhdGlvbixcbiAgICAuLi5vcHRpb25zXG4gIH07XG4gIHJldHVybiBfcmVmNCA9PiB7XG4gICAgbGV0IHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGRyYWdPdmVybGF5LFxuICAgICAgdHJhbnNmb3JtLFxuICAgICAgLi4ucmVzdFxuICAgIH0gPSBfcmVmNDtcblxuICAgIGlmICghZHVyYXRpb24pIHtcbiAgICAgIC8vIERvIG5vdCBhbmltYXRlIGlmIGFuaW1hdGlvbiBkdXJhdGlvbiBpcyB6ZXJvLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRlbHRhID0ge1xuICAgICAgeDogZHJhZ092ZXJsYXkucmVjdC5sZWZ0IC0gYWN0aXZlLnJlY3QubGVmdCxcbiAgICAgIHk6IGRyYWdPdmVybGF5LnJlY3QudG9wIC0gYWN0aXZlLnJlY3QudG9wXG4gICAgfTtcbiAgICBjb25zdCBzY2FsZSA9IHtcbiAgICAgIHNjYWxlWDogdHJhbnNmb3JtLnNjYWxlWCAhPT0gMSA/IGFjdGl2ZS5yZWN0LndpZHRoICogdHJhbnNmb3JtLnNjYWxlWCAvIGRyYWdPdmVybGF5LnJlY3Qud2lkdGggOiAxLFxuICAgICAgc2NhbGVZOiB0cmFuc2Zvcm0uc2NhbGVZICE9PSAxID8gYWN0aXZlLnJlY3QuaGVpZ2h0ICogdHJhbnNmb3JtLnNjYWxlWSAvIGRyYWdPdmVybGF5LnJlY3QuaGVpZ2h0IDogMVxuICAgIH07XG4gICAgY29uc3QgZmluYWxUcmFuc2Zvcm0gPSB7XG4gICAgICB4OiB0cmFuc2Zvcm0ueCAtIGRlbHRhLngsXG4gICAgICB5OiB0cmFuc2Zvcm0ueSAtIGRlbHRhLnksXG4gICAgICAuLi5zY2FsZVxuICAgIH07XG4gICAgY29uc3QgYW5pbWF0aW9uS2V5ZnJhbWVzID0ga2V5ZnJhbWVzKHsgLi4ucmVzdCxcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGRyYWdPdmVybGF5LFxuICAgICAgdHJhbnNmb3JtOiB7XG4gICAgICAgIGluaXRpYWw6IHRyYW5zZm9ybSxcbiAgICAgICAgZmluYWw6IGZpbmFsVHJhbnNmb3JtXG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgW2ZpcnN0S2V5ZnJhbWVdID0gYW5pbWF0aW9uS2V5ZnJhbWVzO1xuICAgIGNvbnN0IGxhc3RLZXlmcmFtZSA9IGFuaW1hdGlvbktleWZyYW1lc1thbmltYXRpb25LZXlmcmFtZXMubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAoSlNPTi5zdHJpbmdpZnkoZmlyc3RLZXlmcmFtZSkgPT09IEpTT04uc3RyaW5naWZ5KGxhc3RLZXlmcmFtZSkpIHtcbiAgICAgIC8vIFRoZSBzdGFydCBhbmQgZW5kIGtleWZyYW1lcyBhcmUgdGhlIHNhbWUsIGluZmVyIHRoYXQgdGhlcmUgaXMgbm8gYW5pbWF0aW9uIG5lZWRlZC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjbGVhbnVwID0gc2lkZUVmZmVjdHMgPT0gbnVsbCA/IHZvaWQgMCA6IHNpZGVFZmZlY3RzKHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGRyYWdPdmVybGF5LFxuICAgICAgLi4ucmVzdFxuICAgIH0pO1xuICAgIGNvbnN0IGFuaW1hdGlvbiA9IGRyYWdPdmVybGF5Lm5vZGUuYW5pbWF0ZShhbmltYXRpb25LZXlmcmFtZXMsIHtcbiAgICAgIGR1cmF0aW9uLFxuICAgICAgZWFzaW5nLFxuICAgICAgZmlsbDogJ2ZvcndhcmRzJ1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGFuaW1hdGlvbi5vbmZpbmlzaCA9ICgpID0+IHtcbiAgICAgICAgY2xlYW51cCA9PSBudWxsID8gdm9pZCAwIDogY2xlYW51cCgpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xufVxuXG5sZXQga2V5ID0gMDtcbmZ1bmN0aW9uIHVzZUtleShpZCkge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBrZXkrKztcbiAgICByZXR1cm4ga2V5O1xuICB9LCBbaWRdKTtcbn1cblxuY29uc3QgRHJhZ092ZXJsYXkgPSAvKiNfX1BVUkVfXyovUmVhY3QubWVtbyhfcmVmID0+IHtcbiAgbGV0IHtcbiAgICBhZGp1c3RTY2FsZSA9IGZhbHNlLFxuICAgIGNoaWxkcmVuLFxuICAgIGRyb3BBbmltYXRpb246IGRyb3BBbmltYXRpb25Db25maWcsXG4gICAgc3R5bGUsXG4gICAgdHJhbnNpdGlvbixcbiAgICBtb2RpZmllcnMsXG4gICAgd3JhcHBlckVsZW1lbnQgPSAnZGl2JyxcbiAgICBjbGFzc05hbWUsXG4gICAgekluZGV4ID0gOTk5XG4gIH0gPSBfcmVmO1xuICBjb25zdCB7XG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWN0aXZlLFxuICAgIGFjdGl2ZU5vZGVSZWN0LFxuICAgIGNvbnRhaW5lck5vZGVSZWN0LFxuICAgIGRyYWdnYWJsZU5vZGVzLFxuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMsXG4gICAgZHJhZ092ZXJsYXksXG4gICAgb3ZlcixcbiAgICBtZWFzdXJpbmdDb25maWd1cmF0aW9uLFxuICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsXG4gICAgd2luZG93UmVjdFxuICB9ID0gdXNlRG5kQ29udGV4dCgpO1xuICBjb25zdCB0cmFuc2Zvcm0gPSB1c2VDb250ZXh0KEFjdGl2ZURyYWdnYWJsZUNvbnRleHQpO1xuICBjb25zdCBrZXkgPSB1c2VLZXkoYWN0aXZlID09IG51bGwgPyB2b2lkIDAgOiBhY3RpdmUuaWQpO1xuICBjb25zdCBtb2RpZmllZFRyYW5zZm9ybSA9IGFwcGx5TW9kaWZpZXJzKG1vZGlmaWVycywge1xuICAgIGFjdGl2YXRvckV2ZW50LFxuICAgIGFjdGl2ZSxcbiAgICBhY3RpdmVOb2RlUmVjdCxcbiAgICBjb250YWluZXJOb2RlUmVjdCxcbiAgICBkcmFnZ2luZ05vZGVSZWN0OiBkcmFnT3ZlcmxheS5yZWN0LFxuICAgIG92ZXIsXG4gICAgb3ZlcmxheU5vZGVSZWN0OiBkcmFnT3ZlcmxheS5yZWN0LFxuICAgIHNjcm9sbGFibGVBbmNlc3RvcnMsXG4gICAgc2Nyb2xsYWJsZUFuY2VzdG9yUmVjdHMsXG4gICAgdHJhbnNmb3JtLFxuICAgIHdpbmRvd1JlY3RcbiAgfSk7XG4gIGNvbnN0IGluaXRpYWxSZWN0ID0gdXNlSW5pdGlhbFZhbHVlKGFjdGl2ZU5vZGVSZWN0KTtcbiAgY29uc3QgZHJvcEFuaW1hdGlvbiA9IHVzZURyb3BBbmltYXRpb24oe1xuICAgIGNvbmZpZzogZHJvcEFuaW1hdGlvbkNvbmZpZyxcbiAgICBkcmFnZ2FibGVOb2RlcyxcbiAgICBkcm9wcGFibGVDb250YWluZXJzLFxuICAgIG1lYXN1cmluZ0NvbmZpZ3VyYXRpb25cbiAgfSk7IC8vIFdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlIGFjdGl2ZSBub2RlIHRvIGJlIG1lYXN1cmVkIGJlZm9yZSBjb25uZWN0aW5nIHRoZSBkcmFnIG92ZXJsYXkgcmVmXG4gIC8vIG90aGVyd2lzZSBjb2xsaXNpb25zIGNhbiBiZSBjb21wdXRlZCBhZ2FpbnN0IGEgbWlzcG9zaXRpb25lZCBkcmFnIG92ZXJsYXlcblxuICBjb25zdCByZWYgPSBpbml0aWFsUmVjdCA/IGRyYWdPdmVybGF5LnNldFJlZiA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTnVsbGlmaWVkQ29udGV4dFByb3ZpZGVyLCBudWxsLCBSZWFjdC5jcmVhdGVFbGVtZW50KEFuaW1hdGlvbk1hbmFnZXIsIHtcbiAgICBhbmltYXRpb246IGRyb3BBbmltYXRpb25cbiAgfSwgYWN0aXZlICYmIGtleSA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoUG9zaXRpb25lZE92ZXJsYXksIHtcbiAgICBrZXk6IGtleSxcbiAgICBpZDogYWN0aXZlLmlkLFxuICAgIHJlZjogcmVmLFxuICAgIGFzOiB3cmFwcGVyRWxlbWVudCxcbiAgICBhY3RpdmF0b3JFdmVudDogYWN0aXZhdG9yRXZlbnQsXG4gICAgYWRqdXN0U2NhbGU6IGFkanVzdFNjYWxlLFxuICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuICAgIHRyYW5zaXRpb246IHRyYW5zaXRpb24sXG4gICAgcmVjdDogaW5pdGlhbFJlY3QsXG4gICAgc3R5bGU6IHtcbiAgICAgIHpJbmRleCxcbiAgICAgIC4uLnN0eWxlXG4gICAgfSxcbiAgICB0cmFuc2Zvcm06IG1vZGlmaWVkVHJhbnNmb3JtXG4gIH0sIGNoaWxkcmVuKSA6IG51bGwpKTtcbn0pO1xuXG5leHBvcnQgeyBBdXRvU2Nyb2xsQWN0aXZhdG9yLCBEbmRDb250ZXh0LCBEcmFnT3ZlcmxheSwgS2V5Ym9hcmRDb2RlLCBLZXlib2FyZFNlbnNvciwgTWVhc3VyaW5nRnJlcXVlbmN5LCBNZWFzdXJpbmdTdHJhdGVneSwgTW91c2VTZW5zb3IsIFBvaW50ZXJTZW5zb3IsIFRvdWNoU2Vuc29yLCBUcmF2ZXJzYWxPcmRlciwgYXBwbHlNb2RpZmllcnMsIGNsb3Nlc3RDZW50ZXIsIGNsb3Nlc3RDb3JuZXJzLCBkZWZhdWx0QW5ub3VuY2VtZW50cywgZGVmYXVsdENvb3JkaW5hdGVzLCBkZWZhdWx0RHJvcEFuaW1hdGlvbkNvbmZpZ3VyYXRpb24gYXMgZGVmYXVsdERyb3BBbmltYXRpb24sIGRlZmF1bHREcm9wQW5pbWF0aW9uU2lkZUVmZmVjdHMsIGRlZmF1bHRLZXlib2FyZENvb3JkaW5hdGVHZXR0ZXIsIGRlZmF1bHRTY3JlZW5SZWFkZXJJbnN0cnVjdGlvbnMsIGdldENsaWVudFJlY3QsIGdldEZpcnN0Q29sbGlzaW9uLCBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzLCBwb2ludGVyV2l0aGluLCByZWN0SW50ZXJzZWN0aW9uLCB1c2VEbmRDb250ZXh0LCB1c2VEbmRNb25pdG9yLCB1c2VEcmFnZ2FibGUsIHVzZURyb3BwYWJsZSwgdXNlU2Vuc29yLCB1c2VTZW5zb3JzIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb3JlLmVzbS5qcy5tYXBcbiIsImltcG9ydCBSZWFjdCwgeyB1c2VNZW1vLCB1c2VSZWYsIHVzZUVmZmVjdCwgdXNlU3RhdGUsIHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VEbmRDb250ZXh0LCBnZXRDbGllbnRSZWN0LCB1c2VEcm9wcGFibGUsIHVzZURyYWdnYWJsZSwgY2xvc2VzdENvcm5lcnMsIGdldEZpcnN0Q29sbGlzaW9uLCBnZXRTY3JvbGxhYmxlQW5jZXN0b3JzLCBLZXlib2FyZENvZGUgfSBmcm9tICdAZG5kLWtpdC9jb3JlJztcbmltcG9ydCB7IHVzZVVuaXF1ZUlkLCB1c2VJc29tb3JwaGljTGF5b3V0RWZmZWN0LCBDU1MsIHVzZUNvbWJpbmVkUmVmcywgaXNLZXlib2FyZEV2ZW50LCBzdWJ0cmFjdCB9IGZyb20gJ0BkbmQta2l0L3V0aWxpdGllcyc7XG5cbi8qKlxyXG4gKiBNb3ZlIGFuIGFycmF5IGl0ZW0gdG8gYSBkaWZmZXJlbnQgcG9zaXRpb24uIFJldHVybnMgYSBuZXcgYXJyYXkgd2l0aCB0aGUgaXRlbSBtb3ZlZCB0byB0aGUgbmV3IHBvc2l0aW9uLlxyXG4gKi9cbmZ1bmN0aW9uIGFycmF5TW92ZShhcnJheSwgZnJvbSwgdG8pIHtcbiAgY29uc3QgbmV3QXJyYXkgPSBhcnJheS5zbGljZSgpO1xuICBuZXdBcnJheS5zcGxpY2UodG8gPCAwID8gbmV3QXJyYXkubGVuZ3RoICsgdG8gOiB0bywgMCwgbmV3QXJyYXkuc3BsaWNlKGZyb20sIDEpWzBdKTtcbiAgcmV0dXJuIG5ld0FycmF5O1xufVxuXG4vKipcclxuICogU3dhcCBhbiBhcnJheSBpdGVtIHRvIGEgZGlmZmVyZW50IHBvc2l0aW9uLiBSZXR1cm5zIGEgbmV3IGFycmF5IHdpdGggdGhlIGl0ZW0gc3dhcHBlZCB0byB0aGUgbmV3IHBvc2l0aW9uLlxyXG4gKi9cbmZ1bmN0aW9uIGFycmF5U3dhcChhcnJheSwgZnJvbSwgdG8pIHtcbiAgY29uc3QgbmV3QXJyYXkgPSBhcnJheS5zbGljZSgpO1xuICBuZXdBcnJheVtmcm9tXSA9IGFycmF5W3RvXTtcbiAgbmV3QXJyYXlbdG9dID0gYXJyYXlbZnJvbV07XG4gIHJldHVybiBuZXdBcnJheTtcbn1cblxuZnVuY3Rpb24gZ2V0U29ydGVkUmVjdHMoaXRlbXMsIHJlY3RzKSB7XG4gIHJldHVybiBpdGVtcy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBpZCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCByZWN0ID0gcmVjdHMuZ2V0KGlkKTtcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICBhY2N1bXVsYXRvcltpbmRleF0gPSByZWN0O1xuICAgIH1cblxuICAgIHJldHVybiBhY2N1bXVsYXRvcjtcbiAgfSwgQXJyYXkoaXRlbXMubGVuZ3RoKSk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRJbmRleChpbmRleCkge1xuICByZXR1cm4gaW5kZXggIT09IG51bGwgJiYgaW5kZXggPj0gMDtcbn1cblxuZnVuY3Rpb24gaXRlbXNFcXVhbChhLCBiKSB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRGlzYWJsZWQoZGlzYWJsZWQpIHtcbiAgaWYgKHR5cGVvZiBkaXNhYmxlZCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRyYWdnYWJsZTogZGlzYWJsZWQsXG4gICAgICBkcm9wcGFibGU6IGRpc2FibGVkXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBkaXNhYmxlZDtcbn1cblxuLy8gVG8tZG86IFdlIHNob3VsZCBiZSBjYWxjdWxhdGluZyBzY2FsZSB0cmFuc2Zvcm1hdGlvblxuY29uc3QgZGVmYXVsdFNjYWxlID0ge1xuICBzY2FsZVg6IDEsXG4gIHNjYWxlWTogMVxufTtcbmNvbnN0IGhvcml6b250YWxMaXN0U29ydGluZ1N0cmF0ZWd5ID0gX3JlZiA9PiB7XG4gIHZhciBfcmVjdHMkYWN0aXZlSW5kZXg7XG5cbiAgbGV0IHtcbiAgICByZWN0cyxcbiAgICBhY3RpdmVOb2RlUmVjdDogZmFsbGJhY2tBY3RpdmVSZWN0LFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIG92ZXJJbmRleCxcbiAgICBpbmRleFxuICB9ID0gX3JlZjtcbiAgY29uc3QgYWN0aXZlTm9kZVJlY3QgPSAoX3JlY3RzJGFjdGl2ZUluZGV4ID0gcmVjdHNbYWN0aXZlSW5kZXhdKSAhPSBudWxsID8gX3JlY3RzJGFjdGl2ZUluZGV4IDogZmFsbGJhY2tBY3RpdmVSZWN0O1xuXG4gIGlmICghYWN0aXZlTm9kZVJlY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGl0ZW1HYXAgPSBnZXRJdGVtR2FwKHJlY3RzLCBpbmRleCwgYWN0aXZlSW5kZXgpO1xuXG4gIGlmIChpbmRleCA9PT0gYWN0aXZlSW5kZXgpIHtcbiAgICBjb25zdCBuZXdJbmRleFJlY3QgPSByZWN0c1tvdmVySW5kZXhdO1xuXG4gICAgaWYgKCFuZXdJbmRleFJlY3QpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB4OiBhY3RpdmVJbmRleCA8IG92ZXJJbmRleCA/IG5ld0luZGV4UmVjdC5sZWZ0ICsgbmV3SW5kZXhSZWN0LndpZHRoIC0gKGFjdGl2ZU5vZGVSZWN0LmxlZnQgKyBhY3RpdmVOb2RlUmVjdC53aWR0aCkgOiBuZXdJbmRleFJlY3QubGVmdCAtIGFjdGl2ZU5vZGVSZWN0LmxlZnQsXG4gICAgICB5OiAwLFxuICAgICAgLi4uZGVmYXVsdFNjYWxlXG4gICAgfTtcbiAgfVxuXG4gIGlmIChpbmRleCA+IGFjdGl2ZUluZGV4ICYmIGluZGV4IDw9IG92ZXJJbmRleCkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiAtYWN0aXZlTm9kZVJlY3Qud2lkdGggLSBpdGVtR2FwLFxuICAgICAgeTogMCxcbiAgICAgIC4uLmRlZmF1bHRTY2FsZVxuICAgIH07XG4gIH1cblxuICBpZiAoaW5kZXggPCBhY3RpdmVJbmRleCAmJiBpbmRleCA+PSBvdmVySW5kZXgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogYWN0aXZlTm9kZVJlY3Qud2lkdGggKyBpdGVtR2FwLFxuICAgICAgeTogMCxcbiAgICAgIC4uLmRlZmF1bHRTY2FsZVxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHg6IDAsXG4gICAgeTogMCxcbiAgICAuLi5kZWZhdWx0U2NhbGVcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGdldEl0ZW1HYXAocmVjdHMsIGluZGV4LCBhY3RpdmVJbmRleCkge1xuICBjb25zdCBjdXJyZW50UmVjdCA9IHJlY3RzW2luZGV4XTtcbiAgY29uc3QgcHJldmlvdXNSZWN0ID0gcmVjdHNbaW5kZXggLSAxXTtcbiAgY29uc3QgbmV4dFJlY3QgPSByZWN0c1tpbmRleCArIDFdO1xuXG4gIGlmICghY3VycmVudFJlY3QgfHwgIXByZXZpb3VzUmVjdCAmJiAhbmV4dFJlY3QpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGlmIChhY3RpdmVJbmRleCA8IGluZGV4KSB7XG4gICAgcmV0dXJuIHByZXZpb3VzUmVjdCA/IGN1cnJlbnRSZWN0LmxlZnQgLSAocHJldmlvdXNSZWN0LmxlZnQgKyBwcmV2aW91c1JlY3Qud2lkdGgpIDogbmV4dFJlY3QubGVmdCAtIChjdXJyZW50UmVjdC5sZWZ0ICsgY3VycmVudFJlY3Qud2lkdGgpO1xuICB9XG5cbiAgcmV0dXJuIG5leHRSZWN0ID8gbmV4dFJlY3QubGVmdCAtIChjdXJyZW50UmVjdC5sZWZ0ICsgY3VycmVudFJlY3Qud2lkdGgpIDogY3VycmVudFJlY3QubGVmdCAtIChwcmV2aW91c1JlY3QubGVmdCArIHByZXZpb3VzUmVjdC53aWR0aCk7XG59XG5cbmNvbnN0IHJlY3RTb3J0aW5nU3RyYXRlZ3kgPSBfcmVmID0+IHtcbiAgbGV0IHtcbiAgICByZWN0cyxcbiAgICBhY3RpdmVJbmRleCxcbiAgICBvdmVySW5kZXgsXG4gICAgaW5kZXhcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IG5ld1JlY3RzID0gYXJyYXlNb3ZlKHJlY3RzLCBvdmVySW5kZXgsIGFjdGl2ZUluZGV4KTtcbiAgY29uc3Qgb2xkUmVjdCA9IHJlY3RzW2luZGV4XTtcbiAgY29uc3QgbmV3UmVjdCA9IG5ld1JlY3RzW2luZGV4XTtcblxuICBpZiAoIW5ld1JlY3QgfHwgIW9sZFJlY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgeDogbmV3UmVjdC5sZWZ0IC0gb2xkUmVjdC5sZWZ0LFxuICAgIHk6IG5ld1JlY3QudG9wIC0gb2xkUmVjdC50b3AsXG4gICAgc2NhbGVYOiBuZXdSZWN0LndpZHRoIC8gb2xkUmVjdC53aWR0aCxcbiAgICBzY2FsZVk6IG5ld1JlY3QuaGVpZ2h0IC8gb2xkUmVjdC5oZWlnaHRcbiAgfTtcbn07XG5cbmNvbnN0IHJlY3RTd2FwcGluZ1N0cmF0ZWd5ID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgYWN0aXZlSW5kZXgsXG4gICAgaW5kZXgsXG4gICAgcmVjdHMsXG4gICAgb3ZlckluZGV4XG4gIH0gPSBfcmVmO1xuICBsZXQgb2xkUmVjdDtcbiAgbGV0IG5ld1JlY3Q7XG5cbiAgaWYgKGluZGV4ID09PSBhY3RpdmVJbmRleCkge1xuICAgIG9sZFJlY3QgPSByZWN0c1tpbmRleF07XG4gICAgbmV3UmVjdCA9IHJlY3RzW292ZXJJbmRleF07XG4gIH1cblxuICBpZiAoaW5kZXggPT09IG92ZXJJbmRleCkge1xuICAgIG9sZFJlY3QgPSByZWN0c1tpbmRleF07XG4gICAgbmV3UmVjdCA9IHJlY3RzW2FjdGl2ZUluZGV4XTtcbiAgfVxuXG4gIGlmICghbmV3UmVjdCB8fCAhb2xkUmVjdCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB4OiBuZXdSZWN0LmxlZnQgLSBvbGRSZWN0LmxlZnQsXG4gICAgeTogbmV3UmVjdC50b3AgLSBvbGRSZWN0LnRvcCxcbiAgICBzY2FsZVg6IG5ld1JlY3Qud2lkdGggLyBvbGRSZWN0LndpZHRoLFxuICAgIHNjYWxlWTogbmV3UmVjdC5oZWlnaHQgLyBvbGRSZWN0LmhlaWdodFxuICB9O1xufTtcblxuLy8gVG8tZG86IFdlIHNob3VsZCBiZSBjYWxjdWxhdGluZyBzY2FsZSB0cmFuc2Zvcm1hdGlvblxuY29uc3QgZGVmYXVsdFNjYWxlJDEgPSB7XG4gIHNjYWxlWDogMSxcbiAgc2NhbGVZOiAxXG59O1xuY29uc3QgdmVydGljYWxMaXN0U29ydGluZ1N0cmF0ZWd5ID0gX3JlZiA9PiB7XG4gIHZhciBfcmVjdHMkYWN0aXZlSW5kZXg7XG5cbiAgbGV0IHtcbiAgICBhY3RpdmVJbmRleCxcbiAgICBhY3RpdmVOb2RlUmVjdDogZmFsbGJhY2tBY3RpdmVSZWN0LFxuICAgIGluZGV4LFxuICAgIHJlY3RzLFxuICAgIG92ZXJJbmRleFxuICB9ID0gX3JlZjtcbiAgY29uc3QgYWN0aXZlTm9kZVJlY3QgPSAoX3JlY3RzJGFjdGl2ZUluZGV4ID0gcmVjdHNbYWN0aXZlSW5kZXhdKSAhPSBudWxsID8gX3JlY3RzJGFjdGl2ZUluZGV4IDogZmFsbGJhY2tBY3RpdmVSZWN0O1xuXG4gIGlmICghYWN0aXZlTm9kZVJlY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChpbmRleCA9PT0gYWN0aXZlSW5kZXgpIHtcbiAgICBjb25zdCBvdmVySW5kZXhSZWN0ID0gcmVjdHNbb3ZlckluZGV4XTtcblxuICAgIGlmICghb3ZlckluZGV4UmVjdCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiBhY3RpdmVJbmRleCA8IG92ZXJJbmRleCA/IG92ZXJJbmRleFJlY3QudG9wICsgb3ZlckluZGV4UmVjdC5oZWlnaHQgLSAoYWN0aXZlTm9kZVJlY3QudG9wICsgYWN0aXZlTm9kZVJlY3QuaGVpZ2h0KSA6IG92ZXJJbmRleFJlY3QudG9wIC0gYWN0aXZlTm9kZVJlY3QudG9wLFxuICAgICAgLi4uZGVmYXVsdFNjYWxlJDFcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgaXRlbUdhcCA9IGdldEl0ZW1HYXAkMShyZWN0cywgaW5kZXgsIGFjdGl2ZUluZGV4KTtcblxuICBpZiAoaW5kZXggPiBhY3RpdmVJbmRleCAmJiBpbmRleCA8PSBvdmVySW5kZXgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IC1hY3RpdmVOb2RlUmVjdC5oZWlnaHQgLSBpdGVtR2FwLFxuICAgICAgLi4uZGVmYXVsdFNjYWxlJDFcbiAgICB9O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgYWN0aXZlSW5kZXggJiYgaW5kZXggPj0gb3ZlckluZGV4KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiBhY3RpdmVOb2RlUmVjdC5oZWlnaHQgKyBpdGVtR2FwLFxuICAgICAgLi4uZGVmYXVsdFNjYWxlJDFcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB4OiAwLFxuICAgIHk6IDAsXG4gICAgLi4uZGVmYXVsdFNjYWxlJDFcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGdldEl0ZW1HYXAkMShjbGllbnRSZWN0cywgaW5kZXgsIGFjdGl2ZUluZGV4KSB7XG4gIGNvbnN0IGN1cnJlbnRSZWN0ID0gY2xpZW50UmVjdHNbaW5kZXhdO1xuICBjb25zdCBwcmV2aW91c1JlY3QgPSBjbGllbnRSZWN0c1tpbmRleCAtIDFdO1xuICBjb25zdCBuZXh0UmVjdCA9IGNsaWVudFJlY3RzW2luZGV4ICsgMV07XG5cbiAgaWYgKCFjdXJyZW50UmVjdCkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgaWYgKGFjdGl2ZUluZGV4IDwgaW5kZXgpIHtcbiAgICByZXR1cm4gcHJldmlvdXNSZWN0ID8gY3VycmVudFJlY3QudG9wIC0gKHByZXZpb3VzUmVjdC50b3AgKyBwcmV2aW91c1JlY3QuaGVpZ2h0KSA6IG5leHRSZWN0ID8gbmV4dFJlY3QudG9wIC0gKGN1cnJlbnRSZWN0LnRvcCArIGN1cnJlbnRSZWN0LmhlaWdodCkgOiAwO1xuICB9XG5cbiAgcmV0dXJuIG5leHRSZWN0ID8gbmV4dFJlY3QudG9wIC0gKGN1cnJlbnRSZWN0LnRvcCArIGN1cnJlbnRSZWN0LmhlaWdodCkgOiBwcmV2aW91c1JlY3QgPyBjdXJyZW50UmVjdC50b3AgLSAocHJldmlvdXNSZWN0LnRvcCArIHByZXZpb3VzUmVjdC5oZWlnaHQpIDogMDtcbn1cblxuY29uc3QgSURfUFJFRklYID0gJ1NvcnRhYmxlJztcbmNvbnN0IENvbnRleHQgPSAvKiNfX1BVUkVfXyovUmVhY3QuY3JlYXRlQ29udGV4dCh7XG4gIGFjdGl2ZUluZGV4OiAtMSxcbiAgY29udGFpbmVySWQ6IElEX1BSRUZJWCxcbiAgZGlzYWJsZVRyYW5zZm9ybXM6IGZhbHNlLFxuICBpdGVtczogW10sXG4gIG92ZXJJbmRleDogLTEsXG4gIHVzZURyYWdPdmVybGF5OiBmYWxzZSxcbiAgc29ydGVkUmVjdHM6IFtdLFxuICBzdHJhdGVneTogcmVjdFNvcnRpbmdTdHJhdGVneSxcbiAgZGlzYWJsZWQ6IHtcbiAgICBkcmFnZ2FibGU6IGZhbHNlLFxuICAgIGRyb3BwYWJsZTogZmFsc2VcbiAgfVxufSk7XG5mdW5jdGlvbiBTb3J0YWJsZUNvbnRleHQoX3JlZikge1xuICBsZXQge1xuICAgIGNoaWxkcmVuLFxuICAgIGlkLFxuICAgIGl0ZW1zOiB1c2VyRGVmaW5lZEl0ZW1zLFxuICAgIHN0cmF0ZWd5ID0gcmVjdFNvcnRpbmdTdHJhdGVneSxcbiAgICBkaXNhYmxlZDogZGlzYWJsZWRQcm9wID0gZmFsc2VcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmUsXG4gICAgZHJhZ092ZXJsYXksXG4gICAgZHJvcHBhYmxlUmVjdHMsXG4gICAgb3ZlcixcbiAgICBtZWFzdXJlRHJvcHBhYmxlQ29udGFpbmVyc1xuICB9ID0gdXNlRG5kQ29udGV4dCgpO1xuICBjb25zdCBjb250YWluZXJJZCA9IHVzZVVuaXF1ZUlkKElEX1BSRUZJWCwgaWQpO1xuICBjb25zdCB1c2VEcmFnT3ZlcmxheSA9IEJvb2xlYW4oZHJhZ092ZXJsYXkucmVjdCAhPT0gbnVsbCk7XG4gIGNvbnN0IGl0ZW1zID0gdXNlTWVtbygoKSA9PiB1c2VyRGVmaW5lZEl0ZW1zLm1hcChpdGVtID0+IHR5cGVvZiBpdGVtID09PSAnb2JqZWN0JyAmJiAnaWQnIGluIGl0ZW0gPyBpdGVtLmlkIDogaXRlbSksIFt1c2VyRGVmaW5lZEl0ZW1zXSk7XG4gIGNvbnN0IGlzRHJhZ2dpbmcgPSBhY3RpdmUgIT0gbnVsbDtcbiAgY29uc3QgYWN0aXZlSW5kZXggPSBhY3RpdmUgPyBpdGVtcy5pbmRleE9mKGFjdGl2ZS5pZCkgOiAtMTtcbiAgY29uc3Qgb3ZlckluZGV4ID0gb3ZlciA/IGl0ZW1zLmluZGV4T2Yob3Zlci5pZCkgOiAtMTtcbiAgY29uc3QgcHJldmlvdXNJdGVtc1JlZiA9IHVzZVJlZihpdGVtcyk7XG4gIGNvbnN0IGl0ZW1zSGF2ZUNoYW5nZWQgPSAhaXRlbXNFcXVhbChpdGVtcywgcHJldmlvdXNJdGVtc1JlZi5jdXJyZW50KTtcbiAgY29uc3QgZGlzYWJsZVRyYW5zZm9ybXMgPSBvdmVySW5kZXggIT09IC0xICYmIGFjdGl2ZUluZGV4ID09PSAtMSB8fCBpdGVtc0hhdmVDaGFuZ2VkO1xuICBjb25zdCBkaXNhYmxlZCA9IG5vcm1hbGl6ZURpc2FibGVkKGRpc2FibGVkUHJvcCk7XG4gIHVzZUlzb21vcnBoaWNMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpdGVtc0hhdmVDaGFuZ2VkICYmIGlzRHJhZ2dpbmcpIHtcbiAgICAgIG1lYXN1cmVEcm9wcGFibGVDb250YWluZXJzKGl0ZW1zKTtcbiAgICB9XG4gIH0sIFtpdGVtc0hhdmVDaGFuZ2VkLCBpdGVtcywgaXNEcmFnZ2luZywgbWVhc3VyZURyb3BwYWJsZUNvbnRhaW5lcnNdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBwcmV2aW91c0l0ZW1zUmVmLmN1cnJlbnQgPSBpdGVtcztcbiAgfSwgW2l0ZW1zXSk7XG4gIGNvbnN0IGNvbnRleHRWYWx1ZSA9IHVzZU1lbW8oKCkgPT4gKHtcbiAgICBhY3RpdmVJbmRleCxcbiAgICBjb250YWluZXJJZCxcbiAgICBkaXNhYmxlZCxcbiAgICBkaXNhYmxlVHJhbnNmb3JtcyxcbiAgICBpdGVtcyxcbiAgICBvdmVySW5kZXgsXG4gICAgdXNlRHJhZ092ZXJsYXksXG4gICAgc29ydGVkUmVjdHM6IGdldFNvcnRlZFJlY3RzKGl0ZW1zLCBkcm9wcGFibGVSZWN0cyksXG4gICAgc3RyYXRlZ3lcbiAgfSksIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgW2FjdGl2ZUluZGV4LCBjb250YWluZXJJZCwgZGlzYWJsZWQuZHJhZ2dhYmxlLCBkaXNhYmxlZC5kcm9wcGFibGUsIGRpc2FibGVUcmFuc2Zvcm1zLCBpdGVtcywgb3ZlckluZGV4LCBkcm9wcGFibGVSZWN0cywgdXNlRHJhZ092ZXJsYXksIHN0cmF0ZWd5XSk7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KENvbnRleHQuUHJvdmlkZXIsIHtcbiAgICB2YWx1ZTogY29udGV4dFZhbHVlXG4gIH0sIGNoaWxkcmVuKTtcbn1cblxuY29uc3QgZGVmYXVsdE5ld0luZGV4R2V0dGVyID0gX3JlZiA9PiB7XG4gIGxldCB7XG4gICAgaWQsXG4gICAgaXRlbXMsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgb3ZlckluZGV4XG4gIH0gPSBfcmVmO1xuICByZXR1cm4gYXJyYXlNb3ZlKGl0ZW1zLCBhY3RpdmVJbmRleCwgb3ZlckluZGV4KS5pbmRleE9mKGlkKTtcbn07XG5jb25zdCBkZWZhdWx0QW5pbWF0ZUxheW91dENoYW5nZXMgPSBfcmVmMiA9PiB7XG4gIGxldCB7XG4gICAgY29udGFpbmVySWQsXG4gICAgaXNTb3J0aW5nLFxuICAgIHdhc0RyYWdnaW5nLFxuICAgIGluZGV4LFxuICAgIGl0ZW1zLFxuICAgIG5ld0luZGV4LFxuICAgIHByZXZpb3VzSXRlbXMsXG4gICAgcHJldmlvdXNDb250YWluZXJJZCxcbiAgICB0cmFuc2l0aW9uXG4gIH0gPSBfcmVmMjtcblxuICBpZiAoIXRyYW5zaXRpb24gfHwgIXdhc0RyYWdnaW5nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHByZXZpb3VzSXRlbXMgIT09IGl0ZW1zICYmIGluZGV4ID09PSBuZXdJbmRleCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChpc1NvcnRpbmcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBuZXdJbmRleCAhPT0gaW5kZXggJiYgY29udGFpbmVySWQgPT09IHByZXZpb3VzQ29udGFpbmVySWQ7XG59O1xuY29uc3QgZGVmYXVsdFRyYW5zaXRpb24gPSB7XG4gIGR1cmF0aW9uOiAyMDAsXG4gIGVhc2luZzogJ2Vhc2UnXG59O1xuY29uc3QgdHJhbnNpdGlvblByb3BlcnR5ID0gJ3RyYW5zZm9ybSc7XG5jb25zdCBkaXNhYmxlZFRyYW5zaXRpb24gPSAvKiNfX1BVUkVfXyovQ1NTLlRyYW5zaXRpb24udG9TdHJpbmcoe1xuICBwcm9wZXJ0eTogdHJhbnNpdGlvblByb3BlcnR5LFxuICBkdXJhdGlvbjogMCxcbiAgZWFzaW5nOiAnbGluZWFyJ1xufSk7XG5jb25zdCBkZWZhdWx0QXR0cmlidXRlcyA9IHtcbiAgcm9sZURlc2NyaXB0aW9uOiAnc29ydGFibGUnXG59O1xuXG4vKlxyXG4gKiBXaGVuIHRoZSBpbmRleCBvZiBhbiBpdGVtIGNoYW5nZXMgd2hpbGUgc29ydGluZyxcclxuICogd2UgbmVlZCB0byB0ZW1wb3JhcmlseSBkaXNhYmxlIHRoZSB0cmFuc2Zvcm1zXHJcbiAqL1xuXG5mdW5jdGlvbiB1c2VEZXJpdmVkVHJhbnNmb3JtKF9yZWYpIHtcbiAgbGV0IHtcbiAgICBkaXNhYmxlZCxcbiAgICBpbmRleCxcbiAgICBub2RlLFxuICAgIHJlY3RcbiAgfSA9IF9yZWY7XG4gIGNvbnN0IFtkZXJpdmVkVHJhbnNmb3JtLCBzZXREZXJpdmVkdHJhbnNmb3JtXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBwcmV2aW91c0luZGV4ID0gdXNlUmVmKGluZGV4KTtcbiAgdXNlSXNvbW9ycGhpY0xheW91dEVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFkaXNhYmxlZCAmJiBpbmRleCAhPT0gcHJldmlvdXNJbmRleC5jdXJyZW50ICYmIG5vZGUuY3VycmVudCkge1xuICAgICAgY29uc3QgaW5pdGlhbCA9IHJlY3QuY3VycmVudDtcblxuICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGdldENsaWVudFJlY3Qobm9kZS5jdXJyZW50LCB7XG4gICAgICAgICAgaWdub3JlVHJhbnNmb3JtOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBkZWx0YSA9IHtcbiAgICAgICAgICB4OiBpbml0aWFsLmxlZnQgLSBjdXJyZW50LmxlZnQsXG4gICAgICAgICAgeTogaW5pdGlhbC50b3AgLSBjdXJyZW50LnRvcCxcbiAgICAgICAgICBzY2FsZVg6IGluaXRpYWwud2lkdGggLyBjdXJyZW50LndpZHRoLFxuICAgICAgICAgIHNjYWxlWTogaW5pdGlhbC5oZWlnaHQgLyBjdXJyZW50LmhlaWdodFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChkZWx0YS54IHx8IGRlbHRhLnkpIHtcbiAgICAgICAgICBzZXREZXJpdmVkdHJhbnNmb3JtKGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbmRleCAhPT0gcHJldmlvdXNJbmRleC5jdXJyZW50KSB7XG4gICAgICBwcmV2aW91c0luZGV4LmN1cnJlbnQgPSBpbmRleDtcbiAgICB9XG4gIH0sIFtkaXNhYmxlZCwgaW5kZXgsIG5vZGUsIHJlY3RdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGVyaXZlZFRyYW5zZm9ybSkge1xuICAgICAgc2V0RGVyaXZlZHRyYW5zZm9ybShudWxsKTtcbiAgICB9XG4gIH0sIFtkZXJpdmVkVHJhbnNmb3JtXSk7XG4gIHJldHVybiBkZXJpdmVkVHJhbnNmb3JtO1xufVxuXG5mdW5jdGlvbiB1c2VTb3J0YWJsZShfcmVmKSB7XG4gIGxldCB7XG4gICAgYW5pbWF0ZUxheW91dENoYW5nZXMgPSBkZWZhdWx0QW5pbWF0ZUxheW91dENoYW5nZXMsXG4gICAgYXR0cmlidXRlczogdXNlckRlZmluZWRBdHRyaWJ1dGVzLFxuICAgIGRpc2FibGVkOiBsb2NhbERpc2FibGVkLFxuICAgIGRhdGE6IGN1c3RvbURhdGEsXG4gICAgZ2V0TmV3SW5kZXggPSBkZWZhdWx0TmV3SW5kZXhHZXR0ZXIsXG4gICAgaWQsXG4gICAgc3RyYXRlZ3k6IGxvY2FsU3RyYXRlZ3ksXG4gICAgcmVzaXplT2JzZXJ2ZXJDb25maWcsXG4gICAgdHJhbnNpdGlvbiA9IGRlZmF1bHRUcmFuc2l0aW9uXG4gIH0gPSBfcmVmO1xuICBjb25zdCB7XG4gICAgaXRlbXMsXG4gICAgY29udGFpbmVySWQsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgZGlzYWJsZWQ6IGdsb2JhbERpc2FibGVkLFxuICAgIGRpc2FibGVUcmFuc2Zvcm1zLFxuICAgIHNvcnRlZFJlY3RzLFxuICAgIG92ZXJJbmRleCxcbiAgICB1c2VEcmFnT3ZlcmxheSxcbiAgICBzdHJhdGVneTogZ2xvYmFsU3RyYXRlZ3lcbiAgfSA9IHVzZUNvbnRleHQoQ29udGV4dCk7XG4gIGNvbnN0IGRpc2FibGVkID0gbm9ybWFsaXplTG9jYWxEaXNhYmxlZChsb2NhbERpc2FibGVkLCBnbG9iYWxEaXNhYmxlZCk7XG4gIGNvbnN0IGluZGV4ID0gaXRlbXMuaW5kZXhPZihpZCk7XG4gIGNvbnN0IGRhdGEgPSB1c2VNZW1vKCgpID0+ICh7XG4gICAgc29ydGFibGU6IHtcbiAgICAgIGNvbnRhaW5lcklkLFxuICAgICAgaW5kZXgsXG4gICAgICBpdGVtc1xuICAgIH0sXG4gICAgLi4uY3VzdG9tRGF0YVxuICB9KSwgW2NvbnRhaW5lcklkLCBjdXN0b21EYXRhLCBpbmRleCwgaXRlbXNdKTtcbiAgY29uc3QgaXRlbXNBZnRlckN1cnJlbnRTb3J0YWJsZSA9IHVzZU1lbW8oKCkgPT4gaXRlbXMuc2xpY2UoaXRlbXMuaW5kZXhPZihpZCkpLCBbaXRlbXMsIGlkXSk7XG4gIGNvbnN0IHtcbiAgICByZWN0LFxuICAgIG5vZGUsXG4gICAgaXNPdmVyLFxuICAgIHNldE5vZGVSZWY6IHNldERyb3BwYWJsZU5vZGVSZWZcbiAgfSA9IHVzZURyb3BwYWJsZSh7XG4gICAgaWQsXG4gICAgZGF0YSxcbiAgICBkaXNhYmxlZDogZGlzYWJsZWQuZHJvcHBhYmxlLFxuICAgIHJlc2l6ZU9ic2VydmVyQ29uZmlnOiB7XG4gICAgICB1cGRhdGVNZWFzdXJlbWVudHNGb3I6IGl0ZW1zQWZ0ZXJDdXJyZW50U29ydGFibGUsXG4gICAgICAuLi5yZXNpemVPYnNlcnZlckNvbmZpZ1xuICAgIH1cbiAgfSk7XG4gIGNvbnN0IHtcbiAgICBhY3RpdmUsXG4gICAgYWN0aXZhdG9yRXZlbnQsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgYXR0cmlidXRlcyxcbiAgICBzZXROb2RlUmVmOiBzZXREcmFnZ2FibGVOb2RlUmVmLFxuICAgIGxpc3RlbmVycyxcbiAgICBpc0RyYWdnaW5nLFxuICAgIG92ZXIsXG4gICAgc2V0QWN0aXZhdG9yTm9kZVJlZixcbiAgICB0cmFuc2Zvcm1cbiAgfSA9IHVzZURyYWdnYWJsZSh7XG4gICAgaWQsXG4gICAgZGF0YSxcbiAgICBhdHRyaWJ1dGVzOiB7IC4uLmRlZmF1bHRBdHRyaWJ1dGVzLFxuICAgICAgLi4udXNlckRlZmluZWRBdHRyaWJ1dGVzXG4gICAgfSxcbiAgICBkaXNhYmxlZDogZGlzYWJsZWQuZHJhZ2dhYmxlXG4gIH0pO1xuICBjb25zdCBzZXROb2RlUmVmID0gdXNlQ29tYmluZWRSZWZzKHNldERyb3BwYWJsZU5vZGVSZWYsIHNldERyYWdnYWJsZU5vZGVSZWYpO1xuICBjb25zdCBpc1NvcnRpbmcgPSBCb29sZWFuKGFjdGl2ZSk7XG4gIGNvbnN0IGRpc3BsYWNlSXRlbSA9IGlzU29ydGluZyAmJiAhZGlzYWJsZVRyYW5zZm9ybXMgJiYgaXNWYWxpZEluZGV4KGFjdGl2ZUluZGV4KSAmJiBpc1ZhbGlkSW5kZXgob3ZlckluZGV4KTtcbiAgY29uc3Qgc2hvdWxkRGlzcGxhY2VEcmFnU291cmNlID0gIXVzZURyYWdPdmVybGF5ICYmIGlzRHJhZ2dpbmc7XG4gIGNvbnN0IGRyYWdTb3VyY2VEaXNwbGFjZW1lbnQgPSBzaG91bGREaXNwbGFjZURyYWdTb3VyY2UgJiYgZGlzcGxhY2VJdGVtID8gdHJhbnNmb3JtIDogbnVsbDtcbiAgY29uc3Qgc3RyYXRlZ3kgPSBsb2NhbFN0cmF0ZWd5ICE9IG51bGwgPyBsb2NhbFN0cmF0ZWd5IDogZ2xvYmFsU3RyYXRlZ3k7XG4gIGNvbnN0IGZpbmFsVHJhbnNmb3JtID0gZGlzcGxhY2VJdGVtID8gZHJhZ1NvdXJjZURpc3BsYWNlbWVudCAhPSBudWxsID8gZHJhZ1NvdXJjZURpc3BsYWNlbWVudCA6IHN0cmF0ZWd5KHtcbiAgICByZWN0czogc29ydGVkUmVjdHMsXG4gICAgYWN0aXZlTm9kZVJlY3QsXG4gICAgYWN0aXZlSW5kZXgsXG4gICAgb3ZlckluZGV4LFxuICAgIGluZGV4XG4gIH0pIDogbnVsbDtcbiAgY29uc3QgbmV3SW5kZXggPSBpc1ZhbGlkSW5kZXgoYWN0aXZlSW5kZXgpICYmIGlzVmFsaWRJbmRleChvdmVySW5kZXgpID8gZ2V0TmV3SW5kZXgoe1xuICAgIGlkLFxuICAgIGl0ZW1zLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIG92ZXJJbmRleFxuICB9KSA6IGluZGV4O1xuICBjb25zdCBhY3RpdmVJZCA9IGFjdGl2ZSA9PSBudWxsID8gdm9pZCAwIDogYWN0aXZlLmlkO1xuICBjb25zdCBwcmV2aW91cyA9IHVzZVJlZih7XG4gICAgYWN0aXZlSWQsXG4gICAgaXRlbXMsXG4gICAgbmV3SW5kZXgsXG4gICAgY29udGFpbmVySWRcbiAgfSk7XG4gIGNvbnN0IGl0ZW1zSGF2ZUNoYW5nZWQgPSBpdGVtcyAhPT0gcHJldmlvdXMuY3VycmVudC5pdGVtcztcbiAgY29uc3Qgc2hvdWxkQW5pbWF0ZUxheW91dENoYW5nZXMgPSBhbmltYXRlTGF5b3V0Q2hhbmdlcyh7XG4gICAgYWN0aXZlLFxuICAgIGNvbnRhaW5lcklkLFxuICAgIGlzRHJhZ2dpbmcsXG4gICAgaXNTb3J0aW5nLFxuICAgIGlkLFxuICAgIGluZGV4LFxuICAgIGl0ZW1zLFxuICAgIG5ld0luZGV4OiBwcmV2aW91cy5jdXJyZW50Lm5ld0luZGV4LFxuICAgIHByZXZpb3VzSXRlbXM6IHByZXZpb3VzLmN1cnJlbnQuaXRlbXMsXG4gICAgcHJldmlvdXNDb250YWluZXJJZDogcHJldmlvdXMuY3VycmVudC5jb250YWluZXJJZCxcbiAgICB0cmFuc2l0aW9uLFxuICAgIHdhc0RyYWdnaW5nOiBwcmV2aW91cy5jdXJyZW50LmFjdGl2ZUlkICE9IG51bGxcbiAgfSk7XG4gIGNvbnN0IGRlcml2ZWRUcmFuc2Zvcm0gPSB1c2VEZXJpdmVkVHJhbnNmb3JtKHtcbiAgICBkaXNhYmxlZDogIXNob3VsZEFuaW1hdGVMYXlvdXRDaGFuZ2VzLFxuICAgIGluZGV4LFxuICAgIG5vZGUsXG4gICAgcmVjdFxuICB9KTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaXNTb3J0aW5nICYmIHByZXZpb3VzLmN1cnJlbnQubmV3SW5kZXggIT09IG5ld0luZGV4KSB7XG4gICAgICBwcmV2aW91cy5jdXJyZW50Lm5ld0luZGV4ID0gbmV3SW5kZXg7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRhaW5lcklkICE9PSBwcmV2aW91cy5jdXJyZW50LmNvbnRhaW5lcklkKSB7XG4gICAgICBwcmV2aW91cy5jdXJyZW50LmNvbnRhaW5lcklkID0gY29udGFpbmVySWQ7XG4gICAgfVxuXG4gICAgaWYgKGl0ZW1zICE9PSBwcmV2aW91cy5jdXJyZW50Lml0ZW1zKSB7XG4gICAgICBwcmV2aW91cy5jdXJyZW50Lml0ZW1zID0gaXRlbXM7XG4gICAgfVxuICB9LCBbaXNTb3J0aW5nLCBuZXdJbmRleCwgY29udGFpbmVySWQsIGl0ZW1zXSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGFjdGl2ZUlkID09PSBwcmV2aW91cy5jdXJyZW50LmFjdGl2ZUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGFjdGl2ZUlkICE9IG51bGwgJiYgcHJldmlvdXMuY3VycmVudC5hY3RpdmVJZCA9PSBudWxsKSB7XG4gICAgICBwcmV2aW91cy5jdXJyZW50LmFjdGl2ZUlkID0gYWN0aXZlSWQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBwcmV2aW91cy5jdXJyZW50LmFjdGl2ZUlkID0gYWN0aXZlSWQ7XG4gICAgfSwgNTApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgfSwgW2FjdGl2ZUlkXSk7XG4gIHJldHVybiB7XG4gICAgYWN0aXZlLFxuICAgIGFjdGl2ZUluZGV4LFxuICAgIGF0dHJpYnV0ZXMsXG4gICAgZGF0YSxcbiAgICByZWN0LFxuICAgIGluZGV4LFxuICAgIG5ld0luZGV4LFxuICAgIGl0ZW1zLFxuICAgIGlzT3ZlcixcbiAgICBpc1NvcnRpbmcsXG4gICAgaXNEcmFnZ2luZyxcbiAgICBsaXN0ZW5lcnMsXG4gICAgbm9kZSxcbiAgICBvdmVySW5kZXgsXG4gICAgb3ZlcixcbiAgICBzZXROb2RlUmVmLFxuICAgIHNldEFjdGl2YXRvck5vZGVSZWYsXG4gICAgc2V0RHJvcHBhYmxlTm9kZVJlZixcbiAgICBzZXREcmFnZ2FibGVOb2RlUmVmLFxuICAgIHRyYW5zZm9ybTogZGVyaXZlZFRyYW5zZm9ybSAhPSBudWxsID8gZGVyaXZlZFRyYW5zZm9ybSA6IGZpbmFsVHJhbnNmb3JtLFxuICAgIHRyYW5zaXRpb246IGdldFRyYW5zaXRpb24oKVxuICB9O1xuXG4gIGZ1bmN0aW9uIGdldFRyYW5zaXRpb24oKSB7XG4gICAgaWYgKCAvLyBUZW1wb3JhcmlseSBkaXNhYmxlIHRyYW5zaXRpb25zIGZvciBhIHNpbmdsZSBmcmFtZSB0byBzZXQgdXAgZGVyaXZlZCB0cmFuc2Zvcm1zXG4gICAgZGVyaXZlZFRyYW5zZm9ybSB8fCAvLyBPciB0byBwcmV2ZW50IGl0ZW1zIGp1bXBpbmcgdG8gYmFjayB0byB0aGVpciBcIm5ld1wiIHBvc2l0aW9uIHdoZW4gaXRlbXMgY2hhbmdlXG4gICAgaXRlbXNIYXZlQ2hhbmdlZCAmJiBwcmV2aW91cy5jdXJyZW50Lm5ld0luZGV4ID09PSBpbmRleCkge1xuICAgICAgcmV0dXJuIGRpc2FibGVkVHJhbnNpdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkRGlzcGxhY2VEcmFnU291cmNlICYmICFpc0tleWJvYXJkRXZlbnQoYWN0aXZhdG9yRXZlbnQpIHx8ICF0cmFuc2l0aW9uKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChpc1NvcnRpbmcgfHwgc2hvdWxkQW5pbWF0ZUxheW91dENoYW5nZXMpIHtcbiAgICAgIHJldHVybiBDU1MuVHJhbnNpdGlvbi50b1N0cmluZyh7IC4uLnRyYW5zaXRpb24sXG4gICAgICAgIHByb3BlcnR5OiB0cmFuc2l0aW9uUHJvcGVydHlcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxEaXNhYmxlZChsb2NhbERpc2FibGVkLCBnbG9iYWxEaXNhYmxlZCkge1xuICB2YXIgX2xvY2FsRGlzYWJsZWQkZHJhZ2dhLCBfbG9jYWxEaXNhYmxlZCRkcm9wcGE7XG5cbiAgaWYgKHR5cGVvZiBsb2NhbERpc2FibGVkID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZHJhZ2dhYmxlOiBsb2NhbERpc2FibGVkLFxuICAgICAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICAgIGRyb3BwYWJsZTogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkcmFnZ2FibGU6IChfbG9jYWxEaXNhYmxlZCRkcmFnZ2EgPSBsb2NhbERpc2FibGVkID09IG51bGwgPyB2b2lkIDAgOiBsb2NhbERpc2FibGVkLmRyYWdnYWJsZSkgIT0gbnVsbCA/IF9sb2NhbERpc2FibGVkJGRyYWdnYSA6IGdsb2JhbERpc2FibGVkLmRyYWdnYWJsZSxcbiAgICBkcm9wcGFibGU6IChfbG9jYWxEaXNhYmxlZCRkcm9wcGEgPSBsb2NhbERpc2FibGVkID09IG51bGwgPyB2b2lkIDAgOiBsb2NhbERpc2FibGVkLmRyb3BwYWJsZSkgIT0gbnVsbCA/IF9sb2NhbERpc2FibGVkJGRyb3BwYSA6IGdsb2JhbERpc2FibGVkLmRyb3BwYWJsZVxuICB9O1xufVxuXG5mdW5jdGlvbiBoYXNTb3J0YWJsZURhdGEoZW50cnkpIHtcbiAgaWYgKCFlbnRyeSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IGRhdGEgPSBlbnRyeS5kYXRhLmN1cnJlbnQ7XG5cbiAgaWYgKGRhdGEgJiYgJ3NvcnRhYmxlJyBpbiBkYXRhICYmIHR5cGVvZiBkYXRhLnNvcnRhYmxlID09PSAnb2JqZWN0JyAmJiAnY29udGFpbmVySWQnIGluIGRhdGEuc29ydGFibGUgJiYgJ2l0ZW1zJyBpbiBkYXRhLnNvcnRhYmxlICYmICdpbmRleCcgaW4gZGF0YS5zb3J0YWJsZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5jb25zdCBkaXJlY3Rpb25zID0gW0tleWJvYXJkQ29kZS5Eb3duLCBLZXlib2FyZENvZGUuUmlnaHQsIEtleWJvYXJkQ29kZS5VcCwgS2V5Ym9hcmRDb2RlLkxlZnRdO1xuY29uc3Qgc29ydGFibGVLZXlib2FyZENvb3JkaW5hdGVzID0gKGV2ZW50LCBfcmVmKSA9PiB7XG4gIGxldCB7XG4gICAgY29udGV4dDoge1xuICAgICAgYWN0aXZlLFxuICAgICAgY29sbGlzaW9uUmVjdCxcbiAgICAgIGRyb3BwYWJsZVJlY3RzLFxuICAgICAgZHJvcHBhYmxlQ29udGFpbmVycyxcbiAgICAgIG92ZXIsXG4gICAgICBzY3JvbGxhYmxlQW5jZXN0b3JzXG4gICAgfVxuICB9ID0gX3JlZjtcblxuICBpZiAoZGlyZWN0aW9ucy5pbmNsdWRlcyhldmVudC5jb2RlKSkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICBpZiAoIWFjdGl2ZSB8fCAhY29sbGlzaW9uUmVjdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbHRlcmVkQ29udGFpbmVycyA9IFtdO1xuICAgIGRyb3BwYWJsZUNvbnRhaW5lcnMuZ2V0RW5hYmxlZCgpLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgaWYgKCFlbnRyeSB8fCBlbnRyeSAhPSBudWxsICYmIGVudHJ5LmRpc2FibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVjdCA9IGRyb3BwYWJsZVJlY3RzLmdldChlbnRyeS5pZCk7XG5cbiAgICAgIGlmICghcmVjdCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAoZXZlbnQuY29kZSkge1xuICAgICAgICBjYXNlIEtleWJvYXJkQ29kZS5Eb3duOlxuICAgICAgICAgIGlmIChjb2xsaXNpb25SZWN0LnRvcCA8IHJlY3QudG9wKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZENvbnRhaW5lcnMucHVzaChlbnRyeSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBLZXlib2FyZENvZGUuVXA6XG4gICAgICAgICAgaWYgKGNvbGxpc2lvblJlY3QudG9wID4gcmVjdC50b3ApIHtcbiAgICAgICAgICAgIGZpbHRlcmVkQ29udGFpbmVycy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIEtleWJvYXJkQ29kZS5MZWZ0OlxuICAgICAgICAgIGlmIChjb2xsaXNpb25SZWN0LmxlZnQgPiByZWN0LmxlZnQpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkQ29udGFpbmVycy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIEtleWJvYXJkQ29kZS5SaWdodDpcbiAgICAgICAgICBpZiAoY29sbGlzaW9uUmVjdC5sZWZ0IDwgcmVjdC5sZWZ0KSB7XG4gICAgICAgICAgICBmaWx0ZXJlZENvbnRhaW5lcnMucHVzaChlbnRyeSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgY29sbGlzaW9ucyA9IGNsb3Nlc3RDb3JuZXJzKHtcbiAgICAgIGFjdGl2ZSxcbiAgICAgIGNvbGxpc2lvblJlY3Q6IGNvbGxpc2lvblJlY3QsXG4gICAgICBkcm9wcGFibGVSZWN0cyxcbiAgICAgIGRyb3BwYWJsZUNvbnRhaW5lcnM6IGZpbHRlcmVkQ29udGFpbmVycyxcbiAgICAgIHBvaW50ZXJDb29yZGluYXRlczogbnVsbFxuICAgIH0pO1xuICAgIGxldCBjbG9zZXN0SWQgPSBnZXRGaXJzdENvbGxpc2lvbihjb2xsaXNpb25zLCAnaWQnKTtcblxuICAgIGlmIChjbG9zZXN0SWQgPT09IChvdmVyID09IG51bGwgPyB2b2lkIDAgOiBvdmVyLmlkKSAmJiBjb2xsaXNpb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgIGNsb3Nlc3RJZCA9IGNvbGxpc2lvbnNbMV0uaWQ7XG4gICAgfVxuXG4gICAgaWYgKGNsb3Nlc3RJZCAhPSBudWxsKSB7XG4gICAgICBjb25zdCBhY3RpdmVEcm9wcGFibGUgPSBkcm9wcGFibGVDb250YWluZXJzLmdldChhY3RpdmUuaWQpO1xuICAgICAgY29uc3QgbmV3RHJvcHBhYmxlID0gZHJvcHBhYmxlQ29udGFpbmVycy5nZXQoY2xvc2VzdElkKTtcbiAgICAgIGNvbnN0IG5ld1JlY3QgPSBuZXdEcm9wcGFibGUgPyBkcm9wcGFibGVSZWN0cy5nZXQobmV3RHJvcHBhYmxlLmlkKSA6IG51bGw7XG4gICAgICBjb25zdCBuZXdOb2RlID0gbmV3RHJvcHBhYmxlID09IG51bGwgPyB2b2lkIDAgOiBuZXdEcm9wcGFibGUubm9kZS5jdXJyZW50O1xuXG4gICAgICBpZiAobmV3Tm9kZSAmJiBuZXdSZWN0ICYmIGFjdGl2ZURyb3BwYWJsZSAmJiBuZXdEcm9wcGFibGUpIHtcbiAgICAgICAgY29uc3QgbmV3U2Nyb2xsQW5jZXN0b3JzID0gZ2V0U2Nyb2xsYWJsZUFuY2VzdG9ycyhuZXdOb2RlKTtcbiAgICAgICAgY29uc3QgaGFzRGlmZmVyZW50U2Nyb2xsQW5jZXN0b3JzID0gbmV3U2Nyb2xsQW5jZXN0b3JzLnNvbWUoKGVsZW1lbnQsIGluZGV4KSA9PiBzY3JvbGxhYmxlQW5jZXN0b3JzW2luZGV4XSAhPT0gZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IGhhc1NhbWVDb250YWluZXIgPSBpc1NhbWVDb250YWluZXIoYWN0aXZlRHJvcHBhYmxlLCBuZXdEcm9wcGFibGUpO1xuICAgICAgICBjb25zdCBpc0FmdGVyQWN0aXZlID0gaXNBZnRlcihhY3RpdmVEcm9wcGFibGUsIG5ld0Ryb3BwYWJsZSk7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IGhhc0RpZmZlcmVudFNjcm9sbEFuY2VzdG9ycyB8fCAhaGFzU2FtZUNvbnRhaW5lciA/IHtcbiAgICAgICAgICB4OiAwLFxuICAgICAgICAgIHk6IDBcbiAgICAgICAgfSA6IHtcbiAgICAgICAgICB4OiBpc0FmdGVyQWN0aXZlID8gY29sbGlzaW9uUmVjdC53aWR0aCAtIG5ld1JlY3Qud2lkdGggOiAwLFxuICAgICAgICAgIHk6IGlzQWZ0ZXJBY3RpdmUgPyBjb2xsaXNpb25SZWN0LmhlaWdodCAtIG5ld1JlY3QuaGVpZ2h0IDogMFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZWN0Q29vcmRpbmF0ZXMgPSB7XG4gICAgICAgICAgeDogbmV3UmVjdC5sZWZ0LFxuICAgICAgICAgIHk6IG5ld1JlY3QudG9wXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IG5ld0Nvb3JkaW5hdGVzID0gb2Zmc2V0LnggJiYgb2Zmc2V0LnkgPyByZWN0Q29vcmRpbmF0ZXMgOiBzdWJ0cmFjdChyZWN0Q29vcmRpbmF0ZXMsIG9mZnNldCk7XG4gICAgICAgIHJldHVybiBuZXdDb29yZGluYXRlcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuZnVuY3Rpb24gaXNTYW1lQ29udGFpbmVyKGEsIGIpIHtcbiAgaWYgKCFoYXNTb3J0YWJsZURhdGEoYSkgfHwgIWhhc1NvcnRhYmxlRGF0YShiKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBhLmRhdGEuY3VycmVudC5zb3J0YWJsZS5jb250YWluZXJJZCA9PT0gYi5kYXRhLmN1cnJlbnQuc29ydGFibGUuY29udGFpbmVySWQ7XG59XG5cbmZ1bmN0aW9uIGlzQWZ0ZXIoYSwgYikge1xuICBpZiAoIWhhc1NvcnRhYmxlRGF0YShhKSB8fCAhaGFzU29ydGFibGVEYXRhKGIpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCFpc1NhbWVDb250YWluZXIoYSwgYikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gYS5kYXRhLmN1cnJlbnQuc29ydGFibGUuaW5kZXggPCBiLmRhdGEuY3VycmVudC5zb3J0YWJsZS5pbmRleDtcbn1cblxuZXhwb3J0IHsgU29ydGFibGVDb250ZXh0LCBhcnJheU1vdmUsIGFycmF5U3dhcCwgZGVmYXVsdEFuaW1hdGVMYXlvdXRDaGFuZ2VzLCBkZWZhdWx0TmV3SW5kZXhHZXR0ZXIsIGhhc1NvcnRhYmxlRGF0YSwgaG9yaXpvbnRhbExpc3RTb3J0aW5nU3RyYXRlZ3ksIHJlY3RTb3J0aW5nU3RyYXRlZ3ksIHJlY3RTd2FwcGluZ1N0cmF0ZWd5LCBzb3J0YWJsZUtleWJvYXJkQ29vcmRpbmF0ZXMsIHVzZVNvcnRhYmxlLCB2ZXJ0aWNhbExpc3RTb3J0aW5nU3RyYXRlZ3kgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNvcnRhYmxlLmVzbS5qcy5tYXBcbiIsImltcG9ydCBSZWFjdCwgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gXCJjbGFzc25hbWVzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRkFRSXRlbUFjdGlvbnNQcm9wcyB7XG4gICAgb25FZGl0OiAoKSA9PiB2b2lkO1xuICAgIG9uRGVsZXRlOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIEFjdGlvbiBidXR0b25zIGZvciBlZGl0aW5nIG1vZGUgLSBFZGl0IGFuZCBEZWxldGVcbiAqIE5vdGU6IE1vdmUgdXAvZG93biBoYXMgYmVlbiByZXBsYWNlZCB3aXRoIGRyYWctYW5kLWRyb3AgcmVvcmRlcmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gRkFRSXRlbUFjdGlvbnMocHJvcHM6IEZBUUl0ZW1BY3Rpb25zUHJvcHMpOiBSZWFjdEVsZW1lbnQge1xuICAgIGNvbnN0IHsgb25FZGl0LCBvbkRlbGV0ZSB9ID0gcHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLWFjdGlvbnNcIj5cbiAgICAgICAgICAgIHsvKiBFZGl0IEJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbS1hY3Rpb24tYnRuXCIsIFwiZmFxLWFjdGlvbi1lZGl0XCIpfVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIG9uRWRpdCgpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgdGl0bGU9XCJFZGl0IEZBUVwiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkVkaXQgRkFRIGl0ZW1cIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xMi44NTQgMS4xNDZhLjUuNSAwIDAgMC0uNzA4IDBMMTAgMy4yOTMgMTIuNzA3IDZsMi4xNDctMi4xNDZhLjUuNSAwIDAgMCAwLS43MDhsLTItMnpNMTEuMjkzIDRMMiAxMy4yOTNWMTZoMi43MDdMMTQgNi43MDcgMTEuMjkzIDR6XCIgLz5cbiAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICB7LyogRGVsZXRlIEJ1dHRvbiAqL31cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoXCJmYXEtaXRlbS1hY3Rpb24tYnRuXCIsIFwiZmFxLWFjdGlvbi1kZWxldGVcIil9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGUoKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHRpdGxlPVwiRGVsZXRlIEZBUVwiXG4gICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkRlbGV0ZSBGQVEgaXRlbVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiMTZcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTUuNSA1LjVBLjUuNSAwIDAgMSA2IDZ2NmEuNS41IDAgMCAxLTEgMFY2YS41LjUgMCAwIDEgLjUtLjV6bTIuNSAwYS41LjUgMCAwIDEgLjUuNXY2YS41LjUgMCAwIDEtMSAwVjZhLjUuNSAwIDAgMSAuNS0uNXptMyAuNWEuNS41IDAgMCAwLTEgMHY2YS41LjUgMCAwIDAgMSAwVjZ6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxSdWxlPVwiZXZlbm9kZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkPVwiTTE0LjUgM2ExIDEgMCAwIDEtMSAxSDEzdjlhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWNGgtLjVhMSAxIDAgMCAxLTEtMVYyYTEgMSAwIDAgMSAxLTFINmExIDEgMCAwIDEgMS0xaDJhMSAxIDAgMCAxIDEgMWgzLjVhMSAxIDAgMCAxIDEgMXYxek00LjExOCA0TDQgNC4wNTlWMTNhMSAxIDAgMCAwIDEgMWg2YTEgMSAwIDAgMCAxLTFWNC4wNTlMMTEuODgyIDRINC4xMTh6TTIuNSAzVjJoMTF2MWgtMTF6XCJcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyB1c2VTb3J0YWJsZSB9IGZyb20gXCJAZG5kLWtpdC9zb3J0YWJsZVwiO1xuaW1wb3J0IHsgQ1NTIH0gZnJvbSBcIkBkbmQta2l0L3V0aWxpdGllc1wiO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSBcImNsYXNzbmFtZXNcIjtcbmltcG9ydCB7IEZBUUl0ZW1BY3Rpb25zIH0gZnJvbSBcIi4vRkFRSXRlbUFjdGlvbnNcIjtcblxuaW50ZXJmYWNlIERyYWdnYWJsZUZBUUl0ZW1Qcm9wcyB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIHN1bW1hcnk6IHN0cmluZztcbiAgICBwcm9jZXNzZWRDb250ZW50OiBzdHJpbmc7XG4gICAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICAgIGFuaW1hdGlvbkR1cmF0aW9uOiBudW1iZXI7XG4gICAgb25FZGl0OiAoKSA9PiB2b2lkO1xuICAgIG9uRGVsZXRlOiAoKSA9PiB2b2lkO1xuICAgIGNvbGxhcHNlQWxsPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIERyYWdnYWJsZUZBUUl0ZW0oe1xuICAgIGlkLFxuICAgIGluZGV4LFxuICAgIHN1bW1hcnksXG4gICAgcHJvY2Vzc2VkQ29udGVudCxcbiAgICB3YXJuaW5ncyxcbiAgICBhbmltYXRpb25EdXJhdGlvbixcbiAgICBvbkVkaXQsXG4gICAgb25EZWxldGUsXG4gICAgY29sbGFwc2VBbGwgPSBmYWxzZVxufTogRHJhZ2dhYmxlRkFRSXRlbVByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7IGF0dHJpYnV0ZXMsIGxpc3RlbmVycywgc2V0Tm9kZVJlZiwgdHJhbnNmb3JtLCB0cmFuc2l0aW9uLCBpc0RyYWdnaW5nIH0gPSB1c2VTb3J0YWJsZSh7XG4gICAgICAgIGlkXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgdHJhbnNmb3JtOiBDU1MuVHJhbnNmb3JtLnRvU3RyaW5nKHRyYW5zZm9ybSksXG4gICAgICAgIHRyYW5zaXRpb24sXG4gICAgICAgIFwiLS1hbmltYXRpb24tZHVyYXRpb25cIjogYCR7YW5pbWF0aW9uRHVyYXRpb259bXNgXG4gICAgfSBhcyBSZWFjdC5DU1NQcm9wZXJ0aWVzO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdlxuICAgICAgICAgICAgcmVmPXtzZXROb2RlUmVmfVxuICAgICAgICAgICAgc3R5bGU9e3N0eWxlfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWl0ZW1cIiwgXCJmYXEtaXRlbS0tZWRpdC1tb2RlXCIsIHtcbiAgICAgICAgICAgICAgICBvcGVuOiAhY29sbGFwc2VBbGwsXG4gICAgICAgICAgICAgICAgXCJmYXEtaXRlbS0tZHJhZ2dpbmdcIjogaXNEcmFnZ2luZ1xuICAgICAgICAgICAgfSl9XG4gICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0taGVhZGVyLWVkaXRcIj5cbiAgICAgICAgICAgICAgICB7LyogRHJhZyBIYW5kbGUgKi99XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZHJhZy1oYW5kbGVcIlxuICAgICAgICAgICAgICAgICAgICB7Li4uYXR0cmlidXRlc31cbiAgICAgICAgICAgICAgICAgICAgey4uLmxpc3RlbmVyc31cbiAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD17YERyYWcgdG8gcmVvcmRlciBGQVEgaXRlbSAke2luZGV4ICsgMX06ICR7c3VtbWFyeX1gfVxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxzdmcgZm9jdXNhYmxlPVwiZmFsc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTExIDE4YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMm0tMi04Yy0xLjEgMC0yIC45LTIgMnMuOSAyIDIgMiAyLS45IDItMi0uOS0yLTItMm0wLTZjLTEuMSAwLTIgLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0ybTYgNGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJtMCAyYy0xLjEgMC0yIC45LTIgMnMuOSAyIDIgMiAyLS45IDItMi0uOS0yLTItMm0wIDZjLTEuMSAwLTIgLjktMiAycy45IDIgMiAyIDItLjkgMi0yLS45LTItMi0yXCI+PC9wYXRoPlxuICAgICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhcS1pdGVtLXN1bW1hcnktdGV4dFwiPntzdW1tYXJ5fTwvc3Bhbj5cblxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxGQVFJdGVtQWN0aW9ucyBvbkVkaXQ9e29uRWRpdH0gb25EZWxldGU9e29uRGVsZXRlfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1pdGVtLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICB7d2FybmluZ3MubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0td2FybmluZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt3YXJuaW5ncy5tYXAoKHdhcm5pbmcsIHdJbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXt3SW5kZXh9IGNsYXNzTmFtZT1cImZhcS1pdGVtLXdhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4pqg77iPIHt3YXJuaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtaXRlbS1jb250ZW50LWlubmVyXCJcbiAgICAgICAgICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3sgX19odG1sOiBwcm9jZXNzZWRDb250ZW50IH19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50LCB1c2VTdGF0ZSB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQ29udGVudEZvcm1hdEVudW0gfSBmcm9tIFwiLi4vLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuaW1wb3J0IHsgcHJvY2Vzc0NvbnRlbnQsIGdldENvbnRlbnRXYXJuaW5ncyB9IGZyb20gXCIuLi91dGlscy9jb250ZW50UHJvY2Vzc29yXCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5pbnRlcmZhY2UgRWRpdEZBUUZvcm1Qcm9wcyB7XG4gICAgc3VtbWFyeTogc3RyaW5nO1xuICAgIGNvbnRlbnQ6IHN0cmluZztcbiAgICBmb3JtYXQ6IENvbnRlbnRGb3JtYXRFbnVtO1xuICAgIHNvcnRPcmRlcj86IG51bWJlcjtcbiAgICBvblNhdmU6IChcbiAgICAgICAgc3VtbWFyeTogc3RyaW5nLFxuICAgICAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0sXG4gICAgICAgIHNvcnRPcmRlcjogbnVtYmVyXG4gICAgKSA9PiB2b2lkO1xuICAgIG9uQ2FuY2VsOiAoKSA9PiB2b2lkO1xuICAgIGlzTmV3PzogYm9vbGVhbjtcbiAgICBpc0lubGluZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBFZGl0RkFRRm9ybShwcm9wczogRWRpdEZBUUZvcm1Qcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgY29uc3Qge1xuICAgICAgICBzdW1tYXJ5OiBpbml0aWFsU3VtbWFyeSxcbiAgICAgICAgY29udGVudDogaW5pdGlhbENvbnRlbnQsXG4gICAgICAgIGZvcm1hdDogaW5pdGlhbEZvcm1hdCxcbiAgICAgICAgc29ydE9yZGVyOiBpbml0aWFsU29ydE9yZGVyID0gMTAsXG4gICAgICAgIG9uU2F2ZSxcbiAgICAgICAgb25DYW5jZWwsXG4gICAgICAgIGlzTmV3ID0gZmFsc2UsXG4gICAgICAgIGlzSW5saW5lID0gZmFsc2VcbiAgICB9ID0gcHJvcHM7XG5cbiAgICBjb25zdCBbc3VtbWFyeSwgc2V0U3VtbWFyeV0gPSB1c2VTdGF0ZShpbml0aWFsU3VtbWFyeSk7XG4gICAgY29uc3QgW2NvbnRlbnQsIHNldENvbnRlbnRdID0gdXNlU3RhdGUoaW5pdGlhbENvbnRlbnQpO1xuICAgIGNvbnN0IFtmb3JtYXQsIHNldEZvcm1hdF0gPSB1c2VTdGF0ZTxDb250ZW50Rm9ybWF0RW51bT4oaW5pdGlhbEZvcm1hdCk7XG4gICAgY29uc3QgW3NvcnRPcmRlciwgc2V0U29ydE9yZGVyXSA9IHVzZVN0YXRlKGluaXRpYWxTb3J0T3JkZXIpO1xuICAgIGNvbnN0IFtzaG93UHJldmlldywgc2V0U2hvd1ByZXZpZXddID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gICAgLy8gVmFsaWRhdGlvbiB3YXJuaW5nc1xuICAgIGNvbnN0IHdhcm5pbmdzID0gZ2V0Q29udGVudFdhcm5pbmdzKGNvbnRlbnQsIGZvcm1hdCk7XG4gICAgY29uc3QgaGFzV2FybmluZ3MgPSB3YXJuaW5ncy5sZW5ndGggPiAwO1xuXG4gICAgY29uc3QgaGFuZGxlU2F2ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFzdW1tYXJ5LnRyaW0oKSkge1xuICAgICAgICAgICAgYWxlcnQoXCJTdW1tYXJ5L1F1ZXN0aW9uIGlzIHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29udGVudC50cmltKCkpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiQ29udGVudC9BbnN3ZXIgaXMgcmVxdWlyZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb25TYXZlKHN1bW1hcnkudHJpbSgpLCBjb250ZW50LnRyaW0oKSwgZm9ybWF0LCBzb3J0T3JkZXIpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1lZGl0LWZvcm1cIiwgeyBcImZhcS1lZGl0LWZvcm0tLWlubGluZVwiOiBpc0lubGluZSB9KX0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1lZGl0LWZvcm0taGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgPGgzPntpc05ldyA/IFwiQWRkIE5ldyBGQVFcIiA6IFwiRWRpdCBGQVFcIn08L2gzPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWVkaXQtZm9ybS1jbG9zZVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgYXJpYS1sYWJlbD1cIkNsb3NlXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIOKclVxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWVkaXQtZm9ybS1ib2R5XCI+XG4gICAgICAgICAgICAgICAgey8qIFN1bW1hcnkgRmllbGQgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZm9ybS1maWVsZFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cImZhcS1zdW1tYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBRdWVzdGlvbi9TdW1tYXJ5IDxzcGFuIGNsYXNzTmFtZT1cImZhcS1yZXF1aXJlZFwiPio8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJmYXEtc3VtbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZm9ybS1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17c3VtbWFyeX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0U3VtbWFyeShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkVudGVyIHRoZSBxdWVzdGlvbiBvciBzdW1tYXJ5Li4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogU29ydCBPcmRlciBGaWVsZCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZmFxLXNvcnRvcmRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgU29ydCBPcmRlciA8c3BhbiBjbGFzc05hbWU9XCJmYXEtcmVxdWlyZWRcIj4qPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiZmFxLXNvcnRvcmRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1mb3JtLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzb3J0T3JkZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNvcnRPcmRlcihOdW1iZXIoZS50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW49XCIwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA9XCIxMFwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzc05hbWU9XCJmYXEtZm9ybS1oZWxwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBJdGVtcyBhcmUgZGlzcGxheWVkIGluIGFzY2VuZGluZyBzb3J0IG9yZGVyICgxMCwgMjAsIDMwLi4uKS4gTG93ZXIgbnVtYmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwZWFyIGZpcnN0LlxuICAgICAgICAgICAgICAgICAgICA8L3NtYWxsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIEZvcm1hdCBGaWVsZCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1mb3JtLWZpZWxkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwiZmFxLWZvcm1hdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQ29udGVudCBGb3JtYXQgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLXJlcXVpcmVkXCI+Kjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ9XCJmYXEtZm9ybWF0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1mb3JtLXNlbGVjdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybWF0fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRGb3JtYXQoZS50YXJnZXQudmFsdWUgYXMgQ29udGVudEZvcm1hdEVudW0pfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiaHRtbFwiPkhUTUw8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJtYXJrZG93blwiPk1hcmtkb3duPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwidGV4dFwiPlBsYWluIFRleHQ8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDxzbWFsbCBjbGFzc05hbWU9XCJmYXEtZm9ybS1oZWxwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0ID09PSBcImh0bWxcIiAmJiBcIkFsbG93cyByaWNoIGZvcm1hdHRpbmcgd2l0aCBIVE1MIHRhZ3NcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtmb3JtYXQgPT09IFwibWFya2Rvd25cIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVXNlcyBNYXJrZG93biBzeW50YXggKGUuZy4sICoqYm9sZCoqLCAjIGhlYWRpbmcpXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICB7Zm9ybWF0ID09PSBcInRleHRcIiAmJiBcIlBsYWluIHRleHQgb25seSwgSFRNTCB3aWxsIGJlIGVzY2FwZWRcIn1cbiAgICAgICAgICAgICAgICAgICAgPC9zbWFsbD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBDb250ZW50IEZpZWxkICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9XCJmYXEtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQW5zd2VyL0NvbnRlbnQgPHNwYW4gY2xhc3NOYW1lPVwiZmFxLXJlcXVpcmVkXCI+Kjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPHRleHRhcmVhXG4gICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZhcS1jb250ZW50XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1mb3JtLXRleHRhcmVhXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZhcS1mb3JtLXRleHRhcmVhLS13YXJuaW5nXCI6IGhhc1dhcm5pbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRDb250ZW50KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgdGhlIGFuc3dlciBvciBjb250ZW50Li4uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezEwfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgICAgICB7LyogVmFsaWRhdGlvbiBXYXJuaW5ncyAqL31cbiAgICAgICAgICAgICAgICAgICAge2hhc1dhcm5pbmdzICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0td2FybmluZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPuKaoO+4jyBDb250ZW50IFdhcm5pbmdzOjwvc3Ryb25nPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3dhcm5pbmdzLm1hcCgod2FybmluZywgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGtleT17aX0+e3dhcm5pbmd9PC9saT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIFByZXZpZXcgVG9nZ2xlICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tZmllbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtcHJldmlldy10b2dnbGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd1ByZXZpZXcoIXNob3dQcmV2aWV3KX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge3Nob3dQcmV2aWV3ID8gXCJIaWRlXCIgOiBcIlNob3dcIn0gUHJldmlld1xuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIHsvKiBQcmV2aWV3ICovfVxuICAgICAgICAgICAgICAgIHtzaG93UHJldmlldyAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWZvcm0tcHJldmlld1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg0PlByZXZpZXc6PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtZm9ybS1wcmV2aWV3LWNvbnRlbnRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogcHJvY2Vzc0NvbnRlbnQoY29udGVudCwgZm9ybWF0KSB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogRm9ybSBBY3Rpb25zICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtZWRpdC1mb3JtLWZvb3RlclwiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImZhcS1idG4gZmFxLWJ0bi1zZWNvbmRhcnlcIiBvbkNsaWNrPXtvbkNhbmNlbH0+XG4gICAgICAgICAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1idG4gZmFxLWJ0bi1wcmltYXJ5XCJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU2F2ZX1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFzdW1tYXJ5LnRyaW0oKSB8fCAhY29udGVudC50cmltKCl9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7aXNOZXcgPyBcIkNyZWF0ZSBGQVFcIiA6IFwiU2F2ZSBDaGFuZ2VzXCJ9XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHByb2Nlc3NDb250ZW50LCBnZXRDb250ZW50V2FybmluZ3MgfSBmcm9tIFwiLi4vdXRpbHMvY29udGVudFByb2Nlc3NvclwiO1xuaW1wb3J0IHsgRHJhZ2dhYmxlRkFRSXRlbSB9IGZyb20gXCIuL0RyYWdnYWJsZUZBUUl0ZW1cIjtcbmltcG9ydCB7IEVkaXRGQVFGb3JtIH0gZnJvbSBcIi4vRWRpdEZBUUZvcm1cIjtcbmltcG9ydCB7IEZBUUl0ZW0gfSBmcm9tIFwiLi4vaG9va3MvdXNlRkFRRGF0YVwiO1xuaW1wb3J0IHsgQ29udGVudEZvcm1hdEVudW0gfSBmcm9tIFwiLi4vLi4vdHlwaW5ncy9GQVFBY2NvcmRpb25Qcm9wc1wiO1xuaW1wb3J0IHtcbiAgICBEbmRDb250ZXh0LFxuICAgIGNsb3Nlc3RDZW50ZXIsXG4gICAgS2V5Ym9hcmRTZW5zb3IsXG4gICAgUG9pbnRlclNlbnNvcixcbiAgICB1c2VTZW5zb3IsXG4gICAgdXNlU2Vuc29ycyxcbiAgICBEcmFnRW5kRXZlbnQsXG4gICAgRHJhZ1N0YXJ0RXZlbnRcbn0gZnJvbSBcIkBkbmQta2l0L2NvcmVcIjtcbmltcG9ydCB7XG4gICAgU29ydGFibGVDb250ZXh0LFxuICAgIHNvcnRhYmxlS2V5Ym9hcmRDb29yZGluYXRlcyxcbiAgICB2ZXJ0aWNhbExpc3RTb3J0aW5nU3RyYXRlZ3lcbn0gZnJvbSBcIkBkbmQta2l0L3NvcnRhYmxlXCI7XG5cbmludGVyZmFjZSBGQVFFZGl0YWJsZUxpc3RQcm9wcyB7XG4gICAgaXRlbXM6IEZBUUl0ZW1bXTtcbiAgICBzb3J0YWJsZUlkczogc3RyaW5nW107XG4gICAgZXhwYW5kZWRJdGVtczogU2V0PG51bWJlcj47XG4gICAgYW5pbWF0aW9uRHVyYXRpb246IG51bWJlcjtcbiAgICBvbkVkaXRJdGVtOiAoaW5kZXg6IG51bWJlcikgPT4gdm9pZDtcbiAgICBvbkRlbGV0ZUl0ZW06IChpbmRleDogbnVtYmVyKSA9PiB2b2lkO1xuICAgIG9uRHJhZ0VuZDogKGV2ZW50OiBEcmFnRW5kRXZlbnQpID0+IHZvaWQ7XG4gICAgLy8gSW5saW5lIGVkaXRpbmcgcHJvcHNcbiAgICBlZGl0aW5nSXRlbUluZGV4OiBudW1iZXIgfCBudWxsO1xuICAgIGVkaXRpbmdTb3J0T3JkZXI6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICBkZWZhdWx0U29ydE9yZGVyOiBudW1iZXI7XG4gICAgb25TYXZlRWRpdDogKFxuICAgICAgICBzdW1tYXJ5OiBzdHJpbmcsXG4gICAgICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICAgICAgZm9ybWF0OiBDb250ZW50Rm9ybWF0RW51bSxcbiAgICAgICAgc29ydE9yZGVyOiBudW1iZXJcbiAgICApID0+IFByb21pc2U8dm9pZD47XG4gICAgb25DYW5jZWxFZGl0OiAoKSA9PiB2b2lkO1xuICAgIC8vIElubGluZSBjcmVhdGUgcHJvcHNcbiAgICBzaG93Q3JlYXRlRm9ybTogYm9vbGVhbjtcbiAgICBvblNhdmVOZXc6IChcbiAgICAgICAgc3VtbWFyeTogc3RyaW5nLFxuICAgICAgICBjb250ZW50OiBzdHJpbmcsXG4gICAgICAgIGZvcm1hdDogQ29udGVudEZvcm1hdEVudW0sXG4gICAgICAgIHNvcnRPcmRlcjogbnVtYmVyXG4gICAgKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgIG9uQ2FuY2VsQ3JlYXRlOiAoKSA9PiB2b2lkO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIEZBUSBpdGVtcyBsaXN0IGluIGVkaXQgbW9kZSB3aXRoIGRyYWctYW5kLWRyb3AgcmVvcmRlcmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gRkFRRWRpdGFibGVMaXN0KHtcbiAgICBpdGVtcyxcbiAgICBzb3J0YWJsZUlkcyxcbiAgICBleHBhbmRlZEl0ZW1zLFxuICAgIGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgIG9uRWRpdEl0ZW0sXG4gICAgb25EZWxldGVJdGVtLFxuICAgIG9uRHJhZ0VuZCxcbiAgICBlZGl0aW5nSXRlbUluZGV4LFxuICAgIGVkaXRpbmdTb3J0T3JkZXIsXG4gICAgZGVmYXVsdFNvcnRPcmRlcixcbiAgICBvblNhdmVFZGl0LFxuICAgIG9uQ2FuY2VsRWRpdCxcbiAgICBzaG93Q3JlYXRlRm9ybSxcbiAgICBvblNhdmVOZXcsXG4gICAgb25DYW5jZWxDcmVhdGVcbn06IEZBUUVkaXRhYmxlTGlzdFByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCBbaXNEcmFnZ2luZ0FueSwgc2V0SXNEcmFnZ2luZ0FueV0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgICBjb25zdCBzZW5zb3JzID0gdXNlU2Vuc29ycyhcbiAgICAgICAgdXNlU2Vuc29yKFBvaW50ZXJTZW5zb3IsIHtcbiAgICAgICAgICAgIGFjdGl2YXRpb25Db25zdHJhaW50OiB7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2U6IDhcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIHVzZVNlbnNvcihLZXlib2FyZFNlbnNvciwge1xuICAgICAgICAgICAgY29vcmRpbmF0ZUdldHRlcjogc29ydGFibGVLZXlib2FyZENvb3JkaW5hdGVzXG4gICAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IGhhbmRsZURyYWdTdGFydCA9IChfZXZlbnQ6IERyYWdTdGFydEV2ZW50KSA9PiB7XG4gICAgICAgIHNldElzRHJhZ2dpbmdBbnkodHJ1ZSk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZURyYWdFbmQgPSAoZXZlbnQ6IERyYWdFbmRFdmVudCkgPT4ge1xuICAgICAgICBzZXRJc0RyYWdnaW5nQW55KGZhbHNlKTtcbiAgICAgICAgb25EcmFnRW5kKGV2ZW50KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPERuZENvbnRleHRcbiAgICAgICAgICAgIHNlbnNvcnM9e3NlbnNvcnN9XG4gICAgICAgICAgICBjb2xsaXNpb25EZXRlY3Rpb249e2Nsb3Nlc3RDZW50ZXJ9XG4gICAgICAgICAgICBvbkRyYWdTdGFydD17aGFuZGxlRHJhZ1N0YXJ0fVxuICAgICAgICAgICAgb25EcmFnRW5kPXtoYW5kbGVEcmFnRW5kfVxuICAgICAgICA+XG4gICAgICAgICAgICA8U29ydGFibGVDb250ZXh0IGl0ZW1zPXtzb3J0YWJsZUlkc30gc3RyYXRlZ3k9e3ZlcnRpY2FsTGlzdFNvcnRpbmdTdHJhdGVneX0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWl0ZW1zIGZhcS1hY2NvcmRpb24taXRlbXMtLWVkaXQtbW9kZVwiPlxuICAgICAgICAgICAgICAgICAgICB7LyogSW5saW5lIENyZWF0ZSBGb3JtIC0gYXBwZWFycyBhdCB0b3Agb2YgbGlzdCAqL31cbiAgICAgICAgICAgICAgICAgICAge3Nob3dDcmVhdGVGb3JtICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWl0ZW0gZmFxLWl0ZW0tLWlubGluZS1jcmVhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEZBUUZvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeT1cIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ9XCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ9XCJodG1sXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ydE9yZGVyPXtkZWZhdWx0U29ydE9yZGVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblNhdmU9e29uU2F2ZU5ld31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsQ3JlYXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc05ldz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNJbmxpbmU9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgICAgICAgIHtpdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGl0ZW0gaXMgYmVpbmcgZWRpdGVkLCBzaG93IHRoZSBpbmxpbmUgZm9ybVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRpbmdJdGVtSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzb3J0YWJsZUlkc1tpbmRleF19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmYXEtaXRlbSBmYXEtaXRlbS0taW5saW5lLWVkaXRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RWRpdEZBUUZvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5PXtpdGVtLnN1bW1hcnl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudD17aXRlbS5jb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdD17aXRlbS5jb250ZW50Rm9ybWF0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRPcmRlcj17ZWRpdGluZ1NvcnRPcmRlciA/PyBkZWZhdWx0U29ydE9yZGVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2F2ZT17b25TYXZlRWRpdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNhbmNlbD17b25DYW5jZWxFZGl0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTmV3PXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0lubGluZT17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvbnRlbnQgPSBwcm9jZXNzQ29udGVudChpdGVtLmNvbnRlbnQsIGl0ZW0uY29udGVudEZvcm1hdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3YXJuaW5ncyA9IGdldENvbnRlbnRXYXJuaW5ncyhpdGVtLmNvbnRlbnQsIGl0ZW0uY29udGVudEZvcm1hdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPERyYWdnYWJsZUZBUUl0ZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtzb3J0YWJsZUlkc1tpbmRleF19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPXtzb3J0YWJsZUlkc1tpbmRleF19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4PXtpbmRleH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeT17aXRlbS5zdW1tYXJ5fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRDb250ZW50PXtwcm9jZXNzZWRDb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5ncz17d2FybmluZ3N9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uPXthbmltYXRpb25EdXJhdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25FZGl0PXsoKSA9PiBvbkVkaXRJdGVtKGluZGV4KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EZWxldGU9eygpID0+IG9uRGVsZXRlSXRlbShpbmRleCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxhcHNlQWxsPXtpc0RyYWdnaW5nQW55fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvU29ydGFibGVDb250ZXh0PlxuICAgICAgICA8L0RuZENvbnRleHQ+XG4gICAgKTtcbn1cbiIsImltcG9ydCB7IFJlYWN0RWxlbWVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tIFwiY2xhc3NuYW1lc1wiO1xuXG5pbnRlcmZhY2UgQ29uZmlybURpYWxvZ1Byb3BzIHtcbiAgICBpc09wZW46IGJvb2xlYW47XG4gICAgdGl0bGU6IHN0cmluZztcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgb25Db25maXJtOiAoKSA9PiB2b2lkO1xuICAgIG9uQ2FuY2VsOiAoKSA9PiB2b2lkO1xuICAgIGNvbmZpcm1UZXh0Pzogc3RyaW5nO1xuICAgIGNhbmNlbFRleHQ/OiBzdHJpbmc7XG4gICAgaXNEZXN0cnVjdGl2ZT86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29uZmlybWF0aW9uIGRpYWxvZyBtb2RhbCBmb3IgZGVzdHJ1Y3RpdmUgYWN0aW9ucyAoZS5nLiwgZGVsZXRlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gQ29uZmlybURpYWxvZyhwcm9wczogQ29uZmlybURpYWxvZ1Byb3BzKTogUmVhY3RFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3Qge1xuICAgICAgICBpc09wZW4sXG4gICAgICAgIHRpdGxlLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBvbkNvbmZpcm0sXG4gICAgICAgIG9uQ2FuY2VsLFxuICAgICAgICBjb25maXJtVGV4dCA9IFwiQ29uZmlybVwiLFxuICAgICAgICBjYW5jZWxUZXh0ID0gXCJDYW5jZWxcIixcbiAgICAgICAgaXNEZXN0cnVjdGl2ZSA9IGZhbHNlXG4gICAgfSA9IHByb3BzO1xuXG4gICAgaWYgKCFpc09wZW4pIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaGFuZGxlT3ZlcmxheUNsaWNrID0gKGU6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTERpdkVsZW1lbnQ+KSA9PiB7XG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gZS5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICBvbkNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy1vdmVybGF5XCJcbiAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZU92ZXJsYXlDbGlja31cbiAgICAgICAgICAgIHJvbGU9XCJwcmVzZW50YXRpb25cIlxuICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmFxLWNvbmZpcm0tZGlhbG9nXCJcbiAgICAgICAgICAgICAgICByb2xlPVwiYWxlcnRkaWFsb2dcIlxuICAgICAgICAgICAgICAgIGFyaWEtbGFiZWxsZWRieT1cImRpYWxvZy10aXRsZVwiXG4gICAgICAgICAgICAgICAgYXJpYS1kZXNjcmliZWRieT1cImRpYWxvZy1tZXNzYWdlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAge2lzRGVzdHJ1Y3RpdmUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy1pY29uLXdhcm5pbmdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPVwiMjRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD1cIjI0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3Qm94PVwiMCAwIDE2IDE2XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsPVwiY3VycmVudENvbG9yXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiTTguOTgyIDEuNTY2YTEuMTMgMS4xMyAwIDAgMC0xLjk2IDBMLjE2NSAxMy4yMzNjLS40NTcuNzc4LjA5MSAxLjc2Ny45OCAxLjc2N2gxMy43MTNjLjg4OSAwIDEuNDM4LS45OS45OC0xLjc2N0w4Ljk4MiAxLjU2NnpNOCA1Yy41MzUgMCAuOTU0LjQ2Mi45Ljk5NWwtLjM1IDMuNTA3YS41NTIuNTUyIDAgMCAxLTEuMSAwTDcuMSA1Ljk5NUEuOTA1LjkwNSAwIDAgMSA4IDV6bS4wMDIgNmExIDEgMCAxIDEgMCAyIDEgMSAwIDAgMSAwLTJ6XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8aDMgaWQ9XCJkaWFsb2ctdGl0bGVcIiBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2ctdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHt0aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9oMz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJkaWFsb2ctbWVzc2FnZVwiIGNsYXNzTmFtZT1cImZhcS1jb25maXJtLWRpYWxvZy1tZXNzYWdlXCI+XG4gICAgICAgICAgICAgICAgICAgIHttZXNzYWdlfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtY29uZmlybS1kaWFsb2ctYWN0aW9uc1wiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lcyhcImZhcS1jb25maXJtLWRpYWxvZy1idG5cIiwgXCJmYXEtYnRuLWNhbmNlbFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y2FuY2VsVGV4dH1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjbGFzc05hbWVzKFwiZmFxLWNvbmZpcm0tZGlhbG9nLWJ0blwiLCBcImZhcS1idG4tY29uZmlybVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmYXEtYnRuLWRlc3RydWN0aXZlXCI6IGlzRGVzdHJ1Y3RpdmVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17b25Db25maXJtfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7Y29uZmlybVRleHR9XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCJpbXBvcnQgeyBSZWFjdEVsZW1lbnQgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IENvbmZpcm1EaWFsb2cgfSBmcm9tIFwiLi9Db25maXJtRGlhbG9nXCI7XG5cbmludGVyZmFjZSBGQVFNb2RhbHNQcm9wcyB7XG4gICAgLy8gRGVsZXRlIGNvbmZpcm1hdGlvbiBwcm9wc1xuICAgIGRlbGV0ZUNvbmZpcm1JbmRleDogbnVtYmVyIHwgbnVsbDtcbiAgICBvbkNvbmZpcm1EZWxldGU6ICgpID0+IHZvaWQ7XG4gICAgb25DYW5jZWxEZWxldGU6ICgpID0+IHZvaWQ7XG59XG5cbi8qKlxuICogQ29tcG9uZW50IHRoYXQgcmVuZGVycyBGQVEgbW9kYWxzIChkZWxldGUgY29uZmlybWF0aW9uKVxuICogTm90ZTogQ3JlYXRlIGFuZCBFZGl0IGZvcm1zIGFyZSBub3cgcmVuZGVyZWQgaW5saW5lIGluIEZBUUVkaXRhYmxlTGlzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gRkFRTW9kYWxzKHtcbiAgICBkZWxldGVDb25maXJtSW5kZXgsXG4gICAgb25Db25maXJtRGVsZXRlLFxuICAgIG9uQ2FuY2VsRGVsZXRlXG59OiBGQVFNb2RhbHNQcm9wcyk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPD5cbiAgICAgICAgICAgIHsvKiBEZWxldGUgQ29uZmlybWF0aW9uIERpYWxvZyAqL31cbiAgICAgICAgICAgIDxDb25maXJtRGlhbG9nXG4gICAgICAgICAgICAgICAgaXNPcGVuPXtkZWxldGVDb25maXJtSW5kZXggIT09IG51bGx9XG4gICAgICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgRkFRIEl0ZW1cIlxuICAgICAgICAgICAgICAgIG1lc3NhZ2U9XCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgRkFRIGl0ZW0/IFRoaXMgYWN0aW9uIGNhbm5vdCBiZSB1bmRvbmUuXCJcbiAgICAgICAgICAgICAgICBvbkNvbmZpcm09e29uQ29uZmlybURlbGV0ZX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17b25DYW5jZWxEZWxldGV9XG4gICAgICAgICAgICAgICAgY29uZmlybVRleHQ9XCJEZWxldGVcIlxuICAgICAgICAgICAgICAgIGNhbmNlbFRleHQ9XCJDYW5jZWxcIlxuICAgICAgICAgICAgICAgIGlzRGVzdHJ1Y3RpdmU9e3RydWV9XG4gICAgICAgICAgICAvPlxuICAgICAgICA8Lz5cbiAgICApO1xufVxuIiwiaW1wb3J0IHsgUmVhY3RFbGVtZW50LCB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBGQVFBY2NvcmRpb25Db250YWluZXJQcm9wcyB9IGZyb20gXCIuLi90eXBpbmdzL0ZBUUFjY29yZGlvblByb3BzXCI7XG5pbXBvcnQgXCIuL3VpL0ZBUUFjY29yZGlvbi5zY3NzXCI7XG5pbXBvcnQgeyBjaGVja1VzZXJSb2xlLCBjYW5FZGl0IH0gZnJvbSBcIi4vdXRpbHMvZWRpdGluZ1V0aWxzXCI7XG5pbXBvcnQgeyB1c2VFZGl0TW9kZSB9IGZyb20gXCIuL2hvb2tzL3VzZUVkaXRNb2RlXCI7XG5pbXBvcnQgeyB1c2VGQVFEYXRhIH0gZnJvbSBcIi4vaG9va3MvdXNlRkFRRGF0YVwiO1xuaW1wb3J0IHsgdXNlRkFRQWN0aW9ucyB9IGZyb20gXCIuL2hvb2tzL3VzZUZBUUFjdGlvbnNcIjtcbmltcG9ydCB7IEZBUUhlYWRlciB9IGZyb20gXCIuL2NvbXBvbmVudHMvRkFRSGVhZGVyXCI7XG5pbXBvcnQgeyBGQVFJdGVtc0xpc3QgfSBmcm9tIFwiLi9jb21wb25lbnRzL0ZBUUl0ZW1zTGlzdFwiO1xuaW1wb3J0IHsgRkFRRWRpdGFibGVMaXN0IH0gZnJvbSBcIi4vY29tcG9uZW50cy9GQVFFZGl0YWJsZUxpc3RcIjtcbmltcG9ydCB7IEZBUU1vZGFscyB9IGZyb20gXCIuL2NvbXBvbmVudHMvRkFRTW9kYWxzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBGQVFBY2NvcmRpb24ocHJvcHM6IEZBUUFjY29yZGlvbkNvbnRhaW5lclByb3BzKTogUmVhY3RFbGVtZW50IHtcbiAgICBjb25zdCB7XG4gICAgICAgIGRhdGFTb3VyY2VUeXBlLFxuICAgICAgICBmYXFJdGVtcyxcbiAgICAgICAgZGF0YVNvdXJjZSxcbiAgICAgICAgZGVmYXVsdEV4cGFuZEFsbCxcbiAgICAgICAgc2hvd1RvZ2dsZUJ1dHRvbixcbiAgICAgICAgdG9nZ2xlQnV0dG9uVGV4dCxcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgIGFsbG93RWRpdGluZyxcbiAgICAgICAgZWRpdG9yUm9sZSxcbiAgICAgICAgb25TYXZlQWN0aW9uLFxuICAgICAgICBvbkRlbGV0ZUFjdGlvbixcbiAgICAgICAgb25DcmVhdGVBY3Rpb24sXG4gICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZSxcbiAgICAgICAgLy8gQXR0cmlidXRlIG92ZXJyaWRlcyAob3B0aW9uYWwpXG4gICAgICAgIHN1bW1hcnlBdHRyaWJ1dGUsXG4gICAgICAgIGNvbnRlbnRBdHRyaWJ1dGUsXG4gICAgICAgIGNvbnRlbnRGb3JtYXRBdHRyaWJ1dGUsXG4gICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlXG4gICAgfSA9IHByb3BzO1xuXG4gICAgLy8gQXR0cmlidXRlIG92ZXJyaWRlcyBmb3IgdXNlRkFRRGF0YSBhbmQgdXNlRkFRQWN0aW9ucyAocGFzcyB0aGUgTGlzdEF0dHJpYnV0ZVZhbHVlIG9iamVjdHMgZGlyZWN0bHkpXG4gICAgY29uc3QgYXR0cmlidXRlT3ZlcnJpZGVzID0gdXNlTWVtbyhcbiAgICAgICAgKCkgPT4gKHtcbiAgICAgICAgICAgIHN1bW1hcnlBdHRyaWJ1dGUsXG4gICAgICAgICAgICBjb250ZW50QXR0cmlidXRlLFxuICAgICAgICAgICAgY29udGVudEZvcm1hdEF0dHJpYnV0ZSxcbiAgICAgICAgICAgIHNvcnRPcmRlckF0dHJpYnV0ZU92ZXJyaWRlXG4gICAgICAgIH0pLFxuICAgICAgICBbc3VtbWFyeUF0dHJpYnV0ZSwgY29udGVudEF0dHJpYnV0ZSwgY29udGVudEZvcm1hdEF0dHJpYnV0ZSwgc29ydE9yZGVyQXR0cmlidXRlT3ZlcnJpZGVdXG4gICAgKTtcblxuICAgIC8vIERhdGEgZmV0Y2hpbmcgYW5kIHN0YXRlXG4gICAgY29uc3QgeyBpdGVtcywgaXNMb2FkaW5nLCBkZWZhdWx0U29ydE9yZGVyLCBzb3J0YWJsZUlkcyB9ID0gdXNlRkFRRGF0YSh7XG4gICAgICAgIGRhdGFTb3VyY2VUeXBlLFxuICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICBmYXFJdGVtcyxcbiAgICAgICAgc29ydE9yZGVyQXR0cmlidXRlLFxuICAgICAgICBhdHRyaWJ1dGVPdmVycmlkZXNcbiAgICB9KTtcblxuICAgIC8vIEVkaXRpbmcgc3RhdGVcbiAgICBjb25zdCBlZGl0U3RhdGUgPSB1c2VFZGl0TW9kZSgpO1xuICAgIGNvbnN0IFt1c2VySGFzUm9sZSwgc2V0VXNlckhhc1JvbGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gICAgLy8gQ1JVRCBhY3Rpb25zXG4gICAgY29uc3QgeyBoYW5kbGVTYXZlRWRpdCwgaGFuZGxlU2F2ZU5ldywgaGFuZGxlQ29uZmlybURlbGV0ZSwgaGFuZGxlRHJhZ0VuZCB9ID0gdXNlRkFRQWN0aW9ucyh7XG4gICAgICAgIGRhdGFTb3VyY2VUeXBlLFxuICAgICAgICBkYXRhU291cmNlLFxuICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGUsXG4gICAgICAgIGVkaXRTdGF0ZSxcbiAgICAgICAgb25TYXZlQWN0aW9uLFxuICAgICAgICBvbkRlbGV0ZUFjdGlvbixcbiAgICAgICAgb25DcmVhdGVBY3Rpb24sXG4gICAgICAgIGF0dHJpYnV0ZU92ZXJyaWRlc1xuICAgIH0pO1xuXG4gICAgLy8gU3RhdGUgdG8gdHJhY2sgd2hpY2ggaXRlbXMgYXJlIGV4cGFuZGVkXG4gICAgY29uc3QgW2V4cGFuZGVkSXRlbXMsIHNldEV4cGFuZGVkSXRlbXNdID0gdXNlU3RhdGU8U2V0PG51bWJlcj4+KG5ldyBTZXQoKSk7XG4gICAgY29uc3QgW2FsbEV4cGFuZGVkLCBzZXRBbGxFeHBhbmRlZF0gPSB1c2VTdGF0ZShkZWZhdWx0RXhwYW5kQWxsKTtcblxuICAgIC8vIENhbGN1bGF0ZSBlZGl0aW5nIHNvcnQgb3JkZXIgZm9yIHRoZSBlZGl0IGZvcm1cbiAgICBjb25zdCBlZGl0aW5nU29ydE9yZGVyID0gdXNlTWVtbygoKSA9PiB7XG4gICAgICAgIGlmIChlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNvcnRPcmRlckZyb21JdGVtcyA9IGl0ZW1zW2VkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4XT8uc29ydE9yZGVyO1xuICAgICAgICBpZiAoc29ydE9yZGVyRnJvbUl0ZW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3J0T3JkZXJGcm9tSXRlbXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBkYXRhU291cmNlVHlwZSA9PT0gXCJkYXRhYmFzZVwiICYmXG4gICAgICAgICAgICBkYXRhU291cmNlICYmXG4gICAgICAgICAgICBzb3J0T3JkZXJBdHRyaWJ1dGUgJiZcbiAgICAgICAgICAgIGRhdGFTb3VyY2UuaXRlbXM/LltlZGl0U3RhdGUuZWRpdGluZ0l0ZW1JbmRleF1cbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdyA9IHNvcnRPcmRlckF0dHJpYnV0ZS5nZXQoXG4gICAgICAgICAgICAgICAgICAgIGRhdGFTb3VyY2UuaXRlbXNbZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXhdXG4gICAgICAgICAgICAgICAgKS52YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3ID8gTnVtYmVyKHJhdy50b1N0cmluZygpKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZBUSBBY2NvcmRpb246IEZhaWxlZCB0byByZWFkIHNvcnQgb3JkZXIgZm9yIGVkaXQgZm9ybVwiLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LCBbZGF0YVNvdXJjZSwgZGF0YVNvdXJjZVR5cGUsIGVkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4LCBpdGVtcywgc29ydE9yZGVyQXR0cmlidXRlXSk7XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGhhcyByZXF1aXJlZCByb2xlXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgY29uc3QgY2hlY2tSb2xlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGFsbG93RWRpdGluZyAmJiBlZGl0b3JSb2xlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzUm9sZSA9IGF3YWl0IGNoZWNrVXNlclJvbGUoZWRpdG9yUm9sZSk7XG4gICAgICAgICAgICAgICAgc2V0VXNlckhhc1JvbGUoaGFzUm9sZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFsbG93RWRpdGluZyAmJiAhZWRpdG9yUm9sZSkge1xuICAgICAgICAgICAgICAgIHNldFVzZXJIYXNSb2xlKHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRVc2VySGFzUm9sZShmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY2hlY2tSb2xlKCk7XG4gICAgfSwgW2FsbG93RWRpdGluZywgZWRpdG9yUm9sZV0pO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBleHBhbmRlZCBzdGF0ZSBiYXNlZCBvbiBkZWZhdWx0RXhwYW5kQWxsXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKGRlZmF1bHRFeHBhbmRBbGwpIHtcbiAgICAgICAgICAgIGNvbnN0IGFsbEluZGljZXMgPSBuZXcgU2V0KGl0ZW1zPy5tYXAoKF8sIGluZGV4KSA9PiBpbmRleCkgfHwgW10pO1xuICAgICAgICAgICAgc2V0RXhwYW5kZWRJdGVtcyhhbGxJbmRpY2VzKTtcbiAgICAgICAgfVxuICAgIH0sIFtkZWZhdWx0RXhwYW5kQWxsLCBpdGVtc10pO1xuXG4gICAgLy8gVG9nZ2xlIGluZGl2aWR1YWwgaXRlbVxuICAgIGNvbnN0IHRvZ2dsZUl0ZW0gPSAoaW5kZXg6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICBzZXRFeHBhbmRlZEl0ZW1zKChwcmV2KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdTZXQgPSBuZXcgU2V0KHByZXYpO1xuICAgICAgICAgICAgaWYgKG5ld1NldC5oYXMoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgbmV3U2V0LmRlbGV0ZShpbmRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld1NldC5hZGQoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ld1NldDtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIFRvZ2dsZSBhbGwgaXRlbXNcbiAgICBjb25zdCB0b2dnbGVBbGwgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChhbGxFeHBhbmRlZCkge1xuICAgICAgICAgICAgc2V0RXhwYW5kZWRJdGVtcyhuZXcgU2V0KCkpO1xuICAgICAgICAgICAgc2V0QWxsRXhwYW5kZWQoZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWxsSW5kaWNlcyA9IG5ldyBTZXQoaXRlbXM/Lm1hcCgoXywgaW5kZXgpID0+IGluZGV4KSB8fCBbXSk7XG4gICAgICAgICAgICBzZXRFeHBhbmRlZEl0ZW1zKGFsbEluZGljZXMpO1xuICAgICAgICAgICAgc2V0QWxsRXhwYW5kZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gVXBkYXRlIGFsbEV4cGFuZGVkIHN0YXRlIGJhc2VkIG9uIGluZGl2aWR1YWwgdG9nZ2xlc1xuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChpdGVtcykge1xuICAgICAgICAgICAgY29uc3QgYWxsQXJlRXhwYW5kZWQgPSBpdGVtcy5sZW5ndGggPiAwICYmIGV4cGFuZGVkSXRlbXMuc2l6ZSA9PT0gaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgc2V0QWxsRXhwYW5kZWQoYWxsQXJlRXhwYW5kZWQpO1xuICAgICAgICB9XG4gICAgfSwgW2V4cGFuZGVkSXRlbXMsIGl0ZW1zXSk7XG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgZWRpdGluZyBpcyBlbmFibGVkXG4gICAgY29uc3QgaXNFZGl0aW5nRW5hYmxlZCA9IGNhbkVkaXQoYWxsb3dFZGl0aW5nLCBkYXRhU291cmNlVHlwZSwgdXNlckhhc1JvbGUpO1xuXG4gICAgLy8gRXZlbnQgaGFuZGxlcnNcbiAgICBjb25zdCBoYW5kbGVDYW5jZWxFZGl0ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoZWRpdFN0YXRlLmVkaXRpbmdJdGVtSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGVkaXRTdGF0ZS5jYW5jZWxFZGl0aW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVkaXRTdGF0ZS5zaG93Q3JlYXRlRm9ybSkge1xuICAgICAgICAgICAgZWRpdFN0YXRlLmNhbmNlbENyZWF0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gU2hvdyBsb2FkaW5nIHN0YXRlIGZvciBkYXRhYmFzZSBtb2RlXG4gICAgaWYgKGlzTG9hZGluZykge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmYXEtYWNjb3JkaW9uLWxvYWRpbmdcIj5cbiAgICAgICAgICAgICAgICA8cD5Mb2FkaW5nIEZBUSBpdGVtcy4uLjwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIGlmICghaXRlbXMgfHwgaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZhcS1hY2NvcmRpb24tZW1wdHlcIj5cbiAgICAgICAgICAgICAgICA8cD5ObyBGQVEgaXRlbXMgY29uZmlndXJlZDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFxLWFjY29yZGlvbi1jb250YWluZXJcIj5cbiAgICAgICAgICAgIDxGQVFIZWFkZXJcbiAgICAgICAgICAgICAgICBzaG93VG9nZ2xlQnV0dG9uPXtzaG93VG9nZ2xlQnV0dG9ufVxuICAgICAgICAgICAgICAgIGFsbEV4cGFuZGVkPXthbGxFeHBhbmRlZH1cbiAgICAgICAgICAgICAgICB0b2dnbGVCdXR0b25UZXh0PXt0b2dnbGVCdXR0b25UZXh0Py52YWx1ZX1cbiAgICAgICAgICAgICAgICBvblRvZ2dsZUFsbD17dG9nZ2xlQWxsfVxuICAgICAgICAgICAgICAgIGlzRWRpdGluZ0VuYWJsZWQ9e2lzRWRpdGluZ0VuYWJsZWR9XG4gICAgICAgICAgICAgICAgZWRpdE1vZGU9e2VkaXRTdGF0ZS5lZGl0TW9kZX1cbiAgICAgICAgICAgICAgICBvblRvZ2dsZUVkaXRNb2RlPXtlZGl0U3RhdGUudG9nZ2xlRWRpdE1vZGV9XG4gICAgICAgICAgICAgICAgb25DcmVhdGVOZXc9e2VkaXRTdGF0ZS5zdGFydENyZWF0aW5nfVxuICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAge2VkaXRTdGF0ZS5lZGl0TW9kZSAmJiBpc0VkaXRpbmdFbmFibGVkID8gKFxuICAgICAgICAgICAgICAgIDxGQVFFZGl0YWJsZUxpc3RcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM9e2l0ZW1zfVxuICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZUlkcz17c29ydGFibGVJZHN9XG4gICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkSXRlbXM9e2V4cGFuZGVkSXRlbXN9XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uPXthbmltYXRpb25EdXJhdGlvbiB8fCAzMDB9XG4gICAgICAgICAgICAgICAgICAgIG9uRWRpdEl0ZW09e2VkaXRTdGF0ZS5zdGFydEVkaXRpbmdJdGVtfVxuICAgICAgICAgICAgICAgICAgICBvbkRlbGV0ZUl0ZW09e2VkaXRTdGF0ZS5zdGFydERlbGV0aW5nfVxuICAgICAgICAgICAgICAgICAgICBvbkRyYWdFbmQ9e2hhbmRsZURyYWdFbmR9XG4gICAgICAgICAgICAgICAgICAgIGVkaXRpbmdJdGVtSW5kZXg9e2VkaXRTdGF0ZS5lZGl0aW5nSXRlbUluZGV4fVxuICAgICAgICAgICAgICAgICAgICBlZGl0aW5nU29ydE9yZGVyPXtlZGl0aW5nU29ydE9yZGVyfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0U29ydE9yZGVyPXtkZWZhdWx0U29ydE9yZGVyfVxuICAgICAgICAgICAgICAgICAgICBvblNhdmVFZGl0PXtoYW5kbGVTYXZlRWRpdH1cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWxFZGl0PXtoYW5kbGVDYW5jZWxFZGl0fVxuICAgICAgICAgICAgICAgICAgICBzaG93Q3JlYXRlRm9ybT17ZWRpdFN0YXRlLnNob3dDcmVhdGVGb3JtfVxuICAgICAgICAgICAgICAgICAgICBvblNhdmVOZXc9e2hhbmRsZVNhdmVOZXd9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2FuY2VsQ3JlYXRlPXtoYW5kbGVDYW5jZWxFZGl0fVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxGQVFJdGVtc0xpc3RcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM9e2l0ZW1zfVxuICAgICAgICAgICAgICAgICAgICBleHBhbmRlZEl0ZW1zPXtleHBhbmRlZEl0ZW1zfVxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbj17YW5pbWF0aW9uRHVyYXRpb24gfHwgMzAwfVxuICAgICAgICAgICAgICAgICAgICBvblRvZ2dsZUl0ZW09e3RvZ2dsZUl0ZW19XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDxGQVFNb2RhbHNcbiAgICAgICAgICAgICAgICBkZWxldGVDb25maXJtSW5kZXg9e2VkaXRTdGF0ZS5kZWxldGVDb25maXJtSW5kZXh9XG4gICAgICAgICAgICAgICAgb25Db25maXJtRGVsZXRlPXtoYW5kbGVDb25maXJtRGVsZXRlfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsRGVsZXRlPXtlZGl0U3RhdGUuY2FuY2VsRGVsZXRlfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cbiJdLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VDYWxsYmFjayIsImhhc093biIsImhhc093blByb3BlcnR5IiwiY2xhc3NOYW1lcyIsImNsYXNzZXMiLCJpIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiYXJnIiwiYXBwZW5kQ2xhc3MiLCJwYXJzZVZhbHVlIiwiQXJyYXkiLCJpc0FycmF5IiwiYXBwbHkiLCJ0b1N0cmluZyIsIk9iamVjdCIsInByb3RvdHlwZSIsImluY2x1ZGVzIiwia2V5IiwiY2FsbCIsInZhbHVlIiwibmV3Q2xhc3MiLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVmYXVsdCIsIndpbmRvdyIsIl9qc3giLCJfanN4cyIsIl9GcmFnbWVudCIsImVudHJpZXMiLCJzZXRQcm90b3R5cGVPZiIsImlzRnJvemVuIiwiZ2V0UHJvdG90eXBlT2YiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJmcmVlemUiLCJzZWFsIiwiY3JlYXRlIiwiY29uc3RydWN0IiwiUmVmbGVjdCIsIngiLCJmdW5jIiwidGhpc0FyZyIsIl9sZW4iLCJhcmdzIiwiX2tleSIsIkZ1bmMiLCJfbGVuMiIsIl9rZXkyIiwiYXJyYXlGb3JFYWNoIiwidW5hcHBseSIsImZvckVhY2giLCJhcnJheUxhc3RJbmRleE9mIiwibGFzdEluZGV4T2YiLCJhcnJheVBvcCIsInBvcCIsImFycmF5UHVzaCIsInB1c2giLCJhcnJheVNwbGljZSIsInNwbGljZSIsInN0cmluZ1RvTG93ZXJDYXNlIiwiU3RyaW5nIiwidG9Mb3dlckNhc2UiLCJzdHJpbmdUb1N0cmluZyIsInN0cmluZ01hdGNoIiwibWF0Y2giLCJzdHJpbmdSZXBsYWNlIiwicmVwbGFjZSIsInN0cmluZ0luZGV4T2YiLCJpbmRleE9mIiwic3RyaW5nVHJpbSIsInRyaW0iLCJvYmplY3RIYXNPd25Qcm9wZXJ0eSIsInJlZ0V4cFRlc3QiLCJSZWdFeHAiLCJ0ZXN0IiwidHlwZUVycm9yQ3JlYXRlIiwidW5jb25zdHJ1Y3QiLCJUeXBlRXJyb3IiLCJsYXN0SW5kZXgiLCJfbGVuMyIsIl9rZXkzIiwiX2xlbjQiLCJfa2V5NCIsImFkZFRvU2V0Iiwic2V0IiwiYXJyYXkiLCJ0cmFuc2Zvcm1DYXNlRnVuYyIsInVuZGVmaW5lZCIsImwiLCJlbGVtZW50IiwibGNFbGVtZW50IiwiY2xlYW5BcnJheSIsImluZGV4IiwiaXNQcm9wZXJ0eUV4aXN0IiwiY2xvbmUiLCJvYmplY3QiLCJuZXdPYmplY3QiLCJwcm9wZXJ0eSIsImNvbnN0cnVjdG9yIiwibG9va3VwR2V0dGVyIiwicHJvcCIsImRlc2MiLCJnZXQiLCJmYWxsYmFja1ZhbHVlIiwiTCIsImFzeW5jIiwiYnJlYWtzIiwiZXh0ZW5zaW9ucyIsImdmbSIsImhvb2tzIiwicGVkYW50aWMiLCJyZW5kZXJlciIsInNpbGVudCIsInRva2VuaXplciIsIndhbGtUb2tlbnMiLCJUIiwiWiIsInUiLCJET01QdXJpZnkiLCJtYXJrZWQiLCJ1c2VDb21iaW5lZFJlZnMiLCJyZWZzIiwibm9kZSIsInJlZiIsImhpZGRlblN0eWxlcyIsImRpc3BsYXkiLCJIaWRkZW5UZXh0IiwiX3JlZiIsImlkIiwiUmVhY3QiLCJjcmVhdGVFbGVtZW50Iiwic3R5bGUiLCJEbmRNb25pdG9yQ29udGV4dCIsImNyZWF0ZUNvbnRleHQiLCJhcnJheU1vdmUiLCJmcm9tIiwidG8iLCJuZXdBcnJheSIsInNsaWNlIl0sIm1hcHBpbmdzIjoiOztJQUFBOztJQUVHO0lBRUg7Ozs7SUFJRztJQUNJLGVBQWUsYUFBYSxDQUFDLFlBQW9CLEVBQUE7O1FBRXBELElBQUksQ0FBQyxZQUFZLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtJQUM3QyxRQUFBLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7SUFFRCxJQUFBLElBQUk7Ozs7O0lBS0EsUUFBQSxPQUFPLENBQUMsR0FBRyxDQUFD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QyxHQUFBO0lBRUEsRUFBQSxTQUFTUSxhQUFhQSxHQUFBO0lBQ3BCLElBQUEsT0FBTyxJQUFJLENBQUE7SUFDYixHQUFBO0lBRUEsRUFBQSxPQUFPQSxhQUFhLENBQUE7SUFDdEIsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQzlNTyxTQUFTQyxJQUE0RztNQUMxSCxPQUFPO0lBQ0xDLElBQUFBLEtBQUEsRUFBTyxDQUFBLENBQUE7SUFDUEMsSUFBQUEsTUFBQSxFQUFRLENBQUEsQ0FBQTtJQUNSQyxJQUFBQSxVQUFBLEVBQVksSUFBQTtJQUNaQyxJQUFBQSxHQUFBLEVBQUssQ0FBQSxDQUFBO0lBQ0xDLElBQUFBLEtBQUEsRUFBTyxJQUFBO0lBQ1BDLElBQUFBLFFBQUEsRUFBVSxDQUFBLENBQUE7SUFDVkMsSUFBQUEsUUFBQSxFQUFVLElBQUE7SUFDVkMsSUFBQUEsTUFBQSxFQUFRLENBQUEsQ0FBQTtJQUNSQyxJQUFBQSxTQUFBLEVBQVcsSUFBQTtJQUNYQyxJQUFBQSxVQUFBLEVBQVksSUFBQTtPQUVoQixDQUFBO0lBQUEsQ0FBQTtJQUVPLElBQUlDLENBQUEsR0FBcUNYLENBQUEsRUFBYSxDQUFBO0lBRXRELFNBQVNZLENBQUFBLENBQStEQyxDQUFBLEVBQTBEO0lBQ3ZJRixFQUFBQSxDQUFBLEdBQVlFLENBQ2QsQ0FBQTtJQUFBLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDakJBOzs7Ozs7OztJQVFHO0lBQ0gsTUFBTSxlQUFlLEdBQUc7SUFDcEIsSUFBQSxZQUFZLEVBQUU7WUFDVixHQUFHO1lBQ0gsSUFBSTtZQUNKLFFBQVE7WUFDUixJQUFJO1lBQ0osR0FBRztZQUNILEdBQUc7WUFDSCxHQUFHO1lBQ0gsR0FBRztZQUNILEdBQUc7WUFDSCxJQUFJO1lBQ0osSUFBSTtZQUNKLElBQUk7WUFDSixNQUFNO1lBQ04sS0FBSztZQUNMLElBQUk7WUFDSixPQUFPO0lBQ1AsUUFBQSxTQUFTO1lBQ1QsT0FBTztZQUNQLE9BQU87SUFDUCxRQUFBLE9BQU87WUFDUCxJQUFJO1lBQ0osSUFBSTtZQUNKLElBQUk7SUFDSixRQUFBLEtBQUs7SUFDTCxRQUFBLFVBQVU7WUFDVixLQUFLO1lBQ0wsS0FBSztZQUNMLE1BQU07SUFDTixRQUFBLE9BQU87SUFDUCxRQUFBLFFBQVE7SUFDUixRQUFBLFFBQVE7SUFDUixRQUFBLFlBQVk7SUFDZixLQUFBO0lBQ0QsSUFBQSxZQUFZLEVBQUU7WUFDVixNQUFNO1lBQ04sT0FBTztZQUNQLFFBQVE7WUFDUixLQUFLO1lBQ0wsS0FBSztZQUNMLEtBQUs7WUFDTCxPQUFPO1lBQ1AsUUFBUTtZQUNSLE9BQU87WUFDUCxJQUFJO1lBQ0osT0FBTzs7WUFFUCxTQUFTO1lBQ1QsU0FBUztJQUNULFFBQUEsT0FBTztJQUNQLFFBQUEsU0FBUzs7WUFFVCxVQUFVO1lBQ1YsVUFBVTtZQUNWLE1BQU07WUFDTixPQUFPO1lBQ1AsUUFBUTtJQUNYLEtBQUE7UUFDRCxlQUFlLEVBQUUsS0FBSztJQUN0QixJQUFBLGtCQUFrQixFQUNkLHlGQUF5RjtLQUNoRyxDQUFDO0lBRUY7Ozs7SUFJRztJQUNHLFNBQVUsWUFBWSxDQUFDLElBQVksRUFBQTtRQUNyQyxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ1AsUUFBQSxPQUFPLEVBQUUsQ0FBQztTQUNiO0lBRUQsSUFBQSxJQUFJOztZQUVBLE1BQU0sU0FBUyxHQUFHQyxNQUFTLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztJQUM1RCxRQUFBLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBQUMsT0FBTyxLQUFLLEVBQUU7SUFDWixRQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7O0lBRS9DLFFBQUEsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7SUFDTCxDQUFDO0lBRUQ7Ozs7SUFJRztJQUNHLFNBQVUsWUFBWSxDQUFDLElBQVksRUFBQTtRQUNyQyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFFNUIsSUFBSSxDQUFDLElBQUksRUFBRTtJQUNQLFFBQUEsT0FBTyxNQUFNLENBQUM7U0FDakI7O0lBR0QsSUFBQSxJQUFJLG1DQUFtQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNoRCxRQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsQ0FBQztTQUNuRTs7SUFHRCxJQUFBLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUMxQixRQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsNkVBQTZFLENBQUMsQ0FBQztTQUM5Rjs7SUFHRCxJQUFBLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUM1QixRQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUVBQWlFLENBQUMsQ0FBQztTQUNsRjs7SUFHRCxJQUFBLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQy9CLFFBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1NBQ3hEOztJQUdELElBQUEsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDOUIsUUFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDOUM7O0lBR0QsSUFBQSxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUN0QyxRQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUNBQXVDLENBQUMsQ0FBQztTQUN4RDtJQUVELElBQUEsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7O0lBSUc7SUFDRyxTQUFVLGtCQUFrQixDQUFDLElBQVksRUFBQTtRQUMzQyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFFNUIsSUFBSSxDQUFDLElBQUksRUFBRTtJQUNQLFFBQUEsT0FBTyxNQUFNLENBQUM7U0FDakI7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUU3QyxJQUFBLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEtBQUk7OztZQUdwQixNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUMxRCxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUUxRCxRQUFBLElBQUksa0JBQWtCLElBQUksa0JBQWtCLEVBQUU7SUFDMUMsWUFBQSxNQUFNLENBQUMsSUFBSSxDQUNQLENBQUEsaUNBQUEsRUFBb0MsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQ3BELEVBQUEsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQzlCLENBQUUsQ0FBQSxDQUNMLENBQUM7YUFDTDs7SUFHRCxRQUFBLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDM0MsWUFBQSxNQUFNLENBQUMsSUFBSSxDQUNQLENBQUEsc0JBQUEsRUFBeUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUcsRUFBQSxHQUFHLENBQUMsTUFBTSxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFFLENBQUEsQ0FDakYsQ0FBQzthQUNMO0lBQ0wsS0FBQyxDQUFDLENBQUM7OztJQUlILElBQUEsTUFBTSxlQUFlLEdBQUc7WUFDcEIsTUFBTTtZQUNOLE1BQU07WUFDTixJQUFJO1lBQ0osS0FBSztZQUNMLE9BQU87WUFDUCxJQUFJO1lBQ0osS0FBSztZQUNMLE9BQU87WUFDUCxNQUFNO1lBQ04sTUFBTTtZQUNOLE9BQU87WUFDUCxRQUFRO1lBQ1IsT0FBTztZQUNQLEtBQUs7U0FDUixDQUFDOztRQUdGLE1BQU0sUUFBUSxHQUE2QyxFQUFFLENBQUM7UUFDOUQsTUFBTSxRQUFRLEdBQUcsbUNBQW1DLENBQUM7SUFDckQsSUFBQSxJQUFJLEtBQUssQ0FBQztJQUVWLElBQUEsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRTtJQUMzQyxRQUFBLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQyxRQUFBLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVsRixJQUFJLFNBQVMsRUFBRTs7SUFFWCxZQUFBLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7SUFDdkIsZ0JBQUEsTUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsT0FBTyxDQUFBLENBQUEsQ0FBRyxDQUFDLENBQUM7aUJBQ3REO3FCQUFNO29CQUNILE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pELGdCQUFBLElBQUksVUFBVSxDQUFDLEdBQUcsS0FBSyxPQUFPLEVBQUU7d0JBQzVCLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztxQkFDbEI7eUJBQU07O3dCQUVILE1BQU0sQ0FBQyxJQUFJLENBQ1AsQ0FBOEMsMkNBQUEsRUFBQSxVQUFVLENBQUMsR0FBRyxDQUFjLFdBQUEsRUFBQSxPQUFPLENBQUcsQ0FBQSxDQUFBLENBQ3ZGLENBQUM7O0lBRUYsb0JBQUEsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLE9BQU8sQ0FBQyxDQUFDO0lBQ2hFLG9CQUFBLElBQUksVUFBVSxJQUFJLENBQUMsRUFBRTtJQUNqQix3QkFBQSxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQzt5QkFDbEM7cUJBQ0o7aUJBQ0o7YUFDSjtpQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFOztJQUV2QixZQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUMxRDtTQUNKOztJQUdELElBQUEsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNyQixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSTtnQkFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBLGVBQUEsRUFBa0IsR0FBRyxDQUE4QiwyQkFBQSxFQUFBLEdBQUcsQ0FBRyxDQUFBLENBQUEsQ0FBQyxDQUFDO0lBQzNFLFNBQUMsQ0FBQyxDQUFDO1NBQ047O1FBR0QsTUFBTSxvQkFBb0IsR0FBRyx1Q0FBdUMsQ0FBQztJQUNyRSxJQUFBLElBQUksU0FBUyxDQUFDO0lBQ2QsSUFBQSxPQUFPLENBQUMsU0FBUyxHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUU7SUFDM0QsUUFBQSxNQUFNLENBQUMsSUFBSSxDQUNQLENBQUEsNEJBQUEsRUFBK0IsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQ3hELEVBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQ3ZDLENBQUEsQ0FBRSxDQUNMLENBQUM7U0FDTDtJQUVELElBQUEsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7O0lBSUc7SUFDRyxTQUFVLGNBQWMsQ0FBQyxRQUFnQixFQUFBO1FBQzNDLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDWCxRQUFBLE9BQU8sRUFBRSxDQUFDO1NBQ2I7SUFFRCxJQUFBLElBQUk7O1lBRUFDLENBQU0sQ0FBQyxVQUFVLENBQUM7SUFDZCxZQUFBLE1BQU0sRUFBRSxJQUFJO0lBQ1osWUFBQSxHQUFHLEVBQUUsSUFBSTtJQUNaLFNBQUEsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUdBLENBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFXLENBQUM7O0lBRTlDLFFBQUEsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0I7UUFBQyxPQUFPLEtBQUssRUFBRTtJQUNaLFFBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxRQUFBLE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQy9CO0lBQ0wsQ0FBQztJQUVEOzs7O0lBSUc7SUFDRyxTQUFVLFVBQVUsQ0FBQyxJQUFZLEVBQUE7UUFDbkMsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxJQUFBLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7SUFJRztJQUNHLFNBQVUsVUFBVSxDQUFDLElBQVksRUFBQTtRQUNuQyxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ1AsUUFBQSxPQUFPLEVBQUUsQ0FBQztTQUNiOztJQUdELElBQUEsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7OztJQUtHO0lBQ2EsU0FBQSxjQUFjLENBQUMsT0FBZSxFQUFFLE1BQXFCLEVBQUE7UUFDakUsSUFBSSxDQUFDLE9BQU8sRUFBRTtJQUNWLFFBQUEsT0FBTyxFQUFFLENBQUM7U0FDYjtRQUVELFFBQVEsTUFBTTtJQUNWLFFBQUEsS0FBSyxNQUFNO0lBQ1AsWUFBQSxPQUFPLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxRQUFBLEtBQUssVUFBVTs7SUFFWCxZQUFBLE9BQU8sY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25DLFFBQUEsS0FBSyxNQUFNO0lBQ1AsWUFBQSxPQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixRQUFBOztJQUVJLFlBQUEsT0FBTyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsTUFBTSxDQUFBLG1CQUFBLENBQXFCLENBQUMsQ0FBQztJQUMxRSxZQUFBLE9BQU8sWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3BDO0lBQ0wsQ0FBQztJQUVEOzs7OztJQUtHO0lBQ2EsU0FBQSxrQkFBa0IsQ0FBQyxPQUFlLEVBQUUsTUFBcUIsRUFBQTtRQUNyRSxJQUFJLENBQUMsT0FBTyxFQUFFO0lBQ1YsUUFBQSxPQUFPLEVBQUUsQ0FBQztTQUNiO1FBRUQsUUFBUSxNQUFNO0lBQ1YsUUFBQSxLQUFLLE1BQU07O0lBRVAsWUFBQSxNQUFNLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQyxZQUFBLE1BQU0sY0FBYyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELFlBQUEsT0FBTyxDQUFDLEdBQUcsZ0JBQWdCLEVBQUUsR0FBRyxjQUFjLENBQUMsQ0FBQztJQUNwRCxRQUFBLEtBQUssVUFBVTs7O2dCQUdYLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQztnQkFDL0IsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFFL0MsSUFBSSxXQUFXLEVBQUU7O29CQUViLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDekMsZ0JBQUEsTUFBTSxvQkFBb0IsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdkQsZ0JBQUEsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFFM0QsTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUFHLG9CQUFvQixFQUFFLEdBQUcsa0JBQWtCLENBQUMsQ0FBQztJQUNyRSxnQkFBQSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0lBQ3hCLG9CQUFBLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFBLDJCQUFBLEVBQThCLE9BQU8sQ0FBQSxDQUFFLENBQUMsQ0FBQztxQkFDaEY7aUJBQ0o7SUFDRCxZQUFBLE9BQU8sRUFBRSxDQUFDO0lBQ2QsUUFBQSxLQUFLLE1BQU07O0lBRVAsWUFBQSxPQUFPLEVBQUUsQ0FBQztJQUNkLFFBQUE7SUFDSSxZQUFBLE9BQU8sRUFBRSxDQUFDO1NBQ2pCO0lBQ0w7O0lDdldBOzs7SUFHRztJQUNHLFNBQVUsWUFBWSxDQUFDLEVBQ3pCLEtBQUssRUFDTCxhQUFhLEVBQ2IsaUJBQWlCLEVBQ2pCLFlBQVksRUFDSSxFQUFBO0lBQ2hCLElBQUEsUUFDSTdGLGNBQUEsQ0FBQSxLQUFBLEVBQUEsRUFBSyxTQUFTLEVBQUMscUJBQXFCLEVBQy9CLFFBQUEsRUFBQSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssS0FBSTtnQkFDdkIsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QyxZQUFBLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDbEMsWUFBQSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ2xDLFlBQUEsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQzs7Z0JBR3pDLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQzs7Z0JBR3JFLE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztJQUVqRSxZQUFBLFFBQ0lDLGVBRUksQ0FBQSxTQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRTtJQUM5QixvQkFBQSxvQkFBb0IsRUFBRSxVQUFVO0lBQ25DLGlCQUFBLENBQUMsRUFDRixJQUFJLEVBQUUsVUFBVSxFQUNoQixLQUFLLEVBQ0Q7d0JBQ0ksc0JBQXNCLEVBQUUsQ0FBRyxFQUFBLGlCQUFpQixDQUFJLEVBQUEsQ0FBQTtxQkFDNUIsRUFHNUIsUUFBQSxFQUFBLENBQUFBLGVBQUEsQ0FBQSxTQUFBLEVBQUEsRUFDSSxTQUFTLEVBQUMsa0JBQWtCLEVBQzVCLE9BQU8sRUFBRSxDQUFDLENBQUMsS0FBSTtnQ0FDWCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0NBQ25CLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4Qix5QkFBQyxFQUNELFNBQVMsRUFBRSxDQUFDLENBQUMsS0FBSTtJQUNiLDRCQUFBLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEVBQUU7b0NBQ3BDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQ0FDbkIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lDQUN2Qjs2QkFDSixFQUNELFFBQVEsRUFBRSxDQUFDLEVBQ1gsSUFBSSxFQUFDLFFBQVEsRUFDRSxlQUFBLEVBQUEsVUFBVSxFQUV6QixRQUFBLEVBQUEsQ0FBQUQsY0FBQSxDQUFBLE1BQUEsRUFBQSxFQUFNLFNBQVMsRUFBQyx1QkFBdUIsRUFBRSxRQUFBLEVBQUEsWUFBWSxFQUFRLENBQUEsRUFDN0RBLGNBQ0ksQ0FBQSxNQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUUsVUFBVSxDQUFDLGVBQWUsRUFBRTtJQUNuQyxvQ0FBQSx5QkFBeUIsRUFBRSxVQUFVO3FDQUN4QyxDQUFDLEVBQUEsUUFBQSxFQUVGQSxjQUNJLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBSyxFQUFDLElBQUksRUFDVixNQUFNLEVBQUMsSUFBSSxFQUNYLE9BQU8sRUFBQyxXQUFXLEVBQ25CLElBQUksRUFBQyxNQUFNLEVBQ1gsS0FBSyxFQUFDLDRCQUE0QixFQUFBLFFBQUEsRUFFbENBLGNBQ0ksQ0FBQSxNQUFBLEVBQUEsRUFBQSxDQUFDLEVBQUMsZ0JBQWdCLEVBQ2xCLE1BQU0sRUFBQyxjQUFjLEVBQ3JCLFdBQVcsRUFBQyxHQUFHLEVBQ2YsYUFBYSxFQUFDLE9BQU8sRUFDckIsY0FBYyxFQUFDLE9BQU8sRUFBQSxDQUN4QixFQUNBLENBQUEsRUFBQSxDQUNILENBQ0QsRUFBQSxDQUFBLEVBQ1ZDLHlCQUFLLFNBQVMsRUFBQyxrQkFBa0IsRUFBQSxRQUFBLEVBQUEsQ0FDNUIsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEtBQ2hCRCxjQUFLLENBQUEsS0FBQSxFQUFBLEVBQUEsU0FBUyxFQUFDLG1CQUFtQixFQUFBLFFBQUEsRUFDN0IsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLE1BQzFCQyxlQUFrQixDQUFBLEtBQUEsRUFBQSxFQUFBLFNBQVMsRUFBQyxrQkFBa0IsRUFDdEMsUUFBQSxFQUFBLENBQUEsZUFBQSxFQUFBLE9BQU8sS0FETCxNQUFNLENBRVYsQ0FDVCxDQUFDLEVBQ0EsQ0FBQSxDQUNULEVBQ0RELGNBQ0ksQ0FBQSxLQUFBLEVBQUEsRUFBQSxTQUFTLEVBQUMsd0JBQXdCLEVBQ2xDLHVCQUF1QixFQUFFLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEVBQUEsQ0FDdkQsSUFDQSxDQWhFRCxFQUFBLEVBQUEsS0FBSyxDQWlFSixFQUNaO2FBQ0wsQ0FBQyxFQUNBLENBQUEsRUFDUjtJQUNOOzthQ2pIZ0I4RixlQUFBLEdBQUE7d0NBQ1hDLElBQUEsR0FBQSxJQUFBOUcsS0FBQSxDQUFBK0IsSUFBQSxDQUFBLEVBQUFFLElBQUEsR0FBQSxDQUFBLEVBQUFBLElBQUEsR0FBQUYsSUFBQSxFQUFBRSxJQUFBLEVBQUEsRUFBQTtJQUFBNkUsSUFBQUEsSUFBQSxDQUFBN0UsSUFBQSxDQUFBdEMsR0FBQUEsU0FBQSxDQUFBc0MsSUFBQSxDQUFBLENBQUE7O01BRUgsT0FBTzdDLGFBQU8sQ0FDWixNQUFPMkgsSUFBRCxJQUFBO1FBQ0pELElBQUksQ0FBQ3ZFLE9BQUwsQ0FBY3lFLEdBQUQsSUFBU0EsR0FBRyxDQUFDRCxJQUFELENBQXpCLENBQUEsQ0FBQTtJQUZVLEdBQUE7SUFBQTtJQUtaRCxFQUFBQSxJQUxZLENBQWQsQ0FBQTtJQU9ELENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ0xELE1BQU1HLFlBQVksR0FBd0I7SUFDeENDLEVBQUFBLE9BQU8sRUFBRSxNQUFBO0lBRCtCLENBQTFDLENBQUE7SUFJZ0JDLFNBQUFBLFVBQUFBLENBQUFDLElBQUEsRUFBQTtJQUFXLEVBQUEsSUFBQTtRQUFDQyxFQUFEO0lBQUs1RyxJQUFBQSxLQUFBQTs7TUFDOUIsT0FDRTZHLEtBQUEsQ0FBQUMsYUFBQSxDQUFBLEtBQUEsRUFBQTtJQUFLRixJQUFBQSxFQUFFLEVBQUVBLEVBQUE7SUFBSUcsSUFBQUEsS0FBSyxFQUFFUCxZQUFBQTtJQUFwQixHQUFBLEVBQ0d4RyxLQURILENBREYsQ0FBQTtJQUtELENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNiTSxNQUFNZ0gsaUJBQWlCLGdCQUFHQyxtQkFBYSxDQUEwQixJQUExQixDQUF2QyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
