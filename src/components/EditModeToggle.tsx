import { ReactElement } from "react";
import * as React from "react";
import classNames from "classnames";

interface EditModeToggleProps {
    editMode: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

/**
 * Toggle button for switching between view and edit modes
 */
export function EditModeToggle(props: EditModeToggleProps): ReactElement {
    const { editMode, onToggle, disabled = false } = props;

    return (
        <button
            type="button"
            className={classNames("faq-edit-mode-toggle", {
                "faq-edit-mode-active": editMode
            })}
            onClick={onToggle}
            disabled={disabled}
            aria-label={editMode ? "Switch to view mode" : "Switch to edit mode"}
            title={editMode ? "View Mode" : "Edit Mode"}
        >
            {editMode ? (
                <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                    </svg>
                    <span>View</span>
                </>
            ) : (
                <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" />
                    </svg>
                    <span>Edit</span>
                </>
            )}
        </button>
    );
}
