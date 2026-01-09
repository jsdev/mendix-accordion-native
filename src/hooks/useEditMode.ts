/**
 * Custom hook for managing edit mode state in FAQ Accordion
 * Centralizes all edit-related state and actions
 */

import { useState } from "react";

export interface UseEditModeReturn {
    // State
    editMode: boolean;
    editingItemIndex: number | null;
    showCreateForm: boolean;
    deleteConfirmIndex: number | null;

    // Actions
    toggleEditMode: () => void;
    startEditingItem: (index: number) => void;
    cancelEditing: () => void;
    startCreating: () => void;
    cancelCreating: () => void;
    startDeleting: (index: number) => void;
    confirmDelete: () => void;
    cancelDelete: () => void;
    finishEditing: () => void;
    finishCreating: () => void;
    finishDeleting: () => void;
}

/**
 * Hook for managing FAQ edit mode state
 * @returns Object containing edit state and actions
 */
export function useEditMode(): UseEditModeReturn {
    const [editMode, setEditMode] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

    // Toggle between edit and view mode
    const toggleEditMode = (): void => {
        setEditMode(!editMode);
        setEditingItemIndex(null);
        setShowCreateForm(false);
    };

    // Start editing a specific item
    const startEditingItem = (index: number): void => {
        setEditingItemIndex(index);
        setShowCreateForm(false);
    };

    // Cancel editing current item
    const cancelEditing = (): void => {
        setEditingItemIndex(null);
    };

    // Finish editing current item (after successful save)
    const finishEditing = (): void => {
        setEditingItemIndex(null);
    };

    // Start creating a new item
    const startCreating = (): void => {
        setShowCreateForm(true);
        setEditingItemIndex(null);
    };

    // Cancel creating new item
    const cancelCreating = (): void => {
        setShowCreateForm(false);
    };

    // Finish creating new item (after successful save)
    const finishCreating = (): void => {
        setShowCreateForm(false);
    };

    // Start delete confirmation for an item
    const startDeleting = (index: number): void => {
        setDeleteConfirmIndex(index);
    };

    // Confirm and proceed with deletion
    const confirmDelete = (): void => {
        // Return the index for caller to handle, then clear
        // Caller should call finishDeleting() after deletion succeeds
    };

    // Cancel deletion
    const cancelDelete = (): void => {
        setDeleteConfirmIndex(null);
    };

    // Finish deletion (after successful delete)
    const finishDeleting = (): void => {
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
