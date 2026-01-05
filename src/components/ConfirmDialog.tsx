import { ReactElement, createElement } from "react";
import * as React from "react";
import classNames from "classnames";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

/**
 * Confirmation dialog modal for destructive actions (e.g., delete)
 */
export function ConfirmDialog(props: ConfirmDialogProps): ReactElement | null {
    const {
        isOpen,
        title,
        message,
        onConfirm,
        onCancel,
        confirmText = "Confirm",
        cancelText = "Cancel",
        isDestructive = false
    } = props;

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="faq-confirm-dialog-overlay" onClick={handleOverlayClick} role="presentation">
            <div
                className="faq-confirm-dialog"
                role="alertdialog"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-message"
            >
                <div className="faq-confirm-dialog-header">
                    {isDestructive && (
                        <svg
                            className="faq-confirm-dialog-icon-warning"
                            width="24"
                            height="24"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                        </svg>
                    )}
                    <h3 id="dialog-title" className="faq-confirm-dialog-title">
                        {title}
                    </h3>
                </div>

                <div id="dialog-message" className="faq-confirm-dialog-message">
                    {message}
                </div>

                <div className="faq-confirm-dialog-actions">
                    <button
                        type="button"
                        className={classNames("faq-confirm-dialog-btn", "faq-btn-cancel")}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={classNames("faq-confirm-dialog-btn", "faq-btn-confirm", {
                            "faq-btn-destructive": isDestructive
                        })}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
