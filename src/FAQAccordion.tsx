import { ReactElement, createElement, useState, useEffect, useMemo } from "react";
import { FAQAccordionContainerProps, ContentFormatEnum } from "../typings/FAQAccordionProps";
import "./ui/FAQAccordion.scss";
import classNames from "classnames";
import { processContent, getContentWarnings } from "./utils/contentProcessor";
import { checkUserRole, canEdit } from "./utils/editingUtils";
import { ObjectItem } from "mendix";
import { FAQItemActions } from "./components/FAQItemActions";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EditModeToggle } from "./components/EditModeToggle";
import { EditFAQForm } from "./components/EditFAQForm";

interface FAQItem {
    summary: string;
    content: string;
    contentFormat: ContentFormatEnum;
}

/**
 * Normalizes content format value to valid format or defaults to HTML
 * @param format - Raw format value from database or configuration
 * @returns Valid ContentFormatEnum value
 */
function normalizeContentFormat(format: string | undefined | null): ContentFormatEnum {
    if (!format) {
        return "html";
    }
    
    const normalized = format.toLowerCase().trim();
    
    // Check if it's a valid format
    if (normalized === "html" || normalized === "markdown" || normalized === "text") {
        return normalized as ContentFormatEnum;
    }
    
    // Unrecognized format - default to HTML
    console.warn(`FAQ Accordion: Unrecognized content format "${format}", defaulting to HTML`);
    return "html";
}

export function FAQAccordion(props: FAQAccordionContainerProps): ReactElement {
    const {
        dataSourceType,
        faqItems,
        dataSource,
        summaryAttribute,
        contentAttribute,
        formatAttribute,
        defaultExpandAll,
        showToggleButton,
        toggleButtonText,
        animationDuration,
        allowEditing,
        editorRole,
        onSaveAction,
        onDeleteAction,
        onCreateAction,
        sortOrderAttribute
    } = props;

    // Get FAQ items from either static configuration or database
    const items = useMemo<FAQItem[]>(() => {
        if (dataSourceType === "database" && dataSource && dataSource.status === "available") {
            // Database mode: read from data source
            return dataSource.items?.map((item: ObjectItem) => {
                const summary = summaryAttribute?.get(item).value || "Question";
                const content = contentAttribute?.get(item).value || "";
                const formatValue = formatAttribute?.get(item).value;
                const format = normalizeContentFormat(formatValue);
                
                return {
                    summary,
                    content,
                    contentFormat: format
                };
            }) || [];
        } else {
            // Static mode: use configured items
            return faqItems?.map(item => ({
                summary: item.summary?.value || "Question",
                content: item.content?.value || "",
                contentFormat: normalizeContentFormat(item.contentFormat)
            })) || [];
        }
    }, [dataSourceType, dataSource, faqItems, summaryAttribute, contentAttribute, formatAttribute]);

    // State to track which items are expanded
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [allExpanded, setAllExpanded] = useState(defaultExpandAll);

    // Editing state
    const [editMode, setEditMode] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [userHasRole, setUserHasRole] = useState(false);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

    // Check if user has required role
    useEffect(() => {
        const checkRole = async () => {
            if (allowEditing && editorRole) {
                const hasRole = await checkUserRole(editorRole);
                setUserHasRole(hasRole);
            } else if (allowEditing && !editorRole) {
                // No role restriction - allow editing for all users
                setUserHasRole(true);
            } else {
                setUserHasRole(false);
            }
        };
        
        checkRole();
    }, [allowEditing, editorRole]);

    // Initialize expanded state based on defaultExpandAll
    useEffect(() => {
        if (defaultExpandAll) {
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
        }
    }, [defaultExpandAll, items]);

    // Toggle individual item
    const toggleItem = (index: number): void => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Toggle all items
    const toggleAll = (): void => {
        if (allExpanded) {
            // Collapse all
            setExpandedItems(new Set());
            setAllExpanded(false);
        } else {
            // Expand all
            const allIndices = new Set(items?.map((_, index) => index) || []);
            setExpandedItems(allIndices);
            setAllExpanded(true);
        }
    };

    // Update allExpanded state based on individual toggles
    useEffect(() => {
        if (items) {
            const allAreExpanded = items.length > 0 && expandedItems.size === items.length;
            setAllExpanded(allAreExpanded);
        }
    }, [expandedItems, items]);

    // Determine if editing is enabled
    const isEditingEnabled = canEdit(allowEditing, dataSourceType, userHasRole);

    // Placeholder handlers for CRUD operations (to be implemented in Sprint 3)
    const handleToggleEditMode = (): void => {
        setEditMode(!editMode);
        setEditingItemIndex(null);
        setShowCreateForm(false);
    };

    const handleEditItem = (index: number): void => {
        setEditingItemIndex(index);
        setShowCreateForm(false);
    };

    const handleDeleteItem = (index: number): void => {
        setDeleteConfirmIndex(index);
    };

    const handleConfirmDelete = (): void => {
        if (deleteConfirmIndex === null || !dataSource || dataSourceType !== "database") {
            setDeleteConfirmIndex(null);
            return;
        }

        const item = dataSource.items?.[deleteConfirmIndex];
        if (!item) {
            setDeleteConfirmIndex(null);
            return;
        }

        // Execute delete action
        if (onDeleteAction && onDeleteAction.canExecute) {
            onDeleteAction.execute();
        }

        setDeleteConfirmIndex(null);
    };

    const handleCancelDelete = (): void => {
        setDeleteConfirmIndex(null);
    };

    const handleMoveUp = (index: number): void => {
        // TODO: Implement in Sprint 4
        console.log("Move up:", index);
    };

    const handleMoveDown = (index: number): void => {
        // TODO: Implement in Sprint 4
        console.log("Move down:", index);
    };

    const handleSaveEdit = (summary: string, content: string, format: ContentFormatEnum): void => {
        if (editingItemIndex === null || !dataSource || dataSourceType !== "database") {
            setEditingItemIndex(null);
            return;
        }

        const item = dataSource.items?.[editingItemIndex];
        if (!item) {
            setEditingItemIndex(null);
            return;
        }

        // Update attributes
        if (summaryAttribute) {
            summaryAttribute.get(item).setValue(summary);
        }
        if (contentAttribute) {
            contentAttribute.get(item).setValue(content);
        }
        if (formatAttribute) {
            formatAttribute.get(item).setValue(format);
        }

        // Execute save action
        if (onSaveAction && onSaveAction.canExecute) {
            onSaveAction.execute();
        }

        setEditingItemIndex(null);
    };

    const handleCancelEdit = (): void => {
        setEditingItemIndex(null);
        setShowCreateForm(false);
    };

    const handleCreateNew = (): void => {
        setShowCreateForm(true);
        setEditingItemIndex(null);
    };

    const handleSaveNew = (summary: string, content: string, format: ContentFormatEnum): void => {
        if (!dataSource || dataSourceType !== "database") {
            setShowCreateForm(false);
            return;
        }

        // For creating new items, we rely on the onCreateAction microflow/nanoflow
        // to create the object and set initial values. The form data could be passed
        // as parameters if the action supports it.
        
        // Execute create action - the microflow should handle object creation
        if (onCreateAction && onCreateAction.canExecute) {
            onCreateAction.execute();
        }

        // Note: In a real implementation, you might want to store the form data
        // temporarily and have the action callback update the newly created object
        
        setShowCreateForm(false);
    };

    // Show loading state for database mode
    if (dataSourceType === "database" && dataSource && dataSource.status === "loading") {
        return (
            <div className="faq-accordion-loading">
                <p>Loading FAQ items...</p>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="faq-accordion-empty">
                <p>No FAQ items configured</p>
            </div>
        );
    }

    const getToggleButtonText = (): string => {
        if (toggleButtonText && toggleButtonText.value) {
            return toggleButtonText.value;
        }
        return allExpanded ? "Hide All" : "Show All";
    };

    return (
        <div className="faq-accordion-container">
            {(showToggleButton || isEditingEnabled) && (
                <div className="faq-accordion-header">
                    {showToggleButton && (
                        <button
                            className={classNames("faq-toggle-all-btn", {
                                "faq-toggle-all-btn--expanded": allExpanded
                            })}
                            onClick={toggleAll}
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
                                    onClick={handleCreateNew}
                                    aria-label="Create new FAQ item"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" />
                                    </svg>
                                    Create New
                                </button>
                            )}
                            <EditModeToggle
                                editMode={editMode}
                                onToggle={handleToggleEditMode}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="faq-accordion-items">
                {items.map((item, index) => {
                    const isExpanded = expandedItems.has(index);
                    const summaryValue = item.summary;
                    const contentValue = item.content;
                    const contentFormat = item.contentFormat;
                    
                    // Process content based on format and sanitize
                    const processedContent = processContent(contentValue, contentFormat);
                    
                    // Get validation warnings (only for HTML format)
                    const warnings = getContentWarnings(contentValue, contentFormat);

                    return (
                        <details
                            key={index}
                            className={classNames("faq-item", {
                                "faq-item--expanded": isExpanded
                            })}
                            open={isExpanded}
                            style={
                                {
                                    "--animation-duration": `${animationDuration || 300}ms`
                                } as React.CSSProperties
                            }
                        >
                            <summary
                                className="faq-item-summary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleItem(index);
                                }}
                                onKeyDown={(e) => {
                                    // Handle keyboard navigation
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleItem(index);
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-expanded={isExpanded}
                            >
                                <span className="faq-item-summary-text">{summaryValue}</span>
                                <div className="faq-item-summary-controls">
                                    {editMode && isEditingEnabled && (
                                        <FAQItemActions
                                            onEdit={() => handleEditItem(index)}
                                            onDelete={() => handleDeleteItem(index)}
                                            onMoveUp={() => handleMoveUp(index)}
                                            onMoveDown={() => handleMoveDown(index)}
                                            canMoveUp={index > 0}
                                            canMoveDown={index < items.length - 1}
                                        />
                                    )}
                                    <span
                                        className={classNames("faq-item-icon", {
                                            "faq-item-icon--expanded": isExpanded
                                        })}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M4 6L8 10L12 6"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </div>
                            </summary>
                            <div className="faq-item-content">
                                {warnings.length > 0 && (
                                    <div className="faq-item-warnings">
                                        {warnings.map((warning, wIndex) => (
                                            <div key={wIndex} className="faq-item-warning">
                                                ⚠️ {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    className="faq-item-content-inner"
                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                />
                            </div>
                        </details>
                    );
                })}
            </div>

            {/* Edit Form Modal */}
            {editingItemIndex !== null && items[editingItemIndex] && (
                <EditFAQForm
                    summary={items[editingItemIndex].summary}
                    content={items[editingItemIndex].content}
                    format={items[editingItemIndex].contentFormat}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    isNew={false}
                />
            )}

            {/* Create Form Modal */}
            {showCreateForm && (
                <EditFAQForm
                    summary=""
                    content=""
                    format="html"
                    onSave={handleSaveNew}
                    onCancel={handleCancelEdit}
                    isNew={true}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmIndex !== null}
                title="Delete FAQ Item"
                message="Are you sure you want to delete this FAQ item? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </div>
    );
}
