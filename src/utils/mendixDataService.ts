/**
 * Mendix Data Service - Centralized service for Mendix Client API operations
 * Handles CRUD operations with consistent error handling and data source reloading
 *
 * CONVENTION: This service expects entities to have attributes defined in attributeConfig.ts
 * See src/config/attributeConfig.ts for the attribute name configuration
 */
import { ObjectItem } from "mendix";
import Big from "big.js";
import { FAQ_ATTRIBUTES } from "../config/attributeConfig";

// Mendix Client API type declarations
declare global {
    interface Window {
        mx?: {
            data: {
                get(options: {
                    guid: string;
                    callback: (obj: any) => void;
                    error?: (error: Error) => void;
                }): void;
                commit(options: {
                    mxobj: any;
                    callback: () => void;
                    error: (error: Error) => void;
                }): void;
                create(options: {
                    entity: string;
                    callback: (obj: any) => void;
                    error: (error: Error) => void;
                }): void;
                remove(options: {
                    guids: string[];
                    callback: () => void;
                    error: (error: Error) => void;
                }): void;
            };
        };
    }
}

/**
 * Gets the Mendix mx global object safely
 */
function getMx(): any {
    if (typeof window !== "undefined" && window.mx) {
        return window.mx;
    }
    if (typeof global !== "undefined" && (global as any).window?.mx) {
        return (global as any).window.mx;
    }
    return null;
}

/**
 * Gets the full MxObject from an ObjectItem
 * ObjectItem from datasource only has 'id', we need to fetch the full object
 * @param obj - ObjectItem from datasource
 * @returns Promise that resolves with the full MxObject
 */
function getMxObject(obj: ObjectItem): Promise<any> {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }

        const guid = getObjectGuid(obj);

        mx.data.get({
            guid: guid,
            callback: (mxObj: any) => {
                resolve(mxObj);
            },
            error: (error: Error) => {
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
function getEntityNameFromObject(mxObj: any): string {
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
export function getObjectGuid(obj: ObjectItem): string {
    // Try the getGuid() method first
    if ((obj as any).getGuid && typeof (obj as any).getGuid === "function") {
        const guid = (obj as any).getGuid();
        if (guid) return guid;
    }

    // Fallback to guid property
    if ((obj as any).guid) {
        return (obj as any).guid;
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
export function reloadDataSource(dataSource: any): void {
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
export async function getEntityName(dataSource: any): Promise<string | null> {
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
        } catch (error) {
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
export function getNextSortOrder(items: ObjectItem[] | undefined, sortOrderAttribute: any): Big {
    const maxSortOrder =
        items?.reduce((max, item) => {
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
export function commitObject(obj: any, dataSource?: any, successMessage?: string): Promise<void> {
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
            error: (error: Error) => {
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
export function deleteObject(
    obj: ObjectItem,
    dataSource?: any,
    successMessage?: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }

        let guid: string;
        try {
            guid = getObjectGuid(obj);
            if (!guid || typeof guid !== "string") {
                throw new Error(`Invalid GUID: ${guid}`);
            }
        } catch (error) {
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
            error: (error: Error) => {
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
export function createObject(entityName: string, successMessage?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const mx = getMx();
        if (!mx || !mx.data) {
            reject(new Error("Mendix Client API (mx.data) not available"));
            return;
        }

        mx.data.create({
            entity: entityName,
            callback: (obj: ObjectItem) => {
                if (successMessage) {
                    console.log(successMessage);
                }
                resolve(obj);
            },
            error: (error: Error) => {
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
export async function swapSortOrders(
    item1: ObjectItem,
    item2: ObjectItem,
    orderOrAttribute: Big | any,
    order2OrDataSource?: Big | any,
    dataSource?: any,
    successMessage?: string
): Promise<void> {
    const mx = getMx();
    if (!mx || !mx.data) {
        throw new Error("Mendix Client API (mx.data) not available");
    }

    let order1: Big;
    let order2: Big;
    let resolvedDataSource = dataSource;
    let resolvedSuccessMessage = successMessage;

    // Backward compatibility: allow passing sortOrderAttribute as third argument
    if (orderOrAttribute && typeof (orderOrAttribute as any).get === "function") {
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
    } else if (order2OrDataSource) {
        // Preferred signature: explicit order1 and order2 values
        order1 = orderOrAttribute as Big;
        order2 = order2OrDataSource as Big;
    } else {
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
    console.log(
        "swapSortOrders - item1 current value:",
        mxObj1.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString()
    );
    console.log(
        "swapSortOrders - item2 current value:",
        mxObj2.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString()
    );

    // Swap the values
    console.log("swapSortOrders - Setting new values...");
    mxObj1.set(FAQ_ATTRIBUTES.SORT_ORDER, order2);
    mxObj2.set(FAQ_ATTRIBUTES.SORT_ORDER, order1);

    console.log(
        "swapSortOrders - item1 new value:",
        mxObj1.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString()
    );
    console.log(
        "swapSortOrders - item2 new value:",
        mxObj2.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString()
    );

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
                    error: (error: Error) => {
                        console.error("FAQ Accordion: Failed to commit second item:", error);
                        console.error(
                            "swapSortOrders - Error details:",
                            error.message,
                            error.stack
                        );
                        reject(error);
                    }
                });
            },
            error: (error: Error) => {
                console.error("FAQ Accordion: Failed to commit first item:", error);
                console.error("swapSortOrders - Error details:", error.message, error.stack);
                reject(error);
            }
        });
    });
}
