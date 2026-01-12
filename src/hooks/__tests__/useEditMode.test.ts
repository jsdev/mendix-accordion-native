/**
 * Tests for useEditMode hook
 */

import { renderHook, act } from "@testing-library/react";
import { useEditMode } from "../useEditMode";

describe("useEditMode", () => {
    describe("initial state", () => {
        it("should initialize with default values", () => {
            const { result } = renderHook(() => useEditMode());

            expect(result.current.editMode).toBe(false);
            expect(result.current.editingItemIndex).toBeNull();
            expect(result.current.showCreateForm).toBe(false);
            expect(result.current.deleteConfirmIndex).toBeNull();
        });
    });

    describe("toggleEditMode", () => {
        it("should toggle edit mode on", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.toggleEditMode();
            });

            expect(result.current.editMode).toBe(true);
        });

        it("should toggle edit mode off", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.toggleEditMode();
            });
            expect(result.current.editMode).toBe(true);

            act(() => {
                result.current.toggleEditMode();
            });
            expect(result.current.editMode).toBe(false);
        });

        it("should clear editing state when toggling", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(5);
            });
            expect(result.current.editingItemIndex).toBe(5);

            act(() => {
                result.current.toggleEditMode();
            });

            expect(result.current.editingItemIndex).toBeNull();
        });

        it("should clear create form when toggling", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startCreating();
            });
            expect(result.current.showCreateForm).toBe(true);

            act(() => {
                result.current.toggleEditMode();
            });

            expect(result.current.showCreateForm).toBe(false);
        });
    });

    describe("item editing", () => {
        it("should start editing an item", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(3);
            });

            expect(result.current.editingItemIndex).toBe(3);
        });

        it("should clear create form when starting to edit", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startCreating();
            });
            expect(result.current.showCreateForm).toBe(true);

            act(() => {
                result.current.startEditingItem(2);
            });

            expect(result.current.showCreateForm).toBe(false);
            expect(result.current.editingItemIndex).toBe(2);
        });

        it("should cancel editing", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(4);
            });
            expect(result.current.editingItemIndex).toBe(4);

            act(() => {
                result.current.cancelEditing();
            });

            expect(result.current.editingItemIndex).toBeNull();
        });

        it("should finish editing after save", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(1);
            });
            expect(result.current.editingItemIndex).toBe(1);

            act(() => {
                result.current.finishEditing();
            });

            expect(result.current.editingItemIndex).toBeNull();
        });
    });

    describe("item creation", () => {
        it("should start creating a new item", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startCreating();
            });

            expect(result.current.showCreateForm).toBe(true);
        });

        it("should clear editing when starting to create", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(7);
            });
            expect(result.current.editingItemIndex).toBe(7);

            act(() => {
                result.current.startCreating();
            });

            expect(result.current.editingItemIndex).toBeNull();
            expect(result.current.showCreateForm).toBe(true);
        });

        it("should cancel creating", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startCreating();
            });
            expect(result.current.showCreateForm).toBe(true);

            act(() => {
                result.current.cancelCreating();
            });

            expect(result.current.showCreateForm).toBe(false);
        });

        it("should finish creating after save", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startCreating();
            });
            expect(result.current.showCreateForm).toBe(true);

            act(() => {
                result.current.finishCreating();
            });

            expect(result.current.showCreateForm).toBe(false);
        });
    });

    describe("item deletion", () => {
        it("should start deleting an item", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startDeleting(6);
            });

            expect(result.current.deleteConfirmIndex).toBe(6);
        });

        it("should cancel deletion", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startDeleting(8);
            });
            expect(result.current.deleteConfirmIndex).toBe(8);

            act(() => {
                result.current.cancelDelete();
            });

            expect(result.current.deleteConfirmIndex).toBeNull();
        });

        it("should finish deletion after successful delete", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startDeleting(9);
            });
            expect(result.current.deleteConfirmIndex).toBe(9);

            act(() => {
                result.current.finishDeleting();
            });

            expect(result.current.deleteConfirmIndex).toBeNull();
        });

        it("should allow confirming delete without clearing index", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startDeleting(10);
            });
            expect(result.current.deleteConfirmIndex).toBe(10);

            act(() => {
                result.current.confirmDelete();
            });

            // Confirm doesn't clear - allows caller to use the index
            expect(result.current.deleteConfirmIndex).toBe(10);
        });
    });

    describe("complex state transitions", () => {
        it("should handle switching between edit and create", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(1);
            });
            expect(result.current.editingItemIndex).toBe(1);
            expect(result.current.showCreateForm).toBe(false);

            act(() => {
                result.current.startCreating();
            });
            expect(result.current.editingItemIndex).toBeNull();
            expect(result.current.showCreateForm).toBe(true);

            act(() => {
                result.current.startEditingItem(2);
            });
            expect(result.current.editingItemIndex).toBe(2);
            expect(result.current.showCreateForm).toBe(false);
        });

        it("should handle delete flow while editing", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.startEditingItem(5);
            });
            expect(result.current.editingItemIndex).toBe(5);

            act(() => {
                result.current.startDeleting(3);
            });
            // Delete confirmation should not affect editing state
            expect(result.current.editingItemIndex).toBe(5);
            expect(result.current.deleteConfirmIndex).toBe(3);
        });

        it("should maintain edit mode when performing operations", () => {
            const { result } = renderHook(() => useEditMode());

            act(() => {
                result.current.toggleEditMode();
            });
            expect(result.current.editMode).toBe(true);

            act(() => {
                result.current.startEditingItem(1);
                result.current.finishEditing();
            });
            // Edit mode should still be on
            expect(result.current.editMode).toBe(true);

            act(() => {
                result.current.startCreating();
                result.current.finishCreating();
            });
            expect(result.current.editMode).toBe(true);
        });
    });

    describe("return type completeness", () => {
        it("should return all expected state properties", () => {
            const { result } = renderHook(() => useEditMode());

            expect(result.current).toHaveProperty("editMode");
            expect(result.current).toHaveProperty("editingItemIndex");
            expect(result.current).toHaveProperty("showCreateForm");
            expect(result.current).toHaveProperty("deleteConfirmIndex");
        });

        it("should return all expected action functions", () => {
            const { result } = renderHook(() => useEditMode());

            expect(result.current).toHaveProperty("toggleEditMode");
            expect(result.current).toHaveProperty("startEditingItem");
            expect(result.current).toHaveProperty("cancelEditing");
            expect(result.current).toHaveProperty("startCreating");
            expect(result.current).toHaveProperty("cancelCreating");
            expect(result.current).toHaveProperty("startDeleting");
            expect(result.current).toHaveProperty("confirmDelete");
            expect(result.current).toHaveProperty("cancelDelete");
            expect(result.current).toHaveProperty("finishEditing");
            expect(result.current).toHaveProperty("finishCreating");
            expect(result.current).toHaveProperty("finishDeleting");

            // Verify they are functions
            expect(typeof result.current.toggleEditMode).toBe("function");
            expect(typeof result.current.startEditingItem).toBe("function");
            expect(typeof result.current.cancelEditing).toBe("function");
            expect(typeof result.current.startCreating).toBe("function");
            expect(typeof result.current.cancelCreating).toBe("function");
            expect(typeof result.current.startDeleting).toBe("function");
            expect(typeof result.current.confirmDelete).toBe("function");
            expect(typeof result.current.cancelDelete).toBe("function");
            expect(typeof result.current.finishEditing).toBe("function");
            expect(typeof result.current.finishCreating).toBe("function");
            expect(typeof result.current.finishDeleting).toBe("function");
        });
    });
});
