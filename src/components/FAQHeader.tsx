import { ReactElement } from "react";
import classNames from "classnames";
import { EditModeToggle } from "./EditModeToggle";

interface FAQHeaderProps {
    showToggleButton: boolean;
    allExpanded: boolean;
    toggleButtonText?: string;
    onToggleAll: () => void;
    isEditingEnabled: boolean;
    editMode: boolean;
    onToggleEditMode: () => void;
    onCreateNew: () => void;
}

/**
 * Header component with toggle all button and edit mode controls
 */
export function FAQHeader({
    showToggleButton,
    allExpanded,
    toggleButtonText,
    onToggleAll,
    isEditingEnabled,
    editMode,
    onToggleEditMode,
    onCreateNew
}: FAQHeaderProps): ReactElement | null {
    if (!showToggleButton && !isEditingEnabled) {
        return null;
    }

    const getToggleButtonText = (): string => {
        if (toggleButtonText) {
            return toggleButtonText;
        }
        return allExpanded ? "Hide All" : "Show All";
    };

    return (
        <div className="faq-accordion-header">
            {showToggleButton && (
                <button
                    className={classNames("faq-toggle-all-btn", {
                        "faq-toggle-all-btn--expanded": allExpanded
                    })}
                    onClick={onToggleAll}
                    type="button"
                >
                    {getToggleButtonText()}
                </button>
            )}
            {isEditingEnabled && (
                <div className="faq-editing-controls">
                    {editMode && (
                        <button
                            type="button"
                            className="faq-create-new-btn"
                            onClick={onCreateNew}
                            aria-label="Create new FAQ item"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" />
                            </svg>
                            Create New
                        </button>
                    )}
                    <EditModeToggle editMode={editMode} onToggle={onToggleEditMode} />
                </div>
            )}
        </div>
    );
}
