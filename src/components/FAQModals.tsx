import { ReactElement } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface FAQModalsProps {
    // Delete confirmation props
    deleteConfirmIndex: number | null;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
}

/**
 * Component that renders FAQ modals (delete confirmation)
 * Note: Create and Edit forms are now rendered inline in FAQEditableList
 */
export function FAQModals({
    deleteConfirmIndex,
    onConfirmDelete,
    onCancelDelete
}: FAQModalsProps): ReactElement {
    return (
        <>
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmIndex !== null}
                title="Delete FAQ Item"
                message="Are you sure you want to delete this FAQ item? This action cannot be undone."
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </>
    );
}
