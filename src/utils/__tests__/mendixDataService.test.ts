/**
 * Tests for Mendix Data Service
 */

import {
    getObjectGuid,
    getEntityName,
    reloadDataSource,
    getNextSortOrder,
    commitObject,
    deleteObject,
    createObject,
    swapSortOrders
} from "../mendixDataService";
import Big from "big.js";
import { FAQ_ATTRIBUTES } from "../../config/attributeConfig";
import { setDebugMode } from "../debugLogger";

// Enable debug mode for tests so we can verify log messages
beforeAll(() => {
    setDebugMode(true);
});

afterAll(() => {
    setDebugMode(false);
});

// Helper to set up window.mx mock
function setupWindowMx(method: "commit" | "create" | "remove") {
    ensureWindow();
    (window as any).mx = {
        data: {
            [method]: jest.fn()
        }
    };
}

function cleanupWindowMx() {
    delete (window as any).mx;
}

function ensureWindow() {
    if (!(global as any).window) {
        (global as any).window = {} as any;
    }
}

function createMockMxObject(initialValue: Big | null, entity = "MyModule.FAQ") {
    let currentValue = initialValue;
    return {
        getEntity: () => entity,
        get: (attr: string) => {
            if (attr === FAQ_ATTRIBUTES.SORT_ORDER) {
                return currentValue;
            }
            return undefined;
        },
        set: (attr: string, value: any) => {
            if (attr === FAQ_ATTRIBUTES.SORT_ORDER) {
                currentValue = value as any;
            }
        }
    } as any;
}

function mockMxDataWithObjects(objects: Record<string, any>) {
    ensureWindow();
    (global as any).window.mx = {
        data: {
            get: jest.fn(({ guid, callback }: any) => {
                const obj = objects[guid];
                callback(obj);
            }),
            commit: jest.fn(),
            create: jest.fn(),
            remove: jest.fn()
        }
    } as any;
}

describe("mendixDataService", () => {
    describe("getObjectGuid", () => {
        it("should get GUID using getGuid method when available", () => {
            const mockObj = {
                getGuid: jest.fn().mockReturnValue("test-guid-123")
            } as any;

            const guid = getObjectGuid(mockObj);

            expect(guid).toBe("test-guid-123");
            expect(mockObj.getGuid).toHaveBeenCalled();
        });

        it("should get GUID from guid property when getGuid method not available", () => {
            const mockObj = {
                guid: "test-guid-456"
            } as any;

            const guid = getObjectGuid(mockObj);

            expect(guid).toBe("test-guid-456");
        });
    });

    describe("getEntityName", () => {
        it("should get entity name from _entity property", async () => {
            const mockDataSource = {
                _entity: "MyModule.FAQ"
            };

            const entityName = await getEntityName(mockDataSource);

            expect(entityName).toBe("MyModule.FAQ");
        });

        it("should get entity name from entity property when _entity not available", async () => {
            const mockDataSource = {
                entity: "MyModule.Question"
            };

            const entityName = await getEntityName(mockDataSource);

            expect(entityName).toBe("MyModule.Question");
        });

        it("should return null when no entity name found", async () => {
            const mockDataSource = {};

            const entityName = await getEntityName(mockDataSource);

            expect(entityName).toBeNull();
        });

        it("should return null when dataSource is null", async () => {
            const entityName = await getEntityName(null as any);

            expect(entityName).toBeNull();
        });

        it("should return null when dataSource is undefined", async () => {
            const entityName = await getEntityName(undefined as any);

            expect(entityName).toBeNull();
        });
    });

    describe("reloadDataSource", () => {
        it("should call reload method when available", () => {
            const mockReload = jest.fn();
            const mockDataSource = {
                reload: mockReload
            };

            reloadDataSource(mockDataSource);

            expect(mockReload).toHaveBeenCalled();
        });

        it("should not throw when reload method not available", () => {
            const mockDataSource = {};

            expect(() => reloadDataSource(mockDataSource)).not.toThrow();
        });

        it("should not throw when dataSource is null", () => {
            expect(() => reloadDataSource(null)).not.toThrow();
        });

        it("should not throw when dataSource is undefined", () => {
            expect(() => reloadDataSource(undefined)).not.toThrow();
        });
    });

    describe("getNextSortOrder", () => {
        const mockSortOrderAttribute = {
            get: jest.fn((item) => ({
                value: item.sortOrder
            }))
        };

        it("should return max sort order + 10", () => {
            const mockItems = [
                { sortOrder: new Big(10) },
                { sortOrder: new Big(20) },
                { sortOrder: new Big(30) }
            ] as any;

            const nextOrder = getNextSortOrder(mockItems, mockSortOrderAttribute);

            expect(nextOrder.toNumber()).toBe(40);
        });

        it("should handle items with no sort order", () => {
            const mockItems = [
                { sortOrder: null },
                { sortOrder: new Big(15) },
                { sortOrder: null }
            ] as any;

            const nextOrder = getNextSortOrder(mockItems, mockSortOrderAttribute);

            expect(nextOrder.toNumber()).toBe(25);
        });

        it("should return 10 when items array is empty", () => {
            const mockItems = [] as any;

            const nextOrder = getNextSortOrder(mockItems, mockSortOrderAttribute);

            expect(nextOrder.toNumber()).toBe(10);
        });

        it("should return 10 when items is undefined", () => {
            const nextOrder = getNextSortOrder(undefined, mockSortOrderAttribute);

            expect(nextOrder.toNumber()).toBe(10);
        });
    });

    describe("commitObject", () => {
        beforeEach(() => setupWindowMx("commit"));
        afterEach(() => cleanupWindowMx());

        it("should commit object successfully", async () => {
            const mockObj = { id: "test-obj" } as any;

            ((window as any).mx.data.commit as jest.Mock).mockImplementation((options: any) => {
                options.callback();
            });

            await commitObject(mockObj);

            expect((window as any).mx.data.commit).toHaveBeenCalledWith({
                mxobj: mockObj,
                callback: expect.any(Function),
                error: expect.any(Function)
            });
        });

        it("should reload data source after commit", async () => {
            const mockObj = { id: "test-obj" } as any;
            const mockReload = jest.fn();
            const mockDataSource = { reload: mockReload };

            ((window as any).mx.data.commit as jest.Mock).mockImplementation((options: any) => {
                options.callback();
            });

            await commitObject(mockObj, mockDataSource);

            expect(mockReload).toHaveBeenCalled();
        });

        it("should log success message when provided", async () => {
            const mockObj = { id: "test-obj" } as any;
            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

            ((window as any).mx.data.commit as jest.Mock).mockImplementation((options: any) => {
                options.callback();
            });

            await commitObject(mockObj, undefined, "Success!");

            expect(consoleLogSpy).toHaveBeenCalledWith("[FAQ Accordion]", "Success!");
            consoleLogSpy.mockRestore();
        });

        it("should reject when mx.data not available", async () => {
            cleanupWindowMx();
            const mockObj = { id: "test-obj" } as any;

            await expect(commitObject(mockObj)).rejects.toThrow(
                "Mendix Client API (mx.data) not available"
            );
        });

        it("should reject and log error on commit failure", async () => {
            const mockObj = { id: "test-obj" } as any;
            const mockError = new Error("Commit failed");
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            ((window as any).mx.data.commit as jest.Mock).mockImplementation((options: any) => {
                options.error(mockError);
            });

            await expect(commitObject(mockObj)).rejects.toThrow("Commit failed");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[FAQ Accordion]",
                " Failed to commit object:",
                mockError
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe("deleteObject", () => {
        let originalWindow: any;

        beforeEach(() => {
            originalWindow = (global as any).window;
            ensureWindow();
            (global as any).window.mx = {
                data: {
                    remove: jest.fn()
                }
            } as any;
        });

        afterEach(() => {
            (global as any).window = originalWindow;
        });

        it("should delete object successfully using getGuid method", async () => {
            const mockObj = {
                getGuid: jest.fn().mockReturnValue("guid-123")
            } as any;

            ((global as any).window.mx.data.remove as jest.Mock).mockImplementation(
                (options: any) => {
                    options.callback();
                }
            );

            await deleteObject(mockObj);

            expect((global as any).window.mx.data.remove).toHaveBeenCalledWith({
                guids: ["guid-123"],
                callback: expect.any(Function),
                error: expect.any(Function)
            });
        });

        it("should delete object successfully using guid property", async () => {
            const mockObj = { guid: "guid-456" } as any;

            ((global as any).window.mx.data.remove as jest.Mock).mockImplementation(
                (options: any) => {
                    options.callback();
                }
            );

            await deleteObject(mockObj);

            expect((global as any).window.mx.data.remove).toHaveBeenCalledWith({
                guids: ["guid-456"],
                callback: expect.any(Function),
                error: expect.any(Function)
            });
        });

        it("should reload data source after deletion", async () => {
            const mockObj = { guid: "guid-789" } as any;
            const mockReload = jest.fn();
            const mockDataSource = { reload: mockReload };

            ((global as any).window.mx.data.remove as jest.Mock).mockImplementation(
                (options: any) => {
                    options.callback();
                }
            );

            await deleteObject(mockObj, mockDataSource);

            expect(mockReload).toHaveBeenCalled();
        });

        it("should log success message when provided", async () => {
            const mockObj = { guid: "guid-abc" } as any;
            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

            ((global as any).window.mx.data.remove as jest.Mock).mockImplementation(
                (options: any) => {
                    options.callback();
                }
            );

            await deleteObject(mockObj, undefined, "Deleted successfully!");

            expect(consoleLogSpy).toHaveBeenCalledWith("[FAQ Accordion]", "Deleted successfully!");
            consoleLogSpy.mockRestore();
        });

        it("should reject when mx.data not available", async () => {
            ensureWindow();
            (global as any).window.mx = null;
            const mockObj = { guid: "guid-xyz" } as any;

            await deleteObject(mockObj).catch((error) => {
                expect(error.message).toBe("Mendix Client API (mx.data) not available");
            });
        });

        it("should reject and log error on deletion failure", async () => {
            const mockObj = { guid: "guid-fail" } as any;
            const mockError = new Error("Delete failed");
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            ((global as any).window.mx.data.remove as jest.Mock).mockImplementation(
                (options: any) => {
                    options.error(mockError);
                }
            );

            await expect(deleteObject(mockObj)).rejects.toThrow("Delete failed");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[FAQ Accordion]",
                " Failed to delete object:",
                mockError
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe("createObject", () => {
        let originalWindow: any;

        beforeEach(() => {
            originalWindow = (global as any).window;
            ensureWindow();
            (global as any).window.mx = {
                data: {
                    create: jest.fn()
                }
            } as any;
        });

        afterEach(() => {
            (global as any).window = originalWindow;
        });

        it("should create object successfully", async () => {
            const mockNewObj = { id: "new-obj" } as any;

            ((global as any).window.mx.data.create as jest.Mock).mockImplementation(
                (options: any) => {
                    options.callback(mockNewObj);
                }
            );

            const result = await createObject("MyModule.FAQ");

            expect((global as any).window.mx.data.create).toHaveBeenCalledWith({
                entity: "MyModule.FAQ",
                callback: expect.any(Function),
                error: expect.any(Function)
            });
            expect(result).toBe(mockNewObj);
        });

        it("should log success message when provided", async () => {
            const mockNewObj = { id: "new-obj" } as any;
            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

            ((global as any).window.mx.data.create as jest.Mock).mockImplementation(
                (options: any) => {
                    options.callback(mockNewObj);
                }
            );

            await createObject("MyModule.FAQ", "Created new FAQ!");

            expect(consoleLogSpy).toHaveBeenCalledWith("[FAQ Accordion]", "Created new FAQ!");
            consoleLogSpy.mockRestore();
        });

        it("should reject when mx.data not available", async () => {
            ensureWindow();
            (global as any).window.mx = null;

            await createObject("MyModule.FAQ").catch((error) => {
                expect(error.message).toBe("Mendix Client API (mx.data) not available");
            });
        });

        it("should reject and log error on creation failure", async () => {
            const mockError = new Error("Create failed");
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            ((global as any).window.mx.data.create as jest.Mock).mockImplementation(
                (options: any) => {
                    options.error(mockError);
                }
            );

            await expect(createObject("MyModule.FAQ")).rejects.toThrow("Create failed");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[FAQ Accordion]",
                " Failed to create object:",
                mockError
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe("swapSortOrders", () => {
        let originalWindow: any;

        beforeEach(() => {
            originalWindow = (global as any).window;
            ensureWindow();
        });

        afterEach(() => {
            (global as any).window = originalWindow;
        });

        it("should swap sort orders and commit both items", async () => {
            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;

            const mxObjects = {
                item1: createMockMxObject(new Big(10)),
                item2: createMockMxObject(new Big(20))
            };
            mockMxDataWithObjects(mxObjects);

            const mockSortOrderAttribute = {
                get: jest.fn((item) =>
                    item === mockItem1 ? { value: new Big(10) } : { value: new Big(20) }
                )
            };

            ((global as any).window.mx.data.commit as jest.Mock).mockImplementation(
                (options: any) => options.callback()
            );

            await swapSortOrders(mockItem1, mockItem2, mockSortOrderAttribute);

            expect((global as any).window.mx.data.commit).toHaveBeenCalledTimes(2);
            expect(mxObjects.item1.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString()).toBe(
                new Big(20).toString()
            );
            expect(mxObjects.item2.get(FAQ_ATTRIBUTES.SORT_ORDER)?.toString()).toBe(
                new Big(10).toString()
            );
        });

        it("should reload data source after swap", async () => {
            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;
            const mockReload = jest.fn();
            const mockDataSource = { reload: mockReload };

            const mxObjects = {
                item1: createMockMxObject(new Big(10)),
                item2: createMockMxObject(new Big(20))
            };
            mockMxDataWithObjects(mxObjects);

            const mockSortOrderAttribute = {
                get: jest.fn((item) =>
                    item === mockItem1 ? { value: new Big(10) } : { value: new Big(20) }
                )
            };

            ((global as any).window.mx.data.commit as jest.Mock).mockImplementation(
                (options: any) => options.callback()
            );

            await swapSortOrders(mockItem1, mockItem2, mockSortOrderAttribute, mockDataSource);

            expect(mockReload).toHaveBeenCalled();
        });

        it("should log success message when provided", async () => {
            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;

            const mxObjects = {
                item1: createMockMxObject(new Big(10)),
                item2: createMockMxObject(new Big(20))
            };
            mockMxDataWithObjects(mxObjects);

            const mockSortOrderAttribute = {
                get: jest.fn((item) =>
                    item === mockItem1 ? { value: new Big(10) } : { value: new Big(20) }
                )
            };

            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

            ((global as any).window.mx.data.commit as jest.Mock).mockImplementation(
                (options: any) => options.callback()
            );

            await swapSortOrders(
                mockItem1,
                mockItem2,
                mockSortOrderAttribute,
                undefined,
                "Swapped successfully!"
            );

            expect(consoleLogSpy).toHaveBeenCalledWith("[FAQ Accordion]", "Swapped successfully!");
            consoleLogSpy.mockRestore();
        });

        it("should reject when mx.data not available", async () => {
            ensureWindow();
            (global as any).window.mx = null;

            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;
            const mockSortOrderAttribute = {
                get: jest.fn()
            };

            await swapSortOrders(mockItem1, mockItem2, mockSortOrderAttribute).catch((error) => {
                expect(error.message).toBe("Mendix Client API (mx.data) not available");
            });
        });

        it("should reject when sort order values are missing", async () => {
            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;

            mockMxDataWithObjects({});

            const mockSortOrderAttribute = {
                get: jest.fn().mockReturnValue({ value: null })
            };

            await expect(
                swapSortOrders(mockItem1, mockItem2, mockSortOrderAttribute)
            ).rejects.toThrow("Sort order values are missing");
        });

        it("should reject and log error on first commit failure", async () => {
            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;

            const mxObjects = {
                item1: createMockMxObject(new Big(10)),
                item2: createMockMxObject(new Big(20))
            };
            mockMxDataWithObjects(mxObjects);

            const mockSortOrderAttribute = {
                get: jest.fn((item) =>
                    item === mockItem1 ? { value: new Big(10) } : { value: new Big(20) }
                )
            };

            const mockError = new Error("First commit failed");
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            ((global as any).window.mx.data.commit as jest.Mock).mockImplementation(
                (options: any) => options.error(mockError)
            );

            await expect(
                swapSortOrders(mockItem1, mockItem2, mockSortOrderAttribute)
            ).rejects.toThrow("First commit failed");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[FAQ Accordion]",
                " Failed to commit first item:",
                mockError
            );
            consoleErrorSpy.mockRestore();
        });

        it("should reject and log error on second commit failure", async () => {
            const mockItem1 = { id: "item1" } as any;
            const mockItem2 = { id: "item2" } as any;

            const mxObjects = {
                item1: createMockMxObject(new Big(10)),
                item2: createMockMxObject(new Big(20))
            };
            mockMxDataWithObjects(mxObjects);

            const mockSortOrderAttribute = {
                get: jest.fn((item) =>
                    item === mockItem1 ? { value: new Big(10) } : { value: new Big(20) }
                )
            };

            const mockError = new Error("Second commit failed");
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

            let callCount = 0;
            ((global as any).window.mx.data.commit as jest.Mock).mockImplementation(
                (options: any) => {
                    callCount++;
                    if (callCount === 1) {
                        options.callback();
                    } else {
                        options.error(mockError);
                    }
                }
            );

            await expect(
                swapSortOrders(mockItem1, mockItem2, mockSortOrderAttribute)
            ).rejects.toThrow("Second commit failed");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[FAQ Accordion]",
                " Failed to commit second item:",
                mockError
            );
            consoleErrorSpy.mockRestore();
        });
    });
});
