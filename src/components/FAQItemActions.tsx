import React, { ReactElement } from "react";
import classNames from "classnames";

export interface FAQItemActionsProps {
    onEdit: () => void;
    onDelete: () => void;
}

/**
 * Action buttons for editing mode - Edit and Delete
 * Note: Move up/down has been replaced with drag-and-drop reordering
 */
export function FAQItemActions(props: FAQItemActionsProps): ReactElement {
    const { onEdit, onDelete } = props;

    return (
        <div className="faq-item-actions">
            {/* Edit Button */}
            <button
                type="button"
                className={classNames("faq-item-action-btn", "faq-action-edit")}
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}
                title="Edit FAQ"
                aria-label="Edit FAQ item"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.854 1.146a.5.5 0 0 0-.708 0L10 3.293 12.707 6l2.147-2.146a.5.5 0 0 0 0-.708l-2-2zM11.293 4L2 13.293V16h2.707L14 6.707 11.293 4z" />
                </svg>
            </button>

            {/* Delete Button */}
            <button
                type="button"
                className={classNames("faq-item-action-btn", "faq-action-delete")}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                title="Delete FAQ"
                aria-label="Delete FAQ item"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path
                        fillRule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                    />
                </svg>
            </button>
        </div>
    );
}
